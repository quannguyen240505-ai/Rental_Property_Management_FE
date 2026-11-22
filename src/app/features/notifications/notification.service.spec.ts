import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { UserNotification } from "./notification.model";
import { NotificationService } from "./notification.service";

const makeNotification = (id: string, read: boolean): UserNotification => ({
  id,
  title: "Thông báo thử",
  message: "Nội dung thử nghiệm",
  category: "SYSTEM",
  read,
  createdAt: "2026-11-23T00:00:00Z",
  readAt: read ? "2026-11-23T00:05:00Z" : null,
});

describe("NotificationService unread badge", () => {
  let api: NotificationService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(NotificationService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  it("đếm số thông báo chưa đọc từ API", () => {
    api.getMine().subscribe();
    const req = http.expectOne("/api/notifications/me");
    expect(req.request.method).toBe("GET");
    req.flush([
      makeNotification("n1", false),
      makeNotification("n2", true),
      makeNotification("n3", false),
    ]);
    expect(api.unreadCount()).toBe(2);
  });

  it("giảm badge khi đánh dấu đã đọc thành công", () => {
    api.unreadCount.set(2);
    api.markAsRead("n1").subscribe();
    const req = http.expectOne("/api/notifications/n1/read");
    expect(req.request.method).toBe("PATCH");
    expect(req.request.body).toEqual({});
    req.flush(makeNotification("n1", true));
    expect(api.unreadCount()).toBe(1);
  });

  it("không giảm badge nếu PATCH lỗi", () => {
    api.unreadCount.set(1);
    api.markAsRead("n1").subscribe({ error: () => {} });
    http
      .expectOne("/api/notifications/n1/read")
      .flush({ code: "ERROR" }, { status: 500, statusText: "Server Error" });
    expect(api.unreadCount()).toBe(1);
  });

  it("xóa badge khi đăng xuất", () => {
    api.unreadCount.set(4);
    api.clearUnreadCount();
    expect(api.unreadCount()).toBe(0);
  });
});
