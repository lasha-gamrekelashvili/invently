/**
 * Bank of Georgia Payment Manager API integration.
 * Handles OAuth2, order creation, callback verification, and payment status.
 * @see https://api.bog.ge/docs/en/payments/
 */

import crypto from 'crypto';

// Sandbox: api-sandbox.bog.ge, oauth2-sandbox.bog.ge | Production: api.bog.ge, oauth2.bog.ge
const BOG_OAUTH_URL = process.env.BOG_OAUTH_URL || 'https://oauth2-sandbox.bog.ge/auth/realms/bog/protocol/openid-connect/token';
const BOG_API_URL = process.env.BOG_API_URL || 'https://api-sandbox.bog.ge/payments/v1';

// BOG public key for callback signature verification (SHA256withRSA)
const BOG_CALLBACK_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu4RUyAw3+CdkS3ZNILQh
zHI9Hemo+vKB9U2BSabppkKjzjjkf+0Sm76hSMiu/HFtYhqWOESryoCDJoqffY0Q
1VNt25aTxbj068QNUtnxQ7KQVLA+pG0smf+EBWlS1vBEAFbIas9d8c9b9sSEkTrr
TYQ90WIM8bGB6S/KLVoT1a7SnzabjoLc5Qf/SLDG5fu8dH8zckyeYKdRKSBJKvhx
tcBuHV4f7qsynQT+f2UYbESX/TLHwT5qFWZDHZ0YUOUIvb8n7JujVSGZO9/+ll/g
4ZIWhC1MlJgPObDwRkRd8NFOopgxMcMsDIZIoLbWKhHVq67hdbwpAq9K9WMmEhPn
PwIDAQAB
-----END PUBLIC KEY-----`;

export class BOGPaymentService {
  constructor() {
    this.tokenCache = { token: null, expiresAt: 0 };
  }

  _getCredentials() {
    const clientId = process.env.BOG_CLIENT_ID;
    const clientSecret = process.env.BOG_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error('BOG_CLIENT_ID and BOG_CLIENT_SECRET must be configured');
    }
    return { clientId, clientSecret };
  }

  /**
   * Get OAuth2 bearer token (cached, auto-refresh before expiry)
   */
  async getAccessToken() {
    const now = Date.now();
    if (this.tokenCache.token && this.tokenCache.expiresAt > now + 60000) {
      return this.tokenCache.token;
    }

    const { clientId, clientSecret } = this._getCredentials();
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(BOG_OAUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: new URLSearchParams({ grant_type: 'client_credentials' }).toString(),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`BOG OAuth failed: ${response.status} ${errText}`);
    }

    const data = await response.json();
    this.tokenCache = {
      token: data.access_token,
      expiresAt: typeof data.expires_in === 'number'
        ? now + (data.expires_in * 1000)
        : (data.expires_in || 0),
    };

    return this.tokenCache.token;
  }

  /**
   * Create a payment order at BOG and return redirect URL
   * @param {Object} params
   * @param {string} params.callbackUrl - Our webhook URL
   * @param {string} params.externalOrderId - Our internal order ID
   * @param {number} params.totalAmount - Total in GEL
   * @param {Array} params.basket - Line items for BOG
   * @param {string} params.customerName - Buyer full name
   * @param {string} params.customerEmail - Buyer email (masked for BOG)
   * @param {string} params.successUrl - Redirect after success
   * @param {string} params.failUrl - Redirect after failure
   * @param {string} [params.idempotencyKey] - UUID for idempotency
   */
  async createOrder(params) {
    const token = await this.getAccessToken();
    const {
      callbackUrl,
      externalOrderId,
      totalAmount,
      basket,
      customerName,
      customerEmail,
      successUrl,
      failUrl,
      idempotencyKey,
      ttl = 15,
    } = params;

    const maskedEmail = this._maskEmail(customerEmail);
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept-Language': 'ka',
      ...(idempotencyKey && { 'Idempotency-Key': idempotencyKey }),
    };

    const body = {
      callback_url: callbackUrl,
      external_order_id: externalOrderId,
      capture: 'automatic',
      ttl: Math.min(1440, Math.max(2, ttl)),
      payment_method: ['card'],
      buyer: {
        full_name: customerName,
        masked_email: maskedEmail,
        masked_phone: '+995***000',
      },
      purchase_units: {
        currency: 'GEL',
        total_amount: Number(totalAmount.toFixed(2)),
        total_discount_amount: 0,
        basket: basket.map((item) => ({
          product_id: item.productId || item.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: Number(item.unitPrice.toFixed(2)),
          unit_discount_price: 0,
          vat: 0,
          vat_percent: 0,
          total_price: Number((item.unitPrice * item.quantity).toFixed(2)),
          image: item.image || null,
          package_code: item.sku || null,
          tin: null,
          pinfl: null,
          product_discount_id: null,
        })),
        delivery: { amount: 0 },
      },
      redirect_urls: {
        success: successUrl,
        fail: failUrl,
      },
    };

    const response = await fetch(`${BOG_API_URL}/ecommerce/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`BOG create order failed: ${response.status} ${errText}`);
    }

    const data = await response.json();
    const redirectHref = data._links?.redirect?.href;
    if (!redirectHref) {
      throw new Error('BOG did not return redirect URL');
    }

    return {
      bogOrderId: data.id,
      redirectUrl: redirectHref,
      detailsUrl: data._links?.details?.href,
    };
  }

  _maskEmail(email) {
    if (!email || !email.includes('@')) return '***@***';
    const [local, domain] = email.split('@');
    const masked = local.length <= 2
      ? local[0] + '***'
      : local[0] + '***' + local[local.length - 1];
    return `${masked}@${domain}`;
  }

  /**
   * Verify BOG callback signature
   * @param {string} rawBody - Raw request body (before JSON parse)
   * @param {string} signatureB64 - Callback-Signature header (base64)
   */
  verifyCallbackSignature(rawBody, signatureB64) {
    try {
      const publicKey = crypto.createPublicKey(BOG_CALLBACK_PUBLIC_KEY);
      const signature = Buffer.from(signatureB64, 'base64');
      return crypto.verify('sha256', Buffer.from(rawBody, 'utf8'), {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      }, signature);
    } catch (err) {
      console.error('BOG callback signature verification failed:', err);
      return false;
    }
  }

  /**
   * Parse callback body and return order status
   * @param {Object} body - Parsed JSON callback body
   * @returns {{ orderId: string, externalOrderId: string, status: string, code: string, transferAmount: string } | null}
   */
  parseCallback(body) {
    if (!body?.body?.order_id || !body?.event) return null;
    const b = body.body;
    const statusKey = b.order_status?.key;
    const code = b.payment_detail?.code;
    const transferAmount = b.purchase_units?.transfer_amount;
    const externalOrderId = b.external_order_id;
    return {
      event: body.event,
      orderId: b.order_id,
      externalOrderId,
      status: statusKey,
      code: code || '',
      transferAmount: transferAmount || '0',
      purchaseUnits: b.purchase_units,
      paymentDetail: b.payment_detail,
    };
  }

  /**
   * Determine if payment was successful from callback
   */
  isPaymentSuccessful(parsed) {
    if (!parsed) return false;
    return parsed.status === 'completed' && parsed.code === '100';
  }

  /**
   * Get payment details from BOG (for polling when callback fails)
   */
  async getPaymentDetails(bogOrderId) {
    const token = await this.getAccessToken();
    const response = await fetch(`${BOG_API_URL}/receipt/${bogOrderId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`BOG get details failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Refund (full or partial)
   */
  async refund(bogOrderId, amount = null) {
    const token = await this.getAccessToken();
    const body = amount != null ? { amount: String(amount) } : {};
    const response = await fetch(`${BOG_API_URL}/payment/refund/${bogOrderId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`BOG refund failed: ${response.status} ${errText}`);
    }

    return response.json();
  }
}
