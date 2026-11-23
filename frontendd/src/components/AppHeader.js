import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CContainer,
  CHeader,
  CHeaderToggler,
  CNavLink,
  CNavItem,
  CNav,
  CForm,
  CFormInput,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CAvatar,
  CDropdownDivider,
  CBadge
} from '@coreui/react';
import { HouseFill, EnvelopeFill, BoxArrowRight, PersonCircle, GearFill } from 'react-bootstrap-icons';
import CIcon from '@coreui/icons-react';
import { cilMenu, cilSearch } from '@coreui/icons';
import PropTypes from 'prop-types';
import { AppBreadcrumb } from './index';
import { useLanguage } from '../context/LanguageContext';

const AppHeader = ({ onLogout, sidebarShow, setSidebarShow, user }) => {
  const navigate = useNavigate();
  const langContext = useLanguage() || {};
  const t = typeof langContext.t === 'function' ? langContext.t : (key) => key;
  const lang = langContext.lang || 'fr';
  const toggleLang = langContext.toggleLang || (() => {});

  const [searchQuery, setSearchQuery] = useState('');
  const [messages] = useState(5);
  const [userData, setUserData] = useState({ username: user?.name || 'Admin', role: user?.role || 'Administrateur' });
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    if (user?.name) {
      setUserData({ username: user.name, role: user.role || 'Administrateur' });
      return;
    }
    try {
      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        setUserData({ username: u.name || u.username || u.email || 'Admin', role: u.role || u.roles?.[0] || 'Administrateur' });
      }
    } catch (e) { console.error(e); }
  }, [user]);

  const handleSearch = (e) => { e.preventDefault(); if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery)}`); };
  const handleLogout = () => { localStorage.clear(); sessionStorage.clear(); if (onLogout) onLogout(); navigate('/login'); };
  const getInitial = (name) => name?.charAt(0).toUpperCase() || 'U';

  return (
    <CHeader position="sticky" className="mb-4 p-0" style={{ background: 'linear-gradient(135deg, #0d47a1 0%, #143493 100%)', borderBottom: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', position: 'sticky', top: 0, zIndex: 1020 }}>
      <CContainer className="border-bottom px-4 py-2" fluid style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
        <div className="d-flex align-items-center w-100">
          <div className="d-flex align-items-center">
            <CHeaderToggler
              onClick={() => setSidebarShow(!sidebarShow)}
              style={{ color: '#fff', padding: '0.6rem 0.8rem', borderRadius: '15px', cursor: 'pointer', background: 'transparent', border: 'none' }}
            >
              <CIcon icon={cilMenu} size="lg" />
            </CHeaderToggler>

            <span onClick={() => navigate('/home/accueil')} style={{ fontWeight: '800', fontSize: '1.5rem', cursor: 'pointer', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
              <span style={{ color: '#ffffff' }}>Gesti</span>
              <span style={{ color: '#ff8c00' }}>Stock</span>
            </span>

            <CNav className="d-flex align-items-center ms-4">
              <CNavItem>
                <CNavLink href="/home/accueil" active style={{ color: '#fff', padding: '0.5rem 1rem', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <HouseFill /><span>{t('accueil')}</span>
                </CNavLink>
              </CNavItem>
            </CNav>
          </div>

          <div className="flex-grow-1" />

          <div className="d-flex align-items-center gap-3">
            <button
              onClick={toggleLang}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#fff',
                padding: '0.4rem 0.9rem',
                borderRadius: '50px',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '0.9rem',
                whiteSpace: 'nowrap',
              }}
            >
              {lang === 'fr' ? 'FR | عربي' : 'عربي | FR'}
            </button>

            <CForm onSubmit={handleSearch} className="d-flex" style={{ position: 'relative' }}>
              <CIcon icon={cilSearch} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.7)', zIndex: 2, pointerEvents: 'none' }} />
              <CFormInput type="text" placeholder={t('search')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '50px', width: searchFocused ? '300px' : '250px', paddingLeft: '35px' }} />
            </CForm>

            <CDropdown variant="nav-item" alignment="end">
              <CDropdownToggle caret style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '0.3rem 0.8rem', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <CAvatar size="md" style={{ background: 'linear-gradient(135deg, #ffd700, #ffa500)', color: '#0d47a1', fontWeight: 'bold', border: '2px solid #fff' }}>{getInitial(userData.username)}</CAvatar>
                <div className="d-none d-lg-block" style={{ textAlign: 'left' }}><span style={{ color: '#fff', fontWeight: '600', fontSize: '0.9rem' }}>{userData.username}</span><br /><small style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem' }}>{userData.role}</small></div>
              </CDropdownToggle>
              <CDropdownMenu style={{ minWidth: '260px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                <CDropdownItem onClick={() => navigate('/profile')}><PersonCircle className="me-2" /> {t('profil')}</CDropdownItem>
                <CDropdownItem onClick={() => navigate('/messages')}><EnvelopeFill className="me-2" /> {t('messages')} {messages > 0 && <CBadge color="danger" className="ms-2">{messages}</CBadge>}</CDropdownItem>
                <CDropdownItem onClick={() => navigate('/settings')}><GearFill className="me-2" /> {t('settings')}</CDropdownItem>
                <CDropdownDivider />
                <CDropdownItem onClick={handleLogout} style={{ color: '#dc3545' }}><BoxArrowRight className="me-2" /> {t('logout')}</CDropdownItem>
              </CDropdownMenu>
            </CDropdown>
          </div>
        </div>
      </CContainer>
      <CContainer className="px-4 py-2" fluid style={{ background: 'rgba(255,255,255,0.1)' }}><AppBreadcrumb /></CContainer>
    </CHeader>
  );
};

AppHeader.propTypes = { onLogout: PropTypes.func, sidebarShow: PropTypes.bool, setSidebarShow: PropTypes.func, user: PropTypes.object };
export default AppHeader;