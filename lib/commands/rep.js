import Repzo from "repzo";
import DataSet from "data-set-query";
import { _create, update_bench_time, set_error } from "../util.js";
export const sync_rep = async (commandEvent) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
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
    console.log("sync_rep");
    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_rep";
    const consider_virtual_warehouse =
      ((_c =
        (_b = commandEvent.app.formData) === null || _b === void 0
          ? void 0
          : _b.virtualWarehouses) === null || _c === void 0
        ? void 0
        : _c.consider_virtual_warehouse) || false;
    await commandLog.load(commandEvent.sync_id);
    await commandLog.addDetail("Repzo SAP: Started Syncing Reps").commit();
    const nameSpace = commandEvent.nameSpace.join("_");
    const result = {
      sap_total: 0,
      repzo_total: 0,
      created: 0,
      updated: 0,
      failed: 0,
    };
    const failed_docs_report = [];
    const sap_reps = await get_sap_reps(
      commandEvent.app.formData.sapHostUrl,
      {}
    );
    result.sap_total =
      (_d =
        sap_reps === null || sap_reps === void 0 ? void 0 : sap_reps.Users) ===
        null || _d === void 0
        ? void 0
        : _d.length;
    await commandLog.addDetail(`${result.sap_total} reps in SAP`).commit();
    // hard code ************************************
    // sap_reps?.Users?.forEach((sap_rep) => {
    //   if (
    //     sap_rep.USERDESC.startsWith("WS ") ||
    //     sap_rep.USERDESC.startsWith("RET ")
    //   ) {
    //     sap_rep.USERWHSCODE = "1";
    //   }
    //   if (sap_rep.USERDESC.startsWith("MT ")) {
    //     sap_rep.USERWHSCODE = "K.A";
    //   }
    // });
    // **********************************************
    const db = new DataSet([], { autoIndex: false });
    db.createIndex({
      USERID: true,
      USERDESC: true,
      DEPARTMENTCODE: true,
      USERCASHACCOUNT: true,
      USERCHECKACCTCODE: true,
      USERWHSCODE: true,
      INVOICESTATUS: true,
      VIRTUALWAREHOUSECODE: true,
      VIRTUALWAREHOUSENAME: true,
    });
    db.load(sap_reps === null || sap_reps === void 0 ? void 0 : sap_reps.Users);
    const repzo_reps = await repzo.rep.find({ per_page: 50000 });
    result.repzo_total =
      (_e =
        repzo_reps === null || repzo_reps === void 0
          ? void 0
          : repzo_reps.data) === null || _e === void 0
        ? void 0
        : _e.length;
    await commandLog
      .addDetail(
        `${
          (_f =
            repzo_reps === null || repzo_reps === void 0
              ? void 0
              : repzo_reps.data) === null || _f === void 0
            ? void 0
            : _f.length
        } reps in Repzo`
      )
      .commit();
    // Get Repzo Warehouse
    const repzo_warehouses = await repzo.warehouse.find({
      per_page: 50000,
      disabled: false,
    });
    for (
      let i = 0;
      i <
      ((_g =
        sap_reps === null || sap_reps === void 0 ? void 0 : sap_reps.Users) ===
        null || _g === void 0
        ? void 0
        : _g.length);
      i++
    ) {
      const sap_rep = sap_reps.Users[i];
      const repzo_rep = repzo_reps.data.find((r_rep) => {
        var _a;
        return (
          ((_a = r_rep.integration_meta) === null || _a === void 0
            ? void 0
            : _a.id) == `${nameSpace}_${sap_rep.USERID}`
        );
      });
      let warehouse;
      if (sap_rep.USERWHSCODE && sap_rep.USERWHSCODE != "") {
        const warehouse_res =
          repzo_warehouses === null || repzo_warehouses === void 0
            ? void 0
            : repzo_warehouses.data.find((w) => w.code == sap_rep.USERWHSCODE);
        // await repzo.warehouse.find({ code: sap_rep.USERWHSCODE });
        if (warehouse_res) warehouse = warehouse_res._id;
      }
      let virtual_warehouse;
      if (consider_virtual_warehouse && sap_rep.VIRTUALWAREHOUSECODE) {
        const virtual_warehouse_res =
          repzo_warehouses === null || repzo_warehouses === void 0
            ? void 0
            : repzo_warehouses.data.find((w) => {
                var _a;
                return (
                  ((_a = w.integration_meta) === null || _a === void 0
                    ? void 0
                    : _a.is_virtual_warehouse) &&
                  w.code == `Virtual ${sap_rep.VIRTUALWAREHOUSECODE}`
                );
              });
        if (virtual_warehouse_res)
          virtual_warehouse = virtual_warehouse_res._id;
      }
      const body = {
        name: sap_rep.USERDESC,
        password: Math.round(Math.random() * (9999 - 1000) + 1000).toString(),
        username: nameSpace + sap_rep.USERID,
        integration_id:
          (_h = sap_rep.USERID) === null || _h === void 0
            ? void 0
            : _h.toString(),
        integration_meta: {
          DEPARTMENTCODE: sap_rep.DEPARTMENTCODE,
          USERCASHACCOUNT: sap_rep.USERCASHACCOUNT,
          USERCHECKACCTCODE: sap_rep.USERCHECKACCTCODE,
          USERWHSCODE: sap_rep.USERWHSCODE,
          INVOICESTATUS: sap_rep.INVOICESTATUS,
          VIRTUALWAREHOUSECODE: sap_rep.VIRTUALWAREHOUSECODE,
          VIRTUALWAREHOUSENAME: sap_rep.VIRTUALWAREHOUSENAME,
          id: `${nameSpace}_${sap_rep.USERID}`,
        },
        assigned_warehouse: virtual_warehouse || warehouse,
        company_namespace: [nameSpace],
        "settings.treating_invoice_as_proforma_for_etax":
          sap_rep.INVOICESTATUS === "Y" ? true : false,
      };
      if (!repzo_rep) {
        // Create
        try {
          const created_rep = await repzo.rep.create(body);
          result.created++;
        } catch (e) {
          // console.log("Create Rep Failed >> ", e?.response, body);
          failed_docs_report.push({
            method: "create",
            doc: body,
            error_message: set_error(e),
          });
          result.failed++;
        }
      } else {
        const found_identical_docs = db.search({
          USERID: repzo_rep.integration_id,
          USERDESC: repzo_rep.name,
          DEPARTMENTCODE:
            (_j = repzo_rep.integration_meta) === null || _j === void 0
              ? void 0
              : _j.DEPARTMENTCODE,
          USERCASHACCOUNT:
            (_k = repzo_rep.integration_meta) === null || _k === void 0
              ? void 0
              : _k.USERCASHACCOUNT,
          USERCHECKACCTCODE:
            (_l = repzo_rep.integration_meta) === null || _l === void 0
              ? void 0
              : _l.USERCHECKACCTCODE,
          USERWHSCODE:
            (_m = repzo_rep.integration_meta) === null || _m === void 0
              ? void 0
              : _m.USERWHSCODE,
          INVOICESTATUS:
            (_o = repzo_rep.integration_meta) === null || _o === void 0
              ? void 0
              : _o.INVOICESTATUS,
          VIRTUALWAREHOUSECODE:
            (_p = repzo_rep.integration_meta) === null || _p === void 0
              ? void 0
              : _p.VIRTUALWAREHOUSECODE,
          VIRTUALWAREHOUSENAME:
            (_q = repzo_rep.integration_meta) === null || _q === void 0
              ? void 0
              : _q.VIRTUALWAREHOUSENAME,
        });
        if (found_identical_docs.length) continue;
        // Update
        try {
          // Delete Rep.Password
          delete body.password;
          const updated_rep = await repzo.rep.update(repzo_rep._id, body);
          result.updated++;
        } catch (e) {
          // console.log("Update Rep Failed >> ", e?.response?.data, body);
          failed_docs_report.push({
            method: "update",
            doc_id:
              repzo_rep === null || repzo_rep === void 0
                ? void 0
                : repzo_rep._id,
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
      ((_r = e === null || e === void 0 ? void 0 : e.response) === null ||
      _r === void 0
        ? void 0
        : _r.data) || e
    );
    await commandLog.setStatus("fail", e).commit();
    throw e;
  }
};
const get_sap_reps = async (serviceEndPoint, query) => {
  try {
    const sap_reps = await _create(serviceEndPoint, "/Users", {});
    return sap_reps;
  } catch (e) {
    throw e;
  }
};
