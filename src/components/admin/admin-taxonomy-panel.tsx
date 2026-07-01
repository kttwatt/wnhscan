"use client";

import { useMemo, useState } from "react";
import { sortByCatalogGroupOrder } from "@/lib/catalog/catalog-groups";
import { TaxonomyFormModal, type TaxonomyFormKind } from "@/components/admin/taxonomy-form-modal";
import {
  TaxonomyOverview,
  TaxonomyOverviewSkeleton,
  TaxonomyToolbar,
} from "@/components/admin/taxonomy-overview";
import { useCatalogTaxonomy } from "@/lib/hooks/use-catalog-taxonomy";
import type {
  CatalogGroupRow,
  CatalogSubgroupRow,
  GroupInput,
  SubgroupInput,
} from "@/lib/catalog/taxonomy-types";

const EMPTY_GROUP: GroupInput = { name: "", code: "", sortOrder: "0" };
const EMPTY_SUBGROUP: SubgroupInput = { name: "", code: "", sortOrder: "0", groupId: "" };

type FormState =
  | { open: false }
  | {
      open: true;
      kind: TaxonomyFormKind;
      mode: "create" | "edit";
      initial: GroupInput | SubgroupInput;
      editGroup: CatalogGroupRow | null;
      editSubgroup: CatalogSubgroupRow | null;
      parentGroupName?: string;
    };

export function AdminTaxonomyPanel() {
  const {
    groups,
    subgroups,
    loading,
    error,
    createGroup,
    updateGroup,
    createSubgroup,
    updateSubgroup,
  } = useCatalogTaxonomy();

  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<FormState>({ open: false });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const subgroupsByGroup = useMemo(() => {
    const map = new Map<string, CatalogSubgroupRow[]>();
    for (const group of groups) {
      map.set(
        group.id,
        subgroups.filter((sg) => sg.groupId === group.id),
      );
    }
    return map;
  }, [groups, subgroups]);

  const orderedGroups = useMemo(() => sortByCatalogGroupOrder(groups), [groups]);

  function openCreateGroup() {
    setFormError(null);
    setForm({
      open: true,
      kind: "group",
      mode: "create",
      initial: EMPTY_GROUP,
      editGroup: null,
      editSubgroup: null,
    });
  }

  function openEditGroup(group: CatalogGroupRow) {
    setFormError(null);
    setForm({
      open: true,
      kind: "group",
      mode: "edit",
      initial: {
        name: group.name,
        code: group.code ?? "",
        sortOrder: String(group.sortOrder),
      },
      editGroup: group,
      editSubgroup: null,
    });
  }

  function openCreateSubgroup(groupId: string) {
    const group = groups.find((g) => g.id === groupId);
    setFormError(null);
    setForm({
      open: true,
      kind: "subgroup",
      mode: "create",
      initial: { ...EMPTY_SUBGROUP, groupId },
      editGroup: null,
      editSubgroup: null,
      parentGroupName: group?.name,
    });
  }

  function openEditSubgroup(subgroup: CatalogSubgroupRow) {
    setFormError(null);
    setForm({
      open: true,
      kind: "subgroup",
      mode: "edit",
      initial: {
        name: subgroup.name,
        code: subgroup.code ?? "",
        sortOrder: String(subgroup.sortOrder),
        groupId: subgroup.groupId,
      },
      editGroup: null,
      editSubgroup: subgroup,
      parentGroupName: subgroup.groupName,
    });
  }

  function closeForm() {
    setForm({ open: false });
    setFormError(null);
  }

  async function handleSubmit(values: GroupInput | SubgroupInput) {
    if (!form.open) return;
    setSaving(true);
    setFormError(null);
    try {
      if (form.kind === "group") {
        const input = values as GroupInput;
        if (form.mode === "edit" && form.editGroup) {
          await updateGroup(form.editGroup.id, input);
        } else {
          await createGroup(input);
        }
      } else {
        const input = values as SubgroupInput;
        if (form.mode === "edit" && form.editSubgroup) {
          await updateSubgroup(form.editSubgroup.id, input);
        } else {
          await createSubgroup(input);
        }
      }
      closeForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="card-whitespace">
        <TaxonomyToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCreateGroup={openCreateGroup}
          groupCount={groups.length}
          subgroupCount={subgroups.length}
        />

        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        {loading ? (
          <TaxonomyOverviewSkeleton />
        ) : groups.length === 0 ? (
          <p className="mt-6 text-sm text-text-secondary">
            ยังไม่มีหมวดใหญ่ — กดเพิ่มหมวดใหญ่เพื่อเริ่มต้น
          </p>
        ) : (
          <TaxonomyOverview
            groups={orderedGroups}
            subgroupsByGroup={subgroupsByGroup}
            searchQuery={searchQuery}
            onEditGroup={openEditGroup}
            onCreateSubgroup={openCreateSubgroup}
            onEditSubgroup={openEditSubgroup}
          />
        )}
      </div>

      {form.open ? (
        <TaxonomyFormModal
          kind={form.kind}
          mode={form.mode}
          open
          parentGroupName={form.parentGroupName}
          initial={form.initial}
          error={formError}
          saving={saving}
          onClose={closeForm}
          onSubmit={(values) => void handleSubmit(values)}
        />
      ) : null}
    </>
  );
}
