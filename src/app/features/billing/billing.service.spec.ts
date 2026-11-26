import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BillingService } from './billing.service';
import { InvoiceRequest, MeterReadingRequest } from './billing.models';

describe('BillingService', () => {
  let api: BillingService;
  let http: HttpTestingController;
  const id = '11111111-1111-4111-8111-111111111111';
  beforeEach(() => { TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting()]}); api=TestBed.inject(BillingService);http=TestBed.inject(HttpTestingController); });
  afterEach(() => http.verify());
  it('creates a reading using exact backend DTO', () => {
    const body: MeterReadingRequest={propertyId:id,roomId:id,billingPeriod:'2026-11',utilityType:'WATER',previousReading:10,currentReading:15,meterReplaced:false,meterReplacementReason:null,evidenceUrl:null};
    api.createReading(body).subscribe(); const req=http.expectOne('/api/meter-readings'); expect(req.request.method).toBe('POST');expect(req.request.body).toEqual(body);req.flush({});
  });
  it('queries by roomId and period', () => {
    api.readings(id,'2026-11').subscribe();const req=http.expectOne(r=>r.url==='/api/meter-readings');expect(req.request.method).toBe('GET');expect(req.request.params.get('roomId')).toBe(id);expect(req.request.params.get('period')).toBe('2026-11');req.flush([]);
  });
  it('creates a draft with invoice lines', () => {
    const body: InvoiceRequest={propertyId:id,roomId:id,contractId:id,tenantUserId:id,billingPeriod:'2026-11',dueDate:'2026-12-10',lines:[{lineType:'RENT',description:'Rent',quantity:1,unitPrice:1000000}]};
    api.createInvoice(body).subscribe();const req=http.expectOne('/api/invoices');expect(req.request.method).toBe('POST');expect(req.request.body).toEqual(body);req.flush({});
  });
  it('looks up by invoice ID', () => {api.invoice(id).subscribe();const req=http.expectOne(`/api/invoices/${id}`);expect(req.request.method).toBe('GET');req.flush({});});
  it('issues by invoice ID', () => {api.issue(id).subscribe();const req=http.expectOne(`/api/invoices/${id}/issue`);expect(req.request.method).toBe('POST');req.flush({});});
});
