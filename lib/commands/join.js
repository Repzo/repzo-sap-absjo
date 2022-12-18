import Repzo from "repzo";
export const join = async (commandEvent) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
  const repzo = new Repzo(
    (_a = commandEvent.app.formData) === null || _a === void 0
      ? void 0
      : _a.repzoApiKey,
    {
      env: commandEvent.env,
    }
  );
  const commandLog = new Repzo.CommandLog(
    repzo,
    commandEvent.app,
    commandEvent.command
  );
  try {
    console.log("join");
    await commandLog.load(commandEvent.sync_id);
    await commandLog.addDetail("Repzo SAP: Join").commit();
    const body = {
      data: [
        // invoice
        {
          app: "repzo-sap",
          action: "create_invoice",
          event: "invoiceItems.create",
          join:
            ((_d =
              (_c =
                (_b =
                  commandEvent === null || commandEvent === void 0
                    ? void 0
                    : commandEvent.app) === null || _b === void 0
                  ? void 0
                  : _b.formData) === null || _c === void 0
                ? void 0
                : _c.invoices) === null || _d === void 0
              ? void 0
              : _d.createInvoiceHook) || false,
        },
        // return_invoice
        {
          app: "repzo-sap",
          action: "create_return_invoice",
          event: "returnItems.create",
          join:
            ((_g =
              (_f =
                (_e =
                  commandEvent === null || commandEvent === void 0
                    ? void 0
                    : commandEvent.app) === null || _e === void 0
                  ? void 0
                  : _e.formData) === null || _f === void 0
                ? void 0
                : _f.invoices) === null || _g === void 0
              ? void 0
              : _g.createReturnInvoiceHook) || false,
        },
        // payment
        {
          app: "repzo-sap",
          action: "create_payment",
          event: "payment.create",
          join:
            ((_k =
              (_j =
                (_h =
                  commandEvent === null || commandEvent === void 0
                    ? void 0
                    : commandEvent.app) === null || _h === void 0
                  ? void 0
                  : _h.formData) === null || _j === void 0
                ? void 0
                : _j.payments) === null || _k === void 0
              ? void 0
              : _k.createPaymentHook) || false,
        },
        // proforma
        {
          app: "repzo-sap",
          action: "create_proforma",
          event: "salesorder.approve",
          join:
            ((_o =
              (_m =
                (_l =
                  commandEvent === null || commandEvent === void 0
                    ? void 0
                    : commandEvent.app) === null || _l === void 0
                  ? void 0
                  : _l.formData) === null || _m === void 0
                ? void 0
                : _m.payments) === null || _o === void 0
              ? void 0
              : _o.createApprovedProformaHook) || false,
        },
        // transfer
        {
          app: "repzo-sap",
          action: "create_transfer",
          event: "transfer.approve",
          join:
            ((_r =
              (_q =
                (_p =
                  commandEvent === null || commandEvent === void 0
                    ? void 0
                    : commandEvent.app) === null || _p === void 0
                  ? void 0
                  : _p.formData) === null || _q === void 0
                ? void 0
                : _q.payments) === null || _r === void 0
              ? void 0
              : _r.createApprovedTransferHook) || false,
        },
      ],
    };
    const result = await repzo.joinActionsWebHook.update(null, body);
    // console.log(result);
    await commandLog.setStatus("success").setBody(result).commit();
  } catch (e) {
    //@ts-ignore
    console.error(
      ((_s = e === null || e === void 0 ? void 0 : e.response) === null ||
      _s === void 0
        ? void 0
        : _s.data) || e
    );
    await commandLog.setStatus("fail", e).commit();
    throw e;
  }
};
