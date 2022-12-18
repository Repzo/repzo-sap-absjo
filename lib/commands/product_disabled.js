import Repzo from "repzo";
import { _create, update_bench_time, date_formatting, set_error, } from "../util.js";
export const sync_disabled_product = async (commandEvent) => {
    var _a, _b, _c, _d;
    const repzo = new Repzo((_a = commandEvent.app.formData) === null || _a === void 0 ? void 0 : _a.repzoApiKey, {
        env: commandEvent.env,
    });
    const commandLog = new Repzo.CommandLog(repzo, commandEvent.app, commandEvent.command);
    try {
        console.log("sync_disabled_product");
        const new_bench_time = new Date().toISOString();
        const bench_time_key = "bench_time_product_disabled";
        await commandLog.load(commandEvent.sync_id);
        await commandLog
            .addDetail("Repzo SAP: Started Syncing Disabled Products")
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
        const sap_products = await get_sap_disabled_products(commandEvent.app.formData.sapHostUrl, { updateAt: commandEvent.app.options_formData[bench_time_key] });
        result.sap_total = sap_products === null || sap_products === void 0 ? void 0 : sap_products.length;
        await commandLog
            .addDetail(`${result.sap_total} Disabled Products in SAP changed since ${commandEvent.app.options_formData[bench_time_key] || "ever"}`)
            .commit();
        const sap_product_query = sap_products === null || sap_products === void 0 ? void 0 : sap_products.map((product) => `${nameSpace}_${product.ITEMCODE}`);
        const repzo_products = [];
        const per_page = 200;
        const pages = Math.ceil(sap_product_query.length / per_page);
        for (let i = 0; i < pages; i += per_page) {
            const repzo_product_per_page = await repzo.product.find({
                active: true,
                per_page: 50000,
                "integration_meta.id": sap_product_query.slice(i, i + per_page),
            });
            if ((_b = repzo_product_per_page === null || repzo_product_per_page === void 0 ? void 0 : repzo_product_per_page.data) === null || _b === void 0 ? void 0 : _b.length)
                repzo_products.push(...repzo_product_per_page.data);
        }
        result.repzo_total = repzo_products === null || repzo_products === void 0 ? void 0 : repzo_products.length;
        await commandLog
            .addDetail(`${result.repzo_total} Active Products in Repzo should be disabled`)
            .commit();
        for (let i = 0; i < (sap_products === null || sap_products === void 0 ? void 0 : sap_products.length); i++) {
            const sap_product = sap_products[i];
            const repzo_product = repzo_products.find((r_product) => {
                var _a;
                return ((_a = r_product === null || r_product === void 0 ? void 0 : r_product.integration_meta) === null || _a === void 0 ? void 0 : _a.id) ==
                    `${nameSpace}_${sap_product.ITEMCODE}`;
            });
            if (repzo_product) {
                // Update
                try {
                    const disabled_product = await repzo.product.remove(repzo_product._id);
                    result.updated++;
                }
                catch (e) {
                    console.log("Disabled Product Failed >> ", (_c = e === null || e === void 0 ? void 0 : e.response) === null || _c === void 0 ? void 0 : _c.data, {
                        ITEMCODE: sap_product.ITEMCODE,
                    });
                    failed_docs_report.push({
                        method: "delete",
                        doc_id: repzo_product === null || repzo_product === void 0 ? void 0 : repzo_product._id,
                        doc: { ITEMCODE: sap_product.ITEMCODE },
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
        console.error(((_d = e === null || e === void 0 ? void 0 : e.response) === null || _d === void 0 ? void 0 : _d.data) || e);
        await commandLog.setStatus("fail", e).commit();
        throw e;
    }
};
const get_sap_disabled_products = async (serviceEndPoint, query) => {
    try {
        const sap_products = await _create(serviceEndPoint, "/Items", {
            Active: "N",
            UpdateAt: date_formatting(query === null || query === void 0 ? void 0 : query.updateAt, "YYYYMMDD:HHmmss"),
        });
        return sap_products.Items;
    }
    catch (e) {
        throw e;
    }
};
