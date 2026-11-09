// src/pages/CustomerReturnsPage.jsx
import React, { useState, useEffect } from 'react';
import { productsApi, returnsApi } from '../api'; // <-- On utilise returnsApi maintenant
import { useLanguage } from '../context/LanguageContext';

const I18N = {
  fr: {
    dir: 'ltr', currency: 'MRU',
    title: 'Retours clients',
    subtitle: 'Gérez les retours de produits et les remboursements.',
    add: 'Nouveau retour',
    th_date: 'Date', th_invoice: 'Facture', th_product: 'Produit', th_qty: 'Qté retournée', th_reason: 'Motif', th_refund: 'Remboursement',
    no_data: 'Aucun retour enregistré.',
    modal_title: 'Enregistrer un retour',
    f_invoice: 'N° Facture (Optionnel)',
    f_product: 'Produit retourné',
    f_qty: 'Quantité',
    f_refund: 'Montant remboursé',
    f_reason: 'Motif du retour',
    reasons: { defective: 'Produit défectueux', wrong_item: 'Mauvais article', changed_mind: 'Changement d\'avis', other: 'Autre' },
    cancel: 'Annuler', save: 'Valider le retour', saving: 'Enregistrement...',
    ok_save: 'Retour enregistré et stock mis à jour.', err_save: 'Erreur lors de l\'enregistrement.',
  },
  ar: {
    dir: 'rtl', currency: 'أوقية',
    title: 'مرتجعات العملاء',
    subtitle: 'أدر مرتجعات المنتجات والمبالغ المستردة.',
    add: 'مرتجع جديد',
    th_date: 'التاريخ', th_invoice: 'الفاتورة', th_product: 'المنتج', th_qty: 'الكمية المرتجعة', th_reason: 'السبب', th_refund: 'المبلغ المسترد',
    no_data: 'لا توجد مرتجعات مسجلة.',
    modal_title: 'تسجيل مرتجع',
    f_invoice: 'رقم الفاتورة (اختياري)',
    f_product: 'المنتج المرتجع',
    f_qty: 'الكمية',
    f_refund: 'المبلغ المسترد',
    f_reason: 'سبب الإرجاع',
    reasons: { defective: 'منتج معيب', wrong_item: 'منتج خاطئ', changed_mind: 'تغيير الرأي', other: 'أخرى' },
    cancel: 'إلغاء', save: 'تأكيد المرتجع', saving: 'جارٍ الحفظ...',
    ok_save: 'تم تسجيل المرتجع وتحديث المخزون.', err_save: 'حدث خطأ أثناء الحفظ.',
  }
};

