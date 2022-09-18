import { Guess2Message, Guess2Response } from "src/messages/guess2.js";
import { ServerInfo } from "src/server_info.js";

export const guess2Handler = async (
  guess: Guess2Message,
  server: ServerInfo
): Promise<Guess2Response> => {
  if (guess.text2 === "kyle") {
    return { isCorrect2: true };
  } else {
    return { isCorrect2: false };
  }
};