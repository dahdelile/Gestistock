// src/views/Products/ProductList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Table, Button, Card, Spinner, Badge, Form, Modal,
  Alert, Row, Col, InputGroup
} from 'react-bootstrap';
import { useLanguage } from '../../context/LanguageContext';
import { productsApi, categoriesApi, suppliersApi, salesApi } from '../../api';

/* =========================================================
   TRADUCTIONS / الترجمة
========================================================= */
const I18N = {
  fr: {
    dir: 'ltr', locale: 'fr-FR', currency: 'UM',
    title: 'Gestion des produits', subtitle: 'Gérez vos articles, vos prix et vos niveaux de stock.',
    add: 'Nouveau produit', refresh: 'Actualiser',
    stat_total: 'Total produits', stat_total_sub: 'Références enregistrées',
    stat_low: 'Stock bas', stat_low_sub: 'À réapprovisionner',
    stat_out: 'Rupture', stat_out_sub: 'Produits indisponibles',
    stat_value: 'Valeur du stock', stat_value_sub: "Prix d'achat × quantité",
    filters_title: 'Recherche et filtres', filters_sub: 'Retrouvez rapidement un produit.',
    reset: 'Réinitialiser', search_ph: 'Nom, référence, code-barres...',
    scan: 'Scanner un code-barres', category: 'Catégorie', all_categories: 'Toutes',
    subcategory: 'Sous-catégorie', all_subcategories: 'Toutes',
    status: 'État', all_status: 'Tous les états', neuf: 'Neuf', occasion: 'Occasion',
    stock_level: 'Niveau de stock', all_stock: 'Tous les stocks',
    available: 'Disponible', low: 'Stock bas', out: 'Rupture',
    results_count: (n) => `${n} produit(s)`,
    inventory: 'Inventaire des produits',
    inventory_sub: 'Ventes réelles de chaque article, calculées depuis les factures.',
    th_product: 'Produit', th_category: 'Catégorie', th_status: 'État',
    th_purchase: 'Achat', th_qty: 'Quantité', th_total_purchase: 'Total achat',
    th_sold_qty: 'Quantité vendue', th_total_sales: 'Total des ventes',
    th_stock: 'Stock', th_actions: 'Actions',
    loading: 'Chargement des produits...', none_title: 'Aucun produit trouvé',
    none_sub: 'Modifiez les filtres ou ajoutez un nouveau produit.', none_add: 'Ajouter un produit',
    no_category: 'Non classé', no_barcode: 'Sans code-barres', not_defined: 'Non défini',
    edit: 'Modifier', delete: 'Supprimer',
    modal_new: 'Nouveau produit', modal_edit: 'Modifier le produit',
    modal_sub: "Complétez les informations de l'article.",
    f_name: 'Nom du produit (via sous-catégorie)', f_name_ph: 'Sélectionnez une sous-catégorie',
    f_category: 'Catégorie', f_category_ph: 'Sélectionner',
    f_subcategory: 'Sous-catégorie', f_subcategory_ph: 'Sélectionner',
    f_barcode: 'Code-barres', f_barcode_ph: 'Référence', f_status: 'État du produit',
    f_purchase: "Prix d'achat (UM)", f_sale: 'Prix de vente par défaut (UM)',
    f_sale_hint: 'Conservé en base pour la vente, non affiché dans le tableau.',
    f_quantity: 'Quantité', f_min: 'Stock minimum', f_min_hint: "Seuil d'alerte.",
    f_supplier: 'Fournisseur', no_supplier: 'Aucun fournisseur',
    summary: 'Aperçu', summary_purchase: "Valeur d'achat (stock)",
    summary_sold_qty: 'Quantité vendue (réelle)', summary_total_sales: 'Total des ventes (réel)',
    cancel: 'Annuler', save: 'Enregistrer', save_changes: 'Enregistrer les modifications',
    create: 'Créer le produit', saving: 'Enregistrement...',
    delete_title: 'Supprimer ce produit ?', delete_sub: 'Vous êtes sur le point de supprimer :',
    delete_warn: 'Cette opération peut être irréversible.', delete_confirm: 'Supprimer', deleting: 'Suppression...',
    err_load: 'Impossible de charger les produits.', err_save: 'Échec de la sauvegarde.',
    err_delete: 'Impossible de supprimer ce produit.', ok_save: 'Produit enregistré avec succès.',
    ok_delete: 'Produit supprimé avec succès.', ok_archive: 'Produit archivé avec succès.',
    close: 'Fermer', retry: 'Réessayer',
  },
  ar: {
    dir: 'rtl', locale: 'ar-u-nu-latn', currency: 'أوقية',
    title: 'إدارة المنتجات', subtitle: 'أدر منتجاتك وأسعارها ومستويات مخزونها.',
    add: 'منتج جديد', refresh: 'تحديث',
    stat_total: 'إجمالي المنتجات', stat_total_sub: 'المراجع المسجلة',
    stat_low: 'مخزون منخفض', stat_low_sub: 'بحاجة إلى إعادة تعبئة',
    stat_out: 'نفد المخزون', stat_out_sub: 'منتجات غير متوفرة',
    stat_value: 'قيمة المخزون', stat_value_sub: 'سعر الشراء × الكمية',
    filters_title: 'البحث والتصفية', filters_sub: 'اعثر بسرعة على منتج في مخزونك.',
    reset: 'إعادة تعيين', search_ph: 'الاسم، المرجع، الباركود...',
    scan: 'مسح الباركود', category: 'الفئة', all_categories: 'الكل',
    subcategory: 'الفئة الفرعية', all_subcategories: 'الكل',
    status: 'الحالة', all_status: 'كل الحالات', neuf: 'جديد', occasion: 'مستعمل',
    stock_level: 'مستوى المخزون', all_stock: 'كل المستويات',
    available: 'متوفر', low: 'مخزون منخفض', out: 'نفد',
    results_count: (n) => `${n} منتج`,
    inventory: 'مخزون المنتجات',
    inventory_sub: 'المبيعات الفعلية لكل صنف، محسوبة من فواتير البيع.',
    th_product: 'المنتج', th_category: 'الفئة', th_status: 'الحالة',
    th_purchase: 'الشراء', th_qty: 'الكمية', th_total_purchase: 'إجمالي الشراء',
    th_sold_qty: 'الكمية المباعة', th_total_sales: 'إجمالي المبيعات',
    th_stock: 'المخزون', th_actions: 'إجراءات',
    loading: 'جارٍ تحميل المنتجات...', none_title: 'لا توجد منتجات',
    none_sub: 'عدّل الفلاتر أو أضف منتجًا جديدًا.', none_add: 'إضافة منتج',
    no_category: 'غير مصنف', no_barcode: 'بدون باركود', not_defined: 'غير محدد',
    edit: 'تعديل', delete: 'حذف',
    modal_new: 'منتج جديد', modal_edit: 'تعديل المنتج',
    modal_sub: 'أكمل معلومات الصنف.',
    f_name: 'اسم المنتج (عبر الفئة الفرعية)', f_name_ph: 'اختر فئة فرعية',
    f_category: 'الفئة', f_category_ph: 'اختر',
    f_subcategory: 'الفئة الفرعية', f_subcategory_ph: 'اختر',
    f_barcode: 'الباركود', f_barcode_ph: 'المرجع', f_status: 'حالة المنتج',
    f_purchase: 'سعر الشراء (أوقية)', f_sale: 'سعر البيع الافتراضي (أوقية)',
    f_sale_hint: 'محفوظ في قاعدة البيانات للبيع، ولا يظهر في الجدول.',
    f_quantity: 'الكمية', f_min: 'الحد الأدنى للمخزون', f_min_hint: 'عتبة التنبيه.',
    f_supplier: 'المورد', no_supplier: 'بدون مورد',
    summary: 'نظرة عامة', summary_purchase: 'قيمة الشراء (المخزون)',
    summary_sold_qty: 'الكمية المباعة (فعلية)', summary_total_sales: 'إجمالي المبيعات (فعلي)',
    cancel: 'إلغاء', save: 'حفظ', save_changes: 'حفظ التعديلات',
    create: 'إنشاء المنتج', saving: 'جارٍ الحفظ...',
    delete_title: 'حذف هذا المنتج؟', delete_sub: 'أنت على وشك حذف:',
    delete_warn: 'هذا الإجراء قد يكون غير قابل للتراجع.', delete_confirm: 'حذف', deleting: 'جارٍ الحذف...',
    err_load: 'تعذّر تحميل المنتجات.', err_save: 'فشل الحفظ.',
    err_delete: 'تعذّر حذف هذا المنتج.', ok_save: 'تم حفظ المنتج بنجاح.',
    ok_delete: 'تم حذف المنتج بنجاح.', ok_archive: 'تمت أرشفة المنتج بنجاح.',
    close: 'إغلاق', retry: 'إعادة المحاولة',
  },
};

