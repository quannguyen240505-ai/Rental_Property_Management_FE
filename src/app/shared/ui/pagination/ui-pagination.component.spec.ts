import { TestBed } from "@angular/core/testing";
import { describe, expect, it, vi } from "vitest";
import { UiPaginationComponent } from "./ui-pagination.component";

describe("UiPaginationComponent", () => {
  it("shows current page and correct visible item count", () => {
    const fixture = TestBed.createComponent(UiPaginationComponent);
    fixture.componentRef.setInput("page", 2);
    fixture.componentRef.setInput("pageSize", 10);
    fixture.componentRef.setInput("totalItems", 23);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("Trang 2 / 3");
    expect(fixture.nativeElement.textContent).toContain("10");
  });
  it("emits requested page without changing parent state", () => {
    const fixture = TestBed.createComponent(UiPaginationComponent);
    const handler = vi.fn();
    fixture.componentInstance.pageChange.subscribe(handler);
    fixture.componentRef.setInput("totalItems", 25);
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector(
        '[aria-label="Trang sau"]',
      ) as HTMLButtonElement
    ).click();
    expect(handler).toHaveBeenCalledWith(2);
    expect(fixture.componentInstance.page()).toBe(1);
  });
  it("disables navigation when no next page exists", () => {
    const fixture = TestBed.createComponent(UiPaginationComponent);
    fixture.detectChanges();
    expect(
      (
        fixture.nativeElement.querySelector(
          '[aria-label="Trang sau"]',
        ) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(
      (
        fixture.nativeElement.querySelector(
          '[aria-label="Trang trước"]',
        ) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });
});
