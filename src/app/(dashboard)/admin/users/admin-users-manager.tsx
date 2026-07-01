"use client";

import { KeyRound, MoreVertical, UserX, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import type { ProfileRow } from "@/lib/auth/database";
import {
  type DepartmentRow,
  departmentLabelByCode,
} from "@/lib/auth/departments-db";
import { formatUserRole } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/auth/types";
import { DepartmentMultiSelect } from "@/components/auth/department-multi-select";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import {
  createUserAction,
  resetPasswordAction,
  setUserBannedAction,
  updateUserAction,
} from "./actions";

type AdminUsersManagerProps = {
  initialUsers: ProfileRow[];
  departments: DepartmentRow[];
  loadError?: string | null;
};

const ROLES: UserRole[] = ["user", "manager", "admin"];

const USER_LIST_GRID =
  "grid w-full grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.3fr)] items-center gap-x-3 gap-y-2";

const INPUT_CLASS =
  "w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-navy-900 outline-none focus:border-blue-primary focus:ring-2 focus:ring-blue-light";

export function AdminUsersManager({
  initialUsers,
  departments,
  loadError = null,
}: AdminUsersManagerProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(loadError);
  const [editingUser, setEditingUser] = useState<ProfileRow | null>(null);
  const [resetUser, setResetUser] = useState<ProfileRow | null>(null);
  const [banUser, setBanUser] = useState<ProfileRow | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createFormKey, setCreateFormKey] = useState(0);
  const [isPending, startTransition] = useTransition();

  function showResult(result: { ok: boolean; error?: string }, successMsg: string) {
    if (result.ok) {
      setMessage(successMsg);
      setError(null);
    } else {
      setError(result.error ?? "เกิดข้อผิดพลาด");
      setMessage(null);
    }
  }

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const result = await createUserAction(formData);
      showResult(result, "สร้างผู้ใช้สำเร็จ");
      if (result.ok) {
        setCreateOpen(false);
        window.location.reload();
      }
    });
  }

  function handleUpdate(userId: string, formData: FormData) {
    formData.set("userId", userId);
    startTransition(async () => {
      const result = await updateUserAction(formData);
      showResult(result, "บันทึกการเปลี่ยนแปลงสำเร็จ");
      if (result.ok) {
        setEditingUser(null);
        window.location.reload();
      }
    });
  }

  function handleResetPassword(userId: string, formData: FormData) {
    formData.set("userId", userId);
    startTransition(async () => {
      const result = await resetPasswordAction(formData);
      showResult(result, "ตั้งรหัสผ่านใหม่สำเร็จ");
    });
  }

  function confirmBanUser() {
    if (!banUser) return;
    const userId = banUser.id;
    const formData = new FormData();
    formData.set("userId", userId);
    formData.set("banned", "true");
    startTransition(async () => {
      const result = await setUserBannedAction(formData);
      showResult(result, "ระงับบัญชีแล้ว");
      if (result.ok) {
        setBanUser(null);
        window.location.reload();
      }
    });
  }

  function openCreateModal() {
    setCreateFormKey((key) => key + 1);
    setCreateOpen(true);
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      {message ? (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">{message}</p>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="card-whitespace">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-navy-900">
            รายการผู้ใช้ ({initialUsers.length})
          </h2>
          <Button type="button" onClick={openCreateModal}>
            สร้างผู้ใช้
          </Button>
        </div>
        <div className="mt-6 text-sm">
          <div
            className={`${USER_LIST_GRID} border-b border-border pb-3 font-semibold text-text-secondary`}
          >
            <div>อีเมล</div>
            <div>บทบาท</div>
            <div>หน่วยงาน</div>
            <div className="text-right">จัดการ</div>
          </div>

          {initialUsers.length === 0 ? (
            <p className="py-8 text-center text-text-secondary">ยังไม่มีผู้ใช้ในระบบ</p>
          ) : (
            initialUsers.map((user) => (
              <div
                key={user.id}
                className={`${USER_LIST_GRID} border-b border-border py-3`}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-navy-900" title={user.email}>
                    {user.email}
                  </p>
                </div>
                <div className="min-w-0">{formatUserRole(user.role)}</div>
                <div className="min-w-0 text-text-secondary">
                  {user.role === "admin"
                    ? "ทุกหน่วยงาน"
                    : user.department_ids
                        .map((code) => departmentLabelByCode(departments, code))
                        .join(", ") || "—"}
                </div>
                <div className="flex flex-nowrap items-center justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    className="!px-2 !py-1 text-xs whitespace-nowrap"
                    onClick={() => setEditingUser(user)}
                  >
                    แก้ไข
                  </Button>
                  <RowActionsMenu
                    disabled={isPending}
                    onReset={() => setResetUser(user)}
                    onBan={() => setBanUser(user)}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {createOpen ? (
        <CreateUserModal
          key={createFormKey}
          departments={departments}
          isPending={isPending}
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreate}
        />
      ) : null}

      {editingUser ? (
        <EditUserModal
          user={editingUser}
          departments={departments}
          isPending={isPending}
          onClose={() => setEditingUser(null)}
          onSubmit={handleUpdate}
        />
      ) : null}

      {resetUser ? (
        <ResetPasswordModal
          user={resetUser}
          isPending={isPending}
          onClose={() => setResetUser(null)}
          onSubmit={(userId, formData) => {
            handleResetPassword(userId, formData);
            setResetUser(null);
          }}
        />
      ) : null}

      {banUser ? (
        <BanUserConfirmModal
          user={banUser}
          isPending={isPending}
          onClose={() => setBanUser(null)}
          onConfirm={confirmBanUser}
        />
      ) : null}
    </div>
  );
}

function RowActionsMenu({
  disabled,
  onReset,
  onBan,
}: {
  disabled: boolean;
  onReset: () => void;
  onBan: () => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="ตัวเลือกเพิ่มเติม"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-page"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 min-w-40 overflow-hidden rounded-lg border border-border bg-surface-card py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-navy-900 hover:bg-surface-page"
            onClick={() => {
              setOpen(false);
              onReset();
            }}
          >
            <KeyRound className="h-3.5 w-3.5 shrink-0 text-text-secondary" aria-hidden />
            รีเซ็ตรหัส
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={disabled}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
            onClick={() => {
              setOpen(false);
              onBan();
            }}
          >
            <UserX className="h-3.5 w-3.5 shrink-0" aria-hidden />
            ระงับ
          </button>
        </div>
      ) : null}
    </div>
  );
}

function CreateUserModal({
  departments,
  isPending,
  onClose,
  onSubmit,
}: {
  departments: DepartmentRow[];
  isPending: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isPending, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-user-title"
      onClick={isPending ? undefined : onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-border bg-surface-card shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 id="create-user-title" className="text-lg font-bold text-navy-900">
              สร้างผู้ใช้ใหม่
            </h2>
            <p className="mt-0.5 text-sm text-text-secondary">
              กำหนดอีเมล รหัสผ่านชั่วคราว บทบาท และหน่วยงาน
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg p-2 text-text-secondary hover:bg-surface-page disabled:opacity-50"
            aria-label="ปิด"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action={onSubmit} className="space-y-4 px-6 py-5">
          <div>
            <label htmlFor="create-user-email" className="mb-1.5 block text-sm font-medium text-navy-900">
              อีเมล
            </label>
            <input
              id="create-user-email"
              name="email"
              type="email"
              required
              autoComplete="off"
              className={INPUT_CLASS}
              placeholder="name@hospital.local"
            />
          </div>

          <div>
            <label htmlFor="create-user-password" className="mb-1.5 block text-sm font-medium text-navy-900">
              รหัสผ่านชั่วคราว
            </label>
            <PasswordInput
              id="create-user-password"
              name="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label htmlFor="create-user-role" className="mb-1.5 block text-sm font-medium text-navy-900">
              บทบาท
            </label>
            <select id="create-user-role" name="role" defaultValue="user" className={INPUT_CLASS}>
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {formatUserRole(role)}
                </option>
              ))}
            </select>
          </div>

          <DepartmentMultiSelect name="departmentIds" departments={departments} />

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="secondary" disabled={isPending} onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "กำลังสร้าง…" : "สร้างผู้ใช้"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditUserModal({
  user,
  departments,
  isPending,
  onClose,
  onSubmit,
}: {
  user: ProfileRow;
  departments: DepartmentRow[];
  isPending: boolean;
  onClose: () => void;
  onSubmit: (userId: string, formData: FormData) => void;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isPending, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-user-title"
      onClick={isPending ? undefined : onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-border bg-surface-card shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 id="edit-user-title" className="text-lg font-bold text-navy-900">
              แก้ไขผู้ใช้
            </h2>
            <p className="mt-0.5 truncate text-sm text-text-secondary" title={user.email}>
              {user.email}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg p-2 text-text-secondary hover:bg-surface-page disabled:opacity-50"
            aria-label="ปิด"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          action={(formData) => onSubmit(user.id, formData)}
          className="space-y-4 px-6 py-5"
        >
          <div>
            <label htmlFor={`edit-role-${user.id}`} className="mb-1.5 block text-sm font-medium text-navy-900">
              บทบาท
            </label>
            <select
              id={`edit-role-${user.id}`}
              name="role"
              defaultValue={user.role}
              className={INPUT_CLASS}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {formatUserRole(role)}
                </option>
              ))}
            </select>
          </div>

          <DepartmentMultiSelect
            key={user.id}
            name="departmentIds"
            departments={departments}
            defaultSelected={user.department_ids}
          />

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="secondary" disabled={isPending} onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "กำลังบันทึก…" : "บันทึก"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BanUserConfirmModal({
  user,
  isPending,
  onClose,
  onConfirm,
}: {
  user: ProfileRow;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isPending, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="ban-user-title"
      onClick={isPending ? undefined : onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-surface-card p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
            <UserX className="h-5 w-5 text-red-600" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 id="ban-user-title" className="font-semibold text-navy-900">
              ระงับบัญชีผู้ใช้?
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              <span className="font-medium text-navy-900">{user.email}</span>
              <br />
              ผู้ใช้จะไม่สามารถเข้าสู่ระบบได้จนกว่าจะเปิดใช้งานอีกครั้ง
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" disabled={isPending} onClick={onClose}>
            ยกเลิก
          </Button>
          <Button type="button" variant="danger" disabled={isPending} onClick={onConfirm}>
            {isPending ? "กำลังระงับ…" : "ระงับบัญชี"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ResetPasswordModal({
  user,
  isPending,
  onClose,
  onSubmit,
}: {
  user: ProfileRow;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (userId: string, formData: FormData) => void;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isPending, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-password-title"
      onClick={isPending ? undefined : onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-surface-card shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 id="reset-password-title" className="text-lg font-bold text-navy-900">
              ตั้งรหัสผ่านใหม่
            </h2>
            <p className="mt-0.5 truncate text-sm text-text-secondary" title={user.email}>
              {user.email}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg p-2 text-text-secondary hover:bg-surface-page disabled:opacity-50"
            aria-label="ปิด"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          action={(formData) => onSubmit(user.id, formData)}
          className="space-y-4 px-6 py-5"
        >
          <div>
            <label
              htmlFor={`reset-password-${user.id}`}
              className="mb-1.5 block text-sm font-medium text-navy-900"
            >
              รหัสผ่านใหม่
            </label>
            <PasswordInput
              id={`reset-password-${user.id}`}
              name="password"
              placeholder="อย่างน้อย 8 ตัวอักษร"
              minLength={8}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="secondary" disabled={isPending} onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "กำลังตั้ง…" : "ตั้งรหัสผ่าน"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
