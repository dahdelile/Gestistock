import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Modal, Button, Form, Spinner, Alert, 
  Badge, Table, InputGroup, Card, Row, Col 
} from 'react-bootstrap';
import { 
  FaEdit, FaTrash, FaSearch, FaFilter, 
  FaTimes, FaTachometerAlt, FaFileExport,
  FaPlus, FaCar, FaMapMarkerAlt, FaCog,
  FaCalendarAlt, FaProjectDiagram
} from 'react-icons/fa';

const GestionProductionEngin = () => {
  // États principaux
  const [heuresMarche, setHeuresMarche] = useState([]);
  const [engins, setEngins] = useState([]);
  const [projets, setProjets] = useState([]);
  const [formData, setFormData] = useState({
    engin: '',
    projet: '',
    date: new Date().toISOString().split('T')[0],
    hdm_debut: '',
    hdm_fin: '',
    observation: ''
  });
  const [selectedEnginType, setSelectedEnginType] = useState('');
  const [selectedEnginProjet, setSelectedEnginProjet] = useState('');

  const [showMainTable, setShowMainTable] = useState(true);
  const [showCumulsTable, setShowCumulsTable] = useState(false);
  const [filters, setFilters] = useState({
    searchTerm: '',
    filterEngin: '',
    filterProjet: '',
    dateDebut: '',
    dateFin: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [cumuls, setCumuls] = useState({
    hebdomadaire: [],
    mensuel: [],
    annuel: []
  });
  const [periodeActive, setPeriodeActive] = useState('hebdomadaire');

  // Fonction pour calculer le HDM journalier
  const calculerHdmJour = (hdmDebut, hdmFin) => {
    if (!hdmDebut || !hdmFin) return 0;
    
    try {
      const debut = parseFloat(hdmDebut);
      const fin = parseFloat(hdmFin);
      
      return fin - debut;
    } catch (error) {
      console.error('Erreur calcul HDM jour:', error);
      return 0;
    }
  };

  // Charger les données initiales
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const [enginsRes, projetsRes] = await Promise.all([
          axios.get('https://intranet-attm.com/api/engins/'),
          axios.get('https://intranet-attm.com/api/projets/')
        ]);

        setEngins(enginsRes.data);
        setProjets(projetsRes.data);

        try {
          const heuresMarcheRes = await axios.get('https://intranet-attm.com/api/heures-marche/');
          
          const projetsMap = new Map(projetsRes.data.map(p => [p.id, p]));
          const enginsMap = new Map(enginsRes.data.map(e => [e.id, e]));

          const enhancedHeuresMarche = heuresMarcheRes.data.map(heureMarche => {
            const enginData = enginsMap.get(heureMarche.engin);

            const enginInfo = enginData ? {
              id: enginData.id,
              matricule: enginData.matricule || '-',
              marque: enginData.marque || '-',
              modele: enginData.modele || '-',
              type_engin: enginData.type_engin_display || enginData.type_engin || 'Non spécifié',
              projet: enginData.projet
            } : {
              id: heureMarche.engin,
              matricule: 'Engin introuvable',
              marque: '-',
              modele: '-',
              type_engin: '-',
              projet: null
            };

            // Utiliser le HDM du backend ou calculer localement
            const hdmJourCalcule = heureMarche.hdm_jour || 
                                 calculerHdmJour(heureMarche.hdm_debut, heureMarche.hdm_fin);

            return {
              ...heureMarche,
              engin_info: enginInfo,
              projet_info: projetsMap.get(heureMarche.projet) || null,
              projet_name: projetsMap.get(heureMarche.projet)?.name || 'Non attribué',
              hdm_jour: hdmJourCalcule,
              hdm_cumule: heureMarche.hdm_cumule || 0
            };
          });

          setHeuresMarche(enhancedHeuresMarche);
        } catch (heuresError) {
          console.warn('Impossible de charger les heures de marche:', heuresError.message);
          setHeuresMarche([]);
          setError('Les heures de marche ne peuvent pas être chargées pour le moment. Vous pouvez toujours ajouter de nouvelles heures.');
        }
        
      } catch (err) {
        console.error('Erreur de chargement des données:', err);
        setError('Erreur de chargement des données de base');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Gestion du changement d'engin dans le formulaire
  const handleEnginChange = (e) => {
    const enginId = e.target.value;
    setFormData(prev => ({ ...prev, engin: enginId }));

    // Réinitialiser les champs automatiques
    setSelectedEnginType('');
    setSelectedEnginProjet('');

    // Trouver l'engin sélectionné et afficher son type et projet
    if (enginId) {
      const selectedEngin = engins.find(engin => engin.id === parseInt(enginId));
      if (selectedEngin) {
        // Afficher le type d'engin
        const typeEngin = selectedEngin.type_engin_display || 
                         selectedEngin.type_engin || 
                         'Type non spécifié';
        setSelectedEnginType(typeEngin);

        // Afficher le projet de l'engin
        if (selectedEngin.projet) {
          const projetEngin = projets.find(p => p.id === selectedEngin.projet);
          if (projetEngin) {
            setSelectedEnginProjet(projetEngin.name);
            setFormData(prev => ({ ...prev, projet: selectedEngin.projet }));
          } else {
            setSelectedEnginProjet('Projet non trouvé');
          }
        } else {
          setSelectedEnginProjet('Aucun projet attribué');
        }
      } else {
        setSelectedEnginType('Engin non trouvé');
        setSelectedEnginProjet('Engin non trouvé');
      }
    }
  };

  // Gestion des erreurs API
  const handleApiError = (err, defaultMessage) => {
    console.error('API Error:', err);
    let errorMessage = defaultMessage;
    
    if (err.response) {
      errorMessage = `Erreur ${err.response.status}: ${err.response.statusText}`;
      if (err.response.data) {
        if (typeof err.response.data === 'object') {
          errorMessage += ` - ${JSON.stringify(err.response.data)}`;
        } else {
          errorMessage += ` - ${err.response.data}`;
        }
      }
    } else if (err.request) {
      errorMessage = 'Erreur réseau: Impossible de contacter le serveur';
    } else {
      errorMessage = err.message;
    }
    
    setError(errorMessage);
  };

  // Filtrer les heures de marche
  const filteredHeuresMarche = heuresMarche
    .filter(heureMarche => {
      const searchTerm = filters.searchTerm.toLowerCase();
      const matchesSearch = 
        heureMarche.engin_info?.matricule?.toLowerCase().includes(searchTerm) ||
        heureMarche.engin_info?.marque?.toLowerCase().includes(searchTerm) ||
        heureMarche.engin_info?.modele?.toLowerCase().includes(searchTerm) ||
        heureMarche.projet_name.toLowerCase().includes(searchTerm) ||
        heureMarche.engin_info?.type_engin?.toLowerCase().includes(searchTerm);

      const matchesEngin = !filters.filterEngin || heureMarche.engin === parseInt(filters.filterEngin);
      const matchesProjet = !filters.filterProjet || heureMarche.projet === parseInt(filters.filterProjet);
      
      try {
        const prodDate = new Date(heureMarche.date);
        const matchesDateDebut = !filters.dateDebut || prodDate >= new Date(filters.dateDebut);
        const matchesDateFin = !filters.dateFin || prodDate <= new Date(filters.dateFin + 'T23:59');
        return matchesSearch && matchesEngin && matchesProjet && matchesDateDebut && matchesDateFin;
      } catch {
        return matchesSearch && matchesEngin && matchesProjet;
      }
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Calcul des cumuls d'heures
  useEffect(() => {
    if (heuresMarche.length === 0) return;

    const grouperParPeriode = (periode) => {
      const groupes = {};

      filteredHeuresMarche.forEach(heureMarche => {
        try {
          const date = new Date(heureMarche.date);
          let cle;
          
          const enginId = heureMarche.engin;
          const enginMatricule = heureMarche.engin_info?.matricule || 'Inconnu';
          const enginType = heureMarche.engin_info?.type_engin || 'Inconnu';
          
          if (periode === 'hebdomadaire') {
            const onejan = new Date(date.getFullYear(), 0, 1);
            const weekNum = Math.ceil((((date - onejan) / 86400000) + onejan.getDay() + 1) / 7);
            cle = `S${weekNum.toString().padStart(2, '0')}-${date.getFullYear()}|${enginId}|${enginMatricule}|${enginType}`;
          } else if (periode === 'mensuel') {
            const month = date.toLocaleString('fr-FR', { month: 'long' });
            cle = `${month} ${date.getFullYear()}|${enginId}|${enginMatricule}|${enginType}`;
          } else {
            cle = `${date.getFullYear()}|${enginId}|${enginMatricule}|${enginType}`;
          }

          if (!groupes[cle]) {
            groupes[cle] = {
              periode: cle.split('|')[0],
              engin_id: enginId,
              engin_matricule: enginMatricule,
              engin_type: enginType,
              heures_total: 0,
              count: 0
            };
          }

          groupes[cle].heures_total += heureMarche.hdm_jour || 0;
          groupes[cle].count += 1;
        } catch (e) {
          console.error("Erreur de traitement de l'heure de marche:", e);
        }
      });

      return Object.values(groupes).sort((a, b) => b.heures_total - a.heures_total);
    };

    setCumuls({
      hebdomadaire: grouperParPeriode('hebdomadaire'),
      mensuel: grouperParPeriode('mensuel'),
      annuel: grouperParPeriode('annuel')
    });
  }, [heuresMarche, filters]);

  // Gestion des changements de formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'projet' && value) {
      const projetSelectionne = projets.find(p => p.id === parseInt(value));
      if (projetSelectionne) {
        setSelectedEnginProjet(projetSelectionne.name);
      }
    }
  };

  // Validation du formulaire
  const validateForm = () => {
    const errors = {};
    
    if (!formData.engin) {
      errors.engin = 'Veuillez sélectionner un engin';
    }
    
    if (!formData.date) {
      errors.date = 'La date est requise';
    }
    
    if (!formData.hdm_debut) {
      errors.hdm_debut = 'Le HDM début est requis';
    } else if (isNaN(formData.hdm_debut) || parseFloat(formData.hdm_debut) < 0) {
      errors.hdm_debut = 'Le HDM début doit être un nombre positif';
    }
    
    if (!formData.hdm_fin) {
      errors.hdm_fin = 'Le HDM fin est requis';
    } else if (isNaN(formData.hdm_fin) || parseFloat(formData.hdm_fin) < 0) {
      errors.hdm_fin = 'Le HDM fin doit être un nombre positif';
    } else if (formData.hdm_debut && formData.hdm_fin) {
      const hdmDebut = parseFloat(formData.hdm_debut);
      const hdmFin = parseFloat(formData.hdm_fin);
      
      if (hdmFin <= hdmDebut) {
        errors.hdm_fin = 'Le HDM fin doit être supérieur au HDM début';
      }
    }

    if (Object.keys(errors).length > 0) {
      setError(Object.values(errors).join('\n'));
      return false;
    }
    
    return true;
  };

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload = {
        engin: formData.engin,
        projet: formData.projet || null,
        date: formData.date,
        hdm_debut: parseFloat(formData.hdm_debut),
        hdm_fin: parseFloat(formData.hdm_fin),
        observation: formData.observation || ''
      };

      if (editingId) {
        await axios.put(`https://intranet-attm.com/api/heures-marche/${editingId}/`, payload);
        setSuccess('Heure de marche modifiée avec succès');
      } else {
        await axios.post('https://intranet-attm.com/api/heures-marche/', payload);
        setSuccess('Heure de marche ajoutée avec succès');
      }

      window.location.reload();
    } catch (err) {
      handleApiError(err, 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  // Ajouter une nouvelle heure de marche
  const handleAddHeureMarche = () => {
    setFormData({
      engin: '',
      projet: '',
      date: new Date().toISOString().split('T')[0],
      hdm_debut: '',
      hdm_fin: '',
      observation: ''
    });
    setSelectedEnginType('');
    setSelectedEnginProjet('');
    setEditingId(null);
    setError(null);
    setSuccess(null);
    setShowModal(true);
  };

  // Modifier une heure de marche existante
  const handleEdit = (heureMarche) => {
    setFormData({
      engin: heureMarche.engin,
      projet: heureMarche.projet || '',
      date: heureMarche.date,
      hdm_debut: heureMarche.hdm_debut,
      hdm_fin: heureMarche.hdm_fin,
      observation: heureMarche.observation || ''
    });

    const enginData = engins.find(e => e.id === heureMarche.engin);
    if (enginData) {
      const typeEngin = enginData.type_engin_display || 
                       enginData.type_engin || 
                       'Type non spécifié';
      setSelectedEnginType(typeEngin);

      if (enginData.projet) {
        const projetEngin = projets.find(p => p.id === enginData.projet);
        if (projetEngin) {
          setSelectedEnginProjet(projetEngin.name);
        } else {
          setSelectedEnginProjet('Projet non trouvé');
        }
      } else {
        setSelectedEnginProjet('Aucun projet attribué');
      }
    } else {
      setSelectedEnginType('Engin non trouvé');
      setSelectedEnginProjet('Engin non trouvé');
    }

    setEditingId(heureMarche.id);
    setError(null);
    setSuccess(null);
    setShowModal(true);
  };

  // Supprimer une heure de marche
  const handleDelete = async (id) => {
    if (window.confirm('Confirmez la suppression de cette heure de marche ?')) {
      setLoading(true);
      try {
        await axios.delete(`https://intranet-attm.com/api/heures-marche/${id}/`);
        setSuccess('Heure de marche supprimée avec succès');
        setHeuresMarche(heuresMarche.filter(h => h.id !== id));
      } catch (err) {
        handleApiError(err, 'Erreur de suppression');
      } finally {
        setLoading(false);
      }
    }
  };

  // Basculer entre les vues
  const toggleTables = () => {
    setShowMainTable(!showMainTable);
    setShowCumulsTable(!showCumulsTable);
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      filterEngin: '',
      filterProjet: '',
      dateDebut: '',
      dateFin: ''
    });
  };

  // Gestion des changements de filtre
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Exporter les cumuls
  const exporterCumuls = () => {
    const data = cumuls[periodeActive];
    if (data.length === 0) {
      setError('Aucune donnée à exporter');
      return;
    }

    const headers = ['Période', 'Engin', 'Type d\'Engin', 'HDM Total', 'Nb. Entrées'];
    const csvRows = [
      headers.join(','),
      ...data.map(item => [
        `"${item.periode}"`,
        `"${item.engin_matricule}"`,
        `"${item.engin_type}"`,
        item.heures_total.toFixed(2),
        item.count
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cumuls_hdm_${periodeActive}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Composant Tableau des cumuls
  const CumulsTable = () => (
    <Card className="mb-4 shadow-sm">
      <Card.Header className="bg-info text-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <FaTachometerAlt className="me-2" />
          Cumuls des HDM par Période
        </h5>
        <div>
          <Button variant="light" size="sm" className="me-2" onClick={exporterCumuls}>
            <FaFileExport className="me-1" /> Exporter
          </Button>
          <Button
            variant={periodeActive === 'hebdomadaire' ? 'light' : 'outline-light'}
            size="sm"
            className="me-2"
            onClick={() => setPeriodeActive('hebdomadaire')}
          >
            Hebdo
          </Button>
          <Button
            variant={periodeActive === 'mensuel' ? 'light' : 'outline-light'}
            size="sm"
            className="me-2"
            onClick={() => setPeriodeActive('mensuel')}
          >
            Mensuel
          </Button>
          <Button
            variant={periodeActive === 'annuel' ? 'light' : 'outline-light'}
            size="sm"
            onClick={() => setPeriodeActive('annuel')}
          >
            Annuel
          </Button>
          <Button variant="light" size="sm" onClick={toggleTables} className="ms-2">
            <FaTimes />
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>N°</th>
                <th>Période</th>
                <th>Engin</th>
                <th>Type d'Engin</th>
                <th>HDM Total</th>
                <th>Nb. Entrées</th>
              </tr>
            </thead>
            <tbody>
              {cumuls[periodeActive]?.length > 0 ? (
                cumuls[periodeActive].map((cumul, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{cumul.periode}</td>
                    <td>{cumul.engin_matricule}</td>
                    <td>
                      <Badge bg="secondary">
                        <FaCog className="me-1" />
                        {cumul.engin_type}
                      </Badge>
                    </td>
                    <td>{cumul.heures_total.toFixed(2)}h</td>
                    <td>{cumul.count}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-3">
                    Aucune donnée disponible
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card.Body>
    </Card>
  );

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">Gestion des Heures de Marche des Engins</h2>

      {/* Alertes d'erreur/succès */}
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}

      {/* Boutons d'action */}
      <div className="d-flex justify-content-between mb-3">
        <Button 
          variant="primary" 
          onClick={handleAddHeureMarche}
          disabled={loading}
        >
          <FaPlus className="me-1" />
          Ajouter une Heure de Marche
        </Button>
        
        <Button 
          variant="info" 
          onClick={toggleTables}
          disabled={loading}
        >
          {showCumulsTable ? 'Afficher le tableau principal' : 'Afficher les cumuls'}
        </Button>
      </div>

      {/* Tableau des cumuls */}
      {showCumulsTable && <CumulsTable />}

      {/* Filtres */}
      {showMainTable && (
        <Card className="mb-3 shadow-sm">
          <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <FaFilter className="me-2" /> Filtres
            </h5>
            <Button variant="light" size="sm" onClick={resetFilters}>
              <FaTimes className="me-1" /> Réinitialiser
            </Button>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Recherche</Form.Label>
                  <InputGroup>
                    <InputGroup.Text><FaSearch /></InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Matricule, marque, modèle, type ou projet..."
                      name="searchTerm"
                      value={filters.searchTerm}
                      onChange={handleFilterChange}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label>Engin</Form.Label>
                  <Form.Select
                    name="filterEngin"
                    value={filters.filterEngin}
                    onChange={handleFilterChange}
                  >
                    <option value="">Tous</option>
                    {engins.map(engin => (
                      <option key={engin.id} value={engin.id}>
                        {engin.matricule} - {engin.marque}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label>Projet</Form.Label>
                  <Form.Select
                    name="filterProjet"
                    value={filters.filterProjet}
                    onChange={handleFilterChange}
                  >
                    <option value="">Tous</option>
                    {projets.map(projet => (
                      <option key={projet.id} value={projet.id}>
                        {projet.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={2}>
                <Form.Group>
                  <Form.Label>Date début</Form.Label>
                  <Form.Control
                    type="date"
                    name="dateDebut"
                    value={filters.dateDebut}
                    onChange={handleFilterChange}
                  />
                </Form.Group>
              </Col>
              
              <Col md={2}>
                <Form.Group>
                  <Form.Label>Date fin</Form.Label>
                  <Form.Control
                    type="date"
                    name="dateFin"
                    value={filters.dateFin}
                    onChange={handleFilterChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Tableau principal */}
      {showMainTable && (
        loading ? (
          <div className="text-center my-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Chargement en cours...</p>
          </div>
        ) : (
          <Card className="shadow-sm">
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table striped bordered hover className="mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th>Date</th>
                      <th>Engin</th>
                      <th>Type d'Engin</th>
                      <th>Projet</th>
                      <th>HDM Début</th>
                      <th>HDM Fin</th>
                      <th>HDM Jour</th>
                      <th>HDM Cumulé</th>
                      <th>Observation</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHeuresMarche.length > 0 ? (
                      filteredHeuresMarche.map(heureMarche => (
                        <tr key={heureMarche.id}>
                          <td>
                            <FaCalendarAlt className="me-2 text-muted" />
                            {new Date(heureMarche.date).toLocaleDateString('fr-FR')}
                          </td>
                          <td>
                            <div>
                              <FaCar className="me-2 text-muted" />
                              <strong>{heureMarche.engin_info?.matricule || 'N/A'}</strong>
                            </div>
                          </td>
                          <td>
                            <Badge bg="primary">
                              <FaCog className="me-1" />
                              {heureMarche.engin_info?.type_engin || '-'}
                            </Badge>
                          </td>
                          <td>{heureMarche.projet_name}</td>
                          <td>{heureMarche.hdm_debut}h</td>
                          <td>{heureMarche.hdm_fin}h</td>
                          <td>
                            <Badge bg="info">
                              {heureMarche.hdm_jour.toFixed(2)}h
                            </Badge>
                          </td>
                          <td>
                            <Badge bg="secondary">
                              {heureMarche.hdm_cumule.toFixed(2)}h
                            </Badge>
                          </td>
                          <td>{heureMarche.observation || '-'}</td>
                          <td>
                            <Button
                              variant="outline-warning"
                              size="sm"
                              className="me-2"
                              onClick={() => handleEdit(heureMarche)}
                              title="Modifier"
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDelete(heureMarche.id)}
                              title="Supprimer"
                            >
                              <FaTrash />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="10" className="text-center py-4">
                          {heuresMarche.length === 0 ? 
                            'Aucune heure de marche enregistrée' : 
                            'Aucune heure de marche ne correspond aux critères de filtrage'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        )
      )}

      {/* Modal d'ajout/modification */}
      <Modal show={showModal} onHide={() => !loading && setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingId ? 'Modifier' : 'Ajouter'} une Heure de Marche
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Engin *</Form.Label>
                  <Form.Select
                    name="engin"
                    value={formData.engin}
                    onChange={handleEnginChange}
                    required
                  >
                    <option value="">Sélectionner un engin</option>
                    {engins.map(engin => (
                      <option key={engin.id} value={engin.id}>
                        {engin.matricule}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Type d'Engin</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <FaCog />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      value={selectedEnginType}
                      readOnly
                      placeholder="Le type d'engin s'affichera automatiquement"
                      className="bg-light"
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Projet</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <FaProjectDiagram />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      value={selectedEnginProjet}
                      readOnly
                      placeholder="Le projet s'affichera automatiquement"
                      className="bg-light"
                    />
                  </InputGroup>
                  <Form.Text className="text-muted">
                    Projet actuel de l'engin 
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Changer de projet (Optionnel)</Form.Label>
                  <Form.Select
                    name="projet"
                    value={formData.projet}
                    onChange={handleChange}
                  >
                    <option value="">Conserver le projet actuel</option>
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
                  <Form.Label>Date *</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <FaCalendarAlt />
                    </InputGroup.Text>
                    <Form.Control
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>HDM Début *</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <FaTachometerAlt />
                    </InputGroup.Text>
                    <Form.Control
                      type="number"
                      name="hdm_debut"
                      value={formData.hdm_debut}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      placeholder="Ex: 1250.50"
                    />
                  </InputGroup>
                  <Form.Text className="text-muted">
                    HDM de début en heures (peut dépasser 24h)
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>HDM Fin *</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <FaTachometerAlt />
                    </InputGroup.Text>
                    <Form.Control
                      type="number"
                      name="hdm_fin"
                      value={formData.hdm_fin}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      placeholder="Ex: 1265.75"
                    />
                  </InputGroup>
                  <Form.Text className="text-muted">
                    HDM de fin en heures (doit être supérieur au HDM début)
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Observation</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="observation"
                value={formData.observation}
                onChange={handleChange}
                placeholder="Observations sur le fonctionnement de l'engin..."
              />
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button 
                variant="secondary" 
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="me-2"
              >
                Annuler
              </Button>
              <Button 
                variant="primary" 
                type="submit" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    Enregistrement...
                  </>
                ) : 'Enregistrer'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default GestionProductionEngin;