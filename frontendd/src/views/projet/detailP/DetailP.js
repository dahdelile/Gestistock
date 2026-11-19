import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table, Button, Card, Spinner, Form, Modal, Toast, ToastContainer, Alert,
  InputGroup, Row, Col, Dropdown, Pagination, Badge, Breadcrumb
} from 'react-bootstrap';
import {
  FaMoneyBill, FaInfoCircle, FaSyncAlt, FaPlus, FaEdit, FaTrash,
  FaTimes, FaFileExport, FaPrint, FaChartLine, FaArrowLeft,
  FaFilter, FaCalendarAlt, FaFile, FaDownload, FaEye, FaSearch,
  FaMoneyCheckAlt, FaCreditCard, FaFileInvoice, FaCalculator, FaLock, FaUserShield, FaUser
} from 'react-icons/fa';
import { format, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

// ============================================
// CONFIGURATION API - PRODUCTION
// ============================================
const API_BASE_URL = 'https://intranet-attm.com/api';
const APP_URL = 'https://intranet-attm.com';

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
      'X-Requested-With': 'XMLHttpRequest'
    },
  };
  
  if (options.body instanceof FormData) {
    delete defaultOptions.headers['Content-Type'];
  }
  
  try {
    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    });
    
    // Détecter si on reçoit du HTML au lieu de JSON (erreur 406)
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      const text = await response.text();
      if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
        throw new Error('Erreur serveur : API non accessible. Vérifiez la configuration du serveur.');
      }
    }
    
    if (response.status === 401) {
      console.warn('Session expirée');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Session expirée');
    }
    
    if (response.status === 403) {
      console.warn('Accès refusé - Permissions insuffisantes');
      throw new Error('Accès refusé');
    }
    
    return response;
  } catch (error) {
    console.error('❌ Erreur fetch:', error);
    throw error;
  }
};

// ✅ API simplifiée
const api = {
  get: async (url) => {
    const response = await fetchWithToken(`${API_BASE_URL}${url}`);
    return response;
  },
  post: async (url, data, options = {}) => {
    const response = await fetchWithToken(`${API_BASE_URL}${url}`, {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
      ...options
    });
    return response;
  },
  put: async (url, data, options = {}) => {
    const response = await fetchWithToken(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
      ...options
    });
    return response;
  },
  delete: async (url) => {
    const response = await fetchWithToken(`${API_BASE_URL}${url}`, {
      method: 'DELETE'
    });
    return response;
  }
};

