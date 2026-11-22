import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../supabaseClient';

const I18N = {
  fr: {
    dir: 'ltr',
    title: 'Gestion de Caisse',
    subtitle: 'Suivez les entrées, les sorties et le solde de votre caisse en temps réel.',
    open: 'Ouvrir la caisse',
    close: 'Fermer la caisse',
    closed: 'Caisse fermée',
    opened: 'Caisse ouverte',
    balance: 'Solde actuel',
    today_in: 'Entrées du jour',
    today_out: 'Sorties du jour',
    today_count: 'Mouvements du jour',
    open_amount: 'Fonds d’ouverture',
    close_amount: 'Montant de clôture',
    open_at: 'Ouverte à',
    add_move: 'Nouveau mouvement',
    search_ph: 'Rechercher un libellé...',
    all: 'Tous les types',
    in: 'Entrée',
    out: 'Sortie',
    th_date: 'Date / Heure',
    th_label: 'Libellé',
    th_type: 'Type',
    th_method: 'Méthode',
    th_amount: 'Montant',
    th_actions: 'Actions',
    loading: 'Chargement de la caisse...',
    none: 'Aucun mouvement.',
    edit: 'Modifier',
    delete: 'Supprimer',
    cancel: 'Annuler',
    save: 'Enregistrer',
    saving: 'Enregistrement...',
    modal_new: 'Nouveau mouvement',
    modal_edit: 'Modifier le mouvement',
    modal_open: 'Ouvrir la caisse',
    modal_close: 'Fermer la caisse',
    f_label: 'Libellé',
    f_type: 'Type',
    f_amount: 'Montant',
    f_method: 'Méthode de paiement',
    f_note: 'Note (optionnel)',
    cash: 'Espèces',
    card: 'Carte',
    transfer: 'Virement',
    other: 'Autre',
    delete_title: 'Supprimer ce mouvement ?',
    delete_warn: 'Cette action est irréversible.',
    delete_confirm: 'Oui, supprimer',
    ok_saved: 'Mouvement enregistré.',
    ok_deleted: 'Mouvement supprimé.',
    ok_opened: 'Caisse ouverte.',
    ok_closed: 'Caisse fermée.',
    err_save: "Erreur lors de l'enregistrement.",
    err_delete: 'Erreur lors de la suppression.',
    readonly: 'Mode lecture seule : vous pouvez consulter mais pas modifier la caisse.',
    no_cash: 'Aucune caisse ouverte. Ouvrez la caisse pour commencer la journée.',
    expected: 'Solde attendu à la fermeture',
    diff: 'Écart',
  },
  ar: {
    dir: 'rtl',
    title: 'إدارة الصندوق',
    subtitle: 'تابع المداخيل والمصاريف ورصيد الصندوق لحظة بلحظة.',
    open: 'فتح الصندوق',
    close: 'إغلاق الصندوق',
    closed: 'الصندوق مغلق',
    opened: 'الصندوق مفتوح',
    balance: 'الرصيد الحالي',
    today_in: 'مداخيل اليوم',
    today_out: 'مصاريف اليوم',
    today_count: 'حركات اليوم',
    open_amount: 'رصيد الافتتاح',
    close_amount: 'مبلغ الإغلاق',
    open_at: 'فُتح في',
    add_move: 'حركة جديدة',
    search_ph: 'ابحث بالبيان...',
    all: 'كل الأنواع',
    in: 'دخل',
    out: 'خرج',
    th_date: 'التاريخ / الساعة',
    th_label: 'البيان',
    th_type: 'النوع',
    th_method: 'طريقة الدفع',
    th_amount: 'المبلغ',
    th_actions: 'إجراءات',
    loading: 'جارٍ تحميل الصندوق...',
    none: 'لا توجد حركات.',
    edit: 'تعديل',
    delete: 'حذف',
    cancel: 'إلغاء',
    save: 'حفظ',
    saving: 'جارٍ الحفظ...',
    modal_new: 'حركة جديدة',
    modal_edit: 'تعديل الحركة',
    modal_open: 'فتح الصندوق',
    modal_close: 'إغلاق الصندوق',
    f_label: 'البيان',
    f_type: 'النوع',
    f_amount: 'المبلغ',
    f_method: 'طريقة الدفع',
    f_note: 'ملاحظة (اختياري)',
    cash: 'نقدًا',
    card: 'بطاقة',
    transfer: 'تحويل',
    other: 'أخرى',
    delete_title: 'حذف هذه الحركة؟',
    delete_warn: 'هذا الإجراء لا يمكن التراجع عنه.',
    delete_confirm: 'نعم، احذف',
    ok_saved: 'تم حفظ الحركة.',
    ok_deleted: 'تم حذف الحركة.',
    ok_opened: 'تم فتح الصندوق.',
    ok_closed: 'تم إغلاق الصندوق.',
    err_save: 'حدث خطأ أثناء الحفظ.',
    err_delete: 'حدث خطأ أثناء الحذف.',
    readonly: 'وضع القراءة فقط: يمكنك الاطلاع دون تعديل.',
    no_cash: 'لا يوجد صندوق مفتوح. افتح الصندوق لبدء اليوم.',
    expected: 'الرصيد المتوقع عند الإغلاق',
    diff: 'الفرق',
  },
};

