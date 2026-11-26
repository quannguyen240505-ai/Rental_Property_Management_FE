import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Invoice, InvoiceRequest, MeterReading, MeterReadingRequest } from './billing.models';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly http = inject(HttpClient);
  createReading(body: MeterReadingRequest) {
    return this.http.post<MeterReading>('/api/meter-readings', body);
  }
  readings(roomId: string, period: string) {
    return this.http.get<MeterReading[]>('/api/meter-readings', { params: { roomId, period } });
  }
  createInvoice(body: InvoiceRequest) {
    return this.http.post<Invoice>('/api/invoices', body);
  }
  invoice(id: string) {
    return this.http.get<Invoice>(`/api/invoices/${encodeURIComponent(id)}`);
  }
  issue(id: string) {
    return this.http.post<Invoice>(`/api/invoices/${encodeURIComponent(id)}/issue`, {});
  }
}
