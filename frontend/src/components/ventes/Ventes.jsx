// src/components/ventes/Ventes.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table, Button, Card, Spinner, Badge, Form, Modal,
  Toast, ToastContainer, Alert, Row, Col, InputGroup
} from 'react-bootstrap';
import {
  FaInfoCircle, FaSyncAlt, FaPlus, FaEdit, FaTrash, FaSearch,
  FaLock, FaUserShield, FaUser, FaTimes, FaPrint, FaDownload,
  FaMoneyBillWave, FaShoppingCart, FaCalendarAlt, FaExchangeAlt,
  FaCashRegister, FaFilter, FaFileExcel, FaEye
} from 'react-icons/fa';
import { productsApi, customersApi, salesApi } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import './Ventes.css';

const STORE = { name: 'GESTION STOCK', address: 'Nouakchott, Mauritanie', phone: '+222 XX XX XX XX' };

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
const formatDate = (v, locale = 'fr-FR') => {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
const escapeHtml = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const getItemCategory = (item, productById) => {
  if (!item) return '—';
  const fromMap = item.product_id != null ? productById?.[String(item.product_id)] : null;
  return fromMap?.categories?.name || fromMap?.category?.name || fromMap?.category_name ||
    item?.category_name || item?.category || '—';
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
   TRADUCTIONS - inchangées
   ============================================================ */
const I18N = {
  fr: {
    dir: 'ltr', locale: 'fr-FR', currency: 'MRU',
    title: 'Gestion des ventes', add: 'Nouvelle vente', refresh: 'Rafraîchir',
    stat_revenue: 'Montant global', stat_revenue_sub: 'MRU · Toutes les ventes',
    stat_count: 'Total ventes', stat_count_sub: 'Transactions enregistrées',
    stat_month: 'Ventes du mois', stat_month_sub: (v) => `Revenus : ${v}`,
    stat_day: 'Ventes du jour', stat_day_sub: (v) => `Revenus : ${v}`,
    history: 'Historique des ventes', search_ph: 'N° facture ou nom du client...',
    all_status: 'Tous les statuts', all_payments: 'Tous les paiements', all_categories: 'Toutes les catégories',
    paid: 'Payée', partial: 'Crédit', draft: 'Brouillon', cancelled: 'Annulée',
    th_invoice: 'Facture', th_customer: 'Client', th_products: 'Produit(s)', th_category: 'Catégorie',
    th_qty: 'Qté', th_unit: 'P.U.', th_total: 'Total', th_status: 'Statut', th_date: 'Date', th_actions: 'Actions',
    view: 'Voir', edit: 'Modifier', delete: 'Supprimer', print: 'Imprimer', export: 'Exporter',
    cash: 'Espèces', bankily: 'Bankily', masrivi: 'Masrivi', sedad: 'Sedad', credit: 'Crédit', walk_in: 'Client comptant',
    units: (n) => `${n} unité(s)`,
    form_title: 'Nouvelle vente', f_customer: 'Client', f_date: 'Date de vente', f_status: 'Statut',
    f_payment: 'Mode de paiement', f_notes: 'Observation', f_category: 'Catégorie', f_product: 'Produit',
    f_qty: 'Quantité', f_price: 'Prix unitaire', f_add_item: 'Ajouter',
    stock_available: (n) => `Stock dispo : ${n}`, err_stock: (n) => `Stock insuffisant. Il ne reste que ${n} unité(s).`,
    err_qty_invalid: 'Quantité invalide.', err_price_invalid: 'Saisissez un prix unitaire valide.',
    err_customer_credit: 'Sélectionnez un client pour le crédit.', no_items: 'Aucun article ajouté.',
    save: 'Enregistrer', cancel: 'Annuler', close: 'Fermer', saving: 'Enregistrement...',
    err_save: "Erreur lors de l'enregistrement.", ok_sale: 'Vente enregistrée avec succès.',
    edit_title: 'Modifier la vente', ok_edit: 'Vente modifiée.', err_edit: 'Erreur modification.',
    delete_q: 'Supprimer cette vente ?', delete_confirm: 'Oui, supprimer', deleting: 'Suppression...',
    ok_delete: 'Vente supprimée.', err_delete: 'Erreur suppression.',
    details_title: 'Détails de la vente', success_invoice: 'Vente enregistrée', facture: 'FACTURE',
    thanks: 'Merci pour votre achat !', thanks_sub: 'Nous vous remercions de votre confiance.',
    err_load: 'Impossible de charger les ventes.', loading: 'Chargement des ventes...',
    no_data: 'Aucune vente trouvée', no_data_sub: 'Modifiez votre recherche ou créez une nouvelle vente.',
    export_all: 'Exporter', footer_count: (n) => `${n} vente(s)`,
    role_admin: 'Admin', role_user: 'Lecture', err_permission: 'Action réservée aux administrateurs.',
    reset: 'Réinitialiser',
  },
  ar: {
    dir: 'rtl', locale: 'ar-u-nu-latn', currency: 'أوقية',
    title: 'إدارة المبيعات', add: 'بيع جديد', refresh: 'تحديث',
    stat_revenue: 'المبلغ الإجمالي', stat_revenue_sub: 'أوقية · كل المبيعات',
    stat_count: 'إجمالي المبيعات', stat_count_sub: 'المعاملات المسجلة',
    stat_month: 'مبيعات الشهر', stat_month_sub: (v) => `الإيرادات: ${v}`,
    stat_day: 'مبيعات اليوم', stat_day_sub: (v) => `الإيرادات: ${v}`,
    history: 'سجل المبيعات', search_ph: 'رقم الفاتورة أو اسم العميل...',
    all_status: 'كل الحالات', all_payments: 'كل طرق الدفع', all_categories: 'كل الفئات',
    paid: 'مدفوعة', partial: 'آجل', draft: 'مسودة', cancelled: 'ملغاة',
    th_invoice: 'الفاتورة', th_customer: 'العميل', th_products: 'المنتج', th_category: 'الفئة',
    th_qty: 'الكمية', th_unit: 'السعر', th_total: 'الإجمالي', th_status: 'الحالة', th_date: 'التاريخ', th_actions: 'إجراءات',
    view: 'عرض', edit: 'تعديل', delete: 'حذف', print: 'طباعة', export: 'تصدير',
    cash: 'نقدًا', bankily: 'بنكيلي', masrivi: 'مصرفي', sedad: 'سداد', credit: 'آجل', walk_in: 'عميل نقدي',
    units: (n) => `${n} وحدة`,
    form_title: 'بيع جديد', f_customer: 'العميل', f_date: 'تاريخ البيع', f_status: 'الحالة',
    f_payment: 'طريقة الدفع', f_notes: 'ملاحظة', f_category: 'الفئة', f_product: 'المنتج',
    f_qty: 'الكمية', f_price: 'سعر الوحدة', f_add_item: 'إضافة',
    stock_available: (n) => `المخزون المتاح: ${n}`, err_stock: (n) => `المخزون غير كافٍ. تبقى فقط ${n} وحدة.`,
    err_qty_invalid: 'الكمية غير صالحة.', err_price_invalid: 'أدخل سعر وحدة صحيحًا.',
    err_customer_credit: 'اختر عميلًا للبيع بالآجل.', no_items: 'لم يتم إضافة أصناف.',
    save: 'حفظ', cancel: 'إلغاء', close: 'إغلاق', saving: 'جارٍ التسجيل...',
    err_save: 'خطأ في التسجيل.', ok_sale: 'تم تسجيل البيع بنجاح.',
    edit_title: 'تعديل البيع', ok_edit: 'تم التعديل.', err_edit: 'خطأ في التعديل.',
    delete_q: 'حذف هذا البيع؟', delete_confirm: 'نعم، احذف', deleting: 'جارٍ الحذف...',
    ok_delete: 'تم الحذف.', err_delete: 'خطأ في الحذف.',
    details_title: 'تفاصيل البيع', success_invoice: 'تم التسجيل', facture: 'فاتورة',
    thanks: 'شكرًا لك!', thanks_sub: 'نشكرك على ثقتك.',
    err_load: 'تعذّر التحميل.', loading: 'جارٍ تحميل المبيعات...',
    no_data: 'لا توجد مبيعات', no_data_sub: 'عدّل البحث أو أنشئ بيعًا جديدًا.',
    export_all: 'تصدير', footer_count: (n) => `${n} عملية بيع`,
    role_admin: 'مدير', role_user: 'قراءة', err_permission: 'الإجراء مخصص للمديرين فقط.',
    reset: 'إعادة تعيين',
  },
};

/* ============================================================
   PAGE PRINCIPALE — STRUCTURE IDENTIQUE À CHAUFFEURMANAGER
   ============================================================ */
const VentesPage = () => {
  const { lang } = useLanguage();
  const t = I18N[lang];
  const cur = t.currency;

  /* ---------- RÔLES (copié de ChauffeurManager) ---------- */
  const [userRole, setUserRole] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const isAdmin = () => userRole === 'admin' || userRole === 'administrateur';
  const isChefEnt = () => userRole === 'chef_ent' || userRole === 'chef_entreprise';
  const isDM = () => userRole === 'DM' || userRole === 'dm';
  const canEdit = () => isAdmin() || isDM() || isChefEnt();
  const canAdd = useCallback(() => canEdit(), [userRole]);
  const canDelete = useCallback(() => canEdit(), [userRole]);

  // ✅ FIX 1 : charger le rôle comme dans ChauffeurManager, sinon userLoading reste true à vie
  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        setUserRole(u.role || u.roles?.[0] || 'user');
      } else {
        setUserRole('user');
      }
    } catch { setUserRole('user'); }
    finally { setUserLoading(false); }
  }, []);

  /* ---------- ÉTATS ---------- */
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ customer_id: '', status: 'paid', payment_method: 'cash', date: '', notes: '' });
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ product_id: '', quantity: 1, price: '' });
  const [categoryFilter, setCategoryFilter] = useState('');
  const [localError, setLocalError] = useState('');

  const [saleToEdit, setSaleToEdit] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [editStatus, setEditStatus] = useState('paid');
  const [editNotes, setEditNotes] = useState('');

  const [selectedSale, setSelectedSale] = useState(null);
  const [saleToDelete, setSaleToDelete] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastSale, setLastSale] = useState(null);

  const showToast = (message, variant = 'success') => {
    const newToast = { id: Date.now(), message, variant };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => setToasts(prev => prev.filter(tt => tt.id !== newToast.id)), 5000);
  };

  /* ---------- CHARGEMENTS ---------- */
  const fetchSales = async () => {
    try {
      setLoading(true); setError(null);
      const res = await salesApi.getAll();
      const data = res?.data;
      setSales(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      console.error(err); setError(err.message || t.err_load); setSales([]);
      showToast(err.message || t.err_load, 'danger');
    } finally { setLoading(false); }
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

  useEffect(() => { fetchSales(); fetchProducts(); fetchCustomers(); }, []);

  /* ---------- COMPUTÉS ---------- */
  const productById = useMemo(() => {
    const m = {}; products.forEach((p) => { m[String(p.id)] = p; }); return m;
  }, [products]);

  const allCategories = useMemo(() => {
    const cats = products.map(p => p.categories?.name || p.category?.name || p.category_name).filter(Boolean);
    return [...new Set(cats)].sort();
  }, [products]);

  const getStatus = (status, paymentMethod) => {
    if (status === 'paid') {
      const map = {
        bankily: { label: t.bankily, bg: 'primary' },
        masrivi: { label: t.masrivi, bg: 'warning' },
        sedad: { label: t.sedad, bg: 'success' },
        credit: { label: t.credit, bg: 'warning' },
        cash: { label: t.cash, bg: 'success' },
      };
      return map[paymentMethod] || map.cash;
    }
    const statuses = {
      partial: { label: t.partial, bg: 'warning' },
      draft: { label: t.draft, bg: 'secondary' },
      cancelled: { label: t.cancelled, bg: 'danger' },
    };
    return statuses[status] || { label: status || '—', bg: 'secondary' };
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
    const q = searchTerm.trim().toLowerCase();
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
  }, [sales, searchTerm, filterStatus, filterPayment, filterCategory, startDateFilter, endDateFilter, t.walk_in, productById]);

  const stats = useMemo(() => {
    const valid = sales.filter(s => s.status !== 'cancelled');
    const now = new Date(); const today = now.toISOString().split('T')[0];
    let dailyS = 0, dailyR = 0, monthlyS = 0, monthlyR = 0;
    valid.forEach(s => {
      const d = new Date(s.invoice_date || s.created_at);
      if (Number.isNaN(d.getTime())) return;
      const ds = d.toISOString().split('T')[0];
      const amt = Number(s.grand_total ?? s.total ?? 0);
      if (ds === today) { dailyS++; dailyR += amt; }
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) { monthlyS++; monthlyR += amt; }
    });
    return { count: valid.length, revenue: valid.reduce((a, x) => a + Number(x.grand_total ?? x.total ?? 0), 0), dailyS, dailyR, monthlyS, monthlyR };
  }, [sales]);

  /* ---------- ACTIONS ---------- */
  const openAddModal = () => {
    if (!canAdd()) { showToast(t.err_permission, 'warning'); return; }
    setForm({ customer_id: '', status: 'paid', payment_method: 'cash', date: new Date().toISOString().slice(0, 16), notes: '' });
    setItems([]); setNewItem({ product_id: '', quantity: 1, price: '' });
    setCategoryFilter(''); setLocalError('');
    setShowAddModal(true);
  };

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleSelectProduct = (e) => { setNewItem(p => ({ ...p, product_id: e.target.value, price: '' })); setLocalError(''); };

  const addItem = () => {
    if (!newItem.product_id) return setLocalError(t.f_product + ' *');
    const prod = products.find(p => String(p.id) === String(newItem.product_id));
    const price = Number(newItem.price);
    const qty = Number(newItem.quantity);
    const stock = Number(prod?.quantity ?? prod?.stock ?? 0);
    if (!Number.isFinite(price) || price <= 0) return setLocalError(t.err_price_invalid);
    if (!Number.isFinite(qty) || qty <= 0) return setLocalError(t.err_qty_invalid);
    const existingQty = items.filter(i => String(i.product_id) === String(newItem.product_id)).reduce((sum, i) => sum + i.quantity, 0);
    if (existingQty + qty > stock) return setLocalError(t.err_stock(stock - existingQty));
    setItems(prev => [...prev, {
      product_id: newItem.product_id, name: prod?.name || 'Produit',
      category: prod?.categories?.name || prod?.category?.name || prod?.category_name || '—',
      quantity: qty, price, stock,
    }]);
    setNewItem({ product_id: '', quantity: 1, price: '' }); setLocalError('');
  };

  const submitSale = async () => {
    if (!canEdit()) { showToast(t.err_permission, 'danger'); return; }
    if (items.length === 0) return setLocalError(t.no_items);
    const isCredit = form.payment_method === 'credit' || form.status === 'partial';
    if (isCredit && !form.customer_id) return setLocalError(t.err_customer_credit);
    setIsUpdating(true); setLocalError('');
    try {
      const totalNum = items.reduce((s, i) => s + (Number(i.price) * Number(i.quantity)), 0);
      const payload = {
        invoice_number: `INV-${Date.now().toString().slice(-6)}`,
        customer_id: toNumOrNull(form.customer_id),
        status: toTextOrNull(form.status) || 'paid',
        payment_method: toTextOrNull(form.payment_method) || 'cash',
        notes: toTextOrNull(form.notes),
        invoice_date: form.date ? new Date(form.date).toISOString() : new Date().toISOString(),
        total: totalNum, grand_total: totalNum, subtotal: totalNum, discount: 0,
        paid_amount: isCredit ? 0 : totalNum, balance: isCredit ? totalNum : 0,
        amount_received: isCredit ? 0 : totalNum, change_amount: 0,
        items: items.map(i => ({
          product_id: toNumOrNull(i.product_id), quantity: toNumOrZero(i.quantity),
          price: toNumOrZero(i.price), unit_price: toNumOrZero(i.price),
          total: toNumOrZero(Number(i.price) * Number(i.quantity)),
        })),
      };
      const res = await salesApi.checkout(payload);
      const saleData = res?.data || {};
      const completed = {
        ...saleData, invoice_number: saleData.invoice_number || payload.invoice_number,
        items: saleData.items || payload.items.map(i => ({ ...i, product_name: i.name })),
        grand_total: Number(saleData.grand_total ?? saleData.total ?? totalNum),
        invoice_date: saleData.invoice_date || payload.invoice_date,
        created_at: saleData.created_at || payload.invoice_date,
      };
      setLastSale(completed); setShowAddModal(false); setShowInvoice(true);
      await Promise.all([fetchProducts(), fetchSales()]);
      showToast(t.ok_sale, 'success');
    } catch (err) {
      console.error(err); setLocalError(err.message || t.err_save);
      showToast(err.message || t.err_save, 'danger');
    } finally { setIsUpdating(false); }
  };

  const handleOpenEdit = (sale) => {
    if (!canEdit()) { showToast(t.err_permission, 'warning'); return; }
    setSaleToEdit(sale); setEditStatus(sale.status || 'paid'); setEditNotes(sale.notes || '');
    setEditItems(getSaleItems(sale).map(i => ({ ...i, quantity: Number(i.quantity) || 1, price: Number(i.price ?? i.unit_price) || 0 })));
  };

  const submitEdit = async () => {
    if (!saleToEdit) return;
    setIsUpdating(true);
    try {
      const newTotal = editItems.reduce((s, i) => s + Number(i.quantity) * Number(i.price), 0);
      await salesApi.updateSale(saleToEdit.id, { status: editStatus, notes: toTextOrNull(editNotes), total: toNumOrZero(newTotal), grand_total: toNumOrZero(newTotal) });
      setSaleToEdit(null); await fetchSales(); showToast(t.ok_edit, 'success');
    } catch (err) { console.error(err); showToast(err.message || t.err_edit, 'danger'); }
    finally { setIsUpdating(false); }
  };

  const confirmDelete = async () => {
    if (!saleToDelete) return;
    if (!canDelete()) { showToast(t.err_permission, 'danger'); return; }
    setIsUpdating(true);
    try {
      await salesApi.deleteSale(saleToDelete.id, getSaleItems(saleToDelete));
      setSaleToDelete(null); await Promise.all([fetchSales(), fetchProducts()]);
      showToast(t.ok_delete, 'success');
    } catch (err) { console.error(err); showToast(err.message || t.err_delete, 'danger'); }
    finally { setIsUpdating(false); }
  };

  const printInvoice = (saleToPrint = null) => {
    const sale = saleToPrint || lastSale; if (!sale) return;
    const itemsL = getSaleItems(sale);
    const invNum = sale.invoice_number || `VENTE-${sale.id}`;
    const custName = getCustomerName(sale);
    const itemsHtml = itemsL.map(i => {
      const n = i.product_name || i.name || i.products?.name || 'Produit';
      const cat = getItemCategory(i, productById);
      const q = Number(i.quantity) || 0; const p = Number(i.price ?? i.unit_price) || 0; const lt = Number(i.total ?? q * p);
      return `<tr><td>${escapeHtml(n)}</td><td>${escapeHtml(cat)}</td><td class="center">${q}</td><td class="right">${formatNumber(p)}</td><td class="right">${formatNumber(lt)}</td></tr>`;
    }).join('');
    const sub = Number(sale.subtotal ?? sale.total ?? 0); const disc = Number(sale.discount ?? 0);
    const tot = Number(sale.grand_total ?? sale.total ?? 0);
    const win = window.open('', '_blank', 'width=900,height=900');
    if (!win) return showToast('Pop-up bloqué.', 'danger');
    win.document.write(`<!DOCTYPE html><html lang="${lang}" dir="${t.dir}"><head><meta charset="UTF-8"><title>${invNum}</title>
    <style>*{box-sizing:border-box}body{margin:0;padding:30px;color:#14213d;font-family:${lang === 'ar' ? "'Cairo'," : ''}Arial,sans-serif}.inv{max-width:800px;margin:auto}.hdr{text-align:center;border-bottom:2px solid #14213d;padding-bottom:18px}.store{font-size:26px;font-weight:800}.muted{color:#66748b}h2{text-align:center;margin:24px 0}.meta{display:flex;justify-content:space-between;gap:15px;margin:25px 0}.meta>div{flex:1}.lbl{display:block;font-size:11px;color:#66748b;margin-bottom:5px}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#e8efff;text-align:${t.dir === 'rtl' ? 'right' : 'left'}}th,td{padding:11px 9px;border-bottom:1px solid #e3e9f2}.center{text-align:center}.right{text-align:${t.dir === 'rtl' ? 'left' : 'right'}}.totals{width:330px;margin:22px 0 0 auto}.row{display:flex;justify-content:space-between;padding:8px 0}.grand{border-top:2px solid #14213d;border-bottom:2px solid #14213d;font-size:19px;font-weight:800;padding:13px 0}.footer{margin-top:40px;border-top:1px solid #ddd;padding-top:18px;text-align:center;color:#66748b}@media print{body{padding:0}}</style></head><body>
    <div class="inv"><div class="hdr"><div class="store">${escapeHtml(STORE.name)}</div><div class="muted">${escapeHtml(STORE.address)}<br>${escapeHtml(STORE.phone)}</div></div>
    <h2>${t.facture}</h2><div class="meta"><div><span class="lbl">N°</span><strong>${escapeHtml(invNum)}</strong></div><div><span class="lbl">${t.th_date.toUpperCase()}</span><strong>${escapeHtml(formatDate(sale.invoice_date || sale.created_at, t.locale))}</strong></div><div><span class="lbl">${t.f_customer.toUpperCase()}</span><strong>${escapeHtml(custName)}</strong></div></div>
    <table><thead><tr><th>${t.f_product}</th><th>${t.th_category}</th><th class="center">${t.th_qty}</th><th class="right">${t.f_price}</th><th class="right">${t.th_total}</th></tr></thead><tbody>${itemsHtml}</tbody></table>
    <div class="totals"><div class="row"><span>Sous-total</span><strong>${formatNumber(sub)} ${cur}</strong></div><div class="row"><span>Remise</span><strong>- ${formatNumber(disc)} ${cur}</strong></div><div class="row grand"><span>TOTAL</span><span>${formatNumber(tot)} ${cur}</span></div></div>
    <div class="footer">${t.thanks}<br>${t.thanks_sub}</div></div></body></html>`);
    win.document.close(); win.focus(); win.onload = () => win.print();
  };

  const exportSale = (sale) => {
    const itemsL = getSaleItems(sale);
    const rows = [
      [t.th_invoice, sale.invoice_number || sale.id],
      [t.th_date, formatDate(sale.invoice_date || sale.created_at, t.locale)],
      [t.f_customer, getCustomerName(sale)],
      [t.th_status, getStatus(sale.status, sale.payment_method).label], [],
      [t.f_product, t.th_category, t.th_qty, t.f_price, t.th_total],
      ...itemsL.map(i => [i.product_name || i.name, getItemCategory(i, productById), i.quantity, i.price, i.total ?? i.quantity * i.price]),
      [], ['TOTAL', '', '', '', sale.grand_total ?? sale.total],
    ];
    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `Vente_${sale.invoice_number || sale.id}.csv`;
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  };

  const exportAll = () => {
    const rows = [
      [t.th_invoice, t.f_customer, t.th_products, t.th_category, t.th_qty, t.th_total, t.th_status, t.th_date],
      ...filteredSales.map(s => [
        s.invoice_number || `VENTE-${s.id}`, getCustomerName(s), getProductNames(s),
        getSaleCategories(s, productById), getTotalQuantity(s),
        Number(s.grand_total ?? s.total ?? 0), getStatus(s.status, s.payment_method).label,
        formatDate(s.invoice_date || s.created_at, t.locale),
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `Ventes_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  };

  const hasFilters = Boolean(searchTerm || filterStatus !== 'all' || filterPayment !== 'all' || filterCategory !== 'all' || startDateFilter || endDateFilter);
  const resetFilters = () => {
    setSearchTerm(''); setFilterStatus('all'); setFilterPayment('all');
    setFilterCategory('all'); setStartDateFilter(''); setEndDateFilter('');
  };

  const displayedProducts = useMemo(() => {
    if (!categoryFilter) return products;
    return products.filter(p => (p.categories?.name || p.category?.name || p.category_name || 'Non catégorisé') === categoryFilter);
  }, [products, categoryFilter]);

  const selectedProduct = products.find(p => String(p.id) === String(newItem.product_id));
  const subtotal = items.reduce((s, i) => s + (i.price * i.quantity), 0);

  if (userLoading) {
    return (
      <div className="container-fluid py-4 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Vérification des permissions...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 ventes-page">
      <ToastContainer position="top-end" className="p-3">
        {toasts.map(toast => (
          <Toast key={toast.id} onClose={() => setToasts(prev => prev.filter(tt => tt.id !== toast.id))}
            bg={toast.variant} autohide delay={5000}>
            <Toast.Body className="text-white">{toast.message}</Toast.Body>
          </Toast>
        ))}
      </ToastContainer>

      {/* ====== STATS : MÊME QUE ChauffeurManager - xs={3} = 4 sur 1 ligne téléphone ====== */}
      <Row className="mb-4 ventes-stats-row g-2">
        <Col xs={3} md={3}>
          <Card className="bg-primary text-white shadow-sm h-100">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-0">{t.stat_revenue}</h6>
                <h2 className="mb-0">{formatNumber(stats.revenue)}</h2>
              </div>
              <FaMoneyBillWave size={40} className="stat-icon" />
            </Card.Body>
          </Card>
        </Col>
        <Col xs={3} md={3}>
          <Card className="bg-success text-white shadow-sm h-100">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-0">{t.stat_count}</h6>
                <h2 className="mb-0">{stats.count}</h2>
              </div>
              <FaShoppingCart size={40} className="stat-icon" />
            </Card.Body>
          </Card>
        </Col>
        <Col xs={3} md={3}>
          <Card className="bg-info text-white shadow-sm h-100">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-0">{t.stat_month}</h6>
                <h2 className="mb-0">{stats.monthlyS}</h2>
              </div>
              <FaCalendarAlt size={40} className="stat-icon" />
            </Card.Body>
          </Card>
        </Col>
        <Col xs={3} md={3}>
          <Card className="bg-warning text-white shadow-sm h-100">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-0">{t.stat_day}</h6>
                <h2 className="mb-0">{stats.dailyS}</h2>
              </div>
              <FaExchangeAlt size={40} className="stat-icon" />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ====== CARTE PRINCIPALE IDENTIQUE À L'AFFECTATION ====== */}
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h3 className="mb-0 d-flex align-items-center">
              <FaCashRegister className="me-2" />
              {t.title}
              <Badge bg={canEdit() ? 'success' : 'secondary'} className="ms-2" style={{ fontSize: '0.6em' }}>
                {canEdit() ? <FaUserShield className="me-1" /> : <FaUser className="me-1" />}
              </Badge>
            </h3>
            <div className="d-flex align-items-center gap-2">
              <Button variant="outline-success" onClick={exportAll}>
                <FaFileExcel className="me-2" />{t.export_all}
              </Button>
              <Button variant="light" onClick={() => { fetchSales(); fetchProducts(); fetchCustomers(); }} disabled={loading}>
                <FaSyncAlt className={loading ? "spin" : ""} />
                <span className="ms-2">{t.refresh}</span>
              </Button>
              {canAdd() && (
                <Button variant="success" onClick={openAddModal} disabled={loading}>
                  <FaPlus className="me-1" />
                  {t.add}
                </Button>
              )}
            </div>
          </div>
        </Card.Header>

        <Card.Body>
          {error && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible className="mb-3">
              <FaInfoCircle className="me-2" />
              {error}
            </Alert>
          )}

          {/* Filtres - MÊME Row que ChauffeurManager */}
          <Row className="mb-3">
            <Col md={2}>
              <Form.Group>
                <Form.Label className="fw-bold"><FaSearch className="me-2" />{t.th_invoice}</Form.Label>
                <InputGroup>
                  <Form.Control type="text" placeholder={t.search_ph} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  {searchTerm && <Button variant="outline-secondary" onClick={() => setSearchTerm('')}>×</Button>}
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="fw-bold">{t.f_payment}</Form.Label>
                <Form.Select value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)}>
                  <option value="all">{t.all_payments}</option>
                  <option value="cash">{t.cash}</option>
                  <option value="bankily">{t.bankily}</option>
                  <option value="masrivi">{t.masrivi}</option>
                  <option value="sedad">{t.sedad}</option>
                  <option value="credit">{t.credit}</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="fw-bold">{t.th_category}</Form.Label>
                <Form.Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                  <option value="all">{t.all_categories}</option>
                  {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="fw-bold">{t.th_date}</Form.Label>
                <Form.Control type="date" value={startDateFilter} onChange={(e) => setStartDateFilter(e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="fw-bold">Fin</Form.Label>
                <Form.Control type="date" value={endDateFilter} onChange={(e) => setEndDateFilter(e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={2} className="d-flex align-items-end gap-2">
              {hasFilters && (
                <Button variant="outline-secondary" onClick={resetFilters} className="w-100">
                  <FaTimes className="me-2" />{t.reset}
                </Button>
              )}
            </Col>
          </Row>

          <p className="text-muted mb-2">{t.footer_count(filteredSales.length)}</p>

          {/* Tableau - MÊME que ChauffeurManager */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">{t.loading}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead className="table-dark">
                  <tr>
                    <th>{t.th_products}</th>
                    <th>{t.th_category}</th>
                    <th className="text-center">{t.th_qty}</th>
                    <th className="text-end">{t.th_unit}</th>
                    <th className="text-end">{t.th_total}</th>
                    <th>{t.th_status}</th>
                    <th>{t.th_date}</th>
                    <th style={{ width: '160px' }}>{t.th_actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.length > 0 ? (
                    filteredSales.map((sale) => {
                      const st = getStatus(sale.status, sale.payment_method);
                      const qty = getTotalQuantity(sale);
                      const avg = qty > 0 ? Number(sale.grand_total ?? sale.total ?? 0) / qty : 0;
                      const names = getProductNames(sale);
                      const cats = getSaleCategories(sale, productById);
                      return (
                        <tr key={sale.id}>
                          <td title={names}>{names}</td>
                          <td><Badge bg="primary">{cats}</Badge></td>
                          <td className="text-center"><Badge bg="secondary">{t.units(qty)}</Badge></td>
                          <td className="text-end">{formatNumber(avg)} {cur}</td>
                          <td className="text-end fw-bold text-success">{formatNumber(sale.grand_total ?? sale.total)} {cur}</td>
                          <td><Badge bg={st.bg}>{st.label}</Badge></td>
                          <td>{formatDate(sale.invoice_date || sale.created_at, t.locale)}</td>
                          <td>
                            <div className="d-flex gap-1 flex-wrap">
                              <Button variant="outline-info" size="sm" onClick={() => setSelectedSale(sale)} title={t.view}>
                                <FaEye />
                              </Button>
                              {canEdit() && (
                                <>
                                  <Button variant="outline-success" size="sm" onClick={() => handleOpenEdit(sale)} title={t.edit}>
                                    <FaEdit />
                                  </Button>
                                  <Button variant="outline-danger" size="sm" onClick={() => setSaleToDelete(sale)} title={t.delete}>
                                    <FaTrash />
                                  </Button>
                                </>
                              )}
                              {!canEdit() && (
                                <Button variant="outline-secondary" size="sm" disabled title="Actions réservées">
                                  <FaLock />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-4">
                        <FaInfoCircle className="me-2" />
                        {t.no_data}
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* ====== MODAL AJOUT ====== */}
      <Modal show={showAddModal} onHide={() => !isUpdating && setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title><FaCashRegister className="me-2" />{t.form_title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {localError && <Alert variant="danger" className="mb-3"><FaInfoCircle className="me-2" />{localError}</Alert>}
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t.f_date}</Form.Label>
                  <Form.Control type="datetime-local" name="date" value={form.date} onChange={handleChange} disabled={isUpdating} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t.f_notes}</Form.Label>
                  <Form.Control as="textarea" rows={1} name="notes" value={form.notes} onChange={handleChange} disabled={isUpdating} />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>{t.f_status}</Form.Label>
                  <Form.Select name="status" value={form.status} onChange={handleChange} disabled={isUpdating}>
                    <option value="paid">{t.paid}</option>
                    <option value="partial">{t.partial}</option>
                    <option value="draft">{t.draft}</option>
                    <option value="cancelled">{t.cancelled}</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>{t.f_payment}</Form.Label>
                  <Form.Select name="payment_method" value={form.payment_method} onChange={handleChange} disabled={isUpdating}>
                    <option value="cash">{t.cash}</option>
                    <option value="bankily">{t.bankily}</option>
                    <option value="masrivi">{t.masrivi}</option>
                    <option value="sedad">{t.sedad}</option>
                    <option value="credit">{t.credit}</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>{t.f_category}</Form.Label>
                  <Form.Select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setNewItem(p => ({ ...p, product_id: '' })); }} disabled={isUpdating}>
                    <option value="">Toutes</option>
                    {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <hr />
            <h6 className="fw-bold mb-3">{t.f_product}</h6>
            <Row className="align-items-end">
              <Col md={5}>
                <Form.Group className="mb-2">
                  <Form.Control as="select" value={newItem.product_id} onChange={handleSelectProduct} disabled={isUpdating}>
                    <option value="">-- Sélectionner --</option>
                    {displayedProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </Form.Control>
                  {selectedProduct && (
                    <Form.Text className="text-primary fw-bold">{t.stock_available(selectedProduct.quantity ?? selectedProduct.stock ?? 0)}</Form.Text>
                  )}
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-2">
                  <Form.Control type="number" min="1" placeholder={t.f_qty} value={newItem.quantity} onChange={(e) => setNewItem(p => ({ ...p, quantity: e.target.value }))} disabled={isUpdating} />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-2">
                  <Form.Control type="number" min="0" step="0.01" placeholder={t.f_price} value={newItem.price} onChange={(e) => setNewItem(p => ({ ...p, price: e.target.value }))} disabled={isUpdating} />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Button variant="primary" className="w-100" onClick={addItem} disabled={isUpdating}>
                  <FaPlus className="me-1" />{t.f_add_item}
                </Button>
              </Col>
            </Row>

            <div className="table-responsive mt-3">
              <Table bordered hover size="sm">
                <thead className="table-dark">
                  <tr>
                    <th>{t.f_product}</th>
                    <th>{t.th_category}</th>
                    <th className="text-center">{t.th_qty}</th>
                    <th className="text-end">{t.f_price}</th>
                    <th className="text-end">{t.th_total}</th>
                    <th style={{ width: '60px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-3 text-muted">{t.no_items}</td></tr>
                  ) : items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.name}</td>
                      <td><Badge bg="primary">{item.category}</Badge></td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-end">{formatNumber(item.price)}</td>
                      <td className="text-end fw-bold">{formatNumber(item.price * item.quantity)}</td>
                      <td className="text-center">
                        <Button variant="outline-danger" size="sm" onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}>
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {items.length > 0 && (
                  <tfoot>
                    <tr className="table-light">
                      <td colSpan="4" className="text-end fw-bold">TOTAL :</td>
                      <td className="text-end fw-bold fs-5">{formatNumber(subtotal)} {cur}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </Table>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)} disabled={isUpdating}>{t.cancel}</Button>
          <Button variant="success" onClick={submitSale} disabled={isUpdating || items.length === 0}>
            {isUpdating ? <Spinner size="sm" className="me-2" /> : <FaPlus className="me-2" />}{t.save}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ====== MODAL ÉDITION ====== */}
      <Modal show={!!saleToEdit} onHide={() => !isUpdating && setSaleToEdit(null)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title><FaEdit className="me-2" />{t.edit_title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {saleToEdit && (
            <>
              <Row className="mb-3">
                <Col md={4}><strong>{t.th_invoice}:</strong> {saleToEdit.invoice_number || `VENTE-${saleToEdit.id}`}</Col>
                <Col md={4}><strong>{t.f_customer}:</strong> {getCustomerName(saleToEdit)}</Col>
                <Col md={4}><strong>{t.th_date}:</strong> {formatDate(saleToEdit.invoice_date || saleToEdit.created_at, t.locale)}</Col>
              </Row>
              <div className="table-responsive">
                <Table bordered hover size="sm">
                  <thead className="table-dark">
                    <tr>
                      <th>{t.f_product}</th>
                      <th className="text-center" style={{ width: 90 }}>{t.th_qty}</th>
                      <th className="text-end" style={{ width: 120 }}>{t.f_price}</th>
                      <th className="text-end">{t.th_total}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editItems.map((it, idx) => (
                      <tr key={idx}>
                        <td>{it.product_name || it.name || it.products?.name || 'Produit'}</td>
                        <td className="text-center">
                          <Form.Control type="number" min="1" size="sm" value={it.quantity}
                            onChange={(e) => { const arr = [...editItems]; arr[idx].quantity = parseInt(e.target.value, 10) || 1; setEditItems(arr); }} />
                        </td>
                        <td className="text-end">
                          <Form.Control type="number" min="0" size="sm" value={it.price}
                            onChange={(e) => { const arr = [...editItems]; arr[idx].price = parseFloat(e.target.value) || 0; setEditItems(arr); }} />
                        </td>
                        <td className="text-end fw-bold">{formatNumber(it.quantity * it.price)} {cur}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>{t.f_status}</Form.Label>
                    <Form.Select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} disabled={isUpdating}>
                      <option value="paid">{t.paid}</option>
                      <option value="partial">{t.partial}</option>
                      <option value="draft">{t.draft}</option>
                      <option value="cancelled">{t.cancelled}</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>{t.f_notes}</Form.Label>
                    <Form.Control as="textarea" rows={2} value={editNotes} onChange={(e) => setEditNotes(e.target.value)} disabled={isUpdating} />
                  </Form.Group>
                </Col>
              </Row>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSaleToEdit(null)} disabled={isUpdating}>{t.cancel}</Button>
          <Button variant="primary" onClick={submitEdit} disabled={isUpdating}>
            {isUpdating ? <Spinner size="sm" className="me-2" /> : <FaEdit className="me-2" />}{t.save}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ====== MODAL DÉTAILS ====== */}
      <Modal show={!!selectedSale} onHide={() => setSelectedSale(null)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title><FaInfoCircle className="me-2" />{t.details_title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSale && (
            <>
              <Row className="mb-3">
                <Col md={4}><strong>{t.th_invoice}:</strong> {selectedSale.invoice_number || `VENTE-${selectedSale.id}`}</Col>
                <Col md={4}><strong>{t.f_customer}:</strong> {getCustomerName(selectedSale)}</Col>
                <Col md={4}><strong>{t.th_date}:</strong> {formatDate(selectedSale.invoice_date || selectedSale.created_at, t.locale)}</Col>
              </Row>
              <div className="table-responsive">
                <Table striped bordered hover size="sm">
                  <thead className="table-dark">
                    <tr>
                      <th>{t.f_product}</th>
                      <th>{t.th_category}</th>
                      <th className="text-center">{t.th_qty}</th>
                      <th className="text-end">{t.f_price}</th>
                      <th className="text-end">{t.th_total}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSaleItems(selectedSale).map((it, idx) => {
                      const q = Number(it.quantity) || 0; const p = Number(it.price ?? it.unit_price) || 0; const lt = Number(it.total ?? q * p);
                      return (
                        <tr key={idx}>
                          <td>{it.product_name || it.name || it.products?.name || 'Produit'}</td>
                          <td><Badge bg="primary">{getItemCategory(it, productById)}</Badge></td>
                          <td className="text-center">{q}</td>
                          <td className="text-end">{formatNumber(p)} {cur}</td>
                          <td className="text-end fw-bold">{formatNumber(lt)} {cur}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="table-light">
                      <td colSpan="4" className="text-end fw-bold">{t.th_total} :</td>
                      <td className="text-end fw-bold fs-5">{formatNumber(selectedSale.grand_total ?? selectedSale.total)} {cur}</td>
                    </tr>
                  </tfoot>
                </Table>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSelectedSale(null)}>{t.close}</Button>
          <Button variant="outline-success" onClick={() => exportSale(selectedSale)}>
            <FaDownload className="me-1" />{t.export}
          </Button>
          <Button variant="primary" onClick={() => printInvoice(selectedSale)}>
            <FaPrint className="me-1" />{t.print}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ====== MODAL SUPPRESSION ====== */}
      <Modal show={!!saleToDelete} onHide={() => !isUpdating && setSaleToDelete(null)}>
        <Modal.Header closeButton>
          <Modal.Title><FaTrash className="me-2" />{t.delete_q}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {saleToDelete && (
            <p>{t.th_invoice} <strong>{saleToDelete.invoice_number || saleToDelete.id}</strong></p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSaleToDelete(null)} disabled={isUpdating}>{t.cancel}</Button>
          <Button variant="danger" onClick={confirmDelete} disabled={isUpdating}>
            {isUpdating ? <Spinner size="sm" /> : t.delete_confirm}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ====== MODAL FACTURE APRÈS ENCAISSEMENT ====== */}
      <Modal show={showInvoice} onHide={() => setShowInvoice(false)} size="lg">
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title><FaInfoCircle className="me-2" />{t.success_invoice}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {lastSale && (
            <>
              <div className="text-center mb-3">
                <h4>{STORE.name}</h4>
                <p className="text-muted mb-0">{STORE.address} — {STORE.phone}</p>
                <h5 className="mt-2">{t.facture} : {lastSale.invoice_number}</h5>
              </div>
              <div className="table-responsive">
                <Table striped bordered hover size="sm">
                  <thead className="table-dark">
                    <tr>
                      <th>{t.f_product}</th>
                      <th className="text-center">{t.th_qty}</th>
                      <th className="text-end">{t.f_price}</th>
                      <th className="text-end">{t.th_total}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSaleItems(lastSale).map((it, idx) => {
                      const q = Number(it.quantity) || 0; const p = Number(it.price ?? it.unit_price) || 0; const lt = Number(it.total ?? q * p);
                      return (
                        <tr key={idx}>
                          <td>{it.product_name || it.name || it.products?.name || 'Produit'}</td>
                          <td className="text-center">{q}</td>
                          <td className="text-end">{formatNumber(p)}</td>
                          <td className="text-end fw-bold">{formatNumber(lt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="table-light">
                      <td colSpan="3" className="text-end fw-bold">TOTAL :</td>
                      <td className="text-end fw-bold fs-5">{formatNumber(lastSale.grand_total ?? lastSale.total)} {cur}</td>
                    </tr>
                  </tfoot>
                </Table>
              </div>
              <p className="text-center text-muted">{t.thanks}<br />{t.thanks_sub}</p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-primary" onClick={() => printInvoice(lastSale)}>
            <FaPrint className="me-1" />{t.print}
          </Button>
          <Button variant="secondary" onClick={() => setShowInvoice(false)}>{t.close}</Button>
          {canAdd() && (
            <Button variant="success" onClick={() => { setShowInvoice(false); setLastSale(null); openAddModal(); }}>
              <FaPlus className="me-1" />{t.add}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default VentesPage;