const emptyForm = () => ({ label: '', type: 'in', amount: '', method: 'cash', note: '' });

const formatMoney = (v, locale) =>
  new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'fr-FR', { style: 'currency', currency: 'MRU', maximumFractionDigits: 0 }).format(Number(v || 0));

const formatDateTime = (d, locale) => {
  if (!d) return '—';
  return new Date(d).toLocaleString(locale === 'ar' ? 'ar-EG' : 'fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const normalizeMove = (m) => ({
  ...m,
  label: m.label || m.description || m.libelle || '',
  method: m.method || m.payment_method || 'cash',
  note: m.note || m.notes || '',
  type: m.type,
  amount: Number(m.amount || 0),
});

const denormalizeMove = (payload) => ({
  label: payload.label,
  description: payload.label,
  type: payload.type,
  amount: payload.amount,
  method: payload.method,
  payment_method: payload.method,
  note: payload.note,
  notes: payload.note,
  caisse_id: payload.caisse_id,
  created_by: payload.created_by,
});

const Caises = ({ user: userProp }) => {
  const { lang } = useLanguage();
  const t = I18N[lang] || I18N.fr;

  const [loggedUser, setLoggedUser] = useState(userProp || null);
  useEffect(() => {
    if (userProp) { setLoggedUser(userProp); return; }
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data: profile } = await supabase.from('profiles').select('role,status,name').eq('id', session.user.id).single();
      setLoggedUser({ id: session.user.id, email: session.user.email, name: profile?.name || session.user.email, role: String(profile?.role || session.user.user_metadata?.role || 'cashier').toLowerCase(), status: profile?.status || 'active' });
    };
    load();
  }, [userProp]);

  const role = String(loggedUser?.role || '').toLowerCase();
  const isAdmin = ['admin', 'administrateur', 'administrator'].includes(role);
  const canWrite = isAdmin || role === 'manager' || role === 'cashier';
  const canDelete = isAdmin;

  const [caisse, setCaisse] = useState(null);
  const [moves, setMoves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showOpen, setShowOpen] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [currentMove, setCurrentMove] = useState(null);
  const [formData, setFormData] = useState(emptyForm());
  const [openAmount, setOpenAmount] = useState('');
  const [closeAmount, setCloseAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: caisseData, error: caisseErr } = await supabase.from('caisse').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (caisseErr) throw caisseErr;
      setCaisse(caisseData || null);
      const { data: movesData, error } = await supabase.from('cash_movements').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setMoves((movesData || []).map(normalizeMove));
    } catch (e) { console.error(e); showToast(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayMoves = moves.filter(m => new Date(m.created_at).toDateString() === today);
    const totalIn = todayMoves.filter(m => m.type === 'in').reduce((s, m) => s + Number(m.amount || 0), 0);
    const totalOut = todayMoves.filter(m => m.type === 'out').reduce((s, m) => s + Number(m.amount || 0), 0);
    return { totalIn, totalOut, count: todayMoves.length, balance: Number(caisse?.open_amount || 0) + totalIn - totalOut };
  }, [moves, caisse]);

  const filtered = useMemo(() => {
    const needle = search.toLowerCase();
    return moves.filter(m => {
      const okSearch = !search || (m.label || '').toLowerCase().includes(needle);
      const okType = filterType === 'all' || m.type === filterType;
      return okSearch && okType;
    });
  }, [moves, search, filterType]);

  // ✅ OUVRIR CAISSE
  const handleOpenCaisse = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { open_amount: Number(openAmount || 0), status: 'open', opened_by: loggedUser?.email || '', opened_at: new Date().toISOString() };
      const { data, error } = await supabase.from('caisse').insert(payload).select().single();
      if (error) throw error;
      setCaisse(data);
      setShowOpen(false);
      setOpenAmount('');
      showToast(t.ok_opened);
      await fetchData();
    } catch (err) { console.error(err); showToast(err.message || t.err_save); }
    finally { setSaving(false); }
  };

  const handleCloseCaisse = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (caisse?.id) {
        const { error } = await supabase.from('caisse').update({ status: 'closed', close_amount: Number(closeAmount || stats.balance), closed_at: new Date().toISOString() }).eq('id', caisse.id);
        if (error) throw error;
      }
      setCaisse(null);
      setShowClose(false);
      setCloseAmount('');
      showToast(t.ok_closed);
    } catch (err) { console.error(err); showToast(err.message || t.err_save); }
    finally { setSaving(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canWrite) return;
    setSaving(true);
    try {
      const payload = { label: formData.label, type: formData.type, amount: Number(formData.amount || 0), method: formData.method, note: formData.note, caisse_id: caisse?.id || null, created_by: loggedUser?.email || '' };
      if (currentMove) {
        const { error } = await supabase.from('cash_movements').update(denormalizeMove(payload)).eq('id', currentMove.id);
        if (error) throw error;
        setMoves(prev => prev.map(m => m.id === currentMove.id ? { ...m, ...normalizeMove(payload), id: currentMove.id, created_at: m.created_at } : m));
      } else {
        const { data, error } = await supabase.from('cash_movements').insert({ ...denormalizeMove(payload), created_at: new Date().toISOString() }).select().single();
        if (error) throw error;
        setMoves(prev => [normalizeMove(data), ...prev]);
      }
      setShowForm(false);
      showToast(t.ok_saved);
    } catch (err) { console.error(err); showToast(err.message || t.err_save); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!canDelete || !currentMove) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('cash_movements').delete().eq('id', currentMove.id);
      if (error) throw error;
      setMoves(prev => prev.filter(m => m.id !== currentMove.id));
      setShowDelete(false);
      showToast(t.ok_deleted);
    } catch (err) { console.error(err); showToast(err.message || t.err_delete); }
    finally { setSaving(false); }
  };

  const methodLabel = (m) => ({ cash: t.cash, card: t.card, transfer: t.transfer, other: t.other }[m] || m);

  // ✅ BOUTONS - fonctions séparées, pas de flèche inline qui casse
  const onClickOpen = () => { setShowOpen(true); };
  const onClickClose = () => { setCloseAmount(String(stats.balance)); setShowClose(true); };
  const onClickAdd = () => { setCurrentMove(null); setFormData(emptyForm()); setShowForm(true); };

  return (
    <div className="caisse-page" dir={t.dir} lang={lang}>
      <style>{`
        .caisse-page{--ink:#14213d;--muted:#66748b;--line:#e3e9f2;--bg:#f8fafc;--primary:#1f5eea;--primary-soft:#e8efff;--green:#0f9d74;--green-soft:#def7ee;--red:#d63c4a;--red-soft:#fde8ea;--amber:#e08a0b;--amber-soft:#fff0d6;width:100%;min-height:100vh;padding:clamp(10px,2vw,22px);background:var(--bg);color:var(--ink);font-family:Inter,'Segoe UI',system-ui,sans-serif}
        .caisse-page[lang="ar"]{font-family:Cairo,'Segoe UI',Tahoma,sans-serif;line-height:1.7}
        .caisse-page *{box-sizing:border-box}
        .caisse-header{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:14px;margin-bottom:20px}
        .caisse-header h1{margin:0 0 7px;font-size:clamp(23px,1.6vw + 15px,32px);font-weight:800;display:flex;gap:12px;align-items:center}
        .caisse-header p{margin:0;color:var(--muted)}
        .btn-primary,.btn-success,.btn-danger,.btn-cancel{display:flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:11px 18px;border:none;border-radius:10px;font-weight:700;cursor:pointer}
        .btn-primary{background:var(--primary);color:#fff}.btn-success{background:#0f9d74;color:#fff}.btn-danger{background:var(--red);color:#fff}.btn-cancel{background:#fff;border:1px solid var(--line);color:var(--ink)}
        .btn-success:hover,.btn-primary:hover,.btn-danger:hover{filter:brightness(.92)}
        .stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:20px}
        .stat{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px;box-shadow:0 4px 14px rgba(20,33,61,.04)}
        .stat small{color:var(--muted);font-weight:700}.stat b{display:block;margin-top:6px;font-size:clamp(20px,1.4vw + 14px,28px)}
        .stat.green b{color:var(--green)}.stat.red b{color:var(--red)}.stat.blue b{color:var(--primary)}
        .status-pill{display:inline-flex;gap:8px;align-items:center;padding:6px 12px;border-radius:99px;font-weight:700;font-size:13px}.pill-open{background:var(--green-soft);color:var(--green)}.pill-closed{background:#f1f5f9;color:#64748b}
        .card{background:#fff;border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:0 4px 14px rgba(20,33,61,.04)}
        .filters{display:flex;flex-wrap:wrap;gap:12px;padding:15px 20px;border-bottom:1px solid var(--line)}
        .input{height:46px;padding:0 14px;border:1px solid #d9e1ed;border-radius:9px;background:#fff;font-size:16px;outline:none;width:100%}
        .search{position:relative;flex:1 1 260px}.search i{position:absolute;top:50%;inset-inline-start:15px;transform:translateY(-50%);color:var(--muted)}
        .search .input{padding-inline-start:42px}.filters select{flex:0 1 200px}
        .table-wrap{overflow-x:auto}.table{width:100%;min-width:720px;border-collapse:collapse}.table th{padding:15px 18px;background:#f8fafc;color:var(--muted);text-align:start;font-size:12px;font-weight:800;border-bottom:1px solid var(--line);white-space:nowrap}.table td{padding:15px 18px;border-bottom:1px solid var(--line);font-size:14px}
        .badge{display:inline-flex;padding:6px 11px;border-radius:99px;font-size:12px;font-weight:700;white-space:nowrap}.badge-in{background:var(--green-soft);color:var(--green)}.badge-out{background:var(--red-soft);color:var(--red)}
        .actions{display:flex;justify-content:flex-end;gap:8px}.icon-btn{width:38px;height:38px;border-radius:9px;border:1px solid transparent;display:flex;align-items:center;justify-content:center;cursor:pointer}.icon-edit{background:var(--primary-soft);color:var(--primary);border-color:#c9daff}.icon-del{background:var(--red-soft);color:var(--red);border-color:#f6c8cd}.icon-del:disabled{opacity:.35;cursor:not-allowed}
        .overlay{position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,.6);display:flex;align-items:center;justify-content:center;padding:16px}.modal{width:100%;max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,.2)}.modal-h{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;background:#f8fafc;border-bottom:1px solid var(--line)}.modal-h h3{margin:0}.modal-b{padding:20px}.form-group{margin-bottom:16px}.form-group label{display:block;margin-bottom:7px;font-weight:700;font-size:14px;color:#4b5b75}.modal-f{display:flex;justify-content:flex-end;gap:10px;padding:14px 20px;background:#f8fafc;border-top:1px solid var(--line)}
        .toast{position:fixed;top:16px;inset-inline-end:16px;background:#fff;padding:13px 18px;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.1);font-weight:600;z-index:1100;border-inline-start:4px solid var(--green)}
        .empty{padding:50px 20px;text-align:center;color:var(--muted)}
        @media(max-width:900px){.stats{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:560px){.stats{grid-template-columns:1fr}.caisse-header{flex-direction:column}.caisse-header .btn-primary,.caisse-header .btn-success,.caisse-header .btn-danger{width:100%}.filters{flex-direction:column}.filters select{flex:1 1 auto;width:100%}.overlay{align-items:flex-end;padding:0}.modal{border-radius:18px 18px 0 0;max-height:90dvh}}
      `}</style>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />

      <div className="caisse-header">
        <div>
          <h1><i className="fas fa-cash-register" style={{ color: 'var(--primary)' }} /> {t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {caisse ? (
            <button type="button" className="btn-danger" onClick={onClickClose}>
              <i className="fas fa-lock" /> {t.close}
            </button>
          ) : (
            <button type="button" className="btn-success" onClick={onClickOpen}>
              <i className="fas fa-lock-open" /> {t.open}
            </button>
          )}
          {caisse && canWrite && (
            <button type="button" className="btn-primary" onClick={onClickAdd}>
              <i className="fas fa-plus" /> {t.add_move}
            </button>
          )}
        </div>
      </div>

      {!canWrite && <div style={{ background: 'var(--amber-soft)', border: '1px solid #f5dcb0', padding: '13px 16px', borderRadius: 11, color: '#94590a', marginBottom: 16 }}>{t.readonly}</div>}

      <div className="stats">
        <div className="stat blue"><small>{t.balance}</small><b>{formatMoney(stats.balance, lang)}</b><span className={`status-pill ${caisse ? 'pill-open' : 'pill-closed'}`}>{caisse ? t.opened : t.closed}</span></div>
        <div className="stat green"><small>{t.today_in}</small><b>+ {formatMoney(stats.totalIn, lang)}</b></div>
        <div className="stat red"><small>{t.today_out}</small><b>- {formatMoney(stats.totalOut, lang)}</b></div>
        <div className="stat"><small>{t.today_count}</small><b>{stats.count}</b>{caisse && <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>{t.open_amount} : {formatMoney(caisse.open_amount, lang)} • {t.open_at} {formatDateTime(caisse.opened_at || caisse.created_at, lang)}</div>}</div>
      </div>

      {!caisse && !loading && <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: '14px 16px', borderRadius: 12, marginBottom: 16, color: '#9a3412' }}><i className="fas fa-info-circle" /> {' '}{t.no_cash}</div>}

      <div className="card">
        <div className="filters">
          <div className="search"><i className="fas fa-search" /><input className="input" placeholder={t.search_ph} value={search} onChange={e => setSearch(e.target.value)} /></div>
          <select className="input" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="all">{t.all}</option>
            <option value="in">{t.in}</option>
            <option value="out">{t.out}</option>
          </select>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>{t.th_date}</th><th>{t.th_label}</th><th>{t.th_type}</th><th>{t.th_method}</th><th>{t.th_amount}</th>{canWrite && <th style={{ textAlign: 'end' }}>{t.th_actions}</th>}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="empty">{t.loading}</td></tr>
                : filtered.length === 0 ? <tr><td colSpan={6} className="empty">{t.none}</td></tr>
                  : filtered.map(m => (
                    <tr key={m.id}>
                      <td style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }}>{formatDateTime(m.created_at, lang)}</td>
                      <td><b>{m.label}</b>{m.note && <div style={{ color: 'var(--muted)', fontSize: 12 }}>{m.note}</div>}</td>
                      <td><span className={`badge ${m.type === 'in' ? 'badge-in' : 'badge-out'}`}>{m.type === 'in' ? t.in : t.out}</span></td>
                      <td>{methodLabel(m.method)}</td>
                      <td style={{ fontWeight: 800, color: m.type === 'in' ? 'var(--green)' : 'var(--red)' }}>{m.type === 'in' ? '+' : '-'} {formatMoney(m.amount, lang)}</td>
                      {canWrite && <td><div className="actions">
                        <button type="button" className="icon-btn icon-edit" onClick={() => { setCurrentMove(m); setFormData({ label: m.label || '', type: m.type, amount: String(m.amount || ''), method: m.method || 'cash', note: m.note || '' }); setShowForm(true); }} title={t.edit}><i className="fas fa-pen" /></button>
                        <button type="button" className="icon-btn icon-del" disabled={!canDelete} onClick={() => { setCurrentMove(m); setShowDelete(true); }} title={t.delete}><i className="fas fa-trash-alt" /></button>
                      </div></td>}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="overlay" onMouseDown={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal"><div className="modal-h"><h3>{currentMove ? t.modal_edit : t.modal_new}</h3><button type="button" className="icon-btn" onClick={() => setShowForm(false)}><i className="fas fa-times" /></button></div>
            <form onSubmit={handleSubmit}><div className="modal-b">
              <div className="form-group"><label>{t.f_label}</label><input className="input" required value={formData.label} onChange={e => setFormData({ ...formData, label: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group"><label>{t.f_type}</label><select className="input" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}><option value="in">{t.in}</option><option value="out">{t.out}</option></select></div>
                <div className="form-group"><label>{t.f_amount}</label><input className="input" type="number" min="0" step="0.01" required value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>{t.f_method}</label><select className="input" value={formData.method} onChange={e => setFormData({ ...formData, method: e.target.value })}><option value="cash">{t.cash}</option><option value="card">{t.card}</option><option value="transfer">{t.transfer}</option><option value="other">{t.other}</option></select></div>
              <div className="form-group"><label>{t.f_note}</label><input className="input" value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} /></div>
            </div><div className="modal-f"><button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>{t.cancel}</button><button type="submit" className="btn-primary" disabled={saving}>{saving ? t.saving : t.save}</button></div></form>
          </div>
        </div>
      )}

      {showOpen && (
        <div className="overlay" onMouseDown={e => e.target === e.currentTarget && setShowOpen(false)}>
          <div className="modal"><div className="modal-h"><h3>{t.modal_open}</h3><button type="button" className="icon-btn" onClick={() => setShowOpen(false)}><i className="fas fa-times" /></button></div>
            <form onSubmit={handleOpenCaisse}><div className="modal-b"><div className="form-group"><label>{t.open_amount}</label><input className="input" type="number" min="0" step="0.01" required autoFocus value={openAmount} onChange={e => setOpenAmount(e.target.value)} /></div></div>
              <div className="modal-f"><button type="button" className="btn-cancel" onClick={() => setShowOpen(false)}>{t.cancel}</button><button type="submit" className="btn-success" disabled={saving}>{t.open}</button></div></form>
          </div>
        </div>
      )}

      {showClose && (
        <div className="overlay" onMouseDown={e => e.target === e.currentTarget && setShowClose(false)}>
          <div className="modal"><div className="modal-h"><h3>{t.modal_close}</h3><button type="button" className="icon-btn" onClick={() => setShowClose(false)}><i className="fas fa-times" /></button></div>
            <form onSubmit={handleCloseCaisse}><div className="modal-b">
              <p style={{ color: 'var(--muted)' }}>{t.expected} : <b style={{ color: 'var(--ink)' }}>{formatMoney(stats.balance, lang)}</b></p>
              <div className="form-group"><label>{t.close_amount}</label><input className="input" type="number" min="0" step="0.01" required value={closeAmount} onChange={e => setCloseAmount(e.target.value)} /></div>
              <p style={{ color: 'var(--muted)' }}>{t.diff} : <b>{formatMoney(Number(closeAmount || 0) - stats.balance, lang)}</b></p>
            </div><div className="modal-f"><button type="button" className="btn-cancel" onClick={() => setShowClose(false)}>{t.cancel}</button><button type="submit" className="btn-danger" disabled={saving}>{t.close}</button></div></form>
          </div>
        </div>
      )}

      {showDelete && currentMove && (
        <div className="overlay" onMouseDown={e => e.target === e.currentTarget && setShowDelete(false)}>
          <div className="modal" style={{ maxWidth: 420 }}><div className="modal-b" style={{ textAlign: 'center' }}><h3>{t.delete_title}</h3><p style={{ color: 'var(--muted)' }}>{t.delete_warn}</p><b>{currentMove.label} — {formatMoney(currentMove.amount, lang)}</b></div>
            <div className="modal-f" style={{ justifyContent: 'center' }}><button type="button" className="btn-cancel" onClick={() => setShowDelete(false)}>{t.cancel}</button><button type="button" className="btn-danger" onClick={handleDelete} disabled={saving}>{t.delete_confirm}</button></div>
          </div>
        </div>
      )}

      {toast.show && <div className="toast">{toast.message}</div>}
    </div>
  );
};

export default Caises;