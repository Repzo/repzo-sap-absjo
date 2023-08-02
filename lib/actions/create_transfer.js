import Repzo from "repzo";
import { _create, send_command_to_marketplace } from "../util.js";
import { v4 as uuid } from "uuid";
export const create_transfer = async (event, options) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
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
      if (body === null || body === void 0 ? void 0 : body._id) {
        body.integration_meta =
          (body === null || body === void 0 ? void 0 : body.integration_meta) ||
          {};
        body.integration_meta.sync_to_sap_started = true;
        body.integration_meta.sync_to_sap_succeeded =
          body.integration_meta.sync_to_sap_succeeded || false;
        await repzo.transfer.update(body._id, {
          integration_meta: body.integration_meta,
        });
      }
    } catch (e) {
      console.error(e);
      await actionLog
        .addDetail(
          `Failed updating integration_meta of Transfer: ${repzo_serial_number}`
        )
        .commit();
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
      (_d = options.data) === null || _d === void 0 ? void 0 : _d.sapHostUrl;
    if (!SAP_HOST_URL)
      throw `SAP Host Url is missing and Required: ${SAP_HOST_URL}`;
    const repzo_transfer = body;
    // Get Repzo Rep
    let repzo_rep;
    if (repzo_transfer.creator.type == "rep") {
      repzo_rep = await repzo.rep.get(
        (_e =
          repzo_transfer === null || repzo_transfer === void 0
            ? void 0
            : repzo_transfer.creator) === null || _e === void 0
          ? void 0
          : _e._id
      );
      if (!repzo_rep)
        throw `Rep with _id: ${repzo_transfer.creator._id} not found in Repzo`;
    }
    // Get Repzo Products with its own Populated MeasureUnit
    const repzo_product_ids = {};
    (_f = repzo_transfer.variants) === null || _f === void 0
      ? void 0
      : _f.forEach((item) => {
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
      ((_g = repzo_transfer.variants) === null || _g === void 0
        ? void 0
        : _g.length);
      i++
    ) {
      const repzo_transfer_item = repzo_transfer.variants[i];
      const repzo_product =
        (_h =
          repzo_products === null || repzo_products === void 0
            ? void 0
            : repzo_products.data) === null || _h === void 0
          ? void 0
          : _h.find(
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
            (_j = repzo_product.sv_measureUnit) === null || _j === void 0
              ? void 0
              : _j.toString()
          } was not found`
        );
      }
      variants.push({
        //@ts-ignore
        ItemCode: repzo_transfer_item.variant_name,
        Quantity: repzo_transfer_item.qty / Number(repzo_measure_unit.factor),
        //@ts-ignore
        FromWarehouse:
          (_k = repzo_transfer.from) === null || _k === void 0
            ? void 0
            : _k.code,
        //@ts-ignore
        ToWarehouse:
          (_l = repzo_transfer.to) === null || _l === void 0 ? void 0 : _l.code,
      });
    }
    const sap_transfer = {
      StockTransferID: body.serial_number.formatted,
      SalesPersonCode: repzo_rep
        ? repzo_rep.integration_id
        : (_m = options.data) === null || _m === void 0
        ? void 0
        : _m.SalesPersonCode,
      FromWarehouse: body.from.code,
      ToWarehouse: body.to.code,
      RepzoStockTransferLines: variants,
    };
    // console.dir(sap_transfer, { depth: null });
    await actionLog
      .addDetail(
        `Repzo => SAP: Transfer - ${repzo_serial_number}`,
        sap_transfer
      )
      .commit();
    const result = await _create(
      SAP_HOST_URL,
      "/AddStockTransfer",
      sap_transfer
    );
    // console.log(result);
    try {
      if (body === null || body === void 0 ? void 0 : body._id) {
        body.integration_meta =
          (body === null || body === void 0 ? void 0 : body.integration_meta) ||
          {};
        body.integration_meta.sync_to_sap_succeeded = true;
        await repzo.transfer.update(body._id, {
          integration_meta: body.integration_meta,
        });
      }
    } catch (e) {
      console.error(e);
      await actionLog
        .addDetail(
          `Failed updating integration_meta of Transfer: ${repzo_serial_number}`
        )
        .commit();
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
      (_p =
        (_o =
          options === null || options === void 0 ? void 0 : options.data) ===
          null || _o === void 0
          ? void 0
          : _o.transfers) === null || _p === void 0
        ? void 0
        : _p.adjustInventoryInFailedTransfer
    ) {
      send_command_to_marketplace({
        command: "adjust_inventory",
        app_id: options.app_id,
        env: options.env,
        repzoApiKey:
          (_q = options.data) === null || _q === void 0
            ? void 0
            : _q.repzoApiKey,
      });
    }
    throw e;
  }
};
