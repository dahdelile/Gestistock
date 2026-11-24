// src/pages/MessagesPage.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, Button, Form, Badge, Spinner, Modal, Row, Col } from 'react-bootstrap';
import { supabase } from '../../supabaseClient';
import { useLanguage } from '../../context/LanguageContext';

const I18N = {
  fr: {
    dir: 'ltr',
    title: 'Messagerie', subtitle: 'Discutez en direct avec les utilisateurs connectés.',
    users: 'Utilisateurs', online: 'En ligne', offline: 'Hors ligne',
    search_user: 'Rechercher un utilisateur...',
    type_msg: 'Écrire un message...', send: 'Envoyer',
    no_chat: 'Sélectionne un utilisateur pour commencer à discuter.',
    no_users: 'Aucun utilisateur.', no_messages: 'Aucun message. Dis bonjour 👋',
    you: 'Vous', today: "Aujourd'hui",
    close: 'Fermer', hint: 'Entrée pour envoyer • Shift + Entrée pour nouvelle ligne',
  },
  ar: {
    dir: 'rtl',
    title: 'الرسائل', subtitle: 'تحدث مباشرة مع المستخدمين المتصلين.',
    users: 'المستخدمون', online: 'متصل', offline: 'غير متصل',
    search_user: 'ابحث عن مستخدم...',
    type_msg: 'اكتب رسالة...', send: 'إرسال',
    no_chat: 'اختر مستخدماً لبدء المحادثة.',
    no_users: 'لا يوجد مستخدمون.', no_messages: 'لا توجد رسائل. قل مرحباً 👋',
    you: 'أنت', today: 'اليوم',
    close: 'إغلاق', hint: 'Enter للإرسال • Shift + Enter لسطر جديد',
  },
};

