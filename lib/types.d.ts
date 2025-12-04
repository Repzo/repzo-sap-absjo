import type * as jwt from "jsonwebtoken";
import { Service } from "repzo/src/types";
export interface Config {
  app_id: string;
  data?: any;
  repzoEndPoint: string;
  serviceEndPoint: string;
  env: "staging" | "local" | "production";
}
type DecodedScope = "admin" | "client" | "rep";
type StringId = string;
type Email = string;
type NameSpaces = string[];
export type Decoded = jwt.JwtPayload & {
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
export type EVENT = AWSLambda.APIGatewayEvent & {
  params: Params;
};
export interface Action {
  name: string;
  action: ActionType | string;
  description: string;
}
export type ActionType =
  | "create_invoice"
  | "create_return_invoice"
  | "create_proforma"
  | "create_payment"
  | "create_transfer";
export type CommandType =
  | "join"
  | "basic"
  | "warehouse"
  | "rep"
  | "tax"
  | "tag"
  | "measureunit"
  | "measureunit_family"
  | "category"
  | "brand"
  | "channel"
  | "payment_term"
  | "bank"
  | "product"
  | "disabled_product"
  | "price_list"
  | "price_list_disabled"
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
export interface FormData {
  repzoApiKey: string;
  sapHostUrl: string;
  warehouseDefaultUpdateDate?: string;
  DepartmentCode?: string;
  GroupCode?: string;
  return_reasons?:
    | {
        sap_id: number;
        sap_name: string;
        repzo_name: string;
        repzo_id: StringId;
      }[]
    | string;
  defaultWarehouseForSalesOrder?: string;
  SalPersCode?: string;
  SalesPersonCode?: string;
  measureUnitInjections?: {
    itemCode: string;
    uom: string;
  }[];
  virtualWarehouses?: {
    consider_virtual_warehouse: boolean;
    absolute_qty_for_virtual_warehouses_before_accumulation: boolean;
  };
  invoices?: {
    createInvoiceHook?: boolean;
    createReturnInvoiceHook?: boolean;
  };
  payments?: {
    createPaymentHook?: boolean;
  };
  proformas?: {
    createApprovedProformaHook?: boolean;
  };
  transfers?: {
    createApprovedTransferHook?: boolean;
    adjustInventoryInFailedTransfer?: boolean;
  };
  client?: {
    createClientHook?: boolean;
  };
}
interface OptionsFormData {
  bench_time_warehouse?: string;
  bench_time_channel?: string;
  bench_time_payment_term?: string;
  bench_time_product?: string;
  bench_time_product_disabled?: string;
  bench_time_price_list?: string;
  bench_time_client?: string;
  bench_time_disabled_client?: string;
  bench_time_rep?: string;
  bench_time_tax?: string;
  bench_time_tag?: string;
  bench_time_measureunit?: string;
  bench_time_measureunit_family?: string;
  bench_time_category?: string;
  bench_time_bank?: string;
  bench_time_brand?: string;
  bench_time_price_list_disabled?: string;
}
interface AppWithCustomFormData
  extends Service.App.Schema_with_populated_AvailableApp {
  formData: FormData;
  options_formData?: OptionsFormData;
}
export interface CommandEvent {
  app: AppWithCustomFormData;
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
export type FailedDocsReport = {
  method: "create" | "update" | "delete" | "fetchingData";
  doc_id?: string;
  doc?: any;
  error_message: any;
}[];
export {};