/* =========================================================
   UTILITAIRES
========================================================= */
const emptyForm = () => ({
  name: '', category: '', subcategory: '', barcode: '', status: 'neuf',
  purchase_price: '', sale_price: '', quantity: '', min_quantity: 5, supplier_id: '',
});

const formatMoney = (value, cur = 'UM') => {
  const n = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(Number(value) || 0);
  return `${n} ${cur}`;
};
const formatNumber = (value) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(Number(value) || 0);
const hasSalePrice = (value) => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));

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

const getSubcategoryName = (product) => {
  if (product.subcategories && typeof product.subcategories === 'object') return product.subcategories.name || '';
  if (product.subcategory && typeof product.subcategory === 'object') return product.subcategory.name || '';
  return typeof product.subcategory === 'string' ? product.subcategory : '';
};

const getStockStatus = (quantity, minimum) => {
  const qty = Number(quantity) || 0;
  const min = Number(minimum) || 0;
  if (qty <= 0) return { key: 'out', tone: 'danger' };
  if (qty <= min) return { key: 'low', tone: 'warning' };
  return { key: 'available', tone: 'success' };
};

const BADGE_TONES = ['primary', 'info', 'success', 'warning', 'danger', 'secondary'];
const toneFor = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return BADGE_TONES[hash % BADGE_TONES.length];
};

