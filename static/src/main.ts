import express from 'express';
import fileUpload from 'express-fileupload';
import path from 'path';
import AdmZip from 'adm-zip';
import { v4 as uuidv4 } from 'uuid';
import { html } from './upload-ui.js';
import { authMiddleware } from 'trivia-shared-auth/dist/index.js';

const FILES_PATH = '/var/lib/app/files';

const app = express();

app.use(fileUpload());

app.use('/files', express.static(FILES_PATH));

app.get('/', authMiddleware, async (req, res) => {
  res.send(html);
});

app.post('/add', authMiddleware, (req, res) => {
  if (!req.files || !req.files.upload) {
    res.status(400).send('No file was uploaded.');
    return;
  }

  if (req.files.upload instanceof Array) {
    res.status(400).send('Only supports single file upload.');
    return;
  }

  const file = req.files.upload;
  const fileId = uuidv4();

  if (file.mimetype === 'application/zip') {
    const zip = new AdmZip(file.data);
    zip.extractAllTo(path.join(FILES_PATH, fileId));
    res.send({ status: 'success', path: fileId });
  } else {
    const extension = path.parse(file.name).ext;
    const fileName = `${fileId}${extension}`;
    const filePath = path.join(FILES_PATH, fileName);
    file.mv(filePath, err => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.send({ status: 'success', path: fileName });
      }
    });
  }
});

app.listen(80, () => {
  console.log(`Storage server listening on port 80`);
});
