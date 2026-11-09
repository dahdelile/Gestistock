// src/pages/InternalOutputsPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { productsApi, internalOutputsApi } from '../api'; // <-- On importe internalOutputsApi
import { useLanguage } from '../context/LanguageContext';

const I18N = {
  fr: {
    dir: 'ltr', currency: 'MRU',
    title: 'Sorties internes',
    subtitle: 'Gérez les besoins internes, la casse et les pertes de stock.',
    add: 'Nouvelle sortie',
    search_ph: 'Rechercher un produit...',
    th_date: 'Date', th_product: 'Produit', th_qty: 'Quantité', th_reason: 'Motif', th_user: 'Par', th_actions: 'Actions',
    no_data: 'Aucune sortie interne trouvée.',
    modal_title: 'Déclarer une sortie de stock',
    f_product: 'Produit',
    f_qty: 'Quantité à retirer',
    f_reason: 'Motif de la sortie',
    reasons: { internal: 'Besoin interne', damage: 'Casse / Perte', donation: 'Don / Échantillon', other: 'Autre' },
    cancel: 'Annuler', save: 'Valider la sortie', saving: 'Enregistrement...',
    ok_save: 'Sortie enregistrée avec succès.', err_save: 'Erreur lors de l\'enregistrement.',
    err_stock: 'Quantité insuffisante en stock.',
  },
  ar: {
    dir: 'rtl', currency: 'أوقية',
    title: 'المخارج الداخلية',
    subtitle: 'أدر الاحتياجات الداخلية، التلف وفاقد المخزون.',
    add: 'إخراج جديد',
    search_ph: 'ابحث عن منتج...',
    th_date: 'التاريخ', th_product: 'المنتج', th_qty: 'الكمية', th_reason: 'السبب', th_user: 'بواسطة', th_actions: 'إجراءات',
    no_data: 'لا توجد مخارج داخلية.',
    modal_title: 'تسجيل إخراج من المخزون',
    f_product: 'المنتج',
    f_qty: 'الكمية المسحوبة',
    f_reason: 'سبب الإخراج',
    reasons: { internal: 'احتياج داخلي', damage: 'تلف / فقدان', donation: 'تبرع / عينة', other: 'أخرى' },
    cancel: 'إلغاء', save: 'تأكيد الإخراج', saving: 'جارٍ الحفظ...',
    ok_save: 'تم تسجيل الإخراج بنجاح.', err_save: 'حدث خطأ أثناء الحفظ.',
    err_stock: 'الكمية غير كافية في المخزون.',
  }
};

