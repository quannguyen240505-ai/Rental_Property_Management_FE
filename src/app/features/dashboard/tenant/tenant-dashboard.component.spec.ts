import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TenantDashboardComponent } from "./tenant-dashboard.component";
import { UserNotification } from "../../notifications/notification.model";
import { UserProfile } from "../../users/profile/profile.model";

const profile: UserProfile = {
  id: "11111111-1111-1111-1111-111111111111",
  username: "tenant_demo",
  fullName: "Nguyễn Văn An",
  email: "tenant@example.com",
  phone: "0901234567",
  role: "TENANT",
  status: "ACTIVE",
  createdAt: "2026-11-19T00:00:00Z",
  updatedAt: "2026-11-22T00:00:00Z",
};

const notice = (
  id: string,
  read: boolean,
  createdAt: string,
): UserNotification => ({
  id,
  title: `Thông báo ${id}`,
  message: `Chi tiết ${id}`,
  category: "SYSTEM",
  read,
  createdAt,
  readAt: read ? createdAt : null,
});

describe("TenantDashboardComponent", () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  it("hiển thị tên TENANT từ GET /api/users/me, không dùng tên giả", () => {
    const fixture = TestBed.createComponent(TenantDashboardComponent);
    fixture.detectChanges();
    const req = http.expectOne("/api/users/me");
    expect(req.request.method).toBe("GET");
    req.flush(profile);
    http.expectOne("/api/notifications/me").flush([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("Nguyễn Văn An");
    expect(fixture.nativeElement.textContent).toContain("tenant_demo");
  });

  it("đếm số chưa đọc từ API và xếp thông báo gần nhất lên trước", () => {
    const fixture = TestBed.createComponent(TenantDashboardComponent);
    fixture.detectChanges();
    http.expectOne("/api/users/me").flush(profile);
    http
      .expectOne("/api/notifications/me")
      .flush([
        notice("old", true, "2026-11-20T12:00:00Z"),
        notice("latest", false, "2026-11-24T12:00:00Z"),
        notice("middle", false, "2026-11-23T12:00:00Z"),
      ]);
    fixture.detectChanges();
    expect(fixture.componentInstance.unreadCount()).toBe(2);
    expect(fixture.componentInstance.recentNotifications()[0].id).toBe(
      "latest",
    );
    expect(
      fixture.nativeElement.querySelectorAll(".tenant-notice").length,
    ).toBe(3);
  });

  it("không bịa số tiền hoặc hợp đồng khi API nghiệp vụ chưa tích hợp", () => {
    const fixture = TestBed.createComponent(TenantDashboardComponent);
    fixture.detectChanges();
    http.expectOne("/api/users/me").flush(profile);
    http.expectOne("/api/notifications/me").flush([]);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain("Chưa kết nối");
    expect(text).toContain("chưa có thông báo");
    expect(text).not.toContain("8.000.000");
    expect(
      fixture.nativeElement.querySelectorAll(".tenant-action--disabled").length,
    ).toBe(2);
  });

  it("hiển thị lỗi và cho phép thử lại thông báo khi server 503", () => {
    const fixture = TestBed.createComponent(TenantDashboardComponent);
    fixture.detectChanges();
    http.expectOne("/api/users/me").flush(profile);
    http
      .expectOne("/api/notifications/me")
      .flush(
        { message: "unavailable" },
        { status: 503, statusText: "Unavailable" },
      );
    fixture.detectChanges();
    expect(fixture.componentInstance.notificationError()).toBeTruthy();
    fixture.componentInstance.loadNotifications();
    http.expectOne("/api/notifications/me").flush([]);
    fixture.detectChanges();
    expect(fixture.componentInstance.notificationError()).toBe("");
  });
});
