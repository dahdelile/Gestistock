// src/api/index.js
import { supabase } from '../supabaseClient';

// دالة مساعدة للبحث عن الفئة بالاسم (لأنك في Laravel كنت تستخدم اسم الفئة، وفي Supabase استخدمنا ID)
const getCategoryIdByName = async (name) => {
    if (!name) return null;
    const { data, error } = await supabase.from('categories').select('id').eq('name', name).single();
    if (error && error.code !== 'PGRST116') return null; // PGRST116 يعني أنه لم يجد شيئاً
    return data ? data.id : null;
};

// ===== API Categories =====
export const categoriesApi = {
    getAll: async (params) => {
    const { data, error } = await supabase
        .from('categories')
        .select(`
            *,
            sous_categories (*)
        `)
        .order('name');

    if (error) {
        console.error('Erreur chargement catégories:', error);
        throw error;
    }

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
    // Sous-catégories
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
    getAll: async (params) => {
        // جلب المنتجات مع اسم الفئة المرتبطة
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
    create: async (productData) => {
        // تحويل اسم الفئة إلى ID قبل الحفظ
        const categoryId = await getCategoryIdByName(productData.category);
        const dbPayload = { ...productData, category_id: categoryId };
        delete dbPayload.category; // حذف الاسم القديم لتجنب الخطأ

        const { data: res, error } = await supabase.from('products').insert([dbPayload]).select();
        if (error) throw error;
        return { data: res[0] };
    },
   // Dans src/api/index.js

update: async (id, productData) => {
    // 1. Si 'category' (le nom) est fourni, on récupère son ID
    let categoryId = productData.category_id;
    if (productData.category) {
        categoryId = await getCategoryIdByName(productData.category);
    }

    // 2. On construit un objet propre avec UNIQUEMENT les colonnes de la table
    const dbPayload = {
        name: productData.name,
        barcode: productData.barcode,
        status: productData.status,
        purchase_price: productData.purchase_price,
        sale_price: productData.sale_price,
        quantity: productData.quantity,
        min_quantity: productData.min_quantity,
        supplier_id: productData.supplier_id,
        category_id: categoryId
    };

    // 3. On supprime les clés non définies (undefined) pour ne pas écraser des données existantes
    Object.keys(dbPayload).forEach(key => {
        if (dbPayload[key] === undefined) delete dbPayload[key];
    });

    // 4. On envoie l'objet filtré à Supabase
    const { data: res, error } = await supabase.from('products').update(dbPayload).eq('id', id).select();
    if (error) throw error;
    return { data: res[0] };
},
   
delete: async (id) => {
    // Vérifier si le produit est utilisé dans des opérations historiques
    const relatedTables = [
        'invoice_items',
        'inventory_transactions',
        'purchase_items',
        'customer_returns',
        'internal_outputs'
    ];

    let isReferenced = false;

    for (const table of relatedTables) {
        const { data, error } = await supabase
            .from(table)
            .select('id')
            .eq('product_id', id)
            .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
            isReferenced = true;
            break;
        }
    }

    // Si le produit possède un historique, le désactiver
    if (isReferenced) {
        const { data, error } = await supabase
            .from('products')
            .update({ status: 'inactive' })
            .eq('id', id)
            .select();

        if (error) throw error;

        return {
            success: true,
            archived: true,
            data: data?.[0]
        };
    }

    // Sinon, autoriser la suppression définitive
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

    if (error) throw error;

    return {
        success: true,
        archived: false
    };
},

    getLowStock: async () => {
        // جلب المنتجات التي كميتها أقل من أو تساوي الحد الأدنى
        const { data, error } = await supabase.from('products').select('*').filter('quantity', 'lte', 'min_quantity');
        if (error) throw error;
        return { data };
    },
    getStats: async () => {
        const { data, error } = await supabase.from('products').select('quantity, min_quantity, purchase_price, sale_price');
        if (error) throw error;
        const totalProducts = data.length;
        const stockValue = data.reduce((acc, p) => acc + (p.quantity * p.purchase_price), 0);
        return { data: { totalProducts, stockValue } };
    }
};

// ===== API Customers =====
export const customersApi = {
    getAll: async (params) => {
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
    getAll: async (params) => {
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
    getAll: async (params) => {
        const { data, error } = await supabase
            .from('invoices')
            .select('*, customers(name)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return { data };
    },
    getById: async (id) => {
        const { data, error } = await supabase
            .from('invoices')
            .select('*, customers(name), invoice_items(*, products(name))')
            .eq('id', id)
            .single();
        if (error) throw error;
        return { data };
    },
    create: async (data) => {
        // إنشاء الفاتورة
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

        // إضافة عناصر الفاتورة إذا وجدت
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
    getSalesReport: async (params) => {
        const { data, error } = await supabase.from('invoices').select('*').eq('status', 'paid');
        if (error) throw error;
        return { data };
    }
};

// ===== API Expenses =====
export const expensesApi = {
    getAll: async (params) => {
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
        const { data, error } = await supabase
            .from('invoices')
            .select('*, customers(name), invoice_items(*, products(name))')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return { data };
    },
    getById: async (id) => {
        const { data, error } = await supabase
            .from('invoices')
            .select('*, customers(name), invoice_items(*, products(name))')
            .eq('id', id)
            .single();
        if (error) throw error;
        return { data };
    },
    checkout: async (payload) => {
        // 1. إنشاء الفاتورة في جدول invoices
        const { data: invoice, error: invError } = await supabase
            .from('invoices')
            .insert([{
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
            }])
            .select()
            .single();

        if (invError) throw invError;

        // 2. إضافة عناصر الفاتورة في جدول invoice_items
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

            // 3. خصم الكمية من المخزون (هذا هو الجزء المهم)
            for (const item of payload.items) {
                // جلب الكمية الحالية للمنتج
                const { data: product, error: prodError } = await supabase
                    .from('products')
                    .select('quantity')
                    .eq('id', item.product_id)
                    .single();

                if (prodError) {
                    console.error("خطأ في جلب المنتج:", prodError);
                    continue;
                }

                // حساب الكمية الجديدة
                const newQuantity = Math.max(0, product.quantity - item.quantity);

                // تحديث المخزون
                const { error: updateError } = await supabase
                    .from('products')
                    .update({ quantity: newQuantity })
                    .eq('id', item.product_id);

                if (updateError) {
                    console.error("خطأ في تحديث المخزون:", updateError);
                }
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
   
  // أضف هذا داخل salesApi
deleteSale: async (id, items) => {
    // 1. إعادة الكميات إلى المخزون قبل الحذف
    for (const item of items) {
        const { data: product } = await supabase.from('products').select('quantity').eq('id', item.product_id).single();
        if (product) {
            const newQuantity = product.quantity + item.quantity;
            await supabase.from('products').update({ quantity: newQuantity }).eq('id', item.product_id);
        }
    }
    // 2. حذف الفاتورة (سيتم حذف العناصر تلقائياً بسبب ON DELETE CASCADE)
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
        
        // جلب إجمالي المبيعات
        const { data: sales } = await supabase.from('invoices').select('grand_total').eq('status', 'paid');
        const totalSales = sales ? sales.reduce((acc, inv) => acc + Number(inv.grand_total), 0) : 0;

        return { 
            data: { 
                totalProducts: productsCount.count || 0, 
                totalInvoices: invoicesCount.count || 0,
                totalSales: totalSales
            } 
        };
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
        // 1. Créer l'en-tête de l'achat
        const { data: purchase, error: purError } = await supabase
            .from('purchases')
            .insert([{
                purchase_number: purchaseData.purchase_number,
                supplier_id: purchaseData.supplier_id,
                total: purchaseData.total,
                status: purchaseData.status,
                purchase_date: new Date().toISOString(),
                notes: purchaseData.notes
            }])
            .select()
            .single();
        if (purError) throw purError;

        // 2. Résoudre chaque sous-catégorie en produit et mettre le stock à jour
        const purchaseItems = [];
        for (const item of (purchaseData.items || [])) {
            const categoryId = Number(item.category_id);
            const subcategoryId = Number(item.subcategory_id);
            const quantity = Number(item.quantity);
            const unitPrice = Number(item.unit_price);

            if (!categoryId || !subcategoryId || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) {
                throw new Error('Catégorie, sous-catégorie, quantité ou prix invalide.');
            }

            const { data: subcategory, error: subError } = await supabase
                .from('sous_categories')
                .select('id, name, category_id')
                .eq('id', subcategoryId)
                .eq('category_id', categoryId)
                .single();
            if (subError) throw subError;

            // L'identité du produit est la paire catégorie + sous-catégorie.
            const { data: matches, error: findError } = await supabase
                .from('products')
                .select('id, quantity')
                .eq('category_id', categoryId)
                .eq('subcategory_id', subcategoryId)
                .limit(1);
            if (findError) throw findError;

            let productId;
            if (matches && matches.length > 0) {
                const existing = matches[0];
                const { data: updated, error: updateError } = await supabase
                    .from('products')
                    .update({
                        quantity: Number(existing.quantity || 0) + quantity,
                        purchase_price: unitPrice,
                        supplier_id: purchaseData.supplier_id || null,
                        name: subcategory.name,
                        category_id: categoryId,
                        subcategory_id: subcategoryId,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existing.id)
                    .select('id')
                    .single();
                if (updateError) throw updateError;
                productId = updated.id;
            } else {
                // sale_price est obligatoire dans votre table : le prix d'achat est utilisé comme valeur initiale.
                const { data: created, error: createError } = await supabase
                    .from('products')
                    .insert([{
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
                    }])
                    .select('id')
                    .single();
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

        // 3. Enregistrer les lignes d'historique. Le stock a déjà été incrémenté ci-dessus.
        if (purchaseItems.length > 0) {
            const { error: itemsError } = await supabase.from('purchase_items').insert(purchaseItems);
            if (itemsError) throw itemsError;
        }

        return { data: purchase };
    },
    deletePurchase: async (id, items) => {
        // خصم الكميات من المخزون لأننا نحذف فاتورة شراء
        for (const item of items) {
            const { data: product } = await supabase.from('products').select('quantity').eq('id', item.product_id).single();
            if (product) {
                const newQuantity = Math.max(0, product.quantity - item.quantity);
                await supabase.from('products').update({ quantity: newQuantity }).eq('id', item.product_id);
            }
        }
        // حذف الفاتورة
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

export const usersApi = {
  getAll: async () => {
    const { data, error } = await supabase.functions.invoke(
      'manage-users',
      { body: { action: 'list' } }
    );

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    return { data: data.data || [] };
  },

  create: async (userData) => {
    const { data, error } = await supabase.functions.invoke(
      'manage-users',
      { body: { action: 'create', data: userData } }
    );

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    return { data: data.data };
  },

  update: async (id, userData) => {
    const { data, error } = await supabase.functions.invoke(
      'manage-users',
      { body: { action: 'update', id, data: userData } }
    );

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    return { data: data.data };
  },

  delete: async (id) => {
    const { data, error } = await supabase.functions.invoke(
      'manage-users',
      { body: { action: 'delete', id } }
    );

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    return { success: true };
  }
};

// ===== API Caisse (Registre) =====
export const registerApi = {
    getCurrentSession: async () => {
        const { data, error } = await supabase
            .from('cash_registers')
            .select('*')
            .eq('status', 'open')
            .order('opened_at', { ascending: false })
            .limit(1)
            .single();
        if (error && error.code !== 'PGRST116') throw error; 
        return { data };
    },
    openSession: async (openingAmount) => {
        const { data, error } = await supabase
            .from('cash_registers')
            .insert([{ opening_amount: openingAmount, status: 'open' }])
            .select().single();
        if (error) throw error;
        return { data };
    },
    closeSession: async (id, closeData) => {
        const { data, error } = await supabase
            .from('cash_registers')
            .update({
                status: 'closed',
                closed_at: new Date().toISOString(),
                expected_amount: closeData.expected,
                counted_amount: closeData.counted,
                difference: closeData.diff,
                notes: closeData.notes
            })
            .eq('id', id).select().single();
        if (error) throw error;
        return { data };
    },
    addMovement: async (registerId, movement) => {
        const { data, error } = await supabase
            .from('cash_movements')
            .insert([{
                register_id: registerId,
                type: movement.type,
                amount: movement.amount,
                reason: movement.reason
            }])
            .select().single();
        if (error) throw error;
        return { data };
    },
    getMovements: async (registerId) => {
        const { data, error } = await supabase
            .from('cash_movements')
            .select('*')
            .eq('register_id', registerId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return { data };
    },
    getHistory: async () => {
        const { data, error } = await supabase
            .from('cash_registers')
            .select('*')
            .eq('status', 'closed')
            .order('closed_at', { ascending: false })
            .limit(20);
        if (error) throw error;
        return { data };
    }
};
// ===== API Retours Clients =====


// ===== API Sorties Internes =====

// ===== API Sorties Internes =====
export const internalOutputsApi = {

    // Récupérer toutes les sorties internes
    getAll: async () => {
        const { data, error } = await supabase
            .from('internal_outputs')
            .select('*, products(name)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { data };
    },

    // Créer une sortie et diminuer le stock
    create: async (payload) => {
        const quantity = Number(payload.quantity);

        if (!payload.product_id || !Number.isInteger(quantity) || quantity <= 0) {
            throw new Error('Produit ou quantité invalide.');
        }

        // Vérifier le produit et son stock
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('id, quantity')
            .eq('id', payload.product_id)
            .single();

        if (productError) throw productError;

        const currentStock = Number(product.quantity) || 0;

        if (currentStock < quantity) {
            throw new Error('Stock insuffisant.');
        }

        const newStock = currentStock - quantity;

        // Diminuer le stock
        const { error: stockError } = await supabase
            .from('products')
            .update({ quantity: newStock })
            .eq('id', product.id);

        if (stockError) throw stockError;

        // Enregistrer la sortie
        const { data: outputData, error: outputError } = await supabase
            .from('internal_outputs')
            .insert([{
                product_id: payload.product_id,
                quantity,
                reason: payload.reason || 'other',
                notes: payload.notes || null
            }])
            .select('*, products(name)')
            .single();

        if (outputError) {
            // Restaurer le stock si l'enregistrement échoue
            await supabase
                .from('products')
                .update({ quantity: currentStock })
                .eq('id', product.id);

            throw outputError;
        }

        return { data: outputData };
    },

    // Modifier une sortie existante
    update: async (id, payload) => {
        const quantity = Number(payload.quantity);

        if (!payload.product_id || !Number.isInteger(quantity) || quantity <= 0) {
            throw new Error('Produit ou quantité invalide.');
        }

        // Récupérer l'ancienne sortie
        const { data: oldOutput, error: oldError } = await supabase
            .from('internal_outputs')
            .select('*')
            .eq('id', id)
            .single();

        if (oldError) throw oldError;

        const oldProductId = oldOutput.product_id;
        const newProductId = payload.product_id;
        const oldQuantity = Number(oldOutput.quantity);

        // Récupérer les produits concernés
        const productIds = [...new Set([
            String(oldProductId),
            String(newProductId)
        ])];

        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id, quantity')
            .in('id', productIds);

        if (productsError) throw productsError;

        const productMap = new Map(
            products.map(p => [String(p.id), p])
        );

        const oldProduct = productMap.get(String(oldProductId));
        const newProduct = productMap.get(String(newProductId));

        if (!oldProduct || !newProduct) {
            throw new Error('Produit introuvable.');
        }

        // Calculer les nouveaux stocks
        const stockChanges = new Map();

        if (String(oldProductId) === String(newProductId)) {
            // Même produit : restituer l'ancienne quantité puis retirer la nouvelle
            stockChanges.set(
                String(oldProductId),
                Number(oldProduct.quantity) + oldQuantity - quantity
            );
        } else {
            // Produit différent : restituer l'ancien et retirer du nouveau
            stockChanges.set(
                String(oldProductId),
                Number(oldProduct.quantity) + oldQuantity
            );

            const availableStock = Number(newProduct.quantity) || 0;

            if (availableStock < quantity) {
                throw new Error('Stock insuffisant pour le nouveau produit.');
            }

            stockChanges.set(
                String(newProductId),
                availableStock - quantity
            );
        }

        // Sauvegarder les anciens stocks pour un éventuel retour arrière
        const previousStocks = new Map();

        for (const [productId, newStock] of stockChanges) {
            if (newStock < 0) {
                throw new Error('Stock insuffisant.');
            }

            previousStocks.set(
                productId,
                Number(productMap.get(productId).quantity)
            );
        }

        // Appliquer les modifications de stock
        for (const [productId, newStock] of stockChanges) {
            const { error } = await supabase
                .from('products')
                .update({ quantity: newStock })
                .eq('id', productId);

            if (error) {
                // Restaurer les stocks déjà modifiés
                for (const [rollbackId, previousQuantity] of previousStocks) {
                    await supabase
                        .from('products')
                        .update({ quantity: previousQuantity })
                        .eq('id', rollbackId);
                }

                throw error;
            }
        }

        // Modifier la sortie
        const { data, error: updateError } = await supabase
            .from('internal_outputs')
            .update({
                product_id: newProductId,
                quantity,
                reason: payload.reason || 'other',
                notes: payload.notes || null
            })
            .eq('id', id)
            .select('*, products(name)')
            .single();

        if (updateError) {
            // Restaurer les stocks si la modification échoue
            for (const [productId, previousQuantity] of previousStocks) {
                await supabase
                    .from('products')
                    .update({ quantity: previousQuantity })
                    .eq('id', productId);
            }

            throw updateError;
        }

        return { data };
    },

    // Supprimer une sortie et restituer le stock
    delete: async (id) => {
        // Récupérer la sortie
        const { data: output, error: outputError } = await supabase
            .from('internal_outputs')
            .select('*')
            .eq('id', id)
            .single();

        if (outputError) throw outputError;

        // Récupérer le produit
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('id, quantity')
            .eq('id', output.product_id)
            .single();

        if (productError) throw productError;

        const oldStock = Number(product.quantity) || 0;
        const restoredStock = oldStock + Number(output.quantity);

        // Restituer la quantité au stock
        const { error: stockError } = await supabase
            .from('products')
            .update({ quantity: restoredStock })
            .eq('id', product.id);

        if (stockError) throw stockError;

        // Supprimer la sortie
        const { error: deleteError } = await supabase
            .from('internal_outputs')
            .delete()
            .eq('id', id);

        if (deleteError) {
            // Restaurer le stock si la suppression échoue
            await supabase
                .from('products')
                .update({ quantity: oldStock })
                .eq('id', product.id);

            throw deleteError;
        }

        return { success: true };
    }
};

// ===== API Retours Clients =====
// ===== API Retours Clients =====
export const returnsApi = {
    // Récupérer tous les retours
    getAll: async () => {
        const { data, error } = await supabase
            .from('customer_returns')
            .select('*, products(name)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { data };
    },

    // Enregistrer un nouveau retour
    create: async (payload) => {
        const quantity = Number(payload.quantity);
        const refundAmount = Number(payload.refund_amount) || 0;

        if (!payload.product_id || !Number.isInteger(quantity) || quantity <= 0) {
            throw new Error('Produit ou quantité invalide.');
        }

        // Vérifier le produit
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('id, quantity')
            .eq('id', payload.product_id)
            .single();

        if (productError) throw productError;

        // Créer le retour
        const { data: returnData, error: returnError } = await supabase
            .from('customer_returns')
            .insert([{
                invoice_number: payload.invoice_number || null,
                product_id: payload.product_id,
                quantity,
                refund_amount: refundAmount,
                reason: payload.reason
            }])
            .select()
            .single();

        if (returnError) throw returnError;

        // Ajouter la quantité au stock
        const { error: stockError } = await supabase
            .from('products')
            .update({
                quantity: Number(product.quantity) + quantity
            })
            .eq('id', product.id);

        if (stockError) {
            // Annuler le retour si la mise à jour du stock échoue
            await supabase
                .from('customer_returns')
                .delete()
                .eq('id', returnData.id);

            throw stockError;
        }

        return { data: returnData };
    },

    // Modifier un retour existant
    update: async (id, payload) => {
        const quantity = Number(payload.quantity);
        const refundAmount = Number(payload.refund_amount) || 0;

        if (!payload.product_id || !Number.isInteger(quantity) || quantity <= 0) {
            throw new Error('Produit ou quantité invalide.');
        }

        // Récupérer les anciennes données directement depuis Supabase
        const { data: oldReturn, error: oldError } = await supabase
            .from('customer_returns')
            .select('*')
            .eq('id', id)
            .single();

        if (oldError) throw oldError;

        const oldProductId = oldReturn.product_id;
        const newProductId = payload.product_id;

        // Récupérer les produits concernés
        const productIds = [...new Set([
            String(oldProductId),
            String(newProductId)
        ])];

        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id, quantity')
            .in('id', productIds);

        if (productsError) throw productsError;

        const productMap = new Map(
            products.map(p => [String(p.id), p])
        );

        const oldProduct = productMap.get(String(oldProductId));
        const newProduct = productMap.get(String(newProductId));

        if (!oldProduct || !newProduct) {
            throw new Error('Produit introuvable.');
        }

        // Calculer les nouvelles quantités de stock
        const stockChanges = new Map();

        if (String(oldProductId) === String(newProductId)) {
            stockChanges.set(
                String(oldProductId),
                Number(oldProduct.quantity)
                    - Number(oldReturn.quantity)
                    + quantity
            );
        } else {
            stockChanges.set(
                String(oldProductId),
                Number(oldProduct.quantity) - Number(oldReturn.quantity)
            );

            stockChanges.set(
                String(newProductId),
                Number(newProduct.quantity) + quantity
            );
        }

        // Empêcher un stock négatif
        for (const [productId, newStock] of stockChanges) {
            if (newStock < 0) {
                throw new Error(
                    `Stock insuffisant pour le produit ${productId}.`
                );
            }
        }

        // Conserver les anciennes quantités pour pouvoir annuler en cas d'erreur
        const previousStocks = new Map();

        for (const [productId, newStock] of stockChanges) {
            const product = productMap.get(productId);

            previousStocks.set(productId, Number(product.quantity));

            const { error } = await supabase
                .from('products')
                .update({ quantity: newStock })
                .eq('id', product.id);

            if (error) {
                // Restaurer les stocks déjà modifiés
                for (const [rollbackId, previousQuantity] of previousStocks) {
                    await supabase
                        .from('products')
                        .update({ quantity: previousQuantity })
                        .eq('id', rollbackId);
                }

                throw error;
            }
        }

        // Modifier le retour
        const { data, error: updateError } = await supabase
            .from('customer_returns')
            .update({
                invoice_number: payload.invoice_number || null,
                product_id: newProductId,
                quantity,
                refund_amount: refundAmount,
                reason: payload.reason
            })
            .eq('id', id)
            .select('*, products(name)')
            .single();

        if (updateError) {
            // Restaurer les stocks si la modification échoue
            for (const [productId, previousQuantity] of previousStocks) {
                await supabase
                    .from('products')
                    .update({ quantity: previousQuantity })
                    .eq('id', productId);
            }

            throw updateError;
        }

        return { data };
    },

    // Supprimer un retour
    delete: async (id) => {
        // Récupérer le retour
        const { data: returnData, error: returnError } = await supabase
            .from('customer_returns')
            .select('*')
            .eq('id', id)
            .single();

        if (returnError) throw returnError;

        // Récupérer le produit concerné
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('id, quantity')
            .eq('id', returnData.product_id)
            .single();

        if (productError) throw productError;

        const oldStock = Number(product.quantity);
        const quantityToRemove = Number(returnData.quantity);
        const newStock = oldStock - quantityToRemove;

        if (newStock < 0) {
            throw new Error(
                'Suppression impossible : le stock disponible est insuffisant.'
            );
        }

        // Diminuer le stock
        const { error: stockError } = await supabase
            .from('products')
            .update({ quantity: newStock })
            .eq('id', product.id);

        if (stockError) throw stockError;

        // Supprimer le retour
        const { error: deleteError } = await supabase
            .from('customer_returns')
            .delete()
            .eq('id', id);

        if (deleteError) {
            // Restaurer le stock si la suppression échoue
            await supabase
                .from('products')
                .update({ quantity: oldStock })
                .eq('id', product.id);

            throw deleteError;
        }

        return { success: true };
    }
};
export default {}; 