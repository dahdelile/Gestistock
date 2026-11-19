import React, { useState, useEffect } from 'react';
import {
  Container, Table, Button, ButtonGroup, Modal, Form, InputGroup, Card,
  Badge, Alert, Spinner, Row, Col, Pagination
} from 'react-bootstrap';
import {
  PencilFill, TrashFill, PersonPlusFill, Eye, EyeSlash, Search,
  Filter, ShieldLock, LockFill
} from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// 🔹 Configuration API
const API_URL = 'https://intranet-attm.com/api';

// ✅ Liste complète des rôles disponibles
const ROLES_LIST = [
  { value: 'user', label: '👤 Utilisateur', color: 'primary', description: 'Accès de base' },
  { value: 'admin', label: '👑 Administrateur', color: 'danger', description: 'Accès complet' },
  { value: 'super_admin', label: '👑👑 Super Admin', color: 'purple', description: 'Accès total' },
  { value: 'DRH', label: '👔 DRH', color: 'warning', description: 'Gestion RH' },
  { value: 'DCG', label: '👔 DCG', color: 'info', description: 'Gestion comptable' },
  { value: 'DT', label: '👔 DT', color: 'secondary', description: 'Direction technique' },
  { value: 'DAA', label: '👔 DAA', color: 'warning', description: 'Administratif' },
  { value: 'DM', label: '👔 DM', color: 'info', description: 'Direction maintenance' },
  { value: 'RCF', label: '📊 RCF', color: 'secondary', description: 'Finances' },
  { value: 'chef_Ent', label: '📊 Chef Ent.', color: 'secondary', description: 'Chef d\'entretien' },
  { value: 'chef_docDm', label: '📊 Chef DocDM', color: 'secondary', description: 'Chef documentation' },
  { value: 'Chef_Projet', label: '📋 Chef Projet', color: 'success', description: 'Gestion de projet' }
];

// ✅ Rôles autorisés à accéder à cette page
const ALLOWED_ROLES = ['admin', 'super_admin'];

