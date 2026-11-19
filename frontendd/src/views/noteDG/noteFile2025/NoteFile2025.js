import React, { useEffect, useState } from "react";

const NoteFile2025 = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2025);

  const API_URL = "http://localhost:8000/note-files/year";

  useEffect(() => {
    fetchFiles(selectedYear);
  }, [selectedYear]);

  const fetchFiles = async (year) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/${year}`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setFiles(data);
      
    } catch (error) {
      console.error("Erreur :", error);
      alert("Impossible de charger les fichiers: " + error.message);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
  };

  const handleDownload = (filename) => {
    if (filename) {
      window.open(`http://localhost:8000/note-download/${filename}`, '_blank');
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Notes DG par Année</h2>
      
      {/* Sélecteur d'année */}
      <div className="mb-4">
        <div className="btn-group">
          {[2023, 2024, 2025, 2026].map(year => (
            <button
              key={year}
              className={`btn ${selectedYear === year ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleYearChange(year)}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      {loading ? (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Objet</th>
                <th>Date</th>
                <th>Fichier</th>
              </tr>
            </thead>
            <tbody>
              {files.map(file => (
                <tr key={file.id}>
                  <td>{file.ref}</td>
                  <td>{file.object}</td>
                  <td>{new Date(file.date).toLocaleDateString('fr-FR')}</td>
                  <td>
                    {file.file && (
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleDownload(file.file)}
                      >
                        Télécharger
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default NoteFile2025;