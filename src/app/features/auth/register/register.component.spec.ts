import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { RegisterComponent } from './register.component';

describe('RegisterComponent (component logic)', () => {
  let component: RegisterComponent;
  let httpMock: HttpTestingController;
  const validData = ['Nguyen Van A', 'customer_test', 'a@example.com', '0912345678', 'Password12345', 'Password12345'] as const;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    httpMock = TestBed.inject(HttpTestingController);
    component = TestBed.runInInjectionContext(() => new RegisterComponent());
  });

  afterEach(() => httpMock.verify());

  it('submit trống hiển thị lỗi theo trường và không gọi Backend', () => {
    component.submit('', '', '', '', '', '');
    expect(component.fieldErrors().phone).toBeTruthy();
    expect(component.fieldErrors().username).toBeTruthy();
    expect(component.fieldErrors().password).toBeTruthy();
    httpMock.expectNone('/api/auth/register');
  });

  it('số điện thoại thiếu hoặc không đủ 10 số đều bị từ chối', () => {
    component.submit(validData[0], validData[1], validData[2], '', validData[4], validData[5]);
    expect(component.fieldErrors().phone).toBeTruthy();
    component.submit(validData[0], validData[1], validData[2], '091234567', validData[4], validData[5]);
    expect(component.fieldErrors().phone).toContain('10 chữ số');
    httpMock.expectNone('/api/auth/register');
  });

  it('mật khẩu và xác nhận không khớp sẽ không gọi API', () => {
    component.submit(validData[0], validData[1], validData[2], validData[3], validData[4], 'NotMatching123');
    expect(component.fieldErrors().confirmPassword).toBeTruthy();
    httpMock.expectNone('/api/auth/register');
  });

  it('gửi đúng payload CUSTOMER và nhận HTTP 201', () => {
    component.submit(...validData);
    const request = httpMock.expectOne('/api/auth/register');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      fullName: 'Nguyen Van A', username: 'customer_test', email: 'a@example.com',
      phone: '0912345678', password: 'Password12345',
    });
    // Không có field role; chỉ Backend cấp CUSTOMER.
    expect(request.request.body.role).toBeUndefined();
    request.flush({ id: 'user-id', username: 'customer_test', fullName: 'Nguyen Van A', role: 'CUSTOMER' },
      { status: 201, statusText: 'Created' });
    expect(component.success()).toBe(true);
    expect(component.submittedUsername()).toBe('customer_test');
  });

  it('409 từ Backend hiển thị lỗi trùng username/email', () => {
    component.submit(...validData);
    httpMock.expectOne('/api/auth/register').flush({}, { status: 409, statusText: 'Conflict' });
    expect(component.serverError()).toContain('đã được sử dụng');
    expect(component.success()).toBe(false);
  });
});
