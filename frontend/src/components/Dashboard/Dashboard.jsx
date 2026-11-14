// src/pages/DashboardPage.jsx
// Page d'accueil Gestistock — design amélioré, bilingue FR / العربية (RTL)
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../../api';
import { useLanguage } from '../../context/LanguageContext';

/* =========================================================
   TRADUCTIONS / الترجمة
========================================================= */

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
    unit_products: 'produits',
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
    unit_products: 'منتج',
    stock_value: 'قيمة المخزون', categories: 'الفئات',
    recent_activities: 'الأنشطة الحديثة', low_stock_alerts: 'تفاصيل التنبيهات',
    no_activities: 'لا توجد أنشطة حديثة', no_low_stock: 'كل المنتجات متوفرة بكميات كافية',
    view_all_products: 'عرض كل المنتجات', just_now: 'الآن',
  },
};

/* =========================================================
   UTILITAIRES
========================================================= */

const num = (v) => Number(v) || 0;
const formatNumber = (v) => new Intl.NumberFormat('fr-FR').format(num(v));
const formatMoney = (v) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(num(v));
const unwrap = (res) => res?.data?.data ?? res?.data ?? res ?? null;
const asArray = (v) => (Array.isArray(v) ? v : []);

const Money = ({ value, cur }) => (
  <><bdi className="dash-amt">{formatMoney(value)}</bdi> <small>{cur}</small></>
);

const StatCard = ({ tone, label, sub, icon, to, onNavigate, rtl, children }) => {
  const go = () => to && onNavigate(to);
  return (
    <div
      className={`dash-card tone-${tone}`}
      role="link"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
      }}
    >
      <div className="dash-card-top">
        <span className="dash-icon"><i className={`fas ${icon}`} /></span>
        <i className={`fas ${rtl ? 'fa-chevron-left' : 'fa-chevron-right'} dash-card-arrow`} aria-hidden="true" />
      </div>
      <h3>{label}</h3>
      <div className="value">{children}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
};

/* =========================================================
   PAGE
========================================================= */