const InternalOutputsPage = () => {
  const { lang } = useLanguage();
  const t = I18N[lang];

  const [outputs, setOutputs] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({ product_id: '', quantity: 1, reason: 'internal', notes: '' });

  const notify = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  // --- Charger les données (Produits + Sorties) ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const prodRes = await productsApi.getAll();
      setProducts(Array.isArray(prodRes) ? prodRes : prodRes?.data || []);
      
      // Appel à l'API pour récupérer l'historique
      const outRes = await internalOutputsApi.getAll(); 
      setOutputs(outRes.data || []);
    } catch (err) {
      console.error(err);
      notify("Erreur de chargement", 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const selectedProduct = useMemo(() => products.find(p => String(p.id) === String(form.product_id)), [products, form.product_id]);

  // --- Enregistrer une sortie ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (Number(form.quantity) > Number(selectedProduct.quantity)) {
      return notify(t.err_stock, 'danger');
    }

    setSaving(true);
    try {
      // L'API gère l'insertion dans 'internal_outputs' ET la déduction du stock
      await internalOutputsApi.create(form); 

      notify(t.ok_save);
      setShowModal(false);
      setForm({ product_id: '', quantity: 1, reason: 'internal', notes: '' });
      fetchData(); // Recharger la liste et le stock
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
        .ep-title p { margin: 0; color: #66748b; font-size: 21px; }
        .ep-btn-add { background: #1f5eea; color: #fff; padding: 12px 20px; border-radius: 10px; font-weight: 700; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; }
        .ep-btn-add:hover { background: #1e4ed8; transform: translateY(-2px); }
        .ep-panel { background: #fff; border-radius: 16px; border: 1px solid #e3e9f2; overflow: hidden; box-shadow: 0 4px 14px rgba(20,33,61,.03); }
        .ep-table { width: 100%; border-collapse: collapse; }
        .ep-table th, .ep-table td { padding: 16px; text-align: start; border-bottom: 1px solid #e3e9f2; font-size: 21px; }
        .ep-table th { background: #f8fafc; font-weight: 700; color: #66748b; font-size: 20px; text-transform: uppercase; letter-spacing: 0.5px; }
        .ep-table tbody tr:hover { background: #fbfcff; }
        .ep-empty { text-align: center; padding: 60px; color: #66748b; }
        .ep-modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .ep-modal { background: #fff; width: 100%; max-width: 500px; border-radius: 16px; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
        .ep-form-group { margin-bottom: 20px; }
        .ep-form-group label { display: block; margin-bottom: 8px; font-weight: 700; font-size: 21px; color: #4b5b75; }
        .ep-form-group input, .ep-form-group select, .ep-form-group textarea { width: 100%; padding: 12px; border: 1px solid #d9e1ed; border-radius: 8px; font-size: 21px; outline: none; }
        .ep-form-group input:focus, .ep-form-group select:focus { border-color: #1f5eea; box-shadow: 0 0 0 3px #e8efff; }
        .ep-btn-save { background: #1f5eea; color: #fff; padding: 14px; border-radius: 8px; border: none; font-weight: 700; font-size: 22px; cursor: pointer; width: 100%; margin-top: 10px; transition: 0.2s; }
        .ep-btn-save:hover { background: #1e4ed8; }
        .ep-btn-save:disabled { background: #93c5fd; cursor: not-allowed; }
        .ep-btn-cancel { background: transparent; color: #66748b; border: none; padding: 14px; font-weight: 700; width: 100%; cursor: pointer; margin-top: 8px; }
        .ep-toast { position: fixed; top: 20px; right: 20px; padding: 14px 24px; border-radius: 8px; color: #fff; font-weight: 600; z-index: 1100; box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
        .ep-toast.success { background: #0f9d74; } .ep-toast.danger { background: #d63c4a; }
        [dir="rtl"] .ep-toast { right: auto; left: 20px; }
        .badge { padding: 4px 10px; border-radius: 99px; font-size: 22px; font-weight: 700; background: #f1f5f9; color: #475569; }
      `}</style>

      {toast && <div className={`ep-toast ${toast.type}`}>{toast.msg}</div>}

      <header className="ep-hero">
        <div className="ep-title">
          <h1><i className="fas fa-dolly" style={{ color: '#1f5eea' }}></i> {t.title}</h1>
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
              <th>{t.th_product}</th>
              <th>{t.th_qty}</th>
              <th>{t.th_reason}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" className="ep-empty">Chargement...</td></tr>
            ) : outputs.length === 0 ? (
              <tr><td colSpan="4" className="ep-empty">{t.no_data}</td></tr>
            ) : (
              outputs.map(o => (
                <tr key={o.id}>
                  <td>{new Date(o.created_at).toLocaleDateString()}</td>
                  {/* Affichage via la jointure Supabase */}
                  <td><strong>{o.products?.name || 'Produit'}</strong></td>
                  <td><span className="badge" style={{ background: '#fee2e2', color: '#b91c1c' }}>- {o.quantity}</span></td>
                  <td>{t.reasons[o.reason] || o.reason}</td>
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
                <label>{t.f_product}</label>
                <select required value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })}>
                  <option value="">-- Sélectionner --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.quantity})</option>
                  ))}
                </select>
              </div>
              <div className="ep-form-group">
                <label>{t.f_qty}</label>
                <input type="number" min="1" required value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
              </div>
              <div className="ep-form-group">
                <label>{t.f_reason}</label>
                <select value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}>
                  <option value="internal">{t.reasons.internal}</option>
                  <option value="damage">{t.reasons.damage}</option>
                  <option value="donation">{t.reasons.donation}</option>
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

export default InternalOutputsPage;