// src/pages/ExpensesPage.jsx
// Version bilingue Français / العربية (RTL) avec palette de couleurs améliorée
import React, { useState, useEffect, useMemo } from 'react';
import { expensesApi } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
/* =========================================================
   TRADUCTIONS / الترجمة
========================================================= */

const I18N = {
  fr: {
    dir: 'ltr',
    locale: 'fr-FR',
    currency: 'MRU',
    title: 'Gestion des dépenses',
    subtitle: 'Suivez et gérez toutes les charges de votre commerce.',
    add: 'Nouvelle dépense',
    stat_total: 'Total des dépenses (filtré)',
    records: (n) => `${n} enregistrement(s)`,
    stat_month: 'Dépenses du mois',
    current_month: 'Mois en cours',
    stat_categories: 'Catégories',
    expense_types: 'Types de dépenses',
    search_ph: 'Rechercher...',
    all_categories: 'Toutes les catégories',
    start_date: 'Date de début',
    end_date: 'Date de fin',
    reset: 'Réinitialiser',
    th_date: 'Date',
    th_category: 'Catégorie',
    th_description: 'Description',
    th_amount: 'Montant',
    th_actions: 'Actions',
    loading: 'Chargement...',
    none: 'Aucune dépense trouvée.',
    general: 'Général',
    edit: 'Modifier',
    delete: 'Supprimer',
    modal_edit: 'Modifier la dépense',
    modal_new: 'Nouvelle dépense',
    f_date: 'Date',
    f_category: 'Catégorie',
    f_category_ph: 'Ex : Loyer, Électricité...',
    f_description: 'Description (optionnel)',
    f_description_ph: 'Détails de la dépense...',
    f_amount: 'Montant (MRU)',
    cancel: 'Annuler',
    save: 'Enregistrer',
    saving: 'Enregistrement...',
    delete_title: 'Supprimer cette dépense ?',
    delete_warn: 'Cette action est irréversible.',
    delete_confirm: 'Oui, supprimer',
    deleting: 'Suppression...',
    err_load: 'Impossible de charger les dépenses.',
    err_save: "Erreur lors de l'enregistrement.",
    err_delete: 'Erreur lors de la suppression.',
    close: 'Fermer',
    retry: 'Réessayer',
    switch_title: 'Changer de langue',
  },
  ar: {
    dir: 'rtl',
    locale: 'ar-u-nu-latn',
    currency: 'أوقية',
    title: 'إدارة المصروفات',
    subtitle: 'تابع وأدر جميع أعباء تجارتك.',
    add: 'مصروف جديد',
    stat_total: 'إجمالي المصروفات (بعد التصفية)',
    records: (n) => `${n} سجل`,
    stat_month: 'مصروفات الشهر',
    current_month: 'الشهر الحالي',
    stat_categories: 'الفئات',
    expense_types: 'أنواع المصروفات',
    search_ph: 'بحث...',
    all_categories: 'كل الفئات',
    start_date: 'تاريخ البداية',
    end_date: 'تاريخ النهاية',
    reset: 'إعادة تعيين',
    th_date: 'التاريخ',
    th_category: 'الفئة',
    th_description: 'الوصف',
    th_amount: 'المبلغ',
    th_actions: 'إجراءات',
    loading: 'جارٍ التحميل...',
    none: 'لا توجد مصروفات.',
    general: 'عام',
    edit: 'تعديل',
    delete: 'حذف',
    modal_edit: 'تعديل المصروف',
    modal_new: 'مصروف جديد',
    f_date: 'التاريخ',
    f_category: 'الفئة',
    f_category_ph: 'مثال: إيجار، كهرباء...',
    f_description: 'الوصف (اختياري)',
    f_description_ph: 'تفاصيل المصروف...',
    f_amount: 'المبلغ (أوقية)',
    cancel: 'إلغاء',
    save: 'حفظ',
    saving: 'جارٍ الحفظ...',
    delete_title: 'حذف هذا المصروف؟',
    delete_warn: 'لا يمكن التراجع عن هذا الإجراء.',
    delete_confirm: 'نعم، احذف',
    deleting: 'جارٍ الحذف...',
    err_load: 'تعذّر تحميل المصروفات.',
    err_save: 'حدث خطأ أثناء الحفظ.',
    err_delete: 'حدث خطأ أثناء الحذف.',
    close: 'إغلاق',
    retry: 'إعادة المحاولة',
    switch_title: 'تغيير اللغة',
  },
};

