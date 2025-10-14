import Repzo from "repzo";
import { EVENT, Config } from "../types";
import { _fetch, _create, _update, _delete } from "../util.js";
import { Service } from "repzo/src/types";
import { v4 as uuid } from "uuid";

interface SAPCustomer {
  AdditionalID: string; // "68eb85af0a28bf5038627c91";
  CardName?: string; // "ÄBD";
  Phone1?: string; // "0788877776";
  cellular?: string; // "234567";
  CLIENTID?: string; // "CL01483";
  CLIENTADDRESS?: string; // null;
  CLIENTCITY?: string; // null;
  CLIENTCOUNTRY?: string; // null;
  CLIENTCOUNTY?: string; // null;
  CLIENTGROUPCODE?: number; // 113;
  CLIENTGROUP?: string; // "RETAIL - توزيع";
  PAYMENTTERM?: number; // 0;
  CLIENTCONTACTPERSON?: string; // "الدوره حي الشرطه قرب ماركت الريان";
  CLIENTPHONE1?: string; // "07761490829";
  CLIENTPHONE2?: string; // null;
  CLIENTNOTE?: string; // null;
  CLIENTSTATUS?: "Y" | "N"; // "N";
  CLIENTCREDITCONSUMED?: number; // 0.0;
  CLIENTMAXCHEQUEVALUE?: number; // 1500000.0;
  CLIENTCREDITLIMIT?: number; // 1500000.0;
  CLIENTPRICELISTID?: number; // 2;
  CLIENTADDRESSID?: string; // null;
  CLIENTDESCF?: string; // null;
  SALESPERSONCODE?: number; // 8;
  DISCOUNTPERCENT?: number; // 0.0;
  TERRITORYID?: string; // null;
  TERRITORYNAME?: string; // null;
  PARENTCODE?: string; // null;
}

export const create_client = async (event: EVENT, options: Config) => {
  const repzo = new Repzo(options.data?.repzoApiKey, { env: options.env });
  const action_sync_id: string = event?.headers?.action_sync_id || uuid();
  const actionLog = new Repzo.ActionLogs(repzo, action_sync_id);
  let body: Service.Client.Data | any;
  try {
    // console.log("create_client");
    await actionLog.load(action_sync_id);

    body = event.body;
    try {
      if (body) body = JSON.parse(body);
    } catch (e) {}

    try {
      await repzo.updateIntegrationMeta.create(
        [
          { key: "sync_to_sap_started", value: true },
          { key: "sync_to_sap_succeeded", value: false },
        ],
        { _id: body._id, type: "clients" },
      );
    } catch (e) {
      console.error(e);
    }

    await actionLog
      .addDetail(`Client - ${body?.name} => ${body?.sync_id}`)
      .addDetail(`Repzo => SAP: Started Create Client - ${body?.name}`)
      .commit();

    const SAP_HOST_URL = options.data?.sapHostUrl;
    if (!SAP_HOST_URL)
      throw `SAP Host Url is missing and Required: ${SAP_HOST_URL}`;

    const repzo_client: Service.Client.Data = body;

    const channel = repzo_client.channel
      ? await repzo.channel.get(repzo_client.channel)
      : null;
    const paymentTerm = repzo_client.paymentTerm
      ? await repzo.paymentTerm.get(repzo_client.paymentTerm)
      : null;
    const price_list = repzo_client.sv_priceList
      ? await repzo.priceList.get(repzo_client.sv_priceList)
      : null;
    const price_list_name = price_list?.integration_meta?.id
      ? Number(price_list.integration_meta.id.split("-")[1])
      : undefined;
    const rep = repzo_client.assigned_to?.length
      ? await repzo.rep.get(repzo_client.assigned_to[0])
      : undefined;
    const tags = repzo_client.tags?.length
      ? await repzo.tag.find({ _id: repzo_client.tags, type: "area" })
      : null;
    const area_tags = tags?.data?.filter(
      (t) =>
        t.type === "area" && !t.disabled && t.integration_meta?.TerritoryID,
    );

    const sap_customer: SAPCustomer = {
      AdditionalID: repzo_client._id,
      CLIENTID: repzo_client.client_code,
      CLIENTDESCF: repzo_client.local_name,
      CLIENTCITY: repzo_client.city,
      CLIENTCOUNTY: repzo_client.state,
      CLIENTCOUNTRY: repzo_client.country,
      CLIENTCONTACTPERSON: repzo_client.contact_name,
      CLIENTPHONE1: repzo_client.phone,
      CLIENTPHONE2: repzo_client.cell_phone,
      CLIENTNOTE: repzo_client.comment,
      CLIENTADDRESSID: repzo_client.formatted_address,
      CLIENTGROUP: channel?.name,
      PAYMENTTERM: paymentTerm?.due_days,
      CLIENTPRICELISTID: price_list_name,
      SALESPERSONCODE: rep ? Number(rep?.integration_id) : undefined,
      TERRITORYID: area_tags?.[0]?.integration_meta?.TerritoryID,
      CLIENTCREDITCONSUMED: repzo_client.integrated_client_balance
        ? repzo_client.integrated_client_balance / 1000
        : undefined,
      //   CLIENTMAXCHEQUEVALUE: 1500000.0,
      CLIENTCREDITLIMIT: repzo_client.financials?.credit_limit
        ? repzo_client.financials?.credit_limit / 1000
        : undefined,
      //   CardName: "ÄBD",
      //   Phone1: "0788877776",
      //   cellular: "234567",
      //   CLIENTADDRESS: null,
      //   CLIENTGROUPCODE: 113,
      //   CLIENTSTATUS: "N",
      //   DISCOUNTPERCENT: 0.0,
      //   TERRITORYNAME: null,
      //   PARENTCODE: null, // ????
    };

    // console.dir(sap_customer, { depth: null });

    actionLog.addDetail(`Repzo => SAP: Client - ${body?.name}`, sap_customer);

    const result: {
      result: "Success";
      message: string | "The Customer already Exists in SAP";
    } = await _create(SAP_HOST_URL, "/AddCustomer", sap_customer);

    // console.log(result);

    actionLog.addDetail(`SAP Responded with `, result);

    if (
      result.result == "Success" &&
      result.message != "The Customer already Exists in SAP"
    ) {
      const update_repzo_client_body: Service.Client.Update.Body = {
        client_code: result.message,
        "integration_meta.id": `${repzo_client.company_namespace[0]}_${result.message}`,
      };

      const updated_repzo_client = await repzo.client.update(
        repzo_client._id,
        update_repzo_client_body,
      );

      actionLog.addDetail(`Update Client Code: ${body?.name} in Repzo`);
      // console.log({ updated_repzo_client });
    }

    try {
      await repzo.updateIntegrationMeta.create(
        [{ key: "sync_to_sap_succeeded", value: true }],
        { _id: body._id, type: "clients" },
      );
    } catch (e) {
      console.error(e);
    }

    await actionLog
      .addDetail(`Repzo => SAP: Client - ${body?.name}`)
      .setStatus("success")
      .setBody(repzo_client)
      .commit();
    return result;
  } catch (e: any) {
    //@ts-ignore
    console.error(e?.response || e);
    await actionLog.setStatus("fail", e).setBody(body).commit();
    throw e;
  }
};
