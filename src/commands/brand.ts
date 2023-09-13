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

interface SAPBrand {
  Code: string; // "ALKALINE SPECIALITY",
  Name: string; // "ALKALINE SPECIALITY",
  U_Code: string; //  "1"
}

interface SAPBrands {
  result: "Success";
  ItemSubGroup: SAPBrand[];
}

export const sync_brand = async (commandEvent: CommandEvent) => {
  const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
    env: commandEvent.env,
  });

  const commandLog = new Repzo.CommandLog(
    repzo,
    commandEvent.app,
    commandEvent.command
  );
  try {
    // console.log("sync_brand");

    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_brand";

    await commandLog.load(commandEvent.sync_id);
    await commandLog.addDetail("Repzo SAP: Started Syncing Brands").commit();

    const nameSpace: string = commandEvent.nameSpace.join("_");
    const result: Result = {
      sap_total: 0,
      repzo_total: 0,
      created: 0,
      updated: 0,
      failed: 0,
    };
    const failed_docs_report: FailedDocsReport = [];

    const sap_brands: SAPBrand[] = await get_sap_brands(
      commandEvent.app.formData.sapHostUrl,
      {}
    );
    result.sap_total = sap_brands?.length;

    await commandLog.addDetail(`${result.sap_total} Brands in SAP`).commit();

    const repzo_brands = await repzo.brand.find({ per_page: 50000 });
    result.repzo_total = repzo_brands?.data?.length;
    await commandLog
      .addDetail(`${repzo_brands?.data?.length} Brand in Repzo`)
      .commit();

    for (let i = 0; i < sap_brands?.length; i++) {
      const sap_brand: SAPBrand = sap_brands[i];
      const repzo_brand = repzo_brands.data.find(
        (r_cat) =>
          r_cat.integration_meta?.id == `${nameSpace}_${sap_brand.U_Code}`
      );

      const body: Service.Brand.Create.Body | Service.Brand.Update.Body = {
        name: sap_brand.Name,
        disabled: false,
        integration_meta: { id: `${nameSpace}_${sap_brand.U_Code}` },
        company_namespace: [nameSpace],
      };

      if (!repzo_brand) {
        // Create
        try {
          const created_brand = await repzo.brand.create(
            body as Service.Brand.Create.Body
          );
          result.created++;
        } catch (e: any) {
          // console.log("Create Brand Failed >> ", e?.response, body);
          failed_docs_report.push({
            method: "create",
            doc: body,
            error_message: set_error(e),
          });
          result.failed++;
        }
      } else {
        if (
          repzo_brand?.integration_meta?.id == body?.integration_meta?.id &&
          repzo_brand?.name == body?.name &&
          repzo_brand?.disabled == false
        ) {
          continue;
        }

        // Update
        try {
          const updated_brand = await repzo.brand.update(
            repzo_brand._id,
            body as Service.Brand.Update.Body
          );
          result.updated++;
        } catch (e: any) {
          // console.log(
          //   "Update Brand Failed >> ",
          //   e?.response?.data,
          //   body
          // );
          failed_docs_report.push({
            method: "update",
            doc_id: repzo_brand?._id,
            doc: body,
            error_message: set_error(e),
          });
          result.failed++;
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

const get_sap_brands = async (
  serviceEndPoint: string,
  query?: { updateAt?: string }
): Promise<SAPBrand[]> => {
  try {
    const sap_brands: SAPBrands = await _create(
      serviceEndPoint,
      "/ParentCategory",
      { UpdateAt: "20201230:000000", Active: "Y" }
    );
    return sap_brands.ItemSubGroup;
  } catch (e: any) {
    throw e;
  }
};