const Dcaisse = ({ projetId, projetData, onRetour }) => {
  // ✅ ÉTATS PRINCIPAUX
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({ caises: [] });
  const [statistiques, setStatistiques] = useState(null);

  // ✅ ÉTATS POUR L'AUTHENTIFICATION ET LES RÔLES
  const [userRole, setUserRole] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const [filters, setFilters] = useState({
    searchQuery: '',
    dateRange: { start: null, end: null },
    typeOperation: 'all'
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10
  });

  const [modals, setModals] = useState({
    showAddModal: false,
    showEditModal: false,
    showDeleteModal: false,
    showDetailsModal: false
  });

  const [currentCaisse, setCurrentCaisse] = useState(null);
  const [caisseToDelete, setCaisseToDelete] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [filePreview, setFilePreview] = useState(null);

  const [formData, setFormData] = useState({
    code_caisse: '',
    libelle: '',
    type_operation: '',
    montant: '',
    date: new Date().toISOString().slice(0, 10),
    cheque: '',
    file: null
  });

  // ============================================
  // ✅ GESTION DES RÔLES - ADMIN + GEST_CAISSE
  // ============================================
  const isAdmin = useCallback(() => 
    userRole === 'admin' || userRole === 'administrateur', 
    [userRole]
  );
  
  const isGestCaisse = useCallback(() => 
    userRole === 'Gest_Caisse' || userRole === 'gestionnaire_caisse', 
    [userRole]
  );

  // ✅ FONCTIONS DE PERMISSIONS ÉTENDUES
  const canEdit = useCallback(() => isAdmin() || isGestCaisse(), [isAdmin, isGestCaisse]);
  const canDelete = useCallback(() => isAdmin() || isGestCaisse(), [isAdmin, isGestCaisse]);
  const canAdd = useCallback(() => isAdmin() || isGestCaisse(), [isAdmin, isGestCaisse]);
  const canExport = useCallback(() => isAdmin() || isGestCaisse(), [isAdmin, isGestCaisse]);

  // Gestion des notifications
  const showToast = useCallback((message, variant = 'success') => {
    const newToast = { id: Date.now(), message, variant };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 5000);
  }, []);

  // Formateurs
  const formatDisplayDate = useCallback((dateString) => {
    if (!dateString) return 'Non spécifiée';
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, 'dd/MM/yyyy', { locale: fr }) : dateString;
    } catch {
      return dateString;
    }
  }, []);

  const formatMontant = useCallback((montant) => {
    if (montant === undefined || montant === null) return '0,00';
    const num = parseFloat(montant);
    return isNaN(num) ? '0,00' : num.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }, []);

  // ✅ Génération automatique du code de caisse
  const generateCodeCaisse = useCallback(() => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `C-${year}${month}${day}-${random}`;
  }, []);

  // ✅ CHARGER LE RÔLE UTILISATEUR
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

  // Fonction pour calculer les statistiques
  const calculerStatistiques = useCallback((caisses) => {
    if (!caisses || caisses.length === 0) {
      return {
        total_recettes: 0,
        total_depenses: 0,
        solde: 0,
        nombre_operations: 0
      };
    }
    const totalRecette = caisses.reduce((sum, c) => {
      const recette = parseFloat(c.recette) || 0;
      return sum + recette;
    }, 0);
    const totalDepense = caisses.reduce((sum, c) => {
      const depense = parseFloat(c.depense) || 0;
      return sum + depense;
    }, 0);
    const soldeTotal = totalRecette - totalDepense;
    return {
      total_recettes: totalRecette,
      total_depenses: totalDepense,
      solde: soldeTotal,
      nombre_operations: caisses.length
    };
  }, []);

  // ✅ CHARGEMENT DES CAISSES - Endpoint corrigé
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // ✅ Endpoint: /caisses/projet/{projetId}
      const url = `/caisses/projet/${projetId}`;
      const response = await api.get(url);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const responseData = await response.json();
      let caissesData = [];
      
      if (responseData && responseData.success === false) {
        throw new Error(responseData.message || 'Erreur API');
      }
      
      // Extraire les données selon le format de réponse
      if (Array.isArray(responseData)) {
        caissesData = responseData;
      } else if (responseData?.data && Array.isArray(responseData.data)) {
        caissesData = responseData.data;
      } else if (responseData?.data) {
        caissesData = Array.isArray(responseData.data) ? responseData.data : [responseData.data];
      }
      
      const caisesWithCalculations = caissesData.map(caisse => {
        const recette = parseFloat(caisse.recette) || 0;
        const depense = parseFloat(caisse.depense) || 0;
        return {
          id: caisse.id,
          code_caisse: caisse.code_caisse || caisse.code || `CAISSE-${caisse.id}`,
          libelle: caisse.libelle || caisse.description || 'Non spécifié',
          recette,
          depense,
          date: caisse.date || caisse.created_at,
          cheque: caisse.cheque || '',
          file_url: caisse.file_url || caisse.file || null,
          file_name: caisse.file_name || null,
          created_at: caisse.created_at,
          updated_at: caisse.updated_at,
          projet_id: caisse.projet_id || projetId,
          recetteFormatted: formatMontant(recette),
          depenseFormatted: formatMontant(depense),
          soldeFormatted: formatMontant(recette - depense)
        };
      });

      const stats = calculerStatistiques(caisesWithCalculations);
      setStatistiques(stats);
      setData({ caises: caisesWithCalculations });
      
    } catch (err) {
      console.error("❌ Erreur détaillée:", err);
      let errorMessage = "Erreur lors du chargement des données";
      
      if (err.message?.includes('403')) {
        errorMessage = "Accès refusé - Permissions insuffisantes";
      } else if (err.message?.includes('401')) {
        errorMessage = "Authentification requise";
      } else if (err.message?.includes('404')) {
        errorMessage = "Endpoint non trouvé";
      } else if (err.message?.includes('500')) {
        errorMessage = "Erreur serveur (500)";
      } else if (err.message?.includes('API non accessible')) {
        errorMessage = err.message;
      } else {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      showToast(errorMessage, 'danger');
    } finally {
      setLoading(false);
    }
  }, [projetId, formatMontant, calculerStatistiques, showToast]);

  // ✅ CHARGEMENT INITIAL
  useEffect(() => {
    const initialize = async () => {
      await fetchUserRole();
      if (projetId) {
        await fetchData();
      }
    };
    initialize();
  }, [projetId, fetchUserRole, fetchData]);

  // Gestion du formulaire
  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'file') {
      const file = files[0];
      setFormData(prev => ({ ...prev, file }));
      if (file) {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => setFilePreview(e.target.result);
          reader.readAsDataURL(file);
        } else if (file.type === 'application/pdf') {
          setFilePreview('PDF');
        } else {
          setFilePreview('DOCUMENT');
        }
      } else {
        setFilePreview(null);
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // ✅ Initialisation du formulaire avec code généré
  const initCaisseForm = () => ({
    code_caisse: generateCodeCaisse(),
    libelle: '',
    type_operation: '',
    montant: '',
    date: new Date().toISOString().slice(0, 10),
    cheque: '',
    file: null
  });

  // Filtrage et pagination
  const filteredCaises = useMemo(() => {
    return data.caises.filter(caisse => {
      const searchMatch = filters.searchQuery
        ? (caisse.libelle?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
           caisse.code_caisse?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
           caisse.cheque?.toLowerCase().includes(filters.searchQuery.toLowerCase()))
        : true;
        
      const dateMatch = filters.dateRange.start && filters.dateRange.end
        ? (new Date(caisse.date) >= new Date(filters.dateRange.start) &&
           new Date(caisse.date) <= new Date(filters.dateRange.end))
        : true;
        
      let typeMatch = true;
      if (filters.typeOperation === 'recette') {
        typeMatch = parseFloat(caisse.recette) > 0;
      } else if (filters.typeOperation === 'depense') {
        typeMatch = parseFloat(caisse.depense) > 0;
      }
      return searchMatch && dateMatch && typeMatch;
    });
  }, [data.caises, filters]);

  const paginatedCaises = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    return filteredCaises.slice(startIndex, startIndex + pagination.itemsPerPage);
  }, [filteredCaises, pagination]);

  const totalPages = Math.max(1, Math.ceil(filteredCaises.length / pagination.itemsPerPage));

  // Statistiques
  const stats = useMemo(() => {
    const totalRecette = filteredCaises.reduce((sum, c) => {
      const recette = parseFloat(c.recette) || 0;
      return sum + recette;
    }, 0);
    const totalDepense = filteredCaises.reduce((sum, c) => {
      const depense = parseFloat(c.depense) || 0;
      return sum + depense;
    }, 0);
    const soldeTotal = totalRecette - totalDepense;
    return {
      totalRecette,
      totalDepense,
      soldeTotal,
      totalOperations: filteredCaises.length
    };
  }, [filteredCaises]);

  const recalculerStatistiques = () => {
    if (data.caises.length === 0) {
      showToast('Aucune donnée à calculer', 'warning');
      return;
    }
    const totalRecette = data.caises.reduce((sum, c) => {
      const montant = parseFloat(c.recette) || 0;
      return sum + montant;
    }, 0);
    const totalDepense = data.caises.reduce((sum, c) => {
      const montant = parseFloat(c.depense) || 0;
      return sum + montant;
    }, 0);
    const nouvellesStats = {
      total_recettes: totalRecette,
      total_depenses: totalDepense,
      solde: totalRecette - totalDepense,
      nombre_operations: data.caises.length
    };
    setStatistiques(nouvellesStats);
    showToast(`Statistiques mises à jour`, 'info');
  };

  // ✅ GESTION DES MODALS AVEC VÉRIFICATION DES RÔLES
  const handleAddCaisse = () => {
    if (!canAdd()) {
      showToast("Seuls les administrateurs et gestionnaires de caisse peuvent ajouter des opérations", 'warning');
      return;
    }
    setFormData(initCaisseForm());
    setFilePreview(null);
    setModals(prev => ({ ...prev, showAddModal: true }));
  };

  const handleEditCaisse = (caisse) => {
    if (!canEdit()) {
      showToast("Seuls les administrateurs et gestionnaires de caisse peuvent modifier des opérations", 'warning');
      return;
    }
    const type_operation = parseFloat(caisse.recette) > 0 ? 'recette' : 'depense';
    const montant = parseFloat(caisse.recette) > 0 ? caisse.recette : caisse.depense;
    const formDataToEdit = {
      id: caisse.id,
      code_caisse: caisse.code_caisse,
      libelle: caisse.libelle,
      type_operation,
      montant,
      date: caisse.date ? caisse.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      cheque: caisse.cheque || '',
      file: null
    };
    setFormData(formDataToEdit);
    setCurrentCaisse(caisse);
    setFilePreview(caisse.file_url || null);
    setModals(prev => ({ ...prev, showEditModal: true }));
  };

  const handleViewDetails = (caisse) => {
    setCurrentCaisse(caisse);
    setModals(prev => ({ ...prev, showDetailsModal: true }));
  };

  const handleDeleteCaisse = (caisse) => {
    if (!canDelete()) {
      showToast("Seuls les administrateurs et gestionnaires de caisse peuvent supprimer des opérations", 'warning');
      return;
    }
    setCaisseToDelete(caisse);
    setModals(prev => ({ ...prev, showDeleteModal: true }));
  };

  // ✅ CRÉATION - POST /api/caisses
  const submitAddCaisse = async (e) => {
    e.preventDefault();
    if (!canAdd()) {
      showToast("Action non autorisée. Vous n'avez pas les permissions nécessaires.", 'danger');
      return;
    }
    
    try {
      setLoading(true);
      
      // Validations
      if (!formData.libelle?.trim()) {
        showToast("Le libellé est obligatoire", 'warning');
        setLoading(false);
        return;
      }
      if (!formData.type_operation) {
        showToast("Le type d'opération est obligatoire", 'warning');
        setLoading(false);
        return;
      }
      const montant = parseFloat(formData.montant);
      if (isNaN(montant) || montant <= 0) {
        showToast("Le montant doit être un nombre positif", 'warning');
        setLoading(false);
        return;
      }
      
      // Génération du code si vide
      const codeCaisse = formData.code_caisse?.trim() || generateCodeCaisse();
      const recette = formData.type_operation === 'recette' ? montant : 0;
      const depense = formData.type_operation === 'depense' ? montant : 0;
      
      const formDataToSend = new FormData();
      formDataToSend.append('code_caisse', codeCaisse);
      formDataToSend.append('libelle', formData.libelle.trim());
      formDataToSend.append('recette', recette.toString());
      formDataToSend.append('depense', depense.toString());
      formDataToSend.append('date', formData.date);
      formDataToSend.append('projet_id', projetId);
      if (formData.cheque) formDataToSend.append('cheque', formData.cheque);
      if (formData.file) formDataToSend.append('file', formData.file);
      
      // ✅ Endpoint: POST /api/caisses
      const response = await api.post('/caisses', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (!response.ok) {
        const responseText = await response.text();
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.errors) {
            const errorMessages = Object.entries(errorData.errors)
              .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
              .join('\n');
            showToast(`Erreurs: ${errorMessages}`, 'danger');
          } else {
            showToast(errorData.message || `Erreur ${response.status}`, 'danger');
          }
        } catch {
          showToast(`Erreur ${response.status}: ${responseText.substring(0, 150)}`, 'danger');
        }
        return;
      }
      
      const responseData = await response.json();
      showToast('Opération créée avec succès', 'success');
      await fetchData();
      setModals(prev => ({ ...prev, showAddModal: false }));
      setFilePreview(null);
      
    } catch (err) {
      console.error("❌ Erreur création:", err);
      if (err.message?.includes('403')) {
        showToast("Accès refusé. Permissions insuffisantes.", 'danger');
      } else if (err.message?.includes('Failed to fetch') || err.message?.includes('API non accessible')) {
        showToast("Impossible de se connecter au serveur.", 'danger');
      } else {
        showToast('Erreur lors de la création', 'danger');
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ MODIFICATION - PUT /api/caisses/{id}
  const submitEditCaisse = async (e) => {
    e.preventDefault();
    if (!canEdit()) {
      showToast("Action non autorisée", 'danger');
      return;
    }
    
    try {
      setLoading(true);
      const montant = parseFloat(formData.montant);
      if (isNaN(montant) || montant <= 0) {
        showToast("Le montant doit être un nombre positif", 'warning');
        setLoading(false);
        return;
      }
      
      const recette = formData.type_operation === 'recette' ? montant : 0;
      const depense = formData.type_operation === 'depense' ? montant : 0;
      
      const formDataToSend = new FormData();
      formDataToSend.append('code_caisse', formData.code_caisse);
      formDataToSend.append('libelle', formData.libelle);
      formDataToSend.append('recette', recette.toString());
      formDataToSend.append('depense', depense.toString());
      formDataToSend.append('date', formData.date);
      if (formData.cheque) formDataToSend.append('cheque', formData.cheque);
      formDataToSend.append('_method', 'PUT');
      if (formData.file) formDataToSend.append('file', formData.file);
      
      const response = await api.post(`/caisses/${formData.id}`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (!response.ok) {
        const responseText = await response.text();
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.errors) {
            const errorMessages = Object.entries(errorData.errors)
              .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
              .join('\n');
            showToast(`Erreurs: ${errorMessages}`, 'danger');
          } else {
            showToast(errorData.message || `Erreur ${response.status}`, 'danger');
          }
        } catch {
          showToast(`Erreur ${response.status}`, 'danger');
        }
        return;
      }
      
      showToast('Opération modifiée avec succès', 'success');
      await fetchData();
      setModals(prev => ({ ...prev, showEditModal: false }));
      setFilePreview(null);
      
    } catch (err) {
      console.error("❌ Erreur édition:", err);
      showToast(err.message?.includes('403') ? "Accès refusé" : 'Erreur lors de la modification', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // ✅ SUPPRESSION - DELETE /api/caisses/{id}
  const confirmDelete = async () => {
    if (!canDelete()) {
      showToast("Action non autorisée", 'danger');
      return;
    }
    try {
      setLoading(true);
      const response = await api.delete(`/caisses/${caisseToDelete.id}`);
      
      if (!response.ok) {
        const responseText = await response.text();
        try {
          const errorData = JSON.parse(responseText);
          showToast(errorData.message || 'Erreur lors de la suppression', 'danger');
        } catch {
          showToast(`Erreur ${response.status}`, 'danger');
        }
        return;
      }
      
      showToast('Opération supprimée avec succès', 'success');
      await fetchData();
      setModals(prev => ({ ...prev, showDeleteModal: false }));
    } catch (err) {
      console.error("❌ Erreur suppression:", err);
      showToast(err.message?.includes('403') ? "Accès refusé" : 'Erreur lors de la suppression', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // ✅ EXPORT
  const handleExport = async () => {
    if (!canExport()) {
      showToast("Seuls les administrateurs et gestionnaires de caisse peuvent exporter", 'warning');
      return;
    }
    try {
      setLoading(true);
      const response = await api.get(`/caisses/export?projet_id=${projetId}`);
      if (!response.ok) throw new Error('Erreur export');
      
      const data = await response.json();
      if (data.data?.download_url) {
        window.open(data.data.download_url, '_blank');
      }
      showToast('Export Excel généré avec succès', 'success');
    } catch (err) {
      console.error("❌ Erreur export:", err);
      showToast(err.message?.includes('403') ? "Accès refusé pour l'export" : 'Erreur lors de l\'export', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // ✅ TÉLÉCHARGEMENT
  const handleDownloadFile = async (caisseId, fileName) => {
    try {
      const response = await api.get(`/caisses/${caisseId}/download`);
      const data = await response.json();
      if (data.success && data.data?.download_url) {
        window.open(data.data.download_url, '_blank');
        showToast('Téléchargement démarré', 'success');
      } else {
        showToast('Fichier non disponible', 'warning');
      }
    } catch (err) {
      console.error("❌ Erreur téléchargement:", err);
      showToast('Erreur lors du téléchargement', 'danger');
    }
  };

  const resetFilters = () => {
    setFilters({ searchQuery: '', dateRange: { start: null, end: null }, typeOperation: 'all' });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const normalizeFileUrl = (fileUrl) => {
    if (!fileUrl) return null;
    if (fileUrl.startsWith('http')) return fileUrl;
    const baseUrl = API_BASE_URL.replace('/api', '');
    if (fileUrl.startsWith('/storage/')) return `${baseUrl}${fileUrl}`;
    if (fileUrl.startsWith('/')) return `${baseUrl}${fileUrl}`;
    return `${baseUrl}/storage/${fileUrl}`;
  };

  // ✅ COMPOSANT FILEPREVIEW
  const FilePreviewComponent = ({ fileUrl, fileName }) => {
    if (!fileUrl) return null;
    const normalizedUrl = normalizeFileUrl(fileUrl);
    const isImage = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fileUrl);
    const isPdf = /\.pdf$/i.test(fileUrl);
    
    return (
      <div className="mt-3 p-3 border rounded bg-light">
        <h6><FaFile className="me-2" /> Fichier joint</h6>
        <div className="d-flex align-items-center">
          <div className="me-3">
            {isImage ? <FaFileInvoice size={32} className="text-primary" /> :
             isPdf ? <FaFileInvoice size={32} className="text-danger" /> :
             <FaFile size={32} className="text-secondary" />}
          </div>
          <div className="flex-grow-1">
            <div className="small text-muted">Nom: {fileName || fileUrl.split('/').pop() || 'document'}</div>
            <div className="btn-group mt-2" role="group">
              <Button variant="outline-primary" size="sm" onClick={() => window.open(normalizedUrl, '_blank')} className="me-2">
                <FaEye className="me-1" /> Voir
              </Button>
              <Button variant="outline-success" size="sm" onClick={() => handleDownloadFile(currentCaisse?.id, fileName)}>
                <FaDownload className="me-1" /> Télécharger
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ✅ AFFICHAGE CHARGEMENT RÔLE
  if (userLoading) {
    return (
      <div className="container-fluid py-3 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Vérification des permissions...</p>
      </div>
    );
  }

  // ✅ RENDER CONTENT
  const renderContent = () => {
    if (loading && !data.caises.length) {
      return (
        <div className="text-center my-5 py-5">
          <Spinner animation="border" variant="success" />
          <p className="mt-3">Chargement des opérations de caisse...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <Alert variant="danger" className="my-4">
          <FaInfoCircle className="me-2" />
          <strong>Erreur :</strong> {error}
          <div className="mt-3">
            <Button variant="outline-danger" size="sm" onClick={fetchData} className="me-2">
              <FaSyncAlt className="me-1" /> Réessayer
            </Button>
            {data.caises.length === 0 && canAdd() && (
              <Button variant="primary" size="sm" onClick={handleAddCaisse}>
                <FaPlus className="me-1" /> Créer la première opération
              </Button>
            )}
          </div>
        </Alert>
      );
    }
    
    return (
      <>
        <ToastContainer position="top-end" className="p-3">
          {toasts.map(toast => (
            <Toast key={toast.id} onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} bg={toast.variant} autohide delay={5000}>
              <Toast.Body className="text-white">{toast.message}</Toast.Body>
            </Toast>
          ))}
        </ToastContainer>

        {/* Filtres */}
        <Card className="mb-4 shadow-sm">
          <Card.Header className="bg-light d-flex justify-content-between align-items-center">
            <h5 className="mb-0"><FaFilter className="me-2" /> Recherche</h5>
            <Button variant="light" onClick={fetchData} disabled={loading} className="d-flex align-items-center">
              <FaSyncAlt className={loading ? "spin" : ""} />
              <span className="ms-2">Rafraîchir</span>
            </Button>
          </Card.Header>
          <Card.Body>
            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label><FaSearch className="me-1" /> Rechercher</Form.Label>
                  <InputGroup>
                    <Form.Control type="text" placeholder="Code, libellé, chèque..." value={filters.searchQuery} onChange={e => { setFilters(p => ({ ...p, searchQuery: e.target.value })); setPagination(p => ({ ...p, currentPage: 1 })); }} />
                    <InputGroup.Text><FaSearch /></InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Type d'opération</Form.Label>
                  <Form.Select value={filters.typeOperation} onChange={e => { setFilters(p => ({ ...p, typeOperation: e.target.value })); setPagination(p => ({ ...p, currentPage: 1 })); }}>
                    <option value="all">Tous les types</option>
                    <option value="recette">Recettes seulement</option>
                    <option value="depense">Dépenses seulement</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label>Date début</Form.Label>
                  <InputGroup>
                    <Form.Control type="date" value={filters.dateRange.start || ''} onChange={e => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, start: e.target.value } }))} />
                    <InputGroup.Text><FaCalendarAlt /></InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label>Date fin</Form.Label>
                  <InputGroup>
                    <Form.Control type="date" value={filters.dateRange.end || ''} onChange={e => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, end: e.target.value } }))} min={filters.dateRange.start} />
                    <InputGroup.Text><FaCalendarAlt /></InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={1} className="d-flex align-items-end">
                <Button variant="outline-primary" onClick={() => setPagination(p => ({ ...p, currentPage: 1 }))} className="w-100">Filtrer</Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Statistiques */}
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0"><FaChartLine className="me-2" /> Statistiques du projet</h5>
              <Button variant="outline-info" size="sm" onClick={recalculerStatistiques} title="Recalculer"><FaCalculator className="me-1" /> Recalculer</Button>
            </div>
            <Row>
              <Col md={3}><Card className="border-0 shadow-sm h-100"><Card.Body className="text-center"><div className="text-muted small mb-1">Total opérations</div><div className="fs-4 fw-bold text-primary">{stats.totalOperations}</div><small className="text-muted">{data.caises.length} total • {filteredCaises.length} filtrées</small></Card.Body></Card></Col>
              <Col md={3}><Card className="border-0 shadow-sm h-100 bg-success bg-opacity-10"><Card.Body className="text-center"><div className="text-muted small mb-1">Total recettes</div><div className="fs-4 fw-bold text-success">{formatMontant(stats.totalRecette)}</div><small className="text-muted">{stats.totalOperations > 0 ? formatMontant(stats.totalRecette / stats.totalOperations) : '0,00'} moyenne</small></Card.Body></Card></Col>
              <Col md={3}><Card className="border-0 shadow-sm h-100 bg-danger bg-opacity-10"><Card.Body className="text-center"><div className="text-muted small mb-1">Total dépenses</div><div className="fs-4 fw-bold text-danger">{formatMontant(stats.totalDepense)}</div><small className="text-muted">{stats.totalOperations > 0 ? formatMontant(stats.totalDepense / stats.totalOperations) : '0,00'} moyenne</small></Card.Body></Card></Col>
              <Col md={3}><Card className={`border-0 shadow-sm h-100 ${stats.soldeTotal >= 0 ? 'bg-info bg-opacity-10' : 'bg-warning bg-opacity-10'}`}><Card.Body className="text-center"><div className="text-muted small mb-1">Solde total</div><div className={`fs-4 fw-bold ${stats.soldeTotal >= 0 ? 'text-success' : 'text-danger'}`}>{formatMontant(stats.soldeTotal)}</div><small className="text-muted">{stats.soldeTotal >= 0 ? 'Positif' : 'Négatif'}</small></Card.Body></Card></Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Tableau */}
        <div className="table-responsive mb-4">
          <Table striped bordered hover className="align-middle">
            <thead className="table-dark">
              <tr>
                <th width="120">Code</th><th width="100">Date</th><th>Libellé</th>
                <th width="120" className="text-end">Recette</th><th width="120" className="text-end">Dépense</th>
                <th width="120">Moyen.T</th><th width="100">Fichier</th><th width="140">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCaises.length > 0 ? paginatedCaises.map(caisse => {
                const isRecette = parseFloat(caisse.recette) > 0;
                return (
                  <tr key={caisse.id}>
                    <td><Badge bg={isRecette ? "success" : "danger"}>{caisse.code_caisse}</Badge></td>
                    <td><small>{formatDisplayDate(caisse.date)}</small></td>
                    <td><div className="fw-medium">{caisse.libelle}</div></td>
                    <td className="text-end">{isRecette ? <span className="fw-bold text-success">+{caisse.recetteFormatted}</span> : <span className="text-muted">-</span>}</td>
                    <td className="text-end">{!isRecette ? <span className="fw-bold text-danger">-{caisse.depenseFormatted}</span> : <span className="text-muted">-</span>}</td>
                    <td>{caisse.cheque ? <Badge bg="info"><FaCreditCard className="me-1" /> {caisse.cheque}</Badge> : <Badge bg="secondary">Espèces</Badge>}</td>
                    <td>{caisse.file_url ? <Button variant="outline-primary" size="sm" onClick={() => window.open(normalizeFileUrl(caisse.file_url), '_blank')} title="Voir"><FaEye /></Button> : <span className="text-muted">-</span>}</td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <Button variant="outline-info" onClick={() => handleViewDetails(caisse)} title="Détails"><FaInfoCircle /></Button>
                        {canEdit() ? <Button variant="outline-primary" onClick={() => handleEditCaisse(caisse)} title="Modifier"><FaEdit /></Button> : <Button variant="outline-secondary" disabled title="Réservé admin/gestionnaire"><FaLock /></Button>}
                        {canDelete() ? <Button variant="outline-danger" onClick={() => handleDeleteCaisse(caisse)} title="Supprimer"><FaTrash /></Button> : <Button variant="outline-secondary" disabled title="Réservé admin/gestionnaire"><FaLock /></Button>}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="8" className="text-center py-5"><div className="d-flex flex-column align-items-center"><FaMoneyBill size={48} className="text-muted mb-3" /><h5 className="text-muted">Aucune opération trouvée</h5><p className="text-muted mb-3">{data.caises.length === 0 ? "Ce projet n'a pas encore d'opérations" : "Aucune donnée ne correspond à vos filtres"}</p>{canAdd() && <Button variant="primary" onClick={handleAddCaisse} className="mt-2"><FaPlus className="me-2" /> Ajouter une opération</Button>}</div></td></tr>
              )}
            </tbody>
          </Table>
        </div>

        {/* Pagination */}
        {filteredCaises.length > pagination.itemsPerPage && (
          <Card className="shadow-sm"><Card.Body className="py-2"><div className="d-flex justify-content-between align-items-center">
            <div className="text-muted small">Page {pagination.currentPage} sur {totalPages} • {paginatedCaises.length} opérations</div>
            <Pagination className="mb-0">
              <Pagination.First onClick={() => setPagination(p => ({ ...p, currentPage: 1 }))} disabled={pagination.currentPage === 1} />
              <Pagination.Prev onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage - 1 }))} disabled={pagination.currentPage === 1} />
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const page = Math.max(1, Math.min(totalPages, pagination.currentPage - 2 + i));
                return <Pagination.Item key={page} active={page === pagination.currentPage} onClick={() => setPagination(p => ({ ...p, currentPage: page }))}>{page}</Pagination.Item>;
              })}
              <Pagination.Next onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage + 1 }))} disabled={pagination.currentPage === totalPages} />
              <Pagination.Last onClick={() => setPagination(p => ({ ...p, currentPage: totalPages }))} disabled={pagination.currentPage === totalPages} />
            </Pagination>
          </div></Card.Body></Card>
        )}
      </>
    );
  };

  return (
    <div className="container-fluid py-3">
      {/* Header */}
      <Card className="shadow-lg mb-4 border-success">
        <Card.Header className="bg-success text-white py-3">
          <Row className="align-items-center">
            <Col xs={12} md={6}>
              <Button variant="outline-light" onClick={onRetour} className="d-flex align-items-center"><FaArrowLeft className="me-1" /><span>Retour</span></Button>
            </Col>
            <Col xs={12} md={6} className="mt-2 mt-md-0">
              <div className="d-flex flex-wrap justify-content-md-end gap-2 align-items-center">
                {/* Badge rôle */}
                <Badge bg={canEdit() ? 'success' : 'secondary'} className="me-2 py-2">
                  {isAdmin() ? <><FaUserShield className="me-1" /> Admin</> :
                   isGestCaisse() ? <><FaUser className="me-1" /> Gest. Caisse</> :
                   <><FaUser className="me-1" /> Consultation</>}
                </Badge>
                <small className="text-white-50 me-2">API: {API_BASE_URL}</small>
                
                {/* Bouton Export */}
                {canExport() ? <Button variant="warning" onClick={handleExport} disabled={loading || data.caises.length === 0}><FaFileExport className="me-1" /> Exporter</Button> :
                  <Button variant="outline-secondary" disabled title="Réservé admin/gestionnaire"><FaFileExport className="me-1" /> Exporter <FaLock className="ms-1" size={12} /></Button>}
                
                {/* Bouton Ajout */}
                {canAdd() ? <Button variant="primary" onClick={handleAddCaisse} disabled={loading}><FaPlus className="me-1" /> Nouvelle opération</Button> :
                  <Button variant="outline-secondary" disabled title="Réservé admin/gestionnaire"><FaPlus className="me-1" /> Nouvelle opération <FaLock className="ms-1" size={12} /></Button>}
              </div>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body className="p-3">{renderContent()}</Card.Body>
      </Card>

      {/* ✅ MODAL AJOUT - code_caisse ÉDITABLE */}
      <Modal show={modals.showAddModal} onHide={() => !loading && setModals(p => ({ ...p, showAddModal: false }))} size="lg" backdrop="static">
        <Modal.Header closeButton className="bg-primary text-white"><Modal.Title><FaPlus className="me-2" /> Nouvelle opération</Modal.Title></Modal.Header>
        <Form onSubmit={submitAddCaisse}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Code caisse *</Form.Label>
                  <InputGroup>
                    {/* ✅ CODE ÉDITABLE - readOnly supprimé */}
                    <Form.Control type="text" name="code_caisse" value={formData.code_caisse} onChange={handleInputChange} required placeholder="Ex: C-240101-123" />
                    <Button variant="outline-secondary" onClick={() => setFormData(p => ({ ...p, code_caisse: generateCodeCaisse() }))} title="Générer">Générer</Button>
                  </InputGroup>
                  <Form.Text className="text-muted">Éditable ou cliquez sur "Générer"</Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date *</Form.Label>
                  <Form.Control type="date" name="date" value={formData.date} onChange={handleInputChange} required />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Libellé *</Form.Label>
              <Form.Control type="text" name="libelle" value={formData.libelle} onChange={handleInputChange} required placeholder="Description..." />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Type *</Form.Label>
                  <Form.Select name="type_operation" value={formData.type_operation} onChange={handleInputChange} required>
                    <option value="">Sélectionnez...</option>
                    <option value="recette">Recette</option>
                    <option value="depense">Dépense</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Montant *</Form.Label>
                  <InputGroup>
                    <Form.Control type="number" step="0.01" name="montant" value={formData.montant} onChange={handleInputChange} required min="0.01" placeholder="0.00" />
                    <InputGroup.Text>MUR</InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Moyen de paiement</Form.Label>
                  <Form.Control type="text" name="cheque" value={formData.cheque} onChange={handleInputChange} placeholder="Chèque, virement..." />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Pièce jointe</Form.Label>
                  <Form.Control type="file" name="file" onChange={handleInputChange} accept=".pdf,.jpg,.png,.doc,.xlsx" />
                </Form.Group>
              </Col>
            </Row>
            {filePreview && <Alert variant="info"><FaInfoCircle className="me-2" />Fichier: {formData.file?.name}</Alert>}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setModals(p => ({ ...p, showAddModal: false }))} disabled={loading}>Annuler</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? <><Spinner size="sm" className="me-2" />Enregistrement...</> : 'Enregistrer'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ✅ MODAL ÉDITION - code_caisse ÉDITABLE */}
      <Modal show={modals.showEditModal} onHide={() => !loading && setModals(p => ({ ...p, showEditModal: false }))} size="lg" backdrop="static">
        <Modal.Header closeButton className="bg-primary text-white"><Modal.Title><FaEdit className="me-2" /> Modifier</Modal.Title></Modal.Header>
        <Form onSubmit={submitEditCaisse}>
          <Modal.Body>
            <input type="hidden" name="id" value={formData.id} />
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Code caisse *</Form.Label>
                  <InputGroup>
                    {/* ✅ CODE ÉDITABLE - readOnly supprimé */}
                    <Form.Control type="text" name="code_caisse" value={formData.code_caisse} onChange={handleInputChange} required />
                    <Button variant="outline-secondary" onClick={() => setFormData(p => ({ ...p, code_caisse: generateCodeCaisse() }))}>Générer</Button>
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date *</Form.Label>
                  <Form.Control type="date" name="date" value={formData.date} onChange={handleInputChange} required />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Libellé *</Form.Label>
              <Form.Control type="text" name="libelle" value={formData.libelle} onChange={handleInputChange} required />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Type *</Form.Label>
                  <Form.Select name="type_operation" value={formData.type_operation} onChange={handleInputChange} required>
                    <option value="recette">Recette</option>
                    <option value="depense">Dépense</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Montant *</Form.Label>
                  <InputGroup>
                    <Form.Control type="number" step="0.01" name="montant" value={formData.montant} onChange={handleInputChange} required min="0.01" />
                    <InputGroup.Text>MUR</InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Moyen de paiement</Form.Label>
                  <Form.Control type="text" name="cheque" value={formData.cheque} onChange={handleInputChange} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nouvelle pièce jointe</Form.Label>
                  <Form.Control type="file" name="file" onChange={handleInputChange} accept=".pdf,.jpg,.png,.doc,.xlsx" />
                </Form.Group>
              </Col>
            </Row>
            {currentCaisse?.file_url && <FilePreviewComponent fileUrl={currentCaisse.file_url} fileName={currentCaisse.file_name} />}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setModals(p => ({ ...p, showEditModal: false }))} disabled={loading}>Annuler</Button>
            <Button variant="primary" type="submit" disabled={loading}>{loading ? <><Spinner size="sm" className="me-2" />Mise à jour...</> : 'Mettre à jour'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal Détails */}
      <Modal show={modals.showDetailsModal} onHide={() => setModals(p => ({ ...p, showDetailsModal: false }))} size="md">
        <Modal.Header closeButton className="bg-info text-white"><Modal.Title><FaInfoCircle className="me-2" /> Détails</Modal.Title></Modal.Header>
        <Modal.Body>
          {currentCaisse && (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Code:</strong><div className="mb-2"><Badge bg={parseFloat(currentCaisse.recette) > 0 ? "success" : "danger"}>{currentCaisse.code_caisse}</Badge></div>
                  <strong>Date:</strong><div className="mb-2">{formatDisplayDate(currentCaisse.date)}</div>
                </Col>
                <Col md={6}>
                  <strong>Type:</strong><div className="mb-2">{parseFloat(currentCaisse.recette) > 0 ? <Badge bg="success">Recette</Badge> : <Badge bg="danger">Dépense</Badge>}</div>
                  <strong>Montant:</strong><div className="mb-2 fs-5 fw-bold">{parseFloat(currentCaisse.recette) > 0 ? <span className="text-success">+{currentCaisse.recetteFormatted} MUR</span> : <span className="text-danger">-{currentCaisse.depenseFormatted} MUR</span>}</div>
                </Col>
              </Row>
              <hr />
              <div className="mb-3"><strong>Libellé:</strong><div className="p-2 bg-light rounded">{currentCaisse.libelle}</div></div>
              <div className="mb-3"><strong>Moyen de paiement:</strong><div className="p-2 bg-light rounded">{currentCaisse.cheque || <span className="text-muted">Non spécifié</span>}</div></div>
              {currentCaisse.file_url && <div className="mb-3"><strong>Fichier:</strong><FilePreviewComponent fileUrl={currentCaisse.file_url} fileName={currentCaisse.file_name} /></div>}
            </>
          )}
        </Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={() => setModals(p => ({ ...p, showDetailsModal: false }))}>Fermer</Button></Modal.Footer>
      </Modal>

      {/* Modal Suppression */}
      <Modal show={modals.showDeleteModal} onHide={() => !loading && setModals(p => ({ ...p, showDeleteModal: false }))}>
        <Modal.Header closeButton className="bg-danger text-white"><Modal.Title><FaTrash className="me-2" /> Confirmer</Modal.Title></Modal.Header>
        <Modal.Body>
          {caisseToDelete && (
            <>
              <Alert variant="danger"><FaInfoCircle className="me-2" /><strong>Attention !</strong> Action irréversible.</Alert>
              <p>Supprimer cette opération ?</p>
              <div className="p-3 border rounded bg-light">
                <table className="table table-sm"><tbody>
                  <tr><td><strong>Code:</strong></td><td>{caisseToDelete.code_caisse}</td></tr>
                  <tr><td><strong>Libellé:</strong></td><td>{caisseToDelete.libelle}</td></tr>
                  <tr><td><strong>Date:</strong></td><td>{formatDisplayDate(caisseToDelete.date)}</td></tr>
                  <tr><td><strong>Montant:</strong></td><td className="fw-bold">{parseFloat(caisseToDelete.recette) > 0 ? `+${caisseToDelete.recetteFormatted} MUR` : `-${caisseToDelete.depenseFormatted} MUR`}</td></tr>
                </tbody></table>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModals(p => ({ ...p, showDeleteModal: false }))} disabled={loading}>Annuler</Button>
          <Button variant="danger" onClick={confirmDelete} disabled={loading}>{loading ? <><Spinner size="sm" className="me-2" />Suppression...</> : 'Confirmer'}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Dcaisse;