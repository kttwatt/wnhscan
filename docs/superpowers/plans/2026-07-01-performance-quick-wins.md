# Performance Quick-Wins Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make WNHScan faster (dedupe redundant client/DB fetches, cap unbounded queries, shrink the client bundle) without touching the middleware + server-action + RLS security model and without adding dependencies.

**Architecture:** Client-side fetch dedupe via module-level cache + subscriber stores (mirroring `use-catalog-subgroups.ts`); request-scoped memoization of `getProfile()` with React `cache()`; server-side query caps and a batched upsert; Next config + dynamic-import bundle trims.

**Tech Stack:** Next.js 16 (App Router, Server Actions), React 19, `@supabase/ssr`, TypeScript.

**Testing note:** This repo has **no unit-test runner** (`package.json` has only `dev/build/start/lint/gen:types`). Following the codebase's existing practice, each task is verified with `npm run lint`, `npx tsc --noEmit`, and a targeted manual smoke check. Do **not** add a test framework (out of scope).

**Security invariant (applies to every task):** No change to `middleware.ts`, role checks (`requireAdmin`/`requireCatalogAdmin`/`requireDepartmentManager`), `mapAppRoleToDb`/`mapDbRoleToApp`, or RLS policies. All reads keep going through the same clients (`@/lib/supabase/server` / `/client`) so RLS still applies.

---

### Task 1: Add `lucide-react` to `optimizePackageImports`

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Edit the config**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
```

- [ ] **Step 2: Verify type + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no new errors.

- [ ] **Step 3: Verify build picks up config**

Run: `npm run build`
Expected: build succeeds; no config warnings about `experimental.optimizePackageImports`.

- [ ] **Step 4: Commit**

```bash
git add next.config.ts
git commit -m "perf: enable optimizePackageImports for lucide-react"
```

---

### Task 2: Dynamic-import `jsbarcode` in `Code128Barcode`

**Files:**
- Modify: `src/components/catalog/code128-barcode.tsx`

**Why:** `jsbarcode` is statically imported into a `"use client"` component rendered in queue/scan/admin tables, so it lands in the initial bundle of every page with a barcode. It's only used inside `useEffect`, so it can load on demand.

- [ ] **Step 1: Replace the static import with an async load inside the effect**

Remove line 4 (`import JsBarcode from "jsbarcode";`) and change the effect so it imports on demand and guards against unmount. Full new file:

```tsx
"use client";

import { useEffect, useRef } from "react";

type Code128BarcodeProps = {
  value: string;
  /** scan = large bars for USB scanner; inline = thin strip in tables; mini = dense rows with label */
  variant?: "inline" | "mini" | "compact" | "booklet" | "scan";
  className?: string;
};

const VARIANT_OPTS = {
  /** แถบบางในตาราง — ไม่แสดงตัวเลข (มีคอลัมน์รหัสอยู่แล้ว) */
  inline: { width: 1, height: 14, fontSize: 8, margin: 0, displayValue: false },
  mini: { width: 1, height: 22, fontSize: 9, margin: 2, displayValue: true },
  compact: { width: 1.5, height: 44, fontSize: 12, margin: 10, displayValue: true },
  /** สมุดรายการ A4 — บาร์โค้ดอย่างเดียว ไม่แสดงตัวเลขใต้แถบ */
  booklet: { width: 1.35, height: 38, fontSize: 8, margin: 2, displayValue: false },
  scan: { width: 4, height: 108, fontSize: 20, margin: 4, displayValue: true },
} as const;

export function Code128Barcode({
  value,
  variant = "compact",
  className = "",
}: Code128BarcodeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const opts = VARIANT_OPTS[variant];

  useEffect(() => {
    if (!svgRef.current || !value) return;
    let cancelled = false;
    const el = svgRef.current;

    void import("jsbarcode").then(({ default: JsBarcode }) => {
      if (cancelled || !el) return;
      try {
        JsBarcode(el, value, {
          format: "CODE128",
          width: opts.width,
          height: opts.height,
          displayValue: opts.displayValue,
          fontSize: opts.fontSize,
          fontOptions: "bold",
          margin: opts.margin,
          background: "transparent",
          lineColor: "#000000",
        });
      } catch {
        el.innerHTML = "";
      }
    });

    return () => {
      cancelled = true;
    };
  }, [value, opts.displayValue, opts.fontSize, opts.height, opts.margin, opts.width]);

  return (
    <svg
      ref={svgRef}
      className={`block max-w-full ${className}`}
      role="img"
      aria-label={`บาร์โค้ด ${value}`}
    />
  );
}
```

- [ ] **Step 2: Verify type + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no new errors.

- [ ] **Step 3: Manual smoke**

Run: `npm run dev`, open the admin catalog page (has many barcode rows). Expected: barcodes render (a tick after mount); no console errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/catalog/code128-barcode.tsx
git commit -m "perf: dynamic-import jsbarcode so it is not in the initial client bundle"
```

