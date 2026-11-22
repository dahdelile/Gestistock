// src/api/index.js
import { supabase } from '../supabaseClient';

const getCategoryIdByName = async (name) => {
  if (!name) return null;
  const { data, error } = await supabase.from('categories').select('id').eq('name', name).single();
  if (error && error.code !== 'PGRST116') return null;
  return data ? data.id : null;
};

// Nettoie un objet : enlève undefined / null vides pour ne pas écraser en BDD
const cleanPayload = (obj) => {
  const out = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined) out[k] = v;
  });
  return out;
};

// ===== API Categories =====
export const categoriesApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('categories')
      .select(`*, sous_categories (*)`)
      .order('name');
    if (error) { console.error('Erreur chargement catégories:', error); throw error; }
    return { data };
  },
  create: async (data) => {
    const { data: res, error } = await supabase.from('categories').insert([data]).select();
    if (error) throw error;
    return { data: res[0] };
  },
  update: async (id, data) => {
    const { data: res, error } = await supabase.from('categories').update(data).eq('id', id).select();
    if (error) throw error;
    return { data: res[0] };
  },
  delete: async (id) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },
  updateStatus: async (id, status) => {
    const { data: res, error } = await supabase.from('categories').update({ status }).eq('id', id).select();
    if (error) throw error;
    return { data: res[0] };
  },
  getSelect: async () => {
    const { data, error } = await supabase.from('categories').select('id, name').eq('status', 'active');
    if (error) throw error;
    return { data };
  },
  getStatistics: async () => {
    const { count, error } = await supabase.from('categories').select('*', { count: 'exact', head: true });
    if (error) throw error;
    return { data: { total: count } };
  },
  createSub: async (data) => {
    const { data: res, error } = await supabase.from('sous_categories').insert([data]).select();
    if (error) throw error;
    return { data: res[0] };
  },
  updateSub: async (id, data) => {
    const { data: res, error } = await supabase.from('sous_categories').update(data).eq('id', id).select();
    if (error) throw error;
    return { data: res[0] };
  },
  deleteSub: async (id) => {
    const { error } = await supabase.from('sous_categories').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },
  updateSubStatus: async (id, status) => {
    const { data: res, error } = await supabase.from('sous_categories').update({ status }).eq('id', id).select();
    if (error) throw error;
    return { data: res[0] };
  }
};

// ===== API Products =====
export const productsApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { data };
  },
  getById: async (id) => {
    const { data, error } = await supabase.from('products').select('*, categories(name)').eq('id', id).single();
    if (error) throw error;
    return { data };
  },
  // ✅ FIX : gère category (nom) OU category_id + subcategory_id
  create: async (productData) => {
    let categoryId = productData.category_id || null;
    if (productData.category && !categoryId) {
      categoryId = await getCategoryIdByName(productData.category);
    }
    const dbPayload = cleanPayload({
      ...productData,
      category_id: categoryId,
      subcategory_id: productData.subcategory_id || productData.sous_categorie_id || null,
    });
    delete dbPayload.category;
    delete dbPayload.sous_categorie_id;
    delete dbPayload.categories;

    const { data: res, error } = await supabase.from('products').insert([dbPayload]).select();
    if (error) throw error;
    return { data: res[0] };
  },
  // ✅ FIX : ne perd plus subcategory_id / description / image
  update: async (id, productData) => {
    let categoryId = productData.category_id;
    if (productData.category && !categoryId) {
      categoryId = await getCategoryIdByName(productData.category);
    }
    const dbPayload = cleanPayload({
      name: productData.name,
      barcode: productData.barcode,
      description: productData.description,
      image: productData.image,
      status: productData.status,
      purchase_price: productData.purchase_price,
      sale_price: productData.sale_price,
      quantity: productData.quantity,
      min_quantity: productData.min_quantity,
      supplier_id: productData.supplier_id,
      category_id: categoryId,
      subcategory_id: productData.subcategory_id ?? productData.sous_categorie_id,
    });
    const { data: res, error } = await supabase.from('products').update(dbPayload).eq('id', id).select();
    if (error) throw error;
    return { data: res[0] };
  },
  delete: async (id) => {
    const relatedTables = ['invoice_items', 'inventory_transactions', 'purchase_items', 'customer_returns', 'internal_outputs'];
    let isReferenced = false;
    for (const table of relatedTables) {
      const { data, error } = await supabase.from(table).select('id').eq('product_id', id).limit(1);
      // Si la table n'existe pas, on ignore au lieu de bloquer la suppression
      if (error) {
        if (error.code === '42P01') continue;
        throw error;
      }
      if (data && data.length > 0) { isReferenced = true; break; }
    }
    if (isReferenced) {
      const { data, error } = await supabase.from('products').update({ status: 'inactive' }).eq('id', id).select();
      if (error) throw error;
      return { success: true, archived: true, data: data?.[0] };
    }
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    return { success: true, archived: false };
  },
  // ✅ FIX getLowStock : PostgREST ne peut pas comparer 2 colonnes.
  // On filtre en JS : quantity <= min_quantity
  getLowStock: async () => {
    const { data, error } = await supabase.from('products').select('*');
    if (error) throw error;
    const low = (data || []).filter((p) => Number(p.quantity ?? 0) <= Number(p.min_quantity ?? 0));
    return { data: low };
  },
  getStats: async () => {
    const { data, error } = await supabase.from('products').select('quantity, min_quantity, purchase_price, sale_price');
    if (error) throw error;
    const totalProducts = data.length;
    const stockValue = data.reduce((acc, p) => acc + (Number(p.quantity || 0) * Number(p.purchase_price || 0)), 0);
    return { data: { totalProducts, stockValue } };
  }
};

