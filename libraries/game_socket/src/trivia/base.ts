export interface Doc {
  _id: string;
  _modified: number;
  _deleted?: boolean;
}

export type RequestDoc<TDoc extends Doc> = Omit<TDoc, keyof Doc> & Partial<Doc>;

export interface StatusResponse {
  success: boolean;
}
