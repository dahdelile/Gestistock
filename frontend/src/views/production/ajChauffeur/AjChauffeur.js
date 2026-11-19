import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  Button,
  Form,
  Spinner,
  Alert,
  Badge,
  Table,
  Container,
  Row,
  Col,
  Card,
  InputGroup,
  Pagination,
} from "react-bootstrap";
import {
  FaSearch, FaFilter, FaTimes, FaPlus,
  FaEdit, FaTrash, FaUserTie, FaCar,
  FaProjectDiagram, FaSync, FaExclamationTriangle,
  FaCheck, FaBan, FaUmbrellaBeach, FaTruck,
  FaDownload, FaUserShield, FaUser, FaLock
} from 'react-icons/fa';

// ============================================
// GESTION DES VARIABLES D'ENVIRONNEMENT
// ============================================
const API_BASE_URL = 'https://intranet-attm.com/api';
const CHAUFFEURS_URL = `${API_BASE_URL}/chauffeurs`;
const PROJETS_URL = `${API_BASE_URL}/projets`;
const VOITURES_URL = `${API_BASE_URL}/voitures`;
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

const GestionChauffeurs = () => {
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
  const isChefEnt = () => userRole === 'chef_ent' || userRole === 'chef_entreprise';
  const canEdit = () => isAdmin() || isChefEnt();

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

  // État initial
  const initialState = {
    matricule: "",
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
    adresse: "",
    statut: "ACTIF",
    voiture_id: "",
    projet_id: ""
  };

  // États principaux
  const [chauffeurs, setChauffeurs] = useState([]);
  const [voitures, setVoitures] = useState([]);
  const [projets, setProjets] = useState([]);
  const [formData, setFormData] = useState(initialState);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // États de chargement
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // États de notification
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // États pour les filtres
  const [filters, setFilters] = useState({
    searchTerm: '',
    filterStatut: '',
    filterVoiture: '',
    filterProjet: ''
  });

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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

  // ============================================
  // CHARGEMENT DES DONNÉES
  // ============================================
  const fetchAllData = async () => {
    setLoadingData(true);
    setError(null);
    
    try {
      console.log('[INFO] Chargement des données...');
      
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const headers = {
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept': 'application/json'
      };

      // URLs avec paramètres expand pour charger les relations
      const chauffeursUrl = `${CHAUFFEURS_URL}?expand=projet,voiture`;
      
      const [chauffeursRes, voituresRes, projetsRes] = await Promise.allSettled([
        fetch(chauffeursUrl, { headers }),
        fetch(VOITURES_URL, { headers }),
        fetch(PROJETS_URL, { headers }),
      ]);

      let chauffeursData = [];
      let voituresData = [];
      let projetsData = [];

      if (chauffeursRes.status === 'fulfilled' && chauffeursRes.value.ok) {
        const data = await chauffeursRes.value.json();
        chauffeursData = extractDataFromResponse(data);
        console.log('[INFO] Chauffeurs chargés:', chauffeursData.length);
      }
      
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

      setChauffeurs(chauffeursData);
      setVoitures(voituresData);
      setProjets(projetsData);
      
    } catch (err) {
      console.error('[ERROR] Erreur chargement:', err);
      handleApiError(err, "Erreur lors du chargement des données");
    } finally {
      setLoadingData(false);
    }
  };

  // Chargement initial
  useEffect(() => {
    fetchAllData();
  }, []);

  // ============================================
  // GESTION DES ERREURS
  // ============================================
  const handleApiError = (error, defaultMessage) => {
    console.error("Erreur API:", error);
    
    let errorMessage = defaultMessage;
    
    if (error.code === 'ERR_NETWORK') {
      errorMessage = `Impossible de se connecter au serveur (${API_BASE_URL}). Vérifiez votre connexion.`;
    } else if (error.response) {
      switch (error.response.status) {
        case 401:
          errorMessage = "Session expirée. Veuillez vous reconnecter.";
          break;
        case 403:
          errorMessage = "Accès non autorisé.";
          break;
        case 404:
          errorMessage = "Ressource non trouvée.";
          break;
        case 422:
          if (error.response.data?.errors) {
            errorMessage = Object.values(error.response.data.errors)
              .flat()
              .map(msg => `• ${msg}`)
              .join('\n');
          } else if (error.response.data?.message) {
            errorMessage = error.response.data.message;
          }
          break;
        default:
          errorMessage = error.response.data?.message || defaultMessage;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    setError(errorMessage);
    setTimeout(() => setError(null), 5000);
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  // ============================================
  // FILTRAGE ET PAGINATION
  // ============================================
  const filteredChauffeurs = useMemo(() => {
    return chauffeurs.filter(chauffeur => {
      const searchTerm = filters.searchTerm.toLowerCase();
      
      const matchesSearch = !filters.searchTerm || 
        (chauffeur.matricule?.toLowerCase().includes(searchTerm)) ||
        (chauffeur.nom?.toLowerCase().includes(searchTerm)) ||
        (chauffeur.prenom?.toLowerCase().includes(searchTerm)) ||
        (chauffeur.telephone?.includes(filters.searchTerm)) ||
        (chauffeur.email?.toLowerCase().includes(searchTerm));

      const matchesStatut = !filters.filterStatut || 
        chauffeur.statut === filters.filterStatut;
      
      const voitureId = typeof chauffeur.voiture === 'object' 
        ? chauffeur.voiture?.id 
        : chauffeur.voiture;
      const matchesVoiture = !filters.filterVoiture || 
        voitureId == filters.filterVoiture;
      
      const projetId = typeof chauffeur.projet === 'object' 
        ? chauffeur.projet?.id 
        : chauffeur.projet;
      const matchesProjet = !filters.filterProjet || 
        projetId == filters.filterProjet;

      return matchesSearch && matchesStatut && matchesVoiture && matchesProjet;
    });
  }, [chauffeurs, filters]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredChauffeurs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredChauffeurs.length / itemsPerPage);

  // ============================================
  // GESTION DU FORMULAIRE
  // ============================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.matricule?.trim()) {
      setError("Le matricule est obligatoire");
      return false;
    }
    if (!formData.nom?.trim()) {
      setError("Le nom est obligatoire");
      return false;
    }
    return true;
  };

  // ============================================
  // ACTIONS CRUD
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!canEdit()) {
      setError("Vous n'avez pas les permissions pour effectuer cette action");
      return;
    }
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        matricule: formData.matricule.trim(),
        nom: formData.nom.trim(),
        prenom: formData.prenom?.trim() || null,
        telephone: formData.telephone?.trim() || null,
        email: formData.email?.trim() || null,
        adresse: formData.adresse?.trim() || null,
        statut: formData.statut,
        voiture_id: formData.voiture_id ? parseInt(formData.voiture_id) : null,
        projet_id: formData.projet_id ? parseInt(formData.projet_id) : null
      };

      console.log('[SUBMIT] Payload:', payload);
      
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const headers = {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      let response;
      if (editingId) {
        response = await fetch(`${CHAUFFEURS_URL}/${editingId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch(CHAUFFEURS_URL, {
          method: 'POST',
          headers,
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
      const newChauffeur = extractDataFromResponse(data)[0] || data;

      if (editingId) {
        setChauffeurs(prev => prev.map(c => 
          c.id === editingId ? newChauffeur : c
        ));
        showSuccess(`Chauffeur ${newChauffeur.nom} modifié avec succès`);
      } else {
        setChauffeurs(prev => [newChauffeur, ...prev]);
        showSuccess(`Chauffeur ${newChauffeur.nom} ajouté avec succès`);
      }

      handleCloseModal();
      
    } catch (err) {
      console.error('[ERROR] Erreur:', err);
      handleApiError(err, "Erreur lors de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, nom) => {
    if (!canEdit()) {
      setError("Action non autorisée");
      return;
    }
    
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le chauffeur ${nom} ?`)) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const headers = {
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept': 'application/json'
      };
      
      const response = await fetch(`${CHAUFFEURS_URL}/${id}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Accès refusé. Vous n'avez pas les permissions nécessaires.");
        }
        const data = await response.json();
        throw new Error(data.error || `Erreur: ${response.status}`);
      }
      
      setChauffeurs(prev => prev.filter(c => c.id !== id));
      showSuccess("Chauffeur supprimé avec succès");
      
    } catch (err) {
      console.error('[ERROR] Erreur suppression:', err);
      handleApiError(err, "Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  // Préparation de l'édition
  const handleEdit = (chauffeur) => {
    if (!canEdit()) {
      setError("Vous n'avez pas les permissions pour modifier");
      return;
    }
    
    setFormData({
      matricule: chauffeur.matricule || "",
      nom: chauffeur.nom || "",
      prenom: chauffeur.prenom || "",
      telephone: chauffeur.telephone || "",
      email: chauffeur.email || "",
      adresse: chauffeur.adresse || "",
      statut: chauffeur.statut || "ACTIF",
      voiture_id: chauffeur.voiture_id?.toString() || 
                  chauffeur.voiture?.id?.toString() || "",
      projet_id: chauffeur.projet_id?.toString() || 
                 chauffeur.projet?.id?.toString() || ""
    });
    setEditingId(chauffeur.id);
    setShowModal(true);
  };

  // Fermeture de la modale
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(initialState);
    setError(null);
  };

  // ============================================
  // FONCTIONS UTILITAIRES
  // ============================================
  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      filterStatut: '',
      filterVoiture: '',
      filterProjet: ''
    });
    setCurrentPage(1);
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      await fetchAllData();
      showSuccess("Données rafraîchies avec succès");
    } catch (err) {
      handleApiError(err, "Erreur lors du rafraîchissement");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Matricule', 'Nom', 'Prénom', 'Téléphone', 'Email', 'Statut', 'Équipement', 'Projet'];
    
    const data = filteredChauffeurs.map(c => {
      const voiture = getVoitureInfo(c.voiture_details || c.voiture);
      const projet = getProjetInfo(c.projet_details || c.projet);
      
      return [
        c.matricule,
        c.nom,
        c.prenom || '',
        c.telephone || '',
        c.email || '',
        c.statut,
        voiture.matricule,
        projet.name
      ];
    });

    const csvContent = [
      headers.join(','),
      ...data.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chauffeurs_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getVoitureInfo = (voitureData) => {
    if (!voitureData) return { matricule: "Non attribuée", id: null };
    if (typeof voitureData === 'object' && voitureData.matricule) {
      return voitureData;
    }
    const voitureTrouvee = voitures.find(v => v.id == voitureData);
    return voitureTrouvee || { matricule: "Non attribuée", id: null };
  };

  const getProjetInfo = (projetData) => {
    if (!projetData) return { name: "Non attribué", id: null };
    if (typeof projetData === 'object' && projetData.name) {
      return projetData;
    }
    const projetTrouve = projets.find(p => p.id == projetData);
    return projetTrouve || { name: "Non attribué", id: null };
  };

  const getStatutIcon = (statut) => {
    switch(statut) {
      case 'ACTIF': return <FaCheck className="text-success" />;
      case 'INACTIF': return <FaBan className="text-danger" />;
      case 'EN_CONGE': return <FaUmbrellaBeach className="text-warning" />;
      case 'EN_MISSION': return <FaTruck className="text-primary" />;
      default: return null;
    }
  };

  const getBadgeColor = (statut) => {
    switch(statut) {
      case 'ACTIF': return 'success';
      case 'INACTIF': return 'danger';
      case 'EN_CONGE': return 'warning';
      case 'EN_MISSION': return 'primary';
      default: return 'secondary';
    }
  };

  // ============================================
  // RENDU
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
    <Container fluid className="mt-4">
      {/* En-tête */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0">
            <FaUserTie className="me-2 text-primary" />
            Gestion des chauffeurs
            <Badge 
              bg={canEdit() ? 'success' : 'secondary'} 
              className="ms-2"
              style={{ fontSize: '0.6em' }}
            >
              {canEdit() ? <FaUserShield className="me-1" /> : <FaUser className="me-1" />}
              {isAdmin() ? 'Admin' : isChefEnt() ? 'Chef' : 'Lecture'}
            </Badge>
          </h2>
          <p className="text-muted mb-0">
            {filteredChauffeurs.length} chauffeur(s) trouvé(s)
            {filters.searchTerm && ` - Recherche: "${filters.searchTerm}"`}
          </p>
        </div>
        <Badge bg="secondary" className="p-2">
          API: {API_BASE_URL}
        </Badge>
      </div>

      {/* Alertes */}
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible className="mb-3">
          <div style={{ whiteSpace: 'pre-line' }}>
            <FaExclamationTriangle className="me-2" />
            {error}
          </div>
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" onClose={() => setSuccess(null)} dismissible className="mb-3">
          {success}
        </Alert>
      )}

      {/* Barre d'actions */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={8}>
              {canEdit() ? (
                <Button
                  variant="primary"
                  onClick={() => {
                    setFormData(initialState);
                    setEditingId(null);
                    setShowModal(true);
                  }}
                  className="me-2"
                >
                  <FaPlus className="me-2" />Nouveau chauffeur
                </Button>
              ) : (
                <span className="text-muted small me-3">
                  <FaLock className="me-1" /> Mode lecture seule
                </span>
              )}
              
              <Button
                variant="outline-primary"
                onClick={refreshData}
                disabled={loading}
                className="me-2"
              >
                <FaSync className={`me-2 ${loading ? 'fa-spin' : ''}`} />
                Rafraîchir
              </Button>

              <Button
                variant="outline-success"
                onClick={exportToCSV}
                disabled={filteredChauffeurs.length === 0}
              >
                <FaDownload className="me-2" />
                Exporter CSV
              </Button>
            </Col>
            
            <Col md={4} className="text-end">
              <Button
                variant="outline-secondary"
                onClick={resetFilters}
                size="sm"
              >
                <FaTimes className="me-2" />Réinitialiser filtres
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Filtres */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-primary text-white">
          <FaFilter className="me-2" />Filtres
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
                    placeholder="Matricule, nom, téléphone..."
                    value={filters.searchTerm}
                    onChange={(e) => {
                      setFilters({...filters, searchTerm: e.target.value});
                      setCurrentPage(1);
                    }}
                  />
                </InputGroup>
              </Form.Group>
            </Col>
            
            <Col md={2}>
              <Form.Group>
                <Form.Label>Statut</Form.Label>
                <Form.Select
                  value={filters.filterStatut}
                  onChange={(e) => {
                    setFilters({...filters, filterStatut: e.target.value});
                    setCurrentPage(1);
                  }}
                >
                  <option value="">Tous</option>
                  <option value="ACTIF">Actif</option>
                  <option value="INACTIF">Inactif</option>
                  <option value="EN_CONGE">En congé</option>
                  <option value="EN_MISSION">En mission</option>
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={3}>
              <Form.Group>
                <Form.Label>Équipement</Form.Label>
                <Form.Select
                  value={filters.filterVoiture}
                  onChange={(e) => {
                    setFilters({...filters, filterVoiture: e.target.value});
                    setCurrentPage(1);
                  }}
                >
                  <option value="">Tous</option>
                  {voitures.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.matricule} {v.marque ? `(${v.marque})` : ''}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={3}>
              <Form.Group>
                <Form.Label>Projet</Form.Label>
                <Form.Select
                  value={filters.filterProjet}
                  onChange={(e) => {
                    setFilters({...filters, filterProjet: e.target.value});
                    setCurrentPage(1);
                  }}
                >
                  <option value="">Tous</option>
                  {projets.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tableau des chauffeurs */}
      {loadingData ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Chargement des données...</p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <Table striped bordered hover className="shadow-sm">
              <thead className="table-dark">
                <tr>
                  <th>Matricule</th>
                  <th>Nom complet</th>
                  <th>Téléphone</th>
                  <th>Email</th>
                  <th>Statut</th>
                  <th>Équipement</th>
                  <th>Projet</th>
                  <th style={{ width: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map((chauffeur) => {
                    const voiture = getVoitureInfo(chauffeur.voiture_details || chauffeur.voiture);
                    const projet = getProjetInfo(chauffeur.projet_details || chauffeur.projet);
                    
                    return (
                      <tr key={chauffeur.id}>
                        <td className="fw-bold">{chauffeur.matricule}</td>
                        <td>
                          {chauffeur.prenom} {chauffeur.nom}
                        </td>
                        <td>{chauffeur.telephone || '-'}</td>
                        <td>{chauffeur.email || '-'}</td>
                        <td>
                          <Badge bg={getBadgeColor(chauffeur.statut)} className="d-flex align-items-center gap-1">
                            {getStatutIcon(chauffeur.statut)}
                            <span>{chauffeur.statut}</span>
                          </Badge>
                        </td>
                        <td>
                          {voiture.id ? (
                            <Badge bg="info" pill className="d-flex align-items-center gap-1">
                              <FaCar />
                              {voiture.matricule}
                            </Badge>
                          ) : (
                            <span className="text-muted fst-italic">Non attribué</span>
                          )}
                        </td>
                        <td>
                          {projet.id ? (
                            <Badge bg="primary" pill className="d-flex align-items-center gap-1">
                              <FaProjectDiagram />
                              {projet.name}
                            </Badge>
                          ) : (
                            <span className="text-muted fst-italic">Non attribué</span>
                          )}
                        </td>
                        <td>
                          {canEdit() ? (
                            <>
                              <Button
                                variant="outline-warning"
                                size="sm"
                                className="me-2"
                                onClick={() => handleEdit(chauffeur)}
                                disabled={loading}
                                title="Modifier"
                              >
                                <FaEdit />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDelete(chauffeur.id, `${chauffeur.prenom} ${chauffeur.nom}`)}
                                disabled={loading}
                                title="Supprimer"
                              >
                                <FaTrash />
                              </Button>
                            </>
                          ) : (
                            <FaLock className="text-muted" />
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-5">
                      <FaExclamationTriangle className="text-muted mb-3" size={48} />
                      <h5 className="text-muted">Aucun chauffeur trouvé</h5>
                      <p className="text-muted">
                        {filters.searchTerm || filters.filterStatut || filters.filterVoiture || filters.filterProjet
                          ? "Essayez de modifier vos filtres"
                          : "Cliquez sur 'Nouveau chauffeur' pour ajouter votre premier chauffeur"}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.First 
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                />
                <Pagination.Prev 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                />
                
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 2 && page <= currentPage + 2)
                  ) {
                    return (
                      <Pagination.Item
                        key={page}
                        active={page === currentPage}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Pagination.Item>
                    );
                  } else if (
                    page === currentPage - 3 ||
                    page === currentPage + 3
                  ) {
                    return <Pagination.Ellipsis key={page} />;
                  }
                  return null;
                })}
                
                <Pagination.Next 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                />
                <Pagination.Last 
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                />
              </Pagination>
            </div>
          )}
        </>
      )}

      {/* Modal d'ajout/modification */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            {editingId ? (
              <>Modifier le chauffeur <Badge bg="light" text="dark">{formData.matricule}</Badge></>
            ) : (
              "Ajouter un nouveau chauffeur"
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Matricule <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="matricule"
                    value={formData.matricule}
                    onChange={handleChange}
                    required
                    disabled={submitting}
                    placeholder="Ex: 12345"
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Nom <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    required
                    disabled={submitting}
                    placeholder="Nom de famille"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Prénom</Form.Label>
                  <Form.Control
                    type="text"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleChange}
                    disabled={submitting}
                    placeholder="Prénom"
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Téléphone</Form.Label>
                  <Form.Control
                    type="text"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleChange}
                    disabled={submitting}
                    placeholder="Ex: 77 123 45 67"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={submitting}
                    placeholder="email@exemple.com"
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Statut <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    name="statut"
                    value={formData.statut}
                    onChange={handleChange}
                    required
                    disabled={submitting}
                  >
                    <option value="ACTIF">Actif</option>
                    <option value="INACTIF">Inactif</option>
                    <option value="EN_CONGE">En congé</option>
                    <option value="EN_MISSION">En mission</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Adresse</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="adresse"
                    value={formData.adresse}
                    onChange={handleChange}
                    disabled={submitting}
                    placeholder="Adresse complète"
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Équipement assigné</Form.Label>
                  <Form.Select
                    name="voiture_id"
                    value={formData.voiture_id}
                    onChange={handleChange}
                    disabled={submitting}
                  >
                    <option value="">Aucun équipement</option>
                    {voitures.map((voiture) => (
                      <option key={voiture.id} value={voiture.id}>
                        {voiture.matricule} - {voiture.marque || ''} {voiture.modele || ''}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Projet assigné</Form.Label>
                  <Form.Select
                    name="projet_id"
                    value={formData.projet_id}
                    onChange={handleChange}
                    disabled={submitting}
                  >
                    <option value="">Aucun projet</option>
                    {projets.map((projet) => (
                      <option key={projet.id} value={projet.id}>
                        {projet.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Alert variant="info" className="mt-3">
              <small>
                <FaExclamationTriangle className="me-2" />
                <strong>Note:</strong> Les champs marqués d'une <span className="text-danger">*</span> sont obligatoires.
              </small>
            </Alert>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button
                variant="secondary"
                onClick={handleCloseModal}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button 
                variant="primary" 
                type="submit" 
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    {editingId ? "Modification..." : "Création..."}
                  </>
                ) : (
                  editingId ? "Modifier" : "Créer"
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default GestionChauffeurs;