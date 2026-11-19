import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table, Button, Card, Spinner, Form, Modal, Toast, ToastContainer, Alert,
  InputGroup, Row, Col, Dropdown, Pagination, Badge, Breadcrumb
} from 'react-bootstrap';
import {
  FaMoneyBill, FaInfoCircle, FaSyncAlt, FaPlus, FaEdit, FaTrash,
  FaTimes, FaFileExport, FaPrint, FaChartLine, FaArrowLeft,
  FaFilter, FaCalendarAlt, FaFile, FaDownload, FaEye, FaSearch,
  FaMoneyCheckAlt, FaCreditCard, FaFileInvoice, FaCalculator, FaLock, FaUserShield, FaUser,
  FaFilePdf
} from 'react-icons/fa';
import axios from 'axios';
import { format, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

// ============================================
// CONFIGURATION API - PRODUCTION UNIQUEMENT
// ============================================
const API_BASE_URL = 'https://intranet-attm.com/api';
const APP_URL = 'https://intranet-attm.com';

console.log('🚀 Mode PRODUCTION activé');
console.log('📡 API URL:', API_BASE_URL);
console.log('🌐 APP URL:', APP_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// ✅ INTERCEPTEUR POUR GESTION AUTHENTIFICATION & RÔLES
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      console.warn('Session expirée');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    if (error.response?.status === 403) {
      console.warn('Accès refusé - Permissions insuffisantes');
    }
    return Promise.reject(error);
  }
);

