import { RPC } from '../lib/rpc.js';
import { arrayOf, booleanField, numberField, optional, stringField } from '../lib/validator.js';
import { AdminGuess, AdminQuestion, AdminTeam, QuestionOrder } from './admin_state.js';
import { BaseBonusQuestionInfo, StatusResponse } from './base.js';

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

export const upsertQuestion = new RPC<AdminQuestion, StatusResponse>(
  'upsertQuestion',
  {
    id: stringField,
    title: stringField,
    answer: stringField,
    text: optional(stringField),
    image: optional(stringField),
    frame: optional(stringField),
    hideAnswer: optional(booleanField),
  },
  {
    success: booleanField,
  },
);

export const deleteQuestion = new RPC<Pick<AdminQuestion, 'id'>, StatusResponse>(
  'deleteQuestion',
  {
    id: stringField,
  },
  {
    success: booleanField,
  },
);

export const upsertBonusQuestionInfo = new RPC<BaseBonusQuestionInfo, StatusResponse>(
  'upsertBonusQuestionInfo',
  {
    questionId: stringField,
    unlockTime: numberField,
    firstCompletedBy: optional(stringField),
  },
  {
    success: booleanField,
  },
);

export const deleteBonusQuestionInfo = new RPC<Pick<BaseBonusQuestionInfo, 'questionId'>, StatusResponse>(
  'deleteBonusQuestionInfo',
  {
    questionId: stringField,
  },
  {
    success: booleanField,
  },
);

export const upsertTeam = new RPC<AdminTeam, StatusResponse>(
  'upsertTeam',
  {
    id: stringField,
    name: stringField,
    mainQuestionIndex: numberField,
    completedBonusQuestions: arrayOf(stringField),
    isSecretTeam: optional(booleanField),
  },
  {
    success: booleanField,
  },
);

export const deleteTeam = new RPC<Pick<AdminTeam, 'id'>, StatusResponse>(
  'deleteTeam',
  {
    id: stringField,
  },
  {
    success: booleanField,
  },
);

export const deleteGuess = new RPC<Pick<AdminGuess, 'id'>, StatusResponse>(
  'deleteGuess',
  {
    id: stringField,
  },
  {
    success: booleanField,
  },
);

export const setMainQuestionOrder = new RPC<Pick<QuestionOrder, 'mainQuestions'>, StatusResponse>(
  'setMainQuestionOrder',
  {
    mainQuestions: arrayOf(stringField),
  },
  {
    success: booleanField,
  },
);

export const setBonusQuestionOrder = new RPC<Pick<QuestionOrder, 'bonusQuestions'>, StatusResponse>(
  'setBonusQuestionOrder',
  {
    bonusQuestions: arrayOf(stringField),
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
