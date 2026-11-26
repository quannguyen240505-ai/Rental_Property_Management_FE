export type UtilityType = 'ELECTRICITY' | 'WATER';
export type LineType = 'RENT' | 'ELECTRICITY' | 'WATER' | 'SERVICE_FEE' | 'OTHER';
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export interface MeterReadingRequest {
  propertyId: string; roomId: string; billingPeriod: string; utilityType: UtilityType;
  previousReading: number; currentReading: number; meterReplaced: boolean;
  meterReplacementReason: string | null; evidenceUrl: string | null;
}
export interface MeterReading extends MeterReadingRequest {
  id: string; consumption: number; recordedBy: string; recordedAt: string;
}
export interface InvoiceLineRequest {
  lineType: LineType; description: string; quantity: number; unitPrice: number;
}
export interface InvoiceLine extends InvoiceLineRequest { id: string; amount: number; }
export interface InvoiceRequest {
  propertyId: string; roomId: string; contractId: string; tenantUserId: string;
  billingPeriod: string; dueDate: string; lines: InvoiceLineRequest[];
}
export interface Invoice extends Omit<InvoiceRequest, 'lines'> {
  id: string; status: InvoiceStatus; issueDate: string | null;
  totalAmount: number; paidAmount: number; outstandingAmount: number;
  createdBy: string; createdAt: string; lines: InvoiceLine[];
}
