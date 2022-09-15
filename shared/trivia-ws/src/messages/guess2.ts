import { booleanValidator, stringValidator, Validator } from "../validator.js";

export interface Guess2Message {
  text2: string;
}

export const guess2MessageValidator = new Validator<Guess2Message>({
  text2: stringValidator,
});

export interface Guess2Response {
  isCorrect2: boolean;
}

export const guess2ResponseValidator = new Validator<Guess2Response>({
  isCorrect2: booleanValidator,
});

export const guess2TimeoutResponse: Guess2Response = {
  isCorrect2: false,
};
