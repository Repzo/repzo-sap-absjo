import Repzo from "repzo";
import {
  _create,
  update_bench_time,
  date_formatting,
  set_error,
} from "../util.js";
export const sync_product = async (commandEvent) => {
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
    _u,
    _v,
    _w;
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
    // console.log("sync_product");
    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_product";
    await commandLog.load(commandEvent.sync_id);
    await commandLog.addDetail("Repzo SAP: Started Syncing Products").commit();
    const nameSpace = commandEvent.nameSpace.join("_");
    const result = {
      sap_total: 0,
      repzo_total: 0,
      created: 0,
      updated: 0,
      failed: 0,
      repzo_total_taxes: 0,
      repzo_total_categories: 0,
      repzo_total_brands: 0,
    };
    const failed_docs_report = [];
    const sap_products = await get_sap_products(
      commandEvent.app.formData.sapHostUrl,
      {
        updateAt:
          (_b = commandEvent.app.options_formData) === null || _b === void 0
            ? void 0
            : _b[bench_time_key],
      }
    );
    result.sap_total =
      sap_products === null || sap_products === void 0
        ? void 0
        : sap_products.length;
    await commandLog
      .addDetail(
        `${result.sap_total} Items in SAP changed since ${
          ((_c = commandEvent.app.options_formData) === null || _c === void 0
            ? void 0
            : _c[bench_time_key]) || "ever"
        }`
      )
      .commit();
    // Product Repzo
    const repzo_products = await repzo.product.find({
      per_page: 50000,
      withVariants: true,
    });
    result.repzo_total =
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
    // Tax
    const repzo_taxes = await repzo.tax.find({
      per_page: 50000,
      disabled: false,
    });
    result.repzo_total_taxes =
      (_f =
        repzo_taxes === null || repzo_taxes === void 0
          ? void 0
          : repzo_taxes.data) === null || _f === void 0
        ? void 0
        : _f.length;
    await commandLog
      .addDetail(`${result.repzo_total_taxes} Taxes in Repzo`)
      .commit();
    // Category
    const repzo_categories = await repzo.category.find({
      per_page: 50000,
      disabled: false,
    });
    result.repzo_total_categories =
      (_g =
        repzo_categories === null || repzo_categories === void 0
          ? void 0
          : repzo_categories.data) === null || _g === void 0
        ? void 0
        : _g.length;
    await commandLog
      .addDetail(`${result.repzo_total_categories} Product Categories in Repzo`)
      .commit();
    // Brand
    const repzo_brands = await repzo.brand.find({
      per_page: 50000,
      disabled: false,
    });
    result.repzo_total_brands =
      (_h =
        repzo_brands === null || repzo_brands === void 0
          ? void 0
          : repzo_brands.data) === null || _h === void 0
        ? void 0
        : _h.length;
    await commandLog
      .addDetail(`${result.repzo_total_brands} Brands in Repzo`)
      .commit();
    for (
      let i = 0;
      i <
      (sap_products === null || sap_products === void 0
        ? void 0
        : sap_products.length);
      i++
    ) {
      const sap_product = sap_products[i];
      try {
        const repzo_product = repzo_products.data.find((r_product) => {
          var _a;
          return (
            ((_a =
              r_product === null || r_product === void 0
                ? void 0
                : r_product.integration_meta) === null || _a === void 0
              ? void 0
              : _a.id) == `${nameSpace}_${sap_product.ITEMCODE}`
          );
        });
        // Tax
        const tax =
          (_j =
            repzo_taxes === null || repzo_taxes === void 0
              ? void 0
              : repzo_taxes.data) === null || _j === void 0
            ? void 0
            : _j.find((tax) => {
                var _a;
                return (
                  ((_a =
                    tax === null || tax === void 0
                      ? void 0
                      : tax.integration_meta) === null || _a === void 0
                    ? void 0
                    : _a.id) == `${nameSpace}_${sap_product.ITEMTAXCODE}`
                );
              });
        if (!tax) {
          throw `Tax not found => ITEMTAXCODE: ${sap_product.ITEMTAXCODE}`;
          continue;
        }
        const product_tax =
          (_k = tax === null || tax === void 0 ? void 0 : tax._id) === null ||
          _k === void 0
            ? void 0
            : _k.toString();
        // Category
        const category =
          (_l =
            repzo_categories === null || repzo_categories === void 0
              ? void 0
              : repzo_categories.data) === null || _l === void 0
            ? void 0
            : _l.find((category) => {
                var _a;
                return (
                  ((_a =
                    category === null || category === void 0
                      ? void 0
                      : category.integration_meta) === null || _a === void 0
                    ? void 0
                    : _a.id) == `${nameSpace}_${sap_product.ITEMGROUPCODE}`
                );
              });
        if (!category) {
          throw `Category not found => ITEMGROUPCODE: ${sap_product.ITEMGROUPCODE}`;
          continue;
        }
        const product_category =
          (_m =
            category === null || category === void 0
              ? void 0
              : category._id) === null || _m === void 0
            ? void 0
            : _m.toString();
        // Brand
        const brand =
          (_o =
            repzo_brands === null || repzo_brands === void 0
              ? void 0
              : repzo_brands.data) === null || _o === void 0
            ? void 0
            : _o.find((brand) => {
                var _a;
                return (
                  ((_a =
                    brand === null || brand === void 0
                      ? void 0
                      : brand.integration_meta) === null || _a === void 0
                    ? void 0
                    : _a.id) == `${nameSpace}_${sap_product["Parent Category"]}`
                );
              });
        const product_brand =
          (_p = brand === null || brand === void 0 ? void 0 : brand._id) ===
            null || _p === void 0
            ? void 0
            : _p.toString();
        // measureUnit family
        const family = await repzo.measureunitFamily.find({
          "integration_meta.id": `${nameSpace}_${sap_product.ITEMCODE}`,
          disabled: false,
        });
        if (
          !(family === null || family === void 0 ? void 0 : family.data) ||
          ((_q =
            family === null || family === void 0 ? void 0 : family.data) ===
            null || _q === void 0
            ? void 0
            : _q.length) != 1
        ) {
          throw `Family not found => ITEMCODE: ${sap_product.ITEMCODE}`;
          continue;
        }
        const product_family =
          (_s =
            (_r = family.data[0]) === null || _r === void 0
              ? void 0
              : _r._id) === null || _s === void 0
            ? void 0
            : _s.toString();
        // measureUnit
        const measureUnit = await repzo.measureunit.find({
          "integration_meta.UOMGROUPENTRY": sap_product.UOMGROUPENTRY,
          name: sap_product.DEFAULTITEMUOM,
          company_namespace: nameSpace,
          disabled: false,
          "integration_meta.ITEMCODE": sap_product.ITEMCODE,
        });
        if (!measureUnit.data || measureUnit.data.length != 1) {
          throw `MeasureUnit not found => UOMGROUPENTRY: ${sap_product.UOMGROUPENTRY}, ITEMCODE: ${sap_product.ITEMCODE}, DEFAULTITEMUOM: ${sap_product.DEFAULTITEMUOM}`;
          continue;
        }
        const product_measureUnit =
          (_t = measureUnit.data[0]._id) === null || _t === void 0
            ? void 0
            : _t.toString();
        const body = {
          active: true,
          name: sap_product.ITEMDESC,
          local_name: sap_product.ITEMDESCF,
          barcode: sap_product.ITEMBARCODE,
          sku: sap_product.ITEMCODE,
          sv_tax: product_tax,
          category: product_category,
          brand: product_brand,
          measureunit_family: product_family,
          sv_measureUnit: product_measureUnit,
          integration_meta: {
            id: `${nameSpace}_${sap_product.ITEMCODE}`,
            ITEMGROUPCODE: sap_product.ITEMGROUPCODE,
            UOMGROUPENTRY: sap_product.UOMGROUPENTRY,
            BRAND: sap_product.BRAND,
          },
          variants: [
            {
              disabled: false,
              name: sap_product.ITEMCODE,
              price: 0, // Math.round(sap_product.PRICE * 1000),
              integration_meta: {
                id: `${nameSpace}_${sap_product.ITEMCODE}`,
                ITEMCODE: sap_product.ITEMCODE,
              },
              company_namespace: [nameSpace],
            },
          ],
          company_namespace: [nameSpace],
        };
        if (!repzo_product) {
          // Create
          try {
            const created_product = await repzo.product.create(body);
            result.created++;
          } catch (e) {
            // console.log("Create Product Failed >> ", e?.response, body);
            failed_docs_report.push({
              method: "create",
              doc: body,
              error_message: set_error(e),
            });
            result.failed++;
          }
        } else {
          if (is_matched(body, repzo_product)) {
            continue;
          }
          if (
            (_u =
              repzo_product === null || repzo_product === void 0
                ? void 0
                : repzo_product.variants) === null || _u === void 0
              ? void 0
              : _u.length
          ) {
            (_v = body === null || body === void 0 ? void 0 : body.variants) ===
              null || _v === void 0
              ? void 0
              : _v.forEach((variant) => {
                  var _a;
                  const hasMatch =
                    (_a =
                      repzo_product === null || repzo_product === void 0
                        ? void 0
                        : repzo_product.variants) === null || _a === void 0
                      ? void 0
                      : _a.find((v) => {
                          var _a, _b;
                          return (
                            ((_a = v.integration_meta) === null || _a === void 0
                              ? void 0
                              : _a.id) ==
                            ((_b =
                              variant === null || variant === void 0
                                ? void 0
                                : variant.integration_meta) === null ||
                            _b === void 0
                              ? void 0
                              : _b.id)
                          );
                        });
                  if (hasMatch) {
                    variant._id = hasMatch._id;
                  }
                });
          }
          // Update
          try {
            const updated_product = await repzo.product.update(
              repzo_product._id,
              body
            );
            result.updated++;
          } catch (e) {
            // console.log("Update Product Failed >> ", e?.response?.data, body);
            failed_docs_report.push({
              method: "update",
              doc_id:
                repzo_product === null || repzo_product === void 0
                  ? void 0
                  : repzo_product._id,
              doc: body,
              error_message: set_error(e),
            });
            result.failed++;
          }
        }
      } catch (e) {
        // console.log("FetchingData Product Failed >> ", e);
        failed_docs_report.push({
          method: "fetchingData",
          doc_id: sap_product.ITEMBARCODE,
          error_message: set_error(e),
        });
        result.failed++;
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
      ((_w = e === null || e === void 0 ? void 0 : e.response) === null ||
      _w === void 0
        ? void 0
        : _w.data) || e
    );
    await commandLog.setStatus("fail", e).commit();
    throw e;
  }
};
const get_sap_products = async (serviceEndPoint, query) => {
  try {
    const sap_products = await _create(serviceEndPoint, "/Items", {
      Active: "Y",
      UpdateAt: date_formatting(
        query === null || query === void 0 ? void 0 : query.updateAt,
        "YYYYMMDD:000000"
      ),
    });
    return sap_products.Items;
  } catch (e) {
    throw e;
  }
};
const is_matched = (body_1, body_2) => {
  var _a, _b, _c, _d, _e, _f;
  try {
    const keys = [
      "active",
      "name",
      "local_name",
      "barcode",
      "sku",
      "sv_tax",
      "category",
      "measureunit_family",
      "sv_measureUnit",
      "brand",
    ];
    const integration_meta_keys = [
      "id",
      "ITEMGROUPCODE",
      "UOMGROUPENTRY",
      "BRAND",
    ];
    const variant_keys = ["variants", "disabled", "name", "price"];
    const variant_integration_meta_keys = ["integration_meta.id"];
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (
        ((_a = body_1[key]) === null || _a === void 0
          ? void 0
          : _a.toString()) !==
        ((_b = body_2[key]) === null || _b === void 0 ? void 0 : _b.toString())
      ) {
        return false;
      }
    }
    for (let i = 0; i < integration_meta_keys.length; i++) {
      const key = integration_meta_keys[i];
      if (
        ((_d =
          (_c =
            body_1 === null || body_1 === void 0
              ? void 0
              : body_1.integration_meta) === null || _c === void 0
            ? void 0
            : _c[key]) === null || _d === void 0
          ? void 0
          : _d.toString()) !==
        ((_f =
          (_e =
            body_2 === null || body_2 === void 0
              ? void 0
              : body_2.integration_meta) === null || _e === void 0
            ? void 0
            : _e[key]) === null || _f === void 0
          ? void 0
          : _f.toString())
      ) {
        return false;
      }
    }
    return true;
  } catch (e) {
    throw e;
  }
};
