import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { describe, expect, it, vi } from "vitest";
import { UiButtonComponent } from "./ui-button.component";

@Component({
  standalone: true,
  imports: [UiButtonComponent],
  template:
    '<ui-button variant="secondary" (pressed)="onPress()">Làm mới</ui-button>',
})
class ButtonHostComponent {
  readonly onPress = vi.fn();
}

describe("UiButtonComponent", () => {
  it("mặc định type=button, không submit form ngoài ý muốn", () => {
    const fixture = TestBed.createComponent(UiButtonComponent);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector(
      "button",
    ) as HTMLButtonElement;
    expect(button.type).toBe("button");
    expect(button.disabled).toBe(false);
  });

  it("phát pressed cho component cha khi click", () => {
    const fixture = TestBed.createComponent(ButtonHostComponent);
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector("button") as HTMLButtonElement
    ).click();
    expect(fixture.componentInstance.onPress).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.textContent).toContain("Làm mới");
  });

  it("disabled ngăn phát sự kiện", () => {
    const fixture = TestBed.createComponent(UiButtonComponent);
    const handler = vi.fn();
    fixture.componentInstance.pressed.subscribe(handler);
    fixture.componentRef.setInput("disabled", true);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector(
      "button",
    ) as HTMLButtonElement;
    button.click();
    expect(button.disabled).toBe(true);
    expect(handler).not.toHaveBeenCalled();
  });

  it("loading khóa nút, hiện spinner, không phát pressed", () => {
    const fixture = TestBed.createComponent(UiButtonComponent);
    const handler = vi.fn();
    fixture.componentInstance.pressed.subscribe(handler);
    fixture.componentRef.setInput("loading", true);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector(
      "button",
    ) as HTMLButtonElement;
    button.click();
    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.querySelector(".rp-ui-button__spinner")).not.toBeNull();
    expect(handler).not.toHaveBeenCalled();
  });

  it("hỗ trợ variant danger, size lg và aria-label", () => {
    const fixture = TestBed.createComponent(UiButtonComponent);
    fixture.componentRef.setInput("variant", "danger");
    fixture.componentRef.setInput("size", "lg");
    fixture.componentRef.setInput("ariaLabel", "Xóa tài khoản");
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector(
      "button",
    ) as HTMLButtonElement;
    expect(button.classList.contains("rp-ui-button--danger")).toBe(true);
    expect(button.classList.contains("rp-ui-button--lg")).toBe(true);
    expect(button.getAttribute("aria-label")).toBe("Xóa tài khoản");
  });

  it("hỗ trợ button type=submit có chủ đích", () => {
    const fixture = TestBed.createComponent(UiButtonComponent);
    fixture.componentRef.setInput("type", "submit");
    fixture.detectChanges();
    expect(
      (fixture.nativeElement.querySelector("button") as HTMLButtonElement).type,
    ).toBe("submit");
  });

  it("block tạo lớp full-width", () => {
    const fixture = TestBed.createComponent(UiButtonComponent);
    fixture.componentRef.setInput("block", true);
    fixture.componentRef.setInput("size", "sm");
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector(
      "button",
    ) as HTMLButtonElement;
    expect(button.classList.contains("rp-ui-button--block")).toBe(true);
    expect(button.classList.contains("rp-ui-button--sm")).toBe(true);
  });
});
