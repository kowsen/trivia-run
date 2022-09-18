interface Game {
  question: string;
  title: string;
  guesses: string[];
}

export interface StateObjects {
  game: Game;
}

export const initialStateObjects = {
  game: { question: "", title: "", guesses: [] },
};
