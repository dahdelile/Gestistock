import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Button } from "react-bootstrap";

// Composant NoteCard
const NoteCard = ({ imageSrc, text, link }) => {
  const navigate = useNavigate();
  const [hover, setHover] = useState(false);

  const buttonStyle = {
    backgroundColor: hover ? "#5BA9D4" : "#6EC1E4",
    borderColor: "#0056b3",
    boxShadow: hover
      ? "0px 6px 12px rgba(0, 0, 0, 0.2)"
      : "0px 4px 8px rgba(0, 0, 0, 0.15)",
    fontWeight: 600,
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
    borderRadius: "1rem",
    transition: "all 0.3s ease-in-out",
    color: "white",
    padding: "0.5rem 1rem",
  };

  return (
    <Col xs={12} sm={6} md={5} className="d-flex justify-content-center mb-4">
      <div
        className="card bg-light shadow-sm rounded-3 d-flex align-items-center"
        style={{ width: "100%", maxWidth: "420px", height: "90px" }}
      >
        <div className="card-body d-flex align-items-center justify-content-center p-0 w-100">
          <Button
            aria-label={`Accéder à ${text}`}
            style={buttonStyle}
            onClick={() => navigate(link)}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          >
            <img src={imageSrc} width={80} height={50} alt={`${text} icon`} />
            <span
              className="text-center"
              style={{ fontSize: "1.4rem", fontWeight: "bold" }}
            >
              {text}
            </span>
          </Button>
        </div>
      </div>
    </Col>
  );
};

// Composant principal GestionMaintenaces
const GestionMaintenaces = () => {
  return (
    <Container className="mt-4 text-center">
     <h2
  className="fw-bold d-flex align-items-center justify-content-center flex-wrap text-primary"
  style={{
    fontSize: "2.5rem",
    marginBottom: "7rem", // 🔼 Augmenté ici
    gap: "1rem",
  }}
>
  <img
    src="https://cdn-icons-png.flaticon.com/128/11855/11855976.png"
    width={100}
    height={60}
    alt="Maintenance Icon"
    className="me-2"
  />
  Gestion de la Maintenance
</h2>


      <Row className="justify-content-center">
        <NoteCard
          imageSrc="https://cdn-icons-png.flaticon.com/128/10559/10559181.png"
          text="Gestion Service Central"
          link="/maintenance/serviceCentral"
        />
        <NoteCard
          imageSrc="https://cdn-icons-png.flaticon.com/128/1008/1008110.png"
          text="Gestion Engins"
          link="/engin/serviceEngin"
        />
      
        <NoteCard
          imageSrc="https://cdn-icons-png.flaticon.com/128/1768/1768096.png"
          text="Gestion Pneumatique"
          link="/pneus/consPneu"
        />
          <NoteCard
          imageSrc="https://cdn-icons-png.flaticon.com/128/3256/3256148.png"
          text="LES USINES"
          link="/usine/concasseur/afficheUsine"
        />
      </Row>
      
    </Container>
  );
};

export default GestionMaintenaces;
