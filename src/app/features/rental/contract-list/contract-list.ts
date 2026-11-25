import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { HttpErrorResponse } from "@angular/common/http";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { finalize } from "rxjs";

import { RentalContract } from "../rental.model";
import { RentalService } from "../rental.service";

@Component({
  selector: "app-contract-list",
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./contract-list.html",
  styleUrl: "./contract-list.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContractList implements OnInit {
  private readonly rentalService = inject(RentalService);
  private readonly destroyRef = inject(DestroyRef);

  readonly contracts = signal<RentalContract[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal("");

  ngOnInit(): void {
    this.loadContracts();
  }

  loadContracts(): void {
    if (this.loading()) return;

    this.loading.set(true);
    this.errorMessage.set("");

    this.rentalService
      .getContracts()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (data) => this.contracts.set(data),
        error: (error: HttpErrorResponse) => {
          if (error.status === 401) {
            this.errorMessage.set(
              "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
            );
          } else if (error.status === 403) {
            this.errorMessage.set(
              "Bạn không có quyền xem danh sách hợp đồng.",
            );
          } else if (error.status === 0) {
            this.errorMessage.set(
              "Không thể kết nối máy chủ. Vui lòng kiểm tra Backend.",
            );
          } else {
            this.errorMessage.set(
              "Không thể tải danh sách hợp đồng. Vui lòng thử lại.",
            );
          }
        },
      });
  }
}
