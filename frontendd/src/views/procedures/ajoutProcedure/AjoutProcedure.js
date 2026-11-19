import React, { useEffect, useState } from "react";

const DRHProcedures = () => {
  const [files, setFiles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingFile, setEditingFile] = useState(null); // Etat pour gérer l'édition

  // Données du formulaire
  const [formData, setFormData] = useState({
    description: "",
    date: "",
    file: null,
    category: "", // Catégorie initiale par défaut
  });

  // Récupérer les fichiers en fonction de la catégorie
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8000/api/procedures/?category=${formData.category}`);
        if (!response.ok) throw new Error("Impossible de récupérer les fichiers");
  
        const data = await response.json();
        console.log(data); // Affiche la réponse dans la console pour vérifier
        setFiles(data);
      } catch (error) {
        setErrorMessage("Une erreur est survenue lors du chargement des fichiers.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchFiles();
  }, [formData.category]); // Rafraîchit les fichiers lorsque la catégorie change
  // Rafraîchit les fichiers lorsque la catégorie change

  // Gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.description || !formData.date || (!formData.file && !editingFile)) {
      setErrorMessage("Tous les champs sont requis !");
      return;
    }

    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      formDataToSend.append(key, formData[key]);
    });

    try {
      let response;
      if (editingFile) {
        // Si on est en mode édition
        response = await fetch(`http://localhost:8000/api/procedures/${editingFile.id}/`, {
          method: "PUT",
          body: formDataToSend,
        });
      } else {
        // Sinon, ajouter un nouveau fichier
        response = await fetch("http://localhost:8000/api/procedures/", {
          method: "POST",
          body: formDataToSend,
        });
      }

      if (!response.ok) {
        const error = await response.json();
        setErrorMessage(error.error || "Échec de l'ajout du fichier");
        return;
      }

      const newFile = await response.json();
      if (editingFile) {
        // Mise à jour de la liste des fichiers après modification
        setFiles((prevFiles) =>
          prevFiles.map((file) => (file.id === newFile.id ? newFile : file))
        );
      } else {
        // Ajouter le nouveau fichier à la liste
        setFiles((prevFiles) => [...prevFiles, newFile]);
      }

      // Réinitialisation du formulaire
      setShowForm(false);
      setFormData({ description: "", date: "", file: null, category: "" });
      setEditingFile(null); // Réinitialiser l'état de l'édition
      setErrorMessage("");
    } catch (error) {
      setErrorMessage("Une erreur s'est produite lors de l'ajout du fichier.");
    }
  };

  // Gérer le changement dans les champs du formulaire
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: name === "file" ? files[0] : value,
    }));
  };

  // Gérer la modification d'un fichier
  const handleEdit = (file) => {
    setEditingFile(file);
    setFormData({
      description: file.description,
      date: file.date,
      file: null, // Ne pas changer le fichier lors de l'édition
      category: file.category,
    });
    setShowForm(true);
  };

  // Gérer la suppression d'un fichier
  const handleDelete = async (fileId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce fichier ?")) {
      try {
        const response = await fetch(`http://localhost:8000/api/procedures/${fileId}/`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Échec de la suppression du fichier");

        setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
      } catch (error) {
        setErrorMessage("Une erreur est survenue lors de la suppression du fichier.");
      }
    }
  };

  return (
    <div className="container">
      <h2 className="mb-4 fw-bold text-center" style={{ color: "#333" }}>
        <img
          src="/src/assets/images/commercial.png"
          width={50}
          height={50}
          alt="Logo"
          className="ms-3 align-middle"
        />
        Gestion des procédures 
      </h2>

      {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

      <button className="btn btn-primary mb-3" onClick={() => setShowForm(!showForm)}>
        {showForm ? "Fermer le formulaire" : editingFile ? "Modifier le fichier" : "Ajouter un fichier"}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="mb-3">
            <label className="form-label">Description</label>
            <input
              type="text"
              name="description"
              value={formData.description}
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
            <label className="form-label">Catégorie</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="form-control"
              required
            >
              <option value="RCF">RCF</option>
              <option value="DRH">DRH</option>
              <option value="DCG">DCG</option>
              <option value="DG">DG</option>
              <option value="DAA">DAA</option>
              <option value="DT">DT</option>
              <option value="DM">DM</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Fichier PDF</label>
            <input
              type="file"
              name="file"
              accept="application/pdf"
              onChange={handleChange}
              className="form-control"
              required={!editingFile} // Ne pas exiger un fichier lors de l'édition
            />
          </div>

          <button type="submit" className="btn btn-success">
            {editingFile ? "Mettre à jour" : "Envoyer"}
          </button>
        </form>
      )}

      {loading ? (
        <p>Chargement des fichiers...</p>
      ) : files.length === 0 ? (
        <p>Aucun fichier disponible.</p>
      ) : (
        <table className="table table-striped">
          <thead className="table-success">
            <tr>
              <th>Description</th>
              <th>Date</th>
              <th>Catégorie</th>
              <th>Fichier</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr key={file.id}>
                <td>{file.description}</td>
                <td>{new Date(file.date).toLocaleDateString()}</td>
                <td>{file.category}</td>
                <td>
                  <a href={`http://localhost:8000${file.file}`} target="_blank" rel="noopener noreferrer">
                    <img src="/src/assets/images/pdf.png" width={30} height={30} alt="PDF" className="me-2" />
                    Télécharger
                  </a>
                </td>
                <td>
                  <button onClick={() => handleEdit(file)} className="btn btn-warning me-2">
                    Modifier
                  </button>
                  <button onClick={() => handleDelete(file.id)} className="btn btn-danger">
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
