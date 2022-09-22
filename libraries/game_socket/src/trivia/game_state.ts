import { BaseBonusQuestionInfo, BaseGuess, BaseQuestion, BaseTeam } from './base.js';

export interface GameQuestion extends BaseQuestion {
  guesses: BaseGuess[];
}

export interface GameBonusQuestionInfo extends BaseBonusQuestionInfo {
  isComplete: boolean;
}

export interface GameTeam extends BaseTeam {
  isYou?: boolean;
}
