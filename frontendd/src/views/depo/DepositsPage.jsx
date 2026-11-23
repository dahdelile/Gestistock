// src/pages/DepositsPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Table, Button, Card, Spinner, Badge, Form, Modal, Alert, Row, Col, InputGroup } from 'react-bootstrap';
import { supabase } from '../../supabaseClient';
import { useLanguage } from '../../context/LanguageContext';

const I18N = {
  fr: {
    dir: 'ltr', currency: 'UM',
    title: 'Dépôts / الوديعة', subtitle: 'Marchandises et montants laissés au magasin.',
    add: 'Nouvelle wadiâa', refresh: 'Actualiser',
    stat_total: 'Total wadiâa', stat_active: 'En cours', stat_returned: 'Retournée', stat_amount: 'Montant total',
    search: 'Recherche', search_ph: 'Nom, téléphone, produit...',
    status: 'Statut', all_status: 'Tous', active: 'En cours', returned: 'Retournée', cancelled: 'Annulée',
    customer: 'Client', phone: 'Téléphone', product: 'Produit / Objet', qty: 'Quantité',
    amount: 'Montant', deposit_date: 'Date dépôt', return_date: 'Date retour',
    notes: 'Remarques', actions: 'Actions',
    modal_new: 'Nouvelle wadiâa', modal_edit: 'Modifier la wadiâa',
    save: 'Enregistrer', cancel: 'Annuler', edit: 'Modifier', delete: 'Supprimer', return: 'Retourner',
    delete_title: 'Supprimer cette wadiâa ?', delete_confirm: 'Supprimer',
    empty: 'Aucune wadiâa trouvée.', loading: 'Chargement...',
    ok_save: 'Wadiâa enregistrée.', ok_delete: 'Wadiâa supprimée.', ok_return: 'Wadiâa retournée.',
    no_perm: 'Vous n’avez pas le droit.',
  },
  ar: {
    dir: 'rtl', currency: 'أوقية',
    title: 'الوديعة', subtitle: 'البضاعة والمبالغ الموضوعة عند المحل.',
    add: 'وديعة جديدة', refresh: 'تحديث',
    stat_total: 'إجمالي الودائع', stat_active: 'عند المحل', stat_returned: 'تم إرجاعها', stat_amount: 'إجمالي المبالغ',
    search: 'بحث', search_ph: 'الاسم، الهاتف، المنتج...',
    status: 'الحالة', all_status: 'الكل', active: 'عند المحل', returned: 'تم إرجاعها', cancelled: 'ملغاة',
    customer: 'الزبون', phone: 'الهاتف', product: 'المنتج / الشيء', qty: 'الكمية',
    amount: 'المبلغ', deposit_date: 'تاريخ الوضع', return_date: 'تاريخ الإرجاع',
    notes: 'ملاحظات', actions: 'إجراءات',
    modal_new: 'وديعة جديدة', modal_edit: 'تعديل الوديعة',
    save: 'حفظ', cancel: 'إلغاء', edit: 'تعديل', delete: 'حذف', return: 'إرجاع',
    delete_title: 'حذف هذه الوديعة؟', delete_confirm: 'حذف',
    empty: 'لا توجد ودائع.', loading: 'جارٍ التحميل...',
    ok_save: 'تم حفظ الوديعة.', ok_delete: 'تم حذف الوديعة.', ok_return: 'تم إرجاع الوديعة.',
    no_perm: 'ليس لديك صلاحية.',
  },
};

const emptyForm = () => ({
  customer_name: '', phone: '', product_name: '', quantity: 1,
  amount: '', deposit_date: new Date().toISOString().slice(0, 10),
  return_date: '', status: 'active', notes: '',
});

const money = (v) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(v) || 0);

