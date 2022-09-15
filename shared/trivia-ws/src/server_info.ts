import { guessHandler } from "./handlers/guess";
import { guess2Handler } from "./handlers/guess2";
import { Messages, Responses } from "./socket_interface";

export interface ConnectionInfo {
  teamId?: string;
  isAdmin?: boolean;
}

export interface ServerInfo {
  connection: ConnectionInfo;
  // Stuff to connect to DB goes here
}

export type ServerHandlerMap = {
  [Property in keyof Messages]: (
    message: Messages[Property],
    server: ServerInfo
  ) => Promise<Responses[Property]>;
};

export const serverHandlers: ServerHandlerMap = {
  guess: guessHandler,
  guess2: guess2Handler,
};
