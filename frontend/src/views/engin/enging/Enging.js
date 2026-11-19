import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table, Button, Card, Spinner,
  Badge, Form, Modal, Toast, ToastContainer,
  Alert, Row, Col
} from 'react-bootstrap';
import {
  FaTruck, FaExchangeAlt, FaInfoCircle,
  FaSyncAlt, FaCalendarAlt, FaIdCard, FaFilter,
  FaPlus, FaEdit, FaTrash
} from 'react-icons/fa';
import axios from 'axios';
import { format, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

// Configuration API adaptée au backend Laravel
const API_CONFIG = {
  baseURL: 'https://intranet-attm.com/api', // Assurez-vous que c'est le bon chemin
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

const api = axios.create(API_CONFIG);

// Intercepteur pour gérer les réponses Laravel
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error Details:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

// Types d'engins prédéfinis (correspondant à votre base de données)
const TYPES_ENGINS = [
  { value: 'Bulldozer Caterpillar', label: 'Bulldozer Caterpillar' },
  { value: 'Chargeuse Caterpillar', label: 'Chargeuse Caterpillar' },
  { value: 'Chargeuse Johndeere', label: 'Chargeuse Johndeere' },
  { value: 'Pelle Caterpillar', label: 'Pelle Caterpillar' },
  { value: 'Pelle Hitachi', label: 'Pelle Hitachi' },
  { value: 'Niveleuse John Deere', label: 'Niveleuse John Deere' },
  { value: 'Niveleuse Caterpillar', label: 'Niveleuse Caterpillar' },
  { value: 'Compacteur Tandem Application', label: 'Compacteur Tandem Application' },
  { value: 'Compacteur Pneus', label: 'Compacteur Pneus' },
  { value: 'Compacteur Cylindre Terrassement', label: 'Compacteur Cylindre Terrassement' },
  { value: 'Compacteur Pneus Terrassement', label: 'Compacteur Pneus Terrassement' },
  { value: 'Compacteur Pneus Application', label: 'Compacteur Pneus Application' },
  { value: 'Finisseur Vogle', label: 'Finisseur Vogle' },
  { value: 'Finisseur Volvo', label: 'Finisseur Volvo' },
  { value: 'Grue Grove', label: 'Grue Grove' },
  { value: 'Grue Zoom Lion', label: 'Grue Zoom Lion' },
  { value: 'Grue Liebherr', label: 'Grue Liebherr' },
  { value: 'Grue Terex', label: 'Grue Terex' },
  { value: 'Grue Zoom Lion 100T', label: 'Grue Zoom Lion 100T' },
  { value: 'M-Fonction Caterpillar', label: 'M-Fonction Caterpillar' },
  { value: 'Tractopelle Caterpillar', label: 'Tractopelle Caterpillar' },
  { value: 'Bob Cat', label: 'Bob Cat' },
  { value: 'autre', label: 'Autre (personnalisé)' }
];

const EnginManager = () => {
  // États principaux
  const [engins, setEngins] = useState([]);
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedTypeEngin, setSelectedTypeEngin] = useState(null);
  
  // États pour les modales
  const [showReaffectModal, setShowReaffectModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // États pour les données
  const [selectedEngin, setSelectedEngin] = useState(null);
  const [enginToDelete, setEnginToDelete] = useState(null);
  const [currentEngin, setCurrentEngin] = useState({
    id: null,
    matricule: '',
    marque: '',
    modele: '',
    immatriculation: '',
    projet_id: '',
    type_engin: '',
    type_engin_personnalise: '',
    date_affectation: ''
  });
  
  // États pour les opérations
  const [newProjetId, setNewProjetId] = useState('');
  const [newTypeEngin, setNewTypeEngin] = useState('');
  const [newDateAffectation, setNewDateAffectation] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Fonctions utilitaires
  const formatDisplayDate = useCallback((dateString) => {
    if (!dateString) return 'Non spécifiée';
    try {
      const date = parseISO(dateString);
      return isValid(date) 
        ? format(date, 'dd/MM/yyyy', { locale: fr })
        : dateString;
    } catch {
      return dateString;
    }
  }, []);

  const showToast = useCallback((message, variant = 'success') => {
    const newToast = {
      id: Date.now(),
      message,
      variant
    };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 5000);
  }, []);

  const getProjetName = useCallback((projetData) => {
    if (!projetData) return 'Non affecté';
    // Gère les différents formats possibles
    if (typeof projetData === 'object' && projetData.name) return projetData.name;
    if (projetData.id && projetData.name) return projetData.name;
    // Si c'est un ID, chercher dans la liste des projets
    const projetId = typeof projetData === 'object' ? projetData.id : projetData;
    const projet = projets.find(p => p.id === projetId);
    return projet ? projet.name : 'Projet inconnu';
  }, [projets]);

  const getTypeEnginDisplay = useCallback((engin) => {
    if (engin.type_engin === 'autre' && engin.type_engin_personnalise) {
      return engin.type_engin_personnalise;
    }
    const type = TYPES_ENGINS.find(t => t.value === engin.type_engin);
    return type ? type.label : engin.type_engin || 'Non spécifié';
  }, []);

  // Chargement des données depuis l'API Laravel
  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Appel aux endpoints Laravel
      const [enginsRes, projetsRes] = await Promise.all([
        api.get('/engins?expand=projet'), // Utilise le paramètre expand pour charger les relations
        api.get('/projets') // Assurez-vous que cette route existe dans routes/api.php
      ]);
      
      // Gestion de la réponse Laravel (format { success: true, data: [...] })
      let enginsData = enginsRes.data;
      let projetsData = projetsRes.data;
      
      // Si la réponse a une structure { success: true, data: [] }
      if (enginsData.success === false) {
        throw new Error(enginsData.message || 'Erreur chargement engins');
      }
      
      if (enginsData.data) {
        enginsData = enginsData.data;
      }
      
      if (projetsData.data) {
        projetsData = projetsData.data;
      }
      
      setEngins(Array.isArray(enginsData) ? enginsData : []);
      setProjets(Array.isArray(projetsData) ? projetsData : []);
      
    } catch (err) {
      console.error("Erreur détaillée:", err);
      
      let errorMessage = "Erreur lors du chargement des données";
      
      if (err.code === 'ERR_NETWORK') {
        errorMessage = "Impossible de se connecter au serveur. Vérifiez votre connexion.";
      } else if (err.response?.status === 404) {
        errorMessage = "API non trouvée. Vérifiez que les routes Laravel sont correctement configurées.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
      showToast(errorMessage, 'danger');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Gestion CRUD
  const handleAddEngin = () => {
    setCurrentEngin({
      id: null,
      matricule: '',
      marque: '',
      modele: '',
      immatriculation: '',
      projet_id: '',
      type_engin: '',
      type_engin_personnalise: '',
      date_affectation: new Date().toISOString().split('T')[0]
    });
    setIsEditing(false);
    setShowEditModal(true);
  };

  const handleEditEngin = (engin) => {
    setCurrentEngin({
      id: engin.id,
      matricule: engin.matricule,
      marque: engin.marque || '',
      modele: engin.modele || '',
      immatriculation: engin.immatriculation || '',
      projet_id: engin.projet_id || engin.projet?.id || '',
      type_engin: engin.type_engin || '',
      type_engin_personnalise: engin.type_engin_personnalise || '',
      date_affectation: engin.date_affectation || new Date().toISOString().split('T')[0]
    });
    setIsEditing(true);
    setShowEditModal(true);
  };

  const handleDeleteEngin = (engin) => {
    setEnginToDelete(engin);
    setShowDeleteModal(true);
  };

  const handleReaffectation = (engin) => {
    setSelectedEngin(engin);
    setNewProjetId(engin.projet_id || engin.projet?.id || '');
    setNewTypeEngin(engin.type_engin || '');
    setNewDateAffectation(engin.date_affectation || new Date().toISOString().split('T')[0]);
    setShowReaffectModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentEngin(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Opérations CRUD
  const submitEngin = async () => {
    if (!currentEngin.matricule || !currentEngin.matricule.trim()) {
      showToast("Le matricule est obligatoire", 'warning');
      return;
    }

    if (!currentEngin.projet_id) {
      showToast("Veuillez sélectionner un projet", 'warning');
      return;
    }

    try {
      setIsUpdating(true);
      
      // Préparer les données au format attendu par Laravel
      const enginData = {
        matricule: currentEngin.matricule.trim(),
        marque: currentEngin.marque.trim() || null,
        modele: currentEngin.modele.trim() || null,
        immatriculation: currentEngin.immatriculation.trim() || null,
        projet_id: parseInt(currentEngin.projet_id),
        type_engin: currentEngin.type_engin || null,
        type_engin_personnalise: currentEngin.type_engin === 'autre' ? 
          currentEngin.type_engin_personnalise.trim() || null : null,
        date_affectation: currentEngin.date_affectation
      };

      if (isEditing) {
        await api.put(`/engins/${currentEngin.id}`, enginData);
        showToast(`Engin ${currentEngin.matricule} modifié avec succès`);
      } else {
        await api.post('/engins', enginData);
        showToast(`Engin ${currentEngin.matricule} ajouté avec succès`);
      }
      
      refreshData();
      setShowEditModal(false);
    } catch (err) {
      console.error("Erreur détaillée:", err);
      
      let errorMessage = "Erreur lors de l'opération";
      
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        errorMessage = Object.values(errors).flat().join(', ');
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      showToast(`Erreur: ${errorMessage}`, 'danger');
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmReaffectation = async () => {
    if (!newProjetId && !newTypeEngin) {
      showToast("Veuillez sélectionner au moins un projet ou un type d'engin", 'warning');
      return;
    }

    if (!newDateAffectation) {
      showToast("Veuillez sélectionner une date valide", 'warning');
      return;
    }

    try {
      setIsUpdating(true);
      
      // Utiliser l'endpoint spécifique updateAffectation
      if (newProjetId) {
        await api.put(`/engins/${selectedEngin.id}/update-affectation`, {
          projet_id: parseInt(newProjetId),
          date_affectation: newDateAffectation
        });
      }
      
      // Mise à jour du type d'engin si nécessaire
      if (newTypeEngin && newTypeEngin !== selectedEngin.type_engin) {
        await api.put(`/engins/${selectedEngin.id}`, {
          type_engin: newTypeEngin,
          type_engin_personnalise: newTypeEngin === 'autre' ? newTypeEngin : null
        });
      }

      showToast(`Engin ${selectedEngin.matricule} réaffecté avec succès`);
      refreshData();
      setShowReaffectModal(false);
    } catch (err) {
      console.error("Erreur réaffectation:", err);
      
      const errorMessage = err.response?.data?.message || 
                         "Erreur lors de la réaffectation";
      
      showToast(errorMessage, 'danger');
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setIsUpdating(true);
      await api.delete(`/engins/${enginToDelete.id}`);
      showToast(`Engin ${enginToDelete.matricule} supprimé avec succès`);
      refreshData();
      setShowDeleteModal(false);
    } catch (err) {
      console.error("Erreur suppression:", err);
      
      const errorMessage = err.response?.data?.message || 
                         "Erreur lors de la suppression";
      
      showToast(errorMessage, 'danger');
    } finally {
      setIsUpdating(false);
    }
  };

  // Filtrage
  const filteredEngins = useMemo(() => {
    return engins.filter(engin => {
      const enginProjetId = engin.projet_id || engin.projet?.id;
      const projectMatch = selectedProject 
        ? enginProjetId === selectedProject
        : true;
      
      const typeEnginMatch = selectedTypeEngin
        ? engin.type_engin === selectedTypeEngin
        : true;
      
      return projectMatch && typeEnginMatch;
    });
  }, [engins, selectedProject, selectedTypeEngin]);

  return (
    <div className="container py-4">
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h3 className="mb-0 d-flex align-items-center">
              <FaTruck className="me-2" />
              Gestion des Engins
            </h3>
            <div>
              <Button variant="light" onClick={refreshData} disabled={loading} className="me-2">
                <FaSyncAlt className={loading ? "spin" : ""} />
                <span className="ms-2">Rafraîchir</span>
              </Button>
              <Button variant="success" onClick={handleAddEngin} disabled={loading}>
                <FaPlus className="me-1" />
                Ajouter un engin
              </Button>
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
              <div className="mt-3">
                <Button variant="outline-danger" onClick={refreshData}>
                  Réessayer
                </Button>
                <Button 
                  variant="outline-secondary" 
                  className="ms-2"
                  onClick={() => window.location.reload()}
                >
                  Recharger la page
                </Button>
              </div>
            </Alert>
          ) : (
            <>
              <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
                {toasts.map(toast => (
                  <Toast 
                    key={toast.id}
                    bg={toast.variant}
                    autohide
                    delay={5000}
                  >
                    <Toast.Body className="text-white">{toast.message}</Toast.Body>
                  </Toast>
                ))}
              </ToastContainer>

              <div className="row mb-4">
                <div className="col-md-5">
                  <div className="d-flex align-items-center mb-3">
                    <FaFilter className="me-2 fs-5" />
                    <Form.Label className="me-2 mb-0">Filtrer par projet:</Form.Label>
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
                  </div>
                </div>
                <div className="col-md-5">
                  <div className="d-flex align-items-center mb-3">
                    <FaFilter className="me-2 fs-5" />
                    <Form.Label className="me-2 mb-0">Filtrer par type d'engin:</Form.Label>
                    <Form.Select 
                      value={selectedTypeEngin || ''}
                      onChange={(e) => setSelectedTypeEngin(e.target.value || null)}
                    >
                      <option value="">Tous les types</option>
                      {TYPES_ENGINS.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                </div>
                <div className="col-md-2">
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => {
                      setSelectedProject(null);
                      setSelectedTypeEngin(null);
                    }}
                    className="w-100"
                  >
                    Effacer les filtres
                  </Button>
                </div>
                <div className="col-12 mt-2">
                  <Badge bg="warning" text="dark" pill className="fs-6 px-3 py-2">
                    {filteredEngins.length} engin(s) trouvé(s)
                  </Badge>
                </div>
              </div>

              {filteredEngins.length === 0 ? (
                <Alert variant="info" className="text-center">
                  <FaInfoCircle className="me-2" />
                  Aucun engin trouvé avec les critères sélectionnés.
                </Alert>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead className="table-dark">
                      <tr>
                        <th><FaIdCard className="me-2" />Matricule</th>
                        <th>Marque</th>
                        <th>Modèle</th>
                        <th>Immatriculation</th>
                        <th>
                          <FaCalendarAlt className="me-2" />
                          Date Affectation
                        </th>
                        <th>Projet</th>
                        <th>Type d'Engin</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEngins.map(engin => (
                        <tr key={engin.id}>
                          <td>{engin.matricule}</td>
                          <td>{engin.marque || '-'}</td>
                          <td>{engin.modele || '-'}</td>
                          <td>{engin.immatriculation || '-'}</td>
                          <td>{formatDisplayDate(engin.date_affectation)}</td>
                          <td>{getProjetName(engin.projet || engin.projet_id)}</td>
                          <td>{getTypeEnginDisplay(engin)}</td>
                          <td className="d-flex gap-2">
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => handleReaffectation(engin)}
                              title="Réaffecter"
                            >
                              <FaExchangeAlt />
                            </Button>
                            <Button 
                              variant="outline-warning" 
                              size="sm"
                              onClick={() => handleEditEngin(engin)}
                              title="Modifier l'engin"
                            >
                              <FaEdit />
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => handleDeleteEngin(engin)}
                              title="Supprimer l'engin"
                            >
                              <FaTrash />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}

              {/* Modale de réaffectation */}
              <Modal show={showReaffectModal} onHide={() => !isUpdating && setShowReaffectModal(false)}>
                <Modal.Header closeButton>
                  <Modal.Title>
                    <FaExchangeAlt className="me-2" />
                    Réaffectation d'engin
                  </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  {selectedEngin && (
                    <>
                      <div className="mb-3 p-3 bg-light rounded">
                        <p><strong>Engin:</strong> {selectedEngin.matricule}</p>
                        <p><strong>Marque:</strong> {selectedEngin.marque || 'Non spécifié'}</p>
                        <p><strong>Modèle:</strong> {selectedEngin.modele || 'Non spécifié'}</p>
                        <p>
                          <strong>Projet actuel:</strong> {getProjetName(selectedEngin.projet || selectedEngin.projet_id)}
                        </p>
                        <p>
                          <strong>Type actuel:</strong> {getTypeEnginDisplay(selectedEngin)}
                        </p>
                        <p>
                          <strong>Affecté depuis:</strong> {formatDisplayDate(selectedEngin.date_affectation)}
                        </p>
                      </div>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Nouveau projet</Form.Label>
                        <Form.Select 
                          value={newProjetId}
                          onChange={(e) => setNewProjetId(e.target.value)}
                          disabled={isUpdating}
                        >
                          <option value="">Sélectionnez un projet</option>
                          {projets.map(projet => (
                            <option key={projet.id} value={projet.id}>
                              {projet.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Nouveau type d'engin</Form.Label>
                        <Form.Select 
                          value={newTypeEngin}
                          onChange={(e) => setNewTypeEngin(e.target.value)}
                          disabled={isUpdating}
                        >
                          <option value="">Sélectionnez un type</option>
                          {TYPES_ENGINS.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Nouvelle date d'affectation</Form.Label>
                        <Form.Control
                          type="date"
                          value={newDateAffectation}
                          onChange={(e) => setNewDateAffectation(e.target.value)}
                          disabled={isUpdating}
                          required
                        />
                      </Form.Group>
                    </>
                  )}
                </Modal.Body>
                <Modal.Footer>
                  <Button 
                    variant="secondary" 
                    onClick={() => setShowReaffectModal(false)}
                    disabled={isUpdating}
                  >
                    Annuler
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={confirmReaffectation}
                    disabled={(!newProjetId && !newTypeEngin) || !newDateAffectation || isUpdating}
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

              {/* Modale d'ajout/modification */}
              <Modal show={showEditModal} onHide={() => !isUpdating && setShowEditModal(false)} size="lg">
                <Modal.Header closeButton>
                  <Modal.Title>
                    {isEditing ? (
                      <>
                        <FaEdit className="me-2" />
                        Modifier l'engin
                      </>
                    ) : (
                      <>
                        <FaPlus className="me-2" />
                        Ajouter un nouvel engin
                      </>
                    )}
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
                            value={currentEngin.matricule}
                            onChange={handleInputChange}
                            required
                            placeholder="Ex: ENG-001"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Type d'Engin</Form.Label>
                          <Form.Select
                            name="type_engin"
                            value={currentEngin.type_engin}
                            onChange={handleInputChange}
                          >
                            <option value="">Sélectionnez un type</option>
                            {TYPES_ENGINS.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    {currentEngin.type_engin === 'autre' && (
                      <Form.Group className="mb-3">
                        <Form.Label>Type d'engin personnalisé</Form.Label>
                        <Form.Control
                          type="text"
                          name="type_engin_personnalise"
                          value={currentEngin.type_engin_personnalise}
                          onChange={handleInputChange}
                          placeholder="Entrez le type d'engin personnalisé"
                        />
                      </Form.Group>
                    )}

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Marque</Form.Label>
                          <Form.Control
                            type="text"
                            name="marque"
                            value={currentEngin.marque}
                            onChange={handleInputChange}
                            placeholder="Ex: Caterpillar"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Modèle</Form.Label>
                          <Form.Control
                            type="text"
                            name="modele"
                            value={currentEngin.modele}
                            onChange={handleInputChange}
                            placeholder="Ex: D6T"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Immatriculation</Form.Label>
                          <Form.Control
                            type="text"
                            name="immatriculation"
                            value={currentEngin.immatriculation}
                            onChange={handleInputChange}
                            placeholder="Ex: 1234-TUN-5678"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Date d'affectation</Form.Label>
                          <Form.Control
                            type="date"
                            name="date_affectation"
                            value={currentEngin.date_affectation}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Projet *</Form.Label>
                      <Form.Select
                        name="projet_id"
                        value={currentEngin.projet_id}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Sélectionnez un projet</option>
                        {projets.map(projet => (
                          <option key={projet.id} value={projet.id}>
                            {projet.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Form>
                </Modal.Body>
                <Modal.Footer>
                  <Button 
                    variant="secondary" 
                    onClick={() => setShowEditModal(false)}
                    disabled={isUpdating}
                  >
                    Annuler
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={submitEngin}
                    disabled={!currentEngin.matricule.trim() || !currentEngin.projet_id || isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <Spinner size="sm" animation="border" className="me-2" />
                        En cours...
                      </>
                    ) : isEditing ? 'Enregistrer' : 'Ajouter'}
                  </Button>
                </Modal.Footer>
              </Modal>

              {/* Modale de suppression */}
              <Modal show={showDeleteModal} onHide={() => !isUpdating && setShowDeleteModal(false)}>
                <Modal.Header closeButton>
                  <Modal.Title>
                    <FaTrash className="me-2" />
                    Confirmer la suppression
                  </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  {enginToDelete && (
                    <div>
                      <p>Êtes-vous sûr de vouloir supprimer l'engin :</p>
                      <p><strong>{enginToDelete.matricule}</strong></p>
                      {enginToDelete.marque && <p>Marque: {enginToDelete.marque}</p>}
                      {enginToDelete.modele && <p>Modèle: {enginToDelete.modele}</p>}
                      <p className="text-danger mt-3">⚠️ Cette action est irréversible !</p>
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
            </>
          )}
        </Card.Body>
      </Card>

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default EnginManager;