import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Button, Form, Card, Table, Spinner, Alert,
  Badge, Stack, Container, Row, Col, Modal,
  InputGroup
} from 'react-bootstrap';
import {
  FaPlus, FaEdit, FaTrash, FaSyncAlt, FaInfoCircle,
  FaBullseye, FaChartBar, FaCalendarAlt, FaSearch,
  FaCalendarDay, FaProjectDiagram, FaChartLine,
  FaFilter, FaDownload, FaEye, FaList, FaCog,
  FaTimes, FaCheck, FaCalculator, FaLock, FaSave,
  FaStar, FaRegStar
} from 'react-icons/fa';
import {
  format, isToday, parseISO, getYear, getMonth, subDays
} from 'date-fns';
import { fr } from 'date-fns/locale';
import * as XLSX from 'xlsx';

// Configuration API
const API_BASE_URL = "https://intranet-attm.com/api";
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Fonction utilitaire pour extraire les données de la réponse API
const extractData = (response) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  if (response.data && response.data.data && Array.isArray(response.data.data)) return response.data.data;
  if (response.data && response.data.results && Array.isArray(response.data.results)) return response.data.results;
  if (response.data && response.data.success && response.data.data && Array.isArray(response.data.data)) return response.data.data;
  console.warn('Format de données inattendu:', response);
  return [];
};

