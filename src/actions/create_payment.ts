import Repzo from "repzo";
import { EVENT, Config } from "../types";
import { _fetch, _create, _update, _delete } from "../util.js";
import { Service } from "repzo/src/types";
import { v4 as uuid } from "uuid";
import moment from "moment-timezone";
import { get_invoice_from_sap } from "./create_invoice.js";

interface SAPPayment {
  PaymentID: string; // "PAY-1041-3";
  ClientCode?: string; // "C00767";  => required
  PaymentDate: string; // "20211124";
  Amount: string | number; // "3.625";
  InvoiceID?: string | number; // "92560";
  InvoiceTotal?: string | number; // "3.625";
  PaymentType?: "1" | "2"; // 1 => CashAccount, 2 => ChequeAccount;
  CashAccount?: string; // "124020012";
  ChequeAccount?: string;
  ChequeDate?: string;
  ChequeNumber?: string | number;
  BankCode?: string;
  CountryCode?: string; // "JO";
}

export const create_payment = async (event: EVENT, options: Config) => {
  const repzo = new Repzo(options.data?.repzoApiKey, { env: options.env });
  const action_sync_id: string = event?.headers?.action_sync_id || uuid();
  const actionLog = new Repzo.ActionLogs(repzo, action_sync_id);
  let body: Service.Payment.PaymentSchema | any;
  try {
    // console.log("create_payment");
    await actionLog.load(action_sync_id);

    body = event.body;
    try {
      if (body) body = JSON.parse(body);
    } catch (e) {}

    const repzo_serial_number = body?.serial_number?.formatted;
    try {
      if (body?._id) {
        body.integration_meta = body?.integration_meta || {};
        body.integration_meta.sync_to_sap_started = true;
        body.integration_meta.sync_to_sap_succeeded =
          body.integration_meta.sync_to_sap_succeeded || false;
        await repzo.payment.update(body._id, {
          integration_meta: body.integration_meta,
        });
      }
    } catch (e) {
      console.error(e);
    }

    await actionLog
      .addDetail(`Payment - ${repzo_serial_number} => ${body?.sync_id}`)
      .addDetail(
        `Repzo => SAP: Started Create Payment - ${repzo_serial_number}`
      )
      .commit();

    const SAP_HOST_URL = options.data?.sapHostUrl;
    if (!SAP_HOST_URL)
      throw `SAP Host Url is missing and Required: ${SAP_HOST_URL}`;

    const repzo_payment: Service.Payment.PaymentSchema = body;

    // Get Repzo Rep
    let repzo_rep;
    if (repzo_payment.creator.type == "rep") {
      repzo_rep = await repzo.rep.get(repzo_payment?.creator?._id);
      if (!repzo_rep)
        throw `Rep with _id: ${repzo_payment.creator._id} not found in Repzo`;
    }

    // Get Repzo Client
    const repzo_client = await repzo.client.get(repzo_payment?.client_id);
    if (!repzo_client)
      throw `Client with _id: ${repzo_payment.client_id} not found in Repzo`;

    const sap_payment: SAPPayment = {
      PaymentID: repzo_serial_number,
      ClientCode: repzo_client?.client_code,
      PaymentDate: moment(repzo_payment.paytime, "YYYY-MM-DD").format(
        "YYYYMMDD"
      ),
      Amount: repzo_payment.amount / 1000,
    };

    if (repzo_payment?.LinkedTxn) {
      const sap_open_invoices = await get_invoice_from_sap(SAP_HOST_URL, {
        updatedAt: "",
        Status: "",
        InvoiceId: repzo_payment?.LinkedTxn?.Txn_serial_number?.formatted,
      });
      if (!sap_open_invoices?.length) {
        throw `Invoice with serial number: ${repzo_payment.LinkedTxn.Txn_serial_number.formatted} was not found on SAP or was closed`;
      }
      sap_payment.InvoiceID = sap_open_invoices[0].InvoiceID;
      sap_payment.InvoiceTotal =
        repzo_payment?.LinkedTxn?.Txn_invoice_total / 1000;
    } else {
      sap_payment.InvoiceID = "";
      sap_payment.InvoiceTotal = "";
    }

    if (repzo_payment.payment_type == "check") {
      // bank
      //@ts-ignore
      const repzo_bank = await repzo.bank.get(repzo_payment.check?.bank);
      if (!repzo_bank) {
        //@ts-ignore
        throw `Bank with _id: ${repzo_payment.check.bank} not found in Repzo`;
      }
      sap_payment.PaymentType = "2";
      sap_payment.ChequeAccount =
        repzo_rep?.integration_meta?.USERCHECKACCTCODE;
      sap_payment.ChequeDate = moment(
        repzo_payment.check?.check_date,
        "YYYY-MM-DD"
      ).format("YYYYMMDD");
      sap_payment.ChequeNumber = repzo_payment.check?.check_number;
      sap_payment.BankCode = repzo_bank.integration_meta?.BANKCODE;
      sap_payment.CountryCode = repzo_bank.integration_meta?.COUNTRY;
    } else if (repzo_payment.payment_type == "cash") {
      sap_payment.PaymentType = "1";
      sap_payment.CashAccount = repzo_rep?.integration_meta?.USERCASHACCOUNT;
    }

    // console.dir(sap_payment, { depth: null });

    actionLog.addDetail(
      `Repzo => SAP: Payment - ${repzo_serial_number}`,
      sap_payment
    );

    const result = await _create(SAP_HOST_URL, "/AddPayment", sap_payment);

    // console.log(result);

    try {
      if (body?._id) {
        body.integration_meta = body?.integration_meta || {};
        body.integration_meta.sync_to_sap_succeeded = true;
        await repzo.payment.update(body._id, {
          integration_meta: body.integration_meta,
        });
      }
    } catch (e) {
      console.error(e);
    }

    await actionLog
      .addDetail(`SAP Responded with `, result)
      .addDetail(`Repzo => SAP: Payment - ${repzo_serial_number}`)
      .setStatus("success")
      .setBody(repzo_payment)
      .commit();
    return result;
  } catch (e: any) {
    //@ts-ignore
    console.error(e?.response || e);
    await actionLog.setStatus("fail", e).setBody(body).commit();
    throw e;
  }
};
