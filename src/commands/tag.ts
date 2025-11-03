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

interface SAPTag {
  TerritoryID: number; // 754;
  Description: string; // "الاردن";
}

interface SAPTags {
  result: "Success";
  Territories: SAPTag[];
}

export const sync_tag = async (commandEvent: CommandEvent) => {
  const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
    env: commandEvent.env,
  });

  const commandLog = new Repzo.CommandLog(
    repzo,
    commandEvent.app,
    commandEvent.command
  );
  try {
    // console.log("sync_tag");

    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_tag";

    await commandLog.load(commandEvent.sync_id);
    await commandLog.addDetail("Repzo SAP: Started Syncing Tags").commit();

    const nameSpace: string = commandEvent.nameSpace.join("_");
    const result: Result = {
      sap_total: 0,
      repzo_total: 0,
      created: 0,
      updated: 0,
      failed: 0,
    };
    const failed_docs_report: FailedDocsReport = [];

    const sap_tags: SAPTags = await get_sap_tags(
      commandEvent.app.formData.sapHostUrl,
      {}
    );
    result.sap_total = sap_tags?.Territories?.length;

    await commandLog
      .addDetail(`${result.sap_total} Territories in SAP`)
      .commit();

    const db = new DataSet([], { autoIndex: false });
    db.createIndex({
      TerritoryID: true,
      Description: true,
    });
    db.load(sap_tags?.Territories);

    const repzo_tags = await repzo.tag.find({ type: "area", per_page: 50000 });
    result.repzo_total = repzo_tags?.data?.length;
    await commandLog
      .addDetail(`${repzo_tags?.data?.length} Area Tags in Repzo`)
      .commit();

    for (let i = 0; i < sap_tags?.Territories?.length; i++) {
      const sap_tag: SAPTag = sap_tags.Territories[i];
      const repzo_tag = repzo_tags.data.find(
        (r_tag) =>
          r_tag.integration_meta?.id == `${nameSpace}_${sap_tag.TerritoryID}`
      );

      const body: Service.Tag.Create.Body | Service.Tag.Update.Body = {
        tag: sap_tag.Description,
        type: "area",
        disabled: false,
        integration_meta: {
          id: `${nameSpace}_${sap_tag.TerritoryID}`,
          TerritoryID: sap_tag.TerritoryID,
        },
        company_namespace: [nameSpace],
      };

      if (!repzo_tag) {
        // Create
        try {
          const created_tag = await repzo.tag.create(
            body as Service.Tag.Create.Body
          );
          result.created++;
        } catch (e: any) {
          // console.log("Create Tag Failed >> ", e?.response, body);
          failed_docs_report.push({
            method: "create",
            doc: body,
            error_message: set_error(e),
          });
          result.failed++;
        }
      } else {
        const found_identical_docs = db.search({
          TerritoryID: repzo_tag.integration_meta?.TerritoryID,
          Description: repzo_tag.tag,
        });
        if (found_identical_docs.length) continue;
        // Update
        try {
          const updated_tag = await repzo.tag.update(
            repzo_tag._id,
            body as Service.Tag.Update.Body
          );
          result.updated++;
        } catch (e: any) {
          // console.log("Update Tag Failed >> ", e?.response?.data, body);
          failed_docs_report.push({
            method: "update",
            doc_id: repzo_tag?._id,
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

const get_sap_tags = async (
  serviceEndPoint: string,
  query?: { updateAt?: string }
): Promise<SAPTags> => {
  try {
    const sap_tags: SAPTags = (await _create(serviceEndPoint, "/Territories", {
      Inactive: "N",
    })) as SAPTags;
    return sap_tags;
  } catch (e: any) {
    throw e;
  }
};
