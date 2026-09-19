import React, { useEffect } from 'react';

export default function AdSenseSpace({ format = 'banner' }) {
  return (
    <div 
      className={`relative bg-slate-100 border border-slate-200 rounded-xl flex flex-col items-center justify-center overflow-hidden w-full mb-6 ${
        format === 'rectangle' ? 'aspect-square max-w-[300px] mx-auto' : 'h-24 min-h-[90px]'
      }`}
    >
      <div className="absolute top-0 right-0 bg-white/80 px-2 py-0.5 text-[10px] text-slate-400 border-b border-l border-slate-200 rounded-bl flex items-center gap-1 z-10">
        <span className="font-bold text-blue-500">Ad</span> by Google
      </div>
      
      <div className="text-center p-4 text-slate-400">
        <p className="text-sm font-bold uppercase tracking-widest mb-1">Space Iklan</p>
        <p className="text-[10px] bg-slate-200 text-slate-500 px-2 py-1 rounded inline-block">
          Hanya muncul di Akun Free
        </p>
      </div>
    </div>
  );
}
