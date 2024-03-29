import { Db } from 'mongodb';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
import { GameServer } from './socket/lib/server.js';
import { Doc, generateToken } from './socket/trivia/base.js';
import unzipper from 'unzipper';
import {
  getAdminToken,
  upgradeToAdmin,
  upsertQuestion,
  upsertTeam,
  upsertGuess,
  setQuestionOrder,
  setAdminPassword,
  uploadFile,
  GameState,
  setGameState,
  startForceRefresh,
} from './socket/trivia/admin_rpcs.js';
import {
  AdminQuestion,
  AdminTeam,
  AdminGuess,
  updateAdminState,
  AdminQuestionOrder,
  AdminGameSettings,
} from './socket/trivia/admin_state.js';
import { checkAndFixTeam, GAME_ROOM, getTeamRoom, sendInitialData } from './game_handlers.js';
import { Server } from 'socket.io';
import { updateGameState } from './socket/trivia/game_state.js';

export const ADMIN_ROOM = 'ADMIN';

const FILES_LOCATION = '/opt/files';

interface Config {
  _id: string;
  adminPassword: string;
}

const DEFAULT_CONFIG: Config = { _id: 'SERVER_CONFIG', adminPassword: 'password' };
const DEFAULT_GAME_SETTINGS = { _id: 'MAIN', state: 'notActive', refreshToken: "A" } as AdminGameSettings;

interface Token {
  _id: string;
  createdAt: Date;
}

export function buildDoc(params: Partial<Doc>): Doc {
  return {
    _id: params._id ?? uuid(),
    _modified: Date.now(),
    _deleted: params._deleted,
  };
}

const DEFAULT_ORDER: AdminQuestionOrder = { ...buildDoc({}), _id: 'QUESTION_ORDER', main: [], bonus: [] };

export const tokensCollection = (db: Db) => db.collection<Token>('tokens');

export const questionsCollection = (db: Db) => db.collection<AdminQuestion>('questions');

export const teamsCollection = (db: Db) => db.collection<AdminTeam>('teams');

export const guessesCollection = (db: Db) => db.collection<AdminGuess>('guesses');

export const gameSettingsCollection = (db: Db) => db.collection<AdminGameSettings>('gameSettings');

const configCollection = (db: Db) => db.collection<Config>('config');

const CONFIG_FILTER = { _id: DEFAULT_CONFIG._id };

const GAME_SETTINGS_FILTER = { _id: DEFAULT_GAME_SETTINGS._id };

const getConfig = async (db: Db) => (await configCollection(db).findOne(CONFIG_FILTER)) ?? DEFAULT_CONFIG;

const orderCollection = (db: Db) => db.collection<AdminQuestionOrder>('order');
const ORDER_FILTER = { _id: DEFAULT_ORDER._id };
export const getOrder = async (db: Db) => (await orderCollection(db).findOne(ORDER_FILTER)) ?? DEFAULT_ORDER;

async function refreshAllTeams(db: Db, server: Server) {
  for (const team of await teamsCollection(db).find({}).toArray()) {
    await checkAndFixTeam(team, db, server);
    await sendInitialData(team, db, server.to(getTeamRoom(team._id)));
  }
}

export function setupAdminHandlers(server: GameServer<Db>) {
  server.register(getAdminToken, async (params, socket, db, server) => {
    const config = await getConfig(db);
    const success = params.password === config.adminPassword;
    let token = '';
    if (success) {
      const tokenDoc = { _id: uuid(), createdAt: new Date() };
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
          gameSettings: await gameSettingsCollection(db).find({}).toArray(),
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
    return { success: true, questionId: question._id };
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

  registerProtected(startForceRefresh, async (params, socket, db, server) => {
    const curentGameSettings = await gameSettingsCollection(db).findOne(GAME_SETTINGS_FILTER);
    const newSettings: AdminGameSettings = {
      ...(curentGameSettings ?? DEFAULT_GAME_SETTINGS),
      refreshToken: generateToken(5),
      _modified: Date.now(),
    };
    
    await gameSettingsCollection(db).replaceOne(GAME_SETTINGS_FILTER, newSettings, { upsert: true });
    
    server.to(GAME_ROOM).emit('action', updateGameState({ gameSettings: [newSettings] }));
    server.to(ADMIN_ROOM).emit('action', updateGameState({ gameSettings: [newSettings] }));

    return { success: true };
  });

  registerProtected(setGameState, async (params, socket, db, server) => {
    const curentGameSettings = await gameSettingsCollection(db).findOne(GAME_SETTINGS_FILTER);
    const newSettings: AdminGameSettings = {
      ...(curentGameSettings ?? DEFAULT_GAME_SETTINGS),
      state: params.state,
      _modified: Date.now(),
    };
    
    await gameSettingsCollection(db).replaceOne(GAME_SETTINGS_FILTER, newSettings, { upsert: true });
    server.to(GAME_ROOM).emit('action', updateGameState({ gameSettings: [newSettings] }));
    server.to(ADMIN_ROOM).emit('action', updateGameState({ gameSettings: [newSettings] }));
    return { success: true };
  });

  registerProtected(uploadFile, async (params, socket, db, server) => {
    const [header, data] = params.base64.split(';base64,');
    const extension = header.slice(header.indexOf('/') + 1);
    const fileId = uuid();
    if (extension === 'zip') {
      const buf = Buffer.from(data, 'base64');
      const zip = await unzipper.Open.buffer(buf);
      await zip.extract({
        path: `${FILES_LOCATION}/${fileId}`,
      });
      return { success: true, path: fileId };
    } else {
      const filePath = `${fileId}.${extension}`;
      await fs.promises.writeFile(`${FILES_LOCATION}/${filePath}`, data, { encoding: 'base64' });
      return { success: true, path: filePath };
    }
  });
}
