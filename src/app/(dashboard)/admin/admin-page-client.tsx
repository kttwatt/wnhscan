"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";

const ADMIN_LINKS = [
  {
    href: "/admin/users",
    label: "จัดการผู้ใช้งาน",
    desc: "สร้าง แก้ไข และกำหนดบทบาทผู้ใช้ในระบบ",
  },
  {
    href: "/admin/catalog",
    label: "จัดการรายการวัสดุ",
    desc: "ฐานข้อมูลวัสดุกลางและรายการในทุกหน่วยงาน",
  },
  {
    href: "/admin/subgroup-mapping",
    label: "จัดการหมวดวัสดุ",
    desc: "กลุ่มวัสดุและกลุ่มย่อยในฐานข้อมูลกลาง",
  },
  { href: "/admin/trash", label: "ถังขยะ", desc: "กู้คืน · ลบถาวร (30 วัน)" },
];

export function AdminPageClient() {
  return (
    <>
      <PageHeader
        title="ผู้ดูแลระบบ"
        description="จัดการผู้ใช้งาน รายการวัสดุ และหน่วยงาน"
      />

      <div className="grid gap-4 p-8 sm:grid-cols-2 lg:grid-cols-3">
        {ADMIN_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="card-whitespace block transition-shadow hover:border-blue-primary/40"
          >
            <h2 className="font-bold text-navy-900">{link.label}</h2>
            <p className="mt-2 text-sm text-text-secondary">{link.desc}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
