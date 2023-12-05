import { Command, CommandEvent, Result } from "./../types";
export declare const commands: (CommandEvent: CommandEvent) => Promise<
  | void
  | Result
  | {
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
    }
  | {
      repzo_PL_total: number;
      sap_PL_items_total: number;
      repzo_PL_items_total: number;
      repzo_PL_items: {
        removed: number;
        failed: number;
      };
    }
>;
export declare const commandsList: Command[];