---

### Task 3: Cap `listScanBatches` at 500 most-recent and expose an optional limit

**Files:**
- Modify: `src/lib/scan/scan-db.server.ts:73-94`
- Modify: `src/lib/scan/scan-actions.ts:10-23`

**Why:** `listScanBatches` fetches every batch + all line items for a department with no limit; it grows unbounded. Query already orders by `saved_at DESC`, so a `.limit()` yields the most recent N.

- [ ] **Step 1: Add a capped limit to `listScanBatches`**

Replace the function body (lines 73-94) with:

```ts
const DEFAULT_SCAN_BATCH_LIMIT = 500;

export async function listScanBatches(
  departmentCode?: string,
  limit: number = DEFAULT_SCAN_BATCH_LIMIT,
): Promise<ScanLogEntry[]> {
  const supabase = await createClient();
  let query = supabase
    .from("scan_batches")
    .select(
      `
      id, mode, saved_at, user_id,
      departments!inner(code),
      scan_batch_items(item_code, item_name, barcode, quantity, verified)
    `,
    )
    .order("saved_at", { ascending: false })
    .limit(limit);

  if (departmentCode) {
    const departmentId = await getDepartmentUuid(departmentCode);
    query = query.eq("department_id", departmentId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as BatchRow[]).map(mapBatchRow);
}
```

(Place the `DEFAULT_SCAN_BATCH_LIMIT` const just above the function.)

- [ ] **Step 2: Thread the optional limit through the action**

In `src/lib/scan/scan-actions.ts`, update `listScanBatchesAction` (lines 10-23) to accept and forward an optional limit:

```ts
export async function listScanBatchesAction(
  departmentCode?: string,
  limit?: number,
): Promise<ActionResult<ScanLogEntry[]>> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "ยังไม่ได้ตั้งค่า Supabase" };
  }

  try {
    const data = await listScanBatches(departmentCode, limit);
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "โหลดประวัติไม่สำเร็จ" };
  }
}
```

(When `limit` is `undefined`, `listScanBatches` applies its 500 default.)

- [ ] **Step 3: Verify type + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no new errors. Existing callers pass no `limit` and keep compiling.

- [ ] **Step 4: Manual smoke**

Open the home page and scan-log modal. Expected: history still loads; most-recent batches shown.

- [ ] **Step 5: Commit**

```bash
git add src/lib/scan/scan-db.server.ts src/lib/scan/scan-actions.ts
git commit -m "perf: cap scan-batch history at 500 most-recent with optional limit"
```

---

### Task 4: SQL-side sum for `countPendingQtyForDepartmentCodes`

**Files:**
- Modify: `src/lib/pending/pending-db.server.ts:65-88`

**Why:** It currently selects every `quantity` row across the departments and sums in JS. We can fetch only the rows we need — but a full SQL `SUM` requires an RPC (schema change, out of scope). The low-risk win: keep the query but select only `quantity` (already done) and sum without loading unrelated columns; additionally short-circuit and avoid a second round-trip when possible is not available. Keep behavior identical; the measurable win here is small, so **only** tighten it if it stays a single query. Leave the JS reduce but ensure we do not fetch extra columns.

> Decision: the existing implementation already selects only `quantity`. A true `SUM` needs an RPC/migration which is out of scope. **Skip changing this function** to stay within "no migration, low-risk." Record this as intentionally deferred.

- [ ] **Step 1: No code change — add a short comment documenting the deferral**

Add above `countPendingQtyForDepartmentCodes` (line 65):

```ts
// NOTE: A SQL-side SUM would need an RPC/migration (out of scope for the
// perf quick-wins pass). Query already selects only `quantity`, so the JS
// reduce is the lightest option without a schema change.
```

