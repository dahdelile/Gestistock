// src/pages/VentesPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { productsApi, customersApi, salesApi } from '../../api';
import { useLanguage } from '../../context/LanguageContext';

const STORE = { name: 'GESTION STOCK', address: 'Nouakchott, Mauritanie', phone: '+222 XX XX XX XX' };

const I18N = {
  fr: {
    dir: 'ltr', locale: 'fr-FR', currency: 'MRU', eyebrow: 'ESPACE COMMERCIAL',
    title: 'Gestion des ventes', subtitle: 'Suivez vos transactions, encaissez et gérez vos factures.',
    add: 'Nouvelle vente', refresh: 'Actualiser',
    stat_revenue: 'Montant global', stat_revenue_sub: 'Toutes les ventes',
    stat_count: 'Total ventes', stat_count_sub: 'Transactions',
    stat_month: 'Ventes du mois', stat_month_sub: (v) => `Revenus : ${v}`,
    stat_day: 'Ventes du jour', stat_day_sub: (v) => `Revenus : ${v}`,
    history: 'Historique des ventes', history_sub: 'Retrouvez les factures enregistrées.',
    search_ph: 'N° facture ou client...', all_status: 'Tous les statuts',
    paid: 'Payée', partial: 'Crédit', draft: 'Brouillon', cancelled: 'Annulée',
    start_date: 'Début', end_date: 'Fin',
    loading: 'Chargement...', none_title: 'Aucune vente', none_sub: 'Créez une nouvelle vente.', none_add: 'Nouvelle vente',
    th_invoice: 'Facture', th_customer: 'Client', th_products: 'Produits', th_qty: 'Qté', th_unit: 'P.U', th_total: 'Total', th_obs: 'Note', th_status: 'Statut', th_date: 'Date', th_actions: 'Actions',
    view: 'Voir', edit: 'Modifier', delete: 'Supprimer', print: 'Imprimer', export: 'Exporter',
    cash: 'Espèces', bankily: 'Bankily', masrivi: 'Masrivi', sedad: 'Sedad', credit: 'Crédit', card: 'Carte', walk_in: 'Client comptant',
    units: (n) => `${n} u.`,
    pos_title: 'Point de vente', pos_sub: 'Sélectionnez les articles.', catalogue: 'Catalogue', product_count: (n) => `${n} produits`, product_search_ph: 'Rechercher...', scan: 'Scanner', out_of_stock: 'Épuisé', stock_label: (n) => `Stock: ${n}`, no_category: 'Non classé',
    cart_title: 'Panier', cart_count: (n) => `${n} articles`, cart_empty: 'Panier vide', cart_empty_sub: 'Cliquez sur un produit.', customer: 'Client', customer_required: 'Obligatoire pour crédit', discount: 'Remise', subtotal: 'Sous-total', total_to_pay: 'TOTAL', payment_method: 'Paiement', amount_received: 'Montant reçu', change: 'Monnaie', credit_info: 'Vente à crédit. Client requis.', notes: 'Note (optionnel)', checkout: (v) => `Encaisser ${v}`, processing: 'Enregistrement...', clear_cart: 'Vider', close: 'Fermer', cancel: 'Annuler',
    scanner_title: 'Scanner', scanner_label: 'Code-barres', scanner_ph: 'Saisir le code...', scanner_hint: 'Saisie manuelle ou lecteur.', add_to_cart: 'Ajouter',
    details_title: 'Détails', invoice: 'Facture', date: 'Date', sold_items: 'Articles', no_items: 'Aucun article.', total_amount: 'Total',
    edit_title: 'Modifier vente', edit_articles: 'Articles', edit_qty: 'Qté', edit_unit: 'P.U', edit_total: 'Total', edit_status: 'Statut', edit_notes: 'Note', edit_notes_ph: 'Note...', save: 'Enregistrer', saving: 'Enregistrement...',
    delete_title: 'Supprimer ?', delete_q: 'Supprimer cette vente ?', delete_invoice: (n) => `Facture ${n}`, delete_warn: 'Le stock sera restauré.', delete_confirm: 'Oui', deleting: 'Suppression...',
    success_invoice: 'Vente réussie', facture: 'FACTURE', thanks: 'Merci !', thanks_sub: 'À bientôt.', print_invoice: 'Imprimer', new_sale: 'Nouvelle vente',
    err_load: 'Erreur de chargement.', err_empty: 'Panier vide.', err_invalid_amount: 'Montant invalide.', err_missing_cash: (v) => `Il manque ${v}`, err_credit_customer: 'Client requis.', err_save: 'Erreur.', err_edit: 'Erreur.', err_delete: 'Erreur.', err_scan: 'Erreur scan.', ok_sale: 'Enregistré.', ok_edit: 'Modifié.', ok_delete: 'Supprimé.', warn_out_of_stock: (n) => `${n} épuisé.`, warn_max_stock: (n) => `${n} stock max.`, warn_no_product: 'Introuvable.'
  },
  ar: {
    dir: 'rtl', locale: 'ar-u-nu-latn', currency: 'أوقية', eyebrow: 'فضاء المبيعات',
    title: 'إدارة المبيعات', subtitle: 'تابع معاملاتك وأدر فواتيرك.',
    add: 'بيع جديد', refresh: 'تحديث',
    stat_revenue: 'المبلغ الإجمالي', stat_revenue_sub: 'كل المبيعات',
    stat_count: 'إجمالي المبيعات', stat_count_sub: 'المعاملات',
    stat_month: 'مبيعات الشهر', stat_month_sub: (v) => `الإيرادات: ${v}`,
    stat_day: 'مبيعات اليوم', stat_day_sub: (v) => `الإيرادات: ${v}`,
    history: 'سجل المبيعات', history_sub: 'الفواتير المسجلة.',
    search_ph: 'رقم الفاتورة أو العميل...', all_status: 'كل الحالات',
    paid: 'مدفوعة', partial: 'آجل', draft: 'مسودة', cancelled: 'ملغاة',
    start_date: 'من', end_date: 'إلى',
    loading: 'جارٍ التحميل...', none_title: 'لا توجد مبيعات', none_sub: 'أنشئ بيعاً جديداً.', none_add: 'بيع جديد',
    th_invoice: 'الفاتورة', th_customer: 'العميل', th_products: 'المنتجات', th_qty: 'الكمية', th_unit: 'السعر', th_total: 'الإجمالي', th_obs: 'ملاحظة', th_status: 'الحالة', th_date: 'التاريخ', th_actions: 'إجراءات',
    view: 'عرض', edit: 'تعديل', delete: 'حذف', print: 'طباعة', export: 'تصدير',
    cash: 'نقدًا', bankily: 'بنكيلي', masrivi: 'مصرفي', sedad: 'سداد', credit: 'آجل', card: 'بطاقة', walk_in: 'عميل عابر',
    units: (n) => `${n} وحدة`,
    pos_title: 'نقطة البيع', pos_sub: 'اختر المنتجات.', catalogue: 'الكتالوج', product_count: (n) => `${n} منتج`, product_search_ph: 'بحث...', scan: 'مسح', out_of_stock: 'نفد', stock_label: (n) => `المخزون: ${n}`, no_category: 'غير مصنف',
    cart_title: 'السلة', cart_count: (n) => `${n} عنصر`, cart_empty: 'السلة فارغة', cart_empty_sub: 'انقر على منتج.', customer: 'العميل', customer_required: 'مطلوب للآجل', discount: 'تخفيض', subtotal: 'المجموع', total_to_pay: 'المجموع المستحق', payment_method: 'طريقة الدفع', amount_received: 'المستلم', change: 'الباقي', credit_info: 'بيع بالآجل. العميل مطلوب.', notes: 'ملاحظة', checkout: (v) => `تحصيل ${v}`, processing: 'جارٍ...', clear_cart: 'تفريغ', close: 'إغلاق', cancel: 'إلغاء',
    scanner_title: 'الماسح', scanner_label: 'الباركود', scanner_ph: 'أدخل الرمز...', scanner_hint: 'إدخال يدوي أو قارئ.', add_to_cart: 'إضافة',
    details_title: 'التفاصيل', invoice: 'الفاتورة', date: 'التاريخ', sold_items: 'المنتجات', no_items: 'لا توجد منتجات.', total_amount: 'الإجمالي',
    edit_title: 'تعديل البيع', edit_articles: 'المنتجات', edit_qty: 'الكمية', edit_unit: 'السعر', edit_total: 'الإجمالي', edit_status: 'الحالة', edit_notes: 'ملاحظة', edit_notes_ph: 'ملاحظة...', save: 'حفظ', saving: 'جارٍ الحفظ...',
    delete_title: 'حذف؟', delete_q: 'حذف هذا البيع؟', delete_invoice: (n) => `الفاتورة ${n}`, delete_warn: 'سيتم استعادة المخزون.', delete_confirm: 'نعم', deleting: 'جارٍ الحذف...',
    success_invoice: 'تم البيع بنجاح', facture: 'فاتورة', thanks: 'شكراً!', thanks_sub: 'نشكرك على ثقتك.', print_invoice: 'طباعة', new_sale: 'بيع جديد',
    err_load: 'خطأ في التحميل.', err_empty: 'السلة فارغة.', err_invalid_amount: 'مبلغ غير صالح.', err_missing_cash: (v) => `ينقص ${v}`, err_credit_customer: 'العميل مطلوب.', err_save: 'خطأ.', err_edit: 'خطأ.', err_delete: 'خطأ.', err_scan: 'خطأ في الماسح.', ok_sale: 'تم.', ok_edit: 'تم.', ok_delete: 'تم.', warn_out_of_stock: (n) => `${n} نفد.`, warn_max_stock: (n) => `${n} وصل للحد الأقصى.`, warn_no_product: 'غير موجود.'
  }
};

