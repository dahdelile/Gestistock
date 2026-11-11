// src/pages/UsersPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { usersApi } from '../api'; // Assurez-vous d'avoir créé usersApi dans api.js
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
    th_contact: 'Contact',
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
    // Modal Form
    modal_new: 'Nouvel utilisateur',
    modal_edit: 'Modifier l\'utilisateur',
    f_name: 'Nom complet',
    f_email: 'Adresse email',
    f_password: 'Mot de passe',
    f_password_hint: 'Laissez vide pour conserver le mot de passe actuel (en modification).',
    f_role: 'Rôle',
    f_status: 'Statut',
    // Delete Modal
    delete_title: 'Supprimer cet utilisateur ?',
    delete_warn: 'Cette action est irréversible. L\'utilisateur perdra immédiatement accès au système.',
    delete_confirm: 'Oui, supprimer',
    // Toast / Alertes
    ok_saved: 'Utilisateur enregistré avec succès.',
    ok_deleted: 'Utilisateur supprimé.',
    err_save: 'Erreur lors de l\'enregistrement.',
    err_delete: 'Erreur lors de la suppression.',
    err_load: 'Impossible de charger les utilisateurs.',
    switch_title: 'Changer de langue',
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
    th_contact: 'الاتصال',
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
    // Modal Form
    modal_new: 'مستخدم جديد',
    modal_edit: 'تعديل المستخدم',
    f_name: 'الاسم الكامل',
    f_email: 'البريد الإلكتروني',
    f_password: 'كلمة المرور',
    f_password_hint: 'اتركه فارغًا للاحتفاظ بكلمة المرور الحالية (عند التعديل).',
    f_role: 'الدور',
    f_status: 'الحالة',
    // Delete Modal
    delete_title: 'حذف هذا المستخدم؟',
    delete_warn: 'هذا الإجراء لا يمكن التراجع عنه. سيفقد المستخدم الوصول إلى النظام فوراً.',
    delete_confirm: 'نعم، احذف',
    // Toast
    ok_saved: 'تم حفظ المستخدم بنجاح.',
    ok_deleted: 'تم حذف المستخدم.',
    err_save: 'حدث خطأ أثناء الحفظ.',
    err_delete: 'حدث خطأ أثناء الحذف.',
    err_load: 'تعذّر تحميل المستخدمين.',
    switch_title: 'تغيير اللغة',
  }
};

const LANG_KEY = 'gestistock_lang';

const emptyForm = () => ({ name: '', email: '', password: '', role: 'cashier', status: 'active' });

const formatDate = (dateString, locale) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
};

