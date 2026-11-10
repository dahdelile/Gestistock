// src/pages/CategoriesPage.jsx
// Version bilingue Français / العربية (RTL) — design unifié avec ExpensesPage
import React, { useState, useEffect, useMemo } from 'react';
import { categoriesApi } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
/* =========================================================
   TRADUCTIONS / الترجمة
========================================================= */

const I18N = {
  fr: {
    dir: 'ltr',
    locale: 'fr-FR',
    title: 'Gestion des catégories',
    subtitle: 'Organisez vos catégories et sous-catégories de produits.',
    add: 'Nouvelle catégorie',
    add_sub: 'Sous-catégorie',
    stat_total: 'Total des catégories',
    records: (n) => `${n} catégorie(s)`,
    stat_active: 'Catégories actives',
    active_sub: 'Visibles dans le catalogue',
    stat_subs: 'Sous-catégories',
    subs_sub: 'Rattachées aux catégories',
    search_ph: 'Rechercher une catégorie...',
    all_status: 'Tous les statuts',
    status_active: '✓ Actifs uniquement',
    status_inactive: '✗ Inactifs uniquement',
    reset: 'Réinitialiser',
    th_name: 'Nom',
    th_subs: 'Sous-catégories',
    th_status: 'Statut',
    th_actions: 'Actions',
    loading: 'Chargement...',
    none: 'Aucune catégorie trouvée.',
    active: 'Actif',
    inactive: 'Inactif',
    no_subs: 'Aucune',
    sub_count: (n) => `${n} sous-catégorie(s)`,
    edit: 'Modifier',
    delete: 'Supprimer',
    add_sub_title: 'Ajouter une sous-catégorie',
    toggle_on: 'Activer',
    toggle_off: 'Désactiver',
    modal_edit_cat: 'Modifier la catégorie',
    modal_new_cat: 'Nouvelle catégorie',
    modal_edit_sub: 'Modifier la sous-catégorie',
    modal_new_sub: 'Nouvelle sous-catégorie',
    f_name_cat: 'Nom de la catégorie',
    f_name_cat_ph: 'Ex : Électronique',
    f_name_sub: 'Nom de la sous-catégorie',
    f_name_sub_ph: 'Ex : Téléphones',
    f_parent: 'Catégorie parente',
    f_parent_ph: 'Sélectionnez une catégorie',
    f_status: 'Statut',
    cancel: 'Annuler',
    save: 'Enregistrer',
    saving: 'Enregistrement...',
    delete_cat_title: 'Supprimer cette catégorie ?',
    delete_sub_title: 'Supprimer cette sous-catégorie ?',
    delete_warn: 'Cette action est irréversible.',
    delete_sub_warn: (n) => `${n} sous-catégorie(s) seront également supprimée(s).`,
    delete_confirm: 'Oui, supprimer',
    deleting: 'Suppression...',
    err_load: 'Impossible de charger les catégories.',
    err_save: "Erreur lors de l'enregistrement.",
    err_delete: 'Erreur lors de la suppression.',
    close: 'Fermer',
    retry: 'Réessayer',
    switch_title: 'Changer de langue',
  },
  ar: {
    dir: 'rtl',
    locale: 'ar-u-nu-latn',
    title: 'إدارة الفئات',
    subtitle: 'نظّم فئات منتجاتك وفئاتها الفرعية.',
    add: 'فئة جديدة',
    add_sub: 'فئة فرعية',
    stat_total: 'إجمالي الفئات',
    records: (n) => `${n} فئة`,
    stat_active: 'الفئات النشطة',
    active_sub: 'ظاهرة في الكتالوج',
    stat_subs: 'الفئات الفرعية',
    subs_sub: 'مرتبطة بالفئات',
    search_ph: 'ابحث عن فئة...',
    all_status: 'كل الحالات',
    status_active: '✓ النشطة فقط',
    status_inactive: '✗ غير النشطة فقط',
    reset: 'إعادة تعيين',
    th_name: 'الاسم',
    th_subs: 'الفئات الفرعية',
    th_status: 'الحالة',
    th_actions: 'إجراءات',
    loading: 'جارٍ التحميل...',
    none: 'لا توجد فئات.',
    active: 'نشط',
    inactive: 'غير نشط',
    no_subs: 'لا يوجد',
    sub_count: (n) => `${n} فئة فرعية`,
    edit: 'تعديل',
    delete: 'حذف',
    add_sub_title: 'إضافة فئة فرعية',
    toggle_on: 'تنشيط',
    toggle_off: 'إلغاء التنشيط',
    modal_edit_cat: 'تعديل الفئة',
    modal_new_cat: 'فئة جديدة',
    modal_edit_sub: 'تعديل الفئة الفرعية',
    modal_new_sub: 'فئة فرعية جديدة',
    f_name_cat: 'اسم الفئة',
    f_name_cat_ph: 'مثال: إلكترونيات',
    f_name_sub: 'اسم الفئة الفرعية',
    f_name_sub_ph: 'مثال: هواتف',
    f_parent: 'الفئة الأم',
    f_parent_ph: 'اختر فئة',
    f_status: 'الحالة',
    cancel: 'إلغاء',
    save: 'حفظ',
    saving: 'جارٍ الحفظ...',
    delete_cat_title: 'حذف هذه الفئة؟',
    delete_sub_title: 'حذف هذه الفئة الفرعية؟',
    delete_warn: 'لا يمكن التراجع عن هذا الإجراء.',
    delete_sub_warn: (n) => `سيتم حذف ${n} فئة فرعية أيضًا.`,
    delete_confirm: 'نعم، احذف',
    deleting: 'جارٍ الحذف...',
    err_load: 'تعذّر تحميل الفئات.',
    err_save: 'حدث خطأ أثناء الحفظ.',
    err_delete: 'حدث خطأ أثناء الحذف.',
    close: 'إغلاق',
    retry: 'إعادة المحاولة',
    switch_title: 'تغيير اللغة',
  },
};

