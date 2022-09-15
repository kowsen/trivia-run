import { GuessMessage, GuessResponse } from "src/messages/guess";
import { ServerInfo } from "src/server_info";

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
