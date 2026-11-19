import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useColorModes } from '@coreui/react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'leaflet/dist/leaflet.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './scss/style.scss';

// Pages - IMPORTANT: Utilisez le chemin correct vers votre LoginPage
const LoginPage = React.lazy(() => import('./views/pages/loginPage/LoginPage')); // Votre page de login personnalisée
const Accueil = React.lazy(() => import('./views/home/accueil/Accueil'));
const PageConnection = React.lazy(() => import('./views/pages/pageConnection/PageConnection'));

// Layout
const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'));

// Routes disponibles dans le layout
const routes = [
  { path: '/home/accueil', name: 'Accueil', element: Accueil },
  // Vous pouvez ajouter d'autres routes ici
];

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isColorModeSet, setColorMode } = useColorModes('coreui-free-react-admin-template-theme');

  // Fonction pour vérifier l'authentification
  const checkAuth = useCallback(() => {
    try {
      const token = localStorage.getItem('auth_token') || 
                    sessionStorage.getItem('auth_token') ||
                    localStorage.getItem('access_token') || 
                    sessionStorage.getItem('access_token');
      
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'authentification:', error);
      return false;
    }
  }, []);

  // Fonction pour vérifier si le token est valide
  const validateToken = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return false;

    try {
      // Vous pouvez ajouter une vérification API ici si nécessaire
      // Par exemple: vérifier si le token est expiré
      return true;
    } catch (error) {
      console.error('Erreur validation token:', error);
      return false;
    }
  }, []);

  // Effet pour l'initialisation du thème
  useEffect(() => {
    const initTheme = () => {
      const storedTheme = localStorage.getItem('theme') || 'light';
      const urlParams = new URLSearchParams(window.location.search);
      const theme = urlParams.get('theme')?.match(/^[A-Za-z0-9\s]+/);
      
      if (theme) {
        setColorMode(theme[0]);
      } else if (!isColorModeSet()) {
        setColorMode(storedTheme);
      }
    };

    initTheme();
  }, [setColorMode, isColorModeSet]);

  // Effet pour la vérification de l'authentification au chargement
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      
      // Vérifier l'authentification locale
      const hasLocalAuth = checkAuth();
      
      if (hasLocalAuth) {
        // Optionnel: Valider le token auprès du serveur
        const isValid = await validateToken();
        if (isValid) {
          setIsAuthenticated(true);
        } else {
          // Token invalide, nettoyer le localStorage
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          localStorage.removeItem('user_permissions');
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      
      setLoading(false);
    };

    initializeAuth();

    // Écouter les changements de localStorage
    const handleStorageChange = (e) => {
      if (e.key === 'auth_token' || e.key === 'user') {
        setIsAuthenticated(checkAuth());
      }
    };

    // Écouter les événements personnalisés pour les mises à jour d'auth
    const handleAuthChange = () => {
      setIsAuthenticated(checkAuth());
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, [checkAuth, validateToken]);

  // Fonction pour déclencher une mise à jour de l'authentification
  const handleLogin = useCallback((userData = null) => {
    if (userData) {
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    }
    setIsAuthenticated(true);
    // Déclencher un événement personnalisé pour notifier d'autres composants
    window.dispatchEvent(new Event('authChange'));
  }, []);

  const handleLogout = useCallback(() => {
    // Nettoyer le localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_permissions');
    localStorage.removeItem('rememberedEmail');
    
    // Nettoyer sessionStorage aussi
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user');
    
    setIsAuthenticated(false);
    setUser(null);
    
    // Déclencher un événement personnalisé pour notifier d'autres composants
    window.dispatchEvent(new Event('authChange'));
  }, []);

  // Loading spinner
  const LoadingSpinner = () => (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <div className="text-center">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Chargement...</span>
        </div>
        <p className="mt-3">Chargement de l'application...</p>
      </div>
    </div>
  );

  // Afficher le spinner pendant le chargement initial
  if (loading) {
    return <LoadingSpinner />;
  }

  // Composant Suspense pour le lazy loading
  const withSuspense = (Component) => (
    <Suspense fallback={<LoadingSpinner />}>
      <Component />
    </Suspense>
  );

  return (
    <Router>
      <Routes>
        {/* Route pour la page de login personnalisée */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/home/accueil" replace />
            ) : (
              <Suspense fallback={<LoadingSpinner />}>
                <LoginPage onLogin={handleLogin} />
              </Suspense>
            )
          }
        />

        {/* Ancienne page de connexion (optionnel - redirige vers la nouvelle) */}
        <Route
          path="/pageConnection"
          element={<Navigate to="/login" replace />}
        />

        {/* Route racine - Redirige vers /home/accueil si authentifié, sinon vers /login */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/home/accueil" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Routes protégées avec layout */}
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <Suspense fallback={<LoadingSpinner />}>
                <DefaultLayout 
                  routes={routes} 
                  user={user}
                  onLogout={handleLogout}
                />
              </Suspense>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;