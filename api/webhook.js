import crypto from 'crypto';
import admin from 'firebase-admin';

// Initialize Firebase Admin (Singleton untuk mencegah error re-initialize di Vercel)
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase admin init error. Check FIREBASE_SERVICE_ACCOUNT env var.', error.message);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const db = admin.apps.length ? admin.firestore() : null;
  if (!db) {
    console.error('Firestore is not initialized');
    return res.status(500).json({ message: 'Database config error' });
  }

  try {
    const notification = req.body;
    
    // 1. Verifikasi Signature Key (Keamanan anti-hacker)
    const serverKey = process.env.VITE_MIDTRANS_SERVER_KEY;
    const signatureKeyInput = notification.order_id + notification.status_code + notification.gross_amount + serverKey;
    const expectedSignatureKey = crypto.createHash('sha512').update(signatureKeyInput).digest('hex');

    if (expectedSignatureKey !== notification.signature_key) {
      console.error('Invalid signature key from Midtrans');
      return res.status(403).json({ message: 'Invalid Signature Key' });
    }

    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;
    const orderId = notification.order_id; // Format kita: ORDER-{uid}-{timestamp}

    console.log(`Webhook received for order: ${orderId}, status: ${transactionStatus}`);

    // 2. Ekstrak UID User dari Order ID
    const parts = orderId.split('-');
    // Karena formatnya ORDER-UID-TIMESTAMP, index ke-1 adalah UID
    const uid = parts.length > 1 ? parts[1] : null;

    if (!uid) {
      console.error('Invalid Order ID format, missing UID');
      return res.status(200).json({ status: 'ignored, invalid order id format' });
    }

    // 3. Update Database Firebase jika Sukses
    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
      if (transactionStatus === 'capture' && fraudStatus !== 'accept') {
        console.log('Transaction capture but fraud status is not accept.');
        return res.status(200).json({ status: 'ignored, fraud detected' });
      }

      // Aktifkan Premium selama 24 Jam
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      await db.collection('users').doc(uid).update({
        isPremium: true,
        premiumUntil: tomorrow.toISOString(),
        lastPaymentOrderId: orderId
      });

      console.log(`Successfully granted 24h Premium to user: ${uid}`);
    }

    // Midtrans wajib dibalas dengan HTTP 200 OK
    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Midtrans Webhook Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
