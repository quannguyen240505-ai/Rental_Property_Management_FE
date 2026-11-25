
import { TestBed } from "@angular/core/testing";
import { of, Subject, throwError } from "rxjs";
import { vi } from "vitest";

import { ContractList } from "./contract-list";
import { RentalService } from "../rental.service";
import { RentalContract } from "../rental.model";

describe("ContractList", () => {
    let component: ContractList;
    let getContracts: ReturnType<typeof vi.fn>;

    const mockContracts: RentalContract[] = [
        {
            id: "contract-1",
            roomId: "room-1",
            tenantProfileId: "tenant-1",
            status: "DRAFT",
            startDate: "2026-12-01",
            endDate: "2027-12-01",
            rentAmount: 3500000,
            depositRequired: 7000000,
        },
    ];

    beforeEach(async () => {
        getContracts = vi.fn().mockReturnValue(of(mockContracts));

        await TestBed.configureTestingModule({
            imports: [ContractList],
            providers: [
                {
                    provide: RentalService,
                    useValue: { getContracts },
                },
            ],
        })
            .overrideComponent(ContractList, {
                set: { template: "" },
            })
            .compileComponents();

        const fixture = TestBed.createComponent(ContractList);
        component = fixture.componentInstance;
    });

    it("should create component", () => {
        expect(component).toBeTruthy();
    });

    it("should load contracts successfully", () => {
        component.loadContracts();

        expect(getContracts).toHaveBeenCalledOnce();
        expect(component.contracts()).toEqual(mockContracts);
        expect(component.loading()).toBe(false);
        expect(component.errorMessage()).toBe("");
    });

    it("should handle 401 unauthorized error", () => {
        getContracts.mockReturnValue(
            throwError(() => ({ status: 401 }))
        );

        component.loadContracts();

        expect(component.errorMessage()).not.toBe("");
        expect(component.loading()).toBe(false);
    });

    it("should handle 403 forbidden error", () => {
        getContracts.mockReturnValue(
            throwError(() => ({ status: 403 }))
        );

        component.loadContracts();

        expect(component.errorMessage()).not.toBe("");
    });

    it("should handle backend connection error", () => {
        getContracts.mockReturnValue(
            throwError(() => ({ status: 0 }))
        );

        component.loadContracts();

        expect(component.errorMessage()).not.toBe("");
        expect(component.loading()).toBe(false);
    });

    it("should prevent duplicate requests while loading", () => {
        const pendingRequest = new Subject<RentalContract[]>();
        getContracts.mockReturnValue(pendingRequest.asObservable());

        component.loadContracts();
        component.loadContracts();

        expect(getContracts).toHaveBeenCalledOnce();
        expect(component.loading()).toBe(true);

        pendingRequest.next(mockContracts);
        pendingRequest.complete();

        expect(component.loading()).toBe(false);
        expect(component.contracts()).toEqual(mockContracts);
    });
});
