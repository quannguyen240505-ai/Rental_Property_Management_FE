import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { UiCardComponent } from "./ui-card.component";

@Component({
  standalone: true,
  imports: [UiCardComponent],
  template:
    '<ui-card variant="subtle" padding="sm"><article><h2>Hóa đơn</h2></article></ui-card>',
})
class CardHostComponent {}

describe("UiCardComponent", () => {
  it("giữ nội dung và semantic article được project vào card", () => {
    const fixture = TestBed.createComponent(CardHostComponent);
    fixture.detectChanges();
    const card = fixture.nativeElement.querySelector(
      ".rp-ui-card",
    ) as HTMLElement;
    expect(card.querySelector("article h2")?.textContent).toBe("Hóa đơn");
    expect(card.classList.contains("rp-ui-card--subtle")).toBe(true);
    expect(card.classList.contains("rp-ui-card--sm")).toBe(true);
  });

  it("không padding khi đặt none", () => {
    const fixture = TestBed.createComponent(UiCardComponent);
    fixture.componentRef.setInput("padding", "none");
    fixture.detectChanges();
    expect(
      fixture.nativeElement
        .querySelector(".rp-ui-card")
        .classList.contains("rp-ui-card--none"),
    ).toBe(true);
  });

  it("hỗ trợ card outlined không shadow và kích cỡ lg", () => {
    const fixture = TestBed.createComponent(UiCardComponent);
    fixture.componentRef.setInput("variant", "outlined");
    fixture.componentRef.setInput("padding", "lg");
    fixture.detectChanges();
    const card = fixture.nativeElement.querySelector(
      ".rp-ui-card",
    ) as HTMLElement;
    expect(card.classList.contains("rp-ui-card--outlined")).toBe(true);
    expect(card.classList.contains("rp-ui-card--lg")).toBe(true);
  });
});
