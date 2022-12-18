import Repzo from "repzo";
import { commands, commandsList } from "./index.js";
export const basic = async (commandEvent) => {
  var _a, _b;
  const repzo = new Repzo(
    (_a = commandEvent.app.formData) === null || _a === void 0
      ? void 0
      : _a.repzoApiKey,
    {
      env: commandEvent.env,
    }
  );
  const commandLog = new Repzo.CommandLog(
    repzo,
    commandEvent.app,
    commandEvent.command
  );
  try {
    console.log("basic sync");
    await commandLog.load(commandEvent.sync_id);
    await commandLog.addDetail("Repzo SAP: Basic Sync").commit();
    const required_syncing_commands = [
      "join",
      "warehouse",
      "rep",
      "tax",
      "tag",
      "measureunit",
      "measureunit_family",
      "category",
      "channel",
      "payment_term",
      "bank",
      "product",
      "disabled_product",
      "price_list",
      "client",
      "disabled_client",
    ];
    for (let i = 0; i < required_syncing_commands.length; i++) {
      const command = required_syncing_commands[i];
      const commandDes = commandsList.find((c) => c.command == command);
      const event = JSON.parse(JSON.stringify(commandEvent));
      event.command = command;
      await commandLog
        .addDetail(
          `Start Syncing: ${
            (commandDes === null || commandDes === void 0
              ? void 0
              : commandDes.name) || command
          }`
        )
        .commit();
      await commands(event);
      await commandLog.load(commandEvent.sync_id);
    }
    await commandLog
      .setStatus("success")
      .setBody({ message: "Basic Sync: Completed" })
      .commit();
  } catch (e) {
    //@ts-ignore
    console.error(
      ((_b = e === null || e === void 0 ? void 0 : e.response) === null ||
      _b === void 0
        ? void 0
        : _b.data) || e
    );
    await commandLog.load(commandEvent.sync_id);
    await commandLog.setStatus("fail", e).commit();
    throw e;
  }
};
