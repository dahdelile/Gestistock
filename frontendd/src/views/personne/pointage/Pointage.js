import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Container, Row, Col, Card, Table, Button,
  Form, Modal, Badge, Alert, Spinner,
  InputGroup, Tabs, Tab, ProgressBar
} from 'react-bootstrap';
import axios from 'axios';
import { format, parseISO, isValid, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import * as XLSX from 'xlsx';
import { 
  FaLock, FaUserShield, FaUser, FaBuilding, FaProjectDiagram,
  FaCalendar, FaCheckCircle, FaTimesCircle, FaClock, FaUsers,
  FaFileExcel, FaSync, FaPlus, FaEdit, FaTrash, FaInfoCircle,
  FaFilter, FaSearch, FaChartBar, FaUserTie, FaClipboardCheck,
  FaHome, FaEye, FaFileAlt, FaChartLine, FaChartPie, FaLayerGroup,
  FaDownload, FaPrint
} from 'react-icons/fa';

// Configuration API
const API_BASE_URL = 'https://intranet-attm.com/api';
const api = axios.create({ 
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000,
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

// ============================================
// HOOK PERSONNALISÉ POUR LA GESTION DES PERMISSIONS
// ============================================
const usePermissions = () => {
  const [userRole, setUserRole] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        setUserLoading(true);
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            setUserRole(userData.role || userData.roles?.[0] || 'user');
            setUserName(userData.name || userData.email || 'Utilisateur');
            setUserLoading(false);
            return;
          } catch (e) {
            console.error("Erreur parsing user:", e);
          }
        }
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
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
            setUserName(userData.name || userData.email || 'Utilisateur');
            localStorage.setItem('user', JSON.stringify({
              id: userData.id,
              email: userData.email,
              name: userData.name,
              role: role
            }));
          } else {
            setUserRole('user');
            setUserName('Utilisateur');
          }
        } else {
          setUserRole('user');
          setUserName('Utilisateur');
        }
      } catch (err) {
        console.error("Erreur récupération rôle:", err);
        setUserRole('user');
        setUserName('Utilisateur');
      } finally {
        setUserLoading(false);
      }
    };
    fetchUserRole();
  }, []);

  const canEdit = useCallback(() => {
    const allowedRoles = ['admin', 'Admin', 'ADMIN', 'drh', 'DRH', 'Drh'];
    return allowedRoles.includes(userRole);
  }, [userRole]);

  const isAdmin = useCallback(() => {
    const adminRoles = ['admin', 'Admin', 'ADMIN'];
    return adminRoles.includes(userRole);
  }, [userRole]);

  const isDRH = useCallback(() => {
    const drhRoles = ['drh', 'DRH', 'Drh'];
    return drhRoles.includes(userRole);
  }, [userRole]);

  const getRoleLabel = useCallback(() => {
    if (isAdmin()) return 'Administrateur';
    if (isDRH()) return 'DRH';
    return 'Consultation seule';
  }, [isAdmin, isDRH]);

  const getRoleBadgeColor = useCallback(() => {
    if (isAdmin()) return 'danger';
    if (isDRH()) return 'warning';
    return 'secondary';
  }, [isAdmin, isDRH]);

  return {
    userRole,
    userName,
    userLoading,
    canEdit,
    isAdmin,
    isDRH,
    getRoleLabel,
    getRoleBadgeColor
  };
};

