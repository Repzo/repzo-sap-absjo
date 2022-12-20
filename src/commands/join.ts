import Repzo from "repzo";
import { Service } from "repzo/lib/types";
import { EVENT, Config, CommandEvent } from "../types";
import { _fetch, _create, _update, _delete } from "../util.js";

export const join = async (commandEvent: CommandEvent) => {
  const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
    env: commandEvent.env,
  });

  const commandLog = new Repzo.CommandLog(
    repzo,
    commandEvent.app,
    commandEvent.command
  );
  try {
    // console.log("join");

    await commandLog.load(commandEvent.sync_id);
    await commandLog.addDetail("Repzo SAP: Join").commit();

    const body: Service.JoinActionsWeHook.Data = {
      data: [
        // invoice
        {
          app: "repzo-sap-absjo",
          app_id: commandEvent?.app?._id,
          action: "create_invoice",
          event: "invoiceItems.create",
          join:
            commandEvent?.app?.formData?.invoices?.createInvoiceHook || false,
        },
        // return_invoice
        {
          app: "repzo-sap-absjo",
          app_id: commandEvent?.app?._id,
          action: "create_return_invoice",
          event: "returnItems.create",
          join:
            commandEvent?.app?.formData?.invoices?.createReturnInvoiceHook ||
            false,
        },
        // payment
        {
          app: "repzo-sap-absjo",
          app_id: commandEvent?.app?._id,
          action: "create_payment",
          event: "payment.create",
          join:
            commandEvent?.app?.formData?.payments?.createPaymentHook || false,
        },
        // proforma
        {
          app: "repzo-sap-absjo",
          app_id: commandEvent?.app?._id,
          action: "create_proforma",
          event: "salesorder.approve",
          join:
            commandEvent?.app?.formData?.proformas
              ?.createApprovedProformaHook || false,
        },
        // transfer
        {
          app: "repzo-sap-absjo",
          app_id: commandEvent?.app?._id,
          action: "create_transfer",
          event: "transfer.approve",
          join:
            commandEvent?.app?.formData?.transfers
              ?.createApprovedTransferHook || false,
        },
      ],
    };

    const result = await repzo.joinActionsWebHook.update(null, body);
    // console.log(result);

    await commandLog.setStatus("success").setBody(result).commit();
  } catch (e: any) {
    //@ts-ignore
    console.error(e?.response?.data || e);
    await commandLog.setStatus("fail", e).commit();
    throw e;
  }
};
