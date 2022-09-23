import { Doc } from './base.js';

export interface GameQuestion extends Doc {
  title: string;
  text?: string;
  image?: string;
  frame?: string;
  hideAnswer?: boolean;
}

export interface GameBonusInfo extends Doc {
  unlockTime: number;
  firstCompletedBy?: string;
}

export interface GameTeam extends Doc {
  name: string;
  completedBonusQuestions: string[];
  mainQuestionIndex: number;
  isSecretTeam?: boolean;
}

export interface GameGuess extends Doc {
  questionId: string;
  text: string;
  isCorrect: boolean;
}
