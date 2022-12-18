import Repzo from "repzo";
import DataSet from "data-set-query";
import { _create, update_bench_time, date_formatting, set_error, } from "../util.js";
export const sync_warehouse = async (commandEvent) => {
    var _a, _b, _c, _d, _e, _f, _g;
    const repzo = new Repzo((_a = commandEvent.app.formData) === null || _a === void 0 ? void 0 : _a.repzoApiKey, {
        env: commandEvent.env,
    });
    const commandLog = new Repzo.CommandLog(repzo, commandEvent.app, commandEvent.command);
    try {
        console.log("sync_warehouse");
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
        const sap_warehouses = await get_sap_warehouses(commandEvent.app.formData.sapHostUrl, {
            updateAt: commandEvent.app.formData.warehouseDefaultUpdateDate ||
                commandEvent.app.options_formData[bench_time_key],
        });
        result.sap_total = (_b = sap_warehouses === null || sap_warehouses === void 0 ? void 0 : sap_warehouses.Warehouses) === null || _b === void 0 ? void 0 : _b.length;
        await commandLog
            .addDetail(`${(_c = sap_warehouses === null || sap_warehouses === void 0 ? void 0 : sap_warehouses.Warehouses) === null || _c === void 0 ? void 0 : _c.length} warehouses changed since ${commandEvent.app.formData.warehouseDefaultUpdateDate ||
            commandEvent.app.options_formData[bench_time_key] ||
            "ever"}`)
            .commit();
        const db = new DataSet([], { autoIndex: false });
        db.createIndex({
            WAREHOUSECODE: true,
            WAREHOUSENAME: true,
        });
        db.load(sap_warehouses === null || sap_warehouses === void 0 ? void 0 : sap_warehouses.Warehouses);
        const repzo_warehouses = await repzo.warehouse.find({ per_page: 50000 });
        result.repzo_total = (_d = repzo_warehouses === null || repzo_warehouses === void 0 ? void 0 : repzo_warehouses.data) === null || _d === void 0 ? void 0 : _d.length;
        await commandLog
            .addDetail(`${(_e = repzo_warehouses === null || repzo_warehouses === void 0 ? void 0 : repzo_warehouses.data) === null || _e === void 0 ? void 0 : _e.length} warehouses in Repzo`)
            .commit();
        for (let i = 0; i < ((_f = sap_warehouses === null || sap_warehouses === void 0 ? void 0 : sap_warehouses.Warehouses) === null || _f === void 0 ? void 0 : _f.length); i++) {
            const sap_warehouse = sap_warehouses.Warehouses[i];
            const repzo_warehouse = repzo_warehouses.data.find((r_warehouse) => r_warehouse.code == sap_warehouse.WAREHOUSECODE ||
                r_warehouse.name == sap_warehouse.WAREHOUSENAME);
            const body = {
                _id: repzo_warehouse === null || repzo_warehouse === void 0 ? void 0 : repzo_warehouse._id,
                name: sap_warehouse.WAREHOUSENAME,
                code: sap_warehouse.WAREHOUSECODE,
                type: sap_warehouse.WAREHOUSECODE.indexOf("VS") == 0 ||
                    sap_warehouse.WAREHOUSECODE.indexOf("COOPS1") == 0
                    ? "van"
                    : "main",
                disabled: sap_warehouse.INACTIVE == "N" ? false : true,
            };
            if (!repzo_warehouse) {
                // Create
                try {
                    const created_warehouse = await repzo.warehouse.create(body);
                    result.created++;
                }
                catch (e) {
                    console.log("Create warehouse Failed >> ", e === null || e === void 0 ? void 0 : e.response, body);
                    failed_docs_report.push({
                        method: "create",
                        doc: body,
                        error_message: set_error(e),
                    });
                    result.failed++;
                }
            }
            else {
                const found_identical_docs = db.search({
                    WAREHOUSECODE: repzo_warehouse.code,
                    WAREHOUSENAME: repzo_warehouse.name,
                });
                if (found_identical_docs.length)
                    continue; // Nothing has changed so no need for updates
                // Update
                try {
                    const updated_warehouse = await repzo.warehouse.update(repzo_warehouse._id, body);
                    result.updated++;
                }
                catch (e) {
                    console.log("Update warehouse Failed >> ", e, body);
                    failed_docs_report.push({
                        method: "update",
                        doc_id: repzo_warehouse === null || repzo_warehouse === void 0 ? void 0 : repzo_warehouse._id,
                        doc: body,
                        error_message: set_error(e),
                    });
                    result.failed++;
                }
            }
        }
        // console.log(result);
        await update_bench_time(repzo, commandEvent.app._id, bench_time_key, new_bench_time, "YYYY-MM-DD");
        await commandLog
            .setStatus("success", failed_docs_report.length ? failed_docs_report : null)
            .setBody(result)
            .commit();
        return result;
    }
    catch (e) {
        //@ts-ignore
        console.error(((_g = e === null || e === void 0 ? void 0 : e.response) === null || _g === void 0 ? void 0 : _g.data) || e);
        await commandLog.setStatus("fail", e).commit();
        throw e === null || e === void 0 ? void 0 : e.response;
    }
};
const get_sap_warehouses = async (serviceEndPoint, query) => {
    try {
        const sap_warehouses = await _create(serviceEndPoint, "/Warehouses", {
            UpdateAt: date_formatting(query === null || query === void 0 ? void 0 : query.updateAt, "YYYYMMDD"),
            Inactive: "N",
            Locked: "N",
        });
        return sap_warehouses;
    }
    catch (e) {
        throw e;
    }
};
