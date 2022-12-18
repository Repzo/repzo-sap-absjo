import Repzo from "repzo";
import { EVENT, Config } from "../types";
import { _fetch, _create, _update, _delete, get_data } from "../util.js";
import { Service } from "repzo/src/types";
import { v4 as uuid } from "uuid";
import moment from "moment-timezone";

interface SAPInvoiceItem {
  ItemCode: string; // "010-LAG-PO0002";
  Quantity: number; // 10;
  TaxCode: string; // "S16";
  UnitPrice: number; // 383.824;
  DiscountPerc: string; // "0";
  LineTotal: number; // 3838.24;
  UomCode: number; // 3;
  Brand: null;
  Department: string; // "D6";
}

interface SAPInvoice {
  RefNum: string; // "INV-1021-4",
  SalPersCode?: string; // "106", // Required
  DocDate: string; // "20211229",
  DocDueDate: string; // "20211229",
  ClientCode?: string; // "C00041", // Required
  DiscountPerc: string; // "0",
  Note?: string; // "",
  WarehouseCode?: string; // "VS21"; // Required
  LinesDetails: SAPInvoiceItem[];
}

interface SAPOpenInvoice {
  CustomerNumber: string; // "400065-53";
  FatherCode: string; // "400065";
  DocDate: string; // "2022-12-14T21:00:00Z";
  DocDueDate: string; // "2023-02-12T21:00:00Z";
  InvoiceID: number; // 91210;
  InvoiceNumber: string; // "INV-1028-1109";
  InvoiceClientID: string; // "400065-53";
  InvoiceFinalAmount: number; // 125.328;
  InvoiceRemainingAmount: number; // 125.328;
  InvoiceStatus: string; // "O";
}

interface SAPOpenInvoices {
  result: "Success";
  OpenInvoices: SAPOpenInvoice[];
}

export const create_invoice = async (event: EVENT, options: Config) => {
  const repzo = new Repzo(options.data?.repzoApiKey, { env: options.env });
  const action_sync_id: string = event?.headers?.action_sync_id || uuid();
  const actionLog = new Repzo.ActionLogs(repzo, action_sync_id);
  let body: Service.FullInvoice.InvoiceSchema | any;
  try {
    // console.log("create_invoice");
    await actionLog.load(action_sync_id);

    body = event.body;
    try {
      if (body) body = JSON.parse(body);
    } catch (e) {}

    const repzo_serial_number = body?.serial_number?.formatted;

    await actionLog
      .addDetail(
        `Repzo => SAP: Started Create Invoice - ${repzo_serial_number}`
      )
      .commit();

    const SAP_HOST_URL = options.data?.sapHostUrl;
    if (!SAP_HOST_URL)
      throw `SAP Host Url is missing and Required: ${SAP_HOST_URL}`;

    const repzo_invoice: Service.FullInvoice.InvoiceSchema = body;

    // Check if it is already exist in SAP
    const sap_open_invoices = await get_invoice_from_sap(SAP_HOST_URL, {
      updatedAt: "",
      Status: "",
      InvoiceId: repzo_serial_number,
    });

    const open_invoice = sap_open_invoices?.find(
      (inv) => inv?.InvoiceNumber === repzo_serial_number
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

    const closed_invoice = sap_closed_invoices?.find(
      (inv) => inv?.InvoiceNumber === repzo_serial_number
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
      repzo_rep = await repzo.rep.get(repzo_invoice?.creator?._id);
      if (!repzo_rep)
        throw `Rep with _id: ${repzo_invoice.creator._id} not found in Repzo`;
    }

    // Get Repzo Client
    const repzo_client = await repzo.client.get(repzo_invoice?.client_id);
    if (!repzo_client)
      throw `Client with _id: ${repzo_invoice.client_id} not found in Repzo`;

    // Get Repzo Warehouse
    const repzo_warehouse = await repzo.warehouse.get(
      repzo_invoice.origin_warehouse
    );
    if (!repzo_warehouse)
      throw `warehouse with _id: ${repzo_invoice.origin_warehouse} not found in Repzo`;

    const repzo_tax_ids: { [id: string]: true } = {};
    const repzo_measureunit_ids: { [id: string]: true } = {};
    const repzo_product_ids: { [id: string]: true } = {};

    repzo_invoice.items?.forEach((item: Service.Item.Schema) => {
      if (item) {
        repzo_tax_ids[item.tax?._id] = true;
        repzo_measureunit_ids[item.measureunit?._id] = true;
        repzo_product_ids[item.variant?.product_id] = true;
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

    for (let i = 0; i < repzo_invoice?.items?.length; i++) {
      const item = repzo_invoice.items[i];

      // Get Repzo Tax
      const repzo_tax = repzo_taxes?.find(
        (t) => t._id?.toString() == item.tax?._id?.toString()
      );
      if (!repzo_tax) throw `Tax with _id: ${item.tax._id} not found in Repzo`;

      // Get Repzo UoM
      const repzo_measureunit = repzo_measureunits?.find(
        (m) => m._id?.toString() == item.measureunit?._id?.toString()
      );
      if (!repzo_measureunit)
        throw `Uom with _id: ${item.measureunit?._id} not found in Repzo`;

      // Get Repzo Product
      const repzo_product = repzo_products?.find(
        (p) => p._id?.toString() == item.variant?.product_id?.toString()
      );
      if (!repzo_product)
        throw `Product with _id: ${item.measureunit._id} not found in Repzo`;

      items.push({
        ItemCode: item.variant.variant_name,
        Quantity: item.qty,
        TaxCode: repzo_tax.integration_meta.TaxCode,
        UnitPrice: (item.price * repzo_measureunit.factor) / 1000,
        DiscountPerc: "0", // ??
        //@ts-ignore
        LineTotal: item.total_before_tax / 1000,
        UomCode: repzo_measureunit.integration_meta.ALTUOMID,
        Brand: repzo_product.integration_meta?.BRAND, // "B1", // ??
        Department:
          repzo_rep?.integration_meta?.DEPARTMENTCODE ||
          options.data?.DepartmentCode, // "D2",
      });
    }

    const sap_invoice: SAPInvoice = {
      RefNum: repzo_invoice.serial_number.formatted,
      SalPersCode: repzo_rep?.integration_id,
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
  } catch (e: any) {
    //@ts-ignore
    console.error(e?.response || e);
    await actionLog.setStatus("fail", e).setBody(body).commit();
    throw e;
  }
};

export const get_invoice_from_sap = async (
  serviceEndPoint: string,
  query?: { updatedAt: string; Status: string; InvoiceId: string }
): Promise<SAPOpenInvoice[]> => {
  try {
    const sap_openInvoices: SAPOpenInvoices = await _create(
      serviceEndPoint,
      "/OpenInvoices",
      {
        updatedAt: query?.updatedAt,
        Status: query?.Status,
        InvoiceId: query?.InvoiceId,
      }
    );
    return sap_openInvoices?.OpenInvoices;
  } catch (e: any) {
    throw e;
  }
};
