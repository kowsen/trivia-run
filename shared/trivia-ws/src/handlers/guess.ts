import { GuessMessage, GuessResponse } from "src/messages/guess.js";
import { ServerInfo } from "src/server_info.js";

export const guessHandler = async (
  guess: GuessMessage,
  server: ServerInfo
): Promise<GuessResponse> => {
  if (guess.text === "kyle") {
    return { isCorrect: true };
  } else {
    return { isCorrect: false };
  }
};