// ===== API Customers =====
export const customersApi = {
  getAll: async () => {
    const { data, error } = await supabase.from('customers').select('*').order('name');
    if (error) throw error;
    return { data };
  },
  getById: async (id) => {
    const { data, error } = await supabase.from('customers').select('*').eq('id', id).single();
    if (error) throw error;
    return { data };
  },
  create: async (data) => {
    const { data: res, error } = await supabase.from('customers').insert([data]).select();
    if (error) throw error;
    return { data: res[0] };
  },
  update: async (id, data) => {
    const { data: res, error } = await supabase.from('customers').update(data).eq('id', id).select();
    if (error) throw error;
    return { data: res[0] };
  },
  delete: async (id) => {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  }
};

// ===== API Suppliers =====
export const suppliersApi = {
  getAll: async () => {
    const { data, error } = await supabase.from('suppliers').select('*').order('name');
    if (error) throw error;
    return { data };
  },
  getById: async (id) => {
    const { data, error } = await supabase.from('suppliers').select('*').eq('id', id).single();
    if (error) throw error;
    return { data };
  },
  create: async (data) => {
    const { data: res, error } = await supabase.from('suppliers').insert([data]).select();
    if (error) throw error;
    return { data: res[0] };
  },
  update: async (id, data) => {
    const { data: res, error } = await supabase.from('suppliers').update(data).eq('id', id).select();
    if (error) throw error;
    return { data: res[0] };
  },
  delete: async (id) => {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  }
};

// ===== API Invoices =====
export const invoicesApi = {
  getAll: async () => {
    const { data, error } = await supabase.from('invoices').select('*, customers(name)').order('created_at', { ascending: false });
    if (error) throw error;
    return { data };
  },
  getById: async (id) => {
    const { data, error } = await supabase.from('invoices').select('*, customers(name), invoice_items(*, products(name))').eq('id', id).single();
    if (error) throw error;
    return { data };
  },
  create: async (data) => {
    const { data: invoice, error: invError } = await supabase.from('invoices').insert([{
      invoice_number: data.invoice_number,
      customer_id: data.customer_id,
      total: data.total,
      grand_total: data.grand_total,
      paid_amount: data.paid_amount,
      status: data.status,
      payment_method: data.payment_method,
      invoice_date: data.invoice_date,
      notes: data.notes
    }]).select().single();
    if (invError) throw invError;
    if (data.items && data.items.length > 0) {
      const items = data.items.map(item => ({
        invoice_id: invoice.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        unit_price: item.unit_price,
        total: item.total
      }));
      const { error: itemsError } = await supabase.from('invoice_items').insert(items);
      if (itemsError) throw itemsError;
    }
    return { data: invoice };
  },
  delete: async (id) => {
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },
  getSalesReport: async () => {
    const { data, error } = await supabase.from('invoices').select('*').eq('status', 'paid');
    if (error) throw error;
    return { data };
  }
};

