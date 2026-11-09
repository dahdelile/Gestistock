// src/pages/ProductsPage.jsx
// Version bilingue Français / العربية (RTL) — design unifié ExpensesPage
import React, { useState, useEffect, useMemo } from 'react';
import { productsApi, categoriesApi, suppliersApi } from '../../api';
import BarcodeScanner from './BarcodeScanner';
import { useLanguage } from '../../context/LanguageContext';
/* =========================================================
   TRADUCTIONS / الترجمة
========================================================= */

const I18N = {
  fr: {
    dir: 'ltr',
    locale: 'fr-FR',
    currency: 'UM',
    title: 'Gestion des produits',
    subtitle: 'Gérez vos articles, vos prix et vos niveaux de stock.',
    add: 'Nouveau produit',
    refresh: 'Actualiser',
    stat_total: 'Total produits',
    stat_total_sub: 'Références enregistrées',
    stat_low: 'Stock bas',
    stat_low_sub: 'À réapprovisionner',
    stat_out: 'Rupture',
    stat_out_sub: 'Produits indisponibles',
    stat_value: 'Valeur du stock',
    stat_value_sub: 'Prix d\'achat × quantité',
    filters_title: 'Recherche et filtres',
    filters_sub: 'Retrouvez rapidement un produit dans votre inventaire.',
    reset: 'Réinitialiser',
    search_ph: 'Nom, référence, code-barres...',
    scan: 'Scanner un code-barres',
    category: 'Catégorie',
    all_categories: 'Toutes',
    status: 'État',
    all_status: 'Tous les états',
    neuf: 'Neuf',
    occasion: 'Occasion',
    stock_level: 'Niveau de stock',
    all_stock: 'Tous les stocks',
    available: 'Disponible',
    low: 'Stock bas',
    out: 'Rupture',
    results: 'Résultats',
    results_count: (n) => `${n} produit(s)`,
    inventory: 'Inventaire des produits',
    inventory_sub: 'Consultez et modifiez les informations de chaque article.',
    th_product: 'Produit',
    th_category: 'Catégorie',
    th_status: 'État',
    th_purchase: 'Achat',
    th_sale: 'Vente',
    th_qty: 'Quantité',
    th_total_purchase: 'Total achat',
    th_total_sale: 'Total vente',
    th_stock: 'Stock',
    th_actions: 'Actions',
    loading: 'Chargement des produits...',
    none_title: 'Aucun produit trouvé',
    none_sub: 'Modifiez les filtres ou ajoutez un nouveau produit.',
    none_add: 'Ajouter un produit',
    no_category: 'Non classé',
    no_barcode: 'Sans code-barres',
    not_defined: 'Non défini',
    edit: 'Modifier',
    delete: 'Supprimer',
    modal_new: 'Nouveau produit',
    modal_edit: 'Modifier le produit',
    modal_sub: "Complétez les informations de l'article.",
    f_name: 'Nom du produit',
    f_name_ph: 'Ex. : Ordinateur portable',
    f_category: 'Catégorie',
    f_category_ph: 'Sélectionner',
    f_barcode: 'Code-barres',
    f_barcode_ph: 'Référence',
    f_status: 'État du produit',
    f_purchase: "Prix d'achat (UM)",
    f_sale: 'Prix de vente (UM)',
    f_quantity: 'Quantité',
    f_min: 'Stock minimum',
    f_min_hint: "Seuil d'alerte de réapprovisionnement.",
    f_supplier: 'Fournisseur',
    no_supplier: 'Aucun fournisseur',
    summary: 'Aperçu financier',
    summary_purchase: "Valeur d'achat",
    summary_sale: 'Valeur de vente',
    summary_margin: 'Marge théorique',
    cancel: 'Annuler',
    save: 'Enregistrer',
    save_changes: 'Enregistrer les modifications',
    create: 'Créer le produit',
    saving: 'Enregistrement...',
    delete_title: 'Supprimer ce produit ?',
    delete_sub: 'Vous êtes sur le point de supprimer :',
    delete_warn: 'Cette opération peut être irréversible.',
    delete_confirm: 'Supprimer',
    deleting: 'Suppression...',
    err_load: 'Impossible de charger les produits. Vérifiez votre connexion et votre API.',
    err_save: 'Échec de la sauvegarde. Vérifiez les informations saisies.',
    err_delete: 'Impossible de supprimer ce produit.',
    ok_save: 'Produit enregistré avec succès.',
    ok_delete: 'Produit supprimé avec succès.',
    close: 'Fermer',
    retry: 'Réessayer',
    switch_title: 'Changer de langue',
  },
  ar: {
    dir: 'rtl',
    locale: 'ar-u-nu-latn',
    currency: 'أوقية',
    title: 'إدارة المنتجات',
    subtitle: 'أدر منتجاتك وأسعارها ومستويات مخزونها.',
    add: 'منتج جديد',
    refresh: 'تحديث',
    stat_total: 'إجمالي المنتجات',
    stat_total_sub: 'المراجع المسجلة',
    stat_low: 'مخزون منخفض',
    stat_low_sub: 'بحاجة إلى إعادة تعبئة',
    stat_out: 'نفد المخزون',
    stat_out_sub: 'منتجات غير متوفرة',
    stat_value: 'قيمة المخزون',
    stat_value_sub: 'سعر الشراء × الكمية',
    filters_title: 'البحث والتصفية',
    filters_sub: 'اعثر بسرعة على منتج في مخزونك.',
    reset: 'إعادة تعيين',
    search_ph: 'الاسم، المرجع، الباركود...',
    scan: 'مسح الباركود',
    category: 'الفئة',
    all_categories: 'الكل',
    status: 'الحالة',
    all_status: 'كل الحالات',
    neuf: 'جديد',
    occasion: 'مستعمل',
    stock_level: 'مستوى المخزون',
    all_stock: 'كل المستويات',
    available: 'متوفر',
    low: 'مخزون منخفض',
    out: 'نفد',
    results: 'النتائج',
    results_count: (n) => `${n} منتج`,
    inventory: 'مخزون المنتجات',
    inventory_sub: 'اطلع على معلومات كل صنف وعدّلها.',
    th_product: 'المنتج',
    th_category: 'الفئة',
    th_status: 'الحالة',
    th_purchase: 'الشراء',
    th_sale: 'البيع',
    th_qty: 'الكمية',
    th_total_purchase: 'إجمالي الشراء',
    th_total_sale: 'إجمالي البيع',
    th_stock: 'المخزون',
    th_actions: 'إجراءات',
    loading: 'جارٍ تحميل المنتجات...',
    none_title: 'لا توجد منتجات',
    none_sub: 'عدّل الفلاتر أو أضف منتجًا جديدًا.',
    none_add: 'إضافة منتج',
    no_category: 'غير مصنف',
    no_barcode: 'بدون باركود',
    not_defined: 'غير محدد',
    edit: 'تعديل',
    delete: 'حذف',
    modal_new: 'منتج جديد',
    modal_edit: 'تعديل المنتج',
    modal_sub: 'أكمل معلومات الصنف.',
    f_name: 'اسم المنتج',
    f_name_ph: 'مثال: حاسوب محمول',
    f_category: 'الفئة',
    f_category_ph: 'اختر',
    f_barcode: 'الباركود',
    f_barcode_ph: 'المرجع',
    f_status: 'حالة المنتج',
    f_purchase: 'سعر الشراء (أوقية)',
    f_sale: 'سعر البيع (أوقية)',
    f_quantity: 'الكمية',
    f_min: 'الحد الأدنى للمخزون',
    f_min_hint: 'عتبة التنبيه لإعادة التعبئة.',
    f_supplier: 'المورد',
    no_supplier: 'بدون مورد',
    summary: 'ملخص مالي',
    summary_purchase: 'قيمة الشراء',
    summary_sale: 'قيمة البيع',
    summary_margin: 'الهامش المتوقع',
    cancel: 'إلغاء',
    save: 'حفظ',
    save_changes: 'حفظ التعديلات',
    create: 'إنشاء المنتج',
    saving: 'جارٍ الحفظ...',
    delete_title: 'حذف هذا المنتج؟',
    delete_sub: 'أنت على وشك حذف:',
    delete_warn: 'هذا الإجراء قد يكون غير قابل للتراجع.',
    delete_confirm: 'حذف',
    deleting: 'جارٍ الحذف...',
    err_load: 'تعذّر تحميل المنتجات. تحقق من الاتصال والخادم.',
    err_save: 'فشل الحفظ. تحقق من المعلومات المدخلة.',
    err_delete: 'تعذّر حذف هذا المنتج.',
    ok_save: 'تم حفظ المنتج بنجاح.',
    ok_delete: 'تم حذف المنتج بنجاح.',
    close: 'إغلاق',
    retry: 'إعادة المحاولة',
    switch_title: 'تغيير اللغة',
  },
};