const CustomerReturnsPage = () => {
  const { lang } = useLanguage();
  const t = I18N[lang];

  const [returns, setReturns] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({ invoice_number: '', product_id: '', quantity: 1, refund_amount: 0, reason: 'defective' });

  const notify = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  // --- Charger les données (Produits + Retours) ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const prodRes = await productsApi.getAll();
      setProducts(Array.isArray(prodRes) ? prodRes : prodRes?.data || []);

      const returnsRes = await returnsApi.getAll(); // <-- Appel à l'API pour récupérer la liste
      setReturns(returnsRes.data || []);
    } catch (err) {
      console.error("Erreur de chargement:", err);
      notify("Erreur de chargement des données", 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- Enregistrer un retour ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // On envoie tout à l'API qui gère l'insertion et la mise à jour du stock
      await returnsApi.create(form); 
      
      notify(t.ok_save);
      setShowModal(false);
      setForm({ invoice_number: '', product_id: '', quantity: 1, refund_amount: 0, reason: 'defective' });
      
      // Recharger la liste et les produits (pour voir le nouveau stock)
      fetchData();
    } catch (err) {
      console.error(err);
      notify(t.err_save, 'danger');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="expenses-page" dir={t.dir} lang={lang}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      <style>{`
        .expenses-page { padding: 24px; background: #f2f5fb; min-height: 100vh; font-family: Inter, sans-serif; color: #14213d; }
        .ep-hero { display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 24px; border-radius: 16px; margin-bottom: 24px; border: 1px solid #e3e9f2; box-shadow: 0 4px 14px rgba(20,33,61,.03); }
        .ep-title h1 { margin: 0 0 8px; font-size: 28px; font-weight: 800; display: flex; align-items: center; gap: 12px; }
        .ep-title p { margin: 0; color: #66748b; font-size: 20px; }
        .ep-btn-add { background: #c2417c; color: #fff; padding: 12px 20px; border-radius: 10px; font-weight: 700; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; }
        .ep-btn-add:hover { background: #9c2a62; transform: translateY(-2px); }
        .ep-panel { background: #fff; border-radius: 16px; border: 1px solid #e3e9f2; overflow: hidden; box-shadow: 0 4px 14px rgba(20,33,61,.03); }
        .ep-table { width: 100%; border-collapse: collapse; }
        .ep-table th, .ep-table td { padding: 16px; text-align: start; border-bottom: 1px solid #e3e9f2; font-size: 20px; }
        .ep-table th { background: #f8fafc; font-weight: 700; color: #66748b; font-size: 21px; text-transform: uppercase; letter-spacing: 0.5px; }
        .ep-table tbody tr:hover { background: #fbfcff; }
        .ep-empty { text-align: center; padding: 60px; color: #66748b; }
        .ep-modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .ep-modal { background: #fff; width: 100%; max-width: 500px; border-radius: 16px; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
        .ep-form-group { margin-bottom: 20px; }
        .ep-form-group label { display: block; margin-bottom: 8px; font-weight: 700; font-size: 21px; color: #4b5b75; }
        .ep-form-group input, .ep-form-group select { width: 100%; padding: 12px; border: 1px solid #d9e1ed; border-radius: 8px; font-size: 21px; outline: none; }
        .ep-form-group input:focus, .ep-form-group select:focus { border-color: #c2417c; box-shadow: 0 0 0 3px #fbe6f0; }
        .ep-btn-save { background: #c2417c; color: #fff; padding: 14px; border-radius: 8px; border: none; font-weight: 700; font-size: 21px; cursor: pointer; width: 100%; margin-top: 10px; transition: 0.2s; }
        .ep-btn-save:hover { background: #9c2a62; }
        .ep-btn-save:disabled { background: #f9a8d4; cursor: not-allowed; }
        .ep-btn-cancel { background: transparent; color: #66748b; border: none; padding: 14px; font-weight: 700; width: 100%; cursor: pointer; margin-top: 8px; }
        .ep-toast { position: fixed; top: 20px; right: 20px; padding: 14px 24px; border-radius: 8px; color: #fff; font-weight: 600; z-index: 1100; box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
        .ep-toast.success { background: #0f9d74; } .ep-toast.danger { background: #d63c4a; }
        [dir="rtl"] .ep-toast { right: auto; left: 20px; }
        .badge { padding: 4px 10px; border-radius: 99px; font-size: 20px; font-weight: 700; background: #f1f5f9; color: #475569; }
      `}</style>

      {toast && <div className={`ep-toast ${toast.type}`}>{toast.msg}</div>}

      <header className="ep-hero">
        <div className="ep-title">
          <h1><i className="fas fa-undo" style={{ color: '#c2417c' }}></i> {t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <button className="ep-btn-add" onClick={() => setShowModal(true)}>
          <i className="fas fa-plus"></i> {t.add}
        </button>
      </header>

      <div className="ep-panel">
        <table className="ep-table">
          <thead>
            <tr>
              <th>{t.th_date}</th>
              <th>{t.th_invoice}</th>
              <th>{t.th_product}</th>
              <th>{t.th_qty}</th>
              <th>{t.th_refund}</th>
              <th>{t.th_reason}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="ep-empty">Chargement...</td></tr>
            ) : returns.length === 0 ? (
              <tr><td colSpan="6" className="ep-empty">{t.no_data}</td></tr>
            ) : (
              returns.map(r => (
                <tr key={r.id}>
                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td>{r.invoice_number || '—'}</td>
                  {/* On affiche r.products.name car c'est la jointure Supabase */}
                  <td><strong>{r.products?.name || 'Produit'}</strong></td>
                  <td><span className="badge" style={{ background: '#def7ee', color: '#0b6a4e' }}>+ {r.quantity}</span></td>
                  <td>{r.refund_amount} {t.currency}</td>
                  <td>{t.reasons[r.reason] || r.reason}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="ep-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="ep-modal" dir={t.dir}>
            <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: 20 }}>{t.modal_title}</h2>
            <form onSubmit={handleSubmit}>
              <div className="ep-form-group">
                <label>{t.f_invoice}</label>
                <input type="text" value={form.invoice_number} onChange={e => setForm({ ...form, invoice_number: e.target.value })} placeholder="Ex: INV-123456" />
              </div>
              <div className="ep-form-group">
                <label>{t.f_product}</label>
                <select required value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })}>
                  <option value="">-- Sélectionner --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="ep-form-group">
                  <label>{t.f_qty}</label>
                  <input type="number" min="1" required value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
                </div>
                <div className="ep-form-group">
                  <label>{t.f_refund} ({t.currency})</label>
                  <input type="number" min="0" value={form.refund_amount} onChange={e => setForm({ ...form, refund_amount: e.target.value })} />
                </div>
              </div>
              <div className="ep-form-group">
                <label>{t.f_reason}</label>
                <select value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}>
                  <option value="defective">{t.reasons.defective}</option>
                  <option value="wrong_item">{t.reasons.wrong_item}</option>
                  <option value="changed_mind">{t.reasons.changed_mind}</option>
                  <option value="other">{t.reasons.other}</option>
                </select>
              </div>
              <button type="submit" className="ep-btn-save" disabled={saving}>
                {saving ? t.saving : t.save}
              </button>
              <button type="button" className="ep-btn-cancel" onClick={() => setShowModal(false)}>
                {t.cancel}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerReturnsPage;