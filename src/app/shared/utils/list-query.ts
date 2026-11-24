/** Pure list transforms for small, client-side datasets. Server-side pagination
 * can use the same UiPagination component without downloading all records. */
export function searchItems<T>(
  items: readonly T[],
  query: string,
  fields: (item: T) => readonly (string | null | undefined)[],
): T[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return [...items];
  return items.filter((item) =>
    fields(item).some((value) =>
      (value ?? "").toLocaleLowerCase().includes(needle),
    ),
  );
}

export function filterItems<T>(
  items: readonly T[],
  predicates: readonly ((item: T) => boolean)[],
): T[] {
  return items.filter((item) =>
    predicates.every((predicate) => predicate(item)),
  );
}

export function getTotalPages(totalItems: number, pageSize: number): number {
  if (!Number.isFinite(pageSize) || pageSize < 1)
    throw new RangeError("pageSize must be positive");
  return Math.max(1, Math.ceil(Math.max(0, totalItems) / pageSize));
}

export function clampPage(
  page: number,
  totalItems: number,
  pageSize: number,
): number {
  return Math.min(
    Math.max(1, Math.trunc(page) || 1),
    getTotalPages(totalItems, pageSize),
  );
}

export function paginateItems<T>(
  items: readonly T[],
  page: number,
  pageSize: number,
): T[] {
  const safePage = clampPage(page, items.length, pageSize);
  const start = (safePage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}
