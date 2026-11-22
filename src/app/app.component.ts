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
      <header>
        <strong>Rental Property</strong>

        <nav>
          @if (auth.token()) {
            <a routerLink="/profile">Tài khoản</a>

            @if (auth.role() === "OWNER") {
              <a routerLink="/owner">Quản lý tài khoản</a>
            }

            <a routerLink="/change-password">Đổi mật khẩu</a>

            <a href="#" (click)="logout($event)">Đăng xuất</a>
          } @else {
            <a routerLink="/login">Đăng nhập</a>
          }
        </nav>
      </header>
    }

    <main [class.auth-main]="isLoginPage()">
      <router-outlet />
    </main>
  `,
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
  logout(event: Event): void {
    event.preventDefault();

    this.auth.logoutFromServer().subscribe({
      next: () => this.finishLogout(),
      error: () => this.finishLogout(),
    });
  }

  private finishLogout(): void {
    this.auth.logout();

    void this.router.navigateByUrl("/login", {
      replaceUrl: true,
    });
  }
}
