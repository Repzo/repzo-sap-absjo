import { Commands } from "../../index.js";
let commandEvent = {
  app: {
    _id: "63b675c3415fa2f77182be35",
    name: "SAP",
    disabled: false,
    available_app: {
      _id: "6391a268db71ef64357195da",
      name: "repzo-sap-absjo",
      title: "SAP ABS JO",
      logo: "https://prod-repzo-media-service.s3.us-east-1.amazonaws.com/repzo/image/2022/12/18/3f73de7d-1920-4786-90db-57c76d18acci-SAP_EBS_JO.png",
      description:
        "SAP Jordan. We provide real value to SMEs by understanding their business and driving their vision forward with SAP Business One",
      disabled: false,
      JSONSchema: {
        title: "SAP Integration Settings",
        type: "object",
        required: ["repzoApiKey", "sapHostUrl"],
        properties: {
          repzoApiKey: {
            type: "string",
            title: "Repzo API KEY",
          },
          sapHostUrl: {
            type: "string",
            title: "SAP Host Url",
          },
          errorEmail: {
            type: "string",
            format: "email",
            title: "Email in case of error",
          },
          GroupCode: {
            type: "string",
            format: "string",
            title: "Customers GroupCode",
          },
          warehouseDefaultUpdateDate: {
            type: "string",
            format: "date",
            title: "Warehouse: Default Update Date",
          },
          DepartmentCode: {
            type: "string",
            format: "string",
            title: "Invoice/Return Department Code",
          },
          return_reason: {
            type: "string",
            format: "string",
            title: "Return Reason Array",
          },
          SalPersCode: {
            type: "string",
            format: "string",
            title: "Default Sales Person Code For Sales Orders",
          },
          SalesPersonCode: {
            type: "string",
            format: "string",
            title: "Default Sales Person Code For Transfer",
          },
          invoices: {
            type: "object",
            title: "Invoices",
            required: ["createInvoiceHook", "createReturnInvoiceHook"],
            properties: {
              createInvoiceHook: {
                type: "boolean",
                title: "Live Sync Invoices from Repzo to SAP",
                default: false,
              },
              createReturnInvoiceHook: {
                type: "boolean",
                title: "Live Sync Return Invoice from Repzo to SAP",
                default: false,
              },
            },
          },
          payments: {
            type: "object",
            title: "Payments",
            required: ["createPaymentHook"],
            properties: {
              createPaymentHook: {
                type: "boolean",
                title: "Live Sync Payments from Repzo to SAP",
                default: false,
              },
            },
          },
          proformas: {
            type: "object",
            title: "Sales Orders",
            required: ["createApprovedProformaHook"],
            properties: {
              createApprovedProformaHook: {
                type: "boolean",
                title: "Live Sync Approved Sales Orders from Repzo to SAP",
                default: false,
              },
            },
          },
          transfers: {
            type: "object",
            title: "Transfers",
            required: ["createApprovedTransferHook"],
            properties: {
              createApprovedTransferHook: {
                type: "boolean",
                title: "Live Sync Approved Transfers from Repzo to SAP",
                default: false,
              },
              adjustInventoryInFailedTransfer: {
                type: "boolean",
                title:
                  "Adjust Inventories in Repzo if creation Transfer Failed in SAP",
                default: false,
              },
            },
          },
        },
      },
      options_JSONSchema: {
        title: "SAP Integration Optional Settings",
        type: "object",
        required: [],
        properties: {
          bench_time_warehouse: {
            title: "Bench Time: Warehouse",
            type: "string",
            format: "date",
          },
          bench_time_channel: {
            title: "Bench Time: Channels",
            type: "string",
            format: "date-time",
          },
          bench_time_payment_term: {
            title: "Bench Time: Payment Terms",
            type: "string",
            format: "date-time",
          },
          bench_time_product: {
            title: "Bench Time: Products",
            type: "string",
            format: "date-time",
          },
          bench_time_product_disabled: {
            title: "Bench Time: Inactive Products",
            type: "string",
            format: "date-time",
          },
          bench_time_price_list: {
            title: "Bench Time: Price List",
            type: "string",
            format: "date-time",
          },
          bench_time_client: {
            title: "Bench Time: Clients",
            type: "string",
            format: "date-time",
          },
          bench_time_disabled_client: {
            title: "Bench Time: Inactive Clients",
            type: "string",
            format: "date-time",
          },
        },
      },
      app_settings: {
        repo: "",
        serviceEndPoint: "",
        _id: "6391a268db71ef64357195db",
      },
      app_category: "6249fa8466312f76e595634a",
      commands: [
        {
          command: "basic",
          name: "Full Sync",
          description: "",
          _id: "6391a268db71ef64357195dc",
        },
        {
          command: "join",
          name: "Join",
          description: "",
          _id: "6391a268db71ef64357195dd",
        },
        {
          command: "warehouse",
          name: "Sync Warehouse",
          description: "Sync Warehouses From SAP to Repzo",
          _id: "6391c42a1b0f4f7a30e40f40",
        },
        {
          command: "rep",
          name: "Sync Representatives",
          description: "Sync Representatives From SAP to Repzo",
          _id: "639715c2bee5dd4b6b11e129",
        },
        {
          command: "tax",
          name: "Sync Taxes",
          description: "Sync Taxes From SAP to Repzo",
          _id: "639715c2bee5dd4b6b11e12a",
        },
        {
          command: "tag",
          name: "Sync Area Tags",
          description: "Sync Area Tags From SAP to Repzo",
          _id: "639715c2bee5dd4b6b11e12b",
        },
        {
          command: "measureunit",
          name: "Sync Measure Units",
          description: "Sync Measure Units From SAP to Repzo",
          _id: "639817eaedafde008af0ad0e",
        },
        {
          command: "measureunit_family",
          name: "Sync Measure Units Family",
          description: "Sync Measure Units Family From SAP to Repzo",
          _id: "63982d09edafde008af0f698",
        },
        {
          command: "category",
          name: "Sync Product Category",
          description: "Sync Product Categories From SAP to Repzo",
          _id: "63984085edafde008af2f689",
        },
        {
          command: "channel",
          name: "Sync Client's Channels",
          description: "Sync Client's Channels From SAP to Repzo",
          _id: "63984085edafde008af2f689",
        },
        {
          command: "payment_term",
          name: "Sync Payments Term",
          description: "Sync Payments Term From SAP to Repzo",
          _id: "63984085edafde008af2f68a",
        },
        {
          command: "bank",
          name: "Sync Banks",
          description: "Sync Banks From SAP to Repzo",
          _id: "63986018333b84929c538570",
        },
        {
          command: "product",
          name: "Sync Products",
          description: "Sync Active Products From SAP to Repzo",
          _id: "63987139333b84929c53a293",
        },
        {
          command: "disabled_product",
          name: "Sync Inactive Products",
          description: "Sync Inactive Products From SAP to Repzo",
          _id: "6399714d0242db686d496466",
        },
        {
          command: "price_list",
          name: "Sync Price Lists",
          description: "Sync Price Lists From SAP to Repzo",
          _id: "639972d6e8a1cfdd26deaa7e",
        },
        {
          command: "client",
          name: "Sync Clients",
          description: "Sync Clients From SAP to Repzo",
          _id: "63997615e8a1cfdd26ded7d1",
        },
        {
          command: "disabled_client",
          name: "Sync Inactive Clients",
          description: "Sync Inactive Clients From SAP to Repzo",
          _id: "639ac554e157f1c63770c1bc",
        },
        {
          command: "adjust_inventory",
          name: "Adjust Inventories",
          description: "Adjust Inventories From SAP to Repzo",
          _id: "639ac56fe157f1c63770c2eb",
        },
      ],
      actions: [
        {
          action: "create_invoice",
          name: "Sync Invoices",
          description: "Sync Invoices From Repzo to SAP",
          _id: "639ebeacdbba64d7af94520c",
        },
        {
          action: "create_return_invoice",
          name: "Sync Return Invoices",
          description: "Sync Return Invoices From Repzo to SAP",
          _id: "639ebeacdbba64d7af94520d",
        },
        {
          action: "create_proforma",
          name: "Sync Approved Sales Orders",
          description: "Sync Approved Sales Orders From Repzo to SAP",
          _id: "639ebeacdbba64d7af94520e",
        },
        {
          action: "create_payment",
          name: "Sync Paymants",
          description: "Sync Paymants From Repzo to SAP",
          _id: "639ebeacdbba64d7af94520f",
        },
        {
          action: "create_transfer",
          name: "Sync Approved Transfers",
          description: "Sync Approved Transfers From Repzo to SAP",
          _id: "639ebeacdbba64d7af945210",
        },
      ],
      createdAt: "2022-12-08T08:38:00.915Z",
      updatedAt: "2022-12-20T11:09:00.384Z",
      __v: 0,
    },
    company_namespace: ["unisap_sandbox"],
    formData: {
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
      transfers: {
        createApprovedTransferHook: false,
        adjustInventoryInFailedTransfer: false,
      },
      repzoApiKey: "FAy474OnztyZ8qM1aJag-9u0yFitvdgPM6H4AMtOkMM",
      sapHostUrl: "http://unipal.b1pro.com:8082/api",
      DepartmentCode: "D2",
      SalPersCode: "111",
      SalesPersonCode: "111",
    },
    options_formData: {
      bench_time_warehouse: "2023-01-05",
      bench_time_rep: "2023-01-05T07:59:26.428Z",
      bench_time_tax: "2023-01-05T08:00:05.183Z",
      bench_time_tag: "2023-01-05T08:00:17.464Z",
      bench_time_measureunit: "2023-01-05T08:00:57.470Z",
      bench_time_measureunit_family: "2023-01-05T08:02:43.465Z",
      bench_time_category: "2023-01-05T08:15:39.152Z",
      bench_time_channel: "2023-01-05T08:15:53.448Z",
      bench_time_payment_term: "2023-01-05T08:16:14.994Z",
      bench_time_product: "2023-01-05T08:16:33.597Z",
      bench_time_product_disabled: "2023-01-05T08:18:56.000Z",
      bench_time_price_list: "2023-01-05T08:18:57.098Z",
      bench_time_client: "2023-01-05T08:41:01.505Z",
      bench_time_disabled_client: 0,
    },
    createdAt: "2023-01-05T07:01:23.338Z",
    updatedAt: "2023-01-05T09:20:34.956Z",
    __v: 0,
  },
  end_of_day: "04:00",
  nameSpace: ["unisap"],
  timezone: "Asia/Amman",
  meta: "",
  env: "staging",
  sync_id: "7a5718e5-759c-4f11-b3c4-c465d09b2092",
  command: "disabled_client",
};
Commands(commandEvent);
