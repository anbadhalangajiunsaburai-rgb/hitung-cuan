import React from 'react';
import { Crown, X, Check, Minus } from 'lucide-react';

export default function PremiumModal({ isOpen, onClose, onUpgrade }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
        onClick={onClose}
      ></div>
      
      <div className="relative bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-fade-in flex flex-col md:flex-row">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors text-slate-500"
        >
          <X size={20} />
        </button>

        {/* Free Tier */}
        <div className="flex-1 p-8 md:p-12 bg-white">
          <h3 className="text-xl font-bold text-slate-500 mb-2">Paket Pemula</h3>
          <div className="text-4xl font-black text-slate-900 mb-8">Gratis</div>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 text-slate-600">
              <Check size={20} className="text-slate-400" /> Master Gudang
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <Check size={20} className="text-slate-400" /> Kalkulator HPP
            </div>
            <div className="flex items-center gap-3 text-slate-600 font-medium">
              <Minus size={20} className="text-slate-300" /> Maksimal 2 Resep
            </div>
            <div className="flex items-center gap-3 text-slate-400 opacity-60">
              <Minus size={20} className="text-slate-300" /> Tidak Bisa Hapus Resep
            </div>
            <div className="flex items-center gap-3 text-slate-400 opacity-60">
              <Minus size={20} className="text-slate-300" /> Simulasi Laba Rugi (Terkunci)
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Lanjutkan Gratis
          </button>
        </div>

        {/* Premium Tier */}
        <div className="flex-1 p-8 md:p-12 bg-gradient-to-br from-orange-500 to-amber-500 text-white relative">
          <div className="absolute top-0 right-8 bg-white text-orange-600 text-xs font-black uppercase px-3 py-1 rounded-b-lg shadow-sm">
            Paling Populer
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <Crown size={24} className="text-amber-200" />
            <h3 className="text-xl font-bold text-orange-100">Paket Juragan</h3>
          </div>
          <div className="text-4xl font-black text-white mb-8">Rp 49.000<span className="text-lg font-medium text-orange-200">/bln</span></div>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 text-orange-50 font-medium">
              <Check size={20} className="text-white" /> Semua fitur Paket Pemula
            </div>
            <div className="flex items-center gap-3 text-orange-50 font-medium">
              <Check size={20} className="text-white" /> Resep HPP Unlimited
            </div>
            <div className="flex items-center gap-3 text-orange-50 font-medium">
              <Check size={20} className="text-white" /> Hapus & Edit Data Bebas
            </div>
            <div className="flex items-center gap-3 text-orange-50 font-medium">
              <Check size={20} className="text-white" /> Akses Fitur Laba Rugi (Ojol vs Dine-in)
            </div>
            <div className="flex items-center gap-3 text-orange-50 font-medium">
              <Check size={20} className="text-white" /> Prioritas Customer Support
            </div>
          </div>

          <button 
            onClick={onUpgrade}
            className="w-full py-3 rounded-xl font-bold text-orange-600 bg-white hover:bg-orange-50 transition-colors shadow-lg"
          >
            Upgrade Sekarang
          </button>
          <p className="text-center text-xs text-orange-200 mt-4 opacity-80">
            *Untuk keperluan testing, tombol ini hanya berupa simulasi.
          </p>
        </div>

      </div>
    </div>
  );
}
