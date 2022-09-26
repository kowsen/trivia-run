import { GameServer } from 'game-socket/dist/lib/server.js';
import { Db } from 'mongodb';
import { updateGameState } from 'game-socket/dist/trivia/game_state.js';
import { upgradeToGame, guess, getRanking, createTeam, getInvite } from 'game-socket/dist/trivia/game_rpcs.js';
import {
  ADMIN_ROOM,
  buildDoc,
  guessesCollection,
  questionsCollection,
  teamsCollection,
  updateQuestion,
} from './admin_handlers';
import {
  AdminQuestion,
  AdminTeam,
  AdminGuess,
  updateAdminState,
  AdminStateUpdate,
} from 'game-socket/dist/trivia/admin_state.js';

const BASE_FILTER = { _deleted: { $ne: true } };

export const GAME_ROOM = 'GAME';

export function getTeamRoom(teamId: string): string {
  return `TEAM_${teamId}`;
}

export function setupGameHandlers(server: GameServer<Db>) {
  server.register(upgradeToGame, async (params, socket, db, server) => {
    const team = await teamsCollection(db).findOne({ token: params.token, ...BASE_FILTER });
    if (!team) {
      throw new Error(`Failed to find a team with token: ${params.token}`);
    }
    socket.join(GAME_ROOM);
    socket.join(getTeamRoom(team._id));
    socket.emit(
      'action',
      updateGameState({
        questions: await questionsCollection(db)
          .find({ $or: [{ _id: team.mainQuestionId }, { bonusIndex: { $exists: true } }] })
          .toArray(),
        teams: await teamsCollection(db).find({ _id: team._id }).toArray(),
        guesses: await guessesCollection(db).find({ teamId: team._id }, { limit: 5 }).toArray(),
      }),
    );
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

    const updatedTeams: AdminTeam[] = [];

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
        updatedTeams.push(newTeam);
      } else {
        if (!question.bonusIndex) {
          throw new Error(`Question has no bonus index: ${params.questionId}`);
        }

        const newTeam = {
          ...team,
          completedBonusQuestions: [...team.completedBonusQuestions, question._id],
          ...buildDoc(team),
        };
        await teamsCollection(db).replaceOne({ _id: params.teamId }, newTeam);
        updatedTeams.push(newTeam);
      }
    }

    if (!question.firstCompletedBy) {
      const newQuestion = { ...question, firstCompletedBy: team.name, ...buildDoc(question) };
      await updateQuestion(newQuestion, db, server);
    }

    const guess: AdminGuess = {
      ...buildDoc({}),
      teamId: team._id,
      questionId: params.questionId,
      text: params.text,
      isCorrect,
    };
    await guessesCollection(db).insertOne(guess);

    const patch = { teams: updatedTeams, guesses: [guess] };

    server.to(ADMIN_ROOM).emit('action', updateAdminState(patch));
    server.to(getTeamRoom(team._id)).emit('action', updateGameState(patch));

    return { success: true };
  });

  // getRanking

  // getInvite

  // createTeam
}
