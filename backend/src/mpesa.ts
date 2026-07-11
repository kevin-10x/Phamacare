// Safaricom Daraja (M-Pesa) STK Push integration stub.
// Fill in with real credentials via `wrangler secret put` and call this from
// the /api/orders route once you're ready to take real payments.
//
// Required secrets: MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_PASSKEY,
// MPESA_SHORTCODE, MPESA_CALLBACK_URL

export async function getMpesaAccessToken(env: any): Promise<string> {
  const creds = btoa(`${env.MPESA_CONSUMER_KEY}:${env.MPESA_CONSUMER_SECRET}`);
  const res = await fetch(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    { headers: { Authorization: `Basic ${creds}` } }
  );
  const data = await res.json<{ access_token: string }>();
  return data.access_token;
}

export async function stkPush(env: any, phone: string, amount: number, accountRef: string) {
  const token = await getMpesaAccessToken(env);
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const password = btoa(`${env.MPESA_SHORTCODE}${env.MPESA_PASSKEY}${timestamp}`);

  const res = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      BusinessShortCode: env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.ceil(amount),
      PartyA: phone,
      PartyB: env.MPESA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: env.MPESA_CALLBACK_URL,
      AccountReference: accountRef,
      TransactionDesc: 'PharmaCare order payment',
    }),
  });
  return res.json();
}
