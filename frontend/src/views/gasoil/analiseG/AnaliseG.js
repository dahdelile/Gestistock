import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Card, 
  Row, Col, Spinner, Alert, 
  Badge, Form
} from 'react-bootstrap';
import { FaTools, FaFilter ,FaGasPump} from 'react-icons/fa';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: { 'Content-Type': 'application/json' }
});

const ConsommationService = {
  async getConsommations() {  
    const response = await api.get('/consommations/');
    return response.data.results;  // ✅ Prend uniquement les résultats paginés
  },
  async getProjets() { 
    const response = await api.get('/projets/');
    return response.data;
  },
};

const ConsommationList = ({ consommations, projets, selectedProject, onProjectChange }) => {
  const getProjetName = (projetData) => {
    if (!projetData) return 'Non affecté';

    // Si projetData est un objet
    if (typeof projetData === 'object' && projetData.name) {
      return projetData.name;
    }

    // Sinon chercher dans la liste des projets
    const projet = projets.find(p => p.id === projetData);
    return projet ? projet.name : 'Projet inconnu';
  };

  const filteredConsommations = selectedProject
    ? consommations.filter(c => 
        (c.projet_object && c.projet_object.id === selectedProject) ||
        (c.projet === selectedProject)
      )
    : consommations;

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
          Total: {filteredConsommations.length} consommation(s)
        </Badge>
      </div>

      <Table striped bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th>Date</th>
            <th>Projet</th>
            <th>Consommation jour</th>
            <th>Cumul mensuel</th>
            <th>Cumul annuel</th>
          </tr>
        </thead>
        <tbody>
          {filteredConsommations.map((c) => (
            <tr key={c.id}>
              <td>{c.date_consommation}</td>
              <td>{getProjetName(c.projet_object)}</td>
              <td>{c.consommation_jour}</td>
              <td>{c.cumul_mensuel}</td>
              <td>{c.cumul_annuel}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
};

const GestionConsommations = () => {
  const [state, setState] = useState({
    consommations: [],
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
        const [consommationsData, projetsData] = await Promise.all([
          ConsommationService.getConsommations(),
          ConsommationService.getProjets(),
        ]);

        setState(prev => ({
          ...prev,
          consommations: consommationsData,
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

  if (state.loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" variant="success" />
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="container py-4">
        <Alert variant="danger">{state.error}</Alert>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-success text-white text-center ">
        
          <h3 className="mb-0"><FaGasPump className="me-2" /> Liste des consommations</h3>
        </Card.Header>
        <Card.Body>
          <ConsommationList 
            consommations={state.consommations}
            projets={state.projets}
            selectedProject={state.selectedProject}
            onProjectChange={handleProjectChange}
          />
        </Card.Body>
      </Card>
    </div>
  );
};

export default GestionConsommations;
