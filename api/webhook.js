import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const notification = req.body;
    
    // Validate signature key to ensure request is genuinely from Midtrans
    const serverKey = process.env.VITE_MIDTRANS_SERVER_KEY;
    const signatureKeyInput = notification.order_id + notification.status_code + notification.gross_amount + serverKey;
    const expectedSignatureKey = crypto.createHash('sha512').update(signatureKeyInput).digest('hex');

    if (expectedSignatureKey !== notification.signature_key) {
      return res.status(403).json({ message: 'Invalid Signature Key' });
    }

    const transactionStatus = notification.transaction_status;
    const orderId = notification.order_id;
    const fraudStatus = notification.fraud_status;

    // TODO: Extract user ID from orderId and grant Premium via Firebase Admin SDK
    console.log(`Transaction status for order ${orderId}: ${transactionStatus}`);

    if (transactionStatus == 'capture') {
      if (fraudStatus == 'accept') {
        // Grant premium
      }
    } else if (transactionStatus == 'settlement') {
      // Grant premium
    } else if (transactionStatus == 'cancel' || transactionStatus == 'deny' || transactionStatus == 'expire') {
      // Handle failure
    } else if (transactionStatus == 'pending') {
      // Handle pending
    }

    // Midtrans requires a 200 OK response
    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Midtrans Webhook Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