const normalizeName = (v) => String(v || '').trim().toLowerCase();

const buildSalesAgg = (sales) => {
  const byId = {};
  const byName = {};
  const addLine = (pid, pname, qty, lineTotal) => {
    if (pid !== null && pid !== undefined && pid !== '') {
      if (!byId[pid]) byId[pid] = { qty: 0, total: 0 };
      byId[pid].qty += qty; byId[pid].total += lineTotal;
    }
    const n = normalizeName(pname);
    if (n) {
      if (!byName[n]) byName[n] = { qty: 0, total: 0 };
      byName[n].qty += qty; byName[n].total += lineTotal;
    }
  };
  (sales || []).forEach((sale) => {
    const st = String(sale?.status || '').toLowerCase();
    if (['cancelled', 'annule', 'annulé', 'annulée', 'draft', 'brouillon'].includes(st)) return;
    const items = sale?.invoice_items || sale?.sale_items || sale?.items || sale?.saleItems;
    if (Array.isArray(items) && items.length > 0) {
      items.forEach((item) => {
        const pid = item.product_id ?? item.productId ?? item.products?.id;
        const pname = item.products?.name ?? item.product_name ?? item.product ?? item.name;
        const qty = Number(item.quantity) || 0;
        const lineTotal = item.total !== null && item.total !== undefined && item.total !== ''
          ? Number(item.total) || 0
          : qty * (Number(item.unit_price ?? item.price ?? item.sale_price) || 0);
        addLine(pid, pname, qty, lineTotal);
      });
      return;
    }
    const qty = Number(sale.quantity) || 0;
    if (qty === 0) return;
    const pid = sale.product_id ?? sale.productId ?? sale.products?.id;
    const pname = sale.products?.name ?? sale.product_name ?? sale.product ?? sale.name;
    const lineTotal = sale.total !== null && sale.total !== undefined && sale.total !== ''
      ? Number(sale.total) || 0
      : qty * (Number(sale.unit_price ?? sale.price) || 0);
    addLine(pid, pname, qty, lineTotal);
  });
  return { byId, byName };
};

const getAggForProduct = (product, salesAgg) => {
  if (!salesAgg) return { qty: 0, total: 0 };
  if (salesAgg.byId?.[product.id]) return salesAgg.byId[product.id];
  return salesAgg.byName?.[normalizeName(product.name)] || { qty: 0, total: 0 };
};

