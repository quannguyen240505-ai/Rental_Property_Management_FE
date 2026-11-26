import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { RoomService } from "./room.service";
import { RoomItem } from "./room.model";

const sample: RoomItem = {
  id: "room-1", propertyId: "property-1", code: "A101", title: "Phòng A101",
  description: null, floorNumber: 1, areaM2: 22.5, monthlyRent: 2000000,
  status: "AVAILABLE", published: false, createdAt: "2026-11-24T00:00:00", updatedAt: "2026-11-24T00:00:00",
};

describe("RoomService", () => {
  let service: RoomService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(RoomService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it("lists rooms only for the requested property", () => {
    let rows: RoomItem[] = [];
    service.listByProperty("property-1").subscribe((value) => (rows = value));
    const request = http.expectOne((req) => req.method === "GET" && req.url === "/api/rooms");
    expect(request.request.params.get("propertyId")).toBe("property-1");
    request.flush([sample]);
    expect(rows).toEqual([sample]);
  });

  it("loads room detail", () => {
    service.getById("room-1").subscribe((data) => expect(data.id).toBe("room-1"));
    http.expectOne("/api/rooms/room-1").flush(sample);
  });

  it("creates an unpublished room", () => {
    const payload = { propertyId: "property-1", code: "A101", title: "Phòng A101", description: null,
      floorNumber: 1, areaM2: 22.5, monthlyRent: 2000000 };
    service.create(payload).subscribe((result) => expect(result.published).toBe(false));
    const request = http.expectOne("/api/rooms");
    expect(request.request.method).toBe("POST");
    expect(request.request.body).toEqual(payload);
    request.flush(sample, { status: 201, statusText: "Created" });
  });

  it("updates information without changing property or status", () => {
    const payload = { code: "A102", title: "Phòng A102", description: "Đã sửa", floorNumber: 1,
      areaM2: 25, monthlyRent: 2200000 };
    service.update("room-1", payload).subscribe();
    const request = http.expectOne("/api/rooms/room-1");
    expect(request.request.method).toBe("PUT");
    expect(request.request.body).toEqual(payload);
    expect(request.request.body.propertyId).toBeUndefined();
    request.flush({ ...sample, ...payload });
  });

  it("publishes only via dedicated endpoint", () => {
    service.setPublished("room-1", true).subscribe();
    const request = http.expectOne("/api/rooms/room-1/publication");
    expect(request.request.method).toBe("PATCH");
    expect(request.request.body).toEqual({ published: true });
    request.flush({ ...sample, published: true });
  });

  it("propagates a room-code conflict", () => {
    let errorStatus = 0;
    service.create({ propertyId: "property-1", code: "A101", title: "Phòng A101",
      description: null, floorNumber: null, areaM2: null, monthlyRent: 0 })
      .subscribe({ error: (error) => (errorStatus = error.status) });
    http.expectOne("/api/rooms").flush({ message: "Room code already exists" },
      { status: 409, statusText: "Conflict" });
    expect(errorStatus).toBe(409);
  });
});
