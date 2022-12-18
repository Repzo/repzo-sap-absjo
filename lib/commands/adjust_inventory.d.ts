import { CommandEvent, Result } from "../types";
export declare const adjust_inventory: (commandEvent: CommandEvent) => Promise<Result & {
    items_failed: number;
}>;
