import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { QuoteFormInput } from '../../types/ui';

import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

const schema = z.object({
  customer_name: z.string().min(2, 'Name is required'),
  notes: z.string().max(1000).optional(),
  quote_type: z.enum(['laptop', 'desktop', 'build', 'upgrade', 'warranty', 'general']).optional()
});

type CustomerInfoFormProps = {
  disabled?: boolean;
  defaultName?: string;
  onSubmit: (values: QuoteFormInput) => void;
};

export function CustomerInfoForm({ disabled, defaultName = '', onSubmit }: CustomerInfoFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<QuoteFormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      customer_name: defaultName,
      notes: '',
      quote_type: 'general'
    }
  });

  useEffect(() => {
    if (defaultName) {
      setValue('customer_name', defaultName, { shouldValidate: true, shouldDirty: true });
    }
  }, [defaultName, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-2xl border border-border bg-surface p-5">
      <h2 className="text-base font-semibold text-foreground">Customer Information</h2>

      <Input
        label="Full Name"
        {...register('customer_name')}
        disabled={disabled}
        error={errors.customer_name?.message}
      />

      <div className="space-y-1.5">
        <label htmlFor="quote-type" className="block label-11 text-secondary">Quote Type</label>
        <select
          id="quote-type"
          {...register('quote_type')}
          disabled={disabled}
          className="h-10 w-full block rounded-[2px] border border-border bg-inputBg px-3 text-[13px] text-foreground transition focus-visible:border-ring focus-visible:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="general">General</option>
          <option value="desktop">Desktop</option>
          <option value="laptop">Laptop</option>
          <option value="build">Build</option>
          <option value="upgrade">Upgrade</option>
          <option value="warranty">Warranty</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="notes-field" className="block label-11 text-secondary">Notes (optional)</label>
        <textarea
          id="notes-field"
          {...register('notes')}
          rows={4}
          disabled={disabled}
          className="w-full block rounded-[2px] border border-border bg-inputBg px-3 py-2 text-[13px] text-foreground transition focus-visible:border-ring focus-visible:outline-none focus:ring-1 focus:ring-ring"
        />
        {errors.notes ? <p className="text-[12px] text-danger" role="alert">{errors.notes.message}</p> : null}
      </div>

      <Button
        type="submit"
        disabled={disabled}
        size="lg"
        className="w-auto px-5"
      >
        Generate Quote
      </Button>
    </form>
  );
}
