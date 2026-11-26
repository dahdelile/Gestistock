// src/components/AppHeader.js
import React, { useEffect, useRef, useState } from 'react';
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
import { cilMenu, cilSearch, cilBell } from '@coreui/icons';
import PropTypes from 'prop-types';
import { AppBreadcrumb } from './index';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../supabaseClient';

const AppHeader = ({ onLogout, sidebarShow, setSidebarShow, user }) => {
  const navigate = useNavigate();
  const langContext = useLanguage() || {};
  const t = typeof langContext.t === 'function' ? langContext.t : (key) => key;
  const lang = langContext.lang || 'fr';
  const toggleLang = langContext.toggleLang || (() => {});

  const [searchQuery, setSearchQuery] = useState('');
  const [userData, setUserData] = useState({ username: user?.name || 'Admin', role: user?.role || 'Administrateur' });
  const [searchFocused, setSearchFocused] = useState(false);

  // ✅ NOTIFICATION
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadList, setUnreadList] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const myEmail = String(user?.email || '').toLowerCase();

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

  // ✅ Récupère l'email si user n'a pas d'email (depuis localStorage)
  const getMyEmail = () => {
    if (myEmail) return myEmail;
    try {
      const u = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
      return String(u.email || '').toLowerCase();
    } catch { return ''; }
  };

  const fetchUnread = async () => {
    const email = getMyEmail();
    if (!email) return;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('receiver_email', email)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(10);
    setUnreadList(data || []);
    setUnreadCount((data || []).length);
  };

  useEffect(() => {
    fetchUnread();
    // Demande autorisation notification 1 fois
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    const email = getMyEmail();
    if (!email) return;

    const ch = supabase
      .channel('header-notif')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new;
        if (String(msg.receiver_email || '').toLowerCase() === email) {
          setUnreadList((prev) => [msg, ...prev].slice(0, 10));
          setUnreadCount((c) => c + 1);

          // 🔊 Son
          try {
            const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-message-pop-alert-2354.mp3');
            audio.volume = 0.6;
            audio.play().catch(() => {});
          } catch {}

          // 🔴 Titre onglet
          const old = document.title;
          document.title = `🔴 Nouveau message — GestiStock`;
          setTimeout(() => { document.title = old; }, 4000);

          // 💬 Notification navigateur
          if ('Notification' in window && Notification.permission === 'granted') {
            const n = new Notification(`💬 ${msg.sender_name || msg.sender_email}`, {
              body: msg.body?.slice(0, 80),
              icon: '/favicon.ico',
            });
            n.onclick = () => { window.focus(); navigate('/messages'); };
          }
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, (payload) => {
        setUnreadList((prev) => prev.filter((m) => m.id !== payload.old.id));
        setUnreadCount((c) => Math.max(0, c - 1));
      })
      .subscribe();

    const interval = setInterval(fetchUnread, 10000);
    return () => { supabase.removeChannel(ch); clearInterval(interval); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  const goToChat = async (msg) => {
    await supabase.from('messages').update({ is_read: true }).eq('id', msg.id);
    setUnreadList((prev) => prev.filter((m) => m.id !== msg.id));
    setUnreadCount((c) => Math.max(0, c - 1));
    setShowNotif(false);
    navigate('/messages');
  };

  const markAllRead = async () => {
    const email = getMyEmail();
    await supabase.from('messages').update({ is_read: true }).eq('receiver_email', email).eq('is_read', false);
    setUnreadList([]);
    setUnreadCount(0);
  };

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

            {/* ✅ CLOCHE NOTIFICATION */}
            <CDropdown variant="nav-item" alignment="end" visible={showNotif} onHide={() => setShowNotif(false)}>
              <CDropdownToggle
                caret={false}
                onClick={() => setShowNotif(!showNotif)}
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', padding: '0.5rem 0.7rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', color: '#fff' }}
              >
                <CIcon icon={cilBell} size="lg" />
                {unreadCount > 0 && (
                  <CBadge color="danger" position="top-end" shape="rounded-pill" style={{ position: 'absolute', top: '-5px', right: '-5px', fontSize: '11px' }}>
                    {unreadCount}
                  </CBadge>
                )}
              </CDropdownToggle>
              <CDropdownMenu style={{ minWidth: '340px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', borderRadius: '12px', maxHeight: '420px', overflowY: 'auto' }}>
                <div className="d-flex justify-content-between align-items-center px-3 py-2">
                  <strong>🔔 {lang === 'ar' ? 'الإشعارات' : 'Notifications'}</strong>
                  {unreadCount > 0 && <button className="btn btn-link btn-sm p-0" onClick={markAllRead}>{lang === 'ar' ? 'تحديد الكل كمقروء' : 'Tout marquer lu'}</button>}
                </div>
                <CDropdownDivider />
                {unreadList.length === 0 ? (
                  <div className="text-center text-muted py-3">{lang === 'ar' ? 'لا توجد إشعارات جديدة ✅' : 'Aucune nouvelle notification ✅'}</div>
                ) : (
                  unreadList.map((m) => (
                    <CDropdownItem key={m.id} onClick={() => goToChat(m)} style={{ whiteSpace: 'normal' }}>
                      <div className="d-flex gap-2">
                        <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: 38, height: 38, flexShrink: 0 }}>
                          {String(m.sender_name || m.sender_email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <div className="fw-bold text-truncate">{m.sender_name || m.sender_email}</div>
                          <div className="text-muted text-truncate" style={{ maxWidth: '240px' }}>{m.body}</div>
                          <small className="text-muted">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                        </div>
                      </div>
                    </CDropdownItem>
                  ))
                )}
                <CDropdownDivider />
                <CDropdownItem onClick={() => { setShowNotif(false); navigate('/messages'); }} className="text-center text-primary fw-bold">
                  {lang === 'ar' ? 'عرض كل الرسائل ←' : 'Voir tous les messages →'}
                </CDropdownItem>
              </CDropdownMenu>
            </CDropdown>

            <CDropdown variant="nav-item" alignment="end">
              <CDropdownToggle caret style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '0.3rem 0.8rem', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <CAvatar size="md" style={{ background: 'linear-gradient(135deg, #ffd700, #ffa500)', color: '#0d47a1', fontWeight: 'bold', border: '2px solid #fff' }}>{getInitial(userData.username)}</CAvatar>
                <div className="d-none d-lg-block" style={{ textAlign: 'left' }}><span style={{ color: '#fff', fontWeight: '600', fontSize: '0.9rem' }}>{userData.username}</span><br /><small style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem' }}>{userData.role}</small></div>
              </CDropdownToggle>
              <CDropdownMenu style={{ minWidth: '260px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                <CDropdownItem onClick={() => navigate('/profile')}><PersonCircle className="me-2" /> {t('profil')}</CDropdownItem>
                {/* ✅ CORRIGÉ : CDropdownItem au lieu de <a> */}
                <CDropdownItem onClick={() => navigate('/messages')}>
                  <EnvelopeFill className="me-2" /> {t('messages')} {unreadCount > 0 && <CBadge color="danger" shape="rounded-pill" className="ms-1">{unreadCount}</CBadge>}
                </CDropdownItem>
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