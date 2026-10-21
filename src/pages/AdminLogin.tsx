
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
    setLoading(true);
    setError('');

    try {
      const userEmail = email.toLowerCase().trim();
      const allowedAdmins = ['adoochen64@gmail.com'];

      // 1. Main Admin Login
      if (allowedAdmins.includes(userEmail)) {
        // Clear previous Supabase session
        const { error: signOutError } = await supabase.auth.signOut();

        if (signOutError) {
          console.error('Previous session sign-out error:', signOutError);
        }

        const { data: authData, error: authError } =
          await supabase.auth.signInWithPassword({
            email: userEmail,
            password,
          });

        if (authError) {
          throw authError;
        }

        if (
          !authData.session ||
          authData.user?.email?.toLowerCase() !== 'adoochen64@gmail.com'
        ) {
          await supabase.auth.signOut();
          throw new Error('Main admin authentication failed.');
        }

        localStorage.setItem('current_admin_role', 'admin');
        localStorage.removeItem('sub_admin_logged_in');

        navigate('/admin/dashboard');
        return;
      }

      // 2. Sub-Admin lookup
      const { data: subAdmin, error: subErr } = await supabase
        .from('sub_admins')
        .select('*')
        .eq('email', userEmail)
        .maybeSingle();

      if (subErr) {
        throw subErr;
      }

      if (!subAdmin) {
        setError('Unauthorized access. Email not found in sub-admins.');
        return;
      }

      // 3. Sub-Admin password check
      if (!subAdmin.password || subAdmin.password !== password) {
        setError('Invalid password for sub-admin.');
        return;
      }

      // 4. Sub-Admin login
      localStorage.setItem('sub_admin_logged_in', userEmail);
      localStorage.setItem('current_admin_role', 'subadmin');

      navigate('/admin/dashboard');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Login failed. Please try again.';

      console.error('Admin login error:', message);
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
