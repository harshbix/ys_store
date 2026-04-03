import { useCreateQuote, useQuoteWhatsappClick, useCart } from '../api/hooks';
import { useState } from 'react';

export const QuoteHandoff = () => {
  const { data: cart } = useCart();
  const { mutateAsync: createQuote, isPending, data: quoteResult } = useCreateQuote();
  const { mutateAsync: trackClick } = useQuoteWhatsappClick();
  const [formData, setFormData] = useState({ name: '', phone: '' });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart?.id) return;

    // Idempotency token generation ensures double-clicks don't spawn duplicate live quotes
    const token = `live-${crypto.randomUUID()}`;
    
    await createQuote({
      channel: 'whatsapp',
      customer_name: formData.name,
      customer_phone: formData.phone,
      source_type: 'cart',
      source_id: cart.id,
      idempotencyToken: token
    });
  };

  const handleWhatsappRedirect = async () => {
    if (quoteResult?.quote_code) {
      await trackClick(quoteResult.quote_code).catch(() => {
        // Fallback: Continue to redirect if tracking fails to not block user
      });
    }
    // Trust the backend generated URL entirely
    window.location.href = quoteResult!.whatsapp_url;
  };

  if (quoteResult?.quote_code) {
    return (
      <div className="max-w-2xl mx-auto text-center py-32 animate-fade-in">
        <div className="inline-block border border-green-500/50 bg-green-500/10 text-green-400 px-6 py-2 rounded-full text-xs font-bold tracking-widest mb-12 uppercase">
          QUOTE SECURED: {quoteResult.quote_code}
        </div>
        <h2 className="text-5xl font-light mb-12 tracking-tight">Finalize Transaction</h2>
        <button 
          onClick={handleWhatsappRedirect}
          className="bg-white hover:bg-gray-200 text-black px-12 py-5 rounded-sm font-bold tracking-widest uppercase transition-colors text-sm shadow-[0_0_40px_rgba(255,255,255,0.1)]"
        >
          Confirm via WhatsApp
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-20 animate-slide-up">
      <h1 className="text-3xl font-light mb-12 uppercase tracking-widest text-center border-b border-border pb-8">Sales Request</h1>
      
      <form onSubmit={onSubmit} className="space-y-8">
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-muted font-bold mb-3">Customer Profile</label>
          <input 
            required 
            placeholder="FULL NAME"
            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
            className="w-full bg-surface border border-border px-6 py-5 outline-none focus:border-white transition-colors text-sm placeholder:text-muted" 
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-muted font-bold mb-3">Contact Routing</label>
          <input 
            required
            placeholder="+255..."
            value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
            className="w-full bg-surface border border-border px-6 py-5 outline-none focus:border-white transition-colors font-mono text-sm placeholder:text-muted" 
          />
        </div>
        <button 
          type="submit" disabled={isPending || !cart?.items?.length}
          className="w-full bg-white text-black py-5 uppercase tracking-widest text-xs font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 mt-12"
        >
          {isPending ? 'Processing...' : 'Request Official Quote'}
        </button>
      </form>
    </div>
  );
};