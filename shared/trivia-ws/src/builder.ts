export interface InitialPatch<TObject extends object> {
  kind: "initial";
  value: TObject;
}

export interface ReplacePatch<TObject extends object> {
  kind: "replace";
  data: Partial<TObject>;
}

type ArrayKeys<TObject extends object> = {
  [P in keyof TObject]: TObject[P] extends Array<any> ? P : never;
}[keyof TObject];

type PickArrays<TObject extends object> = Pick<TObject, ArrayKeys<TObject>>;

export interface ConcatPatch<TObject extends object> {
  kind: "concat";
  data: Partial<PickArrays<TObject>>;
}

export type Patch<TObject extends object> =
  | InitialPatch<TObject>
  | ReplacePatch<TObject>
  | ConcatPatch<TObject>;

export class Builder<TObject extends object> {
  private data: TObject;

  constructor(initialData: TObject) {
    this.data = { ...initialData };
  }

  public patch(patch: Patch<TObject>): TObject {
    if (patch.kind === "initial") {
      this.handleInitialPatch(patch);
    } else if (patch.kind === "replace") {
      this.handleReplacePatch(patch);
    } else if (patch.kind === "concat") {
      this.handleConcatPatch(patch);
    }
    return this.data;
  }

  private handleInitialPatch(patch: InitialPatch<TObject>) {
    this.data = patch.value;
  }

  private handleReplacePatch(patch: ReplacePatch<TObject>) {
    this.data = { ...this.data, ...patch.data };
  }

  private handleConcatPatch(patch: ConcatPatch<TObject>) {
    const patchedData = { ...this.data };
    for (const untypedKey of Object.keys(patch.data)) {
      const key = untypedKey as keyof typeof patch.data;
      patchedData[key] = this.patchValue(key, patch.data[key]);
    }
    this.data = patchedData;
  }

  private patchValue<TKey extends ArrayKeys<TObject>>(
    key: TKey,
    value?: TObject[TKey]
  ): TObject[TKey] {
    const currentValue = this.data[key];
    if (!value) {
      return currentValue;
    }
    if (currentValue instanceof Array && value instanceof Array) {
      return [...currentValue, ...value] as TObject[TKey];
    } else {
      throw new Error("Unable to patch value");
    }
  }
}
