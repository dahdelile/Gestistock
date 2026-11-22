// src/pages/PurchasesPage.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { purchasesApi, suppliersApi, productsApi, categoriesApi } from '../../api';
// ✅ BON
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../supabaseClient';
import {
  Table, Button, Card, Spinner, Badge, Form, Modal,
  Toast, ToastContainer, Alert, Row, Col, InputGroup
} from 'react-bootstrap';
import {
  FaShoppingCart, FaCalendarAlt, FaCoins, FaCalendarDay,
  FaPlus, FaEdit, FaTrash, FaPrint, FaDownload, FaEye,
  FaTimes, FaInfoCircle, FaSyncAlt, FaUser, FaUserShield
} from 'react-icons/fa';

/* =========================================================
   TRADUCTIONS / الترجمة
========================================================= */
const I18N = {
  fr: {
    dir: 'ltr', locale: 'fr-FR', currency: 'MRU',
    title: 'Gestion des achats', subtitle: 'Gérez vos achats, vos fournisseurs et le détail de chaque commande.',
    eyebrow: 'GESTISTOCK / APPROVISIONNEMENT',
    add: 'Nouvel achat', export: 'Exporter', refresh: 'Actualiser',
    stat_daily: 'Achats du jour', stat_daily_sub: (v) => `Dépenses : ${v}`,
    stat_monthly: 'Achats du mois', stat_monthly_sub: (v) => `Dépenses : ${v}`,
    stat_total: 'Quantité achetée', stat_total_sub: 'Unités de sous-catégories achetées',
    stat_amount: 'Montant global',
    history: 'Historique des achats', history_sub: (n) => `${n} résultat(s) affiché(s)`,
    search_ph: 'Rechercher un numéro, fournisseur...',
    all_status: 'Tous les statuts', received: 'Réceptionné', pending: 'En attente', cancelled: 'Annulé',
    start_date: 'Date de début', end_date: 'Date de fin',
    loading: 'Chargement des achats...', none_title: 'Aucun achat enregistré', none_search: 'Aucun résultat trouvé',
    none_sub: 'Commencez par créer votre premier achat.', none_search_sub: 'Modifiez votre recherche ou vos filtres.',
    none_add: 'Créer un achat', reset: 'Réinitialiser les filtres',
    th_ref: 'Référence', th_supplier: 'Fournisseur', th_date: 'Date', th_products: 'Produit(s)',
    th_category: 'Catégorie', th_qty: 'Quantité', th_unit_price: 'Prix unitaire', th_total: 'Montant total',
    th_status: 'Statut', th_actions: 'Actions',
    units: (n) => `${n} unité(s)`, view: 'Voir', edit: 'Modifier', print: 'Imprimer', delete: 'Supprimer',
    footer_show: (shown, total) => `Affichage de ${shown} sur ${total} achat(s)`, footer_total: 'Total des résultats :',
    modal_new: 'Nouvel achat', modal_edit: 'Modifier un achat', modal_sub: 'Renseignez les informations et ajoutez les produits achetés.',
    section_general: 'Informations générales', section_products: 'Ajouter des produits',
    f_number: "Numéro d'achat", f_supplier: 'Fournisseur', f_supplier_ph: 'Sélectionner un fournisseur (Optionnel)',
    f_notes: 'Notes / Observations', f_notes_ph: 'Informations complémentaires...',
    f_category: 'Catégorie', f_category_ph: 'Sélectionner une catégorie',
    f_subcategory: 'Sous-catégorie', f_subcategory_ph: 'Sélectionner une sous-catégorie',
    f_qty: 'Quantité', f_price: 'Prix unitaire (MRU)', btn_add: 'Ajouter',
    cart_empty: 'Aucun produit ajouté pour le moment.', cart_product: 'Produit', cart_subtotal: 'Sous-total',
    cart_action: 'Action', cart_total: 'Total de la commande', cart_distinct: (n) => `${n} produit(s) différent(s)`,
    cancel: 'Annuler', save: 'Enregistrer l’achat', save_edit: 'Enregistrer les modifications', saving: 'Enregistrement...',
    details_title: "Détails de l'achat", details_ref: 'Référence :', details_section: 'Articles achetés',
    details_empty: 'Aucun article détaillé pour cet achat.', details_notes: 'Notes / Observations', details_total: 'Total général', close: 'Fermer',
    delete_title: 'Supprimer cet achat ?', delete_sub: 'Cette action peut être irréversible.',
    delete_confirm_q: "Confirmez-vous la suppression de l'achat", delete_confirm: 'Oui, supprimer', deleting: 'Suppression...',
    err_load: 'Erreur de chargement des achats.', err_save: "Erreur lors de l'enregistrement de l'achat.",
    err_delete: "Erreur lors de la suppression de l'achat.", ok_saved: 'Achat enregistré avec succès.',
    ok_updated: 'Achat modifié avec succès.', ok_deleted: 'Achat supprimé avec succès.',
    warn_no_product: 'Veuillez sélectionner un produit.', warn_qty: 'La quantité doit être supérieure à zéro.',
    warn_price: 'Veuillez saisir un prix unitaire valide.', warn_cart_empty: 'Ajoutez au moins un produit à cet achat.',
    warn_popup: 'Autorisez les fenêtres pop-up pour imprimer.', supplier_none: 'Fournisseur non renseigné', product_unknown: 'Produit',
    role_admin: 'Admin', role_manager: 'Gérant', role_stock: 'Stock', role_user: 'Lecture',
    err_forbidden: 'Action réservée à l’administrateur.',
    err_forbidden_add: 'Vous n’avez pas le droit d’ajouter un achat.',
  },
  ar: {
    dir: 'rtl', locale: 'ar-u-nu-latn', currency: 'أوقية',
    title: 'إدارة المشتريات', subtitle: 'أدر مشترياتك ومورديك وتفاصيل كل طلبية.',
    eyebrow: 'GESTISTOCK / التزويد',
    add: 'شراء جديد', export: 'تصدير', refresh: 'تحديث',
    stat_daily: 'مشتريات اليوم', stat_daily_sub: (v) => `المصروفات: ${v}`,
    stat_monthly: 'مشتريات الشهر', stat_monthly_sub: (v) => `المصروفات: ${v}`,
    stat_total: 'الكمية المشتراة', stat_total_sub: 'إجمالي وحدات الفئات الفرعية المشتراة',
    stat_amount: 'المبلغ الإجمالي',
    history: 'سجل المشتريات', history_sub: (n) => `${n} نتيجة معروضة`,
    search_ph: 'ابحث برقم أو مورد...',
    all_status: 'كل الحالات', received: 'مستلمة', pending: 'قيد الانتظار', cancelled: 'ملغاة',
    start_date: 'تاريخ البداية', end_date: 'تاريخ النهاية',
    loading: 'جارٍ تحميل المشتريات...', none_title: 'لا توجد مشتريات مسجلة', none_search: 'لا توجد نتائج',
    none_sub: 'ابدأ بإنشاء أول عملية شراء.', none_search_sub: 'عدّل البحث أو الفلاتر.',
    none_add: 'إنشاء عملية شراء', reset: 'إعادة تعيين الفلاتر',
    th_ref: 'المرجع', th_supplier: 'المورد', th_date: 'التاريخ', th_products: 'المنتج (المنتجات)',
    th_category: 'الفئة', th_qty: 'الكمية', th_unit_price: 'سعر الوحدة', th_total: 'المبلغ الإجمالي',
    th_status: 'الحالة', th_actions: 'إجراءات',
    units: (n) => `${n} وحدة`, view: 'عرض', edit: 'تعديل', print: 'طباعة', delete: 'حذف',
    footer_show: (shown, total) => `عرض ${shown} من ${total} عملية شراء`, footer_total: 'إجمالي النتائج:',
    modal_new: 'شراء جديد', modal_edit: 'تعديل عملية شراء', modal_sub: 'أدخل المعلومات وأضف المنتجات المشتراة.',
    section_general: 'معلومات عامة', section_products: 'إضافة منتجات',
    f_number: 'رقم الشراء', f_supplier: 'المورد', f_supplier_ph: 'اختر موردًا (اختياري)',
    f_notes: 'ملاحظات', f_notes_ph: 'معلومات إضافية...',
    f_category: 'الفئة', f_category_ph: 'اختر فئة',
    f_subcategory: 'الفئة الفرعية', f_subcategory_ph: 'اختر فئة فرعية',
    f_qty: 'الكمية', f_price: 'سعر الوحدة (أوقية)', btn_add: 'إضافة',
    cart_empty: 'لم تُضف أي منتجات بعد.', cart_product: 'المنتج', cart_subtotal: 'المجموع الفرعي',
    cart_action: 'إجراء', cart_total: 'إجمالي الطلبية', cart_distinct: (n) => `${n} منتج مختلف`,
    cancel: 'إلغاء', save: 'حفظ الشراء', save_edit: 'حفظ التعديلات', saving: 'جارٍ الحفظ...',
    details_title: 'تفاصيل الشراء', details_ref: 'المرجع:', details_section: 'المنتجات المشتراة',
    details_empty: 'لا توجد تفاصيل لهذه العملية.', details_notes: 'ملاحظات', details_total: 'الإجمالي العام', close: 'إغلاق',
    delete_title: 'حذف عملية الشراء؟', delete_sub: 'قد يكون هذا الإجراء غير قابل للتراجع.',
    delete_confirm_q: 'هل تؤكد حذف العملية', delete_confirm: 'نعم، احذف', deleting: 'جارٍ الحذف...',
    err_load: 'تعذّر تحميل المشتريات.', err_save: 'حدث خطأ أثناء حفظ الشراء.',
    err_delete: 'حدث خطأ أثناء حذف الشراء.', ok_saved: 'تم حفظ الشراء بنجاح.',
    ok_updated: 'تم تعديل الشراء بنجاح.', ok_deleted: 'تم حذف الشراء بنجاح.',
    warn_no_product: 'الرجاء اختيار منتج.', warn_qty: 'يجب أن تكون الكمية أكبر من صفر.',
    warn_price: 'أدخل سعر وحدة صالحًا.', warn_cart_empty: 'أضف منتجًا واحدًا على الأقل.',
    warn_popup: 'اسمح بالنوافذ المنبثقة للطباعة.', supplier_none: 'مورد غير محدد', product_unknown: 'منتج',
    role_admin: 'مدير', role_manager: 'مدير', role_stock: 'مخزن', role_user: 'قراءة',
    err_forbidden: 'هذا الإجراء مخصص لمدير النظام فقط.',
    err_forbidden_add: 'ليس لديك صلاحية إضافة عملية شراء.',
  },
};

