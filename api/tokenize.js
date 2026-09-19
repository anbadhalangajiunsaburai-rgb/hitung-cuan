import midtransClient from 'midtrans-client';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Tambahkan 'plan' ke parameter yang diterima
    const { orderId, amount, customerName, customerEmail, plan = 'harian' } = req.body;

    let snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.VITE_MIDTRANS_SERVER_KEY,
      clientKey: process.env.VITE_MIDTRANS_CLIENT_KEY,
    });

    const itemName = plan === 'mingguan' ? 'Akses Premium 7 Hari' : 'Akses Premium 1 Hari';
    const itemId = plan === 'mingguan' ? 'TIKET-MINGGUAN' : 'TIKET-HARIAN';

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
          id: itemId,
          price: amount,
          quantity: 1,
          name: itemName,
        }
      ],
      enabled_payments: ['gopay', 'shopeepay', 'qris', 'other_qris'],
    };

    const transaction = await snap.createTransaction(parameter);

    res.status(200).json({ token: transaction.token });
  } catch (error) {
    console.error('Midtrans Tokenize Error:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
