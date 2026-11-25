
import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { of, Subject, throwError } from "rxjs";
import { vi } from "vitest";

import { ContractCreate } from "./contract-create";
import { RentalService } from "../rental.service";
import { RentalContract } from "../rental.model";

describe("ContractCreate", () => {
    let component: ContractCreate;
    let createContractMock: ReturnType<typeof vi.fn>;
    let navigateMock: ReturnType<typeof vi.fn>;

    const roomId = "22222222-2222-4222-8222-222222222222";
    const tenantId = "11111111-1111-4111-8111-111111111111";
    const contractId = "b2744aa2-251e-4a7a-935f-20c39ce36928";

    const mockContract: RentalContract = {
        id: contractId,
        roomId,
        tenantProfileId: tenantId,
        status: "DRAFT",
        startDate: "2026-12-01",
        endDate: "2027-12-01",
        rentAmount: 3500000,
        depositRequired: 7000000,
    };

    function fillValidForm(): void {
        component.roomId.set(roomId);
        component.tenantProfileId.set(tenantId);
        component.startDate.set("2026-12-01");
        component.endDate.set("2027-12-01");
        component.rentAmount.set(3500000);
        component.depositRequired.set(7000000);
    }

    beforeEach(async () => {
        createContractMock = vi.fn().mockReturnValue(of(mockContract));
        navigateMock = vi.fn().mockResolvedValue(true);

        await TestBed.configureTestingModule({
            imports: [ContractCreate],
            providers: [
                {
                    provide: RentalService,
                    useValue: { createContract: createContractMock },
                },
                {
                    provide: Router,
                    useValue: { navigate: navigateMock },
                },
            ],
        })
            .overrideComponent(ContractCreate, {
                set: { template: "" },
            })
            .compileComponents();

        const fixture = TestBed.createComponent(ContractCreate);
        component = fixture.componentInstance;
    });

    it("should create component", () => {
        expect(component).toBeTruthy();
    });

    it("should reject invalid UUID", () => {
        fillValidForm();
        component.roomId.set("abc123");

        component.createContract();

        expect(createContractMock).not.toHaveBeenCalled();
        expect(component.errorMessage()).toContain("UUID");
    });

    it("should reject end date before start date", () => {
        fillValidForm();
        component.endDate.set("2026-11-30");

        component.createContract();

        expect(createContractMock).not.toHaveBeenCalled();
        expect(component.errorMessage()).toContain("Ngày kết thúc");
    });

    it("should reject negative rent amount", () => {
        fillValidForm();
        component.rentAmount.set(-1000);

        component.createContract();

        expect(createContractMock).not.toHaveBeenCalled();
        expect(component.errorMessage()).toContain("số nguyên không âm");
    });

    it("should reject missing required amount", () => {
        fillValidForm();
        component.depositRequired.set(null);

        component.createContract();

        expect(createContractMock).not.toHaveBeenCalled();
        expect(component.errorMessage()).not.toBe("");
    });

    it("should create DRAFT contract successfully", () => {
        fillValidForm();

        component.createContract();

        expect(createContractMock).toHaveBeenCalledWith({
            roomId,
            tenantProfileId: tenantId,
            startDate: "2026-12-01",
            endDate: "2027-12-01",
            rentAmount: 3500000,
            depositRequired: 7000000,
        });

        expect(navigateMock).toHaveBeenCalledWith([
            "/owner/contracts",
            contractId,
        ]);

        expect(component.saving()).toBe(false);
    });

    it("should handle conflict error 409", () => {
        fillValidForm();

        createContractMock.mockReturnValue(
            throwError(() => ({ status: 409 }))
        );

        component.createContract();

        expect(component.errorMessage()).toContain("trùng thời gian");
        expect(component.saving()).toBe(false);
    });

    it("should prevent duplicate requests while saving", () => {
        fillValidForm();

        const pendingRequest = new Subject<RentalContract>();
        createContractMock.mockReturnValue(
            pendingRequest.asObservable()
        );

        component.createContract();
        component.createContract();

        expect(createContractMock).toHaveBeenCalledOnce();
        expect(component.saving()).toBe(true);

        pendingRequest.next(mockContract);
        pendingRequest.complete();

        expect(component.saving()).toBe(false);
    });
});
