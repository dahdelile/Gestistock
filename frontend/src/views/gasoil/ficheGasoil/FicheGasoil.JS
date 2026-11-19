import React, { useState, useEffect, useCallback } from "react"; 
import axios from "axios";
import { Form, Table, Spinner, Alert, Button, Modal } from "react-bootstrap";

const FiltreProjetMois = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // États pour la modale
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    projet: '',
    mesure: '',
  
    date_rapport: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/projets/")
      .then((response) => setProjects(response.data))
      .catch((error) => {
        setError("Erreur lors du chargement des projets.");
        console.error("Erreur projets :", error);
      });
  }, []);

  const handleFilter = useCallback(() => {
    setError(null);
    if (!selectedProject || !selectedMonth) {
      setError("Veuillez sélectionner un projet et un mois.");
      return;
    }

    setLoading(true);
    axios
      .get("http://127.0.0.1:8000/api/performances/")
      .then((response) => {
        const filtered = response.data.filter(
          (item) =>
            item.projet === parseInt(selectedProject) &&
            item.date_rapport.startsWith(`2025-${selectedMonth}`)
        );
        setFilteredData(filtered);
      })
      .catch((error) => {
        setError("Erreur lors du chargement des performances.");
        console.error("Erreur filtrage :", error);
      })
      .finally(() => setLoading(false));
  }, [selectedProject, selectedMonth]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: name === "projet" ? parseInt(value, 10) || "" : value,
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const realisationJournee = parseInt(formData.realisation_journee, 10);
    if (isNaN(realisationJournee)) {
      setError("La réalisation journalière doit être un nombre valide.");
      return;
    }

    try {
      const newPerformance = { ...formData, realisation_journee: realisationJournee };
      await axios.post("http://127.0.0.1:8000/api/performances/", newPerformance);
      setShowModal(false);
      setFormData({
        projet: '',
        mesure: '',
        realisation_journee: 0,
        date_rapport: new Date().toISOString().split('T')[0],
      });
      // Rafraîchir les données après l'ajout
      handleFilter();
    } catch (err) {
      setError("Erreur lors de l'ajout de la performance.");
      console.error("Erreur lors de l'ajout :", err);
    }
  };

  return (
    <div className="container mt-4">
       <h2 className="mb-4 fw-bold" style={{ color: "#333" }}>🔍 Annalise des projets  par mois</h2>

      <Form>
        <div className="row">
          {/* Sélection du projet */}
          <div className="col-md-5">
            <Form.Group className="mb-3">
              <Form.Label>📌 Sélectionner un projet</Form.Label>
              <Form.Select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
                <option value="">Choisir un projet</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </div>

          {/* Sélection du mois */}
          <div className="col-md-5">
            <Form.Group className="mb-3">
              <Form.Label>📅 Sélectionner un mois</Form.Label>
              <Form.Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                <option value="">Choisir un mois</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                    {new Date(2025, i).toLocaleString("fr-FR", { month: "long" })}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </div>

          {/* Bouton Filtrer */}
          <div className="col-md-2 d-flex align-items-end">
            <Button variant="primary" onClick={handleFilter} className="w-100">
              Voir détail
            </Button>
          </div>
        </div>
      </Form>

      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}

      {loading ? (
        <div className="text-center mt-4">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Chargement...</span>
          </Spinner>
        </div>
      ) : filteredData.length > 0 ? (
        <Table striped bordered hover responsive className="mt-4">
          <thead className="table-dark">
            <tr>
              <th>Date</th>
              <th>Projet</th>
              <th>Mesure</th>
              <th>Objectif Mensuel</th>
              
              <th>Réalisation Mois à ce Jour</th>
              <th>Donnée Projet</th>
              <th>Cumul Réalisé</th>
              <th>% R/Projet</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((realisation) => {
              const project = projects.find((p) => p.id === realisation.projet);
              return (
                <tr key={realisation.id}>
                  <td>{realisation.date_rapport}</td>
                  <td>{project ? project.name : "Projet inconnu"}</td>
                  <td>{realisation.mesure}</td>
                  <td>{realisation.objectif_mensuel}</td>
                 
                  <td>{realisation.realisation_mois}</td>
                  <td>{realisation.donnee_projet}</td>
                  <td>{realisation.cumul_realise}</td>
                  <td>{realisation.pourcentage_r_projet}%</td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      ) : (
        <Alert variant="info" className="mt-3">Aucune donnée trouvée pour ce projet et ce mois.</Alert>
      )}

      {/* Modale pour ajouter la performance */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Ajouter une Performance</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleFormSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Projet</Form.Label>
              <Form.Select name="projet" value={formData.projet} onChange={handleFormChange} required>
                <option value="">Sélectionner un projet</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Mesure</Form.Label>
              <Form.Control
                as="select"
                name="mesure"
                value={formData.mesure}
                onChange={handleFormChange}
                required
              >
                <option value="">Sélectionner une mesure</option>
                <option value="PST en ml">PST en ml</option>
                <option value="Fondation en ml">Fondation en ml</option>
                <option value="C.Base en ml">C.Base en ml</option>
                <option value="Enrobe en ml">Enrobe en ml</option>
                <option value="Gasoil en l">Gasoil en l</option>
              </Form.Control>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Réalisation journalière</Form.Label>
              <Form.Control
                type="number"
                name="realisation_journee"
                value={formData.realisation_journee}
                onChange={handleFormChange}
                required
              />
            </Form.Group>

            <Button type="submit" variant="primary" className="w-100">
              Ajouter
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default FiltreProjetMois;
