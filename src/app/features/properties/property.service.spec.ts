import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PropertyService } from "./property.service";
import { PropertyItem } from "./property.model";

const item: PropertyItem = {
  id: "e10a13d4-ef31-49ad-8ef7-753400000001",
  name: "Nhà trọ A",
  address: "Quy Nhơn",
  description: null,
  contactPhone: "0912345678",
  createdAt: "2026-11-24T10:00:00",
  updatedAt: "2026-11-24T10:00:00",
};

describe("PropertyService", () => {
  let service: PropertyService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PropertyService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PropertyService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  it("GET /api/properties tải danh sách", () => {
    let output: PropertyItem[] = [];
    service.list().subscribe((rows) => (output = rows));
    const req = http.expectOne("/api/properties");
    expect(req.request.method).toBe("GET");
    req.flush([item]);
    expect(output).toEqual([item]);
  });

  it("GET /api/properties/{id} tải đúng chi tiết", () => {
    let output: PropertyItem | undefined;
    service.getById(item.id).subscribe((row) => (output = row));
    const req = http.expectOne(`/api/properties/${item.id}`);
    expect(req.request.method).toBe("GET");
    req.flush(item);
    expect(output?.id).toBe(item.id);
  });

  it("POST /api/properties gửi payload đúng contract", () => {
    const data = { name: "Nhà trọ A", address: "Quy Nhơn", description: null, contactPhone: null };
    service.create(data).subscribe();
    const req = http.expectOne("/api/properties");
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual(data);
    req.flush(item, { status: 201, statusText: "Created" });
  });
});
