import { MongoClient, Db } from 'mongodb';
import { GameServer } from 'game-socket/dist/lib/server.js';
import { setupAdminHandlers, tokensCollection } from './admin_handlers.js';
import { setupGameHandlers } from './game_handlers.js';

async function main() {
  const client = new MongoClient('mongodb://mongo:27017');

  await client.connect();

  const db = client.db('trivia');

  await tokensCollection(db).createIndex({ _modified: 1 }, { expireAfterSeconds: 60 * 24 });

  const server = new GameServer<Db>({
    port: 80,
    dataAdapter: db,
    socketOptions: {
      cors: {
        origin: 'http://localhost:8083',
        methods: ['GET', 'POST'],
      },
    },
  });

  setupAdminHandlers(server);
  setupGameHandlers(server);

  console.log('Backend listening on port 80');
}

main();
