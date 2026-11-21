// src/pages/SuppliersPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { suppliersApi } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import {
  Table, Button, Card, Spinner, Badge, Form, Modal,
  Alert, Row, Col, InputGroup
} from 'react-bootstrap';
import {
  FaTruck, FaMoneyBillWave, FaExclamationTriangle, FaPlus,
  FaEdit, FaTrash, FaSearch, FaTimes, FaUserShield, FaUser
} from 'react-icons/fa';

/* =========================================================
   TRADUCTIONS / الترجمة
========================================================= */
const I18N = {
  fr: {
    dir: 'ltr', locale: 'fr-FR', currency: 'MRU',
    title: 'Gestion des fournisseurs', subtitle: 'Gérez vos fournisseurs, leurs coordonnées et vos dettes envers eux.',
    add: 'Nouveau fournisseur',
    stat_total: 'Total fournisseurs', records: (n) => `${n} fournisseur(s)`,
    stat_payable: 'Total à payer', stat_payable_sub: 'Montants dus aux fournisseurs',
    stat_with_debt: 'À payer', with_debt_sub: 'Soldes non nuls',
    search_ph: 'Rechercher par nom, société ou téléphone...',
    th_name: 'Nom / Société', th_contact: 'Contact', th_phone: 'Téléphone',
    th_email: 'Email', th_address: 'Adresse', th_balance: 'Solde à payer', th_actions: 'Actions',
    loading: 'Chargement...', none: 'Aucun fournisseur trouvé.',
    edit: 'Modifier', delete: 'Supprimer',
    modal_edit: 'Modifier le fournisseur', modal_new: 'Nouveau fournisseur',
    f_name: 'Nom du fournisseur / société', f_name_ph: 'Ex : Société Import SARL',
    f_contact: 'Personne de contact', f_contact_ph: 'Ex : Ahmed Ould Mohamed',
    f_phone: 'Téléphone', f_phone_ph: 'Ex : 222 XX XX XX XX',
    f_email: 'Email', f_email_ph: 'Ex : contact@societe.com',
    f_address: 'Adresse', f_address_ph: 'Adresse complète...',
    f_balance: 'Solde initial à payer', f_balance_hint: 'Montant que vous devez à ce fournisseur (0 si aucun).',
    cancel: 'Annuler', save: 'Enregistrer', saving: 'Enregistrement...',
    delete_title: 'Supprimer ce fournisseur ?', delete_warn: 'Cette action est irréversible.',
    delete_confirm: 'Oui, supprimer', deleting: 'Suppression...',
    err_load: 'Impossible de charger les fournisseurs.', err_save: "Erreur lors de l'enregistrement.",
    err_delete: 'Erreur lors de la suppression.', close: 'Fermer', retry: 'Réessayer',
    reset: 'Réinitialiser', no_debt: 'Aucune dette',
    role_admin: 'Admin', role_user: 'Lecture',
  },
  ar: {
    dir: 'rtl', locale: 'ar-u-nu-latn', currency: 'أوقية',
    title: 'إدارة الموردين', subtitle: 'أدر مورديك، بياناتهم، والمبالغ المستحقة لهم.',
    add: 'مورد جديد',
    stat_total: 'إجمالي الموردين', records: (n) => `${n} مورد`,
    stat_payable: 'إجمالي المستحق', stat_payable_sub: 'مبالغ مستحقة للموردين',
    stat_with_debt: 'مستحقون للدفع', with_debt_sub: 'أرصدة غير صفرية',
    search_ph: 'ابحث بالاسم، الشركة أو الهاتف...',
    th_name: 'الاسم / الشركة', th_contact: 'جهة الاتصال', th_phone: 'الهاتف',
    th_email: 'البريد الإلكتروني', th_address: 'العنوان', th_balance: 'الرصيد المستحق', th_actions: 'إجراءات',
    loading: 'جارٍ التحميل...', none: 'لا يوجد موردون.',
    edit: 'تعديل', delete: 'حذف',
    modal_edit: 'تعديل بيانات المورد', modal_new: 'مورد جديد',
    f_name: 'اسم المورد / الشركة', f_name_ph: 'مثال: شركة الاستيراد ذ.م.م',
    f_contact: 'الشخص المسؤول', f_contact_ph: 'مثال: أحمد ولد محمد',
    f_phone: 'الهاتف', f_phone_ph: 'مثال: 222 XX XX XX XX',
    f_email: 'البريد الإلكتروني', f_email_ph: 'مثال: contact@societe.com',
    f_address: 'العنوان', f_address_ph: 'العنوان الكامل...',
    f_balance: 'الرصيد الافتتاحي المستحق', f_balance_hint: 'المبلغ الذي تدين به لهذا المورد (0 إن لم يكن).',
    cancel: 'إلغاء', save: 'حفظ', saving: 'جارٍ الحفظ...',
    delete_title: 'حذف هذا المورد؟', delete_warn: 'لا يمكن التراجع عن هذا الإجراء.',
    delete_confirm: 'نعم، احذف', deleting: 'جارٍ الحذف...',
    err_load: 'تعذّر تحميل الموردين.', err_save: 'حدث خطأ أثناء الحفظ.',
    err_delete: 'حدث خطأ أثناء الحذف.', close: 'إغلاق', retry: 'إعادة المحاولة',
    reset: 'إعادة تعيين', no_debt: 'لا توجد مستحقات',
    role_admin: 'مدير', role_user: 'قراءة',
  },
};

