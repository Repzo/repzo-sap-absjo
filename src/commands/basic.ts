import Repzo from "repzo";
import { EVENT, Config, CommandEvent, CommandType } from "../types";
import { _fetch, _create, _update, _delete } from "../util.js";

import { commands, commandsList } from "./index.js";
export const basic = async (commandEvent: CommandEvent) => {
  const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
    env: commandEvent.env,
  });

  const commandLog = new Repzo.CommandLog(
    repzo,
    commandEvent.app,
    commandEvent.command
  );
  try {
    // console.log("basic sync");

    await commandLog.load(commandEvent.sync_id);
    await commandLog.addDetail("Repzo SAP: Basic Sync").commit();

    const required_syncing_commands: CommandType[] = [
      "warehouse",
      "rep",
      "tax",
      "tag",
      "measureunit",
      "measureunit_family",
      "category",
      "brand",
      "channel",
      "payment_term",
      "bank",
      "product",
      "disabled_product",
      "price_list",
      "price_list_disabled",
      "client",
      "disabled_client",
    ];

    for (let i = 0; i < required_syncing_commands.length; i++) {
      const command = required_syncing_commands[i];
      const commandDes = commandsList.find((c) => c.command == command);
      const event: CommandEvent = JSON.parse(JSON.stringify(commandEvent));
      event.command = command;
      await commandLog
        .addDetail(`Start Syncing: ${commandDes?.name || command}`)
        .commit();
      await commands(event);
      await commandLog.load(commandEvent.sync_id);
    }

    await commandLog
      .setStatus("success")
      .setBody({ message: "Basic Sync: Completed" })
      .commit();
  } catch (e: any) {
    //@ts-ignore
    console.error(e?.response?.data || e);
    await commandLog.load(commandEvent.sync_id);
    await commandLog.setStatus("fail", e).commit();
    throw e;
  }
};
