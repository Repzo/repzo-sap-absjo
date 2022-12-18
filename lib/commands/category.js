import Repzo from "repzo";
import { _create, update_bench_time, set_error, } from "../util.js";
export const sync_category = async (commandEvent) => {
    var _a, _b, _c, _d, _e, _f, _g;
    const repzo = new Repzo((_a = commandEvent.app.formData) === null || _a === void 0 ? void 0 : _a.repzoApiKey, {
        env: commandEvent.env,
    });
    const commandLog = new Repzo.CommandLog(repzo, commandEvent.app, commandEvent.command);
    try {
        console.log("sync_category");
        const new_bench_time = new Date().toISOString();
        const bench_time_key = "bench_time_category";
        await commandLog.load(commandEvent.sync_id);
        await commandLog
            .addDetail("Repzo SAP: Started Syncing Product Categories")
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
        const sap_categories = await get_sap_categories(commandEvent.app.formData.sapHostUrl, {});
        result.sap_total = sap_categories === null || sap_categories === void 0 ? void 0 : sap_categories.length;
        await commandLog
            .addDetail(`${result.sap_total} Item Groups in SAP`)
            .commit();
        const repzo_categories = await repzo.category.find({
            per_page: 50000,
        });
        result.repzo_total = (_b = repzo_categories === null || repzo_categories === void 0 ? void 0 : repzo_categories.data) === null || _b === void 0 ? void 0 : _b.length;
        await commandLog
            .addDetail(`${(_c = repzo_categories === null || repzo_categories === void 0 ? void 0 : repzo_categories.data) === null || _c === void 0 ? void 0 : _c.length} Product Category in Repzo`)
            .commit();
        for (let i = 0; i < (sap_categories === null || sap_categories === void 0 ? void 0 : sap_categories.length); i++) {
            const sap_category = sap_categories[i];
            const repzo_category = repzo_categories.data.find((r_cat) => {
                var _a;
                return ((_a = r_cat.integration_meta) === null || _a === void 0 ? void 0 : _a.id) ==
                    `${nameSpace}_${sap_category.GROUPCODE}`;
            });
            const body = {
                name: sap_category.GROUPDESC,
                disabled: false,
                integration_meta: { id: `${nameSpace}_${sap_category.GROUPCODE}` },
                company_namespace: [nameSpace],
            };
            if (!repzo_category) {
                // Create
                try {
                    const created_category = await repzo.category.create(body);
                    result.created++;
                }
                catch (e) {
                    console.log("Create Product Category Failed >> ", e === null || e === void 0 ? void 0 : e.response, body);
                    failed_docs_report.push({
                        method: "create",
                        doc: body,
                        error_message: set_error(e),
                    });
                    result.failed++;
                }
            }
            else {
                if (((_d = repzo_category === null || repzo_category === void 0 ? void 0 : repzo_category.integration_meta) === null || _d === void 0 ? void 0 : _d.id) == ((_e = body === null || body === void 0 ? void 0 : body.integration_meta) === null || _e === void 0 ? void 0 : _e.id) &&
                    (repzo_category === null || repzo_category === void 0 ? void 0 : repzo_category.name) == (body === null || body === void 0 ? void 0 : body.name)) {
                    continue;
                }
                // Update
                try {
                    const updated_category = await repzo.category.update(repzo_category._id, body);
                    result.updated++;
                }
                catch (e) {
                    console.log("Update Product Category Failed >> ", (_f = e === null || e === void 0 ? void 0 : e.response) === null || _f === void 0 ? void 0 : _f.data, body);
                    failed_docs_report.push({
                        method: "update",
                        doc_id: repzo_category === null || repzo_category === void 0 ? void 0 : repzo_category._id,
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
        console.error(((_g = e === null || e === void 0 ? void 0 : e.response) === null || _g === void 0 ? void 0 : _g.data) || e);
        await commandLog.setStatus("fail", e).commit();
        throw e;
    }
};
const get_sap_categories = async (serviceEndPoint, query) => {
    try {
        const sap_categories = await _create(serviceEndPoint, "/ItemGroup", {});
        return sap_categories.ItemGroup;
    }
    catch (e) {
        throw e;
    }
};
