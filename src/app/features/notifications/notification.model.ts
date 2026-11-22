export type NotificationCategory =
  "SYSTEM" | "PROPERTY" | "RENTAL" | "BILLING" | "PAYMENT";

export interface UserNotification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  read: boolean;
  createdAt: string;
  readAt: string | null;
}
