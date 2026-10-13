import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export const AuthPage: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  // Form Fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [userCaptchaInput, setUserCaptchaInput] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Random 4-Digit Captcha Generator
  const generateCaptcha = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setCaptchaCode(code);
  };

  useEffect(() => {
    if (isLogin) {
      generateCaptcha();
    }
  }, [isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Captcha Validation only for Login
    if (isLogin && userCaptchaInput !== captchaCode) {
      setError('Invalid Verification Code (Captcha)');
      generateCaptcha();
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // LOGIN FLOW
        await signIn(username, password);
        window.location.href = '/'; 
      } else {
        // REGISTER FLOW
        await signUp(username, password);
        alert('Account created successfully! Logging you in...');
        setIsLogin(true);
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      setError(err?.message || 'Authentication failed. Please check your username and password.');
      generateCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#02091d] flex items-center justify-center p-4 relative font-sans overflow-x-hidden">
      
      {/* Background Effect */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none z-0 opacity-20 mix-blend-screen"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&q=80')` }}
      ></div>
      <div className="fixed inset-0 bg-gradient-to-b from-[#02091d]/90 via-[#051642]/85 to-[#010617]/95 pointer-events-none z-0"></div>

      {/* Main Card Container */}
      <div className="bg-slate-950/90 border border-blue-500/40 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-[0_0_50px_rgba(6,182,212,0.25)] relative z-10 backdrop-blur-xl">
        
        {/* Branding Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            🎯
          </div>
          <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-blue-400 uppercase tracking-wide">
            Digital Marketing
          </h1>
          <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest border-t border-b border-blue-900/60 py-0.5 inline-block px-3">
            E COMMERCE
          </p>
          <h2 className="text-xs font-bold text-white pt-2">
            {isLogin ? 'Login to Your Account' : 'Register New Account'}
          </h2>
          <p className="text-[11px] text-slate-400">
            {isLogin ? 'Access your dashboard and start growing your online business.' : 'Fill details below to setup your account.'}
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 bg-red-600/90 border border-red-400 text-white font-bold text-xs text-center rounded-xl shadow-lg break-words">
            {error}
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-3">
          
          {/* Username Input */}
          <div>
            <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
              USERNAME
            </label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          {/* Email Address Input (Register Only) */}
          {!isLogin && (
            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
                EMAIL ADDRESS (OPTIONAL)
              </label>
              <input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          )}

          {/* Password Input */}
          <div>
            <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
              PASSWORD
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Invitation Code (Register Only) */}
          {!isLogin && (
            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
                INVITATION CODE
              </label>
              <input
                type="text"
                placeholder="Enter Invitation Code"
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value)}
                required={!isLogin}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          )}

          {/* Security Captcha Box (Login Only) */}
          {isLogin && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-bold text-slate-300 uppercase">
                  SECURITY CAPTCHA CODE
                </label>
                <button
                  type="button"
                  onClick={generateCaptcha}
                  className="text-[10px] text-cyan-400 hover:underline font-bold flex items-center space-x-1"
                >
                  <span>Refresh</span> 🔄
                </button>
              </div>

              <div 
                onClick={generateCaptcha}
                className="w-full py-2.5 bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 border border-cyan-500/50 rounded-xl text-center text-amber-400 font-mono font-black text-lg tracking-[0.3em] select-none shadow-inner cursor-pointer hover:border-amber-400/80 transition"
              >
                {captchaCode}
              </div>

              <input
                type="text"
                placeholder="Enter numbers shown above"
                value={userCaptchaInput}
                onChange={(e) => setUserCaptchaInput(e.target.value)}
                required={isLogin}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono text-center tracking-wider"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition uppercase tracking-wider mt-2"
          >
            {loading ? 'Processing...' : isLogin ? 'LOGIN ➔' : 'REGISTER ACCOUNT ➔'}
          </button>
        </form>

        {/* Toggle Login / Register */}
        <div className="pt-2 text-center border-t border-slate-900">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-xs font-semibold text-cyan-400 hover:underline"
          >
            {isLogin ? 'New here? Create an account' : 'Already have an account? Login here'}
          </button>
        </div>

      </div>
    </div>
  );
};