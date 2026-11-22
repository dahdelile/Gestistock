// src/App.js
import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useColorModes } from '@coreui/react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'leaflet/dist/leaflet.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './scss/style.scss';
import { supabase } from './supabaseClient';

// Pages
const Accueil = React.lazy(() => import('./views/home/accueil/Accueil'));
const PageConnection = React.lazy(() => import('./views/pages/pageConnection/PageConnection'));

// Layout
const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'));

const routes = [
  { path: '/home/accueil', name: 'Accueil', element: Accueil },
];

// ✅ Qui peut voir quoi ?
// admin = tout, manager = presque tout sauf Utilisateurs, cashier = ventes + caisse, stock = stock + produits
const ROLE_ROUTES = {
  admin: ['*'], // tout
  manager: ['/home/accueil', '/ventes', '/products', '/categories', '/customers', '/suppliers', '/purchases', '/expenses', '/caisse', '/returns', '/internal-outputs'],
  cashier: ['/home/accueil', '/ventes', '/customers', '/caisse', '/returns'],
  stock: ['/home/accueil', '/products', '/categories', '/suppliers', '/purchases', '/internal-outputs'],
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loggedUser, setLoggedUser] = useState(null);
  const { isColorModeSet, setColorMode } = useColorModes('coreui-free-react-admin-template-theme');

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') || 'light';
    const urlParams = new URLSearchParams(window.location.search);
    const theme = urlParams.get('theme')?.match(/^[A-Za-z0-9\s]+/);
    if (theme) setColorMode(theme[0]);
    else if (!isColorModeSet()) setColorMode(storedTheme);
  }, [setColorMode, isColorModeSet]);

  // ✅ Récupère le rôle depuis profiles
  const loadUserWithRole = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setIsAuthenticated(false);
      setLoggedUser(null);
      return;
    }
    setIsAuthenticated(true);

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status, name')
      .eq('id', session.user.id)
      .single();

    setLoggedUser({
      id: session.user.id,
      email: session.user.email,
      name: profile?.name || session.user.user_metadata?.name || session.user.email,
      role: (profile?.role || session.user.user_metadata?.role || 'cashier').toLowerCase(),
      status: profile?.status || 'active',
    });
  }, []);

  useEffect(() => {
    loadUserWithRole();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => loadUserWithRole());
    const handleAuthChange = () => loadUserWithRole();
    window.addEventListener('authChange', handleAuthChange);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, [loadUserWithRole]);

  const handleLogin = useCallback(() => {
    loadUserWithRole();
    window.dispatchEvent(new Event('authChange'));
  }, [loadUserWithRole]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setLoggedUser(null);
    window.dispatchEvent(new Event('authChange'));
  }, []);

  const LoadingSpinner = () => (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Chargement...</span></div>
    </div>
  );

  if (isAuthenticated === null) return <LoadingSpinner />;

  // ✅ Filtre les routes selon le rôle
  const allowed = ROLE_ROUTES[loggedUser?.role] || ROLE_ROUTES.cashier;
  const filteredRoutes = allowed.includes('*')
    ? routes
    : routes.filter((r) => allowed.includes(r.path));

  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route
            path="/pageConnection"
            element={isAuthenticated ? <Navigate to="/home/accueil" replace /> : <PageConnection onLogin={handleLogin} />}
          />
          <Route path="/login" element={<Navigate to="/pageConnection" replace />} />
          <Route
            path="/"
            element={isAuthenticated ? <Navigate to="/home/accueil" replace /> : <Navigate to="/pageConnection" replace />}
          />
          <Route
            path="/*"
            element={
              isAuthenticated ? (
                <DefaultLayout routes={filteredRoutes} user={loggedUser} onLogout={handleLogout} />
              ) : (
                <Navigate to="/pageConnection" replace />
              )
            }
          />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;