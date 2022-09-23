import { AdminBonusInfo, AdminGuess, AdminQuestion, AdminTeam } from './admin_state.js';
import { Doc } from './base.js';

type OmitExtended<T, TChild extends T> = T & Record<keyof Omit<TChild, keyof T>, undefined>;

export interface GameQuestion extends Doc {
  title: string;
  text?: string;
  image?: string;
  frame?: string;
  hideAnswer?: boolean;
}

export function stripGameQuestion(question: AdminQuestion): OmitExtended<GameQuestion, AdminQuestion> {
  return {
    ...question,
    answer: undefined,
  };
}

export interface GameBonusInfo extends Doc {
  unlockTime: number;
  firstCompletedBy?: string;
}

export function stripGameBonusInfo(bonusInfo: AdminBonusInfo): OmitExtended<GameBonusInfo, AdminBonusInfo> {
  return bonusInfo;
}

export interface GameTeam extends Doc {
  name: string;
  completedBonusQuestions: string[];
  mainQuestionIndex: number;
  isSecretTeam?: boolean;
}

export function stripGameTeam(team: AdminTeam): OmitExtended<GameTeam, AdminTeam> {
  return team;
}

export interface GameGuess extends Doc {
  questionId: string;
  text: string;
  isCorrect: boolean;
}

export function stripGameGuess(guess: AdminGuess): OmitExtended<GameGuess, AdminGuess> {
  return {
    ...guess,
    teamId: undefined,
  };
}
