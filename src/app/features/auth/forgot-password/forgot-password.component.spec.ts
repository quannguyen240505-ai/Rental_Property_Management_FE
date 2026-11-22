import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ForgotPasswordComponent } from "./forgot-password.component";

describe("ForgotPasswordComponent (component logic)", () => {
  let component: ForgotPasswordComponent;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
    component = TestBed.runInInjectionContext(
      () => new ForgotPasswordComponent(),
    );
  });

  afterEach(() => httpMock.verify());

  it("bỏ trống email không gọi API", () => {
    component.submit(" ");
    expect(component.emailError()).toContain("email");
    httpMock.expectNone("/api/auth/forgot-password");
  });

  it("email sai định dạng không gọi API", () => {
    component.submit("not-an-email");
    expect(component.emailError()).toContain("định dạng");
    httpMock.expectNone("/api/auth/forgot-password");
  });

  it("email hợp lệ gọi API và hiển thị thông báo chung khi HTTP 202", () => {
    component.submit("  customer@example.com  ");
    const request = httpMock.expectOne("/api/auth/forgot-password");
    expect(request.request.method).toBe("POST");
    expect(request.request.body).toEqual({ email: "customer@example.com" });
    request.flush(
      { message: "Accepted" },
      { status: 202, statusText: "Accepted" },
    );
    expect(component.success()).toBe(true);
  });

  it("lỗi dịch vụ hiển thị thông báo và cho phép thử lại", () => {
    component.submit("customer@example.com");
    httpMock
      .expectOne("/api/auth/forgot-password")
      .flush({}, { status: 503, statusText: "Unavailable" });
    expect(component.serverError()).toContain("Không thể kết nối");
    expect(component.loading()).toBe(false);
  });
});
