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
import { UserNotification } from "../../notifications/notification.model";
import { NotificationService } from "../../notifications/notification.service";
import { UserAccount } from "../../users/user-management/user-management.model";
import { UserManagementService } from "../../users/user-management/user-management.service";
import { UserProfile } from "../../users/profile/profile.model";
import { ProfileService } from "../../users/profile/profile.service";

/**
 * OWNER dashboard uses only APIs already available on dev.
 * Property, Rental and Billing statistics must not be fabricated.
 */
@Component({
  selector: "app-owner-dashboard",
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    UiBadgeComponent,
    UiButtonComponent,
    UiCardComponent,
  ],
  templateUrl: "./owner-dashboard.component.html",
  styleUrl: "./owner-dashboard.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OwnerDashboardComponent implements OnInit {
  private readonly profileApi = inject(ProfileService);
  private readonly usersApi = inject(UserManagementService);
  private readonly notificationApi = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly profile = signal<UserProfile | null>(null);
  readonly users = signal<UserAccount[]>([]);
  readonly notifications = signal<UserNotification[]>([]);

  readonly profileLoading = signal(false);
  readonly usersLoading = signal(false);
  readonly notificationsLoading = signal(false);
  readonly profileError = signal("");
  readonly usersError = signal("");
  readonly notificationsError = signal("");
  readonly usersLoaded = signal(false);
  readonly notificationsLoaded = signal(false);

  readonly greeting = computed(
    () =>
      this.profile()?.fullName?.trim() || this.profile()?.username || "Chủ trọ",
  );
  readonly totalUsers = computed(() => this.users().length);
  readonly activeUsers = computed(
    () => this.users().filter((user) => user.status === "ACTIVE").length,
  );
  readonly staffUsers = computed(
    () => this.users().filter((user) => user.role === "STAFF").length,
  );
  readonly unreadNotifications = computed(
    () => this.notifications().filter((item) => !item.read).length,
  );
  readonly recentUsers = computed(() =>
    [...this.users()]
      .sort(
        (left, right) =>
          Date.parse(right.createdAt) - Date.parse(left.createdAt),
      )
      .slice(0, 5),
  );
  readonly recentNotifications = computed(() =>
    [...this.notifications()]
      .sort(
        (left, right) =>
          Date.parse(right.createdAt) - Date.parse(left.createdAt),
      )
      .slice(0, 3),
  );

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loadProfile();
    this.loadUsers();
    this.loadNotifications();
  }

  loadProfile(): void {
    if (this.profileLoading()) return;
    this.profileLoading.set(true);
    this.profileError.set("");
    this.profileApi
      .getProfile()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.profileLoading.set(false)),
      )
      .subscribe({
        next: (profile) => this.profile.set(profile),
        error: (error: HttpErrorResponse) =>
          this.profileError.set(this.describeError(error)),
      });
  }

  loadUsers(): void {
    if (this.usersLoading()) return;
    this.usersLoading.set(true);
    this.usersError.set("");
    this.usersLoaded.set(false);
    this.usersApi
      .getUsers()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.usersLoading.set(false)),
      )
      .subscribe({
        next: (users) => {
          this.users.set(users);
          this.usersLoaded.set(true);
        },
        error: (error: HttpErrorResponse) =>
          this.usersError.set(this.describeError(error)),
      });
  }

  loadNotifications(): void {
    if (this.notificationsLoading()) return;
    this.notificationsLoading.set(true);
    this.notificationsError.set("");
    this.notificationsLoaded.set(false);
    this.notificationApi
      .getMine()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.notificationsLoading.set(false)),
      )
      .subscribe({
        next: (notifications) => {
          this.notifications.set(notifications);
          this.notificationsLoaded.set(true);
        },
        error: (error: HttpErrorResponse) =>
          this.notificationsError.set(this.describeError(error)),
      });
  }

  roleLabel(role: UserAccount["role"]): string {
    switch (role) {
      case "OWNER":
        return "Chủ trọ";
      case "STAFF":
        return "Nhân viên";
      case "TENANT":
        return "Người thuê";
      default:
        return "Khách hàng";
    }
  }

  private describeError(error: HttpErrorResponse): string {
    if (error.status === 401)
      return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    if (error.status === 403)
      return "Tài khoản không có quyền truy cập dữ liệu này.";
    if (error.status === 0)
      return "Không thể kết nối máy chủ. Hãy kiểm tra kết nối.";
    return "Chưa tải được dữ liệu. Vui lòng thử lại.";
  }
}
