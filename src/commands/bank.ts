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

interface SAPBank {
  BANKNAME: string; // "Jordan Kuwait Bank - DABUK BRANCH";
  BANKCODE: string; // "20590";
  BRANCH?: string; // "";
  COUNTRY: string; // "JO";
}

interface SAPBanks {
  result: "Success";
  Banks: SAPBank[];
}

export const sync_bank = async (commandEvent: CommandEvent) => {
  const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
    env: commandEvent.env,
  });

  const commandLog = new Repzo.CommandLog(
    repzo,
    commandEvent.app,
    commandEvent.command
  );
  try {
    // console.log("sync_bank");

    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_bank";

    await commandLog.load(commandEvent.sync_id);
    await commandLog.addDetail("Repzo SAP: Started Syncing Banks").commit();

    const nameSpace: string = commandEvent.nameSpace.join("_");
    const result: Result & {
      repzo_bank_list_total: number;
      repzo_bank_list_updated: boolean;
    } = {
      sap_total: 0,
      repzo_total: 0,
      created: 0,
      updated: 0,
      failed: 0,
      repzo_bank_list_total: 0,
      repzo_bank_list_updated: false,
    };
    const failed_docs_report: FailedDocsReport = [];

    const country_translator: { [key: string]: string } = {
      JO: "Jordan",
    };

    // Bank **************************************************

    const sap_banks: SAPBank[] = await get_sap_banks(
      commandEvent.app.formData.sapHostUrl,
      {}
    );
    result.sap_total = sap_banks?.length;

    await commandLog.addDetail(`${result.sap_total} Banks in SAP`).commit();

    const db = new DataSet([], { autoIndex: false });
    db.createIndex({
      BANKNAME: true,
      BANKCODE: true,
      COUNTRY: true,
    });
    db.load(sap_banks);

    const sap_bank_query = sap_banks?.map(
      (bank: SAPBank) => `${nameSpace}_${bank.BANKCODE}`
    );

    const repzo_banks = await repzo.bank.find({
      "integration_meta.company_namespace": nameSpace,
      per_page: 50000,
    });
    result.repzo_total = repzo_banks?.data?.length;
    await commandLog
      .addDetail(`${repzo_banks?.data?.length} Banks in Repzo`)
      .commit();

    for (let i = 0; i < sap_banks?.length; i++) {
      const sap_bank: SAPBank = sap_banks[i];
      const repzo_bank = repzo_banks.data.find(
        (r_bank) =>
          r_bank.integration_meta?.id == `${nameSpace}_${sap_bank.BANKCODE}`
      );

      const country = country_translator[sap_bank.COUNTRY];
      if (!country && sap_bank.COUNTRY) {
        throw `COUNTRY of COUNTRY Code: ${sap_bank.COUNTRY} was not found on the translator`;
      }

      const body: Service.Bank.Create.Body | Service.Bank.Update.Body = {
        name: sap_bank.BANKNAME,
        country: [country],
        integration_meta: {
          id: `${nameSpace}_${sap_bank.BANKCODE}`,
          BANKCODE: sap_bank.BANKCODE,
          COUNTRY: sap_bank.COUNTRY,
          company_namespace: nameSpace,
        },
      };

      if (!repzo_bank) {
        // Create
        try {
          const created_bank = await repzo.bank.create(
            body as Service.Bank.Create.Body
          );
          result.created++;
        } catch (e: any) {
          // console.log("Create Bank Failed >> ", e?.response, body);
          failed_docs_report.push({
            method: "create",
            doc: body,
            error_message: set_error(e),
          });
          result.failed++;
        }
      } else {
        if (
          repzo_bank?.name == body?.name &&
          repzo_bank?.integration_meta?.COUNTRY ==
            body?.integration_meta?.COUNTRY &&
          repzo_bank?.integration_meta?.BANKCODE ==
            body?.integration_meta?.BANKCODE
        )
          continue;
        // Update
        try {
          const updated_bank = await repzo.bank.update(
            repzo_bank._id,
            body as Service.Bank.Update.Body
          );
          result.updated++;
        } catch (e: any) {
          // console.log("Update Bank Failed >> ", e?.response?.data, body);
          failed_docs_report.push({
            method: "update",
            doc_id: repzo_bank?._id,
            doc: body,
            error_message: set_error(e),
          });
          result.failed++;
        }
      }
    }

    // console.log(result);
    // *******************************************************

    // Bank List *********************************************

    const all_nameSpace_banks = await repzo.bank.find({
      "integration_meta.company_namespace": nameSpace,
      per_page: 50000,
    });
    const repzo_bankLists = await repzo.bank_list.find({
      "integration_meta.id": nameSpace,
      per_page: 50000,
    });
    result.repzo_bank_list_total = repzo_banks?.data?.length;

    if (repzo_bankLists.data?.length > 1) {
      throw `Each nameSpace should have One Bank List but nameSpace: ${nameSpace} more than one Bank List`;
    }

    const repzo_bank_list = repzo_bankLists?.data?.[0];
    if (repzo_bank_list) {
      const ids: { [key: string]: true } = {};
      repzo_bank_list?.banks?.forEach((bank) => {
        ids[bank?.bank?.toString()] = true;
      });

      all_nameSpace_banks?.data?.forEach((bank) => {
        ids[bank?._id?.toString()] = true;
      });

      const new_banks = Object.keys(ids).map((bank_id) => {
        return { bank: bank_id };
      });

      const repzo_bankList_updated = await repzo.bank_list.update(
        repzo_bank_list?._id?.toString(),
        {
          ...repzo_bank_list,
          banks: new_banks,
        } as Service.BankList.Update.Body
      );
      result.repzo_bank_list_updated = true;
    } else {
      throw `Please Check with IT teams to create BankList for Your nameSpace`;
    }
    // *******************************************************

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

const get_sap_banks = async (
  serviceEndPoint: string,
  query?: { updateAt?: string }
): Promise<SAPBank[]> => {
  try {
    const sap_banks: SAPBanks = await _create(serviceEndPoint, "/Banks", {});
    return sap_banks.Banks;
  } catch (e: any) {
    throw e;
  }
};
