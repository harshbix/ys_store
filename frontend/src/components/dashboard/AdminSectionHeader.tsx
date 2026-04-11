import type { ReactNode } from 'react';

interface AdminSectionHeaderProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function AdminSectionHeader({ title, description, action }: AdminSectionHeaderProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-[1.35rem]">{title}</h2>
        <p className="mt-1 max-w-3xl text-sm text-secondary">{description}</p>
      </div>
      {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  );
}
