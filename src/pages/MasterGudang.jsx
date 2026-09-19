import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Plus, Trash2, ArrowLeft, Package, Loader2, Pencil, X, ChefHat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BackgroundDecoration from '../components/BackgroundDecoration';
import AdSenseSpace from '../components/AdSenseSpace';

export default function MasterGudang({ user }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Bahan Baku');
  const [buyQty, setBuyQty] = useState(1);
  const [buyUnit, setBuyUnit] = useState('Kg');
  
  // Dual Pricing State
  const [totalPrice, setTotalPrice] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [lastEditedPrice, setLastEditedPrice] = useState('total');
  
  // Custom Yield State
  const [yieldQty, setYieldQty] = useState('');
  const [yieldUnit, setYieldUnit] = useState('Potong');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const fetchInventory = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'inventory'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setItems(data);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [user]);

  const handleGoToRecipe = async () => {
    if (!user?.isPremium) {
      try {
        const q = query(collection(db, 'hpp_projects'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        if (snap.size >= 2) {
          if (window.confirm('Batas kuota gratis (2 Resep) sudah tercapai. Kembali ke Dashboard untuk melihat opsi Premium?')) {
            navigate('/');
          }
          return;
        }
      } catch (error) {
        console.error(error);
      }
    }
    navigate('/hpp');
  };

  const handleTotalChange = (val) => {
    const raw = val.replace(/\D/g, '');
    setTotalPrice(raw ? parseInt(raw, 10).toLocaleString('id-ID') : '');
    setLastEditedPrice('total');
    
    if (raw && buyQty) {
      const q = parseFloat(buyQty);
      const uPrice = parseInt(raw, 10) / q;
      setUnitPrice(Math.round(uPrice).toLocaleString('id-ID'));
    } else {
      setUnitPrice('');
    }
  };

  const handleUnitChange = (val) => {
    const raw = val.replace(/\D/g, '');
    setUnitPrice(raw ? parseInt(raw, 10).toLocaleString('id-ID') : '');
    setLastEditedPrice('unit');
    
    if (raw && buyQty) {
      const q = parseFloat(buyQty);
      const tPrice = parseInt(raw, 10) * q;
      setTotalPrice(Math.round(tPrice).toLocaleString('id-ID'));
    } else {
      setTotalPrice('');
    }
  };

  const handleQtyChange = (val) => {
    setBuyQty(val);
    const q = parseFloat(val) || 1;
    if (lastEditedPrice === 'total' && totalPrice) {
      const raw = parseInt(totalPrice.replace(/\./g, ''), 10);
      setUnitPrice(Math.round(raw / q).toLocaleString('id-ID'));
    } else if (lastEditedPrice === 'unit' && unitPrice) {
      const raw = parseInt(unitPrice.replace(/\./g, ''), 10);
      setTotalPrice(Math.round(raw * q).toLocaleString('id-ID'));
    }
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!name || !totalPrice || !buyQty || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const numericTotalPrice = parseFloat(totalPrice.replace(/\./g, ''));
      const hasYield = !!yieldQty;
      
      const bQty = parseFloat(buyQty);
      const finalQty = hasYield ? (parseFloat(yieldQty) * bQty) : bQty;
      const finalUnit = hasYield ? yieldUnit : buyUnit;

      const itemData = {
        name,
        category,
        price: numericTotalPrice,
        qty: finalQty, // The primary unit used for recipe calculations
        unit: finalUnit, // The primary unit string
        buyQty: bQty, // Stored for display/history
        buyUnit: buyUnit,
        hasYield: hasYield
      };

      if (editingId) {
        await updateDoc(doc(db, 'inventory', editingId), itemData);
        setItems(items.map(item => item.id === editingId ? { ...item, ...itemData } : item));
        setEditingId(null);
      } else {
        itemData.userId = user.uid;
        itemData.createdAt = new Date().toISOString();
        const docRef = await addDoc(collection(db, 'inventory'), itemData);
        setItems([...items, { id: docRef.id, ...itemData }]);
      }
      
      handleCancelEdit(); // Resets form
    } catch (error) {
      console.error("Error saving item:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setName(item.name);
    setCategory(item.category || 'Bahan Baku');
    
    const originalBuyQty = item.buyQty || item.qty;
    setBuyQty(originalBuyQty);
    setBuyUnit(item.buyUnit || item.unit);
    
    // Auto-calculate prices based on total price
    const totPriceStr = item.price.toString();
    setTotalPrice(parseInt(totPriceStr, 10).toLocaleString('id-ID'));
    setLastEditedPrice('total');
    const uPrice = item.price / originalBuyQty;
    setUnitPrice(Math.round(uPrice).toLocaleString('id-ID'));
    
    if (item.hasYield) {
      setYieldQty(item.qty / originalBuyQty);
      setYieldUnit(item.unit);
    } else {
      setYieldQty('');
      setYieldUnit('Potong');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setCategory('Bahan Baku');
    setTotalPrice('');
    setUnitPrice('');
    setBuyQty(1);
    setBuyUnit('Kg');
    setYieldQty('');
    setYieldUnit('Potong');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus bahan ini? HPP menu yang menggunakan bahan ini mungkin jadi tidak akurat.')) return;
    
    try {
      await deleteDoc(doc(db, 'inventory', id));
      setItems(items.filter(item => item.id !== id));
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const unitOptions = ['Kg', 'Gram', 'Liter', 'MiliLiter', 'Pcs', 'Butir', 'Pack', 'Bungkus', 'Lusin', 'Ikat', 'Potong', 'Lembar', 'Porsi', 'Batang', 'Siung'];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 relative">
      <BackgroundDecoration theme="gudang" />
      <button 
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-slate-500 hover:text-orange-500 transition-colors mb-6 text-sm font-medium"
      >
        <ArrowLeft size={16} /> Kembali ke Dashboard
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
            <Package size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Belanja Dapur</h1>
            <p className="text-slate-500 text-sm">Catat semua daftar belanja bahan baku Anda di sini.</p>
          </div>
        </div>
        
        <button 
          onClick={handleGoToRecipe}
          className="btn-primary flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl shadow-lg shadow-orange-500/30 w-full sm:w-auto"
        >
          <ChefHat size={18} />
          <span>Lanjut Buat Resep</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Add / Edit Item */}
        <div className="lg:col-span-5">
          <div className="glass-card p-6 sticky top-24">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800">
                {editingId ? 'Edit Bahan' : 'Tambah Bahan Baru'}
              </h3>
              {editingId && (
                <button onClick={handleCancelEdit} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              )}
            </div>
            
            <form onSubmit={handleSaveItem} className="space-y-4">
              <div className="form-group mb-0">
                <label className="form-label">Nama Barang</label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Daging Ayam, Beras..."
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>



              <div className="form-group mb-0">
                <label className="form-label">Kategori</label>
                <select 
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Bahan Baku">Bahan Baku Utama</option>
                  <option value="Kemasan">Kemasan & Printilan</option>
                </select>
              </div>

              <div className="form-group mb-0">
                <label className="form-label">Satuan</label>
                <select 
                  className="form-select"
                  value={buyUnit}
                  onChange={(e) => setBuyUnit(e.target.value)}
                >
                  {unitOptions.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4">
                <div className="form-group mb-0 flex-1">
                  <label className="form-label">Harga Total</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400 font-medium">Rp</span>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      required
                      placeholder="Isi salah satu"
                      className="form-input pl-10"
                      value={totalPrice}
                      onChange={(e) => handleTotalChange(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group mb-0 w-32">
                  <label className="form-label">Jumlah</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      required
                      min="0.1"
                      step="any"
                      placeholder="1"
                      className="form-input pr-12 text-center"
                      value={buyQty}
                      onChange={(e) => handleQtyChange(e.target.value)}
                    />
                    <span className="absolute right-3 top-3.5 text-slate-400 text-[11px] font-bold uppercase">{buyUnit}</span>
                  </div>
                </div>
              </div>

              <div className="form-group mb-0">
                <label className="form-label">Harga Per {buyUnit}</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400 font-medium">Rp</span>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    required
                    placeholder="Isi salah satu"
                    className="form-input pl-10"
                    value={unitPrice}
                    onChange={(e) => handleUnitChange(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group mb-0 mt-4 border-t border-slate-200 pt-4">
                <label className="form-label text-slate-600">Jumlah fix / perkiraan dalam 1 {buyUnit} (Opsional)</label>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    min="0.1"
                    step="any"
                    placeholder="Isi jika perlu..."
                    className="form-input flex-1"
                    value={yieldQty}
                    onChange={(e) => setYieldQty(e.target.value)}
                  />
                  <select 
                    className="form-select w-1/3"
                    value={yieldUnit}
                    onChange={(e) => setYieldUnit(e.target.value)}
                  >
                    {unitOptions.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Misal: Jika 1 {buyUnit} berisi 10 Potong, isi <b>10</b> di sini.</p>
              </div>
              
              <div className="flex gap-2 mt-4">
                {editingId && (
                  <button 
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isSubmitting}
                    className="w-1/3 btn-outline py-2.5 rounded-lg flex justify-center items-center text-sm"
                  >
                    Batal
                  </button>
                )}
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`${editingId ? 'w-2/3' : 'w-full'} btn-primary py-2.5 rounded-lg flex justify-center items-center gap-2`}
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : (
                    editingId ? <>Update</> : <><Plus size={18} /> Simpan ke Gudang</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Inventory List */}
        <div className="lg:col-span-7">
          
          {/* AdSense Dummy Banner */}
          <AdSenseSpace format="banner" />

          <div className="glass-card p-6 min-h-[400px]">
            <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Daftar Stok & Bahan</h3>
            
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 size={32} className="animate-spin text-orange-500 opacity-50" />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Package size={48} className="mx-auto mb-3 opacity-30" />
                <p>Gudang masih kosong.</p>
                <p className="text-sm mt-1">Mulai tambahkan bahan di form sebelah kiri.</p>
              </div>
            ) : (
              <div>
                {[
                  { title: "Bahan Baku Utama", data: items.filter(i => !i.category || i.category === 'Bahan Baku') },
                  { title: "Kemasan & Printilan", data: items.filter(i => i.category === 'Kemasan') }
                ].map((section, idx) => {
                  if (section.data.length === 0) return null;
                  return (
                    <div key={idx} className="mb-8 last:mb-0">
                      <h4 className="font-bold text-slate-700 mb-3 bg-slate-50 py-2 px-4 rounded-lg">{section.title}</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 text-sm text-slate-500">
                              <th className="py-2 px-4 font-medium whitespace-nowrap">Nama Item</th>
                              <th className="py-2 px-4 font-medium whitespace-nowrap">Stok (Dapat)</th>
                              <th className="py-2 px-4 font-medium whitespace-nowrap">Total Harga</th>
                              <th className="py-2 px-4 font-medium whitespace-nowrap">Harga / Satuan</th>
                              <th className="py-2 px-4 font-medium text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {section.data.map(item => {
                              const unitPrice = item.price / item.qty;
                              return (
                                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 group transition-colors">
                                  <td className="py-3 px-4 font-medium text-slate-800 capitalize">{item.name}</td>
                                  <td className="py-3 px-4">
                                    {item.hasYield ? (
                                      <div>
                                        <span className="font-semibold text-orange-600">{item.qty} {item.unit}</span>
                                        <div className="text-[11px] text-slate-500 mt-0.5">
                                          dari {item.buyQty} {item.buyUnit} ({item.qty / item.buyQty} {item.unit}/{item.buyUnit})
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-slate-600">{item.qty} {item.unit}</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-slate-600">Rp {item.price.toLocaleString('id-ID')}</td>
                                  <td className="py-3 px-4">
                                    <span className="bg-orange-100 text-orange-700 py-1 px-2 rounded font-medium text-sm whitespace-nowrap">
                                      Rp {Math.ceil(unitPrice).toLocaleString('id-ID')} / {item.unit}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button 
                                        onClick={() => handleEditClick(item)}
                                        className="text-slate-400 hover:text-blue-500 p-1.5 rounded-md hover:bg-blue-50 transition-colors"
                                        title="Edit Item"
                                      >
                                        <Pencil size={18} />
                                      </button>
                                      <button 
                                        onClick={() => handleDelete(item.id)}
                                        className="text-slate-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                                        title="Hapus Item"
                                      >
                                        <Trash2 size={18} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
