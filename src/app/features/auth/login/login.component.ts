import { HttpErrorResponse } from "@angular/common/http";
import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { finalize, interval } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { AuthService } from "../../../core/auth/auth.service";
import { roleHome } from "../../../core/auth/role-home";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: "./login.component.html",
  styleUrl: "./login.component.css",
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  username = "";
  password = "";

  readonly loading = signal(false);
  readonly showPassword = signal(false);
  readonly error = signal("");
  readonly usernameRequired = signal(false);
  readonly passwordRequired = signal(false);

  readonly highlights = [
    {
      title: "Mọi phòng, một nơi quản lý",
      description:
        "Theo dõi phòng trống, trạng thái cho thuê và thông tin bất động sản rõ ràng.",
    },
    {
      title: "Hợp đồng luôn trong tầm tay",
      description:
        "Quản lý hợp đồng và thông tin khách thuê theo quy trình thống nhất.",
    },
    {
      title: "Thanh toán minh bạch hơn",
      description:
        "Theo dõi hóa đơn và thanh toán trong cùng không gian làm việc.",
    },
  ] as const;

  readonly activeHighlight = signal(0);

  constructor() {
    // Automatic rotation uses public, static copy only (not mocked business metrics).
    // Cleanup is automatic when Angular destroys the component.
    if (
      typeof window !== "undefined" &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      interval(5600)
        .pipe(takeUntilDestroyed())
        .subscribe(() =>
          this.activeHighlight.update(
            (index) => (index + 1) % this.highlights.length,
          ),
        );
    }
  }

  selectHighlight(index: number): void {
    this.activeHighlight.set(index);
  }

  togglePassword(): void {
    this.showPassword.update((current) => !current);
  }

  onUsernameInput(): void {
    this.usernameRequired.set(false);
    this.error.set("");
  }

  onPasswordInput(): void {
    this.passwordRequired.set(false);
    this.error.set("");
  }

  submit(rawUsername: string, rawPassword: string): void {
    if (this.loading()) return;

    // Browser/password-manager autofill may update input.value before ngModel.
    // Use the actual DOM input values submitted by the form.
    const username = rawUsername.trim();
    this.usernameRequired.set(!username);
    this.passwordRequired.set(!rawPassword);
    if (!username || !rawPassword) {
      this.error.set("");
      return;
    }

    this.loading.set(true);
    this.error.set("");

    this.username = username;
    this.password = rawPassword;

    this.auth
      .login(username, rawPassword)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ role }) => {
          const destination = roleHome(role);
          void this.router.navigateByUrl(destination, { replaceUrl: true });
        },
        error: (error: HttpErrorResponse) => {
          const messages: Record<number, string> = {
            400: "Thông tin đăng nhập chưa hợp lệ. Vui lòng kiểm tra lại.",
            401: "Tên đăng nhập hoặc mật khẩu không chính xác.",
            403: "Tài khoản không có quyền truy cập hoặc đã bị khóa.",
            429: "Bạn thao tác quá nhiều lần. Vui lòng thử lại sau.",
            502: "Hệ thống tạm thời không kết nối được máy chủ.",
            503: "Dịch vụ xác thực đang tạm gián đoạn. Vui lòng thử lại.",
          };

          this.error.set(
            messages[error.status] ??
              (error.status === 0
                ? "Không thể kết nối máy chủ. Vui lòng kiểm tra đường truyền."
                : "Đăng nhập thất bại. Vui lòng thử lại."),
          );
        },
      });
  }
}
