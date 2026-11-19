// src/components/budget/budgetProjet/BudgetProjet.js
import React, { useState, useEffect, useCallback } from "react";
import { 
  Container, Table, Button, Modal, Form, Row, Col, 
  Card, Badge, Breadcrumb, Alert, Spinner 
} from "react-bootstrap";
import * as XLSX from 'xlsx';
import { FaLock, FaUserShield, FaUser, FaEdit, FaPlus, FaArrowLeft, FaInfoCircle } from 'react-icons/fa';

// ============================================
// GESTION DES VARIABLES D'ENVIRONNEMENT - PRODUCTION
// ============================================

// URLs de production HARDCODÉES - SANS TRAILING SLASH
const API_BASE_URL = 'https://intranet-attm.com/api';
const APP_URL = 'https://intranet-attm.com';

// URLs spécifiques
const BUDGETS_URL = `${API_BASE_URL}/budgets`;
const PROJETS_URL = `${API_BASE_URL}/projets`;
const USER_URL = `${API_BASE_URL}/user`;
const AUTH_API_URL = 'https://intranet-attm.com/api';

// Version de l'application
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
      'X-Application-Version': APP_VERSION,
      'X-Requested-With': 'XMLHttpRequest'
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

    if (response.status === 401) {
      console.warn('Session expirée');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Session expirée');
    }
    if (response.status === 403) {
      throw new Error('Accès refusé - Permissions insuffisantes');
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
  }
};

