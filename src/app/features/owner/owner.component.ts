import { Component, inject, OnInit, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { AuthService } from "../../core/auth/auth.service";
interface User {
  id: string;
  username: string;
  fullName: string;
  role: string;
  status: string;
}
@Component({
  selector: "app-owner",
  standalone: true,
  template: `<h1>Quản trị OWNER</h1>
    <p class="muted">
      Tuần 1: danh sách tài khoản. Giao diện này chỉ dành cho phần Auth/User của
      Quân. Các phần nghiệp vụ sẽ được tích hợp bằng PR khác.
    </p>
    @if (error()) {
      <p class="error">{{ error() }}</p>
    }
    <div class="card">
      <h2>Tài khoản hệ thống</h2>
      @for (u of users(); track u.id) {
        <p>
          {{ u.username }} — {{ u.fullName }}
          <span class="tag">{{ u.role }}</span> — {{ u.status }}
        </p>
      } @empty {
        <p>Chưa có tài khoản hoặc chưa kết nối Auth Service.</p>
      }
    </div>`,
})
export class OwnerComponent implements OnInit {
  private http = inject(HttpClient);
  users = signal<User[]>([]);
  error = signal("");
  ngOnInit() {
    this.http.get<User[]>("/api/users").subscribe({
      next: (r) => this.users.set(r),
      error: () => this.error.set("Không thể tải danh sách tài khoản."),
    });
  }
}
