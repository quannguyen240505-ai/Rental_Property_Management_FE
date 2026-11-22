import { HttpClient } from "@angular/common/http";
import { Injectable, inject, signal } from "@angular/core";
import { tap } from "rxjs";

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
  role: string;
  userId: string;
}

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly http = inject(HttpClient);

  readonly token = signal<string | null>(sessionStorage.getItem("accessToken"));

  readonly role = signal<string | null>(sessionStorage.getItem("role"));

  private readonly expiresAt = signal<string | null>(
    sessionStorage.getItem("expiresAt"),
  );

  constructor() {
    this.isAuthenticated();
  }

  login(username: string, password: string) {
    return this.http
      .post<LoginResponse>("/api/auth/login", { username, password })
      .pipe(
        tap((response) => {
          sessionStorage.setItem("accessToken", response.accessToken);
          sessionStorage.setItem("role", response.role);
          sessionStorage.setItem("expiresAt", response.expiresAt);

          // Dọn dữ liệu từ phiên bản FE cũ.
          localStorage.removeItem("accessToken");
          localStorage.removeItem("role");

          this.token.set(response.accessToken);
          this.role.set(response.role);
          this.expiresAt.set(response.expiresAt);
        }),
      );
  }

  isAuthenticated(): boolean {
    const token = this.token();
    const expiresAt = this.expiresAt();

    const expiryTime = expiresAt ? Date.parse(expiresAt) : NaN;

    if (
      !token ||
      !expiresAt ||
      !Number.isFinite(expiryTime) ||
      expiryTime <= Date.now()
    ) {
      this.logout();
      return false;
    }

    return true;
  }

  // Yêu cầu Backend thu hồi JWT.
  logoutFromServer() {
    return this.http.post<void>("/api/auth/logout", {});
  }

  // Xóa trạng thái đăng nhập phía trình duyệt.
  logout(): void {
    for (const key of ["accessToken", "role", "expiresAt"]) {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    }

    this.token.set(null);
    this.role.set(null);
    this.expiresAt.set(null);
  }
}
