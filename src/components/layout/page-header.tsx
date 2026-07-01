import { type ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-surface-card px-8 py-6 print:hidden">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy-900">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        ) : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
