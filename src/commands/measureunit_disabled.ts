import Repzo from "repzo";
import { CommandEvent, Result, FailedDocsReport } from "../types";
import { update_bench_time, set_error } from "../util.js";
import { get_sap_UoMs, SAPUoM, get_uom_integration_id } from "./measureunit.js";

export const sync_measureunit_disabled = async (commandEvent: CommandEvent) => {
  const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
    env: commandEvent.env,
  });

  const commandLog = new Repzo.CommandLog(
    repzo,
    commandEvent.app,
    commandEvent.command
  );
  try {
    // console.log("sync_measureunit_disabled");

    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_measureunit_disabled";

    await commandLog.load(commandEvent.sync_id);
    await commandLog
      .addDetail("Repzo SAP: Started Syncing Disabled Measure units")
      .commit();

    const nameSpace: string = commandEvent.nameSpace.join("_");
    const result: Result = {
      sap_total: 0,
      repzo_total: 0,
      created: 0,
      updated: 0,
      failed: 0,
    };
    const failed_docs_report: FailedDocsReport = [];

    const sap_UoMs: SAPUoM[] = await get_sap_UoMs(
      commandEvent.app.formData.sapHostUrl,
      {}
    );
    result.sap_total = sap_UoMs?.length;

    await commandLog
      .addDetail(`${result.sap_total} Unit of Measures in SAP`)
      .commit();

    const repzo_active_UoMs = await repzo.measureunit.find({
      disabled: false,
      per_page: 50000,
    });
    const repzo_active_uom_docs = repzo_active_UoMs?.data || [];
    result.repzo_total = repzo_active_uom_docs.length;
    await commandLog
      .addDetail(
        `${repzo_active_uom_docs.length} Active Measure Units in Repzo`
      )
      .commit();

    const unique_UoMs_map: { [key: string]: SAPUoM } = {};

    for (let i = 0; i < sap_UoMs?.length; i++) {
      const Uom = sap_UoMs[i];
      const repzo_integration_key = get_uom_integration_id(nameSpace, Uom);
      if (!unique_UoMs_map[repzo_integration_key])
        unique_UoMs_map[repzo_integration_key] = Uom;
    }

    for (let i = 0; i < repzo_active_uom_docs.length; i++) {
      const repzo_UoM = repzo_active_uom_docs[i];
      const integration_id = repzo_UoM.integration_meta?.id;
      if (!integration_id) continue;

      if (!integration_id.startsWith(`${nameSpace}_`)) continue;

      const found_in_sap = unique_UoMs_map[integration_id];
      if (found_in_sap) continue;

      // disable in repzo
      try {
        await repzo.measureunit.remove(repzo_UoM._id);
        result.updated++;
      } catch (e: any) {
        // console.log(
        //   "Disable Measure Unit Failed >> ",
        //   e?.response?.data,
        //   {disabled: true}
        // );
        failed_docs_report.push({
          method: "delete",
          doc_id: repzo_UoM?._id,
          doc: { disabled: true },
          error_message: set_error(e),
        });
        result.failed++;
      }
    }

    // console.log(result);

    await update_bench_time(
      repzo,
      commandEvent.app._id,
      bench_time_key,
      new_bench_time
    );
    await commandLog
      .setStatus(
        "success",
        failed_docs_report.length ? failed_docs_report : null
      )
      .setBody(result)
      .commit();
    return result;
  } catch (e: any) {
    //@ts-ignore
    console.error(e?.response?.data || e);
    await commandLog.setStatus("fail", e).commit();
    throw e;
  }
};
