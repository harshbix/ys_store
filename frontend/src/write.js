const fs = require('fs'); 
let content = fs.readFileSync('D:/projects/ys_store/frontend/src/pages/CheckoutPage.tsx', 'utf8');

const strStart = 'setIsRedirectingToWhatsapp(true);';
const strEnd = 'window.location.assign(whatsappUrl);';

const iStart = content.indexOf(strStart);
const iEnd = content.indexOf(strEnd) + strEnd.length;

if (iStart !== -1 && iEnd !== -1) {
  // Correct invalid characters and ensure proper syntax
  const rep = `
    // Backend quote is for persistence/tracking only
    // Frontend controls user-facing WhatsApp message
    const message = generateWhatsAppMessage(cartPayload, values.customer_name);
    const whatsappUrl = buildWhatsAppUrl(message);

    setIsRedirectingToWhatsapp(true);
    try {
      await trackWhatsappMutation.mutateAsync(createdQuote.quote_code);
    } catch {}

    setQuoteCodeTracked(createdQuote.quote_code);
    await clearCart();
    queryClient.setQueryData(queryKeys.cart.current, {
      ...cartPayload,
      items: [],
      estimated_total_tzs: 0
    });
    void queryClient.invalidateQueries({ queryKey: queryKeys.cart.current });

    console.log('[DEBUG] WhatsApp URL before redirection:', whatsappUrl);
    window.location.assign(whatsappUrl);
`.trim();

  let f = content.slice(0, iStart) + rep + content.slice(iEnd);
  fs.writeFileSync('D:/projects/ys_store/frontend/src/pages/CheckoutPage.tsx', f);
}