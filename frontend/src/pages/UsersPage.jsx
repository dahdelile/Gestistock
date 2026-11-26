
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

const emptyForm = () => ({
  name: '',
  email: '',
  password: '',
  role: 'cashier',
  status: 'active',
});

const formatDate = (dateString, locale) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getLoggedUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user')) || null;
  } catch {
    return null;
  }
};

const UsersPage = () => {
  const { lang } = useLanguage();
  const t = I18N[lang] || I18N.fr;

  const loggedUser = useMemo(getLoggedUser, []);

  const canManage =
    String(loggedUser?.role || '').trim().toLowerCase() === 'admin' &&
    String(loggedUser?.status || 'active').trim().toLowerCase() === 'active';

  const isSelf = (u) =>
    Boolean(loggedUser) &&
    (
      String(u.id) === String(loggedUser.id) ||
      (
        u.email &&
        loggedUser.email &&
        u.email.toLowerCase() === loggedUser.email.toLowerCase()
      )
    );

  useEffect(() => {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {}
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

  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success',
  });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await usersApi.getAll();
      const data = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : res?.data?.data || [];

      setUsers(data);
    } catch (err) {
      console.error(err);
      setError(t.err_load);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const closeModals = () => {
    setShowForm(false);
    setShowDelete(false);
  };

  useEffect(() => {
    if (!showForm && !showDelete) return undefined;

    const onKey = (e) => {
      if (e.key === 'Escape') closeModals();
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showForm, showDelete]);

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

      if (currentUser && !payload.password) {
        delete payload.password;
      }

      if (currentUser) {
        await usersApi.update(currentUser.id, payload);
      } else {
        await usersApi.create(payload);
      }

      showToast(t.ok_saved);
      setShowForm(false);
      await fetchUsers();
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
      await fetchUsers();
    } catch (err) {
      console.error(err);
      showToast(t.err_delete, 'danger');
    } finally {
      setSaving(false);
    }
  };

  const getRoleLabel = (role) => {
    const roles = {
      admin: t.role_admin,
      manager: t.role_manager,
      cashier: t.role_cashier,
      stock: t.role_stock,
    };

    return roles[role] || role;
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'badge-rose';
      case 'manager':
        return 'badge-violet';
      case 'stock':
        return 'badge-amber';
      default:
        return 'badge-blue';
    }
  };

  const filteredUsers = useMemo(() => {
    const needle = search.toLowerCase();

    return users.filter((u) => {
      const matchesSearch =
        !search ||
        (u.name || '').toLowerCase().includes(needle) ||
        (u.email || '').toLowerCase().includes(needle);

      const matchesRole =
        filterRole === 'all' || u.role === filterRole;

      return matchesSearch && matchesRole;
    });
  }, [users, search, filterRole]);

  const colCount = canManage ? 5 : 4;

  return (
    <div className="ep-page" dir={t.dir} lang={lang}>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');

        .ep-page {
          --ink: #14213d;
          --muted: #66748b;
          --line: #e3e9f2;
          --bg: #f8fafc;
          --card: #ffffff;

          --primary: #1f5eea;
          --primary-soft: #e8efff;

          --green: #0f9d74;
          --green-soft: #def7ee;

          --violet: #6a4de0;
          --violet-soft: #ece8fd;

          --amber: #e08a0b;
          --amber-soft: #fff0d6;

          --red: #d63c4a;
          --red-soft: #fde8ea;

          --rose: #c2417c;
          --rose-soft: #fbe6f0;

          /* Responsive typography */
          --fs-xs: clamp(12px, 0.75vw + 9px, 14px);
          --fs-sm: clamp(13px, 0.80vw + 10px, 15px);
          --fs-md: clamp(14px, 0.85vw + 11px, 16px);
          --fs-lg: clamp(16px, 1vw + 12px, 20px);
          --fs-xl: clamp(19px, 1.2vw + 13px, 24px);
          --fs-2xl: clamp(23px, 1.6vw + 15px, 32px);

          width: 100%;
          min-height: 100vh;
          padding: clamp(10px, 2vw, 22px);
          background: var(--bg);
          color: var(--ink);
          font-family: Inter, 'Segoe UI', system-ui, sans-serif;
          font-size: var(--fs-md);
          -webkit-text-size-adjust: 100%;
        }

        .ep-page[lang="ar"] {
          font-family: Cairo, 'Segoe UI', Tahoma, sans-serif;
          line-height: 1.7;
        }

        .ep-page *,
        .ep-page *::before,
        .ep-page *::after {
          box-sizing: border-box;
        }

        .ep-page button,
        .ep-page input,
        .ep-page select {
          font: inherit;
        }

        .ep-page button {
          touch-action: manipulation;
        }

        .ep-page button:focus-visible,
        .ep-page input:focus-visible,
        .ep-page select:focus-visible {
          outline: 3px solid rgba(31, 94, 234, .3);
          outline-offset: 2px;
        }

        /* Header */
        .ep-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 14px;
          margin-bottom: 20px;
        }

        .ep-title {
          min-width: 0;
          flex: 1;
        }

        .ep-title h1 {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin: 0 0 7px;
          font-size: var(--fs-2xl);
          font-weight: 800;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }

        .ep-title p {
          margin: 0;
          color: var(--muted);
          font-size: var(--fs-md);
          line-height: 1.7;
        }

        .ep-btn-add {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 44px;
          padding: 11px 18px;
          border: none;
          border-radius: 10px;
          background: var(--primary);
          color: #fff;
          font-size: var(--fs-md);
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(31, 94, 234, .2);
          transition: .2s;
        }

        .ep-btn-add:hover {
          transform: translateY(-2px);
          filter: brightness(.95);
        }

        /* Read-only notice */
        .ep-notice {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 16px;
          padding: 13px 16px;
          border: 1px solid #f5dcb0;
          border-radius: 11px;
          background: var(--amber-soft);
          color: #94590a;
          font-size: var(--fs-sm);
          line-height: 1.7;
        }

        .ep-notice i {
          margin-top: 5px;
          flex-shrink: 0;
        }

        /* Main card */
        .ep-card {
          width: 100%;
          overflow: hidden;
          border: 1px solid var(--line);
          border-radius: 16px;
          background: var(--card);
          box-shadow: 0 4px 14px rgba(20, 33, 61, .04);
        }

        /* Filters */
        .ep-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          padding: 15px clamp(12px, 2vw, 20px);
          border-bottom: 1px solid var(--line);
        }

        .ep-input {
          width: 100%;
          min-width: 0;
          height: 46px;
          padding: 0 14px;
          border: 1px solid #d9e1ed;
          border-radius: 9px;
          background: #fff;
          color: #2a3a55;
          font-size: max(16px, var(--fs-md));
          outline: none;
          transition: .2s;
        }

        .ep-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-soft);
        }

        .ep-search-group {
          position: relative;
          flex: 1 1 260px;
          min-width: 0;
        }

        .ep-search-group .ep-input {
          padding-inline-start: 42px;
        }

        .ep-search-group i {
          position: absolute;
          top: 50%;
          inset-inline-start: 15px;
          transform: translateY(-50%);
          color: var(--muted);
          pointer-events: none;
        }

        .ep-filters select.ep-input {
          flex: 0 1 240px;
          min-width: 160px;
        }

        /* Table */
        .ep-table-wrap {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .ep-table {
          width: 100%;
          min-width: 720px;
          border-collapse: collapse;
        }

        .ep-table th {
          padding: 15px 18px;
          border-bottom: 1px solid var(--line);
          background: #f8fafc;
          color: var(--muted);
          text-align: start;
          font-size: var(--fs-xs);
          font-weight: 800;
          white-space: nowrap;
        }

        .ep-table td {
          padding: 15px 18px;
          border-bottom: 1px solid var(--line);
          font-size: var(--fs-sm);
          vertical-align: middle;
        }

        .ep-table tr:last-child td {
          border-bottom: none;
        }

        .ep-table tbody tr:hover td {
          background: #fbfcff;
        }

        .ep-col-end {
          text-align: end !important;
        }

        /* User details */
        .user-cell {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .user-avatar {
          display: flex;
          flex: 0 0 auto;
          align-items: center;
          justify-content: center;
          width: clamp(36px, 3.5vw, 44px);
          height: clamp(36px, 3.5vw, 44px);
          border-radius: 11px;
          background: var(--primary-soft);
          color: var(--primary);
          font-size: var(--fs-lg);
          font-weight: 800;
        }

        .user-name {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 7px;
          color: var(--ink);
          font-size: var(--fs-md);
          font-weight: 700;
          overflow-wrap: anywhere;
        }

        .user-email {
          margin-top: 3px;
          color: var(--muted);
          font-size: var(--fs-xs);
          overflow-wrap: anywhere;
        }

        .self-tag {
          padding: 3px 8px;
          border-radius: 99px;
          background: var(--primary-soft);
          color: var(--primary);
          font-size: var(--fs-xs);
          font-weight: 800;
        }

        /* Badges */
        .ep-badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 11px;
          border-radius: 99px;
          font-size: var(--fs-xs);
          font-weight: 700;
          white-space: nowrap;
        }

        .badge-blue {
          background: var(--primary-soft);
          color: var(--primary);
        }

        .badge-green {
          background: var(--green-soft);
          color: var(--green);
        }

        .badge-rose {
          background: var(--rose-soft);
          color: var(--rose);
        }

        .badge-violet {
          background: var(--violet-soft);
          color: var(--violet);
        }

        .badge-amber {
          background: var(--amber-soft);
          color: #94590a;
        }

        .badge-gray {
          background: #f1f5f9;
          color: #64748b;
        }

        .status-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          margin-inline-end: 6px;
          border-radius: 50%;
        }

        .dot-green {
          background: var(--green);
        }

        .dot-gray {
          background: #94a3b8;
        }

        /* Action buttons */
        .ep-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .btn-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border: 1px solid transparent;
          border-radius: 9px;
          background: transparent;
          color: #64748b;
          font-size: var(--fs-sm);
          cursor: pointer;
          transition: .2s;
        }

        .btn-edit {
          border-color: #c9daff;
          background: var(--primary-soft);
          color: var(--primary);
        }

        .btn-edit:hover {
          background: var(--primary);
          color: white;
        }

        .btn-delete {
          border-color: #f6c8cd;
          background: var(--red-soft);
          color: var(--red);
        }

        .btn-delete:hover {
          background: var(--red);
          color: white;
        }

        .btn-delete:disabled {
          opacity: .35;
          cursor: not-allowed;
        }

        /* Modal */
        .ep-modal-overlay {
          position: fixed;
          z-index: 1050;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background: rgba(15, 23, 42, .6);
          backdrop-filter: blur(4px);
        }

        .ep-modal {
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 520px;
          max-height: calc(100dvh - 32px);
          overflow: hidden;
          border-radius: 16px;
          background: white;
          box-shadow: 0 20px 40px rgba(0, 0, 0, .2);
          animation: modalIn .2s ease;
        }

        @keyframes modalIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .ep-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 16px 20px;
          border-bottom: 1px solid var(--line);
          background: #f8fafc;
        }

        .ep-modal-header h3 {
          margin: 0;
          font-size: var(--fs-lg);
          font-weight: 800;
        }

        .btn-close {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          width: 38px;
          height: 38px;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: var(--muted);
          font-size: var(--fs-lg);
          cursor: pointer;
        }

        .btn-close:hover {
          background: #eef2f8;
        }

        .ep-modal-body {
          padding: clamp(15px, 2.5vw, 22px);
          overflow-y: auto;
          overscroll-behavior: contain;
        }

        .form-group {
          margin-bottom: 17px;
          min-width: 0;
        }

        .form-group label {
          display: block;
          margin-bottom: 7px;
          color: #4b5b75;
          font-size: var(--fs-sm);
          font-weight: 700;
        }

        .form-control {
          width: 100%;
          min-width: 0;
          height: 46px;
          padding: 0 14px;
          border: 1px solid #d9e1ed;
          border-radius: 9px;
          background: #fbfcfe;
          color: #2a3a55;
          font-size: max(16px, var(--fs-md));
          outline: none;
          transition: .2s;
        }

        .form-control:focus {
          border-color: var(--primary);
          background: white;
          box-shadow: 0 0 0 3px var(--primary-soft);
        }

        .form-hint {
          display: block;
          margin-top: 5px;
          color: var(--muted);
          font-size: var(--fs-xs);
          line-height: 1.6;
        }

        .form-grid2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .ep-modal-footer {
          display: flex;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 10px;
          padding: 14px 20px;
          border-top: 1px solid var(--line);
          background: #f8fafc;
        }

        .btn-cancel,
        .btn-save,
        .btn-danger {
          min-height: 44px;
          padding: 10px 18px;
          border-radius: 9px;
          font-size: var(--fs-sm);
          font-weight: 700;
          cursor: pointer;
          transition: .2s;
        }

        .btn-cancel {
          border: 1px solid var(--line);
          background: white;
          color: var(--ink);
        }

        .btn-save {
          border: none;
          background: var(--primary);
          color: white;
        }

        .btn-danger {
          border: none;
          background: var(--red);
          color: white;
        }

        .btn-save:disabled,
        .btn-danger:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        /* Empty state and loading */
        .empty-state {
          padding: 50px 20px !important;
          color: var(--muted);
          text-align: center;
          font-size: var(--fs-sm);
        }

        .empty-state h4 {
          font-size: var(--fs-lg);
        }

        .empty-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
          border-radius: 50%;
          background: var(--primary-soft);
          color: var(--primary);
          font-size: var(--fs-xl);
        }

        .ep-spinner {
          display: inline-block;
          width: 25px;
          height: 25px;
          border: 3px solid #dbeafe;
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: ep-spin .75s linear infinite;
        }

        @keyframes ep-spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Toast */
        .toast-container {
          position: fixed;
          z-index: 1100;
          top: 16px;
          inset-inline-end: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: max-content;
          max-width: calc(100vw - 32px);
        }

        .toast {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 18px;
          border-inline-start: 4px solid var(--primary);
          border-radius: 10px;
          background: white;
          box-shadow: 0 10px 30px rgba(0, 0, 0, .1);
          font-size: var(--fs-sm);
          font-weight: 600;
          overflow-wrap: anywhere;
          animation: slideIn .3s ease;
        }

        .toast.success {
          border-inline-start-color: var(--green);
        }

        .toast.danger {
          border-inline-start-color: var(--red);
        }

        @keyframes slideIn {
          from {
            transform: translateY(-12px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        /* Tablet */
        @media (max-width: 992px) {
          .ep-page {
            padding: 16px;
          }

          .ep-table th,
          .ep-table td {
            padding: 13px 14px;
          }
        }

        /* Mobile */
        @media (max-width: 560px) {
          .ep-page {
            padding: 12px;
            font-size: 15px;
          }

          .ep-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .ep-title h1 {
            font-size: clamp(22px, 6vw, 27px);
            gap: 9px;
          }

          .ep-title p {
            font-size: 14px;
            line-height: 1.8;
          }

          .ep-btn-add {
            width: 100%;
            min-height: 47px;
            font-size: 15px;
          }

          .ep-filters {
            flex-direction: column;
            padding: 12px;
          }

          .ep-search-group,
          .ep-filters select.ep-input {
            flex: 1 1 auto;
            width: 100%;
            min-width: 0;
          }

          .ep-input,
          .form-control {
            min-height: 46px;
            font-size: 16px;
          }

          .ep-table {
            min-width: 720px;
          }

          .ep-table th {
            font-size: 12px;
          }

          .ep-table td {
            font-size: 14px;
          }

          .user-name {
            font-size: 14px;
          }

          .user-email {
            font-size: 12px;
          }

          .ep-badge {
            font-size: 12px;
          }

          .form-grid2 {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .ep-modal-overlay {
            align-items: flex-end;
            padding: 0;
          }

          .ep-modal {
            max-width: none;
            max-height: 90dvh;
            border-radius: 18px 18px 0 0;
          }

          .ep-modal-header {
            padding: 14px 16px;
          }

          .ep-modal-body {
            padding: 16px;
          }

          .ep-modal-footer {
            padding: 12px;
          }

          .ep-modal-footer .btn-cancel,
          .ep-modal-footer .btn-save,
          .ep-modal-footer .btn-danger {
            flex: 1;
          }

          .toast-container {
            top: 10px;
            inset-inline: 10px;
            width: auto;
            max-width: none;
          }

          .toast {
            font-size: 13px;
          }
        }

        /* Small mobile */
        @media (max-width: 380px) {
          .ep-page {
            padding: 8px;
          }

          .ep-title h1 {
            font-size: 21px;
          }

          .ep-title p {
            font-size: 13px;
          }

          .ep-table {
            min-width: 680px;
          }

          .ep-modal-footer {
            gap: 7px;
            padding: 10px;
          }

          .btn-cancel,
          .btn-save,
          .btn-danger {
            padding: 9px 10px;
            font-size: 13px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ep-spinner {
            animation-duration: 2s;
          }

          .ep-modal,
          .toast {
            animation: none;
          }

          .ep-btn-add,
          .btn-icon {
            transition: none;
          }
        }
      `}</style>

      {/* Header */}
      <div className="ep-header">
        <div className="ep-title">
          <h1>
            <i
              className="fas fa-users"
              style={{ color: 'var(--primary)' }}
            />
            {t.title}
          </h1>
          <p>{t.subtitle}</p>
        </div>

        {canManage && (
          <button
            type="button"
            className="ep-btn-add"
            onClick={handleOpenCreate}
          >
            <i className="fas fa-user-plus" />
            {t.add}
          </button>
        )}
      </div>

      {!canManage && (
        <div className="ep-notice" role="status">
          <i className="fas fa-lock" />
          <span>{t.readonly}</span>
        </div>
      )}

      {error && (
        <div
          className="toast danger"
          style={{ marginBottom: 20 }}
          role="alert"
        >
          <i className="fas fa-exclamation-circle" />
          {error}
        </div>
      )}

      <div className="ep-card">
        <div className="ep-filters">
          <div className="ep-search-group">
            <i className="fas fa-search" />
            <input
              type="search"
              className="ep-input"
              placeholder={t.search_ph}
              aria-label={t.search_ph}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="ep-input"
            aria-label={t.th_role}
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
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
                {canManage && (
                  <th className="ep-col-end">{t.th_actions}</th>
                )}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={colCount} className="empty-state">
                    <span
                      className="ep-spinner"
                      role="status"
                      aria-label={t.loading}
                    />
                    <p style={{ marginTop: 10 }}>{t.loading}</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="empty-state">
                    <div className="empty-icon">
                      <i className="fas fa-user-slash" />
                    </div>
                    <h4
                      style={{
                        margin: '0 0 8px',
                        color: 'var(--ink)',
                      }}
                    >
                      {t.none}
                    </h4>

                    {canManage && (
                      <button
                        className="btn-save"
                        onClick={handleOpenCreate}
                        style={{ marginTop: 10 }}
                      >
                        {t.add}
                      </button>
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
                            {user.name
                              ? user.name.charAt(0).toUpperCase()
                              : 'U'}
                          </div>

                          <div>
                            <div className="user-name">
                              {user.name}
                              {self && (
                                <span className="self-tag">
                                  {t.you}
                                </span>
                              )}
                            </div>

                            <div className="user-email">
                              <i
                                className="fas fa-envelope"
                                style={{
                                  fontSize: 11,
                                  marginInlineEnd: 4,
                                }}
                              />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`ep-badge ${getRoleColor(user.role)}`}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`ep-badge ${
                            user.status === 'active'
                              ? 'badge-green'
                              : 'badge-gray'
                          }`}
                        >
                          <span
                            className={`status-dot ${
                              user.status === 'active'
                                ? 'dot-green'
                                : 'dot-gray'
                            }`}
                          />
                          {user.status === 'active'
                            ? t.active
                            : t.inactive}
                        </span>
                      </td>

                      <td style={{ color: 'var(--muted)' }}>
                        {formatDate(
                          user.created_at,
                          lang === 'ar' ? 'ar-EG' : 'fr-FR'
                        )}
                      </td>

                      {canManage && (
                        <td>
                          <div className="ep-actions">
                            <button
                              type="button"
                              className="btn-icon btn-edit"
                              onClick={() => handleOpenEdit(user)}
                              title={t.edit}
                              aria-label={t.edit}
                            >
                              <i className="fas fa-pen" />
                            </button>

                            <button
                              type="button"
                              className="btn-icon btn-delete"
                              onClick={() => handleDeleteClick(user)}
                              disabled={self}
                              title={t.delete}
                              aria-label={t.delete}
                            >
                              <i className="fas fa-trash-alt" />
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

      {/* Create / Edit modal */}
      {canManage && showForm && (
        <div
          className="ep-modal-overlay"
          onMouseDown={(e) =>
            e.target === e.currentTarget && closeModals()
          }
        >
          <div
            className="ep-modal"
            dir={t.dir}
            role="dialog"
            aria-modal="true"
            aria-labelledby="up-form-title"
          >
            <div className="ep-modal-header">
              <h3 id="up-form-title">
                {currentUser ? t.modal_edit : t.modal_new}
              </h3>

              <button
                type="button"
                className="btn-close"
                onClick={closeModals}
                aria-label={t.close}
              >
                <i className="fas fa-times" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
              }}
            >
              <div className="ep-modal-body">
                <div className="form-group">
                  <label htmlFor="up-name">{t.f_name}</label>
                  <input
                    id="up-name"
                    type="text"
                    className="form-control"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="up-email">{t.f_email}</label>
                  <input
                    id="up-email"
                    type="email"
                    className="form-control"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email: e.target.value,
                      })
                    }
                    dir="ltr"
                    style={{
                      textAlign: t.dir === 'rtl' ? 'right' : 'left',
                    }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="up-password">{t.f_password}</label>
                  <input
                    id="up-password"
                    type="password"
                    className="form-control"
                    required={!currentUser}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        password: e.target.value,
                      })
                    }
                    dir="ltr"
                    autoComplete="new-password"
                  />

                  {currentUser && (
                    <span className="form-hint">
                      {t.f_password_hint}
                    </span>
                  )}
                </div>

                <div className="form-grid2">
                  <div className="form-group">
                    <label htmlFor="up-role">{t.f_role}</label>
                    <select
                      id="up-role"
                      className="form-control"
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          role: e.target.value,
                        })
                      }
                    >
                      <option value="admin">{t.role_admin}</option>
                      <option value="manager">{t.role_manager}</option>
                      <option value="cashier">{t.role_cashier}</option>
                      <option value="stock">{t.role_stock}</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="up-status">{t.f_status}</label>
                    <select
                      id="up-status"
                      className="form-control"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value,
                        })
                      }
                    >
                      <option value="active">{t.active}</option>
                      <option value="inactive">{t.inactive}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="ep-modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={closeModals}
                >
                  {t.cancel}
                </button>

                <button
                  type="submit"
                  className="btn-save"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <i className="fas fa-spinner fa-spin" />
                      {' '}
                      {t.saving}
                    </>
                  ) : (
                    t.save
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {canManage && showDelete && currentUser && (
        <div
          className="ep-modal-overlay"
          onMouseDown={(e) =>
            e.target === e.currentTarget && closeModals()
          }
        >
          <div
            className="ep-modal"
            dir={t.dir}
            style={{ maxWidth: 420 }}
            role="alertdialog"
            aria-modal="true"
          >
            <div
              className="ep-modal-body"
              style={{
                textAlign: 'center',
                paddingTop: 30,
              }}
            >
              <div
                className="empty-icon"
                style={{
                  background: 'var(--red-soft)',
                  color: 'var(--red)',
                }}
              >
                <i className="fas fa-exclamation-triangle" />
              </div>

              <h3
                style={{
                  margin: '0 0 10px',
                  fontSize: 'var(--fs-xl)',
                }}
              >
                {t.delete_title}
              </h3>

              <p
                style={{
                  color: 'var(--muted)',
                  margin: '0 0 16px',
                  fontSize: 'var(--fs-sm)',
                  lineHeight: 1.7,
                }}
              >
                {t.delete_warn}
              </p>

              <div
                style={{
                  background: '#f8fafc',
                  padding: 12,
                  borderRadius: 8,
                  fontWeight: 700,
                  marginBottom: 20,
                  fontSize: 'var(--fs-md)',
                  overflowWrap: 'anywhere',
                }}
              >
                {currentUser.name}
                <br />
                <span
                  style={{
                    fontWeight: 400,
                    fontSize: 'var(--fs-xs)',
                    color: 'var(--muted)',
                  }}
                >
                  {currentUser.email}
                </span>
              </div>
            </div>

            <div
              className="ep-modal-footer"
              style={{ justifyContent: 'center' }}
            >
              <button
                type="button"
                className="btn-cancel"
                onClick={closeModals}
              >
                {t.cancel}
              </button>

              <button
                type="button"
                className="btn-danger"
                onClick={handleDeleteConfirm}
                disabled={saving}
              >
                {saving ? (
                  <i className="fas fa-spinner fa-spin" />
                ) : (
                  t.delete_confirm
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {toast.show && (
        <div className="toast-container" role="status">
          <div className={`toast ${toast.type}`}>
            <i
              className={`fas ${
                toast.type === 'success'
                  ? 'fa-check-circle'
                  : 'fa-exclamation-circle'
              }`}
              style={{
                color:
                  toast.type === 'success'
                    ? 'var(--green)'
                    : 'var(--red)',
              }}
            />
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
