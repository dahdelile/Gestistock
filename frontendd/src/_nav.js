
import React from 'react'
import { CNavGroup, CNavItem } from '@coreui/react'

const _nav = [
  {
    component: CNavItem,
    name: '🏠Accueil ',
    to: '/home/accueil',
  
    badge: {
      color: 'info',
      text: 'NEW',
    },
  },
  {
    component: CNavItem,
    name: '📋 Note DG',
    to: '/noteDG/noteTable',
   
  },
  {
    component: CNavItem,
    name: '📝 Documents',
    to: '/dashboard',
 
  },
  {
    component: CNavItem,
    name: '🎯 Plan Action',
    to: '/plan',
  
  },
  {
    component: CNavGroup,
    name: '⚙️ Procédures',
  
    items: [
      {
        component: CNavItem,
        name: 'DG',
        to: '/procedures/dg',
        badge: { color: 'danger', text: 'DG' }
      },
      {
        component: CNavItem,
        name: 'DAA',
        to: '/procedures/daa',
        badge: { color: 'warning', text: 'DAA' }
      },
      {
        component: CNavItem,
        name: 'DRH',
        to: '/procedures/drh',
        badge: { color: 'primary', text: 'DRH' }
      },
      {
        component: CNavItem,
        name: 'DM',
        to: '/procedures/dm',
        badge: { color: 'secondary', text: 'DM' }
      },
      {
        component: CNavItem,
        name: 'DT',
        to: '/procedures/dt',
        badge: { color: 'info', text: 'DT' }
      },
      {
        component: CNavItem,
        name: 'DCG',
        to: '/procedures/dcg',
        badge: { color: 'success', text: 'DCG' }
      },
      {
        component: CNavItem,
        name: 'RCF',
        to: '/procedures/rcf',
        badge: { color: 'dark', text: 'RCF' }
      },
    ],
  },
  {
    component: CNavGroup,
    name: '📈Tableau de Bord',
 
    items: [
      {
        component: CNavItem,
        name: '⚠️ Les Arrêts',
        to: '/panne/rapportJou',
        badge: { color: 'danger', text: 'URGENT' }
      },
      {
        component: CNavItem,
        name: '🌀 Les Pneus',
        to: '/pneus/rapportPneu',
        badge: { color: 'warning', text: 'PNEU' }
      },
    ]
  },
  {
    component: CNavItem,
    name: '📊 Performances',
    to: '/projet/performances',

  },
  {
   
component: CNavItem,
    name: '🏢 Organigramme',
    to: '/organigrame',



  },
  {
    component: CNavItem,
    name: '👥 Personnel',
    to: '/personne/ajoutPersonne',
    
    
  },
  {
    component: CNavItem,
    name: '🔧 Gestion Users',
    to: '/admin/gestion',
  
    badge: { color: 'danger', text: 'ADMIN' }
  },

 {
    component: CNavItem,
    name: 'Déconnexion',
    to: '#',
    
    className: 'nav-item-sm logout-item-sm',
    onClick: (e) => {
      e.preventDefault();
      // Simple déconnexion sans confirmation
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
    }
  }




]

export default _nav