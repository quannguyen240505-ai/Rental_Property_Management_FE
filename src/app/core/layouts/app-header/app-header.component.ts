import {
  Component,
  ElementRef,
  HostListener,
  inject,
  output,
  signal,
} from "@angular/core";
import { Router, RouterLink, NavigationEnd } from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import { filter, map } from "rxjs";

import { AuthService } from "../../auth/auth.service";
import { roleHome } from "../../auth/role-home";
import { NotificationService } from "../../../features/notifications/notification.service";

@Component({
  selector: "app-header",
  standalone: true,
  imports: [RouterLink],
  templateUrl: "./app-header.component.html",
  styleUrl: "./app-header.component.css",
})
export class AppHeaderComponent {
  readonly auth = inject(AuthService);
  readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly logoutRequested = output<void>();
  readonly menuOpen = signal(false);

  readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  homeUrl(): string {
    return roleHome(this.auth.role());
  }

  isActive(path: string): boolean {
    const current = this.currentUrl().split("?")[0];
    return current === path || current.startsWith(`${path}/`);
  }

  accountLabel(): string {
    switch (this.auth.role()) {
      case "OWNER":
        return "Chủ trọ";
      case "STAFF":
        return "Nhân viên";
      case "TENANT":
        return "Người thuê";
      case "CUSTOMER":
        return "Khách hàng";
      default:
        return "Tài khoản";
    }
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  requestLogout(): void {
    this.closeMenu();
    this.logoutRequested.emit();
  }

  @HostListener("document:keydown.escape")
  onEscape(): void {
    this.closeMenu();
  }

  @HostListener("document:click", ["$event"])
  onOutsideClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.closeMenu();
    }
  }
}
