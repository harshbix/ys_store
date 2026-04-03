import type { ProductSpec } from '../types/api';

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isNumberLike(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function specValue(spec: ProductSpec): string {
  if (spec.value_text) return spec.value_text;
  if (typeof spec.value_number === 'number') return String(spec.value_number);
  if (typeof spec.value_bool === 'boolean') return spec.value_bool ? 'Yes' : 'No';
  if (spec.value_json) return JSON.stringify(spec.value_json);
  return '-';
}