const formatNumber = (value) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(Number(value) || 0);
const formatDate = (value, locale) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const VentesPage = () => {
  const { lang } = useLanguage();
  const t = I18N[lang];
  const cur = t.currency;

  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [loadingSales, setLoadingSales] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [searchSale, setSearchSale] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [search, setSearch] = useState('');

  const [cart, setCart] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [discount, setDiscount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [notes, setNotes] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerCode, setScannerCode] = useState('');
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);
  const [saleToEdit, setSaleToEdit] = useState(null);
  const [saleToDelete, setSaleToDelete] = useState(null);
  const [editStatus, setEditStatus] = useState('paid');
  const [editNotes, setEditNotes] = useState('');
  const [editItems, setEditItems] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

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
      const response = await salesApi.getAll();
      const data = response?.data;
      setSales(Array.isArray(data) ? data : data?.data || []);
    } catch (err) { console.error(err); setSales([]); showError(t.err_load); } 
    finally { setLoadingSales(false); }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await productsApi.getAll();
      const data = response?.data;
      setProducts(Array.isArray(data) ? data : data?.data || []);
    } catch (err) { console.error(err); setProducts([]); } 
    finally { setLoadingProducts(false); }
  };

  const fetchCustomers = async () => {
    try {
      const response = await customersApi.getAll();
      const data = response?.data;
      setCustomers(Array.isArray(data) ? data : data?.data || []);
    } catch (err) { console.warn(err); }
  };

  const getStatus = (status, paymentMethod) => {
    if (status === 'paid') {
      switch (paymentMethod) {
        case 'bankily': return { label: t.bankily, tone: 'violet', icon: 'fa-mobile-alt' };
        case 'masrivi': return { label: t.masrivi, tone: 'amber', icon: 'fa-mobile-alt' };
        case 'sedad': return { label: t.sedad, tone: 'green', icon: 'fa-mobile-alt' };
        case 'credit': return { label: t.credit, tone: 'amber', icon: 'fa-hand-holding-usd' };
        case 'card': return { label: t.card, tone: 'blue', icon: 'fa-credit-card' };
        default: return { label: t.cash, tone: 'green', icon: 'fa-money-bill-wave' };
      }
    }
    const statuses = {
      partial: { label: t.partial, tone: 'amber', icon: 'fa-clock' },
      draft: { label: t.draft, tone: 'gray', icon: 'fa-file' },
      cancelled: { label: t.cancelled, tone: 'rose', icon: 'fa-times-circle' },
    };
    return statuses[status] || { label: status || '—', tone: 'gray', icon: 'fa-question-circle' };
  };

  const subtotal = useMemo(() => cart.reduce((s, i) => s + Number(i.price) * Number(i.quantity || 0), 0), [cart]);
  const discountValue = Math.min(Math.max(Number(discount) || 0, 0), subtotal);
  const total = Math.max(subtotal - discountValue, 0);
  const received = Number(amountReceived) || 0;
  const change = paymentMethod === 'cash' ? Math.max(received - total, 0) : 0;
  const totalItemsCart = cart.reduce((s, i) => s + (Number(i.quantity) || 0), 0);

  const filteredSales = useMemo(() => {
    const q = searchSale.trim().toLowerCase();
    return sales.filter((sale) => {
      const invoice = String(sale.invoice_number || '').toLowerCase();
      const customer = String(sale.customers?.name || sale.customer?.name || t.walk_in).toLowerCase();
      const matchesSearch = !q || invoice.includes(q) || customer.includes(q);
      const matchesStatus = filterStatus === 'all' || sale.status === filterStatus;
      const saleDateStr = String(sale.created_at || '').slice(0, 10);
      const matchesStart = !startDateFilter || saleDateStr >= startDateFilter;
      const matchesEnd = !endDateFilter || saleDateStr <= endDateFilter;
      return matchesSearch && matchesStatus && matchesStart && matchesEnd;
    });
  }, [sales, searchSale, filterStatus, startDateFilter, endDateFilter, t.walk_in]);

  const stats = useMemo(() => {
    const validSales = sales.filter((s) => s.status !== 'cancelled');
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    let dailySales = 0, dailyRevenue = 0, monthlySales = 0, monthlyRevenue = 0;
    validSales.forEach((sale) => {
      const date = new Date(sale.created_at);
      if (Number.isNaN(date.getTime())) return;
      const dStr = date.toISOString().split('T')[0];
      const amount = Number(sale.grand_total ?? sale.total ?? 0);
      if (dStr === todayStr) { dailySales++; dailyRevenue += amount; }
      if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
        monthlySales++; monthlyRevenue += amount;
      }
    });
    return { count: validSales.length, revenue: validSales.reduce((s, x) => s + Number(x.grand_total ?? x.total ?? 0), 0), dailySales, dailyRevenue, monthlySales, monthlyRevenue };
  }, [sales]);

  const hasFilters = Boolean(searchSale || filterStatus !== 'all' || startDateFilter || endDateFilter);
  const resetFilters = () => { setSearchSale(''); setFilterStatus('all'); setStartDateFilter(''); setEndDateFilter(''); };

  const addToCart = (product) => {
    const stock = Number(product.quantity) || 0;
    if (stock <= 0) return showError(t.warn_out_of_stock(product.name));
    const price = Number(product.sale_price) || 0;
    setCart((prev) => {
      const existing = prev.find((i) => String(i.product_id) === String(product.id));
      if (existing) {
        if (Number(existing.quantity) >= stock) { showError(t.warn_max_stock(product.name)); return prev; }
        return prev.map((i) => String(i.product_id) === String(product.id) ? { ...i, quantity: Number(i.quantity) + 1 } : i);
      }
      return [...prev, { product_id: product.id, name: product.name, price, purchase_price: Number(product.purchase_price) || 0, quantity: 1, stock, barcode: product.barcode || '', category: product.categories?.name || t.no_category }];
    });
    setError('');
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) => prev.map((item) => {
      if (String(item.product_id) !== String(productId)) return item;
      return { ...item, quantity: Math.max(1, Math.min(Number(item.stock), Number(item.quantity || 0) + delta)) };
    }));
  };

  const handleManualQuantityChange = (productId, value) => {
    if (value === '') return setCart((prev) => prev.map((i) => String(i.product_id) === String(productId) ? { ...i, quantity: '' } : i));
    let q = parseInt(value, 10);
    if (Number.isNaN(q)) return;
    const item = cart.find((e) => String(e.product_id) === String(productId));
    if (!item) return;
    setCart((prev) => prev.map((e) => String(e.product_id) === String(productId) ? { ...e, quantity: Math.max(1, Math.min(Number(item.stock), q)) } : e));
  };

  const handleQuantityBlur = (productId) => {
    setCart((prev) => prev.map((item) => String(item.product_id) !== String(productId) ? item : { ...item, quantity: Math.max(1, Math.min(Number(item.stock), Number(item.quantity) || 1)) }));
  };

  const removeFromCart = (productId) => setCart((prev) => prev.filter((i) => String(i.product_id) !== String(productId)));
  const clearCart = () => { setCart([]); setDiscount(''); setAmountReceived(''); setCustomerId(''); setPaymentMethod('cash'); setSearch(''); setNotes(''); };

  const handleBarcodeSearch = async (code) => {
    const clean = String(code || '').trim();
    if (!clean) return;
    try {
      const response = await productsApi.getAll();
      const list = response?.data || [];
      const product = list.find((p) => String(p.barcode || '').trim() === clean);
      if (!product) return showError(t.warn_no_product);
      addToCart(product);
      setSearch(''); setScannerCode(''); setShowScanner(false);
    } catch { showError(t.err_scan); }
  };

  const handleSearchKeyDown = (e) => { if (e.key === 'Enter') { e.preventDefault(); if (search.trim()) handleBarcodeSearch(search); } };

  const handleCheckout = async () => {
    if (cart.length === 0) return showError(t.err_empty);
    if (total <= 0) return showError(t.err_invalid_amount);
    if (paymentMethod === 'cash' && received < total) return showError(t.err_missing_cash(`${formatNumber(total - received)} ${cur}`));
    if (paymentMethod === 'credit' && !customerId) return showError(t.err_credit_customer);
    
    setProcessing(true);
    try {
      const payload = {
        invoice_number: `INV-${Date.now().toString().slice(-8)}`, customer_id: customerId || null,
        total: subtotal, discount: discountValue, grand_total: total,
        paid_amount: paymentMethod === 'credit' ? 0 : total, balance: paymentMethod === 'credit' ? total : 0,
        status: paymentMethod === 'credit' ? 'partial' : 'paid', payment_method: paymentMethod,
        amount_received: paymentMethod === 'cash' ? received : total, change_amount: paymentMethod === 'cash' ? change : 0,
        notes: notes.trim(),
        items: cart.map((i) => ({ product_id: i.product_id, quantity: Number(i.quantity), unit_price: Number(i.price), price: Number(i.price), total: Number(i.price) * Number(i.quantity) })),
      };
      const response = await salesApi.checkout(payload);
      const saleData = response?.data || {};
      const invoiceItems = saleData.items || cart.map((i) => ({ product_name: i.name, name: i.name, quantity: Number(i.quantity), price: Number(i.price), total: Number(i.price) * Number(i.quantity) }));
      
      setLastSale({ ...saleData, invoice_number: saleData.invoice_number || payload.invoice_number, customer_id: saleData.customer_id || customerId || null, items: invoiceItems, subtotal, discount: discountValue, grand_total: Number(saleData.grand_total ?? saleData.total ?? total), total: Number(saleData.grand_total ?? saleData.total ?? total), amount_received: payload.amount_received, change_amount: payload.change_amount, payment_method: paymentMethod, notes, created_at: saleData.created_at || new Date().toISOString() });
      
      setShowModal(false); setShowInvoice(true); clearCart();
      await Promise.all([fetchProducts(), fetchSales()]);
      showSuccess(t.ok_sale);
    } catch (err) { console.error(err); showError(err?.message || t.err_save); } 
    finally { setProcessing(false); }
  };

  const handleNewSale = () => { setShowInvoice(false); setLastSale(null); clearCart(); setShowModal(true); fetchProducts(); fetchSales(); };
  const getSaleItems = (sale) => sale?.items || sale?.invoice_items || sale?.items_sale || [];

  const handleOpenEdit = (sale) => {
    setSaleToEdit(sale); setEditStatus(sale.status || 'paid'); setEditNotes(sale.notes || '');
    setEditItems(getSaleItems(sale).map((item) => ({ ...item, quantity: Number(item.quantity) || 1, price: Number(item.price ?? item.unit_price) || 0 })));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!saleToEdit) return;
    setActionLoading(true);
    try {
      const newTotal = editItems.reduce((s, i) => s + Number(i.quantity) * Number(i.price), 0);
      await salesApi.updateSale(saleToEdit.id, { status: editStatus, notes: editNotes, total: newTotal, grand_total: newTotal });
      setSaleToEdit(null); await fetchSales(); showSuccess(t.ok_edit);
    } catch (err) { console.error(err); showError(t.err_edit); } 
    finally { setActionLoading(false); }
  };

  const handleDeleteConfirm = async () => {
    if (!saleToDelete) return;
    setActionLoading(true);
    try {
      await salesApi.deleteSale(saleToDelete.id, saleToDelete.invoice_items);
      setSaleToDelete(null); await Promise.all([fetchSales(), fetchProducts()]); showSuccess(t.ok_delete);
    } catch (err) { console.error(err); showError(t.err_delete); } 
    finally { setActionLoading(false); }
  };

  const getInvoiceNumber = () => lastSale?.invoice_number || `VENTE-${lastSale?.id || Date.now()}`;
  const getCustomerName = (sale) => {
    if (!sale) return t.walk_in;
    const customer = customers.find((i) => String(i.id) === String(sale.customer_id));
    return sale.customers?.name || sale.customer?.name || customer?.name || t.walk_in;
  };
  const getTotalQuantity = (sale) => getSaleItems(sale).reduce((s, i) => s + Number(i.quantity || 0), 0);
  const getAverageUnitPrice = (sale) => {
    const qty = getTotalQuantity(sale);
    return qty > 0 ? Number(sale.grand_total ?? sale.total ?? 0) / qty : 0;
  };
  const getProductNames = (sale) => {
    const names = getSaleItems(sale).map((i) => i.product_name || i.name || i.products?.name || 'Produit');
    return names.length > 0 ? names.join(', ') : '—';
  };

  const printInvoice = (saleToPrint = null) => {
    const sale = saleToPrint || lastSale;
    if (!sale) return;
    const items = getSaleItems(sale);
    const itemsHtml = items.map((item) => {
      const name = item.product_name || item.name || item.products?.name || 'Produit';
      const qty = Number(item.quantity) || 0;
      const price = Number(item.price ?? item.unit_price) || 0;
      const lineTotal = Number(item.total ?? price * qty);
      return `<tr><td>${escapeHtml(name)}</td><td class="center">${qty}</td><td class="right">${formatNumber(price)}</td><td class="right">${formatNumber(lineTotal)}</td></tr>`;
    }).join('');
    const win = window.open('', '_blank', 'width=900,height=900');
    if (!win) return showError('Pop-up blocked.');
    win.document.write(`
      <!DOCTYPE html><html lang="${lang}" dir="${t.dir}"><head><meta charset="UTF-8"><title>${escapeHtml(sale.invoice_number || sale.id)}</title>
      <style>*{box-sizing:border-box}body{margin:0;padding:30px;color:#14213d;font-family:${lang === 'ar' ? "'Cairo', " : ''}Arial,sans-serif}.invoice{max-width:800px;margin:auto}.header{text-align:center;border-bottom:2px solid #14213d;padding-bottom:18px}.store{font-size:26px;font-weight:800}.muted{color:#66748b;line-height:1.7}h2{text-align:center;margin:24px 0}.meta{display:flex;justify-content:space-between;gap:15px;margin:25px 0}.meta>div{flex:1}.label{display:block;font-size:11px;color:#66748b;margin-bottom:5px}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#e8efff;text-align:${t.dir === 'rtl' ? 'right' : 'left'}}th,td{padding:11px 9px;border-bottom:1px solid #e3e9f2}.center{text-align:center}.right{text-align:${t.dir === 'rtl' ? 'left' : 'right'}}.totals{width:330px;margin:22px 0 0 auto}.total-row{display:flex;justify-content:space-between;padding:8px 0}.grand{border-top:2px solid #14213d;border-bottom:2px solid #14213d;font-size:19px;font-weight:800;padding:13px 0}.footer{margin-top:40px;border-top:1px solid #ddd;padding-top:18px;text-align:center;color:#66748b}@media print{body{padding:0}}</style></head><body>
        <div class="invoice">
          <div class="header"><div class="store">${escapeHtml(STORE.name)}</div><div class="muted">${escapeHtml(STORE.address)}<br>${escapeHtml(STORE.phone)}</div></div>
          <h2>${t.facture}</h2>
          <div class="meta"><div><span class="label">N°</span><strong>${escapeHtml(sale.invoice_number)}</strong></div><div><span class="label">${t.date.toUpperCase()}</span><strong>${escapeHtml(formatDate(sale.created_at, t.locale))}</strong></div><div><span class="label">${t.customer.toUpperCase()}</span><strong>${escapeHtml(getCustomerName(sale))}</strong></div></div>
          <table><thead><tr><th>${t.th_products}</th><th class="center">${t.edit_qty}</th><th class="right">${t.th_unit}</th><th class="right">${t.th_total}</th></tr></thead><tbody>${itemsHtml}</tbody></table>
          <div class="totals"><div class="total-row"><span>${t.subtotal}</span><strong>${formatNumber(sale.subtotal)} ${cur}</strong></div><div class="total-row"><span>${t.discount}</span><strong>- ${formatNumber(sale.discount)} ${cur}</strong></div><div class="total-row grand"><span>${t.total_to_pay}</span><span>${formatNumber(sale.grand_total)} ${cur}</span></div><div class="total-row"><span>${t.payment_method}</span><strong>${escapeHtml(t[sale.payment_method] || t.cash)}</strong></div>${sale.payment_method === 'cash' ? `<div class="total-row"><span>${t.amount_received}</span><strong>${formatNumber(sale.amount_received)} ${cur}</strong></div><div class="total-row"><span>${t.change}</span><strong>${formatNumber(sale.change_amount)} ${cur}</strong></div>` : ''}</div>
          <div class="footer">${t.thanks}<br>${t.thanks_sub}</div>
        </div>
      </body></html>
    `);
    win.document.close(); win.focus(); win.onload = () => win.print();
  };

  const exportSale = (sale) => {
    const items = getSaleItems(sale);
    const rows = [[t.th_invoice, sale.invoice_number], [t.th_date, formatDate(sale.created_at, t.locale)], [t.th_customer, getCustomerName(sale)], [t.th_status, getStatus(sale.status, sale.payment_method).label], [], [t.th_products, t.edit_qty, t.th_unit, t.th_total], ...items.map((i) => [i.product_name || i.name, i.quantity, i.price, i.total]), [], [t.total_amount, '', '', Number(sale.grand_total)]];
    const csv = rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `Vente_${sale.invoice_number}.csv`;
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  };

  return (
    <div className="expenses-page" dir={t.dir} lang={lang}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
        
        .expenses-page {
          --ink:#14213d; --muted:#66748b; --line:#e3e9f2; --bg:#f2f5fb; --card:#fff;
          --primary:#1f5eea; --primary-soft:#e8efff; --green:#0f9d74; --green-soft:#def7ee;
          --violet:#6a4de0; --violet-soft:#ece8fd; --amber:#e08a0b; --amber-soft:#fff0d6;
          --red:#d63c4a; --red-soft:#fde8ea; --teal:#0e8fa8; --teal-soft:#dcf3f8; --rose:#c2417c; --rose-soft:#fbe6f0;
          min-height:100vh; padding: 16px; background:var(--bg); color:var(--ink);
          font-family:Inter, 'Cairo', sans-serif; font-size: 14px; /* حجم خط أساسي أصغر */
        }
        .expenses-page *{box-sizing:border-box}
        
        /* الترويسة */
        .ep-hero{position:relative; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px; padding:20px; margin-bottom:20px; border-radius:16px; color:#fff; background:linear-gradient(125deg,#0f2f66 0%,#1b55c9 58%,#2aa3d9 100%);}
        .ep-eyebrow{font-size:11px; font-weight:800; letter-spacing:1.5px; opacity:.78}
        .ep-title h1{margin:6px 0 4px; font-size:20px; font-weight:800; display:flex; align-items:center; gap:10px;}
        .ep-title-icon{display:inline-grid; place-items:center; width:36px; height:36px; border-radius:10px; background:rgba(255,255,255,.16); font-size:16px}
        .ep-title p{margin:0; color:rgba(255,255,255,.82); font-size:13px}
        .ep-btn-add{display:inline-flex; align-items:center; gap:6px; padding:8px 14px; border:0; border-radius:10px; background:#fff; color:#174078; font:inherit; font-weight:800; font-size:13px; cursor:pointer;}

        /* البطاقات الإحصائية */
        .ep-stats{display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-bottom:20px}
        .ep-card{display:flex; justify-content:space-between; align-items:flex-start; padding:16px; background:var(--card); border:1px solid var(--line); border-inline-start:4px solid var(--accent); border-radius:12px;}
        .ep-card-info h3{margin:0 0 6px; font-size:12px; color:var(--muted); font-weight:800}
        .ep-card-info .value{font-size:20px; font-weight:800; color:var(--ink)}
        .ep-card-info .sub{margin-top:4px; font-size:11px; color:var(--accent); font-weight:700}
        .ep-icon{display:grid; place-items:center; width:36px; height:36px; border-radius:10px; background:var(--accent-soft); color:var(--accent); font-size:16px}
        .tone-blue{--accent:var(--primary);--accent-soft:var(--primary-soft)}
        .tone-green{--accent:var(--green);--accent-soft:var(--green-soft)}
        .tone-violet{--accent:var(--violet);--accent-soft:var(--violet-soft)}
        .tone-amber{--accent:var(--amber);--accent-soft:var(--amber-soft)}

        /* لوحة الجدول */
        .ep-panel{background:var(--card); border-radius:16px; border:1px solid var(--line); overflow:hidden; margin-bottom:20px}
        .ep-panel-head{padding:16px; border-bottom:1px solid var(--line); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px}
        .ep-panel-head h5{margin:0; font-size:16px; font-weight:800}
        .ep-filters{display:grid; grid-template-columns:1fr; gap:10px; padding:16px; background:#fbfcff; border-bottom:1px solid var(--line)}
        .ep-filter-input{width:100%; height:36px; border:1px solid #d9e1ed; border-radius:8px; padding:0 10px; font:inherit; font-size:13px;}
        
        /* الجدول */
        .ep-table-wrap{overflow-x:auto}
        .ep-table{width:100%; border-collapse:collapse; min-width: 900px;}
        .ep-table th{background:#f3f6fc; color:#5b6b85; padding:12px 14px; font-size:12px; font-weight:800; text-align:start; border-bottom:1px solid var(--line);}
        .ep-table td{padding:12px 14px; border-bottom:1px solid #f0f3f8; font-size:13px; vertical-align:middle}
        .ep-badge{padding:3px 8px; border-radius:99px; font-size:11px; font-weight:800;}
        
        /* النوافذ المنبثقة (Modals) */
        .ep-modal-overlay{position:fixed; inset:0; background:rgba(0,0,0,.5); display:flex; align-items:center; justify-content:center; z-index:1000; padding:16px;}
        .ep-modal{background:#fff; width:100%; max-width:1000px; border-radius:16px; max-height:90vh; overflow-y:auto;}
        .ep-modal-header{padding:16px; border-bottom:1px solid var(--line); display:flex; justify-content:space-between;}
        .ep-modal-body{padding:16px}
        .ep-modal-footer{padding:16px; border-top:1px solid var(--line); display:flex; justify-content:flex-end; gap:10px}
        
        /* شاشة البيع (POS) */
        .pos-grid{display:grid; grid-template-columns:1.2fr 1fr; gap:16px;}
        .pos-products{display:grid; grid-template-columns:repeat(auto-fill, minmax(130px, 1fr)); gap:10px; max-height:400px; overflow-y:auto;}
        .pos-product{padding:10px; border:1px solid var(--line); border-radius:10px; cursor:pointer; display:flex; flex-direction:column;}
        .pos-product-name{font-size:13px; font-weight:700; margin:6px 0 2px;}
        .pos-product-price{color:var(--primary); font-weight:800; font-size:13px;}
        
        /* السلة */
        .pos-cart{border:1px solid var(--line); border-radius:12px; display:flex; flex-direction:column;}
        .pos-cart-list{list-style:none; padding:0; margin:0; max-height:200px; overflow-y:auto;}
        .pos-cart-item{padding:10px; border-bottom:1px solid var(--line); display:flex; justify-content:space-between; align-items:center;}
        .pos-payments{display:grid; grid-template-columns:repeat(3,1fr); gap:6px;}
        .pos-payment-btn{padding:8px; border:1px solid var(--line); border-radius:8px; font-size:12px; font-weight:700; cursor:pointer;}
        .pos-payment-btn.active{border-color:var(--primary); background:var(--primary-soft); color:var(--primary);}

        /* شريط التنبيهات */
        .ep-toast{position:fixed; top:20px; right:20px; padding:12px 20px; border-radius:8px; color:#fff; font-weight:700; z-index:1100; font-size:13px;}
        .ep-toast.success{background:var(--green)} .ep-toast.danger{background:var(--red)}

        /* التجاوب مع الهواتف */
        @media (max-width: 768px) {
          .ep-hero { padding: 16px; flex-direction: column; align-items: flex-start; }
          .ep-btn-add { width: 100%; justify-content: center; }
          .ep-stats { grid-template-columns: 1fr; }
          .pos-grid { grid-template-columns: 1fr; } /* جعل شاشة البيع عمودية في الهاتف */
          .pos-payments { grid-template-columns: repeat(2, 1fr); }
          .ep-modal { max-height: 95vh; border-radius: 12px; }
          .ep-modal-footer { flex-direction: column-reverse; }
          .ep-modal-footer button { width: 100%; }
        }
      `}</style>

      {error && <div className="ep-toast danger" role="alert">{error}</div>}
      {success && <div className="ep-toast success" role="status">{success}</div>}

      {/* Hero */}
      <header className="ep-hero">
        <div className="ep-title">
          <span className="ep-eyebrow"><i className="fas fa-chart-line" /> {t.eyebrow}</span>
          <h1><span className="ep-title-icon"><i className="fas fa-cash-register" /></span> {t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <button type="button" className="ep-btn-add" onClick={() => { clearCart(); setShowModal(true); }}>
          <i className="fas fa-plus" /> {t.add}
        </button>
      </header>

      {/* Stats */}
      <section className="ep-stats">
        <div className="ep-card tone-violet">
          <div className="ep-card-info"><h3>{t.stat_revenue}</h3><div className="value">{formatNumber(stats.revenue)}</div><div className="sub">{t.stat_revenue_sub}</div></div>
          <div className="ep-icon"><i className="fas fa-coins" /></div>
        </div>
        <div className="ep-card tone-green">
          <div className="ep-card-info"><h3>{t.stat_count}</h3><div className="value">{stats.count}</div><div className="sub">{t.stat_count_sub}</div></div>
          <div className="ep-icon"><i className="fas fa-shopping-cart" /></div>
        </div>
        <div className="ep-card tone-blue">
          <div className="ep-card-info"><h3>{t.stat_month}</h3><div className="value">{stats.monthlySales}</div><div className="sub">{formatNumber(stats.monthlyRevenue)} {cur}</div></div>
          <div className="ep-icon"><i className="fas fa-calendar-alt" /></div>
        </div>
        <div className="ep-card tone-amber">
          <div className="ep-card-info"><h3>{t.stat_day}</h3><div className="value">{stats.dailySales}</div><div className="sub">{formatNumber(stats.dailyRevenue)} {cur}</div></div>
          <div className="ep-icon"><i className="fas fa-calendar-day" /></div>
        </div>
      </section>

      {/* Historique */}
      <div className="ep-panel">
        <div className="ep-panel-head">
          <h5><i className="fas fa-list-alt" /> {t.history}</h5>
        </div>
        <div className="ep-filters">
          <input type="search" className="ep-filter-input" placeholder={t.search_ph} value={searchSale} onChange={(e) => setSearchSale(e.target.value)} />
          <select className="ep-filter-input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">{t.all_status}</option>
            <option value="paid">{t.paid}</option>
            <option value="partial">{t.partial}</option>
            <option value="cancelled">{t.cancelled}</option>
          </select>
          <input type="date" className="ep-filter-input" value={startDateFilter} onChange={(e) => setStartDateFilter(e.target.value)} />
          <input type="date" className="ep-filter-input" value={endDateFilter} onChange={(e) => setEndDateFilter(e.target.value)} />
        </div>

        <div className="ep-table-wrap">
          <table className="ep-table">
            <thead>
              <tr>
                <th>{t.th_invoice}</th><th>{t.th_customer}</th><th>{t.th_qty}</th><th>{t.th_total}</th><th>{t.th_status}</th><th>{t.th_date}</th><th>{t.th_actions}</th>
              </tr>
            </thead>
            <tbody>
              {loadingSales ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>{t.loading}</td></tr>
              ) : filteredSales.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>{t.none_title}</td></tr>
              ) : (
                filteredSales.map((sale) => {
                  const status = getStatus(sale.status, sale.payment_method);
                  const totalQty = getTotalQuantity(sale);
                  return (
                    <tr key={sale.id}>
                      <td><span style={{ fontWeight: 800, color: 'var(--primary)' }}>{sale.invoice_number}</span></td>
                      <td>{getCustomerName(sale)}</td>
                      <td>{t.units(totalQty)}</td>
                      <td style={{ fontWeight: 800 }}>{formatNumber(sale.grand_total)} {cur}</td>
                      <td><span className={`ep-badge badge-${status.tone}`}><i className={`fas ${status.icon}`} /> {status.label}</span></td>
                      <td>{formatDate(sale.created_at, t.locale)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button type="button" className="btn-icon btn-view" onClick={() => setSelectedSale(sale)}><i className="fas fa-eye" /></button>
                          <button type="button" className="btn-icon btn-delete" onClick={() => setSaleToDelete(sale)}><i className="fas fa-trash" /></button>
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

      {/* Modal POS (Nouvelle vente) */}
      {showModal && (
        <div className="ep-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="ep-modal">
            <div className="ep-modal-header">
              <h3>{t.pos_title}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><i className="fas fa-times" /></button>
            </div>
            <div className="ep-modal-body">
              <div className="pos-grid">
                {/* Catalogue */}
                <div>
                  <input type="search" className="ep-filter-input" placeholder={t.product_search_ph} value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: 10 }} />
                  <div className="pos-products">
                    {products.map((product) => {
                      const out = Number(product.quantity) <= 0;
                      return (
                        <div key={product.id} className={`pos-product ${out ? 'out' : ''}`} onClick={() => !out && addToCart(product)}>
                          <span className="pos-product-name">{product.name}</span>
                          <span className="pos-product-price">{formatNumber(product.sale_price)} {cur}</span>
                          <span style={{ fontSize: 11, color: out ? 'var(--red)' : 'var(--muted)' }}>{t.stock_label(product.quantity)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Panier */}
                <div className="pos-cart">
                  <div style={{ padding: 10, borderBottom: '1px solid var(--line)', fontWeight: 800 }}>{t.cart_title} ({totalItemsCart})</div>
                  <ul className="pos-cart-list">
                    {cart.map((item) => (
                      <li key={item.product_id} className="pos-cart-item">
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{item.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{formatNumber(item.price)} {cur} x {item.quantity}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <button onClick={() => updateQuantity(item.product_id, -1)}>-</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product_id, 1)}>+</button>
                          <button onClick={() => removeFromCart(item.product_id)} style={{ color: 'var(--red)', marginLeft: 6 }}><i className="fas fa-times" /></button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div style={{ padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16, marginBottom: 10 }}>
                      <span>{t.total_to_pay}</span>
                      <span style={{ color: 'var(--primary)' }}>{formatNumber(total)} {cur}</span>
                    </div>
                    <div className="pos-payments">
                      <button className={`pos-payment-btn ${paymentMethod === 'cash' ? 'active' : ''}`} onClick={() => setPaymentMethod('cash')}>{t.cash}</button>
                      <button className={`pos-payment-btn ${paymentMethod === 'bankily' ? 'active' : ''}`} onClick={() => setPaymentMethod('bankily')}>{t.bankily}</button>
                      <button className={`pos-payment-btn ${paymentMethod === 'credit' ? 'active' : ''}`} onClick={() => setPaymentMethod('credit')}>{t.credit}</button>
                    </div>
                    {paymentMethod === 'cash' && (
                      <input type="number" className="ep-filter-input" placeholder={t.amount_received} value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)} style={{ marginTop: 10 }} />
                    )}
                    <button className="ep-btn-save" style={{ width: '100%', marginTop: 12, padding: 12 }} onClick={handleCheckout}>{t.checkout(formatNumber(total))}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Détails (Simple) */}
      {selectedSale && (
        <div className="ep-modal-overlay" onClick={(e) => e.target === e.currentTarget && setSelectedSale(null)}>
          <div className="ep-modal" style={{ maxWidth: 600 }}>
            <div className="ep-modal-header">
              <h3>{t.details_title} - {selectedSale.invoice_number}</h3>
              <button className="btn-icon" onClick={() => setSelectedSale(null)}><i className="fas fa-times" /></button>
            </div>
            <div className="ep-modal-body">
              <p><strong>{t.th_customer}:</strong> {getCustomerName(selectedSale)}</p>
              <p><strong>{t.th_date}:</strong> {formatDate(selectedSale.created_at, t.locale)}</p>
              <p><strong>{t.total_amount}:</strong> {formatNumber(selectedSale.grand_total)} {cur}</p>
            </div>
            <div className="ep-modal-footer">
              <button className="ep-btn ep-btn-outline" onClick={() => setSelectedSale(null)}>{t.close}</button>
              <button className="ep-btn ep-btn-save" onClick={() => printInvoice(selectedSale)}><i className="fas fa-print" /> {t.print}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Suppression */}
      {saleToDelete && (
        <div className="ep-modal-overlay" onClick={(e) => e.target === e.currentTarget && setSaleToDelete(null)}>
          <div className="ep-modal" style={{ maxWidth: 400, textAlign: 'center' }}>
            <div className="ep-modal-body" style={{ padding: 30 }}>
              <i className="fas fa-exclamation-triangle" style={{ fontSize: 40, color: 'var(--red)', marginBottom: 16 }}></i>
              <h3>{t.delete_q}</h3>
              <p>{t.delete_invoice(saleToDelete.invoice_number)}</p>
            </div>
            <div className="ep-modal-footer" style={{ justifyContent: 'center' }}>
              <button className="ep-btn ep-btn-cancel" onClick={() => setSaleToDelete(null)}>{t.cancel}</button>
              <button className="ep-btn ep-btn-danger" onClick={handleDeleteConfirm}>{t.delete_confirm}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Facture (Après checkout) */}
      {showInvoice && lastSale && (
        <div className="ep-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowInvoice(false)}>
          <div className="ep-modal" style={{ maxWidth: 500, textAlign: 'center' }}>
            <div className="ep-modal-body" style={{ padding: 30 }}>
              <i className="fas fa-check-circle" style={{ fontSize: 50, color: 'var(--green)', marginBottom: 16 }}></i>
              <h2>{t.success_invoice}</h2>
              <p>{t.invoice}: <strong>{getInvoiceNumber()}</strong></p>
              <h3>{formatNumber(lastSale.grand_total)} {cur}</h3>
            </div>
            <div className="ep-modal-footer" style={{ justifyContent: 'center' }}>
              <button className="ep-btn ep-btn-outline" onClick={() => printInvoice(lastSale)}><i className="fas fa-print" /> {t.print}</button>
              <button className="ep-btn ep-btn-save" onClick={handleNewSale}>{t.new_sale}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VentesPage;