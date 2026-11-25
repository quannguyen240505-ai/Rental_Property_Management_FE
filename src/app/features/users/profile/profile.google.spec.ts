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
  googleLinked: false,
};

describe("ProfileComponent - Google Account Linking", () => {
  let component: ProfileComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    sessionStorage.clear();
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
    sessionStorage.clear();
  });

  it("Profile chua lien ket hien trang thai false", () => {
    expect(component.profile()?.googleLinked).toBe(false);
    expect(component.googleLinked()).toBe(false);
  });

  it("POST /api/auth/google/link thanh cong cap nhat UI ngay, khong can F5", () => {
    component.linkGoogle("google-credential-for-linking");
    expect(component.linkingGoogle()).toBe(true);

    const req = httpMock.expectOne("/api/auth/google/link");
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({
      idToken: "google-credential-for-linking",
    });
    req.flush({ message: "Google account linked successfully" });

    expect(component.googleLinked()).toBe(true);
    expect(component.profile()?.googleLinked).toBe(true);
    expect(component.profile()?.role).toBe("OWNER");
    expect(component.linkingGoogle()).toBe(false);
    expect(component.success()).toContain("liên kết thành công");
    expect(component.error()).toBe("");
  });

  it("khong gui nhieu request lien ket khi dang xu ly", () => {
    component.linkGoogle("first-google-token");
    component.linkGoogle("second-google-token");

    const req = httpMock.expectOne("/api/auth/google/link");
    expect(req.request.body).toEqual({ idToken: "first-google-token" });
    req.flush({ message: "Google account linked successfully" });

    expect(component.googleLinked()).toBe(true);
  });

  it.each([
    {
      code: "GOOGLE_EMAIL_MISMATCH",
      expectedMessage: "không trùng email",
    },
    {
      code: "GOOGLE_ALREADY_LINKED",
      expectedMessage: "đã được liên kết",
    },
  ])("409 $code khong doi trang thai profile", ({ code, expectedMessage }) => {
    component.linkGoogle("conflicting-google-token");
    httpMock
      .expectOne("/api/auth/google/link")
      .flush(
        { code, message: "Cannot link Google account" },
        { status: 409, statusText: "Conflict" },
      );

    expect(component.googleLinked()).toBe(false);
    expect(component.profile()?.googleLinked).toBe(false);
    expect(component.error()).toContain(expectedMessage);
    expect(component.success()).toBe("");
    expect(component.linkingGoogle()).toBe(false);
  });

  it("503 khi lien ket khong hien thi trang thai lien ket thanh cong", () => {
    component.linkGoogle("google-token");
    httpMock
      .expectOne("/api/auth/google/link")
      .flush(
        { code: "GOOGLE_LOGIN_NOT_CONFIGURED" },
        { status: 503, statusText: "Unavailable" },
      );

    expect(component.googleLinked()).toBe(false);
    expect(component.success()).toBe("");
    expect(component.error()).toContain("Không thể liên kết Google");
    expect(component.linkingGoogle()).toBe(false);
  });

  it("tai lai Profile voi googleLinked=true giu trang thai da lien ket", () => {
    component.loadProfile();
    const req = httpMock.expectOne("/api/users/me");
    expect(req.request.method).toBe("GET");
    req.flush({ ...account, googleLinked: true });

    expect(component.googleLinked()).toBe(true);
    expect(component.profile()?.googleLinked).toBe(true);
  });

  it("server bao googleLinked=false se hien thi dung trang thai chua lien ket", () => {
    component.loadProfile();
    httpMock.expectOne("/api/users/me").flush({
      ...account,
      googleLinked: true,
    });
    expect(component.googleLinked()).toBe(true);

    component.loadProfile();
    httpMock.expectOne("/api/users/me").flush(account);

    expect(component.googleLinked()).toBe(false);
    expect(component.profile()?.googleLinked).toBe(false);
  });
});
