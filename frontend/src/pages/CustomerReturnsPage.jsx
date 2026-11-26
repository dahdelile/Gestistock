// src/pages/CustomerReturnsPage.jsx
// Retours clients — bilingue FR / AR, avec actions Modifier et Supprimer
import React, { useState, useEffect } from 'react';
import { productsApi, returnsApi } from '../api';
import { useLanguage } from '../context/LanguageContext';

const I18N = {
  fr: {
    dir: 'ltr',
    locale: 'fr-FR',
    currency: 'MRU',
    title: 'Retours clients',
    subtitle: 'Gérez les retours de produits et les remboursements.',
    add: 'Nouveau retour',
    th_date: 'Date',
    th_invoice: 'Facture',
    th_product: 'Produit',
    th_qty: 'Qté retournée',
    th_reason: 'Motif',
    th_refund: 'Remboursement',
    th_actions: 'Actions',
    loading: 'Chargement...',
    no_data: 'Aucun retour enregistré.',
    unknown_product: 'Produit',
    edit: 'Modifier',
    delete: 'Supprimer',
    modal_title: 'Enregistrer un retour',
    modal_edit: 'Modifier le retour',
    f_invoice: 'N° Facture (Optionnel)',
    f_invoice_ph: 'Ex : INV-123456',
    f_product: 'Produit retourné',
    f_product_ph: '-- Sélectionner --',
    f_qty: 'Quantité',
    f_refund: 'Montant remboursé',
    f_reason: 'Motif du retour',
    reasons: {
      defective: 'Produit défectueux',
      wrong_item: 'Mauvais article',
      changed_mind: "Changement d'avis",
      other: 'Autre',
    },
    cancel: 'Annuler',
    close: 'Fermer',
    save: 'Valider le retour',
    save_edit: 'Enregistrer les modifications',
    saving: 'Enregistrement...',
    delete_title: 'Supprimer ce retour ?',
    delete_warn: (q) => `Le stock du produit sera diminué de ${q} unité(s).`,
    delete_confirm: 'Oui, supprimer',
    deleting: 'Suppression...',
    ok_save: 'Retour enregistré et stock mis à jour.',
    ok_edit: 'Retour modifié et stock mis à jour.',
    ok_delete: 'Retour supprimé et stock mis à jour.',
    err_load: 'Erreur de chargement des données.',
    err_save: "Erreur lors de l'enregistrement.",
    err_edit: 'Erreur lors de la modification.',
    err_delete: 'Erreur lors de la suppression.',
    err_api_missing: "Cette action n'est pas encore disponible dans l'API (returnsApi).",
  },
  ar: {
    dir: 'rtl',
    locale: 'ar-u-nu-latn',
    currency: 'أوقية',
    title: 'مرتجعات العملاء',
    subtitle: 'أدر مرتجعات المنتجات والمبالغ المستردة.',
    add: 'مرتجع جديد',
    th_date: 'التاريخ',
    th_invoice: 'الفاتورة',
    th_product: 'المنتج',
    th_qty: 'الكمية المرتجعة',
    th_reason: 'السبب',
    th_refund: 'المبلغ المسترد',
    th_actions: 'إجراءات',
    loading: 'جارٍ التحميل...',
    no_data: 'لا توجد مرتجعات مسجلة.',
    unknown_product: 'منتج',
    edit: 'تعديل',
    delete: 'حذف',
    modal_title: 'تسجيل مرتجع',
    modal_edit: 'تعديل المرتجع',
    f_invoice: 'رقم الفاتورة (اختياري)',
    f_invoice_ph: 'مثال: INV-123456',
    f_product: 'المنتج المرتجع',
    f_product_ph: '-- اختر --',
    f_qty: 'الكمية',
    f_refund: 'المبلغ المسترد',
    f_reason: 'سبب الإرجاع',
    reasons: {
      defective: 'منتج معيب',
      wrong_item: 'منتج خاطئ',
      changed_mind: 'تغيير الرأي',
      other: 'أخرى',
    },
    cancel: 'إلغاء',
    close: 'إغلاق',
    save: 'تأكيد المرتجع',
    save_edit: 'حفظ التعديلات',
    saving: 'جارٍ الحفظ...',
    delete_title: 'حذف هذا المرتجع؟',
    delete_warn: (q) => `سيتم إنقاص مخزون المنتج بمقدار ${q} وحدة.`,
    delete_confirm: 'نعم، احذف',
    deleting: 'جارٍ الحذف...',
    ok_save: 'تم تسجيل المرتجع وتحديث المخزون.',
    ok_edit: 'تم تعديل المرتجع وتحديث المخزون.',
    ok_delete: 'تم حذف المرتجع وتحديث المخزون.',
    err_load: 'تعذّر تحميل البيانات.',
    err_save: 'حدث خطأ أثناء الحفظ.',
    err_edit: 'حدث خطأ أثناء التعديل.',
    err_delete: 'حدث خطأ أثناء الحذف.',
    err_api_missing: 'هذا الإجراء غير متوفر بعد في الواجهة البرمجية (returnsApi).',
  },
};

