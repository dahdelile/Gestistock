import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { 
  ProgressBar, Button, Alert, Card, Row, Col, Spinner, 
  Form, Modal, Badge, Container, Table
} from "react-bootstrap";
import * as XLSX from "xlsx";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, parseISO } from "date-fns";
import {
  FaSyncAlt, FaDownload, FaCog, FaCheck,
  FaTimes, FaExclamationTriangle, FaChartPie, FaList,
  FaPlus, FaEdit, FaTrash, FaSave, FaLock, FaUserShield
} from "react-icons/fa";

// ============================================
// CONFIGURATION API
// ============================================
const API_BASE_URL = "https://intranet-attm.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
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

// Extraction des données
const extractData = (response) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  if (response.data && response.data.data && Array.isArray(response.data.data)) return response.data.data;
  if (response.data && response.data.success && response.data.data && Array.isArray(response.data.data)) return response.data.data;
  return [];
};

const AvancementProjets = () => {
  // États principaux
  const [allProjects, setAllProjects] = useState([]);
  const [performances, setPerformances] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  
  // États pour les modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [editFormData, setEditFormData] = useState({ name: "", status: "en_attente" });

  // État pour le rôle utilisateur
  const [userRole, setUserRole] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  // Mapping des statuts
  const statusLabels = {
    'en_attente': 'En attente',
    'en_cours': 'En cours',
    'termine': 'Terminé',
    'annule': 'Annulé'
  };

  const statusColors = {
    'en_attente': 'secondary',
    'en_cours': 'warning',
    'termine': 'success',
    'annule': 'danger'
  };

  // Projets par défaut
  const defaultProjects = [
    "RANL", "V.NKTT2025",  "Z.FRANCHE",
    "C.KIFFA", "LEMGHAYTI", "V.TEINTAN", "BASSIN SNIM"
  ];

  // ============================================
  // GESTION DES RÔLES
  // ============================================

  // Vérifier si l'utilisateur est admin
  const isAdmin = useCallback(() => {
    const adminRoles = ['admin', 'Admin', 'ADMIN', 'administrateur', 'Administrateur'];
    return adminRoles.includes(userRole);
  }, [userRole]);

  // Vérifier si l'utilisateur peut éditer
  const canEdit = useCallback(() => {
    const allowedRoles = ['admin', 'Admin', 'ADMIN', 'administrateur', 'Administrateur'];
    return allowedRoles.includes(userRole);
  }, [userRole]);

  // Charger le rôle utilisateur
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        setUserLoading(true);
        
        // Vérifier d'abord dans localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUserRole(userData.role || userData.roles?.[0] || 'user');
          setUserLoading(false);
          return;
        }
        
        // Sinon, appeler l'API
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        if (token) {
          const response = await api.get('/user');
          const role = response.data.role || response.data.roles?.[0] || 'user';
          setUserRole(role);
          localStorage.setItem('user', JSON.stringify({
            id: response.data.id,
            email: response.data.email,
            role: role
          }));
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

  // ============================================
  // FONCTIONS DE CALCUL
  // ============================================

  const calculateProjectProgress = useCallback((projectId, projectName) => {
    if (!performances || performances.length === 0) return 0;
    
    const projectPerformances = performances.filter(perf => {
      const perfProjetId = perf.projet_id || perf.projet;
      return perfProjetId === projectId || perfProjetId === projectName;
    });

    if (projectPerformances.length === 0) return 0;

    let totalCumul = 0;
    let totalObjectif = 0;

    projectPerformances.forEach(perf => {
      totalCumul += parseFloat(perf.cumul_realise) || 0;
      totalObjectif += parseFloat(perf.donnee_projet) || 0;
    });

    if (totalObjectif === 0) return 0;
    let progress = (totalCumul / totalObjectif) * 100;
    return Math.min(100, Math.round(progress * 100) / 100);
  }, [performances]);

  // ============================================
  // CHARGEMENT DES DONNÉES
  // ============================================

  useEffect(() => {
    const savedSelections = localStorage.getItem('selectedProjects');
    if (savedSelections) {
      try {
        const parsed = JSON.parse(savedSelections);
        setSelectedProjects(Array.isArray(parsed) ? parsed : defaultProjects);
      } catch (e) {
        setSelectedProjects(defaultProjects);
      }
    } else {
      setSelectedProjects(defaultProjects);
    }
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projets');
      const projects = extractData(response);
      setAllProjects(projects);
      setError(null);
    } catch (error) {
      console.error("Erreur chargement projets:", error);
      setError("Erreur lors du chargement des projets");
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformances = async () => {
    try {
      const response = await api.get('/performances');
      const performancesData = extractData(response);
      setPerformances(performancesData);
    } catch (error) {
      console.error("Erreur chargement performances:", error);
    }
  };

  // Chargement initial
  useEffect(() => {
    fetchProjects();
    fetchPerformances();
  }, []);

  // ============================================
  // CRUD PROJETS (UNIQUEMENT POUR ADMIN)
  // ============================================

  const handleAddProject = async () => {
    if (!canEdit()) {
      setError("⚠️ Seuls les administrateurs peuvent ajouter des projets");
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    if (!newProjectName.trim()) {
      setError("Veuillez entrer un nom de projet");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setUpdating(true);
    try {
      const response = await api.post('/projets', {
        name: newProjectName.trim(),
        status: "en_attente",
        progress: 0
      });
      
      const newProject = response.data.projet || response.data;
      setAllProjects(prev => [...prev, newProject]);
      setNewProjectName("");
      setShowAddModal(false);
      setSuccess(`Projet "${newProject.name}" créé avec succès`);
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error) {
      console.error("Erreur création:", error);
      setError("Erreur lors de la création du projet");
    } finally {
      setUpdating(false);
    }
  };

  const handleEditClick = (project) => {
    if (!canEdit()) {
      setError("⚠️ Seuls les administrateurs peuvent modifier les projets");
      setTimeout(() => setError(null), 3000);
      return;
    }
    setCurrentProject(project);
    setEditFormData({
      name: project.name || "",
      status: project.status || "en_attente"
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!canEdit()) return;
    
    setUpdating(true);
    try {
      await api.put(`/projets/${currentProject.id}`, {
        name: editFormData.name,
        status: editFormData.status
      });
      
      setAllProjects(prev => prev.map(p => 
        p.id === currentProject.id ? { ...p, name: editFormData.name, status: editFormData.status } : p
      ));
      
      setShowEditModal(false);
      setSuccess(`Projet modifié avec succès`);
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error) {
      console.error("Erreur modification:", error);
      setError("Erreur lors de la modification");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteClick = (project) => {
    if (!canEdit()) {
      setError("⚠️ Seuls les administrateurs peuvent supprimer des projets");
      setTimeout(() => setError(null), 3000);
      return;
    }
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!canEdit()) return;
    
    setUpdating(true);
    try {
      await api.delete(`/projets/${projectToDelete.id}`);
      
      setAllProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
      setSelectedProjects(prev => prev.filter(name => name !== projectToDelete.name));
      
      setShowDeleteModal(false);
      setProjectToDelete(null);
      setSuccess(`Projet supprimé avec succès`);
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error) {
      console.error("Erreur suppression:", error);
      setError("Erreur lors de la suppression");
    } finally {
      setUpdating(false);
    }
  };

  // ============================================
  // GESTION DE LA SÉLECTION
  // ============================================

  const handleProjectSelection = (projectName, isSelected) => {
    let newSelection;
    if (isSelected) {
      newSelection = [...selectedProjects, projectName];
    } else {
      newSelection = selectedProjects.filter(name => name !== projectName);
    }
    setSelectedProjects(newSelection);
    localStorage.setItem('selectedProjects', JSON.stringify(newSelection));
  };

  const selectAllProjects = () => {
    setSelectedProjects(allProjects.map(p => p.name));
    setShowProjectSelector(false);
  };

  const resetToDefault = () => {
    setSelectedProjects(defaultProjects);
    setShowProjectSelector(false);
  };

  const clearAllSelections = () => {
    setSelectedProjects([]);
    setShowProjectSelector(false);
  };

  // ============================================
  // TRAITEMENT DES DONNÉES
  // ============================================

  const filteredProjects = useMemo(() => {
    return allProjects
      .filter(project => selectedProjects.includes(project.name))
      .map(project => ({
        ...project,
        calculatedProgress: calculateProjectProgress(project.id, project.name)
      }))
      .sort((a, b) => selectedProjects.indexOf(a.name) - selectedProjects.indexOf(b.name));
  }, [allProjects, selectedProjects, calculateProjectProgress]);

  const totalProjects = filteredProjects.length;
  const completedProjects = filteredProjects.filter(p => p.calculatedProgress >= 100).length;
  const ongoingProjects = filteredProjects.filter(p => p.calculatedProgress > 0 && p.calculatedProgress < 100).length;
  const pendingProjects = filteredProjects.filter(p => p.calculatedProgress === 0).length;
  const averageProgress = totalProjects > 0 ? Math.round(filteredProjects.reduce((sum, p) => sum + (p.calculatedProgress || 0), 0) / totalProjects) : 0;

  const pieData = [
    { name: "Terminé", value: completedProjects, color: "#28a745" },
    { name: "En cours", value: ongoingProjects, color: "#ffc107" },
    { name: "En attente", value: pendingProjects, color: "#6c757d" },
  ].filter(item => item.value > 0);

  const getProjectTotalCumul = (projectId, projectName) => {
    const projectPerformances = performances.filter(perf => {
      const perfProjetId = perf.projet_id || perf.projet;
      return perfProjetId === projectId || perfProjetId === projectName;
    });
    return projectPerformances.reduce((sum, perf) => sum + (parseFloat(perf.cumul_realise) || 0), 0);
  };

  const getProjectTotalObjectif = (projectId, projectName) => {
    const projectPerformances = performances.filter(perf => {
      const perfProjetId = perf.projet_id || perf.projet;
      return perfProjetId === projectId || perfProjetId === projectName;
    });
    return projectPerformances.reduce((sum, perf) => sum + (parseFloat(perf.donnee_projet) || 0), 0);
  };

  const getLastUpdateDate = (projectId, projectName) => {
    const projectPerformances = performances.filter(perf => {
      const perfProjetId = perf.projet_id || perf.projet;
      return perfProjetId === projectId || perfProjetId === projectName;
    });
    if (projectPerformances.length === 0) return "Aucune donnée";
    
    const latest = projectPerformances.reduce((latest, current) => {
      const latestDate = latest?.date_rapport ? new Date(latest.date_rapport) : new Date(0);
      const currentDate = current?.date_rapport ? new Date(current.date_rapport) : new Date(0);
      return currentDate > latestDate ? current : latest;
    });
    
    return latest?.date_rapport ? format(parseISO(latest.date_rapport), 'dd/MM/yyyy') : "Non définie";
  };

  const getProgressVariant = (progress) => {
    if (progress >= 100) return "success";
    if (progress >= 70) return "info";
    if (progress >= 40) return "warning";
    return "danger";
  };

  const exportToExcel = () => {
    try {
      if (filteredProjects.length === 0) {
        setError("Aucun projet à exporter");
        return;
      }

      const exportData = filteredProjects.map(project => ({
        "Nom du Projet": project.name,
        "Avancement (%)": project.calculatedProgress.toFixed(2),
        "Statut": statusLabels[project.status] || project.status,
        "Cumul Réalisé (m)": getProjectTotalCumul(project.id, project.name).toFixed(2),
        "Objectif Total (m)": getProjectTotalObjectif(project.id, project.name).toFixed(2),
        "Dernière Mise à Jour": getLastUpdateDate(project.id, project.name)
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Avancement_Projets");
      XLSX.writeFile(wb, `Avancement_Projets_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      setSuccess("Export réussi !");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError("Erreur export Excel");
    }
  };

  // ============================================
  // RENDU CONDITIONNEL
  // ============================================

  if (userLoading || loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="primary" size="lg" />
        <p className="mt-3">Chargement...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4 mb-5">
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* En-tête avec badge de rôle */}
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <div>
              <h3 className="mb-0 d-flex align-items-center">
                📊 Avancement des Projets
                {!canEdit() && (
                  <Badge bg="secondary" className="ms-3">
                    <FaLock className="me-1" size={12} /> Lecture seule
                  </Badge>
                )}
                {canEdit() && (
                  <Badge bg="danger" className="ms-3">
                    <FaUserShield className="me-1" size={12} /> Administrateur
                  </Badge>
                )}
              </h3>
            </div>
            <div className="d-flex gap-2 mt-2 mt-sm-0">
              <Button variant="outline-light" size="sm" onClick={() => { fetchProjects(); fetchPerformances(); }}>
                <FaSyncAlt /> Rafraîchir
              </Button>
              <Button variant="outline-light" size="sm" onClick={() => setShowProjectSelector(true)}>
                <FaCog /> Gérer
              </Button>
              <Badge bg="light" text="dark">{selectedProjects.length} projet(s)</Badge>
            </div>
          </div>
        </Card.Header>
      </Card>

      {/* Alertes */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-4">
          <FaExclamationTriangle className="me-2" /> {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)} className="mb-4">
          <FaCheck className="me-2" /> {success}
        </Alert>
      )}

      {/* Statistiques */}
      <Row className="mb-4 g-3">
        <Col md={3}>
          <Card className="text-center border-primary">
            <Card.Body>
              <h6>Total Projets</h6>
              <div className="display-4 fw-bold text-primary">{totalProjects}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-success">
            <Card.Body>
              <h6>Terminés ✅</h6>
              <div className="display-4 fw-bold text-success">{completedProjects}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-warning">
            <Card.Body>
              <h6>En cours 🏗️</h6>
              <div className="display-4 fw-bold text-warning">{ongoingProjects}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-secondary">
            <Card.Body>
              <h6>En attente ⏳</h6>
              <div className="display-4 fw-bold text-secondary">{pendingProjects}</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Progression moyenne */}
      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between mb-2">
            <h6>Progression Moyenne Globale</h6>
            <Badge bg="info" className="fs-6">{averageProgress}%</Badge>
          </div>
          <ProgressBar now={averageProgress} label={`${averageProgress}%`} variant="info" style={{ height: "30px" }} />
        </Card.Body>
      </Card>

      {/* Boutons d'action */}
      <div className="text-center mb-4">
        <Button variant="success" className="me-3" onClick={exportToExcel} disabled={filteredProjects.length === 0}>
          <FaDownload className="me-2" /> Exporter Excel
        </Button>
        {canEdit() && (
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            <FaPlus className="me-2" /> Nouveau projet
          </Button>
        )}
      </div>

      {/* Tableau des projets */}
      <Card className="shadow-sm">
        <Card.Header className="bg-dark text-white">
          <h5 className="mb-0">📋 Liste des projets suivis</h5>
        </Card.Header>
        <Card.Body className="p-0">
          {filteredProjects.length > 0 ? (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>Projet</th>
                    <th className="text-end">Cumul (m)</th>
                    <th className="text-end">Objectif (m)</th>
                    <th>Avancement</th>
                    <th>Statut</th>
                    <th>Dernière MAJ</th>
                    {canEdit() && <th className="text-center">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map(project => {
                    const totalCumul = getProjectTotalCumul(project.id, project.name);
                    const totalObjectif = getProjectTotalObjectif(project.id, project.name);
                    return (
                      <tr key={project.id}>
                        <td className="fw-bold">{project.name}</td>
                        <td className="text-end text-success fw-bold">{totalCumul.toFixed(2)}</td>
                        <td className="text-end text-primary fw-bold">{totalObjectif.toFixed(2)}</td>
                        <td style={{ minWidth: "180px" }}>
                          <ProgressBar 
                            now={project.calculatedProgress} 
                            label={`${project.calculatedProgress.toFixed(1)}%`} 
                            variant={getProgressVariant(project.calculatedProgress)}
                            style={{ height: "25px" }}
                          />
                        </td>
                        <td>
                          <Badge bg={statusColors[project.status] || "secondary"}>
                            {statusLabels[project.status] || project.status}
                          </Badge>
                        </td>
                        <td><small>{getLastUpdateDate(project.id, project.name)}</small></td>
                        {canEdit() && (
                          <td className="text-center">
                            <Button variant="outline-primary" size="sm" className="me-1" onClick={() => handleEditClick(project)}>
                              <FaEdit />
                            </Button>
                            <Button variant="outline-danger" size="sm" onClick={() => handleDeleteClick(project)}>
                              <FaTrash />
                            </Button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-5">
              <p>Aucun projet sélectionné</p>
              <Button variant="primary" onClick={() => setShowProjectSelector(true)}>Sélectionner des projets</Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Graphique circulaire */}
      {pieData.length > 0 && (
        <Card className="mt-4">
          <Card.Header className="bg-light">
            <h6 className="mb-0 text-center"><FaChartPie className="me-2" /> Répartition par statut</h6>
          </Card.Header>
          <Card.Body>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card.Body>
        </Card>
      )}

      {/* Modal sélection projets */}
      <Modal show={showProjectSelector} onHide={() => setShowProjectSelector(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title><FaList className="me-2" /> Sélection des projets</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex gap-2 mb-3">
            <Button size="sm" variant="outline-primary" onClick={selectAllProjects}>Tout sélectionner</Button>
            <Button size="sm" variant="outline-secondary" onClick={resetToDefault}>Par défaut</Button>
            <Button size="sm" variant="outline-danger" onClick={clearAllSelections}>Tout désélectionner</Button>
          </div>
          {allProjects.map(project => (
            <Form.Check
              key={project.id}
              type="checkbox"
              label={`${project.name} (${project.calculatedProgress || 0}%)`}
              checked={selectedProjects.includes(project.name)}
              onChange={(e) => handleProjectSelection(project.name, e.target.checked)}
              className="mb-2"
            />
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowProjectSelector(false)}>Valider</Button>
        </Modal.Footer>
      </Modal>

      {/* Modal ajout projet (admin only) */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title><FaPlus className="me-2" /> Nouveau projet</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control
            type="text"
            placeholder="Nom du projet"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            autoFocus
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>Annuler</Button>
          <Button variant="success" onClick={handleAddProject} disabled={updating}>
            {updating ? <Spinner size="sm" /> : <FaSave className="me-1" />} Créer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal modification projet (admin only) */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title><FaEdit className="me-2" /> Modifier : {currentProject?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Nom</Form.Label>
            <Form.Control
              type="text"
              value={editFormData.name}
              onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Statut</Form.Label>
            <Form.Select
              value={editFormData.status}
              onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="en_attente">⏳ En attente</option>
              <option value="en_cours">🏗️ En cours</option>
              <option value="termine">✅ Terminé</option>
              <option value="annule">❌ Annulé</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>Annuler</Button>
          <Button variant="primary" onClick={handleEditSubmit} disabled={updating}>
            {updating ? <Spinner size="sm" /> : <FaSave className="me-1" />} Sauvegarder
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal suppression projet (admin only) */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title><FaTrash className="me-2" /> Confirmer suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Supprimer le projet :</p>
          <h5 className="text-danger text-center">{projectToDelete?.name}</h5>
          <p className="text-muted mt-3">⚠️ Action irréversible</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Annuler</Button>
          <Button variant="danger" onClick={confirmDelete} disabled={updating}>
            {updating ? <Spinner size="sm" /> : <FaTrash className="me-1" />} Supprimer
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AvancementProjets;