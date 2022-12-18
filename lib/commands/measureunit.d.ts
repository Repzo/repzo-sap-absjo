import { CommandEvent, Result } from "../types";
export interface SAPUoM {
  ITEMCODE: string;
  UOMGROUPENTRY: number;
  UOMGROUPCODE: string;
  UOMGROUPNAME: string;
  BASEUOMID: number;
  BASEUOMCODE: string;
  BASEQTY: number;
  ALTUOMID: number;
  ALTUOMCODE: string;
  ALTQTY: number;
  repzo_factor?: number;
}
export declare const sync_measureunit: (
  commandEvent: CommandEvent
) => Promise<Result>;
export declare const get_sap_UoMs: (
  serviceEndPoint: string,
  query?:
    | {
        updateAt?: string | undefined;
      }
    | undefined
) => Promise<SAPUoM[]>;
