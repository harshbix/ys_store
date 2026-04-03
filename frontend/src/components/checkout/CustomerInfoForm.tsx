import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { QuoteFormInput } from '../../types/ui';

const schema = z.object({
  customer_name: z.string().min(2, 'Name is required'),
  notes: z.string().max(1000).optional(),
  quote_type: z.enum(['laptop', 'desktop', 'build', 'upgrade', 'warranty', 'general']).optional()
});

type CustomerInfoFormProps = {
  disabled?: boolean;
  onSubmit: (values: QuoteFormInput) => void;
};

export function CustomerInfoForm({ disabled, onSubmit }: CustomerInfoFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<QuoteFormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      customer_name: '',
      notes: '',
      quote_type: 'general'
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-2xl border border-border bg-surface p-5">
      <h2 className="text-base font-semibold text-foreground">Customer Information</h2>

      <label className="block text-sm text-muted">
        Full Name
        <input
          {...register('customer_name')}
          disabled={disabled}
          className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none ring-accent transition focus:ring-2"
        />
        {errors.customer_name ? <p className="mt-1 text-xs text-danger">{errors.customer_name.message}</p> : null}
      </label>

      <label className="block text-sm text-muted">
        Quote Type
        <select
          {...register('quote_type')}
          disabled={disabled}
          className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
        >
          <option value="general">General</option>
          <option value="desktop">Desktop</option>
          <option value="laptop">Laptop</option>
          <option value="build">Build</option>
          <option value="upgrade">Upgrade</option>
          <option value="warranty">Warranty</option>
        </select>
      </label>

      <label className="block text-sm text-muted">
        Notes (optional)
        <textarea
          {...register('notes')}
          rows={4}
          disabled={disabled}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent transition focus:ring-2"
        />
        {errors.notes ? <p className="mt-1 text-xs text-danger">{errors.notes.message}</p> : null}
      </label>

      <button
        type="submit"
        disabled={disabled}
        className="min-h-11 rounded-full bg-primary px-5 text-sm font-semibold text-primaryForeground disabled:opacity-40"
      >
        Generate Quote
      </button>
    </form>
  );
}
