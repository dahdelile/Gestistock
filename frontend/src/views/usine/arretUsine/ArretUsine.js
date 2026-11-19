import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Modal, Button, Form, Spinner, Alert, Table, Card, Row, Col, Badge, Pagination } from "react-bootstrap";
import { FaEdit, FaTrash, FaEye, FaPlus } from "react-icons/fa";

// 🔹 Modal pour ajouter un arrêt d'usine
const AddArretModal = ({ 
  show, 
  onHide, 
  onSubmit, 
  loading, 
  newArret, 
  setNewArret, 
  usines, 
  projets, 
  codesPanne 
}) => (
  <Modal show={show} onHide={onHide} size="lg">
    <Modal.Header closeButton>
      <Modal.Title>Ajouter un arrêt d'usine</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <Form>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Usine *</Form.Label>
              <Form.Select
                value={newArret.usine || ""}
                onChange={(e) => setNewArret({ ...newArret, usine: e.target.value })}
                required
              >
                <option value="">Sélectionner une usine</option>
                {usines.map((usine) => (
                  <option key={usine.id} value={usine.id}>
                    {usine.matricule} - {usine.categorie}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Projet</Form.Label>
              <Form.Select
                value={newArret.projet || ""}
                onChange={(e) => setNewArret({ ...newArret, projet: e.target.value || null })}
              >
                <option value="">Aucun projet</option>
                {projets.map((projet) => (
                  <option key={projet.id} value={projet.id}>
                    {projet.name} - {projet.status}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Code Panne</Form.Label>
              <Form.Select
                value={newArret.code_panne || ""}
                onChange={(e) => setNewArret({ ...newArret, code_panne: e.target.value || null })}
              >
                <option value="">Aucun code panne</option>
                {codesPanne.map((code) => (
                  <option key={code.id} value={code.id}>
                    {code.code} - {code.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Intervenant</Form.Label>
              <Form.Control
                type="text"
                value={newArret.intervenant || ""}
                onChange={(e) => setNewArret({ ...newArret, intervenant: e.target.value })}
                placeholder="Nom de l'intervenant"
              />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Date et heure de panne *</Form.Label>
              <Form.Control
                type="datetime-local"
                value={newArret.date_panne}
                onChange={(e) => setNewArret({ ...newArret, date_panne: e.target.value })}
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Date et heure de réparation</Form.Label>
              <Form.Control
                type="datetime-local"
                value={newArret.date_reparation || ""}
                onChange={(e) => setNewArret({ ...newArret, date_reparation: e.target.value || null })}
              />
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-3">
          <Form.Label>Cause de la panne</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={newArret.cause_panne || ""}
            onChange={(e) => setNewArret({ ...newArret, cause_panne: e.target.value })}
            placeholder="Décrire la cause de la panne..."
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Travaux effectués</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={newArret.travaux_effectues || ""}
            onChange={(e) => setNewArret({ ...newArret, travaux_effectues: e.target.value })}
            placeholder="Décrire les travaux effectués..."
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Observations</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            value={newArret.observation || ""}
            onChange={(e) => setNewArret({ ...newArret, observation: e.target.value })}
            placeholder="Observations supplémentaires..."
          />
        </Form.Group>
      </Form>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={onHide} disabled={loading}>
        Annuler
      </Button>
      <Button variant="primary" onClick={onSubmit} disabled={loading}>
        {loading ? <Spinner animation="border" size="sm" /> : "Ajouter"}
      </Button>
    </Modal.Footer>
  </Modal>
);

// 🔹 Modal pour modifier un arrêt d'usine
const EditArretModal = ({ 
  show, 
  onHide, 
  onSubmit, 
  loading, 
  editingArret, 
  setEditingArret, 
  usines, 
  projets, 
  codesPanne 
}) => (
  <Modal show={show} onHide={onHide} size="lg">
    <Modal.Header closeButton>
      <Modal.Title>Modifier l'arrêt d'usine</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <Form>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Usine *</Form.Label>
              <Form.Select
                value={editingArret?.usine || ""}
                onChange={(e) => setEditingArret({ ...editingArret, usine: e.target.value })}
                required
              >
                <option value="">Sélectionner une usine</option>
                {usines.map((usine) => (
                  <option key={usine.id} value={usine.id}>
                    {usine.matricule} - {usine.categorie}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Projet</Form.Label>
              <Form.Select
                value={editingArret?.projet || ""}
                onChange={(e) => setEditingArret({ ...editingArret, projet: e.target.value || null })}
              >
                <option value="">Aucun projet</option>
                {projets.map((projet) => (
                  <option key={projet.id} value={projet.id}>
                    {projet.name} - {projet.status}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Code Panne</Form.Label>
              <Form.Select
                value={editingArret?.code_panne || ""}
                onChange={(e) => setEditingArret({ ...editingArret, code_panne: e.target.value || null })}
              >
                <option value="">Aucun code panne</option>
                {codesPanne.map((code) => (
                  <option key={code.id} value={code.id}>
                    {code.code} - {code.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Intervenant</Form.Label>
              <Form.Control
                type="text"
                value={editingArret?.intervenant || ""}
                onChange={(e) => setEditingArret({ ...editingArret, intervenant: e.target.value })}
                placeholder="Nom de l'intervenant"
              />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Date et heure de panne *</Form.Label>
              <Form.Control
                type="datetime-local"
                value={editingArret?.date_panne ? editingArret.date_panne.slice(0, 16) : ""}
                onChange={(e) => setEditingArret({ ...editingArret, date_panne: e.target.value })}
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Date et heure de réparation</Form.Label>
              <Form.Control
                type="datetime-local"
                value={editingArret?.date_reparation ? editingArret.date_reparation.slice(0, 16) : ""}
                onChange={(e) => setEditingArret({ ...editingArret, date_reparation: e.target.value || null })}
              />
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-3">
          <Form.Label>Cause de la panne</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={editingArret?.cause_panne || ""}
            onChange={(e) => setEditingArret({ ...editingArret, cause_panne: e.target.value })}
            placeholder="Décrire la cause de la panne..."
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Travaux effectués</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={editingArret?.travaux_effectues || ""}
            onChange={(e) => setEditingArret({ ...editingArret, travaux_effectues: e.target.value })}
            placeholder="Décrire les travaux effectués..."
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Observations</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            value={editingArret?.observation || ""}
            onChange={(e) => setEditingArret({ ...editingArret, observation: e.target.value })}
            placeholder="Observations supplémentaires..."
          />
        </Form.Group>

        {/* Affichage des indicateurs calculés */}
        {(editingArret?.duree_panne || editingArret?.mtbf || editingArret?.tdm) && (
          <Card className="bg-light">
            <Card.Header>
              <strong>Indicateurs calculés</strong>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4}>
                  <strong>Durée panne:</strong> {editingArret.duree_panne ? `${editingArret.duree_panne}h` : 'N/A'}
                </Col>
                <Col md={4}>
                  <strong>MTBF:</strong> {editingArret.mtbf ? `${editingArret.mtbf}h` : 'N/A'}
                </Col>
                <Col md={4}>
                  <strong>TDM:</strong> {editingArret.tdm ? `${editingArret.tdm}%` : 'N/A'}
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}
      </Form>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={onHide} disabled={loading}>
        Annuler
      </Button>
      <Button variant="primary" onClick={onSubmit} disabled={loading}>
        {loading ? <Spinner animation="border" size="sm" /> : "Modifier"}
      </Button>
    </Modal.Footer>
  </Modal>
);

const GestionArretsUsine = () => {
  const [arrets, setArrets] = useState([]);
  const [usines, setUsines] = useState([]);
  const [projets, setProjets] = useState([]);
  const [codesPanne, setCodesPanne] = useState([]);
  const [newArret, setNewArret] = useState({ 
    usine: "",
    projet: null,
    code_panne: null,
    date_panne: "",
    date_reparation: null,
    cause_panne: "",
    travaux_effectues: "",
    intervenant: "",
    observation: ""
  });
  const [editingArret, setEditingArret] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [filters, setFilters] = useState({
    usine: '',
    projet: '',
    date_panne: '',
    date_reparation: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // URLs API
  const API_URL = "https://intranet-attm.com/api/arretUsines/";
  const USINES_API_URL = "https://intranet-attm.com/api/usines/";
  const PROJETS_API_URL = "https://intranet-attm.com/api/projets/";
  const CODES_PANNE_API_URL = "https://intranet-attm.com/api/pannes/";

  // Chargement des données
  const fetchArrets = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.usine) params.append('usine', filters.usine);
      if (filters.projet) params.append('projet', filters.projet);
      if (filters.date_panne) params.append('date_panne__gte', filters.date_panne);
      if (filters.date_reparation) params.append('date_panne__lte', filters.date_reparation);

      const response = await axios.get(`${API_URL}?${params}`);
      setArrets(response.data);
    } catch (err) {
      setError("Erreur lors du chargement des arrêts d'usine");
      console.error("Erreur détaillée:", err.response?.data);
    }
  }, [filters]);

  const fetchUsines = useCallback(async () => {
    try {
      const response = await axios.get(USINES_API_URL);
      setUsines(response.data);
    } catch (err) {
      console.error("Erreur lors du chargement des usines:", err.response?.data);
    }
  }, []);

  const fetchProjets = useCallback(async () => {
    try {
      const response = await axios.get(PROJETS_API_URL);
      setProjets(response.data);
    } catch (err) {
      console.error("Erreur lors du chargement des projets:", err.response?.data);
    }
  }, []);

  const fetchCodesPanne = useCallback(async () => {
    try {
      const response = await axios.get(CODES_PANNE_API_URL);
      setCodesPanne(response.data);
    } catch (err) {
      console.error("Erreur lors du chargement des codes panne:", err.response?.data);
    }
  }, []);

  useEffect(() => {
    fetchArrets();
    fetchUsines();
    fetchProjets();
    fetchCodesPanne();
  }, [fetchArrets, fetchUsines, fetchProjets, fetchCodesPanne]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setError(null);
      setSuccessMessage(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [error, successMessage]);

  // Gestion des arrêts
  const handleAddArret = async () => {
    if (!newArret.usine) {
      setError("L'usine est obligatoire !");
      return;
    }

    setLoading(true);
    try {
      const arretData = {
        usine: newArret.usine,
        date_panne: newArret.date_panne || new Date().toISOString().slice(0, 16),
        date_reparation: newArret.date_reparation || null,
        projet: newArret.projet || null,
        code_panne: newArret.code_panne || null,
        cause_panne: newArret.cause_panne || "",
        travaux_effectues: newArret.travaux_effectues || "",
        intervenant: newArret.intervenant || "",
        observation: newArret.observation || ""
      };

      console.log("Données envoyées à l'API:", arretData);

      const response = await axios.post(API_URL, arretData);
      
      setArrets(prev => [response.data, ...prev]);
      setNewArret({ 
        usine: "",
        projet: null,
        code_panne: null,
        date_panne: "",
        date_reparation: null,
        cause_panne: "",
        travaux_effectues: "",
        intervenant: "",
        observation: ""
      });
      setShowAddModal(false);
      setSuccessMessage("Arrêt d'usine ajouté avec succès !");
    } catch (err) {
      console.error("Erreur complète:", err);
      console.error("Réponse d'erreur:", err.response?.data);
      const errorMessage = err.response?.data 
        ? Object.values(err.response.data).flat().join(', ')
        : "Erreur lors de l'ajout de l'arrêt d'usine !";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditArret = (arret) => {
    setEditingArret(arret);
    setShowEditModal(true);
  };

  const handleUpdateArret = async () => {
    if (!editingArret.usine || !editingArret.date_panne) {
      setError("Usine et date de panne sont obligatoires !");
      return;
    }

    setLoading(true);
    try {
      const arretData = {
        ...editingArret,
        projet: editingArret.projet || null,
        code_panne: editingArret.code_panne || null,
        date_reparation: editingArret.date_reparation || null
      };

      const response = await axios.put(`${API_URL}${editingArret.id}/`, arretData);
      setArrets(prev => prev.map(a => a.id === editingArret.id ? response.data : a));
      setShowEditModal(false);
      setSuccessMessage("Arrêt d'usine modifié avec succès !");
    } catch (err) {
      const errorMessage = err.response?.data 
        ? Object.values(err.response.data).flat().join(', ')
        : "Erreur lors de la modification de l'arrêt d'usine !";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArret = async (arret) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'arrêt de l'usine ${getUsineInfo(arret.usine)} ?`)) return;
    
    setLoading(true);
    try {
      await axios.delete(`${API_URL}${arret.id}/`);
      setArrets(prev => prev.filter(a => a.id !== arret.id));
      setSuccessMessage("Arrêt d'usine supprimé avec succès !");
    } catch (err) {
      setError("Erreur lors de la suppression de l'arrêt d'usine !");
    } finally {
      setLoading(false);
    }
  };

  // Fonctions utilitaires
  const getUsineInfo = (usineId) => {
    if (!usineId) return "Non spécifiée";
    const usine = usines.find(u => u.id === usineId);
    return usine ? `${usine.matricule} - ${usine.categorie}` : `Usine #${usineId}`;
  };

  const getProjetInfo = (projetId) => {
    if (!projetId) return "Non spécifié";
    const projet = projets.find(p => p.id === projetId);
    return projet ? projet.name : `Projet #${projetId}`;
  };

  const getCodePanneInfo = (codePanneId) => {
    if (!codePanneId) return "Non spécifié";
    const code = codesPanne.find(c => c.id === codePanneId);
    return code ? `${code.code} - ${code.name}` : `Code #${codePanneId}`;
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDuration = (duree) => {
    if (!duree) return '-';
    return `${duree}h`;
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedArrets = arrets.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(arrets.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Filtrage des données
  const filteredArrets = arrets.filter(arret => {
    if (filters.usine && arret.usine != filters.usine) return false;
    if (filters.projet && arret.projet != filters.projet) return false;
    if (filters.date_panne && new Date(arret.date_panne) < new Date(filters.date_panne)) return false;
    if (filters.date_reparation && new Date(arret.date_panne) > new Date(filters.date_reparation)) return false;
    return true;
  });

  // Statistiques
  const stats = {
    total: arrets.length,
    en_cours: arrets.filter(a => !a.date_reparation).length,
    termines: arrets.filter(a => a.date_reparation).length,
    duree_totale: arrets.reduce((sum, a) => sum + (a.duree_panne || 0), 0)
  };

  return (
    <div className="container-fluid mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="mb-1">Gestion des Arrêts d'Usine</h3>
          <p className="text-muted mb-0">Suivi des pannes et maintenance des usines</p>
        </div>
        <Button variant="primary" onClick={() => setShowAddModal(true)}>
          <FaPlus className="me-2" /> Nouvel arrêt
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      {/* Filtres */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Filtres</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Usine</Form.Label>
                <Form.Select
                  value={filters.usine}
                  onChange={(e) => setFilters({ ...filters, usine: e.target.value })}
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
            <Col md={3}>
              <Form.Group>
                <Form.Label>Projet</Form.Label>
                <Form.Select
                  value={filters.projet}
                  onChange={(e) => setFilters({ ...filters, projet: e.target.value })}
                >
                  <option value="">Tous les projets</option>
                  {projets.map(projet => (
                    <option key={projet.id} value={projet.id}>
                      {projet.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Date panne (début)</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.date_panne}
                  onChange={(e) => setFilters({ ...filters, date_panne: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Date panne (fin)</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.date_reparation}
                  onChange={(e) => setFilters({ ...filters, date_reparation: e.target.value })}
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Statistiques */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-white bg-primary">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <Card.Title>Total Arrêts</Card.Title>
                  <h4>{stats.total}</h4>
                </div>
                <div className="align-self-center">
                  <FaEye className="fs-4" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-white bg-warning">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <Card.Title>En Cours</Card.Title>
                  <h4>{stats.en_cours}</h4>
                </div>
                <div className="align-self-center">
                  <FaEye className="fs-4" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-white bg-success">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <Card.Title>Terminés</Card.Title>
                  <h4>{stats.termines}</h4>
                </div>
                <div className="align-self-center">
                  <FaEye className="fs-4" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-white bg-info">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <Card.Title>Durée Totale</Card.Title>
                  <h4>{stats.duree_totale.toFixed(1)}h</h4>
                </div>
                <div className="align-self-center">
                  <FaEye className="fs-4" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tableau des arrêts */}
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Liste des Arrêts d'Usine</h5>
          <Badge bg="secondary">{arrets.length} arrêts</Badge>
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <Table striped bordered hover className="align-middle">
              <thead className="table-dark">
                <tr>
                  <th>Usine</th>
                  <th>Projet</th>
                  <th>Code Panne</th>
                  <th>Date panne</th>
                  <th>Date réparation</th>
                  <th>Durée</th>
                  <th>Temps Fonction</th>
                  <th>Travaux Effectués</th>
                  <th>Intervenant</th>
                  <th>Observations</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedArrets.length > 0 ? (
                  paginatedArrets.map(arret => (
                    <tr key={arret.id}>
                      <td>{getUsineInfo(arret.usine)}</td>
                      <td>{getProjetInfo(arret.projet)}</td>
                      <td>{getCodePanneInfo(arret.code_panne)}</td>
                      <td>{formatDisplayDate(arret.date_panne)}</td>
                      <td>{arret.date_reparation ? formatDisplayDate(arret.date_reparation) : '-'}</td>
                      <td>{calculateDuration(arret.duree_panne)}</td>
                      <td>{arret.temps_fonctionnement ? `${arret.temps_fonctionnement}h` : '-'}</td>
                      <td>
                        {arret.travaux_effectues ? (
                          <span title={arret.travaux_effectues}>
                            {arret.travaux_effectues.length > 50 
                              ? `${arret.travaux_effectues.substring(0, 50)}...` 
                              : arret.travaux_effectues
                            }
                          </span>
                        ) : '-'}
                      </td>
                      <td>{arret.intervenant || '-'}</td>
                      <td>
                        {arret.observation ? (
                          <span title={arret.observation}>
                            {arret.observation.length > 50 
                              ? `${arret.observation.substring(0, 50)}...` 
                              : arret.observation
                            }
                          </span>
                        ) : '-'}
                      </td>
                      <td>
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          onClick={() => handleEditArret(arret)} 
                          className="me-2"
                          disabled={loading}
                        >
                          <FaEdit />
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm" 
                          onClick={() => handleDeleteArret(arret)}
                          disabled={loading}
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="11" className="text-center py-5 text-muted">
                      Aucun arrêt trouvé avec les filtres actuels
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-3">
              <Pagination>
                <Pagination.Prev 
                  onClick={() => paginate(currentPage - 1)} 
                  disabled={currentPage === 1}
                />
                {[...Array(totalPages)].map((_, index) => (
                  <Pagination.Item
                    key={index + 1}
                    active={index + 1 === currentPage}
                    onClick={() => paginate(index + 1)}
                  >
                    {index + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next 
                  onClick={() => paginate(currentPage + 1)} 
                  disabled={currentPage === totalPages}
                />
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modals */}
      <AddArretModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSubmit={handleAddArret}
        loading={loading}
        newArret={newArret}
        setNewArret={setNewArret}
        usines={usines}
        projets={projets}
        codesPanne={codesPanne}
      />

      <EditArretModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        onSubmit={handleUpdateArret}
        loading={loading}
        editingArret={editingArret}
        setEditingArret={setEditingArret}
        usines={usines}
        projets={projets}
        codesPanne={codesPanne}
      />
    </div>
  );
};

export default GestionArretsUsine;