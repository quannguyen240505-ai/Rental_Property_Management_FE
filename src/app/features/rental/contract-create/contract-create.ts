
import { CommonModule } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    inject,
    signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Router, RouterLink } from "@angular/router";
import { finalize } from "rxjs";

import { RentalService } from "../rental.service";
import { CreateRentalContractRequest } from "../rental.model";

@Component({
    selector: "app-contract-create",
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: "./contract-create.html",
    styleUrl: "./contract-create.css",
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContractCreate {
    private readonly rentalService = inject(RentalService);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);

    readonly roomId = signal("");
    readonly tenantProfileId = signal("");
    readonly startDate = signal("");
    readonly endDate = signal("");
    readonly rentAmount = signal<number | null>(null);
    readonly depositRequired = signal<number | null>(null);

    readonly saving = signal(false);
    readonly errorMessage = signal("");

    private readonly uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    updateAmount(
        field: "rent" | "deposit",
        value: string
    ): void {
        const amount = value.trim() === "" ? null : Number(value);

        if (field === "rent") {
            this.rentAmount.set(amount);
        } else {
            this.depositRequired.set(amount);
        }
    }

    createContract(): void {
        if (this.saving()) return;

        this.errorMessage.set("");

        const roomId = this.roomId().trim();
        const tenantId = this.tenantProfileId().trim();
        const startDate = this.startDate();
        const endDate = this.endDate();
        const rent = this.rentAmount();
        const deposit = this.depositRequired();

        if (
            !this.uuidPattern.test(roomId) ||
            !this.uuidPattern.test(tenantId)
        ) {
            this.errorMessage.set(
                "Mã phòng và mã hồ sơ người thuê phải là UUID hợp lệ."
            );
            return;
        }

        if (!startDate || !endDate) {
            this.errorMessage.set(
                "Vui lòng nhập ngày bắt đầu và ngày kết thúc."
            );
            return;
        }

        if (endDate <= startDate) {
            this.errorMessage.set(
                "Ngày kết thúc phải sau ngày bắt đầu."
            );
            return;
        }

        if (
            rent === null ||
            deposit === null ||
            !Number.isSafeInteger(rent) ||
            !Number.isSafeInteger(deposit) ||
            rent < 0 ||
            deposit < 0
        ) {
            this.errorMessage.set(
                "Tiền thuê và tiền cọc phải là số nguyên không âm hợp lệ."
            );
            return;
        }

        const payload: CreateRentalContractRequest = {
            roomId,
            tenantProfileId: tenantId,
            startDate,
            endDate,
            rentAmount: rent,
            depositRequired: deposit,
        };

        this.saving.set(true);

        this.rentalService
            .createContract(payload)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                finalize(() => this.saving.set(false))
            )
            .subscribe({
                next: (contract) => {
                    void this.router.navigate([
                        "/owner/contracts",
                        contract.id,
                    ]);
                },
                error: (error: HttpErrorResponse) => {
                    if (error.status === 400) {
                        this.errorMessage.set(
                            "Dữ liệu hợp đồng không hợp lệ. Vui lòng kiểm tra lại."
                        );
                    } else if (error.status === 401) {
                        this.errorMessage.set(
                            "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
                        );
                    } else if (error.status === 403) {
                        this.errorMessage.set(
                            "Bạn không có quyền tạo hợp đồng hoặc truy cập phòng này."
                        );
                    } else if (error.status === 404) {
                        this.errorMessage.set(
                            "Không tìm thấy hồ sơ người thuê hoặc tài nguyên liên quan."
                        );
                    } else if (error.status === 409) {
                        this.errorMessage.set(
                            "Phòng đã có hợp đồng ACTIVE trùng thời gian."
                        );
                    } else if (error.status === 503) {
                        this.errorMessage.set(
                            "Dịch vụ xác minh thông tin phòng chưa sẵn sàng."
                        );
                    } else if (error.status === 0) {
                        this.errorMessage.set(
                            "Không thể kết nối Backend."
                        );
                    } else {
                        this.errorMessage.set(
                            "Không thể tạo hợp đồng. Vui lòng thử lại."
                        );
                    }
                },
            });
    }
}
