import React, { useState, useEffect } from 'react';
import { User, Store, Lock, Key, CheckCircle, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { db, auth } from '../firebase';
import BackgroundDecoration from '../components/BackgroundDecoration';

export default function Profile({ user, subscription }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ownerName, setOwnerName] = useState('');
  const [shopName, setShopName] = useState('');
  const [message, setMessage] = useState('');

  const isPremium = subscription !== 'free';

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          setUserData(data);
          setOwnerName(data.ownerName || '');
          setShopName(data.shopName || '');
        }
      } catch (err) {
        console.error("Error fetching profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { ownerName, shopName }, { merge: true });
      setMessage('Profil berhasil diperbarui!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setMessage('Gagal memperbarui profil.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    const confirm = window.confirm("Kirim email untuk reset password ke " + user.email + "?");
    if (!confirm) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      alert("Link reset password telah dikirim ke email Anda. Silakan cek Inbox/Spam.");
    } catch (err) {
      console.error(err);
      alert("Gagal mengirim email reset password: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex justify-center items-center">
        <Loader2 className="animate-spin text-orange-500 w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 relative">
      <BackgroundDecoration theme="orange" />

      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 flex items-center gap-2">
          <User className="text-orange-500" /> Profil Akun
        </h1>
        <p className="text-slate-500">Kelola informasi data diri dan keamanan akun Anda.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Form Edit */}
        <div className="md:col-span-2 bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white">
          <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-4">Data Pribadi & Toko</h2>
          
          {message && (
            <div className={`p-4 rounded-xl mb-6 text-sm font-semibold flex items-center gap-2 ${message.includes('Gagal') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              <CheckCircle size={18} /> {message}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email Akun (Tidak dapat diubah)</label>
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-100 rounded-xl border border-slate-200 text-slate-500 cursor-not-allowed">
                <Mail size={18} /> {user.email}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Nama Pemilik / Panggilan</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                  placeholder="Contoh: Bayu, Budi..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Nama Bisnis / Toko</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Store size={18} />
                </div>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                  placeholder="Contoh: Kedai Kopi Senja..."
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className="w-full md:w-auto px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Status & Security */}
        <div className="space-y-6">
          {/* Subscription Status */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white">
            <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-3">Status Langganan</h2>
            
            {isPremium ? (
              <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-5 text-white shadow-lg">
                <div className="flex items-center gap-2 font-black text-xl mb-1">
                  <Key size={24} className="text-amber-100" /> Premium Aktif
                </div>
                <p className="text-amber-100 text-sm">Anda memiliki akses penuh ke semua fitur.</p>
              </div>
            ) : (
              <div className="bg-slate-100 rounded-2xl p-5 border border-slate-200">
                <div className="flex items-center gap-2 font-black text-slate-700 mb-1">
                  <Lock size={20} className="text-slate-500" /> Paket Gratis
                </div>
                <p className="text-slate-500 text-sm">Beli langganan di halaman Dashboard untuk fitur tanpa batas.</p>
              </div>
            )}
          </div>

          {/* Security */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white">
            <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-3">Keamanan</h2>
            <p className="text-sm text-slate-500 mb-4">Ingin mengganti password akun Anda? Kami akan mengirimkan tautan aman ke email Anda.</p>
            <button
              onClick={handleResetPassword}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <AlertCircle size={18} /> Reset Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
