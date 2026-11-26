import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthService } from "./auth.service";
import { authInterceptor } from "./auth.interceptor";

describe("authInterceptor - Google Login & Account Linking", () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  const authStub = {
    token: signal<string | null>("rental-jwt"),
    expireSession: vi.fn(),
  };

  beforeEach(() => {
    authStub.token.set("rental-jwt");
    authStub.expireSession.mockReset();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authStub },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it("Google Login la endpoint public, khong gui Bearer token cu", () => {
    http.post("/api/auth/google", { idToken: "google-id-token" }).subscribe();

    const req = httpMock.expectOne("/api/auth/google");
    expect(req.request.headers.has("Authorization")).toBe(false);
    req.flush({});
  });

  it("Google Account Linking la endpoint private, bat buoc gui JWT Rental", () => {
    http
      .post("/api/auth/google/link", { idToken: "google-id-token" })
      .subscribe();

    const req = httpMock.expectOne("/api/auth/google/link");
    expect(req.request.headers.get("Authorization")).toBe("Bearer rental-jwt");
    req.flush({ message: "Google account linked successfully" });
  });

  it("401 cua public Google Login khong lam het han phien cu", () => {
    http.post("/api/auth/google", {}).subscribe({ error: () => undefined });

    httpMock
      .expectOne("/api/auth/google")
      .flush(
        { code: "INVALID_GOOGLE_TOKEN" },
        { status: 401, statusText: "Unauthorized" },
      );

    expect(authStub.expireSession).not.toHaveBeenCalled();
  });

  it("401 cua Google Linking het han phien neu JWT hien tai khong hop le", () => {
    http
      .post("/api/auth/google/link", {})
      .subscribe({ error: () => undefined });

    httpMock
      .expectOne("/api/auth/google/link")
      .flush({}, { status: 401, statusText: "Unauthorized" });

    expect(authStub.expireSession).toHaveBeenCalledOnce();
  });

  it("409 cua Google Linking khong ket thuc phien Rental", () => {
    http
      .post("/api/auth/google/link", {})
      .subscribe({ error: () => undefined });

    httpMock
      .expectOne("/api/auth/google/link")
      .flush(
        { code: "GOOGLE_EMAIL_MISMATCH" },
        { status: 409, statusText: "Conflict" },
      );

    expect(authStub.expireSession).not.toHaveBeenCalled();
  });
});