const DashboardPage = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = I18N[lang];
  const cur = t.currency;
  const rtl = t.dir === 'rtl';

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

    // Une méthode absente de api.js ne fait plus planter la page.
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

  /* ---------- Valeurs dérivées ---------- */
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? t.greet_morning : hour < 18 ? t.greet_afternoon : t.greet_evening;
  const dateLabel = now.toLocaleDateString(t.locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const monthLabel = now.toLocaleDateString(t.locale, { month: 'long', year: 'numeric' });
  const updatedLabel = updatedAt
    ? updatedAt.toLocaleTimeString(t.locale, { hour: '2-digit', minute: '2-digit', hour12: false })
    : '';

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

  // Anneau de santé du stock (conic-gradient)
  const okEnd = pct(okCount);
  const lowEnd = okEnd + pct(lowCount);
  const donutBg = totalProducts > 0
    ? `conic-gradient(#0f9d74 0 ${okEnd}%, #e08a0b ${okEnd}% ${lowEnd}%, #d63c4a ${lowEnd}% 100%)`
    : '#edf1f8';

  // NB : la route des ventes du menu est /ventes.
  const quickActions = [
    { key: 'sales', label: t.q_sales, icon: 'fa-cash-register', to: '/ventes', tone: 'green' },
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

  if (loading && !stats) {
    return shell(<div className="dash-state"><span className="dash-spinner" />{t.loading}</div>);
  }

  if (error && !stats) {
    return shell(
      <div className="dash-hero dash-hero-error">
        <div className="dash-title">
          <h1><span className="dash-title-icon"><i className="fas fa-triangle-exclamation" /></span>{t.error_title}</h1>
          <p>{t.error_hint}</p>
        </div>
        <button type="button" className="dash-btn-add" onClick={() => fetchDashboardData(false)}>
          <i className="fas fa-rotate" /> {t.retry}
        </button>
      </div>
    );
  }

  return shell(
    <>
      {/* ================= HERO ================= */}
      <header className="dash-hero">
        <div className="dash-hero-top">
          <div className="dash-title">
            <span className="dash-eyebrow">{t.eyebrow}</span>
            <h1>
              <span className="dash-title-icon"><i className="fas fa-house" /></span>
              <span>{greeting}, {t.welcome}</span>
            </h1>
            <p>
              <i className="fa-regular fa-calendar" /> <span className="dash-date">{dateLabel}</span>
              {updatedLabel && <span className="dash-updated"> · {t.updated} <bdi>{updatedLabel}</bdi></span>}
            </p>
          </div>
          <div className="dash-hero-actions">
            <button type="button" className="dash-btn-add" onClick={() => fetchDashboardData(true)} disabled={refreshing}>
              <i className={`fas fa-rotate ${refreshing ? 'fa-spin' : ''}`} /> {t.refresh}
            </button>
          </div>
        </div>

        <div className="dash-hero-chips">
          <div className="dash-chip">
            <span className="dash-chip-icon"><i className="fas fa-chart-line" /></span>
            <div>
              <span className="dash-chip-label">{t.stat_sales}</span>
              <strong><Money value={sales} cur={cur} /></strong>
            </div>
          </div>
          <div className="dash-chip">
            <span className="dash-chip-icon"><i className={`fas ${result >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}`} /></span>
            <div>
              <span className="dash-chip-label">{t.stat_result}</span>
              <strong>{result > 0 ? '+' : ''}<Money value={result} cur={cur} /></strong>
            </div>
          </div>
          <div className="dash-chip">
            <span className="dash-chip-icon"><i className="fas fa-triangle-exclamation" /></span>
            <div>
              <span className="dash-chip-label">{t.alert_low}</span>
              <strong><bdi className="dash-amt">{formatNumber(lowCount + outCount)}</bdi></strong>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="dash-alert" role="alert">
          <span><i className="fas fa-circle-exclamation" /> &nbsp;{t.error_banner}</span>
          <button type="button" onClick={() => fetchDashboardData(true)}>{t.retry}</button>
        </div>
      )}

      {/* ================= ACCÈS RAPIDE ================= */}
      <section aria-label={t.quick_title}>
        <h2 className="dash-section">{t.quick_title}</h2>
        <div className="dash-quick">
          {quickActions.map((a) => (
            <button key={a.key} type="button" className={`dash-quick-btn tone-${a.tone}`} onClick={() => navigate(a.to)}>
              <span className="dash-quick-icon"><i className={`fas ${a.icon}`} /></span>
              <span className="dash-quick-label">{a.label}</span>
              <i className={`fas ${rtl ? 'fa-arrow-left' : 'fa-arrow-right'} dash-quick-arrow`} aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      {/* ================= ACTIVITÉ DU MOIS ================= */}
      <h2 className="dash-section">{t.month_title} <span className="dash-section-sub">· {monthLabel}</span></h2>
      <section className="dash-stats">
        <StatCard tone="green" label={t.stat_sales} sub={t.stat_sales_sub} icon="fa-chart-line" to="/ventes" onNavigate={navigate} rtl={rtl}>
          <Money value={sales} cur={cur} />
        </StatCard>
        <StatCard tone="violet" label={t.stat_purchases} sub={t.stat_purchases_sub} icon="fa-cart-shopping" to="/purchases" onNavigate={navigate} rtl={rtl}>
          <Money value={purchases} cur={cur} />
        </StatCard>
        <StatCard tone="amber" label={t.stat_expenses} sub={t.stat_expenses_sub} icon="fa-file-invoice-dollar" to="/expenses" onNavigate={navigate} rtl={rtl}>
          <Money value={expensesTotal} cur={cur} />
        </StatCard>
        <StatCard tone={result >= 0 ? 'blue' : 'red'} label={t.stat_result} sub={t.stat_result_sub} icon={result >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'} to="/reports/profits" onNavigate={navigate} rtl={rtl}>
          {result > 0 ? '+' : ''}<Money value={result} cur={cur} />
        </StatCard>
      </section>

      {/* ================= INVENTAIRE ================= */}
      <h2 className="dash-section">{t.inventory_title}</h2>
      <section className="dash-stats">
        <StatCard tone="blue" label={t.stat_products} sub={t.stat_products_sub} icon="fa-boxes-stacked" to="/products" onNavigate={navigate} rtl={rtl}>
          <bdi className="dash-amt">{formatNumber(stats?.total_products)}</bdi>
        </StatCard>
        <StatCard tone="teal" label={t.stat_suppliers} sub={t.stat_suppliers_sub} icon="fa-truck" to="/suppliers" onNavigate={navigate} rtl={rtl}>
          <bdi className="dash-amt">{formatNumber(stats?.total_suppliers)}</bdi>
        </StatCard>
        <StatCard tone="violet" label={t.stat_customers} sub={t.stat_customers_sub} icon="fa-users" to="/customers" onNavigate={navigate} rtl={rtl}>
          <bdi className="dash-amt">{formatNumber(stats?.total_customers)}</bdi>
        </StatCard>
        <StatCard tone={outCount > 0 ? 'red' : 'rose'} label={t.alert_low} sub={t.alert_low_sub(outCount)} icon="fa-triangle-exclamation" to="/products?filter=low-stock" onNavigate={navigate} rtl={rtl}>
          <bdi className="dash-amt">{formatNumber(stats?.low_stock)}</bdi>
        </StatCard>
      </section>

      {/* ================= APERÇU FINANCIER + SANTÉ DU STOCK ================= */}
      <div className="dash-bottom-grid">
        <div className="dash-panel">
          <div className="dash-panel-head">
            <h5><span className="dash-panel-ico tone-blue"><i className="fas fa-chart-simple" /></span>{t.overview_title}</h5>
          </div>
          <div className="dash-panel-body">
            {[[t.overview_sales, sales, 'green'], [t.overview_purchases, purchases, 'violet'], [t.overview_expenses, expensesTotal, 'amber']].map(([label, value, tone]) => (
              <div className="dash-bar-row" key={label}>
                <span className="dash-bar-label">{label}</span>
                <div className="dash-bar-track" aria-hidden="true">
                  <div className={`dash-bar-fill fill-${tone}`} style={{ width: `${Math.max(value > 0 ? 4 : 0, (value / maxBar) * 100)}%` }} />
                </div>
                <span className="dash-bar-value"><Money value={value} cur={cur} /></span>
              </div>
            ))}
            <div className={`dash-result ${result >= 0 ? '' : 'loss'}`}>
              <span><i className={`fas ${result >= 0 ? 'fa-circle-check' : 'fa-circle-exclamation'}`} /> {t.stat_result}</span>
              <strong>{result > 0 ? '+' : ''}<Money value={result} cur={cur} /></strong>
            </div>
          </div>
        </div>

        <div className="dash-panel">
          <div className="dash-panel-head">
            <h5><span className="dash-panel-ico tone-green"><i className="fas fa-heart-pulse" /></span>{t.health_title}</h5>
          </div>
          <div className="dash-panel-body">
            <div className="dash-health">
              <div
                className="dash-donut"
                style={{ background: donutBg }}
                role="img"
                aria-label={`${t.health_ok}: ${okCount}, ${t.health_low}: ${lowCount}, ${t.health_out}: ${outCount}`}
              >
                <div className="dash-donut-center">
                  <strong><bdi className="dash-amt">{formatNumber(totalProducts)}</bdi></strong>
                  <span>{t.unit_products}</span>
                </div>
              </div>
              <ul className="dash-legend">
                <li><i className="dot seg-ok" />{t.health_ok}<strong><bdi className="dash-amt">{formatNumber(okCount)}</bdi></strong></li>
                <li><i className="dot seg-low" />{t.health_low}<strong><bdi className="dash-amt">{formatNumber(lowCount)}</bdi></strong></li>
                <li><i className="dot seg-out" />{t.health_out}<strong><bdi className="dash-amt">{formatNumber(outCount)}</bdi></strong></li>
              </ul>
            </div>
            <div className="dash-mini-stats">
              <div><span>{t.stock_value}</span><strong><Money value={stats?.stock_value} cur={cur} /></strong></div>
              <div><span>{t.categories}</span><strong><bdi className="dash-amt">{formatNumber(stats?.total_categories)}</bdi></strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= ACTIVITÉS + ALERTES ================= */}
      <div className="dash-bottom-grid">
        <div className="dash-panel">
          <div className="dash-panel-head">
            <h5><span className="dash-panel-ico tone-blue"><i className="fas fa-clock" /></span>{t.recent_activities}</h5>
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
                  <div className="dash-list-meta"><i className="fa-regular fa-clock" /> {a.time || t.just_now}</div>
                </div>
              </li>
            )) : (
              <li className="dash-empty">
                <span className="dash-empty-ico"><i className="fas fa-inbox" /></span>
                <p>{t.no_activities}</p>
              </li>
            )}
          </ul>
        </div>

        <div className="dash-panel">
          <div className="dash-panel-head">
            <h5><span className="dash-panel-ico tone-red"><i className="fas fa-circle-exclamation" /></span>{t.low_stock_alerts}</h5>
            <span className="dash-badge badge-rose">{lowStockItems.length}</span>
          </div>
          <ul className="dash-list">
            {lowStockItems.length > 0 ? lowStockItems.slice(0, 5).map((item) => {
              const stock = num(item.stock);
              const threshold = num(item.threshold);
              const critical = stock <= threshold * 0.3;
              const level = threshold > 0 ? Math.min(100, (stock / threshold) * 100) : 0;
              return (
                <li
                  key={item.id}
                  className="dash-list-item clickable"
                  role="link"
                  tabIndex={0}
                  onClick={() => navigate(`/products/${item.id}`)}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/products/${item.id}`)}
                >
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
              <li className="dash-empty">
                <span className="dash-empty-ico ok"><i className="fas fa-circle-check" /></span>
                <p>{t.no_low_stock}</p>
              </li>
            )}
          </ul>
          <div className="dash-panel-foot">
            <button type="button" className="dash-btn-outline" onClick={() => navigate('/products?filter=low-stock')}>
              {t.view_all_products} <i className={`fas ${rtl ? 'fa-arrow-left' : 'fa-arrow-right'}`} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

/* =========================================================
   STYLES
========================================================= */

const dashStyles = `
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');

/* ---------- Base (compacte et fluide) ---------- */
  .dash-page {
    --ink: #17243b; --muted: #78869d; --line: #e8edf5; --bg: #f5f7fc; --card: #ffffff;
    --primary: #3867e8; --primary-soft: #edf2ff; --green: #0d9b70; --green-soft: #e6f7f0;
    --violet: #7655db; --violet-soft: #f0ecff; --amber: #df941e; --amber-soft: #fff5e4;
    --red: #dc4b5a; --red-soft: #fff0f1; --teal: #1495a8; --teal-soft: #e6f6f8;
    --rose: #c54c86; --rose-soft: #fcecf4;
    
    width: 100%; min-width: 0; min-height: 100vh;
    padding: clamp(14px, 2vw, 28px);
    overflow-x: clip; color: var(--ink); 
    background: radial-gradient(ellipse at 5% 0%, rgba(56,103,232,.06), transparent 30%), var(--bg);
    font-family: Inter, 'Segoe UI', system-ui, sans-serif; 
    font-size: 15px; /* خط أكبر قليلاً */
    line-height: 1.6;
  }
.dash-page[lang="ar"]{font-family:Cairo,'Noto Sans Arabic',Tahoma,'Segoe UI',Arial,sans-serif;font-size:14.5px}
.dash-page *,.dash-page *::before,.dash-page *::after{box-sizing:border-box}
.dash-amt{direction:ltr;unicode-bidi:isolate;font-variant-numeric:tabular-nums}

/* ---------- Couleurs par ton ---------- */
.tone-blue  {--accent:#1f5eea;--accent-2:#4f8cf6;--accent-soft:#e8efff;--glow:rgba(31,94,234,.30)}
.tone-green {--accent:#0f9d74;--accent-2:#3fcfa4;--accent-soft:#def7ee;--glow:rgba(15,157,116,.30)}
.tone-violet{--accent:#6a4de0;--accent-2:#9b86f2;--accent-soft:#ece8fd;--glow:rgba(106,77,224,.30)}
.tone-amber {--accent:#e08a0b;--accent-2:#f5b94d;--accent-soft:#fff0d6;--glow:rgba(224,138,11,.30)}
.tone-red   {--accent:#d63c4a;--accent-2:#f07c87;--accent-soft:#fde8ea;--glow:rgba(214,60,74,.30)}
.tone-teal  {--accent:#0e8fa8;--accent-2:#3cc1da;--accent-soft:#dcf3f8;--glow:rgba(14,143,168,.30)}
.tone-rose  {--accent:#c2417c;--accent-2:#e47aab;--accent-soft:#fbe6f0;--glow:rgba(194,65,124,.30)}

/* ---------- Animation d'entrée ---------- */
@keyframes dash-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.dash-page > header,.dash-page > section,.dash-page > h2,.dash-page > div.dash-bottom-grid,.dash-page > div.dash-alert{animation:dash-up .45s cubic-bezier(.2,.7,.2,1) both}
.dash-page > :nth-child(4){animation-delay:.04s}
.dash-page > :nth-child(5){animation-delay:.08s}
.dash-page > :nth-child(6){animation-delay:.12s}
.dash-page > :nth-child(7){animation-delay:.16s}
.dash-page > :nth-child(8){animation-delay:.2s}
.dash-page > :nth-child(9){animation-delay:.24s}
.dash-page > :nth-child(10){animation-delay:.28s}

/* ---------- Hero ---------- */
.dash-hero{
  position:relative; isolation:isolate; overflow:hidden; margin-bottom:16px;
  padding:clamp(14px,2vw,22px); border-radius:18px; color:#fff;
  background:
    radial-gradient(circle at 85% 15%, rgba(255,255,255,.18), transparent 38%),
    linear-gradient(135deg,#0a2559 0%,#1b55c9 55%,#22b8e6 100%);
  box-shadow:0 12px 28px rgba(21,74,170,.24);
}
.dash-hero::before{
  content:""; position:absolute; inset:0; z-index:-1; opacity:.22;
  background-image:radial-gradient(rgba(255,255,255,.55) 1px, transparent 1px);
  background-size:20px 20px;
  -webkit-mask-image:linear-gradient(to bottom,#000 0%,transparent 70%);
          mask-image:linear-gradient(to bottom,#000 0%,transparent 70%);
}
.dash-hero::after{content:"";position:absolute;z-index:-1;width:220px;height:220px;inset-inline-end:-70px;top:-100px;border:28px solid rgba(255,255,255,.09);border-radius:50%}
.dash-hero-error{display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center}
.dash-hero-top{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
.dash-title{min-width:0;flex:1 1 280px}
.dash-eyebrow{display:inline-block;padding:3px 10px;border-radius:99px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.22);font-size:10.5px;font-weight:800;letter-spacing:1.4px}
.dash-title h1{margin:8px 0 5px;font-size:clamp(17px,2vw,23px);font-weight:800;display:flex;align-items:center;gap:10px;line-height:1.4;overflow-wrap:anywhere}
.dash-title-icon{flex:0 0 36px;display:inline-grid;place-items:center;width:36px;height:36px;border-radius:11px;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.25);font-size:15px}
.dash-title p{margin:0;color:rgba(255,255,255,.88);font-size:12.5px}
.dash-date{text-transform:capitalize}
.dash-hero-actions{display:flex;align-items:center;gap:8px}
.dash-btn-add{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:38px;padding:8px 14px;border:0;border-radius:10px;background:#fff;color:#14407f;font:inherit;font-weight:800;font-size:13px;cursor:pointer;box-shadow:0 6px 14px rgba(0,0,0,.15);transition:transform .18s,box-shadow .18s}
.dash-btn-add:hover:not(:disabled){transform:translateY(-2px)}
.dash-btn-add:disabled{opacity:.7;cursor:wait}

/* Indicateurs dans le hero */
.dash-hero-chips{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin-top:14px}
.dash-chip{display:flex;align-items:center;gap:10px;min-width:0;padding:9px 12px;border-radius:13px;background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.22);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.dash-chip-icon{flex:0 0 32px;display:grid;place-items:center;width:32px;height:32px;border-radius:10px;background:rgba(255,255,255,.2);font-size:13px}
.dash-chip > div{min-width:0}
.dash-chip-label{display:block;font-size:11px;font-weight:700;opacity:.85}
.dash-chip strong{display:block;font-size:clamp(14px,1.3vw,17px);font-weight:800;letter-spacing:-.2px;overflow-wrap:anywhere}
.dash-chip small{font-size:11px;font-weight:700;opacity:.85}

/* ---------- Alerte ---------- */
.dash-alert{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:14px;padding:10px 14px;border-radius:11px;background:var(--red-soft);color:#a3212e;font-size:13px;border:1px solid #f6c8cd}
.dash-alert button{border:0;background:#fff;color:inherit;font:inherit;font-weight:800;padding:5px 11px;border-radius:7px;cursor:pointer}

/* ---------- Titres de section ---------- */
.dash-section{margin:18px 0 10px;font-size:15px;font-weight:800;color:#2a3a55;display:flex;align-items:center;flex-wrap:wrap;gap:8px}
.dash-section::before{content:"";width:4px;height:15px;flex:0 0 4px;border-radius:3px;background:linear-gradient(180deg,#1f5eea,#22b8e6)}
.dash-section-sub{color:var(--muted);font-weight:700;text-transform:capitalize;font-size:13px}

/* ---------- Accès rapide ---------- */
.dash-quick{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}
.dash-quick-btn{min-width:0;display:flex;align-items:center;gap:10px;padding:9px 11px;border:1px solid var(--line);border-radius:12px;background:var(--card);color:var(--ink);font:inherit;font-size:13.5px;font-weight:800;cursor:pointer;text-align:start;box-shadow:var(--shadow);transition:transform .18s,box-shadow .18s,border-color .18s}
.dash-quick-btn:hover{transform:translateY(-2px);box-shadow:var(--shadow-hover);border-color:var(--accent)}
.dash-quick-icon{flex:0 0 34px;display:grid;place-items:center;width:34px;height:34px;border-radius:10px;color:#fff;font-size:14px;background:linear-gradient(135deg,var(--accent),var(--accent-2));box-shadow:0 5px 11px var(--glow)}
.dash-quick-label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dash-quick-arrow{flex:0 0 auto;font-size:10px;color:#a3b0c4;transition:transform .2s,color .2s}
.dash-quick-btn:hover .dash-quick-arrow{color:var(--accent);transform:translateX(2px)}
.dash-page[dir="rtl"] .dash-quick-btn:hover .dash-quick-arrow{transform:translateX(-2px)}

/* ---------- Cartes de statistiques (horizontales et compactes) ---------- */
.dash-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.dash-card{
  position:relative; overflow:hidden; min-width:0; padding:12px 14px;
  display:grid; grid-template-columns:auto minmax(0,1fr); align-items:center; column-gap:12px; row-gap:1px;
  background:var(--card); border:1px solid var(--line); border-radius:14px;
  box-shadow:var(--shadow); cursor:pointer;
  transition:transform .2s,box-shadow .2s,border-color .2s;
}
.dash-card::before{content:"";position:absolute;inset-inline-start:0;top:0;bottom:0;width:4px;background:linear-gradient(180deg,var(--accent),var(--accent-2))}
.dash-card::after{content:"";position:absolute;inset-inline-end:-26px;bottom:-34px;width:90px;height:90px;border-radius:50%;background:var(--accent-soft);opacity:.7;pointer-events:none}
.dash-card:hover{transform:translateY(-3px);box-shadow:var(--shadow-hover);border-color:var(--accent)}
.dash-card > *{position:relative;z-index:1}
.dash-card-top{display:contents}
.dash-icon{grid-row:1 / 4;display:grid;place-items:center;width:40px;height:40px;border-radius:12px;color:#fff;font-size:16px;background:linear-gradient(135deg,var(--accent),var(--accent-2));box-shadow:0 6px 13px var(--glow)}
.dash-card-arrow{display:none}
.dash-card h3{grid-column:2;margin:0;font-size:12px;color:var(--muted);font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dash-card .value{grid-column:2;font-size:clamp(16px,1.5vw,20px);font-weight:800;letter-spacing:-.3px;color:var(--ink);line-height:1.3;overflow-wrap:anywhere}
.dash-card .value small{font-size:11px;color:#8896ab;font-weight:700;letter-spacing:0}
.dash-card .sub{grid-column:2;justify-self:start;margin-top:3px;padding:1px 8px;border-radius:99px;background:var(--accent-soft);color:var(--accent);font-size:11px;font-weight:800;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* ---------- Panneaux ---------- */
.dash-bottom-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,400px),1fr));gap:12px;margin-top:18px}
.dash-bottom-grid + .dash-bottom-grid{margin-top:12px}
.dash-panel{min-width:0;background:var(--card);border-radius:16px;border:1px solid var(--line);overflow:hidden;box-shadow:var(--shadow)}
.dash-panel-head{padding:11px 16px;border-bottom:1px solid var(--line);background:linear-gradient(180deg,#fbfcff,#fff);display:flex;justify-content:space-between;align-items:center;gap:10px}
.dash-panel-head h5{min-width:0;margin:0;font-size:14.5px;font-weight:800;display:flex;align-items:center;gap:9px;overflow-wrap:anywhere}
.dash-panel-ico{flex:0 0 30px;display:grid;place-items:center;width:30px;height:30px;border-radius:9px;font-size:13px;color:var(--accent);background:var(--accent-soft)}
.dash-panel-body{padding:14px 16px}
.dash-panel-foot{padding:10px 16px;border-top:1px solid var(--line);background:#fbfcff}
.dash-badge{display:inline-block;padding:3px 10px;border-radius:99px;font-size:12px;font-weight:800;white-space:nowrap}
.badge-blue{background:var(--primary-soft);color:#164aba}
.badge-amber{background:var(--amber-soft);color:#94590a}
.badge-rose{background:var(--rose-soft);color:#9c2a62}
.dash-btn-outline{display:inline-flex;align-items:center;justify-content:center;gap:7px;max-width:100%;padding:8px 13px;border:1px solid var(--line);border-radius:9px;background:#fff;color:var(--primary);font:inherit;font-size:13px;font-weight:800;cursor:pointer;transition:.18s}
.dash-btn-outline:hover{background:var(--primary-soft);border-color:#c9daff}

/* ---------- Aperçu financier ---------- */
.dash-bar-row{display:grid;grid-template-columns:minmax(64px,88px) minmax(30px,1fr) auto;gap:10px;align-items:center;margin-bottom:12px;font-size:13px}
.dash-bar-label{color:#4b5b75;font-weight:700;overflow-wrap:anywhere}
.dash-bar-track{min-width:0;height:9px;border-radius:20px;background:#edf1f8;overflow:hidden}
.dash-bar-fill{height:100%;border-radius:20px;transition:width .7s cubic-bezier(.2,.7,.2,1)}
.fill-green{background:linear-gradient(90deg,#0f9d74,#3fcfa4)}
.fill-violet{background:linear-gradient(90deg,#6a4de0,#9b86f2)}
.fill-amber{background:linear-gradient(90deg,#e08a0b,#f5b94d)}
.dash-bar-value{text-align:end;font-weight:800;color:#2a3a55;white-space:nowrap}
.dash-bar-value small{color:#8896ab;font-weight:700;font-size:11px}
.dash-result{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-top:4px;padding:11px 14px;border-radius:12px;color:#fff;font-weight:700;font-size:13px;background:linear-gradient(135deg,#0f9d74,#22c493);box-shadow:0 7px 16px rgba(15,157,116,.25)}
.dash-result strong{font-size:16px;font-weight:800}
.dash-result small{font-weight:700;opacity:.9;font-size:11px}
.dash-result.loss{background:linear-gradient(135deg,#d63c4a,#ef6a75);box-shadow:0 7px 16px rgba(214,60,74,.25)}

/* ---------- Santé du stock ---------- */
.dash-health{display:flex;align-items:center;flex-wrap:wrap;gap:18px;margin-bottom:14px}
.dash-donut{position:relative;flex:0 0 120px;width:120px;height:120px;border-radius:50%;display:grid;place-items:center;box-shadow:0 6px 16px rgba(20,33,61,.12)}
.dash-donut::before{content:"";position:absolute;inset:15px;border-radius:50%;background:#fff;box-shadow:inset 0 2px 6px rgba(20,33,61,.08)}
.dash-donut-center{position:relative;text-align:center;line-height:1.1}
.dash-donut-center strong{display:block;font-size:22px;font-weight:800;color:var(--ink)}
.dash-donut-center span{font-size:11px;font-weight:700;color:var(--muted)}
.dash-legend{flex:1 1 180px;min-width:0;list-style:none;margin:0;padding:0;display:grid;gap:7px}
.dash-legend li{display:flex;align-items:center;gap:9px;padding:7px 10px;border-radius:10px;background:#f6f8fc;font-size:12.5px;color:#4b5b75;font-weight:700}
.dash-legend strong{margin-inline-start:auto;color:var(--ink);font-weight:800;font-size:14px}
.dot{display:inline-block;width:9px;height:9px;border-radius:3px;flex:0 0 9px}
.seg-ok{background:#0f9d74}.seg-low{background:#e08a0b}.seg-out{background:#d63c4a}
.dash-mini-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.dash-mini-stats > div{min-width:0;padding:10px 12px;border-radius:11px;background:linear-gradient(135deg,#f4f7fc,#fff);border:1px solid var(--line)}
.dash-mini-stats span{display:block;margin-bottom:2px;font-size:11.5px;font-weight:800;color:var(--muted)}
.dash-mini-stats strong{font-size:14.5px;font-weight:800;overflow-wrap:anywhere}
.dash-mini-stats small{color:#8896ab;font-weight:700;font-size:11px}

/* ---------- Listes ---------- */
.dash-list{list-style:none;padding:0;margin:0;max-height:340px;overflow-y:auto}
.dash-list-item{min-width:0;display:flex;align-items:center;gap:11px;padding:10px 16px;border-bottom:1px solid #f0f3f8;transition:background .15s}
.dash-list-item:last-child{border-bottom:0}
.dash-list-item.clickable{cursor:pointer}
.dash-list-item.clickable:hover{background:#f3f7ff}
.dash-list-avatar{flex:0 0 34px;width:34px;height:34px;border-radius:10px;display:grid;place-items:center;font-size:13px}
.dash-list-main{flex:1;min-width:0}
.dash-list-title{font-weight:800;font-size:13.5px;color:#2a3a55;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dash-list-meta{font-size:11.5px;color:var(--muted);margin-top:2px;overflow-wrap:anywhere}
.dash-mini-track{height:5px;margin-top:6px;border-radius:10px;background:#edf1f8;overflow:hidden}
.dash-mini-fill{height:100%;border-radius:10px}
.dash-mini-fill.warn{background:linear-gradient(90deg,#e08a0b,#f5b94d)}
.dash-mini-fill.crit{background:linear-gradient(90deg,#d63c4a,#f07c87)}
.dash-empty{padding:24px 16px;text-align:center;color:var(--muted);font-size:13px;font-weight:700}
.dash-empty p{margin:8px 0 0}
.dash-empty-ico{display:inline-grid;place-items:center;width:48px;height:48px;border-radius:50%;background:#eef2f8;color:#9aa8bd;font-size:20px}
.dash-empty-ico.ok{background:var(--green-soft);color:var(--green)}

/* ---------- Chargement ---------- */
.dash-state{min-height:220px;display:flex;align-items:center;justify-content:center;gap:10px;color:var(--muted);font-weight:700}
.dash-spinner{width:22px;height:22px;border:3px solid #dce5f5;border-top-color:var(--primary);border-radius:50%;animation:dash-spin .8s linear infinite}
@keyframes dash-spin{to{transform:rotate(360deg)}}

/* ---------- Accessibilité ---------- */
.dash-card:focus-visible,.dash-quick-btn:focus-visible,.dash-list-item.clickable:focus-visible,
.dash-btn-add:focus-visible,.dash-btn-outline:focus-visible{outline:3px solid rgba(31,94,234,.4);outline-offset:2px}
@media (prefers-reduced-motion:reduce){
  .dash-page *,.dash-page *::before,.dash-page *::after{animation:none!important;transition:none!important}
  .dash-spinner{animation:dash-spin 2s linear infinite!important}
}

/* ---------- Grands écrans : on garde des tailles raisonnables ---------- */
@media (min-width:1800px){
  .dash-page{font-size:15px}
}

/* ---------- Tablettes ---------- */
@media (max-width:1100px){
  .dash-quick{grid-template-columns:repeat(3,minmax(0,1fr))}
  .dash-stats{grid-template-columns:repeat(2,minmax(0,1fr))}
}

/* ---------- Mobiles ---------- */
@media (max-width:640px){
  .dash-hero{border-radius:15px;margin-bottom:12px}
  .dash-hero-actions{width:100%}
  .dash-btn-add{width:100%}
  .dash-hero-chips{margin-top:12px}
  .dash-quick{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
  .dash-quick-btn{padding:8px 9px;gap:8px;font-size:13px}
  .dash-quick-icon{flex-basis:30px;width:30px;height:30px;font-size:12px;border-radius:9px}
  .dash-quick-arrow{display:none}
  .dash-stats{gap:8px}
  .dash-card{padding:10px 11px;column-gap:9px}
  .dash-icon{width:34px;height:34px;font-size:14px;border-radius:10px}
  .dash-card .value{font-size:16px}
  .dash-bar-row{grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"l v" "t t";gap:4px 8px;margin-bottom:11px}
  .dash-bar-label{grid-area:l}.dash-bar-value{grid-area:v}.dash-bar-track{grid-area:t}
  .dash-health{justify-content:center}
  .dash-panel-body{padding:12px}
  .dash-list-item{padding:9px 12px}
}
@media (max-width:380px){
  .dash-stats{grid-template-columns:minmax(0,1fr)}
  .dash-mini-stats{grid-template-columns:minmax(0,1fr)}
}
`;

export default DashboardPage;