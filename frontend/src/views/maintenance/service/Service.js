import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Modal,
  Button,
  Form,
  Spinner,
  Alert,
  Badge,
  Table,
  Container,
} from "react-bootstrap";

// Configuration API
const API_BASE_URL = "http://localhost:8000/api";
const VOITURES_ENDPOINT = `${API_BASE_URL}/voitures/`;
const PROJETS_ENDPOINT = `${API_BASE_URL}/projets/`;

const GestionVoitures = () => {
  // État initial
  const initialState = {
    matricule: "",
    type_voiture: "",
    category: "ENGIN",
    date: "",
    projet: "",
  };

  // États
  const [voitures, setVoitures] = useState([]);
  const [projets, setProjets] = useState([]);
  const [formData, setFormData] = useState(initialState);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Chargement des données initiales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [voituresResponse, projetsResponse] = await Promise.all([
          axios.get(VOITURES_ENDPOINT),
          axios.get(PROJETS_ENDPOINT),
        ]);
        setVoitures(voituresResponse.data);
        setProjets(projetsResponse.data);
      } catch (err) {
        handleApiError(err, "Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Gestion des erreurs API
  const handleApiError = (error, defaultMessage) => {
    console.error("Erreur API:", error);
    const errorMessage =
      error.response?.data?.detail ||
      error.response?.data ||
      error.message ||
      defaultMessage;
    setError(errorMessage);
  };

  // Gestion des changements de formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation des champs obligatoires
      if (!formData.matricule || !formData.type_voiture || !formData.date) {
        throw new Error("Tous les champs marqués d'un * sont obligatoires");
      }

      // Formatage des données
      const payload = {
        ...formData,
        projet: formData.projet ? parseInt(formData.projet) : null,
      };

      // Envoi à l'API
      const response = editingId
        ? await axios.put(`${VOITURES_ENDPOINT}${editingId}/`, payload)
        : await axios.post(VOITURES_ENDPOINT, payload);

      // Mise à jour de l'état
      setVoitures(
        editingId
          ? voitures.map((v) => (v.id === editingId ? response.data : v))
          : [...voitures, response.data]
      );

      setSuccess(
        `Voiture ${editingId ? "modifiée" : "ajoutée"} avec succès`
      );
      handleCloseModal();
    } catch (err) {
      handleApiError(err, "Erreur lors de l'envoi des données");
    } finally {
      setLoading(false);
    }
  };

  // Gestion de la suppression
  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette voiture ?")) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`${VOITURES_ENDPOINT}${id}/`);
      setVoitures(voitures.filter((v) => v.id !== id));
      setSuccess("Voiture supprimée avec succès");
    } catch (err) {
      handleApiError(err, "Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  // Préparation de l'édition
  const handleEdit = (voiture) => {
    setFormData({
      matricule: voiture.matricule,
      type_voiture: voiture.type_voiture,
      category: voiture.category,
      date: voiture.date.split("T")[0],
      projet: voiture.projet_details?.id?.toString() || voiture.projet?.toString() || "",
    });
    setEditingId(voiture.id);
    setShowModal(true);
  };

  // Fermeture de la modale
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(initialState);
    setError(null);
  };

  // Formatage de la date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  // Récupération du nom du projet
  const getProjetName = (projetData) => {
    if (!projetData) return "Non attribué";
    if (projetData.name) return projetData.name;
    const projetTrouve = projets.find((p) => p.id === projetData);
    return projetTrouve ? projetTrouve.name : "Non attribué";
  };

  return (
    <Container className="mt-4">
      <h2 className="text-center mb-4">Gestion d'ajout des equipements</h2>

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

      {/* Bouton d'ajout */}
      <div className="text-end mb-3">
        <Button
          variant="primary"
          onClick={() => {
            setFormData(initialState);
            setEditingId(null);
            setShowModal(true);
          }}
        >
          <i className="bi bi-plus-circle me-2"></i>Ajouter une voiture
        </Button>
      </div>

      {/* Tableau des voitures */}
      {loading && voitures.length === 0 ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Chargement en cours...</p>
        </div>
      ) : (
        <Table striped bordered hover responsive>
          <thead className="table-dark">
            <tr>
              <th>Matricule</th>
              <th>Type</th>
              <th>Catégorie</th>
              <th>Date d'acquisition</th>
              <th>Projet</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {voitures.map((voiture) => (
              <tr key={voiture.id}>
                <td>{voiture.matricule}</td>
                <td>{voiture.type_voiture}</td>
                <td>
                  <Badge
                    bg={voiture.category === "ENGIN" ? "primary" : "success"}
                  >
                    {voiture.category === "ENGIN" ? "Engin" : "Véhicule"}
                  </Badge>
                </td>
                <td>{formatDate(voiture.date_affectation)}</td>
                <td>{getProjetName(voiture.projet_details || voiture.projet)}</td>
                <td>
                  <Button
                    variant="outline-warning"
                    size="sm"
                    className="me-2"
                    onClick={() => handleEdit(voiture)}
                    disabled={loading}
                  >
                    <i className="bi bi-pencil-square"></i> Modifier
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDelete(voiture.id)}
                    disabled={loading}
                  >
                    <i className="bi bi-trash"></i> Supprimer
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Modal d'ajout/modification */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingId ? "Modifier" : "Ajouter"} une voiture
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Matricule *</Form.Label>
              <Form.Control
                type="text"
                name="matricule"
                value={formData.matricule}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Type de voiture *</Form.Label>
              <Form.Control
                type="text"
                name="type_voiture"
                value={formData.type_voiture}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Date d'acquisition *</Form.Label>
              <Form.Control
                type="date"
                name=" date_affectation"
                value={formData.date}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Catégorie *</Form.Label>
              <Form.Select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="ENGIN">Engin</option>
                <option value="ROULAGE">Véhicule de roulage</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Projet</Form.Label>
              <Form.Select
                name="projet"
                value={formData.projet}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">Sélectionnez un projet</option>
                {projets.map((projet) => (
                  <option key={projet.id} value={projet.id}>
                    {projet.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button
                variant="secondary"
                className="me-2"
                onClick={handleCloseModal}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? (
                  <Spinner animation="border" size="sm" />
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

export default GestionVoitures;