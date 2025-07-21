import Repzo from "repzo";
import { CommandType } from "./types";
import { Service } from "repzo/src/types";
interface Params {
  [key: string]: any;
}
interface Data {
  [key: string]: any;
}
interface Headers {
  "API-KEY": string;
  [key: string]: string;
}
export declare const _fetch: (
  baseUrl: string,
  path: string,
  headers?: Headers,
  params?: Params
) => Promise<any>;
export declare const _create: (
  baseUrl: string,
  path: string,
  body: Data,
  headers?: Headers,
  params?: Params
) => Promise<any>;
export declare const _update: (
  baseUrl: string,
  path: string,
  body: Data,
  headers?: Headers,
  params?: Params
) => Promise<any>;
export declare const _delete: (
  baseUrl: string,
  path: string,
  headers?: Headers,
  params?: Params
) => Promise<any>;
export declare const update_bench_time: (
  repzo: Repzo,
  app_id: string,
  key: string,
  value: string,
  format?: string
) => Promise<void>;
export declare const updateAt_query: (
  QUERY: string,
  options_formData: any,
  bench_time_key: string
) => string;
export declare const get_data_from_sap: (
  _path: string,
  default_res: any, // if no data was found
  serviceEndPoint: string,
  serviceApiKey: string,
  query?: string
) => Promise<any>;
export declare const set_error: (error_res: any) => any;
export declare const date_formatting: (
  date: string | number | undefined,
  format: string
) => string | number | undefined;
export declare const get_data: (
  service: any,
  key: string,
  query_array: any[],
  extra_query?: {
    [key: string]: any;
  }
) => Promise<any[]>;
export declare const send_command_to_marketplace: ({
  command,
  app_id,
  env,
  repzoApiKey,
}: {
  command: CommandType;
  app_id: string;
  env: "production" | "staging" | "local";
  repzoApiKey: string;
}) => Promise<void>;
export declare const getUniqueConcatenatedValues: (
  item: Service.Item.Schema,
  key: "name" | "ref",
  delimiter: string,
  all_promos: {
    [promo_id: string]: {
      _id: string;
      name: string;
      ref?: string;
    };
  }
) => string;
export {};
