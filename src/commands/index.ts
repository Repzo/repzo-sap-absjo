import { Config, Command, CommandEvent, Result } from "./../types";

import { join } from "./join.js";
import { basic } from "./basic.js";
import { EVENT } from "./../types";
export const commands = async (CommandEvent: CommandEvent) => {
  switch (CommandEvent.command) {
    case "join":
      return await join(CommandEvent);
    case "basic":
      return await basic(CommandEvent);
    default:
      throw `Route: ${CommandEvent.command} not found`;
  }
};

export const commandsList: Command[] = [
  {
    command: "basic",
    name: "Full Sync",
    description: "",
  },
  {
    command: "join",
    name: "Join",
    description: "",
  },
];
