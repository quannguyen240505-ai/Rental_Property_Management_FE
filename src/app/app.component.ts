import { Component, inject } from "@angular/core";
import {
  Router,
  RouterLink,
  RouterOutlet,
  NavigationEnd,
} from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import { filter, map } from "rxjs";

import { AuthService } from "./core/auth/auth.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  template: `
    @if (!isLoginPage()) {
      <header class="app-header">
        <div class="app-header__inner">
          <a
            class="app-brand"
            [routerLink]="auth.role() === 'OWNER' ? '/owner' : '/profile'"
            aria-label="Rental Property - trang chính"
          >
            <span class="app-brand__mark" aria-hidden="true">
              <svg viewBox="0 0 40 40" fill="none">
                <path
                  d="M6 19.5 20 7l14 12.5V34H23.5V24h-7v10H6V19.5Z"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
            <span class="app-brand__copy">
              <strong>Rental Property</strong>
              <small>PROPERTY MANAGEMENT SYSTEM</small>
            </span>
          </a>

          <nav class="app-navigation" aria-label="Điều hướng tài khoản">
            @if (auth.token()) {
              @if (auth.role() === "OWNER") {
                <a
                  routerLink="/owner"
                  class="app-navigation__link"
                  [class.is-active]="isOwnerPage()"
                  [attr.aria-current]="isOwnerPage() ? 'page' : null"
                  >Quản lý tài khoản</a
                >
              }
              <a
                routerLink="/profile"
                class="app-navigation__link"
                [class.is-active]="currentUrl().startsWith('/profile')"
                [attr.aria-current]="
                  currentUrl().startsWith('/profile') ? 'page' : null
                "
                >Hồ sơ</a
              >
              <a
                routerLink="/change-password"
                class="app-navigation__link"
                [class.is-active]="currentUrl().startsWith('/change-password')"
                [attr.aria-current]="
                  currentUrl().startsWith('/change-password') ? 'page' : null
                "
                >Đổi mật khẩu</a
              >
              <span class="app-navigation__separator" aria-hidden="true"></span>
              <a
                href="#"
                class="app-navigation__logout"
                (click)="logout($event)"
              >
                <span>Đăng xuất</span>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M8 6H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3M12 7l5 5-5 5m5-5H8"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </a>
            } @else {
              <a routerLink="/login" class="app-navigation__link">Đăng nhập</a>
            }
          </nav>
        </div>
      </header>
    }

    <main [class.auth-main]="isLoginPage()" [class.owner-main]="isOwnerPage()">
      <router-outlet />
    </main>
  `,
  styleUrl: "./app.component.css",
})
export class AppComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  isLoginPage(): boolean {
    const path = this.currentUrl().split("?")[0];
    return [
      "/login",
      "/register",
      "/forgot-password",
      "/reset-password",
    ].includes(path);
  }

  isOwnerPage(): boolean {
    const path = this.currentUrl().split("?")[0];
    return path === "/owner" || path.startsWith("/owner/");
  }

  logout(event: Event): void {
    event.preventDefault();
    this.auth.logoutFromServer().subscribe({
      next: () => this.finishLogout(),
      error: () => this.finishLogout(),
    });
  }

  private finishLogout(): void {
    this.auth.logout();
    void this.router.navigateByUrl("/login", { replaceUrl: true });
  }
}
