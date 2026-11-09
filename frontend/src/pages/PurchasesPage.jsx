// src/pages/PurchasesPage.jsx
// Version bilingue Français / العربية (RTL) — design unifié ExpensesPage
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { purchasesApi, suppliersApi, productsApi } from '../api';
import { useLanguage } from '../context/LanguageContext';
/* =========================================================
   TRADUCTIONS / الترجمة
========================================================= */

const I18N = {
  fr: {
    dir: 'ltr',
    locale: 'fr-FR',
    currency: 'MRU',
    title: 'Gestion des achats',
    subtitle: 'Gérez vos achats, vos fournisseurs et le détail de chaque commande.',
    eyebrow: 'GESTISTOCK / APPROVISIONNEMENT',
    add: 'Nouvel achat',
    export: 'Exporter',
    refresh: 'Actualiser',
    stat_daily: 'Achats du jour',
    stat_daily_sub: (v) => `Dépenses : ${v}`,
    stat_monthly: 'Achats du mois',
    stat_monthly_sub: (v) => `Dépenses : ${v}`,
    stat_total: 'Total achats',
    stat_total_sub: 'Enregistrés',
    stat_amount: 'Montant global',
    history: 'Historique des achats',
    history_sub: (n) => `${n} résultat(s) affiché(s)`,
    search_ph: 'Rechercher un numéro, fournisseur...',
    all_status: 'Tous les statuts',
    received: 'Réceptionné',
    pending: 'En attente',
    cancelled: 'Annulé',
    draft: 'Brouillon',
    completed: 'Terminé',
    paid: 'Payé',
    unpaid: 'Non payé',
    recorded: 'Enregistré',
    start_date: 'Date de début',
    end_date: 'Date de fin',
    loading: 'Chargement des achats...',
    none_title: 'Aucun achat enregistré',
    none_search: 'Aucun résultat trouvé',
    none_sub: 'Commencez par créer votre premier achat.',
    none_search_sub: 'Modifiez votre recherche ou vos filtres.',
    none_add: 'Créer un achat',
    reset: 'Réinitialiser les filtres',
    th_ref: 'Référence',
    th_supplier: 'Fournisseur',
    th_date: 'Date',
    th_products: 'Produit(s)',
    th_qty: 'Quantité',
    th_unit_price: 'Prix unitaire',
    th_total: 'Montant total',
    th_status: 'Statut',
    th_actions: 'Actions',
    id_label: (id) => `ID : ${id}`,
    units: (n) => `${n} unité(s)`,
    view: 'Voir les détails',
    edit: 'Modifier',
    print: 'Imprimer',
    delete: 'Supprimer',
    footer_show: (shown, total) => `Affichage de ${shown} sur ${total} achat(s)`,
    footer_total: 'Total des résultats :',
    // Modal form
    modal_new: 'Nouvel achat',
    modal_edit: 'Modifier un achat',
    modal_sub: 'Renseignez les informations et ajoutez les produits achetés.',
    section_general: 'Informations générales',
    section_products: 'Ajouter des produits',
    f_number: "Numéro d'achat",
    f_number_ph: 'Ex. ACH-2026-001',
    f_supplier: 'Fournisseur',
    f_supplier_ph: 'Sélectionner un fournisseur (Optionnel)',
    f_notes: 'Notes / Observations',
    f_notes_ph: 'Informations complémentaires...',
    f_product: 'Produit',
    f_product_ph: 'Sélectionner un produit',
    f_qty: 'Quantité',
    f_price: 'Prix unitaire (MRU)',
    btn_add: 'Ajouter',
    cart_empty: 'Aucun produit ajouté pour le moment.',
    cart_product: 'Produit',
    cart_subtotal: 'Sous-total',
    cart_action: 'Action',
    cart_total: 'Total de la commande',
    cart_distinct: (n) => `${n} produit(s) différent(s)`,
    cancel: 'Annuler',
    save: 'Enregistrer l’achat',
    save_edit: 'Enregistrer les modifications',
    saving: 'Enregistrement...',
    // Modal details
    details_title: "Détails de l'achat",
    details_ref: 'Référence :',
    details_section: 'Articles achetés',
    details_empty: 'Aucun article détaillé pour cet achat.',
    details_notes: 'Notes / Observations',
    details_total: 'Total général',
    close: 'Fermer',
    // Modal delete
    delete_title: 'Supprimer cet achat ?',
    delete_sub: 'Cette action peut être irréversible.',
    delete_confirm_q: "Confirmez-vous la suppression de l'achat",
    delete_confirm: 'Oui, supprimer',
    deleting: 'Suppression...',
    // Messages
    err_load: 'Erreur de chargement des achats.',
    err_save: "Erreur lors de l'enregistrement de l'achat.",
    err_delete: "Erreur lors de la suppression de l'achat.",
    ok_saved: 'Achat enregistré avec succès.',
    ok_updated: 'Achat modifié avec succès.',
    ok_deleted: 'Achat supprimé avec succès.',
    warn_no_product: 'Veuillez sélectionner un produit.',
    warn_qty: 'La quantité doit être supérieure à zéro.',
    warn_price: 'Veuillez saisir un prix unitaire valide.',
    warn_cart_empty: 'Ajoutez au moins un produit à cet achat.',
    warn_popup: 'Autorisez les fenêtres pop-up pour imprimer.',
    supplier_none: 'Fournisseur non renseigné',
    product_unknown: 'Produit',
    switch_title: 'Changer de langue',
  },
  ar: {
    dir: 'rtl',
    locale: 'ar-u-nu-latn',
    currency: 'أوقية',
    title: 'إدارة المشتريات',
    subtitle: 'أدر مشترياتك ومورديك وتفاصيل كل طلبية.',
    eyebrow: 'GESTISTOCK / التزويد',
    add: 'شراء جديد',
    export: 'تصدير',
    refresh: 'تحديث',
    stat_daily: 'مشتريات اليوم',
    stat_daily_sub: (v) => `المصروفات: ${v}`,
    stat_monthly: 'مشتريات الشهر',
    stat_monthly_sub: (v) => `المصروفات: ${v}`,
    stat_total: 'إجمالي المشتريات',
    stat_total_sub: 'المسجلة',
    stat_amount: 'المبلغ الإجمالي',
    history: 'سجل المشتريات',
    history_sub: (n) => `${n} نتيجة معروضة`,
    search_ph: 'ابحث برقم أو مورد...',
    all_status: 'كل الحالات',
    received: 'مستلمة',
    pending: 'قيد الانتظار',
    cancelled: 'ملغاة',
    draft: 'مسودة',
    completed: 'مكتملة',
    paid: 'مدفوعة',
    unpaid: 'غير مدفوعة',
    recorded: 'مسجلة',
    start_date: 'تاريخ البداية',
    end_date: 'تاريخ النهاية',
    loading: 'جارٍ تحميل المشتريات...',
    none_title: 'لا توجد مشتريات مسجلة',
    none_search: 'لا توجد نتائج',
    none_sub: 'ابدأ بإنشاء أول عملية شراء.',
    none_search_sub: 'عدّل البحث أو الفلاتر.',
    none_add: 'إنشاء عملية شراء',
    reset: 'إعادة تعيين الفلاتر',
    th_ref: 'المرجع',
    th_supplier: 'المورد',
    th_date: 'التاريخ',
    th_products: 'المنتج (المنتجات)',
    th_qty: 'الكمية',
    th_unit_price: 'سعر الوحدة',
    th_total: 'المبلغ الإجمالي',
    th_status: 'الحالة',
    th_actions: 'إجراءات',
    id_label: (id) => `المعرف: ${id}`,
    units: (n) => `${n} وحدة`,
    view: 'عرض التفاصيل',
    edit: 'تعديل',
    print: 'طباعة',
    delete: 'حذف',
    footer_show: (shown, total) => `عرض ${shown} من ${total} عملية شراء`,
    footer_total: 'إجمالي النتائج:',
    modal_new: 'شراء جديد',
    modal_edit: 'تعديل عملية شراء',
    modal_sub: 'أدخل المعلومات وأضف المنتجات المشتراة.',
    section_general: 'معلومات عامة',
    section_products: 'إضافة منتجات',
    f_number: 'رقم الشراء',
    f_number_ph: 'مثال: ACH-2026-001',
    f_supplier: 'المورد',
    f_supplier_ph: 'اختر موردًا (اختياري)',
    f_notes: 'ملاحظات',
    f_notes_ph: 'معلومات إضافية...',
    f_product: 'المنتج',
    f_product_ph: 'اختر منتجًا',
    f_qty: 'الكمية',
    f_price: 'سعر الوحدة (أوقية)',
    btn_add: 'إضافة',
    cart_empty: 'لم تُضف أي منتجات بعد.',
    cart_product: 'المنتج',
    cart_subtotal: 'المجموع الفرعي',
    cart_action: 'إجراء',
    cart_total: 'إجمالي الطلبية',
    cart_distinct: (n) => `${n} منتج مختلف`,
    cancel: 'إلغاء',
    save: 'حفظ الشراء',
    save_edit: 'حفظ التعديلات',
    saving: 'جارٍ الحفظ...',
    details_title: 'تفاصيل الشراء',
    details_ref: 'المرجع:',
    details_section: 'المنتجات المشتراة',
    details_empty: 'لا توجد تفاصيل لهذه العملية.',
    details_notes: 'ملاحظات',
    details_total: 'الإجمالي العام',
    close: 'إغلاق',
    delete_title: 'حذف عملية الشراء؟',
    delete_sub: 'قد يكون هذا الإجراء غير قابل للتراجع.',
    delete_confirm_q: 'هل تؤكد حذف العملية',
    delete_confirm: 'نعم، احذف',
    deleting: 'جارٍ الحذف...',
    err_load: 'تعذّر تحميل المشتريات.',
    err_save: 'حدث خطأ أثناء حفظ الشراء.',
    err_delete: 'حدث خطأ أثناء حذف الشراء.',
    ok_saved: 'تم حفظ الشراء بنجاح.',
    ok_updated: 'تم تعديل الشراء بنجاح.',
    ok_deleted: 'تم حذف الشراء بنجاح.',
    warn_no_product: 'الرجاء اختيار منتج.',
    warn_qty: 'يجب أن تكون الكمية أكبر من صفر.',
    warn_price: 'أدخل سعر وحدة صالحًا.',
    warn_cart_empty: 'أضف منتجًا واحدًا على الأقل.',
    warn_popup: 'اسمح بالنوافذ المنبثقة للطباعة.',
    supplier_none: 'مورد غير محدد',
    product_unknown: 'منتج',
    switch_title: 'تغيير اللغة',
  },
};



