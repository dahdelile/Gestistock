// src/pages/VentesPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Card, Badge, Button, Tabs, Tab, Row, Col, Form, InputGroup, Table, Alert, Spinner } from 'react-bootstrap';
import { FaCashRegister, FaUserShield, FaUser, FaSyncAlt, FaPlus, FaFileExcel, FaUsers, FaExchangeAlt, FaHistory, FaChartBar, FaSearch, FaFilter, FaTimes, FaInfoCircle, FaEye, FaEdit, FaTrashAlt, FaPrint, FaDownload, FaCoins, FaShoppingCart, FaCalendarAlt, FaCalendarDay, FaCheck, FaBox } from 'react-icons/fa';
import { productsApi, customersApi, salesApi } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import './Ventes.css';

const STORE = { name: 'GESTION STOCK', address: 'Nouakchott, Mauritanie', phone: '+222 XX XX XX XX' };

const toNumOrNull = (v) => { if (v === '' || v === null || v === undefined) return null; const n = Number(v); return Number.isFinite(n) ? n : null; };
const toNumOrZero = (v) => toNumOrNull(v) ?? 0;
const toTextOrNull = (v) => { if (v === null || v === undefined) return null; const s = String(v).trim(); return s === '' ? null : s; };

const I18N = {
  fr: {
    dir: 'ltr', locale: 'fr-FR', currency: 'MRU',
    eyebrow: 'ESPACE COMMERCIAL', title: 'Gestion des ventes', subtitle: 'Suivez vos transactions et gérez vos factures.',
    add: 'Nouvelle vente', refresh: 'Rafraîchir',
    stat_revenue: 'Montant global', stat_revenue_sub: 'MRU · Toutes les ventes',
    stat_count: 'Total ventes', stat_count_sub: 'Transactions enregistrées',
    stat_month: 'Ventes du mois', stat_month_sub: (v) => `Revenus : ${v}`,
    stat_day: 'Ventes du jour', stat_day_sub: (v) => `Revenus : ${v}`,
    history: 'Historique des ventes', search_ph: 'N° facture ou nom du client...',
    all_status: 'Tous les statuts', all_payments: 'Tous les paiements', all_categories: 'Toutes les catégories',
    paid: 'Payée', partial: 'Crédit', draft: 'Brouillon', cancelled: 'Annulée',
    th_products: 'Produit(s)', th_category: 'Catégorie', th_qty: 'Qté',
    th_unit: 'P.U.', th_total: 'Total', th_status: 'Statut', th_date: 'Date', th_actions: 'Actions',
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
    err_qty_invalid: 'Quantité invalide.', no_items: 'Aucun article ajouté', saving: 'Enregistrement...', save: 'Enregistrer', cancel: 'Annuler',
    err_save: "Erreur lors de l'enregistrement.", ok_sale: 'Vente enregistrée avec succès.',
    err_customer_credit: 'Sélectionnez un client pour le crédit.', err_price_invalid: 'Saisissez un prix unitaire valide.',
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
    th_products: 'المنتج', th_category: 'الفئة', th_qty: 'الكمية',
    th_unit: 'السعر', th_total: 'الإجمالي', th_status: 'الحالة', th_date: 'التاريخ', th_actions: 'إجراءات',
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
    err_qty_invalid: 'الكمية غير صالحة.', no_items: 'لم يتم إضافة أصناف', saving: 'جارٍ التسجيل...', save: 'حفظ', cancel: 'إلغاء',
    err_save: 'خطأ في التسجيل.', ok_sale: 'تم تسجيل البيع بنجاح.',
    err_customer_credit: 'اختر عميلًا للبيع بالآجل.', err_price_invalid: 'أدخل سعر وحدة صحيحًا.',
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
const formatDate = (v, locale) => { if (!v) return '—'; const d = new Date(v); if (Number.isNaN(d.getTime())) return '—'; return d.toLocaleString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); };
const escapeHtml = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const getItemCategory = (item, productById) => {
  if (!item) return '—';
  const fromMap = item.product_id != null ? productById?.[String(item.product_id)] : null;
  return fromMap?.categories?.name || fromMap?.category?.name || fromMap?.category_name || item?.categories?.name || item?.category?.name || item?.products?.categories?.name || item?.products?.category?.name || item?.products?.category_name || item?.category_name || item?.category || '—';
};
const getSaleCategories = (sale, productById) => {
  const items = sale?.items || sale?.invoice_items || sale?.items_sale || [];
  const cats = [];
  items.forEach((it) => { const c = getItemCategory(it, productById); if (c && c !== '—' && !cats.includes(c)) cats.push(c); });
  return cats.length ? cats.join(', ') : '—';
};

/* ================= MODALE AJOUT ================= */
const AddSaleModal = ({ isOpen, onClose, products, customers, onSubmit, loading, t, cur }) => {
  const buildInitialForm = () => ({ invoice_number: `INV-${Date.now().toString().slice(-6)}`, customer_id: '', status: 'paid', payment_method: 'cash', date: new Date().toISOString().slice(0, 16), notes: '' });
  const [form, setForm] = useState(buildInitialForm);
  const [items, setItems] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [newItem, setNewItem] = useState({ product_id: '', quantity: 1, price: '' });
  const [localError, setLocalError] = useState('');
  useEffect(() => { if (isOpen) { setForm(buildInitialForm()); setItems([]); setCategoryFilter(''); setNewItem({ product_id: '', quantity: 1, price: '' }); setLocalError(''); } }, [isOpen]);
  const productById = useMemo(() => { const m = {}; products.forEach((p) => { m[String(p.id)] = p; }); return m; }, [products]);
  const categories = useMemo(() => { const cats = products.map(p => p.categories?.name || p.category?.name || p.category_name || 'Non catégorisé'); return [...new Set(cats)].sort(); }, [products]);
  const displayedProducts = useMemo(() => { if (!categoryFilter) return products; return products.filter(p => (p.categories?.name || p.category?.name || p.category_name || 'Non catégorisé') === categoryFilter); }, [products, categoryFilter]);
  if (!isOpen) return null;
  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleSelectProduct = (e) => { setNewItem(p => ({ ...p, product_id: e.target.value, price: '' })); setLocalError(''); };
  const addItem = () => {
    if (!newItem.product_id) return setLocalError(t.f_product + ' requis');
    const prod = products.find(p => String(p.id) === String(newItem.product_id));
    const price = Number(newItem.price); const qty = Number(newItem.quantity); const stock = Number(prod?.quantity ?? prod?.stock ?? 0);
    if (!Number.isFinite(price) || price <= 0) return setLocalError(t.err_price_invalid);
    if (!Number.isFinite(qty) || qty <= 0) return setLocalError(t.err_qty_invalid);
    const existingQty = items.filter(i => String(i.product_id) === String(newItem.product_id)).reduce((sum, i) => sum + i.quantity, 0);
    if (existingQty + qty > stock) return setLocalError(t.err_stock(stock - existingQty));
    setItems(prev => [...prev, { product_id: newItem.product_id, name: prod?.name || 'Produit', category: prod?.categories?.name || prod?.category?.name || prod?.category_name || '—', purchase_price: Number(prod?.purchase_price ?? 0), quantity: qty, price, stock }]);
    setNewItem({ product_id: '', quantity: 1, price: '' }); setLocalError('');
  };
  const handleSubmit = async (e) => {
    e.preventDefault(); setLocalError('');
    if (items.length === 0) return setLocalError(t.no_items);
    const isCredit = form.payment_method === 'credit' || form.status === 'partial';
    if (isCredit && !form.customer_id) return setLocalError(t.err_customer_credit);
    const totalNum = items.reduce((s, i) => s + (Number(i.price) * Number(i.quantity)), 0);
    const payload = { invoice_number: toTextOrNull(form.invoice_number), customer_id: toNumOrNull(form.customer_id), status: toTextOrNull(form.status) || 'paid', payment_method: toTextOrNull(form.payment_method) || 'cash', notes: toTextOrNull(form.notes), invoice_date: form.date ? new Date(form.date).toISOString() : new Date().toISOString(), total: totalNum, grand_total: totalNum, subtotal: totalNum, discount: 0, paid_amount: isCredit ? 0 : totalNum, balance: isCredit ? totalNum : 0, amount_received: isCredit ? 0 : totalNum, change_amount: 0, items: items.map(i => ({ product_id: toNumOrNull(i.product_id), quantity: toNumOrZero(i.quantity), price: toNumOrZero(i.price), unit_price: toNumOrZero(i.price), total: toNumOrZero(Number(i.price) * Number(i.quantity)) })) };
    await onSubmit(payload);
  };
  const subtotal = items.reduce((s, i) => s + (i.price * i.quantity), 0);
  const selectedProduct = products.find(p => String(p.id) === String(newItem.product_id));
  return (
    <div className="ep-modal-overlay" onMouseDown={e => e.target === e.currentTarget && !loading && onClose()}>
      <div className="ep-modal medium" role="dialog" aria-modal="true">
        <div className="ep-modal-header"><div><h3><span className="ep-modal-icon"><i className="fas fa-cash-register" /></span>{t.form_title}</h3><p>{t.form_sub}</p></div><button type="button" className="btn-icon" onClick={onClose} disabled={loading}><i className="fas fa-times" /></button></div>
        <form onSubmit={handleSubmit}>
          <div className="ep-modal-body">
            {localError && <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 8, background: 'var(--red-soft)', color: '#a3212e', fontSize: 13 }}><i className="fas fa-exclamation-circle" style={{ marginInlineEnd: 6 }} />{localError}</div>}
            <div className="ep-form-group"><label>{t.f_customer}</label><select name="customer_id" value={form.customer_id} onChange={handleChange}><option value="">{t.walk_in}</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div className="ep-form-group"><label>{t.f_date}</label><input type="datetime-local" name="date" value={form.date} onChange={handleChange} /></div>
              <div className="ep-form-group"><label>{t.f_status}</label><select name="status" value={form.status} onChange={handleChange}><option value="paid">{t.paid}</option><option value="partial">{t.partial}</option><option value="draft">{t.draft}</option><option value="cancelled">{t.cancelled}</option></select></div>
              <div className="ep-form-group"><label>{t.f_payment}</label><select name="payment_method" value={form.payment_method} onChange={handleChange}><option value="cash">{t.cash}</option><option value="bankily">{t.bankily}</option><option value="masrivi">{t.masrivi}</option><option value="sedad">{t.sedad}</option><option value="credit">{t.credit}</option></select></div>
            </div>
            <div className="ep-section-title" style={{ marginTop: 16 }}><span className="ep-section-num">1</span> Articles de la vente</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'end', flexWrap: 'wrap' }}>
              <div className="ep-form-group" style={{ width: 150, marginBottom: 0 }}><label>{t.f_category}</label><select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setNewItem(p => ({ ...p, product_id: '' })); }}><option value="">Toutes</option>{categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
              <div className="ep-form-group" style={{ flex: 2, marginBottom: 0, minWidth: 180 }}><label>{t.f_product}</label><select value={newItem.product_id} onChange={handleSelectProduct}><option value="">-- Sélectionner --</option>{displayedProducts.map(p => <option key={p.id} value={p.id}>{p.name}{p.purchase_price ? ` — achat: ${formatNumber(p.purchase_price)} ${cur}` : ''}</option>)}</select>{selectedProduct && <small style={{ display: 'block', marginTop: 4, color: 'var(--primary)', fontSize: 11, fontWeight: 700 }}><i className="fas fa-boxes" style={{ marginInlineEnd: 4 }} />{t.stock_available(selectedProduct.quantity ?? selectedProduct.stock ?? 0)}</small>}</div>
              <div className="ep-form-group" style={{ width: 90, marginBottom: 0 }}><label>{t.f_qty}</label><input type="number" min="1" value={newItem.quantity} onChange={e => setNewItem(p => ({ ...p, quantity: e.target.value }))} /></div>
              <div className="ep-form-group" style={{ width: 130, marginBottom: 0 }}><label>{t.f_price}</label><input type="number" min="0" step="0.01" value={newItem.price} onChange={e => setNewItem(p => ({ ...p, price: e.target.value }))} placeholder={t.sale_price_ph} /></div>
              <button type="button" className="ep-btn ep-btn-save" style={{ height: 38, padding: '0 12px' }} onClick={addItem}><i className="fas fa-plus" /></button>
            </div>
            <table className="ep-items-table"><thead><tr><th>{t.f_product}</th><th>{t.th_category}</th><th className="ep-col-center" style={{ width: 80 }}>{t.f_qty}</th><th className="ep-col-end" style={{ width: 110 }}>{t.f_price}</th><th className="ep-col-end" style={{ width: 110 }}>{t.th_total}</th><th style={{ width: 50 }}></th></tr></thead><tbody>{items.length === 0 ? <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20, color: 'var(--muted)' }}>{t.no_items}</td></tr> : items.map((item, idx) => (<tr key={idx}><td>{item.name}</td><td><span className="ep-badge badge-blue">{item.category}</span></td><td className="ep-col-center">{item.quantity}</td><td className="ep-col-end">{formatNumber(item.price)}</td><td className="ep-col-end" style={{ fontWeight: 700 }}>{formatNumber(item.price * item.quantity)}</td><td className="ep-col-center"><button type="button" className="btn-icon btn-delete" onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}><i className="fas fa-trash-alt" /></button></td></tr>))}</tbody><tfoot><tr style={{ background: '#f8fafc' }}><td colSpan="4" style={{ textAlign: 'right', fontWeight: 700 }}>TOTAL :</td><td className="ep-col-end" style={{ fontWeight: 800, fontSize: 16 }}>{formatNumber(subtotal)} {cur}</td><td></td></tr></tfoot></table>
            <div className="ep-form-group" style={{ marginTop: 16 }}><label>{t.f_notes}</label><textarea rows="2" name="notes" value={form.notes} onChange={handleChange} placeholder="Notes optionnelles..." /></div>
          </div>
          <div className="ep-modal-footer"><button type="button" className="ep-btn ep-btn-cancel" onClick={onClose} disabled={loading}>{t.cancel}</button><button type="submit" className="ep-btn ep-btn-save" disabled={loading || items.length === 0}>{loading ? <><i className="fas fa-spinner fa-spin" style={{ marginInlineEnd: 6 }} />{t.saving}</> : <><i className="fas fa-check" style={{ marginInlineEnd: 6 }} />{t.save}</>}</button></div>
        </form>
      </div>
    </div>
  );
};

