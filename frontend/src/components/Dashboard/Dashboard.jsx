// src/pages/DashboardPage.jsx
// Page d'accueil Gestistock — bilingue FR / العربية (RTL)
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../../api';
import { useLanguage } from '../../context/LanguageContext';

/* =========================================================
   TRADUCTIONS / الترجمة
========================================================= */

const I18N = {
  fr: {
    dir: 'ltr',
    locale: 'fr-FR',
    currency: 'MRU',
    eyebrow: 'GESTISTOCK / ACCUEIL',
    greet_morning: 'Bonjour',
    greet_afternoon: 'Bon après-midi',
    greet_evening: 'Bonsoir',
    welcome: 'voici l’état de votre commerce',
    refresh: 'Actualiser',
    updated: 'Mis à jour à',
    loading: 'Chargement des données...',
    error_title: 'Impossible de charger le tableau de bord',
    error_hint: 'Vérifiez votre connexion et que le backend est démarré.',
    error_banner: 'Les données n’ont pas pu être actualisées.',
    retry: 'Réessayer',
    quick_title: 'Accès rapide',
    q_sales: 'Ventes',
    q_purchases: 'Achats',
    q_products: 'Produits',
    q_expenses: 'Dépenses',
    q_reports: 'Rapports',
    month_title: 'Activité du mois',
    stat_sales: 'Ventes du mois',
    stat_sales_sub: 'Chiffre d’affaires',
    stat_purchases: 'Achats du mois',
    stat_purchases_sub: 'Marchandises achetées',
    stat_expenses: 'Dépenses du mois',
    stat_expenses_sub: 'Charges et frais',
    stat_result: 'Résultat estimé',
    stat_result_sub: 'Ventes − achats − dépenses',
    inventory_title: 'Inventaire et partenaires',
    stat_products: 'Total produits',
    stat_products_sub: 'Références enregistrées',
    stat_suppliers: 'Fournisseurs',
    stat_suppliers_sub: 'Partenaires actifs',
    stat_customers: 'Clients',
    stat_customers_sub: 'Clients enregistrés',
    alert_low: 'Alertes stock',
    alert_low_sub: (n) => (n > 0 ? `dont ${n} en rupture` : 'Produits à réapprovisionner'),
    overview_title: 'Aperçu financier du mois',
    overview_sales: 'Ventes',
    overview_purchases: 'Achats',
    overview_expenses: 'Dépenses',
    health_title: 'Santé du stock',
    health_ok: 'Bien approvisionnés',
    health_low: 'Stock faible',
    health_out: 'En rupture',
    stock_value: 'Valeur du stock',
    categories: 'Catégories',
    recent_activities: 'Activités récentes',
    low_stock_alerts: 'Détails des alertes',
    no_activities: 'Aucune activité récente',
    no_low_stock: 'Tous les produits sont bien approvisionnés',
    view_all_products: 'Voir tous les produits',
    just_now: 'À l’instant',
    switch_title: 'Changer de langue',
  },
  ar: {
    dir: 'rtl',
    locale: 'ar-u-nu-latn',
    currency: 'أوقية',
    eyebrow: 'GESTISTOCK / الرئيسية',
    greet_morning: 'صباح الخير',
    greet_afternoon: 'مساء الخير',
    greet_evening: 'مساء الخير',
    welcome: 'إليك حالة تجارتك اليوم',
    refresh: 'تحديث',
    updated: 'آخر تحديث',
    loading: 'جارٍ تحميل البيانات...',
    error_title: 'تعذّر تحميل لوحة التحكم',
    error_hint: 'تحقق من الاتصال ومن تشغيل الخادم.',
    error_banner: 'تعذّر تحديث البيانات.',
    retry: 'إعادة المحاولة',
    quick_title: 'وصول سريع',
    q_sales: 'المبيعات',
    q_purchases: 'المشتريات',
    q_products: 'المنتجات',
    q_expenses: 'المصروفات',
    q_reports: 'التقارير',
    month_title: 'نشاط الشهر',
    stat_sales: 'مبيعات الشهر',
    stat_sales_sub: 'رقم الأعمال',
    stat_purchases: 'مشتريات الشهر',
    stat_purchases_sub: 'البضائع المشتراة',
    stat_expenses: 'مصروفات الشهر',
    stat_expenses_sub: 'الأعباء والتكاليف',
    stat_result: 'النتيجة التقديرية',
    stat_result_sub: 'المبيعات − المشتريات − المصروفات',
    inventory_title: 'المخزون والشركاء',
    stat_products: 'إجمالي المنتجات',
    stat_products_sub: 'المراجع المسجلة',
    stat_suppliers: 'الموردون',
    stat_suppliers_sub: 'شركاء نشطون',
    stat_customers: 'العملاء',
    stat_customers_sub: 'العملاء المسجلون',
    alert_low: 'تنبيهات المخزون',
    alert_low_sub: (n) => (n > 0 ? `منها ${n} نفدت` : 'منتجات بحاجة إلى إعادة تعبئة'),
    overview_title: 'نظرة مالية على الشهر',
    overview_sales: 'المبيعات',
    overview_purchases: 'المشتريات',
    overview_expenses: 'المصروفات',
    health_title: 'حالة المخزون',
    health_ok: 'متوفرة بكميات كافية',
    health_low: 'مخزون منخفض',
    health_out: 'نفدت',
    stock_value: 'قيمة المخزون',
    categories: 'الفئات',
    recent_activities: 'الأنشطة الحديثة',
    low_stock_alerts: 'تفاصيل التنبيهات',
    no_activities: 'لا توجد أنشطة حديثة',
    no_low_stock: 'كل المنتجات متوفرة بكميات كافية',
    view_all_products: 'عرض كل المنتجات',
    just_now: 'الآن',
    switch_title: 'تغيير اللغة',
  },
};