const AnalysePerformances = () => {
  const navigate = useNavigate();
  
  // Date par défaut = hier
  const getDefaultDate = useCallback(() => format(subDays(new Date(), 1), 'yyyy-MM-dd'), []);
  const getCurrentDate = useCallback(() => format(new Date(), 'yyyy-MM-dd'), []);

  // ÉTATS PRINCIPAUX
  const [formData, setFormData] = useState({
    projet: '',
    mesure: '',
    realisation_journee: 0,
    date_rapport: getDefaultDate(),
    objectif_mensuel: 0,
    donnee_projet: 0,
    prevision_jour: 0,
    restant_projet: 0,
    cumul_realise: 0,
    mois_restants: 0,
    pourcentage_r_projet: 0,
    realisation_mois: 0,
  });

  // Gestion des rôles utilisateur
  const [userRole, setUserRole] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showProjectManager, setShowProjectManager] = useState(false);
  const [performances, setPerformances] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [trackedProjects, setTrackedProjects] = useState([]);
  const [loading, setLoading] = useState({
    main: true,
    submit: false,
    projects: true
  });
  const [notifications, setNotifications] = useState([]);
  const [performanceToDelete, setPerformanceToDelete] = useState(null);

  // États pour les filtres (Synthèse)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');
  const [newProjectName, setNewProjectName] = useState('');

  // ✅ LISTE DES PROJETS PRIORITAIRES (sauvegardée dans localStorage)
  const [priorityProjects, setPriorityProjects] = useState(() => {
    const saved = localStorage.getItem('priorityProjects');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return ["RANL", "V.NKTT2025", "Z.FRANCHE", "SNIM/ZOUERATE"];
      }
    }
    return ["RANL", "V.NKTT2025", "Z.FRANCHE", "SNIM/ZOUERATE"];
  });

  const predefinedMeasures = useMemo(() => [
    "PST en ml",
    "Fondation en ml",
    "C.Base en ml",
    "Impregnation en ml",
    "Enrobe en ml",
  ], []);

  // ============================================
  // FONCTIONS DE NOTIFICATION
  // ============================================
  const addNotification = useCallback((message, variant = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  // ============================================
  // FONCTIONS DE GESTION DES PRIORITÉS
  // ============================================
  const addToPriority = useCallback((projectName, projectId) => {
    if (!priorityProjects.includes(projectName)) {
      setPriorityProjects(prev => [...prev, projectName]);
      
      if (projectId && !trackedProjects.includes(projectId.toString())) {
        const newTracked = [...trackedProjects, projectId.toString()];
        setTrackedProjects(newTracked);
        localStorage.setItem('trackedProjects', JSON.stringify(newTracked));
      }
      
      addNotification(`"${projectName}" ajouté aux projets prioritaires et sélectionné`, 'success');
    }
  }, [priorityProjects, trackedProjects, addNotification]);

  const removeFromPriority = useCallback((projectName) => {
    setPriorityProjects(prev => prev.filter(name => name !== projectName));
    addNotification(`"${projectName}" retiré des projets prioritaires`, 'info');
  }, [addNotification]);

  // Ordre d'affichage pour le tri
  const projectDisplayOrder = useMemo(() => {
    const order = {};
    priorityProjects.forEach((name, index) => {
      order[name] = index + 1;
    });
    return order;
  }, [priorityProjects]);

  // ============================================
  // FONCTIONS DE CALCUL
  // ============================================
  const calculatePrevisionJour = useCallback((objectifMensuel, dateRapport) => {
    if (!objectifMensuel || objectifMensuel <= 0) return 0;
    if (!dateRapport) return 0;
    const date = new Date(dateRapport);
    const jourActuel = date.getDate();
    const annee = date.getFullYear();
    const mois = date.getMonth();
    const nombreJoursDansMois = new Date(annee, mois + 1, 0).getDate();
    return (parseFloat(objectifMensuel) * jourActuel) / nombreJoursDansMois;
  }, []);

  const calculateRestantProjet = useCallback((donneeProjet, cumulAnnuel) => {
    return Math.max(0, parseFloat(donneeProjet || 0) - parseFloat(cumulAnnuel || 0));
  }, []);

  const calculateCumulAnnuel = useCallback((projetId, mesure, currentDate) => {
    const currentYear = new Date().getFullYear();
    return (Array.isArray(performances) ? performances : [])
      .filter(perf => {
        if (!perf) return false;
        const perfProjetId = perf.projet_id || perf.projet;
        const perfYear = perf.date_rapport ? getYear(parseISO(perf.date_rapport)) : null;
        return perfProjetId === projetId &&
          perf.mesure === mesure &&
          perfYear === currentYear &&
          perf.date_rapport !== currentDate;
      })
      .reduce((sum, perf) => sum + (parseFloat(perf.realisation_journee) || 0), 0);
  }, [performances]);

  // ============================================
  // FONCTIONS DE VÉRIFICATION DES PERMISSIONS
  // ============================================
  const canEdit = useCallback(() => {
    const allowedRoles = [
      'admin', 'Admin', 'ADMIN',
      'chef_projet', 'Chef Projet', 'chef-projet', 'Chef_Projet',
      'manager', 'Manager',
      'supervisor', 'Supervisor'
    ];
    return allowedRoles.includes(userRole);
  }, [userRole]);

  const isAdmin = useCallback(() => {
    const adminRoles = ['admin', 'Admin', 'ADMIN'];
    return adminRoles.includes(userRole);
  }, [userRole]);

  // ============================================
  // FONCTION POUR OBTENIR LES IDs DES PROJETS PRIORITAIRES
  // ============================================
  const getPriorityProjectIds = useCallback((projects) => {
    if (!projects || !projects.length) return [];
    
    const priorityIds = priorityProjects
      .map(name => {
        const project = projects.find(p => p.name === name);
        return project?.id?.toString();
      })
      .filter(id => id);
    
    return priorityIds;
  }, [priorityProjects]);

  // ============================================
  // FONCTIONS DE GESTION DES PROJETS
  // ============================================
  const handleProjectSelection = (projectId, isSelected) => {
    if (isSelected) {
      setTrackedProjects(prev => [...prev, projectId.toString()]);
    } else {
      setTrackedProjects(prev => prev.filter(id => id !== projectId.toString()));
    }
  };

  const selectAllProjects = () => {
    if (!Array.isArray(allProjects)) return;
    const allProjectIds = allProjects.map(p => p.id?.toString()).filter(id => id);
    setTrackedProjects(allProjectIds);
    addNotification("Tous les projets sélectionnés", 'info');
  };

  const clearAllProjects = () => {
    setTrackedProjects([]);
    addNotification("Tous les projets désélectionnés", 'info');
  };

  const resetToDefaultProjects = () => {
    if (!Array.isArray(allProjects)) return;
    const priorityIds = getPriorityProjectIds(allProjects);
    setTrackedProjects(priorityIds);
    localStorage.setItem('trackedProjects', JSON.stringify(priorityIds));
    addNotification("Projets prioritaires restaurés", 'info');
  };

  const addNewProject = async () => {
    if (!newProjectName.trim()) {
      addNotification("Veuillez entrer un nom de projet", 'warning');
      return;
    }
    setLoading(prev => ({ ...prev, submit: true }));
    try {
      const response = await api.post('/projets', {
        name: newProjectName.trim(),
        status: "en_cours",
        progress: 0
      });
      const newProject = response.data;
      setAllProjects(prev => [...prev, newProject]);
      setNewProjectName('');
      addNotification("Nouveau projet créé avec succès", 'success');
    } catch (error) {
      handleError(error, "Création du projet");
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  // ============================================
  // GESTION DES ERREURS
  // ============================================
  const handleError = useCallback((error, context) => {
    console.error(`Erreur dans ${context}:`, error);
    let errorMsg = "Une erreur est survenue";
    if (error.response) {
      if (error.response.status === 404) {
        errorMsg = "Service non trouvé. Vérifiez que l'API est accessible.";
      } else if (error.response.status === 403) {
        errorMsg = "Accès refusé. Vous n'avez pas les permissions nécessaires.";
      } else if (error.response.status === 422 && error.response.data.messages) {
        const validationErrors = Object.values(error.response.data.messages)
          .flat()
          .join(', ');
        errorMsg = `Validation échouée: ${validationErrors}`;
      } else if (error.response.status === 409) {
        errorMsg = "Doublon détecté: Cette performance existe déjà";
      } else {
        errorMsg = error.response.data?.message ||
          error.response.data?.error ||
          `Erreur ${error.response.status}`;
      }
    } else if (error.request) {
      errorMsg = "Pas de réponse du serveur. Vérifiez votre connexion.";
    } else {
      errorMsg = error.message;
    }
    addNotification(`${context}: ${errorMsg}`, 'danger');
  }, [addNotification]);

  // ============================================
  // CHARGEMENT DES DONNÉES
  // ============================================
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, projects: true }));
      const response = await api.get('/projets');
      const projects = extractData(response);
      setAllProjects(projects);
      setLoading(prev => ({ ...prev, projects: false }));
    } catch (error) {
      console.error('Erreur fetchProjects:', error);
      handleError(error, "Chargement des projets");
      setAllProjects([]);
      setLoading(prev => ({ ...prev, projects: false }));
    }
  }, [handleError]);

  const fetchPerformances = useCallback(async () => {
    try {
      const response = await api.get('/performances');
      const performancesData = extractData(response);
      setPerformances(performancesData);
      setLoading(prev => ({ ...prev, main: false }));
    } catch (error) {
      console.error('Erreur fetchPerformances:', error);
      handleError(error, "Chargement des performances");
      setPerformances([]);
      setLoading(prev => ({ ...prev, main: false }));
    }
  }, [handleError]);

  const refreshData = useCallback(async () => {
    setLoading(prev => ({ ...prev, main: true }));
    await Promise.all([fetchProjects(), fetchPerformances()]);
  }, [fetchProjects, fetchPerformances]);

  // ============================================
  // SUPPRESSION D'UNE PERFORMANCE
  // ============================================
  const handleDeletePerformance = (performance) => {
    if (!canEdit()) {
      addNotification("Seuls les administrateurs et chefs de projet peuvent supprimer des performances", 'warning');
      return;
    }
    setPerformanceToDelete(performance);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!performanceToDelete?.id) return;
    if (!canEdit()) {
      addNotification("Permission refusée", 'danger');
      setShowDeleteModal(false);
      return;
    }
    setLoading(prev => ({ ...prev, submit: true }));
    try {
      await api.delete(`/performances/${performanceToDelete.id}`);
      setPerformances(prev => prev.filter(perf => perf.id !== performanceToDelete.id));
      addNotification("Performance supprimée avec succès", 'success');
      setShowDeleteModal(false);
      setPerformanceToDelete(null);
    } catch (error) {
      handleError(error, "Suppression");
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  const getProjectName = useCallback((projectId) => {
    if (!projectId) return 'Projet inconnu';
    const project = (Array.isArray(allProjects) ? allProjects : []).find(p =>
      p && (p.id === projectId || p.id?.toString() === projectId?.toString())
    );
    return project ? (project.name || project.nom || `Projet ${projectId}`) : `Projet ${projectId}`;
  }, [allProjects]);

  // ============================================
  // EXPORT EXCEL AVEC COULEURS PAR PROJET
  // ============================================
 // ============================================
// FONCTION D'EXPORT EXCEL AVEC LE NOM DU PROJET SUR LA PREMIÈRE LIGNE UNIQUEMENT
// ============================================
const exportToExcel = () => {
  try {
    const today = new Date();
    const todayDisplay = format(today, 'dd/MM/yyyy');
    const monthDisplay = format(today, 'MMMM yyyy', { locale: fr });
    
    // Couleurs des projets
    const projectColors = {
      'RANL': '92C0E8',        // Bleu clair
      'V.NKTT2025': 'FCE4D6',   // Orange/beige clair
      'default': 'FFFFFF'
    };

    const getProjectColor = (projectName) => {
      if (!projectName) return projectColors.default;
      for (const [key, color] of Object.entries(projectColors)) {
        if (projectName.includes(key)) {
          return color;
        }
      }
      return projectColors.default;
    };
    
    // Récupérer les données uniques
    const uniquePerformances = {};
    (Array.isArray(performances) ? performances : []).forEach(perf => {
      if (!perf) return;
      const key = `${perf.projet_id || perf.projet}-${perf.mesure}`;
      if (!uniquePerformances[key] || new Date(uniquePerformances[key].date_rapport) < new Date(perf.date_rapport)) {
        uniquePerformances[key] = perf;
      }
    });

    // Grouper par projet
    const performancesByProject = {};
    Object.values(uniquePerformances).forEach(perf => {
      const projectId = perf.projet_id || perf.projet;
      if (!performancesByProject[projectId]) {
        performancesByProject[projectId] = [];
      }
      performancesByProject[projectId].push(perf);
    });

    // Créer le workbook
    const wb = XLSX.utils.book_new();
    const wsData = [];
    
    // Titre principal
    wsData.push([`Réalisations Mensuelles ${monthDisplay} en date: ${todayDisplay}`]);
    wsData.push([]);
    
    // En-têtes
    wsData.push([
      'Projet',
      'Mesure',
      'Réalisation',
      'Objectif/Mois',
      'Donnée Projet',
      'Prévision/Jour',
      'Restant Projet',
      'Cumul Réalisé'
    ]);

    // Données par projet
    let currentRow = 3;
    Object.entries(performancesByProject).forEach(([projectId, perfs]) => {
      const projectName = getProjectName(projectId);
      const color = getProjectColor(projectName);
      
      // Trier les mesures
      const sortedPerfs = perfs.sort((a, b) => {
        const orderA = predefinedMeasures.indexOf(a.mesure);
        const orderB = predefinedMeasures.indexOf(b.mesure);
        return orderA - orderB;
      });

      const firstDataRow = currentRow;
      
      // Ajouter les mesures
      sortedPerfs.forEach((perf, index) => {
        wsData.push([
          index === 0 ? projectName : '',
          perf.mesure || '',
          parseFloat(perf.realisation_journee || 0).toFixed(2),
          parseFloat(perf.objectif_mensuel || 0).toFixed(2),
          parseFloat(perf.donnee_projet || 0).toFixed(2),
          parseFloat(perf.prevision_jour || 0).toFixed(2),
          parseFloat(perf.restant_projet || 0).toFixed(2),
          parseFloat(perf.cumul_realise || 0).toFixed(2)
        ]);
        currentRow++;
      });

      // Total du projet
      const totalCumul = sortedPerfs.reduce((sum, p) => sum + (parseFloat(p.cumul_realise) || 0), 0);
      wsData.push([
        `Total ${projectName}`,
        '',
        '',
        '',
        '',
        '',
        '',
        totalCumul.toFixed(2)
      ]);
      currentRow++;
      
      wsData.push([]);
      currentRow++;
    });

    // Créer la feuille
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Largeurs des colonnes
    ws['!cols'] = [
      { wch: 20 }, { wch: 22 }, { wch: 15 }, { wch: 18 },
      { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }
    ];

    // Fusionner le titre
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }
    ];

    // Style du titre (bleu clair, gras)
    if (ws['A1']) {
      ws['A1'].s = {
        font: { bold: true, sz: 14, color: { rgb: '1F4E79' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        fill: { fgColor: { rgb: 'D9E2F3' } }
      };
    }

    // Style des en-têtes (blanc, gras, bordures)
    for (let c = 0; c <= 7; c++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 2, c });
      if (ws[cellAddress]) {
        ws[cellAddress].s = {
          font: { bold: true, color: { rgb: '000000' } },
          fill: { fgColor: { rgb: 'FFFFFF' } },
          alignment: { horizontal: 'left', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          }
        };
      }
    }

    // Appliquer les couleurs par projet
    currentRow = 3;
    Object.keys(performancesByProject).forEach((projectId) => {
      const projectName = getProjectName(projectId);
      const color = getProjectColor(projectName);
      const perfs = performancesByProject[projectId];
      const dataRowCount = perfs.length;
      
      // Fusionner les cellules du nom du projet
      if (dataRowCount > 0) {
        ws['!merges'].push({
          s: { r: currentRow, c: 0 },
          e: { r: currentRow + dataRowCount - 1, c: 0 }
        });
      }
      
      // Appliquer la couleur de fond à toutes les lignes du projet
      for (let r = currentRow; r < currentRow + dataRowCount; r++) {
        for (let c = 0; c <= 7; c++) {
          const cellAddress = XLSX.utils.encode_cell({ r, c });
          if (ws[cellAddress]) {
            ws[cellAddress].s = {
              fill: { fgColor: { rgb: color } },
              alignment: { 
                horizontal: (c === 0 || c === 1) ? 'left' : 'right', 
                vertical: 'center' 
              },
              border: {
                top: { style: 'thin', color: { rgb: '000000' } },
                bottom: { style: 'thin', color: { rgb: '000000' } },
                left: { style: 'thin', color: { rgb: '000000' } },
                right: { style: 'thin', color: { rgb: '000000' } }
              }
            };
          }
        }
      }
      
      // Style de la ligne de total (même couleur que le projet)
      const totalRow = currentRow + dataRowCount;
      for (let c = 0; c <= 7; c++) {
        const cellAddress = XLSX.utils.encode_cell({ r: totalRow, c });
        if (ws[cellAddress]) {
          ws[cellAddress].s = {
            fill: { fgColor: { rgb: color } },
            font: { bold: true, color: { rgb: '000000' } },
            alignment: { 
              horizontal: (c === 0 || c === 1) ? 'left' : 'right', 
              vertical: 'center' 
            },
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } }
            }
          };
        }
      }
      
      currentRow += dataRowCount + 2;
    });

    XLSX.utils.book_append_sheet(wb, ws, 'Synthèse');

    // Générer le fichier
    const fileName = `Performances_${format(today, 'ddMMyyyy')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    addNotification('✅ Export réussi', 'success');
    
  } catch (error) {
    handleError(error, "Export Excel");
  }
};
  // ============================================
  // CHARGEMENT DES SÉLECTIONS
  // ============================================
  useEffect(() => {
    const savedTrackedProjects = localStorage.getItem('trackedProjects');
    if (savedTrackedProjects) {
      try {
        const parsed = JSON.parse(savedTrackedProjects);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTrackedProjects(parsed);
        } else if (allProjects.length > 0) {
          const priorityIds = getPriorityProjectIds(allProjects);
          setTrackedProjects(priorityIds);
          localStorage.setItem('trackedProjects', JSON.stringify(priorityIds));
        }
      } catch (e) {
        console.error('Erreur parsing trackedProjects:', e);
        if (allProjects.length > 0) {
          const priorityIds = getPriorityProjectIds(allProjects);
          setTrackedProjects(priorityIds);
        }
      }
    } else if (allProjects.length > 0) {
      const priorityIds = getPriorityProjectIds(allProjects);
      setTrackedProjects(priorityIds);
      localStorage.setItem('trackedProjects', JSON.stringify(priorityIds));
    }
  }, [allProjects, getPriorityProjectIds]);

  // Sauvegarde des projets suivis
  useEffect(() => {
    if (trackedProjects.length > 0) {
      localStorage.setItem('trackedProjects', JSON.stringify(trackedProjects));
    }
  }, [trackedProjects]);

  // Sauvegarde des projets prioritaires
  useEffect(() => {
    localStorage.setItem('priorityProjects', JSON.stringify(priorityProjects));
  }, [priorityProjects]);

  // Filtrer les projets pour n'afficher que ceux suivis
  const filteredProjects = useMemo(() => {
    if (!Array.isArray(allProjects)) return [];
    return allProjects.filter(project =>
      project && trackedProjects.includes(project.id?.toString())
    );
  }, [allProjects, trackedProjects]);

  // ============================================
  // COMPOSANT SYNTHÈSE - getFilteredTableData
  // ============================================
  const getFilteredTableData = useCallback(() => {
    if (!Array.isArray(filteredProjects)) return [];
    
    // Calcul des cumuls
    const dailyData = {};
    const monthlyData = {};
    const yearlyData = {};
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    (Array.isArray(performances) ? performances : []).forEach(perf => {
      if (!perf) return;
      try {
        const date = perf.date_rapport ? parseISO(perf.date_rapport) : null;
        if (!date) return;
        const perfYear = getYear(date);
        const perfMonth = getMonth(date);
        const projetId = perf.projet_id || perf.projet;
        const mesure = perf.mesure;
        const value = parseFloat(perf.realisation_journee) || 0;
        if (!projetId || !mesure) return;
        if (!dailyData[projetId]) dailyData[projetId] = {};
        if (!monthlyData[projetId]) monthlyData[projetId] = {};
        if (!yearlyData[projetId]) yearlyData[projetId] = {};
        if (!dailyData[projetId][mesure]) dailyData[projetId][mesure] = 0;
        if (!monthlyData[projetId][mesure]) monthlyData[projetId][mesure] = 0;
        if (!yearlyData[projetId][mesure]) yearlyData[projetId][mesure] = 0;
        if (isToday(date)) {
          dailyData[projetId][mesure] += value;
        }
        if (perfYear === currentYear && perfMonth === currentMonth) {
          monthlyData[projetId][mesure] += value;
        }
        if (perfYear === currentYear) {
          yearlyData[projetId][mesure] += value;
        }
      } catch (error) {
        console.error('Erreur calcul cumul:', error);
      }
    });

    let filtered = filteredProjects;
    if (selectedProject !== 'all') {
      filtered = filtered.filter(p => p.id.toString() === selectedProject);
    }
    
    // Trier les projets selon l'ordre des prioritaires
    const sortedFiltered = [...filtered].sort((a, b) => {
      const orderA = projectDisplayOrder[a.name] || 999;
      const orderB = projectDisplayOrder[b.name] || 999;
      return orderA - orderB;
    });
    
    return sortedFiltered.map(project => {
      if (!project) return null;
      const projectId = project.id;
      const projectDaily = dailyData[projectId] || {};
      const projectMonthly = monthlyData[projectId] || {};
      const projectYearly = yearlyData[projectId] || {};
      const mesuresData = predefinedMeasures.map(mesure => {
        const performancesMesure = (Array.isArray(performances) ? performances : []).filter(
          perf => {
            if (!perf) return false;
            const perfProjetId = perf.projet_id || perf.projet;
            return perfProjetId === projectId && perf.mesure === mesure;
          }
        );
        if (searchTerm) {
          const mesureMatch = mesure.toLowerCase().includes(searchTerm.toLowerCase());
          const projetMatch = (project.name || project.nom || '').toLowerCase().includes(searchTerm.toLowerCase());
          if (!mesureMatch && !projetMatch) return null;
        }
        const dernierePerformance = performancesMesure.length > 0
          ? performancesMesure.reduce((latest, current) => {
              if (!latest) return current;
              if (!current) return latest;
              const latestDate = latest.date_rapport ? new Date(latest.date_rapport) : new Date(0);
              const currentDate = current.date_rapport ? new Date(current.date_rapport) : new Date(0);
              return currentDate > latestDate ? current : latest;
            })
          : null;
        return {
          mesure,
          performance: dernierePerformance,
          daily: projectDaily[mesure] || 0,
          monthly: projectMonthly[mesure] || 0,
          yearly: projectYearly[mesure] || 0,
          objectif_mensuel: dernierePerformance?.objectif_mensuel || 0,
          donnee_projet: dernierePerformance?.donnee_projet || 0,
          prevision_jour: dernierePerformance?.prevision_jour || 0,
          restant_projet: dernierePerformance?.restant_projet || 0,
          cumul_realise: dernierePerformance?.cumul_realise || 0,
          pourcentage_r_projet: dernierePerformance?.pourcentage_r_projet || 0,
        };
      }).filter(item => item !== null);
      
      if (mesuresData.length === 0) return null;
      
      return {
        project,
        mesuresData,
        totalDaily: Object.values(projectDaily).reduce((sum, val) => sum + val, 0),
        totalMonthly: Object.values(projectMonthly).reduce((sum, val) => sum + val, 0),
        totalYearly: Object.values(projectYearly).reduce((sum, val) => sum + val, 0),
        totalObjectif: mesuresData.reduce((sum, m) => sum + m.objectif_mensuel, 0),
        totalDonnee: mesuresData.reduce((sum, m) => sum + m.donnee_projet, 0),
        totalPrevision: mesuresData.reduce((sum, m) => sum + m.prevision_jour, 0),
        totalRestant: mesuresData.reduce((sum, m) => sum + m.restant_projet, 0),
        totalCumul: mesuresData.reduce((sum, m) => sum + m.cumul_realise, 0)
      };
    }).filter(item => item !== null);
  }, [filteredProjects, performances, predefinedMeasures, selectedProject, searchTerm, projectDisplayOrder]);

  // ============================================
  // COMPOSANT SYNTHÈSE
  // ============================================
  const SynthesisView = () => {
    const filteredTableData = getFilteredTableData();

    return (
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h6 className="mb-0">
              <FaChartBar className="me-2" />
              Synthèse Complète des Performances
            </h6>
            <div className="d-flex gap-2 flex-wrap">
              <Badge bg="light" text="dark" className="me-2">
                {(Array.isArray(performances) ? performances.length : 0)} enregistrements
              </Badge>
              <Button
                variant="success"
                size="sm"
                onClick={() => exportToExcel('all')}
                disabled={!Array.isArray(performances) || performances.length === 0}
              >
                <FaDownload className="me-1" />
                Excel avec couleurs
              </Button>
              <span className={`badge fs-6 py-1 px-2 ${
                isAdmin() ? 'bg-danger' : 
                canEdit() ? 'bg-success' : 'bg-secondary'
              }`}>
                {isAdmin() ? 'Admin' : canEdit() ? 'Chef Projet' : 'Lecture seule'}
              </span>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          {/* Filtres */}
          <Row className="mb-3 g-2">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Projet</Form.Label>
                <Form.Select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                >
                  <option value="all">Tous les projets</option>
                  {Array.isArray(filteredProjects) && filteredProjects.map(project => (
                    project && (
                      <option key={project.id} value={project.id}>
                        {project.name || project.nom || `Projet ${project.id}`}
                      </option>
                    )
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Recherche</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Projet ou mesure..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                </InputGroup>
              </Form.Group>
            </Col>
          </Row>

          {loading.main ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Chargement des données...</p>
            </div>
          ) : (!Array.isArray(performances) || performances.length === 0) ? (
            <div className="text-center my-5">
              <FaInfoCircle size={48} className="text-muted mb-3" />
              <h5>Aucune performance trouvée</h5>
              <p className="text-muted">Commencez par ajouter des performances.</p>
              {canEdit() && (
                <div className="mt-3">
                  <Button variant="success" onClick={() => navigate("/projet/ajoutProjet")}>
                    <FaPlus className="me-2" />
                    Ajouter réalisation
                  </Button>
                </div>
              )}
            </div>
          ) : (!Array.isArray(filteredProjects) || filteredProjects.length === 0) ? (
            <div className="text-center my-5">
              <FaList size={48} className="text-muted mb-3" />
              <h5>Aucun projet sélectionné</h5>
              <p className="text-muted">Veuillez sélectionner des projets à suivre.</p>
              <Button variant="primary" onClick={() => setShowProjectManager(true)}>
                <FaCog className="me-2" />
                Gérer les projets
              </Button>
            </div>
          ) : filteredTableData.length === 0 ? (
            <div className="text-center my-5">
              <FaSearch size={48} className="text-muted mb-3" />
              <h5>Aucun résultat trouvé</h5>
              <p className="text-muted">Aucune mesure ne correspond à votre recherche.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover className="align-middle">
                <thead className="table-dark">
                  <tr>
                    <th rowSpan="2" className="align-middle">Projet</th>
                    <th rowSpan="2" className="align-middle">Mesure</th>
                    <th colSpan="4" className="text-center">Objectifs et Données</th>
                    <th colSpan="3" className="text-center">Cumuls des Réalisations</th>
                    <th rowSpan="2" className="text-center align-middle">Progression</th>
                    <th rowSpan="2" className="text-center align-middle">Actions</th>
                  </tr>
                  <tr>
                    <th className="text-center">Prévision/Jour</th>
                    <th className="text-center">Objectif/Mois</th>
                    <th className="text-center">Restant</th>
                    <th className="text-center">Donnée Projet</th>
                    <th className="text-center">Journalier</th>
                    <th className="text-center">Mensuel</th>
                    <th className="text-center">Annuel</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTableData.map((data) => (
                    <React.Fragment key={data.project.id}>
                      {data.mesuresData.map((mesureData, idx) => (
                        <tr key={`${data.project.id}-${mesureData.mesure}`}>
                          {idx === 0 && (
                            <td rowSpan={data.mesuresData.length} className="align-middle">
                              <Badge bg="secondary" className="fs-6">{data.project.name || data.project.nom}</Badge>
                            </td>
                          )}
                          <td className="fw-bold">{mesureData.mesure}</td>
                          <td className="text-end">{parseFloat(mesureData.prevision_jour).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                          <td className="text-end fw-bold text-primary">
                            {parseFloat(mesureData.objectif_mensuel).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                          </td>
                          <td className="text-end">{parseFloat(mesureData.restant_projet).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                          <td className="text-end fw-bold text-success">
                            {parseFloat(mesureData.donnee_projet).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                          </td>
                          <td className="text-end fw-bold text-info">
                            {parseFloat(mesureData.daily).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="text-end fw-bold text-warning">
                            {parseFloat(mesureData.monthly).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="text-end fw-bold text-success">
                            {parseFloat(mesureData.yearly).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="text-center">
                            <Badge
                              bg={
                                mesureData.pourcentage_r_projet >= 80 ? 'success' :
                                  mesureData.pourcentage_r_projet >= 50 ? 'warning' : 'danger'
                              }
                              className="fs-6"
                            >
                              {parseFloat(mesureData.pourcentage_r_projet).toFixed(2)}%
                            </Badge>
                          </td>
                          <td className="text-center">
                            {canEdit() && mesureData.performance && (
                              <div className="d-flex justify-content-center gap-1">
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDeletePerformance(mesureData.performance)}
                                  title="Supprimer cette performance"
                                >
                                  <FaTrash />
                                </Button>
                              </div>
                            )}
                            {canEdit() && !mesureData.performance && (
                              <span className="text-muted small">Aucune donnée</span>
                            )}
                            {!canEdit() && (
                              <span className="text-muted small" title="Consultation seule">
                                <FaLock size={14} />
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                      <tr className="table-active fw-bold">
                        <td colSpan="2">Total {data.project.name || data.project.nom}</td>
                        <td className="text-end">{parseFloat(data.totalPrevision).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                        <td className="text-end">{parseFloat(data.totalObjectif).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                        <td className="text-end">{parseFloat(data.totalRestant).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                        <td className="text-end">{parseFloat(data.totalDonnee).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                        <td className="text-end text-info">{parseFloat(data.totalDaily).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="text-end text-warning">{parseFloat(data.totalMonthly).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="text-end text-success">{parseFloat(data.totalYearly).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td colSpan="2"></td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    );
  };

  // ============================================
  // MODAL DE GESTION DES PROJETS
  // ============================================
  const ProjectManagerModal = () => (
    <Modal show={showProjectManager} onHide={() => setShowProjectManager(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <FaList className="me-2" />
          Gestion des Projets Suivis
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {/* Section des projets prioritaires */}
        <Card className="mb-4 border-warning">
          <Card.Header className="bg-warning text-dark">
            <h6 className="mb-0">
              <FaStar className="me-2" />
              Projets Prioritaires
            </h6>
          </Card.Header>
          <Card.Body>
            {priorityProjects.length > 0 ? (
              <div className="d-flex flex-wrap gap-2">
                {priorityProjects.map(projectName => {
                  const project = allProjects.find(p => p.name === projectName);
                  return (
                    <Badge key={projectName} bg="warning" className="fs-6 p-2 text-dark" style={{ cursor: 'pointer' }}>
                      {projectName}
                      <FaTimes 
                        className="ms-2" 
                        style={{ cursor: 'pointer' }} 
                        onClick={() => {
                          removeFromPriority(projectName);
                          if (project && trackedProjects.includes(project.id.toString())) {
                            const newTracked = trackedProjects.filter(id => id !== project.id.toString());
                            setTrackedProjects(newTracked);
                            localStorage.setItem('trackedProjects', JSON.stringify(newTracked));
                          }
                        }}
                      />
                    </Badge>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted mb-0">Aucun projet prioritaire défini</p>
            )}
          </Card.Body>
        </Card>

        {/* Actions globales */}
        <Card className="mb-4">
          <Card.Header className="bg-light">
            <h6 className="mb-0">⚡ Actions Globales</h6>
          </Card.Header>
          <Card.Body>
            <div className="d-flex flex-wrap gap-2">
              <Button variant="success" size="sm" onClick={addNewProject} disabled={loading.submit}>
                <FaPlus className="me-1" />
                Nouveau projet
              </Button>
              <Button variant="outline-primary" size="sm" onClick={selectAllProjects}>
                <FaCheck className="me-1" />
                Tout sélectionner
              </Button>
              <Button variant="outline-secondary" size="sm" onClick={resetToDefaultProjects}>
                <FaSyncAlt className="me-1" />
                Projets prioritaires
              </Button>
              <Button variant="outline-danger" size="sm" onClick={clearAllProjects}>
                <FaTimes className="me-1" />
                Tout désélectionner
              </Button>
            </div>
          </Card.Body>
        </Card>

        {/* Liste des projets disponibles */}
        <Card>
          <Card.Header className="bg-light">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">📋 Projets Disponibles</h6>
              <Badge bg="primary">
                {trackedProjects.length} / {allProjects.length} suivis
              </Badge>
            </div>
          </Card.Header>
          <Card.Body>
            {Array.isArray(allProjects) && allProjects.length > 0 ? (
              <Row>
                {allProjects.map(project => {
                  const isPriority = priorityProjects.includes(project.name);
                  const isSelected = trackedProjects.includes(project.id.toString());
                  
                  return (
                    <Col md={6} key={project.id} className="mb-3">
                      <Card className={isSelected ? 'border-primary' : 'border-light'}>
                        <Card.Body className="py-2">
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="flex-grow-1">
                              <Form.Check
                                type="checkbox"
                                id={`project-${project.id}`}
                                label={
                                  <div>
                                    <div className="fw-bold">
                                      {project.name || project.nom}
                                      {isPriority && (
                                        <Badge bg="warning" className="ms-2" text="dark">
                                          <FaStar className="me-1" size={10} />
                                          Prioritaire
                                        </Badge>
                                      )}
                                    </div>
                                    <small className="text-muted">
                                      Statut: {project.status || 'Non défini'} |
                                      Progression: {project.progress || 0}%
                                    </small>
                                  </div>
                                }
                                checked={isSelected}
                                onChange={(e) => handleProjectSelection(project.id, e.target.checked)}
                              />
                            </div>
                            <div>
                              {!isPriority && (
                                <Button
                                  variant="outline-warning"
                                  size="sm"
                                  className="me-1"
                                  onClick={() => addToPriority(project.name, project.id)}
                                  title="Ajouter aux projets prioritaires"
                                >
                                  <FaRegStar />
                                </Button>
                              )}
                              {isPriority && (
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  className="me-1"
                                  onClick={() => removeFromPriority(project.name)}
                                  title="Retirer des projets prioritaires"
                                >
                                  <FaStar className="text-warning" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            ) : (
              <div className="text-center py-4">
                <FaInfoCircle size={48} className="text-muted mb-3" />
                <h5>Aucun projet disponible</h5>
                <Button variant="success" size="sm" onClick={addNewProject}>
                  <FaPlus className="me-1" /> Créer un projet
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Résumé de la sélection */}
        {trackedProjects.length > 0 && (
          <Card className="mt-3 bg-light">
            <Card.Body>
              <h6>🎯 Projets Actuellement Suivis</h6>
              <div className="d-flex flex-wrap gap-2 mt-2">
                {trackedProjects.map(projectId => {
                  const project = allProjects.find(p => p.id?.toString() === projectId);
                  const isPriority = project && priorityProjects.includes(project.name);
                  return project ? (
                    <Badge key={projectId} bg={isPriority ? "warning" : "success"} className="fs-6 p-2" text={isPriority ? "dark" : "white"}>
                      {project.name || project.nom}
                      {isPriority && <FaStar className="ms-1" size={10} />}
                    </Badge>
                  ) : null;
                })}
              </div>
            </Card.Body>
          </Card>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={() => setShowProjectManager(false)}>
          <FaCheck className="me-2" />
          Valider la sélection
        </Button>
      </Modal.Footer>
    </Modal>
  );

  // Chargement initial
  useEffect(() => {
    const initializeData = async () => {
      await refreshData();
    };
    initializeData();
  }, []);

  // Charger le rôle utilisateur
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        setUserLoading(true);
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUserRole(userData.role || userData.roles?.[0] || 'user');
          setUserLoading(false);
          return;
        }
        const token = localStorage.getItem('token');
        if (token) {
          const response = await fetch(`${API_BASE_URL}/user`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          });
          if (response.ok) {
            const userData = await response.json();
            const role = userData.role || userData.roles?.[0] || 'user';
            setUserRole(role);
            localStorage.setItem('user', JSON.stringify({
              id: userData.id,
              email: userData.email,
              role: role
            }));
          } else {
            setUserRole('user');
          }
        } else {
          setUserRole('user');
        }
      } catch (err) {
        console.error("Erreur récupération rôle:", err);
        setUserRole('user');
      } finally {
        setUserLoading(false);
      }
    };
    fetchUserRole();
  }, []);

  // ============================================
  // RENDU PRINCIPAL
  // ============================================
  if (userLoading) {
    return (
      <Container className="mt-4 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
        <p className="mt-3">Vérification des permissions...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <style>{`
        .form-control:focus {
          border-color: #0d6efd;
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
        }
        .form-control[readonly] {
          background-color: #f8f9fa;
          font-weight: bold;
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <Stack gap={2} className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1000 }}>
        {notifications.map(({ id, message, variant }) => (
          <Alert
            key={id}
            variant={variant}
            onClose={() => setNotifications(prev => prev.filter(n => n.id !== id))}
            dismissible
          >
            {message}
          </Alert>
        ))}
      </Stack>

      <Row className="g-4">
        <Col md={12}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-primary text-white">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <h5 className="mb-0 d-flex align-items-center">
                  <FaChartBar className="me-2" />
                  Analyse des Performances - Suivi Complet
                  <Badge bg="light" text="dark" className="ms-2">
                    {trackedProjects.length} projet(s) suivi(s)
                  </Badge>
                  <Badge bg="warning" text="dark" className="ms-2">
                    <FaStar className="me-1" size={12} />
                    {priorityProjects.length} prioritaire(s)
                  </Badge>
                </h5>
                <div className="d-flex gap-2">
                  <Button
                    variant="warning"
                    onClick={() => navigate("/projet/ajoutProjet")}
                    className="me-2"
                    style={{ color: 'white' }}
                  >
                    <FaPlus className="me-1" />
                    Ajouter des performances
                  </Button>
                  <Button
                    variant="outline-light"
                    onClick={() => setShowProjectManager(true)}
                    className="me-2"
                  >
                    <FaCog className="me-1" />
                    Gérer les Projets
                  </Button>
                  <Button
                    variant="light"
                    onClick={refreshData}
                    disabled={loading.main}
                    className="me-2"
                  >
                    <FaSyncAlt className={loading.main ? "spin" : ""} />
                    <span className="ms-2">Actualiser</span>
                  </Button>
                </div>
              </div>
            </Card.Header>
          </Card>

          <ProjectManagerModal />
          <SynthesisView />
        </Col>
      </Row>

      {/* Modale de suppression */}
      <Modal show={showDeleteModal} onHide={() => !loading.submit && setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaTrash className="me-2" />
            Confirmer la suppression
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {performanceToDelete && (
            <div>
              <p>Êtes-vous sûr de vouloir supprimer la performance :</p>
              <p><strong>{getProjectName(performanceToDelete.projet_id || performanceToDelete.projet)} - {performanceToDelete.mesure}</strong></p>
              <p><strong>Date:</strong> {performanceToDelete.date_rapport}</p>
              <p className="text-danger">Cette action est irréversible !</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={loading.submit}
          >
            Annuler
          </Button>
          <Button
            variant="danger"
            onClick={confirmDelete}
            disabled={loading.submit}
          >
            {loading.submit ? (
              <>
                <Spinner size="sm" animation="border" className="me-2" />
                Suppression...
              </>
            ) : 'Confirmer la suppression'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AnalysePerformances;