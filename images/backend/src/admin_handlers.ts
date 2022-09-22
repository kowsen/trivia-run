import { Db } from 'mongodb';
import { GameServer } from 'game-socket/dist/lib/server.js';
import { upgradeToAdmin, upsertQuestion, deleteQuestion } from 'game-socket/dist/trivia/admin_rpcs.js';
import { actions } from 'game-socket/dist/trivia/admin_state';
import { Session } from './session.js';

interface Config {
  adminPassword: string;
}

const DEFAULT_CONFIG: Config = { adminPassword: 'password' };

function checkAdmin(session: Session) {
  if (!session.isAdmin) {
    throw new Error('Must be Admin');
  }
}

export function setupAdminHandlers(server: GameServer<Session, Db>) {
  server.register(upgradeToAdmin, async (params, session, dataAdapter, dispatch) => {
    const document = await dataAdapter.collection('config').findOne<Config>();
    const adminPassword = (document ?? DEFAULT_CONFIG).adminPassword;
    const success = params.password === adminPassword;
    session.isAdmin = success;
    // Build initial state
    dispatch(other => {
      if (other === session) {
        // send initial state
      }
      return undefined;
    });
    return { success };
  });

  server.register(upsertQuestion, async (params, session, dataAdapter, dispatch) => {
    checkAdmin(session);
    await dataAdapter.collection('questions').updateOne({ id: params.id }, params, { upsert: true });
    dispatch(session => (session.isAdmin ? actions.upsertQuestion(params) : undefined));
    return { success: true };
  });

  server.register(deleteQuestion, async (params, session, dataAdapter, dispatch) => {
    checkAdmin(session);
    await dataAdapter.collection('questions').deleteOne({ id: params.id });
    dispatch(session => (session.isAdmin ? actions.deleteQuestion(params) : undefined));
    return { success: true };
  });
}
