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

import { get_sap_UoMs, SAPUoM } from "./measureunit.js";

export const sync_measureunit_family = async (commandEvent: CommandEvent) => {
  const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
    env: commandEvent.env,
  });

  const commandLog = new Repzo.CommandLog(
    repzo,
    commandEvent.app,
    commandEvent.command,
  );
  try {
    console.log("sync_measureunit_family");

    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_measureunit_family";

    await commandLog.load(commandEvent.sync_id);
    await commandLog
      .addDetail("Repzo SAP: Started Syncing Measure Units Family")
      .commit();

    const nameSpace: string = commandEvent.nameSpace.join("_");
    const result = {
      sap_total: 0,
      repzo_total: 0,
      sap_UoM_total: 0,
      repzo_UoM_total: 0,
      created: 0,
      updated: 0,
      failed: 0,
    };
    const failed_docs_report: FailedDocsReport = [];

    const sap_UoMs: SAPUoM[] = await get_sap_UoMs(
      commandEvent.app.formData.sapHostUrl,
      {},
    );
    result.sap_UoM_total = sap_UoMs?.length;

    await commandLog
      .addDetail(`${result.sap_UoM_total} Unit of Measures in SAP`)
      .commit();

    let repzo_UoMs = await repzo.measureunit.find({
      disabled: false,
      per_page: 50000,
    });
    result.repzo_UoM_total = repzo_UoMs?.data?.length;
    await commandLog
      .addDetail(`${repzo_UoMs?.data?.length} Measure Units in Repzo`)
      .commit();

    if (!repzo_UoMs?.data?.length) {
      throw "measure units are not found or the nameSpace has more than one";
    }

    repzo_UoMs.data = repzo_UoMs.data?.filter((UoM) => UoM.integration_meta);

    const repzo_UoMs_family = await repzo.measureunitFamily.find({
      disabled: false,
      per_page: 50000,
    });
    result.repzo_total = repzo_UoMs_family?.data?.length;
    await commandLog
      .addDetail(
        `${repzo_UoMs_family?.data?.length} Measure Units Family in Repzo`,
      )
      .commit();

    const sap_unique_family: {
      [key: string]: { [integration_id: string]: 1 };
    } = {};

    for (let i = 0; i < sap_UoMs?.length; i++) {
      const sap_UoM = sap_UoMs[i];
      const key = sap_UoM.ITEMCODE;
      if (!sap_unique_family[key]) sap_unique_family[key] = {};
      const uom_key = `${nameSpace}_${sap_UoM.UOMGROUPENTRY}_${sap_UoM.ALTUOMID}`;
      sap_unique_family[key][uom_key] = 1;
    }

    result.sap_total = Object.keys(sap_unique_family)?.length;
    await commandLog
      .addDetail(`${result.sap_total} Measure Units Family in SAP`)
      .commit();

    for (let key in sap_unique_family) {
      const sap_family = sap_unique_family[key];
      const repzo_family = repzo_UoMs_family.data.find(
        (r_family) => r_family.integration_meta?.id == `${nameSpace}_${key}`,
      );

      let measureunits: string[] = [];
      Object.keys(sap_family).forEach((unit) => {
        {
          const UoM = repzo_UoMs?.data?.find(
            (repzo_uom) => repzo_uom?.integration_meta?.id == unit,
          );
          if (UoM) {
            measureunits.push(UoM._id.toString());
          }
        }
      });

      const body:
        | Service.MeasureUnitFamily.Create.Body
        | Service.MeasureUnitFamily.Update.Body = {
        name: key,
        disabled: false,
        integration_meta: { id: `${nameSpace}_${key}` },
        measureunits: measureunits || [],
        company_namespace: [nameSpace],
      };

      if (!repzo_family) {
        // Create
        try {
          const created_UoM = await repzo.measureunitFamily.create(
            body as Service.MeasureUnit.Create.Body,
          );
          result.created++;
        } catch (e: any) {
          console.log(
            "Create Measure Unit Family Failed >> ",
            e?.response,
            body,
          );
          failed_docs_report.push({
            method: "create",
            doc: body,
            error_message: set_error(e),
          });
          result.failed++;
        }
      } else {
        if (
          repzo_family.name == body.name &&
          !_.difference(
            repzo_family?.measureunits?.map((m) => m?.toString()) || [],
            body?.measureunits || [],
          )?.length
        ) {
          continue;
        }

        // Update
        try {
          const updated_UoM = await repzo.measureunitFamily.update(
            repzo_family._id,
            body as Service.MeasureUnit.Update.Body,
          );
          result.updated++;
        } catch (e: any) {
          console.log(
            "Update Measure Unit Family Failed >> ",
            e?.response?.data,
            body,
          );
          failed_docs_report.push({
            method: "update",
            doc_id: repzo_family?._id,
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
