import { Server as WebSocketServer } from "rpc-websockets";
import { WebSocket } from "ws";
import { BaseAction } from "redux-actions";
import { RPC } from "./rpc";

// 15 minutes
const SESSION_CLEANUP_INTERVAL = 1000 * 60 * 15;

export interface GameServerConfig<TSession, TDataAdapter> {
  port: number;
  host: string;
  createSession: (socketId: string) => TSession;
  dataAdapter: TDataAdapter;
}

class InvalidParamsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidParamsError";
  }
}

export class GameServer<TSession, TDataAdapter> {
  private readonly registeredMethods: string[] = [];
  private readonly sessions = new Map<string, TSession>();

  private readonly server: WebSocketServer;
  private readonly sockets: Map<string, WebSocket>;

  constructor(
    private readonly config: GameServerConfig<TSession, TDataAdapter>
  ) {
    this.server = new WebSocketServer(config);
    this.server.event("action");
    this.sockets = this.server.of("/").clients().clients;
    this.startSessionCleanupInterval();
  }

  public register<TParams extends object, TResult extends object>(
    rpc: RPC<TParams, TResult>,
    handler: (
      params: TParams,
      session: TSession,
      dataAdapter: TDataAdapter,
      dispatch: (
        buildAction: (session: TSession) => BaseAction | undefined
      ) => void
    ) => Promise<TResult>
  ) {
    if (this.registeredMethods.includes(rpc.method)) {
      throw new Error(
        `Cannot register multiple handlers for method ${rpc.method}`
      );
    }
    this.registeredMethods.push(rpc.method);

    const dispatch = (
      buildAction: (session: TSession) => BaseAction | undefined
    ): void => {
      for (const [id, socket] of this.sockets.entries()) {
        const action = buildAction(this.getSession(id));
        if (action) {
          socket.emit(
            JSON.stringify({
              notification: "action",
              params: action,
            })
          );
        }
      }
    };

    const serverHandler = async (params: unknown, socketId: string) => {
      if (!rpc.validateParams(params)) {
        throw new InvalidParamsError(
          "Params object does not match expected params for RPC"
        );
      }

      return handler(
        params,
        this.getSession(socketId),
        this.config.dataAdapter,
        dispatch
      );
    };

    this.server.register(rpc.method, serverHandler);
  }

  private getSession(socketId: string): TSession {
    let session = this.sessions.get(socketId);
    if (!session) {
      session = this.config.createSession(socketId);
      this.sessions.set(socketId, session);
    }
    return session;
  }

  private startSessionCleanupInterval() {
    let orphanSessionIds: string[] = [];

    setInterval(() => {
      const newOrphanSessionIds: string[] = [];

      for (const sessionId of this.sessions.keys()) {
        if (!this.sockets.has(sessionId)) {
          if (orphanSessionIds.includes(sessionId)) {
            this.sessions.delete(sessionId);
          } else {
            newOrphanSessionIds.push(sessionId);
          }
        }
      }

      orphanSessionIds = newOrphanSessionIds;
    }, SESSION_CLEANUP_INTERVAL);
  }
}
