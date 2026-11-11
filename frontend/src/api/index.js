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
        const { data, error } = await supabase.from('categories').select('*').order('name');
        if (error) throw error;
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
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        return { success: true };
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
            .select('*, suppliers(name), purchase_items(*, products(name))')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return { data };
    },
    
    create: async (purchaseData) => {
        // 1. إنشاء الفاتورة
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

        // 2. إضافة العناصر وتحديث المخزون
        if (purchaseData.items && purchaseData.items.length > 0) {
            // إضافة عناصر الفاتورة
            const items = purchaseData.items.map(item => ({
                purchase_id: purchase.id,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total: item.total
            }));
            
            const { error: itemsError } = await supabase.from('purchase_items').insert(items);
            if (itemsError) throw itemsError;

            // تحديث كمية المخزون لكل منتج (زيادة الكمية)
            for (const item of items) {
                // جلب الكمية الحالية
                const { data: product } = await supabase.from('products').select('quantity').eq('id', item.product_id).single();
                if (product) {
                    const newQuantity = product.quantity + item.quantity;
                    await supabase.from('products').update({ quantity: newQuantity }).eq('id', item.product_id);
                }
            }
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
export const internalOutputsApi = {
    getAll: async () => {
        const { data, error } = await supabase
            .from('internal_outputs')
            .select('*, products(name)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return { data };
    },
    create: async (payload) => {
        // 1. Enregistrer la sortie
        const { data: outputData, error: outputError } = await supabase
            .from('internal_outputs')
            .insert([{
                product_id: payload.product_id,
                quantity: payload.quantity,
                reason: payload.reason,
                notes: payload.notes
            }])
            .select()
            .single();
        if (outputError) throw outputError;

        // 2. Déduire le produit du stock
        const { data: product } = await supabase
            .from('products')
            .select('quantity')
            .eq('id', payload.product_id)
            .single();
        
        if (product) {
            await supabase
                .from('products')
                .update({ quantity: Math.max(0, Number(product.quantity) - Number(payload.quantity)) })
                .eq('id', payload.product_id);
        }
        return { data: outputData };
    }
};
// ===== API Retours Clients =====
export const returnsApi = {
    getAll: async () => {
        const { data, error } = await supabase
            .from('customer_returns')
            // On ne joint que la table products (qui a une clé étrangère product_id)
            .select('*, products(name)')
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error("Erreur Supabase (returnsApi):", error);
            throw error;
        }
        return { data };
    },
    create: async (payload) => {
        const { data: returnData, error: returnError } = await supabase
            .from('customer_returns')
            .insert([{
                invoice_number: payload.invoice_number || null,
                product_id: payload.product_id,
                quantity: payload.quantity,
                refund_amount: payload.refund_amount,
                reason: payload.reason
            }])
            .select()
            .single();
            
        if (returnError) throw returnError;

        // Mettre à jour le stock
        const { data: product } = await supabase
            .from('products')
            .select('quantity')
            .eq('id', payload.product_id)
            .single();
        
        if (product) {
            await supabase
                .from('products')
                .update({ quantity: Number(product.quantity) + Number(payload.quantity) })
                .eq('id', payload.product_id);
        }
        return { data: returnData };
    }
};
export default {}; 