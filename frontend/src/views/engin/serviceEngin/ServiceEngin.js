import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Tooltip,
  OverlayTrigger,
  Form,
  Alert,
  ProgressBar,
  Spinner,
  InputGroup
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  FaTools,
  FaStopwatch,
  FaCogs,
  FaClipboardList,
  FaWrench,
  FaCar,
  FaHistory,
  FaSearch,
  FaChartLine,
  FaExclamationTriangle,
  FaClock,
  FaCog,
  FaTachometerAlt,
  FaFileExcel,
  FaChartBar,
  FaBox,
  FaUsers,
  FaPlus,
  FaLifeRing,
  FaUserTie,
  FaExchangeAlt,
  FaFolderOpen,
  FaFileAlt,
  FaTruck
} from "react-icons/fa";
import axios from 'axios';

const API_BASE_URL = 'https://intranet-attm.com/api';

const API_ENDPOINTS = {
  engins: '/engins',
  arretEngins: '/arret-engins',
  entretienEngins: '/entretien-engins',
  heuresMarche: '/heures-marche',
  pieceEngins: '/piece-engins',
  projets: '/projets',
  statistiques: '/engins/statistiques'
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000
});

api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

const MaintenancePage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [stats, setStats] = useState({
    totalEngins: 0,
    arretsEnCours: 0,
    entretiensPrevus: 0,
    productionJour: 0,
    enginsParProjet: [],
    enginsParType: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        enginsResponse,
        arretsResponse,
        entretiensResponse,
        heuresMarcheResponse,
        statistiquesResponse
      ] = await Promise.allSettled([
        api.get(API_ENDPOINTS.engins),
        api.get(API_ENDPOINTS.arretEngins),
        api.get(API_ENDPOINTS.entretienEngins),
        api.get(API_ENDPOINTS.heuresMarche),
        api.get(API_ENDPOINTS.statistiques)
      ]);

      let totalEngins = 0;
      if (enginsResponse.status === 'fulfilled') {
        const data = enginsResponse.value.data;
        const enginsData = data.data || data;
        totalEngins = Array.isArray(enginsData) ? enginsData.length : 0;
      }

      let arretsEnCours = 0;
      if (arretsResponse.status === 'fulfilled') {
        const data = arretsResponse.value.data;
        const arretsData = data.data || data;
        if (Array.isArray(arretsData)) {
          arretsEnCours = arretsData.filter(arret => 
            !arret.date_reparation || arret.date_reparation === '' || arret.statut === 'en_cours'
          ).length;
        }
      }

      let entretiensPrevus = 0;
      if (entretiensResponse.status === 'fulfilled') {
        const data = entretiensResponse.value.data;
        const entretiensData = data.data || data;
        if (Array.isArray(entretiensData)) {
          entretiensPrevus = entretiensData.filter(entretien => 
            entretien.statut === 'planifié' || entretien.statut === 'en_cours' || !entretien.statut
          ).length;
        }
      }

      let productionJour = 0;
      if (heuresMarcheResponse.status === 'fulfilled') {
        const data = heuresMarcheResponse.value.data;
        const heuresData = data.data || data;
        if (Array.isArray(heuresData)) {
          const today = new Date().toISOString().split('T')[0];
          const heuresAujourdhui = heuresData.filter(h => h.date === today);
          productionJour = heuresAujourdhui.reduce((total, h) => 
            total + (parseFloat(h.heures) || parseFloat(h.quantite) || 0), 0
          );
        }
      }

      let enginsParProjet = [];
      let enginsParType = [];
      if (statistiquesResponse.status === 'fulfilled') {
        const data = statistiquesResponse.value.data;
        const statsData = data.data || data;
        enginsParProjet = statsData.engins_par_projet || [];
        enginsParType = statsData.engins_par_type || [];
      }

      setStats({
        totalEngins,
        arretsEnCours,
        entretiensPrevus,
        productionJour: Math.round(productionJour),
        enginsParProjet,
        enginsParType
      });

    } catch (err) {
      console.error("Erreur:", err);
      setError("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Composant NoteCard
  const NoteCard = ({ imageSrc, text, link }) => (
    <Col xs={12} sm={6} md={4} lg={3} className="mb-4">
      <Card 
        className="note-card shadow-sm h-100 text-center border-0"
        style={{ cursor: "pointer", transition: "all 0.3s ease" }}
        onClick={() => navigate(link)}
      >
        <Card.Body className="d-flex flex-column align-items-center justify-content-center py-4">
          <img 
            src={imageSrc} 
            alt={text} 
            style={{ width: "64px", height: "64px", marginBottom: "15px" }} 
          />
          <h6 className="mb-0 text-primary fw-bold">{text}</h6>
        </Card.Body>
      </Card>
    </Col>
  );

  const QuickStats = () => (
    <Row className="mb-4 g-3">
      <Col md={3}>
        <Card className="stat-card border-0 bg-primary text-white">
          <Card.Body className="text-center py-3">
            <FaCar className="stat-icon mb-2" />
            {loading ? <Spinner animation="border" size="sm" variant="light" /> : <h4 className="mb-1">{stats.totalEngins}</h4>}
            <small className="opacity-75">Engins Total</small>
          </Card.Body>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="stat-card border-0 bg-warning text-dark">
          <Card.Body className="text-center py-3">
            <FaExclamationTriangle className="stat-icon mb-2" />
            {loading ? <Spinner animation="border" size="sm" variant="dark" /> : <h4 className="mb-1">{stats.arretsEnCours}</h4>}
            <small className="opacity-75">Arrêts en Cours</small>
          </Card.Body>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="stat-card border-0 bg-info text-white">
          <Card.Body className="text-center py-3">
            <FaClock className="stat-icon mb-2" />
            {loading ? <Spinner animation="border" size="sm" variant="light" /> : <h4 className="mb-1">{stats.entretiensPrevus}</h4>}
            <small className="opacity-75">Entretiens Prévus</small>
          </Card.Body>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="stat-card border-0 bg-success text-white">
          <Card.Body className="text-center py-3">
            <FaChartLine className="stat-icon mb-2" />
            {loading ? <Spinner animation="border" size="sm" variant="light" /> : <h4 className="mb-1">{stats.productionJour}</h4>}
            <small className="opacity-75">Heures/Jour</small>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );

  const DistributionStats = () => (
    <Row className="mb-4">
      {stats.enginsParProjet.length > 0 && (
        <Col md={6}>
          <Card className="shadow-sm">
            <Card.Header className="bg-light">
              <h6 className="mb-0"><FaChartBar className="me-2" /> Répartition par projet</h6>
            </Card.Header>
            <Card.Body>
              {stats.enginsParProjet.map((item, idx) => (
                <div key={idx} className="mb-2">
                  <div className="d-flex justify-content-between small">
                    <span>{item.projet?.name || `Projet ${item.projet_id}`}</span>
                    <span>{item.count} engins</span>
                  </div>
                  <ProgressBar now={stats.totalEngins > 0 ? (item.count / stats.totalEngins) * 100 : 0} variant="primary" size="sm" />
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
      )}
      {stats.enginsParType.length > 0 && (
        <Col md={6}>
          <Card className="shadow-sm">
            <Card.Header className="bg-light">
              <h6 className="mb-0"><FaCog className="me-2" /> Répartition par type</h6>
            </Card.Header>
            <Card.Body>
              {stats.enginsParType.slice(0, 5).map((item, idx) => (
                <div key={idx} className="mb-2">
                  <div className="d-flex justify-content-between small">
                    <span>{item.type_engin}</span>
                    <span>{item.count} engins</span>
                  </div>
                  <ProgressBar now={stats.totalEngins > 0 ? (item.count / stats.totalEngins) * 100 : 0} variant="info" size="sm" />
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
      )}
    </Row>
  );

  const categories = [
    { key: "all", label: "Tous les modules", icon: FaTachometerAlt },
    { key: "engins", label: "Engins", icon: FaCar },
    { key: "maintenance", label: "Maintenance", icon: FaTools },
    { key: "production", label: "Production", icon: FaCogs },
    { key: "rapports", label: "Rapports", icon: FaChartBar }
  ];

  // Configuration des cartes
  const notesCards = [
    { imageSrc: "https://cdn-icons-png.flaticon.com/128/8046/8046632.png", text: "Gestion des Arrêts", link: "/engin/arretE", category: "maintenance" },
    { imageSrc: "https://cdn-icons-png.flaticon.com/128/9759/9759903.png", text: "Liste des entretiens", link: "/engin/entEngin", category: "maintenance" },
    { imageSrc: "https://cdn-icons-png.flaticon.com/128/9615/9615323.png", text: "Productions des engins", link: "/engin/ProdEngin", category: "production" },
    { imageSrc: "https://cdn-icons-png.flaticon.com/128/10691/10691841.png", text: "Productions des chauffeurs", link: "/production/chauffeur", category: "production" },
    { imageSrc: "https://cdn-icons-png.flaticon.com/128/12730/12730548.png", text: "Fiche de vie", link: "/engin/fiche-vie", category: "maintenance" },
    { imageSrc: "https://cdn-icons-png.flaticon.com/128/3135/3135715.png", text: "Gestion Affectation", link: "/engin/affectation", category: "engins" },
    { imageSrc: "https://cdn-icons-png.flaticon.com/128/3426/3426818.png", text: "Documents Administratifs", link: "/documents/admin", category: "rapports" }
  ];

  const filteredCards = notesCards.filter(card => 
    activeCategory === "all" || card.category === activeCategory
  );

  const filteredBySearch = filteredCards.filter(card =>
    searchTerm === "" || card.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container className="py-4 dashboard-container" style={{ maxWidth: "1500px" }}>
      <div className="text-center mb-4">
        <h3 className="fw-bold text-primary mb-2">🏭 GESTION DU SERVICE ENGIN</h3>
        <p className="text-muted lead">Centre de contrôle pour la gestion de votre parc d'engins</p>
      </div>

      <Row className="mb-4">
        <Col md={6} className="mx-auto">
          <InputGroup>
            <InputGroup.Text className="bg-white"><FaSearch className="text-muted" /></InputGroup.Text>
            <Form.Control 
              type="text" 
              placeholder="Rechercher un module..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="border-start-0" 
            />
          </InputGroup>
        </Col>
      </Row>

      <div className="mb-4">
        <div className="d-flex flex-wrap gap-2 justify-content-center">
          {categories.map(category => (
            <Button 
              key={category.key} 
              variant={activeCategory === category.key ? "primary" : "outline-secondary"} 
              size="sm" 
              onClick={() => setActiveCategory(category.key)} 
              className="rounded-pill px-3"
            >
              <category.icon className="me-1" size={14} /> {category.label}
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          <FaExclamationTriangle className="me-2" /> {error}
          <Button variant="outline-danger" size="sm" className="ms-3" onClick={fetchStats}>Réessayer</Button>
        </Alert>
      )}

      <QuickStats />
      {!loading && stats.totalEngins > 0 && <DistributionStats />}

      {loading && (
        <div className="text-center mb-4">
          <Spinner animation="border" variant="primary" />
          <p className="text-muted mt-2">Chargement des données...</p>
        </div>
      )}

      {!loading && stats.arretsEnCours > 0 && (
        <Alert variant="warning" className="mb-4">
          <FaExclamationTriangle className="me-2" />
          <strong>{stats.arretsEnCours} arrêt(s) en cours</strong> - Intervention requise
        </Alert>
      )}

      <Row className="g-4">
        {filteredBySearch.length > 0 ? (
          filteredBySearch.map((card, index) => (
            <NoteCard key={index} imageSrc={card.imageSrc} text={card.text} link={card.link} />
          ))
        ) : (
          <Col xs={12}>
            <Card className="text-center py-5 border-0">
              <Card.Body>
                <FaSearch size={48} className="text-muted mb-3" />
                <h5 className="text-muted">Aucun module trouvé</h5>
                <p className="text-muted">Aucun résultat pour "{searchTerm}"</p>
                <Button 
                  variant="outline-primary" 
                  onClick={() => { 
                    setSearchTerm(""); 
                    setActiveCategory("all"); 
                  }}
                >
                  Réinitialiser la recherche
                </Button>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>

      <style>{`
        .dashboard-container { 
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); 
          min-height: 100vh; 
        }
        .stat-card { 
          transition: all 0.3s ease; 
          border-radius: 12px; 
          cursor: pointer; 
        }
        .stat-card:hover { 
          transform: translateY(-4px); 
          box-shadow: 0 8px 16px rgba(0,0,0,0.1); 
        }
        .stat-icon { 
          font-size: 1.5rem; 
          opacity: 0.9; 
        }
        .progress-sm { 
          height: 6px; 
          border-radius: 3px; 
        }
        .note-card { 
          transition: all 0.3s ease; 
          border-radius: 12px; 
          background: white;
        }
        .note-card:hover { 
          transform: translateY(-5px); 
          box-shadow: 0 10px 20px rgba(0,0,0,0.15); 
        }
      `}</style>
    </Container>
  );
};

export default MaintenancePage;