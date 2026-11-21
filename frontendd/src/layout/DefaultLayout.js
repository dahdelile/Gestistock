import React, { useState } from 'react';
import { AppSidebar, AppHeader, AppContent, AppFooter } from '../components';

const DefaultLayout = ({ routes, user, onLogout }) => {
  const [sidebarShow, setSidebarShow] = useState(true);
  const [sidebarUnfoldable, setSidebarUnfoldable] = useState(false);

  return (
    <div dir="ltr">
      <AppSidebar
        sidebarShow={sidebarShow}
        setSidebarShow={setSidebarShow}
        sidebarUnfoldable={sidebarUnfoldable}
        setSidebarUnfoldable={setSidebarUnfoldable}
      />
      <div className="wrapper d-flex flex-column min-vh-100">
        <AppHeader
          sidebarShow={sidebarShow}
          setSidebarShow={setSidebarShow}
          user={user}
          onLogout={onLogout}
        />
        <div className="body flex-grow-1 px-0">
          <AppContent routes={routes} />
        </div>
        <AppFooter />
      </div>
    </div>
  );
};

export default DefaultLayout;