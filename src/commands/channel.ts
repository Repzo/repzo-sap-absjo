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

interface SAPClient {
  CLIENTID: string; // "C01077";
  CLIENTDESC: string; // "س م عايش";
  CLIENTADDRESS?: string; // null;
  CLIENTCITY?: string; // null;
  CLIENTCOUNTRY?: string; // null;
  CLIENTCOUNTY?: string; // null;
  CLIENTGROUPCODE: number; // 123;
  CLIENTGROUP: string; // "Cash Van";
  PAYMENTTERM: number; // 0;
  CLIENTCONTACTPERSON?: string; // null;
  CLIENTPHONE1?: string; // null;
  CLIENTPHONE2?: string; // null;
  CLIENTNOTE?: string; // null;
  CLIENTSTATUS: "N" | "Y";
  CLIENTCREDITCONSUMED: number; // 0.0;
  CLIENTMAXCHEQUEVALUE: number; // 0.0;
  CLIENTCREDITLIMIT: number; // 0.0;
  CLIENTPRICELISTID: number; // 2;
  CLIENTADDRESSID?: string; // null;
  CLIENTDESCF?: string; // null;
  SALESPERSONCODE: number; // -1;
  DISCOUNTPERCENT: number; // 0.0;
  ACTIVE: "N" | "Y";
  FROZEN: "N" | "Y";
  TERRITORYID?: string; // null;
  TERRITORYNAME?: string; // null;
  CREATEDATE: string; // "2021-12-06T21:00:00Z";
  UPDATEDATE: string; // "2022-11-29T21:00:00Z";
  PARENTCODE?: string; // null;
}

interface SAPClients {
  result: "Success";
  Customers: SAPClient[];
}

export const sync_channel = async (commandEvent: CommandEvent) => {
  const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
    env: commandEvent.env,
  });

  const commandLog = new Repzo.CommandLog(
    repzo,
    commandEvent.app,
    commandEvent.command
  );
  try {
    // console.log("sync_channel");

    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_channel";

    await commandLog.load(commandEvent.sync_id);
    await commandLog
      .addDetail("Repzo SAP: Started Syncing Client Channels")
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

    const sap_clients: SAPClient[] = await get_sap_clients(
      commandEvent.app.formData.sapHostUrl,
      {
        updateAt: commandEvent.app.options_formData[bench_time_key],
        GroupCode: commandEvent.app.formData.GroupCode,
      }
    );

    const sap_unique_channels: { [key: string]: true } = {};
    sap_clients?.forEach((client: SAPClient) => {
      const channel = client.CLIENTGROUP;
      sap_unique_channels[channel] = true;
    });

    const sap_channels = Object.keys(sap_unique_channels);

    result.sap_total = sap_channels?.length;
    await commandLog
      .addDetail(
        `${result.sap_total} Client Channels in SAP  changed since ${
          commandEvent.app.options_formData[bench_time_key] || "ever"
        }`
      )
      .commit();

    const repzo_channels = await repzo.channel.find({ per_page: 50000 });
    result.repzo_total = repzo_channels?.data?.length;
    await commandLog
      .addDetail(`${repzo_channels?.data?.length} Client Channels in Repzo`)
      .commit();

    for (let i = 0; i < sap_channels?.length; i++) {
      const sap_channel: string = sap_channels[i];
      const repzo_channel = repzo_channels.data.find(
        (r_channel) =>
          r_channel.integration_meta?.id == `${nameSpace}_${sap_channel}`
      );

      const body: Service.Channel.Create.Body | Service.Channel.Update.Body = {
        name: sap_channel,
        disabled: false,
        integration_meta: {
          id: `${nameSpace}_${sap_channel}`,
        },
        company_namespace: [nameSpace],
      };

      if (!repzo_channel) {
        // Create
        try {
          const created_channel = await repzo.channel.create(
            body as Service.Channel.Create.Body
          );
          result.created++;
        } catch (e: any) {
          // console.log("Create Client Channel Failed >> ", e?.response, body);
          failed_docs_report.push({
            method: "create",
            doc: body,
            error_message: set_error(e),
          });
          result.failed++;
        }
      } else {
        if (
          repzo_channel?.name == body?.name &&
          repzo_channel?.disabled == body?.disabled
        )
          continue;
        // Update
        try {
          const updated_channel = await repzo.channel.update(
            repzo_channel._id,
            body as Service.Channel.Update.Body
          );
          result.updated++;
        } catch (e: any) {
          // console.log(
          //   "Update Client Channel Failed >> ",
          //   e?.response?.data,
          //   body
          // );
          failed_docs_report.push({
            method: "update",
            doc_id: repzo_channel?._id,
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

const get_sap_clients = async (
  serviceEndPoint: string,
  query?: { updateAt?: string; GroupCode?: string }
): Promise<SAPClient[]> => {
  try {
    const sap_clients: SAPClients = await _create(
      serviceEndPoint,
      "/Customers",
      {
        Active: "Y",
        Frozen: "N",
        UpdateAt: date_formatting(query?.updateAt, "YYYYMMDD:000000"),
        GroupCode: query?.GroupCode || "",
      }
    );
    return sap_clients.Customers;
  } catch (e: any) {
    throw e;
  }
};
