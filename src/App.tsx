import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { testTrc20Scanner } from './lib/scanner-test';
import { AuthProvider } from './context/AuthContext';
import { AdminLogin } from './pages/AdminLogin';
import { AdminRoute } from './components/AdminRoute';
import { AdminDashboard } from './pages/AdminDashboard';
import { SubAdminDashboard } from './pages/SubAdminDashboard';

// Customer pages
import { AuthPage } from './pages/AuthPage';
import CustomerDashboard from './pages/CustomerDashboard';

export default function App() {
 
 const runScannerTest = async () => {
  await testTrc20Scanner();
};
   return (
    <AuthProvider>
      <BrowserRouter>

        <button
          onClick={runScannerTest}
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 99999,
            padding: '12px 16px',
            background: '#111',
            color: '#fff',
            border: '1px solid #d4af37',
            borderRadius: 8,
            cursor: 'pointer'
          }}
        >
          Test TRC20 Scanner
        </button>

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

          {/* Sub-Admin Portal Route */}s
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