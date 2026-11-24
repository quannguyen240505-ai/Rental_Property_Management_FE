import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";

export interface UiFilterOption {
  value: string;
  label: string;
}

/** Presentational select. Callers supply business-specific option labels. */
@Component({
  selector: "ui-filter-select",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <select
      [id]="controlId()"
      [value]="value()"
      [disabled]="disabled()"
      [attr.aria-label]="ariaLabel()"
      (change)="valueChange.emit($any($event.target).value)"
    >
      @for (option of options(); track option.value) {
        <option [value]="option.value">{{ option.label }}</option>
      }
    </select>
  `,
  styleUrl: "./ui-filter-select.component.css",
})
export class UiFilterSelectComponent {
  readonly controlId = input.required<string>();
  readonly options = input.required<readonly UiFilterOption[]>();
  readonly value = input("");
  readonly ariaLabel = input<string | null>(null);
  readonly disabled = input(false);
  readonly valueChange = output<string>();
}
