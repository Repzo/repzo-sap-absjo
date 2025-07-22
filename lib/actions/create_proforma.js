import Repzo from "repzo";
import { _create, getUniqueConcatenatedValues } from "../util.js";
import { v4 as uuid } from "uuid";
import moment from "moment-timezone";
export const create_proforma = async (event, options) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
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
    // console.log("create_proforma");
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
        { _id: body._id, type: "proformas" }
      );
    } catch (e) {
      console.error(e);
    }
    await actionLog
      .addDetail(
        `SalesOrder - ${repzo_serial_number} => ${
          body === null || body === void 0 ? void 0 : body.sync_id
        }`
      )
      .addDetail(
        `Repzo => SAP: Started Create SalesOrder - ${repzo_serial_number}`
      )
      .commit();
    const SAP_HOST_URL =
      (_d = options.data) === null || _d === void 0 ? void 0 : _d.sapHostUrl;
    if (!SAP_HOST_URL)
      throw `SAP Host Url is missing and Required: ${SAP_HOST_URL}`;
    const repzo_proforma = body;
    // Get Repzo Rep
    let repzo_rep;
    if (repzo_proforma.creator.type == "rep") {
      repzo_rep = await repzo.rep.get(
        (_e =
          repzo_proforma === null || repzo_proforma === void 0
            ? void 0
            : repzo_proforma.creator) === null || _e === void 0
          ? void 0
          : _e._id,
        {
          populatedKeys: ["warehouse"],
        }
      );
      if (!repzo_rep)
        throw `Rep with _id: ${repzo_proforma.creator._id} not found in Repzo`;
    }
    let rep_warehouse_code;
    if (
      repzo_rep &&
      (repzo_rep === null || repzo_rep === void 0
        ? void 0
        : repzo_rep.assigned_warehouse)
    ) {
      rep_warehouse_code =
        (_f =
          repzo_rep === null || repzo_rep === void 0
            ? void 0
            : repzo_rep.assigned_warehouse) === null || _f === void 0
          ? void 0
          : _f.code;
    }
    // Get Repzo Client
    const repzo_client = await repzo.client.get(
      repzo_proforma === null || repzo_proforma === void 0
        ? void 0
        : repzo_proforma.client_id
    );
    if (!repzo_client)
      throw `Client with _id: ${repzo_proforma.client_id} not found in Repzo`;
    const repzo_tax_ids = {};
    const repzo_measureunit_ids = {};
    const repzo_product_ids = {};
    (_g = repzo_proforma.items) === null || _g === void 0
      ? void 0
      : _g.forEach((item) => {
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
    const all_promotions = {};
    (_h =
      repzo_proforma === null || repzo_proforma === void 0
        ? void 0
        : repzo_proforma.promotions) === null || _h === void 0
      ? void 0
      : _h.forEach((promo) => {
          if (!promo) return;
          all_promotions[promo._id] = {
            _id: promo._id,
            name: promo.name,
            ref: promo.ref,
          };
        });
    // Prepare SAP_invoice_items
    const items = [];
    for (
      let i = 0;
      i <
      ((_j =
        repzo_proforma === null || repzo_proforma === void 0
          ? void 0
          : repzo_proforma.items) === null || _j === void 0
        ? void 0
        : _j.length);
      i++
    ) {
      const item = repzo_proforma.items[i];
      // Get Repzo Tax
      const repzo_tax =
        (_k =
          repzo_taxes === null || repzo_taxes === void 0
            ? void 0
            : repzo_taxes.data) === null || _k === void 0
          ? void 0
          : _k.find((t) => {
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
        (_l =
          repzo_measureunits === null || repzo_measureunits === void 0
            ? void 0
            : repzo_measureunits.data) === null || _l === void 0
          ? void 0
          : _l.find((m) => {
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
          (_m = item.measureunit) === null || _m === void 0 ? void 0 : _m._id
        } not found in Repzo`;
      // Get Repzo Product
      const repzo_product =
        (_o =
          repzo_products === null || repzo_products === void 0
            ? void 0
            : repzo_products.data) === null || _o === void 0
          ? void 0
          : _o.find((p) => {
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
        MEO_Serial: getUniqueConcatenatedValues(
          item,
          "ref",
          " | ",
          all_promotions
        ),
        Promotion_Name: getUniqueConcatenatedValues(
          item,
          "name",
          " | ",
          all_promotions
        ),
        ItemCode: item.variant.variant_name,
        Quantity: item.qty,
        TaxCode: repzo_tax.integration_meta.TaxCode,
        UnitPrice: (item.price * repzo_measureunit.factor) / 1000,
        DiscountPerc: "0",
        //@ts-ignore
        LineTotal: item.total_before_tax / 1000,
        UomCode: repzo_measureunit.integration_meta.ALTUOMID,
        Brand:
          (_p = repzo_product.integration_meta) === null || _p === void 0
            ? void 0
            : _p.BRAND,
        Department:
          ((_q =
            repzo_rep === null || repzo_rep === void 0
              ? void 0
              : repzo_rep.integration_meta) === null || _q === void 0
            ? void 0
            : _q.DEPARTMENTCODE) ||
          ((_r = options.data) === null || _r === void 0
            ? void 0
            : _r.DepartmentCode), // "D2"
      });
    }
    const sap_invoice = {
      RefNum: repzo_proforma.serial_number.formatted,
      SalPersCode: repzo_rep
        ? repzo_rep.integration_id
        : (_s = options.data) === null || _s === void 0
        ? void 0
        : _s.SalPersCode, // "111",
      DocDate: moment(repzo_proforma.issue_date, "YYYY-MM-DD").format(
        "YYYYMMDD"
      ),
      DocDueDate: moment(repzo_proforma.issue_date, "YYYY-MM-DD").format(
        "YYYYMMDD"
      ),
      ClientCode: repzo_client.client_code,
      DiscountPerc: "0",
      Note: repzo_proforma.comment,
      WarehouseCode:
        rep_warehouse_code ||
        ((_t = options.data) === null || _t === void 0
          ? void 0
          : _t.defaultWarehouseForSalesOrder), // "1",
      LinesDetails: items,
    };
    // console.dir(sap_invoice, { depth: null });
    actionLog.addDetail(
      `Repzo => SAP: SalesOrder - ${repzo_serial_number}`,
      sap_invoice
    ); // .commit();
    const result = await _create(SAP_HOST_URL, "/AddOrder", sap_invoice);
    // console.log(result);
    try {
      await repzo.updateIntegrationMeta.create(
        [{ key: "sync_to_sap_succeeded", value: true }],
        { _id: body._id, type: "proformas" }
      );
    } catch (e) {
      console.error(e);
    }
    await actionLog
      .addDetail(`SAP Responded with `, result)
      .addDetail(`Repzo => SAP: SalesOrder - ${repzo_serial_number}`)
      .setStatus("success")
      .setBody(repzo_proforma)
      .commit();
    return result;
  } catch (e) {
    //@ts-ignore
    console.error((e === null || e === void 0 ? void 0 : e.response) || e);
    await actionLog.setStatus("fail", e).setBody(body).commit();
    throw e;
  }
};
