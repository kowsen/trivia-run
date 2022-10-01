import { GameServer } from './socket/lib/server.js';
import { Db } from 'mongodb';
import { BroadcastOperator, Server, Socket } from 'socket.io';
import { updateGameState, addOrderToQuestion } from './socket/trivia/game_state.js';
import { upgradeToGame, guess, getRanking, createTeam, getInvite, GameRankingTeam } from './socket/trivia/game_rpcs.js';
import {
  ADMIN_ROOM,
  buildDoc,
  getOrder,
  guessesCollection,
  questionsCollection,
  teamsCollection,
} from './admin_handlers.js';
import {
  AdminQuestion,
  AdminTeam,
  AdminGuess,
  updateAdminState,
  AdminStateUpdate,
  checkGuess,
} from './socket/trivia/admin_state.js';
import { generateToken } from './socket/trivia/base.js';

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

export async function checkAndFixTeam(team: AdminTeam, db: Db, server: Server): Promise<AdminTeam> {
  const order = await getOrder(db);
  if (order.main.indexOf(team.mainQuestionId) !== -1) {
    return team;
  }

  const newTeam = { ...team, mainQuestionId: order.main[0], _modified: Date.now() };
  await teamsCollection(db).replaceOne({ _id: team._id }, team, { upsert: true });
  const firstQuestion = await questionsCollection(db).findOne({ _id: order.main[0] });
  server.to(ADMIN_ROOM).emit('action', updateAdminState({ teams: [newTeam] }));
  server
    .to(getTeamRoom(team._id))
    .emit('action', updateGameState({ teams: [newTeam], questions: [addOrderToQuestion(firstQuestion!, order)] }));

  return newTeam;
}

export async function sendInitialData(team: AdminTeam, db: Db, broadcast: SocketOrChannel) {
  const order = await getOrder(db);
  const questions = (
    await questionsCollection(db)
      .find({ $or: [{ _id: team.mainQuestionId }, { bonusIndex: { $exists: true } }] })
      .toArray()
  ).map(question => addOrderToQuestion(question, order));
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
    await checkAndFixTeam(team, db, server);
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

    const text = params.text.slice(0, 32);

    const isCorrect = checkGuess(text, question.answer);

    if (isCorrect) {
      const order = await getOrder(db);

      if (isMainQuestionGuess) {
        const currentIndex = order.main.indexOf(question._id);

        if (currentIndex === -1) {
          throw new Error(`Main question has no index: ${params.questionId}`);
        }

        const nextQuestionId = order.main[currentIndex + 1];
        if (!nextQuestionId) {
          throw new Error(`Failed to find a next question with index: ${currentIndex + 1}`);
        }

        const nextQuestion = await questionsCollection(db).findOne({ _id: nextQuestionId });
        if (!nextQuestion) {
          throw new Error(`Failed to find a next question with index: ${currentIndex + 1}`);
        }

        const newTeam = { ...team, mainQuestionId: nextQuestionId, lastAnswerTime: Date.now(), ...buildDoc(team) };
        await teamsCollection(db).replaceOne({ _id: params.teamId }, newTeam);
        server.to(ADMIN_ROOM).emit('action', updateAdminState({ teams: [newTeam] }));
        server
          .to(getTeamRoom(team._id))
          .emit('action', updateGameState({ teams: [newTeam], questions: [addOrderToQuestion(nextQuestion, order)] }));
      } else {
        if (!order.bonus.includes(question._id)) {
          throw new Error(`Question has no bonus index: ${params.questionId}`);
        }

        if (!question.bonusWinner) {
          const newQuestion = { ...question, bonusWinner: team.name, ...buildDoc(question) };
          await questionsCollection(db).replaceOne({ _id: params.questionId }, newQuestion);
          server.to(ADMIN_ROOM).emit('action', updateAdminState({ questions: [newQuestion] }));
          server.to(GAME_ROOM).emit('action', updateGameState({ questions: [addOrderToQuestion(newQuestion, order)] }));
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
      text,
      isCorrect,
    };
    await guessesCollection(db).insertOne(guess);

    server.to(ADMIN_ROOM).emit('action', updateAdminState({ guesses: [guess] }));
    server.to(getTeamRoom(team._id)).emit('action', updateGameState({ guesses: [guess] }));

    return { success: true };
  });

  server.register(getRanking, async (params, socket, db, server) => {
    const order = await getOrder(db);

    const teams = await teamsCollection(db).find({}).toArray();
    teams.sort((a, b) => {
      if (a.mainQuestionId === b.mainQuestionId) {
        return (a.lastAnswerTime ?? 0) - (b.lastAnswerTime ?? 0);
      }
      return (order.main.indexOf(b.mainQuestionId) ?? -1) - (order.main.indexOf(a.mainQuestionId) ?? -1);
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
    const teamName = params.name.slice(0, 16);
    if (await teamsCollection(db).findOne({ name: teamName })) {
      return { failureReason: 'Team Name already exists.' };
    }

    const firstQuestionId = (await getOrder(db)).main[0];
    if (!firstQuestionId) {
      return { failureReason: 'Internal error, try again.' };
    }

    const team: AdminTeam = {
      name: teamName,
      token: generateToken(6),
      completedBonusQuestions: [],
      mainQuestionId: firstQuestionId,
      ...buildDoc({}),
    };

    await teamsCollection(db).insertOne(team);
    server.to(ADMIN_ROOM).emit('action', updateAdminState({ teams: [team] }));

    return { teamToken: team.token };
  });
}
