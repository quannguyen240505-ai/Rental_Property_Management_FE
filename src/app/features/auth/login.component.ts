import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "../../core/auth/auth.service";
@Component({
  selector: "app-login",
  standalone: true,
  imports: [FormsModule],
  template: ` <section class="card" style="max-width:440px;margin:auto">
    <h2>Đăng nhập quản lý</h2>
    <p class="muted">Chỉ OWNER, STAFF và TENANT được cấp tài khoản.</p>
    <form (ngSubmit)="submit()">
      <label>Tên đăng nhập</label
      ><input name="username" [(ngModel)]="username" required />
      <label>Mật khẩu</label
      ><input name="password" type="password" [(ngModel)]="password" required />
      @if (error()) {
        <p class="error">{{ error() }}</p>
      }
      <button type="submit" [disabled]="loading()">
        {{ loading() ? "Đang xử lý..." : "Đăng nhập" }}
      </button>
    </form>
  </section>`,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  username = "owner";
  password = "";

  loading = signal(false);
  error = signal("");
  submit() {
    this.loading.set(true);
    this.error.set("");
    this.auth.login(this.username, this.password).subscribe({
      next: (r) => {
        this.loading.set(false);
        void this.router.navigateByUrl(
          r.role === "OWNER" ? "/owner" : "/profile",
        );
      },
      error: () => {
        this.loading.set(false);
        this.error.set(
          "Sai tài khoản/mật khẩu hoặc không thể kết nối máy chủ.",
        );
      },
    });
  }
}
