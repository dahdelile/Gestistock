import React, { useEffect, useState } from "react";
import axios from 'axios';
import {
  Button, Card, Modal, Form, Alert, Spinner,
  Table, Container, Row, Col, Badge, Pagination
} from 'react-bootstrap';
import {
  FaPlus, FaEdit, FaTrash, FaDownload, FaSync,
  FaFile, FaCalendar, FaTimes, FaCheck,
  FaEye, FaFilePdf, FaFileImage, FaFileWord,
  FaExclamationCircle, FaList, FaPrint, FaSearch
} from 'react-icons/fa';
import * as XLSX from 'xlsx';

// ✅ URL CORRECTE - "organigrame" sans 'm'
const API_BASE_URL = "https://intranet-attm.com/api";
const ORGANIGRAME_URL = `${API_BASE_URL}/organigrame`;

// Configuration axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

// Intercepteur pour ajouter le token
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
  .organigramme-card {
    transition: all 0.3s ease;
    border-radius: 10px;
    border: 1px solid #e0e0e0;
  }
  .organigramme-card:hover {
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
`;

const getFileIcon = (fileName) => {
  if (!fileName) return <FaFile className="text-secondary" />;
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return <FaFilePdf className="text-danger" />;
  if (ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'gif') return <FaFileImage className="text-success" />;
  if (ext === 'doc' || ext === 'docx') return <FaFileWord className="text-primary" />;
  return <FaFile className="text-secondary" />;
};

const Organi = () => {
  // États pour les données
  const [organigrammes, setOrganigrammes] = useState([]);
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
  
  // Gestion des rôles
  const [userRole, setUserRole] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  
  // Filtres
  const [filters, setFilters] = useState({
    search: '',
    year: '',
    date_debut: '',
    date_fin: ''
  });
  
  // Formulaire
  const [formData, setFormData] = useState({
    id: null,
    discription: "",
    date: new Date().toISOString().split('T')[0],
    fichier: null
  });

  // Années disponibles
  const [availableYears, setAvailableYears] = useState([]);

  // ✅ Vérifier les droits utilisateur
  const canEdit = () => {
    const allowedRoles = ['admin', 'Admin', 'ADMIN', 'chef_docDm', 'chef_docdm', 'ChefDocDm'];
    return allowedRoles.includes(userRole);
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
  const fetchOrganigrammes = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('per_page', pagination.per_page);
      params.append('page', page);
      
      if (filters.search) params.append('search', filters.search);
      if (filters.year) params.append('annee', filters.year);
      if (filters.date_debut) params.append('date_debut', filters.date_debut);
      if (filters.date_fin) params.append('date_fin', filters.date_fin);
      
      const response = await api.get('/organigrame', { params });
      
      if (response.data && response.data.success && response.data.data) {
        setOrganigrammes(response.data.data);
        setPagination({
          current_page: response.data.current_page || 1,
          last_page: response.data.last_page || 1,
          per_page: response.data.per_page || 10,
          total: response.data.total || 0
        });
      } else if (Array.isArray(response.data)) {
        setOrganigrammes(response.data);
        setPagination({
          current_page: 1,
          last_page: 1,
          per_page: response.data.length,
          total: response.data.length
        });
      } else {
        setOrganigrammes([]);
      }
    } catch (error) {
      console.error("Erreur fetchOrganigrammes:", error);
      setErrorMessage("Erreur lors du chargement des organigrammes");
      setOrganigrammes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableYears = async () => {
    try {
      const response = await api.get('/organigrame/annees');
      if (response.data && response.data.success) {
        setAvailableYears(response.data.data || []);
      } else if (Array.isArray(response.data)) {
        setAvailableYears(response.data);
      }
    } catch (error) {
      console.error("Erreur fetchAvailableYears:", error);
    }
  };

  // Charger les données
  useEffect(() => {
    if (!userLoading) {
      fetchOrganigrammes();
      fetchAvailableYears();
    }
  }, [filters, userLoading]);

  const handlePageChange = (page) => {
    fetchOrganigrammes(page);
  };

  // ✅ Téléchargement du fichier - URL CORRECTE
  const handleDownload = async (organigrammeId, fileName = null) => {
    if (!canEdit()) {
      setErrorMessage("Vous n'avez pas les droits pour télécharger ce document");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
    try {
      // ✅ URL CORRECTE: /organigrame/{id}/download
      const downloadUrl = `${API_BASE_URL}/organigrame/${organigrammeId}/download`;
      console.log('URL de téléchargement:', downloadUrl);
      
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      
      // Méthode 1: Ouverture dans un nouvel onglet
      window.open(downloadUrl + '?token=' + encodeURIComponent(token || ''), '_blank');
      
      setSuccessMessage("Téléchargement lancé...");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Erreur de téléchargement:", error);
      setErrorMessage("Erreur lors du téléchargement");
      setTimeout(() => setErrorMessage(""), 5000);
    }
  };

  // ✅ Visualisation du fichier
  const handleView = async (organigrammeId) => {
    if (!canEdit()) {
      setErrorMessage("Vous n'avez pas les droits pour visualiser ce document");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
    try {
      const viewUrl = `${API_BASE_URL}/organigrame/${organigrammeId}/download`;
      window.open(viewUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error("Erreur d'ouverture:", error);
      setErrorMessage("Impossible d'ouvrir le document.");
      setTimeout(() => setErrorMessage(""), 5000);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return "Date invalide";
    }
  };

  const validateForm = () => {
    setFormError("");
    const errors = [];
    if (!formData.discription) errors.push("La description est obligatoire");
    if (!formData.date) errors.push("La date est obligatoire");
    if (!editMode && !formData.fichier) errors.push("Le fichier est obligatoire pour un nouvel organigramme");
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

  const handleAdd = () => {
    if (!canEdit()) {
      setErrorMessage("Vous n'avez pas les droits pour ajouter un organigramme");
      return;
    }
    setFormData({
      id: null,
      discription: "",
      date: new Date().toISOString().split('T')[0],
      fichier: null
    });
    setModalTitle("Ajouter un organigramme");
    setEditMode(false);
    setShowModal(true);
    setFormError("");
    setFilePreview(null);
  };

  const handleEdit = (organigramme) => {
    if (!canEdit()) {
      setErrorMessage("Vous n'avez pas les droits pour modifier cet organigramme");
      return;
    }
    setFormData({
      id: organigramme.id,
      discription: organigramme.discription || "",
      date: organigramme.date ? organigramme.date.split('T')[0] : new Date().toISOString().split('T')[0],
      fichier: null
    });
    setModalTitle("Modifier l'organigramme");
    setEditMode(true);
    setShowModal(true);
    setFilePreview(null);
    setFormError("");
  };

  const handleDelete = async (id) => {
    if (!canEdit()) {
      setErrorMessage("Vous n'avez pas les droits pour supprimer cet organigramme");
      return;
    }
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet organigramme ?")) return;
    try {
      await api.delete(`/organigrame/${id}`);
      setSuccessMessage("Organigramme supprimé avec succès");
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchOrganigrammes(pagination.current_page);
    } catch (error) {
      console.error("Erreur handleDelete:", error);
      setErrorMessage(error.response?.data?.message || "Erreur lors de la suppression");
      setTimeout(() => setErrorMessage(""), 5000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit()) {
      setErrorMessage("Vous n'avez pas les droits pour effectuer cette action");
      return;
    }
    if (!validateForm()) return;
    setFormLoading(true);
    setFormError("");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('discription', formData.discription);
      formDataToSend.append('date', formData.date);

      if (formData.fichier) {
        formDataToSend.append('file', formData.fichier);
      }

      let response;
      if (editMode) {
        formDataToSend.append('_method', 'PUT');
        response = await api.post(`/organigrame/${formData.id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await api.post('/organigrame', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (response.status === 200 || response.status === 201) {
        setSuccessMessage(`Organigramme ${editMode ? 'modifié' : 'ajouté'} avec succès`);
        setTimeout(() => setSuccessMessage(""), 3000);
        fetchOrganigrammes(pagination.current_page);
        handleCloseModal();
      } else {
        throw new Error(response.data?.message || "Erreur lors de l'opération");
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
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      year: '',
      date_debut: '',
      date_fin: ''
    });
  };

  const exportToExcel = () => {
    try {
      const data = organigrammes.map(org => ({
        'Description': org.discription || "-",
        'Date': org.date ? formatDate(org.date) : "-",
        'Fichier': org.file_name || "-"
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Organigrammes");
      XLSX.writeFile(wb, `Organigrammes_${new Date().toISOString().split('T')[0]}.xlsx`);
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
      <Container fluid className="py-4">
        {/* Messages d'alerte */}
        {errorMessage && (
          <Alert variant="danger" dismissible onClose={() => setErrorMessage("")} className="no-print mb-4">
            <FaExclamationCircle className="me-2" />
            {errorMessage}
          </Alert>
        )}
        {successMessage && (
          <Alert variant="success" dismissible onClose={() => setSuccessMessage("")} className="no-print mb-4">
            <FaCheck className="me-2" />
            {successMessage}
          </Alert>
        )}

        {/* En-tête */}
        <Card className="mb-4 shadow-sm no-print">
          <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <FaFile className="me-3 fs-4" />
              <div>
                <h4 className="mb-0">Gestion des Organigrammes</h4>
                <small>Gérez tous les organigrammes de l'entreprise</small>
              </div>
            </div>
            <div className="d-flex align-items-center gap-3">
              <Badge bg={canEdit() ? "warning" : "secondary"} className="fs-6 py-2 px-3">
                {canEdit() ? "Droits complets" : "Lecture seule"}
              </Badge>
              {canEdit() && (
                <Button variant="light" onClick={handleAdd}>
                  <FaPlus className="me-2" />Nouvel organigramme
                </Button>
              )}
            </div>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={4}>
                <Form.Group>
                  <Form.Label><FaSearch className="me-2" />Recherche</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Rechercher par description..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label><FaCalendar className="me-2" />Année</Form.Label>
                  <Form.Select
                    value={filters.year}
                    onChange={(e) => setFilters({...filters, year: e.target.value})}
                  >
                    <option value="">Toutes les années</option>
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Date début</Form.Label>
                  <Form.Control
                    type="date"
                    value={filters.date_debut}
                    onChange={(e) => setFilters({...filters, date_debut: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label>Date fin</Form.Label>
                  <Form.Control
                    type="date"
                    value={filters.date_fin}
                    onChange={(e) => setFilters({...filters, date_fin: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex justify-content-end mt-3">
              <Button variant="outline-danger" onClick={resetFilters}>
                <FaTimes className="me-2" />Réinitialiser
              </Button>
            </div>
          </Card.Body>
        </Card>

        {/* Tableau des organigrammes */}
        <Card className="shadow-sm">
          <Card.Header className="bg-light d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <FaList className="me-2" />
              Liste des Organigrammes
              <Badge bg="secondary" className="ms-2">{pagination.total}</Badge>
            </h5>
            <div className="no-print">
              <Button variant="outline-success" onClick={exportToExcel} className="me-2">
                <FaFile className="me-2" />Excel
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
                <p className="mt-3">Chargement des organigrammes...</p>
              </div>
            ) : organigrammes.length === 0 ? (
              <div className="text-center py-5">
                <FaFile className="fa-4x text-muted mb-4" />
                <h5>Aucun organigramme trouvé</h5>
                {canEdit() && (
                  <Button variant="primary" onClick={handleAdd} className="mt-3">
                    <FaPlus className="me-2" />Ajouter un organigramme
                  </Button>
                )}
              </div>
            ) : (
              <div className="table-responsive">
                <Table striped bordered hover className="mb-0">
                  <thead className="bg-dark text-white">
                    <tr>
                      <th>Description</th>
                      <th style={{ width: '150px' }}>Date</th>
                      <th style={{ width: '200px' }}>Fichier</th>
                      <th style={{ width: '140px' }} className="text-center no-print">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {organigrammes.map((org) => (
                      <tr key={org.id}>
                        <td className="fw-bold">{org.discription}</td>
                        <td>
                          <Badge bg="info" className="p-2">
                            <FaCalendar className="me-1" />
                            {formatDate(org.date)}
                          </Badge>
                        </td>
                        <td>
                          {org.file ? (
                            <div className="d-flex align-items-center">
                              {getFileIcon(org.file_name)}
                              <span className="ms-2">{org.file_name || 'Document'}</span>
                            </div>
                          ) : (
                            <span className="text-muted">Aucun fichier</span>
                          )}
                        </td>
                        <td className="text-center no-print">
                          {canEdit() ? (
                            <div className="d-flex justify-content-center gap-1">
                              {org.file && (
                                <>
                                  <Button
                                    variant="outline-info"
                                    size="sm"
                                    onClick={() => handleView(org.id)}
                                    title="Visualiser"
                                  >
                                    <FaEye />
                                  </Button>
                                  <Button
                                    variant="outline-success"
                                    size="sm"
                                    onClick={() => handleDownload(org.id, org.file_name)}
                                    title="Télécharger"
                                  >
                                    <FaDownload />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="outline-warning"
                                size="sm"
                                onClick={() => handleEdit(org)}
                                title="Modifier"
                              >
                                <FaEdit />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDelete(org.id)}
                                title="Supprimer"
                              >
                                <FaTrash />
                              </Button>
                            </div>
                          ) : (
                            <div className="d-flex justify-content-center">
                              {org.file && (
                                <Button
                                  variant="outline-info"
                                  size="sm"
                                  onClick={() => handleView(org.id)}
                                  title="Visualiser"
                                >
                                  <FaEye />
                                </Button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
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
          </Card.Body>
        </Card>

        {/* Modal */}
        {showModal && canEdit() && (
          <Modal show={showModal} onHide={handleCloseModal} backdrop="static" size="lg" centered>
            <Modal.Header closeButton className="bg-primary text-white">
              <Modal.Title>
                <FaFile className="me-2" />
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
                <Form.Group className="mb-3">
                  <Form.Label>Description <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="discription"
                    value={formData.discription}
                    onChange={handleChange}
                    placeholder="Entrez la description"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Fichier {!editMode && <span className="text-danger">*</span>}</Form.Label>
                  <Form.Control
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileChange}
                    required={!editMode}
                  />
                  <Form.Text className="text-muted">
                    Formats acceptés: PDF, JPG, PNG, DOC, DOCX (max 10MB)
                  </Form.Text>
                  {filePreview && (
                    <div className="mt-2">
                      <img src={filePreview} alt="Aperçu" style={{ maxWidth: '200px', maxHeight: '150px', border: '1px solid #ddd', borderRadius: '4px' }} />
                    </div>
                  )}
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
                        <FaCheck className="me-2" />
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
export default Organi;