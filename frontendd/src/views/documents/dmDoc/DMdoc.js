import React, { useEffect, useState, useCallback } from "react";
import { 
  FaEye, FaFilePdf, FaDownload, FaTrash, FaEdit, 
  FaSearch, FaCalendar, FaTag, FaPlusCircle, FaFolderOpen,
  FaExclamationTriangle, FaCheckCircle, FaSpinner,
  FaExternalLinkAlt, FaSave, FaTimes, FaInfoCircle,
  FaSort, FaSortUp, FaSortDown
} from "react-icons/fa";

const DMdocument = () => {
  const [files, setFiles] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [editingDocument, setEditingDocument] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [deleteLoading, setDeleteLoading] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'descending' });
  
  const [formData, setFormData] = useState({
    objet: "",
    date: new Date().toISOString().split('T')[0],
    file: null,
    category: "DM",
  });

  const [editFormData, setEditFormData] = useState({
    objet: "",
    date: "",
    category: "",
    file: null,
  });

  // 🔹 URLs de production HARDCODÉES - Solution fiable ✅
  const API_URL = "https://intranet-attm.com/api/documents";
  const BASE_API_URL = "https://intranet-attm.com/api";

  // Fonction pour générer une clé unique
  const generateUniqueKey = (item, index) => {
    return item.id ? `doc-${item.id}` : `doc-${index}-${Date.now()}`;
  };

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const response = await fetch(`${API_URL}?category=DM`);
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: Impossible de récupérer les fichiers`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        const documents = result.data || [];
        const uniqueDocuments = [];
        const seenIds = new Set();
        
        documents.forEach(doc => {
          if (doc.id && !seenIds.has(doc.id)) {
            seenIds.add(doc.id);
            uniqueDocuments.push({
              ...doc,
              file_url: doc.file_url || `${BASE_API_URL}/documents/${doc.id}/download`
            });
          }
        });
        
        setFiles(uniqueDocuments);
      } else {
        setFiles([]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      setErrorMessage("Une erreur est survenue lors du chargement des fichiers.");
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // GESTION AJOUT
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setAddLoading(true);

    if (!formData.objet || !formData.date || !formData.file) {
      setErrorMessage("Tous les champs sont requis !");
      setAddLoading(false);
      return;
    }

    if (formData.file.size > 2 * 1024 * 1024) {
      setErrorMessage("Le fichier ne doit pas dépasser 2MB.");
      setAddLoading(false);
      return;
    }

    if (formData.file.type !== 'application/pdf') {
      setErrorMessage("Seuls les fichiers PDF sont acceptés.");
      setAddLoading(false);
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("objet", formData.objet);
    formDataToSend.append("date", formData.date);
    formDataToSend.append("category", formData.category);
    formDataToSend.append("file", formData.file);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: formDataToSend,
      });

      const result = await response.json();
      
      if (!response.ok) {
        let errorMsg = "Échec de l'ajout du document";
        if (result.message) {
          errorMsg = result.message;
        } else if (result.errors) {
          errorMsg = Object.values(result.errors).flat().join(', ');
        }
        setErrorMessage(errorMsg);
        setAddLoading(false);
        return;
      }

      if (result.success) {
        setSuccessMessage("Document ajouté avec succès !");
        fetchFiles();
        closeAddModal();
      } else {
        setErrorMessage(result.message || "Échec de l'ajout du document");
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
      setErrorMessage("Une erreur réseau s'est produite. Vérifiez votre connexion.");
    } finally {
      setAddLoading(false);
    }
  };

  // GESTION MODIFICATION
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setEditLoading(true);

    if (!editFormData.objet || !editFormData.date || !editFormData.category) {
      setErrorMessage("Tous les champs sont requis !");
      setEditLoading(false);
      return;
    }

    const dataToSend = new FormData();
    dataToSend.append("objet", editFormData.objet);
    dataToSend.append("date", editFormData.date);
    dataToSend.append("category", editFormData.category);
    
    // Ajouter le fichier seulement si un nouveau est fourni
    if (editFormData.file) {
      if (editFormData.file.size > 2 * 1024 * 1024) {
        setErrorMessage("Le nouveau fichier ne doit pas dépasser 2MB.");
        setEditLoading(false);
        return;
      }
      if (editFormData.file.type !== 'application/pdf') {
        setErrorMessage("Seuls les fichiers PDF sont acceptés.");
        setEditLoading(false);
        return;
      }
      dataToSend.append("file", editFormData.file);
    }

    try {
      const response = await fetch(`${API_URL}/${editingDocument.id}`, {
        method: "PUT",
        body: editFormData.file ? dataToSend : JSON.stringify(editFormData),
        headers: editFormData.file ? {} : {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        let errorMsg = "Échec de la modification du document";
        if (result.message) {
          errorMsg = result.message;
        } else if (result.errors) {
          errorMsg = Object.values(result.errors).flat().join(', ');
        }
        setErrorMessage(errorMsg);
        setEditLoading(false);
        return;
      }

      if (result.success) {
        setSuccessMessage("Document modifié avec succès !");
        fetchFiles();
        closeEditModal();
      } else {
        setErrorMessage(result.message || "Échec de la modification");
      }
    } catch (error) {
      console.error("Erreur lors de la modification:", error);
      setErrorMessage("Une erreur réseau s'est produite. Vérifiez votre connexion.");
    } finally {
      setEditLoading(false);
    }
  };

  // GESTION SUPPRESSION
  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.")) {
      return;
    }

    setDeleteLoading(prev => ({ ...prev, [id]: true }));

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || "Erreur lors de la suppression");
      }

      if (result.success) {
        setSuccessMessage("Document supprimé avec succès !");
        setFiles(prev => prev.filter(file => file.id !== id));
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      setErrorMessage("Erreur lors de la suppression du document.");
    } finally {
      setDeleteLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  // GESTION TÉLÉCHARGEMENT
  const handleDownload = async (id, objet, fileName) => {
    try {
      const response = await fetch(`${BASE_API_URL}/documents/${id}/download`);
      
      if (!response.ok) {
        throw new Error("Erreur lors du téléchargement");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${objet || 'document'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      setErrorMessage("Erreur lors du téléchargement du fichier.");
    }
  };

  // ✅ Voir PDF - Utiliser la route de téléchargement avec affichage inline
  const handleView = (id) => {
    // Utilise la route /download qui retourne le fichier PDF
    window.open(`${BASE_API_URL}/documents/${id}/download`, '_blank');
  };

  // HANDLERS POUR LES FORMULAIRES
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: name === "file" ? files[0] : value,
    }));
  };

  const handleEditChange = (e) => {
    const { name, value, files } = e.target;
    setEditFormData((prevData) => ({
      ...prevData,
      [name]: name === "file" ? files[0] : value,
    }));
  };

  // MODALS
  const openAddModal = () => {
    setFormData({
      objet: "",
      date: new Date().toISOString().split('T')[0],
      file: null,
      category: "DM",
    });
    setErrorMessage("");
    setSuccessMessage("");
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setFormData({
      objet: "",
      date: new Date().toISOString().split('T')[0],
      file: null,
      category: "DM",
    });
    setErrorMessage("");
  };

  const openEditModal = (document) => {
    setEditingDocument(document);
    setEditFormData({
      objet: document.objet,
      date: document.date?.split('T')[0] || '',
      category: document.category,
      file: null,
    });
    setErrorMessage("");
    setSuccessMessage("");
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingDocument(null);
    setEditFormData({
      objet: "",
      date: "",
      category: "",
      file: null,
    });
    setErrorMessage("");
  };

  const openViewModal = (document) => {
    setSelectedDocument(document);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedDocument(null);
  };

  // UTILITAIRES
  const formatDate = (dateString) => {
    try {
      if (!dateString) return "Date non disponible";
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return "Date invalide";
    }
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="ms-1 opacity-50" />;
    if (sortConfig.direction === 'ascending') return <FaSortUp className="ms-1" />;
    return <FaSortDown className="ms-1" />;
  };

  // Filtrer et trier les documents
  const filteredAndSortedFiles = React.useMemo(() => {
    const filtered = files.filter(file => 
      file.objet && (
        file.objet.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatDate(file.date).includes(searchTerm) ||
        (file.category && file.category.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    );

    return filtered.sort((a, b) => {
      if (sortConfig.key === 'date') {
        const dateA = new Date(a.date || 0);
        const dateB = new Date(b.date || 0);
        return sortConfig.direction === 'ascending' ? dateA - dateB : dateB - dateA;
      }
      
      if (sortConfig.key === 'objet') {
        const compare = (a.objet || '').localeCompare(b.objet || '');
        return sortConfig.direction === 'ascending' ? compare : -compare;
      }
      
      if (sortConfig.key === 'category') {
        const compare = (a.category || '').localeCompare(b.category || '');
        return sortConfig.direction === 'ascending' ? compare : -compare;
      }
      
      return 0;
    });
  }, [files, searchTerm, sortConfig]);

  // Fonction pour obtenir le nom du fichier à partir du chemin
  const getFileNameFromPath = (filePath) => {
    if (!filePath) return 'Fichier non disponible';
    const parts = filePath.split('/');
    return parts[parts.length - 1];
  };

  return (
    <div className="container-fluid mt-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm" style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}>
            <div className="card-body p-4">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <div className="d-flex align-items-center">
                    <div className="rounded-3 p-3 me-3" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                      <FaFolderOpen className="text-white fs-1" />
                    </div>
                    <div>
                      <h1 className="h2 mb-1 fw-bold text-white">Documents DM</h1>
                      <p className="mb-0 opacity-75">Gestion des documents administratifs</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 text-md-end">
                  <button 
                    className="btn btn-light px-4 fw-bold"
                    onClick={openAddModal}
                    style={{ color: '#764ba2' }}
                  >
                    <FaPlusCircle className="me-2" />
                    Nouveau Document
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages d'alerte */}
      <div className="row mb-4">
        <div className="col-12">
          {errorMessage && (
            <div className="alert alert-danger alert-dismissible fade show shadow-sm" role="alert">
              <FaExclamationTriangle className="me-2" />
              {errorMessage}
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setErrorMessage("")}
              ></button>
            </div>
          )}
          
          {successMessage && (
            <div className="alert alert-success alert-dismissible fade show shadow-sm" role="alert">
              <FaCheckCircle className="me-2" />
              {successMessage}
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setSuccessMessage("")}
              ></button>
            </div>
          )}
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <div className="row g-3 align-items-center">
                <div className="col-md-8">
                  <div className="input-group input-group-lg">
                    <span className="input-group-text bg-light border-0">
                      <FaSearch />
                    </span>
                    <input
                      type="text"
                      className="form-control border-0 shadow-none"
                      placeholder="Rechercher par objet, date ou catégorie..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ fontSize: '0.95rem' }}
                    />
                  </div>
                </div>
                <div className="col-md-4 text-end">
                  <span className="badge bg-primary fs-6 px-3 py-2">
                    <FaFilePdf className="me-1" />
                    {filteredAndSortedFiles.length} document{filteredAndSortedFiles.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des documents */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}} role="status">
                    <span className="visually-hidden">Chargement...</span>
                  </div>
                  <p className="mt-3 text-muted">Chargement des documents...</p>
                </div>
              ) : filteredAndSortedFiles.length === 0 ? (
                <div className="text-center py-5">
                  <FaFolderOpen className="text-muted mb-3" style={{fontSize: '4rem'}} />
                  <h4 className="mt-3 text-muted">Aucun document trouvé</h4>
                  <p className="text-muted mb-4">
                    {searchTerm ? `Aucun résultat pour "${searchTerm}"` : 'Commencez par ajouter un document'}
                  </p>
                  {!searchTerm && (
                    <button className="btn btn-primary px-4" onClick={openAddModal}>
                      <FaPlusCircle className="me-2" />
                      Ajouter un document
                    </button>
                  )}
                  {searchTerm && (
                    <button className="btn btn-outline-secondary" onClick={() => setSearchTerm('')}>
                      Effacer la recherche
                    </button>
                  )}
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{width: '5%'}} className="text-center">#</th>
                        <th style={{width: '40%'}}>
                          <button 
                            className="btn btn-link p-0 text-decoration-none text-dark fw-bold"
                            onClick={() => handleSort('objet')}
                          >
                            Objet
                            {getSortIcon('objet')}
                          </button>
                        </th>
                        <th style={{width: '20%'}}>
                          <button 
                            className="btn btn-link p-0 text-decoration-none text-dark fw-bold"
                            onClick={() => handleSort('date')}
                          >
                            Date
                            {getSortIcon('date')}
                          </button>
                        </th>
                        <th style={{width: '15%'}}>
                          <button 
                            className="btn btn-link p-0 text-decoration-none text-dark fw-bold"
                            onClick={() => handleSort('category')}
                          >
                            Type
                            {getSortIcon('category')}
                          </button>
                        </th>
                        <th style={{width: '20%'}} className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedFiles.map((file, index) => (
                        <tr key={generateUniqueKey(file, index)}>
                          <td className="text-center fw-bold text-muted">{index + 1}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <FaFilePdf className="text-danger fs-5 me-2" />
                              <div>
                                <strong>{file.objet}</strong>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <FaCalendar className="text-primary me-2" />
                              <span>{formatDate(file.date)}</span>
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-primary px-3 py-2">
                              <FaTag className="me-1" />
                              {file.category || 'DM'}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex justify-content-center gap-2">
                              <button
                                className="btn btn-sm btn-outline-primary rounded-circle"
                                onClick={() => openViewModal(file)}
                                title="Voir les détails"
                                style={{ width: '36px', height: '36px' }}
                              >
                                <FaEye />
                              </button>
                              <button
                                className="btn btn-sm btn-outline-success rounded-circle"
                                onClick={() => handleDownload(file.id, file.objet, file.file)}
                                title="Télécharger"
                                style={{ width: '36px', height: '36px' }}
                              >
                                <FaDownload />
                              </button>
                              <button
                                className="btn btn-sm btn-outline-warning rounded-circle"
                                onClick={() => openEditModal(file)}
                                title="Modifier"
                                style={{ width: '36px', height: '36px' }}
                              >
                                <FaEdit />
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger rounded-circle"
                                onClick={() => handleDelete(file.id)}
                                disabled={deleteLoading[file.id]}
                                title="Supprimer"
                                style={{ width: '36px', height: '36px' }}
                              >
                                {deleteLoading[file.id] ? (
                                  <span className="spinner-border spinner-border-sm"></span>
                                ) : (
                                  <FaTrash />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL D'AJOUT */}
      {showAddModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title d-flex align-items-center">
                  <FaPlusCircle className="me-2" />
                  Ajouter un nouveau document
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={closeAddModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-bold">Objet du document *</label>
                    <input 
                      type="text" 
                      name="objet" 
                      value={formData.objet} 
                      onChange={handleChange} 
                      className="form-control" 
                      placeholder="Ex: Rapport annuel 2024"
                      required 
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Date *</label>
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
                    <label className="form-label fw-bold">Fichier PDF *</label>
                    <input 
                      type="file" 
                      name="file" 
                      accept=".pdf,application/pdf" 
                      onChange={handleChange} 
                      className="form-control" 
                      required 
                    />
                    <div className="form-text">
                      Taille maximum: 2MB. Format accepté: PDF uniquement.
                    </div>
                  </div>
                  <div className="alert alert-info">
                    <div className="d-flex">
                      <FaInfoCircle className="me-2 mt-1" />
                      <div>
                        <strong>Note :</strong> Ce document sera automatiquement classé dans la catégorie "DM"
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeAddModal}>
                    <FaTimes className="me-1" />
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={addLoading}>
                    {addLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Ajout en cours...
                      </>
                    ) : (
                      <>
                        <FaPlusCircle className="me-1" />
                        Ajouter le document
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE MODIFICATION */}
      {showEditModal && editingDocument && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-warning text-white">
                <h5 className="modal-title d-flex align-items-center">
                  <FaEdit className="me-2" />
                  Modifier le document
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={closeEditModal}></button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-bold">Objet du document *</label>
                    <input 
                      type="text" 
                      name="objet" 
                      value={editFormData.objet} 
                      onChange={handleEditChange} 
                      className="form-control" 
                      required 
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Date *</label>
                    <input 
                      type="date" 
                      name="date" 
                      value={editFormData.date} 
                      onChange={handleEditChange} 
                      className="form-control" 
                      required 
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Direction *</label>
                    <input 
                      type="text" 
                      name="category" 
                      value={editFormData.category} 
                      onChange={handleEditChange} 
                      className="form-control" 
                      required 
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      Nouveau fichier PDF (optionnel)
                    </label>
                    <input 
                      type="file" 
                      name="file" 
                      accept=".pdf,application/pdf" 
                      onChange={handleEditChange} 
                      className="form-control" 
                    />
                    <div className="form-text">
                      Laissez vide pour conserver le fichier actuel. Taille maximum: 2MB.
                    </div>
                    <div className="mt-3">
                      <div className="alert alert-light border">
                        <small className="text-muted d-flex align-items-center">
                          <FaFilePdf className="text-danger me-2" />
                          <span>
                            <strong>Fichier actuel :</strong> {getFileNameFromPath(editingDocument.file)}
                          </span>
                        </small>
                      </div>
                    </div>
                  </div>
                  <div className="alert alert-warning">
                    <div className="d-flex">
                      <FaExclamationTriangle className="me-2 mt-1" />
                      <div>
                        <strong>Attention :</strong> Si vous uploadez un nouveau fichier, 
                        l'ancien sera remplacé.
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeEditModal} disabled={editLoading}>
                    <FaTimes className="me-1" />
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-warning text-white" disabled={editLoading}>
                    {editLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Modification en cours...
                      </>
                    ) : (
                      <>
                        <FaSave className="me-1" />
                        Enregistrer les modifications
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE VISUALISATION */}
      {showViewModal && selectedDocument && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-info text-white">
                <h5 className="modal-title d-flex align-items-center">
                  <FaEye className="me-2" />
                  Détails du document
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={closeViewModal}></button>
              </div>
              <div className="modal-body">
                <div className="text-center mb-4">
                  <FaFilePdf className="text-danger" style={{fontSize: '4rem'}} />
                </div>
                <dl className="row">
                  <dt className="col-sm-4">ID:</dt>
                  <dd className="col-sm-8">
                    <span className="badge bg-secondary">{selectedDocument.id}</span>
                  </dd>

                  <dt className="col-sm-4">Objet:</dt>
                  <dd className="col-sm-8">
                    <h6 className="mb-0">{selectedDocument.objet}</h6>
                  </dd>

                  <dt className="col-sm-4">Date:</dt>
                  <dd className="col-sm-8">
                    <div className="d-flex align-items-center">
                      <FaCalendar className="text-primary me-2" />
                      {formatDate(selectedDocument.date)}
                    </div>
                  </dd>

                  <dt className="col-sm-4">Catégorie:</dt>
                  <dd className="col-sm-8">
                    <span className="badge bg-primary">
                      <FaTag className="me-1" />
                      {selectedDocument.category}
                    </span>
                  </dd>

                  <dt className="col-sm-4">Fichier:</dt>
                  <dd className="col-sm-8">
                    <div className="d-flex align-items-center">
                      <FaFilePdf className="text-danger me-2" />
                      <span className="text-truncate">{getFileNameFromPath(selectedDocument.file)}</span>
                    </div>
                  </dd>

                  <dt className="col-sm-4">Ajouté le:</dt>
                  <dd className="col-sm-8">
                    <small className="text-muted">
                      {selectedDocument.created_at ? formatDate(selectedDocument.created_at) : 'Non disponible'}
                    </small>
                  </dd>
                </dl>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeViewModal}>
                  <FaTimes className="me-1" />
                  Fermer
                </button>
                
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => handleDownload(selectedDocument.id, selectedDocument.objet, selectedDocument.file)}
                >
                  <FaDownload className="me-1" />
                  Télécharger
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DMdocument;