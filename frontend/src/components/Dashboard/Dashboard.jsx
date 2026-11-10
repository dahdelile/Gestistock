// src/pages/DashboardPage.jsx
// Page d'accueil Gestistock — bilingue FR / العربية (RTL)
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../../api';
import { useLanguage } from '../../context/LanguageContext';

const I18N = {
  fr: {
    dir: 'ltr', locale: 'fr-FR', currency: 'MRU',
    eyebrow: 'GESTISTOCK / ACCUEIL',
    greet_morning: 'Bonjour', greet_afternoon: 'Bon après-midi', greet_evening: 'Bonsoir',
    welcome: 'voici l’état de votre commerce',
    refresh: 'Actualiser', updated: 'Mis à jour à', loading: 'Chargement des données...',
    error_title: 'Impossible de charger le tableau de bord',
    error_hint: 'Vérifiez votre connexion et que le backend est démarré.',
    error_banner: 'Les données n’ont pas pu être actualisées.', retry: 'Réessayer',
    quick_title: 'Accès rapide',
    q_sales: 'Ventes', q_purchases: 'Achats', q_products: 'Produits', q_expenses: 'Dépenses', q_reports: 'Rapports',
    month_title: 'Activité du mois',
    stat_sales: 'Ventes du mois', stat_sales_sub: 'Chiffre d’affaires',
    stat_purchases: 'Achats du mois', stat_purchases_sub: 'Marchandises achetées',
    stat_expenses: 'Dépenses du mois', stat_expenses_sub: 'Charges et frais',
    stat_result: 'Résultat estimé', stat_result_sub: 'Ventes − achats − dépenses',
    inventory_title: 'Inventaire et partenaires',
    stat_products: 'Total produits', stat_products_sub: 'Références enregistrées',
    stat_suppliers: 'Fournisseurs', stat_suppliers_sub: 'Partenaires actifs',
    stat_customers: 'Clients', stat_customers_sub: 'Clients enregistrés',
    alert_low: 'Alertes stock', alert_low_sub: (n) => (n > 0 ? `dont ${n} en rupture` : 'Produits à réapprovisionner'),
    overview_title: 'Aperçu financier du mois',
    overview_sales: 'Ventes', overview_purchases: 'Achats', overview_expenses: 'Dépenses',
    health_title: 'Santé du stock',
    health_ok: 'Bien approvisionnés', health_low: 'Stock faible', health_out: 'En rupture',
    stock_value: 'Valeur du stock', categories: 'Catégories',
    recent_activities: 'Activités récentes', low_stock_alerts: 'Détails des alertes',
    no_activities: 'Aucune activité récente', no_low_stock: 'Tous les produits sont bien approvisionnés',
    view_all_products: 'Voir tous les produits', just_now: 'À l’instant',
  },
  ar: {
    dir: 'rtl', locale: 'ar-u-nu-latn', currency: 'أوقية',
    eyebrow: 'GESTISTOCK / الرئيسية',
    greet_morning: 'صباح الخير', greet_afternoon: 'مساء الخير', greet_evening: 'مساء الخير',
    welcome: 'إليك حالة تجارتك اليوم',
    refresh: 'تحديث', updated: 'آخر تحديث', loading: 'جارٍ تحميل البيانات...',
    error_title: 'تعذّر تحميل لوحة التحكم', error_hint: 'تحقق من الاتصال ومن تشغيل الخادم.',
    error_banner: 'تعذّر تحديث البيانات.', retry: 'إعادة المحاولة',
    quick_title: 'وصول سريع',
    q_sales: 'المبيعات', q_purchases: 'المشتريات', q_products: 'المنتجات', q_expenses: 'المصروفات', q_reports: 'التقارير',
    month_title: 'نشاط الشهر',
    stat_sales: 'مبيعات الشهر', stat_sales_sub: 'رقم الأعمال',
    stat_purchases: 'مشتريات الشهر', stat_purchases_sub: 'البضائع المشتراة',
    stat_expenses: 'مصروفات الشهر', stat_expenses_sub: 'الأعباء والتكاليف',
    stat_result: 'النتيجة التقديرية', stat_result_sub: 'المبيعات − المشتريات − المصروفات',
    inventory_title: 'المخزون والشركاء',
    stat_products: 'إجمالي المنتجات', stat_products_sub: 'المراجع المسجلة',
    stat_suppliers: 'الموردون', stat_suppliers_sub: 'شركاء نشطون',
    stat_customers: 'العملاء', stat_customers_sub: 'العملاء المسجلون',
    alert_low: 'تنبيهات المخزون', alert_low_sub: (n) => (n > 0 ? `منها ${n} نفدت` : 'منتجات بحاجة إلى إعادة تعبئة'),
    overview_title: 'نظرة مالية على الشهر',
    overview_sales: 'المبيعات', overview_purchases: 'المشتريات', overview_expenses: 'المصروفات',
    health_title: 'حالة المخزون',
    health_ok: 'متوفرة بكميات كافية', health_low: 'مخزون منخفض', health_out: 'نفدت',
    stock_value: 'قيمة المخزون', categories: 'الفئات',
    recent_activities: 'الأنشطة الحديثة', low_stock_alerts: 'تفاصيل التنبيهات',
    no_activities: 'لا توجد أنشطة حديثة', no_low_stock: 'كل المنتجات متوفرة بكميات كافية',
    view_all_products: 'عرض كل المنتجات', just_now: 'الآن',
  },
};

