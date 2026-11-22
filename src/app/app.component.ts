import { Component, inject } from "@angular/core";
import { RouterLink, RouterOutlet, Router } from "@angular/router";
import { AuthService } from "./core/auth/auth.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  template: `<header>
      <strong>Rental Property</strong>
      <nav>
        @if (auth.token()) {
          <a routerLink="/profile">Tài khoản</a>
          @if (auth.role() === "OWNER") {
            <a routerLink="/owner">Quản lý tài khoản</a>
          }
          <a href="#" (click)="logout($event)">Đăng xuất</a>
        } @else {
          <a routerLink="/login">Đăng nhập</a>
        }
      </nav>
    </header>
    <main><router-outlet /></main>`,
})
export class AppComponent {
  auth = inject(AuthService);
  private router = inject(Router);
  logout(event: Event) {
    event.preventDefault();
    this.auth.logout();
    void this.router.navigateByUrl("/login");
  }
}
