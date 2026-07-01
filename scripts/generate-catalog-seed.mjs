/**
 * Export catalog seed SQL from the linked Supabase project (source).
 * Usage: npx supabase link --project-ref <source> --yes && node scripts/generate-catalog-seed.mjs
 */
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

function query(sql) {
  const oneLine = sql.replace(/\s+/g, " ").trim();
  const raw = execSync(`npx supabase db query --linked ${JSON.stringify(oneLine)}`, {
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
  });
  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");
  if (jsonStart === -1) return [];
  const payload = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
  return payload.rows ?? [];
}

function esc(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function escUuid(value) {
  return value ? `${esc(value)}::uuid` : "NULL";
}

function escTs(value) {
  return value ? `${esc(value)}::timestamptz` : "NULL";
}

const lines = [
  "-- Seed departments + catalog master from legacy WNHScan project",
  "BEGIN;",
  "",
];

const departments = query(`
  SELECT id, name, code, created_at
  FROM departments
  WHERE deleted_at IS NULL
  ORDER BY code
`);

lines.push("INSERT INTO public.departments (id, name, code, created_at) VALUES");
lines.push(
  departments
    .map(
      (r) =>
        `  (${escUuid(r.id)}, ${esc(r.name)}, ${esc(r.code)}, ${escTs(r.created_at)})`,
    )
    .join(",\n"),
);
lines.push("ON CONFLICT (id) DO NOTHING;");
lines.push("");

const groups = query(`
  SELECT id, name, sort_order, created_at, code
  FROM item_groups
  WHERE deleted_at IS NULL
  ORDER BY sort_order, name
`);

lines.push("INSERT INTO public.item_groups (id, name, sort_order, created_at, code) VALUES");
lines.push(
  groups
    .map(
      (r) =>
        `  (${escUuid(r.id)}, ${esc(r.name)}, ${r.sort_order}, ${escTs(r.created_at)}, ${esc(r.code)})`,
    )
    .join(",\n"),
);
lines.push("ON CONFLICT (id) DO NOTHING;");
lines.push("");

const subgroups = query(`
  SELECT id, group_id, name, sort_order, created_at, code
  FROM item_subgroups
  WHERE deleted_at IS NULL
  ORDER BY group_id, sort_order, name
`);

lines.push(
  "INSERT INTO public.item_subgroups (id, group_id, name, sort_order, created_at, code) VALUES",
);
lines.push(
  subgroups
    .map(
      (r) =>
        `  (${escUuid(r.id)}, ${escUuid(r.group_id)}, ${esc(r.name)}, ${r.sort_order}, ${escTs(r.created_at)}, ${esc(r.code)})`,
    )
    .join(",\n"),
);
lines.push("ON CONFLICT (id) DO NOTHING;");
lines.push("");

const items = query(`
  SELECT id, code, name, unit, price, barcode, subgroup_id, created_at, updated_at, deleted_at
  FROM items
  ORDER BY code
`);

const itemChunks = [];
for (let i = 0; i < items.length; i += 50) {
  const chunk = items.slice(i, i + 50);
  itemChunks.push(chunk);
}

for (const chunk of itemChunks) {
  lines.push(
    "INSERT INTO public.items (id, code, name, unit, price, barcode, subgroup_id, created_at, updated_at, deleted_at) VALUES",
  );
  lines.push(
    chunk
      .map(
        (r) =>
          `  (${escUuid(r.id)}, ${esc(r.code)}, ${esc(r.name)}, ${esc(r.unit)}, ${r.price}, ${esc(r.barcode)}, ${escUuid(r.subgroup_id)}, ${escTs(r.created_at)}, ${escTs(r.updated_at)}, ${escTs(r.deleted_at)})`,
      )
      .join(",\n"),
  );
  lines.push("ON CONFLICT (id) DO NOTHING;");
  lines.push("");
}

const deptItems = query(
  "SELECT id, department_id, item_id, added_at, deleted_at FROM department_items ORDER BY department_id, added_at",
);

const diChunks = [];
for (let i = 0; i < deptItems.length; i += 50) {
  diChunks.push(deptItems.slice(i, i + 50));
}

for (const chunk of diChunks) {
  lines.push(
    "INSERT INTO public.department_items (id, department_id, item_id, added_at, deleted_at) VALUES",
  );
  lines.push(
    chunk
      .map(
        (r) =>
          `  (${escUuid(r.id)}, ${escUuid(r.department_id)}, ${escUuid(r.item_id)}, ${escTs(r.added_at)}, ${escTs(r.deleted_at)})`,
      )
      .join(",\n"),
  );
  lines.push("ON CONFLICT (id) DO NOTHING;");
  lines.push("");
}

lines.push("COMMIT;");
lines.push("");

const outPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260625150000_seed_catalog.sql",
);
writeFileSync(outPath, lines.join("\n"), "utf8");
console.log(`Wrote ${outPath}`);
console.log(
  `departments=${departments.length} groups=${groups.length} subgroups=${subgroups.length} items=${items.length} department_items=${deptItems.length}`,
);
