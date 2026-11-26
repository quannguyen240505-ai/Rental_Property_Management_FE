import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AuthService, LoginResponse } from "./auth.service";

const googleResponse: LoginResponse = {
  accessToken: "rental-jwt-from-google-login",
  tokenType: "Bearer",
  expiresAt: "2099-01-01T00:00:00Z",
  role: "CUSTOMER",
  userId: "11111111-1111-1111-1111-111111111111",
};

describe("AuthService - Google Login & Account Linking", () => {
  let auth: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
    auth = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
    sessionStorage.clear();
    localStorage.clear();
  });

  it("POST /api/auth/google gui Google ID Token, luu JWT noi bo khi thanh cong", () => {
    let result: LoginResponse | undefined;
    auth.googleLogin("mock-google-id-token").subscribe((value) => {
      result = value;
    });

    const req = httpMock.expectOne("/api/auth/google");
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({ idToken: "mock-google-id-token" });
    req.flush(googleResponse);

    expect(result).toEqual(googleResponse);
    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.token()).toBe(googleResponse.accessToken);
    expect(auth.role()).toBe("CUSTOMER");
    expect(sessionStorage.getItem("accessToken")).toBe(
      googleResponse.accessToken,
    );
    expect(sessionStorage.getItem("role")).toBe("CUSTOMER");
    expect(sessionStorage.getItem("expiresAt")).toBe(googleResponse.expiresAt);
  });

  it("Google Login su dung role BE tra ve, khong ep thanh CUSTOMER", () => {
    localStorage.setItem("accessToken", "legacy-token");
    localStorage.setItem("role", "CUSTOMER");

    auth.googleLogin("existing-linked-google-token").subscribe();
    httpMock.expectOne("/api/auth/google").flush({
      ...googleResponse,
      role: "OWNER",
    });

    expect(auth.role()).toBe("OWNER");
    expect(sessionStorage.getItem("role")).toBe("OWNER");
    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("role")).toBeNull();
  });

  it.each([
    { status: 401, code: "INVALID_GOOGLE_TOKEN" },
    { status: 409, code: "ACCOUNT_LINK_REQUIRED" },
    { status: 503, code: "GOOGLE_LOGIN_NOT_CONFIGURED" },
  ])("Google Login loi $status / $code khong luu JWT", ({ status, code }) => {
    let receivedStatus: number | undefined;
    let receivedCode: string | undefined;

    auth.googleLogin("rejected-google-token").subscribe({
      error: (error) => {
        receivedStatus = error.status;
        receivedCode = error.error?.code;
      },
    });
    httpMock
      .expectOne("/api/auth/google")
      .flush(
        { code, message: "Google login failed" },
        { status, statusText: "Google Login Error" },
      );

    expect(receivedStatus).toBe(status);
    expect(receivedCode).toBe(code);
    expect(auth.token()).toBeNull();
    expect(auth.role()).toBeNull();
    expect(sessionStorage.getItem("accessToken")).toBeNull();
  });

  it("POST /api/auth/google/link gui Google ID Token va giu nguyen phien Rental", () => {
    auth.login("owner", "Password12345").subscribe();
    httpMock.expectOne("/api/auth/login").flush({
      ...googleResponse,
      role: "OWNER",
      accessToken: "rental-owner-jwt",
    });

    let responseMessage: string | undefined;
    auth.linkGoogle("link-this-google-credential").subscribe((value) => {
      responseMessage = value.message;
    });
    const req = httpMock.expectOne("/api/auth/google/link");
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({
      idToken: "link-this-google-credential",
    });
    req.flush({ message: "Google account linked successfully" });

    expect(responseMessage).toBe("Google account linked successfully");
    expect(auth.token()).toBe("rental-owner-jwt");
    expect(auth.role()).toBe("OWNER");
  });

  it("Lien ket that bai khong tu dong xoa phien dang nhap Rental", () => {
    auth.login("staff", "Password12345").subscribe();
    httpMock.expectOne("/api/auth/login").flush({
      ...googleResponse,
      role: "STAFF",
      accessToken: "rental-staff-jwt",
    });

    let receivedCode: string | undefined;
    auth.linkGoogle("wrong-email-google-token").subscribe({
      error: (error) => {
        receivedCode = error.error?.code;
      },
    });
    httpMock
      .expectOne("/api/auth/google/link")
      .flush(
        { code: "GOOGLE_EMAIL_MISMATCH" },
        { status: 409, statusText: "Conflict" },
      );

    expect(receivedCode).toBe("GOOGLE_EMAIL_MISMATCH");
    expect(auth.token()).toBe("rental-staff-jwt");
    expect(auth.role()).toBe("STAFF");
  });
});
