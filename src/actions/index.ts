import { Config, Action } from "../types";
import { EVENT } from "../types";

import { create_invoice } from "./create_invoice.js";
import { create_return_invoice } from "./create_return_invoice.js";
import { create_proforma } from "./create_proforma.js";
import { create_payment } from "./create_payment.js";
import { create_transfer } from "./create_transfer.js";
import { create_client } from "./create_client.js";

export const actions = async (event: any, options: Config) => {
  switch (event.queryStringParameters?.action) {
    case "create_invoice":
      return await create_invoice(event, options);
    case "create_return_invoice":
      return await create_return_invoice(event, options);
    case "create_proforma":
      return await create_proforma(event, options);
    case "create_payment":
      return await create_payment(event, options);
    case "create_transfer":
      return await create_transfer(event, options);
    case "create_client":
      return await create_client(event, options);
    default:
      throw `Route: ${event.queryStringParameters?.action} not found`;
  }
};

export const actionsList: Action[] = [];