/* =========================================================
   UTILITAIRES
========================================================= */

const emptyForm = () => ({ purchase_number: '', supplier_id: '', notes: '' });
const emptyItem = () => ({ product_id: '', quantity: 1, unit_price: '' });

const formatMoney = (value, cur = 'MRU') => {
  const n = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(value) || 0);
  return `${n} ${cur}`;
};

const formatDate = (value, locale) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(locale);
};

const getRows = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
};

const getPurchaseItems = (purchase) => purchase?.purchase_items || purchase?.items || [];

const getSupplierName = (purchase, suppliers = [], fallback = 'Fournisseur non renseigné') => {
  const supplier = purchase?.suppliers || suppliers.find((item) => String(item.id) === String(purchase?.supplier_id));
  return supplier?.name || fallback;
};

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));

/* =========================================================
   COMPOSANT
========================================================= */

const PurchasesPage = () => {
const { lang } = useLanguage(); // langue globale (menu)
const t = I18N[lang];
const cur = t.currency;
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Filtres
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const [editingPurchase, setEditingPurchase] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [purchaseToDelete, setPurchaseToDelete] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [currentItem, setCurrentItem] = useState(emptyItem);
  const [cart, setCart] = useState([]);
  const [notice, setNotice] = useState(null);

  const notify = useCallback((message, type = 'success') => {
    setNotice({ message, type });
    window.setTimeout(() => {
      setNotice((current) => (current?.message === message ? null : current));
    }, 4000);
  }, []);

  /* ---------- Chargement ---------- */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [purchaseResponse, supplierResponse, productResponse] = await Promise.all([
        purchasesApi.getAll(),
        suppliersApi.getAll(),
        productsApi.getAll(),
      ]);
      setPurchases(getRows(purchaseResponse));
      setSuppliers(getRows(supplierResponse));
      setProducts(getRows(productResponse));
    } catch (error) {
      console.error('Erreur de chargement des achats :', error);
      notify(t.err_load, 'danger');
    } finally {
      setLoading(false);
    }
  }, [notify, t.err_load]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ---------- Statistiques ---------- */
  const stats = useMemo(() => {
    const totalAmount = purchases.reduce((sum, p) => sum + Number(p.total || 0), 0);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    let monthlyAmount = 0;
    let monthlyCount = 0;
    let dailyAmount = 0;
    let dailyCount = 0;

    purchases.forEach((p) => {
      const date = new Date(p.purchase_date || p.created_at);
      if (Number.isNaN(date.getTime())) return;
      if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
        monthlyAmount += Number(p.total || 0);
        monthlyCount += 1;
      }
      if (date.toISOString().split('T')[0] === todayStr) {
        dailyAmount += Number(p.total || 0);
        dailyCount += 1;
      }
    });
    return { count: purchases.length, totalAmount, monthlyAmount, monthlyCount, dailyAmount, dailyCount };
  }, [purchases]);

  /* ---------- Filtrage ---------- */
  const filteredPurchases = useMemo(() => {
    const query = search.trim().toLowerCase();
    return purchases.filter((purchase) => {
      const supplierName = getSupplierName(purchase, suppliers, t.supplier_none).toLowerCase();
      const number = String(purchase.purchase_number || '').toLowerCase();
      const status = String(purchase.status || '').toLowerCase();
      const matchesSearch =
        !query ||
        number.includes(query) ||
        supplierName.includes(query) ||
        String(purchase.notes || '').toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || status === statusFilter.toLowerCase();
      const purchaseDateStr = String(purchase.purchase_date || purchase.created_at || '').slice(0, 10);
      const matchesStart = !startDateFilter || purchaseDateStr >= startDateFilter;
      const matchesEnd = !endDateFilter || purchaseDateStr <= endDateFilter;
      return matchesSearch && matchesStatus && matchesStart && matchesEnd;
    });
  }, [purchases, suppliers, search, statusFilter, startDateFilter, endDateFilter, t.supplier_none]);

  const cartTotal = useMemo(
    () => cart.reduce((total, item) => total + Number(item.quantity || 0) * Number(item.unit_price || 0), 0),
    [cart]
  );

  const hasFilters = Boolean(search || statusFilter !== 'all' || startDateFilter || endDateFilter);
  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setStartDateFilter('');
    setEndDateFilter('');
  };

  /* ---------- Actions formulaire ---------- */
  const resetForm = () => {
    setForm(emptyForm());
    setCurrentItem(emptyItem());
    setCart([]);
    setEditingPurchase(null);
  };

  const openCreateForm = () => { resetForm(); setShowForm(true); };
  const closeForm = () => { if (saving) return; setShowForm(false); resetForm(); };
  const updateForm = (e) => { const { name, value } = e.target; setForm((prev) => ({ ...prev, [name]: value })); };

  const updateCurrentItem = (e) => {
    const { name, value } = e.target;
    setCurrentItem((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'product_id') {
        const product = products.find((item) => String(item.id) === String(value));
        next.unit_price = product?.purchase_price ?? product?.price ?? '';
      }
      return next;
    });
  };

  const addItemToCart = () => {
    const product = products.find((item) => String(item.id) === String(currentItem.product_id));
    if (!product) return notify(t.warn_no_product, 'warning');
    const quantity = Number(currentItem.quantity);
    const unitPrice = Number(currentItem.unit_price);
    if (!Number.isFinite(quantity) || quantity <= 0) return notify(t.warn_qty, 'warning');
    if (!Number.isFinite(unitPrice) || unitPrice < 0) return notify(t.warn_price, 'warning');

    const existingIndex = cart.findIndex((item) => String(item.product_id) === String(product.id));
    if (existingIndex >= 0) {
      setCart((prev) => prev.map((item, index) =>
        index === existingIndex
          ? { ...item, quantity: Number(item.quantity) + quantity, total: (Number(item.quantity) + quantity) * Number(item.unit_price) }
          : item
      ));
    } else {
      setCart((prev) => [...prev, { product_id: product.id, product_name: product.name, quantity, unit_price: unitPrice, total: quantity * unitPrice }]);
    }
    setCurrentItem({ ...emptyItem(), quantity: 1 });
  };

  const removeCartItem = (productId) => setCart((prev) => prev.filter((item) => String(item.product_id) !== String(productId)));

  const openEditForm = (purchase) => {
    setEditingPurchase(purchase);
    setForm({
      purchase_number: purchase.purchase_number || '',
      supplier_id: purchase.supplier_id || '',
      notes: purchase.notes || '',
    });
    const items = getPurchaseItems(purchase);
    setCart(items.map((item) => ({
      product_id: item.product_id,
      product_name: item.products?.name || products.find((p) => String(p.id) === String(item.product_id))?.name || t.product_unknown,
      quantity: Number(item.quantity || 1),
      unit_price: Number(item.unit_price || 0),
      total: Number(item.total) || Number(item.quantity || 0) * Number(item.unit_price || 0),
    })));
    setCurrentItem(emptyItem());
    setShowForm(true);
  };

  const savePurchase = async () => {
    if (cart.length === 0) return notify(t.warn_cart_empty, 'warning');
    setSaving(true);
    const payload = {
      purchase_number: form.purchase_number.trim() || `ACH-${Date.now().toString().slice(-6)}`,
      supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
      notes: form.notes.trim(),
      total: cartTotal,
      status: 'received',
      items: cart.map((item) => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        total: Number(item.quantity) * Number(item.unit_price),
      })),
    };
    try {
      if (editingPurchase) {
        await purchasesApi.deletePurchase(editingPurchase.id, editingPurchase.purchase_items || editingPurchase.items);
        await purchasesApi.create(payload);
        notify(t.ok_updated);
      } else {
        await purchasesApi.create(payload);
        notify(t.ok_saved);
      }
      setShowForm(false);
      resetForm();
      await loadData();
    } catch (error) {
      console.error('Erreur achat:', error);
      notify(error?.message || t.err_save, 'danger');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (purchase) => { setPurchaseToDelete(purchase); setShowDelete(true); };

  const deletePurchase = async () => {
    if (!purchaseToDelete) return;
    setDeleting(true);
    try {
      await purchasesApi.deletePurchase(purchaseToDelete.id, purchaseToDelete.purchase_items || purchaseToDelete.items);
      setShowDelete(false);
      setPurchaseToDelete(null);
      notify(t.ok_deleted);
      await loadData();
    } catch (error) {
      console.error('Erreur:', error);
      notify(error?.message || t.err_delete, 'danger');
    } finally {
      setDeleting(false);
    }
  };

  const openPurchaseDetails = (purchase) => { setSelectedPurchase(purchase); setShowDetails(true); };

  /* ---------- Impression / export ---------- */
  const printPurchase = (purchase) => {
    const items = getPurchaseItems(purchase);
    const supplierName = getSupplierName(purchase, suppliers, t.supplier_none);
    const rows = items.map((item) => {
      const productName = item.products?.name || products.find((p) => String(p.id) === String(item.product_id))?.name || t.product_unknown;
      return `<tr><td>${escapeHtml(productName)}</td><td>${Number(item.quantity || 0)}</td><td>${formatMoney(item.unit_price, cur)}</td><td>${formatMoney(item.total ?? Number(item.quantity || 0) * Number(item.unit_price || 0), cur)}</td></tr>`;
    }).join('');

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return notify(t.warn_popup, 'warning');
    win.document.write(`
      <!DOCTYPE html><html lang="${lang}" dir="${t.dir}"><head><meta charset="UTF-8"><title>${escapeHtml(purchase.purchase_number || purchase.id)}</title>
      <style>body{font-family:${lang === 'ar' ? 'Cairo, ' : ''}Arial,sans-serif;padding:35px;color:#14213d}.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1f5eea;padding-bottom:20px;margin-bottom:25px}h1{color:#1f5eea;margin:0 0 8px}.muted{color:#66748b}table{width:100%;border-collapse:collapse;margin-top:25px}th,td{border:1px solid #e3e9f2;padding:12px;text-align:${t.dir === 'rtl' ? 'right' : 'left'}}th{background:#e8efff}.total{text-align:${t.dir === 'rtl' ? 'left' : 'right'};margin-top:25px;font-size:20px}.notes{margin-top:25px}</style>
      </head><body>
        <div class="header"><div><h1>GESTISTOCK</h1><div class="muted">${t.title}</div></div><div><h2>${t.modal_new}</h2><div><strong>${t.th_ref} :</strong> ${escapeHtml(purchase.purchase_number || purchase.id)}</div><div><strong>${t.th_date} :</strong> ${formatDate(purchase.purchase_date || purchase.created_at, t.locale)}</div></div></div>
        <p><strong>${t.th_supplier} :</strong> ${escapeHtml(supplierName)}</p>
        <table><thead><tr><th>${t.cart_product}</th><th>${t.f_qty}</th><th>${t.f_price}</th><th>${t.th_total}</th></tr></thead><tbody>${rows || `<tr><td colspan="4">${t.details_empty}</td></tr>`}</tbody></table>
        <div class="total"><strong>${t.details_total} : ${formatMoney(purchase.total, cur)}</strong></div>
        ${purchase.notes ? `<div class="notes"><strong>${t.details_notes} :</strong> ${escapeHtml(purchase.notes)}</div>` : ''}
        <script>window.onload=function(){window.print();}</script>
      </body></html>
    `);
    win.document.close();
  };

  const exportPurchase = (purchase) => {
    const items = getPurchaseItems(purchase);
    const rows = [
      [t.th_ref, purchase.purchase_number || purchase.id],
      [t.th_date, formatDate(purchase.purchase_date || purchase.created_at, t.locale)],
      [t.th_supplier, getSupplierName(purchase, suppliers, t.supplier_none)],
      [t.th_status, purchase.status || '—'],
      [],
      [t.cart_product, t.f_qty, t.f_price, t.th_total],
      ...items.map((item) => [
        item.products?.name || t.product_unknown,
        item.quantity || 0,
        item.unit_price || 0,
        item.total ?? Number(item.quantity || 0) * Number(item.unit_price || 0),
      ]),
      [],
      [t.details_total, '', '', Number(purchase.total || 0)],
      [t.details_notes, purchase.notes || ''],
    ];
    const csv = rows.map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Achat_${purchase.purchase_number || purchase.id}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const exportAllPurchases = () => {
    const rows = [
      [t.th_ref, t.th_date, t.th_supplier, t.th_status, t.th_total, t.details_notes],
      ...filteredPurchases.map((p) => [
        p.purchase_number || p.id,
        formatDate(p.purchase_date || p.created_at, t.locale),
        getSupplierName(p, suppliers, t.supplier_none),
        p.status || '—',
        Number(p.total || 0),
        p.notes || '',
      ]),
    ];
    const csv = rows.map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Liste_des_achats.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  /* ---------- Helpers d'affichage ---------- */
  const statusTone = (status) => {
    const v = String(status || '').toLowerCase();
    if (['completed', 'received', 'paid'].includes(v)) return 'green';
    if (['cancelled', 'annule'].includes(v)) return 'rose';
    if (['pending', 'unpaid', 'en_attente'].includes(v)) return 'amber';
    return 'blue';
  };

  const statusLabel = (status) => {
    const v = String(status || '').toLowerCase();
    const map = {
      pending: t.pending, draft: t.draft, completed: t.completed, received: t.received,
      cancelled: t.cancelled, paid: t.paid, unpaid: t.unpaid,
    };
    return map[v] || status || t.recorded;
  };

  const getProductNames = (purchase) => {
    const names = getPurchaseItems(purchase).map((item) =>
      item.products?.name || products.find((p) => String(p.id) === String(item.product_id))?.name || t.product_unknown
    );
    return names.length > 0 ? names.join(', ') : '—';
  };

  /* =======================================================
     AFFICHAGE
  ======================================================= */

  return (
    <div className="expenses-page" dir={t.dir} lang={lang}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');

        .expenses-page {
          --ink: #14213d;
          --muted: #66748b;
          --line: #e3e9f2;
          --bg: #f2f5fb;
          --card: #fff;
          --primary: #1f5eea;   --primary-soft: #e8efff;
          --green: #0f9d74;     --green-soft: #def7ee;
          --violet: #6a4de0;    --violet-soft: #ece8fd;
          --amber: #e08a0b;     --amber-soft: #fff0d6;
          --red: #d63c4a;       --red-soft: #fde8ea;
          --teal: #0e8fa8;      --teal-soft: #dcf3f8;
          --rose: #c2417c;      --rose-soft: #fbe6f0;

          min-height: 100vh;
          padding: clamp(14px, 2.2vw, 28px);
          background: radial-gradient(1000px 340px at 100% -80px, rgba(31,94,234,.08), transparent 70%), var(--bg);
          color: var(--ink);
          font-family: Inter, 'Segoe UI', system-ui, Tahoma, Arial, sans-serif;
        }
        .expenses-page[lang="ar"] { font-family: Cairo, 'Noto Sans Arabic', Tahoma, 'Segoe UI', Arial, sans-serif; }
        .expenses-page * { box-sizing: border-box; }
        .expenses-page button:focus-visible, .expenses-page input:focus-visible,
        .expenses-page select:focus-visible, .expenses-page textarea:focus-visible {
          outline: 3px solid rgba(31,94,234,.35); outline-offset: 2px;
        }
        .ep-amt { direction: ltr; unicode-bidi: isolate; font-variant-numeric: tabular-nums; }

        /* ---------- Hero ---------- */
        .ep-hero {
          position: relative; isolation: isolate; overflow: hidden;
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 18px;
          padding: clamp(20px, 3vw, 30px); margin-bottom: 20px; border-radius: 20px; color: #fff;
          background: linear-gradient(125deg, #0f2f66 0%, #1b55c9 58%, #2aa3d9 100%);
          box-shadow: 0 14px 32px rgba(21, 74, 170, .20);
        }
        .ep-hero::after { content: ""; position: absolute; z-index: -1; width: 250px; height: 250px; inset-inline-end: -70px; top: -115px; border: 32px solid rgba(255,255,255,.09); border-radius: 50%; }
        .ep-eyebrow { font-size: 19px; font-weight: 800; letter-spacing: 1.8px; opacity: .78; }
        .ep-title h1 { margin: 6px 0 4px; font-size: clamp(22px, 2.8vw, 30px); font-weight: 800; display: flex; align-items: center; gap: 12px; line-height: 1.25; }
        .ep-title-icon { display: inline-grid; place-items: center; width: 42px; height: 42px; border-radius: 12px; background: rgba(255,255,255,.16); font-size: 21px; }
        .ep-title p { margin: 0; color: rgba(255,255,255,.82); font-size: 23px; max-width: 620px; }
        .ep-hero-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
        .ep-lang { display: inline-flex; padding: 3px; border-radius: 11px; background: rgba(255,255,255,.16); border: 1px solid rgba(255,255,255,.25); }
        .ep-lang button { border: 0; padding: 7px 12px; border-radius: 8px; background: transparent; color: #fff; font: inherit; font-size: 20px; font-weight: 800; cursor: pointer; }
        .ep-lang button.on { background: #fff; color: #153f92; }
        .ep-btn-add { display: inline-flex; align-items: center; gap: 8px; padding: 11px 18px; border: 0; border-radius: 11px; background: #fff; color: #174078; font: inherit; font-weight: 800; font-size: 13px; cursor: pointer; box-shadow: 0 6px 16px rgba(0,0,0,.14); transition: .18s; }
        .ep-btn-add:hover { transform: translateY(-2px); }
        .ep-btn-ghost { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border: 1px solid rgba(255,255,255,.45); border-radius: 11px; background: rgba(255,255,255,.10); color: #fff; font: inherit; font-size: 12px; font-weight: 800; cursor: pointer; transition: .18s; }
        .ep-btn-ghost:hover { background: rgba(255,255,255,.2); }
        .ep-btn-ghost:disabled { opacity: .55; cursor: not-allowed; }

        /* ---------- Stats ---------- */
        .ep-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-bottom: 20px; }
        .ep-card { position: relative; overflow: hidden; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding: 20px; background: var(--card); border: 1px solid var(--line); border-inline-start: 4px solid var(--accent); border-radius: 16px; box-shadow: 0 4px 14px rgba(20,33,61,.04); transition: transform .2s, box-shadow .2s; }
        .ep-card:hover { transform: translateY(-2px); box-shadow: 0 12px 24px rgba(20,33,61,.08); }
        .ep-card::after { content: ""; position: absolute; inset-inline-end: -30px; bottom: -42px; width: 105px; height: 105px; border-radius: 50%; background: var(--accent-soft); opacity: .7; }
        .ep-card-info { position: relative; z-index: 1; min-width: 0; }
        .ep-card-info h3 { margin: 0 0 9px; font-size: 20px; color: var(--muted); font-weight: 800; }
        .ep-card-info .value { font-size: clamp(20px, 2vw, 26px); font-weight: 800; letter-spacing: -.3px; color: var(--ink); overflow-wrap: anywhere; }
        .ep-card-info .sub { margin-top: 5px; font-size: 20px; color: var(--accent); font-weight: 700; }
        .ep-icon { position: relative; z-index: 1; flex: 0 0 44px; width: 44px; height: 44px; border-radius: 13px; display: grid; place-items: center; font-size: 19px; background: var(--accent-soft); color: var(--accent); }
        .tone-blue   { --accent: var(--primary); --accent-soft: var(--primary-soft); }
        .tone-amber  { --accent: var(--amber);  --accent-soft: var(--amber-soft); }
        .tone-violet { --accent: var(--violet); --accent-soft: var(--violet-soft); }
        .tone-green  { --accent: var(--green);  --accent-soft: var(--green-soft); }
        .tone-rose   { --accent: var(--rose);   --accent-soft: var(--rose-soft); }

        /* ---------- Panel & filtres ---------- */
        .ep-panel { background: var(--card); border-radius: 16px; border: 1px solid var(--line); overflow: hidden; box-shadow: 0 4px 14px rgba(20,33,61,.035); margin-bottom: 20px; }
        .ep-panel-head { padding: 16px 20px; border-bottom: 1px solid var(--line); background: #fbfcff; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px; }
        .ep-panel-head h5 { margin: 0 0 4px; font-size: 21px; font-weight: 800; }
        .ep-panel-head p { margin: 0; font-size: 19px; color: var(--muted); }
        .ep-filters { display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr auto; gap: 10px; align-items: end; padding: 15px 20px; background: #fbfcff; border-bottom: 1px solid var(--line); }
        .ep-fg { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
        .ep-fg label { font-size: 19px; font-weight: 800; color: #4b5b75; text-transform: uppercase; letter-spacing: .4px; }
        .ep-filter-input { width: 100%; height: 40px; border: 1px solid #d9e1ed; border-radius: 9px; padding: 0 12px; font: inherit; font-size: 20px; color: #2a3a55; background: #fff; outline: none; }
        .ep-filter-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); }
        .ep-reset { height: 40px; padding: 0 13px; border: 1px solid var(--line); border-radius: 9px; background: #fff; color: #4b5b75; font: inherit; font-size: 20px; font-weight: 800; cursor: pointer; white-space: nowrap; }
        .ep-reset:hover { background: #f1f5fb; }

        /* ---------- Tableau ---------- */
        .ep-table-wrap { overflow-x: auto; }
        .ep-table { width: 100%; min-width: 980px; border-collapse: collapse; }
        .ep-table th { background: #f3f6fc; color: #5b6b85; text-align: start; padding: 14px 16px; font-size: 19px; font-weight: 800; letter-spacing: .4px; border-bottom: 1px solid var(--line); white-space: nowrap; }
        .ep-table td { padding: 13px 16px; border-bottom: 1px solid #f0f3f8; font-size: 20px; color: #44546d; vertical-align: middle; }
        .ep-table tbody tr:nth-child(even) td { background: #fafbfe; }
        .ep-table tbody tr:hover td { background: #eff4ff; }
        .ep-table tr:last-child td { border-bottom: 0; }
        .ep-col-end { text-align: end !important; }
        .ep-col-center { text-align: center !important; }
        .ep-state { padding: 40px 18px !important; text-align: center; color: #8896ab !important; }
        .ep-spinner { display: inline-block; width: 22px; height: 22px; margin-inline-end: 10px; vertical-align: middle; border: 3px solid #dbeafe; border-top-color: var(--primary); border-radius: 50%; animation: ep-spin .75s linear infinite; }
        @keyframes ep-spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .ep-spinner { animation-duration: 2s; } .ep-card, .ep-btn-add { transition: none; } }

        .ep-supplier-cell { display: flex; align-items: center; gap: 10px; min-width: 160px; }
        .ep-supplier-avatar { flex: 0 0 34px; width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; background: var(--primary-soft); color: var(--primary); font-weight: 800; font-size: 13px; }
        .ep-supplier-name { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 700; color: #2a3a55; }
        .ep-subtext { display: block; margin-top: 3px; font-size: 19px; color: var(--muted); }
        .ep-ref { color: var(--primary); font-weight: 800; }

        .ep-badge { display: inline-block; padding: 5px 11px; border-radius: 999px; font-size: 20px; font-weight: 800; white-space: nowrap; }
        .badge-blue   { background: var(--primary-soft); color: #164aba; }
        .badge-violet { background: var(--violet-soft);  color: #4a32b0; }
        .badge-green  { background: var(--green-soft);   color: #0b6a4e; }
        .badge-amber  { background: var(--amber-soft);   color: #94590a; }
        .badge-rose   { background: var(--rose-soft);    color: #9c2a62; }
        .badge-teal   { background: var(--teal-soft);    color: #0a6577; }
        .badge-gray   { background: #eef2f8; color: #4b5b75; }

        .ep-money { font-weight: 800; color: var(--ink); white-space: nowrap; }
        .ep-money-total { color: #0b6a4e; }

        .ep-actions { display: flex; gap: 6px; justify-content: flex-end; }
        .btn-icon { width: 32px; height: 32px; border-radius: 8px; border: 1px solid transparent; display: grid; place-items: center; cursor: pointer; transition: .18s; background: transparent; color: #64748b; font-size: 12px; }
        .btn-icon:hover { background: #eef2f8; }
        .btn-view   { background: var(--primary-soft); color: var(--primary); border-color: #c9daff; }
        .btn-view:hover { background: var(--primary); color: #fff; }
        .btn-edit   { background: var(--amber-soft); color: var(--amber); border-color: #f5dcb0; }
        .btn-edit:hover { background: var(--amber); color: #fff; }
        .btn-print  { background: #eef2f8; color: #4b5b75; border-color: #d9e1ed; }
        .btn-print:hover { background: #4b5b75; color: #fff; }
        .btn-delete { background: var(--red-soft); color: var(--red); border-color: #f6c8cd; }
        .btn-delete:hover { background: var(--red); color: #fff; }

        /* ---------- Modales ---------- */
        .ep-modal-overlay { position: fixed; inset: 0; z-index: 1050; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(15,23,42,.58); backdrop-filter: blur(4px); }
        .ep-modal { width: 100%; max-width: 900px; max-height: calc(100vh - 40px); overflow: auto; background: #fff; border-radius: 18px; box-shadow: 0 25px 50px rgba(0,0,0,.22); }
        .ep-modal.small { max-width: 440px; }
        .ep-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 22px; border-bottom: 1px solid var(--line); background: linear-gradient(180deg, #fbfcff, #fff); }
        .ep-modal-header h3 { margin: 0; font-size: 21px; font-weight: 800; display: flex; align-items: center; gap: 10px; }
        .ep-modal-header p { margin: 4px 0 0; font-size: 20px; color: var(--muted); }
        .ep-modal-icon { display: inline-grid; place-items: center; width: 34px; height: 34px; border-radius: 10px; background: var(--primary-soft); color: var(--primary); font-size: 14px; }
        .ep-modal-body { padding: 22px; }
        .ep-modal-footer { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 10px; padding: 15px 22px; background: #f7f9fd; border-top: 1px solid var(--line); }
        .ep-modal-footer.center { justify-content: center; }
        .ep-form-group { margin-bottom: 15px; }
        .ep-form-group label { display: block; margin-bottom: 6px; font-size: 20px; font-weight: 800; color: #4b5b75; }
        .ep-form-group input, .ep-form-group select, .ep-form-group textarea { width: 100%; border: 1px solid #d9e1ed; border-radius: 9px; padding: 10px 12px; font: inherit; font-size: 14px; color: #2a3a55; background: #fbfcfe; outline: none; }
        .ep-form-group input:focus, .ep-form-group select:focus, .ep-form-group textarea:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); background: #fff; }
        .ep-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 720px) { .ep-grid2 { grid-template-columns: 1fr; } }

        .ep-section-title { display: flex; align-items: center; gap: 9px; margin: 22px 0 14px; font-size: 13px; font-weight: 800; color: #2a3a55; }
        .ep-section-title:first-child { margin-top: 0; }
        .ep-section-num { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 8px; background: var(--primary-soft); color: var(--primary); font-size: 12px; font-weight: 800; }

        .ep-item-form { padding: 14px; border: 1px dashed #d9e1ed; border-radius: 12px; background: #fbfcff; margin-bottom: 14px; }
        .ep-item-form-grid { display: grid; grid-template-columns: 2fr 1fr 1.2fr auto; gap: 10px; align-items: end; }
        @media (max-width: 720px) { .ep-item-form-grid { grid-template-columns: 1fr 1fr; } .ep-item-form-grid .ep-btn-add-item { grid-column: 1 / -1; } }
        .ep-btn-add-item { height: 40px; padding: 0 14px; border: 0; border-radius: 9px; background: var(--primary); color: #fff; font: inherit; font-size: 13px; font-weight: 800; cursor: pointer; white-space: nowrap; }
        .ep-btn-add-item:hover:not(:disabled) { filter: brightness(.94); }
        .ep-btn-add-item:disabled { opacity: .55; cursor: not-allowed; }

        .ep-cart { border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
        .ep-cart table { width: 100%; border-collapse: collapse; }
        .ep-cart th { background: #f3f6fc; color: #5b6b85; text-align: start; padding: 10px 14px; font-size: 19px; font-weight: 800; letter-spacing: .4px; text-transform: uppercase; border-bottom: 1px solid var(--line); }
        .ep-cart td { padding: 10px 14px; font-size: 20px; border-bottom: 1px solid #f0f3f8; }
        .ep-cart tr:last-child td { border-bottom: 0; }
        .ep-cart-empty { text-align: center; color: var(--muted); padding: 20px !important; font-size: 20px; }

        .ep-total-box { display: flex; justify-content: space-between; align-items: center; padding: 16px; border-radius: 12px; background: linear-gradient(110deg, #f0f7ff, #f8fbff); border: 1px solid #d8e9ff; margin-top: 14px; }
        .ep-total-box span { color: var(--muted); font-size: 20px; font-weight: 700; }
        .ep-total-box strong { color: var(--primary); font-size: 23px; font-weight: 800; }

        .ep-detail-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
        @media (max-width: 720px) { .ep-detail-grid { grid-template-columns: 1fr; } }
        .ep-detail-item { padding: 12px; border: 1px solid var(--line); border-radius: 10px; background: #fbfcff; overflow-wrap: anywhere; }
        .ep-detail-item span { display: block; font-size: 19px; color: var(--muted); margin-bottom: 5px; font-weight: 700; }
        .ep-detail-item strong { font-size: 21px; color: #2a3a55; }

        .ep-btn { padding: 10px 20px; border-radius: 10px; border: 0; font: inherit; font-size: 20px; font-weight: 800; cursor: pointer; transition: .18s; }
        .ep-btn:hover:not(:disabled) { filter: brightness(.96); transform: translateY(-1px); }
        .ep-btn:disabled { opacity: .6; cursor: not-allowed; }
        .ep-btn-cancel { background: #e6ebf3; color: #44546d; }
        .ep-btn-save { background: linear-gradient(135deg, #1f5eea, #2f7bf0); color: #fff; }
        .ep-btn-danger { background: var(--red); color: #fff; }
        .ep-btn-outline { background: #fff; color: #4b5b75; border: 1px solid var(--line); }

        .ep-delete-body { padding: 28px 22px 10px; text-align: center; }
        .ep-delete-icon { display: inline-grid; place-items: center; width: 58px; height: 58px; margin-bottom: 14px; border-radius: 50%; background: var(--red-soft); color: var(--red); font-size: 24px; }
        .ep-delete-body h4 { margin: 0 0 6px; font-size: 23px; font-weight: 800; }
        .ep-delete-body p { margin: 0 0 10px; color: var(--muted); font-size: 21px; }
        .ep-delete-name { background: #f7f9fd; border-radius: 9px; padding: 10px 14px; font-weight: 800; margin: 10px 0; }

        .ep-toast { position: fixed; z-index: 1100; top: 20px; inset-inline-end: 20px; width: min(420px, calc(100% - 40px)); display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; border-radius: 12px; background: #fff; box-shadow: 0 12px 30px rgba(20,40,70,.15); border-inline-start: 4px solid var(--primary); font-size: 13px; }
        .ep-toast.success { border-inline-start-color: var(--green); color: #0b6a4e; }
        .ep-toast.danger  { border-inline-start-color: var(--red);   color: #a3212e; }
        .ep-toast.warning { border-inline-start-color: var(--amber); color: #94590a; }
        .ep-toast .ep-toast-close { border: 0; background: transparent; cursor: pointer; color: inherit; font-size: 21px; line-height: 1; }

        @media (max-width: 1100px) { .ep-filters { grid-template-columns: 1fr 1fr; } .ep-filters .ep-fg-search { grid-column: 1 / -1; } }
        @media (max-width: 900px) { .ep-stats { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) {
          .expenses-page { padding: 12px; }
          .ep-filters { grid-template-columns: 1fr; padding: 14px; }
          .ep-hero-actions { width: 100%; } .ep-btn-add, .ep-btn-ghost { flex: 1; justify-content: center; }
          .ep-stats { grid-template-columns: 1fr; }
          .ep-modal-footer .ep-btn { flex: 1; }
          .ep-modal-footer.center { flex-direction: column-reverse; }
        }
      `}</style>

      {/* Toast */}
      {notice && (
        <div className={`ep-toast ${notice.type}`} role="alert">
          <span style={{ fontSize: 16 }}>
            {notice.type === 'danger' ? '⚠️' : notice.type === 'warning' ? '⚡' : '✓'}
          </span>
          <div style={{ flex: 1 }}>{notice.message}</div>
          <button type="button" className="ep-toast-close" onClick={() => setNotice(null)}>×</button>
        </div>
      )}

      {/* Hero */}
      <header className="ep-hero">
        <div className="ep-title">
          <span className="ep-eyebrow">{t.eyebrow}</span>
          <h1>
            <span className="ep-title-icon"><i className="fas fa-shopping-cart" /></span>
            {t.title}
          </h1>
          <p>{t.subtitle}</p>
        </div>
        <div className="ep-hero-actions">
          
          <button type="button" className="ep-btn-ghost" onClick={exportAllPurchases} disabled={filteredPurchases.length === 0}>
            <i className="fas fa-download" /> {t.export}
          </button>
          <button type="button" className="ep-btn-add" onClick={openCreateForm}>
            <i className="fas fa-plus" /> {t.add}
          </button>
        </div>
      </header>

      {/* Statistiques */}
      <section className="ep-stats">
        <div className="ep-card tone-amber">
          <div className="ep-card-info">
            <h3>{t.stat_daily}</h3>
            <div className="value">{stats.dailyCount}</div>
            <div className="sub">{t.stat_daily_sub(formatMoney(stats.dailyAmount, cur))}</div>
          </div>
          <div className="ep-icon"><i className="fas fa-calendar-day" /></div>
        </div>
        <div className="ep-card tone-blue">
          <div className="ep-card-info">
            <h3>{t.stat_monthly}</h3>
            <div className="value">{stats.monthlyCount}</div>
            <div className="sub">{t.stat_monthly_sub(formatMoney(stats.monthlyAmount, cur))}</div>
          </div>
          <div className="ep-icon"><i className="fas fa-calendar-alt" /></div>
        </div>
        <div className="ep-card tone-green">
          <div className="ep-card-info">
            <h3>{t.stat_total}</h3>
            <div className="value">{stats.count}</div>
            <div className="sub">{t.stat_total_sub}</div>
          </div>
          <div className="ep-icon"><i className="fas fa-shopping-cart" /></div>
        </div>
        <div className="ep-card tone-violet">
          <div className="ep-card-info">
            <h3>{t.stat_amount}</h3>
            <div className="value"><bdi className="ep-amt">{formatMoney(stats.totalAmount, cur)}</bdi></div>
            <div className="sub">{cur}</div>
          </div>
          <div className="ep-icon"><i className="fas fa-coins" /></div>
        </div>
      </section>

      {/* Panneau principal */}
      <div className="ep-panel">
        <div className="ep-panel-head">
          <div>
            <h5><i className="fas fa-list" style={{ color: 'var(--primary)', marginInlineEnd: 8 }} />{t.history}</h5>
            <p>{t.history_sub(filteredPurchases.length)}</p>
          </div>
          <button type="button" className="ep-btn ep-btn-outline" onClick={loadData} disabled={loading}>
            <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`} style={{ marginInlineEnd: 6 }} /> {t.refresh}
          </button>
        </div>

        <div className="ep-filters">
          <div className="ep-fg ep-fg-search">
            <label>{t.history}</label>
            <input
              type="search"
              className="ep-filter-input"
              placeholder={t.search_ph}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="ep-fg">
            <label>{t.th_status}</label>
            <select className="ep-filter-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">{t.all_status}</option>
              <option value="received">{t.received}</option>
              <option value="pending">{t.pending}</option>
              <option value="cancelled">{t.cancelled}</option>
            </select>
          </div>
          <div className="ep-fg">
            <label>{t.start_date}</label>
            <input type="date" className="ep-filter-input" value={startDateFilter} onChange={(e) => setStartDateFilter(e.target.value)} />
          </div>
          <div className="ep-fg">
            <label>{t.end_date}</label>
            <input type="date" className="ep-filter-input" value={endDateFilter} onChange={(e) => setEndDateFilter(e.target.value)} />
          </div>
          <div>
            {hasFilters && (
              <button type="button" className="ep-reset" onClick={resetFilters}>
                <i className="fas fa-rotate-left" /> {t.reset}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="ep-state" style={{ padding: '50px 20px' }}>
            <span className="ep-spinner" />{t.loading}
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="ep-state" style={{ padding: '50px 20px' }}>
            <div style={{ width: 56, height: 56, fontSize: 22, margin: '0 auto 12px', borderRadius: 16, display: 'grid', placeItems: 'center', background: 'var(--primary-soft)', color: 'var(--primary)' }}>
              <i className="fas fa-inbox" />
            </div>
            <div style={{ fontWeight: 800, color: '#2a3a55', fontSize: 15 }}>{purchases.length === 0 ? t.none_title : t.none_search}</div>
            <div style={{ marginTop: 4, fontSize: 12 }}>{purchases.length === 0 ? t.none_sub : t.none_search_sub}</div>
            <div style={{ marginTop: 14 }}>
              {purchases.length === 0 ? (
                <button type="button" className="ep-btn ep-btn-save" onClick={openCreateForm}>
                  <i className="fas fa-plus" style={{ marginInlineEnd: 6 }} />{t.none_add}
                </button>
              ) : (
                <button type="button" className="ep-btn ep-btn-outline" onClick={resetFilters}>
                  {t.reset}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="ep-table-wrap">
            <table className="ep-table">
              <thead>
                <tr>
                  <th>{t.th_ref}</th>
                  <th>{t.th_supplier}</th>
                  <th>{t.th_date}</th>
                  <th>{t.th_products}</th>
                  <th className="ep-col-center">{t.th_qty}</th>
                  <th className="ep-col-end">{t.th_unit_price}</th>
                  <th className="ep-col-end">{t.th_total}</th>
                  <th>{t.th_status}</th>
                  <th className="ep-col-end">{t.th_actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.map((purchase) => {
                  const items = getPurchaseItems(purchase);
                  const supplierName = getSupplierName(purchase, suppliers, t.supplier_none);
                  const totalQty = items.reduce((sum, item) => sum + Number(item.quantity), 0);
                  const firstUnitPrice = items.length > 0 ? items[0].unit_price : 0;
                  const productNames = getProductNames(purchase);
                  return (
                    <tr key={purchase.id}>
                      <td>
                        <span className="ep-ref">{purchase.purchase_number || `ACH-${purchase.id}`}</span>
                        <span className="ep-subtext">{t.id_label(purchase.id)}</span>
                      </td>
                      <td>
                        <div className="ep-supplier-cell">
                          <div className="ep-supplier-avatar">{supplierName.charAt(0).toUpperCase()}</div>
                          <div className="ep-supplier-name">{supplierName}</div>
                        </div>
                      </td>
                      <td>{formatDate(purchase.purchase_date || purchase.created_at, t.locale)}</td>
                      <td style={{ color: 'var(--muted)' }}>
                        <span style={{ display: 'inline-block', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={productNames}>
                          {productNames}
                        </span>
                      </td>
                      <td className="ep-col-center">
                        <span className="ep-badge badge-gray">{t.units(totalQty)}</span>
                      </td>
                      <td className="ep-col-end ep-money">{formatMoney(firstUnitPrice, cur)}</td>
                      <td className="ep-col-end ep-money ep-money-total">{formatMoney(purchase.total, cur)}</td>
                      <td>
                        <span className={`ep-badge badge-${statusTone(purchase.status)}`}>{statusLabel(purchase.status)}</span>
                      </td>
                      <td className="ep-col-end">
                        <div className="ep-actions">
                          <button type="button" className="btn-icon btn-view" title={t.view} onClick={() => openPurchaseDetails(purchase)}>
                            <i className="fas fa-eye" />
                          </button>
                          <button type="button" className="btn-icon btn-edit" title={t.edit} onClick={() => openEditForm(purchase)}>
                            <i className="fas fa-edit" />
                          </button>
                          <button type="button" className="btn-icon btn-print" title={t.print} onClick={() => printPurchase(purchase)}>
                            <i className="fas fa-print" />
                          </button>
                          <button type="button" className="btn-icon btn-delete" title={t.delete} onClick={() => confirmDelete(purchase)}>
                            <i className="fas fa-trash-alt" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="ep-panel-head" style={{ borderTop: '1px solid var(--line)', borderBottom: 0, borderRadius: '0 0 16px 16px' }}>
          <p style={{ margin: 0 }}>{t.footer_show(filteredPurchases.length, purchases.length)}</p>
          <p style={{ margin: 0 }}>
            {t.footer_total} <strong style={{ color: 'var(--primary)' }}>
              {formatMoney(filteredPurchases.reduce((sum, p) => sum + Number(p.total || 0), 0), cur)}
            </strong>
          </p>
        </div>
      </div>

      {/* Modale formulaire */}
      {showForm && (
        <div className="ep-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && closeForm()}>
          <div className="ep-modal" role="dialog" aria-modal="true">
            <div className="ep-modal-header">
              <div>
                <h3>
                  <span className="ep-modal-icon"><i className={`fas ${editingPurchase ? 'fa-pen-to-square' : 'fa-cart-plus'}`} /></span>
                  {editingPurchase ? t.modal_edit : t.modal_new}
                </h3>
                <p>{t.modal_sub}</p>
              </div>
              <button type="button" className="btn-icon" onClick={closeForm} disabled={saving} aria-label={t.close}>
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="ep-modal-body">
              <div className="ep-section-title"><span className="ep-section-num">1</span> {t.section_general}</div>
              <div className="ep-grid2">
                <div className="ep-form-group">
                  <label htmlFor="pch-number">{t.f_number}</label>
                  <input id="pch-number" type="text" name="purchase_number" placeholder={t.f_number_ph} value={form.purchase_number} onChange={updateForm} />
                </div>
                <div className="ep-form-group">
                  <label htmlFor="pch-supplier">{t.f_supplier}</label>
                  <select id="pch-supplier" name="supplier_id" value={form.supplier_id} onChange={updateForm}>
                    <option value="">{t.f_supplier_ph}</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="ep-form-group">
                <label htmlFor="pch-notes">{t.f_notes}</label>
                <textarea id="pch-notes" name="notes" rows={2} placeholder={t.f_notes_ph} value={form.notes} onChange={updateForm} />
              </div>

              <div className="ep-section-title"><span className="ep-section-num">2</span> {t.section_products}</div>
              <div className="ep-item-form">
                <div className="ep-item-form-grid">
                  <div className="ep-form-group" style={{ marginBottom: 0 }}>
                    <label>{t.f_product}</label>
                    <select name="product_id" value={currentItem.product_id} onChange={updateCurrentItem}>
                      <option value="">{t.f_product_ph}</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="ep-form-group" style={{ marginBottom: 0 }}>
                    <label>{t.f_qty}</label>
                    <input type="number" name="quantity" min="1" step="1" value={currentItem.quantity} onChange={updateCurrentItem} />
                  </div>
                  <div className="ep-form-group" style={{ marginBottom: 0 }}>
                    <label>{t.f_price}</label>
                    <input type="number" name="unit_price" min="0" step="0.01" value={currentItem.unit_price} onChange={updateCurrentItem} />
                  </div>
                  <button type="button" className="ep-btn-add-item" onClick={addItemToCart} disabled={products.length === 0}>
                    <i className="fas fa-plus" style={{ marginInlineEnd: 4 }} /> {t.btn_add}
                  </button>
                </div>
              </div>

              <div className="ep-cart">
                <table>
                  <thead>
                    <tr>
                      <th>{t.cart_product}</th>
                      <th>{t.f_qty}</th>
                      <th>{t.f_price}</th>
                      <th>{t.cart_subtotal}</th>
                      <th className="ep-col-end">{t.cart_action}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.length === 0 ? (
                      <tr><td colSpan="5" className="ep-cart-empty">{t.cart_empty}</td></tr>
                    ) : (
                      cart.map((item) => (
                        <tr key={item.product_id}>
                          <td style={{ fontWeight: 700 }}>{item.product_name}</td>
                          <td>{item.quantity}</td>
                          <td>{formatMoney(item.unit_price, cur)}</td>
                          <td style={{ fontWeight: 800 }}>{formatMoney(Number(item.quantity) * Number(item.unit_price), cur)}</td>
                          <td className="ep-col-end">
                            <button type="button" className="btn-icon btn-delete" onClick={() => removeCartItem(item.product_id)} title={t.delete}>
                              <i className="fas fa-trash" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="ep-total-box">
                <div>
                  <span>{t.cart_total}</span>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{t.cart_distinct(cart.length)}</div>
                </div>
                <strong><bdi className="ep-amt">{formatMoney(cartTotal, cur)}</bdi></strong>
              </div>
            </div>
            <div className="ep-modal-footer">
              <button type="button" className="ep-btn ep-btn-cancel" onClick={closeForm} disabled={saving}>{t.cancel}</button>
              <button type="button" className="ep-btn ep-btn-save" onClick={savePurchase} disabled={saving || cart.length === 0}>
                {saving ? <><i className="fas fa-spinner fa-spin" style={{ marginInlineEnd: 6 }} />{t.saving}</> : (editingPurchase ? t.save_edit : t.save)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale détails */}
      {showDetails && selectedPurchase && (
        <div className="ep-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && setShowDetails(false)}>
          <div className="ep-modal" role="dialog" aria-modal="true">
            <div className="ep-modal-header">
              <div>
                <h3>
                  <span className="ep-modal-icon"><i className="fas fa-file-invoice" /></span>
                  {t.details_title}
                </h3>
                <p>{t.details_ref} <strong style={{ color: 'var(--primary)' }}>{selectedPurchase.purchase_number || selectedPurchase.id}</strong></p>
              </div>
              <button type="button" className="btn-icon" onClick={() => setShowDetails(false)} aria-label={t.close}>
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="ep-modal-body">
              <div className="ep-detail-grid">
                <div className="ep-detail-item"><span>{t.f_number}</span><strong>{selectedPurchase.purchase_number || selectedPurchase.id}</strong></div>
                <div className="ep-detail-item"><span>{t.th_supplier}</span><strong>{getSupplierName(selectedPurchase, suppliers, t.supplier_none)}</strong></div>
                <div className="ep-detail-item"><span>{t.th_date}</span><strong>{formatDate(selectedPurchase.purchase_date || selectedPurchase.created_at, t.locale)}</strong></div>
                <div className="ep-detail-item"><span>{t.th_status}</span><strong><span className={`ep-badge badge-${statusTone(selectedPurchase.status)}`}>{statusLabel(selectedPurchase.status)}</span></strong></div>
                <div className="ep-detail-item"><span>{t.th_qty}</span><strong>{t.units(getPurchaseItems(selectedPurchase).reduce((s, i) => s + Number(i.quantity), 0))}</strong></div>
                <div className="ep-detail-item"><span>{t.th_total}</span><strong style={{ color: 'var(--primary)' }}>{formatMoney(selectedPurchase.total, cur)}</strong></div>
              </div>
              <div className="ep-section-title"><span className="ep-section-num">1</span> {t.details_section}</div>
              <div className="ep-cart">
                <table>
                  <thead>
                    <tr>
                      <th>{t.cart_product}</th>
                      <th>{t.f_qty}</th>
                      <th>{t.f_price}</th>
                      <th>{t.th_total}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getPurchaseItems(selectedPurchase).length === 0 ? (
                      <tr><td colSpan="4" className="ep-cart-empty">{t.details_empty}</td></tr>
                    ) : (
                      getPurchaseItems(selectedPurchase).map((item, index) => {
                        const productName = item.products?.name || products.find((p) => String(p.id) === String(item.product_id))?.name || t.product_unknown;
                        return (
                          <tr key={item.id || `${item.product_id}-${index}`}>
                            <td style={{ fontWeight: 700 }}>{productName}</td>
                            <td>{item.quantity}</td>
                            <td>{formatMoney(item.unit_price, cur)}</td>
                            <td style={{ fontWeight: 800 }}>{formatMoney(item.total ?? Number(item.quantity || 0) * Number(item.unit_price || 0), cur)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {selectedPurchase.notes && (
                <div style={{ marginTop: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#4b5b75', display: 'block', marginBottom: 6 }}>{t.details_notes}</label>
                  <div style={{ padding: 12, background: '#fbfcff', border: '1px solid var(--line)', borderRadius: 9, fontSize: 13 }}>{selectedPurchase.notes}</div>
                </div>
              )}
              <div className="ep-total-box">
                <span>{t.details_total}</span>
                <strong><bdi className="ep-amt">{formatMoney(selectedPurchase.total, cur)}</bdi></strong>
              </div>
            </div>
            <div className="ep-modal-footer">
              <button type="button" className="ep-btn ep-btn-outline" onClick={() => setShowDetails(false)}>{t.close}</button>
              <button type="button" className="ep-btn ep-btn-outline" onClick={() => printPurchase(selectedPurchase)}>
                <i className="fas fa-print" style={{ marginInlineEnd: 6 }} />{t.print}
              </button>
              <button type="button" className="ep-btn ep-btn-save" onClick={() => exportPurchase(selectedPurchase)}>
                <i className="fas fa-download" style={{ marginInlineEnd: 6 }} />{t.export}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale suppression */}
      {showDelete && purchaseToDelete && (
        <div className="ep-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && !deleting && (setShowDelete(false), setPurchaseToDelete(null))}>
          <div className="ep-modal small" role="alertdialog" aria-modal="true">
            <div className="ep-delete-body">
              <span className="ep-delete-icon"><i className="fas fa-trash-alt" /></span>
              <h4>{t.delete_title}</h4>
              <p>{t.delete_sub}</p>
              <p>{t.delete_confirm_q}</p>
              <div className="ep-delete-name">{purchaseToDelete.purchase_number || purchaseToDelete.id}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{t.th_supplier} : {getSupplierName(purchaseToDelete, suppliers, t.supplier_none)}</div>
              <div style={{ marginTop: 10 }}>
                {t.th_total} : <strong>{formatMoney(purchaseToDelete.total, cur)}</strong>
              </div>
            </div>
            <div className="ep-modal-footer center">
              <button type="button" className="ep-btn ep-btn-cancel" disabled={deleting} onClick={() => { setShowDelete(false); setPurchaseToDelete(null); }}>
                {t.cancel}
              </button>
              <button type="button" className="ep-btn ep-btn-danger" disabled={deleting} onClick={deletePurchase}>
                {deleting ? <><i className="fas fa-spinner fa-spin" style={{ marginInlineEnd: 6 }} />{t.deleting}</> : t.delete_confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchasesPage;