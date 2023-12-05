export declare const Actions: (
  event: any,
  options: import("./types.js").Config
) => Promise<any>;
export declare const ActionsList: import("./types.js").Action[];
export declare const Commands: (
  CommandEvent: import("./types.js").CommandEvent
) => Promise<
  | void
  | import("./types.js").Result
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
export declare const CommandsList: import("./types.js").Command[];
