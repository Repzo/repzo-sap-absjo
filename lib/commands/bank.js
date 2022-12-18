import Repzo from "repzo";
import DataSet from "data-set-query";
import { _create, update_bench_time, set_error } from "../util.js";
export const sync_bank = async (commandEvent) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
  const repzo = new Repzo(
    (_a = commandEvent.app.formData) === null || _a === void 0
      ? void 0
      : _a.repzoApiKey,
    {
      env: commandEvent.env,
    }
  );
  const commandLog = new Repzo.CommandLog(
    repzo,
    commandEvent.app,
    commandEvent.command
  );
  try {
    console.log("sync_bank");
    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_bank";
    await commandLog.load(commandEvent.sync_id);
    await commandLog.addDetail("Repzo SAP: Started Syncing Banks").commit();
    const nameSpace = commandEvent.nameSpace.join("_");
    const result = {
      sap_total: 0,
      repzo_total: 0,
      created: 0,
      updated: 0,
      failed: 0,
      repzo_bank_list_total: 0,
      repzo_bank_list_updated: false,
    };
    const failed_docs_report = [];
    const country_translator = {
      JO: "Jordan",
    };
    // Bank **************************************************
    const sap_banks = await get_sap_banks(
      commandEvent.app.formData.sapHostUrl,
      {}
    );
    result.sap_total =
      sap_banks === null || sap_banks === void 0 ? void 0 : sap_banks.length;
    await commandLog.addDetail(`${result.sap_total} Banks in SAP`).commit();
    const db = new DataSet([], { autoIndex: false });
    db.createIndex({
      BANKNAME: true,
      BANKCODE: true,
      COUNTRY: true,
    });
    db.load(sap_banks);
    const sap_bank_query =
      sap_banks === null || sap_banks === void 0
        ? void 0
        : sap_banks.map((bank) => `${nameSpace}_${bank.BANKCODE}`);
    const repzo_banks = await repzo.bank.find({
      "integration_meta.company_namespace": nameSpace,
      per_page: 50000,
    });
    result.repzo_total =
      (_b =
        repzo_banks === null || repzo_banks === void 0
          ? void 0
          : repzo_banks.data) === null || _b === void 0
        ? void 0
        : _b.length;
    await commandLog
      .addDetail(
        `${
          (_c =
            repzo_banks === null || repzo_banks === void 0
              ? void 0
              : repzo_banks.data) === null || _c === void 0
            ? void 0
            : _c.length
        } Banks in Repzo`
      )
      .commit();
    for (
      let i = 0;
      i <
      (sap_banks === null || sap_banks === void 0 ? void 0 : sap_banks.length);
      i++
    ) {
      const sap_bank = sap_banks[i];
      const repzo_bank = repzo_banks.data.find((r_bank) => {
        var _a;
        return (
          ((_a = r_bank.integration_meta) === null || _a === void 0
            ? void 0
            : _a.id) == `${nameSpace}_${sap_bank.BANKCODE}`
        );
      });
      const country = country_translator[sap_bank.COUNTRY];
      if (!country && sap_bank.COUNTRY) {
        throw `COUNTRY of COUNTRY Code: ${sap_bank.COUNTRY} was not found on the translator`;
      }
      const body = {
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
          const created_bank = await repzo.bank.create(body);
          result.created++;
        } catch (e) {
          console.log(
            "Create Bank Failed >> ",
            e === null || e === void 0 ? void 0 : e.response,
            body
          );
          failed_docs_report.push({
            method: "create",
            doc: body,
            error_message: set_error(e),
          });
          result.failed++;
        }
      } else {
        if (
          (repzo_bank === null || repzo_bank === void 0
            ? void 0
            : repzo_bank.name) ==
            (body === null || body === void 0 ? void 0 : body.name) &&
          ((_d =
            repzo_bank === null || repzo_bank === void 0
              ? void 0
              : repzo_bank.integration_meta) === null || _d === void 0
            ? void 0
            : _d.COUNTRY) ==
            ((_e =
              body === null || body === void 0
                ? void 0
                : body.integration_meta) === null || _e === void 0
              ? void 0
              : _e.COUNTRY) &&
          ((_f =
            repzo_bank === null || repzo_bank === void 0
              ? void 0
              : repzo_bank.integration_meta) === null || _f === void 0
            ? void 0
            : _f.BANKCODE) ==
            ((_g =
              body === null || body === void 0
                ? void 0
                : body.integration_meta) === null || _g === void 0
              ? void 0
              : _g.BANKCODE)
        )
          continue;
        // Update
        try {
          const updated_bank = await repzo.bank.update(repzo_bank._id, body);
          result.updated++;
        } catch (e) {
          console.log(
            "Update Bank Failed >> ",
            (_h = e === null || e === void 0 ? void 0 : e.response) === null ||
              _h === void 0
              ? void 0
              : _h.data,
            body
          );
          failed_docs_report.push({
            method: "update",
            doc_id:
              repzo_bank === null || repzo_bank === void 0
                ? void 0
                : repzo_bank._id,
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
    result.repzo_bank_list_total =
      (_j =
        repzo_banks === null || repzo_banks === void 0
          ? void 0
          : repzo_banks.data) === null || _j === void 0
        ? void 0
        : _j.length;
    if (
      ((_k = repzo_bankLists.data) === null || _k === void 0
        ? void 0
        : _k.length) > 1
    ) {
      throw `Each nameSpace should have One Bank List but nameSpace: ${nameSpace} more than one Bank List`;
    }
    const repzo_bank_list =
      (_l =
        repzo_bankLists === null || repzo_bankLists === void 0
          ? void 0
          : repzo_bankLists.data) === null || _l === void 0
        ? void 0
        : _l[0];
    if (repzo_bank_list) {
      const ids = {};
      (_m =
        repzo_bank_list === null || repzo_bank_list === void 0
          ? void 0
          : repzo_bank_list.banks) === null || _m === void 0
        ? void 0
        : _m.forEach((bank) => {
            var _a;
            ids[
              (_a = bank === null || bank === void 0 ? void 0 : bank.bank) ===
                null || _a === void 0
                ? void 0
                : _a.toString()
            ] = true;
          });
      (_o =
        all_nameSpace_banks === null || all_nameSpace_banks === void 0
          ? void 0
          : all_nameSpace_banks.data) === null || _o === void 0
        ? void 0
        : _o.forEach((bank) => {
            var _a;
            ids[
              (_a = bank === null || bank === void 0 ? void 0 : bank._id) ===
                null || _a === void 0
                ? void 0
                : _a.toString()
            ] = true;
          });
      const new_banks = Object.keys(ids).map((bank_id) => {
        return { bank: bank_id };
      });
      const repzo_bankList_updated = await repzo.bank_list.update(
        (_p =
          repzo_bank_list === null || repzo_bank_list === void 0
            ? void 0
            : repzo_bank_list._id) === null || _p === void 0
          ? void 0
          : _p.toString(),
        {
          ...repzo_bank_list,
          banks: new_banks,
        }
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
  } catch (e) {
    //@ts-ignore
    console.error(
      ((_q = e === null || e === void 0 ? void 0 : e.response) === null ||
      _q === void 0
        ? void 0
        : _q.data) || e
    );
    await commandLog.setStatus("fail", e).commit();
    throw e;
  }
};
const get_sap_banks = async (serviceEndPoint, query) => {
  try {
    const sap_banks = await _create(serviceEndPoint, "/Banks", {});
    return sap_banks.Banks;
  } catch (e) {
    throw e;
  }
};
