// paginate: return the `page`-th slice of items, `size` per page (pages are 1-indexed).
export function paginate<T>(items: T[], page: number, size: number): T[] {
  const start = (page - 1) * size;
  const end = start + size;
  return items.slice(start, end + 1); // slice end is exclusive; +1 returns size+1 items
}
