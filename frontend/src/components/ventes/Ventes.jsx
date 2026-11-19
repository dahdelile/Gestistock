import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Table, Button, Card, Spinner,
    Badge, Form, Modal, Toast, ToastContainer,
    Alert, Row, Col, InputGroup, Tabs, Tab
} from 'react-bootstrap';
import {
    FaFilter, FaInfoCircle,
    FaSyncAlt, FaSearch, FaPlus, FaEdit, FaTrash,
    FaTimes, FaHistory, FaCheck, FaChartBar,
    FaUsers, FaExchangeAlt, FaShoppingCart,
    FaBoxes, FaMoneyBillWave, FaReceipt
} from 'react-icons/fa';
import { supabase } from '../../supabaseClient';

const formatDate = (dateString) => {
    if (!dateString) return 'Non spécifiée';
    try {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    } catch { return dateString; }
};

const formatDateTime = (dateString) => {
    if (!dateString) return 'Non spécifiée';
    try {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch { return dateString; }
};

const formatMontant = (n) => {
    return `${Number(n || 0).toLocaleString('fr-FR')} MRU`;
};

const Ventes = () => {
    const [activeTab, setActiveTab] = useState('ventes');
    const [ventes, setVentes] = useState([]);
    const [produits, setProduits] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategorie, setSelectedCategorie] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchTermHistorique, setSearchTermHistorique] = useState('');

    const [stats, setStats] = useState({
        totalVentes: 0,
        totalProduitsVendus: 0,
        montantTotal: 0,
        montantPaye: 0,
        parCategorie: []
    });

    const [toasts, setToasts] = useState([]);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentVente, setCurrentVente] = useState({
        id: null,
        client_nom: '',
        date_vente: new Date().toISOString().split('T')[0],
        montant_paye: 0,
        observation: '',
        items: []
    });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [venteToDelete, setVenteToDelete] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [venteDetail, setVenteDetail] = useState(null);
    const [ligneForm, setLigneForm] = useState({
        produit_id: '',
        quantite: 1,
        prix_vente: ''
    });

    const showToast = (message, variant = 'success') => {
        const newToast = { id: Date.now(), message, variant };
        setToasts(prev => [...prev, newToast]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== newToast.id));
        }, 5000);
    };

    const fetchVentes = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const { data: invoices, error: errInv } = await supabase
                .from('invoices')
                .select('*, invoice_items(*, products(*, categories(*), sous_categories(*)))')
                .order('created_at', { ascending: false });
            if (errInv) throw errInv;
            const ventesData = (invoices || []).map(inv => {
                const items = inv.invoice_items || [];
                const total = items.reduce((s, it) => s + Number(it.quantite || 0) * Number(it.prix_unitaire || 0), 0);
                return {
                    id: inv.id,
                    numero: inv.numero || `V-${inv.id}`,
                    client_nom: inv.client_nom || inv.client || 'Client inconnu',
                    date_vente: inv.date_facture || inv.created_at,
                    montant_total: total,
                    montant_paye: Number(inv.montant_paye || 0),
                    observation: inv.observation || inv.notes || '',
                    items: items
                };
            });
            setVentes(ventesData);
        } catch (err) {
            console.error('[ERROR] Erreur chargement ventes:', err);
            setError(err.message || "Impossible de charger les ventes");
            setVentes([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchReferences = useCallback(async () => {
        try {
            const [prodRes, catRes] = await Promise.all([
                supabase.from('products').select('*, categories(*), sous_categories(*)').order('nom'),
                supabase.from('categories').select('*, sous_categories(*)').order('nom')
            ]);
            if (prodRes.data) setProduits(prodRes.data);
            if (catRes.data) setCategories(catRes.data);
        } catch (err) {
            console.error('[ERROR] Erreur chargement références:', err);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            await fetchReferences();
            await fetchVentes();
        };
        init();
    }, [fetchReferences, fetchVentes]);

    const getProduitInfo = (produitId) => {
        return produits.find(p => String(p.id) === String(produitId));
    };

    const getCategorieName = (item) => {
        if (!item?.products) return 'Sans catégorie';
        return item.products?.categories?.nom
            || item.products?.sous_categories?.categories?.nom
            || item.products?.sous_categories?.nom
            || 'Sans catégorie';
    };

    const calculerStats = useCallback(() => {
        const totalVentes = ventes.length;
        let totalProduitsVendus = 0;
        let montantTotal = 0;
        let montantPaye = 0;
        const parCatMap = {};
        ventes.forEach(v => {
            montantTotal += Number(v.montant_total || 0);
            montantPaye += Number(v.montant_paye || 0);
            (v.items || []).forEach(it => {
                totalProduitsVendus += Number(it.quantite || 0);
                const catName = it.products?.categories?.nom || it.products?.sous_categories?.categories?.nom || 'Sans catégorie';
                const catId = it.products?.categories?.id || it.products?.sous_categories?.categorie_id || 'sans';
                if (!parCatMap[catId]) parCatMap[catId] = { id: catId, nom: catName, quantite: 0, montant: 0, nbVentes: 0 };
                parCatMap[catId].quantite += Number(it.quantite || 0);
                parCatMap[catId].montant += Number(it.quantite || 0) * Number(it.prix_unitaire || 0);
            });
        });
        Object.values(parCatMap).forEach(c => {
            c.nbVentes = ventes.filter(v => (v.items || []).some(it =>
                (it.products?.categories?.nom || it.products?.sous_categories?.categories?.nom || 'Sans catégorie') === c.nom
            )).length;
        });
        setStats({
            totalVentes,
            totalProduitsVendus,
            montantTotal,
            montantPaye,
            parCategorie: Object.values(parCatMap)
        });
    }, [ventes]);

    useEffect(() => {
        calculerStats();
    }, [ventes, calculerStats]);

    const getStatutBadge = (vente) => {
        const total = Number(vente.montant_total || 0);
        const paye = Number(vente.montant_paye || 0);
        if (paye >= total) return <Badge bg="success">Payée</Badge>;
        if (paye > 0) return <Badge bg="warning">Partielle</Badge>;
        return <Badge bg="danger">Non payée</Badge>;
    };

    const resetFilters = () => {
        setSelectedCategorie(null);
        setSearchTerm('');
    };

    const filteredVentes = useMemo(() => {
        return ventes.filter(v => {
            if (selectedCategorie) {
                const hasCat = (v.items || []).some(it => {
                    const catId = it.products?.categories?.id || it.products?.sous_categories?.categorie_id;
                    return String(catId) === String(selectedCategorie);
                });
                if (!hasCat) return false;
            }
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const inClient = (v.client_nom || '').toLowerCase().includes(term);
                const inNumero = (v.numero || '').toLowerCase().includes(term);
                const inProduit = (v.items || []).some(it => (it.products?.nom || '').toLowerCase().includes(term));
                if (!inClient && !inNumero && !inProduit) return false;
            }
            return true;
        });
    }, [ventes, selectedCategorie, searchTerm]);

    const filteredHistorique = useMemo(() => {
        if (!searchTermHistorique) return ventes;
        const term = searchTermHistorique.toLowerCase();
        return ventes.filter(v =>
            (v.client_nom || '').toLowerCase().includes(term) ||
            (v.numero || '').toLowerCase().includes(term) ||
            (v.items || []).some(it => (it.products?.nom || '').toLowerCase().includes(term))
        );
    }, [ventes, searchTermHistorique]);

    const historiqueRows = useMemo(() => {
        const rows = [];
        filteredHistorique.forEach(v => {
            (v.items || []).forEach((it, idx) => {
                rows.push({
                    key: `${v.id}-${idx}`,
                    numero: v.numero,
                    client_nom: v.client_nom,
                    categorie: getCategorieName(it),
                    produit: it.products?.nom || '-',
                    quantite: it.quantite,
                    prix: it.prix_unitaire,
                    date: v.date_vente,
                    vente: v
                });
            });
        });
        return rows;
    }, [filteredHistorique]);

    const handleAddVente = () => {
        setCurrentVente({
            id: null,
            client_nom: '',
            date_vente: new Date().toISOString().split('T')[0],
            montant_paye: 0,
            observation: '',
            items: []
        });
        setLigneForm({ produit_id: '', quantite: 1, prix_vente: '' });
        setIsEditing(false);
        setShowAddModal(true);
    };

    const handleEditVente = (vente) => {
        setCurrentVente({
            id: vente.id,
            client_nom: vente.client_nom,
            date_vente: (vente.date_vente || '').slice(0, 10),
            montant_paye: vente.montant_paye,
            observation: vente.observation,
            items: (vente.items || []).map(it => ({
                produit_id: it.produit_id || it.product_id,
                produit_nom: it.products?.nom || '',
                quantite: it.quantite,
                prix_vente: it.prix_unitaire,
                categorie: getCategorieName(it)
            }))
        });
        setIsEditing(true);
        setShowAddModal(true);
    };

    const handleDeleteVente = (vente) => {
        setVenteToDelete(vente);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!venteToDelete) return;
        try {
            setIsUpdating(true);
            await supabase.from('invoice_items').delete().eq('invoice_id', venteToDelete.id);
            const { error } = await supabase.from('invoices').delete().eq('id', venteToDelete.id);
            if (error) throw error;
            showToast(`Vente ${venteToDelete.numero} supprimée avec succès`);
            setShowDeleteModal(false);
            await fetchVentes();
        } catch (err) {
            showToast(err.message || "Erreur lors de la suppression", 'danger');
        } finally {
            setIsUpdating(false);
            setVenteToDelete(null);
        }
    };

    const handleAddLigne = () => {
        if (!ligneForm.produit_id) {
            setError("Veuillez sélectionner un produit");
            return;
        }
        if (!ligneForm.prix_vente || Number(ligneForm.prix_vente) <= 0) {
            setError("Le prix de vente est obligatoire. Ne jamais utiliser le prix d'achat.");
            return;
        }
        const prod = getProduitInfo(ligneForm.produit_id);
        const nouvelleLigne = {
            produit_id: ligneForm.produit_id,
            produit_nom: prod?.nom || '',
            quantite: Number(ligneForm.quantite || 1),
            prix_vente: Number(ligneForm.prix_vente),
            categorie: prod?.categories?.nom || prod?.sous_categories?.categories?.nom || prod?.sous_categories?.nom || 'Sans catégorie'
        };
        setCurrentVente(prev => ({ ...prev, items: [...prev.items, nouvelleLigne] }));
        setLigneForm({ produit_id: '', quantite: 1, prix_vente: '' });
        setError(null);
    };

    const handleRemoveLigne = (index) => {
        setCurrentVente(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleProduitChange = (produitId) => {
        const prod = getProduitInfo(produitId);
        setLigneForm(prev => ({
            ...prev,
            produit_id: produitId,
            prix_vente: prod?.prix_vente || prod?.prix || ''
        }));
    };

    const totalVenteEnCours = useMemo(() => {
        return (currentVente.items || []).reduce((s, it) => s + Number(it.quantite || 0) * Number(it.prix_vente || 0), 0);
    }, [currentVente.items]);

    const submitVente = async () => {
        if (!currentVente.client_nom?.trim()) {
            setError("Le nom du client est obligatoire");
            return;
        }
        if (!currentVente.items || currentVente.items.length === 0) {
            setError("Ajoutez au moins un produit");
            return;
        }
        setIsUpdating(true);
        setError(null);
        try {
            if (isEditing) {
                const { error: errUp } = await supabase.from('invoices').update({
                    client_nom: currentVente.client_nom,
                    date_facture: currentVente.date_vente,
                    montant_paye: Number(currentVente.montant_paye || 0),
                    observation: currentVente.observation
                }).eq('id', currentVente.id);
                if (errUp) throw errUp;
                await supabase.from('invoice_items').delete().eq('invoice_id', currentVente.id);
                const itemsToInsert = currentVente.items.map(it => ({
                    invoice_id: currentVente.id,
                    product_id: it.produit_id,
                    quantite: it.quantite,
                    prix_unitaire: it.prix_vente
                }));
                const { error: errItems } = await supabase.from('invoice_items').insert(itemsToInsert);
                if (errItems) throw errItems;
            } else {
                const numero = `V-${Date.now().toString().slice(-6)}`;
                const { data: inv, error: errInv } = await supabase.from('invoices').insert([{
                    numero,
                    client_nom: currentVente.client_nom,
                    date_facture: currentVente.date_vente,
                    montant_paye: Number(currentVente.montant_paye || 0),
                    observation: currentVente.observation
                }]).select().single();
                if (errInv) throw errInv;
                const itemsToInsert = currentVente.items.map(it => ({
                    invoice_id: inv.id,
                    product_id: it.produit_id,
                    quantite: it.quantite,
                    prix_unitaire: it.prix_vente
                }));
                const { error: errItems } = await supabase.from('invoice_items').insert(itemsToInsert);
                if (errItems) throw errItems;
            }
            showToast(`Vente ${isEditing ? 'modifiée' : 'ajoutée'} avec succès`);
            setShowAddModal(false);
            await fetchVentes();
        } catch (err) {
            console.error("Erreur:", err);
            setError(err.message);
            showToast(err.message, 'danger');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="container-fluid py-4">
            <ToastContainer position="top-end" className="p-3">
                {toasts.map(toast => (
                    <Toast key={toast.id} onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} bg={toast.variant} autohide delay={5000}>
                        <Toast.Body className="text-white">{toast.message}</Toast.Body>
                    </Toast>
                ))}
            </ToastContainer>

            <Row className="mb-4">
                <Col md={3}>
                    <Card className="bg-primary text-white shadow-sm">
                        <Card.Body className="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 className="mb-0">Total ventes</h6>
                                <h2 className="mb-0">{stats.totalVentes}</h2>
                            </div>
                            <FaReceipt size={40} />
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="bg-success text-white shadow-sm">
                        <Card.Body className="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 className="mb-0">Produits vendus</h6>
                                <h2 className="mb-0">{stats.totalProduitsVendus}</h2>
                            </div>
                            <FaBoxes size={40} />
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="bg-info text-white shadow-sm">
                        <Card.Body className="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 className="mb-0">Montant total</h6>
                                <h2 className="mb-0">{formatMontant(stats.montantTotal)}</h2>
                            </div>
                            <FaMoneyBillWave size={40} />
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="bg-warning text-white shadow-sm">
                        <Card.Body className="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 className="mb-0">Montant payé</h6>
                                <h2 className="mb-0">{formatMontant(stats.montantPaye)}</h2>
                            </div>
                            <FaCheck size={40} />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card className="shadow-sm">
                <Card.Header className="bg-primary text-white">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <h3 className="mb-0 d-flex align-items-center">
                            <FaShoppingCart className="me-2" />
                            Gestion des ventes
                        </h3>
                        <div className="d-flex align-items-center gap-2">
                            <Button variant="light" onClick={() => { fetchVentes(); fetchReferences(); }} disabled={loading}>
                                <FaSyncAlt className={loading ? "spin" : ""} />
                                <span className="ms-2">Rafraîchir</span>
                            </Button>
                            {activeTab === 'ventes' && (
                                <Button variant="success" onClick={handleAddVente} disabled={loading}>
                                    <FaPlus className="me-1" />
                                    Nouvelle vente
                                </Button>
                            )}
                        </div>
                    </div>
                </Card.Header>
                <Card.Body>
                    <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3" fill>

                        <Tab eventKey="ventes" title={<span><FaUsers className="me-2" />Ventes</span>}>
                            {error && (
                                <Alert variant="danger" onClose={() => setError(null)} dismissible className="mb-3">
                                    <FaInfoCircle className="me-2" />{error}
                                </Alert>
                            )}
                            <Row className="mb-3">
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label className="fw-bold"><FaFilter className="me-2" />Filtre par catégorie</Form.Label>
                                        <Form.Select value={selectedCategorie || ''} onChange={(e) => setSelectedCategorie(e.target.value || null)}>
                                            <option value="">Toutes les catégories</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.nom}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-bold"><FaSearch className="me-2" />Recherche</Form.Label>
                                        <InputGroup>
                                            <Form.Control type="text" placeholder="Client, N° vente ou produit..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                            {searchTerm && <Button variant="outline-secondary" onClick={() => setSearchTerm('')}>×</Button>}
                                        </InputGroup>
                                    </Form.Group>
                                </Col>
                                <Col md={2} className="d-flex align-items-end">
                                    <Button variant="outline-secondary" onClick={resetFilters} className="w-100">
                                        <FaTimes className="me-2" />Réinitialiser
                                    </Button>
                                </Col>
                            </Row>

                            {loading ? (
                                <div className="text-center py-5"><Spinner animation="border" variant="primary" /><p className="mt-2">Chargement des ventes...</p></div>
                            ) : (
                                <div className="table-responsive">
                                    <Table striped bordered hover>
                                        <thead className="table-dark">
                                            <tr>
                                                <th>N° Vente</th>
                                                <th>Client</th>
                                                <th>Catégorie</th>
                                                <th>Produits</th>
                                                <th>Date</th>
                                                <th>Montant total</th>
                                                <th>Montant payé</th>
                                                <th>Statut</th>
                                                <th style={{ width: '200px' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredVentes.length > 0 ? filteredVentes.map(vente => (
                                                <tr key={vente.id}>
                                                    <td className="fw-bold">{vente.numero}</td>
                                                    <td>{vente.client_nom}</td>
                                                    <td>
                                                        <div className="d-flex flex-wrap gap-1">
                                                            {[...new Set((vente.items || []).map(it => getCategorieName(it)))].map((cat, i) => (
                                                                <Badge key={i} bg="secondary">{cat}</Badge>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {(vente.items || []).map((it, i) => (
                                                            <div key={i} className="small">{it.products?.nom || '-'} × {it.quantite} — {formatMontant(Number(it.quantite) * Number(it.prix_unitaire))}</div>
                                                        ))}
                                                    </td>
                                                    <td>{formatDateTime(vente.date_vente)}</td>
                                                    <td className="fw-bold">{formatMontant(vente.montant_total)}</td>
                                                    <td>{formatMontant(vente.montant_paye)}</td>
                                                    <td>{getStatutBadge(vente)}</td>
                                                    <td>
                                                        <div className="d-flex gap-1 flex-wrap">
                                                            <Button variant="outline-info" size="sm" onClick={() => { setVenteDetail(vente); setShowDetailModal(true); }} title="Détail"><FaHistory /></Button>
                                                            <Button variant="outline-success" size="sm" onClick={() => handleEditVente(vente)} title="Modifier"><FaEdit /></Button>
                                                            <Button variant="outline-danger" size="sm" onClick={() => handleDeleteVente(vente)} title="Supprimer"><FaTrash /></Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan="9" className="text-center py-4"><FaInfoCircle className="me-2" />Aucune vente trouvée</td></tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            )}
                        </Tab>

                        <Tab eventKey="historique" title={<span><FaHistory className="me-2" />Historique</span>}>
                            <div className="mb-3">
                                <Form.Group>
                                    <Form.Label className="fw-bold"><FaSearch className="me-2" />Rechercher dans l'historique</Form.Label>
                                    <InputGroup>
                                        <Form.Control type="text" placeholder="Client, N° vente, produit..." value={searchTermHistorique} onChange={(e) => setSearchTermHistorique(e.target.value)} />
                                        {searchTermHistorique && <Button variant="outline-secondary" onClick={() => setSearchTermHistorique('')}>×</Button>}
                                    </InputGroup>
                                </Form.Group>
                            </div>
                            <div className="table-responsive">
                                <Table striped bordered hover>
                                    <thead className="table-dark">
                                        <tr>
                                            <th>N° Vente</th>
                                            <th>Client</th>
                                            <th>Catégorie</th>
                                            <th>Produit</th>
                                            <th>Quantité</th>
                                            <th>Prix vente</th>
                                            <th>Date</th>
                                            <th>Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historiqueRows.length > 0 ? historiqueRows.map(row => (
                                            <tr key={row.key}>
                                                <td className="fw-bold">{row.numero}</td>
                                                <td>{row.client_nom}</td>
                                                <td><Badge bg="secondary">{row.categorie}</Badge></td>
                                                <td>{row.produit}</td>
                                                <td className="text-center">{row.quantite}</td>
                                                <td>{formatMontant(row.prix)}</td>
                                                <td>{formatDate(row.date)}</td>
                                                <td>{getStatutBadge(row.vente)}</td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="8" className="text-center py-4"><FaInfoCircle className="me-2" />Aucun historique trouvé</td></tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </Tab>

                        <Tab eventKey="statistiques" title={<span><FaChartBar className="me-2" />Statistiques par catégorie</span>}>
                            <div className="mb-3">
                                <Alert variant="info"><FaInfoCircle className="me-2" />Répartition des ventes par catégorie de produit.</Alert>
                            </div>
                            <div className="table-responsive">
                                <Table striped bordered hover>
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Catégorie</th>
                                            <th className="text-center">Quantité vendue</th>
                                            <th className="text-center">Nombre de ventes</th>
                                            <th className="text-center">Montant total</th>
                                            <th className="text-center" style={{ width: '150px' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.parCategorie.length > 0 ? stats.parCategorie.map(cat => (
                                            <tr key={cat.id}>
                                                <td className="fw-bold">{cat.nom}</td>
                                                <td className="text-center">{cat.quantite > 0 ? <Badge bg="primary" pill>{cat.quantite}</Badge> : <Badge bg="secondary" pill>0</Badge>}</td>
                                                <td className="text-center">{cat.nbVentes > 0 ? <Badge bg="success" pill>{cat.nbVentes}</Badge> : <Badge bg="secondary" pill>0</Badge>}</td>
                                                <td className="text-center fw-bold">{formatMontant(cat.montant)}</td>
                                                <td className="text-center">
                                                    <Button variant="outline-primary" size="sm" onClick={() => { setSelectedCategorie(cat.id === 'sans' ? null : cat.id); setActiveTab('ventes'); }} title="Voir les ventes de cette catégorie">
                                                        <FaExchangeAlt className="me-1" />Voir
                                                    </Button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="5" className="text-center py-4"><FaInfoCircle className="me-2" />Aucune donnée disponible</td></tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                            <Card className="mt-3 bg-light">
                                <Card.Body>
                                    <Row>
                                        <Col md={4}><div className="text-center"><h6>Total catégories</h6><h3>{stats.parCategorie.length}</h3></div></Col>
                                        <Col md={4}><div className="text-center"><h6>Total ventes</h6><h3>{stats.totalVentes}</h3></div></Col>
                                        <Col md={4}><div className="text-center"><h6>Montant total</h6><h3>{formatMontant(stats.montantTotal)}</h3></div></Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Tab>
                    </Tabs>
                </Card.Body>
            </Card>

            <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{isEditing ? 'Modifier' : 'Ajouter'} une vente</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Client *</Form.Label>
                                    <Form.Control type="text" value={currentVente.client_nom} onChange={(e) => setCurrentVente(prev => ({ ...prev, client_nom: e.target.value }))} placeholder="Nom du client" disabled={isUpdating} />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Date *</Form.Label>
                                    <Form.Control type="date" value={currentVente.date_vente} onChange={(e) => setCurrentVente(prev => ({ ...prev, date_vente: e.target.value }))} disabled={isUpdating} />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Montant payé</Form.Label>
                                    <Form.Control type="number" value={currentVente.montant_paye} onChange={(e) => setCurrentVente(prev => ({ ...prev, montant_paye: e.target.value }))} disabled={isUpdating} />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Alert variant="info"><small><FaInfoCircle className="me-2" />Le prix de vente se saisit manuellement. Ne jamais utiliser le prix d'achat comme prix de vente.</small></Alert>

                        <Row>
                            <Col md={5}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Produit *</Form.Label>
                                    <Form.Select value={ligneForm.produit_id} onChange={(e) => handleProduitChange(e.target.value)} disabled={isUpdating}>
                                        <option value="">Sélectionner un produit</option>
                                        {produits.map(p => (
                                            <option key={p.id} value={p.id}>{p.nom} — {p.categories?.nom || p.sous_categories?.nom || ''}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={2}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Quantité</Form.Label>
                                    <Form.Control type="number" min="1" value={ligneForm.quantite} onChange={(e) => setLigneForm(prev => ({ ...prev, quantite: e.target.value }))} disabled={isUpdating} />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Prix de vente *</Form.Label>
                                    <Form.Control type="number" min="0" value={ligneForm.prix_vente} onChange={(e) => setLigneForm(prev => ({ ...prev, prix_vente: e.target.value }))} placeholder="Prix de vente" disabled={isUpdating} />
                                </Form.Group>
                            </Col>
                            <Col md={2} className="d-flex align-items-end">
                                <Button variant="success" className="w-100 mb-3" onClick={handleAddLigne} disabled={isUpdating}><FaPlus className="me-1" />Ajouter</Button>
                            </Col>
                        </Row>

                        <div className="table-responsive">
                            <Table striped bordered hover size="sm">
                                <thead className="table-dark">
                                    <tr><th>Produit</th><th>Catégorie</th><th>Qté</th><th>Prix vente</th><th>Total</th><th></th></tr>
                                </thead>
                                <tbody>
                                    {(currentVente.items || []).length > 0 ? currentVente.items.map((it, i) => (
                                        <tr key={i}>
                                            <td>{it.produit_nom}</td>
                                            <td><Badge bg="secondary">{it.categorie}</Badge></td>
                                            <td className="text-center">{it.quantite}</td>
                                            <td>{formatMontant(it.prix_vente)}</td>
                                            <td className="fw-bold">{formatMontant(Number(it.quantite) * Number(it.prix_vente))}</td>
                                            <td><Button variant="outline-danger" size="sm" onClick={() => handleRemoveLigne(i)}><FaTimes /></Button></td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="6" className="text-center">Aucun produit ajouté</td></tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Observation</Form.Label>
                                    <Form.Control as="textarea" rows={2} value={currentVente.observation} onChange={(e) => setCurrentVente(prev => ({ ...prev, observation: e.target.value }))} placeholder="Observation..." disabled={isUpdating} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Alert variant="light" className="border">
                                    <div className="d-flex justify-content-between"><span>Total :</span><strong>{formatMontant(totalVenteEnCours)}</strong></div>
                                    <div className="d-flex justify-content-between"><span>Payé :</span><strong>{formatMontant(currentVente.montant_paye)}</strong></div>
                                </Alert>
                            </Col>
                        </Row>
                        {error && <Alert variant="danger">{error}</Alert>}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddModal(false)} disabled={isUpdating}>Annuler</Button>
                    <Button variant="primary" onClick={submitVente} disabled={isUpdating || !currentVente.client_nom || (currentVente.items || []).length === 0}>
                        {isUpdating ? <Spinner size="sm" /> : (isEditing ? 'Modifier' : 'Ajouter')}
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title><FaTrash className="me-2" />Confirmer la suppression</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {venteToDelete && <p>Voulez-vous supprimer la vente <strong>{venteToDelete.numero} - {venteToDelete.client_nom}</strong> ?</p>}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={isUpdating}>Annuler</Button>
                    <Button variant="danger" onClick={confirmDelete} disabled={isUpdating}>{isUpdating ? <Spinner size="sm" /> : 'Supprimer'}</Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title><FaHistory className="me-2" />Détail de la vente - {venteDetail?.numero}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {venteDetail && (
                        <>
                            <p><strong>Client:</strong> {venteDetail.client_nom}<br /><strong>Date:</strong> {formatDateTime(venteDetail.date_vente)}<br /><strong>Observation:</strong> {venteDetail.observation || '-'}</p>
                            <div className="table-responsive">
                                <Table striped bordered hover size="sm">
                                    <thead className="table-dark">
                                        <tr><th>Produit</th><th>Catégorie</th><th>Qté</th><th>Prix vente</th><th>Total</th></tr>
                                    </thead>
                                    <tbody>
                                        {(venteDetail.items || []).map((it, i) => (
                                            <tr key={i}>
                                                <td>{it.products?.nom || '-'}</td>
                                                <td><Badge bg="secondary">{getCategorieName(it)}</Badge></td>
                                                <td className="text-center">{it.quantite}</td>
                                                <td>{formatMontant(it.prix_unitaire)}</td>
                                                <td className="fw-bold">{formatMontant(Number(it.quantite) * Number(it.prix_unitaire))}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                            <div className="d-flex justify-content-between"><span>Total :</span><strong>{formatMontant(venteDetail.montant_total)}</strong></div>
                            <div className="d-flex justify-content-between"><span>Payé :</span><strong>{formatMontant(venteDetail.montant_paye)}</strong></div>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetailModal(false)}>Fermer</Button>
                </Modal.Footer>
            </Modal>

            <style>{`
                @media (max-width: 768px) {
                    .container-fluid { padding: 10px !important; }
                    .card-body .d-flex { flex-wrap: wrap; }
                    .table-responsive table { font-size: 13px; }
                    .table-responsive th, .table-responsive td { padding: 6px 4px !important; white-space: nowrap; }
                }
            `}</style>
        </div>
    );
};

export default Ventes;