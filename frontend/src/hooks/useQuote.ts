import { useMutation } from '@tanstack/react-query';
import { createQuote, trackQuoteWhatsappClick, type CreateQuoteBody } from '../api/quotes';
import { generateIdempotencyKey } from '../lib/session';
import { useToast } from './useToast';

export function useQuote() {
  const { showToast } = useToast();

  const createQuoteMutation = useMutation({
    mutationFn: async (payload: Omit<CreateQuoteBody, 'idempotency_key'>) => {
      const idempotencyKey = generateIdempotencyKey('quote');
      return createQuote({ ...payload, idempotency_key: idempotencyKey }, idempotencyKey);
    },
    onSuccess: () => {
      showToast({ title: 'Quote generated', variant: 'success' });
    },
    onError: () => {
      showToast({ title: 'Quote creation failed', description: 'Please verify your input and retry.', variant: 'error' });
    }
  });

  const trackWhatsappMutation = useMutation({
    mutationFn: (quoteCode: string) => trackQuoteWhatsappClick(quoteCode)
  });

  return {
    createQuoteMutation,
    trackWhatsappMutation
  };
}
