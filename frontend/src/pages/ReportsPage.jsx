// src/pages/ReportsPage.jsx
// Version bilingue Français / العربية (RTL) avec palette de couleurs améliorée

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { salesApi, purchasesApi, expensesApi, productsApi } from '../api';
import { useLanguage } from '../context/LanguageContext';

/* =========================================================
   TRADUCTIONS / الترجمة
========================================================= */

const I18N = {
  fr: {
    dir: 'ltr',
    locale: 'fr-FR',
    currency: 'MRU',
    sheet: 'Rapport',
    title_stock: 'Stock actuel',
    title_history: 'Historique des transactions',
    title_inventory: 'Inventaire des produits',
    title_profits: 'Analyse des bénéfices',
    title_movements: 'Mouvements du stock',
    subtitle: 'Tableau de bord et analyse de votre gestion commerciale',
    refresh: 'Actualiser',
    excel: 'Excel',
    print: 'PDF / Imprimer',
    period: 'Période',
    today: "Aujourd'hui",
    week: 'Cette semaine',
    month: 'Ce mois',
    year: 'Cette année',
    all: 'Toute la période',
    custom: 'Personnalisée',
    date_from: 'Date début',
    date_to: 'Date fin',
    search: 'Recherche',
    search_ph: 'Produit, référence...',
    category: 'Catégorie',
    all_categories: 'Toutes les catégories',
    movement_type: 'Type de mouvement',
    all_movements: 'Tous les mouvements',
    entries: 'Entrées',
    exits: 'Sorties',
    loading: 'Chargement des rapports...',
    error_load: 'Impossible de charger les données. Vérifiez votre connexion.',
    stat_sales: 'Chiffre d’affaires',
    stat_purchases: 'Total achats',
    stat_expenses: 'Dépenses',
    stat_net: 'Bénéfice net estimé',
    stat_products: 'Produits en stock',
    stat_stock_cost: 'Valeur du stock (achat)',
    stat_stock_sale: 'Valeur du stock (vente)',
    stat_alerts: 'Alertes de stock',
    alerts_sub: (n) => `dont ${n} en rupture`,
    stock_state: 'État actuel du stock',
    products_count: (n) => `${n} produit(s)`,
    ref: 'Référence',
    product: 'Produit',
    cat: 'Catégorie',
    qty: 'Quantité',
    buy_price: 'Prix achat',
    sell_price: 'Prix vente',
    buy_value: 'Valeur achat',
    sell_value: 'Valeur vente',
    status: 'Statut',
    none_products: 'Aucun produit trouvé.',
    st_ok: 'Disponible',
    st_low: 'Faible',
    st_out: 'Rupture',
    inv_title: 'Inventaire physique',
    reset: 'Réinitialiser',
    inv_hint: 'Saisissez les quantités réellement comptées. Les écarts sont calculés automatiquement.',
    theoretical: 'Stock théorique',
    physical: 'Stock physique',
    gap: 'Écart',
    profits_calc: 'Détail du calcul des bénéfices',
    revenue: 'Chiffre d’affaires',
    cogs: 'Coût des produits vendus',
    gross: 'Bénéfice brut',
    expenses: 'Dépenses',
    net_upper: 'BÉNÉFICE NET ESTIMÉ',
    profit_note: "Le bénéfice est estimé à partir des coûts d'achat disponibles.",
    best_selling: 'Produits les plus vendus',
    best_profit: 'Produits les plus rentables',
    no_sales: 'Aucune vente pour cette période.',
    no_data: 'Aucune donnée de vente.',
    history_title: 'Historique des ventes et achats',
    journal_title: 'Journal des mouvements',
    ops_count: (n) => `${n} opération(s)`,
    date: 'Date',
    time: 'Heure',
    type: 'Type',
    products: 'Produits',
    amount: 'Montant',
    none_history: 'Aucun historique trouvé.',
    t_sale: 'Vente',
    t_purchase: 'Achat',
    sold_qty: 'Quantité vendue',
    est_cost: 'Coût estimé',
    est_profit: 'Bénéfice estimé',
    evolution: 'Évolution des opérations',
    legend_sales: 'Ventes',
    legend_purchases: 'Achats',
    legend_expenses: 'Dépenses',
    no_chart: 'Aucune donnée disponible pour cette période.',
    generated: 'Rapport généré le',
    range: (a, b) => <>Du {a} au {b}</>,
    unknown: 'Produit inconnu',
    switch_title: 'Changer de langue',
  },
  ar: {
    dir: 'rtl',
    locale: 'ar-u-nu-latn',
    currency: 'أوقية',
    sheet: 'تقرير',
    title_stock: 'المخزون الحالي',
    title_history: 'سجل المعاملات',
    title_inventory: 'جرد المنتجات',
    title_profits: 'تحليل الأرباح',
    title_movements: 'حركة المخزون',
    subtitle: 'لوحة متابعة وتحليل لإدارة تجارتك',
    refresh: 'تحديث',
    excel: 'Excel',
    print: 'PDF / طباعة',
    period: 'الفترة',
    today: 'اليوم',
    week: 'هذا الأسبوع',
    month: 'هذا الشهر',
    year: 'هذه السنة',
    all: 'كل الفترات',
    custom: 'مخصصة',
    date_from: 'من تاريخ',
    date_to: 'إلى تاريخ',
    search: 'بحث',
    search_ph: 'منتج، مرجع...',
    category: 'الفئة',
    all_categories: 'كل الفئات',
    movement_type: 'نوع الحركة',
    all_movements: 'كل الحركات',
    entries: 'الداخل',
    exits: 'الخارج',
    loading: 'جارٍ تحميل التقارير...',
    error_load: 'تعذّر تحميل البيانات. تحقق من الاتصال.',
    stat_sales: 'رقم المبيعات',
    stat_purchases: 'إجمالي المشتريات',
    stat_expenses: 'المصروفات',
    stat_net: 'الربح الصافي التقديري',
    stat_products: 'المنتجات في المخزون',
    stat_stock_cost: 'قيمة المخزون (شراء)',
    stat_stock_sale: 'قيمة المخزون (بيع)',
    stat_alerts: 'تنبيهات المخزون',
    alerts_sub: (n) => `منها ${n} نفدت`,
    stock_state: 'حالة المخزون الحالية',
    products_count: (n) => `${n} منتج`,
    ref: 'المرجع',
    product: 'المنتج',
    cat: 'الفئة',
    qty: 'الكمية',
    buy_price: 'سعر الشراء',
    sell_price: 'سعر البيع',
    buy_value: 'قيمة الشراء',
    sell_value: 'قيمة البيع',
    status: 'الحالة',
    none_products: 'لا توجد منتجات.',
    st_ok: 'متوفر',
    st_low: 'منخفض',
    st_out: 'نفد',
    inv_title: 'الجرد الفعلي',
    reset: 'إعادة تعيين',
    inv_hint: 'أدخل الكميات المعدودة فعلياً، وسيُحسب الفرق تلقائياً.',
    theoretical: 'المخزون النظري',
    physical: 'المخزون الفعلي',
    gap: 'الفرق',
    profits_calc: 'تفاصيل حساب الأرباح',
    revenue: 'رقم المبيعات',
    cogs: 'تكلفة المنتجات المباعة',
    gross: 'الربح الإجمالي',
    expenses: 'المصروفات',
    net_upper: 'الربح الصافي التقديري',
    profit_note: 'يُقدَّر الربح اعتماداً على تكاليف الشراء المتوفرة.',
    best_selling: 'المنتجات الأكثر مبيعاً',
    best_profit: 'المنتجات الأكثر ربحية',
    no_sales: 'لا توجد مبيعات في هذه الفترة.',
    no_data: 'لا توجد بيانات مبيعات.',
    history_title: 'سجل المبيعات والمشتريات',
    journal_title: 'سجل الحركات',
    ops_count: (n) => `${n} عملية`,
    date: 'التاريخ',
    time: 'الوقت',
    type: 'النوع',
    products: 'المنتجات',
    amount: 'المبلغ',
    none_history: 'لا يوجد سجل.',
    t_sale: 'بيع',
    t_purchase: 'شراء',
    sold_qty: 'الكمية المباعة',
    est_cost: 'التكلفة التقديرية',
    est_profit: 'الربح التقديري',
    evolution: 'تطور العمليات',
    legend_sales: 'المبيعات',
    legend_purchases: 'المشتريات',
    legend_expenses: 'المصروفات',
    no_chart: 'لا توجد بيانات لهذه الفترة.',
    generated: 'تم إنشاء التقرير في',
    range: (a, b) => <>من {a} إلى {b}</>,
    unknown: 'منتج غير معروف',
    switch_title: 'تغيير اللغة',
  },
};


