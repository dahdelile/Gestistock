import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Modal, Button, Form, Spinner, Alert, Table,
  Card, InputGroup, Row, Col, Badge, Pagination, Dropdown
} from "react-bootstrap";
import {
  FaPlus, FaEdit, FaTrash, FaSyncAlt, FaFileExport, FaPrint,
  FaSearch, FaTimes, FaCode, FaFilter, FaChartLine, FaInfoCircle
} from "react-icons/fa";
import axios from "axios";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Configuration Axios
const API_BASE_URL = "http://localhost:8000/api";
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000,
});

// Intercepteur pour le logging
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 Requête ${config.method?.toUpperCase()} vers: ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Erreur requête:', error);
    return Promise.reject(error);
  }
);

// Fonction pour extraire les données de l'API de manière sécurisée
const getDataArray = (apiData, endpointName) => {
  console.log(`🔍 Extraction ${endpointName}:`, apiData);
  
  if (Array.isArray(apiData)) {
    return apiData;
  }
  
  if (apiData && typeof apiData === 'object' && Array.isArray(apiData.data)) {
    return apiData.data;
  }
  
  if (apiData && apiData.data && Array.isArray(apiData.data)) {
    return apiData.data;
  }
  
  if (apiData && apiData.success && Array.isArray(apiData.data)) {
    return apiData.data;
  }
  
  if (apiData && typeof apiData === 'object' && apiData.id) {
    return [apiData];
  }
  
  if (!apiData) {
    return [];
  }
  
  console.warn(`❌ Format non géré pour ${endpointName}:`, apiData);
  return [];
};

// 🔹 Modal pour ajouter
const AddCodeModal = ({ show, onHide, onSubmit, loading, newProject, setNewProject, errors }) => (
  <Modal show={show} onHide={onHide} backdrop="static">
    <Modal.Header closeButton>
      <Modal.Title><FaPlus /> Ajouter un code panne</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Nom du code panne *</Form.Label>
          <Form.Control
            type="text"
            placeholder="Ex: Panne mécanique, Défaillance électrique..."
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            isInvalid={!!errors.name}
            required
          />
          <Form.Control.Feedback type="invalid">
            {errors.name}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Code *</Form.Label>
          <Form.Control
            type="text"
            placeholder="Ex: P001, MEC-01..."
            value={newProject.code}
            onChange={(e) => setNewProject({ ...newProject, code: e.target.value })}
            isInvalid={!!errors.code}
            required
          />
          <Form.Control.Feedback type="invalid">
            {errors.code}
          </Form.Control.Feedback>
        </Form.Group>
      </Form>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={onHide} disabled={loading}>
        Annuler
      </Button>
      <Button variant="primary" onClick={onSubmit} disabled={loading}>
        {loading ? <Spinner animation="border" size="sm" /> : "Ajouter"}
      </Button>
    </Modal.Footer>
  </Modal>
);

// 🔹 Modal pour modifier
const EditCodeModal = ({ 
  show, onHide, onSubmit, loading, editingProject, setEditingProject, errors 
}) => (
  <Modal show={show} onHide={onHide} backdrop="static">
    <Modal.Header closeButton>
      <Modal.Title><FaEdit /> Modifier code panne</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Nom du code panne *</Form.Label>
          <Form.Control
            type="text"
            value={editingProject?.name || ""}
            onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
            isInvalid={!!errors.name}
            required
          />
          <Form.Control.Feedback type="invalid">
            {errors.name}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Code *</Form.Label>
          <Form.Control
            type="text"
            value={editingProject?.code || ""}
            onChange={(e) => setEditingProject({ ...editingProject, code: e.target.value })}
            isInvalid={!!errors.code}
            required
          />
          <Form.Control.Feedback type="invalid">
            {errors.code}
          </Form.Control.Feedback>
        </Form.Group>
      </Form>
      {editingProject?.arrets_count > 0 && (
        <Alert variant="info" className="mt-3">
          <FaInfoCircle className="me-2" />
          Ce code est utilisé dans <strong>{editingProject.arrets_count}</strong> arrêt(s) équipement
        </Alert>
      )}
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={onHide} disabled={loading}>
        Annuler
      </Button>
      <Button variant="primary" onClick={onSubmit} disabled={loading}>
        {loading ? <Spinner animation="border" size="sm" /> : "Modifier"}
      </Button>
    </Modal.Footer>
  </Modal>
);

