import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export const AuthPage: React.FC = () => {
  const { signIn } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [userCaptchaInput, setUserCaptchaInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateCaptcha = () => {
    setCaptchaCode(
      Math.floor(1000 + Math.random() * 9000).toString()
    );
  };

  useEffect(() => {
    generateCaptcha();
  }, [isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (loading) return;

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();
    const userEnteredCode = invitationCode.trim().toUpperCase();

    if (!cleanUsername || !password) {
      setError('Please enter your username and password.');
      return;
    }

    if (isLogin && userCaptchaInput.trim() !== captchaCode) {
      setError('Invalid Verification Code (Captcha).');
      generateCaptcha();
      setUserCaptchaInput('');
      return;
    }

    setLoading(true);

    try {
      // LOGIN
      if (isLogin) {
        await signIn(cleanUsername, password);
        window.location.href = '/dashboard';
        return;
      }

      // REGISTRATION VALIDATION
      if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
        throw new Error(
          'Username must be 3-30 characters and contain only English letters, numbers, or underscores.'
        );
      }

      if (password.length < 6) {
        throw new Error(
          'Password must contain at least 6 characters.'
        );
      }

      if (!userEnteredCode) {
        throw new Error(
          'Invitation Code is required to register.'
        );
      }

      // CHECK USERNAME
      const { data: usernameMatch, error: usernameCheckError } =
        await supabase
          .from('profiles')
          .select('id')
          .ilike('username', cleanUsername)
          .limit(1);

      if (usernameCheckError) {
        console.error('Username check error:', usernameCheckError);
        throw new Error(
          'Could not verify username availability. Please try again.'
        );
      }

      if (usernameMatch && usernameMatch.length > 0) {
        throw new Error(
          'This username is already registered. Please choose another username.'
        );
      }

      // VALIDATE MAIN ADMIN OR SUB-ADMIN INVITATION CODE
      let matchedSubAdminId: string | null = null;

      const { data: mainSetting, error: settingError } =
        await supabase
          .from('system_settings')
          .select('main_invite_code')
          .eq('id', 1)
          .maybeSingle();

      if (settingError) {
        console.error('Main invitation lookup error:', settingError);
        throw new Error(
          'Could not verify the invitation code. Please try again.'
        );
      }

      const { data: subAdminMatch, error: subAdminError } =
        await supabase
          .from('sub_admins')
          .select('id, invite_code')
          .ilike('invite_code', userEnteredCode)
          .maybeSingle();

      if (subAdminError) {
        console.error('Sub-admin invitation lookup error:', subAdminError);
        throw new Error(
          'Could not verify the invitation code. Please try again.'
        );
      }

      const isValidMain =
        !!mainSetting?.main_invite_code &&
        mainSetting.main_invite_code.toUpperCase() === userEnteredCode;

      const isValidSub = !!subAdminMatch;

      if (!isValidMain && !isValidSub) {
        throw new Error(
          'Invalid, disabled, or expired Invitation Code.'
        );
      }

      if (isValidSub && subAdminMatch) {
        matchedSubAdminId = subAdminMatch.id;
      }

      // CHECK EMAIL IF PROVIDED
      if (cleanEmail) {
        const { data: emailMatch, error: emailCheckError } =
          await supabase
            .from('profiles')
            .select('id')
            .ilike('email', cleanEmail)
            .limit(1);

        if (emailCheckError) {
          console.error('Email check error:', emailCheckError);
          throw new Error(
            'Could not verify email availability. Please try again.'
          );
        }

        if (emailMatch && emailMatch.length > 0) {
          throw new Error(
            'This email is already registered. Please use another email.'
          );
        }
      }

      // USE SUPPLIED EMAIL OR USERNAME-BASED EMAIL
      const userEmail =
        cleanEmail ||
        `${cleanUsername.toLowerCase()}@appuser.local`;

      // GENERATE CUSTOMER INVITATION CODE
      const uniqueOwnDashboardCode =
        'M' + Math.floor(10000 + Math.random() * 90000);

      // CREATE AUTH ACCOUNT
      const { data: authData, error: authErr } =
        await supabase.auth.signUp({
          email: userEmail,
          password,
          options: {
            data: {
              full_name: cleanUsername,
              username: cleanUsername,
              invite_code: uniqueOwnDashboardCode,
              invitation_code: uniqueOwnDashboardCode,
              user_invite_code: uniqueOwnDashboardCode,
              referred_by_code: userEnteredCode,
              sub_admin_id: matchedSubAdminId,
            },
          },
        });

      if (authErr) {
        console.error('Signup error:', authErr);

        if (
          authErr.message.toLowerCase().includes('already registered') ||
          authErr.message.toLowerCase().includes('already been registered') ||
          authErr.message.toLowerCase().includes('already exists')
        ) {
          throw new Error(
            'This email/account may already exist. Please log in instead of registering again.'
          );
        }

        throw new Error(authErr.message);
      }

      if (!authData.user) {
        throw new Error(
          'Account creation could not be confirmed. Please try again.'
        );
      }

      // EMAIL CONFIRMATION MAY BE REQUIRED BY SUPABASE
      if (!authData.session) {
        setError(
          'Account created. Please check your email for confirmation, then log in.'
        );

        setIsLogin(true);
        setPassword('');
        setUserCaptchaInput('');
        generateCaptcha();
        return;
      }

      // SIGN IN AFTER REGISTRATION
      await signIn(userEmail, password);
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      console.error('Authentication error:', err);

      const message =
        err instanceof Error
          ? err.message
          : 'Authentication failed. Please try again.';

      setError(message);
      generateCaptcha();
      setUserCaptchaInput('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#02091d] flex items-center justify-center p-4 relative font-sans overflow-x-hidden">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none z-0 opacity-20 mix-blend-screen"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&q=80')",
        }}
      />

      <div className="fixed inset-0 bg-gradient-to-b from-[#02091d]/90 via-[#051642]/85 to-[#010617]/95 pointer-events-none z-0" />

      <div className="bg-slate-950/90 border border-blue-500/40 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-[0_0_50px_rgba(6,182,212,0.25)] relative z-10 backdrop-blur-xl">
        <div className="text-center space-y-1.5">
          <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-blue-400 uppercase tracking-wide">
            Digital Marketing
          </h1>

          <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest border-t border-b border-blue-900/60 py-0.5 inline-block px-3">
            E COMMERCE
          </p>

          {/* DEDICATED CSS DIGITAL MARKETING LOGO BADGE */}
          <div className="pt-2">
            <div className="w-20 h-20 mx-auto rounded-2xl overflow-hidden border-2 border-cyan-400/50 p-0.5 bg-gradient-to-tr from-cyan-500 via-blue-600 to-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex flex-col items-center justify-center p-1 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 to-transparent pointer-events-none" />
                
                <svg className="w-7 h-7 text-cyan-400 mb-0.5 filter drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>

                <span className="text-[9px] font-black text-white tracking-wider uppercase">
                  Digital
                </span>
                <span className="text-[8px] font-bold text-cyan-400 tracking-widest uppercase">
                  Marketing
                </span>
              </div>
            </div>
          </div>

          <h2 className="text-xs font-bold text-white pt-1">
            {isLogin
              ? 'Login to Your Account'
              : 'Register New Account'}
          </h2>
        </div>

        {error && (
          <div className="p-3 bg-red-600/90 border border-red-400 text-white font-bold text-xs text-center rounded-xl shadow-lg break-words">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
              USERNAME / EMAIL
            </label>
            <input
              type="text"
              autoComplete="username"
              placeholder="Enter your username or email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
                EMAIL ADDRESS (OPTIONAL)
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
              PASSWORD
            </label>
            <input
              type="password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

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
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono uppercase"
              />
            </div>
          )}

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
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono text-center tracking-wider"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition uppercase tracking-wider mt-2 disabled:opacity-60"
          >
            {loading
              ? 'Processing...'
              : isLogin
                ? 'LOGIN ➔'
                : 'REGISTER ACCOUNT ➔'}
          </button>
        </form>

        <div className="pt-2 text-center border-t border-slate-900">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setPassword('');
              setUserCaptchaInput('');
            }}
            className="text-xs font-semibold text-cyan-400 hover:underline"
          >
            {isLogin
              ? 'New here? Create an account'
              : 'Already have an account? Login here'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;