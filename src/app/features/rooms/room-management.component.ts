import { DecimalPipe, DatePipe } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { finalize } from "rxjs";
import { UiButtonComponent, UiPaginationComponent, UiSearchInputComponent } from "../../shared/ui";
import { PropertyService } from "../properties/property.service";
import { PropertyItem } from "../properties/property.model";
import { RoomItem, RoomStatus, UpdateRoomRequest } from "./room.model";
import { RoomService } from "./room.service";

type Panel = "create" | "edit" | "detail" | null;
interface RoomForm {
  code: string;
  title: string;
  description: string;
  floorNumber: number | null;
  areaM2: number | null;
  monthlyRent: number | null;
}
const emptyForm = (): RoomForm => ({
  code: "", title: "", description: "", floorNumber: null, areaM2: null, monthlyRent: null,
});

@Component({
  selector: "app-room-management",
  standalone: true,
  imports: [FormsModule, RouterLink, DecimalPipe, DatePipe, UiButtonComponent, UiPaginationComponent, UiSearchInputComponent],
  templateUrl: "./room-management.component.html",
  styleUrl: "./room-management.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomManagementComponent implements OnInit {
  private readonly roomApi = inject(RoomService);
  private readonly propertyApi = inject(PropertyService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly properties = signal<PropertyItem[]>([]);
  readonly propertyId = signal("");
  readonly rooms = signal<RoomItem[]>([]);
  readonly loadingProperties = signal(false);
  readonly loadingRooms = signal(false);
  readonly saving = signal(false);
  readonly detailLoading = signal(false);
  readonly error = signal("");
  readonly actionError = signal("");
  readonly notice = signal("");
  readonly keyword = signal("");
  readonly statusFilter = signal<RoomStatus | "">("");
  readonly page = signal(1);
  readonly pageSize = 6;
  readonly panel = signal<Panel>(null);
  readonly selected = signal<RoomItem | null>(null);
  form: RoomForm = emptyForm();

  readonly currentProperty = computed(() =>
    this.properties().find((item) => item.id === this.propertyId()) ?? null,
  );
  readonly filtered = computed(() => {
    const needle = this.keyword().trim().toLocaleLowerCase("vi");
    return this.rooms().filter((room) =>
      (!this.statusFilter() || room.status === this.statusFilter()) &&
      (!needle || [room.code, room.title, room.description ?? ""].some((item) =>
        item.toLocaleLowerCase("vi").includes(needle))),
    );
  });
  readonly visible = computed(() => this.filtered().slice((this.page() - 1) * this.pageSize,
    this.page() * this.pageSize));
  readonly availableCount = computed(() => this.rooms().filter((room) => room.status === "AVAILABLE").length);
  readonly publishedCount = computed(() => this.rooms().filter((room) => room.published).length);

  ngOnInit(): void {
    this.loadProperties();
  }

  loadProperties(): void {
    if (this.loadingProperties()) return;
    this.loadingProperties.set(true);
    this.error.set("");
    this.propertyApi.list()
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loadingProperties.set(false)))
      .subscribe({
        next: (items) => {
          this.properties.set(items);
          const preferred = this.route.snapshot.queryParamMap.get("propertyId");
          const previous = this.propertyId();
          const selectedId = [preferred, previous].find((id) => id && items.some((item) => item.id === id));
          this.propertyId.set(selectedId || items[0]?.id || "");
          this.loadRooms();
        },
        error: (err: HttpErrorResponse) => this.error.set(this.describeError(err)),
      });
  }

  changeProperty(id: string): void {
    if (!this.properties().some((item) => item.id === id)) return;
    this.propertyId.set(id);
    this.rooms.set([]);
    this.clearFilters();
    this.notice.set("");
    this.closePanel();
    this.loadRooms();
  }

  loadRooms(): void {
    if (!this.propertyId() || this.loadingRooms()) return;
    this.loadingRooms.set(true);
    this.error.set("");
    const requestedId = this.propertyId();
    this.roomApi.listByProperty(requestedId)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loadingRooms.set(false)))
      .subscribe({
        next: (rooms) => {
          if (this.propertyId() !== requestedId) return;
          this.rooms.set(rooms);
          this.clampPage();
        },
        error: (err: HttpErrorResponse) => {
          if (this.propertyId() === requestedId) this.error.set(this.describeError(err));
        },
      });
  }

  setKeyword(value: string): void { this.keyword.set(value); this.page.set(1); }
  setStatus(value: string): void { this.statusFilter.set(value as RoomStatus | ""); this.page.set(1); }
  clearFilters(): void { this.keyword.set(""); this.statusFilter.set(""); this.page.set(1); }
  setPage(page: number): void {
    const count = Math.max(1, Math.ceil(this.filtered().length / this.pageSize));
    if (page >= 1 && page <= count) this.page.set(page);
  }
  private clampPage(): void {
    this.page.set(Math.min(this.page(), Math.max(1, Math.ceil(this.filtered().length / this.pageSize))));
  }

  openCreate(): void {
    if (!this.propertyId()) return;
    this.notice.set(""); this.actionError.set(""); this.selected.set(null);
    this.form = emptyForm(); this.panel.set("create");
  }
  openEdit(room: RoomItem): void {
    this.notice.set(""); this.actionError.set(""); this.selected.set(room);
    this.form = { code: room.code, title: room.title, description: room.description ?? "",
      floorNumber: room.floorNumber, areaM2: room.areaM2, monthlyRent: room.monthlyRent };
    this.panel.set("edit");
  }
  openDetail(room: RoomItem): void {
    this.actionError.set(""); this.selected.set(room); this.panel.set("detail");
    this.detailLoading.set(true);
    this.roomApi.getById(room.id)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.detailLoading.set(false)))
      .subscribe({ next: (item) => this.selected.set(item),
        error: (err: HttpErrorResponse) => this.actionError.set(this.describeError(err)) });
  }
  closePanel(): void {
    if (this.saving()) return;
    this.panel.set(null); this.selected.set(null); this.actionError.set("");
  }

  save(): void {
    if (this.saving()) return;
    const request = this.validateForm();
    if (!request) return;
    const editing = this.panel() === "edit";
    const room = this.selected();
    if (editing && !room) return;
    this.saving.set(true);
    this.actionError.set("");
    const action = editing && room
      ? this.roomApi.update(room.id, request)
      : this.roomApi.create({ ...request, propertyId: this.propertyId() });
    action.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.panel.set(null); this.selected.set(null);
          this.notice.set(editing ? "Đã cập nhật thông tin phòng." : "Đã tạo phòng thành công (chưa công khai). ");
          this.clearFilters(); this.loadRooms();
        },
        error: (err: HttpErrorResponse) => this.actionError.set(this.describeError(err)),
      });
  }

  togglePublished(room: RoomItem): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.actionError.set(""); this.notice.set("");
    this.roomApi.setPublished(room.id, !room.published)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.saving.set(false)))
      .subscribe({
        next: (updated) => {
          this.rooms.update((items) => items.map((item) => item.id === updated.id ? updated : item));
          if (this.selected()?.id === updated.id) this.selected.set(updated);
          this.notice.set(updated.published ? "Đã công khai phòng." : "Đã ẩn phòng khỏi danh sách công khai.");
        },
        error: (err: HttpErrorResponse) => this.error.set(this.describeError(err)),
      });
  }

  statusName(status: RoomStatus): string {
    switch (status) {
      case "AVAILABLE": return "Còn trống";
      case "RESERVED_PENDING": return "Đang chờ giữ";
      case "RESERVED": return "Đã giữ";
      case "OCCUPIED": return "Đang thuê";
    }
  }

  private validateForm(): UpdateRoomRequest | null {
    const code = this.form.code.trim(), title = this.form.title.trim();
    const description = this.form.description.trim();
    const floor = this.form.floorNumber, area = this.form.areaM2, rent = this.form.monthlyRent;
    if (!code || code.length > 30) { this.actionError.set("Mã phòng bắt buộc, tối đa 30 ký tự."); return null; }
    if (!title || title.length > 150) { this.actionError.set("Tên phòng bắt buộc, tối đa 150 ký tự."); return null; }
    if (description.length > 2000) { this.actionError.set("Mô tả tối đa 2000 ký tự."); return null; }
    if (floor !== null && (!Number.isInteger(floor) || floor < 0)) {
      this.actionError.set("Tầng phải là số nguyên không âm."); return null;
    }
    if (area !== null && (!Number.isFinite(area) || area <= 0 || area >= 1000000 || Math.round(area * 100) !== area * 100)) {
      this.actionError.set("Diện tích phải lớn hơn 0 và có tối đa 2 số thập phân."); return null;
    }
    if (rent === null || !Number.isSafeInteger(rent) || rent < 0) {
      this.actionError.set("Giá thuê phải là số nguyên không âm."); return null;
    }
    return { code, title, description: description || null, floorNumber: floor, areaM2: area, monthlyRent: rent };
  }

  private describeError(error: HttpErrorResponse): string {
    if (error.status === 401) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    if (error.status === 403) return "Tài khoản không có quyền quản lý phòng tại khu trọ này.";
    if (error.status === 404) return "Không tìm thấy phòng hoặc khu trọ.";
    if (error.status === 409) return "Mã phòng bị trùng hoặc trạng thái phòng không cho phép thao tác.";
    if (error.status === 400) return "Thông tin phòng chưa hợp lệ. Vui lòng kiểm tra lại.";
    if (error.status === 0 || error.status === 502 || error.status === 503)
      return "Không kết nối được Property Service. Kiểm tra API Gateway/Eureka/Property Service.";
    return "Không thể thực hiện thao tác. Vui lòng thử lại.";
  }
}
