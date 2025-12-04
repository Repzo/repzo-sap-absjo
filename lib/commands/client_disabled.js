import Repzo from "repzo";
import {
  _create,
  update_bench_time,
  date_formatting,
  set_error,
} from "../util.js";
export const sync_disabled_client = async (commandEvent) => {
  var _a, _b, _c, _d, _e, _f;
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
    // console.log("sync_disabled_client");
    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_disabled_client";
    await commandLog.load(commandEvent.sync_id);
    await commandLog
      .addDetail("Repzo SAP: Started Syncing Disabled Clients")
      .commit();
    const nameSpace = commandEvent.nameSpace.join("_");
    const result = {
      sap_total: 0,
      repzo_total: 0,
      created: 0,
      updated: 0,
      failed: 0,
    };
    const failed_docs_report = [];
    const sap_disabled_clients = await get_sap_clients(
      commandEvent.app.formData.sapHostUrl,
      {
        updateAt:
          (_b = commandEvent.app.options_formData) === null || _b === void 0
            ? void 0
            : _b[bench_time_key],
        GroupCode: commandEvent.app.formData.GroupCode,
      }
    );
    result.sap_total =
      sap_disabled_clients === null || sap_disabled_clients === void 0
        ? void 0
        : sap_disabled_clients.length;
    await commandLog
      .addDetail(
        `${result.sap_total} Disabled Clients in SAP changed since ${
          ((_c = commandEvent.app.options_formData) === null || _c === void 0
            ? void 0
            : _c[bench_time_key]) || "ever"
        }`
      )
      .commit();
    const sap_client_query =
      sap_disabled_clients === null || sap_disabled_clients === void 0
        ? void 0
        : sap_disabled_clients.map(
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
    result.repzo_total =
      (_d = repzo_disabled_clients.data) === null || _d === void 0
        ? void 0
        : _d.length;
    await commandLog
      .addDetail(`${result.repzo_total} Matched Active Clients in Repzo`)
      .commit();
    for (
      let i = 0;
      i <
      (sap_disabled_clients === null || sap_disabled_clients === void 0
        ? void 0
        : sap_disabled_clients.length);
      i++
    ) {
      const sap_client = sap_disabled_clients[i];
      const repzo_client =
        (_e = repzo_disabled_clients.data) === null || _e === void 0
          ? void 0
          : _e.find((r_client) => {
              var _a;
              return (
                ((_a = r_client.integration_meta) === null || _a === void 0
                  ? void 0
                  : _a.id) == `${nameSpace}_${sap_client.CLIENTID}`
              );
            });
      if (repzo_client) {
        // Update
        try {
          const disabled_client = await repzo.client.remove(repzo_client._id);
          result.updated++;
        } catch (e) {
          // console.log("Disable Client Failed >> ", e?.response?.data, {
          //   CLIENTID: sap_client.CLIENTID,
          // });
          failed_docs_report.push({
            method: "delete",
            doc_id:
              repzo_client === null || repzo_client === void 0
                ? void 0
                : repzo_client._id,
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
  } catch (e) {
    //@ts-ignore
    console.error(
      ((_f = e === null || e === void 0 ? void 0 : e.response) === null ||
      _f === void 0
        ? void 0
        : _f.data) || e
    );
    await commandLog.setStatus("fail", e).commit();
    throw e;
  }
};
const get_sap_clients = async (serviceEndPoint, query) => {
  try {
    const sap_clients = await _create(serviceEndPoint, "/Customers", {
      Active: "N",
      Frozen: "N",
      UpdateAt: date_formatting(
        query === null || query === void 0 ? void 0 : query.updateAt,
        "YYYYMMDD:000000"
      ),
      GroupCode:
        (query === null || query === void 0 ? void 0 : query.GroupCode) || "",
    });
    return sap_clients.Customers;
  } catch (e) {
    throw e;
  }
};
