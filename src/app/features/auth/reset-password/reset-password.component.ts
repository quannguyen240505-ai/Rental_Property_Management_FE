import { Location } from "@angular/common";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { finalize } from "rxjs";
import { validateNewPassword } from "../shared/password-validation";

@Component({
  selector: "app-reset-password",
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: "./reset-password.component.html",
  styleUrl: "../shared/password-pages.css",
})
export class ResetPasswordComponent {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);

  readonly token = this.route.snapshot.queryParamMap.get("token")?.trim() ?? "";
  readonly loading = signal(false);
  readonly success = signal(false);
  readonly showPassword = signal(false);
  readonly showConfirm = signal(false);
  readonly passwordError = signal("");
  readonly confirmError = signal("");
  readonly serverError = signal("");

  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }
  toggleConfirm(): void {
    this.showConfirm.update((value) => !value);
  }

  clearError(field: "password" | "confirm"): void {
    if (field === "password") this.passwordError.set("");
    else this.confirmError.set("");
    this.serverError.set("");
  }

  submit(newPassword: string, confirmPassword: string): void {
    if (this.loading() || this.success() || !this.token) return;

    this.passwordError.set(validateNewPassword(newPassword) ?? "");
    this.confirmError.set(
      !confirmPassword
        ? "Vui lòng xác nhận mật khẩu."
        : newPassword !== confirmPassword
          ? "Mật khẩu xác nhận chưa khớp."
          : "",
    );
    this.serverError.set("");
    if (this.passwordError() || this.confirmError()) return;

    this.loading.set(true);
    this.http
      .post("/api/auth/reset-password", { token: this.token, newPassword })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.success.set(true);
          // Không để reset token tiếp tục xuất hiện trong URL sau khi đã sử dụng.
          this.location.replaceState("/reset-password");
        },
        error: (error: HttpErrorResponse) => {
          this.serverError.set(
            error.status === 400
              ? "Liên kết không hợp lệ, đã hết hạn hoặc đã được sử dụng. Hãy yêu cầu liên kết mới."
              : error.status === 429
                ? "Bạn đã thao tác quá nhiều lần. Vui lòng thử lại sau."
                : error.status === 0 ||
                    error.status === 502 ||
                    error.status === 503
                  ? "Dịch vụ đang tạm gián đoạn. Vui lòng thử lại sau."
                  : "Chưa thể đặt lại mật khẩu. Vui lòng thử lại.",
          );
        },
      });
  }
}
