import Repzo from "repzo";
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
  default_res: any,
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
export {};
