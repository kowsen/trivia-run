export type ValidatorMap<TObject extends object> = {
  [Property in keyof TObject]: (value: unknown) => TObject[Property];
};

export class Validator<TObject extends object> {
  constructor(private readonly validators: ValidatorMap<TObject>) {}

  public validate(value: unknown): value is TObject {
    if (!value || typeof value !== "object") {
      return false;
    }

    const indexableValue = value as { [key: string]: unknown };

    try {
      for (const [key, untypedValidator] of Object.entries(this.validators)) {
        const validator = untypedValidator as (value: unknown) => unknown;
        validator(indexableValue[key]);
      }
      return true;
    } catch (e) {
      console.log("Failed to validate value", value, e);
      return false;
    }
  }
}

export function stringValidator(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error(`${value} should be a string.`);
  }
  return value;
}

export function booleanValidator(value: unknown): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${value} should be a boolean.`);
  }
  return value;
}
