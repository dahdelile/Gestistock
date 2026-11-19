import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal, Button, Form, Spinner, Alert,
  Badge, Table, InputGroup, Card, Row, Col
} from 'react-bootstrap';
import {
  FaEdit, FaTrash, FaSearch, FaFilter,
  FaTimes, FaTachometerAlt, FaFileExport,
  FaUserShield, FaUser, FaLock, FaCar,
  FaSync, FaPlus, FaExclamationTriangle
} from 'react-icons/fa';

// ============================================
// GESTION DES VARIABLES D'ENVIRONNEMENT
// ============================================
const API_BASE_URL = 'https://intranet-attm.com/api';
const PRODUCTIONS_URL = `${API_BASE_URL}/productions`;
const VOITURES_URL = `${API_BASE_URL}/voitures`;
const PROJETS_URL = `${API_BASE_URL}/projets`;
const CHAUFFEURS_URL = `${API_BASE_URL}/chauffeurs`;
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

// Fonction pour obtenir la date d'hier au format YYYY-MM-DD
const getYesterdayDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
};

const ProductionVoitures = () => {
  // ============================================
  // GESTION DES RÔLES UTILISATEUR
  // ============================================
  const [userRole, setUserRole] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState({
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canView: true
  });

  const isAdmin = () => userRole === 'admin' || userRole === 'administrateur';
  const isChefPro = () => userRole === 'chef_Pro' || userRole === 'chef_production';
  const canEdit = () => isAdmin() || isChefPro();

  // Charger le rôle utilisateur
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

  // Mettre à jour les permissions
  useEffect(() => {
    const editPermission = canEdit();
    setUserPermissions({
      canCreate: editPermission,
      canEdit: editPermission,
      canDelete: editPermission,
      canView: true
    });
  }, [userRole]);

  // ============================================
  // ÉTATS PRINCIPAUX
  // ============================================
  const [productions, setProductions] = useState([]);
  const [voitures, setVoitures] = useState([]);
  const [projets, setProjets] = useState([]);
  const [chauffeurs, setChauffeurs] = useState([]);
  const [loadingRefs, setLoadingRefs] = useState(false);
  
  const [formData, setFormData] = useState({
    categorie: 'CHAUFFEUR',
    compteur_debut: '',
    compteur_fin: '',
    distance: '',
    voyage_enrobe: '',
    voyage_tout_venant: '',
    voyage_gravier_roche: '',
    autre: '',
    date_creation: new Date().toISOString().split('T')[0],
    voiture_id: '',
    projet_id: '',
    chauffeur_id: ''
  });

  const [filters, setFilters] = useState({
    searchTerm: '',
    filterVoiture: '',
    filterProjet: '',
    filterChauffeur: '',
    dateDebut: getYesterdayDate(), // Hier par défaut
    dateFin: ''
  });

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [cumuls, setCumuls] = useState({
    hebdomadaire: [],
    mensuel: [],
    annuel: []
  });
  const [periodeActive, setPeriodeActive] = useState('hebdomadaire');
  const [showCumuls, setShowCumuls] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // ============================================
  // FONCTIONS UTILITAIRES
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
    }
    return [];
  };

  const getWeek = (date) => {
    const firstDay = new Date(date.getFullYear(), 0, 1);
    return Math.ceil((((date - firstDay) / 86400000) + firstDay.getDay() + 1) / 7);
  };

  // ============================================
  // CHARGEMENT DES DONNÉES
  // ============================================
  
  const loadReferencesFromAPI = async () => {
    try {
      console.log('[INFO] Chargement des références...');
      
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const headers = {
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept': 'application/json'
      };

      const [voituresRes, projetsRes, chauffeursRes] = await Promise.allSettled([
        fetch(VOITURES_URL, { headers }),
        fetch(PROJETS_URL, { headers }),
        fetch(CHAUFFEURS_URL, { headers })
      ]);

      let voituresData = [];
      let projetsData = [];
      let chauffeursData = [];

      if (voituresRes.status === 'fulfilled' && voituresRes.value.ok) {
        const data = await voituresRes.value.json();
        voituresData = extractDataFromResponse(data);
        console.log('[INFO] Voitures chargées:', voituresData.length);
      }
      
      if (projetsRes.status === 'fulfilled' && projetsRes.value.ok) {
        const data = await projetsRes.value.json();
        projetsData = extractDataFromResponse(data);
        console.log('[INFO] Projets chargés:', projetsData.length);
      }
      
      if (chauffeursRes.status === 'fulfilled' && chauffeursRes.value.ok) {
        const data = await chauffeursRes.value.json();
        chauffeursData = extractDataFromResponse(data);
        console.log('[INFO] Chauffeurs chargés:', chauffeursData.length);
      }

      setVoitures(voituresData);
      setProjets(projetsData);
      setChauffeurs(chauffeursData);

      return { voituresData, projetsData, chauffeursData };
      
    } catch (error) {
      console.error('[ERROR] Erreur lors du chargement des références:', error);
      throw error;
    }
  };

  const fetchProductions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      
      const url = new URL(PRODUCTIONS_URL);
      url.searchParams.append('expand', 'voiture,projet,chauffeur');
      url.searchParams.append('categorie', 'CHAUFFEUR');
      
      console.log('[INFO] Fetching productions des chauffeurs:', url.toString());
      
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      let productionsData = extractDataFromResponse(data);
      
      const productionsAvecVoiture = productionsData.filter(prod => prod.voiture_id || prod.voiture);
      
      const enhancedProductions = productionsAvecVoiture.map(production => {
        const voitureInfo = production.voiture || {
          matricule: 'N/A',
          modele: '',
          marque: '',
          id: null
        };
        
        const projetInfo = production.projet || {
          name: 'Non attribué',
          code: ''
        };

        const compteurDebut = parseFloat(production.compteur_debut) || 0;
        const compteurFin = parseFloat(production.compteur_fin) || 0;
        const calculatedDistance = parseFloat(production.distance) || 
          (compteurFin - compteurDebut);

        return {
          ...production,
          id: production.id || production.production_id,
          compteur_debut: compteurDebut,
          compteur_fin: compteurFin,
          distance: calculatedDistance,
          voyage_enrobe: parseInt(production.voyage_enrobe) || 0,
          voyage_tout_venant: parseInt(production.voyage_tout_venant) || 0,
          voyage_gravier_roche: parseInt(production.voyage_gravier_roche) || 0,
          autre: parseInt(production.autre) || 0,
          
          voiture_id: production.voiture_id || production.voiture?.id,
          projet_id: production.projet_id || production.projet?.id,
          chauffeur_id: production.chauffeur_id || production.chauffeur?.id,
          
          voiture_info: voitureInfo,
          projet_info: projetInfo,
          
          date_creation: production.date_creation || production.date || new Date().toISOString().split('T')[0],
          total_voyages: (parseInt(production.voyage_enrobe) || 0) +
                        (parseInt(production.voyage_tout_venant) || 0) +
                        (parseInt(production.voyage_gravier_roche) || 0) +
                        (parseInt(production.autre) || 0)
        };
      });

      setProductions(enhancedProductions);
      console.log('[SUCCESS] Productions des chauffeurs chargées:', enhancedProductions.length);
      
    } catch (err) {
      console.error('[ERROR] Erreur lors du chargement des productions:', err);
      setError(err.message || "Impossible de charger les productions");
      setProductions([]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // CHARGEMENT INITIAL
  // ============================================
  
  useEffect(() => {
    const fetchReferences = async () => {
      setLoadingRefs(true);
      try {
        await loadReferencesFromAPI();
      } catch (err) {
        console.error('[ERROR] Erreur générale références:', err);
        setError(`Erreur lors du chargement des listes: ${err.message}`);
      } finally {
        setLoadingRefs(false);
      }
    };

    fetchReferences();
  }, []);

  useEffect(() => {
    fetchProductions();
  }, []);

  // ============================================
  // FILTRAGE DES PRODUCTIONS
  // ============================================
  const filteredProductions = useMemo(() => {
    return productions
      .filter(production => {
        const searchTerm = filters.searchTerm.toLowerCase();
        const matchesSearch = searchTerm === '' || (
          (production.voiture_info?.matricule || '').toLowerCase().includes(searchTerm) ||
          (production.voiture_info?.marque || '').toLowerCase().includes(searchTerm) ||
          (production.voiture_info?.modele || '').toLowerCase().includes(searchTerm) ||
          (production.projet_info?.name || '').toLowerCase().includes(searchTerm)
        );
        
        const matchesVoiture = !filters.filterVoiture || production.voiture_id == filters.filterVoiture;
        const matchesProjet = !filters.filterProjet || production.projet_id == filters.filterProjet;
        const matchesChauffeur = !filters.filterChauffeur || production.chauffeur_id == filters.filterChauffeur;
        
        let matchesDate = true;
        if (filters.dateDebut) {
          const dateCreation = production.date_creation ? new Date(production.date_creation) : new Date();
          matchesDate = matchesDate && dateCreation >= new Date(filters.dateDebut);
        }
        if (filters.dateFin) {
          const dateCreation = production.date_creation ? new Date(production.date_creation) : new Date();
          const dateFin = new Date(filters.dateFin);
          dateFin.setHours(23, 59, 59, 999);
          matchesDate = matchesDate && dateCreation <= dateFin;
        }

        return matchesSearch && matchesVoiture && matchesProjet && matchesChauffeur && matchesDate;
      })
      .sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation));
  }, [productions, filters]);

  // ============================================
  // CALCUL DES CUMULS PAR VOITURE
  // ============================================
  useEffect(() => {
    if (filteredProductions.length === 0) {
      setCumuls({
        hebdomadaire: [],
        mensuel: [],
        annuel: []
      });
      return;
    }

    const calculerCumuls = (periode) => {
      const groupes = {};

      filteredProductions.forEach(prod => {
        const date = new Date(prod.date_creation);
        let clePeriode;

        if (periode === 'hebdomadaire') {
          const semaine = getWeek(date);
          clePeriode = `S${semaine}-${date.getFullYear()}`;
        } else if (periode === 'mensuel') {
          clePeriode = `${date.toLocaleString('fr-FR', { month: 'long' })} ${date.getFullYear()}`;
        } else {
          clePeriode = date.getFullYear().toString();
        }

        const voitureId = prod.voiture_id || 'unknown';
        const cle = `${clePeriode}|${voitureId}`;

        if (!groupes[cle]) {
          groupes[cle] = {
            periode: clePeriode,
            voiture_matricule: prod.voiture_info?.matricule || 'N/A',
            voiture_marque: prod.voiture_info?.marque || '',
            distance: 0,
            voyages: { enrobe: 0, tout_venant: 0, gravier: 0, autre: 0 },
            count: 0,
            chauffeurs: new Set()
          };
        }

        groupes[cle].distance += prod.distance || 0;
        groupes[cle].voyages.enrobe += prod.voyage_enrobe || 0;
        groupes[cle].voyages.tout_venant += prod.voyage_tout_venant || 0;
        groupes[cle].voyages.gravier += prod.voyage_gravier_roche || 0;
        groupes[cle].voyages.autre += prod.autre || 0;
        groupes[cle].count++;
        
        if (prod.chauffeur_id) {
          groupes[cle].chauffeurs.add(prod.chauffeur_id);
        }
      });

      return Object.values(groupes).map(g => ({
        ...g,
        nb_chauffeurs: g.chauffeurs.size
      })).sort((a, b) => b.distance - a.distance);
    };

    setCumuls({
      hebdomadaire: calculerCumuls('hebdomadaire'),
      mensuel: calculerCumuls('mensuel'),
      annuel: calculerCumuls('annuel')
    });
  }, [filteredProductions]);

  // ============================================
  // GESTION DES FORMULAIRES
  // ============================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };

    if (name === 'compteur_debut' || name === 'compteur_fin') {
      const debut = parseFloat(newFormData.compteur_debut) || 0;
      const fin = parseFloat(newFormData.compteur_fin) || 0;
      const distance = fin - debut;
      newFormData.distance = Math.max(0, distance).toFixed(2);
    }

    setFormData(newFormData);
  };

  const isFormReady = () => formData.voiture_id && formData.projet_id && formData.date_creation;

  // ============================================
  // ACTIONS CRUD
  // ============================================
  
  const handleAdd = () => {
    if (!canEdit()) {
      setError("Vous n'avez pas les permissions pour ajouter des productions");
      return;
    }
    setFormData({
      categorie: 'CHAUFFEUR',
      compteur_debut: '',
      compteur_fin: '',
      distance: '',
      voyage_enrobe: '',
      voyage_tout_venant: '',
      voyage_gravier_roche: '',
      autre: '',
      date_creation: new Date().toISOString().split('T')[0],
      voiture_id: '',
      projet_id: '',
      chauffeur_id: ''
    });
    setEditingId(null);
    setShowModal(true);
  };

  const handleEdit = (production) => {
    if (!canEdit()) {
      setError("Vous n'avez pas les permissions pour modifier");
      return;
    }
    
    setFormData({
      categorie: production.categorie || 'CHAUFFEUR',
      compteur_debut: production.compteur_debut || '',
      compteur_fin: production.compteur_fin || '',
      distance: production.distance || '',
      voyage_enrobe: production.voyage_enrobe || '',
      voyage_tout_venant: production.voyage_tout_venant || '',
      voyage_gravier_roche: production.voyage_gravier_roche || '',
      autre: production.autre || '',
      date_creation: production.date_creation ? production.date_creation.split('T')[0] : new Date().toISOString().split('T')[0],
      voiture_id: production.voiture_id || '',
      projet_id: production.projet_id || '',
      chauffeur_id: production.chauffeur_id || ''
    });
    setEditingId(production.id);
    setShowModal(true);
  };

  const confirmDelete = (production) => {
    if (!canEdit()) {
      setError("Vous n'avez pas les permissions pour supprimer");
      return;
    }
    setDeleteConfirm(production);
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handleDelete = async () => {
    if (!canEdit()) {
      setError("Action non autorisée");
      return;
    }

    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      
      const response = await fetch(`${PRODUCTIONS_URL}/${deleteConfirm.id}`, {
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

      setProductions(productions.filter(p => p.id !== deleteConfirm.id));
      setDeleteConfirm(null);
      setSuccess('Production supprimée avec succès');
    } catch (err) {
      console.error('[ERROR] Erreur lors de la suppression:', err);
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!canEdit()) {
      setError("Action non autorisée. Vous n'avez pas les permissions nécessaires.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      if (!formData.voiture_id) throw new Error('Veuillez sélectionner un équipement');
      if (!formData.projet_id) throw new Error('Veuillez sélectionner un projet');
      if (!formData.date_creation) throw new Error('Veuillez sélectionner une date');
      
      const compteurDebut = parseFloat(formData.compteur_debut) || 0;
      const compteurFin = parseFloat(formData.compteur_fin) || 0;
      if (compteurFin < compteurDebut) {
        throw new Error('Le compteur fin ne peut pas être inférieur au compteur début');
      }
      
      const payload = {
        categorie: 'CHAUFFEUR',
        compteur_debut: compteurDebut,
        compteur_fin: compteurFin,
        distance: parseFloat(formData.distance) || 0,
        voyage_enrobe: parseFloat(formData.voyage_enrobe) || 0,
        voyage_tout_venant: parseFloat(formData.voyage_tout_venant) || 0,
        voyage_gravier_roche: parseFloat(formData.voyage_gravier_roche) || 0,
        autre: parseFloat(formData.autre) || 0,
        date_creation: formData.date_creation,
        voiture_id: parseInt(formData.voiture_id),
        projet_id: parseInt(formData.projet_id),
        chauffeur_id: formData.chauffeur_id ? parseInt(formData.chauffeur_id) : null
      };

      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      let response;
      
      if (editingId) {
        response = await fetch(`${PRODUCTIONS_URL}/${editingId}`, {
          method: 'PUT',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch(PRODUCTIONS_URL, {
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

      const data = await response.json();
      
      if (editingId) {
        setProductions(productions.map(p => 
          p.id === editingId ? { ...p, ...data } : p
        ));
        setSuccess('Production mise à jour avec succès');
      } else {
        const newProduction = {
          ...data,
          id: data.id || data.production_id,
          voiture_info: data.voiture || { matricule: 'N/A', marque: '', modele: '' },
          projet_info: data.projet || { name: 'Non attribué' }
        };
        setProductions([newProduction, ...productions]);
        setSuccess('Production ajoutée avec succès');
      }
      
      setShowModal(false);
      setFormData({
        categorie: 'CHAUFFEUR',
        compteur_debut: '',
        compteur_fin: '',
        distance: '',
        voyage_enrobe: '',
        voyage_tout_venant: '',
        voyage_gravier_roche: '',
        autre: '',
        date_creation: new Date().toISOString().split('T')[0],
        voiture_id: '',
        projet_id: '',
        chauffeur_id: ''
      });
      setEditingId(null);

    } catch (err) {
      console.error('[ERROR] Erreur lors de la sauvegarde:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      filterVoiture: '',
      filterProjet: '',
      filterChauffeur: '',
      dateDebut: getYesterdayDate(), // Hier par défaut
      dateFin: ''
    });
  };

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await loadReferencesFromAPI();
      await fetchProductions();
      setSuccess('Données rafraîchies avec succès');
    } catch (err) {
      console.error('[ERROR] Erreur lors du rafraîchissement:', err);
      setError('Erreur lors du rafraîchissement des données');
    } finally {
      setLoading(false);
    }
  };

  const exporterCumuls = () => {
    const data = cumuls[periodeActive];
    if (data.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    const csvContent = [
      ['Période', 'Équipement', 'Marque', 'Distance (km)', 'V.Enrobé', 'V.Tout-Venant', 'V.Gravier', 'Autre', 'Nb Voyages', 'Nb Chauffeurs'],
      ...data.map(item => [
        item.periode,
        item.voiture_matricule,
        item.voiture_marque,
        item.distance.toFixed(0),
        item.voyages.enrobe.toFixed(0),
        item.voyages.tout_venant.toFixed(0),
        item.voyages.gravier.toFixed(0),
        item.voyages.autre.toFixed(0),
        item.count,
        item.nb_chauffeurs || 1
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cumuls-voitures-${periodeActive}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ============================================
  // RENDU DU COMPOSANT
  // ============================================
  
  if (userLoading) {
    return (
      <div className="container mt-4 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
        <p className="mt-3">Vérification des permissions...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4">
      {/* En-tête */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <FaCar className="me-2 text-primary" />
          Productions des Voitures 
          <Badge 
            bg={canEdit() ? 'success' : 'secondary'} 
            className="ms-2"
            style={{ fontSize: '0.6em' }}
          >
            {canEdit() ? <FaUserShield className="me-1" /> : <FaUser className="me-1" />}
            {isAdmin() ? '' : 
             isChefPro() ? '' : 
             ''}
          </Badge>
        </h2>
      </div>

      {/* Messages */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          <FaExclamationTriangle className="me-2" />
          <strong>Erreur:</strong> {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          <strong>Succès:</strong> {success}
        </Alert>
      )}

      {/* Boutons d'action */}
      <div className="d-flex justify-content-between mb-3">
       
        
        <div>
          <Button variant="outline-secondary" className="me-2" onClick={resetFilters}>
            <FaTimes className="me-2" /> Réinitialiser filtres
          </Button>
          <Button variant={showCumuls ? 'secondary' : 'info'} onClick={() => setShowCumuls(!showCumuls)}>
            <FaTachometerAlt className="me-2" />
            {showCumuls ? 'Voir productions' : 'Voir cumuls par voiture'}
          </Button>
        </div>
      </div>

      {/* Info sur les données */}
      <Alert variant="light" className="mb-3">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <span className="me-3"><strong>Équipements:</strong> {voitures.length}</span>
            <span className="me-3"><strong>Projets:</strong> {projets.length}</span>
            <span className="me-3"><strong>Chauffeurs:</strong> {chauffeurs.length}</span>
            <span><strong>Productions:</strong> {productions.length}</span>
          </div>
          <div>
            <small className="text-muted">
              {canEdit() ? 'Mode édition' : 'Mode lecture seule'}
            </small>
          </div>
        </div>
      </Alert>

      {/* Filtres */}
      <Card className="mb-3 shadow-sm">
        <Card.Header className="bg-primary d-flex justify-content-between align-items-center">
          <h5 className="mb-0 text-white">
            <FaFilter className="me-2" /> Filtres
          </h5>
          <Badge bg="light" text="dark">
            {filteredProductions.length} production(s)
          </Badge>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Recherche</Form.Label>
                <InputGroup>
                  <InputGroup.Text><FaSearch /></InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Voiture, projet..."
                    value={filters.searchTerm}
                    onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                  />
                </InputGroup>
              </Form.Group>
            </Col>
            
            {/* Filtre Chauffeur (caché visuellement mais fonctionnel) */}
            <Col md={0} style={{ display: 'none' }}>
              <Form.Select
                value={filters.filterChauffeur}
                onChange={(e) => setFilters({...filters, filterChauffeur: e.target.value})}
              >
                <option value="">Tous les chauffeurs</option>
                {chauffeurs.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nom} {c.prenom}
                  </option>
                ))}
              </Form.Select>
            </Col>
          
            <Col md={2}>
              <Form.Group>
                <Form.Label>Équipement</Form.Label>
                <Form.Select
                  value={filters.filterVoiture}
                  onChange={(e) => setFilters({...filters, filterVoiture: e.target.value})}
                >
                  <option value="">Tous les équipements</option>
                  {voitures.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.matricule} {v.marque ? `(${v.marque})` : ''}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={2}>
              <Form.Group>
                <Form.Label>Projet</Form.Label>
                <Form.Select
                  value={filters.filterProjet}
                  onChange={(e) => setFilters({...filters, filterProjet: e.target.value})}
                >
                  <option value="">Tous les projets</option>
                  {projets.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={3}>
              <Form.Group>
                <Form.Label>Période</Form.Label>
                <Row>
                  <Col>
                    <Form.Control
                      type="date"
                      value={filters.dateDebut}
                      onChange={(e) => setFilters({...filters, dateDebut: e.target.value})}
                      placeholder="Début"
                    />
                  </Col>
                  <Col>
                    <Form.Control
                      type="date"
                      value={filters.dateFin}
                      onChange={(e) => setFilters({...filters, dateFin: e.target.value})}
                      min={filters.dateDebut}
                      placeholder="Fin"
                    />
                  </Col>
                </Row>
                <Form.Text className="text-muted">
                  Début = hier par défaut
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Contenu principal */}
      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Chargement des données...</p>
        </div>
      ) : showCumuls ? (
        <Card className="mb-4">
          <Card.Header className="bg-light d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <FaTachometerAlt className="me-2" />
              Cumuls par voiture - {periodeActive === 'hebdomadaire' ? 'Hebdomadaire' : periodeActive === 'mensuel' ? 'Mensuel' : 'Annuel'}
            </h5>
            <div>
              <Button 
                variant="outline-primary" 
                size="sm" 
                className="me-2" 
                onClick={exporterCumuls}
                disabled={cumuls[periodeActive]?.length === 0}
              >
                <FaFileExport className="me-2" /> Exporter CSV
              </Button>
              <Button 
                variant={periodeActive === 'hebdomadaire' ? 'primary' : 'outline-primary'} 
                size="sm" 
                className="me-2"
                onClick={() => setPeriodeActive('hebdomadaire')}
              >
                Hebdo
              </Button>
              <Button 
                variant={periodeActive === 'mensuel' ? 'primary' : 'outline-primary'} 
                size="sm" 
                className="me-2"
                onClick={() => setPeriodeActive('mensuel')}
              >
                Mensuel
              </Button>
              <Button 
                variant={periodeActive === 'annuel' ? 'primary' : 'outline-primary'} 
                size="sm"
                onClick={() => setPeriodeActive('annuel')}
              >
                Annuel
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Période</th>
                    <th>Équipement</th>
                    <th>Marque</th>
                    <th>Distance (km)</th>
                    <th>V.Enrobé</th>
                    <th>V.Tout-Venant</th>
                    <th>V.Gravier</th>
                    <th>Autre</th>
                    <th>Nb Voyages</th>
                    <th>Nb Chauffeurs</th>
                  </tr>
                </thead>
                <tbody>
                  {cumuls[periodeActive]?.length > 0 ? (
                    cumuls[periodeActive].map((cumul, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td><Badge bg="info">{cumul.periode}</Badge></td>
                        <td className="fw-bold">{cumul.voiture_matricule}</td>
                        <td>{cumul.voiture_marque}</td>
                        <td className="fw-bold text-primary">{cumul.distance.toFixed(0)} km</td>
                        <td><Badge bg="success" pill>{cumul.voyages.enrobe}</Badge></td>
                        <td><Badge bg="warning" pill>{cumul.voyages.tout_venant}</Badge></td>
                        <td><Badge bg="secondary" pill>{cumul.voyages.gravier}</Badge></td>
                        <td><Badge bg="light" text="dark" pill>{cumul.voyages.autre}</Badge></td>
                        <td><Badge bg="info" pill>{cumul.count}</Badge></td>
                        <td><Badge bg="primary" pill>{cumul.nb_chauffeurs || 1}</Badge></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="11" className="text-center py-4">
                        <div className="text-muted">Aucune donnée disponible pour les cumuls</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      ) : (
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Équipement</th>
                <th>Marque</th>
                <th>Projet</th>
                <th>Date</th>
                <th>Début</th>
                <th>Fin</th>
                <th>Distance</th>
                <th>Enrobé</th>
                <th>Tout-Venant</th>
                <th>Gravier</th>
                <th>Autre</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProductions.length > 0 ? (
                filteredProductions.map((production, index) => (
                  <tr key={production.id}>
                    <td>{index + 1}</td>
                    <td className="fw-bold">{production.voiture_info?.matricule || 'N/A'}</td>
                    <td>{production.voiture_info?.marque || '-'}</td>
                    <td>{production.projet_info?.name || 'N/A'}</td>
                    <td>{new Date(production.date_creation).toLocaleDateString('fr-FR')}</td>
                    <td className="text-end">{production.compteur_debut.toFixed(0)}</td>
                    <td className="text-end">{production.compteur_fin.toFixed(0)}</td>
                    <td className="text-end"><Badge bg="info" pill>{production.distance.toFixed(0)} km</Badge></td>
                    <td className="text-center">{production.voyage_enrobe > 0 ? <Badge bg="success" pill>{production.voyage_enrobe}</Badge> : '-'}</td>
                    <td className="text-center">{production.voyage_tout_venant > 0 ? <Badge bg="warning" pill>{production.voyage_tout_venant}</Badge> : '-'}</td>
                    <td className="text-center">{production.voyage_gravier_roche > 0 ? <Badge bg="secondary" pill>{production.voyage_gravier_roche}</Badge> : '-'}</td>
                    <td className="text-center">{production.autre > 0 ? <Badge bg="light" text="dark" pill>{production.autre}</Badge> : '-'}</td>
                    <td>
                      {canEdit() ? (
                        <div className="d-flex gap-2">
                          <Button variant="outline-warning" size="sm" onClick={() => handleEdit(production)} title="Modifier">
                            <FaEdit />
                          </Button>
                          <Button variant="outline-danger" size="sm" onClick={() => confirmDelete(production)} title="Supprimer">
                            <FaTrash />
                          </Button>
                        </div>
                      ) : (
                        <FaLock className="text-muted" />
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="13" className="text-center py-5">
                    <div className="text-muted">
                      {productions.length === 0 ? (
                        <>
                          <FaExclamationTriangle className="me-2" />
                          Aucune production de voiture enregistrée par les chauffeurs.
                          {canEdit() && " Cliquez sur 'Ajouter une production' pour commencer."}
                        </>
                      ) : (
                        "Aucune production ne correspond aux filtres sélectionnés."
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      )}

      {/* Modal d'ajout/modification */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingId ? 'Modifier' : 'Ajouter'} une production (enregistrement chauffeur)
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label><strong>Chauffeur</strong></Form.Label>
                  <Form.Select
                    name="chauffeur_id"
                    value={formData.chauffeur_id}
                    onChange={handleChange}
                  >
                    <option value="">Sélectionner un chauffeur (optionnel)</option>
                    {chauffeurs.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nom} {c.prenom} - {c.matricule}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label><strong>Équipement *</strong></Form.Label>
                  <Form.Select
                    name="voiture_id"
                    value={formData.voiture_id}
                    onChange={handleChange}
                    required
                    disabled={loadingRefs || voitures.length === 0}
                  >
                    <option value="">
                      {loadingRefs ? 'Chargement...' : voitures.length === 0 ? 'Aucun équipement' : 'Sélectionner...'}
                    </option>
                    {voitures.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.matricule} - {v.marque} {v.modele}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label><strong>Projet *</strong></Form.Label>
                  <Form.Select
                    name="projet_id"
                    value={formData.projet_id}
                    onChange={handleChange}
                    required
                    disabled={loadingRefs || projets.length === 0}
                  >
                    <option value="">
                      {loadingRefs ? 'Chargement...' : projets.length === 0 ? 'Aucun projet' : 'Sélectionner...'}
                    </option>
                    {projets.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label><strong>Date *</strong></Form.Label>
                  <Form.Control
                    type="date"
                    name="date_creation"
                    value={formData.date_creation}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Compteur début (km)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    name="compteur_debut"
                    value={formData.compteur_debut}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Compteur fin (km)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min={formData.compteur_debut || 0}
                    name="compteur_fin"
                    value={formData.compteur_fin}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Distance (km)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="distance"
                    value={formData.distance}
                    readOnly
                    className="bg-light"
                  />
                  <Form.Text className="text-muted">
                    {formData.compteur_fin || 0} - {formData.compteur_debut || 0} = {formData.distance || 0} km
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label className="small">Enrobé</Form.Label>
                  <Form.Control
                    type="number"
                    name="voyage_enrobe"
                    value={formData.voyage_enrobe}
                    onChange={handleChange}
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label className="small">Tout-venant</Form.Label>
                  <Form.Control
                    type="number"
                    name="voyage_tout_venant"
                    value={formData.voyage_tout_venant}
                    onChange={handleChange}
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label className="small">Gravier/Roche</Form.Label>
                  <Form.Control
                    type="number"
                    name="voyage_gravier_roche"
                    value={formData.voyage_gravier_roche}
                    onChange={handleChange}
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label className="small">Autre</Form.Label>
                  <Form.Control
                    type="number"
                    name="autre"
                    value={formData.autre}
                    onChange={handleChange}
                    min="0"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Alert variant="info" className="mt-3">
              <small>
                <strong>Note:</strong> Cette production sera enregistrée comme production de chauffeur 
                et apparaîtra automatiquement dans la liste des productions de voitures.
                Les champs marqués d'un * sont obligatoires.
              </small>
            </Alert>

            <div className="text-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowModal(false)} disabled={loading}>
                Annuler
              </Button>
              <Button 
                variant="primary" 
                type="submit" 
                disabled={loading || !isFormReady() || voitures.length === 0 || projets.length === 0}
              >
                {loading ? (
                  <>
                    <Spinner as="span" size="sm" animation="border" className="me-2" />
                    {editingId ? 'Mise à jour...' : 'Enregistrement...'}
                  </>
                ) : (
                  editingId ? 'Mettre à jour' : 'Enregistrer'
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Modal de confirmation de suppression */}
      <Modal show={!!deleteConfirm} onHide={cancelDelete}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmer la suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Êtes-vous sûr de vouloir supprimer cette production ?</p>
          {deleteConfirm && (
            <div className="alert alert-warning">
              <p className="mb-0">
                <strong>Équipement:</strong> {deleteConfirm.voiture_info?.matricule}<br />
                <strong>Date:</strong> {new Date(deleteConfirm.date_creation).toLocaleDateString('fr-FR')}<br />
                <strong>Distance:</strong> {deleteConfirm.distance} km
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cancelDelete}>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Supprimer
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ProductionVoitures;