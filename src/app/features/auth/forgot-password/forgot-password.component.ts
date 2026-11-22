import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { finalize } from "rxjs";

@Component({
  selector: "app-forgot-password",
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: "./forgot-password.component.html",
  styleUrl: "../shared/password-pages.css",
})
export class ForgotPasswordComponent {
  private readonly http = inject(HttpClient);

  readonly loading = signal(false);
  readonly success = signal(false);
  readonly emailError = signal("");
  readonly serverError = signal("");

  clearError(): void {
    this.emailError.set("");
    this.serverError.set("");
  }

  submit(rawEmail: string): void {
    if (this.loading() || this.success()) return;
    const email = rawEmail.trim();
    this.emailError.set("");
    this.serverError.set("");

    if (!email) {
      this.emailError.set("Vui lòng nhập email đăng ký.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.emailError.set("Địa chỉ email chưa đúng định dạng.");
      return;
    }

    this.loading.set(true);
    this.http
      .post("/api/auth/forgot-password", { email })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        // Server cố ý trả cùng thông điệp cho email tồn tại / không tồn tại.
        next: () => this.success.set(true),
        error: (error: HttpErrorResponse) => {
          this.serverError.set(
            error.status === 429
              ? "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau."
              : error.status === 0 ||
                  error.status === 502 ||
                  error.status === 503
                ? "Không thể kết nối dịch vụ. Vui lòng thử lại sau."
                : "Chưa thể gửi yêu cầu. Vui lòng thử lại.",
          );
        },
      });
  }
}
