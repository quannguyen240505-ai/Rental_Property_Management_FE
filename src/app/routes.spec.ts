import { describe, expect, it } from "vitest";
import { ownerGuard, tenantGuard } from "./core/auth/auth.guard";
import { routes } from "./routes";

describe("Application routing after foundation refactor", () => {
  it("giữ URL và guard của hai dashboard", () => {
    const owner = routes.find((route) => route.path === "owner");
    const tenant = routes.find((route) => route.path === "tenant");
    expect(owner?.canActivate).toContain(ownerGuard);
    expect(tenant?.canActivate).toContain(tenantGuard);
    expect(owner?.loadComponent).toBeTypeOf("function");
    expect(tenant?.loadComponent).toBeTypeOf("function");
  });

  it("giữ route quản lý tài khoản OWNER và chuyển sang lazy loading", () => {
    const users = routes.find((route) => route.path === "owner/users");
    expect(users?.canActivate).toContain(ownerGuard);
    expect(users?.loadComponent).toBeTypeOf("function");
    expect(users?.component).toBeUndefined();
  });

  it("giữ nguyên route Profile và Notification", () => {
    expect(routes.some((route) => route.path === "profile")).toBe(true);
    expect(routes.some((route) => route.path === "notifications")).toBe(true);
  });
});