/* ================= PAGE ================= */
const VentesPage = () => {
  const { lang } = useLanguage();
  const t = I18N[lang];
  const cur = t.currency;
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const [activeTab, setActiveTab] = useState('ventes');
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
  useEffect(() => { if (!error && !success) return undefined; const timer = window.setTimeout(() => { setError(''); setSuccess(''); }, 4500); return () => window.clearTimeout(timer); }, [error, success]);
  useEffect(() => { fetchSales(); fetchProducts(); fetchCustomers(); }, []);
  const fetchSales = async () => { setLoading(true); try { const res = await salesApi.getAll(); const data = res?.data; setSales(Array.isArray(data) ? data : data?.data || []); } catch (err) { console.error(err); showError(t.err_load); } finally { setLoading(false); } };
  const fetchProducts = async () => { try { const res = await productsApi.getAll(); const data = res?.data; setProducts(Array.isArray(data) ? data : data?.data || []); } catch (err) { console.error(err); } };
  const fetchCustomers = async () => { try { const res = await customersApi.getAll(); const data = res?.data; setCustomers(Array.isArray(data) ? data : data?.data || []); } catch (err) { console.warn(err); } };
  const productById = useMemo(() => { const m = {}; products.forEach((p) => { m[String(p.id)] = p; }); return m; }, [products]);
  const allCategories = useMemo(() => { const cats = products.map(p => p.categories?.name || p.category?.name || p.category_name).filter(Boolean); return [...new Set(cats)].sort(); }, [products]);
  const getStatus = (status, paymentMethod) => {
    if (status === 'paid') { const map = { bankily: { label: t.bankily, tone: 'violet' }, masrivi: { label: t.masrivi, tone: 'amber' }, sedad: { label: t.sedad, tone: 'green' }, credit: { label: t.credit, tone: 'amber' }, cash: { label: t.cash, tone: 'green' } }; return map[paymentMethod] || map.cash; }
    const statuses = { partial: { label: t.partial, tone: 'amber' }, draft: { label: t.draft, tone: 'gray' }, cancelled: { label: t.cancelled, tone: 'rose' } };
    return statuses[status] || { label: status || '—', tone: 'gray' };
  };
  const getSaleItems = (sale) => sale?.items || sale?.invoice_items || sale?.items_sale || [];
  const getCustomerName = (sale) => { if (!sale) return t.walk_in; const c = customers.find(i => String(i.id) === String(sale.customer_id)); return sale.customers?.name || sale.customer?.name || c?.name || t.walk_in; };
  const getTotalQuantity = (sale) => getSaleItems(sale).reduce((s, i) => s + Number(i.quantity || 0), 0);
  const getProductNames = (sale) => { const names = getSaleItems(sale).map(i => i.product_name || i.name || i.products?.name || 'Produit'); return names.length > 0 ? names.join(', ') : '—'; };
  const filteredSales = useMemo(() => {
    const q = searchSale.trim().toLowerCase();
    return sales.filter((sale) => {
      const inv = String(sale.invoice_number || '').toLowerCase(); const cust = String(sale.customers?.name || sale.customer?.name || t.walk_in).toLowerCase(); const prodNames = getProductNames(sale).toLowerCase(); const cats = getSaleCategories(sale, productById).toLowerCase();
      const matchesSearch = !q || inv.includes(q) || cust.includes(q) || prodNames.includes(q) || cats.includes(q);
      const matchesStatus = filterStatus === 'all' || sale.status === filterStatus;
      const matchesPayment = filterPayment === 'all' || sale.payment_method === filterPayment;
      const matchesCategory = filterCategory === 'all' || getSaleCategories(sale, productById).split(', ').includes(filterCategory);
      const dStr = String(sale.invoice_date || sale.created_at || '').slice(0, 10);
      return matchesSearch && matchesStatus && matchesPayment && matchesCategory && (!startDateFilter || dStr >= startDateFilter) && (!endDateFilter || dStr <= endDateFilter);
    });
  }, [sales, searchSale, filterStatus, filterPayment, filterCategory, startDateFilter, endDateFilter, t.walk_in, productById]);
  const sortedSales = useMemo(() => {
    const arr = [...filteredSales]; const dir = sortDir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      const getVal = (s) => { switch (sortKey) { case 'invoice': return String(s.invoice_number || ''); case 'category': return getSaleCategories(s, productById); case 'total': return Number(s.grand_total ?? s.total ?? 0); case 'status': return String(s.status || ''); default: return String(s.invoice_date || s.created_at || ''); } };
      const va = getVal(a), vb = getVal(b); if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir; return String(va).localeCompare(String(vb)) * dir;
    }); return arr;
  }, [filteredSales, sortKey, sortDir, productById]);
  const handleSort = (key) => { if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc')); else { setSortKey(key); setSortDir('asc'); } };
  const sortIcon = (key) => { if (sortKey !== key) return 'fa-sort'; return sortDir === 'asc' ? 'fa-sort-up' : 'fa-sort-down'; };
  const stats = useMemo(() => {
    const valid = sales.filter(s => s.status !== 'cancelled'); const now = new Date(); const today = now.toISOString().split('T')[0];
    let dailyS = 0, dailyR = 0, monthlyS = 0, monthlyR = 0;
    valid.forEach(s => { const d = new Date(s.invoice_date || s.created_at); if (Number.isNaN(d.getTime())) return; const ds = d.toISOString().split('T')[0]; const amt = Number(s.grand_total ?? s.total ?? 0); if (ds === today) { dailyS++; dailyR += amt; } if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) { monthlyS++; monthlyR += amt; } });
    return { count: valid.length, revenue: valid.reduce((a, x) => a + Number(x.grand_total ?? x.total ?? 0), 0), dailyS, dailyR, monthlyS, monthlyR };
  }, [sales]);
  const handleAddSubmit = async (payload) => {
    setProcessing(true);
    try {
      const cleanPayload = { invoice_number: toTextOrNull(payload.invoice_number), customer_id: toNumOrNull(payload.customer_id), status: toTextOrNull(payload.status) || 'paid', payment_method: toTextOrNull(payload.payment_method) || 'cash', notes: toTextOrNull(payload.notes), invoice_date: payload.invoice_date || new Date().toISOString(), total: toNumOrZero(payload.total), grand_total: toNumOrZero(payload.grand_total), subtotal: toNumOrZero(payload.subtotal), discount: toNumOrZero(payload.discount), paid_amount: toNumOrZero(payload.paid_amount), balance: toNumOrZero(payload.balance), amount_received: toNumOrZero(payload.amount_received), change_amount: toNumOrZero(payload.change_amount), items: (payload.items || []).map(i => ({ product_id: toNumOrNull(i.product_id), quantity: toNumOrZero(i.quantity), price: toNumOrZero(i.price), unit_price: toNumOrZero(i.unit_price ?? i.price), total: toNumOrZero(i.total ?? (Number(i.price) * Number(i.quantity))) })) };
      const res = await salesApi.checkout(cleanPayload); const saleData = res?.data || {};
      const completed = { ...saleData, invoice_number: saleData.invoice_number || cleanPayload.invoice_number, items: saleData.items || cleanPayload.items.map(i => ({ ...i, product_name: i.name })), grand_total: Number(saleData.grand_total ?? saleData.total ?? cleanPayload.grand_total), invoice_date: saleData.invoice_date || cleanPayload.invoice_date, created_at: saleData.created_at || cleanPayload.invoice_date };
      setLastSale(completed); setShowAddModal(false); setShowInvoice(true); await Promise.all([fetchProducts(), fetchSales()]); showSuccess(t.ok_sale);
    } catch (err) { console.error(err); showError(err?.message || t.err_save); } finally { setProcessing(false); }
  };
  const handleOpenEdit = (sale) => { setSaleToEdit(sale); setEditStatus(sale.status || 'paid'); setEditNotes(sale.notes || ''); setEditItems(getSaleItems(sale).map(i => ({ ...i, quantity: Number(i.quantity) || 1, price: Number(i.price ?? i.unit_price) || 0 }))); };
  const handleEditSubmit = async (e) => { e.preventDefault(); if (!saleToEdit) return; setActionLoading(true); try { const newTotal = editItems.reduce((s, i) => s + Number(i.quantity) * Number(i.price), 0); await salesApi.updateSale(saleToEdit.id, { status: editStatus, notes: toTextOrNull(editNotes), total: toNumOrZero(newTotal), grand_total: toNumOrZero(newTotal) }); setSaleToEdit(null); await fetchSales(); showSuccess(t.ok_edit); } catch (err) { console.error(err); showError(err?.message || t.err_edit); } finally { setActionLoading(false); } };
  const handleDeleteConfirm = async () => { if (!saleToDelete) return; setActionLoading(true); try { await salesApi.deleteSale(saleToDelete.id, getSaleItems(saleToDelete)); setSaleToDelete(null); await Promise.all([fetchSales(), fetchProducts()]); showSuccess(t.ok_delete); } catch (err) { console.error(err); showError(err?.message || t.err_delete); } finally { setActionLoading(false); } };
  const printInvoice = (saleToPrint = null) => {
    const sale = saleToPrint || lastSale; if (!sale) return; const items = getSaleItems(sale); const invNum = sale.invoice_number || `VENTE-${sale.id}`; const custName = getCustomerName(sale);
    const itemsHtml = items.map(i => { const n = i.product_name || i.name || i.products?.name || 'Produit'; const cat = getItemCategory(i, productById); const q = Number(i.quantity) || 0; const p = Number(i.price ?? i.unit_price) || 0; const lt = Number(i.total ?? q * p); return `<tr><td>${escapeHtml(n)}</td><td>${escapeHtml(cat)}</td><td class="center">${q}</td><td class="right">${formatNumber(p)}</td><td class="right">${formatNumber(lt)}</td></tr>`; }).join('');
    const sub = Number(sale.subtotal ?? sale.total ?? 0); const disc = Number(sale.discount ?? 0); const tot = Number(sale.grand_total ?? sale.total ?? 0); const dateVal = sale.invoice_date || sale.created_at;
    const win = window.open('', '_blank', 'width=900,height=900'); if (!win) return showError('Pop-up bloqué.');
    win.document.write(`<!DOCTYPE html><html lang="${lang}" dir="${t.dir}"><head><meta charset="UTF-8"><title>${invNum}</title><style>*{box-sizing:border-box}body{margin:0;padding:30px;color:#14213d;font-family:Arial,sans-serif}.inv{max-width:800px;margin:auto}.hdr{text-align:center;border-bottom:2px solid #14213d;padding-bottom:18px}.store{font-size:26px;font-weight:800}.muted{color:#66748b}h2{text-align:center;margin:24px 0}.meta{display:flex;justify-content:space-between;gap:15px;margin:25px 0}.meta>div{flex:1}.lbl{display:block;font-size:11px;color:#66748b;margin-bottom:5px}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#e8efff;text-align:left}th,td{padding:11px 9px;border-bottom:1px solid #e3e9f2}.center{text-align:center}.right{text-align:right}.totals{width:330px;margin:22px 0 0 auto}.row{display:flex;justify-content:space-between;padding:8px 0}.grand{border-top:2px solid #14213d;border-bottom:2px solid #14213d;font-size:19px;font-weight:800;padding:13px 0}.footer{margin-top:40px;border-top:1px solid #ddd;padding-top:18px;text-align:center;color:#66748b}@media print{body{padding:0}}</style></head><body><div class="inv"><div class="hdr"><div class="store">${escapeHtml(STORE.name)}</div><div class="muted">${escapeHtml(STORE.address)}<br>${escapeHtml(STORE.phone)}</div></div><h2>${t.facture}</h2><div class="meta"><div><span class="lbl">N°</span><strong>${escapeHtml(invNum)}</strong></div><div><span class="lbl">DATE</span><strong>${escapeHtml(formatDate(dateVal, t.locale))}</strong></div><div><span class="lbl">CLIENT</span><strong>${escapeHtml(custName)}</strong></div></div><table><thead><tr><th>Produit</th><th>Catégorie</th><th class="center">Qté</th><th class="right">Prix</th><th class="right">Total</th></tr></thead><tbody>${itemsHtml}</tbody></table><div class="totals"><div class="row"><span>Sous-total</span><strong>${formatNumber(sub)} ${cur}</strong></div><div class="row"><span>Remise</span><strong>- ${formatNumber(disc)} ${cur}</strong></div><div class="row grand"><span>TOTAL</span><span>${formatNumber(tot)} ${cur}</span></div></div><div class="footer">${t.thanks}<br>${t.thanks_sub}</div></div></body></html>`);
    win.document.close(); win.focus(); win.onload = () => win.print();
  };
  const exportSale = (sale) => {
    const items = getSaleItems(sale); const rows = [[t.f_invoice, sale.invoice_number || sale.id], [t.th_date, formatDate(sale.invoice_date || sale.created_at, t.locale)], [t.f_customer, getCustomerName(sale)], [t.th_status, getStatus(sale.status, sale.payment_method).label], [], [t.f_product, t.th_category, t.f_qty, t.f_price, t.th_total], ...items.map(i => [i.product_name || i.name, getItemCategory(i, productById), i.quantity, i.price, i.total ?? i.quantity * i.price]), [], ['TOTAL', '', '', '', sale.grand_total ?? sale.total]];
    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n'); const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `Vente_${sale.invoice_number || sale.id}.csv`; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  };
  const exportFilteredSales = () => {
    const rows = [[t.f_invoice, t.f_customer, t.th_products, t.th_category, t.th_qty, t.th_total, t.th_status, t.f_payment, t.th_date], ...filteredSales.map(s => [s.invoice_number || `VENTE-${s.id}`, getCustomerName(s), getProductNames(s), getSaleCategories(s, productById), getTotalQuantity(s), Number(s.grand_total ?? s.total ?? 0), getStatus(s.status, s.payment_method).label, getStatus(s.status, s.payment_method).label, formatDate(s.invoice_date || s.created_at, t.locale)])];
    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n'); const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `Ventes_${new Date().toISOString().slice(0, 10)}.csv`; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  };
  const hasFilters = Boolean(searchSale || filterStatus !== 'all' || filterPayment !== 'all' || filterCategory !== 'all' || startDateFilter || endDateFilter);
  const resetFilters = () => { setSearchSale(''); setFilterStatus('all'); setFilterPayment('all'); setFilterCategory('all'); setStartDateFilter(''); setEndDateFilter(''); };
  const isAdmin = () => true; const canEdit = () => true; const canAdd = () => true;

  return (
    <div className="expenses-page ventes-card-page" dir={t.dir} lang={lang}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />

      {/* ============ MÊME CARD QUE CHAUFFEURMANAGER ============ */}
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h3 className="mb-0 d-flex align-items-center flex-wrap">
              <FaCashRegister className="me-2" />
              {t.title}
              <Badge bg={canEdit() ? 'success' : 'secondary'} className="ms-2" style={{ fontSize: '0.6em' }}>
                {canEdit() ? <FaUserShield className="me-1" /> : <FaUser className="me-1" />}
                {isAdmin() ? 'Admin' : 'Lecture'}
              </Badge>
            </h3>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <Button variant="outline-success" onClick={exportFilteredSales} disabled={loading}>
                <FaFileExcel className="me-1" /> Exporter
              </Button>
              <Button variant="light" onClick={() => { fetchSales(); fetchProducts(); fetchCustomers(); }} disabled={loading}>
                <FaSyncAlt className={loading ? "spin" : ""} /><span className="ms-2">{t.refresh}</span>
              </Button>
              {canAdd() && (
                <Button variant="success" onClick={() => setShowAddModal(true)} disabled={loading}>
                  <FaPlus className="me-1" /> {t.add}
                </Button>
              )}
            </div>
          </div>
          <small className="d-block mt-1 opacity-75">{t.subtitle}</small>
        </Card.Header>

        <Card.Body>
          {error && <Alert variant="danger" onClose={() => setError(null)} dismissible className="mb-3"><FaInfoCircle className="me-2" />{error}</Alert>}
          {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible className="mb-3">{success}</Alert>}

          {/* STATS DANS LA MÊME CARD */}
          <Row className="mb-3 g-2 ventes-stats-row">
            <Col xs={6} md={3}><Card className="bg-light border-0 h-100"><Card.Body className="py-2 text-center"><div className="text-muted small"><FaCoins className="me-1" />{t.stat_revenue}</div><h4 className="mb-0">{formatNumber(stats.revenue)} <small>{cur}</small></h4><small className="text-muted">{t.stat_revenue_sub}</small></Card.Body></Card></Col>
            <Col xs={6} md={3}><Card className="bg-light border-0 h-100"><Card.Body className="py-2 text-center"><div className="text-muted small"><FaShoppingCart className="me-1" />{t.stat_count}</div><h4 className="mb-0">{stats.count}</h4><small className="text-muted">{t.stat_count_sub}</small></Card.Body></Card></Col>
            <Col xs={6} md={3}><Card className="bg-light border-0 h-100"><Card.Body className="py-2 text-center"><div className="text-muted small"><FaCalendarAlt className="me-1" />{t.stat_month}</div><h4 className="mb-0">{stats.monthlyS}</h4><small className="text-muted">{t.stat_month_sub(`${formatNumber(stats.monthlyR)} ${cur}`)}</small></Card.Body></Card></Col>
            <Col xs={6} md={3}><Card className="bg-light border-0 h-100"><Card.Body className="py-2 text-center"><div className="text-muted small"><FaCalendarDay className="me-1" />{t.stat_day}</div><h4 className="mb-0">{stats.dailyS}</h4><small className="text-muted">{t.stat_day_sub(`${formatNumber(stats.dailyR)} ${cur}`)}</small></Card.Body></Card></Col>
          </Row>

          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3" fill>
            {/* ===== ONGLET VENTES - TABLEAU ICI ===== */}
            <Tab eventKey="ventes" title={<span><FaUsers className="me-2" />{t.history}</span>}>
              <Row className="mb-3 g-2">
                <Col md={4}>
                  <Form.Group><Form.Label className="fw-bold"><FaSearch className="me-2" />Recherche</Form.Label>
                    <InputGroup><Form.Control type="text" placeholder={t.search_ph} value={searchSale} onChange={(e) => setSearchSale(e.target.value)} />{searchSale && <Button variant="outline-secondary" onClick={() => setSearchSale('')}>×</Button>}</InputGroup>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group><Form.Label className="fw-bold"><FaFilter className="me-2" />{t.th_category}</Form.Label>
                    <Form.Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}><option value="all">{t.all_categories}</option>{allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group><Form.Label className="fw-bold">{t.th_status}</Form.Label>
                    <Form.Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}><option value="all">{t.all_status}</option><option value="paid">{t.paid}</option><option value="partial">{t.partial}</option><option value="draft">{t.draft}</option><option value="cancelled">{t.cancelled}</option></Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group><Form.Label className="fw-bold">{t.f_payment}</Form.Label>
                    <Form.Select value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)}><option value="all">{t.all_payments}</option><option value="cash">{t.cash}</option><option value="bankily">{t.bankily}</option><option value="masrivi">{t.masrivi}</option><option value="sedad">{t.sedad}</option><option value="credit">{t.credit}</option></Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2} className="d-flex align-items-end gap-2">
                  <Button variant="outline-secondary" onClick={resetFilters} className="w-100"><FaTimes className="me-2" />Réinitialiser</Button>
                </Col>
              </Row>
              <Row className="mb-3 g-2">
                <Col md={3}><Form.Group><Form.Label>Début</Form.Label><Form.Control type="date" value={startDateFilter} onChange={(e) => setStartDateFilter(e.target.value)} /></Form.Group></Col>
                <Col md={3}><Form.Group><Form.Label>Fin</Form.Label><Form.Control type="date" value={endDateFilter} onChange={(e) => setEndDateFilter(e.target.value)} /></Form.Group></Col>
              </Row>

              {loading ? (
                <div className="text-center py-5"><Spinner animation="border" variant="primary" /><p className="mt-2">{t.loading_sales}</p></div>
              ) : (
                <div className="table-responsive ventes-table-wrap">
                  <Table striped bordered hover className="ventes-table mb-0">
                    <thead className="table-dark">
                      <tr>
                        {/* PAS DE # - PAS DE Client */}
                        <th style={{ cursor: 'pointer' }} onClick={() => handleSort('invoice')}>{t.th_products} <i className={`fas ${sortIcon('invoice')}`} /></th>
                        <th style={{ cursor: 'pointer' }} onClick={() => handleSort('category')}>{t.th_category} <i className={`fas ${sortIcon('category')}`} /></th>
                        <th className="text-center">{t.th_qty}</th>
                        <th className="text-end">{t.th_unit}</th>
                        <th className="text-end" style={{ cursor: 'pointer' }} onClick={() => handleSort('total')}>{t.th_total} <i className={`fas ${sortIcon('total')}`} /></th>
                        <th style={{ cursor: 'pointer' }} onClick={() => handleSort('status')}>{t.th_status} <i className={`fas ${sortIcon('status')}`} /></th>
                        <th style={{ cursor: 'pointer' }} onClick={() => handleSort('created_at')}>{t.th_date} <i className={`fas ${sortIcon('created_at')}`} /></th>
                        <th style={{ width: '160px' }}>{t.th_actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedSales.length > 0 ? sortedSales.map((sale) => {
                        const st = getStatus(sale.status, sale.payment_method);
                        const qty = getTotalQuantity(sale);
                        const avg = qty > 0 ? Number(sale.grand_total ?? sale.total ?? 0) / qty : 0;
                        const names = getProductNames(sale);
                        const cats = getSaleCategories(sale, productById);
                        return (
                          <tr key={sale.id}>
                            <td className="fw-bold text-primary">{names}</td>
                            <td><Badge bg="primary">{cats}</Badge></td>
                            <td className="text-center"><Badge bg="secondary">{t.units(qty)}</Badge></td>
                            <td className="text-end">{formatNumber(avg)} {cur}</td>
                            <td className="text-end fw-bold">{formatNumber(sale.grand_total ?? sale.total)} {cur}</td>
                            <td><Badge bg={st.tone === 'green' ? 'success' : st.tone === 'amber' ? 'warning' : st.tone === 'rose' ? 'danger' : st.tone === 'violet' ? 'info' : 'secondary'}>{st.label}</Badge></td>
                            <td style={{ whiteSpace: 'nowrap' }}>{formatDate(sale.invoice_date || sale.created_at, t.locale)}</td>
                            <td><div className="d-flex gap-1 flex-wrap">
                              <Button variant="outline-info" size="sm" onClick={() => setSelectedSale(sale)} title={t.view}><FaEye /></Button>
                              <Button variant="outline-success" size="sm" onClick={() => handleOpenEdit(sale)} title={t.edit}><FaEdit /></Button>
                              <Button variant="outline-danger" size="sm" onClick={() => setSaleToDelete(sale)} title={t.delete}><FaTrashAlt /></Button>
                            </div></td>
                          </tr>
                        );
                      }) : (
                        <tr><td colSpan="8" className="text-center py-4"><FaInfoCircle className="me-2" />{t.no_data}<br /><small>{t.no_data_sub}</small></td></tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              )}
              <div className="d-flex justify-content-between mt-2 text-muted small"><span>{t.footer_count(filteredSales.length)}</span><span>{t.footer_total} : {formatNumber(filteredSales.reduce((a, s) => a + Number(s.grand_total ?? s.total ?? 0), 0))} {cur}</span></div>
            </Tab>

            {/* ===== ONGLET HISTORIQUE ===== */}
            <Tab eventKey="historique" title={<span><FaHistory className="me-2" />Historique</span>}>
              <Alert variant="info"><FaInfoCircle className="me-2" />Historique complet des ventes — même tableau, trié par date.</Alert>
              <div className="table-responsive"><Table striped bordered hover><thead className="table-dark"><tr><th>Facture</th><th>Produit</th><th>Catégorie</th><th>Total</th><th>Statut</th><th>Date</th></tr></thead><tbody>{[...sales].sort((a, b) => String(b.invoice_date || b.created_at || '').localeCompare(String(a.invoice_date || a.created_at || ''))).slice(0, 50).map(s => (<tr key={s.id}><td className="fw-bold">{s.invoice_number || `VENTE-${s.id}`}</td><td>{getProductNames(s)}</td><td>{getSaleCategories(s, productById)}</td><td className="text-end fw-bold">{formatNumber(s.grand_total ?? s.total)} {cur}</td><td><Badge bg={s.status === 'paid' ? 'success' : 'warning'}>{getStatus(s.status, s.payment_method).label}</Badge></td><td>{formatDate(s.invoice_date || s.created_at, t.locale)}</td></tr>))}</tbody></Table></div>
            </Tab>

            {/* ===== ONGLET STATISTIQUES ===== */}
            <Tab eventKey="statistiques" title={<span><FaChartBar className="me-2" />Statistiques par catégorie</span>}>
              <Alert variant="info"><FaInfoCircle className="me-2" />Répartition des ventes par catégorie.</Alert>
              <div className="table-responsive"><Table striped bordered hover><thead className="table-dark"><tr><th>Catégorie</th><th className="text-center">Nombre ventes</th><th className="text-end">Total</th></tr></thead><tbody>{allCategories.map(cat => { const list = sales.filter(s => getSaleCategories(s, productById).split(', ').includes(cat)); const total = list.reduce((a, s) => a + Number(s.grand_total ?? s.total ?? 0), 0); return (<tr key={cat}><td className="fw-bold">{cat}</td><td className="text-center"><Badge bg="primary" pill>{list.length}</Badge></td><td className="text-end fw-bold">{formatNumber(total)} {cur}</td></tr>); })}</tbody></Table></div>
              <Card className="mt-3 bg-light"><Card.Body><Row><Col md={4} className="text-center"><h6>Total ventes</h6><h3>{stats.count}</h3></Col><Col md={4} className="text-center"><h6>Montant global</h6><h3>{formatNumber(stats.revenue)} {cur}</h3></Col><Col md={4} className="text-center"><h6>Ventes du mois</h6><h3>{stats.monthlyS}</h3></Col></Row></Card.Body></Card>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      {/* MODALES - gardées en dehors de la Card */}
      <AddSaleModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} products={products} customers={customers} onSubmit={handleAddSubmit} loading={processing} t={t} cur={cur} />

      {selectedSale && (
        <div className="ep-modal-overlay" onMouseDown={e => e.target === e.currentTarget && setSelectedSale(null)}>
          <div className="ep-modal medium" role="dialog" aria-modal="true">
            <div className="ep-modal-header"><div><h3><span className="ep-modal-icon"><i className="fas fa-file-invoice" /></span>{t.details_title}</h3><p>{selectedSale.invoice_number || `VENTE-${selectedSale.id}`}</p></div><button type="button" className="btn-icon" onClick={() => setSelectedSale(null)}><i className="fas fa-times" /></button></div>
            <div className="ep-modal-body">
              <div className="ep-detail-grid"><div className="ep-detail-item"><span>Facture</span><strong>{selectedSale.invoice_number || `VENTE-${selectedSale.id}`}</strong></div><div className="ep-detail-item"><span>Client</span><strong>{getCustomerName(selectedSale)}</strong></div><div className="ep-detail-item"><span>Date</span><strong>{formatDate(selectedSale.invoice_date || selectedSale.created_at, t.locale)}</strong></div></div>
              <table className="ep-items-table"><thead><tr><th>Produit</th><th>Catégorie</th><th className="ep-col-center">Qté</th><th className="ep-col-end">Prix</th><th className="ep-col-end">Total</th></tr></thead><tbody>{getSaleItems(selectedSale).map((it, idx) => { const q = Number(it.quantity) || 0; const p = Number(it.price ?? it.unit_price) || 0; const lt = Number(it.total ?? q * p); return (<tr key={idx}><td>{it.product_name || it.name || it.products?.name || 'Produit'}</td><td><span className="ep-badge badge-violet">{getItemCategory(it, productById)}</span></td><td className="ep-col-center">{q}</td><td className="ep-col-end">{formatNumber(p)} {cur}</td><td className="ep-col-end" style={{ fontWeight: 800 }}>{formatNumber(lt)} {cur}</td></tr>); })}</tbody></table>
              <div style={{ marginTop: 16, padding: 12, borderRadius: 10, background: '#f8fafc', display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}><span>Total</span><span>{formatNumber(selectedSale.grand_total ?? selectedSale.total)} {cur}</span></div>
            </div>
            <div className="ep-modal-footer"><button type="button" className="ep-btn ep-btn-outline" onClick={() => setSelectedSale(null)}>{t.close}</button><button type="button" className="ep-btn ep-btn-outline" onClick={() => exportSale(selectedSale)}><FaDownload style={{ marginInlineEnd: 6 }} />{t.export}</button><button type="button" className="ep-btn ep-btn-save" onClick={() => printInvoice(selectedSale)}><FaPrint style={{ marginInlineEnd: 6 }} />{t.print}</button></div>
          </div>
        </div>
      )}

      {saleToEdit && (
        <div className="ep-modal-overlay" onMouseDown={e => e.target === e.currentTarget && !actionLoading && setSaleToEdit(null)}>
          <div className="ep-modal medium" role="dialog" aria-modal="true">
            <div className="ep-modal-header"><h3><span className="ep-modal-icon amber"><i className="fas fa-edit" /></span>{t.edit_title}</h3><button type="button" className="btn-icon" onClick={() => setSaleToEdit(null)} disabled={actionLoading}><i className="fas fa-times" /></button></div>
            <form onSubmit={handleEditSubmit}><div className="ep-modal-body"><table className="ep-items-table"><thead><tr><th>Produit</th><th>Catégorie</th><th className="ep-col-center" style={{ width: 90 }}>Qté</th><th className="ep-col-end" style={{ width: 130 }}>Prix</th><th className="ep-col-end">Total</th></tr></thead><tbody>{editItems.map((it, idx) => (<tr key={idx}><td>{it.product_name || it.name || it.products?.name || 'Produit'}</td><td><span className="ep-badge badge-violet">{getItemCategory(it, productById)}</span></td><td className="ep-col-center"><input type="number" min="1" style={{ width: '100%', border: '1px solid var(--line)', borderRadius: 6, padding: 5, textAlign: 'center' }} value={it.quantity} onChange={e => { const a = [...editItems]; a[idx].quantity = parseInt(e.target.value, 10) || 1; setEditItems(a); }} /></td><td className="ep-col-end"><input type="number" min="0" style={{ width: '100%', border: '1px solid var(--line)', borderRadius: 6, padding: 5, textAlign: 'end' }} value={it.price} onChange={e => { const a = [...editItems]; a[idx].price = parseFloat(e.target.value) || 0; setEditItems(a); }} /></td><td className="ep-col-end" style={{ fontWeight: 800 }}>{formatNumber(it.quantity * it.price)} {cur}</td></tr>))}</tbody></table><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}><div className="ep-form-group" style={{ marginBottom: 0 }}><label>Statut</label><select value={editStatus} onChange={e => setEditStatus(e.target.value)}><option value="paid">{t.paid}</option><option value="partial">{t.partial}</option><option value="draft">{t.draft}</option><option value="cancelled">{t.cancelled}</option></select></div><div className="ep-form-group" style={{ marginBottom: 0 }}><label>Observation</label><textarea rows="1" value={editNotes} onChange={e => setEditNotes(e.target.value)} /></div></div></div><div className="ep-modal-footer"><button type="button" className="ep-btn ep-btn-cancel" onClick={() => setSaleToEdit(null)} disabled={actionLoading}>{t.cancel}</button><button type="submit" className="ep-btn ep-btn-save" disabled={actionLoading}>{t.save}</button></div></form>
          </div>
        </div>
      )}

      {saleToDelete && (
        <div className="ep-modal-overlay" onMouseDown={e => e.target === e.currentTarget && !actionLoading && setSaleToDelete(null)}>
          <div className="ep-modal small" role="alertdialog" aria-modal="true"><div className="ep-delete-body"><span className="ep-delete-icon"><i className="fas fa-trash-alt" /></span><h4>{t.delete_q}</h4><p>Facture {saleToDelete.invoice_number || saleToDelete.id}</p></div><div className="ep-modal-footer center"><button type="button" className="ep-btn ep-btn-cancel" onClick={() => setSaleToDelete(null)} disabled={actionLoading}>{t.cancel}</button><button type="button" className="ep-btn ep-btn-danger" onClick={handleDeleteConfirm} disabled={actionLoading}>{actionLoading ? t.deleting : t.delete_confirm}</button></div></div>
        </div>
      )}

      {showInvoice && lastSale && (
        <div className="ep-modal-overlay" onMouseDown={e => e.target === e.currentTarget && setShowInvoice(false)}>
          <div className="ep-modal medium" role="dialog" aria-modal="true">
            <div className="ep-modal-header"><div><h3><span className="ep-modal-icon success"><i className="fas fa-check-circle" /></span>{t.success_invoice}</h3><p>{lastSale.invoice_number || `VENTE-${lastSale.id}`}</p></div><button type="button" className="btn-icon" onClick={() => setShowInvoice(false)}><i className="fas fa-times" /></button></div>
            <div className="ep-modal-body"><div style={{ textAlign: 'center', paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid var(--line)' }}><h3 style={{ margin: '0 0 4px', fontWeight: 800 }}>{STORE.name}</h3><div style={{ color: 'var(--muted)', fontSize: 12 }}>{STORE.address}<br />{STORE.phone}</div><h4 style={{ margin: '12px 0 0', fontWeight: 800 }}>{t.facture}</h4></div><table className="ep-items-table"><thead><tr><th>Produit</th><th>Catégorie</th><th className="ep-col-center">Qté</th><th className="ep-col-end">Prix</th><th className="ep-col-end">Total</th></tr></thead><tbody>{getSaleItems(lastSale).map((it, idx) => { const q = Number(it.quantity) || 0; const p = Number(it.price ?? it.unit_price) || 0; const lt = Number(it.total ?? q * p); return (<tr key={idx}><td>{it.product_name || it.name || it.products?.name || 'Produit'}</td><td><span className="ep-badge badge-violet">{getItemCategory(it, productById)}</span></td><td className="ep-col-center">{q}</td><td className="ep-col-end">{formatNumber(p)} {cur}</td><td className="ep-col-end" style={{ fontWeight: 800 }}>{formatNumber(lt)} {cur}</td></tr>); })}</tbody></table><div style={{ marginTop: 16, padding: 12, borderRadius: 10, background: '#f8fafc', display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}><span>TOTAL À PAYER</span><span style={{ color: 'var(--primary)' }}>{formatNumber(lastSale.grand_total ?? lastSale.total)} {cur}</span></div></div>
            <div className="ep-modal-footer"><button type="button" className="ep-btn ep-btn-outline" onClick={() => printInvoice(lastSale)}><FaPrint style={{ marginInlineEnd: 6 }} />{t.print}</button><button type="button" className="ep-btn ep-btn-outline" onClick={() => setShowInvoice(false)}>{t.close}</button><button type="button" className="ep-btn ep-btn-save" onClick={() => { setShowInvoice(false); setLastSale(null); setShowAddModal(true); }}><FaPlus style={{ marginInlineEnd: 6 }} />{t.add}</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VentesPage;