- [ ] **Step 2: Verify type + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/pending/pending-db.server.ts
git commit -m "docs: note deferral of SQL-side pending sum (needs RPC)"
```

---

### Task 5: Batch `addPendingFromCart` into one read + one upsert

**Files:**
- Modify: `src/lib/pending/pending-db.server.ts:90-127`

**Why:** The loop does a `select` then `update`/`insert` per cart item (N+1). There is a `UNIQUE (department_id, item_code)` constraint (confirmed in `supabase/migrations/20260701120000_scan_and_pending_tables.sql`), so we can read all existing rows for the cart codes once, merge quantities in JS, then `upsert` once.

- [ ] **Step 1: Rewrite `addPendingFromCart`**

Replace lines 90-127 with:

```ts
export async function addPendingFromCart(
  departmentCode: string,
  items: CartSaveItem[],
): Promise<void> {
  if (items.length === 0) return;

  const departmentId = await getDepartmentUuid(departmentCode);
  const userId = await getCurrentUserId();
  const supabase = await createClient();

  const codes = items.map((item) => item.code);
  const { data: existingRows, error: readError } = await supabase
    .from("pending_queue_items")
    .select("item_code, quantity")
    .eq("department_id", departmentId)
    .in("item_code", codes);

  if (readError) throw readError;

  const existingQtyByCode = new Map<string, number>(
    (existingRows ?? []).map((row) => [row.item_code, row.quantity]),
  );

  const rows = items.map((item) => ({
    department_id: departmentId,
    item_code: item.code,
    item_name: item.name,
    barcode: item.barcode,
    item_group: item.group,
    quantity: (existingQtyByCode.get(item.code) ?? 0) + item.quantity,
    added_by: userId,
  }));

  const { error: upsertError } = await supabase
    .from("pending_queue_items")
    .upsert(rows, { onConflict: "department_id,item_code" });

  if (upsertError) throw upsertError;
}
```

- [ ] **Step 2: Verify type + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no new errors.

- [ ] **Step 3: Manual smoke (critical path)**

Run `npm run dev`. On the scan page, save a cart that includes: (a) a brand-new item, and (b) an item already in the pending queue. Open `/queue`. Expected: new item appears; existing item's quantity **increased by the added amount** (not replaced). Confirms the accumulate-then-upsert works with the unique key.

- [ ] **Step 4: Commit**

```bash
git add src/lib/pending/pending-db.server.ts
git commit -m "perf: batch addPendingFromCart into one read + one upsert"
```

---

### Task 6: Request-scoped memoization for `getProfile`

**Files:**
- Modify: `src/lib/auth/get-profile.ts`

**Why:** Dashboard `layout.tsx` and each protected page both call `getProfile()`, each doing `getUser` → profile → `listDepartments()`. React `cache()` dedupes it to once per request. Also parallelize the two independent post-profile lookups (`loadActiveDepartmentCodes()` and `enrichProfiles()`) with `Promise.all`.

- [ ] **Step 1: Import `cache` and wrap `getProfile`; parallelize the tail**

At the top of the file add `cache` to the React import (there is currently no React import, so add one):

```ts
import { cache } from "react";
```

Replace the `getProfile` function (lines 80-101) with a `cache()`-wrapped version that parallelizes the two independent awaits:

```ts
export const getProfile = cache(async (): Promise<UserProfile | null> => {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", user.id)
    .single<DbProfileRow>();

  if (!profile) return null;

  const [activeDepartmentCodes, [enriched]] = await Promise.all([
    loadActiveDepartmentCodes(),
    enrichProfiles([profile]),
  ]);
  return toUserProfile(enriched, activeDepartmentCodes);
});
```

- [ ] **Step 2: Verify type + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no new errors. `getProfile` keeps the same call signature (`() => Promise<UserProfile | null>`), so all callers compile unchanged.

- [ ] **Step 3: Manual smoke (all three roles)**

Run `npm run dev`. Log in as user, then manager, then admin. Expected for each: dashboard loads, sidebar + page render the correct department scope and role-gated nav. Confirms memoization did not change auth semantics.

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth/get-profile.ts
git commit -m "perf: memoize getProfile per request and parallelize its tail lookups"
```

---

### Task 7: Shared dedupe store for `useScanLogs`

