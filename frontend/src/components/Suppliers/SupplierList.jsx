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
        
/* =========================================
   TYPOGRAPHIE — Design unifié
========================================= */

.ep-eyebrow {
  font-size: 11px;
  letter-spacing: 1.4px;
}

.ep-title h1 {
  font-size: clamp(21px, 2.2vw, 27px);
}

.ep-title-icon {
  font-size: 18px;
}

.ep-title p {
  font-size: 13px;
  line-height: 1.7;
}

.ep-btn-add {
  font-size: 13px;
}

.ep-alert {
  font-size: 13px;
}

.ep-card-info h3 {
  font-size: 13px;
  line-height: 1.6;
}

.ep-card-info .sub {
  font-size: 12px;
}

.ep-card-info .value {
  font-size: clamp(21px, 2vw, 26px);
}

.ep-filter-input {
  font-size: 13px;
}

.ep-table th {
  font-size: 12px;
  letter-spacing: 0;
}

.ep-table td {
  font-size: 13px;
}

.ep-badge {
  font-size: 12px;
  padding: 5px 10px;
}

.btn-icon {
  font-size: 14px;
}

.ep-modal-header h3 {
  font-size: 19px;
}

.ep-form-group label {
  font-size: 13px;
}

.ep-hint {
  font-size: 12px;
  line-height: 1.7;
}

.ep-btn {
  font-size: 13px;
}

.ep-delete-body p {
  font-size: 13px;
}

/* =========================================
   STATISTIQUES — Responsive
========================================= */

.ep-stats {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 900px) {
  .ep-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .ep-stats {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .ep-card {
    padding: 16px;
  }
}

/* =========================================
   RECHERCHE ET FILTRES
========================================= */

.ep-filters {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 15px 18px;
}

.ep-filter-input {
  min-width: 0;
  height: 40px;
  padding: 0 12px;
}

.ep-reset {
  height: 40px;
  padding: 0 13px;
  font-size: 12px;
}

@media (max-width: 560px) {
  .ep-filters {
    grid-template-columns: 1fr;
    padding: 13px;
  }

  .ep-reset {
    width: 100%;
  }
}

/* =========================================
   MOBILE + RTL / LTR
========================================= */

.expenses-page {
  width: 100%;
  min-width: 0;
}

.expenses-page[dir="rtl"] {
  text-align: right;
}

.expenses-page[dir="ltr"] {
  text-align: left;
}

.ep-table-wrap {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.ep-table {
  min-width: 760px;
}

.ep-modal-overlay {
  overflow-y: auto;
}

@media (max-width: 560px) {
  .expenses-page {
    padding: 12px;
  }

  .ep-hero {
    padding: 18px;
    gap: 14px;
  }

  .ep-title h1 {
    font-size: 21px;
  }

  .ep-hero-actions {
    width: 100%;
  }

  .ep-btn-add {
    width: 100%;
    justify-content: center;
  }

  .ep-modal-overlay {
    padding: 10px;
  }

  .ep-modal-body {
    padding: 16px;
  }

  .ep-modal-header {
    padding: 15px 16px;
  }

  .ep-modal-footer {
    padding: 12px 16px;
    flex-wrap: wrap;
  }

  .ep-btn {
    flex: 1;
  }

  .ep-grid2 {
    grid-template-columns: 1fr;
  }
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