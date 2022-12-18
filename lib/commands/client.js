import Repzo from "repzo";
import {
  _create,
  update_bench_time,
  date_formatting,
  set_error,
} from "../util.js";
export const sync_client = async (commandEvent) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _j;
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
    console.log("sync_client");
    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_client";
    await commandLog.load(commandEvent.sync_id);
    await commandLog.addDetail("Repzo SAP: Started Syncing Clients").commit();
    const nameSpace = commandEvent.nameSpace.join("_");
    const result = {
      sap_total: 0,
      repzo_total: 0,
      created: 0,
      updated: 0,
      failed: 0,
    };
    const failed_docs_report = [];
    // Get SAP CLients to be created/updated
    const sap_clients = await get_sap_clients(
      commandEvent.app.formData.sapHostUrl,
      {
        updateAt: commandEvent.app.options_formData[bench_time_key],
        GroupCode: commandEvent.app.formData.GroupCode,
      }
    );
    result.sap_total =
      sap_clients === null || sap_clients === void 0
        ? void 0
        : sap_clients.length;
    await commandLog
      .addDetail(
        `${result.sap_total} Customers in SAP changed since ${
          commandEvent.app.options_formData[bench_time_key] || "ever"
        }`
      )
      .commit();
    // Get SAP CLients to be created/updated
    const sap_all_clients = await get_sap_clients(
      commandEvent.app.formData.sapHostUrl,
      {}
    );
    result.sap_total =
      sap_clients === null || sap_clients === void 0
        ? void 0
        : sap_clients.length;
    // Get Repzo Tags
    const repzo_tags = await repzo.tag.find({
      disabled: true,
      per_page: 50000,
    });
    // Get Repzo Channels
    const repzo_channels = await repzo.channel.find({
      disabled: true,
      per_page: 50000,
    });
    // Get Repzo PaymentTerms
    const repzo_payment_terms = await repzo.paymentTerm.find({
      disabled: false,
      per_page: 50000,
    });
    // Get Repzo PriceLists
    const repzo_price_lists = await repzo.priceList.find({
      disabled: false,
      per_page: 50000,
    });
    // Get Repzo Clients
    const repzo_clients = await repzo.client.find({
      per_page: 50000,
      project: ["_id", "integration_meta"],
    });
    result.repzo_total =
      (_b =
        repzo_clients === null || repzo_clients === void 0
          ? void 0
          : repzo_clients.data) === null || _b === void 0
        ? void 0
        : _b.length;
    await commandLog
      .addDetail(
        `${
          (_c =
            repzo_clients === null || repzo_clients === void 0
              ? void 0
              : repzo_clients.data) === null || _c === void 0
            ? void 0
            : _c.length
        } Clients in Repzo`
      )
      .commit();
    for (
      let i = 0;
      i <
      (sap_clients === null || sap_clients === void 0
        ? void 0
        : sap_clients.length);
      i++
    ) {
      const sap_client = sap_clients[i];
      const repzo_client = repzo_clients.data.find((r_client) => {
        var _a;
        return (
          ((_a = r_client.integration_meta) === null || _a === void 0
            ? void 0
            : _a.id) == `${nameSpace}_${sap_client.CLIENTID}`
        );
      });
      const tag =
        (_d =
          repzo_tags === null || repzo_tags === void 0
            ? void 0
            : repzo_tags.data) === null || _d === void 0
          ? void 0
          : _d.find((tag) => {
              var _a;
              return (
                ((_a = tag.integration_meta) === null || _a === void 0
                  ? void 0
                  : _a.id) == `${nameSpace}_${sap_client.TERRITORYID}`
              );
            });
      const channel =
        (_e =
          repzo_channels === null || repzo_channels === void 0
            ? void 0
            : repzo_channels.data) === null || _e === void 0
          ? void 0
          : _e.find((channel) => {
              var _a;
              return (
                ((_a = channel.integration_meta) === null || _a === void 0
                  ? void 0
                  : _a.id) == `${nameSpace}_${sap_client.CLIENTGROUP}`
              );
            });
      const paymentTerm =
        (_f =
          repzo_payment_terms === null || repzo_payment_terms === void 0
            ? void 0
            : repzo_payment_terms.data) === null || _f === void 0
          ? void 0
          : _f.find((paymentTerm) => {
              var _a;
              return (
                ((_a = paymentTerm.integration_meta) === null || _a === void 0
                  ? void 0
                  : _a.id) == `${nameSpace}_${sap_client.PAYMENTTERM}`
              );
            });
      const priceList =
        (_g =
          repzo_price_lists === null || repzo_price_lists === void 0
            ? void 0
            : repzo_price_lists.data) === null || _g === void 0
          ? void 0
          : _g.find((pricelist) => {
              var _a;
              return (
                ((_a = pricelist.integration_meta) === null || _a === void 0
                  ? void 0
                  : _a.id) == `${nameSpace}_${sap_client.CLIENTPRICELISTID}`
              );
            });
      let parent;
      if (sap_client.PARENTCODE) {
        parent = sap_all_clients.find(
          (c) => c.CLIENTID == sap_client.PARENTCODE
        );
      }
      const credit_limit = parent
        ? parent.CLIENTCREDITLIMIT
        : sap_client.CLIENTCREDITLIMIT;
      const client_credit_consumed = parent
        ? parent.CLIENTCREDITCONSUMED
        : sap_client.CLIENTCREDITCONSUMED;
      const body = {
        integration_meta: {
          id: `${nameSpace}_${sap_client.CLIENTID}`,
          PAYMENTTERM: sap_client.PAYMENTTERM,
          CLIENTCREDITCONSUMED: parent
            ? parent.CLIENTCREDITCONSUMED
            : sap_client.CLIENTCREDITCONSUMED,
          CLIENTMAXCHEQUEVALUE: parent
            ? parent.CLIENTMAXCHEQUEVALUE
            : sap_client.CLIENTMAXCHEQUEVALUE,
          CLIENTCREDITLIMIT: parent
            ? parent.CLIENTCREDITLIMIT
            : sap_client.CLIENTCREDITLIMIT,
          CLIENTPRICELISTID: sap_client.CLIENTPRICELISTID,
        },
        client_code: sap_client.CLIENTID,
        name: sap_client.CLIENTDESC,
        local_name: sap_client.CLIENTDESCF ? sap_client.CLIENTDESCF : undefined,
        city: sap_client.CLIENTCITY,
        state: sap_client.CLIENTCOUNTY,
        country: sap_client.CLIENTCOUNTRY,
        contact_name: sap_client.CLIENTCONTACTPERSON,
        phone: sap_client.CLIENTPHONE1,
        cell_phone: sap_client.CLIENTPHONE2,
        comment: sap_client.CLIENTNOTE,
        formatted_address: sap_client.CLIENTADDRESSID,
        tags: tag ? [tag._id] : [],
        credit_limit:
          sap_client.CLIENTGROUP == "Cash Van"
            ? 1000000000
            : credit_limit && Math.round(credit_limit * 1000),
        financials: {
          credit_limit:
            sap_client.CLIENTGROUP == "Cash Van"
              ? 1000000000
              : credit_limit && Math.round(credit_limit * 1000),
        },
        channel: channel ? channel._id : undefined,
        paymentTerm: paymentTerm ? paymentTerm._id : undefined,
        sv_priceList: priceList ? priceList._id : undefined,
        disabled: sap_client.ACTIVE == "Y" ? false : true,
        payment_type: sap_client.CLIENTGROUP == "Cash Van" ? "cash" : "credit",
        integrated_client_balance:
          client_credit_consumed && Math.round(client_credit_consumed * 1000),
      };
      if (!repzo_client) {
        // Create
        try {
          const created_client = await repzo.client.create(body);
          result.created++;
        } catch (e) {
          console.log(
            "Create Client Failed >> ",
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
        const repzo_original_doc = await repzo.client.get(repzo_client._id);
        // console.log("match", is_matched(body, repzo_original_doc));
        if (is_matched(body, repzo_original_doc)) {
          continue;
        }
        // Update
        try {
          const updated_client = await repzo.client.update(
            repzo_client._id,
            body
          );
          result.updated++;
        } catch (e) {
          console.log(
            "Update Client Failed >> ",
            (_h = e === null || e === void 0 ? void 0 : e.response) === null ||
              _h === void 0
              ? void 0
              : _h.data,
            body
          );
          failed_docs_report.push({
            method: "update",
            doc_id:
              repzo_client === null || repzo_client === void 0
                ? void 0
                : repzo_client._id,
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
  } catch (e) {
    //@ts-ignore
    console.error(
      ((_j = e === null || e === void 0 ? void 0 : e.response) === null ||
      _j === void 0
        ? void 0
        : _j.data) || e
    );
    await commandLog.setStatus("fail", e).commit();
    throw e;
  }
};
const get_sap_clients = async (serviceEndPoint, query) => {
  try {
    const sap_clients = await _create(serviceEndPoint, "/Customers", {
      Active: "Y",
      Frozen: "N",
      UpdateAt: date_formatting(
        query === null || query === void 0 ? void 0 : query.updateAt,
        "YYYYMMDD:HHmmss"
      ),
      GroupCode:
        (query === null || query === void 0 ? void 0 : query.GroupCode) || "",
    });
    return sap_clients.Customers;
  } catch (e) {
    throw e;
  }
};
const is_matched = (body_1, body_2) => {
  var _a, _b, _c, _d, _e, _f;
  try {
    const keys = [
      "client_code",
      "name",
      "local_name",
      "city",
      "state",
      "country",
      "contact_name",
      "phone",
      "cell_phone",
      "comment",
      "formatted_address",
      "tags",
      "credit_limit",
      "financials",
      "channel",
      "paymentTerm",
      "sv_priceList",
      "disabled",
      "payment_type",
      "integrated_client_balance",
    ];
    const integration_meta_keys = [
      "id",
      "PAYMENTTERM",
      "CLIENTCREDITCONSUMED",
      "CLIENTMAXCHEQUEVALUE",
      "CLIENTCREDITLIMIT",
      "CLIENTPRICELISTID",
    ];
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (
        ((_a = body_1[key]) === null || _a === void 0
          ? void 0
          : _a.toString()) !==
        ((_b = body_2[key]) === null || _b === void 0 ? void 0 : _b.toString())
      ) {
        return false;
      }
    }
    for (let i = 0; i < integration_meta_keys.length; i++) {
      const key = keys[i];
      if (
        ((_d =
          (_c =
            body_1 === null || body_1 === void 0
              ? void 0
              : body_1.integration_meta) === null || _c === void 0
            ? void 0
            : _c[key]) === null || _d === void 0
          ? void 0
          : _d.toString()) !==
        ((_f =
          (_e =
            body_2 === null || body_2 === void 0
              ? void 0
              : body_2.integration_meta) === null || _e === void 0
            ? void 0
            : _e[key]) === null || _f === void 0
          ? void 0
          : _f.toString())
      ) {
        return false;
      }
    }
    return true;
  } catch (e) {
    throw e;
  }
};
