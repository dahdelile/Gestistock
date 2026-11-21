// src/pages/ExpensesPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { expensesApi } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import {
  Table, Button, Card, Spinner, Badge, Form, Modal,
  Alert, Row, Col, InputGroup
} from 'react-bootstrap';
import {
  FaFileInvoiceDollar, FaReceipt, FaCalendarAlt, FaTags,
  FaPlus, FaEdit, FaTrash, FaSearch, FaTimes
} from 'react-icons/fa';

/* =========================================================
   TRADUCTIONS / الترجمة
========================================================= */
const I18N = {
  fr: {
    dir: 'ltr', locale: 'fr-FR', currency: 'MRU',
    title: 'Gestion des dépenses', subtitle: 'Suivez et gérez toutes les charges de votre commerce.',
    add: 'Nouvelle dépense',
    stat_total: 'Total des dépenses', stat_total_sub: 'Montant filtré',
    stat_month: 'Dépenses du mois', current_month: 'Mois en cours',
    stat_categories: 'Catégories', expense_types: 'Types de dépenses',
    search_ph: 'Rechercher par catégorie ou description...',
    all_categories: 'Toutes les catégories',
    start_date: 'Date de début', end_date: 'Date de fin', reset: 'Réinitialiser',
    th_date: 'Date', th_category: 'Catégorie', th_description: 'Description',
    th_amount: 'Montant', th_actions: 'Actions',
    loading: 'Chargement...', none: 'Aucune dépense trouvée.',
    general: 'Général', edit: 'Modifier', delete: 'Supprimer',
    modal_edit: 'Modifier la dépense', modal_new: 'Nouvelle dépense',
    f_date: 'Date', f_category: 'Catégorie', f_category_ph: 'Ex : Loyer, Électricité...',
    f_description: 'Description (optionnel)', f_description_ph: 'Détails de la dépense...',
    f_amount: 'Montant (MRU)',
    cancel: 'Annuler', save: 'Enregistrer', saving: 'Enregistrement...',
    delete_title: 'Supprimer cette dépense ?', delete_warn: 'Cette action est irréversible.',
    delete_confirm: 'Oui, supprimer', deleting: 'Suppression...',
    err_load: 'Impossible de charger les dépenses.', err_save: "Erreur lors de l'enregistrement.",
    err_delete: 'Erreur lors de la suppression.', close: 'Fermer', retry: 'Réessayer',
  },
  ar: {
    dir: 'rtl', locale: 'ar-u-nu-latn', currency: 'أوقية',
    title: 'إدارة المصروفات', subtitle: 'تابع وأدر جميع أعباء تجارتك.',
    add: 'مصروف جديد',
    stat_total: 'إجمالي المصروفات', stat_total_sub: 'المبلغ المصفي',
    stat_month: 'مصروفات الشهر', current_month: 'الشهر الحالي',
    stat_categories: 'الفئات', expense_types: 'أنواع المصروفات',
    search_ph: 'بحث بالفئة أو الوصف...',
    all_categories: 'كل الفئات',
    start_date: 'تاريخ البداية', end_date: 'تاريخ النهاية', reset: 'إعادة تعيين',
    th_date: 'التاريخ', th_category: 'الفئة', th_description: 'الوصف',
    th_amount: 'المبلغ', th_actions: 'إجراءات',
    loading: 'جارٍ التحميل...', none: 'لا توجد مصروفات.',
    general: 'عام', edit: 'تعديل', delete: 'حذف',
    modal_edit: 'تعديل المصروف', modal_new: 'مصروف جديد',
    f_date: 'التاريخ', f_category: 'الفئة', f_category_ph: 'مثال: إيجار، كهرباء...',
    f_description: 'الوصف (اختياري)', f_description_ph: 'تفاصيل المصروف...',
    f_amount: 'المبلغ (أوقية)',
    cancel: 'إلغاء', save: 'حفظ', saving: 'جارٍ الحفظ...',
    delete_title: 'حذف هذا المصروف؟', delete_warn: 'لا يمكن التراجع عن هذا الإجراء.',
    delete_confirm: 'نعم، احذف', deleting: 'جارٍ الحذف...',
    err_load: 'تعذّر تحميل المصروفات.', err_save: 'حدث خطأ أثناء الحفظ.',
    err_delete: 'حدث خطأ أثناء الحذف.', close: 'إغلاق', retry: 'إعادة المحاولة',
  },
};

/* =========================================================
   UTILITAIRES
========================================================= */
const pad = (n) => String(n).padStart(2, '0');
const todayValue = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

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

// Attribution d'une couleur Bootstrap standard basée sur le nom de la catégorie
const getBadgeColor = (name = '') => {
  const tones = ['primary', 'info', 'success', 'warning', 'danger', 'secondary'];
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return tones[hash % tones.length];
};

