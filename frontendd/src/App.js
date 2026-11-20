import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useColorModes } from '@coreui/react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'leaflet/dist/leaflet.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './scss/style.scss';

// Pages
const Accueil = React.lazy(() => import('./views/home/accueil/Accueil'));

// Layout
const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'));

// Routes disponibles dans le layout
const routes = [
  { path: '/home/accueil', name: 'Accueil', element: Accueil },
];

function App() {
  const { isColorModeSet, setColorMode } = useColorModes('coreui-free-react-admin-template-theme');

  // Thème
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') || 'light';
    const urlParams = new URLSearchParams(window.location.search);
    const theme = urlParams.get('theme')?.match(/^[A-Za-z0-9\s]+/);

    if (theme) {
      setColorMode(theme[0]);
    } else if (!isColorModeSet()) {
      setColorMode(storedTheme);
    }
  }, [setColorMode, isColorModeSet]);

  // Utilisateur fictif pour ne pas casser DefaultLayout qui attend un user
  const fakeUser = {
    name: 'Invité',
    email: 'invite@test.com',
    role: 'admin',
  };

  const handleLogout = () => {
    // Pas de vrai logout, on reste sur l'accueil
    window.location.href = '/home/accueil';
  };

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

  return (
    <Router>
      <Routes>
        {/* Plus de login : tout redirige vers l'accueil */}
        <Route path="/login" element={<Navigate to="/home/accueil" replace />} />
        <Route path="/pageConnection" element={<Navigate to="/home/accueil" replace />} />
        <Route path="/" element={<Navigate to="/home/accueil" replace />} />

        {/* Routes avec layout - toujours accessibles sans login */}
        <Route
          path="/*"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <DefaultLayout
                routes={routes}
                user={fakeUser}
                onLogout={handleLogout}
              />
            </Suspense>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;