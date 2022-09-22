export interface BaseQuestion {
  id: string;
  title: string;
  text?: string;
  image?: string;
  frame?: string;
  hideAnswer?: boolean;
}

export interface BaseBonusQuestionInfo {
  questionId: string;
  unlockTime: number;
  firstCompletedBy?: string;
}

export interface BaseTeam {
  name: string;
  isSecretTeam?: boolean;
}

export interface BaseGuess {
  text: string;
  isCorrect: boolean;
}

export interface StatusResponse {
  success: boolean;
}
