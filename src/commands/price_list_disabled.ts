import Repzo from "repzo";
import { Service } from "repzo/src/types";
import DataSet from "data-set-query";
import { CommandEvent, Result, FailedDocsReport } from "../types";
import {
  _fetch,
  _create,
  _update,
  _delete,
  update_bench_time,
  date_formatting,
  set_error,
} from "../util.js";
import { SAPUoM, get_sap_UoMs } from "./measureunit.js";

interface SAPPriceListItem {
  PLDID: number; // 31,
  PLITEMID: string; // "010-HEI-HE0088",
  PLITEMPRICEVALUE: number; // 6.5864;
  PLITEMUNIT: string; // "CRTN",
  CREATEDATE: string; // "2021-12-07T21:00:00Z",
  UPDATEDATE: string; // "2022-11-29T21:00:00Z"
}

interface SAPPriceListItems {
  result: "Success";
  PriceList: SAPPriceListItem[];
}

export const sync_price_list_disabled = async (commandEvent: CommandEvent) => {
  const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
    env: commandEvent.env,
  });

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

    const nameSpace: string = commandEvent.nameSpace.join("_");

    const result = {
      repzo_PL_total: 0,
      sap_PL_items_total: 0,
      repzo_PL_items_total: 0,
      repzo_PL_items: { removed: 0, failed: 0 },
    };

    const failed_docs_report: FailedDocsReport = [];

    // Get Repzo Price Lists
    const repzo_price_lists = await repzo.priceList.find({
      per_page: 50000,
      disabled: false,
    });
    result.repzo_PL_total = repzo_price_lists?.data?.length;
    await commandLog
      .addDetail(
        `${repzo_price_lists?.data?.length} Active Price Lists in Repzo`
      )
      .commit();

    // Start Code Here ***********************************************************
    for (let i = 0; i < repzo_price_lists?.data?.length; i++) {
      const repzo_price_list = repzo_price_lists.data[i];

      await commandLog
        .addDetail(`Syncing Repzo Price List: ${repzo_price_list.name}`)
        .commit();

      if (!repzo_price_list?.integration_meta?.id) continue;
      const sap_price_list_id =
        repzo_price_list.integration_meta.id.split("_")[1];

      if (!sap_price_list_id) continue;

      const sap_price_list_items: SAPPriceListItem[] = await get_sap_price_list(
        commandEvent.app.formData.sapHostUrl,
        {
          updateAt: "20000101:000000",
          PLDID: sap_price_list_id,
        }
      );

      result.sap_PL_items_total += sap_price_list_items?.length || 0;

      // await commandLog
      //   .addDetail(
      //     `${sap_price_list_items.length} Price List Item in PL: ${sap_price_list_id} in SAP`,
      //   )
      //   .commit();

      const sap_items: {
        [key: string]: SAPPriceListItem;
      } = {};
      sap_price_list_items.forEach((sap_item) => {
        const key = `${nameSpace}_${sap_item.PLDID}_${sap_item.PLITEMID}`;
        sap_items[key] = sap_item;
      });

      const repzo_price_list_items = await repzo.priceListItem.find({
        disabled: false,
        pricelist_id: repzo_price_list?._id,
        per_page: 50000,
      });

      result.repzo_PL_items_total += repzo_price_list_items?.data?.length || 0;

      // await commandLog
      //   .addDetail(
      //     `${repzo_price_list_items?.data?.length} Price List Item in PL: ${repzo_price_list.name} in Repzo`,
      //   )
      //   .commit();

      for (let j = 0; j < repzo_price_list_items?.data?.length; j++) {
        const repzo_item = repzo_price_list_items.data[j];
        const repzo_item_integration_meta_id = repzo_item?.integration_meta?.id;
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
        } catch (e: any) {
          console.log(
            "Disable Price List Item Failed >> ",
            e?.response?.data,
            repzo_item
          );
          failed_docs_report.push({
            method: "update",
            doc_id: repzo_item?._id,
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
  } catch (e: any) {
    //@ts-ignore
    console.error(e?.response?.data || e);
    await commandLog.setStatus("fail", e).commit();
    throw e;
  }
};

const get_sap_price_list = async (
  serviceEndPoint: string,
  query?: { updateAt?: string; PLDID?: string }
): Promise<SAPPriceListItem[]> => {
  try {
    const sap_price_lists: SAPPriceListItems = (await _create(
      serviceEndPoint,
      "/PriceList",
      { UpdateAt: query?.updateAt, PLDID: query?.PLDID }
    )) as SAPPriceListItems;
    return sap_price_lists.PriceList;
  } catch (e: any) {
    throw e;
  }
};
