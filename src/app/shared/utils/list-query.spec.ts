import { describe, expect, it } from "vitest";
import {
  clampPage,
  filterItems,
  getTotalPages,
  paginateItems,
  searchItems,
} from "./list-query";

const items = [
  { name: "Nguyễn Văn A", role: "STAFF", email: "a@example.com" },
  { name: "Trần Văn B", role: "CUSTOMER", email: "b@example.com" },
  { name: "Nguyễn Văn C", role: "STAFF", email: null },
];

describe("list-query utilities", () => {
  it("searches configured fields, ignoring case and outer spaces", () => {
    expect(
      searchItems(items, " NGUYỄN ", (item) => [item.name, item.email]),
    ).toHaveLength(2);
    expect(
      searchItems(items, "a@EXAMPLE", (item) => [item.name, item.email]),
    ).toHaveLength(1);
  });
  it("does not mutate the original list", () => {
    const original = [...items];
    expect(searchItems(items, "", (item) => [item.name])).toEqual(original);
    expect(items).toEqual(original);
  });
  it("supports business-agnostic AND filters", () => {
    expect(
      filterItems(items, [
        (x) => x.role === "STAFF",
        (x) => x.name.includes("C"),
      ]),
    ).toHaveLength(1);
  });
  it("paginates arrays and clamps invalid or out-of-range pages", () => {
    expect(paginateItems(items, 2, 2)).toEqual([items[2]]);
    expect(paginateItems(items, 99, 2)).toEqual([items[2]]);
    expect(clampPage(0, 3, 2)).toBe(1);
    expect(getTotalPages(0, 10)).toBe(1);
  });
  it("rejects invalid page size", () => {
    expect(() => paginateItems(items, 1, 0)).toThrow(RangeError);
  });
});
