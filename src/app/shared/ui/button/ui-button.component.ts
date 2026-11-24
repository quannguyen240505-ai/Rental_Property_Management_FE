import { Component, input, output } from "@angular/core";

export type UiButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type UiButtonSize = "sm" | "md" | "lg";

/**
 * Shared action button for Rental Property forms and toolbars.
 * Use (pressed) instead of (click) on the wrapper. Defaults to type="button"
 * so a toolbar action never submits a parent form by accident.
 */
@Component({
  selector: "ui-button",
  standalone: true,
  template: `
    <button
      class="rp-ui-button"
      [class.rp-ui-button--primary]="variant() === 'primary'"
      [class.rp-ui-button--secondary]="variant() === 'secondary'"
      [class.rp-ui-button--ghost]="variant() === 'ghost'"
      [class.rp-ui-button--danger]="variant() === 'danger'"
      [class.rp-ui-button--sm]="size() === 'sm'"
      [class.rp-ui-button--lg]="size() === 'lg'"
      [class.rp-ui-button--block]="block()"
      [type]="type()"
      [disabled]="disabled() || loading()"
      [attr.aria-busy]="loading() ? 'true' : null"
      [attr.aria-label]="ariaLabel() || null"
      (click)="onClick()"
    >
      @if (loading()) {
        <span class="rp-ui-button__spinner" aria-hidden="true"></span>
      }
      <span class="rp-ui-button__content"><ng-content /></span>
    </button>
  `,
  styleUrl: "./ui-button.component.css",
})
export class UiButtonComponent {
  readonly variant = input<UiButtonVariant>("primary");
  readonly size = input<UiButtonSize>("md");
  readonly type = input<"button" | "submit" | "reset">("button");
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly block = input(false);
  /** Required when the button contains only an icon. */
  readonly ariaLabel = input<string | null>(null);
  readonly pressed = output<void>();

  protected onClick(): void {
    if (this.disabled() || this.loading()) return;
    this.pressed.emit();
  }
}
