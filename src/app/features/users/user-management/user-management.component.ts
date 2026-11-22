import { DatePipe } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { finalize } from "rxjs";
import { UserManagementService } from "./user-management.service";
import { UserAccount, UserRole, UserStatus } from "./user-management.model";

type Panel = "create" | "edit" | "status" | "role" | "history" | null;
interface EditableFields {
  fullName: string;
  email: string;
  phone: string;
}
interface NewStaffFields extends EditableFields {
  username: string;
  password: string;
}

const emptyStaff = (): NewStaffFields => ({
  username: "",
  password: "",
  fullName: "",
  email: "",
  phone: "",
});
const emptyEdit = (): EditableFields => ({
  fullName: "",
  email: "",
  phone: "",
});

@Component({
  selector: "app-user-management",
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: "./user-management.component.html",
  styleUrl: "./user-management.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserManagementComponent implements OnInit {
  private readonly api = inject(UserManagementService);

  readonly users = signal<UserAccount[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly listError = signal("");
  readonly actionError = signal("");
  readonly success = signal("");
  readonly search = signal("");
  readonly showStaffPassword = signal(false);
  readonly roleFilter = signal<UserRole | "">("");
  readonly statusFilter = signal<UserStatus | "">("");
  readonly page = signal(1);
  readonly pageSize = 10;
  readonly panel = signal<Panel>(null);
  readonly selected = signal<UserAccount | null>(null);
  readonly roleHistory = signal<
    import("./user-management.model").RoleChangeHistory[]
  >([]);
  readonly historyLoading = signal(false);

  staffForm = emptyStaff();
  editForm = emptyEdit();
  roleReason = "";

  readonly filteredUsers = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    return this.users().filter(
      (user) =>
        (!this.roleFilter() || user.role === this.roleFilter()) &&
        (!this.statusFilter() || user.status === this.statusFilter()) &&
        (!query ||
          [
            user.username,
            user.fullName,
            user.email ?? "",
            user.phone ?? "",
          ].some((field) => field.toLocaleLowerCase().includes(query))),
    );
  });
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredUsers().length / this.pageSize)),
  );
  readonly pageUsers = computed(() =>
    this.filteredUsers().slice(
      (this.page() - 1) * this.pageSize,
      this.page() * this.pageSize,
    ),
  );
  readonly hasFilters = computed(() =>
    Boolean(this.search().trim() || this.roleFilter() || this.statusFilter()),
  );
  readonly activeCount = computed(
    () => this.users().filter((user) => user.status === "ACTIVE").length,
  );
  readonly staffCount = computed(
    () => this.users().filter((user) => user.role === "STAFF").length,
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.listError.set("");
    this.api
      .getUsers()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (accounts) => {
          this.users.set(accounts);
          this.page.set(
            Math.min(
              this.page(),
              Math.max(
                1,
                Math.ceil(this.filteredUsers().length / this.pageSize),
              ),
            ),
          );
          const currentId = this.selected()?.id;
          if (currentId)
            this.selected.set(accounts.find((x) => x.id === currentId) ?? null);
        },
        error: (err: HttpErrorResponse) =>
          this.listError.set(this.errorMessage(err)),
      });
  }

  onFilterChange(): void {
    this.page.set(1);
  }

  toggleStaffPassword(): void {
    this.showStaffPassword.update((value) => !value);
  }

  clearFilters(): void {
    this.search.set("");
    this.roleFilter.set("");
    this.statusFilter.set("");
    this.page.set(1);
  }

  openCreate(): void {
    this.clearMessages();
    this.staffForm = emptyStaff();
    this.showStaffPassword.set(false);
    this.selected.set(null);
    this.panel.set("create");
  }

  openEdit(user: UserAccount): void {
    if (user.role === "OWNER") return;
    this.clearMessages();
    this.selected.set(user);
    this.editForm = {
      fullName: user.fullName,
      email: user.email ?? "",
      phone: user.phone ?? "",
    };
    this.panel.set("edit");
  }

  openStatus(user: UserAccount): void {
    if (user.role === "OWNER") return;
    this.clearMessages();
    this.selected.set(user);
    this.panel.set("status");
  }

  openRole(user: UserAccount): void {
    if (user.role !== "CUSTOMER" && user.role !== "STAFF") return;
    this.clearMessages();
    this.selected.set(user);
    this.roleReason = "";
    this.panel.set("role");
  }

  openHistory(user: UserAccount): void {
    this.clearMessages();
    this.selected.set(user);
    this.roleHistory.set([]);
    this.panel.set("history");
    this.historyLoading.set(true);
    this.api
      .getRoleHistory(user.id)
      .pipe(finalize(() => this.historyLoading.set(false)))
      .subscribe({
        next: (items) => this.roleHistory.set(items),
        error: (err: HttpErrorResponse) =>
          this.actionError.set(this.errorMessage(err)),
      });
  }

  closePanel(): void {
    if (this.saving()) return;
    this.panel.set(null);
    this.selected.set(null);
    this.staffForm = emptyStaff();
    this.showStaffPassword.set(false);
    this.roleReason = "";
    this.actionError.set("");
  }

  createStaff(): void {
    if (this.saving()) return;
    const username = this.staffForm.username.trim();
    const password = this.staffForm.password;
    const fullName = this.staffForm.fullName.trim();
    const email = this.staffForm.email.trim();
    const phone = this.staffForm.phone.trim();
    if (!/^[A-Za-z0-9._-]{3,60}$/.test(username)) {
      this.actionError.set(
        "Tên đăng nhập cần 3–60 ký tự, chỉ gồm chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.",
      );
      return;
    }
    if (!fullName || fullName.length > 120) {
      this.actionError.set("Họ và tên bắt buộc, tối đa 120 ký tự.");
      return;
    }
    if (
      password.length < 10 ||
      !/[A-Za-z]/.test(password) ||
      !/\d/.test(password) ||
      new TextEncoder().encode(password).length > 72
    ) {
      this.actionError.set(
        "Mật khẩu cần ít nhất 10 ký tự, có chữ và số, tối đa 72 byte UTF-8.",
      );
      return;
    }
    if (!this.contactValid(email, phone)) return;

    this.submitChange(
      () =>
        this.api.createStaff({
          username,
          password,
          fullName,
          email: email || null,
          phone: phone || null,
          role: "STAFF",
        }),
      "Đã tạo tài khoản STAFF.",
    );
  }

  saveEdit(): void {
    const user = this.selected();
    if (!user || user.role === "OWNER" || this.saving()) return;
    const fullName = this.editForm.fullName.trim();
    const email = this.editForm.email.trim();
    const phone = this.editForm.phone.trim();
    if (!fullName || fullName.length > 120) {
      this.actionError.set("Họ và tên bắt buộc, tối đa 120 ký tự.");
      return;
    }
    if (!this.contactValid(email, phone)) return;
    this.submitChange(
      () =>
        this.api.updateUser(user.id, {
          fullName,
          email: email || null,
          phone: phone || null,
        }),
      "Đã cập nhật thông tin tài khoản.",
    );
  }

  confirmStatus(): void {
    const user = this.selected();
    if (!user || user.role === "OWNER" || this.saving()) return;
    const status: UserStatus = user.status === "ACTIVE" ? "LOCKED" : "ACTIVE";
    this.submitChange(
      () => this.api.changeStatus(user.id, status),
      status === "LOCKED" ? "Đã khóa tài khoản." : "Đã mở khóa tài khoản.",
    );
  }

  confirmRole(): void {
    const user = this.selected();
    if (
      !user ||
      (user.role !== "CUSTOMER" && user.role !== "STAFF") ||
      this.saving()
    )
      return;
    const reason = this.roleReason.trim();
    if (!reason || reason.length > 500) {
      this.actionError.set(
        "Vui lòng nhập lý do đổi vai trò (tối đa 500 ký tự).",
      );
      return;
    }
    const role = user.role === "CUSTOMER" ? "STAFF" : "CUSTOMER";
    this.submitChange(
      () =>
        this.api.changeRole(user.id, {
          role,
          reason,
          contractReference: null,
          contractStatusConfirmed: false,
        }),
      "Đã cập nhật vai trò. Phiên đăng nhập cũ của người dùng đã bị thu hồi.",
    );
  }

  setPage(next: number): void {
    if (next >= 1 && next <= this.totalPages()) this.page.set(next);
  }

  roleLabel(role: UserRole): string {
    return {
      OWNER: "Chủ trọ",
      STAFF: "Nhân viên",
      TENANT: "Người thuê",
      CUSTOMER: "Khách hàng",
    }[role];
  }
  statusLabel(status: UserStatus): string {
    return status === "ACTIVE" ? "Hoạt động" : "Đã khóa";
  }

  private contactValid(email: string, phone: string): boolean {
    if (
      email &&
      (email.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    ) {
      this.actionError.set("Email chưa hợp lệ hoặc vượt quá 160 ký tự.");
      return false;
    }
    if (phone.length > 25) {
      this.actionError.set("Số điện thoại tối đa 25 ký tự.");
      return false;
    }
    return true;
  }

  private submitChange(
    action: () => import("rxjs").Observable<UserAccount>,
    message: string,
  ): void {
    this.saving.set(true);
    this.actionError.set("");
    action()
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.panel.set(null);
          this.selected.set(null);
          this.staffForm = emptyStaff();
          this.roleReason = "";
          this.success.set(message);
          this.load();
        },
        error: (err: HttpErrorResponse) =>
          this.actionError.set(this.errorMessage(err)),
      });
  }

  private clearMessages(): void {
    this.actionError.set("");
    this.success.set("");
  }

  private errorMessage(error: HttpErrorResponse): string {
    if (error.status === 0)
      return "Không thể kết nối máy chủ. Kiểm tra API Gateway.";
    if (error.status === 401)
      return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    if (error.status === 403)
      return "Bạn không có quyền thực hiện thao tác này.";
    if (error.status === 404) return "Không tìm thấy tài khoản.";
    if (
      error.status === 409 &&
      error.error?.code === "RENTAL_INTEGRATION_REQUIRED"
    ) {
      return "Đổi vai trò TENANT cần tích hợp xác minh hợp đồng.";
    }
    if (error.status === 409)
      return "Dữ liệu bị trùng hoặc xung đột với trạng thái hiện tại.";
    if (error.status === 400)
      return "Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.";
    if (error.status >= 500) return "Máy chủ đang gặp sự cố. Vui lòng thử lại.";
    return "Không thực hiện được thao tác. Vui lòng thử lại.";
  }
}
