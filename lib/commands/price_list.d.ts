import { CommandEvent } from "../types";
export declare const sync_price_list: (commandEvent: CommandEvent) => Promise<{
  PL: {
    created: number;
    updated: number;
    failed: number;
  };
  PL_items: {
    created: number;
    updated: number;
    failed: number;
  };
  sap_total: number;
  repzo_total: number;
  repzo_PL_items: number;
  sap_UoMs_total: number;
  repzo_products_total: number;
}>;
