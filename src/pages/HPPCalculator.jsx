import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Loader2, ChefHat, Plus, Trash2, Calculator, Pencil, Lock, X, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import BackgroundDecoration from '../components/BackgroundDecoration';
import AdSenseSpace from '../components/AdSenseSpace';
import PremiumModal from '../components/PremiumModal';

export default function HPPCalculator({ user, subscription, triggerPaywall }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [projects, setProjects] = useState([]);
  
  // Form State
  const [menuName, setMenuName] = useState('');
  const [portions, setPortions] = useState(1);
  const [recipeItems, setRecipeItems] = useState([]);
  const [recipeType, setRecipeType] = useState('utama'); // 'utama' | 'pendamping'
  const [companionItems, setCompanionItems] = useState([]);
  const [packagingItems, setPackagingItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [activeTab, setActiveTab] = useState('utama'); // List View Tab
  const [showAdModal, setShowAdModal] = useState(false);
  const [adCountdown, setAdCountdown] = useState(0);

  // Delete Ad Mechanics for Free Users
  const [showDeleteAdModal, setShowDeleteAdModal] = useState(false);
  const [deleteAdProgress, setDeleteAdProgress] = useState(0); // 0 to 3
  const [isWatchingDeleteAd, setIsWatchingDeleteAd] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  // UI State
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showResult, setShowResult] = useState(false);
  
  const isPremium = subscription !== 'free';
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user) {
          const qInv = query(collection(db, 'inventory'), where('userId', '==', user.uid));
          const invSnapshot = await getDocs(qInv);
          const invData = [];
          invSnapshot.forEach((d) => invData.push({ id: d.id, ...d.data() }));
          setInventory(invData);
          
          const qProj = query(collection(db, 'hpp_projects'), where('userId', '==', user.uid));
          const projSnapshot = await getDocs(qProj);
          const projData = [];
          projSnapshot.forEach((d) => projData.push({ id: d.id, ...d.data() }));
          projData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setProjects(projData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // Conversion Logic
  const getConversionRate = (buyUnit, useUnit) => {
    if (buyUnit === useUnit) return 1;
    if (useUnit === 'Secukupnya') return 0.02;
    
    const key = `${buyUnit}_${useUnit}`;
    const conv = {
      'Kg_Gram': 1000, 'Gram_Kg': 0.001,
      'Liter_MiliLiter': 1000, 'MiliLiter_Liter': 0.001,
      'Kg_Butir': 16, 'Gram_Butir': 0.016,
      'Kg_Siung': 200, 'Gram_Siung': 0.2,
      'Kg_Lembar': 500, 'Gram_Lembar': 0.5,
      'Kg_Batang': 100, 'Gram_Batang': 0.1,
      'Liter_Sendok': 66, 'MiliLiter_Sendok': 0.066,
      'Kg_Sendok': 66, 'Gram_Sendok': 0.066,
      'Kg_Pcs': 20, 'Gram_Pcs': 0.02,
      'Kg_Potong': 20, 'Gram_Potong': 0.02,
      'Lusin_Pcs': 12, 'Pack_Pcs': 10, 'Bungkus_Pcs': 10, 'Pack_Bungkus': 10
    };
    return conv[key] || 0;
  };

  const calculateCost = (item, defaultUsage = 'total_resep') => {
    if (!item.inventoryId || !item.useQty || !item.useUnit) return 0;
    const invItem = inventory.find(i => i.id === item.inventoryId);
    if (!invItem) return 0;

    let rate = getConversionRate(invItem.unit, item.useUnit);
    if (rate === 0) return 0;

    const qtyBought = invItem.qty || 1;
    const pricePerBaseUnit = invItem.price / qtyBought;
    let qtyInBuyUnit = item.useUnit === 'Secukupnya' ? rate : parseFloat(item.useQty) / rate;
    
    // Per Porsi Logic (kalikan dengan total porsi karena function ini ngitung total harga resep/batch)
    const usage = item.usageType || defaultUsage;
    if (usage === 'per_porsi') {
      qtyInBuyUnit = qtyInBuyUnit * (parseFloat(portions) || 1);
    }
    
    return qtyInBuyUnit * pricePerBaseUnit;
  };

  const calculateCompanionCost = (comp) => {
    if (!comp.projectId || !comp.usePortions) return 0;
    const project = projects.find(p => p.id === comp.projectId);
    if (!project) return 0;
    const hppPerPortion = project.hppPerPortion || (project.totalHPP / (project.portions || 1));
    
    let useQty = parseFloat(comp.usePortions);
    const usage = comp.usageType || 'per_porsi';
    if (usage === 'per_porsi') {
      useQty = useQty * (parseFloat(portions) || 1);
    }
    
    return useQty * hppPerPortion;
  };

  const totalIngredientsHPP = recipeItems.reduce((sum, item) => sum + calculateCost(item, 'total_resep'), 0);
  const totalCompanionsHPP = companionItems.reduce((sum, item) => sum + calculateCompanionCost(item), 0);
  const totalPackagingsHPP = packagingItems.reduce((sum, item) => sum + calculateCost(item, 'per_porsi'), 0);

  const totalBaseHPP = totalIngredientsHPP + totalCompanionsHPP; // Dine-in
  const totalTakeawayHPP = totalBaseHPP + totalPackagingsHPP; // Takeaway (HPP Total)
  const totalHPP = recipeType === 'utama' ? totalTakeawayHPP : totalBaseHPP;

  const handleAddItem = (type = 'ingredient') => {
    if (type === 'ingredient') setRecipeItems([...recipeItems, { id: Date.now(), inventoryId: '', useQty: '', useUnit: '' }]);
    if (type === 'companion') setCompanionItems([...companionItems, { id: Date.now(), projectId: '', usePortions: '', usageType: 'per_porsi' }]);
    if (type === 'packaging') setPackagingItems([...packagingItems, { id: Date.now(), inventoryId: '', useQty: '', useUnit: '', usageType: 'per_porsi' }]);
    setShowResult(false);
  };

  const handleRemoveItem = (id, type = 'ingredient') => {
    if (type === 'ingredient') setRecipeItems(recipeItems.filter(item => item.id !== id));
    if (type === 'companion') setCompanionItems(companionItems.filter(item => item.id !== id));
    if (type === 'packaging') setPackagingItems(packagingItems.filter(item => item.id !== id));
    setShowResult(false);
  };

  const handleUpdateItem = (id, field, value, type = 'ingredient') => {
    const updateList = (list, setList) => {
      setList(list.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'inventoryId' && (type === 'ingredient' || type === 'packaging')) {
            const inv = inventory.find(i => i.id === value);
            if (inv) {
              if (inv.unit === 'Kg') updated.useUnit = 'Gram';
              else if (inv.unit === 'Liter') updated.useUnit = 'MiliLiter';
              else updated.useUnit = inv.unit;
            }
          }
          return updated;
        }
        return item;
      }));
    };
    
    if (type === 'ingredient') updateList(recipeItems, setRecipeItems);
    if (type === 'companion') updateList(companionItems, setCompanionItems);
    if (type === 'packaging') updateList(packagingItems, setPackagingItems);
    
    setShowResult(false);
  };

  const executeSave = async () => {
    setIsSaving(true);
    try {
      const p = parseFloat(portions) || 1;
      const projectData = {
        userId: user.uid,
        menuName,
        portions: p,
        totalHPP,
        totalBaseHPP,
        totalTakeawayHPP,
        hppPerPortion: totalHPP / p,
        recipeItems,
        recipeType,
        companionItems: recipeType === 'utama' ? companionItems : [],
        packagingItems: recipeType === 'utama' ? packagingItems : [],
        updatedAt: new Date().toISOString()
      };
      
      if (editingId) {
        const ref = doc(db, 'hpp_projects', editingId);
        await updateDoc(ref, projectData);
        setProjects(projects.map(proj => proj.id === editingId ? { ...proj, ...projectData } : proj));
      } else {
        projectData.createdAt = new Date().toISOString();
        const docRef = await addDoc(collection(db, 'hpp_projects'), projectData);
        setProjects([{ id: docRef.id, ...projectData }, ...projects]);
        setEditingId(docRef.id);
      }
      
      setSaveSuccess(true);
      setShowResult(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error("Error saving recipe:", error);
    } finally {
      setIsSaving(false);
      setShowAdModal(false);
    }
  };

  const handleSave = () => {
    if (!menuName || recipeItems.length === 0 || isSaving) return;
    
    if (subscription === 'free' && !editingId) {
      const typeCount = projects.filter(p => (p.recipeType || 'utama') === recipeType).length;
      if (typeCount >= 2) {
        triggerPaywall(`Batas 2 Menu ${recipeType === 'pendamping' ? 'Pendamping' : 'Utama'} untuk akun Free. Buka kunci unlimited resep sekarang!`);
        return;
      }
    }

    if (subscription === 'free') {
      setShowAdModal(true);
      setAdCountdown(4); // 4 seconds countdown
    } else {
      executeSave();
    }
  };

  // Handle countdown effect (Save)
  useEffect(() => {
    let timer;
    if (showAdModal && adCountdown > 0) {
      timer = setTimeout(() => setAdCountdown(prev => prev - 1), 1000);
    } else if (showAdModal && adCountdown === 0) {
      executeSave();
    }
    return () => clearTimeout(timer);
  }, [showAdModal, adCountdown]);

  // Handle countdown effect (Delete)
  useEffect(() => {
    let timer;
    if (showDeleteAdModal && isWatchingDeleteAd && adCountdown > 0) {
      timer = setTimeout(() => setAdCountdown(prev => prev - 1), 1000);
    } else if (showDeleteAdModal && isWatchingDeleteAd && adCountdown === 0) {
      setIsWatchingDeleteAd(false);
      setDeleteAdProgress(prev => prev + 1);
    }
    return () => clearTimeout(timer);
  }, [showDeleteAdModal, isWatchingDeleteAd, adCountdown]);



  const handleReset = () => {
    setEditingId(null);
    setMenuName('');
    setPortions(1);
    setRecipeItems([]);
    setCompanionItems([]);
    setPackagingItems([]);
    setShowResult(false);
  };

  const handleCreateNew = (type = 'utama') => {
    if (subscription === 'free') {
      const typeCount = projects.filter(p => (p.recipeType || 'utama') === type).length;
      if (typeCount >= 2) {
        triggerPaywall(`Batas 2 Menu ${type === 'pendamping' ? 'Pendamping' : 'Utama'} untuk akun Free. Buka kunci unlimited resep sekarang!`);
        return;
      }
    }
    handleReset();
    setRecipeType(type);
    setViewMode('form');
  };

  const freeUnits = ['Kg', 'Gram', 'Liter', 'MiliLiter', 'Pcs'];
  const proUnits = ['Butir', 'Sendok', 'Potong', 'Lembar', 'Porsi', 'Batang', 'Siung', 'Secukupnya'];

  const handleUnitChange = (id, newUnit, type = 'ingredient') => {
    if (proUnits.includes(newUnit) && subscription === 'free') {
      triggerPaywall("Buka kunci satuan dapur (Siung, Sendok, Lembar, dll) biar ngitung HPP lebih praktis dan akurat tanpa capek ngonversi manual!");
      return;
    }
    handleUpdateItem(id, 'useUnit', newUnit, type);
  };

  const handleEditProject = (project) => {
    if (!isPremium) {
      triggerPaywall("Fitur Edit Resep terkunci. Upgrade sekarang untuk mengubah daftar resep Anda!");
      return;
    }
    setEditingId(project.id);
    setMenuName(project.menuName);
    setPortions(project.portions || 1);
    setRecipeItems(project.recipeItems || []);
    setRecipeType(project.recipeType || 'utama');
    setCompanionItems(project.companionItems || []);
    setPackagingItems(project.packagingItems || []);
    setShowResult(false);
    setViewMode('form');
  };

  const executeDeleteProject = async (id) => {
    try {
      await deleteDoc(doc(db, 'hpp_projects', id));
      setProjects(projects.filter(p => p.id !== id));
      if (editingId === id) {
        handleReset();
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  const handleDeleteProject = async (id) => {
    if (subscription === 'free') {
      setProjectToDelete(id);
      setDeleteAdProgress(0);
      setIsWatchingDeleteAd(false);
      setShowDeleteAdModal(true);
      return;
    }
    
    // For Premium
    if (window.confirm('Yakin ingin menghapus resep ini?')) {
      await executeDeleteProject(id);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 relative">
      <BackgroundDecoration theme="resep" />
      {viewMode === 'list' ? (
        <div>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <button 
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-slate-500 hover:text-orange-500 transition-colors mb-2 text-sm font-medium"
              >
                <ArrowLeft size={16} /> Kembali ke Dashboard
              </button>
              <div className="flex items-center gap-3">
                <ChefHat className="text-orange-500" size={32} />
                <h1 className="text-3xl font-bold text-slate-800">Daftar Resep</h1>
              </div>
            </div>
          </div>

          {/* Section 1: Menu Utama */}
          <div className="mb-12">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                <span className="w-2 h-6 bg-orange-500 rounded-full inline-block"></span>
                Menu Utama
              </h2>
              <div className="bg-orange-50 text-orange-800 p-4 rounded-xl border border-orange-100 text-sm">
                <p className="font-medium">Menu Utama adalah hidangan pokok yang dijual (contoh: Nasi Goreng, Ayam Cabe Hijau, Nasi Uduk).</p>
                <p className="mt-1 opacity-90">Menu ini menjadi <strong>penentu utama</strong> dalam pembagian biaya operasional bulanan (overhead) di perhitungan Laba Rugi Toko.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.filter(p => (p.recipeType || 'utama') === 'utama').map(project => (
                <div key={project.id} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-orange-300 hover:shadow-lg transition-all shadow-sm flex flex-col justify-between relative overflow-hidden group">
                   <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500"></div>
                   <div>
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-lg text-slate-800 group-hover:text-orange-600 transition-colors">{project.menuName}</h4>
                      </div>
                      <div className="text-xs text-slate-400">{project.portions || 1} Porsi â€¢ Dibuat: {new Date(project.createdAt).toLocaleDateString('id-ID')}</div>
                   </div>
                   <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-end">
                      <div>
                        <div className="text-xs text-slate-500 mb-1 font-medium">Modal / Porsi</div>
                        <div className="font-black text-xl text-slate-800">Rp {Math.ceil(project.hppPerPortion || (project.totalHPP / (project.portions || 1))).toLocaleString('id-ID')}</div>
                      </div>
                      <div className="flex gap-2 relative z-10">
                        <button 
                          onClick={() => handleEditProject(project)}
                          className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-colors"
                          title="Edit Resep"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteProject(project.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          title="Hapus Resep"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                   </div>
                </div>
              ))}
              
              <div 
                onClick={() => handleCreateNew('utama')} 
                className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-orange-400 hover:bg-orange-50 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[160px] group"
              >
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 group-hover:text-orange-500 mb-3 shadow-sm transition-colors">
                  <Plus size={24} />
                </div>
                <span className="font-bold text-slate-500 group-hover:text-orange-600 transition-colors">Tambah Menu Utama</span>
              </div>
            </div>
          </div>

          <hr className="my-10 border-slate-200 border-dashed" />

          {/* Section 2: Menu Pendamping */}
          <div className="mb-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                <span className="w-2 h-6 bg-blue-500 rounded-full inline-block"></span>
                Menu Pendamping
              </h2>
              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100 text-sm">
                <p className="font-medium">Menu Pendamping adalah lauk tambahan atau pelengkap (contoh: Orek Tempe, Sambal, Telur Balado, Kerupuk).</p>
                <p className="mt-1 opacity-90">Menu ini tidak dijual terpisah, melainkan ditambahkan ke dalam resep Menu Utama. Menu ini <strong>tidak menanggung biaya operasional</strong> secara langsung.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.filter(p => p.recipeType === 'pendamping').map(project => (
                <div key={project.id} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all shadow-sm flex flex-col justify-between relative overflow-hidden group">
                   <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                   <div>
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-lg text-slate-800 group-hover:text-blue-600 transition-colors">{project.menuName}</h4>
                      </div>
                      <div className="text-xs text-slate-400">{project.portions || 1} Porsi â€¢ Dibuat: {new Date(project.createdAt).toLocaleDateString('id-ID')}</div>
                   </div>
                   <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-end">
                      <div>
                        <div className="text-xs text-slate-500 mb-1 font-medium">Modal / Porsi</div>
                        <div className="font-black text-xl text-slate-800">Rp {Math.ceil(project.hppPerPortion || (project.totalHPP / (project.portions || 1))).toLocaleString('id-ID')}</div>
                      </div>
                      <div className="flex gap-2 relative z-10">
                        <button 
                          onClick={() => handleEditProject(project)}
                          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                          title="Edit Resep"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteProject(project.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          title="Hapus Resep"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                   </div>
                </div>
              ))}
              
              <div 
                onClick={() => handleCreateNew('pendamping')} 
                className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[160px] group"
              >
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 group-hover:text-blue-500 mb-3 shadow-sm transition-colors">
                  <Plus size={24} />
                </div>
                <span className="font-bold text-slate-500 group-hover:text-blue-600 transition-colors">Tambah Menu Pendamping</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <button 
                onClick={() => setViewMode('list')}
                className="flex items-center gap-2 text-slate-500 hover:text-orange-500 transition-colors mb-2 text-sm font-medium"
              >
                <ArrowLeft size={16} /> Kembali ke Daftar Resep
              </button>
              <div className="flex items-center gap-3">
                <ChefHat className={recipeType === 'utama' ? 'text-orange-500' : 'text-blue-500'} size={32} />
                <h1 className="text-3xl font-bold text-slate-800">
                  {editingId ? 'Edit' : 'Buat'} {recipeType === 'utama' ? 'Menu Utama' : 'Menu Pendamping'}
                </h1>
              </div>
            </div>
            <div>
              <button 
                onClick={handleSave}
                disabled={!menuName || recipeItems.length === 0 || isSaving || saveSuccess}
                className="btn btn-primary shadow-lg shadow-orange-500/30"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : 
                 saveSuccess ? 'Tersimpan! âœ…' : <><Save size={18} /> Simpan Resep</>}
              </button>
            </div>
          </div>

      <div className={showResult ? "grid grid-cols-1 lg:grid-cols-12 gap-8" : "max-w-3xl mx-auto space-y-6"}>
        
        {/* Form Resep */}
        <div className={showResult ? "lg:col-span-8 space-y-6" : "space-y-6"}>
          
          <div className={`border rounded-xl p-4 flex gap-3 ${recipeType === 'utama' ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
            <div className="mt-0.5">
              <AlertTriangle size={20} className={recipeType === 'utama' ? 'text-orange-500' : 'text-blue-500'} />
            </div>
            <div className="text-sm">
              <p className="font-bold mb-1">Penting: Teliti Sebelum Menyimpan!</p>
              <p className={recipeType === 'utama' ? 'text-orange-700' : 'text-blue-700'}>Pastikan Anda memasukkan <b>Takaran</b> dan <b>Satuan</b> dengan benar. Kesalahan kecil dalam memilih satuan (misal: seharusnya Gram tetapi terpilih Kg) dapat membuat hasil perhitungan HPP menjadi tidak akurat.</p>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex gap-4 mb-6">
              <div className="form-group mb-0 flex-1">
                <label className="form-label text-lg">Nama {recipeType === 'utama' ? 'Menu Utama' : 'Menu Pendamping'}</label>
                <input 
                  type="text" 
                  placeholder={recipeType === 'utama' ? "Contoh: Nasi Goreng Spesial..." : "Contoh: Orek Tempe, Sambal, Kerupuk..."}
                  className="form-input text-lg font-bold py-3"
                  value={menuName}
                  onChange={(e) => {
                    setMenuName(e.target.value);
                    setShowResult(false);
                  }}
                />
              </div>
              <div className="form-group mb-0 w-32">
                <label className="form-label text-lg">Hasil Porsi</label>
                <input 
                  type="number" 
                  min="1"
                  step="any"
                  className="form-input text-lg font-bold py-3 text-center"
                  value={portions}
                  onChange={(e) => {
                    setPortions(e.target.value);
                    setShowResult(false);
                  }}
                />
              </div>
            </div>

          <div className="border-b border-slate-200 pb-3 mb-4">
            <h3 className="font-bold text-slate-800">Bahan yang Digunakan</h3>
          </div>

          {recipeItems.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
              <ChefHat size={48} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium mb-1">Belum ada bahan</p>
              <p className="text-sm text-slate-400 mb-4">Mulai racik resep Anda dengan menambahkan bahan.</p>
              <button onClick={() => handleAddItem('ingredient')} className="btn-primary py-2 px-6 rounded-full inline-flex items-center gap-2">
                <Plus size={16} /> Tambah Bahan Pertama
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recipeItems.map((item, index) => {
                const invItem = inventory.find(i => i.id === item.inventoryId);
                const showBuyUnit = invItem ? `(Beli: ${invItem.unit})` : '';

                const rateError = invItem && item.useUnit && getConversionRate(invItem.unit, item.useUnit) === 0;

                return (
                  <div key={item.id} className="flex flex-col gap-2 p-3 rounded-xl border border-slate-200 bg-white relative group transition-colors hover:border-orange-200">
                    <div className="flex flex-col sm:flex-row gap-3 w-full items-start sm:items-center">
                      <div className="w-full sm:flex-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Pilih Bahan {showBuyUnit}</label>
                        <select 
                          className="form-select bg-slate-50 border-slate-200 text-sm"
                          value={item.inventoryId}
                          onChange={(e) => handleUpdateItem(item.id, 'inventoryId', e.target.value)}
                        >
                          <option value="">-- Pilih dari gudang --</option>
                          {inventory.filter(inv => !inv.category || inv.category === 'Bahan Baku').map(inv => (
                            <option key={inv.id} value={inv.id}>
                              {inv.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-3 w-full sm:w-auto">
                        <div className="w-24">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Takaran</label>
                          <input 
                            type="number" 
                            min="0" 
                            step="any"
                            placeholder="0"
                            className="form-input bg-slate-50 border-slate-200 text-sm text-center"
                            value={item.useQty}
                            onChange={(e) => handleUpdateItem(item.id, 'useQty', e.target.value)}
                          />
                        </div>

                        <div className="w-32">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Satuan Pakai</label>
                          <select 
                            className="form-select bg-slate-50 border-slate-200 text-sm"
                            value={item.useUnit}
                            onChange={(e) => handleUnitChange(item.id, e.target.value, 'ingredient')}
                          >
                            <option value="">Satuan</option>
                            <optgroup label="Standar">
                              {freeUnits.map(u => <option key={u} value={u}>{u}</option>)}
                            </optgroup>
                            <optgroup label="Dapur (Premium)">
                              {proUnits.map(u => <option key={u} value={u}>{u}{subscription === 'free' ? ' 🔒' : ''}</option>)}
                            </optgroup>
                          </select>
                        </div>

                        <div className="flex items-end justify-center pb-1">
                          <button 
                            onClick={() => handleRemoveItem(item.id)} 
                            className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                            title="Hapus Bahan"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                    {rateError && (
                      <div className="text-xs text-red-500 font-medium px-1 flex items-center gap-1">
                        âš ï¸ Tidak bisa mengonversi dari {invItem.unit} (Gudang) ke {item.useUnit} (Resep). Hasil akan Rp 0.
                      </div>
                    )}
                  </div>
                );
              })}
              
              <button 
                onClick={() => handleAddItem('ingredient')} 
                className="w-full mt-2 py-3 border-2 border-dashed border-slate-200 text-slate-500 rounded-xl font-bold hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50 transition-all flex justify-center items-center gap-2"
              >
                <Plus size={18} /> Tambah Bahan
              </button>
            </div>
          )}
        </div>

        {recipeType === 'utama' && (
          <>
            {/* SESI PENDAMPING */}
            <div className="glass-card p-6 mt-6">
              <div className="border-b border-slate-200 pb-3 mb-4">
                <h3 className="font-bold text-slate-800">Menu Pendamping (Opsional)</h3>
              </div>
              {companionItems.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                  <p className="text-sm text-slate-400 mb-3">Tidak ada menu pendamping.</p>
                  <button onClick={() => handleAddItem('companion')} className="btn bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 py-2 px-6 rounded-full inline-flex items-center gap-2">
                    <Plus size={16} /> Tambah Pendamping
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {companionItems.map(item => (
                    <div key={item.id} className="flex gap-3 p-3 rounded-xl border border-slate-200 bg-white items-center">
                      <div className="flex-1">
                        <select className="form-select bg-slate-50 border-slate-200 text-sm" value={item.projectId} onChange={(e) => handleUpdateItem(item.id, 'projectId', e.target.value, 'companion')}>
                          <option value="">-- Pilih Pendamping Tersimpan --</option>
                          {projects.filter(p => p.recipeType === 'pendamping').map(p => (
                            <option key={p.id} value={p.id}>{p.menuName} (Rp {Math.ceil(p.hppPerPortion || (p.totalHPP / (p.portions || 1))).toLocaleString('id-ID')}/porsi)</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24">
                        <input type="number" min="0" step="any" placeholder="Jml" className="form-input text-center text-sm" value={item.usePortions} onChange={(e) => handleUpdateItem(item.id, 'usePortions', e.target.value, 'companion')} />
                      </div>
                      <div className="w-32">
                        <select className="form-select bg-slate-50 border-slate-200 text-sm" value={item.usageType || 'per_porsi'} onChange={(e) => handleUpdateItem(item.id, 'usageType', e.target.value, 'companion')}>
                          <option value="per_porsi">Per Porsi</option>
                          <option value="total_resep">Total Resep</option>
                        </select>
                      </div>
                      <div className="flex items-end justify-center pb-1">
                        <button onClick={() => handleRemoveItem(item.id, 'companion')} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => handleAddItem('companion')} className="w-full mt-2 py-3 border-2 border-dashed border-slate-200 text-slate-500 rounded-xl font-bold hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50 transition-all flex justify-center items-center gap-2">
                    <Plus size={18} /> Tambah Pendamping
                  </button>
                </div>
              )}
            </div>

            {/* SESI KEMASAN */}
            <div className="glass-card p-6 mt-6">
              <div className="border-b border-slate-200 pb-3 mb-4">
                <h3 className="font-bold text-slate-800">Kemasan & Printilan (Khusus Take-away)</h3>
              </div>
              {packagingItems.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                  <p className="text-sm text-slate-400 mb-3">Belum ada kemasan.</p>
                  <button onClick={() => handleAddItem('packaging')} className="btn bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 py-2 px-6 rounded-full inline-flex items-center gap-2">
                    <Plus size={16} /> Tambah Kemasan
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {packagingItems.map((item, index) => {
                    const invItem = inventory.find(i => i.id === item.inventoryId);
                    const showBuyUnit = invItem ? `(Beli: ${invItem.unit})` : '';
                    const rateError = invItem && item.useUnit && getConversionRate(invItem.unit, item.useUnit) === 0;
                    
                    return (
                      <div key={item.id} className="flex flex-col gap-2 p-3 rounded-xl border border-slate-200 bg-white relative group transition-colors hover:border-orange-200">
                        <div className="flex flex-col sm:flex-row gap-3 w-full items-start sm:items-center">
                          <div className="w-full sm:flex-1">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Pilih Item {showBuyUnit}</label>
                            <select className="form-select bg-slate-50 border-slate-200 text-sm" value={item.inventoryId} onChange={(e) => handleUpdateItem(item.id, 'inventoryId', e.target.value, 'packaging')}>
                              <option value="">-- Pilih Kemasan/Printilan --</option>
                              {inventory.filter(inv => inv.category === 'Kemasan').map(inv => (
                                <option key={inv.id} value={inv.id}>{inv.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="w-24">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Jml</label>
                            <input type="number" min="0" step="any" placeholder="Qty" className="form-input text-center text-sm" value={item.useQty} onChange={(e) => handleUpdateItem(item.id, 'useQty', e.target.value, 'packaging')} />
                          </div>
                          <div className="w-28">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Satuan</label>
                            <select className="form-select bg-slate-50 border-slate-200 text-sm" value={item.useUnit} onChange={(e) => handleUnitChange(item.id, e.target.value, 'packaging')}>
                              <option value="">Satuan</option>
                              <optgroup label="Standar">
                                {freeUnits.map(u => <option key={u} value={u}>{u}</option>)}
                              </optgroup>
                              <optgroup label="Dapur (Premium)">
                                {proUnits.map(u => <option key={u} value={u}>{u}{subscription === 'free' ? ' 🔒' : ''}</option>)}
                              </optgroup>
                            </select>
                          </div>
                          <div className="w-32">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Peruntukan</label>
                            <select className="form-select bg-slate-50 border-slate-200 text-sm" value={item.usageType || 'per_porsi'} onChange={(e) => handleUpdateItem(item.id, 'usageType', e.target.value, 'packaging')}>
                              <option value="per_porsi">Per Porsi</option>
                              <option value="total_resep">Total Resep</option>
                            </select>
                          </div>
                          <div className="flex items-end justify-center pb-1">
                            <button onClick={() => handleRemoveItem(item.id, 'packaging')} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Hapus Item">
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </div>
                        {rateError && (
                          <div className="text-xs text-red-500 font-medium px-1 flex items-center gap-1">
                            âš ï¸ Tidak bisa mengonversi dari {invItem.unit} (Gudang) ke {item.useUnit} (Resep). Hasil akan Rp 0.
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <button onClick={() => handleAddItem('packaging')} className="w-full mt-2 py-3 border-2 border-dashed border-slate-200 text-slate-500 rounded-xl font-bold hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50 transition-all flex justify-center items-center gap-2">
                    <Plus size={18} /> Tambah Kemasan
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

        {/* Right Column: Hasil HPP (Tampil setelah disimpan) */}
        {showResult && (
          <div className="lg:col-span-4">
            <div className="glass-card p-6 sticky top-24 bg-white border border-slate-200 shadow-xl">
              <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">Rincian HPP per Porsi</h3>
              
              <div className="space-y-4 mb-6">
                {/* Bahan Utama */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bahan Utama</h4>
                  {recipeItems.map(item => {
                    const invItem = inventory.find(i => i.id === item.inventoryId);
                    if (!invItem) return null;
                    const costPerPortion = calculateCost(item, 'total_resep') / (parseFloat(portions) || 1);
                    return (
                      <div key={item.id} className="flex justify-between items-center text-sm border-b border-slate-50 pb-1 mb-1">
                        <span className="text-slate-600 capitalize">{invItem.name}</span>
                        <span className="font-medium text-slate-800">Rp {Math.ceil(costPerPortion).toLocaleString('id-ID')}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Pendamping */}
                {recipeType === 'utama' && companionItems.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4">Menu Pendamping</h4>
                    {companionItems.map(item => {
                      const project = projects.find(p => p.id === item.projectId);
                      if (!project) return null;
                      const costPerPortion = calculateCompanionCost(item) / (parseFloat(portions) || 1);
                      return (
                        <div key={item.id} className="flex justify-between items-center text-sm border-b border-slate-50 pb-1 mb-1">
                          <span className="text-slate-600 capitalize">{project.menuName}</span>
                          <span className="font-medium text-slate-800">Rp {Math.ceil(costPerPortion).toLocaleString('id-ID')}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Kemasan */}
                {recipeType === 'utama' && packagingItems.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4">Kemasan & Pelengkap</h4>
                    {packagingItems.map(item => {
                      const invItem = inventory.find(i => i.id === item.inventoryId);
                      if (!invItem) return null;
                      const costPerPortion = calculateCost(item, 'per_porsi') / (parseFloat(portions) || 1);
                      return (
                        <div key={item.id} className="flex justify-between items-center text-sm border-b border-slate-50 pb-1 mb-1">
                          <span className="text-slate-600 capitalize">{invItem.name}</span>
                          <span className="font-medium text-slate-800">Rp {Math.ceil(costPerPortion).toLocaleString('id-ID')}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {recipeType === 'utama' ? (
                <div className="-mx-6 -mb-6">
                  {/* Dine In */}
                  <div className="bg-slate-50 p-6 border-t border-slate-100">
                    <div className="text-sm font-semibold text-slate-500 mb-1">HPP Makan di Tempat</div>
                    <div className="text-2xl font-black text-slate-700">
                      Rp {Math.ceil(totalBaseHPP / (parseFloat(portions) || 1)).toLocaleString('id-ID')}
                    </div>
                  </div>
                  {/* Take Away */}
                  <div className="bg-orange-50 p-6 rounded-b-2xl border-t border-orange-100">
                    <div className="text-sm font-semibold text-orange-600 mb-1">HPP Bungkus (Take-away)</div>
                    <div className="text-4xl font-black text-orange-500">
                      Rp {Math.ceil(totalTakeawayHPP / (parseFloat(portions) || 1)).toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-t border-dashed border-orange-200 bg-orange-50/50 -mx-6 -mb-6 p-6 rounded-b-2xl mt-2">
                  <div className="text-sm font-semibold text-slate-500 mb-1">Total HPP / Porsi</div>
                  <div className="text-4xl font-black text-orange-500">
                    Rp {Math.ceil(totalBaseHPP / (parseFloat(portions) || 1)).toLocaleString('id-ID')}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
        </div>
      )}

      <PremiumModal 
        isOpen={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)}
        onUpgrade={() => {}} // Usually handled in dashboard or profile
      />

      {/* AdSense Interstitial Modal (Simulasi) */}
      {showAdModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-center relative">
            <div className="p-2 bg-slate-100 flex justify-between items-center text-xs text-slate-500 border-b border-slate-200">
              <span>Sponsor Ads</span>
              <span>{adCountdown > 0 ? `Menyimpan dalam ${adCountdown}...` : 'Menyimpan...'}</span>
            </div>
            
            <div className="p-6">
              <h3 className="font-bold text-slate-800 mb-4">Sedang Menyimpan Resep...</h3>
              <AdSenseSpace format="rectangle" />
              
              <div className="mt-6 text-sm text-slate-500">
                <p className="mb-2">Dukung kami dengan melihat sponsor sejenak.</p>
                {adCountdown > 0 ? (
                  <button disabled className="btn bg-slate-200 text-slate-400 py-2 px-6 rounded-full w-full cursor-not-allowed">
                    Tunggu {adCountdown} detik
                  </button>
                ) : (
                  <button disabled className="btn btn-primary py-2 px-6 rounded-full w-full opacity-70">
                    <Loader2 size={16} className="inline animate-spin mr-2" />
                    Menyimpan...
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Recipe Ad Modal (Watch 3 Ads) */}
      {showDeleteAdModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-center relative">
            <div className="absolute top-3 right-3">
              <button 
                onClick={() => {
                  setShowDeleteAdModal(false);
                  setIsWatchingDeleteAd(false);
                }} 
                className="text-slate-400 hover:text-slate-600 p-1 bg-slate-100 rounded-full"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-2 bg-red-50 flex justify-center items-center text-xs text-red-600 font-bold border-b border-red-100">
              <AlertTriangle size={14} className="mr-1" />
              Akses Hapus Resep Terkunci
            </div>
            
            <div className="p-6">
              {!isWatchingDeleteAd ? (
                <>
                  <h3 className="font-bold text-slate-800 mb-2">Tonton 3 Sponsor Untuk Menghapus</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Akun Free memerlukan interaksi sponsor untuk menghapus resep. <br/>
                    <strong>Progress: {deleteAdProgress} / 3 Sponsor</strong>
                  </p>
                  
                  {deleteAdProgress < 3 ? (
                    <button 
                      onClick={() => {
                        setIsWatchingDeleteAd(true);
                        setAdCountdown(4);
                      }}
                      className="btn btn-primary py-2 px-6 rounded-full w-full mb-3"
                    >
                      Tonton Sponsor ({deleteAdProgress + 1}/3)
                    </button>
                  ) : (
                    <button 
                      onClick={async () => {
                        await executeDeleteProject(projectToDelete);
                        setShowDeleteAdModal(false);
                        setDeleteAdProgress(0);
                      }}
                      className="btn bg-red-500 hover:bg-red-600 text-white py-2 px-6 rounded-full w-full mb-3"
                    >
                      Buka Kunci & Hapus Resep
                    </button>
                  )}
                  
                  <button onClick={() => triggerPaywall("Hapus resep tanpa batas dan tanpa nunggu iklan! Upgrade ke Premium sekarang.")} className="text-xs text-orange-500 font-bold hover:underline">
                    Atau upgrade ke Premium (Tanpa Iklan)
                  </button>
                </>
              ) : (
                <>
                  <h3 className="font-bold text-slate-800 mb-4">Menampilkan Sponsor...</h3>
                  <AdSenseSpace format="rectangle" />
                  <div className="mt-6 text-sm text-slate-500">
                    <button disabled className="btn bg-slate-200 text-slate-400 py-2 px-6 rounded-full w-full cursor-not-allowed">
                      Iklan selesai dalam {adCountdown}...
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
