import { CommandEvent, Result } from "../types";
export interface SAPProduct {
  ITEMBARCODE: string;
  ITEMDESC: string;
  ITEMAVALIABLEQTY: number;
  ITEMTAX: number;
  ITEMTAXCODE: string;
  ITEMCODE: string;
  Division: string;
  "Parent Category": string;
  "Sub-Category": string;
  "Item Type": string;
  DEFAULTITEMUOM: string;
  DEFAULTSALEUOMID: number;
  INVUOMID: number;
  ITEMSALESUOMS: string;
  ITEMQTY: number;
  ITEMGROUPCODE: number;
  PRICE: number;
  ISSERIAL: "Y" | "N";
  ITEMDESCF: string;
  UOMGROUPENTRY: number;
  MILCODE: string;
  MODELNO: string;
  BRAND: string;
  ITEMSUBCATEGORY: string;
  CREATEDATE: string;
  UPDATEDATE: string;
}
export interface SAPProducts {
  result: "Success";
  Items: SAPProduct[];
}
export declare const sync_product: (commandEvent: CommandEvent) => Promise<
  Result & {
    repzo_total_taxes: number;
    repzo_total_categories: number;
    repzo_total_brands: number;
  }
>;
