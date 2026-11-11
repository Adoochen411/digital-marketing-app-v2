import React, { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export const AuthPage: React.FC = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [userCaptchaInput, setUserCaptchaInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [verificationStatus, setVerificationStatus] =
    useState<'verifying' | 'success' | null>(null);

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
if (loading) return;

console.log('AUTH BUTTON CLICKED');

// Force React to render verification card immediately.
flushSync(() => {
  setLoading(true);
  setError(null);
  setVerificationStatus('verifying');
});

// Give browser time to paint the card before Supabase requests.
await new Promise(resolve => setTimeout(resolve, 100));

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();
    const userEnteredCode = invitationCode.trim().toUpperCase();

    try {
      // COMMON VALIDATION
      if (!cleanUsername || !password) {
        throw new Error(
          'Please enter your username and password.'
        );
      }

      // LOGIN CAPTCHA VALIDATION
      if (
        isLogin &&
        userCaptchaInput.trim() !== captchaCode
      ) {
        throw new Error(
          'Invalid Verification Code (Captcha).'
        );
      }

      // =====================================
      // LOGIN
      // =====================================
      if (isLogin) {
        await signIn(cleanUsername, password);

        setVerificationStatus('success');

        await new Promise(resolve =>
          setTimeout(resolve, 1200)
        );

        localStorage.setItem(
          'auth_notification',
          'welcome_login'
        );

        navigate('/dashboard', {
          replace: true,
          state: { notification: 'welcome_login' }
        });

        return;
      }

      // =====================================
      // REGISTRATION VALIDATION
      // =====================================

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

      // =====================================
      // CHECK USERNAME, EMAIL AND MAIN CODE
      // =====================================

      const [
        availabilityResult,
        mainSettingResult,
      ] = await Promise.all([
        supabase.rpc(
          'check_registration_availability',
          {
            p_username: cleanUsername,
            p_email: cleanEmail || null,
          }
        ),

        supabase
          .from('system_settings')
          .select('main_invite_code')
          .eq('id', 1)
          .maybeSingle(),
      ]);

      if (availabilityResult.error) {
        console.error(
          'Username/email availability RPC error:',
          availabilityResult.error
        );

        throw new Error(
          `Could not verify username availability: ${availabilityResult.error.message}`
        );
      }

      const availability =
        availabilityResult.data?.[0];

      if (!availability) {
        console.error(
          'Availability RPC returned no result:',
          availabilityResult.data
        );

        throw new Error(
          'Username availability check returned no result. Please try again.'
        );
      }

      if (availability.username_exists) {
        throw new Error(
          'This username is already registered. Please choose another username.'
        );
      }

      if (mainSettingResult.error) {
        console.error(
          'Main invitation lookup error:',
          mainSettingResult.error
        );

        throw new Error(
          `Main invitation lookup failed: ${mainSettingResult.error.message}`
        );
      }

      if (availability.email_exists) {
        throw new Error(
          'This email is already registered. Please use another email.'
        );
      }

      // =====================================
      // VALIDATE MAIN ADMIN / SUB-ADMIN CODE
      // =====================================

      let matchedSubAdminId: string | null = null;

      const normalizedCode = userEnteredCode
        .trim()
        .toUpperCase();

      const mainCode = String(
        mainSettingResult.data?.main_invite_code ?? ''
      )
        .trim()
        .toUpperCase();

      const isValidMain =
        !!mainCode && mainCode === normalizedCode;

      let isValidSub = false;

      if (!isValidMain) {
        const {
          data: subAdminMatch,
          error: subAdminError,
        } = await supabase.rpc(
          'lookup_sub_admin_invitation',
          {
            p_invite_code: normalizedCode,
          }
        );

        if (subAdminError) {
          console.error(
            'Sub-admin invitation lookup error:',
            subAdminError
          );

          throw new Error(
            `Sub-Admin invitation lookup failed: ${subAdminError.message}`
          );
        }

        if (subAdminMatch && subAdminMatch.length > 1) {
          throw new Error(
            'This invitation code is duplicated. Please contact the administrator.'
          );
        }

        const matchedSubAdmin = subAdminMatch?.[0];

        isValidSub = !!matchedSubAdmin;

        if (matchedSubAdmin) {
          matchedSubAdminId = matchedSubAdmin.id;
        }
      }

      if (!isValidMain && !isValidSub) {
        throw new Error(
          'Invalid, disabled, or expired Invitation Code.'
        );
      }

      // =====================================
      // PREPARE CUSTOMER ACCOUNT
      // =====================================

      const userEmail =
        cleanEmail ||
        `${cleanUsername.toLowerCase()}@appuser.local`;

      const uniqueOwnDashboardCode =
        'M' +
        Math.floor(10000 + Math.random() * 90000);

      // =====================================
      // CREATE SUPABASE AUTH ACCOUNT
      // =====================================

      const {
        data: authData,
        error: authErr,
      } = await supabase.auth.signUp({
        email: userEmail,
        password,
        options: {
          data: {
            full_name: cleanUsername,
            username: cleanUsername,
            invite_code: uniqueOwnDashboardCode,
            invitation_code: uniqueOwnDashboardCode,
            user_invite_code: uniqueOwnDashboardCode,
            referred_by_code: normalizedCode,
            sub_admin_id: matchedSubAdminId,
          },
        },
      });

      if (authErr) {
        console.error('Signup error:', authErr);

        const authErrorMessage =
          authErr.message.toLowerCase();

        if (
          authErrorMessage.includes('already registered') ||
          authErrorMessage.includes('already been registered') ||
          authErrorMessage.includes('already exists')
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

      // Email confirmation is expected to be disabled.
      // Without an active session, do not falsely report success.
      if (!authData.session) {
        throw new Error(
          'Account was created but no active session was returned. Please check that email confirmation is disabled in Supabase Auth settings.'
        );
      }

      // =====================================
      // REGISTRATION SUCCESS
      // =====================================

      setVerificationStatus('success');

      await new Promise(resolve =>
        setTimeout(resolve, 1200)
      );

      localStorage.setItem(
        'auth_notification',
        'welcome_register'
      );

      navigate('/dashboard', {
        replace: true,
        state: { notification: 'welcome_register' }
      });

      // Capture registration location in background.
      void supabase.functions.invoke(
        'capture-registration-location',
        {
          body: {},
        }
      ).then(({ error }) => {
        if (error) {
          console.error(
            'Location capture error:',
            error.message
          );
        }
      }).catch((locationError) => {
        console.error(
          'Location capture failed:',
          locationError
        );
      });

    } catch (err: unknown) {
      console.error('Authentication error:', err);

      const message =
        err instanceof Error
          ? err.message
          : 'Authentication failed. Please try again.';

      setError(message);
      setVerificationStatus(null);

      generateCaptcha();
      setUserCaptchaInput('');

    } finally {
      setLoading(false);
    }
  };

  return (
<div className="w-full min-h-screen min-h-[100dvh] bg-[#02091d] flex items-center justify-center p-3 sm:p-4 relative font-sans overflow-x-hidden">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none z-0 opacity-20 mix-blend-screen"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&q=80')",
        }}
      />

      <div className="fixed inset-0 bg-gradient-to-b from-[#02091d]/90 via-[#051642]/85 to-[#010617]/95 pointer-events-none z-0" />

      {/* VERIFICATION AND SUCCESS CARD */}
{/* VERIFICATION AND SUCCESS CARD */}
{verificationStatus && (
  <div
    className="fixed inset-0 flex items-center justify-center p-4 bg-[#02091d]/75 backdrop-blur-sm"
    style={{ zIndex: 999999 }}
  >
    <div className="w-full max-w-[290px] p-6 rounded-2xl bg-slate-950 border-2 border-cyan-400/70 shadow-[0_0_35px_rgba(6,182,212,0.45)] text-center relative overflow-hidden">

      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500" />

      {verificationStatus === 'verifying' ? (
        <>
          <div className="w-14 h-14 mx-auto mb-4 rounded-full border-4 border-cyan-400/20 border-t-cyan-400 animate-spin shadow-[0_0_18px_rgba(6,182,212,0.35)]" />

          <h3 className="text-lg font-black text-cyan-300 tracking-wide">
            Verifying...
          </h3>

          <p className="text-xs text-sky-100/80 mt-2">
            Please wait while we verify your information and process your account.
          </p>
        </>
      ) : (
        <>
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-cyan-400/15 border-2 border-cyan-400 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-cyan-300"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h3 className="text-lg font-black text-cyan-300">
            {isLogin
              ? 'Login Successful!'
              : 'Registration Successful!'}
          </h3>

          <p className="text-xs text-sky-100/80 mt-2">
            {isLogin
              ? 'Your login has been verified successfully.'
              : 'Your account has been created successfully.'}
          </p>
        </>
      )}

      <div className="mt-5 h-1 w-full rounded-full bg-blue-950 overflow-hidden">
        <div className="h-full w-full bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 animate-pulse" />
      </div>

    </div>
  </div>
)}
      {/* EXISTING AUTH CARD */}
     
     
      <div className="bg-slate-950/90 border border-blue-500/40 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-[0_0_50px_rgba(6,182,212,0.25)] relative z-10 backdrop-blur-xl">

        <div className="text-center space-y-1.5">
          <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-blue-400 uppercase tracking-wide">
            Digital Marketing
          </h1>

          <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest border-t border-b border-blue-900/60 py-0.5 inline-block px-3">
            E COMMERCE
          </p>

          <div className="pt-2">
            <div className="w-20 h-20 mx-auto rounded-2xl overflow-hidden border-2 border-cyan-400/50 p-0.5 bg-gradient-to-tr from-cyan-500 via-blue-600 to-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex flex-col items-center justify-center p-1 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 to-transparent pointer-events-none" />

                <svg
                  className="w-7 h-7 text-cyan-400 mb-0.5 filter drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
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

        <form
          onSubmit={handleSubmit}
          className="space-y-3"
        >
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
              autoComplete={
                isLogin
                  ? 'current-password'
                  : 'new-password'
              }
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
                onChange={(e) =>
                  setInvitationCode(e.target.value)
                }
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
                onChange={(e) =>
                  setUserCaptchaInput(e.target.value)
                }
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
              if (loading) return;

              setIsLogin(!isLogin);
              setError(null);
              setPassword('');
              setUserCaptchaInput('');
              setVerificationStatus(null);
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
