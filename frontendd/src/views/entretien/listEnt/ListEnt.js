import React, { useState, useEffect } from 'react';
import {
  Table, Button, Form, Badge, Alert, Spinner, Modal,
  InputGroup, Card, Row, Col
} from 'react-bootstrap';
import {
  FaEdit, FaTrash, FaPlus, FaSearch, FaFilter,
  FaExclamationTriangle, FaCar, FaSync, FaLock,
  FaUserShield, FaUser, FaEye, FaTimes
} from 'react-icons/fa';

// ============================================
// GESTION DES VARIABLES D'ENVIRONNEMENT - PRODUCTION
// ============================================

// URLs de production HARDCODÉES - SANS TRAILING SLASH
const API_BASE_URL = 'https://intranet-attm.com/api';
const APP_URL = 'https://intranet-attm.com';

// URLs spécifiques
const VIDANGES_URL = `${API_BASE_URL}/vidanges`;
const VOITURES_URL = `${API_BASE_URL}/voitures`;
const PRODUCTIONS_URL = `${API_BASE_URL}/productions`;
const PROJETS_URL = `${API_BASE_URL}/projets`;
const AUTH_API_URL = 'https://intranet-attm.com/api';

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
    },
  };

  if (options.body instanceof FormData) {
    delete defaultOptions.headers['Content-Type'];
  }

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Erreur HTTP: ${response.status}`);
  }

  return response;
};

const GestionVidanges = () => {
  // ============================================
  // GESTION DES RÔLES UTILISATEUR
  // ============================================
  const [userRole, setUserRole] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  const isAdmin = () => userRole === 'admin' || userRole === 'administrateur';
  const isChefEnt = () => userRole === 'chef_Ent' || userRole === 'chef_entretien';
  const canModify = () => isAdmin() || isChefEnt();

  // Charger le rôle utilisateur au montage
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        setUserLoading(true);
        
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
        if (token) {
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
  // ÉTATS PRINCIPAUX
  // ============================================
  const [vidanges, setVidanges] = useState([]);
  const [voitures, setVoitures] = useState([]);
  const [productions, setProductions] = useState([]);
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingVidange, setEditingVidange] = useState(null);
  const [projetAssocie, setProjetAssocie] = useState(null);
  const [showUrgentOnly, setShowUrgentOnly] = useState(false);
  const [showWarningOnly, setShowWarningOnly] = useState(false);
  
  // États pour la recherche de voiture dans le modal
  const [searchVoitureTerm, setSearchVoitureTerm] = useState('');
  const [filteredVoitures, setFilteredVoitures] = useState([]);
  const [showVoitureDropdown, setShowVoitureDropdown] = useState(false);
  
  const [formData, setFormData] = useState({
    voiture_id: '',
    date_visite: '',
    type_vidange: '',
    compteur_visite: '',
    compteur_actuel: '',
    projet_id: ''
  });

  // Filtres
  const [filters, setFilters] = useState({
    searchTerm: '',
    filterVoiture: '',
    filterProjet: '',
    filterType: ''
  });

  // ============================================
  // FONCTION POUR OBTENIR LE DERNIER COMPTEUR FIN D'UNE VOITURE
  // ============================================
  
  const getLastCompteurFinForVoiture = (voitureId) => {
    if (!voitureId || !productions.length) return 0;
    
    // Filtrer les productions pour cette voiture
    const productionsVoiture = productions.filter(p => p && p.voiture_id === voitureId);
    
    if (productionsVoiture.length === 0) return 0;
    
    // Trier par date de création (la plus récente d'abord)
    productionsVoiture.sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation));
    
    // Retourner le compteur_fin de la production la plus récente
    return productionsVoiture[0].compteur_fin || 0;
  };

  // ============================================
  // FONCTION DE SYNCHRONISATION AVEC LES PRODUCTIONS
  // ============================================
  
  const updateProductionWithNewCompteur = async (voitureId, nouveauCompteur, projetId = null, date = null) => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      
      if (!voitureId) return;
      
      // 1. Récupérer toutes les productions de ce véhicule
      const response = await fetch(`${PRODUCTIONS_URL}?voiture_id=${voitureId}`, {
        headers: { 
          'Authorization': token ? `Bearer ${token}` : '', 
          'Accept': 'application/json' 
        }
      });
      
      if (!response.ok) {
        console.error('[ERROR] Erreur récupération productions:', response.status);
        return;
      }
      
      const data = await response.json();
      let productionsVoiture = [];
      if (data.data && Array.isArray(data.data)) productionsVoiture = data.data;
      else if (Array.isArray(data)) productionsVoiture = data;
      
      // 2. Trier par date décroissante
      productionsVoiture.sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation));
      
      if (productionsVoiture.length > 0) {
        // Mettre à jour la production la plus récente
        const derniereProduction = productionsVoiture[0];
        
        // Calculer la nouvelle distance
        const ancienCompteurDebut = derniereProduction.compteur_debut || 0;
        const nouvelleDistance = Math.max(0, nouveauCompteur - ancienCompteurDebut);
        
        const updatePayload = {
          ...derniereProduction,
          compteur_fin: nouveauCompteur,
          distance: nouvelleDistance,
          projet_id: projetId || derniereProduction.projet_id,
          date_creation: date || derniereProduction.date_creation || new Date().toISOString().split('T')[0]
        };
        
        const updateResponse = await fetch(`${PRODUCTIONS_URL}/${derniereProduction.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(updatePayload)
        });
        
        if (updateResponse.ok) {
          console.log(`[INFO] ✅ Production #${derniereProduction.id} mise à jour: compteur_fin = ${nouveauCompteur}`);
        } else {
          console.error('[ERROR] Erreur mise à jour production:', updateResponse.status);
        }
      } else {
        // Créer une nouvelle production si aucune n'existe
        const createPayload = {
          categorie: 'CHAUFFEUR',
          compteur_debut: Math.max(0, nouveauCompteur - 100),
          compteur_fin: nouveauCompteur,
          distance: 100,
          date_creation: date || new Date().toISOString().split('T')[0],
          chauffeur_id: null,
          projet_id: projetId,
          voiture_id: voitureId,
          voyage_enrobe: 0,
          voyage_tout_venant: 0,
          voyage_gravier_roche: 0,
          autre: 0
        };
        
        const createResponse = await fetch(PRODUCTIONS_URL, {
          method: 'POST',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(createPayload)
        });
        
        if (createResponse.ok) {
          console.log(`[INFO] ✅ Nouvelle production créée: compteur_fin = ${nouveauCompteur}`);
        }
      }
    } catch (err) {
      console.error('[ERROR] Erreur mise à jour production:', err);
    }
  };

  // ============================================
  // FONCTIONS API
  // ============================================

  // Utilitaire pour extraire le tableau depuis la réponse paginée de Laravel
  const extractDataFromResponse = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.data && Array.isArray(data.data)) return data.data;
    if (data.success && data.data && Array.isArray(data.data)) return data.data;
    if (typeof data === 'object') {
      for (let key in data) {
        if (Array.isArray(data[key])) return data[key];
      }
    }
    return [];
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const headers = {
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept': 'application/json'
      };

      const [voituresRes, vidangesRes, productionsRes, projetsRes] = await Promise.allSettled([
        fetch(VOITURES_URL, { headers }),
        fetch(VIDANGES_URL, { headers }),
        fetch(PRODUCTIONS_URL, { headers }),
        fetch(PROJETS_URL, { headers })
      ]);

      let voituresData = [];
      let vidangesData = [];
      let productionsData = [];
      let projetsData = [];

      if (voituresRes.status === 'fulfilled' && voituresRes.value.ok) {
        const data = await voituresRes.value.json();
        voituresData = extractDataFromResponse(data);
        console.log('[INFO] Voitures chargées:', voituresData.length);
      }
      
      if (vidangesRes.status === 'fulfilled' && vidangesRes.value.ok) {
        const data = await vidangesRes.value.json();
        vidangesData = extractDataFromResponse(data);
        console.log('[INFO] Vidanges chargées:', vidangesData.length);
      }
      
      if (productionsRes.status === 'fulfilled' && productionsRes.value.ok) {
        const data = await productionsRes.value.json();
        productionsData = extractDataFromResponse(data);
        console.log('[INFO] Productions chargées:', productionsData.length);
      }
      
      if (projetsRes.status === 'fulfilled' && projetsRes.value.ok) {
        const data = await projetsRes.value.json();
        projetsData = extractDataFromResponse(data);
        console.log('[INFO] Projets chargés:', projetsData.length);
      }

      setVoitures(voituresData);
      setProductions(productionsData);
      setProjets(projetsData);

      const enhancedVidanges = enrichVidanges(vidangesData, voituresData, productionsData, projetsData);
      setVidanges(enhancedVidanges);
      
    } catch (err) {
      console.error('[ERROR] Erreur de chargement:', err);
      setError(`Erreur de chargement: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // CORRECTION ICI : Priorité au compteur_actuel du vidange
  // ============================================
  const enrichVidanges = (vidangesData, voituresData, productionsData, projetsData) => {
    return vidangesData.map(vidange => {
      if (!vidange || !vidange.id) return null;

      const voiture = voituresData.find(v => v && v.id === vidange.voiture_id);
      const projet = projetsData.find(p => p && p.id === vidange.projet_id);
      
      // Récupérer le dernier compteur fin de la production pour ce véhicule
      const productionsVoiture = productionsData.filter(p => p && p.voiture_id === vidange.voiture_id);
      productionsVoiture.sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation));
      const dernierCompteurProduction = productionsVoiture.length > 0 ? productionsVoiture[0].compteur_fin : 0;
      
      // ============================================
      // CORRECTION : Priorité au compteur_actuel du vidange
      // Si le vidange a un compteur_actuel, on l'utilise
      // Sinon, on utilise le dernier compteur de production
      // ============================================
      const compteurActuel = vidange.compteur_actuel !== null && vidange.compteur_actuel !== undefined && vidange.compteur_actuel !== ''
        ? parseFloat(vidange.compteur_actuel)
        : dernierCompteurProduction || 0;
      
      // Calcul de la prochaine visite = compteur_visite + intervalle
      const compteurVisite = parseFloat(vidange.compteur_visite) || 0;
      const intervalle = vidange.type_vidange === 'VIDANGE_SIMPLE' ? 5000 : 10000;
      const prochaineVisite = compteurVisite + intervalle;
      const heurRestant = prochaineVisite - compteurActuel;

      const isUrgent = heurRestant < 100;
      const isWarning = heurRestant >= 100 && heurRestant <= 500;

      return {
        ...vidange,
        id: vidange.id || vidange.vidange_id,
        voiture_info: voiture,
        projet_info: projet,
        projet_name: projet?.name || 'Non attribué',
        voiture_matricule: voiture?.matricule || 'N/A',
        voiture_modele: voiture?.modele || '',
        voiture_marque: voiture?.marque || '',
        compteur_actuel: compteurActuel,
        compteur_visite: compteurVisite,
        prochaine_visite: prochaineVisite,
        heur_restant: heurRestant,
        date_visite_formatted: vidange.date_visite 
          ? new Date(vidange.date_visite).toLocaleDateString('fr-FR')
          : 'N/A',
        is_urgent: isUrgent,
        is_warning: isWarning
      };
    }).filter(v => v !== null);
  };

  // ============================================
  // CHARGEMENT INITIAL
  // ============================================
  
  useEffect(() => {
    fetchData();
  }, []);

  // ============================================
  // FILTRAGE
  // ============================================

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({...filters, [name]: value});
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      filterVoiture: '',
      filterProjet: '',
      filterType: ''
    });
  };

  const toggleWarningFilter = () => {
    if (!showWarningOnly) {
      setShowWarningOnly(true);
      setShowUrgentOnly(false);
      setSuccess('Affichage des véhicules à surveiller (100-500km)');
    } else {
      setShowWarningOnly(false);
      setSuccess('Affichage de tous les véhicules');
    }
  };

  const filteredVidanges = vidanges.filter(vidange => {
    if (!vidange) return false;
    
    const searchTerm = filters.searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' || (
      (vidange.voiture_matricule || '').toLowerCase().includes(searchTerm) ||
      (vidange.projet_name || '').toLowerCase().includes(searchTerm) ||
      (vidange.voiture_marque || '').toLowerCase().includes(searchTerm) ||
      (vidange.voiture_modele || '').toLowerCase().includes(searchTerm)
    );

    const matchesVoiture = !filters.filterVoiture || String(vidange.voiture_id) === filters.filterVoiture;
    const matchesProjet = !filters.filterProjet || String(vidange.projet_id) === filters.filterProjet;
    const matchesType = !filters.filterType || vidange.type_vidange === filters.filterType;

    if (showUrgentOnly && !vidange.is_urgent) {
      return false;
    }
    
    if (showWarningOnly && !vidange.is_warning) {
      return false;
    }

    return matchesSearch && matchesVoiture && matchesProjet && matchesType;
  });

  const countUrgences = vidanges.filter(v => v && v.is_urgent).length;
  const countWarnings = vidanges.filter(v => v && v.is_warning).length;

  // ============================================
  // GESTION DES FORMULAIRES AVEC RECHERCHE
  // ============================================

  // Filtrer les voitures pour la recherche
  useEffect(() => {
    if (searchVoitureTerm.trim() === '') {
      setFilteredVoitures(voitures.slice(0, 10));
    } else {
      const filtered = voitures.filter(voiture => 
        voiture && (
          voiture.matricule?.toLowerCase().includes(searchVoitureTerm.toLowerCase()) ||
          voiture.marque?.toLowerCase().includes(searchVoitureTerm.toLowerCase()) ||
          voiture.modele?.toLowerCase().includes(searchVoitureTerm.toLowerCase())
        )
      );
      setFilteredVoitures(filtered.slice(0, 10));
    }
  }, [searchVoitureTerm, voitures]);

  const handleSearchVoitureChange = (e) => {
    setSearchVoitureTerm(e.target.value);
    setShowVoitureDropdown(true);
  };

  const selectVoiture = (voiture) => {
    // Récupérer le dernier compteur de production
    const dernierCompteur = getLastCompteurFinForVoiture(voiture.id);
    
    setFormData(prev => ({
      ...prev,
      voiture_id: voiture.id,
      compteur_actuel: dernierCompteur || '', // Pré-remplit avec le dernier compteur
    }));
    setSearchVoitureTerm(`${voiture.matricule} - ${voiture.marque} ${voiture.modele}`);
    setShowVoitureDropdown(false);
    
    // Récupérer le projet associé
    const productionAssociee = productions.find(p => p && p.voiture_id === voiture.id);
    if (productionAssociee) {
      setProjetAssocie(productionAssociee.projet_id);
      setFormData(prev => ({
        ...prev,
        projet_id: productionAssociee.projet_id || ''
      }));
    } else {
      setProjetAssocie(null);
      setFormData(prev => ({
        ...prev,
        projet_id: ''
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // ============================================
  // ACTIONS CRUD AVEC VÉRIFICATION DES PERMISSIONS
  // ============================================

  const handleAdd = () => {
    if (!canModify()) {
      setError("Vous n'avez pas les permissions pour ajouter des vidanges");
      return;
    }
    setEditingVidange(null);
    setFormData({
      voiture_id: '',
      date_visite: new Date().toISOString().split('T')[0],
      type_vidange: '',
      compteur_visite: '',
      compteur_actuel: '',
      projet_id: ''
    });
    setSearchVoitureTerm('');
    setProjetAssocie(null);
    setShowModal(true);
  };

  const handleEdit = (vidange) => {
    if (!canModify()) {
      setError("Vous n'avez pas les permissions pour modifier");
      return;
    }
    if (!vidange) return;
    
    setEditingVidange(vidange);
    const voitureTrouvee = voitures.find(v => v && v.id === vidange.voiture_id);
    if (voitureTrouvee) {
      setSearchVoitureTerm(`${voitureTrouvee.matricule} - ${voitureTrouvee.marque} ${voitureTrouvee.modele}`);
    }
    
    // Récupérer le dernier compteur de production
    const dernierCompteur = getLastCompteurFinForVoiture(vidange.voiture_id);
    
    setFormData({
      voiture_id: vidange.voiture_id || '',
      date_visite: vidange.date_visite ? vidange.date_visite.split('T')[0] : '',
      type_vidange: vidange.type_vidange || '',
      compteur_visite: vidange.compteur_visite || '',
      compteur_actuel: dernierCompteur || vidange.compteur_actuel || '',
      projet_id: vidange.projet_id || ''
    });
    
    const productionAssociee = productions.find(p => p && p.voiture_id === vidange.voiture_id);
    setProjetAssocie(productionAssociee?.projet_id || null);
    
    setShowModal(true);
  };

  const confirmDelete = (id) => {
    if (!canModify()) {
      setError("Vous n'avez pas les permissions pour supprimer");
      return;
    }
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette vidange ?')) {
      handleDelete(id);
    }
  };

  const handleDelete = async (id) => {
    if (!canModify()) {
      setError("Action non autorisée");
      return;
    }
    
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      
      const response = await fetch(`${VIDANGES_URL}/${id}`, {
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
        throw new Error(data.error || `Erreur: ${response.status}`);
      }

      setVidanges(prev => prev.filter(v => v && v.id !== id));
      setSuccess('Vidange supprimée avec succès');
    } catch (err) {
      console.error('[ERROR] Erreur de suppression:', err);
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!canModify()) {
      setError("Action non autorisée. Vous n'avez pas les permissions nécessaires.");
      return;
    }
    
    if (!formData.voiture_id) {
      setError("Veuillez sélectionner un véhicule");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Calculer la prochaine visite
      const compteurVisite = parseFloat(formData.compteur_visite) || 0;
      const compteurActuel = formData.compteur_actuel ? parseFloat(formData.compteur_actuel) : null;
      const intervalle = formData.type_vidange === 'VIDANGE_SIMPLE' ? 5000 : 10000;
      const prochaineVisite = compteurVisite + intervalle;
      
      const payload = {
        voiture_id: parseInt(formData.voiture_id) || 0,
        date_visite: formData.date_visite,
        type_vidange: formData.type_vidange,
        compteur_visite: compteurVisite,
        compteur_actuel: compteurActuel,
        prochaine_visite: prochaineVisite,
        projet_id: formData.projet_id ? parseInt(formData.projet_id) : null
      };

      console.log('[DEBUG] Payload envoyé:', payload);

      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      let response;
      
      if (editingVidange) {
        response = await fetch(`${VIDANGES_URL}/${editingVidange.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch(VIDANGES_URL, {
          method: 'POST',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Accès refusé. Vous n'avez pas les permissions nécessaires.");
        }
        if (response.status === 422) {
          const data = await response.json();
          let errorMessage = 'Erreurs de validation :\n';
          if (data.errors) {
            Object.keys(data.errors).forEach(field => {
              errorMessage += `• ${field}: ${data.errors[field].join(', ')}\n`;
            });
          }
          throw new Error(errorMessage);
        }
        const data = await response.json();
        throw new Error(data.error || data.message || `Erreur: ${response.status}`);
      }

      // ============================================
      // SYNCHRONISATION AVEC LA PRODUCTION
      // ============================================
      // Le compteur_actuel saisi par l'utilisateur est utilisé pour mettre à jour la production
      if (compteurActuel !== null && compteurActuel !== undefined && formData.voiture_id) {
        await updateProductionWithNewCompteur(
          formData.voiture_id, 
          compteurActuel, // La valeur saisie par l'utilisateur
          formData.projet_id,
          formData.date_visite
        );
      }
      
      await fetchData();
      setSuccess(editingVidange ? '✅ Vidange mise à jour avec succès' : '✅ Vidange ajoutée avec succès');
      handleCloseModal();
      
    } catch (err) {
      console.error('[ERROR] Erreur lors de la sauvegarde:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingVidange(null);
    setProjetAssocie(null);
    setSearchVoitureTerm('');
    setShowVoitureDropdown(false);
    setFormData({
      voiture_id: '',
      date_visite: '',
      type_vidange: '',
      compteur_visite: '',
      compteur_actuel: '',
      projet_id: ''
    });
  };

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchData();
      setSuccess('Données rafraîchies avec succès');
    } catch (err) {
      setError('Erreur lors du rafraîchissement');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // RENDU DU COMPOSANT
  // ============================================

  if (userLoading) {
    return (
      <div className="container mt-4 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Vérification des permissions...</p>
      </div>
    );
  }

  if (loading && vidanges.length === 0) {
    return (
      <div className="text-center mt-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Chargement des données...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* En-tête */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-2">
            <FaCar className="me-2 text-primary" />
            Gestion de l'entretien des véhicules
          </h2>
          <div className="d-flex align-items-center gap-3">
            <Badge 
              bg={canModify() ? 'success' : 'secondary'} 
              className="px-3 py-2"
              style={{ fontSize: '0.9rem' }}
            >
              {canModify() ? <FaUserShield className="me-2" /> : <FaUser className="me-2" />}
              {isAdmin() ? 'Administrateur' : 
               isChefEnt() ? 'Chef d\'entretien' : 
               'Consultation seule'}
            </Badge>
          </div>
        </div>
        <div className="d-flex gap-2">
          <Button 
            variant={showUrgentOnly ? "danger" : "warning"} 
            onClick={() => {
              setShowUrgentOnly(!showUrgentOnly);
              if (!showUrgentOnly) setShowWarningOnly(false);
            }}
            className="position-relative"
          >
            <FaExclamationTriangle className="me-1" />
            {showUrgentOnly ? 'Toutes' : 'Urgences'}
            {countUrgences > 0 && !showUrgentOnly && (
              <Badge pill bg="danger" className="position-absolute top-0 start-100 translate-middle">
                {countUrgences}
              </Badge>
            )}
          </Button>
          
          <Button 
            variant={showWarningOnly ? "warning" : "outline-warning"} 
            onClick={toggleWarningFilter}
            className="position-relative"
          >
            <FaEye className="me-1" />
            {showWarningOnly ? 'Tous' : 'À surveiller'}
            {countWarnings > 0 && !showWarningOnly && (
              <Badge pill bg="warning" className="position-absolute top-0 start-100 translate-middle">
                {countWarnings}
              </Badge>
            )}
          </Button>
          
          <Button variant="outline-primary" onClick={refreshData} disabled={loading}>
            <FaSync className={`me-2 ${loading ? 'fa-spin' : ''}`} /> Rafraîchir
          </Button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          <FaExclamationTriangle className="me-2" />
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Barre d'outils */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="py-3">
          <Row className="align-items-center">
            <Col md={8}>
              <div className="d-flex gap-2">
                {canModify() ? (
                  <Button variant="success" onClick={handleAdd}>
                    <FaPlus className="me-2" /> Nouvel entretien
                  </Button>
                ) : (
                  <span className="text-muted small">
                    <FaLock className="me-1" /> Mode lecture seule
                  </span>
                )}
                
                <span className="text-muted small ms-3">
                  <strong>{filteredVidanges.length}</strong> entretien(s)
                </span>
              </div>
            </Col>
            
            <Col md={4}>
              <div className="d-flex justify-content-end gap-2">
                <Badge bg="warning" className="px-3 py-2">
                  ⚠️ {countWarnings} à surveiller
                </Badge>
                <Badge bg="danger" className="px-3 py-2">
                  🚨 {countUrgences} urgentes
                </Badge>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Filtres */}
      {!showUrgentOnly && !showWarningOnly && (
        <Card className="border-0 shadow-sm mb-4">
          <Card.Header className="bg-info py-3">
            <h5 className="mb-0">
              <FaFilter className="me-2 text-primary" />
              Filtres
            </h5>
          </Card.Header>
          <Card.Body>
            <Row className="g-3">
              <Col md={3}>
                <InputGroup>
                  <InputGroup.Text><FaSearch /></InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Rechercher (matricule, projet...)"
                    name="searchTerm"
                    value={filters.searchTerm}
                    onChange={handleFilterChange}
                  />
                  {filters.searchTerm && (
                    <Button 
                      variant="outline-secondary"
                      onClick={() => setFilters({...filters, searchTerm: ''})}
                    >
                      ×
                    </Button>
                  )}
                </InputGroup>
              </Col>
              
              <Col md={3}>
                <Form.Select
                  name="filterVoiture"
                  value={filters.filterVoiture}
                  onChange={handleFilterChange}
                >
                  <option value="">Tous les véhicules</option>
                  {voitures.map(v => v && (
                    <option key={v.id} value={v.id}>
                      {v.matricule} {v.modele ? `(${v.modele})` : ''}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              
              <Col md={2}>
                <Form.Select
                  name="filterProjet"
                  value={filters.filterProjet}
                  onChange={handleFilterChange}
                >
                  <option value="">Tous les projets</option>
                  {projets.map(p => p && (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Form.Select>
              </Col>
              
              <Col md={2}>
                <Form.Select
                  name="filterType"
                  value={filters.filterType}
                  onChange={handleFilterChange}
                >
                  <option value="">Tous types</option>
                  <option value="VIDANGE_SIMPLE">Vidange simple</option>
                  <option value="VIDANGE_COMPLET">Vidange complète</option>
                </Form.Select>
              </Col>
              
              <Col md={2}>
                <Button variant="outline-secondary" onClick={resetFilters} className="w-100">
                  Réinitialiser
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Statistiques */}
      {!showUrgentOnly && !showWarningOnly && (
        <Row className="g-3 mb-4">
          <Col md={4}>
            <Card className="border-0 shadow-sm text-center">
              <Card.Header className="bg-white">
                <h6 className="mb-0">Total entretiens</h6>
              </Card.Header>
              <Card.Body>
                <h3>{vidanges.length}</h3>
                <p className="text-muted mb-0">Entretiens programmés</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="border-0 shadow-sm text-center">
              <Card.Header className="bg-white">
                <h6 className="mb-0">À surveiller</h6>
              </Card.Header>
              <Card.Body>
                <h3 className="text-warning">{countWarnings}</h3>
                <p className="text-muted mb-0">100-500km restants</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="border-0 shadow-sm text-center">
              <Card.Header className="bg-white">
                <h6 className="mb-0">Urgences</h6>
              </Card.Header>
              <Card.Body>
                <h3 className="text-danger">{countUrgences}</h3>
                <p className="text-muted mb-0">&lt;100km restants</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Tableau des entretiens */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="align-middle mb-0">
              <thead className="bg-info text-white">
                <tr>
                  <th>Équipement</th>
                  <th>Projet</th>
                  <th>Date visite</th>
                  <th>Type</th>
                  <th className="text-end">Compteur visite</th>
                  <th className="text-end">Compteur actuel</th>
                  <th className="text-end">Prochaine visite</th>
                  <th className="text-center">HMR restant</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVidanges.length > 0 ? (
                  filteredVidanges.map(vidange => (
                    <tr 
                      key={vidange.id} 
                      className={`
                        ${vidange.is_urgent ? 'table-danger' : ''}
                        ${vidange.is_warning ? 'table-warning' : ''}
                      `}
                    >
                      <td>
                        <div className="fw-bold">{vidange.voiture_matricule}</div>
                        {(vidange.voiture_marque || vidange.voiture_modele) && (
                          <small className="text-muted">
                            {vidange.voiture_marque} {vidange.voiture_modele}
                          </small>
                        )}
                      </td>
                      <td>{vidange.projet_name}</td>
                      <td>{vidange.date_visite_formatted}</td>
                      <td>
                        <Badge bg={vidange.type_vidange === 'VIDANGE_SIMPLE' ? 'info' : 'warning'} pill>
                          {vidange.type_vidange === 'VIDANGE_SIMPLE' ? 'Simple' : 'Complète'}
                        </Badge>
                      </td>
                      <td className="text-end">{parseFloat(vidange.compteur_visite || 0).toLocaleString('fr')} km</td>
                      <td className="text-end">
                        <Badge bg="primary" pill>
                          {parseFloat(vidange.compteur_actuel || 0).toLocaleString('fr')} km
                        </Badge>
                      </td>
                      <td className="text-end">
                        <Badge bg="secondary" pill>
                          {parseFloat(vidange.prochaine_visite || 0).toLocaleString('fr')} km
                        </Badge>
                      </td>
                      <td className="text-center">
                        <Badge 
                          bg={
                            vidange.is_urgent ? 'danger' : 
                            vidange.is_warning ? 'warning' : 'success'
                          }
                          pill
                          className="px-3 py-2"
                        >
                          {parseFloat(vidange.heur_restant || 0).toLocaleString('fr')} km
                        </Badge>
                        {vidange.is_urgent && (
                          <div className="text-danger small mt-1">
                            <FaExclamationTriangle className="me-1" />
                            Urgent!
                          </div>
                        )}
                        {vidange.is_warning && !vidange.is_urgent && (
                          <div className="text-warning small mt-1">
                            ⚠️ À surveiller
                          </div>
                        )}
                      </td>
                      <td className="text-center">
                        {canModify() ? (
                          <div className="d-flex gap-2 justify-content-center">
                            <Button 
                              variant="outline-warning" 
                              size="sm"
                              onClick={() => handleEdit(vidange)}
                              title="Modifier"
                              disabled={loading}
                            >
                              <FaEdit />
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => confirmDelete(vidange.id)}
                              title="Supprimer"
                              disabled={loading}
                            >
                              <FaTrash />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted small" title="Consultation seule">
                            <FaLock size={14} />
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center py-5">
                      <div className="text-muted">
                        {showUrgentOnly 
                          ? 'Aucun entretien urgent (<100km) à afficher'
                          : showWarningOnly
                          ? 'Aucun entretien à surveiller (100-500km) à afficher'
                          : 'Aucun entretien ne correspond aux critères'
                        }
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Modal d'ajout/modification avec recherche de voiture */}
      {showModal && !canModify() ? (
        <Modal show={true} onHide={handleCloseModal} centered>
          <Modal.Header closeButton className="bg-warning">
            <Modal.Title><FaLock className="me-2" /> Accès restreint</Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-center">
            <Alert variant="warning">
              <FaExclamationTriangle className="display-4 d-block mb-3" />
              <h5>Permission refusée</h5>
              <p className="mb-0">
                Vous devez être administrateur ou chef d'entretien pour effectuer cette action.
              </p>
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>Fermer</Button>
          </Modal.Footer>
        </Modal>
      ) : showModal && (
        <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title>
              {editingVidange ? 'Modifier' : 'Ajouter'} un entretien
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Véhicule *</strong></Form.Label>
                    <div className="position-relative">
                      <InputGroup>
                        <InputGroup.Text><FaSearch /></InputGroup.Text>
                        <Form.Control
                          type="text"
                          placeholder="Rechercher par matricule, marque ou modèle..."
                          value={searchVoitureTerm}
                          onChange={handleSearchVoitureChange}
                          onFocus={() => setShowVoitureDropdown(true)}
                          autoComplete="off"
                        />
                        {searchVoitureTerm && (
                          <Button
                            variant="outline-secondary"
                            onClick={() => {
                              setSearchVoitureTerm('');
                              setFormData({ ...formData, voiture_id: '' });
                            }}
                          >
                            <FaTimes />
                          </Button>
                        )}
                      </InputGroup>
                      
                      {showVoitureDropdown && filteredVoitures.length > 0 && (
                        <div className="position-absolute w-100 mt-1 bg-white border rounded shadow-sm" style={{ zIndex: 1000, maxHeight: '300px', overflowY: 'auto' }}>
                          {filteredVoitures.map(voiture => (
                            <div
                              key={voiture.id}
                              className="p-2 border-bottom hover-bg-light"
                              style={{ cursor: 'pointer' }}
                              onClick={() => selectVoiture(voiture)}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                            >
                              <div className="fw-bold">{voiture.matricule}</div>
                              <small className="text-muted">
                                {voiture.marque} {voiture.modele}
                                {voiture.site && ` - ${voiture.site}`}
                              </small>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Form.Text className="text-muted">
                      Recherchez un véhicule par matricule, marque ou modèle
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Date visite *</strong></Form.Label>
                    <Form.Control 
                      type="date" 
                      name="date_visite" 
                      value={formData.date_visite} 
                      onChange={handleChange} 
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Type d'entretien *</strong></Form.Label>
                    <Form.Select 
                      name="type_vidange" 
                      value={formData.type_vidange} 
                      onChange={handleChange} 
                      required
                    >
                      <option value="">Sélectionner un type</option>
                      <option value="VIDANGE_SIMPLE">Vidange simple (5000km)</option>
                      <option value="VIDANGE_COMPLET">Vidange complète (10000km)</option>
                    </Form.Select>
                    <Form.Text className="text-muted">
                      Détermine l'intervalle de la prochaine visite
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Compteur actuel (km)</strong></Form.Label>
                    <Form.Control 
                      type="number" 
                      name="compteur_actuel" 
                      value={formData.compteur_actuel} 
                      onChange={handleChange} 
                      min="0"
                      step="1"
                      placeholder="Saisir ou modifier le compteur actuel"
                    />
                    <Form.Text className="text-muted">
                      📌 Pré-rempli avec le dernier compteur de production - Modifiable manuellement
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Compteur visite (km) *</strong></Form.Label>
                    <Form.Control 
                      type="number" 
                      name="compteur_visite" 
                      value={formData.compteur_visite} 
                      onChange={handleChange} 
                      required 
                      min="0"
                      step="1"
                      placeholder="Compteur relevé lors de l'entretien"
                    />
                    <Form.Text className="text-muted">
                      📝 Compteur relevé lors de l'entretien
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Projet associé</Form.Label>
                {projetAssocie ? (
                  <div>
                    <Form.Control 
                      value={projets.find(p => p && p.id === projetAssocie)?.name || 'Non attribué'}
                      readOnly
                      className="bg-light"
                    />
                    <Form.Text className="text-muted">
                      Projet détecté automatiquement
                    </Form.Text>
                  </div>
                ) : (
                  <>
                    <Form.Select 
                      name="projet_id" 
                      value={formData.projet_id} 
                      onChange={handleChange}
                    >
                      <option value="">Non attribué</option>
                      {projets.map(p => p && (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </Form.Select>
                    <Form.Text className="text-muted">
                      Optionnel - sera associé au projet de la dernière production
                    </Form.Text>
                  </>
                )}
              </Form.Group>

              <Alert variant="info" className="mt-3">
                <small>
                  <strong>Calcul automatique:</strong><br />
                  • Prochaine visite: {formData.type_vidange === 'VIDANGE_SIMPLE' ? '5,000' : '10,000'} km après le compteur visite<br />
                  • HMR restant = Prochaine visite - Compteur actuel<br />
                  • <span className="text-danger">Urgent &lt;100km</span> | <span className="text-warning">⚠️ À surveiller 100-500km</span> | <span className="text-success">✓ &gt;500km</span><br />
                  • <strong className="text-primary">✨ Synchronisation automatique:</strong> Le compteur actuel met à jour la production du véhicule
                </small>
              </Alert>

              <div className="d-flex justify-content-end mt-3">
                <Button variant="secondary" onClick={handleCloseModal} className="me-2" disabled={loading}>
                  Annuler
                </Button>
                <Button variant="primary" type="submit" disabled={loading || !formData.voiture_id}>
                  {loading ? (
                    <>
                      <Spinner as="span" size="sm" animation="border" className="me-2" />
                      {editingVidange ? 'Mise à jour...' : 'Enregistrement...'}
                    </>
                  ) : (
                    editingVidange ? 'Mettre à jour' : 'Enregistrer'
                  )}
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>
      )}
    </div>
  );
};

export default GestionVidanges;