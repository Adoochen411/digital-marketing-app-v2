import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      // 1. Pehle Local Storage check karein (Sub-admin ke liye sabse fast aur secure method)
      const subAdminEmail = localStorage.getItem('sub_admin_logged_in');
      const adminRole = localStorage.getItem('current_admin_role');

      if (subAdminEmail || adminRole) {
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      // 2. Agar local storage mein nahi hai, toh Supabase Session check karein
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const allowedAdmins = ['admin@gmail.com', 'adoochen64@gmail.com'];
        const userEmail = (user.email || '').toLowerCase().trim();

        // Direct Email Check
        if (allowedAdmins.includes(userEmail)) {
          setIsAdmin(true);
          setLoading(false);
          return;
        }

        // Database Profile Role Check
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        // Sub-Admin Database Check
        const { data: subAdmin } = await supabase
          .from('sub_admins')
          .select('id')
          .eq('email', userEmail)
          .single();

        if (profile?.role === 'admin' || subAdmin) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    } catch (err) {
      console.error('Admin Check Error:', err);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-900 text-white font-bold text-sm">
        Loading Admin Dashboard...
      </div>
    );
  }

  return isAdmin ? <>{children}</> : <Navigate to="/admin/login" replace />;
};