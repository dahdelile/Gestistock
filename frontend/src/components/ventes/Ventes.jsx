// src/pages/VentesPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Table, Button, Card, Spinner, Badge, Form, Modal, Row, Col, InputGroup, Alert
} from 'react-bootstrap';
import {
  FaCashRegister, FaSearch, FaSyncAlt, FaPlus, 
  FaEdit, FaTrash, FaEye, FaFileExcel, FaBoxOpen, 
  FaTimes, FaCheckCircle, FaUser, FaMoneyBillWave, FaBox
} from 'react-icons/fa';
import { productsApi, customersApi, salesApi } from '../../api';
import { useLanguage } from '../../context/LanguageContext';

const STORE = {
  name: 'GESTION STOCK',
  address: 'Nouakchott, Mauritanie',
  phone: '+222 XX XX XX XX',
};

/* ============================================================
   HELPERS
   ============================================================ */
const toNumOrNull = (v) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const toNumOrZero = (v) => toNumOrNull(v) ?? 0;
const toTextOrNull = (v) => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
};

const formatNumber = (v) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(Number(v) || 0);
const formatDate = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
const escapeHtml = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const getItemCategory = (item, productById) => {
  if (!item) return '—';
  const fromMap = item.product_id != null ? productById?.[String(item.product_id)] : null;
  return (
    fromMap?.categories?.name || fromMap?.category?.name || fromMap?.category_name ||
    item?.categories?.name || item?.category?.name || item?.products?.categories?.name ||
    item?.products?.category?.name || item?.products?.category_name || item?.category_name ||
    item?.category || '—'
  );
};
const getSaleCategories = (sale, productById) => {
  const items = sale?.items || sale?.invoice_items || sale?.items_sale || [];
  const cats = [];
  items.forEach((it) => {
    const c = getItemCategory(it, productById);
    if (c && c !== '—' && !cats.includes(c)) cats.push(c);
  });
  return cats.length ? cats.join(', ') : '—';
};

/* ============================================================
   MODALE D'AJOUT DE VENTE
   ============================================================ */
