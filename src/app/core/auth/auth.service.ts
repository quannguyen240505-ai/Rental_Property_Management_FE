import { Injectable, inject, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { tap } from "rxjs";
interface LoginResponse {
  accessToken: string;
  role: string;
  expiresAt: string;
  userId: string;
}
@Injectable({ providedIn: "root" })
export class AuthService {
  private http = inject(HttpClient);
  readonly token = signal<string | null>(sessionStorage.getItem("accessToken"));
  readonly role = signal<string | null>(sessionStorage.getItem("role"));
  login(username: string, password: string) {
    return this.http
      .post<LoginResponse>("/api/auth/login", { username, password })
      .pipe(
        tap((result) => {
          sessionStorage.setItem("accessToken", result.accessToken);
          sessionStorage.setItem("role", result.role);
          this.token.set(result.accessToken);
          this.role.set(result.role);
        }),
      );
  }
  logout() {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("role");
    this.token.set(null);
    this.role.set(null);
  }
}
