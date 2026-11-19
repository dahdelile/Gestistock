import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
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
  CButton,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CAvatar,
  CDropdownDivider,
  CBadge
} from '@coreui/react';
import { Container } from 'react-bootstrap';
import {
  HouseFill,
  PersonLinesFill,
  EnvelopeFill,
  BoxArrowRight,
  PersonCircle,
  BellFill,
  GearFill,
  Calendar3
} from 'react-bootstrap-icons';
import CIcon from '@coreui/icons-react';
import { cilMenu, cilSearch, cilBell, cilEnvelopeOpen } from '@coreui/icons';
import PropTypes from 'prop-types';

import { AppBreadcrumb } from './index';

// ===== STYLES INLINE =====
const headerStyles = {
  header: {
    background: 'linear-gradient(135deg, #0d47a1 0%, #143493 100%)',
    borderBottom: 'none',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    transition: 'all 0.3s ease',
    position: 'sticky',
    top: 0,
    zIndex: 1020
  },
  headerScrolled: { boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)' },
  logoSection: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '1rem' },
  logoImg: { height: '40px', width: 'auto', transition: 'transform 0.3s ease' },
  logoText: { fontWeight: '700', fontSize: '1.2rem', color: '#ffffff', letterSpacing: '0.5px', whiteSpace: 'nowrap' },
  logoSubtitle: { fontSize: '0.85em', opacity: '0.9', fontWeight: '400', display: 'block', marginTop: '0.2rem' },
  navLink: { color: '#ffffff', padding: '0.5rem 1rem', margin: '0 0.2rem', borderRadius: '50px', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500', fontSize: '0.9rem', textDecoration: 'none', cursor: 'pointer' },
  navLinkHover: { background: 'rgba(255, 255, 255, 0.15)', transform: 'translateY(-2px)' },
  searchInput: { background: 'rgba(255, 255, 255, 0.15)', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#ffffff', paddingRight: '40px', borderRadius: '50px', transition: 'all 0.3s ease', width: '250px' },
  searchInputFocus: { background: 'rgba(255, 255, 255, 0.25)', borderColor: '#ffd700', boxShadow: '0 0 15px rgba(255, 215, 0, 0.3)', width: '300px' },
  datetimeContainer: { display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.15)', padding: '0.4rem 1.2rem', borderRadius: '12px', margin: '0 1rem', border: '1px solid rgba(255, 255, 255, 0.25)', backdropFilter: 'blur(5px)', textAlign: 'center', minWidth: '100px' },
  datetimeDay: { fontSize: '0.8rem', color: '#FFD700', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600', textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' },
  datetimeTime: { fontSize: '1.3rem', fontWeight: '800', color: '#FFFFFF', lineHeight: '1.2', letterSpacing: '1px', textShadow: '0 2px 8px rgba(0, 0, 0, 0.4)' },
  datetimeDate: { fontSize: '0.75rem', color: '#E0E0FF', fontWeight: '500', textTransform: 'capitalize' },
  userMenuToggle: { background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '0.3rem 0.8rem', borderRadius: '50px', transition: 'all 0.3s ease' },
  userAvatar: { background: 'linear-gradient(135deg, #ffd700, #ffa500)', color: '#0d47a1', fontWeight: 'bold', border: '2px solid #ffffff', transition: 'all 0.3s ease', cursor: 'pointer' },
  userInfo: { textAlign: 'left' },
  username: { color: '#ffffff', fontWeight: '600', fontSize: '0.9rem', lineHeight: '1.2' },
  role: { color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.75rem' },
  iconWrapper: { position: 'relative', margin: '0 0.5rem', cursor: 'pointer' },
  notificationBadge: { position: 'absolute', top: '-5px', right: '-5px', background: '#ff4757', color: 'white', fontSize: '0.6rem', fontWeight: '600', minWidth: '18px', height: '18px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', animation: 'pulse 2s infinite' },
  dropdownMenu: { minWidth: '260px', padding: '0.5rem 0', border: 'none', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', borderRadius: '12px', marginTop: '0.5rem' },
  dropdownItem: { padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem', color: '#333', transition: 'all 0.2s ease', cursor: 'pointer' },
  dropdownItemHover: { background: '#f5f7fa', color: '#0d47a1', paddingLeft: '1.2rem' },
  logoutItem: { color: '#dc3545' },
  logoutItemHover: { background: '#ffebee', color: '#c62828' }
};

const animationStyles = `
  @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
  @keyframes slideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .app-header { animation: slideDown 0.5s ease-out; }
  .notification-badge { animation: pulse 2s infinite; }
  @media (max-width: 768px) { .logo-text, .logo-subtitle { display: none !important; } }
  @media (max-width: 992px) { .nav-link span { display: none !important; } .datetime-container { display: none !important; } .user-info { display: none !important; } }
`;

const AppHeader = ({ onLogout }) => {
  const headerRef = useRef();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const sidebarShow = useSelector((state) => state.sidebarShow);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications] = useState(3);
  const [messages] = useState(5);
  const [userData, setUserData] = useState({ username: 'Admin', role: 'Administrateur', avatar: null });
  const [isScrolled, setIsScrolled] = useState(false);
  const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.textContent = animationStyles;
    document.head.appendChild(styleTag);
    return () => document.head.removeChild(styleTag);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserData({
          username: user.name || user.username || user.email || 'Admin',
          role: user.role || user.roles?.[0] || 'Administrateur'
        });
      }
    } catch (error) { console.error('Erreur parsing user:', error); }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 0;
      setIsScrolled(scrolled);
      if (headerRef.current) headerRef.current.classList.toggle('shadow-sm', scrolled);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e) => { e.preventDefault(); if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery)}`); };
  const handleLogout = () => { try { localStorage.clear(); sessionStorage.clear(); if (onLogout) onLogout(); navigate('/loginPage'); } catch (error) { console.error('Erreur déconnexion:', error); navigate('/loginPage'); } };
  const formatDate = (date) => date.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
  const formatTime = (date) => date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const getInitial = (name) => name?.charAt(0).toUpperCase() || 'U';
  const [hoveredNav, setHoveredNav] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <>
      <CHeader position="sticky" className="mb-4 p-0 app-header" ref={headerRef} style={{ ...headerStyles.header, ...(isScrolled ? headerStyles.headerScrolled : {}) }}>
        <CContainer className="border-bottom px-4 py-2" fluid style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
          <div className="d-flex align-items-center w-100">
            
            {/* ===== GAUCHE : Logo + Navigation ===== */}
            <div className="d-flex align-items-center">
              <div style={headerStyles.logoSection}>
                <CHeaderToggler onClick={() => dispatch({ type: 'set', sidebarShow: !sidebarShow })} style={{ color: '#ffffff', padding: '1.rem', borderRadius: '15px', transition: 'all 0.3s ease', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'scale(1.05)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}>
                  <CIcon icon={cilMenu} size="lg" />
                </CHeaderToggler>
               
              </div>
              <CNav className="d-flex align-items-center ms-4">
                <CNavItem><CNavLink href="/home/accueil" active style={{ ...headerStyles.navLink, ...(hoveredNav === 'accueil' ? headerStyles.navLinkHover : {}) }} onMouseEnter={() => setHoveredNav('accueil')} onMouseLeave={() => setHoveredNav(null)}><HouseFill /><span>Accueil</span></CNavLink></CNavItem>
                <CNavItem><CNavLink href={`${API_URL}/download-excel/`} target="_blank" rel="noopener noreferrer" style={{ ...headerStyles.navLink, ...(hoveredNav === 'telgfu' ? headerStyles.navLinkHover : {}) }} onMouseEnter={() => setHoveredNav('telgfu')} onMouseLeave={() => setHoveredNav(null)}><PersonLinesFill /><span>TEL-GFU</span></CNavLink></CNavItem>
                <CNavItem><CNavLink href={`${API_URL}/download-email/`} target="_blank" rel="noopener noreferrer" style={{ ...headerStyles.navLink, ...(hoveredNav === 'email' ? headerStyles.navLinkHover : {}) }} onMouseEnter={() => setHoveredNav('email')} onMouseLeave={() => setHoveredNav(null)}><EnvelopeFill /><span>Adresses Mail</span></CNavLink></CNavItem>
              </CNav>
            </div>

            {/* ===== CENTRE : Facebook, Internet, SAP (centrés) ===== */}
            <div className="d-flex align-items-center flex-grow-1 justify-content-center">
              <div className="d-flex align-items-center gap-3">
                <CNavLink href="https://web.facebook.com/Attm.mauritanie" target="_blank" rel="noopener noreferrer" style={{ ...headerStyles.navLink, padding: '0.4rem' }}>
                  <img src="https://cdn-icons-png.flaticon.com/128/5968/5968764.png" width={32} height={32} alt="Facebook" style={{ opacity: 0.9 }} />
                </CNavLink>
                <CNavLink href="https://www.attm.mr" target="_blank" rel="noopener noreferrer" style={{ ...headerStyles.navLink, padding: '0.4rem' }}>
                  <img src="https://cdn-icons-png.flaticon.com/128/1589/1589718.png" width={32} height={32} alt="Internet" style={{ opacity: 0.9 }} />
                </CNavLink>
                <CNavLink href="https://attmb1srv:40000" target="_blank" rel="noopener noreferrer" style={{ ...headerStyles.navLink, padding: '0.4rem' }}>
                  <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRbSi0lTc27H3QiB6FaC6llvHhrq1KvnfKMbg&s" 
                  width={32} height={32} alt="SAP" style={{ opacity: 0.9 }} />
                </CNavLink>
              </div>
            </div>

            {/* ===== DROITE : Recherche + User ===== */}
            <div className="d-flex align-items-center gap-3">
              <CForm onSubmit={handleSearch} className="d-flex" style={{ position: 'relative' }}>
                <CIcon icon={cilSearch} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.7)', zIndex: 2, pointerEvents: 'none' }} />
                <CFormInput type="text" placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} style={{ ...headerStyles.searchInput, ...(searchFocused ? headerStyles.searchInputFocus : {}), paddingLeft: '35px', color: '#ffffff' }} />
                {searchQuery && <button type="button" onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '4px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>}
              </CForm>
              <CDropdown variant="nav-item" alignment="end">
                <CDropdownToggle caret style={{ ...headerStyles.userMenuToggle, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', border: 'none' }}>
                  <CAvatar size="md" style={headerStyles.userAvatar} onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'} onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}>{getInitial(userData.username)}</CAvatar>
                  <div style={headerStyles.userInfo} className="d-none d-lg-block"><span style={headerStyles.username}>{userData.username}</span><br /><small style={headerStyles.role}>{userData.role}</small></div>
                </CDropdownToggle>
                <CDropdownMenu style={headerStyles.dropdownMenu}>
                  <div className="dropdown-header bg-light py-3 px-3"><div className="d-flex align-items-center"><CAvatar size="lg" style={{ ...headerStyles.userAvatar, marginRight: '0.75rem' }}>{getInitial(userData.username)}</CAvatar><div><h6 className="mb-0 fw-bold">{userData.username}</h6><small className="text-muted">{userData.role}</small></div></div></div>
                  <CDropdownDivider />
                  <CDropdownItem onClick={() => navigate('/profile')} style={headerStyles.dropdownItem} onMouseEnter={(e) => Object.assign(e.currentTarget.style, headerStyles.dropdownItemHover)} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#333'; e.currentTarget.style.paddingLeft = '1rem'; }}><PersonCircle className="me-2" /> Mon profil</CDropdownItem>
                  <CDropdownItem onClick={() => navigate('/messages')} style={headerStyles.dropdownItem} onMouseEnter={(e) => Object.assign(e.currentTarget.style, headerStyles.dropdownItemHover)} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#333'; e.currentTarget.style.paddingLeft = '1rem'; }}><EnvelopeFill className="me-2" /> Messages {messages > 0 && <CBadge color="danger" className="ms-2">{messages}</CBadge>}</CDropdownItem>
                  <CDropdownItem onClick={() => navigate('/settings')} style={headerStyles.dropdownItem} onMouseEnter={(e) => Object.assign(e.currentTarget.style, headerStyles.dropdownItemHover)} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#333'; e.currentTarget.style.paddingLeft = '1rem'; }}><GearFill className="me-2" /> Paramètres</CDropdownItem>
                  <CDropdownDivider />
                  <CDropdownItem onClick={handleLogout} style={{ ...headerStyles.dropdownItem, ...headerStyles.logoutItem }} onMouseEnter={(e) => Object.assign(e.currentTarget.style, headerStyles.logoutItemHover)} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#dc3545'; e.currentTarget.style.paddingLeft = '1rem'; }}><BoxArrowRight className="me-2" /> Déconnexion</CDropdownItem>
                </CDropdownMenu>
              </CDropdown>
            </div>

          </div>
        </CContainer>
        <CContainer className="px-4 py-2" fluid style={{ background: 'rgba(255,255,255,0.1)' }}><AppBreadcrumb /></CContainer>
      </CHeader>
    </>
  );
};

AppHeader.propTypes = { onLogout: PropTypes.func };
AppHeader.defaultProps = { onLogout: null };
export default AppHeader;