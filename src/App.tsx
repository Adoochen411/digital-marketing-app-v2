import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminLogin } from './pages/AdminLogin';
import { AdminRoute } from './components/AdminRoute';
import { AdminDashboard } from './pages/AdminDashboard';
import { SubAdminDashboard } from './pages/SubAdminDashboard';

// Customer pages
import { AuthPage } from './pages/AuthPage';
import CustomerDashboard from './pages/CustomerDashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Customer Routes */}
          <Route path="/" element={<AuthPage />} />
          <Route path="/dashboard" element={<CustomerDashboard />} />

          {/* Admin & Sub-Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          
          <Route 
            path="/admin/dashboard" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />

          {/* Sub-Admin Portal Route */}
          <Route 
            path="/sub-admin/dashboard" 
            element={
              <AdminRoute>
                <SubAdminDashboard />
              </AdminRoute>
            } 
          />

          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}