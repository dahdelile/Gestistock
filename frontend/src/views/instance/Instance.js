import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table, Button, Spinner,
  Badge, Form, Modal, Toast, ToastContainer,
  Alert, Row, Col, ProgressBar, Tabs, Tab, Pagination
} from 'react-bootstrap';
import {
  FaCalendarAlt, FaProjectDiagram, FaTasks, FaClock,
  FaPlus, FaEdit, FaTrash, FaSyncAlt, FaInfoCircle,
  FaFilter, FaLock, FaLockOpen, FaArchive, FaCheckCircle,
  FaPlayCircle, FaChartBar, FaList, FaChartPie, FaUserShield, FaUser
} from 'react-icons/fa';
import { format, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

// ============================================
// GESTION DES VARIABLES D'ENVIRONNEMENT - PRODUCTION
// ============================================
const API_BASE_URL = 'https://intranet-attm.com/api';
const APP_URL = 'https://intranet-attm.com';
const INSTANCES_URL = `${API_BASE_URL}/instances`;
const PROJETS_URL = `${API_BASE_URL}/projets`;
const AUTH_API_URL = 'https://intranet-attm.com/api';
const APP_VERSION = '2.0.0';

// ============================================
// FONCTION POUR LES REQUÊTES AVEC TOKEN
// ============================================
const fetchWithToken = async (url, options = {}) => {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
  const defaultOptions = {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Application-Version': APP_VERSION
    },
  };
  if (options.body instanceof FormData) {
    delete defaultOptions.headers['Content-Type'];
  }
  try {
    console.log(`🌐 Tentative de fetch: ${url}`);
    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    });
    console.log(`📡 Réponse de ${url}:`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    if (!response.ok) {
      let errorMessage = `Erreur HTTP: ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('❌ Détails erreur:', errorData);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        const text = await response.text();
        if (text) console.error('❌ Réponse non-JSON:', text.substring(0, 200));
      }
      throw new Error(errorMessage);
    }
    return response;
  } catch (error) {
    console.error('❌ Erreur fetch:', error);
    throw error;
  }
};

// Configuration des pôles et sous-directions
const POLES_DIRECTION = {
  'DG': 'DG',
  'DPMM': 'DPMM',
  'DPAF': 'DPAF',
  'DPOP': 'DPOP',
  'SNIM': 'SNIM'
};

const SOUS_DIRECTIONS = {
  'DPMM': [
    { value: 'DAA', label: 'DAA' },
    { value: 'DM', label: 'DM' },
    { value: 'DU', label: 'DU' }
  ],
  'DPAF': [
    { value: 'DCG', label: 'DCG' },
    { value: 'DRH', label: 'DRH' },
    { value: 'DFC', label: 'DFC' }
  ],
  'SNIM': [
    { value: 'GCFDK', label: 'GCFDK' }
  ],
  'DG': [
    { value: 'DG', label: 'Direction Générale' }
  ],
  'DPOP': [
    { value: 'DEP', label: 'DEP' },
    { value: 'DTBGC', label: 'DTBGC' },
    { value: 'DTR', label: 'DTR' }
  ]
};

const ZONES = [
  { value: 'EST', label: 'EST' },
  { value: 'NKTT', label: 'NKTT' },
  { value: 'NORD', label: 'NORD' },
  { value: 'SIEGE', label: 'SIEGE' },
  { value: 'NDB', label: 'NDB' },
  { value: 'AUTRE', label: 'AUTRE' }
];

const GestionInstances = () => {
  // ============================================
  // GESTION DES RÔLES UTILISATEUR - admin seulement
  // ============================================
  const [userRole, setUserRole] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const isAdmin = useCallback(() => userRole === 'admin', [userRole]);
  const canEdit = useCallback(() => isAdmin(), [userRole]);
  const canDelete = useCallback(() => isAdmin(), [userRole]);
  const canAdd = useCallback(() => isAdmin(), [userRole]);
  const canFermer = useCallback(() => isAdmin(), [userRole]);
  const canOuvrir = useCallback(() => isAdmin(), [userRole]);

  // États principaux
  const [instancesActives, setInstancesActives] = useState([]);
  const [instancesFermees, setInstancesFermees] = useState([]);
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('actives');
  const [filters, setFilters] = useState({
    projet: '', pole: '', sousDirection: '', zone: ''
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFermerModal, setShowFermerModal] = useState(false);
  const [showOuvrirModal, setShowOuvrirModal] = useState(false);
  const [currentInstance, setCurrentInstance] = useState({
    id: null,
    date: new Date().toISOString().split('T')[0],
    projet_id: '',
    designation_instance: '',
    direction_poles: '',
    sous_direction: '',
    zone: '',
    delai: 30,
    pourcentage_avancement: 0,
    avancement: '',
    commentaires: ''
  });
  const [instanceToDelete, setInstanceToDelete] = useState(null);
  const [instanceToFermer, setInstanceToFermer] = useState(null);
  const [instanceToOuvrir, setInstanceToOuvrir] = useState(null);
  const [sousDirectionsDisponibles, setSousDirectionsDisponibles] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [toasts, setToasts] = useState([]);

  // ============================================
  // PAGINATION
  // ============================================
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10
  });
  const itemsPerPageOptions = [5, 10, 25, 50, 100];

  // ============================================
  // FONCTIONS DE TRAITEMENT DES DONNÉES API
  // ============================================
  const extractDataFromResponse = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.data && Array.isArray(data.data)) return data.data;
    if (data.success && data.data && Array.isArray(data.data)) return data.data;
    if (typeof data === 'object') {
      for (let key in data) {
        if (Array.isArray(data[key])) return data[key];
      }
      if (data.id) return [data];
    }
    return [];
  };

  const getProjetName = useCallback((instance) => {
    if (!instance) return 'Non affecté';
    if (instance.projet_id) {
      const projet = projets.find(p => p && p.id === instance.projet_id);
      return projet ? projet.name : `Projet #${instance.projet_id}`;
    }
    return 'Non affecté';
  }, [projets]);

  const getSousDirectionLabel = useCallback((pole, sousDirection) => {
    if (!sousDirection) return 'Non spécifiée';
    const sousDirs = SOUS_DIRECTIONS[pole] || [];
    const found = sousDirs.find(sd => sd.value === sousDirection);
    return found ? found.label : sousDirection;
  }, []);

  const getZoneLabel = useCallback((zoneValue) => {
    if (!zoneValue) return 'Non spécifiée';
    const zone = ZONES.find(z => z.value === zoneValue);
    return zone ? zone.label : zoneValue;
  }, []);

  const formatDisplayDate = useCallback((dateString) => {
    if (!dateString) return 'Non spécifiée';
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, 'dd/MM/yyyy', { locale: fr }) : dateString;
    } catch {
      return dateString;
    }
  }, []);

  const showToast = useCallback((message, variant = 'success') => {
    const newToast = { id: Date.now(), message, variant };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 5000);
  }, []);

  const fetchUserRole = useCallback(async () => {
    try {
      setUserLoading(true);
      setAuthError(null);
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          const role = userData.role || userData.roles?.[0] || 'user';
          setUserRole(role);
          setUserLoading(false);
          return;
        } catch (e) {
          console.error("Erreur parsing user:", e);
        }
      }
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!token) {
        setUserRole('user');
        setUserLoading(false);
        return;
      }
      const response = await fetch(`${AUTH_API_URL}/user`, {
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
          name: userData.name,
          role: role
        }));
      } else {
        setUserRole('user');
      }
    } catch (err) {
      console.error('Erreur récupération rôle:', err);
      setAuthError('Impossible de vérifier les permissions');
      setUserRole('user');
    } finally {
      setUserLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const headers = {
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept': 'application/json'
      };
      console.log('🔍 Chargement des données...');
      const [instancesRes, projetsRes] = await Promise.allSettled([
        fetch(INSTANCES_URL, { headers }),
        fetch(PROJETS_URL, { headers })
      ]);
      let instancesData = [];
      let projetsData = [];
      if (instancesRes.status === 'fulfilled' && instancesRes.value.ok) {
        const data = await instancesRes.value.json();
        instancesData = extractDataFromResponse(data);
        console.log('✅ Instances chargées:', instancesData.length);
      } else {
        console.error('❌ Erreur chargement instances:', instancesRes);
      }
      if (projetsRes.status === 'fulfilled' && projetsRes.value.ok) {
        const data = await projetsRes.value.json();
        projetsData = extractDataFromResponse(data);
        console.log('✅ Projets chargés:', projetsData.length);
      } else {
        console.error('❌ Erreur chargement projets:', projetsRes);
      }
      setProjets(projetsData);
      const toutesInstances = instancesData.map(instance => ({
        ...instance,
        est_en_retard: instance.date_echeance && new Date(instance.date_echeance) < new Date()
      }));
      const actives = toutesInstances.filter(instance => !instance.ferme);
      const fermees = toutesInstances.filter(instance => instance.ferme);
      setInstancesActives(actives);
      setInstancesFermees(fermees);
      if (instancesData.length > 0) {
        showToast('Données chargées avec succès', 'success');
      }
    } catch (err) {
      console.error('❌ Erreur refreshData:', err);
      setError(err.message || "Erreur lors du chargement");
      showToast(err.message || "Erreur lors du chargement", 'danger');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const initialize = async () => {
      await fetchUserRole();
      await refreshData();
    };
    initialize();
  }, [fetchUserRole, refreshData]);

  useEffect(() => {
    if (currentInstance.direction_poles) {
      const sousDirs = SOUS_DIRECTIONS[currentInstance.direction_poles] || [];
      setSousDirectionsDisponibles(sousDirs);
      if (currentInstance.sous_direction && !sousDirs.find(sd => sd.value === currentInstance.sous_direction)) {
        setCurrentInstance(prev => ({ ...prev, sous_direction: '' }));
      }
    } else {
      setSousDirectionsDisponibles([]);
    }
  }, [currentInstance.direction_poles]);

  const statistiquesParDirection = useMemo(() => {
    const stats = {
      'DG': { ouvert: 0, ferme: 0, total: 0 },
      'DPOP': { ouvert: 0, ferme: 0, total: 0 },
      'DPMM': { ouvert: 0, ferme: 0, total: 0 },
      'DPAF': { ouvert: 0, ferme: 0, total: 0 },
      'SNIM': { ouvert: 0, ferme: 0, total: 0 }
    };
    instancesActives.forEach(instance => {
      if (stats[instance.direction_poles]) {
        stats[instance.direction_poles].ouvert++;
        stats[instance.direction_poles].total++;
      }
    });
    instancesFermees.forEach(instance => {
      if (stats[instance.direction_poles]) {
        stats[instance.direction_poles].ferme++;
        stats[instance.direction_poles].total++;
      }
    });
    const result = Object.entries(stats).map(([direction, data]) => {
      const pourcentage = data.total > 0 ? Math.round((data.ferme / data.total) * 100) : 0;
      return {
        direction,
        ouvert: data.ouvert,
        ferme: data.ferme,
        total: data.total,
        pourcentage
      };
    });
    const totalOuvert = result.reduce((sum, item) => sum + item.ouvert, 0);
    const totalFerme = result.reduce((sum, item) => sum + item.ferme, 0);
    const totalGeneral = totalOuvert + totalFerme;
    const pourcentageTotal = totalGeneral > 0 ? Math.round((totalFerme / totalGeneral) * 100) : 0;
    result.push({
      direction: 'Total',
      ouvert: totalOuvert,
      ferme: totalFerme,
      total: totalGeneral,
      pourcentage: pourcentageTotal
    });
    return result;
  }, [instancesActives, instancesFermees]);

  // ============================================
  // GESTION DES ACTIONS
  // ============================================
  const handleAddInstance = () => {
    if (!canAdd()) {
      showToast("Seuls les administrateurs peuvent ajouter des instances", 'warning');
      return;
    }
    setCurrentInstance({
      id: null,
      date: new Date().toISOString().split('T')[0],
      projet_id: '',
      designation_instance: '',
      direction_poles: '',
      sous_direction: '',
      zone: '',
      delai: 30,
      pourcentage_avancement: 0,
      avancement: '',
      commentaires: ''
    });
    setShowAddModal(true);
  };

  const handleEditInstance = (instance) => {
    if (!canEdit()) {
      showToast("Seuls les administrateurs peuvent modifier des instances", 'warning');
      return;
    }
    if (instance.ferme) {
      showToast("Impossible de modifier une instance fermée", 'warning');
      return;
    }
    setCurrentInstance({
      id: instance.id,
      date: instance.date,
      projet_id: instance.projet_id || '',
      designation_instance: instance.designation_instance,
      direction_poles: instance.direction_poles,
      sous_direction: instance.sous_direction || '',
      zone: instance.zone || '',
      delai: instance.delai,
      pourcentage_avancement: instance.pourcentage_avancement || 0,
      avancement: instance.avancement || '',
      commentaires: instance.commentaires || ''
    });
    setShowEditModal(true);
  };

  const handleDeleteInstance = (instance) => {
    if (!canDelete()) {
      showToast("Seuls les administrateurs peuvent supprimer des instances", 'warning');
      return;
    }
    setInstanceToDelete(instance);
    setShowDeleteModal(true);
  };

  const handleFermerInstance = (instance) => {
    if (!canFermer()) {
      showToast("Seuls les administrateurs peuvent fermer des instances", 'warning');
      return;
    }
    if (!instance || !instance.id) {
      showToast("Erreur: Instance invalide", 'danger');
      return;
    }
    setInstanceToFermer(instance);
    setShowFermerModal(true);
  };

  const handleOuvrirInstance = (instance) => {
    if (!canOuvrir()) {
      showToast("Seuls les administrateurs peuvent rouvrir des instances", 'warning');
      return;
    }
    if (!instance || !instance.id) {
      showToast("Erreur: Instance invalide", 'danger');
      return;
    }
    setInstanceToOuvrir(instance);
    setShowOuvrirModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentInstance(prev => ({ ...prev, [name]: value }));
  };

  const confirmFermer = async () => {
    if (!canFermer()) {
      showToast("Action non autorisée", 'danger');
      return;
    }
    if (!instanceToFermer || !instanceToFermer.id) {
      showToast('Erreur: Instance non valide', 'danger');
      return;
    }
    try {
      setIsUpdating(true);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const response = await fetch(`${INSTANCES_URL}/${instanceToFermer.id}/fermer`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Accès refusé. Vous n'avez pas les permissions nécessaires.");
        }
        const data = await response.json();
        throw new Error(data.error || data.message || 'Erreur lors de la fermeture');
      }
      const data = await response.json();
      showToast("Instance fermée avec succès");
      const instanceFermee = data.instance || data;
      setInstancesActives(prev => prev.filter(inst => inst.id !== instanceFermee.id));
      setInstancesFermees(prev => [...prev, instanceFermee]);
      setShowFermerModal(false);
      setInstanceToFermer(null);
    } catch (err) {
      console.error('Erreur fermeture:', err);
      showToast(err.message, 'danger');
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmOuvrir = async () => {
    if (!canOuvrir()) {
      showToast("Action non autorisée", 'danger');
      return;
    }
    if (!instanceToOuvrir || !instanceToOuvrir.id) {
      showToast('Erreur: Instance non valide', 'danger');
      return;
    }
    try {
      setIsUpdating(true);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const response = await fetch(`${INSTANCES_URL}/${instanceToOuvrir.id}/ouvrir`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Accès refusé. Vous n'avez pas les permissions nécessaires.");
        }
        const data = await response.json();
        throw new Error(data.error || data.message || 'Erreur lors de l\'ouverture');
      }
      const data = await response.json();
      showToast("Instance rouverte avec succès");
      const instanceOuverte = data.instance || data;
      setInstancesFermees(prev => prev.filter(inst => inst.id !== instanceOuverte.id));
      setInstancesActives(prev => [...prev, instanceOuverte]);
      setShowOuvrirModal(false);
      setInstanceToOuvrir(null);
    } catch (err) {
      console.error('Erreur ouverture:', err);
      showToast(err.message, 'danger');
    } finally {
      setIsUpdating(false);
    }
  };

  const submitInstance = async () => {
    if (!canAdd() && !currentInstance.id) {
      showToast("Action non autorisée. Vous n'avez pas les permissions nécessaires.", 'danger');
      return;
    }
    if (!currentInstance.designation_instance.trim()) {
      showToast("La désignation de l'instance est obligatoire", 'warning');
      return;
    }
    if (!currentInstance.direction_poles) {
      showToast("Le pôle de direction est obligatoire", 'warning');
      return;
    }
    if (!currentInstance.zone) {
      showToast("La zone est obligatoire", 'warning');
      return;
    }
    try {
      setIsUpdating(true);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const dateEcheance = new Date(currentInstance.date);
      dateEcheance.setDate(dateEcheance.getDate() + parseInt(currentInstance.delai || 30));
      const instanceData = {
        date: currentInstance.date,
        projet_id: currentInstance.projet_id ? parseInt(currentInstance.projet_id) : null,
        designation_instance: currentInstance.designation_instance.trim(),
        direction_poles: currentInstance.direction_poles,
        sous_direction: currentInstance.sous_direction || null,
        zone: currentInstance.zone,
        delai: parseInt(currentInstance.delai) || 30,
        date_echeance: dateEcheance.toISOString().split('T')[0],
        pourcentage_avancement: parseInt(currentInstance.pourcentage_avancement) || 0,
        avancement: currentInstance.avancement?.trim() || 'En cours',
        commentaires: currentInstance.commentaires?.trim() || null,
        ferme: false
      };
      console.log('📤 Données envoyées:', instanceData);
      let response;
      if (currentInstance.id) {
        response = await fetch(`${INSTANCES_URL}/${currentInstance.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(instanceData)
        });
      } else {
        response = await fetch(INSTANCES_URL, {
          method: 'POST',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(instanceData)
        });
      }
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Accès refusé. Vous n'avez pas les permissions nécessaires.");
        }
        if (response.status === 422) {
          const data = await response.json();
          console.error('❌ Erreurs de validation:', data);
          let errorMessage = 'Erreurs de validation :\n';
          if (data.messages || data.errors) {
            const errors = data.messages || data.errors;
            Object.keys(errors).forEach(field => {
              errorMessage += `• ${field}: ${errors[field].join ? errors[field].join(', ') : errors[field]}\n`;
            });
          } else if (data.error) {
            errorMessage = data.error;
          }
          throw new Error(errorMessage);
        }
        const data = await response.json();
        throw new Error(data.error || data.message || 'Erreur lors de l\'enregistrement');
      }
      const data = await response.json();
      showToast(currentInstance.id ? "Instance modifiée avec succès" : "Instance ajoutée avec succès");
      await refreshData();
      setShowAddModal(false);
      setShowEditModal(false);
    } catch (err) {
      console.error('Erreur soumission:', err);
      showToast(err.message, 'danger');
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmDelete = async () => {
    if (!canDelete()) {
      showToast("Action non autorisée", 'danger');
      return;
    }
    if (!instanceToDelete || !instanceToDelete.id) {
      showToast('Erreur: Instance non valide', 'danger');
      return;
    }
    try {
      setIsUpdating(true);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const response = await fetch(`${INSTANCES_URL}/${instanceToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'application/json'
        }
      });
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Accès refusé. Vous n'avez pas les permissions nécessaires.");
        }
        const data = await response.json();
        throw new Error(data.error || data.message || 'Erreur lors de la suppression');
      }
      showToast("Instance supprimée avec succès");
      if (instanceToDelete.ferme) {
        setInstancesFermees(prev => prev.filter(inst => inst.id !== instanceToDelete.id));
      } else {
        setInstancesActives(prev => prev.filter(inst => inst.id !== instanceToDelete.id));
      }
      setShowDeleteModal(false);
      setInstanceToDelete(null);
    } catch (err) {
      console.error('Erreur suppression:', err);
      showToast(err.message, 'danger');
    } finally {
      setIsUpdating(false);
    }
  };

  // Filtrage
  const filteredInstancesActives = instancesActives.filter(instance => {
    const projetId = instance.projet_id;
    return (!filters.projet || projetId === parseInt(filters.projet)) &&
      (!filters.pole || instance.direction_poles === filters.pole) &&
      (!filters.zone || instance.zone === filters.zone) &&
      (!filters.sousDirection || instance.sous_direction === filters.sousDirection);
  });
  const filteredInstancesFermees = instancesFermees.filter(instance => {
    const projetId = instance.projet_id;
    return (!filters.projet || projetId === parseInt(filters.projet)) &&
      (!filters.pole || instance.direction_poles === filters.pole) &&
      (!filters.zone || instance.zone === filters.zone) &&
      (!filters.sousDirection || instance.sous_direction === filters.sousDirection);
  });

  // ============================================
  // PAGINATION
  // ============================================
  const getPaginatedInstances = (instances) => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    return instances.slice(startIndex, startIndex + pagination.itemsPerPage);
  };
  const getTotalPages = (instances) => {
    return Math.ceil(instances.length / pagination.itemsPerPage);
  };
  const paginatedActives = useMemo(() => getPaginatedInstances(filteredInstancesActives),
    [filteredInstancesActives, pagination.currentPage, pagination.itemsPerPage]);
  const paginatedFermees = useMemo(() => getPaginatedInstances(filteredInstancesFermees),
    [filteredInstancesFermees, pagination.currentPage, pagination.itemsPerPage]);
  const totalPagesActives = getTotalPages(filteredInstancesActives);
  const totalPagesFermees = getTotalPages(filteredInstancesFermees);
  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };
  const handleItemsPerPageChange = (e) => {
    setPagination({
      currentPage: 1,
      itemsPerPage: parseInt(e.target.value)
    });
  };

  const statistiquesGlobales = {
    totalActives: instancesActives.length,
    enRetard: instancesActives.filter(i => i.est_en_retard).length,
    totalFermees: instancesFermees.length,
    totalGeneral: instancesActives.length + instancesFermees.length
  };

  // ============================================
  // COMPOSANTS INTERNES
  // ============================================
  const TableRow = ({ instance, isFermee }) => {
    const projetName = useMemo(() => getProjetName(instance), [instance, getProjetName]);
    return (
      <tr className={isFermee ? 'table-warning' : ''}>
        <td style={{ whiteSpace: 'nowrap' }}>
          <FaCalendarAlt className="me-2 text-muted" />
          {formatDisplayDate(instance.date)}
        </td>
        <td>
          <FaProjectDiagram className="me-2 text-muted" />
          {projetName}
        </td>
        <td>
          <Badge bg="info">{getZoneLabel(instance.zone)}</Badge>
        </td>
        <td>{instance.designation_instance}</td>
        <td>
          <Badge bg="secondary">{instance.direction_poles}</Badge>
        </td>
        <td>
          {instance.sous_direction ? (
            <Badge bg="info">
              {getSousDirectionLabel(instance.direction_poles, instance.sous_direction)}
            </Badge>
          ) : (
            <span className="text-muted">-</span>
          )}
        </td>
        <td style={{ whiteSpace: 'nowrap' }}>
          {instance.date_echeance ? (
            <div>
              <FaClock className="me-1 text-muted" />
              {formatDisplayDate(instance.date_echeance)}
              {instance.est_en_retard && !isFermee && (
                <Badge bg="danger" className="ms-1">Retard</Badge>
              )}
            </div>
          ) : (
            <span className="text-muted">-</span>
          )}
        </td>
        <td style={{ maxWidth: '300px', minWidth: '200px' }}>
          {instance.avancement && (
            <div className="text-muted" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {instance.avancement}
            </div>
          )}
        </td>
        <td style={{ maxWidth: '300px', minWidth: '200px' }}>
          {instance.commentaires && (
            <div className="text-muted" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {instance.commentaires}
            </div>
          )}
        </td>
        <td style={{ whiteSpace: 'nowrap' }}>
          {isFermee ? (
            <div>
              <Badge bg="success" className="me-1">
                <FaCheckCircle className="me-1" />
                Terminé
              </Badge>
              <Badge bg="warning">
                <FaLock className="me-1" />
                Fermée
              </Badge>
            </div>
          ) : (
            <Badge bg="primary">
              <FaTasks className="me-1" />
              En cours
            </Badge>
          )}
        </td>
        <td style={{ whiteSpace: 'nowrap' }}>
          <div className="d-flex gap-2">
            {!isFermee ? (
              <>
                {canEdit() ? (
                  <Button
                    variant="outline-warning"
                    size="sm"
                    onClick={() => handleEditInstance(instance)}
                    title="Modifier"
                  >
                    <FaEdit />
                  </Button>
                ) : (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    disabled
                    title="Modification réservée aux administrateurs"
                  >
                    <FaLock />
                  </Button>
                )}
                {canFermer() ? (
                  <Button
                    variant="outline-success"
                    size="sm"
                    onClick={() => handleFermerInstance(instance)}
                    title="Fermer l'instance"
                  >
                    <FaCheckCircle />
                  </Button>
                ) : (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    disabled
                    title="Fermeture réservée aux administrateurs"
                  >
                    <FaLock />
                  </Button>
                )}
                {canDelete() ? (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDeleteInstance(instance)}
                    title="Supprimer"
                  >
                    <FaTrash />
                  </Button>
                ) : (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    disabled
                    title="Suppression réservée aux administrateurs"
                  >
                    <FaLock />
                  </Button>
                )}
              </>
            ) : (
              <>
                {canOuvrir() ? (
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handleOuvrirInstance(instance)}
                    title="Rouvrir l'instance"
                  >
                    <FaPlayCircle />
                  </Button>
                ) : (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    disabled
                    title="Ouverture réservée aux administrateurs"
                  >
                    <FaLock />
                  </Button>
                )}
                {canDelete() ? (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDeleteInstance(instance)}
                    title="Supprimer"
                  >
                    <FaTrash />
                  </Button>
                ) : (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    disabled
                    title="Suppression réservée aux administrateurs"
                  >
                    <FaLock />
                  </Button>
                )}
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  const PaginationControls = ({ totalPages, currentPage, onPageChange, totalItems }) => (
    <div className="d-flex justify-content-between align-items-center mt-3">
      <div className="d-flex align-items-center gap-3">
        <Form.Select
          size="sm"
          value={pagination.itemsPerPage}
          onChange={handleItemsPerPageChange}
          style={{ width: 'auto' }}
        >
          {itemsPerPageOptions.map(opt => (
            <option key={opt} value={opt}>{opt} par page</option>
          ))}
        </Form.Select>
        <span className="text-muted small">
          Total: {totalItems} élément(s)
        </span>
      </div>
      {totalPages > 1 && (
        <Pagination size="sm">
          <Pagination.First
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
          />
          <Pagination.Prev
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          />
          {[...Array(totalPages)].map((_, i) => {
            const pageNum = i + 1;
            if (
              pageNum === 1 ||
              pageNum === totalPages ||
              (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
            ) {
              return (
                <Pagination.Item
                  key={pageNum}
                  active={pageNum === currentPage}
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </Pagination.Item>
              );
            } else if (
              pageNum === currentPage - 3 ||
              pageNum === currentPage + 3
            ) {
              return <Pagination.Ellipsis key={pageNum} disabled />;
            }
            return null;
          })}
          <Pagination.Next
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          />
          <Pagination.Last
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
          />
        </Pagination>
      )}
    </div>
  );

  const InstanceTable = ({ instances, isFermee = false, totalItems }) => {
    const currentTotalPages = isFermee ? totalPagesFermees : totalPagesActives;
    return (
      <div>
        <div className="table-responsive">
          <Table
            striped
            bordered
            hover
            className="bg-white text-dark"
            style={{ backgroundColor: '#ffffff', color: '#000000' }}
          >
            <thead className="table-info">
              <tr>
                <th style={{ whiteSpace: 'nowrap' }}>Date</th>
                <th style={{ whiteSpace: 'nowrap' }}>Projet</th>
                <th style={{ whiteSpace: 'nowrap' }}>Zone</th>
                <th>Désignation</th>
                <th style={{ whiteSpace: 'nowrap' }}>Pôle</th>
                <th style={{ whiteSpace: 'nowrap' }}>Direction</th>
                <th style={{ whiteSpace: 'nowrap' }}>Échéance</th>
                <th style={{ minWidth: '200px' }}>Avancement</th>
                <th style={{ minWidth: '200px' }}>Observation</th>
                <th style={{ whiteSpace: 'nowrap' }}>Statut</th>
                <th style={{ whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {instances.length > 0 ? (
                instances.map(instance => (
                  <TableRow key={instance.id} instance={instance} isFermee={isFermee} />
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="text-center text-muted py-4">
                    <FaInfoCircle className="me-2" />
                    {isFermee ? 'Aucune instance fermée' : 'Aucune instance active'}
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
        <PaginationControls
          totalPages={currentTotalPages}
          currentPage={pagination.currentPage}
          onPageChange={handlePageChange}
          totalItems={totalItems}
        />
      </div>
    );
  };

  const StatistiquesTable = () => (
    <div className="border rounded shadow-sm bg-white">
      <div className="bg-info text-white p-3 rounded-top">
        <h6 className="mb-0 d-flex align-items-center">
          <FaChartBar className="me-2" />
          Tableau de Bord par Direction
        </h6>
      </div>
      <div className="p-3">
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead className="table-dark">
              <tr>
                <th>Direction</th>
                <th className="text-center">Instances Ouvertes</th>
                <th className="text-center">Instances Fermées</th>
                <th className="text-center">Total</th>
                <th className="text-center">Taux de Fermeture</th>
              </tr>
            </thead>
            <tbody>
              {statistiquesParDirection.map((stat, index) => (
                <tr
                  key={stat.direction}
                  className={stat.direction === 'Total' ? 'table-warning fw-bold' : ''}
                >
                  <td>
                    {stat.direction === 'Total' ? (
                      <strong>{stat.direction}</strong>
                    ) : (
                      stat.direction
                    )}
                  </td>
                  <td className="text-center">
                    <Badge bg="primary">{stat.ouvert}</Badge>
                  </td>
                  <td className="text-center">
                    <Badge bg="success">{stat.ferme}</Badge>
                  </td>
                  <td className="text-center">
                    <Badge bg="secondary">{stat.total}</Badge>
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                      <ProgressBar
                        now={stat.pourcentage}
                        variant={
                          stat.pourcentage >= 80 ? 'success' :
                            stat.pourcentage >= 50 ? 'warning' : 'info'
                        }
                        style={{ width: '100px' }}
                        className="me-2"
                      />
                      <small>{stat.pourcentage}%</small>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
        <div className="mt-3">
          <small className="text-muted">
            <FaInfoCircle className="me-1" />
            Le taux de fermeture représente le pourcentage d'instances fermées par rapport au total des instances de chaque direction.
          </small>
        </div>
      </div>
    </div>
  );

  // ============================================
  // RENDU PRINCIPAL - SANS CARD, PLEINE LARGEUR
  // ============================================
  if (userLoading) {
    return (
      <div className="container-fluid py-4 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Vérification des permissions...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid px-0">
      {/* Conteneur Principal - Sans Card */}
      <div className="shadow-sm mb-3 bg-white">
        {/* Header Principal */}
        <div className="bg-primary text-white p-3 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <h3 className="mb-0 d-flex align-items-center">
              <FaTasks className="me-2" />
              Gestion des Instances
            </h3>
            <Badge bg={isAdmin() ? 'success' : 'secondary'} className="ms-3 py-2">
              {isAdmin() ? (
                <><FaUserShield className="me-1" /> Administrateur</>
              ) : (
                <><FaUser className="me-1" /> Utilisateur</>
              )}
            </Badge>
            <small className="text-white-50 ms-3">API: {API_BASE_URL}</small>
          </div>
          <div className="d-flex align-items-center gap-2">
            {canAdd() ? (
              <Button
                variant="success"
                onClick={handleAddInstance}
                disabled={loading}
              >
                <FaPlus className="me-1" />
                Nouvelle Instance
              </Button>
            ) : (
              <Button
                variant="outline-secondary"
                disabled
                title="Ajout réservé aux administrateurs"
              >
                <FaPlus className="me-1" />
                Nouvelle Instance
                <FaLock className="ms-1" size={12} />
              </Button>
            )}
          </div>
        </div>

        <div className="p-3">
          {loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Chargement des données...</p>
            </div>
          ) : error ? (
            <Alert variant="danger">
              <FaInfoCircle className="me-2" />
              {error}
              <Button variant="outline-danger" className="ms-3" onClick={refreshData}>
                <FaSyncAlt className="me-2" />
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
                    delay={5000}
                    autohide
                  >
                    <Toast.Body className="text-white">{toast.message}</Toast.Body>
                  </Toast>
                ))}
              </ToastContainer>

              {/* Cartes de statistiques globales - Sans Card */}
              <Row className="mb-3 g-2">
                <Col md={3}>
                  <div className="text-center border-0 bg-light p-3 rounded shadow-sm h-100">
                    <h5 className="card-title text-primary mb-1">{statistiquesGlobales.totalActives}</h5>
                    <p className="card-text mb-0">Instances Actives</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center border-0 bg-light p-3 rounded shadow-sm h-100">
                    <h5 className="card-title text-warning mb-1">{statistiquesGlobales.enRetard}</h5>
                    <p className="card-text mb-0">En Retard</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center border-0 bg-light p-3 rounded shadow-sm h-100">
                    <h5 className="card-title text-success mb-1">{statistiquesGlobales.totalFermees}</h5>
                    <p className="card-text mb-0">Instances Fermées</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center border-0 bg-light p-3 rounded shadow-sm h-100">
                    <h5 className="card-title text-info mb-1">{statistiquesGlobales.totalGeneral}</h5>
                    <p className="card-text mb-0">Total Instances</p>
                  </div>
                </Col>
              </Row>

              {/* Filtres - Sans Card */}
              <div className="mb-3 border rounded shadow-sm bg-white">
                <div className="border-bottom p-3 bg-light d-flex justify-content-between align-items-center">
                  <h6 className="mb-0 d-flex align-items-center">
                    <FaFilter className="me-2" />
                    Filtres
                  </h6>
                  <Button
                    variant="light"
                    onClick={refreshData}
                    disabled={loading}
                    className="me-2"
                  >
                    <FaSyncAlt className={loading ? "spin" : ""} />
                    <span className="ms-2">Rafraîchir</span>
                  </Button>
                </div>
                <div className="p-3">
                  <Row>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Projet</Form.Label>
                        <Form.Select
                          value={filters.projet}
                          onChange={(e) => setFilters(prev => ({ ...prev, projet: e.target.value }))}
                        >
                          <option value="">Tous les projets</option>
                          {projets.map(projet => (
                            <option key={projet.id} value={projet.id}>
                              {projet.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Zone</Form.Label>
                        <Form.Select
                          value={filters.zone}
                          onChange={(e) => setFilters(prev => ({ ...prev, zone: e.target.value }))}
                        >
                          <option value="">Toutes les zones</option>
                          {ZONES.map(zone => (
                            <option key={zone.value} value={zone.value}>
                              {zone.label}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Pôle de Direction</Form.Label>
                        <Form.Select
                          value={filters.pole}
                          onChange={(e) => setFilters(prev => ({ ...prev, pole: e.target.value, sousDirection: '' }))}
                        >
                          <option value="">Tous les pôles</option>
                          {Object.entries(POLES_DIRECTION).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Sous-direction</Form.Label>
                        <Form.Select
                          value={filters.sousDirection}
                          onChange={(e) => setFilters(prev => ({ ...prev, sousDirection: e.target.value }))}
                          disabled={!filters.pole}
                        >
                          <option value="">Toutes les sous-directions</option>
                          {SOUS_DIRECTIONS[filters.pole]?.map(sd => (
                            <option key={sd.value} value={sd.value}>
                              {sd.label}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  <div className="mt-3">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => setFilters({ projet: '', zone: '', pole: '', sousDirection: '' })}
                    >
                      Réinitialiser les filtres
                    </Button>
                  </div>
                </div>
              </div>

              {/* Onglets avec Statistiques */}
              <Tabs
                activeKey={activeTab}
                onSelect={(tab) => setActiveTab(tab)}
                className="mb-3"
                fill
              >
                <Tab
                  eventKey="actives"
                  title={
                    <span>
                      <FaList className="me-1" />
                      Instances Actives
                      <Badge bg="primary" className="ms-1">
                        {filteredInstancesActives.length}
                      </Badge>
                    </span>
                  }
                >
                  <InstanceTable
                    instances={paginatedActives}
                    totalItems={filteredInstancesActives.length}
                  />
                </Tab>
                <Tab
                  eventKey="fermees"
                  title={
                    <span>
                      <FaArchive className="me-1" />
                      Instances Fermées
                      <Badge bg="success" className="ms-1">
                        {filteredInstancesFermees.length}
                      </Badge>
                    </span>
                  }
                >
                  <InstanceTable
                    instances={paginatedFermees}
                    isFermee={true}
                    totalItems={filteredInstancesFermees.length}
                  />
                </Tab>
                <Tab
                  eventKey="statistiques"
                  title={
                    <span>
                      <FaChartPie className="me-1" />
                      Récap
                      <Badge bg="info" className="ms-1">
                        {statistiquesParDirection.find(s => s.direction === 'Total')?.total || 0}
                      </Badge>
                    </span>
                  }
                >
                  <StatistiquesTable />
                </Tab>
              </Tabs>

              {/* MODALS - inchangés */}
              {/* MODAL AJOUT */}
              {showAddModal && !isAdmin() ? (
                <Modal show={true} onHide={() => setShowAddModal(false)} centered>
                  <Modal.Header closeButton className="bg-warning">
                    <Modal.Title><FaLock className="me-2" /> Accès restreint</Modal.Title>
                  </Modal.Header>
                  <Modal.Body className="text-center">
                    <Alert variant="warning">
                      <FaInfoCircle className="me-2" />
                      <strong>Permission refusée</strong>
                      <p className="mb-0 mt-2">
                        Vous devez être administrateur pour ajouter des instances.
                      </p>
                    </Alert>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                      Fermer
                    </Button>
                  </Modal.Footer>
                </Modal>
              ) : showAddModal && (
                <Modal show={showAddModal} onHide={() => !isUpdating && setShowAddModal(false)} size="lg">
                  <Modal.Header closeButton>
                    <Modal.Title>
                      <FaTasks className="me-2" />
                      Ajouter une Instance
                    </Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    <Form>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Date *</Form.Label>
                            <Form.Control
                              type="date"
                              name="date"
                              value={currentInstance.date}
                              onChange={handleInputChange}
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Projet</Form.Label>
                            <Form.Select
                              name="projet_id"
                              value={currentInstance.projet_id}
                              onChange={handleInputChange}
                            >
                              <option value="">Sélectionnez un projet</option>
                              {projets.map(projet => (
                                <option key={projet.id} value={projet.id}>
                                  {projet.name}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>
                      <Form.Group className="mb-3">
                        <Form.Label>Désignation de l'instance *</Form.Label>
                        <Form.Control
                          type="text"
                          name="designation_instance"
                          value={currentInstance.designation_instance}
                          onChange={handleInputChange}
                          placeholder="Ex: Réunion de coordination technique..."
                          required
                        />
                      </Form.Group>
                      <Row>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Pôle de Direction *</Form.Label>
                            <Form.Select
                              name="direction_poles"
                              value={currentInstance.direction_poles}
                              onChange={handleInputChange}
                              required
                            >
                              <option value="">Sélectionnez un pôle</option>
                              {Object.entries(POLES_DIRECTION).map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Sous-direction</Form.Label>
                            <Form.Select
                              name="sous_direction"
                              value={currentInstance.sous_direction}
                              onChange={handleInputChange}
                              disabled={!currentInstance.direction_poles}
                            >
                              <option value="">Sélectionnez une sous-direction</option>
                              {sousDirectionsDisponibles.map(sd => (
                                <option key={sd.value} value={sd.value}>
                                  {sd.label}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Zone *</Form.Label>
                            <Form.Select
                              name="zone"
                              value={currentInstance.zone}
                              onChange={handleInputChange}
                              required
                            >
                              <option value="">Sélectionnez une zone</option>
                              {ZONES.map(zone => (
                                <option key={zone.value} value={zone.value}>
                                  {zone.label}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Délai (jours) *</Form.Label>
                            <Form.Control
                              type="number"
                              name="delai"
                              value={currentInstance.delai}
                              onChange={handleInputChange}
                              min="1"
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Avancement (%) *</Form.Label>
                            <Form.Control
                              type="number"
                              name="pourcentage_avancement"
                              value={currentInstance.pourcentage_avancement}
                              onChange={handleInputChange}
                              min="0"
                              max="100"
                              required
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <Row>
                        <Col md={12}>
                          <Form.Group className="mb-3">
                            <Form.Label>Description de l'avancement</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={2}
                              name="avancement"
                              value={currentInstance.avancement}
                              onChange={handleInputChange}
                              placeholder="Description de l'avancement..."
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <Form.Group className="mb-3">
                        <Form.Label>Observations</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          name="commentaires"
                          value={currentInstance.commentaires}
                          onChange={handleInputChange}
                          placeholder="Observations et commentaires..."
                        />
                      </Form.Group>
                    </Form>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowAddModal(false);
                        setShowEditModal(false);
                      }}
                      disabled={isUpdating}
                    >
                      Annuler
                    </Button>
                    <Button
                      variant="primary"
                      onClick={submitInstance}
                      disabled={!currentInstance.designation_instance.trim() ||
                        !currentInstance.direction_poles ||
                        !currentInstance.zone || isUpdating}
                    >
                      {isUpdating ? (
                        <>
                          <Spinner size="sm" animation="border" className="me-2" />
                          En cours...
                        </>
                      ) : 'Ajouter'}
                    </Button>
                  </Modal.Footer>
                </Modal>
              )}

              {/* MODAL ÉDITION */}
              {showEditModal && !isAdmin() ? (
                <Modal show={true} onHide={() => setShowEditModal(false)} centered>
                  <Modal.Header closeButton className="bg-warning">
                    <Modal.Title><FaLock className="me-2" /> Accès restreint</Modal.Title>
                  </Modal.Header>
                  <Modal.Body className="text-center">
                    <Alert variant="warning">
                      <FaInfoCircle className="me-2" />
                      <strong>Permission refusée</strong>
                      <p className="mb-0 mt-2">
                        Vous devez être administrateur pour modifier des instances.
                      </p>
                    </Alert>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                      Fermer
                    </Button>
                  </Modal.Footer>
                </Modal>
              ) : showEditModal && (
                <Modal show={showEditModal} onHide={() => !isUpdating && setShowEditModal(false)} size="lg">
                  <Modal.Header closeButton>
                    <Modal.Title>
                      <FaTasks className="me-2" />
                      Modifier une Instance
                    </Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    <Form>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Date *</Form.Label>
                            <Form.Control
                              type="date"
                              name="date"
                              value={currentInstance.date}
                              onChange={handleInputChange}
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Projet</Form.Label>
                            <Form.Select
                              name="projet_id"
                              value={currentInstance.projet_id}
                              onChange={handleInputChange}
                            >
                              <option value="">Sélectionnez un projet</option>
                              {projets.map(projet => (
                                <option key={projet.id} value={projet.id}>
                                  {projet.name}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>
                      <Form.Group className="mb-3">
                        <Form.Label>Désignation de l'instance *</Form.Label>
                        <Form.Control
                          type="text"
                          name="designation_instance"
                          value={currentInstance.designation_instance}
                          onChange={handleInputChange}
                          required
                        />
                      </Form.Group>
                      <Row>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Pôle de Direction *</Form.Label>
                            <Form.Select
                              name="direction_poles"
                              value={currentInstance.direction_poles}
                              onChange={handleInputChange}
                              required
                            >
                              <option value="">Sélectionnez un pôle</option>
                              {Object.entries(POLES_DIRECTION).map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Sous-direction</Form.Label>
                            <Form.Select
                              name="sous_direction"
                              value={currentInstance.sous_direction}
                              onChange={handleInputChange}
                              disabled={!currentInstance.direction_poles}
                            >
                              <option value="">Sélectionnez une sous-direction</option>
                              {sousDirectionsDisponibles.map(sd => (
                                <option key={sd.value} value={sd.value}>
                                  {sd.label}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Zone *</Form.Label>
                            <Form.Select
                              name="zone"
                              value={currentInstance.zone}
                              onChange={handleInputChange}
                              required
                            >
                              <option value="">Sélectionnez une zone</option>
                              {ZONES.map(zone => (
                                <option key={zone.value} value={zone.value}>
                                  {zone.label}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Délai (jours) *</Form.Label>
                            <Form.Control
                              type="number"
                              name="delai"
                              value={currentInstance.delai}
                              onChange={handleInputChange}
                              min="1"
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Avancement (%) *</Form.Label>
                            <Form.Control
                              type="number"
                              name="pourcentage_avancement"
                              value={currentInstance.pourcentage_avancement}
                              onChange={handleInputChange}
                              min="0"
                              max="100"
                              required
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <Row>
                        <Col md={12}>
                          <Form.Group className="mb-3">
                            <Form.Label>Description de l'avancement</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={2}
                              name="avancement"
                              value={currentInstance.avancement}
                              onChange={handleInputChange}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <Form.Group className="mb-3">
                        <Form.Label>Commentaires</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          name="commentaires"
                          value={currentInstance.commentaires}
                          onChange={handleInputChange}
                        />
                      </Form.Group>
                    </Form>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowAddModal(false);
                        setShowEditModal(false);
                      }}
                      disabled={isUpdating}
                    >
                      Annuler
                    </Button>
                    <Button
                      variant="primary"
                      onClick={submitInstance}
                      disabled={!currentInstance.designation_instance.trim() ||
                        !currentInstance.direction_poles ||
                        !currentInstance.zone || isUpdating}
                    >
                      {isUpdating ? (
                        <>
                          <Spinner size="sm" animation="border" className="me-2" />
                          En cours...
                        </>
                      ) : 'Modifier'}
                    </Button>
                  </Modal.Footer>
                </Modal>
              )}

              {/* MODAL FERMETURE */}
              {showFermerModal && !isAdmin() ? (
                <Modal show={true} onHide={() => setShowFermerModal(false)} centered>
                  <Modal.Header closeButton className="bg-warning">
                    <Modal.Title><FaLock className="me-2" /> Accès restreint</Modal.Title>
                  </Modal.Header>
                  <Modal.Body className="text-center">
                    <Alert variant="warning">
                      <FaInfoCircle className="me-2" />
                      <strong>Permission refusée</strong>
                      <p className="mb-0 mt-2">
                        Vous devez être administrateur pour fermer des instances.
                      </p>
                    </Alert>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowFermerModal(false)}>
                      Fermer
                    </Button>
                  </Modal.Footer>
                </Modal>
              ) : showFermerModal && (
                <Modal show={showFermerModal} onHide={() => !isUpdating && setShowFermerModal(false)}>
                  <Modal.Header closeButton>
                    <Modal.Title>
                      <FaCheckCircle className="me-2 text-success" />
                      Fermer l'Instance
                    </Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    {instanceToFermer && (
                      <div>
                        <p>Êtes-vous sûr de vouloir fermer l'instance :</p>
                        <p><strong>{instanceToFermer.designation_instance}</strong></p>
                        <p><strong>Projet:</strong> {getProjetName(instanceToFermer)}</p>
                        <p><strong>Pôle:</strong> {instanceToFermer.direction_poles}</p>
                        <Alert variant="success" className="mt-3">
                          <FaCheckCircle className="me-2" />
                          <strong>Cette action va :</strong>
                          <ul className="mb-0 mt-2">
                            <li>Mettre l'avancement à <strong>100%</strong></li>
                            <li>Marquer l'instance comme fermée</li>
                            <li>Déplacer l'instance vers les instances fermées</li>
                          </ul>
                        </Alert>
                      </div>
                    )}
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowFermerModal(false)} disabled={isUpdating}>
                      Annuler
                    </Button>
                    <Button variant="success" onClick={confirmFermer} disabled={isUpdating}>
                      {isUpdating ? (
                        <>
                          <Spinner size="sm" animation="border" className="me-2" />
                          En cours...
                        </>
                      ) : (
                        <>
                          <FaCheckCircle className="me-1" />
                          Fermer l'instance
                        </>
                      )}
                    </Button>
                  </Modal.Footer>
                </Modal>
              )}

              {/* MODAL OUVERTURE */}
              {showOuvrirModal && !isAdmin() ? (
                <Modal show={true} onHide={() => setShowOuvrirModal(false)} centered>
                  <Modal.Header closeButton className="bg-warning">
                    <Modal.Title><FaLock className="me-2" /> Accès restreint</Modal.Title>
                  </Modal.Header>
                  <Modal.Body className="text-center">
                    <Alert variant="warning">
                      <FaInfoCircle className="me-2" />
                      <strong>Permission refusée</strong>
                      <p className="mb-0 mt-2">
                        Vous devez être administrateur pour rouvrir des instances.
                      </p>
                    </Alert>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowOuvrirModal(false)}>
                      Fermer
                    </Button>
                  </Modal.Footer>
                </Modal>
              ) : showOuvrirModal && (
                <Modal show={showOuvrirModal} onHide={() => !isUpdating && setShowOuvrirModal(false)}>
                  <Modal.Header closeButton>
                    <Modal.Title>
                      <FaPlayCircle className="me-2 text-primary" />
                      Rouvrir l'Instance
                    </Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    {instanceToOuvrir && (
                      <div>
                        <p>Êtes-vous sûr de vouloir rouvrir l'instance :</p>
                        <p><strong>{instanceToOuvrir.designation_instance}</strong></p>
                        <p><strong>Projet:</strong> {getProjetName(instanceToOuvrir)}</p>
                        <p><strong>Pôle:</strong> {instanceToOuvrir.direction_poles}</p>
                        <Alert variant="info" className="mt-3">
                          <FaPlayCircle className="me-2" />
                          <strong>Cette action va :</strong>
                          <ul className="mb-0 mt-2">
                            <li>Remettre l'avancement à <strong>0%</strong></li>
                            <li>Marquer l'instance comme active</li>
                            <li>Déplacer l'instance vers les instances actives</li>
                          </ul>
                        </Alert>
                      </div>
                    )}
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowOuvrirModal(false)} disabled={isUpdating}>
                      Annuler
                    </Button>
                    <Button variant="primary" onClick={confirmOuvrir} disabled={isUpdating}>
                      {isUpdating ? (
                        <>
                          <Spinner size="sm" animation="border" className="me-2" />
                          En cours...
                        </>
                      ) : (
                        <>
                          <FaPlayCircle className="me-1" />
                          Rouvrir l'instance
                        </>
                      )}
                    </Button>
                  </Modal.Footer>
                </Modal>
              )}

              {/* MODAL SUPPRESSION */}
              {showDeleteModal && !isAdmin() ? (
                <Modal show={true} onHide={() => setShowDeleteModal(false)} centered>
                  <Modal.Header closeButton className="bg-warning">
                    <Modal.Title><FaLock className="me-2" /> Accès restreint</Modal.Title>
                  </Modal.Header>
                  <Modal.Body className="text-center">
                    <Alert variant="warning">
                      <FaInfoCircle className="me-2" />
                      <strong>Permission refusée</strong>
                      <p className="mb-0 mt-2">
                        Vous devez être administrateur pour supprimer des instances.
                      </p>
                    </Alert>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                      Fermer
                    </Button>
                  </Modal.Footer>
                </Modal>
              ) : showDeleteModal && (
                <Modal show={showDeleteModal} onHide={() => !isUpdating && setShowDeleteModal(false)}>
                  <Modal.Header closeButton>
                    <Modal.Title>
                      <FaTrash className="me-2" />
                      Confirmer la suppression
                    </Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    {instanceToDelete && (
                      <div>
                        <p>Êtes-vous sûr de vouloir supprimer l'instance :</p>
                        <p><strong>{instanceToDelete.designation_instance}</strong></p>
                        <p><strong>Projet:</strong> {getProjetName(instanceToDelete)}</p>
                        <p><strong>Pôle:</strong> {instanceToDelete.direction_poles}</p>
                        <p className="text-danger">Cette action est irréversible !</p>
                      </div>
                    )}
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={isUpdating}>
                      Annuler
                    </Button>
                    <Button variant="danger" onClick={confirmDelete} disabled={isUpdating}>
                      {isUpdating ? (
                        <>
                          <Spinner size="sm" animation="border" className="me-2" />
                          En cours...
                        </>
                      ) : 'Confirmer la suppression'}
                    </Button>
                  </Modal.Footer>
                </Modal>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GestionInstances;