// Même clé que la page Rapports : le choix de langue est partagé.


/* =========================================================
   UTILITAIRES
========================================================= */

const pad = (n) => String(n).padStart(2, '0');

const todayValue = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Les dates YYYY-MM-DD sont gardées telles quelles (pas de décalage UTC).
const getDateKey = (value) => {
  if (!value) return '';
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const formatMoney = (value) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(value) || 0);

const formatDate = (value, locale) => {
  const key = getDateKey(value);
  if (!key) return '—';
  return new Date(`${key}T12:00:00`).toLocaleDateString(locale);
};

const emptyForm = () => ({ category: '', description: '', amount: '', date: todayValue() });

// Couleur douce stable par catégorie (même catégorie = même couleur).
const BADGE_TONES = ['blue', 'violet', 'green', 'amber', 'rose', 'teal'];
const toneFor = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return BADGE_TONES[hash % BADGE_TONES.length];
};

/* =========================================================
   COMPOSANT
========================================================= */

const ExpensesPage = () => {
const { lang } = useLanguage(); // langue globale (menu)
const t = I18N[lang];

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState('');
  const [formErrorKey, setFormErrorKey] = useState('');

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Données
  const [currentExpense, setCurrentExpense] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Filtres
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const fetchExpenses = async () => {
    setLoading(true);
    setErrorKey('');
    try {
      const res = await expensesApi.getAll();
      const data = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : res?.data?.data || [];
      setExpenses(data);
    } catch (err) {
      console.error('Erreur chargement dépenses:', err);
      setErrorKey('err_load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const closeModals = () => {
    setShowForm(false);
    setShowDeleteModal(false);
    setFormErrorKey('');
  };

  // Fermeture avec la touche Échap
  useEffect(() => {
    if (!showForm && !showDeleteModal) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closeModals();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showForm, showDeleteModal]);

  /* ---------- Actions ---------- */
  const handleOpenCreate = () => {
    setCurrentExpense(null);
    setFormData(emptyForm());
    setFormErrorKey('');
    setShowForm(true);
  };

  const handleOpenEdit = (expense) => {
    setCurrentExpense(expense);
    setFormData({
      category: expense.category || '',
      description: expense.description || '',
      amount: expense.amount ?? '',
      date: getDateKey(expense.date || expense.created_at) || todayValue(),
    });
    setFormErrorKey('');
    setShowForm(true);
  };

  const handleDeleteClick = (expense) => {
    setCurrentExpense(expense);
    setFormErrorKey('');
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormErrorKey('');
    try {
      const payload = { ...formData, amount: parseFloat(formData.amount) };
      if (currentExpense) await expensesApi.update(currentExpense.id, payload);
      else await expensesApi.create(payload);
      closeModals();
      fetchExpenses();
    } catch (err) {
      console.error(err);
      setFormErrorKey('err_save');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!currentExpense) return;
    setSaving(true);
    setFormErrorKey('');
    try {
      await expensesApi.delete(currentExpense.id);
      closeModals();
      fetchExpenses();
    } catch (err) {
      console.error(err);
      setFormErrorKey('err_delete');
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Filtrage et statistiques ---------- */
  const filteredExpenses = useMemo(() => {
    const needle = search.toLowerCase();
    return expenses
      .filter((exp) => {
        const matchSearch =
          !search ||
          (exp.description || '').toLowerCase().includes(needle) ||
          (exp.category || '').toLowerCase().includes(needle);
        const matchCategory = filterCategory === 'all' || exp.category === filterCategory;
        const key = getDateKey(exp.date || exp.created_at);
        const matchStart = !startDate || key >= startDate;
        const matchEnd = !endDate || key <= endDate;
        return matchSearch && matchCategory && matchStart && matchEnd;
      })
      .sort((a, b) => getDateKey(b.date || b.created_at).localeCompare(getDateKey(a.date || a.created_at)));
  }, [expenses, search, filterCategory, startDate, endDate]);

  const categories = useMemo(
    () => [...new Set(expenses.map((e) => e.category).filter(Boolean))],
    [expenses]
  );

  const stats = useMemo(() => {
    const total = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    // Mois ET année : décembre 2025 n'est plus compté dans décembre 2026.
    const currentMonth = todayValue().slice(0, 7);
    const monthly = expenses
      .filter((e) => getDateKey(e.date || e.created_at).slice(0, 7) === currentMonth)
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
    return { total, monthly, count: filteredExpenses.length };
  }, [expenses, filteredExpenses]);

  const hasFilters = Boolean(search || startDate || endDate || filterCategory !== 'all');
  const resetFilters = () => {
    setSearch('');
    setStartDate('');
    setEndDate('');
    setFilterCategory('all');
  };

  const amt = (value) => <bdi className="ep-amt">{formatMoney(value)}</bdi>;
  const cur = t.currency;

  /* =======================================================
     AFFICHAGE
  ======================================================= */

  return (
    <div className="expenses-page" dir={t.dir} lang={lang}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');

        .expenses-page {
          --ink: #14213d;
          --muted: #66748b;
          --line: #e3e9f2;
          --bg: #f2f5fb;
          --card: #fff;
          --primary: #1f5eea;   --primary-soft: #e8efff;
          --green: #0f9d74;     --green-soft: #def7ee;
          --violet: #6a4de0;    --violet-soft: #ece8fd;
          --amber: #e08a0b;     --amber-soft: #fff0d6;
          --red: #d63c4a;       --red-soft: #fde8ea;
          --teal: #0e8fa8;      --teal-soft: #dcf3f8;
          --rose: #c2417c;      --rose-soft: #fbe6f0;

          min-height: 100vh;
          padding: clamp(14px, 2.2vw, 28px);
          background: radial-gradient(1000px 340px at 100% -80px, rgba(31,94,234,.08), transparent 70%), var(--bg);
          color: var(--ink);
          font-family: Inter, 'Segoe UI', system-ui, Tahoma, Arial, sans-serif;
        }
        .expenses-page[lang="ar"] { font-family: Cairo, 'Noto Sans Arabic', Tahoma, 'Segoe UI', Arial, sans-serif; }
        .expenses-page * { box-sizing: border-box; }
        .expenses-page button:focus-visible, .expenses-page input:focus-visible,
        .expenses-page select:focus-visible, .expenses-page textarea:focus-visible {
          outline: 3px solid rgba(31,94,234,.35); outline-offset: 2px;
        }
        .ep-amt { direction: ltr; unicode-bidi: isolate; font-variant-numeric: tabular-nums; }

        /* ---------- En-tête ---------- */
        .ep-hero {
          position: relative; isolation: isolate; overflow: hidden;
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 18px;
          padding: clamp(20px, 3vw, 30px); margin-bottom: 20px; border-radius: 20px; color: #fff;
          background: linear-gradient(125deg, #0f2f66 0%, #1b55c9 58%, #2aa3d9 100%);
          box-shadow: 0 14px 32px rgba(21, 74, 170, .20);
        }
        .ep-hero::after { content: ""; position: absolute; z-index: -1; width: 250px; height: 250px; inset-inline-end: -70px; top: -115px; border: 32px solid rgba(255,255,255,.09); border-radius: 50%; }
        .ep-eyebrow { font-size: 20px; font-weight: 800; letter-spacing: 1.8px; opacity: .78; }
        .ep-title h1 { margin: 6px 0 4px; font-size: clamp(22px, 2.8vw, 30px); font-weight: 800; display: flex; align-items: center; gap: 12px; line-height: 1.25; }
        .ep-title-icon { display: inline-grid; place-items: center; width: 42px; height: 42px; border-radius: 12px; background: rgba(255,255,255,.16); font-size: 18px; }
        .ep-title p { margin: 0; color: rgba(255,255,255,.82); font-size: 20px; }
        .ep-hero-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
        .ep-lang { display: inline-flex; padding: 3px; border-radius: 11px; background: rgba(255,255,255,.16); border: 1px solid rgba(255,255,255,.25); }
        .ep-lang button { border: 0; padding: 7px 12px; border-radius: 8px; background: transparent; color: #fff; font: inherit; font-size: 12px; font-weight: 800; cursor: pointer; }
        .ep-lang button.on { background: #fff; color: #153f92; }
        .ep-btn-add { display: inline-flex; align-items: center; gap: 8px; padding: 11px 18px; border: 0; border-radius: 11px; background: #fff; color: #174078; font: inherit; font-weight: 800; font-size: 13px; cursor: pointer; box-shadow: 0 6px 16px rgba(0,0,0,.14); transition: .18s; }
        .ep-btn-add:hover { transform: translateY(-2px); }

        /* ---------- Alerte ---------- */
        .ep-alert { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 18px; padding: 13px 16px; border: 1px solid #f6c8cd; border-radius: 11px; background: var(--red-soft); color: #a3212e; font-size: 13px; }
        .ep-alert button { border: 0; padding: 7px 12px; border-radius: 8px; background: #fff; color: #a3212e; font: inherit; font-size: 12px; font-weight: 800; cursor: pointer; }

        /* ---------- Statistiques ---------- */
        .ep-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-bottom: 20px; }
        .ep-card { position: relative; overflow: hidden; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding: 20px; background: var(--card); border: 1px solid var(--line); border-inline-start: 4px solid var(--accent); border-radius: 16px; box-shadow: 0 4px 14px rgba(20,33,61,.04); transition: transform .2s, box-shadow .2s; }
        .ep-card:hover { transform: translateY(-2px); box-shadow: 0 12px 24px rgba(20,33,61,.08); }
        .ep-card::after { content: ""; position: absolute; inset-inline-end: -30px; bottom: -42px; width: 105px; height: 105px; border-radius: 50%; background: var(--accent-soft); opacity: .7; }
        .ep-card-info { position: relative; z-index: 1; min-width: 0; }
        .ep-card-info h3 { margin: 0 0 9px; font-size: 20px; color: var(--muted); font-weight: 800; }
        .ep-card-info .value { font-size: clamp(21px, 2.2vw, 27px); font-weight: 800; letter-spacing: -.3px; color: var(--ink); overflow-wrap: anywhere; }
        .ep-card-info .value small { font-size: 12px; color: #8896ab; font-weight: 700; }
        .ep-card-info .sub { margin-top: 5px; font-size: 20px; color: var(--accent); font-weight: 700; }
        .ep-icon { position: relative; z-index: 1; flex: 0 0 44px; width: 44px; height: 44px; border-radius: 13px; display: grid; place-items: center; font-size: 19px; background: var(--accent-soft); color: var(--accent); }
        .tone-amber  { --accent: var(--amber);  --accent-soft: var(--amber-soft); }
        .tone-violet { --accent: var(--violet); --accent-soft: var(--violet-soft); }
        .tone-blue   { --accent: var(--primary); --accent-soft: var(--primary-soft); }

        /* ---------- Panneau & filtres ---------- */
        .ep-panel { background: var(--card); border-radius: 16px; border: 1px solid var(--line); overflow: hidden; box-shadow: 0 4px 14px rgba(20,33,61,.035); }
        .ep-filters { display: grid; grid-template-columns: 2fr 1.2fr 1fr 1fr auto; gap: 12px; align-items: center; padding: 15px 20px; background: #fbfcff; border-bottom: 1px solid var(--line); }
        .ep-filter-input { width: 100%; height: 40px; border: 1px solid #d9e1ed; border-radius: 9px; padding: 0 12px; font: inherit; font-size: 18px; color: #2a3a55; background: #fff; outline: none; }
        .ep-filter-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); }
        .ep-reset { height: 40px; padding: 0 13px; border: 1px solid var(--line); border-radius: 9px; background: #fff; color: #4b5b75; font: inherit; font-size: 20px; font-weight: 800; cursor: pointer; white-space: nowrap; }
        .ep-reset:hover { background: #f1f5fb; }

        /* ---------- Tableau ---------- */
        .ep-table-wrap { overflow-x: auto; }
        .ep-table { width: 100%; min-width: 680px; border-collapse: collapse; }
        .ep-table th { background: #f3f6fc; color: #5b6b85; text-align: start; padding: 14px 20px; font-size: 20px; font-weight: 800; letter-spacing: .4px; border-bottom: 1px solid var(--line); white-space: nowrap; }
        .ep-table td { padding: 14px 20px; border-bottom: 1px solid #f0f3f8; font-size: 15.5px; color: #44546d; vertical-align: middle; }
        .ep-table tbody tr:nth-child(even) td { background: #fafbfe; }
        .ep-table tbody tr:hover td { background: #eff4ff; }
        .ep-table tr:last-child td { border-bottom: 0; }
        .ep-col-end { text-align: end !important; }
        .ep-date { color: var(--muted); font-weight: 600; white-space: nowrap; }
        .ep-desc { max-width: 340px; overflow-wrap: anywhere; }
        .ep-money { font-weight: 800; color: #94590a; white-space: nowrap; }
        .ep-state { padding: 38px 18px !important; text-align: center; color: #8896ab !important; }
        .ep-spinner { display: inline-block; width: 22px; height: 22px; margin-inline-end: 10px; vertical-align: middle; border: 3px solid #dbeafe; border-top-color: var(--primary); border-radius: 50%; animation: ep-spin .75s linear infinite; }
        @keyframes ep-spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .ep-spinner { animation-duration: 2s; } .ep-card, .ep-btn-add { transition: none; } }

        .ep-badge { display: inline-block; padding: 5px 11px; border-radius: 999px; font-size: 20px; font-weight: 800; }
        .badge-blue   { background: var(--primary-soft); color: #164aba; }
        .badge-violet { background: var(--violet-soft);  color: #4a32b0; }
        .badge-green  { background: var(--green-soft);   color: #0b6a4e; }
        .badge-amber  { background: var(--amber-soft);   color: #94590a; }
        .badge-rose   { background: var(--rose-soft);    color: #9c2a62; }
        .badge-teal   { background: var(--teal-soft);    color: #0a6577; }

        .ep-actions { display: flex; gap: 8px; justify-content: flex-end; }
        .btn-icon { width: 34px; height: 34px; border-radius: 9px; border: 1px solid transparent; display: grid; place-items: center; cursor: pointer; transition: .18s; background: transparent; color: #64748b; font-size: 20px; }
        .btn-icon:hover { background: #eef2f8; }
        .btn-edit { background: var(--primary-soft); color: var(--primary); border-color: #c9daff; }
        .btn-edit:hover { background: var(--primary); color: #fff; }
        .btn-delete { background: var(--red-soft); color: var(--red); border-color: #f6c8cd; }
        .btn-delete:hover { background: var(--red); color: #fff; }

        /* ---------- Modales ---------- */
        .ep-modal-overlay { position: fixed; inset: 0; z-index: 1050; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(15,23,42,.58); backdrop-filter: blur(4px); }
        .ep-modal { width: 100%; max-width: 500px; max-height: calc(100vh - 40px); overflow: auto; background: #fff; border-radius: 18px; box-shadow: 0 25px 50px rgba(0,0,0,.22); }
        .ep-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 22px; border-bottom: 1px solid var(--line); background: linear-gradient(180deg, #fbfcff, #fff); }
        .ep-modal-header h3 { margin: 0; font-size: 24px; font-weight: 800; }
        .ep-modal-body { padding: 22px; }
        .ep-modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 15px 22px; background: #f7f9fd; border-top: 1px solid var(--line); }
        .ep-modal-footer.center { justify-content: center; }
        .ep-form-group { margin-bottom: 15px; }
        .ep-form-group label { display: block; margin-bottom: 6px; font-size: 18px; font-weight: 800; color: #4b5b75; }
        .ep-form-group input, .ep-form-group select, .ep-form-group textarea { width: 100%; border: 1px solid #d9e1ed; border-radius: 9px; padding: 10px 12px; font: inherit; font-size: 14px; color: #2a3a55; background: #fbfcfe; outline: none; }
        .ep-form-group input:focus, .ep-form-group textarea:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); background: #fff; }
        .ep-form-error { margin-bottom: 14px; padding: 11px 14px; border-radius: 9px; background: var(--red-soft); color: #a3212e; font-size: 13px; font-weight: 600; }
        .ep-btn { padding: 10px 20px; border-radius: 10px; border: 0; font: inherit; font-size: 19px; font-weight: 800; cursor: pointer; transition: .18s; }
        .ep-btn:hover:not(:disabled) { filter: brightness(.96); transform: translateY(-1px); }
        .ep-btn:disabled { opacity: .6; cursor: not-allowed; }
        .ep-btn-cancel { background: #e6ebf3; color: #44546d; }
        .ep-btn-save { background: linear-gradient(135deg, #1f5eea, #2f7bf0); color: #fff; }
        .ep-btn-danger { background: var(--red); color: #fff; }
        .ep-delete-body { padding: 28px 22px 10px; text-align: center; }
        .ep-delete-icon { display: inline-grid; place-items: center; width: 58px; height: 58px; margin-bottom: 14px; border-radius: 50%; background: var(--red-soft); color: var(--red); font-size: 24px; }
        .ep-delete-body h4 { margin: 0 0 6px; font-size: 18px; font-weight: 800; }
        .ep-delete-body p { margin: 0 0 12px; color: var(--muted); font-size: 19px; }

        @media (max-width: 1000px) { .ep-filters { grid-template-columns: 1fr 1fr; } .ep-filters > :first-child { grid-column: 1 / -1; } }
        @media (max-width: 900px) { .ep-stats { grid-template-columns: 1fr; } }
        @media (max-width: 560px) {
          .expenses-page { padding: 12px; }
          .ep-filters { grid-template-columns: 1fr; padding: 14px; }
          .ep-hero-actions { width: 100%; } .ep-btn-add { flex: 1; justify-content: center; }
          .ep-table th, .ep-table td { padding: 12px; }
        }
      `}</style>

      {/* En-tête */}
      <header className="ep-hero">
        <div className="ep-title">
          <span className="ep-eyebrow">GESTISTOCK</span>
          <h1>
            <span className="ep-title-icon"><i className="fas fa-file-invoice-dollar" /></span>
            {t.title}
          </h1>
          <p>{t.subtitle}</p>
        </div>

        <div className="ep-hero-actions">
         
          <button className="ep-btn-add" type="button" onClick={handleOpenCreate}>
            <i className="fas fa-plus" /> {t.add}
          </button>
        </div>
      </header>

      {errorKey && (
        <div className="ep-alert" role="alert">
          <span><i className="fas fa-exclamation-circle" /> &nbsp;{t[errorKey]}</span>
          <button type="button" onClick={fetchExpenses}>{t.retry}</button>
        </div>
      )}

      {/* Statistiques */}
      <section className="ep-stats">
        <div className="ep-card tone-amber">
          <div className="ep-card-info">
            <h3>{t.stat_total}</h3>
            <div className="value">{amt(stats.total)} <small>{cur}</small></div>
            <div className="sub">{t.records(stats.count)}</div>
          </div>
          <div className="ep-icon"><i className="fas fa-receipt" /></div>
        </div>
        <div className="ep-card tone-violet">
          <div className="ep-card-info">
            <h3>{t.stat_month}</h3>
            <div className="value">{amt(stats.monthly)} <small>{cur}</small></div>
            <div className="sub">{t.current_month}</div>
          </div>
          <div className="ep-icon"><i className="fas fa-calendar-alt" /></div>
        </div>
        <div className="ep-card tone-blue">
          <div className="ep-card-info">
            <h3>{t.stat_categories}</h3>
            <div className="value"><bdi className="ep-amt">{categories.length}</bdi></div>
            <div className="sub">{t.expense_types}</div>
          </div>
          <div className="ep-icon"><i className="fas fa-tags" /></div>
        </div>
      </section>

      {/* Tableau */}
      <div className="ep-panel">
        <div className="ep-filters">
          <input
            type="search"
            placeholder={t.search_ph}
            aria-label={t.search_ph}
            className="ep-filter-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="ep-filter-input" aria-label={t.th_category} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="all">{t.all_categories}</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="date" className="ep-filter-input" value={startDate} max={endDate || undefined} onChange={(e) => setStartDate(e.target.value)} title={t.start_date} aria-label={t.start_date} />
          <input type="date" className="ep-filter-input" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} title={t.end_date} aria-label={t.end_date} />
          {hasFilters ? (
            <button type="button" className="ep-reset" onClick={resetFilters}>
              <i className="fas fa-rotate-left" /> {t.reset}
            </button>
          ) : (
            <span />
          )}
        </div>

        <div className="ep-table-wrap">
          <table className="ep-table">
            <thead>
              <tr>
                <th>{t.th_date}</th>
                <th>{t.th_category}</th>
                <th>{t.th_description}</th>
                <th>{t.th_amount}</th>
                <th className="ep-col-end">{t.th_actions}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="ep-state"><span className="ep-spinner" />{t.loading}</td></tr>
              ) : filteredExpenses.length === 0 ? (
                <tr><td colSpan="5" className="ep-state">{t.none}</td></tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const category = exp.category || t.general;
                  return (
                    <tr key={exp.id}>
                      <td className="ep-date"><bdi>{formatDate(exp.date || exp.created_at, t.locale)}</bdi></td>
                      <td><span className={`ep-badge badge-${toneFor(exp.category || '')}`}>{category}</span></td>
                      <td className="ep-desc">{exp.description || '—'}</td>
                      <td className="ep-money">{amt(exp.amount)} {cur}</td>
                      <td className="ep-col-end">
                        <div className="ep-actions">
                          <button type="button" className="btn-icon btn-edit" onClick={() => handleOpenEdit(exp)} title={t.edit} aria-label={t.edit}>
                            <i className="fas fa-edit" />
                          </button>
                          <button type="button" className="btn-icon btn-delete" onClick={() => handleDeleteClick(exp)} title={t.delete} aria-label={t.delete}>
                            <i className="fas fa-trash-alt" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modale ajout / modification */}
      {showForm && (
        <div className="ep-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && closeModals()}>
          <div className="ep-modal" role="dialog" aria-modal="true" aria-labelledby="ep-form-title">
            <div className="ep-modal-header">
              <h3 id="ep-form-title">{currentExpense ? t.modal_edit : t.modal_new}</h3>
              <button type="button" className="btn-icon" onClick={closeModals} aria-label={t.close}>
                <i className="fas fa-times" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="ep-modal-body">
                {formErrorKey && <div className="ep-form-error" role="alert">{t[formErrorKey]}</div>}
                <div className="ep-form-group">
                  <label htmlFor="ep-date">{t.f_date}</label>
                  <input id="ep-date" type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                </div>
                <div className="ep-form-group">
                  <label htmlFor="ep-category">{t.f_category}</label>
                  <input id="ep-category" type="text" placeholder={t.f_category_ph} required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} list="categories-list" />
                  <datalist id="categories-list">
                    {categories.map((c) => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div className="ep-form-group">
                  <label htmlFor="ep-description">{t.f_description}</label>
                  <textarea id="ep-description" rows="2" placeholder={t.f_description_ph} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>
                <div className="ep-form-group">
                  <label htmlFor="ep-amount">{t.f_amount}</label>
                  <input id="ep-amount" type="number" min="0" step="0.01" required value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
                </div>
              </div>
              <div className="ep-modal-footer">
                <button type="button" className="ep-btn ep-btn-cancel" onClick={closeModals}>{t.cancel}</button>
                <button type="submit" className="ep-btn ep-btn-save" disabled={saving}>{saving ? t.saving : t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale suppression */}
      {showDeleteModal && (
        <div className="ep-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && closeModals()}>
          <div className="ep-modal" style={{ maxWidth: 400 }} role="alertdialog" aria-modal="true" aria-labelledby="ep-delete-title">
            <div className="ep-delete-body">
              <span className="ep-delete-icon"><i className="fas fa-exclamation-triangle" /></span>
              <h4 id="ep-delete-title">{t.delete_title}</h4>
              <p>{t.delete_warn}</p>
              {formErrorKey && <div className="ep-form-error" role="alert">{t[formErrorKey]}</div>}
            </div>
            <div className="ep-modal-footer center">
              <button type="button" className="ep-btn ep-btn-cancel" onClick={closeModals}>{t.cancel}</button>
              <button type="button" className="ep-btn ep-btn-danger" onClick={handleDeleteConfirm} disabled={saving}>
                {saving ? t.deleting : t.delete_confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;