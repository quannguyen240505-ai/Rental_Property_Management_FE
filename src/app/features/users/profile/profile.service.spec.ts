import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { UpdateProfileRequest, UserProfile } from "./profile.model";
import { ProfileService } from "./profile.service";

const profile: UserProfile = {
  id: "11111111-1111-1111-1111-111111111111",
  username: "staff_01",
  fullName: "Nguyễn Văn An",
  email: "staff@example.com",
  phone: "0901234567",
  role: "STAFF",
  status: "ACTIVE",
  createdAt: "2026-11-20T10:00:00Z",
  updatedAt: "2026-11-21T10:00:00Z",
  googleLinked: false,
};

describe("ProfileService", () => {
  let service: ProfileService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProfileService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ProfileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it("GET /api/users/me lấy hồ sơ người dùng hiện tại", () => {
    let result: UserProfile | undefined;
    service.getProfile().subscribe((value) => (result = value));

    const req = httpMock.expectOne("/api/users/me");
    expect(req.request.method).toBe("GET");
    req.flush(profile);
    expect(result).toEqual(profile);
  });

  it("PATCH /api/users/me gửi đúng 3 trường được phép sửa", () => {
    const payload: UpdateProfileRequest = {
      fullName: "Nguyễn Văn Bình",
      email: "new@example.com",
      phone: "0987654321",
    };
    let result: UserProfile | undefined;
    service.updateProfile(payload).subscribe((value) => (result = value));

    const req = httpMock.expectOne("/api/users/me");
    expect(req.request.method).toBe("PATCH");
    expect(req.request.body).toEqual(payload);
    expect(req.request.body).not.toHaveProperty("role");
    expect(req.request.body).not.toHaveProperty("username");
    req.flush({ ...profile, ...payload });
    expect(result?.fullName).toBe("Nguyễn Văn Bình");
  });

  it("cho phép gửi email/phone rỗng để người dùng bỏ thông tin tùy chọn", () => {
    const payload: UpdateProfileRequest = {
      fullName: profile.fullName,
      email: "",
      phone: "",
    };
    service.updateProfile(payload).subscribe();
    const req = httpMock.expectOne("/api/users/me");
    expect(req.request.body).toEqual(payload);
    req.flush({ ...profile, email: null, phone: "" });
  });

  it("trả lỗi 409 cho caller xử lý khi email đã tồn tại", () => {
    let status: number | undefined;
    service
      .updateProfile({
        fullName: profile.fullName,
        email: "used@example.com",
        phone: "",
      })
      .subscribe({ error: (err) => (status = err.status) });
    httpMock
      .expectOne("/api/users/me")
      .flush(
        { code: "CONFLICT", message: "Email already exists" },
        { status: 409, statusText: "Conflict" },
      );
    expect(status).toBe(409);
  });
});
