import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Table, Button,
  Form, Modal, Badge, Alert, Spinner,
  InputGroup, Tabs, Tab
} from 'react-bootstrap';
import axios from 'axios';

const API_BASE_URL = 'https://intranet-attm.com/api';
const api = axios.create({ baseURL: API_BASE_URL });

const GestionEmployeursUsine = () => {
  const [state, setState] = useState({
    employeurs: [],
    projets: [],
    loading: true,
    error: null,
    showModal: false,
    editingEmployeur: null,
    filters: {
      statut: '',
      etat: '',
      action: '',
      projet: '',
      search: ''
    },
    activeTab: 'liste'
  });

  // Options pour les selects
  const statutChoices = [
    { id: 'contractuel', nom: 'Contractuel' },
    { id: 'moo', nom: 'MOO' }
  ];

  const etatChoices = [
    { id: 'actif', nom: 'Actif' },
    { id: 'conge', nom: 'Congé' },
    { id: 'permission', nom: 'Permission' },
    { id: 'malade', nom: 'Malade' },
    { id: 'mission', nom: 'Mission' },
    { id: 'autre', nom: 'Autre' }
  ];

  const actionChoices = [
    { id: 'administratif', nom: 'Administratif' },
    { id: 'mecanicien', nom: 'Mécanicien' },
    { id: 'chauffeur_pl', nom: 'Chauffeur PL' },
    { id: 'chauffeur_vl', nom: 'Chauffeur VL' },
    { id: 'electricien', nom: 'Électricien' },
    { id: 'operateur', nom: 'Opérateur' },
    { id: 'technicien', nom: 'Technicien' }
  ];

  // Charger les données initiales
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [employeursRes, projetsRes] = await Promise.all([
          api.get('/employeurs/'),
          api.get('/projets/').catch(err => {
            console.warn("Endpoint projets non disponible:", err);
            return { data: [] };
          })
        ]);

        // Filtrer uniquement les employés de la section Usine
        const tousEmployeurs = Array.isArray(employeursRes.data) ? 
          employeursRes.data : employeursRes.data.results || [];
        
        const employeursUsine = tousEmployeurs.filter(employeur => 
          employeur.section === 'usine'
        );

        console.log("Employés Usine chargés:", employeursUsine);

        setState(prev => ({
          ...prev,
          employeurs: employeursUsine,
          projets: projetsRes.data || [],
          loading: false
        }));
      } catch (err) {
        console.error("Erreur chargement données:", err);
        setState(prev => ({
          ...prev,
          loading: false,
          error: "Erreur lors du chargement des données: " + (err.message || 'Erreur inconnue')
        }));
      }
    };
    fetchData();
  }, []);

  // Filtrer les employeurs (uniquement Usine)
  const filteredEmployeurs = state.employeurs.filter(employeur => {
    const statutMatch = !state.filters.statut || employeur.statut === state.filters.statut;
    const etatMatch = !state.filters.etat || employeur.etat === state.filters.etat;
    const actionMatch = !state.filters.action || employeur.action === state.filters.action;
    const projetMatch = !state.filters.projet || employeur.projet == state.filters.projet;
    const searchMatch = !state.filters.search || 
      employeur.nom.toLowerCase().includes(state.filters.search.toLowerCase()) ||
      employeur.matricule.toLowerCase().includes(state.filters.search.toLowerCase()) ||
      (employeur.telephone && employeur.telephone.includes(state.filters.search));
    
    return statutMatch && etatMatch && actionMatch && projetMatch && searchMatch;
  });

  // Obtenir le nom du projet
  const getNomProjet = (projetId) => {
    if (!projetId) return 'Non assigné';
    const projet = state.projets.find(p => p.id === projetId);
    return projet ? projet.name : 'Projet inconnu';
  };

  // Obtenir les détails du statut
  const getStatutDetails = (statutId) => {
    const statut = statutChoices.find(s => s.id === statutId);
    return statut ? { nom: statut.nom, color: statutId === 'contractuel' ? 'primary' : 'info' } : 
                   { nom: 'Inconnu', color: 'secondary' };
  };

  // Obtenir les détails de l'état
  const getEtatDetails = (etatId) => {
    const etat = etatChoices.find(e => e.id === etatId);
    const colors = {
      actif: 'success',
      conge: 'warning',
      permission: 'info',
      malade: 'danger',
      mission: 'primary',
      autre: 'secondary'
    };
    return etat ? { nom: etat.nom, color: colors[etatId] || 'secondary' } : 
                  { nom: 'Inconnu', color: 'secondary' };
  };

  // Obtenir les détails de l'action
  const getActionDetails = (actionId) => {
    const action = actionChoices.find(a => a.id === actionId);
    const colors = {
      administratif: 'dark',
      mecanicien: 'warning',
      chauffeur_pl: 'info',
      chauffeur_vl: 'primary',
      electricien: 'success',
      operateur: 'info',
      technicien: 'secondary'
    };
    return action ? { nom: action.nom, color: colors[actionId] || 'secondary' } : 
                    { nom: 'Inconnu', color: 'secondary' };
  };

  // Gérer l'ouverture du modal
  const handleShowModal = (employeur = null) => {
    setState(prev => ({
      ...prev,
      showModal: true,
      editingEmployeur: employeur
    }));
  };

  // Gérer la fermeture du modal
  const handleCloseModal = () => {
    setState(prev => ({
      ...prev,
      showModal: false,
      editingEmployeur: null
    }));
  };

  // Gérer la sauvegarde
  const handleSave = async (formData) => {
    try {
      // Validation des champs obligatoires
      if (!formData.matricule || !formData.nom || !formData.action) {
        alert('Les champs Matricule, Nom et Fonction sont obligatoires');
        return;
      }

      // Préparer les données pour l'API
      const dataToSend = {
        matricule: formData.matricule,
        nom: formData.nom,
        telephone: formData.telephone || '',
        projet: formData.projet || null,
        date_debut: formData.date_debut,
        date_fin: formData.date_fin || null,
        statut: formData.statut || 'contractuel',
        etat: formData.etat || 'actif',
        action: formData.action,
        section: 'usine', // FORCER la section Usine
        observations: formData.observations || ''
      };

      console.log('Données envoyées à l\'API:', dataToSend);

      let response;
      if (formData.id) {
        // Modification
        response = await api.put(`/employeurs/${formData.id}/`, dataToSend);
      } else {
        // Création
        response = await api.post('/employeurs/', dataToSend);
      }

      console.log('Réponse de l\'API:', response.data);
      
      // Recharger les données
      const employeursRes = await api.get('/employeurs/');
      const tousEmployeurs = Array.isArray(employeursRes.data) ? 
        employeursRes.data : employeursRes.data.results || [];
      
      // Refiltrer uniquement Usine
      const employeursUsine = tousEmployeurs.filter(employeur => 
        employeur.section === 'usine'
      );

      setState(prev => ({
        ...prev,
        employeurs: employeursUsine
      }));
      
      handleCloseModal();
      alert('Données sauvegardées avec succès!');
    } catch (error) {
      console.error('Erreur détaillée sauvegarde:', error);
      
      if (error.response?.data) {
        // Afficher les erreurs de validation Django
        const errors = error.response.data;
        let errorMessage = "Erreurs de validation:\n";
        
        for (const [field, messages] of Object.entries(errors)) {
          errorMessage += `• ${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}\n`;
        }
        
        alert(errorMessage);
      } else if (error.request) {
        alert('Erreur de connexion: Impossible de contacter le serveur');
      } else {
        alert('Erreur lors de la sauvegarde: ' + (error.message || 'Erreur inconnue'));
      }
    }
  };

  // Gérer la suppression
  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
      try {
        await api.delete(`/employeurs/${id}/`);
        
        // Mettre à jour la liste
        setState(prev => ({
          ...prev,
          employeurs: prev.employeurs.filter(item => item.id !== id)
        }));
        
        alert('Employé supprimé avec succès!');
      } catch (error) {
        console.error('Erreur suppression:', error);
        alert('Erreur lors de la suppression: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setState(prev => ({
      ...prev,
      filters: {
        statut: '',
        etat: '',
        action: '',
        projet: '',
        search: ''
      }
    }));
  };

  // Statistiques
  const getStats = () => {
    const total = filteredEmployeurs.length;
    const parStatut = statutChoices.map(statut => ({
      ...statut,
      count: filteredEmployeurs.filter(e => e.statut === statut.id).length
    }));
    const parEtat = etatChoices.map(etat => ({
      ...etat,
      count: filteredEmployeurs.filter(e => e.etat === etat.id).length
    }));
    const parAction = actionChoices.map(action => ({
      ...action,
      count: filteredEmployeurs.filter(e => e.action === action.id).length
    }));

    return { total, parStatut, parEtat, parAction };
  };

  if (state.loading) {
    return (
      <Container fluid className="py-4">
        <div className="text-center">
          <Spinner animation="border" variant="info" />
          <p className="mt-2">Chargement des employés section Usine...</p>
        </div>
      </Container>
    );
  }

  if (state.error) {
    return (
      <Container fluid className="py-4">
        <Alert variant="danger">
          <h5>Erreur de chargement</h5>
          {state.error}
          <hr />
          <Button 
            variant="outline-danger" 
            size="sm" 
            onClick={() => window.location.reload()}
          >
            Réessayer
          </Button>
        </Alert>
      </Container>
    );
  }

  const stats = getStats();

  return (
    <Container fluid className="py-4">
      <Card className="shadow-lg">
        <Card.Header className="bg-info text-white">
          <h3 className="mb-0">🏭 Gestion des Employés - Section Usine</h3>
          <small className="opacity-75">Affichage exclusif de la section Usine</small>
        </Card.Header>
        
        <Card.Body>
          {/* Navigation par onglets */}
          <Tabs
            activeKey={state.activeTab}
            onSelect={(tab) => setState(prev => ({ ...prev, activeTab: tab }))}
            className="mb-4"
          >
            <Tab eventKey="liste" title="📋 Liste des Employés">
              {/* Filtres */}
              <Row className="mb-4 g-3">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Recherche</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        placeholder="Nom, matricule..."
                        value={state.filters.search}
                        onChange={e => setState(prev => ({
                          ...prev,
                          filters: { ...prev.filters, search: e.target.value }
                        }))}
                      />
                      {state.filters.search && (
                        <Button 
                          variant="outline-secondary" 
                          onClick={() => setState(prev => ({
                            ...prev,
                            filters: { ...prev.filters, search: '' }
                          }))}
                        >
                          ✕
                        </Button>
                      )}
                    </InputGroup>
                  </Form.Group>
                </Col>

                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Statut</Form.Label>
                    <Form.Select
                      value={state.filters.statut}
                      onChange={e => setState(prev => ({
                        ...prev,
                        filters: { ...prev.filters, statut: e.target.value }
                      }))}
                    >
                      <option value="">Tous les statuts</option>
                      {statutChoices.map(statut => (
                        <option key={statut.id} value={statut.id}>
                          {statut.nom}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={2}>
                  <Form.Group>
                    <Form.Label>État</Form.Label>
                    <Form.Select
                      value={state.filters.etat}
                      onChange={e => setState(prev => ({
                        ...prev,
                        filters: { ...prev.filters, etat: e.target.value }
                      }))}
                    >
                      <option value="">Tous les états</option>
                      {etatChoices.map(etat => (
                        <option key={etat.id} value={etat.id}>
                          {etat.nom}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Fonction</Form.Label>
                    <Form.Select
                      value={state.filters.action}
                      onChange={e => setState(prev => ({
                        ...prev,
                        filters: { ...prev.filters, action: e.target.value }
                      }))}
                    >
                      <option value="">Toutes les fonctions</option>
                      {actionChoices.map(action => (
                        <option key={action.id} value={action.id}>
                          {action.nom}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Projet</Form.Label>
                    <Form.Select
                      value={state.filters.projet}
                      onChange={e => setState(prev => ({
                        ...prev,
                        filters: { ...prev.filters, projet: e.target.value }
                      }))}
                    >
                      <option value="">Tous les projets</option>
                      {state.projets.map(projet => (
                        <option key={projet.id} value={projet.id}>
                          {projet.name || `Projet ${projet.id}`}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={1} className="d-flex align-items-end">
                  <Button 
                    variant="outline-secondary" 
                    onClick={resetFilters}
                    title="Réinitialiser les filtres"
                  >
                    🔄
                  </Button>
                </Col>
              </Row>

              {/* Indicateur de section */}
              <Row className="mb-3">
                <Col>
                  <Alert variant="info" className="py-2">
                    <strong>Section :</strong> Usine • 
                    <strong> Employés affichés :</strong> {filteredEmployeurs.length}
                    {state.projets.length === 0 && (
                      <span className="text-warning ms-2">
                        (Aucun projet disponible)
                      </span>
                    )}
                  </Alert>
                </Col>
              </Row>

              {/* Bouton d'ajout */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5>Liste des Employés - Section Usine ({filteredEmployeurs.length})</h5>
                <Button variant="success" onClick={() => handleShowModal()}>
                  ➕ Ajouter un Employé
                </Button>
              </div>

              {/* Tableau */}
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead className="table-dark">
                    <tr>
                      <th>Matricule</th>
                      <th>Nom</th>
                      <th>Téléphone</th>
                      <th>Site</th>
                      <th>Section</th>
                      <th>Fonction</th>
                      <th>Statut</th>
                      <th>État</th>
                      <th>date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployeurs.length > 0 ? (
                      filteredEmployeurs.map((employeur) => {
                        const statutDetails = getStatutDetails(employeur.statut);
                        const etatDetails = getEtatDetails(employeur.etat);
                        const actionDetails = getActionDetails(employeur.action);

                        return (
                          <tr key={employeur.id}>
                            <td className="fw-bold">{employeur.matricule}</td>
                            <td>{employeur.nom}</td>
                            <td>{employeur.telephone || '-'}</td>
                            <td>
                              {employeur.projet ? (
                                <Badge bg="secondary">
                                  {getNomProjet(employeur.projet)}
                                </Badge>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td>
                              <Badge bg="info">
                                Usine
                              </Badge>
                            </td>
                            <td>
                              <Badge bg={actionDetails.color}>
                                {actionDetails.nom}
                              </Badge>
                            </td>
                            <td>
                              <Badge bg={statutDetails.color}>
                                {statutDetails.nom}
                              </Badge>
                            </td>
                            <td>
                              <Badge bg={etatDetails.color}>
                                {etatDetails.nom}
                              </Badge>
                            </td>
                            <td>
                              {employeur.date_debut ? 
                                new Date(employeur.date_debut).toLocaleDateString('fr-FR') : '-'
                              }
                            </td>
                            
                            <td>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleShowModal(employeur)}
                                className="me-1"
                                title="Modifier"
                              >
                                ✏️
                              </Button>
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => handleDelete(employeur.id)}
                                title="Supprimer"
                              >
                                🗑️
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="11" className="text-center py-4">
                          <Alert variant="info">
                            {state.employeurs.length === 0 
                              ? "Aucun employé trouvé dans la section Usine. Cliquez sur 'Ajouter un Employé' pour commencer."
                              : "Aucun employé trouvé avec les critères de filtrage sélectionnés."
                            }
                          </Alert>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Tab>

            <Tab eventKey="statistiques" title="📊 Statistiques">
              <Row className="mb-4">
                <Col md={3}>
                  <Card className="bg-info text-white text-center">
                    <Card.Body>
                      <h4>{stats.total}</h4>
                      <div>Total Employés Usine</div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="bg-success text-white text-center">
                    <Card.Body>
                      <h4>
                        {stats.parEtat.find(e => e.id === 'actif')?.count || 0}
                      </h4>
                      <div>Employés Actifs</div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="bg-warning text-white text-center">
                    <Card.Body>
                      <h4>
                        {stats.parAction.find(a => a.id === 'operateur' || a.id === 'technicien')?.count || 0}
                      </h4>
                      <div>Opérateurs/Techniciens</div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="bg-secondary text-white text-center">
                    <Card.Body>
                      <h4>
                        {stats.parAction.find(a => a.id === 'mecanicien' || a.id === 'electricien')?.count || 0}
                      </h4>
                      <div>Maintenance</div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Row>
                {/* Répartition par statut */}
                <Col md={4}>
                  <Card>
                    <Card.Header>
                      <h5 className="mb-0">Répartition par Statut</h5>
                    </Card.Header>
                    <Card.Body>
                      {stats.parStatut.map(statut => (
                        <div key={statut.id} className="d-flex justify-content-between align-items-center mb-2">
                          <span>{statut.nom}</span>
                          <Badge bg={getStatutDetails(statut.id).color}>
                            {statut.count} ({stats.total > 0 ? ((statut.count / stats.total) * 100).toFixed(1) : 0}%)
                          </Badge>
                        </div>
                      ))}
                    </Card.Body>
                  </Card>
                </Col>

                {/* Répartition par état */}
                <Col md={4}>
                  <Card>
                    <Card.Header>
                      <h5 className="mb-0">Répartition par État</h5>
                    </Card.Header>
                    <Card.Body>
                      {stats.parEtat.map(etat => (
                        <div key={etat.id} className="d-flex justify-content-between align-items-center mb-2">
                          <span>{etat.nom}</span>
                          <Badge bg={getEtatDetails(etat.id).color}>
                            {etat.count} ({stats.total > 0 ? ((etat.count / stats.total) * 100).toFixed(1) : 0}%)
                          </Badge>
                        </div>
                      ))}
                    </Card.Body>
                  </Card>
                </Col>

                {/* Répartition par fonction */}
                <Col md={4}>
                  <Card>
                    <Card.Header>
                      <h5 className="mb-0">Répartition par Fonction</h5>
                    </Card.Header>
                    <Card.Body>
                      {stats.parAction.map(action => (
                        <div key={action.id} className="d-flex justify-content-between align-items-center mb-2">
                          <span>{action.nom}</span>
                          <Badge bg={getActionDetails(action.id).color}>
                            {action.count} ({stats.total > 0 ? ((action.count / stats.total) * 100).toFixed(1) : 0}%)
                          </Badge>
                        </div>
                      ))}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      {/* Modal d'édition/ajout */}
      <EmployeurModal
        show={state.showModal}
        onHide={handleCloseModal}
        onSave={handleSave}
        employeur={state.editingEmployeur}
        projets={state.projets}
        statutChoices={statutChoices}
        etatChoices={etatChoices}
        actionChoices={actionChoices}
      />
    </Container>
  );
};

// Composant Modal pour l'édition/ajout
const EmployeurModal = ({ 
  show, 
  onHide, 
  onSave, 
  employeur, 
  projets,
  statutChoices,
  etatChoices,
  actionChoices
}) => {
  const [formData, setFormData] = useState({
    matricule: '',
    nom: '',
    telephone: '',
    projet: '',
    date_debut: '',
    date_fin: '',
    statut: 'contractuel',
    etat: 'actif',
    action: '',
    observations: ''
  });

  const [errors, setErrors] = useState({});

  // Initialiser le formulaire
  useEffect(() => {
    if (employeur) {
      setFormData({
        id: employeur.id,
        matricule: employeur.matricule || '',
        nom: employeur.nom || '',
        telephone: employeur.telephone || '',
        projet: employeur.projet || '',
        date_debut: employeur.date_debut || '',
        date_fin: employeur.date_fin || '',
        statut: employeur.statut || 'contractuel',
        etat: employeur.etat || 'actif',
        action: employeur.action || '',
        observations: employeur.observations || ''
      });
    } else {
      // Valeurs par défaut pour un nouvel employé
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        matricule: '',
        nom: '',
        telephone: '',
        projet: '',
        date_debut: today,
        date_fin: '',
        statut: 'contractuel',
        etat: 'actif',
        action: '',
        observations: ''
      });
    }
    setErrors({});
  }, [employeur, show]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.matricule) newErrors.matricule = 'Le matricule est obligatoire';
    if (!formData.nom) newErrors.nom = 'Le nom est obligatoire';
    if (!formData.action) newErrors.action = 'La fonction est obligatoire';
    if (!formData.date_debut) newErrors.date_debut = 'La date de début est obligatoire';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Préparer les données pour l'envoi
    const dataToSend = {
      ...formData,
      projet: formData.projet || null,
      telephone: formData.telephone || '',
      date_fin: formData.date_fin || null,
      observations: formData.observations || '',
      statut: formData.statut || 'contractuel',
      etat: formData.etat || 'actif'
    };

    onSave(dataToSend);
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Effacer l'erreur du champ quand l'utilisateur commence à taper
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton className="bg-info text-white">
        <Modal.Title>
          {employeur ? '✏️ Modifier l\'Employé Usine' : '➕ Ajouter un Employé Usine'}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row className="g-3">
            {/* Matricule - OBLIGATOIRE */}
            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  Matricule <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  value={formData.matricule}
                  onChange={e => handleFieldChange('matricule', e.target.value)}
                  isInvalid={!!errors.matricule}
                  placeholder="Ex: USI001"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.matricule}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Nom - OBLIGATOIRE */}
            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  Nom <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  value={formData.nom}
                  onChange={e => handleFieldChange('nom', e.target.value)}
                  isInvalid={!!errors.nom}
                  placeholder="Nom complet"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.nom}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Téléphone */}
            <Col md={6}>
              <Form.Group>
                <Form.Label>Téléphone</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.telephone}
                  onChange={e => handleFieldChange('telephone', e.target.value)}
                  placeholder="Ex: +212 6XX-XXXXXX"
                />
              </Form.Group>
            </Col>

            {/* Section (affichage seulement) */}
            <Col md={6}>
              <Form.Group>
                <Form.Label>Section</Form.Label>
                <Form.Control
                  type="text"
                  value="Usine (automatique)"
                  readOnly
                  className="bg-light"
                />
                <Form.Text className="text-muted">
                  La section sera déterminée automatiquement
                </Form.Text>
              </Form.Group>
            </Col>

            {/* Fonction - OBLIGATOIRE */}
            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  Fonction <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  value={formData.action}
                  onChange={e => handleFieldChange('action', e.target.value)}
                  isInvalid={!!errors.action}
                >
                  <option value="">Sélectionner une fonction</option>
                  {actionChoices.map(action => (
                    <option key={action.id} value={action.id}>
                      {action.nom}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.action}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Projet */}
            <Col md={6}>
              <Form.Group>
                <Form.Label>Projet</Form.Label>
                <Form.Select
                  value={formData.projet}
                  onChange={e => handleFieldChange('projet', e.target.value)}
                >
                  <option value="">Non assigné</option>
                  {projets.map(projet => (
                    <option key={projet.id} value={projet.id}>
                      {projet.name || `Projet ${projet.id}`}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            {/* Statut */}
            <Col md={6}>
              <Form.Group>
                <Form.Label>Statut</Form.Label>
                <Form.Select
                  value={formData.statut}
                  onChange={e => handleFieldChange('statut', e.target.value)}
                >
                  {statutChoices.map(statut => (
                    <option key={statut.id} value={statut.id}>
                      {statut.nom}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            {/* État */}
            <Col md={6}>
              <Form.Group>
                <Form.Label>État</Form.Label>
                <Form.Select
                  value={formData.etat}
                  onChange={e => handleFieldChange('etat', e.target.value)}
                >
                  {etatChoices.map(etat => (
                    <option key={etat.id} value={etat.id}>
                      {etat.nom}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            {/* Date Début - OBLIGATOIRE */}
            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  Date Début <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="date"
                  value={formData.date_debut}
                  onChange={e => handleFieldChange('date_debut', e.target.value)}
                  isInvalid={!!errors.date_debut}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.date_debut}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Date Fin */}
            <Col md={6}>
              <Form.Group>
                <Form.Label>Date Fin</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.date_fin}
                  onChange={e => handleFieldChange('date_fin', e.target.value)}
                />
                <Form.Text className="text-muted">
                  Optionnel - Date de fin de contrat ou d'absence
                </Form.Text>
              </Form.Group>
            </Col>

            {/* Observations */}
            <Col md={12}>
              <Form.Group>
                <Form.Label>Observations</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.observations}
                  onChange={e => handleFieldChange('observations', e.target.value)}
                  placeholder="Notes supplémentaires..."
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            ❌ Annuler
          </Button>
          <Button variant="info" type="submit">
            {employeur ? '💾 Modifier' : '➕ Ajouter'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default GestionEmployeursUsine;