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

interface SAPRep {
  USERID: number; // 135;
  USERDESC: string; // "MT ZIYAD AL SALAH";
  DEPARTMENTCODE: string; // "D3";
  USERCASHACCOUNT: string; // "124020002";
  USERCHECKACCTCODE: string; // "124020003";
  USERWHSCODE: string; // "MToffers";
}

interface SAPReps {
  Users: SAPRep[];
}

export const sync_rep = async (commandEvent: CommandEvent) => {
  const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
    env: commandEvent.env,
  });

  const commandLog = new Repzo.CommandLog(
    repzo,
    commandEvent.app,
    commandEvent.command
  );
  try {
    // console.log("sync_rep");

    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_rep";

    await commandLog.load(commandEvent.sync_id);
    await commandLog.addDetail("Repzo SAP: Started Syncing Reps").commit();

    const nameSpace: string = commandEvent.nameSpace.join("_");
    const result: Result = {
      sap_total: 0,
      repzo_total: 0,
      created: 0,
      updated: 0,
      failed: 0,
    };
    const failed_docs_report: FailedDocsReport = [];

    const sap_reps: SAPReps = await get_sap_reps(
      commandEvent.app.formData.sapHostUrl,
      {}
    );
    result.sap_total = sap_reps?.Users?.length;

    await commandLog.addDetail(`${result.sap_total} reps in SAP`).commit();

    // hard code ************************************
    sap_reps?.Users?.forEach((sap_rep) => {
      if (
        sap_rep.USERDESC.startsWith("WS ") ||
        sap_rep.USERDESC.startsWith("RET ")
      ) {
        sap_rep.USERWHSCODE = "1";
      }
      if (sap_rep.USERDESC.startsWith("MT ")) {
        sap_rep.USERWHSCODE = "K.A";
      }
    });
    // **********************************************

    const db = new DataSet([], { autoIndex: false });
    db.createIndex({
      USERID: true,
      USERDESC: true,
      DEPARTMENTCODE: true,
      USERCASHACCOUNT: true,
      USERCHECKACCTCODE: true,
      USERWHSCODE: true,
    });
    db.load(sap_reps?.Users);

    const repzo_reps = await repzo.rep.find({ per_page: 50000 });
    result.repzo_total = repzo_reps?.data?.length;
    await commandLog
      .addDetail(`${repzo_reps?.data?.length} reps in Repzo`)
      .commit();

    for (let i = 0; i < sap_reps?.Users?.length; i++) {
      const sap_rep: SAPRep = sap_reps.Users[i];
      const repzo_rep = repzo_reps.data.find(
        (r_rep) =>
          r_rep.integration_meta?.id == `${nameSpace}_${sap_rep.USERID}`
      );

      let warehouse;
      if (sap_rep.USERWHSCODE && sap_rep.USERWHSCODE != "") {
        const warehouse_res = await repzo.warehouse.find({
          code: sap_rep.USERWHSCODE,
        });
        if (warehouse_res?.data?.length) warehouse = warehouse_res.data[0]._id;
      }

      const body: Service.Rep.Create.Body | Service.Rep.Update.Body = {
        name: sap_rep.USERDESC,
        password: Math.round(Math.random() * (9999 - 1000) + 1000).toString(),
        username: nameSpace + sap_rep.USERID,
        integration_id: sap_rep.USERID?.toString(),
        integration_meta: {
          DEPARTMENTCODE: sap_rep.DEPARTMENTCODE,
          USERCASHACCOUNT: sap_rep.USERCASHACCOUNT,
          USERCHECKACCTCODE: sap_rep.USERCHECKACCTCODE,
          USERWHSCODE: sap_rep.USERWHSCODE,
          id: `${nameSpace}_${sap_rep.USERID}`,
        },
        assigned_warehouse: warehouse,
        company_namespace: [nameSpace],
      };

      if (!repzo_rep) {
        // Create
        try {
          const created_rep = await repzo.rep.create(
            body as Service.Rep.Create.Body
          );
          result.created++;
        } catch (e: any) {
          // console.log("Create Rep Failed >> ", e?.response, body);
          failed_docs_report.push({
            method: "create",
            doc: body,
            error_message: set_error(e),
          });
          result.failed++;
        }
      } else {
        const found_identical_docs = db.search({
          USERID: repzo_rep.integration_id,
          USERDESC: repzo_rep.name,
          DEPARTMENTCODE: repzo_rep.integration_meta?.DEPARTMENTCODE,
          USERCASHACCOUNT: repzo_rep.integration_meta?.USERCASHACCOUNT,
          USERCHECKACCTCODE: repzo_rep.integration_meta?.USERCHECKACCTCODE,
          USERWHSCODE: repzo_rep.integration_meta?.USERWHSCODE,
        });
        if (found_identical_docs.length) continue;
        // Update
        try {
          // Delete Rep.Password
          delete body.password;
          const updated_rep = await repzo.rep.update(
            repzo_rep._id,
            body as Service.Rep.Update.Body
          );
          result.updated++;
        } catch (e: any) {
          // console.log("Update Rep Failed >> ", e?.response?.data, body);
          failed_docs_report.push({
            method: "update",
            doc_id: repzo_rep?._id,
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

const get_sap_reps = async (
  serviceEndPoint: string,
  query?: { updateAt?: string }
): Promise<SAPReps> => {
  try {
    const sap_reps: SAPReps = await _create(serviceEndPoint, "/Users", {});
    return sap_reps;
  } catch (e: any) {
    throw e;
  }
};