const BudgetProjet = ({ projetId, projetData, onRetour, userRole: parentUserRole, canEdit: parentCanEdit }) => {
  const [projet, setProjet] = useState(projetData);
  const [showModal, setShowModal] = useState(false);
  const [selectedSousCategorie, setSelectedSousCategorie] = useState(null);
  const [budgets, setBudgets] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [formData, setFormData] = useState({
    montant: "",
    Janvier: "", Février: "", Mars: "", Avril: "", Mai: "", Juin: "",
    Juillet: "", Août: "", Septembre: "", Octobre: "", Novembre: "", Décembre: "",
  });

  // ✅ ÉTATS POUR L'AUTHENTIFICATION ET LES RÔLES (utilise les props si fournies)
  const [userRole, setUserRole] = useState(parentUserRole || null);
  const [userLoading, setUserLoading] = useState(!parentUserRole);
  const [authError, setAuthError] = useState(null);

  const moisUI = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  const budgetData = [
    {
      categorie: "Main d'Œuvre",
      elements: [
        { code: "", label: "Cadres" },
        { code: "", label: "Maitrises" },
        { code: "", label: "O/E" }
      ],
    },
    {
      categorie: "Côut Main d'Œuvre milliers d'UM",
      elements: [
        { code: "101", label: "Renumération Normale" },
        { code: "102", label: "Heures supplémentaires" },
        { code: "103", label: "Frais médicaux" },
        { code: "104", label: "Frais formation / Stagiaires" },
        { code: "199", label: "Autres" },
      ],
    },
    {
      categorie: "Coût Matière en milliers UM",
      elements: [
        { code: "201", label: "Pièces de rechange" },
        { code: "202", label: "Lubrifiants" },
        { code: "203", label: "Pneumatiques" },
        { code: "204", label: "Gasoil" },
        { code: "205", label: "Bitume" },
        { code: "206", label: "Kérosène" },
        { code: "207", label: "Ciment" },
        { code: "208", label: "Bois de coffrage" },
        { code: "209", label: "Autres matières" },
        { code: "210", label: "Variation Stock" },
        { code: "211", label: "Fer à béton" },
        { code: "212", label: "Bureautique" }
      ],
    },
    {
      categorie: "Opérations Diverses (O.D)",
      elements: [
        { code: "301", label: "Matières consommées en O.D" },
        { code: "302", label: "Achat Eau & Electricité" },
        { code: "303", label: "Personnel (MOO)" },
        { code: "304", label: "Soustraitance services" },
        { code: "305", label: "Entretien & Réparation" },
        { code: "306", label: "Location Matèriel transport" },
        { code: "0", label: "Frais de Transport" },
        { code: "307", label: "Assurances" },
        { code: "308", label: "Documents Gen. & Seminaire" },
        { code: "309", label: "Voyages, Mission, Hébergement" },
        { code: "310", label: "Poste & Télécom" },
        { code: "311", label: "Honoraires & Contentieux" },
        { code: "312", label: "Etude Assistance technique, recherche" },
        { code: "313", label: "Frais de recouvrement" },
        { code: "314", label: "Frais commerciaux" },
        { code: "315", label: "Frais conseil & assemblées" },
        { code: "316", label: "Amortissement" },
        { code: "317", label: "Provisions" },
        { code: "318", label: "Dons et Subventions" },
        { code: "319", label: "Frais financiers" },
        { code: "320", label: "Publicité et propagandes" },
        { code: "321", label: "Loyer" },
        { code: "322", label: "Réceptions partenaires" },
        { code: "323", label: "Frais de transit et douanes" },
        { code: "324", label: "Impôt BIC & divers impôts" },
        { code: "326", label: "Redressement Stock" },
        { code: "327", label: "Transport Matieres" },
        { code: "399", label: "Autres charges OD" }
      ],
    },
    {
      categorie: "Produit",
      elements: [{ code: "", label: "Produit" }],
    },
  ];

  // ✅ Liste des catégories à exclure des totaux "SANS MO"
  const EXCLUDED_FROM_SANS_MO = ["Main d'Œuvre", "Produit"];

  // ✅ FONCTIONS DE VÉRIFICATION DES RÔLES
  const isAdmin = useCallback(() => {
    if (parentUserRole) return parentUserRole === 'admin';
    return userRole === 'admin';
  }, [userRole, parentUserRole]);

  const canEdit = useCallback(() => {
    if (parentCanEdit !== undefined) return parentCanEdit;
    return isAdmin();
  }, [isAdmin, parentCanEdit]);

  // ✅ FONCTION D'EXTRACTION DES DONNÉES
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

  // ✅ CHARGER LE RÔLE UTILISATEUR (seulement si non fourni par le parent)
  const fetchUserRole = useCallback(async () => {
    if (parentUserRole) {
      setUserLoading(false);
      return;
    }

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
      
      const response = await fetch(USER_URL, {
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
  }, [parentUserRole]);

  useEffect(() => {
    const initialize = async () => {
      await fetchUserRole();
      if (projetId) {
        if (!projetData) {
          fetchProjet();
        }
        fetchBudgets();
      }
    };
    initialize();
  }, [projetId, fetchUserRole]);

  const fetchProjet = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/projets/${projetId}`);
      
      if (!response.ok) {
        throw new Error(`Projet non trouvé (${response.status})`);
      }
      
      const data = await response.json();
      setProjet(data);
    } catch (error) {
      console.error('Erreur chargement projet:', error);
      setError('Impossible de charger les données du projet: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBudgets = async () => {
    if (!projetId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log(`📡 Chargement budgets pour projet ${projetId}...`);
      const response = await api.get(`/budgets/projet/${projetId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setBudgets({});
          return;
        }
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const responseData = await response.json();
      console.log('📦 Données budgets reçues:', responseData);
      
      let budgetsData = extractDataFromResponse(responseData);
      
      const montants = {};
      budgetsData.forEach((b) => {
        montants[b.sous_category] = {
          montant: b.montant_sous_category ? parseFloat(b.montant_sous_category) : 0,
          janvier: parseFloat(b.janvier) || 0,
          fevrier: parseFloat(b.fevrier) || 0,
          mars: parseFloat(b.mars) || 0,
          avril: parseFloat(b.avril) || 0,
          mai: parseFloat(b.mai) || 0,
          juin: parseFloat(b.juin) || 0,
          juillet: parseFloat(b.juillet) || 0,
          aout: parseFloat(b.aout) || 0,
          septembre: parseFloat(b.septembre) || 0,
          octobre: parseFloat(b.octobre) || 0,
          novembre: parseFloat(b.novembre) || 0,
          decembre: parseFloat(b.decembre) || 0,
          category: b.category,
          code: b.code || "",
          id: b.id
        };
      });
      
      setBudgets(montants);
      
    } catch (err) {
      console.error('❌ Erreur chargement budgets:', err);
      if (err.message?.includes('403')) {
        setError('Accès refusé - Vous n\'avez pas les permissions nécessaires');
      } else {
        setError('Erreur de chargement: ' + err.message);
      }
      setBudgets({});
    } finally {
      setLoading(false);
    }
  };

  // ✅ GESTION DU MODAL AVEC VÉRIFICATION DES RÔLES
  const handleOpenModal = (sousCategorie) => {
    if (!canEdit()) {
      setError("Seuls les administrateurs peuvent modifier les budgets");
      return;
    }
    setSelectedSousCategorie(sousCategorie);
    const existing = budgets[sousCategorie] || {};
    
    const filledData = {
      montant: existing.montant?.toString() || "",
      Janvier: existing.janvier?.toString() || "",
      Février: existing.fevrier?.toString() || "",
      Mars: existing.mars?.toString() || "",
      Avril: existing.avril?.toString() || "",
      Mai: existing.mai?.toString() || "",
      Juin: existing.juin?.toString() || "",
      Juillet: existing.juillet?.toString() || "",
      Août: existing.aout?.toString() || "",
      Septembre: existing.septembre?.toString() || "",
      Octobre: existing.octobre?.toString() || "",
      Novembre: existing.novembre?.toString() || "",
      Décembre: existing.decembre?.toString() || "",
    };
    
    setFormData(filledData);
    setValidationErrors({});
    setShowModal(true);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const getApiData = () => {
    let category = "Opérations Diverses (O.D)";
    const el = selectedSousCategorie;

    let code = "";
    budgetData.forEach(cat => {
      const element = cat.elements.find(item => item.label === el);
      if (element) {
        code = element.code;
        category = cat.categorie;
      }
    });

    const parseValue = (value) => {
      if (value === "" || value === null || value === undefined) return 0;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    };

    const projetIdNum = parseInt(projetId);
    
    return {
      category: category,
      sous_category: el,
      code: code || "",
      montant_sous_category: parseValue(formData.montant),
      projet_id: projetIdNum,
      janvier: parseValue(formData.Janvier),
      fevrier: parseValue(formData.Février),
      mars: parseValue(formData.Mars),
      avril: parseValue(formData.Avril),
      mai: parseValue(formData.Mai),
      juin: parseValue(formData.Juin),
      juillet: parseValue(formData.Juillet),
      aout: parseValue(formData.Août),
      septembre: parseValue(formData.Septembre),
      octobre: parseValue(formData.Octobre),
      novembre: parseValue(formData.Novembre),
      decembre: parseValue(formData.Décembre),
    };
  };

  // ✅ SAUVEGARDE AVEC VÉRIFICATION DE SÉCURITÉ
  const handleSaveMontant = async () => {
    if (!selectedSousCategorie) return;
    
    if (!canEdit()) {
      setError("Action non autorisée. Vous n'avez pas les permissions nécessaires.");
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      setValidationErrors({});
      
      const apiData = getApiData();

      if (!apiData.montant_sous_category || apiData.montant_sous_category <= 0) {
        setValidationErrors({
          montant: 'Le montant annuel est obligatoire et doit être supérieur à 0'
        });
        throw new Error('Veuillez corriger les erreurs de validation ci-dessous');
      }

      const existingBudget = budgets[selectedSousCategorie];
      let response;

      if (existingBudget && existingBudget.id) {
        response = await api.put(`/budgets/${existingBudget.id}`, apiData);
      } else {
        response = await api.post(`/budgets`, apiData);
      }

      const responseData = await response.json();

      if (!response.ok) {
        if (response.status === 422 && responseData.errors) {
          const formattedErrors = {};
          const fieldMapping = {
            'montant_sous_category': 'montant',
            'projet_id': 'projet',
            'category': 'category',
            'sous_category': 'sous_category',
            'code': 'code',
            'janvier': 'Janvier', 'fevrier': 'Février', 'mars': 'Mars',
            'avril': 'Avril', 'mai': 'Mai', 'juin': 'Juin',
            'juillet': 'Juillet', 'aout': 'Août', 'septembre': 'Septembre',
            'octobre': 'Octobre', 'novembre': 'Novembre', 'decembre': 'Décembre'
          };
          
          Object.keys(responseData.errors).forEach(key => {
            const uiField = fieldMapping[key] || key;
            formattedErrors[uiField] = responseData.errors[key][0];
          });
          
          setValidationErrors(formattedErrors);
          
          if (responseData.errors.projet_id) {
            setError(`Erreur de validation projet: ${responseData.errors.projet_id[0]}`);
          }
          
          throw new Error('Erreurs de validation');
        }
        
        if (response.status === 403) {
          throw new Error('Accès refusé - Vous n\'avez pas les permissions nécessaires');
        }
        
        if (responseData.message) {
          throw new Error(responseData.message);
        } else {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
      }

      await fetchBudgets();
      setShowModal(false);
      setFormData({
        montant: "", Janvier: "", Février: "", Mars: "", Avril: "", Mai: "", Juin: "",
        Juillet: "", Août: "", Septembre: "", Octobre: "", Novembre: "", Décembre: "",
      });
      setValidationErrors({});
      
    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      if (!error.message?.includes('validation') && !error.message?.includes('403')) {
        setError('Erreur de sauvegarde: ' + error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined || num === "") return "-";
    const n = typeof num === 'string' ? parseFloat(num) : num;
    return isNaN(n) ? "-" : new Intl.NumberFormat('fr-FR').format(n);
  };

  // ============================================
  // FONCTIONS DE CALCUL DES BUDGETS
  // ============================================

  // Calculer le total d'une catégorie
  const calculateCategoryTotal = (elements) => {
    return elements.reduce((total, el) => {
      const m = budgets[el.label];
      return total + (m?.montant || 0);
    }, 0);
  };

  // Calculer la réalisation d'une catégorie
  const calculateCategoryRealisation = (elements) => {
    return elements.reduce((total, el) => {
      const m = budgets[el.label];
      if (!m) return total;
      return total + (
        (m.janvier || 0) + (m.fevrier || 0) + (m.mars || 0) + 
        (m.avril || 0) + (m.mai || 0) + (m.juin || 0) + 
        (m.juillet || 0) + (m.aout || 0) + (m.septembre || 0) + 
        (m.octobre || 0) + (m.novembre || 0) + (m.decembre || 0)
      );
    }, 0);
  };

  // Calculer le total par mois pour une catégorie
  const calculateTotalMois = (moisNom, elements) => {
    const moisMapping = {
      'Janvier': 'janvier', 'Février': 'fevrier', 'Mars': 'mars',
      'Avril': 'avril', 'Mai': 'mai', 'Juin': 'juin',
      'Juillet': 'juillet', 'Août': 'aout', 'Septembre': 'septembre',
      'Octobre': 'octobre', 'Novembre': 'novembre', 'Décembre': 'decembre'
    };
    
    const moisApi = moisMapping[moisNom];
    
    return elements.reduce((sum, el) => {
      const m = budgets[el.label];
      return sum + (m?.[moisApi] || 0);
    }, 0);
  };

  // ✅ TOTAL BUDGET AVEC TOUTES LES CATÉGORIES (hors Produit)
  const calculateTotalGeneralBudget = () => {
    return budgetData.reduce((total, cat) => {
      if (cat.categorie === "Produit") return total;
      return total + calculateCategoryTotal(cat.elements);
    }, 0);
  };

  // ✅ TOTAL BUDGET SANS MAIN D'ŒUVRE (inclut "Côut Main d'Œuvre milliers d'UM")
  const calculateTotalBudgetSansMainOeuvre = () => {
    let total = 0;
    budgetData.forEach(cat => {
      // Exclure UNIQUEMENT la catégorie "Main d'Œuvre" et "Produit"
      if (EXCLUDED_FROM_SANS_MO.includes(cat.categorie)) return;
      total += calculateCategoryTotal(cat.elements);
    });
    return total;
  };

  // ✅ RÉALISATION SANS MAIN D'ŒUVRE (inclut "Côut Main d'Œuvre milliers d'UM")
  const calculateTotalRealisationSansMainOeuvre = () => {
    let total = 0;
    budgetData.forEach(cat => {
      if (EXCLUDED_FROM_SANS_MO.includes(cat.categorie)) return;
      total += calculateCategoryRealisation(cat.elements);
    });
    return total;
  };

  // ✅ TOTAL RÉALISATION AVEC TOUTES LES CATÉGORIES (hors Produit)
  const calculateTotalRealisationMensuelle = () => {
    return budgetData.reduce((total, cat) => {
      if (cat.categorie === "Produit") return total;
      return total + calculateCategoryRealisation(cat.elements);
    }, 0);
  };

  // ✅ TOTAL PRODUIT
  const calculateTotalProduit = () => {
    const produitElements = budgetData.find(cat => cat.categorie === "Produit")?.elements || [];
    return calculateCategoryTotal(produitElements);
  };

  // ✅ RÉALISATION PRODUIT
  const calculateRealisationProduit = () => {
    const produitElements = budgetData.find(cat => cat.categorie === "Produit")?.elements || [];
    return calculateCategoryRealisation(produitElements);
  };

  // ============================================
  // EXPORT EXCEL
  // ============================================
  const exportToExcel = () => {
    if (!projet) return;

    const wb = XLSX.utils.book_new();
    const wsData = [];
    
    wsData.push([`Budget du Projet: ${projet.name}`]);
    wsData.push([`Statut: ${projet.status} - Progression: ${projet.progress}%`]);
    wsData.push([]);
    
    wsData.push(["Code", "Catégorie / Sous-catégorie", "Montant annuel", ...moisUI]);

    budgetData.forEach(cat => {
      wsData.push(["", cat.categorie, "", ...Array(12).fill("")]);
      cat.elements.forEach(el => {
        const m = budgets[el.label] || {};
        wsData.push([
          el.code,
          el.label,
          m.montant || 0,
          ...moisUI.map(mois => {
            const moisMapping = {
              'Janvier': 'janvier', 'Février': 'fevrier', 'Mars': 'mars',
              'Avril': 'avril', 'Mai': 'mai', 'Juin': 'juin',
              'Juillet': 'juillet', 'Août': 'aout', 'Septembre': 'septembre',
              'Octobre': 'octobre', 'Novembre': 'novembre', 'Décembre': 'decembre'
            };
            return m[moisMapping[mois]] || 0;
          }),
        ]);
      });
      const catTotal = calculateCategoryTotal(cat.elements);
      wsData.push([
        "",
        `TOTAL ${cat.categorie}`,
        catTotal,
        ...moisUI.map(mois => calculateTotalMois(mois, cat.elements)),
      ]);
      wsData.push([]);
    });

    const totalBudget = calculateTotalGeneralBudget();
    const totalBudgetSansMainOeuvre = calculateTotalBudgetSansMainOeuvre();
    const totalRealisationSansMainOeuvre = calculateTotalRealisationSansMainOeuvre();
    const totalProduit = calculateTotalProduit();
    const totalRealisationMensuelle = calculateTotalRealisationMensuelle();
    const realisationProduit = calculateRealisationProduit();
    
    wsData.push([]);
    wsData.push(["", "SYNTHÈSE", "", ...Array(12).fill("")]);
    wsData.push(["", "TOTAL BUDGET (AVEC MAIN D'ŒUVRE)", totalBudget, ...Array(12).fill("")]);
    wsData.push(["", "TOTAL BUDGET (SANS MAIN D'ŒUVRE)", totalBudgetSansMainOeuvre, ...Array(12).fill("")]);
    wsData.push(["", "RÉALISATION (SANS MAIN D'ŒUVRE)", totalRealisationSansMainOeuvre, ...Array(12).fill("")]);
    wsData.push(["", "TOTAL PRODUIT", totalProduit, ...Array(12).fill("")]);
    wsData.push(["", "RÉALISATION PRODUIT", realisationProduit, ...Array(12).fill("")]);
    wsData.push(["", "RÉSULTAT = PRODUIT - RÉALISATION", totalProduit - totalRealisationSansMainOeuvre, ...Array(12).fill("")]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Budget");
    XLSX.writeFile(wb, `Budget_${projet.name}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getFieldError = (fieldName) => {
    return validationErrors[fieldName];
  };

  // ============================================
  // CALCUL DES STATISTIQUES POUR L'AFFICHAGE
  // ============================================
  const totalBudgetSansMainOeuvre = calculateTotalBudgetSansMainOeuvre();
  const totalRealisationSansMainOeuvre = calculateTotalRealisationSansMainOeuvre();
  const totalProduit = calculateTotalProduit();
  const realisationProduit = calculateRealisationProduit();
  const resultat = totalProduit - totalRealisationSansMainOeuvre;
  const pourcentageGlobalSansMainOeuvre = totalBudgetSansMainOeuvre ? ((totalRealisationSansMainOeuvre / totalBudgetSansMainOeuvre) * 100).toFixed(1) : 0;
  const pourcentageProduit = totalProduit ? ((realisationProduit / totalProduit) * 100).toFixed(1) : 0;
  const pourcentageResultat = totalProduit ? ((resultat / totalProduit) * 100).toFixed(1) : 0;

  // ✅ AFFICHAGE PENDANT LE CHARGEMENT DU RÔLE
  if (userLoading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Vérification des permissions...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container-fluid className="mt-4">
      <Breadcrumb className="mb-4">
        <Breadcrumb.Item active>
          📊 Budget - {projet?.name || `Projet ${projetId}`}
        </Breadcrumb.Item>
      </Breadcrumb>

      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0">📊 Budget - {projet?.name || `Projet ${projetId}`}</h5>
            {projet && (
              <small>Statut: {projet.status} - Progression: {projet.progress}%</small>
            )}
          </div>
          <div className="d-flex align-items-center gap-2">
            {/* ✅ BADGE DE RÔLE UTILISATEUR */}
            <Badge bg={canEdit() ? 'success' : 'secondary'} className="py-2">
              {canEdit() ? <><FaUserShield className="me-1" /> Admin</> : <><FaUser className="me-1" /> Consultation</>}
            </Badge>
            <small className="text-white-50 me-2">API: {API_BASE_URL}</small>
            
            <Button 
              variant="light" 
              onClick={exportToExcel} 
              size="sm" 
              className="me-2"
              disabled={loading}
            >
              📥 Exporter Excel
            </Button>
            <Button 
              variant="outline-light" 
              onClick={onRetour} 
              size="sm"
            >
              <FaArrowLeft className="me-1" /> Retour
            </Button>
          </div>
        </Card.Header>
        
        <Card.Body>
          {error && (
            <Alert variant="danger" className="mb-3" onClose={() => setError(null)} dismissible>
              <Alert.Heading>Erreur</Alert.Heading>
              <p style={{ whiteSpace: 'pre-wrap' }}>{error}</p>
            </Alert>
          )}

          {/* 📋 SYNTHÈSE GÉNÉRALE */}
          <div className="mb-4">
            <h6 className="text-center mb-3 text-muted">📋 SYNTHÈSE GÉNÉRALE</h6>
            <div className="d-flex justify-content-around align-items-stretch gap-3 flex-wrap">
              <div className="p-3 bg-primary text-white rounded text-center shadow-sm flex-fill" style={{ minWidth: '200px' }}>
                <h6 className="mb-2">💰 TOTAL BUDGET (SANS MO)</h6>
                <div className="fs-5 fw-bold">{formatNumber(totalBudgetSansMainOeuvre)}</div>
                <small>Budget annuel total (hors Main d'Œuvre)</small>
              </div>

              <div className="p-3 bg-info text-white rounded text-center shadow-sm flex-fill" style={{ minWidth: '200px' }}>
                <h6 className="mb-2">📈 RÉALISATION (SANS MO)</h6>
                <div className="fs-5 fw-bold">{formatNumber(totalRealisationSansMainOeuvre)}</div>
                <small>{pourcentageGlobalSansMainOeuvre}% du budget</small>
              </div>

              <div className="p-3 bg-warning text-dark rounded text-center shadow-sm flex-fill" style={{ minWidth: '200px' }}>
                <h6 className="mb-2">🎯 TOTAL PRODUIT</h6>
                <div className="fs-5 fw-bold">{formatNumber(totalProduit)}</div>
                <small>{pourcentageProduit}% réalisé</small>
              </div>

              <div className={`p-3 rounded text-center shadow-sm flex-fill ${resultat >= 0 ? 'bg-success text-white' : 'bg-danger text-white'}`} style={{ minWidth: '200px' }}>
                <h6 className="mb-2">📊 RÉSULTAT</h6>
                <div className="fs-5 fw-bold">{formatNumber(resultat)}</div>
                <small>{pourcentageResultat}% du produit</small>
              </div>
            </div>
          </div>

          {/* TABLEAU DÉTAILLÉ */}
          <div className="table-responsive">
            <Table bordered hover responsive size="sm">
              <thead className="table-light text-center align-middle">
                <tr>
                  <th>Code</th>
                  <th>Catégorie / Sous-catégorie</th>
                  <th>Montant</th>
                  {moisUI.map(m => <th key={m}>{m}</th>)}
                  <th>%</th>
                  <th>Action</th>
                 </tr>
              </thead>
              <tbody>
                {budgetData.map((cat, i) => {
                  const catTotal = calculateCategoryTotal(cat.elements);
                  const catReal = calculateCategoryRealisation(cat.elements);
                  const catPerc = catTotal ? ((catReal / catTotal) * 100).toFixed(1) : 0;
                  const isExcluded = EXCLUDED_FROM_SANS_MO.includes(cat.categorie);
                  const exclusionNote = cat.categorie === "Main d'Œuvre" ? " ()" : "";

                  return (
                    <React.Fragment key={i}>
                      <tr className={cat.categorie === "Produit" ? "table-success fw-bold" : "table-primary fw-bold"}>
                        <td colSpan={moisUI.length + 4}>
                          {cat.categorie}{exclusionNote}
                         </td>
                      </tr>
                      {cat.elements.map((el, j) => {
                        const m = budgets[el.label] || {};
                        const real = calculateCategoryRealisation([el]);
                        const perc = m.montant ? ((real / m.montant) * 100).toFixed(1) : "0.0";
                        const badgeColor = perc >= 100 ? "success" : perc >= 80 ? "warning" : "secondary";

                        return (
                          <tr key={j}>
                            <td className="text-center fw-bold text-muted">{el.code || "-"}</td>
                            <td style={{ paddingLeft: "15px" }}>{el.label}</td>
                            <td className="text-end">{formatNumber(m.montant)}</td>
                            {moisUI.map(mois => {
                              const moisMapping = {
                                'Janvier': 'janvier', 'Février': 'fevrier', 'Mars': 'mars',
                                'Avril': 'avril', 'Mai': 'mai', 'Juin': 'juin',
                                'Juillet': 'juillet', 'Août': 'aout', 'Septembre': 'septembre',
                                'Octobre': 'octobre', 'Novembre': 'novembre', 'Décembre': 'decembre'
                              };
                              const moisApi = moisMapping[mois];
                              return (
                                <td key={mois} className="text-end">
                                  {formatNumber(m[moisApi])}
                                </td>
                              );
                              
                            })}
                            <td className="text-center">
                              <Badge bg={badgeColor}>{perc}%</Badge>
                            </td>
                            <td className="text-center">
                              {canEdit() ? (
                                <Button
                                  size="sm"
                                  variant={m.montant ? "outline-warning" : "outline-primary"}
                                  onClick={() => handleOpenModal(el.label)}
                                  disabled={loading || saving}
                                >
                                  {m.montant ? <><FaEdit className="me-1" />Modifier</> : <><FaPlus className="me-1" />Ajouter</>}
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline-secondary"
                                  disabled
                                  title="Modification réservée aux administrateurs"
                                >
                                  <FaLock className="me-1" /> {m.montant ? 'Voir' : '-'}
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="table-info fw-bold">
                        <td colSpan="2" className="text-end">TOTAL {cat.categorie}</td>
                        <td className="text-end">{formatNumber(catTotal)}</td>
                        {moisUI.map(mois => (
                          <td key={mois} className="text-end">
                            {formatNumber(calculateTotalMois(mois, cat.elements))}
                          </td>
                        ))}
                        <td className="text-center">
                          <Badge bg="primary">{catPerc}%</Badge>
                        </td>
                        <td></td>
                      </tr>
                      {i < budgetData.length - 1 && (
                        <tr><td colSpan={moisUI.length + 5} style={{ height: '10px' }}></td></tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* ✅ MODAL - BLOQUÉ SI NON ADMIN */}
      {showModal && !canEdit() ? (
        <Modal show={true} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton className="bg-warning">
            <Modal.Title><FaLock className="me-2" /> Accès restreint</Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-center">
            <Alert variant="warning">
              <FaInfoCircle className="me-2" />
              <strong>Permission refusée</strong>
              <p className="mb-0 mt-2">
                Vous devez être administrateur pour modifier les budgets.
              </p>
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Fermer
            </Button>
          </Modal.Footer>
        </Modal>
      ) : showModal && (
        <Modal show={showModal} onHide={() => !saving && setShowModal(false)} size="xl">
          <Modal.Header closeButton>
            <Modal.Title>
              {budgets[selectedSousCategorie] ? "Modifier" : "Ajouter"} : {selectedSousCategorie}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {Object.keys(validationErrors).length > 0 && (
              <Alert variant="warning" className="mb-3">
                <Alert.Heading>Erreurs de validation</Alert.Heading>
                <ul className="mb-0">
                  {Object.entries(validationErrors).map(([field, error]) => (
                    <li key={field}><strong>{field}:</strong> {error}</li>
                  ))}
                </ul>
              </Alert>
            )}

            <Form>
              <Row className="mb-3">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Montant annuel *</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.montant}
                      onChange={(e) => handleInputChange("montant", e.target.value)}
                      className="text-end"
                      placeholder="0.00"
                      disabled={saving}
                      isInvalid={!!getFieldError('montant')}
                    />
                    <Form.Control.Feedback type="invalid">
                      {getFieldError('montant')}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                {moisUI.map((mois, idx) => {
                  const fieldApi = mois.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                  
                  return (
                    <Col md={2} key={idx}>
                      <Form.Group>
                        <Form.Label>{mois}</Form.Label>
                        <Form.Control
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData[mois]}
                          onChange={(e) => handleInputChange(mois, e.target.value)}
                          className="text-end"
                          placeholder="0.00"
                          disabled={saving}
                          isInvalid={!!getFieldError(fieldApi)}
                        />
                        <Form.Control.Feedback type="invalid">
                          {getFieldError(fieldApi)}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  );
                })}
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={saving}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleSaveMontant} disabled={saving}>
              {saving ? <><Spinner animation="border" size="sm" /> Enregistrement...</> : 'Enregistrer'}
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </Container-fluid>
  );
};

export default BudgetProjet;