// ===== API Expenses =====
export const expensesApi = {
  getAll: async () => {
    const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
    if (error) throw error;
    return { data };
  },
  getById: async (id) => {
    const { data, error } = await supabase.from('expenses').select('*').eq('id', id).single();
    if (error) throw error;
    return { data };
  },
  create: async (data) => {
    const { data: res, error } = await supabase.from('expenses').insert([data]).select();
    if (error) throw error;
    return { data: res[0] };
  },
  update: async (id, data) => {
    const { data: res, error } = await supabase.from('expenses').update(data).eq('id', id).select();
    if (error) throw error;
    return { data: res[0] };
  },
  delete: async (id) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  }
};

// ===== API Sales & Dashboard =====
export const salesApi = {
  getAll: async () => {
    const { data, error } = await supabase.from('invoices').select('*, customers(name), invoice_items(*, products(name))').order('created_at', { ascending: false });
    if (error) throw error;
    return { data };
  },
  getById: async (id) => {
    const { data, error } = await supabase.from('invoices').select('*, customers(name), invoice_items(*, products(name))').eq('id', id).single();
    if (error) throw error;
    return { data };
  },
  checkout: async (payload) => {
    const { data: invoice, error: invError } = await supabase.from('invoices').insert([{
      invoice_number: payload.invoice_number,
      customer_id: payload.customer_id,
      total: payload.total,
      discount: payload.discount,
      grand_total: payload.grand_total,
      paid_amount: payload.paid_amount,
      balance: payload.balance,
      status: payload.status,
      payment_method: payload.payment_method,
      amount_received: payload.amount_received,
      change_amount: payload.change_amount,
      notes: payload.notes,
      invoice_date: new Date().toISOString()
    }]).select().single();
    if (invError) throw invError;

    if (payload.items && payload.items.length > 0) {
      const itemsToInsert = payload.items.map(item => ({
        invoice_id: invoice.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        unit_price: item.unit_price,
        total: item.total
      }));
      const { error: itemsError } = await supabase.from('invoice_items').insert(itemsToInsert);
      if (itemsError) throw itemsError;

      for (const item of payload.items) {
        const { data: product, error: prodError } = await supabase.from('products').select('quantity').eq('id', item.product_id).single();
        if (prodError) { console.error("Erreur produit:", prodError); continue; }
        const newQuantity = Math.max(0, product.quantity - item.quantity);
        const { error: updateError } = await supabase.from('products').update({ quantity: newQuantity }).eq('id', item.product_id);
        if (updateError) console.error("Erreur stock:", updateError);
      }
    }
    return { data: invoice };
  },
  getStats: async () => {
    const { data, error } = await supabase.from('invoices').select('grand_total').eq('status', 'paid');
    if (error) throw error;
    const totalSales = data.reduce((acc, inv) => acc + Number(inv.grand_total), 0);
    return { data: { totalSales } };
  },
  deleteSale: async (id, items) => {
    for (const item of (items || [])) {
      const { data: product } = await supabase.from('products').select('quantity').eq('id', item.product_id).single();
      if (product) {
        const newQuantity = product.quantity + item.quantity;
        await supabase.from('products').update({ quantity: newQuantity }).eq('id', item.product_id);
      }
    }
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },
  updateSale: async (id, data) => {
    const { data: res, error } = await supabase.from('invoices').update(data).eq('id', id).select();
    if (error) throw error;
    return { data: res[0] };
  }
};

export const VentesApi = {
  checkout: invoicesApi.create,
  getRecent: invoicesApi.getAll,
};

export const dashboardApi = {
  getStats: async () => {
    const productsCount = await supabase.from('products').select('*', { count: 'exact', head: true });
    const invoicesCount = await supabase.from('invoices').select('*', { count: 'exact', head: true });
    const { data: sales } = await supabase.from('invoices').select('grand_total').eq('status', 'paid');
    const totalSales = sales ? sales.reduce((acc, inv) => acc + Number(inv.grand_total), 0) : 0;
    return { data: { totalProducts: productsCount.count || 0, totalInvoices: invoicesCount.count || 0, totalSales } };
  },
  getRecentActivity: async () => {
    const { data, error } = await supabase.from('invoices').select('*').order('created_at', { ascending: false }).limit(5);
    if (error) throw error;
    return { data };
  }
};

// ===== API Purchases (Achats) =====
export const purchasesApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('purchases')
      .select('*, suppliers(name), purchase_items(*, products(id, name, category_id, subcategory_id))')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { data };
  },
  create: async (purchaseData) => {
    const { data: purchase, error: purError } = await supabase.from('purchases').insert([{
      purchase_number: purchaseData.purchase_number,
      supplier_id: purchaseData.supplier_id,
      total: purchaseData.total,
      status: purchaseData.status,
      purchase_date: new Date().toISOString(),
      notes: purchaseData.notes
    }]).select().single();
    if (purError) throw purError;

    const purchaseItems = [];
    for (const item of (purchaseData.items || [])) {
      const categoryId = Number(item.category_id);
      const subcategoryId = Number(item.subcategory_id);
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unit_price);
      if (!categoryId || !subcategoryId || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) {
        throw new Error('Catégorie, sous-catégorie, quantité ou prix invalide.');
      }
      const { data: subcategory, error: subError } = await supabase.from('sous_categories').select('id, name, category_id').eq('id', subcategoryId).eq('category_id', categoryId).single();
      if (subError) throw subError;

      const { data: matches, error: findError } = await supabase.from('products').select('id, quantity').eq('category_id', categoryId).eq('subcategory_id', subcategoryId).limit(1);
      if (findError) throw findError;

      let productId;
      if (matches && matches.length > 0) {
        const existing = matches[0];
        const { data: updated, error: updateError } = await supabase.from('products').update({
          quantity: Number(existing.quantity || 0) + quantity,
          purchase_price: unitPrice,
          supplier_id: purchaseData.supplier_id || null,
          name: subcategory.name,
          category_id: categoryId,
          subcategory_id: subcategoryId,
          updated_at: new Date().toISOString()
        }).eq('id', existing.id).select('id').single();
        if (updateError) throw updateError;
        productId = updated.id;
      } else {
        const { data: created, error: createError } = await supabase.from('products').insert([{
          name: subcategory.name,
          category_id: categoryId,
          subcategory_id: subcategoryId,
          barcode: null,
          status: 'active',
          purchase_price: unitPrice,
          sale_price: unitPrice,
          quantity,
          min_quantity: 0,
          supplier_id: purchaseData.supplier_id || null
        }]).select('id').single();
        if (createError) throw createError;
        productId = created.id;
      }
      purchaseItems.push({
        purchase_id: purchase.id,
        product_id: productId,
        quantity,
        unit_price: unitPrice,
        total: Number(item.total ?? quantity * unitPrice)
      });
    }
    if (purchaseItems.length > 0) {
      const { error: itemsError } = await supabase.from('purchase_items').insert(purchaseItems);
      if (itemsError) throw itemsError;
    }
    return { data: purchase };
  },
  deletePurchase: async (id, items) => {
    for (const item of (items || [])) {
      const { data: product } = await supabase.from('products').select('quantity').eq('id', item.product_id).single();
      if (product) {
        const newQuantity = Math.max(0, product.quantity - item.quantity);
        await supabase.from('products').update({ quantity: newQuantity }).eq('id', item.product_id);
      }
    }
    const { error } = await supabase.from('purchases').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },
  updatePurchase: async (id, data) => {
    const { data: res, error } = await supabase.from('purchases').update(data).eq('id', id).select();
    if (error) throw error;
    return { data: res[0] };
  }
};

