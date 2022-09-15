import { Server } from 'socket.io';
import { ServerSocket } from './server_socket';

const server = new Server({
  cors: {
    origin: 'http://localhost:8083',
    methods: ['GET', 'POST'],
  },
});

// Move handlers out here and pass them in.
new ServerSocket(server);

server.listen(80);
console.log('Backend listening on port 80');
