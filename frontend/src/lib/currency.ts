const tzsFormatter = new Intl.NumberFormat('en-TZ', {
  style: 'currency',
  currency: 'TZS',
  maximumFractionDigits: 0
});

export function formatTzs(amount: number | null | undefined): string {
  const value = Number(amount ?? 0);
  if (Number.isNaN(value)) {
    return 'TZS 0';
  }
  return tzsFormatter.format(value);
}
