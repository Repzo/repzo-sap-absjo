import axios from "axios";
import Repzo from "repzo";
import moment from "moment-timezone";
import { CommandType } from "./types";
import { Service } from "repzo/src/types";
interface Params {
  [key: string]: any;
}
interface Data {
  [key: string]: any;
}

interface Headers {
  "API-KEY": string;
  [key: string]: string;
}

export const _fetch = async (
  baseUrl: string,
  path: string,
  headers?: Headers,
  params?: Params
) => {
  try {
    const res = await axios.get(baseUrl + path, { params, headers });
    return res.data;
  } catch (e) {
    throw e;
  }
};

export const _create = async (
  baseUrl: string,
  path: string,
  body: Data,
  headers?: Headers,
  params?: Params
) => {
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

export const _update = async (
  baseUrl: string,
  path: string,
  body: Data,
  headers?: Headers,
  params?: Params
) => {
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

export const _delete = async (
  baseUrl: string,
  path: string,
  headers?: Headers,
  params?: Params
) => {
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

export const update_bench_time = async (
  repzo: Repzo,
  app_id: string,
  key: string,
  value: string,
  format?: string
): Promise<void> => {
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

export const updateAt_query = (
  QUERY: string,
  options_formData: any,
  bench_time_key: string
): string => {
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
  _path: string,
  default_res: any, // if no data was found
  serviceEndPoint: string,
  serviceApiKey: string,
  query?: string
): Promise<any> => {
  try {
    const result: any = await _fetch(
      serviceEndPoint,
      `/${_path}${query ? query : ""}`,
      { "API-KEY": serviceApiKey }
    );
    return result;
  } catch (e: any) {
    if (e.response.status == 404) return default_res;
    throw e;
  }
};

export const set_error = (error_res: any): any => {
  try {
    if (error_res) {
      if (typeof error_res == "string") {
        return { message: error_res };
      } else if (error_res.message || error_res.response?.data) {
        return {
          code: error_res.response?.data?.code,
          message: error_res.response?.data.message || error_res.message,
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

export const date_formatting = (
  date: string | number | undefined,
  format: string
) => {
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

export const get_data = async (
  service: any,
  key: string,
  query_array: any[],
  extra_query: { [key: string]: any } = {}
) => {
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
      if (repzo_data?.data?.length) all_data.push(...repzo_data.data);
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
}: {
  command: CommandType;
  app_id: string;
  env: "production" | "staging" | "local";
  repzoApiKey: string;
}) => {
  try {
    const marketplace_url: string =
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

export const getUniqueConcatenatedValues = function (
  item: Service.Item.Schema,
  key: "name" | "ref" | "_id",
  delimiter: string,
  all_promos: {
    [promo_id: string]: { _id: string; name: string; ref?: string };
  }
): string {
  item.general_promotions = item.general_promotions || [];
  item.used_promotions = item.used_promotions || [];
  const allPromotions: { name: string; ref?: string; [key: string]: any }[] = [
    ...item.general_promotions,
    ...item.used_promotions,
  ];
  allPromotions.forEach((promo) => {
    promo._id = promo._id || promo.id;
  });
  if (item.promotions?.isGet) {
    const promo_id = item.promotions.bookings?.[0]?.promotion;
    if (promo_id && all_promos[promo_id])
      allPromotions.push(all_promos[promo_id]);
  } else if (item.promotions?.bookings?.length) {
    const promos: { [promo_id: string]: string } = {};
    item.promotions?.bookings?.forEach((booking) => {
      if (booking?.promotion) {
        promos[booking?.promotion] = booking?.promotion;
      }
    });
    for (let promo_id in promos) {
      if (promo_id && all_promos[promo_id])
        allPromotions.push(all_promos[promo_id]);
    }
  }
  const uniqueValues = new Set(
    allPromotions.map((promotion) => promotion[key]).filter((value) => value)
  );
  return [...uniqueValues].join(delimiter);
};
