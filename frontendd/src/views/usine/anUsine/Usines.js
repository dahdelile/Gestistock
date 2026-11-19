import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Modal, Button, Form, Spinner, Alert, Table, Card, Row, Col, Badge } from "react-bootstrap";

// 🔹 Modal pour ajouter une usine
const AddUsineModal = ({ show, onHide, onSubmit, loading, newUsine, setNewUsine, categories, projets }) => (
  <Modal show={show} onHide={onHide} size="lg">
    <Modal.Header closeButton>
      <Modal.Title>Ajouter une usine</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <Form>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Matricule *</Form.Label>
              <Form.Control
                type="text"
                value={newUsine.matricule}
                onChange={(e) => setNewUsine({ ...newUsine, matricule: e.target.value })}
                required
                placeholder="Ex: USN-001"
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Catégorie *</Form.Label>
              <Form.Select
                value={newUsine.categorie}
                onChange={(e) => setNewUsine({ ...newUsine, categorie: e.target.value })}
                required
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Marque</Form.Label>
              <Form.Control
                type="text"
                value={newUsine.marque || ""}
                onChange={(e) => setNewUsine({ ...newUsine, marque: e.target.value })}
                placeholder="Ex: Caterpillar"
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Modèle</Form.Label>
              <Form.Control
                type="text"
                value={newUsine.modele || ""}
                onChange={(e) => setNewUsine({ ...newUsine, modele: e.target.value })}
                placeholder="Ex: XR400"
              />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Date d'affectation *</Form.Label>
              <Form.Control
                type="date"
                value={newUsine.date_affectation}
                onChange={(e) => setNewUsine({ ...newUsine, date_affectation: e.target.value })}
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Projet</Form.Label>
              <Form.Select
                value={newUsine.projet || ""}
                onChange={(e) => setNewUsine({ ...newUsine, projet: e.target.value || null })}
              >
                <option value="">Aucun projet</option>
                {projets.map((projet) => (
                  <option key={projet.id} value={projet.id}>
                    {projet.name} 
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
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

// 🔹 Modal pour modifier une usine
const EditUsineModal = ({ show, onHide, onSubmit, loading, editingUsine, setEditingUsine, categories, projets }) => (
  <Modal show={show} onHide={onHide} size="lg">
    <Modal.Header closeButton>
      <Modal.Title>Modifier l'usine</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <Form>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Matricule *</Form.Label>
              <Form.Control
                type="text"
                value={editingUsine?.matricule || ""}
                onChange={(e) => setEditingUsine({ ...editingUsine, matricule: e.target.value })}
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Catégorie *</Form.Label>
              <Form.Select
                value={editingUsine?.categorie || ""}
                onChange={(e) => setEditingUsine({ ...editingUsine, categorie: e.target.value })}
                required
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Marque</Form.Label>
              <Form.Control
                type="text"
                value={editingUsine?.marque || ""}
                onChange={(e) => setEditingUsine({ ...editingUsine, marque: e.target.value })}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Modèle</Form.Label>
              <Form.Control
                type="text"
                value={editingUsine?.modele || ""}
                onChange={(e) => setEditingUsine({ ...editingUsine, modele: e.target.value })}
              />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Date d'affectation *</Form.Label>
              <Form.Control
                type="date"
                value={editingUsine?.date_affectation || ""}
                onChange={(e) => setEditingUsine({ ...editingUsine, date_affectation: e.target.value })}
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Projet</Form.Label>
              <Form.Select
                value={editingUsine?.projet || ""}
                onChange={(e) => setEditingUsine({ ...editingUsine, projet: e.target.value || null })}
              >
                <option value="">Aucun projet</option>
                {projets.map((projet) => (
                  <option key={projet.id} value={projet.id}>
                    {projet.name} 
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
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

// 🔹 Composant de carte pour l'affichage en mode grille
const UsineCard = ({ usine, onEdit, onDelete, getProjetName }) => (
  <Card className="h-100 shadow-sm">
    <Card.Header className="d-flex justify-content-between align-items-center">
      <strong>{usine.matricule}</strong>
      <Badge bg={usine.categorie === 'concasseur' ? 'primary' : 'warning'}>
        {usine.categorie === 'concasseur' ? 'Concasseur' : 'Central Enrobé'}
      </Badge>
    </Card.Header>
    <Card.Body>
      <div className="mb-2">
        <small className="text-muted">Marque/Modèle:</small>
        <p className="mb-1">
          {usine.marque ? (
            <>
              {usine.marque}
              {usine.modele && ` - ${usine.modele}`}
            </>
          ) : (
            <span className="text-muted">Non spécifié</span>
          )}
        </p>
      </div>
      
      <div className="mb-2">
        <small className="text-muted">Date d'affectation:</small>
        <p className="mb-1">{new Date(usine.date_affectation).toLocaleDateString('fr-FR')}</p>
      </div>

      <div className="mb-2">
        <small className="text-muted">Projet:</small>
        <p className="mb-1">
          {getProjetName(usine)}
        </p>
      </div>
    </Card.Body>
    <Card.Footer className="bg-transparent">
      <div className="btn-group w-100">
        <Button variant="outline-primary" size="sm" onClick={() => onEdit(usine)}>
          Modifier
        </Button>
        <Button variant="outline-danger" size="sm" onClick={() => onDelete(usine.id)}>
          Supprimer
        </Button>
      </div>
    </Card.Footer>
  </Card>
);

const GestionUsines = () => {
  const [usines, setUsines] = useState([]);
  const [projets, setProjets] = useState([]);
  const [newUsine, setNewUsine] = useState({ 
    matricule: "", 
    categorie: "", 
    marque: "", 
    modele: "", 
    date_affectation: "", 
    projet: null 
  });
  const [editingUsine, setEditingUsine] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [viewMode, setViewMode] = useState('table');

  const categories = [
    { value: 'concasseur', label: 'Concasseur' },
    { value: 'central_enrobee', label: 'Central Enrobé' }
  ];

  const API_URL = "https://intranet-attm.com/api/usines/";
  const PROJETS_API_URL = "https://intranet-attm.com/api/projets/";

  const fetchUsines = useCallback(async () => {
    try {
      const response = await axios.get(API_URL);
      setUsines(response.data);
    } catch (err) {
      setError("Erreur lors du chargement des usines");
      console.error("Erreur détaillée:", err.response?.data);
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

  useEffect(() => {
    fetchUsines();
    fetchProjets();
  }, [fetchUsines, fetchProjets]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setError(null);
      setSuccessMessage(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [error, successMessage]);

  const handleAddUsine = async () => {
    if (!newUsine.matricule.trim() || !newUsine.categorie.trim() || !newUsine.date_affectation) {
      setError("Matricule, catégorie et date d'affectation sont obligatoires !");
      return;
    }

    // Vérification de l'unicité du matricule
    if (usines.some(u => u.matricule.toLowerCase() === newUsine.matricule.toLowerCase())) {
      setError("Ce matricule existe déjà !");
      return;
    }

    setLoading(true);
    try {
      // Préparer les données pour l'API
      const usineData = {
        ...newUsine,
        marque: newUsine.marque || null,
        modele: newUsine.modele || null,
        projet: newUsine.projet || null
      };

      const response = await axios.post(API_URL, usineData);
      setUsines(prev => [...prev, response.data]);
      setNewUsine({ 
        matricule: "", 
        categorie: "", 
        marque: "", 
        modele: "", 
        date_affectation: "", 
        projet: null 
      });
      setShowAddModal(false);
      setSuccessMessage("Usine ajoutée avec succès !");
    } catch (err) {
      const errorMessage = err.response?.data 
        ? Object.values(err.response.data).flat().join(', ')
        : "Erreur lors de l'ajout de l'usine !";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUsine = async () => {
    if (!editingUsine.matricule.trim() || !editingUsine.categorie.trim() || !editingUsine.date_affectation) {
      setError("Matricule, catégorie et date d'affectation sont obligatoires !");
      return;
    }

    // Vérification de l'unicité du matricule (exclure l'usine en cours d'édition)
    if (usines.some(u => 
      u.matricule.toLowerCase() === editingUsine.matricule.toLowerCase() && 
      u.id !== editingUsine.id
    )) {
      setError("Ce matricule existe déjà !");
      return;
    }

    setLoading(true);
    try {
      const usineData = {
        ...editingUsine,
        marque: editingUsine.marque || null,
        modele: editingUsine.modele || null,
        projet: editingUsine.projet || null
      };

      await axios.put(`${API_URL}${editingUsine.id}/`, usineData);
      setUsines(prev => prev.map(u => u.id === editingUsine.id ? editingUsine : u));
      setShowEditModal(false);
      setSuccessMessage("Usine modifiée avec succès !");
    } catch (err) {
      const errorMessage = err.response?.data 
        ? Object.values(err.response.data).flat().join(', ')
        : "Erreur lors de la modification de l'usine !";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUsine = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette usine ?")) return;
    setLoading(true);
    try {
      await axios.delete(`${API_URL}${id}/`);
      setUsines(prev => prev.filter(u => u.id !== id));
      setSuccessMessage("Usine supprimée avec succès !");
    } catch (err) {
      setError("Erreur lors de la suppression de l'usine !");
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour obtenir le nom du projet
  const getProjetName = (usine) => {
    if (!usine.projet) return "Aucun projet";
    
    // Si les détails du projet sont inclus dans la réponse
    if (usine.projet_details) {
      return `${usine.projet_details.name} `;
    }
    
    // Sinon, chercher dans la liste des projets
    const projet = projets.find(p => p.id === usine.projet);
    return projet ? `${projet.name} ` : `Projet #${usine.projet}`;
  };

  // Statistiques
  const stats = {
    total: usines.length,
    concasseurs: usines.filter(u => u.categorie === 'concasseur').length,
    centrales: usines.filter(u => u.categorie === 'central_enrobee').length,
    avecProjet: usines.filter(u => u.projet).length,
    sansProjet: usines.filter(u => !u.projet).length
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="mb-1">Gestion des Usines</h3>
          <p className="text-muted mb-0">Gérez votre parc d'usines de concassage et d'enrobage</p>
        </div>
        <div className="d-flex gap-2">
        
         
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            <i className="bi bi-plus-circle me-1"></i> Ajouter une usine
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      {/* Cartes de statistiques */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-white bg-primary">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <Card.Title>Total Usines</Card.Title>
                  <h4>{stats.total}</h4>
                </div>
                <div className="align-self-center">
                  <i className="bi bi-industry fs-4"></i>
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
                  <Card.Title>Concasseurs</Card.Title>
                  <h4>{stats.concasseurs}</h4>
                </div>
                <div className="align-self-center">
                  <i className="bi bi-gear fs-4"></i>
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
                  <Card.Title>Centrales Enrobé</Card.Title>
                  <h4>{stats.centrales}</h4>
                </div>
                <div className="align-self-center">
                  <i className="bi bi-road fs-4"></i>
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
                  <Card.Title>Avec Projet</Card.Title>
                  <h4>{stats.avecProjet}</h4>
                </div>
                <div className="align-self-center">
                  <i className="bi bi-diagram-3 fs-4"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Affichage en tableau */}
      {viewMode === 'table' && (
        <Card>
          <Card.Header>
            <h5 className="mb-0">Liste des Usines</h5>
          </Card.Header>
          <Card.Body>
            <Table striped bordered hover responsive>
              <thead className="table-dark">
                <tr>
                  <th>Equipement</th>
                  <th>Type</th>
                  <th>Marque</th>
                  <th>Modèle</th>
                  <th>Date Affectation</th>
                  <th>Site</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usines.length ? (
                  usines.map(usine => (
                    <tr key={usine.id}>
                      <td>
                        <strong>{usine.matricule}</strong>
                      </td>
                      <td>
                        <Badge bg={usine.categorie === 'concasseur' ? 'primary' : 'warning'}>
                          {usine.categorie === 'concasseur' ? 'Concasseur' : 'Central Enrobé'}
                        </Badge>
                      </td>
                      <td>{usine.marque || <span className="text-muted">-</span>}</td>
                      <td>{usine.modele || <span className="text-muted">-</span>}</td>
                      <td>{new Date(usine.date_affectation).toLocaleDateString('fr-FR')}</td>
                      <td>{getProjetName(usine)}</td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <Button 
                            variant="outline-warning" 
                            size="sm"
                            onClick={() => {
                              setEditingUsine(usine);
                              setShowEditModal(true);
                            }}
                          >
                            <i className="bi bi-pencil"></i> Modifier
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDeleteUsine(usine.id)}
                          >
                            <i className="bi bi-trash"></i> Supprimer
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      <i className="bi bi-inbox fs-1 text-muted mb-3 d-block"></i>
                      <p className="text-muted">Aucune usine trouvée</p>
                      <Button 
                        variant="primary" 
                        onClick={() => setShowAddModal(true)}
                      >
                        <i className="bi bi-plus-circle me-1"></i> Ajouter une usine
                      </Button>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}


      {/* Modals */}
      <AddUsineModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSubmit={handleAddUsine}
        loading={loading}
        newUsine={newUsine}
        setNewUsine={setNewUsine}
        categories={categories}
        projets={projets}
      />

      <EditUsineModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        onSubmit={handleUpdateUsine}
        loading={loading}
        editingUsine={editingUsine}
        setEditingUsine={setEditingUsine}
        categories={categories}
        projets={projets}
      />
    </div>
  );
};

export default GestionUsines;