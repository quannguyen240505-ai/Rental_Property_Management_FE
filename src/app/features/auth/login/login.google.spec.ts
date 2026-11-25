import { HttpErrorResponse } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { of, Subject, throwError } from "rxjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthService, LoginResponse } from "../../../core/auth/auth.service";
import { LoginComponent } from "./login.component";

const response: LoginResponse = {
  accessToken: "rental-jwt",
  tokenType: "Bearer",
  expiresAt: "2099-01-01T00:00:00Z",
  role: "CUSTOMER",
  userId: "11111111-1111-1111-1111-111111111111",
};

describe("LoginComponent - Google Sign-In", () => {
  const login = vi.fn();
  const googleLogin = vi.fn();
  const navigateByUrl = vi.fn().mockResolvedValue(true);
  let component: LoginComponent;

  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({ matches: true }),
    });

    login.mockReset();
    googleLogin.mockReset();
    navigateByUrl.mockClear();

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { login, googleLogin } },
        { provide: Router, useValue: { navigateByUrl } },
      ],
    });
    component = TestBed.runInInjectionContext(() => new LoginComponent());
  });

  afterEach(() => TestBed.resetTestingModule());

  it("Google CUSTOMER dang nhap thanh cong va chuyen den /profile", () => {
    googleLogin.mockReturnValue(of(response));

    component.handleGoogleCredential("valid-google-id-token");

    expect(googleLogin).toHaveBeenCalledExactlyOnceWith(
      "valid-google-id-token",
    );
    expect(navigateByUrl).toHaveBeenCalledWith("/profile", {
      replaceUrl: true,
    });
    expect(component.loading()).toBe(false);
    expect(component.error()).toBe("");
  });

  it("Google account lien ket OWNER giu dung role va ve /owner", () => {
    googleLogin.mockReturnValue(of({ ...response, role: "OWNER" }));

    component.handleGoogleCredential("linked-owner-google-token");

    expect(navigateByUrl).toHaveBeenCalledWith("/owner", {
      replaceUrl: true,
    });
  });

  it("409 ACCOUNT_LINK_REQUIRED huong dan dang nhap mat khau de lien ket", () => {
    googleLogin.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            statusText: "Conflict",
            error: { code: "ACCOUNT_LINK_REQUIRED" },
          }),
      ),
    );

    component.handleGoogleCredential("existing-email-google-token");

    expect(component.error()).toContain("liên kết Google");
    expect(component.loading()).toBe(false);
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it("401 voi Google ID Token sai bao loi va khong chuyen trang", () => {
    googleLogin.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: "Unauthorized",
            error: { code: "INVALID_GOOGLE_TOKEN" },
          }),
      ),
    );

    component.handleGoogleCredential("invalid-google-id-token");

    expect(component.error()).toContain("không hợp lệ");
    expect(component.loading()).toBe(false);
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it("503 Auth Service chua co Google Client ID hien thong bao phu hop", () => {
    googleLogin.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 503,
            statusText: "Unavailable",
            error: { code: "GOOGLE_LOGIN_NOT_CONFIGURED" },
          }),
      ),
    );

    component.handleGoogleCredential("google-id-token");

    expect(component.error()).toContain("chưa sẵn sàng");
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it("khong gui yeu cau Google Login trung khi request dang xu ly", () => {
    const pending = new Subject<LoginResponse>();
    googleLogin.mockReturnValue(pending.asObservable());

    component.handleGoogleCredential("first-google-id-token");
    component.handleGoogleCredential("second-google-id-token");

    expect(googleLogin).toHaveBeenCalledTimes(1);
    expect(component.loading()).toBe(true);

    pending.next(response);
    pending.complete();

    expect(component.loading()).toBe(false);
    expect(navigateByUrl).toHaveBeenCalledOnce();
  });

  it("Google SDK ready chi xoa loi tai SDK, khong xoa loi lien ket", () => {
    component.error.set("Không thể tải đăng nhập Google. Vui lòng thử lại.");
    component.onGoogleReady();
    expect(component.error()).toBe("");

    component.error.set("Email đã có tài khoản. Hãy liên kết Google.");
    component.onGoogleReady();
    expect(component.error()).toContain("liên kết Google");
  });
});
