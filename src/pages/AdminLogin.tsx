
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError('');

    const userEmail = email.trim().toLowerCase();
    const allowedAdmins = ['adoochen64@gmail.com'];

    let authenticated = false;

    try {
      // 1. Previous session clear karein.
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        console.warn('Previous session sign-out warning:', signOutError);
      }

      // 2. Supabase Authentication se login.
      const {
        data: authData,
        error: authError,
      } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password,
      });

      if (authError) {
        console.error('Supabase Auth login failed:', {
          message: authError.message,
          status: authError.status,
          code: authError.code,
        });

        throw new Error(`Authentication failed: ${authError.message}`);
      }

      if (!authData.user || !authData.session) {
        throw new Error('Supabase did not return a valid login session.');
      }

      authenticated = true;

      const authenticatedEmail =
        authData.user.email?.trim().toLowerCase();

      if (!authenticatedEmail || authenticatedEmail !== userEmail) {
        throw new Error('Authenticated email verification failed.');
      }

      // 3. Auth user ID se uska profile verify karein.
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, role, is_subadmin')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profileError) {
        throw new Error(
          `Could not verify admin profile: ${profileError.message}`
        );
      }

      if (!profile) {
        throw new Error('No matching profile found for this Auth user.');
      }

      if (
        profile.email?.trim().toLowerCase() !== userEmail ||
        profile.role?.trim().toLowerCase() !== 'admin'
      ) {
        throw new Error('Email or admin profile verification failed.');
      }

      // ==========================================
      // 4. MAIN ADMIN VERIFICATION
      // ==========================================
      if (allowedAdmins.includes(userEmail)) {
        if (profile.is_subadmin !== false) {
          throw new Error(
            'Main Admin profile must have is_subadmin = false. Check the profiles table.'
          );
        }

        localStorage.setItem('current_admin_role', 'admin');
        localStorage.removeItem('sub_admin_logged_in');

        navigate('/admin/dashboard', { replace: true });
        return;
      }

      // ==========================================
      // 5. SUB-ADMIN VERIFICATION
      // ==========================================
      const { data: subAdmins, error: subAdminError } = await supabase
        .from('sub_admins')
        .select('id, email')
        .ilike('email', userEmail)
        .limit(2);

      if (subAdminError) {
        throw new Error(
          `Could not verify Sub-Admin account: ${subAdminError.message}`
        );
      }

      if (!subAdmins || subAdmins.length === 0) {
        throw new Error(
          'No matching Sub-Admin record found in sub_admins.'
        );
      }

      if (subAdmins.length > 1) {
        throw new Error(
          'Duplicate Sub-Admin email records found. Resolve duplicate records first.'
        );
      }

      const subAdmin = subAdmins[0];

      if (subAdmin.email?.trim().toLowerCase() !== userEmail) {
        throw new Error('Sub-Admin email verification failed.');
      }

      if (profile.is_subadmin !== true) {
        throw new Error(
          'Sub-Admin profile must have is_subadmin = true. Check the profiles table.'
        );
      }

      // Sub-Admin identity verified.
      localStorage.setItem('sub_admin_logged_in', userEmail);
      localStorage.setItem('current_admin_role', 'subadmin');

      navigate('/admin/dashboard', { replace: true });
    } catch (err: unknown) {
      // Rejected authenticated session clear karein.
      if (authenticated) {
        const { error: cleanupError } = await supabase.auth.signOut();

        if (cleanupError) {
          console.error('Session cleanup failed:', cleanupError);
        }
      }

      localStorage.removeItem('sub_admin_logged_in');
      localStorage.removeItem('current_admin_role');

      const message =
        err instanceof Error
          ? err.message
          : 'Login failed. Please try again.';

      console.error('Admin login error:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#02091d] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0a1535] border border-cyan-500/30 rounded-2xl p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-cyan-400 text-center mb-2">
          Admin Control Portal
        </h2>

        <p className="text-gray-400 text-center text-xs mb-6">
          Sign in with administrator credentials
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 text-xs p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-cyan-300 mb-1 uppercase">
              Admin Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              className="w-full bg-[#02091d] border border-cyan-500/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-400"
              placeholder="admin@gmail.com"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-cyan-300 mb-1 uppercase">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full bg-[#02091d] border border-cyan-500/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-400"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold py-2.5 rounded shadow-lg hover:from-amber-400 hover:to-amber-500 transition duration-200 mt-2 text-sm disabled:opacity-60"
          >
            {loading ? 'Signing In...' : 'SIGN IN AS ADMIN'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
