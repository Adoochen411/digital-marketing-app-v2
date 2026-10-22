
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

    const userEmail = email.toLowerCase().trim();
    const allowedAdmins = ['adoochen64@gmail.com'];

    try {
      // 1. Main Admin ya Sub-Admin account identify karein.
      const isMainAdmin = allowedAdmins.includes(userEmail);

      let subAdmin: { id: string; email: string } | null = null;

      if (!isMainAdmin) {
        const { data, error: lookupError } = await supabase
          .from('sub_admins')
          .select('id, email')
          .ilike('email', userEmail)
          .maybeSingle();

        if (lookupError) {
          throw new Error(
            `Could not verify Sub-Admin account: ${lookupError.message}`
          );
        }

        if (!data) {
          throw new Error(
            'Unauthorized access. Email not found in Sub-Admin accounts.'
          );
        }

        subAdmin = data;
      }

      // 2. Purana session clear karein.
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        console.warn('Previous session sign-out warning:', signOutError);
      }

      // 3. DONO account types Supabase Auth se login karenge.
      const {
        data: authData,
        error: authError,
      } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password,
      });

      if (authError) {
        throw new Error(
          'Invalid email or password, or this account is not configured in Supabase Authentication.'
        );
      }

      if (
        !authData.session ||
        !authData.user ||
        authData.user.email?.toLowerCase() !== userEmail
      ) {
        await supabase.auth.signOut();
        throw new Error('Authentication session could not be verified.');
      }

      // 4. Database profile ko verify karein.
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, is_subadmin')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profileError) {
        await supabase.auth.signOut();

        throw new Error(
          `Could not verify admin profile: ${profileError.message}`
        );
      }

      if (!profile || profile.role !== 'admin') {
        await supabase.auth.signOut();

        throw new Error(
          'This Supabase account does not have an admin profile.'
        );
      }

      // 5. Main Admin verification.
      if (isMainAdmin) {
        if (profile.is_subadmin !== false) {
          await supabase.auth.signOut();

          throw new Error(
            'Main Admin profile is not configured correctly. Check profiles.is_subadmin.'
          );
        }

        localStorage.setItem('current_admin_role', 'admin');
        localStorage.removeItem('sub_admin_logged_in');

        navigate('/admin/dashboard', { replace: true });
        return;
      }

      // 6. Sub-Admin verification.
      if (!subAdmin) {
        await supabase.auth.signOut();
        throw new Error('Sub-Admin account could not be verified.');
      }

      if (profile.is_subadmin !== true) {
        await supabase.auth.signOut();

        throw new Error(
          'Sub-Admin profile is not configured correctly. Check profiles.is_subadmin.'
        );
      }

      if (
        subAdmin.email.toLowerCase() !==
        authData.user.email?.toLowerCase()
      ) {
        await supabase.auth.signOut();
        throw new Error('Sub-Admin email verification failed.');
      }

      localStorage.setItem('sub_admin_logged_in', userEmail);
      localStorage.setItem('current_admin_role', 'subadmin');

      navigate('/admin/dashboard', { replace: true });
    } catch (err: unknown) {
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
