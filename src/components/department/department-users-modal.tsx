"use client";

import Link from "next/link";
import { Users, X } from "lucide-react";
import { formatDepartmentLabel } from "@/lib/auth/departments";
import type { ProfileRow } from "@/lib/auth/database";
import { formatUserRole } from "@/lib/auth/roles";

type DepartmentUsersModalProps = {
  open: boolean;
  departmentId: string;
  users: ProfileRow[];
  loading: boolean;
  onClose: () => void;
};

export function DepartmentUsersModal({
  open,
  departmentId,
  users,
  loading,
  onClose,
}: DepartmentUsersModalProps) {
  if (!open) return null;

  const deptLabel = formatDepartmentLabel(departmentId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="department-users-title"
    >
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl border border-border bg-surface-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 id="department-users-title" className="text-lg font-bold text-navy-900">
              ผู้ใช้ในแผนก {deptLabel}
            </h2>
            <p className="mt-0.5 text-sm text-text-secondary">
              อ่านอย่างเดียว — จัดการสิทธิ์ที่{" "}
              <Link href="/admin/users" className="font-semibold text-blue-primary hover:underline">
                ผู้ดูแลระบบ
              </Link>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-text-secondary hover:bg-surface-page"
            aria-label="ปิด"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <p className="text-sm text-text-secondary">กำลังโหลดผู้ใช้…</p>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-page px-6 py-12 text-center">
              <Users className="h-10 w-10 text-text-muted" />
              <p className="mt-3 font-semibold text-navy-900">ยังไม่มีผู้ใช้ในแผนกนี้</p>
              <p className="mt-1 text-sm text-text-secondary">
                ผู้ใช้ที่สังกัด {deptLabel} จะแสดงที่นี่
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="bg-surface-page">
                  <tr className="border-b border-border text-text-secondary">
                    <th className="px-4 py-3 font-semibold">อีเมล</th>
                    <th className="px-4 py-3 font-semibold">บทบาท</th>
                    <th className="px-4 py-3 font-semibold">หน่วยงาน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-blue-light/20">
                      <td className="px-4 py-3 font-medium text-navy-900">{user.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            user.role === "manager"
                              ? "bg-yellow-light text-navy-900"
                              : "bg-blue-light text-blue-primary"
                          }`}
                        >
                          {formatUserRole(user.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {user.department_ids.map(formatDepartmentLabel).join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
