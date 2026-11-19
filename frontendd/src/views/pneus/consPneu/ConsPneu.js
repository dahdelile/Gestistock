import React, { useState, useEffect } from 'react';
import {
  Card, Container, Row, Col, Form, Button,
  Table, Badge, Modal, Alert, Spinner, InputGroup
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { FaInfoCircle } from 'react-icons/fa';

// 🔹 URLs de production HARDCODÉES - Solution fiable ✅
const API_BASE_URL = `https://intranet-attm.com/api`;
const APP_URL = `https://intranet-attm.com`;

// ✅ Configuration axios avec credentials pour Laravel Sanctum
const api = axios.create({ 
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

const TableConsommationPneumatique = () => {
  const navigate = useNavigate();
  const [state, setState] = useState({
    voitures: [],
    projets: [],
    chauffeurs: [],
    consommation: [],
    loading: true,
    error: null,
    showModal: false,
    editingPneumatique: null,
    filters: {
      voiture: '',
      statut: '',
      projet: '',
      chauffeur: '',
      modele: '',
      reference: '',
      marque: ''
    }
  });

  const statutsPneumatique = [
    { id: 'neuf', nom: 'Neuf', color: 'success' },
    { id: 'recupere', nom: 'En récupéré', color: 'info' },
    { id: 'usure', nom: 'À changer', color: 'warning' },
    { id: 'hors_service', nom: 'Hors service', color: 'danger' },
    { id: 'reforme', nom: 'Réformé', color: 'secondary' }
  ];

  const modelesPneumatique = [
    { id: '1200R20', nom: '1200R20' },
    { id: '1200R24', nom: '1200R24' },
    { id: '13/22,5', nom: '13/22,5' },
    { id: '315.80.22,5', nom: '315.80.22,5' },
    { id: '2650R19,5', nom: '2650R19,5' },
    { id: 'autre', nom: 'Autre' }
  ];

  const marquesPneumatique = [
    { id: 'sailun', nom: 'Sailun' },
    { id: 'toprunner', nom: 'Toprunner' },
    { id: 'michelin', nom: 'Michelin' },
    { id: 'zextour', nom: 'Zextour' },
    { id: 'Tracmax', nom: 'Tracmax' },
    { id: 'doupro', nom: 'Doupro' },
    { id: 'towar', nom: 'Towar' },
    { id: 'autre', nom: 'Autre' }
  ];

  const goToRapport = () => navigate('/pneus/rapportPneu');

  const exportToExcel = () => {
    if (!filteredConsommation.length) {
      alert('Aucune donnée à exporter');
      return;
    }
    const dataExport = filteredConsommation.map(item => ({
      'Equipement': getNomVoiture(item.voiture_id),
      'Projet': getNomProjet(item.projet_id),
      'Chauffeur': getNomChauffeur(item.chauffeur_id),
      'Modèle': getLibelleModele(item.modele),
      'Marque': getLibelleMarque(item.marque),
      'Référence': item.reference || '-',
      'Référence Retour': item.reference_retour || '-',
      'Date Installation': item.date_installation ? new Date(item.date_installation).toLocaleDateString('fr-FR') : '-',
      'Km Installation': item.kilometrage_installation ? `${item.kilometrage_installation} km` : '-',
      'Km Démonté': item.kilometrage_demonte ? `${item.kilometrage_demonte} km` : '-',
      'Statut': getStatutDetails(item.statut).nom,
      'Motif': getMotifDetails(item.motif).nom,
      'Observations': item.observations || '-'
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataExport);
    XLSX.utils.book_append_sheet(wb, ws, 'Pneumatiques');
    const fileName = `pneumatiques_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // ✅ Fonction pour récupérer TOUTES les données avec pagination complète
  const fetchAllPaginatedData = async (url, headers, params = {}) => {
    let allData = [];
    let currentPage = 1;
    let lastPage = 1;
    
    try {
      do {
        const response = await api.get(url, {
          headers,
          params: {
            ...params,
            page: currentPage,
            per_page: 100 // Récupérer 100 éléments par page
          }
        });
        
        let pageData = [];
        let paginationInfo = {};
        
        if (response.data && Array.isArray(response.data)) {
          pageData = response.data;
          paginationInfo = { current_page: currentPage, last_page: currentPage };
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          pageData = response.data.data;
          paginationInfo = {
            current_page: response.data.current_page || currentPage,
            last_page: response.data.last_page || currentPage
          };
        } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
          pageData = response.data.results;
          paginationInfo = {
            current_page: response.data.current_page || currentPage,
            last_page: response.data.last_page || currentPage
          };
        }
        
        allData = [...allData, ...pageData];
        lastPage = paginationInfo.last_page;
        currentPage++;
        
        console.log(`📄 Page ${paginationInfo.current_page}/${paginationInfo.last_page}: ${pageData.length} éléments récupérés de ${url}`);
        
      } while (currentPage <= lastPage);
      
      return allData;
    } catch (error) {
      console.error(`Erreur chargement paginé de ${url}:`, error);
      return [];
    }
  };

  const fetchData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      console.log('🔍 API Base URL:', API_BASE_URL);

      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      // ✅ Récupérer TOUTES les voitures (sans pagination car petites données)
      const voituresRes = await api.get('/voitures', { headers }).catch(err => {
        console.error('❌ Erreur voitures:', err.response?.status);
        return { data: [] };
      });

      // ✅ Récupérer TOUS les projets (sans pagination car petites données)
      const projetsRes = await api.get('/projets', { headers }).catch(err => {
        console.error('❌ Erreur projets:', err.response?.status);
        return { data: [] };
      });

      // ✅ Récupérer TOUS les chauffeurs (sans pagination car petites données)
      const chauffeursRes = await api.get('/chauffeurs', { headers }).catch(err => {
        console.error('❌ Erreur chauffeurs:', err.response?.status);
        return { data: [] };
      });

      // ✅ Récupérer TOUTES les consommations pneumatiques (avec pagination complète)
      const allConsommation = await fetchAllPaginatedData('/consommationPneumatiques', headers);

      const extractArray = (response) => {
        if (!response || !response.data) return [];
        if (Array.isArray(response.data)) return response.data;
        if (response.data.data && Array.isArray(response.data.data)) return response.data.data;
        if (response.data.results && Array.isArray(response.data.results)) return response.data.results;
        return [];
      };

      const voitures = extractArray(voituresRes);
      const projets = extractArray(projetsRes);
      const chauffeurs = extractArray(chauffeursRes);
      const consommation = allConsommation;

      console.log('✅ Données chargées:', {
        voitures: voitures.length,
        projets: projets.length,
        chauffeurs: chauffeurs.length,
        consommation: consommation.length
      });

      setState(prev => ({
        ...prev,
        voitures,
        projets,
        chauffeurs,
        consommation,
        loading: false
      }));
    } catch (err) {
      console.error("❌ Erreur globale:", err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: "Erreur lors du chargement: " + (err.message || 'Erreur inconnue')
      }));
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredConsommation = state.consommation.filter(item => {
    const voitureMatch = !state.filters.voiture || item.voiture_id == state.filters.voiture;
    const statutMatch = !state.filters.statut || item.statut === state.filters.statut;
    const projetMatch = !state.filters.projet || (item.projet_id && item.projet_id == state.filters.projet);
    const chauffeurMatch = !state.filters.chauffeur || (item.chauffeur_id && item.chauffeur_id == state.filters.chauffeur);
    const modeleMatch = !state.filters.modele || item.modele === state.filters.modele;
    const referenceMatch = !state.filters.reference ||
      (item.reference && item.reference.toLowerCase().includes(state.filters.reference.toLowerCase()));
    const marqueMatch = !state.filters.marque || item.marque === state.filters.marque;
    return voitureMatch && statutMatch && projetMatch && chauffeurMatch && modeleMatch && referenceMatch && marqueMatch;
  });

  const getNomVoiture = (voitureId) => {
    if (!voitureId) return 'Non assignée';
    const voiture = state.voitures.find(v => v.id === voitureId);
    return voiture ? (voiture.matricule || voiture.nom || `Voiture #${voitureId}`) : `Voiture #${voitureId}`;
  };

  const getNomProjet = (projetId) => {
    if (!projetId) return 'Non assigné';
    const projet = state.projets.find(p => p.id === projetId);
    return projet ? (projet.name || projet.nom || `Projet #${projetId}`) : `Projet #${projetId}`;
  };

  const getNomChauffeur = (chauffeurId) => {
    if (!chauffeurId) return 'Non assigné';
    if (!Array.isArray(state.chauffeurs)) return `Chauffeur #${chauffeurId}`;
    const chauffeur = state.chauffeurs.find(c => c.id === chauffeurId);
    return chauffeur ? `${chauffeur.nom || ''} ${chauffeur.prenom || ''}`.trim() || `Chauffeur #${chauffeurId}` : `Chauffeur #${chauffeurId}`;
  };

  const getStatutDetails = (statutId) => {
    return statutsPneumatique.find(s => s.id === statutId) || { nom: statutId || 'Inconnu', color: 'secondary' };
  };

  const getMotifDetails = (motifId) => {
    const motifs = [
      { id: 'recupere', nom: 'En récupéré', color: 'info' },
      { id: 'usure(HS)', nom: 'Usure (HS)', color: 'warning' },
      { id: 'neuf', nom: 'Neuf', color: 'success' }
    ];
    return motifs.find(m => m.id === motifId) || { nom: motifId || 'Inconnu', color: 'secondary' };
  };

  const getLibelleModele = (modeleId) => {
    const modele = modelesPneumatique.find(m => m.id === modeleId);
    return modele ? modele.nom : modeleId;
  };

  const getLibelleMarque = (marqueId) => {
    const marque = marquesPneumatique.find(m => m.id === marqueId);
    return marque ? marque.nom : marqueId;
  };

  const handleShowModal = (pneumatique = null) => {
    setState(prev => ({ ...prev, showModal: true, editingPneumatique: pneumatique }));
  };

  const handleCloseModal = () => {
    setState(prev => ({ ...prev, showModal: false, editingPneumatique: null }));
  };

  const handleSave = async (formData) => {
    try {
      if (!formData.voiture || formData.voiture === '') {
        alert('Le champ "Voiture" est obligatoire');
        return;
      }

      const dataToSend = {
        voiture_id: parseInt(formData.voiture),
        modele: formData.modele || '1200R20',
        marque: formData.marque || 'sailun',
        reference: formData.reference || '',
        reference_retour: formData.reference_retour || '',
        statut: formData.statut || 'neuf',
        motif: formData.motif || 'neuf',
        observations: formData.observations || '',
      };

      if (formData.projet && formData.projet !== '') dataToSend.projet_id = parseInt(formData.projet);
      if (formData.chauffeur_id && formData.chauffeur_id !== '') dataToSend.chauffeur_id = parseInt(formData.chauffeur_id);
      if (formData.voiture_source && formData.voiture_source !== '') dataToSend.voiture_source_id = parseInt(formData.voiture_source);
      if (formData.date_installation && formData.date_installation !== '') dataToSend.date_installation = formData.date_installation;
      if (formData.kilometrage_installation && formData.kilometrage_installation !== '') dataToSend.kilometrage_installation = parseInt(formData.kilometrage_installation);
      if (formData.kilometrage_demonte && formData.kilometrage_demonte !== '') dataToSend.kilometrage_demonte = parseInt(formData.kilometrage_demonte);

      console.log('📤 Données envoyées:', dataToSend);

      let response;
      if (formData.id) {
        response = await api.put(`/consommationPneumatiques/${formData.id}`, dataToSend);
      } else {
        response = await api.post('/consommationPneumatiques', dataToSend);
      }

      console.log('✅ Réponse succès:', response.data);
      await fetchData();
      handleCloseModal();
      alert('Données sauvegardées avec succès!');
    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Réponse:', error.response.data);
        let errorMessage = 'Erreur de validation:\n';
        if (error.response.data?.messages) {
          Object.keys(error.response.data.messages).forEach(field => {
            const labels = {
              voiture_id: 'Voiture', projet_id: 'Projet', chauffeur_id: 'Chauffeur',
              modele: 'Modèle', marque: 'Marque', reference: 'Référence',
              reference_retour: 'Référence retour', statut: 'Statut', motif: 'Motif',
              observations: 'Observations', date_installation: "Date d'installation",
              kilometrage_installation: 'Km installation', kilometrage_demonte: 'Km démonté'
            };
            errorMessage += `\n- ${labels[field] || field}: ${error.response.data.messages[field].join(', ')}`;
          });
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        } else {
          errorMessage = `Erreur ${error.response.status}: ${JSON.stringify(error.response.data)}`;
        }
        alert(errorMessage);
      } else if (error.request) {
        alert(`Erreur: Le serveur ne répond pas. Vérifiez que l'API est accessible sur ${API_BASE_URL}`);
      } else {
        alert('Erreur: ' + error.message);
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce pneumatique ?')) {
      try {
        await api.delete(`/consommationPneumatiques/${id}`);
        setState(prev => ({
          ...prev,
          consommation: prev.consommation.filter(item => item.id !== id)
        }));
        alert('Pneumatique supprimé avec succès!');
      } catch (error) {
        console.error('❌ Erreur suppression:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const resetFilters = () => {
    setState(prev => ({
      ...prev,
      filters: { voiture: '', statut: '', projet: '', chauffeur: '', modele: '', reference: '', marque: '' }
    }));
  };

  if (state.loading) {
    return (
      <Container fluid className="py-4">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Chargement des données pneumatiques...</p>
        </div>
      </Container>
    );
  }

  if (state.error) {
    return (
      <Container fluid className="py-4">
        <Alert variant="danger">
          {state.error}
          <div className="mt-2"><small>API: {API_BASE_URL}</small></div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-6">
      <Card className="shadow-lg">
        <Card.Header className="bg-info text-white d-flex justify-content-between align-items-center">
          <h3 className="mb-0">📊 Gestion des Pneumatiques</h3>
          <div className="d-flex gap-2">
            <Button variant="outline-light" onClick={fetchData} title="Rafraîchir">🔄</Button>
            <Button variant="warning" onClick={goToRapport}>📈 Rapports</Button>
            <Button variant="success" onClick={exportToExcel} disabled={!filteredConsommation.length}>📥 Exporter</Button>
            <Button variant="light" onClick={() => handleShowModal()}>+ Ajouter</Button>
          </div>
        </Card.Header>

        <Card.Body>
          {/* Filtres */}
          <Row className="mb-4 g-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Filtrer par Voiture</Form.Label>
                <Form.Select value={state.filters.voiture} onChange={e => setState(prev => ({ ...prev, filters: { ...prev.filters, voiture: e.target.value } }))}>
                  <option value="">Toutes les Equipements</option>
                  {state.voitures.map(voiture => (
                    <option key={voiture.id} value={voiture.id}>{voiture.matricule || voiture.nom || `ID: ${voiture.id}`}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Filtrer par Projet</Form.Label>
                <Form.Select value={state.filters.projet} onChange={e => setState(prev => ({ ...prev, filters: { ...prev.filters, projet: e.target.value } }))}>
                  <option value="">Tous les projets</option>
                  {state.projets.map(projet => (
                    <option key={projet.id} value={projet.id}>{projet.name || projet.nom || `Projet #${projet.id}`}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Filtrer par Chauffeur</Form.Label>
                <Form.Select value={state.filters.chauffeur} onChange={e => setState(prev => ({ ...prev, filters: { ...prev.filters, chauffeur: e.target.value } }))}>
                  <option value="">Tous les chauffeurs</option>
                  {Array.isArray(state.chauffeurs) && state.chauffeurs.map(chauffeur => (
                    <option key={chauffeur.id} value={chauffeur.id}>{chauffeur.nom} {chauffeur.prenom || ''} - {chauffeur.matricule || ''}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Filtrer par Modèle</Form.Label>
                <Form.Select value={state.filters.modele} onChange={e => setState(prev => ({ ...prev, filters: { ...prev.filters, modele: e.target.value } }))}>
                  <option value="">Tous les modèles</option>
                  {modelesPneumatique.map(modele => (<option key={modele.id} value={modele.id}>{modele.nom}</option>))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Filtrer par Marque</Form.Label>
                <Form.Select value={state.filters.marque} onChange={e => setState(prev => ({ ...prev, filters: { ...prev.filters, marque: e.target.value } }))}>
                  <option value="">Toutes les marques</option>
                  {marquesPneumatique.map(marque => (<option key={marque.id} value={marque.id}>{marque.nom}</option>))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Filtrer par Statut</Form.Label>
                <Form.Select value={state.filters.statut} onChange={e => setState(prev => ({ ...prev, filters: { ...prev.filters, statut: e.target.value } }))}>
                  <option value="">Tous les statuts</option>
                  {statutsPneumatique.map(statut => (<option key={statut.id} value={statut.id}>{statut.nom}</option>))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Rechercher par Référence</Form.Label>
                <InputGroup>
                  <Form.Control type="text" placeholder="Entrez une référence..." value={state.filters.reference} onChange={e => setState(prev => ({ ...prev, filters: { ...prev.filters, reference: e.target.value } }))} />
                  {state.filters.reference && <Button variant="outline-secondary" onClick={() => setState(prev => ({ ...prev, filters: { ...prev.filters, reference: '' } }))}>✕</Button>}
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={12} className="d-flex justify-content-end">
              <Button variant="outline-secondary" onClick={resetFilters}>🔄 Réinitialiser tous les filtres</Button>
            </Col>
          </Row>

          {/* Résumé statistique */}
          <Row className="mt-4">
            <Col md={2}><Card className="bg-light"><Card.Body className="text-center"><h5 className="text-primary">{filteredConsommation.length}</h5><div className="text-muted">Total</div></Card.Body></Card></Col>
            <Col md={2}><Card className="bg-light"><Card.Body className="text-center"><h5 className="text-success">{filteredConsommation.filter(p => p.statut === 'neuf').length}</h5><div className="text-muted">Neufs</div></Card.Body></Card></Col>
            <Col md={2}><Card className="bg-light"><Card.Body className="text-center"><h5 className="text-info">{filteredConsommation.filter(p => p.statut === 'recupere').length}</h5><div className="text-muted">Récupérés</div></Card.Body></Card></Col>
            <Col md={2}><Card className="bg-light"><Card.Body className="text-center"><h5 className="text-warning">{filteredConsommation.filter(p => p.modele === '13/22,5').length}</h5><div className="text-muted">13/22,5</div></Card.Body></Card></Col>
            <Col md={2}><Card className="bg-light"><Card.Body className="text-center"><h5 className="text-danger">{filteredConsommation.filter(p => p.modele === '1200R24').length}</h5><div className="text-muted">1200R24</div></Card.Body></Card></Col>
            <Col md={2}><Card className="bg-light"><Card.Body className="text-center"><h5 className="text-secondary">{filteredConsommation.filter(p => p.modele === '1200R20').length}</h5><div className="text-muted">1200R20</div></Card.Body></Card></Col>
          </Row>

          {/* Tableau */}
          <div className="table-responsive mt-4">
            <Table striped bordered hover>
              <thead className="table-dark">
                <tr>
                  <th>Equi</th><th>Projet</th><th>Chauffeur</th><th>Modèle</th><th>Marque</th><th>Référence</th><th>Réf.Retour</th><th>Date monte</th><th>Km monte</th><th>km demonte</th><th>Statut</th><th>Motif</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredConsommation.length > 0 ? (
                  filteredConsommation.map((item) => {
                    const statutDetails = getStatutDetails(item.statut);
                    const motifDetails = getMotifDetails(item.motif);
                    return (
                      <tr key={item.id}>
                        <td className="fw-bold">{getNomVoiture(item.voiture_id)}</td>
                        <td><Badge bg="secondary">{getNomProjet(item.projet_id)}</Badge></td>
                        <td><small>{getNomChauffeur(item.chauffeur_id)}</small></td>
                        <td><Badge bg="primary">{getLibelleModele(item.modele)}</Badge></td>
                        <td><Badge bg="info" text="dark">{getLibelleMarque(item.marque)}</Badge></td>
                        <td><div className="fw-bold">{item.reference || '-'}</div></td>
                        <td><div className="fw-bold">{item.reference_retour || '-'}</div></td>
                        <td>{item.date_installation ? new Date(item.date_installation).toLocaleDateString('fr-FR') : '-'}</td>
                        <td className="text-end">{item.kilometrage_installation ? `${item.kilometrage_installation.toLocaleString()} km` : '-'}</td>
                        <td className="text-end">{item.kilometrage_demonte ? `${item.kilometrage_demonte.toLocaleString()} km` : '-'}</td>
                        <td className="text-center"><Badge bg={statutDetails.color}>{statutDetails.nom}</Badge></td>
                        <td><Badge bg={motifDetails.color}>{motifDetails.nom}</Badge></td>
                        <td>
                          <Button variant="outline-primary" size="sm" onClick={() => handleShowModal(item)} className="me-1" title="Modifier">✏️</Button>
                          <Button variant="outline-danger" size="sm" onClick={() => handleDelete(item.id)} title="Supprimer">🗑️</Button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="13" className="text-center py-4"><Alert variant="info">Aucune donnée trouvée.</Alert></td></tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Modal */}
      <PneumatiqueModal
        show={state.showModal}
        onHide={handleCloseModal}
        onSave={handleSave}
        pneumatique={state.editingPneumatique}
        voitures={state.voitures}
        projets={state.projets}
        chauffeurs={state.chauffeurs}
        statutsPneumatique={statutsPneumatique}
        modelesPneumatique={modelesPneumatique}
        marquesPneumatique={marquesPneumatique}
      />
    </Container>
  );
};

// ===== MODAL COMPONENT =====
const PneumatiqueModal = ({ show, onHide, onSave, pneumatique, voitures, projets, chauffeurs, statutsPneumatique, modelesPneumatique, marquesPneumatique }) => {
  const [formData, setFormData] = useState({
    voiture: '', projet: '', chauffeur_id: '', modele: '1200R20', marque: 'sailun',
    reference: '', reference_retour: '', voiture_source: '', date_installation: '',
    kilometrage_installation: '', kilometrage_demonte: '', statut: 'neuf', motif: 'neuf', observations: ''
  });
  const [errors, setErrors] = useState({});
  
  const [searchVoiture, setSearchVoiture] = useState('');
  const [showVoitureDropdown, setShowVoitureDropdown] = useState(false);
  const [filteredVoitures, setFilteredVoitures] = useState([]);
  
  const [affectations, setAffectations] = useState([]);
  
  const [selectedVoitureInfo, setSelectedVoitureInfo] = useState({ 
    projet: '', 
    chauffeur: '',
    projetNom: '',
    chauffeurNom: '',
    chauffeurMatricule: ''
  });

  const isStatutRecupere = formData.statut === 'recupere';

  // Charger les affectations
  useEffect(() => {
    const fetchAffectations = async () => {
      try {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/affectations-chauffeurs`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        let affectationsData = [];
        if (response.data && Array.isArray(response.data)) {
          affectationsData = response.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          affectationsData = response.data.data;
        } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
          affectationsData = response.data.results;
        }
        
        const activeAffectations = affectationsData.filter(a => a.statut === 'active');
        setAffectations(activeAffectations);
      } catch (error) {
        console.error('Erreur chargement affectations:', error);
      }
    };
    
    if (show) {
      fetchAffectations();
    }
  }, [show]);

  const getChauffeurFromAffectation = (voitureId) => {
    const affectation = affectations.find(a => a.voiture_id == voitureId);
    return affectation ? affectation.chauffeur_id : null;
  };

  const filterVoitures = (searchTerm) => {
    if (!searchTerm.trim()) {
      setFilteredVoitures([]);
      setShowVoitureDropdown(false);
      return;
    }
    
    const filtered = voitures.filter(v => 
      v.matricule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.type_voiture?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.nom && v.nom.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    const filteredWithAffectation = filtered.map(v => {
      const chauffeurId = getChauffeurFromAffectation(v.id);
      const chauffeur = chauffeurId ? chauffeurs.find(c => c.id == chauffeurId) : null;
      return {
        ...v,
        chauffeur_assigne: chauffeur,
        chauffeur_id_assigne: chauffeurId
      };
    });
    
    setFilteredVoitures(filteredWithAffectation);
    setShowVoitureDropdown(true);
  };

  const selectVoiture = (voiture) => {
    setFormData(prev => ({ ...prev, voiture: voiture.id }));
    setSearchVoiture(`${voiture.matricule || voiture.nom} - ${voiture.type_voiture || ''}`);
    setShowVoitureDropdown(false);
    
    const voitureProjet = voiture.projet_id || voiture.projet;
    const chauffeurId = getChauffeurFromAffectation(voiture.id);
    const chauffeurTrouve = chauffeurId ? chauffeurs.find(c => c.id == chauffeurId) : null;
    const projetTrouve = projets.find(p => p.id == voitureProjet);
    
    setSelectedVoitureInfo({
      projet: voitureProjet || '',
      chauffeur: chauffeurId || '',
      projetNom: projetTrouve ? (projetTrouve.name || projetTrouve.nom) : '',
      chauffeurNom: chauffeurTrouve ? `${chauffeurTrouve.nom} ${chauffeurTrouve.prenom || ''}` : '',
      chauffeurMatricule: chauffeurTrouve ? chauffeurTrouve.matricule : ''
    });
    
    if (voitureProjet) {
      setFormData(prev => ({ ...prev, projet: voitureProjet }));
    }
    if (chauffeurId) {
      setFormData(prev => ({ ...prev, chauffeur_id: chauffeurId }));
    }
  };

  const handleVoitureSearch = (e) => {
    const value = e.target.value;
    setSearchVoiture(value);
    filterVoitures(value);
    
    if (!value.trim()) {
      setFormData(prev => ({ ...prev, voiture: '' }));
      setSelectedVoitureInfo({ projet: '', chauffeur: '', projetNom: '', chauffeurNom: '', chauffeurMatricule: '' });
    }
  };

  const getProjetName = (projetId) => {
    if (!projetId) return '';
    const projet = projets.find(p => p.id == projetId);
    return projet ? (projet.name || projet.nom) : '';
  };

  const getChauffeurName = (chauffeurId) => {
    if (!chauffeurId) return '';
    const chauffeur = chauffeurs.find(c => c.id == chauffeurId);
    return chauffeur ? `${chauffeur.nom} ${chauffeur.prenom || ''}` : '';
  };

  const getChauffeurMatricule = (chauffeurId) => {
    if (!chauffeurId) return '';
    const chauffeur = chauffeurs.find(c => c.id == chauffeurId);
    return chauffeur ? chauffeur.matricule : '';
  };

  const handleProjetChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, projet: value }));
  };

  const handleChauffeurChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, chauffeur_id: value }));
  };

  useEffect(() => {
    if (pneumatique) {
      const voitureAssociee = voitures.find(v => v.id === pneumatique.voiture_id);
      const projetAssocie = projets.find(p => p.id === pneumatique.projet_id);
      const chauffeurAssocie = chauffeurs.find(c => c.id === pneumatique.chauffeur_id);
      
      setFormData({
        id: pneumatique.id, voiture: pneumatique.voiture_id || '', projet: pneumatique.projet_id || '',
        chauffeur_id: pneumatique.chauffeur_id || '', modele: pneumatique.modele || '1200R20',
        marque: pneumatique.marque || 'sailun', reference: pneumatique.reference || '',
        reference_retour: pneumatique.reference_retour || '', voiture_source: pneumatique.voiture_source_id || '',
        date_installation: pneumatique.date_installation || '', kilometrage_installation: pneumatique.kilometrage_installation || '',
        kilometrage_demonte: pneumatique.kilometrage_demonte || '', statut: pneumatique.statut || 'neuf',
        motif: pneumatique.motif || 'neuf', observations: pneumatique.observations || ''
      });
      
      if (voitureAssociee) {
        setSearchVoiture(`${voitureAssociee.matricule || voitureAssociee.nom} - ${voitureAssociee.type_voiture || ''}`);
        setSelectedVoitureInfo({
          projet: pneumatique.projet_id || '',
          chauffeur: pneumatique.chauffeur_id || '',
          projetNom: projetAssocie ? (projetAssocie.name || projetAssocie.nom) : '',
          chauffeurNom: chauffeurAssocie ? `${chauffeurAssocie.nom} ${chauffeurAssocie.prenom || ''}` : '',
          chauffeurMatricule: chauffeurAssocie ? chauffeurAssocie.matricule : ''
        });
      }
    } else {
      setFormData({
        voiture: '', projet: '', chauffeur_id: '', modele: '1200R20', marque: 'sailun',
        reference: '', reference_retour: '', voiture_source: '', date_installation: new Date().toISOString().split('T')[0],
        kilometrage_installation: '', kilometrage_demonte: '', statut: 'neuf', motif: 'neuf', observations: ''
      });
      setSearchVoiture('');
      setSelectedVoitureInfo({ projet: '', chauffeur: '', projetNom: '', chauffeurNom: '', chauffeurMatricule: '' });
    }
    setErrors({});
  }, [pneumatique, show, voitures, projets, chauffeurs]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.voiture) newErrors.voiture = 'La voiture est obligatoire';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSave({ ...formData, reference: formData.reference || '', reference_retour: formData.reference_retour || '', observations: formData.observations || '' });
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>{pneumatique ? '✏️ Modifier' : '➕ Ajouter'} un Pneumatique</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row className="g-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label>Equipement <span className="text-danger">*</span></Form.Label>
                <div className="position-relative">
                  <Form.Control
                    type="text"
                    placeholder="Tapez le matricule ou le type de voiture..."
                    value={searchVoiture}
                    onChange={handleVoitureSearch}
                    onFocus={() => searchVoiture.trim() && filterVoitures(searchVoiture)}
                    isInvalid={!!errors.voiture}
                    required
                  />
                  {showVoitureDropdown && filteredVoitures.length > 0 && (
                    <div className="position-absolute w-100 bg-white border rounded shadow-sm" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                      {filteredVoitures.map((v) => (
                        <div
                          key={v.id}
                          className="p-2 border-bottom"
                          style={{ cursor: 'pointer' }}
                          onClick={() => selectVoiture(v)}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                        >
                          <strong>{v.matricule || v.nom}</strong> - {v.type_voiture || ''}
                          <div className="small text-muted">
                            Projet: {v.projet_id ? getProjetName(v.projet_id) : 'Non affecté'} | 
                            Chauffeur affecté: {v.chauffeur_assigne ? `${v.chauffeur_assigne.nom} ${v.chauffeur_assigne.prenom || ''} (${v.chauffeur_assigne.matricule})` : 'Non affecté'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {showVoitureDropdown && filteredVoitures.length === 0 && searchVoiture && (
                    <div className="position-absolute w-100 bg-white border rounded shadow-sm p-2" style={{ zIndex: 1000 }}>
                      <span className="text-muted">Aucune voiture trouvée</span>
                    </div>
                  )}
                </div>
                <Form.Control.Feedback type="invalid">{errors.voiture}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            
            {(selectedVoitureInfo.projet || selectedVoitureInfo.chauffeur) && (
              <Col md={12}>
                <Alert variant="success" className="mb-3">
                  <FaInfoCircle className="me-2" />
                  <strong>Informations automatiquement chargées :</strong>
                  {selectedVoitureInfo.projet && (
                    <div className="mt-1">
                      📁 <strong>Projet associé :</strong> {selectedVoitureInfo.projetNom || getProjetName(selectedVoitureInfo.projet)}
                    </div>
                  )}
                  {selectedVoitureInfo.chauffeur && (
                    <div>
                      👤 <strong>Chauffeur affecté :</strong> {selectedVoitureInfo.chauffeurNom || getChauffeurName(selectedVoitureInfo.chauffeur)}
                      {selectedVoitureInfo.chauffeurMatricule && ` (${selectedVoitureInfo.chauffeurMatricule})`}
                    </div>
                  )}
                  {!selectedVoitureInfo.chauffeur && (
                    <div className="text-warning mt-1">
                      ⚠️ Aucun chauffeur n'est actuellement affecté à cette voiture
                    </div>
                  )}
                </Alert>
              </Col>
            )}
            
            <Col md={6}>
              <Form.Group>
                <Form.Label>Projet</Form.Label>
                <Form.Select value={formData.projet} onChange={handleProjetChange}>
                  <option value="">Sélectionner un projet</option>
                  {projets.map(p => (
                    <option key={p.id} value={p.id}>{p.name || p.nom}</option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">Peut être modifié manuellement si nécessaire</Form.Text>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group>
                <Form.Label>Chauffeur</Form.Label>
                <Form.Select value={formData.chauffeur_id} onChange={handleChauffeurChange}>
                  <option value="">Sélectionner un chauffeur</option>
                  {chauffeurs.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nom} {c.prenom || ''} {c.matricule && `(${c.matricule})`}
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">Chauffeur actuellement affecté à cette voiture</Form.Text>
              </Form.Group>
            </Col>
            
            {isStatutRecupere && (
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Equipement Source</Form.Label>
                  <Form.Select value={formData.voiture_source} onChange={e => handleFieldChange('voiture_source', e.target.value)}>
                    <option value="">Sélectionner</option>
                    {voitures.map(v => (<option key={v.id} value={v.id}>{v.matricule || v.nom || `ID: ${v.id}`}</option>))}
                  </Form.Select>
                </Form.Group>
              </Col>
            )}
            
            <Col md={6}>
              <Form.Group>
                <Form.Label>Modèle <span className="text-danger">*</span></Form.Label>
                <Form.Select value={formData.modele} onChange={e => handleFieldChange('modele', e.target.value)} required>
                  {modelesPneumatique.map(m => (<option key={m.id} value={m.id}>{m.nom}</option>))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Marque <span className="text-danger">*</span></Form.Label>
                <Form.Select value={formData.marque} onChange={e => handleFieldChange('marque', e.target.value)} required>
                  {marquesPneumatique.map(m => (<option key={m.id} value={m.id}>{m.nom}</option>))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Référence</Form.Label>
                <Form.Control type="text" value={formData.reference} onChange={e => handleFieldChange('reference', e.target.value)} placeholder="Optionnel" />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Référence retour</Form.Label>
                <Form.Control type="text" value={formData.reference_retour} onChange={e => handleFieldChange('reference_retour', e.target.value)} placeholder="Optionnel" />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Statut <span className="text-danger">*</span></Form.Label>
                <Form.Select value={formData.statut} onChange={e => handleFieldChange('statut', e.target.value)} required>
                  {statutsPneumatique.map(s => (<option key={s.id} value={s.id}>{s.nom}</option>))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Motif <span className="text-danger">*</span></Form.Label>
                <Form.Select value={formData.motif} onChange={e => handleFieldChange('motif', e.target.value)} required>
                  <option value="neuf">Neuf</option>
                  <option value="recupere">En récupéré</option>
                  <option value="usure(HS)">Usure (HS)</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Date d'installation</Form.Label>
                <Form.Control type="date" value={formData.date_installation} onChange={e => handleFieldChange('date_installation', e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Km installation</Form.Label>
                <Form.Control type="number" value={formData.kilometrage_installation} onChange={e => handleFieldChange('kilometrage_installation', e.target.value)} min="0" placeholder="0" />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Km démonté</Form.Label>
                <Form.Control type="number" value={formData.kilometrage_demonte} onChange={e => handleFieldChange('kilometrage_demonte', e.target.value)} min="0" placeholder="0" />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group>
                <Form.Label>Observations</Form.Label>
                <Form.Control as="textarea" rows={3} value={formData.observations} onChange={e => handleFieldChange('observations', e.target.value)} placeholder="Optionnel" />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Annuler</Button>
          <Button variant="primary" type="submit">{pneumatique ? 'Modifier' : 'Ajouter'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default TableConsommationPneumatique;