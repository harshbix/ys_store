import { motion } from 'framer-motion';
import type { BuildValidationPayload } from '../../types/api';

type CompatibilityBannerProps = {
  payload?: BuildValidationPayload;
};

export function CompatibilityBanner({ payload }: CompatibilityBannerProps) {
  if (!payload) return null;

  const isValid = payload.compatibility_status === 'valid';
  const isInvalid = payload.compatibility_status === 'invalid';

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-4 ${
        isValid ? 'border-success/40 bg-success/10 text-success' : isInvalid ? 'border-danger/40 bg-danger/10 text-danger' : 'border-accent/40 bg-accent/10 text-accentSoft'
      }`}
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide">Compatibility: {payload.compatibility_status}</h2>
      {payload.errors.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
          {payload.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}
      {payload.warnings.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
          {payload.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}
    </motion.section>
  );
}
