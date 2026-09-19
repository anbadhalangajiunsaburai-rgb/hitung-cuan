import { useState, useEffect } from 'react'
import { LogOut, Trash2, Key, User } from 'lucide-react'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import './index.css'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import HPPCalculator from './pages/HPPCalculator'
import MasterGudang from './pages/MasterGudang'
import UserGuide from './pages/UserGuide'
import LabaRugi from './pages/LabaRugi'
import MasterOperasional from './pages/MasterOperasional'
import Profile from './pages/Profile'
import PaywallModal from './components/PaywallModal'
import Logo from './components/Logo'
import { auth, db } from './firebase'
import { onAuthStateChanged, signOut, deleteUser } from 'firebase/auth'
import { doc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore'

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Global Subscription State (For testing)
  const [subscription, setSubscription] = useState('free'); // 'free', 'harian', 'mingguan'
  const [paywallConfig, setPaywallConfig] = useState({ isOpen: false, message: '' });

  const triggerPaywall = (message) => {
    setPaywallConfig({ isOpen: true, message });
  };

  const [premiumExpiry, setPremiumExpiry] = useState(null);

  useEffect(() => {
    let unsubDoc = null;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        import('firebase/firestore').then(({ doc, onSnapshot }) => {
          unsubDoc = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              if (data.isPremium && data.premiumUntil) {
                const expiryDate = new Date(data.premiumUntil);
                if (expiryDate > new Date()) {
                  setSubscription(data.premiumPlan || 'harian');
                  setPremiumExpiry(expiryDate);
                } else {
                  setSubscription('free');
                  setPremiumExpiry(null);
                }
              } else {
                setSubscription('free');
                setPremiumExpiry(null);
              }
            }
            setAuthLoading(false);
          });
        });
      } else {
        setSubscription('free');
        setPremiumExpiry(null);
        setAuthLoading(false);
        if (unsubDoc) unsubDoc();
      }
    });

    return () => {
      unsubscribe();
      if (unsubDoc) unsubDoc();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "DEV MODE: Yakin ingin mereset/menghapus akun ini?\n\nSemua data (Profil, Gudang, Resep) akan dihapus secara permanen."
    );
    if (!confirmDelete) return;

    try {
      const uid = user.uid;
      
      // 1. Delete user profile
      await deleteDoc(doc(db, 'users', uid));
      
      // 2. Delete inventory data
      const qInv = query(collection(db, 'inventory'), where('userId', '==', uid));
      const snapInv = await getDocs(qInv);
      snapInv.forEach(async (d) => await deleteDoc(d.ref));
      
      // 3. Delete hpp projects
      const qProj = query(collection(db, 'hpp_projects'), where('userId', '==', uid));
      const snapProj = await getDocs(qProj);
      snapProj.forEach(async (d) => await deleteDoc(d.ref));
      
      // 4. Delete Auth User (requires recent login)
      await deleteUser(user);
      alert("Akun berhasil dihapus. Silakan daftar kembali untuk test Onboarding.");
    } catch (error) {
      console.error('Error deleting account:', error);
      if (error.code === 'auth/requires-recent-login') {
        alert("Sesi terlalu lama. Sistem akan mengeluarkan Anda, silakan login ulang lalu klik Hapus Akun lagi.");
        await signOut(auth);
      } else {
        alert("Gagal menghapus akun: " + error.message);
      }
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-orange-600 font-semibold">Memuat...</div>
      </div>
    );
  }

  if (!user) {
    if (window.location.pathname !== '/') {
      window.history.replaceState(null, '', '/');
    }
    return <LandingPage />
  }

  // Calculate remaining hours and minutes
  let remainingText = '';
  if (subscription === 'premium' && premiumExpiry) {
    const now = new Date();
    const diffMs = premiumExpiry - now;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    remainingText = `${diffHrs} Jam ${diffMins} Menit`;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col relative z-10">
        {/* Premium Banner */}
        {subscription === 'premium' && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white text-center py-2 px-4 text-sm font-medium shadow-sm flex items-center justify-center gap-2">
            <Key size={16} className="text-amber-100" />
            <span>Akun Premium Aktif! Sisa Waktu: <strong>{remainingText}</strong></span>
          </div>
        )}

        {/* Global Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-orange-100 sticky top-0 z-50 shadow-sm">
          <div className="w-full max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2 text-decoration-none hover:opacity-90 transition-opacity">
              <Logo size="md" />
            </Link>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link 
                to="/profil"
                className="btn btn-outline text-xs sm:text-sm !border-slate-200 !text-slate-600 hover:!bg-slate-50 py-1.5 px-3 rounded-xl flex items-center gap-2"
                title="Profil Saya"
              >
                <User size={16} /> <span className="hidden sm:inline">Profil</span>
              </Link>
              <button 
                onClick={handleLogout}
                className="btn btn-outline text-xs sm:text-sm !border-red-200 !text-red-600 hover:!bg-red-50 py-1.5 px-3 rounded-xl flex items-center gap-2"
                title="Keluar"
              >
                <LogOut size={16} /> <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 relative">
          <Routes>
            <Route path="/" element={<Dashboard user={user} subscription={subscription} triggerPaywall={triggerPaywall} />} />
            <Route path="/hpp" element={<HPPCalculator user={user} subscription={subscription} triggerPaywall={triggerPaywall} />} />
            <Route path="/gudang" element={<MasterGudang user={user} subscription={subscription} triggerPaywall={triggerPaywall} />} />
            <Route path="/operasional" element={<MasterOperasional user={user} subscription={subscription} triggerPaywall={triggerPaywall} />} />
            <Route path="/laba-rugi" element={<LabaRugi user={user} subscription={subscription} triggerPaywall={triggerPaywall} />} />
            <Route path="/panduan" element={<UserGuide />} />
            <Route path="/profil" element={<Profile user={user} subscription={subscription} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        
        <PaywallModal 
          isOpen={paywallConfig.isOpen} 
          message={paywallConfig.message} 
          user={user}
          onClose={() => setPaywallConfig({ ...paywallConfig, isOpen: false })} 
        />
      </div>
    </BrowserRouter>
  );
}

export default App
