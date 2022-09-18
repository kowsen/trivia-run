import io, { Socket } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import {
  type Messages,
  type Payload,
  payloadValidator,
  type Responses,
  responseValidators,
  timeoutResponses,
} from "trivia-ws/dist/socket_interface.js";
import { Builder, type Patch } from "trivia-ws/dist/builder.js";
import { initialStateObjects, type StateObjects } from "./state_objects";

const REQUEST_TIMEOUT = 5000;

console.log("BASE MESSAGE TEST");

class StateSubscription<TObject extends object> {
  private readonly subscriptions: Array<(data: TObject) => void> = [];
  private readonly builder: Builder<TObject>;

  constructor(initialData: TObject) {
    this.builder = new Builder(initialData);
  }

  public patch(patch: Patch<TObject>) {
    const newData = this.builder.patch(patch);
    for (const subscription of this.subscriptions) {
      subscription(newData);
    }
  }

  public subscribe(callback: (data: TObject) => void): () => void {
    this.subscriptions.push(callback);
    return () => {
      const index = this.subscriptions.indexOf(callback);
      if (index !== -1) {
        this.subscriptions.splice(index, 1);
      }
    };
  }
}

export class ClientSocket {
  private readonly socket: Socket;

  private readonly pendingRequests = new Map<string, (response: any) => void>();

  private readonly stateSubscriptions: Partial<
    Record<keyof StateObjects, StateSubscription<object>>
  > = {};

  readonly isSocketReady: Promise<void>;

  constructor(path: string) {
    this.socket = io(path);

    console.log("WHAT");
    this.isSocketReady = new Promise((resolve) => {
      console.log("SETTING UP READY");
      this.socket.on("connect", () => {
        console.log("READY");
        resolve();
      });
    });
    console.log("UP");

    this.socket.on("game_resp", (payload: unknown) => {
      if (payloadValidator.validate(payload)) {
        if (responseValidators[payload.kind].validate(payload.message)) {
          const pendingRequest = this.pendingRequests.get(payload.token);
          if (pendingRequest) {
            pendingRequest(payload.message);
            this.pendingRequests.delete(payload.token);
          } else {
            console.warn(
              `Received response for token ${payload.token} with no pending request.`
            );
          }
        } else {
          console.warn(
            `Received invalid response for token ${payload.token}.`,
            payload
          );
        }
      } else {
        console.warn(`Received invalid payload.`, payload);
      }
    });
  }

  public async send<TEvent extends keyof Messages>(
    event: TEvent,
    message: Messages[TEvent]
  ): Promise<Responses[TEvent]> {
    await this.isSocketReady;

    const token = uuidv4();

    const response = await new Promise<Responses[TEvent]>((resolve) => {
      let timeout: ReturnType<typeof setTimeout> | undefined;

      const respond = (response: Responses[TEvent]) => {
        clearTimeout(timeout);
        this.pendingRequests.delete(token);
        resolve(response);
      };

      this.pendingRequests.set(token, respond);

      timeout = setTimeout(() => {
        respond(timeoutResponses[event]);
      }, REQUEST_TIMEOUT);

      console.log("SENDING REQ", message, token);

      this.socket.emit("game_req", {
        kind: event,
        token,
        message,
      });

      console.log("SENT REQ", message, token);
    });

    return response;
  }

  public sync<TStateObject extends keyof StateObjects>(
    state: TStateObject
  ): StateSubscription<StateObjects[TStateObject]> {
    let subscription = this.stateSubscriptions[state] as
      | StateSubscription<StateObjects[TStateObject]>
      | undefined;
    if (!subscription) {
      subscription = new StateSubscription<StateObjects[TStateObject]>(
        initialStateObjects[state]
      );
    }
    // Tell server to start sending updates
    return subscription;
  }
}