// ===== API Users (Utilisateurs) =====
const callManageUsers = async (payload) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Session expirée. Reconnecte-toi.');
  // supabase.functions.invoke ajoute déjà le token, on ne le double pas
  const { data, error } = await supabase.functions.invoke('manage-users', { body: payload });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
};

export const usersApi = {
  getAll: async () => {
    const data = await callManageUsers({ action: 'list' });
    // Toujours un tableau dans .data pour UsersPage
    return { data: data?.data ?? data?.users ?? [] };
  },
  create: async (userData) => {
    const data = await callManageUsers({ action: 'create', data: userData });
    // Renvoie l'utilisateur directement : UsersPage fait created?.id || created?.data?.id
    const user = data?.data ?? data?.user ?? data;
    return { data: user };
  },
  update: async (id, userData) => {
    const data = await callManageUsers({ action: 'update', id, data: userData });
    const user = data?.data ?? data?.user ?? data;
    return { data: user };
  },
  delete: async (id) => {
    await callManageUsers({ action: 'delete', id });
    return { success: true };
  },
};

// ===== API Caisse (Registre) =====
export const registerApi = {
  getCurrentSession: async () => {
    const { data, error } = await supabase.from('cash_registers').select('*').eq('status', 'open').order('opened_at', { ascending: false }).limit(1).single();
    if (error && error.code !== 'PGRST116') throw error;
    return { data };
  },
  openSession: async (openingAmount) => {
    const { data, error } = await supabase.from('cash_registers').insert([{ opening_amount: openingAmount, status: 'open' }]).select().single();
    if (error) throw error;
    return { data };
  },
  closeSession: async (id, closeData) => {
    const { data, error } = await supabase.from('cash_registers').update({
      status: 'closed',
      closed_at: new Date().toISOString(),
      expected_amount: closeData.expected,
      counted_amount: closeData.counted,
      difference: closeData.diff,
      notes: closeData.notes
    }).eq('id', id).select().single();
    if (error) throw error;
    return { data };
  },
  addMovement: async (registerId, movement) => {
    const { data, error } = await supabase.from('cash_movements').insert([{
      register_id: registerId,
      type: movement.type,
      amount: movement.amount,
      reason: movement.reason
    }]).select().single();
    if (error) throw error;
    return { data };
  },
  getMovements: async (registerId) => {
    const { data, error } = await supabase.from('cash_movements').select('*').eq('register_id', registerId).order('created_at', { ascending: false });
    if (error) throw error;
    return { data };
  },
  getHistory: async () => {
    const { data, error } = await supabase.from('cash_registers').select('*').eq('status', 'closed').order('closed_at', { ascending: false }).limit(20);
    if (error) throw error;
    return { data };
  }
};

