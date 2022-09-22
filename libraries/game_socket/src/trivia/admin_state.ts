import { createAction, createSlice, createEntityAdapter, PayloadAction, combineReducers } from '@reduxjs/toolkit';
import { BaseBonusQuestionInfo, BaseGuess, BaseQuestion, BaseTeam } from './base.js';

export interface AdminQuestion extends BaseQuestion {
  answer: string;
}

export interface AdminTeam extends BaseTeam {
  id: string;
  mainQuestionIndex: number;
  completedBonusQuestions: string[];
}

export interface AdminGuess extends BaseGuess {
  id: string;
  teamId: string;
  questionId: string;
}

export interface InitialAdminState {
  questions: AdminQuestion[];
  bonusQuestionInfo: BaseBonusQuestionInfo[];
  teams: AdminTeam[];
  guesses: AdminGuess[];
  order: QuestionOrder;
}

export const setInitialAdminState = createAction('admin/initial', (payload: InitialAdminState) => ({ payload }));

const questionsAdapter = createEntityAdapter<AdminQuestion>();

const questionsSlice = createSlice({
  name: 'questions',
  initialState: questionsAdapter.getInitialState(),
  reducers: {
    upsertQuestion(state, action: PayloadAction<AdminQuestion>) {
      questionsAdapter.upsertOne(state, action.payload);
    },
    deleteQuestion(state, action: PayloadAction<{ id: string }>) {
      questionsAdapter.removeOne(state, action.payload.id);
    },
  },
  extraReducers: builder => {
    builder.addCase(setInitialAdminState, (state, action) => {
      questionsAdapter.setAll(state, action.payload.questions);
    });
  },
});

const bonusQuestionInfoAdapter = createEntityAdapter<BaseBonusQuestionInfo>({
  selectId: model => model.questionId,
});

const bonusQuestionInfoSlice = createSlice({
  name: 'bonusQuestionInfo',
  initialState: bonusQuestionInfoAdapter.getInitialState(),
  reducers: {
    upsertBonusQuestionInfo(state, action: PayloadAction<BaseBonusQuestionInfo>) {
      bonusQuestionInfoAdapter.upsertOne(state, action.payload);
    },
    deleteBonusQuestionInfo(state, action: PayloadAction<{ questionId: string }>) {
      bonusQuestionInfoAdapter.removeOne(state, action.payload.questionId);
    },
  },
  extraReducers: builder => {
    builder.addCase(setInitialAdminState, (state, action) => {
      bonusQuestionInfoAdapter.setAll(state, action.payload.bonusQuestionInfo);
    });
  },
});

const teamAdapter = createEntityAdapter<AdminTeam>();

const teamSlice = createSlice({
  name: 'team',
  initialState: teamAdapter.getInitialState(),
  reducers: {
    upsertTeam(state, action: PayloadAction<AdminTeam>) {
      teamAdapter.upsertOne(state, action.payload);
    },
    deleteTeam(state, action: PayloadAction<{ id: string }>) {
      teamAdapter.removeOne(state, action.payload.id);
    },
  },
  extraReducers: builder => {
    builder.addCase(setInitialAdminState, (state, action) => {
      teamAdapter.setAll(state, action.payload.teams);
    });
  },
});

const guessAdapter = createEntityAdapter<AdminGuess>();

const guessSlice = createSlice({
  name: 'guess',
  initialState: guessAdapter.getInitialState(),
  reducers: {
    upsertGuess(state, action: PayloadAction<AdminGuess>) {
      guessAdapter.upsertOne(state, action.payload);
    },
    deleteGuess(state, action: PayloadAction<{ id: string }>) {
      guessAdapter.removeOne(state, action.payload.id);
    },
  },
  extraReducers: builder => {
    builder.addCase(setInitialAdminState, (state, action) => {
      guessAdapter.setAll(state, action.payload.guesses);
    });
  },
});

export interface QuestionOrder {
  mainQuestions: string[];
  bonusQuestions: string[];
}

const INITIAL_QUESTION_ORDER: QuestionOrder = {
  mainQuestions: [],
  bonusQuestions: [],
};

const orderSlice = createSlice({
  name: 'order',
  initialState: INITIAL_QUESTION_ORDER,
  reducers: {
    setMainQuestionOrder(state, action: PayloadAction<{ mainQuestions: string[] }>) {
      state.mainQuestions = action.payload.mainQuestions;
    },
    setBonusQuestionOrder(state, action: PayloadAction<{ bonusQuestions: string[] }>) {
      state.bonusQuestions = action.payload.bonusQuestions;
    },
  },
  extraReducers: builder => {
    builder.addCase(setInitialAdminState, (state, action) => {
      return action.payload.order;
    });
  },
});

export const adminReducer = combineReducers({
  questions: questionsSlice.reducer,
  bonusQuestionInfo: bonusQuestionInfoSlice.reducer,
  teams: teamSlice.reducer,
  guesses: guessSlice.reducer,
  order: orderSlice.reducer,
});

export const actions = {
  ...questionsSlice.actions,
  ...bonusQuestionInfoSlice.actions,
  ...teamSlice.actions,
  ...guessSlice.actions,
  ...orderSlice.actions,
};
