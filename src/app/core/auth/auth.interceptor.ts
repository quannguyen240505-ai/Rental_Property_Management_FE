import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { catchError, throwError } from "rxjs";

import { AuthService } from "./auth.service";

const PUBLIC_AUTH_PATHS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/google",
];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  const token = auth.token();
  const path = req.url.split("?")[0];

  const isLocalApi = path.startsWith("/api/");
  const isPublicAuth = PUBLIC_AUTH_PATHS.includes(path);

  const isPublicRooms =
    req.method === "GET" &&
    (path === "/api/public/rooms" || path.startsWith("/api/public/rooms/"));

  const shouldAttachToken =
    isLocalApi && !isPublicAuth && !isPublicRooms && !!token;

  const request = shouldAttachToken
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  return next(request).pipe(
    catchError((error) => {
      if (error.status === 401 && shouldAttachToken && auth.token() === token) {
        auth.expireSession();
      }

      return throwError(() => error);
    }),
  );
};
