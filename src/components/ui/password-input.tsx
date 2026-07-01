"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  id: string;
};

const INPUT_CLASS =
  "w-full rounded-lg border border-border bg-white px-3 py-2.5 pr-10 text-sm text-navy-900 outline-none focus:border-blue-primary focus:ring-2 focus:ring-blue-light";

export function PasswordInput({ id, className = "", ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        className={`${INPUT_CLASS} ${className}`.trim()}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((prev) => !prev)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-text-muted hover:text-navy-900"
        aria-label={visible ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
      >
        {visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
      </button>
    </div>
  );
}
