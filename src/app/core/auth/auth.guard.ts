import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "./auth.service";

// Yêu cầu người dùng đăng nhập.
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated() ? true : router.createUrlTree(["/login"]);
};

// Chỉ người chưa đăng nhập mới được vào Login.
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree([
    auth.role() === "OWNER" ? "/owner" : "/profile",
  ]);
};

// Chỉ OWNER được truy cập chức năng quản trị.
export const ownerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(["/login"]);
  }

  if (auth.role() !== "OWNER") {
    return router.createUrlTree(["/profile"]);
  }

  return true;
};