/* =========================================================
   UTILITAIRES
========================================================= */
const emptyForm = () => ({ purchase_number: '', supplier_id: '', notes: '' });
const emptyItem = () => ({ category_id: '', subcategory_id: '', quantity: 1, unit_price: '' });

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

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));

/* =========================================================
   PERMISSIONS — Admin tout, Gérant voir+ajouter+modifier, PAS supprimer
========================================================= */
const normalizeRole = (r) => String(r || '').trim().toLowerCase();
const isAdminRole = (role) => ['admin', 'administrateur', 'administrator'].includes(normalizeRole(role));

/* =========================================================
   COMPOSANT PRINCIPAL
========================================================= */
const PurchasesPage = ({ user: userProp }) => {
  const { lang } = useLanguage();
  const t = I18N[lang];
  const cur = t.currency;

  // ✅ Vrai utilisateur : prop App.js OU Supabase (plus jamais localStorage 'user')
 // ✅ Rôle fiable : 1. prop App.js  2. profiles  3. user_metadata
const [loggedUser, setLoggedUser] = useState(userProp || null);
const [userLoading, setUserLoading] = useState(!userProp);

useEffect(() => {
  if (userProp?.role) {
    setLoggedUser(userProp);
    setUserLoading(false);
    return;
  }
  let alive = true;
  const load = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { if (alive) setUserLoading(false); return; }

      // 1. On essaie profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, status, name')
        .eq('id', session.user.id)
        .maybeSingle();

      // 2. Si profiles est vide, on prend user_metadata (celui de PageConnection)
      const metaRole = session.user.user_metadata?.role;

      if (!alive) return;
      setLoggedUser({
        id: session.user.id,
        email: session.user.email,
        name: profile?.name || session.user.user_metadata?.name || session.user.email,
        role: normalizeRole(profile?.role || metaRole || 'cashier'),
        status: profile?.status || 'active',
      });
    } catch (e) {
      console.error(e);
    }
    if (alive) setUserLoading(false);
  };
  load();
  return () => { alive = false; };
}, [userProp]);
  // ✅ RÈGLES ACHATS
  const userRole = normalizeRole(loggedUser?.role);
  const isAdmin = isAdminRole(userRole);
  const canAdd = isAdmin || userRole === 'manager' || userRole === 'stock'; // Gérant + Stock peuvent ajouter
  const canEdit = isAdmin || userRole === 'manager' || userRole === 'stock'; // Gérant + Stock peuvent modifier
  const canDelete = isAdmin; // SEUL ADMIN supprime
  const canView = !!loggedUser || true; // tout le monde connecté peut consulter

  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const [editingPurchase, setEditingPurchase] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [purchaseToDelete, setPurchaseToDelete] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [currentItem, setCurrentItem] = useState(emptyItem);
  const [cart, setCart] = useState([]);
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, variant = 'success') => {
    const newToast = { id: Date.now(), message, variant };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((tt) => tt.id !== newToast.id));
    }, 5000);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [purchaseResponse, supplierResponse, productResponse, categoryResponse] = await Promise.all([
        purchasesApi.getAll(),
        suppliersApi.getAll(),
        productsApi.getAll(),
        categoriesApi.getAll(),
      ]);
      setPurchases(getRows(purchaseResponse));
      setSuppliers(getRows(supplierResponse));
      setProducts(getRows(productResponse));
      setCategories(getRows(categoryResponse));
    } catch (error) {
      console.error('Erreur de chargement des achats :', error);
      showToast(t.err_load, 'danger');
    } finally {
      setLoading(false);
    }
  }, [showToast, t.err_load]);

  useEffect(() => { loadData(); }, [loadData]);

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    let totalAmount = 0, monthlyAmount = 0, dailyAmount = 0, totalQuantity = 0, monthlyQuantity = 0, dailyQuantity = 0;

    purchases.forEach((purchase) => {
      if (String(purchase.status || '').toLowerCase() === 'cancelled') return;
      const amount = Number(purchase.total || 0);
      const itemsQuantity = getPurchaseItems(purchase).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
      totalAmount += amount; totalQuantity += itemsQuantity;

      const rawDate = purchase.purchase_date || purchase.created_at;
      if (!rawDate) return;
      const date = new Date(rawDate);
      if (Number.isNaN(date.getTime())) return;
      const purchaseDay = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) { monthlyAmount += amount; monthlyQuantity += itemsQuantity; }
      if (purchaseDay === todayStr) { dailyAmount += amount; dailyQuantity += itemsQuantity; }
    });

    return { count: purchases.length, totalQuantity, dailyQuantity, monthlyQuantity, totalAmount, monthlyAmount, dailyAmount };
  }, [purchases]);

  const filteredPurchases = useMemo(() => {
    const query = search.trim().toLowerCase();
    return purchases.filter((purchase) => {
      const supplierName = getSupplierName(purchase, suppliers, t.supplier_none).toLowerCase();
      const number = String(purchase.purchase_number || '').toLowerCase();
      const status = String(purchase.status || '').toLowerCase();
      const matchesSearch = !query || number.includes(query) || supplierName.includes(query) || String(purchase.notes || '').toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || status === statusFilter.toLowerCase();
      const purchaseDateStr = String(purchase.purchase_date || purchase.created_at || '').slice(0, 10);
      const matchesStart = !startDateFilter || purchaseDateStr >= startDateFilter;
      const matchesEnd = !endDateFilter || purchaseDateStr <= endDateFilter;
      return matchesSearch && matchesStatus && matchesStart && matchesEnd;
    });
  }, [purchases, suppliers, search, statusFilter, startDateFilter, endDateFilter, t.supplier_none]);

  const cartTotal = useMemo(() => cart.reduce((total, item) => total + Number(item.quantity || 0) * Number(item.unit_price || 0), 0), [cart]);
  const hasFilters = Boolean(search || statusFilter !== 'all' || startDateFilter || endDateFilter);
  const resetFilters = () => { setSearch(''); setStatusFilter('all'); setStartDateFilter(''); setEndDateFilter(''); };

  const resetForm = () => { setForm(emptyForm()); setCurrentItem(emptyItem()); setCart([]); setEditingPurchase(null); };
  const openCreateForm = () => {
    if (!canAdd) { showToast(t.err_forbidden_add, 'danger'); return; }
    resetForm(); setShowForm(true);
  };
  const closeForm = () => { if (saving) return; setShowForm(false); resetForm(); };
  const updateForm = (e) => { const { name, value } = e.target; setForm((prev) => ({ ...prev, [name]: value })); };

  const selectedCategory = categories.find((c) => String(c.id) === String(currentItem.category_id));
  const availableSubcategories = (selectedCategory?.sous_categories || []).filter((sub) => !sub.status || sub.status === 'active');

  const updateCurrentItem = (e) => {
    const { name, value } = e.target;
    setCurrentItem((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'category_id') { next.subcategory_id = ''; next.unit_price = ''; }
      return next;
    });
  };

  const addItemToCart = () => {
    const category = categories.find((c) => String(c.id) === String(currentItem.category_id));
    const subcategory = category?.sous_categories?.find((s) => String(s.id) === String(currentItem.subcategory_id));
    if (!category || !subcategory) return showToast(t.warn_no_product, 'warning');
    const quantity = Number(currentItem.quantity);
    const unitPrice = Number(currentItem.unit_price);
    if (!Number.isFinite(quantity) || quantity <= 0) return showToast(t.warn_qty, 'warning');
    if (!Number.isFinite(unitPrice) || unitPrice < 0) return showToast(t.warn_price, 'warning');

    const key = `${category.id}-${subcategory.id}`;
    const existingIndex = cart.findIndex((item) => `${item.category_id}-${item.subcategory_id}` === key);
    if (existingIndex >= 0) {
      setCart((prev) => prev.map((item, index) => index === existingIndex
        ? { ...item, quantity: Number(item.quantity) + quantity, unit_price: unitPrice, total: (Number(item.quantity) + quantity) * unitPrice }
        : item));
    } else {
      const product = products.find((p) => String(p.category_id) === String(category.id) && String(p.subcategory_id) === String(subcategory.id));
      setCart((prev) => [...prev, {
        product_id: product?.id || '', category_id: category.id, subcategory_id: subcategory.id,
        product_name: subcategory.name, quantity, unit_price: unitPrice, total: quantity * unitPrice
      }]);
    }
    setCurrentItem({ ...emptyItem(), quantity: 1 });
  };

  const removeCartItem = (key) => setCart((prev) => prev.filter((item) => `${item.category_id}-${item.subcategory_id}` !== String(key)));

  const openEditForm = (purchase) => {
    if (!canEdit) { showToast(t.err_forbidden, 'danger'); return; }
    setEditingPurchase(purchase);
    setForm({ purchase_number: purchase.purchase_number || '', supplier_id: purchase.supplier_id || '', notes: purchase.notes || '' });
    const items = getPurchaseItems(purchase);
    setCart(items.map((item) => {
      const product = item.products || products.find((p) => String(p.id) === String(item.product_id));
      return {
        product_id: item.product_id, category_id: product?.category_id || '', subcategory_id: product?.subcategory_id || '',
        product_name: product?.name || t.product_unknown, quantity: Number(item.quantity || 1),
        unit_price: Number(item.unit_price || 0), total: Number(item.total) || Number(item.quantity || 0) * Number(item.unit_price || 0),
      };
    }));
    setCurrentItem(emptyItem());
    setShowForm(true);
  };

  const savePurchase = async () => {
    // ✅ Garde : Gérant peut ajouter + modifier, Caissier ne peut pas
    if (editingPurchase && !canEdit) { showToast(t.err_forbidden, 'danger'); return; }
    if (!editingPurchase && !canAdd) { showToast(t.err_forbidden_add, 'danger'); return; }
    if (cart.length === 0) return showToast(t.warn_cart_empty, 'warning');
    setSaving(true);
    const payload = {
      purchase_number: form.purchase_number.trim() || `ACH-${Date.now().toString().slice(-6)}`,
      supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
      notes: form.notes.trim(), total: cartTotal, status: 'received',
      items: cart.map((item) => ({
        category_id: Number(item.category_id), subcategory_id: Number(item.subcategory_id),
        quantity: Number(item.quantity), unit_price: Number(item.unit_price),
        total: Number(item.quantity) * Number(item.unit_price),
      })),
    };
    try {
      if (editingPurchase) {
        await purchasesApi.deletePurchase(editingPurchase.id, editingPurchase.purchase_items || editingPurchase.items);
        await purchasesApi.create(payload);
        showToast(t.ok_updated, 'success');
      } else {
        await purchasesApi.create(payload);
        showToast(t.ok_saved, 'success');
      }
      setShowForm(false); resetForm(); await loadData();
    } catch (error) {
      console.error('Erreur achat:', error);
      showToast(error?.message || t.err_save, 'danger');
    } finally { setSaving(false); }
  };

  const confirmDelete = (purchase) => {
    if (!canDelete) { showToast(t.err_forbidden, 'danger'); return; }
    setPurchaseToDelete(purchase); setShowDelete(true);
  };
  const deletePurchase = async () => {
    if (!purchaseToDelete) return;
    if (!canDelete) { showToast(t.err_forbidden, 'danger'); return; }
    setDeleting(true);
    try {
      await purchasesApi.deletePurchase(purchaseToDelete.id, purchaseToDelete.purchase_items || purchaseToDelete.items);
      setShowDelete(false); setPurchaseToDelete(null);
      showToast(t.ok_deleted, 'success'); await loadData();
    } catch (error) {
      console.error('Erreur:', error);
      showToast(error?.message || t.err_delete, 'danger');
    } finally { setDeleting(false); }
  };

  const openPurchaseDetails = (purchase) => { setSelectedPurchase(purchase); setShowDetails(true); };

  const printPurchase = (purchase) => {
    const items = getPurchaseItems(purchase);
    const supplierName = getSupplierName(purchase, suppliers, t.supplier_none);
    const rows = items.map((item) => {
      const productName = item.products?.name || products.find((p) => String(p.id) === String(item.product_id))?.name || t.product_unknown;
      return `<tr><td>${escapeHtml(productName)}</td><td>${Number(item.quantity || 0)}</td><td>${formatMoney(item.unit_price, cur)}</td><td>${formatMoney(item.total ?? Number(item.quantity || 0) * Number(item.unit_price || 0), cur)}</td></tr>`;
    }).join('');
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return showToast(t.warn_popup, 'warning');
    win.document.write(`<!DOCTYPE html><html lang="${lang}" dir="${t.dir}"><head><meta charset="UTF-8"><title>${escapeHtml(purchase.purchase_number || purchase.id)}</title>
    <style>body{font-family:${lang === 'ar' ? 'Cairo, ' : ''}Arial,sans-serif;padding:35px;color:#14213d}.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1f5eea;padding-bottom:20px;margin-bottom:25px}h1{color:#1f5eea;margin:0 0 8px}.muted{color:#66748b}table{width:100%;border-collapse:collapse;margin-top:25px}th,td{border:1px solid #e3e9f2;padding:12px;text-align:${t.dir === 'rtl' ? 'right' : 'left'}}th{background:#e8efff}.total{text-align:${t.dir === 'rtl' ? 'left' : 'right'};margin-top:25px;font-size:20px}.notes{margin-top:25px}</style>
    </head><body><div class="header"><div><h1>GESTISTOCK</h1><div class="muted">${t.title}</div></div><div><h2>${t.modal_new}</h2><div><strong>${t.th_ref} :</strong> ${escapeHtml(purchase.purchase_number || purchase.id)}</div><div><strong>${t.th_date} :</strong> ${formatDate(purchase.purchase_date || purchase.created_at, t.locale)}</div></div></div>
    <p><strong>${t.th_supplier} :</strong> ${escapeHtml(supplierName)}</p>
    <table><thead><tr><th>${t.cart_product}</th><th>${t.f_qty}</th><th>${t.f_price}</th><th>${t.th_total}</th></tr></thead><tbody>${rows || `<tr><td colspan="4">${t.details_empty}</td></tr>`}</tbody></table>
    <div class="total"><strong>${t.details_total} : ${formatMoney(purchase.total, cur)}</strong></div>
    ${purchase.notes ? `<div class="notes"><strong>${t.details_notes} :</strong> ${escapeHtml(purchase.notes)}</div>` : ''}
    <script>window.onload=function(){window.print();}</script></body></html>`);
    win.document.close();
  };

  const exportPurchase = (purchase) => {
    const items = getPurchaseItems(purchase);
    const rows = [
      [t.th_ref, purchase.purchase_number || purchase.id], [t.th_date, formatDate(purchase.purchase_date || purchase.created_at, t.locale)],
      [t.th_supplier, getSupplierName(purchase, suppliers, t.supplier_none)], [t.th_status, purchase.status || '—'], [],
      [t.cart_product, t.f_qty, t.f_price, t.th_total],
      ...items.map((item) => [item.products?.name || t.product_unknown, item.quantity || 0, item.unit_price || 0, item.total ?? Number(item.quantity || 0) * Number(item.unit_price || 0)]),
      [], [t.details_total, '', '', Number(purchase.total || 0)], [t.details_notes, purchase.notes || ''],
    ];
    const csv = rows.map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = `Achat_${purchase.purchase_number || purchase.id}.csv`;
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  };

  const exportAllPurchases = () => {
    const rows = [
      [t.th_ref, t.th_date, t.th_supplier, t.th_status, t.th_total, t.details_notes],
      ...filteredPurchases.map((p) => [p.purchase_number || p.id, formatDate(p.purchase_date || p.created_at, t.locale), getSupplierName(p, suppliers, t.supplier_none), p.status || '—', Number(p.total || 0), p.notes || '']),
    ];
    const csv = rows.map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = 'Liste_des_achats.csv';
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  };

  const statusTone = (status) => {
    const v = String(status || '').toLowerCase();
    if (['completed', 'received', 'paid'].includes(v)) return 'success';
    if (['cancelled', 'annule'].includes(v)) return 'danger';
    if (['pending', 'unpaid', 'en_attente'].includes(v)) return 'warning';
    return 'primary';
  };

  const statusLabel = (status) => {
    const v = String(status || '').toLowerCase();
    const map = { pending: t.pending, completed: 'Terminé', received: t.received, cancelled: t.cancelled, paid: 'Payé', unpaid: 'Non payé' };
    return map[v] || status || 'Enregistré';
  };

  const getProductNames = (purchase) => {
    const names = getPurchaseItems(purchase).map((item) => item.products?.name || products.find((p) => String(p.id) === String(item.product_id))?.name || t.product_unknown);
    return names.length > 0 ? names.join(', ') : '—';
  };

  const getPurchaseCategories = (purchase) => {
    const names = getPurchaseItems(purchase).map((item) => {
      const product = item.products || products.find((p) => String(p.id) === String(item.product_id));
      const categoryId = item.category_id ?? product?.category_id;
      const directCategory = item.categories || item.category || categories.find((category) => String(category.id) === String(categoryId));
      return directCategory?.name || '';
    }).filter(Boolean);
    return [...new Set(names)].join(', ') || '—';
  };

  const roleBadgeLabel = isAdmin ? t.role_admin : userRole === 'manager' ? t.role_manager : userRole === 'stock' ? t.role_stock : t.role_user;

  if (userLoading) {
    return (
      <div className="container-fluid py-4 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Vérification des permissions...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 purchases-compact" dir={t.dir} lang={lang}>
      <ToastContainer position="top-end" className="p-3">
        {toasts.map((toast) => (
          <Toast key={toast.id} onClose={() => setToasts((prev) => prev.filter((tt) => tt.id !== toast.id))} bg={toast.variant} autohide delay={5000}>
            <Toast.Body className="text-white">{toast.message}</Toast.Body>
          </Toast>
        ))}
      </ToastContainer>

      {/* ====== STATISTIQUES : 4 en ligne horizontale sur mobile ====== */}
      <Row className="mb-4">
        <Col xs={3} md={3}>
          <Card className="bg-warning text-white shadow-sm">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div><h6 className="mb-0">{t.stat_daily}</h6><h2 className="mb-0">{Number(stats.dailyQuantity || 0).toLocaleString(t.locale)}</h2></div>
              <FaCalendarDay size={40} />
            </Card.Body>
          </Card>
        </Col>
        <Col xs={3} md={3}>
          <Card className="bg-primary text-white shadow-sm">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div><h6 className="mb-0">{t.stat_monthly}</h6><h2 className="mb-0">{Number(stats.monthlyQuantity || 0).toLocaleString(t.locale)}</h2></div>
              <FaCalendarAlt size={40} />
            </Card.Body>
          </Card>
        </Col>
        <Col xs={3} md={3}>
          <Card className="bg-success text-white shadow-sm">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div><h6 className="mb-0">{t.stat_total}</h6><h2 className="mb-0">{Number(stats.totalQuantity || 0).toLocaleString(t.locale)}</h2></div>
              <FaShoppingCart size={40} />
            </Card.Body>
          </Card>
        </Col>
        <Col xs={3} md={3}>
          <Card className="bg-info text-white shadow-sm">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div><h6 className="mb-0">{t.stat_amount}</h6><h2 className="mb-0">{formatMoney(stats.totalAmount, cur)}</h2></div>
              <FaCoins size={40} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ====== CARTE PRINCIPALE ====== */}
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h3 className="mb-0 d-flex align-items-center">
              <FaShoppingCart className="me-2" />
              {t.title}
              <Badge bg={isAdmin ? 'success' : canAdd ? 'warning' : 'secondary'} className="ms-2" style={{ fontSize: '0.6em' }}>
                {isAdmin ? <FaUserShield className="me-1" /> : <FaUser className="me-1" />}
                {roleBadgeLabel}
              </Badge>
            </h3>
            <div className="d-flex align-items-center gap-2">
              <Button variant="outline-success" onClick={exportAllPurchases} disabled={filteredPurchases.length === 0}>
                <FaDownload className="me-1" /> {t.export}
              </Button>
              <Button variant="light" onClick={loadData} disabled={loading}>
                <FaSyncAlt className={loading ? "spin" : ""} /> <span className="ms-2">{t.refresh}</span>
              </Button>
              {canAdd && (
                <Button variant="success" onClick={openCreateForm} disabled={loading}>
                  <FaPlus className="me-1" /> {t.add}
                </Button>
              )}
            </div>
          </div>
        </Card.Header>

        <Card.Body>
          {/* Filtres */}
          <Row className="mb-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-bold"><FaInfoCircle className="me-2" />{t.history}</Form.Label>
                <InputGroup>
                  <Form.Control type="text" placeholder={t.search_ph} value={search} onChange={(e) => setSearch(e.target.value)} />
                  {search && <Button variant="outline-secondary" onClick={() => setSearch('')}>×</Button>}
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="fw-bold">{t.th_status}</Form.Label>
                <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">{t.all_status}</option>
                  <option value="received">{t.received}</option>
                  <option value="pending">{t.pending}</option>
                  <option value="cancelled">{t.cancelled}</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="fw-bold">{t.start_date}</Form.Label>
                <Form.Control type="date" value={startDateFilter} onChange={(e) => setStartDateFilter(e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="fw-bold">{t.end_date}</Form.Label>
                <Form.Control type="date" value={endDateFilter} onChange={(e) => setEndDateFilter(e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={3} className="d-flex align-items-end gap-2">
              {hasFilters && (
                <Button variant="outline-secondary" onClick={resetFilters} className="flex-grow-1">
                  <FaTimes className="me-2" />{t.reset}
                </Button>
              )}
            </Col>
          </Row>

          {/* Tableau */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">{t.loading}</p>
            </div>
          ) : filteredPurchases.length === 0 ? (
            <div className="text-center py-5">
              <FaInfoCircle className="text-muted mb-2" size={32} />
              <h5 className="text-muted">{purchases.length === 0 ? t.none_title : t.none_search}</h5>
              <p className="text-muted small">{purchases.length === 0 ? t.none_sub : t.none_search_sub}</p>
              {purchases.length === 0 && canAdd && (
                <Button variant="primary" onClick={openCreateForm}><FaPlus className="me-2" />{t.none_add}</Button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover className="mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>{t.th_date}</th>
                    <th>{t.th_products}</th>
                    <th>{t.th_category}</th>
                    <th className="text-center">{t.th_qty}</th>
                    <th className="text-end">{t.th_unit_price}</th>
                    <th className="text-end">{t.th_total}</th>
                    <th>{t.th_status}</th>
                    <th>{t.th_supplier}</th>
                    <th style={{ width: '160px' }} className="text-end">{t.th_actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchases.map((purchase) => {
                    const items = getPurchaseItems(purchase);
                    const supplierName = getSupplierName(purchase, suppliers, t.supplier_none);
                    const totalQty = items.reduce((sum, item) => sum + Number(item.quantity), 0);
                    const firstUnitPrice = items.length > 0 ? items[0].unit_price : 0;
                    const productNames = getProductNames(purchase);
                    const purchaseCategories = getPurchaseCategories(purchase);
                    return (
                      <tr key={purchase.id}>
                        <td>{formatDate(purchase.purchase_date || purchase.created_at, t.locale)}</td>
                        <td title={productNames} style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{productNames}</td>
                        <td title={purchaseCategories} style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{purchaseCategories}</td>
                        <td className="text-center"><Badge bg="secondary">{t.units(totalQty)}</Badge></td>
                        <td className="text-end">{formatMoney(firstUnitPrice, cur)}</td>
                        <td className="text-end fw-bold text-success">{formatMoney(purchase.total, cur)}</td>
                        <td><Badge bg={statusTone(purchase.status)}>{statusLabel(purchase.status)}</Badge></td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="bg-primary bg-opacity-10 text-primary rounded d-flex align-items-center justify-content-center" style={{ width: 30, height: 30, fontWeight: 'bold' }}>
                              {supplierName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-truncate" style={{ maxWidth: 150 }}>{supplierName}</span>
                          </div>
                        </td>
                        <td className="text-end">
                          <div className="d-flex gap-1 justify-content-end">
                            <Button variant="outline-info" size="sm" onClick={() => openPurchaseDetails(purchase)} title={t.view}><FaEye /></Button>
                            {canEdit && (
                              <Button variant="outline-success" size="sm" onClick={() => openEditForm(purchase)} title={t.edit}><FaEdit /></Button>
                            )}
                            {canDelete && (
                              <Button variant="outline-danger" size="sm" onClick={() => confirmDelete(purchase)} title={t.delete}><FaTrash /></Button>
                            )}
                            {!canEdit && !canDelete && <Button variant="outline-secondary" size="sm" disabled title="Actions réservées"><FaUserShield /></Button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}

          <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
            <span className="text-muted small">{t.footer_show(filteredPurchases.length, purchases.length)}</span>
            <span className="fw-bold">{t.footer_total} <span className="text-primary">{formatMoney(filteredPurchases.reduce((sum, p) => sum + Number(p.total || 0), 0), cur)}</span></span>
          </div>
        </Card.Body>
      </Card>

      {/* ====== MODAL FORMULAIRE ====== */}
      <Modal show={showForm} onHide={closeForm} size="lg">
        <Modal.Header closeButton>
          <Modal.Title><FaShoppingCart className="me-2" />{editingPurchase ? t.modal_edit : t.modal_new}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {cart.length === 0 && <Alert variant="warning" className="mb-3"><FaInfoCircle className="me-2" />{t.warn_cart_empty}</Alert>}
          
          <h6 className="fw-bold mb-3 border-bottom pb-2">{t.section_general}</h6>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>{t.f_number}</Form.Label>
                <Form.Control name="purchase_number" value={form.purchase_number} onChange={updateForm} placeholder={t.f_number} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>{t.f_supplier}</Form.Label>
                <Form.Select name="supplier_id" value={form.supplier_id} onChange={updateForm}>
                  <option value="">{t.f_supplier_ph}</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>{t.f_notes}</Form.Label>
                <Form.Control as="textarea" rows={2} name="notes" value={form.notes} onChange={updateForm} placeholder={t.f_notes_ph} />
              </Form.Group>
            </Col>
          </Row>

          <h6 className="fw-bold mb-3 border-bottom pb-2">{t.section_products}</h6>
          <Row className="align-items-end mb-3 g-2">
            <Col md={3}>
              <Form.Group>
                <Form.Label>{t.f_category}</Form.Label>
                <Form.Select value={currentItem.category_id} onChange={updateCurrentItem}>
                  <option value="">{t.f_category_ph}</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>{t.f_subcategory}</Form.Label>
                <Form.Select value={currentItem.subcategory_id} onChange={updateCurrentItem} disabled={!currentItem.category_id}>
                  <option value="">{t.f_subcategory_ph}</option>
                  {availableSubcategories.map((sub) => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>{t.f_qty}</Form.Label>
                <Form.Control type="number" min="1" value={currentItem.quantity} onChange={updateCurrentItem} />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>{t.f_price}</Form.Label>
                <Form.Control type="number" min="0" step="0.01" value={currentItem.unit_price} onChange={updateCurrentItem} />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Button variant="primary" className="w-100" onClick={addItemToCart} disabled={!currentItem.category_id || !currentItem.subcategory_id}>
                <FaPlus className="me-1" /> {t.btn_add}
              </Button>
            </Col>
          </Row>

          <div className="table-responsive">
            <Table bordered hover size="sm">
              <thead className="table-light">
                <tr>
                  <th>{t.cart_product}</th>
                  <th className="text-center">{t.f_qty}</th>
                  <th className="text-end">{t.f_price}</th>
                  <th className="text-end">{t.cart_subtotal}</th>
                  <th style={{ width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr><td colSpan="5" className="text-center text-muted py-3">{t.cart_empty}</td></tr>
                ) : (
                  cart.map((item) => (
                    <tr key={`${item.category_id}-${item.subcategory_id}`}>
                      <td className="fw-bold">{item.product_name}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-end">{formatMoney(item.unit_price, cur)}</td>
                      <td className="text-end fw-bold">{formatMoney(Number(item.quantity) * Number(item.unit_price), cur)}</td>
                      <td className="text-center">
                        <Button variant="outline-danger" size="sm" onClick={() => removeCartItem(`${item.category_id}-${item.subcategory_id}`)}><FaTrash /></Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {cart.length > 0 && (
                <tfoot>
                  <tr className="table-light">
                    <td colSpan="3" className="text-end fw-bold">{t.cart_total} ({t.cart_distinct(cart.length)})</td>
                    <td className="text-end fw-bold fs-5 text-primary">{formatMoney(cartTotal, cur)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </Table>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeForm} disabled={saving}>{t.cancel}</Button>
          <Button variant="success" onClick={savePurchase} disabled={saving || cart.length === 0}>
            {saving ? <Spinner size="sm" className="me-2" /> : <FaPlus className="me-2" />}
            {editingPurchase ? t.save_edit : t.save}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ====== MODAL DÉTAILS ====== */}
      <Modal show={showDetails} onHide={() => setShowDetails(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title><FaEye className="me-2" />{t.details_title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPurchase && (
            <>
              <Row className="mb-3">
                <Col md={4}><strong>{t.th_ref}</strong> {selectedPurchase.purchase_number || selectedPurchase.id}</Col>
                <Col md={4}><strong>{t.th_supplier}:</strong> {getSupplierName(selectedPurchase, suppliers, t.supplier_none)}</Col>
                <Col md={4}><strong>{t.th_date}:</strong> {formatDate(selectedPurchase.purchase_date || selectedPurchase.created_at, t.locale)}</Col>
              </Row>
              <div className="table-responsive">
                <Table striped bordered hover size="sm">
                  <thead className="table-dark">
                    <tr>
                      <th>{t.cart_product}</th>
                      <th className="text-center">{t.f_qty}</th>
                      <th className="text-end">{t.f_price}</th>
                      <th className="text-end">{t.th_total}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getPurchaseItems(selectedPurchase).length === 0 ? (
                      <tr><td colSpan="4" className="text-center text-muted py-3">{t.details_empty}</td></tr>
                    ) : (
                      getPurchaseItems(selectedPurchase).map((item, index) => {
                        const productName = item.products?.name || products.find((p) => String(p.id) === String(item.product_id))?.name || t.product_unknown;
                        return (
                          <tr key={item.id || `${item.product_id}-${index}`}>
                            <td className="fw-bold">{productName}</td>
                            <td className="text-center">{item.quantity}</td>
                            <td className="text-end">{formatMoney(item.unit_price, cur)}</td>
                            <td className="text-end fw-bold">{formatMoney(item.total ?? Number(item.quantity || 0) * Number(item.unit_price || 0), cur)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="table-light">
                      <td colSpan="3" className="text-end fw-bold">{t.details_total}</td>
                      <td className="text-end fw-bold fs-5 text-primary">{formatMoney(selectedPurchase.total, cur)}</td>
                    </tr>
                  </tfoot>
                </Table>
              </div>
              {selectedPurchase.notes && (
                <div className="mt-3 p-3 bg-light rounded border">
                  <strong className="d-block mb-1">{t.details_notes}</strong>
                  <span className="text-muted">{selectedPurchase.notes}</span>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetails(false)}>{t.close}</Button>
          <Button variant="outline-primary" onClick={() => printPurchase(selectedPurchase)}><FaPrint className="me-1" />{t.print}</Button>
          <Button variant="outline-success" onClick={() => exportPurchase(selectedPurchase)}><FaDownload className="me-1" />{t.export}</Button>
        </Modal.Footer>
      </Modal>

      {/* ====== MODAL SUPPRESSION — SEUL ADMIN ====== */}
      <Modal show={showDelete} onHide={() => !deleting && (setShowDelete(false), setPurchaseToDelete(null))}>
        <Modal.Header closeButton>
          <Modal.Title><FaTrash className="me-2 text-danger" />{t.delete_title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {purchaseToDelete && (
            <>
              <p>{t.delete_sub}</p>
              <p>{t.delete_confirm_q} <strong>{purchaseToDelete.purchase_number || purchaseToDelete.id}</strong> ?</p>
              <Alert variant="light" className="mb-0">
                <strong>{t.th_supplier}:</strong> {getSupplierName(purchaseToDelete, suppliers, t.supplier_none)}<br />
                <strong>{t.th_total}:</strong> {formatMoney(purchaseToDelete.total, cur)}
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowDelete(false); setPurchaseToDelete(null); }} disabled={deleting}>{t.cancel}</Button>
          <Button variant="danger" onClick={deletePurchase} disabled={deleting || !canDelete}>
            {deleting ? <Spinner size="sm" className="me-2" /> : <FaTrash className="me-2" />}
            {t.delete_confirm}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ====== STYLE COMPACT POUR RÉDUIRE LA TAILLE DU TEXTE ====== */}
      <style>{`
        .purchases-compact .card.bg-warning h6, 
        .purchases-compact .card.bg-primary h6,
        .purchases-compact .card.bg-success h6, 
        .purchases-compact .card.bg-info h6 { 
          font-size: 0.75rem !important; 
        }
        .purchases-compact .card.bg-warning h2, 
        .purchases-compact .card.bg-primary h2,
        .purchases-compact .card.bg-success h2, 
        .purchases-compact .card.bg-info h2 { 
          font-size: 1.25rem !important; 
        }
        .purchases-compact .card.bg-warning svg, 
        .purchases-compact .card.bg-primary svg,
        .purchases-compact .card.bg-success svg, 
        .purchases-compact .card.bg-info svg { 
          width: 28px !important; height: 28px !important; 
        }
        .purchases-compact .card-header h3 {
          font-size: 1.1rem !important;
        }
        .purchases-compact .form-label {
          font-size: 0.8rem !important;
          margin-bottom: 0.25rem !important;
        }
        .purchases-compact .table th, 
        .purchases-compact .table td {
          font-size: 0.85rem !important;
          padding: 0.5rem 0.75rem !important;
        }
        .purchases-compact .modal-title {
          font-size: 1.1rem !important;
        }
        .purchases-compact .fs-5 {
          font-size: 1rem !important;
        }
        .purchases-compact .btn {
          font-size: 0.85rem !important;
        }
        .purchases-compact .badge {
          font-size: 0.75rem !important;
        }
      `}</style>
    </div>
  );
};

export default PurchasesPage;