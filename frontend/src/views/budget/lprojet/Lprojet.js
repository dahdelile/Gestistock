// src/components/listBudget/lprojet/Lprojet.js
import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Card, Spinner, Alert, Badge, Row, Col } from 'react-bootstrap';
import BudgetProjet from '../../budget/budgetProjet/BudgetProjet';

// ============================================
// GESTION DES VARIABLES D'ENVIRONNEMENT - PRODUCTION
// ============================================

// URLs de production HARDCODÉES - SANS TRAILING SLASH
const API_BASE_URL = 'https://intranet-attm.com/api';
const APP_URL = 'https://intranet-attm.com';

// URLs spécifiques
const PROJETS_URL = `${API_BASE_URL}/projets`;
const BUDGETS_URL = `${API_BASE_URL}/budgets`;
const AUTH_API_URL = 'https://intranet-attm.com/api';

// Version de l'application
const APP_VERSION = '2.0.0';

// ============================================
// FONCTION POUR LES REQUÊTES AVEC TOKEN
// ============================================
const fetchWithToken = async (url, options = {}) => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    
    const defaultOptions = {
        headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Application-Version': APP_VERSION
        },
    };

    if (options.body instanceof FormData) {
        delete defaultOptions.headers['Content-Type'];
    }

    try {
        console.log(`🌐 Tentative de fetch: ${url}`);
        
        const response = await fetch(url, {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers,
            },
        });

        console.log(`📡 Réponse de ${url}:`, {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
        });

        if (!response.ok) {
            let errorMessage = `Erreur HTTP: ${response.status}`;
            try {
                const errorData = await response.json();
                console.error('❌ Détails erreur:', errorData);
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch {
                const text = await response.text();
                if (text) console.error('❌ Réponse non-JSON:', text.substring(0, 200));
            }
            throw new Error(errorMessage);
        }

        return response;
    } catch (error) {
        console.error('❌ Erreur fetch:', error);
        throw error;
    }
};

