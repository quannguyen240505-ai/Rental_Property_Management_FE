import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { UserAccount } from "./user-management.model";
import { UserManagementService } from "./user-management.service";

const account: UserAccount = {
  id: "00000000-0000-0000-0000-000000000001",
  username: "staff01",
  fullName: "Nhân viên thử nghiệm",
  email: "staff01@example.com",
  phone: "0912345678",
  role: "STAFF",
  status: "ACTIVE",
  createdAt: "2026-11-20T00:00:00Z",
  updatedAt: "2026-11-20T00:00:00Z",
};

describe("UserManagementService", () => {
  let service: UserManagementService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserManagementService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(UserManagementService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  it("lấy danh sách người dùng qua GET /api/users", () => {
    let users: UserAccount[] | undefined;
    service.getUsers().subscribe((result) => (users = result));
    const req = http.expectOne("/api/users");
    expect(req.request.method).toBe("GET");
    req.flush([account]);
    expect(users).toEqual([account]);
  });

  it("chỉ gửi role STAFF khi tạo tài khoản nhân viên", () => {
    const payload = {
      username: "staff02",
      password: "Password1234",
      fullName: "Nhân viên hai",
      email: null,
      phone: null,
      role: "STAFF" as const,
    };
    service.createStaff(payload).subscribe();
    const req = http.expectOne("/api/users");
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual(payload);
    req.flush(account);
  });

  it("sửa thông tin người dùng bằng PUT /api/users/{id}", () => {
    const payload = {
      fullName: "Tên mới",
      email: "new@example.com",
      phone: "0900000000",
    };
    service.updateUser(account.id, payload).subscribe();
    const req = http.expectOne(`/api/users/${account.id}`);
    expect(req.request.method).toBe("PUT");
    expect(req.request.body).toEqual(payload);
    req.flush({ ...account, ...payload });
  });

  it("khóa tài khoản bằng PATCH /api/users/{id}/status", () => {
    service.changeStatus(account.id, "LOCKED").subscribe();
    const req = http.expectOne(`/api/users/${account.id}/status`);
    expect(req.request.method).toBe("PATCH");
    expect(req.request.body).toEqual({ status: "LOCKED" });
    req.flush({ ...account, status: "LOCKED" });
  });

  it("gửi lý do và trường xác minh hợp đồng đúng API đổi vai trò", () => {
    const payload = {
      role: "CUSTOMER" as const,
      reason: "Điều chỉnh vị trí công tác",
      contractReference: null,
      contractStatusConfirmed: false as const,
    };
    service.changeRole(account.id, payload).subscribe();
    const req = http.expectOne(`/api/users/${account.id}/role`);
    expect(req.request.method).toBe("PATCH");
    expect(req.request.body).toEqual(payload);
    req.flush({ ...account, role: "CUSTOMER" });
  });

  it("xem lịch sử đổi vai trò bằng GET /api/users/{id}/role-history", () => {
    let history: unknown;
    service
      .getRoleHistory(account.id)
      .subscribe((result) => (history = result));
    const req = http.expectOne(`/api/users/${account.id}/role-history`);
    expect(req.request.method).toBe("GET");
    req.flush([]);
    expect(history).toEqual([]);
  });
});
