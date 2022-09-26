import {
  createAction,
  createSlice,
  createEntityAdapter,
  PayloadAction,
  combineReducers,
  ActionReducerMapBuilder,
  EntityState,
  EntityAdapter,
  createReducer,
} from '@reduxjs/toolkit';
import { Doc } from './base.js';
import { GameGuess, GameQuestion, GameTeam } from './game_state.js';

export interface AdminQuestion extends GameQuestion {
  answer: string;
}

export interface AdminTeam extends GameTeam {}

export interface AdminGuess extends GameGuess {
  teamId: string;
}

export interface AdminStateUpdate {
  questions?: AdminQuestion[];
  teams?: AdminTeam[];
  guesses?: AdminGuess[];
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

export const adminReducer = combineReducers({
  questions: questionsSlice,
  teams: teamSlice,
  guesses: guessSlice,
});
