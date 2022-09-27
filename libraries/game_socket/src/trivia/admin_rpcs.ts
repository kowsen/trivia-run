import { v4 as uuid } from 'uuid';
import { RPC } from '../lib/rpc.js';
import { arrayOf, booleanField, numberField, optional, stringField } from '../lib/validator.js';
import { AdminGuess, AdminQuestion, AdminQuestionOrder, AdminTeam } from './admin_state.js';
import { Doc, RequestDoc, StatusResponse } from './base.js';

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
  password: string;
}

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
  _deleted: optional(booleanField),
};

export const upsertQuestion = new RPC<RequestDoc<AdminQuestion>, StatusResponse>(
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
    password: stringField,
  },
  {
    success: booleanField,
  },
);

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
