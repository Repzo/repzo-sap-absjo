import Repzo from "repzo";
import { _create, update_bench_time, set_error } from "../util.js";
export const sync_price_list_disabled = async (commandEvent) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
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
    // console.log("sync_price_list_disabled");
    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_price_list_disabled";
    await commandLog.load(commandEvent.sync_id);
    await commandLog
      .addDetail("Repzo SAP: Started Syncing Disabled Price Lists")
      .commit();
    const nameSpace = commandEvent.nameSpace.join("_");
    const result = {
      repzo_PL_total: 0,
      sap_PL_items_total: 0,
      repzo_PL_items_total: 0,
      repzo_PL_items: { removed: 0, failed: 0 },
    };
    const failed_docs_report = [];
    // Get Repzo Price Lists
    const repzo_price_lists = await repzo.priceList.find({
      per_page: 50000,
      disabled: false,
    });
    result.repzo_PL_total =
      (_b =
        repzo_price_lists === null || repzo_price_lists === void 0
          ? void 0
          : repzo_price_lists.data) === null || _b === void 0
        ? void 0
        : _b.length;
    await commandLog
      .addDetail(
        `${
          (_c =
            repzo_price_lists === null || repzo_price_lists === void 0
              ? void 0
              : repzo_price_lists.data) === null || _c === void 0
            ? void 0
            : _c.length
        } Active Price Lists in Repzo`
      )
      .commit();
    // Start Code Here ***********************************************************
    for (
      let i = 0;
      i <
      ((_d =
        repzo_price_lists === null || repzo_price_lists === void 0
          ? void 0
          : repzo_price_lists.data) === null || _d === void 0
        ? void 0
        : _d.length);
      i++
    ) {
      const repzo_price_list = repzo_price_lists.data[i];
      await commandLog
        .addDetail(`Syncing Repzo Price List: ${repzo_price_list.name}`)
        .commit();
      if (
        !((_e =
          repzo_price_list === null || repzo_price_list === void 0
            ? void 0
            : repzo_price_list.integration_meta) === null || _e === void 0
          ? void 0
          : _e.id)
      )
        continue;
      const sap_price_list_id =
        repzo_price_list.integration_meta.id.split("_")[1];
      if (!sap_price_list_id) continue;
      const sap_price_list_items = await get_sap_price_list(
        commandEvent.app.formData.sapHostUrl,
        {
          updateAt: "20000101:000000",
          PLDID: sap_price_list_id,
        }
      );
      result.sap_PL_items_total +=
        (sap_price_list_items === null || sap_price_list_items === void 0
          ? void 0
          : sap_price_list_items.length) || 0;
      // await commandLog
      //   .addDetail(
      //     `${sap_price_list_items.length} Price List Item in PL: ${sap_price_list_id} in SAP`,
      //   )
      //   .commit();
      const sap_items = {};
      sap_price_list_items.forEach((sap_item) => {
        const key = `${nameSpace}_${sap_item.PLDID}_${sap_item.PLITEMID}`;
        sap_items[key] = sap_item;
      });
      const repzo_price_list_items = await repzo.priceListItem.find({
        disabled: false,
        pricelist_id:
          repzo_price_list === null || repzo_price_list === void 0
            ? void 0
            : repzo_price_list._id,
        per_page: 50000,
      });
      result.repzo_PL_items_total +=
        ((_f =
          repzo_price_list_items === null || repzo_price_list_items === void 0
            ? void 0
            : repzo_price_list_items.data) === null || _f === void 0
          ? void 0
          : _f.length) || 0;
      // await commandLog
      //   .addDetail(
      //     `${repzo_price_list_items?.data?.length} Price List Item in PL: ${repzo_price_list.name} in Repzo`,
      //   )
      //   .commit();
      for (
        let j = 0;
        j <
        ((_g =
          repzo_price_list_items === null || repzo_price_list_items === void 0
            ? void 0
            : repzo_price_list_items.data) === null || _g === void 0
          ? void 0
          : _g.length);
        j++
      ) {
        const repzo_item = repzo_price_list_items.data[j];
        const repzo_item_integration_meta_id =
          (_h =
            repzo_item === null || repzo_item === void 0
              ? void 0
              : repzo_item.integration_meta) === null || _h === void 0
            ? void 0
            : _h.id;
        if (!repzo_item_integration_meta_id) continue;
        if (sap_items[repzo_item_integration_meta_id]) continue;
        // disable Repzo PriceListItem
        try {
          await repzo.priceListItem.remove(repzo_item._id);
          // console.log({
          //   repzo_item_integration_meta_id,
          //   _id: repzo_item._id,
          // });
          result.repzo_PL_items.removed++;
        } catch (e) {
          console.log(
            "Disable Price List Item Failed >> ",
            (_j = e === null || e === void 0 ? void 0 : e.response) === null ||
              _j === void 0
              ? void 0
              : _j.data,
            repzo_item
          );
          failed_docs_report.push({
            method: "update",
            doc_id:
              repzo_item === null || repzo_item === void 0
                ? void 0
                : repzo_item._id,
            doc: repzo_item,
            error_message: set_error(e),
          });
          result.repzo_PL_items.failed++;
        }
      }
    }
    // ***************************************************************************
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
      ((_k = e === null || e === void 0 ? void 0 : e.response) === null ||
      _k === void 0
        ? void 0
        : _k.data) || e
    );
    await commandLog.setStatus("fail", e).commit();
    throw e;
  }
};
const get_sap_price_list = async (serviceEndPoint, query) => {
  try {
    const sap_price_lists = await _create(serviceEndPoint, "/PriceList", {
      UpdateAt: query === null || query === void 0 ? void 0 : query.updateAt,
      PLDID: query === null || query === void 0 ? void 0 : query.PLDID,
    });
    return sap_price_lists.PriceList;
  } catch (e) {
    throw e;
  }
};
