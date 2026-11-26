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
      
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');

.rp-page {
  --ink: #17243b;
  --muted: #718096;
  --line: #e5eaf2;
  --bg: #f4f7fc;
  --card: #fff;

  --primary: #2563eb;
  --primary-dark: #1746a2;
  --primary-soft: #eaf1ff;

  --green: #0e9f75;
  --green-soft: #e0f7ef;
  --violet: #7253d6;
  --violet-soft: #eeeaff;
  --amber: #d98a12;
  --amber-soft: #fff3dc;
  --red: #dc4654;
  --red-soft: #ffeaed;
  --blue: #2563eb;
  --blue-soft: #eaf1ff;

  box-sizing: border-box;
  min-height: 100vh;
  width: 100%;
  padding: clamp(12px, 2vw, 24px);
  color: var(--ink);
  background: var(--bg);
  font-family: Inter, "Segoe UI", Tahoma, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.55;
}

.rp-page[lang="ar"] {
  font-family: Cairo, "Noto Sans Arabic", Tahoma, Arial, sans-serif;
}

.rp-page *,
.rp-page *::before,
.rp-page *::after {
  box-sizing: border-box;
}

.rp-page button,
.rp-page input,
.rp-page select {
  font: inherit;
}

.rp-page button:focus-visible,
.rp-page input:focus-visible,
.rp-page select:focus-visible {
  outline: 3px solid rgba(37, 99, 235, .25);
  outline-offset: 2px;
}

/* HEADER */
.rp-hero {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 18px;
  padding: clamp(18px, 2.5vw, 28px);
  margin-bottom: 16px;
  border-radius: 17px;
  color: #fff;
  background: linear-gradient(120deg, #102c60, #2059c5 60%, #259bc9);
  box-shadow: 0 10px 28px rgba(21, 74, 170, .16);
}

.rp-hero::after {
  content: "";
  position: absolute;
  z-index: -1;
  width: 230px;
  height: 230px;
  inset-inline-end: -75px;
  top: -120px;
  border: 30px solid rgba(255,255,255,.08);
  border-radius: 50%;
}

.rp-eyebrow {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 2px;
  opacity: .8;
}

.rp-heading h1 {
  display: flex;
  align-items: center;
  gap: 11px;
  margin: 7px 0 5px;
  font-size: clamp(21px, 2.2vw, 28px);
  line-height: 1.35;
  font-weight: 800;
}

.rp-heading h1 .rp-title-icon {
  display: inline-grid;
  place-items: center;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  border-radius: 11px;
  background: rgba(255,255,255,.16);
  font-size: 17px;
}

.rp-heading p {
  margin: 0;
  color: rgba(255,255,255,.82);
  font-size: 13px;
}

.rp-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.rp-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 9px 13px;
  border: 1px solid transparent;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: .18s ease;
}

.rp-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(.97);
}

.rp-btn:disabled {
  opacity: .6;
  cursor: not-allowed;
}

.rp-light {
  background: #fff;
  color: #1b3a78;
}

.rp-success {
  background: #12a87c;
  color: #fff;
}

.rp-danger {
  background: #e04a58;
  color: #fff;
}

.rp-ghost {
  background: #fff;
  color: #33445f;
  border-color: var(--line);
}

/* TABS */
.rp-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px;
  margin-bottom: 16px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--card);
  box-shadow: 0 3px 10px rgba(20,33,61,.025);
}

.rp-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 9px 12px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  transition: .15s;
}

.rp-tab:hover {
  background: #f2f5fb;
  color: var(--ink);
}

