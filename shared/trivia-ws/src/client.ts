import { Action, BaseAction } from "redux-actions";
import { Client as WebSocketClient } from "rpc-websockets";
import { RPC } from "./rpc.js";
import { stringField, unknownField, validate } from "./validator.js";

class InvalidResultError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidResultError";
  }
}

const actionValidator = {
  type: stringField,
  payload: unknownField,
};

export class GameClient<TGameState> {
  private readonly client: WebSocketClient;
  private readonly openPromise: Promise<void>;
  private state: TGameState;
  private readonly stateListeners: Array<(state: TGameState) => void> = [];

  constructor(
    path: string,
    reducer: (
      prevState: TGameState | undefined,
      action: Action<unknown> | BaseAction
    ) => TGameState
  ) {
    this.state = reducer(undefined, { type: "INITIALIZE_REDUCER_ACTION" });

    this.client = new WebSocketClient(path);

    this.openPromise = new Promise((resolve) => {
      this.client.on("open", () => {
        this.client.subscribe("action");

        this.client.on("action", (action: unknown) => {
          if (!validate(action, actionValidator)) {
            throw new Error("Received invalid action message");
          }
          this.state = reducer(this.state, action);
          for (const listener of this.stateListeners) {
            listener(this.state);
          }
        });

        resolve();
      });
    });
  }

  public async call<TParams extends object, TResult extends object>(
    rpc: RPC<TParams, TResult>,
    params: TParams
  ): Promise<TResult> {
    await this.openPromise;

    const result = await this.client.call(rpc.method, params);

    if (!rpc.validateResult(result)) {
      throw new InvalidResultError("Result does not match RPC definition.");
    }

    return result;
  }

  public subscribe(listener: (state: TGameState) => void): () => void {
    this.stateListeners.push(listener);
    listener(this.state);
    return () => {
      const index = this.stateListeners.indexOf(listener);
      if (index !== -1) {
        this.stateListeners.splice(index, 1);
      }
    };
  }
}
