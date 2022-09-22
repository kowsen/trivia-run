import { Server, Socket } from 'socket.io';
import { RPC } from './rpc.js';

export interface GameServerConfig<TDataAdapter> {
  port: number;
  dataAdapter: TDataAdapter;
}

export class GameServer<TDataAdapter> {
  private readonly handlers = new Map<string, (params: unknown, socket: Socket) => Promise<void>>();
  private readonly server: Server;

  constructor(private readonly config: GameServerConfig<TDataAdapter>) {
    this.server = new Server();

    this.server.on('connection', socket => {
      socket.on('rpc', async (rpcCall: unknown) => {});
    });

    this.server.listen(config.port);
  }

  public register<TParams extends object, TResult extends object>(
    rpc: RPC<TParams, TResult>,
    handler: (params: TParams, socket: Socket, database: TDataAdapter, server: Server) => TResult | Promise<TResult>,
  ) {
    if (this.handlers.has(rpc.method)) {
      throw new Error(`Cannot register multiple handlers for method ${rpc.method}`);
    }

    const requestHandler = async (params: unknown, socket: Socket) => {
      try {
        const call = rpc.parseCall(params);
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