**Files:**
- Create: `src/lib/hooks/scan-logs-store.ts`
- Modify: `src/lib/hooks/use-scan-logs.ts`

**Why:** Home (`useScanVolumeStats` + mounted `ScanLogModal`), close-round, and queue pages instantiate `useScanLogs` multiple times, each firing an independent full history fetch. A shared store keyed by `departmentCode` dedupes concurrent fetches and shares results, invalidated by the existing `SCAN_LOG_CHANGED_EVENT`.

- [ ] **Step 1: Create the store**

Create `src/lib/hooks/scan-logs-store.ts`:

```ts
import { listScanBatchesAction } from "@/lib/scan/scan-actions";
import type { ScanLogEntry } from "@/lib/scan/scan-log";

type Listener = (logs: ScanLogEntry[]) => void;

type Entry = {
  logs: ScanLogEntry[];
  listeners: Set<Listener>;
  inFlight: Promise<void> | null;
};

const KEY_NO_DEPT = "__all__";
const entries = new Map<string, Entry>();

function keyFor(departmentCode?: string): string {
  return departmentCode ?? KEY_NO_DEPT;
}

function getEntry(key: string): Entry {
  let entry = entries.get(key);
  if (!entry) {
    entry = { logs: [], listeners: new Set(), inFlight: null };
    entries.set(key, entry);
  }
  return entry;
}

export function getScanLogsSnapshot(departmentCode?: string): ScanLogEntry[] {
  return entries.get(keyFor(departmentCode))?.logs ?? [];
}

export function subscribeScanLogs(
  departmentCode: string | undefined,
  listener: Listener,
): () => void {
  const entry = getEntry(keyFor(departmentCode));
  entry.listeners.add(listener);
  return () => {
    entry.listeners.delete(listener);
  };
}

/** Fetch once; concurrent callers share the same in-flight promise. Pass force to bypass. */
export function refreshScanLogs(
  departmentCode: string | undefined,
  force = false,
): Promise<void> {
  const key = keyFor(departmentCode);
  const entry = getEntry(key);

  if (entry.inFlight && !force) return entry.inFlight;

  const promise = listScanBatchesAction(departmentCode)
    .then((result) => {
      if (result.ok) {
        entry.logs = result.data;
        for (const listener of entry.listeners) listener(entry.logs);
      }
    })
    .finally(() => {
      entry.inFlight = null;
    });

  entry.inFlight = promise;
  return promise;
}
```

- [ ] **Step 2: Rewrite `use-scan-logs.ts` to consume the store**

Replace the whole file with:

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SCAN_LOG_CHANGED_EVENT, type ScanLogEntry } from "@/lib/scan/scan-log";
import {
  getScanLogsSnapshot,
  refreshScanLogs,
  subscribeScanLogs,
} from "@/lib/hooks/scan-logs-store";

export function useScanLogs(departmentCode?: string) {
  const [logs, setLogs] = useState<ScanLogEntry[]>(() =>
    getScanLogsSnapshot(departmentCode),
  );
  const [mounted, setMounted] = useState(false);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLogs([]);
      return;
    }
    await refreshScanLogs(departmentCode, true);
  }, [departmentCode]);

  useEffect(() => {
    setMounted(true);
    if (!isSupabaseConfigured()) {
      setLogs([]);
      return;
    }

    setLogs(getScanLogsSnapshot(departmentCode));
    const unsubscribe = subscribeScanLogs(departmentCode, setLogs);
    void refreshScanLogs(departmentCode);

    const onChange = () => void refreshScanLogs(departmentCode, true);
    window.addEventListener(SCAN_LOG_CHANGED_EVENT, onChange);
    return () => {
      unsubscribe();
      window.removeEventListener(SCAN_LOG_CHANGED_EVENT, onChange);
    };
  }, [departmentCode]);

  return { logs, mounted, refresh };
}
```

Note: the returned shape (`{ logs, mounted, refresh }`) is unchanged, so consumers need no edits.

- [ ] **Step 3: Verify type + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no new errors.

- [ ] **Step 4: Manual smoke (dedupe check)**

Run `npm run dev`, open DevTools Network, filter to the scan-batches action request, and load the **home page** (which mounts both `useScanVolumeStats` and `ScanLogModal`). Expected: **one** scan-batch fetch instead of two. Saving a scan (fires `SCAN_LOG_CHANGED_EVENT`) refreshes the list.

- [ ] **Step 5: Commit**

```bash
git add src/lib/hooks/scan-logs-store.ts src/lib/hooks/use-scan-logs.ts
git commit -m "perf: dedupe scan-log fetches via shared client store"
```

---

### Task 8: Shared dedupe store for `usePendingQueue`

**Files:**
- Create: `src/lib/hooks/pending-queue-store.ts`
- Modify: `src/lib/hooks/use-pending-queue.ts`

**Why:** Same pattern — home (`usePendingQueue`) and the sidebar badge (`useCloseRoundPendingCount`) fetch pending data independently. Dedupe reads by `departmentId` while keeping the existing mutation actions and event/focus invalidation.

- [ ] **Step 1: Create the store (reads only; mutations stay in the hook)**

Create `src/lib/hooks/pending-queue-store.ts`:

```ts
import { listPendingAction } from "@/lib/pending/pending-actions";
import { getPendingForDepartment, type PendingQueueItem } from "@/lib/pending/pending-store";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Listener = (items: PendingQueueItem[]) => void;

