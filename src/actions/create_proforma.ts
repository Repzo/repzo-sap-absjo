import Repzo from "repzo";
import { EVENT, Config } from "../types";
import { _fetch, _create, _update, _delete } from "../util.js";
import { Service } from "repzo/src/types";
import { v4 as uuid } from "uuid";
import moment from "moment-timezone";

interface SAPProformaItem {
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

interface SAPProforma {
  RefNum: string; // "INV-1021-4",
  SalPersCode: string; // "106",
  DocDate: string; // "20211229",
  DocDueDate: string; // "20211229",
  ClientCode?: string; // "C00041", Required
  DiscountPerc: string; // "0",
  Note?: string; // "",
  WarehouseCode?: string; // "VS21";
  LinesDetails: SAPProformaItem[];
}

export const create_proforma = async (event: EVENT, options: Config) => {
  const repzo = new Repzo(options.data?.repzoApiKey, { env: options.env });
  const action_sync_id: string = event?.headers?.action_sync_id || uuid();
  const actionLog = new Repzo.ActionLogs(repzo, action_sync_id);
  let body: Service.Proforma.ProformaSchema | any;
  try {
    // console.log("create_proforma");
    await actionLog.load(action_sync_id);

    body = event.body;
    try {
      if (body) body = JSON.parse(body);
    } catch (e) {}

    const repzo_serial_number = body?.serial_number?.formatted;
    // try {
    //   if (body?._id) {
    //     body.integration_meta = body?.integration_meta || {};
    //     body.integration_meta.sync_to_sap_started = true;
    //     body.integration_meta.sync_to_sap_succeeded =
    //       body.integration_meta.sync_to_sap_succeeded || false;
    //     await repzo.proforma.update(body._id, {
    //       integration_meta: body.integration_meta,
    //     });
    //   }
    // } catch (e) {
    //   console.error(e);
    // }

    await actionLog
      .addDetail(`SalesOrder - ${repzo_serial_number} => ${body?.sync_id}`)
      .addDetail(
        `Repzo => SAP: Started Create SalesOrder - ${repzo_serial_number}`
      )
      .commit();

    const SAP_HOST_URL = options.data?.sapHostUrl;
    if (!SAP_HOST_URL)
      throw `SAP Host Url is missing and Required: ${SAP_HOST_URL}`;

    const repzo_proforma: Service.Proforma.ProformaSchema = body;

    // Get Repzo Rep
    let repzo_rep;
    if (repzo_proforma.creator.type == "rep") {
      repzo_rep = await repzo.rep.get(repzo_proforma?.creator?._id);
      if (!repzo_rep)
        throw `Rep with _id: ${repzo_proforma.creator._id} not found in Repzo`;
    }

    // Get Repzo Client
    const repzo_client = await repzo.client.get(repzo_proforma?.client_id);
    if (!repzo_client)
      throw `Client with _id: ${repzo_proforma.client_id} not found in Repzo`;

    const repzo_tax_ids: { [id: string]: true } = {};
    const repzo_measureunit_ids: { [id: string]: true } = {};
    const repzo_product_ids: { [id: string]: true } = {};

    repzo_proforma.items?.forEach((item: Service.Item.Schema) => {
      if (item) {
        repzo_tax_ids[item.tax?._id] = true;
        repzo_measureunit_ids[item.measureunit?._id] = true;
        repzo_product_ids[item.variant?.product_id] = true;
      }
    });

    const repzo_taxes = await repzo.patchAction.create(
      {
        slug: "tax",
        readQuery: [
          {
            key: "_id",
            value: Object.keys(repzo_tax_ids),
            operator: "in",
          },
        ],
      },
      { per_page: 50000 }
    );
    const repzo_measureunits = await repzo.patchAction.create(
      {
        slug: "measureunits",
        readQuery: [
          {
            key: "_id",
            value: Object.keys(repzo_measureunit_ids),
            operator: "in",
          },
        ],
      },
      { per_page: 50000 }
    );

    const repzo_products = await repzo.patchAction.create(
      {
        slug: "product",
        readQuery: [
          {
            key: "_id",
            value: Object.keys(repzo_product_ids),
            operator: "in",
          },
        ],
      },
      { per_page: 50000 }
    );

    // Prepare SAP_invoice_items
    const items: SAPProformaItem[] = [];

    for (let i = 0; i < repzo_proforma?.items?.length; i++) {
      const item = repzo_proforma.items[i];

      // Get Repzo Tax
      const repzo_tax = repzo_taxes?.data?.find(
        (t) => t._id?.toString() == item.tax?._id?.toString()
      );
      if (!repzo_tax) throw `Tax with _id: ${item.tax._id} not found in Repzo`;

      // Get Repzo UoM
      const repzo_measureunit = repzo_measureunits?.data?.find(
        (m) => m._id?.toString() == item.measureunit?._id?.toString()
      );
      if (!repzo_measureunit)
        throw `Uom with _id: ${item.measureunit?._id} not found in Repzo`;

      // Get Repzo Product
      const repzo_product = repzo_products?.data?.find(
        (p) => p._id?.toString() == item.variant?.product_id?.toString()
      );
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
        Brand: repzo_product.integration_meta?.BRAND,
        Department:
          repzo_rep?.integration_meta?.DEPARTMENTCODE ||
          options.data?.DepartmentCode, // "D2"
      });
    }

    const sap_invoice: SAPProforma = {
      RefNum: repzo_proforma.serial_number.formatted,
      SalPersCode: repzo_rep
        ? repzo_rep.integration_id
        : options.data?.SalPersCode, // "111",
      DocDate: moment(repzo_proforma.issue_date, "YYYY-MM-DD").format(
        "YYYYMMDD"
      ),
      DocDueDate: moment(repzo_proforma.issue_date, "YYYY-MM-DD").format(
        "YYYYMMDD"
      ),
      ClientCode: repzo_client.client_code,
      DiscountPerc: "0",
      Note: repzo_proforma.comment,
      // WarehouseCode: "1",
      LinesDetails: items,
    };

    // console.dir(sap_invoice, { depth: null });

    actionLog.addDetail(
      `Repzo => SAP: SalesOrder - ${repzo_serial_number}`,
      sap_invoice
    ); // .commit();

    const result = await _create(SAP_HOST_URL, "/AddOrder", sap_invoice);

    // console.log(result);

    // try {
    //   if (body?._id) {
    //     body.integration_meta = body?.integration_meta || {};
    //     body.integration_meta.sync_to_sap_succeeded = true;
    //     await repzo.proforma.update(body._id, {
    //       integration_meta: body.integration_meta,
    //     });
    //   }
    // } catch (e) {
    //   console.error(e);
    // }

    await actionLog
      .addDetail(`SAP Responded with `, result)
      .addDetail(`Repzo => SAP: SalesOrder - ${repzo_serial_number}`)
      .setStatus("success")
      .setBody(repzo_proforma)
      .commit();
    return result;
  } catch (e: any) {
    //@ts-ignore
    console.error(e?.response || e);
    await actionLog.setStatus("fail", e).setBody(body).commit();
    throw e;
  }
};
