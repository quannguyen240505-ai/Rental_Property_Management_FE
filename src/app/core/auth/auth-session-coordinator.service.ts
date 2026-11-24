import { DestroyRef, Injectable, inject } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Router } from "@angular/router";
import { AuthService } from "./auth.service";

/**
 * Application-wide session navigation. AuthService owns token lifetime;
 * this service owns only the user-facing redirect when that lifetime ends.
 */
@Injectable({ providedIn: "root" })
export class AuthSessionCoordinatorService {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.auth.sessionExpired$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        void this.router.navigateByUrl("/login?reason=expired", {
          replaceUrl: true,
        });
      });
  }
}
