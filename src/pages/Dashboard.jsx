import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, BookOpen, TrendingUp, Sparkles, Package, HelpCircle, Trash2, Loader2, Lock, Store, ArrowRight, X, Wallet } from 'lucide-react';
import { collection, query, where, getDocs, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import OnboardingModal from '../components/OnboardingModal';
import BackgroundDecoration from '../components/BackgroundDecoration';
import AdSenseSpace from '../components/AdSenseSpace';

// Shared Conversion Logic
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

const calculateCostHelper = (item, invItem, portions = 1, defaultUsage = 'total_resep') => {
  if (!invItem || !item.useQty || !item.useUnit) return 0;
  let rate = getConversionRate(invItem.unit, item.useUnit);
  if (rate === 0) return 0;
  const qtyBought = invItem.qty || 1;
  const pricePerBaseUnit = invItem.price / qtyBought;
  let qtyInBuyUnit = item.useUnit === 'Secukupnya' ? rate : parseFloat(item.useQty) / rate;
  
  const usage = item.usageType || defaultUsage;
  if (usage === 'per_porsi') {
    qtyInBuyUnit = qtyInBuyUnit * (parseFloat(portions) || 1);
  }
  
  return qtyInBuyUnit * pricePerBaseUnit;
};

export default function Dashboard({ user, subscription, triggerPaywall }) {
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const isPremium = subscription !== 'free';

  // Modals state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        // 1. Fetch or Create User Profile
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData(data);
          
          if (!data.shopName) {
            setShowOnboarding(true);
          }
        } else {
          const newUser = {
            email: user.email,
            displayName: user.displayName,
            isPremium: false,
            shopName: '',
            createdAt: new Date().toISOString()
          };
          await setDoc(userRef, newUser);
          setUserData(newUser);
          setShowOnboarding(true);
        }

        // 2. Fetch HPP Projects
        const q = query(collection(db, 'hpp_projects'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const data = [];
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() });
        });
        
        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setProjects(data);

        // 3. Fetch Inventory (needed for Recipe Detail Modal)
        const qInv = query(collection(db, 'inventory'), where('userId', '==', user.uid));
        const invSnapshot = await getDocs(qInv);
        const invData = [];
        invSnapshot.forEach((doc) => {
          invData.push({ id: doc.id, ...doc.data() });
        });
        setInventory(invData);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleSaveOnboarding = async (data) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const updateData = typeof data === 'string' ? { shopName: data } : data;
      await setDoc(userRef, updateData, { merge: true });
      setUserData({ ...userData, ...updateData });
      setShowOnboarding(false);
      
      // Upsell instantly after onboarding
      if (subscription === 'free') {
        setTimeout(() => triggerPaywall("Nikmati akses tanpa batas untuk semua fitur kalkulator HPP & Laba Rugi!"), 500);
      }
    } catch (error) {
      console.error("Error saving onboarding data:", error);
    }
  };

  const menuUtama = projects.filter(p => p.recipeType !== 'pendamping');
  const menuPendamping = projects.filter(p => p.recipeType === 'pendamping');

  const handleCreateRecipe = () => {
    navigate('/hpp');
  };

  const handleDeleteRecipe = async (id) => {
    if (subscription === 'free') {
      alert("Untuk menghapus resep di akun Free, silakan masuk ke menu Resep (HPP) dan ikuti instruksi hapus (Tonton Iklan).");
      return;
    }
    if (window.confirm("Yakin ingin menghapus resep ini?")) {
      try {
        await deleteDoc(doc(db, 'hpp_projects', id));
        setProjects(projects.filter(p => p.id !== id));
      } catch (error) {
        console.error("Error deleting:", error);
      }
    }
  };

  const simulateUpgrade = async () => {
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { isPremium: true }, { merge: true });
      alert("Upgrade Berhasil! Silakan refresh aplikasi.");
    } catch (error) {
      console.error("Error upgrading:", error);
    }
  };

  const renderProjectCard = (project, colorClass) => (
    <div 
      key={project.id} 
      onClick={() => setSelectedProject(project)}
      className="cursor-pointer bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group relative overflow-hidden"
    >
      <div className={`absolute top-0 left-0 w-1.5 h-full ${colorClass}`}></div>
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-bold text-lg text-slate-800">{project.menuName}</h4>
          <div className="text-xs text-slate-400 mt-1">Dibuat: {new Date(project.createdAt).toLocaleDateString('id-ID')} • {project.portions || 1} Porsi</div>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteRecipe(project.id);
          }}
          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors relative z-10"
          title="Hapus Menu"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="mt-6 flex justify-between items-end">
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Modal / Porsi</div>
          <div className="font-black text-xl text-slate-800">
            Rp {Math.ceil(project.hppPerPortion || (project.totalHPP / (project.portions || 1))).toLocaleString('id-ID')}
          </div>
        </div>
      </div>
    </div>
  );

  const shopNameDisplay = userData?.shopName || 'Bisnis Kuliner';
  const ownerNameDisplay = userData?.ownerName || user?.displayName?.split(' ')[0] || 'Juragan';

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 relative">
      <BackgroundDecoration theme="dashboard" />
      
      <OnboardingModal 
        isOpen={showOnboarding}
        onSubmit={handleSaveOnboarding}
      />

      {/* Greeting Section */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-600 mb-3">
            <Store size={20} className="text-orange-500" /> {shopNameDisplay}
          </div>
          <h1 className="text-4xl font-black text-slate-800 mb-2">
            Halo {ownerNameDisplay}, Owner {shopNameDisplay}!
          </h1>
          <p className="text-slate-500 text-lg">Kelola HPP dan operasional bisnismu di sini.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {isPremium ? (
            <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2">
              <Sparkles size={18} /> Premium Member
            </div>
          ) : (
            <button 
              onClick={() => triggerPaywall("Upgrade akun Anda untuk membuka semua fitur tak terbatas!")}
              className="bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-amber-400 px-5 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 transition-all transform hover:scale-105 active:scale-95"
            >
              <Lock size={16} className="text-amber-400/80" /> Beli Premium (Rp 3.000/Hari)
            </button>
          )}
        </div>
      </div>

      {subscription === 'free' && <AdSenseSpace format="banner" />}

      {/* Menu Cards (Clean SaaS Look) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div 
          onClick={() => navigate('/gudang')}
          className="group cursor-pointer bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all duration-300 transform hover:-translate-y-1 flex flex-col"
        >
          <div className="w-14 h-14 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center mb-6 border border-slate-100 shrink-0">
            <Package size={28} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-3">Belanja Dapur</h3>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed flex-1">
            Catat dan kelola harga bahan baku (beras, ayam, bumbu) sebagai dasar perhitungan resep Anda.
          </p>
          <div className="text-slate-800 font-bold text-sm group-hover:gap-2 transition-all gap-1 flex items-center">
            Mulai Belanja <ArrowRight size={16} />
          </div>
        </div>

        <div 
          onClick={handleCreateRecipe}
          className="group cursor-pointer bg-white rounded-3xl p-8 border border-orange-100 shadow-md shadow-orange-500/5 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden flex flex-col"
        >
          <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mb-6 border border-orange-100 shrink-0">
            <Calculator size={28} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-3">Resep (HPP)</h3>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed flex-1">
            Racik menu baru mengambil bahan dari dapur dan ketahui Modal Murni (HPP) per porsi.
          </p>
          <div className="font-bold text-sm flex items-center gap-1 w-fit">
            {(!isPremium && menuUtama.length >= 2 && menuPendamping.length >= 2) ? 
              <span className="text-slate-500 flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">Buka Daftar Resep <ArrowRight size={16}/></span> : 
              <span className="text-orange-500 flex items-center gap-1 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100"><Sparkles size={16} /> Racik Sekarang</span>
            }
          </div>
        </div>

        <div 
          onClick={() => {
            if (subscription === 'free') {
              triggerPaywall("Buka fitur Operasional & Simulator Laba Rugi buat tentuin harga jual paling cuan. Mulai dari Rp 3.000 aja!");
            } else {
              navigate('/operasional');
            }
          }}
          className="group cursor-pointer bg-white rounded-3xl p-8 border border-blue-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1 flex flex-col"
        >
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 border border-blue-100 shrink-0">
            <Wallet size={28} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-3">Operasional</h3>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed flex-1">
            Catat Biaya Tetap (Sewa, Gaji) dan Penyusutan untuk menghitung beban per porsi.
          </p>
          <div className="text-blue-600 font-bold text-sm group-hover:gap-2 transition-all gap-1 flex items-center">
            Atur Biaya <ArrowRight size={16} />
          </div>
        </div>

        <div 
          onClick={() => {
            if (subscription === 'free') {
              triggerPaywall("Eits, Modal HPP aja belum cukup! Buka Simulator Laba Rugi & Smart Pricing buat tentuin harga jual paling cuan. Mulai dari Rp 3.000 aja!");
            } else {
              navigate('/laba-rugi');
            }
          }}
          className="group cursor-pointer bg-white rounded-3xl p-8 border border-green-100 shadow-sm hover:shadow-xl hover:border-green-200 transition-all duration-300 transform hover:-translate-y-1 flex flex-col"
        >
          <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6 border border-green-100 shrink-0">
            <TrendingUp size={28} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-3">Laba Rugi</h3>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed flex-1">
            Simulasikan harga jual dan keuntungan (Margin) untuk makan di tempat dan pesanan aplikasi online.
          </p>
          <div className="text-green-600 font-bold text-sm group-hover:gap-2 transition-all gap-1 flex items-center">
            Simulasi <ArrowRight size={16} />
          </div>
        </div>

        <div 
          onClick={() => navigate('/panduan')}
          className="group cursor-pointer bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all duration-300 transform hover:-translate-y-1 flex flex-col"
        >
          <div className="w-14 h-14 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center mb-6 border border-slate-100">
            <HelpCircle size={28} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-3">Panduan Pakai</h3>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            Bingung cara pakainya? Baca instruksi 2 langkah mudah untuk mulai menghitung HPP.
          </p>
          <div className="text-slate-800 font-bold text-sm group-hover:gap-2 transition-all gap-1 flex items-center">
            Baca Panduan <ArrowRight size={16} />
          </div>
        </div>
      </div>

      {/* Saved Projects */}
      <div className="mb-12">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Daftar Menu Anda</h2>
          <span className="text-sm font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
            {projects.length} {isPremium ? 'Menu Tersimpan' : 'Resep'}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-orange-500" size={32}/></div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-3xl">
            <Calculator size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 font-medium mb-2">Belum ada resep yang dibuat.</p>
            <button onClick={handleCreateRecipe} className="text-orange-500 font-bold hover:underline">Buat Resep Pertama</button>
          </div>
        ) : (
          <div className="space-y-8">
            {menuUtama.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  Menu Utama 
                  <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{menuUtama.length} {isPremium ? '' : '/ 2'}</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {menuUtama.map(project => renderProjectCard(project, 'bg-orange-500'))}
                </div>
              </div>
            )}
            
            {menuPendamping.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  Menu Pendamping
                  <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{menuPendamping.length} {isPremium ? '' : '/ 2'}</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {menuPendamping.map(project => renderProjectCard(project, 'bg-blue-500'))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Coming Soon */}
      <div className="mt-16 pt-16 border-t border-slate-200 relative z-10">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Fitur Mendatang (Buku Kas & POS)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 opacity-60 grayscale-[80%] pointer-events-none shadow-sm">
            <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center mb-4">
              <BookOpen size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">Buku Kas Harian</h3>
            <p className="text-slate-500 text-sm">Catat setiap pemasukan dan pengeluaran harian. Pantau arus kas warung secara real-time.</p>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-slate-100 opacity-60 grayscale-[80%] pointer-events-none shadow-sm">
            <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center mb-4">
              <Calculator size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">Sistem Kasir (POS)</h3>
            <p className="text-slate-500 text-sm">Kelola pesanan pelanggan, cetak struk otomatis, dan terhubung langsung dengan resep dan stok dapur.</p>
          </div>
        </div>
      </div>
      {/* Recipe Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedProject(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{selectedProject.menuName}</h3>
                <p className="text-sm text-slate-500 mt-1">{selectedProject.portions || 1} Porsi</p>
              </div>
              <button onClick={() => setSelectedProject(null)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg p-2 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 bg-slate-50/50">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Rincian HPP per Porsi</h4>
              <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2">
                {/* Bahan Utama */}
                <div>
                  {(selectedProject.recipeType === 'utama') && <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Bahan Utama</h5>}
                  {selectedProject.recipeItems && selectedProject.recipeItems.length > 0 ? (
                    selectedProject.recipeItems.map(item => {
                      const invItem = inventory.find(i => i.id === item.inventoryId);
                      if (!invItem) return null;
                      const cost = calculateCostHelper(item, invItem, selectedProject.portions);
                      const costPerPortion = cost / (parseFloat(selectedProject.portions) || 1);
                      return (
                        <div key={item.id} className="flex justify-between items-center text-sm border-b border-slate-100 pb-1 mb-1">
                          <span className="text-slate-600 capitalize">{invItem.name}</span>
                          <span className="font-medium text-slate-800">Rp {Math.ceil(costPerPortion).toLocaleString('id-ID')}</span>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-sm text-slate-500 italic">Detail bahan tidak tersedia.</div>
                  )}
                </div>

                {/* Pendamping */}
                {selectedProject.recipeType === 'utama' && selectedProject.companionItems && selectedProject.companionItems.length > 0 && (
                  <div>
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-3">Menu Pendamping</h5>
                    {selectedProject.companionItems.map(item => {
                      const compProject = projects.find(p => p.id === item.projectId);
                      if (!compProject) return null;
                      let useQty = parseFloat(item.usePortions);
                      const usage = item.usageType || 'per_porsi';
                      if (usage === 'per_porsi') {
                        useQty = useQty * (parseFloat(selectedProject.portions) || 1);
                      }
                      const totalCompanionCost = useQty * (compProject.hppPerPortion || (compProject.totalHPP / (compProject.portions || 1)));
                      const costPerPortion = totalCompanionCost / (parseFloat(selectedProject.portions) || 1);
                      return (
                        <div key={item.id} className="flex justify-between items-center text-sm border-b border-slate-100 pb-1 mb-1">
                          <span className="text-slate-600 capitalize">{compProject.menuName}</span>
                          <span className="font-medium text-slate-800">Rp {Math.ceil(costPerPortion).toLocaleString('id-ID')}</span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Kemasan */}
                {selectedProject.recipeType === 'utama' && selectedProject.packagingItems && selectedProject.packagingItems.length > 0 && (
                  <div>
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-3">Kemasan & Pelengkap</h5>
                    {selectedProject.packagingItems.map(item => {
                      const invItem = inventory.find(i => i.id === item.inventoryId);
                      if (!invItem) return null;
                      const cost = calculateCostHelper(item, invItem, selectedProject.portions, 'per_porsi');
                      const costPerPortion = cost / (parseFloat(selectedProject.portions) || 1);
                      return (
                        <div key={item.id} className="flex justify-between items-center text-sm border-b border-slate-100 pb-1 mb-1">
                          <span className="text-slate-600 capitalize">{invItem.name}</span>
                          <span className="font-medium text-slate-800">Rp {Math.ceil(costPerPortion).toLocaleString('id-ID')}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              
              {selectedProject.recipeType === 'utama' ? (
                <div className="-mx-6 -mb-6 mt-4">
                  <div className="bg-slate-100 p-6 border-t border-slate-200">
                    <div className="text-xs font-semibold text-slate-500 mb-1">HPP Makan di Tempat</div>
                    <div className="text-xl font-black text-slate-700">
                      Rp {Math.ceil((selectedProject.totalBaseHPP || selectedProject.totalHPP) / (parseFloat(selectedProject.portions) || 1)).toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div className="bg-orange-50 p-6 rounded-b-2xl border-t border-orange-100">
                    <div className="text-xs font-semibold text-orange-600 mb-1">HPP Bungkus (Take-away)</div>
                    <div className="text-3xl font-black text-orange-500">
                      Rp {Math.ceil((selectedProject.totalTakeawayHPP || selectedProject.totalHPP) / (parseFloat(selectedProject.portions) || 1)).toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-t border-dashed border-orange-200 bg-orange-50 -mx-6 -mb-6 p-6 rounded-b-2xl mt-4">
                  <div className="text-sm font-semibold text-slate-500 mb-1">Total HPP / Porsi</div>
                  <div className="text-4xl font-black text-orange-500">
                    Rp {Math.ceil(selectedProject.hppPerPortion || (selectedProject.totalHPP / (selectedProject.portions || 1))).toLocaleString('id-ID')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
