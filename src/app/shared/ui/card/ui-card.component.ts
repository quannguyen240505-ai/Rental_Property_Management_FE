import { Component, input } from "@angular/core";

export type UiCardVariant = "default" | "subtle" | "outlined";
export type UiCardPadding = "none" | "sm" | "md" | "lg";

/** Presentational card. Put section/article semantics and heading inside content. */
@Component({
  selector: "ui-card",
  standalone: true,
  template: `
    <div
      class="rp-ui-card"
      [class.rp-ui-card--subtle]="variant() === 'subtle'"
      [class.rp-ui-card--outlined]="variant() === 'outlined'"
      [class.rp-ui-card--none]="padding() === 'none'"
      [class.rp-ui-card--sm]="padding() === 'sm'"
      [class.rp-ui-card--lg]="padding() === 'lg'"
    >
      <ng-content />
    </div>
  `,
  styleUrl: "./ui-card.component.css",
})
export class UiCardComponent {
  readonly variant = input<UiCardVariant>("default");
  readonly padding = input<UiCardPadding>("md");
}