/* =========================================================
   COMPOSANT PRINCIPAL
========================================================= */
const ProductsPage = () => {
  const { lang } = useLanguage();
  const t = I18N[lang] || I18N.fr;
  const cur = t.currency;

  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [categoriesFull, setCategoriesFull] = useState([]);
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
  const [filterSubcategory, setFilterSubcategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStock, setFilterStock] = useState('all');

  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showSearchScanner, setShowSearchScanner] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [formData, setFormData] = useState(emptyForm());

  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  const mainCategories = useMemo(() => categoriesFull.filter((c) => !c.parent_id), [categoriesFull]);
  const categories = useMemo(() => mainCategories.map((c) => c.name), [mainCategories]);

  const getSubcategories = (categoryName) => {
    const main = categoriesFull.find((c) => c.name === categoryName);
    return (main?.sous_categories || []).filter((s) => s.status !== 'inactive').map((s) => s.name);
  };

  const formSubcategories = useMemo(() => getSubcategories(formData.category), [formData.category, mainCategories, categoriesFull]);
  const filterSubcategories = useMemo(() => (filterCategory === 'all' ? [] : getSubcategories(filterCategory)), [filterCategory, mainCategories, categoriesFull]);
  const salesAgg = useMemo(() => buildSalesAgg(sales), [sales]);

  const fetchProducts = async () => {
    setLoading(true); setErrorKey('');
    try {
      const response = await productsApi.getAll();
      setProducts(getRows(response));
    } catch (err) {
      console.error('Erreur produits :', err);
      setErrorKey('err_load');
    } finally { setLoading(false); }
  };

  const fetchSales = async () => {
    try {
      if (!salesApi || typeof salesApi.getAll !== 'function') { setSales([]); return; }
      const response = await salesApi.getAll();
      setSales(getRows(response));
    } catch (err) {
      console.warn('Ventes indisponibles :', err);
      setSales([]);
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
    } catch (err) { console.warn('Statistiques indisponibles :', err); }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getAll();
      setCategoriesFull(getRows(response).filter((c) => c && c.name));
    } catch (err) { console.warn('Catégories indisponibles :', err); }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await suppliersApi.getAll();
      setSuppliers(getRows(response));
    } catch (err) { console.warn('Fournisseurs indisponibles :', err); }
  };

  const refreshData = () => Promise.all([fetchProducts(), fetchSales(), fetchStats()]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchProducts(); fetchSales(); fetchStats(); fetchCategories(); fetchSuppliers();
  }, []);

  useEffect(() => {
    if (!successKey) return undefined;
    const timer = setTimeout(() => setSuccessKey(''), 3500);
    return () => clearTimeout(timer);
  }, [successKey]);

  const closeModals = () => {
    setShowForm(false); setShowDeleteModal(false);
    setFormErrorKey(''); setSelectedProduct(null);
    setProductToDelete(null); setFormData(emptyForm());
  };

  useEffect(() => {
    if (!showForm && !showDeleteModal) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') closeModals(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showForm, showDeleteModal]);

  const handleOpenCreate = () => {
    setSelectedProduct(null); setFormData(emptyForm());
    setFormErrorKey(''); setShowForm(true);
  };

  const handleOpenEdit = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name || '', category: getCategoryName(product),
      subcategory: getSubcategoryName(product), barcode: product.barcode || '',
      status: product.status || 'neuf', purchase_price: product.purchase_price ?? '',
      sale_price: hasSalePrice(product.sale_price) ? String(product.sale_price) : '',
      quantity: product.quantity ?? '', min_quantity: product.min_quantity ?? 5,
      supplier_id: product.supplier_id ?? '',
    });
    setFormErrorKey(''); setShowForm(true);
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product); setFormErrorKey(''); setShowDeleteModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setFormErrorKey('');
    try {
      const productName = formData.subcategory.trim();
      if (!productName) { setFormErrorKey('err_save'); setSaving(false); return; }
      const { subcategory, ...restOfFormData } = formData;
      const payload = {
        ...restOfFormData, name: productName,
        barcode: formData.barcode?.trim() || null,
        purchase_price: Number(formData.purchase_price) || 0,
        sale_price: formData.sale_price === '' || formData.sale_price === null || formData.sale_price === undefined ? null : Number(formData.sale_price),
        quantity: Number.parseInt(formData.quantity, 10) || 0,
        min_quantity: Number.parseInt(formData.min_quantity, 10) || 0,
        supplier_id: formData.supplier_id || null,
      };
      if (selectedProduct) await productsApi.update(selectedProduct.id, payload);
      else await productsApi.create(payload);
      closeModals(); setSuccessKey('ok_save'); await refreshData();
    } catch (err) {
      console.error('Erreur sauvegarde :', err);
      setFormErrorKey('err_save');
    } finally { setSaving(false); }
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete || deleting) return;
    setDeleting(true); setFormErrorKey('');
    try {
      const result = await productsApi.delete(productToDelete.id);
      closeModals();
      setSuccessKey(result.archived ? 'ok_archive' : 'ok_delete');
      await refreshData();
    } catch (err) {
      console.error('Erreur suppression :', err);
      setFormErrorKey('err_delete');
    } finally { setDeleting(false); }
  };

  const handleResetFilters = () => {
    setSearch(''); setDebouncedSearch(''); setFilterCategory('all');
    setFilterSubcategory('all'); setFilterStatus('all'); setFilterStock('all');
    setSortBy('name'); setSortDir('asc');
  };

  const handleSort = (field) => {
    if (sortBy === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortDir('asc'); }
  };

  const sortIcon = (field) => {
    if (sortBy !== field) return 'fa-sort';
    return sortDir === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  };

  const filteredProducts = useMemo(() => {
    const q = debouncedSearch.toLocaleLowerCase('fr');
    return products
      .filter((product) => {
        const name = String(product.name || '').toLocaleLowerCase('fr');
        const barcode = String(product.barcode || '').toLocaleLowerCase('fr');
        const category = getCategoryName(product);
        const subcategory = getSubcategoryName(product);
        const matchSearch = !q || name.includes(q) || barcode.includes(q);
        const matchCategory = filterCategory === 'all' || category === filterCategory;
        const matchSubcategory = filterSubcategory === 'all' || subcategory === filterSubcategory;
        const matchStatus = filterStatus === 'all' || product.status === filterStatus;
        const qty = Number(product.quantity) || 0;
        const min = Number(product.min_quantity) || 0;
        let matchStock = true;
        if (filterStock === 'out') matchStock = qty <= 0;
        if (filterStock === 'low') matchStock = qty > 0 && qty <= min;
        if (filterStock === 'available') matchStock = qty > min;
        return matchSearch && matchCategory && matchSubcategory && matchStatus && matchStock;
      })
      .sort((a, b) => {
        let x, y;
        if (sortBy === 'name') { x = String(a.name || '').toLocaleLowerCase('fr'); y = String(b.name || '').toLocaleLowerCase('fr'); }
        else if (sortBy === 'sold_qty') { x = getAggForProduct(a, salesAgg).qty || 0; y = getAggForProduct(b, salesAgg).qty || 0; }
        else if (sortBy === 'total_sales') { x = getAggForProduct(a, salesAgg).total || 0; y = getAggForProduct(b, salesAgg).total || 0; }
        else { x = Number(a[sortBy]) || 0; y = Number(b[sortBy]) || 0; }
        let cmp = 0;
        if (x < y) cmp = -1;
        if (x > y) cmp = 1;
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [products, debouncedSearch, filterCategory, filterSubcategory, filterStatus, filterStock, sortBy, sortDir, salesAgg]);

  const calculatedPrices = useMemo(() => {
    const quantity = Number(formData.quantity) || 0;
    const purchase = Number(formData.purchase_price) || 0;
    const agg = selectedProduct ? getAggForProduct(selectedProduct, salesAgg) : { qty: 0, total: 0 };
    return { totalPurchase: quantity * purchase, soldQty: agg.qty, totalSales: agg.total };
  }, [formData.quantity, formData.purchase_price, selectedProduct, salesAgg]);

  return (
    <div className="container-fluid py-4 products-compact" dir={t.dir} lang={lang}>
      {/* ====== STATISTIQUES ====== */}
      <Row className="mb-4">
        <Col xs={3} md={3}>
          <Card className="bg-primary text-white shadow-sm">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div><h6 className="mb-0">{t.stat_total}</h6><h2 className="mb-0">{formatNumber(stats.total)}</h2></div>
              <i className="fas fa-boxes-stacked" style={{ fontSize: '2rem', opacity: 0.8 }}></i>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={3} md={3}>
          <Card className="bg-warning text-dark shadow-sm">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div><h6 className="mb-0">{t.stat_low}</h6><h2 className="mb-0">{formatNumber(stats.low)}</h2></div>
              <i className="fas fa-triangle-exclamation" style={{ fontSize: '2rem', opacity: 0.8 }}></i>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={3} md={3}>
          <Card className="bg-danger text-white shadow-sm">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div><h6 className="mb-0">{t.stat_out}</h6><h2 className="mb-0">{formatNumber(stats.out)}</h2></div>
              <i className="fas fa-circle-xmark" style={{ fontSize: '2rem', opacity: 0.8 }}></i>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={3} md={3}>
          <Card className="bg-success text-white shadow-sm">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div><h6 className="mb-0">{t.stat_value}</h6><h2 className="mb-0">{formatNumber(stats.value)} <small>{cur}</small></h2></div>
              <i className="fas fa-coins" style={{ fontSize: '2rem', opacity: 0.8 }}></i>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ====== CARTE PRINCIPALE ====== */}
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h3 className="mb-0 d-flex align-items-center">
              <i className="fas fa-boxes-stacked me-2"></i> {t.title}
            </h3>
            <div className="d-flex align-items-center gap-2">
              <Button variant="light" onClick={refreshData} disabled={loading}>
                <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i> <span className="ms-2">{t.refresh}</span>
              </Button>
              <Button variant="success" onClick={handleOpenCreate}>
                <i className="fas fa-plus me-1"></i> {t.add}
              </Button>
            </div>
          </div>
        </Card.Header>

        <Card.Body>
          {errorKey && (
            <Alert variant="danger" className="mb-3">
              <i className="fas fa-exclamation-circle me-2"></i>{t[errorKey]}
              <Button variant="outline-danger" size="sm" className="ms-2" onClick={refreshData}>{t.retry}</Button>
            </Alert>
          )}
          {successKey && (
            <Alert variant="success" className="mb-3">
              <i className="fas fa-check-circle me-2"></i>{t[successKey]}
              <Button variant="outline-success" size="sm" className="ms-2" onClick={() => setSuccessKey('')}>×</Button>
            </Alert>
          )}

          {/* Filtres */}
          <Row className="mb-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-bold">{t.th_product}</Form.Label>
                <InputGroup>
                  <Form.Control type="search" placeholder={t.search_ph} value={search} onChange={(e) => setSearch(e.target.value)} />
                  <Button variant="outline-secondary" onClick={() => setShowSearchScanner(true)} title={t.scan}>
                    <i className="fas fa-barcode"></i>
                  </Button>
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="fw-bold">{t.category}</Form.Label>
                <Form.Select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setFilterSubcategory('all'); }}>
                  <option value="all">{t.all_categories}</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            {filterSubcategories.length > 0 && (
              <Col md={2}>
                <Form.Group>
                  <Form.Label className="fw-bold">{t.subcategory}</Form.Label>
                  <Form.Select value={filterSubcategory} onChange={(e) => setFilterSubcategory(e.target.value)}>
                    <option value="all">{t.all_subcategories}</option>
                    {filterSubcategories.map((s) => <option key={s} value={s}>{s}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
            )}
            <Col md={2}>
              <Form.Group>
                <Form.Label className="fw-bold">{t.status}</Form.Label>
                <Form.Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="all">{t.all_status}</option>
                  <option value="neuf">{t.neuf}</option>
                  <option value="occasion">{t.occasion}</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="fw-bold">{t.stock_level}</Form.Label>
                <Form.Select value={filterStock} onChange={(e) => setFilterStock(e.target.value)}>
                  <option value="all">{t.all_stock}</option>
                  <option value="available">{t.available}</option>
                  <option value="low">{t.low}</option>
                  <option value="out">{t.out}</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={1} className="d-flex align-items-end">
              <Button variant="outline-secondary" className="w-100" onClick={handleResetFilters} title={t.reset}>
                <i className="fas fa-rotate-left"></i>
              </Button>
            </Col>
          </Row>

          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="text-muted small fw-bold">{t.results_count(filteredProducts.length)}</span>
          </div>

          {/* Tableau */}
          <div className="table-responsive">
            <Table striped bordered hover className="mb-0">
              <thead className="table-dark">
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>
                    <button className="btn btn-link text-white text-decoration-none p-0 fw-bold" onClick={() => handleSort('name')}>
                      {t.th_product} <i className={`fas ${sortIcon('name')} ${sortBy === 'name' ? 'text-info' : ''}`}></i>
                    </button>
                  </th>
                  <th>{t.th_category}</th>
                  <th>{t.th_status}</th>
                  <th className="text-end">
                    <button className="btn btn-link text-white text-decoration-none p-0 fw-bold" onClick={() => handleSort('purchase_price')}>
                      {t.th_purchase} <i className={`fas ${sortIcon('purchase_price')} ${sortBy === 'purchase_price' ? 'text-info' : ''}`}></i>
                    </button>
                  </th>
                  <th className="text-center">
                    <button className="btn btn-link text-white text-decoration-none p-0 fw-bold" onClick={() => handleSort('quantity')}>
                      {t.th_qty} <i className={`fas ${sortIcon('quantity')} ${sortBy === 'quantity' ? 'text-info' : ''}`}></i>
                    </button>
                  </th>
                  <th className="text-end">{t.th_total_purchase}</th>
                  <th className="text-center">
                    <button className="btn btn-link text-white text-decoration-none p-0 fw-bold" onClick={() => handleSort('sold_qty')}>
                      {t.th_sold_qty} <i className={`fas ${sortIcon('sold_qty')} ${sortBy === 'sold_qty' ? 'text-info' : ''}`}></i>
                    </button>
                  </th>
                  <th className="text-end">
                    <button className="btn btn-link text-white text-decoration-none p-0 fw-bold" onClick={() => handleSort('total_sales')}>
                      {t.th_total_sales} <i className={`fas ${sortIcon('total_sales')} ${sortBy === 'total_sales' ? 'text-info' : ''}`}></i>
                    </button>
                  </th>
                  <th>{t.th_stock}</th>
                  <th className="text-center">{t.th_actions}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="11" className="text-center py-5"><Spinner animation="border" variant="primary" /> <p className="mt-2">{t.loading}</p></td></tr>
                ) : filteredProducts.length === 0 ? (
                  <tr><td colSpan="11" className="text-center py-5 text-muted">
                    <i className="fas fa-box-open fa-3x mb-3"></i>
                    <h5>{t.none_title}</h5>
                    <p>{t.none_sub}</p>
                    <Button variant="primary" onClick={handleOpenCreate}><i className="fas fa-plus me-2"></i>{t.none_add}</Button>
                  </td></tr>
                ) : (
                  filteredProducts.map((product, index) => {
                    const qty = Number(product.quantity) || 0;
                    const purchase = Number(product.purchase_price) || 0;
                    const agg = getAggForProduct(product, salesAgg);
                    const stock = getStockStatus(qty, product.min_quantity);
                    const category = getCategoryName(product) || t.no_category;
                    const subcategory = getSubcategoryName(product);
                    return (
                      <tr key={product.id}>
                        <td className="text-muted">{index + 1}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="bg-primary bg-opacity-10 text-primary rounded d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
                              <i className="fas fa-box"></i>
                            </div>
                            <div>
                              <div className="fw-bold">{product.name}</div>
                              <small className="text-muted"><i className="fas fa-barcode me-1"></i>{product.barcode || t.no_barcode}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <Badge bg={toneFor(category)}>{category}</Badge>
                          {subcategory && <div><small className="text-muted"><i className="fas fa-turn-up fa-rotate-90 me-1"></i>{subcategory}</small></div>}
                        </td>
                        <td>
                          <Badge bg={product.status === 'neuf' ? 'primary' : 'warning'}>
                            {product.status === 'neuf' ? t.neuf : product.status === 'occasion' ? t.occasion : t.not_defined}
                          </Badge>
                        </td>
                        <td className="text-end fw-bold text-primary">{formatMoney(purchase, cur)}</td>
                        <td className="text-center"><Badge bg={stock.tone === 'danger' ? 'danger' : stock.tone === 'warning' ? 'warning' : 'success'}>{formatNumber(qty)}</Badge></td>
                        <td className="text-end fw-bold text-primary">{formatMoney(qty * purchase, cur)}</td>
                        <td className="text-center"><Badge bg="secondary">{formatNumber(agg.qty)}</Badge></td>
                        <td className="text-end fw-bold text-success">{formatMoney(agg.total, cur)}</td>
                        <td>
                          <Badge bg={stock.tone === 'danger' ? 'danger' : stock.tone === 'warning' ? 'warning' : 'success'}>
                            <i className={`fas fa-${stock.key === 'out' ? 'circle-xmark' : stock.key === 'low' ? 'triangle-exclamation' : 'circle-check'} me-1`}></i>
                            {t[stock.key]}
                          </Badge>
                        </td>
                        <td className="text-center">
                          <div className="d-flex gap-1 justify-content-center">
                            <Button variant="outline-primary" size="sm" onClick={() => handleOpenEdit(product)} title={t.edit}>
                              <i className="fas fa-pen"></i>
                            </Button>
                            <Button variant="outline-danger" size="sm" onClick={() => handleDeleteClick(product)} title={t.delete}>
                              <i className="fas fa-trash-alt"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* ====== MODAL FORMULAIRE ====== */}
      <Modal show={showForm} onHide={closeModals} size="lg">
        <Modal.Header closeButton>
          <Modal.Title><i className={`fas ${selectedProduct ? 'fa-pen-to-square' : 'fa-box'} me-2`}></i>{selectedProduct ? t.modal_edit : t.modal_new}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formErrorKey && <Alert variant="danger">{t[formErrorKey]}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">{t.f_name}</Form.Label>
                  <Form.Control type="text" value={formData.subcategory} placeholder={t.f_name_ph} readOnly required />
                  <Form.Text className="text-muted">{lang === 'ar' ? 'يتم تحديد اسم المنتج تلقائياً من الفئة الفرعية.' : 'Le nom du produit est défini automatiquement par la sous-catégorie.'}</Form.Text>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">{t.f_category}</Form.Label>
                  <Form.Select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value, subcategory: '', name: '' })}>
                    <option value="">{t.f_category_ph}</option>
                    {formData.category && !categories.includes(formData.category) && <option value={formData.category}>{formData.category}</option>}
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              {formSubcategories.length > 0 && (
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">{t.f_subcategory}</Form.Label>
                    <Form.Select value={formData.subcategory} onChange={(e) => { const value = e.target.value; setFormData({ ...formData, subcategory: value, name: value }); }}>
                      <option value="">{t.f_subcategory_ph}</option>
                      {formData.subcategory && !formSubcategories.includes(formData.subcategory) && <option value={formData.subcategory}>{formData.subcategory}</option>}
                      {formSubcategories.map((s) => <option key={s} value={s}>{s}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">{t.f_barcode}</Form.Label>
                  <InputGroup>
                    <Form.Control type="text" placeholder={t.f_barcode_ph} value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} />
                    <Button variant="outline-secondary" onClick={() => setShowScanner(true)}><i className="fas fa-barcode"></i></Button>
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">{t.f_status}</Form.Label>
                  <Form.Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                    <option value="neuf">{t.neuf}</option>
                    <option value="occasion">{t.occasion}</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">{t.f_purchase} <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="number" min="0" step="0.01" value={formData.purchase_price} onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })} required />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">{t.f_sale}</Form.Label>
                  <Form.Control type="number" min="0" step="0.01" value={formData.sale_price} onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })} placeholder="Ex : 800" />
                  <Form.Text className="text-muted">{t.f_sale_hint}</Form.Text>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">{t.f_quantity} <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="number" min="0" step="1" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} required />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">{t.f_min}</Form.Label>
                  <Form.Control type="number" min="0" step="1" value={formData.min_quantity} onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })} />
                  <Form.Text className="text-muted">{t.f_min_hint}</Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">{t.f_supplier}</Form.Label>
                  <Form.Select value={formData.supplier_id} onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}>
                    <option value="">{t.no_supplier}</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Card className="bg-light border-0 mt-3">
              <Card.Body>
                <h6 className="fw-bold mb-3"><i className="fas fa-calculator text-primary me-2"></i>{t.summary}</h6>
                <Row>
                  <Col md={4}>
                    <div className="text-muted small">{t.summary_purchase}</div>
                    <div className="fw-bold fs-5 text-primary"><bdi>{formatMoney(calculatedPrices.totalPurchase, cur)}</bdi></div>
                  </Col>
                  <Col md={4}>
                    <div className="text-muted small">{t.summary_sold_qty}</div>
                    <div className="fw-bold fs-5"><bdi>{formatNumber(calculatedPrices.soldQty)}</bdi></div>
                  </Col>
                  <Col md={4}>
                    <div className="text-muted small">{t.summary_total_sales}</div>
                    <div className="fw-bold fs-5 text-success"><bdi>{formatMoney(calculatedPrices.totalSales, cur)}</bdi></div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModals} disabled={saving}>{t.cancel}</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <><Spinner size="sm" className="me-2" />{t.saving}</> : <><i className="fas fa-floppy-disk me-2"></i>{selectedProduct ? t.save_changes : t.create}</>}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ====== MODAL SUPPRESSION - CORRIGÉ : div bien fermé ====== */}
      <Modal show={showDeleteModal} onHide={closeModals}>
        <Modal.Header closeButton>
          <Modal.Title><i className="fas fa-trash-alt text-danger me-2"></i>{t.delete_title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {productToDelete && (
            <div>
              <p>{t.delete_sub}</p>
              <div className="p-3 bg-light rounded fw-bold text-center mb-3">{productToDelete.name}</div>
              <p className="text-muted small">{t.delete_warn}</p>
              {formErrorKey && <Alert variant="danger">{t[formErrorKey]}</Alert>}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModals} disabled={deleting}>{t.cancel}</Button>
          <Button variant="danger" onClick={handleDeleteConfirm} disabled={deleting}>
            {deleting ? <><Spinner size="sm" className="me-2" />{t.deleting}</> : <><i className="fas fa-trash-alt me-2"></i>{t.delete_confirm}</>}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ====== STYLE COMPACT ====== */}
      <style>{`
        .products-compact .card.bg-primary h6, .products-compact .card.bg-warning h6,
        .products-compact .card.bg-danger h6, .products-compact .card.bg-success h6 {
          font-size: 0.75rem !important;
        }
        .products-compact .card.bg-primary h2, .products-compact .card.bg-warning h2,
        .products-compact .card.bg-danger h2, .products-compact .card.bg-success h2 {
          font-size: 1.25rem !important;
        }
        .products-compact .card.bg-primary i, .products-compact .card.bg-warning i,
        .products-compact .card.bg-danger i, .products-compact .card.bg-success i {
          font-size: 1.75rem !important;
        }
        .products-compact .card-header h3 { font-size: 1.1rem !important; }
        .products-compact .form-label { font-size: 0.8rem !important; margin-bottom: 0.25rem !important; }
        .products-compact .table th, .products-compact .table td { font-size: 0.85rem !important; padding: 0.5rem 0.75rem !important; }
        .products-compact .btn { font-size: 0.85rem !important; }
        .products-compact .badge { font-size: 0.75rem !important; }
      `}</style>
    </div>
  );
};

export default ProductsPage;