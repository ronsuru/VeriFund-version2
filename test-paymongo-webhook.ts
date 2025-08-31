import 'dotenv/config';
import { createHmac } from 'crypto';

async function main(): Promise<void> {
  const endpoint = process.env.WEBHOOK_URL || 'http://localhost:5000/api/webhooks/paymongo';
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET || '';

  if (!secret) {
    console.error('PAYMONGO_WEBHOOK_SECRET missing in environment.');
    process.exit(1);
  }

  // Sample payload (raw string must be used for HMAC and request body)
  const payload = JSON.stringify({
    data: {
      id: 'test_event',
      type: 'payment.paid',
    },
  });

  // Compute PayMongo-style signature (hex of HMAC SHA-256 over raw body)
  const signatureHex = createHmac('sha256', secret).update(payload, 'utf8').digest('hex');

  // Use global fetch without TS DOM types
  const fetchAny: any = (global as any).fetch;
  if (!fetchAny) {
    console.error('Global fetch is unavailable. Use Node 18+ or install node-fetch.');
    process.exit(1);
  }

  try {
    const res = await fetchAny(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Header is case-insensitive; server reads several variants
        'paymongo-signature': signatureHex,
      },
      // IMPORTANT: send the exact raw JSON string we hashed
      body: payload,
    });

    const text = await res.text();
    console.log('Status:', res.status, res.statusText);
    console.log('Body:', text);
  } catch (err) {
    console.error('Request failed:', err);
    process.exit(1);
  }
}

main();


