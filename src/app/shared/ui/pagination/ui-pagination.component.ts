import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from "@angular/core";

/** Shared view-only pagination. Parent owns data source and current page. */
@Component({
  selector: "ui-pagination",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="ui-pagination" aria-label="Phân trang">
      <span class="ui-pagination__summary">
        Hiển thị <strong>{{ visibleCount() }}</strong> /
        <strong>{{ totalItems() }}</strong> {{ itemLabel() }}
      </span>
      <div class="ui-pagination__controls">
        <button
          type="button"
          aria-label="Trang trước"
          [disabled]="currentPage() <= 1"
          (click)="goTo(currentPage() - 1)"
        >
          ‹
        </button>
        <span
          >Trang <strong>{{ currentPage() }}</strong> / {{ totalPages() }}</span
        >
        <button
          type="button"
          aria-label="Trang sau"
          [disabled]="currentPage() >= totalPages()"
          (click)="goTo(currentPage() + 1)"
        >
          ›
        </button>
      </div>
    </nav>
  `,
  styleUrl: "./ui-pagination.component.css",
})
export class UiPaginationComponent {
  readonly page = input(1);
  readonly pageSize = input(10);
  readonly totalItems = input(0);
  readonly itemLabel = input("mục");
  readonly pageChange = output<number>();

  readonly totalPages = computed(() =>
    Math.max(
      1,
      Math.ceil(Math.max(0, this.totalItems()) / Math.max(1, this.pageSize())),
    ),
  );
  readonly currentPage = computed(() =>
    Math.min(this.totalPages(), Math.max(1, Math.trunc(this.page()) || 1)),
  );
  readonly visibleCount = computed(() => {
    const first = (this.currentPage() - 1) * Math.max(1, this.pageSize());
    return Math.max(0, Math.min(this.pageSize(), this.totalItems() - first));
  });

  goTo(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
      this.pageChange.emit(page);
    }
  }
}
