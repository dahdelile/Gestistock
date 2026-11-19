import { useNavigate } from 'react-router-dom';

const NoteCard = ({ year, imageSrc, text, link }) => {
  const navigate = useNavigate();
  return (
    <div className="col-sm-4 d-flex justify-content-center">
      <div className="card bg-light mb-3 shadow-sm">
        <div className="card-body text-center">
          <button
            onClick={() => navigate(link)}
            className="btn btn-lg w-100 text-white"
            style={{
              backgroundColor: "#6EC1E4",
              borderColor: "#0056b3",
              transition: "0.3s",
              boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#5BA9D4")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#6EC1E4")}
          >
            <img
              src={imageSrc}
              width={30}
              height={30}
              alt="Logo"
              className="ms-3 align-middle"
            />
            {text} {year}
          </button>
        </div>
      </div>
    </div>
  );
};

const NoteDGPage = () => {
  return (
    <div className="container mt-3 text-center">
      {/* Titre centré */}
      <h2 className="mb-4" style={{ fontWeight: "bold", color: "#333" }}>
        <img
          src="/src/assets/images/stamp.png"
          width={50}
          height={50}
          alt="Logo"
          className="ms-3 align-middle"
        />
        Les documents Projets et DT
      </h2>

      <div className="row d-flex justify-content-center">
        {/* Note 2024 */}
        <NoteCard
         
          imageSrc="/src/assets/images/work.png"
          text="Les document TD"
          link="/documents/dtDoc"
        />
        {/* Note 2025 */}
        <NoteCard
         
          imageSrc="/src/assets/images/success.png"
          text="Les documents projets"
          link="/documents/dProjet"
        />
      </div>
    </div>
  );
};

export default NoteDGPage;
