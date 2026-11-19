import React, { useEffect, useState } from "react";

// ✅ URL de base cohérente
const API_BASE = "http://localhost:8000/api";

const NoteFile2025 = () => {
  const [files, setFiles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState({
    ref: "",
    object: "",
    date: "",
    file: null,
  });
  const [editingFileId, setEditingFileId] = useState(null);

  // Charger les fichiers
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch(`${API_BASE}/files/`);
        if (!response.ok) throw new Error("Échec du chargement des fichiers");
        const data = await response.json();
        setFiles(data);
      } catch (error) {
        console.error("Erreur :", error);
        setErrorMessage("Impossible de charger les fichiers.");
      }
    };
    fetchFiles();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "file" ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation : fichier requis seulement à la création
    if (!formData.file && !editingFileId) {
      setErrorMessage("Veuillez sélectionner un fichier PDF.");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("ref", formData.ref);
    formDataToSend.append("object", formData.object);
    formDataToSend.append("date", formData.date);
    if (formData.file) {
      formDataToSend.append("file", formData.file);
    }

    try {
      let response;
      if (editingFileId) {
        // Modification
        response = await fetch(`${API_BASE}/files/${editingFileId}/`, {
          method: "PUT",
          body: formDataToSend,
        });
        if (!response.ok) throw new Error("Échec de la modification");
        const updatedFile = await response.json();
        setFiles((prev) =>
          prev.map((f) => (f.id === updatedFile.id ? updatedFile : f))
        );
        setSuccessMessage("✅ Fichier modifié avec succès !");
      } else {
        // Création
        response = await fetch(`${API_BASE}/files/`, {
          method: "POST",
          body: formDataToSend,
        });
        if (!response.ok) throw new Error("Échec de l'ajout");
        const newFile = await response.json();
        setFiles((prev) => [...prev, newFile]);
        setSuccessMessage("✅ Fichier ajouté avec succès !");
      }

      // Réinitialiser
      setShowForm(false);
      setFormData({ ref: "", object: "", date: "", file: null });
      setEditingFileId(null);
      setErrorMessage("");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Erreur :", error);
      setErrorMessage(
        editingFileId
          ? "Erreur lors de la modification du fichier."
          : "Erreur lors de l'ajout du fichier."
      );
    }
  };

  const handleEdit = (file) => {
    setFormData({
      ref: file.ref || "",
      object: file.object || "",
      date: file.date ? file.date.split("T")[0] : "", // format YYYY-MM-DD
      file: null,
    });
    setEditingFileId(file.id);
    setShowForm(true);
    setErrorMessage("");
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce fichier ?")) return;

    try {
      // ✅ URL CORRIGÉE : plus de /app2025
      const response = await fetch(`${API_BASE}/files/${fileId}/`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Échec de la suppression");

      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      setSuccessMessage("✅ Fichier supprimé avec succès !");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Erreur suppression :", error);
      setErrorMessage("Erreur lors de la suppression du fichier.");
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4 fw-bold text-center" style={{ color: "#333" }}>
        <img
          src="/src/assets/images/n.png"
          width={50}
          height={50}
          alt="Logo"
          className="ms-3 align-middle"
        />
        Gestion des Notes
      </h2>

      {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      <button
        className="btn btn-primary mb-3"
        onClick={() => {
          setShowForm(!showForm);
          setEditingFileId(null);
          setFormData({ ref: "", object: "", date: "", file: null });
          setErrorMessage("");
        }}
      >
        {showForm ? "Fermer le formulaire" : "Ajouter une note"}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-3 border rounded bg-light">
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
            <label className="form-label">Objet</label>
            <input
              type="text"
              name="object"
              value={formData.object}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
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
              required={!editingFileId} // ← Seulement requis à la création
            />
            {editingFileId && (
              <small className="text-muted d-block mt-1">
                Laissez vide pour conserver le fichier actuel.
              </small>
            )}
          </div>

          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-success">
              {editingFileId ? "Modifier" : "Envoyer"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowForm(false)}
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <table className="table table-striped">
        <thead className="table-dark">
          <tr>
            <th>Référence</th>
            <th>Objet</th>
            <th>Date</th>
            <th>Fichier</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {files.length > 0 ? (
            files.map((file) => (
              <tr key={file.id}>
                <td>{file.ref}</td>
                <td>{file.object}</td>
                <td>{new Date(file.date).toLocaleDateString("fr-FR")}</td>
                <td>
                  {file.file ? (
                    <a
                      href={file.file.startsWith("http") ? file.file : `${API_BASE.replace('/api', '')}${file.file}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="d-flex align-items-center text-decoration-none"
                    >
                      <img
                        src="/src/assets/images/pdf.png"
                        width={30}
                        height={30}
                        alt="PDF"
                        className="me-2"
                      />
                      Télécharger
                    </a>
                  ) : (
                    <em>Aucun fichier</em>
                  )}
                </td>
                <td>
                  <button
                    className="btn btn-warning btn-sm me-1"
                    onClick={() => handleEdit(file)}
                  >
                    Modifier
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(file.id)}
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center">
                Aucune note disponible.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default NoteFile2025;