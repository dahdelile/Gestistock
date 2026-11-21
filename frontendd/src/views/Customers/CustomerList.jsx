// src/pages/CustomersPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { customersApi } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import {
  Table, Button, Card, Spinner, Badge, Form, Modal,
  Alert, Row, Col, InputGroup
} from 'react-bootstrap';
import {
  FaUsers, FaCoins, FaExclamationTriangle, FaPlus,
  FaEdit, FaTrash, FaSearch, FaTimes
} from 'react-icons/fa';

/* =========================================================
   TRADUCTIONS / الترجمة
========================================================= */
const I18N = {
  fr: {
    dir: 'ltr', locale: 'fr-FR', currency: 'MRU',
    title: 'Gestion des clients', subtitle: 'Gérez vos clients, leurs coordonnées et leurs soldes.',
    add: 'Nouveau client',
    stat_total: 'Total des clients', records: (n) => `${n} client(s)`,
    stat_debt: 'Total des dettes', stat_debt_sub: 'Montants à recevoir',
    stat_with_debt: 'Clients avec dette', with_debt_sub: 'Soldes non nuls',
    search_ph: 'Rechercher par nom ou téléphone...',
    th_name: 'Nom', th_phone: 'Téléphone', th_email: 'Email',
    th_address: 'Adresse', th_balance: 'Solde (Dette)', th_actions: 'Actions',
    loading: 'Chargement...', none: 'Aucun client trouvé.',
    edit: 'Modifier', delete: 'Supprimer',
    modal_edit: 'Modifier le client', modal_new: 'Nouveau client',
    f_name: 'Nom du client', f_name_ph: 'Ex : Ahmed Ould Mohamed',
    f_phone: 'Téléphone', f_phone_ph: 'Ex : 222 XX XX XX XX',
    f_email: 'Email', f_email_ph: 'Ex : email@exemple.com',
    f_address: 'Adresse', f_address_ph: 'Adresse complète...',
    f_balance: 'Solde initial (Dette)', f_balance_hint: 'Mettez 0 si aucune dette initiale.',
    cancel: 'Annuler', save: 'Enregistrer', saving: 'Enregistrement...',
    delete_title: 'Supprimer ce client ?', delete_warn: 'Cette action est irréversible.',
    delete_confirm: 'Oui, supprimer', deleting: 'Suppression...',
    err_load: 'Impossible de charger les clients.', err_save: "Erreur lors de l'enregistrement.",
    err_delete: 'Erreur lors de la suppression.', close: 'Fermer', retry: 'Réessayer',
    no_debt: 'Aucune dette',
  },
  ar: {
    dir: 'rtl', locale: 'ar-u-nu-latn', currency: 'أوقية',
    title: 'إدارة العملاء', subtitle: 'أدر عملاءك، بياناتهم، وأرصدتهم.',
    add: 'عميل جديد',
    stat_total: 'إجمالي العملاء', records: (n) => `${n} عميل`,
    stat_debt: 'إجمالي الديون', stat_debt_sub: 'مبالغ مستحقة',
    stat_with_debt: 'عملاء لديهم ديون', with_debt_sub: 'أرصدة غير صفرية',
    search_ph: 'ابحث بالاسم أو رقم الهاتف...',
    th_name: 'الاسم', th_phone: 'الهاتف', th_email: 'البريد الإلكتروني',
    th_address: 'العنوان', th_balance: 'الرصيد (الدين)', th_actions: 'إجراءات',
    loading: 'جارٍ التحميل...', none: 'لا يوجد عملاء.',
    edit: 'تعديل', delete: 'حذف',
    modal_edit: 'تعديل بيانات العميل', modal_new: 'عميل جديد',
    f_name: 'اسم العميل', f_name_ph: 'مثال: أحمد ولد محمد',
    f_phone: 'الهاتف', f_phone_ph: 'مثال: 222 XX XX XX XX',
    f_email: 'البريد الإلكتروني', f_email_ph: 'مثال: email@exemple.com',
    f_address: 'العنوان', f_address_ph: 'العنوان الكامل...',
    f_balance: 'الرصيد الافتتاحي (الدين)', f_balance_hint: 'أدخل 0 إذا لم يكن عليه ديون سابقة.',
    cancel: 'إلغاء', save: 'حفظ', saving: 'جارٍ الحفظ...',
    delete_title: 'حذف هذا العميل؟', delete_warn: 'لا يمكن التراجع عن هذا الإجراء.',
    delete_confirm: 'نعم، احذف', deleting: 'جارٍ الحذف...',
    err_load: 'تعذّر تحميل العملاء.', err_save: 'حدث خطأ أثناء الحفظ.',
    err_delete: 'حدث خطأ أثناء الحذف.', close: 'إغلاق', retry: 'إعادة المحاولة',
    no_debt: 'لا توجد ديون',
  },
};

