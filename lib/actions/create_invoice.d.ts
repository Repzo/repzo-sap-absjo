import { EVENT, Config } from "../types";
interface SAPOpenInvoice {
    CustomerNumber: string;
    FatherCode: string;
    DocDate: string;
    DocDueDate: string;
    InvoiceID: number;
    InvoiceNumber: string;
    InvoiceClientID: string;
    InvoiceFinalAmount: number;
    InvoiceRemainingAmount: number;
    InvoiceStatus: string;
}
export declare const create_invoice: (event: EVENT, options: Config) => Promise<any>;
export declare const get_invoice_from_sap: (serviceEndPoint: string, query?: {
    updatedAt: string;
    Status: string;
    InvoiceId: string;
} | undefined) => Promise<SAPOpenInvoice[]>;
export {};
