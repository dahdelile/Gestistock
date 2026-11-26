// src/pages/InternalOutputsPage.jsx
// Sorties internes — bilingue FR / AR, avec actions Modifier et Supprimer
import React, { useState, useEffect, useMemo } from 'react';
import { productsApi, internalOutputsApi } from '../api';
import { useLanguage } from '../context/LanguageContext';

const I18N = {
  fr: {
    dir: 'ltr',
    locale: 'fr-FR',
    title: 'Sorties internes',
    subtitle: 'Gérez les besoins internes, la casse et les pertes de stock.',
    add: 'Nouvelle sortie',
    th_date: 'Date',
    th_product: 'Produit',
    th_qty: 'Quantité',
    th_reason: 'Motif',
    th_actions: 'Actions',
    loading: 'Chargement...',
    no_data: 'Aucune sortie interne trouvée.',
    unknown_product: 'Produit',
    edit: 'Modifier',
    delete: 'Supprimer',
    modal_title: 'Déclarer une sortie de stock',
    modal_edit: 'Modifier la sortie',
    f_product: 'Produit',
    f_product_ph: '-- Sélectionner --',
    f_qty: 'Quantité à retirer',
    f_reason: 'Motif de la sortie',
    stock_label: (n) => `Stock : ${n}`,
    available: (n) => `Quantité disponible : ${n}`,
    reasons: {
      internal: 'Besoin interne',
      damage: 'Casse / Perte',
      donation: 'Don / Échantillon',
      other: 'Autre',
    },
    cancel: 'Annuler',
    save: 'Valider la sortie',
    save_edit: 'Enregistrer les modifications',
    saving: 'Enregistrement...',
    delete_title: 'Supprimer cette sortie ?',
    delete_warn: (q) => `Le stock du produit sera augmenté de ${q} unité(s).`,
    delete_confirm: 'Oui, supprimer',
    deleting: 'Suppression...',
    ok_save: 'Sortie enregistrée avec succès.',
    ok_edit: 'Sortie modifiée et stock mis à jour.',
    ok_delete: 'Sortie supprimée et stock restauré.',
    err_load: 'Erreur de chargement des données.',
    err_save: "Erreur lors de l'enregistrement.",
    err_edit: 'Erreur lors de la modification.',
    err_delete: 'Erreur lors de la suppression.',
    err_stock: 'Quantité insuffisante en stock.',
    err_api_missing: "Cette action n'est pas encore disponible dans l'API (internalOutputsApi).",
  },
  ar: {
    dir: 'rtl',
    locale: 'ar-u-nu-latn',
    title: 'المخارج الداخلية',
    subtitle: 'أدر الاحتياجات الداخلية، التلف وفاقد المخزون.',
    add: 'إخراج جديد',
    th_date: 'التاريخ',
    th_product: 'المنتج',
    th_qty: 'الكمية',
    th_reason: 'السبب',
    th_actions: 'إجراءات',
    loading: 'جارٍ التحميل...',
    no_data: 'لا توجد مخارج داخلية.',
    unknown_product: 'منتج',
    edit: 'تعديل',
    delete: 'حذف',
    modal_title: 'تسجيل إخراج من المخزون',
    modal_edit: 'تعديل الإخراج',
    f_product: 'المنتج',
    f_product_ph: '-- اختر --',
    f_qty: 'الكمية المسحوبة',
    f_reason: 'سبب الإخراج',
    stock_label: (n) => `المخزون: ${n}`,
    available: (n) => `الكمية المتاحة: ${n}`,
    reasons: {
      internal: 'احتياج داخلي',
      damage: 'تلف / فقدان',
      donation: 'تبرع / عينة',
      other: 'أخرى',
    },
    cancel: 'إلغاء',
    save: 'تأكيد الإخراج',
    save_edit: 'حفظ التعديلات',
    saving: 'جارٍ الحفظ...',
    delete_title: 'حذف هذا الإخراج؟',
    delete_warn: (q) => `سيتم زيادة مخزون المنتج بمقدار ${q} وحدة.`,
    delete_confirm: 'نعم، احذف',
    deleting: 'جارٍ الحذف...',
    ok_save: 'تم تسجيل الإخراج بنجاح.',
    ok_edit: 'تم تعديل الإخراج وتحديث المخزون.',
    ok_delete: 'تم حذف الإخراج واستعادة المخزون.',
    err_load: 'تعذّر تحميل البيانات.',
    err_save: 'حدث خطأ أثناء الحفظ.',
    err_edit: 'حدث خطأ أثناء التعديل.',
    err_delete: 'حدث خطأ أثناء الحذف.',
    err_stock: 'الكمية غير كافية في المخزون.',
    err_api_missing: 'هذا الإجراء غير متوفر بعد في الواجهة البرمجية (internalOutputsApi).',
  },
};

