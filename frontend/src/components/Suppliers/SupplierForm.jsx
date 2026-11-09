// src/pages/SuppliersPage.jsx
// Gestion des fournisseurs — Version bilingue Français / العربية (RTL)
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { suppliersApi } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
/* =========================================================
   TRADUCTIONS / الترجمة
========================================================= */

const I18N = {
  fr: {
    dir: 'ltr',
    locale: 'fr-FR',
    currency: 'MRU',
    title: 'Gestion des fournisseurs',
    subtitle: 'Gérez vos fournisseurs, leurs coordonnées et vos dettes envers eux.',
    add: 'Nouveau fournisseur',
    stat_total: 'Total des fournisseurs',
    records: (n) => `${n} fournisseur(s)`,
    stat_payable: 'Total à payer',
    stat_payable_sub: 'Montants dus aux fournisseurs',
    stat_with_debt: 'Fournisseurs à payer',
    with_debt_sub: 'Soldes non nuls',
    search_ph: 'Rechercher par nom, société ou téléphone...',
    th_name: 'Nom / Société',
    th_contact: 'Contact',
    th_phone: 'Téléphone',
    th_email: 'Email',
    th_address: 'Adresse',
    th_balance: 'Solde à payer',
    th_actions: 'Actions',
    loading: 'Chargement...',
    none: 'Aucun fournisseur trouvé.',
    edit: 'Modifier',
    delete: 'Supprimer',
    modal_edit: 'Modifier le fournisseur',
    modal_new: 'Nouveau fournisseur',
    f_name: 'Nom du fournisseur / société',
    f_name_ph: 'Ex : Société Import SARL',
    f_contact: 'Personne de contact',
    f_contact_ph: 'Ex : Ahmed Ould Mohamed',
    f_phone: 'Téléphone',
    f_phone_ph: 'Ex : 222 XX XX XX XX',
    f_email: 'Email',
    f_email_ph: 'Ex : contact@societe.com',
    f_address: 'Adresse',
    f_address_ph: 'Adresse complète...',
    f_balance: 'Solde initial à payer',
    f_balance_hint: 'Montant que vous devez à ce fournisseur (0 si aucun).',
    cancel: 'Annuler',
    save: 'Enregistrer',
    saving: 'Enregistrement...',
    delete_title: 'Supprimer ce fournisseur ?',
    delete_warn: 'Cette action est irréversible.',
    delete_confirm: 'Oui, supprimer',
    deleting: 'Suppression...',
    err_load: 'Impossible de charger les fournisseurs.',
    err_save: "Erreur lors de l'enregistrement.",
    err_delete: 'Erreur lors de la suppression.',
    close: 'Fermer',
    retry: 'Réessayer',
    reset: 'Réinitialiser',
    switch_title: 'Changer de langue',
    no_debt: 'Aucune dette',
  },
  ar: {
    dir: 'rtl',
    locale: 'ar-u-nu-latn',
    currency: 'أوقية',
    title: 'إدارة الموردين',
    subtitle: 'أدر مورديك، بياناتهم، والمبالغ المستحقة لهم.',
    add: 'مورد جديد',
    stat_total: 'إجمالي الموردين',
    records: (n) => `${n} مورد`,
    stat_payable: 'إجمالي المستحق للدفع',
    stat_payable_sub: 'مبالغ مستحقة للموردين',
    stat_with_debt: 'موردون لهم مستحقات',
    with_debt_sub: 'أرصدة غير صفرية',
    search_ph: 'ابحث بالاسم، الشركة أو رقم الهاتف...',
    th_name: 'الاسم / الشركة',
    th_contact: 'جهة الاتصال',
    th_phone: 'الهاتف',
    th_email: 'البريد الإلكتروني',
    th_address: 'العنوان',
    th_balance: 'الرصيد المستحق',
    th_actions: 'إجراءات',
    loading: 'جارٍ التحميل...',
    none: 'لا يوجد موردون.',
    edit: 'تعديل',
    delete: 'حذف',
    modal_edit: 'تعديل بيانات المورد',
    modal_new: 'مورد جديد',
    f_name: 'اسم المورد / الشركة',
    f_name_ph: 'مثال: شركة الاستيراد ذ.م.م',
    f_contact: 'الشخص المسؤول',
    f_contact_ph: 'مثال: أحمد ولد محمد',
    f_phone: 'الهاتف',
    f_phone_ph: 'مثال: 222 XX XX XX XX',
    f_email: 'البريد الإلكتروني',
    f_email_ph: 'مثال: contact@societe.com',
    f_address: 'العنوان',
    f_address_ph: 'العنوان الكامل...',
    f_balance: 'الرصيد الافتتاحي المستحق',
    f_balance_hint: 'المبلغ الذي تدين به لهذا المورد (0 إن لم يكن هناك شيء).',
    cancel: 'إلغاء',
    save: 'حفظ',
    saving: 'جارٍ الحفظ...',
    delete_title: 'حذف هذا المورد؟',
    delete_warn: 'لا يمكن التراجع عن هذا الإجراء.',
    delete_confirm: 'نعم، احذف',
    deleting: 'جارٍ الحذف...',
    err_load: 'تعذّر تحميل الموردين.',
    err_save: 'حدث خطأ أثناء الحفظ.',
    err_delete: 'حدث خطأ أثناء الحذف.',
    close: 'إغلاق',
    retry: 'إعادة المحاولة',
    reset: 'إعادة تعيين',
    switch_title: 'تغيير اللغة',
    no_debt: 'لا توجد مستحقات',
  },
};

