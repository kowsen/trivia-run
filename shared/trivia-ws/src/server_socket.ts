import { Server } from "socket.io";
import { ConnectionInfo, serverHandlers, ServerInfo } from "./server_info.js";
import {
  Messages,
  messageValidators,
  Payload,
  payloadValidator,
  Responses,
} from "./socket_interface.js";

console.log("AHOY 1");

export class ServerSocket {
  private readonly connections = new Map<string, ConnectionInfo>();

  constructor(private readonly server: Server) {
    console.log("AHOY 2");
    server.on("connection", (socket) => {
      this.connections.set(socket.id, {});
      console.log("CONNECTED", socket.id);

      socket.on("game_req", async (payload: unknown) => {
        console.log("MESSAGE", payload);
        if (payloadValidator.validate(payload)) {
          if (messageValidators[payload.kind].validate(payload.message)) {
            const message = await serverHandlers[payload.kind](
              payload.message as any,
              { connection: this.connections.get(socket.id) ?? {} }
            );
            const response: Payload = {
              kind: payload.kind,
              token: payload.token,
              message,
            };
            socket.emit("game_resp", response);
          }
        }
      });

      socket.on("disconnect", () => {
        this.connections.delete(socket.id);
      });
    });
  }
}