const UsersPage = () => {
const { lang } = useLanguage(); // langue globale (menu)
const t = I18N[lang];
const cur = t.currency;
  useEffect(() => {
    try { localStorage.setItem(LANG_KEY, lang); } catch {}
  }, [lang]);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  // Notifications
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

  const handleOpenCreate = () => {
    setCurrentUser(null);
    setFormData(emptyForm());
    setShowForm(true);
  };

  const handleOpenEdit = (user) => {
    setCurrentUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '', // Toujours vide par sécurité
      role: user.role || 'cashier',
      status: user.status || 'active'
    });
    setShowForm(true);
  };

  const handleDeleteClick = (user) => {
    setCurrentUser(user);
    setShowDelete(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...formData };
      // Ne pas envoyer le mot de passe s'il est vide en mode édition
      if (currentUser && !payload.password) {
        delete payload.password;
      }
      
      if (currentUser) {
        await usersApi.update(currentUser.id, payload);
        showToast(t.ok_saved);
      } else {
        await usersApi.create(payload);
        showToast(t.ok_saved);
      }
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
    if (!currentUser) return;
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
    const roles = {
      admin: t.role_admin,
      manager: t.role_manager,
      cashier: t.role_cashier,
      stock: t.role_stock,
    };
    return roles[role] || role;
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'admin': return 'badge-rose';
      case 'manager': return 'badge-violet';
      case 'stock': return 'badge-amber';
      case 'cashier': 
      default: return 'badge-blue';
    }
  };

  const filteredUsers = useMemo(() => {
    const needle = search.toLowerCase();
    return users.filter(u => {
      const matchesSearch = !search || 
        (u.name || '').toLowerCase().includes(needle) || 
        (u.email || '').toLowerCase().includes(needle);
      const matchesRole = filterRole === 'all' || u.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [users, search, filterRole]);

  // =======================================================
  // AFFICHAGE
  // =======================================================
  return (
    <div className="ep-page" dir={t.dir} lang={lang}>
      {/* On importe FontAwesome au cas où il ne serait pas dans index.html */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      
      {/* Styles CSS intégrés pour que ça marche directement */}
      <style>{`
        .ep-page {
          --ink: #14213d; --muted: #66748b; --line: #e3e9f2; --bg: #f8fafc; --card: #fff;
          --primary: #1f5eea; --primary-soft: #e8efff;
          --green: #0f9d74; --green-soft: #def7ee;
          --violet: #6a4de0; --violet-soft: #ece8fd;
          --amber: #e08a0b; --amber-soft: #fff0d6;
          --red: #d63c4a; --red-soft: #fde8ea;
          --rose: #c2417c; --rose-soft: #fbe6f0;
          
          padding: 20px;
          background-color: var(--bg);
          color: var(--ink);
          font-family: Inter, 'Segoe UI', system-ui, sans-serif;
          min-height: 100vh;
        }
        .ep-page * { box-sizing: border-box; }
        
        .ep-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .ep-title h1 { margin: 0 0 8px 0; font-size: 28px; font-weight: 800; display: flex; align-items: center; gap: 12px; }
        .ep-title p { margin: 0; color: var(--muted); font-size: 19px; }
        
        .ep-btn-add { background: var(--primary); color: white; border: none; border-radius: 10px; padding: 12px 20px; font-weight: 600; font-size: 19px; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; box-shadow: 0 4px 12px rgba(31,94,234,0.2); }
        .ep-btn-add:hover { transform: translateY(-2px); filter: brightness(0.95); }
        
        .ep-card { background: var(--card); border: 1px solid var(--line); border-radius: 16px; overflow: hidden; box-shadow: 0 4px 14px rgba(20,33,61,0.03); }
        
        .ep-filters { padding: 16px 20px; border-bottom: 1px solid var(--line); display: flex; gap: 16px; flex-wrap: wrap; }
        .ep-input { height: 42px; border: 1px solid #d9e1ed; border-radius: 8px; padding: 0 16px; font-size: 19px; outline: none; transition: 0.2s; }
        .ep-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); }
        .ep-search-group { flex-grow: 1; min-width: 250px; position: relative; }
        .ep-search-group .ep-input { width: 100%; padding-left: 40px; }
        .ep-search-group i { position: absolute; left: 16px; top: 14px; color: var(--muted); }
        [dir="rtl"] .ep-search-group .ep-input { padding-left: 16px; padding-right: 40px; }
        [dir="rtl"] .ep-search-group i { left: auto; right: 16px; }
        
        .ep-table-wrap { overflow-x: auto; }
        .ep-table { width: 100%; min-width: 800px; border-collapse: collapse; }
        .ep-table th { background: #f8fafc; text-align: left; padding: 16px 20px; font-size: 19px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--line); white-space: nowrap; }
        [dir="rtl"] .ep-table th { text-align: right; }
        .ep-table td { padding: 16px 20px; border-bottom: 1px solid var(--line); font-size: 19px; vertical-align: middle; }
        .ep-table tr:last-child td { border-bottom: none; }
        .ep-table tr:hover td { background-color: #fbfcff; }
        
        .user-cell { display: flex; align-items: center; gap: 12px; }
        .user-avatar { width: 40px; height: 40px; border-radius: 10px; background: var(--primary-soft); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 20px; }
        .user-name { font-weight: 700; color: var(--ink); }
        .user-email { font-size: 13px; color: var(--muted); margin-top: 2px; }
        
        .ep-badge { display: inline-flex; align-items: center; padding: 6px 12px; border-radius: 99px; font-size: 18px; font-weight: 700; }
        .badge-blue { background: var(--primary-soft); color: var(--primary); }
        .badge-green { background: var(--green-soft); color: var(--green); }
        .badge-rose { background: var(--rose-soft); color: var(--rose); }
        .badge-violet { background: var(--violet-soft); color: var(--violet); }
        .badge-amber { background: var(--amber-soft); color: var(--amber); }
        .badge-gray { background: #f1f5f9; color: #64748b; }
        
        .status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 6px; }
        [dir="rtl"] .status-dot { margin-right: 0; margin-left: 6px; }
        .dot-green { background: var(--green); }
        .dot-gray { background: #94a3b8; }
        
        .ep-actions { display: flex; gap: 8px; justify-content: flex-end; }
        .btn-icon { width: 34px; height: 34px; border-radius: 8px; border: 1px solid transparent; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; background: transparent; }
        .btn-edit { background: var(--primary-soft); color: var(--primary); border-color: #c9daff; }
        .btn-edit:hover { background: var(--primary); color: white; }
        .btn-delete { background: var(--red-soft); color: var(--red); border-color: #f6c8cd; }
        .btn-delete:hover { background: var(--red); color: white; }
        
        /* Modales */
        .ep-modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.6); backdrop-filter: blur(4px); z-index: 1050; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .ep-modal { background: white; border-radius: 16px; width: 100%; max-width: 500px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); overflow: hidden; animation: modalIn 0.2s ease; }
        @keyframes modalIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .ep-modal-header { padding: 20px; border-bottom: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center; background: #f8fafc; }
        .ep-modal-header h3 { margin: 0; font-size: 20px; font-weight: 800; }
        .btn-close { background: transparent; border: none; font-size: 20px; cursor: pointer; color: var(--muted); }
        
        .ep-modal-body { padding: 20px; max-height: 70vh; overflow-y: auto; }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; font-size: 19px; font-weight: 700; color: #4b5b75; margin-bottom: 6px; }
        .form-control { width: 100%; height: 42px; border: 1px solid #d9e1ed; border-radius: 8px; padding: 0 14px; font-size: 14px; outline: none; transition: 0.2s; }
        .form-control:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); }
        .form-hint { font-size: 11px; color: var(--muted); margin-top: 4px; display: block; }
        
        .ep-modal-footer { padding: 16px 20px; border-top: 1px solid var(--line); display: flex; justify-content: flex-end; gap: 12px; background: #f8fafc; }
        .btn-cancel { background: white; border: 1px solid var(--line); color: var(--ink); padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; }
        .btn-save { background: var(--primary); border: none; color: white; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; }
        .btn-danger { background: var(--red); border: none; color: white; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; }
        
        .empty-state { text-align: center; padding: 60px 20px; color: var(--muted); }
        .empty-icon { width: 64px; height: 64px; background: var(--primary-soft); color: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 16px; }
        
        /* Toast */
        .toast-container { position: fixed; top: 20px; right: 20px; z-index: 1100; display: flex; flex-direction: column; gap: 10px; }
        [dir="rtl"] .toast-container { right: auto; left: 20px; }
        .toast { background: white; padding: 14px 20px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 12px; font-weight: 600; font-size: 19px; border-left: 4px solid var(--primary); animation: slideIn 0.3s ease; }
        .toast.success { border-left-color: var(--green); }
        .toast.danger { border-left-color: var(--red); }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>

      {/* Header */}
     
      {/* Header */}
      <div className="ep-header">
        <div className="ep-title">
          <h1>
            <i className="fas fa-users" style={{ color: 'var(--primary)' }}></i>
            {t.title}
          </h1>
          <p>{t.subtitle}</p>
        </div>

        <button
          type="button"
          className="ep-btn-add"
          onClick={handleOpenCreate}
        >
          <i className="fas fa-user-plus"></i>
          {t.add}
        </button>
      </div>

      {/* Erreur globale */}
      {error && (
        <div className="toast danger" style={{ position: 'relative', marginBottom: 20 }}>
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}

      {/* Panneau principal */}
      <div className="ep-card">
        {/* Barre de recherche et filtres */}
        <div className="ep-filters">
          <div className="ep-search-group">
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              className="ep-input" 
              placeholder={t.search_ph}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="ep-input" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
            <option value="all">{t.all_roles}</option>
            <option value="admin">{t.role_admin}</option>
            <option value="manager">{t.role_manager}</option>
            <option value="cashier">{t.role_cashier}</option>
            <option value="stock">{t.role_stock}</option>
          </select>
        </div>

        {/* Tableau */}
        <div className="ep-table-wrap">
          <table className="ep-table">
            <thead>
              <tr>
                <th>{t.th_name}</th>
                <th>{t.th_role}</th>
                <th>{t.th_status}</th>
                <th>{t.th_date}</th>
                <th style={{ textAlign: 'right' }}>{t.th_actions}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="empty-state">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p style={{ marginTop: 10 }}>{t.loading}</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-state">
                    <div className="empty-icon"><i className="fas fa-user-slash"></i></div>
                    <h4 style={{ margin: '0 0 8px 0', color: 'var(--ink)' }}>{t.none}</h4>
                    <button className="btn-save" onClick={handleOpenCreate} style={{ marginTop: 10 }}>{t.add}</button>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="user-name">{user.name}</div>
                          <div className="user-email"><i className="fas fa-envelope" style={{ fontSize: 11, marginRight: 4 }}></i> {user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`ep-badge ${getRoleColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
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
                    <td>
                      <div className="ep-actions">
                        <button className="btn-icon btn-edit" onClick={() => handleOpenEdit(user)} title={t.edit}>
                          <i className="fas fa-pen"></i>
                        </button>
                        <button className="btn-icon btn-delete" onClick={() => handleDeleteClick(user)} title={t.delete}>
                          <i className="fas fa-trash-alt"></i>
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

      {/* Modal Formulaire */}
      {showForm && (
        <div className="ep-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="ep-modal" dir={t.dir}>
            <div className="ep-modal-header">
              <h3>{currentUser ? t.modal_edit : t.modal_new}</h3>
              <button className="btn-close" onClick={() => setShowForm(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="ep-modal-body">
                <div className="form-group">
                  <label>{t.f_name}</label>
                  <input type="text" className="form-control" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>{t.f_email}</label>
                  <input type="email" className="form-control" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} dir="ltr" style={{ textAlign: t.dir === 'rtl' ? 'right' : 'left' }} />
                </div>
                <div className="form-group">
                  <label>{t.f_password}</label>
                  <input type="password" className="form-control" required={!currentUser} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} dir="ltr" />
                  {currentUser && <span className="form-hint">{t.f_password_hint}</span>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label>{t.f_role}</label>
                    <select className="form-control" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                      <option value="admin">{t.role_admin}</option>
                      <option value="manager">{t.role_manager}</option>
                      <option value="cashier">{t.role_cashier}</option>
                      <option value="stock">{t.role_stock}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t.f_status}</label>
                    <select className="form-control" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="active">{t.active}</option>
                      <option value="inactive">{t.inactive}</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="ep-modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>{t.cancel}</button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? <><i className="fas fa-spinner fa-spin"></i> {t.saving}</> : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Suppression */}
      {showDelete && currentUser && (
        <div className="ep-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowDelete(false)}>
          <div className="ep-modal" dir={t.dir} style={{ maxWidth: 400 }}>
            <div className="ep-modal-body" style={{ textAlign: 'center', paddingTop: 32 }}>
              <div className="empty-icon" style={{ background: 'var(--red-soft)', color: 'var(--red)' }}>
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h3 style={{ margin: '0 0 10px 0', fontSize: 20 }}>{t.delete_title}</h3>
              <p style={{ color: 'var(--muted)', margin: '0 0 16px 0' }}>{t.delete_warn}</p>
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, fontWeight: 700, marginBottom: 20 }}>
                {currentUser.name} <br/><span style={{ fontWeight: 400, fontSize: 13, color: 'var(--muted)' }}>{currentUser.email}</span>
              </div>
            </div>
            <div className="ep-modal-footer" style={{ justifyContent: 'center' }}>
              <button className="btn-cancel" onClick={() => setShowDelete(false)}>{t.cancel}</button>
              <button className="btn-danger" onClick={handleDeleteConfirm} disabled={saving}>
                 {saving ? <i className="fas fa-spinner fa-spin"></i> : t.delete_confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className="toast-container">
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