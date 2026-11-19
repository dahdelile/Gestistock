import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Modal, Button, Form, Spinner, Alert, 
  Badge, Table, InputGroup, Card, Row, Col 
} from 'react-bootstrap';
import { FaEdit, FaTrash, FaSearch, FaFilter, FaTimes } from 'react-icons/fa';

const GestionVidanges = () => {
  // Main state
  const [vidanges, setVidanges] = useState([]);
  const [voitures, setVoitures] = useState([]);
  const [projets, setProjets] = useState([]);
  const [formData, setFormData] = useState({
    voiture: '',
    date_visite: '',
    type_vidange: 'VIDANGE_SIMPLE',
    compteur_visite: '',
    compteur_actuel: '',
    projet: ''
  });

  // Filter state
  const [filters, setFilters] = useState({
    searchTerm: '',
    filterVoiture: '',
    filterProjet: '',
    filterType: '',
    dateDebut: '',
    dateFin: ''
  });

  // UI state
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [voituresRes, projetsRes, vidangesRes] = await Promise.all([
          axios.get('http://localhost:8000/api/voitures/'),
          axios.get('http://localhost:8000/api/projets/'),
          axios.get('http://localhost:8000/api/vidanges/')
        ]);

        // Create lookup maps
        const projetsMap = new Map(projetsRes.data.map(p => [p.id, p]));
        const voituresMap = new Map(voituresRes.data.map(v => [v.id, v]));

        // Enhance maintenance records with related data
        const enhancedVidanges = vidangesRes.data.map(vidange => ({
          ...vidange,
          voiture_info: voituresMap.get(vidange.voiture) || null,
          projet_info: projetsMap.get(vidange.projet) || null,
          projet_name: projetsMap.get(vidange.projet)?.name || 'Non attribué',
          date_visite_obj: new Date(vidange.date_visite)
        }));

        setVoitures(voituresRes.data);
        setProjets(projetsRes.data);
        setVidanges(enhancedVidanges);
      } catch (err) {
        setError('Erreur de chargement des données');
        console.error('Loading error:', err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Apply filters
  const filteredVidanges = vidanges.filter(vidange => {
    // Text search
    const searchTerm = filters.searchTerm.toLowerCase();
    const matchesSearch = 
      vidange.voiture_info?.matricule?.toLowerCase().includes(searchTerm) ||
      vidange.voiture_info?.type_voiture?.toLowerCase().includes(searchTerm) ||
      vidange.projet_name.toLowerCase().includes(searchTerm);

    // Dropdown filters
    const matchesVoiture = !filters.filterVoiture || vidange.voiture === parseInt(filters.filterVoiture);
    const matchesProjet = !filters.filterProjet || vidange.projet === parseInt(filters.filterProjet);
    const matchesType = !filters.filterType || vidange.type_vidange === filters.filterType;

    // Date range filter
    const matchesDateDebut = !filters.dateDebut || vidange.date_visite_obj >= new Date(filters.dateDebut);
    const matchesDateFin = !filters.dateFin || vidange.date_visite_obj <= new Date(filters.dateFin + 'T23:59:59');

    return (
      matchesSearch &&
      matchesVoiture &&
      matchesProjet &&
      matchesType &&
      matchesDateDebut &&
      matchesDateFin
    );
  });

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
      filterType: '',
      dateDebut: '',
      dateFin: ''
    });
  };

  // Form handling (unchanged from your original code)
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
        compteur_visite: parseInt(formData.compteur_visite),
        compteur_actuel: parseInt(formData.compteur_actuel || formData.compteur_visite),
        projet: formData.projet || null
      };

      if (editingId) {
        const response = await axios.put(
          `http://localhost:8000/api/vidanges/${editingId}/`,
          payload
        );
        setVidanges(vidanges.map(v => v.id === editingId ? response.data : v));
        setSuccess('Vidange modifiée avec succès');
      } else {
        const response = await axios.post(
          'http://localhost:8000/api/vidanges/',
          payload
        );
        setVidanges([...vidanges, response.data]);
        setSuccess('Vidange ajoutée avec succès');
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

  // Edit and Delete handlers (unchanged)
  const handleEdit = (vidange) => {
    setFormData({
      voiture: vidange.voiture,
      date_visite: vidange.date_visite.split('T')[0],
      type_vidange: vidange.type_vidange,
      compteur_visite: vidange.compteur_visite,
      compteur_actuel: vidange.compteur_actuel,
      projet: vidange.projet || ''
    });
    setEditingId(vidange.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Confirmez la suppression ?')) {
      setLoading(true);
      try {
        await axios.delete(`http://localhost:8000/api/vidanges/${id}/`);
        setVidanges(vidanges.filter(v => v.id !== id));
        setSuccess('Vidange supprimée avec succès');
      } catch (err) {
        setError(err.response?.data?.detail || 'Erreur de suppression');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">Gestion des Vidanges</h2>

      {/* Status alerts */}
      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}

      {/* Filter card */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-light d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <FaFilter className="me-2" /> Filtres
          </h5>
          <Button 
            variant="link" 
            onClick={resetFilters}
            title="Réinitialiser tous les filtres"
          >
            <FaTimes />
          </Button>
        </Card.Header>
        <Card.Body>
          <Row>
            {/* Global search */}
            <Col md={4}>
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

            {/* Vehicle filter */}
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

            {/* Project filter */}
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

            {/* Maintenance type filter */}
            <Col md={2}>
              <Form.Group>
                <Form.Label>Type</Form.Label>
                <Form.Select
                  name="filterType"
                  value={filters.filterType}
                  onChange={handleFilterChange}
                >
                  <option value="">Tous</option>
                  <option value="VIDANGE_SIMPLE">Simple</option>
                  <option value="VIDANGE_COMPLET">Complète</option>
                </Form.Select>
              </Form.Group>
            </Col>

        
            
          </Row>

          {/* Date range filters */}
          <Row className="mt-3">
            <Col md={3}>
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
            <Col md={3}>
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

      {/* Main table */}
      {loading ? (
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <div className="table-responsive">
          <Table striped bordered hover className="mt-3">
            <thead className="table-dark">
              <tr>
                <th>Type Equipement</th>
                <th>Matricule</th>
                <th>Type Vidange</th>
                <th>Projet</th>
                <th>Date visite</th>
                <th>Compteur (km)</th>
                <th>Compteur actuel (km)</th>
                <th>Prochaine visite (km)</th>
                <th>HMR restantes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVidanges.length > 0 ? (
                filteredVidanges.map(vidange => (
                  <tr key={vidange.id}>
                    <td>{vidange.voiture_info?.type_voiture || 'N/A'}</td>
                    <td>{vidange.voiture_info?.matricule || 'N/A'}</td>
                    <td>
                      <Badge bg={vidange.type_vidange === 'VIDANGE_SIMPLE' ? 'warning' : 'danger'}>
                        {vidange.type_vidange === 'VIDANGE_SIMPLE' ? 'Simple' : 'Complète'}
                      </Badge>
                    </td>
                    <td>{vidange.projet_name}</td>
                    <td>{vidange.date_visite_obj.toLocaleDateString('fr-FR')}</td>
                    <td>{vidange.compteur_visite}</td>
                    <td>{vidange.compteur_actuel || vidange.compteur_visite}</td>
                    <td>{vidange.prochaine_visite}</td>
                    <td>
                      <Badge bg={vidange.heur_restant < 500 ? 'danger' : vidange.heur_restant < 1000 ? 'warning' : 'success'}>
                        {vidange.heur_restant}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        variant="outline-warning"
                        size="sm"
                        className="me-2"
                        onClick={() => handleEdit(vidange)}
                        title="Modifier"
                      >
                        <FaEdit />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(vidange.id)}
                        title="Supprimer"
                      >
                        <FaTrash />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="text-center py-4">
                    {vidanges.length === 0 ? 
                      'Aucune vidange enregistrée' : 
                      'Aucune vidange ne correspond aux critères de filtrage'}
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingId ? 'Modifier' : 'Ajouter'} une vidange</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="formVoiture">
                  <Form.Label>Véhicule *</Form.Label>
                  <Form.Select
                    name="voiture"
                    value={formData.voiture}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Sélectionner une voiture</option>
                    {voitures.map(voiture => (
                      <option key={voiture.id} value={voiture.id}>
                        {voiture.matricule} ({voiture.type_voiture})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="formDate">
                  <Form.Label>Date de visite *</Form.Label>
                  <Form.Control
                    type="date"
                    name="date_visite"
                    value={formData.date_visite}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="formType">
                  <Form.Label>Type de vidange</Form.Label>
                  <Form.Select
                    name="type_vidange"
                    value={formData.type_vidange}
                    onChange={handleChange}
                  >
                    <option value="VIDANGE_SIMPLE">Simple</option>
                    <option value="VIDANGE_COMPLET">Complète</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="formProjet">
                  <Form.Label>Projet</Form.Label>
                  <Form.Select
                    name="projet"
                    value={formData.projet}
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

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="formCompteurVisite">
                  <Form.Label>Compteur visite (km) *</Form.Label>
                  <Form.Control
                    type="number"
                    name="compteur_visite"
                    value={formData.compteur_visite}
                    onChange={handleChange}
                    required
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="formCompteurActuel">
                  <Form.Label>Compteur actuel (km)</Form.Label>
                  <Form.Control
                    type="number"
                    name="compteur_actuel"
                    value={formData.compteur_actuel}
                    onChange={handleChange}
                    min="0"
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end mt-4">
              <Button 
                variant="secondary" 
                className="me-2" 
                onClick={() => setShowModal(false)}
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
                    <Spinner as="span" size="sm" animation="border" className="me-2" />
                    Enregistrement...
                  </>
                ) : 'Enregistrer'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default GestionVidanges;