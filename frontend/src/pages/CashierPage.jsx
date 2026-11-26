// src/pages/CashRegisterPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { salesApi, registerApi } from '../api';

const I18N = {
  fr: {
    dir: 'ltr', currency: 'MRU', locale: 'fr-FR',
    title: 'Gestion de caisse',
    subtitle: 'Ouvrez, suivez et clôturez votre tiroir-caisse.',
    open_title: 'Ouvrir la caisse',
    open_subtitle: 'Saisissez le fond de caisse pour démarrer la session.',
    open_btn: 'Démarrer la session',
    opening_amount: 'Fond de caisse initial',
    status_open: 'Session en cours',
    since: 'depuis',
    refresh: 'Actualiser',
    close_btn: 'Clôturer la caisse',
    kpi_opening: 'Fond de caisse',
    kpi_cash: 'Ventes espèces',
    kpi_in: 'Entrées',
    kpi_out: 'Sorties',
    expected: 'Espèces attendues dans le tiroir',
    sales_title: 'Ventes de la session',
    sales_empty: 'Aucune vente depuis l’ouverture.',
    sales_total: 'Total des ventes',
    not_in_drawer: 'hors tiroir',
    unpaid: 'non encaissé',
    mov_title: 'Mouvements d’espèces',
    mov_in: 'Entrée',
    mov_out: 'Sortie',
    amount: 'Montant',
    reason: 'Motif',
    reason_ph_in: 'Ex. : apport de monnaie',
    reason_ph_out: 'Ex. : achat de fournitures',
    add: 'Enregistrer',
    mov_empty: 'Aucun mouvement enregistré.',
    history: 'Historique des clôtures',
    hist_empty: 'Aucune clôture pour le moment.',
    h_period: 'Période', h_expected: 'Attendu', h_counted: 'Compté', h_diff: 'Écart',
    close_title: 'Clôturer la caisse',
    counted: 'Espèces comptées dans le tiroir',
    diff: 'Écart',
    diff_ok: 'La caisse est juste.',
    diff_over: 'Excédent',
    diff_short: 'Manque',
    note: 'Remarque (facultatif)',
    cancel: 'Annuler',
    confirm_close: 'Confirmer la clôture',
    ok_open: 'Caisse ouverte avec succès.',
    ok_close: 'Caisse clôturée.',
    ok_mov: 'Mouvement enregistré.',
    err_amount: 'Saisissez un montant valide.',
    err_reason: 'Indiquez le motif du mouvement.',
    err_funds: 'Espèces insuffisantes dans le tiroir.',
    err_count: 'Saisissez le montant compté.',
    pm: { cash: 'Espèces', bankily: 'Bankily', masrivi: 'Masrivi', sedad: 'Sedad', clic: 'Clic', other: 'Autre', credit: 'Crédit' },
  },
  ar: {
    dir: 'rtl', currency: 'أوقية', locale: 'ar-u-nu-latn',
    title: 'إدارة الصندوق',
    subtitle: 'افتح صندوقك وتابعه وأغلقه.',
    open_title: 'فتح الصندوق',
    open_subtitle: 'أدخل رصيد الافتتاح لبدء الجلسة.',
    open_btn: 'بدء الجلسة',
    opening_amount: 'رصيد الافتتاح',
    status_open: 'الجلسة الجارية',
    since: 'منذ',
    refresh: 'تحديث',
    close_btn: 'إغلاق الصندوق',
    kpi_opening: 'رصيد الافتتاح',
    kpi_cash: 'مبيعات نقدية',
    kpi_in: 'المداخيل',
    kpi_out: 'المصروفات',
    expected: 'النقد المتوقع في الدرج',
    sales_title: 'مبيعات الجلسة',
    sales_empty: 'لا توجد مبيعات منذ الفتح.',
    sales_total: 'إجمالي المبيعات',
    not_in_drawer: 'خارج الدرج',
    unpaid: 'غير محصّل',
    mov_title: 'حركات النقد',
    mov_in: 'إيداع',
    mov_out: 'سحب',
    amount: 'المبلغ',
    reason: 'السبب',
    reason_ph_in: 'مثال: إضافة فكة',
    reason_ph_out: 'مثال: شراء مستلزمات',
    add: 'تسجيل',
    mov_empty: 'لا توجد حركات مسجّلة.',
    history: 'سجل الإغلاقات',
    hist_empty: 'لا توجد إغلاقات حتى الآن.',
    h_period: 'الفترة', h_expected: 'المتوقع', h_counted: 'المعدود', h_diff: 'الفارق',
    close_title: 'إغلاق الصندوق',
    counted: 'النقد المعدود في الدرج',
    diff: 'الفارق',
    diff_ok: 'الصندوق مطابق.',
    diff_over: 'زيادة',
    diff_short: 'نقص',
    note: 'ملاحظة (اختياري)',
    cancel: 'إلغاء',
    confirm_close: 'تأكيد الإغلاق',
    ok_open: 'تم فتح الصندوق بنجاح.',
    ok_close: 'تم إغلاق الصندوق.',
    ok_mov: 'تم تسجيل الحركة.',
    err_amount: 'أدخل مبلغًا صحيحًا.',
    err_reason: 'اذكر سبب الحركة.',
    err_funds: 'النقد في الدرج غير كافٍ.',
    err_count: 'أدخل المبلغ المعدود.',
    pm: { cash: 'نقدًا', bankily: 'بنكيلي', masrivi: 'مصرفي', sedad: 'سداد', clic: 'كليك', other: 'أخرى', credit: 'آجل' },
  },
};

