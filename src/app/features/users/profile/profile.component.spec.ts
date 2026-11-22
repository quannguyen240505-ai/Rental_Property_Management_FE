import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ProfileComponent } from "./profile.component";
import { UserProfile } from "./profile.model";

const account: UserProfile = {
  id: "11111111-1111-1111-1111-111111111111",
  username: "owner",
  fullName: "Chủ Trọ Demo",
  email: "owner@example.com",
  phone: "0901234567",
  role: "OWNER",
  status: "ACTIVE",
  createdAt: "2026-11-20T10:00:00Z",
  updatedAt: "2026-11-21T10:00:00Z",
};

describe("ProfileComponent", () => {
  let httpMock: HttpTestingController;
  let component: ProfileComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
    component = TestBed.createComponent(ProfileComponent).componentInstance;
    component.ngOnInit();
    httpMock.expectOne("/api/users/me").flush(account);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it("hiển thị dữ liệu hồ sơ và nhãn vai trò từ API", () => {
    expect(component.profile()?.username).toBe("owner");
    expect(component.roleLabel()).toBe("Chủ trọ");
    expect(component.initials()).toBe("CD");
    expect(component.loading()).toBe(false);
  });

  it("mở chỉnh sửa và Hủy khôi phục thông tin gốc", () => {
    component.beginEdit();
    component.form.controls.fullName.setValue("Tên tạm");
    component.cancelEdit();
    expect(component.editing()).toBe(false);
    expect(component.form.controls.fullName.value).toBe(account.fullName);
  });

  it("không gửi PATCH khi họ tên chỉ chứa khoảng trắng", () => {
    component.beginEdit();
    component.form.controls.fullName.setValue("    ");
    component.saveProfile();
    expect(component.form.controls.fullName.hasError("required")).toBe(true);
    expect(component.saving()).toBe(false);
    httpMock.expectNone("/api/users/me");
  });

  it("không gửi PATCH khi email sai định dạng", () => {
    component.beginEdit();
    component.form.controls.email.setValue("invalid-address");
    component.saveProfile();
    expect(component.form.controls.email.hasError("email")).toBe(true);
    httpMock.expectNone("/api/users/me");
  });

  it("gửi PATCH với dữ liệu đã trim và cập nhật màn hình sau khi lưu", () => {
    component.beginEdit();
    component.form.patchValue({
      fullName: "  Nguyễn An  ",
      email: "  an@example.com  ",
      phone: "  0911223344  ",
    });
    component.saveProfile();
    const request = httpMock.expectOne("/api/users/me");
    expect(request.request.method).toBe("PATCH");
    expect(request.request.body).toEqual({
      fullName: "Nguyễn An",
      email: "an@example.com",
      phone: "0911223344",
    });
    request.flush({ ...account, ...request.request.body });
    expect(component.profile()?.fullName).toBe("Nguyễn An");
    expect(component.editing()).toBe(false);
    expect(component.success()).toContain("thành công");
  });

  it("giữ form đang chỉnh sửa khi API trả 409", () => {
    component.beginEdit();
    component.form.controls.email.setValue("used@example.com");
    component.saveProfile();
    httpMock
      .expectOne("/api/users/me")
      .flush(
        { code: "CONFLICT", message: "Email already exists" },
        { status: 409, statusText: "Conflict" },
      );
    expect(component.editing()).toBe(true);
    expect(component.error()).toContain("Email này đã được sử dụng");
    expect(component.saving()).toBe(false);
  });
});
