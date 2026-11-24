import { HttpClient } from "@angular/common/http";
import { DestroyRef, Injectable, inject, signal } from "@angular/core";
import { Subject } from "rxjs";
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
  private readonly destroyRef = inject(DestroyRef);

  /** Only automatic expiration / revoked sessions emit this event. */
  readonly sessionExpired$ = new Subject<void>();
  private expiryTimer: ReturnType<typeof setTimeout> | null = null;

  readonly token = signal<string | null>(sessionStorage.getItem("accessToken"));

  readonly role = signal<string | null>(sessionStorage.getItem("role"));

  private readonly expiresAt = signal<string | null>(
    sessionStorage.getItem("expiresAt"),
  );

  constructor() {
    this.isAuthenticated();
    this.scheduleExpiry();
    this.destroyRef.onDestroy(() => this.clearExpiryTimer());
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
          this.scheduleExpiry();
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
      if (token && Number.isFinite(expiryTime) && expiryTime <= Date.now()) {
        this.expireSession();
      } else {
        this.logout();
      }
      return false;
    }

    return true;
  }

  /** Called when expiry time is reached or a request proves the session invalid. */
  expireSession(): void {
    if (!this.token()) return; // Prevent repeated 401 redirects.
    this.logout();
    this.sessionExpired$.next();
  }

  private clearExpiryTimer(): void {
    if (this.expiryTimer !== null) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
  }

  private scheduleExpiry(): void {
    this.clearExpiryTimer();
    const expiry = this.expiresAt();
    if (!this.token() || !expiry) return;
    const remaining = Date.parse(expiry) - Date.now();
    if (!Number.isFinite(remaining) || remaining <= 0) {
      this.expireSession();
      return;
    }
    // setTimeout only accepts a signed 32-bit millisecond duration.
    this.expiryTimer = setTimeout(
      () => {
        this.expiryTimer = null;
        if (this.isAuthenticated()) this.scheduleExpiry();
      },
      Math.min(remaining, 2_147_483_647),
    );
  }

  // Yêu cầu Backend thu hồi JWT.
  logoutFromServer() {
    return this.http.post<void>("/api/auth/logout", {});
  }

  // Xóa trạng thái đăng nhập phía trình duyệt.
  logout(): void {
    this.clearExpiryTimer();
    for (const key of ["accessToken", "role", "expiresAt"]) {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    }

    this.token.set(null);
    this.role.set(null);
    this.expiresAt.set(null);
  }
}
