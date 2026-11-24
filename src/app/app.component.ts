import { Component, DestroyRef, inject } from "@angular/core";
import { Router, RouterOutlet, NavigationEnd } from "@angular/router";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { EMPTY, catchError, filter, map, merge, switchMap, timer } from "rxjs";

import { AuthService } from "./core/auth/auth.service";
import { AppHeaderComponent } from "./core/layouts/app-header/app-header.component";
import { NotificationService } from "./features/notifications/notification.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, AppHeaderComponent],
  template: `
    @if (!isLoginPage()) {
      <app-header (logoutRequested)="logout()" />
    }
    <main
      class="app-main"
      [class.app-main--auth]="isLoginPage()"
      [class.app-main--full-width]="isFullWidthPage()"
    >
      <router-outlet />
    </main>
  `,
  styleUrl: "./app.component.css",
})
export class AppComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notifications = inject(NotificationService);

  readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  constructor() {
    // Keep the existing notification polling behavior while the shell is refactored.
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

  /** Expanded layout is shared by every private dashboard and notifications. */
  isFullWidthPage(): boolean {
    const path = this.currentUrl().split("?")[0];
    return ["/owner", "/tenant", "/notifications"].some(
      (prefix) => path === prefix || path.startsWith(`${prefix}/`),
    );
  }

  logout(): void {
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
