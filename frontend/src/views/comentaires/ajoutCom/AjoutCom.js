import React, { useState, useEffect } from 'react';
import { Tab, Tabs, Table, Form, Button, Modal, Card, Row, Col } from 'react-bootstrap';

const App = () => {
  // États pour les données
  const [chauffeurs, setChauffeurs] = useState([]);
  const [equipements, setEquipements] = useState([]);
  const [maintenances, setMaintenances] = useState([]);
  const [arrets, setArrets] = useState([]);
  const [entretiens, setEntretiens] = useState([]);
  
  // États pour les formulaires
  const [showChauffeurModal, setShowChauffeurModal] = useState(false);
  const [showEquipementModal, setShowEquipementModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  
  // États pour les données de formulaire
  const [chauffeurForm, setChauffeurForm] = useState({
    nom: '',
    prenom: '',
    matricule: '',
    type_permis: 'B',
    statut: 'ACTIF',
    telephone: ''
  });
  
  const [equipementForm, setEquipementForm] = useState({
    matricule: '',
    type_equipement: 'CAMION',
    statut: 'OPERATIONNEL',
    chauffeur_attitre: ''
  });
  
  const [maintenanceForm, setMaintenanceForm] = useState({
    equipement: '',
    type: 'PREVENTIVE',
    statut: 'PLANIFIEE',
    description: ''
  });

  // Chargement initial des données
  useEffect(() => {
    // Ici vous devriez faire des appels API réels
    const loadData = async () => {
      // Simuler des données
      setChauffeurs([
        { id: 1, nom: 'Dupont', prenom: 'Jean', matricule: 'CH001', type_permis: 'B', statut: 'ACTIF', telephone: '0612345678' },
        { id: 2, nom: 'Martin', prenom: 'Pierre', matricule: 'CH002', type_permis: 'C', statut: 'ACTIF', telephone: '0623456789' }
      ]);
      
      setEquipements([
        { id: 1, matricule: 'EQ001', type_equipement: 'CAMION', statut: 'OPERATIONNEL', chauffeur_attitre: 1 },
        { id: 2, matricule: 'EQ002', type_equipement: 'PELLETEUSE', statut: 'EN_MAINTENANCE', chauffeur_attitre: null }
      ]);
      
      setMaintenances([
        { id: 1, equipement: 1, type: 'PREVENTIVE', statut: 'TERMINEE', description: 'Vidange complète' },
        { id: 2, equipement: 2, type: 'CORRECTIVE', statut: 'EN_COURS', description: 'Réparation moteur' }
      ]);
    };
    
    loadData();
  }, []);

  // Gestion des formulaires
  const handleChauffeurSubmit = (e) => {
    e.preventDefault();
    const newChauffeur = {
      ...chauffeurForm,
      id: chauffeurs.length + 1
    };
    setChauffeurs([...chauffeurs, newChauffeur]);
    setShowChauffeurModal(false);
    setChauffeurForm({
      nom: '',
      prenom: '',
      matricule: '',
      type_permis: 'B',
      statut: 'ACTIF',
      telephone: ''
    });
  };

  const handleEquipementSubmit = (e) => {
    e.preventDefault();
    const newEquipement = {
      ...equipementForm,
      id: equipements.length + 1
    };
    setEquipements([...equipements, newEquipement]);
    setShowEquipementModal(false);
    setEquipementForm({
      matricule: '',
      type_equipement: 'CAMION',
      statut: 'OPERATIONNEL',
      chauffeur_attitre: ''
    });
  };

  const handleMaintenanceSubmit = (e) => {
    e.preventDefault();
    const newMaintenance = {
      ...maintenanceForm,
      id: maintenances.length + 1,
      date_planifiee: new Date().toISOString().split('T')[0]
    };
    setMaintenances([...maintenances, newMaintenance]);
    setShowMaintenanceModal(false);
    setMaintenanceForm({
      equipement: '',
      type: 'PREVENTIVE',
      statut: 'PLANIFIEE',
      description: ''
    });
  };

  // Statistiques pour le dashboard
  const activeMaintenances = maintenances.filter(m => m.statut === 'EN_COURS').length;
  const equipementsEnPanne = equipements.filter(e => e.statut === 'EN_PANNE').length;

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Gestion des Équipements et Chauffeurs</h1>
      
      {/* Dashboard */}
      <Row className="mb-4">
        <Col md={3}>
          <Card>
            <Card.Body>
              <Card.Title>Chauffeurs</Card.Title>
              <Card.Text>
                <h3>{chauffeurs.length}</h3>
                <small>Chauffeurs actifs</small>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card>
            <Card.Body>
              <Card.Title>Équipements</Card.Title>
              <Card.Text>
                <h3>{equipements.length}</h3>
                <small>Dont {equipementsEnPanne} en panne</small>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card>
            <Card.Body>
              <Card.Title>Maintenances</Card.Title>
              <Card.Text>
                <h3>{maintenances.length}</h3>
                <small>Dont {activeMaintenances} en cours</small>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card>
            <Card.Body>
              <Card.Title>Actions</Card.Title>
              <Card.Text>
                <Button variant="primary" size="sm" className="me-2" onClick={() => setShowChauffeurModal(true)}>
                  Ajouter Chauffeur
                </Button>
                <Button variant="success" size="sm" onClick={() => setShowEquipementModal(true)}>
                  Ajouter Équipement
                </Button>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Onglets */}
      <Tabs defaultActiveKey="equipements" id="main-tabs" className="mb-3">
        <Tab eventKey="equipements" title="Équipements">
          <div className="d-flex justify-content-between mb-3">
            <h3>Liste des Équipements</h3>
            <Button variant="primary" onClick={() => setShowEquipementModal(true)}>
              Ajouter Équipement
            </Button>
          </div>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Matricule</th>
                <th>Type</th>
                <th>Statut</th>
                <th>Chauffeur</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {equipements.map(equipement => (
                <tr key={equipement.id}>
                  <td>{equipement.matricule}</td>
                  <td>{equipement.type_equipement}</td>
                  <td>{equipement.statut}</td>
                  <td>
                    {equipement.chauffeur_attitre 
                      ? chauffeurs.find(c => c.id === equipement.chauffeur_attitre)?.prenom + ' ' + 
                        chauffeurs.find(c => c.id === equipement.chauffeur_attitre)?.nom
                      : 'Non affecté'}
                  </td>
                  <td>
                    <Button variant="info" size="sm" className="me-2">
                      Détails
                    </Button>
                    <Button variant="warning" size="sm" onClick={() => setShowMaintenanceModal(true)}>
                      Maintenance
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Tab>
        
        <Tab eventKey="chauffeurs" title="Chauffeurs">
          <div className="d-flex justify-content-between mb-3">
            <h3>Liste des Chauffeurs</h3>
            <Button variant="primary" onClick={() => setShowChauffeurModal(true)}>
              Ajouter Chauffeur
            </Button>
          </div>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Matricule</th>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Permis</th>
                <th>Statut</th>
                <th>Téléphone</th>
              </tr>
            </thead>
            <tbody>
              {chauffeurs.map(chauffeur => (
                <tr key={chauffeur.id}>
                  <td>{chauffeur.matricule}</td>
                  <td>{chauffeur.nom}</td>
                  <td>{chauffeur.prenom}</td>
                  <td>{chauffeur.type_permis}</td>
                  <td>{chauffeur.statut}</td>
                  <td>{chauffeur.telephone}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Tab>
        
        <Tab eventKey="maintenances" title="Maintenances">
          <h3 className="mb-3">Historique des Maintenances</h3>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Équipement</th>
                <th>Type</th>
                <th>Statut</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {maintenances.map(maintenance => (
                <tr key={maintenance.id}>
                  <td>{equipements.find(e => e.id === maintenance.equipement)?.matricule}</td>
                  <td>{maintenance.type}</td>
                  <td>{maintenance.statut}</td>
                  <td>{maintenance.description}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Tab>
      </Tabs>
      
      {/* Modals pour les formulaires */}
      <Modal show={showChauffeurModal} onHide={() => setShowChauffeurModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Ajouter un Chauffeur</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleChauffeurSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nom</Form.Label>
              <Form.Control 
                type="text" 
                value={chauffeurForm.nom} 
                onChange={(e) => setChauffeurForm({...chauffeurForm, nom: e.target.value})} 
                required 
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Prénom</Form.Label>
              <Form.Control 
                type="text" 
                value={chauffeurForm.prenom} 
                onChange={(e) => setChauffeurForm({...chauffeurForm, prenom: e.target.value})} 
                required 
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Matricule</Form.Label>
              <Form.Control 
                type="text" 
                value={chauffeurForm.matricule} 
                onChange={(e) => setChauffeurForm({...chauffeurForm, matricule: e.target.value})} 
                required 
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Type de permis</Form.Label>
              <Form.Select 
                value={chauffeurForm.type_permis} 
                onChange={(e) => setChauffeurForm({...chauffeurForm, type_permis: e.target.value})}
              >
                <option value="A">Permis A (Motos)</option>
                <option value="B">Permis B (Voitures)</option>
                <option value="C">Permis C (Poids lourds)</option>
                <option value="D">Permis D (Autobus)</option>
                <option value="E">Permis E (Remorques)</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Téléphone</Form.Label>
              <Form.Control 
                type="tel" 
                value={chauffeurForm.telephone} 
                onChange={(e) => setChauffeurForm({...chauffeurForm, telephone: e.target.value})} 
                required 
              />
            </Form.Group>
            <Button variant="primary" type="submit">
              Enregistrer
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
      
      <Modal show={showEquipementModal} onHide={() => setShowEquipementModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Ajouter un Équipement</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleEquipementSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Matricule</Form.Label>
              <Form.Control 
                type="text" 
                value={equipementForm.matricule} 
                onChange={(e) => setEquipementForm({...equipementForm, matricule: e.target.value})} 
                required 
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Type d'équipement</Form.Label>
              <Form.Select 
                value={equipementForm.type_equipement} 
                onChange={(e) => setEquipementForm({...equipementForm, type_equipement: e.target.value})}
              >
                <option value="CAMION">Camion</option>
                <option value="PELLETEUSE">Pelle mécanique</option>
                <option value="CHARGEUSE">Chargeuse</option>
                <option value="BULLDOZER">Bulldozer</option>
                <option value="NIVELEUSE">Niveleuse</option>
                <option value="AUTRE">Autre</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Chauffeur attitré</Form.Label>
              <Form.Select 
                value={equipementForm.chauffeur_attitre} 
                onChange={(e) => setEquipementForm({...equipementForm, chauffeur_attitre: e.target.value})}
              >
                <option value="">Non affecté</option>
                {chauffeurs.map(chauffeur => (
                  <option key={chauffeur.id} value={chauffeur.id}>
                    {chauffeur.prenom} {chauffeur.nom} ({chauffeur.matricule})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Button variant="primary" type="submit">
              Enregistrer
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
      
      <Modal show={showMaintenanceModal} onHide={() => setShowMaintenanceModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Planifier une Maintenance</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleMaintenanceSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Équipement</Form.Label>
              <Form.Select 
                value={maintenanceForm.equipement} 
                onChange={(e) => setMaintenanceForm({...maintenanceForm, equipement: e.target.value})}
                required
              >
                <option value="">Sélectionner un équipement</option>
                {equipements.map(equipement => (
                  <option key={equipement.id} value={equipement.id}>
                    {equipement.matricule} ({equipement.type_equipement})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Type de maintenance</Form.Label>
              <Form.Select 
                value={maintenanceForm.type} 
                onChange={(e) => setMaintenanceForm({...maintenanceForm, type: e.target.value})}
              >
                <option value="PREVENTIVE">Préventive</option>
                <option value="CORRECTIVE">Corrective</option>
                <option value="PREDICTIVE">Prédictive</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                value={maintenanceForm.description} 
                onChange={(e) => setMaintenanceForm({...maintenanceForm, description: e.target.value})} 
                required 
              />
            </Form.Group>
            <Button variant="primary" type="submit">
              Planifier
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default App;