const AddSaleModal = ({ isOpen, onClose, products, customers, onSubmit, loading, cur }) => {
  const buildInitialForm = () => ({
    invoice_number: `INV-${Date.now().toString().slice(-6)}`,
    customer_id: '', status: 'paid', payment_method: 'cash',
    date: new Date().toISOString().slice(0, 16), notes: '',
  });
  const [form, setForm] = useState(buildInitialForm);
  const [items, setItems] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [newItem, setNewItem] = useState({ product_id: '', quantity: 1, price: '' });
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setForm(buildInitialForm());
      setItems([]);
      setCategoryFilter('');
      setNewItem({ product_id: '', quantity: 1, price: '' });
      setLocalError('');
    }
  }, [isOpen]);

  const productById = useMemo(() => {
    const m = {};
    products.forEach((p) => { m[String(p.id)] = p; });
    return m;
  }, [products]);

  const categories = useMemo(() => {
    const cats = products.map(p => p.categories?.name || p.category?.name || p.category_name || 'Non catégorisé');
    return [...new Set(cats)].sort();
  }, [products]);

  const displayedProducts = useMemo(() => {
    if (!categoryFilter) return products;
    return products.filter(p => (p.categories?.name || p.category?.name || p.category_name || 'Non catégorisé') === categoryFilter);
  }, [products, categoryFilter]);

  if (!isOpen) return null;

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSelectProduct = (e) => {
    setNewItem(p => ({ ...p, product_id: e.target.value, price: '' }));
    setLocalError('');
  };

  const addItem = () => {
    if (!newItem.product_id) return setLocalError('Produit requis');
    const prod = products.find(p => String(p.id) === String(newItem.product_id));
    const price = Number(newItem.price);
    const qty = Number(newItem.quantity);
    const stock = Number(prod?.quantity ?? prod?.stock ?? 0);
    if (!Number.isFinite(price) || price <= 0) return setLocalError('Prix invalide');
    if (!Number.isFinite(qty) || qty <= 0) return setLocalError('Quantité invalide');
    const existingQty = items.filter(i => String(i.product_id) === String(newItem.product_id)).reduce((sum, i) => sum + i.quantity, 0);
    if (existingQty + qty > stock) return setLocalError(`Stock insuffisant. Reste: ${stock - existingQty}`);
    
    setItems(prev => [...prev, {
      product_id: newItem.product_id,
      name: prod?.name || 'Produit',
      category: prod?.categories?.name || prod?.category?.name || prod?.category_name || '—',
      purchase_price: Number(prod?.purchase_price ?? 0),
      quantity: qty,
      price,
      stock,
    }]);
    setNewItem({ product_id: '', quantity: 1, price: '' });
    setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (items.length === 0) return setLocalError('Aucun article ajouté');
    const isCredit = form.payment_method === 'credit' || form.status === 'partial';
    if (isCredit && !form.customer_id) return setLocalError('Sélectionnez un client pour le crédit');
    const totalNum = items.reduce((s, i) => s + (Number(i.price) * Number(i.quantity)), 0);
    
    const payload = {
      invoice_number: toTextOrNull(form.invoice_number),
      customer_id: toNumOrNull(form.customer_id),
      status: toTextOrNull(form.status) || 'paid',
      payment_method: toTextOrNull(form.payment_method) || 'cash',
      notes: toTextOrNull(form.notes),
      invoice_date: form.date ? new Date(form.date).toISOString() : new Date().toISOString(),
      total: totalNum, grand_total: totalNum, subtotal: totalNum, discount: 0,
      paid_amount: isCredit ? 0 : totalNum,
      balance: isCredit ? totalNum : 0,
      amount_received: isCredit ? 0 : totalNum,
      change_amount: 0,
      items: items.map(i => ({
        product_id: toNumOrNull(i.product_id),
        quantity: toNumOrZero(i.quantity),
        price: toNumOrZero(i.price),
        unit_price: toNumOrZero(i.price),
        total: toNumOrZero(Number(i.price) * Number(i.quantity)),
      })),
    };
    await onSubmit(payload);
  };

  const subtotal = items.reduce((s, i) => s + (i.price * i.quantity), 0);
  const selectedProduct = products.find(p => String(p.id) === String(newItem.product_id));

  return (
    <Modal show={isOpen} onHide={onClose} size="lg" backdrop="static" scrollable>
      <Modal.Header closeButton={!loading} style={{ backgroundColor: '#fff', borderBottom: '1px solid #dee2e6' }}>
        <Modal.Title className="d-flex align-items-center gap-2">
          <div style={{ backgroundColor: '#e8efff', color: '#1f5eea', padding: '6px 10px', borderRadius: 8 }}>
            <FaCashRegister />
          </div>
          Nouvelle vente
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body style={{ backgroundColor: '#f8f9fa' }}>
          {localError && <Alert variant="danger" className="py-2">{localError}</Alert>}
          
          <Card className="mb-3 border-0 shadow-sm">
            <Card.Body className="p-3">
              <Row className="g-2">
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Client</Form.Label>
                    <Form.Select name="customer_id" value={form.customer_id} onChange={handleChange} size="sm">
                      <option value="">Client comptant</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Date</Form.Label>
                    <Form.Control type="datetime-local" name="date" value={form.date} onChange={handleChange} size="sm" />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Statut</Form.Label>
                    <Form.Select name="status" value={form.status} onChange={handleChange} size="sm">
                      <option value="paid">Payée</option>
                      <option value="partial">Crédit</option>
                      <option value="draft">Brouillon</option>
                      <option value="cancelled">Annulée</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Paiement</Form.Label>
                    <Form.Select name="payment_method" value={form.payment_method} onChange={handleChange} size="sm">
                      <option value="cash">Espèces</option>
                      <option value="bankily">Bankily</option>
                      <option value="masrivi">Masrivi</option>
                      <option value="sedad">Sedad</option>
                      <option value="credit">Crédit</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom-0 pt-3 pb-0">
              <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <span className="badge bg-primary rounded-circle p-2" style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
                Articles de la vente
              </h6>
            </Card.Header>
            <Card.Body className="p-3">
              <Row className="g-2 mb-3 align-items-end">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Catégorie</Form.Label>
                    <Form.Select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setNewItem(p => ({ ...p, product_id: '' })); }} size="sm">
                      <option value="">Toutes</option>
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Produit</Form.Label>
                    <Form.Select value={newItem.product_id} onChange={handleSelectProduct} size="sm">
                      <option value="">-- Sélectionner --</option>
                      {displayedProducts.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name}{p.purchase_price ? ` (Achat: ${formatNumber(p.purchase_price)})` : ''}
                        </option>
                      ))}
                    </Form.Select>
                    {selectedProduct && (
                      <small className="text-primary fw-bold mt-1 d-block" style={{ fontSize: 10 }}>
                        Stock dispo : {selectedProduct.quantity ?? selectedProduct.stock ?? 0}
                      </small>
                    )}
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Qté</Form.Label>
                    <Form.Control type="number" min="1" value={newItem.quantity} onChange={e => setNewItem(p => ({ ...p, quantity: e.target.value }))} size="sm" />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Prix</Form.Label>
                    <Form.Control type="number" min="0" step="0.01" value={newItem.price} onChange={e => setNewItem(p => ({ ...p, price: e.target.value }))} placeholder="Prix" size="sm" />
                  </Form.Group>
                </Col>
                <Col md={1}>
                  <Button variant="primary" className="w-100" onClick={addItem} disabled={!newItem.product_id}>
                    <FaPlus />
                  </Button>
                </Col>
              </Row>

              <div className="table-responsive border rounded">
                <Table size="sm" className="mb-0 text-center align-middle">
                  <thead className="table-light">
                    <tr>
                      <th className="text-start">Produit</th>
                      <th>Catégorie</th>
                      <th style={{ width: 70 }}>Qté</th>
                      <th className="text-end">Prix</th>
                      <th className="text-end">Total</th>
                      <th style={{ width: 40 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr><td colSpan="6" className="text-muted py-3">Aucun article ajouté</td></tr>
                    ) : items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="text-start fw-bold">{item.name}</td>
                        <td><Badge bg="info">{item.category || getItemCategory(item, productById)}</Badge></td>
                        <td>{item.quantity}</td>
                        <td className="text-end">{formatNumber(item.price)}</td>
                        <td className="text-end fw-bold">{formatNumber(item.price * item.quantity)}</td>
                        <td>
                          <Button variant="outline-danger" size="sm" className="border-0 p-1" onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}>
                            <FaTrash size={12} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-light">
                    <tr>
                      <td colSpan="4" className="text-end fw-bold">TOTAL :</td>
                      <td className="text-end fw-bold text-success">{formatNumber(subtotal)} {cur}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </Table>
              </div>

              <Form.Group className="mt-3">
                <Form.Label className="small fw-bold">Observation</Form.Label>
                <Form.Control as="textarea" rows={2} name="notes" value={form.notes} onChange={handleChange} placeholder="Notes optionnelles..." />
              </Form.Group>
            </Card.Body>
          </Card>
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: '#fff', borderTop: '1px solid #dee2e6' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Annuler</Button>
          <Button variant="primary" type="submit" disabled={loading || items.length === 0}>
            {loading ? <><Spinner size="sm" animation="border" className="me-2"/>Enregistrement...</> : <><FaCheckCircle className="me-1"/> Enregistrer</>}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

