"use client";

import { useEffect, useState } from "react";

/** True after the first client render — use to gate browser-only values. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
