import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Row, Col, Card, Table, Button,
  Form, Modal, Badge, Alert, Spinner,
  InputGroup, Tabs, Tab, ProgressBar
} from 'react-bootstrap';
import axios from 'axios';
import { 
  FaSearch, FaFilter, FaSync, FaEdit, FaTrash, 
  FaPlus, FaChartBar, FaUserTie, FaCar, FaTools,
  FaPhone, FaCalendar, FaBuilding, FaIdBadge,
  FaPlane, FaUmbrellaBeach, FaBed, FaClipboardCheck,
  FaProjectDiagram, FaUsers, FaFileExcel, FaDownload,
  FaLock, FaUserShield, FaUser
} from 'react-icons/fa';

const API_URL = 'https://intranet-attm.com/api';
const api = axios.create({ 
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000,
  withCredentials: true
});

// Intercepteur pour ajouter le token
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

// ============================================
// HOOK PERSONNALISÉ POUR LA GESTION DES PERMISSIONS
// ============================================
const usePermissions = () => {
  const [userRole, setUserRole] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        setUserLoading(true);
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            setUserRole(userData.role || userData.roles?.[0] || 'user');
            setUserName(userData.name || userData.email || 'Utilisateur');
            setUserLoading(false);
            return;
          } catch (e) {
            console.error("Erreur parsing user:", e);
          }
        }
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        if (token) {
          const response = await fetch(`${API_URL}/user`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          });
          if (response.ok) {
            const userData = await response.json();
            const role = userData.role || userData.roles?.[0] || 'user';
            setUserRole(role);
            setUserName(userData.name || userData.email || 'Utilisateur');
            localStorage.setItem('user', JSON.stringify({
              id: userData.id,
              email: userData.email,
              name: userData.name,
              role: role
            }));
          } else {
            setUserRole('user');
            setUserName('Utilisateur');
          }
        } else {
          setUserRole('user');
          setUserName('Utilisateur');
        }
      } catch (err) {
        console.error("Erreur récupération rôle:", err);
        setUserRole('user');
        setUserName('Utilisateur');
      } finally {
        setUserLoading(false);
      }
    };
    fetchUserRole();
  }, []);

  // ✅ Vérifier si l'utilisateur peut modifier (Admin ou DRH)
  const canEdit = useCallback(() => {
    const allowedRoles = ['admin', 'Admin', 'ADMIN', 'drh', 'DRH', 'Drh'];
    return allowedRoles.includes(userRole);
  }, [userRole]);

  // ✅ Vérifier si l'utilisateur est admin
  const isAdmin = useCallback(() => {
    const adminRoles = ['admin', 'Admin', 'ADMIN'];
    return adminRoles.includes(userRole);
  }, [userRole]);

  // ✅ Vérifier si l'utilisateur est DRH
  const isDRH = useCallback(() => {
    const drhRoles = ['drh', 'DRH', 'Drh'];
    return drhRoles.includes(userRole);
  }, [userRole]);

  // ✅ Obtenir le libellé du rôle
  const getRoleLabel = useCallback(() => {
    if (isAdmin()) return 'Administrateur';
    if (isDRH()) return 'DRH';
    return 'Consultation seule';
  }, [isAdmin, isDRH]);

  // ✅ Obtenir la couleur du badge de rôle
  const getRoleBadgeColor = useCallback(() => {
    if (isAdmin()) return 'danger';
    if (isDRH()) return 'warning';
    return 'secondary';
  }, [isAdmin, isDRH]);

  return {
    userRole,
    userName,
    userLoading,
    canEdit,
    isAdmin,
    isDRH,
    getRoleLabel,
    getRoleBadgeColor
  };
};

