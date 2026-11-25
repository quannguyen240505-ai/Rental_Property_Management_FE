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
import { FormsModule } from "@angular/forms";
import { finalize } from "rxjs";
import {
  UiButtonComponent,
  UiCardComponent,
  UiPaginationComponent,
  UiSearchInputComponent,
} from "../../shared/ui";
import {
  clampPage,
  paginateItems,
  searchItems,
} from "../../shared/utils/list-query";
import { PropertyService } from "./property.service";
import { CreatePropertyRequest, PropertyItem } from "./property.model";

type Panel = "create" | "detail" | null;
type PropertyForm = { name: string; address: string; description: string; contactPhone: string };
const emptyForm = (): PropertyForm => ({
  name: "",
  address: "",
  description: "",
  contactPhone: "",
});

@Component({
  selector: "app-property-management",
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    UiButtonComponent,
    UiCardComponent,
    UiPaginationComponent,
    UiSearchInputComponent,
  ],
  templateUrl: "./property-management.component.html",
  styleUrl: "./property-management.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyManagementComponent implements OnInit {
  private readonly propertyApi = inject(PropertyService);
  private readonly destroyRef = inject(DestroyRef);

  readonly properties = signal<PropertyItem[]>([]);
  readonly loaded = signal(false);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly detailLoading = signal(false);
  readonly error = signal("");
  readonly formError = signal("");
  readonly detailError = signal("");
  readonly notice = signal("");
  readonly query = signal("");
  readonly page = signal(1);
  readonly panel = signal<Panel>(null);
  readonly selected = signal<PropertyItem | null>(null);
  readonly pageSize = 6;
  form: PropertyForm = emptyForm();

  readonly filteredProperties = computed(() =>
    searchItems(this.properties(), this.query(), (item) => [
      item.name,
      item.address,
      item.description,
      item.contactPhone,
    ]),
  );
  readonly pageItems = computed(() =>
    paginateItems(this.filteredProperties(), this.page(), this.pageSize),
  );
  readonly lastUpdated = computed(() =>
    [...this.properties()]
      .filter((item) => !!item.updatedAt)
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0]
      ?.updatedAt ?? null,
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set("");
    this.propertyApi
      .list()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (rows) => {
          this.properties.set(rows);
          this.loaded.set(true);
          this.page.set(clampPage(this.page(), this.filteredProperties().length, this.pageSize));
        },
        error: (err: HttpErrorResponse) => {
          this.loaded.set(false);
          this.error.set(this.errorText(err));
        },
      });
  }

  setQuery(value: string): void {
    this.query.set(value);
    this.page.set(1);
  }

  setPage(next: number): void {
    this.page.set(clampPage(next, this.filteredProperties().length, this.pageSize));
  }

  openCreate(): void {
    this.notice.set("");
    this.formError.set("");
    this.form = emptyForm();
    this.panel.set("create");
  }

  openDetail(row: PropertyItem): void {
    this.notice.set("");
    this.detailError.set("");
    this.selected.set(row);
    this.panel.set("detail");
    this.detailLoading.set(true);
    this.propertyApi
      .getById(row.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.detailLoading.set(false)),
      )
      .subscribe({
        next: (item) => this.selected.set(item),
        error: (err: HttpErrorResponse) => this.detailError.set(this.errorText(err)),
      });
  }

  closePanel(): void {
    if (this.saving()) return;
    this.panel.set(null);
    this.selected.set(null);
    this.detailError.set("");
    this.formError.set("");
  }

  submitCreate(): void {
    if (this.saving()) return;
    const name = this.form.name.trim();
    const address = this.form.address.trim();
    const description = this.form.description.trim();
    const contactPhone = this.form.contactPhone.trim();

    if (!name || name.length > 150) {
      this.formError.set("Tên khu trọ bắt buộc, tối đa 150 ký tự.");
      return;
    }
    if (!address || address.length > 255) {
      this.formError.set("Địa chỉ bắt buộc, tối đa 255 ký tự.");
      return;
    }
    if (contactPhone && (contactPhone.length > 20 || !/^[0-9+().\s-]+$/.test(contactPhone))) {
      this.formError.set("Số liên hệ không hợp lệ hoặc dài hơn 20 ký tự.");
      return;
    }

    const payload: CreatePropertyRequest = {
      name,
      address,
      description: description || null,
      contactPhone: contactPhone || null,
    };
    this.formError.set("");
    this.saving.set(true);
    this.propertyApi
      .create(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          this.panel.set(null);
          this.form = emptyForm();
          this.query.set("");
          this.page.set(1);
          this.notice.set("Đã tạo khu trọ thành công.");
          this.load();
        },
        error: (err: HttpErrorResponse) => this.formError.set(this.errorText(err)),
      });
  }

  private errorText(err: HttpErrorResponse): string {
    if (err.status === 401) return "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
    if (err.status === 403) return "Bạn không có quyền thao tác khu trọ này.";
    if (err.status === 404) return "Không tìm thấy khu trọ được yêu cầu.";
    if (err.status === 0 || err.status === 502 || err.status === 503)
      return "Không kết nối được Property Service. Kiểm tra API Gateway và cổng 8082.";
    if (err.status === 400) return "Dữ liệu chưa hợp lệ. Kiểm tra tên và địa chỉ khu trọ.";
    return "Thao tác chưa thành công. Vui lòng thử lại.";
  }
}
