import React, { useState, useEffect, useMemo } from 'react';
import { 
  Table, Button, Form, Modal, Badge, Spinner, 
  Alert, Toast, ToastContainer, Row, Col, Card,
  ProgressBar 
} from 'react-bootstrap';
import { 
  FaPlus, FaEdit, FaTrash, FaExclamationTriangle, 
  FaCalendarAlt, FaSearch, FaTimes, 
  FaCheckCircle, FaTimesCircle, FaClock, 
  FaChartLine, FaTools, FaCogs
} from 'react-icons/fa';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: { 'Content-Type': 'application/json' }
});

// API Service Functions
const ArretService = {
  getAll: async () => {
    const response = await api.get('/arrets/');
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/arrets/', data, {
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      transformRequest: [(data) => JSON.stringify(data)],
    });
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/arrets/${id}/`, data);
    return response.data;
  },
  delete: async (id) => {
    await api.delete(`/arrets/${id}/`);
  },
  getEquipements: async () => {
    const response = await api.get('/equipements/');
    return response.data;
  },
  getProjets: async () => {
    const response = await api.get('/projets/');
    return response.data;
  }
};

// Statistic Card Component
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

const ArretPage = () => {
  // State Management
  const [state, setState] = useState({
    arrets: [],
    equipements: [],
    projets: [],
    loading: true,
    error: null,
    showModal: false,
    currentArret: null,
    isSubmitting: false,
    toast: { show: false, message: '', variant: 'success' }
  });

  const [formData, setFormData] = useState({
    equipement: '',
    projet: null,
    date_arret: new Date().toISOString().slice(0, 16),
    type_panne: '',
    statut: 'declare'
  });

  const [dateFilter, setDateFilter] = useState({
    startDate: null,
    endDate: null
  });

  useEffect(() => {
  const loadData = async () => {
    try {
      const [arretsData, equipementsData, projetsData] = await Promise.all([
        ArretService.getAll(),
        ArretService.getEquipements(),
        ArretService.getProjets()
      ]);

      // Debug: Vérifiez la structure des données
      console.log("Équipements reçus:", equipementsData);
      console.log("Projets reçus:", projetsData);

      // Normalisation des données
      const equipementsNormalises = equipementsData.map(equip => ({
        ...equip,
        // Assure que projet est soit un objet complet, soit null
        projet: equip.projet || projetsData.find(p => p.id === equip.projet_id) || null
      }));

      setState(prev => ({
        ...prev,
        arrets: arretsData,
        equipements: equipementsNormalises,
        projets: projetsData,
        loading: false
      }));

    } catch (err) {
      console.error("Erreur détaillée:", err.response?.data || err.message);
      setState(prev => ({
        ...prev,
        error: "Erreur lors du chargement des données",
        loading: false
      }));
    }
  };
  loadData();
}, []);


const debugEquipementProjet = (equipementId) => {
  const equip = state.equipements.find(e => e.id === equipementId);
  if (!equip) return "Équipement non trouvé";
  
  console.log("Debug Equipement:", {
    id: equip.id,
    matricule: equip.matricule,
    projet: equip.projet,
    projet_id: equip.projet_id
  });
  
  return equip.projet 
    ? `Projet trouvé: ${equip.projet.name} (ID: ${equip.projet.id})`
    : "Aucun projet associé";
};
  // Filter arrets by date range
  const filteredArrets = useMemo(() => {
    return state.arrets.filter(arret => {
      if (!dateFilter.startDate && !dateFilter.endDate) return true;
      
      const arretDate = new Date(arret.date_arret);
      const startDate = dateFilter.startDate ? new Date(dateFilter.startDate) : null;
      const endDate = dateFilter.endDate ? new Date(dateFilter.endDate) : null;
      
      startDate?.setHours(0, 0, 0, 0);
      endDate?.setHours(23, 59, 59, 999);
      
      if (startDate && endDate) {
        return arretDate >= startDate && arretDate <= endDate;
      }
      
      if (startDate) return arretDate >= startDate;
      if (endDate) return arretDate <= endDate;
      
      return true;
    });
  }, [state.arrets, dateFilter.startDate, dateFilter.endDate]);

  // Get equipment info with fallback
  const getEquipementInfo = (equipementData) => {
    // Si l'équipement est un objet complet
    if (typeof equipementData === 'object' && equipementData !== null) {
      // Gestion spéciale pour les matricules objets
      const matriculeValue = typeof equipementData.matricule === 'object' 
        ? equipementData.matricule.numero || equipementData.matricule.id || JSON.stringify(equipementData.matricule)
        : equipementData.matricule;
      
      return {
        matricule: matriculeValue || `ID: ${equipementData.id}`,
        type: equipementData.type_equipement || 'Type inconnu'
      };
    }
    
    // Si c'est juste un ID, chercher dans la liste des équipements
    const equipementId = parseInt(equipementData);
    const equipement = state.equipements.find(e => e.id === equipementId);
    
    if (equipement) {
      // Gestion spéciale pour les matricules objets
      const matriculeValue = typeof equipement.matricule === 'object' 
        ? equipement.matricule.numero || equipement.matricule.id || JSON.stringify(equipement.matricule)
        : equipement.matricule;
      
      return {
        matricule: matriculeValue || `ID: ${equipement.id}`,
        type: equipement.type_equipement || 'Type inconnu'
      };
    }
    
    // Fallback si aucun équipement n'est trouvé
    return {
      matricule: `ID: ${equipementId}`,
      type: 'Type inconnu'
    };
  };

  // Get project name with fallback
  const getProjetName = (projetId) => {
    if (!projetId) return "Non affecté";
    const projet = state.projets.find(p => p.id === projetId);
    return projet ? projet.name : `Projet (ID: ${projetId})`;
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const totalEquipements = state.equipements.length;
    const totalPannes = filteredArrets.filter(a => a.statut === 'panne').length;
    const totalAttente = filteredArrets.filter(a => a.statut === 'attente travaux').length;
    const totalNonUtilise = filteredArrets.filter(a => a.statut === 'non utilise').length;
    const totalDeclare = filteredArrets.filter(a => a.statut === 'declare').length;
    
    const totalMarche = Math.max(0, totalEquipements - (totalPannes + totalAttente + totalNonUtilise + totalDeclare));
    const tauxDisponibilite = totalEquipements > 0 
      ? ((totalMarche / totalEquipements) * 100) 
      : 0;

    return {
      totalEquipements,
      totalPannes,
      totalAttente,
      totalNonUtilise,
      totalDeclare,
      totalMarche,
      tauxDisponibilite,
      pannePercentage: totalEquipements > 0 
        ? ((totalPannes / totalEquipements) * 100).toFixed(1)
        : '0'
    };
  }, [filteredArrets, state.equipements]);

  // Form handlers
const handleFormChange = (e) => {
  const { name, value } = e.target;
  
  setFormData(prev => {
    const newState = { ...prev, [name]: value };

    // Gestion automatique du projet
    if (name === "equipement" && value) {
      const selectedEquipement = state.equipements.find(e => e.id === parseInt(value));
      newState.projet = selectedEquipement?.projet?.id || null;
    }

    return newState;
  });
};
  
 

  const validateFormData = (data) => {
  const errors = [];
  if (!data.equipement) errors.push("L'équipement est requis");
  if (!data.date_arret) errors.push("La date d'arrêt est requise");
  if (!data.statut) errors.push("Le statut est requis");

  // Seulement valider le type de panne pour les statuts spécifiques
  if (['panne', 'declare'].includes(data.statut) && !data.type_panne) {
    errors.push("Le type de panne est requis pour ce statut");
  }

  return errors;
};
const handleSubmit = async (e) => {
  e.preventDefault();

  const payload = {
    equipement_id: parseInt(formData.equipement), // Correspond au write_only
    projet: formData.projet ? parseInt(formData.projet) : null,
    date_arret: new Date(formData.date_arret).toISOString(),
    statut: formData.statut,
    // Envoi conditionnel du type_panne
    ...(formData.type_panne && { type_panne: formData.type_panne })
  };

  try {
    const response = state.currentArret
      ? await ArretService.update(state.currentArret.id, payload)
      : await ArretService.create(payload);
    // ... gestion de la réponse
  } catch (err) {
    console.error("Erreur détaillée:", {
      status: err.response?.status,
      data: err.response?.data,
      config: err.config?.data
    });
    // ... affichage erreur
  }
};

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet arrêt ?")) {
      try {
        await ArretService.delete(id);
        setState(prev => ({
          ...prev,
          arrets: prev.arrets.filter(a => a.id !== id),
          toast: { show: true, message: "Arrêt supprimé avec succès", variant: 'success' }
        }));
      } catch (err) {
        setState(prev => ({
          ...prev,
          toast: { show: true, message: "Échec de la suppression", variant: 'danger' }
        }));
      }
    }
  };

  const resetForm = () => {

    const [formData, setFormData] = useState({
  equipement: '',
  projet: null,
  date_arret: new Date().toISOString().slice(0, 16),
  type_panne: '',
  statut: 'declare',
  showTypePanne: true // Nouveau champ
});
    setState(prev => ({ ...prev, currentArret: null }));
  };

  const resetDateFilter = () => {
    setDateFilter({ startDate: null, endDate: null });
  };

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
          <Toast.Body className="text-white">{state.toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>

      <h2 className="mb-4">Gestion des Arrêts d'Équipements</h2>

      {/* Date Filter Section */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row className="align-items-end">
            <Col md={3}>
              <Form.Group>
                <Form.Label>chercher par Date </Form.Label>
                <DatePicker
                  selected={dateFilter.startDate}
                  onChange={date => setDateFilter(prev => ({ ...prev, startDate: date }))}
                  selectsStart
                  startDate={dateFilter.startDate}
                  endDate={dateFilter.endDate}
                  className="form-control"
                  dateFormat="dd/MM/yyyy"
                  isClearable
                  placeholderText="JJ/MM/AAAA"
                />
              </Form.Group>
            </Col>
            
            <Col md={6} className="d-flex align-items-end">
              
              <Button variant="primary">
                <FaSearch className="me-1" />
              recherche
              </Button>
            </Col>
          </Row>
          {(dateFilter.startDate || dateFilter.endDate) && (
            <div className="mt-2 text-muted small">
              Affichage des arrêts du {dateFilter.startDate?.toLocaleDateString('fr-FR') || '...'} 
              au {dateFilter.endDate?.toLocaleDateString('fr-FR') || '...'}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Statistics Section */}
      <Row className="mb-4">
        <StatCard 
          title="Équipements Totaux" 
          value={stats.totalEquipements} 
          variant="primary" 
          icon={<FaCogs />}
          description="Nombre total d'équipements" 
        />
        <StatCard 
          title="En Marche" 
          value={stats.totalMarche} 
          variant="success" 
          icon={<FaCheckCircle />}
          description={`${stats.tauxDisponibilite.toFixed(1)}% de disponibilité`}
        />
        <StatCard 
          title="En Panne" 
          value={stats.totalPannes} 
          variant="danger" 
          icon={<FaTimesCircle />}
          description={`${stats.pannePercentage}% du parc`}
        />
        <StatCard 
          title="Non utilisés" 
          value={stats.totalAttente + stats.totalDeclare} 
          variant="warning" 
          icon={<FaTools />}
          description={`${stats.totalAttente} en attente`}
        />
      </Row>

      {/* Action Buttons */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <small className="text-muted">
            {filteredArrets.length} arrêt(s) trouvé(s)
            {dateFilter.startDate || dateFilter.endDate ? ' pour la période sélectionnée' : ''}
          </small>
        </div>
        <Button 
          variant="primary" 
          onClick={() => setState(prev => ({ ...prev, showModal: true }))} 
          disabled={state.isSubmitting}
        >
          <FaPlus className="me-2" />Nouvel Arrêt
        </Button>
      </div>

      {/* Main Table */}
      {state.loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Chargement des données en cours...</p>
        </div>
      ) : state.error ? (
        <Alert variant="danger">
          <FaExclamationTriangle className="me-2" />
          {state.error}
        </Alert>
      ) : (
        <Card className="shadow-sm">
          <Card.Body className="p-0">
            <Table striped bordered hover responsive className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Matricule</th>
                  <th>Type</th>
                  <th>Projet</th>
                  <th>Statut</th>
                  <th>Type Panne</th>
                  <th>Date Arrêt</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredArrets.length > 0 ? (
                  filteredArrets.map(arret => {
                    const equipement = getEquipementInfo(arret.equipement);
                    return (
                      <tr key={arret.id}>
                        <td className="fw-bold">{equipement.matricule}</td>
                        <td>{equipement.type}</td>
                        <td>{getProjetName(arret.projet)}</td>
                        <td>
                          <Badge bg={
                            arret.statut === 'marche' ? 'success' :
                            arret.statut === 'panne' ? 'danger' :
                            arret.statut === 'attente travaux' ? 'warning' : 'primary'
                          }>
                            {arret.statut}
                          </Badge>
                        </td>
                        <td>{arret.type_panne || '-'}</td>
                        <td>{new Date(arret.date_arret).toLocaleString('fr-FR')}</td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            onClick={() => {
                              setState(prev => ({ ...prev, currentArret: arret }));
                              setFormData({
                                equipement: arret.equipement,
                                projet: arret.projet,
                                statut: arret.statut,
                                type_panne: arret.type_panne,
                                date_arret: arret.date_arret.slice(0, 16),
                              });
                              setState(prev => ({ ...prev, showModal: true }));
                            }}
                          >
                            <FaEdit />
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm" 
                            className="ms-2" 
                            onClick={() => handleDelete(arret.id)}
                          >
                            <FaTrash />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-5">
                      {dateFilter.startDate || dateFilter.endDate 
                        ? "Aucun arrêt trouvé pour la période sélectionnée" 
                        : "Aucun arrêt enregistré"}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Add/Edit Modal */}
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
            {state.currentArret ? "Modifier l'arrêt" : "Nouvel arrêt d'équipement"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Équipement <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="equipement"
                    value={formData.equipement}
                    onChange={handleFormChange}
                    required
                    disabled={state.isSubmitting}
                  >
                    <option value="">Sélectionnez un équipement</option>
                    {state.equipements.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.matricule} ({e.type_equipement})({e.projet})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
                   <Col md={6}>
  <Form.Group controlId="formProjet">
    <Form.Label>Projet</Form.Label>
    <Form.Select
      name="projet"
      value={formData.projet ?? ''}
      onChange={handleFormChange}
      disabled={state.isSubmitting || !formData.equipement}
      className={!formData.projet ? 'text-muted fst-italic' : ''}
    >
      {!formData.equipement ? (
        <option value="">Sélectionnez d'abord un équipement</option>
      ) : (
        <>
          <option value="">Non affecté</option>
          {state.projets.map(p => (
            <option 
              key={p.id} 
              value={p.id}
              selected={p.id === formData.projet}
            >
              {p.name}
            </option>
          ))}
        </>
      )}
    </Form.Select>
    {formData.equipement && !formData.projet && (
      <Form.Text className="text-warning">
        Aucun projet associé à cet équipement
      </Form.Text>
    )}
  </Form.Group>
</Col>
<Col md={6}>
  {['panne', 'declare'].includes(formData.statut) && (
    <Form.Group>
      <Form.Label>Type de panne <span className="text-danger"></span></Form.Label>
      <Form.Select
        name="type_panne"
        value={formData.type_panne}
        onChange={handleFormChange}
        required
      >
        <option value="">Sélectionnez le type de panne</option>
        <option value="mecanique">Mécanique</option>
        <option value="electrique">Électrique</option>
        <option value="hydraulique">Hydraulique</option>
        <option value="pneumatique">Pneumatique</option>
        <option value="electronique">Électronique</option>
        <option value="autre">Autre</option>
      </Form.Select>
    </Form.Group>
  )}
</Col>

              <Col md={6}>
  {formData.showTypePanne && (
    <Form.Group>
      <Form.Label>Type de panne <span className="text-danger">*</span></Form.Label>
      <Form.Select
        name="type_panne"
        value={formData.type_panne}
        onChange={handleFormChange}
        required={formData.showTypePanne}
        disabled={state.isSubmitting}
      >
        <option value="">Sélectionnez le type de panne</option>
        <option value="mecanique">Mécanique</option>
        <option value="electrique">Électrique</option>
        <option value="hydraulique">Hydraulique</option>
        <option value="pneumatique">Pneumatique</option>
        <option value="electronique">Électronique</option>
        <option value="autre">Autre</option>
      </Form.Select>
    </Form.Group>
  )}
</Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Statut <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="statut"
                    value={formData.statut}
                    onChange={handleFormChange}
                    required
                    disabled={state.isSubmitting}
                  >
                    <option value="">Sélectionnez un statut</option>
  
                    <option value="panne">En Panne</option>
                    <option value="attente travaux">En attente travaux</option>
                  
        
                  </Form.Select>
                </Form.Group>
              </Col>
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
                ) : state.currentArret ? "Modifier" : "Enregistrer"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>

    
  );
};

export default ArretPage;