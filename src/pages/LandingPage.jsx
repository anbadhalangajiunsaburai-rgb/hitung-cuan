import React, { useState, useEffect } from 'react';
import { ArrowRight, Calculator, Package, TrendingUp, CheckCircle2, FileText, Zap, ShieldCheck, AlertCircle, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import Logo from '../components/Logo';
import AuthModal from '../components/AuthModal';

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleLogin = () => {
    setIsAuthModalOpen(true);
  };

  const testimonials = [
    // Slide 1
    {
      name: "Budi Santoso",
      role: "Owner Nasi Goreng Pak Budi",
      text: "Dulu asal tebak harga jual. Pas pakai Hitung Cuan, baru sadar ternyata selama ini biaya kemasan (kresek, kotak nasi) bikin saya rugi tipis tiap hari.",
      seed: "Felix"
    },
    {
      name: "Siska Amalia",
      role: "Owner Kedai Kopi Sudut",
      text: "Fitur markup harga Online-nya ngebantu banget! Sekarang jual di aplikasi online harganya otomatis menyesuaikan potongan komisi tanpa pusing.",
      seed: "Aneka"
    },
    {
      name: "Sinta Maharani",
      role: "Calon Owner Cafe",
      text: "Rencana buka cafe bulan depan sempet bikin pusing karena takut salah ngasih harga menu. Berkat Hitung Cuan, aku tau persis harga minimum biar gak rugi.",
      seed: "Luna"
    },
    // Slide 2
    {
      name: "Dewi Lestari",
      role: "Ayam Geprek Nendang",
      text: "Menu pendamping kaya sambal bawang itu nyedot modal lumayan. Untung di aplikasi ini bisa dipisah, jadi HPP ayam geprekku 100% akurat.",
      seed: "Jasmine"
    },
    {
      name: "Arif Hidayat",
      role: "Sate Taichan Mercon",
      text: "Bikin resep sate gampang banget. 1 Kg daging diset jadi 100 tusuk di Gudang, pas masuk resep tinggal masukin per tusuk. Sangat praktis!",
      seed: "Leo"
    },
    {
      name: "Reza Pahlevi",
      role: "Pebisnis Pemula",
      text: "Masih tahap riset resep cemilan kering buat dijual online. Pake aplikasi ini, aku bisa ngetes berbagai ukuran kemasan dan langsung liat potensi profitnya.",
      seed: "Max"
    },
    // Slide 3
    {
      name: "Rudi Hartono",
      role: "Es Teh Kekinian",
      text: "Simulasi Laba Rugi ngebantu banget cari harga pas buat cup minuman. Fitur Persentase Biaya Habis Pakai ngebantu cover modal sedotan & lakban.",
      seed: "Jack"
    },
    {
      name: "Hendra Wijaya",
      role: "Martabak Manis Bang Ali",
      text: "Mentega, keju, dan meses harganya sering naik. Pakai Hitung Cuan, kerasa banget kalau ada margin yang menipis, langsung bisa nyesuaiin harga jual.",
      seed: "Oliver"
    },
    {
      name: "Maya Sari",
      role: "Calon Pengusaha Catering",
      text: "Baru mau merintis usaha catering box. Awalnya buta banget soal hitung margin, tapi aplikasi ini nuntun dari awal masukin harga bahan sampai dapet harga jual ideal.",
      seed: "Zoe"
    },
    // Slide 4
    {
      name: "Andi Pratama",
      role: "Owner Katering Sehat",
      text: "Master Gudangnya luar biasa. Pas harga telur naik, saya tinggal ubah di satu tempat, semua HPP menu katering langsung otomatis ke-update!",
      seed: "Nala"
    },
    {
      name: "Siti Rahma",
      role: "Seblak Juara",
      text: "Tadinya bingung ngitung modal kerupuk dan makaroni yang campur aduk. Dengan fitur takaran gram, HPP semangkuk seblak ketahuan bersih.",
      seed: "Mia"
    },
    {
      name: "Joko Anwar",
      role: "Bakso Urat Mas Bro",
      text: "Gak perlu sewa konsultan keuangan. Masukin data penjualan harian ke Laba Rugi Global, langsung kelihatan apakah hari ini warung beneran cuan atau nombok.",
      seed: "Sam"
    }
  ];

  const totalSlides = Math.ceil(testimonials.length / 3);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  // Auto slide every 15 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-orange-200 selection:text-orange-900 scroll-smooth">
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      
      {/* Navigation */}
      <nav className="fixed w-full bg-slate-50/90 backdrop-blur-md border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-5">
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.scrollTo(0, 0)}>
              <Logo size="md" />
            </div>
            
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
              <a href="#masalah" className="hover:text-orange-500 transition-colors">Masalah</a>
              <a href="#fitur" className="hover:text-orange-500 transition-colors">Fitur</a>
              <a href="#testimoni" className="hover:text-orange-500 transition-colors">Testimoni</a>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={handleLogin}
                className="hidden md:flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors"
              >
                Masuk
              </button>
              <button 
                onClick={handleLogin}
                className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/40 flex items-center gap-2"
              >
                Mulai Gratis <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Floating F&B Ornaments */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
          {/* Kiri */}
          <div className="absolute top-10 left-[5%] text-5xl opacity-20 transform -rotate-12 blur-[1px]">🍔</div>
          <div className="absolute top-[40%] left-[10%] text-6xl opacity-15 transform rotate-45">🥩</div>
          <div className="absolute bottom-20 left-[8%] text-5xl opacity-20 transform -rotate-45 blur-[1px]">🥬</div>
          <div className="absolute top-32 left-[25%] text-4xl opacity-15 transform rotate-12">🌶️</div>
          
          {/* Kanan */}
          <div className="absolute top-16 right-[8%] text-6xl opacity-20 transform rotate-12 blur-[1px]">🍜</div>
          <div className="absolute top-[45%] right-[5%] text-5xl opacity-15 transform -rotate-12">☕</div>
          <div className="absolute bottom-24 right-[12%] text-6xl opacity-20 transform rotate-45 blur-[1px]">🍗</div>
          <div className="absolute top-40 right-[25%] text-4xl opacity-15 transform -rotate-45">🍤</div>
          
          {/* Tengah/Lainnya */}
          <div className="absolute bottom-10 left-[30%] text-4xl opacity-15 transform rotate-12">🧅</div>
          <div className="absolute bottom-16 right-[30%] text-5xl opacity-15 transform -rotate-12">🍹</div>
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-600 font-semibold text-xs uppercase tracking-wider mb-8">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            Kalkulator HPP Andalan UMKM Kuliner
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 leading-tight">
            Hitung HPP Cepat, <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
              Bisnis F&B Melesat.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Ucapkan selamat tinggal pada hitungan manual yang bikin pusing. Kelola resep, markup harga Online otomatis, hingga simulasi laba bersih dalam satu sentuhan.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={handleLogin}
              className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-xl shadow-orange-500/30 hover:scale-105 flex items-center justify-center gap-2"
            >
              Coba Sekarang (Gratis) <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Problem / Agitation Section */}
      <div id="masalah" className="bg-slate-900 py-24 text-white relative overflow-hidden">
        {/* Giant Watermark Ornament */}
        <div className="absolute top-0 right-1/2 transform translate-x-1/2 -translate-y-1/4 text-[400px] opacity-[0.02] pointer-events-none select-none z-0">☕</div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-400 font-semibold text-sm mb-6 border border-red-500/30">
                <AlertCircle size={16} /> Fakta Lapangan
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                Jualan Rame Tapi Gak Cuan? Atau Baru Mau Buka Usaha?
              </h2>
              <p className="text-slate-300 text-lg mb-6 leading-relaxed">
                Pernah ngerasa jualan selalu ramai, tapi kok pas akhir bulan uangnya cuma numpang lewat doang? <strong>Atau Anda baru mau buka bisnis F&B, tapi masih bingung cari harga jual dan ngitung margin keuntungan?</strong>
              </p>
              <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                Tenang, <strong>Hitung Cuan</strong> bisa bantu kamu pecahin masalahmu! Pastikan bisnis Anda aman dari Harga Jual yang kemurahan, Operasional yang bocor, dan harga Bahan Baku yang diam-diam naik.
              </p>
              <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                <h4 className="font-bold text-orange-400 mb-2">Jangan Remehkan Detail Kecil!</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Banyak pebisnis lupa menghitung plastik kresek, kotak makan, dan porsi sambal. Kelihatannya cuma <em>"ratusan perak"</em>, tapi kalau dikalikan ribuan porsi terjual, itu jadi <strong>beban raksasa</strong> yang diam-diam memakan habis keuntungan Anda.
                </p>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl blur-3xl opacity-20 animate-pulse"></div>
              <div className="bg-slate-800 border border-slate-700 rounded-3xl p-8 relative shadow-2xl">
                <h3 className="text-xl font-bold mb-6 text-center">Inilah Kenapa Hitung Cuan Hadir</h3>
                <ul className="space-y-6">
                  <li className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-100 mb-1">Perhitungan Presisi</h4>
                      <p className="text-sm text-slate-400">Menghitung HPP detail hingga hitungan gram, siung, dan sendok teh.</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-100 mb-1">Pantau Laba Bersih Realita</h4>
                      <p className="text-sm text-slate-400">Tidak cuma ngitung harga bahan, tapi juga dipotong sewa ruko & gaji karyawan.</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-100 mb-1">Otomatisasi Aplikasi Online</h4>
                      <p className="text-sm text-slate-400">Jual di aplikasi Online langsung otomatis naik harganya sesuai persentase potongan komisi.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="fitur" className="bg-slate-50 py-24 border-t border-slate-200 relative overflow-hidden">
        {/* Giant Watermark Ornament */}
        <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1/4 text-[350px] opacity-[0.03] pointer-events-none select-none z-0">🍕</div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Senjata Rahasia Pemilik Resto & Cafe
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">
              Semua fitur yang Anda butuhkan untuk mengatur modal dan memaksimalkan cuan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <Package size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Master Gudang Pintar</h3>
              <p className="text-slate-600 leading-relaxed">
                Kelola harga beli bahan baku (Beras per Karung, Daging per Kg). Ubah harga di satu tempat, seluruh resep otomatis ter-update.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-6">
                <Calculator size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Kalkulator Resep</h3>
              <p className="text-slate-600 leading-relaxed">
                Tinggal panggil bahan dari gudang. HPP per porsi akan terhitung otomatis tanpa perlu coret-coretan kertas yang bikin pusing.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6">
                <TrendingUp size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Simulasi & Markup Online</h3>
              <p className="text-slate-600 leading-relaxed">
                Tentukan margin keuntungan dan otomatis hitung harga markup khusus aplikasi jualan Online (GoFood, GrabFood, ShopeeFood).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Slider */}
      <div id="testimoni" className="bg-white py-24 border-t border-slate-100 relative overflow-hidden">
        {/* Giant Watermark Ornament */}
        <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/4 text-[350px] opacity-[0.03] pointer-events-none select-none z-0">🍜</div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Apa Kata Mereka?
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">
              Hitung Cuan sudah membantu pebisnis kuliner mengamankan margin keuntungan mereka.
            </p>
          </div>

          <div className="relative">
            {/* Slider Container */}
            <div className="overflow-hidden px-2 pb-6">
              <div 
                className="flex transition-transform duration-700 ease-in-out" 
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                  <div key={slideIndex} className="w-full shrink-0 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.slice(slideIndex * 3, slideIndex * 3 + 3).map((item, idx) => (
                      <div key={idx} className="bg-slate-50 p-8 rounded-3xl border border-slate-100 relative h-full flex flex-col">
                        <Quote className="absolute top-6 right-6 text-slate-200" size={40} />
                        <p className="text-slate-700 mb-8 relative z-10 italic flex-1">
                          "{item.text}"
                        </p>
                        <div className="flex items-center gap-4 mt-auto">
                          {/* Menggunakan Avatar dari Dicebear agar modern dan tidak "bule" */}
                          <img 
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${item.name}&backgroundColor=ffedd5&textColor=ea580c&fontWeight=700`} 
                            alt={item.name} 
                            className="w-12 h-12 rounded-full border-2 border-white shadow-sm" 
                          />
                          <div>
                            <h4 className="font-bold text-slate-900 leading-tight">{item.name}</h4>
                            <p className="text-xs text-slate-500 mt-1">{item.role}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Slider Controls */}
            <div className="flex justify-center items-center gap-6 mt-8">
              <button 
                onClick={prevSlide}
                className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all shadow-sm"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex gap-2">
                {Array.from({ length: totalSlides }).map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`w-3 h-3 rounded-full transition-all ${currentSlide === idx ? 'bg-orange-500 scale-125' : 'bg-slate-300 hover:bg-slate-400'}`}
                  />
                ))}
              </div>

              <button 
                onClick={nextSlide}
                className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all shadow-sm"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          
          <div className="mt-16 text-center">
            <button 
              onClick={handleLogin}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all"
            >
              Coba Fiturnya Sekarang (Gratis)
            </button>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-slate-900 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Logo size="md" theme="dark" />
          </div>
          <p className="text-slate-400 text-sm">
            &copy; {new Date().getFullYear()} Hitung Cuan. Dibuat khusus untuk pejuang UMKM Kuliner Indonesia.
          </p>
        </div>
      </footer>
    </div>
  );
}