const getRows = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
};

const formatNumber = (v) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(Number(v) || 0);

const emptyForm = () => ({ product_id: '', quantity: 1, reason: 'internal', notes: '' });

const InternalOutputsPage = () => {
  const { lang } = useLanguage();
  const t = I18N[lang];

  const [outputs, setOutputs] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // { key, type }

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // sortie en cours de modification
  const [toDelete, setToDelete] = useState(null); // sortie à supprimer
  const [form, setForm] = useState(emptyForm);

  const notify = (key, type = 'success') => setToast({ key, type });

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  // --- Charger les données (Produits + Sorties) ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, outRes] = await Promise.all([productsApi.getAll(), internalOutputsApi.getAll()]);
      setProducts(getRows(prodRes));
      setOutputs(getRows(outRes));
    } catch (err) {
      console.error(err);
      notify('err_load', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const closeModals = () => {
    if (saving) return;
    setShowForm(false);
    setToDelete(null);
    setEditing(null);
    setForm(emptyForm());
  };

  // Fermeture avec Échap
  useEffect(() => {
    if (!showForm && !toDelete) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closeModals();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const selectedProduct = useMemo(
    () => products.find((p) => String(p.id) === String(form.product_id)),
    [products, form.product_id]
  );

  // Stock réellement utilisable pour ce formulaire.
  // En modification, la quantité déjà sortie est "rendue" si le produit reste le même.
  const availableStock = useMemo(() => {
    if (!selectedProduct) return 0;
    const current = Number(selectedProduct.quantity) || 0;
    const sameProduct = editing && String(editing.product_id ?? editing.products?.id) === String(selectedProduct.id);
    return sameProduct ? current + (Number(editing.quantity) || 0) : current;
  }, [selectedProduct, editing]);

  /* ---------- Ouverture des modales ---------- */
  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = (o) => {
    setEditing(o);
    setForm({
      product_id: String(o.product_id ?? o.products?.id ?? ''),
      quantity: o.quantity ?? 1,
      reason: o.reason || 'other',
      notes: o.notes || '',
    });
    setShowForm(true);
  };

  /* ---------- Enregistrer (création ou modification) ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (Number(form.quantity) > availableStock) {
      return notify('err_stock', 'danger');
    }

    if (editing && typeof internalOutputsApi.update !== 'function') {
      return notify('err_api_missing', 'danger');
    }

    setSaving(true);
    try {
      const payload = { ...form, quantity: Number(form.quantity) || 1 };

      if (editing) {
        // On transmet l'ancienne sortie : l'API en a besoin pour recalculer le stock.
        await internalOutputsApi.update(editing.id, payload, editing);
        notify('ok_edit');
      } else {
        // L'API gère l'insertion dans 'internal_outputs' ET la déduction du stock
        await internalOutputsApi.create(payload);
        notify('ok_save');
      }

      setShowForm(false);
      setEditing(null);
      setForm(emptyForm());
      fetchData(); // Recharger la liste et le stock
    } catch (err) {
      console.error(err);
      notify(editing ? 'err_edit' : 'err_save', 'danger');
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Supprimer ---------- */
  const handleDeleteConfirm = async () => {
    if (!toDelete) return;
    if (typeof internalOutputsApi.delete !== 'function') {
      return notify('err_api_missing', 'danger');
    }

    setSaving(true);
    try {
      // On transmet la sortie complète : l'API en a besoin pour restaurer le stock.
      await internalOutputsApi.delete(toDelete.id, toDelete);
      notify('ok_delete');
      setToDelete(null);
      fetchData();
    } catch (err) {
      console.error(err);
      notify('err_delete', 'danger');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="expenses-page" dir={t.dir} lang={lang}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      <style>{`
        .expenses-page { padding: 24px; background: #f2f5fb; min-height: 100vh; font-family: Inter, sans-serif; color: #14213d; }
        .expenses-page[lang="ar"] { font-family: Cairo, 'Noto Sans Arabic', Tahoma, 'Segoe UI', Arial, sans-serif; }
        .expenses-page * { box-sizing: border-box; }
        .expenses-page button:focus-visible, .expenses-page input:focus-visible, .expenses-page select:focus-visible {
          outline: 3px solid rgba(31,94,234,.35); outline-offset: 2px;
        }
        .ep-hero { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; background: #fff; padding: 24px; border-radius: 16px; margin-bottom: 24px; border: 1px solid #e3e9f2; box-shadow: 0 4px 14px rgba(20,33,61,.03); }
        .ep-title h1 { margin: 0 0 8px; font-size: 24px; font-weight: 800; display: flex; align-items: center; gap: 12px; }
        .ep-title p { margin: 0; color: #66748b; font-size: 15px; }
        .ep-btn-add { background: #1f5eea; color: #fff; padding: 12px 20px; border-radius: 10px; font: inherit; font-weight: 700; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; }
        .ep-btn-add:hover { background: #1e4ed8; transform: translateY(-2px); }
        .ep-panel { background: #fff; border-radius: 16px; border: 1px solid #e3e9f2; overflow: hidden; box-shadow: 0 4px 14px rgba(20,33,61,.03); }
        .ep-table-wrap { overflow-x: auto; }
        .ep-table { width: 100%; min-width: 640px; border-collapse: collapse; }
        .ep-table th, .ep-table td { padding: 16px; text-align: start; border-bottom: 1px solid #e3e9f2; font-size: 15px; }
        .ep-table th { background: #f8fafc; font-weight: 700; color: #66748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }
        .ep-table tbody tr:hover { background: #fbfcff; }
        .ep-table tr:last-child td { border-bottom: 0; }
        .ep-col-end { text-align: end !important; }
        .ep-empty { text-align: center !important; padding: 60px !important; color: #66748b; }
        .ep-amt { direction: ltr; unicode-bidi: isolate; font-variant-numeric: tabular-nums; }

        .ep-actions { display: flex; gap: 8px; justify-content: flex-end; }
        .btn-icon { width: 36px; height: 36px; border-radius: 9px; border: 1px solid transparent; display: grid; place-items: center; cursor: pointer; transition: .18s; background: transparent; font-size: 14px; }
        .btn-edit { background: #e8efff; color: #1f5eea; border-color: #c9daff; }
        .btn-edit:hover { background: #1f5eea; color: #fff; }
        .btn-delete { background: #fde8ea; color: #d63c4a; border-color: #f6c8cd; }
        .btn-delete:hover { background: #d63c4a; color: #fff; }

        .ep-modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .ep-modal { background: #fff; width: 100%; max-width: 500px; max-height: calc(100vh - 40px); overflow: auto; border-radius: 16px; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
        .ep-modal h2 { margin: 0 0 20px; font-size: 20px; font-weight: 800; }
        .ep-form-group { margin-bottom: 20px; }
        .ep-form-group label { display: block; margin-bottom: 8px; font-weight: 700; font-size: 14px; color: #4b5b75; }
        .ep-form-group input, .ep-form-group select, .ep-form-group textarea { width: 100%; padding: 12px; border: 1px solid #d9e1ed; border-radius: 8px; font: inherit; font-size: 15px; outline: none; background: #fff; }
        .ep-form-group input:focus, .ep-form-group select:focus { border-color: #1f5eea; box-shadow: 0 0 0 3px #e8efff; }
        .ep-hint { display: block; margin-top: 6px; font-size: 12px; color: #66748b; }
        .ep-btn-save { background: #1f5eea; color: #fff; padding: 14px; border-radius: 8px; border: none; font: inherit; font-weight: 700; font-size: 16px; cursor: pointer; width: 100%; margin-top: 10px; transition: 0.2s; }
        .ep-btn-save:hover:not(:disabled) { background: #1e4ed8; }
        .ep-btn-save:disabled { background: #93c5fd; cursor: not-allowed; }
        .ep-btn-danger { background: #d63c4a; }
        .ep-btn-danger:hover:not(:disabled) { background: #b42f3b; }
        .ep-btn-danger:disabled { background: #f1a3aa; }
        .ep-btn-cancel { background: transparent; color: #66748b; border: none; padding: 14px; font: inherit; font-weight: 700; width: 100%; cursor: pointer; margin-top: 8px; }

        .ep-delete-body { text-align: center; padding: 6px 0 4px; }
        .ep-delete-icon { display: inline-grid; place-items: center; width: 58px; height: 58px; margin-bottom: 14px; border-radius: 50%; background: #fde8ea; color: #d63c4a; font-size: 24px; }
        .ep-delete-body h2 { margin-bottom: 8px; }
        .ep-delete-name { margin: 12px 0; padding: 10px 14px; border-radius: 9px; background: #f7f9fd; font-weight: 800; }
        .ep-delete-warn { margin: 0; padding: 10px 12px; border-radius: 9px; background: #def7ee; color: #0b6a4e; font-size: 14px; }

        .ep-toast { position: fixed; top: 20px; right: 20px; max-width: calc(100% - 40px); padding: 14px 24px; border-radius: 8px; color: #fff; font-weight: 600; z-index: 1100; box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
        .ep-toast.success { background: #0f9d74; } .ep-toast.danger { background: #d63c4a; }
        [dir="rtl"] .ep-toast { right: auto; left: 20px; }
        .badge { padding: 4px 10px; border-radius: 99px; font-size: 12px; font-weight: 700; background: #f1f5f9; color: #475569; }
      `}</style>

      {toast && (
        <div className={`ep-toast ${toast.type}`} role={toast.type === 'danger' ? 'alert' : 'status'}>
          {t[toast.key]}
        </div>
      )}

      <header className="ep-hero">
        <div className="ep-title">
          <h1><i className="fas fa-dolly" style={{ color: '#1f5eea' }}></i> {t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <button className="ep-btn-add" type="button" onClick={openCreate}>
          <i className="fas fa-plus"></i> {t.add}
        </button>
      </header>

      <div className="ep-panel">
        <div className="ep-table-wrap">
          <table className="ep-table">
            <thead>
              <tr>
                <th>{t.th_date}</th>
                <th>{t.th_product}</th>
                <th>{t.th_qty}</th>
                <th>{t.th_reason}</th>
                <th className="ep-col-end">{t.th_actions}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="ep-empty">{t.loading}</td></tr>
              ) : outputs.length === 0 ? (
                <tr><td colSpan="5" className="ep-empty">{t.no_data}</td></tr>
              ) : (
                outputs.map((o) => (
                  <tr key={o.id}>
                    <td><bdi>{o.created_at ? new Date(o.created_at).toLocaleDateString(t.locale) : '—'}</bdi></td>
                    <td><strong>{o.products?.name || t.unknown_product}</strong></td>
                    <td>
                      <span className="badge" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                        <bdi className="ep-amt">- {o.quantity}</bdi>
                      </span>
                    </td>
                    <td>{t.reasons[o.reason] || o.reason}</td>
                    <td className="ep-col-end">
                      <div className="ep-actions">
                        <button type="button" className="btn-icon btn-edit" onClick={() => openEdit(o)} title={t.edit} aria-label={t.edit}>
                          <i className="fas fa-edit"></i>
                        </button>
                        <button type="button" className="btn-icon btn-delete" onClick={() => setToDelete(o)} title={t.delete} aria-label={t.delete}>
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modale création / modification */}
      {showForm && (
        <div className="ep-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && closeModals()}>
          <div className="ep-modal" dir={t.dir} role="dialog" aria-modal="true" aria-labelledby="io-form-title">
            <h2 id="io-form-title">{editing ? t.modal_edit : t.modal_title}</h2>
            <form onSubmit={handleSubmit}>
              <div className="ep-form-group">
                <label htmlFor="io-product">{t.f_product}</label>
                <select
                  id="io-product"
                  required
                  value={form.product_id}
                  onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                >
                  <option value="">{t.f_product_ph}</option>
                  {products.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.name} ({t.stock_label(formatNumber(p.quantity))})
                    </option>
                  ))}
                </select>
              </div>
              <div className="ep-form-group">
                <label htmlFor="io-qty">{t.f_qty}</label>
                <input
                  id="io-qty"
                  type="number"
                  min="1"
                  max={selectedProduct ? availableStock : undefined}
                  required
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                />
                {selectedProduct && (
                  <span className="ep-hint">{t.available(formatNumber(availableStock))}</span>
                )}
              </div>
              <div className="ep-form-group">
                <label htmlFor="io-reason">{t.f_reason}</label>
                <select id="io-reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
                  <option value="internal">{t.reasons.internal}</option>
                  <option value="damage">{t.reasons.damage}</option>
                  <option value="donation">{t.reasons.donation}</option>
                  <option value="other">{t.reasons.other}</option>
                </select>
              </div>
              <button type="submit" className="ep-btn-save" disabled={saving}>
                {saving ? t.saving : editing ? t.save_edit : t.save}
              </button>
              <button type="button" className="ep-btn-cancel" onClick={closeModals} disabled={saving}>
                {t.cancel}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modale suppression */}
      {toDelete && (
        <div className="ep-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && closeModals()}>
          <div className="ep-modal" style={{ maxWidth: 420 }} dir={t.dir} role="alertdialog" aria-modal="true" aria-labelledby="io-delete-title">
            <div className="ep-delete-body">
              <span className="ep-delete-icon"><i className="fas fa-trash-alt"></i></span>
              <h2 id="io-delete-title">{t.delete_title}</h2>
              <div className="ep-delete-name">
                {toDelete.products?.name || t.unknown_product} — <bdi className="ep-amt">× {toDelete.quantity}</bdi>
              </div>
              <p className="ep-delete-warn">
                <i className="fas fa-info-circle" style={{ marginInlineEnd: 6 }}></i>
                {t.delete_warn(toDelete.quantity)}
              </p>
            </div>
            <button type="button" className="ep-btn-save ep-btn-danger" onClick={handleDeleteConfirm} disabled={saving}>
              {saving ? t.deleting : t.delete_confirm}
            </button>
            <button type="button" className="ep-btn-cancel" onClick={closeModals} disabled={saving}>
              {t.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternalOutputsPage;