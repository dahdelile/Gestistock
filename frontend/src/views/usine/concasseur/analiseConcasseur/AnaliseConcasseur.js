import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Container,
  Table,
  Button,
  Modal,
  Form,
  Row,
  Col,
  Spinner,
  Alert,
  Pagination,
  Badge,
} from "react-bootstrap";
//import { format, parseISO } from "date-fns";

const EntretienPage = () => {
  // États
  const [entretiens, setEntretiens] = useState([]);
  const [projets, setProjets] = useState([]);
  const [equipements, setEquipements] = useState([]);
  const [loading, setLoading] = useState({
    main: true,
    action: false,
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  
  // Filtres et pagination
  const [filterProjet, setFilterProjet] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(prev => ({ ...prev, main: true }));
      setError(null);
      
      const [entretiensRes, projetsRes, equipementsRes] = await Promise.all([
        axios.get("/api/entretients/"),
        axios.get("/api/projets/"),
        axios.get("/api/equipements/")
      ]);
      
      setEntretiens(entretiensRes.data);
      setProjets(projetsRes.data);
      setEquipements(equipementsRes.data);
    } catch (err) {
      setError("Erreur lors du chargement des données. Veuillez réessayer.");
      console.error("Erreur:", err);
    } finally {
      setLoading(prev => ({ ...prev, main: false }));
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Gestion des actions
  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet entretien ?")) {
      try {
        setLoading(prev => ({ ...prev, action: true }));
        await axios.delete(`/api/entretients/${id}/`);
        setSuccess("Entretien supprimé avec succès");
        fetchData();
      } catch (err) {
        setError("Erreur lors de la suppression");
      } finally {
        setLoading(prev => ({ ...prev, action: false }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!editData.equipement) {
      setError("L'équipement est requis");
      return;
    }
    if (!editData.date_visite) {
      setError("La date est requise");
      return;
    }
    if (editData.compteur_actuel < 0 || editData.prochaine_visite < 0) {
      setError("Les valeurs numériques doivent être positives");
      return;
    }

    try {
      setLoading(prev => ({ ...prev, action: true }));
      setError(null);
      
      if (editData.id) {
        await axios.put(`/api/entretients/${editData.id}/`, editData);
        setSuccess("Entretien mis à jour avec succès");
      } else {
        await axios.post("/api/entretients/", editData);
        setSuccess("Entretien créé avec succès");
      }
      
      setShowModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  // Filtrage et recherche
  const filteredData = entretiens.filter(entretien => {
    const matchesProjet = filterProjet ? entretien.projet === parseInt(filterProjet) : true;
    const matchesSearch = searchTerm 
      ? entretien.equipement_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entretien.projet_name.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    return matchesProjet && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Formatage date
  const formatDate = (dateString) => {
    return format(parseISO(dateString), "dd/MM/yyyy");
  };

  // Reset messages
  const resetMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <Container className="mt-4">
      <h2 className="mb-3">
        Gestion des Entretiens 
        <Badge bg="secondary" className="ms-2">
          {filteredData.length}
        </Badge>
      </h2>

      {/* Messages d'alerte */}
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

      {/* Barre de filtres */}
      <Row className="mb-3 g-3">
        <Col md={4}>
          <Form.Control
            type="search"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </Col>
        <Col md={3}>
          <Form.Select
            value={filterProjet}
            onChange={(e) => {
              setFilterProjet(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Tous les projets</option>
            {projets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={{ span: 2, offset: 3 }}>
          <Button 
            variant="primary" 
            onClick={() => {
              setEditData({
                equipement: "",
                projet: "",
                date_visite: format(new Date(), "yyyy-MM-dd"),
                compteur_visite: 0,
                compteur_actuel: 0,
                prochaine_visite: 0,
                heur_restant: 0,
              });
              resetMessages();
              setShowModal(true);
            }}
          >
            + Ajouter
          </Button>
        </Col>
      </Row>

      {/* Tableau */}
      {loading.main ? (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Chargement...</span>
          </Spinner>
        </div>
      ) : (
        <>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Équipement</th>
                <th>Projet</th>
                <th>Date</th>
                <th>Compteur</th>
                <th className="text-end">Heures restantes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((e) => (
                  <tr key={e.id}>
                    <td>{e.equipement_name}</td>
                    <td>{e.projet_name}</td>
                    <td>{formatDate(e.date_visite)}</td>
                    <td>{e.compteur_actuel.toLocaleString()}</td>
                    <td className="text-end">
                      <Badge bg={e.heur_restant > 50 ? "success" : e.heur_restant > 20 ? "warning" : "danger"}>
                        {e.heur_restant}h
                      </Badge>
                    </td>
                    <td>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          setEditData(e);
                          resetMessages();
                          setShowModal(true);
                        }}
                        className="me-2"
                        disabled={loading.action}
                      >
                        Modifier
                      </Button>
                      <Button 
                        size="sm" 
                        variant="danger" 
                        onClick={() => handleDelete(e.id)}
                        disabled={loading.action}
                      >
                        {loading.action ? "..." : "Supprimer"}
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center">
                    Aucun entretien trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center">
              <Pagination>
                <Pagination.First 
                  onClick={() => setCurrentPage(1)} 
                  disabled={currentPage === 1} 
                />
                <Pagination.Prev 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                  disabled={currentPage === 1} 
                />
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Pagination.Item
                      key={pageNum}
                      active={pageNum === currentPage}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Pagination.Item>
                  );
                })}

                <Pagination.Next 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                  disabled={currentPage === totalPages} 
                />
                <Pagination.Last 
                  onClick={() => setCurrentPage(totalPages)} 
                  disabled={currentPage === totalPages} 
                />
              </Pagination>
            </div>
          )}
        </>
      )}

      {/* Modal d'édition */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editData?.id ? "Modifier l'entretien" : "Nouvel entretien"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Équipement <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="equipement"
                    value={editData?.equipement || ""}
                    onChange={(e) => setEditData({ ...editData, equipement: e.target.value })}
                    required
                  >
                    <option value="">Sélectionner un équipement</option>
                    {equipements.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.nom} ({eq.modele})
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
                    value={editData?.projet || ""}
                    onChange={(e) => setEditData({ ...editData, projet: e.target.value })}
                  >
                    <option value="">Sélectionner un projet</option>
                    {projets.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date de visite <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="date_visite"
                    value={editData?.date_visite || ""}
                    onChange={(e) => setEditData({ ...editData, date_visite: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Compteur visite (h)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    name="compteur_visite"
                    value={editData?.compteur_visite || ""}
                    onChange={(e) => setEditData({ ...editData, compteur_visite: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Compteur actuel (h) <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    name="compteur_actuel"
                    value={editData?.compteur_actuel || ""}
                    onChange={(e) => setEditData({ ...editData, compteur_actuel: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Prochaine visite (h)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    name="prochaine_visite"
                    value={editData?.prochaine_visite || ""}
                    onChange={(e) => setEditData({ ...editData, prochaine_visite: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Heures restantes <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="number"
                min="0"
                name="heur_restant"
                value={editData?.heur_restant || ""}
                onChange={(e) => setEditData({ ...editData, heur_restant: e.target.value })}
                required
              />
            </Form.Group>

            <div className="d-flex justify-content-end mt-4">
              <Button 
                variant="secondary" 
                onClick={() => setShowModal(false)}
                className="me-2"
              >
                Annuler
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={loading.action}
              >
                {loading.action ? (
                  <>
                    <Spinner as="span" size="sm" animation="border" role="status" />
                    <span className="visually-hidden">Enregistrement...</span>
                  </>
                ) : (
                  "Enregistrer"
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default EntretienPage;