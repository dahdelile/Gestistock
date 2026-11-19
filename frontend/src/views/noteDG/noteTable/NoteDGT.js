import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaFilePdf, FaEye, FaLock } from "react-icons/fa";

const NoteFileManager = () => {
  // 🔹 URLs de production HARDCODÉES - Solution fiable ✅
  const API_URL = `https://intranet-attm.com/api/files`;
  const AUTH_API_URL = `https://intranet-attm.com/api`;
  const APP_URL = `https://intranet-attm.com`;

  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showNewYearModal, setShowNewYearModal] = useState(false);
  const [editingFile, setEditingFile] = useState(null);
  const [formData, setFormData] = useState({
    ref: "",
    object: "",
    date: "",
    file: null
  });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [newYear, setNewYear] = useState(new Date().getFullYear() + 1);

  // Gestion des rôles utilisateur
  const [userRole, setUserRole] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  // Fonction utilitaire : Vérifier si l'utilisateur est admin
  const isAdmin = () => userRole === 'admin';

  // Filtres
  const [filters, setFilters] = useState({
    searchTerm: "",
    dateDebut: "",
    dateFin: "",
    sortBy: "date",
    sortOrder: "desc"
  });

  // Gestion des années
  const [availableYears, setAvailableYears] = useState([]);
  const [activeYear, setActiveYear] = useState("all");
  const [yearStats, setYearStats] = useState({});
  const [completedYears, setCompletedYears] = useState([]);

  // Charger le rôle utilisateur au montage
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        setUserLoading(true);
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUserRole(userData.role || userData.roles?.[0] || 'user');
          setUserLoading(false);
          return;
        }
        const token = localStorage.getItem('token');
        if (token) {
          const response = await fetch(`${AUTH_API_URL}/user`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          });
          if (response.ok) {
            const userData = await response.json();
            const role = userData.role || userData.roles?.[0] || 'user';
            setUserRole(role);
            localStorage.setItem('user', JSON.stringify({
              id: userData.id,
              email: userData.email,
              role: role
            }));
          } else {
            setUserRole('user');
          }
        } else {
          setUserRole('user');
        }
      } catch (err) {
        console.error("Erreur récupération rôle:", err);
        setUserRole('user');
      } finally {
        setUserLoading(false);
      }
    };
    fetchUserRole();
  }, []);

  // Charger les fichiers
  useEffect(() => {
    fetchFiles();
  }, []);

  // Analyser les années disponibles et les statistiques
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const startYear = 2024;
    const endYear = currentYear + 6;
    const allYears = [];
    for (let year = endYear; year >= startYear; year--) {
      allYears.push(year);
    }
    setAvailableYears(allYears);
    setNewYear(currentYear + 1);

    const yearsMap = {};
    const completed = [];
    allYears.forEach(year => {
      yearsMap[year] = {
        count: 0,
        withFiles: 0,
        withoutFiles: 0,
        files: [],
        isFuture: year > currentYear,
        isCurrent: year === currentYear,
        isPast: year < currentYear
      };
    });

    files.forEach(file => {
      if (file.date) {
        const year = new Date(file.date).getFullYear();
        if (yearsMap[year]) {
          yearsMap[year].count++;
          if (file.file) {
            yearsMap[year].withFiles++;
          } else {
            yearsMap[year].withoutFiles++;
          }
          yearsMap[year].files.push(file);
        }
      }
    });

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    allYears.forEach(year => {
      if (year < currentYear) {
        const hasRecentNotes = yearsMap[year].files.some(file => {
          const fileDate = new Date(file.date);
          return fileDate > sixMonthsAgo;
        });
        if (!hasRecentNotes && yearsMap[year].count > 0) {
          completed.push(year);
        }
      }
    });

    setYearStats(yearsMap);
    setCompletedYears(completed);

    if (activeYear === "all" && allYears.length > 0) {
      if (allYears.includes(currentYear)) {
        setActiveYear(currentYear.toString());
      } else {
        setActiveYear(allYears[0].toString());
      }
    }
  }, [files]);

  // Filtrer les fichiers selon l'année active
  useEffect(() => {
    let result = [...files];
    if (activeYear !== "all") {
      const year = parseInt(activeYear);
      result = result.filter(file => {
        if (!file.date) return false;
        return new Date(file.date).getFullYear() === year;
      });
    }
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(file =>
        (file.ref && file.ref.toLowerCase().includes(term)) ||
        (file.object && file.object.toLowerCase().includes(term))
      );
    }
    if (filters.dateDebut) {
      const start = new Date(filters.dateDebut);
      result = result.filter(file => new Date(file.date) >= start);
    }
    if (filters.dateFin) {
      const end = new Date(filters.dateFin + 'T23:59:59');
      result = result.filter(file => new Date(file.date) <= end);
    }
    result.sort((a, b) => {
      let aVal, bVal;
      switch (filters.sortBy) {
        case "ref":
          aVal = a.ref || "";
          bVal = b.ref || "";
          break;
        case "object":
          aVal = a.object || "";
          bVal = b.object || "";
          break;
        default:
          aVal = new Date(a.date || 0);
          bVal = new Date(b.date || 0);
      }
      if (filters.sortOrder === "asc") {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
    setFilteredFiles(result);
  }, [files, activeYear, filters]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(API_URL);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Erreur HTTP: ${response.status}`);
      }
      if (Array.isArray(data.data)) {
        setFiles(data.data);
      } else if (Array.isArray(data)) {
        setFiles(data);
      } else {
        setFiles([]);
      }
    } catch (err) {
      console.error("Erreur API :", err);
      setError(err.message || "Impossible de charger les notes");
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  // Gestion des filtres
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSort = (field) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === "asc" ? "desc" : "asc"
    }));
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: "",
      dateDebut: "",
      dateFin: "",
      sortBy: "date",
      sortOrder: "desc"
    });
  };

  const getSortIcon = (field) => {
    if (filters.sortBy !== field) return "↕️";
    return filters.sortOrder === "asc" ? "↑" : "↓";
  };

  // Gestion des années
  const handleYearChange = (year) => {
    setActiveYear(year);
  };

  const openNewYearModal = () => {
    if (!isAdmin()) {
      alert("Seuls les administrateurs peuvent créer de nouvelles années");
      return;
    }
    const currentYear = new Date().getFullYear();
    setNewYear(currentYear + 1);
    setShowNewYearModal(true);
  };

  const handleCreateNewYear = () => {
    if (!isAdmin()) {
      alert("Action non autorisée");
      return;
    }
    if (newYear) {
      setActiveYear(newYear.toString());
      setShowNewYearModal(false);
      if (!availableYears.includes(newYear)) {
        const updatedYears = [newYear, ...availableYears].sort((a, b) => b - a);
        setAvailableYears(updatedYears);
        setYearStats(prev => ({
          ...prev,
          [newYear]: {
            count: 0,
            withFiles: 0,
            withoutFiles: 0,
            files: [],
            isFuture: newYear > new Date().getFullYear(),
            isCurrent: newYear === new Date().getFullYear(),
            isPast: false
          }
        }));
      }
      openAddModal();
    }
  };

  // Gestion du formulaire
  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'file') {
      setFormData(prev => ({ ...prev, file: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const openAddModal = () => {
    if (!isAdmin()) {
      alert("Seuls les administrateurs peuvent ajouter des notes");
      return;
    }
    setEditingFile(null);
    const today = new Date();
    const defaultDate = activeYear !== "all"
      ? `${activeYear}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      : today.toISOString().split('T')[0];
    setFormData({
      ref: "",
      object: "",
      date: defaultDate,
      file: null
    });
    setShowModal(true);
  };

  const openEditModal = (file) => {
    if (!isAdmin()) {
      alert("Seuls les administrateurs peuvent modifier des notes");
      return;
    }
    setEditingFile(file);
    let formattedDate = '';
    if (file.date) {
      const dateStr = file.date.toString();
      if (dateStr.includes('T')) {
        formattedDate = dateStr.split('T')[0];
      } else if (dateStr.includes('-')) {
        formattedDate = dateStr;
      } else {
        formattedDate = new Date(dateStr).toISOString().split('T')[0];
      }
    } else {
      formattedDate = new Date().toISOString().split('T')[0];
    }
    setFormData({
      ref: file.ref || '',
      object: file.object || '',
      date: formattedDate,
      file: null
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingFile(null);
  };

  const closeNewYearModal = () => {
    setShowNewYearModal(false);
  };

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin()) {
      alert("Action non autorisée. Vous n'avez pas les permissions nécessaires.");
      return;
    }
    if (!formData.ref || !formData.ref.trim()) {
      alert('Le champ "Référence" est requis');
      return;
    }
    if (!formData.object || !formData.object.trim()) {
      alert('Le champ "Objet" est requis');
      return;
    }
    if (!formData.date) {
      alert('Le champ "Date" est requis');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('ref', formData.ref.trim());
    formDataToSend.append('object', formData.object.trim());
    formDataToSend.append('date', formData.date);
    if (formData.file) {
      formDataToSend.append('file', formData.file);
    }
    if (editingFile) {
      formDataToSend.append('_method', 'PUT');
    }

    try {
      const url = editingFile
        ? `${API_URL}/${editingFile.id}`
        : API_URL;
      const method = 'POST';
      const response = await fetch(url, {
        method: method,
        body: formDataToSend,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Accès refusé. Vous n'avez pas les permissions nécessaires.");
        }
        if (response.status === 422) {
          let errorMessage = 'Erreurs de validation :\n';
          if (data.errors) {
            Object.keys(data.errors).forEach(field => {
              errorMessage += `• ${field}: ${data.errors[field].join(', ')}\n`;
            });
          }
          alert(errorMessage);
        } else {
          throw new Error(data.error || data.message || `Erreur: ${response.status}`);
        }
        return;
      }
      fetchFiles();
      closeModal();
      alert(editingFile ? "Note modifiée avec succès!" : "Note ajoutée avec succès!");
    } catch (error) {
      console.error("❌ Erreur :", error);
      alert("Erreur: " + (error.message || "Échec de l'opération"));
    }
  };

  // Suppression
  const confirmDelete = (file) => {
    if (!isAdmin()) {
      alert("Seuls les administrateurs peuvent supprimer des notes");
      return;
    }
    setDeleteConfirm(file);
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handleDelete = async () => {
    if (!isAdmin()) {
      alert("Action non autorisée");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/${deleteConfirm.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Accès refusé. Vous n'avez pas les permissions nécessaires.");
        }
        const data = await response.json();
        throw new Error(data.error || `Erreur: ${response.status}`);
      }
      setFiles(files.filter(file => file.id !== deleteConfirm.id));
      setDeleteConfirm(null);
      alert("Note supprimée avec succès!");
    } catch (error) {
      console.error("Erreur :", error);
      alert("Erreur: " + (error.message || "Échec de la suppression"));
    }
  };

  // ✅ Télécharger un fichier - URL hardcodée
  const handleDownload = (filename) => {
    if (!filename) {
      alert("Aucun fichier à télécharger");
      return;
    }
    window.open(`https://intranet-attm.com/api/download/${encodeURIComponent(filename)}`, '_blank');
  };

  // ✅ Voir PDF - URL hardcodée
  const handleViewPdf = (fileId) => {
    window.open(`https://intranet-attm.com/api/files/${fileId}/pdf`, "_blank");
  };

  // Statistiques globales
  const totalNotes = files.length;
  const totalWithFiles = files.filter(f => f.file).length;
  const totalWithoutFiles = totalNotes - totalWithFiles;

  const getYearButtonClass = (year, stats) => {
    if (activeYear === year.toString()) return 'btn-primary';
    if (stats && stats.count > 0) {
      if (stats.isCurrent) return 'btn-outline-success';
      if (stats.isFuture) return 'btn-outline-info';
      return 'btn-outline-primary';
    }
    if (stats && stats.isFuture) return 'btn-outline-secondary';
    return 'btn-outline-secondary';
  };

  const archiveYear = (year) => {
    if (!isAdmin()) {
      alert("Seuls les administrateurs peuvent archiver des années");
      return;
    }
    if (window.confirm(`Voulez-vous archiver l'année ${year} ?\nCette action marquera l'année comme terminée.`)) {
      alert(`L'année ${year} a été archivée avec succès !`);
      setYearStats(prev => ({
        ...prev,
        [year]: {
          ...prev[year],
          archived: true
        }
      }));
    }
  };

  // Affichage pendant le chargement du rôle
  if (userLoading) {
    return (
      <div className="container mt-4 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
        <p className="mt-3">Vérification des permissions...</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {/* En-tête avec titre et statistiques */}
      <div className="row mb-4">
        <div className="col-md-8">
          <h1 className="mb-4 fw-bold" style={{ color: "#333" }}>
            <img
              src="https://cdn-icons-png.flaticon.com/128/5442/5442020.png"
              width={70}
              height={70}
              alt="Logo"
              className="ms-3 align-middle"
            />
            Gestion des Notes DG
          </h1>
          <p className="text-muted">Gérez et consultez toutes vos notes par année</p>
        </div>
        {/* Badge de rôle utilisateur */}
        <div className="col-md-4 text-end">
          <span className={`badge fs-6 py-2 px-3 ${isAdmin() ? 'bg-success' : 'bg-secondary'}`}>
            <i className={`bi bi-${isAdmin() ? 'shield-check' : 'person'} me-1`}></i>
          </span>
          {!isAdmin() && (
            <div className="text-muted small mt-1">
              <FaLock className="me-1" />
            </div>
          )}
        </div>
      </div>

      {/* Boutons d'action conditionnels */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          {isAdmin() ? (
            <>
              <button className="btn btn-success" onClick={openAddModal}>
                <i className="bi bi-plus-circle me-2"></i>
                Ajouter une note
              </button>
              <button className="btn btn-info ms-2" onClick={openNewYearModal}>
                <i className="bi bi-calendar-plus me-2"></i>
                Nouvelle année
              </button>
            </>
          ) : (
            <span className="text-muted small"></span>
          )}
          <button
            className={`btn btn-outline-primary ${isAdmin() ? 'ms-2' : ''}`}
            onClick={fetchFiles}
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Actualiser
          </button>
        </div>
        <div className="text-end">
          <span className="badge bg-info me-2">
            {activeYear === "all" ? "Toutes années" : `Année: ${activeYear}`}
          </span>
          <span className="badge bg-secondary">
            {filteredFiles.length} note(s)
          </span>
        </div>
      </div>

      {/* Section des onglets par année */}
      <div className="card mb-4 shadow-sm">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">
            <i className="bi bi-calendar-range me-2"></i>
            Navigation par année
          </h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-auto mb-2">
              <button
                className={`btn ${activeYear === "all" ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => handleYearChange("all")}
                style={{ minWidth: '120px' }}
              >
                <i className="bi bi-collection me-1"></i>
                Toutes années
                <span className="badge bg-secondary ms-2">{totalNotes}</span>
              </button>
            </div>
            <div className="col-auto d-flex align-items-center">
              <div className="vr"></div>
            </div>
            <div className="col">
              <div className="d-flex flex-wrap gap-2">
                {availableYears.map(year => {
                  const stats = yearStats[year] || {
                    count: 0,
                    withFiles: 0,
                    withoutFiles: 0,
                    isFuture: year > new Date().getFullYear(),
                    isCurrent: year === new Date().getFullYear()
                  };
                  const yearStr = year.toString();
                  const isCompleted = completedYears.includes(year);
                  return (
                    <div key={year} className="position-relative">
                      <button
                        className={`btn ${getYearButtonClass(yearStr, stats)} position-relative`}
                        onClick={() => handleYearChange(yearStr)}
                        style={{ minWidth: '100px' }}
                        title={`Année ${year} - ${stats.count} note(s)`}
                      >
                        <div className="d-flex flex-column align-items-center">
                          <span className="fw-bold">
                            {year}
                            {stats.isCurrent && <span className="ms-1 text-success">●</span>}
                            {stats.isFuture && <span className="ms-1 text-info">⏳</span>}
                          </span>
                          {stats.count > 0 ? (
                            <span className={`badge ${stats.isCurrent ? 'bg-success' : stats.isFuture ? 'bg-info' : 'bg-primary'} mt-1`}>
                              {stats.count}
                            </span>
                          ) : (
                            <span className="badge bg-light text-dark mt-1">0</span>
                          )}
                          {stats.count > 0 && (
                            <div className="small mt-1">
                              {stats.withFiles > 0 && (
                                <span className="text-success me-1">
                                  <i className="bi bi-file-pdf"></i> {stats.withFiles}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </button>
                      {isCompleted && isAdmin() && (
                        <button
                          className="btn btn-sm btn-warning position-absolute top-0 start-100 translate-middle"
                          style={{ zIndex: 1, width: '40px', height: '24px', padding: 0 }}
                          onClick={() => archiveYear(year)}
                          title={`Archiver l'année ${year}`}
                        >
                          <i className="bi bi-archive"></i>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Filtres avancés */}
      <div className="card mb-4 shadow-sm">
        <div className="card-header bg-info d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="bi bi-funnel me-2"></i>
            Filtres avancés
          </h5>
          <button className="btn btn-sm btn-outline-secondary" onClick={resetFilters}>
            <i className="bi bi-x-circle me-1"></i>
            Réinitialiser
          </button>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-search"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Rechercher par référence ou objet..."
                  name="searchTerm"
                  value={filters.searchTerm}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
            <div className="col-md-3">
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-calendar"></i></span>
                <input
                  type="date"
                  className="form-control"
                  placeholder="Date début"
                  name="dateDebut"
                  value={filters.dateDebut}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
            <div className="col-md-3">
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-calendar-check"></i></span>
                <input
                  type="date"
                  className="form-control"
                  placeholder="Date fin"
                  name="dateFin"
                  value={filters.dateFin}
                  onChange={handleFilterChange}
                  min={filters.dateDebut}
                />
              </div>
            </div>
            <div className="col-md-2">
              <select className="form-select" name="sortBy" value={filters.sortBy} onChange={handleFilterChange}>
                <option value="date">Trier par date</option>
                <option value="ref">Trier par référence</option>
                <option value="object">Trier par objet</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des résultats */}
      <div className="card shadow">
        <div className="card-header bg-light">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="bi bi-list-ul me-2"></i>
              {activeYear === "all" ? "Toutes les notes" : `Notes de l'année ${activeYear}`}
              {yearStats[parseInt(activeYear)]?.isFuture && activeYear !== "all" && (
                <span className="badge bg-info ms-2">Année future</span>
              )}
            </h5>
            <div>
              {(filters.searchTerm || filters.dateDebut || filters.dateFin) && (
                <span className="badge bg-warning me-2">Filtres actifs</span>
              )}
              <span className="badge bg-info">
                {loading ? 'Chargement...' : `${filteredFiles.length} note(s)`}
              </span>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}} role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
              <p className="mt-3">Chargement des notes...</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-file-earmark-text display-1 text-muted"></i>
              <h5 className="mt-3">
                {activeYear === "all"
                  ? "Aucune note trouvée"
                  : yearStats[parseInt(activeYear)]?.isFuture
                    ? `Préparez l'année ${activeYear}`
                    : `Aucune note pour l'année ${activeYear}`
                }
              </h5>
              <p className="text-muted">
                {files.length === 0
                  ? 'Aucune note disponible. Commencez par ajouter une note.'
                  : activeYear === "all"
                    ? 'Aucune note ne correspond à vos critères de recherche.'
                    : yearStats[parseInt(activeYear)]?.isFuture
                      ? `L'année ${activeYear} est une année future. Vous pouvez déjà y ajouter des notes.`
                      : `Cliquez sur "Ajouter une note" pour créer la première note de ${activeYear}.`
                }
              </p>
              {activeYear !== "all" && files.length > 0 && (
                <div className="mt-3">
                  <button className="btn btn-primary me-2" onClick={() => setActiveYear("all")}>
                    <i className="bi bi-arrow-left me-2"></i>
                    Voir toutes les notes
                  </button>
                  {yearStats[parseInt(activeYear)]?.isFuture && isAdmin() && (
                    <button className="btn btn-success" onClick={openAddModal}>
                      <i className="bi bi-plus-circle me-2"></i>
                      Ajouter la première note pour {activeYear}
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-dark">
                  <tr>
                    <th style={{ cursor: "pointer", width: "15%" }} onClick={() => handleSort("ref")} className="text-nowrap">
                      Référence {getSortIcon("ref")}
                    </th>
                    <th style={{ cursor: "pointer", width: "40%" }} onClick={() => handleSort("object")} className="text-nowrap">
                      Objet {getSortIcon("object")}
                    </th>
                    <th style={{ cursor: "pointer", width: "15%" }} onClick={() => handleSort("date")} className="text-nowrap">
                      Date {getSortIcon("date")}
                    </th>
                    <th style={{ width: "15%" }}>Fichier</th>
                    <th style={{ width: "15%" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map((file) => (
                    <tr key={file.id} className="align-middle">
                      <td className="fw-bold">
                        <span className="badge bg-primary">{file.ref}</span>
                      </td>
                      <td>
                        <div className="text-truncate" style={{ maxWidth: '400px' }} title={file.object}>
                          {file.object}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex flex-column">
                          <span>{file.date ? new Date(file.date).toLocaleDateString('fr-FR') : 'N/A'}</span>
                          <small className="text-muted">
                            {file.date && new Date(file.date).getFullYear()}
                          </small>
                        </div>
                      </td>
                      {/* FICHIER */}
                      <td>
                        {file.file ? (
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-outline-success"
                              title="Voir PDF"
                              onClick={() => handleViewPdf(file.id)}
                            >
                              <FaFilePdf size={18} color="#dc3545" /> <FaEye size={16} />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              title="Télécharger"
                              onClick={() => handleDownload(file.file)}
                            >
                              <i className="bi bi-download"></i>
                            </button>
                          </div>
                        ) : (
                          <span className="badge bg-warning">Sans fichier</span>
                        )}
                      </td>
                      {/* ACTIONS - CONDITIONNELLES SELON LE RÔLE */}
                      <td>
                        <div className="d-flex gap-2">
                          {isAdmin() ? (
                            <>
                              <button
                                className="btn btn-sm btn-outline-warning"
                                title="Modifier"
                                onClick={() => openEditModal(file)}
                              >
                                <FaEdit size={16} />
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                title="Supprimer"
                                onClick={() => confirmDelete(file)}
                              >
                                <FaTrash size={16} />
                              </button>
                            </>
                          ) : (
                            <span className="text-muted small" title="Consultation seule">
                              <FaLock size={14} />
                            </span>
                          )}
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

      {/* MODAL AJOUT/MODIFICATION */}
      {showModal && !isAdmin() ? (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-warning">
                <h5 className="modal-title"><FaLock className="me-2" /> Accès restreint</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body text-center">
                <div className="alert alert-warning">
                  <i className="bi bi-exclamation-triangle-fill display-4 d-block mb-3"></i>
                  <h5>Permission refusée</h5>
                  <p className="mb-0">Vous devez être administrateur pour effectuer cette action.</p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Fermer</button>
              </div>
            </div>
          </div>
        </div>
      ) : showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="bi bi-file-earmark-text me-2"></i>
                  {editingFile ? 'Modifier la note' : `Ajouter une note ${activeYear !== "all" ? `pour ${activeYear}` : ''}`}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="ref" className="form-label"><i className="bi bi-tag me-1"></i> Référence *</label>
                    <input type="text" className="form-control" id="ref" name="ref" value={formData.ref}
                      onChange={handleInputChange} required placeholder={`Ex: NOTE-${activeYear !== "all" ? activeYear : "2024"}-001`} />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="object" className="form-label"><i className="bi bi-text-paragraph me-1"></i> Objet *</label>
                    <textarea className="form-control" id="object" name="object" value={formData.object}
                      onChange={handleInputChange} rows="3" required placeholder="Description de la note..." />
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="date" className="form-label"><i className="bi bi-calendar me-1"></i> Date *</label>
                        <input type="date" className="form-control" id="date" name="date" value={formData.date}
                          onChange={handleInputChange} required />
                        <small className="text-muted">{activeYear !== "all" && `L'année sera automatiquement ${activeYear}`}</small>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="file" className="form-label"><i className="bi bi-file-pdf me-1"></i> Fichier PDF {!editingFile && '*'}</label>
                        <input type="file" className="form-control" id="file" name="file" accept=".pdf,.PDF"
                          onChange={handleInputChange} required={!editingFile} />
                        <small className="text-muted">
                          {editingFile ? "Laissez vide pour conserver le fichier actuel" : "Téléversez un fichier PDF (max 10MB)"}
                        </small>
                      </div>
                    </div>
                  </div>
                  {editingFile && editingFile.file && (
                    <div className="alert alert-info">
                      <i className="bi bi-info-circle me-2"></i>
                      Fichier actuel : <strong>{editingFile.file}</strong>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    <i className="bi bi-x-circle me-1"></i> Annuler
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-check-circle me-1"></i> {editingFile ? 'Modifier' : 'Ajouter'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUPPRESSION */}
      {deleteConfirm && !isAdmin() ? (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-warning">
                <h5 className="modal-title"><FaLock className="me-2" /> Accès restreint</h5>
                <button type="button" className="btn-close" onClick={cancelDelete}></button>
              </div>
              <div className="modal-body text-center">
                <div className="alert alert-warning">
                  <i className="bi bi-exclamation-triangle-fill display-4 d-block mb-3"></i>
                  <h5>Permission refusée</h5>
                  <p className="mb-0">Vous devez être administrateur pour supprimer des notes.</p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={cancelDelete}>Fermer</button>
              </div>
            </div>
          </div>
        </div>
      ) : deleteConfirm && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title"><i className="bi bi-exclamation-triangle me-2"></i> Confirmer la suppression</h5>
                <button type="button" className="btn-close btn-close-white" onClick={cancelDelete}></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-warning">
                  <i className="bi bi-exclamation-octagon me-2"></i>
                  <strong>Attention !</strong> Cette action est irréversible.
                </div>
                <p>Êtes-vous sûr de vouloir supprimer la note suivante ?</p>
                <div className="card">
                  <div className="card-body">
                    <h6 className="card-title text-primary">{deleteConfirm.ref}</h6>
                    <p className="card-text">{deleteConfirm.object}</p>
                    <p className="card-text">
                      <small className="text-muted">
                        Date: {deleteConfirm.date ? new Date(deleteConfirm.date).toLocaleDateString('fr-FR') : 'N/A'}
                      </small>
                    </p>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={cancelDelete}>
                  <i className="bi bi-x-circle me-1"></i> Annuler
                </button>
                <button type="button" className="btn btn-danger" onClick={handleDelete}>
                  <i className="bi bi-trash me-1"></i> Supprimer définitivement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOUVELLE ANNÉE */}
      {showNewYearModal && !isAdmin() ? (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-warning">
                <h5 className="modal-title"><FaLock className="me-2" /> Accès restreint</h5>
                <button type="button" className="btn-close" onClick={closeNewYearModal}></button>
              </div>
              <div className="modal-body text-center">
                <div className="alert alert-warning">
                  <i className="bi bi-exclamation-triangle-fill display-4 d-block mb-3"></i>
                  <h5>Permission refusée</h5>
                  <p className="mb-0">Vous devez être administrateur pour créer de nouvelles années.</p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeNewYearModal}>Fermer</button>
              </div>
            </div>
          </div>
        </div>
      ) : showNewYearModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-info text-white">
                <h5 className="modal-title"><i className="bi bi-calendar-plus me-2"></i> Créer une nouvelle année</h5>
                <button type="button" className="btn-close btn-close-white" onClick={closeNewYearModal}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="newYear" className="form-label"><i className="bi bi-calendar me-1"></i> Sélectionnez l'année à créer</label>
                  <select className="form-select" id="newYear" value={newYear} onChange={(e) => setNewYear(parseInt(e.target.value))}>
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = new Date().getFullYear() + i;
                      return <option key={year} value={year}>{year}</option>;
                    })}
                  </select>
                  <small className="text-muted">Vous pourrez ajouter des notes pour cette année immédiatement.</small>
                </div>
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  <strong>Conseil :</strong> Créez les années futures à l'avance pour préparer vos notes.
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeNewYearModal}>
                  <i className="bi bi-x-circle me-1"></i> Annuler
                </button>
                <button type="button" className="btn btn-success" onClick={handleCreateNewYear}>
                  <i className="bi bi-check-circle me-1"></i> Créer l'année {newYear} et ajouter une note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteFileManager;