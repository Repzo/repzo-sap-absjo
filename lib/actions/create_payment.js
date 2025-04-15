import Repzo from "repzo";
import { _create } from "../util.js";
import { v4 as uuid } from "uuid";
import moment from "moment-timezone";
import { get_invoice_from_sap } from "./create_invoice.js";
export const create_payment = async (event, options) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
  const repzo = new Repzo(
    (_a = options.data) === null || _a === void 0 ? void 0 : _a.repzoApiKey,
    { env: options.env }
  );
  const action_sync_id =
    ((_b = event === null || event === void 0 ? void 0 : event.headers) ===
      null || _b === void 0
      ? void 0
      : _b.action_sync_id) || uuid();
  const actionLog = new Repzo.ActionLogs(repzo, action_sync_id);
  let body;
  try {
    // console.log("create_payment");
    await actionLog.load(action_sync_id);
    body = event.body;
    try {
      if (body) body = JSON.parse(body);
    } catch (e) {}
    const repzo_serial_number =
      (_c = body === null || body === void 0 ? void 0 : body.serial_number) ===
        null || _c === void 0
        ? void 0
        : _c.formatted;
    try {
      await repzo.updateIntegrationMeta.create(
        [
          { key: "sync_to_sap_started", value: true },
          { key: "sync_to_sap_succeeded", value: false },
        ],
        { _id: body._id, type: "payments" }
      );
    } catch (e) {
      console.error(e);
    }
    await actionLog
      .addDetail(
        `Payment - ${repzo_serial_number} => ${
          body === null || body === void 0 ? void 0 : body.sync_id
        }`
      )
      .addDetail(
        `Repzo => SAP: Started Create Payment - ${repzo_serial_number}`
      )
      .commit();
    const SAP_HOST_URL =
      (_d = options.data) === null || _d === void 0 ? void 0 : _d.sapHostUrl;
    if (!SAP_HOST_URL)
      throw `SAP Host Url is missing and Required: ${SAP_HOST_URL}`;
    const repzo_payment = body;
    // Get Repzo Rep
    let repzo_rep;
    if (repzo_payment.creator.type == "rep") {
      repzo_rep = await repzo.rep.get(
        (_e =
          repzo_payment === null || repzo_payment === void 0
            ? void 0
            : repzo_payment.creator) === null || _e === void 0
          ? void 0
          : _e._id
      );
      if (!repzo_rep)
        throw `Rep with _id: ${repzo_payment.creator._id} not found in Repzo`;
    }
    // Get Repzo Client
    const repzo_client = await repzo.client.get(
      repzo_payment === null || repzo_payment === void 0
        ? void 0
        : repzo_payment.client_id
    );
    if (!repzo_client)
      throw `Client with _id: ${repzo_payment.client_id} not found in Repzo`;
    const sap_payment = {
      UserId:
        repzo_rep === null || repzo_rep === void 0
          ? void 0
          : repzo_rep.integration_id,
      PaymentID: repzo_serial_number,
      ClientCode:
        repzo_client === null || repzo_client === void 0
          ? void 0
          : repzo_client.client_code,
      PaymentDate: moment(repzo_payment.paytime, "YYYY-MM-DD").format(
        "YYYYMMDD"
      ),
      Amount: repzo_payment.amount / 1000,
    };
    if (
      repzo_payment === null || repzo_payment === void 0
        ? void 0
        : repzo_payment.LinkedTxn
    ) {
      const repzo_inv_serial_number =
        (_g =
          (_f =
            repzo_payment === null || repzo_payment === void 0
              ? void 0
              : repzo_payment.LinkedTxn) === null || _f === void 0
            ? void 0
            : _f.Txn_serial_number) === null || _g === void 0
          ? void 0
          : _g.formatted;
      const repzo_invoices = await repzo.invoice.find({
        "serial_number.formatted": repzo_inv_serial_number,
      });
      const repzo_invoice =
        (_h =
          repzo_invoices === null || repzo_invoices === void 0
            ? void 0
            : repzo_invoices.data) === null || _h === void 0
          ? void 0
          : _h.find((inv) => {
              var _a;
              return (
                ((_a = inv.serial_number) === null || _a === void 0
                  ? void 0
                  : _a.formatted) == repzo_inv_serial_number
              );
            });
      if (!repzo_invoice) {
        throw `Invoice with serial number: ${repzo_inv_serial_number} was not found on Repzo`;
      }
      let sap_open_invoices = [];
      if (repzo_invoice.advanced_serial_number) {
        sap_open_invoices = await get_invoice_from_sap(SAP_HOST_URL, {
          updatedAt: "",
          Status: "",
          InvoiceId: repzo_invoice.advanced_serial_number,
        });
      }
      if (
        !(sap_open_invoices === null || sap_open_invoices === void 0
          ? void 0
          : sap_open_invoices.length)
      ) {
        sap_open_invoices = await get_invoice_from_sap(SAP_HOST_URL, {
          updatedAt: "",
          Status: "",
          InvoiceId: repzo_inv_serial_number,
        });
      }
      if (
        !(sap_open_invoices === null || sap_open_invoices === void 0
          ? void 0
          : sap_open_invoices.length)
      ) {
        throw `Invoice with serial number: ${repzo_inv_serial_number} & advance serial number: ${repzo_invoice.advanced_serial_number} was not found on SAP or was closed`;
      }
      sap_payment.InvoiceID = sap_open_invoices[0].InvoiceID;
      sap_payment.InvoiceTotal =
        ((_j =
          repzo_payment === null || repzo_payment === void 0
            ? void 0
            : repzo_payment.LinkedTxn) === null || _j === void 0
          ? void 0
          : _j.Txn_invoice_total) / 1000;
    } else {
      sap_payment.InvoiceID = "";
      sap_payment.InvoiceTotal = "";
    }
    if (repzo_payment.payment_type == "check") {
      // bank
      //@ts-ignore
      const repzo_bank = await repzo.bank.get(
        (_k = repzo_payment.check) === null || _k === void 0 ? void 0 : _k.bank
      );
      if (!repzo_bank) {
        //@ts-ignore
        throw `Bank with _id: ${repzo_payment.check.bank} not found in Repzo`;
      }
      sap_payment.PaymentType = "2";
      sap_payment.ChequeAccount =
        (_l =
          repzo_rep === null || repzo_rep === void 0
            ? void 0
            : repzo_rep.integration_meta) === null || _l === void 0
          ? void 0
          : _l.USERCHECKACCTCODE;
      sap_payment.ChequeDate = moment(
        (_m = repzo_payment.check) === null || _m === void 0
          ? void 0
          : _m.check_date,
        "YYYY-MM-DD"
      ).format("YYYYMMDD");
      sap_payment.ChequeNumber =
        (_o = repzo_payment.check) === null || _o === void 0
          ? void 0
          : _o.check_number;
      sap_payment.BankCode =
        (_p = repzo_bank.integration_meta) === null || _p === void 0
          ? void 0
          : _p.BANKCODE;
      sap_payment.CountryCode =
        (_q = repzo_bank.integration_meta) === null || _q === void 0
          ? void 0
          : _q.COUNTRY;
    } else if (repzo_payment.payment_type == "cash") {
      sap_payment.PaymentType = "1";
      sap_payment.CashAccount =
        (_r =
          repzo_rep === null || repzo_rep === void 0
            ? void 0
            : repzo_rep.integration_meta) === null || _r === void 0
          ? void 0
          : _r.USERCASHACCOUNT;
    }
    // console.dir(sap_payment, { depth: null });
    actionLog.addDetail(
      `Repzo => SAP: Payment - ${repzo_serial_number}`,
      sap_payment
    );
    const result = await _create(SAP_HOST_URL, "/AddPayment", sap_payment);
    // console.log(result);
    try {
      await repzo.updateIntegrationMeta.create(
        [{ key: "sync_to_sap_succeeded", value: true }],
        { _id: body._id, type: "payments" }
      );
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
  } catch (e) {
    //@ts-ignore
    console.error((e === null || e === void 0 ? void 0 : e.response) || e);
    await actionLog.setStatus("fail", e).setBody(body).commit();
    throw e;
  }
};
