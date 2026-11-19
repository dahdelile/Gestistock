import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Table, Button, Form, Badge, Alert, Spinner, Modal, 
  InputGroup, Card, Row, Col, Nav, Toast, ToastContainer
} from 'react-bootstrap';
import { 
  FaEdit, FaTrash, FaPlus, FaSearch, FaFilter, 
  FaExclamationTriangle, FaCog, FaCar, FaCalendarAlt,
  FaTachometerAlt, FaClock, FaSync, FaInfoCircle,
  FaCheckCircle, FaTimes, FaChartLine
} from 'react-icons/fa';

const API_BASE_URL = 'https://intranet-attm.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000
});

// Intercepteur pour gérer les réponses
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

// Configuration des endpoints - CORRIGÉE pour correspondre aux routes Laravel
const API_ENDPOINTS = {
  engins: '/engins',
  entretienEngins: '/entretiens-engin',  // ← Correspond à votre route Laravel
  heuresMarche: '/heures-marche'
};

const GestionEntretienEngins = () => {
  // États
  const [entretiens, setEntretiens] = useState([]);
  const [engins, setEngins] = useState([]);
  const [heuresMarche, setHeuresMarche] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEntretien, setEditingEntretien] = useState(null);
  const [activeTab, setActiveTab] = useState('tous');
  const [toasts, setToasts] = useState([]);
  
  const [formData, setFormData] = useState({
    engin: '',
    heureMarche: '',
    date_visite: new Date().toISOString().split('T')[0],
    type_vidange: '',
    hdm_visite: '',
    hdm_actuel: ''
  });

  // Filtres
  const [filters, setFilters] = useState({
    searchTerm: '',
    filterEngin: '',
    filterType: ''
  });

  // Types de vidange
  const typesVidange = [
    { value: '200', label: '200 heures' },
    { value: '400', label: '400 heures' },
    { value: '600', label: '600 heures' },
    { value: '800', label: '800 heures' },
    { value: '1000', label: '1000 heures' }
  ];

  // Fonction pour afficher les toasts
  const showToast = useCallback((message, variant = 'success') => {
    const newToast = { id: Date.now(), message, variant };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 5000);
  }, []);

  // Récupération du dernier HDM d'un engin
  const getDernierHdmEngin = useCallback((enginId) => {
    if (!Array.isArray(heuresMarche)) return null;
    
    const heuresEngin = heuresMarche.filter(h => h.engin === enginId);
    if (heuresEngin.length === 0) return null;
    
    const derniereHeureMarche = heuresEngin.sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    )[0];
    
    return derniereHeureMarche;
  }, [heuresMarche]);

  // Chargement des données
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [enginsRes, entretiensRes, heuresMarcheRes] = await Promise.allSettled([
        api.get(API_ENDPOINTS.engins),
        api.get(API_ENDPOINTS.entretienEngins),
        api.get(API_ENDPOINTS.heuresMarche)
      ]);
      
      // Traitement des engins
      let enginsData = [];
      if (enginsRes.status === 'fulfilled') {
        const data = enginsRes.value.data;
        enginsData = data.data || data;
        setEngins(Array.isArray(enginsData) ? enginsData : []);
      } else {
        console.warn('Erreur chargement engins:', enginsRes.reason);
      }
      
      // Traitement des entretiens
      let entretiensData = [];
      if (entretiensRes.status === 'fulfilled') {
        const data = entretiensRes.value.data;
        entretiensData = data.data || data.results || data;
        setEntretiens(Array.isArray(entretiensData) ? entretiensData : []);
      } else {
        console.warn('Erreur chargement entretiens:', entretiensRes.reason);
      }
      
      // Traitement des heures de marche
      let heuresData = [];
      if (heuresMarcheRes.status === 'fulfilled') {
        const data = heuresMarcheRes.value.data;
        heuresData = data.data || data;
        setHeuresMarche(Array.isArray(heuresData) ? heuresData : []);
      } else {
        console.warn('Erreur chargement heures marche:', heuresMarcheRes.reason);
      }
      
    } catch (err) {
      console.error('Erreur détaillée:', err);
      setError(`Erreur de chargement des données: ${err.message}`);
      showToast('Erreur de chargement des données', 'danger');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Synchronisation du HDM actuel
  const synchroniserHdmActuel = useCallback(() => {
    const enginId = parseInt(formData.engin);
    if (!enginId) {
      showToast('Veuillez d\'abord sélectionner un engin', 'warning');
      return;
    }
    
    const derniereHeureMarche = getDernierHdmEngin(enginId);
    
    if (derniereHeureMarche && derniereHeureMarche.hdm_fin) {
      setFormData(prev => ({
        ...prev,
        hdm_actuel: derniereHeureMarche.hdm_fin,
        heureMarche: derniereHeureMarche.id || ''
      }));
      showToast('HDM synchronisé avec succès', 'success');
    } else {
      showToast('Aucune heure de marche trouvée pour cet engin', 'warning');
    }
  }, [formData.engin, getDernierHdmEngin, showToast]);

  // Gestion des filtres
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({...filters, [name]: value});
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      filterEngin: '',
      filterType: ''
    });
    showToast('Filtres réinitialisés', 'info');
  };

  // Calcul des entretiens filtrés
  const filteredEntretiens = Array.isArray(entretiens) ? entretiens
    .filter(entretien => {
      if (!entretien || typeof entretien !== 'object') return false;
      
      const matchesSearch = filters.searchTerm === '' || 
        (entretien.engin_matricule && entretien.engin_matricule.toLowerCase().includes(filters.searchTerm.toLowerCase())) ||
        (entretien.engin_marque && entretien.engin_marque.toLowerCase().includes(filters.searchTerm.toLowerCase()));

      const matchesEngin = filters.filterEngin === '' || entretien.engin_id === parseInt(filters.filterEngin);
      const matchesType = filters.filterType === '' || entretien.type_vidange === filters.filterType;

      if (activeTab === 'urgents') {
        return matchesSearch && matchesEngin && matchesType && entretien.statut_urgence === 'urgent';
      } else if (activeTab === 'attention') {
        return matchesSearch && matchesEngin && matchesType && entretien.statut_urgence === 'attention';
      } else {
        return matchesSearch && matchesEngin && matchesType;
      }
    })
    .sort((a, b) => new Date(b.date_visite) - new Date(a.date_visite)) : [];

  // Compteurs
  const countUrgents = Array.isArray(entretiens) ? entretiens.filter(e => e?.statut_urgence === 'urgent').length : 0;
  const countAttention = Array.isArray(entretiens) ? entretiens.filter(e => e?.statut_urgence === 'attention').length : 0;

  // Gestion du formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'engin') {
      const enginId = parseInt(value);
      const derniereHeureMarche = getDernierHdmEngin(enginId);
      
      setFormData({
        ...formData,
        engin: value,
        heureMarche: derniereHeureMarche?.id || '',
        hdm_actuel: derniereHeureMarche?.hdm_fin || ''
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Ouvrir le modal en mode édition
  const handleEdit = (entretien) => {
    setEditingEntretien(entretien);
    
    const derniereHeureMarche = getDernierHdmEngin(entretien.engin_id);
    
    setFormData({
      engin: entretien.engin_id,
      heureMarche: entretien.heureMarche_id || derniereHeureMarche?.id || '',
      date_visite: entretien.date_visite?.split('T')[0] || new Date().toISOString().split('T')[0],
      type_vidange: entretien.type_vidange || '',
      hdm_visite: entretien.hdm_visite || '',
      hdm_actuel: entretien.hdm_actuel || derniereHeureMarche?.hdm_fin || ''
    });
    setShowModal(true);
  };

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.engin) {
      showToast('Veuillez sélectionner un engin', 'warning');
      return;
    }
    
    if (!formData.date_visite) {
      showToast('Veuillez saisir la date de visite', 'warning');
      return;
    }
    
    if (!formData.hdm_visite) {
      showToast('Veuillez saisir le HDM de visite', 'warning');
      return;
    }
    
    setSaving(true);
    
    try {
      const payload = {
        engin: parseInt(formData.engin),
        date_visite: formData.date_visite,
        type_vidange: formData.type_vidange || null,
        hdm_visite: parseFloat(formData.hdm_visite),
        hdm_actuel: formData.hdm_actuel ? parseFloat(formData.hdm_actuel) : null,
        heureMarche: formData.heureMarche ? parseInt(formData.heureMarche) : null
      };

      let response;
      if (editingEntretien) {
        response = await api.put(`${API_ENDPOINTS.entretienEngins}/${editingEntretien.id}`, payload);
        setEntretiens(prev => 
          Array.isArray(prev) 
            ? prev.map(e => e.id === editingEntretien.id ? response.data : e)
            : [response.data]
        );
        showToast('Entretien modifié avec succès', 'success');
      } else {
        response = await api.post(API_ENDPOINTS.entretienEngins, payload);
        setEntretiens(prev => 
          Array.isArray(prev) 
            ? [...prev, response.data] 
            : [response.data]
        );
        showToast('Entretien créé avec succès', 'success');
      }
      
      handleCloseModal();
      fetchData();
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      const errorMsg = err.response?.data?.message || err.response?.data?.detail || 'Erreur lors de la sauvegarde';
      showToast(errorMsg, 'danger');
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  // Suppression
  const handleDelete = async (id, matricule) => {
    if (window.confirm(`Confirmer la suppression de l'entretien pour l'engin ${matricule || id} ?`)) {
      try {
        await api.delete(`${API_ENDPOINTS.entretienEngins}/${id}`);
        setEntretiens(prev => 
          Array.isArray(prev) 
            ? prev.filter(e => e.id !== id)
            : []
        );
        showToast('Entretien supprimé avec succès', 'success');
      } catch (err) {
        console.error('Erreur suppression:', err);
        showToast('Erreur lors de la suppression', 'danger');
      }
    }
  };

  // Fermeture du modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEntretien(null);
    setFormData({
      engin: '',
      heureMarche: '',
      date_visite: new Date().toISOString().split('T')[0],
      type_vidange: '',
      hdm_visite: '',
      hdm_actuel: ''
    });
  };

  // Obtenir la couleur du badge selon le statut
  const getStatutBadge = (statut) => {
    switch (statut) {
      case 'urgent':
        return 'danger';
      case 'attention':
        return 'warning';
      case 'normal':
        return 'success';
      default:
        return 'secondary';
    }
  };

  // Obtenir le libellé du statut
  const getStatutLabel = (statut) => {
    switch (statut) {
      case 'urgent':
        return 'Urgent';
      case 'attention':
        return 'Attention';
      case 'normal':
        return 'Normal';
      default:
        return 'Inconnu';
    }
  };

  // Affichage du chargement
  if (loading && entretiens.length === 0) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
      <div className="text-center">
        <Spinner animation="border" variant="primary" size="lg" />
        <p className="mt-3 text-muted">Chargement des entretiens...</p>
      </div>
    </div>
  );

  return (
    <div className="container-fluid py-4">
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
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

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <FaCog className="me-2 text-primary" />
          Gestion des Entretiens d'Engins
        </h2>
        <Button variant="success" onClick={() => setShowModal(true)}>
          <FaPlus className="me-1" /> Nouvel entretien
        </Button>
      </div>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible className="mb-3">
          <FaExclamationTriangle className="me-2" />
          {error}
        </Alert>
      )}

      {/* Navigation par statut */}
      <Card className="mb-3 shadow-sm">
        <Card.Header className="bg-primary text-white">
          <Nav variant="pills" activeKey={activeTab} onSelect={setActiveTab}>
            <Nav.Item>
              <Nav.Link eventKey="tous" className="text-white">
                Tous les entretiens ({Array.isArray(entretiens) ? entretiens.length : 0})
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="attention" className="text-white">
                <FaExclamationTriangle className="me-1" />
                Attention ({countAttention})
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="urgents" className="text-white">
                <FaExclamationTriangle className="me-1" />
                Urgents ({countUrgents})
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Card.Header>
      </Card>

      {/* Filtres */}
      <Card className="mb-3 shadow-sm">
        <Card.Header className="bg-light">
          <h5 className="mb-0">
            <FaFilter className="me-2" /> Filtres
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-2">
                <Form.Label>Recherche</Form.Label>
                <InputGroup>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Matricule, marque ou modèle..."
                    name="searchTerm"
                    value={filters.searchTerm}
                    onChange={handleFilterChange}
                  />
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-2">
                <Form.Label>Engin</Form.Label>
                <Form.Select
                  name="filterEngin"
                  value={filters.filterEngin}
                  onChange={handleFilterChange}
                >
                  <option value="">Tous les engins</option>
                  {Array.isArray(engins) && engins.map(engin => (
                    <option key={engin.id} value={engin.id}>
                      {engin.matricule} - {engin.marque}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-2">
                <Form.Label>Type de vidange</Form.Label>
                <Form.Select
                  name="filterType"
                  value={filters.filterType}
                  onChange={handleFilterChange}
                >
                  <option value="">Tous les types</option>
                  {typesVidange.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2} className="d-flex align-items-end">
              <Button variant="outline-secondary" onClick={resetFilters} className="w-100">
                <FaTimes className="me-1" /> Réinitialiser
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tableau */}
      <Card className="shadow-sm">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table striped bordered hover className="mb-0">
              <thead className="table-dark">
                <tr>
                  <th>Engin</th>
                  <th>Type</th>
                  <th>Date visite</th>
                  <th>Type vidange</th>
                  <th>HDM visite</th>
                  <th>HDM actuel</th>
                  <th>Prochaine visite</th>
                  <th>Heures restantes</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(filteredEntretiens) && filteredEntretiens.length > 0 ? (
                  filteredEntretiens.map(entretien => (
                    <tr key={entretien.id} className={entretien.statut_urgence === 'urgent' ? 'table-danger' : entretien.statut_urgence === 'attention' ? 'table-warning' : ''}>
                      <td>
                        <div>
                          <FaCar className="me-2 text-muted" />
                          <strong>{entretien.engin_matricule || 'N/A'}</strong>
                          <br />
                          <small className="text-muted">
                            {entretien.engin_marque} {entretien.engin_modele}
                          </small>
                        </div>
                      </td>
                      <td>
                        <Badge bg="info">
                          {entretien.engin_type || '-'}
                        </Badge>
                      </td>
                      <td>
                        <FaCalendarAlt className="me-2 text-muted" />
                        {entretien.date_visite ? new Date(entretien.date_visite).toLocaleDateString('fr-FR') : '-'}
                      </td>
                      <td>
                        {entretien.type_vidange ? (
                          <Badge bg="primary">
                            {entretien.type_vidange} heures
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        <FaTachometerAlt className="me-2 text-muted" />
                        {entretien.hdm_visite || '-'}
                      </td>
                      <td>
                        {entretien.hdm_actuel || '-'}
                      </td>
                      <td>
                        <strong>{entretien.prochaine_visite || '-'}</strong>
                      </td>
                      <td>
                        {entretien.heur_restant !== null && entretien.heur_restant !== undefined ? (
                          <span className={entretien.heur_restant < 0 ? 'text-danger fw-bold' : ''}>
                            <FaClock className="me-1" />
                            {entretien.heur_restant}h
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        <Badge bg={getStatutBadge(entretien.statut_urgence)}>
                          {getStatutLabel(entretien.statut_urgence)}
                        </Badge>
                      </td>
                      <td>
                        <Button 
                          variant="outline-warning" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleEdit(entretien)}
                          title="Modifier"
                        >
                          <FaEdit />
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm" 
                          onClick={() => handleDelete(entretien.id, entretien.engin_matricule)}
                          title="Supprimer"
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="text-center py-5">
                      <FaInfoCircle size={40} className="text-muted mb-2" />
                      <p className="text-muted mb-0">
                        {activeTab === 'tous' 
                          ? 'Aucun entretien enregistré' 
                          : `Aucun entretien ${activeTab} ne correspond aux critères`}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Modal d'ajout/modification */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg" backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingEntretien ? (
              <>
                <FaEdit className="me-2" />
                Modifier l'entretien
              </>
            ) : (
              <>
                <FaPlus className="me-2" />
                Nouvel entretien d'engin
              </>
            )}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Engin *</Form.Label>
                  <Form.Select 
                    name="engin" 
                    value={formData.engin} 
                    onChange={handleChange} 
                    required
                    disabled={!!editingEntretien}
                  >
                    <option value="">Sélectionner un engin</option>
                    {Array.isArray(engins) && engins.map(engin => (
                      <option key={engin.id} value={engin.id}>
                        {engin.matricule} - {engin.marque} {engin.modele}
                      </option>
                    ))}
                  </Form.Select>
                  {editingEntretien && (
                    <Form.Text className="text-muted">
                      L'engin ne peut pas être modifié
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date visite *</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <FaCalendarAlt />
                    </InputGroup.Text>
                    <Form.Control 
                      type="date" 
                      name="date_visite" 
                      value={formData.date_visite} 
                      onChange={handleChange} 
                      required 
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Type de vidange</Form.Label>
                  <Form.Select 
                    name="type_vidange" 
                    value={formData.type_vidange} 
                    onChange={handleChange}
                  >
                    <option value="">Sélectionner un type</option>
                    {typesVidange.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>HDM visite *</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <FaTachometerAlt />
                    </InputGroup.Text>
                    <Form.Control 
                      type="number" 
                      name="hdm_visite" 
                      value={formData.hdm_visite} 
                      onChange={handleChange} 
                      required 
                      min="0"
                      step="1"
                      placeholder="HDM au moment de la visite"
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>HDM actuel</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <FaTachometerAlt />
                    </InputGroup.Text>
                    <Form.Control 
                      type="number" 
                      name="hdm_actuel" 
                      value={formData.hdm_actuel} 
                      onChange={handleChange} 
                      min="0"
                      step="1"
                      placeholder="HDM actuel de l'engin"
                      readOnly={!editingEntretien}
                    />
                    {!editingEntretien && (
                      <Button 
                        variant="outline-secondary" 
                        onClick={synchroniserHdmActuel}
                        disabled={!formData.engin}
                        title="Synchroniser avec le dernier HDM de l'engin"
                      >
                        <FaSync />
                      </Button>
                    )}
                  </InputGroup>
                  <Form.Text className="text-muted">
                    {editingEntretien 
                      ? "Modifiable en mode édition" 
                      : "Cliquez sur l'icône de synchronisation pour charger le dernier HDM"}
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end mt-3">
              <Button variant="secondary" onClick={handleCloseModal} className="me-2" disabled={saving}>
                Annuler
              </Button>
              <Button variant="primary" type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    Enregistrement...
                  </>
                ) : (
                  editingEntretien ? 'Modifier' : 'Créer'
                )}
              </Button>
            </div>
          </Modal.Body>
        </Form>
      </Modal>

      <style>{`
        .table-danger {
          background-color: #f8d7da !important;
        }
        .table-warning {
          background-color: #fff3cd !important;
        }
        .table-danger:hover {
          background-color: #f5c6cb !important;
        }
        .table-warning:hover {
          background-color: #ffe8a1 !important;
        }
      `}</style>
    </div>
  );
};

export default GestionEntretienEngins;