// Clé partagée avec les pages Clients / Rapports / Dépenses


/* =========================================================
   UTILITAIRES
========================================================= */

const formatMoney = (value) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(value) || 0);

const emptyForm = () => ({ name: '', contact: '', phone: '', email: '', address: '', balance: 0 });

/* =========================================================
   COMPOSANT
========================================================= */

const SuppliersPage = () => {
const { lang } = useLanguage(); // langue globale (menu)
const t = I18N[lang];
const cur = t.currency;
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState('');
  const [formErrorKey, setFormErrorKey] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [currentSupplier, setCurrentSupplier] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const fetchSuppliers = async () => {
    setLoading(true);
    setErrorKey('');
    try {
      const res = await suppliersApi.getAll();
      const data = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : res?.data?.data || [];
      setSuppliers(data);
    } catch (err) {
      console.error('Erreur chargement fournisseurs:', err);
      setErrorKey('err_load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const closeModals = useCallback(() => {
    setShowForm(false);
    setShowDeleteModal(false);
    setFormErrorKey('');
  }, []);

  useEffect(() => {
    if (!showForm && !showDeleteModal) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closeModals();
    };
    window.addEventListener('keydown', onKey);
    // Empêche le scroll de l'arrière-plan
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [showForm, showDeleteModal, closeModals]);

  /* ---------- Actions ---------- */
  const handleOpenCreate = () => {
    setCurrentSupplier(null);
    setFormData(emptyForm());
    setFormErrorKey('');
    setShowForm(true);
  };

  const handleOpenEdit = (supplier) => {
    setCurrentSupplier(supplier);
    setFormData({
      name: supplier.name || '',
      contact: supplier.contact || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      balance: supplier.balance || 0,
    });
    setFormErrorKey('');
    setShowForm(true);
  };

  const handleDeleteClick = (supplier) => {
    setCurrentSupplier(supplier);
    setFormErrorKey('');
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormErrorKey('');
    try {
      const payload = { ...formData, balance: parseFloat(formData.balance) || 0 };
      if (currentSupplier) await suppliersApi.update(currentSupplier.id, payload);
      else await suppliersApi.create(payload);
      closeModals();
      fetchSuppliers();
    } catch (err) {
      console.error(err);
      setFormErrorKey('err_save');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!currentSupplier) return;
    setSaving(true);
    setFormErrorKey('');
    try {
      await suppliersApi.delete(currentSupplier.id);
      closeModals();
      fetchSuppliers();
    } catch (err) {
      console.error(err);
      setFormErrorKey('err_delete');
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Filtrage et statistiques ---------- */
  const filteredSuppliers = useMemo(() => {
    const needle = search.toLowerCase();
    return suppliers
      .filter((s) => {
        if (!search) return true;
        return (
          (s.name || '').toLowerCase().includes(needle) ||
          (s.company || '').toLowerCase().includes(needle) ||
          (s.contact || '').toLowerCase().includes(needle) ||
          (s.phone || '').includes(needle)
        );
      })
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [suppliers, search]);

  const stats = useMemo(() => {
    const total = suppliers.length;
    const totalPayable = suppliers.reduce((sum, s) => sum + (Number(s.balance) > 0 ? Number(s.balance) : 0), 0);
    const withDebt = suppliers.filter((s) => Number(s.balance) > 0).length;
    return { total, totalPayable, withDebt };
  }, [suppliers]);

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
        .ep-eyebrow { font-size: 11px; font-weight: 800; letter-spacing: 1.8px; opacity: .78; }
        .ep-title h1 { margin: 6px 0 4px; font-size: clamp(22px, 2.8vw, 30px); font-weight: 800; display: flex; align-items: center; gap: 12px; line-height: 1.25; }
        .ep-title-icon { display: inline-grid; place-items: center; width: 42px; height: 42px; border-radius: 12px; background: rgba(255,255,255,.16); font-size: 18px; }
        .ep-title p { margin: 0; color: rgba(255,255,255,.82); font-size: 13px; }
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
        .ep-card-info h3 { margin: 0 0 9px; font-size: 12px; color: var(--muted); font-weight: 800; }
        .ep-card-info .value { font-size: clamp(21px, 2.2vw, 27px); font-weight: 800; letter-spacing: -.3px; color: var(--ink); overflow-wrap: anywhere; }
        .ep-card-info .value small { font-size: 12px; color: #8896ab; font-weight: 700; }
        .ep-card-info .sub { margin-top: 5px; font-size: 12px; color: var(--accent); font-weight: 700; }
        .ep-icon { position: relative; z-index: 1; flex: 0 0 44px; width: 44px; height: 44px; border-radius: 13px; display: grid; place-items: center; font-size: 19px; background: var(--accent-soft); color: var(--accent); }
        .tone-amber  { --accent: var(--amber);  --accent-soft: var(--amber-soft); }
        .tone-violet { --accent: var(--violet); --accent-soft: var(--violet-soft); }
        .tone-blue   { --accent: var(--primary); --accent-soft: var(--primary-soft); }

        /* ---------- Panneau & filtres ---------- */
        .ep-panel { background: var(--card); border-radius: 16px; border: 1px solid var(--line); overflow: hidden; box-shadow: 0 4px 14px rgba(20,33,61,.035); }
        .ep-filters { display: grid; grid-template-columns: 1fr auto; gap: 12px; align-items: center; padding: 15px 20px; background: #fbfcff; border-bottom: 1px solid var(--line); }
        .ep-filter-input { width: 100%; height: 40px; border: 1px solid #d9e1ed; border-radius: 9px; padding: 0 12px; font: inherit; font-size: 13px; color: #2a3a55; background: #fff; outline: none; }
        .ep-filter-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); }
        .ep-reset { height: 40px; padding: 0 13px; border: 1px solid var(--line); border-radius: 9px; background: #fff; color: #4b5b75; font: inherit; font-size: 12px; font-weight: 800; cursor: pointer; white-space: nowrap; }
        .ep-reset:hover { background: #f1f5fb; }

        /* ---------- Tableau ---------- */
        .ep-table-wrap { overflow-x: auto; }
        .ep-table { width: 100%; min-width: 760px; border-collapse: collapse; }
        .ep-table th { background: #f3f6fc; color: #5b6b85; text-align: start; padding: 14px 20px; font-size: 11px; font-weight: 800; letter-spacing: .4px; border-bottom: 1px solid var(--line); white-space: nowrap; }
        .ep-table td { padding: 14px 20px; border-bottom: 1px solid #f0f3f8; font-size: 13.5px; color: #44546d; vertical-align: middle; }
        .ep-table tbody tr:nth-child(even) td { background: #fafbfe; }
        .ep-table tbody tr:hover td { background: #eff4ff; }
        .ep-table tr:last-child td { border-bottom: 0; }
        .ep-col-end { text-align: end !important; }
        .ep-date { color: var(--muted); font-weight: 600; white-space: nowrap; }
        .ep-desc { max-width: 320px; overflow-wrap: anywhere; }
        .ep-state { padding: 38px 18px !important; text-align: center; color: #8896ab !important; }
        .ep-spinner { display: inline-block; width: 22px; height: 22px; margin-inline-end: 10px; vertical-align: middle; border: 3px solid #dbeafe; border-top-color: var(--primary); border-radius: 50%; animation: ep-spin .75s linear infinite; }
        @keyframes ep-spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .ep-spinner { animation-duration: 2s; } .ep-card, .ep-btn-add { transition: none; } }

        .ep-badge { display: inline-block; padding: 5px 11px; border-radius: 999px; font-size: 12px; font-weight: 800; }
        .badge-red   { background: var(--red-soft); color: #a3212e; }
        .badge-green { background: var(--green-soft); color: #0b6a4e; }

        .ep-actions { display: flex; gap: 8px; justify-content: flex-end; }
        .btn-icon { width: 34px; height: 34px; border-radius: 9px; border: 1px solid transparent; display: grid; place-items: center; cursor: pointer; transition: .18s; background: transparent; color: #64748b; font-size: 13px; }
        .btn-icon:hover { background: #eef2f8; }
        .btn-edit { background: var(--primary-soft); color: var(--primary); border-color: #c9daff; }
        .btn-edit:hover { background: var(--primary); color: #fff; }
        .btn-delete { background: var(--red-soft); color: var(--red); border-color: #f6c8cd; }
        .btn-delete:hover { background: var(--red); color: #fff; }

        /* ---------- Modales ---------- */
        .ep-modal-overlay { position: fixed; inset: 0; z-index: 1050; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(15,23,42,.58); backdrop-filter: blur(4px); }
        .ep-modal { width: 100%; max-width: 520px; max-height: calc(100vh - 40px); overflow: auto; background: #fff; border-radius: 18px; box-shadow: 0 25px 50px rgba(0,0,0,.22); }
        .ep-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 22px; border-bottom: 1px solid var(--line); background: linear-gradient(180deg, #fbfcff, #fff); }
        .ep-modal-header h3 { margin: 0; font-size: 17px; font-weight: 800; }
        .ep-modal-body { padding: 22px; }
        .ep-modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 15px 22px; background: #f7f9fd; border-top: 1px solid var(--line); }
        .ep-modal-footer.center { justify-content: center; }
        .ep-form-group { margin-bottom: 15px; }
        .ep-form-group label { display: block; margin-bottom: 6px; font-size: 12px; font-weight: 800; color: #4b5b75; }
        .ep-form-group input, .ep-form-group select, .ep-form-group textarea { width: 100%; border: 1px solid #d9e1ed; border-radius: 9px; padding: 10px 12px; font: inherit; font-size: 14px; color: #2a3a55; background: #fbfcfe; outline: none; }
        .ep-form-group input:focus, .ep-form-group textarea:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); background: #fff; }
        .ep-form-error { margin-bottom: 14px; padding: 11px 14px; border-radius: 9px; background: var(--red-soft); color: #a3212e; font-size: 13px; font-weight: 600; }
        .ep-hint { display: block; margin-top: 5px; font-size: 11px; color: #8896ab; }
        .ep-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 480px) { .ep-grid2 { grid-template-columns: 1fr; } }
        .ep-btn { padding: 10px 20px; border-radius: 10px; border: 0; font: inherit; font-size: 13px; font-weight: 800; cursor: pointer; transition: .18s; }
        .ep-btn:hover:not(:disabled) { filter: brightness(.96); transform: translateY(-1px); }
        .ep-btn:disabled { opacity: .6; cursor: not-allowed; }
        .ep-btn-cancel { background: #e6ebf3; color: #44546d; }
        .ep-btn-save { background: linear-gradient(135deg, #1f5eea, #2f7bf0); color: #fff; }
        .ep-btn-danger { background: var(--red); color: #fff; }
        .ep-delete-body { padding: 28px 22px 10px; text-align: center; }
        .ep-delete-icon { display: inline-grid; place-items: center; width: 58px; height: 58px; margin-bottom: 14px; border-radius: 50%; background: var(--red-soft); color: var(--red); font-size: 24px; }
        .ep-delete-body h4 { margin: 0 0 6px; font-size: 18px; font-weight: 800; }
        .ep-delete-body p { margin: 0 0 12px; color: var(--muted); font-size: 13px; }

        @media (max-width: 1000px) { .ep-filters { grid-template-columns: 1fr; } }
        @media (max-width: 900px) { .ep-stats { grid-template-columns: 1fr; } }
        @media (max-width: 560px) {
          .expenses-page { padding: 12px; }
          .ep-filters { padding: 14px; }
          .ep-hero-actions { width: 100%; } .ep-btn-add { flex: 1; justify-content: center; }
          .ep-table th, .ep-table td { padding: 12px; }
        }
      `}</style>

      {/* En-tête */}
      <header className="ep-hero">
        <div className="ep-title">
          <span className="ep-eyebrow">GESTISTOCK</span>
          <h1>
            <span className="ep-title-icon"><i className="fas fa-truck-field" /></span>
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
          <button type="button" onClick={fetchSuppliers}>{t.retry}</button>
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
          <div className="ep-icon"><i className="fas fa-truck-field" /></div>
        </div>
        <div className="ep-card tone-amber">
          <div className="ep-card-info">
            <h3>{t.stat_payable}</h3>
            <div className="value">{amt(stats.totalPayable)} <small>{cur}</small></div>
            <div className="sub">{t.stat_payable_sub}</div>
          </div>
          <div className="ep-icon"><i className="fas fa-money-bill-wave" /></div>
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
                <th>{t.th_contact}</th>
                <th>{t.th_phone}</th>
                <th>{t.th_email}</th>
                <th>{t.th_address}</th>
                <th>{t.th_balance}</th>
                <th className="ep-col-end">{t.th_actions}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="ep-state"><span className="ep-spinner" />{t.loading}</td></tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr><td colSpan="7" className="ep-state">{t.none}</td></tr>
              ) : (
                filteredSuppliers.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 700 }}>{s.name}</td>
                    <td>{s.contact || '—'}</td>
                    <td className="ep-date" dir="ltr" style={{ textAlign: t.dir === 'rtl' ? 'right' : 'left' }}>{s.phone || '—'}</td>
                    <td>{s.email || '—'}</td>
                    <td className="ep-desc">{s.address || '—'}</td>
                    <td>
                      <span className={`ep-badge ${Number(s.balance) > 0 ? 'badge-red' : 'badge-green'}`}>
                        {Number(s.balance) > 0 ? amt(s.balance) : t.no_debt}
                      </span>
                    </td>
                    <td className="ep-col-end">
                      <div className="ep-actions">
                        <button type="button" className="btn-icon btn-edit" onClick={() => handleOpenEdit(s)} title={t.edit} aria-label={t.edit}>
                          <i className="fas fa-edit" />
                        </button>
                        <button type="button" className="btn-icon btn-delete" onClick={() => handleDeleteClick(s)} title={t.delete} aria-label={t.delete}>
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
              <h3 id="ep-form-title">{currentSupplier ? t.modal_edit : t.modal_new}</h3>
              <button type="button" className="btn-icon" onClick={closeModals} aria-label={t.close}>
                <i className="fas fa-times" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="ep-modal-body">
                {formErrorKey && <div className="ep-form-error" role="alert">{t[formErrorKey]}</div>}

                <div className="ep-form-group">
                  <label htmlFor="sp-name">{t.f_name}</label>
                  <input id="sp-name" type="text" placeholder={t.f_name_ph} required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>

                <div className="ep-grid2">
                  <div className="ep-form-group">
                    <label htmlFor="sp-contact">{t.f_contact}</label>
                    <input id="sp-contact" type="text" placeholder={t.f_contact_ph} value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} />
                  </div>
                  <div className="ep-form-group">
                    <label htmlFor="sp-phone">{t.f_phone}</label>
                    <input id="sp-phone" type="text" placeholder={t.f_phone_ph} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} dir="ltr" style={{ textAlign: t.dir === 'rtl' ? 'right' : 'left' }} />
                  </div>
                </div>

                <div className="ep-form-group">
                  <label htmlFor="sp-email">{t.f_email}</label>
                  <input id="sp-email" type="email" placeholder={t.f_email_ph} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} dir="ltr" style={{ textAlign: t.dir === 'rtl' ? 'right' : 'left' }} />
                </div>

                <div className="ep-form-group">
                  <label htmlFor="sp-address">{t.f_address}</label>
                  <textarea id="sp-address" rows="2" placeholder={t.f_address_ph} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                </div>

                <div className="ep-form-group">
                  <label htmlFor="sp-balance">{t.f_balance}</label>
                  <input id="sp-balance" type="number" min="0" step="0.01" value={formData.balance} onChange={(e) => setFormData({ ...formData, balance: e.target.value })} dir="ltr" style={{ textAlign: t.dir === 'rtl' ? 'right' : 'left' }} />
                  <small className="ep-hint">{t.f_balance_hint}</small>
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

export default SuppliersPage;