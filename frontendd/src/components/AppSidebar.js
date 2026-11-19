// AppSidebar.js
import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  CCloseButton,
  CSidebar,
  CImage,
  CSidebarFooter,
  CSidebarHeader,
  CSidebarToggler,
} from '@coreui/react'
import { AppSidebarNav } from './AppSidebarNav'
import navigation from '../_nav'

const AppSidebar = () => {
  const dispatch = useDispatch()
  const unfoldable = useSelector((state) => state.sidebarUnfoldable)
  const sidebarShow = useSelector((state) => state.sidebarShow)

  // Ajout du style global dans le head
  React.useEffect(() => {
    const style = document.createElement('style')
    style.innerHTML = `
      /* Style pour le bouton toggler */
      .custom-sidebar-toggler {
        background-color: #007A3D !important;
        color: white !important;
        border: none !important;
        border-radius: 4px !important;
        padding: 5px 10px !important;
        transition: all 0.3s ease !important;
        cursor: pointer !important;
        font-weight: bold !important;
        font-size: 0.875rem !important;
      }

      .custom-sidebar-toggler:hover {
        background-color: #005a2c !important;
        transform: scale(1.05) !important;
      }

      /* Style global pour la sidebar - PREND TOUTE LA HAUTEUR */
      .cs-sidebar {
        font-size: 16px !important;
        width: 280px !important;
        height: 100vh !important;
        min-height: 100vh !important;
        display: flex !important;
        flex-direction: column !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
      }

      /* Structure interne de la sidebar */
      .sidebar {
        height: 100% !important;
        display: flex !important;
        flex-direction: column !important;
      }

      /* Le conteneur de navigation prend tout l'espace restant */
      .sidebar-nav-container {
        flex: 1 !important;
        overflow-y: auto !important;
      }

      /* Header et footer fixes */
      .sidebar-header {
        flex-shrink: 0 !important;
        padding: 20px 0 !important;
      }

      .sidebar-footer {
        flex-shrink: 0 !important;
        margin-top: auto !important;
        padding: 15px !important;
      }

      /* Style des liens de navigation */
      .cs-sidebar .nav-link {
        font-size: 15px !important;
        padding: 12px 20px !important;
      }

      .cs-sidebar .nav-title {
        font-size: 14px !important;
        padding: 15px 20px 5px !important;
        font-weight: bold !important;
        color: #6c757d !important;
      }

      .cs-sidebar .nav-icon {
        font-size: 20px !important;
        margin-right: 15px !important;
      }

      /* Style pour le header avec la date dans le contenu principal */
      .main-header {
        font-size: 18px;
        padding: 20px;
        background-color: #f8f9fa;
        border-bottom: 1px solid #dee2e6;
        font-weight: 500;
        margin-bottom: 20px;
      }

      .user-info {
        font-size: 16px;
        font-weight: 500;
        padding: 10px 20px;
        background-color: #f8f9fa;
        border-radius: 8px;
        display: inline-block;
      }

      /* Style pour les onglets */
      .nav-tabs-custom {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
        border-bottom: 1px solid #dee2e6;
        padding-bottom: 10px;
      }

      .nav-tab {
        padding: 10px 20px;
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 5px;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .nav-tab.active {
        background-color: #007A3D;
        color: white;
        border-color: #007A3D;
      }

      .nav-tab:hover:not(.active) {
        background-color: #e9ecef;
      }

      /* Style pour le contenu principal */
      .main-content {
        margin-left: 280px;
        padding: 20px;
        min-height: 100vh;
        background-color: #f4f6f9;
      }

      /* Style pour le tableau de bord */
      .dashboard-card {
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      .dashboard-title {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 20px;
        color: #333;
      }

      /* Style pour l'image logo */
      .sidebar-logo {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        padding: 10px;
      }

      /* Responsive */
      @media screen and (max-width: 768px) {
        .cs-sidebar {
          font-size: 14px !important;
          width: 240px !important;
        }
        
        .cs-sidebar .nav-link {
          padding: 10px 15px !important;
        }

        .main-content {
          margin-left: 240px;
        }
      }

      @media screen and (max-width: 576px) {
        .main-content {
          margin-left: 0;
        }
      }
    `
    
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return (
    <CSidebar
      className="border-end sidebar"
      colorScheme="light"
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={(visible) => {
        dispatch({ type: 'set', sidebarShow: visible })
      }}
      style={{
        height: '100vh',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <CSidebarHeader className="border-bottom sidebar-header">
        <div className="sidebar-logo">
          <CImage
            src="https://media.licdn.com/dms/image/v2/D4E3DAQGM68xwSSCFCg/image-scale_127_750/image-scale_127_750/0/1715079332681/attm_s_a_cover?e=2147483647&v=beta&t=wY774xUWmaXWX_WHCJFkwrbVvaq2ScJ4eCFf-CEHxuc"
            style={{
              width: unfoldable ? '80px' : '250px',
              height: unfoldable ? '200px' : 'auto',
              maxHeight: '300px',
              transition: 'all 0.3s ease',
              objectFit: 'contain',
              objectPosition: 'center'
            }}
            alt="ATTM"
          />
        </div>
        <CCloseButton
          className="d-lg-none position-absolute top-0 end-0 m-2"
          dark
          onClick={() => dispatch({ type: 'set', sidebarShow: false })}
        />
      </CSidebarHeader>
      
      <div className="sidebar-nav-container" style={{ overflowY: 'auto', flex: 1 }}>
        <AppSidebarNav items={navigation} />
      </div>
      
      <CSidebarFooter className="border-top sidebar-footer">
        <CSidebarToggler
          onClick={() => dispatch({ type: 'set', sidebarUnfoldable: !unfoldable })}
          className="custom-sidebar-toggler"
        />
      </CSidebarFooter>
    </CSidebar>
  )
}

export default React.memo(AppSidebar)