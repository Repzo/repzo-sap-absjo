const set_error = (error_res) => {
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

const REPZO_PRISELISTS = {
  data: [
    {
      _id: "678cd402121f6aed05221105",
      name: "PL_7",
      disabled: false,
      integration_meta: { id: "unipaljo_7" },
    },
    {
      _id: "677f7a1e3d63a5cfd9f5a819",
      name: "PL_6",
      disabled: false,
      integration_meta: { id: "unipaljo_6" },
    },
    {
      _id: "6728ab66f443c5dad059e68c",
      name: "PL_5",
      disabled: false,
      integration_meta: { id: "unipaljo_5" },
    },
    {
      _id: "6519de2c08eb2c0f3c5f0b52",
      name: "PL_4",
      disabled: false,
      integration_meta: { id: "unipaljo_4" },
    },
    {
      _id: "64b3e5248dc2dad34d0da786",
      name: "PL_65",
      disabled: false,
      integration_meta: { id: "unipaljo_65" },
    },
    {
      _id: "64b3e5221c7351262812a06d",
      name: "PL_50",
      disabled: false,
      integration_meta: { id: "unipaljo_50" },
    },
    {
      _id: "64b3e5201f7f4bb4a82dbe71",
      name: "PL_47",
      disabled: false,
      integration_meta: { id: "unipaljo_47" },
    },
    {
      _id: "64216ecefa292ea9161221c7",
      name: "PL_46",
      disabled: false,
      integration_meta: { id: "unipaljo_46" },
    },
    {
      _id: "63d76801d720467852c79127",
      name: "PL_45",
      disabled: false,
      integration_meta: { id: "unipaljo_45" },
    },
    {
      _id: "63d2699b87bbc2685675be49",
      name: "PL_3",
      disabled: false,
      integration_meta: { id: "unipaljo_3" },
    },
    {
      _id: "63c781c83dee0eb3570bc828",
      name: "PL_44",
      disabled: false,
      integration_meta: { id: "unipaljo_44" },
    },
    {
      _id: "63adf9124520b1023245f7bb",
      name: "PL_37",
      disabled: false,
      integration_meta: { id: "unipaljo_37" },
    },
    {
      _id: "63adf91201b4b6392a138422",
      name: "PL_43",
      disabled: false,
      integration_meta: { id: "unipaljo_43" },
    },
    {
      _id: "63a0648ac843d331be4d72d3",
      name: "PL_36",
      disabled: false,
      integration_meta: { id: "unipaljo_36" },
    },
    {
      _id: "63a0648ac3b2d7ec0616bdbf",
      name: "PL_32",
      disabled: false,
      integration_meta: { id: "unipaljo_32" },
    },
    {
      _id: "63a0648a3277ca7cd3d67a6d",
      name: "PL_35",
      disabled: false,
      integration_meta: { id: "unipaljo_35" },
    },
    {
      _id: "638d98f412bd9161d179bbf2",
      name: "PL_-1",
      disabled: false,
      integration_meta: { id: "unipaljo_-1" },
    },
    {
      _id: "638765a8479737a9e85b737a",
      name: "PL_2",
      disabled: false,
      integration_meta: { id: "unipaljo_2" },
    },
    {
      _id: "63146edec1e65617f8093afe",
      name: "PL_31",
      disabled: false,
      integration_meta: { id: "unipaljo_31" },
    },
    {
      _id: "61c9b020e86548382bef73ae",
      name: "PL_27",
      disabled: false,
      integration_meta: { id: "unipaljo_27" },
    },
    {
      _id: "61c9b0206e468fedf7f92194",
      name: "PL_29",
      disabled: false,
      integration_meta: { id: "unipaljo_29" },
    },
    {
      _id: "61c9b02034327011a50721f2",
      name: "PL_28",
      disabled: false,
      integration_meta: { id: "unipaljo_28" },
    },
    {
      _id: "61c9b0200281e55fe35ee04e",
      name: "PL_30",
      disabled: false,
      integration_meta: { id: "unipaljo_30" },
    },
    {
      _id: "61c9b01f96570a67c506fa39",
      name: "PL_23",
      disabled: false,
      integration_meta: { id: "unipaljo_23" },
    },
    {
      _id: "61c9b01f96570a67c506fa33",
      name: "PL_13",
      disabled: false,
      integration_meta: { id: "unipaljo_13" },
    },
    {
      _id: "61c9b01f6e468fedf7f9218e",
      name: "PL_18",
      disabled: false,
      integration_meta: { id: "unipaljo_18" },
    },
    {
      _id: "61c9b01f6e468fedf7f92188",
      name: "PL_15",
      disabled: false,
      integration_meta: { id: "unipaljo_15" },
    },
    {
      _id: "61c9b01f51da5911a57bf5dd",
      name: "PL_26",
      disabled: false,
      integration_meta: { id: "unipaljo_26" },
    },
    {
      _id: "61c9b01f51da5911a57bf5d8",
      name: "PL_19",
      disabled: false,
      integration_meta: { id: "unipaljo_19" },
    },
    {
      _id: "61c9b01f51da5911a57bf5d3",
      name: "PL_16",
      disabled: false,
      integration_meta: { id: "unipaljo_16" },
    },
    {
      _id: "61c9b01f34327011a50721ed",
      name: "PL_24",
      disabled: false,
      integration_meta: { id: "unipaljo_24" },
    },
    {
      _id: "61c9b01f34327011a50721e7",
      name: "PL_17",
      disabled: false,
      integration_meta: { id: "unipaljo_17" },
    },
    {
      _id: "61c9b01f1f299d954fafbc4d",
      name: "PL_25",
      disabled: false,
      integration_meta: { id: "unipaljo_25" },
    },
    {
      _id: "61c9b01f1f299d954fafbc48",
      name: "PL_20",
      disabled: false,
      integration_meta: { id: "unipaljo_20" },
    },
    {
      _id: "61c9b01f1f299d954fafbc43",
      name: "PL_14",
      disabled: false,
      integration_meta: { id: "unipaljo_14" },
    },
    {
      _id: "61c9b01f1f299d954fafbc3e",
      name: "PL_1",
      disabled: false,
      integration_meta: { id: "unipaljo_1" },
    },
    {
      _id: "61c9b01f0d469f136615cd8a",
      name: "PL_22",
      disabled: false,
      integration_meta: { id: "unipaljo_22" },
    },
    {
      _id: "61c9b01f0d469f136615cd86",
      name: "PL_12",
      disabled: false,
      integration_meta: { id: "unipaljo_12" },
    },
    {
      _id: "61c9b01f0281e55fe35ee042",
      name: "PL_21",
      disabled: false,
      integration_meta: { id: "unipaljo_21" },
    },
    {
      _id: "61c9b01f0281e55fe35ee03e",
      name: "PL_11",
      disabled: false,
      integration_meta: { id: "unipaljo_11" },
    },
  ],
};

const sync_price_list = async () => {
  // const repzo = new Repzo(commandEvent.app.formData?.repzoApiKey, {
  //   env: commandEvent.env,
  // });

  // const commandLog = new Repzo.CommandLog(
  //   repzo,
  //   commandEvent.app,
  //   commandEvent.command
  // );
  console.log("START");
  try {
    // console.log("sync_price_list");

    const new_bench_time = new Date().toISOString();
    const bench_time_key = "bench_time_price_list";

    // await commandLog.load(commandEvent.sync_id);
    // await commandLog
    //   .addDetail("Repzo SAP: Started Syncing Price Lists")
    //   .commit();

    const nameSpace = "unipaljo"; // commandEvent.app.options_formData?.nameSpace || "unipaljo";
    const result = {
      PL: { created: 0, updated: 0, failed: 0 },
      PL_items: { created: 0, updated: 0, failed: 0 },
      sap_total: 0,
      repzo_total: 0,
      repzo_PL_items: 0,
      sap_UoMs_total: 0,
      repzo_products_total: 0,
    };
    const failed_docs_report = [];

    // Get SAP Price Lists
    const sap_price_lists = [
      {
        PLDID: 7,
        PLITEMID: "010-KEA-JU0003",
        PLITEMPRICEVALUE: 9.84,
        PLITEMUNIT: "CRTN x 12",
        CREATEDATE: "2022-11-29T21:00:00Z",
        UPDATEDATE: "2025-07-21T21:00:00Z",
      },
      {
        PLDID: 50,
        PLITEMID: "010-KEA-JU0003",
        PLITEMPRICEVALUE: 6.6,
        PLITEMUNIT: "CRTN x 12",
        CREATEDATE: "2022-11-29T21:00:00Z",
        UPDATEDATE: "2025-07-21T21:00:00Z",
      },
      {
        PLDID: 46,
        PLITEMID: "010-KEA-JU0003",
        PLITEMPRICEVALUE: 6.172,
        PLITEMUNIT: "CRTN x 12",
        CREATEDATE: "2022-11-29T21:00:00Z",
        UPDATEDATE: "2025-07-21T21:00:00Z",
      },
      {
        PLDID: 27,
        PLITEMID: "010-KEA-JU0003",
        PLITEMPRICEVALUE: 9.744,
        PLITEMUNIT: "CRTN x 12",
        CREATEDATE: "2022-11-29T21:00:00Z",
        UPDATEDATE: "2025-07-21T21:00:00Z",
      },
      {
        PLDID: 12,
        PLITEMID: "010-KEA-JU0003",
        PLITEMPRICEVALUE: 10.9,
        PLITEMUNIT: "CRTN x 12",
        CREATEDATE: "2022-11-29T21:00:00Z",
        UPDATEDATE: "2025-07-21T21:00:00Z",
      },
      {
        PLDID: 11,
        PLITEMID: "010-KEA-JU0003",
        PLITEMPRICEVALUE: 11.82,
        PLITEMUNIT: "CRTN x 12",
        CREATEDATE: "2022-11-29T21:00:00Z",
        UPDATEDATE: "2025-07-21T21:00:00Z",
      },
      {
        PLDID: 2,
        PLITEMID: "010-KEA-JU0003",
        PLITEMPRICEVALUE: 11.17,
        PLITEMUNIT: "CRTN x 12",
        CREATEDATE: "2022-11-29T21:00:00Z",
        UPDATEDATE: "2025-07-21T21:00:00Z",
      },
      {
        PLDID: 45,
        PLITEMID: "010-KEA-JU0003",
        PLITEMPRICEVALUE: 11.45,
        PLITEMUNIT: "CRTN x 12",
        CREATEDATE: "2022-11-29T21:00:00Z",
        UPDATEDATE: "2025-07-21T21:00:00Z",
      },
      {
        PLDID: 36,
        PLITEMID: "010-KEA-JU0003",
        PLITEMPRICEVALUE: 9.98,
        PLITEMUNIT: "CRTN x 12",
        CREATEDATE: "2022-11-29T21:00:00Z",
        UPDATEDATE: "2025-07-21T21:00:00Z",
      },
      {
        PLDID: 6,
        PLITEMID: "010-KEA-JU0003",
        PLITEMPRICEVALUE: 9.72,
        PLITEMUNIT: "CRTN x 12",
        CREATEDATE: "2022-11-29T21:00:00Z",
        UPDATEDATE: "2025-07-21T21:00:00Z",
      },
      {
        PLDID: 37,
        PLITEMID: "010-KEA-JU0003",
        PLITEMPRICEVALUE: 12.01,
        PLITEMUNIT: "CRTN x 12",
        CREATEDATE: "2022-11-29T21:00:00Z",
        UPDATEDATE: "2025-07-21T21:00:00Z",
      },
      {
        PLDID: 32,
        PLITEMID: "010-KEA-JU0003",
        PLITEMPRICEVALUE: 8.52,
        PLITEMUNIT: "CRTN x 12",
        CREATEDATE: "2022-11-29T21:00:00Z",
        UPDATEDATE: "2025-07-21T21:00:00Z",
      },
      {
        PLDID: 35,
        PLITEMID: "010-KEA-JU0003",
        PLITEMPRICEVALUE: 9.98,
        PLITEMUNIT: "CRTN x 12",
        CREATEDATE: "2022-11-29T21:00:00Z",
        UPDATEDATE: "2025-07-21T21:00:00Z",
      },
      {
        PLDID: 4,
        PLITEMID: "010-KEA-JU0003",
        PLITEMPRICEVALUE: 9.744,
        PLITEMUNIT: "CRTN x 12",
        CREATEDATE: "2022-11-29T21:00:00Z",
        UPDATEDATE: "2025-07-21T21:00:00Z",
      },
      // {
      //   PLDID: -1,
      //   PLITEMID: "010-KEA-JU0003",
      //   PLITEMPRICEVALUE: 0.04404,
      //   PLITEMUNIT: "PC",
      //   CREATEDATE: "2022-11-29T21:00:00Z",
      //   UPDATEDATE: "2025-07-21T21:00:00Z",
      // },
    ];
    result.sap_total = sap_price_lists?.length;

    // await commandLog
    //   .addDetail(
    //     `${result.sap_total} Price Lists in SAP changed since ${
    //       commandEvent.app.options_formData[bench_time_key] || "ever"
    //     }`
    //   )
    //   .commit();

    // Get SAP UoMs
    const sap_UoMs = [
      {
        ITEMCODE: "010-KEA-JU0003",
        UOMGROUPENTRY: 11,
        UOMGROUPCODE: "CARTON",
        UOMGROUPNAME: "CARTON",
        BASEUOMID: 1,
        BASEUOMCODE: "PC",
        BASEQTY: 1.0,
        ALTUOMID: 6,
        ALTUOMCODE: "CRTN x 12",
        ALTQTY: 12.0,
        PkgCodeDft: 4,
        PkgCode: 4,
        PkgType: "Integration UOM",
      },
    ];
    result.sap_UoMs_total = sap_UoMs?.length;

    // await commandLog
    //   .addDetail(`${result.sap_total} Unit of Measures in SAP`)
    //   .commit();

    // Get Repzo Price Lists
    const repzo_price_lists = REPZO_PRISELISTS;
    result.repzo_total = repzo_price_lists?.data?.length;
    // await commandLog
    //   .addDetail(`${repzo_price_lists?.data?.length} Price Lists in Repzo`)
    //   .commit();

    // Get Repzo Products
    const repzo_products = {
      data: [
        {
          _id: "61c9ae5e1f299d954fafa6bc",
          name: "KEAN APPLE JUICE 1L",
          sku: "010-KEA-JU0003",
          category: "61c9a4570d469f1366154ec3",
          sub_category: [],
          assigned_to: [],
          barcode: "5290040000039",
          sv_tax: "61c9a40851da5911a57b6d9c",
          sv_measureUnit: "67b5d372e5445f50295ab370",
          description: null,
          product_img:
            "https://repzo-media-service.s3.eu-west-2.amazonaws.com/unipaljo/image/2022/1/4/147f98f5-5427-48c0-8495-5b8ce745936f.jpeg",
          active: true,
          assigned_media: [],
          company_namespace: ["unipaljo"],
          modifiers_group: [],
          measureunit_family: "61c9a43b1f299d954faf4921",
          integration_meta: {
            id: "unipaljo_010-KEA-JU0003",
            ITEMGROUPCODE: 110,
            UOMGROUPENTRY: 11,
            BRAND: "KEAN",
          },
          teams: [],
          product_groups: [
            "65b2603a1dff121b13972eb7",
            "667acd780e83ac089b98b3fd",
            "667acd4fdea2d07371567ae9",
            "667acd94a132cd78204e9348",
          ],
          frozen_pre_sales: false,
          frozen_sales: false,
          createdAt: "2021-12-27T12:15:26.770Z",
          updatedAt: "2025-02-19T13:16:54.028Z",
          __v: 0,
          auditable: null,
          brand: "650180626db1c1b9393e1bcc",
          featured: null,
          html_description: null,
          local_name: "عصير كين التفاح 1 لتر بلد المنشأ قبرص",
          position: null,
          rsp: null,
          variants: [
            {
              _id: "61c9ae5e1f299d954fafa6be",
              product: "61c9ae5e1f299d954fafa6bc",
              uuid: "",
              name: "010-KEA-JU0003",
              local_name: "",
              sku: "",
              barcode: "",
              price: 0,
              weight: 0,
              length: 0,
              width: 0,
              height: 0,
              disabled: false,
              default: false,
              variant_img: null,
              modifiers_groups: [],
              integration_meta: {
                id: "unipaljo_010-KEA-JU0003",
                ITEMCODE: "010-KEA-JU0003",
              },
              company_namespace: ["unipaljo"],
              __v: 0,
              createdAt: "2021-12-27T12:15:26.775Z",
              updatedAt: "2025-02-19T13:16:54.102Z",
            },
          ],
        },
        {
          _id: "61c9ae5fe86548382bef59f3",
          name: "KEAN CRANBERRY NECTAR",
          sku: "010-KEA-JU0011",
          category: "61c9a4570d469f1366154ec3",
          sub_category: [],
          assigned_to: [],
          barcode: "5290040003702",
          sv_tax: "61c9a40851da5911a57b6d9c",
          sv_measureUnit: "67b5d1ed079c565fb1c2c3b3",
          description: null,
          product_img:
            "https://repzo-media-service.s3.eu-west-2.amazonaws.com/unipaljo/image/2022/1/4/2dd6bcfd-311b-46ce-b123-c68b49321fca.jpeg",
          active: true,
          assigned_media: [],
          company_namespace: ["unipaljo"],
          modifiers_group: [],
          measureunit_family: "61c9a43b34327011a506ac6e",
          integration_meta: {
            id: "unipaljo_010-KEA-JU0011",
            ITEMGROUPCODE: 110,
            UOMGROUPENTRY: 11,
            BRAND: "KEAN",
          },
          teams: [],
          product_groups: [
            "65b260473c1ae3348d78588d",
            "667acd780e83ac089b98b3fd",
            "667acd94a132cd78204e9348",
          ],
          frozen_pre_sales: false,
          frozen_sales: false,
          createdAt: "2021-12-27T12:15:27.837Z",
          updatedAt: "2025-08-17T10:12:47.012Z",
          __v: 0,
          auditable: null,
          brand: "650180626db1c1b9393e1bcc",
          featured: null,
          html_description: null,
          local_name: "كين نكتار التوت البري  1 لتر بلد المنشأ قبرص",
          position: null,
          rsp: null,
          variants: [
            {
              _id: "61c9ae5fe86548382bef59f5",
              product: "61c9ae5fe86548382bef59f3",
              uuid: "",
              name: "010-KEA-JU0011",
              local_name: "",
              sku: "",
              barcode: "",
              price: 0,
              weight: 0,
              length: 0,
              width: 0,
              height: 0,
              disabled: false,
              default: false,
              variant_img: null,
              modifiers_groups: [],
              integration_meta: {
                id: "unipaljo_010-KEA-JU0011",
                ITEMCODE: "010-KEA-JU0011",
              },
              company_namespace: ["unipaljo"],
              __v: 0,
              createdAt: "2021-12-27T12:15:27.847Z",
              updatedAt: "2025-08-17T10:12:47.146Z",
            },
          ],
        },
      ],
    };
    result.repzo_products_total = repzo_products?.data?.length;
    // await commandLog
    //   .addDetail(`${repzo_products?.data?.length} Products in Repzo`)
    //   .commit();

    // Get Repzo MeasureUnits
    const repzo_UoMs = {
      data: [
        {
          _id: "67b5d372e5445f50295ab370",
          parent: "61c980eb8c7670e963f19f72",
          name: "CRTN x 12",
          factor: 12,
          disabled: false,
          integration_meta: {
            id: "unipaljo_010-KEA-JU0003_11_6",
            UOMGROUPENTRY: 11,
            ALTUOMID: 6,
            ITEMCODE: "010-KEA-JU0003",
          },
          company_namespace: ["unipaljo"],
          createdAt: "2025-02-19T12:49:54.841Z",
          updatedAt: "2025-02-19T12:49:54.841Z",
          __v: 0,
        },
        {
          _id: "67b5d1f0db1db1d5abc335fe",
          parent: "61c980eb8c7670e963f19f72",
          name: "PC",
          factor: 1,
          disabled: false,
          integration_meta: {
            id: "unipaljo_010-KEA-JU0003_11_1",
            UOMGROUPENTRY: 11,
            ALTUOMID: 1,
            ITEMCODE: "010-KEA-JU0003",
          },
          company_namespace: ["unipaljo"],
          createdAt: "2025-02-19T12:43:28.577Z",
          updatedAt: "2025-02-19T12:43:28.577Z",
          __v: 0,
        },
      ],
    };
    result.repzo_total = repzo_UoMs?.data?.length;
    // await commandLog
    //   .addDetail(`${repzo_UoMs?.data?.length} Measure Units in Repzo`)
    //   .commit();

    if (!repzo_UoMs?.data?.length) throw "MeasureUnits in Repzo was not found";

    const sap_unique_UoMs = {};
    sap_UoMs.forEach((doc) => {
      const key = `${doc.ITEMCODE}__${doc.ALTUOMCODE}`;
      sap_unique_UoMs[key] = doc.ALTQTY;
    });

    // Get Repzo {Product_sku : product_default_measureunit_name}
    const repzo_product_default_measureunit = {};
    repzo_products.data.forEach((product) => {
      if (!product.sku) return;
      if (!product.sv_measureUnit) {
        repzo_product_default_measureunit[product.sku] = null;
      } else {
        const default_measureunit = repzo_UoMs.data.find(
          (m) => m._id == product.sv_measureUnit
        );
        if (default_measureunit) {
          repzo_product_default_measureunit[product.sku] =
            default_measureunit.name;
        } else {
          repzo_product_default_measureunit[product.sku] = null;
        }
      }
    });

    // sort the data
    const priceLists_withItems = {};
    sap_price_lists.forEach((doc) => {
      if (!priceLists_withItems[doc.PLDID])
        priceLists_withItems[doc.PLDID] = [];
      priceLists_withItems[doc.PLDID].push(doc);
    });

    // create priceLists
    const priceLists_names = Object.keys(priceLists_withItems);
    for (let i = 0; i < priceLists_names.length; i++) {
      // console.log({ i });
      const price_list_name = priceLists_names[i];
      const body = {
        name: `PL_${price_list_name}`,
        integration_meta: { id: `${nameSpace}_${price_list_name}` },
      };

      const repzo_price_list = repzo_price_lists?.data?.find(
        (pl) => pl?.integration_meta?.id == body?.integration_meta?.id
      );

      if (!repzo_price_list) {
        // Create
        try {
          console.log("CREATE PriceList", body);
          // const created_price_list = await repzo.priceList.create(body);
          result.PL.created++;
        } catch (e) {
          // console.log("Create Price List Failed >> ", e?.response, body);
          failed_docs_report.push({
            method: "create",
            doc: body,
            error_message: set_error(e),
          });
          result.PL.failed++;
        }
      } else {
        if (repzo_price_list?.name == body?.name) continue;
        // Update
        try {
          console.log("UPDATE PriceList", repzo_price_list._id, body);
          // const updated_price_list = await repzo.priceList.update(
          //   repzo_price_list._id,
          //   body
          // );
          result.PL.updated++;
        } catch (e) {
          // console.log("Update Price List Failed >> ", e?.response?.data, body);
          failed_docs_report.push({
            method: "update",
            doc_id: repzo_price_list?._id,
            doc: body,
            error_message: set_error(e),
          });
          result.PL.failed++;
        }
      }
    }
    // Price List Items ***************************************

    // await commandLog
    //   .addDetail(`Start Sync Price List Items From SAP to Repzo`)
    //   .commit();

    const repzo_all_priceLists = REPZO_PRISELISTS;
    // await commandLog
    //   .addDetail(`${repzo_all_priceLists?.data?.length} Price Lists in Repzo`)
    //   .commit();

    if (!repzo_all_priceLists?.data?.length)
      throw `No Price Lists was found On Repzo`;

    for (let priceList_name in priceLists_withItems) {
      // console.log(priceList_name);
      const repzo_PriceList = repzo_all_priceLists?.data?.find(
        (pl) => pl.integration_meta?.id == `${nameSpace}_${priceList_name}`
      );
      if (!repzo_PriceList) {
        // console.log(
        //   `Price list with PLDID: ${priceList_name} was not created or disabled`
        // );
        failed_docs_report.push({
          method: "create",
          // doc: priceLists_withItems[priceList_name],
          error_message: set_error(
            `Failed Create PriceList Items: number of PL items: ${priceLists_withItems[priceList_name].length} => Because Price list with PLDID: ${priceList_name} was not created or disabled`
          ),
        });
        result.PL_items.failed +=
          priceLists_withItems[priceList_name]?.length || 0;
        continue;
      }

      const repzo_price_list_items = {
        data: [
          {
            _id: "678cd511adc51fa929f6f315",
            company_namespace: ["unipaljo"],
            product_id: "61c9ae5e1f299d954fafa6bc",
            variant_id: "61c9ae5e1f299d954fafa6be",
            pricelist_id: "678cd402121f6aed05221105",
            disabled: false,
            price: 820,
            integration_meta: {
              id: "unipaljo_7_010-KEA-JU0003",
            },
            createdAt: "2025-01-19T10:33:53.799Z",
            updatedAt: "2025-02-23T13:13:38.466Z",
            __v: 0,
          },
          {
            _id: "6785003e3df26e8cec805f22",
            company_namespace: ["unipaljo"],
            product_id: "61c9ae5e1f299d954fafa6bc",
            variant_id: "61c9ae5e1f299d954fafa6be",
            pricelist_id: "677f7a1e3d63a5cfd9f5a819",
            disabled: false,
            price: 810,
            integration_meta: {
              id: "unipaljo_6_010-KEA-JU0003",
            },
            createdAt: "2025-01-13T11:59:58.894Z",
            updatedAt: "2025-01-13T11:59:58.894Z",
            __v: 0,
          },
          {
            _id: "66967c513d1dc67c41e340a1",
            company_namespace: ["unipaljo"],
            product_id: "61c9ae5e1f299d954fafa6bc",
            variant_id: "61c9ae5e1f299d954fafa6be",
            pricelist_id: "61c9b020e86548382bef73ae",
            disabled: false,
            price: 812,
            integration_meta: {
              id: "unipaljo_27_010-KEA-JU0003",
            },
            createdAt: "2024-07-16T13:57:37.858Z",
            updatedAt: "2024-07-16T13:57:37.858Z",
            __v: 0,
          },
          {
            _id: "6519de47d863f16e81a65bcc",
            pricelist_id: "6519de2c08eb2c0f3c5f0b52",
            variant_id: "61c9ae5e1f299d954fafa6be",
            __v: 0,
            company_namespace: ["unipaljo"],
            createdAt: "2023-10-01T21:01:59.811Z",
            disabled: false,
            integration_meta: {
              id: "unipaljo_4_010-KEA-JU0003",
            },
            price: 812,
            product_id: "61c9ae5e1f299d954fafa6bc",
            updatedAt: "2023-10-01T21:01:59.811Z",
          },
          {
            _id: "64b3e8e051a32f81757261a8",
            pricelist_id: "64b3e5221c7351262812a06d",
            variant_id: "61c9ae5e1f299d954fafa6be",
            __v: 0,
            company_namespace: ["unipaljo"],
            createdAt: "2023-07-16T12:56:00.270Z",
            disabled: false,
            integration_meta: {
              id: "unipaljo_50_010-KEA-JU0003",
            },
            price: 550,
            product_id: "61c9ae5e1f299d954fafa6bc",
            updatedAt: "2025-03-18T09:43:19.292Z",
          },
          {
            _id: "64216fb7dfa7707e8b724d47",
            pricelist_id: "64216ecefa292ea9161221c7",
            variant_id: "61c9ae5e1f299d954fafa6be",
            __v: 0,
            company_namespace: ["unipaljo"],
            createdAt: "2023-03-27T10:28:07.951Z",
            disabled: false,
            integration_meta: {
              id: "unipaljo_46_010-KEA-JU0003",
            },
            price: 515,
            product_id: "61c9ae5e1f299d954fafa6bc",
            updatedAt: "2025-05-20T14:11:51.738Z",
          },
          {
            _id: "63d7684ecb9883d8222cf51d",
            pricelist_id: "63d76801d720467852c79127",
            variant_id: "61c9ae5e1f299d954fafa6be",
            __v: 0,
            company_namespace: ["unipaljo"],
            createdAt: "2023-01-30T06:48:46.906Z",
            disabled: false,
            integration_meta: {
              id: "unipaljo_45_010-KEA-JU0003",
            },
            price: 955,
            product_id: "61c9ae5e1f299d954fafa6bc",
            updatedAt: "2025-05-20T14:10:49.873Z",
          },
          {
            _id: "63adf96bc1d222b29a2fcf37",
            pricelist_id: "63adf9124520b1023245f7bb",
            variant_id: "61c9ae5e1f299d954fafa6be",
            __v: 0,
            company_namespace: ["unipaljo"],
            createdAt: "2022-12-29T20:32:43.208Z",
            disabled: false,
            integration_meta: {
              id: "unipaljo_37_010-KEA-JU0003",
            },
            price: 1001,
            product_id: "61c9ae5e1f299d954fafa6bc",
            updatedAt: "2025-05-11T07:09:35.164Z",
          },
          {
            _id: "63adf92ec1d222b29a2d5e07",
            pricelist_id: "61c9b01f0d469f136615cd86",
            variant_id: "61c9ae5e1f299d954fafa6be",
            __v: 0,
            company_namespace: ["unipaljo"],
            createdAt: "2022-12-29T20:31:42.856Z",
            disabled: false,
            integration_meta: {
              id: "unipaljo_12_010-KEA-JU0003",
            },
            price: 909,
            product_id: "61c9ae5e1f299d954fafa6bc",
            updatedAt: "2025-05-20T13:54:57.555Z",
          },
          {
            _id: "63a06538c1d222b29aaaa706",
            pricelist_id: "63a0648ac843d331be4d72d3",
            variant_id: "61c9ae5e1f299d954fafa6be",
            __v: 0,
            company_namespace: ["unipaljo"],
            createdAt: "2022-12-19T13:20:56.124Z",
            disabled: false,
            integration_meta: {
              id: "unipaljo_36_010-KEA-JU0003",
            },
            price: 832,
            product_id: "61c9ae5e1f299d954fafa6bc",
            updatedAt: "2025-05-11T07:09:28.190Z",
          },
          {
            _id: "63a06519c1d222b29aa9383a",
            pricelist_id: "63a0648a3277ca7cd3d67a6d",
            variant_id: "61c9ae5e1f299d954fafa6be",
            __v: 0,
            company_namespace: ["unipaljo"],
            createdAt: "2022-12-19T13:20:25.854Z",
            disabled: false,
            integration_meta: {
              id: "unipaljo_35_010-KEA-JU0003",
            },
            price: 832,
            product_id: "61c9ae5e1f299d954fafa6bc",
            updatedAt: "2025-05-11T07:09:23.807Z",
          },
          {
            _id: "63a064f8c1d222b29aa79d4d",
            pricelist_id: "63a0648ac3b2d7ec0616bdbf",
            variant_id: "61c9ae5e1f299d954fafa6be",
            __v: 0,
            company_namespace: ["unipaljo"],
            createdAt: "2022-12-19T13:19:52.915Z",
            disabled: false,
            integration_meta: {
              id: "unipaljo_32_010-KEA-JU0003",
            },
            price: 710,
            product_id: "61c9ae5e1f299d954fafa6bc",
            updatedAt: "2024-05-13T05:55:59.509Z",
          },
          {
            _id: "63a064d2c1d222b29aa5dbd2",
            pricelist_id: "61c9b01f0281e55fe35ee03e",
            variant_id: "61c9ae5e1f299d954fafa6be",
            __v: 0,
            company_namespace: ["unipaljo"],
            createdAt: "2022-12-19T13:19:14.605Z",
            disabled: false,
            integration_meta: {
              id: "unipaljo_11_010-KEA-JU0003",
            },
            price: 985,
            product_id: "61c9ae5e1f299d954fafa6bc",
            updatedAt: "2025-05-11T07:08:49.177Z",
          },
          {
            _id: "63876621c1d222b29abe12a0",
            pricelist_id: "638765a8479737a9e85b737a",
            variant_id: "61c9ae5e1f299d954fafa6be",
            __v: 0,
            company_namespace: ["unipaljo"],
            createdAt: "2022-11-30T14:18:09.095Z",
            disabled: false,
            integration_meta: {
              id: "unipaljo_2_010-KEA-JU0003",
            },
            price: 931,
            product_id: "61c9ae5e1f299d954fafa6bc",
            updatedAt: "2025-05-11T07:08:37.455Z",
          },
        ],
      };

      console.log("\n");
      console.log("sap_unique_UoMs");
      console.log(JSON.stringify(sap_unique_UoMs));

      // Create Price list items
      const priceList_items = {};
      priceLists_withItems[priceList_name].forEach((doc) => {
        console.log(JSON.stringify(doc));
        if (!sap_unique_UoMs[`${doc.PLITEMID}__${doc.PLITEMUNIT}`]) {
          console.log(
            `error => ${doc.PLITEMID}__${doc.PLITEMUNIT} was not found on the Uom`
          );
          failed_docs_report.push({
            method: "create",
            // doc: priceLists_withItems[priceList_name],
            error_message: set_error(
              `Create PL items => PLITEMID: ${doc.PLITEMID}, PLITEMUNIT: ${doc.PLITEMUNIT} was not found on the Uom`
            ),
          });
          result.PL_items.failed++;
          return;
        }
        doc.factor = sap_unique_UoMs[`${doc.PLITEMID}__${doc.PLITEMUNIT}`];
        const key = `${doc.PLITEMID}`;
        if (!priceList_items[key]) {
          priceList_items[key] = doc;
        } else {
          const current_doc = priceList_items[key];
          if (
            current_doc.PLITEMUNIT !=
            repzo_product_default_measureunit[current_doc.PLITEMID]
          ) {
            if (
              doc.PLITEMUNIT ==
              repzo_product_default_measureunit[current_doc.PLITEMID]
            ) {
              priceList_items[key] = doc;
            } else if (current_doc?.factor > doc?.factor) {
              priceList_items[key] = doc;
            }
          }
        }
      });

      console.log("priceList_items");
      console.log(JSON.stringify(priceList_items));

      const priceListItems = Object.values(priceList_items);
      for (let j = 0; j < priceListItems.length; j++) {
        console.log({ j });
        const item = priceListItems[j];
        if (!item.factor && item.factor !== 0) {
          console.error({
            method: "create",
            // doc: priceLists_withItems[priceList_name],
            error_message: set_error(
              `Price List: ${item.PLDID} of Product with PLITEMID: ${item.PLITEMID} does not have Uom`
            ),
          });
          result.PL_items.failed++;
          continue;
        }

        const repzo_product = repzo_products?.data?.find(
          (product) =>
            product?.integration_meta?.id == `${nameSpace}_${item.PLITEMID}`
        );

        if (!repzo_product) {
          console.error({
            method: "create",
            // doc: priceLists_withItems[priceList_name],
            error_message: set_error(
              `Price List: ${item.PLDID} of Product with PLITEMID: ${item.PLITEMID} was not found or disabled`
            ),
          });
          result.PL_items.failed++;
          continue;
        }

        const repzo_product_uoms = repzo_UoMs?.data?.filter(
          (uom) =>
            uom?._id?.toString() == repzo_product?.sv_measureUnit?.toString() ||
            repzo_product.measureunit_family?.includes(uom?._id?.toString())
        );

        const repzo_product_uom = repzo_product_uoms.find(
          (uom) => uom.name == item.PLITEMUNIT
        );

        if (!repzo_product_uom) {
          console.error({
            method: "create",
            // doc: priceLists_withItems[priceList_name],
            error_message: set_error(
              `Price List: ${
                item.PLDID
              } of MeasureUnit with _id: ${repzo_product?.sv_measureUnit?.toString()} was not found or disabled`
            ),
          });
          result.PL_items.failed++;
          continue;
        }

        const price =
          repzo_product_uom && repzo_product_uom?.factor == 1
            ? Math.ceil(item.PLITEMPRICEVALUE * 1000)
            : Math.ceil(
                (item.PLITEMPRICEVALUE * 1000) / repzo_product_uom.factor
              );
        console.log({ price });

        const variant = repzo_product?.variants?.find(
          (variant) =>
            variant?.integration_meta?.id == `${nameSpace}_${item.PLITEMID}`
        );
        if (!variant) {
          // console.log(
          //   `Price List: ${item.PLDID} of Variant with PLITEMID: ${item.PLITEMID} was not found`
          // );
          failed_docs_report.push({
            method: "create",
            // doc: priceLists_withItems[priceList_name],
            error_message: set_error(
              `Price List: ${item.PLDID} of Variant with PLITEMID: ${item.PLITEMID} was not found`
            ),
          });
          result.PL_items.failed++;
          continue;
        }

        const body = {
          integration_meta: {
            id: `${nameSpace}_${item.PLDID}_${item.PLITEMID}`,
          },
          product_id: repzo_product._id,
          variant_id: variant._id,
          pricelist_id: repzo_PriceList._id,
          price: price,
          disabled: false,
        };

        // console.log(data);

        const is_found_in_repzo_db = repzo_price_list_items?.data?.find(
          (item) => item?.integration_meta?.id == body?.integration_meta?.id
        );

        // console.log(`${data.integration_meta?.id} => ${is_found_in_repzo_db ? "create" : "update"}`)

        if (!is_found_in_repzo_db) {
          // Create
          try {
            console.log("CREATE PriceList Item", body);
            // const created_PL_item = await repzo.priceListItem.create(body);
            result.PL_items.created++;
          } catch (e) {
            // console.log("Create PL Item Failed >> ", e?.response?.data, body);
            failed_docs_report.push({
              method: "create",
              // doc: body,
              error_message: set_error(e),
            });
            result.PL_items.failed++;
          }
        } else {
          if (
            is_found_in_repzo_db.price == body.price &&
            !is_found_in_repzo_db.disabled
          ) {
            console.log("NO UPDATE");
            continue;
          }
          // Update
          try {
            console.log(
              "UPDATE PriceList Item",
              is_found_in_repzo_db._id,
              body
            );
            // const updated_PL_item = await repzo.priceListItem.update(
            //   is_found_in_repzo_db._id,
            //   body
            // );
            result.PL_items.updated++;
          } catch (e) {
            // console.log(
            //   "Update Price List Item Failed >> ",
            //   e?.response?.data,
            //   body
            // );
            failed_docs_report.push({
              method: "update",
              doc_id: is_found_in_repzo_db?._id,
              doc: body,
              error_message: set_error(e),
            });
            result.PL_items.failed++;
          }
        }
      }
    }

    // console.log(result);

    // await update_bench_time(
    //   repzo,
    //   commandEvent.app._id,
    //   bench_time_key,
    //   new_bench_time
    // );
    // await commandLog
    //   .setStatus(
    //     "success",
    //     failed_docs_report.length ? failed_docs_report : null
    //   )
    //   .setBody(result)
    //   .commit();

    console.log(JSON.stringify(failed_docs_report));

    console.log(JSON.stringify(result));
    return result;
  } catch (e) {
    //@ts-ignore
    console.error(e?.response?.data || e);
    // await commandLog.setStatus("fail", e).commit();
    throw e;
  }
};

sync_price_list();
