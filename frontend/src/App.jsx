
import React, { useEffect, useState, useRef } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet
} from 'react-router-dom';

import { supabase } from './supabaseClient';

import Layout from './components/Layout/Layout';
import InternalOutputsPage from './pages/InternalOutputsPage';
import CustomerReturnsPage from './pages/CustomerReturnsPage';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import InvoicesPage from './pages/InvoicesPage';
import CustomersPage from './pages/CustomersPage';
import SuppliersPage from './pages/SuppliersPage';
import ExpensesPage from './pages/ExpensesPage';
import ReportsPage from './pages/ReportsPage';
import CategoriesPage from './pages/CategoriesPage';
import PurchasesPage from './pages/PurchasesPage';
import SalesPage from './pages/SalesPage';
import UsersPage from './pages/UsersPage';
import CashierPage from './pages/CashierPage';

// Protection des pages avec la session Supabase
const ProtectedRoute = () => {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Écouter les changements de session
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) {
        setSession(newSession);
        setChecking(false);
      }
    });

    // Vérifier la session existante
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;

      if (error) {
        console.error('Erreur session Supabase:', error);
        setSession(null);
      } else {
        setSession(data.session);
      }

      setChecking(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (checking) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '16px',
          color: '#1f6f78'
        }}
      >
        Vérification de la connexion...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Route publique */}
        <Route path="/login" element={<LoginPage />} />

        {/* Routes protégées */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/purchases" element={<PurchasesPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/reports/stock" element={<ReportsPage />} />
          <Route path="/reports/history" element={<ReportsPage />} />
          <Route path="/reports/inventory" element={<ReportsPage />} />
          <Route path="/reports/profits" element={<ReportsPage />} />
          <Route path="/reports/movements" element={<ReportsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/caise" element={<CashierPage />} />
          <Route path="/internal-outs" element={<InternalOutputsPage />} />
          <Route path="/customer-returns" element={<CustomerReturnsPage />} />
        </Route>

        {/* Page inconnue */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
