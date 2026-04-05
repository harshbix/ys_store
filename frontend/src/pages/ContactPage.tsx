export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-10">
      <header className="space-y-2">
        <p className="label-11 text-secondary">Contact</p>
        <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-foreground">Talk to YS Store</h1>
        <p className="text-sm text-secondary">For product advice, delivery, and quote support, use WhatsApp for the fastest response.</p>
      </header>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <a
          href="https://wa.me/255700000000"
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center rounded-[2px] bg-success px-5 text-sm font-semibold text-primaryForeground"
        >
          Chat on WhatsApp
        </a>
      </section>
    </div>
  );
}
