import React, { useEffect, useState } from "react";
import axios from 'axios';
import { Modal, Button, Form, Alert, Spinner, Table, Card, Container, Row, Col, Badge } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaDownload, FaSync, FaFile, FaCalendar, FaInfoCircle, FaTimes, FaCheck } from 'react-icons/fa';

const API_BASE_URL = "https://intranet-attm.com/api";

const Organi = () => {
  const [files, setFiles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [downloading, setDownloading] = useState(false);
  const [formData, setFormData] = useState({
    discription: "",
    date: "",
    file: null,
  });

  // Configuration axios
  const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
      'Accept': 'application/json',
    }
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

  // Charger les données au démarrage
  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      
      const response = await api.get('/organigrame');
      console.log('Organigrammes reçus:', response.data);
      
      let filesData = [];
      if (response.data.success && Array.isArray(response.data.data)) {
        filesData = response.data.data;
      } else if (Array.isArray(response.data)) {
        filesData = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        filesData = response.data.data;
      }
      
      setFiles(filesData);
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      if (error.response) {
        setErrorMessage(`Erreur ${error.response.status}: ${error.response.data?.message || 'Impossible de charger les organigrammes'}`);
      } else if (error.request) {
        setErrorMessage("Le serveur ne répond pas. Vérifiez votre connexion.");
      } else {
        setErrorMessage(`Erreur: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, files: fileList } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "file" ? fileList[0] : value,
    }));
    
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const resetForm = () => {
    setFormData({
      discription: "",
      date: "",
      file: null,
    });
    setValidationErrors({});
    setCurrentItem(null);
  };

  const handleAddClick = () => {
    resetForm();
    setShowForm(true);
    setShowEditModal(false);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleCloseForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleEditClick = (item) => {
    setCurrentItem(item);
    setFormData({
      discription: item.discription,
      date: item.date ? item.date.split('T')[0] : "",
      file: null,
    });
    setShowEditModal(true);
    setErrorMessage("");
    setSuccessMessage("");
    setValidationErrors({});
  };

  const handleDeleteClick = (item) => {
    setCurrentItem(item);
    setShowDeleteModal(true);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.file || !formData.discription || !formData.date) {
      setErrorMessage("Tous les champs sont requis !");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setValidationErrors({});

    const formDataToSend = new FormData();
    formDataToSend.append("discription", formData.discription);
    formDataToSend.append("date", formData.date);
    formDataToSend.append("file", formData.file);

    try {
      const response = await api.post('/organigrame', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Réponse après ajout:', response.data);

      const newFile = response.data.data || response.data;
      setFiles((prevFiles) => [...prevFiles, newFile]);
      
      setShowForm(false);
      resetForm();
      setSuccessMessage("Organigramme ajouté avec succès !");
      
      setTimeout(() => setSuccessMessage(""), 3000);
      
    } catch (error) {
      console.error("Erreur lors de l'ajout :", error);
      
      if (error.response && error.response.status === 422) {
        const errors = error.response.data.errors || error.response.data.messages || {};
        setValidationErrors(errors);
        
        let errorMsg = "Erreurs de validation :\n";
        Object.keys(errors).forEach(key => {
          const messages = Array.isArray(errors[key]) ? errors[key] : [errors[key]];
          errorMsg += `- ${key}: ${messages.join(', ')}\n`;
        });
        setErrorMessage(errorMsg);
      } else {
        setErrorMessage(error.response?.data?.message || "Une erreur s'est produite lors de l'ajout.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!formData.discription || !formData.date) {
      setErrorMessage("La description et la date sont requises !");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setValidationErrors({});

    const formDataToSend = new FormData();
    formDataToSend.append("discription", formData.discription);
    formDataToSend.append("date", formData.date);
    formDataToSend.append("_method", "PUT");
    
    if (formData.file) {
      formDataToSend.append("file", formData.file);
    }

    try {
      const response = await api.post(`/organigrame/${currentItem.id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Réponse après modification:', response.data);

      const updatedItem = response.data.data || response.data;
      
      setFiles(prevFiles => 
        prevFiles.map(file => 
          file.id === currentItem.id ? updatedItem : file
        )
      );
      
      setShowEditModal(false);
      resetForm();
      setSuccessMessage("Organigramme modifié avec succès !");
      
      setTimeout(() => setSuccessMessage(""), 3000);
      
    } catch (error) {
      console.error("Erreur lors de la modification :", error);
      
      if (error.response && error.response.status === 422) {
        const errors = error.response.data.errors || error.response.data.messages || {};
        setValidationErrors(errors);
        
        let errorMsg = "Erreurs de validation :\n";
        Object.keys(errors).forEach(key => {
          const messages = Array.isArray(errors[key]) ? errors[key] : [errors[key]];
          errorMsg += `- ${key}: ${messages.join(', ')}\n`;
        });
        setErrorMessage(errorMsg);
      } else {
        setErrorMessage(error.response?.data?.message || "Une erreur s'est produite lors de la modification.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!currentItem) return;

    setLoading(true);

    try {
      await api.delete(`/organigrame/${currentItem.id}`);
      
      setFiles(prevFiles => prevFiles.filter(file => file.id !== currentItem.id));
      
      setShowDeleteModal(false);
      setCurrentItem(null);
      setSuccessMessage("Organigramme supprimé avec succès !");
      
      setTimeout(() => setSuccessMessage(""), 3000);
      
    } catch (error) {
      console.error("Erreur lors de la suppression :", error);
      setErrorMessage(error.response?.data?.message || "Une erreur s'est produite lors de la suppression.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fonction de téléchargement corrigée - Version 1: Ouverture directe
  const handleDownload = (file) => {
    if (!file.file) {
      setErrorMessage("Aucun fichier disponible");
      return;
    }
    
    setDownloading(true);
    
    // Construire l'URL de téléchargement
    const downloadUrl = `${API_BASE_URL}/organigrame/${file.id}/download`;
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    
    console.log('URL de téléchargement:', downloadUrl);
    
    // Ouvrir dans un nouvel onglet
    window.open(downloadUrl + '?token=' + encodeURIComponent(token), '_blank');
    
    setTimeout(() => {
      setDownloading(false);
      setSuccessMessage("Téléchargement lancé...");
      setTimeout(() => setSuccessMessage(""), 3000);
    }, 1000);
  };

  // ✅ Version 2: Téléchargement via iframe (alternative)
  const handleDownloadIframe = (file) => {
    if (!file.file) {
      setErrorMessage("Aucun fichier disponible");
      return;
    }
    
    setDownloading(true);
    
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    const downloadUrl = `${API_BASE_URL}/organigrame/${file.id}/download?token=${encodeURIComponent(token)}`;
    
    // Créer un iframe invisible pour le téléchargement
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = downloadUrl;
    document.body.appendChild(iframe);
    
    setTimeout(() => {
      document.body.removeChild(iframe);
      setDownloading(false);
      setSuccessMessage("Téléchargement lancé...");
      setTimeout(() => setSuccessMessage(""), 3000);
    }, 2000);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const refreshData = async () => {
    await fetchFiles();
    setSuccessMessage("Données rafraîchies avec succès !");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  return (
    <Container fluid className="py-4">
      <Card className="shadow-lg">
        <Card.Header className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h3 className="mb-0 d-flex align-items-center">
              <FaFile className="me-3" size={30} />
              Gestion des Organigrammes
            </h3>
            <div className="d-flex gap-2">
              <Button 
                variant="outline-light" 
                onClick={refreshData}
                disabled={loading}
                title="Rafraîchir"
              >
                <FaSync className={loading ? "fa-spin" : ""} />
              </Button>
              
              <Button 
                variant="success"
                onClick={handleAddClick}
                disabled={loading}
              >
                <FaPlus className="me-2" />
                Ajouter un organigramme
              </Button>
            </div>
          </div>
        </Card.Header>
        
        <Card.Body>
          {/* Messages d'erreur et de succès */}
          {errorMessage && (
            <Alert variant="danger" dismissible onClose={() => setErrorMessage("")} className="mb-4">
              <Alert.Heading>Erreur</Alert.Heading>
              <pre className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{errorMessage}</pre>
            </Alert>
          )}

          {successMessage && (
            <Alert variant="success" dismissible onClose={() => setSuccessMessage("")} className="mb-4">
              <FaCheck className="me-2" />
              {successMessage}
            </Alert>
          )}

          {/* Formulaire d'ajout */}
          {showForm && (
            <Card className="mb-4 border-success">
              <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <FaPlus className="me-2" />
                  Nouvel organigramme
                </h5>
                <Button 
                  variant="link" 
                  className="text-white p-0" 
                  onClick={handleCloseForm}
                >
                  <FaTimes size={20} />
                </Button>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">
                      Description <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="discription"
                      value={formData.discription}
                      onChange={handleChange}
                      isInvalid={!!validationErrors.discription}
                      placeholder="Entrez la description de l'organigramme"
                      required
                      disabled={loading}
                      size="lg"
                    />
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.discription}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">
                      <FaCalendar className="me-2" />
                      Date <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      isInvalid={!!validationErrors.date}
                      required
                      disabled={loading}
                      size="lg"
                    />
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.date}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">
                      <FaFile className="me-2" />
                      Fichier <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="file"
                      name="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleChange}
                      isInvalid={!!validationErrors.file}
                      required
                      disabled={loading}
                      size="lg"
                    />
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.file}
                    </Form.Control.Feedback>
                    <Form.Text className="text-muted">
                      Formats acceptés: PDF, DOC, DOCX, JPG, PNG (max 10MB)
                    </Form.Text>
                  </Form.Group>

                  <div className="d-flex gap-2 justify-content-end">
                    <Button 
                      variant="secondary" 
                      size="lg"
                      onClick={handleCloseForm}
                      disabled={loading}
                    >
                      Annuler
                    </Button>
                    <Button 
                      type="submit" 
                      variant="success" 
                      size="lg"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Spinner size="sm" animation="border" className="me-2" />
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <FaPlus className="me-2" />
                          Ajouter
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          )}

          {/* Tableau des organigrammes */}
          {loading && !showForm ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
              <p className="mt-3 fs-5">Chargement des organigrammes...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-5">
              <FaFile size={64} className="text-muted mb-3" />
              <h5>Aucun organigramme trouvé</h5>
              <p className="text-muted">Commencez par ajouter votre premier organigramme.</p>
              <Button 
                variant="primary" 
                onClick={handleAddClick}
              >
                <FaPlus className="me-2" />
                Ajouter un organigramme
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover className="align-middle">
                <thead className="table-dark">
                  <tr>
                    <th>Description</th>
                    <th style={{ width: '150px' }}>Date</th>
                    <th style={{ width: '200px' }}>Fichier</th>
                    <th style={{ width: '140px' }} className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => (
                    <tr key={file.id}>
                      <td className="fw-bold">{file.discription}</td>
                      <td>
                        <Badge bg="info" className="p-2">
                          <FaCalendar className="me-1" />
                          {formatDate(file.date)}
                        </Badge>
                      </td>
                      <td>
                        {file.file ? (
                          <Button
                            variant="link"
                            className="p-0 text-decoration-none"
                            onClick={() => handleDownload(file)}
                            disabled={downloading}
                          >
                            {downloading ? (
                              <Spinner size="sm" animation="border" className="me-2" />
                            ) : (
                              <FaDownload className="me-2 text-primary" />
                            )}
                            {file.file_name || 'Télécharger'}
                          </Button>
                        ) : (
                          <span className="text-muted">Aucun fichier</span>
                        )}
                      </td>
                      <td className="text-center">
                        <Button
                          variant="outline-warning"
                          size="sm"
                          onClick={() => handleEditClick(file)}
                          className="me-2"
                          title="Modifier"
                          disabled={loading}
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteClick(file)}
                          title="Supprimer"
                          disabled={loading}
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal d'édition */}
      <Modal show={showEditModal} onHide={() => !loading && setShowEditModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-warning">
          <Modal.Title>
            <FaEdit className="me-2" />
            Modifier l'organigramme
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Description *</Form.Label>
              <Form.Control
                type="text"
                name="discription"
                value={formData.discription}
                onChange={handleChange}
                isInvalid={!!validationErrors.discription}
                required
                disabled={loading}
                size="lg"
              />
              <Form.Control.Feedback type="invalid">
                {validationErrors.discription}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Date *</Form.Label>
              <Form.Control
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                isInvalid={!!validationErrors.date}
                required
                disabled={loading}
                size="lg"
              />
              <Form.Control.Feedback type="invalid">
                {validationErrors.date}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Nouveau fichier (optionnel)</Form.Label>
              <Form.Control
                type="file"
                name="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleChange}
                isInvalid={!!validationErrors.file}
                disabled={loading}
                size="lg"
              />
              <Form.Control.Feedback type="invalid">
                {validationErrors.file}
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                Laissez vide pour conserver le fichier actuel
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="lg" onClick={() => setShowEditModal(false)} disabled={loading}>
            Annuler
          </Button>
          <Button variant="warning" size="lg" onClick={handleEditSubmit} disabled={loading}>
            {loading ? (
              <>
                <Spinner size="sm" animation="border" className="me-2" />
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
      </Modal>

      {/* Modal de suppression */}
      <Modal show={showDeleteModal} onHide={() => !loading && setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>
            <FaTrash className="me-2" />
            Confirmer la suppression
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          {currentItem && (
            <div className="text-center">
              <FaTrash size={48} className="text-danger mb-3" />
              <p className="fs-5">Êtes-vous sûr de vouloir supprimer l'organigramme suivant ?</p>
              <p className="fw-bold fs-4 text-primary">{currentItem.discription}</p>
              <p className="text-muted">
                <FaCalendar className="me-1" />
                Date: {formatDate(currentItem.date)}
              </p>
              <p className="text-danger mt-3">
                Cette action est irréversible !
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="lg" onClick={() => setShowDeleteModal(false)} disabled={loading}>
            Annuler
          </Button>
          <Button variant="danger" size="lg" onClick={handleDeleteConfirm} disabled={loading}>
            {loading ? (
              <>
                <Spinner size="sm" animation="border" className="me-2" />
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
    </Container>
  );
};

export default Organi;