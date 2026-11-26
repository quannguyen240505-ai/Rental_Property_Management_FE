import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  TestRequest,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PropertyItem } from "../properties/property.model";
import { RoomItem } from "./room.model";
import { RoomManagementComponent } from "./room-management.component";

const properties: PropertyItem[] = [
  {
    id: "property-A",
    name: "Khu A",
    address: "Địa chỉ A",
    description: null,
    contactPhone: null,
    createdAt: "2026-11-26T00:00:00",
    updatedAt: "2026-11-26T00:00:00",
  },
  {
    id: "property-B",
    name: "Khu B",
    address: "Địa chỉ B",
    description: null,
    contactPhone: null,
    createdAt: "2026-11-26T00:00:00",
    updatedAt: "2026-11-26T00:00:00",
  },
];

function roomFor(propertyId: string): RoomItem {
  return {
    id: `room-${propertyId}`,
    propertyId,
    code: propertyId === "property-A" ? "A101" : "B101",
    title: `Phòng ${propertyId}`,
    description: null,
    floorNumber: 1,
    areaM2: 24,
    monthlyRent: 2000000,
    status: "AVAILABLE",
    published: true,
    createdAt: "2026-11-26T00:00:00",
    updatedAt: "2026-11-26T00:00:00",
  };
}

describe("RoomManagementComponent – rapid property switching", () => {
  let fixture: ComponentFixture<RoomManagementComponent>;
  let http: HttpTestingController;

  function expectRooms(propertyId: string): TestRequest {
    return http.expectOne(
      (request) =>
        request.method === "GET" &&
        request.url === "/api/rooms" &&
        request.params.get("propertyId") === propertyId,
    );
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomManagementComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(RoomManagementComponent);
    fixture.detectChanges();
    http.expectOne("/api/properties").flush(properties);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    http.verify({ ignoreCancelled: true });
    TestBed.resetTestingModule();
  });

  it("cancels in-flight A request and loads B when switching properties", () => {
    const component = fixture.componentInstance;
    const requestA = expectRooms("property-A");

    component.changeProperty("property-B");
    expect(requestA.cancelled).toBe(true);
    expect(component.loadingRooms()).toBe(true);

    const requestB = expectRooms("property-B");
    requestB.flush([roomFor("property-B")]);
    fixture.detectChanges();

    expect(component.propertyId()).toBe("property-B");
    expect(component.rooms().map((room) => room.propertyId)).toEqual([
      "property-B",
    ]);
    expect(component.loadingRooms()).toBe(false);
  });

  it("uses only the latest response when switching A → B → A rapidly", () => {
    const component = fixture.componentInstance;
    const initialA = expectRooms("property-A");

    component.changeProperty("property-B");
    const requestB = expectRooms("property-B");
    expect(initialA.cancelled).toBe(true);

    component.changeProperty("property-A");
    const latestA = expectRooms("property-A");
    expect(requestB.cancelled).toBe(true);
    expect(component.loadingRooms()).toBe(true);

    latestA.flush([roomFor("property-A")]);
    fixture.detectChanges();

    expect(component.propertyId()).toBe("property-A");
    expect(component.rooms().map((room) => room.propertyId)).toEqual([
      "property-A",
    ]);
    expect(component.loadingRooms()).toBe(false);
    expect(component.error()).toBe("");
  });
});
