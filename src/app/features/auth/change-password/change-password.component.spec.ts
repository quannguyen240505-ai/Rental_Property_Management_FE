import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthService } from "../../../core/auth/auth.service";
import { ChangePasswordComponent } from "./change-password.component";

describe("ChangePasswordComponent (component logic)", () => {
  let component: ChangePasswordComponent;
  let httpMock: HttpTestingController;
  const authStub = { logout: vi.fn() };

  beforeEach(() => {
    authStub.logout.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authStub },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    component = TestBed.runInInjectionContext(
      () => new ChangePasswordComponent(),
    );
  });

  afterEach(() => httpMock.verify());

  it("không có mật khẩu hiện tại thì không gửi API", () => {
    component.submit("", "Password12345", "Password12345");
    expect(component.currentError()).toBeTruthy();
    httpMock.expectNone("/api/auth/change-password");
  });

  it("không cho dùng lại mật khẩu cũ", () => {
    component.submit("Password12345", "Password12345", "Password12345");
    expect(component.nextError()).toContain("khác");
    httpMock.expectNone("/api/auth/change-password");
  });

  it("đổi mật khẩu thành công, xóa phiên đăng nhập", () => {
    component.submit("PasswordOld123", "PasswordNew123", "PasswordNew123");
    const request = httpMock.expectOne("/api/auth/change-password");
    expect(request.request.method).toBe("POST");
    expect(request.request.body).toEqual({
      currentPassword: "PasswordOld123",
      newPassword: "PasswordNew123",
    });
    request.flush({ message: "Password changed" });
    expect(authStub.logout).toHaveBeenCalledOnce();
    expect(component.success()).toBe(true);
  });

  it("mật khẩu hiện tại sai hiển thị lỗi và không đăng xuất", () => {
    component.submit("WrongOld123", "PasswordNew123", "PasswordNew123");
    httpMock
      .expectOne("/api/auth/change-password")
      .flush({}, { status: 400, statusText: "Bad Request" });
    expect(component.serverError()).toContain("không đúng");
    expect(authStub.logout).not.toHaveBeenCalled();
  });
});
