// src/components/Layout/MainLayout.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './MainLayout.css';
import { useLanguage } from '../../context/LanguageContext';

// Dictionnaire de traduction (défini hors du composant : créé une seule fois)
const i18n = {
    ar: {
        dir: 'rtl',
        dashboard: 'الصفة الرئيسية',
        products: 'المنتجات',
        stockIn: 'المخزون الوارد',
        stockOut: 'المخزون الصادر',
        partners: 'الشركاء',
        expenses: 'المصروفات',
        reports: 'التقارير',
        users: 'المستخدمون',
        settings: 'الإعدادات',
         cashier: 'الصندوق',
        logout: 'تسجيل الخروج',
        switchLang: 'تغيير اللغة',
        // Sous-menus
        productsList: 'المنتجات', manageCatalog: 'إدارة الكتالوج',
        categories: 'الفئات', organizeType: 'تنظيم حسب النوع',
        brands: 'العلامات التجارية', manageBrands: 'إدارة العلامات',
        units: 'الوحدات', unitsDesc: 'كغ، لتر، قطع...',
        purchases: 'المشتريات', purchaseOrders: 'أوامر الشراء',
        receptions: 'الاستلام', goodsIn: 'دخول البضائع',
        supplierReturns: 'مرتجعات الموردين', returnProducts: 'إرجاع المنتجات',
        sales: 'المبيعات', cashInvoices: 'الصندوق والفواتير',
        internalOuts: 'المخارج الداخلية', internalNeeds: 'الاحتياجات الداخلية',
        customerReturns: 'مرتجعات العملاء', refunds: 'المبالغ المستردة',
        suppliers: 'الموردون', yourSuppliers: 'موردوك',
        customers: 'العملاء', yourCustomers: 'قاعدة عملائك',
        stockCurrent: 'المخزون الحالي', overview: 'نظرة عامة',
        history: 'السجل', pastMovements: 'الحركات السابقة',
        inventory: 'الجرد', physicalCount: 'العد الفعلي',
        profits: 'الأرباح', margins: 'الهوامش والتحليلات',
        movements: 'الحركات', inOut: 'الدخول والخروج',
        dailyReports: 'التقارير اليومية', dailyReportDesc: 'تقارير اليوم'
    },
    fr: {
        dir: 'ltr',
        dashboard: 'Page Accueil',
        products: 'Produits',
        stockIn: 'Stock entrant',
        stockOut: 'Stock sortant',
        partners: 'Partenaires',
        expenses: 'Dépenses',
        reports: 'Rapports',
        users: 'Utilisateurs',
        settings: 'Paramètres',
           cashier: 'Caisse',
        logout: 'Déconnexion',
        switchLang: 'Changer de langue',
        // Sous-menus
        productsList: 'Produits', manageCatalog: 'Gérer votre catalogue',
        categories: 'Catégories', organizeType: 'Organiser par type',
        brands: 'Marques', manageBrands: 'Gérer les marques',
        units: 'Unités', unitsDesc: 'Kg, Litres, Pièces...',
        purchases: 'Achats', purchaseOrders: 'Bons de commande',
        receptions: 'Réceptions', goodsIn: 'Entrées de marchandises',
        supplierReturns: 'Retours fournisseurs', returnProducts: 'Retours de produits',
        sales: 'Ventes', cashInvoices: 'Caisse et factures',
        internalOuts: 'Sorties internes', internalNeeds: 'Besoins internes',
        customerReturns: 'Retours clients', refunds: 'Remboursements',
        suppliers: 'Fournisseurs', yourSuppliers: 'Vos fournisseurs',
        customers: 'Clients', yourCustomers: 'Votre base clients',
        stockCurrent: 'Stock actuel', overview: "Vue d'ensemble",
        history: 'Historique', pastMovements: 'Mouvements passés',
        inventory: 'Inventaire', physicalCount: 'Comptage physique',
        profits: 'Bénéfices', margins: 'Marges et analyses',
        movements: 'Mouvements', inOut: 'Entrées et sorties',
        dailyReports: 'Journaliers', dailyReportDesc: 'Rapports de la journée'
    }
};

const MainLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [openDropdown, setOpenDropdown] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Langue GLOBALE : partagée avec toutes les pages (plus d'état local ici)
    const { lang, setLang } = useLanguage();
    const t = i18n[lang];

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 1024;
            setIsMobile(mobile);
            if (!mobile) setMobileMenuOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.nav-dropdown-container')) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Structure du menu avec les clés de traduction
    const navItems = [
        {
         key: 'settings',
            icon: 'fa-cog',
            label: t.settings,
            submenu: [
                { key: 'users', icon: 'fa-users-cog', label: t.users, path: '/users' },
        
            ]

        },


 //{ key: 'caise', icon: 'fa-cash-register', label: t.cashier, path: '/caise' },


         {
            key: 'partners',
            icon: 'fa-handshake',
            label: t.partners,
            submenu: [
                { key: 'suppliers', icon: 'fa-truck', label: t.suppliers, desc: t.yourSuppliers, path: '/suppliers' },
                { key: 'customers', icon: 'fa-users', label: t.customers, desc: t.yourCustomers, path: '/customers' }
            ]
        },

   {
            key: 'reports',
            icon: 'fa-chart-bar',
            label: t.reports,
            submenu: [
                { key: 'stock-current', icon: 'fa-chart-pie', label: t.stockCurrent, desc: t.overview, path: '/reports/stock' },
                { key: 'history', icon: 'fa-history', label: t.history, desc: t.pastMovements, path: '/reports/history' },
                { key: 'inventory', icon: 'fa-clipboard-list', label: t.inventory, desc: t.physicalCount, path: '/reports/inventory' },
                { key: 'profits', icon: 'fa-money-bill-trend-up', label: t.profits, desc: t.margins, path: '/reports/profits' },
                { key: 'movements', icon: 'fa-exchange-alt', label: t.movements, desc: t.inOut, path: '/reports/movements' },
                { key: 'daily-reports', icon: 'fa-calendar-day', label: t.dailyReports, desc: t.dailyReportDesc, path: '/reports' }
            ]
        },
         
        { key: 'expenses', icon: 'fa-file-invoice-dollar', label: t.expenses, path: '/expenses' },
     
        
        {
            key: 'products',
            icon: 'fa-box',
            label: t.products,
            submenu: [
                { key: 'products-list', icon: 'fa-tag', label: t.productsList, desc: t.manageCatalog, path: '/products' },
                { key: 'categories', icon: 'fa-layer-group', label: t.categories, desc: t.organizeType, path: '/categories' },
                
            ]
        },
        {
            key: 'stock-in',
            icon: 'fa-arrow-down',
            label: t.stockIn,
            submenu: [
                { key: 'purchases', icon: 'fa-shopping-cart', label: t.purchases, desc: t.purchaseOrders, path: '/purchases' },
                { key: 'receptions', icon: 'fa-truck-loading', label: t.receptions, desc: t.goodsIn, path: '/receptions' },
                { key: 'supplier-returns', icon: 'fa-undo-alt', label: t.supplierReturns, desc: t.returnProducts, path: '/supplier-returns' }
            ]
        },
        {
            key: 'stock-out',
            icon: 'fa-arrow-up',
            label: t.stockOut,
            submenu: [
                { key: 'sales', icon: 'fa-cash-register', label: t.sales, desc: t.cashInvoices, path: '/sales' },
                { key: 'internal-outs', icon: 'fa-dolly', label: t.internalOuts, desc: t.internalNeeds, path: '/internal-outs' },
                { key: 'customer-returns', icon: 'fa-undo', label: t.customerReturns, desc: t.refunds, path: '/customer-returns' }
            ]
        },
      
        
         { key: 'dashboard', icon: 'fa-home', label: t.dashboard, path: '/dashboard' },
    ];

    const isActive = (path) => location.pathname === path;
    const isSubmenuActive = (submenu) => submenu.some(sub => sub.path === location.pathname);

    const handleLinkClick = (path) => {
        navigate(path);
        setOpenDropdown(null);
        if (isMobile) setMobileMenuOpen(false);
    };

    return (
        <div className="emonsite-layout" dir={t.dir}>
            {/* Header Flottant */}
            <header className="floating-header">
                <div className="header-container">

                    {/* Logo */}
                    <div className="brand-logo" onClick={() => navigate('/dashboard')}>
                        <span className="logo-text">GESTI</span><span className="logo-highlight">STOCK</span>
                    </div>

                    {/* Bouton Mobile */}
                    {isMobile && (
                        <button className="mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                            <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
                        </button>
                    )}

                    {/* Navigation Principale */}
                    <nav className={`modern-nav ${isMobile && mobileMenuOpen ? 'mobile-open' : ''}`}>
                        <ul className="nav-list">
                            {navItems.map((item) => (
                                <li
                                    key={item.key}
                                    className={`nav-item ${item.submenu ? 'nav-dropdown-container' : ''}`}
                                >
                                    {item.submenu ? (
                                        <>
                                            <button
                                                className={`nav-btn ${openDropdown === item.key ? 'active' : ''} ${isSubmenuActive(item.submenu) ? 'text-blue' : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenDropdown(openDropdown === item.key ? null : item.key);
                                                }}
                                            >
                                                {item.label}
                                                <i className={`fas fa-chevron-down arrow ${openDropdown === item.key ? 'open' : ''}`}></i>
                                            </button>

                                            {/* Mega Menu Déroulant */}
                                            <div className={`mega-menu ${openDropdown === item.key ? 'show' : ''}`}>
                                                <div className="mega-menu-grid">
                                                    {item.submenu.map((sub) => (
                                                        <div
                                                            key={sub.key}
                                                            className={`mega-menu-item ${isActive(sub.path) ? 'active' : ''}`}
                                                            onClick={() => handleLinkClick(sub.path)}
                                                        >
                                                            <div className="mega-menu-icon">
                                                                <i className={`fas ${sub.icon}`}></i>
                                                            </div>
                                                            <div className="mega-menu-content">
                                                                <span className="mega-title">{sub.label}</span>
                                                                <span className="mega-desc">{sub.desc}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div
                                            className={`nav-btn ${isActive(item.path) ? 'active-pill' : ''}`}
                                            onClick={() => handleLinkClick(item.path)}
                                        >
                                            {item.label}
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>

                        {/* Actions */}
                        <div className="nav-actions">
                            {/* Changement de langue : modifie TOUTE l'application */}
                            <button
                                className="lang-toggle-btn"
                                onClick={() => setLang(lang === 'ar' ? 'fr' : 'ar')}
                                title={t.switchLang}
                                aria-label={t.switchLang}
                            >
                                {lang === 'ar' ? 'FR' : 'عربية'}
                            </button>

                            <div className="notif-icon">
                                <i className="fas fa-bell"></i>
                                <span className="dot"></span>
                            </div>

                            <button className="logout-btn" onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}>
                                {t.logout}
                            </button>
                        </div>
                    </nav>
                </div>
            </header>

            {/* Contenu Principal */}
            <main className="main-content-emonsite">
                {children}
            </main>
        </div>
    );
};

export default MainLayout;