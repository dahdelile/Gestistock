import React, { useState } from "react";
import { Button, Container, Row, Col, Card, Dropdown } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { 
  FaChartLine, 
  FaProjectDiagram, 
  FaGasPump, 
  FaTools, 
  FaIndustry 
} from "react-icons/fa";

const Dashboard = () => {
  const navigate = useNavigate();

  const [dropdownStates, setDropdownStates] = useState({
    perf: false,
  });

  const toggleDropdown = (key) => {
    setDropdownStates(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <Container fluid className="dashboard-container">
      
      {/* Header */}
      <div className="dashboard-header">
        <h2>📊 Gestion des performances des projets et Usines</h2>
        <p className="text-muted">Gestion des performances et projets</p>
      </div>

      {/* Cards */}
      <Row className="g-4 justify-content-center">

        {/* Performances */}
        <Col xs={12} sm={6} md={4} lg={3}>
          <Card className="dashboard-card">
            <div className="icon-wrapper bg-primary">
              <FaChartLine />
            </div>
            <h5>Performances</h5>
            
        

              <Button 
              variant="info" 
              className="w-100"
             onClick={() => navigate("/projet/aPerformance")}
            >
              Accéder
            </Button>
             
          </Card>
        </Col>

        {/* Avancement */}
        <Col xs={12} sm={6} md={4} lg={3}>
          <Card className="dashboard-card">
            <div className="icon-wrapper bg-success">
              <FaProjectDiagram />
            </div>
            <h5>Avancement</h5>
            <Button 
              variant="success" 
              className="w-100"
              onClick={() => navigate("/projet")}
            >
              Accéder
            </Button>
          </Card>
        </Col>

        {/* Maintenance */}
        <Col xs={12} sm={6} md={4} lg={3}>
          <Card className="dashboard-card">
            <div className="icon-wrapper bg-warning">
              <FaTools />
            </div>
            <h5>Gestion Performances</h5>
            <Button 
              variant="warning" 
              className="w-100 text-white"
              onClick={() => navigate("/projet/ajoutProjet")}
            >
              Accéder
            </Button>
          </Card>
        </Col>

        {/* Gasoil */}
        <Col xs={12} sm={6} md={4} lg={3}>
          <Card className="dashboard-card">
            <div className="icon-wrapper bg-danger">
              <FaGasPump />
            </div>
            <h5>Gasoil</h5>
            <Button 
              variant="danger" 
              className="w-100"
              onClick={() => navigate("/gasoil")}
            >
              Accéder
            </Button>
          </Card>
        </Col>

      </Row>

      <style>
        {`
        .dashboard-container {
          min-height: 100vh;
          padding: 40px 20px;
          background: #f8f9fa;
        }

        .dashboard-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .dashboard-card {
          text-align: center;
          padding: 25px 20px;
          border: none;
          border-radius: 15px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.05);
          transition: all 0.3s ease;
          height: 100%;
        }

        .dashboard-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }

        .icon-wrapper {
          width: 55px;
          height: 55px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 20px;
          margin: 0 auto 15px auto;
        }

        h5 {
          margin-bottom: 15px;
          font-weight: 600;
        }
        `}
      </style>
    </Container>
  );
};

export default Dashboard;