.rp-tab.active {
  background: linear-gradient(135deg, #2563eb, #347df0);
  color: #fff;
  box-shadow: 0 4px 12px rgba(37,99,235,.2);
}

/* FILTERS */
.rp-filter {
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 12px;
  padding: 15px;
  margin-bottom: 17px;
  border: 1px solid var(--line);
  border-radius: 13px;
  background: var(--card);
  box-shadow: 0 3px 10px rgba(20,33,61,.025);
}

.rp-field {
  display: flex;
  flex: 1 1 145px;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.rp-field label {
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
}

.rp-field input,
.rp-field select {
  width: 100%;
  min-width: 0;
  height: 38px;
  padding: 0 10px;
  border: 1px solid #dce3ed;
  border-radius: 8px;
  outline: none;
  background: #fbfcfe;
  color: #2a3a55;
  font-size: 12px;
}

.rp-field input:focus,
.rp-field select:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft);
  background: #fff;
}

.rp-period-label {
  margin-inline-start: auto;
  padding: 8px 11px;
  border-radius: 8px;
  background: var(--primary-soft);
  color: var(--primary-dark);
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

/* STATISTICS */
.rp-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 13px;
  margin-bottom: 18px;
}

.rp-stat {
  position: relative;
  overflow: hidden;
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--line);
  border-inline-start: 4px solid var(--accent);
  border-radius: 12px;
  background: var(--card);
  box-shadow: 0 3px 12px rgba(20,33,61,.035);
  transition: transform .2s, box-shadow .2s;
}

.rp-stat:hover {
  transform: translateY(-2px);
  box-shadow: 0 9px 20px rgba(20,33,61,.07);
}

.rp-stat::after {
  content: "";
  position: absolute;
  inset-inline-end: -30px;
  bottom: -40px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: var(--accent-soft);
  opacity: .65;
}

.rp-stat-top {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 11px;
}

.rp-stat-label {
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
}

.rp-stat-icon {
  display: grid;
  place-items: center;
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 15px;
}

.rp-stat-value {
  position: relative;
  z-index: 1;
  color: var(--ink);
  font-size: clamp(19px, 2vw, 25px);
  font-weight: 800;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.rp-stat-unit {
  color: #8290a5;
  font-size: 11px;
  font-weight: 700;
}

.rp-stat-sub {
  position: relative;
  z-index: 1;
  margin-top: 4px;
  color: var(--accent);
  font-size: 11px;
  font-weight: 700;
}

.tone-blue   { --accent: var(--blue); --accent-soft: var(--blue-soft); }
.tone-green  { --accent: var(--green); --accent-soft: var(--green-soft); }
.tone-violet { --accent: var(--violet); --accent-soft: var(--violet-soft); }
.tone-amber  { --accent: var(--amber); --accent-soft: var(--amber-soft); }
.tone-red    { --accent: var(--red); --accent-soft: var(--red-soft); }

/* PANELS */
.rp-panel {
  overflow: hidden;
  margin-bottom: 18px;
  border: 1px solid var(--line);
  border-radius: 13px;
  background: var(--card);
  box-shadow: 0 3px 12px rgba(20,33,61,.03);
}

.rp-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding: 13px 16px;
  border-bottom: 1px solid #edf1f7;
  background: linear-gradient(180deg, #fbfcff, #fff);
}

.rp-panel-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: #1c2c4a;
  font-size: 14px;
  font-weight: 800;
}

.rp-panel-header h3 .rp-ico {
  display: inline-grid;
  place-items: center;
  flex: 0 0 30px;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 12px;
}

.rp-count {
  padding: 5px 9px;
  border-radius: 7px;
  background: #f1f5fb;
  color: #4b5b75;
  font-size: 11px;
  font-weight: 800;
}

.rp-panel-body {
  padding: 16px;
}

.rp-hint {
  margin: 0 0 13px;
  color: var(--muted);
  font-size: 12px;
}