/* ============================================================
   PAGE PRINCIPALE
   ============================================================ */
const VentesPage = () => {
  const { lang } = useLanguage();
  const cur = lang === 'ar' ? 'أوقية' : 'MRU';

  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loadingSales, setLoadingSales] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Filtres
  const [searchSale, setSearchSale] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  
  // Tri
  const [sortKey, setSortKey] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  // Modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [saleToEdit, setSaleToEdit] = useState(null);
  const [saleToDelete, setSaleToDelete] = useState(null);
  const [editStatus, setEditStatus] = useState('paid');
  const [editNotes, setEditNotes] = useState('');
  const [editItems, setEditItems] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastSale, setLastSale] = useState(null);

  useEffect(() => {
    fetchSales(); fetchProducts(); fetchCustomers();
  }, []);

  const fetchSales = async () => {
    setLoadingSales(true);
    try {
      const res = await salesApi.getAll();
      const data = res?.data;
      setSales(Array.isArray(data) ? data : data?.data || []);
    } catch (err) { console.error(err); }
    finally { setLoadingSales(false); }
  };

  const fetchProducts = async () => {
    try {
      const res = await productsApi.getAll();
      const data = res?.data;
      setProducts(Array.isArray(data) ? data : data?.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchCustomers = async () => {
    try {
      const res = await customersApi.getAll();
      const data = res?.data;
      setCustomers(Array.isArray(data) ? data : data?.data || []);
    } catch (err) { console.warn(err); }
  };

  const productById = useMemo(() => {
    const m = {};
    products.forEach((p) => { m[String(p.id)] = p; });
    return m;
  }, [products]);

  const allCategories = useMemo(() => {
    const cats = products.map(p => p.categories?.name || p.category?.name || p.category_name).filter(Boolean);
    return [...new Set(cats)].sort();
  }, [products]);

  const getStatus = (status, paymentMethod) => {
    if (status === 'paid') {
      const map = {
        bankily: { label: 'Bankily', tone: 'violet' },
        masrivi: { label: 'Masrivi', tone: 'warning' },
        sedad: { label: 'Sedad', tone: 'success' },
        credit: { label: 'Crédit', tone: 'warning' },
        cash: { label: 'Espèces', tone: 'success' },
      };
      return map[paymentMethod] || map.cash;
    }
    const statuses = {
      partial: { label: 'Crédit', tone: 'warning' },
      draft: { label: 'Brouillon', tone: 'secondary' },
      cancelled: { label: 'Annulée', tone: 'danger' },
    };
    return statuses[status] || { label: status || '—', tone: 'secondary' };
  };

  const getSaleItems = (sale) => sale?.items || sale?.invoice_items || sale?.items_sale || [];
  const getCustomerName = (sale) => {
    if (!sale) return 'Client comptant';
    const c = customers.find(i => String(i.id) === String(sale.customer_id));
    return sale.customers?.name || sale.customer?.name || c?.name || 'Client comptant';
  };
  const getTotalQuantity = (sale) => getSaleItems(sale).reduce((s, i) => s + Number(i.quantity || 0), 0);
  const getProductNames = (sale) => {
    const names = getSaleItems(sale).map(i => i.product_name || i.name || i.products?.name || 'Produit');
    return names.length > 0 ? names.join(', ') : '—';
  };

  const filteredSales = useMemo(() => {
    const q = searchSale.trim().toLowerCase();
    return sales.filter((sale) => {
      const inv = String(sale.invoice_number || '').toLowerCase();
      const cust = String(sale.customers?.name || sale.customer?.name || 'Client comptant').toLowerCase();
      const prodNames = getProductNames(sale).toLowerCase();
      const cats = getSaleCategories(sale, productById).toLowerCase();
      
      const matchesSearch = !q || inv.includes(q) || cust.includes(q) || prodNames.includes(q) || cats.includes(q);
      const matchesStatus = filterStatus === 'all' || sale.status === filterStatus;
      const matchesPayment = filterPayment === 'all' || sale.payment_method === filterPayment;
      const matchesCategory = filterCategory === 'all' || getSaleCategories(sale, productById).split(', ').includes(filterCategory);
      const dStr = String(sale.invoice_date || sale.created_at || '').slice(0, 10);
      const matchesStart = !startDateFilter || dStr >= startDateFilter;
      const matchesEnd = !endDateFilter || dStr <= endDateFilter;
      
      return matchesSearch && matchesStatus && matchesPayment && matchesCategory && matchesStart && matchesEnd;
    });
  }, [sales, searchSale, filterStatus, filterPayment, filterCategory, startDateFilter, endDateFilter, productById]);

  const sortedSales = useMemo(() => {
    const arr = [...filteredSales];
    const dir = sortDir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      const getVal = (s) => {
        switch (sortKey) {
          case 'invoice': return String(s.invoice_number || '');
          case 'customer': return String(s.customers?.name || s.customer?.name || '');
          case 'category': return getSaleCategories(s, productById);
          case 'total': return Number(s.grand_total ?? s.total ?? 0);
          case 'status': return String(s.status || '');
          case 'created_at':
          default: return String(s.invoice_date || s.created_at || '');
        }
      };
      const va = getVal(a), vb = getVal(b);
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
    return arr;
  }, [filteredSales, sortKey, sortDir, productById]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handleAddSubmit = async (payload) => {
    setProcessing(true);
    try {
      const cleanPayload = {
        invoice_number: toTextOrNull(payload.invoice_number),
        customer_id: toNumOrNull(payload.customer_id),
        status: toTextOrNull(payload.status) || 'paid',
        payment_method: toTextOrNull(payload.payment_method) || 'cash',
        notes: toTextOrNull(payload.notes),
        invoice_date: payload.invoice_date || new Date().toISOString(),
        total: toNumOrZero(payload.total),
        grand_total: toNumOrZero(payload.grand_total),
        subtotal: toNumOrZero(payload.subtotal),
        discount: toNumOrZero(payload.discount),
        paid_amount: toNumOrZero(payload.paid_amount),
        balance: toNumOrZero(payload.balance),
        amount_received: toNumOrZero(payload.amount_received),
        change_amount: toNumOrZero(payload.change_amount),
        items: (payload.items || []).map(i => ({
          product_id: toNumOrNull(i.product_id),
          quantity: toNumOrZero(i.quantity),
          price: toNumOrZero(i.price),
          unit_price: toNumOrZero(i.unit_price ?? i.price),
          total: toNumOrZero(i.total ?? (Number(i.price) * Number(i.quantity))),
        })),
      };
      const res = await salesApi.checkout(cleanPayload);
      const saleData = res?.data || {};
      const completed = {
        ...saleData,
        invoice_number: saleData.invoice_number || cleanPayload.invoice_number,
        items: saleData.items || cleanPayload.items.map(i => ({ ...i, product_name: i.name })),
        grand_total: Number(saleData.grand_total ?? saleData.total ?? cleanPayload.grand_total),
        invoice_date: saleData.invoice_date || cleanPayload.invoice_date,
        created_at: saleData.created_at || cleanPayload.invoice_date,
      };
      setLastSale(completed);
      setShowAddModal(false);
      setShowInvoice(true);
      await Promise.all([fetchProducts(), fetchSales()]);
    } catch (err) {
      console.error('Erreur checkout:', err);
      alert(err?.message || 'Erreur lors de l\'enregistrement');
    } finally { setProcessing(false); }
  };

  const handleOpenEdit = (sale) => {
    setSaleToEdit(sale);
    setEditStatus(sale.status || 'paid');
    setEditNotes(sale.notes || '');
    setEditItems(getSaleItems(sale).map(i => ({
      ...i,
      quantity: Number(i.quantity) || 1,
      price: Number(i.price ?? i.unit_price) || 0,
    })));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!saleToEdit) return;
    setActionLoading(true);
    try {
      const newTotal = editItems.reduce((s, i) => s + Number(i.quantity) * Number(i.price), 0);
      await salesApi.updateSale(saleToEdit.id, {
        status: editStatus,
        notes: toTextOrNull(editNotes),
        total: toNumOrZero(newTotal),
        grand_total: toNumOrZero(newTotal),
      });
      setSaleToEdit(null);
      await fetchSales();
    } catch (err) { console.error(err); alert('Erreur modification'); }
    finally { setActionLoading(false); }
  };

  const handleDeleteConfirm = async () => {
    if (!saleToDelete) return;
    setActionLoading(true);
    try {
      await salesApi.deleteSale(saleToDelete.id, getSaleItems(saleToDelete));
      setSaleToDelete(null);
      await Promise.all([fetchSales(), fetchProducts()]);
    } catch (err) { console.error(err); alert('Erreur suppression'); }
    finally { setActionLoading(false); }
  };

  const printInvoice = (saleToPrint = null) => {
    const sale = saleToPrint || lastSale;
    if (!sale) return;
    const items = getSaleItems(sale);
    const invNum = sale.invoice_number || `VENTE-${sale.id}`;
    const custName = getCustomerName(sale);
    const itemsHtml = items.map(i => {
      const n = i.product_name || i.name || i.products?.name || 'Produit';
      const cat = getItemCategory(i, productById);
      const q = Number(i.quantity) || 0;
      const p = Number(i.price ?? i.unit_price) || 0;
      const lt = Number(i.total ?? q * p);
      return `<tr><td>${escapeHtml(n)}</td><td>${escapeHtml(cat)}</td><td class="center">${q}</td><td class="right">${formatNumber(p)}</td><td class="right">${formatNumber(lt)}</td></tr>`;
    }).join('');
    const sub = Number(sale.subtotal ?? sale.total ?? 0);
    const disc = Number(sale.discount ?? 0);
    const tot = Number(sale.grand_total ?? sale.total ?? 0);
    const dateVal = sale.invoice_date || sale.created_at;
    const win = window.open('', '_blank', 'width=900,height=900');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}"><head><meta charset="UTF-8"><title>${invNum}</title>
    <style>*{box-sizing:border-box}body{margin:0;padding:30px;color:#14213d;font-family:${lang === 'ar' ? "'Cairo'," : ''}Arial,sans-serif}.inv{max-width:800px;margin:auto}.hdr{text-align:center;border-bottom:2px solid #14213d;padding-bottom:18px}.store{font-size:26px;font-weight:800}.muted{color:#66748b}h2{text-align:center;margin:24px 0}.meta{display:flex;justify-content:space-between;gap:15px;margin:25px 0}.meta>div{flex:1}.lbl{display:block;font-size:11px;color:#66748b;margin-bottom:5px}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#e8efff;text-align:${lang === 'ar' ? 'right' : 'left'}}th,td{padding:11px 9px;border-bottom:1px solid #e3e9f2}.center{text-align:center}.right{text-align:${lang === 'ar' ? 'left' : 'right'}}.totals{width:330px;margin:22px 0 0 auto}.row{display:flex;justify-content:space-between;padding:8px 0}.grand{border-top:2px solid #14213d;border-bottom:2px solid #14213d;font-size:19px;font-weight:800;padding:13px 0}.footer{margin-top:40px;border-top:1px solid #ddd;padding-top:18px;text-align:center;color:#66748b}@media print{body{padding:0}}</style></head><body>
    <div class="inv"><div class="hdr"><div class="store">${escapeHtml(STORE.name)}</div><div class="muted">${escapeHtml(STORE.address)}<br>${escapeHtml(STORE.phone)}</div></div>
    <h2>FACTURE</h2><div class="meta"><div><span class="lbl">N°</span><strong>${escapeHtml(invNum)}</strong></div><div><span class="lbl">DATE</span><strong>${escapeHtml(formatDate(dateVal))}</strong></div><div><span class="lbl">CLIENT</span><strong>${escapeHtml(custName)}</strong></div></div>
    <table><thead><tr><th>Produit</th><th>Catégorie</th><th class="center">Qté</th><th class="right">P.U.</th><th class="right">Total</th></tr></thead><tbody>${itemsHtml}</tbody></table>
    <div class="totals"><div class="row"><span>Sous-total</span><strong>${formatNumber(sub)} ${cur}</strong></div><div class="row"><span>Remise</span><strong>- ${formatNumber(disc)} ${cur}</strong></div><div class="row grand"><span>TOTAL</span><span>${formatNumber(tot)} ${cur}</span></div></div>
    <div class="footer">Merci pour votre achat !</div></div></body></html>`);
    win.document.close(); win.focus(); win.onload = () => win.print();
  };

  const exportFilteredSales = () => {
    const rows = [
      ['Facture', 'Client', 'Produit(s)', 'Catégorie', 'Qté', 'Total', 'Statut', 'Paiement', 'Date'],
      ...filteredSales.map(s => [
        s.invoice_number || `VENTE-${s.id}`,
        getCustomerName(s),
        getProductNames(s),
        getSaleCategories(s, productById),
        getTotalQuantity(s),
        Number(s.grand_total ?? s.total ?? 0),
        getStatus(s.status, s.payment_method).label,
        getStatus(s.status, s.payment_method).label,
        formatDate(s.invoice_date || s.created_at),
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ventes_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  };

  const hasFilters = Boolean(searchSale || filterStatus !== 'all' || filterPayment !== 'all' || filterCategory !== 'all' || startDateFilter || endDateFilter);
  const resetFilters = () => {
    setSearchSale(''); setFilterStatus('all'); setFilterPayment('all'); setFilterCategory('all'); setStartDateFilter(''); setEndDateFilter('');
  };

  return (
    <div className="container-fluid py-4" dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ backgroundColor: '#f4f5f7', minHeight: '100vh', padding: 0 }}>
      
      {/* CSS PERSONNALISÉ POUR FORCER LES 4 CARTES SUR UNE LIGNE ET LE TABLEAU SANS SCROLL */}
      <style>{`
        /* Force les 4 cartes sur une seule ligne */
        .stats-row {
          display: flex !important;
          flex-wrap: nowrap !important;
          gap: 4px !important;
          padding: 4px;
          overflow-x: hidden;
        }
        .stats-row > div {
          flex: 1 1 25% !important;
          min-width: 0 !important;
          padding: 0 !important;
        }
        .stats-card {
          padding: 8px !important;
          border-radius: 0 !important;
          height: 100%;
        }
        .stats-card h6 { font-size: 10px !important; margin-bottom: 2px !important; }
        .stats-card h3 { font-size: 14px !important; margin-bottom: 0 !important; }
        .stats-card small { font-size: 9px !important; display: none; }
        .stats-card .icon { display: none; }

        /* Force le tableau à rentrer dans l'écran (pas de scroll horizontal) */
        @media (max-width: 768px) {
          .table-responsive {
            overflow-x: hidden !important;
          }
          .table {
            font-size: 10px !important;
            width: 100% !important;
            table-layout: auto;
          }
          .table th, .table td {
            padding: 4px 2px !important;
            white-space: normal !important;
            text-align: center;
            word-break: break-word;
          }
          /* Masquer les colonnes secondaires sur mobile pour faire rentrer le tableau */
          .hide-mobile {
            display: none !important;
          }
          .action-btn {
            padding: 2px 4px !important;
            font-size: 10px !important;
          }
          .prod-name {
            font-size: 10px !important;
            display: block;
            max-width: 60px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      `}</style>

      {/* CARTES DE STATISTIQUES (4 sur une ligne) */}
      <div className="stats-row mb-3">
        <div>
          <Card className="bg-primary text-white shadow-sm stats-card border-0">
            <Card.Body className="d-flex flex-column justify-content-center p-2">
              <h6 className="opacity-75">Montant global</h6>
              <h3 className="fw-bold">{formatNumber(sales.reduce((acc, s) => acc + Number(s.grand_total ?? s.total ?? 0), 0))}</h3>
              <small className="opacity-75">Toutes les ventes</small>
            </Card.Body>
          </Card>
        </div>
        <div>
          <Card className="bg-success text-white shadow-sm stats-card border-0">
            <Card.Body className="d-flex flex-column justify-content-center p-2">
              <h6 className="opacity-75">Total ventes</h6>
              <h3 className="fw-bold">{sales.length}</h3>
              <small className="opacity-75">Transactions</small>
            </Card.Body>
          </Card>
        </div>
        <div>
          <Card className="bg-info text-white shadow-sm stats-card border-0">
            <Card.Body className="d-flex flex-column justify-content-center p-2">
              <h6 className="opacity-75">Ventes mois</h6>
              <h3 className="fw-bold">—</h3>
              <small className="opacity-75">Revenus</small>
            </Card.Body>
          </Card>
        </div>
        <div>
          <Card className="bg-warning text-white shadow-sm stats-card border-0">
            <Card.Body className="d-flex flex-column justify-content-center p-2">
              <h6 className="opacity-75">Ventes jour</h6>
              <h3 className="fw-bold">—</h3>
              <small className="opacity-75">Revenus</small>
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* HEADER VIOLET */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 p-3 rounded-0 text-white" style={{ backgroundColor: '#5954d6' }}>
        <h4 className="mb-2 mb-md-0 fw-bold d-flex align-items-center gap-2">
          <FaCashRegister /> Gestion des ventes
        </h4>
        <div className="d-flex gap-2">
          <Button variant="light" onClick={fetchSales} disabled={loadingSales} className="fw-bold">
            <FaSyncAlt className={loadingSales ? "spin me-1" : "me-1"} /> Rafraîchir
          </Button>
          <Button variant="success" onClick={() => setShowAddModal(true)} className="fw-bold">
            <FaPlus className="me-1" /> Nouvelle vente
          </Button>
        </div>
      </div>

      {/* PANEL PRINCIPAL */}
      <Card className="shadow-sm border-0 rounded-0 mx-2 mb-4">
        <Card.Header className="bg-white py-2 border-bottom-0">
          <h5 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
            <i className="fas fa-list-alt text-primary"></i> Historique des ventes
          </h5>
        </Card.Header>
        <Card.Body className="p-0">
          
          {/* BARRE DE FILTRES */}
          <div className="p-3 bg-white border-bottom">
            <Row className="g-2 align-items-end">
              <Col xs={12} md={3}>
                <Form.Group className="mb-0">
                  <Form.Label className="small fw-bold text-muted"><FaSearch className="me-1"/> Facture / Client</Form.Label>
                  <InputGroup size="sm">
                    <Form.Control type="text" placeholder="N° facture, client..." value={searchSale} onChange={e => setSearchSale(e.target.value)} />
                    {searchSale && <Button variant="outline-secondary" onClick={() => setSearchSale('')}><FaTimes /></Button>}
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col xs={6} md={2}>
                <Form.Group className="mb-0">
                  <Form.Label className="small fw-bold text-muted">Catégorie</Form.Label>
                  <Form.Select size="sm" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                    <option value="all">Toutes</option>
                    {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={6} md={2}>
                <Form.Group className="mb-0">
                  <Form.Label className="small fw-bold text-muted">Paiement</Form.Label>
                  <Form.Select size="sm" value={filterPayment} onChange={e => setFilterPayment(e.target.value)}>
                    <option value="all">Tous</option>
                    <option value="cash">Espèces</option>
                    <option value="bankily">Bankily</option>
                    <option value="masrivi">Masrivi</option>
                    <option value="sedad">Sedad</option>
                    <option value="credit">Crédit</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={6} md={2}>
                <Form.Group className="mb-0">
                  <Form.Label className="small fw-bold text-muted">Statut</Form.Label>
                  <Form.Select size="sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="all">Tous</option>
                    <option value="paid">Payée</option>
                    <option value="partial">Crédit</option>
                    <option value="cancelled">Annulée</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={6} md={2}>
                <Form.Group className="mb-0">
                  <Form.Label className="small fw-bold text-muted">Période</Form.Label>
                  <div className="d-flex gap-1">
                    <Form.Control type="date" size="sm" value={startDateFilter} onChange={e => setStartDateFilter(e.target.value)} />
                    <Form.Control type="date" size="sm" value={endDateFilter} onChange={e => setEndDateFilter(e.target.value)} />
                  </div>
                </Form.Group>
              </Col>
              <Col xs={12} md={1} className="d-flex gap-2">
                <Button variant="outline-secondary" size="sm" className="w-100" onClick={resetFilters} title="Réinitialiser"><FaTimes /></Button>
                <Button variant="outline-success" size="sm" className="w-100" onClick={exportFilteredSales} title="Exporter Excel"><FaFileExcel /></Button>
              </Col>
            </Row>
          </div>

          {/* TABLEAU (Sans scroll horizontal, colonnes adaptées) */}
          <div className="table-responsive">
            <Table hover className="mb-0 text-center align-middle" style={{ fontSize: '0.9rem' }}>
              <thead style={{ backgroundColor: '#212529', color: '#fff' }}>
                <tr>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('invoice')}>Produit(s)</th>
                  <th className="hide-mobile" style={{ cursor: 'pointer' }} onClick={() => handleSort('category')}>Catégorie</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('customer')}>Client</th>
                  <th className="hide-mobile">Qté</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('total')}>Total</th>
                  <th className="hide-mobile" style={{ cursor: 'pointer' }} onClick={() => handleSort('status')}>Statut</th>
                  <th className="hide-mobile" style={{ cursor: 'pointer' }} onClick={() => handleSort('created_at')}>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingSales ? (
                  <tr><td colSpan="8" className="py-4"><Spinner animation="border" size="sm" /> Chargement...</td></tr>
                ) : sortedSales.length === 0 ? (
                  <tr><td colSpan="8" className="py-4 text-muted">Aucune vente trouvée</td></tr>
                ) : (
                  sortedSales.map((sale, i) => {
                    const st = getStatus(sale.status, sale.payment_method);
                    const cn = sale.customers?.name || sale.customer?.name || 'Client comptant';
                    const qty = getTotalQuantity(sale);
                    const names = getProductNames(sale);
                    const cats = getSaleCategories(sale, productById);
                    
                    return (
                      <tr key={sale.id}>
                        <td className="text-start fw-bold text-primary" title={names}>
                          <span className="prod-name">{names}</span>
                        </td>
                        <td className="hide-mobile"><Badge bg="light" className="text-dark border">{cats}</Badge></td>
                        <td>
                          <div className="d-flex align-items-center gap-1 justify-content-center">
                             <div className="bg-primary text-white rounded p-1 d-none d-sm-flex align-items-center justify-content-center" style={{ width: 20, height: 20 }}>
                               <FaUser size={8} />
                             </div>
                             <span className="fw-bold" style={{ fontSize: '10px' }}>{cn}</span>
                          </div>
                        </td>
                        <td className="hide-mobile"><Badge bg="secondary">{qty}</Badge></td>
                        <td className="fw-bold text-success" style={{ fontSize: '11px' }}>{formatNumber(sale.grand_total ?? sale.total)}</td>
                        <td className="hide-mobile"><Badge bg={st.tone}>{st.label}</Badge></td>
                        <td className="hide-mobile text-muted" style={{ fontSize: '10px' }}>{formatDate(sale.invoice_date || sale.created_at)}</td>
                        <td>
                          <div className="d-flex gap-1 justify-content-center">
                            <Button variant="outline-info" size="sm" className="action-btn" onClick={() => setSelectedSale(sale)} title="Voir"><FaEye /></Button>
                            <Button variant="outline-success" size="sm" className="action-btn" onClick={() => handleOpenEdit(sale)} title="Modifier"><FaEdit /></Button>
                            <Button variant="outline-danger" size="sm" className="action-btn" onClick={() => setSaleToDelete(sale)} title="Supprimer"><FaTrash /></Button>
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

      {/* ============================================================
          MODALES (Inchangées)
          ============================================================ */}
      
      <AddSaleModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        products={products} 
        customers={customers} 
        onSubmit={handleAddSubmit} 
        loading={processing} 
        cur={cur} 
      />

      <Modal show={!!selectedSale} onHide={() => setSelectedSale(null)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Détails de la vente</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSale && (
            <>
              <div className="d-flex justify-content-between mb-3 flex-wrap gap-2">
                <div><strong>Facture:</strong> {selectedSale.invoice_number || `V-${selectedSale.id}`}</div>
                <div><strong>Date:</strong> {formatDate(selectedSale.invoice_date || selectedSale.created_at)}</div>
                <div><strong>Client:</strong> {selectedSale.customers?.name || 'Client comptant'}</div>
              </div>
              <Table bordered size="sm">
                <thead className="table-light">
                  <tr>
                    <th>Produit</th>
                    <th>Catégorie</th>
                    <th className="text-center">Qté</th>
                    <th className="text-end">P.U.</th>
                    <th className="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {getSaleItems(selectedSale).map((it, idx) => (
                    <tr key={idx}>
                      <td>{it.product_name || it.name || 'Produit'}</td>
                      <td><Badge bg="info">{getItemCategory(it, productById)}</Badge></td>
                      <td className="text-center">{it.quantity}</td>
                      <td className="text-end">{formatNumber(it.price ?? it.unit_price)}</td>
                      <td className="text-end fw-bold">{formatNumber(it.total ?? (it.quantity * (it.price ?? it.unit_price)))}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div className="text-end mt-3 fs-5">
                <strong>Total: {formatNumber(selectedSale.grand_total ?? selectedSale.total)} {cur}</strong>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSelectedSale(null)}>Fermer</Button>
          <Button variant="primary" onClick={() => printInvoice(selectedSale)}>Imprimer</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={!!saleToEdit} onHide={() => !actionLoading && setSaleToEdit(null)} size="lg">
        <Modal.Header closeButton={!actionLoading}>
          <Modal.Title>Modifier la vente</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body>
            <Table bordered size="sm" className="mb-3">
              <thead className="table-light">
                <tr>
                  <th>Produit</th>
                  <th>Catégorie</th>
                  <th style={{ width: 100 }}>Qté</th>
                  <th style={{ width: 130 }}>Prix</th>
                  <th className="text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                {editItems.map((it, idx) => (
                  <tr key={idx}>
                    <td>{it.product_name || it.name || 'Produit'}</td>
                    <td><Badge bg="info">{getItemCategory(it, productById)}</Badge></td>
                    <td>
                      <Form.Control type="number" min="1" size="sm" value={it.quantity} onChange={e => { const a = [...editItems]; a[idx].quantity = parseInt(e.target.value, 10) || 1; setEditItems(a); }} />
                    </td>
                    <td>
                      <Form.Control type="number" min="0" size="sm" value={it.price} onChange={e => { const a = [...editItems]; a[idx].price = parseFloat(e.target.value) || 0; setEditItems(a); }} />
                    </td>
                    <td className="text-end fw-bold">{formatNumber(it.quantity * it.price)} {cur}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Row>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">Statut</Form.Label>
                  <Form.Select value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                    <option value="paid">Payée</option>
                    <option value="partial">Crédit</option>
                    <option value="draft">Brouillon</option>
                    <option value="cancelled">Annulée</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">Observation</Form.Label>
                  <Form.Control type="text" value={editNotes} onChange={e => setEditNotes(e.target.value)} />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setSaleToEdit(null)} disabled={actionLoading}>Annuler</Button>
            <Button variant="primary" type="submit" disabled={actionLoading}>Enregistrer</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={!!saleToDelete} onHide={() => !actionLoading && setSaleToDelete(null)}>
        <Modal.Header closeButton={!actionLoading}>
          <Modal.Title>Confirmer la suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <FaTrash size={40} className="text-danger mb-3" />
          <p>Supprimer la vente <strong>{saleToDelete?.invoice_number || saleToDelete?.id}</strong> ?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSaleToDelete(null)} disabled={actionLoading}>Annuler</Button>
          <Button variant="danger" onClick={handleDeleteConfirm} disabled={actionLoading}>Oui, supprimer</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showInvoice} onHide={() => setShowInvoice(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Vente Enregistrée</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <FaCheckCircle size={48} className="text-success mb-3" />
          <h4>Facture {lastSale?.invoice_number}</h4>
          <h5 className="text-primary">{formatNumber(lastSale?.grand_total)} {cur}</h5>
        </Modal.Body>
        <Modal.Footer className="justify-content-center">
          <Button variant="outline-secondary" onClick={() => printInvoice(lastSale)}>Imprimer</Button>
          <Button variant="primary" onClick={() => setShowInvoice(false)}>Fermer</Button>
          <Button variant="success" onClick={() => { setShowInvoice(false); setShowAddModal(true); }}>Nouvelle vente</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default VentesPage;