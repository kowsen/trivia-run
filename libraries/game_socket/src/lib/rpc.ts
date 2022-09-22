import { validate, Validator } from "./validator.js";

export class RPC<TParams extends object, TResult extends object> {
  constructor(
    public readonly method: string,
    private readonly paramsValidator: Validator<TParams>,
    private readonly resultValidator: Validator<TResult>
  ) {}

  public validateParams(value: unknown): value is TParams {
    return validate(value, this.paramsValidator);
  }

  public validateResult(value: unknown): value is TResult {
    return validate(value, this.resultValidator);
  }
}
