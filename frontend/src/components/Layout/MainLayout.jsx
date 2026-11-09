// src/components/Layout/MainLayout.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './MainLayout.css';

const MainLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [openSubmenus, setOpenSubmenus] = useState({});
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);

    // Handle responsive
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 992;
            setIsMobile(mobile);
            if (mobile) {
                setSidebarOpen(false);
            } else {
                setSidebarOpen(true);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Auto-open submenu if a child route is active
    useEffect(() => {
        const currentPath = location.pathname;
        const openSubmenu = (items) => {
            items.forEach(item => {
                if (item.submenu) {
                    const hasActiveChild = item.submenu.some(sub => sub.path === currentPath);
                    if (hasActiveChild) {
                        setOpenSubmenus(prev => ({
                            ...prev,
                            [item.key]: true
                        }));
                    }
                    openSubmenu(item.submenu);
                }
            });
        };
        openSubmenu(navItems);
    }, [location.pathname]);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const toggleSubmenu = (key) => {
        setOpenSubmenus(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const isActive = (path) => {
        return location.pathname === path;
    };

    const isSubmenuActive = (submenu) => {
        return submenu.some(sub => sub.path === location.pathname);
    };

    // Structure complète du menu
    const navItems = [
        {
            key: 'dashboard',
            icon: 'fa-home',
            label: 'Tableau de bord',
            path: '/dashboard'
        },
        {
            key: 'products',
            icon: 'fa-box',
            label: 'Gestion des Produits',
            submenu: [
                { key: 'products-list', label: 'Produits', path: '/products' },
                { key: 'categories', label: 'Catégories', path: '/categories' },
              
              
            ]
        },
        {
            key: 'stock-in',
            icon: 'fa-arrow-down',
            label: 'Stock entrant',
            submenu: [
                { key: 'purchases', label: 'Achats', path: '/purchases' },
                { key: 'receptions', label: 'Réceptions', path: '/receptions' },
                { key: 'supplier-returns', label: 'Retours fournisseurs', path: '/supplier-returns' }
            ]
        },
        {
            key: 'stock-out',
            icon: 'fa-arrow-up',
            label: 'Stock sortant',
            submenu: [
                { key: 'ventes', label: 'Ventes', path: '/ventes' },
                { key: 'internal-outs', label: 'Sorties internes', path: '/internal-outs' },
                { key: 'customer-returns', label: 'Retours clients', path: '/customer-returns' }
            ]
        },
        {
            key: 'partners',
            icon: 'fa-handshake',
            label: 'Partenaires',
            submenu: [
                { key: 'suppliers', label: 'Fournisseurs', path: '/suppliers' },
                { key: 'customers', label: 'Clients', path: '/customers' }
            ]
        },
        {
            key: 'reports',
            icon: 'fa-chart-bar',
            label: 'Rapports',
            submenu: [
                { key: 'stock-current', label: 'Stock actuel', path: '/reports/stock' },
                { key: 'history', label: 'Historique', path: '/reports/history' },
                { key: 'inventory', label: 'Inventaire', path: '/reports/inventory' },
                { key: 'profits', label: 'Bénéfices', path: '/reports/profits' },
                { key: 'movements', label: 'Mouvements', path: '/reports/movements' }
            ]
        },
        {
            key: 'users',
            icon: 'fa-users',
            label: 'Utilisateurs',
            path: '/users'
        },
        {
            key: 'settings',
            icon: 'fa-cog',
            label: 'Paramètres',
            path: '/settings'
        }
    ];

    return (
        <div className={`main-layout ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
            {/* Header */}
            <header className="top-header">
                <div className="header-left">
                    <button 
                        className="menu-toggle-btn mobile-only" 
                        onClick={toggleSidebar}
                        aria-label="Toggle menu"
                    >
                        <i className={`fas ${sidebarOpen ? 'fa-times' : 'fa-bars'}`}></i>
                    </button>
                    <span className="header-title">Administrateur</span>
                </div>
                <div className="header-right">
                    <div className="notification-btn">
                        <i className="fas fa-bell"></i>
                        <span className="notification-badge">3</span>
                    </div>
                    <div className="user-avatar-header">
                        <i className="fas fa-user-circle"></i>
                        <span className="user-name desktop-only">Admin ATTM</span>
                    </div>
                    <button 
                        className="sidebar-toggle-btn desktop-only" 
                        onClick={toggleSidebar}
                        aria-label="Toggle sidebar"
                    >
                        <i className={`fas ${sidebarOpen ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
                    </button>
                </div>
            </header>

            {/* Sidebar - À DROITE */}
            <div className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
                <div className="sidebar-top">
                    <div className="sidebar-logo">
                        <div className="logo-icon">
                            <i className="fas fa-cubes"></i>
                        </div>
                        {sidebarOpen && (
                            <div className="logo-text">
                                <h6 className="mb-0">Gestion Stock</h6>
                                <small>Administration</small>
                            </div>
                        )}
                    </div>
                </div>

                <div className="sidebar-profile">
                    <div className="profile-avatar">
                        <i className="fas fa-user"></i>
                    </div>
                    {sidebarOpen && (
                        <div className="profile-info">
                            <div className="profile-name">Admin ATTM</div>
                            <div className="profile-role">Super Administrateur</div>
                        </div>
                    )}
                </div>

                <nav className="sidebar-nav">
                    <ul className="nav-list">
                        {navItems.map((item) => (
                            <li key={item.key} className={`nav-item ${item.submenu ? 'has-submenu' : ''}`}>
                                {item.submenu ? (
                                    <>
                                        <div 
                                            className={`nav-link ${openSubmenus[item.key] ? 'active' : ''} ${isSubmenuActive(item.submenu) ? 'parent-active' : ''}`}
                                            onClick={() => toggleSubmenu(item.key)}
                                            role="button"
                                            aria-expanded={openSubmenus[item.key]}
                                        >
                                            <div className="submenu-icons">
                                                <i className={`fas ${item.icon}`}></i>
                                                {sidebarOpen && <span>{item.label}</span>}
                                            </div>
                                            {sidebarOpen && (
                                                <i className={`fas fa-chevron-down arrow-icon ${openSubmenus[item.key] ? 'rotated' : ''}`}></i>
                                            )}
                                        </div>
                                        {sidebarOpen && (
                                            <ul className={`submenu ${openSubmenus[item.key] ? 'open' : ''}`}>
                                                {item.submenu.map((sub) => (
                                                    <li key={sub.key}>
                                                        <div 
                                                            className={`submenu-link ${isActive(sub.path) ? 'active' : ''}`}
                                                            onClick={() => {
                                                                navigate(sub.path);
                                                                if (isMobile) {
                                                                    setSidebarOpen(false);
                                                                }
                                                            }}
                                                            role="button"
                                                        >
                                                            <span className="submenu-dot"></span>
                                                            <span>{sub.label}</span>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </>
                                ) : (
                                    <div 
                                        className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                                        onClick={() => {
                                            navigate(item.path);
                                            if (isMobile) {
                                                setSidebarOpen(false);
                                            }
                                        }}
                                        role="button"
                                    >
                                        <div className="submenu-icons">
                                            <i className={`fas ${item.icon}`}></i>
                                            {sidebarOpen && <span>{item.label}</span>}
                                        </div>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="sidebar-footer">
                    <div 
                        className="nav-link logout-link" 
                        onClick={() => {
                            localStorage.removeItem('token');
                            navigate('/login');
                        }}
                        role="button"
                    >
                        <div className="submenu-icons">
                            <i className="fas fa-sign-out-alt"></i>
                            {sidebarOpen && <span>Déconnexion</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Overlay for mobile */}
            {isMobile && sidebarOpen && (
                <div 
                    className="sidebar-overlay active"
                    onClick={toggleSidebar}
                ></div>
            )}

            {/* Main Content */}
            <main className="main-content">
                {children}
            </main>
        </div>
    );
};

export default MainLayout;