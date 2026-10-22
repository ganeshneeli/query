import { useMemo, useState } from "react";

export type SortDir = "asc" | "desc";

export function sortRows<T>(rows: T[], key: keyof T | null, dir: SortDir): T[] {
  if (!key) return rows;
  return [...rows].sort((a, b) => {
    const av = a[key],
      bv = b[key];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    const c =
      typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv));
    return dir === "asc" ? c : -c;
  });
}

export function paginate<T>(rows: T[], page: number, size: number) {
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const p = Math.min(Math.max(1, page), pages);
  return { pageRows: rows.slice((p - 1) * size, p * size), pages, page: p };
}

export function useTable<T>(rows: T[], opts: { pageSize?: number; initialSort?: keyof T } = {}) {
  const [sortKey, setSortKey] = useState<keyof T | null>(opts.initialSort ?? null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const size = opts.pageSize ?? 8;
  const sorted = useMemo(() => sortRows(rows, sortKey, sortDir), [rows, sortKey, sortDir]);
  const pg = paginate(sorted, page, size);
  return {
    ...pg,
    total: rows.length,
    sortKey,
    sortDir,
    setPage,
    toggleSort: (k: keyof T) => {
      if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
      else {
        setSortKey(k);
        setSortDir("desc");
      }
      setPage(1);
    },
  };
}
