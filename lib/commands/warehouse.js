import Repzo from "repzo";
import DataSet from "data-set-query";
import {
  _create,
  update_bench_time,
  date_formatting,
  set_error,
} from "../util.js";
export const sync_warehouse = async (commandEvent) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
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
    // console.log("sync_warehouse");
    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_warehouse";
    await commandLog.load(commandEvent.sync_id);
    await commandLog
      .addDetail("Repzo SAP: Started Syncing Warehouses")
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
    const sap_warehouses = await get_sap_warehouses(
      commandEvent.app.formData.sapHostUrl,
      {
        updateAt:
          commandEvent.app.formData.warehouseDefaultUpdateDate ||
          ((_b = commandEvent.app.options_formData) === null || _b === void 0
            ? void 0
            : _b[bench_time_key]),
      }
    );
    result.sap_total =
      (_c =
        sap_warehouses === null || sap_warehouses === void 0
          ? void 0
          : sap_warehouses.Warehouses) === null || _c === void 0
        ? void 0
        : _c.length;
    await commandLog
      .addDetail(
        `${
          (_d =
            sap_warehouses === null || sap_warehouses === void 0
              ? void 0
              : sap_warehouses.Warehouses) === null || _d === void 0
            ? void 0
            : _d.length
        } warehouses changed since ${
          commandEvent.app.formData.warehouseDefaultUpdateDate ||
          ((_e = commandEvent.app.options_formData) === null || _e === void 0
            ? void 0
            : _e[bench_time_key]) ||
          "ever"
        }`
      )
      .commit();
    const db = new DataSet([], { autoIndex: false });
    db.createIndex({
      WAREHOUSECODE: true,
      WAREHOUSENAME: true,
      VIRTUALWAREHOUSECODE: true,
      VIRTUALWAREHOUSENAME: true,
    });
    db.load(
      sap_warehouses === null || sap_warehouses === void 0
        ? void 0
        : sap_warehouses.Warehouses
    );
    const repzo_warehouses = await repzo.warehouse.find({ per_page: 50000 });
    result.repzo_total =
      (_f =
        repzo_warehouses === null || repzo_warehouses === void 0
          ? void 0
          : repzo_warehouses.data) === null || _f === void 0
        ? void 0
        : _f.length;
    await commandLog
      .addDetail(
        `${
          (_g =
            repzo_warehouses === null || repzo_warehouses === void 0
              ? void 0
              : repzo_warehouses.data) === null || _g === void 0
            ? void 0
            : _g.length
        } warehouses in Repzo`
      )
      .commit();
    for (
      let i = 0;
      i <
      ((_h =
        sap_warehouses === null || sap_warehouses === void 0
          ? void 0
          : sap_warehouses.Warehouses) === null || _h === void 0
        ? void 0
        : _h.length);
      i++
    ) {
      const sap_warehouse = sap_warehouses.Warehouses[i];
      const repzo_warehouse = repzo_warehouses.data.find(
        (r_warehouse) =>
          r_warehouse.code == sap_warehouse.WAREHOUSECODE ||
          r_warehouse.name == sap_warehouse.WAREHOUSENAME
      );
      const body = {
        _id:
          repzo_warehouse === null || repzo_warehouse === void 0
            ? void 0
            : repzo_warehouse._id,
        name: sap_warehouse.WAREHOUSENAME,
        code: sap_warehouse.WAREHOUSECODE,
        type:
          sap_warehouse.WAREHOUSECODE.indexOf("VS") == 0 ||
          sap_warehouse.WAREHOUSECODE.indexOf("COOPS1") == 0
            ? "van"
            : "main",
        disabled: sap_warehouse.INACTIVE == "N" ? false : true,
        integration_meta: {
          is_virtual_warehouse: false,
          VIRTUALWAREHOUSECODE: sap_warehouse.VIRTUALWAREHOUSECODE,
          VIRTUALWAREHOUSENAME: sap_warehouse.VIRTUALWAREHOUSENAME,
        },
      };
      if (!repzo_warehouse) {
        // Create
        try {
          const created_warehouse = await repzo.warehouse.create(body);
          result.created++;
        } catch (e) {
          // console.log("Create warehouse Failed >> ", e?.response, body);
          failed_docs_report.push({
            method: "create",
            doc: body,
            error_message: set_error(e),
          });
          result.failed++;
        }
      } else {
        const found_identical_docs = db.search({
          WAREHOUSECODE: repzo_warehouse.code,
          WAREHOUSENAME: repzo_warehouse.name,
          VIRTUALWAREHOUSECODE:
            (_j = repzo_warehouse.integration_meta) === null || _j === void 0
              ? void 0
              : _j.VIRTUALWAREHOUSECODE,
          VIRTUALWAREHOUSENAME:
            (_k = repzo_warehouse.integration_meta) === null || _k === void 0
              ? void 0
              : _k.VIRTUALWAREHOUSENAME,
        });
        if (found_identical_docs.length) continue; // Nothing has changed so no need for updates
        // Update
        try {
          const updated_warehouse = await repzo.warehouse.update(
            repzo_warehouse._id,
            body
          );
          result.updated++;
        } catch (e) {
          // console.log("Update warehouse Failed >> ", e, body);
          failed_docs_report.push({
            method: "update",
            doc_id:
              repzo_warehouse === null || repzo_warehouse === void 0
                ? void 0
                : repzo_warehouse._id,
            doc: body,
            error_message: set_error(e),
          });
          result.failed++;
        }
      }
    }
    if (
      (_m =
        (_l = commandEvent.app.formData) === null || _l === void 0
          ? void 0
          : _l.virtualWarehouses) === null || _m === void 0
        ? void 0
        : _m.consider_virtual_warehouse
    ) {
      await commandLog
        .addDetail("Repzo SAP: Started Syncing Virtual Warehouses")
        .commit();
      const unique_virtual_warehouses = {};
      (_o =
        sap_warehouses === null || sap_warehouses === void 0
          ? void 0
          : sap_warehouses.Warehouses) === null || _o === void 0
        ? void 0
        : _o.forEach((sap_warehouse) => {
            if (
              sap_warehouse.VIRTUALWAREHOUSECODE &&
              sap_warehouse.VIRTUALWAREHOUSENAME
            ) {
              if (
                !unique_virtual_warehouses[sap_warehouse.VIRTUALWAREHOUSECODE]
              ) {
                unique_virtual_warehouses[sap_warehouse.VIRTUALWAREHOUSECODE] =
                  {
                    code: sap_warehouse.VIRTUALWAREHOUSECODE,
                    name: sap_warehouse.VIRTUALWAREHOUSENAME,
                    main_warehouses_codes: [sap_warehouse.WAREHOUSECODE],
                  };
              } else {
                unique_virtual_warehouses[
                  sap_warehouse.VIRTUALWAREHOUSECODE
                ].main_warehouses_codes.push(sap_warehouse.WAREHOUSECODE);
              }
            }
          });
      const sap_virtual_warehouses = Object.values(unique_virtual_warehouses);
      await commandLog
        .addDetail(
          `${
            sap_virtual_warehouses === null || sap_virtual_warehouses === void 0
              ? void 0
              : sap_virtual_warehouses.length
          } virtual warehouses changed since ever`
        )
        .commit();
      const db_2 = new DataSet([], { autoIndex: false });
      db_2.createIndex({ name: true, code: true, main_warehouses_codes: true });
      db_2.load(Object.values(sap_virtual_warehouses));
      for (let i = 0; i < sap_virtual_warehouses.length; i++) {
        const sap_warehouse = sap_virtual_warehouses[i];
        const repzo_warehouse = repzo_warehouses.data.find((r_warehouse) => {
          var _a, _b;
          return (
            ((_a = r_warehouse.integration_meta) === null || _a === void 0
              ? void 0
              : _a.is_virtual_warehouse) &&
            (((_b = r_warehouse.integration_meta) === null || _b === void 0
              ? void 0
              : _b.code) == `Virtual ${sap_warehouse.code}` ||
              r_warehouse.name == sap_warehouse.name)
          );
        });
        const body = {
          _id:
            repzo_warehouse === null || repzo_warehouse === void 0
              ? void 0
              : repzo_warehouse._id,
          name: sap_warehouse.name,
          code: `Virtual ${sap_warehouse.code}`,
          type: "main",
          disabled: false,
          integration_meta: {
            is_virtual_warehouse: true,
            main_warehouses_codes:
              unique_virtual_warehouses[sap_warehouse.code]
                .main_warehouses_codes,
            VIRTUALWAREHOUSECODE: sap_warehouse.code,
            VIRTUALWAREHOUSENAME: sap_warehouse.name,
          },
        };
        if (!repzo_warehouse) {
          // Create
          try {
            const created_warehouse = await repzo.warehouse.create(body);
            result.created++;
          } catch (e) {
            // console.log("Create warehouse Failed >> ", e?.response, body);
            failed_docs_report.push({
              method: "create",
              doc: body,
              error_message: set_error(e),
            });
            result.failed++;
          }
        } else {
          const found_identical_docs = db_2.search({
            code: repzo_warehouse.code,
            name: repzo_warehouse.name,
            main_warehouses_codes:
              ((_p = repzo_warehouse.integration_meta) === null || _p === void 0
                ? void 0
                : _p.main_warehouses_codes) || [],
          });
          if (found_identical_docs.length) continue; // Nothing has changed so no need for updates
          // Update
          try {
            const updated_warehouse = await repzo.warehouse.update(
              repzo_warehouse._id,
              body
            );
            result.updated++;
          } catch (e) {
            // console.log("Update warehouse Failed >> ", e, body);
            failed_docs_report.push({
              method: "update",
              doc_id:
                repzo_warehouse === null || repzo_warehouse === void 0
                  ? void 0
                  : repzo_warehouse._id,
              doc: body,
              error_message: set_error(e),
            });
            result.failed++;
          }
        }
      }
    }
    // console.log(result);
    await update_bench_time(
      repzo,
      commandEvent.app._id,
      bench_time_key,
      new_bench_time,
      "YYYY-MM-DD"
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
      ((_q = e === null || e === void 0 ? void 0 : e.response) === null ||
      _q === void 0
        ? void 0
        : _q.data) || e
    );
    await commandLog.setStatus("fail", e).commit();
    throw e === null || e === void 0 ? void 0 : e.response;
  }
};
const get_sap_warehouses = async (serviceEndPoint, query) => {
  try {
    const sap_warehouses = await _create(serviceEndPoint, "/Warehouses", {
      UpdateAt: date_formatting(
        query === null || query === void 0 ? void 0 : query.updateAt,
        "YYYYMMDD"
      ),
      Inactive: "N",
      Locked: "N",
    });
    return sap_warehouses;
  } catch (e) {
    throw e;
  }
};
