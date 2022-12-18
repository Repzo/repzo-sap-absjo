import Repzo from "repzo";
import DataSet from "data-set-query";
import { _create, update_bench_time, set_error, } from "../util.js";
export const sync_tax = async (commandEvent) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const repzo = new Repzo((_a = commandEvent.app.formData) === null || _a === void 0 ? void 0 : _a.repzoApiKey, {
        env: commandEvent.env,
    });
    const commandLog = new Repzo.CommandLog(repzo, commandEvent.app, commandEvent.command);
    try {
        console.log("sync_tax");
        const new_bench_time = new Date().toISOString();
        const bench_time_key = "bench_time_tax";
        await commandLog.load(commandEvent.sync_id);
        await commandLog.addDetail("Repzo SAP: Started Syncing Taxes").commit();
        const nameSpace = commandEvent.nameSpace.join("_");
        const result = {
            sap_total: 0,
            repzo_total: 0,
            created: 0,
            updated: 0,
            failed: 0,
        };
        const failed_docs_report = [];
        const sap_taxes = await get_sap_taxes(commandEvent.app.formData.sapHostUrl, {});
        result.sap_total = (_b = sap_taxes === null || sap_taxes === void 0 ? void 0 : sap_taxes.Taxes) === null || _b === void 0 ? void 0 : _b.length;
        await commandLog.addDetail(`${result.sap_total} taxes in SAP`).commit();
        const db = new DataSet([], { autoIndex: false });
        db.createIndex({
            TaxCode: true,
            TaxName: true,
            TaxRate: true,
            type: "additive",
        });
        db.load(sap_taxes === null || sap_taxes === void 0 ? void 0 : sap_taxes.Taxes);
        const repzo_taxes = await repzo.tax.find({ per_page: 50000 });
        result.repzo_total = (_c = repzo_taxes === null || repzo_taxes === void 0 ? void 0 : repzo_taxes.data) === null || _c === void 0 ? void 0 : _c.length;
        await commandLog
            .addDetail(`${(_d = repzo_taxes === null || repzo_taxes === void 0 ? void 0 : repzo_taxes.data) === null || _d === void 0 ? void 0 : _d.length} taxes in Repzo`)
            .commit();
        for (let i = 0; i < ((_e = sap_taxes === null || sap_taxes === void 0 ? void 0 : sap_taxes.Taxes) === null || _e === void 0 ? void 0 : _e.length); i++) {
            const sap_tax = sap_taxes.Taxes[i];
            const repzo_tax = repzo_taxes.data.find((r_tax) => { var _a; return ((_a = r_tax.integration_meta) === null || _a === void 0 ? void 0 : _a.id) == `${nameSpace}_${sap_tax.TaxCode}`; });
            const body = {
                name: sap_tax.TaxName,
                rate: Number(sap_tax.TaxRate / 100),
                type: "additive",
                disabled: sap_tax.Inactive === "N" ? false : true,
                integration_meta: {
                    id: `${nameSpace}_${sap_tax.TaxCode}`,
                    TaxCode: sap_tax.TaxCode,
                },
                company_namespace: [nameSpace],
            };
            if (!repzo_tax) {
                // Create
                try {
                    const created_tax = await repzo.tax.create(body);
                    result.created++;
                }
                catch (e) {
                    console.log("Create Tax Failed >> ", e === null || e === void 0 ? void 0 : e.response, body);
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
                    TaxCode: (_f = repzo_tax.integration_meta) === null || _f === void 0 ? void 0 : _f.TaxCode,
                    TaxName: repzo_tax.name,
                    TaxRate: repzo_tax.rate * 100,
                    type: repzo_tax.type,
                });
                if (found_identical_docs.length)
                    continue;
                // Update
                try {
                    const updated_tax = await repzo.tax.update(repzo_tax._id, body);
                    result.updated++;
                }
                catch (e) {
                    console.log("Update Tax Failed >> ", (_g = e === null || e === void 0 ? void 0 : e.response) === null || _g === void 0 ? void 0 : _g.data, body);
                    failed_docs_report.push({
                        method: "update",
                        doc_id: repzo_tax === null || repzo_tax === void 0 ? void 0 : repzo_tax._id,
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
        console.error(((_h = e === null || e === void 0 ? void 0 : e.response) === null || _h === void 0 ? void 0 : _h.data) || e);
        await commandLog.setStatus("fail", e).commit();
        throw e;
    }
};
const get_sap_taxes = async (serviceEndPoint, query) => {
    try {
        const sap_taxes = await _create(serviceEndPoint, "/Taxes", {
            Inactive: "N",
        });
        return sap_taxes;
    }
    catch (e) {
        throw e;
    }
};
