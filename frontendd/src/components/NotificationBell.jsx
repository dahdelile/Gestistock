// src/components/NotificationBell.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Badge, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const NotificationBell = ({ user }) => {
  const [unread, setUnread] = useState([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const prevCount = useRef(0);

  const myEmail = String(user?.email || '').toLowerCase();

  const fetchUnread = async () => {
    if (!myEmail) return;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('receiver_email', myEmail)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(10);
    setUnread(data || []);
  };

  // Son + Notification navigateur quand un nouveau message arrive
  const notify = (msg) => {
    // Son
    try {
      const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-message-pop-alert-2354.mp3');
      audio.volume = 0.6;
      audio.play().catch(() => {});
    } catch {}

    // Titre onglet
    const old = document.title;
    document.title = `🔴 (${unread.length + 1}) Nouveau message`;
    setTimeout(() => { document.title = old; }, 4000);

    // Notification navigateur
    if ('Notification' in window && Notification.permission === 'granted') {
      const n = new Notification(`💬 ${msg.sender_name || msg.sender_email}`, {
        body: msg.body?.slice(0, 80),
        icon: '/favicon.ico',
      });
      n.onclick = () => { window.focus(); navigate('/messages'); };
    }
  };

  useEffect(() => {
    if (!myEmail) return;
    fetchUnread();

    // Demande autorisation 1 fois
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Temps réel : nouveau message
    const ch = supabase
      .channel('notif-bell')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new;
        if (String(msg.receiver_email || '').toLowerCase() === myEmail) {
          setUnread((prev) => [msg, ...prev].slice(0, 10));
          notify(msg);
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, (payload) => {
        setUnread((prev) => prev.filter((m) => m.id !== payload.old.id));
      })
      .subscribe();

    // Sécurité : re-vérifie toutes les 10s
    const interval = setInterval(fetchUnread, 10000);
    return () => { supabase.removeChannel(ch); clearInterval(interval); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myEmail]);

  useEffect(() => {
    prevCount.current = unread.length;
  }, [unread]);

  const goToChat = async (msg) => {
    await supabase.from('messages').update({ is_read: true }).eq('id', msg.id);
    setUnread((prev) => prev.filter((m) => m.id !== msg.id));
    setOpen(false);
    navigate('/messages');
  };

  const markAllRead = async () => {
    await supabase.from('messages').update({ is_read: true }).eq('receiver_email', myEmail).eq('is_read', false);
    setUnread([]);
  };

  return (
    <Dropdown show={open} onToggle={(v) => setOpen(v)} align="end">
      <Dropdown.Toggle variant="light" id="notif-bell" className="position-relative border-0 bg-transparent" style={{ fontSize: '22px' }}>
        🔔
        {unread.length > 0 && (
          <Badge bg="danger" pill className="position-absolute top-0 start-100 translate-middle" style={{ fontSize: '11px' }}>
            {unread.length}
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu style={{ width: '340px', maxHeight: '400px', overflowY: 'auto' }}>
        <div className="d-flex justify-content-between align-items-center px-3 py-2">
          <strong>🔔 Notifications</strong>
          {unread.length > 0 && <button className="btn btn-link btn-sm p-0" onClick={markAllRead}>Tout marquer lu</button>}
        </div>
        <Dropdown.Divider />
        {unread.length === 0 ? (
          <div className="text-center text-muted py-3">Aucune nouvelle notification ✅</div>
        ) : (
          unread.map((m) => (
            <Dropdown.Item key={m.id} onClick={() => goToChat(m)}>
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
            </Dropdown.Item>
          ))
        )}
        <Dropdown.Divider />
        <Dropdown.Item onClick={() => { setOpen(false); navigate('/messages'); }} className="text-center text-primary fw-bold">
          Voir tous les messages →
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default NotificationBell;