import { Server as WebSocketServer } from "rpc-websockets";
import { WebSocket } from "ws";
import { RPC } from "./rpc";

export interface GameServerConfig<TSession, TDataAdapter> {
  port: number;
  host: string;
  createSession: () => TSession;
  dataAdapter: TDataAdapter;
}

class InvalidParamsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidParamsError";
  }
}

class InvalidSessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidSessionError";
  }
}

interface GameSocket<TSession> extends WebSocket {
  session?: TSession;
}

export class GameServer<TSession, TDataAdapter> {
  private readonly registeredMethods: string[] = [];

  private readonly server: WebSocketServer;
  private readonly sockets: Map<string, GameSocket<TSession>>;

  constructor(
    private readonly config: GameServerConfig<TSession, TDataAdapter>
  ) {
    this.server = new WebSocketServer(config);
    this.sockets = this.server.of("/").clients().clients;
  }

  public register<TParams extends object, TResult extends object>(
    rpc: RPC<TParams, TResult>,
    handler: (
      params: TParams,
      session: TSession,
      dataAdapter: TDataAdapter
    ) => Promise<TResult>
  ) {
    if (this.registeredMethods.includes(rpc.method)) {
      throw new Error(
        `Cannot register multiple handlers for method ${rpc.method}`
      );
    }
    this.registeredMethods.push(rpc.method);

    const serverHandler = async (params: unknown, socketId: string) => {
      if (!rpc.validateParams(params)) {
        throw new InvalidParamsError(
          "Params object does not match expected params for RPC"
        );
      }

      const socket = this.sockets.get(socketId);
      if (!socket) {
        throw new InvalidSessionError("Unable to find the session");
      }
      const session = this.getAndAttachSession(socket);

      return handler(params, session, this.config.dataAdapter);
    };

    this.server.register(rpc.method, serverHandler);
  }

  private getAndAttachSession(socket: GameSocket<TSession>): TSession {
    if (!socket.session) {
      socket.session = this.config.createSession();
    }
    return socket.session;
  }
}
