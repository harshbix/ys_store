import { created, ok } from '../../utils/apiResponse.js';
import { createQuote, getQuote, trackWhatsappClick } from './service.js';
import { generateWhatsAppUrl } from '../../utils/whatsapp.js';

function getIdentity(req) {
  return { sessionToken: req.sessionToken, customerAuthId: req.customerAuthId || null };
}

export async function createQuoteController(req, res, next) {
  try {
    const payload = { ...req.body, idempotency_key: req.idempotencyKey || req.body.idempotency_key };
    const data = await createQuote(payload, getIdentity(req));
    return created(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function getQuoteByCodeController(req, res, next) {
  try {
    const data = await getQuote(req.params.quoteCode);
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function whatsappClickController(req, res, next) {
  try {
    const data = await trackWhatsappClick(req.params.quoteCode, getIdentity(req));
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function getWhatsappUrlController(req, res, next) {
  try {
    const quote = await getQuote(req.params.quoteCode);
    const wa = generateWhatsAppUrl(quote.whatsapp_message);
    return ok(res, { quote_code: quote.quote_code, whatsapp_url: wa.url, whatsapp_meta: wa });
  } catch (err) {
    return next(err);
  }
}
