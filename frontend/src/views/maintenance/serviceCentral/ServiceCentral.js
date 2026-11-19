import { useNavigate } from "react-router-dom";
import { CRow, CCol } from "@coreui/react"; // CoreUI components
import { useEffect } from "react";

// Composant NoteCard
const NoteCard = ({ imageSrc, text, link }) => {
  const navigate = useNavigate();

  return (
    <div className="col-sm-5 d-flex justify-content-center">
    <div 
      className="card bg-light mb-3 shadow-sm rounded-3 d-flex align-items-center" 
      style={{ width: "300px", height: "60px" }} // Hauteur et largeur fixes
    >
      <div className="card-body d-flex align-items-center justify-content-center p-0 w-100">
        <button
          onClick={() => navigate(link)}
          className="btn text-white w-100 h-100 d-flex align-items-center justify-content-center gap-2 rounded-4"
          style={{
            background: "#6EC1E4",
            borderColor: "#0056b3",
            transition: "all 0.3s ease-in-out",
            boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.15)",
            fontWeight: "600",
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = "#5BA9D4";
            e.target.style.transform = "scale(1.05)";
            e.target.style.boxShadow = "0px 6px 12px rgba(0, 0, 0, 0.2)";
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = "#6EC1E4";
            e.target.style.transform = "scale(1)";
            e.target.style.boxShadow = "0px 4px 8px rgba(0, 0, 0, 0.15)";
          }}
        >
          <img src={imageSrc} width={40} height={35} alt="Logo" />
          <span className="text-center">{text}</span>
        </button>
      </div>
    </div>
  </div>
);
};

// Composant Dashboard
const Dashboard = () => {
  return (
    <div className="container mt-3 text-center">
      {/* Titre principal */}
      
 <div className="text-center mb-4">
        <h1 className="fw-bold text-primary mb-3">🏭 Gestion des Équipements - Service Centrale</h1>
        <p className="lead text-muted mb-4">Interface simplifiée de maintenance</p>
      </div>


      {/* Liste des documents */}
      <div className="row d-flex justify-content-center">
        <NoteCard imageSrc="https://cdn-icons-png.flaticon.com/128/8046/8046632.png" text="Gestion des arrêts" link="/maintenance/engin" />
        <NoteCard imageSrc="https://cdn-icons-png.flaticon.com/128/9759/9759903.png" text="Liste des entretiens" link="/entretien/listEnt" />

        <NoteCard imageSrc="https://cdn-icons-png.flaticon.com/128/9615/9615323.png" text=" Productions des équipements" link="/production/listProdVoit" />
        <NoteCard imageSrc="https://cdn-icons-png.flaticon.com/128/10691/10691841.png" text="Productions des chauffeurs" link="/production/chauffeur" />
        <NoteCard imageSrc="https://cdn-icons-png.flaticon.com/128/12730/12730548.png" text="Fiche de vie" link="/fiche/avie" />
       
        <NoteCard imageSrc="https://cdn-icons-png.flaticon.com/128/3135/3135715.png" text="Gestion Affectation" link="/projet/affectation" />
      
      <NoteCard imageSrc="https://cdn-icons-png.flaticon.com/128/3426/3426818.png" text="Documents Admistratif" link="/fiche/docE" />
     
      </div>
    </div>
  );
};

export default Dashboard;
