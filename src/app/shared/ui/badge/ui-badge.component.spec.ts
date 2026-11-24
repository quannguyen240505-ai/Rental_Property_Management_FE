import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { UiBadgeComponent } from "./ui-badge.component";

@Component({
  standalone: true,
  imports: [UiBadgeComponent],
  template: '<ui-badge tone="success" [dot]="true">Đang hoạt động</ui-badge>',
})
class BadgeHostComponent {}

describe("UiBadgeComponent", () => {
  it("hiển thị trạng thái bằng chữ và dot trang trí", () => {
    const fixture = TestBed.createComponent(BadgeHostComponent);
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector(
      ".rp-ui-badge",
    ) as HTMLElement;
    expect(badge.textContent).toContain("Đang hoạt động");
    expect(badge.classList.contains("rp-ui-badge--success")).toBe(true);
    expect(badge.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it("hỗ trợ warning và kích thước nhỏ", () => {
    const fixture = TestBed.createComponent(UiBadgeComponent);
    fixture.componentRef.setInput("tone", "warning");
    fixture.componentRef.setInput("size", "sm");
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector(
      ".rp-ui-badge",
    ) as HTMLElement;
    expect(badge.classList.contains("rp-ui-badge--warning")).toBe(true);
    expect(badge.classList.contains("rp-ui-badge--sm")).toBe(true);
  });

  it("đổi trạng thái reactive sang danger", () => {
    const fixture = TestBed.createComponent(UiBadgeComponent);
    fixture.componentRef.setInput("tone", "success");
    fixture.detectChanges();
    fixture.componentRef.setInput("tone", "danger");
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector(
      ".rp-ui-badge",
    ) as HTMLElement;
    expect(badge.classList.contains("rp-ui-badge--success")).toBe(false);
    expect(badge.classList.contains("rp-ui-badge--danger")).toBe(true);
  });

  it("mặc định neutral và có thể đổi pill thành hình vuông bo góc", () => {
    const fixture = TestBed.createComponent(UiBadgeComponent);
    fixture.componentRef.setInput("pill", false);
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector(
      ".rp-ui-badge",
    ) as HTMLElement;
    expect(badge.classList.contains("rp-ui-badge--square")).toBe(true);
    expect(badge.classList.contains("rp-ui-badge--success")).toBe(false);
  });
});
