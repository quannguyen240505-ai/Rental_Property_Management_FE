import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";

/** Controlled search field: page owns search state, label and filter logic. */
@Component({
  selector: "ui-search-input",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ui-search">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle
          cx="10.7"
          cy="10.7"
          r="6.7"
          stroke="currentColor"
          stroke-width="1.8"
        />
        <path
          d="m16 16 5 5"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
        />
      </svg>
      <input
        type="search"
        [id]="controlId()"
        [value]="value()"
        [placeholder]="placeholder()"
        [attr.aria-label]="ariaLabel()"
        [disabled]="disabled()"
        (input)="valueChange.emit($any($event.target).value)"
      />
    </div>
  `,
  styleUrl: "./ui-search-input.component.css",
})
export class UiSearchInputComponent {
  readonly controlId = input.required<string>();
  readonly value = input("");
  readonly placeholder = input("Tìm kiếm...");
  readonly ariaLabel = input<string | null>(null);
  readonly disabled = input(false);
  readonly valueChange = output<string>();
}
