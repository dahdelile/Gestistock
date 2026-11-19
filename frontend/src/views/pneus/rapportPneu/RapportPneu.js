import React, { useState, useEffect, useMemo } from 'react';
import {
  Card, Container, Row, Col, Form, Button,
  Table, Badge, Modal, Alert, Spinner, Tabs, Tab
} from 'react-bootstrap';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { FaChartBar, FaTrophy, FaCalendarAlt, FaFilter, FaDownload, FaInfoCircle } from 'react-icons/fa';

const API_BASE_URL = 'https://intranet-attm.com/api';

const api = axios.create({ 
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

// Constantes
const STATUTS = [
  { id: 'neuf', nom: 'Neuf', color: 'success' },
  { id: 'recupere', nom: 'En récupéré', color: 'info' },
  { id: 'usure', nom: 'À changer', color: 'warning' },
  { id: 'hors_service', nom: 'Hors service', color: 'danger' },
  { id: 'reforme', nom: 'Réformé', color: 'secondary' }
];

const MOIS = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
];

const MODELES_PNEUMATIQUE = [
  { id: '1200R20', nom: '1200R20' },
  { id: '1200R24', nom: '1200R24' },
  { id: '13/22,5', nom: '13/22,5' },
  { id: '13.22,5', nom: '13.22,5' },
  { id: 'autre', nom: 'Autre' }
];

const MARQUES_PNEUMATIQUE = [
  { id: 'sailun', nom: 'Sailun' },
  { id: 'toprunner', nom: 'Toprunner' },
  { id: 'michelin', nom: 'Michelin' },
  { id: 'zextour', nom: 'Zextour' },
  { id: 'Tracmax', nom: 'Tracmax' },
  { id: 'doupro', nom: 'Doupro' },
  { id: 'towar', nom: 'Towar' },
  { id: 'autre', nom: 'Autre' }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const RapportConsommationPneumatique = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('statistiques');
  const [data, setData] = useState({
    consommation: [],
    voitures: [],
    projets: [],
    chauffeurs: []
  });
  
  const [filters, setFilters] = useState({
    periodeType: 'mois',
    dateDebut: new Date().toISOString().split('T')[0],
    dateFin: new Date().toISOString().split('T')[0],
    annee: new Date().getFullYear(),
    mois: new Date().getMonth() + 1,
    projet: '',
    voiture: '',
    chauffeur: '',
    modele: '',
    marque: ''
  });

  const [detailsModal, setDetailsModal] = useState({
    show: false,
    type: '',
    id: null,
    titre: '',
    data: []
  });

  // Fonctions utilitaires
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const getDateMinusDays = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return formatDate(date);
  };

  const getNomVoiture = (voitureId) => {
    if (!voitureId) return 'Non assignée';
    const voiture = data.voitures.find(v => v.id === voitureId);
    return voiture ? (voiture.matricule || voiture.nom || `ID: ${voitureId}`) : `ID: ${voitureId}`;
  };

  const getNomProjet = (projetId) => {
    if (!projetId) return 'Non assigné';
    const projet = data.projets.find(p => p.id === projetId);
    return projet ? (projet.name || projet.nom || `ID: ${projetId}`) : `ID: ${projetId}`;
  };

  const getNomChauffeur = (chauffeurId) => {
    if (!chauffeurId) return 'Non assigné';
    const chauffeur = data.chauffeurs.find(c => c.id === chauffeurId);
    if (chauffeur) {
      return `${chauffeur.nom || ''} ${chauffeur.prenom || ''}`.trim() || `Chauffeur #${chauffeurId}`;
    }
    return `Chauffeur #${chauffeurId}`;
  };

  const getLibelleModele = (modeleId) => {
    const modele = MODELES_PNEUMATIQUE.find(m => m.id === modeleId);
    return modele ? modele.nom : (modeleId || 'Inconnu');
  };

  const getLibelleMarque = (marqueId) => {
    const marque = MARQUES_PNEUMATIQUE.find(m => m.id === marqueId);
    return marque ? marque.nom : (marqueId || 'Inconnu');
  };

  const getStatutDetails = (statutId) => {
    return STATUTS.find(s => s.id === statutId) || { nom: statutId || 'Inconnu', color: 'secondary' };
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
            per_page: 100
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
        
        console.log(`📄 Page ${paginationInfo.current_page}/${paginationInfo.last_page}: ${pageData.length} éléments récupérés`);
        
      } while (currentPage <= lastPage);
      
      return allData;
    } catch (error) {
      console.error(`Erreur chargement paginé de ${url}:`, error);
      return [];
    }
  };

  // Chargement des données avec récupération complète
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // ✅ Récupérer TOUTES les données avec pagination
        const [consommation, voitures, projets, chauffeurs] = await Promise.all([
          fetchAllPaginatedData('/consommationPneumatiques', headers),
          fetchAllPaginatedData('/voitures', headers),
          fetchAllPaginatedData('/projets', headers),
          fetchAllPaginatedData('/chauffeurs', headers)
        ]);

        console.log('✅ Données chargées:', {
          consommation: consommation.length,
          voitures: voitures.length,
          projets: projets.length,
          chauffeurs: chauffeurs.length
        });

        setData({
          consommation,
          voitures,
          projets,
          chauffeurs
        });
      } catch (err) {
        console.error("❌ Erreur globale:", err);
        setError("Erreur lors du chargement des données: " + (err.message || 'Erreur inconnue'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filtrer les données par période
  const getDataFiltree = useMemo(() => {
    if (!data.consommation.length) return [];
    
    return data.consommation.filter(item => {
      if (!item || !item.date_installation) return false;
      
      try {
        const dateInstallation = new Date(item.date_installation);
        if (isNaN(dateInstallation.getTime())) return false;
        
        let periodeMatch = true;
        
        if (filters.periodeType === 'mois') {
          const anneeMatch = dateInstallation.getFullYear() == filters.annee;
          const moisMatch = dateInstallation.getMonth() + 1 == filters.mois;
          periodeMatch = anneeMatch && moisMatch;
        }
        else if (filters.periodeType === 'annee') {
          periodeMatch = dateInstallation.getFullYear() == filters.annee;
        }
        else if (filters.periodeType === 'personnalise') {
          const dateStr = item.date_installation.split('T')[0];
          periodeMatch = dateStr >= filters.dateDebut && dateStr <= filters.dateFin;
        }
        
        const projetMatch = !filters.projet || item.projet_id == filters.projet;
        const voitureMatch = !filters.voiture || item.voiture_id == filters.voiture;
        const chauffeurMatch = !filters.chauffeur || item.chauffeur_id == filters.chauffeur;
        const modeleMatch = !filters.modele || item.modele === filters.modele;
        const marqueMatch = !filters.marque || item.marque === filters.marque;
        
        return periodeMatch && projetMatch && voitureMatch && chauffeurMatch && modeleMatch && marqueMatch;
      } catch (e) {
        console.error('Erreur parsing date:', e);
        return false;
      }
    });
  }, [data.consommation, filters]);

  // Statistiques par voiture
  const getStatsParVoiture = useMemo(() => {
    const stats = {};
    getDataFiltree.forEach(item => {
      if (!item.voiture_id) return;
      const voitureNom = getNomVoiture(item.voiture_id);
      if (!stats[voitureNom]) {
        stats[voitureNom] = { nom: voitureNom, count: 0, voitureId: item.voiture_id };
      }
      stats[voitureNom].count++;
    });
    return Object.values(stats).sort((a, b) => b.count - a.count);
  }, [getDataFiltree, data.voitures]);

  // Statistiques par projet
  const getStatsParProjet = useMemo(() => {
    const stats = {};
    getDataFiltree.forEach(item => {
      if (!item.projet_id) return;
      const projetNom = getNomProjet(item.projet_id);
      if (!stats[projetNom]) {
        stats[projetNom] = { nom: projetNom, count: 0, projetId: item.projet_id };
      }
      stats[projetNom].count++;
    });
    return Object.values(stats).sort((a, b) => b.count - a.count);
  }, [getDataFiltree, data.projets]);

  // Statistiques par chauffeur
  const getStatsParChauffeur = useMemo(() => {
    const stats = {};
    getDataFiltree.forEach(item => {
      if (!item.chauffeur_id) return;
      const chauffeurNom = getNomChauffeur(item.chauffeur_id);
      if (!stats[chauffeurNom]) {
        stats[chauffeurNom] = { nom: chauffeurNom, count: 0, chauffeurId: item.chauffeur_id, totalKm: 0, moyenneKm: 0 };
      }
      stats[chauffeurNom].count++;
      if (item.kilometrage_installation) stats[chauffeurNom].totalKm += item.kilometrage_installation;
    });
    Object.values(stats).forEach(stat => {
      stat.moyenneKm = stat.count > 0 ? Math.round(stat.totalKm / stat.count) : 0;
    });
    return Object.values(stats).sort((a, b) => b.count - a.count);
  }, [getDataFiltree, data.chauffeurs]);

  // Statistiques par modèle
  const getStatsParModele = useMemo(() => {
    const stats = {};
    getDataFiltree.forEach(item => {
      if (!item.modele) return;
      const modeleNom = getLibelleModele(item.modele);
      if (!stats[modeleNom]) {
        stats[modeleNom] = { nom: modeleNom, count: 0, modeleId: item.modele };
      }
      stats[modeleNom].count++;
    });
    return Object.values(stats).sort((a, b) => b.count - a.count);
  }, [getDataFiltree]);

  // Statistiques par marque
  const getStatsParMarque = useMemo(() => {
    const stats = {};
    getDataFiltree.forEach(item => {
      if (!item.marque) return;
      const marqueNom = getLibelleMarque(item.marque);
      if (!stats[marqueNom]) {
        stats[marqueNom] = { nom: marqueNom, count: 0, marqueId: item.marque };
      }
      stats[marqueNom].count++;
    });
    return Object.values(stats).sort((a, b) => b.count - a.count);
  }, [getDataFiltree]);

  // Statistiques mensuelles
  const getStatsMensuelles = useMemo(() => {
    const stats = MOIS.map((nom, index) => ({ nom, mois: index + 1, count: 0 }));
    getDataFiltree.forEach(item => {
      try {
        const date = new Date(item.date_installation);
        const moisIndex = date.getMonth();
        stats[moisIndex].count++;
      } catch (e) {}
    });
    return stats;
  }, [getDataFiltree]);

  // Statistiques annuelles
  const getStatsAnnuelles = useMemo(() => {
    const annees = {};
    data.consommation.forEach(item => {
      if (!item?.date_installation) return;
      try {
        const annee = new Date(item.date_installation).getFullYear();
        if (!annees[annee]) annees[annee] = { annee, count: 0 };
        annees[annee].count++;
      } catch (e) {}
    });
    return Object.values(annees).sort((a, b) => a.annee - b.annee);
  }, [data.consommation]);

  const getTopVoitures = useMemo(() => getStatsParVoiture.slice(0, 5), [getStatsParVoiture]);
  const getTopProjets = useMemo(() => getStatsParProjet.slice(0, 5), [getStatsParProjet]);
  const getTopChauffeurs = useMemo(() => getStatsParChauffeur.slice(0, 5), [getStatsParChauffeur]);
  const getTopMarques = useMemo(() => getStatsParMarque.slice(0, 5), [getStatsParMarque]);

  const totalItems = getDataFiltree.length;

  // Export Excel
  const exportToExcel = () => {
    if (!totalItems) {
      alert('Aucune donnée à exporter');
      return;
    }

    const dataExport = getDataFiltree.map(item => ({
      'Equipement': getNomVoiture(item.voiture_id),
      'Projet': getNomProjet(item.projet_id),
      'Chauffeur': getNomChauffeur(item.chauffeur_id),
      'Modèle': getLibelleModele(item.modele),
      'Marque': getLibelleMarque(item.marque),
      'Référence': item.reference || '-',
      'Référence Retour': item.reference_retour || '-',
      'Date Installation': item.date_installation ? new Date(item.date_installation).toLocaleDateString('fr-FR') : '-',
      'Kilométrage Installation': item.kilometrage_installation ? `${item.kilometrage_installation} km` : '-',
      'Statut': getStatutDetails(item.statut).nom,
      'Observations': item.observations || '-'
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataExport);
    XLSX.utils.book_append_sheet(wb, ws, 'Consommation Pneumatiques');

    const fileName = `rapport_pneumatiques_${filters.annee}${filters.mois ? `_mois_${filters.mois}` : ''}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const resetFilters = () => {
    setFilters({
      periodeType: 'mois',
      dateDebut: new Date().toISOString().split('T')[0],
      dateFin: new Date().toISOString().split('T')[0],
      annee: new Date().getFullYear(),
      mois: new Date().getMonth() + 1,
      projet: '',
      voiture: '',
      chauffeur: '',
      modele: '',
      marque: ''
    });
  };

  const showDetailsVoiture = (voitureId, voitureNom) => {
    const consommationVoiture = getDataFiltree.filter(item => item.voiture_id === voitureId);
    setDetailsModal({ show: true, type: 'voiture', id: voitureId, titre: `Détails - ${voitureNom}`, data: consommationVoiture });
  };

  const showDetailsProjet = (projetId, projetNom) => {
    const consommationProjet = getDataFiltree.filter(item => item.projet_id === projetId);
    setDetailsModal({ show: true, type: 'projet', id: projetId, titre: `Détails - ${projetNom}`, data: consommationProjet });
  };

  const showDetailsChauffeur = (chauffeurId, chauffeurNom) => {
    const consommationChauffeur = getDataFiltree.filter(item => item.chauffeur_id === chauffeurId);
    setDetailsModal({ show: true, type: 'chauffeur', id: chauffeurId, titre: `Détails - ${chauffeurNom}`, data: consommationChauffeur });
  };

  const showDetailsModele = (modeleId, modeleNom) => {
    const consommationModele = getDataFiltree.filter(item => item.modele === modeleId);
    setDetailsModal({ show: true, type: 'modele', id: modeleId, titre: `Détails - Modèle ${modeleNom}`, data: consommationModele });
  };

  const showDetailsMarque = (marqueId, marqueNom) => {
    const consommationMarque = getDataFiltree.filter(item => item.marque === marqueId);
    setDetailsModal({ show: true, type: 'marque', id: marqueId, titre: `Détails - Marque ${marqueNom}`, data: consommationMarque });
  };

  const closeDetailsModal = () => {
    setDetailsModal({ show: false, type: '', id: null, titre: '', data: [] });
  };

  // Composant Classement Equipements
  const ClassementEquipements = () => (
    <Card className="shadow-sm">
      <Card.Header className="bg-warning text-dark">
        <h5 className="mb-0"><FaTrophy className="me-2" />Classement des Equipements</h5>
      </Card.Header>
      <Card.Body>
        {getStatsParVoiture.length > 0 ? (
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Equipement (Matricule)</th>
                  <th>Nombre de pneumatiques</th>
                  <th>Pourcentage</th>
                  <th>Détails</th>
                </tr>
              </thead>
              <tbody>
                {getStatsParVoiture.map((voiture, index) => (
                  <tr key={voiture.voitureId}>
                    <td className="text-center">
                      <Badge bg={index < 3 ? "warning" : "secondary"} className="fs-6">
                        {index + 1}
                      </Badge>
                    </td>
                    <td className="fw-bold">
                      <div className="d-flex align-items-center">
                        {index === 0 && <span className="me-2">🥇</span>}
                        {index === 1 && <span className="me-2">🥈</span>}
                        {index === 2 && <span className="me-2">🥉</span>}
                        {voiture.nom}
                      </div>
                    </td>
                    <td className="text-center">
                      <Badge bg="primary" className="fs-6">{voiture.count}</Badge>
                    </td>
                    <td className="text-center">
                      <div className="d-flex align-items-center">
                        <div className="progress flex-grow-1" style={{ height: '8px' }}>
                          <div 
                            className="progress-bar bg-warning" 
                            style={{ width: `${(voiture.count / totalItems) * 100}%` }}
                          />
                        </div>
                        <span className="ms-2 fw-bold">{((voiture.count / totalItems) * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="text-center">
                      <Button 
                        variant="outline-info" 
                        size="sm"
                        onClick={() => showDetailsVoiture(voiture.voitureId, voiture.nom)}
                      >
                        Voir détails
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="table-active">
                <tr>
                  <td colSpan="2" className="fw-bold text-end">Total :</td>
                  <td className="text-center fw-bold">{totalItems}</td>
                  <td colSpan="2"></td>
                </tr>
              </tfoot>
            </Table>
          </div>
        ) : (
          <div className="text-center py-4">
            <FaInfoCircle size={48} className="text-muted mb-3" />
            <p>Aucune donnée disponible pour la période sélectionnée</p>
          </div>
        )}
        
        {getTopVoitures.length > 0 && (
          <div className="mt-4">
            <h6 className="mb-3">📊 Top 5 des équipements les plus consommateurs</h6>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getTopVoitures}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nom" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Nombre de pneumatiques" fill="#FFC107" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card.Body>
    </Card>
  );

  if (loading) {
    return (
      <Container fluid className="py-4">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Chargement du rapport...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container fluid className="py-4">
        <Alert variant="danger">
          <h5>Erreur de chargement</h5>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => window.location.reload()}>Réessayer</Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Card className="shadow-lg">
        <Card.Header className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h3 className="mb-0">📊 Rapport de Consommation Pneumatique</h3>
            <div>
              <Badge bg="light" text="dark" className="me-2">Total BD: {data.consommation.length}</Badge>
              <Badge bg="info" className="me-2">Filtré: {totalItems}</Badge>
              <Button variant="success" onClick={exportToExcel} disabled={!totalItems}>
                <FaDownload className="me-1" /> Exporter Excel
              </Button>
            </div>
          </div>
        </Card.Header>
        
        <Card.Body>
          {/* Message si aucune donnée dans la BD */}
          {data.consommation.length === 0 && (
            <Alert variant="warning" className="mb-4">
              <h5>⚠️ Aucune donnée trouvée dans la base de données</h5>
              <p>La table "consommation_pneumatiques" est vide ou inaccessible.</p>
              <Button variant="outline-primary" onClick={() => window.location.href = '/pneus/table'}>
                Aller à la gestion des pneumatiques
              </Button>
            </Alert>
          )}

          {/* Filtres de période */}
          <Row className="mb-4 g-3">
            <Col md={12}>
              <Card className="bg-light">
                <Card.Body>
                  <h6 className="mb-3"><FaCalendarAlt className="me-2" />Filtres par période</h6>
                  <Row>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Type de période</Form.Label>
                        <Form.Select
                          value={filters.periodeType}
                          onChange={e => {
                            const type = e.target.value;
                            setFilters(prev => ({
                              ...prev,
                              periodeType: type
                            }));
                          }}
                        >
                          <option value="mois">Mois</option>
                          <option value="annee">Année</option>
                          <option value="personnalise">Personnalisé</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    {filters.periodeType === 'mois' && (
                      <>
                        <Col md={2}>
                          <Form.Group>
                            <Form.Label>Année</Form.Label>
                            <Form.Select
                              value={filters.annee}
                              onChange={e => setFilters(prev => ({ ...prev, annee: parseInt(e.target.value) }))}
                            >
                              {[2023, 2024, 2025, 2026, 2027, 2028].map(a => (
                                <option key={a} value={a}>{a}</option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={2}>
                          <Form.Group>
                            <Form.Label>Mois</Form.Label>
                            <Form.Select
                              value={filters.mois}
                              onChange={e => setFilters(prev => ({ ...prev, mois: parseInt(e.target.value) }))}
                            >
                              {MOIS.map((m, i) => (
                                <option key={i + 1} value={i + 1}>{m}</option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </>
                    )}

                    {filters.periodeType === 'annee' && (
                      <Col md={3}>
                        <Form.Group>
                          <Form.Label>Année</Form.Label>
                          <Form.Select
                            value={filters.annee}
                            onChange={e => setFilters(prev => ({ ...prev, annee: parseInt(e.target.value) }))}
                          >
                            {[2023, 2024, 2025, 2026, 2027, 2028].map(a => (
                              <option key={a} value={a}>{a}</option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    )}

                    {filters.periodeType === 'personnalise' && (
                      <>
                        <Col md={3}>
                          <Form.Group>
                            <Form.Label>Date début</Form.Label>
                            <Form.Control
                              type="date"
                              value={filters.dateDebut}
                              onChange={e => setFilters(prev => ({ ...prev, dateDebut: e.target.value }))}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={3}>
                          <Form.Group>
                            <Form.Label>Date fin</Form.Label>
                            <Form.Control
                              type="date"
                              value={filters.dateFin}
                              onChange={e => setFilters(prev => ({ ...prev, dateFin: e.target.value }))}
                            />
                          </Form.Group>
                        </Col>
                      </>
                    )}
                  </Row>
                </Card.Body>
              </Card>
            </Col>

            {/* Filtres supplémentaires */}
            <Col md={2}>
              <Form.Group>
                <Form.Label>Projet</Form.Label>
                <Form.Select value={filters.projet} onChange={e => setFilters(prev => ({ ...prev, projet: e.target.value }))}>
                  <option value="">Tous</option>
                  {data.projets.map(p => (
                    <option key={p.id} value={p.id}>{p.name || p.nom || `Projet #${p.id}`}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={2}>
              <Form.Group>
                <Form.Label>Equipement</Form.Label>
                <Form.Select value={filters.voiture} onChange={e => setFilters(prev => ({ ...prev, voiture: e.target.value }))}>
                  <option value="">Tous</option>
                  {data.voitures.map(v => (
                    <option key={v.id} value={v.id}>{v.matricule || v.nom || `ID: ${v.id}`}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={2}>
              <Form.Group>
                <Form.Label>Chauffeur</Form.Label>
                <Form.Select value={filters.chauffeur} onChange={e => setFilters(prev => ({ ...prev, chauffeur: e.target.value }))}>
                  <option value="">Tous</option>
                  {data.chauffeurs.map(c => (
                    <option key={c.id} value={c.id}>{c.nom} {c.prenom || ''}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={2}>
              <Form.Group>
                <Form.Label>Modèle</Form.Label>
                <Form.Select value={filters.modele} onChange={e => setFilters(prev => ({ ...prev, modele: e.target.value }))}>
                  <option value="">Tous</option>
                  {MODELES_PNEUMATIQUE.map(m => (
                    <option key={m.id} value={m.id}>{m.nom}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={2}>
              <Form.Group>
                <Form.Label>Marque</Form.Label>
                <Form.Select value={filters.marque} onChange={e => setFilters(prev => ({ ...prev, marque: e.target.value }))}>
                  <option value="">Toutes</option>
                  {MARQUES_PNEUMATIQUE.map(m => (
                    <option key={m.id} value={m.id}>{m.nom}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={2} className="d-flex align-items-end">
              <Button variant="outline-secondary" onClick={resetFilters}>
                <FaFilter className="me-1" /> Réinitialiser
              </Button>
            </Col>
          </Row>

          {/* Résumé global */}
          <Row className="mb-4">
            <Col md={2}>
              <Card className="bg-light"><Card.Body className="text-center"><h5 className="text-primary">{totalItems}</h5><div>Total filtré</div></Card.Body></Card>
            </Col>
            <Col md={2}>
              <Card className="bg-light"><Card.Body className="text-center"><h5 className="text-success">{getDataFiltree.filter(p => p.statut === 'neuf').length}</h5><div>Neufs</div></Card.Body></Card>
            </Col>
            <Col md={2}>
              <Card className="bg-light"><Card.Body className="text-center"><h5 className="text-info">{getDataFiltree.filter(p => p.statut === 'recupere').length}</h5><div>Récupérés</div></Card.Body></Card>
            </Col>
            <Col md={2}>
              <Card className="bg-light"><Card.Body className="text-center"><h5 className="text-warning">{getDataFiltree.filter(p => p.modele === '13/22,5').length}</h5><div>13/22,5</div></Card.Body></Card>
            </Col>
            <Col md={2}>
              <Card className="bg-light"><Card.Body className="text-center"><h5 className="text-danger">{getDataFiltree.filter(p => p.modele === '1200R24').length}</h5><div>1200R24</div></Card.Body></Card>
            </Col>
            <Col md={2}>
              <Card className="bg-light"><Card.Body className="text-center"><h5 className="text-secondary">{getDataFiltree.filter(p => p.modele === '1200R20').length}</h5><div>1200R20</div></Card.Body></Card>
            </Col>
          </Row>

          {totalItems === 0 && data.consommation.length > 0 && (
            <Alert variant="info" className="text-center">
              <h5>Aucune donnée trouvée pour les filtres sélectionnés</h5>
              <p>Essayez de modifier vos filtres ou de sélectionner une autre période.</p>
            </Alert>
          )}

          {totalItems > 0 && (
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="mb-4"
              fill
            >
              <Tab
                eventKey="statistiques"
                title={
                  <span>
                    <FaChartBar className="me-2" />
                    Statistiques Globales
                  </span>
                }
              >
                {/* Tableaux de classement */}
                <Row className="mt-3">
                  <Col md={6}>
                    <Card>
                      <Card.Header><h5 className="mb-0">📋 Classement Projets</h5></Card.Header>
                      <Card.Body>
                        {getStatsParProjet.length > 0 ? (
                          <Table striped bordered hover size="sm">
                            <thead><tr><th>#</th><th>Projet</th><th>Qté</th><th>%</th></tr></thead>
                            <tbody>
                              {getStatsParProjet.map((projet, index) => (
                                <tr key={projet.projetId}>
                                  <td className="text-center"><Badge bg={index < 3 ? "info" : "secondary"}>{index + 1}</Badge></td>
                                  <td>
                                    <Button variant="link" className="p-0 text-dark" onClick={() => showDetailsProjet(projet.projetId, projet.nom)}>
                                      {projet.nom}
                                    </Button>
                                  </td>
                                  <td className="text-center"><Badge bg="success">{projet.count}</Badge></td>
                                  <td>{((projet.count / totalItems) * 100).toFixed(1)}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        ) : <p className="text-muted text-center">Aucune donnée</p>}
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={6}>
                    <Card>
                      <Card.Header><h5 className="mb-0">🛞 Classement Modèles</h5></Card.Header>
                      <Card.Body>
                        {getStatsParModele.length > 0 ? (
                          <Table striped bordered hover size="sm">
                            <thead><tr><th>#</th><th>Modèle</th><th>Qté</th><th>%</th></tr></thead>
                            <tbody>
                              {getStatsParModele.map((modele, index) => (
                                <tr key={modele.modeleId}>
                                  <td className="text-center"><Badge bg={index < 3 ? "danger" : "secondary"}>{index + 1}</Badge></td>
                                  <td>
                                    <Button variant="link" className="p-0 text-dark" onClick={() => showDetailsModele(modele.modeleId, modele.nom)}>
                                      {modele.nom}
                                    </Button>
                                  </td>
                                  <td className="text-center"><Badge bg="warning" text="dark">{modele.count}</Badge></td>
                                  <td>{((modele.count / totalItems) * 100).toFixed(1)}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        ) : <p className="text-muted text-center">Aucune donnée</p>}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <Row className="mt-3">
                  <Col md={6}>
                    <Card>
                      <Card.Header><h5 className="mb-0">🏷️ Classement Marques</h5></Card.Header>
                      <Card.Body>
                        {getStatsParMarque.length > 0 ? (
                          <Table striped bordered hover size="sm">
                            <thead><tr><th>#</th><th>Marque</th><th>Qté</th><th>%</th></tr></thead>
                            <tbody>
                              {getStatsParMarque.map((marque, index) => (
                                <tr key={marque.marqueId}>
                                  <td className="text-center"><Badge bg={index < 3 ? "primary" : "secondary"}>{index + 1}</Badge></td>
                                  <td>
                                    <Button variant="link" className="p-0 text-dark" onClick={() => showDetailsMarque(marque.marqueId, marque.nom)}>
                                      {marque.nom}
                                    </Button>
                                  </td>
                                  <td className="text-center"><Badge bg="info">{marque.count}</Badge></td>
                                  <td>{((marque.count / totalItems) * 100).toFixed(1)}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        ) : <p className="text-muted text-center">Aucune donnée</p>}
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={6}>
                    <Card>
                      <Card.Header><h5 className="mb-0">👤 Classement Chauffeurs</h5></Card.Header>
                      <Card.Body>
                        {getStatsParChauffeur.length > 0 ? (
                          <Table striped bordered hover size="sm">
                            <thead><tr><th>#</th><th>Chauffeur</th><th>Qté</th><th>Km Total</th><th>%</th></tr></thead>
                            <tbody>
                              {getStatsParChauffeur.map((chauffeur, index) => (
                                <tr key={chauffeur.chauffeurId}>
                                  <td className="text-center"><Badge bg={index < 3 ? "warning" : "secondary"}>{index + 1}</Badge></td>
                                  <td>
                                    <Button variant="link" className="p-0 text-dark" onClick={() => showDetailsChauffeur(chauffeur.chauffeurId, chauffeur.nom)}>
                                      {chauffeur.nom}
                                    </Button>
                                  </td>
                                  <td className="text-center"><Badge bg="primary">{chauffeur.count}</Badge></td>
                                  <td className="text-end">{chauffeur.totalKm?.toLocaleString()} km</td>
                                  <td>{((chauffeur.count / totalItems) * 100).toFixed(1)}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        ) : <p className="text-muted text-center">Aucune donnée</p>}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                {/* Graphiques */}
                <Row className="mt-3">
                  <Col md={6}>
                    <Card>
                      <Card.Header><h5 className="mb-0">📈 Consommation Mensuelle - {filters.annee}</h5></Card.Header>
                      <Card.Body>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={getStatsMensuelles}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="nom" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={6}>
                    <Card>
                      <Card.Header><h5 className="mb-0">📊 Évolution Annuelle</h5></Card.Header>
                      <Card.Body>
                        {getStatsAnnuelles.length > 0 ? (
                          <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={getStatsAnnuelles}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="annee" />
                              <YAxis />
                              <Tooltip />
                              <Line type="monotone" dataKey="count" stroke="#8884d8" />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : <p className="text-muted text-center">Pas de données annuelles</p>}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <Row className="mt-3">
                  <Col md={12}>
                    <Card>
                      <Card.Header><h5 className="mb-0">🏗️ Top 5 Projets</h5></Card.Header>
                      <Card.Body>
                        {getTopProjets.length > 0 ? (
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={getTopProjets}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="nom" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="count" name="Nombre de pneumatiques" fill="#00C49F" />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : <p className="text-muted text-center">Pas de données</p>}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <Row className="mt-3">
                  <Col md={6}>
                    <Card>
                      <Card.Header><h5 className="mb-0">🚗 Top 5 Marques</h5></Card.Header>
                      <Card.Body>
                        {getTopMarques.length > 0 ? (
                          <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                              <Pie data={getTopMarques} cx="50%" cy="50%" labelLine={false} label={({ nom, count }) => `${nom}: ${count}`} outerRadius={70} dataKey="count">
                                {getTopMarques.map((_, i) => (<Cell key={`cell-${i}`} fill={COLORS[(i + 2) % COLORS.length]} />))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : <p className="text-muted text-center">Pas de données</p>}
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={6}>
                    <Card>
                      <Card.Header><h5 className="mb-0">👤 Top 5 Chauffeurs</h5></Card.Header>
                      <Card.Body>
                        {getTopChauffeurs.length > 0 ? (
                          <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                              <Pie data={getTopChauffeurs} cx="50%" cy="50%" labelLine={false} label={({ nom, count }) => `${nom}: ${count}`} outerRadius={70} dataKey="count">
                                {getTopChauffeurs.map((_, i) => (<Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : <p className="text-muted text-center">Pas de données</p>}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Tab>

              <Tab
                eventKey="equipements"
                title={
                  <span>
                    <FaTrophy className="me-2" />
                    Classement Equipements
                  </span>
                }
              >
                <ClassementEquipements />
              </Tab>
            </Tabs>
          )}
        </Card.Body>
      </Card>

      {/* Modal de détails */}
      <Modal show={detailsModal.show} onHide={closeDetailsModal} size="xl">
        <Modal.Header closeButton className="bg-info text-white">
          <Modal.Title>{detailsModal.titre}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailsModal.data.length > 0 ? (
            <div className="table-responsive">
              <Table striped bordered hover size="sm">
                <thead className="table-dark">
                  <tr>
                    <th>Equipement</th>
                    <th>Projet</th>
                    <th>Chauffeur</th>
                    <th>Modèle</th>
                    <th>Marque</th>
                    <th>Référence</th>
                    <th>Date Installation</th>
                    <th>Km Installation</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {detailsModal.data.map(item => (
                    <tr key={item.id}>
                      <td className="fw-bold">{getNomVoiture(item.voiture_id)}</td>
                      <td><Badge bg="secondary">{getNomProjet(item.projet_id)}</Badge></td>
                      <td><Badge bg="warning">{getNomChauffeur(item.chauffeur_id)}</Badge></td>
                      <td><Badge bg="primary">{getLibelleModele(item.modele)}</Badge></td>
                      <td><Badge bg="info">{getLibelleMarque(item.marque)}</Badge></td>
                      <td>{item.reference || '-'}</td>
                      <td>{item.date_installation ? new Date(item.date_installation).toLocaleDateString('fr-FR') : '-'}</td>
                      <td className="text-end">{item.kilometrage_installation ? `${item.kilometrage_installation.toLocaleString()} km` : '-'}</td>
                      <td><Badge bg={getStatutDetails(item.statut).color}>{getStatutDetails(item.statut).nom}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <Alert variant="info">Aucune donnée trouvée</Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeDetailsModal}>Fermer</Button>
          <Button variant="primary" onClick={exportToExcel}>📄 Exporter</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default RapportConsommationPneumatique;