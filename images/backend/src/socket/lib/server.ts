import { Server, ServerOptions, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { RPC, rpcCallValidator } from './rpc.js';
import { validate } from './validator.js';

export interface GameServerConfig<TDataAdapter> {
  http: HttpServer;
  socketOptions?: Partial<ServerOptions>;
  dataAdapter: TDataAdapter;
}

export class GameServer<TDataAdapter> {
  private readonly handlers = new Map<string, (params: unknown, socket: Socket) => Promise<void>>();
  private readonly server: Server;

  constructor(private readonly config: GameServerConfig<TDataAdapter>) {
    this.server = new Server(config.http, config.socketOptions);

    this.server.on('connection', socket => {
      socket.on('rpc', async (rpcCall: unknown) => {
        if (!validate(rpcCall, rpcCallValidator)) {
          console.warn('Invalid RPC call', rpcCall);
          return;
        }

        const handler = this.handlers.get(rpcCall.method);
        if (!handler) {
          socket.emit('rpc', { id: rpcCall.id, error: 'No handler registered for method.' });
          return;
        }

        await handler(rpcCall, socket);
      });
    });
  }

  public register<TParams extends object, TResult extends object>(
    rpc: RPC<TParams, TResult>,
    handler: (params: TParams, socket: Socket, database: TDataAdapter, server: Server) => TResult | Promise<TResult>,
  ) {
    if (this.handlers.has(rpc.method)) {
      throw new Error(`Cannot register multiple handlers for method ${rpc.method}`);
    }

    const requestHandler = async (value: unknown, socket: Socket) => {
      try {
        const call = rpc.parseCall(value);
        try {
          const result = await handler(call.params, socket, this.config.dataAdapter, this.server);
          socket.emit('rpc', rpc.buildResponse(call, result));
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Unknown error';
          socket.emit('rpc', rpc.buildResponse(call, undefined, message));
        }
      } catch (e) {
        console.warn(e);
      }
    };

    this.handlers.set(rpc.method, requestHandler);
  }
}
