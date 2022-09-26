import { v4 as uuid } from 'uuid';
import { RPC } from '../lib/rpc.js';
import { arrayOf, booleanField, numberField, optional, stringField } from '../lib/validator.js';
import { AdminGuess, AdminQuestion, AdminTeam } from './admin_state.js';
import { Doc, RequestDoc, StatusResponse } from './base.js';

export interface AdminUpgradeRequest {
  password: string;
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

export const upgradeToAdmin = new RPC<AdminUpgradeRequest, StatusResponse>(
  'upgradeToAdmin',
  {
    password: stringField,
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
    title: stringField,
    answer: stringField,
    text: optional(stringField),
    image: optional(stringField),
    frame: optional(stringField),
    hideAnswer: optional(booleanField),
    unlockTime: optional(numberField),
    mainIndex: optional(numberField),
    bonusIndex: optional(numberField),
    firstCompletedBy: optional(stringField),
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