/* =========================================================
   UTILITAIRES
========================================================= */

const pad = (n) => String(n).padStart(2, '0');

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const firstDayOfMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
};

// Les chiffres restent latins (0-9) dans les deux langues.
const money = (value) =>
  new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const number = (value) => Number(value) || 0;

const getRows = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
};

const getDateKey = (value) => {
  if (!value) return '';
  const str = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.substring(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const formatDate = (value, locale) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(locale);
};

const formatTime = (value, locale) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
};

// Clés de statut indépendantes de la langue : 'out' | 'low' | 'ok'
const getStatusKey = (product) => {
  const quantity = number(product.quantity);
  const minimum = number(product.min_quantity);
  if (quantity <= 0) return 'out';
  if (quantity <= minimum) return 'low';
  return 'ok';
};

const UNKNOWN = '__unknown__';

const getSaleItems = (sale) => sale.items || sale.sale_items || sale.invoice_items || sale.details || [];
const getPurchaseItems = (purchase) => purchase.items || purchase.purchase_items || purchase.details || [];

const getItemName = (item) =>
  item.product_name || item.products?.name || item.product?.name || item.name || UNKNOWN;

const getItemQuantity = (item) => number(item.quantity || item.qty);

const getItemPrice = (item) =>
  number(item.unit_price || item.price || item.sale_price || item.purchase_price);

const getItemTotal = (item) => {
  const subtotal = item.subtotal ?? item.total;
  return subtotal !== undefined && subtotal !== null
    ? number(subtotal)
    : getItemQuantity(item) * getItemPrice(item);
};

const getSaleDate = (sale) => sale.created_at || sale.sale_date || sale.date;
const getPurchaseDate = (purchase) => purchase.created_at || purchase.purchase_date || purchase.date;
const getSaleTotal = (sale) => number(sale.grand_total ?? sale.total ?? sale.amount);
const getPurchaseTotal = (purchase) => number(purchase.grand_total ?? purchase.total ?? purchase.amount);

const isCancelled = (record) =>
  ['cancelled', 'canceled', 'annule', 'annulee', 'annulée', 'rejected'].includes(
    String(record.status || '').toLowerCase()
  );

const REPORT_KEYS = ['stock', 'history', 'inventory', 'profits', 'movements'];
const REPORT_ICONS = {
  stock: 'fa-boxes-stacked',
  history: 'fa-clock-rotate-left',
  inventory: 'fa-clipboard-list',
  profits: 'fa-chart-line',
  movements: 'fa-right-left',
};

/* =========================================================
   COMPOSANT PRINCIPAL
========================================================= */