const getRows = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
};

const formatNumber = (v) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(Number(v) || 0);

const emptyForm = () => ({ invoice_number: '', product_id: '', quantity: 1, refund_amount: 0, reason: 'defective' });

const CustomerReturnsPage = () => {
  const { lang } = useLanguage();
  const t = I18N[lang];

  const [returns, setReturns] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // { key, type } ou { msg, type }

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // retour en cours de modification
  const [toDelete, setToDelete] = useState(null); // retour à supprimer
  const [form, setForm] = useState(emptyForm);

  const notify = (key, type = 'success') => setToast({ key, type });

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  // --- Charger les données (Produits + Retours) ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, returnsRes] = await Promise.all([productsApi.getAll(), returnsApi.getAll()]);
      setProducts(getRows(prodRes));
      setReturns(getRows(returnsRes));
    } catch (err) {
      console.error('Erreur de chargement:', err);
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

  /* ---------- Ouverture des modales ---------- */
  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    setForm({
      invoice_number: r.invoice_number || '',
      product_id: String(r.product_id ?? r.products?.id ?? ''),
      quantity: r.quantity ?? 1,
      refund_amount: r.refund_amount ?? 0,
      reason: r.reason || 'other',
    });
    setShowForm(true);
  };

  /* ---------- Enregistrer (création ou modification) ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editing && typeof returnsApi.update !== 'function') {
      return notify('err_api_missing', 'danger');
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        quantity: Number(form.quantity) || 1,
        refund_amount: Number(form.refund_amount) || 0,
      };

      if (editing) {
        // On transmet l'ancien retour : l'API en a besoin pour recalculer le stock.
        await returnsApi.update(editing.id, payload, editing);
        notify('ok_edit');
      } else {
        await returnsApi.create(payload);
        notify('ok_save');
      }

      setShowForm(false);
      setEditing(null);
      setForm(emptyForm());
      fetchData();
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
    if (typeof returnsApi.delete !== 'function') {
      return notify('err_api_missing', 'danger');
    }

    setSaving(true);
    try {
      // On transmet le retour complet : l'API en a besoin pour réduire le stock.
      await returnsApi.delete(toDelete.id, toDelete);
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
          outline: 3px solid rgba(194,65,124,.35); outline-offset: 2px;
        }
        .ep-hero { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; background: #fff; padding: 24px; border-radius: 16px; margin-bottom: 24px; border: 1px solid #e3e9f2; box-shadow: 0 4px 14px rgba(20,33,61,.03); }
        .ep-title h1 { margin: 0 0 8px; font-size: 24px; font-weight: 800; display: flex; align-items: center; gap: 12px; }
        .ep-title p { margin: 0; color: #66748b; font-size: 15px; }
        .ep-btn-add { background: #c2417c; color: #fff; padding: 12px 20px; border-radius: 10px; font: inherit; font-weight: 700; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; }
        .ep-btn-add:hover { background: #9c2a62; transform: translateY(-2px); }
        .ep-panel { background: #fff; border-radius: 16px; border: 1px solid #e3e9f2; overflow: hidden; box-shadow: 0 4px 14px rgba(20,33,61,.03); }
        .ep-table-wrap { overflow-x: auto; }
        .ep-table { width: 100%; min-width: 820px; border-collapse: collapse; }
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
        .ep-form-group input, .ep-form-group select { width: 100%; padding: 12px; border: 1px solid #d9e1ed; border-radius: 8px; font: inherit; font-size: 15px; outline: none; background: #fff; }
        .ep-form-group input:focus, .ep-form-group select:focus { border-color: #c2417c; box-shadow: 0 0 0 3px #fbe6f0; }
        .ep-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 480px) { .ep-grid2 { grid-template-columns: 1fr; } }
        .ep-btn-save { background: #c2417c; color: #fff; padding: 14px; border-radius: 8px; border: none; font: inherit; font-weight: 700; font-size: 16px; cursor: pointer; width: 100%; margin-top: 10px; transition: 0.2s; }
        .ep-btn-save:hover:not(:disabled) { background: #9c2a62; }
        .ep-btn-save:disabled { background: #f9a8d4; cursor: not-allowed; }
        .ep-btn-danger { background: #d63c4a; }
        .ep-btn-danger:hover:not(:disabled) { background: #b42f3b; }
        .ep-btn-danger:disabled { background: #f1a3aa; }
        .ep-btn-cancel { background: transparent; color: #66748b; border: none; padding: 14px; font: inherit; font-weight: 700; width: 100%; cursor: pointer; margin-top: 8px; }

        .ep-delete-body { text-align: center; padding: 6px 0 4px; }
        .ep-delete-icon { display: inline-grid; place-items: center; width: 58px; height: 58px; margin-bottom: 14px; border-radius: 50%; background: #fde8ea; color: #d63c4a; font-size: 24px; }
        .ep-delete-body h2 { margin-bottom: 8px; }
        .ep-delete-name { margin: 12px 0; padding: 10px 14px; border-radius: 9px; background: #f7f9fd; font-weight: 800; }
        .ep-delete-warn { margin: 0; padding: 10px 12px; border-radius: 9px; background: #fff0d6; color: #94590a; font-size: 14px; }

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
          <h1><i className="fas fa-undo" style={{ color: '#c2417c' }}></i> {t.title}</h1>
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
                <th>{t.th_invoice}</th>
                <th>{t.th_product}</th>
                <th>{t.th_qty}</th>
                <th>{t.th_refund}</th>
                <th>{t.th_reason}</th>
                <th className="ep-col-end">{t.th_actions}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="ep-empty">{t.loading}</td></tr>
              ) : returns.length === 0 ? (
                <tr><td colSpan="7" className="ep-empty">{t.no_data}</td></tr>
              ) : (
                returns.map((r) => (
                  <tr key={r.id}>
                    <td><bdi>{r.created_at ? new Date(r.created_at).toLocaleDateString(t.locale) : '—'}</bdi></td>
                    <td><bdi>{r.invoice_number || '—'}</bdi></td>
                    <td><strong>{r.products?.name || t.unknown_product}</strong></td>
                    <td>
                      <span className="badge" style={{ background: '#def7ee', color: '#0b6a4e' }}>
                        <bdi className="ep-amt">+ {r.quantity}</bdi>
                      </span>
                    </td>
                    <td><bdi className="ep-amt">{formatNumber(r.refund_amount)}</bdi> {t.currency}</td>
                    <td>{t.reasons[r.reason] || r.reason}</td>
                    <td className="ep-col-end">
                      <div className="ep-actions">
                        <button type="button" className="btn-icon btn-edit" onClick={() => openEdit(r)} title={t.edit} aria-label={t.edit}>
                          <i className="fas fa-edit"></i>
                        </button>
                        <button type="button" className="btn-icon btn-delete" onClick={() => setToDelete(r)} title={t.delete} aria-label={t.delete}>
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
          <div className="ep-modal" dir={t.dir} role="dialog" aria-modal="true" aria-labelledby="cr-form-title">
            <h2 id="cr-form-title">{editing ? t.modal_edit : t.modal_title}</h2>
            <form onSubmit={handleSubmit}>
              <div className="ep-form-group">
                <label htmlFor="cr-invoice">{t.f_invoice}</label>
                <input
                  id="cr-invoice"
                  type="text"
                  value={form.invoice_number}
                  onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
                  placeholder={t.f_invoice_ph}
                />
              </div>
              <div className="ep-form-group">
                <label htmlFor="cr-product">{t.f_product}</label>
                <select
                  id="cr-product"
                  required
                  value={form.product_id}
                  onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                >
                  <option value="">{t.f_product_ph}</option>
                  {products.map((p) => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
                </select>
              </div>
              <div className="ep-grid2">
                <div className="ep-form-group">
                  <label htmlFor="cr-qty">{t.f_qty}</label>
                  <input
                    id="cr-qty"
                    type="number"
                    min="1"
                    required
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  />
                </div>
                <div className="ep-form-group">
                  <label htmlFor="cr-refund">{t.f_refund} ({t.currency})</label>
                  <input
                    id="cr-refund"
                    type="number"
                    min="0"
                    value={form.refund_amount}
                    onChange={(e) => setForm({ ...form, refund_amount: e.target.value })}
                  />
                </div>
              </div>
              <div className="ep-form-group">
                <label htmlFor="cr-reason">{t.f_reason}</label>
                <select id="cr-reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
                  <option value="defective">{t.reasons.defective}</option>
                  <option value="wrong_item">{t.reasons.wrong_item}</option>
                  <option value="changed_mind">{t.reasons.changed_mind}</option>
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
          <div className="ep-modal" style={{ maxWidth: 420 }} dir={t.dir} role="alertdialog" aria-modal="true" aria-labelledby="cr-delete-title">
            <div className="ep-delete-body">
              <span className="ep-delete-icon"><i className="fas fa-trash-alt"></i></span>
              <h2 id="cr-delete-title">{t.delete_title}</h2>
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

export default CustomerReturnsPage;