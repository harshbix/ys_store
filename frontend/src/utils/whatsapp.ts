import { WHATSAPP_NUMBER } from '../config/contact';

/**
 * Helper to build WhatsApp URLs consistently across the site.
 * 
 * @param message The message to pre-fill in the WhatsApp chat. Can be empty string.
 * @returns A fully formed whatsapp URL
 */
export function buildWhatsAppUrl(message: string = ''): string {
  // Sanitize the number by removing any non-digits just to be safe
  const sanitizedNumber = WHATSAPP_NUMBER.replace(/\D/g, '');
  
  if (!message) {
    return `https://wa.me/${sanitizedNumber}`;
  }

  // Encode the message
  return `https://wa.me/${sanitizedNumber}?text=${encodeURIComponent(message)}`;
}
