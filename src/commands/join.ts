import Repzo from "repzo";
import { Service } from "repzo/lib/types";
import { EVENT, Config, CommandEvent } from "../types";
import { _fetch, _create, _update, _delete } from "../util.js";

export const join = async (commandEvent: CommandEvent) => {
  const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
    env: commandEvent.env,
  });

  const commandLog = new Repzo.CommandLog(
    repzo,
    commandEvent.app,
    commandEvent.command,
  );
  try {
    console.log("join");

    await commandLog.load(commandEvent.sync_id);
    await commandLog.addDetail("Repzo SAP: Join").commit();

    const body: Service.JoinActionsWeHook.Data = {
      data: [],
    };

    const result = await repzo.joinActionsWebHook.update(null, body);
    // console.log(result);

    await commandLog.setStatus("success").setBody(result).commit();
  } catch (e: any) {
    //@ts-ignore
    console.error(e?.response?.data || e);
    await commandLog.setStatus("fail", e).commit();
    throw e;
  }
};
