import React, { useState, useEffect, useMemo } from 'react';
import {
  Card, Container, Row, Col, Form, Spinner, Alert,
  Table, Badge, Tabs, Tab, Modal, Button, ButtonGroup,
  ProgressBar, ListGroup, Dropdown
} from 'react-bootstrap';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import axios from 'axios';
import { format, subDays, parseISO, isWithinInterval, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import {
  FaChartLine, FaChartBar, FaChartPie, FaFileExcel, FaPrint,
  FaCalendarAlt, FaFilter, FaDownload, FaEye, FaTachometerAlt,
  FaExclamationTriangle, FaCheckCircle, FaClock, FaWrench,
  FaCar, FaProjectDiagram, FaArrowUp, FaArrowDown, FaMinus,
  FaUser
} from 'react-icons/fa';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

const API_BASE_URL = 'http://localhost:8000/api';
const api = axios.create({ 
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Intercepteur pour le débogage
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Réponse ${response.status} de: ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ Erreur API:`, error.message);
    return Promise.reject(error);
  }
);

const AnalysePerformance = () => {
  const [state, setState] = useState({
    arrets: [],
    voitures: [],
    projets: [],
    chauffeurs: [],
    codesPanne: [],
    loading: true,
    error: null,
    selectedVoiture: '',
    selectedProjet: '',
    selectedChauffeur: '',
    selectedCodePanne: '',
    dateDebut: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    dateFin: format(new Date(), 'yyyy-MM-dd'),
    periodeComparaison: '30jours',
    showComparaison: false,
    activeTab: 'performance',
    showDetailModal: false,
    selectedVoitureDetails: null,
    voiturePannes: [],
    showProjetModal: false,
    selectedProjetDetails: null,
    projetVoitures: [],
    projetPannes: [],
    showTendanceModal: false,
    tendanceData: [],
    showAlertes: false,
    seuils: {
      tdmCritique: 70,
      tdmAlerte: 85,
      pannesCritique: 5,
      pannesAlerte: 3
    }
  });

  // Fonction pour extraire les données de l'API
  const getDataArray = (apiData) => {
    if (Array.isArray(apiData)) return apiData;
    if (apiData?.data && Array.isArray(apiData.data)) return apiData.data;
    if (apiData?.success && Array.isArray(apiData.data)) return apiData.data;
    if (apiData && typeof apiData === 'object') {
      for (const key in apiData) {
        if (Array.isArray(apiData[key])) return apiData[key];
      }
    }
    return [];
  };

  // Charger les données initiales
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        const [voituresRes, projetsRes, arretsRes, chauffeursRes, codesRes] = await Promise.all([
          api.get('/voitures').catch(e => ({ data: [] })),
          api.get('/projets').catch(e => ({ data: [] })),
          api.get('/arretages').catch(e => ({ data: [] })),
          api.get('/chauffeurs').catch(e => ({ data: [] })),
          api.get('/pannes').catch(e => ({ data: [] }))
        ]);

        const voituresData = getDataArray(voituresRes.data);
        const projetsData = getDataArray(projetsRes.data);
        const arretsData = getDataArray(arretsRes.data);
        const chauffeursData = getDataArray(chauffeursRes?.data || []);
        const codesData = getDataArray(codesRes?.data || []);

        setState(prev => ({
          ...prev,
          voitures: voituresData,
          projets: projetsData,
          arrets: arretsData,
          chauffeurs: chauffeursData,
          codesPanne: codesData,
          loading: false
        }));
      } catch (err) {
        console.error("Erreur chargement initial:", err);
        setState(prev => ({ 
          ...prev, 
          error: err.response?.data?.message || err.message || "Erreur de chargement", 
          loading: false 
        }));
      }
    };
    fetchInitialData();
  }, []);

  // Gestionnaire de changements de période
  const handlePeriodeChange = (periode) => {
    const aujourdhui = new Date();
    let debut = new Date();
    
    switch(periode) {
      case '7jours':
        debut = subDays(aujourdhui, 7);
        break;
      case '30jours':
        debut = subDays(aujourdhui, 30);
        break;
      case '90jours':
        debut = subDays(aujourdhui, 90);
        break;
      case 'annee':
        debut = subDays(aujourdhui, 365);
        break;
      default:
        return;
    }
    
    setState(prev => ({
      ...prev,
      dateDebut: format(debut, 'yyyy-MM-dd'),
      dateFin: format(aujourdhui, 'yyyy-MM-dd'),
      periodeComparaison: periode
    }));
  };

  // Filtrer les arrêts selon les critères
  const filteredArrets = useMemo(() => {
    try {
      if (!state.arrets.length) return [];
      
      const debut = parseISO(state.dateDebut);
      const fin = parseISO(state.dateFin + 'T23:59:59');

      return state.arrets.filter(arret => {
        if (!arret.date_panne) return false;
        
        const datePanne = parseISO(arret.date_panne);
        const dateInRange = isWithinInterval(datePanne, { start: debut, end: fin });
        
        const voitureId = arret.voiture || arret.voiture_id;
        const projetId = arret.projet || arret.projet_id;
        const chauffeurId = arret.chauffeur || arret.chauffeur_id;
        const codePanneId = arret.code_panne || arret.code_panne_id;
        
        const voitureMatch = !state.selectedVoiture || voitureId == state.selectedVoiture;
        const projetMatch = !state.selectedProjet || projetId == state.selectedProjet;
        const chauffeurMatch = !state.selectedChauffeur || chauffeurId == state.selectedChauffeur;
        const codeMatch = !state.selectedCodePanne || codePanneId == state.selectedCodePanne;

        return dateInRange && voitureMatch && projetMatch && chauffeurMatch && codeMatch;
      });
    } catch (error) {
      console.error("Erreur filtrage:", error);
      return [];
    }
  }, [state.arrets, state.dateDebut, state.dateFin, state.selectedVoiture, state.selectedProjet, state.selectedChauffeur, state.selectedCodePanne]);

  // Indicateurs par voiture
  const indicateursParVoiture = useMemo(() => {
    const result = {};

    filteredArrets.forEach(arret => {
      const voitureId = arret.voiture || arret.voiture_id;
      if (!voitureId) return;
      
      if (!result[voitureId]) {
        const voitureInfo = state.voitures.find(v => v.id === voitureId);
        const projetInfo = state.projets.find(p => p.id === (arret.projet || arret.projet_id));
        
        result[voitureId] = {
          id: voitureId,
          matricule: voitureInfo?.matricule || `ID: ${voitureId}`,
          projet: projetInfo?.name || 'Non attribué',
          projet_id: arret.projet || arret.projet_id,
          nombrePannes: 0,
          duree_panne: 0,
          temps_fonctionnement: 0,
          details: voitureInfo || {},
          pannesDetails: []
        };
      }

      result[voitureId].nombrePannes += arret.nombre_pannes || 1;
      result[voitureId].duree_panne += arret.duree_panne || 0;
      result[voitureId].temps_fonctionnement += arret.temps_fonctionnement || 0;
      result[voitureId].pannesDetails.push(arret);
    });

    return Object.values(result).map(v => {
      const totalHeures = v.temps_fonctionnement + v.duree_panne;
      const tdm = totalHeures > 0 ? (v.temps_fonctionnement / totalHeures) * 100 : 100;
      const mtbf = v.nombrePannes > 0 ? (v.temps_fonctionnement / v.nombrePannes) : v.temps_fonctionnement;
      const mtbfClasse = mtbf > 100 ? 'success' : mtbf > 50 ? 'warning' : 'danger';
      
      return {
        ...v,
        mtbf: mtbf.toFixed(1),
        mtbfClasse,
        tdm: tdm.toFixed(1),
        tdmClasse: tdm > 90 ? 'success' : tdm > 80 ? 'warning' : 'danger',
        pannesParJour: v.nombrePannes / Math.max(1, differenceInDays(parseISO(state.dateFin), parseISO(state.dateDebut)))
      };
    }).sort((a, b) => b.nombrePannes - a.nombrePannes);
  }, [filteredArrets, state.voitures, state.projets, state.dateDebut, state.dateFin]);

  // Indicateurs par projet
  const indicateursParProjet = useMemo(() => {
    const result = {};

    filteredArrets.forEach(arret => {
      const projetId = arret.projet || arret.projet_id;
      if (!projetId) return;
      
      if (!result[projetId]) {
        const projetInfo = state.projets.find(p => p.id === projetId);
        
        result[projetId] = {
          id: projetId,
          name: projetInfo?.name || `ID: ${projetId}`,
          nombrePannes: 0,
          duree_panne: 0,
          temps_fonctionnement: 0,
          voituresImpactees: new Set(),
          details: projetInfo || {}
        };
      }

      result[projetId].nombrePannes += arret.nombre_pannes || 1;
      result[projetId].duree_panne += arret.duree_panne || 0;
      result[projetId].temps_fonctionnement += arret.temps_fonctionnement || 0;
      result[projetId].voituresImpactees.add(arret.voiture || arret.voiture_id);
    });

    return Object.values(result).map(p => ({
      ...p,
      voituresImpactees: p.voituresImpactees.size,
      mtbf: p.nombrePannes > 0 ? (p.temps_fonctionnement / p.nombrePannes).toFixed(1) : p.temps_fonctionnement.toFixed(1)
    })).sort((a, b) => b.nombrePannes - a.nombrePannes);
  }, [filteredArrets, state.projets]);

  // Indicateurs par chauffeur
  const indicateursParChauffeur = useMemo(() => {
    const result = {};

    filteredArrets.forEach(arret => {
      const chauffeurId = arret.chauffeur || arret.chauffeur_id;
      if (!chauffeurId) return;
      
      if (!result[chauffeurId]) {
        const chauffeurInfo = state.chauffeurs.find(c => c.id === chauffeurId);
        
        result[chauffeurId] = {
          id: chauffeurId,
          nom: chauffeurInfo?.nom || `ID: ${chauffeurId}`,
          matricule: chauffeurInfo?.matricule || '',
          nombrePannes: 0,
          duree_panne: 0,
          vehiculesConducteur: new Set()
        };
      }

      result[chauffeurId].nombrePannes += arret.nombre_pannes || 1;
      result[chauffeurId].duree_panne += arret.duree_panne || 0;
      result[chauffeurId].vehiculesConducteur.add(arret.voiture || arret.voiture_id);
    });

    return Object.values(result)
      .map(c => ({
        ...c,
        vehiculesConducteur: c.vehiculesConducteur.size
      }))
      .sort((a, b) => b.nombrePannes - a.nombrePannes);
  }, [filteredArrets, state.chauffeurs]);

  // Indicateurs par code panne
  const indicateursParCodePanne = useMemo(() => {
    const result = {};

    filteredArrets.forEach(arret => {
      const codeId = arret.code_panne || arret.code_panne_id;
      if (!codeId) return;
      
      if (!result[codeId]) {
        const codeInfo = state.codesPanne.find(c => c.id === codeId);
        
        result[codeId] = {
          id: codeId,
          code: codeInfo?.code || `Code ${codeId}`,
          libelle: codeInfo?.name || codeInfo?.libelle || '',
          nombrePannes: 0,
          duree_panne: 0,
          vehicules: new Set()
        };
      }

      result[codeId].nombrePannes += arret.nombre_pannes || 1;
      result[codeId].duree_panne += arret.duree_panne || 0;
      result[codeId].vehicules.add(arret.voiture || arret.voiture_id);
    });

    return Object.values(result)
      .map(c => ({
        ...c,
        vehicules: c.vehicules.size
      }))
      .sort((a, b) => b.nombrePannes - a.nombrePannes);
  }, [filteredArrets, state.codesPanne]);

  // Données pour la tendance temporelle
  const donneesTendance = useMemo(() => {
    const tendance = {};
    const jours = differenceInDays(parseISO(state.dateFin), parseISO(state.dateDebut)) + 1;
    
    for (let i = 0; i < jours; i++) {
      const date = new Date(parseISO(state.dateDebut));
      date.setDate(date.getDate() + i);
      const dateStr = format(date, 'yyyy-MM-dd');
      tendance[dateStr] = { date: format(date, 'dd/MM'), pannes: 0, him: 0 };
    }

    filteredArrets.forEach(arret => {
      if (arret.date_panne) {
        const dateStr = format(parseISO(arret.date_panne), 'yyyy-MM-dd');
        if (tendance[dateStr]) {
          tendance[dateStr].pannes += arret.nombre_pannes || 1;
          tendance[dateStr].him += arret.duree_panne || 0;
        }
      }
    });

    return Object.values(tendance);
  }, [filteredArrets, state.dateDebut, state.dateFin]);

  // Statistiques globales
  const statsGlobales = useMemo(() => {
    const totalPannes = filteredArrets.reduce((sum, a) => sum + (a.nombre_pannes || 1), 0);
    const totalHim = filteredArrets.reduce((sum, a) => sum + (a.duree_panne || 0), 0);
    const totalTF = filteredArrets.reduce((sum, a) => sum + (a.temps_fonctionnement || 0), 0);
    const totalVoitures = new Set(filteredArrets.map(a => a.voiture || a.voiture_id)).size;
    const totalProjets = new Set(filteredArrets.map(a => a.projet || a.projet_id)).size;
    
    const tdmGlobal = totalTF + totalHim > 0 
      ? (totalTF / (totalTF + totalHim) * 100).toFixed(1) 
      : '100';

    const mtbfGlobal = totalPannes > 0 ? (totalTF / totalPannes).toFixed(1) : totalTF.toFixed(1);

    return { 
      totalPannes, 
      totalVoitures,
      totalProjets,
      totalHim: totalHim.toFixed(1), 
      tempsFonctionnementGlobal: totalTF.toFixed(1),
      tdmGlobal,
      mtbfGlobal
    };
  }, [filteredArrets]);

  // Alertes et recommandations (calculé après indicateursParVoiture)
  const alertes = useMemo(() => {
    const alertesList = [];

    indicateursParVoiture.forEach(voiture => {
      if (parseFloat(voiture.tdm) < state.seuils.tdmCritique) {
        alertesList.push({
          type: 'critique',
          titre: 'TDM Critique',
          message: `${voiture.matricule} a un TDM de ${voiture.tdm}% (seuil ${state.seuils.tdmCritique}%)`,
          icon: <FaExclamationTriangle className="text-danger" />,
          priorite: 1
        });
      } else if (parseFloat(voiture.tdm) < state.seuils.tdmAlerte) {
        alertesList.push({
          type: 'alerte',
          titre: 'TDM Préoccupant',
          message: `${voiture.matricule} a un TDM de ${voiture.tdm}%`,
          icon: <FaArrowDown className="text-warning" />,
          priorite: 2
        });
      }

      if (voiture.nombrePannes > state.seuils.pannesCritique) {
        alertesList.push({
          type: 'critique',
          titre: 'Pannes Excessives',
          message: `${voiture.matricule} a ${voiture.nombrePannes} pannes dans la période`,
          icon: <FaExclamationTriangle className="text-danger" />,
          priorite: 1
        });
      } else if (voiture.nombrePannes > state.seuils.pannesAlerte) {
        alertesList.push({
          type: 'alerte',
          titre: 'Pannes Fréquentes',
          message: `${voiture.matricule} a ${voiture.nombrePannes} pannes`,
          icon: <FaArrowDown className="text-warning" />,
          priorite: 2
        });
      }
    });

    return alertesList.sort((a, b) => a.priorite - b.priorite);
  }, [indicateursParVoiture, state.seuils]);

  // Handlers pour les modals
  const handleShowVoitureDetails = (voiture) => {
    const voitureComplete = state.voitures.find(v => v.id === voiture.id || v.matricule === voiture.matricule);
    const pannesVoiture = filteredArrets.filter(arret => {
      const voitureId = arret.voiture || arret.voiture_id;
      return voitureId === voiture.id;
    });

    setState(prev => ({
      ...prev,
      selectedVoitureDetails: voitureComplete || voiture,
      voiturePannes: pannesVoiture,
      showDetailModal: true
    }));
  };

  const handleShowProjetDetails = (projet) => {
    const projetComplete = state.projets.find(p => p.id === projet.id || p.name === projet.name);
    const voituresDuProjet = indicateursParVoiture.filter(v => v.projet_id === projet.id);
    const pannesDuProjet = filteredArrets.filter(arret => {
      const projetId = arret.projet || arret.projet_id;
      return projetId === projet.id;
    });

    setState(prev => ({
      ...prev,
      selectedProjetDetails: projetComplete || projet,
      projetVoitures: voituresDuProjet,
      projetPannes: pannesDuProjet,
      showProjetModal: true
    }));
  };

  const handleShowTendance = () => {
    setState(prev => ({ ...prev, showTendanceModal: true }));
  };

  // Export Excel amélioré
  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      
      // Feuille Résumé
      const resumeData = [
        ['RAPPORT DE PERFORMANCE', ''],
        ['Période', `${format(parseISO(state.dateDebut), 'dd/MM/yyyy')} - ${format(parseISO(state.dateFin), 'dd/MM/yyyy')}`],
        ['Date génération', format(new Date(), 'dd/MM/yyyy HH:mm')],
        ['', ''],
        ['Indicateurs Globaux', ''],
        ['Total Pannes', statsGlobales.totalPannes],
        ['Total HIM (heures)', statsGlobales.totalHim],
        ['Total TF (heures)', statsGlobales.tempsFonctionnementGlobal],
        ['TDM Global', statsGlobales.tdmGlobal + '%'],
        ['MTBF Global', statsGlobales.mtbfGlobal + 'h'],
        ['Équipements concernés', statsGlobales.totalVoitures],
        ['Projets concernés', statsGlobales.totalProjets]
      ];
      
      const wsResume = XLSX.utils.aoa_to_sheet(resumeData);
      XLSX.utils.book_append_sheet(wb, wsResume, 'Résumé');

      // Feuille Performance Équipements
      const voituresData = indicateursParVoiture.map(v => ({
        'Équipement': v.matricule,
        'Projet': v.projet,
        'Nombre de pannes': v.nombrePannes,
        'HIM (h)': parseFloat(v.duree_panne).toFixed(1),
        'TF (h)': parseFloat(v.temps_fonctionnement).toFixed(1),
        'MTBF (h)': v.mtbf,
        'TDM (%)': v.tdm,
        'Pannes/Jour': v.pannesParJour.toFixed(2)
      }));
      
      const wsVoitures = XLSX.utils.json_to_sheet(voituresData);
      XLSX.utils.book_append_sheet(wb, wsVoitures, 'Performance Équipements');

      // Feuille Analyse Projets
      const projetsData = indicateursParProjet.map(p => ({
        'Projet': p.name,
        'Nombre de pannes': p.nombrePannes,
        'HIM Total (h)': p.duree_panne.toFixed(1),
        'TF Total (h)': p.temps_fonctionnement.toFixed(1),
        'MTBF Projet (h)': p.mtbf,
        'Équipements impactés': p.voituresImpactees
      }));
      
      const wsProjets = XLSX.utils.json_to_sheet(projetsData);
      XLSX.utils.book_append_sheet(wb, wsProjets, 'Analyse Projets');

      // Feuille Analyse Chauffeurs
      const chauffeursData = indicateursParChauffeur.map(c => ({
        'Chauffeur': c.nom,
        'Matricule': c.matricule || '-',
        'Nombre de pannes': c.nombrePannes,
        'HIM Total (h)': c.duree_panne.toFixed(1),
        'Véhicules conduits': c.vehiculesConducteur
      }));
      
      const wsChauffeurs = XLSX.utils.json_to_sheet(chauffeursData);
      XLSX.utils.book_append_sheet(wb, wsChauffeurs, 'Analyse Chauffeurs');

      // Feuille Analyse Pannes
      const pannesData = filteredArrets.map(panne => {
        const voitureInfo = state.voitures.find(v => v.id === (panne.voiture || panne.voiture_id));
        const projetInfo = state.projets.find(p => p.id === (panne.projet || panne.projet_id));
        const chauffeurInfo = state.chauffeurs.find(c => c.id === (panne.chauffeur || panne.chauffeur_id));
        const codeInfo = state.codesPanne.find(c => c.id === (panne.code_panne || panne.code_panne_id));
        
        return {
          'Date': panne.date_panne ? format(parseISO(panne.date_panne), 'dd/MM/yyyy HH:mm') : 'N/A',
          'Équipement': voitureInfo?.matricule || 'Inconnu',
          'Projet': projetInfo?.name || 'Inconnu',
          'Chauffeur': chauffeurInfo?.nom || 'Inconnu',
          'Code Panne': codeInfo?.code || 'Non spécifié',
          'Cause': panne.cause_panne || '-',
          'HIM (h)': (panne.duree_panne || 0).toFixed(1),
          'TF (h)': (panne.temps_fonctionnement || 0).toFixed(1),
          'Intervenant': panne.intervenant || '-',
          'Statut': panne.date_reparation ? 'Réparé' : 'En cours'
        };
      });
      
      const wsPannes = XLSX.utils.json_to_sheet(pannesData);
      XLSX.utils.book_append_sheet(wb, wsPannes, 'Détail Pannes');

      // Ajuster la largeur des colonnes
      [wsVoitures, wsProjets, wsChauffeurs, wsPannes].forEach(ws => {
        const colWidths = [];
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
        for (let C = range.s.c; C <= range.e.c; ++C) {
          let maxLen = 10;
          for (let R = range.s.r; R <= range.e.r; ++R) {
            const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
            if (cell && cell.v) {
              maxLen = Math.max(maxLen, cell.v.toString().length);
            }
          }
          colWidths[C] = { wch: Math.min(maxLen + 2, 50) };
        }
        ws['!cols'] = colWidths;
      });

      const fileName = `performance_equipements_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      alert(`✅ Fichier Excel "${fileName}" généré avec succès !`);
      
    } catch (error) {
      console.error("Erreur export Excel:", error);
      alert("❌ Erreur lors de la génération du fichier Excel");
    }
  };

  // Configuration des graphiques
  const performanceChartData = {
    labels: indicateursParVoiture.slice(0, 10).map(v => v.matricule),
    datasets: [
      {
        label: 'Nombre de pannes',
        data: indicateursParVoiture.slice(0, 10).map(v => v.nombrePannes),
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
        yAxisID: 'y',
        order: 1
      },
      {
        label: 'MTBF (heures)',
        data: indicateursParVoiture.slice(0, 10).map(v => parseFloat(v.mtbf)),
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        yAxisID: 'y1',
        order: 2
      }
    ]
  };

  const pieChartData = {
    labels: indicateursParProjet.slice(0, 5).map(p => p.name),
    datasets: [{
      data: indicateursParProjet.slice(0, 5).map(p => p.nombrePannes),
      backgroundColor: [
        'rgba(255, 99, 132, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(153, 102, 255, 0.7)',
      ],
    }]
  };

  const tendanceChartData = {
    labels: donneesTendance.map(d => d.date),
    datasets: [
      {
        label: 'Nombre de pannes',
        data: donneesTendance.map(d => d.pannes),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y'
      },
      {
        label: 'HIM (heures)',
        data: donneesTendance.map(d => d.him),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  };

  return (
    <Container fluid className="py-4" style={{ backgroundColor: '#f8f9fa' }}>
      <style>
        {`
          .stat-card {
            transition: transform 0.2s, box-shadow 0.2s;
            cursor: pointer;
          }
          .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
          }
          .alert-item {
            transition: background-color 0.2s;
          }
          .alert-item:hover {
            background-color: #f8f9fa;
          }
          .metric-value {
            font-size: 2rem;
            font-weight: bold;
            line-height: 1;
          }
          .metric-label {
            font-size: 0.85rem;
            color: #6c757d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .trend-up { color: #28a745; }
          .trend-down { color: #dc3545; }
          .trend-stable { color: #ffc107; }
        `}
      </style>

      <Card className="shadow-lg border-0">
        <Card.Header className="bg-gradient-primary text-white py-3" style={{ background: 'linear-gradient(45deg, #007bff, #0056b3)' }}>
          <Row className="align-items-center">
            <Col md={8}>
              <h3 className="mb-0 d-flex align-items-center">
                <FaTachometerAlt className="me-2" />
                Analyse de Performance et Tableau de Bord
              </h3>
              <small className="text-white-50">
                {format(parseISO(state.dateDebut), 'dd MMMM yyyy', { locale: fr })} - 
                {format(parseISO(state.dateFin), 'dd MMMM yyyy', { locale: fr })}
              </small>
            </Col>
            <Col md={4} className="text-end">
              <ButtonGroup className="me-2">
                <Button 
                  variant={state.periodeComparaison === '7jours' ? 'light' : 'outline-light'} 
                  size="sm"
                  onClick={() => handlePeriodeChange('7jours')}
                >
                  7j
                </Button>
                <Button 
                  variant={state.periodeComparaison === '30jours' ? 'light' : 'outline-light'} 
                  size="sm"
                  onClick={() => handlePeriodeChange('30jours')}
                >
                  30j
                </Button>
                <Button 
                  variant={state.periodeComparaison === '90jours' ? 'light' : 'outline-light'} 
                  size="sm"
                  onClick={() => handlePeriodeChange('90jours')}
                >
                  90j
                </Button>
                <Button 
                  variant={state.periodeComparaison === 'annee' ? 'light' : 'outline-light'} 
                  size="sm"
                  onClick={() => handlePeriodeChange('annee')}
                >
                  1 an
                </Button>
              </ButtonGroup>
              <Button 
                variant="success" 
                onClick={handleExportExcel}
                disabled={indicateursParVoiture.length === 0}
                className="shadow-sm"
              >
                <FaFileExcel className="me-2" />
                Exporter
              </Button>
            </Col>
          </Row>
        </Card.Header>

        <Card.Body>
          {state.loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
              <p className="mt-3 text-muted">Chargement des données de performance...</p>
            </div>
          ) : state.error ? (
            <Alert variant="danger" className="d-flex align-items-center">
              <FaExclamationTriangle size={24} className="me-3" />
              <div className="flex-grow-1">
                <strong>Erreur :</strong> {state.error}
              </div>
              <Button variant="outline-danger" onClick={() => window.location.reload()} className="ms-3">
                <FaArrowUp className="me-2" /> Réessayer
              </Button>
            </Alert>
          ) : (
            <>
              {/* Filtres avancés */}
              <Card className="shadow-sm border-0 mb-4">
                <Card.Body>
                  <Row className="g-3">
                    <Col md={2}>
                      <Form.Group>
                        <Form.Label className="fw-bold">
                          <FaCar className="me-2" />
                          Équipement
                        </Form.Label>
                        <Form.Select
                          value={state.selectedVoiture}
                          onChange={e => setState(prev => ({ ...prev, selectedVoiture: e.target.value }))}
                          size="sm"
                        >
                          <option value="">Tous les équipements</option>
                          {state.voitures.map(v => (
                            <option key={v.id} value={v.id}>
                              {v.matricule || `ID: ${v.id}`}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={2}>
                      <Form.Group>
                        <Form.Label className="fw-bold">
                          <FaProjectDiagram className="me-2" />
                          Projet
                        </Form.Label>
                        <Form.Select
                          value={state.selectedProjet}
                          onChange={e => setState(prev => ({ ...prev, selectedProjet: e.target.value }))}
                          size="sm"
                        >
                          <option value="">Tous les projets</option>
                          {state.projets.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name || `ID: ${p.id}`}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={2}>
                      <Form.Group>
                        <Form.Label className="fw-bold">
                          <FaUser className="me-2" />
                          Chauffeur
                        </Form.Label>
                        <Form.Select
                          value={state.selectedChauffeur}
                          onChange={e => setState(prev => ({ ...prev, selectedChauffeur: e.target.value }))}
                          size="sm"
                        >
                          <option value="">Tous les chauffeurs</option>
                          {state.chauffeurs.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.nom || `ID: ${c.id}`}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={2}>
                      <Form.Group>
                        <Form.Label className="fw-bold">
                          <FaExclamationTriangle className="me-2" />
                          Code panne
                        </Form.Label>
                        <Form.Select
                          value={state.selectedCodePanne}
                          onChange={e => setState(prev => ({ ...prev, selectedCodePanne: e.target.value }))}
                          size="sm"
                        >
                          <option value="">Tous les codes</option>
                          {state.codesPanne.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.code || c.name || `ID: ${c.id}`}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={2}>
                      <Form.Group>
                        <Form.Label className="fw-bold">
                          <FaCalendarAlt className="me-2" />
                          Date début
                        </Form.Label>
                        <Form.Control
                          type="date"
                          size="sm"
                          value={state.dateDebut}
                          onChange={e => setState(prev => ({ ...prev, dateDebut: e.target.value }))}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={2}>
                      <Form.Group>
                        <Form.Label className="fw-bold">
                          <FaCalendarAlt className="me-2" />
                          Date fin
                        </Form.Label>
                        <Form.Control
                          type="date"
                          size="sm"
                          value={state.dateFin}
                          onChange={e => setState(prev => ({ ...prev, dateFin: e.target.value }))}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Alertes et recommandations */}
              {alertes.length > 0 && (
                <Card className="shadow-sm border-0 mb-4 border-danger">
                  <Card.Header className="bg-danger text-white d-flex align-items-center">
                    <FaExclamationTriangle className="me-2" />
                    <h6 className="mb-0">Alertes et Points d'attention ({alertes.length})</h6>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <ListGroup variant="flush">
                      {alertes.slice(0, 5).map((alerte, index) => (
                        <ListGroup.Item key={index} className="d-flex align-items-start alert-item">
                          <div className="me-3">{alerte.icon}</div>
                          <div className="flex-grow-1">
                            <strong>{alerte.titre}</strong>
                            <p className="mb-0 text-muted small">{alerte.message}</p>
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </Card.Body>
                </Card>
              )}

              {/* KPIs améliorés */}
              <Row className="g-3 mb-4">
                <Col md={3}>
                  <Card className="shadow-sm border-0 stat-card" onClick={handleShowTendance}>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="metric-label">Total Pannes</div>
                          <div className="metric-value text-danger">{statsGlobales.totalPannes}</div>
                          <small className="text-muted">
                            {statsGlobales.totalVoitures} équipements
                          </small>
                        </div>
                        <FaExclamationTriangle size={32} className="text-danger opacity-50" />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="shadow-sm border-0 stat-card" onClick={handleShowTendance}>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="metric-label">HIM Total</div>
                          <div className="metric-value text-warning">{statsGlobales.totalHim}h</div>
                          <small className="text-muted">
                            Moy. {(statsGlobales.totalHim / statsGlobales.totalPannes || 1).toFixed(1)}h/panne
                          </small>
                        </div>
                        <FaClock size={32} className="text-warning opacity-50" />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="shadow-sm border-0 stat-card" onClick={handleShowTendance}>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="metric-label">TDM Global</div>
                          <div className="metric-value text-success">{statsGlobales.tdmGlobal}%</div>
                          <small className="text-muted">
                            MTBF: {statsGlobales.mtbfGlobal}h
                          </small>
                        </div>
                        <FaCheckCircle size={32} className="text-success opacity-50" />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="shadow-sm border-0 stat-card" onClick={() => setState(prev => ({ ...prev, activeTab: 'projets' }))}>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="metric-label">Projets impactés</div>
                          <div className="metric-value text-primary">{statsGlobales.totalProjets}</div>
                          <small className="text-muted">
                            {indicateursParProjet.length} projet(s) avec pannes
                          </small>
                        </div>
                        <FaProjectDiagram size={32} className="text-primary opacity-50" />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Graphiques */}
              <Row className="mb-4">
                <Col md={8}>
                  <Card className="shadow-sm border-0">
                    <Card.Header className="bg-light d-flex align-items-center">
                      <FaChartLine className="me-2 text-primary" />
                      <h6 className="mb-0">Évolution temporelle des pannes</h6>
                    </Card.Header>
                    <Card.Body style={{ height: '300px' }}>
                      <Line 
                        data={tendanceChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          interaction: { mode: 'index', intersect: false },
                          plugins: {
                            legend: { position: 'top' },
                            tooltip: { enabled: true }
                          },
                          scales: {
                            y: {
                              type: 'linear',
                              display: true,
                              position: 'left',
                              title: { display: true, text: 'Nombre de pannes' }
                            },
                            y1: {
                              type: 'linear',
                              display: true,
                              position: 'right',
                              title: { display: true, text: 'HIM (heures)' },
                              grid: { drawOnChartArea: false }
                            }
                          }
                        }}
                      />
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="shadow-sm border-0 h-100">
                    <Card.Header className="bg-light d-flex align-items-center">
                      <FaChartPie className="me-2 text-success" />
                      <h6 className="mb-0">Répartition par projet</h6>
                    </Card.Header>
                    <Card.Body>
                      {pieChartData.labels.length > 0 ? (
                        <div style={{ height: '250px' }}>
                          <Pie 
                            data={pieChartData}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: { position: 'bottom' },
                                tooltip: {
                                  callbacks: {
                                    label: (context) => `${context.label}: ${context.raw} pannes`
                                  }
                                }
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div className="text-center text-muted py-5">
                          <FaChartPie size={48} className="mb-3 opacity-50" />
                          <p>Aucune donnée disponible</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Onglets */}
              <Tabs
                activeKey={state.activeTab}
                onSelect={(k) => setState(prev => ({ ...prev, activeTab: k }))}
                className="mb-3"
              >
                <Tab eventKey="performance" title={
                  <span><FaTachometerAlt className="me-2" />Performance</span>
                }>
                  <PerformanceTab 
                    indicateursParVoiture={indicateursParVoiture}
                    onShowVoitureDetails={handleShowVoitureDetails}
                    performanceChartData={performanceChartData}
                  />
                </Tab>
                <Tab eventKey="projets" title={
                  <span><FaProjectDiagram className="me-2" />Analyse Projets</span>
                }>
                  <ProjetsTab 
                    indicateursParProjet={indicateursParProjet}
                    onShowProjetDetails={handleShowProjetDetails}
                  />
                </Tab>
                <Tab eventKey="chauffeurs" title={
                  <span><FaUser className="me-2" />Analyse Chauffeurs</span>
                }>
                  <ChauffeursTab 
                    indicateursParChauffeur={indicateursParChauffeur}
                    chauffeurs={state.chauffeurs}
                  />
                </Tab>
                <Tab eventKey="pannes" title={
                  <span><FaExclamationTriangle className="me-2" />Analyse Pannes</span>
                }>
                  <PannesTab 
                    indicateursParCodePanne={indicateursParCodePanne}
                    codesPanne={state.codesPanne}
                    pannes={filteredArrets}
                  />
                </Tab>
              </Tabs>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Modals */}
      <DetailPannesModal
        show={state.showDetailModal}
        onHide={() => setState(prev => ({ ...prev, showDetailModal: false }))}
        voiture={state.selectedVoitureDetails}
        pannes={state.voiturePannes}
        chauffeurs={state.chauffeurs}
        codesPanne={state.codesPanne}
      />

      <ProjetDetailModal
        show={state.showProjetModal}
        onHide={() => setState(prev => ({ ...prev, showProjetModal: false }))}
        projet={state.selectedProjetDetails}
        voitures={state.projetVoitures}
        pannes={state.projetPannes}
        allVoitures={state.voitures}
      />

      <TendanceModal
        show={state.showTendanceModal}
        onHide={() => setState(prev => ({ ...prev, showTendanceModal: false }))}
        donnees={donneesTendance}
        dateDebut={state.dateDebut}
        dateFin={state.dateFin}
      />
    </Container>
  );
};

// ==================== COMPOSANTS DES ONGLETS ====================

const PerformanceTab = ({ indicateursParVoiture, onShowVoitureDetails, performanceChartData }) => (
  <>
    <Card className="mb-4 shadow-sm border-0">
      <Card.Header className="bg-light">
        <h6 className="mb-0">Top 10 Équipements - Performance</h6>
      </Card.Header>
      <Card.Body style={{ height: '400px' }}>
        <Bar 
          data={performanceChartData} 
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'top' },
              tooltip: { mode: 'index', intersect: false }
            },
            scales: {
              x: { ticks: { maxRotation: 45, minRotation: 0 } },
              y: { 
                type: 'linear', 
                display: true, 
                position: 'left',
                title: { display: true, text: 'Nombre de pannes' }
              },
              y1: { 
                type: 'linear', 
                display: true, 
                position: 'right',
                title: { display: true, text: 'MTBF (heures)' },
                grid: { drawOnChartArea: false }
              }
            }
          }} 
        />
      </Card.Body>
    </Card>

    <Card className="shadow-sm border-0">
      <Card.Header className="bg-light d-flex justify-content-between align-items-center">
        <h6 className="mb-0">Détail par Équipement</h6>
        <Badge bg="info">{indicateursParVoiture.length} équipement(s)</Badge>
      </Card.Header>
      <Card.Body className="p-0">
        <div className="table-responsive">
          <Table striped hover className="align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th>Équipement</th>
                <th>Projet</th>
                <th className="text-center">Pannes</th>
                <th className="text-center">HIM (h)</th>
                <th className="text-center">TF (h)</th>
                <th className="text-center">MTBF</th>
                <th className="text-center">TDM</th>
                <th className="text-center">Pannes/Jour</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {indicateursParVoiture.map((v, index) => (
                <tr key={index}>
                  <td className="fw-bold">{v.matricule}</td>
                  <td>{v.projet}</td>
                  <td className="text-center">
                    <Badge bg="danger" pill>{v.nombrePannes}</Badge>
                  </td>
                  <td className="text-center">{parseFloat(v.duree_panne).toFixed(1)}</td>
                  <td className="text-center">{parseFloat(v.temps_fonctionnement).toFixed(1)}</td>
                  <td className="text-center">
                    <Badge bg={v.mtbfClasse} pill>{v.mtbf}h</Badge>
                  </td>
                  <td className="text-center">
                    <Badge bg={v.tdmClasse} pill>{v.tdm}%</Badge>
                  </td>
                  <td className="text-center">
                    <small className="text-muted">{v.pannesParJour.toFixed(2)}</small>
                  </td>
                  <td className="text-center">
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => onShowVoitureDetails(v)}
                      className="px-3"
                    >
                      <FaEye className="me-1" /> Détails
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card.Body>
    </Card>
  </>
);

const ProjetsTab = ({ indicateursParProjet, onShowProjetDetails }) => (
  <Row>
    <Col md={6}>
      <Card className="shadow-sm border-0 h-100">
        <Card.Header className="bg-light">
          <h6 className="mb-0">Classement des projets</h6>
        </Card.Header>
        <Card.Body>
          <div style={{ height: '300px' }}>
            <Bar 
              data={{
                labels: indicateursParProjet.slice(0, 8).map(p => p.name),
                datasets: [{
                  label: 'Nombre de pannes',
                  data: indicateursParProjet.slice(0, 8).map(p => p.nombrePannes),
                  backgroundColor: 'rgba(54, 162, 235, 0.7)',
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { ticks: { maxRotation: 45, minRotation: 0 } } }
              }}
            />
          </div>
        </Card.Body>
      </Card>
    </Col>
    <Col md={6}>
      <Card className="shadow-sm border-0 h-100">
        <Card.Header className="bg-light">
          <h6 className="mb-0">Détail des projets</h6>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <Table striped hover size="sm" className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Projet</th>
                  <th className="text-center">Pannes</th>
                  <th className="text-center">HIM</th>
                  <th className="text-center">MTBF</th>
                  <th className="text-center">Équipements</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {indicateursParProjet.map((p, index) => (
                  <tr key={index}>
                    <td className="fw-bold">{p.name}</td>
                    <td className="text-center">
                      <Badge bg="primary" pill>{p.nombrePannes}</Badge>
                    </td>
                    <td className="text-center">{p.duree_panne.toFixed(1)}h</td>
                    <td className="text-center">{p.mtbf}h</td>
                    <td className="text-center">{p.voituresImpactees}</td>
                    <td className="text-center">
                      <Button 
                        variant="outline-info" 
                        size="sm"
                        onClick={() => onShowProjetDetails(p)}
                      >
                        <FaEye />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </Col>
  </Row>
);

const ChauffeursTab = ({ indicateursParChauffeur, chauffeurs }) => (
  <Card className="shadow-sm border-0">
    <Card.Header className="bg-light">
      <h6 className="mb-0">Performance par chauffeur</h6>
    </Card.Header>
    <Card.Body className="p-0">
      <div className="table-responsive">
        <Table striped hover className="align-middle mb-0">
          <thead className="bg-light">
            <tr>
              <th>Chauffeur</th>
              <th>Matricule</th>
              <th className="text-center">Pannes</th>
              <th className="text-center">HIM Total</th>
              <th className="text-center">Véhicules</th>
              <th className="text-center">Moy. HIM/panne</th>
            </tr>
          </thead>
          <tbody>
            {indicateursParChauffeur.map((c, index) => (
              <tr key={index}>
                <td className="fw-bold">{c.nom}</td>
                <td>{c.matricule || '-'}</td>
                <td className="text-center">
                  <Badge bg="warning" pill>{c.nombrePannes}</Badge>
                </td>
                <td className="text-center">{c.duree_panne.toFixed(1)}h</td>
                <td className="text-center">{c.vehiculesConducteur}</td>
                <td className="text-center">
                  {(c.duree_panne / (c.nombrePannes || 1)).toFixed(1)}h
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </Card.Body>
  </Card>
);

const PannesTab = ({ indicateursParCodePanne, codesPanne, pannes }) => (
  <Row>
    <Col md={5}>
      <Card className="shadow-sm border-0 h-100">
        <Card.Header className="bg-light">
          <h6 className="mb-0">Codes pannes les plus fréquents</h6>
        </Card.Header>
        <Card.Body>
          <div style={{ height: '300px' }}>
            <Pie 
              data={{
                labels: indicateursParCodePanne.slice(0, 5).map(c => c.code),
                datasets: [{
                  data: indicateursParCodePanne.slice(0, 5).map(c => c.nombrePannes),
                  backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                  ],
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom' },
                  tooltip: {
                    callbacks: {
                      label: (context) => `${context.label}: ${context.raw} pannes`
                    }
                  }
                }
              }}
            />
          </div>
        </Card.Body>
      </Card>
    </Col>
    <Col md={7}>
      <Card className="shadow-sm border-0">
        <Card.Header className="bg-light">
          <h6 className="mb-0">Détail des pannes</h6>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <Table striped hover size="sm" className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Code</th>
                  <th>Libellé</th>
                  <th className="text-center">Pannes</th>
                  <th className="text-center">HIM Total</th>
                  <th className="text-center">Équipements</th>
                  <th className="text-center">Moy. HIM</th>
                </tr>
              </thead>
              <tbody>
                {indicateursParCodePanne.map((c, index) => (
                  <tr key={index}>
                    <td className="fw-bold">{c.code}</td>
                    <td>{c.libelle || '-'}</td>
                    <td className="text-center">
                      <Badge bg="danger" pill>{c.nombrePannes}</Badge>
                    </td>
                    <td className="text-center">{c.duree_panne.toFixed(1)}h</td>
                    <td className="text-center">{c.vehicules}</td>
                    <td className="text-center">
                      {(c.duree_panne / (c.nombrePannes || 1)).toFixed(1)}h
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </Col>
  </Row>
);

// ==================== MODALS ====================

const DetailPannesModal = ({ show, onHide, voiture, pannes, chauffeurs, codesPanne }) => {
  if (!voiture) return null;

  const totalHim = pannes.reduce((sum, p) => sum + (p.duree_panne || 0), 0);
  const totalTF = pannes.reduce((sum, p) => sum + (p.temps_fonctionnement || 0), 0);
  const totalPannes = pannes.reduce((sum, p) => sum + (p.nombre_pannes || 1), 0);
  const mtbf = totalPannes > 0 ? (totalTF / totalPannes).toFixed(1) : totalTF.toFixed(1);
  const tdm = totalTF + totalHim > 0 ? ((totalTF / (totalTF + totalHim)) * 100).toFixed(1) : '100';

  return (
    <Modal show={show} onHide={onHide} size="xl" centered scrollable>
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <FaCar className="me-2" />
          Détails des pannes - {voiture.matricule || `ID: ${voiture.id}`}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row className="mb-4">
          <Col md={6}>
            <Card className="bg-light border-0">
              <Card.Body>
                <h6 className="text-muted mb-3">Informations Équipement</h6>
                <Row>
                  <Col md={6}>
                    <p className="mb-1"><strong>Matricule:</strong> {voiture.matricule || 'Non spécifié'}</p>
                    <p className="mb-1"><strong>Marque:</strong> {voiture.marque || 'Non spécifiée'}</p>
                  </Col>
                  <Col md={6}>
                    <p className="mb-1"><strong>Modèle:</strong> {voiture.modele || 'Non spécifié'}</p>
                    <p className="mb-1"><strong>Année:</strong> {voiture.annee || 'Non spécifiée'}</p>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="bg-light border-0">
              <Card.Body>
                <h6 className="text-muted mb-3">Indicateurs de performance</h6>
                <Row>
                  <Col md={4} className="text-center">
                    <div className="metric-label">Total pannes</div>
                    <div className="metric-value text-danger">{totalPannes}</div>
                  </Col>
                  <Col md={4} className="text-center">
                    <div className="metric-label">HIM Total</div>
                    <div className="metric-value text-warning">{totalHim.toFixed(1)}h</div>
                  </Col>
                  <Col md={4} className="text-center">
                    <div className="metric-label">TDM</div>
                    <div className="metric-value text-success">{tdm}%</div>
                  </Col>
                </Row>
                <Row className="mt-2">
                  <Col md={6} className="text-center">
                    <small className="text-muted">MTBF: {mtbf}h</small>
                  </Col>
                  <Col md={6} className="text-center">
                    <small className="text-muted">TF Total: {totalTF.toFixed(1)}h</small>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <h6 className="mb-3">Historique détaillé des pannes</h6>
        {pannes.length > 0 ? (
          <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <Table striped bordered hover size="sm">
              <thead className="table-secondary">
                <tr>
                  <th>Date</th>
                  <th>Code Panne</th>
                  <th>Cause</th>
                  <th className="text-center">HIM</th>
                  <th className="text-center">TF</th>
                  <th>Chauffeur</th>
                  <th>Intervenant</th>
                  <th className="text-center">Statut</th>
                </tr>
              </thead>
              <tbody>
                {pannes.map((panne, index) => {
                  const chauffeurInfo = chauffeurs?.find(c => c.id === (panne.chauffeur || panne.chauffeur_id));
                  const codeInfo = codesPanne?.find(c => c.id === (panne.code_panne || panne.code_panne_id));
                  return (
                    <tr key={index}>
                      <td>{panne.date_panne ? format(parseISO(panne.date_panne), 'dd/MM/yyyy HH:mm') : 'N/A'}</td>
                      <td>
                        <Badge bg="secondary">{codeInfo?.code || 'N/A'}</Badge>
                      </td>
                      <td>{panne.cause_panne || '-'}</td>
                      <td className="text-center">{(panne.duree_panne || 0).toFixed(1)}h</td>
                      <td className="text-center">{(panne.temps_fonctionnement || 0).toFixed(1)}h</td>
                      <td>{chauffeurInfo?.nom || '-'}</td>
                      <td>{panne.intervenant || '-'}</td>
                      <td className="text-center">
                        <Badge bg={panne.date_reparation ? 'success' : 'danger'}>
                          {panne.date_reparation ? 'Réparé' : 'En cours'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        ) : (
          <Alert variant="info" className="text-center">
            Aucune panne enregistrée pour cet équipement dans la période sélectionnée.
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

const ProjetDetailModal = ({ show, onHide, projet, voitures, pannes, allVoitures }) => {
  if (!projet) return null;

  const totalHim = pannes.reduce((sum, p) => sum + (p.duree_panne || 0), 0);
  const totalTF = pannes.reduce((sum, p) => sum + (p.temps_fonctionnement || 0), 0);
  const totalPannes = pannes.reduce((sum, p) => sum + (p.nombre_pannes || 1), 0);
  const mtbf = totalPannes > 0 ? (totalTF / totalPannes).toFixed(1) : totalTF.toFixed(1);

  return (
    <Modal show={show} onHide={onHide} size="xl" centered scrollable>
      <Modal.Header closeButton className="bg-info text-white">
        <Modal.Title>
          <FaProjectDiagram className="me-2" />
          Détails du projet - {projet.name || `ID: ${projet.id}`}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row className="mb-4">
          <Col md={4}>
            <Card className="bg-light border-0 h-100">
              <Card.Body>
                <h6 className="text-muted mb-3">Informations Projet</h6>
                <p className="mb-1"><strong>Nom:</strong> {projet.name || 'Non nommé'}</p>
                <p className="mb-1"><strong>Description:</strong> {projet.description || 'Non spécifiée'}</p>
                <p className="mb-1"><strong>Statut:</strong> {projet.statut || 'Non spécifié'}</p>
                <p className="mb-0"><strong>Chef de projet:</strong> {projet.chef_projet || 'Non spécifié'}</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={8}>
            <Card className="bg-light border-0">
              <Card.Body>
                <h6 className="text-muted mb-3">Statistiques du projet</h6>
                <Row className="text-center">
                  <Col md={3}>
                    <div className="metric-label">Total pannes</div>
                    <div className="metric-value text-danger">{totalPannes}</div>
                  </Col>
                  <Col md={3}>
                    <div className="metric-label">HIM Total</div>
                    <div className="metric-value text-warning">{totalHim.toFixed(1)}h</div>
                  </Col>
                  <Col md={3}>
                    <div className="metric-label">TF Total</div>
                    <div className="metric-value text-success">{totalTF.toFixed(1)}h</div>
                  </Col>
                  <Col md={3}>
                    <div className="metric-label">MTBF</div>
                    <div className="metric-value text-primary">{mtbf}h</div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <h6 className="mb-3">Équipements du projet</h6>
            {voitures.length > 0 ? (
              <div style={{ maxHeight: '300px', overflowY: 'auto' }} className="mb-4">
                <Table striped bordered hover size="sm">
                  <thead className="table-secondary">
                    <tr>
                      <th>Équipement</th>
                      <th className="text-center">Pannes</th>
                      <th className="text-center">HIM</th>
                      <th className="text-center">TDM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {voitures.map((voiture, index) => (
                      <tr key={index}>
                        <td className="fw-bold">{voiture.matricule}</td>
                        <td className="text-center">
                          <Badge bg="danger" pill>{voiture.nombrePannes}</Badge>
                        </td>
                        <td className="text-center">{voiture.duree_panne.toFixed(1)}h</td>
                        <td className="text-center">
                          <Badge bg={voiture.tdmClasse} pill>{voiture.tdm}%</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <Alert variant="info" className="text-center">
                Aucun équipement avec des pannes pour ce projet.
              </Alert>
            )}
          </Col>
          <Col md={6}>
            <h6 className="mb-3">Graphique des pannes</h6>
            <Card>
              <Card.Body style={{ height: '250px' }}>
                <Bar 
                  data={{
                    labels: voitures.slice(0, 8).map(v => v.matricule),
                    datasets: [{
                      label: 'Nombre de pannes',
                      data: voitures.slice(0, 8).map(v => v.nombrePannes),
                      backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } }
                  }}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <h6 className="mb-3 mt-4">Détail de toutes les pannes</h6>
        {pannes.length > 0 ? (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <Table striped bordered hover size="sm">
              <thead className="table-secondary">
                <tr>
                  <th>Date</th>
                  <th>Équipement</th>
                  <th>Cause</th>
                  <th className="text-center">HIM</th>
                  <th className="text-center">Statut</th>
                </tr>
              </thead>
              <tbody>
                {pannes.map((panne, index) => {
                  const voitureInfo = allVoitures?.find(v => v.id === (panne.voiture || panne.voiture_id));
                  return (
                    <tr key={index}>
                      <td>{panne.date_panne ? format(parseISO(panne.date_panne), 'dd/MM/yyyy HH:mm') : 'N/A'}</td>
                      <td className="fw-bold">{voitureInfo?.matricule || `ID: ${panne.voiture || panne.voiture_id}`}</td>
                      <td>{panne.cause_panne || '-'}</td>
                      <td className="text-center">{(panne.duree_panne || 0).toFixed(1)}h</td>
                      <td className="text-center">
                        <Badge bg={panne.date_reparation ? 'success' : 'danger'}>
                          {panne.date_reparation ? 'Réparé' : 'En cours'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        ) : (
          <Alert variant="info" className="text-center">
            Aucune panne enregistrée pour ce projet.
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

const TendanceModal = ({ show, onHide, donnees, dateDebut, dateFin }) => (
  <Modal show={show} onHide={onHide} size="lg" centered>
    <Modal.Header closeButton className="bg-success text-white">
      <Modal.Title>
        <FaChartLine className="me-2" />
        Évolution des pannes
      </Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <p className="text-muted mb-3">
        Période du {format(parseISO(dateDebut), 'dd/MM/yyyy')} au {format(parseISO(dateFin), 'dd/MM/yyyy')}
      </p>
      <div style={{ height: '400px' }}>
        <Line 
          data={{
            labels: donnees.map(d => d.date),
            datasets: [
              {
                label: 'Nombre de pannes',
                data: donnees.map(d => d.pannes),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                tension: 0.4,
                fill: true
              },
              {
                label: 'HIM (heures)',
                data: donnees.map(d => d.him),
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                tension: 0.4,
                fill: true,
                yAxisID: 'y1'
              }
            ]
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { position: 'top' } },
            scales: {
              y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: { display: true, text: 'Nombre de pannes' }
              },
              y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: { display: true, text: 'HIM (heures)' },
                grid: { drawOnChartArea: false }
              }
            }
          }}
        />
      </div>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={onHide}>
        Fermer
      </Button>
    </Modal.Footer>
  </Modal>
);

export default AnalysePerformance;