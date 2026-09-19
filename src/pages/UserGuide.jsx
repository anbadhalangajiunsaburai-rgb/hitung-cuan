import React from 'react';
import { ArrowLeft, Database, Calculator, TrendingUp, HelpCircle, Store, CheckCircle2, ChevronRight, FileText, Crown, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UserGuide() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8 max-w-[800px] mb-20">
      <button 
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-slate-500 hover:text-orange-500 transition-colors mb-6 text-sm font-medium"
      >
        <ArrowLeft size={16} /> Kembali ke Dashboard
      </button>

      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-500 mb-4 shadow-sm border border-blue-100">
          <HelpCircle size={32} />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Panduan Lengkap Hitung Cuan</h1>
        <p className="text-slate-500 text-lg">Panduan detail agar hitungan HPP dan Keuntungan Anda akurat 100%.</p>
      </div>

      <div className="space-y-8">
        
        {/* Step 1 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold">1</div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Database size={20} className="text-blue-500" /> Master Gudang (Bahan Baku)
            </h3>
          </div>
          <div className="p-6">
            <p className="text-slate-600 mb-4 leading-relaxed">
              Langkah pertama dan paling penting. Daftarkan semua bahan belanjaan Anda di sini.
            </p>
            <div className="space-y-3 mb-4">
              <div className="flex gap-3">
                <CheckCircle2 size={20} className="text-green-500 shrink-0 mt-0.5" />
                <p className="text-slate-600 text-sm"><strong>Input Harga Real:</strong> Masukkan harga total kulakan (Contoh: Beras Rp 300.000 untuk 25 Kg). Sistem akan mencari harga dasarnya otomatis.</p>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <h4 className="font-bold text-blue-800 mb-1 flex items-center gap-2"><AlertTriangle size={16} /> Tips Barang Potongan (Ayam/Daging/Ikan/Telur)</h4>
              <p className="text-blue-700 text-sm">
                Jika Anda membeli barang per Kilo tapi menggunakannya dalam satuan "Potong" (misal: 1 Kg Ayam utuh dibeli harga Rp 35.000 dan dipotong jadi 8 bagian), sebaiknya input di Gudang dengan <strong>Kuantitas: 8</strong> dan <strong>Satuan: Potong</strong>. Ini akan memudahkan saat memasukkannya ke resep (1 Porsi = 1 Potong).
              </p>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center font-bold">2</div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Calculator size={20} className="text-orange-500" /> Kalkulator HPP & Resep
            </h3>
          </div>
          <div className="p-6">
            <p className="text-slate-600 mb-4 leading-relaxed">
              Tempat meracik resep. Terdapat 2 tipe menu yang bisa Anda buat:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <strong className="text-slate-700 block mb-1 text-sm">Menu Utama</strong>
                <p className="text-slate-500 text-sm">Produk akhir yang dijual langsung ke pelanggan. <em>Contoh: Nasi Goreng Spesial, Ayam Bakar Madu, Es Kopi Susu.</em></p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <strong className="text-slate-700 block mb-1 text-sm">Menu Pendamping</strong>
                <p className="text-slate-500 text-sm">Menu pendamping adalah menu yang menjadi bagian dari menu utama namun dimasak terpisah dari menu utama. <em>Contoh: Orek Tempe, Sambal Terasi, Acar, Lalapan, Kuah Kaldu.</em></p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-5">
              <h4 className="font-bold text-red-800 mb-1 flex items-center gap-2">Peringatan untuk Menu utama : Jangan lupa untuk memasukan Menu pendamping dan kemasan.</h4>
              <ul className="text-red-700 text-sm list-disc pl-5 space-y-1 mt-2">
                <li>Selalu gunakan fitur <strong>Menu Pendamping</strong> jika resep utama Anda memiliki menu pendamping seperti orak tempe, sambal, kuah kaldu dll, agar hitungan modal bumbunya akurat.</li>
                <li>Selalu tambahkan item di tab <strong>Kemasan (Bungkus)</strong> (kotak makan, cup, kresek, sendok). Jangan diremehkan, karena biaya kemasan <strong>sangat berpengaruh pada HPP</strong> dan sering memotong margin keuntungan tanpa disadari!</li>
              </ul>
            </div>

            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-4">
              <h4 className="font-bold text-orange-800 mb-1 flex items-center gap-2"><Crown size={16} /> Mode Premium (Mingguan)</h4>
              <p className="text-orange-700 text-sm">Pengguna premium bisa nambahin bahan baku pakai <strong>Satuan Dapur</strong> (Siung, Lembar, Sendok Teh, Potong, dll). Pengguna Free hanya bisa pakai satuan kaku (Kg, Gram, Liter, dll).</p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <ChevronRight size={20} className="text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-700 block mb-1">Skala Resep (Porsi Total vs Per Porsi)</strong>
                  <p className="text-slate-600 text-sm">Lu bisa bikin resep buat porsi besar (misal: racikan bumbu rendang buat 50 porsi). Sistem bakal otomatis bagi rata HPP-nya per piring.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <ChevronRight size={20} className="text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-700 block mb-1">Cek Satuan & Komposisi (Sangat Penting)</strong>
                  <p className="text-slate-600 text-sm">Pastikan satuan pemakaian resep (Gram, MiliLiter) dan komposisinya akurat dengan data Gudang. Kesalahan memilih Gram menjadi Kg akan membuat perhitungan HPP bengkak tidak akurat.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center font-bold">3</div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Store size={20} className="text-purple-500" /> Master Operasional
            </h3>
          </div>
          <div className="p-6">
            <p className="text-slate-600 mb-4 leading-relaxed">
              Catat pengeluaran operasional toko lu di sini. Ada 3 jenis tab pengeluaran:
            </p>
            
            <div className="space-y-4 mb-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <strong className="text-slate-700 block mb-1 text-lg">1. Biaya Tetap (Fixed Cost)</strong>
                <p className="text-slate-500 text-sm">Biaya yang WAJIB keluar tiap bulan berapapun laku atau tidaknya jualan Anda. <br/><em>Contoh: Sewa Ruko (misal: 24jt/tahun = 2jt/bulan), Gaji Karyawan, Langganan Internet.</em></p>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <strong className="text-slate-700 block mb-1 text-lg">2. Biaya Habis Pakai (Variabel)</strong>
                <p className="text-slate-500 text-sm mb-3">Biaya penunjang operasional yang jumlah pemakaiannya naik turun tergantung tingkat produksi atau seberapa ramainya toko. <br/><em>Contoh: Air, Gas, Bensin, Listrik.</em></p>
                
                <div className="bg-white rounded-lg border border-slate-200 p-3 mt-3">
                  <h4 className="font-bold text-slate-700 mb-2 text-sm">3 Mode Perhitungan Biaya Habis Pakai:</h4>
                  <ul className="space-y-3 text-sm text-slate-600">
                    <li className="flex gap-2">
                      <CheckCircle2 size={16} className="text-purple-500 shrink-0 mt-0.5" />
                      <span><strong>Mode Detail per Menu:</strong> Mode yang sangat presisi tapi merepotkan. Setiap kali Anda menggunakan biaya ekstra (misal gas/air untuk merebus), harus dicatat manual.</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 size={16} className="text-purple-500 shrink-0 mt-0.5" />
                      <span><strong>Mode Nominal Budget (Global):</strong> Anda mematok budget tetap (misal Rp 300.000/bulan) khusus untuk tagihan air/gas. Beban Rp 300rb ini akan otomatis dibagi rata secara adil ke seluruh target porsi jualan Anda (HPP bertambah secara global).</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 size={16} className="text-purple-500 shrink-0 mt-0.5" />
                      <span><strong>Mode Persentase (Global):</strong> Aplikasi otomatis menyisihkan persentase (misal 2% dari total omset) khusus untuk biaya habis pakai. Sangat fleksibel mengikuti ramai/sepinya jualan hari itu.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <strong className="text-slate-700 block mb-1 text-lg">3. Biaya Penyusutan</strong>
                <p className="text-slate-500 text-sm">Biaya depresiasi atau penurunan nilai dari aset berumur panjang seiring berjalannya waktu. <br/><em>Contoh: Alat Masak (Kompor, Panci), Alat Makan (Piring, Gelas), dan Mesin Produksi.</em></p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center font-bold">4</div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp size={20} className="text-emerald-500" /> Laba Rugi & Simulasi
            </h3>
          </div>
          <div className="p-6">
            <p className="text-slate-600 mb-4 leading-relaxed">
              Fase akhir! Di sini lu nentuin mau jual berapa ke pelanggan dan melihat proyeksi keuntungan bersih. Tersedia 3 Tab utama:
            </p>
            
            <div className="space-y-4 mb-6">
              <div className="flex gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center shrink-0 font-bold text-slate-600">1</div>
                <div>
                  <strong className="text-slate-700 block mb-1 text-lg">Simulasi Per Menu (Harga Jual)</strong>
                  <p className="text-slate-600 text-sm">Gunakan slider <strong>Margin</strong> untuk mencari dan mengatur Harga Jual masing-masing menu. Terdapat kolom <strong>Aplikasi Online</strong> yang akan otomatis me-markup harga online (GoFood/GrabFood) berdasarkan potongan komisi (misal: 20%), sehingga margin keuntungan bersih jualan online Anda tetap <strong>SAMA PERSIS</strong> dengan saat pelanggan makan di tempat.</p>
                </div>
              </div>

              <div className="flex gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center shrink-0 font-bold text-slate-600">2</div>
                <div>
                  <strong className="text-slate-700 block mb-1 text-lg">Proyeksi Global (Laba Toko)</strong>
                  <p className="text-slate-600 text-sm">Walau secara hitungan HPP per menu Anda terlihat untung, belum tentu cuannya cukup untuk bayar Sewa Ruko & Karyawan! Tab ini menggabungkan semua asumsi target jualan Anda lalu dipotong dengan <strong>Total Biaya Operasional</strong>. Di sini Anda akan tahu persis apakah omset Anda hari ini benar-benar Laba Bersih atau malah merugi terbakar biaya operasional.</p>
                </div>
              </div>

              <div className="flex gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center shrink-0 font-bold text-slate-600">3</div>
                <div>
                  <strong className="text-slate-700 block mb-1 text-lg">Smart Pricing (Harga Optimal)</strong>
                  <p className="text-slate-600 text-sm">Membalik logika hitungan <em>(Reverse-engineering)</em>. Jika Anda ingin bersaing dan menjual Nasi Goreng di harga pas Rp 20.000, lalu menargetkan cuan 50%, kalkulator pintar ini akan memberitahu Anda <strong>Berapa maksimal Modal (HPP) yang boleh Anda belanjakan</strong> agar margin tersebut tercapai.</p>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mt-2">
              <h4 className="font-bold text-emerald-800 mb-1 flex items-center gap-2"><FileText size={16} /> Fitur Cetak Laporan PDF</h4>
              <p className="text-emerald-700 text-sm">
                Bisa nge-print laporan HPP & Harga Jual per menu secara profesional (lengkap dengan rincian per porsi). <strong>Fitur Cetak PDF ini eksklusif hanya untuk pengguna berlangganan (Paket Mingguan).</strong>
              </p>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
