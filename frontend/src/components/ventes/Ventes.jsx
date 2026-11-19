// src/pages/VentesPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
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

/* ============================================================
   TRADUCTIONS
   ============================================================ */
const I18N = {
  fr: {
    dir: 'ltr', locale: 'fr-FR', currency: 'MRU',
    eyebrow: 'ESPACE COMMERCIAL', title: 'Gestion des ventes', subtitle: 'Suivez vos transactions et gérez vos factures.',
    add: 'Nouvelle vente', refresh: 'Actualiser',
    stat_revenue: 'Montant global', stat_revenue_sub: 'MRU · Toutes les ventes',
    stat_count: 'Total ventes', stat_count_sub: 'Transactions enregistrées',
    stat_month: 'Ventes du mois', stat_month_sub: (v) => `Revenus : ${v}`,
    stat_day: 'Ventes du jour', stat_day_sub: (v) => `Revenus : ${v}`,
    history: 'Historique des ventes', search_ph: 'N° facture ou nom du client...',
    all_status: 'Tous les statuts', all_payments: 'Tous les paiements', all_categories: 'Toutes les catégories',
    paid: 'Payée', partial: 'Crédit', draft: 'Brouillon', cancelled: 'Annulée',
    th_index: '#', th_invoice: 'Facture', th_customer: 'Client', th_products: 'Produit(s)', th_category: 'Catégorie', th_qty: 'Qté',
    th_unit: 'P.U.', th_total: 'Total', th_obs: 'Observation',
    th_status: 'Statut', th_date: 'Date', th_actions: 'Actions',
    view: 'Voir', edit: 'Modifier', delete: 'Supprimer', print: 'Imprimer', export: 'Exporter',
    cash: 'Espèces', bankily: 'Bankily', masrivi: 'Masrivi', sedad: 'Sedad', credit: 'Crédit', walk_in: 'Client comptant',
    units: (n) => `${n} unité(s)`,
    form_title: 'Nouvelle vente', form_sub: 'Renseignez les informations de la transaction.',
    f_invoice: 'Numéro facture', f_customer: 'Client', f_date: 'Date de vente',
    f_status: 'Statut', f_payment: 'Mode de paiement', f_notes: 'Observation',
    f_category: 'Catégorie', f_product: 'Produit', f_qty: 'Quantité', f_price: 'Prix unitaire', f_add_item: 'Ajouter article',
    purchase_price: "Prix d'achat", sale_price_ph: "Prix de vente",
    stock_available: (n) => `Stock dispo : ${n}`,
    err_stock: (n) => `Stock insuffisant. Il ne reste que ${n} unité(s).`,
    err_qty_invalid: 'Quantité invalide.',
    no_items: 'Aucun article ajouté', saving: 'Enregistrement...', save: 'Enregistrer', cancel: 'Annuler',
    err_save: 'Erreur lors de l\'enregistrement.', ok_sale: 'Vente enregistrée avec succès.',
    err_customer_credit: 'Sélectionnez un client pour le crédit.',
    err_price_invalid: 'Saisissez un prix unitaire valide.',
    edit_title: 'Modifier la vente', delete_q: 'Supprimer cette vente ?', delete_confirm: 'Oui, supprimer', deleting: 'Suppression...',
    details_title: 'Détails de la vente', success_invoice: 'Vente enregistrée', facture: 'FACTURE',
    thanks: 'Merci pour votre achat !', thanks_sub: 'Nous vous remercions de votre confiance.',
    err_load: 'Impossible de charger les ventes.', err_edit: 'Erreur modification.', err_delete: 'Erreur suppression.',
    ok_edit: 'Vente modifiée.', ok_delete: 'Vente supprimée.', close: 'Fermer',
    footer_total: 'Total affiché', footer_count: (n) => `${n} vente(s)`,
    export_all: 'Exporter en Excel', sort_by: 'Trier',
    no_data: 'Aucune vente trouvée.', no_data_sub: 'Modifiez votre recherche ou créez une nouvelle vente.',
    loading_sales: 'Chargement des ventes...',
  },
  ar: {
    dir: 'rtl', locale: 'ar-u-nu-latn', currency: 'أوقية',
    eyebrow: 'فضاء المبيعات', title: 'إدارة المبيعات', subtitle: 'تابع معاملاتك وأدر فواتيرك.',
    add: 'بيع جديد', refresh: 'تحديث',
    stat_revenue: 'المبلغ الإجمالي', stat_revenue_sub: 'أوقية · كل المبيعات',
    stat_count: 'إجمالي المبيعات', stat_count_sub: 'المعاملات المسجلة',
    stat_month: 'مبيعات الشهر', stat_month_sub: (v) => `الإيرادات: ${v}`,
    stat_day: 'مبيعات اليوم', stat_day_sub: (v) => `الإيرادات: ${v}`,
    history: 'سجل المبيعات', search_ph: 'رقم الفاتورة أو اسم العميل...',
    all_status: 'كل الحالات', all_payments: 'كل طرق الدفع', all_categories: 'كل الفئات',
    paid: 'مدفوعة', partial: 'آجل', draft: 'مسودة', cancelled: 'ملغاة',
    th_index: '#', th_invoice: 'الفاتورة', th_customer: 'العميل', th_products: 'المنتج', th_category: 'الفئة', th_qty: 'الكمية',
    th_unit: 'السعر', th_total: 'الإجمالي', th_obs: 'ملاحظة',
    th_status: 'الحالة', th_date: 'التاريخ', th_actions: 'إجراءات',
    view: 'عرض', edit: 'تعديل', delete: 'حذف', print: 'طباعة', export: 'تصدير',
    cash: 'نقدًا', bankily: 'بنكيلي', masrivi: 'مصرفي', sedad: 'سداد', credit: 'آجل', walk_in: 'عميل نقدي',
    units: (n) => `${n} وحدة`,
    form_title: 'بيع جديد', form_sub: 'أدخل معلومات المعاملة.',
    f_invoice: 'رقم الفاتورة', f_customer: 'العميل', f_date: 'تاريخ البيع',
    f_status: 'الحالة', f_payment: 'طريقة الدفع', f_notes: 'ملاحظة',
    f_category: 'الفئة', f_product: 'المنتج', f_qty: 'الكمية', f_price: 'سعر الوحدة', f_add_item: 'إضافة صنف',
    purchase_price: "سعر الشراء", sale_price_ph: "سعر البيع",
    stock_available: (n) => `المخزون المتاح: ${n}`,
    err_stock: (n) => `المخزون غير كافٍ. تبقى فقط ${n} وحدة.`,
    err_qty_invalid: 'الكمية غير صالحة.',
    no_items: 'لم يتم إضافة أصناف', saving: 'جارٍ التسجيل...', save: 'حفظ', cancel: 'إلغاء',
    err_save: 'خطأ في التسجيل.', ok_sale: 'تم تسجيل البيع بنجاح.',
    err_customer_credit: 'اختر عميلًا للبيع بالآجل.',
    err_price_invalid: 'أدخل سعر وحدة صحيحًا.',
    edit_title: 'تعديل البيع', delete_q: 'حذف هذا البيع؟', delete_confirm: 'نعم، احذف', deleting: 'جارٍ الحذف...',
    details_title: 'تفاصيل البيع', success_invoice: 'تم التسجيل', facture: 'فاتورة',
    thanks: 'شكرًا لك!', thanks_sub: 'نشكرك على ثقتك.',
    err_load: 'تعذّر التحميل.', err_edit: 'خطأ في التعديل.', err_delete: 'خطأ في الحذف.',
    ok_edit: 'تم التعديل.', ok_delete: 'تم الحذف.', close: 'إغلاق',
    footer_total: 'إجمالي المعروض', footer_count: (n) => `${n} عملية بيع`,
    export_all: 'تصدير إلى Excel', sort_by: 'ترتيب',
    no_data: 'لا توجد مبيعات.', no_data_sub: 'عدّل البحث أو أنشئ بيعًا جديدًا.',
    loading_sales: 'جارٍ تحميل المبيعات...',
  },
};

