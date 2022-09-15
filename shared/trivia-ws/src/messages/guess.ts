import { booleanValidator, stringValidator, Validator } from "../validator.js";

export interface GuessMessage {
  text: string;
}

export const guessMessageValidator = new Validator<GuessMessage>({
  text: stringValidator,
});

export interface GuessResponse {
  isCorrect: boolean;
}

export const guessResponseValidator = new Validator<GuessResponse>({
  isCorrect: booleanValidator,
});

export const guessTimeoutResponse: GuessResponse = {
  isCorrect: false,
};
