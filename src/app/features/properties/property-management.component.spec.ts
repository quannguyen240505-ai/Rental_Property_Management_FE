import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PropertyManagementComponent } from "./property-management.component";
import { PropertyItem } from "./property.model";

const row: PropertyItem = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Khu trọ Bình An",
  address: "12 Nguyễn Huệ, Quy Nhơn",
  contactPhone: "0912345678",
  description: "Phòng gần trường",
  createdAt: "2026-11-24T10:00:00",
  updatedAt: "2026-11-24T11:00:00",
};

describe("PropertyManagementComponent", () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  function start() {
    const fixture = TestBed.createComponent(PropertyManagementComponent);
    fixture.detectChanges();
    http.expectOne("/api/properties").flush([row]);
    fixture.detectChanges();
    return fixture;
  }

  it("hiển thị danh sách và thống kê từ Backend", () => {
    const fixture = start();
    expect(fixture.componentInstance.properties().length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain("Khu trọ Bình An");
    expect(fixture.nativeElement.textContent).toContain("12 Nguyễn Huệ");
  });

  it("tìm kiếm tên, địa chỉ và đặt lại trang", () => {
    const fixture = start();
    const component = fixture.componentInstance;
    component.setQuery("Quy Nhơn");
    expect(component.filteredProperties().length).toBe(1);
    component.setQuery("không tồn tại");
    expect(component.filteredProperties().length).toBe(0);
    expect(component.page()).toBe(1);
  });

  it("không gửi POST nếu tên hoặc địa chỉ trống", () => {
    const fixture = start();
    const component = fixture.componentInstance;
    component.openCreate();
    component.form = { name: " ", address: " ", description: "", contactPhone: "" };
    component.submitCreate();
    expect(component.formError()).toContain("Tên khu trọ");
    expect(component.saving()).toBe(false);
  });

  it("tạo khu trọ thành công rồi tải lại danh sách", () => {
    const fixture = start();
    const component = fixture.componentInstance;
    component.openCreate();
    component.form = {
      name: " Khu mới ",
      address: " Đống Đa ",
      description: "",
      contactPhone: "",
    };
    component.submitCreate();
    const post = http.expectOne("/api/properties");
    expect(post.request.method).toBe("POST");
    expect(post.request.body).toEqual({
      name: "Khu mới", address: "Đống Đa", description: null, contactPhone: null,
    });
    post.flush({ ...row, name: "Khu mới" }, { status: 201, statusText: "Created" });
    http.expectOne("/api/properties").flush([{ ...row, name: "Khu mới" }]);
    fixture.detectChanges();
    expect(component.panel()).toBeNull();
    expect(component.notice()).toContain("thành công");
    expect(component.properties()[0].name).toBe("Khu mới");
  });

  it("xem chi tiết gọi GET theo ID", () => {
    const fixture = start();
    const component = fixture.componentInstance;
    component.openDetail(row);
    const request = http.expectOne(`/api/properties/${row.id}`);
    expect(request.request.method).toBe("GET");
    request.flush({ ...row, description: "Mô tả mới" });
    fixture.detectChanges();
    expect(component.selected()?.description).toBe("Mô tả mới");
    expect(fixture.nativeElement.textContent).toContain("Mô tả mới");
  });

  it("báo lỗi nếu Property Service không hoạt động, không hiển thị 0 giả", () => {
    const fixture = TestBed.createComponent(PropertyManagementComponent);
    fixture.detectChanges();
    http.expectOne("/api/properties").flush({}, { status: 503, statusText: "Unavailable" });
    fixture.detectChanges();
    expect(fixture.componentInstance.loaded()).toBe(false);
    expect(fixture.componentInstance.error()).toContain("Property Service");
  });
});
