import { HttpErrorResponse } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { of, throwError } from "rxjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthService } from "../../../core/auth/auth.service";
import { LoginComponent } from "./login.component";

describe("LoginComponent (component logic)", () => {
  const login = vi.fn();
  const navigateByUrl = vi.fn().mockResolvedValue(true);
  let component: LoginComponent;

  beforeEach(() => {
    // Không kích hoạt chu kỳ đổi slide trong Unit Test.
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({ matches: true }),
    });
    login.mockReset();
    navigateByUrl.mockClear();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { login } },
        { provide: Router, useValue: { navigateByUrl } },
      ],
    });
    component = TestBed.runInInjectionContext(() => new LoginComponent());
  });

  afterEach(() => TestBed.resetTestingModule());

  it("bỏ trống username/password phải báo lỗi mà không gọi API", () => {
    component.submit("   ", "");
    expect(component.usernameRequired()).toBe(true);
    expect(component.passwordRequired()).toBe(true);
    expect(login).not.toHaveBeenCalled();
  });

  it("đăng nhập OWNER thành công chuyển tới /owner, thay entry history", () => {
    login.mockReturnValue(of({ role: "OWNER" }));
    component.submit(" owner ", "Password12345");
    expect(login).toHaveBeenCalledWith("owner", "Password12345");
    expect(navigateByUrl).toHaveBeenCalledWith("/owner", { replaceUrl: true });
    expect(component.loading()).toBe(false);
  });

  it("CUSTOMER đăng nhập thành công chuyển tới /profile", () => {
    login.mockReturnValue(of({ role: "CUSTOMER" }));
    component.submit("customer", "Password12345");
    expect(navigateByUrl).toHaveBeenCalledWith("/profile", {
      replaceUrl: true,
    });
  });

  it("401 hiển thị lỗi thông tin đăng nhập mà không chuyển trang", () => {
    login.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({ status: 401, statusText: "Unauthorized" }),
      ),
    );
    component.submit("owner", "wrong-password");
    expect(component.error()).toContain("không chính xác");
    expect(component.loading()).toBe(false);
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it("503 hiển thị lỗi Auth Service tạm gián đoạn", () => {
    login.mockReturnValue(
      throwError(
        () => new HttpErrorResponse({ status: 503, statusText: "Unavailable" }),
      ),
    );
    component.submit("owner", "Password12345");
    expect(component.error()).toContain("gián đoạn");
  });

  it("nút hiện mật khẩu và lựa chọn highlight cập nhật signal", () => {
    component.togglePassword();
    expect(component.showPassword()).toBe(true);
    component.selectHighlight(2);
    expect(component.activeHighlight()).toBe(2);
  });
});
