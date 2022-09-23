export interface Doc {
  _id: string;
  _modified: number;
  _deleted?: boolean;
}

export interface StatusResponse {
  success: boolean;
}