const ReportsPage = () => {
  const location = useLocation();

  const { lang } = useLanguage(); // langue globale (Header)
  const t = I18N[lang];


  const [reportType, setReportType] = useState('stock');

  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState('');
  const [errorText, setErrorText] = useState('');

  // Filtres
  const [period, setPeriod] = useState('month');
  const [dateFrom, setDateFrom] = useState(firstDayOfMonth);
  const [dateTo, setDateTo] = useState(today);

  const [search, setSearch] = useState('');
  const [movementType, setMovementType] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Inventaire physique local
  const [physicalCounts, setPhysicalCounts] = useState({});

  /* ---------- Type du rapport selon l'URL ---------- */
  useEffect(() => {
    const path = location.pathname.toLowerCase();
    if (path.includes('history')) setReportType('history');
    else if (path.includes('inventory')) setReportType('inventory');
    else if (path.includes('profits')) setReportType('profits');
    else if (path.includes('movements')) setReportType('movements');
    else setReportType('stock');
  }, [location.pathname]);

  /* ---------- Chargement des données ---------- */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorKey('');
    setErrorText('');

    try {
      const results = await Promise.all([
        salesApi.getAll(),
        purchasesApi.getAll(),
        expensesApi.getAll(),
        productsApi.getAll(),
      ]);

      setSales(getRows(results[0]));
      setPurchases(getRows(results[1]));
      setExpenses(getRows(results[2]));
      setProducts(getRows(results[3]));
    } catch (err) {
      console.error('Erreur chargement rapports:', err);
      // Le message du serveur est affiché tel quel ; sinon message traduit.
      const serverMessage = err.response?.data?.message;
      if (serverMessage) setErrorText(serverMessage);
      else setErrorKey('error_load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---------- Filtres par période ---------- */
  const changePeriod = (value) => {
    setPeriod(value);
    if (value === 'custom') return;

    const now = new Date();
    const current = today();
    let start = current;
    const end = current;

    if (value === 'week') {
      const day = now.getDay() || 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() - day + 1);
      start = getDateKey(monday);
    }
    if (value === 'month') start = firstDayOfMonth();
    if (value === 'year') start = `${now.getFullYear()}-01-01`;
    if (value === 'all') start = '2000-01-01';

    setDateFrom(start);
    setDateTo(end);
  };

  const nameOf = useCallback(
    (item) => {
      const name = getItemName(item);
      return name === UNKNOWN ? I18N[lang].unknown : name;
    },
    [lang]
  );

  /* ---------- Données filtrées ---------- */
  const reportData = useMemo(() => {
    const inPeriod = (date) => {
      const key = getDateKey(date);
      return Boolean(key) && key >= dateFrom && key <= dateTo;
    };

    const validSales = sales.filter((s) => !isCancelled(s) && inPeriod(getSaleDate(s)));
    const validPurchases = purchases.filter((p) => !isCancelled(p) && inPeriod(getPurchaseDate(p)));
    const validExpenses = expenses.filter((e) => inPeriod(e.date || e.created_at));

    const totalSales = validSales.reduce((sum, s) => sum + getSaleTotal(s), 0);
    const totalPurchases = validPurchases.reduce((sum, p) => sum + getPurchaseTotal(p), 0);
    const totalExpenses = validExpenses.reduce((sum, e) => sum + number(e.amount), 0);

    const totalStockValue = products.reduce(
      (sum, p) => sum + number(p.quantity) * number(p.purchase_price || p.cost_price),
      0
    );
    const totalSaleStockValue = products.reduce(
      (sum, p) => sum + number(p.quantity) * number(p.sale_price),
      0
    );

    const needle = search.toLowerCase();

    const stockData = products
      .map((p) => {
        const quantity = number(p.quantity);
        const purchasePrice = number(p.purchase_price || p.cost_price);
        const salePrice = number(p.sale_price);
        const raw = physicalCounts[p.id];
        const physicalQuantity = raw !== undefined && raw !== '' ? number(raw) : quantity;

        return {
          ...p,
          statusKey: getStatusKey(p),
          physicalQuantity,
          physicalInput: raw !== undefined ? raw : quantity,
          difference: physicalQuantity - quantity,
          purchaseValue: quantity * purchasePrice,
          saleValue: quantity * salePrice,
        };
      })
      .filter((p) => {
        const matchesSearch =
          !search ||
          String(p.name || '').toLowerCase().includes(needle) ||
          String(p.reference || p.code || '').toLowerCase().includes(needle);

        const categoryName = p.categories?.name || p.category?.name || '';
        const matchesCategory =
          categoryFilter === 'all' ||
          String(p.category_id) === String(categoryFilter) ||
          categoryName === categoryFilter;

        return matchesSearch && matchesCategory;
      });

    // Coût des marchandises vendues et classements
    const productSales = {};

    validSales.forEach((sale) => {
      getSaleItems(sale).forEach((item) => {
        const id = item.product_id || item.product?.id || item.products?.id || getItemName(item);
        const quantity = getItemQuantity(item);
        const revenue = getItemTotal(item);
        const product = products.find((p) => String(p.id) === String(id));

        const costPrice = number(
          item.purchase_price ||
            item.cost_price ||
            item.product?.purchase_price ||
            item.products?.purchase_price ||
            item.product?.cost_price ||
            product?.purchase_price ||
            product?.cost_price
        );

        if (!productSales[id]) {
          productSales[id] = { id, name: nameOf(item), quantity: 0, revenue: 0, cost: 0, profit: 0 };
        }

        productSales[id].quantity += quantity;
        productSales[id].revenue += revenue;
        productSales[id].cost += quantity * costPrice;
        productSales[id].profit += revenue - quantity * costPrice;
      });
    });

    const bestSelling = Object.values(productSales).sort((a, b) => b.quantity - a.quantity);
    const bestProfitable = Object.values(productSales).sort((a, b) => b.profit - a.profit);
    const costOfGoods = Object.values(productSales).reduce((sum, p) => sum + p.cost, 0);
    const grossProfit = totalSales - costOfGoods;
    const netProfit = grossProfit - totalExpenses;

    // Mouvements de stock
    const movements = [
      ...validSales.map((s) => ({
        id: `V-${s.id}`,
        kind: 'sale',
        date: getSaleDate(s),
        reference: s.invoice_number || s.reference || `#${s.id}`,
        items: getSaleItems(s),
        amount: getSaleTotal(s),
        quantity: getSaleItems(s).reduce((sum, i) => sum + getItemQuantity(i), 0),
        direction: 'sortie',
      })),
      ...validPurchases.map((p) => ({
        id: `A-${p.id}`,
        kind: 'purchase',
        date: getPurchaseDate(p),
        reference: p.purchase_number || p.reference || `#${p.id}`,
        items: getPurchaseItems(p),
        amount: getPurchaseTotal(p),
        quantity: getPurchaseItems(p).reduce((sum, i) => sum + getItemQuantity(i), 0),
        direction: 'entree',
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    const filteredMovements = movements.filter((m) => {
      if (movementType === 'entree' && m.direction !== 'entree') return false;
      if (movementType === 'sortie' && m.direction !== 'sortie') return false;

      if (search) {
        const text = [m.reference, m.kind === 'sale' ? 'vente' : 'achat', ...m.items.map(nameOf)]
          .join(' ')
          .toLowerCase();
        if (!text.includes(needle)) return false;
      }
      return true;
    });

    // Statistiques par jour pour le graphique
    const dailyStats = {};
    const addDaily = (date, key, value) => {
      const day = getDateKey(date);
      if (!day) return;
      if (!dailyStats[day]) dailyStats[day] = { date: day, sales: 0, purchases: 0, expenses: 0 };
      dailyStats[day][key] += value;
    };

    validSales.forEach((s) => addDaily(getSaleDate(s), 'sales', getSaleTotal(s)));
    validPurchases.forEach((p) => addDaily(getPurchaseDate(p), 'purchases', getPurchaseTotal(p)));
    validExpenses.forEach((e) => addDaily(e.date || e.created_at, 'expenses', number(e.amount)));

    const chartData = Object.values(dailyStats)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-15);

    return {
      totalSales,
      totalPurchases,
      totalExpenses,
      totalStockValue,
      totalSaleStockValue,
      stockData,
      costOfGoods,
      grossProfit,
      netProfit,
      bestSelling,
      bestProfitable,
      movements: filteredMovements,
      chartData,
      lowStock: products.filter((p) => getStatusKey(p) === 'low'),
      outOfStock: products.filter((p) => getStatusKey(p) === 'out'),
    };
  }, [
    sales,
    purchases,
    expenses,
    products,
    dateFrom,
    dateTo,
    search,
    movementType,
    categoryFilter,
    physicalCounts,
    nameOf,
  ]);

  /* ---------- Export Excel (colonnes dans la langue choisie) ---------- */
  const exportExcel = () => {
    let rows = [];
    let fileName = 'Rapport_Gestistock';
    const statusLabel = (key) => t[`st_${key}`];

    if (reportType === 'stock' || reportType === 'inventory') {
      rows = reportData.stockData.map((p) => ({
        [t.ref]: p.reference || p.code || '',
        [t.product]: p.name,
        [t.cat]: p.categories?.name || p.category?.name || '',
        [t.theoretical]: p.quantity,
        [t.physical]: p.physicalQuantity,
        [t.gap]: p.difference,
        [t.buy_price]: p.purchase_price || p.cost_price || 0,
        [t.sell_price]: p.sale_price || 0,
        [t.buy_value]: p.purchaseValue,
        [t.sell_value]: p.saleValue,
        [t.status]: statusLabel(p.statusKey),
      }));
      fileName = reportType === 'stock' ? 'Stock_Actuel' : 'Inventaire';
    }

    if (reportType === 'history' || reportType === 'movements') {
      rows = reportData.movements.map((m) => ({
        [t.type]: m.kind === 'sale' ? t.t_sale : t.t_purchase,
        [t.ref]: m.reference,
        [t.date]: formatDate(m.date, t.locale),
        [t.time]: formatTime(m.date, t.locale),
        [t.products]: m.items.map(nameOf).join(', '),
        [t.qty]: m.quantity,
        [t.amount]: m.amount,
      }));
      fileName = reportType === 'history' ? 'Historique' : 'Mouvements';
    }

    if (reportType === 'profits') {
      rows = reportData.bestSelling.map((p) => ({
        [t.product]: p.name,
        [t.sold_qty]: p.quantity,
        [t.revenue]: p.revenue,
        [t.est_cost]: p.cost,
        [t.est_profit]: p.profit,
      }));
      fileName = 'Benefices';
    }

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = rows.length
      ? Object.keys(rows[0]).map(() => ({ wch: 20 }))
      : [{ wch: 20 }];

    const workbook = XLSX.utils.book_new();
    // Feuille de droite à gauche en arabe
    if (lang === 'ar') workbook.Workbook = { Views: [{ RTL: true }] };
    XLSX.utils.book_append_sheet(workbook, worksheet, t.sheet);
    XLSX.writeFile(workbook, `${fileName}_${today()}.xlsx`);
  };

  const printPage = () => window.print();

  const updatePhysicalCount = (id, value) =>
    setPhysicalCounts((prev) => ({ ...prev, [id]: value }));

  const resetInventory = () => setPhysicalCounts({});

  /* ---------- Catégories ---------- */
  const categories = useMemo(() => {
    const map = new Map();
    products.forEach((p) => {
      const name = p.categories?.name || p.category?.name;
      if (name) map.set(String(p.category_id || name), { id: p.category_id || name, name });
    });
    return Array.from(map.values());
  }, [products]);

  /* ---------- Cartes de statistiques ---------- */
  const isStockView = reportType === 'stock' || reportType === 'inventory';

  const stats = isStockView
    ? [
        { label: t.stat_products, value: products.length, icon: 'fa-boxes-stacked', tone: 'blue' },
        { label: t.stat_stock_cost, value: reportData.totalStockValue, icon: 'fa-coins', tone: 'violet', money: true },
        { label: t.stat_stock_sale, value: reportData.totalSaleStockValue, icon: 'fa-tags', tone: 'green', money: true },
        {
          label: t.stat_alerts,
          value: reportData.lowStock.length + reportData.outOfStock.length,
          icon: 'fa-triangle-exclamation',
          tone: reportData.outOfStock.length > 0 ? 'red' : 'amber',
          sub: t.alerts_sub(reportData.outOfStock.length),
        },
      ]
    : [
        { label: t.stat_sales, value: reportData.totalSales, icon: 'fa-cash-register', tone: 'green', money: true },
        { label: t.stat_purchases, value: reportData.totalPurchases, icon: 'fa-cart-shopping', tone: 'violet', money: true },
        { label: t.stat_expenses, value: reportData.totalExpenses, icon: 'fa-wallet', tone: 'amber', money: true },
        {
          label: t.stat_net,
          value: reportData.netProfit,
          icon: 'fa-chart-line',
          tone: reportData.netProfit >= 0 ? 'blue' : 'red',
          money: true,
        },
      ];

  // Montant isolé pour éviter que le signe « - » saute de côté en mode RTL.
  const amt = (value) => <bdi className="rp-amt">{money(value)}</bdi>;
  const cur = t.currency;

  const statusClass = { ok: 'rp-available', low: 'rp-low', out: 'rp-out' };

  const showChart = reportType === 'history' || reportType === 'profits';

  /* =======================================================
     AFFICHAGE
  ======================================================= */

  return (
    <div className="rp-page" dir={t.dir} lang={lang}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');

        .rp-page {
          --ink: #14213d;
          --muted: #66748b;
          --line: #e3e9f2;
          --bg: #f2f5fb;
          --card: #ffffff;

          --primary: #1f5eea;
          --primary-dark: #163f9e;
          --primary-soft: #e8efff;

          --green: #0f9d74;      --green-soft: #def7ee;
          --violet: #6a4de0;     --violet-soft: #ece8fd;
          --amber: #e08a0b;      --amber-soft: #fff0d6;
          --red: #d63c4a;        --red-soft: #fde8ea;
          --blue: #1f5eea;       --blue-soft: #e8efff;

          min-height: 100vh;
          padding: clamp(14px, 2.2vw, 28px);
          background:
            radial-gradient(1000px 340px at 100% -80px, rgba(31,94,234,.08), transparent 70%),
            var(--bg);
          color: var(--ink);
          font-family: Inter, 'Segoe UI', system-ui, Tahoma, Arial, sans-serif;
        }
        .rp-page[lang="ar"] {
          font-family: Cairo, 'Noto Sans Arabic', Tahoma, 'Segoe UI', Arial, sans-serif;
        }
        .rp-page * { box-sizing: border-box; }
        .rp-page button:focus-visible, .rp-page input:focus-visible, .rp-page select:focus-visible {
          outline: 3px solid rgba(31,94,234,.35); outline-offset: 2px;
        }

        /* ---------- En-tête ---------- */
        .rp-hero {
          position: relative; isolation: isolate; overflow: hidden;
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 18px;
          padding: clamp(20px, 3vw, 30px); margin-bottom: 18px; border-radius: 20px; color: #fff;
          background: linear-gradient(125deg, #0f2f66 0%, #1b55c9 58%, #2aa3d9 100%);
          box-shadow: 0 14px 32px rgba(21, 74, 170, .20);
        }
        .rp-hero::after {
          content: ""; position: absolute; z-index: -1; width: 250px; height: 250px;
          inset-inline-end: -70px; top: -115px; border: 32px solid rgba(255,255,255,.09); border-radius: 50%;
        }
        .rp-eyebrow { font-size: 15px; font-weight: 800; letter-spacing: 1.8px; opacity: .78; }
        .rp-heading h1 { margin: 6px 0 4px; font-size: clamp(22px, 2.8vw, 31px); font-weight: 800; line-height: 1.25; display: flex; align-items: center; gap: 12px; }
        .rp-heading h1 .rp-title-icon { display: inline-grid; place-items: center; width: 42px; height: 42px; border-radius: 12px; background: rgba(255,255,255,.16); font-size: 18px; }
        .rp-heading p { margin: 0; color: rgba(255,255,255,.82); font-size: 13px; }
        .rp-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }

        .rp-lang { display: inline-flex; padding: 3px; border-radius: 11px; background: rgba(255,255,255,.16); border: 1px solid rgba(255,255,255,.25); }
        .rp-lang button { border: 0; padding: 7px 12px; border-radius: 8px; background: transparent; color: #fff; font: inherit; font-size: 12px; font-weight: 800; cursor: pointer; transition: .15s; }
        .rp-lang button.on { background: #fff; color: #153f92; }

        .rp-btn { border: 1px solid transparent; border-radius: 10px; padding: 10px 14px; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; transition: .18s; }
        .rp-btn:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(.97); }
        .rp-btn:disabled { opacity: .6; cursor: not-allowed; }
        .rp-light { background: #fff; color: #1b3a78; }
        .rp-success { background: #12a87c; color: #fff; }
        .rp-danger { background: #e04a58; color: #fff; }
        .rp-ghost { background: #fff; color: #33445f; border-color: var(--line); }

        /* ---------- Onglets ---------- */
        .rp-tabs { display: flex; gap: 6px; flex-wrap: wrap; background: var(--card); padding: 7px; border-radius: 14px; border: 1px solid var(--line); margin-bottom: 18px; box-shadow: 0 3px 12px rgba(20,33,61,.03); }
        .rp-tab { display: inline-flex; align-items: center; gap: 8px; border: 0; padding: 10px 15px; border-radius: 10px; background: transparent; color: var(--muted); font: inherit; font-weight: 700; font-size: 13px; cursor: pointer; transition: .15s; }
        .rp-tab:hover { background: #f3f6fc; color: var(--ink); }
        .rp-tab.active { background: linear-gradient(135deg, #1f5eea, #2f7bf0); color: #fff; box-shadow: 0 5px 14px rgba(31,94,234,.28); }

        /* ---------- Filtres ---------- */
        .rp-filter { background: var(--card); padding: 16px; border: 1px solid var(--line); border-radius: 14px; margin-bottom: 18px; display: flex; align-items: flex-end; flex-wrap: wrap; gap: 12px; box-shadow: 0 3px 12px rgba(20,33,61,.03); }
        .rp-field { display: flex; flex-direction: column; gap: 6px; min-width: 145px; }
        .rp-field label { font-size: 11px; font-weight: 800; color: var(--muted); letter-spacing: .3px; }
        .rp-field input, .rp-field select { height: 40px; border: 1px solid #d9e1ed; border-radius: 9px; padding: 0 11px; outline: none; background: #fbfcfe; color: #2a3a55; font: inherit; font-size: 13px; min-width: 0; }
        .rp-field input:focus, .rp-field select:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); background: #fff; }
        .rp-period-label { margin-inline-start: auto; padding: 7px 12px; border-radius: 9px; background: var(--primary-soft); color: var(--primary-dark); font-size: 12px; font-weight: 700; }

        /* ---------- Cartes statistiques ---------- */
        .rp-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 15px; margin-bottom: 20px; }
        .rp-stat { position: relative; overflow: hidden; background: var(--card); padding: 18px 19px; border: 1px solid var(--line); border-inline-start: 4px solid var(--accent); border-radius: 14px; box-shadow: 0 4px 14px rgba(20,33,61,.04); transition: transform .2s, box-shadow .2s; }
        .rp-stat:hover { transform: translateY(-2px); box-shadow: 0 12px 24px rgba(20,33,61,.08); }
        .rp-stat::after { content: ""; position: absolute; inset-inline-end: -30px; bottom: -40px; width: 100px; height: 100px; border-radius: 50%; background: var(--accent-soft); opacity: .7; }
        .rp-stat-top { position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 13px; }
        .rp-stat-label { color: var(--muted); font-size: 12px; font-weight: 700; }
        .rp-stat-icon { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 12px; font-size: 17px; background: var(--accent-soft); color: var(--accent); flex: 0 0 40px; }
        .rp-stat-value { position: relative; z-index: 1; font-size: clamp(19px, 2vw, 25px); font-weight: 800; letter-spacing: -.3px; color: var(--ink); overflow-wrap: anywhere; }
        .rp-stat-unit { font-size: 12px; color: #8896ab; font-weight: 700; }
        .rp-stat-sub { position: relative; z-index: 1; margin-top: 4px; font-size: 11px; font-weight: 700; color: var(--accent); }
        .tone-blue   { --accent: var(--blue);   --accent-soft: var(--blue-soft); }
        .tone-green  { --accent: var(--green);  --accent-soft: var(--green-soft); }
        .tone-violet { --accent: var(--violet); --accent-soft: var(--violet-soft); }
        .tone-amber  { --accent: var(--amber);  --accent-soft: var(--amber-soft); }
        .tone-red    { --accent: var(--red);    --accent-soft: var(--red-soft); }

        /* ---------- Panneaux & tableaux ---------- */
        .rp-panel { background: var(--card); border: 1px solid var(--line); border-radius: 16px; overflow: hidden; margin-bottom: 20px; box-shadow: 0 4px 14px rgba(20,33,61,.035); }
        .rp-panel-header { padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; border-bottom: 1px solid #edf1f7; background: linear-gradient(180deg, #fbfcff, #fff); }
        .rp-panel-header h3 { margin: 0; font-size: 15px; font-weight: 800; color: #1c2c4a; display: flex; align-items: center; gap: 9px; }
        .rp-panel-header h3 .rp-ico { display: inline-grid; place-items: center; width: 30px; height: 30px; border-radius: 9px; background: var(--primary-soft); color: var(--primary); font-size: 13px; }
        .rp-count { padding: 5px 10px; border-radius: 8px; background: #f1f5fb; color: #4b5b75; font-size: 11px; font-weight: 800; }
        .rp-panel-body { padding: 20px; }
        .rp-hint { margin: 0 0 14px; color: var(--muted); font-size: 12px; }
        .rp-table-wrap { overflow-x: auto; }
        .rp-table { width: 100%; border-collapse: collapse; min-width: 750px; }
        .rp-table th { background: #f3f6fc; color: #5b6b85; text-align: start; padding: 13px 15px; font-size: 11px; font-weight: 800; white-space: nowrap; border-bottom: 1px solid var(--line); }
        .rp-table td { padding: 12px 15px; font-size: 12.5px; border-bottom: 1px solid #f0f3f8; color: #44546d; }
        .rp-table tbody tr:nth-child(even) td { background: #fafbfe; }
        .rp-table tbody tr:hover td { background: #eff4ff; }
        .rp-table tr:last-child td { border-bottom: 0; }
        .rp-product-name { font-weight: 800; color: #1b2a47 !important; }
        .rp-number { text-align: end !important; white-space: nowrap; font-variant-numeric: tabular-nums; }
        .rp-center { text-align: center !important; }
        .rp-amt { direction: ltr; unicode-bidi: isolate; font-variant-numeric: tabular-nums; }
        .rp-unit { color: #8896ab; font-size: .85em; font-weight: 700; }

        .rp-badge { padding: 5px 10px; border-radius: 20px; font-size: 11px; font-weight: 800; display: inline-block; white-space: nowrap; }
        .rp-available, .rp-entry { background: var(--green-soft); color: #0b6a4e; }
        .rp-low { background: var(--amber-soft); color: #94590a; }
        .rp-out, .rp-exit { background: var(--red-soft); color: #a3212e; }
        .rp-entry { background: var(--violet-soft); color: #4a32b0; }
        .rp-exit { background: var(--green-soft); color: #0b6a4e; }
        .rp-empty { text-align: center; padding: 34px !important; color: #98a5b8 !important; }

        .rp-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .rp-chart-row { display: grid; grid-template-columns: minmax(80px, 140px) 1fr 90px; gap: 10px; align-items: center; margin: 13px 0; font-size: 12px; }
        .rp-chart-label { color: #5b6b85; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
        .rp-chart-track { height: 11px; background: #edf1f8; border-radius: 20px; overflow: hidden; }
        .rp-chart-fill { height: 100%; border-radius: 20px; min-width: 3px; background: linear-gradient(90deg, #1f5eea, #4f8cf6); }
        .rp-chart-fill.green { background: linear-gradient(90deg, #0f9d74, #3fcfa4); }
        .rp-chart-value { text-align: end; font-weight: 800; color: #2a3a55; }

        .rp-inventory-input { width: 92px; padding: 7px; border: 1px solid #d5deeb; border-radius: 8px; text-align: center; font: inherit; background: #fbfcfe; }
        .rp-inventory-input:focus { border-color: var(--primary); outline: none; box-shadow: 0 0 0 3px var(--primary-soft); }
        .rp-positive { color: var(--green) !important; font-weight: 800; }
        .rp-negative { color: var(--red) !important; font-weight: 800; }

        .rp-calc-row { display: flex; justify-content: space-between; gap: 12px; padding: 13px 0; border-bottom: 1px dashed var(--line); font-weight: 600; color: #4b5b75; }
        .rp-calc-row.total { margin-top: 6px; padding: 15px 16px; border: 0; border-radius: 12px; font-weight: 800; font-size: 15px; background: var(--green-soft); color: #0b6a4e; }
        .rp-calc-row.total.loss { background: var(--red-soft); color: #a3212e; }

        .rp-message { display: flex; align-items: center; gap: 10px; padding: 13px 16px; border-radius: 11px; margin-bottom: 18px; font-size: 13px; }
        .rp-error { background: var(--red-soft); color: #a3212e; border: 1px solid #f6c8cd; }
        .rp-loading { padding: 60px 20px; text-align: center; color: var(--muted); }

        .rp-legend { display: flex; gap: 18px; flex-wrap: wrap; margin-bottom: 18px; font-size: 12px; font-weight: 700; color: #4b5b75; }
        .rp-legend span::before { content: ""; display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-inline-end: 6px; background: var(--dot); }
        .rp-footer { text-align: center; color: #98a5b8; font-size: 11px; padding: 15px; }

        /* ---------- Texte agrandi ---------- */
        .rp-page { font-size: 25px; }
        .rp-page[lang="ar"] { font-size: 25px; }
        .rp-heading p { font-size: 20px; }
        .rp-eyebrow { font-size: 18px; }
        .rp-btn { font-size: 18.5px; padding: 11px 16px; }
        .rp-tab { font-size: 20px; padding: 11px 16px; }

        .rp-field label { font-size: 20px; }
        .rp-field input, .rp-field select { height: 44px; font-size: 20px; }
        .rp-period-label { font-size: 20px; }

        .rp-stat-label { font-size: 20px; }
        .rp-stat-value { font-size: clamp(22px, 2.4vw, 30px); }
        .rp-stat-unit { font-size: 1px; }
        .rp-stat-sub { font-size: 13px; }

        .rp-panel-header h3 { font-size: 19px; }
        .rp-count { font-size: 18px; }
        .rp-hint { font-size: 18px; }

        .rp-table th { font-size: 20.5px; padding: 14px 16px; }
        .rp-table td { font-size: 18.5px; padding: 14px 16px; }
        .rp-badge { font-size: 19px; padding: 6px 12px; }

        .rp-chart-row { font-size: 14px; }
        .rp-calc-row { font-size: 15px; }
        .rp-calc-row.total { font-size: 17px; }
        .rp-legend { font-size: 14px; }
        .rp-footer { font-size: 13px; }

        @media (max-width: 1050px) { .rp-stats { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 700px) {
          .rp-page { padding: 12px; }
          .rp-stats { gap: 10px; } .rp-stat { padding: 14px; }
          .rp-grid-2 { grid-template-columns: 1fr; }
          .rp-tabs { overflow-x: auto; flex-wrap: nowrap; } .rp-tab { white-space: nowrap; }
          .rp-actions { width: 100%; } .rp-actions .rp-btn { flex: 1; }
          .rp-field { flex: 1 1 140px; } .rp-period-label { margin-inline-start: 0; width: 100%; text-align: center; }
        }
        @media print {
          @page { size: landscape; margin: 10mm; }
          body { background: #fff !important; }
          .rp-page { padding: 0 !important; background: #fff !important; }
          .rp-hero { box-shadow: none; padding: 16px; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .no-print, .rp-tabs, .rp-filter, .rp-actions { display: none !important; }
          .rp-panel, .rp-stat { box-shadow: none !important; break-inside: avoid; }
          .rp-stat::after { display: none; }
          .rp-table th { background: #e9eef5 !important; color: #14213d !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .rp-table { min-width: 0; }
          .rp-table td, .rp-table th { padding: 7px; font-size: 9px; }
          .rp-grid-2 { grid-template-columns: 1fr 1fr; }
          .rp-inventory-input { display: none; }
          .rp-print-only { display: inline !important; }
        }
        .rp-print-only { display: none; }
      `}</style>

      {/* EN-TÊTE */}
      <header className="rp-hero">
        <div className="rp-heading">
          <span className="rp-eyebrow">GESTISTOCK</span>
          <h1>
            <span className="rp-title-icon"><i className={`fas ${REPORT_ICONS[reportType]}`} /></span>
            {t[`title_${reportType}`]}
          </h1>
          <p>{t.subtitle}</p>
        </div>

        <div className="rp-actions no-print">

          <button className="rp-btn rp-light" onClick={fetchData} disabled={loading}>
            <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`} /> {t.refresh}
          </button>
          <button className="rp-btn rp-success" onClick={exportExcel}>
            <i className="fas fa-file-excel" /> {t.excel}
          </button>
          <button className="rp-btn rp-danger" onClick={printPage}>
            <i className="fas fa-file-pdf" /> {t.print}
          </button>
        </div>
      </header>

      {/* NAVIGATION */}
      <nav className="rp-tabs no-print">
        {REPORT_KEYS.map((key) => (
          <button
            key={key}
            className={`rp-tab ${reportType === key ? 'active' : ''}`}
            onClick={() => setReportType(key)}
          >
            <i className={`fas ${REPORT_ICONS[key]}`} /> {t[`title_${key}`]}
          </button>
        ))}
      </nav>

      {(errorKey || errorText) && (
        <div className="rp-message rp-error" role="alert">
          <i className="fas fa-exclamation-circle" />
          {errorText || t[errorKey]}
        </div>
      )}

      {/* FILTRES */}
      <div className="rp-filter no-print">
        <div className="rp-field">
          <label>{t.period}</label>
          <select value={period} onChange={(e) => changePeriod(e.target.value)}>
            <option value="today">{t.today}</option>
            <option value="week">{t.week}</option>
            <option value="month">{t.month}</option>
            <option value="year">{t.year}</option>
            <option value="all">{t.all}</option>
            <option value="custom">{t.custom}</option>
          </select>
        </div>

        <div className="rp-field">
          <label>{t.date_from}</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPeriod('custom');
            }}
          />
        </div>

        <div className="rp-field">
          <label>{t.date_to}</label>
          <input
            type="date"
            value={dateTo}
            min={dateFrom}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPeriod('custom');
            }}
          />
        </div>

        <div className="rp-field">
          <label>{t.search}</label>
          <input type="search" placeholder={t.search_ph} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {isStockView && (
          <div className="rp-field">
            <label>{t.category}</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">{t.all_categories}</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {reportType === 'movements' && (
          <div className="rp-field">
            <label>{t.movement_type}</label>
            <select value={movementType} onChange={(e) => setMovementType(e.target.value)}>
              <option value="all">{t.all_movements}</option>
              <option value="entree">{t.entries}</option>
              <option value="sortie">{t.exits}</option>
            </select>
          </div>
        )}

        <div className="rp-period-label">
          {t.range(<bdi key="a">{dateFrom}</bdi>, <bdi key="b">{dateTo}</bdi>)}
        </div>
      </div>

      {loading ? (
        <div className="rp-loading">
          <i className="fas fa-spinner fa-spin fa-2x" />
          <p>{t.loading}</p>
        </div>
      ) : (
        <>
          {/* STATISTIQUES */}
          <div className="rp-stats">
            {stats.map((stat) => (
              <div className={`rp-stat tone-${stat.tone}`} key={stat.label}>
                <div className="rp-stat-top">
                  <span className="rp-stat-label">{stat.label}</span>
                  <span className="rp-stat-icon"><i className={`fas ${stat.icon}`} /></span>
                </div>
                <div className="rp-stat-value">
                  {stat.money ? (
                    <>
                      {amt(stat.value)} <span className="rp-stat-unit">{cur}</span>
                    </>
                  ) : (
                    <bdi className="rp-amt">{stat.value}</bdi>
                  )}
                </div>
                {stat.sub && <div className="rp-stat-sub">{stat.sub}</div>}
              </div>
            ))}
          </div>

          {/* 1. STOCK ACTUEL */}
          {reportType === 'stock' && (
            <div className="rp-panel">
              <div className="rp-panel-header">
                <h3><span className="rp-ico"><i className="fas fa-boxes-stacked" /></span> {t.stock_state}</h3>
                <span className="rp-count">{t.products_count(reportData.stockData.length)}</span>
              </div>
              <div className="rp-table-wrap">
                <table className="rp-table">
                  <thead>
                    <tr>
                      <th>{t.ref}</th>
                      <th>{t.product}</th>
                      <th>{t.cat}</th>
                      <th className="rp-center">{t.qty}</th>
                      <th className="rp-number">{t.buy_price}</th>
                      <th className="rp-number">{t.sell_price}</th>
                      <th className="rp-number">{t.buy_value}</th>
                      <th className="rp-center">{t.status}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.stockData.length === 0 ? (
                      <tr><td colSpan="8" className="rp-empty">{t.none_products}</td></tr>
                    ) : (
                      reportData.stockData.map((p) => (
                        <tr key={p.id}>
                          <td>{p.reference || p.code || '—'}</td>
                          <td className="rp-product-name">{p.name}</td>
                          <td>{p.categories?.name || p.category?.name || '—'}</td>
                          <td className="rp-center"><strong>{number(p.quantity)}</strong></td>
                          <td className="rp-number">{amt(p.purchase_price || p.cost_price)}</td>
                          <td className="rp-number">{amt(p.sale_price)}</td>
                          <td className="rp-number">{amt(p.purchaseValue)}</td>
                          <td className="rp-center">
                            <span className={`rp-badge ${statusClass[p.statusKey]}`}>{t[`st_${p.statusKey}`]}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. INVENTAIRE */}
          {reportType === 'inventory' && (
            <div className="rp-panel">
              <div className="rp-panel-header">
                <h3><span className="rp-ico"><i className="fas fa-clipboard-list" /></span> {t.inv_title}</h3>
                <button className="rp-btn rp-ghost no-print" onClick={resetInventory}>
                  <i className="fas fa-undo" /> {t.reset}
                </button>
              </div>
              <div className="rp-panel-body">
                <p className="rp-hint">{t.inv_hint}</p>
                <div className="rp-table-wrap">
                  <table className="rp-table">
                    <thead>
                      <tr>
                        <th>{t.ref}</th>
                        <th>{t.product}</th>
                        <th className="rp-center">{t.theoretical}</th>
                        <th className="rp-center">{t.physical}</th>
                        <th className="rp-center">{t.gap}</th>
                        <th className="rp-number">{t.buy_value}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.stockData.map((p) => (
                        <tr key={p.id}>
                          <td>{p.reference || p.code || '—'}</td>
                          <td className="rp-product-name">{p.name}</td>
                          <td className="rp-center">{number(p.quantity)}</td>
                          <td className="rp-center">
                            <input
                              type="number"
                              min="0"
                              className="rp-inventory-input no-print"
                              value={p.physicalInput}
                              onChange={(e) => updatePhysicalCount(p.id, e.target.value)}
                            />
                            <span className="rp-print-only">{p.physicalQuantity}</span>
                          </td>
                          <td className={`rp-center ${p.difference < 0 ? 'rp-negative' : p.difference > 0 ? 'rp-positive' : ''}`}>
                            <bdi className="rp-amt">{p.difference > 0 ? '+' : ''}{p.difference}</bdi>
                          </td>
                          <td className="rp-number">{amt(p.purchaseValue)}</td>
                        </tr>
                      ))}
                      {reportData.stockData.length === 0 && (
                        <tr><td colSpan="6" className="rp-empty">{t.none_products}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. BÉNÉFICES */}
          {reportType === 'profits' && (
            <>
              <div className="rp-panel">
                <div className="rp-panel-header">
                  <h3><span className="rp-ico"><i className="fas fa-calculator" /></span> {t.profits_calc}</h3>
                </div>
                <div className="rp-panel-body">
                  {[
                    [t.revenue, reportData.totalSales],
                    [t.cogs, -reportData.costOfGoods],
                    [t.gross, reportData.grossProfit],
                    [t.expenses, -reportData.totalExpenses],
                  ].map(([label, value]) => (
                    <div className="rp-calc-row" key={label}>
                      <span>{label}</span>
                      <span>{amt(value)} {cur}</span>
                    </div>
                  ))}
                  <div className={`rp-calc-row total ${reportData.netProfit < 0 ? 'loss' : ''}`}>
                    <span>{t.net_upper}</span>
                    <span>{amt(reportData.netProfit)} {cur}</span>
                  </div>
                  <p className="rp-hint" style={{ marginTop: 14 }}>{t.profit_note}</p>
                </div>
              </div>

              <div className="rp-grid-2">
                <div className="rp-panel">
                  <div className="rp-panel-header">
                    <h3><span className="rp-ico"><i className="fas fa-trophy" /></span> {t.best_selling}</h3>
                  </div>
                  <div className="rp-panel-body">
                    {reportData.bestSelling.slice(0, 8).map((p, i) => {
                      const max = reportData.bestSelling[0]?.quantity || 1;
                      return (
                        <div className="rp-chart-row" key={p.id}>
                          <div className="rp-chart-label" title={p.name}>{i + 1}. {p.name}</div>
                          <div className="rp-chart-track">
                            <div className="rp-chart-fill" style={{ width: `${(p.quantity / max) * 100}%` }} />
                          </div>
                          <div className="rp-chart-value">{amt(p.quantity)}</div>
                        </div>
                      );
                    })}
                    {reportData.bestSelling.length === 0 && <div className="rp-empty">{t.no_sales}</div>}
                  </div>
                </div>

                <div className="rp-panel">
                  <div className="rp-panel-header">
                    <h3><span className="rp-ico"><i className="fas fa-sack-dollar" /></span> {t.best_profit}</h3>
                  </div>
                  <div className="rp-panel-body">
                    {reportData.bestProfitable.slice(0, 8).map((p, i) => {
                      const max = Math.max(1, ...reportData.bestProfitable.map((x) => Math.max(0, x.profit)));
                      return (
                        <div className="rp-chart-row" key={p.id}>
                          <div className="rp-chart-label" title={p.name}>{i + 1}. {p.name}</div>
                          <div className="rp-chart-track">
                            <div className="rp-chart-fill green" style={{ width: `${(Math.max(0, p.profit) / max) * 100}%` }} />
                          </div>
                          <div className="rp-chart-value">{amt(p.profit)}</div>
                        </div>
                      );
                    })}
                    {reportData.bestProfitable.length === 0 && <div className="rp-empty">{t.no_data}</div>}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 4. HISTORIQUE & 5. MOUVEMENTS */}
          {(reportType === 'history' || reportType === 'movements') && (
            <div className="rp-panel">
              <div className="rp-panel-header">
                <h3>
                  <span className="rp-ico">
                    <i className={`fas ${reportType === 'history' ? 'fa-clock-rotate-left' : 'fa-right-left'}`} />
                  </span>{' '}
                  {reportType === 'history' ? t.history_title : t.journal_title}
                </h3>
                <span className="rp-count">{t.ops_count(reportData.movements.length)}</span>
              </div>
              <div className="rp-table-wrap">
                <table className="rp-table">
                  <thead>
                    <tr>
                      <th>{t.date}</th>
                      <th>{t.time}</th>
                      <th>{t.type}</th>
                      <th>{t.ref}</th>
                      <th>{t.products}</th>
                      <th className="rp-center">{t.qty}</th>
                      <th className="rp-number">{t.amount}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.movements.map((m) => (
                      <tr key={m.id}>
                        <td><bdi>{formatDate(m.date, t.locale)}</bdi></td>
                        <td><bdi>{formatTime(m.date, t.locale)}</bdi></td>
                        <td>
                          <span className={`rp-badge ${m.direction === 'entree' ? 'rp-entry' : 'rp-exit'}`}>
                            {m.kind === 'sale' ? t.t_sale : t.t_purchase}
                          </span>
                        </td>
                        <td className="rp-product-name"><bdi>{m.reference}</bdi></td>
                        <td>{m.items.map(nameOf).join('، ') || '—'}</td>
                        <td className="rp-center">{m.quantity}</td>
                        <td className="rp-number">{amt(m.amount)} {cur}</td>
                      </tr>
                    ))}
                    {reportData.movements.length === 0 && (
                      <tr><td colSpan="7" className="rp-empty">{t.none_history}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* GRAPHIQUE */}
          {showChart && (
            <div className="rp-panel">
              <div className="rp-panel-header">
                <h3><span className="rp-ico"><i className="fas fa-chart-column" /></span> {t.evolution}</h3>
              </div>
              <div className="rp-panel-body">
                <div className="rp-legend">
                  <span style={{ '--dot': '#0f9d74' }}>{t.legend_sales}</span>
                  <span style={{ '--dot': '#6a4de0' }}>{t.legend_purchases}</span>
                  <span style={{ '--dot': '#e08a0b' }}>{t.legend_expenses}</span>
                </div>

                {reportData.chartData.length === 0 ? (
                  <div className="rp-empty">{t.no_chart}</div>
                ) : (
                  (() => {
                    const max = Math.max(1, ...reportData.chartData.flatMap((d) => [d.sales, d.purchases, d.expenses]));
                    return (
                      <>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 190, overflowX: 'auto', paddingBottom: 10 }}>
                          {reportData.chartData.map((d) => (
                            <div
                              key={d.date}
                              style={{ minWidth: 40, flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 3, borderBottom: '1px solid #e2e8f0' }}
                              title={`${d.date} | ${t.legend_sales}: ${money(d.sales)} | ${t.legend_purchases}: ${money(d.purchases)} | ${t.legend_expenses}: ${money(d.expenses)}`}
                            >
                              {[['sales', '#0f9d74'], ['purchases', '#6a4de0'], ['expenses', '#e08a0b']].map(([key, color]) => (
                                <div
                                  key={key}
                                  style={{ width: 9, maxWidth: '30%', height: `${Math.max(2, (d[key] / max) * 155)}px`, background: color, borderRadius: '4px 4px 0 0' }}
                                />
                              ))}
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', marginTop: 8 }}>
                          {reportData.chartData.map((d) => (
                            <div key={d.date} style={{ minWidth: 40, flex: 1, fontSize: 12, textAlign: 'center', color: '#8896ab' }}>
                              <bdi>{d.date.slice(5)}</bdi>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()
                )}
              </div>
            </div>
          )}

          {/* PIED DE PAGE */}
          <div className="rp-footer">
            Gestistock · {t.generated} <bdi>{today()}</bdi>
            <br />
            {t.range(<bdi key="a">{dateFrom}</bdi>, <bdi key="b">{dateTo}</bdi>)}
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;