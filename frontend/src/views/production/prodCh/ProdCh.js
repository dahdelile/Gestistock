import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Modal,
  Button,
  Form,
  Spinner,
  Alert,
  Container,
  Row,
  Col,
  InputGroup,
  Card,
  Badge,
  Tab,
  Tabs,
  Table
} from "react-bootstrap";
import { FaCar, FaPlusCircle, FaHistory, FaUserTie } from "react-icons/fa";

const API_BASE_URL = "http://localhost:8000/api";
const PRODUCTION_ENDPOINT = `${API_BASE_URL}/productions/`;
const CHAUFFEURS_ENDPOINT = `${API_BASE_URL}/chauffeurs/`;
const VOITURE_ENDPOINT = `${API_BASE_URL}/voitures/`;
const PROJET_ENDPOINT = `${API_BASE_URL}/projets/`;

const GestionProductionChauffeurs = () => {
  const navigate = useNavigate();
  const initialState = {
    chauffeur: '',
    voiture: '',
    projet: '',
    compteur_debut: '',
    compteur_fin: '',
    voyage_enrobe: '',
    voyage_tout_venant: '',
    voyage_gravier_roche: '',
    autre: '',
    remarques: ''
  };

  const [chauffeurs, setChauffeurs] = useState([]);
  const [voitures, setVoitures] = useState([]);
  const [projets, setProjets] = useState([]);
  const [formData, setFormData] = useState(initialState);
  const [productions, setProductions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('add');

  // Charger les données initiales
  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [chauffeursRes, voituresRes, projetsRes, productionsRes] = await Promise.all([
          axios.get(CHAUFFEURS_ENDPOINT),
          axios.get(VOITURE_ENDPOINT),
          axios.get(PROJET_ENDPOINT),
          axios.get(`${PRODUCTION_ENDPOINT}?categorie=CHAUFFEUR&expand=chauffeur,voiture,projet`)
        ]);
        setChauffeurs(chauffeursRes.data);
        setVoitures(voituresRes.data);
        setProjets(projetsRes.data);
        setProductions(productionsRes.data);
      } catch (err) {
        setError('Erreur de chargement des données');
        console.error('Erreur:', err.response?.data || err.message);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

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
      // Validation
      if (!formData.chauffeur || !formData.voiture || !formData.compteur_debut || !formData.compteur_fin) {
        throw new Error("Chauffeur, voiture, compteur début et compteur fin sont obligatoires");
      }

      const compteurDebut = parseFloat(formData.compteur_debut);
      const compteurFin = parseFloat(formData.compteur_fin);

      if (compteurFin <= compteurDebut) {
        throw new Error("Le compteur fin doit être supérieur au compteur début");
      }

      // Préparation des données
      const payload = {
        ...formData,
        chauffeur: parseInt(formData.chauffeur),
        voiture: parseInt(formData.voiture),
        projet: formData.projet ? parseInt(formData.projet) : null,
        compteur_debut: compteurDebut,
        compteur_fin: compteurFin,
        distance: compteurFin - compteurDebut,
        voyage_enrobe: parseFloat(formData.voyage_enrobe) || 0,
        voyage_tout_venant: parseFloat(formData.voyage_tout_venant) || 0,
        voyage_gravier_roche: parseFloat(formData.voyage_gravier_roche) || 0,
        autre: parseFloat(formData.autre) || 0,
        date: new Date().toISOString().split('T')[0],
        categorie: "CHAUFFEUR"
      };

      const response = await axios.post(PRODUCTION_ENDPOINT, payload);
      
      setSuccess("Production de chauffeur ajoutée avec succès");
      setProductions(prev => [response.data, ...prev]);
      setFormData(initialState);
      setShowModal(false);
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData(initialState);
    setError(null);
  };

  return (
    <Container className="mt-4">
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h2 className="mb-0">
            <FaUserTie className="me-2" />
            Gestion des Productions Chauffeurs
          </h2>
          <Badge bg="primary">Semaine {new Date().getWeek()}</Badge>
        </Card.Header>
      </Card>

      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-3">
        <Tab eventKey="add" title={<><FaPlusCircle /> Ajouter</>}>
          <Card className="mt-3">
            <Card.Body>
              {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
              {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}

              <div className="text-end mb-3">
                <Button variant="success" onClick={() => setShowModal(true)}>
                  <FaPlusCircle className="me-2" />
                  Nouvelle Production
                </Button>
              </div>

              <Modal show={showModal} onHide={handleCloseModal} size="lg">
                <Modal.Header closeButton>
                  <Modal.Title>Ajouter une production chauffeur</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Form onSubmit={handleSubmit}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Chauffeur *</Form.Label>
                          <Form.Select
                            name="chauffeur"
                            value={formData.chauffeur}
                            onChange={handleChange}
                            required
                            disabled={loading}
                          >
                            <option value="">Sélectionnez un chauffeur</option>
                            {chauffeurs.map(chauffeur => (
                              <option key={chauffeur.id} value={chauffeur.id}>
                                {chauffeur.matricule} - {chauffeur.nom}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Voiture *</Form.Label>
                          <Form.Select
                            name="voiture"
                            value={formData.voiture}
                            onChange={handleChange}
                            required
                            disabled={loading}
                          >
                            <option value="">Sélectionnez une voiture</option>
                            {voitures.map(voiture => (
                              <option key={voiture.id} value={voiture.id}>
                                {voiture.immatriculation} - {voiture.marque} {voiture.modele}
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
                            value={formData.projet}
                            onChange={handleChange}
                            disabled={loading}
                          >
                            <option value="">Sélectionnez un projet</option>
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
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Compteur début (km) *</Form.Label>
                          <InputGroup>
                            <Form.Control
                              type="number"
                              name="compteur_debut"
                              value={formData.compteur_debut}
                              onChange={handleChange}
                              min="0"
                              step="0.1"
                              required
                              disabled={loading}
                            />
                            <InputGroup.Text>km</InputGroup.Text>
                          </InputGroup>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Compteur fin (km) *</Form.Label>
                          <InputGroup>
                            <Form.Control
                              type="number"
                              name="compteur_fin"
                              value={formData.compteur_fin}
                              onChange={handleChange}
                              min={formData.compteur_debut || 0}
                              step="0.1"
                              required
                              disabled={loading}
                            />
                            <InputGroup.Text>km</InputGroup.Text>
                          </InputGroup>
                        </Form.Group>
                      </Col>
                    </Row>

                    <h5 className="mt-4 mb-3">Quantités Transportées</h5>
                    <Row>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>Enrobé (m³)</Form.Label>
                          <Form.Control
                            type="number"
                            name="voyage_enrobe"
                            value={formData.voyage_enrobe}
                            onChange={handleChange}
                            min="0"
                            step="0.1"
                            disabled={loading}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>Tout Venant (m³)</Form.Label>
                          <Form.Control
                            type="number"
                            name="voyage_tout_venant"
                            value={formData.voyage_tout_venant}
                            onChange={handleChange}
                            min="0"
                            step="0.1"
                            disabled={loading}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>Gravier/Roche (m³)</Form.Label>
                          <Form.Control
                            type="number"
                            name="voyage_gravier_roche"
                            value={formData.voyage_gravier_roche}
                            onChange={handleChange}
                            min="0"
                            step="0.1"
                            disabled={loading}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>Autre (m³)</Form.Label>
                          <Form.Control
                            type="number"
                            name="autre"
                            value={formData.autre}
                            onChange={handleChange}
                            min="0"
                            step="0.1"
                            disabled={loading}
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
                        value={formData.remarques}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    </Form.Group>

                    <div className="d-flex justify-content-end">
                      <Button variant="secondary" onClick={handleCloseModal} className="me-2">
                        Annuler
                      </Button>
                      <Button variant="primary" type="submit" disabled={loading}>
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
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="history" title={<><FaHistory /> Historique</>}>
          <Card className="mt-3">
            <Card.Body>
              <h4 className="mb-3">Dernières Productions</h4>
              {loadingData ? (
                <div className="text-center">
                  <Spinner animation="border" />
                </div>
              ) : productions.length > 0 ? (
                <Table striped bordered hover responsive>
                  <thead className="table-dark">
                    <tr>
                      <th>Chauffeur</th>
                      <th>Voiture</th>
                      <th>Projet</th>
                      <th>Date</th>
                      <th>Distance (km)</th>
                      <th>Enrobé (m³)</th>
                      <th>Tout Venant (m³)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productions.map(prod => {
                      const dateFormatted = prod. date_creation || 
                        (prod.date ? new Date(prod.date).toLocaleDateString('fr-FR') : 'Date invalide');
                      
                      return (
                        <tr key={prod.id}>
                          <td>{prod.chauffeur_info?.nom || prod.chauffeur_details?.nom || 'N/A'}</td>
                          <td>{prod.voiture_info?.immatriculation || prod.voiture_details?.immatriculation || 'N/A'}</td>
                          <td>{prod.projet_info?.name || prod.projet_details?.name || 'Non attribué'}</td>
                          <td>{prod.date_creation}</td>
                          <td>{prod.distance?.toFixed(1)}</td>
                          <td>{prod.voyage_enrobe || '-'}</td>
                          <td>{prod.voyage_tout_venant || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              ) : (
                <Alert variant="info">Aucune production enregistrée</Alert>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
};

// Helper pour le numéro de semaine
Date.prototype.getWeek = function() {
  const date = new Date(this.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

export default GestionProductionChauffeurs;