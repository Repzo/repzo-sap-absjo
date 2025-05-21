import Repzo from "repzo";
import {
  _create,
  update_bench_time,
  date_formatting,
  set_error,
} from "../util.js";
export const sync_channel = async (commandEvent) => {
  var _a, _b, _c, _d;
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
    // console.log("sync_channel");
    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_channel";
    await commandLog.load(commandEvent.sync_id);
    await commandLog
      .addDetail("Repzo SAP: Started Syncing Client Channels")
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
    const sap_clients = await get_sap_clients(
      commandEvent.app.formData.sapHostUrl,
      {
        updateAt: commandEvent.app.options_formData[bench_time_key],
        GroupCode: commandEvent.app.formData.GroupCode,
      }
    );
    const sap_unique_channels = {};
    sap_clients === null || sap_clients === void 0
      ? void 0
      : sap_clients.forEach((client) => {
          const channel = client.CLIENTGROUP;
          sap_unique_channels[channel] = true;
        });
    const sap_channels = Object.keys(sap_unique_channels);
    result.sap_total =
      sap_channels === null || sap_channels === void 0
        ? void 0
        : sap_channels.length;
    await commandLog
      .addDetail(
        `${result.sap_total} Client Channels in SAP  changed since ${
          commandEvent.app.options_formData[bench_time_key] || "ever"
        }`
      )
      .commit();
    const repzo_channels = await repzo.channel.find({ per_page: 50000 });
    result.repzo_total =
      (_b =
        repzo_channels === null || repzo_channels === void 0
          ? void 0
          : repzo_channels.data) === null || _b === void 0
        ? void 0
        : _b.length;
    await commandLog
      .addDetail(
        `${
          (_c =
            repzo_channels === null || repzo_channels === void 0
              ? void 0
              : repzo_channels.data) === null || _c === void 0
            ? void 0
            : _c.length
        } Client Channels in Repzo`
      )
      .commit();
    for (
      let i = 0;
      i <
      (sap_channels === null || sap_channels === void 0
        ? void 0
        : sap_channels.length);
      i++
    ) {
      const sap_channel = sap_channels[i];
      const repzo_channel = repzo_channels.data.find((r_channel) => {
        var _a;
        return (
          ((_a = r_channel.integration_meta) === null || _a === void 0
            ? void 0
            : _a.id) == `${nameSpace}_${sap_channel}`
        );
      });
      const body = {
        name: sap_channel,
        disabled: false,
        integration_meta: {
          id: `${nameSpace}_${sap_channel}`,
        },
        company_namespace: [nameSpace],
      };
      if (!repzo_channel) {
        // Create
        try {
          const created_channel = await repzo.channel.create(body);
          result.created++;
        } catch (e) {
          // console.log("Create Client Channel Failed >> ", e?.response, body);
          failed_docs_report.push({
            method: "create",
            doc: body,
            error_message: set_error(e),
          });
          result.failed++;
        }
      } else {
        if (
          (repzo_channel === null || repzo_channel === void 0
            ? void 0
            : repzo_channel.name) ==
            (body === null || body === void 0 ? void 0 : body.name) &&
          (repzo_channel === null || repzo_channel === void 0
            ? void 0
            : repzo_channel.disabled) ==
            (body === null || body === void 0 ? void 0 : body.disabled)
        )
          continue;
        // Update
        try {
          const updated_channel = await repzo.channel.update(
            repzo_channel._id,
            body
          );
          result.updated++;
        } catch (e) {
          // console.log(
          //   "Update Client Channel Failed >> ",
          //   e?.response?.data,
          //   body
          // );
          failed_docs_report.push({
            method: "update",
            doc_id:
              repzo_channel === null || repzo_channel === void 0
                ? void 0
                : repzo_channel._id,
            doc: body,
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
      ((_d = e === null || e === void 0 ? void 0 : e.response) === null ||
      _d === void 0
        ? void 0
        : _d.data) || e
    );
    await commandLog.setStatus("fail", e).commit();
    throw e;
  }
};
const get_sap_clients = async (serviceEndPoint, query) => {
  try {
    const sap_clients = await _create(serviceEndPoint, "/Customers", {
      Active: "Y",
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
