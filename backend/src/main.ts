import { GameServer } from 'trivia-ws/dist/server.js';
import { RPC } from 'trivia-ws/dist/rpc.js';
import { stringField, booleanField } from 'trivia-ws/dist/validator.js';

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