const GestionUtilisateurs = () => {
  const navigate = useNavigate();
  
  // États principaux
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // États pour le modal
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // ✅ Formulaire avec MULTIPLES RÔLES
  const [formData, setFormData] = useState({
    name: '', 
    email: '', 
    password: '', 
    password_confirmation: '',
    roles: ['user'], // ✅ Tableau de rôles
    is_active: true
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Configuration axios
  const api = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    timeout: 30000
  });
  
  // Intercepteur pour ajouter le token
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('auth_token') || 
                    localStorage.getItem('access_token') ||
                    sessionStorage.getItem('auth_token');
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  // ✅ Récupérer les rôles d'un utilisateur (toujours sous forme de tableau)
  const getUserRoles = (user) => {
    if (user.roles && Array.isArray(user.roles)) return user.roles;
    if (user.role) return [user.role];
    if (user.roles && typeof user.roles === 'string') return [user.roles];
    return ['user'];
  };
  
  // ✅ Vérification des droits admin
  const checkAdminStatus = async () => {
    try {
      setCheckingAuth(true);
      
      const token = localStorage.getItem('auth_token') || 
                    localStorage.getItem('access_token') ||
                    sessionStorage.getItem('auth_token');
      
      if (!token) {
        setIsAdmin(false);
        setCheckingAuth(false);
        return;
      }
      
      const response = await api.get('/user');
      console.log('📦 Utilisateur connecté:', response.data);
      
      let userRoles = [];
      if (response.data.roles && Array.isArray(response.data.roles)) {
        userRoles = response.data.roles;
      } else if (response.data.role) {
        userRoles = [response.data.role];
      }
      
      console.log('👤 Rôles utilisateur:', userRoles);
      
      const hasAdminRole = userRoles.some(role => ALLOWED_ROLES.includes(role));
      setIsAdmin(hasAdminRole);
      
      if (hasAdminRole) {
        console.log('✅ Accès admin autorisé');
        fetchUsers();
      }
      
    } catch (err) {
      console.error('❌ Erreur vérification:', err);
      setIsAdmin(false);
      
      if (err.response?.status === 401) {
        localStorage.clear();
        sessionStorage.clear();
        navigate('/login');
      }
    } finally {
      setCheckingAuth(false);
    }
  };
  
  // Charger les utilisateurs
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/users');
      console.log('📦 Utilisateurs reçus:', response.data);
      
      let usersData = [];
      if (Array.isArray(response.data)) {
        usersData = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        usersData = response.data.data;
      } else if (response.data.users && Array.isArray(response.data.users)) {
        usersData = response.data.users;
      }
      
      // ✅ S'assurer que chaque utilisateur a un tableau de rôles
      usersData = usersData.map(user => ({
        ...user,
        roles: getUserRoles(user)
      }));
      
      setUsers(usersData);
    } catch (err) {
      console.error('❌ Erreur chargement users:', err);
      setError('Erreur lors du chargement des utilisateurs');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };
  
  // ✅ Initialisation
  useEffect(() => {
    checkAdminStatus();
  }, []);
  
  // ✅ Validation du formulaire
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name?.trim()) {
      errors.name = 'Le nom est requis';
    }
    if (!formData.email?.trim()) {
      errors.email = 'L\'email est requis';
    }
    if (!editMode && !formData.password) {
      errors.password = 'Le mot de passe est requis';
    }
    if (formData.password && formData.password.length < 6) {
      errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    if (formData.password !== formData.password_confirmation) {
      errors.password_confirmation = 'Les mots de passe ne correspondent pas';
    }
    if (!formData.roles || formData.roles.length === 0) {
      errors.roles = 'Au moins un rôle doit être sélectionné';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // ✅ Gérer l'ajout/suppression d'un rôle
  const handleRoleToggle = (roleValue) => {
    setFormData(prev => {
      const currentRoles = [...prev.roles];
      if (currentRoles.includes(roleValue)) {
        return { ...prev, roles: currentRoles.filter(r => r !== roleValue) };
      } else {
        return { ...prev, roles: [...currentRoles, roleValue] };
      }
    });
    if (validationErrors.roles) {
      setValidationErrors(prev => ({ ...prev, roles: '' }));
    }
  };
  
  // ✅ Vérifier si un rôle est sélectionné
  const isRoleSelected = (roleValue) => {
    return formData.roles.includes(roleValue);
  };
  
  // ✅ Soumettre le formulaire avec MULTIPLES RÔLES
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});
    
    if (!validateForm()) {
      return;
    }
    
    setFormSubmitting(true);
    
    try {
      // ✅ Envoyer le tableau des rôles
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        roles: formData.roles, // ✅ Tableau de rôles
        is_active: formData.is_active
      };
      
      if (formData.password) {
        userData.password = formData.password;
        userData.password_confirmation = formData.password_confirmation;
      }
      
      console.log('📤 Envoi des données:', userData);
      
      let response;
      if (editMode && editingUser) {
        response = await api.put(`/users/${editingUser.id}`, userData);
      } else {
        response = await api.post('/users', userData);
      }
      
      console.log('✅ Réponse:', response.data);
      
      setSuccess(editMode ? 'Utilisateur modifié avec succès' : 'Utilisateur créé avec succès');
      handleCloseModal();
      fetchUsers();
      setTimeout(() => setSuccess(null), 5000);
      
    } catch (err) {
      console.error('❌ Erreur:', err);
      
      if (err.response?.status === 422) {
        const errors = err.response.data?.errors || err.response.data?.messages || {};
        const formattedErrors = {};
        Object.keys(errors).forEach(key => {
          const messages = errors[key];
          if (Array.isArray(messages)) {
            formattedErrors[key] = messages.join(', ');
          } else if (typeof messages === 'string') {
            formattedErrors[key] = messages;
          } else if (messages && messages[0]) {
            formattedErrors[key] = messages[0];
          }
        });
        setValidationErrors(formattedErrors);
        setError('Veuillez corriger les erreurs du formulaire');
      } else if (err.response?.status === 409) {
        setError('Un utilisateur avec cet email existe déjà');
      } else {
        setError(err.response?.data?.message || 'Erreur lors de l\'opération');
      }
    } finally {
      setFormSubmitting(false);
    }
  };
  
  // Supprimer un utilisateur
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return;
    
    try {
      await api.delete(`/users/${userId}`);
      setSuccess('Utilisateur supprimé');
      fetchUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Erreur lors de la suppression');
    }
  };
  
  // Modifier un utilisateur
  const handleEditUser = (user) => {
    console.log('✏️ Édition:', user);
    setEditingUser(user);
    setEditMode(true);
    setValidationErrors({});
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      password_confirmation: '',
      roles: getUserRoles(user), // ✅ Tableau de rôles
      is_active: user.is_active !== undefined ? user.is_active : true
    });
    setShowModal(true);
  };
  
  // Ajouter un utilisateur
  const handleAddUser = () => {
    setEditMode(false);
    setEditingUser(null);
    setValidationErrors({});
    setFormData({
      name: '', 
      email: '', 
      password: '', 
      password_confirmation: '',
      roles: ['user'], // ✅ Rôle par défaut
      is_active: true
    });
    setShowModal(true);
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    setEditMode(false);
    setEditingUser(null);
    setError(null);
    setValidationErrors({});
  };
  
  // Filtrer et trier
  const filteredUsers = users
    .filter(user => {
      const matchSearch = !searchTerm || 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const userRoles = getUserRoles(user);
      const matchRole = filterRole === 'all' || userRoles.includes(filterRole);
      
      const matchStatus = filterStatus === 'all' || 
        (filterStatus === 'active' && user.is_active) ||
        (filterStatus === 'inactive' && !user.is_active);
      
      return matchSearch && matchRole && matchStatus;
    })
    .sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      if (sortField === 'is_active') {
        aVal = a.is_active ? 1 : 0;
        bVal = b.is_active ? 1 : 0;
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  
  // Pagination
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  
  // Format date
  const formatDate = (date) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('fr-FR');
    } catch {
      return date;
    }
  };
  
  // Reset filtres
  const resetFilters = () => {
    setSearchTerm('');
    setFilterRole('all');
    setFilterStatus('all');
    setSortField('name');
    setSortDirection('asc');
    setCurrentPage(1);
  };
  
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Obtenir la couleur d'un rôle
  const getRoleColor = (roleValue) => {
    const role = ROLES_LIST.find(r => r.value === roleValue);
    return role ? role.color : 'secondary';
  };
  
  const getRoleLabel = (roleValue) => {
    const role = ROLES_LIST.find(r => r.value === roleValue);
    return role ? role.label : roleValue;
  };
  
  // Page d'accès refusé
  if (checkingAuth) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Vérification des droits...</p>
      </Container>
    );
  }
  
  if (!isAdmin) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6}>
            <Card className="text-center shadow border-danger">
              <Card.Body className="py-5">
                <LockFill className="text-danger" size={80} />
                <h1 className="text-danger mt-3">Accès Refusé</h1>
                <p className="text-muted">Vous n'avez pas les droits d'ouvrir cette page</p>
                <Alert variant="danger">
                  <strong>Droits requis :</strong> admin seulement
                </Alert>
                <Button variant="primary" onClick={() => navigate('/home/accueil')}>
                  Retour
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }
  
  // Page principale
  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h1><ShieldLock className="me-2" /> Gestion des utilisateurs</h1>
          <p className="text-muted">Gestion avec support de multiples rôles par utilisateur</p>
        </Col>
        <Col className="text-end">
          <Button variant="primary" onClick={handleAddUser}>
            <PersonPlusFill className="me-2" /> Nouvel utilisateur
          </Button>
        </Col>
      </Row>
      
      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}
      
      {/* Filtres */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text><Search /></InputGroup.Text>
                <Form.Control
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                <option value="all">Tous les rôles</option>
                {ROLES_LIST.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">Tous</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Button variant="outline-secondary" onClick={resetFilters} className="w-100">
                <Filter className="me-2" /> Réinitialiser
              </Button>
            </Col>
          </Row>
          <Row className="mt-3">
            <Col>
              <Badge bg="info">Total: {users.length}</Badge>
              <Badge bg="success" className="ms-2">Actifs: {users.filter(u => u.is_active).length}</Badge>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {/* Tableau */}
      <Card>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
              <p className="mt-3">Chargement...</p>
            </div>
          ) : currentUsers.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <div style={{ fontSize: 64 }}>👤</div>
              <h4>Aucun utilisateur</h4>
              <Button variant="primary" onClick={handleAddUser} className="mt-3">
                Créer un utilisateur
              </Button>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>Nom</th>
                      <th>Email</th>
                      <th>Rôles</th>
                      <th>Statut</th>
                      <th>Créé le</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUsers.map(user => {
                      const userRoles = getUserRoles(user);
                      return (
                        <tr key={user.id}>
                          <td><strong>{user.name}</strong></td>
                          <td>{user.email}</td>
                          <td>
                            <div className="d-flex flex-wrap gap-1">
                              {userRoles.map(role => (
                                <Badge key={role} bg={getRoleColor(role)} className="me-1">
                                  {getRoleLabel(role)}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td>
                            <Badge bg={user.is_active ? 'success' : 'secondary'}>
                              {user.is_active ? 'Actif' : 'Inactif'}
                            </Badge>
                          </td>
                          <td>{formatDate(user.created_at)}</td>
                          <td className="text-center">
                            <Button variant="outline-primary" size="sm" onClick={() => handleEditUser(user)} className="me-2">
                              <PencilFill size={14} />
                            </Button>
                            <Button variant="outline-danger" size="sm" onClick={() => handleDeleteUser(user.id)}>
                              <TrashFill size={14} />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
              
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center p-3 border-top">
                  <div className="text-muted">
                    {indexOfFirst + 1} - {Math.min(indexOfLast, filteredUsers.length)} sur {filteredUsers.length}
                  </div>
                  <Pagination>
                    <Pagination.Prev onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} />
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      let page = i + 1;
                      if (totalPages > 5 && currentPage > 3) {
                        page = currentPage - 2 + i;
                        if (page > totalPages) return null;
                      }
                      return (
                        <Pagination.Item key={page} active={page === currentPage} onClick={() => setCurrentPage(page)}>
                          {page}
                        </Pagination.Item>
                      );
                    })}
                    <Pagination.Next onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} />
                  </Pagination>
                  <Form.Select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} style={{ width: 'auto' }}>
                    <option value={5}>5/page</option>
                    <option value={10}>10/page</option>
                    <option value={20}>20/page</option>
                    <option value={50}>50/page</option>
                  </Form.Select>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>
      
      {/* ✅ Modal avec sélection MULTIPLE des rôles */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            {editMode ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {/* Affichage des erreurs */}
            {Object.keys(validationErrors).length > 0 && (
              <Alert variant="danger">
                <strong>Veuillez corriger les erreurs :</strong>
                <ul className="mb-0 mt-2">
                  {Object.entries(validationErrors).map(([field, message]) => (
                    message && <li key={field}><strong>{field}:</strong> {message}</li>
                  ))}
                </ul>
              </Alert>
            )}
            
            <Form.Group className="mb-3">
              <Form.Label>Nom complet *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                isInvalid={!!validationErrors.name}
                required
              />
              <Form.Control.Feedback type="invalid">
                {validationErrors.name}
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Email *</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                isInvalid={!!validationErrors.email}
                required
                disabled={editMode}
              />
              <Form.Control.Feedback type="invalid">
                {validationErrors.email}
              </Form.Control.Feedback>
              {editMode && <Form.Text className="text-muted">L'email ne peut pas être modifié</Form.Text>}
            </Form.Group>
            
            {/* ✅ Sélection MULTIPLE des rôles avec checkboxes */}
            <Form.Group className="mb-3">
              <Form.Label>Rôles * <span className="text-muted">(Plusieurs choix possibles)</span></Form.Label>
              <div className={`border rounded p-3 ${validationErrors.roles ? 'border-danger' : ''}`} style={{ maxHeight: '250px', overflowY: 'auto' }}>
                {ROLES_LIST.map(role => (
                  <Form.Check
                    key={role.value}
                    type="checkbox"
                    id={`role-${role.value}`}
                    label={
                      <div className="d-flex align-items-center">
                        <Badge bg={role.color} className="me-2">{role.label}</Badge>
                        <span className="text-muted small">- {role.description}</span>
                      </div>
                    }
                    checked={isRoleSelected(role.value)}
                    onChange={() => handleRoleToggle(role.value)}
                    className="mb-2"
                  />
                ))}
              </div>
              {validationErrors.roles && (
                <Form.Text className="text-danger">{validationErrors.roles}</Form.Text>
              )}
              <Form.Text className="text-muted d-block">
                Sélectionnez un ou plusieurs rôles pour cet utilisateur
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Statut</Form.Label>
              <Form.Select
                name="is_active"
                value={formData.is_active ? 'true' : 'false'}
                onChange={(e) => setFormData({...formData, is_active: e.target.value === 'true'})}
              >
                <option value="true">✅ Actif</option>
                <option value="false">❌ Inactif</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>{editMode ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe *'}</Form.Label>
              <InputGroup>
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  isInvalid={!!validationErrors.password}
                  placeholder={editMode ? "Laisser vide pour ne pas changer" : "Minimum 6 caractères"}
                  required={!editMode}
                />
                <Button variant="outline-secondary" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeSlash /> : <Eye />}
                </Button>
                <Form.Control.Feedback type="invalid">
                  {validationErrors.password}
                </Form.Control.Feedback>
              </InputGroup>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Confirmation</Form.Label>
              <Form.Control
                type="password"
                name="password_confirmation"
                value={formData.password_confirmation}
                onChange={handleChange}
                isInvalid={!!validationErrors.password_confirmation}
                required={!editMode && !!formData.password}
              />
              <Form.Control.Feedback type="invalid">
                {validationErrors.password_confirmation}
              </Form.Control.Feedback>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>Annuler</Button>
            <Button variant="primary" type="submit" disabled={formSubmitting}>
              {formSubmitting ? (
                <>
                  <Spinner size="sm" animation="border" className="me-2" />
                  En cours...
                </>
              ) : (editMode ? 'Modifier' : 'Créer')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default GestionUtilisateurs;