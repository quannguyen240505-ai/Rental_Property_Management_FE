import { TestBed } from "@angular/core/testing";
import { describe, expect, it, vi } from "vitest";
import { UiFilterSelectComponent } from "./ui-filter-select.component";

describe("UiFilterSelectComponent", () => {
  it("renders caller-provided options and emits selection", () => {
    const fixture = TestBed.createComponent(UiFilterSelectComponent);
    const handler = vi.fn();
    fixture.componentInstance.valueChange.subscribe(handler);
    fixture.componentRef.setInput("controlId", "filter-role");
    fixture.componentRef.setInput("options", [
      { value: "", label: "Tất cả" },
      { value: "STAFF", label: "Nhân viên" },
    ]);
    fixture.detectChanges();
    const select = fixture.nativeElement.querySelector(
      "select",
    ) as HTMLSelectElement;
    expect(select.options.length).toBe(2);
    select.value = "STAFF";
    select.dispatchEvent(new Event("change"));
    expect(handler).toHaveBeenCalledWith("STAFF");
  });
});
