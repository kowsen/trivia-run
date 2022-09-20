import { Client as WebSocketClient } from "rpc-websockets";
import { RPC } from "./rpc";

class InvalidResultError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidResultError";
  }
}

export class GameClient {
  private readonly client: WebSocketClient;
  private readonly openPromise: Promise<void>;

  constructor(path: string) {
    this.client = new WebSocketClient(path);
    this.openPromise = new Promise((resolve) => {
      this.client.on("open", resolve);
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
}
