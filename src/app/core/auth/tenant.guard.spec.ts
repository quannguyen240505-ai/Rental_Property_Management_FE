import { TestBed } from "@angular/core/testing";
import {
  ActivatedRouteSnapshot,
  provideRouter,
  RouterStateSnapshot,
  UrlTree,
} from "@angular/router";
import { beforeEach, describe, expect, it } from "vitest";
import { AuthService } from "./auth.service";
import { tenantGuard } from "./auth.guard";

describe("tenantGuard", () => {
  let authenticated = false;
  let role: string | null = null;

  const check = () =>
    TestBed.runInInjectionContext(() =>
      tenantGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

  beforeEach(() => {
    authenticated = false;
    role = null;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: () => authenticated,
            role: () => role,
          },
        },
      ],
    });
  });

  it("yêu cầu đăng nhập khi chưa có phiên", () => {
    expect((check() as UrlTree).toString()).toBe("/login");
  });

  it("cho TENANT truy cập dashboard", () => {
    authenticated = true;
    role = "TENANT";
    expect(check()).toBe(true);
  });

  it("chặn OWNER, STAFF và CUSTOMER truy cập dashboard của TENANT", () => {
    authenticated = true;
    for (const candidate of ["OWNER", "STAFF", "CUSTOMER"]) {
      role = candidate;
      expect((check() as UrlTree).toString()).toBe("/profile");
    }
  });
});
