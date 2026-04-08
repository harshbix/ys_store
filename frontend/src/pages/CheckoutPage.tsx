import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SEO } from '../components/seo/SEO';
import { CustomerInfoForm } from '../components/checkout/CustomerInfoForm';
import { QuoteConfirmation } from '../components/checkout/QuoteConfirmation';
import { QuoteSummary } from '../components/checkout/QuoteSummary';
import { EmptyState } from '../components/feedback/EmptyState';
import { ErrorState } from '../components/feedback/ErrorState';
import { PageLoader } from '../components/feedback/PageLoader';
import { useCart } from '../hooks/useCart';
import { clearCart } from '../api/cart';
import { useQuote } from '../hooks/useQuote';
import { queryKeys } from '../lib/queryKeys';
import type { QuoteFormInput } from '../types/ui';
import { generateWhatsAppMessage } from '../utils/generateWhatsAppMessage';
import { buildWhatsAppUrl } from '../utils/whatsapp';

export default function CheckoutPage() {
  const queryClient = useQueryClient();
  const { cartQuery } = useCart();
  const { createQuoteMutation, trackWhatsappMutation } = useQuote();
  const [quoteCodeTracked, setQuoteCodeTracked] = useState<string | null>(null);
  const [isRedirectingToWhatsapp, setIsRedirectingToWhatsapp] = useState(false);
  const [generatedWhatsappUrl, setGeneratedWhatsappUrl] = useState<string | null>(null);

  const cartPayload = cartQuery.data;
  const quote = createQuoteMutation.data?.data;

  const submitQuote = async (values: QuoteFormInput) => {
    if (!cartPayload?.cart.id) return;

    try {
      const created = await createQuoteMutation.mutateAsync({
        customer_name: values.customer_name,
        notes: values.notes,
        quote_type: values.quote_type,
        source_type: 'cart',
        source_id: cartPayload.cart.id
      });

      const createdQuote = created?.data;
      if (!createdQuote?.quote_code) {
        return;
      }

      setIsRedirectingToWhatsapp(true);
      try {
        await trackWhatsappMutation.mutateAsync(createdQuote.quote_code);
      } catch {
        // Continue navigation even if tracking fails.
      } finally {
        setQuoteCodeTracked(createdQuote.quote_code);
        await clearCart();
        queryClient.setQueryData(queryKeys.cart.current, {
          ...cartPayload,
          items: [],
          estimated_total_tzs: 0
        });
        void queryClient.invalidateQueries({ queryKey: queryKeys.cart.current });
        
        // Use frontend-generated WhatsApp message instead of backend's generated URL.
        const message = generateWhatsAppMessage(cartPayload, values.customer_name);
        const urlToOpen = buildWhatsAppUrl(message);
        
        console.log('[WHATSAPP REDIRECT SOURCE]', {
          source: 'frontend-generated',
          url: urlToOpen
        });

        setGeneratedWhatsappUrl(urlToOpen);
        window.location.assign(urlToOpen);
      }
    } catch {
      // Error state and toast are handled by the quote mutation hooks.
    }
  };

  const handleTrackAndOpen = async () => {
    if (!quote?.quote_code) return;
    if (quoteCodeTracked === quote.quote_code) return;

    try {
      await trackWhatsappMutation.mutateAsync(quote.quote_code);
    } finally {
      setQuoteCodeTracked(quote.quote_code);
    }
  };

  if (cartQuery.isLoading) {
    return <PageLoader />;
  }

  if (cartQuery.isError || !cartPayload) {
    return <ErrorState title="Could not load checkout" description="Retry in a moment." onRetry={() => cartQuery.refetch()} />;
  }

  if (cartPayload.items.length === 0 && !isRedirectingToWhatsapp) {
    return (
      <EmptyState
        title="No items available for checkout"
        description="Add products or a custom build before requesting a quote."
        actionHref="/shop"
        actionLabel="Go to Shop"
      />
    );
  }

  return (
    <>
      <SEO 
        title="Checkout | Request Quote"
        description="Verify your selected products and custom builds before requesting a formal quote via WhatsApp."
      />
      <div className="space-y-5 pb-8">
        <header>
          <h1 className="section-title text-foreground">Quote Checkout</h1>
          <p className="mt-2 text-[13px] text-secondary">Submit customer details, generate quote code, then continue through WhatsApp.</p>
        </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="space-y-4">
          <QuoteSummary cart={cartPayload} />
          <CustomerInfoForm disabled={createQuoteMutation.isPending || isRedirectingToWhatsapp} onSubmit={submitQuote} />
          {isRedirectingToWhatsapp ? (
            <p className="text-sm text-secondary">Quote saved. Redirecting to WhatsApp...</p>
          ) : null}
          {createQuoteMutation.isError ? (
            <ErrorState
              title="Unable to create quote"
              description="Please verify your details and try again."
              onRetry={() => createQuoteMutation.reset()}
            />
          ) : null}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {quote && generatedWhatsappUrl ? <QuoteConfirmation quote={quote} whatsappUrl={generatedWhatsappUrl} onTrackAndOpen={handleTrackAndOpen} /> : null}
        </aside>
      </div>
      </div>
    </>
  );
}


