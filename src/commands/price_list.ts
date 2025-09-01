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

export const sync_price_list = async (commandEvent: CommandEvent) => {
  const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
    env: commandEvent.env,
  });

  const commandLog = new Repzo.CommandLog(
    repzo,
    commandEvent.app,
    commandEvent.command
  );
  try {
    // console.log("sync_price_list");

    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_price_list";

    await commandLog.load(commandEvent.sync_id);
    await commandLog
      .addDetail("Repzo SAP: Started Syncing Price Lists")
      .commit();

    const nameSpace: string = commandEvent.nameSpace.join("_");
    const result = {
      PL: { created: 0, updated: 0, failed: 0 },
      PL_items: { created: 0, updated: 0, failed: 0 },
      sap_total: 0,
      repzo_total: 0,
      repzo_PL_items: 0,
      sap_UoMs_total: 0,
      repzo_products_total: 0,
    };
    const failed_docs_report: FailedDocsReport = [];

    // Get SAP Price Lists
    const sap_price_lists: SAPPriceListItem[] = await get_sap_price_list(
      commandEvent.app.formData.sapHostUrl,
      { updateAt: commandEvent.app.options_formData?.[bench_time_key] }
    );
    result.sap_total = sap_price_lists?.length;

    await commandLog
      .addDetail(
        `${result.sap_total} Price Lists in SAP changed since ${
          commandEvent.app.options_formData?.[bench_time_key] || "ever"
        }`
      )
      .commit();

    // Get SAP UoMs
    const sap_UoMs: SAPUoM[] = await get_sap_UoMs(
      commandEvent.app.formData.sapHostUrl,
      {}
    );
    result.sap_UoMs_total = sap_UoMs?.length;

    await commandLog
      .addDetail(`${result.sap_total} Unit of Measures in SAP`)
      .commit();

    // Get Repzo Price Lists
    const repzo_price_lists = await repzo.priceList.find({ per_page: 50000 });
    result.repzo_total = repzo_price_lists?.data?.length;
    await commandLog
      .addDetail(`${repzo_price_lists?.data?.length} Price Lists in Repzo`)
      .commit();

    // Get Repzo Products
    const repzo_products = await repzo.product.find({
      active: true,
      withVariants: true,
      per_page: 50000,
    });
    result.repzo_products_total = repzo_products?.data?.length;
    await commandLog
      .addDetail(`${repzo_products?.data?.length} Products in Repzo`)
      .commit();

    // Get Repzo MeasureUnits
    const repzo_UoMs = await repzo.measureunit.find({
      disabled: false,
      per_page: 50000,
    });
    result.repzo_total = repzo_UoMs?.data?.length;
    await commandLog
      .addDetail(`${repzo_UoMs?.data?.length} Measure Units in Repzo`)
      .commit();

    if (!repzo_UoMs?.data?.length) throw "MeasureUnits in Repzo was not found";

    const sap_unique_UoMs: { [key: string]: number } = {};
    sap_UoMs.forEach((doc) => {
      const key: string = `${doc.ITEMCODE}__${doc.ALTUOMCODE}`;
      sap_unique_UoMs[key] = doc.ALTQTY;
    });

    // Get Repzo {Product_sku : product_default_measureunit_name}
    const repzo_product_default_measureunit: {
      [productSKU: string]: string | null;
    } = {};
    repzo_products.data.forEach((product) => {
      if (!product.sku) return;
      if (!product.sv_measureUnit) {
        repzo_product_default_measureunit[product.sku] = null;
      } else {
        const default_measureunit = repzo_UoMs.data.find(
          (m) => m._id == product.sv_measureUnit
        );
        if (default_measureunit) {
          repzo_product_default_measureunit[product.sku] =
            default_measureunit.name;
        } else {
          repzo_product_default_measureunit[product.sku] = null;
        }
      }
    });

    // sort the data
    const priceLists_withItems: { [key: string]: SAPPriceListItem[] } = {};
    sap_price_lists.forEach((doc) => {
      if (!priceLists_withItems[doc.PLDID])
        priceLists_withItems[doc.PLDID] = [];
      priceLists_withItems[doc.PLDID].push(doc);
    });

    // create priceLists
    const priceLists_names = Object.keys(priceLists_withItems);
    for (let i = 0; i < priceLists_names.length; i++) {
      const price_list_name = priceLists_names[i];
      const body = {
        name: `PL_${price_list_name}`,
        integration_meta: { id: `${nameSpace}_${price_list_name}` },
      };

      const repzo_price_list = repzo_price_lists?.data?.find(
        (pl) => pl?.integration_meta?.id == body?.integration_meta?.id
      );

      if (!repzo_price_list) {
        // Create
        try {
          const created_price_list = await repzo.priceList.create(
            body as Service.PriceList.Create.Body
          );
          result.PL.created++;
        } catch (e: any) {
          // console.log("Create Price List Failed >> ", e?.response, body);
          failed_docs_report.push({
            method: "create",
            doc: body,
            error_message: set_error(e),
          });
          result.PL.failed++;
        }
      } else {
        if (repzo_price_list?.name == body?.name) continue;
        // Update
        try {
          const updated_price_list = await repzo.priceList.update(
            repzo_price_list._id,
            body as Service.PriceList.Update.Body
          );
          result.PL.updated++;
        } catch (e: any) {
          // console.log("Update Price List Failed >> ", e?.response?.data, body);
          failed_docs_report.push({
            method: "update",
            doc_id: repzo_price_list?._id,
            doc: body,
            error_message: set_error(e),
          });
          result.PL.failed++;
        }
      }
    }
    // Price List Items ***************************************

    await commandLog
      .addDetail(`Start Sync Price List Items From SAP to Repzo`)
      .commit();

    const repzo_all_priceLists = await repzo.priceList.find({
      disabled: false,
      per_page: 50000,
    });
    await commandLog
      .addDetail(`${repzo_all_priceLists?.data?.length} Price Lists in Repzo`)
      .commit();

    if (!repzo_all_priceLists?.data?.length)
      throw `No Price Lists was found On Repzo`;

    for (let priceList_name in priceLists_withItems) {
      const repzo_PriceList = repzo_all_priceLists?.data?.find(
        (pl) => pl.integration_meta?.id == `${nameSpace}_${priceList_name}`
      );
      if (!repzo_PriceList) {
        // console.log(
        //   `Price list with PLDID: ${priceList_name} was not created or disabled`
        // );
        failed_docs_report.push({
          method: "create",
          // doc: priceLists_withItems[priceList_name],
          error_message: set_error(
            `Failed Create PriceList Items: number of PL items: ${priceLists_withItems[priceList_name].length} => Because Price list with PLDID: ${priceList_name} was not created or disabled`
          ),
        });
        result.PL_items.failed +=
          priceLists_withItems[priceList_name]?.length || 0;
        continue;
      }

      const repzo_price_list_items = await repzo.priceListItem.find({
        // disabled: false,
        pricelist_id: repzo_PriceList?._id,
        per_page: 50000,
      });

      // Create Price list items
      const priceList_items: {
        [ket: string]: any;
      } = {};
      priceLists_withItems[priceList_name].forEach((doc: any) => {
        if (!sap_unique_UoMs[`${doc.PLITEMID}__${doc.PLITEMUNIT}`]) {
          // console.log(
          //   `error => ${doc.PLITEMID}__${doc.PLITEMUNIT} was not found on the Uom`
          // );
          failed_docs_report.push({
            method: "create",
            // doc: priceLists_withItems[priceList_name],
            error_message: set_error(
              `Create PL items => PLITEMID: ${doc.PLITEMID}, PLITEMUNIT:${doc.PLITEMUNIT} was not found on the Uom`
            ),
          });
          result.PL_items.failed++;
          return;
        }
        doc.factor = sap_unique_UoMs[`${doc.PLITEMID}__${doc.PLITEMUNIT}`];
        const key = `${doc.PLITEMID}`;
        if (!priceList_items[key]) {
          priceList_items[key] = doc;
        } else {
          const current_doc = priceList_items[key];
          if (
            current_doc.PLITEMUNIT !=
            repzo_product_default_measureunit[current_doc.PLITEMID]
          ) {
            if (
              doc.PLITEMUNIT ==
              repzo_product_default_measureunit[current_doc.PLITEMID]
            ) {
              priceList_items[key] = doc;
            } else if (current_doc?.factor > doc?.factor) {
              priceList_items[key] = doc;
            }
          }
        }
      });

      const priceListItems = Object.values(priceList_items);
      for (let j = 0; j < priceListItems.length; j++) {
        const item = priceListItems[j];
        if (!item.factor && item.factor !== 0) {
          failed_docs_report.push({
            method: "create",
            // doc: priceLists_withItems[priceList_name],
            error_message: set_error(
              `Price List: ${item.PLDID} of Product with PLITEMID: ${item.PLITEMID} does not have Uom`
            ),
          });
          result.PL_items.failed++;
          continue;
        }

        const repzo_product = repzo_products?.data?.find(
          (product) =>
            product?.integration_meta?.id == `${nameSpace}_${item.PLITEMID}`
        );

        if (!repzo_product) {
          failed_docs_report.push({
            method: "create",
            // doc: priceLists_withItems[priceList_name],
            error_message: set_error(
              `Price List: ${item.PLDID} of Product with PLITEMID: ${item.PLITEMID} was not found or disabled`
            ),
          });
          result.PL_items.failed++;
          continue;
        }

        const repzo_product_uoms = repzo_UoMs?.data?.filter(
          (uom) =>
            uom?._id?.toString() == repzo_product?.sv_measureUnit?.toString() ||
            repzo_product.measureunit_family?.includes(uom?._id?.toString())
        );

        const repzo_product_uom = repzo_product_uoms.find(
          (uom) => uom.name == item.PLITEMUNIT
        );

        if (!repzo_product_uom) {
          failed_docs_report.push({
            method: "create",
            // doc: priceLists_withItems[priceList_name],
            error_message: set_error(
              `Price List: ${
                item.PLDID
              } of MeasureUnit with _id: ${repzo_product?.sv_measureUnit?.toString()} was not found or disabled`
            ),
          });
          result.PL_items.failed++;
          continue;
        }

        const price =
          repzo_product_uom && repzo_product_uom?.factor == 1
            ? Math.ceil(item.PLITEMPRICEVALUE * 1000)
            : Math.ceil(
                (item.PLITEMPRICEVALUE * 1000) / repzo_product_uom.factor
              );

        const variant = repzo_product?.variants?.find(
          (variant: any) =>
            variant?.integration_meta?.id == `${nameSpace}_${item.PLITEMID}`
        );
        if (!variant) {
          // console.log(
          //   `Price List: ${item.PLDID} of Variant with PLITEMID: ${item.PLITEMID} was not found`
          // );
          failed_docs_report.push({
            method: "create",
            // doc: priceLists_withItems[priceList_name],
            error_message: set_error(
              `Price List: ${item.PLDID} of Variant with PLITEMID: ${item.PLITEMID} was not found`
            ),
          });
          result.PL_items.failed++;
          continue;
        }

        const body = {
          integration_meta: {
            id: `${nameSpace}_${item.PLDID}_${item.PLITEMID}`,
          },
          product_id: repzo_product._id,
          variant_id: variant._id,
          pricelist_id: repzo_PriceList._id,
          price: price,
          disabled: false,
        };

        // console.log(data);

        const is_found_in_repzo_db = repzo_price_list_items?.data?.find(
          (item) => item?.integration_meta?.id == body?.integration_meta?.id
        );

        // console.log(`${data.integration_meta?.id} => ${is_found_in_repzo_db ? "create" : "update"}`)

        if (!is_found_in_repzo_db) {
          // Create
          try {
            const created_PL_item = await repzo.priceListItem.create(
              body as Service.PriceListItem.Create.Body
            );
            result.PL_items.created++;
          } catch (e: any) {
            // console.log("Create PL Item Failed >> ", e?.response?.data, body);
            failed_docs_report.push({
              method: "create",
              // doc: body,
              error_message: set_error(e),
            });
            result.PL_items.failed++;
          }
        } else {
          if (
            is_found_in_repzo_db.price == body.price &&
            !is_found_in_repzo_db.disabled
          )
            continue;
          // Update
          try {
            const updated_PL_item = await repzo.priceListItem.update(
              is_found_in_repzo_db._id,
              body as Service.PriceListItem.Update.Body
            );
            result.PL_items.updated++;
          } catch (e: any) {
            // console.log(
            //   "Update Price List Item Failed >> ",
            //   e?.response?.data,
            //   body
            // );
            failed_docs_report.push({
              method: "update",
              doc_id: is_found_in_repzo_db?._id,
              doc: body,
              error_message: set_error(e),
            });
            result.PL_items.failed++;
          }
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
  } catch (e: any) {
    //@ts-ignore
    console.error(e?.response?.data || e);
    await commandLog.setStatus("fail", e).commit();
    throw e;
  }
};

const get_sap_price_list = async (
  serviceEndPoint: string,
  query?: { updateAt?: string }
): Promise<SAPPriceListItem[]> => {
  try {
    const sap_price_lists: SAPPriceListItems = await _create(
      serviceEndPoint,
      "/PriceList",
      { UpdateAt: query?.updateAt }
    );
    return sap_price_lists.PriceList;
  } catch (e: any) {
    throw e;
  }
};
