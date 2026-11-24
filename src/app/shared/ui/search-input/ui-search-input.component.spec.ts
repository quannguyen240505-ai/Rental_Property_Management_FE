import { TestBed } from "@angular/core/testing";
import { describe, expect, it, vi } from "vitest";
import { UiSearchInputComponent } from "./ui-search-input.component";

describe("UiSearchInputComponent", () => {
  it("forwards input value to the page", () => {
    const fixture = TestBed.createComponent(UiSearchInputComponent);
    const handler = vi.fn();
    fixture.componentInstance.valueChange.subscribe(handler);
    fixture.componentRef.setInput("controlId", "search-rooms");
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector(
      "input",
    ) as HTMLInputElement;
    input.value = "A101";
    input.dispatchEvent(new Event("input"));
    expect(handler).toHaveBeenCalledWith("A101");
  });
});