type Entry = {
  items: PendingQueueItem[];
  listeners: Set<Listener>;
  inFlight: Promise<void> | null;
};

const entries = new Map<string, Entry>();

function getEntry(departmentId: string): Entry {
  let entry = entries.get(departmentId);
  if (!entry) {
    entry = { items: [], listeners: new Set(), inFlight: null };
    entries.set(departmentId, entry);
  }
  return entry;
}

export function getPendingSnapshot(departmentId: string): PendingQueueItem[] {
  return entries.get(departmentId)?.items ?? [];
}

export function subscribePending(
  departmentId: string,
  listener: Listener,
): () => void {
  const entry = getEntry(departmentId);
  entry.listeners.add(listener);
  return () => {
    entry.listeners.delete(listener);
  };
}

export function refreshPending(departmentId: string, force = false): Promise<void> {
  if (!departmentId) return Promise.resolve();
  const entry = getEntry(departmentId);
  if (entry.inFlight && !force) return entry.inFlight;

  const load = async () => {
    if (isSupabaseConfigured()) {
      const result = await listPendingAction(departmentId);
      if (result.ok) entry.items = result.data;
    } else {
      entry.items = getPendingForDepartment(departmentId);
    }
    for (const listener of entry.listeners) listener(entry.items);
  };

  const promise = load().finally(() => {
    entry.inFlight = null;
  });
  entry.inFlight = promise;
  return promise;
}
```

- [ ] **Step 2: Rewrite `use-pending-queue.ts` to read from the store; keep mutations**

Replace the whole file with:

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  addPendingAction,
  removePendingAction,
  updatePendingQuantityAction,
} from "@/lib/pending/pending-actions";
import {
  addToPendingFromCart,
  PENDING_CHANGED_EVENT,
  removePendingCodes,
  updatePendingItemQuantity,
  type CartSaveItem,
  type PendingQueueItem,
} from "@/lib/pending/pending-store";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  getPendingSnapshot,
  refreshPending,
  subscribePending,
} from "@/lib/hooks/pending-queue-store";

export function usePendingQueue(departmentId: string) {
  const [items, setItems] = useState<PendingQueueItem[]>(() =>
    departmentId ? getPendingSnapshot(departmentId) : [],
  );
  const pathname = usePathname();

  const refresh = useCallback(async () => {
    if (!departmentId) {
      setItems([]);
      return;
    }
    await refreshPending(departmentId, true);
  }, [departmentId]);

  useEffect(() => {
    if (!departmentId) {
      setItems([]);
      return;
    }
    setItems(getPendingSnapshot(departmentId));
    const unsubscribe = subscribePending(departmentId, setItems);
    void refreshPending(departmentId);
    return unsubscribe;
  }, [departmentId, pathname]);

  useEffect(() => {
    if (!departmentId) return;
    const onPendingChanged = () => void refreshPending(departmentId, true);
    window.addEventListener(PENDING_CHANGED_EVENT, onPendingChanged);
    window.addEventListener("focus", onPendingChanged);
    return () => {
      window.removeEventListener(PENDING_CHANGED_EVENT, onPendingChanged);
      window.removeEventListener("focus", onPendingChanged);
    };
  }, [departmentId]);

  const saveCartToPending = useCallback(
    async (cartItems: CartSaveItem[]) => {
      if (isSupabaseConfigured()) {
        await addPendingAction(departmentId, cartItems);
      } else {
        addToPendingFromCart(departmentId, cartItems);
      }
      await refreshPending(departmentId, true);
    },
    [departmentId],
  );

  const removeCompleted = useCallback(
    async (codes: string[]) => {
      if (isSupabaseConfigured()) {
        await removePendingAction(departmentId, codes);
      } else {
        removePendingCodes(departmentId, codes);
      }
      await refreshPending(departmentId, true);
    },
    [departmentId],
  );

  const updateQuantity = useCallback(
    async (code: string, quantity: number) => {
      if (isSupabaseConfigured()) {
        await updatePendingQuantityAction(departmentId, code, quantity);
      } else {
        updatePendingItemQuantity(departmentId, code, quantity);
      }
      await refreshPending(departmentId, true);
    },
    [departmentId],
  );

  const removeItem = useCallback(
    async (code: string) => {
      if (isSupabaseConfigured()) {
        await removePendingAction(departmentId, [code]);
      } else {
        removePendingCodes(departmentId, [code]);
      }
      await refreshPending(departmentId, true);
    },
    [departmentId],
  );

  return {
    items,
    saveCartToPending,
    removeCompleted,
    updateQuantity,
    removeItem,
    refresh,
  };
}
```

