import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Modal, Button, Form, Spinner, Alert, 
  Badge, Table, InputGroup, Card, Row, Col, Tabs, Tab 
} from 'react-bootstrap';
import { 
  FaEdit, FaTrash, FaSearch, FaFilter, 
  FaTimes, FaTachometerAlt, FaFileExport,
  FaUserShield, FaUser, FaLock, FaChartBar,
  FaCalendarWeek, FaCalendarAlt, FaChartLine
} from 'react-icons/fa';

// ============================================
// GESTION DES VARIABLES D'ENVIRONNEMENT
// ============================================
const API_BASE_URL = 'https://intranet-attm.com/api';
const PRODUCTIONS_URL = `${API_BASE_URL}/productions`;
const CHAUFFEURS_URL = `${API_BASE_URL}/chauffeurs`;
const PROJETS_URL = `${API_BASE_URL}/projets`;
const VOITURES_URL = `${API_BASE_URL}/voitures`;

const AUTH_API_URL = 'https://intranet-attm.com/api';

// Fonction pour obtenir la date d'hier
const getYesterdayDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
};

// ============================================
// COMPOSANT DE RECHERCHE DE CHAUFFEUR
// ============================================
const ChauffeurSearch = ({ value, onChange, chauffeurs, onSelectChauffeur, disabled }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [touched, setTouched] = useState(false);
  const dropdownRef = useRef(null);

  const filteredChauffeurs = useMemo(() => {
    if (!searchTerm.trim()) return chauffeurs.slice(0, 10);
    const term = searchTerm.toLowerCase();
    return chauffeurs
      .filter(chauffeur => 
        (chauffeur.nom?.toLowerCase().includes(term) ||
         chauffeur.prenom?.toLowerCase().includes(term) ||
         chauffeur.matricule?.toLowerCase().includes(term) ||
         `${chauffeur.prenom} ${chauffeur.nom}`.toLowerCase().includes(term))
      )
      .slice(0, 15);
  }, [searchTerm, chauffeurs]);

  const selectedChauffeur = useMemo(() => {
    return chauffeurs.find(c => c.id == value);
  }, [value, chauffeurs]);

  useEffect(() => {
    if (selectedChauffeur) {
      setSearchTerm(`${selectedChauffeur.matricule} - ${selectedChauffeur.prenom || ''} ${selectedChauffeur.nom || ''}`.trim());
    } else if (!value) {
      setSearchTerm('');
    }
  }, [selectedChauffeur, value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectChauffeur = (chauffeur) => {
    const event = { target: { name: 'chauffeur_id', value: chauffeur.id } };
    onChange(event);
    if (onSelectChauffeur) onSelectChauffeur(chauffeur);
    setSearchTerm(`${chauffeur.matricule} - ${chauffeur.prenom || ''} ${chauffeur.nom || ''}`.trim());
    setShowDropdown(false);
    setTouched(true);
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
    setTouched(true);
    if (e.target.value === '') {
      onChange({ target: { name: 'chauffeur_id', value: '' } });
      if (onSelectChauffeur) onSelectChauffeur(null);
    }
  };

  const handleClearSelection = () => {
    setSearchTerm('');
    onChange({ target: { name: 'chauffeur_id', value: '' } });
    if (onSelectChauffeur) onSelectChauffeur(null);
    setTouched(true);
  };

  const showError = touched && !value && !disabled;

  return (
    <div className="position-relative" ref={dropdownRef}>
      <Form.Group className="mb-3">
        <Form.Label><strong>Chauffeur *</strong></Form.Label>
        <div className="d-flex gap-2">
          <div className="position-relative flex-grow-1">
            <Form.Control
              type="text"
              placeholder="Rechercher par matricule, nom ou prénom..."
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={() => setShowDropdown(true)}
              disabled={disabled}
              className={selectedChauffeur ? 'border-success' : (showError ? 'border-danger' : '')}
              isInvalid={showError}
            />
            {selectedChauffeur && (
              <div className="position-absolute end-0 top-0 mt-2 me-2 text-success">
                <small>✓ {selectedChauffeur.matricule}</small>
              </div>
            )}
            {showError && (
              <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                Veuillez sélectionner un chauffeur
              </Form.Control.Feedback>
            )}
          </div>
          {selectedChauffeur && (
            <Button variant="outline-secondary" size="sm" onClick={handleClearSelection}>
              <FaTimes />
            </Button>
          )}
        </div>
        {showDropdown && filteredChauffeurs.length > 0 && (
          <div className="position-absolute bg-white border rounded shadow-sm w-100 mt-1" style={{ zIndex: 1000, maxHeight: '300px', overflowY: 'auto' }}>
            {filteredChauffeurs.map(chauffeur => (
              <div key={chauffeur.id} className="p-2 border-bottom" onClick={() => handleSelectChauffeur(chauffeur)} style={{ cursor: 'pointer' }}>
                <div>
                  <span className="fw-bold">{chauffeur.matricule}</span>
                  <span className="ms-2">{chauffeur.prenom || ''} {chauffeur.nom || ''}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Form.Group>
    </div>
  );
};

// ============================================
// COMPOSANT DE RECHERCHE D'ÉQUIPEMENT AVEC RÉCUPÉRATION DERNIER COMPTEUR
// ============================================
const EquipementSearch = ({ value, onChange, voitures, productions, onVoitureSelect, disabled }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [touched, setTouched] = useState(false);
  const dropdownRef = useRef(null);

  const filteredVoitures = useMemo(() => {
    if (!searchTerm.trim()) return voitures.slice(0, 10);
    const term = searchTerm.toLowerCase();
    return voitures.filter(voiture => 
      voiture.matricule?.toLowerCase().includes(term) ||
      voiture.marque?.toLowerCase().includes(term) ||
      voiture.modele?.toLowerCase().includes(term)
    ).slice(0, 15);
  }, [searchTerm, voitures]);

  const selectedVoiture = useMemo(() => voitures.find(v => v.id == value), [value, voitures]);

  // Fonction pour obtenir le dernier compteur fin d'une voiture
  const getLastCompteurFin = useCallback((voitureId) => {
    if (!voitureId || !productions.length) return 0;
    
    const productionsVoiture = productions
      .filter(p => p.voiture_id == voitureId)
      .sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation));
    
    if (productionsVoiture.length > 0) {
      const lastProduction = productionsVoiture[0];
      return lastProduction.compteur_fin || 0;
    }
    return 0;
  }, [productions]);

  useEffect(() => {
    if (selectedVoiture) {
      setSearchTerm(`${selectedVoiture.matricule} - ${selectedVoiture.marque} ${selectedVoiture.modele}`);
      // Récupérer le dernier compteur fin et le passer au parent
      const lastCompteur = getLastCompteurFin(selectedVoiture.id);
      if (onVoitureSelect && lastCompteur > 0) {
        onVoitureSelect(selectedVoiture.id, lastCompteur);
      }
    } else if (!value) {
      setSearchTerm('');
    }
  }, [selectedVoiture, value, getLastCompteurFin, onVoitureSelect]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectVoiture = (voiture) => {
    onChange({ target: { name: 'voiture_id', value: voiture.id } });
    setSearchTerm(`${voiture.matricule} - ${voiture.marque} ${voiture.modele}`);
    setShowDropdown(false);
    setTouched(true);
    
    // Récupérer le dernier compteur fin
    const lastCompteur = getLastCompteurFin(voiture.id);
    if (onVoitureSelect) {
      onVoitureSelect(voiture.id, lastCompteur);
    }
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
    setTouched(true);
    if (e.target.value === '') {
      onChange({ target: { name: 'voiture_id', value: '' } });
      if (onVoitureSelect) onVoitureSelect(null, 0);
    }
  };

  const handleClearSelection = () => {
    setSearchTerm('');
    onChange({ target: { name: 'voiture_id', value: '' } });
    if (onVoitureSelect) onVoitureSelect(null, 0);
    setTouched(true);
  };

  const showError = touched && !value && !disabled;

  return (
    <div className="position-relative" ref={dropdownRef}>
      <Form.Group className="mb-3">
        <Form.Label><strong>Équipement *</strong></Form.Label>
        <div className="d-flex gap-2">
          <div className="position-relative flex-grow-1">
            <Form.Control
              type="text"
              placeholder="Rechercher par matricule, marque..."
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={() => setShowDropdown(true)}
              disabled={disabled}
              className={selectedVoiture ? 'border-success' : (showError ? 'border-danger' : '')}
              isInvalid={showError}
            />
            {selectedVoiture && (
              <div className="position-absolute end-0 top-0 mt-2 me-2 text-success">
                <small>✓ {selectedVoiture.matricule}</small>
              </div>
            )}
            {showError && (
              <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                Veuillez sélectionner un équipement
              </Form.Control.Feedback>
            )}
          </div>
          {selectedVoiture && (
            <Button variant="outline-secondary" size="sm" onClick={handleClearSelection}>
              <FaTimes />
            </Button>
          )}
        </div>
        {showDropdown && filteredVoitures.length > 0 && (
          <div className="position-absolute bg-white border rounded shadow-sm w-100 mt-1" style={{ zIndex: 1000, maxHeight: '300px', overflowY: 'auto' }}>
            {filteredVoitures.map(voiture => (
              <div key={voiture.id} className="p-2 border-bottom" onClick={() => handleSelectVoiture(voiture)} style={{ cursor: 'pointer' }}>
                <div>
                  <span className="fw-bold">{voiture.matricule}</span>
                  <span className="ms-2">{voiture.marque} {voiture.modele}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Form.Group>
    </div>
  );
};

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
const ProductionChauffeurs = () => {
  const [userRole, setUserRole] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  
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
            setUserRole(userData.role || userData.roles?.[0] || 'user');
            setUserLoading(false);
            return;
          } catch (e) {}
        }
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        if (token) {
          const response = await fetch(`${AUTH_API_URL}/user`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
          });
          if (response.ok) {
            const userData = await response.json();
            const role = userData.role || userData.roles?.[0] || 'user';
            setUserRole(role);
            localStorage.setItem('user', JSON.stringify({ id: userData.id, email: userData.email, role: role }));
          } else setUserRole('user');
        } else setUserRole('user');
      } catch (err) {
        console.error("Erreur récupération rôle:", err);
        setUserRole('user');
      } finally {
        setUserLoading(false);
      }
    };
    fetchUserRole();
  }, []);

  // États principaux
  const [productions, setProductions] = useState([]);
  const [chauffeurs, setChauffeurs] = useState([]);
  const [voitures, setVoitures] = useState([]);
  const [projets, setProjets] = useState([]);
  const [loadingRefs, setLoadingRefs] = useState(false);
  const [autoFillInfo, setAutoFillInfo] = useState({ chauffeur: null, voiture_suggested: null, projet_suggested: null });
  const [activeTab, setActiveTab] = useState('productions');
  
  const [formData, setFormData] = useState({
    categorie: 'CHAUFFEUR',
    compteur_debut: 0,
    compteur_fin: 0,
    distance: 0,
    voyage_enrobe: 0,
    voyage_tout_venant: 0,
    voyage_gravier_roche: 0,
    autre: 0,
    date_creation: new Date().toISOString().split('T')[0],
    chauffeur_id: '',
    projet_id: '',
    voiture_id: ''
  });

  const [filters, setFilters] = useState({
    searchTerm: '',
    filterChauffeur: '',
    filterProjet: '',
    dateDebut: getYesterdayDate(),
    dateFin: ''
  });

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [cumuls, setCumuls] = useState({ hebdomadaire: [], mensuel: [], annuel: [] });
  const [periodeActive, setPeriodeActive] = useState('hebdomadaire');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Fonction pour obtenir le dernier compteur fin d'une voiture
  const getLastCompteurFin = useCallback((voitureId) => {
    if (!voitureId || !productions.length) return 0;
    
    const productionsVoiture = productions
      .filter(p => p.voiture_id == voitureId)
      .sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation));
    
    if (productionsVoiture.length > 0) {
      return productionsVoiture[0].compteur_fin || 0;
    }
    return 0;
  }, [productions]);

  // Handler pour quand une voiture est sélectionnée
  const handleVoitureSelect = (voitureId, lastCompteur) => {
    if (voitureId && lastCompteur > 0) {
      setFormData(prev => ({
        ...prev,
        compteur_debut: lastCompteur
      }));
    } else if (voitureId && lastCompteur === 0) {
      setFormData(prev => ({
        ...prev,
        compteur_debut: 0
      }));
    }
  };

  // Fonctions utilitaires
  const getChauffeurNomComplet = (chauffeurId) => {
    const chauffeur = chauffeurs.find(c => c.id == chauffeurId);
    if (chauffeur) {
      return `${chauffeur.prenom || ''} ${chauffeur.nom || ''}`.trim() || chauffeur.nom || 'Inconnu';
    }
    return 'Inconnu';
  };

  const getChauffeurMatricule = (chauffeurId) => {
    const chauffeur = chauffeurs.find(c => c.id == chauffeurId);
    return chauffeur?.matricule || 'N/A';
  };

  const getVoitureMatricule = (voitureId) => {
    const voiture = voitures.find(v => v.id == voitureId);
    return voiture?.matricule || 'N/A';
  };

  const getProjetNom = (projetId) => {
    const projet = projets.find(p => p.id == projetId);
    return projet?.name || 'Non attribué';
  };

  const handleSelectChauffeur = (chauffeur) => {
    if (!chauffeur) {
      setAutoFillInfo({ chauffeur: null, voiture_suggested: null, projet_suggested: null });
      return;
    }
    setAutoFillInfo({
      chauffeur: chauffeur,
      voiture_suggested: chauffeur.voiture_id || chauffeur.voiture_attribuee_id || null,
      projet_suggested: chauffeur.projet_id || chauffeur.projet_actuel_id || null
    });
    if (chauffeur.voiture_id || chauffeur.voiture_attribuee_id) {
      const voitureId = chauffeur.voiture_id || chauffeur.voiture_attribuee_id;
      setFormData(prev => ({ ...prev, voiture_id: voitureId }));
      // Récupérer le dernier compteur pour cette voiture
      const lastCompteur = getLastCompteurFin(voitureId);
      if (lastCompteur > 0) {
        setFormData(prev => ({ ...prev, compteur_debut: lastCompteur }));
      }
    }
    if (chauffeur.projet_id || chauffeur.projet_actuel_id) {
      setFormData(prev => ({ ...prev, projet_id: chauffeur.projet_id || chauffeur.projet_actuel_id }));
    }
  };

  // Chargement des données
  const extractDataFromResponse = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.data && Array.isArray(data.data)) return data.data;
    if (data.success && data.data && Array.isArray(data.data)) return data.data;
    return [];
  };

  const loadReferencesFromAPI = async () => {
    try {
      setLoadingRefs(true);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const headers = { 'Authorization': token ? `Bearer ${token}` : '', 'Accept': 'application/json' };

      const [chauffeursRes, projetsRes, voituresRes] = await Promise.allSettled([
        fetch(CHAUFFEURS_URL, { headers }),
        fetch(PROJETS_URL, { headers }),
        fetch(VOITURES_URL, { headers })
      ]);

      if (chauffeursRes.status === 'fulfilled' && chauffeursRes.value.ok) {
        const data = await chauffeursRes.value.json();
        setChauffeurs(extractDataFromResponse(data));
      }
      if (projetsRes.status === 'fulfilled' && projetsRes.value.ok) {
        const data = await projetsRes.value.json();
        setProjets(extractDataFromResponse(data));
      }
      if (voituresRes.status === 'fulfilled' && voituresRes.value.ok) {
        const data = await voituresRes.value.json();
        setVoitures(extractDataFromResponse(data));
      }
    } catch (error) {
      console.error('[ERROR] Erreur chargement références:', error);
    } finally {
      setLoadingRefs(false);
    }
  };

  const fetchProductions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const url = new URL(PRODUCTIONS_URL);
      url.searchParams.append('categorie', 'CHAUFFEUR');
      
      const response = await fetch(url.toString(), {
        headers: { 'Authorization': token ? `Bearer ${token}` : '', 'Accept': 'application/json' }
      });
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      
      const data = await response.json();
      let productionsData = extractDataFromResponse(data);
      
      const enhancedProductions = productionsData.map(production => ({
        ...production,
        id: production.id || production.production_id,
        chauffeur_id: production.chauffeur_id,
        voiture_id: production.voiture_id,
        projet_id: production.projet_id,
        compteur_debut: parseFloat(production.compteur_debut) || 0,
        compteur_fin: parseFloat(production.compteur_fin) || 0,
        distance: parseFloat(production.distance) || (parseFloat(production.compteur_fin) - parseFloat(production.compteur_debut)) || 0,
        voyage_enrobe: parseInt(production.voyage_enrobe) || 0,
        voyage_tout_venant: parseInt(production.voyage_tout_venant) || 0,
        voyage_gravier_roche: parseInt(production.voyage_gravier_roche) || 0,
        autre: parseInt(production.autre) || 0,
        date_creation: production.date_creation || production.date || new Date().toISOString().split('T')[0]
      }));
      
      setProductions(enhancedProductions);
    } catch (err) {
      console.error('[ERROR] Erreur chargement productions:', err);
      setError(err.message);
      setProductions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadReferencesFromAPI();
      await fetchProductions();
    };
    init();
  }, []);

  // Calcul des cumuls
  useEffect(() => {
    if (productions.length === 0) {
      setCumuls({ hebdomadaire: [], mensuel: [], annuel: [] });
      return;
    }

    const getWeekNumber = (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + 4 - (d.getDay() || 7));
      const yearStart = new Date(d.getFullYear(), 0, 1);
      return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    };

    const calculerCumulsParPeriode = (periode) => {
      const groupes = new Map();

      productions.forEach(prod => {
        const date = new Date(prod.date_creation);
        let periodeKey;
        
        if (periode === 'hebdomadaire') {
          const semaine = getWeekNumber(date);
          periodeKey = `S${semaine}-${date.getFullYear()}`;
        } else if (periode === 'mensuel') {
          periodeKey = `${date.toLocaleString('fr-FR', { month: 'long' })} ${date.getFullYear()}`;
        } else {
          periodeKey = date.getFullYear().toString();
        }

        const chauffeurKey = prod.chauffeur_id;
        const key = `${periodeKey}|${chauffeurKey}`;

        if (!groupes.has(key)) {
          groupes.set(key, {
            periode: periodeKey,
            chauffeur_id: prod.chauffeur_id,
            chauffeur_nom: getChauffeurNomComplet(prod.chauffeur_id),
            chauffeur_matricule: getChauffeurMatricule(prod.chauffeur_id),
            distance: 0,
            voyages: { enrobe: 0, toutVenant: 0, gravier: 0, autre: 0 },
            count: 0
          });
        }

        const groupe = groupes.get(key);
        groupe.distance += prod.distance || 0;
        groupe.voyages.enrobe += prod.voyage_enrobe || 0;
        groupe.voyages.toutVenant += prod.voyage_tout_venant || 0;
        groupe.voyages.gravier += prod.voyage_gravier_roche || 0;
        groupe.voyages.autre += prod.autre || 0;
        groupe.count++;
      });

      return Array.from(groupes.values()).sort((a, b) => b.distance - a.distance);
    };

    setCumuls({
      hebdomadaire: calculerCumulsParPeriode('hebdomadaire'),
      mensuel: calculerCumulsParPeriode('mensuel'),
      annuel: calculerCumulsParPeriode('annuel')
    });
  }, [productions, chauffeurs]);

  // Filtrer les productions
  const filteredProductions = useMemo(() => {
    return productions.filter(production => {
      const searchLower = filters.searchTerm.toLowerCase();
      const chauffeurNom = getChauffeurNomComplet(production.chauffeur_id).toLowerCase();
      const chauffeurMat = getChauffeurMatricule(production.chauffeur_id).toLowerCase();
      const voitureMat = getVoitureMatricule(production.voiture_id).toLowerCase();
      const projetNom = getProjetNom(production.projet_id).toLowerCase();
      
      const matchesSearch = !filters.searchTerm || 
        chauffeurNom.includes(searchLower) ||
        chauffeurMat.includes(searchLower) ||
        voitureMat.includes(searchLower) ||
        projetNom.includes(searchLower);
      
      const matchesChauffeur = !filters.filterChauffeur || production.chauffeur_id == filters.filterChauffeur;
      const matchesProjet = !filters.filterProjet || production.projet_id == filters.filterProjet;
      
      let matchesDate = true;
      if (filters.dateDebut) matchesDate = matchesDate && new Date(production.date_creation) >= new Date(filters.dateDebut);
      if (filters.dateFin) {
        const dateFin = new Date(filters.dateFin);
        dateFin.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && new Date(production.date_creation) <= dateFin;
      }
      return matchesSearch && matchesChauffeur && matchesProjet && matchesDate;
    }).sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation));
  }, [productions, filters, chauffeurs, voitures, projets]);

  // Gestion du formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    
    if (name === 'compteur_debut' || name === 'compteur_fin') {
      const debut = parseFloat(newFormData.compteur_debut) || 0;
      const fin = parseFloat(newFormData.compteur_fin) || 0;
      newFormData.distance = fin >= debut ? (fin - debut).toFixed(2) : 0;
    }
    setFormData(newFormData);
  };

  const openAddModal = () => {
    setFormData({
      categorie: 'CHAUFFEUR',
      compteur_debut: 0, compteur_fin: 0, distance: 0,
      voyage_enrobe: 0, voyage_tout_venant: 0, voyage_gravier_roche: 0, autre: 0,
      date_creation: new Date().toISOString().split('T')[0],
      chauffeur_id: '', projet_id: '', voiture_id: ''
    });
    setAutoFillInfo({ chauffeur: null, voiture_suggested: null, projet_suggested: null });
    setEditingId(null);
    setShowModal(true);
  };

  const openEditModal = (production) => {
    setFormData({
      categorie: production.categorie || 'CHAUFFEUR',
      compteur_debut: production.compteur_debut || 0,
      compteur_fin: production.compteur_fin || 0,
      distance: production.distance || 0,
      voyage_enrobe: production.voyage_enrobe || 0,
      voyage_tout_venant: production.voyage_tout_venant || 0,
      voyage_gravier_roche: production.voyage_gravier_roche || 0,
      autre: production.autre || 0,
      date_creation: production.date_creation ? production.date_creation.split('T')[0] : new Date().toISOString().split('T')[0],
      chauffeur_id: production.chauffeur_id || '',
      projet_id: production.projet_id || '',
      voiture_id: production.voiture_id || ''
    });
    setEditingId(production.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.chauffeur_id || !formData.voiture_id || !formData.projet_id) {
      setError("Veuillez sélectionner un chauffeur, un équipement et un projet");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        categorie: 'CHAUFFEUR',
        compteur_debut: parseFloat(formData.compteur_debut) || 0,
        compteur_fin: parseFloat(formData.compteur_fin) || 0,
        distance: parseFloat(formData.distance) || 0,
        voyage_enrobe: parseInt(formData.voyage_enrobe) || 0,
        voyage_tout_venant: parseInt(formData.voyage_tout_venant) || 0,
        voyage_gravier_roche: parseInt(formData.voyage_gravier_roche) || 0,
        autre: parseInt(formData.autre) || 0,
        date_creation: formData.date_creation,
        chauffeur_id: parseInt(formData.chauffeur_id),
        projet_id: parseInt(formData.projet_id),
        voiture_id: parseInt(formData.voiture_id)
      };
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const url = editingId ? `${PRODUCTIONS_URL}/${editingId}` : PRODUCTIONS_URL;
      const method = editingId ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method, headers: { 'Authorization': token ? `Bearer ${token}` : '', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`Erreur: ${response.status}`);
      setSuccess(editingId ? 'Production modifiée' : 'Production ajoutée');
      setShowModal(false);
      await fetchProductions();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const response = await fetch(`${PRODUCTIONS_URL}/${deleteConfirm.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      if (!response.ok) throw new Error("Erreur suppression");
      setSuccess("Production supprimée");
      await fetchProductions();
      setDeleteConfirm(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const resetFilters = () => {
    setFilters({ searchTerm: '', filterChauffeur: '', filterProjet: '', dateDebut: getYesterdayDate(), dateFin: '' });
  };

  const exporterCumuls = () => {
    const data = cumuls[periodeActive];
    if (data.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    const csvContent = [
      ['Période', 'Matricule', 'Chauffeur', 'Distance (km)', 'V.Enrobé', 'V.Tout-Venant', 'V.Gravier', 'Autre', 'Nb Voyages'],
      ...data.map(item => [
        item.periode,
        item.chauffeur_matricule,
        item.chauffeur_nom,
        item.distance.toFixed(0),
        item.voyages.enrobe.toFixed(0),
        item.voyages.toutVenant.toFixed(0),
        item.voyages.gravier.toFixed(0),
        item.voyages.autre.toFixed(0),
        item.count
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cumuls-chauffeurs-${periodeActive}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (userLoading) {
    return <div className="text-center py-5"><Spinner animation="border" /><p>Chargement...</p></div>;
  }

  return (
    <div className="container-fluid mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Gestion des Productions - Chauffeurs</h2>
        {canEdit() && (
          <Button variant="primary" onClick={openAddModal}>
            Ajouter une production
          </Button>
        )}
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
        <Tab eventKey="productions" title="Productions">
          {/* Filtres */}
          <Card className="mb-3">
            <Card.Header className="bg-primary text-white">Filtres</Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Recherche</Form.Label>
                    <InputGroup>
                      <InputGroup.Text><FaSearch /></InputGroup.Text>
                      <Form.Control placeholder="Nom, matricule..." value={filters.searchTerm} onChange={(e) => setFilters({...filters, searchTerm: e.target.value})} />
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Chauffeur</Form.Label>
                    <Form.Select value={filters.filterChauffeur} onChange={(e) => setFilters({...filters, filterChauffeur: e.target.value})}>
                      <option value="">Tous</option>
                      {chauffeurs.map(c => <option key={c.id} value={c.id}>{c.matricule} - {c.nom}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Projet</Form.Label>
                    <Form.Select value={filters.filterProjet} onChange={(e) => setFilters({...filters, filterProjet: e.target.value})}>
                      <option value="">Tous</option>
                      {projets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Période</Form.Label>
                    <Row>
                      <Col><Form.Control type="date" value={filters.dateDebut} onChange={(e) => setFilters({...filters, dateDebut: e.target.value})} /></Col>
                      <Col><Form.Control type="date" value={filters.dateFin} onChange={(e) => setFilters({...filters, dateFin: e.target.value})} /></Col>
                    </Row>
                  </Form.Group>
                </Col>
              </Row>
              <Button variant="outline-secondary" className="mt-2" onClick={resetFilters}>Réinitialiser</Button>
            </Card.Body>
          </Card>

          {/* Tableau des productions */}
          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" /></div>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead className="table-dark">
                  <tr>
                    <th>Matricule</th><th>Nom Chauffeur</th><th>Équipement</th><th>Projet</th>
                    <th>Date</th><th>Comp. Début</th><th>Comp. Fin</th><th>Distance</th>
                    <th>V.Enrobé</th><th>V.Tout-Venant</th><th>V.Gravier</th><th>Autre</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProductions.map(prod => (
                    <tr key={prod.id}>
                      <td>{getChauffeurMatricule(prod.chauffeur_id)}</td>
                      <td><strong>{getChauffeurNomComplet(prod.chauffeur_id)}</strong></td>
                      <td>{getVoitureMatricule(prod.voiture_id)}</td>
                      <td>{getProjetNom(prod.projet_id)}</td>
                      <td>{new Date(prod.date_creation).toLocaleDateString('fr-FR')}</td>
                      <td>{prod.compteur_debut.toFixed(0)}</td><td>{prod.compteur_fin.toFixed(0)}</td><td>{prod.distance.toFixed(0)}</td>
                      <td>{prod.voyage_enrobe}</td><td>{prod.voyage_tout_venant}</td>
                      <td>{prod.voyage_gravier_roche}</td><td>{prod.autre}</td>
                      <td>
                        {canEdit() && (
                          <>
                            <Button variant="outline-warning" size="sm" onClick={() => openEditModal(prod)} className="me-1"><FaEdit /></Button>
                            <Button variant="outline-danger" size="sm" onClick={() => setDeleteConfirm(prod)}><FaTrash /></Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredProductions.length === 0 && (
                    <tr><td colSpan="13" className="text-center">Aucune production</td></tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Tab>

        <Tab eventKey="cumuls" title="Cumuls">
          <Card className="mb-3">
            <Card.Header className="bg-light d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Statistiques des productions</h5>
              <div>
                <Button variant="outline-primary" size="sm" className="me-2" onClick={exporterCumuls} disabled={cumuls[periodeActive]?.length === 0}>
                  <FaFileExport className="me-2" />Exporter CSV
                </Button>
                <Button variant={periodeActive === 'hebdomadaire' ? 'primary' : 'outline-primary'} size="sm" className="me-2" onClick={() => setPeriodeActive('hebdomadaire')}>
                  <FaCalendarWeek className="me-1" />Hebdomadaire
                </Button>
                <Button variant={periodeActive === 'mensuel' ? 'primary' : 'outline-primary'} size="sm" className="me-2" onClick={() => setPeriodeActive('mensuel')}>
                  <FaCalendarAlt className="me-1" />Mensuel
                </Button>
                <Button variant={periodeActive === 'annuel' ? 'primary' : 'outline-primary'} size="sm" onClick={() => setPeriodeActive('annuel')}>
                  <FaChartLine className="me-1" />Annuel
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead className="table-dark">
                    <tr><th>#</th><th>Période</th><th>Matricule</th><th>Chauffeur</th><th>Distance (km)</th><th>V.Enrobé</th><th>V.Tout-Venant</th><th>V.Gravier</th><th>Autre</th><th>Nb Voyages</th></tr>
                  </thead>
                  <tbody>
                    {cumuls[periodeActive]?.map((cumul, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>{cumul.periode}</td>
                        <td>{cumul.chauffeur_matricule}</td>
                        <td><strong>{cumul.chauffeur_nom}</strong></td>
                        <td>{cumul.distance.toFixed(0)}</td>
                        <td>{cumul.voyages.enrobe}</td>
                        <td>{cumul.voyages.toutVenant}</td>
                        <td>{cumul.voyages.gravier}</td>
                        <td>{cumul.voyages.autre}</td>
                        <td>{cumul.count}</td>
                      </tr>
                    ))}
                    {cumuls[periodeActive]?.length === 0 && (
                      <tr><td colSpan="10" className="text-center">Aucune donnée disponible</td></tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Modal Ajout/Modification */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton><Modal.Title>{editingId ? 'Modifier' : 'Ajouter'} une production</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <ChauffeurSearch value={formData.chauffeur_id} onChange={handleChange} chauffeurs={chauffeurs} onSelectChauffeur={handleSelectChauffeur} disabled={loadingRefs} />
              </Col>
              <Col md={6}>
                <EquipementSearch 
                  value={formData.voiture_id} 
                  onChange={handleChange} 
                  voitures={voitures} 
                  productions={productions}
                  onVoitureSelect={handleVoitureSelect}
                  disabled={loadingRefs} 
                />
                {autoFillInfo.voiture_suggested && <small className="text-success">✓ Équipement auto-rempli</small>}
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group><Form.Label>Projet *</Form.Label>
                  <Form.Select name="projet_id" value={formData.projet_id} onChange={handleChange} required>
                    <option value="">Sélectionner...</option>
                    {projets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </Form.Select>
                  {autoFillInfo.projet_suggested && <small className="text-success">✓ Projet auto-rempli</small>}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group><Form.Label>Date *</Form.Label>
                  <Form.Control type="date" name="date_creation" value={formData.date_creation} onChange={handleChange} required />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group><Form.Label>Compteur début (km)</Form.Label>
                  <Form.Control type="number" name="compteur_debut" value={formData.compteur_debut} onChange={handleChange} step="0.01" />
                  <Form.Text className="text-muted">Auto-rempli depuis le dernier compteur fin du véhicule</Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group><Form.Label>Compteur fin (km)</Form.Label>
                  <Form.Control type="number" name="compteur_fin" value={formData.compteur_fin} onChange={handleChange} step="0.01" min={formData.compteur_debut} />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={3}><Form.Group><Form.Label>Enrobé</Form.Label><Form.Control type="number" name="voyage_enrobe" value={formData.voyage_enrobe} onChange={handleChange} /></Form.Group></Col>
              <Col md={3}><Form.Group><Form.Label>Tout-venant</Form.Label><Form.Control type="number" name="voyage_tout_venant" value={formData.voyage_tout_venant} onChange={handleChange} /></Form.Group></Col>
              <Col md={3}><Form.Group><Form.Label>Gravier</Form.Label><Form.Control type="number" name="voyage_gravier_roche" value={formData.voyage_gravier_roche} onChange={handleChange} /></Form.Group></Col>
              <Col md={3}><Form.Group><Form.Label>Autre</Form.Label><Form.Control type="number" name="autre" value={formData.autre} onChange={handleChange} /></Form.Group></Col>
            </Row>
            <Alert variant="info" className="mt-2">
              <small>✨ Le compteur début est automatiquement rempli avec le dernier compteur fin du véhicule sélectionné.</small>
            </Alert>
            <div className="d-flex justify-content-end gap-2 mt-3">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
              <Button type="submit" variant="primary" disabled={loading}>{loading ? 'Enregistrement...' : 'Enregistrer'}</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Modal Suppression */}
      <Modal show={!!deleteConfirm} onHide={() => setDeleteConfirm(null)}>
        <Modal.Header closeButton><Modal.Title>Confirmer suppression</Modal.Title></Modal.Header>
        <Modal.Body>Supprimer cette production ?</Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Annuler</Button><Button variant="danger" onClick={handleDelete}>Supprimer</Button></Modal.Footer>
      </Modal>
    </div>
  );
};

export default ProductionChauffeurs;