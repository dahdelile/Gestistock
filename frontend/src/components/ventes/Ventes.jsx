import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    Table, Button, Card, Spinner,
    Badge, Form, Modal, Toast, ToastContainer,
    Alert, Row, Col, InputGroup, Tabs, Tab
} from 'react-bootstrap';
import {
    FaFilter, FaExchangeAlt, FaInfoCircle,
    FaSyncAlt, FaUserTie, FaCalendarAlt,
    FaPlus, FaEdit, FaTrash, FaCar, FaSearch,
    FaLock, FaUserShield, FaUser, FaTimes,
    FaHistory, FaCheck, FaBan, FaChartPie,
    FaUsers, FaExchangeAlt as FaExchange,
    FaChartBar, FaExclamationTriangle, FaWarning,
    FaArrowRight, FaRedoAlt
} from 'react-icons/fa';

// ============================================
// GESTION DES VARIABLES D'ENVIRONNEMENT
// ============================================
const API_BASE_URL = 'https://intranet-attm.com/api';
const CHAUFFEURS_URL = `${API_BASE_URL}/chauffeurs`;
const PROJETS_URL = `${API_BASE_URL}/projets`;
const VOITURES_URL = `${API_BASE_URL}/voitures`;
const AFFECTATIONS_URL = `${API_BASE_URL}/affectations-chauffeurs`;
const AUTH_API_URL = 'https://intranet-attm.com/api';

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
        },
    };
    if (options.body instanceof FormData) {
        delete defaultOptions.headers['Content-Type'];
    }
    const response = await fetch(url, {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    });
    
    if (!response.ok) {
        let errorMessage = `Erreur HTTP: ${response.status}`;
        try {
            const errorData = await response.json();
            console.error('🔴 Erreur API détaillée:', {
                status: response.status,
                url: url,
                data: errorData
            });
            
            if (response.status === 500) {
                errorMessage = errorData.message || 'Erreur serveur interne. Contactez l\'administrateur.';
            } else if (response.status === 401) {
                errorMessage = 'Session expirée. Veuillez vous reconnecter.';
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            } else if (response.status === 403) {
                errorMessage = 'Accès refusé. Permissions insuffisantes.';
            } else if (response.status === 409) {
                errorMessage = errorData.message || 'Conflit: Cette ressource est déjà utilisée.';
            } else if (response.status === 422) {
                errorMessage = 'Erreurs de validation:\n';
                if (errorData.errors) {
                    Object.keys(errorData.errors).forEach(field => {
                        errorMessage += `• ${field}: ${errorData.errors[field].join(', ')}\n`;
                    });
                }
            } else {
                errorMessage = errorData.message || errorData.error || errorMessage;
            }
        } catch (e) {
            const text = await response.text();
            console.error('🔴 Réponse brute:', text);
            errorMessage = `Erreur ${response.status}: ${text || 'Erreur inconnue'}`;
        }
        throw new Error(errorMessage);
    }
    return response;
};

// ============================================
// FONCTION D'EXTRACTION SÉCURISÉE DES DONNÉES
// ============================================
const extractDataFromResponse = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.data && Array.isArray(data.data)) return data.data;
    if (data.success && data.data && Array.isArray(data.data)) return data.data;
    if (typeof data === 'object' && data !== null) {
        for (let key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key) && Array.isArray(data[key])) {
                return data[key];
            }
        }
    }
    console.warn('Format de données inattendu:', data);
    return [];
};

// ============================================
// FONCTION DE TRI PAR MATRICULE
// ============================================
const sortByMatricule = (data, matriculeAccessor) => {
    if (!data || !Array.isArray(data)) return [];
    return [...data].sort((a, b) => {
        const getMatricule = (item) => {
            if (typeof matriculeAccessor === 'function') {
                return matriculeAccessor(item)?.toString() || '';
            }
            if (typeof matriculeAccessor === 'string') {
                return item[matriculeAccessor]?.toString() || '';
            }
            return item?.toString() || '';
        };
        const matA = getMatricule(a);
        const matB = getMatricule(b);
        if (!isNaN(matA) && !isNaN(matB)) {
            return parseInt(matA) - parseInt(matB);
        }
        return matA.localeCompare(matB, undefined, { numeric: true, sensitivity: 'base' });
    });
};

