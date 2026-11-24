import { describe, expect, it } from "vitest";
import { roleHome } from "./role-home";

describe("roleHome", () => {
  it("đưa OWNER về trang quản trị hiện có", () => {
    expect(roleHome("OWNER")).toBe("/owner");
  });

  it("đưa TENANT về dashboard người thuê", () => {
    expect(roleHome("TENANT")).toBe("/tenant");
  });

  it("giữ các vai trò chưa có dashboard ở trang hồ sơ", () => {
    expect(roleHome("STAFF")).toBe("/profile");
    expect(roleHome("CUSTOMER")).toBe("/profile");
    expect(roleHome(null)).toBe("/profile");
  });
});
