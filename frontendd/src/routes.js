import React from 'react'

const AdminAc= React.lazy(() => import('./views/admin/adminAc/AdminAc'))
const AdminDashboard = React.lazy(() => import('./views/admin/gestion/AdminDashboard'))

//const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))
 





//stock
const Categories= React.lazy(() => import('./views/Categories/Categories'))
const ProductList= React.lazy(() => import('./views/Products/ProductList'))
const PurchasesPage= React.lazy(() => import('./views/achat/PurchasesPage'))
const ReportsPage= React.lazy(() => import('./views/rapportss/ReportsPage'))
const ExpenseList= React.lazy(() => import('./views/expenses/ExpenseList'))
const CustomerList= React.lazy(() => import('./views/Customers/CustomerList'))
const SupplierList= React.lazy(() => import('./views/Suppliers/SupplierList'))
const Ventes= React.lazy(() => import('./views/ventes/Ventes'))


const routes = [

/// admin

{ path: '/admin/adminAc', name: 'AdminAc', element:   AdminAc },
  { path: '/admin/gestion', name: 'AdminDashboard', element:   AdminDashboard },




//stock
{ path: 'Products', name: 'produits', element:  ProductList},
{ path: 'Categories', name: 'Categories', element:  Categories},
{ path: 'Customers', name: 'Customers', element: CustomerList},
{ path: 'achat', name: 'purchases', element:  PurchasesPage},
{ path: 'rapportss', name: 'ReportsPage', element:  ReportsPage},
{ path: 'expenses', name: 'ExpenseList', element: ExpenseList},
{ path: 'Suppliers', name: 'SupplierList', element: SupplierList},
  { path: 'ventes', name: 'Ventes', element: Ventes },

 


 // { path: '/widgets', name: 'Widgets', element: Widgets },
]

export default routes
