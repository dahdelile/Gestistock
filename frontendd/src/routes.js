import React from 'react'

const AdminAc = React.lazy(() => import('./views/admin/adminAc/AdminAc'))
const AdminDashboard = React.lazy(() => import('./views/admin/gestion/AdminDashboard'))

const Caises = React.lazy(() => import('./views/gestionC/Caises'));

const Accueil = React.lazy(() => import('./views/home/accueil/Accueil'))
//stock
const Categories = React.lazy(() => import('./views/Categories/Categories'))
const ProductList = React.lazy(() => import('./views/Products/ProductList'))
const PurchasesPage = React.lazy(() => import('./views/achat/PurchasesPage'))
const ReportsPage = React.lazy(() => import('./views/rapportss/ReportsPage'))
const ExpenseList = React.lazy(() => import('./views/expenses/ExpenseList'))
const CustomerList = React.lazy(() => import('./views/Customers/CustomerList'))
const SupplierList = React.lazy(() => import('./views/Suppliers/SupplierList'))
const Ventes = React.lazy(() => import('./views/ventes/Ventes'))
const UsersPage = React.lazy(() => import('./views/admin/UsersPage'))

const MessagesPage = React.lazy(() => import('./views/message/MessagesPage'))
const DepositsPage = React.lazy(() => import('./views/depo/DepositsPage'))

const routes = [
  { path: '/home/accueil', name: 'Accueil', element: Accueil },
  { path: '/admin/adminAc', name: 'AdminAc', element: AdminAc },
  { path: '/admin/gestion', name: 'AdminDashboard', element: AdminDashboard },
  { path: '/admin', name: 'UsersPage', element: UsersPage },

  // ✅ Dépôts : /depo = celui utilisé dans _nav.js
  { path: '/depo', name: 'DepositsPage', element: DepositsPage },
  { path: '/deposits', name: 'DepositsPage', element: DepositsPage },

  // ✅ Messages : /messages = celui utilisé dans AppHeader.js
  // On garde /message aussi pour ne pas casser l'ancien lien
{ path: '/messages', name: 'MessagesPage', element: MessagesPage },
  { path: '/message', name: 'MessagesPage', element: MessagesPage },

  { path: '/gestionC', name: 'Caises', element: Caises },
  //stock
  { path: '/Products', name: 'produits', element: ProductList },
  { path: '/Categories', name: 'Categories', element: Categories },
  { path: '/Customers', name: 'Customers', element: CustomerList },
  { path: '/achat', name: 'purchases', element: PurchasesPage },
  { path: '/rapportss', name: 'ReportsPage', element: ReportsPage },
  { path: '/expenses', name: 'ExpenseList', element: ExpenseList },
  { path: '/Suppliers', name: 'SupplierList', element: SupplierList },
  { path: '/ventes', name: 'Ventes', element: Ventes },
]

export default routes