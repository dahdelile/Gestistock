// src/utils/permissions.js

export const normalizeRole = (r) => String(r || '').trim().toLowerCase();

export const isAdmin = (user) =>
  ['admin', 'administrateur', 'administrator'].includes(normalizeRole(user?.role));

// ✅ Qui peut voir la page ?
export const canView = (user) => !!user;

// ✅ Qui peut ajouter ?
export const canAdd = (user, module) => {
  const role = normalizeRole(user?.role);
  if (role === 'admin') return true;
  if (role === 'manager') return true; // gérant : ajouter partout sauf utilisateurs
  if (role === 'cashier') return ['ventes', 'sales', 'caisse'].includes(module);
  if (role === 'stock') return ['products', 'produits', 'purchases', 'achats', 'categories'].includes(module);
  return false;
};

// ✅ Qui peut modifier ?
export const canEdit = (user, module) => {
  const role = normalizeRole(user?.role);
  if (role === 'admin') return true;
  if (role === 'manager') return true; // gérant : modifier partout sauf utilisateurs
  if (role === 'cashier') return ['ventes', 'sales'].includes(module);
  if (role === 'stock') return ['products', 'produits', 'purchases', 'achats'].includes(module);
  return false;
};

// ❌ Qui peut supprimer ? SEUL ADMIN
export const canDelete = (user) => isAdmin(user);

// ✅ Utilisateurs : SEUL ADMIN
export const canManageUsers = (user) =>
  isAdmin(user) && normalizeRole(user?.status || 'active') === 'active';