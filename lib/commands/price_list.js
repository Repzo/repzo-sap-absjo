import Repzo from "repzo";
import { _create, update_bench_time, set_error } from "../util.js";
import { get_sap_UoMs } from "./measureunit.js";
export const sync_price_list = async (commandEvent) => {
  var _a,
    _b,
    _c,
    _d,
    _e,
    _f,
    _g,
    _h,
    _j,
    _k,
    _l,
    _m,
    _o,
    _p,
    _q,
    _r,
    _s,
    _t,
    _u;
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
    // console.log("sync_price_list");
    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_price_list";
    await commandLog.load(commandEvent.sync_id);
    await commandLog
      .addDetail("Repzo SAP: Started Syncing Price Lists")
      .commit();
    const nameSpace = commandEvent.nameSpace.join("_");
    const result = {
      PL: { created: 0, updated: 0, failed: 0 },
      PL_items: { created: 0, updated: 0, failed: 0 },
      sap_total: 0,
      repzo_total: 0,
      repzo_PL_items: 0,
      sap_UoMs_total: 0,
      repzo_products_total: 0,
    };
    const failed_docs_report = [];
    // Get SAP Price Lists
    const sap_price_lists = await get_sap_price_list(
      commandEvent.app.formData.sapHostUrl,
      { updateAt: commandEvent.app.options_formData[bench_time_key] }
    );
    result.sap_total =
      sap_price_lists === null || sap_price_lists === void 0
        ? void 0
        : sap_price_lists.length;
    await commandLog
      .addDetail(
        `${result.sap_total} Price Lists in SAP changed since ${
          commandEvent.app.options_formData[bench_time_key] || "ever"
        }`
      )
      .commit();
    // Get SAP UoMs
    const sap_UoMs = await get_sap_UoMs(
      commandEvent.app.formData.sapHostUrl,
      {}
    );
    result.sap_UoMs_total =
      sap_UoMs === null || sap_UoMs === void 0 ? void 0 : sap_UoMs.length;
    await commandLog
      .addDetail(`${result.sap_total} Unit of Measures in SAP`)
      .commit();
    // Get Repzo Price Lists
    const repzo_price_lists = await repzo.priceList.find({ per_page: 50000 });
    result.repzo_total =
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
        } Price Lists in Repzo`
      )
      .commit();
    // Get Repzo Products
    const repzo_products = await repzo.product.find({
      active: true,
      withVariants: true,
      per_page: 50000,
    });
    result.repzo_products_total =
      (_d =
        repzo_products === null || repzo_products === void 0
          ? void 0
          : repzo_products.data) === null || _d === void 0
        ? void 0
        : _d.length;
    await commandLog
      .addDetail(
        `${
          (_e =
            repzo_products === null || repzo_products === void 0
              ? void 0
              : repzo_products.data) === null || _e === void 0
            ? void 0
            : _e.length
        } Products in Repzo`
      )
      .commit();
    // Get Repzo MeasureUnits
    const repzo_UoMs = await repzo.measureunit.find({
      disabled: false,
      per_page: 50000,
    });
    result.repzo_total =
      (_f =
        repzo_UoMs === null || repzo_UoMs === void 0
          ? void 0
          : repzo_UoMs.data) === null || _f === void 0
        ? void 0
        : _f.length;
    await commandLog
      .addDetail(
        `${
          (_g =
            repzo_UoMs === null || repzo_UoMs === void 0
              ? void 0
              : repzo_UoMs.data) === null || _g === void 0
            ? void 0
            : _g.length
        } Measure Units in Repzo`
      )
      .commit();
    if (
      !((_h =
        repzo_UoMs === null || repzo_UoMs === void 0
          ? void 0
          : repzo_UoMs.data) === null || _h === void 0
        ? void 0
        : _h.length)
    )
      throw "MeasureUnits in Repzo was not found";
    const sap_unique_UoMs = {};
    sap_UoMs.forEach((doc) => {
      const key = `${doc.ITEMCODE}__${doc.ALTUOMCODE}`;
      sap_unique_UoMs[key] = doc.ALTQTY;
    });
    // Get Repzo {Product_sku : product_default_measureunit_name}
    const repzo_product_default_measureunit = {};
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
    const priceLists_withItems = {};
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
      const repzo_price_list =
        (_j =
          repzo_price_lists === null || repzo_price_lists === void 0
            ? void 0
            : repzo_price_lists.data) === null || _j === void 0
          ? void 0
          : _j.find((pl) => {
              var _a, _b;
              return (
                ((_a =
                  pl === null || pl === void 0
                    ? void 0
                    : pl.integration_meta) === null || _a === void 0
                  ? void 0
                  : _a.id) ==
                ((_b =
                  body === null || body === void 0
                    ? void 0
                    : body.integration_meta) === null || _b === void 0
                  ? void 0
                  : _b.id)
              );
            });
      if (!repzo_price_list) {
        // Create
        try {
          const created_price_list = await repzo.priceList.create(body);
          result.PL.created++;
        } catch (e) {
          // console.log("Create Price List Failed >> ", e?.response, body);
          failed_docs_report.push({
            method: "create",
            doc: body,
            error_message: set_error(e),
          });
          result.PL.failed++;
        }
      } else {
        if (
          (repzo_price_list === null || repzo_price_list === void 0
            ? void 0
            : repzo_price_list.name) ==
          (body === null || body === void 0 ? void 0 : body.name)
        )
          continue;
        // Update
        try {
          const updated_price_list = await repzo.priceList.update(
            repzo_price_list._id,
            body
          );
          result.PL.updated++;
        } catch (e) {
          // console.log("Update Price List Failed >> ", e?.response?.data, body);
          failed_docs_report.push({
            method: "update",
            doc_id:
              repzo_price_list === null || repzo_price_list === void 0
                ? void 0
                : repzo_price_list._id,
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
      .addDetail(
        `${
          (_k =
            repzo_all_priceLists === null || repzo_all_priceLists === void 0
              ? void 0
              : repzo_all_priceLists.data) === null || _k === void 0
            ? void 0
            : _k.length
        } Price Lists in Repzo`
      )
      .commit();
    if (
      !((_l =
        repzo_all_priceLists === null || repzo_all_priceLists === void 0
          ? void 0
          : repzo_all_priceLists.data) === null || _l === void 0
        ? void 0
        : _l.length)
    )
      throw `No Price Lists was found On Repzo`;
    for (let priceList_name in priceLists_withItems) {
      const repzo_PriceList =
        (_m =
          repzo_all_priceLists === null || repzo_all_priceLists === void 0
            ? void 0
            : repzo_all_priceLists.data) === null || _m === void 0
          ? void 0
          : _m.find((pl) => {
              var _a;
              return (
                ((_a = pl.integration_meta) === null || _a === void 0
                  ? void 0
                  : _a.id) == `${nameSpace}_${priceList_name}`
              );
            });
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
          ((_o = priceLists_withItems[priceList_name]) === null || _o === void 0
            ? void 0
            : _o.length) || 0;
        continue;
      }
      const repzo_price_list_items = await repzo.priceListItem.find({
        // disabled: false,
        pricelist_id:
          repzo_PriceList === null || repzo_PriceList === void 0
            ? void 0
            : repzo_PriceList._id,
        per_page: 50000,
      });
      // Create Price list items
      const priceList_items = {};
      priceLists_withItems[priceList_name].forEach((doc) => {
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
            } else if (
              (current_doc === null || current_doc === void 0
                ? void 0
                : current_doc.factor) >
              (doc === null || doc === void 0 ? void 0 : doc.factor)
            ) {
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
        const repzo_product =
          (_p =
            repzo_products === null || repzo_products === void 0
              ? void 0
              : repzo_products.data) === null || _p === void 0
            ? void 0
            : _p.find((product) => {
                var _a;
                return (
                  ((_a =
                    product === null || product === void 0
                      ? void 0
                      : product.integration_meta) === null || _a === void 0
                    ? void 0
                    : _a.id) == `${nameSpace}_${item.PLITEMID}`
                );
              });
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
        const repzo_product_uoms =
          (_q =
            repzo_UoMs === null || repzo_UoMs === void 0
              ? void 0
              : repzo_UoMs.data) === null || _q === void 0
            ? void 0
            : _q.filter((uom) => {
                var _a, _b, _c, _d;
                return (
                  ((_a = uom === null || uom === void 0 ? void 0 : uom._id) ===
                    null || _a === void 0
                    ? void 0
                    : _a.toString()) ==
                    ((_b =
                      repzo_product === null || repzo_product === void 0
                        ? void 0
                        : repzo_product.sv_measureUnit) === null ||
                    _b === void 0
                      ? void 0
                      : _b.toString()) ||
                  ((_c = repzo_product.measureunit_family) === null ||
                  _c === void 0
                    ? void 0
                    : _c.includes(
                        (_d =
                          uom === null || uom === void 0 ? void 0 : uom._id) ===
                          null || _d === void 0
                          ? void 0
                          : _d.toString()
                      ))
                );
              });
        const repzo_product_uom = repzo_product_uoms.find(
          (uom) => uom.name == item.PLITEMUNIT
        );
        if (!repzo_product_uom) {
          failed_docs_report.push({
            method: "create",
            // doc: priceLists_withItems[priceList_name],
            error_message: set_error(
              `Price List: ${item.PLDID} of MeasureUnit with _id: ${
                (_r =
                  repzo_product === null || repzo_product === void 0
                    ? void 0
                    : repzo_product.sv_measureUnit) === null || _r === void 0
                  ? void 0
                  : _r.toString()
              } was not found or disabled`
            ),
          });
          result.PL_items.failed++;
          continue;
        }
        const price =
          repzo_product_uom &&
          (repzo_product_uom === null || repzo_product_uom === void 0
            ? void 0
            : repzo_product_uom.factor) == 1
            ? Math.round(item.PLITEMPRICEVALUE * 1000)
            : Math.round(
                (item.PLITEMPRICEVALUE * 1000) / repzo_product_uom.factor
              );
        const variant =
          (_s =
            repzo_product === null || repzo_product === void 0
              ? void 0
              : repzo_product.variants) === null || _s === void 0
            ? void 0
            : _s.find((variant) => {
                var _a;
                return (
                  ((_a =
                    variant === null || variant === void 0
                      ? void 0
                      : variant.integration_meta) === null || _a === void 0
                    ? void 0
                    : _a.id) == `${nameSpace}_${item.PLITEMID}`
                );
              });
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
        const is_found_in_repzo_db =
          (_t =
            repzo_price_list_items === null || repzo_price_list_items === void 0
              ? void 0
              : repzo_price_list_items.data) === null || _t === void 0
            ? void 0
            : _t.find((item) => {
                var _a, _b;
                return (
                  ((_a =
                    item === null || item === void 0
                      ? void 0
                      : item.integration_meta) === null || _a === void 0
                    ? void 0
                    : _a.id) ==
                  ((_b =
                    body === null || body === void 0
                      ? void 0
                      : body.integration_meta) === null || _b === void 0
                    ? void 0
                    : _b.id)
                );
              });
        // console.log(`${data.integration_meta?.id} => ${is_found_in_repzo_db ? "create" : "update"}`)
        if (!is_found_in_repzo_db) {
          // Create
          try {
            const created_PL_item = await repzo.priceListItem.create(body);
            result.PL_items.created++;
          } catch (e) {
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
              body
            );
            result.PL_items.updated++;
          } catch (e) {
            // console.log(
            //   "Update Price List Item Failed >> ",
            //   e?.response?.data,
            //   body
            // );
            failed_docs_report.push({
              method: "update",
              doc_id:
                is_found_in_repzo_db === null || is_found_in_repzo_db === void 0
                  ? void 0
                  : is_found_in_repzo_db._id,
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
  } catch (e) {
    //@ts-ignore
    console.error(
      ((_u = e === null || e === void 0 ? void 0 : e.response) === null ||
      _u === void 0
        ? void 0
        : _u.data) || e
    );
    await commandLog.setStatus("fail", e).commit();
    throw e;
  }
};
const get_sap_price_list = async (serviceEndPoint, query) => {
  try {
    const sap_price_lists = await _create(serviceEndPoint, "/PriceList", {
      UpdateAt: query === null || query === void 0 ? void 0 : query.updateAt,
    });
    return sap_price_lists.PriceList;
  } catch (e) {
    throw e;
  }
};
