import Repzo from "repzo";
import DataSet from "data-set-query";
import { _create, update_bench_time, set_error } from "../util.js";
export const sync_tag = async (commandEvent) => {
  var _a, _b, _c, _d, _e, _f, _g;
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
    // console.log("sync_tag");
    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_tag";
    await commandLog.load(commandEvent.sync_id);
    await commandLog.addDetail("Repzo SAP: Started Syncing Tags").commit();
    const nameSpace = commandEvent.nameSpace.join("_");
    const result = {
      sap_total: 0,
      repzo_total: 0,
      created: 0,
      updated: 0,
      failed: 0,
    };
    const failed_docs_report = [];
    const sap_tags = await get_sap_tags(
      commandEvent.app.formData.sapHostUrl,
      {}
    );
    result.sap_total =
      (_b =
        sap_tags === null || sap_tags === void 0
          ? void 0
          : sap_tags.Territories) === null || _b === void 0
        ? void 0
        : _b.length;
    await commandLog
      .addDetail(`${result.sap_total} Territories in SAP`)
      .commit();
    const db = new DataSet([], { autoIndex: false });
    db.createIndex({
      TerritoryID: true,
      Description: true,
    });
    db.load(
      sap_tags === null || sap_tags === void 0 ? void 0 : sap_tags.Territories
    );
    const repzo_tags = await repzo.tag.find({ type: "area", per_page: 50000 });
    result.repzo_total =
      (_c =
        repzo_tags === null || repzo_tags === void 0
          ? void 0
          : repzo_tags.data) === null || _c === void 0
        ? void 0
        : _c.length;
    await commandLog
      .addDetail(
        `${
          (_d =
            repzo_tags === null || repzo_tags === void 0
              ? void 0
              : repzo_tags.data) === null || _d === void 0
            ? void 0
            : _d.length
        } Area Tags in Repzo`
      )
      .commit();
    for (
      let i = 0;
      i <
      ((_e =
        sap_tags === null || sap_tags === void 0
          ? void 0
          : sap_tags.Territories) === null || _e === void 0
        ? void 0
        : _e.length);
      i++
    ) {
      const sap_tag = sap_tags.Territories[i];
      const repzo_tag = repzo_tags.data.find((r_tag) => {
        var _a;
        return (
          ((_a = r_tag.integration_meta) === null || _a === void 0
            ? void 0
            : _a.id) == `${nameSpace}_${sap_tag.TerritoryID}`
        );
      });
      const body = {
        tag: sap_tag.Description,
        type: "area",
        disabled: false,
        integration_meta: {
          id: `${nameSpace}_${sap_tag.TerritoryID}`,
          TerritoryID: sap_tag.TerritoryID,
        },
        company_namespace: [nameSpace],
      };
      if (!repzo_tag) {
        // Create
        try {
          const created_tag = await repzo.tag.create(body);
          result.created++;
        } catch (e) {
          // console.log("Create Tag Failed >> ", e?.response, body);
          failed_docs_report.push({
            method: "create",
            doc: body,
            error_message: set_error(e),
          });
          result.failed++;
        }
      } else {
        const found_identical_docs = db.search({
          TerritoryID:
            (_f = repzo_tag.integration_meta) === null || _f === void 0
              ? void 0
              : _f.TerritoryID,
          Description: repzo_tag.tag,
        });
        if (found_identical_docs.length) continue;
        // Update
        try {
          const updated_tag = await repzo.tag.update(repzo_tag._id, body);
          result.updated++;
        } catch (e) {
          // console.log("Update Tag Failed >> ", e?.response?.data, body);
          failed_docs_report.push({
            method: "update",
            doc_id:
              repzo_tag === null || repzo_tag === void 0
                ? void 0
                : repzo_tag._id,
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
      ((_g = e === null || e === void 0 ? void 0 : e.response) === null ||
      _g === void 0
        ? void 0
        : _g.data) || e
    );
    await commandLog.setStatus("fail", e).commit();
    throw e;
  }
};
const get_sap_tags = async (serviceEndPoint, query) => {
  try {
    const sap_tags = await _create(serviceEndPoint, "/Territories", {
      Inactive: "N",
    });
    return sap_tags;
  } catch (e) {
    throw e;
  }
};
