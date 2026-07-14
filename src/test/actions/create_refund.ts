import { Actions } from "../../index.js";

const cash_refund = {
  _id: "6690a8a8298f9ea4d6d54301",
  status: "unconsumed",
  remainder: 150500,
  amount: 150500, // milli-units => 150.500
  client_id: "639adef7b4dc172fc503645e",
  client_name: "ماي ماركت _ مسكه لتجارة المواد الغذائية",
  creator: {
    _id: "6395af44a7fbbe901db1c2aa",
    type: "rep",
    name: "RET MUSTAFA MOHAMMAD RASHEED ABDALLAH",
  },
  implemented_by: {
    _id: "6395af44a7fbbe901db1c2aa",
    type: "rep",
    name: "RET MUSTAFA MOHAMMAD RASHEED ABDALLAH",
  },
  time: 1752364800000,
  serial_number: {
    identifier: "1006",
    formatted: "REF-1006-1",
    count: 1,
    _id: "6690a8a8298f9ea4d6d54302",
  },
  route: null,
  paytime: "2026-07-13",
  note: "",
  currency: "JOD",
  transaction_type: "cash",
  transaction_processed: true,
  company_namespace: ["unisap"],
  sync_id: "a1b2c3d4-0000-0000-0000-000000000001",
  teams: [],
  paymentsData: {
    amount: 150500,
    paid: 0,
    balance: 150500,
    payments: [],
    _id: "6690a8a8298f9ea4d6d54303",
  },
  createdAt: "2026-07-13T11:31:52.069Z",
  updatedAt: "2026-07-13T11:31:52.069Z",
  __v: 0,
};

const check_refund = {
  ...cash_refund,
  _id: "6690a8a8298f9ea4d6d54311",
  amount: 320000, // milli-units => 320.000
  remainder: 320000,
  transaction_type: "check",
  serial_number: {
    identifier: "1006",
    formatted: "REF-1006-2",
    count: 2,
    _id: "6690a8a8298f9ea4d6d54312",
  },
  sync_id: "a1b2c3d4-0000-0000-0000-000000000002",
  paymentsData: {
    amount: 320000,
    paid: 0,
    balance: 320000,
    payments: [],
    _id: "6690a8a8298f9ea4d6d54313",
  },
};

// Toggle between a cash refund (PaymentType 1) and a cheque refund (PaymentType 2).
const refund_bodies = { cash: cash_refund, check: check_refund };
const REFUND_TYPE: keyof typeof refund_bodies = "cash";

Actions(
  {
    version: "2.0",
    routeKey: "POST /actions",
    rawPath: "/actions",
    rawQueryString: "app=repzo-sap-absjo&action=create_refund",
    headers: {
      action_sync_id: "Actions-0000005", // SYNC_ID
      accept: "*/*",
      "accept-encoding": "gzip, deflate",
      "content-length": "3658",
      "content-type": "application/json",
      host: "staging.marketplace.api.repzo.me",
      "svix-id": "msg_29I1By29ETyPiZ4SNrc99KIg7D6",
      "svix-signature": "v1,OkktM+dibxzeb0M6383POFjBr7DX14HECpBIh17FQnU=",
      "svix-timestamp": "1652785653",
      "user-agent": "Svix-Webhooks/1.4",
      "x-amzn-trace-id": "Root=1-628381f6-0b2c6f346d2eb5d207b582ee",
      "x-forwarded-for": "52.215.16.239",
      "x-forwarded-port": "443",
      "x-forwarded-proto": "https",
    },
    queryStringParameters: {
      action: "create_refund",
      app: "repzo-sap-absjo",
    },
    requestContext: {
      accountId: "478266140170",
      apiId: "ulkb1ikop2",
      domainName: "staging.marketplace.api.repzo.me",
      domainPrefix: "staging",
      http: {
        method: "POST",
        path: "/actions",
        protocol: "HTTP/1.1",
        sourceIp: "52.215.16.239",
        userAgent: "Svix-Webhooks/1.4",
      },
      requestId: "SRE-ejb6IAMEPWQ=",
      routeKey: "POST /actions",
      stage: "$default",
      time: "13/Jul/2026:11:07:34 +0000",
      timeEpoch: 1752364800000,
    },
    body: JSON.stringify(refund_bodies[REFUND_TYPE]),
    isBase64Encoded: false,
  },
  {
    app_id: "",
    repzoEndPoint: "",
    serviceEndPoint: "",
    env: "staging",
    data: {
      invoices: {
        createInvoiceHook: false,
        createReturnInvoiceHook: false,
      },
      payments: {
        createPaymentHook: false,
      },
      refunds: {
        createRefundHook: false,
      },
      proformas: {
        createApprovedProformaHook: false,
      },
      transfer: {
        createApprovedTransferHook: false,
      },
      repzoApiKey: "L98_Pc8qZG2R5hZIIMjxLQNUgUzT3_0aX2BuLvkyh74",
      sapHostUrl: "http://unipal.b1pro.com:8083/api",
      errorEmail: "maram.alshen@repzoapp.com",
      serviceApiKey: "awdas",
      warehouseDefaultUpdateDate: "2015-01-01",
      DepartmentCode: "D2",
      SalPersCode: "111",
      SalesPersonCode: "111",
    },
  }
);
