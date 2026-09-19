import React, { useState } from 'react';
import { X, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import Logo from './Logo';

export default function AuthModal({ isOpen, onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        if (password !== confirmPassword) {
          throw new Error("Password konfirmasi tidak cocok!");
        }
        if (password.length < 6) {
          throw new Error("Password minimal 6 karakter.");
        }
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error(err);
      let msg = "Terjadi kesalahan jaringan atau server.";
      if (err.code === 'auth/invalid-email') msg = "Format email tidak valid.";
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') msg = "Email atau password salah.";
      if (err.code === 'auth/email-already-in-use') msg = "Email sudah terdaftar. Silakan login.";
      if (err.code === 'auth/weak-password') msg = "Password terlalu lemah (minimal 6 karakter).";
      if (err.message === "Password konfirmasi tidak cocok!" || err.message === "Password minimal 6 karakter.") msg = err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Silakan masukkan email Anda terlebih dahulu.");
      return;
    }
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err) {
      console.error(err);
      let msg = "Terjadi kesalahan saat mereset password.";
      if (err.code === 'auth/invalid-email') msg = "Format email tidak valid.";
      if (err.code === 'auth/user-not-found') msg = "Email tidak terdaftar di sistem kami.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error(err);
      setError("Gagal masuk menggunakan Google.");
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIsForgotPassword(false);
    setResetSent(false);
    setError('');
    setPassword('');
    setConfirmPassword('');
    setIsLogin(!isLogin);
  };

  const backToLogin = () => {
    setIsForgotPassword(false);
    setResetSent(false);
    setError('');
    setIsLogin(true);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header Graphic */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 flex flex-col items-center justify-center relative border-b border-orange-200">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white rounded-full text-slate-500 transition-colors"
          >
            <X size={20} />
          </button>
          <Logo size="sm" hideText={true} />
          <h2 className="text-2xl font-black text-slate-900 mt-4 mb-1">
            {isForgotPassword ? 'Reset Password' : (isLogin ? 'Selamat Datang Kembali!' : 'Buat Akun Baru')}
          </h2>
          <p className="text-slate-500 text-sm text-center">
            {isForgotPassword 
              ? 'Masukkan email Anda untuk menerima link reset password.'
              : (isLogin ? 'Masuk untuk mengelola HPP dan laba bisnis Anda.' : 'Daftar sekarang dan optimalkan margin bisnis kuliner Anda.')}
          </p>
        </div>

        {/* Form Area */}
        <div className="p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-xl flex items-start gap-3 border border-red-100">
              <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
              <span className="text-sm text-red-600 font-medium leading-relaxed">{error}</span>
            </div>
          )}

          {isForgotPassword ? (
            /* LUPA PASSWORD FLOW */
            resetSent ? (
              <div className="text-center animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">Cek Email Anda</h3>
                <p className="text-slate-600 text-sm mb-6">
                  Link untuk mereset password telah dikirim ke <strong>{email}</strong>. Silakan cek kotak masuk atau folder spam Anda.
                </p>
                <button 
                  onClick={backToLogin}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-orange-500/30 transition-all"
                >
                  Kembali ke Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Alamat Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail size={18} className="text-slate-400" />
                    </div>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-slate-900"
                      placeholder="nama@email.com"
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-orange-500/30 transition-all hover:-translate-y-0.5 mt-2 flex items-center justify-center"
                >
                  {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Kirim Link Reset'}
                </button>
                <div className="mt-4 text-center">
                  <button 
                    type="button" 
                    onClick={backToLogin}
                    className="text-slate-500 text-sm hover:text-slate-700 font-medium hover:underline"
                  >
                    Batal dan kembali ke Login
                  </button>
                </div>
              </form>
            )
          ) : (
            /* NORMAL LOGIN/REGISTER FLOW */
            <div className="animate-in fade-in duration-200">
              <button 
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-bold py-3.5 px-4 rounded-xl transition-all mb-6"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Lanjutkan dengan Google
              </button>

              <div className="relative flex items-center justify-center mb-6">
                <div className="absolute inset-x-0 h-px bg-slate-200"></div>
                <span className="relative bg-white px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Atau gunakan email</span>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Alamat Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail size={18} className="text-slate-400" />
                    </div>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-slate-900"
                      placeholder="nama@email.com"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-sm font-bold text-slate-700">Password</label>
                    {isLogin && (
                      <button 
                        type="button" 
                        onClick={() => { setIsForgotPassword(true); setError(''); }} 
                        className="text-xs font-bold text-orange-600 hover:text-orange-700"
                      >
                        Lupa Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock size={18} className="text-slate-400" />
                    </div>
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-slate-900"
                      placeholder="Minimal 6 karakter"
                    />
                  </div>
                </div>

                {!isLogin && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Konfirmasi Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock size={18} className="text-slate-400" />
                      </div>
                      <input 
                        type="password" 
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-slate-900"
                        placeholder="Ulangi password"
                      />
                    </div>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-orange-500/30 transition-all hover:-translate-y-0.5 mt-2 flex items-center justify-center"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    isLogin ? 'Masuk' : 'Daftar Sekarang'
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-slate-600 text-sm">
                  {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}{' '}
                  <button 
                    onClick={resetForm}
                    className="font-bold text-orange-600 hover:text-orange-700 transition-colors underline decoration-orange-200 hover:decoration-orange-500 underline-offset-4"
                  >
                    {isLogin ? "Daftar di sini" : "Login di sini"}
                  </button>
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
