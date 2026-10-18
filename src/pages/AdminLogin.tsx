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
      const userEmail = (email || '').toLowerCase().trim();
const allowedAdmins = ['adoochen64@gmail.com'];
      // 1. Check if Main Admin
      if (allowedAdmins.includes(userEmail)) {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;

        localStorage.setItem('current_admin_role', 'admin');
        navigate('/admin/dashboard');
        return;
      }

      // 2. Check Sub-Admin table directly (with password check)
      const { data: subAdmin, error: subErr } = await supabase
        .from('sub_admins')
        .select('*')
        .eq('email', userEmail)
        .maybeSingle();

      if (subErr || !subAdmin) {
        setError('Unauthorized access. Email not found in sub-admins.');
        setLoading(false);
        return;
      }

      // Password check for Sub-Admin
      if (subAdmin.password && subAdmin.password !== password) {
        setError('Invalid password for sub-admin.');
        setLoading(false);
        return;
      }

      localStorage.setItem('sub_admin_logged_in', userEmail);
      localStorage.setItem('current_admin_role', 'subadmin');
      navigate('/sub-admin/dashboard'); // 👈 Correct path with hyphen matching App.tsx
    } catch (err: any) {
      setError(err.message || 'Invalid login credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#02091d] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0a1535] border border-cyan-500/30 rounded-2xl p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-cyan-400 text-center mb-2">Admin Control Portal</h2>
        <p className="text-gray-400 text-center text-xs mb-6">Sign in with administrator credentials</p>

        {error && <div className="bg-red-500/10 border border-red-500 text-red-400 text-xs p-3 rounded mb-4">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-cyan-300 mb-1 uppercase">Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#02091d] border border-cyan-500/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-400"
              placeholder="admin@gmail.com"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-cyan-300 mb-1 uppercase">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#02091d] border border-cyan-500/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-400"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold py-2.5 rounded shadow-lg hover:from-amber-400 hover:to-amber-500 transition duration-200 mt-2 text-sm"
          >
            {loading ? 'Signing In...' : 'SIGN IN AS ADMIN'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;