import Repzo from "repzo";
import { Service } from "repzo/src/types";
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

export interface SAPUoM {
  ITEMCODE: string; // "010-BIC-RA0001",
  UOMGROUPENTRY: number; // 133;
  UOMGROUPCODE: string; // "BOXn",
  UOMGROUPNAME: string; // "BOXn",
  BASEUOMID: number; // 67;
  BASEUOMCODE: string; // "BOX",
  BASEQTY: number; // 1.0;
  ALTUOMID: number; // 67;
  ALTUOMCODE: string; // "BOX",
  ALTQTY: number; // 1.0;
  repzo_factor?: number;
}

interface SAPUoMs {
  result: "Success";
  UoM: SAPUoM[];
}

export const sync_measureunit = async (commandEvent: CommandEvent) => {
  const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
    env: commandEvent.env,
  });

  const commandLog = new Repzo.CommandLog(
    repzo,
    commandEvent.app,
    commandEvent.command
  );
  try {
    // console.log("sync_measureunit");

    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_measureunit";

    await commandLog.load(commandEvent.sync_id);
    await commandLog
      .addDetail("Repzo SAP: Started Syncing Measure units")
      .commit();

    const nameSpace: string = commandEvent.nameSpace.join("_");
    const result: Result = {
      sap_total: 0,
      repzo_total: 0,
      created: 0,
      updated: 0,
      failed: 0,
    };
    const failed_docs_report: FailedDocsReport = [];

    const sap_UoMs: SAPUoM[] = await get_sap_UoMs(
      commandEvent.app.formData.sapHostUrl,
      {}
    );
    result.sap_total = sap_UoMs?.length;

    await commandLog
      .addDetail(`${result.sap_total} Unit of Measures in SAP`)
      .commit();

    // Get Repzo default measureunit
    const repzo_UoM_parent = await repzo.measureunit.find({
      parent: "nil",
      disabled: false,
    });

    if (!repzo_UoM_parent?.data || repzo_UoM_parent?.data?.length != 1)
      throw "the parent of measure unit is not found or the nameSpace has more than one";
    const repzo_parent_id = repzo_UoM_parent.data[0]._id;

    const repzo_UoMs = await repzo.measureunit.find({ per_page: 50000 });
    result.repzo_total = repzo_UoMs?.data?.length;
    await commandLog
      .addDetail(`${repzo_UoMs?.data?.length} Measure Units in Repzo`)
      .commit();

    const byProduct: { [ket: string]: SAPUoM[] } = {};
    sap_UoMs.forEach((unit) => {
      if (!byProduct[unit.ITEMCODE]) byProduct[unit.ITEMCODE] = [];
      byProduct[unit.ITEMCODE].push(unit);
    });

    Object.values(byProduct).forEach((units: SAPUoM[]) => {
      const max_unit: {
        value: number | null;
        sap_product_UoMs: SAPUoM[];
        default_unit?: SAPUoM | null;
      } = {
        sap_product_UoMs: [],
        value: null,
        default_unit: null,
      };
      units.forEach((unit) => {
        if (max_unit.value == null || unit.BASEQTY < max_unit.value) {
          max_unit.value = unit.BASEQTY;
          max_unit.sap_product_UoMs.push(unit);
        } else if (unit.BASEQTY == max_unit.value) {
          max_unit.sap_product_UoMs.push(unit);
        }
      });

      if (max_unit.sap_product_UoMs.length > 1) {
        const PC = max_unit.sap_product_UoMs.find((u) => u.ALTUOMCODE == "PC");
        const POUCH = max_unit.sap_product_UoMs.find(
          (u) => u.ALTUOMCODE == "POUCH"
        );
        const CARD = max_unit.sap_product_UoMs.find(
          (u) => u.ALTUOMCODE == "CARD"
        );
        const KG = max_unit.sap_product_UoMs.find((u) => u.ALTUOMCODE == "Kg");
        const BAG = max_unit.sap_product_UoMs.find(
          (u) => u.ALTUOMCODE == "Bag"
        );
        max_unit.default_unit = PC || POUCH || CARD || KG || BAG;

        if (!max_unit.default_unit) {
          // console.log(
          //   "Create/Update Measure Unit Failed >> ",
          //   `${max_unit?.sap_product_UoMs[0]?.ITEMCODE} Could not found the base_unit`,
          //   units
          // );
          failed_docs_report.push({
            method: "create",
            doc_id:
              max_unit?.sap_product_UoMs[0]?.ITEMCODE || units[0]?.ITEMCODE,
            doc: units,
            error_message: set_error(
              `Create/Update Measure Unit Failed >> ${max_unit?.sap_product_UoMs[0]?.ITEMCODE} Could not found the base_unit`
            ),
          });
          result.failed++;
          return;
        }
      } else {
        max_unit.default_unit = max_unit.sap_product_UoMs[0];
      }

      units.forEach((unit) => {
        if (max_unit?.default_unit)
          unit.repzo_factor =
            (unit.ALTQTY / unit.BASEQTY) * max_unit?.default_unit?.BASEQTY;
      });
    });

    let unique_UoMs: { [key: string]: SAPUoM } | SAPUoM[] = {};

    for (let i = 0; i < sap_UoMs?.length; i++) {
      const Uom = sap_UoMs[i];
      const key = `${Uom.ITEMCODE}_${Uom.UOMGROUPENTRY}_${Uom.ALTUOMID}`;
      if (!unique_UoMs[key]) unique_UoMs[key] = Uom;
    }

    unique_UoMs = Object.values(unique_UoMs);

    const db = new DataSet([], { autoIndex: false });
    db.createIndex({
      ITEMCODE: true,
      ALTUOMCODE: true,
      repzo_factor: true,
      UOMGROUPENTRY: true,
      ALTUOMID: true,
    });
    db.load(unique_UoMs);

    for (let i = 0; i < unique_UoMs?.length; i++) {
      const sap_UoM: SAPUoM = unique_UoMs[i];
      const repzo_UoM = repzo_UoMs.data.find(
        (r_UoM) =>
          r_UoM.integration_meta?.id ==
          `${nameSpace}_${sap_UoM.ITEMCODE}_${sap_UoM.UOMGROUPENTRY}_${sap_UoM.ALTUOMID}`
      );

      const body:
        | Service.MeasureUnit.Create.Body
        | Service.MeasureUnit.Update.Body = {
        parent: repzo_parent_id,
        name: sap_UoM.ALTUOMCODE,
        factor: sap_UoM.repzo_factor || 0, // ??????
        disabled: false,
        integration_meta: {
          id: `${nameSpace}_${sap_UoM.ITEMCODE}_${sap_UoM.UOMGROUPENTRY}_${sap_UoM.ALTUOMID}`,
          UOMGROUPENTRY: sap_UoM.UOMGROUPENTRY,
          ALTUOMID: sap_UoM.ALTUOMID,
          ITEMCODE: sap_UoM.ITEMCODE,
        },
        company_namespace: [nameSpace],
      };

      if (!repzo_UoM) {
        // Create
        try {
          const created_UoM = await repzo.measureunit.create(
            body as Service.MeasureUnit.Create.Body
          );
          result.created++;
        } catch (e: any) {
          // console.log("Create Measure Unit Failed >> ", e?.response, body);
          failed_docs_report.push({
            method: "create",
            doc: body,
            error_message: set_error(e),
          });
          result.failed++;
        }
      } else {
        const found_identical_docs = db.search({
          ALTUOMCODE: repzo_UoM.name,
          repzo_factor: repzo_UoM.factor,
          ITEMCODE: repzo_UoM.integration_meta?.ITEMCODE,
          UOMGROUPENTRY: repzo_UoM.integration_meta?.UOMGROUPENTRY,
          ALTUOMID: repzo_UoM.integration_meta?.ALTUOMID,
        });
        if (found_identical_docs.length) continue;
        // Update
        try {
          const updated_UoM = await repzo.measureunit.update(
            repzo_UoM._id,
            body as Service.MeasureUnit.Update.Body
          );
          result.updated++;
        } catch (e: any) {
          // console.log(
          //   "Update Measure Unit Failed >> ",
          //   e?.response?.data,
          //   body
          // );
          failed_docs_report.push({
            method: "update",
            doc_id: repzo_UoM?._id,
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
      new_bench_time
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
    throw e;
  }
};

export const get_sap_UoMs = async (
  serviceEndPoint: string,
  query?: { updateAt?: string }
): Promise<SAPUoM[]> => {
  try {
    const sap_UoMs: SAPUoMs = await _create(serviceEndPoint, "/Uom", {
      Inactive: "N",
      Locked: "N",
    });
    return sap_UoMs?.UoM;
  } catch (e: any) {
    throw e;
  }
};