const DepositsPage = ({ user }) => {
  const { lang } = useLanguage();
  const t = I18N[lang] || I18N.fr;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [formData, setFormData] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const role = String(user?.role || '').toLowerCase();
  const isAdmin = role === 'admin';
  const canEdit = isAdmin || role === 'manager' || role === 'stock';

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('deposits').select('*').order('created_at', { ascending: false });
    if (!error) setRows(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((r) => {
      const okStatus = filterStatus === 'all' || r.status === filterStatus;
      const okSearch = !q || String(r.customer_name || '').toLowerCase().includes(q) || String(r.phone || '').includes(q) || String(r.product_name || '').toLowerCase().includes(q);
      return okStatus && okSearch;
    });
  }, [rows, search, filterStatus]);

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter((r) => r.status === 'active').length,
    returned: rows.filter((r) => r.status === 'returned').length,
    amount: rows.filter((r) => r.status === 'active').reduce((s, r) => s + (Number(r.amount) || 0), 0),
  }), [rows]);

  const openCreate = () => { setSelected(null); setFormData(emptyForm()); setShowForm(true); };
  const openEdit = (r) => { setSelected(r); setFormData({ ...r, quantity: r.quantity ?? 1, amount: r.amount ?? '', deposit_date: r.deposit_date?.slice(0, 10) || '', return_date: r.return_date?.slice(0, 10) || '' }); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      customer_name: formData.customer_name.trim(),
      phone: formData.phone.trim() || null,
      product_name: formData.product_name.trim(),
      quantity: Number(formData.quantity) || 1,
      amount: Number(formData.amount) || 0,
      deposit_date: formData.deposit_date || null,
      return_date: formData.return_date || null,
      status: formData.status,
      notes: formData.notes.trim() || null,
    };
    let err;
    if (selected) { const res = await supabase.from('deposits').update(payload).eq('id', selected.id); err = res.error; }
    else { const res = await supabase.from('deposits').insert([payload]); err = res.error; }
    setSaving(false);
    if (err) { alert(err.message); return; }
    setShowForm(false); setMsg(t.ok_save); fetchData();
  };

  const handleReturn = async (r) => {
    const { error } = await supabase.from('deposits').update({ status: 'returned', return_date: new Date().toISOString().slice(0, 10) }).eq('id', r.id);
    if (!error) { setMsg(t.ok_return); fetchData(); }
  };

  const handleDelete = async () => {
    if (!isAdmin) { alert(t.no_perm); return; }
    const { error } = await supabase.from('deposits').delete().eq('id', toDelete.id);
    if (!error) { setShowDelete(false); setMsg(t.ok_delete); fetchData(); }
  };

  const badge = (status) => status === 'active' ? 'warning' : status === 'returned' ? 'success' : 'danger';

  return (
    <div className="container-fluid py-4" dir={t.dir}>
      <Row className="mb-4">
        <Col xs={3}><Card className="bg-primary text-white"><Card.Body><h6 className="mb-0">{t.stat_total}</h6><h2 className="mb-0">{stats.total}</h2></Card.Body></Card></Col>
        <Col xs={3}><Card className="bg-warning text-dark"><Card.Body><h6 className="mb-0">{t.stat_active}</h6><h2 className="mb-0">{stats.active}</h2></Card.Body></Card></Col>
        <Col xs={3}><Card className="bg-success text-white"><Card.Body><h6 className="mb-0">{t.stat_returned}</h6><h2 className="mb-0">{stats.returned}</h2></Card.Body></Card></Col>
        <Col xs={3}><Card className="bg-info text-white"><Card.Body><h6 className="mb-0">{t.stat_amount}</h6><h2 className="mb-0">{money(stats.amount)} <small>{t.currency}</small></h2></Card.Body></Card></Col>
      </Row>

      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h3 className="mb-0"><i className="fas fa-hand-holding me-2"></i>{t.title}</h3>
          <div className="d-flex gap-2">
            <Button variant="light" onClick={fetchData}><i className="fas fa-sync"></i> {t.refresh}</Button>
            <Button variant="success" onClick={openCreate}><i className="fas fa-plus"></i> {t.add}</Button>
          </div>
        </Card.Header>
        <Card.Body>
          <p className="text-muted">{t.subtitle}</p>
          {msg && <Alert variant="success" onClose={() => setMsg('')} dismissible>{msg}</Alert>}
          <Row className="mb-3">
            <Col md={6}>
              <InputGroup>
                <Form.Control placeholder={t.search_ph} value={search} onChange={(e) => setSearch(e.target.value)} />
                <Button variant="outline-secondary" onClick={() => setSearch('')}>×</Button>
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">{t.all_status}</option>
                <option value="active">{t.active}</option>
                <option value="returned">{t.returned}</option>
                <option value="cancelled">{t.cancelled}</option>
              </Form.Select>
            </Col>
          </Row>

          <div className="table-responsive">
            <Table striped bordered hover>
              <thead className="table-dark">
                <tr>
                  <th>{t.customer}</th><th>{t.phone}</th><th>{t.product}</th>
                  <th className="text-center">{t.qty}</th><th className="text-end">{t.amount}</th>
                  <th>{t.deposit_date}</th><th>{t.return_date}</th><th>{t.status}</th><th>{t.notes}</th>
                  <th className="text-center">{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan="10" className="text-center py-4"><Spinner /></td></tr>
                : filtered.length === 0 ? <tr><td colSpan="10" className="text-center py-4 text-muted">{t.empty}</td></tr>
                : filtered.map((r) => (
                  <tr key={r.id}>
                    <td className="fw-bold">{r.customer_name}</td>
                    <td><bdi dir="ltr">{r.phone || '—'}</bdi></td>
                    <td>{r.product_name}</td>
                    <td className="text-center">{r.quantity}</td>
                    <td className="text-end fw-bold">{money(r.amount)} {t.currency}</td>
                    <td>{r.deposit_date || '—'}</td>
                    <td>{r.return_date || '—'}</td>
                    <td><Badge bg={badge(r.status)}>{t[r.status] || r.status}</Badge></td>
                    <td>{r.notes || '—'}</td>
                    <td className="text-center">
                      <div className="d-flex gap-1 justify-content-center">
                        {r.status === 'active' && canEdit && <Button size="sm" variant="success" onClick={() => handleReturn(r)} title={t.return}><i className="fas fa-undo"></i></Button>}
                        {canEdit && <Button size="sm" variant="outline-primary" onClick={() => openEdit(r)}><i className="fas fa-pen"></i></Button>}
                        {isAdmin && <Button size="sm" variant="outline-danger" onClick={() => { setToDelete(r); setShowDelete(true); }}><i className="fas fa-trash"></i></Button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Modal Form */}
      <Modal show={showForm} onHide={() => setShowForm(false)} size="lg">
        <Modal.Header closeButton><Modal.Title>{selected ? t.modal_edit : t.modal_new}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>{t.customer} *</Form.Label><Form.Control required value={formData.customer_name} onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>{t.phone}</Form.Label><Form.Control value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="48614463" /></Form.Group></Col>
            </Row>
            <Row>
              <Col md={8}><Form.Group className="mb-3"><Form.Label>{t.product} *</Form.Label><Form.Control required value={formData.product_name} onChange={(e) => setFormData({ ...formData, product_name: e.target.value })} placeholder="Ex: Téléphone A13, Or, etc." /></Form.Group></Col>
              <Col md={4}><Form.Group className="mb-3"><Form.Label>{t.qty}</Form.Label><Form.Control type="number" min="1" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} /></Form.Group></Col>
            </Row>
            <Row>
              <Col md={4}><Form.Group className="mb-3"><Form.Label>{t.amount}</Form.Label><Form.Control type="number" min="0" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} /></Form.Group></Col>
              <Col md={4}><Form.Group className="mb-3"><Form.Label>{t.deposit_date}</Form.Label><Form.Control type="date" value={formData.deposit_date} onChange={(e) => setFormData({ ...formData, deposit_date: e.target.value })} /></Form.Group></Col>
              <Col md={4}><Form.Group className="mb-3"><Form.Label>{t.status}</Form.Label><Form.Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}><option value="active">{t.active}</option><option value="returned">{t.returned}</option><option value="cancelled">{t.cancelled}</option></Form.Select></Form.Group></Col>
            </Row>
            <Form.Group className="mb-3"><Form.Label>{t.notes}</Form.Label><Form.Control as="textarea" rows={2} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowForm(false)}>{t.cancel}</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>{saving ? '...' : t.save}</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showDelete} onHide={() => setShowDelete(false)}>
        <Modal.Header closeButton><Modal.Title>{t.delete_title}</Modal.Title></Modal.Header>
        <Modal.Body>{toDelete?.customer_name} — {toDelete?.product_name}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDelete(false)}>{t.cancel}</Button>
          <Button variant="danger" onClick={handleDelete}>{t.delete_confirm}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DepositsPage;