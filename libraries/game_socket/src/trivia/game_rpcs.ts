import { RPC } from '../lib/rpc';
import { stringField, booleanField, numberField, arrayOf, validate, optional } from '../lib/validator';
import { StatusResponse } from './base';

export interface GameRankingTeam {
  name: string;
  isYou?: boolean;
  isSecretTeam?: boolean;
}

export interface GameUpgradeRequest {
  token: string;
}

export interface GameUpgradeResponse {
  teamId: string;
}

export interface GuessRequest {
  teamId: string;
  questionId: string;
  text: string;
}

export interface RankingRequest {
  teamId: string;
  page: number;
}

export interface RankingResponse {
  ranking: GameRankingTeam[];
}

export interface GetInviteRequest {
  teamId: string;
}

export interface GetInviteResponse {
  inviteCode: string;
}

export interface CreateTeamRequest {
  inviteCode: string;
  name: string;
}

export interface CreateTeamResponse extends StatusResponse {
  teamToken: string;
}

export const upgradeToAdmin = new RPC<GameUpgradeRequest, GameUpgradeResponse>(
  'upgradeToGame',
  {
    token: stringField,
  },
  {
    teamId: stringField,
  },
);

export const guess = new RPC<GuessRequest, StatusResponse>(
  'guess',
  {
    teamId: stringField,
    questionId: stringField,
    text: stringField,
  },
  {
    success: booleanField,
  },
);

export const getRanking = new RPC<RankingRequest, RankingResponse>(
  'getRanking',
  {
    teamId: stringField,
    page: numberField,
  },
  {
    ranking: arrayOf((value: unknown) => {
      if (
        !validate(value, {
          name: stringField,
          isYou: optional(booleanField),
          isSecretTeam: optional(booleanField),
        })
      ) {
        throw new Error('Unable to parse rankings');
      }
      return value;
    }),
  },
);

export const createTeam = new RPC<CreateTeamRequest, CreateTeamResponse>(
  'createTeam',
  {
    inviteCode: stringField,
    name: stringField,
  },
  {
    success: booleanField,
    teamToken: stringField,
  },
);

export const getInvite = new RPC<GetInviteRequest, GetInviteResponse>(
  'getInvite',
  {
    teamId: stringField,
  },
  {
    inviteCode: stringField,
  },
);
