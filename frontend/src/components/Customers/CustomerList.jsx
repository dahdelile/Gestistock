// src/pages/CustomersPage.jsx
// Version bilingue Français / العربية (RTL) avec palette de couleurs améliorée
import React, { useState, useEffect, useMemo } from 'react';
import { customersApi } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
/* =========================================================
   TRADUCTIONS / الترجمة
========================================================= */

const I18N = {
  fr: {
    dir: 'ltr',
    locale: 'fr-FR',
    currency: 'MRU',
    title: 'Gestion des clients',
    subtitle: 'Gérez vos clients, leurs coordonnées et leurs soldes.',
    add: 'Nouveau client',
    stat_total: 'Total des clients',
    records: (n) => `${n} client(s)`,
    stat_debt: 'Total des dettes',
    stat_debt_sub: 'Montants à recevoir',
    stat_with_debt: 'Clients avec dette',
    with_debt_sub: 'Soldes non nuls',
    search_ph: 'Rechercher par nom ou téléphone...',
    th_name: 'Nom',
    th_phone: 'Téléphone',
    th_email: 'Email',
    th_address: 'Adresse',
    th_balance: 'Solde (Dette)',
    th_actions: 'Actions',
    loading: 'Chargement...',
    none: 'Aucun client trouvé.',
    edit: 'Modifier',
    delete: 'Supprimer',
    modal_edit: 'Modifier le client',
    modal_new: 'Nouveau client',
    f_name: 'Nom du client',
    f_name_ph: 'Ex : Ahmed Ould Mohamed',
    f_phone: 'Téléphone',
    f_phone_ph: 'Ex : 222 XX XX XX XX',
    f_email: 'Email',
    f_email_ph: 'Ex : email@exemple.com',
    f_address: 'Adresse',
    f_address_ph: 'Adresse complète...',
    f_balance: 'Solde initial (Dette)',
    f_balance_hint: 'Mettez 0 si aucune dette initiale.',
    cancel: 'Annuler',
    save: 'Enregistrer',
    saving: 'Enregistrement...',
    delete_title: 'Supprimer ce client ?',
    delete_warn: 'Cette action est irréversible.',
    delete_confirm: 'Oui, supprimer',
    deleting: 'Suppression...',
    err_load: 'Impossible de charger les clients.',
    err_save: "Erreur lors de l'enregistrement.",
    err_delete: 'Erreur lors de la suppression.',
    close: 'Fermer',
    retry: 'Réessayer',
    switch_title: 'Changer de langue',
    no_debt: 'Aucune dette',
  },
  ar: {
    dir: 'rtl',
    locale: 'ar-u-nu-latn',
    currency: 'أوقية',
    title: 'إدارة العملاء',
    subtitle: 'أدر عملاءك، بياناتهم، وأرصدتهم.',
    add: 'عميل جديد',
    stat_total: 'إجمالي العملاء',
    records: (n) => `${n} عميل`,
    stat_debt: 'إجمالي الديون',
    stat_debt_sub: 'مبالغ مستحقة',
    stat_with_debt: 'عملاء لديهم ديون',
    with_debt_sub: 'أرصدة غير صفرية',
    search_ph: 'ابحث بالاسم أو رقم الهاتف...',
    th_name: 'الاسم',
    th_phone: 'الهاتف',
    th_email: 'البريد الإلكتروني',
    th_address: 'العنوان',
    th_balance: 'الرصيد (الدين)',
    th_actions: 'إجراءات',
    loading: 'جارٍ التحميل...',
    none: 'لا يوجد عملاء.',
    edit: 'تعديل',
    delete: 'حذف',
    modal_edit: 'تعديل بيانات العميل',
    modal_new: 'عميل جديد',
    f_name: 'اسم العميل',
    f_name_ph: 'مثال: أحمد ولد محمد',
    f_phone: 'الهاتف',
    f_phone_ph: 'مثال: 222 XX XX XX XX',
    f_email: 'البريد الإلكتروني',
    f_email_ph: 'مثال: email@exemple.com',
    f_address: 'العنوان',
    f_address_ph: 'العنوان الكامل...',
    f_balance: 'الرصيد الافتتاحي (الدين)',
    f_balance_hint: 'أدخل 0 إذا لم يكن عليه ديون سابقة.',
    cancel: 'إلغاء',
    save: 'حفظ',
    saving: 'جارٍ الحفظ...',
    delete_title: 'حذف هذا العميل؟',
    delete_warn: 'لا يمكن التراجع عن هذا الإجراء.',
    delete_confirm: 'نعم، احذف',
    deleting: 'جارٍ الحذف...',
    err_load: 'تعذّر تحميل العملاء.',
    err_save: 'حدث خطأ أثناء الحفظ.',
    err_delete: 'حدث خطأ أثناء الحذف.',
    close: 'إغلاق',
    retry: 'إعادة المحاولة',
    switch_title: 'تغيير اللغة',
    no_debt: 'لا توجد ديون',
  },
};

