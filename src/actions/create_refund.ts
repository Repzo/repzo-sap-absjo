import Repzo from "repzo";
import { EVENT, Config } from "../types";
import { _fetch, _create, _update, _delete } from "../util.js";
import { Service } from "repzo/src/types";
import { v4 as uuid } from "uuid";
import moment from "moment-timezone";

interface SAPOutgoingPayment {
  ClientCode?: string; // "C00184"; => required
  PaymentID: string; // "REF-1006-1" => refund serial_number.formatted;
  PaymentDate: string; // "20260713";
  PaymentType: "1" | "2"; // 1 => CashAccount, 2 => ChequeAccount;
  Amount: string | number; // "150.500";
  CashAccount?: string; // "11101001";
  ChequeAccount?: string; // "11102001";
  ChequeNumber?: string | number; // "784512";
  ChequeDate?: string; // "20260801";
}

export const create_refund = async (event: EVENT, options: Config) => {
  const repzo = new Repzo(options.data?.repzoApiKey, { env: options.env });
  const action_sync_id: string = event?.headers?.action_sync_id || uuid();
  const actionLog = new Repzo.ActionLogs(repzo, action_sync_id);
  let body: Service.Refund.RefundSchema | any;
  try {
    // console.log("create_refund");
    await actionLog.load(action_sync_id);

    body = event.body;
    try {
      if (body) body = JSON.parse(body);
    } catch (e) {}

    const repzo_serial_number = body?.serial_number?.formatted;
    try {
      await repzo.updateIntegrationMeta.create(
        [
          { key: "sync_to_sap_started", value: true },
          { key: "sync_to_sap_succeeded", value: false },
        ],
        { _id: body._id, type: "refunds" }
      );
    } catch (e) {
      console.error(e);
    }

    await actionLog
      .addDetail(`Refund - ${repzo_serial_number} => ${body?.sync_id}`)
      .addDetail(`Repzo => SAP: Started Create Refund - ${repzo_serial_number}`)
      .commit();

    const SAP_HOST_URL = options.data?.sapHostUrl;
    if (!SAP_HOST_URL)
      throw `SAP Host Url is missing and Required: ${SAP_HOST_URL}`;

    const repzo_refund: Service.Refund.RefundSchema = body;

    // Get Repzo Rep (the account codes are per-rep). Refund creator can be a
    // rep or an admin; when an admin records on behalf of a rep the account
    // codes belong to the rep who delivered it (implemented_by).
    let repzo_rep;
    if (repzo_refund.creator?.type == "rep") {
      repzo_rep = await repzo.rep.get(repzo_refund?.creator?._id);
      if (!repzo_rep)
        throw `Rep with _id: ${repzo_refund.creator._id} not found in Repzo`;
    } else if (repzo_refund.implemented_by?.type == "rep") {
      repzo_rep = await repzo.rep.get(repzo_refund?.implemented_by?._id);
      if (!repzo_rep)
        throw `Rep with _id: ${repzo_refund.implemented_by._id} not found in Repzo`;
    }

    // Get Repzo Client
    const repzo_client = await repzo.client.get(repzo_refund?.client_id);
    if (!repzo_client)
      throw `Client with _id: ${repzo_refund.client_id} not found in Repzo`;

    const sap_outgoing_payment: SAPOutgoingPayment = {
      ClientCode: repzo_client?.client_code,
      PaymentID: repzo_serial_number,
      PaymentDate: moment(repzo_refund.paytime, "YYYY-MM-DD").format(
        "YYYYMMDD"
      ),
      PaymentType: repzo_refund.transaction_type == "check" ? "2" : "1",
      Amount: (repzo_refund.amount / 1000).toFixed(3),
    };

    if (repzo_refund.transaction_type == "check") {
      // PaymentType "2" => ChequeAccount
      sap_outgoing_payment.ChequeAccount =
        repzo_rep?.integration_meta?.USERCHECKACCTCODE;

      // Refunds do not store the cheque inline (unlike payments). The cheque is
      // stored in the `checks` collection, linked via refund_serial_number (a
      // cheque written for this refund) or via the linked payment's serial
      // (when refunding a cheque payment). `check.find` cannot filter by serial,
      // so fetch the client's cheques and match on the serial number.
      const checks = await repzo.check.find({
        client_id: repzo_refund.client_id,
        per_page: 50000,
      });
      const repzo_check = checks?.data?.find(
        (c) =>
          c.refund_serial_number?.formatted == repzo_serial_number ||
          (repzo_refund.LinkedTxn?.TxnType == "payment" &&
            c.payment_serial_number?.formatted ==
              repzo_refund.LinkedTxn?.Txn_serial_number?.formatted)
      );
      if (!repzo_check)
        throw `Cheque for refund with serial number: ${repzo_serial_number} was not found in Repzo yet - the cheque record was likely not created at the time this refund webhook fired; the svix retry mechanism will pick it up on the next attempt`;

      sap_outgoing_payment.ChequeNumber = repzo_check.check_number;
      sap_outgoing_payment.ChequeDate = moment(
        repzo_check.check_date,
        "YYYY-MM-DD"
      ).format("YYYYMMDD");
    } else {
      // PaymentType "1" => CashAccount
      sap_outgoing_payment.CashAccount =
        repzo_rep?.integration_meta?.USERCASHACCOUNT;
    }

    // console.dir(sap_outgoing_payment, { depth: null });

    actionLog.addDetail(
      `Repzo => SAP: Refund - ${repzo_serial_number}`,
      sap_outgoing_payment
    );

    const result = await _create(
      SAP_HOST_URL,
      "/OutgoingPayment",
      sap_outgoing_payment
    );

    // console.log(result);

    try {
      await repzo.updateIntegrationMeta.create(
        [{ key: "sync_to_sap_succeeded", value: true }],
        { _id: body._id, type: "refunds" }
      );
    } catch (e) {
      console.error(e);
    }

    await actionLog
      .addDetail(`SAP Responded with `, result)
      .addDetail(`Repzo => SAP: Refund - ${repzo_serial_number}`)
      .setStatus("success")
      .setBody(repzo_refund)
      .commit();
    return result;
  } catch (e: any) {
    //@ts-ignore
    console.error(e?.response || e);
    await actionLog.setStatus("fail", e).setBody(body).commit();
    throw e;
  }
};
