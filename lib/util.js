import axios from "axios";
import moment from "moment-timezone";
export const _fetch = async (baseUrl, path, headers, params) => {
  try {
    const res = await axios.get(baseUrl + path, { params, headers });
    return res.data;
  } catch (e) {
    throw e;
  }
};
export const _create = async (baseUrl, path, body, headers, params) => {
  try {
    const res = await axios.post(baseUrl + path, body, {
      params,
      headers: {
        ...(headers ? headers : {}),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    return res.data;
  } catch (e) {
    throw e;
  }
};
export const _update = async (baseUrl, path, body, headers, params) => {
  try {
    const res = await axios.put(baseUrl + path, body, {
      params,
      headers,
    });
    return res.data;
  } catch (e) {
    throw e;
  }
};
export const _delete = async (baseUrl, path, headers, params) => {
  try {
    const res = await axios.delete(baseUrl + path, {
      params,
      headers,
    });
    return res.data;
  } catch (e) {
    throw e;
  }
};
export const update_bench_time = async (repzo, app_id, key, value, format) => {
  try {
    if (format) {
      value = moment(value).format(format);
    }
    const res = await repzo.integrationApp.update(app_id, {
      // options_formData: { [key]: value },
      [`options_formData.${key}`]: value,
    });
  } catch (e) {
    throw e;
  }
};
export const updateAt_query = (QUERY, options_formData, bench_time_key) => {
  try {
    QUERY = QUERY || "";
    if (options_formData && options_formData[bench_time_key]) {
      QUERY += `${QUERY ? "&" : "?"}q[updated_at_gteq]=${
        options_formData[bench_time_key]
      }`;
    }
    return QUERY;
  } catch (e) {
    throw e;
  }
};
export const get_data_from_sap = async (
  _path,
  default_res, // if no data was found
  serviceEndPoint,
  serviceApiKey,
  query
) => {
  try {
    const result = await _fetch(
      serviceEndPoint,
      `/${_path}${query ? query : ""}`,
      { "API-KEY": serviceApiKey }
    );
    return result;
  } catch (e) {
    if (e.response.status == 404) return default_res;
    throw e;
  }
};
export const set_error = (error_res) => {
  var _a, _b, _c, _d;
  try {
    if (error_res) {
      if (typeof error_res == "string") {
        return { message: error_res };
      } else if (
        error_res.message ||
        ((_a = error_res.response) === null || _a === void 0 ? void 0 : _a.data)
      ) {
        return {
          code:
            (_c =
              (_b = error_res.response) === null || _b === void 0
                ? void 0
                : _b.data) === null || _c === void 0
              ? void 0
              : _c.code,
          message:
            ((_d = error_res.response) === null || _d === void 0
              ? void 0
              : _d.data.message) || error_res.message,
          // responseData: error_res.response?.data,
        };
      } else {
        return error_res;
      }
    }
    return error_res;
  } catch (e) {
    throw e;
  }
};
export const date_formatting = (date, format) => {
  try {
    if (!date && date !== 0) return date;
    const result = moment(date).format(format);
    if (result == "Invalid date") return date;
    return result;
  } catch (e) {
    console.error(e);
    return date;
    throw e;
  }
};
export const get_data = async (service, key, query_array, extra_query = {}) => {
  var _a;
  try {
    const all_data = [];
    const per_page = 200;
    const pages = Math.ceil(query_array.length / per_page);
    for (let i = 0; i < pages; i += per_page) {
      const repzo_data = await service.find({
        per_page: 50000,
        [key]: query_array.slice(i, i + per_page),
        ...extra_query,
      });
      if (
        (_a =
          repzo_data === null || repzo_data === void 0
            ? void 0
            : repzo_data.data) === null || _a === void 0
          ? void 0
          : _a.length
      )
        all_data.push(...repzo_data.data);
    }
    return all_data;
  } catch (e) {
    throw e;
  }
};
export const send_command_to_marketplace = async ({
  command,
  app_id,
  env,
  repzoApiKey,
}) => {
  try {
    const marketplace_url =
      env === "production"
        ? "https://marketplace.api.repzo.me"
        : env === "staging"
        ? "https://staging.marketplace.api.repzo.me"
        : env === "local"
        ? "https://staging.marketplace.api.repzo.me"
        : "";
    await _create(
      marketplace_url,
      "/commands",
      {},
      { "API-KEY": repzoApiKey },
      {
        app: "repzo-sap-absjo",
        command: command,
        app_id: app_id,
      }
    );
  } catch (e) {
    throw e;
  }
};
export const getUniqueConcatenatedValues = function (item, key, delimiter) {
  item.general_promotions = item.general_promotions || [];
  item.used_promotions = item.used_promotions || [];
  const allPromotions = [...item.general_promotions, ...item.used_promotions];
  const uniqueValues = new Set(
    allPromotions.map((promotion) => promotion[key]).filter((value) => value)
  );
  return [...uniqueValues].join(delimiter);
};
