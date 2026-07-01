"use client";

import Link from "next/link";
import { useSession } from "@/components/auth/session-provider";
import { DepartmentCatalogPanel } from "@/components/department/department-catalog-panel";
import { PageHeader } from "@/components/layout/page-header";
import { DepartmentSwitcher } from "@/components/layout/department-switcher";
import { isAdmin } from "@/lib/auth/access";
import { formatDepartmentLabel } from "@/lib/auth/departments";
import { useDepartmentScope } from "@/lib/hooks/use-department-scope";

export function DepartmentPageClient() {
  const profile = useSession();
  const { departmentId, setDepartmentId, departments, locked } = useDepartmentScope();

  return (
    <>
      <PageHeader
        title={formatDepartmentLabel(departmentId)}
        description="เพิ่มวัสดุจากฐานข้อมูลกลางและจัดการผู้ใช้ในหน่วยงาน"
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={isAdmin(profile) ? "/admin" : "/"}
              className="text-sm font-semibold text-blue-primary hover:underline"
            >
              กลับ
            </Link>
            <DepartmentSwitcher
              value={departmentId}
              departments={departments}
              locked={locked}
              onChange={setDepartmentId}
            />
          </div>
        }
      />

      <div className="flex flex-1 flex-col gap-6 p-8">
        <DepartmentCatalogPanel departmentId={departmentId} />
      </div>
    </>
  );
}
