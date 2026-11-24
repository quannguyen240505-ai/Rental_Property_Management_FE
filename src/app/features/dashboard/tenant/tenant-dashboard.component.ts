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
import { RouterLink } from "@angular/router";
import { finalize } from "rxjs";

import {
  UiBadgeComponent,
  UiButtonComponent,
  UiCardComponent,
} from "../../../shared/ui";
import { NotificationService } from "../../notifications/notification.service";
import { UserNotification } from "../../notifications/notification.model";
import { ProfileService } from "../../users/profile/profile.service";
import { UserProfile } from "../../users/profile/profile.model";

/**
 * Tenant's real-data-first dashboard.
 * Property, Rental, Billing and Payment cards deliberately show integration
 * placeholders until their authenticated APIs are available on dev.
 */
@Component({
  selector: "app-tenant-dashboard",
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    UiBadgeComponent,
    UiButtonComponent,
    UiCardComponent,
  ],
  templateUrl: "./tenant-dashboard.component.html",
  styleUrl: "./tenant-dashboard.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantDashboardComponent implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly profile = signal<UserProfile | null>(null);
  readonly notifications = signal<UserNotification[]>([]);
  readonly profileLoading = signal(false);
  readonly notificationLoading = signal(false);
  readonly profileError = signal("");
  readonly notificationError = signal("");

  readonly unreadCount = computed(
    () => this.notifications().filter((message) => !message.read).length,
  );

  readonly recentNotifications = computed(() =>
    [...this.notifications()]
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, 3),
  );

  ngOnInit(): void {
    this.loadProfile();
    this.loadNotifications();
  }

  loadProfile(): void {
    if (this.profileLoading()) return;
    this.profileLoading.set(true);
    this.profileError.set("");
    this.profileService
      .getProfile()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.profileLoading.set(false)),
      )
      .subscribe({
        next: (profile) => this.profile.set(profile),
        error: (error: HttpErrorResponse) => {
          this.profileError.set(this.describeError(error));
        },
      });
  }

  loadNotifications(): void {
    if (this.notificationLoading()) return;
    this.notificationLoading.set(true);
    this.notificationError.set("");
    this.notificationService
      .getMine()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.notificationLoading.set(false)),
      )
      .subscribe({
        next: (messages) => this.notifications.set(messages),
        error: (error: HttpErrorResponse) => {
          this.notificationError.set(this.describeError(error));
        },
      });
  }

  private describeError(error: HttpErrorResponse): string {
    if (error.status === 401)
      return "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
    if (error.status === 403)
      return "Tài khoản không có quyền xem thông tin này.";
    if (error.status === 0) return "Không thể kết nối máy chủ. Hãy thử lại.";
    return "Chưa tải được dữ liệu. Hãy thử lại sau.";
  }
}
