import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Form, 
  Button, 
  Alert, 
  Spinner, 
  Pagination, 
  Container, 
  Row, 
  Col, 
  Card,
  Badge,
  Stack,
  Modal
} from 'react-bootstrap';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api/consommations/';
const PROJETS_URL = 'http://localhost:8000/api/projets/';

const GasoilTracker = () => {
  const [state, setState] = useState({
    consommations: [],
    projets: [],
    loading: true,
    error: null,
    success: null,
    formData: {
      id: null,
      projet: '',
      date_consommation: new Date().toISOString().split('T')[0],
      consommation_jour: '',
      remarques: ''
    },
    filters: {
      projet: '',
      date_debut: '',
      date_fin: '',
      min_consommation: '',
      max_consommation: ''
    },
    pagination: {
      count: 0,
      page: 1
    },
    showFilters: false,
    showAddModal: false,
    showDeleteModal: false,
    itemToDelete: null
  });

  const projetsDict = state.projets.reduce((acc, projet) => {
    acc[projet.id] = projet.name;
    return acc;
  }, {});

  const buildQueryString = () => {
    const { page } = state.pagination;
    const { projet, date_debut, date_fin, min_consommation, max_consommation } = state.filters;
    
    let query = `page=${page}`;
    
    if (projet) query += `&projet=${projet}`;
    if (date_debut) query += `&date_debut=${date_debut}`;
    if (date_fin) query += `&date_fin=${date_fin}`;
    if (min_consommation) query += `&min_consommation=${min_consommation}`;
    if (max_consommation) query += `&max_consommation=${max_consommation}`;
    
    return query;
  };

  const fetchData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null, success: null }));

      const queryString = buildQueryString();
      const [projetsRes, consommationsRes] = await Promise.all([
        axios.get(PROJETS_URL),
        axios.get(`${API_URL}?${queryString}`)
      ]);

      setState(prev => ({
        ...prev,
        consommations: consommationsRes.data.results,
        projets: projetsRes.data,
        loading: false,
        pagination: {
          ...prev.pagination,
          count: consommationsRes.data.count
        }
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.response?.data?.error || 'Erreur de chargement'
      }));
    }
  };

  useEffect(() => {
    fetchData();
  }, [state.pagination.page, state.filters]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { projet, date_consommation, consommation_jour } = state.formData;
    if (!projet || !date_consommation || !consommation_jour) {
      setState(prev => ({
        ...prev,
        error: "Tous les champs obligatoires doivent être remplis",
        success: null
      }));
      return;
    }

    try {
      const formData = {
        projet: parseInt(projet),
        date_consommation,
        consommation_jour: parseFloat(consommation_jour),
        remarques: state.formData.remarques || null
      };

      if (state.formData.id) {
        // Modification
        await axios.put(`${API_URL}${state.formData.id}/`, formData, {
          headers: { 'Content-Type': 'application/json' }
        });
        setState(prev => ({
          ...prev,
          success: "Consommation modifiée avec succès",
        }));
      } else {
        // Ajout
        await axios.post(API_URL, formData, {
          headers: { 'Content-Type': 'application/json' }
        });
        setState(prev => ({
          ...prev,
          success: "Consommation ajoutée avec succès",
        }));
      }

      setState(prev => ({
        ...prev,
        formData: {
          id: null,
          projet: '',
          date_consommation: new Date().toISOString().split('T')[0],
          consommation_jour: '',
          remarques: ''
        },
        error: null,
        showAddModal: false
      }));

      fetchData();
    } catch (error) {
      const errMsg =
        error.response?.data?.non_field_errors?.[0] ||
        error.response?.data?.detail ||
        "Erreur lors de la communication avec le serveur";
      setState(prev => ({
        ...prev,
        error: errMsg,
        success: null
      }));
    }
  };

  const handleEdit = (item) => {
    setState(prev => ({
      ...prev,
      formData: {
        id: item.id,
        projet: item.projet,
        date_consommation: item.date_consommation,
        consommation_jour: item.consommation_jour,
        remarques: item.remarques || ''
      },
      showAddModal: true
    }));
  };

  const handleDeleteClick = (item) => {
    setState(prev => ({
      ...prev,
      itemToDelete: item,
      showDeleteModal: true
    }));
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`${API_URL}${state.itemToDelete.id}/`);
      setState(prev => ({
        ...prev,
        success: "Consommation supprimée avec succès",
        error: null,
        showDeleteModal: false,
        itemToDelete: null
      }));
      fetchData();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: "Erreur lors de la suppression",
        success: null
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [name]: value
      }
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [name]: value
      },
      pagination: {
        ...prev.pagination,
        page: 1
      }
    }));
  };

  const resetFilters = () => {
    setState(prev => ({
      ...prev,
      filters: {
        projet: '',
        date_debut: '',
        date_fin: '',
        min_consommation: '',
        max_consommation: ''
      },
      pagination: {
        ...prev.pagination,
        page: 1
      }
    }));
  };

  const handlePageChange = (page) => {
    setState(prev => ({
      ...prev,
      pagination: {
        ...prev.pagination,
        page
      }
    }));
  };

  const toggleFilters = () => {
    setState(prev => ({
      ...prev,
      showFilters: !prev.showFilters
    }));
  };

  const toggleAddModal = () => {
    setState(prev => ({
      ...prev,
      showAddModal: !prev.showAddModal,
      formData: {
        ...prev.formData,
        id: null,
        projet: '',
        date_consommation: new Date().toISOString().split('T')[0],
        consommation_jour: '',
        remarques: ''
      }
    }));
  };

  if (state.loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="text-center">
            <Badge bg="primary">Suivi des Consommations de Gasoil</Badge>
          </h2>
        </Col>
      </Row>

      {/* Alertes */}
      <Row className="mb-3">
        <Col>
          {state.error && (
            <Alert variant="danger" onClose={() => setState(prev => ({ ...prev, error: null }))} dismissible>
              <Alert.Heading>Erreur</Alert.Heading>
              <p>{state.error}</p>
            </Alert>
          )}
          {state.success && (
            <Alert variant="success" onClose={() => setState(prev => ({ ...prev, success: null }))} dismissible>
              <Alert.Heading>Succès</Alert.Heading>
              <p>{state.success}</p>
            </Alert>
          )}
        </Col>
      </Row>

      {/* Bouton Ajouter une consommation */}
      <Row className="mb-3">
        <Col>
          <Button variant="primary" onClick={toggleAddModal}>
            <i className="bi bi-plus-circle me-2"></i>
            Ajouter une consommation
          </Button>
        </Col>
      </Row>

      {/* Modal pour ajouter/modifier une consommation */}
      <Modal show={state.showAddModal} onHide={toggleAddModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {state.formData.id ? 'Modifier une consommation' : 'Ajouter une consommation'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Projet</Form.Label>
              <Form.Select
                name="projet"
                value={state.formData.projet}
                onChange={handleChange}
                required
              >
                <option value="">Sélectionnez un projet</option>
                {state.projets.map(projet => (
                  <option key={projet.id} value={projet.id}>{projet.name}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                name="date_consommation"
                value={state.formData.date_consommation}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Consommation (L)</Form.Label>
              <Form.Control
                type="number"
                name="consommation_jour"
                min="0"
                step="0.01"
                value={state.formData.consommation_jour}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Remarques</Form.Label>
              <Form.Control
                as="textarea"
                name="remarques"
                value={state.formData.remarques}
                onChange={handleChange}
                placeholder="Facultatif"
              />
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button variant="secondary" onClick={toggleAddModal} className="me-2">
                Annuler
              </Button>
              <Button variant="primary" type="submit" disabled={state.loading}>
                {state.loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                    <span className="ms-2">Enregistrement...</span>
                  </>
                ) : state.formData.id ? 'Modifier' : 'Enregistrer'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Modal de confirmation de suppression */}
      <Modal show={state.showDeleteModal} onHide={() => setState(prev => ({ ...prev, showDeleteModal: false }))}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmer la suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Êtes-vous sûr de vouloir supprimer la consommation du {state.itemToDelete && new Date(state.itemToDelete.date_consommation).toLocaleDateString()} ?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setState(prev => ({ ...prev, showDeleteModal: false }))}>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            Supprimer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Filtres */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <Button 
                variant="link" 
                onClick={toggleFilters}
                className="w-100 text-start text-decoration-none"
              >
                <Stack direction="horizontal" gap={2}>
                  <i className={`bi bi-funnel${state.showFilters ? '-fill' : ''}`}></i>
                  <span>Filtrer les résultats</span>
                  {Object.values(state.filters).some(val => val !== '') && (
                    <Badge bg="info" className="ms-auto">Filtres actifs</Badge>
                  )}
                </Stack>
              </Button>
            </Card.Header>
            {state.showFilters && (
              <Card.Body>
                <Form>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Projet</Form.Label>
                        <Form.Select
                          name="projet"
                          value={state.filters.projet}
                          onChange={handleFilterChange}
                        >
                          <option value="">Tous les projets</option>
                          {state.projets.map(projet => (
                            <option key={projet.id} value={projet.id}>{projet.name}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Plage de dates</Form.Label>
                        <Stack direction="horizontal" gap={3}>
                          <Form.Control
                            type="date"
                            name="date_debut"
                            value={state.filters.date_debut}
                            onChange={handleFilterChange}
                            placeholder="Date début"
                          />
                          <span>à</span>
                          <Form.Control
                            type="date"
                            name="date_fin"
                            value={state.filters.date_fin}
                            onChange={handleFilterChange}
                            placeholder="Date fin"
                          />
                        </Stack>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Consommation minimale (L)</Form.Label>
                        <Form.Control
                          type="number"
                          name="min_consommation"
                          min="0"
                          step="0.01"
                          value={state.filters.min_consommation}
                          onChange={handleFilterChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Consommation maximale (L)</Form.Label>
                        <Form.Control
                          type="number"
                          name="max_consommation"
                          min="0"
                          step="0.01"
                          value={state.filters.max_consommation}
                          onChange={handleFilterChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Stack direction="horizontal" gap={3}>
                    <Button 
                      variant="outline-secondary" 
                      onClick={resetFilters}
                      disabled={state.loading}
                    >
                      Réinitialiser
                    </Button>
                  </Stack>
                </Form>
              </Card.Body>
            )}
          </Card>
        </Col>
      </Row>

      {/* Tableau des consommations */}
      <Row className="mb-3">
        <Col>
          <Card>
            <Card.Header as="h5">
              <Stack direction="horizontal" gap={2}>
                <span>Historique des consommations</span>
                {state.pagination.count > 0 && (
                  <Badge bg="secondary" className="ms-auto">
                    {state.pagination.count} résultat{state.pagination.count !== 1 ? 's' : ''}
                  </Badge>
                )}
              </Stack>
            </Card.Header>
            <Card.Body className="table-responsive">
              <Table striped bordered hover className="mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>Date</th>
                    <th>Projet</th>
                    <th>Consommation (L)</th>
                    <th>Cumul Mensuel</th>
                    <th>Cumul Annuel</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {state.consommations.length > 0 ? (
                    state.consommations.map(item => (
                      <tr key={item.id}>
                        <td>{new Date(item.date_consommation).toLocaleDateString()}</td>
                        <td>
                          {item.projet_object?.name ||
                            item.projet_nom ||
                            projetsDict[item.projet] ||
                            'Projet'}
                        </td>
                        <td className="text-end">{item.consommation_jour.toFixed(2)}</td>
                        <td className="text-end">{item.cumul_mensuel?.toFixed(2)}</td>
                        <td className="text-end">{item.cumul_annuel?.toFixed(2)}</td>
                        <td>
                          <Stack direction="horizontal" gap={2} className="justify-content-center">
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => handleEdit(item)}
                              title="Modifier"
                            >
                              <i className="bi bi-pencil"></i>
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => handleDeleteClick(item)}
                              title="Supprimer"
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          </Stack>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center text-muted">
                        Aucune donnée disponible
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

    
    </Container>
  );
};

export default GasoilTracker;