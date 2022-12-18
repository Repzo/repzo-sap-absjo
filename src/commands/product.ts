import Repzo from "repzo";
import { Service } from "repzo/src/types";
import DataSet from "data-set-query";
import _ from "lodash";
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

export interface SAPProduct {
  ITEMBARCODE: string; // "10900035835";
  ITEMDESC: string; // "Diamond Cling Wrap 24X300ftX30cm Regular";
  ITEMAVALIABLEQTY: number; // 67.54987;
  ITEMTAX: number; // 16.0;
  ITEMTAXCODE: string; // "S16";
  ITEMCODE: string; // "020-REY-DI0018";
  Division: string; // "Non-Food";
  "Parent Category": string; // "Cling Wrap";
  "Sub-Category": string; // "Cling Wrap";
  "Item Type": string; // "ORIGINAL";
  DEFAULTITEMUOM: string; // "CRTN";
  DEFAULTSALEUOMID: number; // 3;
  INVUOMID: number; // 3;
  ITEMSALESUOMS: string; // "PC, CRTN";
  ITEMQTY: number; // 1.0;
  ITEMGROUPCODE: number; // 122;
  PRICE: number; // 46.156662;
  ISSERIAL: "Y" | "N";
  ITEMDESCF: string; // "داياموند نايلون تغليف الأطعمه 24*300قدم*30سم";
  UOMGROUPENTRY: number; // 76;
  MILCODE: string; // "020-REY-DI0018";
  MODELNO: string; // "1090003583";
  BRAND: string; // "Reynolds";
  ITEMSUBCATEGORY: string; // "Non-Food";
  CREATEDATE: string; // "2021-12-07T21:00:00Z";
  UPDATEDATE: string; // "2022-11-29T21:00:00Z";
}

export interface SAPProducts {
  result: "Success";
  Items: SAPProduct[];
}

