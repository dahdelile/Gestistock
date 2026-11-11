// src/pages/CategoriesPage.jsx
// Version bilingue Français / العربية (RTL) — liste des sous-catégories + filtre par catégorie
import React, { useState, useEffect, useMemo } from 'react';
import { categoriesApi } from '../../api';

/* =========================================================
   TRADUCTIONS / الترجمة
========================================================= */

const I18N = {
  fr: {
    dir: 'ltr',
    title: 'Gestion des catégories',
    subtitle: 'Organisez vos catégories et sous-catégories de produits.',
    add: 'Nouvelle catégorie',
    add_sub: 'Nouvelle sous-catégorie',
    stat_total: 'Total des catégories',
    records: (n) => `${n} catégorie(s)`,
    stat_active: 'Catégories actives',
    active_sub: 'Visibles dans le catalogue',
    stat_subs: 'Sous-catégories',
    subs_sub: 'Rattachées aux catégories',
    tab_cats: 'Catégories',
    tab_subs: 'Sous-catégories',
    search_ph: 'Rechercher...',
    filter_category: 'Catégorie',
    all_categories: 'Toutes les catégories',
    all_status: 'Tous les statuts',
    status_active: '✓ Actifs uniquement',
    status_inactive: '✗ Inactifs uniquement',
    reset: 'Réinitialiser',
    results_cats: (n) => `${n} catégorie(s)`,
    results_subs: (n) => `${n} sous-catégorie(s)`,
    th_name: 'Nom',
    th_subs: 'Sous-catégories',
    th_sub_name: 'Sous-catégorie',
    th_parent: 'Catégorie parente',
    th_status: 'Statut',
    th_actions: 'Actions',
    loading: 'Chargement...',
    none: 'Aucune catégorie trouvée.',
    none_subs: 'Aucune sous-catégorie trouvée.',
    active: 'Actif',
    inactive: 'Inactif',
    no_subs: 'Aucune',
    sub_count: (n) => `${n} sous-catégorie(s)`,
    view_subs: 'Voir les sous-catégories',
    edit: 'Modifier',
    delete: 'Supprimer',
    add_sub_title: 'Ajouter une sous-catégorie',
    toggle_on: 'Activer',
    toggle_off: 'Désactiver',
    expand: 'Développer',
    collapse: 'Réduire',
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
    title: 'إدارة الفئات',
    subtitle: 'نظّم فئات منتجاتك وفئاتها الفرعية.',
    add: 'فئة جديدة',
    add_sub: 'فئة فرعية جديدة',
    stat_total: 'إجمالي الفئات',
    records: (n) => `${n} فئة`,
    stat_active: 'الفئات النشطة',
    active_sub: 'ظاهرة في الكتالوج',
    stat_subs: 'الفئات الفرعية',
    subs_sub: 'مرتبطة بالفئات',
    tab_cats: 'الفئات',
    tab_subs: 'الفئات الفرعية',
    search_ph: 'بحث...',
    filter_category: 'الفئة',
    all_categories: 'كل الفئات',
    all_status: 'كل الحالات',
    status_active: '✓ النشطة فقط',
    status_inactive: '✗ غير النشطة فقط',
    reset: 'إعادة تعيين',
    results_cats: (n) => `${n} فئة`,
    results_subs: (n) => `${n} فئة فرعية`,
    th_name: 'الاسم',
    th_subs: 'الفئات الفرعية',
    th_sub_name: 'الفئة الفرعية',
    th_parent: 'الفئة الأم',
    th_status: 'الحالة',
    th_actions: 'إجراءات',
    loading: 'جارٍ التحميل...',
    none: 'لا توجد فئات.',
    none_subs: 'لا توجد فئات فرعية.',
    active: 'نشط',
    inactive: 'غير نشط',
    no_subs: 'لا يوجد',
    sub_count: (n) => `${n} فئة فرعية`,
    view_subs: 'عرض الفئات الفرعية',
    edit: 'تعديل',
    delete: 'حذف',
    add_sub_title: 'إضافة فئة فرعية',
    toggle_on: 'تنشيط',
    toggle_off: 'إلغاء التنشيط',
    expand: 'توسيع',
    collapse: 'طيّ',
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

  // Vue + filtres
  const [view, setView] = useState('categories'); // 'categories' | 'subs'
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all'); // id de catégorie (string) ou 'all'

  // Sous-catégories dépliées (vue Catégories)
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

  // categoryId optionnel : présélectionne la catégorie parente
  const handleAddSubCategory = (categoryId = '') => {
    setModalType('subcategory');
    setCurrentCategory(null);
    setCurrentSub(null);
    setFormData({ name: '', category_id: categoryId, status: 'active' });
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
        if (String(currentCategory.id) === filterCategory) setFilterCategory('all');
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

  // Depuis la vue Catégories : ouvrir la liste des sous-catégories de cette catégorie
  const openSubsOf = (cat) => {
    setFilterCategory(String(cat.id));
    setSearch('');
    setFilterStatus('all');
    setView('subs');
  };

  /* ---------- Filtrage et statistiques ---------- */
  const needle = search.trim().toLowerCase();

  const filteredCategories = useMemo(
    () =>
      categories
        .filter((c) => {
          const matchSearch =
            !needle ||
            (c.name || '').toLowerCase().includes(needle) ||
            c.sous_categories?.some((s) => (s.name || '').toLowerCase().includes(needle));
          const matchStatus = filterStatus === 'all' || c.status === filterStatus;
          const matchCategory = filterCategory === 'all' || String(c.id) === filterCategory;
          return matchSearch && matchStatus && matchCategory;
        })
        .sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [categories, needle, filterStatus, filterCategory]
  );

  // Liste à plat de toutes les sous-catégories, avec leur catégorie parente
  const allSubs = useMemo(
    () =>
      categories.flatMap((cat) =>
        (cat.sous_categories || []).map((sub) => ({ ...sub, parent: cat }))
      ),
    [categories]
  );

  const filteredSubs = useMemo(
    () =>
      allSubs
        .filter((s) => {
          const matchSearch =
            !needle ||
            (s.name || '').toLowerCase().includes(needle) ||
            (s.parent?.name || '').toLowerCase().includes(needle);
          const matchStatus = filterStatus === 'all' || s.status === filterStatus;
          const matchCategory = filterCategory === 'all' || String(s.parent?.id) === filterCategory;
          return matchSearch && matchStatus && matchCategory;
        })
        .sort(
          (a, b) =>
            (a.parent?.name || '').localeCompare(b.parent?.name || '') ||
            (a.name || '').localeCompare(b.name || '')
        ),
    [allSubs, needle, filterStatus, filterCategory]
  );

  const stats = useMemo(() => {
    const total = categories.length;
    const active = categories.filter((c) => c.status === 'active').length;
    return { total, active, subs: allSubs.length };
  }, [categories, allSubs]);

  const sortedCategoryOptions = useMemo(
    () => [...categories].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [categories]
  );

  const hasFilters = Boolean(search || filterStatus !== 'all' || filterCategory !== 'all');
  const resetFilters = () => {
    setSearch('');
    setFilterStatus('all');
    setFilterCategory('all');
  };

  const colCount = 4;

  /* =======================================================
     AFFICHAGE
  ======================================================= */

  const renderActions = (item, type) => (
    <div className="ep-actions">
      {type === 'category' && (
        <button
          type="button"
          className="btn-icon btn-add-sub"
          onClick={() => handleAddSubCategory(item.id)}
          title={t.add_sub_title}
          aria-label={t.add_sub_title}
        >
          <i className="fas fa-plus" />
        </button>
      )}
      <button
        type="button"
        className={`btn-icon ${item.status === 'inactive' ? 'btn-toggle-on' : 'btn-toggle-off'}`}
        onClick={() => handleToggleStatus(item, type)}
        title={item.status === 'inactive' ? t.toggle_on : t.toggle_off}
        aria-label={item.status === 'inactive' ? t.toggle_on : t.toggle_off}
      >
        <i className={`fas fa-${item.status === 'inactive' ? 'play' : 'pause'}`} />
      </button>
      <button
        type="button"
        className="btn-icon btn-edit"
        onClick={() => (type === 'category' ? handleOpenEditCategory(item) : handleOpenEditSub(item))}
        title={t.edit}
        aria-label={t.edit}
      >
        <i className="fas fa-edit" />
      </button>
      <button
        type="button"
        className="btn-icon btn-delete"
        onClick={() => (type === 'category' ? handleDeleteCategory(item) : handleDeleteSub(item))}
        title={t.delete}
        aria-label={t.delete}
      >
        <i className="fas fa-trash-alt" />
      </button>
    </div>
  );

  const statusBadge = (status) => (
    <span className={`ep-badge ${status === 'inactive' ? 'badge-rose' : 'badge-green'}`}>
      <i className="fas fa-circle" style={{ fontSize: 6 }} />
      {status === 'inactive' ? t.inactive : t.active}
    </span>
  );

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
  --primary: #2563eb;  --primary-soft: #eaf1ff;
  --green: #0f9d74;    --green-soft: #e1f6ee;
  --violet: #7054d8;   --violet-soft: #eeeaff;
  --amber: #d99013;    --amber-soft: #fff4df;
  --red: #dc4654;      --red-soft: #ffeaec;
  --teal: #0e8fa8;
  --rose: #c2417c;

  /* Échelle typographique responsive */
  --fs-xs:  clamp(11px, 0.70vw + 9px,  13px);
  --fs-sm:  clamp(12px, 0.75vw + 10px, 14px);
  --fs-md:  clamp(13px, 0.80vw + 11px, 15px);
  --fs-lg:  clamp(15px, 0.90vw + 12px, 18px);
  --fs-2xl: clamp(20px, 1.80vw + 14px, 28px);

  min-height: 100vh;
  padding: clamp(10px, 2vw, 26px);
  background: radial-gradient(900px 300px at 100% -80px, rgba(37,99,235,.07), transparent 70%), var(--bg);
  color: var(--ink);
  font-family: Inter, "Segoe UI", system-ui, Arial, sans-serif;
  font-size: var(--fs-md);
  -webkit-text-size-adjust: 100%;
}
.expenses-page[lang="ar"] { font-family: Cairo, Tahoma, Arial, sans-serif; line-height: 1.6; }
.expenses-page * { box-sizing: border-box; }
.expenses-page button, .expenses-page input, .expenses-page select { font-family: inherit; }
.expenses-page button:focus-visible, .expenses-page input:focus-visible, .expenses-page select:focus-visible {
  outline: 3px solid rgba(37,99,235,.25); outline-offset: 2px;
}

/* HEADER */
.ep-hero {
  position: relative; isolation: isolate; overflow: hidden;
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;
  padding: clamp(16px, 2.5vw, 28px); margin-bottom: 20px; border-radius: 18px; color: #fff;
  background: linear-gradient(125deg, #102f65, #2058c5 60%, #2698cf);
  box-shadow: 0 10px 28px rgba(21,74,170,.16);
}
.ep-hero::after { content: ""; position: absolute; z-index: -1; width: 230px; height: 230px; inset-inline-end: -75px; top: -120px; border: 28px solid rgba(255,255,255,.08); border-radius: 50%; }
.ep-eyebrow { font-size: var(--fs-xs); font-weight: 800; letter-spacing: 1.5px; opacity: .78; }
.ep-title h1 { display: flex; align-items: center; gap: 11px; margin: 7px 0 5px; font-size: var(--fs-2xl); font-weight: 800; line-height: 1.3; }
.ep-title-icon { display: inline-grid; place-items: center; flex: 0 0 auto; width: clamp(34px, 4vw, 42px); height: clamp(34px, 4vw, 42px); border-radius: 12px; background: rgba(255,255,255,.16); font-size: var(--fs-lg); }
.ep-title p { margin: 0; color: rgba(255,255,255,.82); font-size: var(--fs-sm); }
.ep-hero-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 9px; }
.ep-lang { display: inline-flex; padding: 3px; border-radius: 10px; background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.24); }
.ep-lang button { border: 0; padding: 7px 12px; border-radius: 7px; background: transparent; color: #fff; font-size: var(--fs-xs); font-weight: 800; cursor: pointer; }
.ep-lang button.on { background: #fff; color: #174078; }
.ep-btn-add { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 16px; border: 0; border-radius: 10px; background: #fff; color: #174078; font-size: var(--fs-sm); font-weight: 700; cursor: pointer; box-shadow: 0 5px 14px rgba(0,0,0,.12); transition: .2s; }
.ep-btn-add:hover { transform: translateY(-2px); }
.ep-btn-add.alt { background: rgba(255,255,255,.14); color: #fff; border: 1px solid rgba(255,255,255,.4); box-shadow: none; }

/* ALERT */
.ep-alert { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; padding: 12px 15px; border: 1px solid #f5c6cb; border-radius: 10px; background: var(--red-soft); color: #a3212e; font-size: var(--fs-sm); }
.ep-alert button { border: 0; padding: 7px 12px; border-radius: 7px; background: #fff; color: #a3212e; font-size: var(--fs-xs); font-weight: 700; cursor: pointer; }

/* STATS */
.ep-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-bottom: 20px; }
.ep-card { position: relative; overflow: hidden; display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; min-width: 0; padding: clamp(13px, 1.6vw, 17px); background: var(--card); border: 1px solid var(--line); border-inline-start: 4px solid var(--accent); border-radius: 14px; box-shadow: 0 3px 12px rgba(20,33,61,.035); transition: transform .2s, box-shadow .2s; }
.ep-card:hover { transform: translateY(-2px); box-shadow: 0 9px 20px rgba(20,33,61,.07); }
.ep-card::after { content: ""; position: absolute; inset-inline-end: -28px; bottom: -40px; width: 100px; height: 100px; border-radius: 50%; background: var(--accent-soft); opacity: .65; }
.ep-card-info { position: relative; z-index: 1; min-width: 0; }
.ep-card-info h3 { margin: 0 0 7px; color: var(--muted); font-size: var(--fs-sm); font-weight: 700; }
.ep-card-info .value { color: var(--ink); font-size: var(--fs-2xl); font-weight: 800; line-height: 1.2; }
.ep-card-info .sub { margin-top: 5px; color: var(--accent); font-size: var(--fs-xs); font-weight: 600; }
.ep-icon { position: relative; z-index: 1; flex: 0 0 auto; width: clamp(36px, 3.5vw, 42px); height: clamp(36px, 3.5vw, 42px); display: grid; place-items: center; border-radius: 12px; background: var(--accent-soft); color: var(--accent); font-size: var(--fs-lg); }
.tone-amber  { --accent: var(--amber);   --accent-soft: var(--amber-soft); }
.tone-violet { --accent: var(--violet);  --accent-soft: var(--violet-soft); }
.tone-blue   { --accent: var(--primary); --accent-soft: var(--primary-soft); }
.tone-green  { --accent: var(--green);   --accent-soft: var(--green-soft); }

/* PANEL */
.ep-panel { overflow: hidden; background: var(--card); border: 1px solid var(--line); border-radius: 15px; box-shadow: 0 3px 12px rgba(20,33,61,.035); }

/* TABS */
.ep-tabs { display: flex; gap: 6px; padding: 12px 17px 0; background: #fbfcff; border-bottom: 1px solid var(--line); overflow-x: auto; }
.ep-tab { display: inline-flex; align-items: center; gap: 8px; padding: 10px 14px; border: 0; border-bottom: 3px solid transparent; background: transparent; color: var(--muted); font-size: var(--fs-sm); font-weight: 700; cursor: pointer; white-space: nowrap; margin-bottom: -1px; }
.ep-tab:hover { color: var(--primary); }
.ep-tab.on { color: var(--primary); border-bottom-color: var(--primary); }
.ep-tab .count { padding: 2px 8px; border-radius: 999px; background: #eef2f8; color: #4b5b75; font-size: var(--fs-xs); font-weight: 800; }
.ep-tab.on .count { background: var(--primary-soft); color: var(--primary); }

/* FILTERS */
.ep-filters { display: grid; grid-template-columns: minmax(180px, 1.3fr) minmax(170px, 1fr) minmax(160px, 1fr) auto; align-items: center; gap: 10px; padding: 14px 17px; background: #fbfcff; border-bottom: 1px solid var(--line); }
.ep-filter-input { width: 100%; min-width: 0; height: 42px; padding: 0 12px; border: 1px solid #dce3ed; border-radius: 9px; background: #fff; color: #2a3a55; font-size: max(16px, var(--fs-md)); outline: none; transition: .2s; }
.ep-filter-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); }
.ep-reset { height: 42px; padding: 0 13px; border: 1px solid var(--line); border-radius: 9px; background: #fff; color: #4b5b75; font-size: var(--fs-sm); font-weight: 700; cursor: pointer; white-space: nowrap; }
.ep-reset:hover { background: #f1f5fb; }
.ep-resultbar { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; padding: 10px 17px; border-bottom: 1px solid var(--line); background: #fff; font-size: var(--fs-sm); color: var(--muted); }
.ep-resultbar strong { color: var(--ink); }
.ep-chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 6px 4px 10px; border-radius: 999px; background: var(--primary-soft); color: var(--primary); font-size: var(--fs-xs); font-weight: 800; }
.ep-chip button { border: 0; width: 20px; height: 20px; border-radius: 50%; background: rgba(37,99,235,.15); color: var(--primary); font-size: 10px; cursor: pointer; display: grid; place-items: center; }

/* TABLE */
.ep-table-wrap { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
.ep-table { width: 100%; min-width: 620px; border-collapse: collapse; }
.ep-table th { padding: 13px 17px; background: #f5f7fb; color: #5b6b85; text-align: start; font-size: var(--fs-xs); font-weight: 800; letter-spacing: .2px; border-bottom: 1px solid var(--line); white-space: nowrap; }
.ep-table td { padding: 12px 17px; border-bottom: 1px solid #eff2f7; color: #44546d; font-size: var(--fs-sm); vertical-align: middle; }
.ep-table tbody tr:nth-child(even) td { background: #fbfcfe; }
.ep-table tbody tr:hover td { background: #f1f5ff; }
.ep-table tr:last-child td { border-bottom: 0; }
.ep-col-end { text-align: end !important; }
.ep-state { padding: 38px 18px !important; text-align: center; color: #8896ab !important; font-size: var(--fs-sm) !important; }
.ep-spinner { display: inline-block; width: 20px; height: 20px; margin-inline-end: 9px; vertical-align: middle; border: 3px solid #dbeafe; border-top-color: var(--primary); border-radius: 50%; animation: ep-spin .75s linear infinite; }
@keyframes ep-spin { to { transform: rotate(360deg); } }

.ep-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 9px; border-radius: 999px; font-size: var(--fs-xs); font-weight: 700; white-space: nowrap; }
button.ep-badge { border: 0; cursor: pointer; }
button.ep-badge:hover { filter: brightness(.95); }
.badge-blue   { background: var(--primary-soft); color: #164aba; }
.badge-violet { background: var(--violet-soft);  color: #4a32b0; }
.badge-green  { background: var(--green-soft);   color: #0b6a4e; }
.badge-amber  { background: var(--amber-soft);   color: #94590a; }
.badge-rose   { background: #fbe6f0; color: #9c2a62; }
.badge-teal   { background: #dcf3f8; color: #0a6577; }

/* ROWS */
.ep-row-inactive td { color: #8896ab !important; }
.ep-cat-cell { display: flex; align-items: center; gap: 9px; min-width: 180px; }
.ep-cat-avatar { flex: 0 0 34px; width: 34px; height: 34px; display: grid; place-items: center; border-radius: 9px; background: var(--primary-soft); color: var(--primary); font-size: var(--fs-sm); }
.ep-cat-avatar.sub { background: var(--amber-soft); color: var(--amber); }
.ep-cat-toggle { flex: 0 0 26px; width: 26px; height: 26px; display: grid; place-items: center; border: 0; border-radius: 7px; background: #eef2f8; color: #4b5b75; font-size: 10px; cursor: pointer; }
.ep-cat-toggle:hover { background: var(--primary-soft); color: var(--primary); }
.ep-cat-name { color: #2a3a55; font-size: var(--fs-md); font-weight: 700; }
.ep-cat-meta { margin-top: 3px; color: var(--muted); font-size: var(--fs-xs); }
.ep-subrow td { padding: 0 !important; background: #f7f9fd !important; }
.ep-subtable { width: 100%; border-collapse: collapse; }
.ep-subtable td { padding: 10px 17px !important; border-bottom: 1px solid #edf1f7; background: #f7f9fd !important; font-size: var(--fs-xs); }
.ep-subtable tr:last-child td { border-bottom: 0; }
.ep-subname { display: flex; align-items: center; gap: 9px; color: #44546d; font-size: var(--fs-sm); }
.ep-subname i { color: #98a6ba; font-size: 11px; }
.ep-subname.inactive span { color: #98a6ba; text-decoration: line-through; }

/* ACTIONS */
.ep-actions { display: flex; justify-content: flex-end; align-items: center; gap: 6px; white-space: nowrap; }
.btn-icon { flex: 0 0 34px; width: 34px; height: 34px; display: grid; place-items: center; border: 1px solid transparent; border-radius: 8px; background: transparent; color: #64748b; font-size: var(--fs-xs); cursor: pointer; transition: .18s; }
.btn-icon:hover { background: #eef2f8; }
.btn-edit { background: var(--primary-soft); color: var(--primary); border-color: #c9daff; }
.btn-edit:hover { background: var(--primary); color: #fff; }
.btn-delete { background: var(--red-soft); color: var(--red); border-color: #f6c8cd; }
.btn-delete:hover { background: var(--red); color: #fff; }
.btn-add-sub, .btn-toggle-on { background: var(--green-soft); color: var(--green); border-color: #bfe8d9; }
.btn-add-sub:hover, .btn-toggle-on:hover { background: var(--green); color: #fff; }
.btn-toggle-off { background: var(--amber-soft); color: var(--amber); border-color: #f5dcb0; }
.btn-toggle-off:hover { background: var(--amber); color: #fff; }

/* MODALS */
.ep-modal-overlay { position: fixed; inset: 0; z-index: 1050; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(15,23,42,.58); backdrop-filter: blur(5px); overflow-y: auto; }
.ep-modal { width: 100%; max-width: 460px; max-height: calc(100vh - 32px); overflow-y: auto; background: #fff; border-radius: 17px; box-shadow: 0 25px 60px rgba(0,0,0,.22); animation: ep-modal-in .18s ease-out; }
@keyframes ep-modal-in { from { opacity: 0; transform: translateY(8px) scale(.99); } to { opacity: 1; transform: none; } }
.ep-modal-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 20px; border-bottom: 1px solid var(--line); background: linear-gradient(180deg, #f8faff, #fff); }
.ep-modal-header h3 { margin: 0; color: var(--ink); font-size: var(--fs-lg); font-weight: 800; }
.ep-modal-body { padding: 20px; }
.ep-modal-footer { display: flex; justify-content: flex-end; gap: 9px; padding: 14px 20px; background: #f8fafd; border-top: 1px solid var(--line); }
.ep-modal-footer.center { justify-content: center; }
.ep-form-group { margin-bottom: 16px; }
.ep-form-group:last-child { margin-bottom: 0; }
.ep-form-group label { display: block; margin-bottom: 7px; color: #43536b; font-size: var(--fs-xs); font-weight: 700; }
.ep-form-group input, .ep-form-group select { width: 100%; min-height: 43px; padding: 10px 12px; border: 1px solid #d9e1ed; border-radius: 9px; background: #fbfcfe; color: #2a3a55; font-size: max(16px, var(--fs-md)); outline: none; transition: .2s; }
.ep-form-group input:focus, .ep-form-group select:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); background: #fff; }
.ep-form-error { margin-bottom: 14px; padding: 11px 13px; border-radius: 9px; background: var(--red-soft); color: #a3212e; font-size: var(--fs-xs); font-weight: 600; }
.ep-btn { min-height: 40px; padding: 9px 17px; border: 0; border-radius: 9px; font-size: var(--fs-sm); font-weight: 700; cursor: pointer; transition: .18s; }
.ep-btn:hover:not(:disabled) { filter: brightness(.96); transform: translateY(-1px); }
.ep-btn:disabled { opacity: .6; cursor: not-allowed; }
.ep-btn-cancel { background: #e8edf5; color: #44546d; }
.ep-btn-save { background: linear-gradient(135deg, #1f5eea, #347cf0); color: #fff; box-shadow: 0 4px 10px rgba(31,94,234,.18); }
.ep-btn-danger { background: var(--red); color: #fff; }
.ep-delete-body { padding: 27px 22px 12px; text-align: center; }
.ep-delete-icon { display: inline-grid; place-items: center; width: 55px; height: 55px; margin-bottom: 13px; border-radius: 50%; background: var(--red-soft); color: var(--red); font-size: 22px; }
.ep-delete-body h4 { margin: 0 0 8px; color: var(--ink); font-size: var(--fs-lg); font-weight: 800; }
.ep-delete-body p { margin: 0 0 13px; color: var(--muted); font-size: var(--fs-sm); line-height: 1.7; }

/* TABLET */
@media (max-width: 1000px) {
  .ep-filters { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ep-filters > :first-child { grid-column: 1 / -1; }
  .ep-filters > :last-child { justify-self: start; }
}
@media (max-width: 900px) {
  .ep-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ep-stats .ep-card:last-child { grid-column: 1 / -1; }
}

/* MOBILE */
@media (max-width: 600px) {
  .expenses-page { padding: 10px; }
  .ep-hero { border-radius: 14px; }
  .ep-hero-actions { width: 100%; }
  .ep-btn-add { flex: 1; }
  .ep-stats { grid-template-columns: 1fr; gap: 10px; }
  .ep-stats .ep-card:last-child { grid-column: auto; }
  .ep-tabs { padding: 10px 10px 0; }
  .ep-tab { flex: 1; justify-content: center; }
  .ep-filters { grid-template-columns: 1fr; padding: 12px; }
  .ep-filters > :last-child { justify-self: stretch; }
  .ep-reset { width: 100%; }
  .ep-resultbar { padding: 10px 12px; }
  .ep-table th, .ep-table td { padding: 11px 12px; }
  .ep-modal-overlay { align-items: flex-end; padding: 10px; }
  .ep-modal { max-height: 90vh; border-radius: 16px; }
  .ep-modal-header, .ep-modal-body { padding: 16px; }
  .ep-modal-footer { padding: 12px 16px; }
  .ep-modal-footer .ep-btn { flex: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .ep-spinner { animation-duration: 2s; }
  .ep-card, .ep-btn-add, .ep-btn, .ep-modal { transition: none; animation: none; }
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
          <button className="ep-btn-add alt" type="button" onClick={() => handleAddSubCategory(filterCategory !== 'all' ? filterCategory : '')}>
            <i className="fas fa-sitemap" /> {t.add_sub}
          </button>
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
        {/* Onglets */}
        <div className="ep-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={view === 'categories'} className={`ep-tab ${view === 'categories' ? 'on' : ''}`} onClick={() => setView('categories')}>
            <i className="fas fa-tags" /> {t.tab_cats} <span className="count">{stats.total}</span>
          </button>
          <button type="button" role="tab" aria-selected={view === 'subs'} className={`ep-tab ${view === 'subs' ? 'on' : ''}`} onClick={() => setView('subs')}>
            <i className="fas fa-sitemap" /> {t.tab_subs} <span className="count">{stats.subs}</span>
          </button>
        </div>

        {/* Filtres */}
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
            aria-label={t.filter_category}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">{t.all_categories}</option>
            {sortedCategoryOptions.map((c) => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </select>
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

        {/* Barre de résultats */}
        <div className="ep-resultbar">
          <span>
            <strong>{view === 'subs' ? filteredSubs.length : filteredCategories.length}</strong>{' '}
            {view === 'subs' ? t.tab_subs.toLowerCase() : t.tab_cats.toLowerCase()}
          </span>
          {filterCategory !== 'all' && (
            <span className="ep-chip">
              <i className="fas fa-tag" />
              {categories.find((c) => String(c.id) === filterCategory)?.name}
              <button type="button" onClick={() => setFilterCategory('all')} aria-label={t.reset}>
                <i className="fas fa-times" />
              </button>
            </span>
          )}
        </div>

        {/* ===== Vue : Sous-catégories (liste à plat) ===== */}
        {view === 'subs' && (
          <div className="ep-table-wrap">
            <table className="ep-table">
              <thead>
                <tr>
                  <th>{t.th_sub_name}</th>
                  <th>{t.th_parent}</th>
                  <th>{t.th_status}</th>
                  <th className="ep-col-end">{t.th_actions}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={colCount} className="ep-state"><span className="ep-spinner" />{t.loading}</td></tr>
                ) : filteredSubs.length === 0 ? (
                  <tr><td colSpan={colCount} className="ep-state">{t.none_subs}</td></tr>
                ) : (
                  filteredSubs.map((sub) => (
                    <tr key={sub.id} className={sub.status === 'inactive' ? 'ep-row-inactive' : ''}>
                      <td>
                        <div className="ep-cat-cell">
                          <div className="ep-cat-avatar sub"><i className="fas fa-sitemap" /></div>
                          <div className="ep-cat-name">{sub.name}</div>
                        </div>
                      </td>
                      <td>
                        <span className={`ep-badge badge-${toneFor(sub.parent?.name || '')}`}>
                          <i className="fas fa-tag" />
                          {sub.parent?.name}
                        </span>
                      </td>
                      <td>{statusBadge(sub.status)}</td>
                      <td className="ep-col-end">{renderActions(sub, 'subcategory')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ===== Vue : Catégories ===== */}
        {view === 'categories' && (
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
                  <tr><td colSpan={colCount} className="ep-state"><span className="ep-spinner" />{t.loading}</td></tr>
                ) : filteredCategories.length === 0 ? (
                  <tr><td colSpan={colCount} className="ep-state">{t.none}</td></tr>
                ) : (
                  filteredCategories.map((cat) => {
                    const subs = cat.sous_categories || [];
                    const hasSubs = subs.length > 0;
                    const isOpen = !!expanded[cat.id];
                    const isInactive = cat.status === 'inactive';

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
                                  aria-label={isOpen ? t.collapse : t.expand}
                                >
                                  <i className={`fas fa-chevron-${isOpen ? 'down' : 'right'}`} />
                                </button>
                              ) : (
                                <span style={{ width: 26, display: 'inline-block' }} />
                              )}
                              <div className="ep-cat-avatar"><i className="fas fa-tag" /></div>
                              <div>
                                <div className="ep-cat-name">{cat.name}</div>
                                {hasSubs && <div className="ep-cat-meta">{t.sub_count(subs.length)}</div>}
                              </div>
                            </div>
                          </td>
                          <td>
                            {hasSubs ? (
                              <button
                                type="button"
                                className={`ep-badge badge-${toneFor(cat.name || '')}`}
                                onClick={() => openSubsOf(cat)}
                                title={t.view_subs}
                                aria-label={t.view_subs}
                              >
                                <i className="fas fa-sitemap" />
                                {subs.length}
                                <i className="fas fa-arrow-up-right-from-square" style={{ fontSize: 9, opacity: .7 }} />
                              </button>
                            ) : (
                              <span style={{ color: '#98a6ba', fontSize: 'var(--fs-xs)' }}>{t.no_subs}</span>
                            )}
                          </td>
                          <td>{statusBadge(cat.status)}</td>
                          <td className="ep-col-end">{renderActions(cat, 'category')}</td>
                        </tr>

                        {hasSubs && isOpen && (
                          <tr className="ep-subrow">
                            <td colSpan={colCount}>
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
                                        <td style={{ width: '20%' }}>{statusBadge(sub.status)}</td>
                                        <td className="ep-col-end">{renderActions(sub, 'subcategory')}</td>
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
        )}
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
                      {sortedCategoryOptions.map((c) => (
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