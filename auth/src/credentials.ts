const USERNAME = 'admin';
const PASSWORD = 'pikachu1';

export interface Credentials {
  username: string;
  password: string;
}

export function check(credentials: Credentials) {
  return credentials.username === USERNAME && credentials.password === PASSWORD;
}
