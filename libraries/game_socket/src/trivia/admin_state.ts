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
import { GameBonusInfo, GameGuess, GameQuestion, GameQuestionOrder, GameTeam } from './game_state.js';

export interface AdminQuestion extends GameQuestion {
  answer: string;
}

export interface AdminBonusInfo extends GameBonusInfo {}

export interface AdminTeam extends GameTeam {}

export interface AdminGuess extends GameGuess {
  teamId: string;
}

export interface AdminQuestionOrder extends GameQuestionOrder {
  mainQuestions: string[];
}

export interface AdminStateUpdate {
  questions?: AdminQuestion[];
  bonusInfo?: AdminBonusInfo[];
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

const bonusInfoAdapter = createEntityAdapter<AdminBonusInfo>({
  selectId: model => model._id,
});

const bonusInfoSlice = createReducer(bonusInfoAdapter.getInitialState(), builder => {
  handleUpdateAdminState(builder, bonusInfoAdapter, ({ bonusInfo }) => bonusInfo);
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

const INITIAL_QUESITON_ORDER: AdminQuestionOrder = {
  _id: 'INITIAL_QUESTION_ORDER',
  _modified: -1,
  mainQuestions: [],
  bonusQuestions: [],
};

const orderSlice = createReducer(INITIAL_QUESITON_ORDER, builder => {
  builder.addCase(updateAdminState, (state, action) => {
    const newOrder = action.payload.order;
    if (newOrder && state._modified < newOrder._modified) {
      return newOrder;
    }
    return state;
  });
});

export const adminReducer = combineReducers({
  questions: questionsSlice,
  bonusInfo: bonusInfoSlice,
  teams: teamSlice,
  guesses: guessSlice,
  order: orderSlice,
});
