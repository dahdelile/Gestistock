// src/pages/VentesPage.jsx
// Version bilingue Français / العربية (RTL) — design unifié
import React, { useEffect, useMemo, useState } from 'react';
import { productsApi, customersApi, salesApi } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
/* =========================================================
   CONSTANTES / TRADUCTIONS
========================================================= */

const STORE = {
  name: 'GESTION STOCK',
  address: 'Nouakchott, Mauritanie',
  phone: '+222 XX XX XX XX',
};

const I18N = {
  fr: {
    dir: 'ltr',
    locale: 'fr-FR',
    currency: 'MRU',
    eyebrow: 'ESPACE COMMERCIAL',
    title: 'Gestion des ventes',
    subtitle: 'Suivez vos transactions, encaissez et gérez vos factures.',
    add: 'Nouvelle vente',
    refresh: 'Actualiser',
    stat_revenue: 'Montant global',
    stat_revenue_sub: 'MRU · Toutes les ventes',
    stat_count: 'Total ventes',
    stat_count_sub: 'Transactions enregistrées',
    stat_month: 'Ventes du mois',
    stat_month_sub: (v) => `Revenus : ${v}`,
    stat_day: 'Ventes du jour',
    stat_day_sub: (v) => `Revenus : ${v}`,
    history: 'Historique des ventes',
    history_sub: 'Retrouvez les factures et les transactions enregistrées.',
    search_ph: 'N° facture ou nom du client...',
    all_status: 'Tous les statuts',
    paid: 'Payée',
    partial: 'Partielle / Crédit',
    draft: 'Brouillon',
    cancelled: 'Annulée',
    start_date: 'Date de début',
    end_date: 'Date de fin',
    results: (n) => `${n} résultat(s)`,
    loading: 'Chargement des ventes...',
    none_title: 'Aucune vente trouvée',
    none_sub: 'Modifiez votre recherche ou créez une nouvelle vente.',
    none_add: 'Nouvelle vente',
    th_index: '#',
    th_invoice: 'Facture',
    th_customer: 'Client',
    th_products: 'Produit(s)',
    th_qty: 'Quantité',
    th_unit: 'Prix unitaire',
    th_total: 'Prix total',
    th_obs: 'Observation',
    th_status: 'Statut',
    th_date: 'Date',
    th_actions: 'Actions',
    view: 'Voir les détails',
    edit: 'Modifier',
    delete: 'Supprimer',
    print: 'Imprimer',
    export: 'Exporter',
    // Payment labels
    cash: 'Espèces',
    bankily: 'Bankily',
    masrivi: 'Masrivi',
    sedad: 'Sedad',
    credit: 'Crédit',
    card: 'Carte',
    walk_in: 'Client comptant',
    units: (n) => `${n} unité(s)`,
    // POS modal
    pos_title: 'Point de vente',
    pos_sub: 'Sélectionnez les articles et procédez à l’encaissement.',
    catalogue: 'Catalogue produits',
    product_count: (n) => `${n} produits`,
    product_search_ph: 'Nom, référence ou code-barres...',
    scan: 'Scanner',
    loading_products: 'Chargement des produits...',
    out_of_stock: 'Épuisé',
    stock_label: (n) => `Stock : ${n}`,
    no_category: 'Non catégorisé',
    cart_title: 'Panier',
    cart_count: (n) => `${n} article(s)`,
    cart_empty: 'Panier vide',
    cart_empty_sub: 'Cliquez sur un produit pour l’ajouter.',
    per_unit: 'MRU / unité',
    customer: 'Client',
    customer_required: 'Obligatoire pour le crédit',
    discount: 'Remise',
    subtotal: 'Sous-total',
    total_to_pay: 'TOTAL À PAYER',
    payment_method: 'Mode de paiement',
    amount_received: 'Montant reçu',
    amount_placeholder: 'Montant reçu',
    missing: (v) => `Il manque ${v}`,
    change: 'Monnaie à rendre',
    credit_info: 'La vente sera enregistrée à crédit. Un client doit être sélectionné.',
    notes: 'Observation (Optionnel)',
    notes_ph: 'Ajouter une note à cette vente...',
    checkout: (v) => `Encaisser ${v}`,
    processing: 'Enregistrement...',
    clear_cart: 'Vider le panier',
    close: 'Fermer',
    cancel: 'Annuler',
    // Scanner modal
    scanner_title: 'Recherche par code-barres',
    scanner_label: 'Code-barres du produit',
    scanner_ph: 'Saisissez ou scannez le code...',
    scanner_hint: 'Cette fenêtre permet la saisie manuelle ou l’utilisation d’un lecteur de codes-barres.',
    add_to_cart: 'Ajouter au panier',
    // Details modal
    details_title: 'Détails de la vente',
    invoice: 'Facture',
    date: 'Date',
    sold_items: 'Articles vendus',
    no_items: "Aucun détail d'article disponible.",
    total_amount: 'Montant total',
    // Edit modal
    edit_title: 'Modifier la vente',
    edit_articles: 'Articles',
    edit_qty: 'Qté',
    edit_unit: 'Prix Unitaire',
    edit_total: 'Total',
    edit_status: 'Statut de la vente',
    edit_notes: 'Observation',
    edit_notes_ph: 'Ajouter ou modifier une note...',
    save: 'Enregistrer',
    saving: 'Enregistrement...',
    // Delete
    delete_title: 'Confirmer la suppression',
    delete_q: 'Supprimer cette vente ?',
    delete_invoice: (n) => `Facture ${n}`,
    delete_warn: 'Vérifiez que votre API gère correctement la restauration du stock lors de la suppression.',
    delete_confirm: 'Oui, supprimer',
    deleting: 'Suppression...',
    // Invoice after checkout
    success_invoice: 'Vente enregistrée avec succès',
    facture: 'FACTURE',
    thanks: 'Merci pour votre achat !',
    thanks_sub: 'Nous vous remercions de votre confiance.',
    print_invoice: 'Imprimer la facture',
    new_sale: 'Nouvelle vente',
    // Errors
    err_load: 'Impossible de charger les ventes.',
    err_empty: 'Panier vide.',
    err_invalid_amount: 'Montant invalide.',
    err_missing_cash: (v) => `Il manque ${v}`,
    err_credit_customer: 'Sélectionnez un client pour le crédit.',
    err_save: 'Erreur encaissement.',
    err_edit: 'Erreur modification.',
    err_delete: 'Erreur suppression.',
    err_scan: 'Erreur scanner.',
    ok_sale: 'Vente enregistrée.',
    ok_edit: 'Vente modifiée.',
    ok_delete: 'Vente supprimée.',
    warn_out_of_stock: (n) => `Le produit « ${n} » est en rupture de stock.`,
    warn_max_stock: (n) => `Stock max atteint pour « ${n} ».`,
    warn_no_product: 'Aucun produit trouvé.',
    switch_title: 'Changer de langue',
  },
  ar: {
    dir: 'rtl',
    locale: 'ar-u-nu-latn',
    currency: 'أوقية',
    eyebrow: 'فضاء المبيعات',
    title: 'إدارة المبيعات',
    subtitle: 'تابع معاملاتك، استلم المدفوعات وأدر فواتيرك.',
    add: 'بيع جديد',
    refresh: 'تحديث',
    stat_revenue: 'المبلغ الإجمالي',
    stat_revenue_sub: 'أوقية · كل المبيعات',
    stat_count: 'إجمالي المبيعات',
    stat_count_sub: 'المعاملات المسجلة',
    stat_month: 'مبيعات الشهر',
    stat_month_sub: (v) => `الإيرادات: ${v}`,
    stat_day: 'مبيعات اليوم',
    stat_day_sub: (v) => `الإيرادات: ${v}`,
    history: 'سجل المبيعات',
    history_sub: 'اطلع على الفواتير والمعاملات المسجلة.',
    search_ph: 'رقم الفاتورة أو اسم العميل...',
    all_status: 'كل الحالات',
    paid: 'مدفوعة',
    partial: 'جزئية / آجل',
    draft: 'مسودة',
    cancelled: 'ملغاة',
    start_date: 'تاريخ البداية',
    end_date: 'تاريخ النهاية',
    results: (n) => `${n} نتيجة`,
    loading: 'جارٍ تحميل المبيعات...',
    none_title: 'لا توجد مبيعات',
    none_sub: 'عدّل البحث أو أنشئ بيعًا جديدًا.',
    none_add: 'بيع جديد',
    th_index: '#',
    th_invoice: 'الفاتورة',
    th_customer: 'العميل',
    th_products: 'المنتج (المنتجات)',
    th_qty: 'الكمية',
    th_unit: 'سعر الوحدة',
    th_total: 'السعر الإجمالي',
    th_obs: 'ملاحظة',
    th_status: 'الحالة',
    th_date: 'التاريخ',
    th_actions: 'إجراءات',
    view: 'عرض التفاصيل',
    edit: 'تعديل',
    delete: 'حذف',
    print: 'طباعة',
    export: 'تصدير',
    cash: 'نقدًا',
    bankily: 'بنكيلي',
    masrivi: 'مصرفي',
    sedad: 'سداد',
    credit: 'آجل',
    card: 'بطاقة',
    walk_in: 'عميل نقدي',
    units: (n) => `${n} وحدة`,
    pos_title: 'نقطة البيع',
    pos_sub: 'اختر المنتجات ثم أكمل الدفع.',
    catalogue: 'كتالوج المنتجات',
    product_count: (n) => `${n} منتج`,
    product_search_ph: 'الاسم، المرجع أو الباركود...',
    scan: 'مسح',
    loading_products: 'جارٍ تحميل المنتجات...',
    out_of_stock: 'نفد',
    stock_label: (n) => `المخزون: ${n}`,
    no_category: 'غير مصنف',
    cart_title: 'السلة',
    cart_count: (n) => `${n} عنصر`,
    cart_empty: 'السلة فارغة',
    cart_empty_sub: 'انقر على منتج لإضافته.',
    per_unit: 'أوقية / وحدة',
    customer: 'العميل',
    customer_required: 'مطلوب للبيع بالآجل',
    discount: 'تخفيض',
    subtotal: 'المجموع الفرعي',
    total_to_pay: 'المجموع المستحق',
    payment_method: 'طريقة الدفع',
    amount_received: 'المبلغ المستلم',
    amount_placeholder: 'المبلغ المستلم',
    missing: (v) => `ينقص ${v}`,
    change: 'الباقي',
    credit_info: 'سيتم تسجيل البيع بالآجل. يجب اختيار عميل.',
    notes: 'ملاحظة (اختياري)',
    notes_ph: 'أضف ملاحظة لهذا البيع...',
    checkout: (v) => `تحصيل ${v}`,
    processing: 'جارٍ التسجيل...',
    clear_cart: 'تفريغ السلة',
    close: 'إغلاق',
    cancel: 'إلغاء',
    scanner_title: 'البحث بالباركود',
    scanner_label: 'باركود المنتج',
    scanner_ph: 'أدخل أو امسح الرمز...',
    scanner_hint: 'تسمح هذه النافذة بالإدخال اليدوي أو استخدام قارئ باركود.',
    add_to_cart: 'أضف إلى السلة',
    details_title: 'تفاصيل البيع',
    invoice: 'الفاتورة',
    date: 'التاريخ',
    sold_items: 'المنتجات المباعة',
    no_items: 'لا توجد تفاصيل لهذا البيع.',
    total_amount: 'المبلغ الإجمالي',
    edit_title: 'تعديل البيع',
    edit_articles: 'المنتجات',
    edit_qty: 'الكمية',
    edit_unit: 'سعر الوحدة',
    edit_total: 'الإجمالي',
    edit_status: 'حالة البيع',
    edit_notes: 'ملاحظة',
    edit_notes_ph: 'أضف أو عدّل ملاحظة...',
    save: 'حفظ',
    saving: 'جارٍ الحفظ...',
    delete_title: 'تأكيد الحذف',
    delete_q: 'حذف هذا البيع؟',
    delete_invoice: (n) => `الفاتورة ${n}`,
    delete_warn: 'تأكد أن واجهتك تتعامل مع استعادة المخزون عند الحذف.',
    delete_confirm: 'نعم، احذف',
    deleting: 'جارٍ الحذف...',
    success_invoice: 'تم تسجيل البيع بنجاح',
    facture: 'فاتورة',
    thanks: 'شكرًا لشرائك!',
    thanks_sub: 'نشكرك على ثقتك.',
    print_invoice: 'طباعة الفاتورة',
    new_sale: 'بيع جديد',
    err_load: 'تعذّر تحميل المبيعات.',
    err_empty: 'السلة فارغة.',
    err_invalid_amount: 'المبلغ غير صالح.',
    err_missing_cash: (v) => `ينقص ${v}`,
    err_credit_customer: 'اختر عميلًا للبيع بالآجل.',
    err_save: 'حدث خطأ أثناء التحصيل.',
    err_edit: 'حدث خطأ أثناء التعديل.',
    err_delete: 'حدث خطأ أثناء الحذف.',
    err_scan: 'خطأ في الماسح.',
    ok_sale: 'تم تسجيل البيع.',
    ok_edit: 'تم تعديل البيع.',
    ok_delete: 'تم حذف البيع.',
    warn_out_of_stock: (n) => `المنتج «${n}» نفد من المخزون.`,
    warn_max_stock: (n) => `الحد الأقصى للمخزون وصل للمنتج «${n}».`,
    warn_no_product: 'لم يتم العثور على منتج.',
    switch_title: 'تغيير اللغة',
  },
};



