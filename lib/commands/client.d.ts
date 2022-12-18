import { CommandEvent, Result } from "../types";
export interface SAPClient {
  CLIENTID: string;
  CLIENTDESC: string;
  CLIENTADDRESS?: string;
  CLIENTCITY?: string;
  CLIENTCOUNTRY?: string;
  CLIENTCOUNTY?: string;
  CLIENTGROUPCODE: number;
  CLIENTGROUP: string;
  PAYMENTTERM: number;
  CLIENTCONTACTPERSON?: string;
  CLIENTPHONE1?: string;
  CLIENTPHONE2?: string;
  CLIENTNOTE?: string;
  CLIENTSTATUS: "N" | "Y";
  CLIENTCREDITCONSUMED: number;
  CLIENTMAXCHEQUEVALUE: number;
  CLIENTCREDITLIMIT: number;
  CLIENTPRICELISTID: number;
  CLIENTADDRESSID?: string;
  CLIENTDESCF?: string;
  SALESPERSONCODE: number;
  DISCOUNTPERCENT: number;
  ACTIVE: "N" | "Y";
  FROZEN: "N" | "Y";
  TERRITORYID?: string;
  TERRITORYNAME?: string;
  CREATEDATE: string;
  UPDATEDATE: string;
  PARENTCODE?: string;
}
export interface SAPClients {
  result: "Success";
  Customers: SAPClient[];
}
export declare const sync_client: (
  commandEvent: CommandEvent
) => Promise<Result>;
