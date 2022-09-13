import express from 'express';
import { check } from './credentials.js';

const USERNAME = 'admin';
const PASSWORD = 'pikachu1';

const app = express();

app.use(express.json());

interface Credentials {
  username: string;
  password: string;
}

app.post('/check', (req, res) => {
  const body = req.body as Credentials;
  if (!body || !body.username || !body.password) {
    res.status(500).send('error');
  } else if (check(body)) {
    res.status(200).send('success');
  } else {
    res.status(401).send('unauthorized');
  }
});

app.listen(80, () => {
  console.log(`Auth server listening on port 80`);
});
