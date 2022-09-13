/// <reference types="qs" />
/// <reference types="express" />
export interface Credentials {
    username: string;
    password: string;
}
export declare const authMiddleware: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
