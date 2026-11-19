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

const ChauffeurService = {
  async getChauffeurs() { 
    const response = await api.get('/chauffeurs/');
    return response.data;
  },
  async getProjets() { 
    const response = await api.get('/projets/');
    return response.data;
  },
  async getVoitures() { 
    const response = await api.get('/voitures/');
    return response.data;
  }
};

const ChauffeurList = ({ chauffeurs, projets, voitures, selectedProject, onProjectChange }) => {
  const getVoitureInfo = (voitureData) => {
    if (!voitureData) return 'Non affecté';
    if (voitureData.matricule) return voitureData.matricule;
    const voiture = voitures.find(v => v.id == voitureData);
    return voiture ? voiture.matricule : 'Véhicule inconnu';
  };

  const getProjetName = (projetData) => {
    if (!projetData) return 'Non affecté';
    if (projetData.name) return projetData.name;
    const projet = projets.find(p => p.id == projetData);
    return projet ? projet.name : 'Projet inconnu';
  };

  // Filtrer les chauffeurs par projet si un projet est sélectionné
  const filteredChauffeurs = selectedProject
    ? chauffeurs.filter(chauffeur => 
        (chauffeur.projet_details && chauffeur.projet_details.id === selectedProject) ||
        (chauffeur.projet === selectedProject)
      )
    : chauffeurs;

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
          Total: {filteredChauffeurs.length} chauffeur(s)
        </Badge>
      </div>

      <Table striped bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th>N°ATTM</th>
            <th>Nom Chauffeur</th>
            <th>Statut</th>
            <th>Equipement</th>
            <th>Projet/Site</th>
          </tr>
        </thead>
        <tbody>
          {filteredChauffeurs.map((chauffeur) => (
            <tr key={chauffeur.id}>
              <td>{chauffeur.matricule}</td>
              <td>{chauffeur.nom}</td>
              <td>
                <Badge bg={
                  chauffeur.statut === 'ACTIF' ? 'success' :
                  chauffeur.statut === 'INACTIF' ? 'danger' :
                  chauffeur.statut === 'EN_CONGE' ? 'warning' :
                  chauffeur.statut === 'EN_MISSION' ? 'primary' : 'secondary'
                }>
                  {chauffeur.statut}
                </Badge>
              </td>
              <td>{getVoitureInfo(chauffeur.voiture_details || chauffeur.voiture)}</td>
              <td>{getProjetName(chauffeur.projet_details || chauffeur.projet)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
};

const GestionChauffeurs = () => {
  const [state, setState] = useState({
    chauffeurs: [],
    projets: [],
    voitures: [],
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
        const [chauffeursData, projetsData, voituresData] = await Promise.all([
          ChauffeurService.getChauffeurs(),
          ChauffeurService.getProjets(),
          ChauffeurService.getVoitures()
        ]);

        setState(prev => ({
          ...prev,
          chauffeurs: chauffeursData,
          projets: projetsData,
          voitures: voituresData,
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
          <h3 className="mb-0"><FaTools className="me-2" /> Liste des chauffeurs</h3>
        </Card.Header>
        <Card.Body>
          {state.loading ? (
            <Spinner animation="border" className="d-block mx-auto my-5" />
          ) : state.error ? (
            <Alert variant="danger">{state.error}</Alert>
          ) : (
            <ChauffeurList 
              chauffeurs={state.chauffeurs} 
              projets={state.projets}
              voitures={state.voitures}
              selectedProject={state.selectedProject}
              onProjectChange={handleProjectChange}
            />
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default GestionChauffeurs;