import { Component, DestroyRef, inject } from "@angular/core";
import {
  Router,
  RouterLink,
  RouterOutlet,
  NavigationEnd,
} from "@angular/router";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { EMPTY, catchError, filter, map, merge, switchMap, timer } from "rxjs";

import { AuthService } from "./core/auth/auth.service";
import { NotificationService } from "./features/notifications/notification.service";

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
                routerLink="/notifications"
                class="app-navigation__link app-navigation__notification"
                [class.is-active]="currentUrl().startsWith('/notifications')"
                [attr.aria-current]="
                  currentUrl().startsWith('/notifications') ? 'page' : null
                "
                [attr.aria-label]="
                  notifications.unreadCount() > 0
                    ? 'Thông báo: ' + notifications.unreadCount() + ' chưa đọc'
                    : 'Thông báo, không có thông báo chưa đọc'
                "
                [attr.title]="
                  notifications.unreadCount() > 0
                    ? notifications.unreadCount() + ' thông báo chưa đọc'
                    : 'Thông báo'
                "
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                @if (notifications.unreadCount() > 0) {
                  <span
                    class="app-navigation__notification-count"
                    aria-hidden="true"
                  >
                    {{
                      notifications.unreadCount() > 99
                        ? "99+"
                        : notifications.unreadCount()
                    }}
                  </span>
                }
              </a>
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

    <main
      [class.auth-main]="isLoginPage()"
      [class.owner-main]="
        isOwnerPage() || currentUrl().startsWith('/notifications')
      "
    >
      <router-outlet />
    </main>
  `,
  styleUrl: "./app.component.css",
  styles: [
    `
      .app-navigation__notification {
        position: relative;
        min-width: 44px;
        padding: 9px;
        overflow: visible;
      }
      .app-navigation__notification svg {
        display: block;
        width: 22px;
        height: 22px;
        flex: none;
      }
      .app-navigation__notification-count {
        position: absolute;
        z-index: 1;
        top: -2px;
        right: -5px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 20px;
        height: 20px;
        padding: 0 4px;
        border: 2px solid #103568;
        border-radius: 999px;
        background: #e44859;
        color: #fff;
        font-size: 10px;
        font-weight: 800;
        line-height: 1;
        font-variant-numeric: tabular-nums;
        box-sizing: border-box;
        pointer-events: none;
      }
      @media (max-width: 850px) {
        .app-navigation__notification {
          min-width: 40px;
        }
      }
    `,
  ],
})
export class AppComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly notifications = inject(NotificationService);

  readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  constructor() {
    // Poll every 30 seconds and refresh after navigation.
    // Notification page also uses this service, so read actions update the badge immediately.
    merge(
      timer(0, 30_000),
      this.router.events.pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
      ),
    )
      .pipe(
        switchMap(() => {
          if (!this.auth.isAuthenticated()) {
            this.notifications.clearUnreadCount();
            return EMPTY;
          }
          // Header failure must not block navigation; the Notification page shows its own errors.
          return this.notifications.getMine().pipe(catchError(() => EMPTY));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

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
    this.notifications.clearUnreadCount();
    void this.router.navigateByUrl("/login", { replaceUrl: true });
  }
}
