import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { authInterceptor } from '../../core/auth/auth.interceptor';
import { PaymentService } from './payment.service';
import { paymentGuard } from './payment.guard';
import { DepositReceiptsComponent } from './deposit-receipts.component';
import { of } from 'rxjs';
import { vi } from 'vitest';

describe('Payment integration', () => {
  const auth = {token: signal<string | null>('owner-jwt'), role: signal<string | null>('OWNER'), isAuthenticated: () => true};
  let http: HttpTestingController;
  let api: PaymentService;
  beforeEach(() => {
    TestBed.configureTestingModule({providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(), {provide: AuthService, useValue: auth}]});
    http = TestBed.inject(HttpTestingController); api = TestBed.inject(PaymentService);
  });
  afterEach(() => http.verify());
  it('sends authenticated create to Payment without client identity fields', () => {
    const body = {holdId: 'hold', amount: 1000000, paymentMethod: 'CASH' as const, evidenceUrl: null};
    api.create(body).subscribe();
    const req = http.expectOne('/api/deposit-receipts');
    expect(req.request.headers.get('Authorization')).toBe('Bearer owner-jwt');
    expect(req.request.body).toEqual(body);
    req.flush({id: 'receipt'});
  });
  it('verifies the selected receipt using POST', () => {
    api.verify('receipt').subscribe();
    const req = http.expectOne('/api/deposit-receipts/receipt/verify');
    expect(req.request.method).toBe('POST'); req.flush({status: 'OWNER_VERIFIED'});
  });
  it('reads current eligibility using GET', () => {
    api.eligibility('receipt').subscribe();
    const req = http.expectOne('/api/deposit-receipts/receipt/rental-eligibility');
    expect(req.request.method).toBe('GET'); req.flush({verified: false});
  });
});
describe('Payment guard', () => {
  it.each(['OWNER', 'STAFF', 'CUSTOMER', 'TENANT', null])('checks role %s', role => {
    TestBed.configureTestingModule({providers: [provideRouter([]), {provide: AuthService, useValue: {isAuthenticated: () => role !== null, role: () => role}}]});
    const result = TestBed.runInInjectionContext(() => paymentGuard({} as never, {} as never));
    if (role === 'OWNER' || role === 'STAFF') expect(result).toBe(true);
    else expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe(role === null ? '/login' : '/profile');
  });
});
describe('Payment form', () => {
  it('rejects invalid amount before sending a collection', () => {
    const api = {create: vi.fn()};
    TestBed.configureTestingModule({providers: [provideRouter([]), {provide: AuthService, useValue: {role: () => 'OWNER'}}, {provide: PaymentService, useValue: api}]});
    const fixture = TestBed.createComponent(DepositReceiptsComponent);
    fixture.componentInstance.holdId = '87c15f41-ffe7-4bb3-93be-69849668731e';
    fixture.componentInstance.amount = 1.5;
    fixture.componentInstance.create();
    expect(api.create).not.toHaveBeenCalled();
    expect(fixture.componentInstance.error()).toContain('số tiền nguyên');
  });
  it('requires explicit OWNER confirmation before verification', () => {
    const api = {verify: vi.fn().mockReturnValue(of({id: 'r', status: 'OWNER_VERIFIED'})), eligibility: vi.fn().mockReturnValue(of({status: 'REPORTED', amount: 1000000}))};
    TestBed.configureTestingModule({providers: [provideRouter([]), {provide: AuthService, useValue: {role: () => 'OWNER'}}, {provide: PaymentService, useValue: api}]});
    const component = TestBed.createComponent(DepositReceiptsComponent).componentInstance;
    component.receiptId = '9ba89ae0-8159-4726-92b0-aa97377252bf';
    component.verify(); expect(api.verify).not.toHaveBeenCalled();
    component.requestVerification(); component.verify();
    expect(api.verify).toHaveBeenCalledOnce();
  });
});
