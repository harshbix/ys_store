import type { ReactNode } from 'react';

interface AdminSectionHeaderProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function AdminSectionHeader({ title, description, action }: AdminSectionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-secondary">{description}</p>
      </div>
      {action}
    </div>
  );
}
