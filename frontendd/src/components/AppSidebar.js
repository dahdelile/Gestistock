import React from 'react'
import {
  CCloseButton,
  CSidebar,
  CSidebarFooter,
  CSidebarHeader,
  CSidebarToggler,
  CImage,
} from '@coreui/react'
import { AppSidebarNav } from './AppSidebarNav'
import getNav from '../_nav'
import logo from '../assets/images/logo.png'
import { useLanguage } from '../context/LanguageContext'

const AppSidebar = ({ sidebarShow, setSidebarShow, sidebarUnfoldable, setSidebarUnfoldable }) => {
  // 👇 LIGNE 16 CORRIGÉE : on ne déstructure plus directement, on protège
  const langContext = useLanguage() || {}
  const tFn = langContext.t
  const t = typeof tFn === 'function' ? tFn : (key) => key
  const navigation = typeof getNav === 'function' ? getNav(t) : getNav

  return (
    <div dir="ltr" style={{ position: 'relative' }}>
      <style>{`
        .sidebar { background: #f8f9fa !important; border-right: 1px solid #e9ecef !important; border-left: none !important; height: 100vh; display: flex; flex-direction: column; left: 0 !important; right: auto !important; }
        [dir="rtl"] .sidebar { left: 0 !important; right: auto !important; border-right: 1px solid #e9ecef !important; border-left: none !important; }
        .sidebar-header { background: white !important; padding: 0 !important; overflow: hidden; display: flex !important; justify-content: center !important; align-items: center !important; min-height: 110px; }
        .sidebar-brand { display: flex; justify-content: center; align-items: center; padding: 10px; background: white; width: 100%; box-sizing: border-box; flex-shrink: 0; }
        .sidebar-nav-wrapper { overflow-y: auto; flex: 1; padding-top: 10px; }
        .sidebar-nav .nav-link { color: #333 !important; font-size: 16px !important; font-weight: 500 !important; padding: 12px 18px !important; border-radius: 6px !important; margin: 2px 10px !important; display: flex !important; align-items: center !important; gap: 12px !important; white-space: nowrap !important; text-align: left !important; flex-direction: row !important; }
        .sidebar-nav .nav-link:hover { background: #eef2f7 !important; color: #0d47a1 !important; }
        .sidebar-nav .nav-link.active { background: #2196f3 !important; color: white !important; }
        .sidebar-nav .nav-icon, .sidebar-nav .nav-link svg { color: #0d47a1 !important; fill: #0d47a1 !important; font-size: 19px !important; min-width: 24px; flex-shrink: 0; }
        .sidebar-nav .nav-link.active .nav-icon, .sidebar-nav .nav-link.active svg { color: white !important; fill: white !important; }
        .sidebar-nav .nav-group-items .nav-link { padding-left: 48px !important; padding-right: 18px !important; font-size: 15px !important; }
        .sidebar-unfoldable:not(:hover) .sidebar-nav .nav-link { justify-content: center !important; padding: 12px 0 !important; margin: 2px 5px !important; }
        .sidebar-unfoldable:not(:hover) .sidebar-nav .nav-link span, .sidebar-unfoldable:not(:hover) .sidebar-nav .badge { display: none !important; }
        .sidebar-footer { padding: 12px 16px !important; }
        .sidebar-toggler-btn { background: #007A3D !important; color: white !important; border: none !important; border-radius: 6px !important; width: 32px !important; height: 24px !important; cursor: pointer !important; }
      `}</style>

      <CSidebar
        className="border-end sidebar"
        colorScheme="light"
        position="fixed"
        unfoldable={sidebarUnfoldable}
        visible={sidebarShow}
        onVisibleChange={(visible) => setSidebarShow(visible)}
        style={{ left: 0, right: 'auto' }}
      >
        <CSidebarHeader className="border-bottom sidebar-header">
          <div className="sidebar-brand">
            <CImage
              src={logo}
              style={{
                width: sidebarUnfoldable ? '70px' : '200px',
                height: 'auto',
                maxHeight: '110px',
                objectFit: 'contain',
                transition: 'all 0.3s ease',
              }}
              alt="GestiStock"
            />
          </div>
          <CCloseButton className="d-lg-none position-absolute top-0 end-0 m-2" onClick={() => setSidebarShow(false)} />
        </CSidebarHeader>

        <div className="sidebar-nav-wrapper">
          <AppSidebarNav items={navigation} />
        </div>

        <CSidebarFooter className="border-top sidebar-footer">
          <CSidebarToggler onClick={() => setSidebarUnfoldable(!sidebarUnfoldable)} className="sidebar-toggler-btn" />
        </CSidebarFooter>
      </CSidebar>
    </div>
  )
}

export default React.memo(AppSidebar)