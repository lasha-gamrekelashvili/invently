import { BOGPaymentService } from '../services/BOGPaymentService.js';
import { OrderService } from '../services/OrderService.js';
import { PaymentService } from '../services/PaymentService.js';

const bogPayment = new BOGPaymentService();
const orderService = new OrderService();
const paymentService = new PaymentService();

const BILLING_PREFIX = 'pay_';

/**
 * BOG webhook — receives payment status updates via POST.
 * Handles both checkout orders and billing payments (setup fee / subscription).
 * Billing payments use externalOrderId prefixed with "pay_".
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
  const isBillingPayment = externalOrderId.startsWith(BILLING_PREFIX);

  if (status === 'rejected') {
    const reason = body?.body?.reject_reason ?? null;
    const code = body?.body?.payment_detail?.code ?? parsed.code;
    const codeDesc = body?.body?.payment_detail?.code_description ?? null;
    console.info('[BOG callback] Payment REJECTED', { externalOrderId, isBillingPayment, reject_reason: reason, payment_code: code, code_description: codeDesc });
  } else if (status === 'completed') {
    console.info('[BOG callback] Payment completed', { externalOrderId, isBillingPayment });
  }

  try {
    if (isBillingPayment) {
      const paymentId = externalOrderId.slice(BILLING_PREFIX.length);

      if (bogPayment.isPaymentSuccessful(parsed)) {
        await paymentService.finalizeBillingPayment(paymentId, parsed);
      } else if (status === 'rejected') {
        await paymentService.markBillingPaymentFailed(paymentId, {
          rejectReason: body?.body?.reject_reason ?? null,
          code: body?.body?.payment_detail?.code ?? parsed.code,
        });
      }
    } else {
      if (bogPayment.isPaymentSuccessful(parsed)) {
        await orderService.finalizeOrderAfterPayment(externalOrderId);
      } else if (status === 'rejected') {
        await orderService.markOrderPaymentFailed(externalOrderId);
      }
    }
  } catch (err) {
    console.error('[BOG callback] Processing error:', err.message);
    return res.status(500).send('Processing error');
  }

  return res.status(200).send('OK');
};
