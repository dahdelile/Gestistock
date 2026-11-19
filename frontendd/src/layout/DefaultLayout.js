import React from 'react';
import { AppSidebar, AppHeader, AppContent, AppFooter } from '../components';

const DefaultLayout = () => {
  return (
    <div>
      {/* Sidebar */}
      <AppSidebar />

      {/* Conteneur principal */}
      <div className="wrapper d-flex flex-column min-vh-100">
        
        {/* En-tête */}
        <AppHeader />

        {/* Contenu principal (flexible) */}
      <div className="body flex-grow-1 px-0">
          <AppContent />
        </div>

        {/* Pied de page */}
        <AppFooter />

      </div>
    </div>
  );
};

export default DefaultLayout;