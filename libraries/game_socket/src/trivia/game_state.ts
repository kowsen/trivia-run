import {
  ActionReducerMapBuilder,
  EntityState,
  EntityAdapter,
  createEntityAdapter,
  createReducer,
  combineReducers,
  createAction,
} from '@reduxjs/toolkit';
import {
  AdminBonusInfo,
  AdminGuess,
  AdminQuestion,
  AdminQuestionOrder,
  AdminStateUpdate,
  AdminTeam,
} from './admin_state.js';
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
}

const DUMMY_GAME_QUESTION: RequestDoc<GameQuestion> = {
  title: 'DUMMY',
};

export function populateMainQuestionTitle(
  question: AdminQuestion,
  mainQuestionOrder: string[],
  prefix: string,
): AdminQuestion {
  if (!question.title) {
    const mainQuestionIndex = mainQuestionOrder.indexOf(question._id);
    if (mainQuestionIndex !== -1) {
      return {
        ...question,
        title: `${prefix} ${mainQuestionIndex}`,
      };
    }
  }
  return question;
}

export function stripGameQuestion(question: AdminQuestion): OmitExtended<GameQuestion, AdminQuestion> {
  if (question._deleted) {
    return {
      ...DUMMY_GAME_QUESTION,
      ...getMetadata(question),
      answer: undefined,
    };
  }
  return {
    ...question,
    answer: undefined,
  };
}

export interface GameBonusInfo extends Doc {
  unlockTime: number;
  firstCompletedBy?: string;
}

const DUMMY_GAME_BONUS_INFO: RequestDoc<GameBonusInfo> = {
  unlockTime: -1,
};

export function stripGameBonusInfo(bonusInfo: AdminBonusInfo): OmitExtended<GameBonusInfo, AdminBonusInfo> {
  if (bonusInfo._deleted) {
    return {
      ...DUMMY_GAME_BONUS_INFO,
      ...getMetadata(bonusInfo),
    };
  }
  return bonusInfo;
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

export function stripGameQuestionOrder(
  questionOrder: AdminQuestionOrder,
): OmitExtended<GameQuestionOrder, AdminQuestionOrder> {
  return {
    ...questionOrder,
    mainQuestions: undefined,
  };
}

export interface GameStateUpdate {
  questions?: GameQuestion[];
  bonusInfo?: GameBonusInfo[];
  teams?: GameTeam[];
  guesses?: GameGuess[];
  order?: GameQuestionOrder;
}

export const updateGameState = createAction('game/update', (payload: AdminStateUpdate) => {
  return {
    payload: {
      questions: payload.questions?.map(stripGameQuestion),
      bonusInfo: payload.bonusInfo?.map(stripGameBonusInfo),
      teams: payload.teams?.map(stripGameTeam),
      guesses: payload.guesses?.map(stripGameGuess),
      order: payload.order ? stripGameQuestionOrder(payload.order) : undefined,
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

const bonusInfoAdapter = createEntityAdapter<GameBonusInfo>({
  selectId: model => model._id,
});

const bonusInfoSlice = createReducer(bonusInfoAdapter.getInitialState(), builder => {
  handleUpdateGameState(builder, bonusInfoAdapter, ({ bonusInfo }) => bonusInfo);
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

const INITIAL_QUESITON_ORDER: GameQuestionOrder = {
  _id: 'INITIAL_QUESTION_ORDER',
  _modified: -1,
  bonusQuestions: [],
};

const orderSlice = createReducer(INITIAL_QUESITON_ORDER, builder => {
  builder.addCase(updateGameState, (state, action) => {
    const newOrder = action.payload.order;
    if (newOrder && state._modified < newOrder._modified) {
      return newOrder;
    }
    return state;
  });
});

export const gameReducer = combineReducers({
  questions: questionsSlice,
  bonusInfo: bonusInfoSlice,
  teams: teamSlice,
  guesses: guessSlice,
  order: orderSlice,
});
