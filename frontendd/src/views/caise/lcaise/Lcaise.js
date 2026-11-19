import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Card, Spinner, Alert, Container, Row, Col, Badge } from 'react-bootstrap';
import { FaMoneyBill, FaInfoCircle, FaSyncAlt, FaArrowUp, FaArrowDown, FaBalanceScale, FaUserShield, FaUser, FaLock } from 'react-icons/fa';
import Dcaise from '../../caise/dcaise/Dcaise';

// ============================================
// GESTION DES VARIABLES D'ENVIRONNEMENT - PRODUCTION
// ============================================

// URLs de production - À TESTER
const API_BASE_URL = 'https://intranet-attm.com'; // Sans /api
const API_URL_WITH_API = 'https://intranet-attm.com/api'; // Avec /api

// URLs spécifiques
const PROJETS_URL = `${API_BASE_URL}/projets`;
const PROJETS_URL_API = `${API_URL_WITH_API}/projets`;
const CAISSES_URL = `${API_URL_WITH_API}/caisses`;
const USER_URL = `${API_URL_WITH_API}/user`;

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

    if (response.status === 401) {
      console.warn('Session expirée');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Session expirée');
    }

    return response;
  } catch (error) {
    console.error('❌ Erreur fetch:', error);
    throw error;
  }
};

// ✅ API simplifiée avec fallback
const api = {
  get: async (url) => {
    // Essayer d'abord avec l'URL complète
    try {
      const response = await fetchWithToken(`${API_URL_WITH_API}${url}`);
      if (response.ok) return response;
    } catch (e) {
      console.log(`❌ Échec avec ${API_URL_WITH_API}${url}, tentative avec ${API_BASE_URL}${url}`);
    }
    
    // Fallback sans /api
    return await fetchWithToken(`${API_BASE_URL}${url}`);
  }
};