const GestionEmployeurs = () => {
  // Gestion des permissions
  const { userRole, userName, userLoading, canEdit, isAdmin, isDRH, getRoleLabel, getRoleBadgeColor } = usePermissions();

  const [state, setState] = useState({
    employeurs: [],
    projets: [],
    loading: true,
    error: null,
    showModal: false,
    editingEmployeur: null,
    showDeleteModal: false,
    employeurToDelete: null,
    filters: {
      statut: '',
      etat: '',
      action: '',
      projet_id: '',
      search: '',
      section: '',
      etat_special: '',
      date_debut_min: '',
      date_debut_max: ''
    },
    activeTab: 'liste',
    stats: {
      total: 0,
      parSection: {},
      parEtat: {},
      parAction: {},
      parProjet: {},
      enConges: 0,
      enMission: 0,
      malades: 0,
      actifs: 0,
      parTypeContrat: {}
    },
    projetsStats: []
  });

  // Options pour les selects
  const statutChoices = [
    { id: 'contractuel', nom: 'Contractuel', icon: '📝', color: 'primary' },
    { id: 'moo', nom: 'MOO', icon: '👷', color: 'info' },
    { id: 'cdi', nom: 'CDI', icon: '💼', color: 'success' },
    { id: 'cdd', nom: 'CDD', icon: '⏳', color: 'warning' }
  ];

  const etatChoices = [
    { id: 'actif', nom: 'Actif', icon: '✅', color: 'success' },
    { id: 'conge', nom: 'Congé', icon: '🏖️', color: 'warning' },
    { id: 'permission', nom: 'Permission', icon: '👤', color: 'info' },
    { id: 'malade', nom: 'Malade', icon: '🤒', color: 'danger' },
    { id: 'mission', nom: 'Mission', icon: '✈️', color: 'primary' },
    { id: 'autre', nom: 'Autre', icon: '❓', color: 'secondary' }
  ];

  const etatSpecialChoices = [
    { id: '', nom: 'Tous les états', icon: '📋', color: 'secondary' },
    { id: 'conge_mission', nom: 'Congés et Missions', icon: '🚀', color: 'info' },
    { id: 'conge', nom: 'En Congé', icon: '🏖️', color: 'warning' },
    { id: 'mission', nom: 'En Mission', icon: '✈️', color: 'primary' },
    { id: 'malade', nom: 'Malade', icon: '🤒', color: 'danger' },
    { id: 'actif', nom: 'Actifs uniquement', icon: '✅', color: 'success' },
    { id: 'permission', nom: 'Permission', icon: '👤', color: 'info' }
  ];

  const actionChoices = [
    { id: 'administratif', nom: 'Administratif', icon: '📋', color: 'dark' },
    { id: 'mecanicien', nom: 'Mécanicien', icon: '🔧', color: 'warning' },
    { id: 'chauffeur_pl', nom: 'Chauffeur PL', icon: '🚚', color: 'info' },
    { id: 'chauffeur_vl', nom: 'Chauffeur VL', icon: '🚗', color: 'primary' },
    { id: 'electricien', nom: 'Électricien', icon: '⚡', color: 'success' },
    { id: 'mechelin', nom: 'Mechelin', icon: '🔩', color: 'secondary' },
    { id: 'manoeuvre', nom: 'Manoeuvre', icon: '👷', color: 'light' },
    { id: 'conducteur_engin', nom: 'Conducteur Engin', icon: '🚜', color: 'warning' }
  ];

  const sectionChoices = [
    { id: 'central', nom: 'Central', icon: '🏢', color: 'primary' },
    { id: 'engin', nom: 'Engin', icon: '🚜', color: 'warning' },
    { id: 'usine', nom: 'Usine', icon: '🏭', color: 'info' },
    { id: 'chantier', nom: 'Chantier', icon: '🚧', color: 'danger' },
    { id: 'maintenance', nom: 'Maintenance', icon: '🔧', color: 'success' },
    { id: 'autre', nom: 'Autre', icon: '📍', color: 'secondary' }
  ];

  // Fonction utilitaire pour extraire les données de l'API
  const extractDataFromResponse = (responseData) => {
    if (!responseData) return [];
    
    if (Array.isArray(responseData)) {
      return responseData;
    }
    
    if (responseData.data && Array.isArray(responseData.data)) {
      return responseData.data;
    }
    
    if (responseData.results && Array.isArray(responseData.results)) {
      return responseData.results;
    }
    
    if (responseData.success && responseData.data && Array.isArray(responseData.data)) {
      return responseData.data;
    }
    
    console.warn('Format de réponse non reconnu:', responseData);
    return [];
  };

  // Charger les données initiales
  useEffect(() => {
    if (!userLoading) {
      fetchData();
    }
  }, [userLoading]);

  const fetchData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      console.log('🔄 Chargement des données...');
      
      const [employeursRes, projetsRes] = await Promise.all([
        api.get('/employeurs').catch(err => {
          console.error('Erreur employeurs:', err);
          throw new Error(`Erreur employeurs: ${err.message}`);
        }),
        api.get('/projets').catch(err => {
          console.warn('Projets non disponibles:', err.message);
          return { data: [] };
        })
      ]);
      
      const tousEmployeurs = extractDataFromResponse(employeursRes.data);
      const tousProjets = extractDataFromResponse(projetsRes.data);
      
      console.log(`📊 ${tousEmployeurs.length} employeurs chargés`);
      console.log(`🏗️ ${tousProjets.length} projets chargés`);
      
      const stats = calculateStats(tousEmployeurs);
      const projetsStats = calculateProjetsStats(tousEmployeurs, tousProjets);
      
      setState(prev => ({
        ...prev,
        employeurs: tousEmployeurs,
        projets: tousProjets,
        stats,
        projetsStats,
        loading: false,
        error: null
      }));
      
    } catch (err) {
      console.error('💥 Erreur chargement données:', err);
      
      let errorMessage = 'Erreur lors du chargement des données';
      
      if (err.response) {
        const status = err.response.status;
        if (status === 401) {
          errorMessage = 'Erreur 401: Authentification requise.';
        } else if (status === 404) {
          errorMessage = 'Erreur 404: Route non trouvée.';
        } else if (status === 500) {
          errorMessage = 'Erreur 500: Problème serveur.';
        } else {
          errorMessage = `Erreur ${status}: ${err.response.data?.message || 'Erreur serveur'}`;
        }
      } else if (err.request) {
        errorMessage = `Impossible de joindre le serveur à ${API_URL}. Vérifiez que le serveur Laravel est démarré.`;
      } else {
        errorMessage = err.message || 'Erreur inconnue';
      }
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
    }
  };

  // Calculer les statistiques des employeurs
  const calculateStats = (employeurs) => {
    const stats = {
      total: employeurs.length,
      parSection: {},
      parEtat: {},
      parAction: {},
      parProjet: {},
      parTypeContrat: {},
      enConges: 0,
      enMission: 0,
      malades: 0,
      actifs: 0,
      permissions: 0
    };
    
    employeurs.forEach(employeur => {
      stats.parSection[employeur.section] = (stats.parSection[employeur.section] || 0) + 1;
      stats.parEtat[employeur.etat] = (stats.parEtat[employeur.etat] || 0) + 1;
      stats.parAction[employeur.action] = (stats.parAction[employeur.action] || 0) + 1;
      
      if (employeur.projet_id) {
        stats.parProjet[employeur.projet_id] = (stats.parProjet[employeur.projet_id] || 0) + 1;
      }
      
      stats.parTypeContrat[employeur.statut] = (stats.parTypeContrat[employeur.statut] || 0) + 1;
      
      if (employeur.etat === 'conge') {
        stats.enConges += 1;
      } else if (employeur.etat === 'mission') {
        stats.enMission += 1;
      } else if (employeur.etat === 'malade') {
        stats.malades += 1;
      } else if (employeur.etat === 'actif') {
        stats.actifs += 1;
      } else if (employeur.etat === 'permission') {
        stats.permissions += 1;
      }
    });
    
    return stats;
  };

  // Calculer les statistiques par projet
  const calculateProjetsStats = (employeurs, projets) => {
    return projets.map(projet => {
      const employesDuProjet = employeurs.filter(e => e.projet_id == projet.id);
      const enConges = employesDuProjet.filter(e => e.etat === 'conge').length;
      const enMission = employesDuProjet.filter(e => e.etat === 'mission').length;
      const actifs = employesDuProjet.filter(e => e.etat === 'actif').length;
      
      return {
        ...projet,
        total: employesDuProjet.length,
        enConges,
        enMission,
        actifs,
        tauxAbsence: employesDuProjet.length > 0 
          ? (((enConges + enMission) / employesDuProjet.length) * 100).toFixed(1)
          : 0
      };
    }).sort((a, b) => b.total - a.total);
  };

  // Filtrer les employeurs
  const filteredEmployeurs = state.employeurs.filter(employeur => {
    const {
      statut, etat, action, projet_id, search, section, etat_special,
      date_debut_min, date_debut_max
    } = state.filters;
    
    if (etat_special === 'conge_mission') {
      if (employeur.etat !== 'conge' && employeur.etat !== 'mission') {
        return false;
      }
    } else if (etat_special && etat_special !== '' && employeur.etat !== etat_special) {
      return false;
    }
    
    if (date_debut_min && employeur.date_debut) {
      if (new Date(employeur.date_debut) < new Date(date_debut_min)) {
        return false;
      }
    }
    
    if (date_debut_max && employeur.date_debut) {
      if (new Date(employeur.date_debut) > new Date(date_debut_max)) {
        return false;
      }
    }
    
    return (
      (!statut || employeur.statut === statut) &&
      (!etat || employeur.etat === etat) &&
      (!action || employeur.action === action) &&
      (!projet_id || employeur.projet_id == projet_id) &&
      (!section || employeur.section === section) &&
      (!search || 
        (employeur.nom && employeur.nom.toLowerCase().includes(search.toLowerCase())) ||
        (employeur.matricule && employeur.matricule.toLowerCase().includes(search.toLowerCase())) ||
        (employeur.telephone && employeur.telephone.includes(search)) ||
        (employeur.observations && employeur.observations.toLowerCase().includes(search.toLowerCase()))
      )
    );
  });

  const getChoiceDetails = (choices, id) => {
    const choice = choices.find(c => c.id === id);
    return choice || { 
      id, 
      nom: id || 'Non défini', 
      icon: '❓', 
      color: 'secondary'
    };
  };

  const getNomProjet = (projetId) => {
    if (!projetId) return 'Non assigné';
    const projet = state.projets.find(p => p.id == projetId);
    return projet ? (projet.nom || projet.name || `Projet ${projetId}`) : `Projet ${projetId}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch (e) {
      return dateString;
    }
  };

  const calculateAnciennete = (dateDebut) => {
    if (!dateDebut) return '-';
    try {
      const startDate = new Date(dateDebut);
      const today = new Date();
      
      let years = today.getFullYear() - startDate.getFullYear();
      let months = today.getMonth() - startDate.getMonth();
      
      if (months < 0) {
        years--;
        months += 12;
      }
      
      if (years > 0) {
        return `${years} an${years > 1 ? 's' : ''} ${months > 0 ? `${months} mois` : ''}`;
      } else {
        return `${months} mois`;
      }
    } catch (e) {
      return '-';
    }
  };

  const handleShowModal = (employeur = null) => {
    if (!canEdit) {
      alert("Vous n'avez pas les permissions pour ajouter ou modifier des employés");
      return;
    }
    setState(prev => ({ ...prev, showModal: true, editingEmployeur: employeur }));
  };

  const handleCloseModal = () => {
    setState(prev => ({ ...prev, showModal: false, editingEmployeur: null }));
  };

  const handleShowDeleteModal = (employeur) => {
    if (!canEdit) {
      alert("Vous n'avez pas les permissions pour supprimer des employés");
      return;
    }
    setState(prev => ({ ...prev, showDeleteModal: true, employeurToDelete: employeur }));
  };

  const handleCloseDeleteModal = () => {
    setState(prev => ({ ...prev, showDeleteModal: false, employeurToDelete: null }));
  };

  const handleSave = async (formData) => {
    if (!canEdit) {
      alert("Vous n'avez pas les permissions pour effectuer cette action");
      return;
    }

    try {
      const requiredFields = ['matricule', 'nom', 'section', 'action'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        alert(`Champs obligatoires manquants: ${missingFields.join(', ')}`);
        return;
      }

      const dataToSend = {
        matricule: formData.matricule.trim(),
        nom: formData.nom.trim(),
        telephone: formData.telephone?.trim() || '',
        projet_id: formData.projet_id || null,
        date_debut: formData.date_debut,
        date_fin: formData.date_fin || null,
        statut: formData.statut || 'contractuel',
        etat: formData.etat || 'actif',
        action: formData.action,
        section: formData.section,
        observations: formData.observations?.trim() || ''
      };

      console.log('💾 Données envoyées:', dataToSend);

      let response;
      if (formData.id) {
        response = await api.put(`/employeurs/${formData.id}`, dataToSend);
      } else {
        response = await api.post('/employeurs', dataToSend);
      }

      console.log('✅ Réponse:', response.data);
      await fetchData();
      handleCloseModal();
      alert(`✅ ${formData.id ? 'Modification' : 'Ajout'} réussie!`);

    } catch (error) {
      console.error('💥 Erreur sauvegarde:', error);
      
      if (error.response?.status === 422) {
        const errors = error.response.data.errors || {};
        let errorMessage = "Erreurs de validation:\n";
        Object.entries(errors).forEach(([field, messages]) => {
          errorMessage += `• ${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}\n`;
        });
        alert(errorMessage);
      } else {
        alert(`❌ Erreur: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const handleDelete = async () => {
    if (!canEdit) {
      alert("Vous n'avez pas les permissions pour supprimer des employés");
      return;
    }
    if (!state.employeurToDelete) return;
    
    try {
      await api.delete(`/employeurs/${state.employeurToDelete.id}`);
      await fetchData();
      handleCloseDeleteModal();
      alert('✅ Employé supprimé avec succès!');
      
    } catch (error) {
      console.error('💥 Erreur suppression:', error);
      alert(`❌ Erreur suppression: ${error.response?.data?.message || error.message}`);
    }
  };

  const resetFilters = () => {
    setState(prev => ({
      ...prev,
      filters: {
        statut: '',
        etat: '',
        action: '',
        projet_id: '',
        search: '',
        section: '',
        etat_special: '',
        date_debut_min: '',
        date_debut_max: ''
      }
    }));
  };

  const exportToCSV = () => {
    const headers = [
      'ID', 'Matricule', 'Nom', 'Téléphone', 'Section', 'Fonction',
      'Statut Contrat', 'État', 'Projet', 'Date Début', 'Date Fin', 
      'Ancienneté', 'Observations'
    ];
    
    const data = filteredEmployeurs.map(employeur => [
      employeur.id,
      employeur.matricule,
      employeur.nom,
      employeur.telephone || '',
      getChoiceDetails(sectionChoices, employeur.section).nom,
      getChoiceDetails(actionChoices, employeur.action).nom,
      getChoiceDetails(statutChoices, employeur.statut).nom,
      getChoiceDetails(etatChoices, employeur.etat).nom,
      getNomProjet(employeur.projet_id),
      formatDate(employeur.date_debut),
      formatDate(employeur.date_fin),
      calculateAnciennete(employeur.date_debut),
      employeur.observations || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...data.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `employeurs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportProjetsStatsCSV = () => {
    const headers = [
      'ID Projet', 'Nom Projet', 'Total Employés', 'Actifs', 'En Congé',
      'En Mission', 'Malades', 'Taux Absence %', 'Date Export'
    ];
    
    const data = state.projetsStats.map(projet => [
      projet.id,
      getNomProjet(projet.id),
      projet.total || 0,
      projet.actifs || 0,
      projet.enConges || 0,
      projet.enMission || 0,
      projet.malades || 0,
      projet.tauxAbsence || '0.0',
      new Date().toLocaleDateString('fr-FR')
    ]);
    
    const csvContent = [
      headers.join(','),
      ...data.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `statistiques_projets_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRefresh = () => {
    fetchData();
  };

  if (userLoading || state.loading) {
    return (
      <Container fluid className="py-5">
        <Row className="justify-content-center">
          <Col md={6} className="text-center">
            <Spinner animation="border" variant="primary" size="lg" />
            <h4 className="mt-3">Chargement des données...</h4>
            <p className="text-muted">Connexion à {API_URL}</p>
            <div className="mt-3">
              <Button variant="outline-primary" onClick={handleRefresh}>
                <FaSync className="me-2" />
                Rafraîchir
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  if (state.error) {
    return (
      <Container fluid className="py-4">
        <Alert variant="danger" className="shadow">
          <h4 className="alert-heading">
            <FaUserTie className="me-2" />
            Erreur de chargement
          </h4>
          <p style={{ whiteSpace: 'pre-line' }}>{state.error}</p>
          <hr />
          <div className="d-flex gap-2 mt-3">
            <Button variant="danger" onClick={handleRefresh}>
              <FaSync className="me-2" />
              Réessayer
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Card className="shadow-lg border-0">
        <Card.Header className="bg-primary text-white py-3">
          <Row className="align-items-center">
            <Col>
              <h3 className="mb-0">
                <FaUsers className="me-2" />
                Gestion des Employés
              </h3>
              <div className="mt-1">
                <Badge bg={getRoleBadgeColor()} className="me-2">
                  {canEdit ? <FaUserShield className="me-1" size={12} /> : <FaUser className="me-1" size={12} />}
                  {getRoleLabel()}
                </Badge>
                <small className="text-white-50">
                  Connecté: {userName}
                </small>
              </div>
            </Col>
            <Col xs="auto">
              <div className="d-flex gap-2">
                <Button variant="light" size="sm" onClick={handleRefresh}>
                  <FaSync className="me-1" />
                  Actualiser
                </Button>
                <Button variant="outline-light" size="sm" onClick={exportToCSV}>
                  <FaFileExcel className="me-1" />
                  Export
                </Button>
                {canEdit && (
                  <Button variant="success" size="sm" onClick={() => handleShowModal()}>
                    <FaPlus className="me-1" />
                    Nouvel employé
                  </Button>
                )}
              </div>
            </Col>
          </Row>
        </Card.Header>
        
        <Card.Body className="p-4">
          {!canEdit && (
            <Alert variant="secondary" className="mb-4">
              <FaLock className="me-2" />
              <strong>Mode consultation seule</strong> - Vous pouvez consulter les données mais pas les modifier
            </Alert>
          )}

          {/* STATISTIQUES RAPIDES */}
          <Row className="mb-4 g-3">
            <Col md={2}>
              <Card className="border-primary border-2">
                <Card.Body className="py-3 text-center">
                  <h5 className="text-muted mb-1">Total</h5>
                  <h2 className="mb-0 text-primary">{state.stats.total}</h2>
                  <small className="text-muted">Employés</small>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={2}>
              <Card className="border-success border-2">
                <Card.Body className="py-3 text-center">
                  <h5 className="text-muted mb-1">Actifs</h5>
                  <h2 className="mb-0 text-success">{state.stats.actifs}</h2>
                  <small className="text-muted">
                    {state.stats.total > 0 ? ((state.stats.actifs / state.stats.total) * 100).toFixed(1) : 0}%
                  </small>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={2}>
              <Card className="border-warning border-2">
                <Card.Body className="py-3 text-center">
                  <h5 className="text-muted mb-1">
                    <FaUmbrellaBeach className="me-1" />
                    Congés
                  </h5>
                  <h2 className="mb-0 text-warning">{state.stats.enConges}</h2>
                  <small className="text-muted">
                    {state.stats.total > 0 ? ((state.stats.enConges / state.stats.total) * 100).toFixed(1) : 0}%
                  </small>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={2}>
              <Card className="border-info border-2">
                <Card.Body className="py-3 text-center">
                  <h5 className="text-muted mb-1">
                    <FaPlane className="me-1" />
                    Missions
                  </h5>
                  <h2 className="mb-0 text-info">{state.stats.enMission}</h2>
                  <small className="text-muted">
                    {state.stats.total > 0 ? ((state.stats.enMission / state.stats.total) * 100).toFixed(1) : 0}%
                  </small>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={2}>
              <Card className="border-danger border-2">
                <Card.Body className="py-3 text-center">
                  <h5 className="text-muted mb-1">
                    <FaBed className="me-1" />
                    Malades
                  </h5>
                  <h2 className="mb-0 text-danger">{state.stats.malades}</h2>
                  <small className="text-muted">
                    {state.stats.total > 0 ? ((state.stats.malades / state.stats.total) * 100).toFixed(1) : 0}%
                  </small>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={2}>
              <Card className="border-secondary border-2">
                <Card.Body className="py-3 text-center">
                  <h5 className="text-muted mb-1">Projets</h5>
                  <h2 className="mb-0 text-secondary">{state.projets.length}</h2>
                  <small className="text-muted">
                    {state.projetsStats.filter(p => p.total > 0).length} avec employés
                  </small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* TABS */}
          <Tabs
            activeKey={state.activeTab}
            onSelect={(tab) => setState(prev => ({ ...prev, activeTab: tab }))}
            className="mb-4 border-bottom-0"
          >
            {/* TAB 1: Liste des employés */}
            <Tab eventKey="liste" title={
              <span>
                <FaUsers className="me-1" />
                Employés ({filteredEmployeurs.length})
              </span>
            }>
              {/* FILTRES */}
              <Card className="mb-4 border shadow-sm">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">
                    <FaFilter className="me-2" />
                    Filtres avancés
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Row className="g-3">
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>
                          <FaSearch className="me-1" />
                          Recherche
                        </Form.Label>
                        <InputGroup>
                          <Form.Control
                            type="text"
                            placeholder="Nom, matricule, téléphone..."
                            value={state.filters.search}
                            onChange={e => setState(prev => ({
                              ...prev,
                              filters: { ...prev.filters, search: e.target.value }
                            }))}
                          />
                          <Button variant="outline-secondary">
                            <FaSearch />
                          </Button>
                        </InputGroup>
                      </Form.Group>
                    </Col>

                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>
                          <FaClipboardCheck className="me-1" />
                          État spécial
                        </Form.Label>
                        <Form.Select
                          value={state.filters.etat_special}
                          onChange={e => setState(prev => ({
                            ...prev,
                            filters: { ...prev.filters, etat_special: e.target.value }
                          }))}
                        >
                          {etatSpecialChoices.map(etat => (
                            <option key={etat.id} value={etat.id}>
                              {etat.icon} {etat.nom}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>
                          <FaProjectDiagram className="me-1" />
                          Projet
                        </Form.Label>
                        <Form.Select
                          value={state.filters.projet_id}
                          onChange={e => setState(prev => ({
                            ...prev,
                            filters: { ...prev.filters, projet_id: e.target.value }
                          }))}
                        >
                          <option value="">Tous les projets</option>
                          {state.projets.map(projet => (
                            <option key={projet.id} value={projet.id}>
                              {getNomProjet(projet.id)}
                              {state.stats.parProjet[projet.id] > 0 && 
                                ` (${state.stats.parProjet[projet.id]})`
                              }
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>
                          <FaBuilding className="me-1" />
                          Section
                        </Form.Label>
                        <Form.Select
                          value={state.filters.section}
                          onChange={e => setState(prev => ({
                            ...prev,
                            filters: { ...prev.filters, section: e.target.value }
                          }))}
                        >
                          <option value="">Toutes les sections</option>
                          {sectionChoices.map(section => (
                            <option key={section.id} value={section.id}>
                              {section.icon} {section.nom}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Fonction</Form.Label>
                        <Form.Select
                          value={state.filters.action}
                          onChange={e => setState(prev => ({
                            ...prev,
                            filters: { ...prev.filters, action: e.target.value }
                          }))}
                        >
                          <option value="">Toutes les fonctions</option>
                          {actionChoices.map(action => (
                            <option key={action.id} value={action.id}>
                              {action.icon} {action.nom}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>État</Form.Label>
                        <Form.Select
                          value={state.filters.etat}
                          onChange={e => setState(prev => ({
                            ...prev,
                            filters: { ...prev.filters, etat: e.target.value }
                          }))}
                        >
                          <option value="">Tous les états</option>
                          {etatChoices.map(etat => (
                            <option key={etat.id} value={etat.id}>
                              {etat.icon} {etat.nom}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Statut Contrat</Form.Label>
                        <Form.Select
                          value={state.filters.statut}
                          onChange={e => setState(prev => ({
                            ...prev,
                            filters: { ...prev.filters, statut: e.target.value }
                          }))}
                        >
                          <option value="">Tous les statuts</option>
                          {statutChoices.map(statut => (
                            <option key={statut.id} value={statut.id}>
                              {statut.icon} {statut.nom}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>
                          <FaCalendar className="me-1" />
                          Date début (min)
                        </Form.Label>
                        <Form.Control
                          type="date"
                          value={state.filters.date_debut_min}
                          onChange={e => setState(prev => ({
                            ...prev,
                            filters: { ...prev.filters, date_debut_min: e.target.value }
                          }))}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* RÉSULTATS ET ACTIONS */}
              <Row className="mb-3">
                <Col>
                  <Alert variant="info" className="py-2 d-flex justify-content-between align-items-center">
                    <div>
                      <strong>Résultats :</strong> {filteredEmployeurs.length} employé(s) trouvé(s)
                      {state.filters.etat_special && (
                        <Badge bg="info" className="ms-2">
                          {etatSpecialChoices.find(e => e.id === state.filters.etat_special)?.nom}
                        </Badge>
                      )}
                    </div>
                    <div className="d-flex gap-2">
                      <Button variant="outline-secondary" size="sm" onClick={resetFilters}>
                        <FaSync className="me-1" />
                        Réinitialiser filtres
                      </Button>
                      <Button variant="outline-success" size="sm" onClick={exportToCSV}>
                        <FaFileExcel className="me-1" />
                        Export CSV
                      </Button>
                    </div>
                  </Alert>
                </Col>
              </Row>

              {/* TABLEAU DES EMPLOYÉS */}
              <div className="table-responsive">
                <Table striped bordered hover className="align-middle">
                  <thead className="table-dark">
                    <tr>
                      <th>Matricule</th>
                      <th>Nom</th>
                      <th>Téléphone</th>
                      <th>Section</th>
                      <th>Fonction</th>
                      <th>Statut</th>
                      <th>État</th>
                      <th>Projet</th>
                      <th>Date Début</th>
                      <th>Ancienneté</th>
                      <th style={{ width: '120px' }} className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployeurs.length > 0 ? (
                      filteredEmployeurs.map((employeur) => {
                        const section = getChoiceDetails(sectionChoices, employeur.section);
                        const action = getChoiceDetails(actionChoices, employeur.action);
                        const statut = getChoiceDetails(statutChoices, employeur.statut);
                        const etat = getChoiceDetails(etatChoices, employeur.etat);
                        
                        let rowClass = '';
                        if (employeur.etat === 'conge') rowClass = 'table-warning';
                        else if (employeur.etat === 'mission') rowClass = 'table-info';
                        else if (employeur.etat === 'malade') rowClass = 'table-danger';
                        else if (employeur.etat === 'permission') rowClass = 'table-light';

                        return (
                          <tr key={employeur.id} className={rowClass}>
                            <td className="fw-bold">
                              <FaIdBadge className="me-1 text-muted" />
                              {employeur.matricule}
                            </td>
                            <td>
                              <div>
                                <strong>{employeur.nom}</strong>
                                {employeur.observations && (
                                  <div className="text-muted small mt-1">
                                    <em>{employeur.observations}</em>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>
                              {employeur.telephone ? (
                                <>
                                  <FaPhone className="me-1 text-muted" />
                                  {employeur.telephone}
                                </>
                              ) : '-'}
                            </td>
                            <td>
                              <Badge bg={section.color}>
                                {section.icon} {section.nom}
                              </Badge>
                            </td>
                            <td>
                              <Badge bg={action.color}>
                                {action.icon} {action.nom}
                              </Badge>
                            </td>
                            <td>
                              <Badge bg={statut.color}>
                                {statut.icon} {statut.nom}
                              </Badge>
                            </td>
                            <td>
                              <Badge bg={etat.color}>
                                {etat.icon} {etat.nom}
                              </Badge>
                            </td>
                            <td>
                              {employeur.projet_id ? (
                                <Badge bg="secondary">
                                  <FaBuilding className="me-1" />
                                  {getNomProjet(employeur.projet_id)}
                                </Badge>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              {employeur.date_debut ? (
                                <>
                                  <FaCalendar className="me-1 text-muted" />
                                  {formatDate(employeur.date_debut)}
                                </>
                              ) : '-'}
                            </td>
                            <td>
                              <small>{calculateAnciennete(employeur.date_debut)}</small>
                            </td>
                            <td className="text-center">
                              {canEdit ? (
                                <div className="d-flex gap-1 justify-content-center">
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => handleShowModal(employeur)}
                                    title="Modifier"
                                  >
                                    <FaEdit />
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleShowDeleteModal(employeur)}
                                    title="Supprimer"
                                  >
                                    <FaTrash />
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-muted" title="Lecture seule">
                                  <FaLock size={14} />
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="11" className="text-center py-5">
                          <Alert variant="light" className="border">
                            <div className="py-4">
                              <h5 className="text-muted">
                                {state.employeurs.length === 0 
                                  ? "📭 Aucun employé dans la base de données"
                                  : "🔍 Aucun employé ne correspond à vos critères"
                                }
                              </h5>
                              <p className="text-muted mt-3">
                                {state.employeurs.length === 0 
                                  ? "Cliquez sur 'Nouvel employé' pour commencer"
                                  : "Essayez de modifier vos filtres ou réinitialisez-les"
                                }
                              </p>
                              <div className="mt-3">
                                {canEdit && (
                                  <Button 
                                    variant="primary" 
                                    onClick={() => handleShowModal()}
                                    className="me-2"
                                  >
                                    <FaPlus className="me-1" />
                                    Nouvel employé
                                  </Button>
                                )}
                                <Button 
                                  variant="outline-secondary" 
                                  onClick={resetFilters}
                                >
                                  <FaSync className="me-1" />
                                  Réinitialiser filtres
                                </Button>
                              </div>
                            </div>
                          </Alert>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Tab>

            {/* TAB 2: Statistiques */}
            <Tab eventKey="statistiques" title={
              <span>
                <FaChartBar className="me-1" />
                Statistiques
              </span>
            }>
              <Row className="mb-4">
                <Col>
                  <Card className="shadow-sm">
                    <Card.Header className="bg-secondary text-white d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">
                        <FaProjectDiagram className="me-2" />
                        Statistiques par Projet
                      </h6>
                      <Button 
                        variant="outline-light" 
                        size="sm"
                        onClick={exportProjetsStatsCSV}
                      >
                        <FaDownload className="me-1" />
                        Export CSV
                      </Button>
                    </Card.Header>
                    <Card.Body>
                      <div className="table-responsive">
                        <Table striped bordered hover>
                          <thead>
                            <tr>
                              <th>Projet</th>
                              <th className="text-center">Total</th>
                              <th className="text-center">Actifs</th>
                              <th className="text-center">
                                <FaUmbrellaBeach className="me-1" />
                                Congés
                              </th>
                              <th className="text-center">
                                <FaPlane className="me-1" />
                                Missions
                              </th>
                              <th className="text-center">
                                <FaBed className="me-1" />
                                Malades
                              </th>
                              <th className="text-center">Taux d'absence</th>
                            </tr>
                          </thead>
                          <tbody>
                            {state.projetsStats.map((projet) => (
                              <tr key={projet.id}>
                                <td>
                                  <strong>{getNomProjet(projet.id)}</strong>
                                  {projet.description && (
                                    <div className="text-muted small">{projet.description}</div>
                                  )}
                                </td>
                                <td className="text-center fw-bold">{projet.total || 0}</td>
                                <td className="text-center">
                                  <Badge bg="success">{projet.actifs || 0}</Badge>
                                </td>
                                <td className="text-center">
                                  <Badge bg="warning">{projet.enConges || 0}</Badge>
                                </td>
                                <td className="text-center">
                                  <Badge bg="info">{projet.enMission || 0}</Badge>
                                </td>
                                <td className="text-center">
                                  <Badge bg="danger">{projet.malades || 0}</Badge>
                                </td>
                                <td className="text-center">
                                  <Badge bg={projet.tauxAbsence > 20 ? 'danger' : projet.tauxAbsence > 10 ? 'warning' : 'success'}>
                                    {projet.tauxAbsence || '0.0'}%
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                            
                            <tr className="table-primary fw-bold">
                              <td>TOTAL GÉNÉRAL</td>
                              <td className="text-center">{state.stats.total}</td>
                              <td className="text-center">{state.stats.actifs}</td>
                              <td className="text-center">{state.stats.enConges}</td>
                              <td className="text-center">{state.stats.enMission}</td>
                              <td className="text-center">{state.stats.malades}</td>
                              <td className="text-center">
                                <Badge bg="primary">
                                  {state.stats.total > 0 
                                    ? (((state.stats.enConges + state.stats.enMission + state.stats.malades) / state.stats.total) * 100).toFixed(1) 
                                    : '0.0'}%
                                </Badge>
                              </td>
                            </tr>
                          </tbody>
                        </Table>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Tab>
          </Tabs>
        </Card.Body>
        
        <Card.Footer className="bg-light d-flex justify-content-between align-items-center">
          <div>
            <small className="text-muted">
              Dernière mise à jour: {new Date().toLocaleString('fr-FR')}
            </small>
          </div>
          <div className="d-flex gap-3">
            <small>
              <Badge bg="success" className="me-1">{state.stats.actifs}</Badge> actifs
            </small>
            <small>
              <Badge bg="warning" className="me-1">{state.stats.enConges}</Badge> congés
            </small>
            <small>
              <Badge bg="info" className="me-1">{state.stats.enMission}</Badge> missions
            </small>
            <small>
              <Badge bg="secondary" className="me-1">{state.projets.length}</Badge> projets
            </small>
          </div>
        </Card.Footer>
      </Card>

      {/* Modal d'ajout/modification */}
      <EmployeurModal
        show={state.showModal}
        onHide={handleCloseModal}
        onSave={handleSave}
        employeur={state.editingEmployeur}
        projets={state.projets}
        statutChoices={statutChoices}
        etatChoices={etatChoices}
        actionChoices={actionChoices}
        sectionChoices={sectionChoices}
        canEdit={canEdit}
      />

      {/* Modal de confirmation de suppression */}
      <Modal show={state.showDeleteModal} onHide={handleCloseDeleteModal} centered>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>🗑️ Confirmer la suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Êtes-vous sûr de vouloir supprimer l'employé :</p>
          <div className="alert alert-danger">
            <h5 className="mb-1">
              {state.employeurToDelete?.matricule} - {state.employeurToDelete?.nom}
            </h5>
            <div className="small">
              <div>
                <strong>Section:</strong> {getChoiceDetails(sectionChoices, state.employeurToDelete?.section).nom}
              </div>
              <div>
                <strong>Fonction:</strong> {getChoiceDetails(actionChoices, state.employeurToDelete?.action).nom}
              </div>
              <div>
                <strong>Projet:</strong> {getNomProjet(state.employeurToDelete?.projet_id)}
              </div>
            </div>
          </div>
          <p className="text-danger mt-3">
            <strong>⚠️ Cette action est irréversible !</strong>
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteModal}>
            Annuler
          </Button>
          {canEdit && (
            <Button variant="danger" onClick={handleDelete}>
              <FaTrash className="me-1" />
              Supprimer définitivement
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

// Composant Modal pour l'édition/ajout
const EmployeurModal = ({ 
  show, 
  onHide, 
  onSave, 
  employeur, 
  projets,
  statutChoices,
  etatChoices,
  actionChoices,
  sectionChoices,
  canEdit = true
}) => {
  const [formData, setFormData] = useState({
    matricule: '',
    nom: '',
    telephone: '',
    projet_id: '',
    date_debut: '',
    date_fin: '',
    statut: 'contractuel',
    etat: 'actif',
    action: '',
    section: '',
    observations: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (employeur) {
      setFormData({
        id: employeur.id,
        matricule: employeur.matricule || '',
        nom: employeur.nom || '',
        telephone: employeur.telephone || '',
        projet_id: employeur.projet_id || '',
        date_debut: employeur.date_debut ? 
          new Date(employeur.date_debut).toISOString().split('T')[0] : '',
        date_fin: employeur.date_fin ? 
          new Date(employeur.date_fin).toISOString().split('T')[0] : '',
        statut: employeur.statut || 'contractuel',
        etat: employeur.etat || 'actif',
        action: employeur.action || '',
        section: employeur.section || '',
        observations: employeur.observations || ''
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        matricule: '',
        nom: '',
        telephone: '',
        projet_id: '',
        date_debut: today,
        date_fin: '',
        statut: 'contractuel',
        etat: 'actif',
        action: '',
        section: '',
        observations: ''
      });
    }
    setErrors({});
    setIsSubmitting(false);
  }, [employeur, show]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.matricule.trim()) newErrors.matricule = 'Le matricule est obligatoire';
    if (!formData.nom.trim()) newErrors.nom = 'Le nom est obligatoire';
    if (!formData.section) newErrors.section = 'La section est obligatoire';
    if (!formData.action) newErrors.action = 'La fonction est obligatoire';
    if (!formData.date_debut) newErrors.date_debut = 'La date de début est obligatoire';
    
    if (formData.telephone && !/^[\d\s+\-().]{8,20}$/.test(formData.telephone)) {
      newErrors.telephone = 'Numéro de téléphone invalide';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) {
      alert("Vous n'avez pas les permissions pour effectuer cette action");
      return;
    }
    if (!validateForm()) return;
    setIsSubmitting(true);
    await onSave(formData);
    setIsSubmitting(false);
  };

  const handleFieldChange = (field, value) => {
    if (!canEdit) return;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered backdrop="static">
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          {employeur ? (
            <>
              <FaEdit className="me-2" />
              Modifier l'Employé
            </>
          ) : (
            <>
              <FaPlus className="me-2" />
              Ajouter un Employé
            </>
          )}
          {!canEdit && (
            <Badge bg="secondary" className="ms-2">
              <FaLock className="me-1" size={12} /> Lecture seule
            </Badge>
          )}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {!canEdit && (
            <Alert variant="secondary" className="mb-3">
              <FaLock className="me-2" />
              <strong>Mode consultation seule</strong> - Vous ne pouvez pas modifier les données
            </Alert>
          )}
          {Object.keys(errors).length > 0 && (
            <Alert variant="danger" className="small">
              <strong>Veuillez corriger les erreurs suivantes :</strong>
              <ul className="mb-0 mt-2">
                {Object.entries(errors).map(([field, message]) => (
                  message && <li key={field}>{message}</li>
                ))}
              </ul>
            </Alert>
          )}
          
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold">
                  <FaIdBadge className="me-1" />
                  Matricule *
                </Form.Label>
                <Form.Control
                  type="text"
                  value={formData.matricule}
                  onChange={e => handleFieldChange('matricule', e.target.value)}
                  isInvalid={!!errors.matricule}
                  placeholder="Ex: EMP001"
                  disabled={!canEdit || isSubmitting}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.matricule}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold">
                  👤 Nom *
                </Form.Label>
                <Form.Control
                  type="text"
                  value={formData.nom}
                  onChange={e => handleFieldChange('nom', e.target.value)}
                  isInvalid={!!errors.nom}
                  placeholder="Nom complet"
                  disabled={!canEdit || isSubmitting}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.nom}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold">
                  <FaPhone className="me-1" />
                  Téléphone
                </Form.Label>
                <Form.Control
                  type="text"
                  value={formData.telephone}
                  onChange={e => handleFieldChange('telephone', e.target.value)}
                  isInvalid={!!errors.telephone}
                  placeholder="Ex: +212 6XX-XXXXXX"
                  disabled={!canEdit || isSubmitting}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.telephone}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold">
                  <FaBuilding className="me-1" />
                  Section *
                </Form.Label>
                <Form.Select
                  value={formData.section}
                  onChange={e => handleFieldChange('section', e.target.value)}
                  isInvalid={!!errors.section}
                  disabled={!canEdit || isSubmitting}
                >
                  <option value="">Sélectionner une section</option>
                  {sectionChoices.map(section => (
                    <option key={section.id} value={section.id}>
                      {section.icon} {section.nom}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.section}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold">
                  👷 Fonction *
                </Form.Label>
                <Form.Select
                  value={formData.action}
                  onChange={e => handleFieldChange('action', e.target.value)}
                  isInvalid={!!errors.action}
                  disabled={!canEdit || isSubmitting}
                >
                  <option value="">Sélectionner une fonction</option>
                  {actionChoices.map(action => (
                    <option key={action.id} value={action.id}>
                      {action.icon} {action.nom}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.action}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold">
                  <FaProjectDiagram className="me-1" />
                  Projet
                </Form.Label>
                <Form.Select
                  value={formData.projet_id}
                  onChange={e => handleFieldChange('projet_id', e.target.value)}
                  disabled={!canEdit || isSubmitting}
                >
                  <option value="">Non assigné</option>
                  {projets.map(projet => (
                    <option key={projet.id} value={projet.id}>
                      {projet.nom || projet.name || `Projet ${projet.id}`}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold">📝 Statut Contrat</Form.Label>
                <Form.Select
                  value={formData.statut}
                  onChange={e => handleFieldChange('statut', e.target.value)}
                  disabled={!canEdit || isSubmitting}
                >
                  {statutChoices.map(statut => (
                    <option key={statut.id} value={statut.id}>
                      {statut.icon} {statut.nom}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold">📊 État</Form.Label>
                <Form.Select
                  value={formData.etat}
                  onChange={e => handleFieldChange('etat', e.target.value)}
                  disabled={!canEdit || isSubmitting}
                >
                  {etatChoices.map(etat => (
                    <option key={etat.id} value={etat.id}>
                      {etat.icon} {etat.nom}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold">
                  <FaCalendar className="me-1" />
                  Date Début *
                </Form.Label>
                <Form.Control
                  type="date"
                  value={formData.date_debut}
                  onChange={e => handleFieldChange('date_debut', e.target.value)}
                  isInvalid={!!errors.date_debut}
                  disabled={!canEdit || isSubmitting}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.date_debut}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold">
                  <FaCalendar className="me-1" />
                  Date Fin
                </Form.Label>
                <Form.Control
                  type="date"
                  value={formData.date_fin}
                  onChange={e => handleFieldChange('date_fin', e.target.value)}
                  disabled={!canEdit || isSubmitting}
                  min={formData.date_debut}
                />
                <Form.Text className="text-muted">
                  Optionnel - Date de fin de contrat
                </Form.Text>
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label className="fw-bold">📝 Observations</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.observations}
                  onChange={e => handleFieldChange('observations', e.target.value)}
                  placeholder="Informations supplémentaires..."
                  disabled={!canEdit || isSubmitting}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={onHide}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          {canEdit && (
            <Button 
              variant="primary" 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  En cours...
                </>
              ) : (
                <>
                  {employeur ? (
                    <>
                      <FaEdit className="me-1" />
                      Modifier
                    </>
                  ) : (
                    <>
                      <FaPlus className="me-1" />
                      Ajouter
                    </>
                  )}
                </>
              )}
            </Button>
          )}
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default GestionEmployeurs;