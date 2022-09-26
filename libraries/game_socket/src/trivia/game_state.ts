import type { ActionReducerMapBuilder, EntityState, EntityAdapter } from '@reduxjs/toolkit';
import * as toolkitRaw from '@reduxjs/toolkit';
const { combineReducers, createAction, createEntityAdapter, createReducer } = ((toolkitRaw as any).default ??
  toolkitRaw) as typeof toolkitRaw;

import { AdminGuess, AdminQuestion, AdminStateUpdate, AdminTeam } from './admin_state.js';
import { Doc, RequestDoc } from './base.js';

type OmitExtended<T, TChild extends T> = T & Record<keyof Omit<TChild, keyof T>, undefined>;

function getMetadata(doc: Doc): Doc {
  return {
    _id: doc._id,
    _modified: doc._modified,
    _deleted: doc._deleted,
  };
}

export interface GameQuestion extends Doc {
  title: string;
  text?: string;
  image?: string;
  frame?: string;
  hideAnswer?: boolean;
  unlockTime?: number;
  mainIndex?: number;
  bonusIndex?: number;
  bonusWinner?: string;
}

const DUMMY_GAME_QUESTION: RequestDoc<GameQuestion> = {
  title: 'DUMMY',
};

const LOCKED_QUESTION_PATCH: Partial<GameQuestion> = {
  text: '',
  image: '',
  frame: '',
  hideAnswer: true,
};

export function stripGameQuestion(question: AdminQuestion): OmitExtended<GameQuestion, AdminQuestion> {
  if (question._deleted) {
    return {
      ...DUMMY_GAME_QUESTION,
      ...getMetadata(question),
      answer: undefined,
    };
  }

  if (question.unlockTime && question.unlockTime > Date.now()) {
    return {
      ...question,
      ...LOCKED_QUESTION_PATCH,
      answer: undefined,
    };
  }

  return {
    ...question,
    answer: undefined,
  };
}

export interface GameTeam extends Doc {
  name: string;
  token: string;
  completedBonusQuestions: string[];
  mainQuestionId: string;
  isSecretTeam?: boolean;
}

const DUMMY_GAME_TEAM: RequestDoc<GameTeam> = {
  name: 'DUMMY',
  token: 'DUMMY',
  completedBonusQuestions: [],
  mainQuestionId: 'DUMMY',
};

export function stripGameTeam(team: AdminTeam): OmitExtended<GameTeam, AdminTeam> {
  if (team._deleted) {
    return {
      ...DUMMY_GAME_TEAM,
      ...getMetadata(team),
    };
  }
  return team;
}

export interface GameGuess extends Doc {
  questionId: string;
  text: string;
  isCorrect: boolean;
}

const DUMMY_GAME_GUESS: RequestDoc<GameGuess> = {
  questionId: 'DUMMY',
  text: 'DUMMY',
  isCorrect: false,
};

export function stripGameGuess(guess: AdminGuess): OmitExtended<GameGuess, AdminGuess> {
  if (guess._deleted) {
    return {
      ...DUMMY_GAME_GUESS,
      ...getMetadata(guess),
      teamId: undefined,
    };
  }
  return {
    ...guess,
    teamId: undefined,
  };
}

export interface GameQuestionOrder extends Doc {
  bonusQuestions: string[];
}

export interface GameStateUpdate {
  questions?: GameQuestion[];
  teams?: GameTeam[];
  guesses?: GameGuess[];
  order?: GameQuestionOrder;
}

export const updateGameState = createAction('game/update', (payload: AdminStateUpdate) => {
  return {
    payload: {
      questions: payload.questions?.map(stripGameQuestion),
      teams: payload.teams?.map(stripGameTeam),
      guesses: payload.guesses?.map(stripGameGuess),
    },
  };
});

function handleUpdateGameState<TDoc extends Doc>(
  builder: ActionReducerMapBuilder<EntityState<TDoc>>,
  adapter: EntityAdapter<TDoc>,
  getDocs: (update: GameStateUpdate) => TDoc[] | undefined,
) {
  builder.addCase(updateGameState, (state, action) => {
    const docsToUpsert = getDocs(action.payload)?.filter(doc => {
      const existing = state.entities[doc._id];
      return !existing || existing._modified < doc._modified;
    });
    if (docsToUpsert?.length) {
      adapter.upsertMany(state as EntityState<TDoc>, docsToUpsert);
    }
  });
}

const questionsAdapter = createEntityAdapter<GameQuestion>({
  selectId: model => model._id,
});

const questionsSlice = createReducer(questionsAdapter.getInitialState(), builder => {
  handleUpdateGameState(builder, questionsAdapter, ({ questions }) => questions);
});

const teamAdapter = createEntityAdapter<GameTeam>({
  selectId: model => model._id,
});

const teamSlice = createReducer(teamAdapter.getInitialState(), builder => {
  handleUpdateGameState(builder, teamAdapter, ({ teams }) => teams);
});

const guessAdapter = createEntityAdapter<GameGuess>({
  selectId: model => model._id,
});

const guessSlice = createReducer(guessAdapter.getInitialState(), builder => {
  handleUpdateGameState(builder, guessAdapter, ({ guesses }) => guesses);
});

export const gameReducer = combineReducers({
  questions: questionsSlice,
  teams: teamSlice,
  guesses: guessSlice,
});
