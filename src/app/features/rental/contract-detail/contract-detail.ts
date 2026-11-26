import { CommonModule } from "@angular/common";
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
import { ActivatedRoute, RouterLink } from "@angular/router";
import { finalize } from "rxjs";

import {
    RentalContract,
    DepositSummary,
    CheckoutRequest,
    CheckoutSettlement,
} from "../rental.model";
import { RentalService } from "../rental.service";


@Component({
    selector: "app-contract-detail",
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: "./contract-detail.html",
    styleUrl: "./contract-detail.css",
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContractDetail implements OnInit {
    private readonly rentalService = inject(RentalService);
    private readonly route = inject(ActivatedRoute);
    private readonly destroyRef = inject(DestroyRef);

    readonly contract = signal<RentalContract | null>(null);
    readonly loading = signal(false);
    readonly errorMessage = signal("");
    readonly depositSummary = signal<DepositSummary | null>(null);
    readonly depositLoading = signal(false);
    readonly depositError = signal("");
    readonly activating = signal(false);
    readonly activateError = signal("");
    readonly checkoutDate = signal("");
    readonly deductionAmount = signal(0);
    readonly checkoutNotes = signal("");

    readonly checkingOut = signal(false);
    readonly checkoutError = signal("");
    readonly checkoutSuccess = signal("");
    readonly settlementLoading = signal(false);
    readonly settlementError = signal("");

    readonly settlement = signal<CheckoutSettlement | null>(null);

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get("id");

        if (!id) {
            this.errorMessage.set("Không tìm thấy mã hợp đồng.");
            return;
        }

        this.loadContract(id);
    }

    loadContract(id: string): void {
        this.loading.set(true);
        this.errorMessage.set("");
        this.contract.set(null);

        this.rentalService
            .getContractById(id)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                finalize(() => this.loading.set(false)),
            )
            .subscribe({
                next: (data) => {
                    this.contract.set(data);
                    this.loadDepositSummary(data.id);

                    if (data.status === "ENDED") {
                        this.loadSettlement(data.id);
                    }
                },
                error: (error: HttpErrorResponse) => {
                    if (error.status === 404) {
                        this.errorMessage.set("Không tìm thấy hợp đồng.");
                    } else if (error.status === 401) {
                        this.errorMessage.set("Phiên đăng nhập đã hết hạn.");
                    } else if (error.status === 403) {
                        this.errorMessage.set("Bạn không có quyền xem hợp đồng.");
                    } else if (error.status === 0) {
                        this.errorMessage.set("Không thể kết nối Backend.");
                    } else {
                        this.errorMessage.set("Không thể tải chi tiết hợp đồng.");
                    }
                },
            });
    }
    loadDepositSummary(id: string): void {
        this.depositLoading.set(true);
        this.depositError.set("");

        this.rentalService
            .getDepositSummary(id)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                finalize(() => this.depositLoading.set(false)),
            )
            .subscribe({
                next: (data) => this.depositSummary.set(data),
                error: () => {
                    this.depositError.set("Không thể tải thông tin tiền cọc.");
                },
            });
    }

    activateContract(): void {
        const current = this.contract();

        if (!current || current.status !== "DRAFT" || this.activating()) {
            return;
        }

        const confirmed = window.confirm(
            "Bạn có chắc chắn muốn kích hoạt hợp đồng này?\n\n" +
            "Thao tác này sẽ thay đổi trạng thái hợp đồng trong hệ thống."
        );

        if (!confirmed) {
            return;
        }

        this.activating.set(true);
        this.activateError.set("");

        this.rentalService
            .activateContract(current.id)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                finalize(() => this.activating.set(false))
            )
            .subscribe({
                next: (updatedContract) => {
                    this.contract.set(updatedContract);
                    this.loadDepositSummary(updatedContract.id);
                },
                error: (error: HttpErrorResponse) => {
                    if (error.status === 400 || error.status === 409) {
                        this.activateError.set(
                            "Không thể kích hoạt hợp đồng. Vui lòng kiểm tra điều kiện kích hoạt và tiền cọc."
                        );
                    } else if (error.status === 401) {
                        this.activateError.set("Phiên đăng nhập đã hết hạn.");
                    } else if (error.status === 403) {
                        this.activateError.set("Bạn không có quyền kích hoạt hợp đồng.");
                    } else if (error.status === 503) {
                        this.activateError.set(
                            "Dịch vụ kiểm tra điều kiện kích hoạt hiện chưa sẵn sàng."
                        );
                    } else {
                        this.activateError.set(
                            "Kích hoạt hợp đồng thất bại. Vui lòng thử lại."
                        );
                    }
                },
            });
    }

    checkoutContract(): void {
        const current = this.contract();

        // Chỉ hợp đồng ACTIVE mới được checkout
        if (!current || current.status !== "ACTIVE" || this.checkingOut()) {
            return;
        }

        const date = this.checkoutDate();
        const deduction = this.deductionAmount();
        const notes = this.checkoutNotes().trim();

        if (!date || date < current.startDate) {
            this.checkoutError.set("Ngày trả phòng không hợp lệ.");
            return;
        }

        if (
            !Number.isSafeInteger(deduction) ||
            deduction < 0 ||
            !this.depositSummary() ||
            deduction > this.depositSummary()!.depositApplied
        ) {
            this.checkoutError.set("Số tiền khấu trừ không hợp lệ.");
            return;
        }

        if (notes.length > 1000) {
            this.checkoutError.set("Ghi chú không được vượt quá 1000 ký tự.");
            return;
        }

        const confirmed = window.confirm(
            "Bạn có chắc chắn muốn trả phòng và quyết toán hợp đồng này?"
        );

        if (!confirmed) return;

        const payload: CheckoutRequest = {
            checkoutDate: date,
            deductionAmount: deduction,
            notes: notes || null,
        };

        this.checkingOut.set(true);
        this.checkoutError.set("");
        this.checkoutSuccess.set("");

        this.rentalService
            .checkoutContract(current.id, payload)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                finalize(() => this.checkingOut.set(false))
            )
            .subscribe({
                next: (result) => {
                    this.settlement.set(result);
                    this.contract.set({
                        ...current,
                        status: "ENDED",
                    });
                    this.checkoutSuccess.set(
                        "Trả phòng và quyết toán hợp đồng thành công."
                    );
                },
                error: (error: HttpErrorResponse) => {
                    if (error.status === 400) {
                        this.checkoutError.set(
                            "Thông tin trả phòng không hợp lệ."
                        );
                    } else if (error.status === 409) {
                        this.checkoutError.set(
                            "Hợp đồng không đủ điều kiện checkout hoặc số tiền khấu trừ không hợp lệ."
                        );
                    } else if (error.status === 401 || error.status === 403) {
                        this.checkoutError.set(
                            "Phiên đăng nhập hết hạn hoặc bạn không có quyền thực hiện."
                        );
                    } else {
                        this.checkoutError.set(
                            "Checkout thất bại. Vui lòng kiểm tra lại."
                        );
                    }
                },
            });
    }

    loadSettlement(id: string): void {
        this.settlementLoading.set(true);
        this.settlementError.set("");
        this.settlement.set(null);

        this.rentalService
            .getSettlement(id)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                finalize(() => this.settlementLoading.set(false)),
            )
            .subscribe({
                next: (data) => {
                    this.settlement.set(data);
                },
                error: (error: HttpErrorResponse) => {
                    if (error.status === 404) {
                        this.settlementError.set(
                            "Chưa tìm thấy kết quả quyết toán của hợp đồng."
                        );
                    } else {
                        this.settlementError.set(
                            "Không thể tải kết quả quyết toán."
                        );
                    }
                },
            });
    }
}
