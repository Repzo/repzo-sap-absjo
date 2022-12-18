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

interface SAPTax {
  TaxCode: string; // "P4",
  TaxName: string; // "امانات ضريبة مشتريات محلية% 4",
  TaxRate: number; // 4.0,
  Inactive: string; // "N"
}

interface SAPTaxes {
  result: "Success";
  Taxes: SAPTax[];
}

export const sync_tax = async (commandEvent: CommandEvent) => {
  const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
    env: commandEvent.env,
  });

  const commandLog = new Repzo.CommandLog(
    repzo,
    commandEvent.app,
    commandEvent.command,
  );
  try {
    console.log("sync_tax");

    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_tax";

    await commandLog.load(commandEvent.sync_id);
    await commandLog.addDetail("Repzo SAP: Started Syncing Taxes").commit();

    const nameSpace: string = commandEvent.nameSpace.join("_");
    const result: Result = {
      sap_total: 0,
      repzo_total: 0,
      created: 0,
      updated: 0,
      failed: 0,
    };
    const failed_docs_report: FailedDocsReport = [];

    const sap_taxes: SAPTaxes = await get_sap_taxes(
      commandEvent.app.formData.sapHostUrl,
      {},
    );
    result.sap_total = sap_taxes?.Taxes?.length;

    await commandLog.addDetail(`${result.sap_total} taxes in SAP`).commit();

    const db = new DataSet([], { autoIndex: false });
    db.createIndex({
      TaxCode: true,
      TaxName: true,
      TaxRate: true,
      type: "additive",
    });
    db.load(sap_taxes?.Taxes);

    const repzo_taxes = await repzo.tax.find({ per_page: 50000 });
    result.repzo_total = repzo_taxes?.data?.length;
    await commandLog
      .addDetail(`${repzo_taxes?.data?.length} taxes in Repzo`)
      .commit();

    for (let i = 0; i < sap_taxes?.Taxes?.length; i++) {
      const sap_tax: SAPTax = sap_taxes.Taxes[i];
      const repzo_tax = repzo_taxes.data.find(
        (r_tax) =>
          r_tax.integration_meta?.id == `${nameSpace}_${sap_tax.TaxCode}`,
      );

      const body: Service.Tax.Create.Body | Service.Tax.Update.Body = {
        name: sap_tax.TaxName,
        rate: Number(sap_tax.TaxRate / 100),
        type: "additive", // hardcode
        disabled: sap_tax.Inactive === "N" ? false : true,
        integration_meta: {
          id: `${nameSpace}_${sap_tax.TaxCode}`,
          TaxCode: sap_tax.TaxCode,
        },
        company_namespace: [nameSpace],
      };

      if (!repzo_tax) {
        // Create
        try {
          const created_tax = await repzo.tax.create(
            body as Service.Tax.Create.Body,
          );
          result.created++;
        } catch (e: any) {
          console.log("Create Tax Failed >> ", e?.response, body);
          failed_docs_report.push({
            method: "create",
            doc: body,
            error_message: set_error(e),
          });
          result.failed++;
        }
      } else {
        const found_identical_docs = db.search({
          TaxCode: repzo_tax.integration_meta?.TaxCode,
          TaxName: repzo_tax.name,
          TaxRate: repzo_tax.rate * 100,
          type: repzo_tax.type,
        });
        if (found_identical_docs.length) continue;
        // Update
        try {
          const updated_tax = await repzo.tax.update(
            repzo_tax._id,
            body as Service.Tax.Update.Body,
          );
          result.updated++;
        } catch (e: any) {
          console.log("Update Tax Failed >> ", e?.response?.data, body);
          failed_docs_report.push({
            method: "update",
            doc_id: repzo_tax?._id,
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

const get_sap_taxes = async (
  serviceEndPoint: string,
  query?: { updateAt?: string },
): Promise<SAPTaxes> => {
  try {
    const sap_taxes: SAPTaxes = await _create(serviceEndPoint, "/Taxes", {
      Inactive: "N",
    });
    return sap_taxes;
  } catch (e: any) {
    throw e;
  }
};
