import { Location } from "@angular/common";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { ActivatedRoute, convertToParamMap } from "@angular/router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ResetPasswordComponent } from "./reset-password.component";

describe("ResetPasswordComponent (component logic)", () => {
  let component: ResetPasswordComponent;
  let httpMock: HttpTestingController;
  const locationStub = { replaceState: vi.fn() };

  beforeEach(() => {
    locationStub.replaceState.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({ token: "reset-test-token" }),
            },
          },
        },
        { provide: Location, useValue: locationStub },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    component = TestBed.runInInjectionContext(
      () => new ResetPasswordComponent(),
    );
  });

  afterEach(() => httpMock.verify());

  it("mật khẩu yếu bị chặn tại FE", () => {
    component.submit("weak", "weak");
    expect(component.passwordError()).toBeTruthy();
    httpMock.expectNone("/api/auth/reset-password");
  });

  it("xác nhận mật khẩu không khớp bị chặn", () => {
    component.submit("Password12345", "Password00000");
    expect(component.confirmError()).toBeTruthy();
    httpMock.expectNone("/api/auth/reset-password");
  });

  it("gửi đúng token + mật khẩu và xóa token khỏi URL khi thành công", () => {
    component.submit("Password12345", "Password12345");
    const request = httpMock.expectOne("/api/auth/reset-password");
    expect(request.request.body).toEqual({
      token: "reset-test-token",
      newPassword: "Password12345",
    });
    request.flush({ message: "Password changed" });
    expect(component.success()).toBe(true);
    expect(locationStub.replaceState).toHaveBeenCalledWith("/reset-password");
  });

  it("token đã hết hạn sẽ hiển thị lỗi thân thiện", () => {
    component.submit("Password12345", "Password12345");
    httpMock
      .expectOne("/api/auth/reset-password")
      .flush({}, { status: 400, statusText: "Bad Request" });
    expect(component.serverError()).toContain("hết hạn");
    expect(component.success()).toBe(false);
  });
});
