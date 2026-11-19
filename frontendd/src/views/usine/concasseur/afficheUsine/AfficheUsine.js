import React, { useState } from "react";
import { 
  Button, 
  Container, 
  Row, 
  Col, 
  Card, 
  Dropdown,
  Badge
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { 
  FaChartLine, 
  FaProjectDiagram, 
  FaGasPump, 
  FaTools, 
  FaIndustry, 
  FaUsers,
  FaCog,
  FaTachometerAlt,
  FaClipboardList,
  FaUserTie,
  FaExclamationTriangle,
  FaWarehouse
} from "react-icons/fa";

const Dashboard = () => {
  const navigate = useNavigate();
  const [dropdownStates, setDropdownStates] = useState({
    perf: false,
    maint: false,
    usine: false,
    gasoil: false,
    personnel: false,
    arrets: false
  });

  const toggleDropdown = (key) => {
    setDropdownStates(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Données statistiques simulées
  const statsData = {
    personnel: { },
    arrets: {},
    production: { }
  };

  const menuCards = [
    {
      id: 'usine',
      title: 'Production des Usines',
      icon: FaIndustry,
      color: 'info',
      items: [
        { label: '🏗️ Production jornalier', path: '/usine/concasseur/conc' },
        { label: '📈 Rapport de production', path: '/usine/enrobe/enro' }
      ],
      dropup: true // Premier élément - dropdown vers le haut
    },
    {
      id: 'personnel',
      title: 'Gestion du Personnel',
      icon: FaUsers,
      color: 'primary',
      items: [
         
        { label: '👥 Employés usine', path: '/usine/personneUsine' },
       
     
      ],
      badge: statsData.personnel.actifs,
      dropup: true // Deuxième élément - dropdown vers le haut
    },
    {
      id: 'arrets',
      title: 'Gestion des Arrêts',
      icon: FaExclamationTriangle,
      color: 'warning',
      items: [    
        { label: '🚧 Arrêts en Cours', path: '/usine/arretUsine' },
   
        { label: '📈 Historique', path: '/usine/rapportA' }
      ],
      badge: statsData.arrets.enCours,
      dropup: true // Troisième élément - dropdown vers le haut
    },
    {
      id: 'performance',
      title: 'Performances',
      icon: FaChartLine,
      color: 'success',
      items: [
      ,
   { label: '🏗️ List des usine', path: '/usine/anUsine' },
        { label: '📋 Rapports', path: '/performance/rapports' }
      ],
      dropup: false // Les autres s'ouvrent normalement vers le bas
    },
    {
      id: 'maintenance',
      title: 'consomation des pieces',
      icon: FaTools,
      color: 'secondary',
      items: [
        //{ label: ' Interventions', path: '/maintenance/interventions' },
        //{ label: '📅 Planning', path: '/maintenance/planning' },
        { label: '📦🔧  les  Pièces', path: '/usine/anUsine/piece' }
      ],
      dropup: false
    },
    {
      id: 'gasoil',
      title: 'Gestion Gasoil',
      icon: FaGasPump,
      color: 'dark',
      items: [
        { label: '⛽ Approvisionnement', path: '/gasoil/approvisionnement' },
        { label: '📊 Consommations', path: '/gasoil/consommations' },
        { label: '📈 Statistiques', path: '/gasoil/statistiques' }
      ],
      dropup: false
    }
  ];

  return (
    <Container fluid className="dashboard-container py-4 px-4">
      {/* En-tête avec titre et indicateurs */}
      <Row className="mb-4">
        <Col>
          <div className="text-center mb-3">
            <h1 className="dashboard-title mb-2">
              <FaWarehouse className="me-3" />
              Gestion des Usines
            </h1>
            <p className="dashboard-subtitle text-muted">
              Plateforme de gestion intégrée des opérations industrielles
            </p>
          </div>
        </Col>
      </Row>

      {/* Menu principal */}
      <Row className="g-3 justify-content-center">
        {menuCards.map((card, index) => (
          <Col key={card.id} xs={12} sm={6} lg={3} xl={4}>
            <Card className={`menu-card border-0 bg-${card.color}-subtle`}>
              <Card.Body className="text-center p-3">
                <div className="card-icon-wrapper mb-3">
                  <card.icon 
                    size={15} 
                    className={`text-${card.color}`}
                  />
                  {card.badge && (
                    <Badge 
                      bg={card.color} 
                      className="position-absolute top-0 start-100 translate-middle"
                    >
                      {card.badge}
                    </Badge>
                  )}
                </div>
                
                <h6 className="card-title fw-bold mb-3">{card.title}</h6>
                
                {/* Dropdown avec direction conditionnelle */}
                {card.dropup ? (
                  // Dropup pour les trois premières cartes
                  <Dropdown 
                    show={dropdownStates[card.id]} 
                    onToggle={() => toggleDropdown(card.id)}
                    drop="up"
                  >
                    <Dropdown.Toggle 
                      variant={card.color} 
                      size="sm" 
                      className="w-100 dropdown-custom"
                    >
                      <FaCog className="me-2" />
                      Accéder aux modules
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="w-100 dropdown-menu-custom dropup-menu">
                      {card.items.map((item, itemIndex) => (
                        <Dropdown.Item 
                          key={itemIndex}
                          onClick={() => navigate(item.path)}
                          className="dropdown-item-custom"
                        >
                          {item.label}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                ) : (
                  // Dropdown normal pour les autres cartes
                  <Dropdown 
                    show={dropdownStates[card.id]} 
                    onToggle={() => toggleDropdown(card.id)}
                  >
                    <Dropdown.Toggle 
                      variant={card.color} 
                      size="sm" 
                      className="w-100 dropdown-custom"
                    >
                      <FaCog className="me-2" />
                      Accéder aux modules
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="w-100 dropdown-menu-custom">
                      {card.items.map((item, itemIndex) => (
                        <Dropdown.Item 
                          key={itemIndex}
                          onClick={() => navigate(item.path)}
                          className="dropdown-item-custom"
                        >
                          {item.label}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                )}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <style>
        {`
          .dashboard-container {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            min-height: 100vh;
          }

          .dashboard-title {
            color: #2c3e50;
            font-weight: 700;
            font-size: 2.5rem;
          }

          .dashboard-subtitle {
            font-size: 1.1rem;
            font-weight: 300;
          }

          .stat-card {
            background: white;
            border-radius: 15px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
          }

          .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
          }

          .stat-icon {
            font-size: 2.5rem;
          }

          .stat-number {
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 0.5rem;
          }

          .stat-label {
            color: #6c757d;
            font-size: 0.9rem;
            margin-bottom: 0;
          }

          .menu-card {
            border-radius: 15px;
            transition: all 0.3s ease;
            height: 100%;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            position: relative;
          }

          .menu-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          }

          .card-icon-wrapper {
            position: relative;
            display: inline-block;
          }

          .card-title {
            color: #2c3e50;
            font-size: 1rem;
            min-height: 2.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .dropdown-custom {
            border-radius: 10px;
            font-weight: 500;
            border: none;
            padding: 0.5rem 1rem;
          }

          .dropdown-menu-custom {
            border-radius: 10px;
            border: none;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          }

          /* Style spécifique pour les dropup */
          .dropup-menu {
            margin-bottom: 0.5rem;
            transform: translateY(-10px);
          }

          .dropdown-item-custom {
            padding: 0.75rem 1rem;
            border-bottom: 1px solid #f8f9fa;
            transition: all 0.2s ease;
          }

          .dropdown-item-custom:last-child {
            border-bottom: none;
          }

          .dropdown-item-custom:hover {
            background-color: #f8f9fa;
            color: #007bff;
          }

          /* Ajustement pour l'affichage des dropup */
          .dropdown.dropup .dropdown-menu {
            bottom: 100%;
            top: auto;
          }

          @media (max-width: 768px) {
            .dashboard-title {
              font-size: 2rem;
            }
            
            .menu-card {
              margin-bottom: 1rem;
            }

            /* Sur mobile, tous les dropdowns s'ouvrent vers le haut pour plus de confort */
            .dropdown-menu-custom {
              position: fixed;
              bottom: 0;
              left: 50%;
              transform: translateX(-50%);
              width: 90% !important;
              max-width: 300px;
            }
          }

          /* Pour les écrans très petits */
          @media (max-width: 576px) {
            .menu-card {
              margin-bottom: 0.5rem;
            }
            
            .dropdown-custom {
              font-size: 0.8rem;
              padding: 0.4rem 0.8rem;
            }
          }
        `}
      </style>
    </Container>
  );
};

export default Dashboard;