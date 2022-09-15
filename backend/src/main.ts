import { Server } from 'socket.io';
import { ServerSocket } from 'trivia-ws/dist/server_socket';

const server = new Server();

// Move handlers out here and pass them in.
new ServerSocket(server);

server.listen(80);
console.log('Backend listening on port 80');
