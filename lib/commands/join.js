import Repzo from "repzo";
export const join = async (commandEvent) => {
  var _a,
    _b,
    _c,
    _d,
    _e,
    _f,
    _g,
    _h,
    _j,
    _k,
    _l,
    _m,
    _o,
    _p,
    _q,
    _r,
    _s,
    _t,
    _u,
    _v,
    _w,
    _x,
    _y,
    _z,
    _0,
    _1,
    _2,
    _3,
    _4,
    _5;
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
    // console.log("join");
    await commandLog.load(commandEvent.sync_id);
    await commandLog.addDetail("Repzo SAP: Join").commit();
    const body = {
      data: [
        // invoice
        {
          app: "repzo-sap-absjo",
          app_id:
            (_b =
              commandEvent === null || commandEvent === void 0
                ? void 0
                : commandEvent.app) === null || _b === void 0
              ? void 0
              : _b._id,
          action: "create_invoice",
          event: "invoiceItems.create",
          join:
            ((_e =
              (_d =
                (_c =
                  commandEvent === null || commandEvent === void 0
                    ? void 0
                    : commandEvent.app) === null || _c === void 0
                  ? void 0
                  : _c.formData) === null || _d === void 0
                ? void 0
                : _d.invoices) === null || _e === void 0
              ? void 0
              : _e.createInvoiceHook) || false,
        },
        {
          app: "repzo-sap-absjo",
          app_id:
            (_f =
              commandEvent === null || commandEvent === void 0
                ? void 0
                : commandEvent.app) === null || _f === void 0
              ? void 0
              : _f._id,
          action: "create_invoice",
          event: "invoiceItems.report",
          join:
            ((_j =
              (_h =
                (_g =
                  commandEvent === null || commandEvent === void 0
                    ? void 0
                    : commandEvent.app) === null || _g === void 0
                  ? void 0
                  : _g.formData) === null || _h === void 0
                ? void 0
                : _h.invoices) === null || _j === void 0
              ? void 0
              : _j.createInvoiceHook) || false,
        },
        // return_invoice
        {
          app: "repzo-sap-absjo",
          app_id:
            (_k =
              commandEvent === null || commandEvent === void 0
                ? void 0
                : commandEvent.app) === null || _k === void 0
              ? void 0
              : _k._id,
          action: "create_return_invoice",
          event: "returnItems.create",
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
                : _m.invoices) === null || _o === void 0
              ? void 0
              : _o.createReturnInvoiceHook) || false,
        },
        // payment
        {
          app: "repzo-sap-absjo",
          app_id:
            (_p =
              commandEvent === null || commandEvent === void 0
                ? void 0
                : commandEvent.app) === null || _p === void 0
              ? void 0
              : _p._id,
          action: "create_payment",
          event: "payment.create",
          join:
            ((_s =
              (_r =
                (_q =
                  commandEvent === null || commandEvent === void 0
                    ? void 0
                    : commandEvent.app) === null || _q === void 0
                  ? void 0
                  : _q.formData) === null || _r === void 0
                ? void 0
                : _r.payments) === null || _s === void 0
              ? void 0
              : _s.createPaymentHook) || false,
        },
        // proforma
        {
          app: "repzo-sap-absjo",
          app_id:
            (_t =
              commandEvent === null || commandEvent === void 0
                ? void 0
                : commandEvent.app) === null || _t === void 0
              ? void 0
              : _t._id,
          action: "create_proforma",
          event: "salesorder.approve",
          join:
            ((_w =
              (_v =
                (_u =
                  commandEvent === null || commandEvent === void 0
                    ? void 0
                    : commandEvent.app) === null || _u === void 0
                  ? void 0
                  : _u.formData) === null || _v === void 0
                ? void 0
                : _v.proformas) === null || _w === void 0
              ? void 0
              : _w.createApprovedProformaHook) || false,
        },
        // transfer
        {
          app: "repzo-sap-absjo",
          app_id:
            (_x =
              commandEvent === null || commandEvent === void 0
                ? void 0
                : commandEvent.app) === null || _x === void 0
              ? void 0
              : _x._id,
          action: "create_transfer",
          event: "transfer.approve",
          join:
            ((_0 =
              (_z =
                (_y =
                  commandEvent === null || commandEvent === void 0
                    ? void 0
                    : commandEvent.app) === null || _y === void 0
                  ? void 0
                  : _y.formData) === null || _z === void 0
                ? void 0
                : _z.transfers) === null || _0 === void 0
              ? void 0
              : _0.createApprovedTransferHook) || false,
        },
        // client
        {
          app: "repzo-sap-absjo",
          app_id:
            (_1 =
              commandEvent === null || commandEvent === void 0
                ? void 0
                : commandEvent.app) === null || _1 === void 0
              ? void 0
              : _1._id,
          action: "create_client",
          event: "client.create",
          join:
            ((_4 =
              (_3 =
                (_2 =
                  commandEvent === null || commandEvent === void 0
                    ? void 0
                    : commandEvent.app) === null || _2 === void 0
                  ? void 0
                  : _2.formData) === null || _3 === void 0
                ? void 0
                : _3.client) === null || _4 === void 0
              ? void 0
              : _4.createClientHook) || false,
        },
      ],
    };
    const result = await repzo.joinActionsWebHook.update(null, body);
    // console.log(result);
    if (
      (result === null || result === void 0 ? void 0 : result.status) ==
      "failure"
    ) {
      await commandLog.setStatus("fail", result.error).setBody(result).commit();
      return;
    }
    await commandLog.setStatus("success").setBody(result).commit();
  } catch (e) {
    //@ts-ignore
    console.error(
      ((_5 = e === null || e === void 0 ? void 0 : e.response) === null ||
      _5 === void 0
        ? void 0
        : _5.data) || e
    );
    await commandLog.setStatus("fail", e).commit();
    throw e;
  }
};