// Même clé que la page Rapports et Dépenses : le choix de langue est partagé.


/* =========================================================
   UTILITAIRES
========================================================= */

const formatMoney = (value) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(value) || 0);

const formatDate = (value, locale) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(locale);
};

const emptyForm = () => ({ name: '', phone: '', email: '', address: '', balance: 0 });

/* =========================================================
   COMPOSANT
========================================================= */

const CustomersPage = () => {
 const { lang } = useLanguage(); // langue globale (menu)
const t = I18N[lang];

 
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState('');
  const [formErrorKey, setFormErrorKey] = useState('');

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Données
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Filtres
  const [search, setSearch] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    setErrorKey('');
    try {
      const res = await customersApi.getAll();
      const data = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : res?.data?.data || [];
      setCustomers(data);
    } catch (err) {
      console.error('Erreur chargement clients:', err);
      setErrorKey('err_load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
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
    setCurrentCustomer(null);
    setFormData(emptyForm());
    setFormErrorKey('');
    setShowForm(true);
  };

  const handleOpenEdit = (customer) => {
    setCurrentCustomer(customer);
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      balance: customer.balance || 0,
    });
    setFormErrorKey('');
    setShowForm(true);
  };

  const handleDeleteClick = (customer) => {
    setCurrentCustomer(customer);
    setFormErrorKey('');
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormErrorKey('');
    try {
      const payload = { ...formData, balance: parseFloat(formData.balance) || 0 };
      if (currentCustomer) await customersApi.update(currentCustomer.id, payload);
      else await customersApi.create(payload);
      closeModals();
      fetchCustomers();
    } catch (err) {
      console.error(err);
      setFormErrorKey('err_save');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!currentCustomer) return;
    setSaving(true);
    setFormErrorKey('');
    try {
      await customersApi.delete(currentCustomer.id);
      closeModals();
      fetchCustomers();
    } catch (err) {
      console.error(err);
      setFormErrorKey('err_delete');
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Filtrage et statistiques ---------- */
  const filteredCustomers = useMemo(() => {
    const needle = search.toLowerCase();
    return customers
      .filter((c) => {
        const matchSearch =
          !search ||
          (c.name || '').toLowerCase().includes(needle) ||
          (c.phone || '').includes(needle);
        return matchSearch;
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [customers, search]);

  const stats = useMemo(() => {
    const total = customers.length;
    const totalDebt = customers.reduce((sum, c) => sum + (Number(c.balance) > 0 ? Number(c.balance) : 0), 0);
    const withDebt = customers.filter(c => Number(c.balance) > 0).length;
    return { total, totalDebt, withDebt };
  }, [customers]);

  const hasFilters = Boolean(search);
  const resetFilters = () => setSearch('');

  const amt = (value) => <bdi className="ep-amt">{formatMoney(value)}</bdi>;
  const cur = t.currency;

  /* =======================================================
     AFFICHAGE
  ======================================================= */

  return (
    <div className="expenses-page" dir={t.dir} lang={lang}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      <style>{`
       
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');

.expenses-page {
  --ink: #172b4d;
  --muted: #718096;
  --line: #e5eaf2;
  --bg: #f4f7fc;
  --card: #ffffff;
  --primary: #2563eb;
  --primary-soft: #eaf1ff;
  --green: #0d9871;
  --green-soft: #e0f7ef;
  --violet: #7655d9;
  --violet-soft: #f0ebff;
  --amber: #d88a12;
  --amber-soft: #fff4dc;
  --red: #dc4655;
  --red-soft: #ffebee;

  min-height: 100vh;
  padding: clamp(12px, 2vw, 26px);
  background:
    radial-gradient(ellipse at top right, rgba(37,99,235,.07), transparent 38%),
    var(--bg);
  color: var(--ink);
  font-family: Inter, "Segoe UI", system-ui, Tahoma, Arial, sans-serif;
  font-size: 13px;
  line-height: 1.55;
}

.expenses-page[lang="ar"] {
  font-family: Cairo, "Noto Sans Arabic", Tahoma, sans-serif;
}

.expenses-page *,
.expenses-page *::before,
.expenses-page *::after {
  box-sizing: border-box;
}

.expenses-page button,
.expenses-page input,
.expenses-page select,
.expenses-page textarea {
  font: inherit;
}

.expenses-page button:focus-visible,
.expenses-page input:focus-visible,
.expenses-page select:focus-visible,
.expenses-page textarea:focus-visible {
  outline: 3px solid rgba(37,99,235,.25);
  outline-offset: 2px;
}

.ep-amt {
  direction: ltr;
  unicode-bidi: isolate;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* HEADER */

.ep-hero {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 18px;
  padding: clamp(18px, 2.5vw, 28px);
  margin-bottom: 18px;
  border-radius: 18px;
  color: #fff;
  background: linear-gradient(120deg, #102b59 0%, #1d55bd 60%, #2698ce 100%);
  box-shadow: 0 10px 28px rgba(20,65,145,.16);
}

.ep-hero::after {
  content: "";
  position: absolute;
  z-index: -1;
  width: 240px;
  height: 240px;
  inset-inline-end: -75px;
  top: -125px;
  border: 30px solid rgba(255,255,255,.09);
  border-radius: 50%;
}

.ep-title {
  min-width: 0;
}

.ep-eyebrow {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.5px;
  opacity: .75;
}

.ep-title h1 {
  display: flex;
  align-items: center;
  gap: 11px;
  margin: 5px 0;
  font-size: clamp(20px, 2.3vw, 27px);
  font-weight: 800;
  line-height: 1.35;
}

.ep-title-icon {
  display: inline-grid;
  place-items: center;
  flex: 0 0 40px;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255,255,255,.16);
  font-size: 19px;
}

.ep-title p {
  margin: 0;
  color: rgba(255,255,255,.82);
  font-size: 13px;
}

.ep-hero-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 9px;
}

.ep-btn-add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  padding: 9px 17px;
  border: 0;
  border-radius: 10px;
  background: #fff;
  color: #174078;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 5px 14px rgba(0,0,0,.12);
  transition: .2s ease;
}

.ep-btn-add:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(0,0,0,.16);
}

/* ALERT */

.ep-alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
  padding: 12px 15px;
  border: 1px solid #f4c5cb;
  border-radius: 11px;
  background: var(--red-soft);
  color: #a3212e;
  font-size: 13px;
}

.ep-alert button {
  padding: 7px 12px;
  border: 0;
  border-radius: 8px;
  background: #fff;
  color: #a3212e;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

/* STATISTICS */

.ep-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.ep-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  overflow: hidden;
  padding: 17px;
  border: 1px solid var(--line);
  border-inline-start: 4px solid var(--accent);
  border-radius: 14px;
  background: var(--card);
  box-shadow: 0 3px 12px rgba(20,33,61,.035);
  transition: transform .2s ease, box-shadow .2s ease;
}

.ep-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 9px 22px rgba(20,33,61,.08);
}

.ep-card::after {
  content: "";
  position: absolute;
  inset-inline-end: -32px;
  bottom: -42px;
  width: 105px;
  height: 105px;
  border-radius: 50%;
  background: var(--accent-soft);
  opacity: .65;
}

.ep-card-info {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.ep-card-info h3 {
  margin: 0 0 7px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
}

.ep-card-info .value {
  color: var(--ink);
  font-size: clamp(21px, 2vw, 26px);
  font-weight: 800;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.ep-card-info .value small {
  color: #8290a5;
  font-size: 11px;
  font-weight: 700;
}

.ep-card-info .sub {
  margin-top: 4px;
  color: var(--accent);
  font-size: 12px;
  font-weight: 600;
}

.ep-icon {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  flex: 0 0 42px;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 19px;
}

.tone-amber {
  --accent: var(--amber);
  --accent-soft: var(--amber-soft);
}

.tone-violet {
  --accent: var(--violet);
  --accent-soft: var(--violet-soft);
}

.tone-blue {
  --accent: var(--primary);
  --accent-soft: var(--primary-soft);
}

/* TABLE PANEL */

.ep-panel {
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 15px;
  background: var(--card);
  box-shadow: 0 4px 14px rgba(20,33,61,.035);
}

.ep-filters {
  display: grid;
  grid-template-columns: minmax(200px, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 14px 17px;
  border-bottom: 1px solid var(--line);
  background: #fbfcff;
}

.ep-filter-input {
  width: 100%;
  height: 40px;
  padding: 0 13px;
  border: 1px solid #dce4ef;
  border-radius: 9px;
  background: #fff;
  color: var(--ink);
  font-size: 13px;
  outline: none;
  transition: .2s;
}

.ep-filter-input::placeholder {
  color: #9aa6b8;
}

.ep-filter-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft);
}

.ep-reset {
  height: 40px;
  padding: 0 13px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: #fff;
  color: #52627a;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: .2s;
}

.ep-reset:hover {
  border-color: #cbd8ed;
  background: #f1f5fb;
}

/* TABLE */

.ep-table-wrap {
  width: 100%;
  overflow-x: auto;
  overscroll-behavior-x: contain;
}

.ep-table {
  width: 100%;
  min-width: 720px;
  border-collapse: separate;
  border-spacing: 0;
}

.ep-table th {
  padding: 13px 16px;
  border-bottom: 1px solid var(--line);
  background: #f5f7fc;
  color: #53647d;
  text-align: start;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.ep-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #edf0f5;
  color: #43536b;
  font-size: 13px;
  vertical-align: middle;
}

.ep-table tbody tr:nth-child(even) td {
  background: #fbfcfe;
}

.ep-table tbody tr:hover td {
  background: #f0f5ff;
}

.ep-table tr:last-child td {
  border-bottom: 0;
}

.ep-table td.fw-bold {
  color: #233c62;
  font-weight: 700;
}

.ep-col-end {
  text-align: end !important;
}

.ep-date {
  color: var(--muted);
  font-weight: 600;
  white-space: nowrap;
}

.ep-desc {
  max-width: 260px;
  overflow-wrap: anywhere;
}

.ep-money {
  color: #94590a;
  font-weight: 800;
  white-space: nowrap;
}

.ep-state {
  padding: 38px 18px !important;
  color: #8996a9 !important;
  text-align: center;
  font-size: 13px !important;
}

.ep-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  margin-inline-end: 9px;
  border: 3px solid #dbeafe;
  border-top-color: var(--primary);
  border-radius: 50%;
  vertical-align: middle;
  animation: ep-spin .75s linear infinite;
}

@keyframes ep-spin {
  to { transform: rotate(360deg); }
}

.ep-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  padding: 5px 10px;
  border-radius: 30px;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}

.badge-red {
  background: var(--red-soft);
  color: #a3212e;
}

.badge-green {
  background: var(--green-soft);
  color: #087451;
}

/* ACTION BUTTONS */

.ep-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 7px;
}

.btn-icon {
  display: inline-grid;
  place-items: center;
  flex: 0 0 33px;
  width: 33px;
  height: 33px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 9px;
  background: transparent;
  color: #64748b;
  font-size: 13px;
  cursor: pointer;
  transition: .18s ease;
}

.btn-icon:hover {
  background: #eef2f8;
}

.btn-edit {
  border-color: #cbdcff;
  background: var(--primary-soft);
  color: var(--primary);
}

.btn-edit:hover {
  background: var(--primary);
  color: #fff;
}

.btn-delete {
  border-color: #f5cbd0;
  background: var(--red-soft);
  color: var(--red);
}

.btn-delete:hover {
  background: var(--red);
  color: #fff;
}

/* MODALS */

.ep-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(15,23,42,.58);
  backdrop-filter: blur(4px);
  overflow-y: auto;
}

.ep-modal {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 500px;
  max-height: calc(100vh - 32px);
  max-height: calc(100dvh - 32px);
  overflow: hidden;
  border: 1px solid rgba(255,255,255,.5);
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 22px 55px rgba(0,0,0,.22);
}

.ep-modal form {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.ep-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 0 0 auto;
  gap: 12px;
  padding: 15px 19px;
  border-bottom: 1px solid var(--line);
  background: #fbfcff;
}

.ep-modal-header h3 {
  margin: 0;
  color: var(--ink);
  font-size: 16px;
  font-weight: 800;
}

.ep-modal-body {
  min-height: 0;
  padding: 19px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.ep-modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: 0 0 auto;
  flex-wrap: wrap;
  gap: 9px;
  padding: 13px 19px;
  border-top: 1px solid var(--line);
  background: #f7f9fd;
}

.ep-modal-footer.center {
  justify-content: center;
}

.ep-form-group {
  margin-bottom: 13px;
}

.ep-form-group:last-child {
  margin-bottom: 0;
}

.ep-form-group label {
  display: block;
  margin-bottom: 6px;
  color: #465873;
  font-size: 12px;
  font-weight: 800;
}

.ep-form-group input,
.ep-form-group select,
.ep-form-group textarea {
  display: block;
  width: 100%;
  min-height: 39px;
  padding: 9px 11px;
  border: 1px solid #dce4ef;
  border-radius: 9px;
  background: #fbfcfe;
  color: #2a3a55;
  font-size: 13px;
  outline: none;
  transition: .2s;
}

.ep-form-group textarea {
  min-height: 75px;
  resize: vertical;
}

.ep-form-group input:focus,
.ep-form-group select:focus,
.ep-form-group textarea:focus {
  border-color: var(--primary);
  background: #fff;
  box-shadow: 0 0 0 3px var(--primary-soft);
}

.ep-form-group input::placeholder,
.ep-form-group textarea::placeholder {
  color: #9aa6b8;
}

.ep-form-error {
  margin-bottom: 13px;
  padding: 10px 12px;
  border-radius: 9px;
  background: var(--red-soft);
  color: #a3212e;
  font-size: 12px;
  font-weight: 600;
}

.ep-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 9px 17px;
  border: 0;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: .18s ease;
}

.ep-btn:hover:not(:disabled) {
  filter: brightness(.96);
  transform: translateY(-1px);
}

.ep-btn:disabled {
  opacity: .6;
  cursor: not-allowed;
}

.ep-btn-cancel {
  background: #e8edf5;
  color: #44546d;
}

.ep-btn-save {
  background: linear-gradient(135deg, #2563eb, #397cf0);
  color: #fff;
  box-shadow: 0 4px 10px rgba(37,99,235,.16);
}

.ep-btn-danger {
  background: var(--red);
  color: #fff;
}

.ep-delete-body {
  padding: 27px 22px 15px;
  text-align: center;
}

.ep-delete-icon {
  display: inline-grid;
  place-items: center;
  width: 54px;
  height: 54px;
  margin-bottom: 13px;
  border-radius: 50%;
  background: var(--red-soft);
  color: var(--red);
  font-size: 23px;
}

.ep-delete-body h4 {
  margin: 0 0 7px;
  color: var(--ink);
  font-size: 17px;
  font-weight: 800;
}

.ep-delete-body p {
  margin: 0 0 12px;
  color: var(--muted);
  font-size: 12px;
}

/* RESPONSIVE */

@media (max-width: 900px) {
  .ep-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .ep-stats .ep-card:last-child {
    grid-column: 1 / -1;
  }
}

@media (max-width: 650px) {
  .expenses-page {
    padding: 11px;
  }

  .ep-hero {
    align-items: flex-start;
    padding: 17px;
    border-radius: 14px;
  }

  .ep-hero-actions {
    width: 100%;
  }

  .ep-btn-add {
    width: 100%;
  }

  .ep-stats {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .ep-stats .ep-card:last-child {
    grid-column: auto;
  }

  .ep-card {
    padding: 14px;
  }

  .ep-filters {
    grid-template-columns: 1fr;
    padding: 12px;
  }

  .ep-reset {
    width: 100%;
  }

  .ep-table {
    min-width: 680px;
  }

  .ep-table th,
  .ep-table td {
    padding: 11px 12px;
  }

  .ep-modal-overlay {
    align-items: center;
    padding: 10px;
  }

  .ep-modal {
    max-height: calc(100vh - 20px);
    max-height: calc(100dvh - 20px);
    border-radius: 14px;
  }

  .ep-modal-header,
  .ep-modal-body,
  .ep-modal-footer {
    padding-inline: 14px;
  }

  .ep-modal-footer .ep-btn {
    flex: 1;
  }
}

@media (max-width: 380px) {
  .ep-title h1 {
    font-size: 19px;
  }

  .ep-title-icon {
    flex-basis: 35px;
    width: 35px;
    height: 35px;
    font-size: 16px;
  }

  .ep-card-info .value {
    font-size: 21px;
  }

  .ep-modal-footer {
    gap: 7px;
  }

  .ep-modal-footer .ep-btn {
    padding-inline: 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ep-spinner {
    animation-duration: 2s;
  }

  .ep-card,
  .ep-btn,
  .ep-btn-add,
  .btn-icon {
    transition: none;
  }
}


      `}</style>

      {/* En-tête */}
      <header className="ep-hero">
        <div className="ep-title">
          <span className="ep-eyebrow">GESTISTOCK</span>
          <h1>
            <span className="ep-title-icon"><i className="fas fa-users" /></span>
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
          <button type="button" onClick={fetchCustomers}>{t.retry}</button>
        </div>
      )}

      {/* Statistiques */}
      <section className="ep-stats">
        <div className="ep-card tone-blue">
          <div className="ep-card-info">
            <h3>{t.stat_total}</h3>
            <div className="value">{stats.total}</div>
            <div className="sub">{t.records(stats.total)}</div>
          </div>
          <div className="ep-icon"><i className="fas fa-users" /></div>
        </div>
        <div className="ep-card tone-amber">
          <div className="ep-card-info">
            <h3>{t.stat_debt}</h3>
            <div className="value">{amt(stats.totalDebt)} <small>{cur}</small></div>
            <div className="sub">{t.stat_debt_sub}</div>
          </div>
          <div className="ep-icon"><i className="fas fa-hand-holding-usd" /></div>
        </div>
        <div className="ep-card tone-violet">
          <div className="ep-card-info">
            <h3>{t.stat_with_debt}</h3>
            <div className="value">{stats.withDebt}</div>
            <div className="sub">{t.with_debt_sub}</div>
          </div>
          <div className="ep-icon"><i className="fas fa-exclamation-circle" /></div>
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
                <th>{t.th_name}</th>
                <th>{t.th_phone}</th>
                <th>{t.th_email}</th>
                <th>{t.th_address}</th>
                <th>{t.th_balance}</th>
                <th className="ep-col-end">{t.th_actions}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="ep-state"><span className="ep-spinner" />{t.loading}</td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr><td colSpan="6" className="ep-state">{t.none}</td></tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id}>
                    <td className="fw-bold">{c.name}</td>
                    <td className="ep-date" dir="ltr" style={{ textAlign: t.dir === 'rtl' ? 'right' : 'left' }}>{c.phone || '—'}</td>
                    <td>{c.email || '—'}</td>
                    <td className="ep-desc">{c.address || '—'}</td>
                    <td>
                      <span className={`ep-badge ${Number(c.balance) > 0 ? 'badge-red' : 'badge-green'}`}>
                        {Number(c.balance) > 0 ? amt(c.balance) : t.no_debt}
                      </span>
                    </td>
                    <td className="ep-col-end">
                      <div className="ep-actions">
                        <button type="button" className="btn-icon btn-edit" onClick={() => handleOpenEdit(c)} title={t.edit} aria-label={t.edit}>
                          <i className="fas fa-edit" />
                        </button>
                        <button type="button" className="btn-icon btn-delete" onClick={() => handleDeleteClick(c)} title={t.delete} aria-label={t.delete}>
                          <i className="fas fa-trash-alt" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
              <h3 id="ep-form-title">{currentCustomer ? t.modal_edit : t.modal_new}</h3>
              <button type="button" className="btn-icon" onClick={closeModals} aria-label={t.close}>
                <i className="fas fa-times" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="ep-modal-body">
                {formErrorKey && <div className="ep-form-error" role="alert">{t[formErrorKey]}</div>}
                <div className="ep-form-group">
                  <label htmlFor="ep-name">{t.f_name}</label>
                  <input id="ep-name" type="text" placeholder={t.f_name_ph} required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="ep-form-group">
                  <label htmlFor="ep-phone">{t.f_phone}</label>
                  <input id="ep-phone" type="text" placeholder={t.f_phone_ph} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} dir="ltr" style={{ textAlign: t.dir === 'rtl' ? 'right' : 'left' }} />
                </div>
                <div className="ep-form-group">
                  <label htmlFor="ep-email">{t.f_email}</label>
                  <input id="ep-email" type="email" placeholder={t.f_email_ph} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} dir="ltr" style={{ textAlign: t.dir === 'rtl' ? 'right' : 'left' }} />
                </div>
                <div className="ep-form-group">
                  <label htmlFor="ep-address">{t.f_address}</label>
                  <textarea id="ep-address" rows="2" placeholder={t.f_address_ph} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                </div>
                <div className="ep-form-group">
                  <label htmlFor="ep-balance">{t.f_balance}</label>
                  <input id="ep-balance" type="number" min="0" step="0.01" value={formData.balance} onChange={(e) => setFormData({ ...formData, balance: e.target.value })} dir="ltr" style={{ textAlign: t.dir === 'rtl' ? 'right' : 'left' }} />
                  <small className="text-muted d-block mt-1">{t.f_balance_hint}</small>
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

export default CustomersPage;