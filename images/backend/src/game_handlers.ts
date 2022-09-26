import { GameServer } from 'game-socket/dist/lib/server.js';
import { Db } from 'mongodb';
import { BroadcastOperator, Server, Socket } from 'socket.io';
import { updateGameState } from 'game-socket/dist/trivia/game_state.js';
import {
  upgradeToGame,
  guess,
  getRanking,
  createTeam,
  getInvite,
  GameRankingTeam,
} from 'game-socket/dist/trivia/game_rpcs.js';
import { ADMIN_ROOM, buildDoc, guessesCollection, questionsCollection, teamsCollection } from './admin_handlers.js';
import {
  AdminQuestion,
  AdminTeam,
  AdminGuess,
  updateAdminState,
  AdminStateUpdate,
} from 'game-socket/dist/trivia/admin_state.js';
import { generateToken } from 'game-socket/dist/trivia/base.js';

const BASE_FILTER = { _deleted: { $ne: true } };

export const GAME_ROOM = 'GAME';

export function getTeamRoom(teamId: string): string {
  return `TEAM_${teamId}`;
}

export interface GameInvite {
  teamId: string;
  inviteCode: string;
}

export const invitesCollection = (db: Db) => db.collection<GameInvite>('invites');

interface SocketOrChannel {
  emit(ev: string, args: object): boolean;
}

export async function sendInitialData(team: AdminTeam, db: Db, broadcast: SocketOrChannel) {
  const questions = await questionsCollection(db)
    .find({ $or: [{ _id: team.mainQuestionId }, { bonusIndex: { $exists: true } }] })
    .toArray();
  const guesses = (
    await Promise.all(
      questions.map(question =>
        guessesCollection(db)
          .find({ teamId: team._id, questionId: question._id }, { limit: 5 })
          .sort('_modified', -1)
          .toArray(),
      ),
    )
  ).flat();
  broadcast.emit(
    'action',
    updateGameState({
      questions,
      teams: await teamsCollection(db).find({ _id: team._id }).toArray(),
      guesses,
    }),
  );
}

export function setupGameHandlers(server: GameServer<Db>) {
  server.register(upgradeToGame, async (params, socket, db, server) => {
    const team = await teamsCollection(db).findOne({ token: params.token, ...BASE_FILTER });
    if (!team) {
      throw new Error(`Failed to find a team with token: ${params.token}`);
    }
    socket.join(GAME_ROOM);
    socket.join(getTeamRoom(team._id));
    await sendInitialData(team, db, socket);
    return { teamId: team._id };
  });

  server.register(guess, async (params, socket, db, server) => {
    const team = await teamsCollection(db).findOne({ _id: params.teamId, ...BASE_FILTER });
    if (!team) {
      throw new Error(`Failed to find a team with id: ${params.teamId}`);
    }

    const isMainQuestionGuess = params.questionId === team.mainQuestionId;

    const question = isMainQuestionGuess
      ? await questionsCollection(db).findOne({ _id: params.questionId, ...BASE_FILTER })
      : await questionsCollection(db).findOne({
          $and: [{ _id: params.questionId, ...BASE_FILTER }, { bonusIndex: { $exists: true } }],
        });

    if (!question) {
      throw new Error(`Failed to find a question with id: ${params.questionId}`);
    }

    const isCorrect = !!params.text.match(question.answer);

    if (isCorrect) {
      if (isMainQuestionGuess) {
        if (!question.mainIndex) {
          throw new Error(`Main question has no index: ${params.questionId}`);
        }

        const nextQuestion = await questionsCollection(db).findOne({ mainIndex: question.mainIndex + 1 });

        if (!nextQuestion) {
          throw new Error(`Failed to find a next question with index: ${question.mainIndex + 1}`);
        }

        const newTeam = { ...team, mainQuestionId: nextQuestion._id, ...buildDoc(team) };
        await teamsCollection(db).replaceOne({ _id: params.teamId }, newTeam);
        server.to(ADMIN_ROOM).emit('action', updateAdminState({ teams: [newTeam] }));
        server
          .to(getTeamRoom(team._id))
          .emit('action', updateGameState({ teams: [newTeam], questions: [nextQuestion] }));
      } else {
        if (!question.bonusIndex) {
          throw new Error(`Question has no bonus index: ${params.questionId}`);
        }

        if (!question.bonusWinner) {
          const newQuestion = { ...question, bonusWinner: team.name, ...buildDoc(question) };
          await questionsCollection(db).replaceOne({ _id: params.questionId }, newQuestion);
          const patch = { questions: [newQuestion] };
          server.to(ADMIN_ROOM).emit('action', updateAdminState(patch));
          server.to(GAME_ROOM).emit('action', updateGameState(patch));
        }

        const newTeam = {
          ...team,
          completedBonusQuestions: [...team.completedBonusQuestions, question._id],
          ...buildDoc(team),
        };
        await teamsCollection(db).replaceOne({ _id: params.teamId }, newTeam);
        server.to(ADMIN_ROOM).emit('action', updateAdminState({ teams: [newTeam] }));
        server.to(getTeamRoom(team._id)).emit('action', updateGameState({ teams: [newTeam] }));
      }
    }

    const guess: AdminGuess = {
      ...buildDoc({}),
      teamId: team._id,
      questionId: params.questionId,
      text: params.text,
      isCorrect,
    };
    await guessesCollection(db).insertOne(guess);

    server.to(ADMIN_ROOM).emit('action', updateAdminState({ guesses: [guess] }));
    server.to(getTeamRoom(team._id)).emit('action', updateGameState({ guesses: [guess] }));

    return { success: true };
  });

  server.register(getRanking, async (params, socket, db, server) => {
    const orderMap: { [id: string]: number } = {};
    await questionsCollection(db)
      .find({ mainIndex: { $exists: true } })
      .forEach(question => {
        if (question.mainIndex) {
          orderMap[question._id] = question.mainIndex;
        }
      });

    const teams = await teamsCollection(db).find({}).toArray();
    teams.sort((a, b) => {
      if (a.mainQuestionId === b.mainQuestionId) {
        return a._modified - b._modified;
      }
      return orderMap[b.mainQuestionId] - orderMap[a.mainQuestionId];
    });

    const isYouSecret = teams.find(team => team._id === params.teamId)?.isSecretTeam;

    return {
      ranking: teams
        .filter(team => isYouSecret || !team.isSecretTeam)
        .map(team => {
          const rankingTeam: GameRankingTeam = { name: team.name };
          if (team._id === params.teamId) {
            rankingTeam.isYou = true;
          }
          if (team.isSecretTeam) {
            rankingTeam.isSecretTeam = true;
          }
          return rankingTeam;
        }),
    };
  });

  server.register(createTeam, async (params, socket, db, server) => {
    const teamName = params.name.substring(16);
    if (await teamsCollection(db).findOne({ name: teamName })) {
      return { failureReason: 'Team Name already exists.' };
    }

    const firstQuestion = await questionsCollection(db).findOne({ mainIndex: 0 });
    if (!firstQuestion) {
      return { failureReason: 'Internal error, try again.' };
    }

    const team: AdminTeam = {
      name: teamName,
      token: generateToken(6),
      completedBonusQuestions: [],
      mainQuestionId: firstQuestion._id,
      ...buildDoc({}),
    };

    await teamsCollection(db).insertOne(team);
    server.to(ADMIN_ROOM).emit('action', updateAdminState({ teams: [team] }));

    return { teamToken: team.token };
  });
}
