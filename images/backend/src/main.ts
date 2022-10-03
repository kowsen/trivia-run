import { MongoClient, Db } from 'mongodb';
import { GameServer } from './socket/lib/server.js';
import { setupAdminHandlers, tokensCollection } from './admin_handlers.js';
import { setupGameHandlers } from './game_handlers.js';
import http from 'http';

async function main() {
  const httpServer = http.createServer();

  const client = new MongoClient('mongodb://mongo:27017');

  await client.connect();

  const db = client.db('trivia');

  await tokensCollection(db).createIndex({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

  const server = new GameServer<Db>({
    http: httpServer,
    dataAdapter: db,
    socketOptions: {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    },
  });

  setupAdminHandlers(server);
  setupGameHandlers(server);

  httpServer.listen(80, () => {
    console.log('Backend listening on port 80');
  });
}

main();