const AjouterCodePannes = () => {
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState({ name: "", code: "" });
  const [editingProject, setEditingProject] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [filters, setFilters] = useState({
    searchQuery: '',
    withArrets: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10
  });

  const API_URL = "http://127.0.0.1:8000/api/pannes/";

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Chargement des codes panne...');

      const response = await api.get("/pannes/");
      console.log('📊 Réponse API:', response.data);

      const projectsData = getDataArray(response.data, 'codesPanne');
      
      if (!Array.isArray(projectsData)) {
        console.error('❌ projectsData nest pas un tableau:', projectsData);
        throw new Error('Les données ne sont pas dans un format valide');
      }

      setProjects(projectsData);
      console.log('✅ Données chargées avec succès:', projectsData);

    } catch (err) {
      console.error('💥 Erreur complète:', err);
      console.error('🔍 Détails:', err.response);
      
      let errorMessage = "Erreur lors du chargement des codes pannes";
      
      if (err.response) {
        if (err.response.data?.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data?.errors) {
          errorMessage = Object.values(err.response.data.errors).flat().join(', ');
        }
      } else if (err.request) {
        errorMessage = "Impossible de contacter le serveur - Vérifiez votre connexion";
      } else {
        errorMessage = `Erreur: ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setError(null);
      setSuccessMessage(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [error, successMessage]);

  const validateForm = (project, isEdit = false) => {
    const errors = {};
    
    if (!project.name?.trim()) {
      errors.name = "Le nom est obligatoire";
    } else if (project.name.length > 255) {
      errors.name = "Le nom ne peut pas dépasser 255 caractères";
    }
    
    if (!project.code?.trim()) {
      errors.code = "Le code est obligatoire";
    } else if (project.code.length > 50) {
      errors.code = "Le code ne peut pas dépasser 50 caractères";
    }
    
    // Vérification des doublons
    const duplicate = projects.find(p => 
      p.code.toLowerCase() === project.code.toLowerCase() && 
      (!isEdit || p.id !== project.id)
    );
    if (duplicate) {
      errors.code = "Ce code existe déjà !";
    }
    
    return errors;
  };

  const handleAddProject = async () => {
    const errors = validateForm(newProject);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setFormErrors({});
    setLoading(true);
    
    try {
      console.log('📤 Envoi des données:', newProject);
      const response = await api.post("/pannes/", newProject);
      console.log('✅ Réponse création:', response.data);
      
      setProjects(prev => [...prev, response.data]);
      setNewProject({ name: "", code: "" });
      setShowAddModal(false);
      setSuccessMessage("Code panne ajouté avec succès !");
    } catch (err) {
      console.error('💥 Erreur création:', err.response);
      
      let errorMessage = "Erreur lors de l'ajout !";
      if (err.response?.data) {
        if (err.response.data.errors) {
          const apiErrors = err.response.data.errors;
          setFormErrors(apiErrors);
          errorMessage = "Erreur de validation";
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProject = async () => {
    const errors = validateForm(editingProject, true);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setFormErrors({});
    setLoading(true);
    
    try {
      console.log('📤 Mise à jour:', editingProject);
      const response = await api.put(`/pannes/${editingProject.id}/`, editingProject);
      console.log('✅ Réponse mise à jour:', response.data);
      
      setProjects(prev => prev.map(p => p.id === editingProject.id ? response.data : p));
      setShowEditModal(false);
      setSuccessMessage("Code panne modifié avec succès !");
    } catch (err) {
      console.error('💥 Erreur mise à jour:', err.response);
      
      let errorMessage = "Erreur lors de la modification !";
      if (err.response?.data) {
        if (err.response.data.errors) {
          const apiErrors = err.response.data.errors;
          setFormErrors(apiErrors);
          errorMessage = "Erreur de validation";
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (id) => {
    const project = projects.find(p => p.id === id);
    
    if (project?.arrets_count > 0) {
      setError(`Impossible de supprimer ce code car il est utilisé dans ${project.arrets_count} arrêt(s) équipement`);
      return;
    }
    
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce code panne ?")) return;
    
    setLoading(true);
    try {
      await api.delete(`/pannes/${id}/`);
      setProjects(prev => prev.filter(p => p.id !== id));
      setSuccessMessage("Code panne supprimé avec succès !");
    } catch (err) {
      console.error('💥 Erreur suppression:', err.response);
      
      let errorMessage = "Erreur lors de la suppression !";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const searchMatch = filters.searchQuery
        ? (project.name?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
           project.code?.toLowerCase().includes(filters.searchQuery.toLowerCase()))
        : true;
      
      const arretsMatch = filters.withArrets === 'with' 
        ? (project.arrets_count > 0)
        : filters.withArrets === 'without'
        ? (project.arrets_count === 0)
        : true;
      
      return searchMatch && arretsMatch;
    });
  }, [projects, filters]);

  const paginatedProjects = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    return filteredProjects.slice(startIndex, startIndex + pagination.itemsPerPage);
  }, [filteredProjects, pagination]);

  const totalPages = Math.ceil(filteredProjects.length / pagination.itemsPerPage);

  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Codes Panne');
      
      worksheet.addRow(['ID', 'Code', 'Nom', "Nombre d'arrêts", 'Statut']);

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' }
      };

      filteredProjects.forEach(project => {
        worksheet.addRow([
          project.id,
          project.code || '-',
          project.name || '-',
          project.arrets_count || 0,
          project.arrets_count > 0 ? 'Utilisé' : 'Non utilisé'
        ]);
      });

      worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = Math.min(maxLength + 2, 30);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Codes_Panne_${new Date().toISOString().split('T')[0]}.xlsx`);
      setSuccessMessage('Export Excel généré avec succès');
    } catch (error) {
      console.error('Erreur export Excel:', error);
      setError('Erreur lors de la génération du fichier Excel');
    }
  };

  const stats = useMemo(() => {
    const total = projects.length;
    const used = projects.filter(p => p.arrets_count > 0).length;
    const unused = projects.filter(p => p.arrets_count === 0).length;
    const usageRate = total > 0 ? (used / total) * 100 : 0;
    
    return { total, used, unused, usageRate };
  }, [projects]);

  return (
    <div className="container mt-4">
      <Card className="shadow-lg">
        <Card.Header className="bg-primary text-white">
          <Row className="align-items-center">
            <Col>
              <h3 className="mb-0 d-flex align-items-center">
                <FaCode className="me-2" />
                Gestion des codes de pannes
              </h3>
            </Col>
            <Col className="text-end">
              <Button 
                variant="light" 
                onClick={fetchProjects} 
                disabled={loading}
                className="me-2"
              >
                <FaSyncAlt className={loading ? "spin" : ""} />
                <span className="ms-2">Rafraîchir</span>
              </Button>
              
              <Dropdown className="d-inline-block me-2">
                <Dropdown.Toggle variant="outline-light">
                  <FaFileExport /> Exporter
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={exportToExcel}>
                    <FaFileExport className="me-2" /> Excel
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              
              <Button 
                variant="success" 
                onClick={() => setShowAddModal(true)}
                disabled={loading}
              >
                <FaPlus className="me-1" />
                Ajouter
              </Button>
            </Col>
          </Row>
        </Card.Header>
        
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {successMessage && <Alert variant="success">{successMessage}</Alert>}

          {/* Filtres */}
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-light">
              <h5 className="mb-0">
                <FaFilter className="me-2" /> Filtres
              </h5>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Rechercher</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <FaSearch />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Rechercher par nom ou code..."
                        value={filters.searchQuery}
                        onChange={e => setFilters(p => ({ ...p, searchQuery: e.target.value }))}
                      />
                      {filters.searchQuery && (
                        <Button 
                          variant="outline-secondary" 
                          onClick={() => setFilters(p => ({ ...p, searchQuery: '' }))}
                        >
                          <FaTimes />
                        </Button>
                      )}
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Filtrer par utilisation</Form.Label>
                    <Form.Select 
                      value={filters.withArrets} 
                      onChange={e => setFilters(p => ({ ...p, withArrets: e.target.value }))}
                    >
                      <option value="">Tous les codes</option>
                      <option value="with">Codes utilisés</option>
                      <option value="without">Codes non utilisés</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Statistiques rapides */}
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <h5><FaChartLine className="me-2" /> Aperçu des statistiques</h5>
              <Row className="text-center">
                <Col md={3}>
                  <div className="p-3 bg-light rounded">
                    <div className="text-muted small">Total codes</div>
                    <div className="fs-5 fw-bold">{stats.total}</div>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="p-3 bg-success bg-opacity-10 rounded">
                    <div className="text-muted small">Codes utilisés</div>
                    <div className="fs-5 fw-bold">{stats.used}</div>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="p-3 bg-warning bg-opacity-10 rounded">
                    <div className="text-muted small">Codes non utilisés</div>
                    <div className="fs-5 fw-bold">{stats.unused}</div>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="p-3 bg-info bg-opacity-10 rounded">
                    <div className="text-muted small">Taux d'utilisation</div>
                    <div className="fs-5 fw-bold">{stats.usageRate.toFixed(1)}%</div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Tableau */}
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead className="table-dark text-center">
                <tr>
                  <th>Code</th>
                  <th>Nom</th>
                  <th>Nombre d'arrêts</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="text-center">
                {loading && !projects.length ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      <Spinner animation="border" variant="primary" />
                      <p className="mt-2">Chargement des données...</p>
                    </td>
                  </tr>
                ) : paginatedProjects.length ? (
                  paginatedProjects.map(project => (
                    <tr key={project.id}>
                      <td>
                        <strong>{project.code}</strong>
                      </td>
                      <td>{project.name}</td>
                      <td>
                        <Badge 
                          bg={project.arrets_count > 0 ? "primary" : "secondary"}
                          className="fs-6"
                        >
                          {project.arrets_count || 0}
                        </Badge>
                      </td>
                      <td>
                        <Badge 
                          bg={project.arrets_count > 0 ? "success" : "warning"}
                        >
                          {project.arrets_count > 0 ? 'Utilisé' : 'Non utilisé'}
                        </Badge>
                      </td>
                      <td>
                        <Button 
                          variant="outline-warning" 
                          size="sm" 
                          className="me-2" 
                          onClick={() => {
                            setEditingProject(project);
                            setShowEditModal(true);
                            setFormErrors({});
                          }}
                          disabled={loading}
                        >
                          <FaEdit />
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm" 
                          onClick={() => handleDeleteProject(project.id)}
                          disabled={loading || project.arrets_count > 0}
                          title={project.arrets_count > 0 ? "Impossible de supprimer un code utilisé" : "Supprimer"}
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-muted">
                      Aucun code panne trouvé avec les filtres actuels
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          {/* Pagination */}
          {filteredProjects.length > pagination.itemsPerPage && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="text-muted">
                Affichage de {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} à {Math.min(pagination.currentPage * pagination.itemsPerPage, filteredProjects.length)} sur {filteredProjects.length} codes
              </div>
              <Pagination>
                <Pagination.First 
                  onClick={() => setPagination(p => ({ ...p, currentPage: 1 }))} 
                  disabled={pagination.currentPage === 1}
                />
                <Pagination.Prev 
                  onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage - 1 }))} 
                  disabled={pagination.currentPage === 1}
                />
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = pagination.currentPage - 2 + i;
                  }
                  
                  return (
                    <Pagination.Item
                      key={pageNum}
                      active={pageNum === pagination.currentPage}
                      onClick={() => setPagination(p => ({ ...p, currentPage: pageNum }))}
                    >
                      {pageNum}
                    </Pagination.Item>
                  );
                })}
                
                <Pagination.Next 
                  onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage + 1 }))} 
                  disabled={pagination.currentPage === totalPages}
                />
                <Pagination.Last 
                  onClick={() => setPagination(p => ({ ...p, currentPage: totalPages }))} 
                  disabled={pagination.currentPage === totalPages}
                />
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>

      <AddCodeModal
        show={showAddModal}
        onHide={() => {
          setShowAddModal(false);
          setFormErrors({});
          setNewProject({ name: "", code: "" });
        }}
        onSubmit={handleAddProject}
        loading={loading}
        newProject={newProject}
        setNewProject={setNewProject}
        errors={formErrors}
      />

      <EditCodeModal
        show={showEditModal}
        onHide={() => {
          setShowEditModal(false);
          setFormErrors({});
        }}
        onSubmit={handleUpdateProject}
        loading={loading}
        editingProject={editingProject}
        setEditingProject={setEditingProject}
        errors={formErrors}
      />
    </div>
  );
};

export default AjouterCodePannes;