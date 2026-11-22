import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  const authStub = { token: signal<string | null>('jwt-test'), logout: vi.fn() };
  const routerStub = { navigateByUrl: vi.fn().mockResolvedValue(true) };

  beforeEach(() => {
    authStub.token.set('jwt-test');
    authStub.logout.mockClear();
    routerStub.navigateByUrl.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authStub },
        { provide: Router, useValue: routerStub },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('gắn Bearer token cho API riêng tư', () => {
    http.get('/api/users/me').subscribe();
    const req = httpMock.expectOne('/api/users/me');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-test');
    req.flush({});
  });

  it.each(['/api/auth/login', '/api/auth/register', '/api/auth/forgot-password', '/api/auth/reset-password'])(
    'không gắn token cho API công khai %s',
    (path) => {
      http.post(path, {}).subscribe();
      const req = httpMock.expectOne(path);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    },
  );

  it('không gắn token vào GET phòng công khai', () => {
    http.get('/api/public/rooms?sort=newest').subscribe();
    const req = httpMock.expectOne('/api/public/rooms?sort=newest');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });

  it('không tiết lộ Bearer token tới URL bên ngoài', () => {
    http.get('https://example.com/status').subscribe();
    const req = httpMock.expectOne('https://example.com/status');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('401 trên API riêng tư xóa phiên và chuyển về Login', () => {
    http.get('/api/users/me').subscribe({ error: () => undefined });
    httpMock.expectOne('/api/users/me').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(authStub.logout).toHaveBeenCalledOnce();
    expect(routerStub.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('503 từ Auth Service không tự xóa phiên người dùng', () => {
    http.get('/api/users/me').subscribe({ error: () => undefined });
    httpMock.expectOne('/api/users/me').flush({}, { status: 503, statusText: 'Unavailable' });
    expect(authStub.logout).not.toHaveBeenCalled();
    expect(routerStub.navigateByUrl).not.toHaveBeenCalled();
  });

  it('không gắn header khi không có token', () => {
    authStub.token.set(null);
    http.get('/api/users/me').subscribe();
    const req = httpMock.expectOne('/api/users/me');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });
});
