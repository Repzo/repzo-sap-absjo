import { CommandEvent } from "../types";
export declare const sync_measureunit_family: (
  commandEvent: CommandEvent
) => Promise<{
  sap_total: number;
  repzo_total: number;
  sap_UoM_total: number;
  repzo_UoM_total: number;
  created: number;
  updated: number;
  failed: number;
}>;
