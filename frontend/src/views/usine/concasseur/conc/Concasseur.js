import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Card, Table, Form, InputGroup, Button, 
  Badge, Row, Col, Spinner, Alert,
  Modal, Tabs, Tab
} from 'react-bootstrap';
import { 
  FaSearch, FaFilter, FaTimes, FaEye,
  FaIndustry, FaCalendar, FaClock,
  FaChartBar, FaTruck, FaExclamationTriangle,
  FaPlus, FaSave, FaEdit, FaTrash,
  FaCalendarWeek, FaCalendarAlt, FaChartLine,
  FaHardHat, FaCog
} from 'react-icons/fa';

const AffichageProductionUsine = () => {
  // États principaux
  const [productions, setProductions] = useState([]);
  const [usines, setUsines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // États pour les filtres
  const [filters, setFilters] = useState({
    searchTerm: '',
    usine: '',
    dateDebut: '',
    dateFin: '',
    classProduction: '',
    categorie: '' // Nouveau filtre par catégorie
  });

  // États pour les modals
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduction, setSelectedProduction] = useState(null);

  // État pour le formulaire d'ajout/modification
  const [formData, setFormData] = useState({
    usine: '',
    date: new Date().toISOString().split('T')[0],
    hm: '',
    nombre_voyage: '',
    production_jour: '',
    objectif_mensuel: '',
    objectif_annuel: '',
    cause_arret: '',
    class_production: ''
  });

  // Définition des catégories d'usines
  const categoriesUsines = {
    'Centre Enrobé': [
      'Emont1', 'Ermont2', 'Ciber Inova', 'Usine Beton', 'APT1', 'APT2'
    ],
    'Concasseur': [
      'Primaire Roc', 'Secondaire Roc', 'Primaire CFBK', 'Secondaire CFBK',
      'Primaire Nord Berg', 'Primaire SANDIK', 'Secondaire SANDVIK', 'Unite decriblage'
    ]
  };

  // Charger les données
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usinesRes, productionsRes] = await Promise.all([
        axios.get('http://localhost:8000/api/usines/'),
        axios.get('http://localhost:8000/api/production-usine/')
      ]);

      const usinesMap = new Map(usinesRes.data.map(u => [u.id, u]));

      const enhancedProductions = productionsRes.data.map(production => {
        const usineData = usinesMap.get(production.usine);
        const nomUsine = usineData?.nom || 'Inconnu';
        const matriculeUsine = usineData?.matricule || 'Inconnu';
        
        // Déterminer la catégorie de l'usine
        let categorie = 'Non classé';
        if (categoriesUsines['Centre Enrobé'].includes(nomUsine) || 
            categoriesUsines['Centre Enrobé'].includes(matriculeUsine)) {
          categorie = 'Centre Enrobé';
        } else if (categoriesUsines['Concasseur'].includes(nomUsine) || 
                  categoriesUsines['Concasseur'].includes(matriculeUsine)) {
          categorie = 'Concasseur';
        }

        return {
          ...production,
          usine_info: usineData || { matricule: 'Inconnu', nom: 'Usine inconnue' },
          date_formatted: new Date(production.date).toLocaleDateString('fr-FR'),
          statut_taux: production.taux_mois >= 100 ? "success" : 
                      production.taux_mois >= 80 ? "warning" : "danger",
          categorie: categorie
        };
      });

      setUsines(usinesRes.data);
      setProductions(enhancedProductions);
      
    } catch (err) {
      handleApiError(err, 'Erreur de chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Gestion des erreurs
  const handleApiError = (err, defaultMessage) => {
    console.error('API Error:', err);
    const errorMessage = err.response?.data ? 
      (typeof err.response.data === 'object' ? JSON.stringify(err.response.data) : err.response.data) 
      : defaultMessage;
    setError(errorMessage);
  };

  // Filtrer les productions
  const filteredProductions = productions.filter(production => {
    const matchesSearch = filters.searchTerm === '' || 
      production.usine_info?.matricule?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      production.usine_info?.nom?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      production.cause_arret?.toLowerCase().includes(filters.searchTerm.toLowerCase());

    const matchesUsine = !filters.usine || production.usine == filters.usine;
    const matchesClass = !filters.classProduction || production.class_production === filters.classProduction;
    const matchesCategorie = !filters.categorie || production.categorie === filters.categorie;
    
    const productionDate = new Date(production.date);
    const matchesDateDebut = !filters.dateDebut || productionDate >= new Date(filters.dateDebut);
    const matchesDateFin = !filters.dateFin || productionDate <= new Date(filters.dateFin + 'T23:59:59');

    return matchesSearch && matchesUsine && matchesClass && matchesCategorie && matchesDateDebut && matchesDateFin;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  // Calcul des cumuls par usine et par catégorie
  const calculateCumulsParUsine = () => {
    const cumuls = {};
    const aujourdHui = new Date();
    const debutSemaine = new Date(aujourdHui);
    debutSemaine.setDate(aujourdHui.getDate() - aujourdHui.getDay() + 1); // Lundi de cette semaine
    const debutMois = new Date(aujourdHui.getFullYear(), aujourdHui.getMonth(), 1);
    const debutAnnee = new Date(aujourdHui.getFullYear(), 0, 1);

    productions.forEach(production => {
      const usineId = production.usine;
      const usineInfo = production.usine_info;
      const categorie = production.categorie;
      const dateProduction = new Date(production.date);

      if (!cumuls[usineId]) {
        cumuls[usineId] = {
          usine_info: usineInfo,
          categorie: categorie,
          production_jour: 0,
          cumul_semaine: 0,
          cumul_mois: 0,
          cumul_annee: 0,
          dernier_jour: null
        };
      }

      // Production du jour (aujourd'hui)
      if (dateProduction.toDateString() === aujourdHui.toDateString()) {
        cumuls[usineId].production_jour += production.production_jour;
        cumuls[usineId].dernier_jour = production.date_formatted;
      }

      // Cumul de la semaine
      if (dateProduction >= debutSemaine) {
        cumuls[usineId].cumul_semaine += production.production_jour;
      }

      // Cumul du mois
      if (dateProduction >= debutMois) {
        cumuls[usineId].cumul_mois += production.production_jour;
      }

      // Cumul de l'année
      if (dateProduction >= debutAnnee) {
        cumuls[usineId].cumul_annee += production.production_jour;
      }
    });

    return Object.values(cumuls);
  };

  const cumulsParUsine = calculateCumulsParUsine();

  // Calcul des statistiques par catégorie
  const calculateStatsParCategorie = () => {
    const stats = {
      'Centre Enrobé': {
        production_jour: 0,
        cumul_semaine: 0,
        cumul_mois: 0,
        cumul_annee: 0,
        nombre_usines: 0
      },
      'Concasseur': {
        production_jour: 0,
        cumul_semaine: 0,
        cumul_mois: 0,
        cumul_annee: 0,
        nombre_usines: 0
      }
    };

    cumulsParUsine.forEach(usine => {
      if (stats[usine.categorie]) {
        stats[usine.categorie].production_jour += usine.production_jour;
        stats[usine.categorie].cumul_semaine += usine.cumul_semaine;
        stats[usine.categorie].cumul_mois += usine.cumul_mois;
        stats[usine.categorie].cumul_annee += usine.cumul_annee;
        stats[usine.categorie].nombre_usines += 1;
      }
    });

    return stats;
  };

  const statsParCategorie = calculateStatsParCategorie();

  // Calcul des statistiques récapitulatives
  const stats = {
    totalProductions: filteredProductions.length,
    productionTotale: filteredProductions.reduce((sum, p) => sum + p.production_jour, 0),
    moyenneProduction: filteredProductions.length > 0 ? 
      filteredProductions.reduce((sum, p) => sum + p.production_jour, 0) / filteredProductions.length : 0,
    totalVoyages: filteredProductions.reduce((sum, p) => sum + (p.nombre_voyage || 0), 0),
    totalCumulSemaine: cumulsParUsine.reduce((sum, u) => sum + u.cumul_semaine, 0),
    totalCumulMois: cumulsParUsine.reduce((sum, u) => sum + u.cumul_mois, 0),
    totalCumulAnnee: cumulsParUsine.reduce((sum, u) => sum + u.cumul_annee, 0)
  };

  // Gestion des changements de filtre
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Gestion des changements du formulaire
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      usine: '',
      dateDebut: '',
      dateFin: '',
      classProduction: '',
      categorie: ''
    });
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      usine: '',
      date: new Date().toISOString().split('T')[0],
      hm: '',
      nombre_voyage: '',
      production_jour: '',
      objectif_mensuel: '',
      objectif_annuel: '',
      cause_arret: '',
      class_production: ''
    });
    setError(null);
    setSuccess(null);
  };

  // Ouvrir le modal d'ajout
  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  // Ouvrir le modal de modification
  const openEditModal = (production) => {
    setSelectedProduction(production);
    setFormData({
      usine: production.usine,
      date: production.date.split('T')[0],
      hm: production.hm || '',
      nombre_voyage: production.nombre_voyage || '',
      production_jour: production.production_jour,
      objectif_mensuel: production.objectif_mensuel || '',
      objectif_annuel: production.objectif_annuel || '',
      cause_arret: production.cause_arret || '',
      class_production: production.class_production || ''
    });
    setShowEditModal(true);
  };

  // Ouvrir le modal de suppression
  const openDeleteModal = (production) => {
    setSelectedProduction(production);
    setShowDeleteModal(true);
  };

  // Afficher les détails d'une production
  const showDetails = (production) => {
    setSelectedProduction(production);
    setShowDetailModal(true);
  };

  // Soumettre le formulaire d'ajout
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validation basique
      if (!formData.usine) {
        throw new Error('Veuillez sélectionner une usine');
      }
      if (!formData.date) {
        throw new Error('La date est requise');
      }
      if (!formData.production_jour || parseFloat(formData.production_jour) < 0) {
        throw new Error('Veuillez entrer une production journalière valide');
      }

      const payload = {
        ...formData,
        hm: formData.hm ? parseFloat(formData.hm) : null,
        nombre_voyage: formData.nombre_voyage ? parseInt(formData.nombre_voyage) : 0,
        production_jour: parseFloat(formData.production_jour),
        objectif_mensuel: formData.objectif_mensuel ? parseFloat(formData.objectif_mensuel) : 0,
        objectif_annuel: formData.objectif_annuel ? parseFloat(formData.objectif_annuel) : 0,
        cause_arret: formData.cause_arret || '',
        class_production: formData.class_production || ''
      };

      await axios.post('http://localhost:8000/api/production-usine/', payload);
      
      setSuccess('Production ajoutée avec succès');
      setShowAddModal(false);
      fetchData(); // Recharger les données
      
    } catch (err) {
      handleApiError(err, 'Erreur lors de l\'ajout de la production');
    } finally {
      setLoading(false);
    }
  };

  // Soumettre le formulaire de modification
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validation basique
      if (!formData.usine) {
        throw new Error('Veuillez sélectionner une usine');
      }
      if (!formData.date) {
        throw new Error('La date est requise');
      }
      if (!formData.production_jour || parseFloat(formData.production_jour) < 0) {
        throw new Error('Veuillez entrer une production journalière valide');
      }

      const payload = {
        ...formData,
        hm: formData.hm ? parseFloat(formData.hm) : null,
        nombre_voyage: formData.nombre_voyage ? parseInt(formData.nombre_voyage) : 0,
        production_jour: parseFloat(formData.production_jour),
        objectif_mensuel: formData.objectif_mensuel ? parseFloat(formData.objectif_mensuel) : 0,
        objectif_annuel: formData.objectif_annuel ? parseFloat(formData.objectif_annuel) : 0,
        cause_arret: formData.cause_arret || '',
        class_production: formData.class_production || ''
      };

      await axios.put(`http://localhost:8000/api/production-usine/${selectedProduction.id}/`, payload);
      
      setSuccess('Production modifiée avec succès');
      setShowEditModal(false);
      fetchData(); // Recharger les données
      
    } catch (err) {
      handleApiError(err, 'Erreur lors de la modification de la production');
    } finally {
      setLoading(false);
    }
  };

  // Supprimer une production
  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await axios.delete(`http://localhost:8000/api/production-usine/${selectedProduction.id}/`);
      
      setSuccess('Production supprimée avec succès');
      setShowDeleteModal(false);
      fetchData(); // Recharger les données
      
    } catch (err) {
      handleApiError(err, 'Erreur lors de la suppression de la production');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid mt-3">
      <h2 className="text-center mb-4">
        <FaIndustry className="me-2" />
        Tableau de Bord des Productions d'Usine
      </h2>

      {/* Alertes */}
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
          {success}
        </Alert>
      )}

      {/* Cartes de statistiques par catégorie */}
      <Row className="mb-4">
        {/* Centre Enrobé */}
        <Col md={6}>
          <Card className="text-center border-primary">
            <Card.Header className="bg-primary text-white">
              <FaHardHat className="me-2" />
              <strong>Centre Enrobé</strong>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <div className="text-center">
                    <div className="text-primary fs-4 fw-bold">
                      {statsParCategorie['Centre Enrobé']?.nombre_usines || 0}
                    </div>
                    <small>Usines</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <div className="text-success fs-4 fw-bold">
                      {statsParCategorie['Centre Enrobé']?.production_jour.toFixed(1) || '0.0'}
                    </div>
                    <small>Jour (t)</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <div className="text-warning fs-4 fw-bold">
                      {statsParCategorie['Centre Enrobé']?.cumul_mois.toFixed(1) || '0.0'}
                    </div>
                    <small>Mois (t)</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <div className="text-danger fs-4 fw-bold">
                      {statsParCategorie['Centre Enrobé']?.cumul_annee.toFixed(1) || '0.0'}
                    </div>
                    <small>Année (t)</small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        {/* Concasseur */}
        <Col md={6}>
          <Card className="text-center border-warning">
            <Card.Header className="bg-warning text-dark">
              <FaCog className="me-2" />
              <strong>Concasseur</strong>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <div className="text-center">
                    <div className="text-warning fs-4 fw-bold">
                      {statsParCategorie['Concasseur']?.nombre_usines || 0}
                    </div>
                    <small>Usines</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <div className="text-success fs-4 fw-bold">
                      {statsParCategorie['Concasseur']?.production_jour.toFixed(1) || '0.0'}
                    </div>
                    <small>Jour (t)</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <div className="text-warning fs-4 fw-bold">
                      {statsParCategorie['Concasseur']?.cumul_mois.toFixed(1) || '0.0'}
                    </div>
                    <small>Mois (t)</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <div className="text-danger fs-4 fw-bold">
                      {statsParCategorie['Concasseur']?.cumul_annee.toFixed(1) || '0.0'}
                    </div>
                    <small>Année (t)</small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Cartes de statistiques globales */}
      <Row className="mb-4">
        <Col md={2}>
          <Card className="text-center bg-secondary text-white">
            <Card.Body>
              <FaIndustry size={24} />
              <h5 className="mt-2">{stats.totalProductions}</h5>
              <small>Productions</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center bg-success text-white">
            <Card.Body>
              <FaChartBar size={24} />
              <h5 className="mt-2">{stats.productionTotale.toFixed(1)}</h5>
              <small>Production Totale (t)</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center bg-info text-white">
            <Card.Body>
              <FaCalendarWeek size={24} />
              <h5 className="mt-2">{stats.totalCumulSemaine.toFixed(1)}</h5>
              <small>Cumul Semaine (t)</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center bg-warning text-white">
            <Card.Body>
              <FaCalendarAlt size={24} />
              <h5 className="mt-2">{stats.totalCumulMois.toFixed(1)}</h5>
              <small>Cumul Mois (t)</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center bg-danger text-white">
            <Card.Body>
              <FaChartLine size={24} />
              <h5 className="mt-2">{stats.totalCumulAnnee.toFixed(1)}</h5>
              <small>Cumul Année (t)</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center bg-dark text-white">
            <Card.Body>
              <FaTruck size={24} />
              <h5 className="mt-2">{stats.totalVoyages}</h5>
              <small>Total Voyages</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Bouton d'ajout et filtres */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-light d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <FaFilter className="me-2" />
            Gestion des Productions
          </h5>
          <div>
            <Button 
              variant="primary" 
              size="sm" 
              className="me-2"
              onClick={openAddModal}
              disabled={loading}
            >
              <FaPlus className="me-1" />
              Ajouter Production
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={resetFilters}>
              <FaTimes className="me-1" />
              Réinitialiser Filtres
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Recherche</Form.Label>
                <InputGroup>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Usine, matricule, cause..."
                    name="searchTerm"
                    value={filters.searchTerm}
                    onChange={handleFilterChange}
                  />
                </InputGroup>
              </Form.Group>
            </Col>
            
            <Col md={2}>
              <Form.Group>
                <Form.Label>Usine</Form.Label>
                <Form.Select
                  name="usine"
                  value={filters.usine}
                  onChange={handleFilterChange}
                >
                  <option value="">Toutes les usines</option>
                  {usines.map(usine => (
                    <option key={usine.id} value={usine.id}>
                      {usine.matricule}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={2}>
              <Form.Group>
                <Form.Label>Catégorie</Form.Label>
                <Form.Select
                  name="categorie"
                  value={filters.categorie}
                  onChange={handleFilterChange}
                >
                  <option value="">Toutes les catégories</option>
                  <option value="Centre Enrobé">Centre Enrobé</option>
                  <option value="Concasseur">Concasseur</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={2}>
              <Form.Group>
                <Form.Label>Classe Production</Form.Label>
                <Form.Select
                  name="classProduction"
                  value={filters.classProduction}
                  onChange={handleFilterChange}
                >
                  <option value="">Toutes</option>
                  <option value="0/2">0/2</option>
                  <option value="2/4">2/4</option>
                  <option value="4/6">4/6</option>
                  <option value="6/10">6/10</option>
                  <option value="4/10">4/10</option>
                  <option value="10/14">10/14</option>
                  <option value="5/25">5/25</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={2}>
              <Form.Group>
                <Form.Label>Date Début</Form.Label>
                <Form.Control
                  type="date"
                  name="dateDebut"
                  value={filters.dateDebut}
                  onChange={handleFilterChange}
                />
              </Form.Group>
            </Col>

            <Col md={2}>
              <Form.Group>
                <Form.Label>Date Fin</Form.Label>
                <Form.Control
                  type="date"
                  name="dateFin"
                  value={filters.dateFin}
                  onChange={handleFilterChange}
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tabs pour les différents tableaux */}
      <Tabs defaultActiveKey="details" className="mb-4">
        <Tab eventKey="details" title={
          <span>
            <FaIndustry className="me-1" />
            Détails des Productions
          </span>
        }>
          {/* Tableau des détails des productions */}
          <Card className="shadow-sm">
            <Card.Header className="bg-dark text-white">
              <h5 className="mb-0">
                <FaIndustry className="me-2" />
                Liste Détailée des Productions d'Usine
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Chargement des données...</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        
                        <th>Usine</th>
                        <th>Type</th>
                        <th>Date</th>
                        <th>HM</th>
                        <th>Production Jour</th>
                        <th>Nombre Voyages</th>
                        <th>Cause Arrêt</th>
                        <th>Classe</th>
                        <th>Taux Mois</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProductions.length > 0 ? (
                        filteredProductions.map((production, index) => (
                          <tr key={production.id || index}>
                            
                            <td>
                              <div>
                                <strong>{production.usine_info?.matricule}</strong>
                                <br />
                                <small className="text-muted">
                                  {production.usine_info?.nom}
                                </small>
                              </div>
                            </td>
                            <td>
                              <Badge 
                                bg={production.categorie === 'Centre Enrobé' ? 'primary' : 'warning'}
                                className="text-dark"
                              >
                                {production.categorie === 'Centre Enrobé' ? 
                                  <FaHardHat className="me-1" /> : 
                                  <FaCog className="me-1" />
                                }
                                {production.categorie}
                              </Badge>
                            </td>
                            <td>
                              <FaCalendar className="me-1 text-muted" />
                              {production.date_formatted}
                            </td>
                            <td>
                              {production.hm ? (
                                <Badge bg="info">
                                  <FaClock className="me-1" />
                                  {production.hm}h
                                </Badge>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              <strong>{production.production_jour}</strong>
                              <small className="text-muted d-block">tonnes</small>
                            </td>
                            <td>
                              <Badge bg={production.nombre_voyage > 0 ? "warning" : "success"}>
                                <FaTruck className="me-1" />
                                {production.nombre_voyage || 0}
                              </Badge>
                            </td>
                            <td>
                              {production.cause_arret ? (
                                <div className="d-flex align-items-center">
                                  <FaExclamationTriangle className="me-1 text-warning" />
                                  <span 
                                    className="text-truncate" 
                                    style={{ maxWidth: '150px' }}
                                    title={production.cause_arret}
                                  >
                                    {production.cause_arret.length > 30 
                                      ? `${production.cause_arret.substring(0, 30)}...` 
                                      : production.cause_arret
                                    }
                                  </span>
                                </div>
                              ) : (
                                <Badge bg="success">Aucun arrêt</Badge>
                              )}
                            </td>
                            <td>
                              {production.class_production ? (
                                <Badge bg="secondary">{production.class_production}</Badge>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              <Badge bg={production.statut_taux}>
                                {production.taux_mois}%
                              </Badge>
                            </td>
                            <td>
                              <div className="d-flex gap-1">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => showDetails(production)}
                                  title="Voir les détails"
                                >
                                  <FaEye />
                                </Button>
                                <Button
                                  variant="outline-warning"
                                  size="sm"
                                  onClick={() => openEditModal(production)}
                                  title="Modifier"
                                >
                                  <FaEdit />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => openDeleteModal(production)}
                                  title="Supprimer"
                                >
                                  <FaTrash />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="10" className="text-center py-4">
                            <div className="text-muted">
                              <FaIndustry size={40} className="mb-2" />
                              <p>Aucune production trouvée</p>
                              {productions.length === 0 ? 
                                "Aucune donnée de production disponible" : 
                                "Aucune production ne correspond aux critères de filtrage"
                              }
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="cumuls" title={
          <span>
            <FaChartLine className="me-1" />
            Cumuls par Usine
          </span>
        }>
          {/* Tableau des cumuls par usine */}
          <Card className="shadow-sm">
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">
                <FaChartLine className="me-2" />
                Cumuls de Production par Usine
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Chargement des données...</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Catégorie</th>
                        <th>Usine</th>
                        <th>Production du Jour (t)</th>
                        <th>Dernière Mise à Jour</th>
                        <th>Cumul Semaine (t)</th>
                        <th>Cumul Mois (t)</th>
                        <th>Cumul Année (t)</th>
                        <th>Performance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cumulsParUsine.length > 0 ? (
                        cumulsParUsine.map((usine, index) => {
                          const performance = usine.cumul_mois > 0 ? 
                            (usine.cumul_semaine / (usine.cumul_mois / 4)).toFixed(1) : 0;
                          
                          return (
                            <tr key={usine.usine_info?.matricule || index}>
                              <td>
                                <Badge 
                                  bg={usine.categorie === 'Centre Enrobé' ? 'primary' : 'warning'}
                                  className="text-dark"
                                >
                                  {usine.categorie === 'Centre Enrobé' ? 
                                    <FaHardHat className="me-1" /> : 
                                    <FaCog className="me-1" />
                                  }
                                  {usine.categorie}
                                </Badge>
                              </td>
                              <td>
                                <div>
                                  <strong>{usine.usine_info?.matricule}</strong>
                                  <br />
                                  <small className="text-muted">
                                    {usine.usine_info?.nom}
                                  </small>
                                </div>
                              </td>
                              <td>
                                <Badge 
                                  bg={usine.production_jour > 0 ? "success" : "secondary"}
                                  className="fs-6"
                                >
                                  {usine.production_jour.toFixed(1)}
                                </Badge>
                              </td>
                              <td>
                                <small className="text-muted">
                                  {usine.dernier_jour || 'Aucune donnée'}
                                </small>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <FaCalendarWeek className="me-2 text-primary" />
                                  <strong>{usine.cumul_semaine.toFixed(1)}</strong>
                                </div>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <FaCalendarAlt className="me-2 text-warning" />
                                  <strong>{usine.cumul_mois.toFixed(1)}</strong>
                                </div>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <FaChartLine className="me-2 text-danger" />
                                  <strong>{usine.cumul_annee.toFixed(1)}</strong>
                                </div>
                              </td>
                              <td>
                                <Badge 
                                  bg={
                                    performance >= 1 ? "success" :
                                    performance >= 0.7 ? "warning" : "danger"
                                  }
                                >
                                  {performance}x
                                </Badge>
                                <small className="d-block text-muted">
                                  vs moyenne mensuelle
                                </small>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="8" className="text-center py-4">
                            <div className="text-muted">
                              <FaIndustry size={40} className="mb-2" />
                              <p>Aucune donnée de cumul disponible</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="table-dark">
                      <tr>
                        <td colSpan="2"><strong>TOTAL GÉNÉRAL</strong></td>
                        <td>
                          <strong>{cumulsParUsine.reduce((sum, u) => sum + u.production_jour, 0).toFixed(1)}</strong>
                        </td>
                        <td></td>
                        <td>
                          <strong>{stats.totalCumulSemaine.toFixed(1)}</strong>
                        </td>
                        <td>
                          <strong>{stats.totalCumulMois.toFixed(1)}</strong>
                        </td>
                        <td>
                          <strong>{stats.totalCumulAnnee.toFixed(1)}</strong>
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

     
      {/* Les modals restent inchangés */}
      {/* Modal d'ajout de production */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaPlus className="me-2" />
            Ajouter une Production
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Usine *</Form.Label>
                  <Form.Select
                    name="usine"
                    value={formData.usine}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Sélectionner une usine</option>
                    {usines.map(usine => (
                      <option key={usine.id} value={usine.id}>
                        {usine.matricule} - {usine.nom}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date *</Form.Label>
                  <Form.Control
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleFormChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>HM (Heures de marche)</Form.Label>
                  <Form.Control
                    type="number"
                    name="hm"
                    value={formData.hm}
                    onChange={handleFormChange}
                    min="0"
                    max="24"
                    step="0.5"
                    placeholder="Ex: 8.5"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre de Voyages</Form.Label>
                  <Form.Control
                    type="number"
                    name="nombre_voyage"
                    value={formData.nombre_voyage}
                    onChange={handleFormChange}
                    min="0"
                    placeholder="Ex: 15"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Production Jour * (tonnes)</Form.Label>
                  <Form.Control
                    type="number"
                    name="production_jour"
                    value={formData.production_jour}
                    onChange={handleFormChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="Ex: 150.5"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Objectif Mensuel (tonnes)</Form.Label>
                  <Form.Control
                    type="number"
                    name="objectif_mensuel"
                    value={formData.objectif_mensuel}
                    onChange={handleFormChange}
                    min="0"
                    step="0.01"
                    placeholder="Ex: 4500"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Objectif Annuel (tonnes)</Form.Label>
                  <Form.Control
                    type="number"
                    name="objectif_annuel"
                    value={formData.objectif_annuel}
                    onChange={handleFormChange}
                    min="0"
                    step="0.01"
                    placeholder="Ex: 50000"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Classe de Production</Form.Label>
                  <Form.Select
                    name="class_production"
                    value={formData.class_production}
                    onChange={handleFormChange}
                  >
                    <option value="">Sélectionner une classe</option>
                    <option value="0/2">0/2</option>
                    <option value="2/4">2/4</option>
                    <option value="4/6">4/6</option>
                    <option value="6/10">6/10</option>
                    <option value="4/10">4/10</option>
                    <option value="10/14">10/14</option>
                    <option value="5/25">5/25</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Cause d'Arrêt</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="cause_arret"
                value={formData.cause_arret}
                onChange={handleFormChange}
                placeholder="Décrire la cause d'arrêt si applicable..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={() => setShowAddModal(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <FaSave className="me-1" />
                  Enregistrer
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal de modification de production */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaEdit className="me-2" />
            Modifier la Production
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Usine *</Form.Label>
                  <Form.Select
                    name="usine"
                    value={formData.usine}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Sélectionner une usine</option>
                    {usines.map(usine => (
                      <option key={usine.id} value={usine.id}>
                        {usine.matricule} - {usine.nom}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date *</Form.Label>
                  <Form.Control
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleFormChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>HM (Heures de marche)</Form.Label>
                  <Form.Control
                    type="number"
                    name="hm"
                    value={formData.hm}
                    onChange={handleFormChange}
                    min="0"
                    max="24"
                    step="0.5"
                    placeholder="Ex: 8.5"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre de Voyages</Form.Label>
                  <Form.Control
                    type="number"
                    name="nombre_voyage"
                    value={formData.nombre_voyage}
                    onChange={handleFormChange}
                    min="0"
                    placeholder="Ex: 15"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Production Jour * (tonnes)</Form.Label>
                  <Form.Control
                    type="number"
                    name="production_jour"
                    value={formData.production_jour}
                    onChange={handleFormChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="Ex: 150.5"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Objectif Mensuel (tonnes)</Form.Label>
                  <Form.Control
                    type="number"
                    name="objectif_mensuel"
                    value={formData.objectif_mensuel}
                    onChange={handleFormChange}
                    min="0"
                    step="0.01"
                    placeholder="Ex: 4500"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Objectif Annuel (tonnes)</Form.Label>
                  <Form.Control
                    type="number"
                    name="objectif_annuel"
                    value={formData.objectif_annuel}
                    onChange={handleFormChange}
                    min="0"
                    step="0.01"
                    placeholder="Ex: 50000"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Classe de Production</Form.Label>
                  <Form.Select
                    name="class_production"
                    value={formData.class_production}
                    onChange={handleFormChange}
                  >
                    <option value="">Sélectionner une classe</option>
                    <option value="0/2">0/2</option>
                    <option value="2/4">2/4</option>
                    <option value="4/6">4/6</option>
                    <option value="6/10">6/10</option>
                    <option value="4/10">4/10</option>
                    <option value="10/14">10/14</option>
                    <option value="5/25">5/25</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Cause d'Arrêt</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="cause_arret"
                value={formData.cause_arret}
                onChange={handleFormChange}
                placeholder="Décrire la cause d'arrêt si applicable..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={() => setShowEditModal(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button 
              variant="warning" 
              type="submit" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  Modification...
                </>
              ) : (
                <>
                  <FaSave className="me-1" />
                  Modifier
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal de suppression */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaTrash className="me-2 text-danger" />
            Confirmer la suppression
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProduction && (
            <div>
              <p>Êtes-vous sûr de vouloir supprimer cette production ?</p>
              <div className="alert alert-warning">
                <strong>Usine:</strong> {selectedProduction.usine_info?.matricule}<br />
                <strong>Date:</strong> {selectedProduction.date_formatted}<br />
                <strong>Production:</strong> {selectedProduction.production_jour} tonnes
              </div>
              <p className="text-danger">
                <FaExclamationTriangle className="me-1" />
                Cette action est irréversible.
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowDeleteModal(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Suppression...
              </>
            ) : (
              <>
                <FaTrash className="me-1" />
                Supprimer
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de détail */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaIndustry className="me-2" />
            Détails de la Production
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProduction && (
            <Row>
              <Col md={6}>
                <h6>Informations Usine</h6>
                <Table size="sm" bordered>
                  <tbody>
                    <tr>
                      <td><strong>Usine:</strong></td>
                      <td>{selectedProduction.usine_info?.matricule}</td>
                    </tr>
                    <tr>
                      <td><strong>Nom:</strong></td>
                      <td>{selectedProduction.usine_info?.nom}</td>
                    </tr>
                    <tr>
                      <td><strong>Date:</strong></td>
                      <td>{selectedProduction.date_formatted}</td>
                    </tr>
                    <tr>
                      <td><strong>Classe:</strong></td>
                      <td>
                        {selectedProduction.class_production ? (
                          <Badge bg="secondary">{selectedProduction.class_production}</Badge>
                        ) : '-'}
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
              
              <Col md={6}>
                <h6>Production</h6>
                <Table size="sm" bordered>
                  <tbody>
                    <tr>
                      <td><strong>HM:</strong></td>
                      <td>
                        {selectedProduction.hm ? (
                          <Badge bg="info">{selectedProduction.hm} heures</Badge>
                        ) : '-'}
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Production Jour:</strong></td>
                      <td>
                        <strong>{selectedProduction.production_jour}</strong> tonnes
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Production Mois:</strong></td>
                      <td>{selectedProduction.production_mois} tonnes</td>
                    </tr>
                    <tr>
                      <td><strong>Production Année:</strong></td>
                      <td>{selectedProduction.production_annee} tonnes</td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
              
              <Col md={6}>
                <h6>Voyages et Objectifs</h6>
                <Table size="sm" bordered>
                  <tbody>
                    <tr>
                      <td><strong>Nombre Voyages:</strong></td>
                      <td>
                        <Badge bg={selectedProduction.nombre_voyage > 0 ? "warning" : "success"}>
                          {selectedProduction.nombre_voyage || 0}
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
              
              <Col md={6}>
                <h6>Performances</h6>
                <Table size="sm" bordered>
                  <tbody>
                    <tr>
                      <td><strong>Taux Mensuel:</strong></td>
                      <td>
                        <Badge bg={selectedProduction.statut_taux}>
                          {selectedProduction.taux_mois}%
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
              
              <Col md={12}>
                <h6>Cause d'Arrêt</h6>
                <Card>
                  <Card.Body>
                    {selectedProduction.cause_arret ? (
                      <p className="mb-0">{selectedProduction.cause_arret}</p>
                    ) : (
                      <p className="text-success mb-0">
                        <FaExclamationTriangle className="me-1" />
                        Aucun arrêt signalé
                      </p>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AffichageProductionUsine;