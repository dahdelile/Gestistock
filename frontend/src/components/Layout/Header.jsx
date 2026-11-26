// src/components/Layout/Header.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Box,
    Avatar,
    Menu,
    MenuItem,
    Badge,
    Button,
    ListItemIcon,
    ListItemText,
    Divider
} from '@mui/material';
import {
    Menu as MenuIcon,
    Notifications,
    AccountCircle,
    Settings,
    Logout,
    KeyboardArrowDown,
    Home as HomeIcon,
    Inventory2 as ProductsIcon,
    ArrowDownward as StockInIcon,
    ArrowUpward as StockOutIcon,
    Handshake as PartnersIcon,
    ReceiptLong as ExpenseIcon,
    BarChart as ReportsIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
    zIndex: theme.zIndex.drawer + 1,
    backgroundColor: '#ffffff',
    color: '#1a1a2e',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
}));

// Composant pour un menu déroulant
const DropdownMenu = ({ title, icon, items, activePath }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const location = useLocation();
    const open = Boolean(anchorEl);
    
    // Vérifier si un des sous-éléments est actif
    const isActive = items.some(item => location.pathname.startsWith(item.path));

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <>
            <Button
                onClick={handleClick}
                color="inherit"
                sx={{
                    textTransform: 'none',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#1976d2' : '#1a1a2e',
                    bgcolor: isActive ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
                    px: 2,
                    height: '64px',
                    borderRadius: 0
                }}
                startIcon={icon}
                endIcon={<KeyboardArrowDown />}
            >
                {title}
            </Button>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{ onMouseLeave: handleClose }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                PaperProps={{ elevation: 3, sx: { minWidth: 200, mt: 0.5 } }}
            >
                {items.map((item) => (
                    <MenuItem
                        key={item.path}
                        component={Link}
                        to={item.path}
                        onClick={handleClose}
                        selected={location.pathname === item.path}
                    >
                        <ListItemText>{item.label}</ListItemText>
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
};

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [notifAnchorEl, setNotifAnchorEl] = React.useState(null);

    const handleMenu = (event) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);
    const handleNotifOpen = (event) => setNotifAnchorEl(event.currentTarget);
    const handleNotifClose = () => setNotifAnchorEl(null);

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    // Configuration des menus
    const menuConfig = [
        {
            title: 'Produits',
            icon: <ProductsIcon fontSize="small" />,
            items: [
                { label: 'Produits', path: '/products' },
                { label: 'Catégories', path: '/categories' },
                { label: 'Marques', path: '/brands' },
                { label: 'Unités', path: '/units' }
            ]
        },
        {
            title: 'Stock entrant',
            icon: <StockInIcon fontSize="small" />,
            items: [
                { label: 'Achats', path: '/purchases' },
                { label: 'Réceptions', path: '/receptions' },
                { label: 'Retours fournisseurs', path: '/supplier-returns' }
            ]
        },
        {
            title: 'Stock sortant',
            icon: <StockOutIcon fontSize="small" />,
            items: [
                { label: 'Ventes', path: '/ventes' },
                { label: 'Sorties internes', path: '/internal-exits' },
                { label: 'Retours clients', path: '/customer-returns' }
            ]
        },
        {
            title: 'Partenaires',
            icon: <PartnersIcon fontSize="small" />,
            items: [
                { label: 'Fournisseurs', path: '/suppliers' },
                { label: 'Clients', path: '/customers' }
            ]
        },
        {
            title: 'Rapports',
            icon: <ReportsIcon fontSize="small" />,
            items: [
                { label: 'Stock actuel', path: '/reports/stock' },
                { label: 'Historique', path: '/reports/history' },
                { label: 'Inventaire', path: '/reports/inventory' },
                { label: 'Bénéfices', path: '/reports/profits' },
                { label: 'Mouvements', path: '/reports/movements' }
            ]
        }
    ];

    return (
        <StyledAppBar position="fixed">
            <Toolbar sx={{ minHeight: '64px !important', gap: 1 }}>
                
                {/* Logo / Titre */}
                <Typography 
                    variant="h6" 
                    component={Link} 
                    to="/dashboard"
                    sx={{ 
                        fontWeight: 800, 
                        color: '#1976d2', 
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        mr: 3 
                    }}
                >
                    GESTISTOCK
                </Typography>

                {/* Liens directs (Tableau de bord, Dépenses) */}
                <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                    <Button
                        component={Link}
                        to="/dashboard"
                        color="inherit"
                        startIcon={<HomeIcon fontSize="small" />}
                        sx={{
                            textTransform: 'none',
                            fontWeight: location.pathname === '/dashboard' ? 700 : 500,
                            color: location.pathname === '/dashboard' ? '#1976d2' : '#1a1a2e',
                            bgcolor: location.pathname === '/dashboard' ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                            px: 2,
                            height: '64px',
                            borderRadius: 0
                        }}
                    >
                        Tableau de bord
                    </Button>

                    {/* Rendu dynamique des menus déroulants */}
                    {menuConfig.map((menu) => (
                        <DropdownMenu 
                            key={menu.title}
                            title={menu.title}
                            icon={menu.icon}
                            items={menu.items}
                        />
                    ))}

                    <Button
                        component={Link}
                        to="/expenses"
                        color="inherit"
                        startIcon={<ExpenseIcon fontSize="small" />}
                        sx={{
                            textTransform: 'none',
                            fontWeight: location.pathname === '/expenses' ? 700 : 500,
                            color: location.pathname === '/expenses' ? '#1976d2' : '#1a1a2e',
                            bgcolor: location.pathname === '/expenses' ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                            px: 2,
                            height: '64px',
                            borderRadius: 0
                        }}
                    >
                        Dépenses
                    </Button>
                </Box>

                {/* Actions à droite (Notifications + Profil) */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton color="inherit" onClick={handleNotifOpen}>
                        <Badge badgeContent={4} color="error">
                            <Notifications />
                        </Badge>
                    </IconButton>
                    <Menu
                        anchorEl={notifAnchorEl}
                        open={Boolean(notifAnchorEl)}
                        onClose={handleNotifClose}
                    >
                        <MenuItem onClick={handleNotifClose}>Alertes : Stock bas</MenuItem>
                        <MenuItem onClick={handleNotifClose}>Nouvelle facture</MenuItem>
                        <MenuItem onClick={handleNotifClose}>Mise à jour système</MenuItem>
                    </Menu>

                    <IconButton onClick={handleMenu} color="inherit">
                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976d2' }}>
                            <AccountCircle />
                        </Avatar>
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleClose}
                    >
                        <MenuItem onClick={handleClose}>
                            <ListItemIcon><AccountCircle fontSize="small" /></ListItemIcon>
                            <ListItemText>Mon Profil</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={handleClose}>
                            <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
                            <ListItemText>Paramètres</ListItemText>
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={handleLogout}>
                            <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
                            <ListItemText>Déconnexion</ListItemText>
                        </MenuItem>
                    </Menu>
                </Box>
            </Toolbar>
        </StyledAppBar>
    );
};

export default Header;