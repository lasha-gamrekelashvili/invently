import { BOGPaymentService } from '../services/BOGPaymentService.js';
import { OrderService } from '../services/OrderService.js';

const bogPayment = new BOGPaymentService();
const orderService = new OrderService();

/**
 * BOG webhook - receives payment status updates
 * Must return 200 to acknowledge; verify signature before processing
 */
export const handleBOGCallback = async (req, res) => {
  console.info('[BOG callback] Received request');
  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : (req.rawBody || req.body || '');
  const signature = req.get('Callback-Signature');

  if (!rawBody) {
    return res.status(400).send('Missing body');
  }

  if (signature && !bogPayment.verifyCallbackSignature(rawBody, signature)) {
    console.error('BOG callback: signature verification failed');
    return res.status(401).send('Invalid signature');
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch (e) {
    return res.status(400).send('Invalid JSON');
  }

  const parsed = bogPayment.parseCallback(body);
  if (!parsed) {
    return res.status(200).send('OK');
  }

  const externalOrderId = parsed.externalOrderId;
  if (!externalOrderId) {
    return res.status(200).send('OK');
  }

  // Log callback for debugging payment failures
  const orderStatus = body?.body?.order_status?.key ?? parsed.status;
  if (orderStatus === 'rejected') {
    const rejectReason = body?.body?.reject_reason ?? null;
    const code = body?.body?.payment_detail?.code ?? parsed.code;
    const codeDesc = body?.body?.payment_detail?.code_description ?? null;
    console.info('[BOG callback] Payment REJECTED', {
      externalOrderId,
      bogOrderId: body?.body?.order_id,
      reject_reason: rejectReason,
      payment_code: code,
      code_description: codeDesc,
    });
  } else if (orderStatus === 'completed') {
    console.info('[BOG callback] Payment completed', { externalOrderId });
  }

  try {
    if (bogPayment.isPaymentSuccessful(parsed)) {
      await orderService.finalizeOrderAfterPayment(externalOrderId);
    } else if (parsed.status === 'rejected') {
      await orderService.markOrderPaymentFailed(externalOrderId);
    }
  } catch (err) {
    console.error('BOG callback processing error:', err);
    return res.status(500).send('Processing error');
  }

  return res.status(200).send('OK');
};
