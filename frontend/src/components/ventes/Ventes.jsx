import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Button, Card, Spinner, Badge, Form, Modal, Toast, ToastContainer, Alert, Row, Col, InputGroup } from 'react-bootstrap';
import { FaFilter, FaSearch, FaPlus, FaEdit, FaTrash, FaTimes, FaHistory, FaCheck, FaSyncAlt, FaShoppingCart, FaBoxes, FaMoneyBillWave, FaReceipt, FaUserShield } from 'react-icons/fa';
import { supabase } from '../../supabaseClient';

const CSS = `
.ventes-chauffeur-wrap { background: #f5f7fa; padding: 10px; width: 100% !important; max-width: 100% !important; overflow-x: hidden !important; }
.ventes-chauffeur-wrap * { box-sizing: border-box; }
.ventes-chauffeur-wrap .vc-stats { display: grid !important; grid-template-columns: repeat(4, 1fr) !important; gap: 6px !important; margin-bottom: 12px; flex-wrap: nowrap !important; }
.ventes-chauffeur-wrap .vc-stat { flex: none !important; display: flex !important; flex-direction: column !important; justify-content: center !important; align-items: flex-start !important; color: #fff; padding: 10px 8px !important; border-radius: 4px !important; min-width: 0 !important; overflow: hidden; text-align: left !important; }
.ventes-chauffeur-wrap .vc-stat div { display: flex; flex-direction: column; width: 100%; min-width: 0; }
.ventes-chauffeur-wrap .vc-stat span { font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ventes-chauffeur-wrap .vc-stat strong { font-size: 18px; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ventes-chauffeur-wrap .vc-stat svg { font-size: 20px !important; opacity: .9; margin-top: 4px; }
.vc-violet { background: #6f42c1; } .vc-vert { background: #28a745; } .vc-bleu { background: #17a2b8; } .vc-orange { background: #ffab00; }
.ventes-chauffeur-wrap .vc-header { background: #6a4fd3 !important; color: #fff; display: flex; justify-content: space-between; align-items: center; padding: 10px; flex-wrap: wrap; gap: 8px; }
.ventes-chauffeur-wrap .vc-header-left { display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0; }
.ventes-chauffeur-wrap .vc-header-left h3 { margin: 0; font-size: 16px; font-weight: 700; white-space: nowrap; }
.ventes-chauffeur-wrap .vc-admin { background: #28a745; color: #fff; font-size: 11px; padding: 3px 6px; border-radius: 4px; display: inline-flex; gap: 4px; align-items: center; }
.ventes-chauffeur-wrap .vc-header-right { display: flex; gap: 6px; }
.vc-btn-refresh { background: #fff; border: none; padding: 6px 10px; border-radius: 4px; display: flex; gap: 5px; align-items: center; font-size: 12px; white-space: nowrap; }
.vc-btn-vert { background: #28a745; color: #fff; border: none; padding: 6px 10px; border-radius: 4px; display: flex; gap: 5px; align-items: center; font-size: 12px; white-space: nowrap; }
.ventes-chauffeur-wrap .vc-filters { background: #fff; display: flex; gap: 10px; padding: 10px; border: 1px solid #dee2e6; border-top: none; flex-wrap: wrap; }
.ventes-chauffeur-wrap .vc-filter-item { flex: 1; min-width: 140px; display: flex; flex-direction: column; gap: 5px; }
.ventes-chauffeur-wrap .vc-filter-item label { font-weight: 700; font-size: 12px; display: flex; gap: 5px; align-items: center; }
.ventes-chauffeur-wrap .vc-table-wrap, .ventes-chauffeur-wrap .table-responsive { background: #fff; border: 1px solid #dee2e6; border-top: none; overflow-x: visible !important; overflow-y: visible !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; }
.ventes-chauffeur-wrap .vc-table { margin: 0 !important; width: 100% !important; table-layout: fixed !important; border-collapse: collapse; }
.ventes-chauffeur-wrap .vc-table thead th { background: #111 !important; color: #fff !important; white-space: normal !important; word-break: break-word; font-size: 11px; padding: 8px 4px; border: none; text-align: center; }
.ventes-chauffeur-wrap .vc-table tbody td { font-size: 11px; padding: 8px 4px; vertical-align: middle; text-align: center; white-space: normal !important; word-break: break-word; overflow-wrap: anywhere; }
.ventes-chauffeur-wrap .vc-table tbody tr:nth-child(even) { background: #f8f9fa; }
.ventes-chauffeur-wrap .vc-table th:nth-child(1), .ventes-chauffeur-wrap .vc-table td:nth-child(1) { width: 9%; }
.ventes-chauffeur-wrap .vc-table th:nth-child(2), .ventes-chauffeur-wrap .vc-table td:nth-child(2) { width: 18%; text-align: left; }
.ventes-chauffeur-wrap .vc-table th:nth-child(3), .ventes-chauffeur-wrap .vc-table td:nth-child(3) { width: 16%; }
.ventes-chauffeur-wrap .vc-table th:nth-child(4), .ventes-chauffeur-wrap .vc-table td:nth-child(4) { width: 18%; text-align: left; }
.ventes-chauffeur-wrap .vc-table th:nth-child(5), .ventes-chauffeur-wrap .vc-table td:nth-child(5) { width: 13%; }
.ventes-chauffeur-wrap .vc-table th:nth-child(6), .ventes-chauffeur-wrap .vc-table td:nth-child(6) { width: 14%; }
.ventes-chauffeur-wrap .vc-table th:nth-child(7), .ventes-chauffeur-wrap .vc-table td:nth-child(7) { width: 12%; }
.badge-payee { background: #28a745; color: #fff; padding: 3px 6px; border-radius: 10px; font-size: 10px; font-weight: 600; display: inline-block; }
.badge-partielle { background: #ffc107; color: #111; padding: 3px 6px; border-radius: 10px; font-size: 10px; font-weight: 600; display: inline-block; }
.badge-nonpayee { background: #dc3545; color: #fff; padding: 3px 6px; border-radius: 10px; font-size: 10px; font-weight: 600; display: inline-block; }
.ventes-chauffeur-wrap .vc-actions { display: flex; gap: 3px; justify-content: center; }
.ventes-chauffeur-wrap .vc-actions button { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; background: #fff; border: 1px solid #17a2b8; color: #17a2b8; border-radius: 4px; font-size: 10px; padding: 0; }
.ventes-chauffeur-wrap .vc-actions .vc-edit { border-color: #28a745; color: #28a745; }
.ventes-chauffeur-wrap .vc-actions .vc-del { border-color: #dc3545; color: #dc3545; }
.ventes-chauffeur-wrap .vc-cats { display: flex; gap: 3px; flex-wrap: wrap; justify-content: center; }
.ventes-chauffeur-wrap .vc-cats .badge { font-size: 9px; padding: 3px 5px; }
@media (max-width: 768px) {
  .ventes-chauffeur-wrap { padding: 6px !important; }
  .ventes-chauffeur-wrap .vc-stats { grid-template-columns: repeat(4, 1fr) !important; gap: 4px !important; }
  .ventes-chauffeur-wrap .vc-stat { padding: 8px 5px !important; }
  .ventes-chauffeur-wrap .vc-stat span { font-size: 9px !important; }
  .ventes-chauffeur-wrap .vc-stat strong { font-size: 13px !important; }
  .ventes-chauffeur-wrap .vc-stat svg { font-size: 16px !important; }
  .ventes-chauffeur-wrap .vc-header-left h3 { font-size: 14px; }
  .ventes-chauffeur-wrap .vc-filters { flex-direction: column; }
  .ventes-chauffeur-wrap .vc-table thead th { font-size: 10px; padding: 6px 2px; }
  .ventes-chauffeur-wrap .vc-table tbody td { font-size: 10px; padding: 6px 2px; }
  .ventes-chauffeur-wrap .vc-actions button { width: 22px; height: 22px; }
}
@media (max-width: 380px) {
  .ventes-chauffeur-wrap .vc-stat strong { font-size: 11px !important; }
  .ventes-chauffeur-wrap .vc-stat span { font-size: 8px !important; }
  .ventes-chauffeur-wrap .vc-table thead th, .ventes-chauffeur-wrap .vc-table tbody td { font-size: 9px; }
}
`;