// ============================================
// COMPOSANT DE RECHERCHE DE VOITURE AVEC AJOUT
// ============================================
const VoitureSearchWithAdd = ({ 
    value, 
    onChange, 
    voitures, 
    onAddVoiture, 
    disabled, 
    label = "Véhicule *",
    placeholder = "Rechercher ou créer un véhicule...",
    showToast
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [newVoiture, setNewVoiture] = useState({
        matricule: '',
        marque: '',
        modele: '',
        site: '',
        compteur_actuel: 0
    });
    const dropdownRef = useRef(null);

    const filteredVoitures = useMemo(() => {
        if (!searchTerm.trim()) return voitures.slice(0, 10);
        const term = searchTerm.toLowerCase();
        return voitures.filter(v => 
            v.matricule?.toLowerCase().includes(term) ||
            v.marque?.toLowerCase().includes(term) ||
            v.modele?.toLowerCase().includes(term)
        ).slice(0, 15);
    }, [searchTerm, voitures]);

    const selectedVoiture = useMemo(() => {
        return voitures.find(v => v.id == value);
    }, [value, voitures]);

    useEffect(() => {
        if (selectedVoiture) {
            setSearchTerm(`${selectedVoiture.matricule} - ${selectedVoiture.marque || ''} ${selectedVoiture.modele || ''}`.trim());
        } else if (!value) {
            setSearchTerm('');
        }
    }, [selectedVoiture, value]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectVoiture = (voiture) => {
        const event = { target: { name: 'voiture_id', value: voiture.id } };
        onChange(event);
        setSearchTerm(`${voiture.matricule} - ${voiture.marque || ''} ${voiture.modele || ''}`.trim());
        setShowDropdown(false);
    };

    const handleInputChange = (e) => {
        setSearchTerm(e.target.value);
        setShowDropdown(true);
        if (e.target.value === '') {
            onChange({ target: { name: 'voiture_id', value: '' } });
        }
    };

    const handleClearSelection = () => {
        setSearchTerm('');
        onChange({ target: { name: 'voiture_id', value: '' } });
    };

    const handleAddNewVoiture = async () => {
        if (!newVoiture.matricule.trim()) {
            if (showToast) showToast('Le matricule est obligatoire', 'warning');
            return;
        }
        
        setIsAdding(true);
        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
            const response = await fetch(VOITURES_URL, {
                method: 'POST',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    matricule: newVoiture.matricule.trim(),
                    marque: newVoiture.marque || null,
                    modele: newVoiture.modele || null,
                    site: newVoiture.site || null,
                    compteur_actuel: parseFloat(newVoiture.compteur_actuel) || 0
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || `Erreur: ${response.status}`);
            }

            const data = await response.json();
            const voitureCreee = data.data || data;
            
            if (onAddVoiture) {
                onAddVoiture(voitureCreee);
            }
            
            handleSelectVoiture(voitureCreee);
            setShowAddModal(false);
            setNewVoiture({
                matricule: '',
                marque: '',
                modele: '',
                site: '',
                compteur_actuel: 0
            });
            
            if (showToast) {
                showToast(`Véhicule ${voitureCreee.matricule} ajouté avec succès`, 'success');
            }
        } catch (err) {
            console.error('[ERROR] Erreur création voiture:', err);
            if (showToast) {
                showToast(`Erreur: ${err.message}`, 'danger');
            }
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <>
            <div className="position-relative" ref={dropdownRef}>
                <Form.Group className="mb-3">
                    <Form.Label><strong>{label}</strong></Form.Label>
                    <div className="d-flex gap-2">
                        <div className="position-relative flex-grow-1">
                            <InputGroup>
                                <Form.Control
                                    type="text"
                                    placeholder={placeholder}
                                    value={searchTerm}
                                    onChange={handleInputChange}
                                    onFocus={() => setShowDropdown(true)}
                                    disabled={disabled}
                                    className={selectedVoiture ? 'border-success' : ''}
                                />
                                {selectedVoiture && (
                                    <InputGroup.Text className="text-success">
                                        <FaCheck />
                                    </InputGroup.Text>
                                )}
                                {!selectedVoiture && searchTerm && !disabled && (
                                    <Button
                                        variant="outline-primary"
                                        onClick={() => setShowAddModal(true)}
                                        title="Créer un nouveau véhicule"
                                    >
                                        <FaPlus />
                                    </Button>
                                )}
                            </InputGroup>
                        </div>
                        {selectedVoiture && (
                            <Button variant="outline-secondary" size="sm" onClick={handleClearSelection}>
                                <FaTimes />
                            </Button>
                        )}
                    </div>
                    
                    {showDropdown && filteredVoitures.length > 0 && (
                        <div className="position-absolute bg-white border rounded shadow-sm w-100 mt-1" style={{ zIndex: 1000, maxHeight: '300px', overflowY: 'auto' }}>
                            {filteredVoitures.map(voiture => (
                                <div 
                                    key={voiture.id} 
                                    className="p-2 border-bottom d-flex justify-content-between align-items-center" 
                                    onClick={() => handleSelectVoiture(voiture)} 
                                    style={{ cursor: 'pointer' }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                                >
                                    <div>
                                        <span className="fw-bold">{voiture.matricule}</span>
                                        <span className="ms-2 text-muted">{voiture.marque || ''} {voiture.modele || ''}</span>
                                    </div>
                                    {voiture.site && <Badge bg="secondary">{voiture.site}</Badge>}
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {showDropdown && filteredVoitures.length === 0 && searchTerm && (
                        <div className="position-absolute bg-white border rounded shadow-sm w-100 mt-1" style={{ zIndex: 1000 }}>
                            <div className="p-3 text-center">
                                <FaSearch className="text-muted me-2" />
                                <span className="text-muted">Aucun véhicule trouvé</span>
                                <Button 
                                    variant="outline-primary" 
                                    size="sm" 
                                    className="ms-2"
                                    onClick={() => setShowAddModal(true)}
                                >
                                    <FaPlus className="me-1" />
                                    Créer "{searchTerm}"
                                </Button>
                            </div>
                        </div>
                    )}
                </Form.Group>
            </div>

            {/* Modal d'ajout de véhicule */}
            <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
                <Modal.Header closeButton className="bg-primary text-white">
                    <Modal.Title>
                        <FaCar className="me-2" />
                        Ajouter un nouveau véhicule
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Matricule *</Form.Label>
                            <Form.Control
                                type="text"
                                value={newVoiture.matricule}
                                onChange={(e) => setNewVoiture(prev => ({ ...prev, matricule: e.target.value }))}
                                placeholder="Ex: CH-001"
                                disabled={isAdding}
                            />
                        </Form.Group>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Marque</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newVoiture.marque}
                                        onChange={(e) => setNewVoiture(prev => ({ ...prev, marque: e.target.value }))}
                                        placeholder="Ex: Toyota"
                                        disabled={isAdding}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Modèle</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newVoiture.modele}
                                        onChange={(e) => setNewVoiture(prev => ({ ...prev, modele: e.target.value }))}
                                        placeholder="Ex: Hilux"
                                        disabled={isAdding}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Site</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newVoiture.site}
                                        onChange={(e) => setNewVoiture(prev => ({ ...prev, site: e.target.value }))}
                                        placeholder="Ex: Site A"
                                        disabled={isAdding}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Compteur actuel (km)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={newVoiture.compteur_actuel}
                                        onChange={(e) => setNewVoiture(prev => ({ ...prev, compteur_actuel: parseFloat(e.target.value) || 0 }))}
                                        min="0"
                                        step="1"
                                        disabled={isAdding}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Alert variant="info">
                            <small>
                                <FaInfoCircle className="me-2" />
                                Le véhicule sera automatiquement sélectionné après création.
                            </small>
                        </Alert>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddModal(false)} disabled={isAdding}>
                        Annuler
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleAddNewVoiture} 
                        disabled={!newVoiture.matricule.trim() || isAdding}
                    >
                        {isAdding ? <Spinner size="sm" className="me-2" /> : <FaPlus className="me-2" />}
                        Ajouter le véhicule
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
const ChauffeurManager = () => {
    // ============================================
    // GESTION DES RÔLES UTILISATEUR
    // ============================================
    const [userRole, setUserRole] = useState(null);
    const [userLoading, setUserLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('chauffeurs');
    
    const isAdmin = () => userRole === 'admin' || userRole === 'administrateur';
    const isChefEnt = () => userRole === 'chef_ent' || userRole === 'chef_entreprise';
    const isDM = () => userRole === 'DM' || userRole === 'dm';
    const canEdit = () => isAdmin() || isDM() || isChefEnt();
    
    useEffect(() => {
        const fetchUserRole = async () => {
            try {
                setUserLoading(true);
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
                            role: role
                        }));
                    } else {
                        setUserRole('user');
                    }
                } else {
                    setUserRole('user');
                }
            } catch (err) {
                console.error("Erreur récupération rôle:", err);
                setUserRole('user');
            } finally {
                setUserLoading(false);
            }
        };
        fetchUserRole();
    }, []);
    
    const canAdd = useCallback(() => canEdit(), [userRole]);
    const canDelete = useCallback(() => canEdit(), [userRole]);
    
    // ============================================
    // ÉTATS PRINCIPAUX
    // ============================================
    const [chauffeurs, setChauffeurs] = useState([]);
    const [projets, setProjets] = useState([]);
    const [voitures, setVoitures] = useState([]);
    const [affectations, setAffectations] = useState([]);
    const [historiqueGlobal, setHistoriqueGlobal] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [stats, setStats] = useState({
        totalChauffeurs: 0,
        totalVoitures: 0,
        totalAffectations: 0,
        affectationsActives: 0,
        parProjet: []
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [searchTermAffectations, setSearchTermAffectations] = useState('');
    const [searchTermHistorique, setSearchTermHistorique] = useState('');
    const [showAffectationModal, setShowAffectationModal] = useState(false);
    const [affectationForm, setAffectationForm] = useState({
        chauffeur_id: '',
        voiture_id: '',
        projet_id: '',
        date_debut: new Date().toISOString().split('T')[0],
        date_fin: ''
    });
    const [showFinAffectationModal, setShowFinAffectationModal] = useState(false);
    const [selectedAffectation, setSelectedAffectation] = useState(null);
    const [motifFin, setMotifFin] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [currentChauffeur, setCurrentChauffeur] = useState({
        id: null,
        matricule: '',
        nom: '',
        statut: 'ACTIF',
        projet_id: '',
        voiture_id: '',
        date_affectation: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [chauffeurToDelete, setChauffeurToDelete] = useState(null);
    const [showHistoriqueModal, setShowHistoriqueModal] = useState(false);
    const [historiqueIndividuel, setHistoriqueIndividuel] = useState([]);
    const [historiqueType, setHistoriqueType] = useState('');
    const [historiqueTitre, setHistoriqueTitre] = useState('');
    
    // ============================================
    // ÉTATS POUR L'AJOUT DE VÉHICULE
    // ============================================
    const [showAddVehiculeModal, setShowAddVehiculeModal] = useState(false);
    const [newVehicule, setNewVehicule] = useState({
        matricule: '',
        marque: '',
        modele: '',
        site: '',
        compteur_actuel: 0
    });
    const [isAddingVehicule, setIsAddingVehicule] = useState(false);
    
    // MODALS DE RÉAFFECTATION
    const [showChangeProjetModal, setShowChangeProjetModal] = useState(false);
    const [showChangeVoitureModal, setShowChangeVoitureModal] = useState(false);
    const [showChangeChauffeurModal, setShowChangeChauffeurModal] = useState(false);
    const [selectedChauffeurForChange, setSelectedChauffeurForChange] = useState(null);
    const [selectedVoitureForChange, setSelectedVoitureForChange] = useState(null);
    const [changeForm, setChangeForm] = useState({
        nouveau_projet_id: '',
        nouvelle_voiture_id: '',
        nouveau_chauffeur_id: '',
        date_debut: new Date().toISOString().split('T')[0],
        motif: ''
    });
    const [existingAssignment, setExistingAssignment] = useState(null);
    
    // ============================================
    // FONCTIONS UTILITAIRES
    // ============================================
    const formatDate = (dateString) => {
        if (!dateString) return 'Non spécifiée';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    };
    
    const formatDateTime = (dateString) => {
        if (!dateString) return 'Non spécifiée';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    };
    
    const showToast = (message, variant = 'success') => {
        const newToast = { id: Date.now(), message, variant };
        setToasts(prev => [...prev, newToast]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== newToast.id));
        }, 5000);
    };
    
    const getVoitureInfo = (voitureData) => {
        if (!voitureData) return 'Non affecté';
        if (typeof voitureData === 'object' && voitureData?.matricule) return voitureData.matricule;
        if (typeof voitureData === 'number' || typeof voitureData === 'string') {
            const voiture = Array.isArray(voitures) ? voitures.find(v => v?.id == voitureData) : null;
            return voiture?.matricule || 'Inconnu';
        }
        return 'Non affecté';
    };
    
    const getProjetName = (projetData) => {
        if (!projetData) return 'Non affecté';
        if (typeof projetData === 'object' && projetData?.name) return projetData.name;
        if (typeof projetData === 'number' || typeof projetData === 'string') {
            const projet = Array.isArray(projets) ? projets.find(p => p?.id == projetData) : null;
            return projet?.name || 'Inconnu';
        }
        return 'Non affecté';
    };
    
    const getStatutBadge = (statut) => {
        switch(statut) {
            case 'ACTIF': return <Badge bg="success">Actif</Badge>;
            case 'INACTIF': return <Badge bg="danger">Inactif</Badge>;
            default: return <Badge bg="secondary">{statut || 'Inconnu'}</Badge>;
        }
    };
    
    const getAffectationStatutBadge = (affectation) => {
        if (!affectation) return <Badge bg="secondary">Inconnu</Badge>;
        const now = new Date();
        const dateFin = affectation.date_fin ? new Date(affectation.date_fin) : null;
        
        if (affectation.statut === 'terminee' || (dateFin && dateFin < now)) {
            return <Badge bg="danger">Terminée</Badge>;
        }
        if (new Date(affectation.date_debut) > now) {
            return <Badge bg="warning">À venir</Badge>;
        }
        return <Badge bg="success">Active</Badge>;
    };
    
    // ============================================
    // FONCTIONS DE VÉRIFICATION
    // ============================================
    const getAvailableChauffeurs = useCallback(() => {
        return chauffeurs.filter(c => c.statut === 'ACTIF');
    }, [chauffeurs]);
    
    const getAvailableVoitures = useCallback(() => {
        return voitures;
    }, [voitures]);
    
    const getChauffeurAssignment = useCallback((chauffeurId) => {
        const now = new Date();
        return affectations.find(a => 
            a.chauffeur_id == chauffeurId && 
            a.statut === 'active' && 
            (!a.date_fin || new Date(a.date_fin) >= now)
        );
    }, [affectations]);
    
    const getVoitureAssignment = useCallback((voitureId) => {
        const now = new Date();
        return affectations.find(a => 
            a.voiture_id == voitureId && 
            a.statut === 'active' && 
            (!a.date_fin || new Date(a.date_fin) >= now)
        );
    }, [affectations]);
    
    const getActiveAssignmentForChauffeur = useCallback((chauffeurId) => {
        const now = new Date();
        return affectations.find(a => 
            a.chauffeur_id == chauffeurId && 
            a.statut === 'active' && 
            (!a.date_fin || new Date(a.date_fin) >= now)
        );
    }, [affectations]);
    
    const getActiveAssignmentForVoiture = useCallback((voitureId) => {
        const now = new Date();
        return affectations.find(a => 
            a.voiture_id == voitureId && 
            a.statut === 'active' && 
            (!a.date_fin || new Date(a.date_fin) >= now)
        );
    }, [affectations]);
    
    // ============================================
    // CHARGEMENT DES DONNÉES
    // ============================================
    const loadReferences = async () => {
        try {
            const [projetsRes, voituresRes] = await Promise.allSettled([
                fetchWithToken(PROJETS_URL),
                fetchWithToken(VOITURES_URL)
            ]);
            
            let projetsData = [];
            let voituresData = [];
            
            if (projetsRes.status === 'fulfilled' && projetsRes.value.ok) {
                const data = await projetsRes.value.json();
                projetsData = extractDataFromResponse(data);
            }
            
            if (voituresRes.status === 'fulfilled' && voituresRes.value.ok) {
                const data = await voituresRes.value.json();
                voituresData = extractDataFromResponse(data);
            }
            
            setProjets(projetsData);
            setVoitures(voituresData);
        } catch (err) {
            console.error('[ERROR] Erreur chargement références:', err);
        }
    };
    
    const fetchChauffeurs = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetchWithToken(CHAUFFEURS_URL);
            const data = await response.json();
            
            let chauffeursData = [];
            if (data.success) {
                chauffeursData = data.data || [];
            } else if (Array.isArray(data)) {
                chauffeursData = data;
            } else if (data.data && Array.isArray(data.data)) {
                chauffeursData = data.data;
            }
            
            chauffeursData = sortByMatricule(chauffeursData, 'matricule');
            setChauffeurs(chauffeursData);
            
        } catch (err) {
            console.error('[ERROR] Erreur chargement chauffeurs:', err);
            setError(err.message || "Impossible de charger les chauffeurs");
            setChauffeurs([]);
            showToast(err.message || "Erreur de chargement des chauffeurs", 'danger');
        } finally {
            setLoading(false);
        }
    };
    
    const fetchAffectations = async () => {
        try {
            const response = await fetchWithToken(AFFECTATIONS_URL);
            const data = await response.json();
            let affectationsData = extractDataFromResponse(data);
            affectationsData = sortByMatricule(affectationsData, (item) => item.chauffeur?.matricule);
            setAffectations(affectationsData);
        } catch (err) {
            console.error('[ERROR] Erreur chargement affectations:', err);
            setAffectations([]);
        }
    };
    
    const fetchHistoriqueGlobal = async () => {
        try {
            const response = await fetchWithToken(`${AFFECTATIONS_URL}?historique=complet`);
            const data = await response.json();
            let historiqueData = extractDataFromResponse(data);
            historiqueData = sortByMatricule(historiqueData, (item) => item.chauffeur_matricule);
            setHistoriqueGlobal(historiqueData);
        } catch (err) {
            console.error('[ERROR] Erreur chargement historique global:', err);
            setHistoriqueGlobal([]);
        }
    };
    
    const fetchHistoriqueIndividuel = async (type, id, nom) => {
        try {
            const url = type === 'chauffeur'
                ? `${AFFECTATIONS_URL}/chauffeur/${id}/historique`
                : `${AFFECTATIONS_URL}/voiture/${id}/historique`;
            const response = await fetchWithToken(url);
            const data = await response.json();
            let historiqueData = extractDataFromResponse(data);
            historiqueData.sort((a, b) => new Date(b.date_debut) - new Date(a.date_debut));
            setHistoriqueIndividuel(historiqueData);
            setHistoriqueType(type);
            setHistoriqueTitre(nom);
            setShowHistoriqueModal(true);
        } catch (err) {
            console.error('[ERROR] Erreur chargement historique:', err);
            showToast("Erreur lors du chargement de l'historique", 'danger');
        }
    };
    
    const calculerStats = useCallback(() => {
        const totalChauffeurs = chauffeurs.length;
        const totalVoitures = voitures.length;
        const totalAffectations = affectations.length;
        const affectationsActives = affectations.filter(a =>
            a.statut === 'active' && (!a.date_fin || new Date(a.date_fin) >= new Date())
        ).length;
        
        const statsParProjet = projets.map(projet => {
            const chauffeursDansProjet = chauffeurs.filter(c =>
                c.projet_id == projet.id
            ).length;
            
            const voituresDansProjet = voitures.filter(v =>
                v.projet_id == projet.id
            ).length;
            
            const affectationsDansProjet = affectations.filter(a =>
                a.projet_id == projet.id
            ).length;
            
            const affectationsActivesDansProjet = affectations.filter(a =>
                a.projet_id == projet.id &&
                a.statut === 'active' && (!a.date_fin || new Date(a.date_fin) >= new Date())
            ).length;
            
            return {
                id: projet.id,
                nom: projet.name,
                chauffeurs: chauffeursDansProjet,
                voitures: voituresDansProjet,
                affectations: affectationsDansProjet,
                affectationsActives: affectationsActivesDansProjet
            };
        });
        
        setStats({
            totalChauffeurs,
            totalVoitures,
            totalAffectations,
            affectationsActives,
            parProjet: statsParProjet
        });
    }, [chauffeurs, voitures, affectations, projets]);
    
    // ============================================
    // CHARGEMENT INITIAL
    // ============================================
    useEffect(() => {
        const initialize = async () => {
            await loadReferences();
            await fetchChauffeurs();
            await fetchAffectations();
            await fetchHistoriqueGlobal();
        };
        initialize();
    }, []);
    
    useEffect(() => {
        calculerStats();
    }, [chauffeurs, voitures, affectations, projets, calculerStats]);
    
    useEffect(() => {
        if (activeTab === 'chauffeurs') {
            fetchChauffeurs();
        }
    }, [selectedProject, searchTerm, activeTab]);
    
    useEffect(() => {
        if (activeTab === 'historique') {
            fetchHistoriqueGlobal();
        }
    }, [activeTab]);
    
    // ============================================
    // GESTION DES AFFECTATIONS
    // ============================================
    const handleAffectationChange = (e) => {
        const { name, value } = e.target;
        setAffectationForm(prev => ({
            ...prev,
            [name]: value
        }));
        
        if (name === 'chauffeur_id' && value) {
            const assignment = getChauffeurAssignment(value);
            setExistingAssignment(assignment || null);
        }
    };
    
    const openAffectationModal = () => {
        if (!canAdd()) {
            showToast("Seuls les administrateurs et DM peuvent créer des affectations", 'warning');
            return;
        }
        setAffectationForm({
            chauffeur_id: '',
            voiture_id: '',
            projet_id: '',
            date_debut: new Date().toISOString().split('T')[0],
            date_fin: ''
        });
        setExistingAssignment(null);
        setShowAffectationModal(true);
    };
    
    const submitAffectation = async () => {
        if (!canAdd()) {
            showToast("Action non autorisée", 'danger');
            return;
        }
        if (!affectationForm.chauffeur_id || !affectationForm.voiture_id || !affectationForm.date_debut) {
            setError("Veuillez remplir tous les champs obligatoires");
            return;
        }
        
        setIsUpdating(true);
        setError(null);
        
        try {
            const activeAssignment = getChauffeurAssignment(affectationForm.chauffeur_id);
            
            let url = AFFECTATIONS_URL;
            let payload;
            
            if (activeAssignment) {
                url = `${AFFECTATIONS_URL}/reassigner`;
                payload = {
                    chauffeur_id: parseInt(affectationForm.chauffeur_id),
                    voiture_id: parseInt(affectationForm.voiture_id),
                    projet_id: affectationForm.projet_id ? parseInt(affectationForm.projet_id) : null,
                    date_debut: affectationForm.date_debut,
                    date_fin: affectationForm.date_fin || null,
                    motif: `Réaffectation - Nouveau véhicule: ${getVoitureInfo(affectationForm.voiture_id)}`
                };
            } else {
                payload = {
                    chauffeur_id: parseInt(affectationForm.chauffeur_id),
                    voiture_id: parseInt(affectationForm.voiture_id),
                    projet_id: affectationForm.projet_id ? parseInt(affectationForm.projet_id) : null,
                    date_debut: affectationForm.date_debut,
                    date_fin: affectationForm.date_fin || null
                };
            }
            
            const response = await fetchWithToken(url, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Erreur: ${response.status}`);
            }
            
            const result = await response.json();
            showToast(result.message || "Affectation créée avec succès");
            setShowAffectationModal(false);
            setExistingAssignment(null);
            await fetchAffectations();
            await fetchChauffeurs();
            if (activeTab === 'historique') await fetchHistoriqueGlobal();
            
        } catch (err) {
            console.error("Erreur:", err);
            setError(err.message);
            showToast(err.message, 'danger');
        } finally {
            setIsUpdating(false);
        }
    };
    
    // ============================================
    // FONCTIONS DE RÉAFFECTATION
    // ============================================
    const openChangeProjetModal = (chauffeur) => {
        if (!canEdit()) {
            showToast("Action non autorisée", 'danger');
            return;
        }
        const activeAssignment = getActiveAssignmentForChauffeur(chauffeur.id);
        setSelectedChauffeurForChange(chauffeur);
        setChangeForm({
            nouveau_projet_id: '',
            nouvelle_voiture_id: activeAssignment?.voiture_id || chauffeur.voiture_id || '',
            nouveau_chauffeur_id: '',
            date_debut: new Date().toISOString().split('T')[0],
            motif: `Changement de projet pour le chauffeur ${chauffeur.matricule} - ${chauffeur.nom}`
        });
        setExistingAssignment(activeAssignment);
        setShowChangeProjetModal(true);
    };
    
    const submitChangeProjet = async () => {
        if (!selectedChauffeurForChange) return;
        if (!changeForm.nouveau_projet_id) {
            setError("Veuillez sélectionner un nouveau projet");
            return;
        }
        
        setIsUpdating(true);
        setError(null);
        
        try {
            const activeAssignment = getActiveAssignmentForChauffeur(selectedChauffeurForChange.id);
            
            const payload = {
                chauffeur_id: parseInt(selectedChauffeurForChange.id),
                voiture_id: activeAssignment?.voiture_id ? parseInt(activeAssignment.voiture_id) : null,
                projet_id: parseInt(changeForm.nouveau_projet_id),
                date_debut: changeForm.date_debut,
                motif: changeForm.motif || `Changement de projet vers: ${getProjetName(changeForm.nouveau_projet_id)}`
            };
            
            const response = await fetchWithToken(`${AFFECTATIONS_URL}/reassigner`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Erreur lors de la réaffectation");
            }
            
            showToast(`Chauffeur ${selectedChauffeurForChange.nom} transféré vers le projet ${getProjetName(changeForm.nouveau_projet_id)}`);
            setShowChangeProjetModal(false);
            await fetchAffectations();
            await fetchChauffeurs();
            if (activeTab === 'historique') await fetchHistoriqueGlobal();
            
        } catch (err) {
            console.error("Erreur:", err);
            setError(err.message);
            showToast(err.message, 'danger');
        } finally {
            setIsUpdating(false);
        }
    };
    
    const openChangeVoitureModal = (chauffeur) => {
        if (!canEdit()) {
            showToast("Action non autorisée", 'danger');
            return;
        }
        const activeAssignment = getActiveAssignmentForChauffeur(chauffeur.id);
        setSelectedChauffeurForChange(chauffeur);
        setChangeForm({
            nouveau_projet_id: activeAssignment?.projet_id || chauffeur.projet_id || '',
            nouvelle_voiture_id: '',
            nouveau_chauffeur_id: '',
            date_debut: new Date().toISOString().split('T')[0],
            motif: `Changement de véhicule pour le chauffeur ${chauffeur.matricule} - ${chauffeur.nom}`
        });
        setExistingAssignment(activeAssignment);
        setShowChangeVoitureModal(true);
    };
    
    const submitChangeVoiture = async () => {
        if (!selectedChauffeurForChange) return;
        if (!changeForm.nouvelle_voiture_id) {
            setError("Veuillez sélectionner un nouveau véhicule");
            return;
        }
        
        setIsUpdating(true);
        setError(null);
        
        try {
            const activeAssignment = getActiveAssignmentForChauffeur(selectedChauffeurForChange.id);
            
            const payload = {
                chauffeur_id: parseInt(selectedChauffeurForChange.id),
                voiture_id: parseInt(changeForm.nouvelle_voiture_id),
                projet_id: activeAssignment?.projet_id ? parseInt(activeAssignment.projet_id) : null,
                date_debut: changeForm.date_debut,
                motif: changeForm.motif || `Changement de véhicule vers: ${getVoitureInfo(changeForm.nouvelle_voiture_id)}`
            };
            
            const response = await fetchWithToken(`${AFFECTATIONS_URL}/reassigner`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Erreur lors de la réaffectation");
            }
            
            showToast(`Chauffeur ${selectedChauffeurForChange.nom} réaffecté au véhicule ${getVoitureInfo(changeForm.nouvelle_voiture_id)}`);
            setShowChangeVoitureModal(false);
            await fetchAffectations();
            await fetchChauffeurs();
            if (activeTab === 'historique') await fetchHistoriqueGlobal();
            
        } catch (err) {
            console.error("Erreur:", err);
            setError(err.message);
            showToast(err.message, 'danger');
        } finally {
            setIsUpdating(false);
        }
    };
    
    const openChangeChauffeurModal = (voiture) => {
        if (!canEdit()) {
            showToast("Action non autorisée", 'danger');
            return;
        }
        const activeAssignment = getActiveAssignmentForVoiture(voiture.id);
        setSelectedVoitureForChange(voiture);
        setChangeForm({
            nouveau_projet_id: activeAssignment?.projet_id || '',
            nouvelle_voiture_id: voiture.id,
            nouveau_chauffeur_id: '',
            date_debut: new Date().toISOString().split('T')[0],
            motif: `Changement de chauffeur pour le véhicule ${voiture.matricule}`
        });
        setExistingAssignment(activeAssignment);
        setShowChangeChauffeurModal(true);
    };
    
    const submitChangeChauffeur = async () => {
        if (!selectedVoitureForChange) return;
        if (!changeForm.nouveau_chauffeur_id) {
            setError("Veuillez sélectionner un nouveau chauffeur");
            return;
        }
        
        setIsUpdating(true);
        setError(null);
        
        try {
            const activeAssignment = getActiveAssignmentForVoiture(selectedVoitureForChange.id);
            
            const payload = {
                chauffeur_id: parseInt(changeForm.nouveau_chauffeur_id),
                voiture_id: parseInt(selectedVoitureForChange.id),
                projet_id: activeAssignment?.projet_id ? parseInt(activeAssignment.projet_id) : null,
                date_debut: changeForm.date_debut,
                motif: changeForm.motif || `Changement de chauffeur vers: ${chauffeurs.find(c => c.id == changeForm.nouveau_chauffeur_id)?.nom}`
            };
            
            const response = await fetchWithToken(`${AFFECTATIONS_URL}/reassigner`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Erreur lors de la réaffectation");
            }
            
            showToast(`Véhicule ${selectedVoitureForChange.matricule} réaffecté au chauffeur ${chauffeurs.find(c => c.id == changeForm.nouveau_chauffeur_id)?.nom}`);
            setShowChangeChauffeurModal(false);
            await fetchAffectations();
            await fetchChauffeurs();
            if (activeTab === 'historique') await fetchHistoriqueGlobal();
            
        } catch (err) {
            console.error("Erreur:", err);
            setError(err.message);
            showToast(err.message, 'danger');
        } finally {
            setIsUpdating(false);
        }
    };
    
    // ============================================
    // GESTION DES FIN D'AFFECTATION
    // ============================================
    const openFinAffectationModal = (affectation) => {
        if (!canEdit()) {
            showToast("Action non autorisée", 'danger');
            return;
        }
        setSelectedAffectation(affectation);
        setMotifFin('');
        setShowFinAffectationModal(true);
    };
    
    const submitFinAffectation = async () => {
        if (!selectedAffectation) return;
        if (!canEdit()) {
            showToast("Action non autorisée", 'danger');
            return;
        }
        if (!motifFin.trim()) {
            setError("Le motif de fin est obligatoire");
            return;
        }
        
        setIsUpdating(true);
        setError(null);
        
        try {
            const response = await fetchWithToken(`${AFFECTATIONS_URL}/${selectedAffectation.id}/terminer`, {
                method: 'POST',
                body: JSON.stringify({ motif_fin: motifFin })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Erreur: ${response.status}`);
            }
            
            showToast("Affectation terminée avec succès");
            setShowFinAffectationModal(false);
            await fetchAffectations();
            await fetchChauffeurs();
            if (activeTab === 'historique') await fetchHistoriqueGlobal();
        } catch (err) {
            console.error("Erreur:", err);
            setError(err.message);
            showToast(err.message, 'danger');
        } finally {
            setIsUpdating(false);
        }
    };
    
    // ============================================
    // GESTION DES CHAUFFEURS
    // ============================================
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentChauffeur(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const validateForm = () => {
        if (!currentChauffeur.matricule?.trim()) {
            setError("Le matricule est obligatoire");
            return false;
        }
        if (!currentChauffeur.nom?.trim()) {
            setError("Le nom est obligatoire");
            return false;
        }
        return true;
    };
    
    const handleAddChauffeur = () => {
        if (!canAdd()) {
            showToast("Seuls les administrateurs et DM peuvent ajouter des chauffeurs", 'warning');
            return;
        }
        setCurrentChauffeur({
            id: null,
            matricule: '',
            nom: '',
            statut: 'ACTIF',
            projet_id: '',
            voiture_id: '',
            date_affectation: new Date().toISOString().slice(0, 16).replace('T', ' ')
        });
        setIsEditing(false);
        setShowAddModal(true);
    };
    
    const handleEditChauffeur = (chauffeur) => {
        if (!canEdit()) {
            showToast("Seuls les administrateurs et DM peuvent modifier des chauffeurs", 'warning');
            return;
        }
        setCurrentChauffeur({
            id: chauffeur?.id || null,
            matricule: chauffeur?.matricule || '',
            nom: chauffeur?.nom || '',
            statut: chauffeur?.statut || 'ACTIF',
            projet_id: chauffeur?.projet_id || '',
            voiture_id: chauffeur?.voiture_id || '',
            date_affectation: chauffeur?.date_affectation ? chauffeur.date_affectation.slice(0, 16).replace('T', ' ') : new Date().toISOString().slice(0, 16).replace('T', ' ')
        });
        setIsEditing(true);
        setShowAddModal(true);
    };
    
    const submitChauffeur = async () => {
        if (!canEdit()) {
            showToast("Action non autorisée", 'danger');
            return;
        }
        if (!validateForm()) return;
        
        setIsUpdating(true);
        setError(null);
        
        try {
            const chauffeurData = {
                matricule: currentChauffeur.matricule,
                nom: currentChauffeur.nom,
                statut: currentChauffeur.statut,
                projet_id: currentChauffeur.projet_id ? parseInt(currentChauffeur.projet_id) : null,
                voiture_id: currentChauffeur.voiture_id ? parseInt(currentChauffeur.voiture_id) : null,
                date_affectation: currentChauffeur.date_affectation || new Date().toISOString()
            };
            
            let response;
            if (isEditing) {
                response = await fetchWithToken(`${CHAUFFEURS_URL}/${currentChauffeur.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(chauffeurData)
                });
            } else {
                response = await fetchWithToken(CHAUFFEURS_URL, {
                    method: 'POST',
                    body: JSON.stringify(chauffeurData)
                });
            }
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || `Erreur: ${response.status}`);
            }
            
            showToast(`Chauffeur ${currentChauffeur.nom} ${isEditing ? 'modifié' : 'ajouté'} avec succès`);
            setShowAddModal(false);
            fetchChauffeurs();
        } catch (err) {
            console.error("Erreur:", err);
            setError(err.message);
            showToast(err.message, 'danger');
        } finally {
            setIsUpdating(false);
        }
    };
    
    const handleDeleteChauffeur = (chauffeur) => {
        if (!canDelete()) {
            showToast("Seuls les administrateurs et DM peuvent supprimer des chauffeurs", 'warning');
            return;
        }
        setChauffeurToDelete(chauffeur);
        setShowDeleteModal(true);
    };
    
    const confirmDelete = async () => {
        if (!chauffeurToDelete) return;
        if (!canDelete()) {
            showToast("Action non autorisée", 'danger');
            return;
        }
        
        try {
            setIsUpdating(true);
            const response = await fetchWithToken(`${CHAUFFEURS_URL}/${chauffeurToDelete.id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || `Erreur: ${response.status}`);
            }
            
            showToast(`Chauffeur ${chauffeurToDelete.nom} supprimé avec succès`);
            fetchChauffeurs();
            setShowDeleteModal(false);
        } catch (err) {
            console.error("Erreur:", err);
            showToast(err.message || "Erreur lors de la suppression", 'danger');
        } finally {
            setIsUpdating(false);
            setChauffeurToDelete(null);
        }
    };
    
    // ============================================
    // GESTION DES VÉHICULES
    // ============================================
    const handleAddVehicule = () => {
        if (!canAdd()) {
            showToast("Seuls les administrateurs et DM peuvent ajouter des véhicules", 'warning');
            return;
        }
        setNewVehicule({
            matricule: '',
            marque: '',
            modele: '',
            site: '',
            compteur_actuel: 0
        });
        setIsAddingVehicule(false);
        setShowAddVehiculeModal(true);
    };

    const submitVehicule = async () => {
        if (!canEdit()) {
            showToast("Action non autorisée", 'danger');
            return;
        }
        if (!newVehicule.matricule.trim()) {
            setError("Le matricule est obligatoire");
            return;
        }
        
        setIsAddingVehicule(true);
        setError(null);
        
        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
            const response = await fetch(VOITURES_URL, {
                method: 'POST',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    matricule: newVehicule.matricule.trim(),
                    marque: newVehicule.marque || null,
                    modele: newVehicule.modele || null,
                    site: newVehicule.site || null,
                    compteur_actuel: parseFloat(newVehicule.compteur_actuel) || 0
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || `Erreur: ${response.status}`);
            }

            const data = await response.json();
            const voitureCreee = data.data || data;
            
            setVoitures(prev => [...prev, voitureCreee]);
            
            showToast(`Véhicule ${voitureCreee.matricule} ajouté avec succès`, 'success');
            setShowAddVehiculeModal(false);
            calculerStats();
            
        } catch (err) {
            console.error("Erreur:", err);
            setError(err.message);
            showToast(err.message, 'danger');
        } finally {
            setIsAddingVehicule(false);
        }
    };
    
    const handleAddVoiture = (newVoiture) => {
        setVoitures(prev => [...prev, newVoiture]);
        calculerStats();
    };
    
    const resetFilters = () => {
        setSelectedProject(null);
        setSearchTerm('');
    };
    
    const filteredAffectations = affectations.filter(aff => {
        if (!searchTermAffectations) return true;
        const term = searchTermAffectations.toLowerCase();
        return (
            (aff.chauffeur?.nom?.toLowerCase().includes(term)) ||
            (aff.chauffeur?.matricule?.toLowerCase().includes(term)) ||
            (aff.voiture?.matricule?.toLowerCase().includes(term)) ||
            (aff.projet?.name?.toLowerCase().includes(term))
        );
    });
    
    const filteredHistorique = historiqueGlobal.filter(item => {
        if (!searchTermHistorique) return true;
        const term = searchTermHistorique.toLowerCase();
        return (
            (item.chauffeur_nom?.toLowerCase().includes(term)) ||
            (item.chauffeur_matricule?.toLowerCase().includes(term)) ||
            (item.voiture_matricule?.toLowerCase().includes(term)) ||
            (item.projet_nom?.toLowerCase().includes(term))
        );
    });
    
    // ============================================
    // RENDU
    // ============================================
    if (userLoading) {
        return (
            <div className="container-fluid py-4 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Vérification des permissions...</p>
            </div>
        );
    }
    
    return (
        <div className="container-fluid py-4">
            <ToastContainer position="top-end" className="p-3">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                        bg={toast.variant}
                        autohide
                        delay={5000}
                    >
                        <Toast.Body className="text-white">{toast.message}</Toast.Body>
                    </Toast>
                ))}
            </ToastContainer>
            
            {/* Statistiques générales */}
            <Row className="mb-4">
                <Col md={3}>
                    <Card className="bg-primary text-white shadow-sm">
                        <Card.Body className="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 className="mb-0">Total chauffeurs</h6>
                                <h2 className="mb-0">{stats.totalChauffeurs}</h2>
                            </div>
                            <FaUserTie size={40} />
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="bg-success text-white shadow-sm">
                        <Card.Body className="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 className="mb-0">Total équipements</h6>
                                <h2 className="mb-0">{stats.totalVoitures}</h2>
                            </div>
                            <FaCar size={40} />
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="bg-info text-white shadow-sm">
                        <Card.Body className="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 className="mb-0">Affectations actives</h6>
                                <h2 className="mb-0">{stats.affectationsActives}</h2>
                            </div>
                            <FaCheck size={40} />
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="bg-warning text-white shadow-sm">
                        <Card.Body className="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 className="mb-0">Total affectations</h6>
                                <h2 className="mb-0">{stats.totalAffectations}</h2>
                            </div>
                            <FaExchange size={40} />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            
            <Card className="shadow-sm">
                <Card.Header className="bg-primary text-white">
                    <div className="d-flex justify-content-between align-items-center">
                        <h3 className="mb-0 d-flex align-items-center">
                            <FaUserTie className="me-2" />
                            Gestion des chauffeurs et affectations
                            <Badge
                                bg={canEdit() ? 'success' : 'secondary'}
                                className="ms-2"
                                style={{ fontSize: '0.6em' }}
                            >
                                {canEdit() ? <FaUserShield className="me-1" /> : <FaUser className="me-1" />}
                                {isAdmin() ? 'Admin' : isDM() ? 'DM' : isChefEnt() ? 'Chef' : 'Lecture'}
                            </Badge>
                        </h3>
                        <div className="d-flex align-items-center gap-2">
                            <Button variant="outline-success" onClick={handleAddVehicule} disabled={loading}>
                                        <FaCar className="me-1" />
                                        Ajouter véhicule
                                    </Button>
                            <Button variant="light" onClick={() => {
                                fetchChauffeurs();
                                fetchAffectations();
                                if (activeTab === 'historique') fetchHistoriqueGlobal();
                            }} disabled={loading}>
                                <FaSyncAlt className={loading ? "spin" : ""} />
                                <span className="ms-2">Rafraîchir</span>
                            </Button>
                            {canAdd() && activeTab === 'chauffeurs' && (
                                <>
                                    <Button variant="success" onClick={openAffectationModal} disabled={loading}>
                                        <FaExchangeAlt className="me-1" />
                                        Nouvelle affectation
                                    </Button>
                                    <Button variant="primary" onClick={handleAddChauffeur} disabled={loading}>
                                        <FaPlus className="me-1" />
                                        Ajouter chauffeur
                                    </Button>
                                   
                                </>
                            )}
                        </div>
                    </div>
                </Card.Header>
                <Card.Body>
                    <Tabs
                        activeKey={activeTab}
                        onSelect={(k) => setActiveTab(k)}
                        className="mb-3"
                        fill
                    >
                        {/* Onglet Chauffeurs */}
                        <Tab
                            eventKey="chauffeurs"
                            title={
                                <span>
                                    <FaUsers className="me-2" />
                                    Chauffeurs
                                </span>
                            }
                        >
                            {error && (
                                <Alert variant="danger" onClose={() => setError(null)} dismissible className="mb-3">
                                    <FaInfoCircle className="me-2" />
                                    {error}
                                </Alert>
                            )}
                            <Row className="mb-3">
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label className="fw-bold">
                                            <FaFilter className="me-2" />
                                            Filtre par projet
                                        </Form.Label>
                                        <Form.Select
                                            value={selectedProject || ''}
                                            onChange={(e) => setSelectedProject(e.target.value ? parseInt(e.target.value) : null)}
                                        >
                                            <option value="">Tous les projets</option>
                                            {projets.map(projet => (
                                                <option key={projet.id} value={projet.id}>
                                                    {projet.name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-bold">
                                            <FaSearch className="me-2" />
                                            Recherche
                                        </Form.Label>
                                        <InputGroup>
                                            <Form.Control
                                                type="text"
                                                placeholder="Matricule ou nom..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                            {searchTerm && (
                                                <Button variant="outline-secondary" onClick={() => setSearchTerm('')}>
                                                    ×
                                                </Button>
                                            )}
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
                                <div className="text-center py-5">
                                    <Spinner animation="border" variant="primary" />
                                    <p className="mt-2">Chargement des chauffeurs...</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <Table striped bordered hover>
                                        <thead className="table-dark">
                                            <tr>
                                                <th>Matricule</th>
                                                <th>Nom</th>
                                                <th>Statut</th>
                                                <th>Equipement</th>
                                                <th>Projet</th>
                                                <th>Date affectation</th>
                                                <th style={{ width: '200px' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {chauffeurs.length > 0 ? (
                                                chauffeurs.map(chauffeur => (
                                                    <tr key={chauffeur.id}>
                                                        <td className="fw-bold">{chauffeur.matricule}</td>
                                                        <td>{chauffeur.nom}</td>
                                                        <td>{getStatutBadge(chauffeur.statut)}</td>
                                                        <td>{getVoitureInfo(chauffeur.voiture || chauffeur.voiture_id)}</td>
                                                        <td>{getProjetName(chauffeur.projet || chauffeur.projet_id)}</td>
                                                        <td>{formatDateTime(chauffeur.date_affectation)}</td>
                                                        <td>
                                                            <div className="d-flex gap-1 flex-wrap">
                                                                <Button
                                                                    variant="outline-info"
                                                                    size="sm"
                                                                    onClick={() => fetchHistoriqueIndividuel('chauffeur', chauffeur.id, chauffeur.nom)}
                                                                    title="Historique"
                                                                >
                                                                    <FaHistory />
                                                                </Button>
                                                                {canEdit() && (
                                                                    <>
                                                                        <Button
                                                                            variant="outline-success"
                                                                            size="sm"
                                                                            onClick={() => handleEditChauffeur(chauffeur)}
                                                                            title="Modifier"
                                                                        >
                                                                            <FaEdit />
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline-danger"
                                                                            size="sm"
                                                                            onClick={() => handleDeleteChauffeur(chauffeur)}
                                                                            title="Supprimer"
                                                                        >
                                                                            <FaTrash />
                                                                        </Button>
                                                                    </>
                                                                )}
                                                                {!canEdit() && (
                                                                    <Button variant="outline-secondary" size="sm" disabled title="Actions réservées">
                                                                        <FaLock />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="7" className="text-center py-4">
                                                        <FaInfoCircle className="me-2" />
                                                        Aucun chauffeur trouvé
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            )}
                        </Tab>
                        
                        {/* Onglet Affectations */}
                        <Tab
                            eventKey="affectations"
                            title={
                                <span>
                                    <FaExchangeAlt className="me-2" />
                                    Affectations
                                </span>
                            }
                        >
                            <div className="mb-3">
                                <Row>
                                    <Col md={8}>
                                        <Form.Group>
                                            <Form.Label className="fw-bold">
                                                <FaSearch className="me-2" />
                                                Rechercher une affectation
                                            </Form.Label>
                                            <InputGroup>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Chauffeur, matricule, véhicule..."
                                                    value={searchTermAffectations}
                                                    onChange={(e) => setSearchTermAffectations(e.target.value)}
                                                />
                                                {searchTermAffectations && (
                                                    <Button variant="outline-secondary" onClick={() => setSearchTermAffectations('')}>
                                                        ×
                                                    </Button>
                                                )}
                                            </InputGroup>
                                        </Form.Group>
                                    </Col>
                                    <Col md={4} className="d-flex align-items-end justify-content-end">
                                        {canAdd() && (
                                            <Button variant="success" onClick={openAffectationModal}>
                                                <FaPlus className="me-1" />
                                                Nouvelle affectation
                                            </Button>
                                        )}
                                    </Col>
                                </Row>
                            </div>
                            <div className="table-responsive">
                                <Table striped bordered hover>
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Matricule</th>
                                            <th>Chauffeur</th>
                                            <th>Véhicule</th>
                                            <th>Projet</th>
                                            <th>Date début</th>
                                            <th>Date fin</th>
                                            <th>Statut</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAffectations.length > 0 ? (
                                            filteredAffectations.map(aff => (
                                                <tr key={aff.id}>
                                                    <td className="fw-bold">{aff.chauffeur?.matricule || '-'}</td>
                                                    <td>{aff.chauffeur?.nom || '-'}</td>
                                                    <td>{aff.voiture?.matricule || '-'}</td>
                                                    <td>{aff.projet?.name || '-'}</td>
                                                    <td>{formatDate(aff.date_debut)}</td>
                                                    <td>{formatDate(aff.date_fin)}</td>
                                                    <td>{getAffectationStatutBadge(aff)}</td>
                                                    <td>
                                                        <div className="d-flex gap-1">
                                                            <Button
                                                                variant="outline-info"
                                                                size="sm"
                                                                onClick={() => fetchHistoriqueIndividuel('voiture', aff.voiture_id, aff.voiture?.matricule)}
                                                                title="Historique véhicule"
                                                            >
                                                                <FaHistory />
                                                            </Button>
                                                            {aff.statut === 'active' && canEdit() && (
                                                                <>
                                                                    <Button
                                                                        variant="outline-warning"
                                                                        size="sm"
                                                                        onClick={() => openChangeChauffeurModal(aff.voiture)}
                                                                        title="Changer de chauffeur"
                                                                    >
                                                                        <FaRedoAlt />
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline-danger"
                                                                        size="sm"
                                                                        onClick={() => openFinAffectationModal(aff)}
                                                                        title="Terminer l'affectation"
                                                                    >
                                                                        <FaBan />
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="8" className="text-center py-4">
                                                    <FaInfoCircle className="me-2" />
                                                    Aucune affectation trouvée
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </Tab>
                        
                        {/* Onglet Historique */}
                        <Tab
                            eventKey="historique"
                            title={
                                <span>
                                    <FaHistory className="me-2" />
                                    Historique
                                </span>
                            }
                        >
                            <div className="mb-3">
                                <Form.Group>
                                    <Form.Label className="fw-bold">
                                        <FaSearch className="me-2" />
                                        Rechercher dans l'historique
                                    </Form.Label>
                                    <InputGroup>
                                        <Form.Control
                                            type="text"
                                            placeholder="Chauffeur, matricule, véhicule..."
                                            value={searchTermHistorique}
                                            onChange={(e) => setSearchTermHistorique(e.target.value)}
                                        />
                                        {searchTermHistorique && (
                                            <Button variant="outline-secondary" onClick={() => setSearchTermHistorique('')}>
                                                ×
                                            </Button>
                                        )}
                                    </InputGroup>
                                </Form.Group>
                            </div>
                            <div className="table-responsive">
                                <Table striped bordered hover>
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Matricule</th>
                                            <th>Chauffeur</th>
                                            <th>Véhicule</th>
                                            <th>Projet</th>
                                            <th>Date début</th>
                                            <th>Date fin</th>
                                            <th>Durée</th>
                                            <th>Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredHistorique.length > 0 ? (
                                            filteredHistorique.map(item => (
                                                <tr key={item.id}>
                                                    <td className="fw-bold">{item.chauffeur_matricule || '-'}</td>
                                                    <td>{item.chauffeur_nom || '-'}</td>
                                                    <td>{item.voiture_matricule || '-'}</td>
                                                    <td>{item.projet_nom || '-'}</td>
                                                    <td>{formatDate(item.date_debut)}</td>
                                                    <td>{formatDate(item.date_fin)}</td>
                                                    <td className="text-center">{item.duree || '-'}</td>
                                                    <td>
                                                        {item.statut === 'active'
                                                            ? <Badge bg="success">Active</Badge>
                                                            : <Badge bg="danger">Terminée</Badge>
                                                        }
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="8" className="text-center py-4">
                                                    <FaInfoCircle className="me-2" />
                                                    Aucun historique trouvé
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </Tab>
                        
                        {/* Onglet Statistiques par projet */}
                        <Tab
                            eventKey="statistiques"
                            title={
                                <span>
                                    <FaChartBar className="me-2" />
                                    Statistiques par projet
                                </span>
                            }
                        >
                            <div className="mb-3">
                                <Row>
                                    <Col md={8}>
                                        <Alert variant="info">
                                            <FaInfoCircle className="me-2" />
                                            Répartition des chauffeurs et véhicules par projet.
                                        </Alert>
                                    </Col>
                                    <Col md={4} className="text-end">
                                        {canAdd() && (
                                            <Button variant="success" onClick={openAffectationModal}>
                                                <FaPlus className="me-1" />
                                                Nouvelle affectation
                                            </Button>
                                        )}
                                    </Col>
                                </Row>
                            </div>
                            <div className="table-responsive">
                                <Table striped bordered hover>
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Projet</th>
                                            <th className="text-center">Chauffeurs</th>
                                            <th className="text-center">Véhicules</th>
                                            <th className="text-center">Affectations actives</th>
                                            <th className="text-center" style={{ width: '150px' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.parProjet.length > 0 ? (
                                            stats.parProjet.map(projet => (
                                                <tr key={projet.id}>
                                                    <td className="fw-bold">{projet.nom}</td>
                                                    <td className="text-center">
                                                        {projet.chauffeurs > 0 ? (
                                                            <Badge bg="primary" pill>{projet.chauffeurs}</Badge>
                                                        ) : (
                                                            <Badge bg="secondary" pill>0</Badge>
                                                        )}
                                                    </td>
                                                    <td className="text-center">
                                                        {projet.voitures > 0 ? (
                                                            <Badge bg="success" pill>{projet.voitures}</Badge>
                                                        ) : (
                                                            <Badge bg="secondary" pill>0</Badge>
                                                        )}
                                                    </td>
                                                    <td className="text-center">
                                                        {projet.affectationsActives > 0 ? (
                                                            <Badge bg="info" pill>{projet.affectationsActives}</Badge>
                                                        ) : (
                                                            <Badge bg="secondary" pill>0</Badge>
                                                        )}
                                                    </td>
                                                    <td className="text-center">
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() => {
                                                                setAffectationForm({
                                                                    chauffeur_id: '',
                                                                    voiture_id: '',
                                                                    projet_id: projet.id,
                                                                    date_debut: new Date().toISOString().split('T')[0],
                                                                    date_fin: ''
                                                                });
                                                                setShowAffectationModal(true);
                                                            }}
                                                            disabled={!canAdd()}
                                                            title="Créer une affectation pour ce projet"
                                                        >
                                                            <FaExchangeAlt className="me-1" />
                                                            Affecter
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="text-center py-4">
                                                    <FaInfoCircle className="me-2" />
                                                    Aucune donnée disponible
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                            <Card className="mt-3 bg-light">
                                <Card.Body>
                                    <Row>
                                        <Col md={4}>
                                            <div className="text-center">
                                                <h6>Total projets</h6>
                                                <h3>{stats.parProjet.length}</h3>
                                            </div>
                                        </Col>
                                        <Col md={4}>
                                            <div className="text-center">
                                                <h6>Total chauffeurs</h6>
                                                <h3>{stats.totalChauffeurs}</h3>
                                            </div>
                                        </Col>
                                        <Col md={4}>
                                            <div className="text-center">
                                                <h6>Total véhicules</h6>
                                                <h3>{stats.totalVoitures}</h3>
                                            </div>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Tab>
                    </Tabs>
                </Card.Body>
            </Card>
            
            {/* MODAL NOUVELLE AFFECTATION avec recherche de véhicule */}
            <Modal show={showAffectationModal} onHide={() => setShowAffectationModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <FaExchangeAlt className="me-2" />
                        Nouvelle affectation
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        {existingAssignment && (
                            <Alert variant="warning" className="mb-3">
                                <FaExclamationTriangle className="me-2" />
                                <strong>Réaffectation détectée !</strong>
                                <br />
                                <small>
                                    Ce chauffeur est actuellement affecté au véhicule <strong>{getVoitureInfo(existingAssignment.voiture_id)}</strong>.
                                    <br />
                                    L'ancienne affectation sera automatiquement terminée.
                                </small>
                            </Alert>
                        )}
                        
                        <Alert variant="info" className="mb-3">
                            <small>
                                <FaInfoCircle className="me-2" />
                                Vous pouvez réaffecter un chauffeur même s'il a déjà une affectation active.
                            </small>
                        </Alert>
                        
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Chauffeur *</Form.Label>
                                    <Form.Select
                                        name="chauffeur_id"
                                        value={affectationForm.chauffeur_id}
                                        onChange={handleAffectationChange}
                                        disabled={isUpdating}
                                    >
                                        <option value="">Sélectionner un chauffeur</option>
                                        {getAvailableChauffeurs().map(chauffeur => (
                                            <option key={chauffeur.id} value={chauffeur.id}>
                                                {chauffeur.matricule} - {chauffeur.nom}
                                                {getChauffeurAssignment(chauffeur.id) ? ' (Déjà affecté)' : ''}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <VoitureSearchWithAdd
                                    value={affectationForm.voiture_id}
                                    onChange={handleAffectationChange}
                                    voitures={voitures}
                                    onAddVoiture={handleAddVoiture}
                                    disabled={isUpdating}
                                    label="Véhicule *"
                                    placeholder="Rechercher ou créer un véhicule..."
                                    showToast={showToast}
                                />
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Projet</Form.Label>
                                    <Form.Select
                                        name="projet_id"
                                        value={affectationForm.projet_id}
                                        onChange={handleAffectationChange}
                                        disabled={isUpdating}
                                    >
                                        <option value="">Aucun projet</option>
                                        {projets.map(projet => (
                                            <option key={projet.id} value={projet.id}>
                                                {projet.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Date début *</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="date_debut"
                                        value={affectationForm.date_debut}
                                        onChange={handleAffectationChange}
                                        disabled={isUpdating}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Date fin</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="date_fin"
                                        value={affectationForm.date_fin}
                                        onChange={handleAffectationChange}
                                        disabled={isUpdating}
                                        min={affectationForm.date_debut}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAffectationModal(false)} disabled={isUpdating}>
                        Annuler
                    </Button>
                    <Button variant="success" onClick={submitAffectation} disabled={isUpdating}>
                        {isUpdating ? <Spinner size="sm" /> : 'Créer l\'affectation'}
                    </Button>
                </Modal.Footer>
            </Modal>
            
            {/* MODAL CHANGER DE PROJET */}
            <Modal show={showChangeProjetModal} onHide={() => setShowChangeProjetModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <FaArrowRight className="me-2 text-primary" />
                        Changer de projet pour {selectedChauffeurForChange?.nom}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {existingAssignment && (
                        <Alert variant="warning" className="mb-3">
                            <FaExclamationTriangle className="me-2" />
                            <strong>Attention !</strong>
                            <br />
                            <small>
                                Ce chauffeur est actuellement affecté au projet <strong>{getProjetName(existingAssignment.projet_id)}</strong> 
                                avec le véhicule <strong>{getVoitureInfo(existingAssignment.voiture_id)}</strong>.
                                <br />
                                L'ancienne affectation sera automatiquement terminée.
                            </small>
                        </Alert>
                    )}
                    
                    <Form>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Chauffeur</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={`${selectedChauffeurForChange?.matricule} - ${selectedChauffeurForChange?.nom}`}
                                        disabled
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Véhicule actuel</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={getVoitureInfo(existingAssignment?.voiture_id || selectedChauffeurForChange?.voiture_id)}
                                        disabled
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Nouveau projet *</Form.Label>
                                    <Form.Select
                                        value={changeForm.nouveau_projet_id}
                                        onChange={(e) => setChangeForm(prev => ({ ...prev, nouveau_projet_id: e.target.value }))}
                                        disabled={isUpdating}
                                    >
                                        <option value="">Sélectionner un projet</option>
                                        {projets.map(projet => (
                                            <option key={projet.id} value={projet.id}>
                                                {projet.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Date de début</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={changeForm.date_debut}
                                        onChange={(e) => setChangeForm(prev => ({ ...prev, date_debut: e.target.value }))}
                                        disabled={isUpdating}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>Motif (optionnel)</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                value={changeForm.motif}
                                onChange={(e) => setChangeForm(prev => ({ ...prev, motif: e.target.value }))}
                                placeholder="Raison du changement de projet..."
                                disabled={isUpdating}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowChangeProjetModal(false)} disabled={isUpdating}>
                        Annuler
                    </Button>
                    <Button variant="primary" onClick={submitChangeProjet} disabled={isUpdating || !changeForm.nouveau_projet_id}>
                        {isUpdating ? <Spinner size="sm" /> : 'Changer de projet'}
                    </Button>
                </Modal.Footer>
            </Modal>
            
            {/* MODAL CHANGER DE VÉHICULE */}
            <Modal show={showChangeVoitureModal} onHide={() => setShowChangeVoitureModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <FaCar className="me-2 text-warning" />
                        Changer de véhicule pour {selectedChauffeurForChange?.nom}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {existingAssignment && (
                        <Alert variant="warning" className="mb-3">
                            <FaExclamationTriangle className="me-2" />
                            <strong>Attention !</strong>
                            <br />
                            <small>
                                Ce chauffeur est actuellement affecté au projet <strong>{getProjetName(existingAssignment.projet_id)}</strong> 
                                avec le véhicule <strong>{getVoitureInfo(existingAssignment.voiture_id)}</strong>.
                                <br />
                                L'ancienne affectation sera automatiquement terminée.
                            </small>
                        </Alert>
                    )}
                    
                    <Form>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Chauffeur</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={`${selectedChauffeurForChange?.matricule} - ${selectedChauffeurForChange?.nom}`}
                                        disabled
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Projet actuel</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={getProjetName(existingAssignment?.projet_id || selectedChauffeurForChange?.projet_id)}
                                        disabled
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Nouveau véhicule *</Form.Label>
                                    <Form.Select
                                        value={changeForm.nouvelle_voiture_id}
                                        onChange={(e) => setChangeForm(prev => ({ ...prev, nouvelle_voiture_id: e.target.value }))}
                                        disabled={isUpdating}
                                    >
                                        <option value="">Sélectionner un véhicule</option>
                                        {voitures.map(voiture => (
                                            <option key={voiture.id} value={voiture.id}>
                                                {voiture.matricule} {voiture.modele ? `- ${voiture.modele}` : ''}
                                                {getVoitureAssignment(voiture.id) && voiture.id != existingAssignment?.voiture_id ? ' (Déjà affecté)' : ''}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Date de début</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={changeForm.date_debut}
                                        onChange={(e) => setChangeForm(prev => ({ ...prev, date_debut: e.target.value }))}
                                        disabled={isUpdating}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>Motif (optionnel)</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                value={changeForm.motif}
                                onChange={(e) => setChangeForm(prev => ({ ...prev, motif: e.target.value }))}
                                placeholder="Raison du changement de véhicule..."
                                disabled={isUpdating}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowChangeVoitureModal(false)} disabled={isUpdating}>
                        Annuler
                    </Button>
                    <Button variant="warning" onClick={submitChangeVoiture} disabled={isUpdating || !changeForm.nouvelle_voiture_id}>
                        {isUpdating ? <Spinner size="sm" /> : 'Changer de véhicule'}
                    </Button>
                </Modal.Footer>
            </Modal>
            
            {/* MODAL CHANGER DE CHAUFFEUR */}
            <Modal show={showChangeChauffeurModal} onHide={() => setShowChangeChauffeurModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <FaRedoAlt className="me-2 text-success" />
                        Changer de chauffeur pour {selectedVoitureForChange?.matricule}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {existingAssignment && (
                        <Alert variant="warning" className="mb-3">
                            <FaExclamationTriangle className="me-2" />
                            <strong>Attention !</strong>
                            <br />
                            <small>
                                Ce véhicule est actuellement affecté au chauffeur <strong>{existingAssignment.chauffeur?.matricule} - {existingAssignment.chauffeur?.nom}</strong>.
                                <br />
                                L'ancienne affectation sera automatiquement terminée.
                            </small>
                        </Alert>
                    )}
                    
                    <Form>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Véhicule</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={`${selectedVoitureForChange?.matricule} ${selectedVoitureForChange?.modele ? `- ${selectedVoitureForChange.modele}` : ''}`}
                                        disabled
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Projet actuel</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={getProjetName(existingAssignment?.projet_id)}
                                        disabled
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Nouveau chauffeur *</Form.Label>
                                    <Form.Select
                                        value={changeForm.nouveau_chauffeur_id}
                                        onChange={(e) => setChangeForm(prev => ({ ...prev, nouveau_chauffeur_id: e.target.value }))}
                                        disabled={isUpdating}
                                    >
                                        <option value="">Sélectionner un chauffeur</option>
                                        {getAvailableChauffeurs().map(chauffeur => (
                                            <option key={chauffeur.id} value={chauffeur.id}>
                                                {chauffeur.matricule} - {chauffeur.nom}
                                                {getChauffeurAssignment(chauffeur.id) && chauffeur.id != existingAssignment?.chauffeur_id ? ' (Déjà affecté)' : ''}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Date de début</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={changeForm.date_debut}
                                        onChange={(e) => setChangeForm(prev => ({ ...prev, date_debut: e.target.value }))}
                                        disabled={isUpdating}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>Motif (optionnel)</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                value={changeForm.motif}
                                onChange={(e) => setChangeForm(prev => ({ ...prev, motif: e.target.value }))}
                                placeholder="Raison du changement de chauffeur..."
                                disabled={isUpdating}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowChangeChauffeurModal(false)} disabled={isUpdating}>
                        Annuler
                    </Button>
                    <Button variant="success" onClick={submitChangeChauffeur} disabled={isUpdating || !changeForm.nouveau_chauffeur_id}>
                        {isUpdating ? <Spinner size="sm" /> : 'Changer de chauffeur'}
                    </Button>
                </Modal.Footer>
            </Modal>
            
            {/* MODAL TERMINER AFFECTATION */}
            <Modal show={showFinAffectationModal} onHide={() => setShowFinAffectationModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <FaBan className="me-2" />
                        Terminer l'affectation
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedAffectation && (
                        <>
                            <p>
                                <strong>Chauffeur:</strong> {selectedAffectation.chauffeur?.matricule} - {selectedAffectation.chauffeur?.nom}<br />
                                <strong>Véhicule:</strong> {selectedAffectation.voiture?.matricule}<br />
                                <strong>Projet:</strong> {selectedAffectation.projet?.name || 'Non spécifié'}
                            </p>
                            <Form.Group className="mb-3">
                                <Form.Label>Motif de fin *</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={motifFin}
                                    onChange={(e) => setMotifFin(e.target.value)}
                                    placeholder="Expliquez la raison de la fin de cette affectation..."
                                    disabled={isUpdating}
                                />
                            </Form.Group>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowFinAffectationModal(false)} disabled={isUpdating}>
                        Annuler
                    </Button>
                    <Button variant="danger" onClick={submitFinAffectation} disabled={isUpdating}>
                        {isUpdating ? <Spinner size="sm" /> : 'Terminer'}
                    </Button>
                </Modal.Footer>
            </Modal>
            
            {/* MODAL AJOUT/MODIFICATION CHAUFFEUR */}
            <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {isEditing ? 'Modifier' : 'Ajouter'} un chauffeur
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Matricule *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="matricule"
                                        value={currentChauffeur.matricule}
                                        onChange={handleInputChange}
                                        disabled={isUpdating}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Nom *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="nom"
                                        value={currentChauffeur.nom}
                                        onChange={handleInputChange}
                                        disabled={isUpdating}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Statut</Form.Label>
                                    <Form.Select
                                        name="statut"
                                        value={currentChauffeur.statut}
                                        onChange={handleInputChange}
                                        disabled={isUpdating}
                                    >
                                        <option value="ACTIF">Actif</option>
                                        <option value="INACTIF">Inactif</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Projet</Form.Label>
                                    <Form.Select
                                        name="projet_id"
                                        value={currentChauffeur.projet_id}
                                        onChange={handleInputChange}
                                        disabled={isUpdating}
                                    >
                                        <option value="">Aucun</option>
                                        {projets.map(projet => (
                                            <option key={projet.id} value={projet.id}>
                                                {projet.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Véhicule</Form.Label>
                                    <Form.Select
                                        name="voiture_id"
                                        value={currentChauffeur.voiture_id}
                                        onChange={handleInputChange}
                                        disabled={isUpdating}
                                    >
                                        <option value="">Aucun</option>
                                        {voitures.map(voiture => (
                                            <option key={voiture.id} value={voiture.id}>
                                                {voiture.matricule}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Date affectation</Form.Label>
                                    <Form.Control
                                        type="datetime-local"
                                        name="date_affectation"
                                        value={currentChauffeur.date_affectation}
                                        onChange={handleInputChange}
                                        disabled={isUpdating}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddModal(false)} disabled={isUpdating}>
                        Annuler
                    </Button>
                    <Button
                        variant="primary"
                        onClick={submitChauffeur}
                        disabled={!currentChauffeur.matricule || !currentChauffeur.nom || isUpdating}
                    >
                        {isUpdating ? <Spinner size="sm" /> : (isEditing ? 'Modifier' : 'Ajouter')}
                    </Button>
                </Modal.Footer>
            </Modal>
            
            {/* MODAL SUPPRESSION CHAUFFEUR */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <FaTrash className="me-2" />
                        Confirmer la suppression
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {chauffeurToDelete && (
                        <p>
                            Voulez-vous supprimer le chauffeur <strong>{chauffeurToDelete.matricule} - {chauffeurToDelete.nom}</strong> ?
                        </p>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={isUpdating}>
                        Annuler
                    </Button>
                    <Button variant="danger" onClick={confirmDelete} disabled={isUpdating}>
                        {isUpdating ? <Spinner size="sm" /> : 'Supprimer'}
                    </Button>
                </Modal.Footer>
            </Modal>
            
            {/* MODAL AJOUT DE VÉHICULE */}
            <Modal show={showAddVehiculeModal} onHide={() => setShowAddVehiculeModal(false)} size="lg">
                <Modal.Header closeButton className="bg-success text-white">
                    <Modal.Title>
                        <FaCar className="me-2" />
                        Ajouter un nouveau véhicule
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Alert variant="info" className="mb-3">
                            <FaInfoCircle className="me-2" />
                            Remplissez les informations du nouveau véhicule. Le matricule est obligatoire.
                        </Alert>
                        
                        <Form.Group className="mb-3">
                            <Form.Label>Matricule *</Form.Label>
                            <Form.Control
                                type="text"
                                value={newVehicule.matricule}
                                onChange={(e) => setNewVehicule(prev => ({ ...prev, matricule: e.target.value }))}
                                placeholder="Ex: CH-001"
                                disabled={isAddingVehicule}
                            />
                        </Form.Group>
                        
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Marque</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newVehicule.marque}
                                        onChange={(e) => setNewVehicule(prev => ({ ...prev, marque: e.target.value }))}
                                        placeholder="Ex: Toyota"
                                        disabled={isAddingVehicule}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Modèle</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newVehicule.modele}
                                        onChange={(e) => setNewVehicule(prev => ({ ...prev, modele: e.target.value }))}
                                        placeholder="Ex: Hilux"
                                        disabled={isAddingVehicule}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Site</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newVehicule.site}
                                        onChange={(e) => setNewVehicule(prev => ({ ...prev, site: e.target.value }))}
                                        placeholder="Ex: Site A"
                                        disabled={isAddingVehicule}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Compteur actuel (km)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={newVehicule.compteur_actuel}
                                        onChange={(e) => setNewVehicule(prev => ({ ...prev, compteur_actuel: parseFloat(e.target.value) || 0 }))}
                                        min="0"
                                        step="1"
                                        placeholder="0"
                                        disabled={isAddingVehicule}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddVehiculeModal(false)} disabled={isAddingVehicule}>
                        Annuler
                    </Button>
                    <Button 
                        variant="success" 
                        onClick={submitVehicule} 
                        disabled={!newVehicule.matricule.trim() || isAddingVehicule}
                    >
                        {isAddingVehicule ? <Spinner size="sm" className="me-2" /> : <FaPlus className="me-2" />}
                        Ajouter le véhicule
                    </Button>
                </Modal.Footer>
            </Modal>
            
            {/* MODAL HISTORIQUE INDIVIDUEL */}
            <Modal show={showHistoriqueModal} onHide={() => setShowHistoriqueModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <FaHistory className="me-2" />
                        Historique des affectations - {historiqueTitre}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="table-responsive">
                        <Table striped bordered hover size="sm">
                            <thead className="table-dark">
                                <tr>
                                    <th>Date début</th>
                                    <th>Date fin</th>
                                    <th>{historiqueType === 'chauffeur' ? 'Véhicule' : 'Chauffeur'}</th>
                                    <th>Matricule</th>
                                    <th>Projet</th>
                                    <th className="text-center">Durée (jours)</th>
                                    <th className="text-center">Statut</th>
                                    <th>Motif fin</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historiqueIndividuel.length > 0 ? (
                                    historiqueIndividuel.map((item, index) => (
                                        <tr key={item.id || index}>
                                            <td>{formatDate(item.date_debut)}</td>
                                            <td>{formatDate(item.date_fin)}</td>
                                            <td>
                                                {historiqueType === 'chauffeur' 
                                                    ? (item.voiture || item.voiture_matricule || '-')
                                                    : (item.chauffeur || item.chauffeur_nom || '-')}
                                            </td>
                                            <td>
                                                {historiqueType === 'chauffeur' 
                                                    ? (item.voiture_matricule || '-')
                                                    : (item.chauffeur_matricule || '-')}
                                            </td>
                                            <td>{item.projet || item.projet_nom || '-'}</td>
                                            <td className="text-center">{item.duree || '-'}</td>
                                            <td className="text-center">
                                                {item.statut === 'active' ? (
                                                    <Badge bg="success">Active</Badge>
                                                ) : item.statut === 'terminee' ? (
                                                    <Badge bg="danger">Terminée</Badge>
                                                ) : (
                                                    <Badge bg="secondary">{item.statut || '-'}</Badge>
                                                )}
                                            </td>
                                            <td>{item.motif_fin || '-'}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4">
                                            <FaInfoCircle className="me-2" />
                                            Aucun historique trouvé pour ce {historiqueType === 'chauffeur' ? 'chauffeur' : 'véhicule'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowHistoriqueModal(false)}>
                        Fermer
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default ChauffeurManager;