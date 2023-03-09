import { v4 as uuid } from 'uuid';
import { RPC } from '../lib/rpc.js';
import { arrayOf, booleanField, maybeNull, numberField, optional, stringField } from '../lib/validator.js';
import { AdminGuess, AdminQuestion, AdminQuestionOrder, AdminTeam } from './admin_state.js';
import { Doc, RequestDoc, StatusResponse } from './base.js';

export interface UpsertQuestionResponse extends StatusResponse {
  questionId: string;
}

export interface AdminTokenRequest {
  password: string;
}

export interface AdminTokenResponse extends StatusResponse {
  token: string;
}

export interface AdminUpgradeRequest {
  token: string;
}

export interface PasswordChange {
  adminPassword: string;
}

export interface ForceRefresh {
}

export interface SetGameState {
  state: GameState
}

export type GameState = 'notActive' | 'active' | 'completed';

export interface FileUpload {
  base64: string;
}

export interface FileUploadResponse extends StatusResponse {
  path: string;
}

export const getAdminToken = new RPC<AdminTokenRequest, AdminTokenResponse>(
  'getAdminToken',
  {
    password: stringField,
  },
  {
    token: stringField,
    success: booleanField,
  },
);

export const upgradeToAdmin = new RPC<AdminUpgradeRequest, StatusResponse>(
  'upgradeToAdmin',
  {
    token: stringField,
  },
  {
    success: booleanField,
  },
);

const requestDocValidator = {
  _id: optional(stringField),
  _modified: optional(numberField),
  _deleted: optional(maybeNull(booleanField)),
};

export const upsertQuestion = new RPC<RequestDoc<AdminQuestion>, UpsertQuestionResponse>(
  'upsertQuestion',
  {
    ...requestDocValidator,
    title: optional(stringField),
    answer: stringField,
    text: optional(stringField),
    image: optional(stringField),
    frame: optional(stringField),
    hideAnswer: optional(booleanField),
    unlockTime: optional(numberField),
    bonusWinner: optional(stringField),
  },
  {
    questionId: stringField,
    success: booleanField,
  },
);

export const upsertTeam = new RPC<RequestDoc<AdminTeam>, StatusResponse>(
  'upsertTeam',
  {
    ...requestDocValidator,
    name: stringField,
    token: stringField,
    mainQuestionId: stringField,
    lastAnswerTime: optional(numberField),
    completedBonusQuestions: arrayOf(stringField),
    isSecretTeam: optional(booleanField),
  },
  {
    success: booleanField,
  },
);

export const upsertGuess = new RPC<RequestDoc<AdminGuess>, StatusResponse>(
  'upsertGuess',
  {
    ...requestDocValidator,
    text: stringField,
    teamId: stringField,
    questionId: stringField,
    isCorrect: booleanField,
  },
  {
    success: booleanField,
  },
);

export const setQuestionOrder = new RPC<RequestDoc<AdminQuestionOrder>, StatusResponse>(
  'setQuestionOrder',
  {
    ...requestDocValidator,
    main: arrayOf(stringField),
    bonus: arrayOf(stringField),
  },
  {
    success: booleanField,
  },
);

export const setAdminPassword = new RPC<PasswordChange, StatusResponse>(
  'setAdminPassword',
  {
    adminPassword: stringField,
  },
  {
    success: booleanField,
  },
);

export const startForceRefresh = new RPC<ForceRefresh, StatusResponse>(
  'forceRefresh',
  {
  },
  {
    success: booleanField,
  },
);

export const setGameState = new RPC<SetGameState, StatusResponse>(
  'setGameState',
  {
    state: gameStateField,
  },
  {
    success: booleanField,
  },
);


export function gameStateField(value: unknown): GameState {
  if (typeof value !== 'string') {
    throw new Error(`${value} should be a string.`);
  }
  var stringValue = value as String;
  if (stringValue === 'notActive' || stringValue === 'active' || stringValue === 'completed')
    return stringValue as GameState;

  throw new Error(`${stringValue} should be of type GameState.`);
}

export const uploadFile = new RPC<FileUpload, FileUploadResponse>(
  'uploadFile',
  {
    base64: stringField,
  },
  {
    success: booleanField,
    path: stringField,
  },
);