export const sync_product = async (commandEvent: CommandEvent) => {
  const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
    env: commandEvent.env,
  });

  const commandLog = new Repzo.CommandLog(
    repzo,
    commandEvent.app,
    commandEvent.command,
  );
  try {
    console.log("sync_product");

    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_product";

    await commandLog.load(commandEvent.sync_id);
    await commandLog.addDetail("Repzo SAP: Started Syncing Products").commit();

    const nameSpace: string = commandEvent.nameSpace.join("_");
    const result: Result & {
      repzo_total_taxes: number;
      repzo_total_categories: number;
    } = {
      sap_total: 0,
      repzo_total: 0,
      created: 0,
      updated: 0,
      failed: 0,
      repzo_total_taxes: 0,
      repzo_total_categories: 0,
    };
    const failed_docs_report: FailedDocsReport = [];

    const sap_products: SAPProduct[] = await get_sap_products(
      commandEvent.app.formData.sapHostUrl,
      { updateAt: commandEvent.app.options_formData[bench_time_key] },
    );
    result.sap_total = sap_products?.length;

    await commandLog
      .addDetail(
        `${result.sap_total} Items in SAP changed since ${
          commandEvent.app.options_formData[bench_time_key] || "ever"
        }`,
      )
      .commit();

    // Product Repzo
    const repzo_products = await repzo.product.find({
      per_page: 50000,
      withVariants: true,
    });
    result.repzo_total = repzo_products?.data?.length;
    await commandLog
      .addDetail(`${repzo_products?.data?.length} Products in Repzo`)
      .commit();

    // Tax
    const repzo_taxes = await repzo.tax.find({
      per_page: 50000,
      disabled: false,
    });
    result.repzo_total_taxes = repzo_taxes?.data?.length;
    await commandLog
      .addDetail(`${result.repzo_total_taxes} Taxes in Repzo`)
      .commit();

    // Category
    const repzo_categories = await repzo.category.find({
      per_page: 50000,
      disabled: false,
    });
    result.repzo_total_categories = repzo_categories?.data?.length;
    await commandLog
      .addDetail(`${result.repzo_total_categories} Product Categories in Repzo`)
      .commit();

    for (let i = 0; i < sap_products?.length; i++) {
      const sap_product: SAPProduct = sap_products[i];
      try {
        const repzo_product = repzo_products.data.find(
          (r_product) =>
            r_product?.integration_meta?.id ==
            `${nameSpace}_${sap_product.ITEMCODE}`,
        );

        // Tax
        const tax = repzo_taxes?.data?.find(
          (tax) =>
            tax?.integration_meta?.id ==
            `${nameSpace}_${sap_product.ITEMTAXCODE}`,
        );
        if (!tax) {
          throw `Tax not found => ITEMTAXCODE: ${sap_product.ITEMTAXCODE}`;
          continue;
        }
        const product_tax = tax?._id?.toString();

        // Category
        const category = repzo_categories?.data?.find(
          (category) =>
            category?.integration_meta?.id ==
            `${nameSpace}_${sap_product.ITEMGROUPCODE}`,
        );
        if (!category) {
          throw `Category not found => ITEMGROUPCODE: ${sap_product.ITEMGROUPCODE}`;
          continue;
        }
        const product_category = category?._id?.toString();

        // measureUnit family
        const family = await repzo.measureunitFamily.find({
          "integration_meta.id": `${nameSpace}_${sap_product.ITEMCODE}`,
          disabled: false,
        });
        if (!family?.data || family?.data?.length != 1) {
          throw `Family not found => ITEMCODE: ${sap_product.ITEMCODE}`;
          continue;
        }
        const product_family = family.data[0]?._id?.toString();

        // measureUnit
        const measureUnit = await repzo.measureunit.find({
          "integration_meta.UOMGROUPENTRY": sap_product.UOMGROUPENTRY,
          name: sap_product.DEFAULTITEMUOM,
          company_namespace: nameSpace,
          disabled: false,
        });
        if (!measureUnit.data || measureUnit.data.length != 1) {
          throw `MeasureUnit not found => UOMGROUPENTRY: ${sap_product.UOMGROUPENTRY}, ITEMCODE: ${sap_product.ITEMCODE}, DEFAULTITEMUOM: ${sap_product.DEFAULTITEMUOM}`;
          continue;
        }
        const product_measureUnit = measureUnit.data[0]._id?.toString();

        const body: Service.Product.Create.Body | Service.Product.Update.Body =
          {
            active: true,
            name: sap_product.ITEMDESC,
            barcode: sap_product.ITEMBARCODE,
            sku: sap_product.ITEMCODE,
            sv_tax: product_tax,
            category: product_category,
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
            const created_product = await repzo.product.create(
              body as Service.Product.Create.Body,
            );
            result.created++;
          } catch (e: any) {
            console.log("Create Product Failed >> ", e?.response, body);
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

          if (repzo_product?.variants?.length) {
            body?.variants?.forEach((variant) => {
              const hasMatch = repzo_product?.variants?.find(
                (v) => v.integration_meta?.id == variant?.integration_meta?.id,
              );
              if (hasMatch) {
                variant._id = hasMatch._id;
              }
            });
          }

          // Update
          try {
            const updated_product = await repzo.product.update(
              repzo_product._id,
              body as Service.Product.Update.Body,
            );
            result.updated++;
          } catch (e: any) {
            console.log("Update Product Failed >> ", e?.response?.data, body);
            failed_docs_report.push({
              method: "update",
              doc_id: repzo_product?._id,
              doc: body,
              error_message: set_error(e),
            });
            result.failed++;
          }
        }
      } catch (e) {
        console.log("FetchingData Product Failed >> ", e);
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
      new_bench_time,
    );
    await commandLog
      .setStatus(
        "success",
        failed_docs_report.length ? failed_docs_report : null,
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

const get_sap_products = async (
  serviceEndPoint: string,
  query?: { updateAt?: string },
): Promise<SAPProduct[]> => {
  try {
    const sap_products: SAPProducts = await _create(serviceEndPoint, "/Items", {
      Active: "Y",
      UpdateAt: date_formatting(query?.updateAt, "YYYYMMDD:HHmmss"),
    });
    return sap_products.Items;
  } catch (e: any) {
    throw e;
  }
};

const is_matched = (
  body_1: { [keys: string]: any },
  body_2: { [keys: string]: any },
) => {
  try {
    const keys = [
      "active",
      "name",
      "barcode",
      "sku",
      "sv_tax",
      "category",
      "measureunit_family",
      "sv_measureUnit",
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
      if (body_1[key]?.toString() !== body_2[key]?.toString()) {
        return false;
      }
    }
    for (let i = 0; i < integration_meta_keys.length; i++) {
      const key = keys[i];
      if (
        body_1?.integration_meta?.[key]?.toString() !==
        body_2?.integration_meta?.[key]?.toString()
      ) {
        return false;
      }
    }
    return true;
  } catch (e) {
    throw e;
  }
};
