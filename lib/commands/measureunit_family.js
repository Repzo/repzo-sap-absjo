import Repzo from "repzo";
import _ from "lodash";
import { update_bench_time, set_error, } from "../util.js";
import { get_sap_UoMs } from "./measureunit.js";
export const sync_measureunit_family = async (commandEvent) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const repzo = new Repzo((_a = commandEvent.app.formData) === null || _a === void 0 ? void 0 : _a.repzoApiKey, {
        env: commandEvent.env,
    });
    const commandLog = new Repzo.CommandLog(repzo, commandEvent.app, commandEvent.command);
    try {
        console.log("sync_measureunit_family");
        const new_bench_time = new Date().toISOString();
        const bench_time_key = "bench_time_measureunit_family";
        await commandLog.load(commandEvent.sync_id);
        await commandLog
            .addDetail("Repzo SAP: Started Syncing Measure Units Family")
            .commit();
        const nameSpace = commandEvent.nameSpace.join("_");
        const result = {
            sap_total: 0,
            repzo_total: 0,
            sap_UoM_total: 0,
            repzo_UoM_total: 0,
            created: 0,
            updated: 0,
            failed: 0,
        };
        const failed_docs_report = [];
        const sap_UoMs = await get_sap_UoMs(commandEvent.app.formData.sapHostUrl, {});
        result.sap_UoM_total = sap_UoMs === null || sap_UoMs === void 0 ? void 0 : sap_UoMs.length;
        await commandLog
            .addDetail(`${result.sap_UoM_total} Unit of Measures in SAP`)
            .commit();
        let repzo_UoMs = await repzo.measureunit.find({
            disabled: false,
            per_page: 50000,
        });
        result.repzo_UoM_total = (_b = repzo_UoMs === null || repzo_UoMs === void 0 ? void 0 : repzo_UoMs.data) === null || _b === void 0 ? void 0 : _b.length;
        await commandLog
            .addDetail(`${(_c = repzo_UoMs === null || repzo_UoMs === void 0 ? void 0 : repzo_UoMs.data) === null || _c === void 0 ? void 0 : _c.length} Measure Units in Repzo`)
            .commit();
        if (!((_d = repzo_UoMs === null || repzo_UoMs === void 0 ? void 0 : repzo_UoMs.data) === null || _d === void 0 ? void 0 : _d.length)) {
            throw "measure units are not found or the nameSpace has more than one";
        }
        repzo_UoMs.data = (_e = repzo_UoMs.data) === null || _e === void 0 ? void 0 : _e.filter((UoM) => UoM.integration_meta);
        const repzo_UoMs_family = await repzo.measureunitFamily.find({
            disabled: false,
            per_page: 50000,
        });
        result.repzo_total = (_f = repzo_UoMs_family === null || repzo_UoMs_family === void 0 ? void 0 : repzo_UoMs_family.data) === null || _f === void 0 ? void 0 : _f.length;
        await commandLog
            .addDetail(`${(_g = repzo_UoMs_family === null || repzo_UoMs_family === void 0 ? void 0 : repzo_UoMs_family.data) === null || _g === void 0 ? void 0 : _g.length} Measure Units Family in Repzo`)
            .commit();
        const sap_unique_family = {};
        for (let i = 0; i < (sap_UoMs === null || sap_UoMs === void 0 ? void 0 : sap_UoMs.length); i++) {
            const sap_UoM = sap_UoMs[i];
            const key = sap_UoM.ITEMCODE;
            if (!sap_unique_family[key])
                sap_unique_family[key] = {};
            const uom_key = `${nameSpace}_${sap_UoM.UOMGROUPENTRY}_${sap_UoM.ALTUOMID}`;
            sap_unique_family[key][uom_key] = 1;
        }
        result.sap_total = (_h = Object.keys(sap_unique_family)) === null || _h === void 0 ? void 0 : _h.length;
        await commandLog
            .addDetail(`${result.sap_total} Measure Units Family in SAP`)
            .commit();
        for (let key in sap_unique_family) {
            const sap_family = sap_unique_family[key];
            const repzo_family = repzo_UoMs_family.data.find((r_family) => { var _a; return ((_a = r_family.integration_meta) === null || _a === void 0 ? void 0 : _a.id) == `${nameSpace}_${key}`; });
            let measureunits = [];
            Object.keys(sap_family).forEach((unit) => {
                var _a;
                {
                    const UoM = (_a = repzo_UoMs === null || repzo_UoMs === void 0 ? void 0 : repzo_UoMs.data) === null || _a === void 0 ? void 0 : _a.find((repzo_uom) => { var _a; return ((_a = repzo_uom === null || repzo_uom === void 0 ? void 0 : repzo_uom.integration_meta) === null || _a === void 0 ? void 0 : _a.id) == unit; });
                    if (UoM) {
                        measureunits.push(UoM._id.toString());
                    }
                }
            });
            const body = {
                name: key,
                disabled: false,
                integration_meta: { id: `${nameSpace}_${key}` },
                measureunits: measureunits || [],
                company_namespace: [nameSpace],
            };
            if (!repzo_family) {
                // Create
                try {
                    const created_UoM = await repzo.measureunitFamily.create(body);
                    result.created++;
                }
                catch (e) {
                    console.log("Create Measure Unit Family Failed >> ", e === null || e === void 0 ? void 0 : e.response, body);
                    failed_docs_report.push({
                        method: "create",
                        doc: body,
                        error_message: set_error(e),
                    });
                    result.failed++;
                }
            }
            else {
                if (repzo_family.name == body.name &&
                    !((_k = _.difference(((_j = repzo_family === null || repzo_family === void 0 ? void 0 : repzo_family.measureunits) === null || _j === void 0 ? void 0 : _j.map((m) => m === null || m === void 0 ? void 0 : m.toString())) || [], (body === null || body === void 0 ? void 0 : body.measureunits) || [])) === null || _k === void 0 ? void 0 : _k.length)) {
                    continue;
                }
                // Update
                try {
                    const updated_UoM = await repzo.measureunitFamily.update(repzo_family._id, body);
                    result.updated++;
                }
                catch (e) {
                    console.log("Update Measure Unit Family Failed >> ", (_l = e === null || e === void 0 ? void 0 : e.response) === null || _l === void 0 ? void 0 : _l.data, body);
                    failed_docs_report.push({
                        method: "update",
                        doc_id: repzo_family === null || repzo_family === void 0 ? void 0 : repzo_family._id,
                        doc: body,
                        error_message: set_error(e),
                    });
                    result.failed++;
                }
            }
        }
        // console.log(result);
        await update_bench_time(repzo, commandEvent.app._id, bench_time_key, new_bench_time);
        await commandLog
            .setStatus("success", failed_docs_report.length ? failed_docs_report : null)
            .setBody(result)
            .commit();
        return result;
    }
    catch (e) {
        //@ts-ignore
        console.error(((_m = e === null || e === void 0 ? void 0 : e.response) === null || _m === void 0 ? void 0 : _m.data) || e);
        await commandLog.setStatus("fail", e).commit();
        throw e;
    }
};