Note: return shape is unchanged; `listPendingAction` / `getPendingForDepartment` imports move into the store.

- [ ] **Step 3: Verify type + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no new errors.

- [ ] **Step 4: Manual smoke (dedupe + all roles for the badge)**

Run `npm run dev`. On the home page (which mounts `usePendingQueue` and the sidebar `useCloseRoundPendingCount`), watch Network for the pending action. Expected: pending list + sidebar badge stay correct; saving/removing pending items updates both. Verify the sidebar badge for user / manager / admin.

- [ ] **Step 5: Commit**

```bash
git add src/lib/hooks/pending-queue-store.ts src/lib/hooks/use-pending-queue.ts
git commit -m "perf: dedupe pending-queue reads via shared client store"
```

---

### Task 9: Final verification pass

**Files:** none (verification only)

- [ ] **Step 1: Full lint + type check**

Run: `npm run lint && npx tsc --noEmit`
Expected: clean.

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: succeeds. Sanity-check the route/bundle output; `jsbarcode` should no longer be in the shared/initial chunk for barcode pages.

- [ ] **Step 3: Role re-verification (security invariant)**

Manually confirm for **user / manager / admin**: login, dashboard, department page, close-round (manager/admin), admin pages (admin only). Expected: identical access as before — no route/role regressions.

- [ ] **Step 4: Confirm no debug/telemetry left behind**

Grep the diff for stray `console.log` / external fetch added during this work. Expected: none.

---

## Self-Review

**Spec coverage:**
- Spec §1 (dedupe client fetches) → Tasks 7, 8. ✓
- Spec §2 (dedupe `getProfile`) → Task 6. ✓
- Spec §3 (cap unbounded queries) → Task 3 (scan cap); pending sum → Task 4 (deferred with rationale, matches "no migration" constraint). ✓ (deviation documented)
- Spec §4 (bundle trim) → Tasks 1, 2. ✓
- Spec §5 (batch pending-cart writes) → Task 5. ✓
- Verification (lint/type/roles) → Task 9. ✓

**Placeholder scan:** No TBD/TODO left in executable steps; Task 4 intentionally documents a deferral (with reason) rather than leaving vague work.

**Type consistency:** Store fn names consistent (`refreshScanLogs`/`subscribeScanLogs`/`getScanLogsSnapshot`; `refreshPending`/`subscribePending`/`getPendingSnapshot`). Hook return shapes unchanged (`{ logs, mounted, refresh }`, and the pending hook's five members) so downstream consumers need no edits. `listScanBatches(departmentCode?, limit?)` and `listScanBatchesAction(departmentCode?, limit?)` signatures agree.

**Note on Task 4:** During brainstorming we agreed to a SQL-side sum, but a true `SUM` needs an RPC/migration which conflicts with the "no migration, low-risk" scope. The plan defers it with a documented rationale instead of forcing a schema change. Flag for the user at execution time.
