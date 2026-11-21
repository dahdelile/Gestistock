// src/pages/ReportsPage.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { salesApi, purchasesApi, expensesApi, productsApi } from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import {
  Table, Button, Card, Spinner, Badge, Form, 
  Alert, Row, Col, InputGroup, Tabs, Tab
} from 'react-bootstrap';

/* =========================================================
   TRADUCTIONS / الترجمة
========================================================= */
const I18N = {
  fr: {
    dir: 'ltr', locale: 'fr-FR', currency: 'MRU', sheet: 'Rapport',
    title_stock: 'Stock actuel', title_history: 'Historique', title_inventory: 'Inventaire',
    title_profits: 'Bénéfices', title_movements: 'Mouvements',
    subtitle: 'Tableau de bord et analyse de votre gestion commerciale',
    refresh: 'Actualiser', excel: 'Excel', print: 'PDF',
    period: 'Période', today: "Aujourd'hui", week: 'Cette semaine', month: 'Ce mois',
    year: 'Cette année', all: 'Toute la période', custom: 'Personnalisée',
    date_from: 'Date début', date_to: 'Date fin', search: 'Recherche', search_ph: 'Produit, référence...',
    category: 'Catégorie', all_categories: 'Toutes les catégories',
    movement_type: 'Type de mouvement', all_movements: 'Tous les mouvements', entries: 'Entrées', exits: 'Sorties',
    loading: 'Chargement des rapports...', error_load: 'Impossible de charger les données.',
    stat_sales: 'Chiffre d’affaires', stat_purchases: 'Total achats', stat_expenses: 'Dépenses',
    stat_net: 'Bénéfice net estimé', stat_products: 'Produits en stock',
    stat_stock_cost: 'Valeur stock (achat)', stat_stock_sale: 'Valeur stock (vente)',
    stat_alerts: 'Alertes stock', alerts_sub: (n) => `dont ${n} en rupture`,
    stock_state: 'État actuel du stock', products_count: (n) => `${n} produit(s)`,
    ref: 'Référence', product: 'Produit', cat: 'Catégorie', qty: 'Quantité',
    buy_price: 'Prix achat', sell_price: 'Prix vente', buy_value: 'Valeur achat',
    status: 'Statut', none_products: 'Aucun produit trouvé.',
    st_ok: 'Disponible', st_low: 'Faible', st_out: 'Rupture',
    inv_title: 'Inventaire physique', reset: 'Réinitialiser',
    inv_hint: 'Saisissez les quantités réellement comptées. Les écarts sont calculés automatiquement.',
    theoretical: 'Stock théorique', physical: 'Stock physique', gap: 'Écart',
    profits_calc: 'Détail du calcul des bénéfices', revenue: 'Chiffre d’affaires',
    cogs: 'Coût des produits vendus', gross: 'Bénéfice brut', expenses: 'Dépenses',
    net_upper: 'BÉNÉFICE NET ESTIMÉ', profit_note: "Le bénéfice est estimé à partir des coûts d'achat disponibles.",
    best_selling: 'Produits les plus vendus', best_profit: 'Produits les plus rentables',
    no_sales: 'Aucune vente pour cette période.', no_data: 'Aucune donnée de vente.',
    history_title: 'Historique des transactions', journal_title: 'Journal des mouvements',
    ops_count: (n) => `${n} opération(s)`, date: 'Date', time: 'Heure', type: 'Type',
    products: 'Produits', amount: 'Montant', none_history: 'Aucun historique trouvé.',
    t_sale: 'Vente', t_purchase: 'Achat',
    evolution: 'Évolution des opérations', legend_sales: 'Ventes',
    legend_purchases: 'Achats', legend_expenses: 'Dépenses',
    no_chart: 'Aucune donnée disponible pour cette période.',
    generated: 'Rapport généré le', range: (a, b) => <>Du {a} au {b}</>,
    unknown: 'Produit inconnu',
  },
  ar: {
    dir: 'rtl', locale: 'ar-u-nu-latn', currency: 'أوقية', sheet: 'تقرير',
    title_stock: 'المخزون الحالي', title_history: 'سجل المعاملات', title_inventory: 'جرد المنتجات',
    title_profits: 'تحليل الأرباح', title_movements: 'حركة المخزون',
    subtitle: 'لوحة متابعة وتحليل لإدارة تجارتك',
    refresh: 'تحديث', excel: 'Excel', print: 'PDF',
    period: 'الفترة', today: 'اليوم', week: 'هذا الأسبوع', month: 'هذا الشهر',
    year: 'هذه السنة', all: 'كل الفترات', custom: 'مخصصة',
    date_from: 'من تاريخ', date_to: 'إلى تاريخ', search: 'بحث', search_ph: 'منتج، مرجع...',
    category: 'الفئة', all_categories: 'كل الفئات',
    movement_type: 'نوع الحركة', all_movements: 'كل الحركات', entries: 'الداخل', exits: 'الخارج',
    loading: 'جارٍ تحميل التقارير...', error_load: 'تعذّر تحميل البيانات.',
    stat_sales: 'رقم المبيعات', stat_purchases: 'إجمالي المشتريات', stat_expenses: 'المصروفات',
    stat_net: 'الربح الصافي التقديري', stat_products: 'المنتجات في المخزون',
    stat_stock_cost: 'قيمة المخزون (شراء)', stat_stock_sale: 'قيمة المخزون (بيع)',
    stat_alerts: 'تنبيهات المخزون', alerts_sub: (n) => `منها ${n} نفدت`,
    stock_state: 'حالة المخزون الحالية', products_count: (n) => `${n} منتج`,
    ref: 'المرجع', product: 'المنتج', cat: 'الفئة', qty: 'الكمية',
    buy_price: 'سعر الشراء', sell_price: 'سعر البيع', buy_value: 'قيمة الشراء',
    status: 'الحالة', none_products: 'لا توجد منتجات.',
    st_ok: 'متوفر', st_low: 'منخفض', st_out: 'نفد',
    inv_title: 'الجرد الفعلي', reset: 'إعادة تعيين',
    inv_hint: 'أدخل الكميات المعدودة فعلياً، وسيُحسب الفرق تلقائياً.',
    theoretical: 'المخزون النظري', physical: 'المخزون الفعلي', gap: 'الفرق',
    profits_calc: 'تفاصيل حساب الأرباح', revenue: 'رقم المبيعات',
    cogs: 'تكلفة المنتجات المباعة', gross: 'الربح الإجمالي', expenses: 'المصروفات',
    net_upper: 'الربح الصافي التقديري', profit_note: 'يُقدَّر الربح اعتماداً على تكاليف الشراء المتوفرة.',
    best_selling: 'المنتجات الأكثر مبيعاً', best_profit: 'المنتجات الأكثر ربحية',
    no_sales: 'لا توجد مبيعات في هذه الفترة.', no_data: 'لا توجد بيانات مبيعات.',
    history_title: 'سجل المبيعات والمشتريات', journal_title: 'سجل الحركات',
    ops_count: (n) => `${n} عملية`, date: 'التاريخ', time: 'الوقت', type: 'النوع',
    products: 'المنتجات', amount: 'المبلغ', none_history: 'لا يوجد سجل.',
    t_sale: 'بيع', t_purchase: 'شراء',
    evolution: 'تطور العمليات', legend_sales: 'المبيعات',
    legend_purchases: 'المشتريات', legend_expenses: 'المصروفات',
    no_chart: 'لا توجد بيانات لهذه الفترة.',
    generated: 'تم إنشاء التقرير في', range: (a, b) => <>من {a} إلى {b}</>,
    unknown: 'منتج غير معروف',
  },
};

