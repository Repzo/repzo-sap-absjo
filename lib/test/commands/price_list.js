import { Commands } from "../../index.js";
let commandEvent = {
  app: {
    _id: "6391a53edb71ef6435719794",
    name: "SAP",
    disabled: false,
    available_app: {
      _id: "6391a268db71ef64357195da",
      name: "repzo-sap-absjo",
      title: "SAP ABS JO",
      logo: "https://www.e2abs.com/wp-content/uploads/2021/03/Website-Main-Logo-1.svg",
      description: "",
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
          warehouseDefaultUpdateDate: {
            type: "string",
            format: "date",
            title: "Warehouse: Default Update Date",
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
      ],
      actions: [],
      createdAt: "2022-12-08T08:38:00.915Z",
      updatedAt: "2022-12-08T09:42:49.236Z",
      __v: 0,
    },
    company_namespace: ["unisap"],
    formData: {
      repzoApiKey: "L98_Pc8qZG2R5hZIIMjxLQNUgUzT3_0aX2BuLvkyh74",
      sapHostUrl: "http://unipal.b1pro.com:8083/api",
      errorEmail: "maram.alshen@repzoapp.com",
      serviceApiKey: "awdas",
      warehouseDefaultUpdateDate: "2015-01-01",
    },
    options_formData: {},
    createdAt: "2022-12-08T08:50:06.903Z",
    updatedAt: "2022-12-08T09:43:21.620Z",
    __v: 0,
  },
  end_of_day: "04:00",
  nameSpace: ["unisap"],
  timezone: "Asia/Amman",
  meta: "",
  env: "staging",
  sync_id: "47c9c804-e136-4d54-928a-000013",
  command: "price_list",
};
Commands(commandEvent);
