import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AuthService, LoginResponse } from "./auth.service";

const loginResponse: LoginResponse = {
  accessToken: "jwt-for-unit-test",
  tokenType: "Bearer",
  expiresAt: "2099-01-01T00:00:00Z",
  role: "OWNER",
  userId: "11111111-1111-1111-1111-111111111111",
};

describe("AuthService", () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
    sessionStorage.clear();
    localStorage.clear();
  });

  it("chưa có phiên đăng nhập sẽ không được xác thực", () => {
    const auth = TestBed.inject(AuthService);
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.token()).toBeNull();
  });

  it("đăng nhập gửi đúng payload và lưu token, role, expiresAt", () => {
    const auth = TestBed.inject(AuthService);
    let response: LoginResponse | undefined;
    auth.login("owner", "secret12345").subscribe((value) => (response = value));

    const request = httpMock.expectOne("/api/auth/login");
    expect(request.request.method).toBe("POST");
    expect(request.request.body).toEqual({
      username: "owner",
      password: "secret12345",
    });
    request.flush(loginResponse);

    expect(response).toEqual(loginResponse);
    expect(sessionStorage.getItem("accessToken")).toBe(
      loginResponse.accessToken,
    );
    expect(sessionStorage.getItem("role")).toBe("OWNER");
    expect(sessionStorage.getItem("expiresAt")).toBe(loginResponse.expiresAt);
    expect(auth.isAuthenticated()).toBe(true);
  });

  it("phục hồi phiên hợp lệ từ sessionStorage sau khi tải lại trang", () => {
    sessionStorage.setItem("accessToken", "restored-token");
    sessionStorage.setItem("role", "CUSTOMER");
    sessionStorage.setItem("expiresAt", "2099-01-01T00:00:00Z");

    const auth = TestBed.inject(AuthService);
    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.role()).toBe("CUSTOMER");
  });

  it("tự xóa phiên khi JWT hết hạn hoặc expiresAt sai định dạng", () => {
    sessionStorage.setItem("accessToken", "expired-token");
    sessionStorage.setItem("role", "OWNER");
    sessionStorage.setItem("expiresAt", "2020-01-01T00:00:00Z");

    const auth = TestBed.inject(AuthService);
    expect(auth.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem("accessToken")).toBeNull();
    expect(auth.role()).toBeNull();
  });

  it("logout xóa token và role khỏi cả hai vùng lưu trữ", () => {
    const auth = TestBed.inject(AuthService);
    sessionStorage.setItem("accessToken", "abc");
    sessionStorage.setItem("role", "OWNER");
    localStorage.setItem("accessToken", "old");
    localStorage.setItem("role", "old-role");
    auth.logout();

    expect(sessionStorage.getItem("accessToken")).toBeNull();
    expect(sessionStorage.getItem("role")).toBeNull();
    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("role")).toBeNull();
    expect(auth.token()).toBeNull();
  });

  it("logoutFromServer gọi đúng API, không tự xóa phiên trước khi phản hồi", () => {
    const auth = TestBed.inject(AuthService);
    let completed = false;
    auth.logoutFromServer().subscribe(() => (completed = true));

    const request = httpMock.expectOne("/api/auth/logout");
    expect(request.request.method).toBe("POST");
    expect(request.request.body).toEqual({});
    request.flush(null);
    expect(completed).toBe(true);
  });
});