/* TABLES */
.rp-table-wrap {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.rp-table {
  width: 100%;
  min-width: 720px;
  border-collapse: collapse;
}

.rp-table th {
  padding: 11px 13px;
  border-bottom: 1px solid var(--line);
  background: #f3f6fc;
  color: #5b6b85;
  text-align: start;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}

.rp-table td {
  padding: 11px 13px;
  border-bottom: 1px solid #f0f3f8;
  color: #44546d;
  font-size: 12px;
  vertical-align: middle;
}

.rp-table tbody tr:nth-child(even) td {
  background: #fafbfe;
}

.rp-table tbody tr:hover td {
  background: #eff4ff;
}

.rp-table tr:last-child td {
  border-bottom: 0;
}

.rp-product-name {
  color: #1b2a47 !important;
  font-weight: 800;
}

.rp-number {
  text-align: end !important;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.rp-center {
  text-align: center !important;
}

.rp-amt {
  direction: ltr;
  unicode-bidi: isolate;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.rp-unit {
  color: #8896ab;
  font-size: .85em;
  font-weight: 700;
}

/* STATUS BADGES */
.rp-badge {
  display: inline-block;
  padding: 5px 9px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}

.rp-available {
  background: var(--green-soft);
  color: #0b6a4e;
}

.rp-low {
  background: var(--amber-soft);
  color: #94590a;
}

.rp-out {
  background: var(--red-soft);
  color: #a3212e;
}

.rp-entry {
  background: var(--violet-soft);
  color: #4a32b0;
}

.rp-exit {
  background: var(--green-soft);
  color: #0b6a4e;
}

.rp-empty {
  padding: 30px !important;
  color: #98a5b8 !important;
  text-align: center;
}

/* GRIDS & CHARTS */
.rp-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.rp-chart-row {
  display: grid;
  grid-template-columns: minmax(70px, 140px) minmax(50px, 1fr) 85px;
  align-items: center;
  gap: 9px;
  margin: 12px 0;
  font-size: 12px;
}

.rp-chart-label {
  overflow: hidden;
  color: #5b6b85;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rp-chart-track {
  height: 10px;
  overflow: hidden;
  border-radius: 20px;
  background: #edf1f8;
}

.rp-chart-fill {
  min-width: 3px;
  height: 100%;
  border-radius: 20px;
  background: linear-gradient(90deg, #1f5eea, #4f8cf6);
}

.rp-chart-fill.green {
  background: linear-gradient(90deg, #0f9d74, #3fcfa4);
}

.rp-chart-value {
  color: #2a3a55;
  text-align: end;
  font-weight: 800;
  white-space: nowrap;
}

/* INVENTORY */
.rp-inventory-input {
  width: 85px;
  max-width: 100%;
  padding: 7px;
  border: 1px solid #d5deeb;
  border-radius: 7px;
  background: #fbfcfe;
  text-align: center;
  font: inherit;
}

.rp-inventory-input:focus {
  border-color: var(--primary);
  outline: none;
  box-shadow: 0 0 0 3px var(--primary-soft);
}

.rp-positive {
  color: var(--green) !important;
  font-weight: 800;
}

.rp-negative {
  color: var(--red) !important;
  font-weight: 800;
}

/* PROFIT CALCULATION */
.rp-calc-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px dashed var(--line);
  color: #4b5b75;
  font-size: 13px;
  font-weight: 600;
}

.rp-calc-row > span:last-child {
  text-align: end;
  white-space: nowrap;
}

.rp-calc-row.total {
  padding: 14px;
  margin-top: 7px;
  border: 0;
  border-radius: 10px;
  background: var(--green-soft);
  color: #0b6a4e;
  font-size: 14px;
  font-weight: 800;
}

.rp-calc-row.total.loss {
  background: var(--red-soft);
  color: #a3212e;
}

/* MESSAGES */
.rp-message {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  margin-bottom: 16px;
  border-radius: 10px;
  font-size: 12px;
}

.rp-error {
  border: 1px solid #f6c8cd;
  background: var(--red-soft);
  color: #a3212e;
}

.rp-loading {
  padding: 55px 20px;
  color: var(--muted);
  text-align: center;
}

.rp-loading p {
  margin-top: 12px;
  font-size: 13px;
}

/* LEGEND & FOOTER */
.rp-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
  color: #4b5b75;
  font-size: 12px;
  font-weight: 700;
}

.rp-legend span::before {
  display: inline-block;
  width: 9px;
  height: 9px;
  margin-inline-end: 6px;
  border-radius: 3px;
  background: var(--dot);
  content: "";
}

.rp-footer {
  padding: 15px;
  color: #98a5b8;
  text-align: center;
  font-size: 11px;
}

.rp-print-only {
  display: none;
}

/* TABLET */
@media (max-width: 1050px) {
  .rp-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .rp-period-label {
    margin-inline-start: 0;
  }
}

/* MOBILE */
@media (max-width: 700px) {
  .rp-page {
    padding: 10px;
  }

  .rp-hero {
    align-items: flex-start;
    padding: 17px;
    border-radius: 13px;
  }

  .rp-heading h1 {
    font-size: 20px;
  }

  .rp-heading p {
    font-size: 12px;
  }

  .rp-actions {
    width: 100%;
  }

  .rp-actions .rp-btn {
    flex: 1 1 auto;
    padding: 9px 8px;
    font-size: 11px;
  }

  .rp-tabs {
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: thin;
  }

  .rp-tab {
    flex: 0 0 auto;
  }

  .rp-filter {
    gap: 10px;
    padding: 12px;
  }

  .rp-field {
    flex: 1 1 calc(50% - 10px);
    min-width: 0;
  }

  .rp-period-label {
    width: 100%;
    text-align: center;
    white-space: normal;
  }

  .rp-stats {
    gap: 9px;
  }

  .rp-stat {
    padding: 12px;
  }

  .rp-stat-label {
    font-size: 11px;
  }

  .rp-stat-value {
    font-size: 19px;
  }

  .rp-stat-icon {
    width: 32px;
    height: 32px;
    flex-basis: 32px;
    font-size: 13px;
  }

  .rp-grid-2 {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .rp-panel-header {
    padding: 11px 12px;
  }

  .rp-panel-body {
    padding: 12px;
  }

  .rp-panel-header h3 {
    font-size: 13px;
  }

  .rp-chart-row {
    grid-template-columns: minmax(65px, 105px) minmax(35px, 1fr) 75px;
    gap: 7px;
    font-size: 11px;
  }
}

/* PETITS MOBILES */
@media (max-width: 420px) {
  .rp-stats {
    grid-template-columns: 1fr 1fr;
  }

  .rp-field {
    flex-basis: 100%;
  }

  .rp-heading h1 {
    font-size: 18px;
  }

  .rp-stat {
    padding: 10px;
  }

  .rp-stat-value {
    font-size: 17px;
  }

  .rp-calc-row {
    font-size: 12px;
  }

  .rp-calc-row.total {
    font-size: 13px;
  }
}

/* PRINT */
@media print {
  @page {
    size: landscape;
    margin: 10mm;
  }

  body {
    background: #fff !important;
  }

  .rp-page {
    padding: 0 !important;
    background: #fff !important;
    font-size: 10px;
  }

  .rp-hero {
    padding: 12px;
    box-shadow: none;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  .no-print,
  .rp-tabs,
  .rp-filter,
  .rp-actions {
    display: none !important;
  }

  .rp-panel,
  .rp-stat {
    box-shadow: none !important;
    break-inside: avoid;
  }

  .rp-stat::after {
    display: none;
  }

  .rp-table {
    min-width: 0;
  }

  .rp-table th,
  .rp-table td {
    padding: 6px;
    font-size: 9px;
  }

  .rp-table th {
    background: #e9eef5 !important;
    color: #14213d !important;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  .rp-grid-2 {
    grid-template-columns: 1fr 1fr;
  }

  .rp-inventory-input {
    display: none !important;
  }

  .rp-print-only {
    display: inline !important;
  }

  .rp-footer {
    padding: 8px;
  }
}

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