import React, { useEffect, useState, useCallback } from "react";

const DRHProcedures = () => {
  const [files, setFiles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ ref: "", file: null });

  // 🚀 Récupérer les fichiers depuis l'API
  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/emailFile/");
      if (!response.ok) throw new Error("Impossible de récupérer les fichiers");

      const data = await response.json();
      setFiles(data);
    } catch (error) {
      setErrorMessage("Erreur lors du chargement des fichiers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // 🎯 Gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.ref || !formData.file) {
      setErrorMessage("Tous les champs sont requis !");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("ref", formData.ref);
    formDataToSend.append("file", formData.file);

    try {
      const response = await fetch("http://localhost:8000/api/emailFile/", {
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) throw new Error("Échec de l'ajout du fichier");

      const newFile = await response.json();
      setFiles((prevFiles) => [...prevFiles, newFile]);

      // ✅ Réinitialisation du formulaire
      setFormData({ ref: "", file: null });
      setShowForm(false);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage("Erreur lors de l'ajout du fichier.");
    }
  };

  // 📂 Gérer la sélection de fichier
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: name === "file" ? files[0] : value,
    }));
  };

  // ❌ Supprimer un fichier
  const handleDelete = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce fichier ?")) return;

    try {
      const response = await fetch(`http://localhost:8000/api/emailFile/${id}/`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Échec de la suppression");

      setFiles((prevFiles) => prevFiles.filter((file) => file.id !== id));
    } catch (error) {
      setErrorMessage("Erreur lors de la suppression du fichier.");
    }
  };

  return (
    <div className="container">
      <h2 className="mb-4 fw-bold text-center" style={{ color: "#333" }}>
        Gestion des procédures
      </h2>

      {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

      <button className="btn btn-primary mb-3" onClick={() => setShowForm(!showForm)}>
        {showForm ? "Fermer le formulaire" : "Ajouter un fichier"}
      </button>

      {/* 📜 Formulaire */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="mb-3">
            <label className="form-label">Référence</label>
            <input
              type="text"
              name="ref"
              value={formData.ref}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Fichier PDF</label>
            <input
              type="file"
              name="file"
              accept="application/pdf"
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          <button type="submit" className="btn btn-success">Envoyer</button>
        </form>
      )}

      {/* 📂 Liste des fichiers */}
      {loading ? (
        <p>Chargement des fichiers...</p>
      ) : files.length === 0 ? (
        <p>Aucun fichier disponible.</p>
      ) : (
        <table className="table table-striped">
          <thead className="table-success">
            <tr>
              <th>Référence</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr key={file.id}>
                <td>{file.ref}</td>
                <td>
                  <a
                    href={`http://localhost:8000${file.file}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-info me-2"
                  >
                    Télécharger
                  </a>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(file.id)}
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DRHProcedures;
