// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import InternalOutputsPage from './pages/InternalOutputsPage';
import CustomerReturnsPage from './pages/CustomerReturnsPage';
// Pages
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

// Composant de protection des routes (vérifie si l'utilisateur est connecté)
const ProtectedRoute = () => {
    const token = localStorage.getItem('token');
    if (!token) {
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

                {/* Routes protégées (nécessitent une connexion) */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<Navigate to="/dashboard" />} />
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

                {/* Route 404 - Redirection */}
                <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
        </Router>
    );
};

export default App;