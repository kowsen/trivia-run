import { MongoClient, Db } from 'mongodb';
import { GameServer } from 'game-socket/dist/lib/server.js';
import { Session } from './session.js';
import { setupAdminHandlers } from './admin_handlers.js';

async function main() {
  const client = new MongoClient('mongodb://mongo:27017');

  await client.connect();

  const db = client.db('trivia');

  const server = new GameServer<Session, Db>({
    port: 80,
    createSession: socketId => ({ socketId, isAdmin: false }),
    dataAdapter: db,
  });

  setupAdminHandlers(server);

  console.log('Backend listening on port 80');
}

main();
