import { HttpErrorResponse } from "@angular/common/http";
import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { finalize, interval } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { AuthService } from "../../../core/auth/auth.service";
import { roleHome } from "../../../core/auth/role-home";

import { AfterViewInit, ElementRef, NgZone, ViewChild } from "@angular/core";

import { GOOGLE_CLIENT_ID } from "../../../core/config/google.config";
import { GoogleSignInComponent } from "../../../shared/google-sign-in/google-sign-in.component";

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleIdentityApi {
  accounts: {
    id: {
      initialize(config: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
      }): void;
      renderButton(
        element: HTMLElement,
        options: {
          theme: string;
          size: string;
          text: string;
          width: number;
        },
      ): void;
    };
  };
}

type GoogleWindow = Window & {
  google?: GoogleIdentityApi;
};

@Component({
  selector: "app-login",
  standalone: true,
  imports: [FormsModule, RouterLink, GoogleSignInComponent],
  templateUrl: "./login.component.html",
  styleUrl: "./login.component.css",
})
export class LoginComponent implements AfterViewInit {
  @ViewChild("googleButton")
  googleButton!: ElementRef<HTMLDivElement>;

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute, { optional: true });
  private readonly zone = inject(NgZone);

  readonly sessionExpiredNotice =
    this.route?.snapshot.queryParamMap.get("reason") === "expired";

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

  onGoogleReady(): void {
    if (this.error() === "Không thể tải đăng nhập Google. Vui lòng thử lại.") {
      this.error.set("");
    }
  }

  ngAfterViewInit(): void {
    void this.initializeGoogleLogin();
  }

  private async initializeGoogleLogin(): Promise<void> {
    try {
      await this.loadGoogleScript();

      const google = (window as GoogleWindow).google;
      if (!google) {
        throw new Error("Google SDK unavailable");
      }

      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          this.zone.run(() => {
            this.handleGoogleCredential(response.credential);
          });
        },
      });

      google.accounts.id.renderButton(this.googleButton.nativeElement, {
        theme: "outline",
        size: "large",
        text: "signin_with",
        width: 300,
      });
    } catch {
      this.error.set("Không thể tải đăng nhập Google. Vui lòng thử lại.");
    }
  }

  private loadGoogleScript(): Promise<void> {
    const googleWindow = window as GoogleWindow;
    if (googleWindow.google) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Google SDK failed to load"));

      document.head.appendChild(script);
    });
  }

  handleGoogleCredential(idToken: string): void {
    if (this.loading()) return;

    this.loading.set(true);
    this.error.set("");

    this.auth
      .googleLogin(idToken)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ role }) => {
          void this.router.navigateByUrl(roleHome(role), {
            replaceUrl: true,
          });
        },
        error: (err: HttpErrorResponse) => {
          const code = err.error?.code;

          if (code === "ACCOUNT_LINK_REQUIRED") {
            this.error.set(
              "Email đã có tài khoản. Hãy đăng nhập bằng mật khẩu và liên kết Google.",
            );
          } else if (err.status === 401) {
            this.error.set("Google ID Token không hợp lệ.");
          } else if (err.status === 503) {
            this.error.set("Dịch vụ Google Login chưa sẵn sàng.");
          } else {
            this.error.set("Đăng nhập Google thất bại.");
          }
        },
      });
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
