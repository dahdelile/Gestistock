import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Card, 
  Row, Col, Spinner, Alert, 
  Badge, Form, Modal
} from 'react-bootstrap';
import { 
  FaTools, FaFilter, FaInfoCircle
} from 'react-icons/fa';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: { 'Content-Type': 'application/json' }
});

const EquipmentService = {
  async getEquipements() { 
    const response = await api.get('/voitures/');
    return response.data;
  },
  async getProjets() { 
    const response = await api.get('/projets/');
    return response.data;
  }
};

const EquipmentList = ({ equipements, projets, selectedProject, onProjectChange }) => {
  const [selectedEquipment, setSelectedEquipment] = useState(null);

  // Filtrer d'abord par catégorie Roulage, puis par projet si sélectionné
  const filteredEquipements = equipements
    .filter(e => e.category === 'ROULAGE')
    .filter(e => selectedProject ? 
      (e.projet_details?.id == selectedProject || e.projet == selectedProject) : 
      true);

  const getNomProjet = (projetData) => {
    if (!projetData) return 'Non affecté';
    // Si l'API retourne les détails complets du projet (projet_details)
    if (projetData.name) return projetData.name;
    // Si c'est juste l'ID du projet
    const projet = projets.find(p => p.id == projetData);
    return projet ? projet.name : 'Projet inconnu';
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center">
          <FaFilter className="me-2" />
          <Form.Select 
            style={{ width: '250px' }}
            value={selectedProject || ''}
            onChange={(e) => onProjectChange(e.target.value || null)}
          >
            <option value="">Tous les projets</option>
            {projets.map(projet => (
              <option key={projet.id} value={projet.id}>
                {projet.name}
              </option>
            ))}
          </Form.Select>
        </div>
        <Badge bg="success" className="fs-6">
          Roulage: {filteredEquipements.length} véhicule(s)
        </Badge>
      </div>

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>N°Matricule</th>
            <th>Type de véhicule</th>
            <th>Projet affecté</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredEquipements.map(voiture => (
            <tr key={voiture.id}>
              <td>{voiture.matricule}</td>
              <td>{voiture.type_voiture}</td>
              <td>{getNomProjet(voiture.projet_details || voiture.projet)}</td>
              <td>
                <Button 
                  variant="info" 
                  size="sm"
                  onClick={() => setSelectedEquipment(voiture)}
                >
                  <FaInfoCircle /> Détails
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modal des détails */}
      {selectedEquipment && (
        <Modal show onHide={() => setSelectedEquipment(null)}>
          <Modal.Header closeButton>
            <Modal.Title>Détails du véhicule</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p><strong>Matricule:</strong> {selectedEquipment.matricule}</p>
            <p><strong>Type:</strong> {selectedEquipment.type_voiture}</p>
            <p><strong>Catégorie:</strong> Véhicule de Roulage</p>
            <p><strong>Projet:</strong> {getNomProjet(selectedEquipment.projet_details || selectedEquipment.projet)}</p>
            <p><strong>Date d'acquisition:</strong> {new Date(selectedEquipment.date).toLocaleDateString('fr-FR')}</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setSelectedEquipment(null)}>
              Fermer
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </>
  );
};

const GestionEquipements = () => {
  const [state, setState] = useState({
    equipements: [],
    projets: [],
    loading: true,
    error: null,
    selectedProject: null
  });

  const handleProjectChange = (projectId) => {
    setState(prev => ({
      ...prev,
      selectedProject: projectId ? parseInt(projectId) : null
    }));
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [equipementsData, projetsData] = await Promise.all([
          EquipmentService.getEquipements(),
          EquipmentService.getProjets()
        ]);

        setState(prev => ({
          ...prev,
          equipements: equipementsData,
          projets: projetsData,
          loading: false
        }));
      } catch (err) {
        setState(prev => ({
          ...prev,
          error: "Erreur lors du chargement des données",
          loading: false
        }));
        console.error(err);
      }
    };
    loadData();
  }, []);

  return (
    <div className="container py-4">
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-success text-white">
          <h3 className="mb-0"><FaTools className="me-2" /> Véhicules de Roulage</h3>
        </Card.Header>
        <Card.Body>
          {state.loading ? (
            <Spinner animation="border" className="d-block mx-auto my-5" />
          ) : state.error ? (
            <Alert variant="danger">{state.error}</Alert>
          ) : (
            <EquipmentList 
              equipements={state.equipements} 
              projets={state.projets}
              selectedProject={state.selectedProject}
              onProjectChange={handleProjectChange}
            />
          )}
        </Card.Body>
      </Card>
    </div>
  );
};
export default GestionEquipements;