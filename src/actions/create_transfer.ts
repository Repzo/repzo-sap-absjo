import Repzo from "repzo";
import { EVENT, Config } from "../types";
import { _fetch, _create, _update, _delete, get_data } from "../util.js";
import { Service } from "repzo/src/types";
import { v4 as uuid } from "uuid";
import moment from "moment-timezone";

interface SAPTransferItem {
  ItemCode: string; // "010-RAI-SC0002";
  Quantity: string | number; // "1";
  FromWarehouse: string | number; // "1";
  ToWarehouse: string | number; // "12";
}

interface SAPTransfer {
  StockTransferID: string; // "TestStockTransfer1";
  FromWarehouse: string | number; // "1";
  ToWarehouse: string | number; // "12";
  SalesPersonCode: string | number; // "110";
  RepzoStockTransferLines: SAPTransferItem[];
}

export const create_transfer = async (event: EVENT, options: Config) => {
  const repzo = new Repzo(options.data?.repzoApiKey, { env: options.env });
  const action_sync_id: string = event?.headers?.action_sync_id || uuid();
  const actionLog = new Repzo.ActionLogs(repzo, action_sync_id);
  let body: Service.Transfer.Schema | any;
  try {
    // console.log("create_transfer");
    await actionLog.load(action_sync_id);

    body = event.body;
    try {
      if (body) body = JSON.parse(body);
    } catch (e) {}

    const repzo_serial_number = body?.serial_number?.formatted;

    await actionLog
      .addDetail(
        `Repzo => SAP: Started Create Transfer - ${repzo_serial_number}`
      )
      .commit();

    const SAP_HOST_URL = options.data?.sapHostUrl;
    if (!SAP_HOST_URL)
      throw `SAP Host Url is missing and Required: ${SAP_HOST_URL}`;

    const repzo_transfer: Service.Transfer.Schema = body;

    // Get Repzo Rep
    let repzo_rep;
    if (repzo_transfer.creator.type == "rep") {
      repzo_rep = await repzo.rep.get(repzo_transfer?.creator?._id);
      if (!repzo_rep)
        throw `Rep with _id: ${repzo_transfer.creator._id} not found in Repzo`;
    }

    // Get Repzo Products with its own Populated MeasureUnit

    const repzo_product_ids: { [id: string]: true } = {};
    repzo_transfer.variants?.forEach(
      (item: Service.Transfer.VariantTransfer) => {
        if (item?.product_id) {
          repzo_product_ids[item.product_id.toString()] = true;
        }
      }
    );
    const repzo_products = await get_data(
      repzo.product,
      "_id",
      Object.keys(repzo_product_ids),
      { populatedKeys: ["measureunit"] }
    );

    // Prepare Transfer Items
    const variants: SAPTransferItem[] = [];

    for (let i = 0; i < repzo_transfer.variants?.length; i++) {
      const repzo_transfer_item = repzo_transfer.variants[i];

      const repzo_product = repzo_products.find(
        //@ts-ignore
        (p) => p._id.toString() == repzo_transfer_item.product_id?.toString()
      );
      if (!repzo_product) {
        console.log(
          `Product with _id: ${repzo_transfer_item.product_id} was not found In Repzo`
        );
        throw new Error(
          `Product with _id: ${repzo_transfer_item.product_id} was not found in Repzo`
        );
      }

      const repzo_measure_unit = repzo_product.sv_measureUnit;

      if (!repzo_measure_unit?._id) {
        console.log(
          `Measureunit with _id: ${repzo_product.sv_measureUnit?.toString()} was not found`
        );
        throw new Error(
          `Measureunit with _id: ${repzo_product.sv_measureUnit?.toString()} was not found`
        );
      }

      variants.push({
        //@ts-ignore
        ItemCode: repzo_transfer_item.variant_name,
        Quantity: repzo_transfer_item.qty / Number(repzo_measure_unit.factor),
        //@ts-ignore
        FromWarehouse: (
          repzo_transfer.from as Service.Warehouse.WarehouseSchema
        )?.code,
        //@ts-ignore
        ToWarehouse: (repzo_transfer.to as Service.Warehouse.WarehouseSchema)
          ?.code,
      });
    }

    const sap_transfer: SAPTransfer = {
      StockTransferID: body.serial_number.formatted,
      SalesPersonCode: repzo_rep
        ? repzo_rep.integration_id
        : options.data?.SalesPersonCode, // "111"
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

    await actionLog
      .addDetail(`SAP Responded with `, result)
      .addDetail(`Repzo => SAP: Transfer - ${repzo_serial_number}`)
      .setStatus("success")
      .setBody(body)
      .commit();
    return result;
  } catch (e: any) {
    //@ts-ignore
    console.error(e?.response || e);
    await actionLog.setStatus("fail", e).setBody(body).commit();
    throw e;
  }
};
