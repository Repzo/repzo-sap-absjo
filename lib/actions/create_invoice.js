import Repzo from "repzo";
import { _create, get_data } from "../util.js";
import { v4 as uuid } from "uuid";
import moment from "moment-timezone";
export const create_invoice = async (event, options) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
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
    // console.log("create_invoice");
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
    await actionLog
      .addDetail(
        `Repzo => SAP: Started Create Invoice - ${repzo_serial_number}`
      )
      .commit();
    const SAP_HOST_URL =
      (_d = options.data) === null || _d === void 0 ? void 0 : _d.sapHostUrl;
    if (!SAP_HOST_URL)
      throw `SAP Host Url is missing and Required: ${SAP_HOST_URL}`;
    const repzo_invoice = body;
    // Check if it is already exist in SAP
    const sap_open_invoices = await get_invoice_from_sap(SAP_HOST_URL, {
      updatedAt: "",
      Status: "",
      InvoiceId: repzo_serial_number,
    });
    const open_invoice =
      sap_open_invoices === null || sap_open_invoices === void 0
        ? void 0
        : sap_open_invoices.find(
            (inv) =>
              (inv === null || inv === void 0 ? void 0 : inv.InvoiceNumber) ===
              repzo_serial_number
          );
    if (open_invoice) {
      await actionLog
        .addDetail(`Checked Already in SAP `, open_invoice)
        .addDetail(`Invoice - ${repzo_serial_number} Checked Already in SAP`)
        .setStatus("success")
        .setBody(repzo_invoice)
        .commit();
      return {
        message: "Checked Already in SAP",
        result: open_invoice,
      };
    }
    // Check closed invoice in SAP
    const sap_closed_invoices = await get_invoice_from_sap(SAP_HOST_URL, {
      updatedAt: "",
      Status: "closed",
      InvoiceId: repzo_serial_number,
    });
    const closed_invoice =
      sap_closed_invoices === null || sap_closed_invoices === void 0
        ? void 0
        : sap_closed_invoices.find(
            (inv) =>
              (inv === null || inv === void 0 ? void 0 : inv.InvoiceNumber) ===
              repzo_serial_number
          );
    if (closed_invoice) {
      await actionLog
        .addDetail(`Checked Closed Already in SAP `, closed_invoice)
        .addDetail(
          `Invoice - ${repzo_serial_number} Checked Closed Already in SAP`
        )
        .setStatus("success")
        .setBody(repzo_invoice)
        .commit();
      return {
        message: "Checked Closed Already in SAP",
        result: closed_invoice,
      };
    }
    // Get Repzo Rep
    let repzo_rep;
    if (repzo_invoice.creator.type == "rep") {
      repzo_rep = await repzo.rep.get(
        (_e =
          repzo_invoice === null || repzo_invoice === void 0
            ? void 0
            : repzo_invoice.creator) === null || _e === void 0
          ? void 0
          : _e._id
      );
      if (!repzo_rep)
        throw `Rep with _id: ${repzo_invoice.creator._id} not found in Repzo`;
    }
    // Get Repzo Client
    const repzo_client = await repzo.client.get(
      repzo_invoice === null || repzo_invoice === void 0
        ? void 0
        : repzo_invoice.client_id
    );
    if (!repzo_client)
      throw `Client with _id: ${repzo_invoice.client_id} not found in Repzo`;
    // Get Repzo Warehouse
    const repzo_warehouse = await repzo.warehouse.get(
      repzo_invoice.origin_warehouse
    );
    if (!repzo_warehouse)
      throw `warehouse with _id: ${repzo_invoice.origin_warehouse} not found in Repzo`;
    const repzo_tax_ids = {};
    const repzo_measureunit_ids = {};
    const repzo_product_ids = {};
    (_f = repzo_invoice.items) === null || _f === void 0
      ? void 0
      : _f.forEach((item) => {
          var _a, _b, _c;
          if (item) {
            repzo_tax_ids[
              (_a = item.tax) === null || _a === void 0 ? void 0 : _a._id
            ] = true;
            repzo_measureunit_ids[
              (_b = item.measureunit) === null || _b === void 0
                ? void 0
                : _b._id
            ] = true;
            repzo_product_ids[
              (_c = item.variant) === null || _c === void 0
                ? void 0
                : _c.product_id
            ] = true;
          }
        });
    const repzo_taxes = await get_data(
      repzo.tax,
      "_id",
      Object.keys(repzo_tax_ids)
    );
    const repzo_measureunits = await get_data(
      repzo.measureunit,
      "_id",
      Object.keys(repzo_measureunit_ids)
    );
    const repzo_products = await get_data(
      repzo.product,
      "_id",
      Object.keys(repzo_product_ids)
    );
    // Prepare SAP_invoice_items
    const items = [];
    for (
      let i = 0;
      i <
      ((_g =
        repzo_invoice === null || repzo_invoice === void 0
          ? void 0
          : repzo_invoice.items) === null || _g === void 0
        ? void 0
        : _g.length);
      i++
    ) {
      const item = repzo_invoice.items[i];
      // Get Repzo Tax
      const repzo_tax =
        repzo_taxes === null || repzo_taxes === void 0
          ? void 0
          : repzo_taxes.find((t) => {
              var _a, _b, _c;
              return (
                ((_a = t._id) === null || _a === void 0
                  ? void 0
                  : _a.toString()) ==
                ((_c =
                  (_b = item.tax) === null || _b === void 0
                    ? void 0
                    : _b._id) === null || _c === void 0
                  ? void 0
                  : _c.toString())
              );
            });
      if (!repzo_tax) throw `Tax with _id: ${item.tax._id} not found in Repzo`;
      // Get Repzo UoM
      const repzo_measureunit =
        repzo_measureunits === null || repzo_measureunits === void 0
          ? void 0
          : repzo_measureunits.find((m) => {
              var _a, _b, _c;
              return (
                ((_a = m._id) === null || _a === void 0
                  ? void 0
                  : _a.toString()) ==
                ((_c =
                  (_b = item.measureunit) === null || _b === void 0
                    ? void 0
                    : _b._id) === null || _c === void 0
                  ? void 0
                  : _c.toString())
              );
            });
      if (!repzo_measureunit)
        throw `Uom with _id: ${
          (_h = item.measureunit) === null || _h === void 0 ? void 0 : _h._id
        } not found in Repzo`;
      // Get Repzo Product
      const repzo_product =
        repzo_products === null || repzo_products === void 0
          ? void 0
          : repzo_products.find((p) => {
              var _a, _b, _c;
              return (
                ((_a = p._id) === null || _a === void 0
                  ? void 0
                  : _a.toString()) ==
                ((_c =
                  (_b = item.variant) === null || _b === void 0
                    ? void 0
                    : _b.product_id) === null || _c === void 0
                  ? void 0
                  : _c.toString())
              );
            });
      if (!repzo_product)
        throw `Product with _id: ${item.measureunit._id} not found in Repzo`;
      items.push({
        ItemCode: item.variant.variant_name,
        Quantity: item.qty,
        TaxCode: repzo_tax.integration_meta.TaxCode,
        UnitPrice: (item.price * repzo_measureunit.factor) / 1000,
        DiscountPerc: "0",
        //@ts-ignore
        LineTotal: item.total_before_tax / 1000,
        UomCode: repzo_measureunit.integration_meta.ALTUOMID,
        Brand:
          (_j = repzo_product.integration_meta) === null || _j === void 0
            ? void 0
            : _j.BRAND,
        Department:
          ((_k =
            repzo_rep === null || repzo_rep === void 0
              ? void 0
              : repzo_rep.integration_meta) === null || _k === void 0
            ? void 0
            : _k.DEPARTMENTCODE) ||
          ((_l = options.data) === null || _l === void 0
            ? void 0
            : _l.DepartmentCode), // "D2",
      });
    }
    const sap_invoice = {
      RefNum: repzo_invoice.serial_number.formatted,
      SalPersCode:
        repzo_rep === null || repzo_rep === void 0
          ? void 0
          : repzo_rep.integration_id,
      DocDate: moment(repzo_invoice.issue_date, "YYYY-MM-DD").format(
        "YYYYMMDD"
      ),
      DocDueDate: moment(repzo_invoice.due_date, "YYYY-MM-DD").format(
        "YYYYMMDD"
      ),
      ClientCode: repzo_client.client_code,
      DiscountPerc: "0",
      Note: repzo_invoice.comment,
      WarehouseCode: repzo_warehouse.code,
      LinesDetails: items,
    };
    // console.dir(sap_invoice, { depth: null });
    await actionLog
      .addDetail(`Repzo => SAP: Invoice - ${repzo_serial_number}`, sap_invoice)
      .commit();
    const result = await _create(SAP_HOST_URL, "/AddInvoice", sap_invoice);
    // console.log(result);
    await actionLog
      .addDetail(`SAP Responded with `, result)
      .addDetail(`Repzo => SAP: Invoice - ${repzo_serial_number}`)
      .setStatus("success")
      .setBody(repzo_invoice)
      .commit();
    return result;
  } catch (e) {
    //@ts-ignore
    console.error((e === null || e === void 0 ? void 0 : e.response) || e);
    await actionLog.setStatus("fail", e).setBody(body).commit();
    throw e;
  }
};
export const get_invoice_from_sap = async (serviceEndPoint, query) => {
  try {
    const sap_openInvoices = await _create(serviceEndPoint, "/OpenInvoices", {
      updatedAt: query === null || query === void 0 ? void 0 : query.updatedAt,
      Status: query === null || query === void 0 ? void 0 : query.Status,
      InvoiceId: query === null || query === void 0 ? void 0 : query.InvoiceId,
    });
    return sap_openInvoices === null || sap_openInvoices === void 0
      ? void 0
      : sap_openInvoices.OpenInvoices;
  } catch (e) {
    throw e;
  }
};