const Dcaisse = ({ projetId, projetData, onRetour }) => {
  // ✅ ÉTATS PRINCIPAUX AVEC GESTION DES RÔLES
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({ caises: [] });
  const [statistiques, setStatistiques] = useState(null);

  // ✅ ÉTATS POUR L'AUTHENTIFICATION ET LES RÔLES
  const [userRole, setUserRole] = useState(null); // 'admin', 'Gest_Caisse' ou 'user'
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
    showDetailsModal: false,
    showPdfModal: false
  });

  const [currentCaisse, setCurrentCaisse] = useState(null);
  const [caisseToDelete, setCaisseToDelete] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [filePreview, setFilePreview] = useState(null);
  const [codeCaisseError, setCodeCaisseError] = useState('');

  const [formData, setFormData] = useState({
    code_caise: '', // ✅ Correction: code_caise (2 's')
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
  const isAdmin = useCallback(() => userRole === 'admin', [userRole]);
  const isGestCaisse = useCallback(() => userRole === 'Gest_Caisse', [userRole]);

  // ✅ FONCTION UTILITAIRE : Vérifier les permissions étendues
  const canEdit = useCallback(() => isAdmin() || isGestCaisse(), [userRole]);
  const canDelete = useCallback(() => isAdmin() || isGestCaisse(), [userRole]);
  const canAdd = useCallback(() => isAdmin() || isGestCaisse(), [userRole]);
  const canExport = useCallback(() => isAdmin() || isGestCaisse(), [userRole]);

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

  // ✅ Fonction pour valider le code caisse (unique pour le projet)
  const validerCodeCaisse = useCallback((code, idExclu = null) => {
    if (!code || code.trim() === '') {
      setCodeCaisseError('Le code caisse est obligatoire');
      return false;
    }
    
    // Vérifier l'unicité du code dans les caisses existantes du projet
    const codeExiste = data.caises.some(caisse => 
      caisse.code_caise === code && caisse.id !== idExclu
    );
    
    if (codeExiste) {
      setCodeCaisseError('Ce code caisse existe déjà pour ce projet');
      return false;
    }
    
    setCodeCaisseError('');
    return true;
  }, [data.caises]);

  // ✅ Function to view PDF in browser
  const handleViewPdf = useCallback(async (caisseId) => {
    try {
      setLoading(true);
      
      // URL production pour afficher le PDF
      const pdfUrl = `${API_BASE_URL}/caisses/${caisseId}/pdf`;
      console.log('📄 Ouverture PDF:', pdfUrl);
      window.open(pdfUrl, '_blank');
      
    } catch (err) {
      console.error("❌ Error opening PDF:", err);
      showToast('Erreur lors de l\'ouverture du PDF', 'danger');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // ✅ CHARGER LE RÔLE UTILISATEUR
  const fetchUserRole = useCallback(async () => {
    try {
      setUserLoading(true);
      setAuthError(null);

      // Récupérer depuis le localStorage si déjà connecté
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        const role = userData.role || userData.roles?.[0] || 'user';
        setUserRole(role);
        setUserLoading(false);
        return;
      }

      // Appeler l'API pour récupérer le rôle
      const token = localStorage.getItem('token');
      if (!token) {
        setUserRole('user'); // Par défaut si non authentifié
        setUserLoading(false);
        return;
      }

      const response = await api.get('/user');
      if (response.data) {
        const role = response.data.role || response.data.roles?.[0] || 'user';
        setUserRole(role);
        // Sauvegarder dans localStorage
        localStorage.setItem('user', JSON.stringify({
          id: response.data.id,
          email: response.data.email,
          name: response.data.name,
          role: role
        }));
      }
    } catch (err) {
      console.error('Erreur récupération rôle:', err);
      setAuthError('Impossible de vérifier les permissions');
      setUserRole('user'); // Par défaut en cas d'erreur
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

  // Fetch des caisses pour un projet spécifique
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const url = `/projets/${projetId}/caisses`;
      console.log('📡 Fetching data from:', `${API_BASE_URL}${url}`);
      
      const response = await api.get(url);
      let caissesData = [];

      if (response.data && response.data.success === false) {
        throw new Error(response.data.message || 'Erreur API');
      }
      if (response.data && response.data.data) {
        caissesData = response.data.data;
      } else if (Array.isArray(response.data)) {
        caissesData = response.data;
      }

      const caisesWithCalculations = caissesData.map(caisse => {
        const recette = parseFloat(caisse.recette) || 0;
        const depense = parseFloat(caisse.depense) || 0;
        
        // ✅ Utiliser le bon nom de champ
        const codeValue = caisse.code_caise || caisse.code || `CAISSE${caisse.id}`;
        
        return {
          id: caisse.id,
          code_caise: codeValue,
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
      if (err.response) {
        if (err.response.status === 500) {
          errorMessage = "Erreur serveur (500). Vérifiez les logs.";
        } else if (err.response.status === 404) {
          errorMessage = "Endpoint non trouvé.";
        } else if (err.response.status === 401) {
          errorMessage = "Authentification requise";
        } else if (err.response.status === 403) {
          errorMessage = "Accès refusé - Permissions insuffisantes";
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data?.error) {
          errorMessage = err.response.data.error;
        }
      } else if (err.request) {
        errorMessage = "Serveur inaccessible.";
      } else {
        errorMessage = err.message;
      }
      setError(errorMessage);
      showToast(errorMessage, 'danger');
    } finally {
      setLoading(false);
    }
  }, [projetId, formatMontant, calculerStatistiques, showToast]);

  // ✅ CHARGEMENT INITIAL : Rôle + Données
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
    } else if (name === 'code_caise') {
      setFormData(prev => ({ ...prev, [name]: value }));
      // Valider le code en temps réel
      if (value && value.trim() !== '') {
        validerCodeCaisse(value);
      } else {
        setCodeCaisseError('Le code caisse est obligatoire');
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const initCaisseForm = () => ({
    code_caise: '',
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
           caisse.code_caise?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
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
    setCodeCaisseError('');
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
      code_caise: caisse.code_caise,
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
    setCodeCaisseError('');
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

  // ✅ CRÉATION AVEC VÉRIFICATION DE SÉCURITÉ
  const submitAddCaisse = async (e) => {
    e.preventDefault();
    if (!canAdd()) {
      showToast("Action non autorisée. Vous n'avez pas les permissions nécessaires.", 'danger');
      return;
    }
    
    // Validation du code caisse
    if (!validerCodeCaisse(formData.code_caise)) {
      showToast(codeCaisseError || 'Le code caisse est invalide', 'danger');
      return;
    }
    
    try {
      setLoading(true);
      const recette = formData.type_operation === 'recette' ? formData.montant : '0';
      const depense = formData.type_operation === 'depense' ? formData.montant : '0';
      const formDataToSend = new FormData();
      
      // ✅ Utiliser 'code_caise' comme attendu par le modèle Laravel
      formDataToSend.append('code_caise', formData.code_caise);
      formDataToSend.append('libelle', formData.libelle);
      formDataToSend.append('recette', recette);
      formDataToSend.append('depense', depense);
      formDataToSend.append('date', formData.date);
      formDataToSend.append('projet', projetId);
      
      if (formData.cheque) {
        formDataToSend.append('cheque', formData.cheque);
      }
      if (formData.file) {
        formDataToSend.append('file', formData.file);
      }
      
      console.log('Envoi des données:', {
        code_caise: formData.code_caise,
        libelle: formData.libelle,
        recette,
        depense,
        date: formData.date,
        projet: projetId
      });
      
      const url = `/projets/${projetId}/caisses/creer`;
      const response = await axios.post(`${API_BASE_URL}${url}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        }
      });
      
      console.log('Réponse API:', response.data);
      
      showToast('Opération créée avec succès', 'success');
      await fetchData();
      setModals(prev => ({ ...prev, showAddModal: false }));
      setFilePreview(null);
      setCodeCaisseError('');
    } catch (err) {
      console.error("❌ Erreur détaillée:", err.response?.data);
      if (err.response?.status === 403) {
        showToast("Accès refusé. Vous n'avez pas les permissions nécessaires.", 'danger');
      } else if (err.response?.data?.errors) {
        const errorMessages = Object.entries(err.response.data.errors)
          .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
          .join('\n');
        showToast(`Erreurs: ${errorMessages}`, 'danger');
      } else if (err.response?.data?.message) {
        if (err.response.data.message.includes('code_caise')) {
          setCodeCaisseError('Ce code caisse existe déjà');
          showToast('Ce code caisse existe déjà pour ce projet', 'danger');
        } else {
          showToast(`Erreur: ${err.response.data.message}`, 'danger');
        }
      } else {
        showToast('Erreur lors de la création', 'danger');
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ ÉDITION AVEC VÉRIFICATION DE SÉCURITÉ
  const submitEditCaisse = async (e) => {
    e.preventDefault();
    if (!canEdit()) {
      showToast("Action non autorisée", 'danger');
      return;
    }
    
    // Validation du code caisse (exclure l'enregistrement en cours)
    if (!validerCodeCaisse(formData.code_caise, formData.id)) {
      showToast(codeCaisseError || 'Le code caisse est invalide', 'danger');
      return;
    }
    
    try {
      setLoading(true);
      const recette = formData.type_operation === 'recette' ? formData.montant : '0';
      const depense = formData.type_operation === 'depense' ? formData.montant : '0';
      const formDataToSend = new FormData();
      
      // ✅ Utiliser 'code_caise' comme attendu par le modèle Laravel
      formDataToSend.append('code_caise', formData.code_caise);
      formDataToSend.append('libelle', formData.libelle);
      formDataToSend.append('recette', recette);
      formDataToSend.append('depense', depense);
      formDataToSend.append('date', formData.date);
      if (formData.cheque) formDataToSend.append('cheque', formData.cheque);
      formDataToSend.append('_method', 'PUT');
      if (formData.file) {
        formDataToSend.append('file', formData.file);
      }
      
      const url = `/caisses/${formData.id}`;
      const response = await axios.post(`${API_BASE_URL}${url}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        }
      });
      
      showToast('Opération modifiée avec succès', 'success');
      await fetchData();
      setModals(prev => ({ ...prev, showEditModal: false }));
      setFilePreview(null);
      setCodeCaisseError('');
    } catch (err) {
      console.error("❌ Erreur édition:", err.response?.data || err.message);
      if (err.response?.status === 403) {
        showToast("Accès refusé. Vous n'avez pas les permissions nécessaires.", 'danger');
      } else {
        let errorMsg = "Erreur lors de la modification";
        if (err.response?.data) {
          if (err.response.data.errors) {
            errorMsg = Object.entries(err.response.data.errors)
              .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
              .join('; ');
          } else if (err.response.data.message) {
            if (err.response.data.message.includes('code_caise')) {
              setCodeCaisseError('Ce code caisse existe déjà');
              errorMsg = 'Ce code caisse existe déjà pour ce projet';
            } else {
              errorMsg = err.response.data.message;
            }
          }
        }
        showToast(`Erreur: ${errorMsg}`, 'danger');
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ SUPPRESSION AVEC VÉRIFICATION DE SÉCURITÉ
  const confirmDelete = async () => {
    if (!canDelete()) {
      showToast("Action non autorisée", 'danger');
      return;
    }
    try {
      setLoading(true);
      const url = `/caisses/${caisseToDelete.id}`;
      const response = await api.delete(url);
      showToast('Opération supprimée avec succès', 'success');
      await fetchData();
      setModals(prev => ({ ...prev, showDeleteModal: false }));
    } catch (err) {
      console.error("❌ Erreur suppression:", err.response?.data || err.message);
      if (err.response?.status === 403) {
        showToast("Accès refusé. Vous n'avez pas les permissions nécessaires.", 'danger');
      } else {
        const msg = err.response?.data?.message ||
          err.response?.data?.error ||
          "Erreur lors de la suppression";
        showToast(`Erreur: ${msg}`, 'danger');
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ EXPORT AVEC VÉRIFICATION DE RÔLE
  const handleExport = async () => {
    if (!canExport()) {
      showToast("Seuls les administrateurs et gestionnaires de caisse peuvent exporter les données", 'warning');
      return;
    }
    try {
      setLoading(true);
      const exportData = {
        projet_id: projetId,
        filters: filters,
        date: new Date().toISOString()
      };
      const response = await api.post('/caisses/export', exportData, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `export-caisses-projet-${projetId}-${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('Export Excel généré avec succès', 'success');
    } catch (err) {
      console.error("❌ Erreur export:", err);
      if (err.response?.status === 403) {
        showToast("Accès refusé pour l'export", 'danger');
      } else {
        showToast('Erreur lors de l\'export', 'danger');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFile = async (caisseId, fileName) => {
    try {
      const response = await api.get(`/caisses/${caisseId}/download`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || `document-${caisseId}`);
      document.body.appendChild(link);
      link.click();
      
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showToast('Fichier téléchargé avec succès', 'success');
    } catch (err) {
      console.error("❌ Erreur téléchargement:", err);
      showToast('Erreur lors du téléchargement du fichier', 'danger');
    }
  };

  const resetFilters = () => {
    setFilters({
      searchQuery: '',
      dateRange: { start: null, end: null },
      typeOperation: 'all'
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const normalizeFileUrl = (fileUrl) => {
    if (!fileUrl) return null;
    if (fileUrl.startsWith('http')) return fileUrl;
    if (fileUrl.startsWith('/storage/')) {
      return `${APP_URL}${fileUrl}`;
    }
    if (fileUrl.startsWith('/')) {
      return `${APP_URL}${fileUrl}`;
    }
    return `${APP_URL}/storage/${fileUrl}`;
  };

  // ✅ COMPOSANT FILEPREVIEW avec support PDF amélioré
  const FilePreviewComponent = ({ fileUrl, fileName, caisseId }) => {
    if (!fileUrl && !caisseId) return null;
    
    const normalizedUrl = normalizeFileUrl(fileUrl);
    const isImage = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fileUrl || '');
    const isPdf = /\.pdf$/i.test(fileUrl || '');
    
    return (
      <div className="mt-3 p-3 border rounded bg-light">
        <h6><FaFile className="me-2" /> Fichier joint</h6>
        <div className="d-flex align-items-center">
          <div className="me-3">
            {isImage ? (
              <FaFileInvoice size={32} className="text-primary" />
            ) : isPdf ? (
              <FaFilePdf size={32} className="text-danger" />
            ) : (
              <FaFile size={32} className="text-secondary" />
            )}
          </div>
          <div className="flex-grow-1">
            <div className="small text-muted">
              Nom: {fileName || (fileUrl ? fileUrl.split('/').pop() : 'document')}
              {isPdf && ' (PDF)'}
            </div>
            <div className="btn-group mt-2" role="group">
              {isPdf && caisseId ? (
                <>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleViewPdf(caisseId)}
                    className="me-2"
                    title="Ouvrir le PDF dans le navigateur"
                  >
                    <FaFilePdf className="me-1" /> Voir PDF
                  </Button>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => window.open(normalizedUrl, '_blank')}
                    title="Télécharger le fichier"
                  >
                    <FaDownload className="me-1" /> Télécharger
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => window.open(normalizedUrl, '_blank')}
                  className="me-2"
                  title="Ouvrir le fichier"
                >
                  <FaEye className="me-1" /> Voir / Télécharger
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ✅ AFFICHAGE PENDANT LE CHARGEMENT DU RÔLE
  if (userLoading) {
    return (
      <div className="container-fluid py-3 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Vérification des permissions...</p>
      </div>
    );
  }

  // ✅ RENDER CONTENT AVEC CONTRÔLE D'ACCÈS
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
                <FaPlus className="me-1" />
                Créer la première opération
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
            <Toast
              key={toast.id}
              onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              bg={toast.variant}
              autohide
              delay={5000}
            >
              <Toast.Body className="text-white">
                {toast.message}
              </Toast.Body>
            </Toast>
          ))}
        </ToastContainer>

        {/* Filtres */}
        <Card className="mb-4 shadow-sm">
          <Card.Header className="bg-light d-flex justify-content-between align-items-center">
            <h5 className="mb-0"><FaFilter className="me-2" /> Recherche</h5>
            <Button
              variant="light"
              onClick={fetchData}
              disabled={loading}
              className="d-flex align-items-center"
            >
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
                    <Form.Control
                      type="text"
                      placeholder="Code, libellé, chèque..."
                      value={filters.searchQuery}
                      onChange={e => {
                        setFilters(p => ({ ...p, searchQuery: e.target.value }));
                        setPagination(p => ({ ...p, currentPage: 1 }));
                      }}
                    />
                    <InputGroup.Text><FaSearch /></InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Type d'opération</Form.Label>
                  <Form.Select
                    value={filters.typeOperation}
                    onChange={e => {
                      setFilters(p => ({ ...p, typeOperation: e.target.value }));
                      setPagination(p => ({ ...p, currentPage: 1 }));
                    }}
                  >
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
                    <Form.Control
                      type="date"
                      value={filters.dateRange.start || ''}
                      onChange={e => setFilters(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, start: e.target.value }
                      }))}
                    />
                    <InputGroup.Text><FaCalendarAlt /></InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label>Date fin</Form.Label>
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
                    <InputGroup.Text><FaCalendarAlt /></InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={1} className="d-flex align-items-end">
                <Button
                  variant="outline-primary"
                  onClick={() => setPagination(p => ({ ...p, currentPage: 1 }))}
                  className="w-100"
                >
                  Filtrer
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Statistiques */}
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0"><FaChartLine className="me-2" /> Statistiques du projet</h5>
              <Button
                variant="outline-info"
                size="sm"
                onClick={recalculerStatistiques}
                title="Recalculer les statistiques"
              >
                <FaCalculator className="me-1" /> Recalculer
              </Button>
            </div>
            <Row>
              <Col md={3}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body className="text-center">
                    <div className="text-muted small mb-1">Total opérations</div>
                    <div className="fs-4 fw-bold text-primary">{stats.totalOperations}</div>
                    <small className="text-muted">
                      {data.caises.length} total • {filteredCaises.length} filtrées
                    </small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border-0 shadow-sm h-100 bg-success bg-opacity-10">
                  <Card.Body className="text-center">
                    <div className="text-muted small mb-1">Total recettes</div>
                    <div className="fs-4 fw-bold text-success">
                      {formatMontant(stats.totalRecette)}
                    </div>
                    <small className="text-muted">
                      {stats.totalOperations > 0 ? formatMontant(stats.totalRecette / stats.totalOperations) : '0,00'} moyenne
                    </small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border-0 shadow-sm h-100 bg-danger bg-opacity-10">
                  <Card.Body className="text-center">
                    <div className="text-muted small mb-1">Total dépenses</div>
                    <div className="fs-4 fw-bold text-danger">
                      {formatMontant(stats.totalDepense)}
                    </div>
                    <small className="text-muted">
                      {stats.totalOperations > 0 ? formatMontant(stats.totalDepense / stats.totalOperations) : '0,00'} moyenne
                    </small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className={`border-0 shadow-sm h-100 ${stats.soldeTotal >= 0 ? 'bg-info bg-opacity-10' : 'bg-warning bg-opacity-10'}`}>
                  <Card.Body className="text-center">
                    <div className="text-muted small mb-1">Solde total</div>
                    <div className={`fs-4 fw-bold ${stats.soldeTotal >= 0 ? 'text-success' : 'text-danger'}`}>
                      {formatMontant(stats.soldeTotal)}
                    </div>
                    <small className="text-muted">
                      {stats.soldeTotal >= 0 ? 'Positif' : 'Négatif'}
                    </small>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            {stats.totalOperations > 0 && (
              <div className="mt-4">
                <div className="d-flex justify-content-between mb-2">
                  <small>Récapitulatif</small>
                  <small>
                    Recettes: {formatMontant(stats.totalRecette)} •
                    Dépenses: {formatMontant(stats.totalDepense)} •
                    Solde: {formatMontant(stats.soldeTotal)}
                  </small>
                </div>
                <div className="progress" style={{ height: '20px' }}>
                  <div
                    className="progress-bar bg-success"
                    style={{
                      width: `${stats.totalRecette + stats.totalDepense > 0 ?
                        (stats.totalRecette / (stats.totalRecette + stats.totalDepense) * 100) : 0}%`
                    }}
                    title={`Recettes: ${formatMontant(stats.totalRecette)}`}
                  >
                    Recettes
                  </div>
                  <div
                    className="progress-bar bg-danger"
                    style={{
                      width: `${stats.totalRecette + stats.totalDepense > 0 ?
                        (stats.totalDepense / (stats.totalRecette + stats.totalDepense) * 100) : 0}%`
                    }}
                    title={`Dépenses: ${formatMontant(stats.totalDepense)}`}
                  >
                    Dépenses
                  </div>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Tableau des caisses */}
        <div className="table-responsive mb-4">
          <Table striped bordered hover className="align-middle">
            <thead className="table-dark">
              <tr>
                
                <th width="120">Code</th>
                <th width="100">Date</th>
                <th>Libellé</th>
                <th width="120" className="text-end">Recette</th>
                <th width="120" className="text-end">Dépense</th>
                <th width="120">Moyen.T</th>
                <th width="100">Fichier</th>
                <th width="140">Actions</th>
               </tr>
            </thead>
            <tbody>
              {paginatedCaises.length > 0 ? (
                paginatedCaises.map(caisse => {
                  const isRecette = parseFloat(caisse.recette) > 0;
                  const isPdfFile = caisse.file_url && /\.pdf$/i.test(caisse.file_url);
                  
                  return (
                    <tr key={caisse.id}>
                      <td>
                        <Badge bg={isRecette ? "success" : "danger"}>
                          {caisse.code_caise}
                        </Badge>
                      </td>
                      <td>
                        <small>{formatDisplayDate(caisse.date)}</small>
                      </td>
                      <td>
                        <div className="fw-medium">{caisse.libelle}</div>
                      </td>
                      <td className="text-end">
                        {isRecette ? (
                          <span className="fw-bold text-success">+{caisse.recetteFormatted}</span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="text-end">
                        {!isRecette ? (
                          <span className="fw-bold text-danger">-{caisse.depenseFormatted}</span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        {caisse.cheque ? (
                          <Badge bg="info" className="d-inline-flex align-items-center">
                            <FaCreditCard className="me-1" /> {caisse.cheque}
                          </Badge>
                        ) : (
                          <Badge bg="secondary">Espèces</Badge>
                        )}
                      </td>
                      <td>
                        {caisse.file_url ? (
                          <div className="d-flex gap-1">
                            {isPdfFile ? (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleViewPdf(caisse.id)}
                                title="Voir le PDF dans le navigateur"
                              >
                                <FaFilePdf /> Voir
                              </Button>
                            ) : (
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => window.open(normalizeFileUrl(caisse.file_url), '_blank')}
                                title="Voir le fichier"
                              >
                                <FaEye />
                              </Button>
                            )}
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleDownloadFile(caisse.id, caisse.file_name)}
                              title="Télécharger"
                            >
                              <FaDownload />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm" role="group">
                          <Button
                            variant="outline-info"
                            onClick={() => handleViewDetails(caisse)}
                            title="Détails"
                          >
                            <FaInfoCircle />
                          </Button>
                          {canEdit() ? (
                            <Button
                              variant="outline-primary"
                              onClick={() => handleEditCaisse(caisse)}
                              title="Modifier"
                            >
                              <FaEdit />
                            </Button>
                          ) : (
                            <Button
                              variant="outline-secondary"
                              disabled
                              title="Modification réservée aux administrateurs et gestionnaires de caisse"
                            >
                              <FaLock />
                            </Button>
                          )}
                          {canDelete() ? (
                            <Button
                              variant="outline-danger"
                              onClick={() => handleDeleteCaisse(caisse)}
                              title="Supprimer"
                            >
                              <FaTrash />
                            </Button>
                          ) : (
                            <Button
                              variant="outline-secondary"
                              disabled
                              title="Suppression réservée aux administrateurs et gestionnaires de caisse"
                            >
                              <FaLock />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-5">
                    <div className="d-flex flex-column align-items-center">
                      <FaMoneyBill size={48} className="text-muted mb-3" />
                      <h5 className="text-muted">Aucune opération trouvée</h5>
                      <p className="text-muted mb-3">
                        {data.caises.length === 0
                          ? "Ce projet n'a pas encore d'opérations de caisse"
                          : "Aucune donnée ne correspond à vos filtres"}
                      </p>
                      {canAdd() && (
                        <Button
                          variant="primary"
                          onClick={handleAddCaisse}
                          className="mt-2"
                        >
                          <FaPlus className="me-2" />
                          Ajouter une opération
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>

        {/* Pagination */}
        {filteredCaises.length > pagination.itemsPerPage && (
          <Card className="shadow-sm">
            <Card.Body className="py-2">
              <div className="d-flex justify-content-between align-items-center">
                <div className="text-muted small">
                  Page {pagination.currentPage} sur {totalPages} •
                  {paginatedCaises.length} opérations affichées
                </div>
                <Pagination className="mb-0">
                  <Pagination.First
                    onClick={() => setPagination(p => ({ ...p, currentPage: 1 }))}
                    disabled={pagination.currentPage === 1}
                  />
                  <Pagination.Prev
                    onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage - 1 }))}
                    disabled={pagination.currentPage === 1}
                  />
                  {(() => {
                    const items = [];
                    const maxVisible = 5;
                    let start = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2));
                    let end = Math.min(totalPages, start + maxVisible - 1);
                    if (end - start + 1 < maxVisible) {
                      start = Math.max(1, end - maxVisible + 1);
                    }
                    for (let i = start; i <= end; i++) {
                      items.push(
                        <Pagination.Item
                          key={i}
                          active={i === pagination.currentPage}
                          onClick={() => setPagination(p => ({ ...p, currentPage: i }))}
                        >
                          {i}
                        </Pagination.Item>
                      );
                    }
                    return items;
                  })()}
                  <Pagination.Next
                    onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage + 1 }))}
                    disabled={pagination.currentPage === totalPages}
                  />
                  <Pagination.Last
                    onClick={() => setPagination(p => ({ ...p, currentPage: totalPages }))}
                    disabled={pagination.currentPage === totalPages}
                  />
                </Pagination>
              </div>
            </Card.Body>
          </Card>
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
              <Button
                variant="outline-light"
                onClick={onRetour}
                className="d-flex align-items-center"
              >
                <FaArrowLeft className="me-1" />
                <span>Retour</span>
              </Button>
            </Col>
            <Col xs={12} md={6} className="mt-2 mt-md-0">
              <div className="d-flex flex-wrap justify-content-md-end gap-2 align-items-center">
                {/* ✅ BADGE DE RÔLE UTILISATEUR */}
                <Badge bg={(isAdmin() || isGestCaisse()) ? 'success' : 'secondary'} className="me-2 py-2">
                  {isAdmin() ? <><FaUserShield className="me-1" /> Admin</> :
                   isGestCaisse() ? <><FaUserShield className="me-1" /> Gest. Caisse</> :
                   <><FaUser className="me-1" /> Consultation</>}
                </Badge>
                {/* ✅ BOUTON EXPORT CONDITIONNEL */}
                {canExport() ? (
                  <Button
                    variant="warning"
                    onClick={handleExport}
                    disabled={loading || data.caises.length === 0}
                    className="d-flex align-items-center"
                  >
                    <FaFileExport className="me-1" />
                    <span>Exporter</span>
                  </Button>
                ) : (
                  <Button
                    variant="outline-secondary"
                    disabled
                    className="d-flex align-items-center"
                    title="Export réservé aux administrateurs et gestionnaires de caisse"
                  >
                    <FaFileExport className="me-1" />
                    <span>Exporter</span>
                    <FaLock className="ms-1" size={12} />
                  </Button>
                )}
                {/* ✅ BOUTON AJOUT CONDITIONNEL */}
                {canAdd() ? (
                  <Button
                    variant="primary"
                    onClick={handleAddCaisse}
                    disabled={loading}
                    className="d-flex align-items-center"
                  >
                    <FaPlus className="me-1" />
                    <span>Nouvelle opération</span>
                  </Button>
                ) : (
                  <Button
                    variant="outline-secondary"
                    disabled
                    className="d-flex align-items-center"
                    title="Ajout réservé aux administrateurs et gestionnaires de caisse"
                  >
                    <FaPlus className="me-1" />
                    <span>Nouvelle opération</span>
                    <FaLock className="ms-1" size={12} />
                  </Button>
                )}
              </div>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body className="p-3">
          {renderContent()}
        </Card.Body>
      </Card>

      {/* ✅ MODAL AJOUT */}
      {modals.showAddModal && !canAdd() ? (
        <Modal show={true} onHide={() => setModals(p => ({ ...p, showAddModal: false }))} centered>
          <Modal.Header closeButton className="bg-warning">
            <Modal.Title><FaLock className="me-2" /> Accès restreint</Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-center">
            <Alert variant="warning">
              <FaInfoCircle className="me-2" />
              <strong>Permission refusée</strong>
              <p className="mb-0 mt-2">
                Vous devez être administrateur ou gestionnaire de caisse pour ajouter des opérations.
              </p>
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setModals(p => ({ ...p, showAddModal: false }))}>
              Fermer
            </Button>
          </Modal.Footer>
        </Modal>
      ) : modals.showAddModal && (
        <Modal show={modals.showAddModal} onHide={() => !loading && setModals(p => ({ ...p, showAddModal: false }))} size="lg" backdrop="static">
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title><FaPlus className="me-2" /> Nouvelle opération de caisse</Modal.Title>
          </Modal.Header>
          <Form onSubmit={submitAddCaisse}>
            <Modal.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Code caisse *</Form.Label>
                    <Form.Control
                      type="text"
                      name="code_caise"
                      value={formData.code_caise}
                      onChange={handleInputChange}
                      required
                     
                    />
                    {codeCaisseError && (
                      <Form.Control.Feedback type="invalid">
                        {codeCaisseError}
                      </Form.Control.Feedback>
                    )}
                    <Form.Text className="text-muted">
                      Saisissez un code unique pour cette opération (ex: REC-2024-001, DEP-001, RANL-001, etc.)
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Date de l'opération *</Form.Label>
                    <Form.Control
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Libellé *</Form.Label>
                    <Form.Control
                      type="text"
                      name="libelle"
                      value={formData.libelle}
                      onChange={handleInputChange}
                      required
                      placeholder="Description détaillée de l'opération"
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Type d'opération *</Form.Label>
                    <Form.Select
                      name="type_operation"
                      value={formData.type_operation}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Sélectionnez le type...</option>
                      <option value="recette">Recette (entrée d'argent)</option>
                      <option value="depense">Dépense (sortie d'argent)</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Montant *</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="number"
                        step="0.01"
                        name="montant"
                        value={formData.montant}
                        onChange={handleInputChange}
                        required
                        min="0.01"
                        placeholder="0.00"
                      />
                      <InputGroup.Text>MUR</InputGroup.Text>
                    </InputGroup>
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Moyen de paiement</Form.Label>
                    <Form.Control
                      type="text"
                      name="cheque"
                      value={formData.cheque}
                      onChange={handleInputChange}
                      placeholder="Numéro de chèque, virement, espèces..."
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Pièce jointe</Form.Label>
                    <Form.Control
                      type="file"
                      name="file"
                      onChange={handleInputChange}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                    />
                  </Form.Group>
                </Col>
              </Row>
              {filePreview && (
                <Alert variant="info">
                  <FaInfoCircle className="me-2" />
                  Fichier sélectionné: {formData.file?.name}
                </Alert>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setModals(p => ({ ...p, showAddModal: false }))}
                disabled={loading}
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
                    <Spinner as="span" size="sm" animation="border" className="me-2" />
                    Enregistrement...
                  </>
                ) : 'Enregistrer'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      )}

      {/* ✅ MODAL ÉDITION */}
      {modals.showEditModal && !canEdit() ? (
        <Modal show={true} onHide={() => setModals(p => ({ ...p, showEditModal: false }))} centered>
          <Modal.Header closeButton className="bg-warning">
            <Modal.Title><FaLock className="me-2" /> Accès restreint</Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-center">
            <Alert variant="warning">
              <FaInfoCircle className="me-2" />
              <strong>Permission refusée</strong>
              <p className="mb-0 mt-2">
                Vous devez être administrateur ou gestionnaire de caisse pour modifier des opérations.
              </p>
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setModals(p => ({ ...p, showEditModal: false }))}>
              Fermer
            </Button>
          </Modal.Footer>
        </Modal>
      ) : modals.showEditModal && (
        <Modal show={modals.showEditModal} onHide={() => !loading && setModals(p => ({ ...p, showEditModal: false }))} size="lg" backdrop="static">
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title><FaEdit className="me-2" /> Modifier l'opération</Modal.Title>
          </Modal.Header>
          <Form onSubmit={submitEditCaisse}>
            <Modal.Body>
              <input type="hidden" name="id" value={formData.id} />
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Code caise *</Form.Label>
                    <Form.Control
                      type="text"
                      name="code_caise"
                      value={formData.code_caise}
                      onChange={handleInputChange}
                      required
                      isInvalid={!!codeCaisseError}
                    />
                    {codeCaisseError && (
                      <Form.Control.Feedback type="invalid">
                        {codeCaisseError}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Date *</Form.Label>
                    <Form.Control
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Libellé *</Form.Label>
                <Form.Control
                  type="text"
                  name="libelle"
                  value={formData.libelle}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Type d'opération *</Form.Label>
                    <Form.Select
                      name="type_operation"
                      value={formData.type_operation}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="recette">Recette</option>
                      <option value="depense">Dépense</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Montant *</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="number"
                        step="0.01"
                        name="montant"
                        value={formData.montant}
                        onChange={handleInputChange}
                        required
                        min="0.01"
                      />
                      <InputGroup.Text>MUR</InputGroup.Text>
                    </InputGroup>
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Moyen de paiement</Form.Label>
                    <Form.Control
                      type="text"
                      name="cheque"
                      value={formData.cheque}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nouvelle pièce jointe</Form.Label>
                    <Form.Control
                      type="file"
                      name="file"
                      onChange={handleInputChange}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                    />
                  </Form.Group>
                </Col>
              </Row>
              {currentCaisse?.file_url && (
                <FilePreviewComponent
                  fileUrl={currentCaisse.file_url}
                  fileName={currentCaisse.file_name}
                  caisseId={currentCaisse.id}
                />
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setModals(p => ({ ...p, showEditModal: false }))}
                disabled={loading}
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
                    <Spinner as="span" size="sm" animation="border" className="me-2" />
                    Mise à jour...
                  </>
                ) : 'Mettre à jour'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      )}

      {/* Modal Détails (accessible à tous) */}
      <Modal show={modals.showDetailsModal} onHide={() => setModals(p => ({ ...p, showDetailsModal: false }))} size="md">
        <Modal.Header closeButton className="bg-info text-white">
          <Modal.Title><FaInfoCircle className="me-2" /> Détails de l'opération</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentCaisse && (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Code:</strong>
                  <div className="mb-2">
                    <Badge bg={parseFloat(currentCaisse.recette) > 0 ? "success" : "danger"}>
                      {currentCaisse.code_caise}
                    </Badge>
                  </div>
                  <strong>Date:</strong>
                  <div className="mb-2">{formatDisplayDate(currentCaisse.date)}</div>
                </Col>
                <Col md={6}>
                  <strong>Type:</strong>
                  <div className="mb-2">
                    {parseFloat(currentCaisse.recette) > 0 ? (
                      <Badge bg="success">Recette</Badge>
                    ) : (
                      <Badge bg="danger">Dépense</Badge>
                    )}
                  </div>
                  <strong>Montant:</strong>
                  <div className="mb-2 fs-5 fw-bold">
                    {parseFloat(currentCaisse.recette) > 0 ? (
                      <span className="text-success">+{currentCaisse.recetteFormatted} MUR</span>
                    ) : (
                      <span className="text-danger">-{currentCaisse.depenseFormatted} MUR</span>
                    )}
                  </div>
                </Col>
              </Row>
              <hr />
              <div className="mb-3">
                <strong>Libellé:</strong>
                <div className="p-2 bg-light rounded">{currentCaisse.libelle}</div>
              </div>
              <div className="mb-3">
                <strong>Moyen de paiement:</strong>
                <div className="p-2 bg-light rounded">
                  {currentCaisse.cheque || <span className="text-muted">Non spécifié</span>}
                </div>
              </div>
              {currentCaisse.file_url && (
                <div className="mb-3">
                  <strong>Fichier joint:</strong>
                  <FilePreviewComponent
                    fileUrl={currentCaisse.file_url}
                    fileName={currentCaisse.file_name}
                    caisseId={currentCaisse.id}
                  />
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModals(p => ({ ...p, showDetailsModal: false }))}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ✅ MODAL SUPPRESSION */}
      {modals.showDeleteModal && !canDelete() ? (
        <Modal show={true} onHide={() => setModals(p => ({ ...p, showDeleteModal: false }))} centered>
          <Modal.Header closeButton className="bg-warning">
            <Modal.Title><FaLock className="me-2" /> Accès restreint</Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-center">
            <Alert variant="warning">
              <FaInfoCircle className="me-2" />
              <strong>Permission refusée</strong>
              <p className="mb-0 mt-2">
                Vous devez être administrateur ou gestionnaire de caisse pour supprimer des opérations.
              </p>
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setModals(p => ({ ...p, showDeleteModal: false }))}>
              Fermer
            </Button>
          </Modal.Footer>
        </Modal>
      ) : modals.showDeleteModal && (
        <Modal show={modals.showDeleteModal} onHide={() => !loading && setModals(p => ({ ...p, showDeleteModal: false }))}>
          <Modal.Header closeButton className="bg-danger text-white">
            <Modal.Title><FaTrash className="me-2" /> Confirmer la suppression</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {caisseToDelete && (
              <>
                <Alert variant="danger">
                  <FaInfoCircle className="me-2" />
                  <strong>Attention !</strong> Cette action est irréversible.
                </Alert>
                <p>Êtes-vous sûr de vouloir supprimer cette opération ?</p>
                <div className="p-3 border rounded bg-light">
                  <table className="table table-sm">
                    <tbody>
                      <tr>
                        <td><strong>Code:</strong></td>
                        <td>{caisseToDelete.code_caise}</td>
                      </tr>
                      <tr>
                        <td><strong>Libellé:</strong></td>
                        <td>{caisseToDelete.libelle}</td>
                      </tr>
                      <tr>
                        <td><strong>Date:</strong></td>
                        <td>{formatDisplayDate(caisseToDelete.date)}</td>
                      </tr>
                      <tr>
                        <td><strong>Montant:</strong></td>
                        <td className="fw-bold">
                          {parseFloat(caisseToDelete.recette) > 0
                            ? `+${caisseToDelete.recetteFormatted} MUR`
                            : `-${caisseToDelete.depenseFormatted} MUR`
                          }
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setModals(p => ({ ...p, showDeleteModal: false }))}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner as="span" size="sm" animation="border" className="me-2" />
                  Suppression...
                </>
              ) : 'Confirmer la suppression'}
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export default Dcaisse;