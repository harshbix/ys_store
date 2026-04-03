import { BadgeCheck, ShieldCheck } from 'lucide-react';

export function AuthPromptBanner() {
  return (
    <section className="rounded-xl border border-border bg-background p-4">
      <h3 className="text-sm font-semibold text-foreground">Guest-first, frictionless shopping</h3>
      <ul className="mt-3 space-y-2 text-sm text-muted">
        <li className="inline-flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 text-accent" />
          Browse, build, and quote without mandatory sign-up.
        </li>
        <li className="inline-flex items-start gap-2">
          <BadgeCheck className="mt-0.5 h-4 w-4 text-accent" />
          Your session keeps cart and build continuity for follow-up support.
        </li>
      </ul>
    </section>
  );
}