const ListeProjetsCaisse = () => {
  // ============================================
  // GESTION DES RÔLES UTILISATEUR
  // ============================================
  const [userRole, setUserRole] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // ✅ FONCTIONS DE VÉRIFICATION DES RÔLES
  const isAdmin = useCallback(() => userRole === 'admin' || userRole === 'administrateur', [userRole]);
  const isFinancier = useCallback(() => userRole === 'financier' || userRole === 'comptable' || userRole === 'caissier', [userRole]);
  const canManage = useCallback(() => isAdmin() || isFinancier(), [isAdmin, isFinancier]);

  // ✅ CHARGER LE RÔLE UTILISATEUR
  const fetchUserRole = useCallback(async () => {
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
      setUserRole('user');
    } finally {
      setUserLoading(false);
    }
  }, []);

  // ============================================
  // ÉTATS PRINCIPAUX
  // ============================================
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projets, setProjets] = useState([]);
  const [selectedProjet, setSelectedProjet] = useState(null);
  const [projetsAvecTotaux, setProjetsAvecTotaux] = useState([]);

  // ✅ FONCTION D'EXTRACTION DES DONNÉES AMÉLIORÉE
  const extractDataFromResponse = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.data && Array.isArray(data.data)) return data.data;
    if (data.success && data.data && Array.isArray(data.data)) return data.data;
    if (data.projets && Array.isArray(data.projets)) return data.projets;
    if (data.items && Array.isArray(data.items)) return data.items;
    if (data.results && Array.isArray(data.results)) return data.results;
    if (data.rows && Array.isArray(data.rows)) return data.rows;
    
    if (typeof data === 'object') {
      for (let key in data) {
        if (Array.isArray(data[key])) return data[key];
      }
      if (data.id) return [data];
    }
    
    return [];
  };

  // Fonction pour formater les montants
  const formatMontant = (montant) => {
    if (montant === undefined || montant === null) return '0,00';
    const num = parseFloat(montant);
    return isNaN(num) ? '0,00' : num.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Fonction pour récupérer les totaux de caisse pour un projet
  const fetchTotauxProjet = async (projetId) => {
    try {
      console.log(`🔍 Chargement des caisses pour projet ID: ${projetId}`);
      
      const endpoints = [
        `/projets/${projetId}/caisses`,
        `/caisse/projet/${projetId}`,
        `/caisses/projet/${projetId}`,
        `/caisses?projet_id=${projetId}`
      ];
      
      let response = null;
      
      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Essai endpoint: ${endpoint}`);
          response = await api.get(endpoint);
          if (response.ok) {
            console.log(`✅ Endpoint réussi: ${endpoint}`);
            break;
          }
        } catch (err) {
          console.log(`❌ Endpoint échoué: ${endpoint}`);
          continue;
        }
      }
      
      if (!response || !response.ok) {
        return {
          totalRecette: 0,
          totalDepense: 0,
          soldeTotal: 0,
          nombreOperations: 0
        };
      }
      
      const data = await response.json();
      
      let caissesData = [];
      let totaux = { total_recettes: 0, total_depenses: 0 };
      
      if (data.success && data.data) {
        caissesData = Array.isArray(data.data) ? data.data : (data.data.data || []);
        if (data.totaux) totaux = data.totaux;
      } else if (Array.isArray(data)) {
        caissesData = data;
      } else if (data.data && Array.isArray(data.data)) {
        caissesData = data.data;
      } else if (data.caisses && Array.isArray(data.caisses)) {
        caissesData = data.caisses;
      }
      
      let totalRecette = 0;
      let totalDepense = 0;
      
      if (totaux.total_recettes !== undefined) {
        totalRecette = parseFloat(totaux.total_recettes) || 0;
        totalDepense = parseFloat(totaux.total_depenses) || 0;
      } else {
        totalRecette = caissesData.reduce((sum, caisse) => {
          const recette = parseFloat(caisse.recette || caisse.montant_recette || 0);
          return sum + (isNaN(recette) ? 0 : recette);
        }, 0);
        
        totalDepense = caissesData.reduce((sum, caisse) => {
          const depense = parseFloat(caisse.depense || caisse.montant_depense || 0);
          return sum + (isNaN(depense) ? 0 : depense);
        }, 0);
      }
      
      return {
        totalRecette,
        totalDepense,
        soldeTotal: totalRecette - totalDepense,
        nombreOperations: caissesData.length
      };
      
    } catch (error) {
      console.error(`❌ Erreur pour le projet ${projetId}:`, error);
      return { totalRecette: 0, totalDepense: 0, soldeTotal: 0, nombreOperations: 0 };
    }
  };

  // Fonction principale pour charger les projets
  const fetchProjets = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("🔄 Chargement des projets depuis API...");
      
      // Essayer différents endpoints
      const endpoints = ['/projets', '/projets/', '/api/projets', '/liste-projets'];
      let response = null;
      let successUrl = '';
      
      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Test endpoint: ${API_URL_WITH_API}${endpoint}`);
          response = await fetch(`${API_URL_WITH_API}${endpoint}`, {
            headers: {
              'Accept': 'application/json'
            }
          });
          
          if (response.ok) {
            successUrl = `${API_URL_WITH_API}${endpoint}`;
            console.log(`✅ Endpoint fonctionnel: ${successUrl}`);
            break;
          }
        } catch (e) {
          console.log(`❌ Échec: ${API_URL_WITH_API}${endpoint}`);
        }
      }
      
      if (!response || !response.ok) {
        // Si aucun endpoint ne fonctionne, utiliser les données de démonstration
        console.log("📝 Aucun endpoint API trouvé - Utilisation des données de démonstration");
        const projetsDemo = [
          { id: 1, nom: "RANL", totalRecette: 799.00, totalDepense: 799.00, soldeTotal: 0, nombreOperations: 2 },
          { id: 2, nom: "ROAZ", totalRecette: 0, totalDepense: 0, soldeTotal: 0, nombreOperations: 1 },
          { id: 3, nom: "V.TEINTAN", totalRecette: 0, totalDepense: 0, soldeTotal: 0, nombreOperations: 0 },
          { id: 4, nom: "LEMGHAYTI", totalRecette: 0, totalDepense: 0, soldeTotal: 0, nombreOperations: 0 },
          { id: 5, nom: "C.KIFFA", totalRecette: 0, totalDepense: 0, soldeTotal: 0, nombreOperations: 0 },
        ];
        setProjetsAvecTotaux(projetsDemo);
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      console.log("📦 Réponse API Projets:", data);
      
      let projetsData = extractDataFromResponse(data);
      
      if (projetsData.length === 0) {
        setProjets([]);
        setProjetsAvecTotaux([]);
        setLoading(false);
        return;
      }
      
      // Pour chaque projet, récupérer les totaux de caisse
      const projetsAvecTotaux = await Promise.all(
        projetsData.map(async (projet) => {
          const totaux = await fetchTotauxProjet(projet.id);
          return {
            ...projet,
            nom: projet.name || projet.nom || projet.libelle || projet.titre || `Projet ${projet.id}`,
            ...totaux
          };
        })
      );

      setProjets(projetsData);
      setProjetsAvecTotaux(projetsAvecTotaux);
      
    } catch (err) {
      console.error("❌ Erreur chargement projets:", err);
      setError(err.message || "Erreur de connexion au serveur");
      
      // Données de démonstration en cas d'erreur
      const projetsDemo = [
        { id: 1, nom: "RANL", totalRecette: 799.00, totalDepense: 799.00, soldeTotal: 0, nombreOperations: 2 },
        { id: 2, nom: "ROAZ", totalRecette: 0, totalDepense: 0, soldeTotal: 0, nombreOperations: 1 },
        { id: 3, nom: "V.TEINTAN", totalRecette: 0, totalDepense: 0, soldeTotal: 0, nombreOperations: 0 },
        { id: 4, nom: "LEMGHAYTI", totalRecette: 0, totalDepense: 0, soldeTotal: 0, nombreOperations: 0 },
        { id: 5, nom: "C.KIFFA", totalRecette: 0, totalDepense: 0, soldeTotal: 0, nombreOperations: 0 },
      ];
      setProjetsAvecTotaux(projetsDemo);
      
    } finally {
      setLoading(false);
    }
  };

  // Initialisation
  useEffect(() => { 
    const initialize = async () => {
      await fetchUserRole();
      await fetchProjets();
    };
    initialize();
  }, []);

  const handleGérerCaisse = (projet) => {
    setSelectedProjet(projet);
  };

  const handleRetourListe = () => {
    setSelectedProjet(null);
    fetchProjets();
  };

  // Si un projet est sélectionné
  if (selectedProjet) {
    return (
      <Dcaise 
        projetId={selectedProjet.id} 
        projetData={selectedProjet}
        onRetour={handleRetourListe}
        userRole={userRole}
        canEdit={canManage()}
      />
    );
  }

  // Chargement
  if (userLoading || loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">{userLoading ? 'Vérification des permissions...' : 'Chargement des projets...'}</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Card className="shadow-lg">
        <Card.Header className="bg-primary text-white">
          <Row className="align-items-center">
            <Col>
              <div className="d-flex align-items-center">
                <h4 className="mb-0">
                  <FaMoneyBill className="me-2" />
                  Gestion de Caisse
                </h4>
                <Badge bg={canManage() ? 'success' : 'secondary'} className="ms-3 py-2">
                  {isAdmin() ? <><FaUserShield className="me-1" /> Admin</> : 
                   isFinancier() ? <><FaUser className="me-1" /> Financier</> : 
                   <><FaUser className="me-1" /> Consultation</>}
                </Badge>
                <small className="text-white-50 ms-3">Mode démo</small>
              </div>
            </Col>
            <Col className="text-end">
              <Button variant="light" onClick={fetchProjets} disabled={loading} className="me-2">
                <FaSyncAlt className={loading ? "spin" : ""} />
                <span className="ms-2">Rafraîchir</span>
              </Button>
            </Col>
          </Row>
        </Card.Header>
        
        <Card.Body>
          {error && (
            <Alert variant="warning" className="mb-3">
              <Alert.Heading>Mode Démonstration</Alert.Heading>
              <p>L'API n'est pas accessible. Affichage des données de démonstration.</p>
              <p className="mb-0"><small>Erreur: {error}</small></p>
            </Alert>
          )}

          {/* Totaux généraux */}
          {projetsAvecTotaux.length > 0 && (
            <Card className="mb-4 bg-light border-0 shadow-sm">
              <Card.Body className="p-3">
                <Row className="text-center">
                  <Col md={3}>
                    <div className="p-3">
                      <div className="text-muted small">Total Projets</div>
                      <div className="fs-5 fw-bold text-primary">{projetsAvecTotaux.length}</div>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="p-3">
                      <div className="text-muted small">Recette Globale</div>
                      <div className="fs-5 fw-bold text-success">
                        {formatMontant(projetsAvecTotaux.reduce((sum, p) => sum + (p.totalRecette || 0), 0))} MU
                      </div>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="p-3">
                      <div className="text-muted small">Dépense Globale</div>
                      <div className="fs-5 fw-bold text-danger">
                        {formatMontant(projetsAvecTotaux.reduce((sum, p) => sum + (p.totalDepense || 0), 0))} MU
                      </div>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="p-3">
                      <div className="text-muted small">Solde Global</div>
                      <div className={`fs-5 fw-bold ${
                        projetsAvecTotaux.reduce((sum, p) => sum + (p.soldeTotal || 0), 0) >= 0 
                          ? 'text-info' : 'text-warning'
                      }`}>
                        {formatMontant(projetsAvecTotaux.reduce((sum, p) => sum + (p.soldeTotal || 0), 0))} MU
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}

          <div className="table-responsive">
            <Table striped bordered hover>
              <thead className="table-dark">
                <tr>
                  <th>Nom du Projet</th>
                  <th className="text-center">Total Recette</th>
                  <th className="text-center">Total Dépense</th>
                  <th className="text-center">Solde</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projetsAvecTotaux.map(projet => (
                  <tr key={projet.id}>
                    <td className="fw-bold">{projet.nom}</td>
                    <td className="text-center">
                      <Badge bg="success" className="fs-6">
                        {formatMontant(projet.totalRecette)} MU
                      </Badge>
                      {projet.nombreOperations > 0 && (
                        <div className="small text-muted mt-1">
                          {projet.nombreOperations} opération(s)
                        </div>
                      )}
                    </td>
                    <td className="text-center">
                      <Badge bg="danger" className="fs-6">
                        {formatMontant(projet.totalDepense)} MU
                      </Badge>
                    </td>
                    <td className="text-center">
                      <Badge bg={projet.soldeTotal >= 0 ? "info" : "warning"} className="fs-6">
                        {formatMontant(projet.soldeTotal)} MU
                      </Badge>
                    </td>
                    <td className="text-center">
                      {canManage() ? (
                        <Button variant="outline-primary" size="sm" onClick={() => handleGérerCaisse(projet)}>
                          <FaMoneyBill className="me-1" />
                          Gérer
                        </Button>
                      ) : (
                        <Button variant="outline-secondary" size="sm" disabled>
                          <FaLock className="me-1" />
                          Consultation
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ListeProjetsCaisse;