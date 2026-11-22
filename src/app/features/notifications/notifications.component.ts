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
import { finalize } from "rxjs";
import { UserNotification, NotificationCategory } from "./notification.model";
import { NotificationService } from "./notification.service";

type DisplayFilter = "all" | "unread";

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  SYSTEM: "Hệ thống",
  PROPERTY: "Khu trọ",
  RENTAL: "Hợp đồng",
  BILLING: "Hóa đơn",
  PAYMENT: "Thanh toán",
};

@Component({
  selector: "app-notifications",
  standalone: true,
  imports: [DatePipe],
  templateUrl: "./notifications.component.html",
  styleUrl: "./notifications.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsComponent implements OnInit {
  private readonly api = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly notifications = signal<UserNotification[]>([]);
  readonly loading = signal(false);
  readonly busyId = signal<string | null>(null);
  readonly error = signal("");
  readonly actionError = signal("");
  readonly filter = signal<DisplayFilter>("all");

  readonly unreadCount = computed(
    () => this.notifications().filter((item) => !item.read).length,
  );
  readonly visible = computed(() =>
    this.filter() === "unread"
      ? this.notifications().filter((item) => !item.read)
      : this.notifications(),
  );

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    if (this.loading() || this.busyId()) return;
    this.loading.set(true);
    this.error.set("");
    this.actionError.set("");

    this.api
      .getMine()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (items) => this.notifications.set(items),
        error: (error: HttpErrorResponse) =>
          this.error.set(this.describeError(error)),
      });
  }

  setFilter(value: DisplayFilter): void {
    this.filter.set(value);
    this.actionError.set("");
  }

  markRead(item: UserNotification): void {
    if (item.read || this.busyId() || this.loading()) return;
    this.busyId.set(item.id);
    this.actionError.set("");

    this.api
      .markAsRead(item.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.busyId.set(null)),
      )
      .subscribe({
        next: (updated) =>
          this.notifications.update((items) =>
            items.map((existing) =>
              existing.id === item.id ? updated : existing,
            ),
          ),
        error: (error: HttpErrorResponse) =>
          this.actionError.set(this.describeError(error)),
      });
  }

  categoryLabel(category: NotificationCategory): string {
    return CATEGORY_LABELS[category] ?? "Thông báo";
  }

  private describeError(error: HttpErrorResponse): string {
    if (error.status === 0)
      return "Không thể kết nối máy chủ. Vui lòng thử lại.";
    if (error.status === 401)
      return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    if (error.status === 403)
      return "Bạn không có quyền thực hiện thao tác này.";
    if (error.status === 404)
      return "Thông báo không tồn tại hoặc không thuộc tài khoản của bạn.";
    if (error.status === 502 || error.status === 503)
      return "Dịch vụ thông báo đang tạm gián đoạn. Vui lòng thử lại.";
    return "Không thể xử lý thông báo. Vui lòng thử lại.";
  }
}
