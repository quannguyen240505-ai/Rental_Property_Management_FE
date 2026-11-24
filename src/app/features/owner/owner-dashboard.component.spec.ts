import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { UserNotification } from "../notifications/notification.model";
import { UserAccount } from "../users/user-management/user-management.model";
import { UserProfile } from "../users/profile/profile.model";
import { OwnerDashboardComponent } from "./owner-dashboard.component";

const profile: UserProfile = {
  id: "11111111-1111-1111-1111-111111111111",
  username: "owner",
  fullName: "Chủ trọ Demo",
  email: "owner@example.com",
  phone: null,
  role: "OWNER",
  status: "ACTIVE",
  createdAt: "2026-11-21T00:00:00Z",
  updatedAt: "2026-11-22T00:00:00Z",
};

function account(
  id: string,
  role: UserAccount["role"],
  status: UserAccount["status"],
  createdAt: string,
): UserAccount {
  return {
    id,
    username: `user_${id}`,
    fullName: `Người dùng ${id}`,
    email: null,
    phone: null,
    role,
    status,
    createdAt,
    updatedAt: createdAt,
  };
}

function notice(
  id: string,
  read: boolean,
  createdAt: string,
): UserNotification {
  return {
    id,
    title: `Thông báo ${id}`,
    message: `Nội dung ${id}`,
    category: "SYSTEM",
    read,
    createdAt,
    readAt: read ? createdAt : null,
  };
}

describe("OwnerDashboardComponent", () => {
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

  it("lấy dữ liệu từ 3 API hiện có và hiển thị đúng lời chào", () => {
    const fixture = TestBed.createComponent(OwnerDashboardComponent);
    fixture.detectChanges();
    const request = http.expectOne("/api/users/me");
    expect(request.request.method).toBe("GET");
    request.flush(profile);
    const usersRequest = http.expectOne("/api/users");
    expect(usersRequest.request.method).toBe("GET");
    usersRequest.flush([]);
    http.expectOne("/api/notifications/me").flush([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("Chủ trọ Demo");
  });

  it("tổng hợp chính xác tài khoản ACTIVE, STAFF và thông báo chưa đọc", () => {
    const fixture = TestBed.createComponent(OwnerDashboardComponent);
    fixture.detectChanges();
    http.expectOne("/api/users/me").flush(profile);
    http
      .expectOne("/api/users")
      .flush([
        account("1", "OWNER", "ACTIVE", "2026-11-20T00:00:00Z"),
        account("2", "STAFF", "ACTIVE", "2026-11-22T00:00:00Z"),
        account("3", "CUSTOMER", "LOCKED", "2026-11-23T00:00:00Z"),
      ]);
    http
      .expectOne("/api/notifications/me")
      .flush([
        notice("one", false, "2026-11-21T10:00:00Z"),
        notice("two", true, "2026-11-22T10:00:00Z"),
        notice("three", false, "2026-11-23T10:00:00Z"),
      ]);
    fixture.detectChanges();

    const dashboard = fixture.componentInstance;
    expect(dashboard.greeting()).toBe("Chủ trọ Demo");
    expect(dashboard.totalUsers()).toBe(3);
    expect(dashboard.activeUsers()).toBe(2);
    expect(dashboard.staffUsers()).toBe(1);
    expect(dashboard.unreadNotifications()).toBe(2);
    expect(dashboard.recentUsers()[0].id).toBe("3");
    expect(dashboard.recentNotifications()[0].id).toBe("three");
  });

  it("không hiển thị số liệu giả cho Property, Rental và Billing", () => {
    const fixture = TestBed.createComponent(OwnerDashboardComponent);
    fixture.detectChanges();
    http.expectOne("/api/users/me").flush(profile);
    http.expectOne("/api/users").flush([]);
    http.expectOne("/api/notifications/me").flush([]);
    fixture.detectChanges();
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain("Chờ tích hợp");
    expect(text).toContain("Property Service");
    expect(text).toContain("Rental Service");
    expect(text).toContain("Billing/Payment API");
  });

  it("khi API tài khoản lỗi thì không hiển thị số 0 như dữ liệu thật", () => {
    const fixture = TestBed.createComponent(OwnerDashboardComponent);
    fixture.detectChanges();
    http.expectOne("/api/users/me").flush(profile);
    http
      .expectOne("/api/users")
      .flush({}, { status: 503, statusText: "Unavailable" });
    http.expectOne("/api/notifications/me").flush([]);
    fixture.detectChanges();
    expect(fixture.componentInstance.usersLoaded()).toBe(false);
    expect(fixture.componentInstance.usersError()).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector(".owner-metric__value")?.textContent,
    ).toContain("—");
  });

  it("cho phép tải lại danh sách người dùng sau khi gặp lỗi", () => {
    const fixture = TestBed.createComponent(OwnerDashboardComponent);
    fixture.detectChanges();
    http.expectOne("/api/users/me").flush(profile);
    http
      .expectOne("/api/users")
      .flush({}, { status: 503, statusText: "Unavailable" });
    http.expectOne("/api/notifications/me").flush([]);
    fixture.componentInstance.loadUsers();
    http
      .expectOne("/api/users")
      .flush([account("1", "STAFF", "ACTIVE", "2026-11-24T00:00:00Z")]);
    fixture.detectChanges();
    expect(fixture.componentInstance.usersError()).toBe("");
    expect(fixture.componentInstance.usersLoaded()).toBe(true);
    expect(fixture.componentInstance.staffUsers()).toBe(1);
  });

  it("giữ link sang trang quản lý tài khoản và thông báo", () => {
    const fixture = TestBed.createComponent(OwnerDashboardComponent);
    fixture.detectChanges();
    http.expectOne("/api/users/me").flush(profile);
    http.expectOne("/api/users").flush([]);
    http.expectOne("/api/notifications/me").flush([]);
    fixture.detectChanges();
    const anchors = Array.from(
      fixture.nativeElement.querySelectorAll("a"),
    ) as HTMLAnchorElement[];
    expect(anchors.some((a) => a.getAttribute("href") === "/owner/users")).toBe(
      true,
    );
    expect(
      anchors.some((a) => a.getAttribute("href") === "/notifications"),
    ).toBe(true);
  });
});
