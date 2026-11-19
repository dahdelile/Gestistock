import React, { useEffect, useState } from "react";

const DPdocument = () => {
  const [files, setFiles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    objet: "",
    date: "",
    file: null,
    category: "DG",
  });

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/docs/?category=DG`);
      if (!response.ok) throw new Error("Impossible de récupérer les fichiers");
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      setErrorMessage("Une erreur est survenue lors du chargement des fichiers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.objet || !formData.date || !formData.file) {
      setErrorMessage("Tous les champs sont requis !");
      return;
    }

    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key]) formDataToSend.append(key, formData[key]);
    });

    try {
      const response = await fetch("http://localhost:8000/api/docs/", {
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) {
        const error = await response.json();
        setErrorMessage(error.error || "Échec de l'ajout du fichier");
        return;
      }

      fetchFiles();
      resetForm();
    } catch (error) {
      setErrorMessage("Une erreur s'est produite lors de l'ajout du fichier.");
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: name === "file" ? files[0] : value,
    }));
  };

  const resetForm = () => {
    setShowForm(false);
    setFormData({ objet: "", date: "", file: null, category: "DG" });
    setErrorMessage("");
  };

  return (
    <div className="container">
      <h2 className="mb-4 fw-bold text-center" style={{ color: "#333" }}>
        <img src="/src/assets/images/commercial.png" width={50} height={50} alt="Logo" className="ms-3 align-middle" />
        Documents des Projets
      </h2>

      {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

      <button className="btn btn-primary mb-3" onClick={() => setShowForm(!showForm)}>
        {showForm ? "Fermer le formulaire" : "Ajouter un fichier"}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="mb-3">
            <label className="form-label">Objet</label>
            <input type="text" name="objet" value={formData.objet} onChange={handleChange} className="form-control" required />
          </div>

          <div className="mb-3">
            <label className="form-label">Date</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} className="form-control" required />
          </div>

          <div className="mb-3">
            <label className="form-label">Fichier PDF</label>
            <input type="file" name="file" accept="application/pdf" onChange={handleChange} className="form-control" required />
          </div>

          <button type="submit" className="btn btn-success">Envoyer</button>
        </form>
      )}

      {loading ? (
        <p>Chargement des fichiers...</p>
      ) : files.length === 0 ? (
        <p>Aucun fichier disponible.</p>
      ) : (
        <table className="table table-striped">
          <thead className="table-dark">
            <tr>
              <th>Objet</th>
              <th>Date</th>
              <th>Fichier</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr key={file.id}>
                <td>{file.objet}</td>
                <td>{new Date(file.date).toLocaleDateString()}</td>
                <td>
                  <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                    <img src="/src/assets/images/pdf.png" width={30} height={30} alt="PDF" className="me-2" />
                    Télécharger
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DPdocument;