/* =========================================================
   UTILITAIRES
========================================================= */
const pad = (n) => String(n).padStart(2, '0');
const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const firstDayOfMonth = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`; };
const money = (value) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(value) || 0);
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
  return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const formatDate = (value, locale) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(locale);
};

const formatTime = (value, locale) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
};

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
const getItemName = (item) => item.product_name || item.products?.name || item.product?.name || item.name || UNKNOWN;
const getItemQuantity = (item) => number(item.quantity || item.qty);
const getItemPrice = (item) => number(item.unit_price || item.price || item.sale_price || item.purchase_price);
const getItemTotal = (item) => {
  const subtotal = item.subtotal ?? item.total;
  return subtotal !== undefined && subtotal !== null ? number(subtotal) : getItemQuantity(item) * getItemPrice(item);
};
const getSaleDate = (sale) => sale.created_at || sale.sale_date || sale.date;
const getPurchaseDate = (purchase) => purchase.created_at || purchase.purchase_date || purchase.date;
const getSaleTotal = (sale) => number(sale.grand_total ?? sale.total ?? sale.amount);
const getPurchaseTotal = (purchase) => number(purchase.grand_total ?? purchase.total ?? purchase.amount);
const isCancelled = (record) => ['cancelled', 'canceled', 'annule', 'annulee', 'annulée', 'rejected'].includes(String(record.status || '').toLowerCase());

const REPORT_KEYS = ['stock', 'history', 'inventory', 'profits', 'movements'];
const REPORT_ICONS = {
  stock: 'fa-boxes-stacked', history: 'fa-clock-rotate-left', inventory: 'fa-clipboard-list',
  profits: 'fa-chart-line', movements: 'fa-right-left',
};

const getBgClass = (tone) => {
  switch(tone) {
    case 'blue': return 'bg-primary text-white';
    case 'green': return 'bg-success text-white';
    case 'violet': return 'bg-info text-white';
    case 'amber': return 'bg-warning text-dark';
    case 'red': return 'bg-danger text-white';
    default: return 'bg-secondary text-white';
  }
};

/* =========================================================
   COMPOSANT PRINCIPAL
========================================================= */
const ReportsPage = () => {
  const location = useLocation();
  const { lang } = useLanguage();
  const t = I18N[lang];

  const [reportType, setReportType] = useState('stock');
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState('');
  const [errorText, setErrorText] = useState('');

  const [period, setPeriod] = useState('month');
  const [dateFrom, setDateFrom] = useState(firstDayOfMonth);
  const [dateTo, setDateTo] = useState(today);
  const [search, setSearch] = useState('');
  const [movementType, setMovementType] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [physicalCounts, setPhysicalCounts] = useState({});

  useEffect(() => {
    const path = location.pathname.toLowerCase();
    if (path.includes('history')) setReportType('history');
    else if (path.includes('inventory')) setReportType('inventory');
    else if (path.includes('profits')) setReportType('profits');
    else if (path.includes('movements')) setReportType('movements');
    else setReportType('stock');
  }, [location.pathname]);

  const fetchData = useCallback(async () => {
    setLoading(true); setErrorKey(''); setErrorText('');
    try {
      const results = await Promise.all([salesApi.getAll(), purchasesApi.getAll(), expensesApi.getAll(), productsApi.getAll()]);
      setSales(getRows(results[0])); setPurchases(getRows(results[1]));
      setExpenses(getRows(results[2])); setProducts(getRows(results[3]));
    } catch (err) {
      console.error('Erreur chargement rapports:', err);
      const serverMessage = err.response?.data?.message;
      if (serverMessage) setErrorText(serverMessage); else setErrorKey('error_load');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const changePeriod = (value) => {
    setPeriod(value); if (value === 'custom') return;
    const now = new Date(); const current = today(); let start = current;
    if (value === 'week') { const day = now.getDay() || 7; const monday = new Date(now); monday.setDate(now.getDate() - day + 1); start = getDateKey(monday); }
    if (value === 'month') start = firstDayOfMonth();
    if (value === 'year') start = `${now.getFullYear()}-01-01`;
    if (value === 'all') start = '2000-01-01';
    setDateFrom(start); setDateTo(current);
  };

  const nameOf = useCallback((item) => { const name = getItemName(item); return name === UNKNOWN ? I18N[lang].unknown : name; }, [lang]);

  const reportData = useMemo(() => {
    const inPeriod = (date) => { const key = getDateKey(date); return Boolean(key) && key >= dateFrom && key <= dateTo; };
    const validSales = sales.filter((s) => !isCancelled(s) && inPeriod(getSaleDate(s)));
    const validPurchases = purchases.filter((p) => !isCancelled(p) && inPeriod(getPurchaseDate(p)));
    const validExpenses = expenses.filter((e) => inPeriod(e.date || e.created_at));

    const totalSales = validSales.reduce((sum, s) => sum + getSaleTotal(s), 0);
    const totalPurchases = validPurchases.reduce((sum, p) => sum + getPurchaseTotal(p), 0);
    const totalExpenses = validExpenses.reduce((sum, e) => sum + number(e.amount), 0);
    const totalStockValue = products.reduce((sum, p) => sum + number(p.quantity) * number(p.purchase_price || p.cost_price), 0);
    const totalSaleStockValue = products.reduce((sum, p) => sum + number(p.quantity) * number(p.sale_price), 0);
    const needle = search.toLowerCase();

    const stockData = products.map((p) => {
      const quantity = number(p.quantity); const purchasePrice = number(p.purchase_price || p.cost_price);
      const salePrice = number(p.sale_price); const raw = physicalCounts[p.id];
      const physicalQuantity = raw !== undefined && raw !== '' ? number(raw) : quantity;
      return { ...p, statusKey: getStatusKey(p), physicalQuantity, physicalInput: raw !== undefined ? raw : quantity,
        difference: physicalQuantity - quantity, purchaseValue: quantity * purchasePrice, saleValue: quantity * salePrice };
    }).filter((p) => {
      const matchesSearch = !search || String(p.name || '').toLowerCase().includes(needle) || String(p.reference || p.code || '').toLowerCase().includes(needle);
      const categoryName = p.categories?.name || p.category?.name || '';
      const matchesCategory = categoryFilter === 'all' || String(p.category_id) === String(categoryFilter) || categoryName === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    const productSales = {};
    validSales.forEach((sale) => {
      getSaleItems(sale).forEach((item) => {
        const id = item.product_id || item.product?.id || item.products?.id || getItemName(item);
        const quantity = getItemQuantity(item); const revenue = getItemTotal(item);
        const product = products.find((p) => String(p.id) === String(id));
        const costPrice = number(item.purchase_price || item.cost_price || item.product?.purchase_price || item.products?.purchase_price || product?.purchase_price || product?.cost_price);
        if (!productSales[id]) productSales[id] = { id, name: nameOf(item), quantity: 0, revenue: 0, cost: 0, profit: 0 };
        productSales[id].quantity += quantity; productSales[id].revenue += revenue;
        productSales[id].cost += quantity * costPrice; productSales[id].profit += revenue - quantity * costPrice;
      });
    });

    const bestSelling = Object.values(productSales).sort((a, b) => b.quantity - a.quantity);
    const bestProfitable = Object.values(productSales).sort((a, b) => b.profit - a.profit);
    const costOfGoods = Object.values(productSales).reduce((sum, p) => sum + p.cost, 0);
    const grossProfit = totalSales - costOfGoods;
    const netProfit = grossProfit - totalExpenses;

    const movements = [
      ...validSales.map((s) => ({ id: `V-${s.id}`, kind: 'sale', date: getSaleDate(s), reference: s.invoice_number || s.reference || `#${s.id}`, items: getSaleItems(s), amount: getSaleTotal(s), quantity: getSaleItems(s).reduce((sum, i) => sum + getItemQuantity(i), 0), direction: 'sortie' })),
      ...validPurchases.map((p) => ({ id: `A-${p.id}`, kind: 'purchase', date: getPurchaseDate(p), reference: p.purchase_number || p.reference || `#${p.id}`, items: getPurchaseItems(p), amount: getPurchaseTotal(p), quantity: getPurchaseItems(p).reduce((sum, i) => sum + getItemQuantity(i), 0), direction: 'entree' })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    const filteredMovements = movements.filter((m) => {
      if (movementType === 'entree' && m.direction !== 'entree') return false;
      if (movementType === 'sortie' && m.direction !== 'sortie') return false;
      if (search) {
        const text = [m.reference, m.kind === 'sale' ? 'vente' : 'achat', ...m.items.map(nameOf)].join(' ').toLowerCase();
        if (!text.includes(needle)) return false;
      }
      return true;
    });

    const dailyStats = {};
    const addDaily = (date, key, value) => {
      const day = getDateKey(date); if (!day) return;
      if (!dailyStats[day]) dailyStats[day] = { date: day, sales: 0, purchases: 0, expenses: 0 };
      dailyStats[day][key] += value;
    };
    validSales.forEach((s) => addDaily(getSaleDate(s), 'sales', getSaleTotal(s)));
    validPurchases.forEach((p) => addDaily(getPurchaseDate(p), 'purchases', getPurchaseTotal(p)));
    validExpenses.forEach((e) => addDaily(e.date || e.created_at, 'expenses', number(e.amount)));
    const chartData = Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date)).slice(-15);

    return { totalSales, totalPurchases, totalExpenses, totalStockValue, totalSaleStockValue, stockData, costOfGoods, grossProfit, netProfit, bestSelling, bestProfitable, movements: filteredMovements, chartData, lowStock: products.filter((p) => getStatusKey(p) === 'low'), outOfStock: products.filter((p) => getStatusKey(p) === 'out') };
  }, [sales, purchases, expenses, products, dateFrom, dateTo, search, movementType, categoryFilter, physicalCounts, nameOf]);

  const exportExcel = () => {
    let rows = []; let fileName = 'Rapport_Gestistock';
    const statusLabel = (key) => t[`st_${key}`];
    if (reportType === 'stock' || reportType === 'inventory') {
      rows = reportData.stockData.map((p) => ({ [t.ref]: p.reference || p.code || '', [t.product]: p.name, [t.cat]: p.categories?.name || p.category?.name || '', [t.theoretical]: p.quantity, [t.physical]: p.physicalQuantity, [t.gap]: p.difference, [t.buy_price]: p.purchase_price || p.cost_price || 0, [t.sell_price]: p.sale_price || 0, [t.buy_value]: p.purchaseValue, [t.sell_value]: p.saleValue, [t.status]: statusLabel(p.statusKey) }));
      fileName = reportType === 'stock' ? 'Stock_Actuel' : 'Inventaire';
    }
    if (reportType === 'history' || reportType === 'movements') {
      rows = reportData.movements.map((m) => ({ [t.type]: m.kind === 'sale' ? t.t_sale : t.t_purchase, [t.ref]: m.reference, [t.date]: formatDate(m.date, t.locale), [t.time]: formatTime(m.date, t.locale), [t.products]: m.items.map(nameOf).join(', '), [t.qty]: m.quantity, [t.amount]: m.amount }));
      fileName = reportType === 'history' ? 'Historique' : 'Mouvements';
    }
    if (reportType === 'profits') {
      rows = reportData.bestSelling.map((p) => ({ [t.product]: p.name, [t.qty]: p.quantity, [t.revenue]: p.revenue, [t.cogs]: p.cost, [t.net_upper]: p.profit }));
      fileName = 'Benefices';
    }
    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = rows.length ? Object.keys(rows[0]).map(() => ({ wch: 20 })) : [{ wch: 20 }];
    const workbook = XLSX.utils.book_new();
    if (lang === 'ar') workbook.Workbook = { Views: [{ RTL: true }] };
    XLSX.utils.book_append_sheet(workbook, worksheet, t.sheet);
    XLSX.writeFile(workbook, `${fileName}_${today()}.xlsx`);
  };

  const printPage = () => window.print();
  const updatePhysicalCount = (id, value) => setPhysicalCounts((prev) => ({ ...prev, [id]: value }));
  const resetInventory = () => setPhysicalCounts({});

  const categories = useMemo(() => {
    const map = new Map();
    products.forEach((p) => { const name = p.categories?.name || p.category?.name; if (name) map.set(String(p.category_id || name), { id: p.category_id || name, name }); });
    return Array.from(map.values());
  }, [products]);

  const isStockView = reportType === 'stock' || reportType === 'inventory';
  const stats = isStockView
    ? [
        { label: t.stat_products, value: products.length, icon: 'fa-boxes-stacked', tone: 'blue' },
        { label: t.stat_stock_cost, value: reportData.totalStockValue, icon: 'fa-coins', tone: 'violet', money: true },
        { label: t.stat_stock_sale, value: reportData.totalSaleStockValue, icon: 'fa-tags', tone: 'green', money: true },
        { label: t.stat_alerts, value: reportData.lowStock.length + reportData.outOfStock.length, icon: 'fa-triangle-exclamation', tone: reportData.outOfStock.length > 0 ? 'red' : 'amber', sub: t.alerts_sub(reportData.outOfStock.length) },
      ]
    : [
        { label: t.stat_sales, value: reportData.totalSales, icon: 'fa-cash-register', tone: 'green', money: true },
        { label: t.stat_purchases, value: reportData.totalPurchases, icon: 'fa-cart-shopping', tone: 'violet', money: true },
        { label: t.stat_expenses, value: reportData.totalExpenses, icon: 'fa-wallet', tone: 'amber', money: true },
        { label: t.stat_net, value: reportData.netProfit, icon: 'fa-chart-line', tone: reportData.netProfit >= 0 ? 'blue' : 'red', money: true },
      ];

  const showChart = reportType === 'history' || reportType === 'profits';

  return (
    <div className="container-fluid py-4 reports-compact" dir={t.dir} lang={lang}>
      {/* ====== STATISTIQUES : 4 en ligne horizontale sur mobile ====== */}
      <Row className="mb-4">
        {stats.map((stat, index) => (
          <Col xs={3} md={3} key={index}>
            <Card className={`${getBgClass(stat.tone)} shadow-sm`}>
              <Card.Body className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-0">{stat.label}</h6>
                  <h2 className="mb-0">
                    {stat.money ? (
                      <><bdi className="rp-amt">{money(stat.value)}</bdi> <span style={{ fontSize: '0.8rem' }}>{t.currency}</span></>
                    ) : stat.value}
                  </h2>
                  {stat.sub && <small className="d-block mt-1" style={{ fontSize: '0.65rem' }}>{stat.sub}</small>}
                </div>
                <i className={`fas ${stat.icon}`} style={{ fontSize: '2rem', opacity: 0.8 }}></i>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ====== CARTE PRINCIPALE ====== */}
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h3 className="mb-0 d-flex align-items-center">
              <i className={`fas ${REPORT_ICONS[reportType]} me-2`}></i>
              {t[`title_${reportType}`]}
            </h3>
            <div className="d-flex align-items-center gap-2">
              <Button variant="light" onClick={fetchData} disabled={loading}>
                <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i> <span className="ms-2">{t.refresh}</span>
              </Button>
              <Button variant="outline-success" onClick={exportExcel}>
                <i className="fas fa-file-excel me-1"></i> {t.excel}
              </Button>
              <Button variant="outline-danger" onClick={printPage}>
                <i className="fas fa-file-pdf me-1"></i> {t.print}
              </Button>
            </div>
          </div>
        </Card.Header>

        <Card.Body>
          {/* Filtres Globaux */}
          <Row className="mb-3">
            <Col md={2}>
              <Form.Group>
                <Form.Label className="fw-bold">{t.period}</Form.Label>
                <Form.Select value={period} onChange={(e) => changePeriod(e.target.value)}>
                  <option value="today">{t.today}</option><option value="week">{t.week}</option>
                  <option value="month">{t.month}</option><option value="year">{t.year}</option>
                  <option value="all">{t.all}</option><option value="custom">{t.custom}</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="fw-bold">{t.date_from}</Form.Label>
                <Form.Control type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPeriod('custom'); }} />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="fw-bold">{t.date_to}</Form.Label>
                <Form.Control type="date" value={dateTo} min={dateFrom} onChange={(e) => { setDateTo(e.target.value); setPeriod('custom'); }} />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-bold">{t.search}</Form.Label>
                <InputGroup>
                  <Form.Control type="search" placeholder={t.search_ph} value={search} onChange={(e) => setSearch(e.target.value)} />
                  {search && <Button variant="outline-secondary" onClick={() => setSearch('')}>×</Button>}
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={3} className="d-flex align-items-end">
              <div className="text-muted small mb-1">{t.range(<bdi key="a">{dateFrom}</bdi>, <bdi key="b">{dateTo}</bdi>)}</div>
            </Col>
          </Row>

          <Tabs activeKey={reportType} onSelect={(k) => setReportType(k)} className="mb-3" fill>
            <Tab eventKey="stock" title={<span><i className="fas fa-boxes-stacked me-2"></i>{t.title_stock}</span>}>
              <Row className="mb-3">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="fw-bold">{t.category}</Form.Label>
                    <Form.Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                      <option value="all">{t.all_categories}</option>
                      {categories.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <div className="table-responsive">
                <Table striped bordered hover className="mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th>{t.ref}</th><th>{t.product}</th><th>{t.cat}</th>
                      <th className="text-center">{t.qty}</th><th className="text-end">{t.buy_price}</th>
                      <th className="text-end">{t.sell_price}</th><th className="text-end">{t.buy_value}</th>
                      <th className="text-center">{t.status}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.stockData.length === 0 ? (
                      <tr><td colSpan="8" className="text-center py-4 text-muted">{t.none_products}</td></tr>
                    ) : reportData.stockData.map((p) => (
                      <tr key={p.id}>
                        <td>{p.reference || p.code || '—'}</td>
                        <td className="fw-bold">{p.name}</td>
                        <td>{p.categories?.name || p.category?.name || '—'}</td>
                        <td className="text-center"><strong>{number(p.quantity)}</strong></td>
                        <td className="text-end">{money(p.purchase_price || p.cost_price)}</td>
                        <td className="text-end">{money(p.sale_price)}</td>
                        <td className="text-end fw-bold">{money(p.purchaseValue)}</td>
                        <td className="text-center">
                          <Badge bg={p.statusKey === 'ok' ? 'success' : p.statusKey === 'low' ? 'warning' : 'danger'}>
                            {t[`st_${p.statusKey}`]}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Tab>

            <Tab eventKey="inventory" title={<span><i className="fas fa-clipboard-list me-2"></i>{t.title_inventory}</span>}>
              <div className="d-flex justify-content-end mb-3">
                <Button variant="outline-secondary" onClick={resetInventory}>
                  <i className="fas fa-undo me-1"></i> {t.reset}
                </Button>
              </div>
              <Alert variant="info" className="mb-3"><i className="fas fa-info-circle me-2"></i> {t.inv_hint}</Alert>
              <div className="table-responsive">
                <Table striped bordered hover className="mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th>{t.ref}</th><th>{t.product}</th><th className="text-center">{t.theoretical}</th>
                      <th className="text-center">{t.physical}</th><th className="text-center">{t.gap}</th>
                      <th className="text-end">{t.buy_value}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.stockData.map((p) => (
                      <tr key={p.id}>
                        <td>{p.reference || p.code || '—'}</td>
                        <td className="fw-bold">{p.name}</td>
                        <td className="text-center">{number(p.quantity)}</td>
                        <td className="text-center">
                          <Form.Control type="number" min="0" style={{ width: '80px', display: 'inline-block', textAlign: 'center' }} value={p.physicalInput} onChange={(e) => updatePhysicalCount(p.id, e.target.value)} />
                        </td>
                        <td className={`text-center fw-bold ${p.difference < 0 ? 'text-danger' : p.difference > 0 ? 'text-success' : ''}`}>
                          {p.difference > 0 ? '+' : ''}{p.difference}
                        </td>
                        <td className="text-end">{money(p.purchaseValue)}</td>
                      </tr>
                    ))}
                    {reportData.stockData.length === 0 && <tr><td colSpan="6" className="text-center py-4 text-muted">{t.none_products}</td></tr>}
                  </tbody>
                </Table>
              </div>
            </Tab>

            <Tab eventKey="profits" title={<span><i className="fas fa-chart-line me-2"></i>{t.title_profits}</span>}>
              <Row>
                <Col md={6}>
                  <Card className="mb-3">
                    <Card.Header className="fw-bold"><i className="fas fa-calculator me-2"></i>{t.profits_calc}</Card.Header>
                    <Card.Body>
                      {[[t.revenue, reportData.totalSales], [t.cogs, -reportData.costOfGoods], [t.gross, reportData.grossProfit], [t.expenses, -reportData.totalExpenses]].map(([label, value]) => (
                        <div key={label} className="d-flex justify-content-between py-2 border-bottom">
                          <span>{label}</span><span className="fw-bold">{money(value)} {t.currency}</span>
                        </div>
                      ))}
                      <div className={`d-flex justify-content-between py-3 mt-2 px-3 rounded fw-bold ${reportData.netProfit < 0 ? 'bg-danger text-white' : 'bg-success text-white'}`}>
                        <span>{t.net_upper}</span><span>{money(reportData.netProfit)} {t.currency}</span>
                      </div>
                      <small className="text-muted d-block mt-3">{t.profit_note}</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="mb-3">
                    <Card.Header className="fw-bold"><i className="fas fa-trophy me-2"></i>{t.best_selling}</Card.Header>
                    <Card.Body>
                      {reportData.bestSelling.slice(0, 8).map((p, i) => {
                        const max = reportData.bestSelling[0]?.quantity || 1;
                        return (
                          <div key={p.id} className="mb-2">
                            <div className="d-flex justify-content-between small mb-1">
                              <span className="text-truncate" title={p.name}>{i + 1}. {p.name}</span>
                              <span className="fw-bold">{money(p.quantity)}</span>
                            </div>
                            <div className="progress" style={{ height: '8px' }}>
                              <div className="progress-bar bg-primary" role="progressbar" style={{ width: `${(p.quantity / max) * 100}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                      {reportData.bestSelling.length === 0 && <div className="text-center text-muted py-4">{t.no_sales}</div>}
                    </Card.Body>
                  </Card>
                  <Card>
                    <Card.Header className="fw-bold"><i className="fas fa-sack-dollar me-2"></i>{t.best_profit}</Card.Header>
                    <Card.Body>
                      {reportData.bestProfitable.slice(0, 8).map((p, i) => {
                        const max = Math.max(1, ...reportData.bestProfitable.map((x) => Math.max(0, x.profit)));
                        return (
                          <div key={p.id} className="mb-2">
                            <div className="d-flex justify-content-between small mb-1">
                              <span className="text-truncate" title={p.name}>{i + 1}. {p.name}</span>
                              <span className="fw-bold">{money(p.profit)}</span>
                            </div>
                            <div className="progress" style={{ height: '8px' }}>
                              <div className="progress-bar bg-success" role="progressbar" style={{ width: `${(Math.max(0, p.profit) / max) * 100}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                      {reportData.bestProfitable.length === 0 && <div className="text-center text-muted py-4">{t.no_data}</div>}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Tab>

            <Tab eventKey="history" title={<span><i className="fas fa-clock-rotate-left me-2"></i>{t.title_history}</span>}>
              <div className="table-responsive">
                <Table striped bordered hover className="mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th>{t.date}</th><th>{t.time}</th><th>{t.type}</th><th>{t.ref}</th>
                      <th>{t.products}</th><th className="text-center">{t.qty}</th><th className="text-end">{t.amount}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.movements.map((m) => (
                      <tr key={m.id}>
                        <td><bdi>{formatDate(m.date, t.locale)}</bdi></td>
                        <td><bdi>{formatTime(m.date, t.locale)}</bdi></td>
                        <td><Badge bg={m.direction === 'entree' ? 'info' : 'success'}>{m.kind === 'sale' ? t.t_sale : t.t_purchase}</Badge></td>
                        <td className="fw-bold"><bdi>{m.reference}</bdi></td>
                        <td>{m.items.map(nameOf).join(', ') || '—'}</td>
                        <td className="text-center">{m.quantity}</td>
                        <td className="text-end fw-bold">{money(m.amount)} {t.currency}</td>
                      </tr>
                    ))}
                    {reportData.movements.length === 0 && <tr><td colSpan="7" className="text-center py-4 text-muted">{t.none_history}</td></tr>}
                  </tbody>
                </Table>
              </div>
            </Tab>

            <Tab eventKey="movements" title={<span><i className="fas fa-right-left me-2"></i>{t.title_movements}</span>}>
              <Row className="mb-3">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="fw-bold">{t.movement_type}</Form.Label>
                    <Form.Select value={movementType} onChange={(e) => setMovementType(e.target.value)}>
                      <option value="all">{t.all_movements}</option>
                      <option value="entree">{t.entries}</option>
                      <option value="sortie">{t.exits}</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <div className="table-responsive">
                <Table striped bordered hover className="mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th>{t.date}</th><th>{t.time}</th><th>{t.type}</th><th>{t.ref}</th>
                      <th>{t.products}</th><th className="text-center">{t.qty}</th><th className="text-end">{t.amount}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.movements.map((m) => (
                      <tr key={m.id}>
                        <td><bdi>{formatDate(m.date, t.locale)}</bdi></td>
                        <td><bdi>{formatTime(m.date, t.locale)}</bdi></td>
                        <td><Badge bg={m.direction === 'entree' ? 'info' : 'success'}>{m.kind === 'sale' ? t.t_sale : t.t_purchase}</Badge></td>
                        <td className="fw-bold"><bdi>{m.reference}</bdi></td>
                        <td>{m.items.map(nameOf).join(', ') || '—'}</td>
                        <td className="text-center">{m.quantity}</td>
                        <td className="text-end fw-bold">{money(m.amount)} {t.currency}</td>
                      </tr>
                    ))}
                    {reportData.movements.length === 0 && <tr><td colSpan="7" className="text-center py-4 text-muted">{t.none_history}</td></tr>}
                  </tbody>
                </Table>
              </div>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      {/* ====== GRAPHIQUE D'ÉVOLUTION ====== */}
      {showChart && (
        <Card className="shadow-sm mt-4">
          <Card.Header className="fw-bold"><i className="fas fa-chart-column me-2"></i>{t.evolution}</Card.Header>
          <Card.Body>
            <div className="d-flex flex-wrap gap-3 mb-3 small fw-bold text-muted">
              <span><i className="fas fa-circle me-1" style={{ color: '#0f9d74', fontSize: '0.6rem' }}></i>{t.legend_sales}</span>
              <span><i className="fas fa-circle me-1" style={{ color: '#6a4de0', fontSize: '0.6rem' }}></i>{t.legend_purchases}</span>
              <span><i className="fas fa-circle me-1" style={{ color: '#e08a0b', fontSize: '0.6rem' }}></i>{t.legend_expenses}</span>
            </div>
            {reportData.chartData.length === 0 ? (
              <div className="text-center text-muted py-4">{t.no_chart}</div>
            ) : (() => {
                const max = Math.max(1, ...reportData.chartData.flatMap((d) => [d.sales, d.purchases, d.expenses]));
                return (
                  <>
                    <div className="d-flex align-items-end gap-2 overflow-auto pb-2" style={{ height: '190px' }}>
                      {reportData.chartData.map((d) => (
                        <div key={d.date} className="d-flex align-items-end justify-content-center gap-1 flex-shrink-0" style={{ width: '40px', height: '100%', borderBottom: '1px solid #e2e8f0' }} title={`${d.date} | ${t.legend_sales}: ${money(d.sales)} | ${t.legend_purchases}: ${money(d.purchases)} | ${t.legend_expenses}: ${money(d.expenses)}`}>
                          {[['sales', '#0f9d74'], ['purchases', '#6a4de0'], ['expenses', '#e08a0b']].map(([key, color]) => (
                            <div key={key} style={{ width: '9px', maxWidth: '30%', height: `${Math.max(2, (d[key] / max) * 155)}px`, background: color, borderRadius: '4px 4px 0 0' }} />
                          ))}
                        </div>
                      ))}
                    </div>
                    <div className="d-flex gap-2 overflow-auto mt-2">
                      {reportData.chartData.map((d) => (
                        <div key={d.date} className="text-center text-muted small flex-shrink-0" style={{ width: '40px' }}><bdi>{d.date.slice(5)}</bdi></div>
                      ))}
                    </div>
                  </>
                );
              })()}
          </Card.Body>
        </Card>
      )}

      {/* ====== STYLE COMPACT POUR RÉDUIRE LA TAILLE DU TEXTE ====== */}
      <style>{`
        .reports-compact .card.bg-primary h6, .reports-compact .card.bg-success h6,
        .reports-compact .card.bg-info h6, .reports-compact .card.bg-warning h6,
        .reports-compact .card.bg-danger h6 { font-size: 0.75rem !important; }
        .reports-compact .card.bg-primary h2, .reports-compact .card.bg-success h2,
        .reports-compact .card.bg-info h2, .reports-compact .card.bg-warning h2,
        .reports-compact .card.bg-danger h2 { font-size: 1.25rem !important; }
        .reports-compact .card-header h3 { font-size: 1.1rem !important; }
        .reports-compact .form-label { font-size: 0.8rem !important; margin-bottom: 0.25rem !important; }
        .reports-compact .table th, .reports-compact .table td { font-size: 0.85rem !important; padding: 0.5rem 0.75rem !important; }
        .reports-compact .btn { font-size: 0.85rem !important; }
        .reports-compact .badge { font-size: 0.75rem !important; }
      `}</style>
    </div>
  );
};

export default ReportsPage;