const formatNumber = (v) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(Number(v) || 0);
const formatDate = (v, locale) => {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
const escapeHtml = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ============================================================
   CATEGORIE DU PRODUIT
   ============================================================ */
const getItemCategory = (item, productById) => {
  if (!item) return '—';
  const fromMap = item.product_id != null ? productById?.[String(item.product_id)] : null;
  return (
    fromMap?.categories?.name ||
    fromMap?.category?.name ||
    fromMap?.category_name ||
    item?.categories?.name ||
    item?.category?.name ||
    item?.products?.categories?.name ||
    item?.products?.category?.name ||
    item?.products?.category_name ||
    item?.category_name ||
    item?.category ||
    '—'
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
const AddSaleModal = ({ isOpen, onClose, products, customers, onSubmit, loading, t, cur }) => {
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
    if (!newItem.product_id) return setLocalError(t.f_product + ' requis');
    const prod = products.find(p => String(p.id) === String(newItem.product_id));
    const price = Number(newItem.price);
    const qty = Number(newItem.quantity);
    const stock = Number(prod?.quantity ?? prod?.stock ?? 0);
    if (!Number.isFinite(price) || price <= 0) return setLocalError(t.err_price_invalid);
    if (!Number.isFinite(qty) || qty <= 0) return setLocalError(t.err_qty_invalid);
    const existingQty = items.filter(i => String(i.product_id) === String(newItem.product_id)).reduce((sum, i) => sum + i.quantity, 0);
    if (existingQty + qty > stock) return setLocalError(t.err_stock(stock - existingQty));
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
    if (items.length === 0) return setLocalError(t.no_items);
    const isCredit = form.payment_method === 'credit' || form.status === 'partial';
    if (isCredit && !form.customer_id) return setLocalError(t.err_customer_credit);
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
    <div className="ep-modal-overlay" onMouseDown={e => e.target === e.currentTarget && !loading && onClose()}>
      <div className="ep-modal medium" role="dialog" aria-modal="true">
        <div className="ep-modal-header">
          <div>
            <h3><span className="ep-modal-icon"><i className="fas fa-cash-register" /></span>{t.form_title}</h3>
            <p>{t.form_sub}</p>
          </div>
          <button type="button" className="btn-icon" onClick={onClose} disabled={loading}><i className="fas fa-times" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="ep-modal-body">
            {localError && (
              <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 8, background: 'var(--red-soft)', color: '#a3212e', fontSize: 13 }}>
                <i className="fas fa-exclamation-circle" style={{ marginInlineEnd: 6 }} />{localError}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginBottom: 12 }}>
              <div className="ep-form-group" style={{ marginBottom: 0 }}>
                <label>{t.f_customer}</label>
                <select name="customer_id" value={form.customer_id} onChange={handleChange}>
                  <option value="">{t.walk_in}</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div className="ep-form-group">
                <label>{t.f_date}</label>
                <input type="datetime-local" name="date" value={form.date} onChange={handleChange} />
              </div>
              <div className="ep-form-group">
                <label>{t.f_status}</label>
                <select name="status" value={form.status} onChange={handleChange}>
                  <option value="paid">{t.paid}</option>
                  <option value="partial">{t.partial}</option>
                  <option value="draft">{t.draft}</option>
                  <option value="cancelled">{t.cancelled}</option>
                </select>
              </div>
              <div className="ep-form-group">
                <label>{t.f_payment}</label>
                <select name="payment_method" value={form.payment_method} onChange={handleChange}>
                  <option value="cash">{t.cash}</option>
                  <option value="bankily">{t.bankily}</option>
                  <option value="masrivi">{t.masrivi}</option>
                  <option value="sedad">{t.sedad}</option>
                  <option value="credit">{t.credit}</option>
                </select>
              </div>
            </div>
            <div className="ep-section-title" style={{ marginTop: 16 }}>
              <span className="ep-section-num">1</span> Articles de la vente
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'end', flexWrap: 'wrap' }}>
              <div className="ep-form-group" style={{ width: 150, marginBottom: 0 }}>
                <label>{t.f_category}</label>
                <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setNewItem(p => ({ ...p, product_id: '' })); }}>
                  <option value="">Toutes</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="ep-form-group" style={{ flex: 2, marginBottom: 0, minWidth: 180 }}>
                <label>{t.f_product}</label>
                <select value={newItem.product_id} onChange={handleSelectProduct}>
                  <option value="">-- Sélectionner --</option>
                  {displayedProducts.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}{p.purchase_price ? ` — achat: ${formatNumber(p.purchase_price)} ${cur}` : ''}
                    </option>
                  ))}
                </select>
                {selectedProduct && (
                  <small style={{ display: 'block', marginTop: 4, color: 'var(--primary)', fontSize: 11, fontWeight: 700 }}>
                    <i className="fas fa-boxes" style={{ marginInlineEnd: 4 }} />
                    {t.stock_available(selectedProduct.quantity ?? selectedProduct.stock ?? 0)}
                  </small>
                )}
              </div>
              <div className="ep-form-group" style={{ width: 90, marginBottom: 0 }}>
                <label>{t.f_qty}</label>
                <input type="number" min="1" max={selectedProduct ? (selectedProduct.quantity ?? selectedProduct.stock ?? 0) : ''} value={newItem.quantity} onChange={e => setNewItem(p => ({ ...p, quantity: e.target.value }))} />
              </div>
              <div className="ep-form-group" style={{ width: 130, marginBottom: 0 }}>
                <label>{t.f_price}</label>
                <input type="number" min="0" step="0.01" value={newItem.price} onChange={e => setNewItem(p => ({ ...p, price: e.target.value }))} placeholder={t.sale_price_ph} />
              </div>
              <button type="button" className="ep-btn ep-btn-save" style={{ height: 38, padding: '0 12px' }} onClick={addItem}>
                <i className="fas fa-plus" />
              </button>
            </div>
            <table className="ep-items-table" style={{ border: '1px solid var(--line)', borderRadius: 8 }}>
              <thead>
                <tr>
                  <th>{t.f_product}</th>
                  <th>{t.th_category}</th>
                  <th className="ep-col-center" style={{ width: 80 }}>{t.f_qty}</th>
                  <th className="ep-col-end" style={{ width: 110 }}>{t.f_price}</th>
                  <th className="ep-col-end" style={{ width: 110 }}>{t.th_total}</th>
                  <th style={{ width: 50 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20, color: 'var(--muted)' }}>{t.no_items}</td></tr>
                ) : items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.name}</td>
                    <td><span className="ep-badge badge-blue">{item.category || getItemCategory(item, productById)}</span></td>
                    <td className="ep-col-center">{item.quantity}</td>
                    <td className="ep-col-end">{formatNumber(item.price)}</td>
                    <td className="ep-col-end" style={{ fontWeight: 700 }}>{formatNumber(item.price * item.quantity)}</td>
                    <td className="ep-col-center">
                      <button type="button" className="btn-icon btn-delete" onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}><i className="fas fa-trash-alt" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f8fafc' }}>
                  <td colSpan="4" style={{ textAlign: 'right', fontWeight: 700 }}>TOTAL :</td>
                  <td className="ep-col-end" style={{ fontWeight: 800, fontSize: 16 }}>{formatNumber(subtotal)} {cur}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
            <div className="ep-form-group" style={{ marginTop: 16 }}>
              <label>{t.f_notes}</label>
              <textarea rows="2" name="notes" value={form.notes} onChange={handleChange} placeholder="Notes optionnelles..." />
            </div>
          </div>
          <div className="ep-modal-footer">
            <button type="button" className="ep-btn ep-btn-cancel" onClick={onClose} disabled={loading}>{t.cancel}</button>
            <button type="submit" className="ep-btn ep-btn-save" disabled={loading || items.length === 0}>
              {loading ? <><i className="fas fa-spinner fa-spin" style={{ marginInlineEnd: 6 }} />{t.saving}</> : <><i className="fas fa-check" style={{ marginInlineEnd: 6 }} />{t.save}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ============================================================
   PAGE PRINCIPALE
   ============================================================ */
const VentesPage = () => {
  const { lang } = useLanguage();
  const t = I18N[lang];
  const cur = t.currency;

  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loadingSales, setLoadingSales] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [searchSale, setSearchSale] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  const [sortKey, setSortKey] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

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

  const showError = (m) => { setError(m); setSuccess(''); };
  const showSuccess = (m) => { setSuccess(m); setError(''); };

  useEffect(() => {
    if (!error && !success) return undefined;
    const timer = window.setTimeout(() => { setError(''); setSuccess(''); }, 4500);
    return () => window.clearTimeout(timer);
  }, [error, success]);

  useEffect(() => { fetchSales(); fetchProducts(); fetchCustomers(); }, []);

  const fetchSales = async () => {
    setLoadingSales(true);
    try {
      const res = await salesApi.getAll();
      const data = res?.data;
      setSales(Array.isArray(data) ? data : data?.data || []);
    } catch (err) { console.error(err); showError(t.err_load); }
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
        bankily: { label: t.bankily, tone: 'violet', icon: 'fa-mobile-alt' },
        masrivi: { label: t.masrivi, tone: 'amber', icon: 'fa-mobile-alt' },
        sedad: { label: t.sedad, tone: 'green', icon: 'fa-mobile-alt' },
        credit: { label: t.credit, tone: 'amber', icon: 'fa-hand-holding-usd' },
        cash: { label: t.cash, tone: 'green', icon: 'fa-money-bill-wave' },
      };
      return map[paymentMethod] || map.cash;
    }
    const statuses = {
      partial: { label: t.partial, tone: 'amber', icon: 'fa-clock' },
      draft: { label: t.draft, tone: 'gray', icon: 'fa-file' },
      cancelled: { label: t.cancelled, tone: 'rose', icon: 'fa-times-circle' },
    };
    return statuses[status] || { label: status || '—', tone: 'gray', icon: 'fa-question-circle' };
  };

  const getSaleItems = (sale) => sale?.items || sale?.invoice_items || sale?.items_sale || [];
  const getCustomerName = (sale) => {
    if (!sale) return t.walk_in;
    const c = customers.find(i => String(i.id) === String(sale.customer_id));
    return sale.customers?.name || sale.customer?.name || c?.name || t.walk_in;
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
      const cust = String(sale.customers?.name || sale.customer?.name || t.walk_in).toLowerCase();
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
  }, [sales, searchSale, filterStatus, filterPayment, filterCategory, startDateFilter, endDateFilter, t.walk_in, productById]);

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
  const sortIcon = (key) => {
    if (sortKey !== key) return 'fa-sort';
    return sortDir === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  };

  const stats = useMemo(() => {
    const valid = sales.filter(s => s.status !== 'cancelled');
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    let dailyS = 0, dailyR = 0, monthlyS = 0, monthlyR = 0;
    valid.forEach(s => {
      const d = new Date(s.invoice_date || s.created_at);
      if (Number.isNaN(d.getTime())) return;
      const ds = d.toISOString().split('T')[0];
      const amt = Number(s.grand_total ?? s.total ?? 0);
      if (ds === today) { dailyS++; dailyR += amt; }
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) { monthlyS++; monthlyR += amt; }
    });
    return {
      count: valid.length,
      revenue: valid.reduce((a, x) => a + Number(x.grand_total ?? x.total ?? 0), 0),
      dailyS, dailyR, monthlyS, monthlyR,
    };
  }, [sales]);

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
      showSuccess(t.ok_sale);
    } catch (err) {
      console.error('Erreur checkout:', err);
      showError(err?.message || t.err_save);
    }
    finally { setProcessing(false); }
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
      showSuccess(t.ok_edit);
    } catch (err) { console.error(err); showError(err?.message || t.err_edit); }
    finally { setActionLoading(false); }
  };

  const handleDeleteConfirm = async () => {
    if (!saleToDelete) return;
    setActionLoading(true);
    try {
      await salesApi.deleteSale(saleToDelete.id, getSaleItems(saleToDelete));
      setSaleToDelete(null);
      await Promise.all([fetchSales(), fetchProducts()]);
      showSuccess(t.ok_delete);
    } catch (err) { console.error(err); showError(err?.message || t.err_delete); }
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
    if (!win) return showError('Pop-up bloqué.');
    win.document.write(`<!DOCTYPE html><html lang="${lang}" dir="${t.dir}"><head><meta charset="UTF-8"><title>${invNum}</title>
    <style>*{box-sizing:border-box}body{margin:0;padding:30px;color:#14213d;font-family:${lang === 'ar' ? "'Cairo'," : ''}Arial,sans-serif}.inv{max-width:800px;margin:auto}.hdr{text-align:center;border-bottom:2px solid #14213d;padding-bottom:18px}.store{font-size:26px;font-weight:800}.muted{color:#66748b}h2{text-align:center;margin:24px 0}.meta{display:flex;justify-content:space-between;gap:15px;margin:25px 0}.meta>div{flex:1}.lbl{display:block;font-size:11px;color:#66748b;margin-bottom:5px}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#e8efff;text-align:${t.dir === 'rtl' ? 'right' : 'left'}}th,td{padding:11px 9px;border-bottom:1px solid #e3e9f2}.center{text-align:center}.right{text-align:${t.dir === 'rtl' ? 'left' : 'right'}}.totals{width:330px;margin:22px 0 0 auto}.row{display:flex;justify-content:space-between;padding:8px 0}.grand{border-top:2px solid #14213d;border-bottom:2px solid #14213d;font-size:19px;font-weight:800;padding:13px 0}.footer{margin-top:40px;border-top:1px solid #ddd;padding-top:18px;text-align:center;color:#66748b}@media print{body{padding:0}}</style></head><body>
    <div class="inv"><div class="hdr"><div class="store">${escapeHtml(STORE.name)}</div><div class="muted">${escapeHtml(STORE.address)}<br>${escapeHtml(STORE.phone)}</div></div>
    <h2>${t.facture}</h2><div class="meta"><div><span class="lbl">N°</span><strong>${escapeHtml(invNum)}</strong></div><div><span class="lbl">${t.th_date.toUpperCase()}</span><strong>${escapeHtml(formatDate(dateVal, t.locale))}</strong></div><div><span class="lbl">${t.f_customer.toUpperCase()}</span><strong>${escapeHtml(custName)}</strong></div></div>
    <table><thead><tr><th>${t.f_product}</th><th>${t.th_category}</th><th class="center">${t.f_qty}</th><th class="right">${t.f_price}</th><th class="right">${t.th_total}</th></tr></thead><tbody>${itemsHtml}</tbody></table>
    <div class="totals"><div class="row"><span>Sous-total</span><strong>${formatNumber(sub)} ${cur}</strong></div><div class="row"><span>Remise</span><strong>- ${formatNumber(disc)} ${cur}</strong></div><div class="row grand"><span>TOTAL</span><span>${formatNumber(tot)} ${cur}</span></div></div>
    <div class="footer">${t.thanks}<br>${t.thanks_sub}</div></div></body></html>`);
    win.document.close(); win.focus(); win.onload = () => win.print();
  };

  const exportSale = (sale) => {
    const items = getSaleItems(sale);
    const rows = [
      [t.th_invoice, sale.invoice_number || sale.id],
      [t.th_date, formatDate(sale.invoice_date || sale.created_at, t.locale)],
      [t.f_customer, getCustomerName(sale)],
      [t.th_status, getStatus(sale.status, sale.payment_method).label],
      [],
      [t.f_product, t.th_category, t.f_qty, t.f_price, t.th_total],
      ...items.map(i => [i.product_name || i.name, getItemCategory(i, productById), i.quantity, i.price, i.total ?? i.quantity * i.price]),
      [],
      ['TOTAL', '', '', '', sale.grand_total ?? sale.total],
    ];
    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Vente_${sale.invoice_number || sale.id}.csv`;
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  };

  const exportFilteredSales = () => {
    const rows = [
      [t.th_invoice, t.th_customer, t.th_products, t.th_category, t.th_qty, t.th_total, t.th_status, t.f_payment, t.th_date],
      ...filteredSales.map(s => [
        s.invoice_number || `VENTE-${s.id}`,
        getCustomerName(s),
        getProductNames(s),
        getSaleCategories(s, productById),
        getTotalQuantity(s),
        Number(s.grand_total ?? s.total ?? 0),
        getStatus(s.status, s.payment_method).label,
        getStatus(s.status, s.payment_method).label,
        formatDate(s.invoice_date || s.created_at, t.locale),
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
    setSearchSale('');
    setFilterStatus('all');
    setFilterPayment('all');
    setFilterCategory('all');
    setStartDateFilter('');
    setEndDateFilter('');
  };

  return (
    <div className="expenses-page" dir={t.dir} lang={lang}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
        .expenses-page {
          --ink:#14213d;--muted:#66748b;--line:#e3e9f2;--bg:#f2f5fb;--card:#fff;
          --primary:#1f5eea;--primary-soft:#e8efff;--green:#0f9d74;--green-soft:#def7ee;
          --violet:#6a4de0;--violet-soft:#ece8fd;--amber:#e08a0b;--amber-soft:#fff0d6;
          --red:#d63c4a;--red-soft:#fde8ea;--rose:#c2417c;--rose-soft:#fbe6f0;
          min-height:100vh;padding:clamp(14px,2.2vw,28px);background:radial-gradient(1000px 340px at 100% -80px,rgba(31,94,234,.08),transparent 70%),var(--bg);
          color:var(--ink);font-family:Inter,'Segoe UI',system-ui,Tahoma,Arial,sans-serif;width:100%;min-width:0;overflow-x:hidden;font-size:14px;
        }
        .expenses-page[lang="ar"]{font-family:Cairo,'Noto Sans Arabic',Tahoma,'Segoe UI',Arial,sans-serif}
        .expenses-page *{box-sizing:border-box}
        .expenses-page button:focus-visible,.expenses-page input:focus-visible,.expenses-page select:focus-visible,.expenses-page textarea:focus-visible{outline:3px solid rgba(31,94,234,.35);outline-offset:2px}
        .ep-amt{direction:ltr;unicode-bidi:isolate;font-variant-numeric:tabular-nums}
        .ep-hero{position:relative;isolation:isolate;overflow:hidden;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:18px;padding:clamp(20px,3vw,30px);margin-bottom:20px;border-radius:20px;color:#fff;background:linear-gradient(125deg,#0f2f66 0%,#1b55c9 58%,#2aa3d9 100%);box-shadow:0 14px 32px rgba(21,74,170,.2)}
        .ep-hero::after{content:"";position:absolute;z-index:-1;width:250px;height:250px;inset-inline-end:-70px;top:-115px;border:32px solid rgba(255,255,255,.09);border-radius:50%}
        .ep-eyebrow{font-size:12px;font-weight:800;letter-spacing:1.8px;opacity:.78}
        .ep-title h1{margin:6px 0 4px;font-size:clamp(22px,2.8vw,30px);font-weight:800;display:flex;align-items:center;gap:12px;line-height:1.25}
        .ep-title-icon{display:inline-grid;place-items:center;width:42px;height:42px;border-radius:12px;background:rgba(255,255,255,.16);font-size:18px}
        .ep-title p{margin:0;color:rgba(255,255,255,.82);font-size:13px}
        .ep-hero-actions{display:flex;align-items:center;flex-wrap:wrap;gap:10px}
        .ep-btn-add{display:inline-flex;align-items:center;gap:8px;padding:11px 18px;border:0;border-radius:11px;background:#fff;color:#174078;font:inherit;font-weight:800;font-size:13px;cursor:pointer;box-shadow:0 6px 16px rgba(0,0,0,.14);transition:.18s}
        .ep-btn-add:hover{transform:translateY(-2px)}
        .ep-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-bottom:20px}
        .ep-card{position:relative;overflow:hidden;display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:20px;background:var(--card);border:1px solid var(--line);border-inline-start:4px solid var(--accent);border-radius:16px;box-shadow:0 4px 14px rgba(20,33,61,.04);transition:transform .2s,box-shadow .2s}
        .ep-card:hover{transform:translateY(-2px);box-shadow:0 12px 24px rgba(20,33,61,.08)}
        .ep-card::after{content:"";position:absolute;inset-inline-end:-30px;bottom:-42px;width:105px;height:105px;border-radius:50%;background:var(--accent-soft);opacity:.7}
        .ep-card-info{position:relative;z-index:1;min-width:0}
        .ep-card-info h3{margin:0 0 9px;font-size:13px;color:var(--muted);font-weight:800}
        .ep-card-info .value{font-size:clamp(20px,2vw,26px);font-weight:800;letter-spacing:-.3px;color:var(--ink);overflow-wrap:anywhere}
        .ep-card-info .sub{margin-top:5px;font-size:12px;color:var(--accent);font-weight:700}
        .ep-icon{position:relative;z-index:1;flex:0 0 44px;width:44px;height:44px;border-radius:13px;display:grid;place-items:center;font-size:21px;background:var(--accent-soft);color:var(--accent)}
        .tone-blue{--accent:var(--primary);--accent-soft:var(--primary-soft)}.tone-amber{--accent:var(--amber);--accent-soft:var(--amber-soft)}
        .tone-violet{--accent:var(--violet);--accent-soft:var(--violet-soft)}.tone-green{--accent:var(--green);--accent-soft:var(--green-soft)}
        .tone-rose{--accent:var(--rose);--accent-soft:var(--rose-soft)}
        .ep-panel{background:var(--card);border-radius:16px;border:1px solid var(--line);overflow:hidden;box-shadow:0 4px 14px rgba(20,33,61,.035);margin-bottom:20px}
        .ep-panel-head{padding:16px 20px;border-bottom:1px solid var(--line);background:#fbfcff;display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px}
        .ep-panel-head h5{margin:0 0 4px;font-size:16px;font-weight:800}
        .ep-panel-head p{margin:0;font-size:12px;color:var(--muted)}
        
        /* ✅ FILTRES FIXES POUR MOBILE (horizontal scroll) */
        .ep-filters{display:flex;flex-wrap:nowrap;gap:8px;padding:12px;background:#fbfcff;border-bottom:1px solid var(--line);overflow-x:auto;-webkit-overflow-scrolling:touch;align-items:flex-end;}
        .ep-fg{display:flex;flex-direction:column;gap:5px;min-width:120px;flex:0 0 auto;}
        .ep-fg-search{min-width:200px;}
        .ep-fg label{font-size:11px;font-weight:800;color:#4b5b75;text-transform:none;letter-spacing:0;white-space:nowrap;}
        .ep-filter-input{width:100%;height:38px;border:1px solid #d9e1ed;border-radius:9px;padding:0 12px;font:inherit;font-size:13px;color:#2a3a55;background:#fff;outline:none}
        .ep-filter-input:focus{border-color:var(--primary);box-shadow:0 0 0 3px var(--primary-soft)}
        .ep-reset{height:38px;padding:0 13px;border:1px solid var(--line);border-radius:9px;background:#fff;color:#4b5b75;font:inherit;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap;flex:0 0 auto;}
        .ep-reset:hover{background:#f1f5fb}

        .ep-table-wrap{overflow-x:auto;width:100%;max-width:100%;-webkit-overflow-scrolling:touch}
        .ep-table{width:100%;min-width:1180px;border-collapse:collapse;white-space:normal}
        .ep-table th{background:#f3f6fc;color:#5b6b85;text-align:start;padding:11px 12px;font-size:11px;font-weight:800;letter-spacing:.4px;border-bottom:1px solid var(--line);white-space:nowrap;overflow-wrap:anywhere;user-select:none}
        .ep-table th.sortable{cursor:pointer}
        .ep-table th.sortable:hover{background:#e8eef9}
        .ep-table td{padding:10px 12px;border-bottom:1px solid #f0f3f8;font-size:12px;color:#44546d;vertical-align:middle;overflow-wrap:anywhere}
        .ep-table tbody tr:nth-child(even) td{background:#fafbfe}
        .ep-table tbody tr:hover td{background:#eff4ff}
        .ep-table tr:last-child td{border-bottom:0}
        .ep-col-end{text-align:end!important}.ep-col-center{text-align:center!important}
        .ep-state{padding:40px 18px!important;text-align:center;color:#8896ab!important}
        .ep-spinner{display:inline-block;width:22px;height:22px;margin-inline-end:10px;vertical-align:middle;border:3px solid #dbeafe;border-top-color:var(--primary);border-radius:50%;animation:ep-spin .75s linear infinite}
        @keyframes ep-spin{to{transform:rotate(360deg)}}
        .ep-customer-cell{display:flex;align-items:center;gap:10px;min-width:150px}
        .ep-avatar{flex:0 0 34px;width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:var(--primary-soft);color:var(--primary);font-size:13px}
        .ep-customer-name{max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700;color:#2a3a55;font-size:12px}
        .ep-ref{color:var(--primary);font-weight:800;font-size:12px}
        .ep-badge{display:inline-block;padding:4px 8px;border-radius:999px;font-size:11px;font-weight:800;white-space:nowrap}
        .badge-blue{background:var(--primary-soft);color:#164aba}.badge-violet{background:var(--violet-soft);color:#4a32b0}
        .badge-green{background:var(--green-soft);color:#0b6a4e}.badge-amber{background:var(--amber-soft);color:#94590a}
        .badge-rose{background:var(--rose-soft);color:#9c2a62}.badge-gray{background:#eef2f8;color:#4b5b75}
        .ep-money{font-weight:800;color:var(--ink);white-space:nowrap}
        .ep-money-total{color:#0b6a4e}
        .ep-actions{display:flex;gap:6px;justify-content:flex-end;flex-wrap:nowrap}
        .btn-icon{width:32px;height:32px;border-radius:8px;border:1px solid transparent;display:grid;place-items:center;cursor:pointer;transition:.18s;background:transparent;color:#64748b;font-size:12px}
        .btn-icon:hover{background:#eef2f8}
        .btn-view{background:var(--primary-soft);color:var(--primary);border-color:#c9daff}.btn-view:hover{background:var(--primary);color:#fff}
        .btn-edit{background:var(--amber-soft);color:var(--amber);border-color:#f5dcb0}.btn-edit:hover{background:var(--amber);color:#fff}
        .btn-delete{background:var(--red-soft);color:var(--red);border-color:#f6c8cd}.btn-delete:hover{background:var(--red);color:#fff}
        .ep-modal-overlay{position:fixed;inset:0;z-index:1060;display:flex;align-items:center;justify-content:center;padding:1rem;overflow-y:auto;background:rgba(0,0,0,.50);backdrop-filter:none}
        .ep-modal{display:flex;flex-direction:column;width:100%;max-width:800px;max-height:calc(100vh - 2rem);margin:auto;overflow:hidden;background:#fff;border:1px solid rgba(0,0,0,.2);border-radius:.5rem;box-shadow:0 .5rem 1rem rgba(0,0,0,.15)}
        .ep-modal.small{max-width:500px}.ep-modal.medium{max-width:700px}
        .ep-modal-header{flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1rem 1.25rem;color:#212529;background:#fff;border-bottom:1px solid #dee2e6}
        .ep-modal-header h3{display:flex;align-items:center;gap:.65rem;margin:0;color:#212529;font-size:1.15rem;font-weight:600}
        .ep-modal-header p{margin:.25rem 0 0 2.7rem;color:#6c757d;font-size:.875rem}
        .ep-modal-icon{width:34px;height:34px;border-radius:.375rem;display:inline-grid;place-items:center;background:var(--primary-soft);color:var(--primary);font-size:14px}
        .ep-modal-icon.success{background:var(--green-soft);color:var(--green)}.ep-modal-icon.amber{background:var(--amber-soft);color:var(--amber)}
        .ep-modal-body{flex:1 1 auto;min-height:0;padding:1.25rem;overflow-y:auto;overscroll-behavior:contain;background:#fff}
        .ep-modal-footer{flex:0 0 auto;display:flex;align-items:center;justify-content:flex-end;gap:.5rem;padding:.75rem 1.25rem;background:#fff;border-top:1px solid #dee2e6}
        .ep-modal-footer.center{justify-content:center}
        .ep-form-group{margin-bottom:.75rem}
        .ep-form-group label{display:block;margin-bottom:.45rem;color:#212529;font-size:.9rem;font-weight:600}
        .ep-form-group input,.ep-form-group select,.ep-form-group textarea{width:100%;min-height:38px;padding:.375rem .75rem;color:#212529;background:#fff;border:1px solid #ced4da;border-radius:.375rem;font:inherit;font-size:.95rem;outline:none}
        .ep-form-group input:focus,.ep-form-group select:focus,.ep-form-group textarea:focus{border-color:#86b7fe;box-shadow:0 0 0 .25rem rgba(13,110,253,.25)}
        .ep-btn{padding:.45rem .9rem;border-radius:.375rem;border:0;font:inherit;font-size:.9rem;font-weight:500;cursor:pointer;transition:.18s;box-shadow:none;transform:none}
        .ep-btn:hover:not(:disabled){filter:brightness(.96);transform:translateY(-1px)}
        .ep-btn:disabled{opacity:.6;cursor:not-allowed}
        .ep-btn-cancel,.ep-btn-outline{color:#fff;background:#6c757d;border:1px solid #6c757d}
        .ep-btn-save{color:#fff;background:#0d6efd;border:1px solid #0d6efd}
        .ep-btn-danger{color:#fff;background:#dc3545;border:1px solid #dc3545}
        .ep-section-title{display:flex;align-items:center;gap:9px;margin:18px 0 12px;font-size:14px;font-weight:800;color:#2a3a55}
        .ep-section-num{display:grid;place-items:center;width:24px;height:24px;border-radius:7px;background:var(--primary-soft);color:var(--primary);font-size:11px;font-weight:800}
        .ep-items-table{width:100%;border-collapse:collapse;border:1px solid var(--line);border-radius:10px;overflow:hidden;display:table;min-width:560px}
        .ep-items-table th{background:#f3f6fc;color:#5b6b85;text-align:start;padding:10px 12px;font-size:11px;font-weight:800;letter-spacing:.3px;text-transform:uppercase;border-bottom:1px solid var(--line)}
        .ep-items-table td{padding:10px 12px;font-size:12px;border-bottom:1px solid #f0f3f8}
        .ep-items-table tr:last-child td{border-bottom:0}
        .ep-detail-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px}
        @media(max-width:720px){.ep-detail-grid{grid-template-columns:1fr}}
        .ep-detail-item{padding:12px;border:1px solid var(--line);border-radius:10px;background:#fbfcff;overflow-wrap:anywhere}
        .ep-detail-item span{display:block;font-size:11px;color:var(--muted);margin-bottom:5px;font-weight:700}
        .ep-detail-item strong{font-size:13px;color:#2a3a55}
        .ep-toast{position:fixed;z-index:1100;top:20px;inset-inline-end:20px;width:min(420px,calc(100% - 40px));display:flex;align-items:flex-start;gap:12px;padding:14px 16px;border-radius:12px;background:#fff;box-shadow:0 12px 30px rgba(20,40,70,.15);border-inline-start:4px solid var(--primary);font-size:12px}
        .ep-toast.success{border-inline-start-color:var(--green);color:#0b6a4e}
        .ep-toast.danger{border-inline-start-color:var(--red);color:#a3212e}
        .ep-delete-body{padding:28px 22px 10px;text-align:center}
        .ep-delete-icon{display:inline-grid;place-items:center;width:58px;height:58px;margin-bottom:14px;border-radius:50%;background:var(--red-soft);color:var(--red);font-size:24px}
        .ep-delete-body h4{margin:0 0 6px;font-size:17px;font-weight:800}
        .ep-delete-body p{margin:0 0 10px;color:var(--muted);font-size:13px}
        /* ===== STYLE REFERENCE : compact ===== */
        .expenses-page { padding: 0; background: #f4f5f7; }
        .expenses-page .ep-stats { padding: 22px 10px 0; gap: 24px; margin-bottom: 24px; }
        .expenses-page .ep-card { min-height: 92px; padding: 16px 18px; border: 0; border-radius: 0; box-shadow: 0 2px 5px rgba(0,0,0,.16); color: #fff; }
        .expenses-page .ep-card-info h3, .expenses-page .ep-card-info .value, .expenses-page .ep-card-info .sub { color: #fff; }
        .expenses-page .ep-card-info h3 { font-size: 15px; margin-bottom: 4px; }
        .expenses-page .ep-card-info .value { font-size: 30px; line-height: 1.15; }
        .expenses-page .ep-card-info .sub { font-size: 11px; opacity: .9; }
        .expenses-page .ep-icon { background: transparent; color: #fff; font-size: 30px; }
        .expenses-page .tone-violet { background: #5954d6; --accent:#fff; --accent-soft:rgba(255,255,255,.12); }
        .expenses-page .tone-green { background: #159b45; --accent:#fff; --accent-soft:rgba(255,255,255,.12); }
        .expenses-page .tone-blue { background: #3295f0; --accent:#fff; --accent-soft:rgba(255,255,255,.12); }
        .expenses-page .tone-amber { background: #f5aa0b; --accent:#fff; --accent-soft:rgba(255,255,255,.12); }
        .expenses-page .ep-hero { margin: 0 0 16px; padding: 9px 16px; min-height: 55px; border-radius: 0; background: #5954d6; box-shadow: none; }
        .expenses-page .ep-hero::after { display:none; }
        .expenses-page .ep-eyebrow, .expenses-page .ep-title p { display:none; }
        .expenses-page .ep-title h1 { margin:0; font-size:22px; color:#fff; }
        .expenses-page .ep-title-icon { width:auto; height:auto; background:transparent; font-size:22px; }
        .expenses-page .ep-hero-actions { gap:8px; }
        .expenses-page .ep-btn-add { padding:9px 14px; border-radius:4px; background:#159b45; color:#fff; box-shadow:none; }
        .expenses-page .ep-btn-add:hover { background:#12853c; transform:none; }
        .expenses-page .ep-hero-refresh { min-height:36px; padding:7px 12px; border:0; border-radius:4px; background:#fff; color:#172033; }
        .expenses-page .ep-panel { margin:0 10px 20px; border-radius:0; box-shadow:none; }
        .expenses-page .ep-panel-head { padding:10px 14px; background:#5954d6; color:#fff; border:0; align-items:center; }
        .expenses-page .ep-panel-head h5, .expenses-page .ep-panel-head p { color:#fff; }
        .expenses-page .ep-panel-head h5 { font-size:18px; margin:0; }
        .expenses-page .ep-panel-head p { display:none; }
        .expenses-page .ep-panel-head h5 i { color:#fff !important; }
        .expenses-page .ep-panel-head .ep-btn { border-radius:4px; }
        
        /* ✅ Adapter le flex pour les filtres */
        .expenses-page .ep-filters { display:flex; gap:10px; padding:14px 12px; background:#fff; overflow-x:auto; }
        .expenses-page .ep-fg label { font-size:12px; letter-spacing:0; text-transform:none; }
        .expenses-page .ep-filter-input, .expenses-page .ep-reset { height:38px; font-size:13px; border-radius:4px; }
        
        .expenses-page .ep-table { min-width:760px; }
        .expenses-page .ep-table th { padding:9px 8px; background:#222833; color:#fff; border:1px solid #424b58; font-size:12px; white-space:nowrap; }
        .expenses-page .ep-table th.sortable:hover { background:#2f3744; }
        .expenses-page .ep-table td { padding:8px 8px; border:1px solid #d8dee8; font-size:12px; color:#172033; white-space:nowrap; max-width:180px; overflow:hidden; text-overflow:ellipsis; }
        .expenses-page .ep-table tbody tr:nth-child(odd) td { background:#f0f1f2; }
        .expenses-page .ep-table tbody tr:nth-child(even) td { background:#fff; }
        .expenses-page .ep-table tbody tr:hover td { background:#e8efff; }
        .expenses-page .ep-badge { font-size:11px; padding:3px 7px; }
        .expenses-page .ep-customer-name, .expenses-page .ep-ref { font-size:12px; }
        
        @media (max-width:900px) {
          .expenses-page .ep-stats { grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
          .expenses-page .ep-filters { padding:10px; }
          .expenses-page .ep-fg { min-width:110px; }
          .expenses-page .ep-fg-search { min-width:180px; }
        }
        @media (max-width:560px) {
          .expenses-page .ep-stats { grid-template-columns:repeat(2,minmax(0,1fr)); padding:12px 8px 0; gap:8px; }
          .expenses-page .ep-card { min-height:68px; padding:10px 11px; }
          .expenses-page .ep-card-info h3 { font-size:11px; }
          .expenses-page .ep-card-info .value { font-size:18px; }
          .expenses-page .ep-card-info .sub { font-size:10px; }
          .expenses-page .ep-icon { font-size:20px; flex-basis:24px; }
          .expenses-page .ep-hero { padding:9px 10px; gap:10px; min-height:48px; }
          .expenses-page .ep-title h1 { font-size:17px; }
          .expenses-page .ep-hero-actions { width:auto; }
          .expenses-page .ep-btn-add, .expenses-page .ep-hero-refresh { padding:8px 10px; font-size:12px; }
          .expenses-page .ep-panel { margin-inline:8px; }
          
          /* ✅ Les filtres restent sur une seule ligne défilante */
          .expenses-page .ep-filters { padding:8px 6px; gap:7px; }
          .expenses-page .ep-fg { min-width:100px; }
          .expenses-page .ep-fg-search { min-width:160px; }
          .expenses-page .ep-filter-input, .expenses-page .ep-reset { height:34px; font-size:12px; }
          
          .expenses-page .ep-table { min-width:720px; }
          .expenses-page .ep-table th { padding:8px 6px; font-size:11px; }
          .expenses-page .ep-table td { padding:7px 6px; font-size:11px; max-width:140px; }
          .expenses-page .ep-modal-overlay { padding: .4rem; align-items: center; }
          .expenses-page .ep-modal { max-height: calc(100dvh - .8rem); border-radius: .5rem; }
          .expenses-page .ep-modal-header { padding: .8rem 1rem; }
          .expenses-page .ep-modal-body { padding: 1rem; }
          .expenses-page .ep-modal-footer { padding: .7rem 1rem; flex-wrap: wrap; }
          .expenses-page .ep-modal-footer .ep-btn { flex: 1 1 auto; }
        }
        @media (max-width:420px) {
          .expenses-page .ep-stats { gap:6px; padding:8px 6px 0; }
          .expenses-page .ep-card { min-height:64px; padding:8px 9px; }
          .expenses-page .ep-card-info h3 { font-size:10px; }
          .expenses-page .ep-card-info .value { font-size:16px; }
          .expenses-page .ep-panel { margin-inline:6px; }
          .expenses-page .ep-filters { padding:8px; gap:6px; }
          .expenses-page .ep-detail-grid { grid-template-columns:1fr; }
        }
        .expenses-page[dir="rtl"] { text-align: right; }
        .expenses-page[dir="ltr"] { text-align: left; }
        .expenses-page input, .expenses-page textarea, .expenses-page select { max-width: 100%; }
        .ep-amt { direction: ltr; unicode-bidi: isolate; }
      `}</style>

      {error && <div className="ep-toast danger" role="alert"><span>⚠</span><div style={{ flex: 1 }}>{error}</div><button type="button" className="btn-icon" onClick={() => setError('')}><i className="fas fa-times" /></button></div>}
      {success && <div className="ep-toast success" role="status"><span>✓</span><div style={{ flex: 1 }}>{success}</div><button type="button" className="btn-icon" onClick={() => setSuccess('')}><i className="fas fa-times" /></button></div>}

      <section className="ep-stats">
        <div className="ep-card tone-violet">
          <div className="ep-card-info">
            <h3>{t.stat_revenue}</h3>
            <div className="value"><bdi className="ep-amt">{formatNumber(stats.revenue)}</bdi></div>
            <div className="sub">{t.stat_revenue_sub}</div>
          </div>
          <div className="ep-icon"><i className="fas fa-coins" /></div>
        </div>
        <div className="ep-card tone-green">
          <div className="ep-card-info">
            <h3>{t.stat_count}</h3>
            <div className="value">{stats.count}</div>
            <div className="sub">{t.stat_count_sub}</div>
          </div>
          <div className="ep-icon"><i className="fas fa-shopping-cart" /></div>
        </div>
        <div className="ep-card tone-blue">
          <div className="ep-card-info">
            <h3>{t.stat_month}</h3>
            <div className="value">{stats.monthlyS}</div>
            <div className="sub">{t.stat_month_sub(`${formatNumber(stats.monthlyR)} ${cur}`)}</div>
          </div>
          <div className="ep-icon"><i className="fas fa-calendar-alt" /></div>
        </div>
        <div className="ep-card tone-amber">
          <div className="ep-card-info">
            <h3>{t.stat_day}</h3>
            <div className="value">{stats.dailyS}</div>
            <div className="sub">{t.stat_day_sub(`${formatNumber(stats.dailyR)} ${cur}`)}</div>
          </div>
          <div className="ep-icon"><i className="fas fa-calendar-day" /></div>
        </div>
      </section>

      <header className="ep-hero">
        <div className="ep-title">
          <span className="ep-eyebrow"><i className="fas fa-chart-line" style={{ marginInlineEnd: 6 }} />{t.eyebrow}</span>
          <h1><span className="ep-title-icon"><i className="fas fa-cash-register" /></span>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <div className="ep-hero-actions">
          <button type="button" className="ep-btn ep-btn-outline ep-hero-refresh" onClick={() => { fetchSales(); fetchProducts(); fetchCustomers(); }} disabled={loadingSales}>
            <i className={`fas fa-sync-alt ${loadingSales ? 'fa-spin' : ''}`} />{t.refresh}
          </button>
          <button type="button" className="ep-btn-add" onClick={() => setShowAddModal(true)}>
            <i className="fas fa-plus" />{t.add}
          </button>
        </div>
      </header>

      <div className="ep-panel">
        <div className="ep-panel-head">
          <div><h5><i className="fas fa-list-alt" style={{ color: '#fff', marginInlineEnd: 8 }} />{t.history}</h5><p>{t.search_ph}</p></div>
          <button type="button" className="ep-btn ep-btn-outline" onClick={() => { fetchSales(); fetchProducts(); }} disabled={loadingSales}>
            <i className={`fas fa-sync-alt ${loadingSales ? 'fa-spin' : ''}`} style={{ marginInlineEnd: 6 }} />{t.refresh}
          </button>
        </div>

        {/* BARRE DE FILTRES ET EXPORT EN HAUT */}
        <div className="ep-filters">
          <div className="ep-fg ep-fg-search">
            <label>{t.th_invoice}</label>
            <input type="search" className="ep-filter-input" placeholder={t.search_ph} value={searchSale} onChange={e => setSearchSale(e.target.value)} />
          </div>
          <div className="ep-fg">
            <label>{t.th_category}</label>
            <select className="ep-filter-input" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="all">{t.all_categories}</option>
              {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="ep-fg">
            <label>{t.th_status}</label>
            <select className="ep-filter-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">{t.all_status}</option>
              <option value="paid">{t.paid}</option>
              <option value="partial">{t.partial}</option>
              <option value="draft">{t.draft}</option>
              <option value="cancelled">{t.cancelled}</option>
            </select>
          </div>
          <div className="ep-fg">
            <label>{t.f_payment}</label>
            <select className="ep-filter-input" value={filterPayment} onChange={e => setFilterPayment(e.target.value)}>
              <option value="all">{t.all_payments}</option>
              <option value="cash">{t.cash}</option>
              <option value="bankily">{t.bankily}</option>
              <option value="masrivi">{t.masrivi}</option>
              <option value="sedad">{t.sedad}</option>
              <option value="credit">{t.credit}</option>
            </select>
          </div>
          <div className="ep-fg">
            <label>Début</label>
            <input type="date" className="ep-filter-input" value={startDateFilter} onChange={e => setStartDateFilter(e.target.value)} />
          </div>
          <div className="ep-fg">
            <label>Fin</label>
            <input type="date" className="ep-filter-input" value={endDateFilter} onChange={e => setEndDateFilter(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8, flex: '0 0 auto' }}>
            {hasFilters && (
              <button type="button" className="ep-reset" onClick={resetFilters}>
                <i className="fas fa-rotate-left" />
              </button>
            )}
            <button type="button" className="ep-btn ep-btn-save" onClick={exportFilteredSales} style={{ height: 38, whiteSpace: 'nowrap' }}>
              <i className="fas fa-file-excel" style={{ marginInlineEnd: 6 }} /> {t.export_all}
            </button>
          </div>
        </div>

        <div className="ep-table-wrap">
          <table className="ep-table">
            <thead>
              <tr>
                <th>{t.th_index}</th>
                <th className="sortable" onClick={() => handleSort('invoice')} title={t.sort_by}>
                  {t.th_products} <i className={`fas ${sortIcon('invoice')}`} style={{ opacity: 0.6, marginInlineStart: 4 }} />
                </th>
                <th className="sortable" onClick={() => handleSort('category')} title={t.sort_by}>
                  {t.th_category} <i className={`fas ${sortIcon('category')}`} style={{ opacity: 0.6, marginInlineStart: 4 }} />
                </th>
                <th className="sortable" onClick={() => handleSort('customer')} title={t.sort_by}>
                  {t.th_customer} <i className={`fas ${sortIcon('customer')}`} style={{ opacity: 0.6, marginInlineStart: 4 }} />
                </th>
                <th className="ep-col-center">{t.th_qty}</th>
                <th className="ep-col-end">{t.th_unit}</th>
                <th className="ep-col-end sortable" onClick={() => handleSort('total')} title={t.sort_by}>
                  {t.th_total} <i className={`fas ${sortIcon('total')}`} style={{ opacity: 0.6, marginInlineStart: 4 }} />
                </th>
                <th className="sortable" onClick={() => handleSort('status')} title={t.sort_by}>
                  {t.th_status} <i className={`fas ${sortIcon('status')}`} style={{ opacity: 0.6, marginInlineStart: 4 }} />
                </th>
                <th className="sortable" onClick={() => handleSort('created_at')} title={t.sort_by}>
                  {t.th_date} <i className={`fas ${sortIcon('created_at')}`} style={{ opacity: 0.6, marginInlineStart: 4 }} />
                </th>
                <th className="ep-col-end">{t.th_actions}</th>
              </tr>
            </thead>
            <tbody>
              {loadingSales ? (
                <tr><td colSpan="10" className="ep-state"><span className="ep-spinner" />{t.loading_sales}</td></tr>
              ) : filteredSales.length === 0 ? (
                <tr><td colSpan="10" className="ep-state">
                  <div style={{ marginBottom: 8, fontSize: 22, color: 'var(--primary)' }}><i className="fas fa-file-invoice" /></div>
                  <div style={{ fontWeight: 800, color: '#2a3a55', fontSize: 15 }}>{t.no_data}</div>
                  <div style={{ marginTop: 4, fontSize: 12 }}>{t.no_data_sub}</div>
                </td></tr>
              ) : (
                sortedSales.map((sale, i) => {
                  const st = getStatus(sale.status, sale.payment_method);
                  const cn = sale.customers?.name || sale.customer?.name || t.walk_in;
                  const qty = getTotalQuantity(sale);
                  const avg = qty > 0 ? Number(sale.grand_total ?? sale.total ?? 0) / qty : 0;
                  const names = getProductNames(sale);
                  const cats = getSaleCategories(sale, productById);
                  return (
                    <tr key={sale.id}>
                      <td style={{ color: '#000204' }}>{i + 1}</td>
                      <td style={{ color: '#044dba' }} title={names}>{names}</td>
                      <td title={cats}><span className="ep-badge badge-violet">{cats}</span></td>
                      <td>
                        <div className="ep-customer-cell">
                          <div className="ep-avatar"><i className="fas fa-user" /></div>
                          <div className="ep-customer-name">{cn}</div>
                        </div>
                      </td>
                      <td className="ep-col-center"><span className="ep-badge badge-gray">{t.units(qty)}</span></td>
                      <td className="ep-col-end ep-money">{formatNumber(avg)} {cur}</td>
                      <td className="ep-col-end ep-money ep-money-total">{formatNumber(sale.grand_total ?? sale.total)} {cur}</td>
                      <td><span className={`ep-badge badge-${st.tone}`}><i className={`fas ${st.icon}`} style={{ marginInlineEnd: 5 }} />{st.label}</span></td>
                      <td style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }}>{formatDate(sale.invoice_date || sale.created_at, t.locale)}</td>
                      <td className="ep-col-end">
                        <div className="ep-actions">
                          <button type="button" className="btn-icon btn-view" title={t.view} onClick={() => setSelectedSale(sale)}><i className="fas fa-eye" /></button>
                          <button type="button" className="btn-icon btn-edit" title={t.edit} onClick={() => handleOpenEdit(sale)}><i className="fas fa-edit" /></button>
                          <button type="button" className="btn-icon btn-delete" title={t.delete} onClick={() => setSaleToDelete(sale)}><i className="fas fa-trash-alt" /></button>
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

      <AddSaleModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        products={products}
        customers={customers}
        onSubmit={handleAddSubmit}
        loading={processing}
        t={t}
        cur={cur}
      />

      {selectedSale && (
        <div className="ep-modal-overlay" onMouseDown={e => e.target === e.currentTarget && setSelectedSale(null)}>
          <div className="ep-modal medium" role="dialog" aria-modal="true">
            <div className="ep-modal-header">
              <div>
                <h3><span className="ep-modal-icon"><i className="fas fa-file-invoice" /></span>{t.details_title}</h3>
                <p>{selectedSale.invoice_number || `VENTE-${selectedSale.id}`}</p>
              </div>
              <button type="button" className="btn-icon" onClick={() => setSelectedSale(null)}><i className="fas fa-times" /></button>
            </div>
            <div className="ep-modal-body">
              <div className="ep-detail-grid">
                <div className="ep-detail-item"><span>{t.th_invoice}</span><strong>{selectedSale.invoice_number || `VENTE-${selectedSale.id}`}</strong></div>
                <div className="ep-detail-item"><span>{t.f_customer}</span><strong>{getCustomerName(selectedSale)}</strong></div>
                <div className="ep-detail-item"><span>{t.th_date}</span><strong>{formatDate(selectedSale.invoice_date || selectedSale.created_at, t.locale)}</strong></div>
              </div>
              <div className="ep-section-title"><span className="ep-section-num">1</span> Articles vendus</div>
              <table className="ep-items-table">
                <thead>
                  <tr>
                    <th>{t.f_product}</th>
                    <th>{t.th_category}</th>
                    <th className="ep-col-center">{t.f_qty}</th>
                    <th className="ep-col-end">{t.f_price}</th>
                    <th className="ep-col-end">{t.th_total}</th>
                  </tr>
                </thead>
                <tbody>
                  {getSaleItems(selectedSale).length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: 20, color: 'var(--muted)' }}>Aucun détail</td></tr>
                  ) : getSaleItems(selectedSale).map((it, idx) => {
                    const q = Number(it.quantity) || 0;
                    const p = Number(it.price ?? it.unit_price) || 0;
                    const lt = Number(it.total ?? q * p);
                    return (
                      <tr key={idx}>
                        <td>{it.product_name || it.name || it.products?.name || 'Produit'}</td>
                        <td><span className="ep-badge badge-violet">{getItemCategory(it, productById)}</span></td>
                        <td className="ep-col-center">{q}</td>
                        <td className="ep-col-end">{formatNumber(p)} {cur}</td>
                        <td className="ep-col-end" style={{ fontWeight: 800 }}>{formatNumber(lt)} {cur}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ marginTop: 16, padding: 12, borderRadius: 10, background: '#f8fafc', display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                <span>Total</span>
                <span>{formatNumber(selectedSale.grand_total ?? selectedSale.total)} {cur}</span>
              </div>
            </div>
            <div className="ep-modal-footer">
              <button type="button" className="ep-btn ep-btn-outline" onClick={() => setSelectedSale(null)}>{t.close}</button>
              <button type="button" className="ep-btn ep-btn-outline" onClick={() => exportSale(selectedSale)}><i className="fas fa-download" style={{ marginInlineEnd: 6 }} />{t.export}</button>
              <button type="button" className="ep-btn ep-btn-save" onClick={() => printInvoice(selectedSale)}><i className="fas fa-print" style={{ marginInlineEnd: 6 }} />{t.print}</button>
            </div>
          </div>
        </div>
      )}

      {saleToEdit && (
        <div className="ep-modal-overlay" onMouseDown={e => e.target === e.currentTarget && !actionLoading && setSaleToEdit(null)}>
          <div className="ep-modal medium" role="dialog" aria-modal="true">
            <div className="ep-modal-header">
              <h3><span className="ep-modal-icon amber"><i className="fas fa-edit" /></span>{t.edit_title}</h3>
              <button type="button" className="btn-icon" onClick={() => setSaleToEdit(null)} disabled={actionLoading}><i className="fas fa-times" /></button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="ep-modal-body">
                <div className="ep-detail-grid">
                  <div className="ep-detail-item"><span>{t.th_invoice}</span><strong>{saleToEdit.invoice_number || `VENTE-${saleToEdit.id}`}</strong></div>
                  <div className="ep-detail-item"><span>{t.f_customer}</span><strong>{getCustomerName(saleToEdit)}</strong></div>
                  <div className="ep-detail-item"><span>{t.th_date}</span><strong>{formatDate(saleToEdit.invoice_date || saleToEdit.created_at, t.locale)}</strong></div>
                </div>
                <div className="ep-section-title"><span className="ep-section-num">1</span> Articles</div>
                <table className="ep-items-table">
                  <thead>
                    <tr>
                      <th>{t.f_product}</th>
                      <th>{t.th_category}</th>
                      <th className="ep-col-center" style={{ width: 90 }}>{t.f_qty}</th>
                      <th className="ep-col-end" style={{ width: 130 }}>{t.f_price}</th>
                      <th className="ep-col-end">{t.th_total}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editItems.map((it, idx) => (
                      <tr key={idx}>
                        <td>{it.product_name || it.name || it.products?.name || 'Produit'}</td>
                        <td><span className="ep-badge badge-violet">{getItemCategory(it, productById)}</span></td>
                        <td className="ep-col-center">
                          <input type="number" min="1" style={{ width: '100%', border: '1px solid var(--line)', borderRadius: 6, padding: 5, textAlign: 'center' }} value={it.quantity} onChange={e => { const a = [...editItems]; a[idx].quantity = parseInt(e.target.value, 10) || 1; setEditItems(a); }} />
                        </td>
                        <td className="ep-col-end">
                          <input type="number" min="0" style={{ width: '100%', border: '1px solid var(--line)', borderRadius: 6, padding: 5, textAlign: 'end' }} value={it.price} onChange={e => { const a = [...editItems]; a[idx].price = parseFloat(e.target.value) || 0; setEditItems(a); }} />
                        </td>
                        <td className="ep-col-end" style={{ fontWeight: 800 }}>{formatNumber(it.quantity * it.price)} {cur}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
                  <div className="ep-form-group" style={{ marginBottom: 0 }}>
                    <label>Statut</label>
                    <select value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                      <option value="paid">{t.paid}</option>
                      <option value="partial">{t.partial}</option>
                      <option value="draft">{t.draft}</option>
                      <option value="cancelled">{t.cancelled}</option>
                    </select>
                  </div>
                  <div className="ep-form-group" style={{ marginBottom: 0 }}>
                    <label>Observation</label>
                    <textarea rows="1" value={editNotes} onChange={e => setEditNotes(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="ep-modal-footer">
                <button type="button" className="ep-btn ep-btn-cancel" onClick={() => setSaleToEdit(null)} disabled={actionLoading}>{t.cancel}</button>
                <button type="submit" className="ep-btn ep-btn-save" disabled={actionLoading}>
                  {actionLoading ? <><i className="fas fa-spinner fa-spin" style={{ marginInlineEnd: 6 }} />Enregistrement...</> : <><i className="fas fa-save" style={{ marginInlineEnd: 6 }} />{t.save}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {saleToDelete && (
        <div className="ep-modal-overlay" onMouseDown={e => e.target === e.currentTarget && !actionLoading && setSaleToDelete(null)}>
          <div className="ep-modal small" role="alertdialog" aria-modal="true">
            <div className="ep-delete-body">
              <span className="ep-delete-icon"><i className="fas fa-trash-alt" /></span>
              <h4>{t.delete_q}</h4>
              <p>Facture {saleToDelete.invoice_number || saleToDelete.id}</p>
            </div>
            <div className="ep-modal-footer center">
              <button type="button" className="ep-btn ep-btn-cancel" onClick={() => setSaleToDelete(null)} disabled={actionLoading}>{t.cancel}</button>
              <button type="button" className="ep-btn ep-btn-danger" onClick={handleDeleteConfirm} disabled={actionLoading}>
                {actionLoading ? <><i className="fas fa-spinner fa-spin" style={{ marginInlineEnd: 6 }} />{t.deleting}</> : <><i className="fas fa-trash-alt" style={{ marginInlineEnd: 6 }} />{t.delete_confirm}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {showInvoice && lastSale && (
        <div className="ep-modal-overlay" onMouseDown={e => e.target === e.currentTarget && setShowInvoice(false)}>
          <div className="ep-modal medium" role="dialog" aria-modal="true">
            <div className="ep-modal-header">
              <div>
                <h3><span className="ep-modal-icon success"><i className="fas fa-check-circle" /></span>{t.success_invoice}</h3>
                <p>{t.th_invoice} : {lastSale.invoice_number || `VENTE-${lastSale.id}`}</p>
              </div>
              <button type="button" className="btn-icon" onClick={() => setShowInvoice(false)}><i className="fas fa-times" /></button>
            </div>
            <div className="ep-modal-body">
              <div style={{ textAlign: 'center', paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid var(--line)' }}>
                <div style={{ color: 'var(--primary)', marginBottom: 8 }}><i className="fas fa-store" style={{ fontSize: 24 }} /></div>
                <h3 style={{ margin: '0 0 4px', fontWeight: 800 }}>{STORE.name}</h3>
                <div style={{ color: 'var(--muted)', fontSize: 12 }}>{STORE.address}<br />{STORE.phone}</div>
                <h4 style={{ margin: '12px 0 0', fontWeight: 800 }}>{t.facture}</h4>
              </div>
              <div className="ep-detail-grid">
                <div className="ep-detail-item"><span>N°</span><strong>{lastSale.invoice_number || `VENTE-${lastSale.id}`}</strong></div>
                <div className="ep-detail-item"><span>Date</span><strong>{formatDate(lastSale.invoice_date || lastSale.created_at, t.locale)}</strong></div>
                <div className="ep-detail-item"><span>Client</span><strong>{getCustomerName(lastSale)}</strong></div>
              </div>
              <table className="ep-items-table">
                <thead>
                  <tr>
                    <th>{t.f_product}</th>
                    <th>{t.th_category}</th>
                    <th className="ep-col-center">{t.f_qty}</th>
                    <th className="ep-col-end">{t.f_price}</th>
                    <th className="ep-col-end">{t.th_total}</th>
                  </tr>
                </thead>
                <tbody>
                  {getSaleItems(lastSale).map((it, idx) => {
                    const q = Number(it.quantity) || 0;
                    const p = Number(it.price ?? it.unit_price) || 0;
                    const lt = Number(it.total ?? q * p);
                    return (
                      <tr key={idx}>
                        <td>{it.product_name || it.name || it.products?.name || 'Produit'}</td>
                        <td><span className="ep-badge badge-violet">{getItemCategory(it, productById)}</span></td>
                        <td className="ep-col-center">{q}</td>
                        <td className="ep-col-end">{formatNumber(p)} {cur}</td>
                        <td className="ep-col-end" style={{ fontWeight: 800 }}>{formatNumber(lt)} {cur}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ marginTop: 16, padding: 12, borderRadius: 10, background: '#f8fafc', display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                <span>TOTAL À PAYER</span>
                <span style={{ color: 'var(--primary)' }}>{formatNumber(lastSale.grand_total ?? lastSale.total)} {cur}</span>
              </div>
              <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                {t.thanks}<br />{t.thanks_sub}
              </div>
            </div>
            <div className="ep-modal-footer">
              <button type="button" className="ep-btn ep-btn-outline" onClick={() => printInvoice(lastSale)}><i className="fas fa-print" style={{ marginInlineEnd: 6 }} />{t.print}</button>
              <button type="button" className="ep-btn ep-btn-outline" onClick={() => setShowInvoice(false)}>{t.close}</button>
              <button type="button" className="ep-btn ep-btn-save" onClick={() => { setShowInvoice(false); setLastSale(null); setShowAddModal(true); }}>
                <i className="fas fa-plus" style={{ marginInlineEnd: 6 }} />{t.add}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VentesPage;