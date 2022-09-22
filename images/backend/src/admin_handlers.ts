import { Db } from 'mongodb';
import { GameServer } from 'game-socket/dist/lib/server.js';
import { upgradeToAdmin, upsertQuestion, deleteQuestion } from 'game-socket/dist/trivia/admin_rpcs.js';
import {
  actions,
  InitialAdminState,
  AdminQuestion,
  AdminTeam,
  AdminGuess,
  QuestionOrder,
} from 'game-socket/dist/trivia/admin_state.js';
import { BaseBonusQuestionInfo } from 'game-socket/dist/trivia/base.js';

interface Config {
  adminPassword: string;
}

const DEFAULT_CONFIG: Config = { adminPassword: 'password' };

export function setupAdminHandlers(server: GameServer<Db>) {
  server.register(upgradeToAdmin, async (params, socket, database, server) => {
    const document = await database.collection('config').findOne<Config>();
    const adminPassword = (document ?? DEFAULT_CONFIG).adminPassword;
    const success = params.password === adminPassword;
    if (success) {
      socket.join('admin');
      const initialState: InitialAdminState = {
        questions: await database.collection('questions').find<AdminQuestion>({}).toArray(),
        bonusQuestionInfo: await database.collection('bonusQuestionInfo').find<BaseBonusQuestionInfo>({}).toArray(),
        teams: await database.collection('teams').find<AdminTeam>({}).toArray(),
        guesses: await database.collection('guesses').find<AdminGuess>({}).toArray(),
        order: (await database.collection('order').findOne<QuestionOrder>()) ?? {
          mainQuestions: [],
          bonusQuestions: [],
        },
      };
      socket.emit('action', initialState);
    }
    return { success };
  });

  const registerProtected: typeof server.register = (rpc, handler) => {
    const protectedHandler: typeof handler = (params, socket, database, server) => {
      if (!socket.rooms.has('admin')) {
        throw new Error('Not authenticated');
      }
      return handler(params, socket, database, server);
    };
    server.register(rpc, protectedHandler);
  };

  registerProtected(upsertQuestion, async (params, socket, database, server) => {
    await database.collection('questions').updateOne({ id: params.id }, params, { upsert: true });
    server.to('admin').emit('action', actions.upsertQuestion(params));
    return { success: true };
  });

  registerProtected(deleteQuestion, async (params, socket, dataAdapter, server) => {
    await dataAdapter.collection('questions').deleteOne({ id: params.id });
    server.to('admin').emit('action', actions.deleteQuestion(params));
    return { success: true };
  });
}
