import Repzo from "repzo";
import { Service } from "repzo/src/types";
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

export interface SAPClient {
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

export interface SAPClients {
  result: "Success";
  Customers: SAPClient[];
}

export const sync_client = async (commandEvent: CommandEvent) => {
  const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
    env: commandEvent.env,
  });

  const commandLog = new Repzo.CommandLog(
    repzo,
    commandEvent.app,
    commandEvent.command
  );
  try {
    console.log("sync_client");

    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_client";

    await commandLog.load(commandEvent.sync_id);
    await commandLog.addDetail("Repzo SAP: Started Syncing Clients").commit();

    const nameSpace: string = commandEvent.nameSpace.join("_");
    const result: Result = {
      sap_total: 0,
      repzo_total: 0,
      created: 0,
      updated: 0,
      failed: 0,
    };
    const failed_docs_report: FailedDocsReport = [];

    // Get SAP CLients to be created/updated
    const sap_clients: SAPClient[] = await get_sap_clients(
      commandEvent.app.formData.sapHostUrl,
      {
        updateAt: commandEvent.app.options_formData[bench_time_key],
        GroupCode: commandEvent.app.formData.GroupCode,
      }
    );
    result.sap_total = sap_clients?.length;
    await commandLog
      .addDetail(
        `${result.sap_total} Customers in SAP changed since ${
          commandEvent.app.options_formData[bench_time_key] || "ever"
        }`
      )
      .commit();

    // Get SAP CLients to be created/updated
    const sap_all_clients: SAPClient[] = await get_sap_clients(
      commandEvent.app.formData.sapHostUrl,
      {}
    );
    result.sap_total = sap_clients?.length;

    // Get Repzo Tags
    const repzo_tags = await repzo.tag.find({
      disabled: false,
      per_page: 50000,
    });

    // Get Repzo Channels
    const repzo_channels = await repzo.channel.find({
      disabled: false,
      per_page: 50000,
    });

    // Get Repzo PaymentTerms
    const repzo_payment_terms = await repzo.paymentTerm.find({
      disabled: false,
      per_page: 50000,
    });

    // Get Repzo PriceLists
    const repzo_price_lists = await repzo.priceList.find({
      disabled: false,
      per_page: 50000,
    });

    // Get Repzo Clients
    const repzo_clients = await repzo.client.find({
      per_page: 50000,
      project: ["_id", "integration_meta"],
    });
    result.repzo_total = repzo_clients?.data?.length;
    await commandLog
      .addDetail(`${repzo_clients?.data?.length} Clients in Repzo`)
      .commit();

    for (let i = 0; i < sap_clients?.length; i++) {
      const sap_client: SAPClient = sap_clients[i];
      const repzo_client = repzo_clients.data.find(
        (r_client) =>
          r_client.integration_meta?.id == `${nameSpace}_${sap_client.CLIENTID}`
      );

      const tag = repzo_tags?.data?.find(
        (tag) =>
          tag.integration_meta?.id == `${nameSpace}_${sap_client.TERRITORYID}`
      );
      const channel = repzo_channels?.data?.find(
        (channel) =>
          channel.integration_meta?.id ==
          `${nameSpace}_${sap_client.CLIENTGROUP}`
      );
      const paymentTerm = repzo_payment_terms?.data?.find(
        (paymentTerm) =>
          paymentTerm.integration_meta?.id ==
          `${nameSpace}_${sap_client.PAYMENTTERM}`
      );
      const priceList = repzo_price_lists?.data?.find(
        (pricelist) =>
          pricelist.integration_meta?.id ==
          `${nameSpace}_${sap_client.CLIENTPRICELISTID}`
      );

      let parent;
      if (sap_client.PARENTCODE) {
        parent = sap_all_clients.find(
          (c) => c.CLIENTID == sap_client.PARENTCODE
        );
      }

      const credit_limit = parent
        ? parent.CLIENTCREDITLIMIT
        : sap_client.CLIENTCREDITLIMIT;

      const client_credit_consumed = parent
        ? parent.CLIENTCREDITCONSUMED
        : sap_client.CLIENTCREDITCONSUMED;

      const body: Service.Client.Create.Body | Service.Client.Update.Body = {
        integration_meta: {
          id: `${nameSpace}_${sap_client.CLIENTID}`,
          PAYMENTTERM: sap_client.PAYMENTTERM,
          CLIENTCREDITCONSUMED: parent
            ? parent.CLIENTCREDITCONSUMED
            : sap_client.CLIENTCREDITCONSUMED,
          CLIENTMAXCHEQUEVALUE: parent
            ? parent.CLIENTMAXCHEQUEVALUE
            : sap_client.CLIENTMAXCHEQUEVALUE,
          CLIENTCREDITLIMIT: parent
            ? parent.CLIENTCREDITLIMIT
            : sap_client.CLIENTCREDITLIMIT,
          CLIENTPRICELISTID: sap_client.CLIENTPRICELISTID,
        },
        client_code: sap_client.CLIENTID,
        name: sap_client.CLIENTDESC,
        local_name: sap_client.CLIENTDESCF ? sap_client.CLIENTDESCF : undefined,
        city: sap_client.CLIENTCITY,
        state: sap_client.CLIENTCOUNTY,
        country: sap_client.CLIENTCOUNTRY,
        contact_name: sap_client.CLIENTCONTACTPERSON,
        phone: sap_client.CLIENTPHONE1,
        cell_phone: sap_client.CLIENTPHONE2,
        comment: sap_client.CLIENTNOTE,
        formatted_address: sap_client.CLIENTADDRESSID,
        tags: tag ? [tag._id] : [],
        credit_limit:
          sap_client.CLIENTGROUP == "Cash Van"
            ? 1000000000
            : credit_limit && Math.round(credit_limit * 1000),
        financials: {
          credit_limit:
            sap_client.CLIENTGROUP == "Cash Van"
              ? 1000000000
              : credit_limit && Math.round(credit_limit * 1000),
        },
        channel: channel ? channel._id : undefined,
        paymentTerm: paymentTerm ? paymentTerm._id : undefined,
        sv_priceList: priceList ? priceList._id : undefined,
        disabled: sap_client.ACTIVE == "Y" ? false : true,
        payment_type: sap_client.CLIENTGROUP == "Cash Van" ? "cash" : "credit",
        integrated_client_balance:
          client_credit_consumed && Math.round(client_credit_consumed * 1000),
      };

      if (!repzo_client) {
        // Create
        try {
          const created_client = await repzo.client.create(
            body as Service.Client.Create.Body
          );
          result.created++;
        } catch (e: any) {
          console.log("Create Client Failed >> ", e?.response, body);
          failed_docs_report.push({
            method: "create",
            doc: body,
            error_message: set_error(e),
          });
          result.failed++;
        }
      } else {
        const repzo_original_doc = await repzo.client.get(repzo_client._id);
        // console.log("match", is_matched(body, repzo_original_doc));
        if (is_matched(body, repzo_original_doc)) {
          continue;
        }
        // Update
        try {
          const updated_client = await repzo.client.update(
            repzo_client._id,
            body as Service.Client.Update.Body
          );
          result.updated++;
        } catch (e: any) {
          console.log("Update Client Failed >> ", e?.response?.data, body);
          failed_docs_report.push({
            method: "update",
            doc_id: repzo_client?._id,
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
        UpdateAt: date_formatting(query?.updateAt, "YYYYMMDD:HHmmss"),
        GroupCode: query?.GroupCode || "",
      }
    );
    return sap_clients.Customers;
  } catch (e: any) {
    throw e;
  }
};

const is_matched = (
  body_1: { [keys: string]: any },
  body_2: { [keys: string]: any }
) => {
  try {
    const keys = [
      "client_code",
      "name",
      "local_name",
      "city",
      "state",
      "country",
      "contact_name",
      "phone",
      "cell_phone",
      "comment",
      "formatted_address",
      "tags",
      "credit_limit",
      "financials",
      "channel",
      "paymentTerm",
      "sv_priceList",
      "disabled",
      "payment_type",
      "integrated_client_balance",
    ];
    const integration_meta_keys = [
      "id",
      "PAYMENTTERM",
      "CLIENTCREDITCONSUMED",
      "CLIENTMAXCHEQUEVALUE",
      "CLIENTCREDITLIMIT",
      "CLIENTPRICELISTID",
    ];

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
