import React from 'react';

export default function Logo({ size = 'md', className = '', hideText = false, theme = 'light' }) {
  // Image dimensions
  const dimensions = 
    size === 'lg' ? 'h-20 w-20' : 
    size === 'sm' ? 'h-10 w-10' : 
    'h-14 w-14 md:h-16 md:w-16'; 

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img 
        src="/logo.png" 
        alt="Hitung Cuan Logo" 
        className={`${dimensions} object-cover object-top rounded-xl shadow-sm hover:scale-105 transition-transform shrink-0 bg-white`} 
      />
      {!hideText && (
        <div className="flex flex-col justify-center">
          <span className={`font-black leading-none uppercase ${size === 'lg' ? 'text-5xl' : size === 'sm' ? 'text-2xl' : 'text-3xl md:text-4xl'} ${theme === 'dark' ? 'text-white' : 'bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-amber-600'}`}>
            HITUNG CUAN
          </span>
          <span className={`font-bold tracking-widest mt-1 ${size === 'lg' ? 'text-sm' : size === 'sm' ? 'text-[10px]' : 'text-xs md:text-sm'} ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            KALKULATOR HPP UMKM
          </span>
        </div>
      )}
    </div>
  );
}
