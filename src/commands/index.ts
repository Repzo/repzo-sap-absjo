import { Config, Command, CommandEvent, Result } from "./../types";
import { EVENT } from "./../types";

import { join } from "./join.js";
import { basic } from "./basic.js";
import { sync_warehouse } from "./warehouse.js";
import { sync_rep } from "./rep.js";
import { sync_tax } from "./tax.js";
import { sync_tag } from "./tag.js";
import { sync_measureunit } from "./measureunit.js";
import { sync_measureunit_family } from "./measureunit_family.js";
import { sync_category } from "./category.js";
import { sync_channel } from "./channel.js";
import { sync_payment_term } from "./payment_term.js";
import { sync_bank } from "./bank.js";
import { sync_product } from "./product.js";
import { sync_disabled_product } from "./product_disabled.js";
import { sync_price_list } from "./price_list.js";
import { sync_client } from "./client.js";
import { sync_disabled_client } from "./client_disabled.js";
import { adjust_inventory } from "./adjust_inventory.js";

export const commands = async (CommandEvent: CommandEvent) => {
  switch (CommandEvent.command) {
    case "join":
      return await join(CommandEvent);
    case "basic":
      return await basic(CommandEvent);
    case "warehouse":
      return await sync_warehouse(CommandEvent);
    case "rep":
      return await sync_rep(CommandEvent);
    case "tax":
      return await sync_tax(CommandEvent);
    case "tag":
      return await sync_tag(CommandEvent);
    case "measureunit":
      return await sync_measureunit(CommandEvent);
    case "measureunit_family":
      return await sync_measureunit_family(CommandEvent);
    case "category":
      return await sync_category(CommandEvent);
    case "channel":
      return await sync_channel(CommandEvent);
    case "payment_term":
      return await sync_payment_term(CommandEvent);
    case "bank":
      return await sync_bank(CommandEvent);
    case "product":
      return await sync_product(CommandEvent);
    case "disabled_product":
      return await sync_disabled_product(CommandEvent);
    case "price_list":
      return await sync_price_list(CommandEvent);
    case "client":
      return await sync_client(CommandEvent);
    case "disabled_client":
      return await sync_disabled_client(CommandEvent);
    case "adjust_inventory":
      return await adjust_inventory(CommandEvent);
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
  {
    command: "warehouse",
    name: "Sync Warehouse",
    description: "Sync warehouses From SAP to Repzo",
  },
  {
    command: "rep",
    name: "Sync Reps",
    description: "Sync Reps From SAP to Repzo",
  },
];
