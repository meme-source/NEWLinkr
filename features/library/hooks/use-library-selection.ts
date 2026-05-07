"use client";

import { useCallback, useMemo, useState } from "react";

export function useLibrarySelection() {
  const [ids, setIds] = useState<Set<string>>(() => new Set());

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setAll = useCallback((nextIds: string[]) => {
    setIds(new Set(nextIds));
  }, []);

  const clear = useCallback(() => setIds(new Set()), []);

  const isAllSelected = useCallback(
    (visible: string[]) => visible.length > 0 && visible.every((id) => ids.has(id)),
    [ids],
  );

  const count = useMemo(() => ids.size, [ids]);

  return { ids, toggle, setAll, clear, isAllSelected, count };
}