/* =========================================================
   UTILITAIRES
========================================================= */
const formatMoney = (value) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(value) || 0);

const emptyForm = () => ({ name: '', phone: '', email: '', address: '', balance: 0 });

/* =========================================================
   COMPOSANT PRINCIPAL
========================================================= */
const CustomersPage = () => {
  const { lang } = useLanguage();
  const t = I18N[lang];

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState('');
  const [formErrorKey, setFormErrorKey] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    if (!showForm && !showDeleteModal) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closeModals();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showForm, showDeleteModal]);

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
    if (e) e.preventDefault();
    setSaving(true);
    setFormErrorKey('');
    try {
      const payload = { ...formData, balance: parseFloat(formData.balance) || 0 };
      if (currentCustomer) {
        await customersApi.update(currentCustomer.id, payload);
      } else {
        await customersApi.create(payload);
      }
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

  const filteredCustomers = useMemo(() => {
    const needle = search.toLowerCase();
    return customers
      .filter((c) => {
        const matchSearch = !search || (c.name || '').toLowerCase().includes(needle) || (c.phone || '').includes(needle);
        return matchSearch;
      })
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [customers, search]);

  const stats = useMemo(() => {
    const total = customers.length;
    const totalDebt = customers.reduce((sum, c) => sum + (Number(c.balance) > 0 ? Number(c.balance) : 0), 0);
    const withDebt = customers.filter((c) => Number(c.balance) > 0).length;
    return { total, totalDebt, withDebt };
  }, [customers]);

  const hasFilters = Boolean(search);

  return (
    <div className="container-fluid py-4 customers-compact" dir={t.dir} lang={lang}>
      {/* ====== STATISTIQUES : 3 en ligne horizontale sur mobile (4+4+4=12) ====== */}
      <Row className="mb-4">
        <Col xs={4} md={4}>
          <Card className="bg-primary text-white shadow-sm">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-0">{t.stat_total}</h6>
                <h2 className="mb-0">{stats.total}</h2>
                <small className="d-block" style={{ fontSize: '0.65rem', opacity: 0.9 }}>{t.records(stats.total)}</small>
              </div>
              <FaUsers size={32} />
            </Card.Body>
          </Card>
        </Col>
        <Col xs={4} md={4}>
          <Card className="bg-warning text-dark shadow-sm">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-0">{t.stat_debt}</h6>
                <h2 className="mb-0">{formatMoney(stats.totalDebt)}</h2>
                <small className="d-block" style={{ fontSize: '0.65rem' }}>{t.stat_debt_sub}</small>
              </div>
              <FaCoins size={32} />
            </Card.Body>
          </Card>
        </Col>
        <Col xs={4} md={4}>
          <Card className="bg-info text-white shadow-sm">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-0">{t.stat_with_debt}</h6>
                <h2 className="mb-0">{stats.withDebt}</h2>
                <small className="d-block" style={{ fontSize: '0.65rem', opacity: 0.9 }}>{t.with_debt_sub}</small>
              </div>
              <FaExclamationTriangle size={32} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ====== CARTE PRINCIPALE ====== */}
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h3 className="mb-0 d-flex align-items-center">
              <FaUsers className="me-2" />
              {t.title}
            </h3>
            <div className="d-flex align-items-center gap-2">
              <Button variant="success" onClick={handleOpenCreate}>
                <FaPlus className="me-1" /> {t.add}
              </Button>
            </div>
          </div>
        </Card.Header>

        <Card.Body>
          {errorKey && (
            <Alert variant="danger" className="mb-3">
              <FaExclamationTriangle className="me-2" />{t[errorKey]}
              <Button variant="outline-danger" size="sm" className="ms-2" onClick={fetchCustomers}>{t.retry}</Button>
            </Alert>
          )}

          {/* Filtres */}
          <Row className="mb-3">
            <Col md={10}>
              <Form.Group>
                <Form.Label className="fw-bold"><FaSearch className="me-2" />Recherche</Form.Label>
                <InputGroup>
                  <Form.Control 
                    type="search" 
                    placeholder={t.search_ph} 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                  />
                  {search && (
                    <Button variant="outline-secondary" onClick={() => setSearch('')}>
                      <FaTimes />
                    </Button>
                  )}
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={2} className="d-flex align-items-end">
              {hasFilters && (
                <Button variant="outline-secondary" className="w-100" onClick={() => setSearch('')}>
                  <FaTimes className="me-1" /> {t.close}
                </Button>
              )}
            </Col>
          </Row>

          {/* Tableau */}
          <div className="table-responsive">
            <Table striped bordered hover className="mb-0">
              <thead className="table-dark">
                <tr>
                  <th>{t.th_name}</th>
                  <th>{t.th_phone}</th>
                  <th>{t.th_email}</th>
                  <th>{t.th_address}</th>
                  <th className="text-end">{t.th_balance}</th>
                  <th className="text-center">{t.th_actions}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <Spinner animation="border" variant="primary" />
                      <p className="mt-2">{t.loading}</p>
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      <FaUsers className="mb-3" size={40} />
                      <h5>{t.none}</h5>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => (
                    <tr key={c.id}>
                      <td className="fw-bold">{c.name}</td>
                      <td dir="ltr" style={{ textAlign: t.dir === 'rtl' ? 'right' : 'left' }}>{c.phone || '—'}</td>
                      <td>{c.email || '—'}</td>
                      <td>{c.address || '—'}</td>
                      <td className="text-end">
                        <Badge bg={Number(c.balance) > 0 ? 'danger' : 'success'}>
                          {Number(c.balance) > 0 ? formatMoney(c.balance) : t.no_debt}
                        </Badge>
                      </td>
                      <td className="text-center">
                        <div className="d-flex gap-1 justify-content-center">
                          <Button variant="outline-primary" size="sm" onClick={() => handleOpenEdit(c)} title={t.edit}>
                            <FaEdit />
                          </Button>
                          <Button variant="outline-danger" size="sm" onClick={() => handleDeleteClick(c)} title={t.delete}>
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
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
            <FaUsers className="me-2" />
            {currentCustomer ? t.modal_edit : t.modal_new}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formErrorKey && <Alert variant="danger">{t[formErrorKey]}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">{t.f_name}</Form.Label>
              <Form.Control type="text" placeholder={t.f_name_ph} required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">{t.f_phone}</Form.Label>
              <Form.Control type="text" placeholder={t.f_phone_ph} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} dir="ltr" style={{ textAlign: t.dir === 'rtl' ? 'right' : 'left' }} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">{t.f_email}</Form.Label>
              <Form.Control type="email" placeholder={t.f_email_ph} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} dir="ltr" style={{ textAlign: t.dir === 'rtl' ? 'right' : 'left' }} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">{t.f_address}</Form.Label>
              <Form.Control as="textarea" rows={2} placeholder={t.f_address_ph} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">{t.f_balance}</Form.Label>
              <Form.Control type="number" min="0" step="0.01" value={formData.balance} onChange={(e) => setFormData({ ...formData, balance: e.target.value })} dir="ltr" style={{ textAlign: t.dir === 'rtl' ? 'right' : 'left' }} />
              <Form.Text className="text-muted">{t.f_balance_hint}</Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModals} disabled={saving}>{t.cancel}</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <Spinner size="sm" className="me-2" /> : <FaUsers className="me-2" />}
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
        .customers-compact .card.bg-primary h6, .customers-compact .card.bg-warning h6, .customers-compact .card.bg-info h6 { 
          font-size: 0.75rem !important; 
        }
        .customers-compact .card.bg-primary h2, .customers-compact .card.bg-warning h2, .customers-compact .card.bg-info h2 { 
          font-size: 1.25rem !important; 
        }
        .customers-compact .card-header h3 { font-size: 1.1rem !important; }
        .customers-compact .form-label { font-size: 0.8rem !important; margin-bottom: 0.25rem !important; }
        .customers-compact .table th, .customers-compact .table td { font-size: 0.85rem !important; padding: 0.5rem 0.75rem !important; }
        .customers-compact .btn { font-size: 0.85rem !important; }
        .customers-compact .badge { font-size: 0.75rem !important; }
      `}</style>
    </div>
  );
};

export default CustomersPage;