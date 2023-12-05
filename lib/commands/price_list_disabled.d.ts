import { CommandEvent } from "../types";
export declare const sync_price_list_disabled: (
  commandEvent: CommandEvent
) => Promise<{
  repzo_PL_total: number;
  sap_PL_items_total: number;
  repzo_PL_items_total: number;
  repzo_PL_items: {
    removed: number;
    failed: number;
  };
}>;
