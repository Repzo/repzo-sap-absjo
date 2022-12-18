import { CommandEvent, Result } from "../types";
export declare const sync_bank: (commandEvent: CommandEvent) => Promise<
  Result & {
    repzo_bank_list_total: number;
    repzo_bank_list_updated: boolean;
  }
>;
