import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  NgZone,
  OnDestroy,
  Output,
  ViewChild,
  inject,
} from "@angular/core";

import { GOOGLE_CLIENT_ID } from "../../core/config/google.config";

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleIdentity {
  accounts: {
    id: {
      initialize(options: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
      }): void;
      renderButton(
        element: HTMLElement,
        options: Record<string, string | number>,
      ): void;
    };
  };
}

type GoogleWindow = Window & {
  google?: GoogleIdentity;
};

let sdkPromise: Promise<void> | null = null;
let googleInitialized = false;
let activeCredentialHandler: ((token: string) => void) | null = null;

function loadGoogleSdk(): Promise<void> {
  if ((window as GoogleWindow).google) {
    return Promise.resolve();
  }

  if (!sdkPromise) {
    sdkPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        sdkPromise = null;
        script.remove();
        reject(new Error("Cannot load Google SDK"));
      };
      document.head.appendChild(script);
    });
  }
  return sdkPromise;
}

@Component({
  selector: "app-google-sign-in",
  standalone: true,
  template: `
    <div class="google-container">
      <div #googleButton></div>
    </div>
  `,
  styles: [
    `
      .google-container {
        width: 100%;
        min-height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `,
  ],
})
export class GoogleSignInComponent implements AfterViewInit, OnDestroy {
  @ViewChild("googleButton", { static: true })
  button!: ElementRef<HTMLDivElement>;

  @Output() credential = new EventEmitter<string>();
  @Output() loadError = new EventEmitter<void>();
  @Output() ready = new EventEmitter<void>();

  private readonly zone = inject(NgZone);
  private destroyed = false;

  async ngAfterViewInit(): Promise<void> {
    try {
      await loadGoogleSdk();
      if (this.destroyed) return;

      const google = (window as GoogleWindow).google;
      if (!google) throw new Error("Google SDK unavailable");

      activeCredentialHandler = (token: string) => {
        if (this.destroyed) return;

        this.zone.run(() => {
          this.credential.emit(token);
        });
      };

      if (!googleInitialized) {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            activeCredentialHandler?.(response.credential);
          },
        });

        googleInitialized = true;
      }

      const width = Math.min(
        this.button.nativeElement.parentElement?.clientWidth ?? 400,
        400,
      );

      google.accounts.id.renderButton(this.button.nativeElement, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "left",
        width,
      });
      this.ready.emit();
    } catch {
      if (!this.destroyed) this.loadError.emit();
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    activeCredentialHandler = null;
  }
}
