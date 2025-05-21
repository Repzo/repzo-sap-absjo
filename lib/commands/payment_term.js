import Repzo from "repzo";
import {
  _create,
  update_bench_time,
  date_formatting,
  set_error,
} from "../util.js";
export const sync_payment_term = async (commandEvent) => {
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
    // console.log("sync_payment_term");
    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_payment_term";
    await commandLog.load(commandEvent.sync_id);
    await commandLog
      .addDetail("Repzo SAP: Started Syncing Payments Term")
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
    const sap_unique_payment_terms = {};
    sap_clients === null || sap_clients === void 0
      ? void 0
      : sap_clients.forEach((client) => {
          const paymentTerm = client.PAYMENTTERM;
          sap_unique_payment_terms[paymentTerm] = true;
        });
    const sap_payment_terms = Object.keys(sap_unique_payment_terms);
    result.sap_total =
      sap_payment_terms === null || sap_payment_terms === void 0
        ? void 0
        : sap_payment_terms.length;
    await commandLog
      .addDetail(
        `${result.sap_total} Payments Term in SAP changed since ${
          commandEvent.app.options_formData[bench_time_key] || "ever"
        }`
      )
      .commit();
    const repzo_payment_terms = await repzo.paymentTerm.find({
      per_page: 50000,
    });
    result.repzo_total =
      (_b =
        repzo_payment_terms === null || repzo_payment_terms === void 0
          ? void 0
          : repzo_payment_terms.data) === null || _b === void 0
        ? void 0
        : _b.length;
    await commandLog
      .addDetail(
        `${
          (_c =
            repzo_payment_terms === null || repzo_payment_terms === void 0
              ? void 0
              : repzo_payment_terms.data) === null || _c === void 0
            ? void 0
            : _c.length
        } Payments Term in Repzo`
      )
      .commit();
    for (
      let i = 0;
      i <
      (sap_payment_terms === null || sap_payment_terms === void 0
        ? void 0
        : sap_payment_terms.length);
      i++
    ) {
      const sap_payment_term = sap_payment_terms[i];
      const repzo_payment_term = repzo_payment_terms.data.find(
        (r_payment_term) => {
          var _a;
          return (
            ((_a = r_payment_term.integration_meta) === null || _a === void 0
              ? void 0
              : _a.id) == `${nameSpace}_${sap_payment_term}`
          );
        }
      );
      const body = {
        name: sap_payment_term.toString(),
        due_days: Number(sap_payment_term),
        integration_meta: {
          id: `${nameSpace}_${sap_payment_term}`,
        },
        company_namespace: [nameSpace],
      };
      if (!repzo_payment_term) {
        // Create
        try {
          const created_payment_term = await repzo.paymentTerm.create(body);
          result.created++;
        } catch (e) {
          // console.log("Create Payment Term Failed >> ", e?.response, body);
          failed_docs_report.push({
            method: "create",
            doc: body,
            error_message: set_error(e),
          });
          result.failed++;
        }
      } else {
        if (
          (repzo_payment_term === null || repzo_payment_term === void 0
            ? void 0
            : repzo_payment_term.name) ==
            (body === null || body === void 0 ? void 0 : body.name) &&
          (repzo_payment_term === null || repzo_payment_term === void 0
            ? void 0
            : repzo_payment_term.due_days) ==
            (body === null || body === void 0 ? void 0 : body.due_days)
        )
          continue;
        // Update
        try {
          const updated_payment_term = await repzo.paymentTerm.update(
            repzo_payment_term._id,
            body
          );
          result.updated++;
        } catch (e) {
          // console.log(
          //   "Update Payment Term Failed >> ",
          //   e?.response?.data,
          //   body
          // );
          failed_docs_report.push({
            method: "update",
            doc_id:
              repzo_payment_term === null || repzo_payment_term === void 0
                ? void 0
                : repzo_payment_term._id,
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
