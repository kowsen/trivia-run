import { v4 as uuid } from 'uuid';
import { optional, stringField, unknownField, validate, Validator } from './validator.js';

export class RPC<TParams extends object, TResult extends object> {
  constructor(
    public readonly method: string,
    private readonly paramsValidator: Validator<TParams>,
    private readonly resultValidator: Validator<TResult>,
  ) {}

  public validateParams(value: unknown): value is TParams {
    return validate(value, this.paramsValidator);
  }

  public validateResult(value: unknown): value is TResult {
    return validate(value, this.resultValidator);
  }

  public buildCall(params: TParams): RPCCall<TParams> {
    return {
      id: uuid(),
      method: this.method,
      params,
    };
  }

  public parseCall(value: unknown): RPCCall<TParams> {
    if (validate(value, rpcCallValidator) && this.validateParams(value.params)) {
      return value as RPCCall<TParams>;
    }
    throw new Error(`Unable to parse call to ${this.method} method`);
  }

  public buildResponse(call: RPCCall<TParams>, result?: TResult, error?: string): RPCResponse<TResult> {
    return {
      id: call.id,
      result,
      error,
    };
  }

  public parseResponse(value: unknown): RPCResponse<TResult> {
    if (validate(value, rpcResponseValidator) && (!value.result || this.validateResult(value.result))) {
      return value as RPCResponse<TResult>;
    }
    throw new Error(`Unable to parse call to ${this.method} method`);
  }
}

export interface RPCCall<TParams extends object> {
  id: string;
  method: string;
  params: TParams;
}

export const rpcCallValidator = {
  id: stringField,
  method: stringField,
  params: unknownField,
};

export interface RPCResponse<TResult extends object> {
  id: string;
  result?: TResult;
  error?: string;
}

export const rpcResponseValidator = {
  id: stringField,
  result: optional(unknownField),
  error: optional(stringField),
};
