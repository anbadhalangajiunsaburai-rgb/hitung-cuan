import React, { useState } from 'react';
import { Lock, Zap, FileText, CheckCircle2, X, Loader2, Star, Sparkles } from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function PaywallModal({ isOpen, onClose, message, onUpgradeSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState('');

  if (!isOpen) return null;

  const handleBuy = async (planType, amount) => {
    const user = auth.currentUser;
    if (!user) {
      alert("Silakan login terlebih dahulu!");
      return;
    }
    
    setIsLoading(true);
    setLoadingPlan(planType);

    try {
      const orderId = `ORDER-${user.uid}-${planType}-${Date.now()}`;
      
      const response = await fetch('/api/tokenize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderId,
          amount: amount,
          customerName: user.displayName || 'Juragan UMKM',
          customerEmail: user.email,
          plan: planType
        }),
      });

      const data = await response.json();

      if (!data.token) {
        throw new Error('Gagal mendapatkan token pembayaran');
      }

      window.snap.pay(data.token, {
        onSuccess: async function (result) {
          console.log('Payment success:', result);
          
          // Fallback UI update if webhook is slow (Backend handles real persistence)
          const userRef = doc(db, 'users', user.uid);
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + (planType === 'mingguan' ? 7 : 1));
          
          await updateDoc(userRef, {
            isPremium: true,
            premiumPlan: planType,
            premiumUntil: expiryDate.toISOString(),
            lastPaymentOrderId: orderId
          });

          if(onUpgradeSuccess) onUpgradeSuccess();
          alert(`Pembayaran Berhasil! Paket ${planType === 'mingguan' ? 'Mingguan (7 Hari)' : 'Harian (1 Hari)'} aktif.`);
          onClose();
        },
        onPending: function (result) {
          alert('Pembayaran tertunda. Silakan selesaikan pembayaran Anda.');
          setIsLoading(false);
          setLoadingPlan('');
        },
        onError: function (result) {
          alert('Pembayaran gagal. Silakan coba lagi.');
          setIsLoading(false);
          setLoadingPlan('');
        },
        onClose: function () {
          setIsLoading(false);
          setLoadingPlan('');
        }
      });
      
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Terjadi kesalahan saat memproses pembayaran.');
      setIsLoading(false);
      setLoadingPlan('');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl relative animate-slide-up my-auto">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full p-2 transition-colors z-20"
        >
          <X size={24} />
        </button>

        <div className="p-8 sm:p-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-6">
            <Lock size={40} className="text-orange-500" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-800 mb-4">Akses Premium Terkunci!</h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10">
            {message || "Fitur ini khusus pengguna Premium. Pilih paket yang pas buat bisnis lu, bayar pakai QRIS/GoPay, langsung gas cuan!"}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            
            {/* Free Tier */}
            <div className="border-2 border-slate-200 rounded-3xl p-6 flex flex-col relative opacity-80 hover:opacity-100 transition-opacity">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-slate-700 mb-2">Paket Icip-icip</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-800">Gratis</span>
                </div>
                <p className="text-sm text-slate-500 mt-3 font-medium">Bisa dicoba, tapi banyak batasnya. Mending upgrade lah bos.</p>
              </div>
              
              <div className="flex-1 space-y-3 mt-4 mb-6">
                <div className="flex items-start gap-3 text-sm text-slate-600">
                  <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                  <span>Max 2 Resep & Menu</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-slate-400">
                  <X size={18} className="text-red-400 shrink-0 mt-0.5" />
                  <span>Satuan Dapur Terkunci (Gak bisa pakai Siung, dll)</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-slate-400">
                  <X size={18} className="text-red-400 shrink-0 mt-0.5" />
                  <span>Gak bisa Hapus Resep tanpa Iklan</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-slate-400">
                  <X size={18} className="text-red-400 shrink-0 mt-0.5" />
                  <span>Gak bisa Akses Menu Laba Rugi</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-slate-400">
                  <X size={18} className="text-red-400 shrink-0 mt-0.5" />
                  <span>Gak bisa Cetak PDF</span>
                </div>
              </div>

              <button 
                onClick={onClose}
                className="w-full py-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Tetap di Gratisan
              </button>
            </div>

            {/* Harian Tier */}
            <div className="border-2 border-orange-400 rounded-3xl p-6 flex flex-col relative shadow-xl shadow-orange-500/10 hover:shadow-orange-500/20 transition-shadow">
              <div className="absolute -top-4 right-6 bg-orange-100 text-orange-600 font-bold px-4 py-1 rounded-full text-sm flex items-center gap-1 border border-orange-200">
                <Zap size={14} /> 24 Jam
              </div>
              <div className="mb-4">
                <h3 className="text-xl font-bold text-slate-800 mb-2">Paket Ketengan</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-orange-600">Rp 3k</span>
                  <span className="text-slate-500">/hari</span>
                </div>
                <p className="text-sm text-slate-500 mt-3 font-medium">
                  Lebih mahal es teh daripada langganan untuk bisnis lu lebih maju!
                </p>
              </div>
              
              <div className="flex-1 space-y-3 mt-4 mb-6">
                <div className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircle2 size={18} className="text-orange-500 shrink-0 mt-0.5" />
                  <span className="font-semibold">Unlimited Semua Resep</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircle2 size={18} className="text-orange-500 shrink-0 mt-0.5" />
                  <span>Buka Semua Satuan Dapur (Siung, Sendok, dll)</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircle2 size={18} className="text-orange-500 shrink-0 mt-0.5" />
                  <span>Hapus Resep Tanpa Nonton Iklan</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircle2 size={18} className="text-orange-500 shrink-0 mt-0.5" />
                  <span>Akses Full Menu Laba Rugi & Operasional</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-slate-400">
                  <X size={18} className="text-red-400 shrink-0 mt-0.5" />
                  <span className="line-through">Cetak Laporan PDF</span>
                </div>
              </div>

              <button 
                onClick={() => handleBuy('harian', 3000)}
                disabled={isLoading}
                className="w-full py-4 rounded-xl font-bold text-orange-600 bg-orange-100 hover:bg-orange-500 hover:text-white transition-colors border border-orange-200 flex items-center justify-center gap-2"
              >
                {isLoading && loadingPlan === 'harian' ? <Loader2 size={20} className="animate-spin" /> : 'Sikat Rp 3.000'}
              </button>
            </div>

            {/* Mingguan Tier */}
            <div className="border-2 border-slate-900 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 flex flex-col relative shadow-2xl transform md:-translate-y-4 hover:-translate-y-6 transition-transform">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black px-6 py-1.5 rounded-full text-sm flex items-center gap-2 shadow-lg w-max">
                <Star size={16} /> PALING DIREKOMENDASIKAN
              </div>
              <div className="mb-4 mt-2">
                <h3 className="text-xl font-bold text-amber-400 mb-2">Paket Bos Besar</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">Rp 10k</span>
                  <span className="text-slate-400">/minggu</span>
                </div>
                <p className="text-sm text-slate-300 mt-3 font-medium">
                  Seharga parkiran di mall tapi bisa buat lu leluasa ngitung cuan dan mengantarkan lu jadi pengusaha sukses!
                </p>
              </div>
              
              <div className="flex-1 space-y-3 mt-4 mb-6">
                <div className="flex items-start gap-3 text-sm text-slate-200">
                  <CheckCircle2 size={18} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>Semua fitur di Paket Ketengan</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-white font-bold bg-white/10 p-3 rounded-xl border border-white/20">
                  <FileText size={20} className="text-amber-400 shrink-0" />
                  <span>Buka Kunci Cetak Laporan PDF Eksklusif!</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-slate-200">
                  <CheckCircle2 size={18} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>Masa Aktif 7 Hari Penuh Tanpa Mikir</span>
                </div>
              </div>

              <button 
                onClick={() => handleBuy('mingguan', 10000)}
                disabled={isLoading}
                className="w-full py-4 rounded-xl font-black text-slate-900 bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 hover:scale-[1.02]"
              >
                {isLoading && loadingPlan === 'mingguan' ? <Loader2 size={20} className="animate-spin text-slate-900" /> : <>Ambil Rp 10.000 <Sparkles size={18} /></>}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
