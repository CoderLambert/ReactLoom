export interface InvoiceInput { unitPrice: string; quantity: string; taxPercent: string }
export interface InvoiceResult { subtotal: string; tax: string; total: string }
export interface RoundingContrast { halfUp: string; halfEven: string; extendedLine: string; roundedEachUnit: string }
export declare function calculateInvoice(input: InvoiceInput): InvoiceResult;
export declare function roundingContrast(): RoundingContrast;
