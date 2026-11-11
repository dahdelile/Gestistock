// src/pages/UsersPage.jsx
// Réservé aux administrateurs pour ajouter / modifier / supprimer — typographie responsive
import React, { useState, useEffect, useMemo } from 'react';
import { usersApi } from '../api';
import { useLanguage } from '../context/LanguageContext';

const I18N = {
  fr: {
    dir: 'ltr',
    title: 'Gestion des utilisateurs',
    subtitle: 'Gérez les accès, les rôles et les informations de votre équipe.',
    add: 'Nouvel utilisateur',
    search_ph: 'Rechercher un nom, email...',
    all_roles: 'Tous les rôles',
    role_admin: 'Administrateur',
    role_manager: 'Gérant',
    role_cashier: 'Caissier',
    role_stock: 'Gestionnaire de stock',
    th_name: 'Utilisateur',
    th_role: 'Rôle',
    th_status: 'Statut',
    th_date: 'Date de création',
    th_actions: 'Actions',
    loading: 'Chargement des utilisateurs...',
    none: 'Aucun utilisateur trouvé.',
    active: 'Actif',
    inactive: 'Inactif',
    edit: 'Modifier',
    delete: 'Supprimer',
    cancel: 'Annuler',
    save: 'Enregistrer',
    saving: 'Enregistrement...',
    close: 'Fermer',
    you: 'Vous',
    readonly: 'Mode lecture seule : seuls les administrateurs peuvent ajouter, modifier ou supprimer des utilisateurs.',
    modal_new: 'Nouvel utilisateur',
    modal_edit: "Modifier l'utilisateur",
    f_name: 'Nom complet',
    f_email: 'Adresse email',
    f_password: 'Mot de passe',
    f_password_hint: 'Laissez vide pour conserver le mot de passe actuel (en modification).',
    f_role: 'Rôle',
    f_status: 'Statut',
    delete_title: 'Supprimer cet utilisateur ?',
    delete_warn: "Cette action est irréversible. L'utilisateur perdra immédiatement accès au système.",
    delete_confirm: 'Oui, supprimer',
    ok_saved: 'Utilisateur enregistré avec succès.',
    ok_deleted: 'Utilisateur supprimé.',
    err_save: "Erreur lors de l'enregistrement.",
    err_delete: 'Erreur lors de la suppression.',
    err_load: 'Impossible de charger les utilisateurs.',
    err_forbidden: "Action réservée aux administrateurs.",
  },
  ar: {
    dir: 'rtl',
    title: 'إدارة المستخدمين',
    subtitle: 'أدر صلاحيات وأدوار ومعلومات فريقك.',
    add: 'مستخدم جديد',
    search_ph: 'ابحث بالاسم أو البريد الإلكتروني...',
    all_roles: 'كل الأدوار',
    role_admin: 'مدير النظام',
    role_manager: 'مدير',
    role_cashier: 'أمين صندوق',
    role_stock: 'أمين مخزن',
    th_name: 'المستخدم',
    th_role: 'الدور',
    th_status: 'الحالة',
    th_date: 'تاريخ الإنشاء',
    th_actions: 'إجراءات',
    loading: 'جارٍ تحميل المستخدمين...',
    none: 'لا يوجد مستخدمون.',
    active: 'نشط',
    inactive: 'غير نشط',
    edit: 'تعديل',
    delete: 'حذف',
    cancel: 'إلغاء',
    save: 'حفظ',
    saving: 'جارٍ الحفظ...',
    close: 'إغلاق',
    you: 'أنت',
    readonly: 'وضع القراءة فقط: يمكن لمدير النظام وحده إضافة المستخدمين أو تعديلهم أو حذفهم.',
    modal_new: 'مستخدم جديد',
    modal_edit: 'تعديل المستخدم',
    f_name: 'الاسم الكامل',
    f_email: 'البريد الإلكتروني',
    f_password: 'كلمة المرور',
    f_password_hint: 'اتركه فارغًا للاحتفاظ بكلمة المرور الحالية (عند التعديل).',
    f_role: 'الدور',
    f_status: 'الحالة',
    delete_title: 'حذف هذا المستخدم؟',
    delete_warn: 'هذا الإجراء لا يمكن التراجع عنه. سيفقد المستخدم الوصول إلى النظام فوراً.',
    delete_confirm: 'نعم، احذف',
    ok_saved: 'تم حفظ المستخدم بنجاح.',
    ok_deleted: 'تم حذف المستخدم.',
    err_save: 'حدث خطأ أثناء الحفظ.',
    err_delete: 'حدث خطأ أثناء الحذف.',
    err_load: 'تعذّر تحميل المستخدمين.',
    err_forbidden: 'هذا الإجراء مخصص لمدير النظام فقط.',
  },
};