const formatDate = (d) => {
    if (!d) return '-';
    try { return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return d; }
};
const formatMontant = (n) => `${Number(n || 0).toLocaleString('fr-FR')} MRU`;

const Ventes = () => {
    const [ventes, setVentes] = useState([]);
    const [produits, setProduits] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategorie, setSelectedCategorie] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [toasts, setToasts] = useState([]);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentVente, setCurrentVente] = useState({ id: null, client_nom: '', date_vente: new Date().toISOString().split('T')[0], montant_paye: 0, observation: '', items: [] });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [venteToDelete, setVenteToDelete] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [venteDetail, setVenteDetail] = useState(null);
    const [ligneForm, setLigneForm] = useState({ produit_id: '', quantite: 1, prix_vente: '' });

    const showToast = (message, variant = 'success') => {
        const t = { id: Date.now(), message, variant };
        setToasts(p => [...p, t]);
        setTimeout(() => setToasts(p => p.filter(x => x.id !== t.id)), 5000);
    };

    const fetchVentes = useCallback(async () => {
        try {
            setLoading(true);
            const { data: invoices, error: errInv } = await supabase.from('invoices').select('*, invoice_items(*, products(*, categories(*), sous_categories(*)))').order('created_at', { ascending: false });
            if (errInv) throw errInv;
            const data = (invoices || []).map(inv => {
                const items = inv.invoice_items || [];
                const total = items.reduce((s, it) => s + Number(it.quantite || 0) * Number(it.prix_unitaire || 0), 0);
                return { id: inv.id, numero: inv.numero || `V-${inv.id}`, client_nom: inv.client_nom || inv.client || 'Client inconnu', date_vente: inv.date_facture || inv.created_at, montant_total: total, montant_paye: Number(inv.montant_paye || 0), observation: inv.observation || inv.notes || '', items };
            });
            setVentes(data);
        } catch (e) { setError(e.message); } finally { setLoading(false); }
    }, []);

    const fetchReferences = useCallback(async () => {
        const [p, c] = await Promise.all([
            supabase.from('products').select('*, categories(*), sous_categories(*)').order('nom'),
            supabase.from('categories').select('*, sous_categories(*)').order('nom')
        ]);
        if (p.data) setProduits(p.data);
        if (c.data) setCategories(c.data);
    }, []);

    useEffect(() => { fetchReferences(); fetchVentes(); }, [fetchReferences, fetchVentes]);

    const getCategorieName = (item) => {
        if (!item?.products) return 'Sans catégorie';
        return item.products?.categories?.nom || item.products?.sous_categories?.categories?.nom || item.products?.sous_categories?.nom || 'Sans catégorie';
    };

    const getStatutBadge = (v) => {
        if (Number(v.montant_paye || 0) >= Number(v.montant_total || 0)) return <span className="badge-payee">Payée</span>;
        if (Number(v.montant_paye || 0) > 0) return <span className="badge-partielle">Partielle</span>;
        return <span className="badge-nonpayee">Non payée</span>;
    };

    const stats = useMemo(() => {
        let totalProduits = 0, montantTotal = 0, montantPaye = 0;
        ventes.forEach(v => {
            montantTotal += Number(v.montant_total || 0);
            montantPaye += Number(v.montant_paye || 0);
            (v.items || []).forEach(it => { totalProduits += Number(it.quantite || 0); });
        });
        return { totalVentes: ventes.length, totalProduits, montantTotal, montantPaye };
    }, [ventes]);

    const filteredVentes = useMemo(() => {
        return ventes.filter(v => {
            if (selectedCategorie) {
                const ok = (v.items || []).some(it => String(it.products?.categories?.id || it.products?.sous_categories?.categorie_id || '') === String(selectedCategorie));
                if (!ok) return false;
            }
            if (searchTerm) {
                const t = searchTerm.toLowerCase();
                if (!(v.client_nom || '').toLowerCase().includes(t) && !(v.numero || '').toLowerCase().includes(t) && !(v.items || []).some(it => (it.products?.nom || '').toLowerCase().includes(t))) return false;
            }
            return true;
        });
    }, [ventes, selectedCategorie, searchTerm]);

    const handleAddVente = () => {
        setCurrentVente({ id: null, client_nom: '', date_vente: new Date().toISOString().split('T')[0], montant_paye: 0, observation: '', items: [] });
        setLigneForm({ produit_id: '', quantite: 1, prix_vente: '' });
        setIsEditing(false); setShowAddModal(true);
    };
    const handleEditVente = (vente) => {
        setCurrentVente({ id: vente.id, client_nom: vente.client_nom, date_vente: (vente.date_vente || '').slice(0, 10), montant_paye: vente.montant_paye, observation: vente.observation, items: (vente.items || []).map(it => ({ produit_id: it.product_id, produit_nom: it.products?.nom || '', quantite: it.quantite, prix_vente: it.prix_unitaire, categorie: getCategorieName(it) })) });
        setIsEditing(true); setShowAddModal(true);
    };
    const confirmDelete = async () => {
        if (!venteToDelete) return;
        setIsUpdating(true);
        try {
            await supabase.from('invoice_items').delete().eq('invoice_id', venteToDelete.id);
            const { error } = await supabase.from('invoices').delete().eq('id', venteToDelete.id);
            if (error) throw error;
            showToast('Vente supprimée avec succès'); setShowDeleteModal(false); await fetchVentes();
        } catch (e) { showToast(e.message, 'danger'); } finally { setIsUpdating(false); setVenteToDelete(null); }
    };
    const handleAddLigne = () => {
        if (!ligneForm.produit_id) { setError('Veuillez sélectionner un produit'); return; }
        if (!ligneForm.prix_vente || Number(ligneForm.prix_vente) <= 0) { setError("Le prix de vente est obligatoire. Ne jamais utiliser le prix d'achat."); return; }
        const prod = produits.find(p => String(p.id) === String(ligneForm.produit_id));
        setCurrentVente(prev => ({ ...prev, items: [...prev.items, { produit_id: ligneForm.produit_id, produit_nom: prod?.nom || '', quantite: Number(ligneForm.quantite || 1), prix_vente: Number(ligneForm.prix_vente), categorie: prod?.categories?.nom || prod?.sous_categories?.categories?.nom || prod?.sous_categories?.nom || 'Sans catégorie' }] }));
        setLigneForm({ produit_id: '', quantite: 1, prix_vente: '' }); setError(null);
    };
    const totalEnCours = useMemo(() => (currentVente.items || []).reduce((s, it) => s + Number(it.quantite || 0) * Number(it.prix_vente || 0), 0), [currentVente.items]);
    const submitVente = async () => {
        if (!currentVente.client_nom?.trim()) { setError('Le nom du client est obligatoire'); return; }
        if (!currentVente.items.length) { setError('Ajoutez au moins un produit'); return; }
        setIsUpdating(true); setError(null);
        try {
            if (isEditing) {
                await supabase.from('invoices').update({ client_nom: currentVente.client_nom, date_facture: currentVente.date_vente, montant_paye: Number(currentVente.montant_paye || 0), observation: currentVente.observation }).eq('id', currentVente.id);
                await supabase.from('invoice_items').delete().eq('invoice_id', currentVente.id);
                await supabase.from('invoice_items').insert(currentVente.items.map(it => ({ invoice_id: currentVente.id, product_id: it.produit_id, quantite: it.quantite, prix_unitaire: it.prix_vente })));
            } else {
                const numero = `V-${Date.now().toString().slice(-6)}`;
                const { data: inv, error: errInv } = await supabase.from('invoices').insert([{ numero, client_nom: currentVente.client_nom, date_facture: currentVente.date_vente, montant_paye: Number(currentVente.montant_paye || 0), observation: currentVente.observation }]).select().single();
                if (errInv) throw errInv;
                await supabase.from('invoice_items').insert(currentVente.items.map(it => ({ invoice_id: inv.id, product_id: it.produit_id, quantite: it.quantite, prix_unitaire: it.prix_vente })));
            }
            showToast(`Vente ${isEditing ? 'modifiée' : 'ajoutée'} avec succès`); setShowAddModal(false); await fetchVentes();
        } catch (e) { setError(e.message); showToast(e.message, 'danger'); } finally { setIsUpdating(false); }
    };

    return (
        <div className="ventes-chauffeur-wrap">
            <style>{CSS}</style>
            <ToastContainer position="top-end" className="p-3">
                {toasts.map(t => <Toast key={t.id} bg={t.variant} autohide delay={5000} onClose={() => setToasts(p => p.filter(x => x.id !== t.id))}><Toast.Body className="text-white">{t.message}</Toast.Body></Toast>)}
            </ToastContainer>

            <div className="vc-stats">
                <div className="vc-stat vc-violet"><div><span>Total ventes</span><strong>{stats.totalVentes}</strong></div><FaReceipt /></div>
                <div className="vc-stat vc-vert"><div><span>Produits vendus</span><strong>{stats.totalProduits}</strong></div><FaBoxes /></div>
                <div className="vc-stat vc-bleu"><div><span>Montant total</span><strong>{formatMontant(stats.montantTotal)}</strong></div><FaMoneyBillWave /></div>
                <div className="vc-stat vc-orange"><div><span>Montant payé</span><strong>{formatMontant(stats.montantPaye)}</strong></div><FaCheck /></div>
            </div>

            <div className="vc-header">
                <div className="vc-header-left">
                    <FaShoppingCart /><h3>Gestion des ventes</h3>
                    <span className="vc-admin"><FaUserShield /> Admin</span>
                </div>
                <div className="vc-header-right">
                    <button className="vc-btn-refresh" onClick={() => { fetchVentes(); fetchReferences(); }}><FaSyncAlt /> Rafraîchir</button>
                    <button className="vc-btn-vert" onClick={handleAddVente}><FaPlus /> Nouvelle vente</button>
                </div>
            </div>

            <div className="vc-filters">
                <div className="vc-filter-item">
                    <label><FaFilter /> Filtre par catégorie</label>
                    <Form.Select value={selectedCategorie} onChange={e => setSelectedCategorie(e.target.value)}>
                        <option value="">Toutes les catégories</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                    </Form.Select>
                </div>
                <div className="vc-filter-item vc-search">
                    <label><FaSearch /> Recherche</label>
                    <InputGroup>
                        <Form.Control placeholder="Client, N° vente ou produit..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        {searchTerm && <Button variant="outline-secondary" onClick={() => setSearchTerm('')}>×</Button>}
                    </InputGroup>
                </div>
                <div className="vc-filter-item vc-reset">
                    <Button variant="outline-secondary" onClick={() => { setSelectedCategorie(''); setSearchTerm(''); }}><FaTimes /> Réinitialiser</Button>
                </div>
            </div>

            {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

            {loading ? <div className="text-center py-5"><Spinner animation="border" variant="primary" /><p>Chargement des ventes...</p></div> : (
                <div className="vc-table-wrap">
                    <Table className="vc-table">
                        <thead><tr><th>N°</th><th>Client</th><th>Catégorie</th><th>Produit</th><th>Montant</th><th>Statut</th><th>Actions</th></tr></thead>
                        <tbody>
                            {filteredVentes.length ? filteredVentes.map(v => (
                                <tr key={v.id}>
                                    <td className="fw-bold">{v.numero}</td>
                                    <td>{v.client_nom}<div className="small text-muted">{formatDate(v.date_vente)}</div></td>
                                    <td><div className="vc-cats">{[...new Set((v.items || []).map(it => getCategorieName(it)))].map((c, i) => <Badge key={i} bg="secondary">{c}</Badge>)}</div></td>
                                    <td>{(v.items || []).map((it, i) => <div key={i} className="small">{it.products?.nom} × {it.quantite}</div>)}</td>
                                    <td className="fw-bold">{formatMontant(v.montant_total)}<div className="small fw-normal">Payé: {formatMontant(v.montant_paye)}</div></td>
                                    <td>{getStatutBadge(v)}</td>
                                    <td><div className="vc-actions">
                                        <button onClick={() => { setVenteDetail(v); setShowDetailModal(true); }} title="Détail"><FaHistory /></button>
                                        <button className="vc-edit" onClick={() => handleEditVente(v)} title="Modifier"><FaEdit /></button>
                                        <button className="vc-del" onClick={() => { setVenteToDelete(v); setShowDeleteModal(true); }} title="Supprimer"><FaTrash /></button>
                                    </div></td>
                                </tr>
                            )) : <tr><td colSpan="7" className="text-center py-4">Aucune vente trouvée</td></tr>}
                        </tbody>
                    </Table>
                </div>
            )}

            <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
                <Modal.Header closeButton><Modal.Title>{isEditing ? 'Modifier' : 'Ajouter'} une vente</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Row><Col md={6}><Form.Group className="mb-3"><Form.Label>Client *</Form.Label><Form.Control value={currentVente.client_nom} onChange={e => setCurrentVente(p => ({ ...p, client_nom: e.target.value }))} placeholder="Nom du client" /></Form.Group></Col>
                    <Col md={3}><Form.Group className="mb-3"><Form.Label>Date *</Form.Label><Form.Control type="date" value={currentVente.date_vente} onChange={e => setCurrentVente(p => ({ ...p, date_vente: e.target.value }))} /></Form.Group></Col>
                    <Col md={3}><Form.Group className="mb-3"><Form.Label>Montant payé</Form.Label><Form.Control type="number" value={currentVente.montant_paye} onChange={e => setCurrentVente(p => ({ ...p, montant_paye: e.target.value }))} /></Form.Group></Col></Row>
                    <Alert variant="info"><small>Le prix de vente se saisit manuellement. Ne jamais utiliser le prix d'achat.</small></Alert>
                    <Row><Col md={5}><Form.Group className="mb-3"><Form.Label>Produit *</Form.Label><Form.Select value={ligneForm.produit_id} onChange={e => {
                        const prod = produits.find(p => String(p.id) === String(e.target.value));
                        setLigneForm(p => ({ ...p, produit_id: e.target.value, prix_vente: prod?.prix_vente || '' }));
                    }}><option value="">Sélectionner un produit</option>{produits.map(p => <option key={p.id} value={p.id}>{p.nom} — {p.categories?.nom || p.sous_categories?.nom || ''}</option>)}</Form.Select></Form.Group></Col>
                    <Col md={2}><Form.Group className="mb-3"><Form.Label>Quantité</Form.Label><Form.Control type="number" min="1" value={ligneForm.quantite} onChange={e => setLigneForm(p => ({ ...p, quantite: e.target.value }))} /></Form.Group></Col>
                    <Col md={3}><Form.Group className="mb-3"><Form.Label>Prix de vente *</Form.Label><Form.Control type="number" value={ligneForm.prix_vente} onChange={e => setLigneForm(p => ({ ...p, prix_vente: e.target.value }))} placeholder="Prix de vente" /></Form.Group></Col>
                    <Col md={2} className="d-flex align-items-end"><Button variant="success" className="w-100 mb-3" onClick={handleAddLigne}><FaPlus /> Ajouter</Button></Col></Row>
                    <Table striped bordered size="sm"><thead className="table-dark"><tr><th>Produit</th><th>Catégorie</th><th>Qté</th><th>Prix vente</th><th>Total</th><th></th></tr></thead><tbody>{(currentVente.items || []).map((it, i) => <tr key={i}><td>{it.produit_nom}</td><td><Badge bg="secondary">{it.categorie}</Badge></td><td className="text-center">{it.quantite}</td><td>{formatMontant(it.prix_vente)}</td><td className="fw-bold">{formatMontant(Number(it.quantite) * Number(it.prix_vente))}</td><td><Button variant="outline-danger" size="sm" onClick={() => setCurrentVente(p => ({ ...p, items: p.items.filter((_, x) => x !== i) }))}><FaTimes /></Button></td></tr>)}</tbody></Table>
                    <Row><Col md={6}><Form.Group><Form.Label>Observation</Form.Label><Form.Control as="textarea" rows={2} value={currentVente.observation} onChange={e => setCurrentVente(p => ({ ...p, observation: e.target.value }))} /></Form.Group></Col><Col md={6}><Alert variant="light" className="border"><div className="d-flex justify-content-between"><span>Total :</span><strong>{formatMontant(totalEnCours)}</strong></div><div className="d-flex justify-content-between"><span>Payé :</span><strong>{formatMontant(currentVente.montant_paye)}</strong></div></Alert></Col></Row>
                    {error && <Alert variant="danger">{error}</Alert>}
                </Modal.Body>
                <Modal.Footer><Button variant="secondary" onClick={() => setShowAddModal(false)}>Annuler</Button><Button variant="primary" onClick={submitVente} disabled={isUpdating}>{isUpdating ? <Spinner size="sm" /> : (isEditing ? 'Modifier' : 'Ajouter')}</Button></Modal.Footer>
            </Modal>

            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}><Modal.Header closeButton><Modal.Title>Confirmer la suppression</Modal.Title></Modal.Header><Modal.Body>{venteToDelete && <p>Voulez-vous supprimer <strong>{venteToDelete.numero} - {venteToDelete.client_nom}</strong> ?</p>}</Modal.Body><Modal.Footer><Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Annuler</Button><Button variant="danger" onClick={confirmDelete}>Supprimer</Button></Modal.Footer></Modal>

            <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg"><Modal.Header closeButton><Modal.Title>Détail - {venteDetail?.numero}</Modal.Title></Modal.Header><Modal.Body>{venteDetail && <><p><strong>Client:</strong> {venteDetail.client_nom}<br /><strong>Date:</strong> {formatDate(venteDetail.date_vente)}<br /><strong>Observation:</strong> {venteDetail.observation || '-'}</p><Table striped bordered size="sm"><thead className="table-dark"><tr><th>Produit</th><th>Catégorie</th><th>Qté</th><th>Prix</th><th>Total</th></tr></thead><tbody>{(venteDetail.items || []).map((it, i) => <tr key={i}><td>{it.products?.nom}</td><td><Badge bg="secondary">{getCategorieName(it)}</Badge></td><td className="text-center">{it.quantite}</td><td>{formatMontant(it.prix_unitaire)}</td><td className="fw-bold">{formatMontant(Number(it.quantite) * Number(it.prix_unitaire))}</td></tr>)}</tbody></Table></>}</Modal.Body><Modal.Footer><Button variant="secondary" onClick={() => setShowDetailModal(false)}>Fermer</Button></Modal.Footer></Modal>
        </div>
    );
};
export default Ventes;