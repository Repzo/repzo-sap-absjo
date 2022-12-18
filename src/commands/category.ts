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

interface SAPCategory {
  GROUPDESC: string; // "Items",
  GROUPCODE: string; // "100",
  BRAND: null | string;
}

interface SAPCategories {
  result: "Success";
  ItemGroup: SAPCategory[];
}

export const sync_category = async (commandEvent: CommandEvent) => {
  const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
    env: commandEvent.env,
  });

  const commandLog = new Repzo.CommandLog(
    repzo,
    commandEvent.app,
    commandEvent.command,
  );
  try {
    console.log("sync_category");

    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_category";

    await commandLog.load(commandEvent.sync_id);
    await commandLog
      .addDetail("Repzo SAP: Started Syncing Product Categories")
      .commit();

    const nameSpace: string = commandEvent.nameSpace.join("_");
    const result: Result = {
      sap_total: 0,
      repzo_total: 0,
      created: 0,
      updated: 0,
      failed: 0,
    };
    const failed_docs_report: FailedDocsReport = [];

    const sap_categories: SAPCategory[] = await get_sap_categories(
      commandEvent.app.formData.sapHostUrl,
      {},
    );
    result.sap_total = sap_categories?.length;

    await commandLog
      .addDetail(`${result.sap_total} Item Groups in SAP`)
      .commit();

    const repzo_categories = await repzo.category.find({
      per_page: 50000,
    });
    result.repzo_total = repzo_categories?.data?.length;
    await commandLog
      .addDetail(`${repzo_categories?.data?.length} Product Category in Repzo`)
      .commit();

    for (let i = 0; i < sap_categories?.length; i++) {
      const sap_category: SAPCategory = sap_categories[i];
      const repzo_category = repzo_categories.data.find(
        (r_cat) =>
          r_cat.integration_meta?.id ==
          `${nameSpace}_${sap_category.GROUPCODE}`,
      );

      const body: Service.Category.Create.Body | Service.Category.Update.Body =
        {
          name: sap_category.GROUPDESC,
          disabled: false,
          integration_meta: { id: `${nameSpace}_${sap_category.GROUPCODE}` },
          company_namespace: [nameSpace],
        };

      if (!repzo_category) {
        // Create
        try {
          const created_category = await repzo.category.create(
            body as Service.Category.Create.Body,
          );
          result.created++;
        } catch (e: any) {
          console.log("Create Product Category Failed >> ", e?.response, body);
          failed_docs_report.push({
            method: "create",
            doc: body,
            error_message: set_error(e),
          });
          result.failed++;
        }
      } else {
        if (
          repzo_category?.integration_meta?.id == body?.integration_meta?.id &&
          repzo_category?.name == body?.name
        ) {
          continue;
        }

        // Update
        try {
          const updated_category = await repzo.category.update(
            repzo_category._id,
            body as Service.Category.Update.Body,
          );
          result.updated++;
        } catch (e: any) {
          console.log(
            "Update Product Category Failed >> ",
            e?.response?.data,
            body,
          );
          failed_docs_report.push({
            method: "update",
            doc_id: repzo_category?._id,
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

const get_sap_categories = async (
  serviceEndPoint: string,
  query?: { updateAt?: string },
): Promise<SAPCategory[]> => {
  try {
    const sap_categories: SAPCategories = await _create(
      serviceEndPoint,
      "/ItemGroup",
      {},
    );
    return sap_categories.ItemGroup;
  } catch (e: any) {
    throw e;
  }
};
