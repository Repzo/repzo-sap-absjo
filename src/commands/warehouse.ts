import Repzo from "repzo";
import DataSet from "data-set-query";
import { CommandEvent, Result, FailedDocsReport } from "../types";
import {
  _fetch,
  _create,
  _update,
  _delete,
  update_bench_time,
  date_formatting,
  set_error,
} from "../util.js";

interface WarehouseBody {
  _id?: string;
  name: string;
  type: "van" | "main";
  disabled?: boolean;
  code?: string;
  integration_meta?: { id: string };
}

interface SAPWarehouse {
  WAREHOUSECODE: string;
  WAREHOUSENAME: string;
  LOCKED: string; // "N";
  INACTIVE: string; // "N";
  CREATEDATE: string; // "2021-12-20T21:00:00Z";
  UPDATEDATE: string; // "2021-12-29T21:00:00Z";
}

interface SAPWarehouses {
  result: "Success";
  Warehouses: SAPWarehouse[];
}

export const sync_warehouse = async (commandEvent: CommandEvent) => {
  const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
    env: commandEvent.env,
  });
  const commandLog = new Repzo.CommandLog(
    repzo,
    commandEvent.app,
    commandEvent.command
  );
  try {
    // console.log("sync_warehouse");
    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_warehouse";

    await commandLog.load(commandEvent.sync_id);
    await commandLog
      .addDetail("Repzo SAP: Started Syncing Warehouses")
      .commit();

    const nameSpace = commandEvent.nameSpace.join("_");
    const result: Result = {
      sap_total: 0,
      repzo_total: 0,
      created: 0,
      updated: 0,
      failed: 0,
    };
    const failed_docs_report: FailedDocsReport = [];

    const sap_warehouses: SAPWarehouses = await get_sap_warehouses(
      commandEvent.app.formData.sapHostUrl,
      {
        updateAt:
          commandEvent.app.formData.warehouseDefaultUpdateDate ||
          commandEvent.app.options_formData?.[bench_time_key],
      }
    );
    result.sap_total = sap_warehouses?.Warehouses?.length;

    await commandLog
      .addDetail(
        `${sap_warehouses?.Warehouses?.length} warehouses changed since ${
          commandEvent.app.formData.warehouseDefaultUpdateDate ||
          commandEvent.app.options_formData?.[bench_time_key] ||
          "ever"
        }`
      )
      .commit();

    const db = new DataSet([], { autoIndex: false });
    db.createIndex({
      WAREHOUSECODE: true,
      WAREHOUSENAME: true,
    });
    db.load(sap_warehouses?.Warehouses);

    const repzo_warehouses = await repzo.warehouse.find({ per_page: 50000 });
    result.repzo_total = repzo_warehouses?.data?.length;
    await commandLog
      .addDetail(`${repzo_warehouses?.data?.length} warehouses in Repzo`)
      .commit();

    for (let i = 0; i < sap_warehouses?.Warehouses?.length; i++) {
      const sap_warehouse: SAPWarehouse = sap_warehouses.Warehouses[i];
      const repzo_warehouse = repzo_warehouses.data.find(
        (r_warehouse) =>
          r_warehouse.code == sap_warehouse.WAREHOUSECODE ||
          r_warehouse.name == sap_warehouse.WAREHOUSENAME
      );

      const body: WarehouseBody = {
        _id: repzo_warehouse?._id,
        name: sap_warehouse.WAREHOUSENAME,
        code: sap_warehouse.WAREHOUSECODE,
        type:
          sap_warehouse.WAREHOUSECODE.indexOf("VS") == 0 ||
          sap_warehouse.WAREHOUSECODE.indexOf("COOPS1") == 0
            ? "van"
            : "main",
        disabled: sap_warehouse.INACTIVE == "N" ? false : true,
      };

      if (!repzo_warehouse) {
        // Create
        try {
          const created_warehouse = await repzo.warehouse.create(body);
          result.created++;
        } catch (e: any) {
          // console.log("Create warehouse Failed >> ", e?.response, body);
          failed_docs_report.push({
            method: "create",
            doc: body,
            error_message: set_error(e),
          });
          result.failed++;
        }
      } else {
        const found_identical_docs = db.search({
          WAREHOUSECODE: repzo_warehouse.code,
          WAREHOUSENAME: repzo_warehouse.name,
        });
        if (found_identical_docs.length) continue; // Nothing has changed so no need for updates

        // Update
        try {
          const updated_warehouse = await repzo.warehouse.update(
            repzo_warehouse._id,
            body
          );
          result.updated++;
        } catch (e) {
          // console.log("Update warehouse Failed >> ", e, body);
          failed_docs_report.push({
            method: "update",
            doc_id: repzo_warehouse?._id,
            doc: body,
            error_message: set_error(e),
          });
          result.failed++;
        }
      }
    }

    // console.log(result);

    await update_bench_time(
      repzo,
      commandEvent.app._id,
      bench_time_key,
      new_bench_time,
      "YYYY-MM-DD"
    );
    await commandLog
      .setStatus(
        "success",
        failed_docs_report.length ? failed_docs_report : null
      )
      .setBody(result)
      .commit();

    return result;
  } catch (e: any) {
    //@ts-ignore
    console.error(e?.response?.data || e);
    await commandLog.setStatus("fail", e).commit();
    throw e?.response;
  }
};

const get_sap_warehouses = async (
  serviceEndPoint: string,
  query?: { updateAt?: string }
): Promise<SAPWarehouses> => {
  try {
    const sap_warehouses: SAPWarehouses = (await _create(
      serviceEndPoint,
      "/Warehouses",
      {
        UpdateAt: date_formatting(query?.updateAt, "YYYYMMDD"),
        Inactive: "N",
        Locked: "N",
      }
    )) as SAPWarehouses;
    return sap_warehouses;
  } catch (e: any) {
    throw e;
  }
};
