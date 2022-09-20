export type Validator<TObject> = {
  [Property in keyof TObject]: (value: unknown) => TObject[Property];
};

export function validate<TObject>(
  value: unknown,
  validator: Validator<TObject>
): value is TObject {
  if (!value || typeof value !== "object") {
    return false;
  }

  const indexableValue = value as { [key: string]: unknown };

  try {
    for (const [key, untypedValidator] of Object.entries(validator)) {
      const validator = untypedValidator as (value: unknown) => unknown;
      validator(indexableValue[key]);
    }
    return true;
  } catch (e) {
    console.log("Failed to validate value", value, e);
    return false;
  }
}

export function stringField(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error(`${value} should be a string.`);
  }
  return value;
}

export function booleanField(value: unknown): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${value} should be a boolean.`);
  }
  return value;
}

export function unknownField(value: unknown): unknown {
  return value;
}
