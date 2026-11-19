import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Table, Button, Form, Badge, Alert, Spinner, Card, 
  InputGroup, Row, Col, Nav
} from 'react-bootstrap';
import { 
  FaFileExport, FaPrint, FaSearch, FaFilter, 
  FaExclamationTriangle, FaCalendarAlt, FaCar, FaArrowLeft
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

const PlanningEntretienUrgent = () => {
  const navigate = useNavigate();
  
  // États
  const [vidanges, setVidanges] = useState([]);
  const [voitures, setVoitures] = useState([]);
  const [productions, setProductions] = useState([]);
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtres
  const [filters, setFilters] = useState({
    searchTerm: '',
    filterVoiture: '',
    filterProjet: '',
    filterTypeVidange: '',
    tri: 'heur_restant' // heur_restant, date_visite, matricule
  });

  // Chargement des données
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [voituresRes, vidangesRes, productionsRes, projetsRes] = await Promise.all([
          axios.get('http://localhost:8000/api/voitures/'),
          axios.get('http://localhost:8000/api/vidanges/'),
          axios.get('http://localhost:8000/api/productions/'),
          axios.get('http://localhost:8000/api/projets/'),
        ]);
        
        setVoitures(voituresRes.data);
        setProductions(productionsRes.data);
        setProjets(projetsRes.data);
        
        // Enrichir les données des vidanges et filtrer les urgents (HMR < 500)
        const enhancedVidanges = vidangesRes.data
          .map(vidange => {
            const voiture = voituresRes.data.find(v => v.id === vidange.voiture);
            const production = productionsRes.data.find(p => p.voiture === vidange.voiture);
            const projet = projetsRes.data.find(p => p.id === vidange.projet);
            
            const compteurActuel = production?.compteur_fin || 0;
            const heur_restant = vidange.prochaine_visite - compteurActuel;
            const dateVisite = new Date(vidange.date_visite);
            const aujourdhui = new Date();
            const joursRestants = Math.ceil((dateVisite - aujourdhui) / (1000 * 60 * 60 * 24));
            
            // Déterminer le niveau d'urgence critique
            let niveauUrgence = 'normal';
            let couleurUrgence = 'success';
            let iconeUrgence = '';
            
            if (heur_restant < 0) {
              niveauUrgence = 'critique';
              couleurUrgence = 'danger';
              iconeUrgence = '🔴';
            } else if (heur_restant <= 100) {
              niveauUrgence = 'tres_urgent';
              couleurUrgence = 'danger';
              iconeUrgence = '🟠';
            } else if (heur_restant <= 300) {
              niveauUrgence = 'urgent';
              couleurUrgence = 'warning';
              iconeUrgence = '🟡';
            } else if (heur_restant <= 500) {
              niveauUrgence = 'attention';
              couleurUrgence = 'info';
              iconeUrgence = '🔵';
            }
            
            return {
              ...vidange,
              voiture_info: voiture,
              production_info: production,
              projet_info: projet,
              projet_name: projet?.name || 'Non attribué',
              compteur_actuel: compteurActuel,
              heur_restant: heur_restant,
              jours_restants: joursRestants,
              niveau_urgence: niveauUrgence,
              couleur_urgence: couleurUrgence,
              icone_urgence: iconeUrgence,
              date_visite_obj: dateVisite,
              consommation_moyenne: production ? (production.compteur_fin - production.compteur_debut) / 30 : 0
            };
          })
          .filter(vidange => vidange.heur_restant <= 500); // FILTRE PRINCIPAL : HMR ≤ 500
        
        setVidanges(enhancedVidanges);
      } catch (err) {
        setError('Erreur de chargement des données');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Gestion des filtres
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({...filters, [name]: value});
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      filterVoiture: '',
      filterProjet: '',
      filterTypeVidange: '',
      tri: 'heur_restant'
    });
  };

  // Filtrer et trier les vidanges (déjà pré-filtrées par HMR ≤ 500)
  const filteredVidanges = vidanges
    .filter(vidange => {
      const matchesSearch = filters.searchTerm === '' || 
        vidange.voiture_info?.matricule?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        vidange.projet_name.toLowerCase().includes(filters.searchTerm.toLowerCase());

      const matchesVoiture = filters.filterVoiture === '' || vidange.voiture === parseInt(filters.filterVoiture);
      const matchesProjet = filters.filterProjet === '' || vidange.projet === parseInt(filters.filterProjet);
      const matchesType = filters.filterTypeVidange === '' || vidange.type_vidange === filters.filterTypeVidange;

      return matchesSearch && matchesVoiture && matchesProjet && matchesType;
    })
    .sort((a, b) => {
      switch (filters.tri) {
        case 'date_visite':
          return a.date_visite_obj - b.date_visite_obj;
        case 'matricule':
          return (a.voiture_info?.matricule || '').localeCompare(b.voiture_info?.matricule || '');
        case 'heur_restant':
        default:
          return a.heur_restant - b.heur_restant;
      }
    });

  // Statistiques détaillées pour les urgents
  const stats = {
    total: filteredVidanges.length,
    critique: filteredVidanges.filter(v => v.heur_restant < 0).length,
    tres_urgent: filteredVidanges.filter(v => v.heur_restant <= 100 && v.heur_restant > 0).length,
    urgent: filteredVidanges.filter(v => v.heur_restant <= 300 && v.heur_restant > 100).length,
    attention: filteredVidanges.filter(v => v.heur_restant <= 500 && v.heur_restant > 300).length
  };

  // Export Excel
  const exportToExcel = () => {
    const dataToExport = filteredVidanges.map(vidange => ({
      'Matricule': vidange.voiture_info?.matricule || 'N/A',
     
      'Projet': vidange.projet_name,
      'Date Visite': vidange.date_visite_obj.toLocaleDateString('fr-FR'),
      'Type Vidange': vidange.type_vidange === 'VIDANGE_SIMPLE' ? 'Simple' : 'Complète',
      'Compteur Actuel': vidange.compteur_actuel,
      'Prochaine Visite (km)': vidange.prochaine_visite,
      'Heures Restantes': vidange.heur_restant,
      'Jours Restants': vidange.jours_restants,
      'Niveau Urgence': getNiveauUrgenceText(vidange.niveau_urgence),
      'Priorité': getPriorite(vidange.heur_restant),
      'Consommation Moyenne (km/j)': vidange.consommation_moyenne.toFixed(2)
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Entretiens Urgents');
    XLSX.writeFile(wb, `entretiens_urgents_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Fonctions utilitaires
  const getNiveauUrgenceText = (niveau) => {
    switch (niveau) {
      case 'critique': return 'CRITIQUE';
      case 'tres_urgent': return 'TRÈS URGENT';
      case 'urgent': return 'URGENT';
      case 'attention': return 'ATTENTION';
      default: return 'NORMAL';
    }
  };

  const getPriorite = (heur_restant) => {
    if (heur_restant < 0) return 'P1 - IMMÉDIATE';
    if (heur_restant <= 100) return 'P2 - TRÈS URGENTE';
    if (heur_restant <= 300) return 'P3 - URGENTE';
    return 'P4 - ATTENTION';
  };

  const getDescriptionUrgence = (heur_restant) => {
    if (heur_restant < 0) return 'Entretien en retard !';
    if (heur_restant <= 100) return 'Entretien très proche';
    if (heur_restant <= 300) return 'Entretien proche';
    return 'Entretien à planifier';
  };

  // Impression
  const handlePrint = () => {
    window.print();
  };

  if (loading) return (
    <div className="text-center mt-4">
      <Spinner animation="border" variant="danger" />
      <p className="mt-2">Chargement des entretiens urgents...</p>
    </div>
  );
  
  if (error) return (
    <div className="container mt-4">
      <Alert variant="danger" onClose={() => setError(null)} dismissible>
        {error}
      </Alert>
    </div>
  );

  return (
    <div className="container mt-4">
      {/* En-tête */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate(-1)}
            className="mb-2"
          >
            <FaArrowLeft /> Retour
          </Button>
          <h2 className="mb-1 text-danger">
            <FaExclamationTriangle className="me-2" />
            Planning des Entretiens Urgents
          </h2>
          <p className="text-muted">Véhicules avec HMR ≤ 500 heures</p>
        </div>
        <div>
          <Button variant="outline-danger" className="me-2" onClick={exportToExcel}>
            <FaFileExport className="me-1" /> Excel
          </Button>
          <Button variant="outline-secondary" onClick={handlePrint}>
            <FaPrint className="me-1" /> Imprimer
          </Button>
        </div>
      </div>

      {/* Alertes importantes */}
      {stats.critique > 0 && (
        <Alert variant="danger" className="mb-4">
          <FaExclamationTriangle className="me-2" />
          <strong>ALERTE CRITIQUE :</strong> {stats.critique} véhicule(s) ont dépassé la date d'entretien !
        </Alert>
      )}

      {/* Cartes de statistiques */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm bg-light">
            <Card.Body>
              <h5 className="card-title">Total Urgents</h5>
              <h3 className="text-dark">{stats.total}</h3>
              <small className="text-muted">Véhicules à surveiller</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm bg-danger text-white">
            <Card.Body>
              <h5 className="card-title">Critique</h5>
              <h3>{stats.critique}</h3>
              <small>HMR &lt; 0</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm bg-warning text-dark">
            <Card.Body>
              <h5 className="card-title">Très Urgent</h5>
              <h3>{stats.tres_urgent}</h3>
              <small>HMR ≤ 100</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm bg-info text-white">
            <Card.Body>
              <h5 className="card-title">Attention</h5>
              <h3>{stats.attention}</h3>
              <small>HMR ≤ 500</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filtres */}
      <Card className="mb-4 shadow-sm border-warning">
        <Card.Header className="bg-warning text-dark">
          <h5 className="mb-0">
            <FaFilter className="me-2" /> Filtres des Entretiens Urgents
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Recherche rapide</Form.Label>
                <InputGroup>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Matricule ou projet..."
                    name="searchTerm"
                    value={filters.searchTerm}
                    onChange={handleFilterChange}
                  />
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Véhicule</Form.Label>
                <Form.Select
                  name="filterVoiture"
                  value={filters.filterVoiture}
                  onChange={handleFilterChange}
                >
                  <option value="">Tous</option>
                  {voitures.map(v => (
                    <option key={v.id} value={v.id}>{v.matricule}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Projet</Form.Label>
                <Form.Select
                  name="filterProjet"
                  value={filters.filterProjet}
                  onChange={handleFilterChange}
                >
                  <option value="">Tous</option>
                  {projets.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Type vidange</Form.Label>
                <Form.Select
                  name="filterTypeVidange"
                  value={filters.filterTypeVidange}
                  onChange={handleFilterChange}
                >
                  <option value="">Tous</option>
                  <option value="VIDANGE_SIMPLE">Simple</option>
                  <option value="VIDANGE_COMPLET">Complète</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Trier par</Form.Label>
                <Form.Select
                  name="tri"
                  value={filters.tri}
                  onChange={handleFilterChange}
                >
                  <option value="heur_restant">Heures restantes</option>
                  <option value="date_visite">Date visite</option>
                  <option value="matricule">Matricule</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={1} className="d-flex align-items-end">
              <Button variant="outline-secondary" onClick={resetFilters}>
                Reset
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tableau principal */}
      <Card className="shadow-sm border-danger">
        <Card.Header className="bg-danger text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <FaExclamationTriangle className="me-2" />
            Liste des Entretiens Urgents ({filteredVidanges.length} véhicules)
          </h5>
          <Nav variant="pills">
            <Nav.Item>
              <Nav.Link active href="#" className="text-white">
                Vue Priorité
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table striped bordered hover className="mb-0">
              <thead className="table-dark">
                <tr>
                  <th>Priorité</th>
                  <th>Équipement</th>
                  <th>Type</th>
                  <th>Projet</th>
                  <th>Date visite</th>
                  <th>Type vidange</th>
                  <th>Compteur actuel</th>
                  <th>Prochaine visite</th>
                  <th>HMR</th>
                  <th>Jours restants</th>
                  <th>Statut</th>
                  <th>Action Requise</th>
                </tr>
              </thead>
              <tbody>
                {filteredVidanges.length > 0 ? (
                  filteredVidanges.map(vidange => (
                    <tr key={vidange.id} className={vidange.heur_restant < 0 ? 'table-danger' : ''}>
                      <td>
                        <Badge bg={
                          vidange.heur_restant < 0 ? 'danger' :
                          vidange.heur_restant <= 100 ? 'warning' :
                          vidange.heur_restant <= 300 ? 'info' : 'secondary'
                        }>
                          {getPriorite(vidange.heur_restant)}
                        </Badge>
                      </td>
                      <td className="fw-bold">
                        <FaCar className="me-2" />
                        {vidange.voiture_info?.matricule || 'N/A'}
                      </td>
                      <td>{vidange.voiture_info?.type_voiture || 'N/A'}</td>
                      <td>{vidange.projet_name}</td>
                      <td>
                        <strong>
                          {vidange.date_visite_obj.toLocaleDateString('fr-FR')}
                        </strong>
                      </td>
                      <td>
                        <Badge bg={vidange.type_vidange === 'VIDANGE_SIMPLE' ? 'primary' : 'warning'}>
                          {vidange.type_vidange === 'VIDANGE_SIMPLE' ? 'Simple' : 'Complète'}
                        </Badge>
                      </td>
                      <td>{vidange.compteur_actuel.toLocaleString()} km</td>
                      <td>{vidange.prochaine_visite.toLocaleString()} km</td>
                      <td>
                        <Badge bg={vidange.couleur_urgence}>
                          {vidange.heur_restant.toLocaleString()} h
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={vidange.jours_restants <= 0 ? 'danger' : 
                                 vidange.jours_restants <= 7 ? 'warning' : 'info'}>
                          {vidange.jours_restants} j
                        </Badge>
                      </td>
                      <td>
                        {vidange.icone_urgence} {getNiveauUrgenceText(vidange.niveau_urgence)}
                      </td>
                      <td>
                        <small className="text-muted">
                          {getDescriptionUrgence(vidange.heur_restant)}
                        </small>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="12" className="text-center py-4">
                      <div className="text-muted">
                        <FaExclamationTriangle size={48} className="mb-3 text-success" />
                        <h5>Aucun entretien urgent trouvé</h5>
                        <p>Tous les véhicules ont un HMR supérieur à 500 heures</p>
                        <Button 
                          variant="outline-success" 
                          onClick={() => navigate('/entretien/planning')}
                        >
                          Voir le planning complet
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Légende et recommandations */}
      <Card className="mt-3 shadow-sm">
        <Card.Body>
          <Row>
            <Col md={6}>
              <h6>Légende des priorités :</h6>
              <div className="d-flex flex-column gap-2">
                <div>
                  <Badge bg="danger" className="me-2">P1</Badge>
                  <small>CRITIQUE - Entretien en retard (HMR &lt; 0)</small>
                </div>
                <div>
                  <Badge bg="warning" className="me-2">P2</Badge>
                  <small>TRÈS URGENT - Entretien imminent (HMR ≤ 100)</small>
                </div>
                <div>
                  <Badge bg="info" className="me-2">P3</Badge>
                  <small>URGENT - Entretien proche (HMR ≤ 300)</small>
                </div>
                <div>
                  <Badge bg="secondary" className="me-2">P4</Badge>
                  <small>ATTENTION - Entretien à planifier (HMR ≤ 500)</small>
                </div>
              </div>
            </Col>
            <Col md={6}>
              <h6>Recommandations :</h6>
              <ul className="small">
                <li>Traiter les <strong>P1</strong> en priorité absolue</li>
                <li>Planifier les <strong>P2</strong> dans les 48h</li>
                <li>Programmer les <strong>P3</strong> dans la semaine</li>
                <li>Anticiper les <strong>P4</strong> dans le mois</li>
              </ul>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
};

export default PlanningEntretienUrgent;