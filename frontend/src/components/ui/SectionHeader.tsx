import { Link } from 'react-router-dom';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  viewAllTo?: string;
};

export function SectionHeader({ title, subtitle, viewAllTo }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h2 className="section-title text-foreground">{title}</h2>
        {subtitle ? <p className="mt-2 text-[13px] text-secondary">{subtitle}</p> : null}
      </div>
      {viewAllTo ? (
        <Link to={viewAllTo} className="label-11 text-[11px] font-normal text-secondary transition hover:text-foreground">
          View All
        </Link>
      ) : null}
    </div>
  );
}
