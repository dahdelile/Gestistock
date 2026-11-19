import React, { useState, useEffect, useMemo } from 'react';
import { 
  Table, Button, Form, Modal, Badge, Spinner, 
  Alert, Toast, ToastContainer, Row, Col, Card,
  FloatingLabel, Tab, Tabs
} from 'react-bootstrap';
import { 
  FaPlus, FaEdit, FaTrash, FaExclamationTriangle,
  FaCheckCircle, FaTimesCircle, FaTimes,
  FaTools, FaInfoCircle, FaHistory, FaChartPie
} from 'react-icons/fa';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: { 
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// API Service
const ArretService = {
  getAll: async () => {
    try {
      const response = await api.get('/arretages/');
      return response.data.map(arret => ({
        ...arret,
        duree_panne: arret.date_reprise 
          ? (new Date(arret.date_reprise) - new Date(arret.date_arret)) / (1000 * 60 * 60)
          : (new Date() - new Date(arret.date_arret)) / (1000 * 60 * 60)
      }));
    } catch (error) {
      console.error("Erreur API getAll:", error);
      throw error;
    }
  },
  
  getVoituresRoulage: async () => {
    try {
      const response = await api.get('/voitures/?category=ROULAGE');
      return response.data;
    } catch (error) {
      console.error("Erreur API getVoitures:", error);
      throw error;
    }
  },
  
  getProjets: async () => {
    try {
      const response = await api.get('/projets/');
      return response.data;
    } catch (error) {
      console.error("Erreur API getProjets:", error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await api.post('/arretages/', data);
      return response.data;
    } catch (error) {
      console.error("Erreur API create:", error);
      throw error;
    }
  },
  
  update: async (id, data) => {
    try {
      const response = await api.patch(`/arretages/${id}/`, data);
      return response.data;
    } catch (error) {
      console.error("Erreur API update:", error);
      throw error;
    }
  },
  
  delete: async (id) => {
    try {
      await api.delete(`/arretages/${id}/`);
    } catch (error) {
      console.error("Erreur API delete:", error);
      throw error;
    }
  }
};

const StatCard = ({ title, value, variant, icon, description }) => (
  <Col md={3} sm={6} className="mb-3">
    <Card className={`border-0 bg-${variant} text-white h-100 shadow-sm`}>
      <Card.Body>
        <div className="d-flex align-items-center">
          <div className="me-3 fs-2">{icon}</div>
          <div>
            <Card.Title className="fs-6 mb-0">{title}</Card.Title>
            <Card.Text className="fs-4 fw-bold mb-0">{value}</Card.Text>
          </div>
        </div>
        {description && <small className="opacity-75">{description}</small>}
      </Card.Body>
    </Card>
  </Col>
);

const StatusBadge = ({ status }) => {
  const statusConfig = {
    MARCHE: { label: 'En marche', variant: 'success' },
    PANNE: { label: 'En panne', variant: 'danger' },
    NON_UTILISE: { label: 'Non utilisé', variant: 'secondary' }
  };

  const config = statusConfig[status] || { label: status, variant: 'info' };

  return <Badge bg={config.variant}>{config.label}</Badge>;
};

const ArretPage = () => {
  const [state, setState] = useState({
    arrets: [],
    voitures: [],
    projets: [],
    loading: true,
    error: null,
    showModal: false,
    currentArret: null,
    isSubmitting: false,
    toast: { show: false, message: '', variant: 'success' },
    activeTab: 'list'
  });

  const [formData, setFormData] = useState({
    voiture: '',
    projet: null,
    date_arret: new Date().toISOString().slice(0, 16),
    type_panne: '',
    statut: 'PANNE'
  });

  const [filters, setFilters] = useState({
    statut: '',
    startDate: null,
    endDate: null,
    searchQuery: ''
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true }));
        
        const [arrets, voitures, projets] = await Promise.all([
          ArretService.getAll(),
          ArretService.getVoituresRoulage(),
          ArretService.getProjets()
        ]);

        const voitureIds = voitures.map(v => v.id);
        const arretsRoulage = arrets.filter(a => voitureIds.includes(a.voiture));
  
        setState(prev => ({
          ...prev,
          arrets: arretsRoulage,
          voitures,
          projets,
          loading: false,
          error: null
        }));
      } catch (err) {
        console.error("Erreur chargement:", err);
        setState(prev => ({
          ...prev,
          error: err.response?.data?.detail || "Erreur lors du chargement des données",
          loading: false
        }));
      }
    };
    
    loadData();
  }, []);

  const filteredArrets = useMemo(() => {
    return state.arrets.filter(arret => {
      if (filters.statut && arret.statut !== filters.statut) return false;
      
      if (filters.startDate || filters.endDate) {
        const arretDate = new Date(arret.date_arret);
        const startDate = filters.startDate ? new Date(filters.startDate) : null;
        const endDate = filters.endDate ? new Date(filters.endDate) : null;
        
        startDate?.setHours(0, 0, 0, 0);
        endDate?.setHours(23, 59, 59, 999);
        
        if (startDate && endDate && (arretDate < startDate || arretDate > endDate)) return false;
        if (startDate && arretDate < startDate) return false;
        if (endDate && arretDate > endDate) return false;
      }
      
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const voiture = state.voitures.find(v => v.id === arret.voiture);
        const matricule = voiture?.matricule?.toLowerCase() || '';
        const typeVoiture = voiture?.type_voiture?.toLowerCase() || '';
        const projet = state.projets.find(p => p.id === arret.projet);
        const projetNom = projet?.name?.toLowerCase() || '';
        
        if (!matricule.includes(query) && !typeVoiture.includes(query) && !projetNom.includes(query)) {
          return false;
        }
      }
      
      return true;
    });
  }, [state.arrets, state.voitures, state.projets, filters]);

  const stats = useMemo(() => {
    const totalVoitures = state.voitures.length;
    const totalPannes = filteredArrets.filter(a => a.statut === 'PANNE').length;
    const totalMarche = filteredArrets.filter(a => a.statut === 'MARCHE').length;
    const totalNonUtilise = filteredArrets.filter(a => a.statut === 'NON_UTILISE').length;
    
    const tauxDisponibilite = totalVoitures > 0 
      ? ((totalMarche / totalVoitures) * 100) 
      : 0;

    return {
      totalVoitures,
      totalPannes,
      totalMarche,
      totalNonUtilise,
      tauxDisponibilite,
      pannePercentage: totalVoitures > 0 
        ? ((totalPannes / totalVoitures) * 100).toFixed(1)
        : '0'
    };
  }, [filteredArrets, state.voitures]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      if (name === "voiture" && value) {
        const selectedVoiture = state.voitures.find(v => v.id === parseInt(value));
        newData.projet = selectedVoiture?.projet_details?.id || selectedVoiture?.projet || null;
      }
      
      if (name === "statut" && value !== "PANNE") {
        newData.type_panne = '';
      }
      
      return newData;
    });
  };

  const validateFormData = () => {
    const errors = [];
    
    if (!formData.voiture) errors.push("La sélection d'une voiture est obligatoire");
  
    if (!formData.date_arret) {
      errors.push("La date et heure d'arrêt sont obligatoires");
    } else {
      const date = new Date(formData.date_arret);
      const now = new Date();
      
      if (isNaN(date.getTime())) {
        errors.push("Le format de date est invalide");
      } else if (date > now) {
        errors.push("La date d'arrêt ne peut pas être dans le futur");
      }
    }
  
    if (formData.statut === 'PANNE' && !formData.type_panne) {
      errors.push("Le type de panne est obligatoire pour une voiture en panne");
    }
  
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateFormData();
    if (errors.length > 0) {
      showToast(errors.join(', '), 'danger');
      return;
    }
  
    setState(prev => ({ ...prev, isSubmitting: true }));
  
    try {
      const payload = {
        voiture: parseInt(formData.voiture),
        projet: formData.projet ? parseInt(formData.projet) : null,
        date_arret: new Date(formData.date_arret).toISOString(),
        statut: formData.statut,
        type_panne: formData.statut === 'PANNE' ? formData.type_panne : null
      };
  
      let response;
      if (state.currentArret) {
        response = await ArretService.update(state.currentArret.id, payload);
      } else {
        response = await ArretService.create(payload);
      }
  
      setState(prev => {
        const newArrets = state.currentArret
          ? prev.arrets.map(a => a.id === response.id ? response : a)
          : [...prev.arrets, response];
        
        return {
          ...prev,
          arrets: newArrets,
          showModal: false,
          isSubmitting: false
        };
      });
  
      showToast(
        state.currentArret ? "Arrêt mis à jour avec succès" : "Nouvel arrêt enregistré",
        'success'
      );
      resetForm();
    } catch (err) {
      console.error("Erreur:", err);
      showToast(
        err.response?.data?.detail || "Erreur lors de l'enregistrement",
        'danger'
      );
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const showToast = (message, variant = 'success') => {
    setState(prev => ({
      ...prev,
      toast: { show: true, message, variant }
    }));
  };

  const resetForm = () => {
    setFormData({
      voiture: '',
      projet: null,
      date_arret: new Date().toISOString().slice(0, 16),
      type_panne: '',
      statut: 'PANNE'
    });
    setState(prev => ({ ...prev, currentArret: null }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet arrêt ?")) {
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true }));
      await ArretService.delete(id);
      setState(prev => ({
        ...prev,
        arrets: prev.arrets.filter(a => a.id !== id),
        loading: false
      }));
      showToast("Arrêt supprimé avec succès", 'success');
    } catch (err) {
      console.error("Erreur:", err);
      showToast(
        err.response?.data?.detail || "Erreur lors de la suppression",
        'danger'
      );
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const getProjetName = (projetId) => {
    if (!projetId) return 'Non affecté';
    const projet = state.projets.find(p => p.id === projetId);
    return projet ? projet.name : 'Projet inconnu';
  };

  const renderModal = () => (
    <Modal 
      show={state.showModal} 
      onHide={() => {
        setState(prev => ({ ...prev, showModal: false }));
        resetForm();
      }}
      size="lg"
      backdrop="static"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {state.currentArret ? "Modifier l'arrêt" : "Nouvel arrêt"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col md={6}>
              <FloatingLabel label="Voiture *" className="mb-3">
                <Form.Select
                  name="voiture"
                  value={formData.voiture}
                  onChange={handleFormChange}
                  required
                  disabled={state.isSubmitting}
                >
                  <option value=""></option>
                  {state.voitures.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.matricule} - {v.type_voiture}
                    </option>
                  ))}
                </Form.Select>
              </FloatingLabel>
            </Col>
            <Col md={6}>
              <FloatingLabel label="Projet" className="mb-3">
                <Form.Control
                  type="text"
                  value={
                    formData.voiture
                      ? state.voitures.find(v => v.id === parseInt(formData.voiture))?.projet_details?.name || 
                        getProjetName(state.voitures.find(v => v.id === parseInt(formData.voiture))?.projet) || 
                        "Non affecté"
                      : "Sélectionnez d'abord une voiture"
                  }
                  readOnly
                />
              </FloatingLabel>
            </Col>
            <Col md={6}>
              <FloatingLabel label="Date et heure *" className="mb-3">
                <Form.Control
                  type="datetime-local"
                  name="date_arret"
                  value={formData.date_arret}
                  onChange={handleFormChange}
                  required
                  disabled={state.isSubmitting}
                />
              </FloatingLabel>
            </Col>

            <Col md={6}>
              <FloatingLabel label="Statut *" className="mb-3">
                <Form.Select
                  name="statut"
                  value={formData.statut}
                  onChange={handleFormChange}
                  required
                  disabled={state.isSubmitting}
                >
                  <option value="PANNE">En panne</option>
                  <option value="MARCHE">En marche</option>
                  <option value="NON_UTILISE">Non utilisé</option>
                </Form.Select>
              </FloatingLabel>
            </Col>

            {formData.statut === 'PANNE' && (
              <Col md={12}>
                <FloatingLabel label="Type de panne *" className="mb-3">
                  <Form.Select
                    name="type_panne"
                    value={formData.type_panne}
                    onChange={handleFormChange}
                    required
                    disabled={state.isSubmitting}
                  >
                    <option value=""></option>
                    <option value="MECANIQUE">Mécanique</option>
                    <option value="ELECTRIQUE">Électrique</option>
                    <option value="HYDRAULIQUE">Hydraulique</option>
                    <option value="PNEUMATIQUE">Pneumatique</option>
                    <option value="ELECTRONIQUE">Électronique</option>
                    <option value="AUTRE">Autre</option>
                  </Form.Select>
                </FloatingLabel>
              </Col>
            )}
          </Row>

          <div className="d-flex justify-content-end mt-4 gap-2">
            <Button 
              variant="outline-secondary" 
              onClick={() => {
                setState(prev => ({ ...prev, showModal: false }));
                resetForm();
              }}
              disabled={state.isSubmitting}
            >
              Annuler
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={state.isSubmitting}
            >
              {state.isSubmitting ? (
                <>
                  <Spinner as="span" size="sm" animation="border" className="me-2" />
                  Enregistrement...
                </>
              ) : state.currentArret ? (
                "Modifier"
              ) : (
                "Enregistrer"
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );

  return (
    <div className="container py-4">
      <ToastContainer position="top-end" className="p-3">
        <Toast 
          onClose={() => setState(prev => ({ ...prev, toast: { ...prev.toast, show: false }}))}
          show={state.toast.show} 
          bg={state.toast.variant} 
          autohide
          delay={5000}
        >
          <Toast.Header>
            <strong className="me-auto">Notification</strong>
          </Toast.Header>
          <Toast.Body className={state.toast.variant === 'success' ? 'text-white' : ''}>
            {state.toast.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>

      <h2 className="mb-4 text-center">Gestion des Arrêts - Véhicules de Roulage</h2>

      <Tabs
        activeKey={state.activeTab}
        onSelect={(k) => setState(prev => ({ ...prev, activeTab: k }))}
        className="mb-3"
      >
        <Tab eventKey="list" title={<><FaHistory className="me-1" /> Liste</>}>
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <Row className="align-items-end">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Statut</Form.Label>
                    <Form.Select
                      value={filters.statut}
                      onChange={(e) => setFilters({...filters, statut: e.target.value})}
                    >
                      <option value="">Tous les statuts</option>
                      <option value="MARCHE">En marche</option>
                      <option value="PANNE">En panne</option>
                      <option value="NON_UTILISE">Non utilisé</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Recherche</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Matricule, type ou projet..."
                      value={filters.searchQuery}
                      onChange={(e) => setFilters({...filters, searchQuery: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Date de début</Form.Label>
                    <DatePicker
                      selected={filters.startDate}
                      onChange={date => setFilters({...filters, startDate: date})}
                      selectsStart
                      startDate={filters.startDate}
                      endDate={filters.endDate}
                      className="form-control"
                      dateFormat="dd/MM/yyyy"
                      isClearable
                      placeholderText="JJ/MM/AAAA"
                    />
                  </Form.Group>
                </Col>
                
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Date de fin</Form.Label>
                    <DatePicker
                      selected={filters.endDate}
                      onChange={date => setFilters({...filters, endDate: date})}
                      selectsEnd
                      startDate={filters.startDate}
                      endDate={filters.endDate}
                      minDate={filters.startDate}
                      className="form-control"
                      dateFormat="dd/MM/yyyy"
                      isClearable
                      placeholderText="JJ/MM/AAAA"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Row className="mb-4">
            <StatCard 
              title="Véhicules Roulage" 
              value={stats.totalVoitures} 
              variant="primary" 
              icon={<FaTools />}
            />
            <StatCard 
              title="En Marche" 
              value={stats.totalMarche} 
              variant="success" 
              icon={<FaCheckCircle />}
              description={`${stats.tauxDisponibilite.toFixed(1)}% disponibilité`}
            />
            <StatCard 
              title="En Panne" 
              value={stats.totalPannes} 
              variant="danger" 
              icon={<FaTimesCircle />}
              description={`${stats.pannePercentage}% en panne`}
            />
            <StatCard 
              title="Non Utilisé" 
              value={stats.totalNonUtilise} 
              variant="secondary" 
              icon={<FaTimes />}
            />
          </Row>

          <div className="d-flex justify-content-between mb-3">
            <Badge bg="secondary" className="fs-6 align-self-center">
              {filteredArrets.length} arrêt(s) trouvé(s)
            </Badge>
            <Button 
              variant="primary" 
              onClick={() => setState(prev => ({ ...prev, showModal: true }))}
            >
              <FaPlus className="me-2" />
              Nouvel Arrêt
            </Button>
          </div>

          {state.loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Chargement des données...</p>
            </div>
          ) : state.error ? (
            <Alert variant="danger" className="d-flex align-items-center">
              <FaExclamationTriangle className="me-2" />
              {state.error}
            </Alert>
          ) : (
            <Card className="shadow-sm">
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table striped bordered hover className="mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th>Matricule</th>
                        <th>Type</th>
                        <th>Projet</th>
                        <th>Statut</th>
                        <th>Type Panne</th>
                        <th>Date Arrêt</th>
                        <th>Durée (h)</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredArrets.length > 0 ? (
                        filteredArrets.map(arret => {
                          const voiture = state.voitures.find(v => v.id === arret.voiture);
                          const projet = state.projets.find(p => p.id === arret.projet);
                          
                          return (
                            <tr key={arret.id}>
                              <td className="fw-bold">{voiture?.matricule || `ID: ${arret.voiture}`}</td>
                              <td>{voiture?.type_voiture || '-'}</td>
                              <td>{projet?.name || 'Non affecté'}</td>
                              <td><StatusBadge status={arret.statut} /></td>
                              <td>{arret.type_panne || '-'}</td>
                              <td>{new Date(arret.date_arret).toLocaleString('fr-FR')}</td>
                              <td>{arret.duree_panne?.toFixed(1) || 'En cours'}</td>
                              <td>
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  onClick={() => {
                                    setState(prev => ({ ...prev, currentArret: arret }));
                                    setFormData({
                                      voiture: arret.voiture,
                                      projet: arret.projet,
                                      date_arret: arret.date_arret.slice(0, 16),
                                      type_panne: arret.type_panne || '',
                                      statut: arret.statut
                                    });
                                    setState(prev => ({ ...prev, showModal: true }));
                                  }}
                                  title="Modifier"
                                >
                                  <FaEdit />
                                </Button>
                                <Button 
                                  variant="outline-danger" 
                                  size="sm" 
                                  className="ms-2"
                                  onClick={() => handleDelete(arret.id)}
                                  title="Supprimer"
                                >
                                  <FaTrash />
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="8" className="text-center text-muted py-5">
                            Aucun arrêt trouvé pour les véhicules de roulage
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          )}
        </Tab>
        
        <Tab eventKey="stats" title={<><FaChartPie className="me-1" /> Statistiques</>}>
          <Card className="mt-3 shadow-sm">
            <Card.Body>
              <h4 className="mb-4">Statistiques des Arrêts - Véhicules Roulage</h4>
              <Row className="mb-4">
                <StatCard 
                  title="Véhicules Roulage" 
                  value={stats.totalVoitures} 
                  variant="primary" 
                  icon={<FaTools />}
                />
                <StatCard 
                  title="En Marche" 
                  value={stats.totalMarche} 
                  variant="success" 
                  icon={<FaCheckCircle />}
                  description={`${stats.tauxDisponibilite.toFixed(1)}% disponibilité`}
                />
                <StatCard 
                  title="En Panne" 
                  value={stats.totalPannes} 
                  variant="danger" 
                  icon={<FaTimesCircle />}
                  description={`${stats.pannePercentage}% en panne`}
                />
                <StatCard 
                  title="Non Utilisé" 
                  value={stats.totalNonUtilise} 
                  variant="secondary" 
                  icon={<FaTimes />}
                />
              </Row>
              
              <Row className="mt-4">
                <Col md={6}>
                  <Card className="h-100">
                    <Card.Body>
                      <Card.Title>Répartition par statut</Card.Title>
                      <div style={{ height: '300px' }}>
                        {/* Graphique à implémenter */}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="h-100">
                    <Card.Body>
                      <Card.Title>Durée des pannes</Card.Title>
                      <div style={{ height: '300px' }}>
                        {/* Graphique à implémenter */}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {renderModal()}
    </div>
  );
};

export default ArretPage;
 