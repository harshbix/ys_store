export function titleCase(value: string): string {
  return value
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => `${word[0].toUpperCase()}${word.slice(1)}`)
    .join(' ');
}

export function compactText(value: string | null | undefined, fallback = 'Not specified'): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : fallback;
}

export function clampText(value: string, max = 130): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trim()}...`;
}
