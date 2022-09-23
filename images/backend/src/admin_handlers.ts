import { Db } from 'mongodb';
import { v4 as uuid } from 'uuid';
import { GameServer } from 'game-socket/dist/lib/server.js';
import { Doc } from 'game-socket/dist/trivia/base.js';
import {
  upgradeToAdmin,
  upsertQuestion,
  upsertBonusInfo,
  upsertTeam,
  upsertGuess,
  patchOrder,
  setAdminPassword,
  uploadFile,
  AdminRequestDoc,
} from 'game-socket/dist/trivia/admin_rpcs.js';
import {
  AdminQuestion,
  AdminBonusInfo,
  AdminTeam,
  AdminGuess,
  AdminQuestionOrder,
  updateAdminState,
} from 'game-socket/dist/trivia/admin_state.js';

interface Config {
  _id: string;
  adminPassword: string;
}

const DEFAULT_CONFIG: Config = { _id: 'SERVER_CONFIG', adminPassword: 'password' };

const DEFAULT_ORDER: AdminQuestionOrder = {
  _id: 'QUESTION_ORDER',
  _modified: -1,
  mainQuestions: [],
  bonusQuestions: [],
};

function buildDoc(params: AdminRequestDoc<Doc>): Doc {
  return {
    _id: params._id ?? uuid(),
    _modified: Date.now(),
    _deleted: params._deleted,
  };
}

const questionsCollection = (db: Db) => db.collection<AdminQuestion>('questions');

const bonusInfoCollection = (db: Db) => db.collection<AdminBonusInfo>('bonusInfo');

const teamsCollection = (db: Db) => db.collection<AdminTeam>('teams');

const guessesCollection = (db: Db) => db.collection<AdminGuess>('guesses');

const orderCollection = (db: Db) => db.collection<AdminQuestionOrder>('order');
const ORDER_FILTER = { _id: DEFAULT_ORDER._id };

const configCollection = (db: Db) => db.collection<Config>('config');
const CONFIG_FILTER = { _id: DEFAULT_CONFIG._id };

export function setupAdminHandlers(server: GameServer<Db>) {
  server.register(upgradeToAdmin, async (params, socket, db, server) => {
    const config = (await configCollection(db).findOne(CONFIG_FILTER)) ?? DEFAULT_CONFIG;
    const success = params.password === config.adminPassword;
    if (success) {
      socket.join('admin');
      socket.emit(
        'action',
        updateAdminState({
          questions: await questionsCollection(db).find({}).toArray(),
          bonusInfo: await bonusInfoCollection(db).find({}).toArray(),
          teams: await teamsCollection(db).find({}).toArray(),
          guesses: await guessesCollection(db).find({}).toArray(),
          order: (await orderCollection(db).findOne(ORDER_FILTER)) ?? undefined,
        }),
      );
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

  registerProtected(upsertQuestion, async (params, socket, db, server) => {
    const question: AdminQuestion = {
      ...params,
      ...buildDoc(params),
    };
    await questionsCollection(db).replaceOne({ _id: question._id }, question, { upsert: true });
    server.to('admin').emit('action', updateAdminState({ questions: [question] }));
    return { success: true };
  });

  registerProtected(upsertBonusInfo, async (params, socket, db, server) => {
    const bonusInfo: AdminBonusInfo = {
      ...params,
      ...buildDoc(params),
    };
    await bonusInfoCollection(db).replaceOne({ _id: bonusInfo._id }, bonusInfo, { upsert: true });
    server.to('admin').emit('action', updateAdminState({ bonusInfo: [bonusInfo] }));
    return { success: true };
  });

  registerProtected(upsertTeam, async (params, socket, db, server) => {
    const team: AdminTeam = {
      ...params,
      ...buildDoc(params),
    };
    await teamsCollection(db).replaceOne({ _id: team._id }, team, { upsert: true });
    server.to('admin').emit('action', updateAdminState({ teams: [team] }));
    return { success: true };
  });

  registerProtected(upsertGuess, async (params, socket, db, server) => {
    const guess: AdminGuess = {
      ...params,
      ...buildDoc(params),
    };
    await guessesCollection(db).replaceOne({ _id: guess._id }, guess, { upsert: true });
    server.to('admin').emit('action', updateAdminState({ guesses: [guess] }));
    return { success: true };
  });

  registerProtected(patchOrder, async (params, socket, db, server) => {
    const currentOrder = await orderCollection(db).findOne(ORDER_FILTER);
    const newOrder: AdminQuestionOrder = {
      ...(currentOrder ?? DEFAULT_ORDER),
      ...params,
      _modified: Date.now(),
    };
    await orderCollection(db).replaceOne(ORDER_FILTER, newOrder, { upsert: true });
    server.to('admin').emit('action', updateAdminState({ order: newOrder }));
    return { success: true };
  });

  registerProtected(setAdminPassword, async (params, socket, db, server) => {
    const currentConfig = await configCollection(db).findOne(CONFIG_FILTER);
    const newConfig: Config = {
      ...(currentConfig ?? DEFAULT_CONFIG),
      ...params,
    };
    await configCollection(db).replaceOne(CONFIG_FILTER, newConfig, { upsert: true });
    return { success: true };
  });

  registerProtected(uploadFile, async (params, socket, db, server) => {
    console.log('RECEIVED FILE OF LENGTH: ', params.base64.length);
    return { success: true, path: 'test_path' };
  });
}
