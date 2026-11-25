export type RentalContractStatus =
    | "DRAFT"
    | "ACTIVE"
    | "ENDED"
    | "COMPLETED"
    | "CANCELLED";

export interface RentalContract {
    id: string;
    roomId: string;
    tenantProfileId: string;
    status: RentalContractStatus;
    startDate: string;
    endDate: string;
    rentAmount: number;
    depositRequired: number;
}

export interface CreateRentalContractRequest {
    roomId: string;
    tenantProfileId: string;
    startDate: string;
    endDate: string;
    rentAmount: number;
    depositRequired: number;
}

export interface DepositSummary {
    contractId: string;
    depositRequired: number;
    depositApplied: number;
    depositRemaining: number;
}

export interface CheckoutRequest {
    checkoutDate: string;
    deductionAmount: number;
    notes: string | null;
}

export interface CheckoutSettlement {
    id: string;
    contractId: string;
    contractStatus: string;
    checkoutDate: string;
    appliedDeposit: number;
    deductionAmount: number;
    refundDue: number;
    notes: string | null;
}
