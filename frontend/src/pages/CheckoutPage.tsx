import { useState } from 'react';
import { CustomerInfoForm } from '../components/checkout/CustomerInfoForm';
import { QuoteConfirmation } from '../components/checkout/QuoteConfirmation';
import { QuoteSummary } from '../components/checkout/QuoteSummary';
import { EmptyState } from '../components/feedback/EmptyState';
import { ErrorState } from '../components/feedback/ErrorState';
import { PageLoader } from '../components/feedback/PageLoader';
import { useCart } from '../hooks/useCart';
import { useQuote } from '../hooks/useQuote';
import type { QuoteFormInput } from '../types/ui';

export default function CheckoutPage() {
  const { cartQuery } = useCart();
  const { createQuoteMutation, trackWhatsappMutation } = useQuote();
  const [quoteCodeTracked, setQuoteCodeTracked] = useState<string | null>(null);
  const [isRedirectingToWhatsapp, setIsRedirectingToWhatsapp] = useState(false);

  const cartPayload = cartQuery.data?.data;
  const quote = createQuoteMutation.data?.data;

  const submitQuote = async (values: QuoteFormInput) => {
    if (!cartPayload?.cart.id) return;

    const created = await createQuoteMutation.mutateAsync({
      customer_name: values.customer_name,
      notes: values.notes,
      quote_type: values.quote_type,
      source_type: 'cart',
      source_id: cartPayload.cart.id
    });

    const createdQuote = created?.data;
    if (!createdQuote?.quote_code || !createdQuote?.whatsapp_url) {
      return;
    }

    setIsRedirectingToWhatsapp(true);
    try {
      await trackWhatsappMutation.mutateAsync(createdQuote.quote_code);
    } catch {
      // Continue navigation even if tracking fails.
    } finally {
      setQuoteCodeTracked(createdQuote.quote_code);
      window.location.assign(createdQuote.whatsapp_url);
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

  if (cartPayload.items.length === 0) {
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
          {quote ? <QuoteConfirmation quote={quote} onTrackAndOpen={handleTrackAndOpen} /> : null}
        </aside>
      </div>
    </div>
  );
}
