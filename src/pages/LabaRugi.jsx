import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowLeft, Loader2, Calculator, TrendingUp, TrendingDown, DollarSign, Store, ShoppingBag, Sparkles, BrainCircuit, Target, ShieldCheck, AlertTriangle, Trash2, Plus, FileText, Lock, Save, Building2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { generateRecipePDF } from '../utils/pdfExport';
import BackgroundDecoration from '../components/BackgroundDecoration';

export default function LabaRugi({ user, subscription, triggerPaywall }) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [operationalCosts, setOperationalCosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [inventory, setInventory] = useState([]);
  
  const [selectedProjectId, setSelectedProjectId] = useState('');
  
  // Simulator State
  const [bufferHabisPakai, setBufferHabisPakai] = useState(0);
  const [activeTab, setActiveTab] = useState('per-menu'); // 'per-menu', 'global'

  // Simulator State (Per Menu)
  const [targetSalesDay, setTargetSalesDay] = useState(33); // default ~1000/mo
  const [marginDineIn, setMarginDineIn] = useState(50);
  const [potonganOjol, setPotonganOjol] = useState(20);

  // App-level overhead setting
  const [hpMode, setHpMode] = useState('detail');
  const [hpBudget, setHpBudget] = useState(0);

  // New Global State: Menu Settings
  const [menuSettings, setMenuSettings] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const qInv = query(collection(db, 'inventory'), where('userId', '==', user.uid));
        const snapInv = await getDocs(qInv);
        const invData = [];
        snapInv.forEach((doc) => invData.push({ id: doc.id, ...doc.data() }));
        setInventory(invData);

        const qProj = query(collection(db, 'hpp_projects'), where('userId', '==', user.uid));
        const snapProj = await getDocs(qProj);
        const projData = [];
        snapProj.forEach((doc) => {
          projData.push({ id: doc.id, ...doc.data() });
        });
        setProjects(projData);

        const qOp = query(collection(db, 'operational_costs'), where('userId', '==', user.uid));
        const snapOp = await getDocs(qOp);
        const opData = [];
        snapOp.forEach((doc) => {
          opData.push({ id: doc.id, ...doc.data() });
        });
        setOperationalCosts(opData);

        const qSet = query(collection(db, 'operational_settings'), where('userId', '==', user.uid));
        const snapSet = await getDocs(qSet);
        if (!snapSet.empty) {
          const setting = snapSet.docs[0].data();
          setHpMode(setting.hpMode || 'detail');
          setHpBudget(setting.hpBudget || 0);
          setBufferHabisPakai(setting.hpPercentage || 0);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // Initialize menu settings only once when projects load
  useEffect(() => {
    if (projects.length > 0 && Object.keys(menuSettings).length === 0) {
      const initial = {};
      projects.filter(p => (p.recipeType || 'utama') === 'utama').forEach(p => {
        initial[p.id] = {
          targetSalesDay: 20,
          margin: 100, // 100% markup
          takeawayRatio: 30 // 30% takeaway
        };
      });
      setMenuSettings(initial);
    }
  }, [projects]); // Removed menuSettings from deps to prevent infinite loops

  const handleUpdateSetting = (id, field, value) => {
    setMenuSettings(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: parseFloat(value) || 0
      }
    }));
  };

  // Smart Pricing State & Logic
  const [spProjectId, setSpProjectId] = useState('');
  const [spSalesType, setSpSalesType] = useState('takeaway');
  const [competitors, setCompetitors] = useState([
    { 
      id: 1, 
      name: '', 
      price: '', 
      utama: { name: '', porsi: '' },
      pendamping: [] 
    }
  ]);
  const [spResult, setSpResult] = useState(null);

  const handleAddCompetitor = () => {
    setCompetitors([...competitors, { 
      id: Date.now(), 
      name: ``, 
      price: '', 
      utama: { name: '', porsi: '' },
      pendamping: [] 
    }]);
  };
  
  const handleRemoveCompetitor = (id) => {
    setCompetitors(competitors.filter(c => c.id !== id));
  };
  
  const handleCompetitorChange = (id, field, value) => {
    setCompetitors(competitors.map(c => c.id === id ? { ...c, [field]: value } : c));
  };
  
  const handleUtamaChange = (compId, field, value) => {
    setCompetitors(competitors.map(c => c.id === compId ? { ...c, utama: { ...c.utama, [field]: value } } : c));
  };

  const handleAddPendamping = (compId) => {
    setCompetitors(competitors.map(c => c.id === compId ? { ...c, pendamping: [...c.pendamping, { id: Date.now(), name: '', porsi: '' }] } : c));
  };

  const handleRemovePendamping = (compId, pId) => {
    setCompetitors(competitors.map(c => c.id === compId ? { ...c, pendamping: c.pendamping.filter(p => p.id !== pId) } : c));
  };

  const handlePendampingChange = (compId, pId, field, value) => {
    setCompetitors(competitors.map(c => c.id === compId ? { ...c, pendamping: c.pendamping.map(p => p.id === pId ? { ...p, [field]: value } : p) } : c));
  };
  
  const handlePriceInput = (id, val) => {
    const raw = val.replace(/\D/g, '');
    const formatted = raw ? parseInt(raw, 10).toLocaleString('id-ID') : '';
    handleCompetitorChange(id, 'price', formatted);
  };

  const runSmartPricing = () => {
    const proj = projects.find(p => p.id === spProjectId);
    if (!proj) return;

    const validComps = competitors.filter(c => c.price && parseInt(c.price.replace(/\D/g, ''), 10) > 0);
    if (validComps.length === 0) return;

    const portions = parseFloat(proj.portions) || 1;
    const mHppDineIn = (proj.totalBaseHPP || 0) / portions;
    const mHppTakeaway = (proj.totalTakeawayHPP || 0) / portions;
    
    // hitung beban per porsi (TIDAK DIPAKAI DI SMART PRICING SESUAI REQUEST USER)
    const baseModal = spSalesType === 'takeaway' ? mHppTakeaway : mHppDineIn;
    const modalTotal = Math.ceil(baseModal);

    // Hitung Normalized Price
    let totalRawPrice = 0;

    validComps.forEach(c => {
      const rawPrice = parseInt(c.price.replace(/\D/g, ''), 10);
      totalRawPrice += rawPrice;
    });

    const avgRawComp = Math.ceil(totalRawPrice / validComps.length);

    const modalRatio = modalTotal / avgRawComp;
    let insight = "";
    let advice = "";
    let status = "warning";

    if (modalRatio <= 0.4) {
      status = "success";
      insight = "Peluang Emas! Modal HPP lu sangat rendah dibanding rata-rata pasar.";
      advice = "Lu punya ruang besar untuk mainin diskon, atau jual di bawah harga pasar tapi tetep untung tebel (>60%). Pastikan porsi lu sesuai standar pasar.";
    } else if (modalRatio <= 0.65) {
      status = "warning";
      insight = "Aman & Standar. Modal HPP lu ideal untuk bertarung di harga pasar.";
      advice = "Jual di harga rata-rata pesaing. Cek detail komponen pesaing di atas, dan pastikan rasa serta kelengkapan lu lebih unggul buat menangin pelanggan.";
    } else {
      status = "danger";
      insight = "Hati-hati! Modal HPP lu terlalu mepet dengan harga jual pesaing di pasaran.";
      advice = "Kalau dipaksa jual seharga pesaing, untung lu terlalu tipis. Coba cek catatan komponen pesaing lu, kalau mereka pakai bahan mahal/banyak, wajar. Kalau lu mau saingan, cari supplier bahan baku lebih murah, perkecil porsi, atau rebranding jadi produk Premium.";
    }

    let penetrasi = Math.ceil(avgRawComp * 0.9);
    if (penetrasi <= modalTotal * 1.15) penetrasi = Math.ceil(modalTotal * 1.15); // min 15% margin
    const kompetitif = avgRawComp;
    const premium = Math.ceil(avgRawComp * 1.15);

    setSpResult({
      menuName: proj.menuName,
      modalTotal,
      avgComp: avgRawComp, 
      status,
      insight,
      advice,
      options: { penetrasi, kompetitif, premium },
      competitorsSnapshot: validComps,
      salesType: spSalesType
    });
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  
  // Calculate Base Costs
  let hppDineIn = 0;
  let hppTakeaway = 0;
  
  if (selectedProject) {
    if (selectedProject.recipeType === 'utama') {
      hppDineIn = (selectedProject.totalBaseHPP || 0) / (parseFloat(selectedProject.portions) || 1);
      hppTakeaway = (selectedProject.totalTakeawayHPP || 0) / (parseFloat(selectedProject.portions) || 1);
    } else {
      hppDineIn = (selectedProject.totalHPP || 0) / (parseFloat(selectedProject.portions) || 1);
      hppTakeaway = hppDineIn; // Pendamping typically doesn't have packaging in its own calculator
    }
  }

  // Calculate Overhead & Buffers
  let sumVariabelNominal = 0;
  if (hpMode === 'detail') {
    sumVariabelNominal = operationalCosts.filter(i => i.category === 'Variabel').reduce((acc, curr) => acc + curr.amount, 0);
  } else if (hpMode === 'budget') {
    sumVariabelNominal = hpBudget;
  }
  const sumTetap = operationalCosts.filter(i => i.category === 'Biaya Tetap').reduce((acc, curr) => acc + curr.amount, 0);
  const sumPenyusutan = operationalCosts.filter(i => i.category === 'Penyusutan').reduce((acc, curr) => acc + curr.amount, 0);
  
  const targetSalesMonth = (parseInt(targetSalesDay, 10) || 0) * 30;
  const totalBebanBulanan = sumTetap + sumVariabelNominal + sumPenyusutan;
  const bebanPerPorsi = targetSalesMonth > 0 ? totalBebanBulanan / targetSalesMonth : 0;
  
  // Apply Buffer only if mode is percentage
  const effectiveBuffer = hpMode === 'percentage' ? bufferHabisPakai : 0;
  
  const modalDineIn = Math.ceil(hppDineIn + (hppDineIn * (effectiveBuffer / 100)) + bebanPerPorsi);
  const modalTakeaway = Math.ceil(hppTakeaway + (hppTakeaway * (effectiveBuffer / 100)) + bebanPerPorsi);

  // --- UNIFIED PRICING MATH ---
  // Harga jual dasar dihitung dari modal Dine-In + Target Keuntungan
  const untungTarget = Math.ceil(modalDineIn * (marginDineIn / 100));
  const hargaJualDasar = modalDineIn + untungTarget;

  // 1. Dine-In
  const untungPorsiDineIn = hargaJualDasar - modalDineIn;
  const untungBulanDineIn = untungPorsiDineIn * targetSalesMonth;

  // 2. Takeaway (Harga Jual sama, Modal lebih besar karena kemasan)
  const untungPorsiTakeaway = hargaJualDasar - modalTakeaway;
  const untungBulanTakeaway = untungPorsiTakeaway * targetSalesMonth;

  // 3. Online (Harga Jual dinaikkan agar setelah dipotong aplikasi, hasil netnya = Harga Jual Dasar)
  const safePotongan = potonganOjol >= 100 ? 99 : (potonganOjol || 0);
  const hargaJualOnline = Math.ceil(hargaJualDasar / (1 - (safePotongan / 100)));
  const potonganRpOnline = Math.ceil(hargaJualOnline * (safePotongan / 100));
  const netOnline = hargaJualOnline - potonganRpOnline;
  const untungPorsiOnline = netOnline - modalTakeaway;
  const untungBulanOnline = untungPorsiOnline * targetSalesMonth;


  // --- LIVE CALCULATIONS (GLOBAL) ---
  const utamaProjects = projects.filter(p => (p.recipeType || 'utama') === 'utama');

  let dailyRevenue = 0;
  let dailyCOGS = 0;
  let dailyVariableBuffer = 0;
  let totalDailySalesQty = 0;

  const menuStats = utamaProjects.map(p => {
    const s = menuSettings[p.id] || { targetSalesDay: 0, margin: 0, takeawayRatio: 0 };
    const portions = parseFloat(p.portions) || 1;
    const mHppDineIn = (p.totalBaseHPP || 0) / portions;
    const mHppTakeaway = (p.totalTakeawayHPP || 0) / portions;

    const qtyTakeaway = s.targetSalesDay * (s.takeawayRatio / 100);
    const qtyDineIn = s.targetSalesDay - qtyTakeaway;

    // Harga Jual Dasar is based on Dine-In COGS + Markup Margin
    const mUntungTarget = mHppDineIn * (s.margin / 100);
    const mHargaJualDasar = Math.ceil(mHppDineIn + mUntungTarget);

    // Online price markup
    const mHargaJualOnline = Math.ceil(mHargaJualDasar / (1 - (safePotongan / 100)));

    const menuRevenue = s.targetSalesDay * mHargaJualDasar;
    const menuCogs = (qtyDineIn * mHppDineIn) + (qtyTakeaway * mHppTakeaway);
    const menuGrossProfit = menuRevenue - menuCogs;

    // Buffer percentage handling (variable cost)
    const menuBuffer = hpMode === 'percentage' ? (menuCogs * (bufferHabisPakai / 100)) : 0;

    dailyRevenue += menuRevenue;
    dailyCOGS += menuCogs;
    dailyVariableBuffer += menuBuffer;
    totalDailySalesQty += s.targetSalesDay;

    return {
      id: p.id,
      name: p.menuName,
      hargaJualDasar: mHargaJualDasar,
      hargaJualOnline: mHargaJualOnline,
      menuGrossProfit,
      menuRevenue,
      menuCogs,
      hppDineIn: mHppDineIn,
      hppTakeaway: mHppTakeaway
    };
  });

  const dailyGrossProfit = dailyRevenue - dailyCOGS;
  const fixedDailyOverhead = (sumTetap + sumPenyusutan) / 30;
  const varDailyOverhead = hpMode === 'percentage' ? dailyVariableBuffer : (sumVariabelNominal / 30);
  const totalDailyOverhead = fixedDailyOverhead + varDailyOverhead;
  const dailyNetProfit = dailyGrossProfit - totalDailyOverhead;
  
  const monthlyNetProfit = dailyNetProfit * 30;
  const globalNetMargin = dailyRevenue > 0 ? (dailyNetProfit / dailyRevenue) * 100 : 0;

  if (loading) {
    return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="animate-spin text-orange-500" size={32}/></div>;
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 relative">
      <BackgroundDecoration theme="laba-rugi" />
      <div className="flex items-center justify-between mb-8">
        <div>
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-orange-500 transition-colors mb-2 text-sm font-medium">
            <ArrowLeft size={16} /> Kembali ke Dashboard
          </button>
          <div className="flex items-center gap-3">
            <TrendingUp className="text-orange-500" size={32} />
            <h1 className="text-3xl font-bold text-slate-800">Laba Rugi & Simulasi</h1>
          </div>
          <p className="text-slate-500 mt-2">Simulasikan target penjualan dan lihat proyeksi keuntungan bersih per bulan.</p>
        </div>
      </div>

      <div className="flex border-b border-slate-200 mb-8 overflow-x-auto">
        <button 
          className={`py-3 px-6 font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'per-menu' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`} 
          onClick={() => setActiveTab('per-menu')}
        >
          1. Simulasi Per Menu (Harga Jual)
        </button>
        <button 
          className={`py-3 px-6 font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'global' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`} 
          onClick={() => setActiveTab('global')}
        >
          2. Proyeksi Global (Laba Toko)
        </button>
        <button 
          className={`py-3 px-6 font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'smart-pricing' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`} 
          onClick={() => setActiveTab('smart-pricing')}
        >
          <Sparkles size={16} /> 3. Smart Pricing
        </button>
      </div>

      {activeTab === 'per-menu' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Setup */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Calculator size={18} className="text-orange-500" /> 1. Pilih Menu
            </h3>
            
            <div className="form-group mb-0">
              <label className="form-label">Menu yang sudah dihitung HPP</label>
              <select 
                className="form-select bg-slate-50"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                <option value="">-- Pilih Menu Utama --</option>
                {projects.filter(p => (p.recipeType || 'utama') === 'utama').map(p => (
                  <option key={p.id} value={p.id}>{p.menuName}</option>
                ))}
              </select>
            </div>

            {selectedProject && (
              <div className="mt-6 p-4 bg-orange-50 rounded-xl border border-orange-100 mb-6">
                <h4 className="text-xs font-bold text-orange-800 uppercase tracking-wider mb-3">Informasi HPP (Per Porsi)</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-orange-700">Modal Makan di Tempat</span>
                    <span className="font-bold text-orange-900">Rp {Math.ceil(hppDineIn).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-orange-700">Modal Bungkus/Takeaway</span>
                    <span className="font-bold text-orange-900">Rp {Math.ceil(hppTakeaway).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Operasional Form */}
          <div className="glass-card p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-500" /> 2. Target Penjualan
            </h3>

            <div className="space-y-5">
              <div className="form-group mb-0">
                <label className="form-label text-sm">Target Porsi Terjual Per Hari (Toko)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    min="1"
                    className="form-input pr-16 bg-blue-50 border-blue-200 focus:border-blue-500 focus:ring-blue-500/20"
                    value={targetSalesDay}
                    onChange={(e) => setTargetSalesDay(e.target.value)}
                  />
                  <span className="absolute right-4 top-2.5 text-slate-400 font-medium">Porsi</span>
                </div>
                <p className="text-xs mt-2 text-slate-500 font-medium">
                  Total Sebulan: <span className="font-bold text-blue-600">{targetSalesMonth} Porsi</span> (Asumsi 1 Bulan = 30 Hari)
                </p>
              </div>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-5 space-y-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-blue-700">Total Operasional / Bln</span>
                <span className="font-bold text-blue-900">Rp {totalBebanBulanan.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-blue-700">Beban Overhead / Porsi</span>
                <span className="font-black text-blue-900 bg-blue-100 px-2 rounded">Rp {Math.ceil(bebanPerPorsi).toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Simulator */}
        <div className="lg:col-span-7">
          {!selectedProject ? (
            <div className="glass-card p-12 flex flex-col items-center justify-center text-center h-full border-dashed border-2 border-slate-200 bg-slate-50/50">
              <DollarSign size={48} className="text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-600 mb-2">Mulai Simulasi</h3>
              <p className="text-slate-400 max-w-sm">Pilih menu dari daftar di sebelah kiri untuk mulai menghitung target harga jual dan profit.</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Master Price Control */}
              <div className="glass-card p-6 border-2 border-orange-200">
                <h3 className="font-bold text-orange-800 mb-4 flex items-center gap-2">
                  <TrendingUp size={18} /> 3. Penentuan Harga Jual Dasar
                </h3>
                <div className="form-group mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="form-label mb-0 text-orange-800">Target Keuntungan (Markup Modal)</label>
                    <span className="font-black text-orange-600 text-2xl">{marginDineIn}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="200" 
                    className="w-full h-2 bg-orange-100 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    value={marginDineIn}
                    onChange={(e) => setMarginDineIn(e.target.value)}
                  />
                  <p className="text-xs text-orange-600/70 mt-2">Harga Jual Dasar akan berlaku untuk Makan di Tempat & Bungkus.</p>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-xl text-center border border-orange-100">
                  <p className="text-sm font-bold text-orange-800 uppercase tracking-wider mb-1">Harga Jual Dasar Per Porsi</p>
                  <p className="text-4xl font-black text-orange-900">Rp {hargaJualDasar.toLocaleString('id-ID')}</p>
                </div>
              </div>

              {/* 3 Scenarios Summary Grid */}
              <div className="grid grid-cols-1 gap-6">
                
                {/* Dine-in Card */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                    <h4 className="font-bold text-slate-700">Makan di Tempat</h4>
                    <span className="text-sm font-bold text-slate-500">Harga: Rp {hargaJualDasar.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="p-4">
                    <div className="text-sm space-y-2 text-slate-600 mb-4">
                      <div className="flex justify-between">
                        <span>Harga Jual Dasar</span>
                        <span className="font-medium">Rp {hargaJualDasar.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-orange-600 border-b border-slate-100 pb-2">
                        <span>Total Modal (HPP + Overhead)</span>
                        <span>- Rp {modalDineIn.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between font-bold text-green-700 pt-1">
                        <span>Keuntungan / Porsi</span>
                        <span>Rp {untungPorsiDineIn.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                    <div className="bg-green-50 text-green-800 p-3 rounded-lg text-center">
                      <p className="text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Proyeksi Untung Sebulan</p>
                      <p className="text-xl font-black">Rp {untungBulanDineIn.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                </div>

                {/* Takeaway Card */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <div className="bg-orange-50 px-4 py-3 border-b border-orange-100 flex justify-between items-center">
                    <h4 className="font-bold text-orange-800">Bungkus (Takeaway)</h4>
                    <span className="text-sm font-bold text-orange-700">Harga: Rp {hargaJualDasar.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="p-4">
                    <div className="text-sm space-y-2 text-slate-600 mb-4">
                      <div className="flex justify-between">
                        <span>Harga Jual Dasar</span>
                        <span className="font-medium">Rp {hargaJualDasar.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-orange-600 border-b border-slate-100 pb-2">
                        <span>Total Modal (Termasuk Kemasan)</span>
                        <span>- Rp {modalTakeaway.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between font-bold text-green-700 pt-1">
                        <span>Keuntungan / Porsi</span>
                        <span>Rp {untungPorsiTakeaway.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                    <div className="bg-green-50 text-green-800 p-3 rounded-lg text-center">
                      <p className="text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Proyeksi Untung Sebulan</p>
                      <p className="text-xl font-black">Rp {untungBulanTakeaway.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                </div>

                {/* Aplikasi Online Card */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <div className="bg-green-600 px-4 py-3 border-b border-green-700 flex justify-between items-center text-white">
                    <h4 className="font-bold">Aplikasi Online</h4>
                    <span className="text-sm font-bold">Harga: Rp {hargaJualOnline.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-4 bg-green-50 p-3 rounded-lg border border-green-100">
                      <label className="text-sm font-bold text-green-800 whitespace-nowrap">Potongan Aplikasi:</label>
                      <div className="relative w-full">
                        <input 
                          type="number" 
                          className="w-full bg-white border border-green-200 rounded px-3 py-1 text-sm focus:outline-none focus:border-green-500"
                          value={potonganOjol}
                          onChange={(e) => setPotonganOjol(e.target.value)}
                        />
                        <span className="absolute right-3 top-1 text-green-600 font-bold">%</span>
                      </div>
                    </div>

                    <div className="text-sm space-y-2 text-slate-600 mb-4">
                      <div className="flex justify-between text-slate-500">
                        <span>Harga Jual Dasar</span>
                        <span>Rp {hargaJualDasar.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-green-600 font-medium">
                        <span>Harga Jual Aplikasi (Markup otomatis)</span>
                        <span>Rp {hargaJualOnline.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-red-500">
                        <span>Kena Potongan Aplikasi</span>
                        <span>- Rp {potonganRpOnline.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-100 pt-2 font-medium">
                        <span>Uang Diterima (Net)</span>
                        <span>Rp {netOnline.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-orange-600 border-b border-slate-100 pb-2">
                        <span>Total Modal (Termasuk Kemasan)</span>
                        <span>- Rp {modalTakeaway.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between font-bold text-green-700 pt-1">
                        <span>Keuntungan / Porsi</span>
                        <span>Rp {untungPorsiOnline.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                    <div className="bg-green-50 text-green-800 p-3 rounded-lg text-center">
                      <p className="text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Proyeksi Untung Sebulan</p>
                      <p className="text-xl font-black">Rp {untungBulanOnline.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>
      </div>
      )}

      {activeTab === 'global' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Kolom Kiri: Pengaturan Menu */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex gap-3 text-orange-800">
              <div className="mt-0.5">
                <Store size={20} className="text-orange-500" />
              </div>
              <div className="text-sm">
                <p className="font-bold mb-1">Simulasi Laba Toko Keseluruhan</p>
                <p className="text-orange-700">Sewa tempat & gaji karyawan ditanggung oleh <b>semua menu yang terjual</b> setiap hari. Atur target jualan Anda di bawah untuk melihat potensi untung harian dan bulanan toko Anda secara menyeluruh!</p>
              </div>
            </div>

            <div className="glass-card p-6 border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <ShoppingBag size={18} className="text-orange-500" /> Potongan Aplikasi Online (Ojol)
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex-1 max-w-[200px] relative">
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-800 focus:outline-none focus:border-orange-500 pr-8"
                    value={potonganOjol}
                    onChange={(e) => setPotonganOjol(e.target.value)}
                  />
                  <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
                </div>
                <p className="text-sm text-slate-500">Ini akan merubah markup harga online di semua menu otomatis.</p>
              </div>
            </div>

            {utamaProjects.length === 0 ? (
               <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                  <p className="text-slate-500 font-medium">Belum ada menu utama untuk disimulasikan.</p>
               </div>
            ) : utamaProjects.map(project => {
              const s = menuSettings[project.id];
              if (!s) return null;
              const stats = menuStats.find(m => m.id === project.id);

              const untungDineIn = stats.hargaJualDasar - stats.hppDineIn;
              const marginDineIn = stats.hargaJualDasar > 0 ? (untungDineIn / stats.hargaJualDasar) * 100 : 0;
              const untungTakeaway = stats.hargaJualDasar - stats.hppTakeaway;
              const marginTakeaway = stats.hargaJualDasar > 0 ? (untungTakeaway / stats.hargaJualDasar) * 100 : 0;

              return (
                <div key={project.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 text-lg">{project.menuName}</h3>
                    <button 
                      onClick={() => {
                        if (subscription !== 'mingguan') {
                          triggerPaywall("Fitur Cetak Laporan PDF Eksklusif untuk Paket Mingguan! Upgrade sekarang buat dapetin laporan komplit untuk usahamu.");
                        } else {
                          generateRecipePDF(project, stats, inventory, projects, potonganOjol);
                        }
                      }}
                      className="flex items-center gap-2 bg-white text-orange-600 border border-orange-200 px-3 py-1.5 rounded-lg font-bold text-sm hover:bg-orange-50 transition-colors"
                    >
                      {subscription !== 'mingguan' ? <Lock size={16} /> : <FileText size={16} />} Cetak PDF
                    </button>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    {/* Slider 1: Keuntungan (Harga Jual) */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-bold text-slate-700">Markup Keuntungan dari HPP</label>
                        <span className="font-black text-orange-600 bg-orange-50 px-2 py-1 rounded text-sm">{s.margin}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="300" 
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        value={s.margin}
                        onChange={(e) => handleUpdateSetting(project.id, 'margin', e.target.value)}
                      />
                      
                      <div className="mt-3 bg-slate-50 rounded-lg border border-slate-100 overflow-hidden">
                        {/* Harga & Modal */}
                        <div className="flex flex-wrap gap-4 text-sm p-3 border-b border-slate-100">
                          <div className="flex-1 min-w-[120px]">
                            <span className="block text-slate-500 text-xs mb-1">Modal Bahan (HPP)</span>
                            <span className="font-medium text-slate-700">Rp {Math.ceil(stats.hppDineIn).toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex-1 min-w-[120px]">
                            <span className="block text-slate-500 text-xs mb-1">Harga Dine-in & Bungkus</span>
                            <span className="font-bold text-green-700">Rp {stats.hargaJualDasar.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex-1 min-w-[120px]">
                            <span className="block text-slate-500 text-xs mb-1">Harga Aplikasi Online</span>
                            <span className="font-bold text-green-700">Rp {stats.hargaJualOnline.toLocaleString('id-ID')}</span>
                          </div>
                        </div>

                        {/* Laba per porsi */}
                        <div className="flex flex-wrap gap-4 text-sm p-3 bg-white">
                          <div className="flex-1 min-w-[120px]">
                            <span className="block text-slate-500 text-xs mb-1">Laba / Porsi (Offline)</span>
                            <span className="font-bold text-orange-600">
                              Rp {Math.ceil(untungDineIn).toLocaleString('id-ID')} 
                              <span className="text-xs font-normal text-slate-400 ml-1">({marginDineIn.toFixed(1)}%)</span>
                            </span>
                          </div>
                          <div className="flex-1 min-w-[120px]">
                            <span className="block text-slate-500 text-xs mb-1">Laba / Porsi (Bungkus/Online)</span>
                            <span className="font-bold text-orange-600">
                              Rp {Math.ceil(untungTakeaway).toLocaleString('id-ID')} 
                              <span className="text-xs font-normal text-slate-400 ml-1">({marginTakeaway.toFixed(1)}%)</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Slider 2: Target Terjual Harian */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-bold text-slate-700">Target Jual Harian</label>
                          <span className="font-black text-slate-800 bg-slate-100 px-2 py-1 rounded text-sm">{s.targetSalesDay} Porsi</span>
                        </div>
                        <input 
                          type="range" min="0" max="200" 
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                          value={s.targetSalesDay}
                          onChange={(e) => handleUpdateSetting(project.id, 'targetSalesDay', e.target.value)}
                        />
                      </div>

                      {/* Slider 3: Rasio Bungkus */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-bold text-slate-700">Rasio Dibungkus / Online</label>
                          <span className="font-black text-slate-800 bg-slate-100 px-2 py-1 rounded text-sm">{s.takeawayRatio}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="100" 
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
                          value={s.takeawayRatio}
                          onChange={(e) => handleUpdateSetting(project.id, 'takeawayRatio', e.target.value)}
                        />
                        <div className="flex justify-between text-xs text-slate-400 mt-1 font-medium">
                          <span>Makan di Tempat: {100 - s.takeawayRatio}%</span>
                          <span>Bungkus/Ojol: {s.takeawayRatio}%</span>
                        </div>
                      </div>
                    </div>

                  </div>
                  
                  <div className="bg-slate-800 text-white px-6 py-3 flex justify-between items-center">
                    <span className="text-sm text-slate-300">Laba Kotor Harian dari {project.menuName}:</span>
                    <span className="font-bold text-green-400">Rp {Math.ceil(stats.menuGrossProfit).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Kolom Kanan: Papan Ringkasan Global */}
          <div className="lg:col-span-5">
            <div className="glass-card p-6 sticky top-6 shadow-xl border border-slate-200/60 bg-white">
              <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                <DollarSign className="text-green-500" /> Ringkasan Laba Toko
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="font-medium text-slate-600">Total Omset Harian</span>
                  <span className="font-bold text-slate-800">Rp {Math.ceil(dailyRevenue).toLocaleString('id-ID')}</span>
                </div>
                
                <div className="flex justify-between items-center px-3 text-sm text-slate-500">
                  <span>Total Modal Bahan (HPP)</span>
                  <span className="text-orange-600">- Rp {Math.ceil(dailyCOGS).toLocaleString('id-ID')}</span>
                </div>
                
                <div className="flex justify-between items-center px-3 py-2 border-b border-slate-200 text-slate-700 font-bold">
                  <span>Laba Kotor Harian</span>
                  <span>Rp {Math.ceil(dailyGrossProfit).toLocaleString('id-ID')}</span>
                </div>

                <div className="pt-2 space-y-2">
                  <div className="flex justify-between items-center px-3 text-sm text-slate-500">
                    <span>Biaya Operasional Tetap / Hari</span>
                    <span className="text-orange-600">- Rp {Math.ceil(fixedDailyOverhead).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center px-3 text-sm text-slate-500">
                    <span>Biaya Habis Pakai / Hari</span>
                    <span className="text-orange-600">- Rp {Math.ceil(varDailyOverhead).toLocaleString('id-ID')}</span>
                  </div>
                </div>
                
                <div className={`flex justify-between items-center px-4 py-3 rounded-xl border ${dailyNetProfit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <span className={`font-bold ${dailyNetProfit >= 0 ? 'text-green-800' : 'text-red-800'}`}>Laba Bersih Harian</span>
                  <span className={`font-black text-lg ${dailyNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {dailyNetProfit < 0 ? '-' : ''}Rp {Math.abs(Math.ceil(dailyNetProfit)).toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="mt-6 p-4 rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-xs font-bold text-orange-800 uppercase tracking-wider">Proyeksi Laba Bulanan</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${globalNetMargin >= 15 ? 'bg-green-200 text-green-800' : globalNetMargin > 0 ? 'bg-yellow-200 text-yellow-800' : 'bg-red-200 text-red-800'}`}>
                      Margin: {globalNetMargin.toFixed(1)}%
                    </span>
                  </div>
                  <p className={`text-3xl font-black ${monthlyNetProfit >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
                    {monthlyNetProfit < 0 ? '-' : ''}Rp {Math.abs(Math.ceil(monthlyNetProfit)).toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-orange-600/80 mt-2 font-medium">Asumsi {totalDailySalesQty} porsi terjual per hari x 30 hari.</p>
                </div>
              </div>

              <div className="mt-6 bg-blue-50 text-blue-800 p-4 rounded-xl text-sm border border-blue-100 leading-relaxed">
                <span className="font-bold">Tips Bisnis:</span> Mainkan kombinasi slider target terjual dan persentase margin sampai angka Laba Bulanan menunjukkan profit yang aman untuk bisnis Anda.
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'smart-pricing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-card p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Target size={18} className="text-orange-500" /> 1. Pilih Menu & Konteks Jualan
              </h3>
              <div className="space-y-4">
                <select 
                  className="form-select bg-slate-50"
                  value={spProjectId}
                  onChange={(e) => setSpProjectId(e.target.value)}
                >
                  <option value="">-- Pilih Menu Utama --</option>
                  {projects.filter(p => (p.recipeType || 'utama') === 'utama').map(p => (
                    <option key={p.id} value={p.id}>{p.menuName}</option>
                  ))}
                </select>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Jenis Penjualan (Skenario Pesaing)</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="spSalesType" 
                        value="takeaway"
                        checked={spSalesType === 'takeaway'}
                        onChange={(e) => setSpSalesType(e.target.value)}
                        className="text-orange-500 focus:ring-orange-500"
                      />
                      <span className="text-sm font-medium text-slate-700">Bungkus/Online (Pakai Kemasan)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="spSalesType" 
                        value="dinein"
                        checked={spSalesType === 'dinein'}
                        onChange={(e) => setSpSalesType(e.target.value)}
                        className="text-orange-500 focus:ring-orange-500"
                      />
                      <span className="text-sm font-medium text-slate-700">Makan di Tempat</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Store size={18} className="text-blue-500" /> 2. Masukkan Harga Kompetitor
              </h3>
              <p className="text-sm text-slate-500 mb-4">Masukin harga jual pesaing lu untuk menu sejenis. Makin banyak makin akurat rata-ratanya.</p>
              
              <div className="space-y-4">
                {competitors.map((comp, index) => (
                  <div key={comp.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative">
                    {competitors.length > 1 && (
                      <button onClick={() => handleRemoveCompetitor(comp.id)} className="absolute top-2 right-2 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    )}
                    
                    <div className="space-y-4 pt-4 md:pt-0">
                      <div className="flex gap-4">
                        <input 
                          type="text" 
                          placeholder={`Menu Pesaing ${index + 1} (Misal: Nasgor Seafood H. Alan)`} 
                          className="form-input text-sm flex-1 font-bold text-slate-700"
                          value={comp.name}
                          onChange={(e) => handleCompetitorChange(comp.id, 'name', e.target.value)}
                        />
                        <div className="relative w-40">
                          <span className="absolute left-3 top-2 text-slate-400 font-medium text-sm">Rp</span>
                          <input 
                            type="text" 
                            placeholder="Harga Jual" 
                            className="form-input pl-10 text-sm font-bold text-green-600 w-full"
                            value={comp.price}
                            onChange={(e) => handlePriceInput(comp.id, e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500 uppercase w-20 tracking-wider">Utama</span>
                          <input 
                            type="text" 
                            placeholder="Nama Menu Utama" 
                            className="form-input text-xs flex-1 py-1"
                            value={comp.utama?.name || ''}
                            onChange={(e) => handleUtamaChange(comp.id, 'name', e.target.value)}
                          />
                          <select 
                            className="form-select text-xs w-36 py-1 bg-white"
                            value={comp.utama?.porsi || ''}
                            onChange={(e) => handleUtamaChange(comp.id, 'porsi', e.target.value)}
                          >
                            <option value="">Pilih Porsi...</option>
                            <option value="Sedikit / Kecil">Sedikit / Kecil</option>
                            <option value="Sedang / Normal">Sedang / Normal</option>
                            <option value="Banyak / Besar">Banyak / Besar</option>
                          </select>
                        </div>
                        
                        <div className="space-y-2 pl-2 border-l-2 border-dashed border-slate-200 ml-[84px]">
                          {comp.pendamping && comp.pendamping.map((pend) => (
                            <div key={pend.id} className="flex items-center gap-2 relative group">
                              <input 
                                type="text" 
                                placeholder="Menu Pendamping/Topping" 
                                className="form-input text-xs flex-1 py-1 bg-white"
                                value={pend.name}
                                onChange={(e) => handlePendampingChange(comp.id, pend.id, 'name', e.target.value)}
                              />
                              <select 
                                className="form-select text-xs w-36 py-1 bg-white"
                                value={pend.porsi || ''}
                                onChange={(e) => handlePendampingChange(comp.id, pend.id, 'porsi', e.target.value)}
                              >
                                <option value="">Pilih Porsi...</option>
                                <option value="Sedikit / Kecil">Sedikit / Kecil</option>
                                <option value="Sedang / Normal">Sedang / Normal</option>
                                <option value="Banyak / Besar">Banyak / Besar</option>
                              </select>
                              <button onClick={() => handleRemovePendamping(comp.id, pend.id)} className="text-slate-300 hover:text-red-500 px-1 absolute -right-6 hidden group-hover:block">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                          
                          <button onClick={() => handleAddPendamping(comp.id)} className="text-[10px] font-bold text-blue-500 hover:text-blue-700 flex items-center gap-1 mt-1">
                            <Plus size={12} /> Tambah Menu Pendamping / Topping
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <button onClick={handleAddCompetitor} className="w-full py-2 border-2 border-dashed border-slate-200 text-slate-500 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 text-sm font-bold mt-2">
                  <Plus size={16} /> Tambah Kompetitor
                </button>

                <button 
                  onClick={runSmartPricing}
                  disabled={!spProjectId}
                  className="w-full btn-primary py-3 mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <BrainCircuit size={18} /> Analisa Harga Sekarang
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            {!spResult ? (
              <div className="glass-card p-12 flex flex-col items-center justify-center text-center h-full border-dashed border-2 border-slate-200 bg-slate-50/50">
                <BrainCircuit size={48} className="text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-600 mb-2">AI Smart Pricing</h3>
                <p className="text-slate-400 max-w-sm">Pilih menu dan masukkan harga kompetitor untuk mendapatkan insight dan rekomendasi harga jual terbaik.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className={`p-5 rounded-2xl border ${
                  spResult.status === 'success' ? 'bg-green-50 border-green-200' : 
                  spResult.status === 'warning' ? 'bg-orange-50 border-orange-200' : 
                  'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${
                      spResult.status === 'success' ? 'bg-green-500 text-white' : 
                      spResult.status === 'warning' ? 'bg-orange-500 text-white' : 
                      'bg-red-500 text-white'
                    }`}>
                      {spResult.status === 'success' ? <ShieldCheck size={24} /> : 
                       spResult.status === 'warning' ? <Target size={24} /> : 
                       <AlertTriangle size={24} />}
                    </div>
                    <div>
                      <h3 className={`font-black text-lg mb-1 ${
                        spResult.status === 'success' ? 'text-green-800' : 
                        spResult.status === 'warning' ? 'text-orange-800' : 
                        'text-red-800'
                      }`}>
                        Hasil Analisa: {spResult.menuName}
                      </h3>
                      <p className={`text-sm font-medium mb-2 ${
                        spResult.status === 'success' ? 'text-green-700' : 
                        spResult.status === 'warning' ? 'text-orange-700' : 
                        'text-red-700'
                      }`}>{spResult.insight}</p>
                      <p className="text-sm text-slate-600 leading-relaxed bg-white/60 p-3 rounded-lg">{spResult.advice}</p>
                      
                      <div className="flex gap-4 mt-4 pt-4 border-t border-black/5">
                        <div className="bg-white/50 px-3 py-2 rounded-lg border border-black/5">
                          <span className="block text-[10px] uppercase font-bold opacity-60 mb-1">
                            Modal HPP / Porsi Lu {spResult.salesType === 'takeaway' ? '(Bungkus)' : '(Dine-In)'}
                          </span>
                          <span className="font-bold text-lg">Rp {spResult.modalTotal.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="bg-white/50 px-3 py-2 rounded-lg border border-black/5">
                          <span className="block text-[10px] uppercase font-bold opacity-60 mb-1">Rata-rata Harga Pesaing</span>
                          <span className="font-bold text-lg">Rp {spResult.avgComp.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {spResult.competitorsSnapshot && spResult.competitorsSnapshot.length > 0 && (
                  <div className="glass-card p-5 mt-4 border border-slate-200">
                    <h4 className="font-bold text-slate-700 mb-3 text-sm flex items-center gap-2">
                      <Target size={16} className="text-slate-400" /> Bedah Spesifikasi Pesaing
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {spResult.competitorsSnapshot.map(comp => (
                        <div key={comp.id} className="bg-white rounded-lg p-3 border border-slate-100 text-sm shadow-sm">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2">
                            <span className="font-bold text-slate-800">{comp.name || 'Pesaing'}</span>
                            <span className="font-black text-green-600">Rp {parseInt(comp.price.replace(/\D/g,'')||0,10).toLocaleString('id-ID')}</span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-500 font-medium">Utama:</span>
                              <span className="text-slate-700 font-bold">{comp.utama?.name || '-'} ({comp.utama?.porsi || '-'})</span>
                            </div>
                            {comp.pendamping && comp.pendamping.length > 0 && (
                              <div className="pt-1">
                                <span className="text-slate-500 font-medium text-[10px] uppercase">Pendamping/Topping:</span>
                                <ul className="mt-1 space-y-1">
                                  {comp.pendamping.map(p => (
                                    <li key={p.id} className="flex justify-between text-xs bg-slate-50 px-2 py-1 rounded">
                                      <span>{p.name || '-'}</span>
                                      <span className="font-bold">{p.porsi || '-'}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <h3 className="font-black text-slate-800 text-lg flex items-center gap-2 mt-8 mb-4">
                  <Sparkles className="text-orange-500" size={20} /> Rekomendasi Harga Jual
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="glass-card p-5 border-2 border-blue-100 hover:border-blue-300 transition-colors text-center relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1 bg-blue-500"></div>
                    <h4 className="font-bold text-blue-800 mb-1">Mode Promo (Penetrasi)</h4>
                    <p className="text-xs text-slate-500 mb-4 h-8">Jual murah untuk rebut pasar awal.</p>
                    <div className="text-2xl font-black text-blue-900 mb-2">Rp {spResult.options.penetrasi.toLocaleString('id-ID')}</div>
                    <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded block w-fit mx-auto">
                      Untung: Rp {(spResult.options.penetrasi - spResult.modalTotal).toLocaleString('id-ID')} ({Math.round(((spResult.options.penetrasi - spResult.modalTotal) / spResult.options.penetrasi) * 100)}%)
                    </span>
                  </div>

                  <div className="glass-card p-5 border-2 border-orange-200 hover:border-orange-400 transition-colors text-center relative shadow-lg scale-105 z-10">
                    <div className="absolute top-0 inset-x-0 h-1 bg-orange-500"></div>
                    <h4 className="font-bold text-orange-800 mb-1">Mode Kompetitif</h4>
                    <p className="text-xs text-slate-500 mb-4 h-8">Harga imbang dengan pesaing.</p>
                    <div className="text-2xl font-black text-orange-900 mb-2">Rp {spResult.options.kompetitif.toLocaleString('id-ID')}</div>
                    <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded block w-fit mx-auto">
                      Untung: Rp {(spResult.options.kompetitif - spResult.modalTotal).toLocaleString('id-ID')} ({Math.round(((spResult.options.kompetitif - spResult.modalTotal) / spResult.options.kompetitif) * 100)}%)
                    </span>
                  </div>

                  <div className="glass-card p-5 border-2 border-purple-100 hover:border-purple-300 transition-colors text-center relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1 bg-purple-500"></div>
                    <h4 className="font-bold text-purple-800 mb-1">Mode Premium</h4>
                    <p className="text-xs text-slate-500 mb-4 h-8">Jual mahal, tonjolkan kualitas.</p>
                    <div className="text-2xl font-black text-purple-900 mb-2">Rp {spResult.options.premium.toLocaleString('id-ID')}</div>
                    <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded block w-fit mx-auto">
                      Untung: Rp {(spResult.options.premium - spResult.modalTotal).toLocaleString('id-ID')} ({Math.round(((spResult.options.premium - spResult.modalTotal) / spResult.options.premium) * 100)}%)
                    </span>
                  </div>
                </div>

                <div className="mt-6 bg-slate-100/70 p-4 rounded-xl border border-slate-200 flex items-start gap-3">
                  <AlertTriangle className="text-slate-400 shrink-0 mt-0.5" size={16} />
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    <strong className="text-slate-700">Catatan Penting:</strong> Perhitungan modal pada fitur Smart Pricing ini murni <span className="font-bold underline">hanya menggunakan HPP Bahan Baku Dasar</span> per porsi, dan belum ditambahkan margin *buffer* maupun perhitungan biaya HPP Overhead (sewa, listrik, operasional, karyawan, penyusutan). Pastikan selisih margin harga jual di atas cukup besar untuk menutupi *overhead* operasional bulanan Anda.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
