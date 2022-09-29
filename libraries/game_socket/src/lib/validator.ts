export type Validator<TObject> = {
  [Property in keyof TObject]: (value: unknown) => TObject[Property];
};

export function validate<TObject>(value: unknown, validator: Validator<TObject>): value is TObject {
  if (!value || typeof value !== 'object') {
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
    console.log('Failed to validate value', value, e);
    return false;
  }
}

export function stringField(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error(`${value} should be a string.`);
  }
  return value;
}

export function numberField(value: unknown): number {
  if (typeof value !== 'number') {
    throw new Error(`${value} should be a number.`);
  }
  return value;
}

export function booleanField(value: unknown): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`${value} should be a boolean.`);
  }
  return value;
}

export function unknownField(value: unknown): unknown {
  return value;
}

export function optional<TValue>(validator: (value: unknown) => TValue): (value: unknown) => TValue | undefined {
  return (value: unknown) => {
    if (value === undefined) {
      return value;
    }
    return validator(value);
  };
}

export function maybeNull<TValue>(validator: (value: unknown) => TValue): (value: unknown) => TValue | null {
  return (value: unknown) => {
    if (value === null) {
      return value;
    }
    return validator(value);
  };
}

export function arrayOf<TValue>(validator: (value: unknown) => TValue): (value: unknown) => TValue[] {
  return (value: unknown) => {
    if (!(value instanceof Array)) {
      throw new Error(`${value} should be an array.`);
    }
    for (const item of value) {
      validator(item);
    }
    return value;
  };
}
