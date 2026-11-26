import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";

import {
    RentalContract,
    CreateRentalContractRequest,
    DepositSummary,
    CheckoutRequest,
    CheckoutSettlement,
} from "./rental.model";

@Injectable({
    providedIn: "root",
})
export class RentalService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = "/api/contracts";

    // Lấy danh sách hợp đồng
    getContracts() {
        return this.http.get<RentalContract[]>(this.baseUrl);
    }

    // Lấy chi tiết hợp đồng
    getContractById(id: string) {
        return this.http.get<RentalContract>(
            `${this.baseUrl}/${encodeURIComponent(id)}`,
        );
    }

    // Tạo hợp đồng DRAFT
    createContract(payload: CreateRentalContractRequest) {
        return this.http.post<RentalContract>(
            this.baseUrl,
            payload,
        );
    }

    // Xem tổng tiền cọc
    getDepositSummary(id: string) {
        return this.http.get<DepositSummary>(
            `${this.baseUrl}/${encodeURIComponent(id)}/deposit-summary`,
        );
    }

    // Kích hoạt hợp đồng
    activateContract(id: string) {
        return this.http.post<RentalContract>(
            `${this.baseUrl}/${encodeURIComponent(id)}/activate`,
            {},
        );
    }

    // Checkout hợp đồng
    checkoutContract(id: string, payload: CheckoutRequest) {
        return this.http.post<CheckoutSettlement>(
            `${this.baseUrl}/${encodeURIComponent(id)}/checkout`,
            payload,
        );
    }

    // Xem kết quả quyết toán
    getSettlement(id: string) {
        return this.http.get<CheckoutSettlement>(
            `${this.baseUrl}/${encodeURIComponent(id)}/settlement`,
        );
    }
}
