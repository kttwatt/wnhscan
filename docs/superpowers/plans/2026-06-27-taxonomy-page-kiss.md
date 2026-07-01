# Taxonomy Page KISS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `/admin/subgroup-mapping` to KISS overview layout — all groups visible, flat subgroup rows, minimal modal, search filter.

**Architecture:** Split `AdminTaxonomyPanel` into orchestration + `TaxonomyOverview` (presentational) + `TaxonomyFormModal` (collapsible advanced fields). Reuse `useCatalogTaxonomy` hook unchanged.

**Tech Stack:** Next.js App Router, React client components, existing taxonomy server actions

**Spec:** [`docs/superpowers/specs/2026-06-27-taxonomy-page-kiss-design.md`](../specs/2026-06-27-taxonomy-page-kiss-design.md)

---

### Task 1: TaxonomyFormModal

**Files:**
- Create: `src/components/admin/taxonomy-form-modal.tsx`

- [x] Modal with name (required, autoFocus), collapsible รหัส/ลำดับ, parent group read-only for subgroups

### Task 2: TaxonomyOverview + Toolbar

**Files:**
- Create: `src/components/admin/taxonomy-overview.tsx`

- [x] Section per group, flat rows (name + itemCount + edit), client search filter, skeleton loader

### Task 3: Refactor AdminTaxonomyPanel

**Files:**
- Modify: `src/components/admin/admin-taxonomy-panel.tsx`

- [x] Remove tabs, expand/collapse, inline FormDialog; wire new components + unified form state

### Task 4: Page copy

**Files:**
- Modify: `src/app/(dashboard)/admin/subgroup-mapping/page.tsx`

- [x] Shorter PageHeader description

### Task 5: Verify

- [x] Run: `npx tsc --noEmit`
- [x] Run: `npm run build`

---

## Spec coverage

| Requirement | Task |
|-------------|------|
| All groups expanded | Task 2, 3 |
| Name + count on main | Task 2 |
| Minimal modal | Task 1 |
| Search filter | Task 2 |
| Loading skeleton | Task 2 |
| No delete / no route change | Out of scope — unchanged |
