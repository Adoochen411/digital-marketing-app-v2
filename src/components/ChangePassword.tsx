import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export const ChangePassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    if (newPassword !== confirmPassword) {
      setIsError(true);
      setMessage('Passwords match nahi kar rahe hain!');
      return;
    }

    if (newPassword.length < 6) {
      setIsError(true);
      setMessage('Password kam az kam 6 characters ka hona chahiye.');
      return;
    }

    setLoading(true);

    try {
      // Supabase Auth update user password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        setIsError(true);
        setMessage('Error: ' + error.message);
      } else {
        setIsError(false);
        setMessage('Admin password kamiyabi se update ho gaya hai!');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setIsError(true);
      setMessage('Kuch unexpected error aa gaya hai.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 max-w-lg border border-gray-100 mt-6">
      <h3 className="text-lg font-bold text-blue-900 mb-1">
        Admin Security Settings
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Apne admin account ka password yahan se direct update karein.
      </p>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-xs font-semibold text-center ${isError ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-green-100 text-green-700 border border-green-300'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleUpdatePassword} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            New Password
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Confirm New Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg text-sm transition shadow-md w-full"
        >
          {loading ? 'Updating Password...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
};