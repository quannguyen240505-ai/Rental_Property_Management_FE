import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";

import { AuthService } from "./auth.service";

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.token() ? true : router.createUrlTree(["/login"]);
};

export const ownerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.token()) {
    return router.createUrlTree(["/login"]);
  }

  if (auth.role() !== "OWNER") {
    return router.createUrlTree(["/profile"]);
  }

  return true;
};
