import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { finalize } from "rxjs";
import { AuthService } from "../../../core/auth/auth.service";
import { validateNewPassword } from "../shared/password-validation";

type Field = "current" | "next" | "confirm";

@Component({
  selector: "app-change-password",
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: "./change-password.component.html",
  styleUrl: "../shared/password-pages.css",
})
export class ChangePasswordComponent {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  readonly loading = signal(false);
  readonly success = signal(false);
  readonly showCurrent = signal(false);
  readonly showNext = signal(false);
  readonly showConfirm = signal(false);
  readonly currentError = signal("");
  readonly nextError = signal("");
  readonly confirmError = signal("");
  readonly serverError = signal("");

  toggleCurrent(): void {
    this.showCurrent.update((value) => !value);
  }
  toggleNext(): void {
    this.showNext.update((value) => !value);
  }
  toggleConfirm(): void {
    this.showConfirm.update((value) => !value);
  }

  clearError(field: Field): void {
    if (field === "current") this.currentError.set("");
    if (field === "next") this.nextError.set("");
    if (field === "confirm") this.confirmError.set("");
    this.serverError.set("");
  }

  submit(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ): void {
    if (this.loading() || this.success()) return;
    this.currentError.set(
      currentPassword ? "" : "Vui lòng nhập mật khẩu hiện tại.",
    );
    this.nextError.set(validateNewPassword(newPassword) ?? "");
    this.confirmError.set(
      !confirmPassword
        ? "Vui lòng xác nhận mật khẩu."
        : confirmPassword !== newPassword
          ? "Mật khẩu xác nhận chưa khớp."
          : "",
    );
    this.serverError.set("");

    if (currentPassword && newPassword && currentPassword === newPassword) {
      this.nextError.set("Mật khẩu mới phải khác mật khẩu cũ.");
    }
    if (this.currentError() || this.nextError() || this.confirmError()) return;

    this.loading.set(true);
    this.http
      .post("/api/auth/change-password", { currentPassword, newPassword })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          // Auth Service đã invalidateTokens(); kết thúc trạng thái đăng nhập ở FE.
          this.auth.logout();
          this.success.set(true);
        },
        error: (error: HttpErrorResponse) => {
          this.serverError.set(
            error.status === 400
              ? "Mật khẩu hiện tại không đúng hoặc mật khẩu mới chưa hợp lệ."
              : error.status === 401
                ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
                : error.status === 429
                  ? "Bạn đã thao tác quá nhiều lần. Vui lòng thử lại sau."
                  : error.status === 0 ||
                      error.status === 502 ||
                      error.status === 503
                    ? "Dịch vụ đang tạm gián đoạn. Vui lòng thử lại sau."
                    : "Không thể đổi mật khẩu lúc này. Vui lòng thử lại.",
          );
        },
      });
  }
}
