import React, { useState } from 'react';
import { Store, Loader2, ArrowRight } from 'lucide-react';

export default function OnboardingModal({ isOpen, onSubmit }) {
  const [shopName, setShopName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shopName.trim()) return;
    
    setIsLoading(true);
    await onSubmit(shopName);
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
      
      <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in p-8">
        <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-inner mx-auto">
          <Store size={32} />
        </div>
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-slate-900 mb-2">Selamat Datang!</h2>
          <p className="text-slate-500 text-sm">
            Sebelum mulai menghitung, beri tahu kami nama toko atau bisnis kuliner Anda.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Nama Bisnis / Toko</label>
            <input 
              type="text" 
              required
              autoFocus
              placeholder="Contoh: Nasi Goreng Budi, Kopi Senja..."
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading || !shopName.trim()}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-orange-500/30 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:shadow-none"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Mulai Kelola Bisnis <ArrowRight size={20} /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