/* =========================================================
   UTILITAIRES
========================================================= */

const emptyForm = () => ({
  name: '',
  category: '',
  barcode: '',
  status: 'neuf',
  purchase_price: '',
  sale_price: '',
  quantity: '',
  min_quantity: 5,
  supplier_id: '',
});

const pad = (n) => String(n).padStart(2, '0');

const formatMoney = (value, cur = 'UM') => {
  const n = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(Number(value) || 0);
  return `${n} ${cur}`;
};
const formatNumber = (value) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(Number(value) || 0);

const getRows = (response) => {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const getCategoryName = (product) => {
  if (product.categories && typeof product.categories === 'object') return product.categories.name || '';
  if (product.category && typeof product.category === 'object') return product.category.name || '';
  return typeof product.category === 'string' ? product.category : '';
};

const getStockStatus = (quantity, minimum) => {
  const qty = Number(quantity) || 0;
  const min = Number(minimum) || 0;
  if (qty <= 0) return { key: 'out', tone: 'rose' };
  if (qty <= min) return { key: 'low', tone: 'amber' };
  return { key: 'available', tone: 'green' };
};

const BADGE_TONES = ['blue', 'violet', 'green', 'amber', 'rose', 'teal'];
const toneFor = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return BADGE_TONES[hash % BADGE_TONES.length];
};

/* =========================================================
   COMPOSANT
========================================================= */

