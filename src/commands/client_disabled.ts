import Repzo from "repzo";
import { Service } from "repzo/src/types";
import DataSet from "data-set-query";
import { CommandEvent, Result, FailedDocsReport } from "../types";
import {
  _fetch,
  _create,
  _update,
  _delete,
  update_bench_time,
  date_formatting,
  set_error,
} from "../util.js";

import { SAPClient, SAPClients } from "./client.js";

export const sync_disabled_client = async (commandEvent: CommandEvent) => {
  const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
    env: commandEvent.env,
  });

  const commandLog = new Repzo.CommandLog(
    repzo,
    commandEvent.app,
    commandEvent.command
  );
  try {
    // console.log("sync_disabled_client");

    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_disabled_client";

    await commandLog.load(commandEvent.sync_id);
    await commandLog
      .addDetail("Repzo SAP: Started Syncing Disabled Clients")
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

    const sap_disabled_clients: SAPClient[] = await get_sap_clients(
      commandEvent.app.formData.sapHostUrl,
      {
        updateAt: commandEvent.app.options_formData[bench_time_key],
        GroupCode: commandEvent.app.formData.GroupCode,
      }
    );
    result.sap_total = sap_disabled_clients?.length;

    await commandLog
      .addDetail(
        `${result.sap_total} Disabled Clients in SAP changed since ${
          commandEvent.app.options_formData[bench_time_key] || "ever"
        }`
      )
      .commit();

    const sap_client_query = sap_disabled_clients?.map(
      (client) => `${nameSpace}_${client.CLIENTID}`
    );

    const repzo_disabled_clients = await repzo.patchAction.create(
      {
        slug: "client",
        readQuery: [
          { key: "disabled", value: [false], operator: "eq" },
          {
            key: "integration_meta.id",
            value: sap_client_query,
            operator: "in",
          },
        ],
      },
      { per_page: 50000, project: ["_id", "integration_meta"] }
    );

    result.repzo_total = repzo_disabled_clients.data?.length;
    await commandLog
      .addDetail(`${result.repzo_total} Matched Active Clients in Repzo`)
      .commit();

    for (let i = 0; i < sap_disabled_clients?.length; i++) {
      const sap_client: SAPClient = sap_disabled_clients[i];
      const repzo_client = repzo_disabled_clients.data?.find(
        (r_client) =>
          r_client.integration_meta?.id == `${nameSpace}_${sap_client.CLIENTID}`
      );

      if (repzo_client) {
        // Update
        try {
          const disabled_client = await repzo.client.remove(repzo_client._id);
          result.updated++;
        } catch (e: any) {
          // console.log("Disable Client Failed >> ", e?.response?.data, {
          //   CLIENTID: sap_client.CLIENTID,
          // });
          failed_docs_report.push({
            method: "delete",
            doc_id: repzo_client?._id,
            doc: { CLIENTID: sap_client.CLIENTID },
            error_message: set_error(e),
          });
          result.failed++;
        }
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

const get_sap_clients = async (
  serviceEndPoint: string,
  query?: { updateAt?: string; GroupCode?: string }
): Promise<SAPClient[]> => {
  try {
    const sap_clients: SAPClients = await _create(
      serviceEndPoint,
      "/Customers",
      {
        Active: "N",
        Frozen: "N",
        UpdateAt: date_formatting(query?.updateAt, "YYYYMMDD:000000"),
        GroupCode: query?.GroupCode || "",
      }
    );
    return sap_clients.Customers;
  } catch (e: any) {
    throw e;
  }
};
