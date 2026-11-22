import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { finalize } from "rxjs";

type FieldName =
  "fullName" | "username" | "email" | "phone" | "password" | "confirmPassword";
type FieldErrors = Partial<Record<FieldName, string>>;

interface RegisterRequest {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phone: string;
}

interface RegisterResponse {
  id: string;
  username: string;
  fullName: string;
  role: string;
}

@Component({
  selector: "app-register",
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: "./register.component.html",
  styleUrl: "./register.component.css",
})
export class RegisterComponent {
  private readonly http = inject(HttpClient);

  readonly loading = signal(false);
  readonly success = signal(false);
  readonly submittedUsername = signal("");
  readonly serverError = signal("");
  readonly fieldErrors = signal<FieldErrors>({});
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  clearField(name: FieldName): void {
    this.fieldErrors.update((errors) => ({ ...errors, [name]: "" }));
    this.serverError.set("");
  }

  submit(
    fullNameValue: string,
    usernameValue: string,
    emailValue: string,
    phoneValue: string,
    password: string,
    confirmPassword: string,
  ): void {
    if (this.loading() || this.success()) return;

    const fullName = fullNameValue.trim();
    const username = usernameValue.trim();
    const email = emailValue.trim();
    const phone = phoneValue.trim();
    const errors: FieldErrors = {};

    // Hiển thị lỗi ngắn theo trạng thái thực tế, tránh liệt kê quy tắc dài khi bỏ trống.
    if (!fullName) errors.fullName = "Nhập họ và tên.";
    else if (fullName.length > 120) errors.fullName = "Tối đa 120 ký tự.";

    if (!username) errors.username = "Nhập tên đăng nhập.";
    else if (!/^[A-Za-z0-9._-]{3,60}$/.test(username)) {
      errors.username = "Dùng 3–60 ký tự: chữ, số, . _ -";
    }

    if (!email) errors.email = "Nhập địa chỉ email.";
    else if (email.length > 160) errors.email = "Email tối đa 160 ký tự.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Địa chỉ email chưa đúng.";
    }

    // SĐT liên hệ bắt buộc: đúng 10 chữ số, bắt đầu bằng 0.
    if (!phone) errors.phone = "Nhập số điện thoại liên hệ.";
    else if (!/^0\d{9}$/.test(phone)) {
      errors.phone = "Cần 10 chữ số, bắt đầu bằng 0.";
    }

    if (!password) errors.password = "Nhập mật khẩu.";
    else if (
      password.length < 10 ||
      !/[A-Za-z]/.test(password) ||
      !/\d/.test(password)
    ) {
      errors.password = "Ít nhất 10 ký tự, gồm chữ và số.";
    } else if (new TextEncoder().encode(password).length > 72) {
      errors.password = "Tối đa 72 byte UTF-8.";
    }

    if (!confirmPassword) errors.confirmPassword = "Xác nhận lại mật khẩu.";
    else if (password !== confirmPassword)
      errors.confirmPassword = "Mật khẩu chưa khớp.";

    this.fieldErrors.set(errors);
    this.serverError.set("");
    if (Object.values(errors).some(Boolean)) return;

    // Public registration always creates CUSTOMER; role is never chosen by the client.
    const request: RegisterRequest = {
      username,
      password,
      fullName,
      email,
      phone,
    };

    this.loading.set(true);
    this.http
      .post<RegisterResponse>("/api/auth/register", request)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.submittedUsername.set(response.username || username);
          this.success.set(true);
          // Registration does not return a JWT; user signs in separately.
        },
        error: (error: HttpErrorResponse) => {
          const messages: Record<number, string> = {
            400: "Thông tin chưa hợp lệ. Kiểm tra lại các trường, đặc biệt là mật khẩu.",
            409: "Tên đăng nhập hoặc email đã được sử dụng. Vui lòng chọn thông tin khác.",
            429: "Bạn thao tác quá nhiều lần. Vui lòng thử lại sau.",
            502: "Không thể kết nối đến dịch vụ đăng ký. Vui lòng thử lại.",
            503: "Dịch vụ đang tạm gián đoạn. Vui lòng thử lại sau.",
          };
          this.serverError.set(
            messages[error.status] ??
              (error.status === 0
                ? "Không thể kết nối máy chủ. Vui lòng kiểm tra đường truyền."
                : "Đăng ký chưa thành công. Vui lòng thử lại."),
          );
        },
      });
  }
}
