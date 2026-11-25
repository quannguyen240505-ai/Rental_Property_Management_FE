import { TestBed } from "@angular/core/testing";
import {
    provideHttpClient,
} from "@angular/common/http";
import {
    HttpTestingController,
    provideHttpClientTesting,
} from "@angular/common/http/testing";

import { RentalService } from "./rental.service";
import {
    RentalContract,
    CreateRentalContractRequest,
    CheckoutSettlement,
} from "./rental.model";

describe("RentalService", () => {
    let service: RentalService;
    let httpMock: HttpTestingController;

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

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                RentalService,
                provideHttpClient(),
                provideHttpClientTesting(),
            ],
        });

        service = TestBed.inject(RentalService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    it("should get all contracts", () => {
        service.getContracts().subscribe((data) => {
            expect(data).toEqual([mockContract]);
        });

        const req = httpMock.expectOne("/api/contracts");

        expect(req.request.method).toBe("GET");

        req.flush([mockContract]);
    });

    it("should get contract by ID", () => {
        service.getContractById("contract-1").subscribe((data) => {
            expect(data).toEqual(mockContract);
        });

        const req = httpMock.expectOne(
            "/api/contracts/contract-1"
        );

        expect(req.request.method).toBe("GET");

        req.flush(mockContract);
    });

    it("should create a DRAFT contract", () => {
        const payload: CreateRentalContractRequest = {
            roomId: "room-1",
            tenantProfileId: "tenant-1",
            startDate: "2026-12-01",
            endDate: "2027-12-01",
            rentAmount: 3500000,
            depositRequired: 7000000,
        };

        service.createContract(payload).subscribe((data) => {
            expect(data.status).toBe("DRAFT");
        });

        const req = httpMock.expectOne("/api/contracts");

        expect(req.request.method).toBe("POST");
        expect(req.request.body).toEqual(payload);

        req.flush(mockContract);
    });

    it("should get deposit summary", () => {
        service.getDepositSummary("contract-1").subscribe((data) => {
            expect(data.depositRemaining).toBe(7000000);
        });

        const req = httpMock.expectOne(
            "/api/contracts/contract-1/deposit-summary"
        );

        expect(req.request.method).toBe("GET");

        req.flush({
            contractId: "contract-1",
            depositRequired: 7000000,
            depositApplied: 0,
            depositRemaining: 7000000,
        });
    });

    it("should activate contract", () => {
        service.activateContract("contract-1").subscribe((data) => {
            expect(data.status).toBe("ACTIVE");
        });

        const req = httpMock.expectOne(
            "/api/contracts/contract-1/activate"
        );

        expect(req.request.method).toBe("POST");
        expect(req.request.body).toEqual({});

        req.flush({
            ...mockContract,
            status: "ACTIVE",
        });
    });

    it("should checkout contract", () => {
        const payload = {
            checkoutDate: "2027-12-01",
            deductionAmount: 500000,
            notes: "Repair costs",
        };

        const settlement: CheckoutSettlement = {
            id: "settlement-1",
            contractId: "contract-1",
            contractStatus: "ENDED",
            checkoutDate: "2027-12-01",
            appliedDeposit: 7000000,
            deductionAmount: 500000,
            refundDue: 6500000,
            notes: "Repair costs",
        };

        service.checkoutContract("contract-1", payload)
            .subscribe((data) => {
                expect(data.refundDue).toBe(6500000);
            });

        const req = httpMock.expectOne(
            "/api/contracts/contract-1/checkout"
        );

        expect(req.request.method).toBe("POST");
        expect(req.request.body).toEqual(payload);

        req.flush(settlement);
    });

    it("should get checkout settlement", () => {
        service.getSettlement("contract-1").subscribe((data) => {
            expect(data.contractStatus).toBe("ENDED");
        });

        const req = httpMock.expectOne(
            "/api/contracts/contract-1/settlement"
        );

        expect(req.request.method).toBe("GET");

        req.flush({
            id: "settlement-1",
            contractId: "contract-1",
            contractStatus: "ENDED",
            checkoutDate: "2027-12-01",
            appliedDeposit: 7000000,
            deductionAmount: 500000,
            refundDue: 6500000,
            notes: null,
        });
    });
});