// Clé partagée avec Rapports / Dépenses / Clients / Fournisseurs
const LANG_KEY = 'gestistock_lang';

/* =========================================================
   UTILITAIRES
========================================================= */

const emptyForm = () => ({ name: '', category_id: '', status: 'active' });

const BADGE_TONES = ['blue', 'violet', 'green', 'amber', 'rose', 'teal'];
const toneFor = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return BADGE_TONES[hash % BADGE_TONES.length];
};

/* =========================================================
   COMPOSANT
========================================================= */

const CategoriesPage = () => {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem(LANG_KEY) === 'ar' ? 'ar' : 'fr';
    } catch {
      return 'fr';
    }
  });
  const t = I18N[lang];

  useEffect(() => {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* stockage indisponible */
    }
  }, [lang]);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState('');
  const [formErrorKey, setFormErrorKey] = useState('');

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalType, setModalType] = useState('category'); // 'category' | 'subcategory'

  // Données
  const [currentCategory, setCurrentCategory] = useState(null);
  const [currentSub, setCurrentSub] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Filtres
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Sous-catégories dépliées
  const [expanded, setExpanded] = useState({});

  const fetchCategories = async () => {
    setLoading(true);
    setErrorKey('');
    try {
      const res = await categoriesApi.getAll();
      const data = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : res?.data?.data || [];
      setCategories(data);
    } catch (err) {
      console.error('Erreur chargement catégories:', err);
      setErrorKey('err_load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const closeModals = () => {
    setShowForm(false);
    setShowDeleteModal(false);
    setFormErrorKey('');
    setCurrentCategory(null);
    setCurrentSub(null);
    setFormData(emptyForm());
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

  /* ---------- Ouverture des modales ---------- */
  const handleOpenCreateCategory = () => {
    setModalType('category');
    setCurrentCategory(null);
    setCurrentSub(null);
    setFormData(emptyForm());
    setFormErrorKey('');
    setShowForm(true);
  };

  const handleOpenEditCategory = (cat) => {
    setModalType('category');
    setCurrentCategory(cat);
    setCurrentSub(null);
    setFormData({ name: cat.name || '', category_id: '', status: cat.status || 'active' });
    setFormErrorKey('');
    setShowForm(true);
  };

  const handleAddSubCategory = (cat) => {
    setModalType('subcategory');
    setCurrentCategory(null);
    setCurrentSub(null);
    setFormData({ name: '', category_id: cat.id, status: 'active' });
    setFormErrorKey('');
    setShowForm(true);
  };

  const handleOpenEditSub = (sub) => {
    setModalType('subcategory');
    setCurrentSub(sub);
    setCurrentCategory(null);
    setFormData({
      name: sub.name || '',
      category_id: sub.category_id || '',
      status: sub.status || 'active',
    });
    setFormErrorKey('');
    setShowForm(true);
  };

  const handleDeleteCategory = (cat) => {
    setModalType('category');
    setCurrentCategory(cat);
    setCurrentSub(null);
    setFormErrorKey('');
    setShowDeleteModal(true);
  };

  const handleDeleteSub = (sub) => {
    setModalType('subcategory');
    setCurrentSub(sub);
    setCurrentCategory(null);
    setFormErrorKey('');
    setShowDeleteModal(true);
  };

  /* ---------- Soumission ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormErrorKey('');
    try {
      const name = formData.name.trim();
      if (!name) {
        setFormErrorKey('err_save');
        return;
      }
      if (modalType === 'subcategory') {
        const payload = {
          name,
          category_id: parseInt(formData.category_id, 10),
          status: formData.status,
        };
        if (currentSub) await categoriesApi.updateSub(currentSub.id, payload);
        else await categoriesApi.createSub(payload);
      } else {
        const payload = { name, status: formData.status };
        if (currentCategory) await categoriesApi.update(currentCategory.id, payload);
        else await categoriesApi.create(payload);
      }
      closeModals();
      fetchCategories();
    } catch (err) {
      console.error(err);
      setFormErrorKey('err_save');
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Suppression ---------- */
  const handleDeleteConfirm = async () => {
    setSaving(true);
    setFormErrorKey('');
    try {
      if (modalType === 'subcategory' && currentSub) {
        await categoriesApi.deleteSub(currentSub.id);
      } else if (currentCategory) {
        await categoriesApi.delete(currentCategory.id);
      }
      closeModals();
      fetchCategories();
    } catch (err) {
      console.error(err);
      setFormErrorKey('err_delete');
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Changement de statut ---------- */
  const handleToggleStatus = async (item, type = 'category') => {
    const newStatus = item.status === 'active' ? 'inactive' : 'active';
    try {
      if (type === 'subcategory') await categoriesApi.updateSubStatus(item.id, newStatus);
      else await categoriesApi.updateStatus(item.id, newStatus);
      fetchCategories();
    } catch (err) {
      console.error(err);
      setErrorKey('err_save');
    }
  };

  const toggleExpand = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  /* ---------- Filtrage et statistiques ---------- */
  const filteredCategories = useMemo(() => {
    const needle = search.toLowerCase();
    return categories
      .filter((c) => {
        const matchSearch =
          !search ||
          (c.name || '').toLowerCase().includes(needle) ||
          c.sous_categories?.some((s) => (s.name || '').toLowerCase().includes(needle));
        const matchStatus = filterStatus === 'all' || c.status === filterStatus;
        return matchSearch && matchStatus;
      })
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [categories, search, filterStatus]);

  const stats = useMemo(() => {
    const total = categories.length;
    const active = categories.filter((c) => c.status === 'active').length;
    const subs = categories.reduce((sum, c) => sum + (c.sous_categories?.length || 0), 0);
    return { total, active, subs };
  }, [categories]);

  const hasFilters = Boolean(search || filterStatus !== 'all');
  const resetFilters = () => {
    setSearch('');
    setFilterStatus('all');
  };

  /* =======================================================
     AFFICHAGE
  ======================================================= */

  return (
    <div className="expenses-page" dir={t.dir} lang={lang}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      <style>{`
       
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');

.expenses-page {
  --ink: #14213d;
  --muted: #718096;
  --line: #e5eaf2;
  --bg: #f4f7fc;
  --card: #ffffff;
  --primary: #2563eb;
  --primary-soft: #eaf1ff;
  --green: #0f9d74;
  --green-soft: #e1f6ee;
  --violet: #7054d8;
  --violet-soft: #eeeaff;
  --amber: #d99013;
  --amber-soft: #fff4df;
  --red: #dc4654;
  --red-soft: #ffeaec;
  --teal: #0e8fa8;
  --rose: #c2417c;

  min-height: 100vh;
  padding: clamp(12px, 2vw, 26px);
  background:
    radial-gradient(900px 300px at 100% -80px, rgba(37,99,235,.07), transparent 70%),
    var(--bg);
  color: var(--ink);
  font-family: Inter, "Segoe UI", system-ui, Arial, sans-serif;
  font-size: 14px;
}

.expenses-page[lang="ar"] {
  font-family: Cairo, Tahoma, Arial, sans-serif;
}

.expenses-page * {
  box-sizing: border-box;
}

.expenses-page button,
.expenses-page input,
.expenses-page select {
  font-family: inherit;
}

.expenses-page button:focus-visible,
.expenses-page input:focus-visible,
.expenses-page select:focus-visible {
  outline: 3px solid rgba(37,99,235,.25);
  outline-offset: 2px;
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
  gap: 16px;
  padding: clamp(18px, 2.5vw, 28px);
  margin-bottom: 20px;
  border-radius: 18px;
  color: #fff;
  background: linear-gradient(125deg, #102f65, #2058c5 60%, #2698cf);
  box-shadow: 0 10px 28px rgba(21,74,170,.16);
}

.ep-hero::after {
  content: "";
  position: absolute;
  z-index: -1;
  width: 230px;
  height: 230px;
  inset-inline-end: -75px;
  top: -120px;
  border: 28px solid rgba(255,255,255,.08);
  border-radius: 50%;
}

.ep-eyebrow {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.5px;
  opacity: .78;
}

.ep-title h1 {
  display: flex;
  align-items: center;
  gap: 11px;
  margin: 7px 0 5px;
  font-size: clamp(21px, 2.4vw, 28px);
  font-weight: 800;
  line-height: 1.35;
}

.ep-title-icon {
  display: inline-grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(255,255,255,.16);
  font-size: 20px;
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

.ep-lang {
  display: inline-flex;
  padding: 3px;
  border-radius: 10px;
  background: rgba(255,255,255,.15);
  border: 1px solid rgba(255,255,255,.24);
}

.ep-lang button {
  border: 0;
  padding: 7px 12px;
  border-radius: 7px;
  background: transparent;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.ep-lang button.on {
  background: #fff;
  color: #174078;
}

.ep-btn-add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  border: 0;
  border-radius: 10px;
  background: #fff;
  color: #174078;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 5px 14px rgba(0,0,0,.12);
  transition: .2s;
}

.ep-btn-add:hover {
  transform: translateY(-2px);
}

/* ALERT */
.ep-alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 15px;
  border: 1px solid #f5c6cb;
  border-radius: 10px;
  background: var(--red-soft);
  color: #a3212e;
  font-size: 13px;
}

.ep-alert button {
  border: 0;
  padding: 7px 12px;
  border-radius: 7px;
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
  margin-bottom: 20px;
}

.ep-card {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
  padding: 17px;
  background: var(--card);
  border: 1px solid var(--line);
  border-inline-start: 4px solid var(--accent);
  border-radius: 14px;
  box-shadow: 0 3px 12px rgba(20,33,61,.035);
  transition: transform .2s, box-shadow .2s;
}

.ep-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 9px 20px rgba(20,33,61,.07);
}

.ep-card::after {
  content: "";
  position: absolute;
  inset-inline-end: -28px;
  bottom: -40px;
  width: 100px;
  height: 100px;
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
  font-size: 13px;
  font-weight: 700;
}

.ep-card-info .value {
  color: var(--ink);
  font-size: clamp(23px, 2.5vw, 29px);
  font-weight: 800;
  line-height: 1.2;
}

.ep-card-info .sub {
  margin-top: 5px;
  color: var(--accent);
  font-size: 11px;
  font-weight: 600;
}

.ep-icon {
  position: relative;
  z-index: 1;
  flex: 0 0 42px;
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
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

.tone-green {
  --accent: var(--green);
  --accent-soft: var(--green-soft);
}

/* PANEL AND FILTERS */
.ep-panel {
  overflow: hidden;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 15px;
  box-shadow: 0 3px 12px rgba(20,33,61,.035);
}

.ep-filters {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(170px, 220px) auto;
  align-items: center;
  gap: 10px;
  padding: 15px 17px;
  background: #fbfcff;
  border-bottom: 1px solid var(--line);
}

.ep-filter-input {
  width: 100%;
  min-width: 0;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #dce3ed;
  border-radius: 9px;
  background: #fff;
  color: #2a3a55;
  font-size: 13px;
  outline: none;
  transition: .2s;
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
  color: #4b5b75;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.ep-reset:hover {
  background: #f1f5fb;
}

/* TABLE */
.ep-table-wrap {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.ep-table {
  width: 100%;
  min-width: 680px;
  border-collapse: collapse;
}

.ep-table th {
  padding: 13px 17px;
  background: #f5f7fb;
  color: #5b6b85;
  text-align: start;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .2px;
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
}

.ep-table td {
  padding: 12px 17px;
  border-bottom: 1px solid #eff2f7;
  color: #44546d;
  font-size: 13px;
  vertical-align: middle;
}

.ep-table tbody tr:nth-child(even) td {
  background: #fbfcfe;
}

.ep-table tbody tr:hover td {
  background: #f1f5ff;
}

.ep-table tr:last-child td {
  border-bottom: 0;
}

.ep-col-end {
  text-align: end !important;
}

.ep-state {
  padding: 38px 18px !important;
  text-align: center;
  color: #8896ab !important;
  font-size: 13px !important;
}

.ep-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  margin-inline-end: 9px;
  vertical-align: middle;
  border: 3px solid #dbeafe;
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: ep-spin .75s linear infinite;
}

@keyframes ep-spin {
  to { transform: rotate(360deg); }
}

.ep-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.badge-blue {
  background: var(--primary-soft);
  color: #164aba;
}

.badge-violet {
  background: var(--violet-soft);
  color: #4a32b0;
}

.badge-green {
  background: var(--green-soft);
  color: #0b6a4e;
}

.badge-amber {
  background: var(--amber-soft);
  color: #94590a;
}

.badge-rose {
  background: #fbe6f0;
  color: #9c2a62;
}

.badge-teal {
  background: #dcf3f8;
  color: #0a6577;
}

/* CATEGORY ROWS */
.ep-row-inactive td {
  color: #8896ab !important;
}

.ep-cat-cell {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 180px;
}

.ep-cat-avatar {
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 14px;
}

.ep-cat-toggle {
  flex: 0 0 25px;
  width: 25px;
  height: 25px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 7px;
  background: #eef2f8;
  color: #4b5b75;
  font-size: 10px;
  cursor: pointer;
}

.ep-cat-toggle:hover {
  background: var(--primary-soft);
  color: var(--primary);
}

.ep-cat-name {
  color: #2a3a55;
  font-size: 13px;
  font-weight: 700;
}

.ep-cat-meta {
  margin-top: 3px;
  color: var(--muted);
  font-size: 11px;
}

.ep-subrow td {
  padding: 0 !important;
  background: #f7f9fd !important;
}

.ep-subtable {
  width: 100%;
  border-collapse: collapse;
}

.ep-subtable td {
  padding: 10px 17px !important;
  border-bottom: 1px solid #edf1f7;
  background: #f7f9fd !important;
  font-size: 12px;
}

.ep-subtable tr:last-child td {
  border-bottom: 0;
}

.ep-subname {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #44546d;
}

.ep-subname i {
  color: #98a6ba;
  font-size: 11px;
}

.ep-subname.inactive span {
  color: #98a6ba;
  text-decoration: line-through;
}

/* ACTION BUTTONS */
.ep-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.btn-icon {
  flex: 0 0 31px;
  width: 31px;
  height: 31px;
  display: grid;
  place-items: center;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: #64748b;
  font-size: 11px;
  cursor: pointer;
  transition: .18s;
}

.btn-icon:hover {
  background: #eef2f8;
}

.btn-edit {
  background: var(--primary-soft);
  color: var(--primary);
  border-color: #c9daff;
}

.btn-edit:hover {
  background: var(--primary);
  color: #fff;
}

.btn-delete {
  background: var(--red-soft);
  color: var(--red);
  border-color: #f6c8cd;
}

.btn-delete:hover {
  background: var(--red);
  color: #fff;
}

.btn-add-sub,
.btn-toggle-on {
  background: var(--green-soft);
  color: var(--green);
  border-color: #bfe8d9;
}

.btn-add-sub:hover,
.btn-toggle-on:hover {
  background: var(--green);
  color: #fff;
}

.btn-toggle-off {
  background: var(--amber-soft);
  color: var(--amber);
  border-color: #f5dcb0;
}

.btn-toggle-off:hover {
  background: var(--amber);
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
  backdrop-filter: blur(5px);
  overflow-y: auto;
}

.ep-modal {
  width: 100%;
  max-width: 460px;
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  background: #fff;
  border: 1px solid rgba(255,255,255,.6);
  border-radius: 17px;
  box-shadow: 0 25px 60px rgba(0,0,0,.22);
  animation: ep-modal-in .18s ease-out;
}

@keyframes ep-modal-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(.99);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.ep-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 17px 20px;
  border-bottom: 1px solid var(--line);
  background: linear-gradient(180deg, #f8faff, #fff);
}

.ep-modal-header h3 {
  margin: 0;
  color: var(--ink);
  font-size: 17px;
  font-weight: 800;
}

.ep-modal-body {
  padding: 21px 20px;
}

.ep-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  padding: 14px 20px;
  background: #f8fafd;
  border-top: 1px solid var(--line);
}

.ep-modal-footer.center {
  justify-content: center;
}

.ep-form-group {
  margin-bottom: 16px;
}

.ep-form-group:last-child {
  margin-bottom: 0;
}

.ep-form-group label {
  display: block;
  margin-bottom: 7px;
  color: #43536b;
  font-size: 12px;
  font-weight: 700;
}

.ep-form-group input,
.ep-form-group select,
.ep-form-group textarea {
  width: 100%;
  min-height: 43px;
  padding: 10px 12px;
  border: 1px solid #d9e1ed;
  border-radius: 9px;
  background: #fbfcfe;
  color: #2a3a55;
  font-family: inherit;
  font-size: 13px;
  outline: none;
  transition: .2s;
}

.ep-form-group input:focus,
.ep-form-group select:focus,
.ep-form-group textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft);
  background: #fff;
}

.ep-form-error {
  margin-bottom: 14px;
  padding: 11px 13px;
  border-radius: 9px;
  background: var(--red-soft);
  color: #a3212e;
  font-size: 12px;
  font-weight: 600;
}

.ep-btn {
  min-height: 38px;
  padding: 9px 17px;
  border: 0;
  border-radius: 9px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: .18s;
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
  background: linear-gradient(135deg, #1f5eea, #347cf0);
  color: #fff;
  box-shadow: 0 4px 10px rgba(31,94,234,.18);
}

.ep-btn-danger {
  background: var(--red);
  color: #fff;
}

.ep-delete-body {
  padding: 27px 22px 12px;
  text-align: center;
}

.ep-delete-icon {
  display: inline-grid;
  place-items: center;
  width: 55px;
  height: 55px;
  margin-bottom: 13px;
  border-radius: 50%;
  background: var(--red-soft);
  color: var(--red);
  font-size: 22px;
}

.ep-delete-body h4 {
  margin: 0 0 8px;
  color: var(--ink);
  font-size: 17px;
  font-weight: 800;
}

.ep-delete-body p {
  margin: 0 0 13px;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.7;
}

/* TABLET */
@media (max-width: 900px) {
  .ep-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .ep-stats .ep-card:last-child {
    grid-column: 1 / -1;
  }

  .ep-filters {
    grid-template-columns: minmax(0, 1fr) minmax(150px, 200px);
  }

  .ep-filters > :last-child {
    grid-column: 1 / -1;
    justify-self: start;
  }
}

/* MOBILE */
@media (max-width: 600px) {
  .expenses-page {
    padding: 11px;
  }

  .ep-hero {
    padding: 17px;
    border-radius: 14px;
  }

  .ep-title h1 {
    font-size: 21px;
  }

  .ep-title-icon {
    width: 37px;
    height: 37px;
    font-size: 17px;
  }

  .ep-hero-actions {
    width: 100%;
  }

  .ep-btn-add {
    flex: 1;
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

  .ep-card-info h3 {
    font-size: 12px;
  }

  .ep-card-info .value {
    font-size: 25px;
  }

  .ep-icon {
    width: 38px;
    height: 38px;
    flex-basis: 38px;
    font-size: 17px;
  }

  .ep-filters {
    grid-template-columns: 1fr;
    padding: 12px;
  }

  .ep-filters > :first-child,
  .ep-filters > :last-child {
    grid-column: auto;
    width: 100%;
  }

  .ep-reset {
    width: 100%;
  }

  .ep-table th,
  .ep-table td {
    padding: 11px 12px;
  }

  .ep-modal-overlay {
    align-items: flex-end;
    padding: 10px;
  }

  .ep-modal {
    max-height: 90vh;
    border-radius: 16px;
  }

  .ep-modal-header,
  .ep-modal-body {
    padding: 16px;
  }

  .ep-modal-footer {
    padding: 12px 16px;
  }

  .ep-btn {
    flex: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ep-spinner {
    animation-duration: 2s;
  }

  .ep-card,
  .ep-btn-add,
  .ep-btn,
  .ep-modal {
    transition: none;
    animation: none;
  }
}

      `}</style>

      {/* En-tête */}
      <header className="ep-hero">
        <div className="ep-title">
          <span className="ep-eyebrow">GESTISTOCK</span>
          <h1>
            <span className="ep-title-icon"><i className="fas fa-tags" /></span>
            {t.title}
          </h1>
          <p>{t.subtitle}</p>
        </div>

        <div className="ep-hero-actions">
          <div className="ep-lang" role="group" aria-label={t.switch_title} title={t.switch_title}>
            <button type="button" className={lang === 'fr' ? 'on' : ''} onClick={() => setLang('fr')} aria-pressed={lang === 'fr'}>FR</button>
            <button type="button" className={lang === 'ar' ? 'on' : ''} onClick={() => setLang('ar')} aria-pressed={lang === 'ar'}>عربية</button>
          </div>
          <button className="ep-btn-add" type="button" onClick={handleOpenCreateCategory}>
            <i className="fas fa-plus" /> {t.add}
          </button>
        </div>
      </header>

      {errorKey && (
        <div className="ep-alert" role="alert">
          <span><i className="fas fa-exclamation-circle" /> &nbsp;{t[errorKey]}</span>
          <button type="button" onClick={fetchCategories}>{t.retry}</button>
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
          <div className="ep-icon"><i className="fas fa-layer-group" /></div>
        </div>
        <div className="ep-card tone-green">
          <div className="ep-card-info">
            <h3>{t.stat_active}</h3>
            <div className="value">{stats.active}</div>
            <div className="sub">{t.active_sub}</div>
          </div>
          <div className="ep-icon"><i className="fas fa-check-circle" /></div>
        </div>
        <div className="ep-card tone-amber">
          <div className="ep-card-info">
            <h3>{t.stat_subs}</h3>
            <div className="value">{stats.subs}</div>
            <div className="sub">{t.subs_sub}</div>
          </div>
          <div className="ep-icon"><i className="fas fa-sitemap" /></div>
        </div>
      </section>

      {/* Panneau */}
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
          <select
            className="ep-filter-input"
            aria-label={t.th_status}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">{t.all_status}</option>
            <option value="active">{t.status_active}</option>
            <option value="inactive">{t.status_inactive}</option>
          </select>
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
                <th>{t.th_subs}</th>
                <th>{t.th_status}</th>
                <th className="ep-col-end">{t.th_actions}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="ep-state"><span className="ep-spinner" />{t.loading}</td></tr>
              ) : filteredCategories.length === 0 ? (
                <tr><td colSpan="4" className="ep-state">{t.none}</td></tr>
              ) : (
                filteredCategories.map((cat) => {
                  const subs = cat.sous_categories || [];
                  const hasSubs = subs.length > 0;
                  const isOpen = !!expanded[cat.id];
                  const isInactive = cat.status === 'inactive';
                  const subCount = subs.length;

                  return (
                    <React.Fragment key={cat.id}>
                      <tr className={isInactive ? 'ep-row-inactive' : ''}>
                        <td>
                          <div className="ep-cat-cell">
                            {hasSubs ? (
                              <button
                                type="button"
                                className="ep-cat-toggle"
                                onClick={() => toggleExpand(cat.id)}
                                aria-expanded={isOpen}
                                aria-label={isOpen ? 'Réduire' : 'Développer'}
                              >
                                <i className={`fas fa-chevron-${isOpen ? 'down' : 'right'}`} />
                              </button>
                            ) : (
                              <span style={{ width: '26px', display: 'inline-block' }} />
                            )}
                            <div className="ep-cat-avatar"><i className="fas fa-tag" /></div>
                            <div>
                              <div className="ep-cat-name">{cat.name}</div>
                              {hasSubs && (
                                <div className="ep-cat-meta">{t.sub_count(subCount)}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          {hasSubs ? (
                            <span className={`ep-badge badge-${toneFor(cat.name || '')}`}>
                              <i className="fas fa-sitemap" style={{ marginInlineEnd: 6 }} />
                              {subCount}
                            </span>
                          ) : (
                            <span style={{ color: '#98a6ba', fontSize: 12 }}>{t.no_subs}</span>
                          )}
                        </td>
                        <td>
                          <span className={`ep-badge ${isInactive ? 'badge-rose' : 'badge-green'}`}>
                            <i className="fas fa-circle" style={{ fontSize: 6, marginInlineEnd: 6 }} />
                            {isInactive ? t.inactive : t.active}
                          </span>
                        </td>
                        <td className="ep-col-end">
                          <div className="ep-actions">
                            <button
                              type="button"
                              className="btn-icon btn-add-sub"
                              onClick={() => handleAddSubCategory(cat)}
                              title={t.add_sub_title}
                              aria-label={t.add_sub_title}
                            >
                              <i className="fas fa-plus" />
                            </button>
                            <button
                              type="button"
                              className={`btn-icon ${isInactive ? 'btn-toggle-on' : 'btn-toggle-off'}`}
                              onClick={() => handleToggleStatus(cat, 'category')}
                              title={isInactive ? t.toggle_on : t.toggle_off}
                              aria-label={isInactive ? t.toggle_on : t.toggle_off}
                            >
                              <i className={`fas fa-${isInactive ? 'play' : 'pause'}`} />
                            </button>
                            <button
                              type="button"
                              className="btn-icon btn-edit"
                              onClick={() => handleOpenEditCategory(cat)}
                              title={t.edit}
                              aria-label={t.edit}
                            >
                              <i className="fas fa-edit" />
                            </button>
                            <button
                              type="button"
                              className="btn-icon btn-delete"
                              onClick={() => handleDeleteCategory(cat)}
                              title={t.delete}
                              aria-label={t.delete}
                            >
                              <i className="fas fa-trash-alt" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {hasSubs && isOpen && (
                        <tr className="ep-subrow">
                          <td colSpan="4">
                            <table className="ep-subtable">
                              <tbody>
                                {subs.map((sub) => {
                                  const subInactive = sub.status === 'inactive';
                                  return (
                                    <tr key={sub.id}>
                                      <td style={{ width: '55%' }}>
                                        <div className={`ep-subname ${subInactive ? 'inactive' : ''}`}>
                                          <i className="fas fa-level-up-alt" style={{ transform: 'rotate(90deg)' }} />
                                          <span>{sub.name}</span>
                                        </div>
                                      </td>
                                      <td style={{ width: '20%' }}>
                                        <span className={`ep-badge ${subInactive ? 'badge-rose' : 'badge-green'}`}>
                                          <i className="fas fa-circle" style={{ fontSize: 6, marginInlineEnd: 6 }} />
                                          {subInactive ? t.inactive : t.active}
                                        </span>
                                      </td>
                                      <td className="ep-col-end">
                                        <div className="ep-actions">
                                          <button
                                            type="button"
                                            className={`btn-icon ${subInactive ? 'btn-toggle-on' : 'btn-toggle-off'}`}
                                            onClick={() => handleToggleStatus(sub, 'subcategory')}
                                            title={subInactive ? t.toggle_on : t.toggle_off}
                                            aria-label={subInactive ? t.toggle_on : t.toggle_off}
                                          >
                                            <i className={`fas fa-${subInactive ? 'play' : 'pause'}`} />
                                          </button>
                                          <button
                                            type="button"
                                            className="btn-icon btn-edit"
                                            onClick={() => handleOpenEditSub(sub)}
                                            title={t.edit}
                                            aria-label={t.edit}
                                          >
                                            <i className="fas fa-edit" />
                                          </button>
                                          <button
                                            type="button"
                                            className="btn-icon btn-delete"
                                            onClick={() => handleDeleteSub(sub)}
                                            title={t.delete}
                                            aria-label={t.delete}
                                          >
                                            <i className="fas fa-trash-alt" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
              <h3 id="ep-form-title">
                {modalType === 'subcategory'
                  ? (currentSub ? t.modal_edit_sub : t.modal_new_sub)
                  : (currentCategory ? t.modal_edit_cat : t.modal_new_cat)}
              </h3>
              <button type="button" className="btn-icon" onClick={closeModals} aria-label={t.close}>
                <i className="fas fa-times" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="ep-modal-body">
                {formErrorKey && <div className="ep-form-error" role="alert">{t[formErrorKey]}</div>}

                <div className="ep-form-group">
                  <label htmlFor="ep-name">
                    {modalType === 'subcategory' ? t.f_name_sub : t.f_name_cat}
                  </label>
                  <input
                    id="ep-name"
                    type="text"
                    required
                    placeholder={modalType === 'subcategory' ? t.f_name_sub_ph : t.f_name_cat_ph}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                {modalType === 'subcategory' && (
                  <div className="ep-form-group">
                    <label htmlFor="ep-parent">{t.f_parent}</label>
                    <select
                      id="ep-parent"
                      required
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    >
                      <option value="">{t.f_parent_ph}</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="ep-form-group">
                  <label htmlFor="ep-status">{t.f_status}</label>
                  <select
                    id="ep-status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="active">{t.active}</option>
                    <option value="inactive">{t.inactive}</option>
                  </select>
                </div>
              </div>
              <div className="ep-modal-footer">
                <button type="button" className="ep-btn ep-btn-cancel" onClick={closeModals}>{t.cancel}</button>
                <button type="submit" className="ep-btn ep-btn-save" disabled={saving}>
                  {saving ? t.saving : t.save}
                </button>
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
              <h4 id="ep-delete-title">
                {modalType === 'subcategory' ? t.delete_sub_title : t.delete_cat_title}
              </h4>
              <p>{t.delete_warn}</p>
              {modalType === 'category' && currentCategory?.sous_categories?.length > 0 && (
                <div className="ep-form-error" style={{ background: 'var(--amber-soft)', color: '#94590a' }}>
                  <i className="fas fa-exclamation-circle" style={{ marginInlineEnd: 6 }} />
                  {t.delete_sub_warn(currentCategory.sous_categories.length)}
                </div>
              )}
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

export default CategoriesPage;