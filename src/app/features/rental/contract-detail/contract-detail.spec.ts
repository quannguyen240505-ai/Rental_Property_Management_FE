
import { TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { of, throwError } from "rxjs";
import { vi } from "vitest";

import { ContractDetail } from "./contract-detail";
import { RentalService } from "../rental.service";
import {
    RentalContract,
    DepositSummary,
    CheckoutSettlement,
} from "../rental.model";

describe("ContractDetail", () => {
    let component: ContractDetail;
    let rentalService: {
        getContractById: ReturnType<typeof vi.fn>;
        getDepositSummary: ReturnType<typeof vi.fn>;
        activateContract: ReturnType<typeof vi.fn>;
        checkoutContract: ReturnType<typeof vi.fn>;
        getSettlement: ReturnType<typeof vi.fn>;
    };

    const mockContract: RentalContract = {
        id: "contract-1",
        roomId: "room-1",
        tenantProfileId: "tenant-1",
        status: "DRAFT",
        startDate: "2026-12-01",
        endDate: "2027-12-01",
        rentAmount: 3500000,
        depositRequired: 7000000,
    };

    const mockDeposit: DepositSummary = {
        contractId: "contract-1",
        depositRequired: 7000000,
        depositApplied: 7000000,
        depositRemaining: 0,
    };

    const mockSettlement: CheckoutSettlement = {
        id: "settlement-1",
        contractId: "contract-1",
        contractStatus: "ENDED",
        checkoutDate: "2027-12-01",
        appliedDeposit: 7000000,
        deductionAmount: 500000,
        refundDue: 6500000,
        notes: null,
    };

    beforeEach(async () => {
        rentalService = {
            getContractById: vi.fn().mockReturnValue(of(mockContract)),
            getDepositSummary: vi.fn().mockReturnValue(of(mockDeposit)),
            activateContract: vi.fn().mockReturnValue(
                of({ ...mockContract, status: "ACTIVE" })
            ),
            checkoutContract: vi.fn().mockReturnValue(of(mockSettlement)),
            getSettlement: vi.fn().mockReturnValue(of(mockSettlement)),
        };

        await TestBed.configureTestingModule({
            imports: [ContractDetail],
            providers: [
                { provide: RentalService, useValue: rentalService },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            paramMap: {
                                get: (key: string) =>
                                    key === "id" ? "contract-1" : null,
                            },
                        },
                    },
                },
                {
                    provide: Router,
                    useValue: {},
                },
            ],
        })
            .overrideComponent(ContractDetail, {
                set: { template: "" },
            })
            .compileComponents();

        const fixture = TestBed.createComponent(ContractDetail);
        component = fixture.componentInstance;
    });

    it("should create component", () => {
        expect(component).toBeTruthy();
    });

    it("should load contract details", () => {
        component.ngOnInit();

        expect(rentalService.getContractById).toHaveBeenCalledWith(
            "contract-1"
        );
        expect(component.contract()).toEqual(mockContract);
    });

    it("should load deposit summary", () => {
        component.loadDepositSummary("contract-1");

        expect(rentalService.getDepositSummary).toHaveBeenCalledWith(
            "contract-1"
        );
        expect(component.depositSummary()).toEqual(mockDeposit);
    });

    it("should handle contract not found", () => {
        rentalService.getContractById.mockReturnValue(
            throwError(() => ({ status: 404 }))
        );

        component.loadContract("missing-id");

        expect(component.errorMessage()).toContain(
            "Không tìm thấy hợp đồng"
        );
    });

    it("should prevent activation when contract is not DRAFT", () => {
        component.contract.set({
            ...mockContract,
            status: "ACTIVE",
        });

        component.activateContract();

        expect(rentalService.activateContract).not.toHaveBeenCalled();
    });

    it("should activate DRAFT contract after confirmation", () => {
        component.contract.set(mockContract);

        const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

        component.activateContract();

        expect(rentalService.activateContract).toHaveBeenCalledWith(
            "contract-1"
        );
        expect(component.contract()?.status).toBe("ACTIVE");

        confirmSpy.mockRestore();
    });

    it("should prevent checkout when contract is DRAFT", () => {
        component.contract.set(mockContract);

        component.checkoutContract();

        expect(rentalService.checkoutContract).not.toHaveBeenCalled();
    });

    it("should checkout ACTIVE contract successfully", () => {
        component.contract.set({
            ...mockContract,
            status: "ACTIVE",
        });
        component.depositSummary.set(mockDeposit);
        component.checkoutDate.set("2027-12-01");
        component.deductionAmount.set(500000);

        const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

        component.checkoutContract();

        expect(rentalService.checkoutContract).toHaveBeenCalledOnce();
        expect(component.contract()?.status).toBe("ENDED");
        expect(component.settlement()?.refundDue).toBe(6500000);

        confirmSpy.mockRestore();
    });

    it("should reject deduction exceeding applied deposit", () => {
        component.contract.set({
            ...mockContract,
            status: "ACTIVE",
        });
        component.depositSummary.set(mockDeposit);
        component.checkoutDate.set("2027-12-01");
        component.deductionAmount.set(8000000);

        component.checkoutContract();

        expect(rentalService.checkoutContract).not.toHaveBeenCalled();
        expect(component.checkoutError()).not.toBe("");
    });

    it("should load settlement for ended contract", () => {
        component.loadSettlement("contract-1");

        expect(rentalService.getSettlement).toHaveBeenCalledWith(
            "contract-1"
        );
        expect(component.settlement()).toEqual(mockSettlement);
    });
});
