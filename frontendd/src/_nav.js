import React from 'react'
import { CNavGroup, CNavItem } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilHome,
  cilCart,
  cilInbox,
  cilMoney,
  cilPeople,
  cilSettings,
  cilChart,
  cilCalculator,
  cilAccountLogout,
  cilSpeedometer,
} from '@coreui/icons'

const getNav = (tFn) => {
  // 👇 SÉCURITÉ : si t n'est pas une fonction, on ne plante plus, on affiche la clé
  const t = typeof tFn === 'function' ? tFn : (key) => key

  return [
    { component: CNavItem, name: t('accueil'), to: '/home/accueil', icon: <CIcon icon={cilHome} customClassName="nav-icon" />, badge: { color: 'info', text: 'NEW' } },
    {
      component: CNavGroup, name: t('produits'), icon: <CIcon icon={cilCart} customClassName="nav-icon" />,
      items: [
        { component: CNavItem, name: t('produits'), to: '/products' },
        { component: CNavItem, name: t('categories'), to: '/categories' },
        
      ],
    },
    { component: CNavItem, name: t('achats'), to:  '/achat', icon: <CIcon icon={cilInbox} customClassName="nav-icon" /> },
    
    { component: CNavItem, name:t('ventes'), to:  '/ventes', icon: <CIcon icon={cilMoney} customClassName="nav-icon" /> },
    /*
    {
      component: CNavGroup, name: t('stockSortant'), icon: <CIcon icon={cilMoney} customClassName="nav-icon" />,
      items: [
        { component: CNavItem, name: t('ventes'), to: '/ventes' },
        { component: CNavItem, name: t('sortiesInternes'), to: '/internal-outs' },
        { component: CNavItem, name: t('retoursClients'), to: '/customer-returns' },
      ],
    },*/
    {
      component: CNavGroup, name: t('partenaires'), icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
      items: [
        { component: CNavItem, name: t('fournisseurs'), to: '/suppliers' },
        { component: CNavItem, name: t('clients'), to: '/customers' },
        { component: CNavItem, name: t('personnel'), to: '/personne/ajoutPersonne' },
      ],
    },
    { component: CNavItem, name: t('depenses'), to: '/expenses', icon: <CIcon icon={cilCalculator} customClassName="nav-icon" /> },
    { component: CNavItem, name: t('caisse'), to: '/caise', icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" /> },
    
    { component: CNavItem, name: t('rapports'), to: '/rapportss', icon: <CIcon icon={cilChart} customClassName="nav-icon" /> },


    {
      component: CNavGroup, name: t('parametres'), icon: <CIcon icon={cilSettings} customClassName="nav-icon" />,
      items: [
        { component: CNavItem, name: t('utilisateurs'), to: '/admin' },
        { component: CNavItem, name: t('gestionUsers'), to: '/admin/gestion', badge: { color: 'danger', text: 'ADMIN' } },
       
      ],
    },
    {
      component: CNavItem, name: t('deconnexion'), to: '/login', icon: <CIcon icon={cilAccountLogout} customClassName="nav-icon" />,
      onClick: (e) => { e.preventDefault(); localStorage.clear(); sessionStorage.clear(); window.location.href = '/login'; },
    },
  ]
}

export default getNav