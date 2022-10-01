import { MongoClient, Db } from 'mongodb';
import { GameServer } from './socket/lib/server.js';
import { setupAdminHandlers, tokensCollection } from './admin_handlers.js';
import { setupGameHandlers } from './game_handlers.js';
import express, { Express } from 'express';
import http from 'http';
import cors from 'cors';
import process from 'process';
import fs from 'fs';
import https from 'https';

function getServer(app: Express) {
  if (process.env.HTTPS) {
    const options = {
      key: fs.readFileSync('/opt/app/.deps/keys/fullchain.pem'),
      cert: fs.readFileSync('/opt/app/.deps/keys/privkey.pem'),
    };
    return https.createServer(options, app);
  } else {
    return http.createServer(app);
  }
}

async function main() {
  const app = express();
  app.use(cors());
  app.use('/static', express.static('files'));

  const httpServer = getServer(app);

  const client = new MongoClient('mongodb://mongo:27017');

  await client.connect();

  const db = client.db('trivia');

  await tokensCollection(db).createIndex({ _modified: 1 }, { expireAfterSeconds: 60 * 24 });

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