const ProductsPage = () => {
  const { lang } = useLanguage(); // langue globale (menu)
const t = I18N[lang];
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [stats, setStats] = useState({ total: 0, low: 0, out: 0, value: 0 });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorKey, setErrorKey] = useState('');
  const [formErrorKey, setFormErrorKey] = useState('');
  const [successKey, setSuccessKey] = useState('');

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStock, setFilterStock] = useState('all');

  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showSearchScanner, setShowSearchScanner] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  const cur = t.currency;

  /* ---------- Chargements ---------- */
  const fetchProducts = async () => {
    setLoading(true);
    setErrorKey('');
    try {
      const response = await productsApi.getAll();
      setProducts(getRows(response));
    } catch (err) {
      console.error('Erreur produits :', err);
      setErrorKey('err_load');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await productsApi.getStats();
      const d = response?.data || {};
      setStats({
        total: Number(d.totalProducts ?? d.total ?? 0),
        low: Number(d.lowStock ?? d.low_stock ?? 0),
        out: Number(d.outOfStock ?? d.out_of_stock ?? 0),
        value: Number(d.stockValue ?? d.stock_value ?? 0),
      });
    } catch (err) {
      console.warn('Statistiques indisponibles :', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getAll();
      setCategories(getRows(response).map((c) => c.name).filter(Boolean));
    } catch (err) {
      console.warn('Catégories indisponibles :', err);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await suppliersApi.getAll();
      setSuppliers(getRows(response));
    } catch (err) {
      console.warn('Fournisseurs indisponibles :', err);
    }
  };

  const refreshData = () => Promise.all([fetchProducts(), fetchStats()]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchProducts();
    fetchStats();
    fetchCategories();
    fetchSuppliers();
  }, []);

  useEffect(() => {
    if (!successKey) return undefined;
    const timer = setTimeout(() => setSuccessKey(''), 3500);
    return () => clearTimeout(timer);
  }, [successKey]);

  const closeModals = () => {
    setShowForm(false);
    setShowDeleteModal(false);
    setFormErrorKey('');
    setSelectedProduct(null);
    setProductToDelete(null);
    setFormData(emptyForm());
  };

  useEffect(() => {
    if (!showForm && !showDeleteModal) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closeModals();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showForm, showDeleteModal]);

  /* ---------- Actions ---------- */
  const handleOpenCreate = () => {
    setSelectedProduct(null);
    setFormData(emptyForm());
    setFormErrorKey('');
    setShowForm(true);
  };

  const handleOpenEdit = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name || '',
      category: getCategoryName(product),
      barcode: product.barcode || '',
      status: product.status || 'neuf',
      purchase_price: product.purchase_price ?? '',
      sale_price: product.sale_price ?? '',
      quantity: product.quantity ?? '',
      min_quantity: product.min_quantity ?? 5,
      supplier_id: product.supplier_id ?? '',
    });
    setFormErrorKey('');
    setShowForm(true);
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setFormErrorKey('');
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormErrorKey('');
    try {
      const payload = {
        ...formData,
        purchase_price: Number(formData.purchase_price),
        sale_price: Number(formData.sale_price),
        quantity: Number.parseInt(formData.quantity, 10),
        min_quantity: Number.parseInt(formData.min_quantity, 10) || 0,
        supplier_id: formData.supplier_id || null,
      };
      if (selectedProduct) await productsApi.update(selectedProduct.id, payload);
      else await productsApi.create(payload);

      closeModals();
      setSuccessKey('ok_save');
      await refreshData();
    } catch (err) {
      console.error('Erreur sauvegarde :', err);
      setFormErrorKey('err_save');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete || deleting) return;
    setDeleting(true);
    try {
      await productsApi.delete(productToDelete.id);
      closeModals();
      setSuccessKey('ok_delete');
      await refreshData();
    } catch (err) {
      console.error('Erreur suppression :', err);
      setFormErrorKey('err_delete');
    } finally {
      setDeleting(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setFilterCategory('all');
    setFilterStatus('all');
    setFilterStock('all');
    setSortBy('name');
    setSortDir('asc');
  };

  const handleSort = (field) => {
    if (sortBy === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const sortIcon = (field) => {
    if (sortBy !== field) return 'fa-sort';
    return sortDir === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  };

  /* ---------- Filtrage / tri ---------- */
  const filteredProducts = useMemo(() => {
    const q = debouncedSearch.toLocaleLowerCase('fr');
    return products
      .filter((product) => {
        const name = String(product.name || '').toLocaleLowerCase('fr');
        const barcode = String(product.barcode || '').toLocaleLowerCase('fr');
        const category = getCategoryName(product);

        const matchSearch = !q || name.includes(q) || barcode.includes(q);
        const matchCategory = filterCategory === 'all' || category === filterCategory;
        const matchStatus = filterStatus === 'all' || product.status === filterStatus;

        const qty = Number(product.quantity) || 0;
        const min = Number(product.min_quantity) || 0;
        let matchStock = true;
        if (filterStock === 'out') matchStock = qty <= 0;
        if (filterStock === 'low') matchStock = qty > 0 && qty <= min;
        if (filterStock === 'available') matchStock = qty > min;

        return matchSearch && matchCategory && matchStatus && matchStock;
      })
      .sort((a, b) => {
        let x;
        let y;
        if (sortBy === 'name') {
          x = String(a.name || '').toLocaleLowerCase('fr');
          y = String(b.name || '').toLocaleLowerCase('fr');
        } else {
          x = Number(a[sortBy]) || 0;
          y = Number(b[sortBy]) || 0;
        }
        let cmp = 0;
        if (x < y) cmp = -1;
        if (x > y) cmp = 1;
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [products, debouncedSearch, filterCategory, filterStatus, filterStock, sortBy, sortDir]);

  const calculatedPrices = useMemo(() => {
    const quantity = Number(formData.quantity) || 0;
    const purchase = Number(formData.purchase_price) || 0;
    const sale = Number(formData.sale_price) || 0;
    return {
      totalPurchase: quantity * purchase,
      totalSale: quantity * sale,
      margin: quantity * (sale - purchase),
    };
  }, [formData.quantity, formData.purchase_price, formData.sale_price]);

  const hasFilters = Boolean(debouncedSearch || filterCategory !== 'all' || filterStatus !== 'all' || filterStock !== 'all');

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

        /* ---------- En-tête ---------- */
        .ep-hero {
          position: relative; isolation: isolate; overflow: hidden;
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 18px;
          padding: clamp(20px, 3vw, 30px); margin-bottom: 20px; border-radius: 20px; color: #fff;
          background: linear-gradient(125deg, #0f2f66 0%, #1b55c9 58%, #2aa3d9 100%);
          box-shadow: 0 14px 32px rgba(21, 74, 170, .20);
        }
        .ep-hero::after { content: ""; position: absolute; z-index: -1; width: 250px; height: 250px; inset-inline-end: -70px; top: -115px; border: 32px solid rgba(255,255,255,.09); border-radius: 50%; }
        .ep-eyebrow { font-size: 24px; font-weight: 800; letter-spacing: 1.8px; opacity: .78; }
        .ep-title h1 { margin: 6px 0 4px; font-size: clamp(22px, 2.8vw, 30px); font-weight: 800; display: flex; align-items: center; gap: 12px; line-height: 1.25; }
        .ep-title-icon { display: inline-grid; place-items: center; width: 42px; height: 42px; border-radius: 12px; background: rgba(255,255,255,.16); font-size: 24px; }
        .ep-title p { margin: 0; color: rgba(255,255,255,.82); font-size: 21px; }
        .ep-hero-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
        .ep-lang { display: inline-flex; padding: 3px; border-radius: 11px; background: rgba(255,255,255,.16); border: 1px solid rgba(255,255,255,.25); }
        .ep-lang button { border: 0; padding: 7px 12px; border-radius: 8px; background: transparent; color: #fff; font: inherit; font-size: 20px; font-weight: 800; cursor: pointer; }
        .ep-lang button.on { background: #fff; color: #153f92; }
        .ep-btn-add { display: inline-flex; align-items: center; gap: 8px; padding: 11px 18px; border: 0; border-radius: 11px; background: #fff; color: #174078; font: inherit; font-weight: 800; font-size: 18px; cursor: pointer; box-shadow: 0 6px 16px rgba(0,0,0,.14); transition: .18s; }
        .ep-btn-add:hover { transform: translateY(-2px); }
        .ep-btn-ghost { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border: 1px solid rgba(255,255,255,.45); border-radius: 11px; background: rgba(255,255,255,.10); color: #fff; font: inherit; font-size: 12px; font-weight: 800; cursor: pointer; transition: .18s; }
        .ep-btn-ghost:hover { background: rgba(255,255,255,.2); }

        /* ---------- Alerte / succès ---------- */
        .ep-alert { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 18px; padding: 13px 16px; border: 1px solid #f6c8cd; border-radius: 11px; background: var(--red-soft); color: #a3212e; font-size: 13px; }
        .ep-alert button { border: 0; padding: 7px 12px; border-radius: 8px; background: #fff; color: #a3212e; font: inherit; font-size: 12px; font-weight: 800; cursor: pointer; }
        .ep-success { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 18px; padding: 13px 16px; border: 1px solid #bfe8d9; border-radius: 11px; background: var(--green-soft); color: #0b6a4e; font-size: 13px; }
        .ep-success button { border: 0; padding: 7px 12px; border-radius: 8px; background: #fff; color: #0b6a4e; font: inherit; font-size: 12px; font-weight: 800; cursor: pointer; }

        /* ---------- Statistiques ---------- */
        .ep-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-bottom: 20px; }
        .ep-card { position: relative; overflow: hidden; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding: 20px; background: var(--card); border: 1px solid var(--line); border-inline-start: 4px solid var(--accent); border-radius: 16px; box-shadow: 0 4px 14px rgba(20,33,61,.04); transition: transform .2s, box-shadow .2s; }
        .ep-card:hover { transform: translateY(-2px); box-shadow: 0 12px 24px rgba(20,33,61,.08); }
        .ep-card::after { content: ""; position: absolute; inset-inline-end: -30px; bottom: -42px; width: 105px; height: 105px; border-radius: 50%; background: var(--accent-soft); opacity: .7; }
        .ep-card-info { position: relative; z-index: 1; min-width: 0; }
        .ep-card-info h3 { margin: 0 0 9px; font-size: 20px; color: var(--muted); font-weight: 800; }
        .ep-card-info .value { font-size: clamp(20px, 2vw, 26px); font-weight: 800; letter-spacing: -.3px; color: var(--ink); overflow-wrap: anywhere; }
        .ep-card-info .value small { font-size: 12px; color: #8896ab; font-weight: 700; }
        .ep-card-info .sub { margin-top: 5px; font-size: 20px; color: var(--accent); font-weight: 700; }
        .ep-icon { position: relative; z-index: 1; flex: 0 0 44px; width: 44px; height: 44px; border-radius: 13px; display: grid; place-items: center; font-size: 19px; background: var(--accent-soft); color: var(--accent); }
        .tone-blue   { --accent: var(--primary); --accent-soft: var(--primary-soft); }
        .tone-amber  { --accent: var(--amber);  --accent-soft: var(--amber-soft); }
        .tone-violet { --accent: var(--violet); --accent-soft: var(--violet-soft); }
        .tone-green  { --accent: var(--green);  --accent-soft: var(--green-soft); }
        .tone-rose   { --accent: var(--rose);   --accent-soft: var(--rose-soft); }
        .tone-teal   { --accent: var(--teal);   --accent-soft: var(--teal-soft); }

        /* ---------- Panneau & filtres ---------- */
        .ep-panel { background: var(--card); border-radius: 16px; border: 1px solid var(--line); overflow: hidden; box-shadow: 0 4px 14px rgba(20,33,61,.035); }
        .ep-panel-head { padding: 16px 20px; border-bottom: 1px solid var(--line); background: #fbfcff; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px; }
        .ep-panel-head h5 { margin: 0 0 4px; font-size: 21px; font-weight: 800; color: var(--ink); }
        .ep-panel-head p { margin: 0; font-size: 20px; color: var(--muted); }
        .ep-panel-head .badge-count { background: var(--primary-soft); color: var(--primary); font-weight: 800; padding: 7px 12px; border-radius: 999px; font-size: 20px; }
        .ep-filters { display: grid; grid-template-columns: 1.6fr 1fr 1fr 1fr 1fr auto; gap: 10px; align-items: end; padding: 15px 20px; background: #fbfcff; border-bottom: 1px solid var(--line); }
        .ep-fg { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
        .ep-fg label { font-size: 19px; font-weight: 800; color: #4b5b75; text-transform: uppercase; letter-spacing: .4px; }
        .ep-filter-input { width: 100%; height: 40px; border: 1px solid #d9e1ed; border-radius: 9px; padding: 0 12px; font: inherit; font-size: 18px; color: #2a3a55; background: #fff; outline: none; }
        .ep-filter-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); }
        .ep-search-input-group { display: flex; }
        .ep-search-input-group .ep-filter-input { border-start-end-radius: 0; border-end-end-radius: 0; border-inline-end: 0; }
        .ep-search-btn { height: 40px; padding: 0 12px; border: 1px solid #d9e1ed; border-start-start-radius: 0; border-end-start-radius: 0; border-start-end-radius: 9px; border-end-end-radius: 9px; background: var(--primary-soft); color: var(--primary); cursor: pointer; font-size: 13px; }
        .ep-search-btn:hover { background: var(--primary); color: #fff; }
        .ep-reset { height: 40px; padding: 0 13px; border: 1px solid var(--line); border-radius: 9px; background: #fff; color: #4b5b75; font: inherit; font-size: 18px; font-weight: 800; cursor: pointer; white-space: nowrap; }
        .ep-reset:hover { background: #f1f5fb; }

        /* ---------- Tableau ---------- */
        .ep-table-wrap { overflow-x: auto; }
        .ep-table { width: 100%; min-width: 1100px; border-collapse: collapse; }
        .ep-table th { background: #f3f6fc; color: #5b6b85; text-align: start; padding: 14px 16px; font-size: 19px; font-weight: 800; letter-spacing: .4px; border-bottom: 1px solid var(--line); white-space: nowrap; }
        .ep-table th .sort-btn { background: none; border: 0; padding: 0; font: inherit; font-size: 19px; font-weight: 800; color: inherit; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; letter-spacing: .4px; text-transform: uppercase; }
        .ep-table th .sort-btn i { font-size: 18px; opacity: .6; }
        .ep-table th .sort-btn i.on { opacity: 1; color: var(--primary); }
        .ep-table td { padding: 13px 16px; border-bottom: 1px solid #f0f3f8; font-size: 20px; color: #44546d; vertical-align: middle; }
        .ep-table tbody tr:nth-child(even) td { background: #fafbfe; }
        .ep-table tbody tr:hover td { background: #eff4ff; }
        .ep-table tr:last-child td { border-bottom: 0; }
        .ep-col-end { text-align: end !important; }
        .ep-col-center { text-align: center !important; }
        .ep-state { padding: 38px 18px !important; text-align: center; color: #8896ab !important; }
        .ep-spinner { display: inline-block; width: 22px; height: 22px; margin-inline-end: 10px; vertical-align: middle; border: 3px solid #dbeafe; border-top-color: var(--primary); border-radius: 50%; animation: ep-spin .75s linear infinite; }
        @keyframes ep-spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .ep-spinner { animation-duration: 2s; } .ep-card, .ep-btn-add { transition: none; } }

        .ep-prod-cell { display: flex; align-items: center; gap: 10px; }
        .ep-prod-avatar { flex: 0 0 38px; width: 38px; height: 38px; border-radius: 11px; display: grid; place-items: center; background: var(--primary-soft); color: var(--primary); font-size: 15px; }
        .ep-prod-name { font-weight: 700; color: #2a3a55; }
        .ep-prod-meta { font-size: 19px; color: var(--muted); margin-top: 2px; }

        .ep-badge { display: inline-block; padding: 5px 11px; border-radius: 999px; font-size: 20px; font-weight: 800; white-space: nowrap; }
        .badge-blue   { background: var(--primary-soft); color: #164aba; }
        .badge-violet { background: var(--violet-soft);  color: #4a32b0; }
        .badge-green  { background: var(--green-soft);   color: #0b6a4e; }
        .badge-amber  { background: var(--amber-soft);   color: #94590a; }
        .badge-rose   { background: var(--rose-soft);    color: #9c2a62; }
        .badge-teal   { background: var(--teal-soft);    color: #0a6577; }
        .badge-gray   { background: #eef2f8; color: #4b5b75; }

        .ep-money-purchase { color: #164aba; font-weight: 700; white-space: nowrap; }
        .ep-money-sale     { color: #0b6a4e; font-weight: 700; white-space: nowrap; }

        .ep-actions { display: flex; gap: 6px; justify-content: flex-end; }
        .btn-icon { width: 32px; height: 32px; border-radius: 8px; border: 1px solid transparent; display: grid; place-items: center; cursor: pointer; transition: .18s; background: transparent; color: #64748b; font-size: 12px; }
        .btn-icon:hover { background: #eef2f8; }
        .btn-edit { background: var(--primary-soft); color: var(--primary); border-color: #c9daff; }
        .btn-edit:hover { background: var(--primary); color: #fff; }
        .btn-delete { background: var(--red-soft); color: var(--red); border-color: #f6c8cd; }
        .btn-delete:hover { background: var(--red); color: #fff; }

        /* ---------- Modales ---------- */
        .ep-modal-overlay { position: fixed; inset: 0; z-index: 1050; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(15,23,42,.58); backdrop-filter: blur(4px); }
        .ep-modal { width: 100%; max-width: 760px; max-height: calc(100vh - 40px); overflow: auto; background: #fff; border-radius: 18px; box-shadow: 0 25px 50px rgba(0,0,0,.22); }
        .ep-modal.small { max-width: 420px; }
        .ep-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 22px; border-bottom: 1px solid var(--line); background: linear-gradient(180deg, #fbfcff, #fff); }
        .ep-modal-header h3 { margin: 0; font-size: 17px; font-weight: 800; display: flex; align-items: center; gap: 10px; }
        .ep-modal-header .ep-modal-icon { display: inline-grid; place-items: center; width: 34px; height: 34px; border-radius: 10px; background: var(--primary-soft); color: var(--primary); font-size: 14px; }
        .ep-modal-body { padding: 22px; }
        .ep-modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 15px 22px; background: #f7f9fd; border-top: 1px solid var(--line); }
        .ep-modal-footer.center { justify-content: center; }
        .ep-form-group { margin-bottom: 15px; }
        .ep-form-group label { display: block; margin-bottom: 6px; font-size: 20px; font-weight: 800; color: #4b5b75; }
        .ep-form-group input, .ep-form-group select, .ep-form-group textarea { width: 100%; border: 1px solid #d9e1ed; border-radius: 9px; padding: 10px 12px; font: inherit; font-size: 14px; color: #2a3a55; background: #fbfcfe; outline: none; }
        .ep-form-group input:focus, .ep-form-group select:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); background: #fff; }
        .ep-form-hint { display: block; margin-top: 4px; font-size: 19px; color: #8896ab; }
        .ep-form-error { margin-bottom: 14px; padding: 11px 14px; border-radius: 9px; background: var(--red-soft); color: #a3212e; font-size: 13px; font-weight: 600; }
        .ep-grid3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
        .ep-grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        @media (max-width: 720px) { .ep-grid3, .ep-grid2 { grid-template-columns: 1fr; } }

        .ep-barcode-group { display: flex; }
        .ep-barcode-group input { border-start-end-radius: 0; border-end-end-radius: 0; }
        .ep-barcode-btn { padding: 0 12px; border: 1px solid #d9e1ed; border-inline-start: 0; border-start-end-radius: 9px; border-end-end-radius: 9px; background: var(--primary-soft); color: var(--primary); cursor: pointer; font-size: 13px; }
        .ep-barcode-btn:hover { background: var(--primary); color: #fff; }

        .ep-summary { margin-top: 16px; padding: 16px; border-radius: 13px; background: linear-gradient(120deg, #f2f7ff, #f8fbff); border: 1px solid #e0ebff; }
        .ep-summary h6 { margin: 0 0 12px; font-size: 21px; font-weight: 800; color: #2a3a55; }
        .ep-summary .ep-summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        @media (max-width: 560px) { .ep-summary .ep-summary-grid { grid-template-columns: 1fr; } }
        .ep-summary .lbl { font-size: 19px; color: var(--muted); margin-bottom: 3px; }
        .ep-summary .val { font-weight: 800; font-size: 23px; }
        .ep-summary .val.buy { color: #164aba; }
        .ep-summary .val.sell { color: #0b6a4e; }
        .ep-summary .val.margin-negative { color: var(--red); }

        .ep-btn { padding: 10px 20px; border-radius: 10px; border: 0; font: inherit; font-size: 20px; font-weight: 800; cursor: pointer; transition: .18s; }
        .ep-btn:hover:not(:disabled) { filter: brightness(.96); transform: translateY(-1px); }
        .ep-btn:disabled { opacity: .6; cursor: not-allowed; }
        .ep-btn-cancel { background: #e6ebf3; color: #44546d; }
        .ep-btn-save { background: linear-gradient(135deg, #1f5eea, #2f7bf0); color: #fff; }
        .ep-btn-danger { background: var(--red); color: #fff; }

        .ep-delete-body { padding: 28px 22px 10px; text-align: center; }
        .ep-delete-icon { display: inline-grid; place-items: center; width: 58px; height: 58px; margin-bottom: 14px; border-radius: 50%; background: var(--red-soft); color: var(--red); font-size: 24px; }
        .ep-delete-body h4 { margin: 0 0 6px; font-size: 25px; font-weight: 800; }
        .ep-delete-body p { margin: 0 0 10px; color: var(--muted); font-size: 20px; }
        .ep-delete-name { background: #f7f9fd; border-radius: 9px; padding: 10px 14px; font-weight: 800; margin: 10px 0; }

        @media (max-width: 1100px) { .ep-filters { grid-template-columns: 1fr 1fr 1fr; } .ep-filters .ep-fg-search { grid-column: 1 / -1; } }
        @media (max-width: 900px) { .ep-stats { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 700px) { .ep-filters { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 560px) {
          .expenses-page { padding: 12px; }
          .ep-filters { grid-template-columns: 1fr; padding: 14px; }
          .ep-hero-actions { width: 100%; } .ep-btn-add, .ep-btn-ghost { flex: 1; justify-content: center; }
          .ep-table th, .ep-table td { padding: 11px 12px; }
          .ep-stats { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* En-tête */}
      <header className="ep-hero">
        <div className="ep-title">
          <span className="ep-eyebrow">GESTISTOCK / INVENTAIRE</span>
          <h1>
            <span className="ep-title-icon"><i className="fas fa-boxes-stacked" /></span>
            {t.title}
          </h1>
          <p>{t.subtitle}</p>
        </div>

        <div className="ep-hero-actions">
          
          <button type="button" className="ep-btn-ghost" onClick={refreshData} disabled={loading}>
            <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`} /> {t.refresh}
          </button>
          <button type="button" className="ep-btn-add" onClick={handleOpenCreate}>
            <i className="fas fa-plus" /> {t.add}
          </button>
        </div>
      </header>

      {errorKey && (
        <div className="ep-alert" role="alert">
          <span><i className="fas fa-exclamation-circle" /> &nbsp;{t[errorKey]}</span>
          <button type="button" onClick={refreshData}>{t.retry}</button>
        </div>
      )}
      {successKey && (
        <div className="ep-success" role="status">
          <span><i className="fas fa-check-circle" /> &nbsp;{t[successKey]}</span>
          <button type="button" onClick={() => setSuccessKey('')}>×</button>
        </div>
      )}

      {/* Statistiques */}
      <section className="ep-stats">
        <div className="ep-card tone-blue">
          <div className="ep-card-info">
            <h3>{t.stat_total}</h3>
            <div className="value">{formatNumber(stats.total)}</div>
            <div className="sub">{t.stat_total_sub}</div>
          </div>
          <div className="ep-icon"><i className="fas fa-boxes-stacked" /></div>
        </div>
        <div className="ep-card tone-amber">
          <div className="ep-card-info">
            <h3>{t.stat_low}</h3>
            <div className="value">{formatNumber(stats.low)}</div>
            <div className="sub">{t.stat_low_sub}</div>
          </div>
          <div className="ep-icon"><i className="fas fa-triangle-exclamation" /></div>
        </div>
        <div className="ep-card tone-rose">
          <div className="ep-card-info">
            <h3>{t.stat_out}</h3>
            <div className="value">{formatNumber(stats.out)}</div>
            <div className="sub">{t.stat_out_sub}</div>
          </div>
          <div className="ep-icon"><i className="fas fa-circle-xmark" /></div>
        </div>
        <div className="ep-card tone-green">
          <div className="ep-card-info">
            <h3>{t.stat_value}</h3>
            <div className="value"><bdi className="ep-amt">{formatNumber(stats.value)}</bdi> <small>{cur}</small></div>
            <div className="sub">{t.stat_value_sub}</div>
          </div>
          <div className="ep-icon"><i className="fas fa-coins" /></div>
        </div>
      </section>

      {/* Filtres */}
      <div className="ep-panel" style={{ marginBottom: 20 }}>
        <div className="ep-panel-head">
          <div>
            <h5><i className="fas fa-sliders" style={{ color: 'var(--primary)', marginInlineEnd: 8 }} />{t.filters_title}</h5>
            <p>{t.filters_sub}</p>
          </div>
          <button type="button" className="ep-reset" onClick={handleResetFilters}>
            <i className="fas fa-rotate-left" /> {t.reset}
          </button>
        </div>
        <div className="ep-filters">
          <div className="ep-fg ep-fg-search">
            <label htmlFor="pp-search">{t.th_product}</label>
            <div className="ep-search-input-group">
              <input
                id="pp-search"
                type="search"
                className="ep-filter-input"
                placeholder={t.search_ph}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                type="button"
                className="ep-search-btn"
                title={t.scan}
                aria-label={t.scan}
                onClick={() => setShowSearchScanner(true)}
              >
                <i className="fas fa-barcode" />
              </button>
            </div>
          </div>

          <div className="ep-fg">
            <label htmlFor="pp-cat">{t.category}</label>
            <select id="pp-cat" className="ep-filter-input" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="all">{t.all_categories}</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="ep-fg">
            <label htmlFor="pp-status">{t.status}</label>
            <select id="pp-status" className="ep-filter-input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">{t.all_status}</option>
              <option value="neuf">{t.neuf}</option>
              <option value="occasion">{t.occasion}</option>
            </select>
          </div>

          <div className="ep-fg">
            <label htmlFor="pp-stock">{t.stock_level}</label>
            <select id="pp-stock" className="ep-filter-input" value={filterStock} onChange={(e) => setFilterStock(e.target.value)}>
              <option value="all">{t.all_stock}</option>
              <option value="available">{t.available}</option>
              <option value="low">{t.low}</option>
              <option value="out">{t.out}</option>
            </select>
          </div>

          <div className="ep-fg">
            <label>{t.results}</label>
            <div style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-soft)', color: 'var(--primary)', fontWeight: 800, borderRadius: 9, fontSize: 13 }}>
              {t.results_count(filteredProducts.length)}
            </div>
          </div>

          <div>{hasFilters && <span style={{ display: 'inline-block', width: 1 }} />}</div>
        </div>
      </div>

      {/* Tableau */}
      <div className="ep-panel">
        <div className="ep-panel-head">
          <div>
            <h5>{t.inventory}</h5>
            <p>{t.inventory_sub}</p>
          </div>
          <span className="badge-count">
            {t.results_count(filteredProducts.length)}
          </span>
        </div>

        <div className="ep-table-wrap">
          <table className="ep-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>
                  <button className="sort-btn" type="button" onClick={() => handleSort('name')}>
                    {t.th_product} <i className={`fas ${sortIcon('name')} ${sortBy === 'name' ? 'on' : ''}`} />
                  </button>
                </th>
                <th>{t.th_category}</th>
                <th>{t.th_status}</th>
                <th className="ep-col-end">
                  <button className="sort-btn" type="button" onClick={() => handleSort('purchase_price')}>
                    {t.th_purchase} <i className={`fas ${sortIcon('purchase_price')} ${sortBy === 'purchase_price' ? 'on' : ''}`} />
                  </button>
                </th>
                <th className="ep-col-end">
                  <button className="sort-btn" type="button" onClick={() => handleSort('sale_price')}>
                    {t.th_sale} <i className={`fas ${sortIcon('sale_price')} ${sortBy === 'sale_price' ? 'on' : ''}`} />
                  </button>
                </th>
                <th className="ep-col-center">
                  <button className="sort-btn" type="button" onClick={() => handleSort('quantity')}>
                    {t.th_qty} <i className={`fas ${sortIcon('quantity')} ${sortBy === 'quantity' ? 'on' : ''}`} />
                  </button>
                </th>
                <th className="ep-col-end">{t.th_total_purchase}</th>
                <th className="ep-col-end">{t.th_total_sale}</th>
                <th>{t.th_stock}</th>
                <th className="ep-col-center">{t.th_actions}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="11" className="ep-state"><span className="ep-spinner" />{t.loading}</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="11" className="ep-state">
                    <div className="ep-prod-avatar" style={{ width: 56, height: 56, fontSize: 26, margin: '0 auto 12px' }}>
                      <i className="fas fa-box-open" />
                    </div>
                    <div style={{ fontWeight: 800, color: '#2a3a55', fontSize: 20 }}>{t.none_title}</div>
                    <div style={{ marginTop: 4, fontSize: 18 }}>{t.none_sub}</div>
                    <button type="button" className="ep-btn ep-btn-save" style={{ marginTop: 14 }} onClick={handleOpenCreate}>
                      <i className="fas fa-plus" style={{ marginInlineEnd: 6 }} />{t.none_add}
                    </button>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product, index) => {
                  const qty = Number(product.quantity) || 0;
                  const purchase = Number(product.purchase_price) || 0;
                  const sale = Number(product.sale_price) || 0;
                  const stock = getStockStatus(qty, product.min_quantity);
                  const category = getCategoryName(product) || t.no_category;

                  return (
                    <tr key={product.id}>
                      <td style={{ color: '#8896ab' }}>{index + 1}</td>
                      <td>
                        <div className="ep-prod-cell">
                          <div className="ep-prod-avatar"><i className="fas fa-box" /></div>
                          <div>
                            <div className="ep-prod-name">{product.name}</div>
                            <div className="ep-prod-meta">
                              <i className="fas fa-barcode" style={{ marginInlineEnd: 4 }} />
                              {product.barcode || t.no_barcode}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`ep-badge badge-${toneFor(category)}`}>{category}</span>
                      </td>
                      <td>
                        <span className={`ep-badge ${product.status === 'neuf' ? 'badge-blue' : 'badge-amber'}`}>
                          {product.status === 'neuf' ? t.neuf : product.status === 'occasion' ? t.occasion : t.not_defined}
                        </span>
                      </td>
                      <td className="ep-col-end ep-money-purchase">{formatMoney(purchase, cur)}</td>
                      <td className="ep-col-end ep-money-sale">{formatMoney(sale, cur)}</td>
                      <td className="ep-col-center">
                        <span className={`ep-badge badge-${stock.tone}`}>{formatNumber(qty)}</span>
                      </td>
                      <td className="ep-col-end ep-money-purchase">{formatMoney(qty * purchase, cur)}</td>
                      <td className="ep-col-end ep-money-sale">{formatMoney(qty * sale, cur)}</td>
                      <td>
                        <span className={`ep-badge badge-${stock.tone}`}>
                          <i className={`fas fa-${stock.key === 'out' ? 'circle-xmark' : stock.key === 'low' ? 'triangle-exclamation' : 'circle-check'}`} style={{ marginInlineEnd: 5 }} />
                          {t[stock.key]}
                        </span>
                      </td>
                      <td className="ep-col-center">
                        <div className="ep-actions">
                          <button type="button" className="btn-icon btn-edit" onClick={() => handleOpenEdit(product)} title={t.edit} aria-label={t.edit}>
                            <i className="fas fa-pen" />
                          </button>
                          <button type="button" className="btn-icon btn-delete" onClick={() => handleDeleteClick(product)} title={t.delete} aria-label={t.delete}>
                            <i className="fas fa-trash-alt" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modale création / édition */}
      {showForm && (
        <div className="ep-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && closeModals()}>
          <div className="ep-modal" role="dialog" aria-modal="true" aria-labelledby="pp-form-title">
            <div className="ep-modal-header">
              <h3 id="pp-form-title">
                <span className="ep-modal-icon"><i className={`fas ${selectedProduct ? 'fa-pen-to-square' : 'fa-box'}`} /></span>
                {selectedProduct ? t.modal_edit : t.modal_new}
              </h3>
              <button type="button" className="btn-icon" onClick={closeModals} aria-label={t.close}>
                <i className="fas fa-times" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="ep-modal-body">
                {formErrorKey && <div className="ep-form-error" role="alert">{t[formErrorKey]}</div>}

                <div className="ep-form-group">
                  <label htmlFor="pp-name">{t.f_name} <span style={{ color: 'var(--red)' }}>*</span></label>
                  <input
                    id="pp-name"
                    type="text"
                    name="name"
                    placeholder={t.f_name_ph}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    maxLength={255}
                  />
                </div>

                <div className="ep-grid3">
                  <div className="ep-form-group">
                    <label htmlFor="pp-category">{t.f_category}</label>
                    <select
                      id="pp-category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="">{t.f_category_ph}</option>
                      {formData.category && !categories.includes(formData.category) && (
                        <option value={formData.category}>{formData.category}</option>
                      )}
                      {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="ep-form-group">
                    <label htmlFor="pp-barcode">{t.f_barcode}</label>
                    <div className="ep-barcode-group">
                      <input
                        id="pp-barcode"
                        type="text"
                        placeholder={t.f_barcode_ph}
                        value={formData.barcode}
                        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      />
                      <button type="button" className="ep-barcode-btn" title={t.scan} onClick={() => setShowScanner(true)}>
                        <i className="fas fa-barcode" />
                      </button>
                    </div>
                  </div>

                  <div className="ep-form-group">
                    <label htmlFor="pp-status">{t.f_status}</label>
                    <select
                      id="pp-status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="neuf">{t.neuf}</option>
                      <option value="occasion">{t.occasion}</option>
                    </select>
                  </div>

                  <div className="ep-form-group">
                    <label htmlFor="pp-purchase">{t.f_purchase} <span style={{ color: 'var(--red)' }}>*</span></label>
                    <input
                      id="pp-purchase"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.purchase_price}
                      onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                      required
                    />
                  </div>

                  <div className="ep-form-group">
                    <label htmlFor="pp-sale">{t.f_sale} <span style={{ color: 'var(--red)' }}>*</span></label>
                    <input
                      id="pp-sale"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.sale_price}
                      onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                      required
                    />
                  </div>

                  <div className="ep-form-group">
                    <label htmlFor="pp-qty">{t.f_quantity} <span style={{ color: 'var(--red)' }}>*</span></label>
                    <input
                      id="pp-qty"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="ep-grid2">
                  <div className="ep-form-group">
                    <label htmlFor="pp-min">{t.f_min}</label>
                    <input
                      id="pp-min"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.min_quantity}
                      onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })}
                    />
                    <span className="ep-form-hint">{t.f_min_hint}</span>
                  </div>

                  <div className="ep-form-group">
                    <label htmlFor="pp-supplier">{t.f_supplier}</label>
                    <select
                      id="pp-supplier"
                      value={formData.supplier_id}
                      onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    >
                      <option value="">{t.no_supplier}</option>
                      {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="ep-summary">
                  <h6><i className="fas fa-calculator" style={{ color: 'var(--primary)', marginInlineEnd: 8 }} />{t.summary}</h6>
                  <div className="ep-summary-grid">
                    <div>
                      <div className="lbl">{t.summary_purchase}</div>
                      <div className="val buy"><bdi className="ep-amt">{formatMoney(calculatedPrices.totalPurchase, cur)}</bdi></div>
                    </div>
                    <div>
                      <div className="lbl">{t.summary_sale}</div>
                      <div className="val sell"><bdi className="ep-amt">{formatMoney(calculatedPrices.totalSale, cur)}</bdi></div>
                    </div>
                    <div>
                      <div className="lbl">{t.summary_margin}</div>
                      <div className={`val ${calculatedPrices.margin < 0 ? 'margin-negative' : ''}`}>
                        <bdi className="ep-amt">{formatMoney(calculatedPrices.margin, cur)}</bdi>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="ep-modal-footer">
                <button type="button" className="ep-btn ep-btn-cancel" onClick={closeModals} disabled={saving}>{t.cancel}</button>
                <button type="submit" className="ep-btn ep-btn-save" disabled={saving}>
                  {saving ? (
                    <><i className="fas fa-spinner fa-spin" style={{ marginInlineEnd: 6 }} />{t.saving}</>
                  ) : (
                    <><i className="fas fa-floppy-disk" style={{ marginInlineEnd: 6 }} />{selectedProduct ? t.save_changes : t.create}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale suppression */}
      {showDeleteModal && productToDelete && (
        <div className="ep-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && closeModals()}>
          <div className="ep-modal small" role="alertdialog" aria-modal="true" aria-labelledby="pp-delete-title">
            <div className="ep-delete-body">
              <span className="ep-delete-icon"><i className="fas fa-trash-alt" /></span>
              <h4 id="pp-delete-title">{t.delete_title}</h4>
              <p>{t.delete_sub}</p>
              <div className="ep-delete-name">{productToDelete.name}</div>
              <p style={{ fontSize: 16 }}>{t.delete_warn}</p>
              {formErrorKey && <div className="ep-form-error" role="alert">{t[formErrorKey]}</div>}
            </div>
            <div className="ep-modal-footer center">
              <button type="button" className="ep-btn ep-btn-cancel" onClick={closeModals} disabled={deleting}>{t.cancel}</button>
              <button type="button" className="ep-btn ep-btn-danger" onClick={handleDeleteConfirm} disabled={deleting}>
                {deleting ? <><i className="fas fa-spinner fa-spin" style={{ marginInlineEnd: 6 }} />{t.deleting}</> : <><i className="fas fa-trash-alt" style={{ marginInlineEnd: 6 }} />{t.delete_confirm}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scanner code-barres — formulaire */}
      {showScanner && (
        <BarcodeScanner
          onScan={(code) => {
            setFormData((prev) => ({ ...prev, barcode: code }));
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Scanner code-barres — recherche */}
      {showSearchScanner && (
        <BarcodeScanner
          onScan={(code) => {
            setSearch(code);
            setDebouncedSearch(code);
            setShowSearchScanner(false);
          }}
          onClose={() => setShowSearchScanner(false)}
        />
      )}
    </div>
  );
};

export default ProductsPage;