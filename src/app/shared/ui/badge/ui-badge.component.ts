import { Component, input } from "@angular/core";

export type UiBadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

/** Text defines the state, color/dot are supplemental. */
@Component({
  selector: "ui-badge",
  standalone: true,
  template: `
    <span
      class="rp-ui-badge"
      [class.rp-ui-badge--success]="tone() === 'success'"
      [class.rp-ui-badge--warning]="tone() === 'warning'"
      [class.rp-ui-badge--danger]="tone() === 'danger'"
      [class.rp-ui-badge--info]="tone() === 'info'"
      [class.rp-ui-badge--sm]="size() === 'sm'"
      [class.rp-ui-badge--square]="!pill()"
    >
      @if (dot()) {
        <span class="rp-ui-badge__dot" aria-hidden="true"></span>
      }
      <ng-content />
    </span>
  `,
  styleUrl: "./ui-badge.component.css",
})
export class UiBadgeComponent {
  readonly tone = input<UiBadgeTone>("neutral");
  readonly size = input<"sm" | "md">("md");
  readonly dot = input(false);
  readonly pill = input(true);
}