/* =========================================================
   COMPOSANT PRINCIPAL
========================================================= */
const ExpensesPage = () => {
  const { lang } = useLanguage();
  const t = I18N[lang];

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState('');
  const [formErrorKey, setFormErrorKey] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [currentExpense, setCurrentExpense] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    if (!showForm && !showDeleteModal) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closeModals();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showForm, showDeleteModal]);

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
    if (e) e.preventDefault();
    setSaving(true);
    setFormErrorKey('');
    try {
      const payload = { ...formData, amount: parseFloat(formData.amount) || 0 };
      if (currentExpense) {
        await expensesApi.update(currentExpense.id, payload);
      } else {
        await expensesApi.create(payload);
      }
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

  const filteredExpenses = useMemo(() => {
    const needle = search.toLowerCase();
    return expenses
      .filter((exp) => {
        const matchSearch = !search || (exp.description || '').toLowerCase().includes(needle) || (exp.category || '').toLowerCase().includes(needle);
        const matchCategory = filterCategory === 'all' || exp.category === filterCategory;
        const key = getDateKey(exp.date || exp.created_at);
        const matchStart = !startDate || key >= startDate;
        const matchEnd = !endDate || key <= endDate;
        return matchSearch && matchCategory && matchStart && matchEnd;
      })
      .sort((a, b) => getDateKey(b.date || b.created_at).localeCompare(getDateKey(a.date || a.created_at)));
  }, [expenses, search, filterCategory, startDate, endDate]);

  const categories = useMemo(() => [...new Set(expenses.map((e) => e.category).filter(Boolean))], [expenses]);

  const stats = useMemo(() => {
    const total = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const currentMonth = todayValue().slice(0, 7);
    const monthly = expenses
      .filter((e) => getDateKey(e.date || e.created_at).slice(0, 7) === currentMonth)
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
    return { total, monthly, count: filteredExpenses.length };
  }, [expenses, filteredExpenses]);

  const hasFilters = Boolean(search || startDate || endDate || filterCategory !== 'all');

  return (
    <div className="container-fluid py-4 expenses-compact" dir={t.dir} lang={lang}>
      {/* ====== STATISTIQUES : 3 en ligne horizontale sur mobile (4+4+4=12) ====== */}
      <Row className="mb-4">
        <Col xs={4} md={4}>
          <Card className="bg-warning text-dark shadow-sm">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-0">{t.stat_total}</h6>
                <h2 className="mb-0">{formatMoney(stats.total)}</h2>
                <small className="d-block" style={{ fontSize: '0.65rem' }}>{t.stat_total_sub}</small>
              </div>
              <FaReceipt size={32} />
            </Card.Body>
          </Card>
        </Col>
        <Col xs={4} md={4}>
          <Card className="bg-info text-white shadow-sm">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-0">{t.stat_month}</h6>
                <h2 className="mb-0">{formatMoney(stats.monthly)}</h2>
                <small className="d-block" style={{ fontSize: '0.65rem', opacity: 0.9 }}>{t.current_month}</small>
              </div>
              <FaCalendarAlt size={32} />
            </Card.Body>
          </Card>
        </Col>
        <Col xs={4} md={4}>
          <Card className="bg-primary text-white shadow-sm">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-0">{t.stat_categories}</h6>
                <h2 className="mb-0">{categories.length}</h2>
                <small className="d-block" style={{ fontSize: '0.65rem', opacity: 0.9 }}>{t.expense_types}</small>
              </div>
              <FaTags size={32} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ====== CARTE PRINCIPALE ====== */}
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h3 className="mb-0 d-flex align-items-center">
              <FaFileInvoiceDollar className="me-2" />
              {t.title}
            </h3>
            <Button variant="success" onClick={handleOpenCreate}>
              <FaPlus className="me-1" /> {t.add}
            </Button>
          </div>
        </Card.Header>

        <Card.Body>
          {errorKey && (
            <Alert variant="danger" className="mb-3">
              <FaTimes className="me-2" />{t[errorKey]}
              <Button variant="outline-danger" size="sm" className="ms-2" onClick={fetchExpenses}>{t.retry}</Button>
            </Alert>
          )}

          {/* Filtres */}
          <Row className="mb-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-bold"><FaSearch className="me-2" />Recherche</Form.Label>
                <InputGroup>
                  <Form.Control type="search" placeholder={t.search_ph} value={search} onChange={(e) => setSearch(e.target.value)} />
                  {search && (
                    <Button variant="outline-secondary" onClick={() => setSearch('')}>
                      <FaTimes />
                    </Button>
                  )}
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-bold">{t.th_category}</Form.Label>
                <Form.Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                  <option value="all">{t.all_categories}</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="fw-bold">{t.start_date}</Form.Label>
                <Form.Control type="date" value={startDate} max={endDate || undefined} onChange={(e) => setStartDate(e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="fw-bold">{t.end_date}</Form.Label>
                <Form.Control type="date" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={1} className="d-flex align-items-end">
              {hasFilters && (
                <Button variant="outline-secondary" className="w-100" onClick={() => { setSearch(''); setStartDate(''); setEndDate(''); setFilterCategory('all'); }}>
                  <FaTimes />
                </Button>
              )}
            </Col>
          </Row>

          {/* Tableau */}
          <div className="table-responsive">
            <Table striped bordered hover className="mb-0">
              <thead className="table-dark">
                <tr>
                  <th>{t.th_date}</th>
                  <th>{t.th_category}</th>
                  <th>{t.th_description}</th>
                  <th className="text-end">{t.th_amount}</th>
                  <th className="text-center">{t.th_actions}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-5">
                      <Spinner animation="border" variant="primary" />
                      <p className="mt-2">{t.loading}</p>
                    </td>
                  </tr>
                ) : filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted">
                      <FaFileInvoiceDollar className="mb-3" size={40} />
                      <h5>{t.none}</h5>
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => {
                    const category = exp.category || t.general;
                    return (
                      <tr key={exp.id}>
                        <td><bdi>{formatDate(exp.date || exp.created_at, t.locale)}</bdi></td>
                        <td>
                          <Badge bg={getBadgeColor(category)}>{category}</Badge>
                        </td>
                        <td style={{ maxWidth: 300, overflowWrap: 'anywhere' }}>{exp.description || '—'}</td>
                        <td className="text-end fw-bold text-danger">{formatMoney(exp.amount)} {t.currency}</td>
                        <td className="text-center">
                          <div className="d-flex gap-1 justify-content-center">
                            <Button variant="outline-primary" size="sm" onClick={() => handleOpenEdit(exp)} title={t.edit}>
                              <FaEdit />
                            </Button>
                            <Button variant="outline-danger" size="sm" onClick={() => handleDeleteClick(exp)} title={t.delete}>
                              <FaTrash />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* ====== MODAL FORMULAIRE ====== */}
      <Modal show={showForm} onHide={closeModals}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaFileInvoiceDollar className="me-2" />
            {currentExpense ? t.modal_edit : t.modal_new}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formErrorKey && <Alert variant="danger">{t[formErrorKey]}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">{t.f_date}</Form.Label>
              <Form.Control type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">{t.f_category}</Form.Label>
              <Form.Control type="text" placeholder={t.f_category_ph} required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} list="categories-list" />
              <datalist id="categories-list">
                {categories.map((c) => <option key={c} value={c} />)}
              </datalist>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">{t.f_description}</Form.Label>
              <Form.Control as="textarea" rows={2} placeholder={t.f_description_ph} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">{t.f_amount}</Form.Label>
              <Form.Control type="number" min="0" step="0.01" required value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModals} disabled={saving}>{t.cancel}</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <Spinner size="sm" className="me-2" /> : <FaFileInvoiceDollar className="me-2" />}
            {t.save}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ====== MODAL SUPPRESSION ====== */}
      <Modal show={showDeleteModal} onHide={closeModals}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaTrash className="me-2 text-danger" />
            {t.delete_title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{t.delete_warn}</p>
          {formErrorKey && <Alert variant="danger">{t[formErrorKey]}</Alert>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModals} disabled={saving}>{t.cancel}</Button>
          <Button variant="danger" onClick={handleDeleteConfirm} disabled={saving}>
            {saving ? <Spinner size="sm" className="me-2" /> : <FaTrash className="me-2" />}
            {t.delete_confirm}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ====== STYLE COMPACT POUR RÉDUIRE LA TAILLE DU TEXTE ====== */}
      <style>{`
        .expenses-compact .card.bg-warning h6, .expenses-compact .card.bg-info h6, .expenses-compact .card.bg-primary h6 { 
          font-size: 0.75rem !important; 
        }
        .expenses-compact .card.bg-warning h2, .expenses-compact .card.bg-info h2, .expenses-compact .card.bg-primary h2 { 
          font-size: 1.25rem !important; 
        }
        .expenses-compact .card-header h3 { font-size: 1.1rem !important; }
        .expenses-compact .form-label { font-size: 0.8rem !important; margin-bottom: 0.25rem !important; }
        .expenses-compact .table th, .expenses-compact .table td { font-size: 0.85rem !important; padding: 0.5rem 0.75rem !important; }
        .expenses-compact .btn { font-size: 0.85rem !important; }
        .expenses-compact .badge { font-size: 0.75rem !important; }
      `}</style>
    </div>
  );
};

export default ExpensesPage;