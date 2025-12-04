import Repzo from "repzo";
import { v4 as uuid } from "uuid";
import { _create, set_error } from "../util.js";
export const adjust_inventory = async (commandEvent) => {
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
    // console.log("adjust_inventory");
    await commandLog.load(commandEvent.sync_id);
    await commandLog
      .addDetail("Repzo SAP: Started Adjusting Inventories")
      .commit();
    const nameSpace = commandEvent.nameSpace.join("_");
    const result = {
      sap_total: 0,
      repzo_total: 0,
      items_failed: 0,
      created: 0,
      updated: 0,
      failed: 0,
    };
    const failed_docs_report = [];
    const sap_inventories_items = await get_sap_inventories(
      commandEvent.app.formData.sapHostUrl,
      {}
    );
    result.sap_total =
      sap_inventories_items === null || sap_inventories_items === void 0
        ? void 0
        : sap_inventories_items.length;
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
      .addDetail(
        `${
          (_b =
            repzo_variants === null || repzo_variants === void 0
              ? void 0
              : repzo_variants.data) === null || _b === void 0
            ? void 0
            : _b.length
        } Variant(s) in Repzo`
      )
      .commit();
    // Get Repzo Warehouses
    const repzo_warehouses = await repzo.warehouse.find({
      per_page: 50000,
      disabled: false,
    });
    await commandLog
      .addDetail(
        `${
          (_c =
            repzo_warehouses === null || repzo_warehouses === void 0
              ? void 0
              : repzo_warehouses.data) === null || _c === void 0
            ? void 0
            : _c.length
        } Warehouse(s) in Repzo`
      )
      .commit();
    // Get Repzo Measure Units
    const repzo_measureunits = await repzo.measureunit.find({
      per_page: 50000,
      disabled: false,
    });
    await commandLog
      .addDetail(
        `${
          (_d =
            repzo_measureunits === null || repzo_measureunits === void 0
              ? void 0
              : repzo_measureunits.data) === null || _d === void 0
            ? void 0
            : _d.length
        } Measure Unit(s) in Repzo`
      )
      .commit();
    const repzo_tags = await repzo.tag.find({ type: "area", per_page: 50000 });
    result.repzo_total =
      (_e =
        repzo_tags === null || repzo_tags === void 0
          ? void 0
          : repzo_tags.data) === null || _e === void 0
        ? void 0
        : _e.length;
    await commandLog
      .addDetail(
        `${
          (_f =
            repzo_tags === null || repzo_tags === void 0
              ? void 0
              : repzo_tags.data) === null || _f === void 0
            ? void 0
            : _f.length
        } Area Tags in Repzo`
      )
      .commit();
    const sap_stores = {};
    sap_inventories_items.forEach((item) => {
      if (!sap_stores[item.STOREID])
        sap_stores[item.STOREID] = { STOREID: item.STOREID, items: [] };
      sap_stores[item.STOREID].items.push(item);
    });
    const sap_inventories = Object.values(sap_stores);
    for (let i = 0; i < sap_inventories.length; i++) {
      try {
        const sap_inventory = sap_inventories[i];
        const repzo_warehouse =
          (_g =
            repzo_warehouses === null || repzo_warehouses === void 0
              ? void 0
              : repzo_warehouses.data) === null || _g === void 0
            ? void 0
            : _g.find((wh) => wh.code == sap_inventory.STOREID);
        if (!repzo_warehouse) {
          throw `Warehouse with code: ${sap_inventory.STOREID} was not found in Repzo`;
        }
        // Get Repzo Inventory
        const repzo_inventory = await repzo.inventory.find({
          warehouse_id: repzo_warehouse._id,
          per_page: 50000,
        });
        const body = {
          time: Date.now(),
          sync_id: uuid(),
          to: repzo_warehouse._id,
          //@ts-ignore
          variants: sap_inventory.items
            .map((sap_item) => {
              var _a, _b, _c, _d;
              try {
                const variant =
                  (_a =
                    repzo_variants === null || repzo_variants === void 0
                      ? void 0
                      : repzo_variants.data) === null || _a === void 0
                    ? void 0
                    : _a.find((variant) => {
                        var _a;
                        return (
                          ((_a = variant.integration_meta) === null ||
                          _a === void 0
                            ? void 0
                            : _a.ITEMCODE) == sap_item.ITEMID
                        );
                      });
                if (!variant) {
                  // console.log(
                  //   `Variant with ITEMCODE: ${sap_item.ITEMID} was not found`
                  // );
                  throw `Variant with ITEMCODE: ${sap_item.ITEMID} was not found`;
                }
                const measureUnit =
                  (_b =
                    repzo_measureunits === null || repzo_measureunits === void 0
                      ? void 0
                      : repzo_measureunits.data) === null || _b === void 0
                    ? void 0
                    : _b.find((measure_unit) => {
                        var _a, _b;
                        return (
                          measure_unit._id.toString() ==
                          ((_b =
                            (_a = variant.product) === null || _a === void 0
                              ? void 0
                              : _a.sv_measureUnit) === null || _b === void 0
                            ? void 0
                            : _b.toString())
                        );
                      });
                if (!measureUnit) {
                  // console.log(
                  //   `MeasureUnit with UNITNAME: ${sap_item.UNITNAME} & ALTUOMID: ${sap_item.UNITID} was not found`
                  // );
                  throw `MeasureUnit with UNITNAME: ${sap_item.UNITNAME} & ALTUOMID: ${sap_item.UNITID} was not found`;
                }
                const qty = measureUnit.factor * sap_item.QTY;
                const match_item_in_repzo_inventory =
                  (_c =
                    repzo_inventory === null || repzo_inventory === void 0
                      ? void 0
                      : repzo_inventory.data) === null || _c === void 0
                    ? void 0
                    : _c.find(
                        (repzo_item) =>
                          repzo_item.variant_id.toString() ==
                          variant._id.toString()
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
                  doc: {
                    ...sap_item,
                    STOREID:
                      (_d = sap_inventories[i]) === null || _d === void 0
                        ? void 0
                        : _d.STOREID,
                  },
                  error_message: set_error(e),
                });
                result.items_failed++;
              }
            })
            .concat(
              ...((_h =
                repzo_inventory === null || repzo_inventory === void 0
                  ? void 0
                  : repzo_inventory.data) === null || _h === void 0
                ? void 0
                : _h
                    .filter((item) => !item.has_match_in_SAP)
                    .map((item) => {
                      return { variant: item.variant_id, qty: -1 * item.qty };
                    }))
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
          doc_id:
            (_j = sap_inventories[i]) === null || _j === void 0
              ? void 0
              : _j.STOREID,
          doc: {
            STOREID:
              (_k = sap_inventories[i]) === null || _k === void 0
                ? void 0
                : _k.STOREID,
          },
          error_message: set_error(e),
        });
        result.failed++;
      }
    }
    const consider_virtual_warehouse =
      ((_m =
        (_l = commandEvent.app.formData) === null || _l === void 0
          ? void 0
          : _l.virtualWarehouses) === null || _m === void 0
        ? void 0
        : _m.consider_virtual_warehouse) || false;
    if (consider_virtual_warehouse) {
      const absolute_qty_for_virtual_warehouses_before_accumulation =
        ((_p =
          (_o = commandEvent.app.formData) === null || _o === void 0
            ? void 0
            : _o.virtualWarehouses) === null || _p === void 0
          ? void 0
          : _p.consider_virtual_warehouse) || true;
      const repzo_virtual_warehouses =
        repzo_warehouses === null || repzo_warehouses === void 0
          ? void 0
          : repzo_warehouses.data.filter((wh) => {
              var _a, _b, _c;
              return (
                ((_a = wh.integration_meta) === null || _a === void 0
                  ? void 0
                  : _a.is_virtual_warehouse) &&
                ((_c =
                  (_b = wh.integration_meta) === null || _b === void 0
                    ? void 0
                    : _b.main_warehouses_codes) === null || _c === void 0
                  ? void 0
                  : _c.length) > 0
              );
            });
      await commandLog
        .addDetail(
          `${
            repzo_virtual_warehouses === null ||
            repzo_virtual_warehouses === void 0
              ? void 0
              : repzo_virtual_warehouses.length
          } Virtual Warehouse(s) in Repzo`
        )
        .commit();
      for (let i = 0; i < repzo_virtual_warehouses.length; i++) {
        try {
          const repzo_warehouse = repzo_virtual_warehouses[i];
          const sap_related_inventories = sap_inventories.filter(
            (inventory) => {
              var _a, _b;
              return (_b =
                (_a = repzo_warehouse.integration_meta) === null ||
                _a === void 0
                  ? void 0
                  : _a.main_warehouses_codes) === null || _b === void 0
                ? void 0
                : _b.includes(inventory.STOREID);
            }
          );
          // Get Repzo Inventory
          const repzo_inventory = await repzo.inventory.find({
            warehouse_id: repzo_warehouse._id,
            per_page: 50000,
          });
          const shared_inventory = {};
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
            var _a, _b, _c;
            try {
              const variant =
                (_a =
                  repzo_variants === null || repzo_variants === void 0
                    ? void 0
                    : repzo_variants.data) === null || _a === void 0
                  ? void 0
                  : _a.find((variant) => {
                      var _a;
                      return (
                        ((_a = variant.integration_meta) === null ||
                        _a === void 0
                          ? void 0
                          : _a.ITEMCODE) == sap_item.ITEMID
                      );
                    });
              if (!variant) {
                // console.log(
                //   `Variant with ITEMCODE: ${sap_item.ITEMID} was not found`
                // );
                throw `Variant with ITEMCODE: ${sap_item.ITEMID} was not found`;
              }
              const measureUnit =
                (_b =
                  repzo_measureunits === null || repzo_measureunits === void 0
                    ? void 0
                    : repzo_measureunits.data) === null || _b === void 0
                  ? void 0
                  : _b.find((measure_unit) => {
                      var _a, _b;
                      return (
                        measure_unit._id.toString() ==
                        ((_b =
                          (_a = variant.product) === null || _a === void 0
                            ? void 0
                            : _a.sv_measureUnit) === null || _b === void 0
                          ? void 0
                          : _b.toString())
                      );
                    });
              if (!measureUnit) {
                // console.log(
                //   `MeasureUnit with UNITNAME: ${sap_item.UNITNAME} & ALTUOMID: ${sap_item.UNITID} was not found`
                // );
                throw `MeasureUnit with UNITNAME: ${sap_item.UNITNAME} & ALTUOMID: ${sap_item.UNITID} was not found`;
              }
              const qty = measureUnit.factor * sap_item.QTY;
              const match_item_in_repzo_inventory =
                (_c =
                  repzo_inventory === null || repzo_inventory === void 0
                    ? void 0
                    : repzo_inventory.data) === null || _c === void 0
                  ? void 0
                  : _c.find(
                      (repzo_item) =>
                        repzo_item.variant_id.toString() ==
                        variant._id.toString()
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
          const unit_variants = {};
          variants
            .filter((i) => i)
            .forEach((item) => {
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
              ...((_q =
                repzo_inventory === null || repzo_inventory === void 0
                  ? void 0
                  : repzo_inventory.data) === null || _q === void 0
                ? void 0
                : _q
                    .filter((item) => !item.has_match_in_SAP)
                    .map((item) => {
                      return { variant: item.variant_id, qty: -1 * item.qty };
                    }))
            )
            .filter((item) => item && item.qty);
          const body = {
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
const get_sap_inventories = async (serviceEndPoint, query) => {
  try {
    const sap_inventories = await _create(
      serviceEndPoint,
      "/StoresBalance",
      {}
    );
    return sap_inventories.StoresBalance;
  } catch (e) {
    throw e;
  }
};
