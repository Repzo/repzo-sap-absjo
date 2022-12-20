import jwt from "jsonwebtoken";
import { Service } from "repzo/src/types";
export interface Config {
  app_id: string;
  data?: any;
  repzoEndPoint: string;
  serviceEndPoint: string;
  env: "staging" | "local" | "production";
}
declare type DecodedScope = "admin" | "client" | "rep";
declare type StringId = string;
declare type Email = string;
declare type NameSpaces = string[];
export declare type Decoded = jwt.JwtPayload & {
  id?: StringId;
  email?: Email;
  name?: string;
  team?: StringId[];
  scope?: DecodedScope;
  nameSpace?: NameSpaces;
  permaString?: string;
  timezone?: string;
};
interface Params {
  nameSpace: NameSpaces;
  decoded: Decoded;
}
export declare type EVENT = AWSLambda.APIGatewayEvent & {
  params: Params;
};
export interface Action {
  name: string;
  action: ActionType | string;
  description: string;
}
export declare type ActionType =
  | "create_invoice"
  | "create_return_invoice"
  | "create_proforma"
  | "create_payment"
  | "create_transfer";
export declare type CommandType =
  | "join"
  | "basic"
  | "warehouse"
  | "rep"
  | "tax"
  | "tag"
  | "measureunit"
  | "measureunit_family"
  | "category"
  | "channel"
  | "payment_term"
  | "bank"
  | "product"
  | "disabled_product"
  | "price_list"
  | "client"
  | "disabled_client"
  | "adjust_inventory";
export interface Command {
  command: CommandType | string;
  description: string;
  name: string;
}
export interface AvailableApp {
  _id: StringId;
  name: string;
  disabled: boolean;
  JSONSchema: any;
  UISchema: any;
  app_settings: {
    repo: string;
    serviceEndPoint: string;
    meta: {};
  };
  app_category: string;
}
export interface CommandEvent {
  app: Service.App.Schema_with_populated_AvailableApp;
  command: CommandType | string;
  nameSpace: NameSpaces;
  meta?: any;
  sync_id?: string;
  end_of_day: string;
  timezone: string;
  data?: any;
  env: "staging" | "production" | "local";
}
export interface Result {
  sap_total: number;
  repzo_total: number;
  created: number;
  updated: number;
  failed: number;
}
export declare type FailedDocsReport = {
  method: "create" | "update" | "delete" | "fetchingData";
  doc_id?: string;
  doc?: any;
  error_message: any;
}[];
export {};