/* =========================================================
   UTILITAIRES
========================================================= */

const num = (v) => Number(v) || 0;
const formatNumber = (v) => new Intl.NumberFormat('fr-FR').format(num(v));
const formatMoney = (v) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(num(v));

// Accepte {data:{data:[...]}}, {data:[...]} ou directement [...]
const unwrap = (res) => res?.data?.data ?? res?.data ?? res ?? null;
const asArray = (v) => (Array.isArray(v) ? v : []);

/* =========================================================
   PETITS COMPOSANTS
========================================================= */

const StatCard = ({ tone, label, sub, icon, to, onNavigate, children }) => {
  const go = () => to && onNavigate(to);
  return (
    <div
      className={`dash-card tone-${tone}`}
      role="link"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          go();
        }
      }}
    >
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
  <>
    <bdi className="dash-amt">{formatMoney(value)}</bdi> <small>{cur}</small>
  </>
);

/* =========================================================
   PAGE
========================================================= */

const DashboardPage = () => {
  const navigate = useNavigate();

  const { lang } = useLanguage(); // langue globale (Header)
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

    // Les 3 requêtes partent en parallèle ; seules les statistiques sont indispensables.
    // callApi : si une méthode n'existe pas dans api.js, l'erreur est capturée
    // (promesse rejetée) au lieu de faire planter la page.
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
    else console.warn(activitiesRes.reason);

    if (lowRes.status === 'fulfilled') setLowStockItems(asArray(unwrap(lowRes.value)));
    else console.warn(lowRes.reason);

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchDashboardData(false);
  }, [fetchDashboardData]);

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

  /* ---------- Chargement initial ---------- */
  if (loading && !stats) {
    return shell(<div className="dash-state"><span className="dash-spinner" />{t.loading}</div>);
  }

  /* ---------- Échec sans aucune donnée ---------- */
  if (error && !stats) {
    return shell(
      <div className="dash-hero dash-hero-error">
        <div className="dash-title">
          <h1>
            <span className="dash-title-icon"><i className="fas fa-triangle-exclamation" /></span>
            {t.error_title}
          </h1>
          <p>{t.error_hint}</p>
        </div>
        <button type="button" className="dash-btn-add" onClick={() => fetchDashboardData(false)}>
          <i className="fas fa-rotate" /> {t.retry}
        </button>
      </div>
    );
  }

  /* ---------- Page principale ---------- */
  return shell(
    <>
      {/* En-tête */}
      <header className="dash-hero">
        <div className="dash-title">
          <span className="dash-eyebrow">{t.eyebrow}</span>
          <h1>
            <span className="dash-title-icon"><i className="fas fa-house" /></span>
            {greeting}, {t.welcome}
          </h1>
          <p>
            <i className="fa-regular fa-calendar" /> &nbsp;<span className="dash-date">{dateLabel}</span>
            {updatedLabel && (
              <span className="dash-updated"> · {t.updated} <bdi>{updatedLabel}</bdi></span>
            )}
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

      {/* Accès rapide */}
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

      {/* Activité du mois */}
      <h2 className="dash-section">
        {t.month_title} <span className="dash-section-sub">· {monthLabel}</span>
      </h2>
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

      {/* Inventaire et partenaires */}
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

      {/* Aperçu financier + santé du stock */}
      <div className="dash-bottom-grid">
        <div className="dash-panel">
          <div className="dash-panel-head">
            <h5><i className="fas fa-chart-simple" style={{ color: 'var(--primary)' }} />{t.overview_title}</h5>
          </div>
          <div className="dash-panel-body">
            {[
              [t.overview_sales, sales, 'green'],
              [t.overview_purchases, purchases, 'violet'],
              [t.overview_expenses, expensesTotal, 'amber'],
            ].map(([label, value, tone]) => (
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
            <div
              className="dash-seg"
              role="img"
              aria-label={`${t.health_ok}: ${okCount}, ${t.health_low}: ${lowCount}, ${t.health_out}: ${outCount}`}
            >
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
              <div>
                <span>{t.stock_value}</span>
                <strong><Money value={stats?.stock_value} cur={cur} /></strong>
              </div>
              <div>
                <span>{t.categories}</span>
                <strong><bdi className="dash-amt">{formatNumber(stats?.total_categories)}</bdi></strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activités + alertes */}
      <div className="dash-bottom-grid">
        <div className="dash-panel">
          <div className="dash-panel-head">
            <h5><i className="fas fa-clock" style={{ color: 'var(--primary)' }} />{t.recent_activities}</h5>
            <span className="dash-badge badge-blue">{recentActivities.length}</span>
          </div>
          <ul className="dash-list">
            {recentActivities.length > 0 ? (
              recentActivities.slice(0, 6).map((a, i) => (
                <li key={a.id ?? i} className="dash-list-item">
                  <div className="dash-list-avatar" style={{ background: 'var(--primary-soft)', color: a.color || 'var(--primary)' }}>
                    <i className={`fas ${a.icon || 'fa-clock'}`} />
                  </div>
                  <div className="dash-list-main">
                    <div className="dash-list-title">{a.message}</div>
                    <div className="dash-list-meta">{a.time || t.just_now}</div>
                  </div>
                </li>
              ))
            ) : (
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
            {lowStockItems.length > 0 ? (
              lowStockItems.slice(0, 5).map((item) => {
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
              })
            ) : (
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

/* =========================================================
   STYLES
========================================================= */


const dashStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');

  .dash-page {
    --ink:#14213d; --muted:#66748b; --line:#e3e9f2; --bg:#f2f5fb; --card:#fff;
    --primary:#1f5eea; --primary-soft:#e8efff;
    --green:#0f9d74; --green-soft:#def7ee;
    --violet:#6a4de0; --violet-soft:#ece8fd;
    --amber:#e08a0b; --amber-soft:#fff0d6;
    --red:#d63c4a; --red-soft:#fde8ea;
    --teal:#0e8fa8; --teal-soft:#dcf3f8;
    --rose:#c2417c; --rose-soft:#fbe6f0;

    width:100%;
    max-width:100%;
    min-width:0;
    min-height:100vh;
    padding:clamp(14px,2.2vw,28px);
    overflow-x:hidden;
    background:radial-gradient(1000px 340px at 100% -80px,rgba(31,94,234,.08),transparent 70%),var(--bg);
    color:var(--ink);
    font-family:Inter,'Segoe UI',system-ui,Tahoma,Arial,sans-serif;
    font-size:20px;
  }

  .dash-page[lang="ar"] {
    font-family:Cairo,'Noto Sans Arabic',Tahoma,'Segoe UI',Arial,sans-serif;
  }

  .dash-page * {
    box-sizing:border-box;
  }

  .dash-page button:focus-visible,
  .dash-page [role="link"]:focus-visible {
    outline:3px solid rgba(31,94,234,.4);
    outline-offset:2px;
  }

  .dash-amt {
    direction:ltr;
    unicode-bidi:isolate;
    font-variant-numeric:tabular-nums;
  }

  /* HEADER */

  .dash-hero {
    position:relative;
    isolation:isolate;
    overflow:hidden;
    display:flex;
    align-items:center;
    justify-content:space-between;
    flex-wrap:wrap;
    gap:18px;
    padding:clamp(20px,3vw,30px);
    margin-bottom:20px;
    border-radius:20px;
    color:#fff;
    background:linear-gradient(125deg,#0f2f66 0%,#1b55c9 58%,#2aa3d9 100%);
    box-shadow:0 14px 32px rgba(21,74,170,.2);
  }

  .dash-hero::after {
    content:"";
    position:absolute;
    z-index:-1;
    width:250px;
    height:250px;
    inset-inline-end:-70px;
    top:-115px;
    border:32px solid rgba(255,255,255,.09);
    border-radius:50%;
  }

  .dash-hero-error {
    flex-direction:column;
    text-align:center;
  }

  .dash-hero-error h1 {
    justify-content:center;
  }

  .dash-eyebrow {
    font-size:12px;
    font-weight:800;
    letter-spacing:1.8px;
    opacity:.78;
  }

  .dash-title {
    min-width:0;
  }

  .dash-title h1 {
    margin:6px 0 5px;
    font-size:clamp(21px,2.7vw,29px);
    font-weight:800;
    display:flex;
    align-items:center;
    gap:12px;
    line-height:1.4;
    overflow-wrap:anywhere;
  }

  .dash-title-icon {
    flex:0 0 42px;
    display:inline-grid;
    place-items:center;
    width:42px;
    height:42px;
    border-radius:12px;
    background:rgba(255,255,255,.16);
    font-size:18px;
  }

  .dash-title p {
    margin:0;
    color:rgba(255,255,255,.84);
    font-size:20px;
    line-height:1.6;
  }

  .dash-date {
    text-transform:capitalize;
  }

  .dash-updated {
    display:inline-block;
  }

  .dash-hero-actions {
    display:flex;
    align-items:center;
    flex-wrap:wrap;
    gap:10px;
    min-width:0;
  }

  .dash-lang {
    display:inline-flex;
    padding:3px;
    border-radius:11px;
    background:rgba(255,255,255,.16);
    border:1px solid rgba(255,255,255,.25);
  }

  .dash-lang button {
    border:0;
    padding:7px 12px;
    border-radius:8px;
    background:transparent;
    color:#fff;
    font:inherit;
    font-size:14px;
    font-weight:800;
    cursor:pointer;
  }

  .dash-lang button.on {
    background:#fff;
    color:#153f92;
  }

  .dash-btn-add {
    display:inline-flex;
    align-items:center;
    justify-content:center;
    gap:8px;
    padding:11px 18px;
    border:0;
    border-radius:11px;
    background:#fff;
    color:#174078;
    font:inherit;
    font-weight:800;
    font-size:18px;
    cursor:pointer;
    box-shadow:0 6px 16px rgba(0,0,0,.14);
    transition:transform .18s;
  }

  .dash-btn-add:hover:not(:disabled) {
    transform:translateY(-2px);
  }

  .dash-btn-add:disabled {
    opacity:.7;
    cursor:wait;
  }

  .dash-btn-outline {
    display:inline-flex;
    align-items:center;
    justify-content:center;
    gap:8px;
    width:100%;
    padding:10px 18px;
    border:1px solid var(--line);
    border-radius:10px;
    background:#fff;
    color:#4b5b75;
    font:inherit;
    font-size:18px;
    font-weight:800;
    cursor:pointer;
    transition:background .18s;
  }

  .dash-btn-outline:hover {
    background:#f1f5fb;
  }

  .dash-alert {
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:12px;
    margin-bottom:18px;
    padding:12px 16px;
    border:1px solid #f6c8cd;
    border-radius:11px;
    background:var(--red-soft);
    color:#a3212e;
    font-size:18px;
  }

  .dash-alert button {
    border:0;
    padding:7px 12px;
    border-radius:8px;
    background:#fff;
    color:#a3212e;
    font:inherit;
    font-size:14px;
    font-weight:800;
    cursor:pointer;
  }

  /* SECTION TITLES */

  .dash-section {
    margin:6px 2px 12px;
    font-size:20px;
    font-weight:800;
    color:#3a4a66;
    letter-spacing:.2px;
    display:flex;
    align-items:center;
    flex-wrap:wrap;
    gap:8px;
  }

  .dash-section::before {
    content:"";
    width:4px;
    height:15px;
    flex:0 0 4px;
    border-radius:3px;
    background:var(--primary);
  }

  .dash-section-sub {
    color:var(--muted);
    font-weight:700;
    text-transform:capitalize;
  }

  /* QUICK ACCESS */

  .dash-quick {
    display:grid;
    grid-template-columns:repeat(5,minmax(0,1fr));
    gap:12px;
    margin-bottom:22px;
  }

  .dash-quick-btn {
    min-width:0;
    display:flex;
    align-items:center;
    gap:11px;
    padding:15px 17px;
    border:1px solid var(--line);
    border-radius:14px;
    background:var(--card);
    color:var(--ink);
    font:inherit;
    font-size:20px;
    font-weight:800;
    cursor:pointer;
    text-align:start;
    box-shadow:0 3px 10px rgba(20,33,61,.03);
    transition:transform .18s,box-shadow .18s,border-color .18s;
  }

  .dash-quick-btn:hover {
    transform:translateY(-2px);
    box-shadow:0 10px 20px rgba(20,33,61,.08);
    border-color:var(--accent);
  }

  .dash-quick-icon {
    flex:0 0 42px;
    display:grid;
    place-items:center;
    width:42px;
    height:42px;
    border-radius:11px;
    background:var(--accent-soft);
    color:var(--accent);
    font-size:21px;
  }

  /* STATISTICS */

  .dash-stats {
    display:grid;
    grid-template-columns:repeat(4,minmax(0,1fr));
    gap:16px;
    margin-bottom:22px;
  }

  .dash-card {
    position:relative;
    overflow:hidden;
    min-width:0;
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    gap:12px;
    padding:20px;
    background:var(--card);
    border:1px solid var(--line);
    border-inline-start:4px solid var(--accent);
    border-radius:16px;
    box-shadow:0 4px 14px rgba(20,33,61,.04);
    transition:transform .2s,box-shadow .2s;
    cursor:pointer;
  }

  .dash-card:hover {
    transform:translateY(-2px);
    box-shadow:0 12px 24px rgba(20,33,61,.08);
  }

  .dash-card::after {
    content:"";
    position:absolute;
    inset-inline-end:-30px;
    bottom:-42px;
    width:105px;
    height:105px;
    border-radius:50%;
    background:var(--accent-soft);
    opacity:.7;
    pointer-events:none;
  }

  .dash-card-info {
    position:relative;
    z-index:1;
    min-width:0;
  }

  .dash-card-info h3 {
    margin:0 0 9px;
    font-size:18px;
    color:var(--muted);
    font-weight:800;
    overflow-wrap:anywhere;
  }

  .dash-card-info .value {
    font-size:clamp(24px,2.4vw,32px);
    font-weight:800;
    letter-spacing:-.3px;
    color:var(--ink);
    overflow-wrap:anywhere;
  }

  .dash-card-info .value small {
    font-size:18px;
    color:#8896ab;
    font-weight:700;
    letter-spacing:0;
  }

  .dash-card-info .sub {
    margin-top:5px;
    font-size:14px;
    color:var(--accent);
    font-weight:700;
  }

  .dash-icon {
    position:relative;
    z-index:1;
    flex:0 0 44px;
    width:44px;
    height:44px;
    border-radius:13px;
    display:grid;
    place-items:center;
    font-size:19px;
    background:var(--accent-soft);
    color:var(--accent);
  }

  .tone-blue {--accent:var(--primary);--accent-soft:var(--primary-soft)}
  .tone-amber {--accent:var(--amber);--accent-soft:var(--amber-soft)}
  .tone-violet {--accent:var(--violet);--accent-soft:var(--violet-soft)}
  .tone-green {--accent:var(--green);--accent-soft:var(--green-soft)}
  .tone-rose {--accent:var(--rose);--accent-soft:var(--rose-soft)}
  .tone-teal {--accent:var(--teal);--accent-soft:var(--teal-soft)}
  .tone-red {--accent:var(--red);--accent-soft:var(--red-soft)}

  /* PANELS */

  .dash-bottom-grid {
    display:grid;
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:16px;
    margin-bottom:6px;
  }

  .dash-panel {
    min-width:0;
    background:var(--card);
    border-radius:16px;
    border:1px solid var(--line);
    overflow:hidden;
    box-shadow:0 4px 14px rgba(20,33,61,.035);
    margin-bottom:16px;
  }

  .dash-panel-head {
    padding:16px 20px;
    border-bottom:1px solid var(--line);
    background:linear-gradient(180deg,#fbfcff,#fff);
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:10px;
  }

  .dash-panel-head h5 {
    min-width:0;
    margin:0;
    font-size:20px;
    font-weight:800;
    display:flex;
    align-items:center;
    gap:9px;
    overflow-wrap:anywhere;
  }

  .dash-panel-body {
    padding:20px;
  }

  .dash-panel-foot {
    padding:0 20px 16px;
  }

  .dash-badge {
    display:inline-block;
    padding:5px 11px;
    border-radius:999px;
    font-size:18px;
    font-weight:800;
    white-space:nowrap;
  }

  .badge-blue {background:var(--primary-soft);color:#164aba}
  .badge-amber {background:var(--amber-soft);color:#94590a}
  .badge-rose {background:var(--rose-soft);color:#9c2a62}

  /* FINANCIAL CHART */

  .dash-bar-row {
    display:grid;
    grid-template-columns:minmax(70px,100px) minmax(0,1fr) minmax(100px,auto);
    gap:12px;
    align-items:center;
    margin-bottom:16px;
    font-size:20px;
    min-width:0;
  }

  .dash-bar-label {
    color:#4b5b75;
    font-weight:700;
  }

  .dash-bar-track {
    height:12px;
    border-radius:20px;
    background:#edf1f8;
    overflow:hidden;
    min-width:0;
  }

  .dash-bar-fill {
    height:100%;
    border-radius:20px;
    transition:width .5s ease;
  }

  .fill-green {background:linear-gradient(90deg,#0f9d74,#3fcfa4)}
  .fill-violet {background:linear-gradient(90deg,#6a4de0,#9b86f2)}
  .fill-amber {background:linear-gradient(90deg,#e08a0b,#f5b94d)}

  .dash-bar-value {
    text-align:end;
    font-weight:800;
    color:#2a3a55;
    white-space:nowrap;
  }

  .dash-bar-value small {
    color:#8896ab;
    font-weight:700;
  }

  .dash-result {
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:10px;
    margin-top:6px;
    padding:14px 16px;
    border-radius:12px;
    background:var(--green-soft);
    color:#0b6a4e;
    font-weight:700;
    font-size:20px;
  }

  .dash-result strong {
    font-size:22px;
    font-weight:800;
  }

  .dash-result.loss {
    background:var(--red-soft);
    color:#a3212e;
  }

  /* STOCK HEALTH */

  .dash-seg {
    display:flex;
    height:16px;
    border-radius:20px;
    overflow:hidden;
    background:#edf1f8;
    margin-bottom:16px;
  }

  .dash-seg span {height:100%}
  .seg-ok {background:#0f9d74}
  .seg-low {background:#e08a0b}
  .seg-out {background:#d63c4a}

  .dash-legend {
    list-style:none;
    margin:0 0 16px;
    padding:0;
    display:grid;
    gap:10px;
  }

  .dash-legend li {
    display:flex;
    align-items:center;
    gap:9px;
    font-size:18px;
    color:#4b5b75;
    font-weight:600;
  }

  .dash-legend strong {
    margin-inline-start:auto;
    color:var(--ink);
    font-weight:800;
  }

  .dot {
    display:inline-block;
    width:10px;
    height:10px;
    border-radius:3px;
    flex:0 0 10px;
  }

  .dash-mini-stats {
    display:grid;
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:12px;
  }

  .dash-mini-stats>div {
    min-width:0;
    padding:12px 14px;
    border-radius:12px;
    background:#f4f7fc;
    border:1px solid var(--line);
  }

  .dash-mini-stats span {
    display:block;
    margin-bottom:4px;
    font-size:13px;
    font-weight:800;
    color:var(--muted);
  }

  .dash-mini-stats strong {
    font-size:17px;
    font-weight:800;
    overflow-wrap:anywhere;
  }

  .dash-mini-stats small {color:#8896ab}

  /* ACTIVITIES AND LOW STOCK */

  .dash-list {
    list-style:none;
    padding:0;
    margin:0;
    max-height:420px;
    overflow-y:auto;
  }

  .dash-list-item {
    min-width:0;
    display:flex;
    align-items:center;
    gap:12px;
    padding:13px 20px;
    border-bottom:1px solid #f0f3f8;
    transition:background .15s;
  }

  .dash-list-item:last-child {border-bottom:0}
  .dash-list-item.clickable {cursor:pointer}
  .dash-list-item.clickable:hover {background:#f3f7ff}

  .dash-list-avatar {
    flex:0 0 40px;
    width:40px;
    height:40px;
    border-radius:10px;
    display:grid;
    place-items:center;
    font-size:15px;
  }

  .dash-list-main {
    flex:1;
    min-width:0;
  }

  .dash-list-title {
    font-weight:700;
    font-size:20px;
    color:#2a3a55;
    overflow:hidden;
    text-overflow:ellipsis;
    white-space:nowrap;
  }

  .dash-list-meta {
    font-size:20px;
    color:var(--muted);
    margin-top:2px;
    overflow-wrap:anywhere;
  }

  .dash-mini-track {
    height:5px;
    margin-top:7px;
    border-radius:10px;
    background:#edf1f8;
    overflow:hidden;
  }

  .dash-mini-fill {
    height:100%;
    border-radius:10px;
  }

  .dash-mini-fill.warn {background:var(--amber)}
  .dash-mini-fill.crit {background:var(--red)}

  .dash-empty {
    padding:34px 20px;
    text-align:center;
    color:var(--muted);
    font-size:19px;
  }

  .dash-empty p {margin:8px 0 0}
  .dash-empty i {font-size:26px;opacity:.65}

  /* LOADING */

  .dash-state {
    padding:90px 20px;
    text-align:center;
    color:var(--muted);
    font-size:20px;
  }

  .dash-spinner {
    display:inline-block;
    width:24px;
    height:24px;
    margin-inline-end:10px;
    vertical-align:middle;
    border:3px solid #dbeafe;
    border-top-color:var(--primary);
    border-radius:50%;
    animation:dash-spin .75s linear infinite;
  }

  @keyframes dash-spin {
    to {transform:rotate(360deg)}
  }

  /* TABLET */

  @media (max-width: 900px) {
    .dash-page {padding:16px}

    .dash-stats {
      grid-template-columns:repeat(2,minmax(0,1fr));
    }

    .dash-quick {
      grid-template-columns:repeat(3,minmax(0,1fr));
    }

    .dash-bottom-grid {
      grid-template-columns:minmax(0,1fr);
    }

    .dash-panel-body {padding:16px}
  }

  /* MOBILE */

  @media (max-width: 600px) {
    .dash-page {padding:12px}

    .dash-hero {
      padding:18px;
      border-radius:15px;
      gap:14px;
    }

    .dash-title h1 {
      font-size:21px;
      gap:9px;
    }

    .dash-title-icon {
      flex-basis:36px;
      width:36px;
      height:36px;
      font-size:15px;
    }

    .dash-title p {
      font-size:14px;
      line-height:1.7;
    }

    .dash-hero-actions {width:100%}

    .dash-btn-add {
      width:100%;
      justify-content:center;
      font-size:15px;
    }

    .dash-section {
      font-size:17px;
    }

    .dash-quick {
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:9px;
    }

    .dash-quick-btn {
      padding:11px 9px;
      gap:8px;
      font-size:14px;
    }

    .dash-quick-icon {
      flex-basis:34px;
      width:34px;
      height:34px;
      font-size:16px;
    }

    .dash-stats {
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:10px;
    }

    .dash-card {
      padding:13px;
      gap:7px;
    }

    .dash-card-info h3 {font-size:13px}

    .dash-card-info .value {font-size:19px}

    .dash-card-info .value small {font-size:12px}

    .dash-card-info .sub {
      font-size:11px;
      line-height:1.5;
    }

    .dash-icon {
      flex-basis:34px;
      width:34px;
      height:34px;
      font-size:15px;
    }

    .dash-panel-head {padding:13px}

    .dash-panel-head h5 {font-size:16px}

    .dash-panel-body {padding:13px}

    .dash-bar-row {
      grid-template-columns:minmax(0,1fr) auto;
      grid-template-areas:"label value" "track track";
      gap:8px;
      font-size:13px;
    }

    .dash-bar-label {grid-area:label}
    .dash-bar-value {grid-area:value;font-size:12px}
    .dash-bar-track {grid-area:track}

    .dash-result {
      padding:11px;
      font-size:13px;
    }

    .dash-result strong {font-size:15px}

    .dash-legend li {font-size:14px}

    .dash-mini-stats {
      grid-template-columns:repeat(2,minmax(0,1fr));
    }

    .dash-list-item {
      padding:11px 12px;
      gap:9px;
    }

    .dash-list-title {font-size:14px}
    .dash-list-meta {font-size:12px}

    .dash-badge {
      font-size:12px;
      padding:4px 7px;
    }

    .dash-alert {
      align-items:flex-start;
      flex-direction:column;
      font-size:14px;
    }

    .dash-alert button {width:100%}
  }

  /* VERY SMALL PHONES */

  @media (max-width: 380px) {
    .dash-page {padding:8px}

    .dash-stats {
      grid-template-columns:minmax(0,1fr);
    }

    .dash-quick {
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:7px;
    }

    .dash-quick-btn {
      font-size:12px;
      padding:9px 7px;
    }

    .dash-card {padding:14px}

    .dash-title h1 {font-size:18px}

    .dash-panel-head h5 {font-size:14px}

    .dash-list-item {flex-wrap:wrap}
  }

  /* RTL SUPPORT */

  .dash-page[dir="rtl"] .dash-bar-value,
  .dash-page[dir="rtl"] .dash-amt {
    direction:ltr;
    unicode-bidi:isolate;
  }

  .dash-page[dir="rtl"] .dash-bar-label {
    text-align:right;
  }

  @media (prefers-reduced-motion:reduce) {
    .dash-spinner {animation-duration:2s}

    .dash-card,
    .dash-quick-btn,
    .dash-btn-add,
    .dash-bar-fill {
      transition:none;
    }

    .dash-card:hover,
    .dash-quick-btn:hover,
    .dash-btn-add:hover {
      transform:none;
    }
  }
`;

export default DashboardPage;