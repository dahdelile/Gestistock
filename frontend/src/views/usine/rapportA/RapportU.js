import React, { useState, useEffect, useMemo } from 'react';
import {
  Card, Container, Row, Col, Form, Spinner, Alert,
  Table, Badge, Tabs, Tab, Modal, Button, ButtonGroup
} from 'react-bootstrap';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import axios from 'axios';
import { format, subDays, parseISO, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import * as XLSX from 'xlsx';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const API_BASE_URL = 'http://localhost:8000/api';
const api = axios.create({ baseURL: API_BASE_URL });

const RapportArretsUsine = () => {
  const [state, setState] = useState({
    arrets: [],
    usines: [],
    projets: [],
    loading: true,
    error: null,
    selectedUsine: '',
    selectedProjet: '',
    dateDebut: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    dateFin: format(new Date(), 'yyyy-MM-dd'),
    activeTab: 'performance',
    showDetailModal: false,
    selectedUsineDetails: null,
    usineArrets: [],
    showCauseModal: false,
    selectedCauseDetails: null,
    causeArrets: [],
    showProjetModal: false,
    selectedProjetDetails: null,
    projetUsines: [],
    projetArrets: []
  });

  // Charger les données initiales
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [usinesRes, projetsRes, arretsRes] = await Promise.all([
          api.get('/usines/'),
          api.get('/projets/'),
          api.get('/arretUsines/')
        ]);

        console.log("Données chargées:", {
          usines: usinesRes.data,
          projets: projetsRes.data,
          arrets: arretsRes.data
        });

        setState(prev => ({
          ...prev,
          usines: usinesRes.data,
          projets: projetsRes.data,
          arrets: Array.isArray(arretsRes.data) ? arretsRes.data : arretsRes.data.results || [],
          loading: false
        }));
      } catch (err) {
        console.error("Erreur chargement initial:", err);
        setState(prev => ({ ...prev, error: err.message, loading: false }));
      }
    };
    fetchInitialData();
  }, []);

  // Fonction pour obtenir les détails d'une usine par ID
  const getUsineDetails = (usineId) => {
    if (!usineId) return { matricule: 'Inconnue', projet: 'Inconnu' };
    
    const usine = state.usines.find(u => u.id === usineId);
    if (usine) {
      // Trouver le projet associé à l'usine
      const projet = state.projets.find(p => p.id === usine.projet);
      return {
        matricule: usine.matricule || 'Inconnue',
        projet: projet?.name || 'Inconnu',
        projetId: usine.projet
      };
    }
    
    return { matricule: 'Inconnue', projet: 'Inconnu' };
  };

  // Fonction pour obtenir les détails d'un projet par ID
  const getProjetDetails = (projetId) => {
    if (!projetId) return { name: 'Inconnu' };
    const projet = state.projets.find(p => p.id === projetId);
    return projet || { name: 'Inconnu' };
  };

  // Fonction pour afficher les détails d'une usine
  const handleShowUsineDetails = async (usine) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const arretsUsine = filteredArrets.filter(arret => 
        arret.usine === usine.id
      );

      setState(prev => ({
        ...prev,
        selectedUsineDetails: usine,
        usineArrets: arretsUsine,
        showDetailModal: true,
        loading: false
      }));
    } catch (error) {
      console.error("Erreur chargement détails:", error);
      setState(prev => ({ ...prev, error: error.message, loading: false }));
    }
  };

  // Fonction pour afficher les détails d'une cause d'arrêt
  const handleShowCauseDetails = async (cause) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      // Filtrer les arrêts pour cette cause
      const arretsCause = filteredArrets.filter(arret => 
        arret.cause_panne === cause.name
      );

      // Calculer les statistiques pour cette cause
      const statsCause = {
        totalArrets: arretsCause.length,
        totalHim: arretsCause.reduce((sum, a) => sum + (a.him || 0), 0),
        totalTF: arretsCause.reduce((sum, a) => sum + (a.temps_fonctionnement || 0), 0),
        usinesConcernées: [...new Set(arretsCause.map(a => a.usine))].length,
        projetsConcernés: [...new Set(arretsCause.map(a => a.projet))].length
      };

      setState(prev => ({
        ...prev,
        selectedCauseDetails: {
          ...cause,
          stats: statsCause
        },
        causeArrets: arretsCause,
        showCauseModal: true,
        loading: false
      }));
    } catch (error) {
      console.error("Erreur chargement détails cause:", error);
      setState(prev => ({ ...prev, error: error.message, loading: false }));
    }
  };

  // Fonction pour afficher les détails d'un projet
  const handleShowProjetDetails = async (projet) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      // Filtrer les usines ayant des arrêts pour ce projet
      const usinesDuProjet = indicateursParUsine.filter(usine => 
        usine.projetId === projet.id
      );

      // Récupérer tous les arrêts de ce projet
      const arretsDuProjet = filteredArrets.filter(arret => 
        arret.projet === projet.id
      );

      setState(prev => ({
        ...prev,
        selectedProjetDetails: projet,
        projetUsines: usinesDuProjet,
        projetArrets: arretsDuProjet,
        showProjetModal: true,
        loading: false
      }));
    } catch (error) {
      console.error("Erreur chargement détails projet:", error);
      setState(prev => ({ ...prev, error: error.message, loading: false }));
    }
  };

  // Fermer les modals
  const handleCloseDetailModal = () => {
    setState(prev => ({
      ...prev,
      showDetailModal: false,
      selectedUsineDetails: null,
      usineArrets: []
    }));
  };

  const handleCloseCauseModal = () => {
    setState(prev => ({
      ...prev,
      showCauseModal: false,
      selectedCauseDetails: null,
      causeArrets: []
    }));
  };

  const handleCloseProjetModal = () => {
    setState(prev => ({
      ...prev,
      showProjetModal: false,
      selectedProjetDetails: null,
      projetUsines: [],
      projetArrets: []
    }));
  };

  // Export Excel pour les arrêts d'usine
  const handleExportExcel = () => {
    try {
      // Préparer les données pour l'export des usines
      const usinesData = indicateursParUsine.map(usine => ({
        'Usine': usine.matricule,
        'Projet': usine.projet,
        "Nombre d'arrêts": usine.nombreArrets,
        'HIM (h)': usine.him,
        'TF (h)': usine.temps_fonctionnement,
        'MTBF (h)': usine.mtbf,
        'TDM (%)': usine.tdm
      }));

      // Préparer les données pour l'export des causes
      const causesData = paretoCauses.map(cause => ({
        'Cause Arrêt': cause.name,
        "Nombre d'arrêts": cause.count,
        'HIM Total (h)': cause.him,
        'TF Total (h)': cause.temps_fonctionnement
      }));

      // Préparer les données détaillées des arrêts
      const arretsData = filteredArrets.map(arret => {
        const usineDetails = getUsineDetails(arret.usine);
        const projetDetails = getProjetDetails(arret.projet);
        
        return {
          'Date': arret.date_panne ? format(parseISO(arret.date_panne), 'dd/MM/yyyy HH:mm') : 'N/A',
          'Date Réparation': arret.date_reparation ? format(parseISO(arret.date_reparation), 'dd/MM/yyyy HH:mm') : 'En cours',
          'Usine': usineDetails.matricule,
          'Projet': projetDetails.name,
          'Cause Arrêt': arret.cause_panne || 'Non spécifiée',
          'Code Panne': arret.code_panne_details?.code || 'Non spécifié',
          'Durée (h)': arret.duree_panne || 0,
          'HIM (h)': arret.him || 0,
          'TF (h)': arret.temps_fonctionnement || 0,
          'Intervenant': arret.intervenant || 'Non spécifié',
          'Travaux Effectués': arret.travaux_effectues || 'Non spécifié'
        };
      });

      // Créer un workbook avec plusieurs feuilles
      const wb = XLSX.utils.book_new();
      
      // Feuille Performance Usines
      const wsUsines = XLSX.utils.json_to_sheet(usinesData);
      XLSX.utils.book_append_sheet(wb, wsUsines, 'Performance_Usines');

      // Feuille Arrêts par Cause
      const wsCauses = XLSX.utils.json_to_sheet(causesData);
      XLSX.utils.book_append_sheet(wb, wsCauses, 'Arrets_par_Cause');

      // Feuille Détail des Arrêts
      const wsArrets = XLSX.utils.json_to_sheet(arretsData);
      XLSX.utils.book_append_sheet(wb, wsArrets, 'Détail_Arrets');

      // Ajuster la largeur des colonnes
      const setColumnWidth = (worksheet) => {
        const colWidths = [];
        XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0].forEach((header, idx) => {
          let maxLength = header ? header.length : 10;
          XLSX.utils.sheet_to_json(worksheet).forEach(row => {
            const value = row[header];
            if (value && value.toString().length > maxLength) {
              maxLength = value.toString().length;
            }
          });
          colWidths[idx] = { wch: Math.min(maxLength + 2, 30) };
        });
        worksheet['!cols'] = colWidths;
      };

      setColumnWidth(wsUsines);
      setColumnWidth(wsCauses);
      setColumnWidth(wsArrets);

      // Exporter le fichier
      const fileName = `rapport_arrets_usine_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      // Message de succès
      alert(`Fichier Excel "${fileName}" généré avec succès !`);
      
    } catch (error) {
      console.error("Erreur export Excel:", error);
      alert("Erreur lors de la génération du fichier Excel");
    }
  };

  // Filtrer les arrêts selon les critères
  const filteredArrets = useMemo(() => {
    try {
      const debut = parseISO(state.dateDebut);
      const fin = parseISO(state.dateFin + 'T23:59:59');

      return state.arrets.filter(arret => {
        if (!arret.date_panne) return false;
        
        const datePanne = parseISO(arret.date_panne);
        
        const dateInRange = isWithinInterval(datePanne, { start: debut, end: fin });
        const usineMatch = !state.selectedUsine || arret.usine == state.selectedUsine;
        const projetMatch = !state.selectedProjet || arret.projet == state.selectedProjet;

        return dateInRange && usineMatch && projetMatch;
      });
    } catch (error) {
      console.error("Erreur filtrage:", error);
      return [];
    }
  }, [state.arrets, state.dateDebut, state.dateFin, state.selectedUsine, state.selectedProjet]);

  // Indicateurs par usine
  const indicateursParUsine = useMemo(() => {
    const result = {};

    filteredArrets.forEach(arret => {
      const usineId = arret.usine;
      if (!usineId) return;

      if (!result[usineId]) {
        const usineDetails = getUsineDetails(usineId);
        result[usineId] = {
          id: usineId,
          matricule: usineDetails.matricule,
          projet: usineDetails.projet,
          projetId: usineDetails.projetId,
          nombreArrets: 0,
          him: 0,
          temps_fonctionnement: 0,
          details: usineDetails
        };
      }

      result[usineId].nombreArrets += 1;
      result[usineId].him += arret.him || 0;
      result[usineId].temps_fonctionnement += arret.temps_fonctionnement || 0;
    });

    return Object.values(result).map(u => ({
      ...u,
      mtbf: u.nombreArrets > 0 ? (u.temps_fonctionnement / u.nombreArrets).toFixed(2) : '0.00',
      tdm: u.temps_fonctionnement + u.him > 0 ? 
           ((u.temps_fonctionnement / (u.temps_fonctionnement + u.him)) * 100).toFixed(1) : '0.0'
    })).sort((a, b) => b.nombreArrets - a.nombreArrets);
  }, [filteredArrets, state.usines, state.projets]);

  // Données Pareto par cause d'arrêt
  const paretoCauses = useMemo(() => {
    const causesMap = {};

    filteredArrets.forEach(arret => {
      const causeName = arret.cause_panne || 'Non spécifiée';
      
      if (!causesMap[causeName]) {
        causesMap[causeName] = {
          name: causeName,
          count: 0,
          him: 0,
          temps_fonctionnement: 0
        };
      }
      causesMap[causeName].count += 1;
      causesMap[causeName].him += arret.him || 0;
      causesMap[causeName].temps_fonctionnement += arret.temps_fonctionnement || 0;
    });

    return Object.values(causesMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredArrets]);

  // Données Pareto par projet
  const paretoProjet = useMemo(() => {
    const projetsMap = {};

    filteredArrets.forEach(arret => {
      const projetId = arret.projet;
      if (!projetId) return;

      if (!projetsMap[projetId]) {
        const projetDetails = getProjetDetails(projetId);
        projetsMap[projetId] = {
          id: projetId,
          name: projetDetails.name,
          count: 0
        };
      }
      projetsMap[projetId].count += 1;
    });

    return Object.values(projetsMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredArrets, state.projets]);

  // Configuration des graphiques
  const performanceChartData = {
    labels: indicateursParUsine.map(u => u.matricule),
    datasets: [
      {
        label: "Nombre d'arrêts",
        data: indicateursParUsine.map(u => u.nombreArrets),
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
        yAxisID: 'y'
      },
      {
        label: 'MTBF (heures)',
        data: indicateursParUsine.map(u => parseFloat(u.mtbf)),
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        yAxisID: 'y1'
      }
    ]
  };

  const paretoCausesChartData = {
    labels: paretoCauses.map(c => c.name),
    datasets: [{
      label: "Nombre d'arrêts",
      data: paretoCauses.map(c => c.count),
      backgroundColor: [
        'rgba(255, 99, 132, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(153, 102, 255, 0.7)',
        'rgba(255, 159, 64, 0.7)',
        'rgba(199, 199, 199, 0.7)',
        'rgba(83, 102, 255, 0.7)',
        'rgba(40, 159, 64, 0.7)',
        'rgba(210, 99, 132, 0.7)'
      ],
    }]
  };


  // Statistiques globales
  const statsGlobales = useMemo(() => {
    const totalArrets = filteredArrets.length;
    const totalHim = filteredArrets.reduce((sum, a) => sum + (a.him || 0), 0);
    const totalTF = filteredArrets.reduce((sum, a) => sum + (a.temps_fonctionnement || 0), 0);
    const totalUsines = [...new Set(filteredArrets.map(a => a.usine))].length;

    return { 
      totalArrets, 
      totalUsines, 
      totalHim: totalHim.toFixed(1), 
      tempsFonctionnementGlobal: totalTF.toFixed(1),
      tdmGlobal: totalTF + totalHim > 0 ? ((totalTF / (totalTF + totalHim)) * 100).toFixed(1) : '100'
    };
  }, [filteredArrets]);

  return (
    <Container fluid className="py-4">
      <Card className="shadow-lg">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h3 className="mb-0">Rapport des Arrêts d'Usine</h3>
          <Button 
            variant="success" 
            onClick={handleExportExcel}
            disabled={indicateursParUsine.length === 0}
          >
            📊 Exporter Excel
          </Button>
        </Card.Header>
        <Card.Body>
          {state.loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Chargement des données...</p>
            </div>
          ) : state.error ? (
            <Alert variant="danger">{state.error}</Alert>
          ) : (
            <>
              {/* Filtres */}
              <Row className="mb-4 g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Usine</Form.Label>
                    <Form.Select
                      value={state.selectedUsine}
                      onChange={e => setState(prev => ({ ...prev, selectedUsine: e.target.value }))}
                    >
                      <option value="">Toutes</option>
                      {state.usines.map(u => (
                        <option key={u.id} value={u.id}>{u.matricule}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
               
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Date début</Form.Label>
                    <Form.Control
                      type="date"
                      value={state.dateDebut}
                      onChange={e => setState(prev => ({ ...prev, dateDebut: e.target.value }))}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Date fin</Form.Label>
                    <Form.Control
                      type="date"
                      value={state.dateFin}
                      onChange={e => setState(prev => ({ ...prev, dateFin: e.target.value }))}
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Affichage des données de débogage */}
              {filteredArrets.length > 0 && (
                <Alert variant="info" className="small">
                  <strong>Données chargées:</strong> {filteredArrets.length} arrêts, {state.usines.length} usines, {state.projets.length} projets
                </Alert>
              )}

              {/* Onglets */}
              <Tabs
                activeKey={state.activeTab}
                onSelect={(k) => setState(prev => ({ ...prev, activeTab: k }))}
                className="mb-3"
              >
                <Tab eventKey="performance" title="Performance">
                  <PerformanceTab 
                    statsGlobales={statsGlobales}
                    performanceChartData={performanceChartData}
                    indicateursParUsine={indicateursParUsine}
                    onShowUsineDetails={handleShowUsineDetails}
                  />
                </Tab>
                <Tab eventKey="causes" title="Analyse des Causes">
                  <CausesTab 
                    paretoCauses={paretoCauses}
                    paretoCausesChartData={paretoCausesChartData}
                    onShowCauseDetails={handleShowCauseDetails}
                  />
                </Tab>
               
              </Tabs>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Modals */}
      <DetailArretsModal
        show={state.showDetailModal}
        onHide={handleCloseDetailModal}
        usine={state.selectedUsineDetails}
        arrets={state.usineArrets}
        getUsineDetails={getUsineDetails}
        getProjetDetails={getProjetDetails}
      />

      <CauseDetailModal
        show={state.showCauseModal}
        onHide={handleCloseCauseModal}
        cause={state.selectedCauseDetails}
        arrets={state.causeArrets}
        getUsineDetails={getUsineDetails}
        getProjetDetails={getProjetDetails}
      />

      <ProjetDetailModal
        show={state.showProjetModal}
        onHide={handleCloseProjetModal}
        projet={state.selectedProjetDetails}
        usines={state.projetUsines}
        arrets={state.projetArrets}
        getUsineDetails={getUsineDetails}
      />
    </Container>
  );
};

// Composant pour l'onglet Performance
const PerformanceTab = ({ statsGlobales, performanceChartData, indicateursParUsine, onShowUsineDetails }) => (
  <>
    <Card className="mb-4 shadow-sm">
      <Card.Body>
        <h5 className="mb-3">Synthèse globale</h5>
        <Row className="text-center">
          {[
            { label: 'Arrêts', value: statsGlobales.totalArrets, color: 'danger' },
            { label: 'Usines', value: statsGlobales.totalUsines, color: 'primary' },
            { label: 'HIM (h)', value: statsGlobales.totalHim, color: 'warning' },
            { label: 'TDM (%)', value: statsGlobales.tdmGlobal, color: 'success' },
          ].map((item, idx) => (
            <Col md={3} key={idx}>
              <div className="p-3 bg-light rounded">
                <div className="text-muted small">{item.label}</div>
                <div className={`fs-3 fw-bold text-${item.color}`}>{item.value}</div>
              </div>
            </Col>
          ))}
        </Row>
      </Card.Body>
    </Card>

    <Card className="shadow-sm">
      <Card.Header>
        <h5>Détail par Usine</h5>
      </Card.Header>
      <Card.Body>
        {indicateursParUsine.length > 0 ? (
          <Table striped bordered hover responsive>
            <thead className="table-dark">
              <tr>
                <th>Usine</th>
                <th>Projet</th>
                <th className="text-center">Arrêts</th>
                <th className="text-center">HIM (h)</th>
                <th className="text-center">TF (h)</th>
                <th className="text-center">MTBF (h)</th>
                <th className="text-center">TDM (%)</th>
              </tr>
            </thead>
            <tbody>
              {indicateursParUsine.map((u, index) => (
                <tr key={index}>
                  <td>
                    <Button 
                      variant="link" 
                      className="p-0 text-decoration-none fw-bold"
                      onClick={() => onShowUsineDetails(u)}
                    >
                      {u.matricule}
                    </Button>
                  </td>
                  <td>{u.projet}</td>
                  <td className="text-center"><Badge bg="danger">{u.nombreArrets}</Badge></td>
                  <td className="text-center">{u.him.toFixed(1)}</td>
                  <td className="text-center">{u.temps_fonctionnement.toFixed(1)}</td>
                  <td className="text-center">
                    <Badge bg={parseFloat(u.mtbf) > 50 ? 'success' : parseFloat(u.mtbf) > 20 ? 'warning' : 'danger'}>
                      {u.mtbf}
                    </Badge>
                  </td>
                  <td className="text-center">
                    <Badge bg={parseFloat(u.tdm) > 90 ? 'success' : parseFloat(u.tdm) > 80 ? 'warning' : 'danger'}>
                      {u.tdm}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <Alert variant="info" className="text-center">
            Aucun arrêt trouvé pour les critères sélectionnés.
          </Alert>
        )}
      </Card.Body>
    </Card>

    {indicateursParUsine.length > 0 && (
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <div style={{ height: '400px' }}>
            <Bar 
              data={performanceChartData} 
              options={{
                responsive: true,
                plugins: {
                  title: { display: true, text: 'Performance par Usine' }
                },
                scales: {
                  y: { 
                    title: { display: true, text: "Nombre d'arrêts" },
                    beginAtZero: true
                  },
                  y1: { 
                    title: { display: true, text: 'MTBF (heures)' },
                    grid: { drawOnChartArea: false },
                    beginAtZero: true
                  }
                }
              }} 
            />
          </div>
        </Card.Body>
      </Card>
    )}
  </>
);

// Composant pour l'onglet Analyse des Causes
const CausesTab = ({ paretoCauses, paretoCausesChartData, onShowCauseDetails }) => (
  <Row>
    <Col md={6}>
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-warning text-dark">
          <h5>Pareto - Arrêts par Cause</h5>
        </Card.Header>
        <Card.Body>
          {paretoCauses.length > 0 ? (
            <div style={{ height: '400px' }}>
              <Bar 
                data={paretoCausesChartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    title: { display: true, text: 'Top 10 causes d\'arrêts' }
                  },
                  scales: {
                    x: {
                      ticks: {
                        maxRotation: 45,
                        minRotation: 45
                      }
                    }
                  }
                }}
              />
            </div>
          ) : (
            <Alert variant="info" className="text-center">
              Aucune donnée disponible pour l'analyse des causes.
            </Alert>
          )}
        </Card.Body>
      </Card>
    </Col>
    <Col md={6}>
      <Card className="shadow-sm">
        <Card.Header className="bg-warning text-dark d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Détail des arrêts par cause</h5>
        </Card.Header>
        <Card.Body>
          {paretoCauses.length > 0 ? (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Cause d'Arrêt</th>
                    <th className="text-center">Nombre</th>
                    <th className="text-center">HIM Total</th>
                    <th className="text-center">TF Total</th>
                  </tr>
                </thead>
                <tbody>
                  {paretoCauses.map((cause, index) => (
                    <tr key={index}>
                      <td>
                        <Button 
                          variant="link" 
                          className="p-0 text-decoration-none fw-bold text-start"
                          onClick={() => onShowCauseDetails(cause)}
                          style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}
                        >
                          {cause.name}
                        </Button>
                      </td>
                      <td className="text-center">
                        <Badge bg="warning">{cause.count}</Badge>
                      </td>
                      <td className="text-center text-danger">
                        {cause.him.toFixed(1)}h
                      </td>
                      <td className="text-center text-success">
                        {cause.temps_fonctionnement.toFixed(1)}h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <Alert variant="info" className="text-center">
              Aucune cause d'arrêt trouvée.
            </Alert>
          )}
        </Card.Body>
      </Card>
    </Col>
  </Row>
);

// Composant pour l'onglet Pareto
const ParetoTab = ({ paretoProjet, paretoProjetChartData, onShowProjetDetails }) => (
  <Row>
    <Col md={6}>
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-danger text-white">
          <h5>Pareto - Arrêts par projet</h5>
        </Card.Header>
        <Card.Body>
          {paretoProjet.length > 0 ? (
            <div style={{ height: '300px' }}>
              <Bar 
                data={paretoProjetChartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    title: { display: true, text: 'Top 10 projets par nombre d\'arrêts' }
                  }
                }}
              />
            </div>
          ) : (
            <Alert variant="info" className="text-center">
              Aucune donnée disponible pour l'analyse Pareto.
            </Alert>
          )}
        </Card.Body>
      </Card>
    </Col>
    <Col md={6}>
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Détail des arrêts par projet</h5>
        </Card.Header>
        <Card.Body>
          {paretoProjet.length > 0 ? (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Projet</th>
                  <th className="text-center">Nombre d'arrêts</th>
                </tr>
              </thead>
              <tbody>
                {paretoProjet.map((projet, index) => (
                  <tr key={index}>
                    <td>
                      <Button 
                        variant="link" 
                        className="p-0 text-decoration-none fw-bold"
                        onClick={() => onShowProjetDetails(projet)}
                      >
                        {projet.name}
                      </Button>
                    </td>
                    <td className="text-center">
                      <Badge bg="primary">{projet.count}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <Alert variant="info" className="text-center">
              Aucun projet avec des arrêts trouvé.
            </Alert>
          )}
        </Card.Body>
      </Card>
    </Col>
  </Row>
);

// Composant Modal pour afficher les détails des arrêts d'une usine
const DetailArretsModal = ({ show, onHide, usine, arrets, getUsineDetails, getProjetDetails }) => {
  if (!usine) return null;

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          Détails des arrêts - {usine.matricule}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row className="mb-4">
          <Col md={6}>
            <Card className="bg-light">
              <Card.Body>
                <h6>Informations Usine</h6>
                <p className="mb-1"><strong>Matricule:</strong> {usine.matricule}</p>
                <p className="mb-1"><strong>Projet:</strong> {usine.projet}</p>
                <p className="mb-0"><strong>Total arrêts:</strong> {arrets.length}</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="bg-light">
              <Card.Body>
                <h6>Indicateurs</h6>
                <p className="mb-1">
                  <strong>HIM Total:</strong> {arrets.reduce((sum, a) => sum + (a.him || 0), 0).toFixed(1)}h
                </p>
                <p className="mb-1">
                  <strong>TF Total:</strong> {arrets.reduce((sum, a) => sum + (a.temps_fonctionnement || 0), 0).toFixed(1)}h
                </p>
                <p className="mb-0">
                  <strong>MTBF:</strong> {usine.mtbf || 'N/A'}h
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <h6 className="mb-3">Liste détaillée des arrêts</h6>
        {arrets.length > 0 ? (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <Table striped bordered hover size="sm">
              <thead className="table-secondary">
                <tr>
                  <th>Date Début</th>
                  <th>Date Fin</th>
                  <th>Durée (h)</th>
                  <th>Cause Arrêt</th>
                  <th>Code Panne</th>
                  <th className="text-center">HIM (h)</th>
                  <th className="text-center">TF (h)</th>
                  <th>Intervenant</th>
                </tr>
              </thead>
              <tbody>
                {arrets.map((arret, index) => (
                  <tr key={index}>
                    <td>{arret.date_panne ? format(parseISO(arret.date_panne), 'dd/MM/yyyy HH:mm') : 'N/A'}</td>
                    <td>{arret.date_reparation ? format(parseISO(arret.date_reparation), 'dd/MM/yyyy HH:mm') : 'En cours'}</td>
                    <td className="text-center">{arret.duree_panne || 0}</td>
                    <td>{arret.cause_panne || 'Non spécifiée'}</td>
                    <td>
                      <Badge bg={arret.code_panne_details?.code ? 'info' : 'secondary'}>
                        {arret.code_panne_details?.code || 'Non spécifié'}
                      </Badge>
                    </td>
                    <td className="text-center">{arret.him || 0}</td>
                    <td className="text-center">{arret.temps_fonctionnement || 0}</td>
                    <td>{arret.intervenant || 'Non spécifié'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ) : (
          <Alert variant="info" className="text-center">
            Aucun arrêt enregistré pour cette usine dans la période sélectionnée.
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Fermer
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// Composant Modal pour afficher les détails d'une cause d'arrêt
const CauseDetailModal = ({ show, onHide, cause, arrets, getUsineDetails, getProjetDetails }) => {
  if (!cause) return null;

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton className="bg-warning text-dark">
        <Modal.Title>
          Détails de la cause d'arrêt - {cause.name}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row className="mb-4">
          <Col md={6}>
            <Card className="bg-light">
              <Card.Body>
                <h6>Informations Cause</h6>
                <p className="mb-1"><strong>Cause:</strong> {cause.name}</p>
                <p className="mb-1"><strong>Total arrêts:</strong> {cause.stats.totalArrets}</p>
                <p className="mb-0"><strong>Usines concernées:</strong> {cause.stats.usinesConcernées}</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="bg-light">
              <Card.Body>
                <h6>Impact de cette cause</h6>
                <p className="mb-1">
                  <strong>HIM Total:</strong> {cause.stats.totalHim.toFixed(1)}h
                </p>
                <p className="mb-1">
                  <strong>TF Total:</strong> {cause.stats.totalTF.toFixed(1)}h
                </p>
                <p className="mb-0">
                  <strong>Projets concernés:</strong> {cause.stats.projetsConcernés}
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <h6 className="mb-3">Répartition par usine</h6>
        {arrets.length > 0 ? (
          <>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }} className="mb-4">
              <Table striped bordered hover size="sm">
                <thead className="table-secondary">
                  <tr>
                    <th>Usine</th>
                    <th>Projet</th>
                    <th className="text-center">Nombre d'arrêts</th>
                    <th className="text-center">HIM Total</th>
                    <th className="text-center">TF Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(
                    arrets.reduce((acc, arret) => {
                      const usineId = arret.usine;
                      if (!acc[usineId]) {
                        const usineDetails = getUsineDetails(usineId);
                        const projetDetails = getProjetDetails(arret.projet);
                        acc[usineId] = {
                          usine: usineDetails.matricule,
                          projet: projetDetails.name,
                          count: 0,
                          him: 0,
                          tf: 0
                        };
                      }
                      acc[usineId].count += 1;
                      acc[usineId].him += arret.him || 0;
                      acc[usineId].tf += arret.temps_fonctionnement || 0;
                      return acc;
                    }, {})
                  ).map(([usineId, data], index) => (
                    <tr key={index}>
                      <td className="fw-bold">{data.usine}</td>
                      <td>{data.projet}</td>
                      <td className="text-center"><Badge bg="warning">{data.count}</Badge></td>
                      <td className="text-center text-danger">{data.him.toFixed(1)}h</td>
                      <td className="text-center text-success">{data.tf.toFixed(1)}h</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            <h6 className="mb-3">Détail de tous les arrêts pour cette cause</h6>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <Table striped bordered hover size="sm">
                <thead className="table-secondary">
                  <tr>
                    <th>Date Début</th>
                    <th>Date Fin</th>
                    <th>Usine</th>
                    <th>Projet</th>
                    <th className="text-center">Durée (h)</th>
                    <th className="text-center">HIM (h)</th>
                    <th className="text-center">TF (h)</th>
                    <th>Intervenant</th>
                  </tr>
                </thead>
                <tbody>
                  {arrets.map((arret, index) => {
                    const usineDetails = getUsineDetails(arret.usine);
                    const projetDetails = getProjetDetails(arret.projet);
                    return (
                      <tr key={index}>
                        <td>{arret.date_panne ? format(parseISO(arret.date_panne), 'dd/MM/yyyy HH:mm') : 'N/A'}</td>
                        <td>{arret.date_reparation ? format(parseISO(arret.date_reparation), 'dd/MM/yyyy HH:mm') : 'En cours'}</td>
                        <td className="fw-bold">{usineDetails.matricule}</td>
                        <td>{projetDetails.name}</td>
                        <td className="text-center">{arret.duree_panne || 0}</td>
                        <td className="text-center">{arret.him || 0}</td>
                        <td className="text-center">{arret.temps_fonctionnement || 0}</td>
                        <td>{arret.intervenant || 'Non spécifié'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </>
        ) : (
          <Alert variant="info" className="text-center">
            Aucun arrêt enregistré pour cette cause dans la période sélectionnée.
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Fermer
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// Composant Modal pour afficher les détails d'un projet
const ProjetDetailModal = ({ show, onHide, projet, usines, arrets, getUsineDetails }) => {
  if (!projet) return null;

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton className="bg-info text-white">
        <Modal.Title>
          Détails du projet - {projet.name}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row className="mb-4">
          <Col md={4}>
            <Card className="bg-light">
              <Card.Body>
                <h6>Informations Projet</h6>
                <p className="mb-1"><strong>Nom:</strong> {projet.name}</p>
                <p className="mb-1"><strong>Total arrêts:</strong> {projet.count}</p>
                <p className="mb-0"><strong>Usines concernées:</strong> {usines.length}</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={8}>
            <Card className="bg-light">
              <Card.Body>
                <h6>Statistiques du projet</h6>
                <Row className="text-center">
                  <Col md={4}>
                    <div className="p-2">
                      <div className="text-muted small">HIM Total</div>
                      <div className="fw-bold text-warning">
                        {arrets.reduce((sum, a) => sum + (a.him || 0), 0).toFixed(1)}h
                      </div>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="p-2">
                      <div className="text-muted small">TF Total</div>
                      <div className="fw-bold text-success">
                        {arrets.reduce((sum, a) => sum + (a.temps_fonctionnement || 0), 0).toFixed(1)}h
                      </div>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="p-2">
                      <div className="text-muted small">TDM Moyen</div>
                      <div className="fw-bold text-primary">
                        {usines.length > 0 
                          ? (usines.reduce((sum, u) => sum + parseFloat(u.tdm), 0) / usines.length).toFixed(1)
                          : '0'
                        }%
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <h6 className="mb-3">Usines en arrêt dans ce projet</h6>
        {usines.length > 0 ? (
          <div style={{ maxHeight: '300px', overflowY: 'auto' }} className="mb-4">
            <Table striped bordered hover size="sm">
              <thead className="table-secondary">
                <tr>
                  <th>Usine</th>
                  <th className="text-center">Arrêts</th>
                  <th className="text-center">HIM (h)</th>
                  <th className="text-center">TF (h)</th>
                  <th className="text-center">MTBF (h)</th>
                  <th className="text-center">TDM (%)</th>
                </tr>
              </thead>
              <tbody>
                {usines.map((usine, index) => (
                  <tr key={index}>
                    <td className="fw-bold">{usine.matricule}</td>
                    <td className="text-center"><Badge bg="danger">{usine.nombreArrets}</Badge></td>
                    <td className="text-center">{usine.him.toFixed(1)}</td>
                    <td className="text-center">{usine.temps_fonctionnement.toFixed(1)}</td>
                    <td className="text-center">
                      <Badge bg={parseFloat(usine.mtbf) > 50 ? 'success' : parseFloat(usine.mtbf) > 20 ? 'warning' : 'danger'}>
                        {usine.mtbf}
                      </Badge>
                    </td>
                    <td className="text-center">
                      <Badge bg={parseFloat(usine.tdm) > 90 ? 'success' : parseFloat(usine.tdm) > 80 ? 'warning' : 'danger'}>
                        {usine.tdm}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ) : (
          <Alert variant="info" className="text-center">
            Aucune usine avec des arrêts pour ce projet dans la période sélectionnée.
          </Alert>
        )}

        <h6 className="mb-3">Détail de tous les arrêts du projet</h6>
        {arrets.length > 0 ? (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <Table striped bordered hover size="sm">
              <thead className="table-secondary">
                <tr>
                  <th>Date Début</th>
                  <th>Date Fin</th>
                  <th>Usine</th>
                  <th>Cause Arrêt</th>
                  <th className="text-center">Durée (h)</th>
                  <th className="text-center">HIM (h)</th>
                  <th className="text-center">TF (h)</th>
                  <th>Intervenant</th>
                </tr>
              </thead>
              <tbody>
                {arrets.map((arret, index) => {
                  const usineDetails = getUsineDetails(arret.usine);
                  return (
                    <tr key={index}>
                      <td>{arret.date_panne ? format(parseISO(arret.date_panne), 'dd/MM/yyyy HH:mm') : 'N/A'}</td>
                      <td>{arret.date_reparation ? format(parseISO(arret.date_reparation), 'dd/MM/yyyy HH:mm') : 'En cours'}</td>
                      <td className="fw-bold">{usineDetails.matricule}</td>
                      <td>{arret.cause_panne || 'Non spécifiée'}</td>
                      <td className="text-center">{arret.duree_panne || 0}</td>
                      <td className="text-center">{arret.him || 0}</td>
                      <td className="text-center">{arret.temps_fonctionnement || 0}</td>
                      <td>{arret.intervenant || 'Non spécifié'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        ) : (
          <Alert variant="info" className="text-center">
            Aucun arrêt enregistré pour ce projet dans la période sélectionnée.
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Fermer
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
export default RapportArretsUsine;