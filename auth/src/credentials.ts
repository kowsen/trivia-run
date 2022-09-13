import { Credentials } from 'trivia-shared-auth/dist/index.js';

const USERNAME = 'admin';
const PASSWORD = 'pikachu1';

export function check(credentials: Credentials) {
  return credentials.username === USERNAME && credentials.password === PASSWORD;
}
