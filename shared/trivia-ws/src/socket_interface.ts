import {
  GuessMessage,
  guessMessageValidator,
  GuessResponse,
  guessResponseValidator,
  guessTimeoutResponse,
} from "./messages/guess.js";
import {
  Guess2Message,
  guess2MessageValidator,
  Guess2Response,
  guess2ResponseValidator,
  guess2TimeoutResponse,
} from "./messages/guess2.js";
import { stringValidator, Validator } from "./validator.js";

const MESSAGE_TYPES = ["guess", "guess2"] as const;

interface Base {
  guess: unknown;
  guess2: unknown;
}

export interface Messages extends Base {
  guess: GuessMessage;
  guess2: Guess2Message;
}

export interface Responses extends Base {
  guess: GuessResponse;
  guess2: Guess2Response;
}

export const messageValidators = {
  guess: guessMessageValidator,
  guess2: guess2MessageValidator,
} as const;

export const responseValidators = {
  guess: guessResponseValidator,
  guess2: guess2ResponseValidator,
} as const;

export const timeoutResponses: Responses = {
  guess: guessTimeoutResponse,
  guess2: guess2TimeoutResponse,
} as const;

export interface Payload {
  kind: keyof Messages;
  token: string;
  message: unknown;
}

export const payloadValidator = new Validator<Payload>({
  kind: (value) => {
    const stringValue = stringValidator(value);
    switch (stringValue) {
      case "guess":
      case "guess2":
        return stringValue;
      default:
        throw new Error(`${value} not a valid message type.`);
    }
  },
  token: stringValidator,
  message: (value) => value,
});
