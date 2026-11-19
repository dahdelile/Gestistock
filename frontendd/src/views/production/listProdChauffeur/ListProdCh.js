import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Modal, Button, Form, Spinner, Alert, 
  Badge, Table, InputGroup, Card, Row, Col 
} from 'react-bootstrap';
import { 
  FaEdit, FaTrash, FaSearch, FaFilter, 
  FaTimes, FaTachometerAlt, FaFileExport 
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const GestionProduction = () => {
  const navigate = useNavigate();
  
  // Main state
  const [productions, setProductions] = useState([]);
  const [voitures, setVoitures] = useState([]);
  const [projets, setProjets] = useState([]);
  const [formData, setFormData] = useState({});
  const [showMainTable, setShowMainTable] = useState(true);
  const [showCumulsTable, setShowCumulsTable] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    searchTerm: '',
    filterVoiture: '',
    filterProjet: '',
    dateDebut: '',
    dateFin: ''
  });

  // UI state
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Cumuls state
  const [cumuls, setCumuls] = useState({
    journalier: [],
    hebdomadaire: [],
    mensuel: [],
    annuel: []
  });
  const [periodeActive, setPeriodeActive] = useState('hebdomadaire');

  // Fonction utilitaire pour convertir le nom du mois en numéro
  const getMonthNumber = (monthName) => {
    const months = {
      'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
      'juillet': 6, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
    };
    return months[monthName.toLowerCase()] || 0;
  };

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [voituresRes, projetsRes, productionsRes] = await Promise.all([
          axios.get('http://localhost:8000/api/voitures/'),
          axios.get('http://localhost:8000/api/projets/'),
          axios.get('http://localhost:8000/api/chauffeurs/')
        ]);

        // Create lookup maps
        const projetsMap = new Map(projetsRes.data.map(p => [p.id, p]));
        const voituresMap = new Map(voituresRes.data.map(v => [v.id, v]));

        // Enhance production records with related data
        const enhancedProductions = productionsRes.data.map(production => ({
          ...production,
          voiture_info: voituresMap.get(production.voiture) || null,
          projet_info: projetsMap.get(production.projet) || null,
          projet_name: projetsMap.get(production.projet)?.name || 'Non attribué',
          date: production.date ? new Date(production.date) : new Date(),
          distance: production.compteur_fin - production.compteur_debut
        }));

        setVoitures(voituresRes.data);
        setProjets(projetsRes.data);
        setProductions(enhancedProductions);
        
      } catch (err) {
        setError('Erreur de chargement des données');
        console.error('Loading error:', err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter productions based on filters
  const filteredProductions = productions
    .filter(production => {
      const searchTerm = filters.searchTerm.toLowerCase();
      const matchesSearch = 
        production.voiture_info?.matricule?.toLowerCase().includes(searchTerm) ||
        production.voiture_info?.type_voiture?.toLowerCase().includes(searchTerm) ||
        production.projet_name.toLowerCase().includes(searchTerm);

      const matchesVoiture = !filters.filterVoiture || production.voiture === parseInt(filters.filterVoiture);
      const matchesProjet = !filters.filterProjet || production.projet === parseInt(filters.filterProjet);
      const matchesDateDebut = !filters.dateDebut || production.date >= new Date(filters.dateDebut);
      const matchesDateFin = !filters.dateFin || production.date <= new Date(filters.dateFin + 'T23:59:59');

      return matchesSearch && matchesVoiture && matchesProjet && matchesDateDebut && matchesDateFin;
    })
    .sort((a, b) => b.distance - a.distance);

  // Calculate cumuls when productions change
  useEffect(() => {
    if (productions.length === 0) return;

    const grouperParPeriode = (periode) => {
      const groupes = {};

      const filteredProductions = productions.filter(production => {
        const searchTerm = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          production.voiture_info?.matricule?.toLowerCase().includes(searchTerm) ||
          production.voiture_info?.type_voiture?.toLowerCase().includes(searchTerm) ||
          production.projet_name.toLowerCase().includes(searchTerm);

        const matchesVoiture = !filters.filterVoiture || production.voiture === parseInt(filters.filterVoiture);
        const matchesProjet = !filters.filterProjet || production.projet === parseInt(filters.filterProjet);
        const matchesDateDebut = !filters.dateDebut || production.date >= new Date(filters.dateDebut);
        const matchesDateFin = !filters.dateFin || production.date <= new Date(filters.dateFin + 'T23:59:59');

        return matchesSearch && matchesVoiture && matchesProjet && matchesDateDebut && matchesDateFin;
      });

      filteredProductions.forEach(prod => {
        const date = new Date(prod.date);
        let cle;
        
        const voitureId = prod.voiture;
        const voitureMatricule = prod.voiture_info?.matricule || 'Inconnu';
        
        if (periode === 'hebdomadaire') {
          const onejan = new Date(date.getFullYear(), 0, 1);
          const weekNum = Math.ceil((((date - onejan) / 86400000) + onejan.getDay() + 1) / 7);
          cle = `S${weekNum.toString().padStart(2, '0')}-${date.getFullYear()}|${voitureId}|${voitureMatricule}`;
        } else if (periode === 'mensuel') {
          const month = date.toLocaleString('fr-FR', { month: 'long' });
          cle = `${month} ${date.getFullYear()}|${voitureId}|${voitureMatricule}`;
        } else {
          cle = `${date.getFullYear()}|${voitureId}|${voitureMatricule}`;
        }

        if (!groupes[cle]) {
          groupes[cle] = {
            periode: cle.split('|')[0],
            voiture_id: voitureId,
            voiture_matricule: voitureMatricule,
            distance: 0,
            v_enrobe: 0,
            v_tout_venant: 0,
            v_gravier_roche: 0,
            autre: 0,
            count: 0
          };
        }

        groupes[cle].distance += prod.distance || 0;
        groupes[cle].v_enrobe += parseFloat(prod.voyage_enrobe) || 0;
        groupes[cle].v_tout_venant += parseFloat(prod.voyage_tout_venant) || 0;
        groupes[cle].v_gravier_roche += parseFloat(prod.voyage_gravier_roche) || 0;
        groupes[cle].autre += parseFloat(prod.autre) || 0;
        groupes[cle].count += 1;
      });

      return Object.values(groupes).sort((a, b) => b.distance - a.distance);
    };

    setCumuls({
      hebdomadaire: grouperParPeriode('hebdomadaire'),
      mensuel: grouperParPeriode('mensuel'),
      annuel: grouperParPeriode('annuel')
    });
  }, [productions, filters]);

  // Toggle between tables
  const toggleTables = () => {
    setShowMainTable(!showMainTable);
    setShowCumulsTable(!showCumulsTable);
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      filterVoiture: '',
      filterProjet: '',
      dateDebut: '',
      dateFin: ''
    });
  };

  // Form handling
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        ...formData,
        compteur_debut: parseInt(formData.compteur_debut),
        compteur_fin: parseInt(formData.compteur_fin),
        projet: formData.projet || null
      };

      if (editingId) {
        const response = await axios.put(
          `http://localhost:8000/api/chauffeurs/${editingId}/`,
          payload
        );
        setProductions(productions.map(v => v.id === editingId ? response.data : v));
        setSuccess('Production modifiée avec succès');
      } else {
        const response = await axios.post(
          'http://localhost:8000/api/chauffeurs/',
          payload
        );
        setProductions([...productions, response.data]);
        setSuccess('Production ajoutée avec succès');
      }

      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.detail || 
              err.response?.data?.message || 
              err.message || 
              'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Edit handler
  const handleEdit = (production) => {
    setFormData({
      ...production,
      voiture: production.voiture,
      projet: production.projet
    });
    setEditingId(production.id);
    setShowModal(true);
  };

  // Delete handler
  const handleDelete = async (id) => {
    if (window.confirm('Confirmez la suppression ?')) {
      setLoading(true);
      try {
        await axios.delete(`http://localhost:8000/api/chauffeurs/${id}/`);
        setProductions(productions.filter(v => v.id !== id));
        setSuccess('Production supprimée avec succès');
      } catch (err) {
        setError(err.response?.data?.detail || 'Erreur de suppression');
      } finally {
        setLoading(false);
      }
    }
  };

  // Export cumuls to CSV
  const exporterCumuls = () => {
    const data = cumuls[periodeActive];
    if (data.length === 0) {
      setError('Aucune donnée à exporter');
      return;
    }

    const headers = ['Période', 'Véhicule', 'Distance (km)', 'V.Enrobé', 'V.Tout-Venant', 'V.Gravier/Roche', 'Autre', 'Nb. Entrées'];
    const csvRows = [
      headers.join(','),
      ...data.map(item => [
        item.periode,
        item.voiture_matricule,
        item.distance.toFixed(2),
        item.v_enrobe.toFixed(2),
        item.v_tout_venant.toFixed(2),
        item.v_gravier_roche.toFixed(2),
        item.autre.toFixed(2),
        item.count
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cumuls_production_${periodeActive}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Cumuls table component
  const CumulsTable = () => (
    <Card className="mb-4 shadow-sm">
      <Card.Header className="bg-info text-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <FaTachometerAlt className="me-2" />
          Cumuls par Période et par Véhicule
        </h5>
        <div>
          <Button 
            variant="light" 
            size="sm" 
            className="me-2"
            onClick={exporterCumuls}
          >
            <FaFileExport className="me-1" /> Exporter
          </Button>
          <Button
            variant={periodeActive === 'hebdomadaire' ? 'light' : 'outline-light'}
            size="sm"
            className="me-2"
            onClick={() => setPeriodeActive('hebdomadaire')}
          >
            Hebdo
          </Button>
          <Button
            variant={periodeActive === 'mensuel' ? 'light' : 'outline-light'}
            size="sm"
            className="me-2"
            onClick={() => setPeriodeActive('mensuel')}
          >
            Mensuel
          </Button>
          <Button
            variant={periodeActive === 'annuel' ? 'light' : 'outline-light'}
            size="sm"
            onClick={() => setPeriodeActive('annuel')}
          >
            Annuel
          </Button>
          <Button
            variant="light"
            size="sm"
            onClick={toggleTables}
            className="ms-2"
          >
            <FaTimes />
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>#</th>
                <th>Période</th>
                <th>Véhicule</th>
                <th>Distance (km)</th>
                <th>V.Enrobé</th>
                <th>V.Tout-Venant</th>
                <th>V.Gravier/Roche</th>
                <th>Autre</th>
                <th>Nb. Entrées</th>
              </tr>
            </thead>
            <tbody>
              {cumuls[periodeActive]?.length > 0 ? (
                cumuls[periodeActive].map((cumul, index) => {
                  const isTop5 = index < 5;
                  return (
                    <tr 
                      key={index} 
                      style={isTop5 ? { backgroundColor: '#e8f5e9' } : {}}
                    >
                      <td>
                        {isTop5 && (
                          <Badge bg="success" className="me-1">
                            {index + 1}
                          </Badge>
                        )}
                      </td>
                      <td>{cumul.periode}</td>
                      <td>{cumul.voiture_matricule}</td>
                      <td style={{ fontWeight: isTop5 ? 'bold' : 'normal' }}>
                        {cumul.distance.toFixed(2)}
                      </td>
                      <td>{cumul.v_enrobe.toFixed(2)}</td>
                      <td>{cumul.v_tout_venant.toFixed(2)}</td>
                      <td>{cumul.v_gravier_roche.toFixed(2)}</td>
                      <td>{cumul.autre.toFixed(2)}</td>
                      <td>{cumul.count}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="text-center py-3">
                    Aucune donnée disponible
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card.Body>
    </Card>
  );

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">Gestion des Productions</h2>

      {/* Status alerts */}
      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}

      {/* Bouton pour basculer entre les tableaux */}
      <div className="d-flex justify-content-center mb-3">
        <Button 
          variant="info" 
          onClick={toggleTables}
          className="me-2"
        >
          {showCumulsTable ? 'Afficher le tableau principal' : 'Afficher les cumuls'}
        </Button>
      </div>

      {/* Cumuls table - conditionnel */}
      {showCumulsTable && <CumulsTable />}

      {/* Filter card - conditionnel */}
      {showMainTable && (
        <Card className="mb-3 shadow-sm">
          <Card.Header className="bg-primary d-flex justify-content-between align-items-center">
            <h5 className="mb-0 text-white">
              <FaFilter className="me-2" /> Rechercher
            </h5>
            <Button variant="light" size="sm" onClick={resetFilters}>
              <FaTimes className="me-1" /> Réinitialiser
            </Button>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Recherche globale</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <FaSearch />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Matricule, type ou projet..."
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
                    {voitures.map(voiture => (
                      <option key={voiture.id} value={voiture.id}>
                        {voiture.matricule}
                      </option>
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
                    {projets.map(projet => (
                      <option key={projet.id} value={projet.id}>
                        {projet.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={2}>
                <Form.Group>
                  <Form.Label>Date début</Form.Label>
                  <Form.Control
                    type="date"
                    name="dateDebut"
                    value={filters.dateDebut}
                    onChange={handleFilterChange}
                    max={filters.dateFin || undefined}
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label>Date fin</Form.Label>
                  <Form.Control
                    type="date"
                    name="dateFin"
                    value={filters.dateFin}
                    onChange={handleFilterChange}
                    min={filters.dateDebut || undefined}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Main table - conditionnel */}
      {showMainTable && (
        loading ? (
          <div className="text-center">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : (
          <div className="table-responsive">
            <Table striped bordered hover className="mt-3">
              <thead className="table-dark">
                <tr>
                  <th>Type Equip</th>
                  <th>N°ATTM</th>
                  <th>Projet</th>
                  <th>Date</th>
                  <th>CompDébut</th>
                  <th>CompFin</th>
                  <th>Distance</th>
                  <th>V.Enrobe</th>
                  <th>V.Tout-Vennant</th>
                  <th>V.Gravier/Roche</th>
                  <th>Autre</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProductions.length > 0 ? (
                  filteredProductions.map(production => (
                    <tr key={production.id}>
                      <td>{production.voiture_info?.type_voiture || 'N/A'}</td>
                      <td>{production.voiture_info?.matricule || 'N/A'}</td>
                      <td>{production.projet_name}</td> 
                      <td>
                        {production.date instanceof Date && !isNaN(production.date)
                          ? production.date.toLocaleDateString('fr-FR')
                          : 'Date invalide'}
                      </td>
                      <td>{production.compteur_debut} km</td>
                      <td>{production.compteur_fin} km</td>
                      <td>
                        <Badge bg="info">
                          {production.distance.toFixed(2)} km
                        </Badge>
                      </td>
                      <td>{production.voyage_enrobe || '-'}</td>
                      <td>{production.voyage_tout_venant || '-'}</td>
                      <td>{production.voyage_gravier_roche || '-'}</td>
                      <td>{production.autre || '-'}</td>
                      <td>
                        <Button
                          variant="outline-warning"
                          size="sm"
                          className="me-2"
                          onClick={() => handleEdit(production)}
                          title="Modifier"
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(production.id)}
                          title="Supprimer"
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="12" className="text-center py-4">
                      {productions.length === 0 ? 
                        'Aucune production enregistrée' : 
                        'Aucune production ne correspond aux critères de filtrage'}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        )
      )}

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingId ? 'Modifier' : 'Ajouter'} une Production</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Véhicule</Form.Label>
                  <Form.Select
                    name="voiture"
                    value={formData.voiture || ''}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Sélectionner un véhicule</option>
                    {voitures.map(voiture => (
                      <option key={voiture.id} value={voiture.id}>
                        {voiture.matricule} - {voiture.type_voiture}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Projet</Form.Label>
                  <Form.Select
                    name="projet"
                    value={formData.projet || ''}
                    onChange={handleChange}
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
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="date"
                    value={formData.date ? formData.date.toISOString().split('T')[0] : ''}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Comp Début</Form.Label>
                  <Form.Control
                    type="number"
                    name="compteur_debut"
                    value={formData.compteur_debut || ''}
                    onChange={handleChange}
                    required
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Comp Fin</Form.Label>
                  <Form.Control
                    type="number"
                    name="compteur_fin"
                    value={formData.compteur_fin || ''}
                    onChange={handleChange}
                    required
                    min={formData.compteur_debut || 0}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>V.Enrobé</Form.Label>
                  <Form.Control
                    type="number"
                    name="voyage_enrobe"
                    value={formData.voyage_enrobe || ''}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>V.Tout-Venant</Form.Label>
                  <Form.Control
                    type="number"
                    name="voyage_tout_venant"
                    value={formData.voyage_tout_venant || ''}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Volume Gravier/Roche</Form.Label>
                  <Form.Control
                    type="number"
                    name="voyage_gravier_roche"
                    value={formData.voyage_gravier_roche || ''}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Autre Volume</Form.Label>
                  <Form.Control
                    type="number"
                    name="autre"
                    value={formData.autre || ''}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Remarques</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="remarques"
                value={formData.remarques || ''}
                onChange={handleChange}
              />
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowModal(false)}>
                Annuler
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer'
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default GestionProduction;
