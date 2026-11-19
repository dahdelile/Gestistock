import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Card, Spinner,
  Badge, Form, Modal, Toast, ToastContainer,
  Alert, Row, Col, InputGroup
} from 'react-bootstrap';
import {
  FaFilter, FaExchangeAlt, FaInfoCircle,
  FaSyncAlt, FaUserTie, FaCalendarAlt,
  FaPlus, FaEdit, FaTrash, FaCar, FaSearch,
  FaLock, FaUserShield, FaUser
} from 'react-icons/fa';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// ✅ CONFIGURATION API - Utiliser les variables d'environnement Vite
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://intranet-attm.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// ✅ INTERCEPTEUR POUR GESTION AUTHENTIFICATION - Clé cohérente avec LoginPage.jsx
api.interceptors.request.use(
  config => {
    // ✅ Utiliser 'auth_token' pour correspondre à LoginPage.jsx (PAS 'token')
    const token = localStorage.getItem('auth_token') || 
                  sessionStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      console.warn('Session expirée');
      // ✅ Nettoyer les mêmes clés que LoginPage utilise
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
    }
    if (error.response?.status === 403) {
      console.warn('Accès refusé - Permissions insuffisantes');
    }
    return Promise.reject(error);
  }
);

const ChauffeurManager = () => {
  // États principaux
  const [chauffeurs, setChauffeurs] = useState([]);
  const [projets, setProjets] = useState([]);
  const [voitures, setVoitures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  
  // États pour la recherche
  const [searchTerm, setSearchTerm] = useState('');
  
  // États pour la modale
  const [showModal, setShowModal] = useState(false);
  const [selectedChauffeur, setSelectedChauffeur] = useState(null);
  const [newProjetId, setNewProjetId] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [toasts, setToasts] = useState([]);
  
  // États pour l'ajout/modification d'un chauffeur
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentChauffeur, setCurrentChauffeur] = useState({
    id: null,
    matricule: '',
    nom: '',
    statut: 'ACTIF',
    projet_id: '',
    voiture_id: '',
    projet_actuel_id: '',
    date_affectation: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  
  // États pour la suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [chauffeurToDelete, setChauffeurToDelete] = useState(null);
  
  // ✅ ÉTATS POUR L'AUTHENTIFICATION ET LES RÔLES
  const [userRole, setUserRole] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // ✅ FONCTION UTILITAIRE : Vérifier si l'utilisateur a les permissions d'édition
  const canEdit = useCallback(() => {
    return userRole === 'admin' || userRole === 'DM';
  }, [userRole]);

  // ✅ FONCTIONS UTILITAIRES : Vérifier les permissions spécifiques
  const canAdd = useCallback(() => canEdit(), [userRole]);
  const canDelete = useCallback(() => canEdit(), [userRole]);
  const canReassign = useCallback(() => canEdit(), [userRole]);

  // Formater les dates
  const formatDate = (dateString) => {
    if (!dateString) return 'Non spécifiée';
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy HH:mm', { locale: fr });
    } catch {
      return dateString;
    }
  };

  // Afficher les notifications
  const showToast = (message, variant = 'success') => {
    const newToast = { id: Date.now(), message, variant };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 5000);
  };

  // ✅ CHARGER LE RÔLE UTILISATEUR
  const fetchUserRole = useCallback(async () => {
    try {
      setUserLoading(true);
      setAuthError(null);
      
      // Option 1: Récupérer depuis le localStorage si déjà connecté
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        const role = userData.role || userData.roles?.[0] || 'user';
        setUserRole(role);
        setUserLoading(false);
        return;
      }
      
      // Option 2: Appeler l'API pour récupérer le rôle
      // ✅ Utiliser 'auth_token' (cohérent avec LoginPage)
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (!token) {
        setUserRole('user');
        setUserLoading(false);
        return;
      }
      
      const response = await api.get('/user');
      if (response.data) {
        const role = response.data.role || response.data.roles?.[0] || 'user';
        setUserRole(role);
        localStorage.setItem('user', JSON.stringify({
          id: response.data.id,
          email: response.data.email,
          name: response.data.name,
          role: role
        }));
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
  }, []);

  // Fonctions utilitaires avec protections
  const getVoitureInfo = (voitureData) => {
    if (!voitureData) return 'Non affecté';
    if (typeof voitureData === 'object' && voitureData.matricule) return voitureData.matricule;
    if (typeof voitureData === 'number') {
      const voiture = Array.isArray(voitures) ? voitures.find(v => v.id === voitureData) : null;
      return voiture ? voiture.matricule : 'Véhicule inconnu';
    }
    return 'Non affecté';
  };

  const getProjetName = (projetData) => {
    if (!projetData) return 'Non affecté';
    if (typeof projetData === 'object' && projetData.name) return projetData.name;
    if (typeof projetData === 'number') {
      const projet = Array.isArray(projets) ? projets.find(p => p.id === projetData) : null;
      return projet ? projet.name : 'Projet inconnu';
    }
    return 'Non affecté';
  };

  // Fonction pour extraire les données de manière sécurisée
  const extractData = (response) => {
    if (!response || !response.data) return [];
    if (Array.isArray(response.data)) return response.data;
    if (response.data.data && Array.isArray(response.data.data)) return response.data.data;
    return [];
  };

  // Charger les données - ✅ PAS de '/public/' dans les URLs
  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [chauffeursRes, projetsRes, voituresRes] = await Promise.all([
        // ✅ URLs correctes sans '/public/'
        api.get('/chauffeurs/?expand=projet,voiture,projetActuel'),
        api.get('/projets/'),
        api.get('/voitures/')
      ]);
      
      const chauffeursData = extractData(chauffeursRes);
      const projetsData = extractData(projetsRes);
      const voituresData = extractData(voituresRes);
      
      setChauffeurs(chauffeursData);
      setProjets(projetsData);
      setVoitures(voituresData);
      
    } catch (err) {
      console.error("❌ Erreur chargement données:", err);
      
      // ✅ Gestion des erreurs spécifique
      if (!err.response) {
        setError(`Impossible de contacter le serveur. URL API: ${API_BASE_URL}`);
      } else if (err.response.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
      } else if (err.response.status === 403) {
        setError('Accès refusé. Permissions insuffisantes.');
      } else if (err.response.status === 404) {
        setError(`Route API non trouvée. Vérifiez la configuration Laravel.`);
      } else if (err.response.status >= 500) {
        setError('Erreur du serveur. Veuillez réessayer plus tard.');
      } else {
        setError(err.response?.data?.message || err.message || "Erreur de chargement");
      }
      
      setChauffeurs([]);
      setProjets([]);
      setVoitures([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ CHARGEMENT INITIAL : Rôle + Données
  useEffect(() => {
    const initialize = async () => {
      await fetchUserRole();
      await refreshData();
    };
    initialize();
  }, [fetchUserRole]);

  // ✅ LOG DE DEBUG POUR VÉRIFIER L'URL API (à retirer en production)
  useEffect(() => {
    console.log('🔍 ChauffeurManager - API_BASE_URL:', API_BASE_URL);
    console.log('🔍 import.meta.env.VITE_API_URL:', import.meta.env?.VITE_API_URL);
  }, []);

  // Gestion de la réaffectation
  const handleReaffectation = (chauffeur) => {
    if (!canReassign()) {
      showToast("Seuls les administrateurs et DM peuvent réaffecter des chauffeurs", 'warning');
      return;
    }
    setSelectedChauffeur(chauffeur);
    setNewProjetId(chauffeur.projet_actuel_id || '');
    setShowModal(true);
  };

  const confirmReaffectation = async () => {
    if (!selectedChauffeur) return;
    
    if (!canReassign()) {
      showToast("Action non autorisée. Vous n'avez pas les permissions nécessaires.", 'danger');
      return;
    }
    
    setIsUpdating(true);
    try {
      const response = await api.put(`/chauffeurs/${selectedChauffeur.id}`, {
        projet_actuel_id: newProjetId || null
      });
      showToast(response.data.message || `Chauffeur ${selectedChauffeur.nom} réaffecté avec succès`);
      refreshData();
      setShowModal(false);
    } catch (err) {
      console.error("Erreur:", err);
      if (err.response?.status === 403) {
        showToast("Accès refusé. Vous n'avez pas les permissions nécessaires.", 'danger');
      } else if (!err.response) {
        showToast(`Impossible de contacter le serveur. URL: ${API_BASE_URL}`, 'danger');
      } else {
        showToast(err.response?.data?.message || err.message || "Erreur lors de la réaffectation", 'danger');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Gestion de l'ajout/modification d'un chauffeur
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
      projet_actuel_id: '',
      date_affectation: new Date().toISOString().split('.')[0]
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
      id: chauffeur.id,
      matricule: chauffeur.matricule || '',
      nom: chauffeur.nom || '',
      statut: chauffeur.statut || 'ACTIF',
      projet_id: chauffeur.projet_id || '',
      voiture_id: chauffeur.voiture_id || '',
      projet_actuel_id: chauffeur.projet_actuel_id || '',
      date_affectation: chauffeur.date_affectation ? chauffeur.date_affectation.split('.')[0] : ''
    });
    setIsEditing(true);
    setShowAddModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentChauffeur(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const submitChauffeur = async () => {
    if (!canEdit()) {
      showToast("Action non autorisée. Vous n'avez pas les permissions nécessaires.", 'danger');
      return;
    }
    
    try {
      setIsUpdating(true);
      const chauffeurData = {
        matricule: currentChauffeur.matricule,
        nom: currentChauffeur.nom,
        statut: currentChauffeur.statut,
        projet_id: currentChauffeur.projet_id || null,
        voiture_id: currentChauffeur.voiture_id || null,
        projet_actuel_id: currentChauffeur.projet_actuel_id || null,
        date_affectation: currentChauffeur.date_affectation || new Date().toISOString()
      };
      
      if (isEditing) {
        await api.put(`/chauffeurs/${currentChauffeur.id}`, chauffeurData);
        showToast(`Chauffeur ${currentChauffeur.nom} modifié avec succès`);
      } else {
        await api.post('/chauffeurs', chauffeurData);
        showToast(`Chauffeur ${currentChauffeur.nom} ajouté avec succès`);
      }
      refreshData();
      setShowAddModal(false);
    } catch (err) {
      console.error("Erreur:", err);
      if (err.response?.status === 403) {
        showToast("Accès refusé. Vous n'avez pas les permissions nécessaires.", 'danger');
      } else if (!err.response) {
        showToast(`Impossible de contacter le serveur. URL: ${API_BASE_URL}`, 'danger');
      } else {
        const errorMsg = err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(', ')
          : err.response?.data?.message || err.message || "Erreur lors de l'opération";
        showToast(errorMsg, 'danger');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Gestion de la suppression
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
      await api.delete(`/chauffeurs/${chauffeurToDelete.id}`);
      showToast(`Chauffeur ${chauffeurToDelete.nom} supprimé avec succès`);
      refreshData();
      setShowDeleteModal(false);
    } catch (err) {
      console.error("Erreur:", err);
      if (err.response?.status === 403) {
        showToast("Accès refusé. Vous n'avez pas les permissions nécessaires.", 'danger');
      } else if (!err.response) {
        showToast(`Impossible de contacter le serveur. URL: ${API_BASE_URL}`, 'danger');
      } else {
        showToast(err.response?.data?.message || err.message || "Erreur lors de la suppression", 'danger');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Filtrer les chauffeurs avec recherche
  const filteredChauffeurs = Array.isArray(chauffeurs) ? chauffeurs.filter(chauffeur => {
    if (selectedProject) {
      const projetId = chauffeur.projet_id || (chauffeur.projet && chauffeur.projet.id);
      if (projetId != selectedProject) return false;
    }
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase().trim();
      const matriculeMatch = chauffeur.matricule?.toLowerCase().includes(searchLower);
      const nomMatch = chauffeur.nom?.toLowerCase().includes(searchLower);
      if (!matriculeMatch && !nomMatch) return false;
    }
    return true;
  }) : [];

  const clearSearch = () => {
    setSearchTerm('');
  };

  // ✅ AFFICHAGE PENDANT LE CHARGEMENT DU RÔLE
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

      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h3 className="mb-0 d-flex align-items-center">
              <FaUserTie className="me-2" />
              Gestion des affectations des chauffeurs
            </h3>
            <div className="d-flex align-items-center gap-2">
              <Badge bg={canEdit() ? 'success' : 'secondary'} className="py-2">
                {canEdit() ? (
                  <><FaUserShield className="me-1" /> {userRole === 'admin' ? 'Admin' : 'DM'}</>
                ) : (
                  <><FaUser className="me-1" /> Utilisateur</>
                )}
              </Badge>
              <Button variant="light" onClick={refreshData} disabled={loading} className="me-2">
                <FaSyncAlt className={loading ? "spin" : ""} />
                <span className="ms-2">Rafraîchir</span>
              </Button>
              {canAdd() ? (
                <Button variant="success" onClick={handleAddChauffeur} disabled={loading}>
                  <FaPlus className="me-1" />
                  Ajouter un chauffeur
                </Button>
              ) : (
                <Button variant="outline-secondary" disabled title="Ajout réservé aux admins et DM">
                  <FaPlus className="me-1" />
                  Ajouter un chauffeur
                  <FaLock className="ms-1" size={12} />
                </Button>
              )}
            </div>
          </div>
        </Card.Header>

        <Card.Body>
          {loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Chargement des données...</p>
            </div>
          ) : error ? (
            <Alert variant="danger">
              <FaInfoCircle className="me-2" />
              {error}
              <Button variant="outline-danger" className="ms-3" onClick={refreshData}>
                Réessayer
              </Button>
            </Alert>
          ) : (
            <>
              <div className="row mb-4">
                <div className="col-md-4">
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
                      {Array.isArray(projets) && projets.map(projet => (
                        <option key={projet.id} value={projet.id}>
                          {projet.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group>
                    <Form.Label className="fw-bold">
                      <FaSearch className="me-2" />
                      Recherche par matricule ou nom
                    </Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <FaSearch />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Entrez un matricule ou un nom..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      {searchTerm && (
                        <Button
                          variant="outline-secondary"
                          onClick={clearSearch}
                          title="Effacer la recherche"
                        >
                          ×
                        </Button>
                      )}
                    </InputGroup>
                    <Form.Text className="text-muted">
                      Recherche dans les matricules et noms des chauffeurs
                    </Form.Text>
                  </Form.Group>
                </div>
                <div className="col-md-2 d-flex align-items-end">
                  <Badge bg="primary" pill className="fs-6 px-3 py-2 w-100 text-center">
                    {filteredChauffeurs.length} chauffeur(s)
                  </Badge>
                </div>
              </div>

              {(selectedProject || searchTerm) && (
                <Alert variant="info" className="mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <FaInfoCircle className="me-2" />
                      Filtres actifs :
                      {selectedProject && (
                        <Badge bg="primary" className="ms-2">
                          Projet: {projets.find(p => p.id === selectedProject)?.name}
                        </Badge>
                      )}
                      {searchTerm && (
                        <Badge bg="secondary" className="ms-2">
                          Recherche: "{searchTerm}"
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="outline-info"
                      size="sm"
                      onClick={() => {
                        setSelectedProject(null);
                        setSearchTerm('');
                      }}
                    >
                      Effacer tous les filtres
                    </Button>
                  </div>
                </Alert>
              )}

              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead className="table-dark">
                    <tr>
                      <th>Matricule</th>
                      <th>Nom</th>
                      <th>Statut</th>
                      <th>
                        <FaCalendarAlt className="me-2" />
                        Date Affectation
                      </th>
                      <th>Véhicule</th>
                      <th>Projet</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredChauffeurs.length > 0 ? (
                      filteredChauffeurs.map(chauffeur => (
                        <tr key={chauffeur.id}>
                          <td>
                            <strong>{chauffeur.matricule}</strong>
                          </td>
                          <td>{chauffeur.nom}</td>
                          <td>
                            <Badge bg={
                              chauffeur.statut === 'ACTIF' ? 'success' :
                              chauffeur.statut === 'INACTIF' ? 'danger' : 'warning'
                            }>
                              {chauffeur.statut}
                            </Badge>
                          </td>
                          <td>
                            {formatDate(chauffeur.date_affectation)}
                          </td>
                          <td>
                            {getVoitureInfo(chauffeur.voiture || chauffeur.voiture_id)}
                          </td>
                          <td>{getProjetName(chauffeur.projet || chauffeur.projet_id)}</td>
                          <td className="d-flex gap-2">
                            {canReassign() ? (
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleReaffectation(chauffeur)}
                                title="Changer projet actuel"
                              >
                                <FaExchangeAlt />
                              </Button>
                            ) : (
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                disabled
                                title="Réaffectation réservée aux admins et DM"
                              >
                                <FaLock />
                              </Button>
                            )}
                            
                            {canEdit() ? (
                              <Button
                                variant="outline-warning"
                                size="sm"
                                onClick={() => handleEditChauffeur(chauffeur)}
                                title="Modifier le chauffeur"
                              >
                                <FaEdit />
                              </Button>
                            ) : (
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                disabled
                                title="Modification réservée aux admins et DM"
                              >
                                <FaLock />
                              </Button>
                            )}
                            
                            {canDelete() ? (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDeleteChauffeur(chauffeur)}
                                title="Supprimer le chauffeur"
                              >
                                <FaTrash />
                              </Button>
                            ) : (
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                disabled
                                title="Suppression réservée aux admins et DM"
                              >
                                <FaLock />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center text-muted py-4">
                          <FaInfoCircle className="me-2" />
                          {chauffeurs.length === 0 
                            ? 'Aucun chauffeur trouvé' 
                            : 'Aucun chauffeur ne correspond aux critères de recherche'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>

              {/* Modal de réaffectation */}
              {showModal && !canReassign() ? (
                <Modal show={true} onHide={() => setShowModal(false)} centered>
                  <Modal.Header closeButton className="bg-warning">
                    <Modal.Title><FaLock className="me-2" /> Accès restreint</Modal.Title>
                  </Modal.Header>
                  <Modal.Body className="text-center">
                    <Alert variant="warning">
                      <FaInfoCircle className="me-2" />
                      <strong>Permission refusée</strong>
                      <p className="mb-0 mt-2">
                        Vous devez être administrateur ou DM pour réaffecter des chauffeurs.
                      </p>
                    </Alert>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                      Fermer
                    </Button>
                  </Modal.Footer>
                </Modal>
              ) : showModal && (
                <Modal show={showModal} onHide={() => !isUpdating && setShowModal(false)}>
                  <Modal.Header closeButton>
                    <Modal.Title>
                      <FaExchangeAlt className="me-2" />
                      Réaffectation de chauffeur
                    </Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    {selectedChauffeur && (
                      <>
                        <div className="mb-3">
                          <p><strong>Chauffeur:</strong> {selectedChauffeur.nom} ({selectedChauffeur.matricule})</p>
                          <p>
                            <strong>Projet actuel:</strong> {getProjetName(selectedChauffeur.projet_actuel || selectedChauffeur.projet_actuel_id)}
                          </p>
                          <p>
                            <strong>Affecté depuis:</strong> {formatDate(selectedChauffeur.date_affectation)}
                          </p>
                        </div>
                        <Form.Group className="my-3">
                          <Form.Label>Nouveau projet actuel</Form.Label>
                          <Form.Select
                            value={newProjetId}
                            onChange={(e) => setNewProjetId(e.target.value)}
                            disabled={isUpdating}
                          >
                            <option value="">Aucun projet (désaffecter)</option>
                            {Array.isArray(projets) && projets.map(projet => (
                              <option key={projet.id} value={projet.id}>
                                {projet.name}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </>
                    )}
                  </Modal.Body>
                  <Modal.Footer>
                    <Button
                      variant="secondary"
                      onClick={() => setShowModal(false)}
                      disabled={isUpdating}
                    >
                      Annuler
                    </Button>
                    <Button
                      variant="primary"
                      onClick={confirmReaffectation}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <>
                          <Spinner size="sm" animation="border" className="me-2" />
                          En cours...
                        </>
                      ) : 'Confirmer la réaffectation'}
                    </Button>
                  </Modal.Footer>
                </Modal>
              )}

              {/* Modal d'ajout/modification */}
              {showAddModal && !canEdit() ? (
                <Modal show={true} onHide={() => setShowAddModal(false)} centered>
                  <Modal.Header closeButton className="bg-warning">
                    <Modal.Title><FaLock className="me-2" /> Accès restreint</Modal.Title>
                  </Modal.Header>
                  <Modal.Body className="text-center">
                    <Alert variant="warning">
                      <FaInfoCircle className="me-2" />
                      <strong>Permission refusée</strong>
                      <p className="mb-0 mt-2">
                        Vous devez être administrateur ou DM pour ajouter/modifier des chauffeurs.
                      </p>
                    </Alert>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                      Fermer
                    </Button>
                  </Modal.Footer>
                </Modal>
              ) : showAddModal && (
                <Modal show={showAddModal} onHide={() => !isUpdating && setShowAddModal(false)} size="lg">
                  <Modal.Header closeButton>
                    <Modal.Title>
                      {isEditing ? (
                        <>
                          <FaEdit className="me-2" />
                          Modifier le chauffeur
                        </>
                      ) : (
                        <>
                          <FaPlus className="me-2" />
                          Ajouter un nouveau chauffeur
                        </>
                      )}
                    </Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Matricule *</Form.Label>
                          <Form.Control
                            type="text"
                            name="matricule"
                            value={currentChauffeur.matricule}
                            onChange={handleInputChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Nom complet *</Form.Label>
                          <Form.Control
                            type="text"
                            name="nom"
                            value={currentChauffeur.nom}
                            onChange={handleInputChange}
                            required
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
                          >
                            <option value="ACTIF">Actif</option>
                            <option value="INACTIF">Inactif</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Projet principal</Form.Label>
                          <Form.Select
                            name="projet_id"
                            value={currentChauffeur.projet_id}
                            onChange={handleInputChange}
                          >
                            <option value="">Sélectionnez un projet</option>
                            {Array.isArray(projets) && projets.map(projet => (
                              <option key={projet.id} value={projet.id}>
                                {projet.name}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Projet actuel</Form.Label>
                          <Form.Select
                            name="projet_actuel_id"
                            value={currentChauffeur.projet_actuel_id}
                            onChange={handleInputChange}
                          >
                            <option value="">Aucun projet</option>
                            {Array.isArray(projets) && projets.map(projet => (
                              <option key={projet.id} value={projet.id}>
                                {projet.name}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Véhicule</Form.Label>
                          <Form.Select
                            name="voiture_id"
                            value={currentChauffeur.voiture_id}
                            onChange={handleInputChange}
                          >
                            <option value="">Aucun véhicule</option>
                            {Array.isArray(voitures) && voitures.map(voiture => (
                              <option key={voiture.id} value={voiture.id}>
                                {voiture.matricule}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Date d'affectation</Form.Label>
                          <Form.Control
                            type="datetime-local"
                            name="date_affectation"
                            value={currentChauffeur.date_affectation}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button
                      variant="secondary"
                      onClick={() => setShowAddModal(false)}
                      disabled={isUpdating}
                    >
                      Annuler
                    </Button>
                    <Button
                      variant="primary"
                      onClick={submitChauffeur}
                      disabled={!currentChauffeur.matricule || !currentChauffeur.nom || isUpdating}
                    >
                      {isUpdating ? (
                        <>
                          <Spinner size="sm" animation="border" className="me-2" />
                          En cours...
                        </>
                      ) : isEditing ? 'Enregistrer les modifications' : 'Ajouter le chauffeur'}
                    </Button>
                  </Modal.Footer>
                </Modal>
              )}

              {/* Modal de suppression */}
              {showDeleteModal && !canDelete() ? (
                <Modal show={true} onHide={() => setShowDeleteModal(false)} centered>
                  <Modal.Header closeButton className="bg-warning">
                    <Modal.Title><FaLock className="me-2" /> Accès restreint</Modal.Title>
                  </Modal.Header>
                  <Modal.Body className="text-center">
                    <Alert variant="warning">
                      <FaInfoCircle className="me-2" />
                      <strong>Permission refusée</strong>
                      <p className="mb-0 mt-2">
                        Vous devez être administrateur ou DM pour supprimer des chauffeurs.
                      </p>
                    </Alert>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                      Fermer
                    </Button>
                  </Modal.Footer>
                </Modal>
              ) : showDeleteModal && (
                <Modal show={showDeleteModal} onHide={() => !isUpdating && setShowDeleteModal(false)}>
                  <Modal.Header closeButton>
                    <Modal.Title>
                      <FaTrash className="me-2" />
                      Confirmer la suppression
                    </Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    {chauffeurToDelete && (
                      <div>
                        <p>Êtes-vous sûr de vouloir supprimer le chauffeur :</p>
                        <p><strong>{chauffeurToDelete.nom}</strong> (Matricule: {chauffeurToDelete.matricule}) ?</p>
                        <p className="text-danger">Cette action est irréversible !</p>
                      </div>
                    )}
                  </Modal.Body>
                  <Modal.Footer>
                    <Button
                      variant="secondary"
                      onClick={() => setShowDeleteModal(false)}
                      disabled={isUpdating}
                    >
                      Annuler
                    </Button>
                    <Button
                      variant="danger"
                      onClick={confirmDelete}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <>
                          <Spinner size="sm" animation="border" className="me-2" />
                          En cours...
                        </>
                      ) : 'Confirmer la suppression'}
                    </Button>
                  </Modal.Footer>
                </Modal>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default ChauffeurManager;