import { Actions } from "../../index.js";
Actions(
  {
    version: "2.0",
    routeKey: "POST /actions",
    rawPath: "/actions",
    rawQueryString: "app=repzo-sap-absjo&action=create_payment",
    headers: {
      action_sync_id: "Actions-0000004", // SYNC_ID
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
      action: "create_payment",
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
      time: "17/May/2022:11:07:34 +0000",
      timeEpoch: 1652785654069,
    },
    body: JSON.stringify({
      _id: "639da8a8298f9ea4d6d543dd",
      status: "unconsumed",
      remainder: 3651631,
      amount: 3651631,
      client_id: "639adef7b4dc172fc503645e",
      client_name: "ماي ماركت _ مسكه لتجارة المواد الغذائية",
      creator: {
        _id: "6395af44a7fbbe901db1c2aa",
        type: "rep",
        name: "RET MUSTAFA MOHAMMAD RASHEED ABDALLAH",
      },
      time: 1671276710322,
      serial_number: {
        identifier: "1036",
        formatted: "PAY-1036-362",
        count: 362,
        _id: "639da8a8298f9ea4d6d543de",
      },
      route: null,
      paytime: "2022-12-17",
      note: "",
      currency: "JOD",
      payment_type: "check",
      check: {
        drawer_name: "شركة مسكة لتجارة المواد الغذائيه ",
        bank: "639863e6333b84929c539077",
        bank_branch: "دابوق ",
        check_number: 11322,
        check_date: "2022-12-17",
        photo:
          "https://repzo-media-service.s3.eu-west-2.amazonaws.com/unisap/image/2022/12/17/f7027375-8e21-4b0d-baff-15bc7e642803.jpeg",
        media: [],
        caption: null,
        disabled: false,
        _id: "639da8a8298f9ea4d6d543df",
      },
      company_namespace: ["unisap"],
      sync_id: "0109372a-8479-44ba-b519-5f1041afca8e",
      teams: [],
      paymentsData: {
        amount: -3651631,
        paid: 0,
        balance: -3651631,
        payments: [],
        _id: "639da8a8298f9ea4d6d543e0",
      },
      reference: "",
      createdAt: "2022-12-17T11:31:52.069Z",
      updatedAt: "2022-12-17T11:31:52.069Z",
      __v: 0,
      balance_to_refund: 3651631,
    }),
    isBase64Encoded: false,
  },
  {
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
      return_reason:
        '[{sap_id:1,sap_name:"BarcodeIssue",repzo_name:"Barcodeissue",repzo_id:"62b074972b332895edf114fc"},{sap_id:2,sap_name:"Damaged",repzo_name:"Damaged",repzo_id:"62b074ace96258fb745982e4"},{sap_id:3,sap_name:"Nearexpiry",repzo_name:"Nearexpiry",repzo_id:"62b074c0a066173bd1c1ea0d"},{sap_id:4,sap_name:"Wrongprinting",repzo_name:"Wrongprinting",repzo_id:"62b074d79e7f41f306a4cb42"},{sap_id:5,sap_name:"experied",repzo_name:"Experied",repzo_id:"62b074faa066173bd1c1eec0"}]',
      SalPersCode: "111",
      SalesPersonCode: "111",
    },
  },
);
