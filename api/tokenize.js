import midtransClient from 'midtrans-client';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { orderId, amount, customerName, customerEmail } = req.body;

    // Create Snap API instance
    let snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.VITE_MIDTRANS_SERVER_KEY, // We will set this in Vercel / .env
      clientKey: process.env.VITE_MIDTRANS_CLIENT_KEY,
    });

    let parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      customer_details: {
        first_name: customerName,
        email: customerEmail,
      },
      item_details: [
        {
          id: 'TIKET-HARIAN',
          price: amount,
          quantity: 1,
          name: 'Akses Premium 1 Hari',
        }
      ],
      // Filter payment methods to only allow QRIS and E-Wallets to avoid fixed VA fees
      enabled_payments: ['gopay', 'shopeepay', 'qris', 'other_qris'],
    };

    const transaction = await snap.createTransaction(parameter);

    res.status(200).json({ token: transaction.token });
  } catch (error) {
    console.error('Midtrans Tokenize Error:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
