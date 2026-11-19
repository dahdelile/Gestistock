import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table, Button, Card, Spinner, Form, Modal, Toast, ToastContainer, Alert,
  InputGroup, Row, Col, Dropdown, Pagination, Badge, Collapse
} from 'react-bootstrap';
import {
  FaCar, FaInfoCircle, FaSyncAlt, FaPlus, FaEdit, FaTrash,
  FaTimes, FaFileExport, FaPrint, FaChartLine,
  FaFilter, FaCalendarAlt, FaFilePdf, FaDownload, FaChartBar,
  FaChevronDown, FaChevronRight
} from 'react-icons/fa';
import axios from 'axios';
import { format, parseISO, isValid, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useForm, useWatch } from 'react-hook-form';

// Import Chart.js pour les graphiques
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const API_BASE_URL = 'https://intranet-attm.com/api';
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

const API_ENDPOINTS = {
  arrets: '/arretEngins/',
  engins: '/engins/',
  codesPanne: '/pannes/',
  projets: '/projets/',
};

const RapportEngins = () => {
  // States principaux
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    engins: [],
    codesPanne: [],
    projets: [],
    arrets: []
  });
  const [filters, setFilters] = useState({
    selectedEngin: '',
    selectedProjet: '',
    dateRange: { 
      start: format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
      end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
    }
  });
  const [generatingReport, setGeneratingReport] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [expandedEngins, setExpandedEngins] = useState(new Set());

  const showToast = useCallback((message, variant = 'success') => {
    const newToast = { id: Date.now(), message, variant };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 5000);
  }, []);

  const formatDisplayDate = useCallback((dateString) => {
    if (!dateString) return 'Non spécifiée';
    try {
      const date = parseISO(dateString);
       return isValid(date) ? format(date, 'dd/MM/yyyy HH:mm', { locale: fr }) : dateString;
    } catch {
      return dateString;
    }
  }, []);

  const calculateDuration = useCallback((hours) => {
    if (!hours || isNaN(hours)) return '0h';
    const totalHours = parseFloat(hours);
    if (totalHours < 1) return `${Math.round(totalHours * 60)}min`;
    const days = Math.floor(totalHours / 10);
    const hoursLeft = Math.floor(totalHours % 10);
    if (days === 0) return `${hoursLeft}h`;
    if (hoursLeft === 0) return `${days}j`;
    return `${days}j ${hoursLeft}h`;
  }, []);

  const getEnginDetails = useCallback((enginId) => {
    if (!enginId) {
      return { 
        matricule: 'Non spécifié', 
        type: '', 
        marque: '', 
        modele: '',
        immatriculation: '' 
      };
    }
    
    const engin = data.engins.find(e => e.id === enginId);
    if (!engin) {
      return { 
        matricule: 'Non spécifié', 
        type: '', 
        marque: '', 
        modele: '',
        immatriculation: '' 
      };
    }
    
    return {
      matricule: engin.matricule || 'Non spécifié',
      type: engin.type_engin_display || engin.type_engin || '',
      marque: engin.marque || '',
      modele: engin.modele || '',
      immatriculation: engin.immatriculation || ''
    };
  }, [data.engins]);

  const getProjetInfo = useCallback((projetId) => {
    if (!projetId) return 'Non spécifié';
    const projet = data.projets.find(p => p.id === projetId);
    return projet ? projet.name : `ID: ${projetId}`;
  }, [data.projets]);

  const getCodePanneInfo = useCallback((codeId) => {
    if (!codeId) return 'Non spécifié';
    const code = data.codesPanne.find(c => c.id === codeId);
    return code ? `${code.code}` : `Code ID: ${codeId}`;
  }, [data.codesPanne]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [arretsRes, enginsRes, codesRes, projetsRes] = await Promise.all([
        api.get(API_ENDPOINTS.arrets),
        api.get(API_ENDPOINTS.engins),
        api.get(API_ENDPOINTS.codesPanne),
        api.get(API_ENDPOINTS.projets)
      ]);

      const arretsWithDuration = arretsRes.data.map(arret => ({
        ...arret,
        dureeFormat: calculateDuration(arret.duree_panne),
      }));

      setData({
        arrets: arretsWithDuration,
        engins: enginsRes.data || [],
        codesPanne: codesRes.data || [],
        projets: projetsRes.data || []
      });
    } catch (err) {
      console.error("Erreur de chargement:", err);
      const msg = err.response?.data?.detail ||
                  Object.values(err.response?.data || {}).join(', ') ||
                  "Erreur lors du chargement des données";
      setError(msg);
      showToast(msg, 'danger');
    } finally {
      setLoading(false);
    }
  }, [calculateDuration, showToast]);

  useEffect(() => { 
    fetchData();
  }, [fetchData]);

  // Filtrage des données pour le rapport
  const filteredArrets = useMemo(() => {
    return data.arrets.filter(arret => {
      const enginMatch = filters.selectedEngin ? arret.engin === parseInt(filters.selectedEngin) : true;
      const projetMatch = filters.selectedProjet ? arret.projet === parseInt(filters.selectedProjet) : true;
      
      const dateMatch = filters.dateRange.start && filters.dateRange.end
        ? (new Date(arret.date_panne) >= new Date(filters.dateRange.start) &&
           new Date(arret.date_panne) <= new Date(filters.dateRange.end))
        : true;
      
      return enginMatch && projetMatch && dateMatch;
    });
  }, [data.arrets, filters]);

  // Grouper les arrêts par engin
  const arretsParEngin = useMemo(() => {
    const grouped = {};
    
    filteredArrets.forEach(arret => {
      const enginId = arret.engin;
      if (!enginId) return;
      
      if (!grouped[enginId]) {
        grouped[enginId] = {
          engin: getEnginDetails(enginId),
          arrets: [],
          totalArrets: 0,
          totalDureePanne: 0,
          totalTempsFonctionnement: 0,
          moyenneMtbf: 0
        };
      }
      
      grouped[enginId].arrets.push(arret);
      grouped[enginId].totalArrets++;
      grouped[enginId].totalDureePanne += parseFloat(arret.duree_panne) || 0;
      grouped[enginId].totalTempsFonctionnement += parseFloat(arret.temps_fonctionnement) || 0;
    });

    // Calculer les moyennes et trier par nombre d'arrêts
    Object.values(grouped).forEach(enginData => {
      if (enginData.totalArrets > 0) {
        const mtbfTotal = enginData.arrets.reduce((sum, arret) => sum + (parseFloat(arret.mtbf) || 0), 0);
        enginData.moyenneMtbf = mtbfTotal / enginData.arrets.length;
      }
    });

    // Trier par nombre d'arrêts décroissant
    return Object.values(grouped).sort((a, b) => b.totalArrets - a.totalArrets);
  }, [filteredArrets, getEnginDetails]);

  // Fonction pour toggle l'expansion d'un engin
  const toggleEnginExpansion = (enginId) => {
    setExpandedEngins(prev => {
      const newSet = new Set(prev);
      if (newSet.has(enginId)) {
        newSet.delete(enginId);
      } else {
        newSet.add(enginId);
      }
      return newSet;
    });
  };

  // Calcul du Pareto MTBF par engin
  const paretoMTBF = useMemo(() => {
    const mtbfParEngin = {};
    
    filteredArrets.forEach(arret => {
      if (!arret.engin) return;
      
      const enginId = arret.engin;
      if (!mtbfParEngin[enginId]) {
        mtbfParEngin[enginId] = {
          engin: getEnginDetails(enginId),
          totalMtbf: 0,
          count: 0,
          arrets: []
        };
      }
      
      if (arret.mtbf && arret.mtbf > 0) {
        mtbfParEngin[enginId].totalMtbf += parseFloat(arret.mtbf);
        mtbfParEngin[enginId].count++;
        mtbfParEngin[enginId].arrets.push(arret);
      }
    });

    // Calculer la moyenne MTBF par engin
    Object.keys(mtbfParEngin).forEach(enginId => {
      if (mtbfParEngin[enginId].count > 0) {
        mtbfParEngin[enginId].moyenneMtbf = mtbfParEngin[enginId].totalMtbf / mtbfParEngin[enginId].count;
      } else {
        mtbfParEngin[enginId].moyenneMtbf = 0;
      }
    });

    // Trier par MTBF décroissant
    const sortedMtbf = Object.values(mtbfParEngin)
      .filter(item => item.moyenneMtbf > 0)
      .sort((a, b) => b.moyenneMtbf - a.moyenneMtbf);

    // Calculer les pourcentages cumulés pour le Pareto
    let totalMtbf = sortedMtbf.reduce((sum, item) => sum + item.moyenneMtbf, 0);
    let cumulativePercentage = 0;

    const paretoData = sortedMtbf.map((item, index) => {
      const percentage = (item.moyenneMtbf / totalMtbf) * 100;
      cumulativePercentage += percentage;
      
      return {
        ...item,
        percentage: percentage,
        cumulativePercentage: cumulativePercentage,
        rank: index + 1
      };
    });

    return {
      data: paretoData,
      totalMtbf: totalMtbf,
      enginCount: sortedMtbf.length
    };
  }, [filteredArrets, getEnginDetails]);

  // Calcul du Pareto des pannes par projet
  const paretoPannesProjet = useMemo(() => {
    const pannesParProjet = {};
    
    filteredArrets.forEach(arret => {
      if (!arret.projet) return;
      
      const projetId = arret.projet;
      if (!pannesParProjet[projetId]) {
        pannesParProjet[projetId] = {
          projet: getProjetInfo(projetId),
          count: 0,
          totalDuree: 0,
          arrets: []
        };
      }
      
      pannesParProjet[projetId].count++;
      pannesParProjet[projetId].totalDuree += parseFloat(arret.duree_panne) || 0;
      pannesParProjet[projetId].arrets.push(arret);
    });

    // Trier par nombre de pannes décroissant
    const sortedPannes = Object.values(pannesParProjet)
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);

    // Calculer les pourcentages cumulés pour le Pareto
    let totalPannes = sortedPannes.reduce((sum, item) => sum + item.count, 0);
    let cumulativePercentage = 0;

    const paretoData = sortedPannes.map((item, index) => {
      const percentage = (item.count / totalPannes) * 100;
      cumulativePercentage += percentage;
      
      return {
        ...item,
        percentage: percentage,
        cumulativePercentage: cumulativePercentage,
        rank: index + 1
      };
    });

    return {
      data: paretoData,
      totalPannes: totalPannes,
      projetCount: sortedPannes.length
    };
  }, [filteredArrets, getProjetInfo]);

  // Configuration du graphique Pareto MTBF
  const chartDataMTBF = useMemo(() => {
    const top10 = paretoMTBF.data.slice(0, 10);
    
    return {
      labels: top10.map(item => item.engin.matricule),
      datasets: [
        {
          type: 'bar',
          label: 'MTBF Moyen (heures)',
          data: top10.map(item => item.moyenneMtbf),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
          yAxisID: 'y',
        },
        {
          type: 'line',
          label: 'Pourcentage Cumulé',
          data: top10.map(item => item.cumulativePercentage),
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
          fill: false,
          yAxisID: 'y1',
          tension: 0.4,
        }
      ]
    };
  }, [paretoMTBF]);

  // Configuration du graphique Pareto Pannes par Projet
  const chartDataPannesProjet = useMemo(() => {
    const top10 = paretoPannesProjet.data.slice(0, 10);
    
    return {
      labels: top10.map(item => item.projet),
      datasets: [
        {
          type: 'bar',
          label: 'Nombre de Pannes',
          data: top10.map(item => item.count),
          backgroundColor: 'rgba(255, 159, 64, 0.6)',
          borderColor: 'rgba(255, 159, 64, 1)',
          borderWidth: 1,
          yAxisID: 'y',
        },
        {
          type: 'line',
          label: 'Pourcentage Cumulé',
          data: top10.map(item => item.cumulativePercentage),
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 2,
          fill: false,
          yAxisID: 'y1',
          tension: 0.4,
        }
      ]
    };
  }, [paretoPannesProjet]);

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Valeurs'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Pourcentage Cumulé (%)'
        },
        min: 0,
        max: 100,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Diagramme de Pareto',
      },
    },
  };

  // Statistiques pour le rapport
  const stats = useMemo(() => {
    const totalArrets = filteredArrets.length;
    const totalDureePanne = filteredArrets.reduce((sum, a) => sum + (parseFloat(a.duree_panne) || 0), 0);
    const totalTempsFonctionnement = filteredArrets.reduce((sum, a) => sum + (parseFloat(a.temps_fonctionnement) || 0), 0);
    const avgDureePanne = totalArrets > 0 ? (totalDureePanne / totalArrets).toFixed(1) : 0;

    return {
      totalArrets,
      totalDureePanne: totalDureePanne.toFixed(1),
      totalTempsFonctionnement: totalTempsFonctionnement.toFixed(1),
      avgDureePanne,
    };
  }, [filteredArrets]);

  // Génération du rapport PDF simple
  const generatePDFReport = async () => {
    try {
      setGeneratingReport(true);
      
      const pdfContent = `
        RAPPORT DES ARRÊTS D'ENGINS
        =============================
        
        Période: ${format(new Date(filters.dateRange.start), 'dd/MM/yyyy')} - ${format(new Date(filters.dateRange.end), 'dd/MM/yyyy')}
        Généré le: ${format(new Date(), 'dd/MM/yyyy à HH:mm')}
        
        STATISTIQUES GÉNÉRALES
        ----------------------
        Total arrêts: ${stats.totalArrets}
        Durée totale de panne: ${stats.totalDureePanne}h
        Temps total de fonctionnement: ${stats.totalTempsFonctionnement}h
        Durée moyenne de panne: ${stats.avgDureePanne}h
        
        PARETO - MTBF PAR ENGIN
        -----------------------
        ${paretoMTBF.data.slice(0, 10).map(item => 
          `${item.rank}. ${item.engin.matricule}: ${item.moyenneMtbf.toFixed(1)}h (${item.percentage.toFixed(1)}%)`
        ).join('\n        ')}
        
        PARETO - PANNES PAR PROJET
        --------------------------
        ${paretoPannesProjet.data.slice(0, 10).map(item => 
          `${item.rank}. ${item.projet}: ${item.count} pannes (${item.percentage.toFixed(1)}%)`
        ).join('\n        ')}
        
        ${filteredArrets.length > 0 ? `
        DÉTAIL DES ARRÊTS PAR ENGIN
        ---------------------------
        ${arretsParEngin.map(enginData => `
        ${enginData.engin.matricule} (${enginData.engin.type})
        Total arrêts: ${enginData.totalArrets} | Durée totale: ${enginData.totalDureePanne.toFixed(1)}h | MTBF moyen: ${enginData.moyenneMtbf.toFixed(1)}h
        ${enginData.arrets.map(arret => `  - ${formatDisplayDate(arret.date_panne)} | ${arret.date_reparation ? formatDisplayDate(arret.date_reparation) : '-'} | ${calculateDuration(arret.duree_panne)} | ${getCodePanneInfo(arret.code_panne)}`).join('\n')}
        `).join('\n')}
        ` : ''}
      `;
      
      const blob = new Blob([pdfContent], { type: 'text/plain' });
      const fileName = `rapport_arrets_engins_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.txt`;
      saveAs(blob, fileName);
      
      showToast('Rapport généré avec succès (format texte)', 'success');
    } catch (error) {
      console.error('Erreur génération rapport:', error);
      showToast('Erreur lors de la génération du rapport', 'danger');
    } finally {
      setGeneratingReport(false);
    }
  };

  // Export Excel
  const exportToExcel = async () => {
    try {
      setGeneratingReport(true);
      
      const workbook = new ExcelJS.Workbook();
      
      // Feuille de statistiques
      const statsSheet = workbook.addWorksheet('Statistiques');
      statsSheet.addRow(['RAPPORT DES ARRÊTS D\'ENGINS']);
      statsSheet.addRow(['Période', `${filters.dateRange.start} à ${filters.dateRange.end}`]);
      statsSheet.addRow(['Généré le', format(new Date(), 'dd/MM/yyyy HH:mm')]);
      statsSheet.addRow([]);
      
      // Statistiques générales
      statsSheet.addRow(['STATISTIQUES GÉNÉRALES']);
      statsSheet.addRow(['Total arrêts', stats.totalArrets]);
      statsSheet.addRow(['Durée totale de panne', `${stats.totalDureePanne}h`]);
      statsSheet.addRow(['Temps total de fonctionnement', `${stats.totalTempsFonctionnement}h`]);
      statsSheet.addRow(['Durée moyenne de panne', `${stats.avgDureePanne}h`]);
      statsSheet.addRow([]);
      
      // Pareto MTBF
      statsSheet.addRow(['PARETO - MTBF PAR ENGIN']);
      statsSheet.addRow(['Rang', 'Engin', 'MTBF Moyen (h)', 'Pourcentage', 'Pourcentage Cumulé']);
      paretoMTBF.data.slice(0, 10).forEach(item => {
        statsSheet.addRow([
          item.rank,
          item.engin.matricule,
          item.moyenneMtbf.toFixed(1),
          `${item.percentage.toFixed(1)}%`,
          `${item.cumulativePercentage.toFixed(1)}%`
        ]);
      });
      statsSheet.addRow([]);
      
      // Pareto Pannes par Projet
      statsSheet.addRow(['PARETO - PANNES PAR PROJET']);
      statsSheet.addRow(['Rang', 'Projet', 'Nombre Pannes', 'Pourcentage', 'Pourcentage Cumulé']);
      paretoPannesProjet.data.slice(0, 10).forEach(item => {
        statsSheet.addRow([
          item.rank,
          item.projet,
          item.count,
          `${item.percentage.toFixed(1)}%`,
          `${item.cumulativePercentage.toFixed(1)}%`
        ]);
      });
      
      // Feuille de détail par engin
      const detailSheet = workbook.addWorksheet('Détail par Engin');
      arretsParEngin.forEach(enginData => {
        detailSheet.addRow([`ENGIN: ${enginData.engin.matricule} (${enginData.engin.type})`]);
        detailSheet.addRow(['Total arrêts', enginData.totalArrets]);
        detailSheet.addRow(['Durée totale panne', `${enginData.totalDureePanne.toFixed(1)}h`]);
        detailSheet.addRow(['MTBF moyen', `${enginData.moyenneMtbf.toFixed(1)}h`]);
        detailSheet.addRow([]);
        detailSheet.addRow(['Date Panne', 'Date Réparation', 'Durée', 'Temps Fonction', 'MTBF', 'Code Panne', 'Projet', 'Cause']);
        
        enginData.arrets.forEach(arret => {
          detailSheet.addRow([
            formatDisplayDate(arret.date_panne),
            arret.date_reparation ? formatDisplayDate(arret.date_reparation) : '-',
            calculateDuration(arret.duree_panne),
            `${arret.temps_fonctionnement || 0}h`,
            arret.mtbf ? `${arret.mtbf}h` : '-',
            getCodePanneInfo(arret.code_panne),
            getProjetInfo(arret.projet),
            arret.cause_panne || '-'
          ]);
        });
        detailSheet.addRow([]);
      });
      
      // Style des en-têtes
      [statsSheet, detailSheet].forEach(sheet => {
        sheet.getRow(1).font = { bold: true, size: 14 };
        sheet.columns.forEach(column => {
          column.width = 15;
        });
      });
      
      const buffer = await workbook.xlsx.writeBuffer();
      const fileName = `rapport_arrets_engins_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
      saveAs(new Blob([buffer]), fileName);
      
      showToast('Rapport Excel généré avec succès', 'success');
    } catch (error) {
      console.error('Erreur export Excel:', error);
      showToast('Erreur lors de la génération du Excel', 'danger');
    } finally {
      setGeneratingReport(false);
    }
  };

  const DateRangeFilter = () => (
    <Row className="mb-3 g-2">

        <Col md={3}>
                      <Form.Group>
                        <Form.Label>Engin</Form.Label>
                        <Form.Select 
                          value={filters.selectedEngin} 
                          onChange={e => setFilters(p => ({ ...p, selectedEngin: e.target.value }))}
                        >
                          <option value="">Tous les engins</option>
                          {data.engins.map(e => (
                            <option key={e.id} value={e.id}>
                              {e.matricule} - {e.type_engin_display || e.type_engin || 'Non spécifié'}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Projet</Form.Label>
                        <Form.Select 
                          value={filters.selectedProjet} 
                          onChange={e => setFilters(p => ({ ...p, selectedProjet: e.target.value }))}
                        >
                          <option value="">Tous les projets</option>
                          {data.projets.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                   
      <Col md={3}>
        <Form.Group>
          <Form.Label>Date de début</Form.Label>
          <InputGroup>
            <Form.Control
              type="date"
              value={filters.dateRange.start || ''}
              onChange={e => setFilters(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, start: e.target.value }
              }))}
            />
            <InputGroup.Text>
              <FaCalendarAlt />
            </InputGroup.Text>
          </InputGroup>
        </Form.Group>
      </Col>
      <Col md={3}>
        <Form.Group>
          <Form.Label>Date de fin</Form.Label>
          <InputGroup>
            <Form.Control
              type="date"
              value={filters.dateRange.end || ''}
              onChange={e => setFilters(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, end: e.target.value }
              }))}
              min={filters.dateRange.start}
            />
            <InputGroup.Text>
              <FaCalendarAlt />
            </InputGroup.Text>
          </InputGroup>
        </Form.Group>
      </Col>
    </Row>
  );

  return (
    <div className="container-fluid py-4">
      <Card className="shadow-lg">
        <Card.Header className="bg-primary text-white">
          <Row className="align-items-center">
            <Col md={6}>
              <h3 className="mb-0 d-flex align-items-center">
                <FaChartLine className="me-2" />
                Rapport des Arrêts d'Engins
              </h3>
            </Col>
            <Col md={6} className="text-end">
              <Button 
                variant="light" 
                onClick={fetchData} 
                disabled={loading}
                className="me-2"
              >
                <FaSyncAlt className={loading ? "spin" : ""} />
                <span className="ms-2">Actualiser</span>
              </Button>
              
              <Dropdown className="d-inline-block">
                <Dropdown.Toggle variant="success" disabled={generatingReport}>
                  <FaDownload className="me-1" />
                  Exporter Rapport
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  
                  <Dropdown.Item onClick={exportToExcel} disabled={generatingReport}>
                    <FaFileExport className="me-2" />
                    {generatingReport ? 'Génération...' : 'Excel'}
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Col>
          </Row>
        </Card.Header>
        
        <Card.Body>
          {loading && !data.arrets.length ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Chargement des données...</p>
            </div>
          ) : error ? (
            <Alert variant="danger">
              <FaInfoCircle className="me-2" />
              {error}
              <Button 
                variant="outline-light" 
                size="sm" 
                className="ms-3" 
                onClick={fetchData}
              >
                Réessayer
              </Button>
            </Alert>
          ) : (
            <>
              <ToastContainer position="top-end" className="p-3">
                {toasts.map(toast => (
                  <Toast
                    key={toast.id}
                    onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                    bg={toast.variant}
                    autohide
                    delay={5000}
                  >
                    <Toast.Body className="text-white">{toast.message}</Toast.Body>
                  </Toast>
                ))}
              </ToastContainer>

              {/* Filtres */}
              <Card className="mb-4 shadow-sm">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">
                    <FaFilter className="me-2" /> Filtres du Rapport
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Row className="g-3">
                    
                  </Row>
                  
                  <DateRangeFilter />
                </Card.Body>
              </Card>

              {/* Résumé du rapport */}
              <Card className="mb-4 shadow-sm">
                <Card.Body>
                  <h5 className="mb-3">
                    <FaChartLine className="me-2" /> Résumé du Rapport
                  </h5>
                  
                  {generatingReport && (
                    <Alert variant="info" className="d-flex align-items-center">
                      <Spinner animation="border" size="sm" className="me-2" />
                      Génération du rapport en cours...
                    </Alert>
                  )}
                  
                  <Row className="text-center">
                    <Col md={3}>
                      <div className="p-3 bg-primary bg-opacity-10 rounded">
                        <div className="text-muted small">Total arrêts</div>
                        <div className="fs-4 fw-bold text-primary">{stats.totalArrets}</div>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="p-3 bg-danger bg-opacity-10 rounded">
                        <div className="text-muted small">Durée totale de panne</div>
                        <div className="fs-4 fw-bold text-danger">{stats.totalDureePanne}h</div>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="p-3 bg-success bg-opacity-10 rounded">
                        <div className="text-muted small">Temps total fonctionnement</div>
                        <div className="fs-4 fw-bold text-success">{stats.totalTempsFonctionnement}h</div>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="p-3 bg-warning bg-opacity-10 rounded">
                        <div className="text-muted small">Durée moyenne de panne</div>
                        <div className="fs-4 fw-bold text-warning">{stats.avgDureePanne}h</div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

            
              {/* Détail des arrêts groupés par engin */}
              {arretsParEngin.length > 0 && (
                <Card className="shadow-sm">
                  <Card.Header className="bg-light">
                    <h5 className="mb-0">Détail des Arrêts par Engin ({arretsParEngin.length} engins)</h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="table-responsive">
                      <Table striped bordered hover>
                        <thead className="table-dark">
                          <tr>
                            <th style={{ width: '30px' }}></th>
                            <th>Engin</th>
                            <th>Type</th>
                            <th>Nb Arrêts</th>
                            <th>Durée Totale</th>
                            <th>MTBF Moyen</th>
                            <th>Temps Fonction Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {arretsParEngin.map((enginData, index) => {
                            const isExpanded = expandedEngins.has(enginData.engin.matricule);
                            return (
                              <React.Fragment key={enginData.engin.matricule}>
                                {/* Ligne de l'engin */}
                                <tr 
                                  className="cursor-pointer" 
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => toggleEnginExpansion(enginData.engin.matricule)}
                                >
                                  <td>
                                    {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
                                  </td>
                                  <td className="fw-bold text-primary">
                                    {enginData.engin.matricule}
                                  </td>
                                  <td>{enginData.engin.type}</td>
                                  <td>
                                    <Badge bg="primary">{enginData.totalArrets}</Badge>
                                  </td>
                                  <td className="text-danger fw-bold">
                                    {calculateDuration(enginData.totalDureePanne)}
                                  </td>
                                  <td>
                                    <Badge bg={enginData.moyenneMtbf > 100 ? "success" : enginData.moyenneMtbf > 50 ? "warning" : "danger"}>
                                      {enginData.moyenneMtbf.toFixed(1)}h
                                    </Badge>
                                  </td>
                                  <td className="text-success fw-bold">
                                    {enginData.totalTempsFonctionnement.toFixed(1)}h
                                  </td>
                                </tr>
                                
                                {/* Détail des arrêts de l'engin (expandable) */}
                                {isExpanded && (
                                  <tr>
                                    <td colSpan="7" className="p-0 bg-light">
                                      <Collapse in={isExpanded}>
                                        <div className="p-3">
                                          <h6 className="mb-3">
                                            Détail des arrêts pour {enginData.engin.matricule}
                                          </h6>
                                          <Table striped bordered size="sm" className="mb-0">
                                            <thead className="table-secondary">
                                              <tr>
                                                <th>Date Panne</th>
                                                <th>Date Réparation</th>
                                                <th>Durée</th>
                                                <th>Temps Fonction</th>
                                                <th>MTBF</th>
                                                <th>Code Panne</th>
                                                <th>Projet</th>
                                                <th>Cause</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {enginData.arrets.map((arret) => (
                                                <tr key={arret.id}>
                                                  <td>{formatDisplayDate(arret.date_panne)}</td>
                                                  <td>{arret.date_reparation ? formatDisplayDate(arret.date_reparation) : '-'}</td>
                                                  <td>{calculateDuration(arret.duree_panne)}</td>
                                                  <td>{arret.temps_fonctionnement ? `${arret.temps_fonctionnement}h` : '-'}</td>
                                                  <td>
                                                    {arret.mtbf ? (
                                                      <Badge bg={arret.mtbf > 100 ? "success" : arret.mtbf > 50 ? "warning" : "danger"}>
                                                        {arret.mtbf}h
                                                      </Badge>
                                                    ) : '-'}
                                                  </td>
                                                  <td>{getCodePanneInfo(arret.code_panne)}</td>
                                                  <td>{getProjetInfo(arret.projet)}</td>
                                                  <td>
                                                    {arret.cause_panne ? (
                                                      <span 
                                                        className="text-truncate d-inline-block" 
                                                        style={{maxWidth: '150px'}}
                                                        title={arret.cause_panne}
                                                      >
                                                        {arret.cause_panne}
                                                      </span>
                                                    ) : '-'}
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </Table>
                                        </div>
                                      </Collapse>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </Table>
                    </div>
                  </Card.Body>
                </Card>
              )}
  {/* Diagrammes de Pareto */}
              <Row className="mb-4">
                {/* Pareto MTBF */}
                <Col md={6}>
                  <Card className="shadow-sm h-100">
                    <Card.Header className="bg-info text-white">
                      <h6 className="mb-0">
                        <FaChartBar className="me-2" />
                        Pareto - MTBF par Engin
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      {paretoMTBF.data.length > 0 ? (
                        <>
                          <div style={{ height: '300px' }}>
                            <Bar data={chartDataMTBF} options={chartOptions} />
                          </div>
                          <div className="mt-3">
                            <h6>Top 5 Engins - MTBF</h6>
                            <Table striped bordered size="sm">
                              <thead>
                                <tr>
                                  <th>Rang</th>
                                  <th>Engin</th>
                                  <th>MTBF Moyen</th>
                                  <th>% Cumulé</th>
                                </tr>
                              </thead>
                              <tbody>
                                {paretoMTBF.data.slice(0, 5).map(item => (
                                  <tr key={item.rank}>
                                    <td><Badge bg="primary">{item.rank}</Badge></td>
                                    <td>{item.engin.matricule}</td>
                                    <td className="fw-bold text-success">{item.moyenneMtbf.toFixed(1)}h</td>
                                    <td>{item.cumulativePercentage.toFixed(1)}%</td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </div>
                        </>
                      ) : (
                        <Alert variant="info" className="text-center">
                          Aucune donnée MTBF disponible
                        </Alert>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                {/* Pareto Pannes par Projet */}
                <Col md={6}>
                  <Card className="shadow-sm h-100">
                    <Card.Header className="bg-warning text-dark">
                      <h6 className="mb-0">
                        <FaChartBar className="me-2" />
                        Pareto - Pannes par Projet
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      {paretoPannesProjet.data.length > 0 ? (
                        <>
                          <div style={{ height: '300px' }}>
                            <Bar data={chartDataPannesProjet} options={chartOptions} />
                          </div>
                          <div className="mt-3">
                            <h6>Top 5 Projets - Nombre de Pannes</h6>
                            <Table striped bordered size="sm">
                              <thead>
                                <tr>
                                  <th>Rang</th>
                                  <th>Projet</th>
                                  <th>Nb Pannes</th>
                                  <th>% Cumulé</th>
                                </tr>
                              </thead>
                              <tbody>
                                {paretoPannesProjet.data.slice(0, 5).map(item => (
                                  <tr key={item.rank}>
                                    <td><Badge bg="warning">{item.rank}</Badge></td>
                                    <td>{item.projet}</td>
                                    <td className="fw-bold text-danger">{item.count}</td>
                                    <td>{item.cumulativePercentage.toFixed(1)}%</td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </div>
                        </>
                      ) : (
                        <Alert variant="info" className="text-center">
                          Aucune donnée de pannes par projet disponible
                        </Alert>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {!loading && arretsParEngin.length === 0 && (
                <Alert variant="info" className="text-center">
                  <FaInfoCircle className="me-2" />
                  Aucun arrêt trouvé avec les filtres actuels
                </Alert>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default RapportEngins;