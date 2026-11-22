import { Component, inject, OnInit, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { AuthService } from "../../core/auth/auth.service";
interface UserProfile {
  username: string;
  fullName: string;
  email: string | null;
  role: string;
  status: string;
}
@Component({
  selector: "app-profile",
  standalone: true,
  template: `<h1>Tài khoản</h1>
    @if (user()) {
      <div class="card">
        <h2>{{ user()!.fullName }}</h2>
        <p>Username: {{ user()!.username }}</p>
        <p>Vai trò: {{ user()!.role }}</p>
        <p>Trạng thái: {{ user()!.status }}</p>
      </div>
    } @else {
      <p>{{ message() }}</p>
    }`,
})
export class ProfileComponent implements OnInit {
  private http = inject(HttpClient);
  user = signal<UserProfile | null>(null);
  message = signal("Đang tải...");
  ngOnInit() {
    this.http
      .get<UserProfile>("/api/users/me")
      .subscribe({
        next: (x) => this.user.set(x),
        error: () => this.message.set("Không tải được thông tin tài khoản."),
      });
  }
}
