import crypto from 'crypto';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
if (!getApps().length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({
      credential: cert(serviceAccount)
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

  const db = getApps().length ? getFirestore() : null;
  if (!db) {
    console.error('Firestore is not initialized');
    return res.status(500).json({ message: 'Database config error' });
  }

  try {
    const notification = req.body;
    
    // Verifikasi Signature Key
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

    // Ekstrak UID dan Plan dari Order ID
    const parts = orderId.split('-');
    const uid = parts.length > 1 ? parts[1] : null;
    const plan = parts.length > 2 ? parts[2] : 'harian';

    if (!uid) {
      console.error('Invalid Order ID format, missing UID');
      return res.status(200).json({ status: 'ignored, invalid order id format' });
    }

    // Update Database Firebase jika Sukses
    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
      if (transactionStatus === 'capture' && fraudStatus !== 'accept') {
        console.log('Transaction capture but fraud status is not accept.');
        return res.status(200).json({ status: 'ignored, fraud detected' });
      }

      // Aktifkan Premium (1 Hari / 7 Hari)
      const expiryDate = new Date();
      if (plan === 'mingguan') {
        expiryDate.setDate(expiryDate.getDate() + 7);
      } else {
        expiryDate.setDate(expiryDate.getDate() + 1);
      }

      await db.collection('users').doc(uid).set({
        isPremium: true,
        premiumPlan: plan,
        premiumUntil: expiryDate.toISOString(),
        lastPaymentOrderId: orderId
      }, { merge: true });

      console.log(`Successfully granted ${plan} Premium to user: ${uid}`);
    }

    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Midtrans Webhook Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
