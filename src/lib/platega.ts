// Platega.io payment integration client

const PLATEGA_BASE_URL = "https://app.platega.io";
const PLATEGA_MERCHANT_ID = process.env.PLATEGA_MERCHANT_ID || "";
const PLATEGA_SECRET = process.env.PLATEGA_SECRET || "";

// Payment method for card payments
const PAYMENT_METHOD_CARD = 1;

export interface CreatePaymentParams {
  amount: number;
  currency?: string;
  description: string;
  returnUrl: string;
  failedUrl: string;
  payload?: Record<string, unknown>;
}

export interface CreatePaymentResult {
  transactionId: string;
  redirect: string;
  status: string;
  expiresIn: string | null;
}

export interface TransactionStatus {
  id: string;
  status: string;
  paymentDetails: Record<string, unknown>;
  paymentMethod: string;
}

/**
 * Create a payment transaction via Platega API
 */
export async function createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
  if (!PLATEGA_MERCHANT_ID || !PLATEGA_SECRET) {
    console.error("[PLATEGA] Missing PLATEGA_MERCHANT_ID or PLATEGA_SECRET env vars");
    throw new Error("Payment system not configured");
  }

  const body = {
    paymentMethod: PAYMENT_METHOD_CARD,
    paymentDetails: {
      amount: params.amount,
      currency: params.currency || "RUB",
    },
    description: params.description,
    returnUrl: params.returnUrl,
    failedUrl: params.failedUrl,
    payload: params.payload || null,
  };

  const res = await fetch(`${PLATEGA_BASE_URL}/transaction/process`, {
    method: "POST",
    headers: {
      "X-MerchantId": PLATEGA_MERCHANT_ID,
      "X-Secret": PLATEGA_SECRET,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[PLATEGA] Create payment failed: ${res.status} ${text}`);
    throw new Error(`Payment creation failed: ${res.status}`);
  }

  const data = await res.json();

  return {
    transactionId: data.transactionId,
    redirect: data.redirect,
    status: data.status,
    expiresIn: data.expiresIn || null,
  };
}

/**
 * Check transaction status via Platega API
 */
export async function getTransactionStatus(transactionId: string): Promise<TransactionStatus> {
  if (!PLATEGA_MERCHANT_ID || !PLATEGA_SECRET) {
    throw new Error("Payment system not configured");
  }

  const res = await fetch(`${PLATEGA_BASE_URL}/transaction/${transactionId}`, {
    method: "GET",
    headers: {
      "X-MerchantId": PLATEGA_MERCHANT_ID,
      "X-Secret": PLATEGA_SECRET,
      "Accept": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[PLATEGA] Get status failed: ${res.status} ${text}`);
    throw new Error(`Status check failed: ${res.status}`);
  }

  const data = await res.json();

  return {
    id: data.id,
    status: data.status,
    paymentDetails: data.paymentDetails,
    paymentMethod: data.paymentMethod,
  };
}

// Payment statuses from Platega
export const PaymentStatus = {
  CONFIRMED: "CONFIRMED",
  CANCELED: "CANCELED",
  CHARGEBACKED: "CHARGEBACKED",
  PENDING: "PENDING",
} as const;
