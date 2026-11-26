import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

export interface DepositReceipt {
  id: string;
  receiptReference: string;
  receiptCode: string;
  holdId: string;
  propertyId: string;
  roomId: string;
  customerId: string;
  amount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER';
  status: string;
}
export interface RentalEligibility {
  receiptId: string;
  receiptReference: string;
  holdId: string;
  propertyId: string;
  roomId: string;
  customerId: string;
  amount: number;
  status: string;
  verified: boolean;
  eligible: boolean;
  reason: string | null;
}
export interface CreateReceipt {
  holdId: string;
  amount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER';
  evidenceUrl: string | null;
}
@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);
  create(body: CreateReceipt) {
    return this.http.post<DepositReceipt>('/api/deposit-receipts', body);
  }
  verify(id: string) {
    return this.http.post<DepositReceipt>(`/api/deposit-receipts/${encodeURIComponent(id)}/verify`, {});
  }
  eligibility(id: string) {
    return this.http.get<RentalEligibility>(`/api/deposit-receipts/${encodeURIComponent(id)}/rental-eligibility`);
  }
}
