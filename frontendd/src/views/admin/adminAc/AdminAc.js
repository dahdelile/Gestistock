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
      <h2 className="mb-4 fw-bold" style={{ color: "#333" }}>
        <img
          src="/src/assets/images/admin.png"
          width={50}
          height={50}
          alt="Logo"
          className="ms-3 align-middle"
        />
        La page Admistration
      </h2>

      {/* Liste des documents */}
      <div className="row d-flex justify-content-center">
        <NoteCard imageSrc="/src/assets/images/cc.JPG " text="Gestion des utilisateurs" link="/admin/gestion" />
        <NoteCard imageSrc="/src/assets/images/stamp.png" text="Gestion de Procedures " link="/procedures/ajoutProcedure" />

        <NoteCard imageSrc="/src/assets/images/n.png" text="gestion des notes" link="/noteDG/noteAddF" />
        <NoteCard imageSrc="/src/assets/images/project.png" text="gestion de projets" link="/projet/ajoutProjet" />
      </div>
    </div>
  );
};

export default Dashboard;
