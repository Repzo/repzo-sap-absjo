import Repzo from "repzo";
import DataSet from "data-set-query";
import { _create, update_bench_time, set_error } from "../util.js";
export const sync_measureunit = async (commandEvent) => {
  var _a, _b, _c, _d, _e, _f, _g, _h;
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
    // console.log("sync_measureunit");
    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_measureunit";
    await commandLog.load(commandEvent.sync_id);
    await commandLog
      .addDetail("Repzo SAP: Started Syncing Measure units")
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
    const sap_UoMs = await get_sap_UoMs(
      commandEvent.app.formData.sapHostUrl,
      {}
    );
    result.sap_total =
      sap_UoMs === null || sap_UoMs === void 0 ? void 0 : sap_UoMs.length;
    await commandLog
      .addDetail(`${result.sap_total} Unit of Measures in SAP`)
      .commit();
    // Get Repzo default measureunit
    const repzo_UoM_parent = await repzo.measureunit.find({
      parent: "nil",
      disabled: false,
    });
    if (
      !(repzo_UoM_parent === null || repzo_UoM_parent === void 0
        ? void 0
        : repzo_UoM_parent.data) ||
      ((_b =
        repzo_UoM_parent === null || repzo_UoM_parent === void 0
          ? void 0
          : repzo_UoM_parent.data) === null || _b === void 0
        ? void 0
        : _b.length) != 1
    )
      throw "the parent of measure unit is not found or the nameSpace has more than one";
    const repzo_parent_id = repzo_UoM_parent.data[0]._id;
    const repzo_UoMs = await repzo.measureunit.find({ per_page: 50000 });
    result.repzo_total =
      (_c =
        repzo_UoMs === null || repzo_UoMs === void 0
          ? void 0
          : repzo_UoMs.data) === null || _c === void 0
        ? void 0
        : _c.length;
    await commandLog
      .addDetail(
        `${
          (_d =
            repzo_UoMs === null || repzo_UoMs === void 0
              ? void 0
              : repzo_UoMs.data) === null || _d === void 0
            ? void 0
            : _d.length
        } Measure Units in Repzo`
      )
      .commit();
    const byProduct = {};
    sap_UoMs.forEach((unit) => {
      if (!byProduct[unit.ITEMCODE]) byProduct[unit.ITEMCODE] = [];
      byProduct[unit.ITEMCODE].push(unit);
    });
    Object.values(byProduct).forEach((units) => {
      var _a, _b, _c;
      const max_unit = {
        sap_product_UoMs: [],
        value: null,
        default_unit: null,
      };
      units.forEach((unit) => {
        if (max_unit.value == null || unit.BASEQTY > max_unit.value) {
          max_unit.value = unit.BASEQTY;
          max_unit.sap_product_UoMs.push(unit);
        } else if (unit.BASEQTY == max_unit.value) {
          max_unit.sap_product_UoMs.push(unit);
        }
      });
      if (max_unit.sap_product_UoMs.length > 1) {
        const PC = max_unit.sap_product_UoMs.find((u) => u.ALTUOMCODE == "PC");
        const POUCH = max_unit.sap_product_UoMs.find(
          (u) => u.ALTUOMCODE == "POUCH"
        );
        const CARD = max_unit.sap_product_UoMs.find(
          (u) => u.ALTUOMCODE == "CARD"
        );
        max_unit.default_unit = PC || POUCH || CARD;
        if (!max_unit.default_unit) {
          // console.log(
          //   "Create/Update Measure Unit Failed >> ",
          //   `${max_unit?.sap_product_UoMs[0]?.ITEMCODE} Could not found the base_unit`,
          //   units
          // );
          failed_docs_report.push({
            method: "create",
            doc_id:
              ((_a =
                max_unit === null || max_unit === void 0
                  ? void 0
                  : max_unit.sap_product_UoMs[0]) === null || _a === void 0
                ? void 0
                : _a.ITEMCODE) ||
              ((_b = units[0]) === null || _b === void 0
                ? void 0
                : _b.ITEMCODE),
            doc: units,
            error_message: set_error(
              `Create/Update Measure Unit Failed >> ${
                (_c =
                  max_unit === null || max_unit === void 0
                    ? void 0
                    : max_unit.sap_product_UoMs[0]) === null || _c === void 0
                  ? void 0
                  : _c.ITEMCODE
              } Could not found the base_unit`
            ),
          });
          result.failed++;
          return;
        }
      } else {
        max_unit.default_unit = max_unit.sap_product_UoMs[0];
      }
      units.forEach((unit) => {
        var _a;
        if (
          max_unit === null || max_unit === void 0
            ? void 0
            : max_unit.default_unit
        )
          unit.repzo_factor =
            (unit.ALTQTY / unit.BASEQTY) *
            ((_a =
              max_unit === null || max_unit === void 0
                ? void 0
                : max_unit.default_unit) === null || _a === void 0
              ? void 0
              : _a.BASEQTY);
      });
    });
    let unique_UoMs = {};
    for (
      let i = 0;
      i < (sap_UoMs === null || sap_UoMs === void 0 ? void 0 : sap_UoMs.length);
      i++
    ) {
      const Uom = sap_UoMs[i];
      const key = `${Uom.ITEMCODE}_${Uom.UOMGROUPENTRY}_${Uom.ALTUOMID}`;
      if (!unique_UoMs[key]) unique_UoMs[key] = Uom;
    }
    unique_UoMs = Object.values(unique_UoMs);
    const db = new DataSet([], { autoIndex: false });
    db.createIndex({
      ITEMCODE: true,
      ALTUOMCODE: true,
      repzo_factor: true,
      UOMGROUPENTRY: true,
      ALTUOMID: true,
    });
    db.load(unique_UoMs);
    for (
      let i = 0;
      i <
      (unique_UoMs === null || unique_UoMs === void 0
        ? void 0
        : unique_UoMs.length);
      i++
    ) {
      const sap_UoM = unique_UoMs[i];
      const repzo_UoM = repzo_UoMs.data.find((r_UoM) => {
        var _a;
        return (
          ((_a = r_UoM.integration_meta) === null || _a === void 0
            ? void 0
            : _a.id) ==
          `${nameSpace}_${sap_UoM.ITEMCODE}_${sap_UoM.UOMGROUPENTRY}_${sap_UoM.ALTUOMID}`
        );
      });
      const body = {
        parent: repzo_parent_id,
        name: sap_UoM.ALTUOMCODE,
        factor: sap_UoM.repzo_factor || 0,
        disabled: false,
        integration_meta: {
          id: `${nameSpace}_${sap_UoM.ITEMCODE}_${sap_UoM.UOMGROUPENTRY}_${sap_UoM.ALTUOMID}`,
          UOMGROUPENTRY: sap_UoM.UOMGROUPENTRY,
          ALTUOMID: sap_UoM.ALTUOMID,
          ITEMCODE: sap_UoM.ITEMCODE,
        },
        company_namespace: [nameSpace],
      };
      if (!repzo_UoM) {
        // Create
        try {
          const created_UoM = await repzo.measureunit.create(body);
          result.created++;
        } catch (e) {
          // console.log("Create Measure Unit Failed >> ", e?.response, body);
          failed_docs_report.push({
            method: "create",
            doc: body,
            error_message: set_error(e),
          });
          result.failed++;
        }
      } else {
        const found_identical_docs = db.search({
          ALTUOMCODE: repzo_UoM.name,
          repzo_factor: repzo_UoM.factor,
          ITEMCODE:
            (_e = repzo_UoM.integration_meta) === null || _e === void 0
              ? void 0
              : _e.ITEMCODE,
          UOMGROUPENTRY:
            (_f = repzo_UoM.integration_meta) === null || _f === void 0
              ? void 0
              : _f.UOMGROUPENTRY,
          ALTUOMID:
            (_g = repzo_UoM.integration_meta) === null || _g === void 0
              ? void 0
              : _g.ALTUOMID,
        });
        if (found_identical_docs.length) continue;
        // Update
        try {
          const updated_UoM = await repzo.measureunit.update(
            repzo_UoM._id,
            body
          );
          result.updated++;
        } catch (e) {
          // console.log(
          //   "Update Measure Unit Failed >> ",
          //   e?.response?.data,
          //   body
          // );
          failed_docs_report.push({
            method: "update",
            doc_id:
              repzo_UoM === null || repzo_UoM === void 0
                ? void 0
                : repzo_UoM._id,
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
      ((_h = e === null || e === void 0 ? void 0 : e.response) === null ||
      _h === void 0
        ? void 0
        : _h.data) || e
    );
    await commandLog.setStatus("fail", e).commit();
    throw e;
  }
};
export const get_sap_UoMs = async (serviceEndPoint, query) => {
  try {
    const sap_UoMs = await _create(serviceEndPoint, "/Uom", {
      Inactive: "N",
      Locked: "N",
    });
    return sap_UoMs === null || sap_UoMs === void 0 ? void 0 : sap_UoMs.UoM;
  } catch (e) {
    throw e;
  }
};
