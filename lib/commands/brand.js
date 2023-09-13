import Repzo from "repzo";
import { _create, update_bench_time, set_error } from "../util.js";
export const sync_brand = async (commandEvent) => {
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
    // console.log("sync_brand");
    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_brand";
    await commandLog.load(commandEvent.sync_id);
    await commandLog.addDetail("Repzo SAP: Started Syncing Brands").commit();
    const nameSpace = commandEvent.nameSpace.join("_");
    const result = {
      sap_total: 0,
      repzo_total: 0,
      created: 0,
      updated: 0,
      failed: 0,
    };
    const failed_docs_report = [];
    const sap_brands = await get_sap_brands(
      commandEvent.app.formData.sapHostUrl,
      {}
    );
    result.sap_total =
      sap_brands === null || sap_brands === void 0 ? void 0 : sap_brands.length;
    await commandLog.addDetail(`${result.sap_total} Brands in SAP`).commit();
    const repzo_brands = await repzo.brand.find({ per_page: 50000 });
    result.repzo_total =
      (_b =
        repzo_brands === null || repzo_brands === void 0
          ? void 0
          : repzo_brands.data) === null || _b === void 0
        ? void 0
        : _b.length;
    await commandLog
      .addDetail(
        `${
          (_c =
            repzo_brands === null || repzo_brands === void 0
              ? void 0
              : repzo_brands.data) === null || _c === void 0
            ? void 0
            : _c.length
        } Brand in Repzo`
      )
      .commit();
    for (
      let i = 0;
      i <
      (sap_brands === null || sap_brands === void 0
        ? void 0
        : sap_brands.length);
      i++
    ) {
      const sap_brand = sap_brands[i];
      const repzo_brand = repzo_brands.data.find((r_cat) => {
        var _a;
        return (
          ((_a = r_cat.integration_meta) === null || _a === void 0
            ? void 0
            : _a.id) == `${nameSpace}_${sap_brand.U_Code}`
        );
      });
      const body = {
        name: sap_brand.Name,
        disabled: false,
        integration_meta: { id: `${nameSpace}_${sap_brand.U_Code}` },
        company_namespace: [nameSpace],
      };
      if (!repzo_brand) {
        // Create
        try {
          const created_brand = await repzo.brand.create(body);
          result.created++;
        } catch (e) {
          // console.log("Create Brand Failed >> ", e?.response, body);
          failed_docs_report.push({
            method: "create",
            doc: body,
            error_message: set_error(e),
          });
          result.failed++;
        }
      } else {
        if (
          ((_d =
            repzo_brand === null || repzo_brand === void 0
              ? void 0
              : repzo_brand.integration_meta) === null || _d === void 0
            ? void 0
            : _d.id) ==
            ((_e =
              body === null || body === void 0
                ? void 0
                : body.integration_meta) === null || _e === void 0
              ? void 0
              : _e.id) &&
          (repzo_brand === null || repzo_brand === void 0
            ? void 0
            : repzo_brand.name) ==
            (body === null || body === void 0 ? void 0 : body.name) &&
          (repzo_brand === null || repzo_brand === void 0
            ? void 0
            : repzo_brand.disabled) == false
        ) {
          continue;
        }
        // Update
        try {
          const updated_brand = await repzo.brand.update(repzo_brand._id, body);
          result.updated++;
        } catch (e) {
          // console.log(
          //   "Update Brand Failed >> ",
          //   e?.response?.data,
          //   body
          // );
          failed_docs_report.push({
            method: "update",
            doc_id:
              repzo_brand === null || repzo_brand === void 0
                ? void 0
                : repzo_brand._id,
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
      ((_f = e === null || e === void 0 ? void 0 : e.response) === null ||
      _f === void 0
        ? void 0
        : _f.data) || e
    );
    await commandLog.setStatus("fail", e).commit();
    throw e;
  }
};
const get_sap_brands = async (serviceEndPoint, query) => {
  try {
    const sap_brands = await _create(serviceEndPoint, "/ParentCategory", {
      UpdateAt: "20201230:000000",
      Active: "Y",
    });
    return sap_brands.ItemSubGroup;
  } catch (e) {
    throw e;
  }
};
