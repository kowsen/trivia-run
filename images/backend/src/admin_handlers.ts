import { Db } from 'mongodb';
import { v4 as uuid } from 'uuid';
import { GameServer } from 'game-socket/dist/lib/server.js';
import { Doc } from 'game-socket/dist/trivia/base.js';
import {
  getAdminToken,
  upgradeToAdmin,
  upsertQuestion,
  upsertTeam,
  upsertGuess,
  setQuestionOrder,
  setAdminPassword,
  uploadFile,
} from 'game-socket/dist/trivia/admin_rpcs.js';
import {
  AdminQuestion,
  AdminTeam,
  AdminGuess,
  updateAdminState,
  AdminQuestionOrder,
} from 'game-socket/dist/trivia/admin_state.js';
import { updateGameState } from 'game-socket/dist/trivia/game_state.js';
import { GAME_ROOM, getTeamRoom, sendInitialData } from './game_handlers';
import { Server } from 'socket.io';

export const ADMIN_ROOM = 'ADMIN';

interface Config {
  _id: string;
  adminPassword: string;
}

const DEFAULT_CONFIG: Config = { _id: 'SERVER_CONFIG', adminPassword: 'password' };

export function buildDoc(params: Partial<Doc>): Doc {
  return {
    _id: params._id ?? uuid(),
    _modified: Date.now(),
    _deleted: params._deleted,
  };
}

const DEFAULT_ORDER: AdminQuestionOrder = { ...buildDoc({}), _id: 'QUESTION_ORDER', main: [], bonus: [] };

export const tokensCollection = (db: Db) => db.collection<Doc>('tokens');

export const questionsCollection = (db: Db) => db.collection<AdminQuestion>('questions');

export const teamsCollection = (db: Db) => db.collection<AdminTeam>('teams');

export const guessesCollection = (db: Db) => db.collection<AdminGuess>('guesses');

const configCollection = (db: Db) => db.collection<Config>('config');
const CONFIG_FILTER = { _id: DEFAULT_CONFIG._id };
const getConfig = async (db: Db) => (await configCollection(db).findOne(CONFIG_FILTER)) ?? DEFAULT_CONFIG;

const orderCollection = (db: Db) => db.collection<AdminQuestionOrder>('order');
const ORDER_FILTER = { _id: DEFAULT_ORDER._id };
export const getOrder = async (db: Db) => (await orderCollection(db).findOne(ORDER_FILTER)) ?? DEFAULT_ORDER;

async function refreshAllTeams(db: Db, server: Server) {
  for (const team of await teamsCollection(db).find({}).toArray()) {
    await sendInitialData(team, db, server.to(getTeamRoom(team._id)));
  }
}

export function setupAdminHandlers(server: GameServer<Db>) {
  server.register(getAdminToken, async (params, socket, db, server) => {
    const config = await getConfig(db);
    const success = params.password === config.adminPassword;
    let token = '';
    if (success) {
      const tokenDoc = buildDoc({});
      await tokensCollection(db).insertOne(tokenDoc);
      token = tokenDoc._id;
    }
    return { success, token };
  });

  server.register(upgradeToAdmin, async (params, socket, db, server) => {
    const config = await getConfig(db);
    const success = await tokensCollection(db).findOne({ _id: params.token });
    if (success) {
      socket.join(ADMIN_ROOM);
      socket.emit(
        'action',
        updateAdminState({
          questions: await questionsCollection(db).find({}).toArray(),
          teams: await teamsCollection(db).find({}).toArray(),
          guesses: await guessesCollection(db).find({}).toArray(),
          order: await getOrder(db),
        }),
      );
    }
    return { success: !!success };
  });

  const registerProtected: typeof server.register = (rpc, handler) => {
    const protectedHandler: typeof handler = (params, socket, database, server) => {
      if (!socket.rooms.has(ADMIN_ROOM)) {
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
    server.to(ADMIN_ROOM).emit('action', updateAdminState({ questions: [question] }));
    await refreshAllTeams(db, server);
    return { success: true };
  });

  registerProtected(upsertTeam, async (params, socket, db, server) => {
    const team: AdminTeam = {
      ...params,
      ...buildDoc(params),
    };
    await teamsCollection(db).replaceOne({ _id: team._id }, team, { upsert: true });
    server.to(ADMIN_ROOM).emit('action', updateAdminState({ teams: [team] }));
    await refreshAllTeams(db, server);
    return { success: true };
  });

  registerProtected(upsertGuess, async (params, socket, db, server) => {
    const guess: AdminGuess = {
      ...params,
      ...buildDoc(params),
    };
    await guessesCollection(db).replaceOne({ _id: guess._id }, guess, { upsert: true });
    server.to(ADMIN_ROOM).emit('action', updateAdminState({ guesses: [guess] }));
    await refreshAllTeams(db, server);
    return { success: true };
  });

  registerProtected(setQuestionOrder, async (params, socket, db, server) => {
    const order: AdminQuestionOrder = {
      ...params,
      ...buildDoc(params),
      _id: DEFAULT_ORDER._id,
    };
    await orderCollection(db).replaceOne(ORDER_FILTER, order, { upsert: true });
    server.to(ADMIN_ROOM).emit('action', updateAdminState({ order }));
    await refreshAllTeams(db, server);
    return { success: true };
  });

  registerProtected(setAdminPassword, async (params, socket, db, server) => {
    const currentConfig = await configCollection(db).findOne(CONFIG_FILTER);
    const newConfig: Config = {
      ...(currentConfig ?? DEFAULT_CONFIG),
      ...params,
    };
    await configCollection(db).replaceOne(CONFIG_FILTER, newConfig, { upsert: true });
    await tokensCollection(db).deleteMany({});
    return { success: true };
  });

  registerProtected(uploadFile, async (params, socket, db, server) => {
    console.log('RECEIVED FILE OF LENGTH: ', params.base64.length);
    return { success: true, path: 'test_path' };
  });
}
