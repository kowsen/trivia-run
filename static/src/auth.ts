import basicAuth from 'express-basic-auth';
import fetch from 'node-fetch';

interface Credentials {
  username: string;
  password: string;
}

export const authMiddleware = basicAuth({
  authorizer: async (username, password, cb) => {
    const credentials: Credentials = { username, password };
    try {
      const response = await fetch('http://auth/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      await response.text();
      if (response.status !== 200) {
        throw new Error('Authentication failed');
      }
      cb(undefined, true);
    } catch (e) {
      cb(undefined, false);
    }
  },
  authorizeAsync: true,
  challenge: true,
});