// ✅ إصلاح 1: ChatContent خارج MessagesPage تماماً
// لن يتم تدميره وإعادة إنشائه عند كل حرف
const ChatContent = ({
  selectedUser, isOnline, conversation, newMsg, setNewMsg,
  handleSend, sending, t, lang, myEmail, bottomRef, inputRef,
}) => {
  const formatTime = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = (d) => {
    const date = new Date(d);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return t.today;
    return date.toLocaleDateString(lang === 'ar' ? 'ar' : 'fr-FR');
  };

  return (
    <div className="d-flex flex-column" style={{ height: '100%' }}>
      <div className="d-flex align-items-center gap-2 p-3 border-bottom bg-light">
        <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" style={{ width: 40, height: 40, background: '#0d47a1' }}>
          {String(selectedUser?.full_name || selectedUser?.name || selectedUser?.email || '?').charAt(0).toUpperCase()}
        </div>
        <div className="flex-grow-1">
          <div className="fw-bold">{selectedUser?.full_name || selectedUser?.name || selectedUser?.email}</div>
          <small className={isOnline ? 'text-success' : 'text-muted'}>
            ● {isOnline ? t.online : t.offline}
          </small>
        </div>
      </div>

      <div className="flex-grow-1 overflow-auto p-3" style={{ height: '350px', background: '#f0f2f5' }}>
        {conversation.length === 0 ? (
          <div className="text-center text-muted py-5">{t.no_messages}</div>
        ) : (
          conversation.map((m, i) => {
            const isMine = String(m.sender_email || '').toLowerCase() === myEmail;
            const showDate = i === 0 || formatDate(conversation[i - 1].created_at) !== formatDate(m.created_at);
            return (
              <div key={m.id}>
                {showDate && <div className="text-center my-2"><Badge bg="secondary">{formatDate(m.created_at)}</Badge></div>}
                <div className="d-flex mb-2" style={{ justifyContent: isMine ? 'flex-start' : 'flex-end' }}>
                  <div className={`p-2 px-3 rounded-3 shadow-sm ${isMine ? 'bg-primary text-white' : 'bg-white'}`} style={{ maxWidth: '75%' }}>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{m.body}</div>
                    <div className={`text-end small ${isMine ? 'text-white-50' : 'text-muted'}`} style={{ fontSize: '0.7rem' }}>
                      {formatTime(m.created_at)} {isMine && (m.is_read ? '✓✓' : '✓')}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <Form onSubmit={handleSend} className="p-2 border-top bg-white">
        <div className="d-flex gap-2 align-items-end">
          <Form.Control
            ref={inputRef}
            as="textarea"
            rows={1}
            placeholder={t.type_msg}
            value={newMsg}
            onChange={(e) => {
              setNewMsg(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            style={{ resize: 'none', maxHeight: '120px', overflowY: 'auto' }}
          />
          <Button type="submit" variant="primary" disabled={sending || !newMsg.trim()} style={{ minWidth: '90px', height: '38px' }}>
            ➤ {t.send}
          </Button>
        </div>
        <small className="text-muted">{t.hint}</small>
      </Form>
    </div>
  );
};

const MessagesPage = ({ user: userProp }) => {
  const { lang } = useLanguage();
  const t = I18N[lang] || I18N.fr;
  const [me, setMe] = useState(userProp || null);
  const [users, setUsers] = useState([]);
  const [onlineEmails, setOnlineEmails] = useState(new Set());
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchUser, setSearchUser] = useState('');
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // ✅ إصلاح 2: هل نحن على هاتف أم كمبيوتر؟
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const myEmail = String(me?.email || '').toLowerCase();

  useEffect(() => {
    const loadMe = async () => {
      if (userProp) { setMe(userProp); return; }
      const { data } = await supabase.auth.getSession();
      const u = data?.session?.user;
      if (u) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', u.id).single();
        setMe({ ...u, name: profile?.full_name || profile?.name || u.email, role: profile?.role });
      } else {
        try { setMe(JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null')); } catch {}
      }
    };
    loadMe();
  }, [userProp]);

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('email, full_name, name, role').order('email');
    if (data?.length) setUsers(data);
    else setUsers([
      { email: 'meddelile@gmail.com', full_name: 'Med Delil' },
      { email: 'sidati@gmail.com', full_name: 'Sidati' },
      { email: 'sik@gmail.com', full_name: 'Sik' },
    ]);
  };

  const fetchMessages = async () => {
    setLoading(true);
    const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
    setMessages(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); fetchMessages(); }, []);

  const showMessageNotification = (msg) => {
    const title = `💬 ${msg.sender_name || msg.sender_email}`;
    const body = msg.body?.slice(0, 80) || 'Nouveau message';
    try {
      const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-message-pop-alert-2354.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {}
    const originalTitle = document.title;
    document.title = `🔴 ${title} — GestiStock`;
    setTimeout(() => { document.title = originalTitle; }, 4000);
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        const n = new Notification(title, { body, icon: '/favicon.ico' });
        n.onclick = () => {
          window.focus();
          const sender = users.find((u) => String(u.email).toLowerCase() === String(msg.sender_email).toLowerCase());
          if (sender) openChat(sender);
        };
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
    const toast = document.createElement('div');
    toast.innerHTML = `<strong>${title}</strong><br/>${body}`;
    toast.style.cssText = 'position:fixed;top:80px;right:20px;z-index:9999;background:#0d47a1;color:#fff;padding:12px 16px;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.3);max-width:320px;cursor:pointer;font-size:14px;';
    toast.onclick = () => {
      const sender = users.find((u) => String(u.email).toLowerCase() === String(msg.sender_email).toLowerCase());
      if (sender) openChat(sender);
      toast.remove();
    };
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  };

  useEffect(() => {
    if (!myEmail) return;
    const channel = supabase
      .channel('chat-room')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new;
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        if (String(msg.sender_email || '').toLowerCase() !== myEmail) {
          showMessageNotification(msg);
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const emails = new Set();
        Object.values(state).forEach((arr) => arr.forEach((p) => p.email && emails.add(String(p.email).toLowerCase())));
        setOnlineEmails(emails);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ email: myEmail, name: me?.name || myEmail, online_at: new Date().toISOString() });
        }
      });
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myEmail]);

  useEffect(() => {
    if (!selectedUser || !myEmail) return;
    const markRead = async () => {
      await supabase.from('messages').update({ is_read: true }).eq('receiver_email', myEmail).eq('sender_email', String(selectedUser.email).toLowerCase()).eq('is_read', false);
      setMessages((prev) => prev.map((m) => (String(m.receiver_email || '').toLowerCase() === myEmail && String(m.sender_email || '').toLowerCase() === String(selectedUser.email).toLowerCase() ? { ...m, is_read: true } : m)));
    };
    markRead();
  }, [selectedUser, myEmail]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, selectedUser, showChatModal]);

  useEffect(() => {
    if (selectedUser) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [selectedUser, showChatModal]);

  const conversation = useMemo(() => {
    if (!selectedUser) return [];
    const other = String(selectedUser.email).toLowerCase();
    return messages.filter((m) => {
      const s = String(m.sender_email || '').toLowerCase();
      const r = String(m.receiver_email || '').toLowerCase();
      return (s === myEmail && r === other) || (s === other && r === myEmail);
    });
  }, [messages, selectedUser, myEmail]);

  const userMeta = (u) => {
    const other = String(u.email).toLowerCase();
    const conv = messages.filter((m) => {
      const s = String(m.sender_email || '').toLowerCase();
      const r = String(m.receiver_email || '').toLowerCase();
      return (s === myEmail && r === other) || (s === other && r === myEmail);
    });
    const last = conv[conv.length - 1];
    const unread = conv.filter((m) => String(m.receiver_email || '').toLowerCase() === myEmail && !m.is_read).length;
    return { last, unread };
  };

  const filteredUsers = useMemo(() => {
    const q = searchUser.toLowerCase();
    return users
      .filter((u) => String(u.email || '').toLowerCase() !== myEmail)
      .filter((u) => !q || String(u.email || '').toLowerCase().includes(q) || String(u.full_name || u.name || '').toLowerCase().includes(q))
      .sort((a, b) => {
        const ua = userMeta(a).unread, ub = userMeta(b).unread;
        if (ub !== ua) return ub - ua;
        const oa = onlineEmails.has(String(a.email).toLowerCase()) ? 1 : 0;
        const ob = onlineEmails.has(String(b.email).toLowerCase()) ? 1 : 0;
        return ob - oa;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, searchUser, messages, myEmail, onlineEmails]);

  // ✅ إصلاح 2: على الكمبيوتر نفتح في العمود الأيمن فقط، بدون مودال
  // على الهاتف فقط نفتح المودال
  const openChat = (u) => {
    setSelectedUser(u);
    if (window.innerWidth < 768) {
      setShowChatModal(true);
    } else {
      setShowChatModal(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !selectedUser) return;
    const text = newMsg.trim();
    setNewMsg('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setSending(true);
    const { error } = await supabase.from('messages').insert([{
      sender_email: myEmail,
      sender_name: me?.name || me?.full_name || myEmail,
      receiver_email: String(selectedUser.email).toLowerCase(),
      subject: null,
      body: text,
      is_read: false,
    }]);
    setSending(false);
    if (error) alert(error.message);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const formatTime = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const chatProps = {
    selectedUser,
    isOnline: selectedUser ? onlineEmails.has(String(selectedUser.email).toLowerCase()) : false,
    conversation,
    newMsg, setNewMsg,
    handleSend, sending,
    t, lang, myEmail,
    bottomRef, inputRef,
  };

  return (
    <div className="container-fluid py-4" dir={t.dir}>
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white"><h3 className="mb-0">💬 {t.title}</h3><small>{t.subtitle}</small></Card.Header>
        <Card.Body className="p-0">
          <Row className="g-0" style={{ minHeight: '550px' }}>
            <Col md={4} className="border-end">
              <div className="p-3 border-bottom">
                <Form.Control placeholder={t.search_user} value={searchUser} onChange={(e) => setSearchUser(e.target.value)} />
              </div>
              <div className="overflow-auto" style={{ maxHeight: '500px' }}>
                {loading ? <div className="text-center py-4"><Spinner /></div>
                : filteredUsers.length === 0 ? <div className="text-center py-4 text-muted">{t.no_users}</div>
                : filteredUsers.map((u) => {
                  const { last, unread } = userMeta(u);
                  const isOnline = onlineEmails.has(String(u.email).toLowerCase());
                  return (
                    <div key={u.email} onClick={() => openChat(u)} className={`d-flex align-items-center gap-2 p-3 border-bottom ${selectedUser?.email === u.email ? 'bg-light' : ''}`} style={{ cursor: 'pointer' }}>
                      <div className="position-relative">
                        <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" style={{ width: 45, height: 45, background: isOnline ? '#28a745' : '#6c757d' }}>
                          {String(u.full_name || u.name || u.email).charAt(0).toUpperCase()}
                        </div>
                        {isOnline && <span className="position-absolute bottom-0 end-0 bg-success border border-white rounded-circle" style={{ width: 12, height: 12 }}></span>}
                      </div>
                      <div className="flex-grow-1 overflow-hidden">
                        <div className="d-flex justify-content-between">
                          <strong className="text-truncate">{u.full_name || u.name || u.email}</strong>
                          {last && <small className="text-muted">{formatTime(last.created_at)}</small>}
                        </div>
                        <small className="text-muted">{isOnline ? t.online : t.offline} • {u.role || ''}</small>
                        <div className="text-truncate small text-muted">{last ? last.body : ''}</div>
                      </div>
                      {unread > 0 && <Badge bg="danger">{unread}</Badge>}
                    </div>
                  );
                })}
              </div>
            </Col>

            {/* العمود الأيمن: يظهر فقط على الكمبيوتر */}
            <Col md={8} className="d-none d-md-block">
              {!selectedUser ? (
                <div className="d-flex h-100 align-items-center justify-content-center text-muted flex-column gap-2" style={{ minHeight: '500px' }}>
                  <div style={{ fontSize: '3rem' }}>💬</div>
                  <div>{t.no_chat}</div>
                </div>
              ) : <ChatContent {...chatProps} />}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ✅ المودال يظهر فقط على الهاتف */}
      {isMobile && (
        <Modal show={showChatModal} onHide={() => setShowChatModal(false)} size="lg" centered fullscreen="sm-down">
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title>💬 {selectedUser?.full_name || selectedUser?.name || selectedUser?.email}</Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-0" style={{ height: '500px' }}>
            {selectedUser && <ChatContent {...chatProps} />}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowChatModal(false)}>{t.close}</Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export default MessagesPage;