// ============================================
// COMPOSANT DE SÉLECTION D'EMPLOYEUR
// ============================================
const EmployeurSearchSelect = ({
  employeurs,
  value,
  onChange,
  onEmployeurSelect,
  isInvalid,
  disabled = false,
  placeholder = "Tapez le matricule ou le nom..."
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [filteredEmployeurs, setFilteredEmployeurs] = useState([]);
  const [selectedEmployeur, setSelectedEmployeur] = useState(null);

  useEffect(() => {
    if (!Array.isArray(employeurs) || employeurs.length === 0) {
      setFilteredEmployeurs([]);
      return;
    }
    
    const term = searchTerm.trim().toLowerCase();
    
    if (term === '') {
      setFilteredEmployeurs([]);
    } else {
      const filtered = employeurs.filter(employeur => {
        if (!employeur || typeof employeur !== 'object') return false;
        
        const matricule = String(employeur.matricule || '').toLowerCase();
        const nom = String(employeur.nom || '').toLowerCase();
        const section = String(employeur.section || '').toLowerCase();
        
        return (
          matricule.includes(term) ||
          nom.includes(term) ||
          section.includes(term) ||
          `${matricule} ${nom}`.toLowerCase().includes(term)
        );
      }).slice(0, 10);
      
      setFilteredEmployeurs(filtered);
    }
  }, [searchTerm, employeurs]);

  useEffect(() => {
    if (value && employeurs.length > 0) {
      const foundEmployeur = employeurs.find(e => String(e.id) === String(value));
      if (foundEmployeur) {
        setSelectedEmployeur(foundEmployeur);
        setSearchTerm(`${foundEmployeur.matricule || ''} - ${foundEmployeur.nom || ''}`);
        if (onEmployeurSelect) {
          onEmployeurSelect(foundEmployeur);
        }
      } else {
        setSelectedEmployeur(null);
        setSearchTerm('');
      }
    } else {
      setSelectedEmployeur(null);
      if (!searchTerm) setSearchTerm('');
    }
  }, [value, employeurs, searchTerm, onEmployeurSelect]);

  const handleSelectEmployeur = (employeur) => {
    if (disabled) return;
    setSelectedEmployeur(employeur);
    setSearchTerm(`${employeur.matricule || ''} - ${employeur.nom || ''}`);
    onChange(employeur.id);
    if (onEmployeurSelect) {
      onEmployeurSelect(employeur);
    }
    setShowResults(false);
  };

  const handleInputChange = (e) => {
    if (disabled) return;
    const value = e.target.value;
    setSearchTerm(value);
    setShowResults(true);
    
    if (value === '' || !value.includes('-')) {
      setSelectedEmployeur(null);
      onChange('');
      if (onEmployeurSelect) {
        onEmployeurSelect(null);
      }
    }
  };

  const handleInputFocus = () => {
    if (disabled) return;
    setShowResults(true);
  };

  const handleInputBlur = () => {
    setTimeout(() => setShowResults(false), 300);
  };

  const getProjetNom = (projetId, projets) => {
    if (!projetId) return 'N/A';
    const projet = projets?.find(p => String(p.id) === String(projetId));
    return projet ? projet.name : `Projet ${projetId}`;
  };

  return (
    <div className="position-relative">
      <Form.Control
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        isInvalid={isInvalid}
        disabled={disabled}
        autoComplete="off"
      />
      
      {showResults && !disabled && searchTerm.trim().length > 0 && (
        <div className="position-absolute top-100 start-0 end-0 bg-white border rounded shadow-lg mt-1"
             style={{ zIndex: 9999, maxHeight: '250px', overflowY: 'auto' }}>
          <div className="p-2 border-bottom bg-light">
            <small className="text-muted">
              {filteredEmployeurs.length} employeur(s) trouvé(s)
            </small>
          </div>
          
          {filteredEmployeurs.length === 0 ? (
            <div className="p-3 text-center text-muted">
              <FaSearch className="me-2" />
              Aucun employeur trouvé
            </div>
          ) : (
            filteredEmployeurs.map(employeur => {
              const isSelected = selectedEmployeur && selectedEmployeur.id === employeur.id;
              return (
                <div
                  key={employeur.id}
                  className={`p-2 border-bottom ${isSelected ? 'bg-primary text-white' : 'hover-bg-light'}`}
                  onClick={() => handleSelectEmployeur(employeur)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="fw-bold">{employeur.matricule || 'N/A'}</div>
                  <div>{employeur.nom || 'Non nommé'}</div>
                  <div className="d-flex gap-2 mt-1 flex-wrap">
                    {employeur.section && (
                      <small className="text-muted">
                        <FaBuilding className="me-1" />
                        {employeur.section}
                      </small>
                    )}
                    {employeur.projet_id && (
                      <small className="text-info">
                        <FaProjectDiagram className="me-1" />
                        {getProjetNom(employeur.projet_id, window.projets || [])}
                      </small>
                    )}
                    {employeur.etat && (
                      <small className={`text-${employeur.etat === 'actif' ? 'success' : 'danger'}`}>
                        <FaCheckCircle className="me-1" style={{ fontSize: '0.6rem' }} />
                        {employeur.etat}
                      </small>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// COMPOSANT MODAL POINTAGE
// ============================================
const PointageModal = ({
  show,
  onHide,
  onSave,
  pointage,
  employeurs,
  projets,
  statutChoices,
  motifChoices,
  canEdit = true
}) => {
  const [formData, setFormData] = useState({
    date: '',
    employeur_id: '',
    projet_id: '',
    statut: 'present',
    motif_abesent: 'NON',
    heures_travail: '',
    observations: ''
  });
  const [errors, setErrors] = useState({});
  const [selectedEmployeurInfo, setSelectedEmployeurInfo] = useState('');
  const [selectedEmployeurProjet, setSelectedEmployeurProjet] = useState(null);
  const [selectedEmployeurSection, setSelectedEmployeurSection] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmployeurSelect = (employeur) => {
    if (!employeur) {
      setSelectedEmployeurInfo('');
      setSelectedEmployeurProjet(null);
      setSelectedEmployeurSection('');
      setFormData(prev => ({ ...prev, projet_id: '' }));
      return;
    }

    setSelectedEmployeurInfo(`${employeur.matricule || ''} - ${employeur.nom || ''}`);
    setSelectedEmployeurSection(employeur.section || 'Non spécifiée');

    const employeurProjet = employeur.projet_id || null;
    setSelectedEmployeurProjet(employeurProjet);
    
    if (employeurProjet) {
      setFormData(prev => ({ ...prev, projet_id: employeurProjet }));
    } else {
      setFormData(prev => ({ ...prev, projet_id: '' }));
    }
  };

  useEffect(() => {
    if (pointage) {
      setFormData({
        id: pointage.id,
        date: pointage.date || '',
        employeur_id: pointage.employeur_id || '',
        projet_id: pointage.projet_id || '',
        statut: pointage.statut || 'present',
        motif_abesent: pointage.motif_abesent || 'NON',
        heures_travail: pointage.heures_travail || '',
        observations: pointage.observations || ''
      });
      if (pointage.employeur_id && employeurs.length > 0) {
        const employeur = employeurs.find(e => String(e.id) === String(pointage.employeur_id));
        if (employeur) {
          setSelectedEmployeurInfo(`${employeur.matricule || ''} - ${employeur.nom || ''}`);
          setSelectedEmployeurSection(employeur.section || 'Non spécifiée');
          const employeurProjet = employeur.projet_id || null;
          setSelectedEmployeurProjet(employeurProjet);
          if (employeurProjet && !pointage.projet_id) {
            setFormData(prev => ({ ...prev, projet_id: employeurProjet }));
          }
        }
      }
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        date: today,
        employeur_id: '',
        projet_id: '',
        statut: 'present',
        motif_abesent: 'NON',
        heures_travail: '',
        observations: ''
      });
      setSelectedEmployeurInfo('');
      setSelectedEmployeurProjet(null);
      setSelectedEmployeurSection('');
    }
    setErrors({});
    setIsSubmitting(false);
  }, [pointage, show, employeurs]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.date) newErrors.date = 'La date est obligatoire';
    if (!formData.employeur_id) newErrors.employeur_id = "L'employeur est obligatoire";
    if (formData.statut === 'absent' && (!formData.motif_abesent || formData.motif_abesent === 'NON')) {
      newErrors.motif_abesent = 'Le motif est obligatoire pour une absence';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) {
      alert("Vous n'avez pas les permissions pour effectuer cette action");
      return;
    }
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);
    await onSave(formData);
    setIsSubmitting(false);
  };

  const handleFieldChange = (field, value) => {
    if (!canEdit) return;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (field === 'statut' && value === 'present') {
      setFormData(prev => ({ ...prev, motif_abesent: 'NON' }));
    }
  };

  const getProjetNom = (projetId) => {
    if (!projetId) return '';
    const projet = projets.find(p => String(p.id) === String(projetId));
    return projet ? (projet.name || `Projet ${projetId}`) : '';
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered backdrop="static">
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          {pointage ? 'Modifier le Pointage' : 'Nouveau Pointage'}
          {!canEdit && (
            <Badge bg="secondary" className="ms-2">
              <FaLock className="me-1" size={12} /> Lecture seule
            </Badge>
          )}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {!canEdit && (
            <Alert variant="secondary" className="mb-3">
              <FaLock className="me-2" />
              <strong>Mode consultation seule</strong> - Vous ne pouvez pas modifier les données
            </Alert>
          )}
          {isSubmitting && (
            <Alert variant="info" className="d-flex align-items-center">
              <Spinner animation="border" size="sm" className="me-2" />
              Enregistrement en cours...
            </Alert>
          )}
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Date *</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.date}
                  onChange={e => handleFieldChange('date', e.target.value)}
                  isInvalid={!!errors.date}
                  disabled={!canEdit || isSubmitting}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.date}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Employeur *</Form.Label>
                <EmployeurSearchSelect
                  employeurs={employeurs}
                  value={formData.employeur_id}
                  onChange={(value) => handleFieldChange('employeur_id', value)}
                  onEmployeurSelect={handleEmployeurSelect}
                  isInvalid={!!errors.employeur_id}
                  disabled={!canEdit || isSubmitting}
                  placeholder="Tapez le matricule ou le nom..."
                />
                {selectedEmployeurInfo && (
                  <div className="mt-2 p-3 bg-success bg-opacity-10 rounded border border-success">
                    <div className="d-flex align-items-center">
                      <FaCheckCircle className="text-success me-2" size={18} />
                      <span className="fw-semibold text-success">
                        {selectedEmployeurInfo}
                      </span>
                    </div>
                    <div className="d-flex align-items-center mt-1 text-info">
                      <FaBuilding className="me-1" />
                      <small>Section: <strong>{selectedEmployeurSection}</strong></small>
                    </div>
                    {selectedEmployeurProjet && (
                      <div className="d-flex align-items-center mt-1 text-primary">
                        <FaProjectDiagram className="me-1" />
                        <small>Projet associé: <strong>{getProjetNom(selectedEmployeurProjet)}</strong></small>
                      </div>
                    )}
                    {!selectedEmployeurProjet && (
                      <div className="d-flex align-items-center mt-1 text-warning">
                        <FaInfoCircle className="me-1" />
                        <small>Aucun projet associé à cet employeur</small>
                      </div>
                    )}
                  </div>
                )}
                <Form.Control.Feedback type="invalid">
                  {errors.employeur_id}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Projet</Form.Label>
                <Form.Select
                  value={formData.projet_id || ''}
                  onChange={e => handleFieldChange('projet_id', e.target.value)}
                  disabled={!canEdit || isSubmitting}
                >
                  <option value="">Non assigné</option>
                  {projets.map(projet => (
                    <option key={projet.id} value={projet.id}>
                      {projet.name || `Projet ${projet.id}`}
                    </option>
                  ))}
                </Form.Select>
                {selectedEmployeurProjet && (
                  <Form.Text className="text-success d-block mt-1">
                    <FaInfoCircle className="me-1" />
                    Projet automatiquement chargé depuis l'employeur
                  </Form.Text>
                )}
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Statut</Form.Label>
                <Form.Select
                  value={formData.statut}
                  onChange={e => handleFieldChange('statut', e.target.value)}
                  disabled={!canEdit || isSubmitting}
                >
                  {statutChoices.map(statut => (
                    <option key={statut.id} value={statut.id}>
                      {statut.nom}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            {formData.statut === 'absent' && (
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Motif d'absence *</Form.Label>
                  <Form.Select
                    value={formData.motif_abesent}
                    onChange={e => handleFieldChange('motif_abesent', e.target.value)}
                    isInvalid={!!errors.motif_abesent}
                    disabled={!canEdit || isSubmitting}
                  >
                    <option value="">Sélectionner un motif</option>
                    {motifChoices.filter(m => m.id !== 'NON').map(motif => (
                      <option key={motif.id} value={motif.id}>
                        {motif.nom}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.motif_abesent}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            )}
            <Col md={6}>
              <Form.Group>
                <Form.Label>Heures de Travail</Form.Label>
                <Form.Control
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={formData.heures_travail}
                  onChange={e => handleFieldChange('heures_travail', parseFloat(e.target.value) || 0)}
                  placeholder="Ex: 8.5 pour 8h30"
                  disabled={!canEdit || isSubmitting}
                />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group>
                <Form.Label>Observations</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.observations}
                  onChange={e => handleFieldChange('observations', e.target.value)}
                  placeholder="Remarques, justificatifs..."
                  disabled={!canEdit || isSubmitting}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onHide} disabled={isSubmitting}>
            Annuler
          </Button>
          {canEdit && (
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : (pointage ? 'Modifier' : 'Ajouter')}
            </Button>
          )}
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

// ============================================
// COMPOSANT DASHBOARD STATISTIQUES
// ============================================
const StatistiquesDashboard = ({ 
  pointages, 
  employeurs, 
  projets,
  onEmployeurClick, 
  canEdit = true
}) => {
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  const [filters, setFilters] = useState({
    section: '',
    projet: '',
    employeur: ''
  });

  const sectionsDisponibles = useMemo(() => {
    const sections = new Set();
    employeurs.forEach(emp => {
      if (emp.section) sections.add(emp.section);
    });
    return Array.from(sections).sort();
  }, [employeurs]);

  const projetsDisponibles = useMemo(() => {
    return projets.filter(p => p.id).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [projets]);

  const calculateStats = () => {
    let employeursFiltres = employeurs;
    if (filters.section) {
      employeursFiltres = employeursFiltres.filter(e => e.section === filters.section);
    }
    if (filters.projet) {
      employeursFiltres = employeursFiltres.filter(e => String(e.projet_id) === String(filters.projet));
    }

    const employeurIds = new Set(employeursFiltres.map(e => String(e.id)));

    const filteredPointages = pointages.filter(p => {
      const pointageDate = p.date;
      if (pointageDate < dateRange.startDate || pointageDate > dateRange.endDate) return false;
      if (filters.employeur && String(p.employeur_id) !== String(filters.employeur)) return false;
      if (!employeurIds.has(String(p.employeur_id))) return false;
      return true;
    });

    const totalPointages = filteredPointages.length;
    const presents = filteredPointages.filter(p => p.statut === 'present').length;
    const absents = filteredPointages.filter(p => p.statut === 'absent').length;
    const tauxPresence = totalPointages > 0 ? (presents / totalPointages * 100).toFixed(1) : 0;
    const tauxAbsence = totalPointages > 0 ? (absents / totalPointages * 100).toFixed(1) : 0;

    const heuresTravail = filteredPointages
      .filter(p => p.statut === 'present')
      .reduce((sum, p) => sum + (parseFloat(p.heures_travail) || 0), 0);
    
    const heuresAbsence = absents * 8;

    const motifsStats = {};
    filteredPointages
      .filter(p => p.statut === 'absent')
      .forEach(p => {
        const motif = p.motif_abesent || 'NON';
        motifsStats[motif] = (motifsStats[motif] || 0) + 1;
      });

    const motifsData = Object.entries(motifsStats).map(([motif, count]) => ({
      name: motif,
      value: count,
      percentage: absents > 0 ? ((count / absents) * 100).toFixed(1) : 0
    }));

    const employeurStats = {};
    employeursFiltres.forEach(emp => {
      const empPointages = filteredPointages.filter(p => String(p.employeur_id) === String(emp.id));
      const empPresents = empPointages.filter(p => p.statut === 'present').length;
      const empAbsents = empPointages.filter(p => p.statut === 'absent').length;
      const empTaux = empPointages.length > 0 ? (empPresents / empPointages.length * 100).toFixed(1) : 0;
      const empHeuresTravail = empPointages
        .filter(p => p.statut === 'present')
        .reduce((sum, p) => sum + (parseFloat(p.heures_travail) || 0), 0);
      const empHeuresAbsence = empAbsents * 8;
      
      employeurStats[emp.id] = {
        id: emp.id,
        nom: `${emp.matricule} - ${emp.nom}`,
        section: emp.section || 'N/A',
        projet: emp.projet_id ? projets.find(p => String(p.id) === String(emp.projet_id))?.name || 'N/A' : 'N/A',
        total: empPointages.length,
        presents: empPresents,
        absents: empAbsents,
        tauxPresence: empTaux,
        heuresTravail: empHeuresTravail,
        heuresAbsence: empHeuresAbsence,
        performance: parseFloat(empTaux) >= 90 ? 'Excellent' : parseFloat(empTaux) >= 70 ? 'Bon' : 'À améliorer'
      };
    });

    const dailyStats = {};
    filteredPointages.forEach(p => {
      if (!dailyStats[p.date]) {
        dailyStats[p.date] = { presents: 0, absents: 0, total: 0 };
      }
      if (p.statut === 'present') {
        dailyStats[p.date].presents++;
      } else {
        dailyStats[p.date].absents++;
      }
      dailyStats[p.date].total++;
    });

    const dailyData = Object.entries(dailyStats).map(([date, stats]) => ({
      date: format(parseISO(date), 'dd/MM'),
      presents: stats.presents,
      absents: stats.absents,
      tauxPresence: ((stats.presents / stats.total) * 100).toFixed(1)
    })).sort((a, b) => a.date.localeCompare(b.date));

    const topAbsents = Object.entries(employeurStats)
      .filter(([_, stats]) => stats.absents > 0)
      .sort((a, b) => b[1].absents - a[1].absents)
      .slice(0, 5)
      .map(([id, stats]) => ({ id, ...stats }));

    return {
      totalPointages,
      presents,
      absents,
      tauxPresence,
      tauxAbsence,
      heuresTravail,
      heuresAbsence,
      motifsData,
      employeurStats,
      dailyData,
      topAbsents
    };
  };

  const stats = calculateStats();

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    if (field === 'section') setFilters(prev => ({ ...prev, employeur: '' }));
  };

  const formatHeures = (heures) => {
    const h = Math.floor(heures);
    const m = Math.round((heures - h) * 60);
    return `${h}h${m > 0 ? m : ''}`;
  };

  const resetFilters = () => {
    setFilters({ section: '', projet: '', employeur: '' });
  };

  return (
    <div className="statistiques-dashboard">
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-light">
          <h6 className="mb-0">
            <FaFilter className="me-2" />
            Filtres des statistiques
          </h6>
        </Card.Header>
        <Card.Body>
          <Row className="g-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label>
                  <FaCalendar className="me-1" />
                  Date Début
                </Form.Label>
                <Form.Control
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => handleDateChange('startDate', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>
                  <FaCalendar className="me-1" />
                  Date Fin
                </Form.Label>
                <Form.Control
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => handleDateChange('endDate', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>
                  <FaBuilding className="me-1" />
                  Section
                </Form.Label>
                <Form.Select
                  value={filters.section}
                  onChange={(e) => handleFilterChange('section', e.target.value)}
                >
                  <option value="">Toutes les sections</option>
                  {sectionsDisponibles.map(section => (
                    <option key={section} value={section}>
                      {section}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>
                  <FaProjectDiagram className="me-1" />
                  Projet
                </Form.Label>
                <Form.Select
                  value={filters.projet}
                  onChange={(e) => handleFilterChange('projet', e.target.value)}
                >
                  <option value="">Tous les projets</option>
                  {projetsDisponibles.map(projet => (
                    <option key={projet.id} value={projet.id}>
                      {projet.name || `Projet ${projet.id}`}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>
                  <FaUserTie className="me-1" />
                  Employeur
                </Form.Label>
                <Form.Select
                  value={filters.employeur}
                  onChange={(e) => handleFilterChange('employeur', e.target.value)}
                >
                  <option value="">Tous les employeurs</option>
                  {employeurs
                    .filter(emp => !filters.section || emp.section === filters.section)
                    .filter(emp => !filters.projet || String(emp.projet_id) === String(filters.projet))
                    .map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.matricule} - {emp.nom}
                      </option>
                    ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>&nbsp;</Form.Label>
                <Button 
                  variant="outline-secondary" 
                  onClick={resetFilters}
                  className="w-100"
                >
                  <FaSync className="me-1" />
                  Réinitialiser
                </Button>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row className="mb-4">
        <Col md={2}>
          <Card className="text-center border-primary shadow-sm">
            <Card.Body className="py-2">
              <h6 className="text-muted mb-1">Total Pointages</h6>
              <h3 className="mb-0 text-primary">{stats.totalPointages}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center border-success shadow-sm">
            <Card.Body className="py-2">
              <h6 className="text-muted mb-1">Présences</h6>
              <h3 className="mb-0 text-success">{stats.presents}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center border-danger shadow-sm">
            <Card.Body className="py-2">
              <h6 className="text-muted mb-1">Absences</h6>
              <h3 className="mb-0 text-danger">{stats.absents}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center border-info shadow-sm">
            <Card.Body className="py-2">
              <h6 className="text-muted mb-1">Heures travaillées</h6>
              <h3 className="mb-0 text-info">{formatHeures(stats.heuresTravail)}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center border-warning shadow-sm">
            <Card.Body className="py-2">
              <h6 className="text-muted mb-1">Heures absence</h6>
              <h3 className="mb-0 text-warning">{formatHeures(stats.heuresAbsence)}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center border-secondary shadow-sm">
            <Card.Body className="py-2">
              <h6 className="text-muted mb-1">Taux présence</h6>
              <h3 className="mb-0 text-secondary">{stats.tauxPresence}%</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={6}>
          <Card className="shadow-sm h-100">
            <Card.Header>
              <h6 className="mb-0">Distribution Présence/Absence</h6>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Présents', value: stats.presents },
                      { name: 'Absents', value: stats.absents }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#28a745" />
                    <Cell fill="#dc3545" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="shadow-sm h-100">
            <Card.Header>
              <h6 className="mb-0">Tendance quotidienne</h6>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="presents" stroke="#28a745" name="Présents" />
                  <Line type="monotone" dataKey="absents" stroke="#dc3545" name="Absents" />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={6}>
          <Card className="shadow-sm h-100">
            <Card.Header>
              <h6 className="mb-0">Répartition des motifs d'absence</h6>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.motifsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="shadow-sm h-100">
            <Card.Header>
              <h6 className="mb-0">Top 5 des absents</h6>
            </Card.Header>
            <Card.Body>
              <Table hover size="sm">
                <thead>
                  <tr>
                    <th>Employé</th>
                    <th>Section</th>
                    <th>Absences</th>
                    <th>Heures absence</th>
                    <th>Taux</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topAbsents.map((emp, index) => (
                    <tr key={emp.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <Badge bg="danger" className="me-2">{index + 1}</Badge>
                          <span 
                            className="text-truncate text-primary employeur-clickable"
                            style={{ maxWidth: '150px', cursor: 'pointer' }}
                            onClick={() => onEmployeurClick && onEmployeurClick(emp.id)}
                            title="Cliquer pour voir les détails"
                          >
                            {emp.nom}
                            <FaInfoCircle className="ms-1" style={{ fontSize: '0.8rem' }} />
                          </span>
                        </div>
                      </td>
                      <td>{emp.section}</td>
                      <td>
                        <Badge bg="danger">{emp.absents}</Badge>
                      </td>
                      <td>
                        <span className="fw-semibold text-warning">{emp.heuresAbsence.toFixed(1)}h</span>
                      </td>
                      <td>
                        <ProgressBar
                          now={100 - parseFloat(emp.tauxPresence)}
                          variant="danger"
                          label={`${(100 - parseFloat(emp.tauxPresence)).toFixed(1)}%`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h6 className="mb-0">
            <FaUserTie className="me-2" />
            Statistiques par Employé
          </h6>
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead className="table-dark">
                <tr>
                  <th>Employé</th>
                  <th>Section</th>
                  <th>Projet</th>
                  <th className="text-center">Présences</th>
                  <th className="text-center">Absences</th>
                  <th className="text-center">Total</th>
                  <th className="text-center">Taux présence</th>
                  <th className="text-center">Heures travaillées</th>
                  <th className="text-center">Heures absence</th>
                  <th className="text-center">Performance</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(stats.employeurStats)
                  .filter(s => s.total > 0)
                  .sort((a, b) => b.tauxPresence - a.tauxPresence)
                  .map((s) => (
                    <tr key={s.id}>
                      <td>
                        <span 
                          className="text-primary fw-semibold employeur-clickable"
                          style={{ cursor: 'pointer' }}
                          onClick={() => onEmployeurClick && onEmployeurClick(s.id)}
                        >
                          {s.nom}
                          <FaInfoCircle className="ms-2" style={{ fontSize: '0.8rem' }} />
                        </span>
                      </td>
                      <td>{s.section}</td>
                      <td>{s.projet}</td>
                      <td className="text-center">
                        <Badge bg="success">{s.presents}</Badge>
                      </td>
                      <td className="text-center">
                        <Badge bg="danger">{s.absents}</Badge>
                      </td>
                      <td className="text-center">
                        <Badge bg="primary">{s.total}</Badge>
                      </td>
                      <td className="text-center">
                        <Badge bg={s.tauxPresence >= 90 ? 'success' : s.tauxPresence >= 70 ? 'warning' : 'danger'}>
                          {s.tauxPresence}%
                        </Badge>
                      </td>
                      <td className="text-center">
                        <span className="fw-semibold text-primary">
                          {s.heuresTravail.toFixed(1)}h
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="fw-semibold text-warning">
                          {s.heuresAbsence.toFixed(1)}h
                        </span>
                      </td>
                      <td className="text-center">
                        {s.tauxPresence >= 90 ? (
                          <Badge bg="success">Excellent</Badge>
                        ) : s.tauxPresence >= 70 ? (
                          <Badge bg="warning">Bon</Badge>
                        ) : s.tauxPresence >= 50 ? (
                          <Badge bg="info">Moyen</Badge>
                        ) : (
                          <Badge bg="danger">À améliorer</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                {Object.values(stats.employeurStats).filter(s => s.total > 0).length === 0 && (
                  <tr>
                    <td colSpan="10" className="text-center py-4">
                      <Alert variant="info" className="mb-0">
                        Aucune donnée de pointage trouvée pour les filtres sélectionnés
                      </Alert>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

// ============================================
// COMPOSANT MODAL DÉTAILS EMPLOYEUR AVEC EXPORT EXCEL
// ============================================
const EmployeurDetailsModal = ({
  show,
  onHide,
  employeur,
  pointages,
  motifAbsenceChoices
}) => {
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  if (!employeur) return null;

  const calculateEmployeurStats = () => {
    const filteredPointages = pointages.filter(p => {
      const pointageDate = p.date;
      return pointageDate >= dateRange.startDate && 
             pointageDate <= dateRange.endDate &&
             String(p.employeur_id) === String(employeur.id);
    });

    const totalPointages = filteredPointages.length;
    const presents = filteredPointages.filter(p => p.statut === 'present').length;
    const absents = filteredPointages.filter(p => p.statut === 'absent').length;
    const heuresTotales = filteredPointages
      .filter(p => p.statut === 'present')
      .reduce((sum, p) => sum + (parseFloat(p.heures_travail) || 0), 0);
    
    const heuresAbsence = absents * 8;
    const tauxPresence = totalPointages > 0 ? (presents / totalPointages * 100).toFixed(1) : 0;

    const absencesParMotif = {};
    filteredPointages
      .filter(p => p.statut === 'absent')
      .forEach(p => {
        const motif = p.motif_abesent || 'NON';
        if (!absencesParMotif[motif]) {
          absencesParMotif[motif] = {
            count: 0,
            details: []
          };
        }
        absencesParMotif[motif].count++;
        absencesParMotif[motif].details.push({
          date: p.date,
          observations: p.observations
        });
      });

    const presencesDetails = filteredPointages
      .filter(p => p.statut === 'present')
      .map(p => ({
        date: p.date,
        heures: parseFloat(p.heures_travail) || 0,
        observations: p.observations
      }))
      .sort((a, b) => b.date.localeCompare(a.date));

    const moyenneHeures = presents > 0 ? (heuresTotales / presents).toFixed(1) : 0;

    return {
      totalPointages,
      presents,
      absents,
      heuresTotales,
      heuresAbsence,
      tauxPresence,
      absencesParMotif,
      presencesDetails,
      moyenneHeures
    };
  };

  const stats = calculateEmployeurStats();

  const getMotifNom = (motifId) => {
    const motif = motifAbsenceChoices.find(m => m.id === motifId);
    return motif ? motif.nom : 'Non spécifié';
  };

  const getMotifColor = (motifId) => {
    const motif = motifAbsenceChoices.find(m => m.id === motifId);
    return motif ? motif.color : 'light';
  };

  const formatDate = (dateString) => {
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, 'dd/MM/yyyy', { locale: fr }) : dateString;
    } catch {
      return dateString;
    }
  };

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const formatHeures = (heures) => {
    const h = Math.floor(heures);
    const m = Math.round((heures - h) * 60);
    return `${h}h${m > 0 ? m : ''}`;
  };

  // ============================================
  // FONCTION D'EXPORT EXCEL
  // ============================================
  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      
      // === Feuille 1: Informations Personnelles ===
      const infoData = [
        ['FICHE EMPLOYEUR'],
        [''],
        ['INFORMATIONS PERSONNELLES'],
        ['Matricule', employeur.matricule || 'Non spécifié'],
        ['Nom', employeur.nom || 'Non spécifié'],
        ['Section', employeur.section || 'Non spécifiée'],
        ['Téléphone', employeur.telephone || 'Non spécifié'],
        ['État', employeur.etat === 'actif' ? 'Actif' : 'Inactif'],
        ['Type de contrat', employeur.type_contrat || employeur.statut || 'Non spécifié'],
        ['Date début', employeur.date_debut ? formatDate(employeur.date_debut) : 'Non spécifiée'],
        ['Date fin', employeur.date_fin ? formatDate(employeur.date_fin) : 'Non spécifiée'],
        [''],
        ['PÉRIODE D\'ANALYSE'],
        ['Date de début', formatDate(dateRange.startDate)],
        ['Date de fin', formatDate(dateRange.endDate)],
        [''],
        ['STATISTIQUES'],
        ['Total pointages', stats.totalPointages],
        ['Présences', stats.presents],
        ['Absences', stats.absents],
        ['Taux de présence', `${stats.tauxPresence}%`],
        ['Heures travaillées', `${stats.heuresTotales.toFixed(1)}h`],
        ['Heures d\'absence', `${stats.heuresAbsence.toFixed(1)}h`],
        ['Moyenne heures/jour', `${stats.moyenneHeures}h`],
        ['Performance', stats.tauxPresence >= 90 ? 'Excellent' : stats.tauxPresence >= 70 ? 'Bon' : 'À améliorer']
      ];

      const ws1 = XLSX.utils.aoa_to_sheet(infoData);
      ws1['!cols'] = [
        { wch: 25 },
        { wch: 30 }
      ];
      XLSX.utils.book_append_sheet(wb, ws1, "Informations");

      // === Feuille 2: Détail des Présences ===
      if (stats.presencesDetails.length > 0) {
        const presenceData = [
          ['DÉTAIL DES PRÉSENCES'],
          [''],
          ['Date', 'Heures travaillées', 'Observations']
        ];
        
        stats.presencesDetails.forEach(p => {
          presenceData.push([
            formatDate(p.date),
            `${p.heures.toFixed(1)}h`,
            p.observations || 'Aucune observation'
          ]);
        });

        presenceData.push(['']);
        presenceData.push(['TOTAL HEURES', `${stats.heuresTotales.toFixed(1)}h`]);
        presenceData.push(['NOMBRE DE PRÉSENCES', stats.presents]);

        const ws2 = XLSX.utils.aoa_to_sheet(presenceData);
        ws2['!cols'] = [
          { wch: 15 },
          { wch: 20 },
          { wch: 40 }
        ];
        XLSX.utils.book_append_sheet(wb, ws2, "Présences");
      }

      // === Feuille 3: Détail des Absences ===
      if (Object.keys(stats.absencesParMotif).length > 0) {
        const absenceData = [
          ['DÉTAIL DES ABSENCES PAR MOTIF'],
          [''],
          ['Motif', 'Nombre', 'Dates']
        ];
        
        Object.entries(stats.absencesParMotif).forEach(([motifId, data]) => {
          absenceData.push([
            getMotifNom(motifId),
            data.count,
            data.details.map(d => formatDate(d.date)).join(', ')
          ]);
        });

        absenceData.push(['']);
        absenceData.push(['TOTAL ABSENCES', stats.absents]);

        const ws3 = XLSX.utils.aoa_to_sheet(absenceData);
        ws3['!cols'] = [
          { wch: 25 },
          { wch: 10 },
          { wch: 40 }
        ];
        XLSX.utils.book_append_sheet(wb, ws3, "Absences");
      }

      // === Feuille 4: Résumé ===
      const resumeData = [
        ['RÉSUMÉ DE LA FICHE EMPLOYEUR'],
        [''],
        ['Informations Générales'],
        ['Matricule', employeur.matricule || 'Non spécifié'],
        ['Nom', employeur.nom || 'Non spécifié'],
        ['Section', employeur.section || 'Non spécifiée'],
        [''],
        ['Statistiques'],
        ['Période', `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`],
        ['Total pointages', stats.totalPointages],
        ['Présences', stats.presents],
        ['Absences', stats.absents],
        ['Taux de présence', `${stats.tauxPresence}%`],
        ['Heures travaillées', `${stats.heuresTotales.toFixed(1)}h`],
        ['Heures d\'absence', `${stats.heuresAbsence.toFixed(1)}h`],
        ['Moyenne heures/jour', `${stats.moyenneHeures}h`],
        ['Performance', stats.tauxPresence >= 90 ? 'Excellent' : stats.tauxPresence >= 70 ? 'Bon' : 'À améliorer'],
        [''],
        ['Document généré le', format(new Date(), 'dd/MM/yyyy à HH:mm')],
        ['Intranet ATTM - Gestion des Ressources Humaines']
      ];

      const ws4 = XLSX.utils.aoa_to_sheet(resumeData);
      ws4['!cols'] = [
        { wch: 25 },
        { wch: 30 }
      ];
      XLSX.utils.book_append_sheet(wb, ws4, "Résumé");

      // Générer le fichier
      const fileName = `Fiche_${employeur.matricule}_${employeur.nom}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      alert(`✅ Fiche exportée avec succès: ${fileName}`);
      
    } catch (error) {
      console.error('❌ Erreur export Excel:', error);
      alert('❌ Erreur lors de l\'export Excel: ' + error.message);
    }
  };

  // ============================================
  // FONCTION D'IMPRESSION
  // ============================================
  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Veuillez autoriser les popups pour imprimer');
      return;
    }

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Fiche Employeur - ${employeur.matricule} - ${employeur.nom}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 1000px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 3px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #007bff; margin: 0; font-size: 24px; }
          .section { margin-bottom: 25px; page-break-inside: avoid; }
          .section-title { background-color: #f8f9fa; padding: 10px 15px; border-left: 4px solid #007bff; font-weight: bold; font-size: 16px; margin-bottom: 15px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 0 15px; }
          .info-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .info-item .label { color: #6c757d; font-weight: 500; }
          .info-item .value { font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          table th { background-color: #f8f9fa; padding: 10px; text-align: left; border: 1px solid #dee2e6; font-weight: 600; }
          table td { padding: 8px 10px; border: 1px solid #dee2e6; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; font-size: 12px; }
          .badge-success { background: #28a745; color: white; padding: 3px 10px; border-radius: 12px; }
          .badge-danger { background: #dc3545; color: white; padding: 3px 10px; border-radius: 12px; }
          .badge-warning { background: #ffc107; color: #212529; padding: 3px 10px; border-radius: 12px; }
          .badge-info { background: #17a2b8; color: white; padding: 3px 10px; border-radius: 12px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📋 Fiche Employeur</h1>
          <div style="color: #6c757d; margin-top: 5px;">${employeur.matricule} - ${employeur.nom}</div>
        </div>

        <div class="section">
          <div class="section-title">👤 Informations Personnelles</div>
          <div class="info-grid">
            <div class="info-item"><span class="label">Matricule</span><span class="value">${employeur.matricule || 'Non spécifié'}</span></div>
            <div class="info-item"><span class="label">Nom</span><span class="value">${employeur.nom || 'Non spécifié'}</span></div>
            <div class="info-item"><span class="label">Section</span><span class="value">${employeur.section || 'Non spécifiée'}</span></div>
            <div class="info-item"><span class="label">Téléphone</span><span class="value">${employeur.telephone || 'Non spécifié'}</span></div>
            <div class="info-item"><span class="label">État</span><span class="value"><span class="${employeur.etat === 'actif' ? 'badge-success' : 'badge-danger'}">${employeur.etat === 'actif' ? 'Actif' : 'Inactif'}</span></span></div>
            <div class="info-item"><span class="label">Type de contrat</span><span class="value">${employeur.type_contrat || employeur.statut || 'Non spécifié'}</span></div>
            <div class="info-item"><span class="label">Date début</span><span class="value">${employeur.date_debut ? formatDate(employeur.date_debut) : 'Non spécifiée'}</span></div>
            <div class="info-item"><span class="label">Date fin</span><span class="value">${employeur.date_fin ? formatDate(employeur.date_fin) : 'Non spécifiée'}</span></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">📅 Période d'analyse</div>
          <div class="info-grid">
            <div class="info-item"><span class="label">Date de début</span><span class="value">${formatDate(dateRange.startDate)}</span></div>
            <div class="info-item"><span class="label">Date de fin</span><span class="value">${formatDate(dateRange.endDate)}</span></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">📊 Statistiques</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px; padding: 0 15px;">
            <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px;">
              <div style="color: #6c757d; font-size: 12px;">Présences</div>
              <div style="font-size: 24px; font-weight: bold; color: #28a745;">${stats.presents}</div>
            </div>
            <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px;">
              <div style="color: #6c757d; font-size: 12px;">Absences</div>
              <div style="font-size: 24px; font-weight: bold; color: #dc3545;">${stats.absents}</div>
            </div>
            <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px;">
              <div style="color: #6c757d; font-size: 12px;">Total pointages</div>
              <div style="font-size: 24px; font-weight: bold; color: #007bff;">${stats.totalPointages}</div>
            </div>
            <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px;">
              <div style="color: #6c757d; font-size: 12px;">Taux de présence</div>
              <div style="font-size: 24px; font-weight: bold; color: #ffc107;">${stats.tauxPresence}%</div>
            </div>
          </div>
        </div>

        ${Object.keys(stats.absencesParMotif).length > 0 ? `
        <div class="section">
          <div class="section-title">❌ Détail des Absences par Motif</div>
          <table>
            <thead><tr><th>Motif</th><th>Nombre</th><th>Dates</th></tr></thead>
            <tbody>
              ${Object.entries(stats.absencesParMotif).map(([motifId, data]) => `
                <tr>
                  <td><span class="badge-${getMotifColor(motifId)}">${getMotifNom(motifId)}</span></td>
                  <td>${data.count}</td>
                  <td>${data.details.map(d => formatDate(d.date)).join(', ')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${stats.presencesDetails.length > 0 ? `
        <div class="section">
          <div class="section-title">✅ Dernières Présences (${stats.presencesDetails.length})</div>
          <table>
            <thead><tr><th>Date</th><th>Heures travaillées</th><th>Observations</th></tr></thead>
            <tbody>
              ${stats.presencesDetails.slice(0, 10).map(p => `
                <tr>
                  <td>${formatDate(p.date)}</td>
                  <td>${p.heures.toFixed(1)}h</td>
                  <td>${p.observations || 'Aucune observation'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ${stats.presencesDetails.length > 10 ? `
            <div style="margin-top: 10px; text-align: center; color: #6c757d; font-size: 12px;">
              Et ${stats.presencesDetails.length - 10} autres journées de travail...
            </div>
          ` : ''}
        </div>
        ` : ''}

        <div class="footer">
          <p>Document généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm')}</p>
          <p>Intranet ATTM - Gestion des Ressources Humaines</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered backdrop="static">
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <FaUserTie className="me-2" />
          Fiche Employeur : {employeur.matricule} - {employeur.nom}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row className="g-4">
          <Col md={4}>
            <Card className="h-100 shadow-sm">
              <Card.Header className="bg-info text-white">
                <h5 className="mb-0">
                  <FaUser className="me-2" />
                  Informations Personnelles
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="text-center mb-3">
                  <div className="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                       style={{ width: '100px', height: '100px' }}>
                    <FaUser className="text-white" style={{ fontSize: '3rem' }} />
                  </div>
                  <h4 className="mb-1">{employeur.nom}</h4>
                  <Badge bg="secondary" className="mb-3">Matricule: {employeur.matricule}</Badge>
                </div>
                
                <div className="list-group list-group-flush">
                  <div className="list-group-item d-flex justify-content-between align-items-center">
                    <span className="text-muted">Section</span>
                    <span className="fw-semibold">{employeur.section || 'Non spécifiée'}</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between align-items-center">
                    <span className="text-muted">Téléphone</span>
                    <span className="fw-semibold">{employeur.telephone || 'Non spécifié'}</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between align-items-center">
                    <span className="text-muted">État</span>
                    <Badge bg={employeur.etat === 'actif' ? 'success' : 'danger'}>
                      {employeur.etat === 'actif' ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                  <div className="list-group-item d-flex justify-content-between align-items-center">
                    <span className="text-muted">Type de contrat</span>
                    <span className="fw-semibold">{employeur.type_contrat || employeur.statut || 'Non spécifié'}</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between align-items-center">
                    <span className="text-muted">Date début</span>
                    <span className="fw-semibold">{employeur.date_debut ? formatDate(employeur.date_debut) : 'Non spécifiée'}</span>
                  </div>
                  {employeur.date_fin && (
                    <div className="list-group-item d-flex justify-content-between align-items-center">
                      <span className="text-muted">Date fin</span>
                      <span className="fw-semibold">{formatDate(employeur.date_fin)}</span>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={8}>
            <Card className="mb-4 shadow-sm">
              <Card.Header className="bg-secondary text-white">
                <h5 className="mb-0">
                  <FaCalendar className="me-2" />
                  Période d'analyse
                </h5>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Date de début</Form.Label>
                      <Form.Control
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) => handleDateChange('startDate', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Date de fin</Form.Label>
                      <Form.Control
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) => handleDateChange('endDate', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Row className="mb-4">
              <Col md={4}>
                <Card className="text-center border-success shadow-sm h-100">
                  <Card.Body>
                    <div className="text-success mb-2">
                      <FaCheckCircle style={{ fontSize: '2.5rem' }} />
                    </div>
                    <h2 className="mb-1">{stats.presents}</h2>
                    <Card.Title>Présences</Card.Title>
                    <Badge bg="success" className="fs-6">
                      {stats.tauxPresence}%
                    </Badge>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="text-center border-danger shadow-sm h-100">
                  <Card.Body>
                    <div className="text-danger mb-2">
                      <FaTimesCircle style={{ fontSize: '2.5rem' }} />
                    </div>
                    <h2 className="mb-1">{stats.absents}</h2>
                    <Card.Title>Absences</Card.Title>
                    <Badge bg="danger" className="fs-6">
                      {stats.totalPointages > 0 ? ((stats.absents / stats.totalPointages) * 100).toFixed(1) : 0}%
                    </Badge>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="text-center border-primary shadow-sm h-100">
                  <Card.Body>
                    <div className="text-primary mb-2">
                      <FaClock style={{ fontSize: '2.5rem' }} />
                    </div>
                    <h2 className="mb-1">{formatHeures(stats.heuresTotales)}</h2>
                    <Card.Title>Heures travaillées</Card.Title>
                    <Badge bg="primary" className="fs-6">
                      Moyenne: {stats.moyenneHeures}h/jour
                    </Badge>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {stats.absents > 0 && (
              <Card className="mb-4 shadow-sm">
                <Card.Header className="bg-warning text-dark">
                  <h5 className="mb-0">
                    <FaClipboardCheck className="me-2" />
                    Détail des Absences par Motif
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div className="table-responsive">
                    <Table hover size="sm">
                      <thead>
                        <tr>
                          <th>Motif</th>
                          <th>Nombre</th>
                          <th>Dates</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(stats.absencesParMotif).map(([motifId, data]) => (
                          <tr key={motifId}>
                            <td>
                              <Badge bg={getMotifColor(motifId)} className="px-3 py-2">
                                {getMotifNom(motifId)}
                              </Badge>
                            </td>
                            <td>
                              <strong>{data.count}</strong>
                            </td>
                            <td>
                              <div className="d-flex flex-wrap gap-1">
                                {data.details.slice(0, 3).map((detail, idx) => (
                                  <Badge key={idx} bg="light" text="dark" className="me-1">
                                    {formatDate(detail.date)}
                                  </Badge>
                                ))}
                                {data.details.length > 3 && (
                                  <Badge bg="secondary">
                                    +{data.details.length - 3} autres
                                  </Badge>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            )}

            {stats.presencesDetails.length > 0 && (
              <Card className="shadow-sm">
                <Card.Header className="bg-success text-white">
                  <h5 className="mb-0">
                    <FaCheckCircle className="me-2" />
                    Dernières Présences ({stats.presencesDetails.length})
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div className="table-responsive">
                    <Table hover size="sm">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Heures travaillées</th>
                          <th>Observations</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.presencesDetails.slice(0, 5).map((presence, index) => (
                          <tr key={index}>
                            <td className="fw-semibold">
                              {formatDate(presence.date)}
                            </td>
                            <td>
                              <Badge bg="info" className="px-3 py-2">
                                {presence.heures.toFixed(1)}h
                              </Badge>
                            </td>
                            <td>
                              <small className="text-muted">
                                {presence.observations || 'Aucune observation'}
                              </small>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                    {stats.presencesDetails.length > 5 && (
                      <div className="text-center mt-2">
                        <small className="text-muted">
                          Et {stats.presencesDetails.length - 5} autres journées de travail...
                        </small>
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <div className="d-flex justify-content-between w-100">
          <div>
            <Badge bg="info" className="me-2">
              Total pointages: {stats.totalPointages}
            </Badge>
            <Badge bg={stats.tauxPresence >= 90 ? 'success' : stats.tauxPresence >= 70 ? 'warning' : 'danger'}>
              Performance: {stats.tauxPresence >= 90 ? 'Excellent' : stats.tauxPresence >= 70 ? 'Bon' : 'À améliorer'}
            </Badge>
          </div>
          <div>
            <Button variant="outline-secondary" onClick={onHide} className="me-2">
              Fermer
            </Button>
            <Button 
              variant="info" 
              onClick={handlePrint}
              className="me-2"
              title="Imprimer la fiche"
            >
              <FaPrint className="me-1" />
              Imprimer
            </Button>
            <Button 
              variant="success" 
              onClick={handleExportExcel}
              title="Exporter en Excel"
            >
              <FaFileExcel className="me-1" />
              Exporter Excel
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

// ============================================
// COMPOSANT PRINCIPAL GESTION POINTAGE
// ============================================
const GestionPointage = () => {
  const { userRole, userName, userLoading, canEdit, getRoleLabel, getRoleBadgeColor } = usePermissions();

  const [state, setState] = useState({
    pointages: [],
    employeurs: [],
    projets: [],
    loading: true,
    error: null,
    showModal: false,
    editingPointage: null,
    showDeleteModal: false,
    pointageToDelete: null,
    showEmployeurDetails: false,
    selectedEmployeur: null,
    filters: {
      dateDebut: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      dateFin: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
      employeur_id: '',
      projet_id: '',
      statut: '',
      section: '',
      search: ''
    },
    activeTab: 'statistiques'
  });

  const statutPointageChoices = [
    { id: 'present', nom: 'Présent', color: 'success' },
    { id: 'absent', nom: 'Absent', color: 'danger' }
  ];

  const motifAbsenceChoices = [
    { id: 'AI', nom: 'Absence non Justifiée', color: 'danger' },
    { id: 'AJ', nom: 'Absence Justifiée', color: 'info' },
    { id: 'AM', nom: 'Maladie', color: 'warning' },
    { id: 'AT', nom: 'Accident du Travail', color: 'warning' },
    { id: 'CP', nom: 'Congé Payé', color: 'success' },
    { id: 'CS', nom: 'Congé sans Solde', color: 'secondary' },
    { id: 'NON', nom: 'Non spécifié', color: 'light' }
  ];

  const sectionsDisponibles = useMemo(() => {
    const sections = new Set();
    state.employeurs.forEach(emp => {
      if (emp.section) sections.add(emp.section);
    });
    return Array.from(sections).sort();
  }, [state.employeurs]);

  const projetsDisponibles = useMemo(() => {
    return state.projets.filter(p => p.id).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [state.projets]);

  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Charger les employeurs
      try {
        const employeursResponse = await api.get('/employeurs');
        let employeursData = [];
        if (employeursResponse.data?.data) {
          employeursData = employeursResponse.data.data;
        } else if (Array.isArray(employeursResponse.data)) {
          employeursData = employeursResponse.data;
        }
        if (employeursData.length > 0) {
          localStorage.setItem('employeurs_list', JSON.stringify(employeursData));
          setState(prev => ({ ...prev, employeurs: employeursData }));
        }
      } catch (error) {
        console.warn('Erreur chargement employeurs:', error);
        const storedEmployeurs = localStorage.getItem('employeurs_list');
        if (storedEmployeurs) {
          setState(prev => ({ ...prev, employeurs: JSON.parse(storedEmployeurs) }));
        }
      }

      // Charger les projets
      try {
        const projetsResponse = await api.get('/projets');
        let projetsData = [];
        if (projetsResponse.data?.data) {
          projetsData = projetsResponse.data.data;
        } else if (Array.isArray(projetsResponse.data)) {
          projetsData = projetsResponse.data;
        }
        if (projetsData.length > 0) {
          localStorage.setItem('projets_list', JSON.stringify(projetsData));
          setState(prev => ({ ...prev, projets: projetsData }));
        }
      } catch (error) {
        console.warn('Erreur chargement projets:', error);
        const storedProjets = localStorage.getItem('projets_list');
        if (storedProjets) {
          setState(prev => ({ ...prev, projets: JSON.parse(storedProjets) }));
        }
      }

      // Charger les pointages
      try {
        const pointagesResponse = await api.get('/pointages');
        let pointagesData = [];
        if (pointagesResponse.data?.data) {
          pointagesData = pointagesResponse.data.data;
        } else if (Array.isArray(pointagesResponse.data)) {
          pointagesData = pointagesResponse.data;
        }
        if (pointagesData.length > 0) {
          localStorage.setItem('pointages_list', JSON.stringify(pointagesData));
          setState(prev => ({ ...prev, pointages: pointagesData }));
        }
      } catch (error) {
        console.warn('Erreur chargement pointages:', error);
        const storedPointages = localStorage.getItem('pointages_list');
        if (storedPointages) {
          setState(prev => ({ ...prev, pointages: JSON.parse(storedPointages) }));
        }
      }

      setState(prev => ({ ...prev, loading: false }));
      
    } catch (err) {
      console.error('❌ Erreur chargement:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: `Erreur de chargement: ${err.message}`
      }));
    }
  }, []);

  useEffect(() => {
    if (!userLoading) {
      fetchData();
    }
  }, [fetchData, userLoading]);

  // Filtrer les pointages
  const filteredPointages = state.pointages.filter(pointage => {
    const dateMatch =
      (!state.filters.dateDebut || pointage.date >= state.filters.dateDebut) &&
      (!state.filters.dateFin || pointage.date <= state.filters.dateFin);
    
    const employeurMatch = !state.filters.employeur_id || 
      String(pointage.employeur_id) === String(state.filters.employeur_id);
    
    const projetMatch = !state.filters.projet_id || 
      String(pointage.projet_id) === String(state.filters.projet_id);
    
    const statutMatch = !state.filters.statut || pointage.statut === state.filters.statut;

    let sectionMatch = true;
    if (state.filters.section) {
      const employeur = state.employeurs.find(e => String(e.id) === String(pointage.employeur_id));
      sectionMatch = employeur && employeur.section === state.filters.section;
    }

    return dateMatch && employeurMatch && projetMatch && statutMatch && sectionMatch;
  });

  const exportToExcel = () => {
    try {
      const exportData = filteredPointages.map(pointage => {
        const employeur = state.employeurs.find(e => String(e.id) === String(pointage.employeur_id));
        const projet = state.projets.find(p => String(p.id) === String(pointage.projet_id));
        const motif = motifAbsenceChoices.find(m => m.id === pointage.motif_abesent);
        
        return {
          'Date': formatDateDisplay(pointage.date),
          'Matricule': employeur ? employeur.matricule : '',
          'Employeur': employeur ? employeur.nom : '',
          'Section': employeur ? employeur.section : '',
          'Projet': pointage.projet_id ? (projet ? projet.name : `Projet ${pointage.projet_id}`) : 'Non assigné',
          'Statut': pointage.statut === 'present' ? 'Présent' : 'Absent',
          'Motif': pointage.statut === 'absent' ? (motif ? motif.nom : 'Non spécifié') : 'N/A',
          'Heures': pointage.statut === 'present' ? `${parseFloat(pointage.heures_travail || 0).toFixed(1)}h` : '0.0h',
          'Observations': pointage.observations || ''
        };
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      const colWidths = [
        { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 15 },
        { wch: 15 }, { wch: 10 }, { wch: 20 }, { wch: 12 }, { wch: 30 }
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "Pointage");

      const fileName = `pointage_${format(new Date(), 'dd_MM_yyyy')}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      alert(`✅ Fichier Excel généré avec succès: ${fileName}`);
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'export Excel:', error);
      alert('❌ Erreur lors de l\'export Excel: ' + error.message);
    }
  };

  const exportStatsToExcel = () => {
    try {
      const statsData = [];
      const filteredPointagesStats = state.pointages.filter(p => {
        const dateMatch =
          (!state.filters.dateDebut || p.date >= state.filters.dateDebut) &&
          (!state.filters.dateFin || p.date <= state.filters.dateFin);
        
        let sectionMatch = true;
        if (state.filters.section) {
          const employeur = state.employeurs.find(e => String(e.id) === String(p.employeur_id));
          sectionMatch = employeur && employeur.section === state.filters.section;
        }
        
        let projetMatch = true;
        if (state.filters.projet_id) {
          projetMatch = String(p.projet_id) === String(state.filters.projet_id);
        }
        
        return dateMatch && sectionMatch && projetMatch;
      });
      
      state.employeurs.forEach(emp => {
        const empPointages = filteredPointagesStats.filter(p => String(p.employeur_id) === String(emp.id));
        const empPresents = empPointages.filter(p => p.statut === 'present').length;
        const empAbsents = empPointages.filter(p => p.statut === 'absent').length;
        const empTaux = empPointages.length > 0 ? (empPresents / empPointages.length * 100).toFixed(1) : 0;
        const empHeuresTravail = empPointages
          .filter(p => p.statut === 'present')
          .reduce((sum, p) => sum + (parseFloat(p.heures_travail) || 0), 0);
        const empHeuresAbsence = empAbsents * 8;
        const projetNom = emp.projet_id ? 
          state.projets.find(p => String(p.id) === String(emp.projet_id))?.name || 'N/A' : 'N/A';
        
        statsData.push({
          'Matricule': emp.matricule,
          'Employeur': emp.nom,
          'Section': emp.section || 'N/A',
          'Projet': projetNom,
          'Présences': empPresents,
          'Absences': empAbsents,
          'Total': empPointages.length,
          'Taux présence': `${empTaux}%`,
          'Heures travaillées': `${empHeuresTravail.toFixed(1)}h`,
          'Heures absence': `${empHeuresAbsence.toFixed(1)}h`,
          'Performance': parseFloat(empTaux) >= 90 ? 'Excellent' : parseFloat(empTaux) >= 70 ? 'Bon' : 'À améliorer'
        });
      });

      const totalPresents = filteredPointagesStats.filter(p => p.statut === 'present').length;
      const totalAbsents = filteredPointagesStats.filter(p => p.statut === 'absent').length;
      const totalHeuresTravail = filteredPointagesStats
        .filter(p => p.statut === 'present')
        .reduce((sum, p) => sum + (parseFloat(p.heures_travail) || 0), 0);
      const totalHeuresAbsence = totalAbsents * 8;
      const totalTaux = filteredPointagesStats.length > 0 ? ((totalPresents / filteredPointagesStats.length) * 100).toFixed(1) : 0;
      
      const summaryRow = {
        'Matricule': 'TOTAL',
        'Employeur': '',
        'Section': '',
        'Projet': '',
        'Présences': totalPresents,
        'Absences': totalAbsents,
        'Total': filteredPointagesStats.length,
        'Taux présence': `${totalTaux}%`,
        'Heures travaillées': `${totalHeuresTravail.toFixed(1)}h`,
        'Heures absence': `${totalHeuresAbsence.toFixed(1)}h`,
        'Performance': ''
      };

      const dataWithSummary = [...statsData.filter(s => s['Total'] > 0), summaryRow];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dataWithSummary);
      
      const colWidths = [
        { wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
        { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "Statistiques");

      const fileName = `statistiques_pointages_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      alert(`✅ Fichier Excel des statistiques généré avec succès: ${fileName}`);
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'export des statistiques Excel:', error);
      alert('❌ Erreur lors de l\'export des statistiques Excel: ' + error.message);
    }
  };

  const handleShowEmployeurDetails = (employeurId) => {
    const employeur = state.employeurs.find(e => String(e.id) === String(employeurId));
    if (employeur) {
      setState(prev => ({
        ...prev,
        showEmployeurDetails: true,
        selectedEmployeur: employeur
      }));
    }
  };

  const handleCloseEmployeurDetails = () => {
    setState(prev => ({
      ...prev,
      showEmployeurDetails: false,
      selectedEmployeur: null
    }));
  };

  const getProjetNom = (projetId) => {
    if (!projetId) return 'Non assigné';
    const projet = state.projets.find(p => String(p.id) === String(projetId));
    return projet ? projet.name : `Projet ${projetId}`;
  };

  const getEmployeurNom = (employeurId, clickable = true) => {
    if (!employeurId) return 'Employeur inconnu';
    const employeur = state.employeurs.find(e => String(e.id) === String(employeurId));
    
    if (!employeur) return `Employeur ${employeurId}`;
    
    const nom = `${employeur.matricule} - ${employeur.nom}`;
    
    if (clickable) {
      return (
        <span 
          className="text-primary fw-semibold employeur-clickable"
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            handleShowEmployeurDetails(employeurId);
          }}
          title="Cliquer pour voir les détails"
        >
          {nom}
          <FaInfoCircle className="ms-2" style={{ fontSize: '0.8rem' }} />
        </span>
      );
    }
    
    return nom;
  };

  const getStatutDetails = (statutId) => {
    const statut = statutPointageChoices.find(s => s.id === statutId);
    return statut ? statut : { nom: 'Inconnu', color: 'secondary' };
  };

  const getMotifDetails = (motifId) => {
    const motif = motifAbsenceChoices.find(m => m.id === motifId);
    return motif ? motif : { nom: 'Non spécifié', color: 'light' };
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return 'Non spécifiée';
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, 'dd/MM/yyyy', { locale: fr }) : dateString;
    } catch {
      return dateString;
    }
  };

  const handleShowModal = (pointage = null) => {
    if (!canEdit) {
      alert("Vous n'avez pas les permissions pour ajouter ou modifier des pointages");
      return;
    }
    setState(prev => ({ ...prev, showModal: true, editingPointage: pointage }));
  };

  const handleCloseModal = () => {
    setState(prev => ({ ...prev, showModal: false, editingPointage: null }));
  };

  const handleShowDeleteModal = (pointage) => {
    if (!canEdit) {
      alert("Vous n'avez pas les permissions pour supprimer des pointages");
      return;
    }
    setState(prev => ({ ...prev, showDeleteModal: true, pointageToDelete: pointage }));
  };

  const handleCloseDeleteModal = () => {
    setState(prev => ({ ...prev, showDeleteModal: false, pointageToDelete: null }));
  };

  const handleSave = async (formData) => {
    if (!canEdit) {
      alert("Vous n'avez pas les permissions pour effectuer cette action");
      return;
    }

    try {
      if (!formData.date || !formData.employeur_id) {
        alert('❌ Les champs Date et Employeur sont obligatoires');
        return;
      }

      const dataToSend = {
        date: formData.date,
        statut: formData.statut || 'present',
        motif_abesent: formData.statut === 'absent' ? (formData.motif_abesent || 'NON') : 'NON',
        heures_travail: parseFloat(formData.heures_travail) || 0,
        observations: formData.observations || '',
        employeur_id: formData.employeur_id,
        projet_id: formData.projet_id || null
      };

      console.log('📤 Envoi des données:', dataToSend);

      let response;
      if (formData.id) {
        response = await api.put(`/pointages/${formData.id}`, dataToSend);
      } else {
        response = await api.post('/pointages', dataToSend);
      }

      console.log('✅ Réponse API:', response.data);
      
      // Recharger les données
      await fetchData();

      handleCloseModal();
      alert('✅ Pointage sauvegardé avec succès!');
      
    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      
      let errorMessage = 'Erreur lors de la sauvegarde. ';
      
      if (error.response) {
        if (error.response.status === 422) {
          const errors = error.response.data.messages || error.response.data.errors;
          if (errors) {
            errorMessage = 'Erreurs de validation:\n';
            Object.entries(errors).forEach(([field, messages]) => {
              errorMessage += `• ${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}\n`;
            });
          }
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        } else {
          errorMessage += `Status: ${error.response.status}`;
        }
      } else if (error.request) {
        errorMessage += 'Pas de réponse du serveur. Vérifiez votre connexion.';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (!canEdit) {
      alert("Vous n'avez pas les permissions pour supprimer des pointages");
      return;
    }
    if (!state.pointageToDelete) return;

    try {
      await api.delete(`/pointages/${state.pointageToDelete.id}`);
      
      // Recharger les données
      await fetchData();

      handleCloseDeleteModal();
      alert('🗑️ Pointage supprimé avec succès!');
      
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      alert(`❌ Erreur lors de la suppression: ${error.response?.data?.error || error.message}`);
    }
  };

  const resetFilters = () => {
    setState(prev => ({
      ...prev,
      filters: {
        dateDebut: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        dateFin: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
        employeur_id: '',
        projet_id: '',
        statut: '',
        section: '',
        search: ''
      }
    }));
  };

  const reloadData = () => {
    fetchData();
  };

  if (userLoading || state.loading) {
    return (
      <Container fluid className="py-5">
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" size="lg" />
          <p className="mt-3">Chargement des données...</p>
          <Button variant="outline-primary" onClick={reloadData}>
            <FaSync className="me-2" />
            Rafraîchir
          </Button>
        </div>
      </Container>
    );
  }

  if (state.error) {
    return (
      <Container fluid className="py-4">
        <Alert variant="danger" className="shadow">
          <h4 className="alert-heading">
            <FaTimesCircle className="me-2" />
            Erreur de chargement
          </h4>
          <p>{state.error}</p>
          <hr />
          <Button variant="danger" onClick={reloadData}>
            <FaSync className="me-2" />
            Réessayer
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="p-0">
      <Card className="shadow-lg border-0">
        <Card.Header className="bg-primary text-white py-3">
          <Row className="align-items-center">
            <Col>
              <h3 className="mb-0">
                <FaClock className="me-2" />
                Gestion des Pointages & Statistiques
              </h3>
              <div className="mt-1">
                <Badge bg={getRoleBadgeColor()} className="me-2">
                  {canEdit ? <FaUserShield className="me-1" size={12} /> : <FaUser className="me-1" size={12} />}
                  {getRoleLabel()}
                </Badge>
                <small className="text-white-50">
                  Connecté: {userName}
                </small>
              </div>
            </Col>
            <Col xs="auto">
              <div className="d-flex gap-2">
                <Button variant="light" size="sm" onClick={reloadData}>
                  <FaSync className="me-1" />
                  Actualiser
                </Button>
                {canEdit && (
                  <Button variant="success" size="sm" onClick={() => handleShowModal()}>
                    <FaPlus className="me-1" />
                    Nouveau Pointage
                  </Button>
                )}
              </div>
            </Col>
          </Row>
        </Card.Header>
        
        <Card.Body className="p-4">
          {!canEdit && (
            <Alert variant="secondary" className="mb-4">
              <FaLock className="me-2" />
              <strong>Mode consultation seule</strong> - Vous pouvez consulter les données mais pas les modifier
            </Alert>
          )}
          
          <Tabs 
            activeKey={state.activeTab} 
            onSelect={(tab) => setState(prev => ({ ...prev, activeTab: tab }))}
            className="mb-4"
          >
            <Tab eventKey="statistiques" title={
              <span>
                <FaChartBar className="me-1" />
                Statistiques
              </span>
            }>
              <div className="d-flex justify-content-end mb-3">
                <Button 
                  variant="success" 
                  onClick={exportStatsToExcel}
                  className="d-flex align-items-center"
                >
                  <FaFileExcel className="me-2" />
                  Exporter les Statistiques en Excel
                </Button>
              </div>
              <StatistiquesDashboard 
                pointages={state.pointages} 
                employeurs={state.employeurs}
                projets={state.projets}
                onEmployeurClick={handleShowEmployeurDetails}
                canEdit={canEdit}
              />
            </Tab>
            
            <Tab eventKey="liste" title={
              <span>
                <FaUsers className="me-1" />
                Liste des Pointages ({filteredPointages.length})
              </span>
            }>
              <Card className="mb-4 border shadow-sm">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">
                    <FaFilter className="me-2" />
                    Filtres
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Row className="g-3">
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>
                          <FaCalendar className="me-1" />
                          Date Début
                        </Form.Label>
                        <Form.Control
                          type="date"
                          value={state.filters.dateDebut}
                          onChange={e => setState(prev => ({
                            ...prev,
                            filters: { ...prev.filters, dateDebut: e.target.value }
                          }))}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>
                          <FaCalendar className="me-1" />
                          Date Fin
                        </Form.Label>
                        <Form.Control
                          type="date"
                          value={state.filters.dateFin}
                          onChange={e => setState(prev => ({
                            ...prev,
                            filters: { ...prev.filters, dateFin: e.target.value }
                          }))}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>
                          <FaBuilding className="me-1" />
                          Section
                        </Form.Label>
                        <Form.Select
                          value={state.filters.section}
                          onChange={e => setState(prev => ({
                            ...prev,
                            filters: { ...prev.filters, section: e.target.value }
                          }))}
                        >
                          <option value="">Toutes les sections</option>
                          {sectionsDisponibles.map(section => (
                            <option key={section} value={section}>
                              {section}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>
                          <FaProjectDiagram className="me-1" />
                          Projet
                        </Form.Label>
                        <Form.Select
                          value={state.filters.projet_id}
                          onChange={e => setState(prev => ({
                            ...prev,
                            filters: { ...prev.filters, projet_id: e.target.value }
                          }))}
                        >
                          <option value="">Tous les projets</option>
                          {projetsDisponibles.map(projet => (
                            <option key={projet.id} value={projet.id}>
                              {projet.name || `Projet ${projet.id}`}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>
                          <FaUserTie className="me-1" />
                          Employeur
                        </Form.Label>
                        <Form.Select
                          value={state.filters.employeur_id}
                          onChange={e => setState(prev => ({
                            ...prev,
                            filters: { ...prev.filters, employeur_id: e.target.value }
                          }))}
                        >
                          <option value="">Tous les employeurs</option>
                          {state.employeurs
                            .filter(emp => !state.filters.section || emp.section === state.filters.section)
                            .filter(emp => !state.filters.projet_id || String(emp.projet_id) === String(state.filters.projet_id))
                            .map(employeur => (
                              <option key={employeur.id} value={employeur.id}>
                                {employeur.matricule} - {employeur.nom}
                              </option>
                            ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Statut</Form.Label>
                        <Form.Select
                          value={state.filters.statut}
                          onChange={e => setState(prev => ({
                            ...prev,
                            filters: { ...prev.filters, statut: e.target.value }
                          }))}
                        >
                          <option value="">Tous les statuts</option>
                          {statutPointageChoices.map(statut => (
                            <option key={statut.id} value={statut.id}>
                              {statut.nom}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <div className="d-flex justify-content-between align-items-center">
                        <Button variant="outline-secondary" onClick={resetFilters}>
                          <FaSync className="me-1" />
                          Réinitialiser les filtres
                        </Button>
                        <div className="d-flex align-items-center gap-2">
                          <span className="text-muted">
                            {filteredPointages.length} pointage(s) trouvé(s)
                          </span>
                          {filteredPointages.length > 0 && (
                            <Button 
                              variant="success" 
                              onClick={exportToExcel}
                              className="d-flex align-items-center"
                              size="sm"
                            >
                              <FaFileExcel className="me-2" />
                              Exporter en Excel
                            </Button>
                          )}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <div className="table-responsive">
                <Table striped bordered hover className="align-middle">
                  <thead className="table-dark">
                    <tr>
                      <th>Date</th>
                      <th>Employeur</th>
                      <th>Section</th>
                      <th>Projet</th>
                      <th>Statut</th>
                      <th>Motif</th>
                      <th>Heures</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPointages.length > 0 ? (
                      filteredPointages.map((pointage) => {
                        const statutDetails = getStatutDetails(pointage.statut);
                        const motifDetails = getMotifDetails(pointage.motif_abesent);
                        const employeur = state.employeurs.find(e => String(e.id) === String(pointage.employeur_id));
                        
                        return (
                          <tr key={pointage.id}>
                            <td className="fw-semibold">
                              {formatDateDisplay(pointage.date)}
                            </td>
                            <td>
                              {getEmployeurNom(pointage.employeur_id, true)}
                            </td>
                            <td>
                              {employeur?.section || 'N/A'}
                            </td>
                            <td>
                              {getProjetNom(pointage.projet_id)}
                            </td>
                            <td>
                              <Badge bg={statutDetails.color}>
                                {statutDetails.nom}
                              </Badge>
                            </td>
                            <td>
                              {pointage.statut === 'absent' ? (
                                <Badge bg={motifDetails.color}>
                                  {motifDetails.nom}
                                </Badge>
                              ) : '-'}
                            </td>
                            <td>
                              {pointage.heures_travail ? (
                                <Badge bg="info">
                                  {parseFloat(pointage.heures_travail).toFixed(1)}h
                                </Badge>
                              ) : '-'}
                            </td>
                            <td className="text-center">
                              {canEdit ? (
                                <div className="d-flex gap-1 justify-content-center">
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => handleShowModal(pointage)}
                                    title="Modifier"
                                  >
                                    <FaEdit />
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleShowDeleteModal(pointage)}
                                    title="Supprimer"
                                  >
                                    <FaTrash />
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-muted" title="Lecture seule">
                                  <FaLock size={14} />
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center py-5">
                          <Alert variant="info" className="mb-0">
                            {state.pointages.length === 0 ? (
                              <>
                                <h5>📭 Aucun pointage enregistré</h5>
                                {canEdit && (
                                  <p>Cliquez sur "Nouveau Pointage" pour commencer.</p>
                                )}
                              </>
                            ) : (
                              <>
                                <h5>🔍 Aucun résultat</h5>
                                <p>Aucun pointage ne correspond aux filtres.</p>
                                <Button variant="outline-secondary" onClick={resetFilters}>
                                  Réinitialiser les filtres
                                </Button>
                              </>
                            )}
                          </Alert>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Tab>
          </Tabs>
        </Card.Body>
        
        <Card.Footer className="bg-light d-flex justify-content-between align-items-center">
          <div>
            <small className="text-muted">
              Dernière mise à jour: {new Date().toLocaleString('fr-FR')}
            </small>
          </div>
          <div className="d-flex gap-3">
            <small>
              <Badge bg="success" className="me-1">
                {state.pointages.filter(p => p.statut === 'present').length}
              </Badge> présents
            </small>
            <small>
              <Badge bg="danger" className="me-1">
                {state.pointages.filter(p => p.statut === 'absent').length}
              </Badge> absents
            </small>
            <small>
              <Badge bg="info" className="me-1">
                {state.employeurs.length}
              </Badge> employés
            </small>
          </div>
        </Card.Footer>
      </Card>

      <PointageModal
        show={state.showModal}
        onHide={handleCloseModal}
        onSave={handleSave}
        pointage={state.editingPointage}
        employeurs={state.employeurs}
        projets={state.projets}
        statutChoices={statutPointageChoices}
        motifChoices={motifAbsenceChoices}
        canEdit={canEdit}
      />

      <Modal show={state.showDeleteModal} onHide={handleCloseDeleteModal} centered>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>🗑️ Confirmer la suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Êtes-vous sûr de vouloir supprimer ce pointage ?</p>
          {state.pointageToDelete && (
            <div className="alert alert-danger">
              <h6 className="mb-1">
                {formatDateDisplay(state.pointageToDelete.date)} - 
                {getEmployeurNom(state.pointageToDelete.employeur_id, false)}
              </h6>
              <div className="small">
                <div>
                  <strong>Statut:</strong> {getStatutDetails(state.pointageToDelete.statut).nom}
                </div>
                {state.pointageToDelete.statut === 'absent' && (
                  <div>
                    <strong>Motif:</strong> {getMotifDetails(state.pointageToDelete.motif_abesent).nom}
                  </div>
                )}
                {state.pointageToDelete.heures_travail && (
                  <div>
                    <strong>Heures:</strong> {state.pointageToDelete.heures_travail}h
                  </div>
                )}
              </div>
            </div>
          )}
          <p className="text-danger mt-3">
            <strong>⚠️ Cette action est irréversible !</strong>
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteModal}>
            Annuler
          </Button>
          {canEdit && (
            <Button variant="danger" onClick={handleDelete}>
              <FaTrash className="me-1" />
              Supprimer définitivement
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      <EmployeurDetailsModal
        show={state.showEmployeurDetails}
        onHide={handleCloseEmployeurDetails}
        employeur={state.selectedEmployeur}
        pointages={state.pointages}
        motifAbsenceChoices={motifAbsenceChoices}
      />
    </Container>
  );
};

export default GestionPointage;