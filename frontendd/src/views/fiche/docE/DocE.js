import React, { useEffect, useState } from "react";
import * as XLSX from 'xlsx';
import {
  Button,
  Card,
  Modal,
  Form,
  Alert,
  Spinner,
  Table,
  Pagination,
  Container,
  Row,
  Col,
  ButtonGroup,
  Badge
} from "react-bootstrap";
import {
  FaList, FaPlus, FaEdit, FaTrash,
  FaFileExcel, FaSave, FaTimes,
  FaCheckCircle, FaExclamationCircle,
  FaPrint, FaSearch, FaEye, FaCar,
  FaCalendarAlt, FaExclamationTriangle,
  FaFilePdf, FaFileImage, FaIdCard, FaClipboardCheck,
  FaDownload, FaFileWord, FaFileAlt, FaLock
} from 'react-icons/fa';
import axios from 'axios';


const API_BASE_URL = "https://intranet-attm.com/api";
const AUTH_API_URL = `${API_BASE_URL}/doc-tecs`;

// Création de l'instance Axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const customStyles = `
.document-card {
  transition: all 0.3s ease;
  border-radius: 10px;
  border: 1px solid #e0e0e0;
}
.document-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}
.print-header {
  display: none;
}
@media print {
  .no-print {
    display: none !important;
  }
  .print-header {
    display: block;
    text-align: center;
    margin-bottom: 20px;
    border-bottom: 2px solid #000;
    padding-bottom: 10px;
  }
}
.status-expired {
  background-color: #dc3545 !important;
  color: white;
}
.status-warning {
  background-color: #ffc107 !important;
  color: #212529;
}
.status-valid {
  background-color: #28a745 !important;
  color: white;
}
.status-na {
  background-color: #6c757d !important;
  color: white;
}
.filter-active {
  background-color: #e3f2fd;
  border-left: 4px solid #2196f3;
}
.expiring-soon {
  background-color: #fff3cd !important;
}
.expired-doc {
  background-color: #f8d7da !important;
}
`;

const documentTypeIcons = {
  assurance: <FaFilePdf className="text-primary document-type-icon" />,
  carte_grise: <FaFileImage className="text-success document-type-icon" />,
  controle_technique: <FaClipboardCheck className="text-warning document-type-icon" />,
  permis_de_conduire: <FaIdCard className="text-info document-type-icon" />,
  autre: <FaFileAlt className="text-secondary document-type-icon" />
};

const GestionDocumentsVoiture = () => {
  // États pour les données
  const [voitures, setVoitures] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0
  });
  
  // États pour l'UI
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  
  // ✅ État pour la recherche de voiture
  const [searchVoiture, setSearchVoiture] = useState('');
  const [showVoitureDropdown, setShowVoitureDropdown] = useState(false);
  const [filteredVoitures, setFilteredVoitures] = useState([]);
  
  // ✅ GESTION DES RÔLES
  const [userRole, setUserRole] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  // Filtres
  const [filters, setFilters] = useState({
    voiture: '',
    search: '',
    type_document: '',
    status: ''
  });

  // Formulaire
  const [formData, setFormData] = useState({
    id: null,
    voiture_id: "",
    type_document: "",
    date_obtention: new Date().toISOString().split('T')[0],
    date_expiration: "",
    fichier: null,
    commentaire: ""
  });

  const documentTypes = [
    { value: 'assurance', label: 'Assurance', color: 'primary' },
    { value: 'carte_grise', label: 'Carte Grise', color: 'success' },
    { value: 'controle_technique', label: 'Contrôle Technique', color: 'warning' },
    { value: 'permis_de_conduire', label: 'Permis de Conduire', color: 'info' },
    { value: 'autre', label: 'Autre', color: 'secondary' }
  ];

  const statusOptions = [
    { value: 'valid', label: 'Valide', color: 'success' },
    { value: 'warning', label: 'Bientôt expiré', color: 'warning' },
    { value: 'expired', label: 'Expiré', color: 'danger' }
  ];

  // ✅ Vérifier si l'utilisateur peut TOUT faire (admin ou chef_docDm)
  const canEdit = () => {
    const allowedRoles = ['admin', 'Admin', 'ADMIN', 'chef_docDm', 'chef_docdm', 'ChefDocDm'];
    return allowedRoles.includes(userRole);
  };

  // ✅ Vérifier si l'utilisateur est admin
  const isAdmin = () => {
    const adminRoles = ['admin', 'Admin', 'ADMIN'];
    return adminRoles.includes(userRole);
  };

  // ✅ Fonction pour filtrer les voitures
  const filterVoitures = (searchTerm) => {
    if (!searchTerm.trim()) {
      setFilteredVoitures([]);
      setShowVoitureDropdown(false);
      return;
    }
    
    const filtered = voitures.filter(v => 
      v.matricule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.type_voiture?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredVoitures(filtered);
    setShowVoitureDropdown(true);
  };

  // ✅ Gestion de la sélection d'une voiture
  const selectVoiture = (voiture) => {
    setFormData(prev => ({ ...prev, voiture_id: voiture.id }));
    setSearchVoiture(`${voiture.matricule} - ${voiture.type_voiture}`);
    setShowVoitureDropdown(false);
  };

  // ✅ Gestion du changement dans le champ de recherche
  const handleVoitureSearch = (e) => {
    const value = e.target.value;
    setSearchVoiture(value);
    filterVoitures(value);
    
    // Si le champ est vide, réinitialiser la sélection
    if (!value.trim()) {
      setFormData(prev => ({ ...prev, voiture_id: "" }));
    }
  };

  // ✅ Charger le rôle utilisateur
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

  // Fonctions API
  const fetchVoitures = async () => {
    try {
      const response = await api.get('/voitures');
      setVoitures(response.data);
    } catch (error) {
      console.error("Erreur fetchVoitures:", error);
      setErrorMessage("Erreur lors du chargement des voitures");
    }
  };

  const fetchDocuments = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('per_page', pagination.per_page);
      params.append('page', page);
      
      if (filters.voiture) params.append('voiture_id', filters.voiture);
      if (filters.type_document) params.append('type_document', filters.type_document);
      if (filters.search) params.append('search', filters.search);
      
      if (filters.status === 'expired') {
        params.append('expires', 'true');
      } else if (filters.status === 'valid') {
        params.append('expires', 'false');
      } else if (filters.status === 'warning') {
        params.append('expire_bientot', 'true');
      }

      const response = await api.get('/doc-tecs', { params });

      if (response.data && response.data.success && response.data.data) {
        setDocuments(response.data.data.data || []);
        setPagination({
          current_page: response.data.data.current_page || 1,
          last_page: response.data.data.last_page || 1,
          per_page: response.data.data.per_page || 10,
          total: response.data.data.total || 0
        });
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error("Erreur fetchDocuments:", error);
      setErrorMessage("Erreur lors du chargement des documents");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  // Charger les données
  useEffect(() => {
    if (!userLoading) {
      fetchVoitures();
      fetchDocuments(pagination.current_page);
    }
  }, [filters, userLoading]);

  const handlePageChange = (page) => {
    fetchDocuments(page);
  };

  // ==================== FONCTIONS POUR LES FICHIERS ====================
  
  const getFileName = (fileUrl) => {
    if (!fileUrl) return 'document';
    const parts = fileUrl.split('/');
    return parts[parts.length - 1];
  };

  // ✅ Visualisation (réservée aux admin et chef_docDm)
  const handleViewDocument = async (docId) => {
    if (!canEdit()) {
      setErrorMessage("Vous n'avez pas les droits pour visualiser ce document");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
    try {
      const apiUrl = `${AUTH_API_URL}/${docId}/view`;
      window.open(apiUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error("Erreur d'ouverture:", error);
      setErrorMessage("Impossible d'ouvrir le document.");
      setTimeout(() => setErrorMessage(""), 5000);
    }
  };

  // ✅ Téléchargement (réservé aux admin et chef_docDm)
  const handleDownloadDocument = async (docId, fileName = null) => {
    if (!canEdit()) {
      setErrorMessage("Vous n'avez pas les droits pour télécharger ce document");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
    try {
      const downloadUrl = `${AUTH_API_URL}/${docId}/download`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName || `document_${docId}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Erreur de téléchargement:", error);
      setErrorMessage("Erreur lors du téléchargement");
      setTimeout(() => setErrorMessage(""), 5000);
    }
  };

  // ==================== AUTRES FONCTIONS ====================

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch (error) {
      return "Date invalide";
    }
  };

  const getDocumentStatus = (expirationDate) => {
    if (!expirationDate) return { label: "N/A", value: "na", class: "status-na" };
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expDate = new Date(expirationDate);
      expDate.setHours(0, 0, 0, 0);
      const daysRemaining = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
      if (expDate < today) {
        return { label: "EXPIRÉ", value: "expired", class: "status-expired" };
      } else if (daysRemaining <= 30) {
        return { label: "À RENOUVELER", value: "warning", class: "status-warning" };
      } else {
        return { label: "VALIDE", value: "valid", class: "status-valid" };
      }
    } catch (error) {
      return { label: "ERREUR", value: "error", class: "status-na" };
    }
  };

  const validateForm = () => {
    setFormError("");
    const errors = [];
    if (!formData.voiture_id) errors.push("La voiture est obligatoire");
    if (!formData.type_document) errors.push("Le type de document est obligatoire");
    if (!formData.date_obtention) errors.push("La date d'obtention est obligatoire");
    if (!editMode && !formData.fichier) errors.push("Le fichier est obligatoire pour un nouveau document");
    if (errors.length > 0) {
      setFormError(errors.join(', '));
      return false;
    }
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, fichier: file }));
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  // ✅ Ajout (réservé aux admin et chef_docDm)
  const handleAdd = () => {
    if (!canEdit()) {
      setErrorMessage("Vous n'avez pas les droits pour ajouter un document");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
    setFormData({
      id: null,
      voiture_id: "",
      type_document: "",
      date_obtention: new Date().toISOString().split('T')[0],
      date_expiration: "",
      fichier: null,
      commentaire: ""
    });
    setSearchVoiture("");
    setModalTitle("Ajouter un document");
    setEditMode(false);
    setShowModal(true);
    setFormError("");
  };

  // ✅ Modification (réservé aux admin et chef_docDm)
  const handleEdit = (document) => {
    if (!canEdit()) {
      setErrorMessage("Vous n'avez pas les droits pour modifier ce document");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
    const voiture = voitures.find(v => v.id === (document.voiture?.id || document.voiture_id));
    setSearchVoiture(voiture ? `${voiture.matricule} - ${voiture.type_voiture}` : "");
    setFormData({
      id: document.id,
      voiture_id: document.voiture?.id || document.voiture_id || "",
      type_document: document.type_document || "",
      date_obtention: document.date_obtention ? document.date_obtention.split('T')[0] : new Date().toISOString().split('T')[0],
      date_expiration: document.date_expiration ? document.date_expiration.split('T')[0] : "",
      fichier: null,
      commentaire: document.commentaire || ""
    });
    setModalTitle("Modifier le document");
    setEditMode(true);
    setShowModal(true);
    setFilePreview(null);
    setFormError("");
  };

  // ✅ Suppression (réservé aux admin et chef_docDm)
  const handleDelete = async (id) => {
    if (!canEdit()) {
      setErrorMessage("Vous n'avez pas les droits pour supprimer ce document");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) return;
    try {
      const response = await api.delete(`/doc-tecs/${id}`);
      if (response.data.success) {
        setSuccessMessage("Document supprimé avec succès");
        setTimeout(() => setSuccessMessage(""), 5000);
        fetchDocuments(pagination.current_page);
      } else {
        throw new Error(response.data.message || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur handleDelete:", error);
      setErrorMessage(error.response?.data?.message || error.message);
      setTimeout(() => setErrorMessage(""), 5000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit()) {
      setErrorMessage("Vous n'avez pas les droits pour effectuer cette action");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
    if (!validateForm()) return;
    setFormLoading(true);
    setFormError("");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('voiture_id', formData.voiture_id);
      formDataToSend.append('type_document', formData.type_document);
      formDataToSend.append('date_obtention', formData.date_obtention);
      
      if (formData.date_expiration) {
        formDataToSend.append('date_expiration', formData.date_expiration);
      }
      
      formDataToSend.append('commentaire', formData.commentaire || '');

      if (formData.fichier) {
        if (formData.fichier instanceof File) {
          formDataToSend.append('fichier', formData.fichier);
        }
      }

      let response;
      if (editMode) {
        response = await api.post(`/doc-tecs/${formData.id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
          params: { _method: 'PUT' }
        });
      } else {
        response = await api.post('/doc-tecs', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (response.data.success) {
        setSuccessMessage(`Document ${editMode ? 'modifié' : 'ajouté'} avec succès`);
        setTimeout(() => setSuccessMessage(""), 5000);
        fetchDocuments(pagination.current_page);
        handleCloseModal();
      } else {
        throw new Error(response.data.message || "Erreur lors de l'opération");
      }
    } catch (error) {
      console.error("Erreur handleSubmit:", error);
      setFormError(error.response?.data?.message || error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFilePreview(null);
    setFormError("");
    setSearchVoiture("");
    setShowVoitureDropdown(false);
  };

  const resetFilters = () => {
    setFilters({
      voiture: '',
      search: '',
      type_document: '',
      status: ''
    });
  };

  const exportToExcel = () => {
    try {
      const data = documents.map(doc => {
        const status = getDocumentStatus(doc.date_expiration);
        return {
          'Matricule': doc.voiture?.matricule || "-",
          'Type Voiture': doc.voiture?.type_voiture || "-",
          'Type Document': documentTypes.find(t => t.value === doc.type_document)?.label || doc.type_document,
          'Date Obtention': doc.date_obtention ? formatDate(doc.date_obtention) : "-",
          'Date Expiration': doc.date_expiration ? formatDate(doc.date_expiration) : "-",
          'Statut': status.label,
          'Commentaire': doc.commentaire || "-"
        };
      });
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "DocumentsVoiture");
      XLSX.writeFile(wb, `Documents_Voiture_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error("Erreur exportToExcel:", error);
      setErrorMessage("Erreur lors de l'export Excel");
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const startPage = Math.max(1, pagination.current_page - 2);
    const endPage = Math.min(pagination.last_page, pagination.current_page + 2);
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Pagination.Item
          key={i}
          active={i === pagination.current_page}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Pagination.Item>
      );
    }
    return pages;
  };

  const isFilterActive = Object.values(filters).some(value => value !== '');

  if (userLoading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Vérification des permissions...</p>
      </Container>
    );
  }

  return (
    <>
      <style>{customStyles}</style>
      <Container fluid="lg" className="py-4">
        <div className="print-header">
          <h4>Liste des Documents de Voiture</h4>
          <p className="text-muted">Généré le {new Date().toLocaleDateString('fr-FR')}</p>
          <hr />
        </div>

        {/* Messages d'alerte */}
        {errorMessage && (
          <Alert variant="danger" dismissible onClose={() => setErrorMessage("")} className="no-print">
            <FaExclamationCircle className="me-2" />
            {errorMessage}
          </Alert>
        )}
        {successMessage && (
          <Alert variant="success" dismissible onClose={() => setSuccessMessage("")} className="no-print">
            <FaCheckCircle className="me-2" />
            {successMessage}
          </Alert>
        )}

        {/* En-tête avec badge de rôle */}
        <Card className="mb-4 shadow-sm no-print">
          <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <FaCar className="me-3 fs-4" />
              <div>
                <h4 className="mb-0">Gestion des Documents des équipements</h4>
                <small>Gérez tous les documents techniques de votre flotte automobile</small>
              </div>
            </div>
            <div className="d-flex align-items-center gap-3">
              <Badge bg={canEdit() ? "warning" : "secondary"} className="fs-6 py-2 px-3">
                {canEdit() ? (
                  <> {isAdmin() ? "" : ""} - Droits complets</>
                ) : (
                  <><FaLock className="me-1" /> Lecture seule - Aucune action disponible</>
                )}
              </Badge>
              {canEdit() && (
                <Button variant="light" onClick={handleAdd} className="fw-bold">
                  <FaPlus className="me-2" />Nouveau document
                </Button>
              )}
            </div>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label><FaCar className="me-2" />Équipement</Form.Label>
                  <Form.Select
                    value={filters.voiture}
                    onChange={(e) => setFilters({...filters, voiture: e.target.value})}
                  >
                    <option value="">Tous les équipements</option>
                    {voitures.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.matricule} - {v.type_voiture}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Type de document</Form.Label>
                  <Form.Select
                    value={filters.type_document}
                    onChange={(e) => setFilters({...filters, type_document: e.target.value})}
                  >
                    <option value="">Tous les types</option>
                    {documentTypes.map((type, index) => (
                      <option key={index} value={type.value}>{type.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label><FaSearch className="me-2" />Recherche</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Rechercher..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Statut</Form.Label>
                  <Form.Select
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                  >
                    <option value="">Tous les statuts</option>
                    {statusOptions.map((status, index) => (
                      <option key={index} value={status.value}>{status.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex justify-content-end">
              <Button variant="outline-danger" onClick={resetFilters}>
                <FaTimes className="me-2" />Réinitialiser
              </Button>
            </div>
          </Card.Body>
        </Card>

        {/* Carte principale */}
        <Card className="shadow-sm document-card">
          <Card.Header className="bg-light d-flex justify-content-between align-items-center">
            <h5 className="mb-0 text-dark">
              <FaList className="me-2" />
              Liste des Documents
              <Badge bg="secondary" className="ms-2">
                {pagination.total}
              </Badge>
            </h5>
            <div className="no-print">
              <Button variant="outline-success" onClick={exportToExcel} className="me-2">
                <FaFileExcel className="me-2" />Excel
              </Button>
              <Button variant="outline-primary" onClick={() => window.print()}>
                <FaPrint className="me-2" />Imprimer
              </Button>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Chargement des documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-5">
                <FaList className="fa-4x text-muted mb-4" />
                <h5 className="text-muted">Aucun document trouvé</h5>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <div className="table-responsive">
  <Table striped bordered hover className="mb-0">
    <thead className="bg-dark text-white">
      <tr>
        <th>Équipement</th>
        <th>Type Document</th>
        <th>Date Obtention</th>
        <th>Date Expiration</th>
        <th>Statut</th>
        <th>Commentaire</th>
        <th className="no-print">Actions</th>
      </tr>
    </thead>
    <tbody>
      {documents && documents.length > 0 ? (
        documents.map((doc) => {
          // Vérification de sécurité pour éviter les erreurs
          if (!doc) return null;
          
          const status = getDocumentStatus(doc.date_expiration);
          const voitureMatricule = doc.voiture?.matricule || doc.matricule || "-";
          const voitureType = doc.voiture?.type_voiture || doc.type_voiture || "-";
          const documentType = documentTypes.find(t => t.value === doc.type_document);
          const documentTypeLabel = documentType?.label || doc.type_document || "-";
          const hasExpiration = doc.date_expiration && doc.date_expiration !== "";
          
          return (
            <tr key={doc.id || Math.random()}>
              <td>
                <strong>{voitureMatricule}</strong>
                {voitureType !== "-" && (
                  <>
                    <br />
                    <small className="text-muted">{voitureType}</small>
                  </>
                )}
              </td>
              <td>
                <div className="d-flex align-items-center">
                  {documentTypeIcons[doc.type_document] || <FaFileAlt className="text-secondary me-2" />}
                  {documentTypeLabel}
                </div>
              </td>
              <td>{formatDate(doc.date_obtention)}</td>
              <td>
                {hasExpiration ? (
                  <div>
                    <span>{formatDate(doc.date_expiration)}</span>
                    {status.value === 'warning' && (
                      <small className="d-block text-warning">
                        <FaExclamationTriangle className="me-1" size={12} />
                        Expire bientôt
                      </small>
                    )}
                    {status.value === 'expired' && (
                      <small className="d-block text-danger">
                        <FaExclamationCircle className="me-1" size={12} />
                        Expiré
                      </small>
                    )}
                  </div>
                ) : (
                  <span className="text-muted">-</span>
                )}
              </td>
              <td>
                <Badge pill className={status.class || "status-na"}>
                  {status.label || "N/A"}
                </Badge>
              </td>
              <td className="text-muted" style={{ maxWidth: '200px' }}>
                {doc.commentaire ? (
                  doc.commentaire.length > 50 
                    ? <span title={doc.commentaire}>{doc.commentaire.substring(0, 50)}...</span>
                    : doc.commentaire
                ) : "-"}
              </td>
              <td className="text-center no-print" style={{ minWidth: '180px' }}>
                {canEdit() ? (
                  <div className="d-flex justify-content-center gap-1 flex-wrap">
                    <Button
                      variant="outline-info"
                      size="sm"
                      onClick={() => handleViewDocument(doc.id)}
                      title="Visualiser le document"
                    >
                      <FaEye />
                    </Button>
                    <Button
                      variant="outline-success"
                      size="sm"
                      onClick={() => handleDownloadDocument(doc.id, getFileName(doc.fichier_url))}
                      title="Télécharger le document"
                    >
                      <FaDownload />
                    </Button>
                    <Button
                      variant="outline-warning"
                      size="sm"
                      onClick={() => handleEdit(doc)}
                      title="Modifier le document"
                    >
                      <FaEdit />
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                      title="Supprimer le document"
                    >
                      <FaTrash />
                    </Button>
                  </div>
                ) : (
                  <span className="text-muted" title="Lecture seule - Aucune action disponible">
                    <FaLock size={16} />
                  </span>
                )}
              </td>
            </tr>
          );
        })
      ) : (
        <tr>
          <td colSpan="7" className="text-center py-5">
            <FaList className="fa-3x text-muted mb-3" />
            <h5 className="text-muted">Aucun document trouvé</h5>
            <p className="text-muted mb-0">
              {isFilterActive 
                ? "Aucun document ne correspond aux critères de recherche."
                : "Aucun document n'a été enregistré pour le moment."}
            </p>
            {canEdit() && !isFilterActive && (
              <Button variant="primary" size="sm" onClick={handleAdd} className="mt-3">
                <FaPlus className="me-2" />Ajouter un document
              </Button>
            )}
          </td>
        </tr>
      )}
    </tbody>
  </Table>
</div>
                </div>
                {pagination.last_page > 1 && (
                  <div className="d-flex justify-content-center mt-3 p-3 no-print">
                    <Pagination>
                      <Pagination.First onClick={() => handlePageChange(1)} disabled={pagination.current_page === 1} />
                      <Pagination.Prev onClick={() => handlePageChange(pagination.current_page - 1)} disabled={pagination.current_page === 1} />
                      {getPageNumbers()}
                      <Pagination.Next onClick={() => handlePageChange(pagination.current_page + 1)} disabled={pagination.current_page === pagination.last_page} />
                      <Pagination.Last onClick={() => handlePageChange(pagination.last_page)} disabled={pagination.current_page === pagination.last_page} />
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </Card.Body>
        </Card>

        {/* Modal pour ajouter/modifier un document */}
        {showModal && canEdit() && (
          <Modal show={showModal} onHide={handleCloseModal} backdrop="static" size="lg" centered className="no-print">
            <Modal.Header closeButton className="bg-primary text-white">
              <Modal.Title>
                <FaCar className="me-2" />
                {modalTitle}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {formError && (
                <Alert variant="danger" onClose={() => setFormError("")} dismissible>
                  <FaExclamationCircle className="me-2" />
                  {formError}
                </Alert>
              )}
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    {/* ✅ NOUVEAU CHAMP DE RECHERCHE DE VOITURE AVEC AUTOCOMPLÉTION */}
                    <Form.Group className="mb-3">
                      <Form.Label>Voiture <span className="text-danger">*</span></Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type="text"
                          placeholder="Tapez le matricule ou le type de voiture..."
                          value={searchVoiture}
                          onChange={handleVoitureSearch}
                          onFocus={() => searchVoiture.trim() && filterVoitures(searchVoiture)}
                          required={!formData.voiture_id}
                          className={!formData.voiture_id && searchVoiture ? 'is-invalid' : ''}
                        />
                        {showVoitureDropdown && filteredVoitures.length > 0 && (
                          <div className="position-absolute w-100 bg-white border rounded shadow-sm" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                            {filteredVoitures.map((v) => (
                              <div
                                key={v.id}
                                className="p-2 border-bottom"
                                style={{ cursor: 'pointer' }}
                                onClick={() => selectVoiture(v)}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                              >
                                <strong>{v.matricule}</strong> - {v.type_voiture}
                              </div>
                            ))}
                          </div>
                        )}
                        {showVoitureDropdown && filteredVoitures.length === 0 && searchVoiture && (
                          <div className="position-absolute w-100 bg-white border rounded shadow-sm p-2" style={{ zIndex: 1000 }}>
                            <span className="text-muted">Aucune voiture trouvée</span>
                          </div>
                        )}
                      </div>
                      {formData.voiture_id && searchVoiture && (
                        <Form.Text className="text-success">
                          ✓ Voiture sélectionnée
                        </Form.Text>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Type de document <span className="text-danger">*</span></Form.Label>
                      <Form.Select
                        name="type_document"
                        value={formData.type_document}
                        onChange={handleChange}
                        required
                      >
                        <option value="">-- Sélectionner un type --</option>
                        {documentTypes.map((type, index) => (
                          <option key={index} value={type.value}>{type.label}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Date d'obtention <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="date"
                        name="date_obtention"
                        value={formData.date_obtention}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Date d'expiration</Form.Label>
                      <Form.Control
                        type="date"
                        name="date_expiration"
                        value={formData.date_expiration}
                        onChange={handleChange}
                      />
                      <Form.Text className="text-muted">
                        Optionnel - laisser vide si pas d'expiration
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Fichier du document {!editMode && <span className="text-danger">*</span>}
                  </Form.Label>
                  <Form.Control
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileChange}
                    required={!editMode}
                  />
                  <Form.Text className="text-muted">
                    Formats acceptés: PDF, JPG, JPEG, PNG, DOC, DOCX (max 20MB)
                  </Form.Text>
                  {filePreview && (
                    <div className="mt-2">
                      <img src={filePreview} alt="Aperçu" style={{ maxWidth: '200px', maxHeight: '150px', border: '1px solid #ddd', borderRadius: '4px' }} />
                    </div>
                  )}
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Commentaire</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="commentaire"
                    value={formData.commentaire}
                    onChange={handleChange}
                    placeholder="Saisissez des commentaires ou remarques sur ce document..."
                  />
                </Form.Group>
                <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                  <Button variant="outline-secondary" onClick={handleCloseModal} className="me-3">
                    <FaTimes className="me-2" />Annuler
                  </Button>
                  <Button type="submit" variant="primary" disabled={formLoading}>
                    {formLoading ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <FaSave className="me-2" />
                        {editMode ? 'Mettre à jour' : 'Enregistrer'}
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal>
        )}
      </Container>
    </>
  );
};

export default GestionDocumentsVoiture;