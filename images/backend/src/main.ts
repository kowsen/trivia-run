import { GameServer } from 'game-socket/dist/lib/server.js';
import { RPC } from 'game-socket/dist/lib/rpc.js';
import { stringField, booleanField } from 'game-socket/dist/lib/validator.js';

const server = new GameServer({
  port: 80,
  createSession: socketId => ({ socketId }),
  dataAdapter: {},
});

const testRpc = new RPC('guess', { value: stringField }, { isCorrect: booleanField });

server.register(testRpc, (params, session, data, dispatch) => {
  dispatch(other => (other === session ? { type: 'guess/guess', payload: { guess: params.value } } : undefined));
  return Promise.resolve({ isCorrect: params.value === 'kyle' });
});

console.log('Backend listening on port 80');