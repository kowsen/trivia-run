import type { ActionReducerMapBuilder, EntityState, EntityAdapter } from '@reduxjs/toolkit';
import * as toolkitRaw from '@reduxjs/toolkit';
const { combineReducers, createAction, createEntityAdapter, createReducer } = ((toolkitRaw as any).default ??
  toolkitRaw) as typeof toolkitRaw;

import { BaseQuestion, Doc } from './base.js';
import { GameGuess, GameQuestion, GameTeam } from './game_state.js';

export interface AdminQuestion extends BaseQuestion {
  name?: string;
  answer: string;
}

export interface AdminTeam extends GameTeam {}

export interface AdminGuess extends GameGuess {
  teamId: string;
}

export interface AdminQuestionOrder extends Doc {
  main: string[];
  bonus: string[];
}

export interface AdminStateUpdate {
  questions?: AdminQuestion[];
  teams?: AdminTeam[];
  guesses?: AdminGuess[];
  order?: AdminQuestionOrder;
}

export const updateAdminState = createAction('admin/update', (payload: AdminStateUpdate) => ({ payload }));

function handleUpdateAdminState<TDoc extends Doc>(
  builder: ActionReducerMapBuilder<EntityState<TDoc>>,
  adapter: EntityAdapter<TDoc>,
  getDocs: (update: AdminStateUpdate) => TDoc[] | undefined,
) {
  builder.addCase(updateAdminState, (state, action) => {
    const docsToUpsert = getDocs(action.payload)?.filter(doc => {
      const existing = state.entities[doc._id];
      return !existing || existing._modified < doc._modified;
    });
    if (docsToUpsert?.length) {
      adapter.upsertMany(state as EntityState<TDoc>, docsToUpsert);
    }
  });
}

const questionsAdapter = createEntityAdapter<AdminQuestion>({
  selectId: model => model._id,
});

const questionsSlice = createReducer(questionsAdapter.getInitialState(), builder => {
  handleUpdateAdminState(builder, questionsAdapter, ({ questions }) => questions);
});

const teamAdapter = createEntityAdapter<AdminTeam>({
  selectId: model => model._id,
});

const teamSlice = createReducer(teamAdapter.getInitialState(), builder => {
  handleUpdateAdminState(builder, teamAdapter, ({ teams }) => teams);
});

const guessAdapter = createEntityAdapter<AdminGuess>({
  selectId: model => model._id,
});

const guessSlice = createReducer(guessAdapter.getInitialState(), builder => {
  handleUpdateAdminState(builder, guessAdapter, ({ guesses }) => guesses);
});

const orderAdapter = createEntityAdapter<AdminQuestionOrder>({
  selectId: model => model._id,
});

const orderSlice = createReducer(orderAdapter.getInitialState(), builder => {
  handleUpdateAdminState(builder, orderAdapter, ({ order }) => (order ? [order] : order));
});

export const adminReducer = combineReducers({
  questions: questionsSlice,
  teams: teamSlice,
  guesses: guessSlice,
  order: orderSlice,
});
