import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Card, Table, Form, InputGroup, Button, 
  Badge, Row, Col, Spinner, Alert
} from 'react-bootstrap';
import { 
  FaSearch, FaFilter, FaTimes,
  FaIndustry, FaCalendarWeek, FaCalendarAlt, FaChartLine,
  FaHardHat, FaCog, FaFileExcel
} from 'react-icons/fa';
import * as XLSX from 'xlsx';

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
    categorie: ''
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

    const matchesUsine = !filters.usine || production.usine.toString() === filters.usine.toString();
    const matchesClass = !filters.classProduction || production.class_production === filters.classProduction;
    const matchesCategorie = !filters.categorie || production.categorie === filters.categorie;
    
    const productionDate = new Date(production.date);
    const dateDebut = filters.dateDebut ? new Date(filters.dateDebut) : null;
    const dateFin = filters.dateFin ? new Date(filters.dateFin + 'T23:59:59') : null;
    
    const matchesDateDebut = !dateDebut || productionDate >= dateDebut;
    const matchesDateFin = !dateFin || productionDate <= dateFin;

    return matchesSearch && matchesUsine && matchesClass && matchesCategorie && matchesDateDebut && matchesDateFin;
  });

  // Calcul des cumuls par usine
  const calculateCumulsParUsine = () => {
    const cumuls = {};
    const aujourdHui = new Date();
    const debutSemaine = new Date(aujourdHui);
    debutSemaine.setDate(aujourdHui.getDate() - aujourdHui.getDay() + 1); // Lundi de cette semaine
    const debutMois = new Date(aujourdHui.getFullYear(), aujourdHui.getMonth(), 1);
    const debutAnnee = new Date(aujourdHui.getFullYear(), 0, 1);

    filteredProductions.forEach(production => {
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
          dernier_jour: null,
          nombre_productions: 0
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

      // Nombre de productions
      cumuls[usineId].nombre_productions += 1;
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
    totalCumulSemaine: cumulsParUsine.reduce((sum, u) => sum + u.cumul_semaine, 0),
    totalCumulMois: cumulsParUsine.reduce((sum, u) => sum + u.cumul_mois, 0),
    totalCumulAnnee: cumulsParUsine.reduce((sum, u) => sum + u.cumul_annee, 0)
  };

  // Gestion des changements de filtre
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
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

  // Fonction d'export Excel
  const exportToExcel = () => {
    try {
      // Préparer les données pour l'export
      const dataToExport = cumulsParUsine.map(usine => ({
        'Usine': usine.usine_info?.matricule || 'Inconnu',
       
        'Type': usine.categorie,
        'Production Jour (t)': usine.production_jour,
        'Dernière Mise à Jour': usine.dernier_jour || 'Aucune donnée',
        'Cumul Semaine (t)': usine.cumul_semaine,
        'Cumul Mois (t)': usine.cumul_mois,
        'Cumul Année (t)': usine.cumul_annee,
        'Nombre Productions': usine.nombre_productions,
        'Performance': usine.cumul_mois > 0 ? 
          (usine.cumul_semaine / (usine.cumul_mois / 4)).toFixed(1) + 'x' : '0x'
      }));

      // Créer un nouveau workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dataToExport);

      // Ajouter le worksheet au workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Cumuls Production');

      // Générer le fichier Excel et le télécharger
      const fileName = `cumuls_production_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      setSuccess('Export Excel réussi !');
    } catch (err) {
      console.error('Erreur lors de l\'export Excel:', err);
      setError('Erreur lors de l\'export Excel');
    }
  };

  return (
    <div className="container-fluid mt-3">
      <h2 className="text-center mb-4">
        <FaIndustry className="me-2" />
        Rapport  de Production des Usine Central Enrobée et Concasseur
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

      {/* Filtres */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-light d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <FaFilter className="me-2" />
            Filtres de Production
          </h5>
          <div>
            <Button variant="outline-success" size="sm" onClick={exportToExcel} className="me-2">
              <FaFileExcel className="me-1" />
              Export Excel
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={resetFilters}>
              <FaTimes className="me-1" />
              Réinitialiser
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
                    placeholder="Usine, matricule..."
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
                <Form.Label>Type</Form.Label>
                <Form.Select
                  name="categorie"
                  value={filters.categorie}
                  onChange={handleFilterChange}
                >
                  <option value="">Toutes les types</option>
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

      {/* Tableau des cumuls de production */}
      <Card className="shadow-sm">
        <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <FaChartLine className="me-2" />
            Cumuls de Production par Usine
          </h5>
          <div className="text-light">
            <small>
              {cumulsParUsine.length} usine(s) - 
              {filteredProductions.length} production(s) filtrée(s)
            </small>
          </div>
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
                    <th>Production du Jour (t)</th>
                    <th>Dernière Mise à Jour</th>
                    <th>Cumul Semaine (t)</th>
                    <th>Cumul Mois (t)</th>
                    <th>Cumul Année (t)</th>
                    
                    <th>Nb Productions</th>
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
                            <Badge bg="info">
                              {usine.nombre_productions}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="9" className="text-center py-4">
                        <div className="text-muted">
                          <FaIndustry size={40} className="mb-2" />
                          <p>Aucune donnée de cumul disponible</p>
                          <small>Essayez de modifier vos critères de recherche</small>
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
                    <td>
                      <strong>{stats.totalProductions}</strong>
                    </td>
                  </tr>
                </tfoot>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default AffichageProductionUsine;