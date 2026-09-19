import React from 'react';
import { Lock, Zap, FileText, CheckCircle2, X } from 'lucide-react';

export default function PaywallModal({ isOpen, onClose, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative animate-slide-up">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-1 transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Lock size={120} />
          </div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
              <Lock size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Akses Terkunci!</h2>
            <p className="text-orange-100 text-sm font-medium leading-relaxed">
              {message || "Fitur ini khusus untuk pengguna Premium. Upgrade sekarang untuk membuka semua potensi bisnis warung Anda!"}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider text-center mb-4">Pilih Tiket Berlangganan</h3>
          
          <div className="space-y-4">
            {/* Harian */}
            <div className="bg-white rounded-xl p-4 border-2 border-orange-200 hover:border-orange-500 cursor-pointer transition-colors relative shadow-sm group">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-slate-800 text-lg group-hover:text-orange-600 transition-colors">Tiket Harian</h4>
                  <p className="text-xs text-slate-500">Akses 24 Jam Penuh</p>
                </div>
                <div className="text-right">
                  <div className="font-black text-xl text-orange-600">Rp 3.000</div>
                  <div className="text-[10px] text-slate-400 line-through">Rp 15.000</div>
                </div>
              </div>
              <ul className="text-xs space-y-1.5 text-slate-600 mt-3">
                <li className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-500" /> Buka Kunci Unlimited Menu</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-500" /> Buka Satuan Dapur (Siung, dll)</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-500" /> Simulasi Laba Rugi & Operasional</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-500" /> Smart Pricing Pesaing</li>
                <li className="flex items-center gap-1.5 text-slate-400"><X size={14} className="text-red-400" /> <span className="line-through">Cetak Laporan PDF</span></li>
              </ul>
              <button className="w-full mt-4 py-2 bg-orange-100 text-orange-700 font-bold rounded-lg group-hover:bg-orange-500 group-hover:text-white transition-colors text-sm">
                Beli Tiket Harian
              </button>
            </div>

            {/* Mingguan */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 border-2 border-slate-700 hover:border-blue-500 cursor-pointer transition-all relative shadow-lg transform hover:-translate-y-1 group">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md">
                Paling Laris 🔥
              </div>
              <div className="flex justify-between items-start mb-2 mt-1">
                <div>
                  <h4 className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors">Tiket Mingguan</h4>
                  <p className="text-xs text-slate-400">Akses 7 Hari Penuh</p>
                </div>
                <div className="text-right">
                  <div className="font-black text-xl text-blue-400">Rp 10.000</div>
                  <div className="text-[10px] text-slate-500 line-through">Rp 35.000</div>
                </div>
              </div>
              <ul className="text-xs space-y-1.5 text-slate-300 mt-3">
                <li className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-blue-400" /> Semua Fitur Tiket Harian</li>
                <li className="flex items-center gap-1.5 font-bold text-white"><CheckCircle2 size={14} className="text-green-400" /> Buka Cetak Laporan PDF</li>
              </ul>
              <button className="w-full mt-4 py-2 bg-blue-600 text-white font-bold rounded-lg group-hover:bg-blue-500 transition-colors text-sm shadow-lg shadow-blue-500/20">
                Beli Tiket Mingguan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