// ===== API Sorties Internes =====
export const internalOutputsApi = {
  getAll: async () => {
    const { data, error } = await supabase.from('internal_outputs').select('*, products(name)').order('created_at', { ascending: false });
    if (error) throw error;
    return { data };
  },
  create: async (payload) => {
    const quantity = Number(payload.quantity);
    if (!payload.product_id || !Number.isInteger(quantity) || quantity <= 0) throw new Error('Produit ou quantité invalide.');
    const { data: product, error: productError } = await supabase.from('products').select('id, quantity').eq('id', payload.product_id).single();
    if (productError) throw productError;
    const currentStock = Number(product.quantity) || 0;
    if (currentStock < quantity) throw new Error('Stock insuffisant.');
    const newStock = currentStock - quantity;
    const { error: stockError } = await supabase.from('products').update({ quantity: newStock }).eq('id', product.id);
    if (stockError) throw stockError;
    const { data: outputData, error: outputError } = await supabase.from('internal_outputs').insert([{
      product_id: payload.product_id,
      quantity,
      reason: payload.reason || 'other',
      notes: payload.notes || null
    }]).select('*, products(name)').single();
    if (outputError) {
      await supabase.from('products').update({ quantity: currentStock }).eq('id', product.id);
      throw outputError;
    }
    return { data: outputData };
  },
  update: async (id, payload) => {
    const quantity = Number(payload.quantity);
    if (!payload.product_id || !Number.isInteger(quantity) || quantity <= 0) throw new Error('Produit ou quantité invalide.');
    const { data: oldOutput, error: oldError } = await supabase.from('internal_outputs').select('*').eq('id', id).single();
    if (oldError) throw oldError;
    const oldProductId = oldOutput.product_id;
    const newProductId = payload.product_id;
    const oldQuantity = Number(oldOutput.quantity);
    const productIds = [...new Set([String(oldProductId), String(newProductId)])];
    const { data: products, error: productsError } = await supabase.from('products').select('id, quantity').in('id', productIds);
    if (productsError) throw productsError;
    const productMap = new Map(products.map(p => [String(p.id), p]));
    const oldProduct = productMap.get(String(oldProductId));
    const newProduct = productMap.get(String(newProductId));
    if (!oldProduct || !newProduct) throw new Error('Produit introuvable.');
    const stockChanges = new Map();
    if (String(oldProductId) === String(newProductId)) {
      stockChanges.set(String(oldProductId), Number(oldProduct.quantity) + oldQuantity - quantity);
    } else {
      stockChanges.set(String(oldProductId), Number(oldProduct.quantity) + oldQuantity);
      const availableStock = Number(newProduct.quantity) || 0;
      if (availableStock < quantity) throw new Error('Stock insuffisant pour le nouveau produit.');
      stockChanges.set(String(newProductId), availableStock - quantity);
    }
    const previousStocks = new Map();
    for (const [productId, newStock] of stockChanges) {
      if (newStock < 0) throw new Error('Stock insuffisant.');
      previousStocks.set(productId, Number(productMap.get(productId).quantity));
    }
    for (const [productId, newStock] of stockChanges) {
      const { error } = await supabase.from('products').update({ quantity: newStock }).eq('id', productId);
      if (error) {
        for (const [rollbackId, previousQuantity] of previousStocks) {
          await supabase.from('products').update({ quantity: previousQuantity }).eq('id', rollbackId);
        }
        throw error;
      }
    }
    const { data, error: updateError } = await supabase.from('internal_outputs').update({
      product_id: newProductId, quantity, reason: payload.reason || 'other', notes: payload.notes || null
    }).eq('id', id).select('*, products(name)').single();
    if (updateError) {
      for (const [productId, previousQuantity] of previousStocks) {
        await supabase.from('products').update({ quantity: previousQuantity }).eq('id', productId);
      }
      throw updateError;
    }
    return { data };
  },
  delete: async (id) => {
    const { data: output, error: outputError } = await supabase.from('internal_outputs').select('*').eq('id', id).single();
    if (outputError) throw outputError;
    const { data: product, error: productError } = await supabase.from('products').select('id, quantity').eq('id', output.product_id).single();
    if (productError) throw productError;
    const oldStock = Number(product.quantity) || 0;
    const restoredStock = oldStock + Number(output.quantity);
    const { error: stockError } = await supabase.from('products').update({ quantity: restoredStock }).eq('id', product.id);
    if (stockError) throw stockError;
    const { error: deleteError } = await supabase.from('internal_outputs').delete().eq('id', id);
    if (deleteError) {
      await supabase.from('products').update({ quantity: oldStock }).eq('id', product.id);
      throw deleteError;
    }
    return { success: true };
  }
};