/* =========================================================
   UTILITAIRES
========================================================= */
const formatMoney = (value) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(value) || 0);

const emptyForm = () => ({ name: '', contact: '', phone: '', email: '', address: '', balance: 0 });

/* =========================================================
   COMPOSANT PRINCIPAL
========================================================= */
const SuppliersPage = () => {
  const { lang } = useLanguage();
  const t = I18N[lang];

  // Rôles
  const [userRole, setUserRole] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const isAdmin = () => userRole === 'admin' || userRole === 'administrateur';
  const canEdit = () => isAdmin();

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUserRole(userData.role || userData.roles?.[0] || 'user');
        } else {
          setUserRole('user');
        }
      } catch (err) {
        setUserRole('user');
      } finally {
        setUserLoading(false);
      }
    };
    fetchUserRole();
  }, []);

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
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [showForm, showDeleteModal, closeModals]);

  const handleOpenCreate = () => {
    if (!canEdit()) return;
    setCurrentSupplier(null);
    setFormData(emptyForm());
    setFormErrorKey('');
    setShowForm(true);
  };

  const handleOpenEdit = (supplier) => {
    if (!canEdit()) return;
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
    if (!canEdit()) return;
    setCurrentSupplier(supplier);
    setFormErrorKey('');
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
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

  if (userLoading) {
    return (
      <div className="container-fluid py-4 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Vérification des permissions...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 suppliers-compact" dir={t.dir} lang={lang}>
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
              <FaTruck size={32} />
            </Card.Body>
          </Card>
        </Col>
        <Col xs={4} md={4}>
          <Card className="bg-warning text-dark shadow-sm">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-0">{t.stat_payable}</h6>
                <h2 className="mb-0">{formatMoney(stats.totalPayable)}</h2>
                <small className="d-block" style={{ fontSize: '0.65rem' }}>{t.stat_payable_sub}</small>
              </div>
              <FaMoneyBillWave size={32} />
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
              <FaTruck className="me-2" />
              {t.title}
              <Badge bg={canEdit() ? 'success' : 'secondary'} className="ms-2" style={{ fontSize: '0.6em' }}>
                {canEdit() ? <FaUserShield className="me-1" /> : <FaUser className="me-1" />}
                {canEdit() ? t.role_admin : t.role_user}
              </Badge>
            </h3>
            {canEdit() && (
              <Button variant="success" onClick={handleOpenCreate}>
                <FaPlus className="me-1" /> {t.add}
              </Button>
            )}
          </div>
        </Card.Header>

        <Card.Body>
          {errorKey && (
            <Alert variant="danger" className="mb-3">
              <FaExclamationTriangle className="me-2" />{t[errorKey]}
              <Button variant="outline-danger" size="sm" className="ms-2" onClick={fetchSuppliers}>{t.retry}</Button>
            </Alert>
          )}

          {/* Filtres */}
          <Row className="mb-3">
            <Col md={9}>
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
            <Col md={3} className="d-flex align-items-end">
              {hasFilters && (
                <Button variant="outline-secondary" className="w-100" onClick={() => setSearch('')}>
                  <FaTimes className="me-1" /> {t.reset}
                </Button>
              )}
            </Col>
          </Row>

          <div className="text-muted small mb-2">{t.records(filteredSuppliers.length)}</div>

          {/* Tableau */}
          <div className="table-responsive">
            <Table striped bordered hover className="mb-0">
              <thead className="table-dark">
                <tr>
                  <th>{t.th_name}</th>
                  <th>{t.th_contact}</th>
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
                    <td colSpan="7" className="text-center py-5">
                      <Spinner animation="border" variant="primary" />
                      <p className="mt-2">{t.loading}</p>
                    </td>
                  </tr>
                ) : filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      <FaTruck className="mb-3" size={40} />
                      <h5>{t.none}</h5>
                      {canEdit() && (
                        <Button variant="primary" onClick={handleOpenCreate} className="mt-2">
                          <FaPlus className="me-2" />{t.add}
                        </Button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((s) => (
                    <tr key={s.id}>
                      <td className="fw-bold">{s.name || '—'}</td>
                      <td>{s.contact || '—'}</td>
                      <td dir="ltr" style={{ textAlign: t.dir === 'rtl' ? 'right' : 'left' }}>{s.phone || '—'}</td>
                      <td>{s.email || '—'}</td>
                      <td style={{ maxWidth: 220, overflowWrap: 'anywhere' }}>{s.address || '—'}</td>
                      <td className="text-end">
                        <Badge bg={Number(s.balance) > 0 ? 'danger' : 'success'}>
                          {Number(s.balance) > 0 ? (
                            <bdi>{formatMoney(s.balance)} {t.currency}</bdi>
                          ) : (
                            t.no_debt
                          )}
                        </Badge>
                      </td>
                      <td className="text-center">
                        <div className="d-flex gap-1 justify-content-center">
                          {canEdit() ? (
                            <>
                              <Button variant="outline-primary" size="sm" onClick={() => handleOpenEdit(s)} title={t.edit}>
                                <FaEdit />
                              </Button>
                              <Button variant="outline-danger" size="sm" onClick={() => handleDeleteClick(s)} title={t.delete}>
                                <FaTrash />
                              </Button>
                            </>
                          ) : (
                            <Button variant="outline-secondary" size="sm" disabled title="Actions réservées">
                              <FaUserShield />
                            </Button>
                          )}
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
            <FaTruck className="me-2" />
            {currentSupplier ? t.modal_edit : t.modal_new}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formErrorKey && <Alert variant="danger">{t[formErrorKey]}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">{t.f_name}</Form.Label>
              <Form.Control
                type="text"
                placeholder={t.f_name_ph}
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">{t.f_contact}</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder={t.f_contact_ph}
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">{t.f_phone}</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder={t.f_phone_ph}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    dir="ltr"
                    style={{ textAlign: t.dir === 'rtl' ? 'right' : 'left' }}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">{t.f_email}</Form.Label>
              <Form.Control
                type="email"
                placeholder={t.f_email_ph}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                dir="ltr"
                style={{ textAlign: t.dir === 'rtl' ? 'right' : 'left' }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">{t.f_address}</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder={t.f_address_ph}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">{t.f_balance}</Form.Label>
              <Form.Control
                type="number"
                min="0"
                step="0.01"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                dir="ltr"
                style={{ textAlign: t.dir === 'rtl' ? 'right' : 'left' }}
              />
              <Form.Text className="text-muted">{t.f_balance_hint}</Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModals} disabled={saving}>{t.cancel}</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <Spinner size="sm" className="me-2" /> : <FaTruck className="me-2" />}
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
          {currentSupplier && (
            <Alert variant="warning">
              <strong>{currentSupplier.name}</strong>
            </Alert>
          )}
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
        .suppliers-compact .card.bg-primary h6, .suppliers-compact .card.bg-warning h6, .suppliers-compact .card.bg-info h6 { 
          font-size: 0.75rem !important; 
        }
        .suppliers-compact .card.bg-primary h2, .suppliers-compact .card.bg-warning h2, .suppliers-compact .card.bg-info h2 { 
          font-size: 1.25rem !important; 
        }
        .suppliers-compact .card-header h3 { font-size: 1.1rem !important; }
        .suppliers-compact .form-label { font-size: 0.8rem !important; margin-bottom: 0.25rem !important; }
        .suppliers-compact .table th, .suppliers-compact .table td { font-size: 0.85rem !important; padding: 0.5rem 0.75rem !important; }
        .suppliers-compact .btn { font-size: 0.85rem !important; }
        .suppliers-compact .badge { font-size: 0.75rem !important; }
      `}</style>
    </div>
  );
};

export default SuppliersPage;