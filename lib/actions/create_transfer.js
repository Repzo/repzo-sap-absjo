import Repzo from "repzo";
import { _create, send_command_to_marketplace } from "../util.js";
import { v4 as uuid } from "uuid";
export const create_transfer = async (event, options) => {
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
    // console.log("create_transfer");
    body = event.body;
    try {
      if (body) body = JSON.parse(body);
    } catch (e) {}
    if (
      (_c =
        body === null || body === void 0 ? void 0 : body.integration_meta) ===
        null || _c === void 0
        ? void 0
        : _c.sync_to_sap_started
    )
      return;
    await actionLog.load(action_sync_id);
    const repzo_serial_number =
      (_d = body === null || body === void 0 ? void 0 : body.serial_number) ===
        null || _d === void 0
        ? void 0
        : _d.formatted;
    try {
      await repzo.updateIntegrationMeta.create(
        [
          { key: "sync_to_sap_started", value: true },
          { key: "sync_to_sap_succeeded", value: false },
        ],
        { _id: body._id, type: "transfers" }
      );
    } catch (e) {
      console.error(e);
    }
    await actionLog
      .addDetail(
        `Transfer - ${repzo_serial_number} => ${
          body === null || body === void 0 ? void 0 : body.sync_id
        }`
      )
      .addDetail(
        `Repzo => SAP: Started Create Transfer - ${repzo_serial_number}`
      )
      .commit();
    const SAP_HOST_URL =
      (_e = options.data) === null || _e === void 0 ? void 0 : _e.sapHostUrl;
    if (!SAP_HOST_URL)
      throw `SAP Host Url is missing and Required: ${SAP_HOST_URL}`;
    const repzo_transfer = body;
    // Get Repzo Rep
    let repzo_rep;
    if (repzo_transfer.creator.type == "rep") {
      repzo_rep = await repzo.rep.get(
        (_f =
          repzo_transfer === null || repzo_transfer === void 0
            ? void 0
            : repzo_transfer.creator) === null || _f === void 0
          ? void 0
          : _f._id
      );
      if (!repzo_rep)
        throw `Rep with _id: ${repzo_transfer.creator._id} not found in Repzo`;
    }
    // Get Repzo Products with its own Populated MeasureUnit
    const repzo_product_ids = {};
    (_g = repzo_transfer.variants) === null || _g === void 0
      ? void 0
      : _g.forEach((item) => {
          if (item === null || item === void 0 ? void 0 : item.product_id) {
            repzo_product_ids[item.product_id.toString()] = true;
          }
        });
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
      { per_page: 50000, populatedKeys: ["measureunit"] }
    );
    // Prepare Transfer Items
    const variants = [];
    for (
      let i = 0;
      i <
      ((_h = repzo_transfer.variants) === null || _h === void 0
        ? void 0
        : _h.length);
      i++
    ) {
      const repzo_transfer_item = repzo_transfer.variants[i];
      const repzo_product =
        (_j =
          repzo_products === null || repzo_products === void 0
            ? void 0
            : repzo_products.data) === null || _j === void 0
          ? void 0
          : _j.find(
              //@ts-ignore
              (p) => {
                var _a;
                return (
                  p._id.toString() ==
                  ((_a = repzo_transfer_item.product_id) === null ||
                  _a === void 0
                    ? void 0
                    : _a.toString())
                );
              }
            );
      if (!repzo_product) {
        // console.log(
        //   `Product with _id: ${repzo_transfer_item.product_id} was not found In Repzo`,
        // );
        throw new Error(
          `Product with _id: ${repzo_transfer_item.product_id} was not found in Repzo`
        );
      }
      const repzo_measure_unit = repzo_product.sv_measureUnit;
      if (
        !(repzo_measure_unit === null || repzo_measure_unit === void 0
          ? void 0
          : repzo_measure_unit._id)
      ) {
        // console.log(
        //   `Measureunit with _id: ${repzo_product.sv_measureUnit?.toString()} was not found`,
        // );
        throw new Error(
          `Measureunit with _id: ${
            (_k = repzo_product.sv_measureUnit) === null || _k === void 0
              ? void 0
              : _k.toString()
          } was not found`
        );
      }
      variants.push({
        //@ts-ignore
        ItemCode: repzo_transfer_item.variant_name,
        Quantity: repzo_transfer_item.qty / Number(repzo_measure_unit.factor),
        //@ts-ignore
        FromWarehouse:
          (_l = repzo_transfer.from) === null || _l === void 0
            ? void 0
            : _l.code,
        //@ts-ignore
        ToWarehouse:
          (_m = repzo_transfer.to) === null || _m === void 0 ? void 0 : _m.code,
      });
    }
    const sap_transfer = {
      StockTransferID: body.serial_number.formatted,
      SalesPersonCode: repzo_rep
        ? repzo_rep.integration_id
        : (_o = options.data) === null || _o === void 0
        ? void 0
        : _o.SalesPersonCode,
      FromWarehouse: body.from.code,
      ToWarehouse: body.to.code,
      RepzoStockTransferLines: variants,
    };
    // console.dir(sap_transfer, { depth: null });
    actionLog.addDetail(
      `Repzo => SAP: Transfer - ${repzo_serial_number}`,
      sap_transfer
    );
    const result = await _create(
      SAP_HOST_URL,
      "/AddStockTransfer",
      sap_transfer
    );
    // console.log(result);
    try {
      await repzo.updateIntegrationMeta.create(
        [{ key: "sync_to_sap_succeeded", value: true }],
        { _id: body._id, type: "transfers" }
      );
    } catch (e) {
      console.error(e);
    }
    await actionLog
      .addDetail(`SAP Responded with `, result)
      .addDetail(`Repzo => SAP: Transfer - ${repzo_serial_number}`)
      .setStatus("success")
      .setBody(body)
      .commit();
    return result;
  } catch (e) {
    //@ts-ignore
    console.error((e === null || e === void 0 ? void 0 : e.response) || e);
    await actionLog.setStatus("fail", e).setBody(body).commit();
    if (
      (_q =
        (_p =
          options === null || options === void 0 ? void 0 : options.data) ===
          null || _p === void 0
          ? void 0
          : _p.transfers) === null || _q === void 0
        ? void 0
        : _q.adjustInventoryInFailedTransfer
    ) {
      send_command_to_marketplace({
        command: "adjust_inventory",
        app_id: options.app_id,
        env: options.env,
        repzoApiKey:
          (_r = options.data) === null || _r === void 0
            ? void 0
            : _r.repzoApiKey,
      });
    }
    throw e;
  }
};
