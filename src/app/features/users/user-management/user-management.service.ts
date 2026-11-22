import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import {
  CreateStaffRequest,
  RoleChangeHistory,
  RoleChangeRequest,
  UpdateUserRequest,
  UserAccount,
  UserStatus,
} from "./user-management.model";

/** Giao tiếp API Auth/User qua API Gateway; JWT do authInterceptor thêm vào. */
@Injectable({ providedIn: "root" })
export class UserManagementService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = "/api/users";

  getUsers() {
    return this.http.get<UserAccount[]>(this.baseUrl);
  }

  createStaff(payload: CreateStaffRequest) {
    return this.http.post<UserAccount>(this.baseUrl, payload);
  }

  updateUser(id: string, payload: UpdateUserRequest) {
    return this.http.put<UserAccount>(
      `${this.baseUrl}/${encodeURIComponent(id)}`,
      payload,
    );
  }

  changeStatus(id: string, status: UserStatus) {
    return this.http.patch<UserAccount>(
      `${this.baseUrl}/${encodeURIComponent(id)}/status`,
      { status },
    );
  }

  changeRole(id: string, payload: RoleChangeRequest) {
    return this.http.patch<UserAccount>(
      `${this.baseUrl}/${encodeURIComponent(id)}/role`,
      payload,
    );
  }

  getRoleHistory(id: string) {
    return this.http.get<RoleChangeHistory[]>(
      `${this.baseUrl}/${encodeURIComponent(id)}/role-history`,
    );
  }
}
