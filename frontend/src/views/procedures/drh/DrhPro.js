import React, { useEffect, useState, useCallback } from "react";
import { 
  FaFilePdf, FaEye, FaEdit, FaTrash, FaPlus, FaDownload, 
  FaSearch, FaFilter, FaCalendarAlt, FaLock, FaUserShield, FaUser,
  FaSpinner, FaExclamationTriangle, FaCheckCircle, FaSync
} from "react-icons/fa";
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { Alert, Spinner, Badge, Toast, ToastContainer, Card, Row, Col } from 'react-bootstrap';

// ============================================
// CONFIGURATION API - PRODUCTION
// ============================================
const API_BASE_URL = 'https://intranet-attm.com/api';
const APP_URL = 'https://intranet-attm.com';

console.log('🚀 Mode PRODUCTION activé');
console.log('📡 API URL:', API_BASE_URL);
console.log('🌐 APP URL:', APP_URL);

const DRHProcedures = () => {
  // ✅ États principaux - TOUJOURS initialisés correctement
  const [files, setFiles] = useState([]); // ✅ Tableau vide par défaut
  const [filteredFiles, setFilteredFiles] = useState([]); // ✅ Tableau vide par défaut
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // ✅ ÉTATS POUR LA GESTION DES RÔLES
  const [userRole, setUserRole] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // États pour les modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState("success");
  
  // États pour les formulaires
  const [addFormData, setAddFormData] = useState({
    description: "",
    date: new Date().toISOString().split('T')[0],
    file: null,
    category: "DRH",
  });
  
  const [editFormData, setEditFormData] = useState({
    id: null,
    description: "",
    date: "",
    file: null,
    currentFileName: "",
    currentFileUrl: "",
  });
  
  const [deleteId, setDeleteId] = useState(null);
  const [deleteDescription, setDeleteDescription] = useState("");

  // États pour les filtres
  const [filters, setFilters] = useState({
    search: "",
    dateFrom: "",
    dateTo: "",
  });

  // ✅ FONCTION DE VÉRIFICATION DES RÔLES
  const isAdmin = useCallback(() => {
    return userRole === 'admin';
  }, [userRole]);

  const isDRH = useCallback(() => {
    return userRole === 'DRH';
  }, [userRole]);

  const canEdit = useCallback(() => {
    return isAdmin() || isDRH();
  }, [isAdmin, isDRH]);

  // ✅ FONCTION POUR AFFICHER LES NOTIFICATIONS
  const showNotification = (message, variant = 'success') => {
    setToastMessage(message);
    setToastVariant(variant);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };

  // ✅ FONCTION POUR LES REQUÊTES AVEC TOKEN
  const fetchWithToken = async (url, options = {}) => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    
    const defaultOptions = {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
    };

    if (options.body instanceof FormData) {
      delete defaultOptions.headers['Content-Type'];
    } else {
      defaultOptions.headers['Content-Type'] = 'application/json';
    }

    try {
      console.log(`🌐 Tentative de fetch: ${url}`);
      
      const response = await fetch(url, {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...options.headers,
        },
      });

      console.log(`📡 Réponse de ${url}:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (response.status === 401) {
        console.warn('Session expirée');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error('Session expirée');
      }
      if (response.status === 403) {
        throw new Error('Accès refusé - Permissions insuffisantes');
      }

      return response;
    } catch (error) {
      console.error('❌ Erreur fetch:', error);
      throw error;
    }
  };

  // ✅ FONCTION POUR EXTRAIRE LES DONNÉES DE L'API (ROBUSTE)
  const extractDataFromResponse = (responseData) => {
    // ✅ Si la réponse est null ou undefined
    if (!responseData) {
      console.warn('⚠️ Réponse API vide');
      return [];
    }

    // ✅ Cas 1: La réponse est directement un tableau
    if (Array.isArray(responseData)) {
      console.log('📦 Cas 1: Tableau direct');
      return responseData.filter(item => item != null);
    }

    // ✅ Cas 2: La réponse a une propriété 'data' qui est un tableau
    if (responseData.data && Array.isArray(responseData.data)) {
      console.log('📦 Cas 2: Propriété data');
      return responseData.data.filter(item => item != null);
    }

    // ✅ Cas 3: Format { success: true, data: [...] }
    if (responseData.success && responseData.data && Array.isArray(responseData.data)) {
      console.log('📦 Cas 3: Format success/data');
      return responseData.data.filter(item => item != null);
    }

    // ✅ Cas 4: Chercher le premier tableau dans l'objet
    if (typeof responseData === 'object') {
      console.log('📦 Cas 4: Recherche de tableau dans objet');
      for (let key in responseData) {
        if (Array.isArray(responseData[key])) {
          console.log(`🔍 Tableau trouvé dans la propriété: ${key}`);
          return responseData[key].filter(item => item != null);
        }
      }
    }

    // ✅ Cas 5: Si c'est un objet simple, le mettre dans un tableau
    if (typeof responseData === 'object' && responseData !== null) {
      console.log('📦 Cas 5: Objet simple converti en tableau');
      return [responseData].filter(item => item != null);
    }

    // ✅ Par défaut, retourner un tableau vide
    console.warn('⚠️ Aucune donnée extractible, retour tableau vide');
    return [];
  };

  // ✅ CHARGER LE RÔLE UTILISATEUR
  const fetchUserRole = useCallback(async () => {
    try {
      setUserLoading(true);
      setAuthError(null);
      
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          const role = userData.role || userData.roles?.[0] || 'user';
          setUserRole(role);
          setUserLoading(false);
          return;
        } catch (e) {
          console.error("Erreur parsing user:", e);
        }
      }
      
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!token) {
        setUserRole('user');
        setUserLoading(false);
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/user`, {
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
          name: userData.name,
          role: role
        }));
      } else {
        setUserRole('user');
      }
    } catch (err) {
      console.error('Erreur récupération rôle:', err);
      setAuthError('Impossible de vérifier les permissions');
      setUserRole('user');
    } finally {
      setUserLoading(false);
    }
  }, []);

  // ✅ CHARGEMENT INITIAL
  useEffect(() => {
    const initialize = async () => {
      await fetchUserRole();
      await fetchFiles();
    };
    initialize();
  }, [fetchUserRole]);

  // ✅ APPLIQUER LES FILTRES - AVEC VÉRIFICATION
  useEffect(() => {
    if (Array.isArray(files)) {
      applyFilters();
    } else {
      console.warn('⚠️ files n\'est pas un tableau:', files);
      setFiles([]);
    }
  }, [files, filters]);

  // ✅ FONCTION POUR CHARGER LES PROCÉDURES - CORRIGÉE
  const fetchFiles = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      
      const response = await fetchWithToken(`${API_BASE_URL}/procedures?category=DRH`);
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log('📦 Réponse API brute:', responseData);
      
      // ✅ Extraction robuste des données
      const proceduresData = extractDataFromResponse(responseData);
      
      console.log('📊 Procédures après extraction:', proceduresData);
      
      // ✅ Mise à jour des états
      setFiles(proceduresData);
      setDataLoaded(true);
      
      if (proceduresData.length === 0) {
        showNotification('Aucune procédure trouvée', 'info');
      } else {
        showNotification(`${proceduresData.length} procédure(s) chargée(s)`, 'success');
      }
      
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des fichiers :", error);
      setErrorMessage("Impossible de charger les procédures. Vérifiez la connexion au serveur.");
      showNotification(error.message, 'danger');
      setFiles([]); // ✅ Toujours un tableau vide
    } finally {
      setLoading(false);
    }
  };

  // ✅ FONCTION POUR APPLIQUER LES FILTRES - CORRIGÉE
  const applyFilters = () => {
    // ✅ S'assurer que files est un tableau
    const filesArray = Array.isArray(files) ? files : [];
    
    let filtered = [...filesArray];

    if (filters.search && filters.search.trim() !== '') {
      const searchLower = filters.search.toLowerCase().trim();
      filtered = filtered.filter(file => 
        file && 
        file.description && 
        typeof file.description === 'string' &&
        file.description.toLowerCase().includes(searchLower)
      );
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(file => 
        file && 
        file.date && 
        new Date(file.date) >= fromDate
      );
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      filtered = filtered.filter(file => 
        file && 
        file.date && 
        new Date(file.date) <= toDate
      );
    }

    setFilteredFiles(filtered);
  };

  // ✅ RÉINITIALISER LES FILTRES
  const resetFilters = () => {
    setFilters({
      search: "",
      dateFrom: "",
      dateTo: "",
    });
    showNotification('Filtres réinitialisés', 'info');
  };

  // ✅ GESTIONNAIRES D'ÉVÉNEMENTS POUR LES FORMULAIRES
  const handleAddChange = (e) => {
    const { name, value, files } = e.target;
    setAddFormData((prevData) => ({
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

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // ✅ FONCTIONS POUR LES MODALES
  const resetAddForm = () => {
    setAddFormData({
      description: "",
      date: new Date().toISOString().split('T')[0],
      file: null,
      category: "DRH",
    });
  };

  const openEditModal = (file) => {
    if (!canEdit()) {
      setErrorMessage("Action non autorisée. Seuls les administrateurs et DRH peuvent modifier des procédures.");
      return;
    }
    
    if (!file) return;
    
    setEditFormData({
      id: file.id || null,
      description: file.description || "",
      date: file.date ? file.date.split('T')[0] : new Date().toISOString().split('T')[0],
      file: null,
      currentFileName: file.file_name || (file.file ? file.file.split('/').pop() : "Aucun fichier"),
      currentFileUrl: file.file_url || (file.file ? `${APP_URL}/storage/${file.file}` : null),
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (id, description) => {
    if (!canEdit()) {
      setErrorMessage("Action non autorisée. Seuls les administrateurs et DRH peuvent supprimer des procédures.");
      return;
    }
    setDeleteId(id);
    setDeleteDescription(description || "cette procédure");
    setShowDeleteModal(true);
  };

  // ✅ FONCTIONS POUR LES OPÉRATIONS CRUD
  const handleAddSubmit = async (e) => {
    e.preventDefault();

    if (!canEdit()) {
      setErrorMessage("Action non autorisée.");
      return;
    }

    if (!addFormData.file || !addFormData.description || !addFormData.date) {
      setErrorMessage("Tous les champs sont requis !");
      return;
    }

    setOperationLoading(true);

    const formDataToSend = new FormData();
    formDataToSend.append('description', addFormData.description);
    formDataToSend.append('date', addFormData.date);
    formDataToSend.append('file', addFormData.file);
    formDataToSend.append('category', addFormData.category);

    try {
      const response = await fetchWithToken(`${API_BASE_URL}/procedures`, {
        method: "POST",
        body: formDataToSend,
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || `Erreur ${response.status}`);
      }

      // ✅ Extraire la nouvelle procédure de la réponse
      const newFile = extractDataFromResponse(responseData);
      const newProcedure = Array.isArray(newFile) && newFile.length > 0 ? newFile[0] : responseData;
      
      // ✅ Mettre à jour la liste
      const currentFiles = Array.isArray(files) ? files : [];
      setFiles([newProcedure, ...currentFiles]);
      
      setShowAddModal(false);
      resetAddForm();
      setErrorMessage("");
      showNotification("Procédure ajoutée avec succès !", 'success');
      
    } catch (error) {
      console.error("Erreur lors de l'ajout :", error);
      setErrorMessage(error.message);
      showNotification(error.message, 'danger');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!canEdit()) {
      setErrorMessage("Action non autorisée.");
      return;
    }

    setOperationLoading(true);

    const formDataToSend = new FormData();
    formDataToSend.append('description', editFormData.description);
    formDataToSend.append('date', editFormData.date);
    formDataToSend.append('_method', 'PUT');
    
    if (editFormData.file) {
      formDataToSend.append('file', editFormData.file);
    }

    try {
      const response = await fetchWithToken(`${API_BASE_URL}/procedures/${editFormData.id}`, {
        method: "POST",
        body: formDataToSend,
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || `Erreur ${response.status}`);
      }

      // ✅ Extraire la procédure mise à jour
      const updatedFile = extractDataFromResponse(responseData);
      const updatedProcedure = Array.isArray(updatedFile) && updatedFile.length > 0 ? updatedFile[0] : responseData;
      
      // ✅ Mettre à jour la liste
      const currentFiles = Array.isArray(files) ? files : [];
      setFiles(currentFiles.map(file => 
        file && file.id === editFormData.id ? { ...file, ...updatedProcedure } : file
      ));
      
      setShowEditModal(false);
      setEditFormData({ 
        id: null, 
        description: "", 
        date: "", 
        file: null,
        currentFileName: "",
        currentFileUrl: ""
      });
      
      showNotification("Procédure modifiée avec succès !", 'success');
      
    } catch (error) {
      console.error("Erreur lors de la modification :", error);
      setErrorMessage(error.message);
      showNotification(error.message, 'danger');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setOperationLoading(true);
      
      const response = await fetchWithToken(`${API_BASE_URL}/procedures/${deleteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      // ✅ Mettre à jour la liste
      const currentFiles = Array.isArray(files) ? files : [];
      setFiles(currentFiles.filter(file => file && file.id !== deleteId));
      
      setShowDeleteModal(false);
      setDeleteId(null);
      setDeleteDescription("");
      
      showNotification("Procédure supprimée avec succès !", 'success');
      
    } catch (error) {
      console.error("Erreur lors de la suppression :", error);
      setErrorMessage(error.message);
      showNotification(error.message, 'danger');
    } finally {
      setOperationLoading(false);
    }
  };

  // ✅ FONCTIONS POUR LA GESTION DES PDF
  const handleViewPdf = (procedureId) => {
    if (!procedureId) return;
    const pdfUrl = `${API_BASE_URL}/procedures/${procedureId}/pdf`;
    console.log('📄 Ouverture PDF:', pdfUrl);
    window.open(pdfUrl, '_blank');
  };

  const handleDownload = async (procedureId, fileName) => {
    if (!procedureId) return;
    
    try {
      setOperationLoading(true);
      
      const response = await fetchWithToken(`${API_BASE_URL}/procedures/${procedureId}/download`);
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `procedure-${procedureId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showNotification('Fichier téléchargé avec succès', 'success');
      
    } catch (error) {
      console.error('❌ Erreur téléchargement:', error);
      setErrorMessage('Erreur lors du téléchargement du fichier');
      showNotification(error.message, 'danger');
    } finally {
      setOperationLoading(false);
    }
  };

  // ✅ FONCTIONS UTILITAIRES
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return "-";
    }
  };

  const generateUniqueKey = (file, index) => {
    const fileId = file && file.id ? file.id : `temp-${index}`;
    return `${fileId}-${index}-${Date.now()}`;
  };

  const refreshData = () => {
    fetchFiles();
    showNotification('Données actualisées', 'info');
  };

  // ✅ AFFICHAGE PENDANT LE CHARGEMENT DU RÔLE
  if (userLoading) {
    return (
      <div className="container py-5 text-center">
        <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
        <p className="mt-3 fs-5">Vérification des permissions...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 px-4">
      {/* Toast Container pour les notifications */}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
        <Toast show={showToast} onClose={() => setShowToast(false)} bg={toastVariant} delay={5000} autohide>
          <Toast.Header closeButton={true}>
            <strong className="me-auto">
              {toastVariant === 'success' && <FaCheckCircle className="me-2 text-success" />}
              {toastVariant === 'danger' && <FaExclamationTriangle className="me-2 text-danger" />}
              {toastVariant === 'info' && <FaSpinner className="me-2 text-info" />}
              Notification
            </strong>
          </Toast.Header>
          <Toast.Body className={toastVariant === 'success' ? 'text-white' : ''}>
            {toastMessage}
          </Toast.Body>
        </Toast>
      </ToastContainer>

      {/* En-tête avec badge de rôle */}
      <Card className="shadow-sm mb-4 border-0">
        <Card.Body className="bg-gradient bg-primary text-white rounded-3">
          <Row className="align-items-center">
            <Col>
              <h1 className="fw-bold mb-2">
                <FaFilePdf className="me-3" />
                Procédures de la Direction Générale
              </h1>
              <p className="mb-0 opacity-75">
                Gestion des procédures et documents DRH
              </p>
            </Col>
            <Col xs="auto">
              <div className="d-flex align-items-center gap-3">
                {/* Badge de rôle */}
                <Badge bg={canEdit() ? 'success' : 'secondary'} className="py-2 px-3 fs-6">
                  {isAdmin() ? <><FaUserShield className="me-2" /> Administrateur</> :
                   isDAA() ? <><FaUserShield className="me-2" /> DRH</> :
                   <><FaUser className="me-2" /> Consultation</>}
                </Badge>
                
                {/* Bouton Rafraîchir */}
                <Button 
                  variant="outline-light" 
                  onClick={refreshData}
                  className="d-flex align-items-center px-3 py-2"
                  disabled={loading || operationLoading}
                  title="Actualiser les données"
                >
                  <FaSync className={loading ? "fa-spin" : ""} />
                </Button>
                
                {/* Bouton Ajouter - Admin ou DRH uniquement */}
                {canEdit() ? (
                  <Button 
                    variant="light" 
                    onClick={() => setShowAddModal(true)}
                    className="d-flex align-items-center px-4 py-2"
                    disabled={operationLoading}
                  >
                    <FaPlus className="me-2" />
                    Nouvelle procédure
                  </Button>
                ) : (
                  <Button 
                    variant="outline-light" 
                    className="d-flex align-items-center px-4 py-2"
                    disabled
                    title="Ajout réservé aux administrateurs et DRH"
                  >
                    <FaPlus className="me-2" />
                    Ajouter
                    <FaLock className="ms-2" />
                  </Button>
                )}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Message d'erreur */}
      {errorMessage && (
        <Alert variant="danger" dismissible onClose={() => setErrorMessage("")} className="mb-4">
          <FaExclamationTriangle className="me-2" />
          <strong>Erreur :</strong> {errorMessage}
        </Alert>
      )}

      {/* Section des filtres */}
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-info text-white py-3">
          <h5 className="mb-0 d-flex align-items-center">
            <FaFilter className="me-2" />
            Recherche et filtres
          </h5>
        </Card.Header>
        <Card.Body>
          <Row className="g-3">
            {/* Recherche par description */}
            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  <FaSearch className="me-2" />
                  Rechercher
                </Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="Rechercher par description..."
                  />
                  {filters.search && (
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => setFilters(prev => ({ ...prev, search: "" }))}
                    >
                      ×
                    </Button>
                  )}
                </InputGroup>
              </Form.Group>
            </Col>

            {/* Filtre par date de début */}
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  <FaCalendarAlt className="me-2" />
                  Du
                </Form.Label>
                <Form.Control
                  type="date"
                  name="dateFrom"
                  value={filters.dateFrom}
                  onChange={handleFilterChange}
                />
              </Form.Group>
            </Col>

            {/* Filtre par date de fin */}
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  <FaCalendarAlt className="me-2" />
                  Au
                </Form.Label>
                <Form.Control
                  type="date"
                  name="dateTo"
                  value={filters.dateTo}
                  onChange={handleFilterChange}
                  min={filters.dateFrom}
                />
              </Form.Group>
            </Col>

            {/* Bouton réinitialiser */}
            <Col md={2} className="d-flex align-items-end">
              <Button 
                variant="outline-secondary" 
                onClick={resetFilters}
                className="w-100 py-2"
                disabled={!filters.search && !filters.dateFrom && !filters.dateTo}
              >
                Réinitialiser
              </Button>
            </Col>
          </Row>

          {/* Résumé des filtres actifs */}
          {(filters.search || filters.dateFrom || filters.dateTo) && (
            <div className="mt-3 p-2 bg-light rounded">
              <small className="text-muted">
                <strong>Filtres actifs :</strong>
                {filters.search && ` Recherche: "${filters.search}"`}
                {filters.dateFrom && ` Du: ${formatDate(filters.dateFrom)}`}
                {filters.dateTo && ` Au: ${formatDate(filters.dateTo)}`}
              </small>
              <div className="mt-1">
                <Badge bg="info" className="px-3 py-1">
                  {Array.isArray(filteredFiles) ? filteredFiles.length : 0} résultat(s) trouvé(s)
                </Badge>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Loading principal */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" style={{ width: '4rem', height: '4rem' }} />
          <p className="mt-3 fs-5">Chargement des procédures...</p>
        </div>
      ) : (
        /* Liste des procédures */
        <Card className="shadow-sm">
          <Card.Header className="bg-dark text-white py-3 d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <FaFilePdf className="me-2" />
              Liste des procédures
              <Badge bg="light" text="dark" className="ms-2 px-3 py-1">
                {Array.isArray(filteredFiles) ? filteredFiles.length : 0}
              </Badge>
            </h5>
            <div>
              <small className="text-light opacity-75">
                Total: {Array.isArray(files) ? files.length : 0} procédure(s)
              </small>
            </div>
          </Card.Header>
          
          {!Array.isArray(filteredFiles) || filteredFiles.length === 0 ? (
            <Card.Body className="text-center py-5">
              <div className="my-5">
                <FaFilePdf size={48} className="text-muted mb-3" />
                <h5 className="text-muted">
                  {!Array.isArray(files) || files.length === 0 
                    ? "Aucune procédure disponible pour le moment." 
                    : "Aucune procédure ne correspond aux filtres appliqués."}
                </h5>
                {Array.isArray(files) && files.length > 0 && (
                  <Button variant="outline-info" onClick={resetFilters} className="mt-3">
                    Réinitialiser les filtres
                  </Button>
                )}
              </div>
            </Card.Body>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-striped mb-0">
                <thead className="table-light">
                  <tr>
                    <th width="5%" className="text-center">#</th>
                    <th width="45%">Description</th>
                    <th width="15%">Date</th>
                    <th width="15%">Catégorie</th>
                    <th width="20%" className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map((file, index) => {
                    // ✅ Vérification de sécurité
                    if (!file) return null;
                    
                    return (
                      <tr key={generateUniqueKey(file, index)} className="align-middle">
                        <td className="text-center fw-bold text-muted">{index + 1}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <FaFilePdf className="me-2 text-danger flex-shrink-0" />
                            <span className="fw-medium">{file.description || "Sans description"}</span>
                          </div>
                        </td>
                        <td>
                          <Badge bg="secondary" pill>
                            {formatDate(file.date)}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg="info" pill>
                            {file.category || "DRH"}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-2 justify-content-center">
                            {/* Vue PDF */}
                            <Button
                              variant="outline-primary"
                              size="sm"
                              title="Voir le PDF"
                              onClick={() => handleViewPdf(file.id)}
                              disabled={operationLoading}
                            >
                              <FaEye />
                            </Button>
                            
                            {/* Téléchargement */}
                            <Button
                              variant="outline-success"
                              size="sm"
                              title="Télécharger le PDF"
                              onClick={() => handleDownload(file.id, `procedure-${file.id}.pdf`)}
                              disabled={operationLoading}
                            >
                              <FaDownload />
                            </Button>
                            
                            {/* Édition - Admin ou DRH uniquement */}
                            {canEdit() ? (
                              <Button
                                variant="outline-warning"
                                size="sm"
                                title="Modifier"
                                onClick={() => openEditModal(file)}
                                disabled={operationLoading}
                              >
                                <FaEdit />
                              </Button>
                            ) : (
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                disabled
                                title="Modification réservée aux administrateurs et DRH"
                              >
                                <FaLock />
                              </Button>
                            )}
                            
                            {/* Suppression - Admin ou DRH uniquement */}
                            {canEdit() ? (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                title="Supprimer"
                                onClick={() => openDeleteModal(file.id, file.description)}
                                disabled={operationLoading}
                              >
                                <FaTrash />
                              </Button>
                            ) : (
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                disabled
                                title="Suppression réservée aux administrateurs et DRH"
                              >
                                <FaLock />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Modal d'ajout */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg" centered backdrop="static">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <FaPlus className="me-2" />
            Ajouter une nouvelle procédure
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Description <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="description"
                value={addFormData.description}
                onChange={handleAddChange}
                required
                maxLength="255"
                placeholder="Entrez la description de la procédure"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Date <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="date"
                name="date"
                value={addFormData.date}
                onChange={handleAddChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Catégorie</Form.Label>
              <Form.Control
                type="text"
                value={addFormData.category}
                readOnly
                className="bg-light"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Fichier PDF <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="file"
                name="file"
                accept=".pdf,application/pdf"
                onChange={handleAddChange}
                required
              />
              <Form.Text className="text-muted">
                Format accepté : PDF uniquement. Taille maximale : 10MB
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => {
              setShowAddModal(false);
              resetAddForm();
            }} disabled={operationLoading}>
              Annuler
            </Button>
            <Button variant="primary" type="submit" disabled={operationLoading}>
              {operationLoading ? (
                <>
                  <Spinner as="span" size="sm" animation="border" className="me-2" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <FaPlus className="me-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal de modification */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered backdrop="static">
        <Modal.Header closeButton className="bg-warning">
          <Modal.Title>
            <FaEdit className="me-2" />
            Modifier la procédure
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Description <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="description"
                value={editFormData.description}
                onChange={handleEditChange}
                required
                maxLength="255"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Date <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="date"
                name="date"
                value={editFormData.date}
                onChange={handleEditChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Fichier PDF actuel</Form.Label>
              <div className="alert alert-info p-3 d-flex align-items-center">
                <FaFilePdf className="me-3 text-danger" size={24} />
                <div className="flex-grow-1">
                  <strong>{editFormData.currentFileName}</strong>
                  {editFormData.currentFileUrl && (
                    <div className="mt-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => window.open(editFormData.currentFileUrl, '_blank')}
                      >
                        <FaEye className="me-1" /> Voir
                      </Button>
                      <Button
                        variant="outline-success"
                        size="sm"
                        className="ms-2"
                        onClick={() => handleDownload(editFormData.id, editFormData.currentFileName)}
                      >
                        <FaDownload className="me-1" /> Télécharger
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <Form.Text className="text-muted">
                Le fichier actuel sera conservé si aucun nouveau fichier n'est sélectionné.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Nouveau fichier PDF (optionnel)</Form.Label>
              <Form.Control
                type="file"
                name="file"
                accept=".pdf,application/pdf"
                onChange={handleEditChange}
              />
              <Form.Text className="text-muted">
                Sélectionnez un nouveau fichier pour remplacer l'actuel. Format : PDF uniquement. Taille max : 10MB
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={operationLoading}>
              Annuler
            </Button>
            <Button variant="warning" type="submit" disabled={operationLoading}>
              {operationLoading ? (
                <>
                  <Spinner as="span" size="sm" animation="border" className="me-2" />
                  Modification...
                </>
              ) : (
                <>
                  <FaEdit className="me-2" />
                  Modifier
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal de suppression */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>
            <FaTrash className="me-2" />
            Confirmer la suppression
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center py-3">
            <FaExclamationTriangle size={48} className="text-warning mb-3" />
            <h5>Êtes-vous sûr de vouloir supprimer cette procédure ?</h5>
            <p className="text-muted mt-2">
              <strong>"{deleteDescription}"</strong>
            </p>
            <p className="text-danger mt-3">
              <small>Cette action est irréversible. Le fichier PDF associé sera également supprimé du serveur.</small>
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={operationLoading}>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={operationLoading}>
            {operationLoading ? (
              <>
                <Spinner as="span" size="sm" animation="border" className="me-2" />
                Suppression...
              </>
            ) : (
              <>
                <FaTrash className="me-2" />
                Supprimer
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DRHProcedures;