export interface Doc {
  _id: string;
  _modified: number;
  _deleted?: boolean;
}

export type RequestDoc<TDoc extends Doc> = Omit<TDoc, keyof Doc> & Partial<Doc>;

export interface StatusResponse {
  success: boolean;
}

export function generateToken(length: number): string {
  const TOKEN_SEED = 'BCDFGHJKLMNPRSTWXZ';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += TOKEN_SEED[Math.floor(Math.random() * TOKEN_SEED.length)];
  }
  return token;
}
