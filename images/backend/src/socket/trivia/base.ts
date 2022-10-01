export interface Doc {
  _id: string;
  _modified: number;
  _deleted?: boolean | null;
}

export type RequestDoc<TDoc extends Doc> = Omit<TDoc, keyof Doc> & Partial<Doc>;

export interface StatusResponse {
  success: boolean;
}

export interface BaseQuestion extends Doc {
  title?: string;
  text?: string;
  image?: string;
  frame?: string;
  hideAnswer?: boolean;
  unlockTime?: number;
  bonusWinner?: string;
}

export function generateToken(length: number): string {
  const TOKEN_SEED = 'BCDFGHJKLMNPRSTWXZ';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += TOKEN_SEED[Math.floor(Math.random() * TOKEN_SEED.length)];
  }
  return token;
}