const LANG_KEY = 'gestistock_lang';

const emptyForm = () => ({ name: '', email: '', password: '', role: 'cashier', status: 'active' });

const formatDate = (dateString, locale) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
};

/* ---------- Utilisateur connecté (enregistré par LoginPage) ---------- */
const getLoggedUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user')) || null;
  } catch {
    return null;
  }
};

const UsersPage = () => {
  const { lang } = useLanguage();
  const t = I18N[lang];

  // Seul l'administrateur actif peut gérer les utilisateurs
  const loggedUser = useMemo(getLoggedUser, []);
  const canManage = String(loggedUser?.role || '').toLowerCase() === 'admin'
    && (loggedUser?.status ? loggedUser.status === 'active' : true);
  const isSelf = (u) =>
    Boolean(loggedUser) &&
    (String(u.id) === String(loggedUser.id) ||
      (u.email && loggedUser.email && u.email.toLowerCase() === loggedUser.email.toLowerCase()));

  useEffect(() => {
    try { localStorage.setItem(LANG_KEY, lang); } catch {}
  }, [lang]);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const [showForm, setShowForm] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await usersApi.getAll();
      const data = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : res?.data?.data || [];
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError(t.err_load);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const closeModals = () => {
    setShowForm(false);
    setShowDelete(false);
  };

  useEffect(() => {
    if (!showForm && !showDelete) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') closeModals(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showForm, showDelete]);

  /* ---------- Actions (toutes protégées : admin uniquement) ---------- */
  const handleOpenCreate = () => {
    if (!canManage) return;
    setCurrentUser(null);
    setFormData(emptyForm());
    setShowForm(true);
  };

  const handleOpenEdit = (user) => {
    if (!canManage) return;
    setCurrentUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'cashier',
      status: user.status || 'active',
    });
    setShowForm(true);
  };

  const handleDeleteClick = (user) => {
    if (!canManage || isSelf(user)) return;
    setCurrentUser(user);
    setShowDelete(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canManage) {
      showToast(t.err_forbidden, 'danger');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...formData };
      if (currentUser && !payload.password) delete payload.password;

      if (currentUser) await usersApi.update(currentUser.id, payload);
      else await usersApi.create(payload);

      showToast(t.ok_saved);
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      showToast(t.err_save, 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!canManage || !currentUser || isSelf(currentUser)) return;
    setSaving(true);
    try {
      await usersApi.delete(currentUser.id);
      setShowDelete(false);
      showToast(t.ok_deleted);
      fetchUsers();
    } catch (err) {
      console.error(err);
      showToast(t.err_delete, 'danger');
    } finally {
      setSaving(false);
    }
  };

  const getRoleLabel = (role) => {
    const roles = { admin: t.role_admin, manager: t.role_manager, cashier: t.role_cashier, stock: t.role_stock };
    return roles[role] || role;
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'badge-rose';
      case 'manager': return 'badge-violet';
      case 'stock': return 'badge-amber';
      default: return 'badge-blue';
    }
  };

  const filteredUsers = useMemo(() => {
    const needle = search.toLowerCase();
    return users.filter((u) => {
      const matchesSearch =
        !search ||
        (u.name || '').toLowerCase().includes(needle) ||
        (u.email || '').toLowerCase().includes(needle);
      const matchesRole = filterRole === 'all' || u.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [users, search, filterRole]);

  const colCount = canManage ? 5 : 4;

  return (
    <div className="ep-page" dir={t.dir} lang={lang}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');

        .ep-page {
          --ink: #14213d; --muted: #66748b; --line: #e3e9f2; --bg: #f8fafc; --card: #fff;
          --primary: #1f5eea; --primary-soft: #e8efff;
          --green: #0f9d74; --green-soft: #def7ee;
          --violet: #6a4de0; --violet-soft: #ece8fd;
          --amber: #e08a0b; --amber-soft: #fff0d6;
          --red: #d63c4a; --red-soft: #fde8ea;
          --rose: #c2417c; --rose-soft: #fbe6f0;

          /* Échelle typographique responsive */
          --fs-xs:  clamp(11px, 0.70vw + 9px,  13px);
          --fs-sm:  clamp(12px, 0.75vw + 10px, 14px);
          --fs-md:  clamp(13px, 0.80vw + 11px, 15px);
          --fs-lg:  clamp(15px, 0.90vw + 12px, 18px);
          --fs-xl:  clamp(17px, 1.00vw + 13px, 21px);
          --fs-2xl: clamp(20px, 1.80vw + 14px, 28px);

          padding: clamp(10px, 2vw, 20px);
          background-color: var(--bg);
          color: var(--ink);
          font-family: Inter, 'Segoe UI', system-ui, sans-serif;
          font-size: var(--fs-md);
          min-height: 100vh;
          -webkit-text-size-adjust: 100%;
        }
        .ep-page[lang="ar"] { font-family: Cairo, 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; }
        .ep-page * { box-sizing: border-box; }
        .ep-page button, .ep-page input, .ep-page select { font-family: inherit; }
        .ep-page button:focus-visible, .ep-page input:focus-visible, .ep-page select:focus-visible {
          outline: 3px solid rgba(31,94,234,.3); outline-offset: 2px;
        }

        .ep-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; gap: 14px; }
        .ep-title h1 { margin: 0 0 6px 0; font-size: var(--fs-2xl); font-weight: 800; display: flex; align-items: center; gap: 12px; line-height: 1.25; }
        .ep-title p { margin: 0; color: var(--muted); font-size: var(--fs-md); }

        .ep-btn-add { background: var(--primary); color: white; border: none; border-radius: 10px; padding: 11px 18px; font-weight: 700; font-size: var(--fs-md); cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; box-shadow: 0 4px 12px rgba(31,94,234,0.2); }
        .ep-btn-add:hover { transform: translateY(-2px); filter: brightness(0.95); }

        .ep-notice { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 16px; padding: 12px 15px; border: 1px solid #f5dcb0; border-radius: 11px; background: var(--amber-soft); color: #94590a; font-size: var(--fs-sm); line-height: 1.5; }
        .ep-notice i { margin-top: 3px; }

        .ep-card { background: var(--card); border: 1px solid var(--line); border-radius: 16px; overflow: hidden; box-shadow: 0 4px 14px rgba(20,33,61,0.03); }

        .ep-filters { padding: 14px clamp(12px, 2vw, 20px); border-bottom: 1px solid var(--line); display: flex; gap: 12px; flex-wrap: wrap; }
        .ep-input { height: 42px; border: 1px solid #d9e1ed; border-radius: 8px; padding: 0 14px; font-size: max(16px, var(--fs-md)); background: #fff; color: #2a3a55; outline: none; transition: 0.2s; }
        .ep-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); }
        .ep-search-group { flex: 1 1 240px; min-width: 0; position: relative; }
        .ep-search-group .ep-input { width: 100%; padding-inline-start: 40px; }
        .ep-search-group i { position: absolute; inset-inline-start: 15px; top: 50%; transform: translateY(-50%); color: var(--muted); pointer-events: none; }
        .ep-filters select.ep-input { flex: 0 1 220px; min-width: 150px; }

        .ep-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .ep-table { width: 100%; min-width: 720px; border-collapse: collapse; }
        .ep-table th { background: #f8fafc; text-align: start; padding: 14px 18px; font-size: var(--fs-xs); font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: 0.4px; border-bottom: 1px solid var(--line); white-space: nowrap; }
        .ep-table td { padding: 14px 18px; border-bottom: 1px solid var(--line); font-size: var(--fs-sm); vertical-align: middle; }
        .ep-table tr:last-child td { border-bottom: none; }
        .ep-table tr:hover td { background-color: #fbfcff; }
        .ep-col-end { text-align: end !important; }

        .user-cell { display: flex; align-items: center; gap: 12px; }
        .user-avatar { flex: 0 0 auto; width: clamp(34px, 3.5vw, 40px); height: clamp(34px, 3.5vw, 40px); border-radius: 10px; background: var(--primary-soft); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: var(--fs-lg); }
        .user-name { font-weight: 700; color: var(--ink); font-size: var(--fs-md); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .user-email { font-size: var(--fs-xs); color: var(--muted); margin-top: 2px; overflow-wrap: anywhere; }
        .self-tag { padding: 2px 8px; border-radius: 99px; background: var(--primary-soft); color: var(--primary); font-size: var(--fs-xs); font-weight: 800; }

        .ep-badge { display: inline-flex; align-items: center; padding: 5px 11px; border-radius: 99px; font-size: var(--fs-xs); font-weight: 700; white-space: nowrap; }
        .badge-blue { background: var(--primary-soft); color: var(--primary); }
        .badge-green { background: var(--green-soft); color: var(--green); }
        .badge-rose { background: var(--rose-soft); color: var(--rose); }
        .badge-violet { background: var(--violet-soft); color: var(--violet); }
        .badge-amber { background: var(--amber-soft); color: #94590a; }
        .badge-gray { background: #f1f5f9; color: #64748b; }

        .status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-inline-end: 6px; }
        .dot-green { background: var(--green); }
        .dot-gray { background: #94a3b8; }

        .ep-actions { display: flex; gap: 8px; justify-content: flex-end; }
        .btn-icon { width: 34px; height: 34px; border-radius: 8px; border: 1px solid transparent; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; background: transparent; color: #64748b; font-size: var(--fs-sm); }
        .btn-edit { background: var(--primary-soft); color: var(--primary); border-color: #c9daff; }
        .btn-edit:hover { background: var(--primary); color: white; }
        .btn-delete { background: var(--red-soft); color: var(--red); border-color: #f6c8cd; }
        .btn-delete:hover { background: var(--red); color: white; }
        .btn-delete:disabled { opacity: .35; cursor: not-allowed; background: var(--red-soft); color: var(--red); }

        .ep-modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.6); backdrop-filter: blur(4px); z-index: 1050; display: flex; align-items: center; justify-content: center; padding: clamp(10px, 2vw, 20px); }
        .ep-modal { background: white; border-radius: 16px; width: 100%; max-width: 500px; max-height: calc(100vh - 24px); box-shadow: 0 20px 40px rgba(0,0,0,0.2); overflow: hidden; display: flex; flex-direction: column; animation: modalIn 0.2s ease; }
        @keyframes modalIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .ep-modal-header { padding: 16px 20px; border-bottom: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center; background: #f8fafc; }
        .ep-modal-header h3 { margin: 0; font-size: var(--fs-lg); font-weight: 800; }
        .btn-close { background: transparent; border: none; font-size: var(--fs-lg); cursor: pointer; color: var(--muted); width: 34px; height: 34px; border-radius: 8px; }
        .btn-close:hover { background: #eef2f8; }

        .ep-modal-body { padding: clamp(14px, 2.5vw, 20px); overflow-y: auto; }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; font-size: var(--fs-sm); font-weight: 700; color: #4b5b75; margin-bottom: 6px; }
        .form-control { width: 100%; height: 44px; border: 1px solid #d9e1ed; border-radius: 8px; padding: 0 14px; font-size: max(16px, var(--fs-md)); background: #fbfcfe; color: #2a3a55; outline: none; transition: 0.2s; }
        .form-control:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); background: #fff; }
        .form-hint { font-size: var(--fs-xs); color: var(--muted); margin-top: 4px; display: block; }
        .form-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

        .ep-modal-footer { padding: 14px 20px; border-top: 1px solid var(--line); display: flex; justify-content: flex-end; gap: 12px; background: #f8fafc; }
        .btn-cancel { background: white; border: 1px solid var(--line); color: var(--ink); padding: 10px 18px; border-radius: 8px; font-weight: 700; font-size: var(--fs-sm); cursor: pointer; }
        .btn-save { background: var(--primary); border: none; color: white; padding: 10px 18px; border-radius: 8px; font-weight: 700; font-size: var(--fs-sm); cursor: pointer; }
        .btn-danger { background: var(--red); border: none; color: white; padding: 10px 18px; border-radius: 8px; font-weight: 700; font-size: var(--fs-sm); cursor: pointer; }
        .btn-save:disabled, .btn-danger:disabled { opacity: .6; cursor: not-allowed; }

        .empty-state { text-align: center; padding: 50px 20px; color: var(--muted); font-size: var(--fs-sm); }
        .empty-state h4 { font-size: var(--fs-lg); }
        .empty-icon { width: 60px; height: 60px; background: var(--primary-soft); color: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: var(--fs-xl); margin: 0 auto 16px; }
        .ep-spinner { display: inline-block; width: 22px; height: 22px; border: 3px solid #dbeafe; border-top-color: var(--primary); border-radius: 50%; animation: ep-spin .75s linear infinite; }
        @keyframes ep-spin { to { transform: rotate(360deg); } }

        .toast-container { position: fixed; top: 16px; inset-inline-end: 16px; z-index: 1100; display: flex; flex-direction: column; gap: 10px; max-width: calc(100vw - 32px); }
        .toast { background: white; padding: 13px 18px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 12px; font-weight: 600; font-size: var(--fs-sm); border-inline-start: 4px solid var(--primary); animation: slideIn 0.3s ease; }
        .toast.success { border-inline-start-color: var(--green); }
        .toast.danger { border-inline-start-color: var(--red); }
        @keyframes slideIn { from { transform: translateY(-12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        @media (max-width: 560px) {
          .ep-header { flex-direction: column; align-items: stretch; }
          .ep-btn-add { justify-content: center; }
          .ep-filters select.ep-input { flex: 1 1 100%; }
          .form-grid2 { grid-template-columns: 1fr; gap: 0; }
          .ep-table th, .ep-table td { padding: 11px 12px; }
          .ep-modal-overlay { align-items: flex-end; }
          .ep-modal-footer .btn-cancel, .ep-modal-footer .btn-save, .ep-modal-footer .btn-danger { flex: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ep-spinner { animation-duration: 2s; }
          .ep-modal, .toast { animation: none; }
        }
      `}</style>

      {/* En-tête */}
      <div className="ep-header">
        <div className="ep-title">
          <h1>
            <i className="fas fa-users" style={{ color: 'var(--primary)' }}></i>
            {t.title}
          </h1>
          <p>{t.subtitle}</p>
        </div>

        {canManage && (
          <button type="button" className="ep-btn-add" onClick={handleOpenCreate}>
            <i className="fas fa-user-plus"></i>
            {t.add}
          </button>
        )}
      </div>

      {/* Lecture seule pour les non-administrateurs */}
      {!canManage && (
        <div className="ep-notice" role="status">
          <i className="fas fa-lock"></i>
          <span>{t.readonly}</span>
        </div>
      )}

      {error && (
        <div className="toast danger" style={{ marginBottom: 20 }} role="alert">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}

      <div className="ep-card">
        <div className="ep-filters">
          <div className="ep-search-group">
            <i className="fas fa-search"></i>
            <input
              type="search"
              className="ep-input"
              placeholder={t.search_ph}
              aria-label={t.search_ph}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="ep-input" aria-label={t.th_role} value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
            <option value="all">{t.all_roles}</option>
            <option value="admin">{t.role_admin}</option>
            <option value="manager">{t.role_manager}</option>
            <option value="cashier">{t.role_cashier}</option>
            <option value="stock">{t.role_stock}</option>
          </select>
        </div>

        <div className="ep-table-wrap">
          <table className="ep-table">
            <thead>
              <tr>
                <th>{t.th_name}</th>
                <th>{t.th_role}</th>
                <th>{t.th_status}</th>
                <th>{t.th_date}</th>
                {canManage && <th className="ep-col-end">{t.th_actions}</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={colCount} className="empty-state">
                    <span className="ep-spinner" role="status" aria-label={t.loading}></span>
                    <p style={{ marginTop: 10 }}>{t.loading}</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="empty-state">
                    <div className="empty-icon"><i className="fas fa-user-slash"></i></div>
                    <h4 style={{ margin: '0 0 8px 0', color: 'var(--ink)' }}>{t.none}</h4>
                    {canManage && (
                      <button className="btn-save" onClick={handleOpenCreate} style={{ marginTop: 10 }}>{t.add}</button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const self = isSelf(user);
                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="user-name">
                              {user.name}
                              {self && <span className="self-tag">{t.you}</span>}
                            </div>
                            <div className="user-email">
                              <i className="fas fa-envelope" style={{ fontSize: 11, marginInlineEnd: 4 }}></i>
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`ep-badge ${getRoleColor(user.role)}`}>{getRoleLabel(user.role)}</span>
                      </td>
                      <td>
                        <span className={`ep-badge ${user.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                          <span className={`status-dot ${user.status === 'active' ? 'dot-green' : 'dot-gray'}`}></span>
                          {user.status === 'active' ? t.active : t.inactive}
                        </span>
                      </td>
                      <td style={{ color: 'var(--muted)' }}>
                        {formatDate(user.created_at, lang === 'ar' ? 'ar-EG' : 'fr-FR')}
                      </td>
                      {canManage && (
                        <td>
                          <div className="ep-actions">
                            <button type="button" className="btn-icon btn-edit" onClick={() => handleOpenEdit(user)} title={t.edit} aria-label={t.edit}>
                              <i className="fas fa-pen"></i>
                            </button>
                            <button
                              type="button"
                              className="btn-icon btn-delete"
                              onClick={() => handleDeleteClick(user)}
                              disabled={self}
                              title={t.delete}
                              aria-label={t.delete}
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modale formulaire */}
      {canManage && showForm && (
        <div className="ep-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && closeModals()}>
          <div className="ep-modal" dir={t.dir} role="dialog" aria-modal="true" aria-labelledby="up-form-title">
            <div className="ep-modal-header">
              <h3 id="up-form-title">{currentUser ? t.modal_edit : t.modal_new}</h3>
              <button type="button" className="btn-close" onClick={closeModals} aria-label={t.close}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div className="ep-modal-body">
                <div className="form-group">
                  <label htmlFor="up-name">{t.f_name}</label>
                  <input id="up-name" type="text" className="form-control" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label htmlFor="up-email">{t.f_email}</label>
                  <input id="up-email" type="email" className="form-control" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} dir="ltr" style={{ textAlign: t.dir === 'rtl' ? 'right' : 'left' }} />
                </div>
                <div className="form-group">
                  <label htmlFor="up-password">{t.f_password}</label>
                  <input id="up-password" type="password" className="form-control" required={!currentUser} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} dir="ltr" autoComplete="new-password" />
                  {currentUser && <span className="form-hint">{t.f_password_hint}</span>}
                </div>
                <div className="form-grid2">
                  <div className="form-group">
                    <label htmlFor="up-role">{t.f_role}</label>
                    <select id="up-role" className="form-control" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                      <option value="admin">{t.role_admin}</option>
                      <option value="manager">{t.role_manager}</option>
                      <option value="cashier">{t.role_cashier}</option>
                      <option value="stock">{t.role_stock}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="up-status">{t.f_status}</label>
                    <select id="up-status" className="form-control" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                      <option value="active">{t.active}</option>
                      <option value="inactive">{t.inactive}</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="ep-modal-footer">
                <button type="button" className="btn-cancel" onClick={closeModals}>{t.cancel}</button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? <><i className="fas fa-spinner fa-spin"></i> {t.saving}</> : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale suppression */}
      {canManage && showDelete && currentUser && (
        <div className="ep-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && closeModals()}>
          <div className="ep-modal" dir={t.dir} style={{ maxWidth: 400 }} role="alertdialog" aria-modal="true">
            <div className="ep-modal-body" style={{ textAlign: 'center', paddingTop: 30 }}>
              <div className="empty-icon" style={{ background: 'var(--red-soft)', color: 'var(--red)' }}>
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h3 style={{ margin: '0 0 10px 0', fontSize: 'var(--fs-xl)' }}>{t.delete_title}</h3>
              <p style={{ color: 'var(--muted)', margin: '0 0 16px 0', fontSize: 'var(--fs-sm)', lineHeight: 1.6 }}>{t.delete_warn}</p>
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, fontWeight: 700, marginBottom: 20, fontSize: 'var(--fs-md)', overflowWrap: 'anywhere' }}>
                {currentUser.name}
                <br />
                <span style={{ fontWeight: 400, fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{currentUser.email}</span>
              </div>
            </div>
            <div className="ep-modal-footer" style={{ justifyContent: 'center' }}>
              <button type="button" className="btn-cancel" onClick={closeModals}>{t.cancel}</button>
              <button type="button" className="btn-danger" onClick={handleDeleteConfirm} disabled={saving}>
                {saving ? <i className="fas fa-spinner fa-spin"></i> : t.delete_confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <div className="toast-container" role="status">
          <div className={`toast ${toast.type}`}>
            <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`} style={{ color: toast.type === 'success' ? 'var(--green)' : 'var(--red)' }}></i>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;