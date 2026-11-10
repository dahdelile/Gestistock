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
        
/* =========================================
   TYPOGRAPHIE — Tailles équilibrées
========================================= */

.ep-eyebrow {
  font-size: 11px;
  letter-spacing: 1.4px;
}

.ep-title h1 {
  font-size: clamp(21px, 2.2vw, 27px);
}

.ep-title p {
  font-size: 13px;
  line-height: 1.7;
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

.ep-reset {
  font-size: 12px;
  font-weight: 700;
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

.ep-btn {
  font-size: 13px;
}

.ep-delete-body p {
  font-size: 13px;
}

.ep-form-group input,
.ep-form-group select,
.ep-form-group textarea {
  font-size: 14px;
}

/* =========================================
   STATISTIQUES — Responsive 3 / 2 / 1
========================================= */

.ep-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 20px;
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
   FILTRES — Responsive
========================================= */

.ep-filters {
  display: grid;
  grid-template-columns: minmax(180px, 2fr) minmax(140px, 1.2fr) minmax(130px, 1fr) minmax(130px, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 15px 18px;
}

.ep-filter-input {
  width: 100%;
  min-width: 0;
  height: 40px;
  padding: 0 10px;
}

.ep-reset {
  height: 40px;
  padding: 0 12px;
  white-space: nowrap;
}

@media (max-width: 1100px) {
  .ep-filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .ep-filters > :first-child {
    grid-column: 1 / -1;
  }
}

@media (max-width: 560px) {
  .ep-filters {
    grid-template-columns: 1fr;
    padding: 13px;
  }

  .ep-filters > :first-child {
    grid-column: auto;
  }

  .ep-reset {
    width: 100%;
  }
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