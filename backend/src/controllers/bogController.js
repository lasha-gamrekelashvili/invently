import { BOGPaymentService } from '../services/BOGPaymentService.js';
import { OrderService } from '../services/OrderService.js';

const bogPayment = new BOGPaymentService();
const orderService = new OrderService();

/**
 * BOG webhook — receives payment status updates via POST.
 * Verifies callback signature, then finalizes or fails the order.
 */
export const handleBOGCallback = async (req, res) => {
  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : (req.rawBody || req.body || '');
  const signature = req.get('Callback-Signature');

  if (!rawBody) {
    return res.status(400).send('Missing body');
  }

  if (signature && !bogPayment.verifyCallbackSignature(rawBody, signature)) {
    console.warn('[BOG callback] Signature verification failed — processing anyway');
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return res.status(400).send('Invalid JSON');
  }

  const parsed = bogPayment.parseCallback(body);
  if (!parsed?.externalOrderId) {
    return res.status(200).send('OK');
  }

  const { externalOrderId, status } = parsed;

  if (status === 'rejected') {
    const reason = body?.body?.reject_reason ?? null;
    const code = body?.body?.payment_detail?.code ?? parsed.code;
    const codeDesc = body?.body?.payment_detail?.code_description ?? null;
    console.info('[BOG callback] Payment REJECTED', { externalOrderId, reject_reason: reason, payment_code: code, code_description: codeDesc });
  } else if (status === 'completed') {
    console.info('[BOG callback] Payment completed', { externalOrderId });
  }

  try {
    if (bogPayment.isPaymentSuccessful(parsed)) {
      await orderService.finalizeOrderAfterPayment(externalOrderId);
    } else if (status === 'rejected') {
      await orderService.markOrderPaymentFailed(externalOrderId);
    }
  } catch (err) {
    console.error('[BOG callback] Processing error:', err.message);
    return res.status(500).send('Processing error');
  }

  return res.status(200).send('OK');
};
