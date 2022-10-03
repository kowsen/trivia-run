import { MongoClient, Db } from 'mongodb';
import { GameServer } from './socket/lib/server.js';
import { setupAdminHandlers, tokensCollection } from './admin_handlers.js';
import { setupGameHandlers } from './game_handlers.js';
import http from 'http';
import process from 'process';
import fs from 'fs';
import https from 'https';

function getServer() {
  if (process.env.HTTPS) {
    const privateKey = fs.readFileSync('/opt/app/.deps/keys/privkey.pem', 'utf8');
    const certificate = fs.readFileSync('/opt/app/.deps/keys/cert.pem', 'utf8');
    const ca = fs.readFileSync('/opt/app/.deps/keys/chain.pem', 'utf8');
    return https.createServer({
      key: privateKey,
      cert: certificate,
      ca: ca,
    });
  } else {
    return http.createServer();
  }
}

async function main() {
  const httpServer = getServer();

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
