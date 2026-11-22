import { HttpClient } from "@angular/common/http";
import { Injectable, inject, signal } from "@angular/core";
import { Observable, tap } from "rxjs";
import { UserNotification } from "./notification.model";

@Injectable({ providedIn: "root" })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = "/api/notifications";

  readonly unreadCount = signal(0);

  getMine(): Observable<UserNotification[]> {
    return this.http
      .get<UserNotification[]>(`${this.endpoint}/me`)
      .pipe(
        tap((items) =>
          this.unreadCount.set(items.filter((item) => !item.read).length),
        ),
      );
  }

  markAsRead(id: string): Observable<UserNotification> {
    return this.http
      .patch<UserNotification>(
        `${this.endpoint}/${encodeURIComponent(id)}/read`,
        {},
      )
      .pipe(
        tap((updated) => {
          if (updated.read) {
            this.unreadCount.update((count) => Math.max(0, count - 1));
          }
        }),
      );
  }

  clearUnreadCount(): void {
    this.unreadCount.set(0);
  }
}
