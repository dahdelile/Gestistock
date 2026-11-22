import React from 'react'

const AdminAc= React.lazy(() => import('./views/admin/adminAc/AdminAc'))
const AdminDashboard = React.lazy(() => import('./views/admin/gestion/AdminDashboard'))

//const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))
 

//const caises = React.lazy(() => import('./views/caise/caises'))

const Accueil = React.lazy(() => import('./views/home/accueil/Accueil'))
//stock
const Categories= React.lazy(() => import('./views/Categories/Categories'))
const ProductList= React.lazy(() => import('./views/Products/ProductList'))
const PurchasesPage= React.lazy(() => import('./views/achat/PurchasesPage'))
const ReportsPage= React.lazy(() => import('./views/rapportss/ReportsPage'))
const ExpenseList= React.lazy(() => import('./views/expenses/ExpenseList'))
const CustomerList= React.lazy(() => import('./views/Customers/CustomerList'))
const SupplierList= React.lazy(() => import('./views/Suppliers/SupplierList'))
const Ventes= React.lazy(() => import('./views/ventes/Ventes'))
const UsersPage= React.lazy(() => import('./views/admin/UsersPage'))
//const NoteFile2025= React.lazy(() => import('./views/noteDG/noteFile2025/NoteFile2025"'))
const routes = [

 { path: '/home/accueil', name: 'Accueil', element: Accueil},
{ path: '/admin/adminAc', name: 'AdminAc', element:   AdminAc },
  { path: '/admin/gestion', name: 'AdminDashboard', element:   AdminDashboard },

{ path: '/admin', name: 'UsersPage', element:   UsersPage },

//{ path: '/caises', name: 'caises', element:   caises },
//stock
{ path: 'Products', name: 'produits', element:  ProductList},
{ path: 'Categories', name: 'Categories', element:  Categories},
{ path: 'Customers', name: 'Customers', element: CustomerList},
{ path: 'achat', name: 'purchases', element:  PurchasesPage},
{ path: 'rapportss', name: 'ReportsPage', element:  ReportsPage},
{ path: 'expenses', name: 'ExpenseList', element: ExpenseList},
{ path: 'Suppliers', name: 'SupplierList', element: SupplierList},
  { path: 'ventes', name: 'Ventes', element: Ventes },

 
//{ path: 'vNoteFile2025', name: 'NoteFile2025', element: NoteFile2025},
 //{ path: 'NoteDGT', name: 'NoteDGT', element: NoteDGT },
 // { path: '/widgets', name: 'Widgets', element: Widgets },
]

export default routes