const Lprojet = () => {
    // ============================================
    // GESTION DES RÔLES UTILISATEUR
    // ============================================
    const [userRole, setUserRole] = useState(null);
    const [userLoading, setUserLoading] = useState(true);
    const [authError, setAuthError] = useState(null);

    // ✅ FONCTIONS DE VÉRIFICATION DES RÔLES
    const isAdmin = () => userRole === 'admin' || userRole === 'administrateur';
    const isChefProjet = () => userRole === 'chef_projet' || userRole === 'chef_pro';
    const canEdit = () => isAdmin() || isChefProjet();

    // Charger le rôle utilisateur au montage
    useEffect(() => {
        const fetchUserRole = async () => {
            try {
                setUserLoading(true);
                
                // Vérifier dans localStorage
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    try {
                        const userData = JSON.parse(storedUser);
                        const role = userData.role || userData.roles?.[0] || 'user';
                        setUserRole(role);
                        setUserLoading(false);
                        return;
                    } catch (e) {
                        console.error("Erreur parsing user:", e);
                    }
                }

                // Vérifier le token et appeler l'API
                const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
                if (token) {
                    const response = await fetch(`${AUTH_API_URL}/user`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const userData = await response.json();
                        const role = userData.role || userData.roles?.[0] || 'user';
                        setUserRole(role);

                        localStorage.setItem('user', JSON.stringify({
                            id: userData.id,
                            email: userData.email,
                            name: userData.name,
                            role: role
                        }));
                    } else {
                        setUserRole('user');
                    }
                } else {
                    setUserRole('user');
                }
            } catch (err) {
                console.error('Erreur récupération rôle:', err);
                setAuthError('Impossible de vérifier les permissions');
                setUserRole('user');
            } finally {
                setUserLoading(false);
            }
        };

        fetchUserRole();
    }, []);

    const [projets, setProjets] = useState([]);
    const [selectedProjet, setSelectedProjet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [budgetsStats, setBudgetsStats] = useState({});
    const [toasts, setToasts] = useState([]);

    // ============================================
    // FONCTIONS DE TRAITEMENT DES DONNÉES API
    // ============================================

    const extractDataFromResponse = (data) => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (data.data && Array.isArray(data.data)) return data.data;
        if (data.success && data.data && Array.isArray(data.data)) return data.data;
        if (typeof data === 'object') {
            for (let key in data) {
                if (Array.isArray(data[key])) return data[key];
            }
            if (data.id) return [data];
        }
        return [];
    };

    const showToast = (message, variant = 'success') => {
        const newToast = { id: Date.now(), message, variant };
        setToasts(prev => [...prev, newToast]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== newToast.id));
        }, 5000);
    };

    // Charger la liste des projets
    useEffect(() => {
        fetchProjets();
    }, []);

    const fetchProjets = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔄 Chargement des projets...');
            console.log('📡 URL projets:', PROJETS_URL);

            const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
            const headers = {
                'Authorization': token ? `Bearer ${token}` : '',
                'Accept': 'application/json'
            };

            // Charger les projets
            const response = await fetch(PROJETS_URL, { headers });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Projets chargés:', data);

            const projetsData = extractDataFromResponse(data);
            setProjets(projetsData);

            // Charger les statistiques de budgets pour chaque projet
            await fetchBudgetsStats(projetsData, headers);

        } catch (err) {
            console.error('❌ Erreur lors du chargement des projets:', err);
            const errorMessage = err.message || 'Erreur de chargement';
            setError(`Échec du chargement : ${errorMessage}`);
            showToast(errorMessage, 'danger');
        } finally {
            setLoading(false);
        }
    };

    const fetchBudgetsStats = async (projetsData, headers) => {
        try {
            const stats = {};

            // Pour chaque projet, compter les budgets
            for (const projet of projetsData) {
                try {
                    console.log(`📊 Chargement budgets pour projet ${projet.id}...`);
                    
                    const budgetsResponse = await fetch(`${BUDGETS_URL}/projet/${projet.id}`, { headers });

                    if (budgetsResponse.ok) {
                        const data = await budgetsResponse.json();
                        const budgetsData = extractDataFromResponse(data);

                        stats[projet.id] = {
                            count: budgetsData.length,
                            total: budgetsData.reduce((sum, budget) => sum + (parseFloat(budget.montant_sous_category) || 0), 0)
                        };
                    } else {
                        console.warn(`⚠️ Aucun budget pour le projet ${projet.id}`);
                        stats[projet.id] = { count: 0, total: 0 };
                    }
                } catch (budgetError) {
                    console.warn(`⚠️ Erreur budgets pour le projet ${projet.id}:`, budgetError.message);
                    stats[projet.id] = { count: 0, total: 0 };
                }
            }

            setBudgetsStats(stats);
            console.log('📊 Statistiques budgets:', stats);

        } catch (err) {
            console.error('❌ Erreur statistiques budgets:', err);
        }
    };

    const handleVoirBudget = (projet) => {
        console.log('📋 Sélection du projet:', projet);
        setSelectedProjet(projet);
    };

    const handleRetour = () => {
        setSelectedProjet(null);
        // Recharger les données pour mettre à jour les statistiques
        fetchProjets();
    };

    // Fonction pour formater le montant
    const formatMontant = (montant) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'MRO',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(montant);
    };

    // ============================================
    // RENDU DU COMPOSANT
    // ============================================

    // Afficher le chargement pendant la vérification du rôle
    if (userLoading) {
        return (
            <Container className="mt-4 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Vérification des permissions...</p>
            </Container>
        );
    }

    // Si un projet est sélectionné, afficher le composant BudgetProjet
    if (selectedProjet) {
        return (
            <BudgetProjet 
                projetId={selectedProjet.id}
                projetData={selectedProjet}
                onRetour={handleRetour}
                onBudgetSaved={() => {
                    console.log('✅ Budget sauvegardé → Rechargement des données...');
                    fetchProjets(); // Recharge les projets et statistiques
                }}
                userRole={userRole}
                canEdit={canEdit}
            />
        );
    }

    return (
        <Container className="mt-4">
            {/* TITRE PRINCIPAL AVEC BADGE DE RÔLE */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="text-primary" style={{ fontWeight: 'bold' }}>
                        📊 Gestion des Budgets par Projet
                    </h2>
                    <div className="d-flex align-items-center gap-3">
                        <Badge bg={canEdit() ? 'success' : 'secondary'} className="px-3 py-2">
                            {canEdit() ? '👑 Administrateur / Chef de projet' : '👤 Consultation seule'}
                        </Badge>
                        <small className="text-muted">API: {API_BASE_URL}</small>
                    </div>
                    <p className="text-muted mt-2">Consultez et gérez les budgets de tous vos projets</p>
                </div>
            </div>

            {/* STATISTIQUES GLOBALES */}
            {!loading && projets.length > 0 && (
                <Row className="mb-4">
                    <Col md={4}>
                        <Card className="text-center border-0 bg-light">
                            <Card.Body>
                                <h5 className="card-title text-primary">{projets.length}</h5>
                                <p className="card-text">Projets</p>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="text-center border-0 bg-light">
                            <Card.Body>
                                <h5 className="card-title text-success">
                                    {Object.values(budgetsStats).reduce((sum, stat) => sum + stat.count, 0)}
                                </h5>
                                <p className="card-text">Lignes Budgétaires</p>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="text-center border-0 bg-light">
                            <Card.Body>
                                <h5 className="card-title text-info">
                                    {formatMontant(Object.values(budgetsStats).reduce((sum, stat) => sum + stat.total, 0))}
                                </h5>
                                <p className="card-text">Budget Total</p>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* CARTE PRINCIPALE */}
            <Card className="shadow-sm">
                <Card.Header className="bg-info text-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                        📋 Liste des Projets
                    </h5>
                    <Button 
                        variant="light" 
                        size="sm" 
                        onClick={fetchProjets}
                        disabled={loading}
                    >
                        {loading ? '🔄' : '🔄'} Actualiser
                    </Button>
                </Card.Header>

                <Card.Body>
                    {error && (
                        <Alert variant="danger" className="mb-3">
                            <Alert.Heading>Erreur de Chargement</Alert.Heading>
                            <p>{error}</p>
                            <div className="d-flex gap-2">
                                <Button variant="primary" onClick={fetchProjets}>
                                    🔁 Réessayer
                                </Button>
                                <Button variant="outline-secondary" onClick={() => setError(null)}>
                                    Ignorer
                                </Button>
                            </div>
                        </Alert>
                    )}

                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-2">Chargement des projets...</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table striped bordered hover>
                                <thead className="table-light">
                                    <tr>
                                        <th>Nom du Projet</th>
                                        <th className="text-center">Budgets</th>
                                        <th className="text-center">Montant Total</th>
                                        <th className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projets.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="text-center text-muted py-4">
                                                <div>
                                                    <p>📭 Aucun projet trouvé</p>
                                                    <small>Les projets apparaîtront ici une fois créés dans le système.</small>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        projets.map(projet => {
                                            const stats = budgetsStats[projet.id] || { count: 0, total: 0 };

                                            return (
                                                <tr key={projet.id}>
                                                    <td>
                                                        <div>
                                                            <strong>{projet.name}</strong>
                                                            {projet.description && (
                                                                <small className="d-block text-muted">
                                                                    {projet.description}
                                                                </small>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="text-center">
                                                        <Badge bg={stats.count > 0 ? 'success' : 'secondary'}>
                                                            {stats.count} ligne{stats.count > 1 ? 's' : ''}
                                                        </Badge>
                                                    </td>
                                                    <td className="text-center">
                                                        <strong className={stats.total > 0 ? "text-success" : "text-muted"}>
                                                            {formatMontant(stats.total)}
                                                        </strong>
                                                    </td>
                                                    <td className="text-center">
                                                        <Button
                                                            variant={stats.count > 0 ? "primary" : "outline-primary"}
                                                            size="sm"
                                                            onClick={() => handleVoirBudget(projet)}
                                                            className="me-1"
                                                            disabled={!canEdit() && stats.count === 0}
                                                            title={!canEdit() && stats.count === 0 ? "Seuls les administrateurs peuvent créer des budgets" : ""}
                                                        >
                                                            {stats.count > 0 ? "📊 Gérer Budget" : "➕ Créer Budget"}
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* INFORMATION */}
            {!loading && projets.length > 0 && (
                <div className="text-center mt-3">
                    <small className="text-muted">
                        👉 Cliquez sur "Gérer Budget" pour consulter et modifier le budget de chaque projet.
                    </small>
                    {!canEdit() && (
                        <div className="mt-2">
                            <Badge bg="warning" text="dark">
                                Mode lecture seule - Seuls les administrateurs peuvent modifier les budgets
                            </Badge>
                        </div>
                    )}
                </div>
            )}
        </Container>
    );
};

export default Lprojet;