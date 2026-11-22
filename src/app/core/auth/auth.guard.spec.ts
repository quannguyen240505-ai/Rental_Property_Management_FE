import { signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { Router, UrlTree, provideRouter } from "@angular/router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthService } from "./auth.service";
import { authGuard, guestGuard, ownerGuard } from "./auth.guard";

describe("Auth route guards", () => {
  const authStub = {
    isAuthenticated: vi.fn<() => boolean>(),
    role: signal<string | null>(null),
  };
  let router: Router;

  beforeEach(() => {
    authStub.isAuthenticated.mockReset();
    authStub.isAuthenticated.mockReturnValue(false);
    authStub.role.set(null);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
      ],
    });
    router = TestBed.inject(Router);
  });

  function destination(guard: typeof authGuard): string | boolean {
    const result = TestBed.runInInjectionContext(() =>
      guard({} as never, {} as never),
    );
    return typeof result === "boolean"
      ? result
      : router.serializeUrl(result as UrlTree);
  }

  it("authGuard chuyển khách chưa đăng nhập về /login", () => {
    expect(destination(authGuard)).toBe("/login");
  });

  it("authGuard cho phép người đã đăng nhập", () => {
    authStub.isAuthenticated.mockReturnValue(true);
    expect(destination(authGuard)).toBe(true);
  });

  it("guestGuard cho phép truy cập khi chưa đăng nhập", () => {
    expect(destination(guestGuard)).toBe(true);
  });

  it("guestGuard điều hướng OWNER đã đăng nhập đến /owner", () => {
    authStub.isAuthenticated.mockReturnValue(true);
    authStub.role.set("OWNER");
    expect(destination(guestGuard)).toBe("/owner");
  });

  it("guestGuard điều hướng CUSTOMER đã đăng nhập đến /profile", () => {
    authStub.isAuthenticated.mockReturnValue(true);
    authStub.role.set("CUSTOMER");
    expect(destination(guestGuard)).toBe("/profile");
  });

  it("ownerGuard không cho khách chưa đăng nhập vào /owner", () => {
    expect(destination(ownerGuard)).toBe("/login");
  });

  it("ownerGuard từ chối role khác OWNER", () => {
    authStub.isAuthenticated.mockReturnValue(true);
    authStub.role.set("STAFF");
    expect(destination(ownerGuard)).toBe("/profile");
  });

  it("ownerGuard cho OWNER truy cập", () => {
    authStub.isAuthenticated.mockReturnValue(true);
    authStub.role.set("OWNER");
    expect(destination(ownerGuard)).toBe(true);
  });
});