const LANG_KEY = 'gestistock_lang';

const PM_ORDER = ['cash', 'bankily', 'masrivi', 'sedad', 'clic', 'other', 'credit'];
const PM_ICON = {
  cash: 'fa-money-bill-wave', bankily: 'fa-mobile-alt', masrivi: 'fa-mobile-alt',
  sedad: 'fa-mobile-alt', clic: 'fa-credit-card', other: 'fa-wallet', credit: 'fa-hand-holding-usd',
};

const CashRegisterPage = () => {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem(LANG_KEY) === 'ar' ? 'ar' : 'fr'; } catch { return 'fr'; }
  });
  const t = I18N[lang];
  useEffect(() => { try { localStorage.setItem(LANG_KEY, lang); } catch {} }, [lang]);

  // États base de données
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // États formulaire & ventes
  const [sales, setSales] = useState([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('');
  const [movType, setMovType] = useState('in');
  const [movAmount, setMovAmount] = useState('');
  const [movReason, setMovReason] = useState('');
  const [showClose, setShowClose] = useState(false);
  const [counted, setCounted] = useState('');
  const [closeNote, setCloseNote] = useState('');
  const [toast, setToast] = useState(null);

  const fmt = (n) => Number(n || 0).toLocaleString('fr-FR');
  const fmtDate = (d) => new Date(d).toLocaleString(t.locale, { dateStyle: 'short', timeStyle: 'short' });
  const fmtTime = (d) => new Date(d).toLocaleTimeString(t.locale, { timeStyle: 'short' });

  const notify = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ---- Charger les données ---- */
  const loadData = async () => {
    setLoading(true);
    try {
      const { data: currentSession } = await registerApi.getCurrentSession();
      if (currentSession) {
        const { data: movements } = await registerApi.getMovements(currentSession.id);
        setCurrent({ ...currentSession, movements: movements || [] });
      } else {
        setCurrent(null);
      }
      const { data: hist } = await registerApi.getHistory();
      setHistory(hist || []);
    } catch (err) {
      console.error('Erreur chargement caisse:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  /* ---- Ouvrir la caisse ---- */
  const handleOpen = async () => {
    const amount = Number(openingAmount) || 0;
    try {
      await registerApi.openSession(amount);
      setOpeningAmount('');
      await loadData();
      notify(t.ok_open);
    } catch (err) {
      console.error(err);
      notify('Erreur lors de l\'ouverture', 'danger');
    }
  };

  /* ---- Ventes depuis l'ouverture ---- */
  const fetchSales = async () => {
    if (!current) return;
    setLoadingSales(true);
    try {
      const res = await salesApi.getAll();
      const list = Array.isArray(res) ? res : res?.data || [];
      const since = new Date(current.opened_at).getTime();
      setSales(list.filter((s) => new Date(s.created_at || s.date || 0).getTime() >= since));
    } catch (err) {
      console.error(err);
      setSales([]);
    } finally {
      setLoadingSales(false);
    }
  };

  useEffect(() => { fetchSales(); /* eslint-disable-next-line */ }, [current?.id]);

  /* ---- Calculs ---- */
  const byMethod = useMemo(() => {
    const acc = {};
    sales.forEach((s) => {
      const m = s.payment_method || 'other';
      acc[m] = (acc[m] || 0) + Number(s.grand_total ?? s.total ?? 0);
    });
    return acc;
  }, [sales]);

  const salesTotal = Object.values(byMethod).reduce((a, b) => a + b, 0);
  const cashSales = byMethod.cash || 0;
  const movIn = (current?.movements || []).filter((m) => m.type === 'in').reduce((a, m) => a + Number(m.amount), 0);
  const movOut = (current?.movements || []).filter((m) => m.type === 'out').reduce((a, m) => a + Number(m.amount), 0);
  const expected = Number(current?.opening_amount || 0) + cashSales + movIn - movOut;
  const maxMethod = Math.max(1, ...Object.values(byMethod));

  const countedNum = Number(counted);
  const diff = counted === '' ? 0 : countedNum - expected;

  /* ---- Ajouter un mouvement ---- */
  const addMovement = async () => {
    const amount = Number(movAmount);
    if (!(amount > 0)) return notify(t.err_amount, 'danger');
    if (!movReason.trim()) return notify(t.err_reason, 'danger');
    if (movType === 'out' && amount > expected) return notify(t.err_funds, 'danger');

    try {
      await registerApi.addMovement(current.id, { type: movType, amount, reason: movReason.trim() });
      setMovAmount(''); setMovReason('');
      await loadData(); // Recharge les mouvements
      notify(t.ok_mov);
    } catch (err) {
      console.error(err);
      notify('Erreur lors de l\'enregistrement', 'danger');
    }
  };

  /* ---- Clôturer la caisse ---- */
  const closeRegister = async () => {
    if (counted === '' || isNaN(countedNum)) return notify(t.err_count, 'danger');
    
    try {
      await registerApi.closeSession(current.id, {
        expected,
        counted: countedNum,
        diff,
        notes: closeNote.trim()
      });
      setShowClose(false); setCounted(''); setCloseNote(''); setSales([]);
      await loadData(); // Recharge, ce qui va mettre current à null
      notify(t.ok_close);
    } catch (err) {
      console.error(err);
      notify('Erreur lors de la clôture', 'danger');
    }
  };

  const diffClass = (d) => (d === 0 ? 'ok' : d > 0 ? 'over' : 'short');
  const diffLabel = (d) => (d === 0 ? t.diff_ok : `${d > 0 ? t.diff_over : t.diff_short} : ${fmt(Math.abs(d))} ${t.currency}`);

  if (loading) {
    return <div className="cr" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Chargement de la caisse...</div>;
  }

  return (
    <div className="cr" dir={t.dir} lang={lang}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      <style>{`
        .cr {
          --ink:#14213d; --muted:#66748b; --line:#e3e9f2; --bg:#f8fafc; --card:#fff;
          --primary:#1f5eea; --primary-soft:#e8efff;
          --green:#0f9d74; --green-soft:#def7ee;
          --red:#d63c4a; --red-soft:#fde8ea;
          --amber:#b45309; --amber-soft:#fef3c7;
          padding:24px; background:var(--bg); min-height:calc(100vh - 100px);
          font-family:Inter, 'Cairo', sans-serif; color:var(--ink);
        }
        .cr *, .cr *::before, .cr *::after { box-sizing:border-box; }
        .cr-top { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; flex-wrap:wrap; margin-bottom:20px; }
        .cr-top h1 { margin:0 0 4px; font-size:24px; font-weight:800; }
        .cr-top p { margin:0; color:var(--muted); font-size:14px; }
        .cr-actions { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
        .cr-status { display:inline-flex; align-items:center; gap:8px; background:var(--green-soft); color:var(--green); padding:8px 14px; border-radius:99px; font-weight:700; font-size:13px; }
        .cr-status::before { content:''; width:8px; height:8px; border-radius:50%; background:var(--green); }

        .cr-btn { height:42px; padding:0 18px; border-radius:10px; border:1px solid var(--line); background:#fff; color:var(--ink); font:inherit; font-size:14px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:8px; transition:.15s; }
        .cr-btn:hover { border-color:var(--primary); color:var(--primary); }
        .cr-btn.primary { background:var(--primary); border-color:var(--primary); color:#fff; }
        .cr-btn.primary:hover { background:#1e4ed8; color:#fff; }
        .cr-btn.danger { background:var(--ink); border-color:var(--ink); color:#fff; }
        .cr-btn.danger:hover { background:#0d1730; color:#fff; }
        .cr-btn:disabled { opacity:.5; cursor:not-allowed; }
        .cr button:focus-visible, .cr input:focus-visible, .cr textarea:focus-visible { outline:3px solid #f97316; outline-offset:2px; }

        .cr-card { background:var(--card); border:1px solid var(--line); border-radius:16px; box-shadow:0 4px 14px rgba(20,33,61,.03); }
        .cr-card h2 { margin:0; font-size:16px; font-weight:800; }
        .cr-card-head { padding:18px 20px; border-bottom:1px solid var(--line); display:flex; justify-content:space-between; align-items:center; gap:10px; }
        .cr-card-body { padding:20px; }

        .cr-input { width:100%; height:46px; border:1px solid #d9e1ed; border-radius:10px; padding:0 14px; font:inherit; font-size:15px; background:#fff; outline:none; }
        .cr-input:focus { border-color:var(--primary); box-shadow:0 0 0 3px var(--primary-soft); }
        textarea.cr-input { height:72px; padding:10px 14px; resize:vertical; }
        .cr-label { display:block; font-size:12px; font-weight:700; color:var(--muted); margin-bottom:6px; }

        /* KPIs */
        .cr-kpis { display:grid; grid-template-columns:repeat(4, 1fr); gap:16px; margin-bottom:16px; }
        .cr-kpi { padding:18px 20px; }
        .cr-kpi small { display:block; color:var(--muted); font-size:12px; font-weight:700; margin-bottom:8px; }
        .cr-kpi strong { font-size:22px; font-weight:800; }
        .cr-kpi strong span { font-size:12px; font-weight:700; color:var(--muted); margin-inline-start:4px; }
        .cr-kpi.in strong { color:var(--green); }
        .cr-kpi.out strong { color:var(--red); }
        .cr-expected { background:var(--ink); color:#fff; border-color:var(--ink); padding:22px 24px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; }
        .cr-expected small { color:#a9b6cc; font-weight:700; font-size:13px; }
        .cr-expected strong { font-size:34px; font-weight:800; letter-spacing:-.5px; }
        .cr-expected strong span { font-size:15px; margin-inline-start:6px; color:#a9b6cc; font-weight:700; }

        .cr-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }

        /* Écran d'ouverture */
        .cr-open-screen { max-width:400px; margin:60px auto; text-align:center; padding:40px; }
        .cr-open-icon { font-size:48px; color:var(--primary); margin-bottom:16px; }

        /* Ventes par mode */
        .cr-method { margin-bottom:16px; }
        .cr-method:last-child { margin-bottom:0; }
        .cr-method-row { display:flex; justify-content:space-between; font-size:14px; font-weight:700; margin-bottom:6px; gap:10px; }
        .cr-method-row i { width:20px; color:var(--muted); }
        .cr-method-row em { font-style:normal; font-weight:600; font-size:11px; color:var(--muted); margin-inline-start:6px; }
        .cr-bar { height:8px; background:#eef2f8; border-radius:99px; overflow:hidden; }
        .cr-bar > div { height:100%; border-radius:99px; background:var(--primary); }
        .cr-bar > div.cash { background:var(--green); }
        .cr-bar > div.credit { background:#f97316; }
        .cr-total-row { display:flex; justify-content:space-between; border-top:1px dashed #cbd5e1; margin-top:18px; padding-top:14px; font-weight:800; }

        /* Mouvements */
        .cr-seg { display:grid; grid-template-columns:1fr 1fr; gap:6px; background:#eef2f8; padding:4px; border-radius:12px; margin-bottom:14px; }
        .cr-seg button { height:38px; border:none; border-radius:9px; background:transparent; font:inherit; font-weight:700; font-size:13px; color:var(--muted); cursor:pointer; }
        .cr-seg button.on.in { background:#fff; color:var(--green); box-shadow:0 1px 3px rgba(0,0,0,.08); }
        .cr-seg button.on.out { background:#fff; color:var(--red); box-shadow:0 1px 3px rgba(0,0,0,.08); }
        .cr-form-row { display:grid; grid-template-columns:130px 1fr; gap:10px; margin-bottom:12px; }
        .cr-mov-list { margin-top:18px; border-top:1px solid var(--line); max-height:240px; overflow-y:auto; }
        .cr-mov { display:flex; justify-content:space-between; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid #f1f5f9; font-size:14px; }
        .cr-mov small { display:block; color:var(--muted); font-size:12px; margin-top:2px; }
        .cr-mov b.in { color:var(--green); } .cr-mov b.out { color:var(--red); }
        .cr-empty { text-align:center; color:var(--muted); font-size:14px; padding:24px 0 8px; }

        /* Historique */
        .cr-table-wrap { overflow-x:auto; }
        .cr-table { width:100%; border-collapse:collapse; font-size:14px; min-width:560px; }
        .cr-table th { text-align:start; font-size:12px; color:var(--muted); font-weight:700; padding:12px 20px; border-bottom:1px solid var(--line); background:#fafbfd; }
        .cr-table td { padding:14px 20px; border-bottom:1px solid #f1f5f9; white-space:nowrap; }
        .cr-table tr:last-child td { border-bottom:none; }
        .pill { display:inline-block; padding:3px 10px; border-radius:99px; font-weight:700; font-size:12px; }
        .pill.ok { background:var(--green-soft); color:var(--green); }
        .pill.over { background:var(--amber-soft); color:var(--amber); }
        .pill.short { background:var(--red-soft); color:var(--red); }

        /* Modale */
        .cr-overlay { position:fixed; inset:0; background:rgba(20,33,61,.45); display:flex; align-items:center; justify-content:center; padding:20px; z-index:1000; }
        .cr-modal { width:100%; max-width:440px; background:#fff; border-radius:18px; padding:26px; box-shadow:0 24px 60px rgba(20,33,61,.3); }
        .cr-modal h2 { margin:0 0 18px; font-size:19px; font-weight:800; }
        .cr-modal-line { display:flex; justify-content:space-between; padding:12px 14px; background:var(--bg); border-radius:10px; margin-bottom:14px; font-weight:700; font-size:14px; }
        .cr-diff { padding:12px 14px; border-radius:10px; font-weight:800; font-size:14px; margin:14px 0; }
        .cr-diff.ok { background:var(--green-soft); color:var(--green); }
        .cr-diff.over { background:var(--amber-soft); color:var(--amber); }
        .cr-diff.short { background:var(--red-soft); color:var(--red); }
        .cr-modal-actions { display:flex; gap:10px; margin-top:18px; }
        .cr-modal-actions .cr-btn { flex:1; justify-content:center; }

        .cr-toast { position:fixed; top:20px; left:50%; transform:translateX(-50%); padding:12px 24px; border-radius:10px; color:#fff; font-weight:700; z-index:1100; box-shadow:0 10px 24px rgba(0,0,0,.15); }
        .cr-toast.success { background:var(--green); } .cr-toast.danger { background:var(--red); }

        @media (max-width:1024px) { .cr-kpis { grid-template-columns:repeat(2,1fr); } .cr-grid { grid-template-columns:1fr; } }
        @media (max-width:520px) { .cr { padding:16px; } .cr-form-row { grid-template-columns:1fr; } .cr-expected strong { font-size:28px; } }
        .fa-spin-slow { animation:crspin 1s linear infinite; }
        @keyframes crspin { to { transform:rotate(360deg); } }
        @media (prefers-reduced-motion:reduce) { .fa-spin-slow { animation:none; } }
      `}</style>

      <div className="cr-top">
        <div>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <div className="cr-actions">
          <button className="cr-btn" onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')}>
            {lang === 'fr' ? 'عربية' : 'Français'}
          </button>
          {current && (
            <>
              <span className="cr-status">{t.status_open} · {t.since} {fmtTime(current.opened_at)}</span>
              <button className="cr-btn" onClick={fetchSales} disabled={loadingSales}>
                <i className={`fas fa-sync-alt ${loadingSales ? 'fa-spin-slow' : ''}`}></i> {t.refresh}
              </button>
              <button className="cr-btn danger" onClick={() => setShowClose(true)}>
                <i className="fas fa-lock"></i> {t.close_btn}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ÉCRAN D'OUVERTURE (Si aucune session n'est ouverte) */}
      {!current && !loading && (
        <div className="cr-card cr-open-screen">
          <i className="fas fa-lock-open cr-open-icon"></i>
          <h2 style={{ marginBottom: 8 }}>{t.open_title}</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 24, fontSize: 14 }}>{t.open_subtitle}</p>
          
          <div style={{ textAlign: 'start', marginBottom: 16 }}>
            <label className="cr-label">{t.opening_amount} ({t.currency})</label>
            <input 
              type="number" 
              className="cr-input" 
              placeholder="0" 
              value={openingAmount} 
              onChange={(e) => setOpeningAmount(e.target.value)} 
            />
          </div>
          
          <button className="cr-btn primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleOpen}>
            <i className="fas fa-play"></i> {t.open_btn}
          </button>
        </div>
      )}

      {/* SESSION EN COURS */}
      {current && (
        <>
          <div className="cr-kpis">
            <div className="cr-card cr-kpi"><small>{t.kpi_opening}</small><strong>{fmt(current.opening_amount)}<span>{t.currency}</span></strong></div>
            <div className="cr-card cr-kpi"><small>{t.kpi_cash}</small><strong>{fmt(cashSales)}<span>{t.currency}</span></strong></div>
            <div className="cr-card cr-kpi in"><small>{t.kpi_in}</small><strong>+ {fmt(movIn)}<span>{t.currency}</span></strong></div>
            <div className="cr-card cr-kpi out"><small>{t.kpi_out}</small><strong>− {fmt(movOut)}<span>{t.currency}</span></strong></div>
          </div>

          <div className="cr-card cr-expected">
            <small>{t.expected}</small>
            <strong>{fmt(expected)}<span>{t.currency}</span></strong>
          </div>

          <div className="cr-grid">
            {/* Ventes par mode de paiement */}
            <section className="cr-card">
              <div className="cr-card-head"><h2>{t.sales_title}</h2></div>
              <div className="cr-card-body">
                {sales.length === 0 ? (
                  <div className="cr-empty">{t.sales_empty}</div>
                ) : (
                  <>
                    {PM_ORDER.filter((m) => byMethod[m]).map((m) => (
                      <div className="cr-method" key={m}>
                        <div className="cr-method-row">
                          <span>
                            <i className={`fas ${PM_ICON[m]}`}></i>{t.pm[m]}
                            {m !== 'cash' && <em>{m === 'credit' ? t.unpaid : t.not_in_drawer}</em>}
                          </span>
                          <span>{fmt(byMethod[m])} {t.currency}</span>
                        </div>
                        <div className="cr-bar">
                          <div className={m === 'cash' ? 'cash' : m === 'credit' ? 'credit' : ''} style={{ width: `${(byMethod[m] / maxMethod) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                    <div className="cr-total-row">
                      <span>{t.sales_total} ({sales.length})</span>
                      <span>{fmt(salesTotal)} {t.currency}</span>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Mouvements d'espèces */}
            <section className="cr-card">
              <div className="cr-card-head"><h2>{t.mov_title}</h2></div>
              <div className="cr-card-body">
                <div className="cr-seg" role="group">
                  <button type="button" className={`in ${movType === 'in' ? 'on' : ''}`} onClick={() => setMovType('in')}>
                    <i className="fas fa-arrow-down"></i> {t.mov_in}
                  </button>
                  <button type="button" className={`out ${movType === 'out' ? 'on' : ''}`} onClick={() => setMovType('out')}>
                    <i className="fas fa-arrow-up"></i> {t.mov_out}
                  </button>
                </div>
                <div className="cr-form-row">
                  <div>
                    <label className="cr-label" htmlFor="cr-amt">{t.amount}</label>
                    <input id="cr-amt" type="number" min="0" className="cr-input" placeholder="0" value={movAmount} onChange={(e) => setMovAmount(e.target.value)} />
                  </div>
                  <div>
                    <label className="cr-label" htmlFor="cr-reason">{t.reason}</label>
                    <input id="cr-reason" type="text" className="cr-input" placeholder={movType === 'in' ? t.reason_ph_in : t.reason_ph_out} value={movReason} onChange={(e) => setMovReason(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addMovement()} />
                  </div>
                </div>
                <button className="cr-btn primary" style={{ width: '100%', justifyContent: 'center' }} onClick={addMovement}>
                  <i className="fas fa-plus"></i> {t.add}
                </button>

                <div className="cr-mov-list">
                  {current.movements.length === 0 ? (
                    <div className="cr-empty">{t.mov_empty}</div>
                  ) : current.movements.map((m) => (
                    <div className="cr-mov" key={m.id}>
                      <div>
                        {m.reason}
                        <small>{fmtTime(m.created_at || m.at)}</small>
                      </div>
                      <b className={m.type}>{m.type === 'in' ? '+' : '−'} {fmt(m.amount)} {t.currency}</b>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </>
      )}

      {/* Historique */}
      <section className="cr-card" style={{ marginTop: 16 }}>
        <div className="cr-card-head"><h2>{t.history}</h2></div>
        {history.length === 0 ? (
          <div className="cr-empty" style={{ padding: 28 }}>{t.hist_empty}</div>
        ) : (
          <div className="cr-table-wrap">
            <table className="cr-table">
              <thead>
                <tr><th>{t.h_period}</th><th>{t.h_expected}</th><th>{t.h_counted}</th><th>{t.h_diff}</th></tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td>{fmtDate(h.opened_at)} → {fmtTime(h.closed_at)}</td>
                    <td>{fmt(h.expected_amount)} {t.currency}</td>
                    <td>{fmt(h.counted_amount)} {t.currency}</td>
                    <td><span className={`pill ${diffClass(h.difference)}`}>{h.difference === 0 ? '0' : `${h.difference > 0 ? '+' : '−'} ${fmt(Math.abs(h.difference))}`}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modale de clôture */}
      {showClose && (
        <div className="cr-overlay" onClick={() => setShowClose(false)}>
          <div className="cr-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>{t.close_title}</h2>
            <div className="cr-modal-line"><span>{t.expected}</span><span>{fmt(expected)} {t.currency}</span></div>
            <label className="cr-label" htmlFor="cr-counted">{t.counted} ({t.currency})</label>
            <input id="cr-counted" type="number" min="0" className="cr-input" placeholder="0" value={counted} onChange={(e) => setCounted(e.target.value)} autoFocus />
            {counted !== '' && <div className={`cr-diff ${diffClass(diff)}`}>{diffLabel(diff)}</div>}
            <label className="cr-label" htmlFor="cr-note" style={{ marginTop: counted === '' ? 14 : 0 }}>{t.note}</label>
            <textarea id="cr-note" className="cr-input" value={closeNote} onChange={(e) => setCloseNote(e.target.value)} />
            <div className="cr-modal-actions">
              <button className="cr-btn" onClick={() => setShowClose(false)}>{t.cancel}</button>
              <button className="cr-btn danger" onClick={closeRegister}>{t.confirm_close}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`cr-toast ${toast.type}`}>{toast.message}</div>}
    </div>
  );
};

export default CashRegisterPage;