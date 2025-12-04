import Repzo from "repzo";
import { Service } from "repzo/src/types";
import DataSet from "data-set-query";
import { v4 as uuid } from "uuid";
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

interface SAPStoresBalance {
  ITEMID: string; // "020-REY-DI0002",
  STOREID: string; // "COOPS10",
  UNITID: number; // 3,
  UNITNAME: string; // "CRTN",
  QTY: number; // 102.0
}

interface SAPStoresBalances {
  result: "Success";
  StoresBalance: SAPStoresBalance[];
}

export const adjust_inventory = async (commandEvent: CommandEvent) => {
  const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
    env: commandEvent.env,
  });

  const commandLog = new Repzo.CommandLog(
    repzo,
    commandEvent.app,
    commandEvent.command
  );
  try {
    // console.log("adjust_inventory");

    await commandLog.load(commandEvent.sync_id);
    await commandLog
      .addDetail("Repzo SAP: Started Adjusting Inventories")
      .commit();

    const nameSpace: string = commandEvent.nameSpace.join("_");
    const result: Result & { items_failed: number } = {
      sap_total: 0,
      repzo_total: 0,
      items_failed: 0,
      created: 0,
      updated: 0,
      failed: 0,
    };
    const failed_docs_report: FailedDocsReport = [];

    const sap_inventories_items: SAPStoresBalance[] = await get_sap_inventories(
      commandEvent.app.formData.sapHostUrl,
      {}
    );
    result.sap_total = sap_inventories_items?.length;

    await commandLog
      .addDetail(`${result.sap_total} Stores Balance in SAP`)
      .commit();

    // Get Repzo Variants
    const repzo_variants = await repzo.variant.find({
      per_page: 50000,
      disabled: false,
      withProduct: true,
    });
    await commandLog
      .addDetail(`${repzo_variants?.data?.length} Variant(s) in Repzo`)
      .commit();

    // Get Repzo Warehouses
    const repzo_warehouses = await repzo.warehouse.find({
      per_page: 50000,
      disabled: false,
    });
    await commandLog
      .addDetail(`${repzo_warehouses?.data?.length} Warehouse(s) in Repzo`)
      .commit();

    // Get Repzo Measure Units
    const repzo_measureunits = await repzo.measureunit.find({
      per_page: 50000,
      disabled: false,
    });
    await commandLog
      .addDetail(`${repzo_measureunits?.data?.length} Measure Unit(s) in Repzo`)
      .commit();

    const repzo_tags = await repzo.tag.find({ type: "area", per_page: 50000 });
    result.repzo_total = repzo_tags?.data?.length;
    await commandLog
      .addDetail(`${repzo_tags?.data?.length} Area Tags in Repzo`)
      .commit();

    const sap_stores: {
      [sap_store_id: string]: { STOREID: string; items: SAPStoresBalance[] };
    } = {};

    sap_inventories_items.forEach((item) => {
      if (!sap_stores[item.STOREID])
        sap_stores[item.STOREID] = { STOREID: item.STOREID, items: [] };
      sap_stores[item.STOREID].items.push(item);
    });

    const sap_inventories = Object.values(sap_stores);

    for (let i = 0; i < sap_inventories.length; i++) {
      try {
        const sap_inventory = sap_inventories[i];
        const repzo_warehouse = repzo_warehouses?.data?.find(
          (wh) => wh.code == sap_inventory.STOREID
        );
        if (!repzo_warehouse) {
          throw `Warehouse with code: ${sap_inventory.STOREID} was not found in Repzo`;
        }

        // Get Repzo Inventory
        const repzo_inventory = await repzo.inventory.find({
          warehouse_id: repzo_warehouse._id,
          per_page: 50000,
        });

        const body: Service.AdjustInventory.Create.Body = {
          time: Date.now(),
          sync_id: uuid(),
          to: repzo_warehouse._id,
          //@ts-ignore
          variants: sap_inventory.items
            .map((sap_item) => {
              try {
                const variant = repzo_variants?.data?.find(
                  (variant) =>
                    variant.integration_meta?.ITEMCODE == sap_item.ITEMID
                );
                if (!variant) {
                  // console.log(
                  //   `Variant with ITEMCODE: ${sap_item.ITEMID} was not found`
                  // );
                  throw `Variant with ITEMCODE: ${sap_item.ITEMID} was not found`;
                }

                const measureUnit = repzo_measureunits?.data?.find(
                  (measure_unit) =>
                    measure_unit._id.toString() ==
                    (
                      variant.product as Service.Product.ProductSchema
                    )?.sv_measureUnit?.toString()
                );
                if (!measureUnit) {
                  // console.log(
                  //   `MeasureUnit with UNITNAME: ${sap_item.UNITNAME} & ALTUOMID: ${sap_item.UNITID} was not found`
                  // );
                  throw `MeasureUnit with UNITNAME: ${sap_item.UNITNAME} & ALTUOMID: ${sap_item.UNITID} was not found`;
                }

                const qty = measureUnit.factor * sap_item.QTY;

                const match_item_in_repzo_inventory =
                  repzo_inventory?.data?.find(
                    (repzo_item) =>
                      repzo_item.variant_id.toString() == variant._id.toString()
                  );

                if (match_item_in_repzo_inventory) {
                  //@ts-ignore
                  match_item_in_repzo_inventory.has_match_in_SAP = true;
                }

                const diff_qty = match_item_in_repzo_inventory
                  ? qty - match_item_in_repzo_inventory.qty
                  : qty;

                return { variant: variant._id, qty: diff_qty };
              } catch (e) {
                // console.log(e);
                failed_docs_report.push({
                  method: "fetchingData",
                  doc_id: sap_item.UNITNAME,
                  doc: { ...sap_item, STOREID: sap_inventories[i]?.STOREID },
                  error_message: set_error(e),
                });
                result.items_failed++;
              }
            })
            .concat(
              ...repzo_inventory?.data
                //@ts-ignore
                ?.filter((item) => !item.has_match_in_SAP)
                .map((item) => {
                  return { variant: item.variant_id, qty: -1 * item.qty };
                })
            )
            .filter((item) => item && item.qty),
        };
        // console.log(body);
        if (!body.variants.length) continue;

        const res = await repzo.adjustInventory.create(body);
        result.created++;
      } catch (e) {
        // console.log(e);
        failed_docs_report.push({
          method: "fetchingData",
          doc_id: sap_inventories[i]?.STOREID,
          doc: { STOREID: sap_inventories[i]?.STOREID },
          error_message: set_error(e),
        });
        result.failed++;
      }
    }

    const consider_virtual_warehouse =
      commandEvent.app.formData?.virtualWarehouses
        ?.consider_virtual_warehouse || false;

    if (consider_virtual_warehouse) {
      const absolute_qty_for_virtual_warehouses_before_accumulation =
        commandEvent.app.formData?.virtualWarehouses
          ?.consider_virtual_warehouse || true;
      const repzo_virtual_warehouses = repzo_warehouses?.data.filter(
        (wh) =>
          wh.integration_meta?.is_virtual_warehouse &&
          wh.integration_meta?.main_warehouses_codes?.length > 0
      );
      await commandLog
        .addDetail(
          `${repzo_virtual_warehouses?.length} Virtual Warehouse(s) in Repzo`
        )
        .commit();

      for (let i = 0; i < repzo_virtual_warehouses.length; i++) {
        try {
          const repzo_warehouse = repzo_virtual_warehouses[i];
          const sap_related_inventories = sap_inventories.filter((inventory) =>
            repzo_warehouse.integration_meta?.main_warehouses_codes?.includes(
              inventory.STOREID
            )
          );

          // Get Repzo Inventory
          const repzo_inventory = await repzo.inventory.find({
            warehouse_id: repzo_warehouse._id,
            per_page: 50000,
          });

          const shared_inventory: { [key: string]: SAPStoresBalance } = {};
          sap_related_inventories.forEach((sap_inventory) => {
            sap_inventory.items.forEach((item) => {
              const key = `${item.ITEMID}__${item.UNITID}__${item.UNITNAME}`;
              const QTY = item.QTY;
              if (!shared_inventory[key]) {
                shared_inventory[key] = item;
                shared_inventory[key].QTY = 0;
              }
              if (absolute_qty_for_virtual_warehouses_before_accumulation) {
                shared_inventory[key].QTY += QTY > 0 ? QTY : 0;
              } else {
                shared_inventory[key].QTY += QTY;
              }
            });
          });

          let variants = Object.values(shared_inventory).map((sap_item) => {
            try {
              const variant = repzo_variants?.data?.find(
                (variant) =>
                  variant.integration_meta?.ITEMCODE == sap_item.ITEMID
              );
              if (!variant) {
                // console.log(
                //   `Variant with ITEMCODE: ${sap_item.ITEMID} was not found`
                // );
                throw `Variant with ITEMCODE: ${sap_item.ITEMID} was not found`;
              }

              const measureUnit = repzo_measureunits?.data?.find(
                (measure_unit) =>
                  measure_unit._id.toString() ==
                  (
                    variant.product as Service.Product.ProductSchema
                  )?.sv_measureUnit?.toString()
              );
              if (!measureUnit) {
                // console.log(
                //   `MeasureUnit with UNITNAME: ${sap_item.UNITNAME} & ALTUOMID: ${sap_item.UNITID} was not found`
                // );
                throw `MeasureUnit with UNITNAME: ${sap_item.UNITNAME} & ALTUOMID: ${sap_item.UNITID} was not found`;
              }

              const qty = measureUnit.factor * sap_item.QTY;

              const match_item_in_repzo_inventory = repzo_inventory?.data?.find(
                (repzo_item) =>
                  repzo_item.variant_id.toString() == variant._id.toString()
              );

              if (match_item_in_repzo_inventory) {
                //@ts-ignore
                match_item_in_repzo_inventory.has_match_in_SAP = true;
              }

              // const diff_qty = match_item_in_repzo_inventory
              //   ? qty - match_item_in_repzo_inventory.qty
              //   : qty;

              return {
                variant: variant._id,
                qty: qty,
                match_item_in_repzo_inventory,
              };
            } catch (e) {
              // console.log(e);
              failed_docs_report.push({
                method: "fetchingData",
                doc_id: sap_item.UNITNAME,
                doc: {
                  ...sap_item,
                  virtual_repzo_warehouse: repzo_warehouse.code,
                },
                error_message: set_error(e),
              });
              result.items_failed++;
            }
          });

          const unit_variants: { [variant_id: string]: any } = {};
          variants
            .filter((i) => i)
            .forEach((item: any) => {
              if (!unit_variants[item.variant]) {
                unit_variants[item.variant] = item;
              } else {
                unit_variants[item.variant].qty += item.qty;
              }
            });

          variants = Object.values(unit_variants)
            .map((item) => {
              item.qty = item.match_item_in_repzo_inventory
                ? item.qty - item.match_item_in_repzo_inventory.qty
                : item.qty;
              return item;
            })
            .concat(
              ...repzo_inventory?.data
                //@ts-ignore
                ?.filter((item) => !item.has_match_in_SAP)
                .map((item) => {
                  return { variant: item.variant_id, qty: -1 * item.qty };
                })
            )
            .filter((item) => item && item.qty);

          const body: Service.AdjustInventory.Create.Body = {
            time: Date.now(),
            sync_id: uuid(),
            to: repzo_warehouse._id,
            //@ts-ignore
            variants: variants,
          };
          // console.log(body);
          if (!body.variants.length) continue;

          const res = await repzo.adjustInventory.create(body);
          result.created++;
        } catch (e) {
          // console.log(e);
          failed_docs_report.push({
            method: "fetchingData",
            doc_id: repzo_virtual_warehouses[i]._id,
            doc: { virtual_repzo_warehouse: repzo_virtual_warehouses[i].code },
            error_message: set_error(e),
          });
          result.failed++;
        }
      }
    }

    // console.log(result);
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

const get_sap_inventories = async (
  serviceEndPoint: string,
  query?: { updateAt?: string }
): Promise<SAPStoresBalance[]> => {
  try {
    const sap_inventories: SAPStoresBalances = (await _create(
      serviceEndPoint,
      "/StoresBalance",
      {}
    )) as SAPStoresBalances;
    return sap_inventories.StoresBalance;
  } catch (e: any) {
    throw e;
  }
};