/* =========================================================
   UTILITAIRES
========================================================= */

const formatNumber = (value) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(Number(value) || 0);

const formatDate = (value, locale) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(locale, {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* =========================================================
   COMPOSANT
========================================================= */

const VentesPage = () => {
  const { lang } = useLanguage(); // langue globale (menu)
const t = I18N[lang];
const cur = t.currency;

  // Data
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [loadingSales, setLoadingSales] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [searchSale, setSearchSale] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [search, setSearch] = useState('');

  // POS form
  const [cart, setCart] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [discount, setDiscount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [notes, setNotes] = useState('');

  // Modals
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

  /* ---------- Chargements ---------- */
  const fetchSales = async () => {
    setLoadingSales(true);
    try {
      const response = await salesApi.getAll();
      const data = response?.data;
      setSales(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      console.error('Erreur ventes:', err);
      setSales([]);
      showError(t.err_load);
    } finally { setLoadingSales(false); }
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

  /* ---------- Helpers de statut ---------- */
  const getStatus = (status, paymentMethod) => {
    if (status === 'paid') {
      switch (paymentMethod) {
        case 'bankily': return { label: t.bankily, tone: 'violet', icon: 'fa-mobile-alt' };
        case 'masrivi': return { label: t.masrivi, tone: 'amber', icon: 'fa-mobile-alt' };
        case 'sedad': return { label: t.sedad, tone: 'green', icon: 'fa-mobile-alt' };
        case 'credit': return { label: t.credit, tone: 'amber', icon: 'fa-hand-holding-usd' };
        case 'card': return { label: t.card, tone: 'blue', icon: 'fa-credit-card' };
        case 'cash':
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

  /* ---------- Calculs panier ---------- */
  const subtotal = useMemo(() => cart.reduce((s, i) => s + Number(i.price) * Number(i.quantity || 0), 0), [cart]);
  const discountValue = Math.min(Math.max(Number(discount) || 0, 0), subtotal);
  const total = Math.max(subtotal - discountValue, 0);
  const received = Number(amountReceived) || 0;
  const change = paymentMethod === 'cash' ? Math.max(received - total, 0) : 0;
  const totalItemsCart = cart.reduce((s, i) => s + (Number(i.quantity) || 0), 0);

  /* ---------- Filtrage + statistiques ---------- */
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
    return {
      count: validSales.length,
      revenue: validSales.reduce((s, x) => s + Number(x.grand_total ?? x.total ?? 0), 0),
      dailySales, dailyRevenue, monthlySales, monthlyRevenue,
    };
  }, [sales]);

  const hasFilters = Boolean(searchSale || filterStatus !== 'all' || startDateFilter || endDateFilter);
  const resetFilters = () => { setSearchSale(''); setFilterStatus('all'); setStartDateFilter(''); setEndDateFilter(''); };

  /* ---------- Panier ---------- */
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
      return [...prev, {
        product_id: product.id, name: product.name, price,
        purchase_price: Number(product.purchase_price) || 0, quantity: 1, stock,
        barcode: product.barcode || '', category: product.categories?.name || t.no_category,
      }];
    });
    setError('');
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) => prev.map((item) => {
      if (String(item.product_id) !== String(productId)) return item;
      const qty = Math.max(1, Math.min(Number(item.stock), Number(item.quantity || 0) + delta));
      return { ...item, quantity: qty };
    }));
  };

  const handleManualQuantityChange = (productId, value) => {
    if (value === '') return setCart((prev) => prev.map((i) => String(i.product_id) === String(productId) ? { ...i, quantity: '' } : i));
    let q = parseInt(value, 10);
    if (Number.isNaN(q)) return;
    const item = cart.find((e) => String(e.product_id) === String(productId));
    if (!item) return;
    q = Math.max(1, Math.min(Number(item.stock), q));
    setCart((prev) => prev.map((e) => String(e.product_id) === String(productId) ? { ...e, quantity: q } : e));
  };

  const handleQuantityBlur = (productId) => {
    setCart((prev) => prev.map((item) => String(item.product_id) !== String(productId) ? item : { ...item, quantity: Math.max(1, Math.min(Number(item.stock), Number(item.quantity) || 1)) }));
  };

  const removeFromCart = (productId) => setCart((prev) => prev.filter((i) => String(i.product_id) !== String(productId)));
  const clearCart = () => { setCart([]); setDiscount(''); setAmountReceived(''); setCustomerId(''); setPaymentMethod('cash'); setSearch(''); setNotes(''); };

  /* ---------- Scan ---------- */
  const handleBarcodeSearch = async (code) => {
    const clean = String(code || '').trim();
    if (!clean) return;
    try {
      const response = await productsApi.getAll();
      const data = response?.data;
      const list = Array.isArray(data) ? data : data?.data || [];
      const product = list.find((p) => String(p.barcode || '').trim() === clean);
      if (!product) return showError(t.warn_no_product);
      addToCart(product);
      setSearch(''); setScannerCode(''); setShowScanner(false);
    } catch { showError(t.err_scan); }
  };

  const handleSearchKeyDown = (e) => { if (e.key === 'Enter') { e.preventDefault(); if (search.trim()) handleBarcodeSearch(search); } };

  /* ---------- Encaissement ---------- */
  const handleCheckout = async () => {
    if (cart.length === 0) return showError(t.err_empty);
    if (total <= 0) return showError(t.err_invalid_amount);
    if (paymentMethod === 'cash' && received < total) return showError(t.err_missing_cash(`${formatNumber(total - received)} ${cur}`));
    if (paymentMethod === 'credit' && !customerId) return showError(t.err_credit_customer);
    setProcessing(true);
    try {
      const payload = {
        invoice_number: `INV-${Date.now().toString().slice(-8)}`,
        customer_id: customerId || null,
        total: subtotal, discount: discountValue, grand_total: total,
        paid_amount: paymentMethod === 'credit' ? 0 : total,
        balance: paymentMethod === 'credit' ? total : 0,
        status: paymentMethod === 'credit' ? 'partial' : 'paid',
        payment_method: paymentMethod,
        amount_received: paymentMethod === 'cash' ? received : total,
        change_amount: paymentMethod === 'cash' ? change : 0,
        notes: notes.trim(),
        items: cart.map((i) => ({
          product_id: i.product_id, quantity: Number(i.quantity),
          unit_price: Number(i.price), price: Number(i.price),
          total: Number(i.price) * Number(i.quantity),
        })),
      };
      const response = await salesApi.checkout(payload);
      const saleData = response?.data || {};
      const invoiceItems = saleData.items || cart.map((i) => ({
        product_name: i.name, name: i.name, quantity: Number(i.quantity),
        price: Number(i.price), total: Number(i.price) * Number(i.quantity),
      }));
      const completed = {
        ...saleData, invoice_number: saleData.invoice_number || payload.invoice_number,
        customer_id: saleData.customer_id || customerId || null, items: invoiceItems,
        subtotal, discount: discountValue,
        grand_total: Number(saleData.grand_total ?? saleData.total ?? total),
        total: Number(saleData.grand_total ?? saleData.total ?? total),
        amount_received: payload.amount_received, change_amount: payload.change_amount,
        payment_method: paymentMethod, notes, created_at: saleData.created_at || new Date().toISOString(),
      };
      setLastSale(completed); setShowModal(false); setShowInvoice(true); clearCart();
      await Promise.all([fetchProducts(), fetchSales()]);
      showSuccess(t.ok_sale);
    } catch (err) {
      console.error(err);
      showError(err?.message || t.err_save);
    } finally { setProcessing(false); }
  };

  const handleNewSale = () => { setShowInvoice(false); setLastSale(null); clearCart(); setShowModal(true); fetchProducts(); fetchSales(); };

  /* ---------- Édition / suppression ---------- */
  const getSaleItems = (sale) => sale?.items || sale?.invoice_items || sale?.items_sale || [];

  const handleOpenEdit = (sale) => {
    setSaleToEdit(sale);
    setEditStatus(sale.status || 'paid');
    setEditNotes(sale.notes || '');
    setEditItems(getSaleItems(sale).map((item) => ({
      ...item,
      quantity: Number(item.quantity) || 1,
      price: Number(item.price ?? item.unit_price) || 0,
    })));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!saleToEdit) return;
    setActionLoading(true);
    try {
      const newTotal = editItems.reduce((s, i) => s + Number(i.quantity) * Number(i.price), 0);
      await salesApi.updateSale(saleToEdit.id, {
        status: editStatus, notes: editNotes, total: newTotal, grand_total: newTotal,
      });
      setSaleToEdit(null);
      await fetchSales();
      showSuccess(t.ok_edit);
    } catch (err) { console.error(err); showError(t.err_edit); }
    finally { setActionLoading(false); }
  };

  const handleDeleteConfirm = async () => {
    if (!saleToDelete) return;
    setActionLoading(true);
    try {
      await salesApi.deleteSale(saleToDelete.id, saleToDelete.invoice_items);
      setSaleToDelete(null);
      await Promise.all([fetchSales(), fetchProducts()]);
      showSuccess(t.ok_delete);
    } catch (err) { console.error(err); showError(t.err_delete); }
    finally { setActionLoading(false); }
  };

  /* ---------- Helpers d'affichage ---------- */
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

  /* ---------- Impression / export ---------- */
  const printInvoice = (saleToPrint = null) => {
    const sale = saleToPrint || lastSale;
    if (!sale) return;
    const items = getSaleItems(sale);
    const invoiceNumber = sale.invoice_number || `VENTE-${sale.id}`;
    const invoiceDate = sale.created_at || new Date();
    const customerName = getCustomerName(sale);
    const itemsHtml = items.map((item) => {
      const name = item.product_name || item.name || item.products?.name || 'Produit';
      const qty = Number(item.quantity) || 0;
      const price = Number(item.price ?? item.unit_price) || 0;
      const lineTotal = Number(item.total ?? price * qty);
      return `<tr><td>${escapeHtml(name)}</td><td class="center">${qty}</td><td class="right">${formatNumber(price)}</td><td class="right">${formatNumber(lineTotal)}</td></tr>`;
    }).join('');
    const subtotalInvoice = Number(sale.subtotal ?? sale.total ?? 0);
    const discountInvoice = Number(sale.discount ?? 0);
    const totalInvoice = Number(sale.grand_total ?? sale.total ?? 0);
    const payLabels = { cash: t.cash, bankily: t.bankily, masrivi: t.masrivi, sedad: t.sedad, credit: t.credit, card: t.card };
    const win = window.open('', '_blank', 'width=900,height=900');
    if (!win) return showError('Pop-up blocked.');
    win.document.write(`
      <!DOCTYPE html><html lang="${lang}" dir="${t.dir}"><head><meta charset="UTF-8"><title>${escapeHtml(invoiceNumber)}</title>
      <style>*{box-sizing:border-box}body{margin:0;padding:30px;color:#14213d;font-family:${lang === 'ar' ? "'Cairo', " : ''}Arial,sans-serif}.invoice{max-width:800px;margin:auto}.header{text-align:center;border-bottom:2px solid #14213d;padding-bottom:18px}.store{font-size:26px;font-weight:800}.muted{color:#66748b;line-height:1.7}h2{text-align:center;margin:24px 0}.meta{display:flex;justify-content:space-between;gap:15px;margin:25px 0}.meta>div{flex:1;overflow-wrap:anywhere}.label{display:block;font-size:11px;color:#66748b;margin-bottom:5px}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#e8efff;text-align:${t.dir === 'rtl' ? 'right' : 'left'}}th,td{padding:11px 9px;border-bottom:1px solid #e3e9f2}.center{text-align:center}.right{text-align:${t.dir === 'rtl' ? 'left' : 'right'}}.totals{width:330px;max-width:100%;margin:22px 0 0 auto}.total-row{display:flex;justify-content:space-between;padding:8px 0}.grand{border-top:2px solid #14213d;border-bottom:2px solid #14213d;font-size:19px;font-weight:800;padding:13px 0}.footer{margin-top:40px;border-top:1px solid #ddd;padding-top:18px;text-align:center;color:#66748b}.notes{margin-top:20px;padding:10px;background:#f7f9fd;border-${t.dir === 'rtl' ? 'right' : 'left'}:3px solid #1f5eea;font-size:13px}@media print{body{padding:0}}</style></head><body>
        <div class="invoice">
          <div class="header"><div class="store">${escapeHtml(STORE.name)}</div><div class="muted">${escapeHtml(STORE.address)}<br>${escapeHtml(STORE.phone)}</div></div>
          <h2>${t.facture}</h2>
          <div class="meta"><div><span class="label">N°</span><strong>${escapeHtml(invoiceNumber)}</strong></div><div><span class="label">${t.date.toUpperCase()}</span><strong>${escapeHtml(formatDate(invoiceDate, t.locale))}</strong></div><div><span class="label">${t.customer.toUpperCase()}</span><strong>${escapeHtml(customerName)}</strong></div></div>
          <table><thead><tr><th>${t.th_products}</th><th class="center">${t.edit_qty}</th><th class="right">${t.th_unit}</th><th class="right">${t.th_total}</th></tr></thead><tbody>${itemsHtml}</tbody></table>
          <div class="totals"><div class="total-row"><span>${t.subtotal}</span><strong>${formatNumber(subtotalInvoice)} ${cur}</strong></div><div class="total-row"><span>${t.discount}</span><strong>- ${formatNumber(discountInvoice)} ${cur}</strong></div><div class="total-row grand"><span>${t.total_to_pay}</span><span>${formatNumber(totalInvoice)} ${cur}</span></div><div class="total-row"><span>${t.payment_method}</span><strong>${escapeHtml(payLabels[sale.payment_method] || t.cash)}</strong></div>${sale.payment_method === 'cash' ? `<div class="total-row"><span>${t.amount_received}</span><strong>${formatNumber(sale.amount_received)} ${cur}</strong></div><div class="total-row"><span>${t.change}</span><strong>${formatNumber(sale.change_amount)} ${cur}</strong></div>` : ''}</div>
          ${sale.notes ? `<div class="notes"><strong>${t.edit_notes}:</strong> ${escapeHtml(sale.notes)}</div>` : ''}
          <div class="footer">${t.thanks}<br>${t.thanks_sub}</div>
        </div>
      </body></html>
    `);
    win.document.close(); win.focus();
    win.onload = () => win.print();
  };

  const exportSale = (sale) => {
    const items = getSaleItems(sale);
    const rows = [
      [t.th_invoice, sale.invoice_number || sale.id],
      [t.th_date, formatDate(sale.created_at, t.locale)],
      [t.th_customer, getCustomerName(sale)],
      [t.th_status, getStatus(sale.status, sale.payment_method).label],
      [t.th_obs, sale.notes || '—'], [],
      [t.th_products, t.edit_qty, t.th_unit, t.th_total],
      ...items.map((i) => [i.product_name || i.name || 'Produit', i.quantity || 0, i.price || 0, i.total ?? Number(i.quantity || 0) * Number(i.price || 0)]),
      [], [t.total_amount, '', '', Number((sale.grand_total ?? sale.total) || 0)],
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `Vente_${sale.invoice_number || sale.id}.csv`;
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  };

  const closeSaleModal = () => { if (processing) return; setShowModal(false); };

  /* =======================================================
     AFFICHAGE
  ======================================================= */

  return (
    <div className="expenses-page" dir={t.dir} lang={lang}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
        .expenses-page {
          --ink:#14213d;--muted:#66748b;--line:#e3e9f2;--bg:#f2f5fb;--card:#fff;
          --primary:#1f5eea;--primary-soft:#e8efff;
          --green:#0f9d74;--green-soft:#def7ee;
          --violet:#6a4de0;--violet-soft:#ece8fd;
          --amber:#e08a0b;--amber-soft:#fff0d6;
          --red:#d63c4a;--red-soft:#fde8ea;
          --teal:#0e8fa8;--teal-soft:#dcf3f8;
          --rose:#c2417c;--rose-soft:#fbe6f0;
          min-height:100vh;padding:clamp(14px,2.2vw,28px);
          background:radial-gradient(1000px 340px at 100% -80px,rgba(31,94,234,.08),transparent 70%),var(--bg);
          color:var(--ink);font-family:Inter,'Segoe UI',system-ui,Tahoma,Arial,sans-serif;
        }
        .expenses-page[lang="ar"]{font-family:Cairo,'Noto Sans Arabic',Tahoma,'Segoe UI',Arial,sans-serif}
        .expenses-page *{box-sizing:border-box}
        .expenses-page button:focus-visible,.expenses-page input:focus-visible,.expenses-page select:focus-visible,.expenses-page textarea:focus-visible{outline:3px solid rgba(31,94,234,.35);outline-offset:2px}
        .ep-amt{direction:ltr;unicode-bidi:isolate;font-variant-numeric:tabular-nums}
        .ep-hero{position:relative;isolation:isolate;overflow:hidden;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:18px;padding:clamp(20px,3vw,30px);margin-bottom:20px;border-radius:20px;color:#fff;background:linear-gradient(125deg,#0f2f66 0%,#1b55c9 58%,#2aa3d9 100%);box-shadow:0 14px 32px rgba(21,74,170,.2)}
        .ep-hero::after{content:"";position:absolute;z-index:-1;width:250px;height:250px;inset-inline-end:-70px;top:-115px;border:32px solid rgba(255,255,255,.09);border-radius:50%}
        .ep-eyebrow{font-size:21px;font-weight:800;letter-spacing:1.8px;opacity:.78}
        .ep-title h1{margin:6px 0 4px;font-size:clamp(22px,2.8vw,30px);font-weight:800;display:flex;align-items:center;gap:12px;line-height:1.25}
        .ep-title-icon{display:inline-grid;place-items:center;width:42px;height:42px;border-radius:12px;background:rgba(255,255,255,.16);font-size:18px}
        .ep-title p{margin:0;color:rgba(255,255,255,.82);font-size:21px}
        .ep-hero-actions{display:flex;align-items:center;flex-wrap:wrap;gap:10px}
        .ep-lang{display:inline-flex;padding:3px;border-radius:11px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.25)}
        .ep-lang button{border:0;padding:7px 12px;border-radius:8px;background:transparent;color:#fff;font:inherit;font-size:12px;font-weight:800;cursor:pointer}
        .ep-lang button.on{background:#fff;color:#153f92}
        .ep-btn-add{display:inline-flex;align-items:center;gap:8px;padding:11px 18px;border:0;border-radius:11px;background:#fff;color:#174078;font:inherit;font-weight:800;font-size:13px;cursor:pointer;box-shadow:0 6px 16px rgba(0,0,0,.14);transition:.18s}
        .ep-btn-add:hover{transform:translateY(-2px)}
        .ep-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-bottom:20px}
        .ep-card{position:relative;overflow:hidden;display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:20px;background:var(--card);border:1px solid var(--line);border-inline-start:4px solid var(--accent);border-radius:16px;box-shadow:0 4px 14px rgba(20,33,61,.04);transition:transform .2s,box-shadow .2s}
        .ep-card:hover{transform:translateY(-2px);box-shadow:0 12px 24px rgba(20,33,61,.08)}
        .ep-card::after{content:"";position:absolute;inset-inline-end:-30px;bottom:-42px;width:105px;height:105px;border-radius:50%;background:var(--accent-soft);opacity:.7}
        .ep-card-info{position:relative;z-index:1;min-width:0}
        .ep-card-info h3{margin:0 0 9px;font-size:20px;color:var(--muted);font-weight:800}
        .ep-card-info .value{font-size:clamp(20px,2vw,26px);font-weight:800;letter-spacing:-.3px;color:var(--ink);overflow-wrap:anywhere}
        .ep-card-info .sub{margin-top:5px;font-size:20px;color:var(--accent);font-weight:700}
        .ep-icon{position:relative;z-index:1;flex:0 0 44px;width:44px;height:44px;border-radius:13px;display:grid;place-items:center;font-size:21px;background:var(--accent-soft);color:var(--accent)}
        .tone-blue{--accent:var(--primary);--accent-soft:var(--primary-soft)}
        .tone-amber{--accent:var(--amber);--accent-soft:var(--amber-soft)}
        .tone-violet{--accent:var(--violet);--accent-soft:var(--violet-soft)}
        .tone-green{--accent:var(--green);--accent-soft:var(--green-soft)}
        .tone-rose{--accent:var(--rose);--accent-soft:var(--rose-soft)}
        .ep-panel{background:var(--card);border-radius:16px;border:1px solid var(--line);overflow:hidden;box-shadow:0 4px 14px rgba(20,33,61,.035);margin-bottom:20px}
        .ep-panel-head{padding:16px 20px;border-bottom:1px solid var(--line);background:#fbfcff;display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px}
        .ep-panel-head h5{margin:0 0 4px;font-size:21px;font-weight:800}
        .ep-panel-head p{margin:0;font-size:20px;color:var(--muted)}
        .ep-filters{display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr auto;gap:10px;align-items:end;padding:15px 20px;background:#fbfcff;border-bottom:1px solid var(--line)}
        .ep-fg{display:flex;flex-direction:column;gap:5px;min-width:0}
        .ep-fg label{font-size:20px;font-weight:800;color:#4b5b75;text-transform:uppercase;letter-spacing:.4px}
        .ep-filter-input{width:100%;height:40px;border:1px solid #d9e1ed;border-radius:9px;padding:0 12px;font:inherit;font-size:20px;color:#2a3a55;background:#fff;outline:none}
        .ep-filter-input:focus{border-color:var(--primary);box-shadow:0 0 0 3px var(--primary-soft)}
        .ep-reset{height:40px;padding:0 13px;border:1px solid var(--line);border-radius:9px;background:#fff;color:#4b5b75;font:inherit;font-size:20px;font-weight:800;cursor:pointer;white-space:nowrap}
        .ep-reset:hover{background:#f1f5fb}
        .ep-table-wrap{overflow-x:auto}
        .ep-table{width:100%;min-width:1080px;border-collapse:collapse}
        .ep-table th{background:#f3f6fc;color:#5b6b85;text-align:start;padding:14px 16px;font-size:21px;font-weight:800;letter-spacing:.4px;border-bottom:1px solid var(--line);white-space:nowrap}
        .ep-table td{padding:13px 16px;border-bottom:1px solid #f0f3f8;font-size:21px;color:#44546d;vertical-align:middle}
        .ep-table tbody tr:nth-child(even) td{background:#fafbfe}
        .ep-table tbody tr:hover td{background:#eff4ff}
        .ep-table tr:last-child td{border-bottom:0}
        .ep-col-end{text-align:end!important}
        .ep-col-center{text-align:center!important}
        .ep-state{padding:40px 18px!important;text-align:center;color:#8896ab!important}
        .ep-spinner{display:inline-block;width:22px;height:22px;margin-inline-end:10px;vertical-align:middle;border:3px solid #dbeafe;border-top-color:var(--primary);border-radius:50%;animation:ep-spin .75s linear infinite}
        @keyframes ep-spin{to{transform:rotate(360deg)}}
        @media (prefers-reduced-motion:reduce){.ep-spinner{animation-duration:2s}.ep-card,.ep-btn-add{transition:none}}
        .ep-customer-cell{display:flex;align-items:center;gap:10px;min-width:150px}
        .ep-avatar{flex:0 0 34px;width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:var(--primary-soft);color:var(--primary);font-size:13px}
        .ep-customer-name{max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700;color:#2a3a55}
        .ep-subtext{display:block;margin-top:3px;font-size:20px;color:var(--muted)}
        .ep-ref{color:var(--primary);font-weight:800}
        .ep-badge{display:inline-block;padding:5px 11px;border-radius:999px;font-size:21px;font-weight:800;white-space:nowrap}
        .badge-blue{background:var(--primary-soft);color:#164aba}
        .badge-violet{background:var(--violet-soft);color:#4a32b0}
        .badge-green{background:var(--green-soft);color:#0b6a4e}
        .badge-amber{background:var(--amber-soft);color:#94590a}
        .badge-rose{background:var(--rose-soft);color:#9c2a62}
        .badge-teal{background:var(--teal-soft);color:#0a6577}
        .badge-gray{background:#eef2f8;color:#4b5b75}
        .ep-money{font-weight:800;color:var(--ink);white-space:nowrap}
        .ep-money-total{color:#0b6a4e}
        .ep-actions{display:flex;gap:6px;justify-content:flex-end}
        .btn-icon{width:32px;height:32px;border-radius:8px;border:1px solid transparent;display:grid;place-items:center;cursor:pointer;transition:.18s;background:transparent;color:#64748b;font-size:12px}
        .btn-icon:hover{background:#eef2f8}
        .btn-view{background:var(--primary-soft);color:var(--primary);border-color:#c9daff}
        .btn-view:hover{background:var(--primary);color:#fff}
        .btn-edit{background:var(--amber-soft);color:var(--amber);border-color:#f5dcb0}
        .btn-edit:hover{background:var(--amber);color:#fff}
        .btn-delete{background:var(--red-soft);color:var(--red);border-color:#f6c8cd}
        .btn-delete:hover{background:var(--red);color:#fff}

        /* Modales */
        .ep-modal-overlay{position:fixed;inset:0;z-index:1050;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(15,23,42,.58);backdrop-filter:blur(4px)}
        .ep-modal{width:100%;max-width:1080px;max-height:calc(100vh - 40px);overflow:auto;background:#fff;border-radius:18px;box-shadow:0 25px 50px rgba(0,0,0,.22)}
        .ep-modal.small{max-width:440px}
        .ep-modal.medium{max-width:720px}
        .ep-modal-header{display:flex;justify-content:space-between;align-items:center;padding:18px 22px;border-bottom:1px solid var(--line);background:linear-gradient(180deg,#fbfcff,#fff);gap:12px}
        .ep-modal-header h3{margin:0;font-size:20px;font-weight:800;display:flex;align-items:center;gap:10px}
        .ep-modal-header p{margin:4px 0 0;font-size:18px;color:var(--muted)}
        .ep-modal-icon{display:inline-grid;place-items:center;width:34px;height:34px;border-radius:10px;background:var(--primary-soft);color:var(--primary);font-size:14px}
        .ep-modal-icon.success{background:var(--green-soft);color:var(--green)}
        .ep-modal-icon.danger{background:var(--red-soft);color:var(--red)}
        .ep-modal-icon.amber{background:var(--amber-soft);color:var(--amber)}
        .ep-modal-body{padding:22px}
        .ep-modal-footer{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:10px;padding:15px 22px;background:#f7f9fd;border-top:1px solid var(--line)}
        .ep-modal-footer.center{justify-content:center}
        .ep-form-group{margin-bottom:15px}
        .ep-form-group label{display:block;margin-bottom:6px;font-size:18px;font-weight:800;color:#4b5b75}
        .ep-form-group input,.ep-form-group select,.ep-form-group textarea{width:100%;border:1px solid #d9e1ed;border-radius:9px;padding:10px 12px;font:inherit;font-size:14px;color:#2a3a55;background:#fbfcfe;outline:none}
        .ep-form-group input:focus,.ep-form-group select:focus,.ep-form-group textarea:focus{border-color:var(--primary);box-shadow:0 0 0 3px var(--primary-soft);background:#fff}
        .ep-btn{padding:10px 20px;border-radius:10px;border:0;font:inherit;font-size:18px;font-weight:800;cursor:pointer;transition:.18s}
        .ep-btn:hover:not(:disabled){filter:brightness(.96);transform:translateY(-1px)}
        .ep-btn:disabled{opacity:.6;cursor:not-allowed}
        .ep-btn-cancel{background:#e6ebf3;color:#44546d}
        .ep-btn-save{background:linear-gradient(135deg,#1f5eea,#2f7bf0);color:#fff}
        .ep-btn-danger{background:var(--red);color:#fff}
        .ep-btn-outline{background:#fff;color:#4b5b75;border:1px solid var(--line)}
        .ep-alert{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px;padding:13px 16px;border-radius:11px;font-size:13px}
        .ep-alert.danger{border:1px solid #f6c8cd;background:var(--red-soft);color:#a3212e}
        .ep-alert.success{border:1px solid #bfe8d9;background:var(--green-soft);color:#0b6a4e}
        .ep-alert button{border:0;padding:7px 12px;border-radius:8px;background:#fff;font:inherit;font-size:20px;font-weight:800;cursor:pointer;color:inherit}

        /* POS */
        .pos-grid{display:grid;grid-template-columns:1.4fr 1fr;gap:20px}
        @media (max-width:900px){.pos-grid{grid-template-columns:1fr}}
        .pos-products{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;max-height:420px;overflow-y:auto;padding:4px}
        @media (max-width:720px){.pos-products{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media (max-width:420px){.pos-products{grid-template-columns:1fr}}
        .pos-product{position:relative;min-width:0;padding:12px;border:1px solid #e3eaf4;border-radius:12px;background:#fff;cursor:pointer;text-align:start;transition:border .18s,box-shadow .18s,transform .18s}
        .pos-product:hover:not(:disabled){border-color:#93c5fd;box-shadow:0 5px 15px rgba(31,94,234,.09);transform:translateY(-2px)}
        .pos-product.in-cart{border-color:#60a5fa;background:#f0f7ff}
        .pos-product:disabled{opacity:.55;cursor:not-allowed}
        .pos-product-avatar{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;background:var(--primary-soft);color:var(--primary);font-size:12px}
        .pos-product-name{display:block;font-weight:800;font-size:18px;margin:8px 0 3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .pos-product-cat{color:var(--muted);font-size:18px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .pos-product-bottom{display:flex;justify-content:space-between;align-items:center;gap:5px;margin-top:10px;font-size:19px}
        .pos-product-price{color:var(--primary);font-weight:800}
        .pos-product-stock{border-radius:5px;padding:2px 6px;font-size:18px;font-weight:800;background:var(--green-soft);color:#0b6a4e}
        .pos-product-stock.low{background:var(--red-soft);color:#a3212e}

        .pos-cart{border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;background:#fff}
        .pos-cart-header{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:800;font-size:13px}
        .pos-cart-list{list-style:none;padding:0;margin:0;max-height:280px;overflow-y:auto}
        .pos-cart-item{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 13px;border-bottom:1px solid #edf1f7}
        .pos-cart-item:last-child{border-bottom:0}
        .pos-cart-name{font-size:18px;font-weight:800;color:#2a3a55}
        .pos-cart-detail{color:var(--muted);font-size:18px;margin-top:3px}
        .pos-qty{display:flex;align-items:center;gap:4px}
        .pos-qty button{width:26px;height:26px;border:1px solid #dbe4f0;background:#fff;border-radius:6px;color:var(--primary);font-weight:800;cursor:pointer}
        .pos-qty button:hover{background:var(--primary-soft)}
        .pos-qty input{width:44px;height:27px;padding:2px;text-align:center;border:1px solid #dbe4f0;border-radius:6px;font-size:20px}
        .pos-cart-line{font-size:18px;font-weight:800;text-align:end;white-space:nowrap}
        .pos-cart-remove{border:0;color:var(--red);background:transparent;padding:4px;cursor:pointer}
        .pos-cart-footer{padding:14px;border-top:1px solid #e2e8f0}

        .pos-totals{padding:12px;border-radius:10px;background:#f8fafc;margin:12px 0}
        .pos-total-row{display:flex;justify-content:space-between;gap:10px;padding:4px 0;font-size:18px}
        .pos-grand-total{border-top:1px dashed #cbd5e1;margin-top:6px;padding-top:10px;font-size:20px;font-weight:900}
        .pos-payments{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
        @media (max-width:420px){.pos-payments{grid-template-columns:repeat(2,1fr)}}
        .pos-payment-btn{padding:8px 4px;border:1px solid #dbe4f0;border-radius:9px;background:#fff;font-size:18px;font-weight:700;cursor:pointer;transition:.15s}
        .pos-payment-btn:hover{border-color:var(--primary)}
        .pos-payment-btn.active{border-color:var(--primary);color:var(--primary);background:var(--primary-soft);box-shadow:inset 0 0 0 1px var(--primary)}
        .pos-checkout{width:100%;padding:13px;margin-top:12px;border-radius:10px;font-weight:800}

        .ep-detail-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px}
        @media (max-width:720px){.ep-detail-grid{grid-template-columns:1fr}}
        .ep-detail-item{padding:12px;border:1px solid var(--line);border-radius:10px;background:#fbfcff;overflow-wrap:anywhere}
        .ep-detail-item span{display:block;font-size:20px;color:var(--muted);margin-bottom:5px;font-weight:700}
        .ep-detail-item strong{font-size:20px;color:#2a3a55}
        .ep-section-title{display:flex;align-items:center;gap:9px;margin:18px 0 12px;font-size:18px;font-weight:800;color:#2a3a55}
        .ep-section-num{display:grid;place-items:center;width:24px;height:24px;border-radius:7px;background:var(--primary-soft);color:var(--primary);font-size:11px;font-weight:800}
        .ep-items-table{width:100%;border-collapse:collapse;border:1px solid var(--line);border-radius:10px;overflow:hidden}
        .ep-items-table th{background:#f3f6fc;color:#5b6b85;text-align:start;padding:10px 12px;font-size:19px;font-weight:800;letter-spacing:.3px;text-transform:uppercase;border-bottom:1px solid var(--line)}
        .ep-items-table td{padding:10px 12px;font-size:20px;border-bottom:1px solid #f0f3f8}
        .ep-items-table tr:last-child td{border-bottom:0}

        .ep-delete-body{padding:28px 22px 10px;text-align:center}
        .ep-delete-icon{display:inline-grid;place-items:center;width:58px;height:58px;margin-bottom:14px;border-radius:50%;background:var(--red-soft);color:var(--red);font-size:24px}
        .ep-delete-body h4{margin:0 0 6px;font-size:22px;font-weight:800}
        .ep-delete-body p{margin:0 0 10px;color:var(--muted);font-size:18px}
        .ep-delete-name{background:#f7f9fd;border-radius:9px;padding:10px 14px;font-weight:800;margin:10px 0}

        .ep-toast{position:fixed;z-index:1100;top:20px;inset-inline-end:20px;width:min(420px,calc(100% - 40px));display:flex;align-items:flex-start;gap:12px;padding:14px 16px;border-radius:12px;background:#fff;box-shadow:0 12px 30px rgba(20,40,70,.15);border-inline-start:4px solid var(--primary);font-size:18px}
        .ep-toast.success{border-inline-start-color:var(--green);color:#0b6a4e}
        .ep-toast.danger{border-inline-start-color:var(--red);color:#a3212e}

        @media (max-width:1100px){.ep-filters{grid-template-columns:1fr 1fr}.ep-filters .ep-fg-search{grid-column:1/-1}}
        @media (max-width:900px){.ep-stats{grid-template-columns:repeat(2,1fr)}}
        @media (max-width:560px){
          .expenses-page{padding:12px}
          .ep-filters{grid-template-columns:1fr;padding:14px}
          .ep-hero-actions{width:100%}.ep-btn-add{flex:1;justify-content:center}
          .ep-stats{grid-template-columns:1fr}
          .ep-modal-footer .ep-btn{flex:1}
          .ep-modal-footer.center{flex-direction:column-reverse}
        }
      `}</style>

      {/* Toast global */}
      {error && (
        <div className="ep-toast danger" role="alert">
          <span>⚠️</span><div style={{ flex: 1 }}>{error}</div>
          <button type="button" className="btn-icon" onClick={() => setError('')} aria-label={t.close}><i className="fas fa-times" /></button>
        </div>
      )}
      {success && (
        <div className="ep-toast success" role="status">
          <span>✓</span><div style={{ flex: 1 }}>{success}</div>
          <button type="button" className="btn-icon" onClick={() => setSuccess('')} aria-label={t.close}><i className="fas fa-times" /></button>
        </div>
      )}

      {/* Hero */}
      <header className="ep-hero">
        <div className="ep-title">
          <span className="ep-eyebrow"><i className="fas fa-chart-line" style={{ marginInlineEnd: 6 }} />{t.eyebrow}</span>
          <h1>
            <span className="ep-title-icon"><i className="fas fa-cash-register" /></span>
            {t.title}
          </h1>
          <p>{t.subtitle}</p>
        </div>
        <div className="ep-hero-actions">
          
          <button type="button" className="ep-btn-add" onClick={() => { clearCart(); setShowModal(true); }}>
            <i className="fas fa-plus" /> {t.add}
          </button>
        </div>
      </header>

      {/* Statistiques */}
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
            <div className="value">{stats.monthlySales}</div>
            <div className="sub">{t.stat_month_sub(`${formatNumber(stats.monthlyRevenue)} ${cur}`)}</div>
          </div>
          <div className="ep-icon"><i className="fas fa-calendar-alt" /></div>
        </div>
        <div className="ep-card tone-amber">
          <div className="ep-card-info">
            <h3>{t.stat_day}</h3>
            <div className="value">{stats.dailySales}</div>
            <div className="sub">{t.stat_day_sub(`${formatNumber(stats.dailyRevenue)} ${cur}`)}</div>
          </div>
          <div className="ep-icon"><i className="fas fa-calendar-day" /></div>
        </div>
      </section>

      {/* Historique */}
      <div className="ep-panel">
        <div className="ep-panel-head">
          <div>
            <h5><i className="fas fa-list-alt" style={{ color: 'var(--primary)', marginInlineEnd: 8 }} />{t.history}</h5>
            <p>{t.history_sub}</p>
          </div>
          <button type="button" className="ep-btn ep-btn-outline" onClick={() => { fetchSales(); fetchProducts(); }} disabled={loadingSales}>
            <i className={`fas fa-sync-alt ${loadingSales ? 'fa-spin' : ''}`} style={{ marginInlineEnd: 6 }} />{t.refresh}
          </button>
        </div>

        <div className="ep-filters">
          <div className="ep-fg ep-fg-search">
            <label>{t.th_invoice}</label>
            <input type="search" className="ep-filter-input" placeholder={t.search_ph} value={searchSale} onChange={(e) => setSearchSale(e.target.value)} />
          </div>
          <div className="ep-fg">
            <label>{t.th_status}</label>
            <select className="ep-filter-input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">{t.all_status}</option>
              <option value="paid">{t.paid}</option>
              <option value="partial">{t.partial}</option>
              <option value="draft">{t.draft}</option>
              <option value="cancelled">{t.cancelled}</option>
            </select>
          </div>
          <div className="ep-fg">
            <label>{t.start_date}</label>
            <input type="date" className="ep-filter-input" value={startDateFilter} onChange={(e) => setStartDateFilter(e.target.value)} />
          </div>
          <div className="ep-fg">
            <label>{t.end_date}</label>
            <input type="date" className="ep-filter-input" value={endDateFilter} onChange={(e) => setEndDateFilter(e.target.value)} />
          </div>
          <div>
            {hasFilters && (
              <button type="button" className="ep-reset" onClick={resetFilters}>
                <i className="fas fa-rotate-left" /> {t.cancel}
              </button>
            )}
          </div>
        </div>

        <div className="ep-table-wrap">
          <table className="ep-table">
            <thead>
              <tr>
                <th>{t.th_index}</th>
                <th>{t.th_invoice}</th>
                <th>{t.th_customer}</th>
                <th>{t.th_products}</th>
                <th className="ep-col-center">{t.th_qty}</th>
                <th className="ep-col-end">{t.th_unit}</th>
                <th className="ep-col-end">{t.th_total}</th>
                <th>{t.th_obs}</th>
                <th>{t.th_status}</th>
                <th>{t.th_date}</th>
                <th className="ep-col-end">{t.th_actions}</th>
              </tr>
            </thead>
            <tbody>
              {loadingSales ? (
                <tr><td colSpan="11" className="ep-state"><span className="ep-spinner" />{t.loading}</td></tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="11" className="ep-state">
                    <div style={{ width: 56, height: 56, fontSize: 22, margin: '0 auto 12px', borderRadius: 16, display: 'grid', placeItems: 'center', background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                      <i className="fas fa-file-invoice" />
                    </div>
                    <div style={{ fontWeight: 800, color: '#2a3a55', fontSize: 15 }}>{t.none_title}</div>
                    <div style={{ marginTop: 4, fontSize: 12 }}>{t.none_sub}</div>
                    <button type="button" className="ep-btn ep-btn-save" style={{ marginTop: 14 }} onClick={() => { clearCart(); setShowModal(true); }}>
                      <i className="fas fa-plus" style={{ marginInlineEnd: 6 }} />{t.none_add}
                    </button>
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale, index) => {
                  const status = getStatus(sale.status, sale.payment_method);
                  const customerName = sale.customers?.name || sale.customer?.name || t.walk_in;
                  const totalQty = getTotalQuantity(sale);
                  const unitPrice = getAverageUnitPrice(sale);
                  const productNames = getProductNames(sale);
                  return (
                    <tr key={sale.id}>
                      <td style={{ color: '#8896ab' }}>{index + 1}</td>
                      <td><span className="ep-ref">{sale.invoice_number || `VENTE-${sale.id}`}</span></td>
                      <td>
                        <div className="ep-customer-cell">
                          <div className="ep-avatar"><i className="fas fa-user" /></div>
                          <div className="ep-customer-name">{customerName}</div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--muted)' }}>
                        <span style={{ display: 'inline-block', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={productNames}>{productNames}</span>
                      </td>
                      <td className="ep-col-center"><span className="ep-badge badge-gray">{t.units(totalQty)}</span></td>
                      <td className="ep-col-end ep-money">{formatNumber(unitPrice)} {cur}</td>
                      <td className="ep-col-end ep-money ep-money-total">{formatNumber(sale.grand_total ?? sale.total)} {cur}</td>
                      <td>
                        {sale.notes ? (
                          <span className="ep-badge badge-gray" style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block' }} title={sale.notes}>{sale.notes}</span>
                        ) : (
                          <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td><span className={`ep-badge badge-${status.tone}`}><i className={`fas ${status.icon}`} style={{ marginInlineEnd: 5 }} />{status.label}</span></td>
                      <td style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }}>{formatDate(sale.created_at, t.locale)}</td>
                      <td className="ep-col-end">
                        <div className="ep-actions">
                          <button type="button" className="btn-icon btn-view" title={t.view} onClick={() => setSelectedSale(sale)}>
                            <i className="fas fa-eye" />
                          </button>
                          <button type="button" className="btn-icon btn-edit" title={t.edit} onClick={() => handleOpenEdit(sale)}>
                            <i className="fas fa-edit" />
                          </button>
                          <button type="button" className="btn-icon btn-delete" title={t.delete} onClick={() => setSaleToDelete(sale)}>
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

      {/* Modal POS (nouvelle vente) */}
      {showModal && (
        <div className="ep-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && closeSaleModal()}>
          <div className="ep-modal" role="dialog" aria-modal="true">
            <div className="ep-modal-header">
              <div>
                <h3>
                  <span className="ep-modal-icon"><i className="fas fa-cash-register" /></span>
                  {t.pos_title}
                </h3>
                <p>{t.pos_sub}</p>
              </div>
              <button type="button" className="btn-icon" onClick={closeSaleModal} disabled={processing} aria-label={t.close}>
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="ep-modal-body">
              <div className="pos-grid">
                {/* Catalogue */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <strong style={{ fontSize: 18 }}><i className="fas fa-boxes" style={{ color: 'var(--primary)', marginInlineEnd: 6 }} />{t.catalogue}</strong>
                    <span className="ep-badge badge-gray">{t.product_count(products.length)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 0, marginBottom: 12 }}>
                    <input
                      type="search"
                      className="ep-filter-input"
                      style={{ borderStartEndRadius: 0, borderEndEndRadius: 0, borderInlineEnd: 0 }}
                      placeholder={t.product_search_ph}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      autoFocus
                    />
                    <button type="button" className="ep-btn ep-btn-save" style={{ borderStartStartRadius: 0, borderEndStartRadius: 0, padding: '0 14px' }} onClick={() => setShowScanner(true)}>
                      <i className="fas fa-barcode" />
                    </button>
                  </div>
                  {loadingProducts ? (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
                      <span className="ep-spinner" />{t.loading_products}
                    </div>
                  ) : (
                    <div className="pos-products">
                      {products
                        .filter((p) => {
                          const q = search.toLowerCase().trim();
                          return !q || String(p.name || '').toLowerCase().includes(q) || String(p.barcode || '').toLowerCase().includes(q) || String(p.reference || '').toLowerCase().includes(q);
                        })
                        .map((product) => {
                          const stock = Number(product.quantity) || 0;
                          const out = stock <= 0;
                          const inCart = cart.find((i) => String(i.product_id) === String(product.id));
                          return (
                            <button type="button" key={product.id} className={`pos-product ${inCart ? 'in-cart' : ''}`} disabled={out} onClick={() => addToCart(product)}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="pos-product-avatar"><i className="fas fa-box" /></span>
                                {inCart && <span className="ep-badge badge-blue">×{inCart.quantity}</span>}
                                {out && <span className="ep-badge badge-rose">{t.out_of_stock}</span>}
                              </div>
                              <span className="pos-product-name" title={product.name}>{product.name}</span>
                              <span className="pos-product-cat">{product.categories?.name || t.no_category}</span>
                              <div className="pos-product-bottom">
                                <span className="pos-product-price">{formatNumber(product.sale_price)} {cur}</span>
                                <span className={`pos-product-stock ${out ? 'low' : ''}`}>{t.stock_label(stock)}</span>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* Panier */}
                <div>
                  <div className="pos-cart">
                    <div className="pos-cart-header">
                      <span><i className="fas fa-shopping-cart" style={{ color: 'var(--primary)', marginInlineEnd: 6 }} />{t.cart_title}</span>
                      <span className="ep-badge badge-blue">{t.cart_count(totalItemsCart)}</span>
                    </div>
                    {cart.length === 0 ? (
                      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted)' }}>
                        <div style={{ width: 56, height: 56, margin: '0 auto 12px', borderRadius: 16, display: 'grid', placeItems: 'center', background: 'var(--primary-soft)', color: 'var(--primary)', fontSize: 22 }}>
                          <i className="fas fa-cart-plus" />
                        </div>
                        <div style={{ fontWeight: 800, color: '#2a3a55', fontSize: 14 }}>{t.cart_empty}</div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>{t.cart_empty_sub}</div>
                      </div>
                    ) : (
                      <ul className="pos-cart-list">
                        {cart.map((item) => (
                          <li className="pos-cart-item" key={item.product_id}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="pos-cart-name">{item.name}</div>
                              <div className="pos-cart-detail">{formatNumber(item.price)} {cur} / {t.units(1).split(' ')[1]}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div className="pos-qty">
                                <button type="button" onClick={() => updateQuantity(item.product_id, -1)} aria-label="-">−</button>
                                <input
                                  type="number" min="1" max={item.stock} value={item.quantity}
                                  onChange={(e) => handleManualQuantityChange(item.product_id, e.target.value)}
                                  onBlur={() => handleQuantityBlur(item.product_id)}
                                />
                                <button type="button" onClick={() => updateQuantity(item.product_id, 1)} aria-label="+">+</button>
                              </div>
                              <div className="pos-cart-line">{formatNumber(Number(item.price) * Number(item.quantity || 0))} {cur}</div>
                              <button type="button" className="pos-cart-remove" onClick={() => removeFromCart(item.product_id)} title={t.delete}>
                                <i className="fas fa-times" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}

                    {cart.length > 0 && (
                      <div className="pos-cart-footer">
                        <div className="ep-form-group" style={{ marginBottom: 10 }}>
                          <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{t.customer}</span>
                            <small style={{ fontWeight: 400, color: 'var(--muted)' }}>{t.customer_required}</small>
                          </label>
                          <select className="ep-filter-input" style={{ height: 'auto', padding: '10px 12px' }} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                            <option value="">{t.walk_in}</option>
                            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>

                        <div className="ep-form-group" style={{ marginBottom: 10 }}>
                          <label>{t.discount}</label>
                          <input type="number" min="0" max={subtotal} className="ep-filter-input" style={{ height: 'auto', padding: '10px 12px' }} value={discount} placeholder="0" onChange={(e) => setDiscount(e.target.value)} />
                        </div>

                        <div className="pos-totals">
                          <div className="pos-total-row">
                            <span style={{ color: 'var(--muted)' }}>{t.subtotal}</span>
                            <strong>{formatNumber(subtotal)} {cur}</strong>
                          </div>
                          <div className="pos-total-row">
                            <span style={{ color: 'var(--muted)' }}>{t.discount}</span>
                            <span style={{ color: 'var(--red)' }}>− {formatNumber(discountValue)} {cur}</span>
                          </div>
                          <div className="pos-total-row pos-grand-total">
                            <span>{t.total_to_pay}</span>
                            <span style={{ color: 'var(--primary)' }}>{formatNumber(total)} {cur}</span>
                          </div>
                        </div>

                        <label style={{ fontSize: 12, fontWeight: 800, color: '#4b5b75', display: 'block', marginBottom: 6 }}>{t.payment_method}</label>
                        <div className="pos-payments">
                          <button type="button" className={`pos-payment-btn ${paymentMethod === 'cash' ? 'active' : ''}`} onClick={() => setPaymentMethod('cash')} title={t.cash}>
                            <i className="fas fa-money-bill-wave" style={{ display: 'block', marginBottom: 4 }} /><span style={{ fontSize: 10 }}>{t.cash}</span>
                          </button>
                          <button type="button" className={`pos-payment-btn ${paymentMethod === 'bankily' ? 'active' : ''}`} onClick={() => setPaymentMethod('bankily')} title={t.bankily}>
                            <i className="fas fa-mobile-alt" style={{ display: 'block', marginBottom: 4, color: '#e11d48' }} /><span style={{ fontSize: 10 }}>{t.bankily}</span>
                          </button>
                          <button type="button" className={`pos-payment-btn ${paymentMethod === 'masrivi' ? 'active' : ''}`} onClick={() => setPaymentMethod('masrivi')} title={t.masrivi}>
                            <i className="fas fa-mobile-alt" style={{ display: 'block', marginBottom: 4, color: '#eab308' }} /><span style={{ fontSize: 10 }}>{t.masrivi}</span>
                          </button>
                          <button type="button" className={`pos-payment-btn ${paymentMethod === 'sedad' ? 'active' : ''}`} onClick={() => setPaymentMethod('sedad')} title={t.sedad}>
                            <i className="fas fa-mobile-alt" style={{ display: 'block', marginBottom: 4, color: '#16a34a' }} /><span style={{ fontSize: 10 }}>{t.sedad}</span>
                          </button>
                          <button type="button" className={`pos-payment-btn ${paymentMethod === 'credit' ? 'active' : ''}`} onClick={() => setPaymentMethod('credit')} title={t.credit}>
                            <i className="fas fa-hand-holding-usd" style={{ display: 'block', marginBottom: 4, color: '#f97316' }} /><span style={{ fontSize: 10 }}>{t.credit}</span>
                          </button>
                        </div>

                        {paymentMethod === 'cash' && (
                          <div style={{ marginTop: 12 }}>
                            <label style={{ fontSize: 12, fontWeight: 800, color: '#4b5b75', display: 'block', marginBottom: 6 }}>{t.amount_received}</label>
                            <input
                              type="number" min="0" className="ep-filter-input" style={{ height: 'auto', padding: '10px 12px' }}
                              value={amountReceived} placeholder={t.amount_placeholder}
                              onChange={(e) => setAmountReceived(e.target.value)}
                            />
                            {received > 0 && received < total && (
                              <div style={{ marginTop: 6, fontSize: 18, color: 'var(--red)' }}>
                                <i className="fas fa-exclamation-circle" style={{ marginInlineEnd: 4 }} />{t.missing(`${formatNumber(total - received)} ${cur}`)}
                              </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                              <span style={{ color: 'var(--muted)', fontSize: 12 }}>{t.change}</span>
                              <strong style={{ color: change > 0 ? 'var(--green)' : 'var(--ink)' }}>{formatNumber(change)} {cur}</strong>
                            </div>
                          </div>
                        )}

                        {paymentMethod === 'credit' && (
                          <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--amber-soft)', color: '#94590a', borderRadius: 9, fontSize: 12 }}>
                            <i className="fas fa-info-circle" style={{ marginInlineEnd: 6 }} />{t.credit_info}
                          </div>
                        )}

                        <div className="ep-form-group" style={{ marginTop: 12, marginBottom: 0 }}>
                          <label>{t.notes}</label>
                          <textarea rows="2" value={notes} placeholder={t.notes_ph} onChange={(e) => setNotes(e.target.value)} />
                        </div>

                        <button type="button" className="ep-btn ep-btn-save pos-checkout" onClick={handleCheckout} disabled={processing || cart.length === 0 || total <= 0}>
                          {processing ? (
                            <><i className="fas fa-spinner fa-spin" style={{ marginInlineEnd: 6 }} />{t.processing}</>
                          ) : (
                            <><i className="fas fa-check-circle" style={{ marginInlineEnd: 6 }} />{t.checkout(`${formatNumber(total)} ${cur}`)}</>
                          )}
                        </button>
                        <button type="button" className="ep-btn ep-btn-outline" style={{ width: '100%', marginTop: 8 }} onClick={clearCart}>
                          <i className="fas fa-trash-alt" style={{ marginInlineEnd: 6 }} />{t.clear_cart}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="ep-modal-footer">
              <button type="button" className="ep-btn ep-btn-outline" onClick={closeSaleModal} disabled={processing}>{t.close}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal scanner */}
      {showScanner && (
        <div className="ep-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && setShowScanner(false)}>
          <div className="ep-modal small" role="dialog" aria-modal="true">
            <div className="ep-modal-header">
              <h3><span className="ep-modal-icon"><i className="fas fa-barcode" /></span>{t.scanner_title}</h3>
              <button type="button" className="btn-icon" onClick={() => setShowScanner(false)} aria-label={t.close}><i className="fas fa-times" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleBarcodeSearch(scannerCode); }}>
              <div className="ep-modal-body">
                <div className="ep-form-group">
                  <label>{t.scanner_label}</label>
                  <input autoFocus value={scannerCode} onChange={(e) => setScannerCode(e.target.value)} placeholder={t.scanner_ph} />
                  <small style={{ display: 'block', marginTop: 6, color: 'var(--muted)', fontSize: 18 }}>{t.scanner_hint}</small>
                </div>
              </div>
              <div className="ep-modal-footer">
                <button type="button" className="ep-btn ep-btn-cancel" onClick={() => setShowScanner(false)}>{t.cancel}</button>
                <button type="submit" className="ep-btn ep-btn-save"><i className="fas fa-plus" style={{ marginInlineEnd: 6 }} />{t.add_to_cart}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal détails vente */}
      {selectedSale && (
        <div className="ep-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && setSelectedSale(null)}>
          <div className="ep-modal medium" role="dialog" aria-modal="true">
            <div className="ep-modal-header">
              <div>
                <h3><span className="ep-modal-icon"><i className="fas fa-file-invoice" /></span>{t.details_title}</h3>
                <p>{selectedSale.invoice_number || `VENTE-${selectedSale.id}`}</p>
              </div>
              <button type="button" className="btn-icon" onClick={() => setSelectedSale(null)} aria-label={t.close}><i className="fas fa-times" /></button>
            </div>
            <div className="ep-modal-body">
              <div className="ep-detail-grid">
                <div className="ep-detail-item"><span>{t.invoice}</span><strong>{selectedSale.invoice_number || `VENTE-${selectedSale.id}`}</strong></div>
                <div className="ep-detail-item"><span>{t.customer}</span><strong>{getCustomerName(selectedSale)}</strong></div>
                <div className="ep-detail-item"><span>{t.date}</span><strong>{formatDate(selectedSale.created_at, t.locale)}</strong></div>
              </div>
              <div className="ep-section-title"><span className="ep-section-num">1</span> {t.sold_items}</div>
              <table className="ep-items-table">
                <thead>
                  <tr>
                    <th>{t.th_products}</th>
                    <th className="ep-col-center">{t.edit_qty}</th>
                    <th className="ep-col-end">{t.edit_unit}</th>
                    <th className="ep-col-end">{t.edit_total}</th>
                  </tr>
                </thead>
                <tbody>
                  {getSaleItems(selectedSale).length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>{t.no_items}</td></tr>
                  ) : (
                    getSaleItems(selectedSale).map((item, index) => {
                      const qty = Number(item.quantity) || 0;
                      const price = Number(item.price ?? item.unit_price) || 0;
                      const lineTotal = Number(item.total ?? qty * price);
                      const name = item.product_name || item.name || item.products?.name || item.product?.name || 'Produit';
                      return (
                        <tr key={item.id || index}>
                          <td>{name}</td>
                          <td className="ep-col-center">{qty}</td>
                          <td className="ep-col-end">{formatNumber(price)} {cur}</td>
                          <td className="ep-col-end" style={{ fontWeight: 800 }}>{formatNumber(lineTotal)} {cur}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              <div className="pos-totals" style={{ marginTop: 16 }}>
                <div className="pos-total-row">
                  <span style={{ color: 'var(--muted)' }}>{t.total_amount}</span>
                  <strong>{formatNumber(selectedSale.grand_total ?? selectedSale.total)} {cur}</strong>
                </div>
                <div className="pos-total-row">
                  <span style={{ color: 'var(--muted)' }}>{t.th_status}</span>
                  <span className={`ep-badge badge-${getStatus(selectedSale.status, selectedSale.payment_method).tone}`}>
                    {getStatus(selectedSale.status, selectedSale.payment_method).label}
                  </span>
                </div>
              </div>
            </div>
            <div className="ep-modal-footer">
              <button type="button" className="ep-btn ep-btn-outline" onClick={() => setSelectedSale(null)}>{t.close}</button>
              <button type="button" className="ep-btn ep-btn-outline" onClick={() => exportSale(selectedSale)}>
                <i className="fas fa-download" style={{ marginInlineEnd: 6 }} />{t.export}
              </button>
              <button type="button" className="ep-btn ep-btn-save" onClick={() => printInvoice(selectedSale)}>
                <i className="fas fa-print" style={{ marginInlineEnd: 6 }} />{t.print}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal édition */}
      {saleToEdit && (
        <div className="ep-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && !actionLoading && setSaleToEdit(null)}>
          <div className="ep-modal medium" role="dialog" aria-modal="true">
            <div className="ep-modal-header">
              <h3><span className="ep-modal-icon amber"><i className="fas fa-edit" /></span>{t.edit_title}</h3>
              <button type="button" className="btn-icon" onClick={() => setSaleToEdit(null)} disabled={actionLoading} aria-label={t.close}><i className="fas fa-times" /></button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="ep-modal-body">
                <div className="ep-detail-grid">
                  <div className="ep-detail-item"><span>{t.invoice}</span><strong>{saleToEdit.invoice_number || `VENTE-${saleToEdit.id}`}</strong></div>
                  <div className="ep-detail-item"><span>{t.customer}</span><strong>{getCustomerName(saleToEdit)}</strong></div>
                  <div className="ep-detail-item"><span>{t.date}</span><strong>{formatDate(saleToEdit.created_at, t.locale)}</strong></div>
                </div>
                <div className="ep-section-title"><span className="ep-section-num">1</span> {t.edit_articles}</div>
                <table className="ep-items-table">
                  <thead>
                    <tr>
                      <th>{t.th_products}</th>
                      <th className="ep-col-center" style={{ width: 90 }}>{t.edit_qty}</th>
                      <th className="ep-col-end" style={{ width: 130 }}>{t.edit_unit}</th>
                      <th className="ep-col-end">{t.edit_total}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editItems.map((item, index) => (
                      <tr key={index}>
                        <td>{item.product_name || item.name || item.products?.name || 'Produit'}</td>
                        <td className="ep-col-center">
                          <input
                            type="number" min="1" style={{ width: '100%', border: '1px solid var(--line)', borderRadius: 6, padding: 5, textAlign: 'center' }}
                            value={item.quantity}
                            onChange={(e) => { const arr = [...editItems]; arr[index].quantity = parseInt(e.target.value, 10) || 1; setEditItems(arr); }}
                          />
                        </td>
                        <td className="ep-col-end">
                          <input
                            type="number" min="0" style={{ width: '100%', border: '1px solid var(--line)', borderRadius: 6, padding: 5, textAlign: 'end' }}
                            value={item.price}
                            onChange={(e) => { const arr = [...editItems]; arr[index].price = parseFloat(e.target.value) || 0; setEditItems(arr); }}
                          />
                        </td>
                        <td className="ep-col-end" style={{ fontWeight: 800 }}>{formatNumber(item.quantity * item.price)} {cur}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="ep-grid2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
                  <div className="ep-form-group" style={{ marginBottom: 0 }}>
                    <label>{t.edit_status}</label>
                    <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                      <option value="paid">{t.paid}</option>
                      <option value="partial">{t.partial}</option>
                      <option value="draft">{t.draft}</option>
                      <option value="cancelled">{t.cancelled}</option>
                    </select>
                  </div>
                  <div className="ep-form-group" style={{ marginBottom: 0 }}>
                    <label>{t.edit_notes}</label>
                    <textarea rows="1" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder={t.edit_notes_ph} />
                  </div>
                </div>
              </div>
              <div className="ep-modal-footer">
                <button type="button" className="ep-btn ep-btn-cancel" onClick={() => setSaleToEdit(null)} disabled={actionLoading}>{t.cancel}</button>
                <button type="submit" className="ep-btn ep-btn-save" disabled={actionLoading}>
                  {actionLoading ? <><i className="fas fa-spinner fa-spin" style={{ marginInlineEnd: 6 }} />{t.saving}</> : <><i className="fas fa-save" style={{ marginInlineEnd: 6 }} />{t.save}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal suppression */}
      {saleToDelete && (
        <div className="ep-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && !actionLoading && setSaleToDelete(null)}>
          <div className="ep-modal small" role="alertdialog" aria-modal="true">
            <div className="ep-delete-body">
              <span className="ep-delete-icon"><i className="fas fa-trash-alt" /></span>
              <h4>{t.delete_q}</h4>
              <p>{t.delete_invoice(saleToDelete.invoice_number || saleToDelete.id)}</p>
              <div style={{ padding: '10px 12px', background: 'var(--amber-soft)', color: '#94590a', borderRadius: 9, fontSize: 12, marginTop: 10 }}>
                <i className="fas fa-info-circle" style={{ marginInlineEnd: 6 }} />{t.delete_warn}
              </div>
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

      {/* Modal facture après encaissement */}
      {showInvoice && lastSale && (
        <div className="ep-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && setShowInvoice(false)}>
          <div className="ep-modal medium" role="dialog" aria-modal="true">
            <div className="ep-modal-header">
              <div>
                <h3>
                  <span className="ep-modal-icon success"><i className="fas fa-check-circle" /></span>
                  {t.success_invoice}
                </h3>
                <p>{t.invoice} : {getInvoiceNumber()}</p>
              </div>
              <button type="button" className="btn-icon" onClick={() => setShowInvoice(false)} aria-label={t.close}><i className="fas fa-times" /></button>
            </div>
            <div className="ep-modal-body">
              <div style={{ textAlign: 'center', paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid var(--line)' }}>
                <div style={{ color: 'var(--primary)', marginBottom: 8 }}><i className="fas fa-store" style={{ fontSize: 24 }} /></div>
                <h3 style={{ margin: '0 0 4px', fontWeight: 800 }}>{STORE.name}</h3>
                <div style={{ color: 'var(--muted)', fontSize: 12 }}>{STORE.address}<br />{STORE.phone}</div>
                <h4 style={{ margin: '12px 0 0', fontWeight: 800 }}>{t.facture}</h4>
              </div>
              <div className="ep-detail-grid">
                <div className="ep-detail-item"><span>{t.invoice.toUpperCase()}</span><strong>{getInvoiceNumber()}</strong></div>
                <div className="ep-detail-item"><span>{t.date.toUpperCase()}</span><strong>{formatDate(lastSale.created_at, t.locale)}</strong></div>
                <div className="ep-detail-item"><span>{t.customer.toUpperCase()}</span><strong>{getCustomerName(lastSale)}</strong></div>
              </div>
              <table className="ep-items-table">
                <thead>
                  <tr>
                    <th>{t.th_products}</th>
                    <th className="ep-col-center">{t.edit_qty}</th>
                    <th className="ep-col-end">{t.edit_unit}</th>
                    <th className="ep-col-end">{t.edit_total}</th>
                  </tr>
                </thead>
                <tbody>
                  {getSaleItems(lastSale).map((item, index) => {
                    const qty = Number(item.quantity) || 0;
                    const price = Number(item.price ?? item.unit_price) || 0;
                    const lineTotal = Number(item.total ?? qty * price);
                    return (
                      <tr key={item.id || index}>
                        <td>{item.product_name || item.name || item.products?.name || 'Produit'}</td>
                        <td className="ep-col-center">{qty}</td>
                        <td className="ep-col-end">{formatNumber(price)} {cur}</td>
                        <td className="ep-col-end" style={{ fontWeight: 800 }}>{formatNumber(lineTotal)} {cur}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="pos-totals" style={{ marginTop: 16 }}>
                <div className="pos-total-row"><span style={{ color: 'var(--muted)' }}>{t.subtotal}</span><strong>{formatNumber(lastSale.subtotal)} {cur}</strong></div>
                <div className="pos-total-row"><span style={{ color: 'var(--muted)' }}>{t.discount}</span><strong style={{ color: 'var(--red)' }}>− {formatNumber(lastSale.discount)} {cur}</strong></div>
                <div className="pos-total-row pos-grand-total">
                  <span>{t.total_to_pay}</span>
                  <span style={{ color: 'var(--primary)' }}>{formatNumber(lastSale.grand_total ?? lastSale.total)} {cur}</span>
                </div>
                <div className="pos-total-row"><span style={{ color: 'var(--muted)' }}>{t.payment_method}</span><strong>{({ cash: t.cash, bankily: t.bankily, masrivi: t.masrivi, sedad: t.sedad, credit: t.credit, card: t.card })[lastSale.payment_method] || t.cash}</strong></div>
                {lastSale.payment_method === 'cash' && (
                  <>
                    <div className="pos-total-row"><span style={{ color: 'var(--muted)' }}>{t.amount_received}</span><strong>{formatNumber(lastSale.amount_received)} {cur}</strong></div>
                    <div className="pos-total-row"><span style={{ color: 'var(--muted)' }}>{t.change}</span><strong>{formatNumber(lastSale.change_amount)} {cur}</strong></div>
                  </>
                )}
                {lastSale.notes && (
                  <div style={{ marginTop: 12, padding: '8px 12px', background: '#f8fafc', borderInlineStart: '3px solid var(--primary)', borderRadius: 8, fontSize: 12 }}>
                    <small style={{ color: 'var(--muted)', display: 'block', marginBottom: 2 }}>{t.edit_notes} :</small>
                    <em>{lastSale.notes}</em>
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 18, marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                {t.thanks}<br />{t.thanks_sub}
              </div>
            </div>
            <div className="ep-modal-footer">
              <button type="button" className="ep-btn ep-btn-outline" onClick={() => printInvoice(lastSale)}>
                <i className="fas fa-print" style={{ marginInlineEnd: 6 }} />{t.print_invoice}
              </button>
              <button type="button" className="ep-btn ep-btn-outline" onClick={() => setShowInvoice(false)}>{t.close}</button>
              <button type="button" className="ep-btn ep-btn-save" onClick={handleNewSale}>
                <i className="fas fa-plus" style={{ marginInlineEnd: 6 }} />{t.new_sale}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VentesPage;