// ===== API Retours Clients =====
export const returnsApi = {
  getAll: async () => {
    const { data, error } = await supabase.from('customer_returns').select('*, products(name)').order('created_at', { ascending: false });
    if (error) throw error;
    return { data };
  },
  create: async (payload) => {
    const quantity = Number(payload.quantity);
    const refundAmount = Number(payload.refund_amount) || 0;
    if (!payload.product_id || !Number.isInteger(quantity) || quantity <= 0) throw new Error('Produit ou quantité invalide.');
    const { data: product, error: productError } = await supabase.from('products').select('id, quantity').eq('id', payload.product_id).single();
    if (productError) throw productError;
    const { data: returnData, error: returnError } = await supabase.from('customer_returns').insert([{
      invoice_number: payload.invoice_number || null,
      product_id: payload.product_id,
      quantity,
      refund_amount: refundAmount,
      reason: payload.reason
    }]).select().single();
    if (returnError) throw returnError;
    const { error: stockError } = await supabase.from('products').update({ quantity: Number(product.quantity) + quantity }).eq('id', product.id);
    if (stockError) {
      await supabase.from('customer_returns').delete().eq('id', returnData.id);
      throw stockError;
    }
    return { data: returnData };
  },
  update: async (id, payload) => {
    const quantity = Number(payload.quantity);
    const refundAmount = Number(payload.refund_amount) || 0;
    if (!payload.product_id || !Number.isInteger(quantity) || quantity <= 0) throw new Error('Produit ou quantité invalide.');
    const { data: oldReturn, error: oldError } = await supabase.from('customer_returns').select('*').eq('id', id).single();
    if (oldError) throw oldError;
    const oldProductId = oldReturn.product_id;
    const newProductId = payload.product_id;
    const productIds = [...new Set([String(oldProductId), String(newProductId)])];
    const { data: products, error: productsError } = await supabase.from('products').select('id, quantity').in('id', productIds);
    if (productsError) throw productsError;
    const productMap = new Map(products.map(p => [String(p.id), p]));
    const oldProduct = productMap.get(String(oldProductId));
    const newProduct = productMap.get(String(newProductId));
    if (!oldProduct || !newProduct) throw new Error('Produit introuvable.');
    const stockChanges = new Map();
    if (String(oldProductId) === String(newProductId)) {
      stockChanges.set(String(oldProductId), Number(oldProduct.quantity) - Number(oldReturn.quantity) + quantity);
    } else {
      stockChanges.set(String(oldProductId), Number(oldProduct.quantity) - Number(oldReturn.quantity));
      stockChanges.set(String(newProductId), Number(newProduct.quantity) + quantity);
    }
    for (const [, newStock] of stockChanges) {
      if (newStock < 0) throw new Error('Stock insuffisant.');
    }
    const previousStocks = new Map();
    for (const [productId, newStock] of stockChanges) {
      const product = productMap.get(productId);
      previousStocks.set(productId, Number(product.quantity));
      const { error } = await supabase.from('products').update({ quantity: newStock }).eq('id', product.id);
      if (error) {
        for (const [rollbackId, previousQuantity] of previousStocks) {
          await supabase.from('products').update({ quantity: previousQuantity }).eq('id', rollbackId);
        }
        throw error;
      }
    }
    const { data, error: updateError } = await supabase.from('customer_returns').update({
      invoice_number: payload.invoice_number || null,
      product_id: newProductId,
      quantity,
      refund_amount: refundAmount,
      reason: payload.reason
    }).eq('id', id).select('*, products(name)').single();
    if (updateError) {
      for (const [productId, previousQuantity] of previousStocks) {
        await supabase.from('products').update({ quantity: previousQuantity }).eq('id', productId);
      }
      throw updateError;
    }
    return { data };
  },
  delete: async (id) => {
    const { data: returnData, error: returnError } = await supabase.from('customer_returns').select('*').eq('id', id).single();
    if (returnError) throw returnError;
    const { data: product, error: productError } = await supabase.from('products').select('id, quantity').eq('id', returnData.product_id).single();
    if (productError) throw productError;
    const oldStock = Number(product.quantity);
    const newStock = oldStock - Number(returnData.quantity);
    if (newStock < 0) throw new Error('Suppression impossible : le stock disponible est insuffisant.');
    const { error: stockError } = await supabase.from('products').update({ quantity: newStock }).eq('id', product.id);
    if (stockError) throw stockError;
    const { error: deleteError } = await supabase.from('customer_returns').delete().eq('id', id);
    if (deleteError) {
      await supabase.from('products').update({ quantity: oldStock }).eq('id', product.id);
      throw deleteError;
    }
    return { success: true };
  }
};

export default {};