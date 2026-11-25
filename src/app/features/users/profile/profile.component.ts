import { DatePipe } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { RouterLink } from "@angular/router";
import { finalize } from "rxjs";
import {
  ProfileRole,
  UpdateProfileRequest,
  UserProfile,
} from "./profile.model";
import { ProfileService } from "./profile.service";
import { UiBadgeComponent } from "../../../shared/ui";
import { AuthService } from "../../../core/auth/auth.service";
import { GoogleSignInComponent } from "../../../shared/google-sign-in/google-sign-in.component";

const ROLE_LABELS: Record<ProfileRole, string> = {
  OWNER: "Chủ trọ",
  STAFF: "Nhân viên",
  TENANT: "Người thuê",
  CUSTOMER: "Khách hàng",
};

@Component({
  selector: "app-profile",
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    UiBadgeComponent,
    GoogleSignInComponent,
  ],
  templateUrl: "./profile.component.html",
  styleUrl: "./profile.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly destroyRef = inject(DestroyRef);

  readonly profile = signal<UserProfile | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly editing = signal(false);
  readonly error = signal("");
  readonly success = signal("");
  private readonly auth = inject(AuthService);

  readonly googleLinked = signal(false);

  readonly linkingGoogle = signal(false);

  readonly form = new FormGroup({
    fullName: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)],
    }),
    email: new FormControl("", {
      nonNullable: true,
      validators: [Validators.email, Validators.maxLength(160)],
    }),
    phone: new FormControl("", {
      nonNullable: true,
      validators: [Validators.maxLength(25)],
    }),
  });

  readonly initials = computed(() => {
    const words =
      this.profile()?.fullName.trim().split(/\s+/).filter(Boolean) ?? [];
    if (words.length === 0) return "?";
    const first = Array.from(words[0])[0] ?? "";
    const last =
      words.length > 1 ? (Array.from(words[words.length - 1])[0] ?? "") : "";
    return (first + last).toLocaleUpperCase("vi-VN");
  });

  readonly roleLabel = computed(() => {
    const role = this.profile()?.role;
    return role ? ROLE_LABELS[role] : "";
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    if (this.saving() || this.editing()) return;

    this.loading.set(true);
    this.error.set("");
    this.success.set("");
    this.profileService
      .getProfile()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (account) => {
          this.profile.set(account);
          this.resetForm(account);
          this.googleLinked.set(account.googleLinked);
        },
        error: (error: HttpErrorResponse) =>
          this.error.set(this.describeError(error, false)),
      });
  }

  beginEdit(): void {
    const account = this.profile();
    if (!account || this.loading() || this.saving()) return;

    this.resetForm(account);
    this.editing.set(true);
    this.error.set("");
    this.success.set("");
  }

  cancelEdit(): void {
    if (this.saving()) return;
    const account = this.profile();
    if (account) this.resetForm(account);
    this.editing.set(false);
    this.error.set("");
  }

  saveProfile(): void {
    if (!this.editing() || this.saving() || !this.profile()) return;

    const values = this.form.getRawValue();
    const payload: UpdateProfileRequest = {
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
    };

    // Trim before checking required so whitespace-only names are rejected.
    this.form.patchValue(payload);
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity();
    if (this.form.invalid) return;

    const current = this.profile()!;
    if (
      payload.fullName === current.fullName &&
      payload.email === (current.email ?? "") &&
      payload.phone === (current.phone ?? "")
    ) {
      this.editing.set(false);
      return;
    }

    this.saving.set(true);
    this.error.set("");
    this.success.set("");
    this.profileService
      .updateProfile(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (updated) => {
          this.profile.set(updated);
          this.resetForm(updated);
          this.editing.set(false);
          this.success.set("Thông tin hồ sơ đã được cập nhật thành công.");
        },
        error: (error: HttpErrorResponse) =>
          this.error.set(this.describeError(error, true)),
      });
  }

  private resetForm(account: UserProfile): void {
    this.form.reset({
      fullName: account.fullName,
      email: account.email ?? "",
      phone: account.phone ?? "",
    });
  }

  linkGoogle(idToken: string): void {
    if (this.linkingGoogle()) return;

    this.linkingGoogle.set(true);
    this.error.set("");
    this.success.set("");

    this.auth
      .linkGoogle(idToken)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.linkingGoogle.set(false)),
      )
      .subscribe({
        next: () => {
          this.googleLinked.set(true);

          this.profile.update((account) =>
            account ? { ...account, googleLinked: true } : account,
          );

          this.success.set("Tài khoản Google đã được liên kết thành công.");
        },
        error: (err: HttpErrorResponse) => {
          const code = err.error?.code;

          if (code === "GOOGLE_EMAIL_MISMATCH") {
            this.error.set(
              "Email Google không trùng email tài khoản hiện tại.",
            );
          } else if (code === "GOOGLE_ALREADY_LINKED") {
            this.error.set("Tài khoản Google này đã được liên kết.");
          } else {
            this.error.set("Không thể liên kết Google. Vui lòng thử lại.");
          }
        },
      });
  }

  private describeError(error: HttpErrorResponse, updating: boolean): string {
    if (error.status === 0)
      return "Không thể kết nối máy chủ. Vui lòng kiểm tra kết nối.";
    if (error.status === 401)
      return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    if (error.status === 403)
      return "Bạn không có quyền thực hiện thao tác này.";
    if (error.status === 409)
      return "Email này đã được sử dụng. Vui lòng chọn email khác.";
    if (error.status === 400)
      return "Thông tin chưa hợp lệ. Vui lòng kiểm tra các trường đã nhập.";
    if (error.status === 502 || error.status === 503)
      return "Dịch vụ tạm thời gián đoạn. Vui lòng thử lại.";
    return updating
      ? "Không thể cập nhật hồ sơ. Vui lòng thử lại."
      : "Không thể tải hồ sơ. Vui lòng thử lại.";
  }
}
