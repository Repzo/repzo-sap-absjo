import { create_invoice } from "./create_invoice.js";
import { create_return_invoice } from "./create_return_invoice.js";
import { create_proforma } from "./create_proforma.js";
import { create_payment } from "./create_payment.js";
import { create_transfer } from "./create_transfer.js";
export const actions = async (event, options) => {
  var _a, _b;
  switch (
    (_a = event.queryStringParameters) === null || _a === void 0
      ? void 0
      : _a.action
  ) {
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
    default:
      throw `Route: ${
        (_b = event.queryStringParameters) === null || _b === void 0
          ? void 0
          : _b.action
      } not found`;
  }
};
export const actionsList = [];
