import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Button, Form, Card, Spinner, Alert,
    Badge, Container, Row, Col, Modal,
    InputGroup
} from 'react-bootstrap';
import {
    FaSave, FaPlus, FaTrash, FaSyncAlt, FaInfoCircle,
    FaBullseye, FaCalendarDay, FaSearch, FaCalculator,
    FaCheck, FaTimes, FaEdit, FaChartLine, FaLock, FaCog,
    FaArrowLeft
} from 'react-icons/fa';
import { format, parseISO, getYear } from 'date-fns';

// Configuration API
const API_BASE_URL = "https://intranet-attm.com/api";

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

// Fonction utilitaire pour extraire les données de la réponse API
const extractData = (response) => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (response.data && Array.isArray(response.data)) return response.data;
    if (response.data && response.data.data && Array.isArray(response.data.data)) return response.data.data;
    return [];
};

const SaisiePerformances = () => {
    const navigate = useNavigate();
    const getCurrentDate = useCallback(() => format(new Date(), 'yyyy-MM-dd'), []);
    
    // ÉTATS PRINCIPAUX
    const [performances, setPerformances] = useState([]);
    const [allProjects, setAllProjects] = useState([]);
    const [trackedProjects, setTrackedProjects] = useState([]);
    const [loading, setLoading] = useState({
        main: true,
        submit: false,
        delete: false
    });
    const [notifications, setNotifications] = useState([]);
    
    // Gestion des rôles utilisateur
    const [userRole, setUserRole] = useState(null);
    const [userLoading, setUserLoading] = useState(true);
    
    // État pour la modal d'ajout de réalisation journalière
    const [showDailyModal, setShowDailyModal] = useState(false);
    const [dailyFormData, setDailyFormData] = useState({
        projet: '',
        mesure: '',
        realisation_journee: '',
        date_rapport: getCurrentDate()
    });
    
    // État pour la modal de gestion des objectifs
    const [showObjectifModal, setShowObjectifModal] = useState(false);
    const [objectifFormData, setObjectifFormData] = useState({
        id: null,
        projet: '',
        mesure: '',
        objectif_mensuel: 0,
        donnee_projet: 0,
        date_rapport: getCurrentDate()
    });
    
    // État pour la modal d'ajout de nouvelle mesure
    const [showAddMeasureModal, setShowAddMeasureModal] = useState(false);
    const [newMeasureName, setNewMeasureName] = useState('');
    
    // États pour les modales de suppression
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [performanceToDelete, setPerformanceToDelete] = useState(null);
    
    // États pour les filtres
    const [selectedDate, setSelectedDate] = useState(getCurrentDate());
    const [selectedProject, setSelectedProject] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    
    // Gestion des mesures personnalisées
    const [customMeasures, setCustomMeasures] = useState(() => {
        const saved = localStorage.getItem('customMeasures');
        return saved ? JSON.parse(saved) : [];
    });
    
    // Combinaison des mesures prédéfinies + personnalisées
    const allMeasures = useMemo(() => {
        const predefined = [
            "PST en ml",
            "Fondation en ml",
            "C.Base en ml",
            "Impregnation en ml",
            "Enrobe en ml",
        ];
        return [...predefined, ...customMeasures];
    }, [customMeasures]);
    
    // Valeurs calculées pour la modal objectif
    const [objectifCalculatedValues, setObjectifCalculatedValues] = useState({
        prevision_jour: 0,
        restant_projet: 0,
        pourcentage: 0,
        cumul_realise: 0
    });
    
    // Charger le rôle utilisateur
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
    
    // Charger les projets suivis depuis le localStorage
    useEffect(() => {
        const savedTrackedProjects = localStorage.getItem('trackedProjects');
        if (savedTrackedProjects) {
            try {
                const parsed = JSON.parse(savedTrackedProjects);
                if (Array.isArray(parsed)) {
                    setTrackedProjects(parsed);
                }
            } catch (e) {
                console.error('Erreur parsing trackedProjects:', e);
            }
        }
    }, []);
    
    // Filtrer les projets pour n'afficher que ceux suivis
    const filteredProjects = useMemo(() => {
        if (!Array.isArray(allProjects)) return [];
        return allProjects.filter(project =>
            project && trackedProjects.includes(project.id?.toString())
        );
    }, [allProjects, trackedProjects]);
    
    // Filtrer les performances selon l'année sélectionnée
    const filteredPerformances = useMemo(() => {
        let filtered = performances;
        
        if (selectedYear) {
            filtered = filtered.filter(perf => {
                if (!perf.date_rapport) return false;
                return new Date(perf.date_rapport).getFullYear() === selectedYear;
            });
        }
        
        if (selectedDate) {
            filtered = filtered.filter(perf => perf.date_rapport === selectedDate);
        }
        
        if (selectedProject !== 'all') {
            filtered = filtered.filter(perf => {
                const perfProjetId = perf.projet_id || perf.projet;
                return perfProjetId?.toString() === selectedProject;
            });
        }
        
        if (searchTerm) {
            filtered = filtered.filter(perf => {
                const projetName = getProjectName(perf.projet_id || perf.projet) || '';
                const mesure = perf.mesure || '';
                return projetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       mesure.toLowerCase().includes(searchTerm.toLowerCase());
            });
        }
        
        return filtered.sort((a, b) => new Date(b.date_rapport) - new Date(a.date_rapport));
    }, [performances, selectedYear, selectedDate, selectedProject, searchTerm]);
    
    // Statistiques par année
    const yearStats = useMemo(() => {
        const stats = {};
        performances.forEach(perf => {
            if (perf.date_rapport) {
                const year = new Date(perf.date_rapport).getFullYear();
                stats[year] = (stats[year] || 0) + 1;
            }
        });
        return stats;
    }, [performances]);
    
    // Années disponibles
    const availableYears = useMemo(() => {
        const years = Object.keys(yearStats).map(Number).sort((a, b) => b - a);
        const currentYear = new Date().getFullYear();
        if (!years.includes(currentYear)) {
            years.unshift(currentYear);
        }
        return years;
    }, [yearStats]);
    
    // Chargement des données
    useEffect(() => {
        const initializeData = async () => {
            await Promise.all([fetchProjects(), fetchPerformances()]);
        };
        initializeData();
    }, []);
    
    // Calcul automatique pour la modal objectif
    useEffect(() => {
        calculateObjectifFields();
    }, [objectifFormData.objectif_mensuel, objectifFormData.donnee_projet, objectifFormData.date_rapport, objectifFormData.projet, objectifFormData.mesure]);
    
    // Sauvegarde des mesures personnalisées
    useEffect(() => {
        localStorage.setItem('customMeasures', JSON.stringify(customMeasures));
    }, [customMeasures]);
    
    // Fonction utilitaire : Vérifier si l'utilisateur peut modifier (Admin ou Chef Projet)
    const canModify = () => userRole === 'admin' || userRole === 'chef_projet';
    
    // Gestion des notifications
    const addNotification = useCallback((message, variant = 'success') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, variant }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    }, []);
    
    // Gestion des erreurs
    const handleError = useCallback((error, context) => {
        console.error(`Erreur dans ${context}:`, error);
        
        let errorMsg = "Une erreur est survenue";
        
        if (error.response) {
            if (error.response.status === 404) {
                errorMsg = "Service non trouvé. Vérifiez que l'API est accessible.";
            } else if (error.response.status === 403) {
                errorMsg = "Accès refusé. Vous n'avez pas les permissions nécessaires.";
            } else if (error.response.status === 422) {
                const errors = error.response.data?.errors || error.response.data?.messages;
                if (errors) {
                    const errorList = Object.values(errors).flat().join(', ');
                    errorMsg = `Validation échouée: ${errorList}`;
                } else {
                    errorMsg = error.response.data?.message || "Erreur de validation";
                }
            } else {
                errorMsg = error.response.data?.message ||
                    error.response.data?.error ||
                    `Erreur ${error.response.status}`;
            }
        } else if (error.request) {
            errorMsg = "Pas de réponse du serveur. Vérifiez votre connexion.";
        } else {
            errorMsg = error.message;
        }
        
        addNotification(`${context}: ${errorMsg}`, 'danger');
    }, [addNotification]);
    
    // Chargement des projets
    const fetchProjects = useCallback(async () => {
        try {
            const response = await api.get('/projets');
            const projects = extractData(response);
            setAllProjects(projects);
        } catch (error) {
            console.error('Erreur fetchProjects:', error);
            handleError(error, "Chargement des projets");
            setAllProjects([]);
        }
    }, [handleError]);
    
    // Chargement des performances
    const fetchPerformances = useCallback(async () => {
        try {
            setLoading(prev => ({ ...prev, main: true }));
            const response = await api.get('/performances');
            const performancesData = extractData(response);
            setPerformances(performancesData);
            setLoading(prev => ({ ...prev, main: false }));
        } catch (error) {
            console.error('Erreur fetchPerformances:', error);
            handleError(error, "Chargement des performances");
            setPerformances([]);
            setLoading(prev => ({ ...prev, main: false }));
        }
    }, [handleError]);
    
    // Ajouter une nouvelle mesure
    const handleAddMeasure = () => {
        if (!newMeasureName.trim()) {
            addNotification("Veuillez entrer un nom de mesure", 'warning');
            return;
        }
        
        if (allMeasures.includes(newMeasureName.trim())) {
            addNotification("Cette mesure existe déjà", 'warning');
            return;
        }
        
        setCustomMeasures(prev => [...prev, newMeasureName.trim()]);
        setNewMeasureName('');
        setShowAddMeasureModal(false);
        addNotification(`Mesure "${newMeasureName.trim()}" ajoutée avec succès`, 'success');
    };
    
    // Supprimer une mesure personnalisée
    const handleDeleteMeasure = (measureToDelete) => {
        setCustomMeasures(prev => prev.filter(m => m !== measureToDelete));
        addNotification(`Mesure "${measureToDelete}" supprimée`, 'info');
    };
    
    // Calcul de la prévision par jour
    const calculatePrevisionJour = useCallback((objectifMensuel, dateRapport) => {
        if (!objectifMensuel || objectifMensuel <= 0) return 0;
        if (!dateRapport) return 0;
        
        const date = new Date(dateRapport);
        const jourActuel = date.getDate();
        const annee = date.getFullYear();
        const mois = date.getMonth();
        const nombreJoursDansMois = new Date(annee, mois + 1, 0).getDate();
        
        return (parseFloat(objectifMensuel) * jourActuel) / nombreJoursDansMois;
    }, []);
    
    // Calcul du cumul annuel existant
    const calculateCumulAnnuel = useCallback((projetId, mesure, currentDate) => {
        const currentYear = new Date().getFullYear();
        return (Array.isArray(performances) ? performances : [])
            .filter(perf => {
                if (!perf) return false;
                const perfProjetId = perf.projet_id || perf.projet;
                const perfYear = perf.date_rapport ? getYear(parseISO(perf.date_rapport)) : null;
                return perfProjetId === projetId &&
                    perf.mesure === mesure &&
                    perfYear === currentYear &&
                    perf.date_rapport !== currentDate;
            })
            .reduce((sum, perf) => sum + (parseFloat(perf.realisation_journee) || 0), 0);
    }, [performances]);
    
    // Calcul automatique des champs pour la modal objectif
    const calculateObjectifFields = useCallback(() => {
        const objectifMensuel = parseFloat(objectifFormData.objectif_mensuel) || 0;
        const donneeProjet = parseFloat(objectifFormData.donnee_projet) || 0;
        
        let previsionJour = 0;
        if (objectifMensuel > 0 && objectifFormData.date_rapport) {
            previsionJour = calculatePrevisionJour(objectifMensuel, objectifFormData.date_rapport);
        }
        
        const existingPerf = performances.find(perf => {
            const perfProjetId = perf.projet_id || perf.projet;
            return perfProjetId === objectifFormData.projet &&
                perf.mesure === objectifFormData.mesure &&
                perf.date_rapport === objectifFormData.date_rapport;
        });
        
        const realisationJournee = existingPerf ? parseFloat(existingPerf.realisation_journee) || 0 : 0;
        
        let cumulAnnuel = realisationJournee;
        if (objectifFormData.projet && objectifFormData.mesure) {
            const cumulExistant = calculateCumulAnnuel(
                objectifFormData.projet, 
                objectifFormData.mesure, 
                objectifFormData.date_rapport
            );
            cumulAnnuel = cumulExistant + realisationJournee;
        }
        
        const restantProjet = donneeProjet > 0 ? Math.max(0, donneeProjet - cumulAnnuel) : 0;
        const pourcentage = donneeProjet > 0 ? (cumulAnnuel / donneeProjet) * 100 : 0;
        
        setObjectifCalculatedValues({
            prevision_jour: Math.round(previsionJour * 100) / 100,
            restant_projet: Math.round(restantProjet * 100) / 100,
            pourcentage: Math.round(pourcentage * 100) / 100,
            cumul_realise: Math.round(cumulAnnuel * 100) / 100
        });
    }, [objectifFormData, performances, calculatePrevisionJour, calculateCumulAnnuel]);
    
    // Gestion des changements
    const handleDailyChange = (e) => {
        const { name, value } = e.target;
        setDailyFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleDailyNumberChange = (e) => {
        const { name, value } = e.target;
        setDailyFormData(prev => ({ ...prev, [name]: value === '' ? '' : parseFloat(value) }));
    };
    
    const handleObjectifChange = (e) => {
        const { name, value } = e.target;
        setObjectifFormData(prev => ({ ...prev, [name]: name === "projet" ? parseInt(value, 10) || "" : value }));
    };
    
    const handleObjectifNumberChange = (e) => {
        const { name, value } = e.target;
        setObjectifFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    };
    
    // Réinitialiser les formulaires
    const resetDailyForm = () => {
        setDailyFormData({
            projet: '',
            mesure: '',
            realisation_journee: '',
            date_rapport: getCurrentDate()
        });
    };
    
    const resetObjectifForm = () => {
        setObjectifFormData({
            id: null,
            projet: '',
            mesure: '',
            objectif_mensuel: 0,
            donnee_projet: 0,
            date_rapport: getCurrentDate()
        });
        setObjectifCalculatedValues({
            prevision_jour: 0,
            restant_projet: 0,
            pourcentage: 0,
            cumul_realise: 0
        });
    };
    
    // Soumission de la réalisation journalière
    const handleDailySubmit = async () => {
        if (!canModify()) {
            addNotification("Seuls les administrateurs et chefs de projet peuvent ajouter des réalisations", 'warning');
            return;
        }
        
        if (!dailyFormData.projet) {
            addNotification("Veuillez sélectionner un projet", 'warning');
            return;
        }
        if (!dailyFormData.mesure) {
            addNotification("Veuillez sélectionner une mesure", 'warning');
            return;
        }
        if (!dailyFormData.realisation_journee || dailyFormData.realisation_journee <= 0) {
            addNotification("Veuillez entrer une réalisation valide", 'warning');
            return;
        }
        
        setLoading(prev => ({ ...prev, submit: true }));
        
        try {
            const realisationJournee = parseFloat(dailyFormData.realisation_journee);
            const projetId = parseInt(dailyFormData.projet);
            
            // Vérifier si une performance existe déjà
            const existingPerf = performances.find(perf => {
                const perfProjetId = perf.projet_id || perf.projet;
                return perfProjetId === projetId &&
                    perf.mesure === dailyFormData.mesure &&
                    perf.date_rapport === dailyFormData.date_rapport;
            });
            
            let payload;
            
            if (existingPerf) {
                // Mise à jour: ajouter la réalisation
                payload = {
                    realisation_journee: (parseFloat(existingPerf.realisation_journee) || 0) + realisationJournee
                };
                await api.patch(`/performances/${existingPerf.id}`, payload);
                addNotification("Réalisation ajoutée avec succès", 'success');
            } else {
                // Création d'une nouvelle performance
                payload = {
                    projet_id: projetId,
                    mesure: dailyFormData.mesure,
                    realisation_journee: realisationJournee,
                    date_rapport: dailyFormData.date_rapport,
                    objectif_mensuel: 0,
                    donnee_projet: 0
                };
                await api.post('/performances', payload);
                addNotification("Réalisation enregistrée avec succès", 'success');
            }
            
            await fetchPerformances();
            resetDailyForm();
            setShowDailyModal(false);
            
        } catch (error) {
            console.error("Erreur détaillée:", error);
            handleError(error, "Enregistrement");
        } finally {
            setLoading(prev => ({ ...prev, submit: false }));
        }
    };
    
    // Soumission de la gestion des objectifs
    const handleObjectifSubmit = async () => {
        if (!canModify()) {
            addNotification("Seuls les administrateurs et chefs de projet peuvent gérer les objectifs", 'warning');
            return;
        }
        
        if (!objectifFormData.projet) {
            addNotification("Veuillez sélectionner un projet", 'warning');
            return;
        }
        if (!objectifFormData.mesure) {
            addNotification("Veuillez sélectionner une mesure", 'warning');
            return;
        }
        
        setLoading(prev => ({ ...prev, submit: true }));
        
        try {
            const projetId = parseInt(objectifFormData.projet);
            const objectifMensuel = parseFloat(objectifFormData.objectif_mensuel) || 0;
            const donneeProjet = parseFloat(objectifFormData.donnee_projet) || 0;
            
            // Vérifier si une performance existe déjà
            const existingPerf = performances.find(perf => {
                const perfProjetId = perf.projet_id || perf.projet;
                return perfProjetId === projetId &&
                    perf.mesure === objectifFormData.mesure &&
                    perf.date_rapport === objectifFormData.date_rapport;
            });
            
            let response;
            
            if (existingPerf) {
                // Mettre à jour les objectifs
                response = await api.patch(`/performances/${existingPerf.id}`, {
                    objectif_mensuel: objectifMensuel,
                    donnee_projet: donneeProjet
                });
                addNotification("Objectifs mis à jour avec succès", 'success');
            } else {
                // Créer une nouvelle performance avec les objectifs
                response = await api.post('/performances', {
                    projet_id: projetId,
                    mesure: objectifFormData.mesure,
                    date_rapport: objectifFormData.date_rapport,
                    objectif_mensuel: objectifMensuel,
                    donnee_projet: donneeProjet,
                    realisation_journee: 0
                });
                addNotification("Objectifs enregistrés avec succès", 'success');
            }
            
            console.log("✅ Réponse:", response.data);
            
            await fetchPerformances();
            resetObjectifForm();
            setShowObjectifModal(false);
            
        } catch (error) {
            console.error("❌ Erreur détaillée:", error);
            
            if (error.response?.status === 422) {
                const errors = error.response.data?.errors || error.response.data?.messages;
                if (errors) {
                    const errorMessages = Object.values(errors).flat().join('\n');
                    addNotification(`Erreur validation:\n${errorMessages}`, 'danger');
                } else {
                    addNotification(`Erreur validation: ${error.response.data?.message || 'Données invalides'}`, 'danger');
                }
            } else {
                handleError(error, "Enregistrement des objectifs");
            }
        } finally {
            setLoading(prev => ({ ...prev, submit: false }));
        }
    };
    
    // Éditer les objectifs
    const handleEditObjectifs = (performance) => {
        if (!canModify()) {
            addNotification("Seuls les administrateurs et chefs de projet peuvent modifier les objectifs", 'warning');
            return;
        }
        setObjectifFormData({
            id: performance.id,
            projet: performance.projet_id || performance.projet,
            mesure: performance.mesure,
            objectif_mensuel: performance.objectif_mensuel || 0,
            donnee_projet: performance.donnee_projet || 0,
            date_rapport: performance.date_rapport
        });
        setShowObjectifModal(true);
    };
    
    // Suppression
    const handleDeleteClick = (performance) => {
        if (!canModify()) {
            addNotification("Seuls les administrateurs et chefs de projet peuvent supprimer des performances", 'warning');
            return;
        }
        setPerformanceToDelete(performance);
        setShowDeleteModal(true);
    };
    
    const confirmDelete = async () => {
        if (!performanceToDelete?.id) return;
        
        setLoading(prev => ({ ...prev, delete: true }));
        
        try {
            await api.delete(`/performances/${performanceToDelete.id}`);
            await fetchPerformances();
            addNotification("Performance supprimée avec succès", 'success');
            setShowDeleteModal(false);
            setPerformanceToDelete(null);
        } catch (error) {
            handleError(error, "Suppression");
        } finally {
            setLoading(prev => ({ ...prev, delete: false }));
        }
    };
    
    // Obtenir le nom du projet
    const getProjectName = useCallback((projectId) => {
        if (!projectId) return 'Projet inconnu';
        const project = allProjects.find(p => 
            p && (p.id === projectId || p.id?.toString() === projectId?.toString())
        );
        return project ? (project.name || project.nom || `Projet ${projectId}`) : `Projet ${projectId}`;
    }, [allProjects]);
    
    // Obtenir le libellé du rôle
    const getRoleLabel = () => {
        if (userRole === 'admin') return 'Administrateur';
        if (userRole === 'chef_projet') return 'Chef Projet';
        return 'Utilisateur';
    };
    
    // Obtenir la classe CSS du badge de rôle
    const getRoleBadgeClass = () => {
        if (userRole === 'admin') return 'bg-danger';
        if (userRole === 'chef_projet') return 'bg-warning text-dark';
        return 'bg-secondary';
    };
    
    if (userLoading) {
        return (
            <Container className="mt-4 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Chargement...</span>
                </div>
                <p className="mt-3">Vérification des permissions...</p>
            </Container>
        );
    }
    
    return (
        <Container fluid className="py-4">
            {/* Notifications */}
            <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1000 }}>
                {notifications.map(({ id, message, variant }) => (
                    <Alert 
                        key={id} 
                        variant={variant} 
                        onClose={() => setNotifications(prev => prev.filter(n => n.id !== id))} 
                        dismissible
                        className="shadow mb-2"
                    >
                        {message}
                    </Alert>
                ))}
            </div>
            
            {/* En-tête avec bouton retour */}
            <div className="row mb-4">
                <div className="col-md-8">
                    <Button 
                        variant="info" 
                        className="mb-3"
                        onClick={() => navigate("/projet/aPerformance")}
                    >
                        <FaArrowLeft className="me-2" />
                        Retour à l'analyse des performances
                    </Button>
                    <h1 className="mb-4 fw-bold" style={{ color: "#333" }}>
                        Gestion des Performances
                    </h1>
                    <p className="text-muted">Gérez et consultez toutes vos performances par année</p>
                </div>
                <div className="col-md-4 text-end">
                    <span className={`badge fs-6 py-2 px-3 ${getRoleBadgeClass()}`}>
                        {getRoleLabel()}
                    </span>
                    {!canModify() && (
                        <div className="text-muted small mt-1">
                            <FaLock className="me-1" /> Mode consultation seule
                        </div>
                    )}
                </div>
            </div>
            
            {/* Boutons d'action */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    {canModify() ? (
                        <>
                            <Button className="btn btn-success" onClick={() => { resetDailyForm(); setShowDailyModal(true); }}>
                                <FaPlus className="me-2" />
                                Ajouter réalisation
                            </Button>
                            <Button className="btn btn-info ms-2" onClick={() => { resetObjectifForm(); setShowObjectifModal(true); }}>
                                <FaBullseye className="me-2" />
                                Gérer objectifs
                            </Button>
                            <Button className="btn btn-secondary ms-2" onClick={() => setShowAddMeasureModal(true)}>
                                <FaCog className="me-2" />
                                Gérer mesures
                            </Button>
                        </>
                    ) : (
                        <span className="text-muted small"></span>
                    )}
                    <Button
                        className={`btn btn-outline-primary ${canModify() ? 'ms-2' : ''}`}
                        onClick={fetchPerformances}
                        disabled={loading.main}
                    >
                        <FaSyncAlt className={loading.main ? "spin" : ""} />
                        <span className="ms-2">Actualiser</span>
                    </Button>
                </div>
                <div className="text-end">
                    <span className="badge bg-secondary">
                        {filteredPerformances.length} enregistrement(s)
                    </span>
                </div>
            </div>
            
            {/* Sélecteur d'année */}
            <div className="card mb-4 shadow-sm">
                <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">
                        <FaCalendarDay className="me-2" />
                        Sélectionner une année
                    </h5>
                </div>
                <div className="card-body">
                    <div className="d-flex flex-wrap gap-2">
                        {availableYears.map(year => (
                            <button
                                key={year}
                                className={`btn ${selectedYear === year ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => setSelectedYear(year)}
                            >
                                {year}
                                {yearStats[year] > 0 && (
                                    <Badge bg="light" text="dark" className="ms-2">
                                        {yearStats[year]}
                                    </Badge>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Filtres */}
            <div className="card mb-4 shadow-sm">
                <div className="card-header bg-info d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                        <i className="bi bi-funnel me-2"></i>
                        Filtres
                    </h5>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => {
                        setSelectedDate('');
                        setSelectedProject('all');
                        setSearchTerm('');
                    }}>
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
                                    placeholder="Rechercher par projet ou mesure..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="input-group">
                                <span className="input-group-text"><i className="bi bi-calendar"></i></span>
                                <input
                                    type="date"
                                    className="form-control"
                                    placeholder="Date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="input-group">
                                <span className="input-group-text"><i className="bi bi-building"></i></span>
                                <select className="form-select" value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
                                    <option value="all">Tous les projets</option>
                                    {filteredProjects.map(project => (
                                        <option key={project.id} value={project.id}>
                                            {project.name || project.nom}
                                        </option>
                                    ))}
                                </select>
                            </div>
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
                            Performances de l'année {selectedYear}
                        </h5>
                    </div>
                </div>
                <div className="card-body p-0">
                    {loading.main ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}} role="status">
                                <span className="visually-hidden">Chargement...</span>
                            </div>
                            <p className="mt-3">Chargement des performances...</p>
                        </div>
                    ) : filteredPerformances.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="bi bi-file-earmark-text display-1 text-muted"></i>
                            <h5 className="mt-3">Aucune performance trouvée</h5>
                            <p className="text-muted">
                                {canModify() 
                                    ? "Utilisez les boutons ci-dessus pour ajouter des réalisations ou gérer les objectifs."
                                    : "Aucune performance disponible pour le moment."}
                            </p>
                            {canModify() && (
                                <div className="mt-3">
                                    <button className="btn btn-success me-2" onClick={() => { resetDailyForm(); setShowDailyModal(true); }}>
                                        <FaPlus className="me-2" />
                                        Ajouter réalisation
                                    </button>
                                    <button className="btn btn-info" onClick={() => { resetObjectifForm(); setShowObjectifModal(true); }}>
                                        <FaBullseye className="me-2" />
                                        Gérer objectifs
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-dark">
                                    <tr>
                                        <th>Date</th>
                                        <th>Projet</th>
                                        <th>Mesure</th>
                                        <th className="text-end">Réalisation</th>
                                        <th className="text-end">Objectif/Mois</th>
                                        <th className="text-end">Donnée Projet</th>
                                        <th className="text-end">Cumul</th>
                                        <th className="text-center">Progression</th>
                                        <th className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPerformances.map(perf => (
                                        <tr key={perf.id} className="align-middle">
                                            <td className="text-nowrap">
                                                {format(parseISO(perf.date_rapport), 'dd/MM/yyyy')}
                                            </td>
                                            <td>
                                                <Badge bg="primary" pill>
                                                    {getProjectName(perf.projet_id || perf.projet)}
                                                </Badge>
                                            </td>
                                            <td>{perf.mesure}</td>
                                            <td className="text-end fw-bold text-success">
                                                {parseFloat(perf.realisation_journee || 0).toLocaleString('fr-FR', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2
                                                })}
                                            </td>
                                            <td className="text-end">
                                                {parseFloat(perf.objectif_mensuel || 0).toLocaleString('fr-FR', {
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 0
                                                })}
                                            </td>
                                            <td className="text-end">
                                                {parseFloat(perf.donnee_projet || 0).toLocaleString('fr-FR', {
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 0
                                                })}
                                            </td>
                                            <td className="text-end text-info">
                                                {parseFloat(perf.cumul_realise || 0).toLocaleString('fr-FR', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2
                                                })}
                                            </td>
                                            <td className="text-center">
                                                <Badge
                                                    bg={
                                                        (perf.pourcentage_r_projet || 0) >= 80 ? 'success' :
                                                        (perf.pourcentage_r_projet || 0) >= 50 ? 'warning' : 'danger'
                                                    }
                                                    style={{ fontSize: '0.9rem' }}
                                                >
                                                    {Math.round(perf.pourcentage_r_projet || 0)}%
                                                </Badge>
                                            </td>
                                            <td className="text-center">
                                                {canModify() ? (
                                                    <div className="d-flex gap-1 justify-content-center">
                                                        <button
                                                            className="btn btn-sm btn-outline-info"
                                                            title="Gérer les objectifs"
                                                            onClick={() => handleEditObjectifs(perf)}
                                                        >
                                                            <FaBullseye size={14} />
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-outline-danger"
                                                            title="Supprimer"
                                                            onClick={() => handleDeleteClick(perf)}
                                                        >
                                                            <FaTrash size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted small" title="Consultation seule">
                                                        <FaLock size={14} />
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            
            {/* MODAL 1: Ajout de réalisation journalière */}
            <Modal show={showDailyModal} onHide={() => setShowDailyModal(false)} size="lg" centered>
                <Modal.Header closeButton className="bg-success text-white">
                    <Modal.Title>
                        <FaPlus className="me-2" />
                        Ajouter une réalisation journalière
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Projet *</Form.Label>
                        <Form.Select
                            value={dailyFormData.projet}
                            onChange={(e) => setDailyFormData(prev => ({ ...prev, projet: e.target.value }))}
                            required
                        >
                            <option value="">Sélectionner un projet</option>
                            {filteredProjects.map(project => (
                                <option key={project.id} value={project.id}>
                                    {project.name || project.nom}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                        <Form.Label>Mesure *</Form.Label>
                        <Form.Select
                            value={dailyFormData.mesure}
                            onChange={(e) => setDailyFormData(prev => ({ ...prev, mesure: e.target.value }))}
                            required
                        >
                            <option value="">Sélectionner une mesure</option>
                            {allMeasures.map(measure => (
                                <option key={measure} value={measure}>{measure}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                    
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Réalisation du jour *</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={dailyFormData.realisation_journee}
                                    onChange={(e) => setDailyFormData(prev => ({ ...prev, realisation_journee: e.target.value }))}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Date *</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={dailyFormData.date_rapport}
                                    onChange={(e) => setDailyFormData(prev => ({ ...prev, date_rapport: e.target.value }))}
                                    required
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    
                    <Alert variant="info">
                        <FaInfoCircle className="me-2" />
                        <small>
                            Cette réalisation sera ajoutée au cumul du projet.
                        </small>
                    </Alert>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDailyModal(false)}>
                        Annuler
                    </Button>
                    <Button variant="success" onClick={handleDailySubmit} disabled={loading.submit}>
                        {loading.submit ? <Spinner size="sm" /> : <FaSave className="me-1" />} Enregistrer
                    </Button>
                </Modal.Footer>
            </Modal>
            
            {/* MODAL 2: Gestion des objectifs */}
            <Modal show={showObjectifModal} onHide={() => setShowObjectifModal(false)} size="lg" centered>
                <Modal.Header closeButton className="bg-info text-white">
                    <Modal.Title>
                        <FaBullseye className="me-2" />
                        Gestion des objectifs
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Projet *</Form.Label>
                                <Form.Select
                                    value={objectifFormData.projet}
                                    onChange={(e) => setObjectifFormData(prev => ({ ...prev, projet: e.target.value }))}
                                    required
                                >
                                    <option value="">Sélectionner un projet</option>
                                    {filteredProjects.map(project => (
                                        <option key={project.id} value={project.id}>
                                            {project.name || project.nom}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Mesure *</Form.Label>
                                <Form.Select
                                    value={objectifFormData.mesure}
                                    onChange={(e) => setObjectifFormData(prev => ({ ...prev, mesure: e.target.value }))}
                                    required
                                >
                                    <option value="">Sélectionner une mesure</option>
                                    {allMeasures.map(measure => (
                                        <option key={measure} value={measure}>{measure}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Objectif Mensuel</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={objectifFormData.objectif_mensuel}
                                    onChange={(e) => setObjectifFormData(prev => ({ ...prev, objectif_mensuel: e.target.value }))}
                                />
                                <small className="text-muted">Objectif à atteindre pour le mois</small>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Donnée Totale Projet</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={objectifFormData.donnee_projet}
                                    onChange={(e) => setObjectifFormData(prev => ({ ...prev, donnee_projet: e.target.value }))}
                                />
                                <small className="text-muted">Quantité totale à réaliser</small>
                            </Form.Group>
                        </Col>
                    </Row>
                    
                    <Form.Group className="mb-3">
                        <Form.Label>Date de référence</Form.Label>
                        <Form.Control
                            type="date"
                            value={objectifFormData.date_rapport}
                            onChange={(e) => setObjectifFormData(prev => ({ ...prev, date_rapport: e.target.value }))}
                        />
                    </Form.Group>
                    
                    <Alert variant="info">
                        <FaInfoCircle className="me-2" />
                        <small>
                            Les objectifs seront associés à cette date. Si une réalisation existe déjà, les calculs seront mis à jour.
                        </small>
                    </Alert>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowObjectifModal(false)}>
                        Annuler
                    </Button>
                    <Button variant="primary" onClick={handleObjectifSubmit} disabled={loading.submit}>
                        {loading.submit ? <Spinner size="sm" /> : <FaSave className="me-1" />} Enregistrer
                    </Button>
                </Modal.Footer>
            </Modal>
            
            {/* MODAL 3: Gestion des mesures */}
            <Modal show={showAddMeasureModal} onHide={() => setShowAddMeasureModal(false)} size="lg">
                <Modal.Header closeButton className="bg-secondary text-white">
                    <Modal.Title>
                        <FaCog className="me-2" />
                        Gestion des mesures
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="mb-4">
                        <h6>Ajouter une nouvelle mesure</h6>
                        <div className="d-flex gap-2">
                            <Form.Control
                                type="text"
                                placeholder="Nom de la mesure (ex: Bitume en kg)"
                                value={newMeasureName}
                                onChange={(e) => setNewMeasureName(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddMeasure()}
                            />
                            <Button variant="success" onClick={handleAddMeasure}>
                                <FaPlus className="me-1" /> Ajouter
                            </Button>
                        </div>
                    </div>
                    
                    <hr />
                    
                    <h6>Mesures prédéfinies</h6>
                    <div className="mb-3">
                        {["PST en ml", "Fondation en ml", "C.Base en ml", "Impregnation en ml", "Enrobe en ml"].map(measure => (
                            <Badge key={measure} bg="primary" className="me-2 mb-2">{measure}</Badge>
                        ))}
                    </div>
                    
                    {customMeasures.length > 0 && (
                        <>
                            <h6>Mesures personnalisées</h6>
                            <div>
                                {customMeasures.map(measure => (
                                    <Badge key={measure} bg="success" className="me-2 mb-2" style={{ cursor: 'pointer' }} onClick={() => handleDeleteMeasure(measure)}>
                                        {measure} <FaTimes size={10} className="ms-1" />
                                    </Badge>
                                ))}
                            </div>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddMeasureModal(false)}>
                        Fermer
                    </Button>
                </Modal.Footer>
            </Modal>
            
            {/* MODAL SUPPRESSION */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton className="bg-danger text-white">
                    <Modal.Title>
                        <FaTrash className="me-2" />
                        Confirmer la suppression
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="warning">
                        <strong>Attention !</strong> Cette action est irréversible.
                    </Alert>
                    <p>Êtes-vous sûr de vouloir supprimer cette performance ?</p>
                    <div className="card bg-light">
                        <div className="card-body">
                            <strong>Projet:</strong> {getProjectName(performanceToDelete?.projet_id || performanceToDelete?.projet)}<br />
                            <strong>Mesure:</strong> {performanceToDelete?.mesure}<br />
                            <strong>Date:</strong> {performanceToDelete?.date_rapport}<br />
                            <strong>Réalisation:</strong> {parseFloat(performanceToDelete?.realisation_journee || 0).toLocaleString('fr-FR')}
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        Annuler
                    </Button>
                    <Button variant="danger" onClick={confirmDelete} disabled={loading.delete}>
                        {loading.delete ? <Spinner size="sm" /> : <FaTrash className="me-1" />} Supprimer
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default SaisiePerformances;