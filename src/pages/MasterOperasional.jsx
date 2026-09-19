import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowLeft, Save, Plus, Trash2, Edit2, Loader2, DollarSign, Wallet, Building2, HelpCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import BackgroundDecoration from '../components/BackgroundDecoration';

export default function MasterOperasional({ user }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Biaya Tetap'); // Biaya Tetap, Variabel, Penyusutan
  const [amount, setAmount] = useState('');
  
  // Penyusutan specific
  const [assetPrice, setAssetPrice] = useState('');
  const [assetLife, setAssetLife] = useState(''); // in months

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Habis Pakai Settings
  const [hpMode, setHpMode] = useState('detail'); // 'detail', 'budget', 'percentage'
  const [hpBudget, setHpBudget] = useState('');
  const [hpPercentage, setHpPercentage] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        // Fetch Operational Costs (Detail)
        const q = query(collection(db, 'operational_costs'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const data = [];
        querySnapshot.forEach((docSnap) => {
          data.push({ id: docSnap.id, ...docSnap.data() });
        });
        setItems(data);

        // Fetch Operational Settings (Habis Pakai Mode)
        const { getDoc, doc } = await import('firebase/firestore');
        const settingsSnap = await getDoc(doc(db, 'operational_settings', user.uid));
        if (settingsSnap.exists()) {
          const s = settingsSnap.data();
          setHpMode(s.hpMode || 'detail');
          setHpBudget(s.hpBudget ? s.hpBudget.toLocaleString('id-ID') : '');
          setHpPercentage(s.hpPercentage ? s.hpPercentage.toString() : '');
        }
      } catch (error) {
        console.error("Error fetching operational data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const { setDoc, doc } = await import('firebase/firestore');
      await setDoc(doc(db, 'operational_settings', user.uid), {
        hpMode,
        hpBudget: parseInt(hpBudget.replace(/\./g, ''), 10) || 0,
        hpPercentage: parseFloat(hpPercentage) || 0
      }, { merge: true });
      alert('Pengaturan Habis Pakai berhasil disimpan!');
    } catch (error) {
      console.error("Error saving settings", error);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handlePriceChange = (val, setter) => {
    const raw = val.replace(/\D/g, '');
    setter(raw ? parseInt(raw, 10).toLocaleString('id-ID') : '');
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!name || isSubmitting) return;

    let finalAmount = 0;
    if (category === 'Penyusutan') {
      const price = parseInt(assetPrice.replace(/\./g, ''), 10) || 0;
      const lifeYears = parseInt(assetLife, 10) || 1;
      finalAmount = Math.round(price / (lifeYears * 12));
    } else {
      finalAmount = parseInt(amount.replace(/\./g, ''), 10) || 0;
    }

    if (finalAmount <= 0) return;

    setIsSubmitting(true);
    try {
      const itemData = {
        name,
        category,
        amount: finalAmount, // Monthly amount
      };

      if (category === 'Penyusutan') {
        itemData.assetPrice = parseInt(assetPrice.replace(/\./g, ''), 10) || 0;
        itemData.assetLife = parseInt(assetLife, 10) || 1;
      }

      if (editingId) {
        await updateDoc(doc(db, 'operational_costs', editingId), itemData);
        setItems(items.map(item => item.id === editingId ? { ...item, ...itemData } : item));
        setEditingId(null);
      } else {
        itemData.userId = user.uid;
        itemData.createdAt = new Date().toISOString();
        const docRef = await addDoc(collection(db, 'operational_costs'), itemData);
        setItems([...items, { id: docRef.id, ...itemData }]);
      }
      
      resetForm();
    } catch (error) {
      console.error("Error saving cost:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus data pengeluaran ini?')) return;
    try {
      await deleteDoc(doc(db, 'operational_costs', id));
      setItems(items.filter(item => item.id !== id));
    } catch (error) {
      console.error("Error deleting cost:", error);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setName(item.name);
    setCategory(item.category);
    
    if (item.category === 'Penyusutan') {
      setAssetPrice(item.assetPrice.toLocaleString('id-ID'));
      setAssetLife(item.assetLife.toString());
      setAmount('');
    } else {
      setAmount(item.amount.toLocaleString('id-ID'));
      setAssetPrice('');
      setAssetLife('');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setAmount('');
    setAssetPrice('');
    setAssetLife('');
  };

  // Grouped Calculations
  const biayaTetap = items.filter(i => i.category === 'Biaya Tetap');
  const biayaVariabel = items.filter(i => i.category === 'Variabel');
  const biayaPenyusutan = items.filter(i => i.category === 'Penyusutan');

  const sumTetap = biayaTetap.reduce((acc, curr) => acc + curr.amount, 0);
  const sumPenyusutan = biayaPenyusutan.reduce((acc, curr) => acc + curr.amount, 0);
  
  let sumVariabel = 0;
  if (hpMode === 'detail') {
    sumVariabel = biayaVariabel.reduce((acc, curr) => acc + curr.amount, 0);
  } else if (hpMode === 'budget') {
    sumVariabel = parseInt(hpBudget.replace(/\./g, ''), 10) || 0;
  }
  // if hpMode === 'percentage', sumVariabel is 0 in the monthly total because it's per-portion

  const totalBebanBulanan = sumTetap + sumVariabel + sumPenyusutan;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 relative">
      <BackgroundDecoration theme="operasional" />
      <div className="flex items-center gap-4 mb-8">
        <Link to="/" className="p-2 bg-white rounded-full hover:bg-slate-50 transition-colors shadow-sm">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-800">Master Operasional</h1>
          <p className="text-slate-500">Catat dan kelola Beban Operasional / Overhead bulanan.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form & Summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Wallet size={18} className="text-blue-500" /> {editingId ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}
            </h3>
            
            <form onSubmit={handleSaveItem} className="space-y-4">
              <div className="form-group mb-0">
                <label className="form-label">Kategori Biaya</label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    type="button"
                    onClick={() => { setCategory('Biaya Tetap'); resetForm(); }}
                    className={`py-2 px-1 text-xs font-bold rounded-lg border text-center transition-all ${category === 'Biaya Tetap' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                  >
                    Tetap
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setCategory('Variabel'); resetForm(); }}
                    className={`py-2 px-1 text-xs font-bold rounded-lg border text-center transition-all ${category === 'Variabel' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                  >
                    Habis Pakai
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setCategory('Penyusutan'); resetForm(); }}
                    className={`py-2 px-1 text-xs font-bold rounded-lg border text-center transition-all ${category === 'Penyusutan' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                  >
                    Penyusutan
                  </button>
                </div>
                
                {/* Penjelasan Kategori */}
                <div className={`p-3 mt-3 rounded-lg border text-xs leading-relaxed ${
                  category === 'Biaya Tetap' ? 'bg-blue-50 border-blue-100 text-blue-800' :
                  category === 'Variabel' ? 'bg-orange-50 border-orange-100 text-orange-800' :
                  'bg-purple-50 border-purple-100 text-purple-800'
                }`}>
                  {category === 'Biaya Tetap' && <span><strong>Biaya Tetap:</strong> Biaya pasti yang wajib dikeluarkan setiap bulannya, misalnya Sewa Tempat, Gaji Karyawan, Keamanan, dll.</span>}
                  {category === 'Variabel' && <span><strong>Biaya Habis Pakai:</strong> Biaya penunjang operasional, seperti Listrik, Air, Gas, Sabun Cuci Piring, Tisu, Tusuk Gigi, Plastik, dll.</span>}
                  {category === 'Penyusutan' && <span><strong>Penyusutan:</strong> Biaya depresiasi / penurunan nilai dari aset berumur panjang, seperti Alat Masak, Alat Makan, Meja, Kursi, Mesin Kasir, dll.</span>}
                </div>
              </div>

              {category === 'Variabel' && (
                <div className="form-group mb-0 p-3 bg-orange-50 rounded-xl border border-orange-100">
                  <label className="form-label text-orange-800 text-xs uppercase">Metode Perhitungan</label>
                  <select 
                    className="form-select bg-white border-orange-200"
                    value={hpMode}
                    onChange={(e) => setHpMode(e.target.value)}
                  >
                    <option value="detail">1. Rincian Manual (Input satu-satu)</option>
                    <option value="budget">2. Budget Global (Nominal pasti / bln)</option>
                    <option value="percentage">3. Persentase dari HPP</option>
                  </select>
                </div>
              )}

              {(category !== 'Variabel' || hpMode === 'detail') && (
                <>
                  <div className="form-group mb-0">
                    <label className="form-label">Nama Pengeluaran</label>
                    <input 
                      type="text" 
                      required
                      placeholder={
                        category === 'Biaya Tetap' ? 'Contoh: Gaji Karyawan, Sewa Ruko...' :
                        category === 'Variabel' ? 'Contoh: Listrik, Tisu, Sabun...' :
                        'Contoh: Beli Kompor, Meja...'
                      }
                      className="form-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </>
              )}

              {(category !== 'Variabel' || hpMode === 'detail') && (
                <>
                  {category === 'Penyusutan' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="form-group mb-0">
                        <label className="form-label">Harga Beli Aset</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-slate-400 font-medium">Rp</span>
                          <input 
                            type="text" 
                            required
                            inputMode="numeric"
                            className="form-input pl-9"
                            value={assetPrice}
                            onChange={(e) => handlePriceChange(e.target.value, setAssetPrice)}
                          />
                        </div>
                      </div>
                      <div className="form-group mb-0">
                        <label className="form-label">Umur Alat</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            required
                            min="1"
                            className="form-input pr-12 text-center"
                            value={assetLife}
                            onChange={(e) => setAssetLife(e.target.value)}
                          />
                          <span className="absolute right-3 top-2.5 text-slate-400 font-medium">Tahun</span>
                        </div>
                      </div>
                      {(assetPrice && assetLife) && (
                        <div className="col-span-2 text-sm text-purple-700 bg-purple-50 p-2 rounded-lg text-center font-medium border border-purple-100">
                          Beban per bulan = Rp {Math.round(parseInt(assetPrice.replace(/\./g, ''), 10) / (parseInt(assetLife, 10) * 12)).toLocaleString('id-ID')}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="form-group mb-0">
                      <label className="form-label">Estimasi Pengeluaran per Bulan</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-400 font-medium">Rp</span>
                        <input 
                          type="text" 
                          required
                          inputMode="numeric"
                          className="form-input pl-9"
                          value={amount}
                          onChange={(e) => handlePriceChange(e.target.value, setAmount)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex gap-2">
                    <button type="submit" disabled={isSubmitting} className="btn btn-primary flex-1 py-2.5">
                      {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Simpan Data</>}
                    </button>
                    {editingId && (
                      <button type="button" onClick={resetForm} className="btn btn-outline py-2.5 px-3">
                        Batal
                      </button>
                    )}
                  </div>
                </>
              )}

              {category === 'Variabel' && hpMode === 'budget' && (
                <>
                  <div className="form-group mb-0">
                    <label className="form-label">Total Budget Habis Pakai / Bulan</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-medium">Rp</span>
                      <input 
                        type="text" 
                        required
                        inputMode="numeric"
                        className="form-input pl-9"
                        value={hpBudget}
                        onChange={(e) => handlePriceChange(e.target.value, setHpBudget)}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      Catat angka ini saja, tidak perlu merinci tisu, listrik, dll. Cocok untuk Anda yang punya budget pasti.
                    </p>
                  </div>
                  <button type="button" onClick={handleSaveSettings} disabled={isSavingSettings} className="btn btn-primary w-full py-2.5 mt-2">
                    {isSavingSettings ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Simpan Pengaturan</>}
                  </button>
                </>
              )}

              {category === 'Variabel' && hpMode === 'percentage' && (
                <>
                  <div className="form-group mb-0">
                    <label className="form-label">Persentase Biaya Habis Pakai dari HPP</label>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-black text-orange-600 text-xl">{hpPercentage || 0}%</span>
                        <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">dari HPP Menu</span>
                      </div>
                      <input 
                        type="range" 
                        min="0"
                        max="100"
                        step="1"
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        value={hpPercentage || 0}
                        onChange={(e) => setHpPercentage(e.target.value)}
                      />
                      <div className="flex justify-between mt-2 text-xs text-slate-400 font-medium">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      Biaya ini <strong>TIDAK</strong> akan dihitung di Total Beban Bulanan, tapi akan otomatis ditambahkan ke HPP resep saat simulasi Laba Rugi per Porsi.
                    </p>
                  </div>
                  <button type="button" onClick={handleSaveSettings} disabled={isSavingSettings} className="btn btn-primary w-full py-2.5 mt-2">
                    {isSavingSettings ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Simpan Pengaturan</>}
                  </button>
                </>
              )}
            </form>
          </div>

          <div className="glass-card p-6 bg-gradient-to-br from-slate-800 to-slate-900 border-none text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Wallet size={100} />
            </div>
            <h3 className="font-bold text-slate-300 mb-6 flex items-center gap-2 relative z-10">
              <Wallet size={18} className="text-orange-500" /> Ringkasan
            </h3>
            
            <div className="relative z-10">
              <div>
                <p className="text-sm text-slate-400 mb-1">Total Beban Operasional</p>
                <p className="text-3xl font-black text-white">Rp {totalBebanBulanan.toLocaleString('id-ID')} <span className="text-sm font-normal text-slate-400">/bln</span></p>
              </div>
              
              {hpMode === 'percentage' && (
                <div className="mt-3 p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg text-xs text-orange-200">
                  <span className="font-bold block mb-1">⚠️ Catatan Habis Pakai:</span>
                  Biaya ini masih belum fix. Anda memilih mode Persentase ({hpPercentage}%), sehingga biaya habis pakai akan dihitung secara dinamis pada saat simulasi di menu Laba Rugi per porsi.
                </div>
              )}
              
              <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                Biaya ini akan ditarik ke menu <strong>Laba Rugi</strong> untuk menghitung target penjualan dan profit bersih per porsi Anda.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: List */}
        <div className="lg:col-span-7">
          <div className="glass-card p-6 min-h-[500px]">
            <h3 className="font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2">Rincian Operasional Bulanan</h3>
            
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 size={32} className="animate-spin text-orange-500 opacity-50" />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Wallet size={48} className="mx-auto mb-3 opacity-30" />
                <p>Belum ada data operasional.</p>
                <p className="text-sm mt-1">Tambahkan pengeluaran rutin di form sebelah kiri.</p>
              </div>
            ) : (
              <div className="space-y-8">
                
                {/* Kategori 1: Biaya Tetap */}
                <div>
                  <div className="flex justify-between items-center mb-3 bg-blue-50 py-2 px-4 rounded-lg">
                    <h4 className="font-bold text-blue-800 flex items-center gap-2"><Wallet size={16}/> Biaya Tetap</h4>
                    <span className="font-bold text-blue-600">Rp {sumTetap.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="space-y-2 px-2">
                    {biayaTetap.length === 0 ? <p className="text-sm text-slate-400 italic">Belum ada data</p> : 
                      biayaTetap.map(item => (
                        <div key={item.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 group transition-all">
                          <span className="font-medium text-slate-700">{item.name}</span>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-slate-600">Rp {item.amount.toLocaleString('id-ID')}</span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleEdit(item)} className="text-slate-400 hover:text-blue-500"><Pencil size={16}/></button>
                              <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                            </div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>

                {/* Kategori 2: Variabel / Habis Pakai */}
                <div>
                  <div className="flex justify-between items-center mb-3 bg-orange-50 py-2 px-4 rounded-lg">
                    <h4 className="font-bold text-orange-800 flex items-center gap-2"><Zap size={16}/> Variabel & Habis Pakai</h4>
                    <span className="font-bold text-orange-600">Rp {sumVariabel.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="space-y-2 px-2">
                    {hpMode === 'detail' ? (
                      biayaVariabel.length === 0 ? <p className="text-sm text-slate-400 italic">Belum ada data</p> : 
                        biayaVariabel.map(item => (
                          <div key={item.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 group transition-all">
                            <span className="font-medium text-slate-700">{item.name}</span>
                            <div className="flex items-center gap-4">
                              <span className="font-bold text-slate-600">Rp {item.amount.toLocaleString('id-ID')}</span>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(item)} className="text-slate-400 hover:text-blue-500"><Pencil size={16}/></button>
                                <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                              </div>
                            </div>
                          </div>
                        ))
                    ) : hpMode === 'budget' ? (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                        <p className="text-slate-600 font-medium">Budget Bulanan Global</p>
                        <p className="text-sm text-slate-400">Rp {hpBudget || '0'}</p>
                      </div>
                    ) : (
                      <div className="p-3 bg-orange-50 rounded-lg border border-orange-100 text-center">
                        <p className="text-orange-800 font-medium">Persentase Biaya Habis Pakai: {hpPercentage}% dari HPP</p>
                        <p className="text-xs text-orange-600/70 mt-1">Detail akan muncul setelah jumlah porsi per bulan/hari di isi di menu perhitungan laba rugi.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Kategori 3: Penyusutan */}
                <div>
                  <div className="flex justify-between items-center mb-3 bg-purple-50 py-2 px-4 rounded-lg">
                    <h4 className="font-bold text-purple-800 flex items-center gap-2"><Settings size={16}/> Penyusutan Alat</h4>
                    <span className="font-bold text-purple-600">Rp {sumPenyusutan.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="space-y-2 px-2">
                    {biayaPenyusutan.length === 0 ? <p className="text-sm text-slate-400 italic">Belum ada data</p> : 
                      biayaPenyusutan.map(item => (
                        <div key={item.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 group transition-all">
                          <div>
                            <span className="font-medium text-slate-700 block">{item.name}</span>
                            <span className="text-xs text-slate-400">Modal Rp {item.assetPrice?.toLocaleString('id-ID')} / {item.assetLife} Thn</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-slate-600">Rp {item.amount.toLocaleString('id-ID')}</span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleEdit(item)} className="text-slate-400 hover:text-blue-500"><Pencil size={16}/></button>
                              <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                            </div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