const num = (v) => Number(v) || 0;
const formatNumber = (v) => new Intl.NumberFormat('fr-FR').format(num(v));
const formatMoney = (v) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(num(v));
const unwrap = (res) => res?.data?.data ?? res?.data ?? res ?? null;
const asArray = (v) => (Array.isArray(v) ? v : []);

const StatCard = ({ tone, label, sub, icon, to, onNavigate, children }) => {
  const go = () => to && onNavigate(to);
  return (
    <div className={`dash-card tone-${tone}`} role="link" tabIndex={0} onClick={go} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }}>
      <div className="dash-card-info">
        <h3>{label}</h3>
        <div className="value">{children}</div>
        {sub && <div className="sub">{sub}</div>}
      </div>
      <div className="dash-icon"><i className={`fas ${icon}`} /></div>
    </div>
  );
};

const Money = ({ value, cur }) => (
  <><bdi className="dash-amt">{formatMoney(value)}</bdi> <small>{cur}</small></>
);

const DashboardPage = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = I18N[lang];
  const cur = t.currency;

  const [stats, setStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(false);

    const callApi = (method) => Promise.resolve().then(() => dashboardApi[method]());

    const [statsRes, activitiesRes, lowRes] = await Promise.allSettled([
      callApi('getStats'),
      callApi('getRecentActivities'),
      callApi('getLowStockProducts'),
    ]);

    if (statsRes.status === 'fulfilled') {
      setStats(unwrap(statsRes.value) || {});
      setUpdatedAt(new Date());
    } else {
      console.error('Erreur tableau de bord :', statsRes.reason);
      setError(true);
    }

    if (activitiesRes.status === 'fulfilled') setRecentActivities(asArray(unwrap(activitiesRes.value)));
    if (lowRes.status === 'fulfilled') setLowStockItems(asArray(unwrap(lowRes.value)));

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchDashboardData(false); }, [fetchDashboardData]);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? t.greet_morning : hour < 18 ? t.greet_afternoon : t.greet_evening;
  const dateLabel = now.toLocaleDateString(t.locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const monthLabel = now.toLocaleDateString(t.locale, { month: 'long', year: 'numeric' });
  const updatedLabel = updatedAt ? updatedAt.toLocaleTimeString(t.locale, { hour: '2-digit', minute: '2-digit', hour12: false }) : '';

  const sales = num(stats?.monthly_sales);
  const purchases = num(stats?.monthly_purchases);
  const expensesTotal = num(stats?.monthly_expenses);
  const result = sales - purchases - expensesTotal;
  const maxBar = Math.max(sales, purchases, expensesTotal, 1);

  const totalProducts = num(stats?.total_products);
  const lowCount = num(stats?.low_stock);
  const outCount = num(stats?.out_of_stock);
  const okCount = Math.max(0, totalProducts - lowCount - outCount);
  const pct = (n) => (totalProducts > 0 ? (n / totalProducts) * 100 : 0);

  const quickActions = [
    { key: 'sales', label: t.q_sales, icon: 'fa-cash-register', to: '/sales', tone: 'green' },
    { key: 'purchases', label: t.q_purchases, icon: 'fa-cart-shopping', to: '/purchases', tone: 'violet' },
    { key: 'products', label: t.q_products, icon: 'fa-boxes-stacked', to: '/products', tone: 'blue' },
    { key: 'expenses', label: t.q_expenses, icon: 'fa-file-invoice-dollar', to: '/expenses', tone: 'amber' },
    { key: 'reports', label: t.q_reports, icon: 'fa-chart-column', to: '/reports/stock', tone: 'teal' },
  ];

  const shell = (children) => (
    <div className="dash-page" dir={t.dir} lang={lang}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      <style>{dashStyles}</style>
      {children}
    </div>
  );

  if (loading && !stats) return shell(<div className="dash-state"><span className="dash-spinner" />{t.loading}</div>);

  if (error && !stats) return shell(
    <div className="dash-hero dash-hero-error">
      <div className="dash-title">
        <h1><span className="dash-title-icon"><i className="fas fa-triangle-exclamation" /></span>{t.error_title}</h1>
        <p>{t.error_hint}</p>
      </div>
      <button type="button" className="dash-btn-add" onClick={() => fetchDashboardData(false)}><i className="fas fa-rotate" /> {t.retry}</button>
    </div>
  );

  return shell(
    <>
      <header className="dash-hero">
        <div className="dash-title">
          <span className="dash-eyebrow">{t.eyebrow}</span>
          <h1><span className="dash-title-icon"><i className="fas fa-house" /></span>{greeting}, {t.welcome}</h1>
          <p>
            <i className="fa-regular fa-calendar" /> &nbsp;<span className="dash-date">{dateLabel}</span>
            {updatedLabel && <span className="dash-updated"> · {t.updated} <bdi>{updatedLabel}</bdi></span>}
          </p>
        </div>
        <div className="dash-hero-actions">
          <button type="button" className="dash-btn-add" onClick={() => fetchDashboardData(true)} disabled={refreshing}>
            <i className={`fas fa-rotate ${refreshing ? 'fa-spin' : ''}`} /> {t.refresh}
          </button>
        </div>
      </header>

      {error && (
        <div className="dash-alert" role="alert">
          <span><i className="fas fa-circle-exclamation" /> &nbsp;{t.error_banner}</span>
          <button type="button" onClick={() => fetchDashboardData(true)}>{t.retry}</button>
        </div>
      )}

      <section aria-label={t.quick_title}>
        <h2 className="dash-section">{t.quick_title}</h2>
        <div className="dash-quick">
          {quickActions.map((a) => (
            <button key={a.key} type="button" className={`dash-quick-btn tone-${a.tone}`} onClick={() => navigate(a.to)}>
              <span className="dash-quick-icon"><i className={`fas ${a.icon}`} /></span>
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      </section>

      <h2 className="dash-section">{t.month_title} <span className="dash-section-sub">· {monthLabel}</span></h2>
      <section className="dash-stats">
        <StatCard tone="green" label={t.stat_sales} sub={t.stat_sales_sub} icon="fa-chart-line" to="/sales" onNavigate={navigate}>
          <Money value={sales} cur={cur} />
        </StatCard>
        <StatCard tone="violet" label={t.stat_purchases} sub={t.stat_purchases_sub} icon="fa-cart-shopping" to="/purchases" onNavigate={navigate}>
          <Money value={purchases} cur={cur} />
        </StatCard>
        <StatCard tone="amber" label={t.stat_expenses} sub={t.stat_expenses_sub} icon="fa-file-invoice-dollar" to="/expenses" onNavigate={navigate}>
          <Money value={expensesTotal} cur={cur} />
        </StatCard>
        <StatCard tone={result >= 0 ? 'blue' : 'red'} label={t.stat_result} sub={t.stat_result_sub} icon={result >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'} to="/reports/profits" onNavigate={navigate}>
          {result > 0 ? '+' : ''}<Money value={result} cur={cur} />
        </StatCard>
      </section>

      <h2 className="dash-section">{t.inventory_title}</h2>
      <section className="dash-stats">
        <StatCard tone="blue" label={t.stat_products} sub={t.stat_products_sub} icon="fa-boxes-stacked" to="/products" onNavigate={navigate}>
          <bdi className="dash-amt">{formatNumber(stats?.total_products)}</bdi>
        </StatCard>
        <StatCard tone="teal" label={t.stat_suppliers} sub={t.stat_suppliers_sub} icon="fa-truck" to="/suppliers" onNavigate={navigate}>
          <bdi className="dash-amt">{formatNumber(stats?.total_suppliers)}</bdi>
        </StatCard>
        <StatCard tone="violet" label={t.stat_customers} sub={t.stat_customers_sub} icon="fa-users" to="/customers" onNavigate={navigate}>
          <bdi className="dash-amt">{formatNumber(stats?.total_customers)}</bdi>
        </StatCard>
        <StatCard tone={outCount > 0 ? 'red' : 'rose'} label={t.alert_low} sub={t.alert_low_sub(outCount)} icon="fa-triangle-exclamation" to="/products?filter=low-stock" onNavigate={navigate}>
          <bdi className="dash-amt">{formatNumber(stats?.low_stock)}</bdi>
        </StatCard>
      </section>

      <div className="dash-bottom-grid">
        <div className="dash-panel">
          <div className="dash-panel-head">
            <h5><i className="fas fa-chart-simple" style={{ color: 'var(--primary)' }} />{t.overview_title}</h5>
          </div>
          <div className="dash-panel-body">
            {[[t.overview_sales, sales, 'green'], [t.overview_purchases, purchases, 'violet'], [t.overview_expenses, expensesTotal, 'amber']].map(([label, value, tone]) => (
              <div className="dash-bar-row" key={label}>
                <span className="dash-bar-label">{label}</span>
                <div className="dash-bar-track" aria-hidden="true">
                  <div className={`dash-bar-fill fill-${tone}`} style={{ width: `${Math.max(value > 0 ? 3 : 0, (value / maxBar) * 100)}%` }} />
                </div>
                <span className="dash-bar-value"><Money value={value} cur={cur} /></span>
              </div>
            ))}
            <div className={`dash-result ${result >= 0 ? '' : 'loss'}`}>
              <span>{t.stat_result}</span>
              <strong>{result > 0 ? '+' : ''}<Money value={result} cur={cur} /></strong>
            </div>
          </div>
        </div>

        <div className="dash-panel">
          <div className="dash-panel-head">
            <h5><i className="fas fa-heart-pulse" style={{ color: 'var(--green)' }} />{t.health_title}</h5>
          </div>
          <div className="dash-panel-body">
            <div className="dash-seg" role="img" aria-label={`${t.health_ok}: ${okCount}, ${t.health_low}: ${lowCount}, ${t.health_out}: ${outCount}`}>
              {okCount > 0 && <span className="seg-ok" style={{ width: `${pct(okCount)}%` }} />}
              {lowCount > 0 && <span className="seg-low" style={{ width: `${pct(lowCount)}%` }} />}
              {outCount > 0 && <span className="seg-out" style={{ width: `${pct(outCount)}%` }} />}
            </div>
            <ul className="dash-legend">
              <li><i className="dot seg-ok" />{t.health_ok}<strong><bdi className="dash-amt">{formatNumber(okCount)}</bdi></strong></li>
              <li><i className="dot seg-low" />{t.health_low}<strong><bdi className="dash-amt">{formatNumber(lowCount)}</bdi></strong></li>
              <li><i className="dot seg-out" />{t.health_out}<strong><bdi className="dash-amt">{formatNumber(outCount)}</bdi></strong></li>
            </ul>
            <div className="dash-mini-stats">
              <div><span>{t.stock_value}</span><strong><Money value={stats?.stock_value} cur={cur} /></strong></div>
              <div><span>{t.categories}</span><strong><bdi className="dash-amt">{formatNumber(stats?.total_categories)}</bdi></strong></div>
            </div>
          </div>
        </div>
      </div>

      <div className="dash-bottom-grid">
        <div className="dash-panel">
          <div className="dash-panel-head">
            <h5><i className="fas fa-clock" style={{ color: 'var(--primary)' }} />{t.recent_activities}</h5>
            <span className="dash-badge badge-blue">{recentActivities.length}</span>
          </div>
          <ul className="dash-list">
            {recentActivities.length > 0 ? recentActivities.slice(0, 6).map((a, i) => (
              <li key={a.id ?? i} className="dash-list-item">
                <div className="dash-list-avatar" style={{ background: 'var(--primary-soft)', color: a.color || 'var(--primary)' }}>
                  <i className={`fas ${a.icon || 'fa-clock'}`} />
                </div>
                <div className="dash-list-main">
                  <div className="dash-list-title">{a.message}</div>
                  <div className="dash-list-meta">{a.time || t.just_now}</div>
                </div>
              </li>
            )) : (
              <li className="dash-empty"><i className="fas fa-inbox" /><p>{t.no_activities}</p></li>
            )}
          </ul>
        </div>

        <div className="dash-panel">
          <div className="dash-panel-head">
            <h5><i className="fas fa-circle-exclamation" style={{ color: 'var(--red)' }} />{t.low_stock_alerts}</h5>
            <span className="dash-badge badge-rose">{lowStockItems.length}</span>
          </div>
          <ul className="dash-list">
            {lowStockItems.length > 0 ? lowStockItems.slice(0, 5).map((item) => {
              const stock = num(item.stock);
              const threshold = num(item.threshold);
              const critical = stock <= threshold * 0.3;
              const level = threshold > 0 ? Math.min(100, (stock / threshold) * 100) : 0;
              return (
                <li key={item.id} className="dash-list-item clickable" role="link" tabIndex={0} onClick={() => navigate(`/products/${item.id}`)} onKeyDown={(e) => e.key === 'Enter' && navigate(`/products/${item.id}`)}>
                  <div className="dash-list-avatar" style={{ background: 'var(--red-soft)', color: 'var(--red)' }}><i className="fas fa-box" /></div>
                  <div className="dash-list-main">
                    <div className="dash-list-title">{item.name}</div>
                    <div className="dash-list-meta">{item.code || '—'}</div>
                    <div className="dash-mini-track" aria-hidden="true">
                      <div className={`dash-mini-fill ${critical ? 'crit' : 'warn'}`} style={{ width: `${level}%` }} />
                    </div>
                  </div>
                  <span className={`dash-badge ${critical ? 'badge-rose' : 'badge-amber'}`}>
                    <bdi className="dash-amt">{stock} / {threshold}</bdi>
                  </span>
                </li>
              );
            }) : (
              <li className="dash-empty"><i className="fas fa-circle-check" style={{ color: 'var(--green)' }} /><p>{t.no_low_stock}</p></li>
            )}
          </ul>
          <div className="dash-panel-foot">
            <button type="button" className="dash-btn-outline" onClick={() => navigate('/products?filter=low-stock')}>
              {t.view_all_products} <i className={`fas ${t.dir === 'rtl' ? 'fa-arrow-left' : 'fa-arrow-right'}`} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const dashStyles = `
 
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');

/* =========================================
   DASHBOARD - BASE
========================================= */
.dash-page {
  --ink: #14213d;
  --muted: #66748b;
  --line: #e3e9f2;
  --bg: #f2f5fb;
  --card: #fff;

  --primary: #1f5eea;
  --primary-soft: #e8efff;
  --green: #0f9d74;
  --green-soft: #def7ee;
  --violet: #6a4de0;
  --violet-soft: #ece8fd;
  --amber: #e08a0b;
  --amber-soft: #fff0d6;
  --red: #d63c4a;
  --red-soft: #fde8ea;
  --teal: #0e8fa8;
  --teal-soft: #dcf3f8;
  --rose: #c2417c;
  --rose-soft: #fbe6f0;

  width: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: 100vh;
  padding: 20px;
  overflow-x: clip;

  background:
    radial-gradient(1000px 340px at 100% -80px, rgba(31,94,234,.08), transparent 70%),
    var(--bg);

  color: var(--ink);
  font-family: Inter, 'Segoe UI', system-ui, Tahoma, Arial, sans-serif;
  font-size: 15px;
  line-height: 1.5;
}

.dash-page[lang="ar"] {
  font-family: Cairo, 'Noto Sans Arabic', Tahoma, 'Segoe UI', Arial, sans-serif;
}

.dash-page *,
.dash-page *::before,
.dash-page *::after {
  box-sizing: border-box;
}

.dash-amt {
  direction: ltr;
  unicode-bidi: isolate;
  font-variant-numeric: tabular-nums;
}

/* =========================================
   HEADER
========================================= */
.dash-hero {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 18px;

  padding: 24px;
  margin-bottom: 20px;
  border-radius: 20px;
  color: #fff;

  background: linear-gradient(125deg, #0f2f66 0%, #1b55c9 58%, #2aa3d9 100%);
  box-shadow: 0 14px 32px rgba(21,74,170,.2);
}

.dash-hero::after {
  content: "";
  position: absolute;
  z-index: 0;
  width: 250px;
  height: 250px;
  inset-inline-end: -70px;
  top: -115px;
  border: 32px solid rgba(255,255,255,.09);
  border-radius: 50%;
  pointer-events: none;
}

.dash-title,
.dash-hero-actions {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.dash-hero-error {
  flex-direction: column;
  text-align: center;
}

.dash-eyebrow {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1.5px;
  opacity: .78;
}

.dash-title h1 {
  margin: 6px 0;
  font-size: clamp(20px, 2.5vw, 26px);
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 12px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.dash-title-icon {
  flex: 0 0 40px;
  display: inline-grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255,255,255,.16);
  font-size: 18px;
}

.dash-title p {
  margin: 0;
  color: rgba(255,255,255,.84);
  font-size: 14px;
  line-height: 1.8;
}

.dash-updated {
  display: inline-block;
  margin-inline-start: 5px;
}

.dash-btn-add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  padding: 10px 16px;
  border: 0;
  border-radius: 10px;
  background: #fff;
  color: #174078;
  font: inherit;
  font-weight: 800;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,.1);
  transition: transform .18s, box-shadow .18s;
}

.dash-btn-add:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 7px 16px rgba(0,0,0,.14);
}

.dash-btn-add:disabled {
  opacity: .65;
  cursor: wait;
}

/* =========================================
   ALERT
========================================= */
.dash-alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 18px;
  padding: 12px 16px;
  border-radius: 10px;
  background: var(--red-soft);
  color: #a3212e;
  font-size: 14px;
  border: 1px solid #f6c8cd;
}

.dash-alert button {
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

/* =========================================
   SECTION TITLES
========================================= */
.dash-section {
  margin: 20px 0 12px;
  font-size: 16px;
  font-weight: 800;
  color: #3a4a66;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.dash-section::before {
  content: "";
  width: 4px;
  height: 16px;
  flex: 0 0 4px;
  border-radius: 3px;
  background: var(--primary);
}

.dash-section-sub {
  color: var(--muted);
  font-weight: 700;
}

/* =========================================
   QUICK ACCESS
========================================= */
.dash-quick {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.dash-quick-btn {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--card);
  color: var(--ink);
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  text-align: start;
  transition: transform .18s, box-shadow .18s, border-color .18s;
}

.dash-quick-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(20,33,61,.06);
  border-color: var(--accent);
}

.dash-quick-icon {
  flex: 0 0 36px;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 16px;
}

/* =========================================
   STATISTICS
========================================= */
.dash-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 22px;
}

.dash-card {
  position: relative;
  overflow: hidden;
  min-width: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 18px;
  background: var(--card);
  border: 1px solid var(--line);
  border-inline-start: 4px solid var(--accent);
  border-radius: 14px;
  box-shadow: 0 4px 14px rgba(20,33,61,.04);
  transition: transform .2s, box-shadow .2s;
  cursor: pointer;
}

.dash-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(20,33,61,.08);
}

.dash-card:focus-visible,
.dash-quick-btn:focus-visible,
.dash-list-item.clickable:focus-visible,
.dash-btn-add:focus-visible,
.dash-btn-outline:focus-visible {
  outline: 3px solid rgba(31,94,234,.35);
  outline-offset: 3px;
}

.dash-card::after {
  content: "";
  position: absolute;
  inset-inline-end: -30px;
  bottom: -42px;
  width: 105px;
  height: 105px;
  border-radius: 50%;
  background: var(--accent-soft);
  opacity: .7;
  pointer-events: none;
}

.dash-card-info {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.dash-card-info h3 {
  margin: 0 0 7px;
  font-size: 13px;
  color: var(--muted);
  font-weight: 800;
}

.dash-card-info .value {
  font-size: clamp(16px, 1.5vw, 21px);
  font-weight: 800;
  color: var(--ink);
  overflow-wrap: anywhere;
}

.dash-card-info .value small {
  font-size: 12px;
  color: #8896ab;
  font-weight: 700;
}

.dash-card-info .sub {
  margin-top: 5px;
  font-size: 12px;
  color: var(--accent);
  font-weight: 700;
  overflow-wrap: anywhere;
}

.dash-icon {
  position: relative;
  z-index: 1;
  flex: 0 0 42px;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-size: 18px;
  background: var(--accent-soft);
  color: var(--accent);
}

.tone-blue { --accent: var(--primary); --accent-soft: var(--primary-soft); }
.tone-amber { --accent: var(--amber); --accent-soft: var(--amber-soft); }
.tone-violet { --accent: var(--violet); --accent-soft: var(--violet-soft); }
.tone-green { --accent: var(--green); --accent-soft: var(--green-soft); }
.tone-rose { --accent: var(--rose); --accent-soft: var(--rose-soft); }
.tone-teal { --accent: var(--teal); --accent-soft: var(--teal-soft); }
.tone-red { --accent: var(--red); --accent-soft: var(--red-soft); }

/* =========================================
   PANELS
========================================= */
.dash-bottom-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 18px;
}

.dash-panel {
  min-width: 0;
  background: var(--card);
  border-radius: 14px;
  border: 1px solid var(--line);
  overflow: hidden;
  box-shadow: 0 4px 14px rgba(20,33,61,.035);
}

.dash-panel-head {
  padding: 14px 16px;
  border-bottom: 1px solid var(--line);
  background: #fbfcff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.dash-panel-head h5 {
  min-width: 0;
  margin: 0;
  font-size: 15px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-wrap: anywhere;
}

.dash-panel-head h5 i {
  flex: 0 0 auto;
}

.dash-panel-body {
  padding: 16px;
}

.dash-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.badge-blue { background: var(--primary-soft); color: #164aba; }
.badge-amber { background: var(--amber-soft); color: #94590a; }
.badge-rose { background: var(--rose-soft); color: #9c2a62; }

/* =========================================
   FINANCIAL CHART
========================================= */
.dash-bar-row {
  display: grid;
  grid-template-columns: minmax(75px, 90px) minmax(30px, 1fr) auto;
  gap: 10px;
  align-items: center;
  margin-bottom: 15px;
  font-size: 13px;
}

.dash-bar-label {
  color: #4b5b75;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.dash-bar-track {
  min-width: 0;
  height: 10px;
  border-radius: 20px;
  background: #edf1f8;
  overflow: hidden;
}

.dash-bar-fill {
  height: 100%;
  border-radius: 20px;
  transition: width .4s ease;
}

.fill-green { background: #0f9d74; }
.fill-violet { background: #6a4de0; }
.fill-amber { background: #e08a0b; }

.dash-bar-value {
  text-align: end;
  font-weight: 800;
  color: #2a3a55;
  white-space: nowrap;
}

.dash-result {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
  padding: 12px;
  border-radius: 10px;
  background: var(--green-soft);
  color: #0b6a4e;
  font-weight: 700;
  font-size: 14px;
}

.dash-result strong {
  font-size: 16px;
  font-weight: 800;
}

.dash-result.loss {
  background: var(--red-soft);
  color: #a3212e;
}

/* =========================================
   STOCK HEALTH
========================================= */
.dash-seg {
  display: flex;
  height: 12px;
  border-radius: 20px;
  overflow: hidden;
  background: #edf1f8;
  margin-bottom: 16px;
}

.seg-ok { background: #0f9d74; }
.seg-low { background: #e08a0b; }
.seg-out { background: #d63c4a; }

.dash-legend {
  list-style: none;
  margin: 0 0 16px;
  padding: 0;
  display: grid;
  gap: 10px;
}

.dash-legend li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #4b5b75;
  font-weight: 600;
}

.dash-legend strong {
  margin-inline-start: auto;
  color: var(--ink);
  font-weight: 800;
}

.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex: 0 0 8px;
}

.dash-mini-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.dash-mini-stats > div {
  min-width: 0;
  padding: 11px;
  border-radius: 10px;
  background: #f4f7fc;
  border: 1px solid var(--line);
}

.dash-mini-stats span {
  display: block;
  margin-bottom: 3px;
  font-size: 11px;
  font-weight: 800;
  color: var(--muted);
}

.dash-mini-stats strong {
  font-size: 14px;
  font-weight: 800;
  overflow-wrap: anywhere;
}

/* =========================================
   ACTIVITIES AND LOW STOCK
========================================= */
.dash-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.dash-list-item {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f3f8;
}

.dash-list-item:last-child {
  border-bottom: 0;
}

.dash-list-item.clickable:hover {
  background: #f8fafc;
  cursor: pointer;
}

.dash-list-avatar {
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-size: 14px;
}

.dash-list-main {
  flex: 1;
  min-width: 0;
}

.dash-list-title {
  font-weight: 700;
  font-size: 14px;
  color: #2a3a55;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dash-list-meta {
  font-size: 12px;
  color: var(--muted);
  margin-top: 3px;
  overflow-wrap: anywhere;
}

.dash-mini-track {
  height: 4px;
  margin-top: 7px;
  border-radius: 10px;
  background: #edf1f8;
  overflow: hidden;
}

.dash-mini-fill {
  height: 100%;
  border-radius: 10px;
}

.dash-mini-fill.warn { background: var(--amber); }
.dash-mini-fill.crit { background: var(--red); }

.dash-empty {
  padding: 30px 20px;
  text-align: center;
  color: var(--muted);
  font-size: 14px;
}

.dash-empty i {
  display: block;
  font-size: 24px;
  opacity: .5;
  margin-bottom: 8px;
}

/* =========================================
   PANEL FOOTER
========================================= */
.dash-panel-foot {
  padding: 12px 16px;
  border-top: 1px solid var(--line);
  background: #fbfcff;
}

.dash-btn-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  max-width: 100%;
  padding: 9px 13px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: #fff;
  color: var(--primary);
  font: inherit;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

/* =========================================
   LOADING
========================================= */
.dash-state {
  min-height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--muted);
  font-weight: 700;
}

.dash-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #dce5f5;
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: dash-spin .8s linear infinite;
}

@keyframes dash-spin {
  to { transform: rotate(360deg); }
}

/* =========================================
   TABLETS
========================================= */
@media (max-width: 1100px) {
  .dash-page {
    padding: 16px;
  }

  .dash-quick {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .dash-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dash-bottom-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* =========================================
   MOBILE
========================================= */
@media (max-width: 768px) {
  .dash-page {
    padding: 12px;
    font-size: 14px;
  }

  .dash-hero {
    padding: 18px;
    border-radius: 15px;
    gap: 14px;
    margin-bottom: 16px;
  }

  .dash-title {
    width: 100%;
  }

  .dash-title h1 {
    font-size: 19px;
    gap: 9px;
  }

  .dash-title-icon {
    flex-basis: 34px;
    width: 34px;
    height: 34px;
    font-size: 15px;
  }

  .dash-title p {
    font-size: 12px;
  }

  .dash-hero-actions {
    width: 100%;
  }

  .dash-btn-add {
    width: 100%;
    min-height: 44px;
  }

  .dash-section {
    margin: 17px 0 11px;
    font-size: 15px;
  }

  .dash-quick {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 9px;
  }

  .dash-quick-btn {
    padding: 10px;
    font-size: 13px;
  }

  .dash-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 9px;
    margin-bottom: 17px;
  }

  .dash-card {
    padding: 12px;
    gap: 7px;
  }

  .dash-card-info h3 {
    font-size: 11px;
  }

  .dash-card-info .value {
    font-size: 16px;
  }

  .dash-card-info .sub {
    font-size: 10px;
  }

  .dash-icon {
    flex-basis: 30px;
    width: 30px;
    height: 30px;
    font-size: 14px;
  }

  .dash-bottom-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 13px;
  }

  .dash-panel-head {
    padding: 12px;
  }

  .dash-panel-head h5 {
    font-size: 14px;
  }

  .dash-panel-body {
    padding: 13px;
  }

  .dash-bar-row {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      "label value"
      "track track";
    gap: 5px 8px;
    margin-bottom: 14px;
  }

  .dash-bar-label { grid-area: label; }
  .dash-bar-value { grid-area: value; }
  .dash-bar-track { grid-area: track; }

  .dash-list-item {
    padding: 11px 12px;
    gap: 9px;
  }

  .dash-list-title {
    font-size: 13px;
  }

  .dash-list-meta {
    font-size: 11px;
  }
}

/* =========================================
   SMALL PHONES
========================================= */
@media (max-width: 420px) {
  .dash-page {
    padding: 9px;
  }

  .dash-hero {
    padding: 14px;
    border-radius: 12px;
  }

  .dash-title h1 {
    font-size: 16px;
  }

  .dash-eyebrow {
    font-size: 10px;
  }

  .dash-title p {
    font-size: 11px;
  }

  .dash-quick {
    gap: 7px;
  }

  .dash-quick-btn {
    gap: 7px;
    padding: 9px 7px;
    font-size: 12px;
  }

  .dash-quick-icon {
    flex-basis: 30px;
    width: 30px;
    height: 30px;
    font-size: 13px;
  }

  .dash-stats {
    gap: 7px;
  }

  .dash-card {
    padding: 10px 8px;
  }

  .dash-card-info h3 {
    font-size: 10px;
  }

  .dash-card-info .value {
    font-size: 14px;
  }

  .dash-card-info .value small {
    font-size: 10px;
  }

  .dash-card-info .sub {
    font-size: 9px;
  }

  .dash-icon {
    display: none;
  }

  .dash-mini-stats {
    grid-template-columns: minmax(0, 1fr);
  }

  .dash-panel-head h5 {
    font-size: 13px;
  }

  .dash-badge {
    padding: 3px 8px;
    font-size: 11px;
  }
}

/* =========================================
   VERY SMALL PHONES
========================================= */
@media (max-width: 340px) {
  .dash-quick {
    grid-template-columns: minmax(0, 1fr);
  }

  .dash-card-info .value {
    font-size: 13px;
  }

  .dash-list-avatar {
    flex-basis: 30px;
    width: 30px;
    height: 30px;
  }
}

/* =========================================
   RTL
========================================= */
.dash-page[dir="rtl"] {
  text-align: right;
}

.dash-page[dir="rtl"] .dash-title h1 {
  flex-direction: row;
}

.dash-page[dir="rtl"] .dash-bar-value {
  text-align: left;
}

.dash-page[dir="rtl"] .dash-list-item {
  direction: rtl;
}

.dash-page[dir="rtl"] .dash-result,
.dash-page[dir="rtl"] .dash-alert {
  direction: rtl;
}

`;

export default DashboardPage;