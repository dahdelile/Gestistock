import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Table, Button, Card, Spinner, Form, Modal, Toast, ToastContainer, Alert,
  InputGroup, Row, Col, Dropdown, Pagination, Badge, Tooltip, OverlayTrigger,
  Tabs, Tab, ListGroup
} from 'react-bootstrap';
import {
  FaCar, FaInfoCircle, FaSyncAlt, FaPlus, FaEdit, FaTrash,
  FaTimes, FaFileExport, FaPrint, FaChartLine, FaChartBar,
  FaFilter, FaCalendarAlt, FaClock, FaWrench,
  FaUser, FaComment, FaCheck, FaExclamationTriangle, FaSearch,
  FaBoxes, FaHistory, FaChartPie, FaPen, FaTools, FaList,
  FaArchive, FaUserTie, FaDownload, FaPrint as FaPrintIcon,
  FaFileExcel, FaFilePdf, FaEye, FaFileAlt,
  FaUserShield, FaLock, FaProjectDiagram
} from 'react-icons/fa';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement
} from 'chart.js';
import { format, parseISO, isValid, startOfDay, endOfDay, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useForm, useWatch } from 'react-hook-form';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement
);

const API_BASE_URL = 'https://intranet-attm.com/api';
const APP_VERSION = '2.0.0';

const API_ENDPOINTS = {
  arrets: `${API_BASE_URL}/arretages`,
  voitures: `${API_BASE_URL}/voitures`,
  codesPanne: `${API_BASE_URL}/pannes`,
  projets: `${API_BASE_URL}/projets`,
  chauffeurs: `${API_BASE_URL}/chauffeurs`
};
const AUTH_API_URL = 'https://intranet-attm.com/api';

const HEURE_DEBUT_JOURNEE = 8;
const HEURE_FIN_JOURNEE = 18;
const HEURES_PAR_JOUR = HEURE_FIN_JOURNEE - HEURE_DEBUT_JOURNEE;
const STATUTS = {
  EN_COURS: 'en_cours',
  TERMINE: 'termine',
  EN_ATTENTE: 'en_attente'
};

const calculerDureePanneAvecHoraires = (start, end) => {
  if (!start || !end) return 0;
  let totalHeures = 0;
  const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  if (startDate.getTime() === endDate.getTime()) {
    const startHeure = Math.max(start.getHours() + start.getMinutes() / 60, HEURE_DEBUT_JOURNEE);
    const endHeure = Math.min(end.getHours() + end.getMinutes() / 60, HEURE_FIN_JOURNEE);
    return Math.max(0, endHeure - startHeure);
  }
  const finPremierJour = new Date(start.getFullYear(), start.getMonth(), start.getDate(), HEURE_FIN_JOURNEE, 0);
  totalHeures += Math.max(0, (finPremierJour - start) / (1000 * 60 * 60));
  const debutDernierJour = new Date(end.getFullYear(), end.getMonth(), end.getDate(), HEURE_DEBUT_JOURNEE, 0);
  totalHeures += Math.max(0, (end - debutDernierJour) / (1000 * 60 * 60));
  const joursComplets = Math.max(0, Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) - 1);
  totalHeures += joursComplets * HEURES_PAR_JOUR;
  return Math.max(0, totalHeures);
};

const formatDuration = (hours) => {
  if (!hours || isNaN(hours) || hours < 0) return '0h';
  const totalHours = parseFloat(hours);
  if (totalHours < 1) {
    const minutes = Math.round(totalHours * 60);
    return `${minutes}min`;
  }
  const days = Math.floor(totalHours / HEURES_PAR_JOUR);
  const remainingHours = Math.floor(totalHours % HEURES_PAR_JOUR);
  const minutes = Math.round((totalHours % 1) * 60);
  if (days === 0) {
    return minutes > 0 ? `${remainingHours}h ${minutes}min` : `${remainingHours}h`;
  }
  if (remainingHours === 0 && minutes === 0) {
    return `${days}j`;
  }
  if (minutes === 0) {
    return `${days}j ${remainingHours}h`;
  }
  return `${days}j ${remainingHours}h ${minutes}min`;
};

const getBadgeVariant = (duree) => {
  if (!duree || duree <= 0) return 'secondary';
  if (duree < 2) return 'success';
  if (duree < 5) return 'warning';
  if (duree < 10) return 'danger';
  return 'dark';
};

// ==================== COMPOSANT RAPPORT JOURNALIER ====================
const RapportJournalier = ({ data, formatDateShort, getVoitureInfo, getCodePanneInfo, showToast }) => {
  const [showDetails, setShowDetails] = useState({});

  const getTypeVehicule = (matricule) => {
    if (matricule.startsWith('CH')) return 'Camion Benne';
    if (matricule.startsWith('B')) return 'Citerne';
    if (matricule.startsWith('TRH')) return 'Tracteur';
    return 'Autre';
  };

  const getChauffeurNom = (chauffeurId) => {
    if (!chauffeurId) return '-';
    const chauffeur = data.chauffeurs.find(c => c.id === chauffeurId);
    return chauffeur ? chauffeur.nom : '-';
  };

  const getBadgeVariantForCause = (cause) => {
    if (!cause) return 'secondary';
    if (cause.toLowerCase().includes('panne')) return 'danger';
    if (cause.toLowerCase().includes('sans activité')) return 'warning';
    return 'info';
  };

  const toggleDetails = (position) => {
    setShowDetails(prev => ({
      ...prev,
      [position]: !prev[position]
    }));
  };

  const tousLesArrets = useMemo(() => {
    return data.arrets;
  }, [data.arrets]);

  const rapportComplet = useMemo(() => {
    const projetsMap = new Map();
    
    data.projets.forEach(projet => {
      projetsMap.set(projet.id, {
        id: projet.id,
        nom: projet.name,
        totalVoitures: 0,
        totalArrets: 0,
        details: []
      });
    });
    projetsMap.set('non_assigne', {
      id: 'non_assigne',
      nom: 'Non assigné',
      totalVoitures: 0,
      totalArrets: 0,
      details: []
    });
    
    data.voitures.forEach(voiture => {
      const projetId = voiture.projet_id || 'non_assigne';
      if (projetsMap.has(projetId)) {
        projetsMap.get(projetId).totalVoitures++;
      }
    });
    
    tousLesArrets.forEach(arret => {
      const projetId = arret.projet_id || 'non_assigne';
      if (projetsMap.has(projetId)) {
        const projet = projetsMap.get(projetId);
        const voitureMatricule = getVoitureInfo(arret.voiture_id);
        const typeVehicule = getTypeVehicule(voitureMatricule);
        const codePanne = getCodePanneInfo(arret.code_panne_id);
        const chauffeur = getChauffeurNom(arret.chauffeur_id);
        const detail = {
          matricule: voitureMatricule,
          type: typeVehicule,
          codePanne: codePanne,
          cause: arret.cause_panne || '',
          chauffeur: chauffeur,
          duree: arret.duree_panne,
          statut: arret.date_reparation ? 'Réparé' : 'En cours',
          date: arret.date_panne
        };
        projet.details.push(detail);
        projet.totalArrets++;
      }
    });
    
    return Array.from(projetsMap.values())
      .filter(projet => projet.totalVoitures > 0)
      .sort((a, b) => b.totalArrets - a.totalArrets);
  }, [data.projets, data.voitures, tousLesArrets, getVoitureInfo, getCodePanneInfo, getChauffeurNom, getTypeVehicule]);

  const totaux = useMemo(() => {
    let totalArrets = 0;
    let totalVoituresParc = 0;
    let totalDisponibles = 0;
    rapportComplet.forEach(projet => {
      totalArrets += projet.totalArrets;
      totalVoituresParc += projet.totalVoitures;
      totalDisponibles += projet.totalVoitures - projet.totalArrets;
    });
    return {
      totalArrets,
      totalVoituresParc,
      totalDisponibles
    };
  }, [rapportComplet]);

  const exportRapportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const headerStyle = {
        font: { bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF28A745' } },
        alignment: { horizontal: 'center' }
      };
      
      const worksheet = workbook.addWorksheet(`Rapport_Complet`);
      worksheet.mergeCells('A1:G1');
      const titleRow = worksheet.getRow(1);
      titleRow.getCell(1).value = `RAPPORT COMPLET DES ARRETS - Généré le ${format(new Date(), 'dd/MM/yyyy')}`;
      titleRow.getCell(1).font = { bold: true, size: 16 };
      titleRow.getCell(1).alignment = { horizontal: 'center' };
      worksheet.addRow([]);
      
      const recapHeader = worksheet.addRow(['Projet', 'Parc', 'Arrêts', 'Disponibles', '% Disponibilité']);
      recapHeader.eachCell(cell => cell.style = headerStyle);
      
      rapportComplet.forEach(projet => {
        const disponibles = projet.totalVoitures - projet.totalArrets;
        const disponibilite = projet.totalVoitures > 0 ?
          ((disponibles / projet.totalVoitures) * 100).toFixed(0) : 0;
        worksheet.addRow([
          projet.nom,
          projet.totalVoitures,
          projet.totalArrets,
          disponibles,
          `${disponibilite}%`
        ]);
      });
      
      worksheet.addRow([]);
      const totalRow = worksheet.addRow([
        'TOTAL GÉNÉRAL',
        totaux.totalVoituresParc,
        totaux.totalArrets,
        totaux.totalDisponibles,
        `${((totaux.totalDisponibles / totaux.totalVoituresParc) * 100).toFixed(0)}%`
      ]);
      totalRow.font = { bold: true };
      
      if (tousLesArrets.length > 0) {
        const detailsSheet = workbook.addWorksheet('Détails');
        const detailsHeader = detailsSheet.addRow([
          'Projet', 'Matricule', 'Type', 'Chauffeur', 'Code Panne',
          'Cause', 'Statut', 'Durée', 'Date'
        ]);
        detailsHeader.eachCell(cell => cell.style = headerStyle);
        
        rapportComplet.forEach(projet => {
          projet.details.forEach(detail => {
            detailsSheet.addRow([
              projet.nom,
              detail.matricule,
              detail.type,
              detail.chauffeur,
              detail.codePanne,
              detail.cause || '-',
              detail.statut,
              detail.duree ? `${detail.duree}h` : '-',
              formatDateShort(detail.date)
            ]);
          });
        });
        
        detailsSheet.columns.forEach(column => {
          column.width = 20;
        });
      }
      
      worksheet.columns.forEach(column => {
        column.width = 20;
      });
      
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Rapport_Complet_Arrets_${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
      showToast('Rapport exporté avec succès', 'success');
    } catch (error) {
      console.error('Erreur export:', error);
      showToast('Erreur lors de l\'export', 'danger');
    }
  };

  return (
    <div className="mt-3">
      <Card className="shadow-sm border-0 mb-4">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <FaFileAlt className="me-2" />
            Rapport Complet des Arrêts
          </h5>
          <Button variant="light" onClick={exportRapportToExcel}>
            <FaFileExcel className="me-2 text-success" />
            Exporter
          </Button>
        </Card.Header>
      </Card>
      
      <Row className="g-3 mb-4">
        <Col md={4}>
          <Card className="bg-primary text-white shadow stat-card">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">Parc Total</h6>
                  <h2 className="mb-0">{totaux.totalVoituresParc}</h2>
                  <small>Véhicules</small>
                </div>
                <FaCar size={32} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="bg-success text-white shadow stat-card">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">Disponibles</h6>
                  <h2 className="mb-0">{totaux.totalDisponibles}</h2>
                  <small>Véhicules en état de marche</small>
                </div>
                <FaCheck size={32} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="bg-warning text-white shadow stat-card">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">Taux de disponibilité</h6>
                  <h2 className="mb-0">{((totaux.totalDisponibles / totaux.totalVoituresParc) * 100).toFixed(1)}%</h2>
                  <small>du parc total</small>
                </div>
                <FaChartLine size={32} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Card className="shadow-sm border-0 mb-4">
        <Card.Header className="bg-light d-flex justify-content-between align-items-center">
          <h6 className="mb-0">
            <FaList className="me-2" />
            Liste de tous les projets
          </h6>
          <Badge bg="primary">{rapportComplet.length} projets</Badge>
        </Card.Header>
        <div className="table-responsive">
          <Table striped hover className="align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th>Projet</th>
                <th>Parc</th>
                <th>Arrêts</th>
                <th>Disponibles</th>
                <th>% Disponibilité</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rapportComplet.map((projet) => {
                const disponibles = projet.totalVoitures - projet.totalArrets;
                const disponibilite = projet.totalVoitures > 0 ?
                  ((disponibles / projet.totalVoitures) * 100).toFixed(0) : 0;
                const tauxCouleur =
                  disponibilite >= 80 ? 'success' :
                  disponibilite >= 50 ? 'warning' :
                  disponibilite >= 30 ? 'danger' : 'dark';
                return (
                  <React.Fragment key={projet.id}>
                    <tr className={projet.totalArrets === 0 ? 'table-success' : ''}>
                      <td>
                        <strong>{projet.nom}</strong>
                        {projet.totalArrets === 0 && (
                          <Badge bg="success" className="ms-2">Aucun arrêt</Badge>
                        )}
                      </td>
                      <td>
                        <Badge bg="primary" pill>{projet.totalVoitures}</Badge>
                      </td>
                      <td>
                        <Badge bg={projet.totalArrets > 0 ? 'danger' : 'light'}
                          text={projet.totalArrets > 0 ? 'white' : 'dark'} pill>
                          {projet.totalArrets}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg="success" pill>
                          {disponibles}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={tauxCouleur} pill>
                          {disponibilite}%
                        </Badge>
                      </td>
                      <td>
                        {projet.details.length > 0 && (
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => toggleDetails(projet.nom)}
                          >
                            {showDetails[projet.nom] ? 'Masquer' : 'Voir détails'}
                          </Button>
                        )}
                      </td>
                    </tr>
                    {showDetails[projet.nom] && projet.details.length > 0 && (
                      <tr>
                        <td colSpan="6" className="p-0">
                          <div className="p-3 bg-light">
                            <h6 className="mb-2">Détails des arrêts - {projet.nom}</h6>
                            <Table size="sm" bordered className="mb-0">
                              <thead>
                                <tr>
                                  <th>Date</th>
                                  <th>Matricule</th>
                                  <th>Type</th>
                                  <th>Chauffeur</th>
                                  <th>Code Panne</th>
                                  <th>Cause</th>
                                  <th>Statut</th>
                                </tr>
                              </thead>
                              <tbody>
                                {projet.details.map((detail, idx) => (
                                  <tr key={idx}>
                                    <td>{formatDateShort(detail.date)}</td>
                                    <td><strong>{detail.matricule}</strong></td>
                                    <td>{detail.type}</td>
                                    <td>{detail.chauffeur}</td>
                                    <td><Badge bg="secondary">{detail.codePanne}</Badge></td>
                                    <td>
                                      <Badge bg={getBadgeVariantForCause(detail.cause)}>
                                        {detail.cause || '-'}
                                      </Badge>
                                    </td>
                                    <td>
                                      <Badge bg={detail.statut === 'Réparé' ? 'success' : 'warning'}>
                                        {detail.statut}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              <tr className="table-primary fw-bold">
                <td>TOTAL GÉNÉRAL</td>
                <td>{totaux.totalVoituresParc}</td>
                <td>{totaux.totalArrets}</td>
                <td>{totaux.totalDisponibles}</td>
                <td>{((totaux.totalDisponibles / totaux.totalVoituresParc) * 100).toFixed(0)}%</td>
                <td></td>
              </tr>
            </tbody>
          </Table>
        </div>
      </Card>
      
      <Row className="g-3">
        <Col md={6}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-light">
              <h6 className="mb-0">Top 5 des projets avec le plus d'arrêts</h6>
            </Card.Header>
            <Card.Body>
              {rapportComplet
                .filter(p => p.totalArrets > 0)
                .sort((a, b) => b.totalArrets - a.totalArrets)
                .slice(0, 5)
                .map((projet, index) => (
                  <div key={projet.id} className="d-flex align-items-center mb-2">
                    <Badge bg={index === 0 ? 'danger' : index === 1 ? 'warning' : 'info'}
                      className="me-2" style={{ width: '30px' }}>
                      #{index + 1}
                    </Badge>
                    <span className="flex-grow-1">{projet.nom}</span>
                    <Badge bg="secondary">{projet.totalArrets} arrêts</Badge>
                  </div>
                ))}
              {rapportComplet.filter(p => p.totalArrets > 0).length === 0 && (
                <p className="text-muted text-center mb-0">Aucun arrêt enregistré</p>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-light">
              <h6 className="mb-0">Répartition par statut</h6>
            </Card.Header>
            <Card.Body>
              {(() => {
                const repares = tousLesArrets.filter(a => a.date_reparation).length;
                const enCours = tousLesArrets.filter(a => !a.date_reparation).length;
                return (
                  <>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Réparés :</span>
                      <Badge bg="success">{repares}</Badge>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>En cours :</span>
                      <Badge bg="warning">{enCours}</Badge>
                    </div>
                    <div className="progress mt-2" style={{ height: '20px' }}>
                      <div
                        className="progress-bar bg-success"
                        style={{ width: `${(repares / (repares + enCours || 1)) * 100}%` }}
                      >
                        {repares > 0 ? `${((repares / (repares + enCours)) * 100).toFixed(0)}%` : ''}
                      </div>
                      <div
                        className="progress-bar bg-warning"
                        style={{ width: `${(enCours / (repares + enCours || 1)) * 100}%` }}
                      >
                        {enCours > 0 ? `${((enCours / (repares + enCours)) * 100).toFixed(0)}%` : ''}
                      </div>
                    </div>
                  </>
                );
              })()}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// ==================== COMPOSANT PRINCIPAL ====================
const ArretEquipement = () => {
  const [userRole, setUserRole] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState({
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canView: true
  });

  const isAdmin = () => userRole === 'admin' || userRole === 'administrateur';
  const isDM = () => userRole === 'dm' || userRole === 'direction_mecanique';
  const canModify = () => isAdmin() || isDM();

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        setUserLoading(true);
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

  useEffect(() => {
    const editPermission = canModify();
    setUserPermissions({
      canCreate: editPermission,
      canEdit: editPermission,
      canDelete: editPermission,
      canView: true
    });
  }, [userRole]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('liste');
  const [showReparerModal, setShowReparerModal] = useState(false);
  const [voitureAReparer, setVoitureAReparer] = useState(null);
  const [dateReparationInput, setDateReparationInput] = useState(new Date().toISOString().slice(0, 16));
  const [intervenantReparation, setIntervenantReparation] = useState('');
  const [travauxReparation, setTravauxReparation] = useState('');
  const [commentaireReparation, setCommentaireReparation] = useState('');
  const [piecesReparation, setPiecesReparation] = useState([]);
  const [nouvellePiece, setNouvellePiece] = useState({ nom: '', quantite: 1 });
  const [selectedChauffeur, setSelectedChauffeur] = useState(null);
  const [chauffeurInput, setChauffeurInput] = useState('');
  const [filteredChauffeurs, setFilteredChauffeurs] = useState([]);
  const [showChauffeurDropdown, setShowChauffeurDropdown] = useState(false);
  const [selectedReparation, setSelectedReparation] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [voitureInput, setVoitureInput] = useState('');
  const [filteredVoitures, setFilteredVoitures] = useState([]);
  const [showVoitureDropdown, setShowVoitureDropdown] = useState(false);
  const [selectedVoiture, setSelectedVoiture] = useState(null);
  const [currentArret, setCurrentArret] = useState(null);
  const [arretToDelete, setArretToDelete] = useState(null);
  
  const [showOnlyOld, setShowOnlyOld] = useState(false);
  
  const [showVoitureArretsModal, setShowVoitureArretsModal] = useState(false);
  const [selectedVoitureForArrets, setSelectedVoitureForArrets] = useState(null);
  const [voitureArretsList, setVoitureArretsList] = useState([]);

  const [data, setData] = useState({
    voitures: [],
    codesPanne: [],
    projets: [],
    arrets: [],
    chauffeurs: []
  });

  const [voitureStats, setVoitureStats] = useState({
    voiture: null,
    totalPannes: 0,
    totalDuree: 0,
    totalPieces: 0,
    piecesConsommees: [],
    arrets: [],
    topPannes: []
  });

  const [filters, setFilters] = useState({
    selectedVoiture: '',
    selectedCodePanne: '',
    selectedProjet: '',
    selectedChauffeur: '',
    selectedStatut: '',
    searchQuery: '',
    dateRange: { start: '', end: null },
    showFiltres: true
  });

  const [historyFilters, setHistoryFilters] = useState({
    selectedVoiture: '',
    selectedCodePanne: '',
    selectedProjet: '',
    selectedChauffeur: '',
    searchQuery: '',
    dateRange: { start: '', end: '' },
    showFiltres: true
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    itemsPerPageOptions: [5, 10, 25, 50, 100]
  });

  const [historyPagination, setHistoryPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    itemsPerPageOptions: [5, 10, 25, 50, 100]
  });

  const [modals, setModals] = useState({
    showAddModal: false,
    showEditModal: false,
    showDeleteModal: false,
    showVoitureStatsModal: false,
    showReparationDetailsModal: false
  });

  const [sortConfig, setSortConfig] = useState({ key: 'date_panne', direction: 'desc' });

  const { register, handleSubmit, formState: { errors }, reset, setValue, control } = useForm();
  const watchDates = useWatch({ control, name: ['date_panne', 'date_reparation'] });

  const searchInputRef = useRef(null);

  const getArretColorClass = useCallback((datePanne) => {
    if (!datePanne) return '';
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    
    const arretDate = new Date(datePanne);
    arretDate.setHours(0, 0, 0, 0);
    
    if (arretDate.getTime() === todayDate.getTime()) {
      return 'table-success';
    }
    if (arretDate.getTime() === yesterdayDate.getTime()) {
      return 'table-warning';
    }
    return '';
  }, []);

  const showToast = useCallback((message, variant = 'success') => {
    const newToast = { id: Date.now(), message, variant };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 5000);
  }, []);

  const formatDisplayDate = useCallback((dateString) => {
    if (!dateString) return 'Non spécifiée';
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, 'dd/MM/yyyy HH:mm', { locale: fr }) : dateString;
    } catch {
      return dateString;
    }
  }, []);

  const formatDateShort = useCallback((dateString) => {
    if (!dateString) return '-';
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, 'dd/MM/yy', { locale: fr }) : dateString;
    } catch {
      return dateString;
    }
  }, []);

  const getDataArray = useCallback((apiData, endpointName) => {
    if (Array.isArray(apiData)) return apiData;
    if (apiData && typeof apiData === 'object') {
      if (apiData.data && Array.isArray(apiData.data)) return apiData.data;
      if (apiData.success && Array.isArray(apiData.data)) return apiData.data;
      for (const key in apiData) {
        if (Array.isArray(apiData[key])) return apiData[key];
      }
      if (apiData.id) return [apiData];
    }
    console.warn(`Format de données inattendu pour ${endpointName}:`, apiData);
    return [];
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const headers = {
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept': 'application/json',
        'X-Application-Version': APP_VERSION
      };
      const [arretsRes, voituresRes, codesRes, projetsRes, chauffeursRes] = await Promise.all([
        fetch(API_ENDPOINTS.arrets, { headers }),
        fetch(API_ENDPOINTS.voitures, { headers }),
        fetch(API_ENDPOINTS.codesPanne, { headers }),
        fetch(API_ENDPOINTS.projets, { headers }),
        fetch(API_ENDPOINTS.chauffeurs, { headers })
      ]);
      let arretsData = [];
      let voituresData = [];
      let codesData = [];
      let projetsData = [];
      let chauffeursData = [];
      if (arretsRes.ok) {
        const data = await arretsRes.json();
        arretsData = getDataArray(data, 'arrets');
      }
      if (voituresRes.ok) {
        const data = await voituresRes.json();
        voituresData = getDataArray(data, 'voitures');
      }
      if (codesRes.ok) {
        const data = await codesRes.json();
        codesData = getDataArray(data, 'codesPanne');
      }
      if (projetsRes.ok) {
        const data = await projetsRes.json();
        projetsData = getDataArray(data, 'projets');
      }
      if (chauffeursRes.ok) {
        const data = await chauffeursRes.json();
        chauffeursData = getDataArray(data, 'chauffeurs');
      }
      const arretsWithPieces = arretsData.map(arret => {
        let piecesUtilisees = [];
        if (arret.pieces_utilisees) {
          try {
            piecesUtilisees = typeof arret.pieces_utilisees === 'string'
              ? JSON.parse(arret.pieces_utilisees)
              : arret.pieces_utilisees;
          } catch (e) {
            console.error('Erreur parsing JSON pour arrêt', arret.id, e);
          }
        }
        return {
          ...arret,
          pieces_utilisees: piecesUtilisees,
          dureeFormat: formatDuration(arret.duree_panne),
          statut: arret.date_reparation ? STATUTS.TERMINE : STATUTS.EN_COURS
        };
      });
      setData({
        arrets: arretsWithPieces,
        voitures: voituresData,
        codesPanne: codesData,
        projets: projetsData,
        chauffeurs: chauffeursData
      });
      showToast('Données chargées avec succès', 'success');
    } catch (err) {
      console.error('Erreur globale:', err);
      let errorMessage = "Erreur lors du chargement des données";
      if (err.response) {
        if (err.response.status === 404) errorMessage = "API non trouvée - Vérifiez les endpoints";
        else if (err.response.status === 500) errorMessage = "Erreur serveur - Contactez l'administrateur";
        else errorMessage = `Erreur ${err.response.status}`;
      } else if (err.request) {
        errorMessage = "Impossible de contacter le serveur";
      }
      setError(errorMessage);
      showToast(errorMessage, 'danger');
    } finally {
      setLoading(false);
    }
  }, [showToast, getDataArray]);

  const getVoitureInfo = useCallback((voitureId) => {
    if (!voitureId) return 'Non spécifiée';
    const voiture = data.voitures.find(v => v.id === voitureId);
    return voiture ? voiture.matricule : `ID: ${voitureId}`;
  }, [data.voitures]);

  const getChauffeurInfo = useCallback((chauffeurId) => {
    if (!chauffeurId) return null;
    const chauffeur = data.chauffeurs.find(c => c.id === chauffeurId);
    return chauffeur ? chauffeur : null;
  }, [data.chauffeurs]);

  const getCodePanneInfo = useCallback((codeId) => {
    if (!codeId && codeId !== 0) return 'Non spécifié';
    const normalizedId = Number(codeId);
    const code = data.codesPanne.find(c => Number(c.id) === normalizedId);
    return code ? (code.code || code.name || `Code ${codeId}`) : `ID: ${codeId}`;
  }, [data.codesPanne]);

  const getProjetInfo = useCallback((projetId) => {
    if (!projetId) return 'Non spécifié';
    const projet = data.projets.find(p => p.id === projetId);
    return projet ? projet.name : `ID: ${projetId}`;
  }, [data.projets]);

  const getArretDurationDays = useCallback((datePanne) => {
    const start = new Date(datePanne);
    const now = new Date();
    const diffTime = Math.abs(now - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, []);

  const getArretAgeBadge = useCallback((datePanne) => {
    const days = getArretDurationDays(datePanne);
    if (days === 0) return null;
    if (days === 1) return <Badge bg="warning" className="ms-2">+1 jour</Badge>;
    if (days <= 3) return <Badge bg="warning" className="ms-2">+{days} jours</Badge>;
    if (days <= 7) return <Badge bg="danger" className="ms-2">+{days} jours</Badge>;
    return <Badge bg="dark" className="ms-2">+{days} jours</Badge>;
  }, [getArretDurationDays]);

  const arretsEnCours = useMemo(() => {
    return data.arrets.filter(arret => !arret.date_reparation);
  }, [data.arrets]);

  const oldArretsCount = useMemo(() => {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    return arretsEnCours.filter(arret => {
      const arretDate = new Date(arret.date_panne);
      arretDate.setHours(0, 0, 0, 0);
      return arretDate < todayDate;
    }).length;
  }, [arretsEnCours]);

  const arretsRepares = useMemo(() => {
    return data.arrets.filter(arret => arret.date_reparation);
  }, [data.arrets]);

  const sortedArrets = useMemo(() => {
    const sortable = [...arretsEnCours];
    if (sortConfig.key) {
      sortable.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        if (sortConfig.key === 'date_panne' || sortConfig.key === 'date_reparation') {
          aValue = aValue ? new Date(aValue).getTime() : 0;
          bValue = bValue ? new Date(bValue).getTime() : 0;
        }
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortable;
  }, [arretsEnCours, sortConfig]);

  const filteredArrets = useMemo(() => {
    let filtered = sortedArrets;
    if (showOnlyOld) {
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(arret => {
        const arretDate = new Date(arret.date_panne);
        arretDate.setHours(0, 0, 0, 0);
        return arretDate < todayDate;
      });
    }
    return filtered.filter(arret => {
      const voitureMatch = filters.selectedVoiture ? arret.voiture_id === parseInt(filters.selectedVoiture) : true;
      const projetMatch = filters.selectedProjet ? arret.projet_id === parseInt(filters.selectedProjet) : true;
      const codePanneMatch = filters.selectedCodePanne ? arret.code_panne_id === parseInt(filters.selectedCodePanne) : true;
      const chauffeurMatch = filters.selectedChauffeur ? arret.chauffeur_id === parseInt(filters.selectedChauffeur) : true;
      const searchMatch = filters.searchQuery
        ? (arret.cause_panne?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
          arret.intervenant?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
          getVoitureInfo(arret.voiture_id).toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
          arret.travaux_effectues?.toLowerCase().includes(filters.searchQuery.toLowerCase()))
        : true;
      const dateMatch = filters.dateRange.start
        ? new Date(arret.date_panne) >= startOfDay(new Date(filters.dateRange.start))
        : true;
      const dateEndMatch = filters.dateRange.end
        ? new Date(arret.date_panne) <= endOfDay(new Date(filters.dateRange.end))
        : true;
      return voitureMatch && projetMatch && codePanneMatch && chauffeurMatch && searchMatch && dateMatch && dateEndMatch;
    });
  }, [sortedArrets, filters, getVoitureInfo, showOnlyOld]);

  const nombrePannesParVoiture = useMemo(() => {
    const counts = new Map();
    data.arrets.forEach(arret => {
      const voitureId = arret.voiture_id;
      counts.set(voitureId, (counts.get(voitureId) || 0) + 1);
    });
    return counts;
  }, [data.arrets]);

  const filteredReparationsArchivees = useMemo(() => {
    return data.arrets
      .filter(arret => arret.date_reparation)
      .filter(arret => {
        const voitureMatch = historyFilters.selectedVoiture ? arret.voiture_id === parseInt(historyFilters.selectedVoiture) : true;
        const projetMatch = historyFilters.selectedProjet ? arret.projet_id === parseInt(historyFilters.selectedProjet) : true;
        const codePanneMatch = historyFilters.selectedCodePanne ? arret.code_panne_id === parseInt(historyFilters.selectedCodePanne) : true;
        const chauffeurMatch = historyFilters.selectedChauffeur ? arret.chauffeur_id === parseInt(historyFilters.selectedChauffeur) : true;
        const searchMatch = historyFilters.searchQuery
          ? (arret.cause_panne?.toLowerCase().includes(historyFilters.searchQuery.toLowerCase()) ||
            arret.intervenant?.toLowerCase().includes(historyFilters.searchQuery.toLowerCase()) ||
            getVoitureInfo(arret.voiture_id).toLowerCase().includes(historyFilters.searchQuery.toLowerCase()) ||
            arret.travaux_effectues?.toLowerCase().includes(historyFilters.searchQuery.toLowerCase()))
          : true;
        const dateMatch = historyFilters.dateRange.start
          ? new Date(arret.date_reparation) >= startOfDay(new Date(historyFilters.dateRange.start))
          : true;
        const dateEndMatch = historyFilters.dateRange.end
          ? new Date(arret.date_reparation) <= endOfDay(new Date(historyFilters.dateRange.end))
          : true;
        return voitureMatch && projetMatch && codePanneMatch && chauffeurMatch && searchMatch && dateMatch && dateEndMatch;
      })
      .map(arret => {
        const voiture = data.voitures.find(v => v.id === arret.voiture_id);
        const chauffeur = getChauffeurInfo(arret.chauffeur_id);
        let piecesCount = 0;
        let piecesListe = [];
        if (arret.pieces_utilisees && Array.isArray(arret.pieces_utilisees)) {
          piecesCount = arret.pieces_utilisees.length;
          piecesListe = arret.pieces_utilisees;
        } else if (arret.pieces_utilisees && typeof arret.pieces_utilisees === 'string') {
          try {
            piecesListe = JSON.parse(arret.pieces_utilisees);
            piecesCount = piecesListe.length;
          } catch (e) {
            console.error('Erreur parsing JSON:', e);
          }
        }
        return {
          ...arret,
          pieces_utilisees: piecesListe,
          voiture: voiture || { matricule: 'Inconnu' },
          chauffeur,
          piecesCount,
          codePanne: getCodePanneInfo(arret.code_panne_id),
          nombrePannesVoiture: nombrePannesParVoiture.get(arret.voiture_id) || 0
        };
      })
      .sort((a, b) => new Date(b.date_reparation) - new Date(a.date_reparation));
  }, [data.arrets, data.voitures, historyFilters, getCodePanneInfo, getChauffeurInfo, getVoitureInfo, nombrePannesParVoiture]);

  const handleViewVoitureArrets = useCallback((voitureId, voitureMatricule) => {
    const arretsVoiture = data.arrets
      .filter(arret => arret.voiture_id === voitureId)
      .sort((a, b) => new Date(b.date_panne) - new Date(a.date_panne));
    
    setSelectedVoitureForArrets({
      id: voitureId,
      matricule: voitureMatricule,
      nombrePannes: arretsVoiture.length
    });
    setVoitureArretsList(arretsVoiture);
    setShowVoitureArretsModal(true);
  }, [data.arrets]);

  const paginatedHistory = useMemo(() => {
    const startIndex = (historyPagination.currentPage - 1) * historyPagination.itemsPerPage;
    return filteredReparationsArchivees.slice(startIndex, startIndex + historyPagination.itemsPerPage);
  }, [filteredReparationsArchivees, historyPagination]);

  const historyTotalPages = Math.ceil(filteredReparationsArchivees.length / historyPagination.itemsPerPage);

  const paginatedArrets = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    return filteredArrets.slice(startIndex, startIndex + pagination.itemsPerPage);
  }, [filteredArrets, pagination]);

  const totalPages = Math.ceil(filteredArrets.length / pagination.itemsPerPage);

  const stats = useMemo(() => {
    const total = filteredArrets.length;
    const totalDuration = filteredArrets.reduce((sum, a) => sum + (a.duree_panne || 0), 0);
    const totalTF = filteredArrets.reduce((sum, a) => sum + (a.temps_fonctionnement || 0), 0);
    const pannesParCode = {};
    filteredArrets.forEach(arret => {
      const code = getCodePanneInfo(arret.code_panne_id);
      pannesParCode[code] = (pannesParCode[code] || 0) + 1;
    });
    const topPannes = Object.entries(pannesParCode)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const totalPieces = data.arrets.reduce((sum, arret) => {
      const pieces = arret.pieces_utilisees && Array.isArray(arret.pieces_utilisees)
        ? arret.pieces_utilisees.length
        : 0;
      return sum + pieces;
    }, 0);
    const mtbf = total > 0 ? (totalTF / total).toFixed(2) : 0;
    const tdm = totalTF > 0 ? ((totalTF / (total * HEURES_PAR_JOUR)) * 100).toFixed(0) : 0;
    return {
      total,
      totalDuration,
      totalTF,
      mtbf,
      tdm,
      topPannes,
      totalPieces
    };
  }, [filteredArrets, getCodePanneInfo, data.arrets]);

  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return format(date, 'dd/MM');
    });
    
    const dates = last7Days.map(day => {
      const [dayStr, monthStr] = day.split('/');
      const currentYear = new Date().getFullYear();
      return new Date(currentYear, parseInt(monthStr) - 1, parseInt(dayStr));
    });
    
    const actifsParJour = dates.map(date => {
      return data.arrets.filter(arret => {
        const startDate = new Date(arret.date_panne);
        startDate.setHours(0, 0, 0, 0);
        const endDate = arret.date_reparation 
          ? new Date(arret.date_reparation)
          : new Date();
        endDate.setHours(23, 59, 59, 999);
        return date >= startDate && date <= endDate;
      }).length;
    });
    
    const nouveauxParJour = dates.map(date => {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      return data.arrets.filter(arret => {
        const arretDate = new Date(arret.date_panne);
        arretDate.setHours(0, 0, 0, 0);
        return arretDate >= date && arretDate < nextDay;
      }).length;
    });
    
    const reparationsParJour = dates.map(date => {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      return data.arrets.filter(arret => {
        if (!arret.date_reparation) return false;
        const repDate = new Date(arret.date_reparation);
        repDate.setHours(0, 0, 0, 0);
        return repDate >= date && repDate < nextDay;
      }).length;
    });
    
    return {
      labels: last7Days,
      datasets: [
        {
          label: "Nouveaux arrêts",
          data: nouveauxParJour,
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        },
        {
          label: "Réparations",
          data: reparationsParJour,
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        },
        {
          label: "Arrêts actifs",
          data: actifsParJour,
          type: 'line',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          fill: false,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: 'rgba(54, 162, 235, 1)'
        }
      ]
    };
  }, [data.arrets]);

  const pieChartData = useMemo(() => {
    return {
      labels: stats.topPannes.map(p => p[0]),
      datasets: [
        {
          data: stats.topPannes.map(p => p[1]),
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)'
          ],
          borderWidth: 1
        }
      ]
    };
  }, [stats.topPannes]);

  const getVoitureStatistics = useCallback((voitureId) => {
    const voiture = data.voitures.find(v => v.id === parseInt(voitureId));
    if (!voiture) return null;
    const arretsVoiture = data.arrets.filter(a => a.voiture_id === parseInt(voitureId));
    const totalPannes = arretsVoiture.length;
    const totalDuree = arretsVoiture.reduce((sum, a) => sum + (a.duree_panne || 0), 0);
    const piecesConsommees = [];
    const piecesMap = new Map();
    arretsVoiture.forEach(arret => {
      if (arret.pieces_utilisees && Array.isArray(arret.pieces_utilisees)) {
        arret.pieces_utilisees.forEach(piece => {
          const key = piece.nom;
          if (piecesMap.has(key)) {
            piecesMap.set(key, piecesMap.get(key) + piece.quantite);
          } else {
            piecesMap.set(key, piece.quantite);
          }
        });
      }
    });
    piecesMap.forEach((quantite, nom) => {
      piecesConsommees.push({ nom, quantite });
    });
    const totalPieces = piecesConsommees.reduce((sum, p) => sum + p.quantite, 0);
    const pannesParCode = {};
    arretsVoiture.forEach(arret => {
      const code = getCodePanneInfo(arret.code_panne_id);
      pannesParCode[code] = (pannesParCode[code] || 0) + 1;
    });
    const topPannes = Object.entries(pannesParCode)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    return {
      voiture,
      totalPannes,
      totalDuree,
      totalPieces,
      piecesConsommees: piecesConsommees.sort((a, b) => b.quantite - a.quantite),
      arrets: arretsVoiture.sort((a, b) => new Date(b.date_panne) - new Date(a.date_panne)),
      topPannes
    };
  }, [data, getCodePanneInfo]);

  const handleViewVoitureStats = (voitureId) => {
    const stats = getVoitureStatistics(voitureId);
    if (stats) {
      setVoitureStats(stats);
      setModals(prev => ({ ...prev, showVoitureStatsModal: true }));
    }
  };

  const exportVoitureStatsToExcel = async (voitureStats) => {
    try {
      const workbook = new ExcelJS.Workbook();
      const headerStyle = {
        font: { bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF007BFF' } },
        alignment: { horizontal: 'center' }
      };
      const worksheet = workbook.addWorksheet(`Statistiques_${voitureStats.voiture.matricule}`);
      worksheet.mergeCells('A1:D1');
      worksheet.getCell('A1').value = `Statistiques du véhicule ${voitureStats.voiture.matricule}`;
      worksheet.getCell('A1').font = { bold: true, size: 14 };
      worksheet.getCell('A1').alignment = { horizontal: 'center' };
      worksheet.addRow([]);
      worksheet.addRow(['Indicateur', 'Valeur']);
      worksheet.getRow(3).eachCell(cell => cell.style = headerStyle);
      worksheet.addRow(['Total des pannes', voitureStats.totalPannes]);
      worksheet.addRow(['Durée totale d\'arrêt', formatDuration(voitureStats.totalDuree)]);
      worksheet.addRow(['Total pièces consommées', voitureStats.totalPieces]);
      worksheet.addRow([]);
      if (voitureStats.piecesConsommees.length > 0) {
        worksheet.addRow(['Pièces consommées', 'Quantité']);
        worksheet.getRow(8).eachCell(cell => cell.style = headerStyle);
        voitureStats.piecesConsommees.forEach(piece => {
          worksheet.addRow([piece.nom, piece.quantite]);
        });
        worksheet.addRow([]);
      }
      if (voitureStats.topPannes.length > 0) {
        worksheet.addRow(['Top des pannes', 'Nombre']);
        worksheet.getRow(8 + voitureStats.piecesConsommees.length + 2).eachCell(cell => cell.style = headerStyle);
        voitureStats.topPannes.forEach(([code, count]) => {
          worksheet.addRow([code, count]);
        });
      }
      worksheet.columns.forEach(column => {
        column.width = 30;
      });
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Statistiques_${voitureStats.voiture.matricule}_${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
      showToast('Export réussi', 'success');
    } catch (error) {
      console.error('Erreur export:', error);
      showToast('Erreur lors de l\'export', 'danger');
    }
  };

  const ajouterPiece = () => {
    if (nouvellePiece.nom.trim() && nouvellePiece.quantite > 0) {
      setPiecesReparation([...piecesReparation, {
        ...nouvellePiece,
        id: Date.now(),
        quantite: parseInt(nouvellePiece.quantite) || 1
      }]);
      setNouvellePiece({ nom: '', quantite: 1 });
    }
  };

  const supprimerPiece = (id) => {
    setPiecesReparation(piecesReparation.filter(p => p.id !== id));
  };

  const handleReparerVoiture = async () => {
    if (!canModify()) {
      showToast("Vous n'avez pas les permissions pour effectuer cette action", 'warning');
      return;
    }
    try {
      setLoading(true);
      const arretEnCours = data.arrets.find(
        a => a.voiture_id === voitureAReparer.id && !a.date_reparation
      );
      if (!arretEnCours) {
        showToast('Aucun arrêt en cours pour ce equipement', 'warning');
        return;
      }
      const start = new Date(arretEnCours.date_panne);
      const end = new Date(dateReparationInput);
      const dureePanne = calculerDureePanneAvecHoraires(start, end);
      const jours = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 1;
      const tempsFonctionnement = Math.max(0, (jours * HEURES_PAR_JOUR) - dureePanne);
      const piecesData = piecesReparation.map(p => ({
        nom: p.nom,
        quantite: p.quantite
      }));
      const payload = {
        voiture: arretEnCours.voiture_id,
        chauffeur_id: selectedChauffeur || null,
        projet: arretEnCours.projet_id,
        code_panne: arretEnCours.code_panne_id,
        date_panne: arretEnCours.date_panne,
        date_reparation: dateReparationInput,
        duree_panne: dureePanne,
        cause_panne: arretEnCours.cause_panne,
        travaux_effectues: travauxReparation || arretEnCours.travaux_effectues,
        intervenant: intervenantReparation || arretEnCours.intervenant,
        observation: commentaireReparation || arretEnCours.observation,
        temps_fonctionnement: tempsFonctionnement,
        nombre_pannes: arretEnCours.nombre_pannes || 1,
        pieces_utilisees: piecesData.length > 0 ? JSON.stringify(piecesData) : null,
        quantite_pieces: piecesData.length
      };
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/arretages/${arretEnCours.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Erreur lors de la réparation');
      showToast(`Véhicule ${voitureAReparer.matricule} réparé avec succès`, 'success');
      await fetchData();
      setShowReparerModal(false);
      resetReparationForm();
    } catch (error) {
      console.error('Erreur lors de la réparation:', error);
      let errorMessage = 'Erreur lors de la réparation';
      showToast(errorMessage, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const resetReparationForm = () => {
    setPiecesReparation([]);
    setNouvellePiece({ nom: '', quantite: 1 });
    setIntervenantReparation('');
    setTravauxReparation('');
    setCommentaireReparation('');
    setSelectedChauffeur(null);
    setChauffeurInput('');
  };

  const handleViewReparationDetails = (voiture, arret) => {
    const piecesUtilisees = arret.pieces_utilisees && Array.isArray(arret.pieces_utilisees)
      ? arret.pieces_utilisees
      : [];
    setSelectedReparation({
      voiture,
      arret,
      pieces: piecesUtilisees
    });
    setModals(prev => ({ ...prev, showReparationDetailsModal: true }));
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (voitureInput.length > 0) {
      const filtered = data.voitures.filter(v =>
        v.matricule.toLowerCase().includes(voitureInput.toLowerCase())
      );
      setFilteredVoitures(filtered);
      setShowVoitureDropdown(filtered.length > 0);
    } else {
      setFilteredVoitures(data.voitures);
      setShowVoitureDropdown(false);
    }
  }, [voitureInput, data.voitures]);

  useEffect(() => {
    if (chauffeurInput.length > 0) {
      const filtered = data.chauffeurs.filter(c =>
        c.nom.toLowerCase().includes(chauffeurInput.toLowerCase()) ||
        c.matricule.toLowerCase().includes(chauffeurInput.toLowerCase())
      );
      setFilteredChauffeurs(filtered);
      setShowChauffeurDropdown(filtered.length > 0);
    } else {
      setFilteredChauffeurs([]);
      setShowChauffeurDropdown(false);
    }
  }, [chauffeurInput, data.chauffeurs]);

  useEffect(() => {
    if (!modals.showAddModal && !modals.showEditModal) return;
    const [datePanne, dateReparation] = watchDates;
    if (datePanne && dateReparation) {
      const start = new Date(datePanne);
      const end = new Date(dateReparation);
      const dureePanne = calculerDureePanneAvecHoraires(start, end);
      setValue('duree_panne', dureePanne.toFixed(2));
    }
  }, [watchDates, modals.showAddModal, modals.showEditModal, setValue]);

  const requestSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleHistoryPageChange = (page) => {
    setHistoryPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleItemsPerPageChange = (e) => {
    setPagination(prev => ({
      ...prev,
      itemsPerPage: parseInt(e.target.value),
      currentPage: 1
    }));
  };

  const handleHistoryItemsPerPageChange = (e) => {
    setHistoryPagination(prev => ({
      ...prev,
      itemsPerPage: parseInt(e.target.value),
      currentPage: 1
    }));
  };

  const resetFilters = () => {
    setFilters({
      selectedVoiture: '',
      selectedCodePanne: '',
      selectedProjet: '',
      selectedChauffeur: '',
      selectedStatut: '',
      searchQuery: '',
      dateRange: { start: '', end: null },
      showFiltres: true
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };
  
  const resetHistoryFilters = () => {
    setHistoryFilters({
      selectedVoiture: '',
      selectedCodePanne: '',
      selectedProjet: '',
      selectedChauffeur: '',
      searchQuery: '',
      dateRange: { start: '', end: '' },
      showFiltres: true
    });
    setHistoryPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const initArretForm = () => ({
    id: null,
    voiture_id: '',
    chauffeur_id: '',
    projet_id: '',
    code_panne_id: '',
    date_panne: new Date().toISOString().slice(0, 16),
    date_reparation: null,
    duree_panne: 0,
    cause_panne: '',
    travaux_effectues: '',
    intervenant: '',
    observation: '',
    jour: null,
    temps_fonctionnement: 0,
    nombre_pannes: 1,
    mtbf: null,
    tdm: null,
    him: null
  });

  const handleAddArret = () => {
    if (!canModify()) {
      showToast("Vous n'avez pas les permissions pour ajouter des arrêts", 'warning');
      return;
    }
    reset(initArretForm());
    setVoitureInput('');
    setSelectedVoiture(null);
    setShowVoitureDropdown(false);
    setModals(prev => ({ ...prev, showAddModal: true }));
  };

  const handleEditArret = (arret) => {
    if (!canModify()) {
      showToast("Vous n'avez pas les permissions pour modifier des arrêts", 'warning');
      return;
    }
    const voiture = data.voitures.find(v => v.id === arret.voiture_id);
    const chauffeur = data.chauffeurs.find(c => c.id === arret.chauffeur_id);
    const formData = {
      id: arret.id,
      voiture_id: arret.voiture_id,
      chauffeur_id: arret.chauffeur_id || '',
      projet_id: arret.projet_id || '',
      code_panne_id: arret.code_panne_id || '',
      date_panne: arret.date_panne?.slice(0, 16) || new Date().toISOString().slice(0, 16),
      date_reparation: arret.date_reparation ? arret.date_reparation.slice(0, 16) : null,
      duree_panne: arret.duree_panne || 0,
      cause_panne: arret.cause_panne || '',
      travaux_effectues: arret.travaux_effectues || '',
      intervenant: arret.intervenant || '',
      observation: arret.observation || '',
      jour: arret.jour || null,
      temps_fonctionnement: arret.temps_fonctionnement || 0,
      nombre_pannes: arret.nombre_pannes || 1,
      mtbf: arret.mtbf || null,
      tdm: arret.tdm || null,
      him: arret.him || null
    };
    reset(formData);
    setVoitureInput(voiture?.matricule || '');
    setSelectedVoiture(arret.voiture_id);
    setChauffeurInput(chauffeur ? `${chauffeur.nom} (${chauffeur.matricule})` : '');
    setSelectedChauffeur(arret.chauffeur_id);
    setShowVoitureDropdown(false);
    setModals(prev => ({ ...prev, showEditModal: true }));
  };

  const handleDeleteArret = (arret) => {
    if (!canModify()) {
      showToast("Vous n'avez pas les permissions pour supprimer des arrêts", 'warning');
      return;
    }
    setArretToDelete(arret);
    setModals(prev => ({ ...prev, showDeleteModal: true }));
  };

  const handleCreateVoiture = async () => {
    if (!canModify()) {
      showToast("Vous n'avez pas les permissions pour créer des véhicules", 'warning');
      return null;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.voitures, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ matricule: voitureInput })
      });
      if (!response.ok) throw new Error('Erreur lors de la création');
      const data = await response.json();
      showToast('Voiture créée avec succès', 'success');
      await fetchData();
      const newId = data.id || data.data?.id;
      setSelectedVoiture(newId);
      setValue('voiture_id', newId);
      return newId;
    } catch (error) {
      showToast("Erreur lors de la création de la voiture", 'danger');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const submitArret = async (formData, isEdit = false) => {
    if (!canModify()) {
      showToast("Vous n'avez pas les permissions pour cette action", 'warning');
      return;
    }
    try {
      setLoading(true);
      let voitureId = formData.voiture_id;
      if (!voitureId && voitureInput) {
        voitureId = await handleCreateVoiture();
        if (!voitureId) return;
      }
      let dureePanneEnHeures = parseFloat(formData.duree_panne) || 0;
      let nbJours = 1;
      if (formData.date_panne && formData.date_reparation) {
        const start = new Date(formData.date_panne);
        const end = new Date(formData.date_reparation);
        const diffEnMs = end - start;
        const diffEnJours = diffEnMs / (1000 * 60 * 60 * 24);
        nbJours = Math.ceil(diffEnJours) || 1;
        if (nbJours === 1) {
          dureePanneEnHeures = diffEnMs / (1000 * 60 * 60);
        } else {
          dureePanneEnHeures = calculerDureePanneAvecHoraires(start, end);
        }
      }
      const tempsFonctionnement = Math.max(0, (nbJours * HEURES_PAR_JOUR) - dureePanneEnHeures);
      const nbPannes = parseInt(formData.nombre_pannes) || 1;
      const mtbf = nbPannes > 0 ? (tempsFonctionnement / nbPannes) : null;
      const payload = {
        voiture: parseInt(voitureId),
        chauffeur_id: formData.chauffeur_id ? parseInt(formData.chauffeur_id) : null,
        projet: formData.projet_id ? parseInt(formData.projet_id) : null,
        code_panne: formData.code_panne_id ? parseInt(formData.code_panne_id) : null,
        date_panne: formData.date_panne,
        date_reparation: formData.date_reparation || null,
        duree_panne: dureePanneEnHeures,
        cause_panne: formData.cause_panne || '',
        travaux_effectues: formData.travaux_effectues || '',
        intervenant: formData.intervenant || '',
        observation: formData.observation || '',
        jour: formData.jour || null,
        temps_fonctionnement: tempsFonctionnement,
        nombre_pannes: nbPannes,
        mtbf: mtbf,
        tdm: formData.tdm ? parseFloat(formData.tdm) : null,
        him: formData.him ? parseFloat(formData.him) : null
      };
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      let response;
      if (isEdit) {
        response = await fetch(`${API_BASE_URL}/arretages/${formData.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch(`${API_BASE_URL}/arretages`, {
          method: 'POST',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }
      if (!response.ok) throw new Error('Erreur lors de l\'enregistrement');
      showToast(isEdit ? 'Arrêt mis à jour avec succès' : 'Nouvel arrêt créé avec succès', 'success');
      await fetchData();
      setModals(prev => ({ ...prev, showAddModal: false, showEditModal: false }));
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement:', err);
      showToast("Erreur lors de l'enregistrement", 'danger');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!canModify()) {
      showToast("Vous n'avez pas les permissions pour supprimer", 'warning');
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/arretages/${arretToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression');
      showToast(`Arrêt #${arretToDelete.id} supprimé avec succès`, 'success');
      await fetchData();
      setModals(prev => ({ ...prev, showDeleteModal: false }));
    } catch (err) {
      showToast('Erreur lors de la suppression', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const headerStyle = {
        font: { bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF007BFF' } },
        alignment: { horizontal: 'center' }
      };
      const worksheet = workbook.addWorksheet('Arrêts en cours');
      const headers = [
        'ID', 'Equipement', 'Chauffeur', 'Projet', 'Code Panne', 'Date Panne', 'Durée actuelle',
        'Cause', 'Intervenant', 'Observation', 'Pièces', 'Âge (jours)'
      ];
      const headerRow = worksheet.addRow(headers);
      headerRow.eachCell(cell => {
        cell.style = headerStyle;
      });
      arretsEnCours.forEach(arret => {
        const chauffeur = getChauffeurInfo(arret.chauffeur_id);
        const piecesListe = arret.pieces_utilisees && Array.isArray(arret.pieces_utilisees)
          ? arret.pieces_utilisees.map(p => `${p.nom} (x${p.quantite})`).join(', ')
          : '-';
        const ageJours = getArretDurationDays(arret.date_panne);
        worksheet.addRow([
          arret.id,
          getVoitureInfo(arret.voiture_id),
          chauffeur ? `${chauffeur.nom} (${chauffeur.matricule})` : '-',
          getProjetInfo(arret.projet_id),
          getCodePanneInfo(arret.code_panne_id),
          formatDisplayDate(arret.date_panne),
          formatDuration(arret.duree_panne),
          arret.cause_panne || '-',
          arret.intervenant || '-',
          arret.observation || '-',
          piecesListe,
          ageJours
        ]);
      });
      worksheet.columns.forEach(column => {
        column.width = 20;
      });
      const archiveSheet = workbook.addWorksheet('Historique réparations');
      const archiveHeaderRow = archiveSheet.addRow([
        'Date réparation', 'Equipement', 'Chauffeur', 'Code panne', 'Date panne',
        'Durée', 'Intervenant', 'Nombre de pièces', 'Détail des pièces', 'Nombre de pannes', 'Actions'
      ]);
      archiveHeaderRow.eachCell(cell => {
        cell.style = headerStyle;
      });
      filteredReparationsArchivees.forEach(reparation => {
        const piecesListe = reparation.pieces_utilisees && Array.isArray(reparation.pieces_utilisees)
          ? reparation.pieces_utilisees.map(p => `${p.nom} (x${p.quantite})`).join(', ')
          : '-';
        archiveSheet.addRow([
          formatDateShort(reparation.date_reparation),
          reparation.voiture.matricule,
          reparation.chauffeur ? reparation.chauffeur.nom : '-',
          reparation.codePanne,
          formatDateShort(reparation.date_panne),
          formatDuration(reparation.duree_panne),
          reparation.intervenant || '-',
          reparation.piecesCount,
          piecesListe,
          reparation.nombrePannesVoiture,
          'Consultable'
        ]);
      });
      const statsSheet = workbook.addWorksheet('Indicateurs');
      statsSheet.addRow(['Indicateur', 'Valeur']).eachCell(cell => {
        cell.style = headerStyle;
      });
      statsSheet.addRow(['Total équipements', data.voitures.length]);
      statsSheet.addRow(['Arrêts en cours', arretsEnCours.length]);
      statsSheet.addRow(['Arrêts anciens (+24h)', oldArretsCount]);
      statsSheet.addRow(['Réparations terminées', arretsRepares.length]);
      statsSheet.addRow(['Durée totale des arrêts', formatDuration(stats.totalDuration)]);
      statsSheet.addRow(['MTBF', `${stats.mtbf} h`]);
      statsSheet.addRow(['TDM', `${stats.tdm} %`]);
      statsSheet.addRow(['Total pièces utilisées', stats.totalPieces]);
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Rapport_Arrets_${format(new Date(), 'dd-MM-yyyy_HH-mm')}.xlsx`);
      showToast('Export Excel généré avec succès', 'success');
    } catch (error) {
      console.error('Erreur export Excel:', error);
      showToast('Erreur lors de la génération du fichier Excel', 'danger');
    }
  };

  const HistoryDateRangeFilter = () => (
    <Row className="mb-3 g-2 align-items-end">
      <Col md={5}>
        <Form.Group>
          <Form.Label className="fw-bold">
            <FaCalendarAlt className="me-2" />
            Date début réparation
          </Form.Label>
          <InputGroup>
            <Form.Control
              type="date"
              value={historyFilters.dateRange.start || ''}
              onChange={e => setHistoryFilters(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, start: e.target.value }
              }))}
            />
            <InputGroup.Text className="bg-primary text-white">
              <FaCalendarAlt />
            </InputGroup.Text>
          </InputGroup>
        </Form.Group>
      </Col>
      <Col md={5}>
        <Form.Group>
          <Form.Label className="fw-bold">
            <FaCalendarAlt className="me-2" />
            Date fin réparation
          </Form.Label>
          <InputGroup>
            <Form.Control
              type="date"
              value={historyFilters.dateRange.end || ''}
              onChange={e => setHistoryFilters(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, end: e.target.value }
              }))}
              min={historyFilters.dateRange.start || ''}
            />
            <InputGroup.Text className="bg-primary text-white">
              <FaCalendarAlt />
            </InputGroup.Text>
          </InputGroup>
        </Form.Group>
      </Col>
      <Col md={2}>
        <Button
          variant="outline-secondary"
          onClick={() => setHistoryFilters(prev => ({
            ...prev,
            dateRange: { start: '', end: '' }
          }))}
          className="w-100"
        >
          Réinitialiser
        </Button>
      </Col>
    </Row>
  );

  const DateRangeFilter = () => (
    <Row className="mb-3 g-2 align-items-end">
      <Col md={5}>
        <Form.Group>
          <Form.Label className="fw-bold">
            <FaCalendarAlt className="me-2" />
            Date de début
          </Form.Label>
          <InputGroup>
            <Form.Control
              type="date"
              value={filters.dateRange.start || ''}
              onChange={e => setFilters(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, start: e.target.value }
              }))}
            />
            <InputGroup.Text className="bg-primary text-white">
              <FaCalendarAlt />
            </InputGroup.Text>
          </InputGroup>
        </Form.Group>
      </Col>
      <Col md={5}>
        <Form.Group>
          <Form.Label className="fw-bold">
            <FaCalendarAlt className="me-2" />
            Date de fin
          </Form.Label>
          <InputGroup>
            <Form.Control
              type="date"
              value={filters.dateRange.end || ''}
              onChange={e => setFilters(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, end: e.target.value }
              }))}
              min={filters.dateRange.start || ''}
            />
            <InputGroup.Text className="bg-primary text-white">
              <FaCalendarAlt />
            </InputGroup.Text>
          </InputGroup>
        </Form.Group>
      </Col>
      <Col md={2}>
        <Button
          variant="outline-secondary"
          onClick={() => setFilters(prev => ({
            ...prev,
            dateRange: { start: '', end: null }
          }))}
          className="w-100"
        >
          Réinitialiser
        </Button>
      </Col>
    </Row>
  );
  
  const StatsCards = () => {
    const totalEquipements = data.voitures.length;
    const totalArrets = arretsEnCours.length;
    const totalRepares = arretsRepares.length;
    const voituresEnMarche = totalEquipements - totalArrets;
    return (
      <Row className="g-3 mb-4">
        <Col md={3}>
          <Card className="bg-primary text-white shadow h-100 stat-card">
            <Card.Body className="d-flex align-items-center">
              <div className="flex-shrink-0 me-3">
                <div className="bg-white bg-opacity-25 rounded-circle p-3">
                  <FaCar size={24} />
                </div>
              </div>
              <div>
                <h6 className="mb-1">Total équipement</h6>
                <h3 className="mb-0">{totalEquipements}</h3>
                <small className="opacity-75">Parc total</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="bg-success text-white shadow h-100 stat-card">
            <Card.Body className="d-flex align-items-center">
              <div className="flex-shrink-0 me-3">
                <div className="bg-white bg-opacity-25 rounded-circle p-3">
                  <FaCheck size={24} />
                </div>
              </div>
              <div>
                <h6 className="mb-1">En marche</h6>
                <h3 className="mb-0">{voituresEnMarche}</h3>
                <small className="opacity-75">{((voituresEnMarche / totalEquipements) * 100).toFixed(0)}% du parc</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="bg-danger text-white shadow h-100 stat-card">
            <Card.Body className="d-flex align-items-center">
              <div className="flex-shrink-0 me-3">
                <div className="bg-white bg-opacity-25 rounded-circle p-3">
                  <FaExclamationTriangle size={24} />
                </div>
              </div>
              <div>
                <h6 className="mb-1">En arrêt</h6>
                <h3 className="mb-0">{totalArrets}</h3>
                <small className="opacity-75">{((totalArrets / totalEquipements) * 100).toFixed(0)}% du parc</small>
                {oldArretsCount > 0 && (
                  <Badge bg="warning" text="dark" className="mt-1">
                    {oldArretsCount} ancien(s) arrêt(s)
                  </Badge>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="bg-info text-white shadow h-100 stat-card">
            <Card.Body className="d-flex align-items-center">
              <div className="flex-shrink-0 me-3">
                <div className="bg-white bg-opacity-25 rounded-circle p-3">
                  <FaHistory size={24} />
                </div>
              </div>
              <div>
                <h6 className="mb-1">Réparations</h6>
                <h3 className="mb-0">{totalRepares}</h3>
                <small className="opacity-75">Historique</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    );
  };

  const ChartCard = () => (
    <Card className="mb-4 shadow">
      <Card.Header className="bg-light d-flex align-items-center">
        <FaChartLine className="me-2 text-primary" />
        <h6 className="mb-0">Évolution des arrêts (7 derniers jours)</h6>
      </Card.Header>
      <Card.Body style={{ height: '250px' }}>
        <Bar
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const label = context.dataset.label || '';
                    const value = context.parsed.y;
                    return `${label}: ${value}`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: { stepSize: 1, precision: 0 }
              }
            }
          }}
        />
      </Card.Body>
    </Card>
  );

  const TopPannesCard = () => (
    <Card className="mb-4 shadow">
      <Card.Header className="bg-light d-flex align-items-center">
        <FaExclamationTriangle className="me-2 text-warning" />
        <h6 className="mb-0">Top 5 des pannes</h6>
      </Card.Header>
      <Card.Body>
        {stats.topPannes.length > 0 ? (
          <>
            <div style={{ height: '150px' }} className="mb-3">
              <Pie
                data={pieChartData}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: (context) => `${context.label}: ${context.parsed} occurrence(s)`
                      }
                    }
                  }
                }}
              />
            </div>
            {stats.topPannes.map(([code, count], index) => (
              <div key={code} className="d-flex align-items-center mb-2">
                <Badge
                  bg={index === 0 ? 'danger' : index === 1 ? 'warning' : 'info'}
                  className="me-2"
                  style={{ width: '30px' }}
                >
                  #{index + 1}
                </Badge>
                <div className="flex-grow-1">
                  <small>{code}</small>
                </div>
                <Badge bg="secondary">{count}</Badge>
              </div>
            ))}
          </>
        ) : (
          <p className="text-muted text-center mb-0">Aucune donnée</p>
        )}
      </Card.Body>
    </Card>
  );

  if (userLoading) {
    return (
      <div className="container-fluid py-4 text-center" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Vérification des permissions...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <style>
        {`
          .cursor-pointer { cursor: pointer; }
          .hover-bg-light:hover { background-color: #f8f9fa; }
          .zindex-100 { z-index: 1000; }
          .spin { animation: spin 1s linear infinite; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .table th { font-weight: 600; color: #495057; border-top: none; }
          .table td { vertical-align: middle; }
          .progress { background-color: #e9ecef; border-radius: 2px; }
          .bg-opacity-10 { --bs-bg-opacity: 0.1; }
          .pieces-tooltip { max-width: 300px; }
          .stat-card { transition: all 0.3s ease; }
          .stat-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important; }
          .clickable-badge { cursor: pointer; transition: all 0.2s; }
          .clickable-badge:hover { opacity: 0.8; transform: scale(1.05); }
          .clickable-link { cursor: pointer; text-decoration: underline; color: #0d6efd; }
          .clickable-link:hover { color: #0a58ca; }
          
          .custom-tabs .nav-item {
            margin-right: 8px;
          }
          
          .custom-tabs .nav-link {
            font-weight: 600;
            padding: 10px 24px;
            border: none;
            transition: all 0.3s ease;
            border-radius: 8px 8px 0 0;
            opacity: 0.85;
          }
          
          .custom-tabs .nav-link:hover {
            opacity: 1;
            transform: translateY(-2px);
          }
          
          .custom-tabs .nav-link.active {
            opacity: 1;
            box-shadow: 0 -2px 8px rgba(0,0,0,0.15);
          }
          
          .custom-tabs .nav-link[data-rr-ui-event-key="liste"] {
            background: linear-gradient(135deg, #dc3545, #c82333);
            color: white;
          }
          
          .custom-tabs .nav-link[data-rr-ui-event-key="liste"]:hover {
            background: linear-gradient(135deg, #c82333, #a71d2a);
          }
          
          .custom-tabs .nav-link[data-rr-ui-event-key="liste"].active {
            background: linear-gradient(135deg, #a71d2a, #8b1a2a);
            box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
          }
          
          .custom-tabs .nav-link[data-rr-ui-event-key="archive"] {
            background: linear-gradient(135deg, #17a2b8, #138496);
            color: white;
          }
          
          .custom-tabs .nav-link[data-rr-ui-event-key="archive"]:hover {
            background: linear-gradient(135deg, #138496, #0f6b7a);
          }
          
          .custom-tabs .nav-link[data-rr-ui-event-key="archive"].active {
            background: linear-gradient(135deg, #0f6b7a, #0a4f5a);
            box-shadow: 0 4px 12px rgba(23, 162, 184, 0.4);
          }
          
          .custom-tabs .nav-link[data-rr-ui-event-key="rapport-journalier"] {
            background: linear-gradient(135deg, #28a745, #218838);
            color: white;
          }
          
          .custom-tabs .nav-link[data-rr-ui-event-key="rapport-journalier"]:hover {
            background: linear-gradient(135deg, #218838, #1e7e34);
          }
          
          .custom-tabs .nav-link[data-rr-ui-event-key="rapport-journalier"].active {
            background: linear-gradient(135deg, #1e7e34, #166b2c);
            box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
          }
        `}
      </style>
      <Card className="shadow-lg border-0">
        <Card.Header className="bg-gradient-primary text-white py-3" style={{ background: 'linear-gradient(45deg, #007bff, #0056b3)' }}>
          <Row className="align-items-center">
            <Col md={6}>
              <div className="d-flex align-items-center">
                <h3 className="mb-0 d-flex align-items-center">
                  <FaCar className="me-2" />
                  Gestion des Arrêts d'Équipement
                </h3>
                <Badge
                  bg={canModify() ? 'success' : 'secondary'}
                  className="ms-3 py-2"
                  style={{ fontSize: '0.9rem' }}
                >
                  {canModify() ? <FaUserShield className="me-1" /> : <FaUser className="me-1" />}
                  {isAdmin() ? 'Administrateur' : isDM() ? 'DM' : 'Consultation'}
                </Badge>
              </div>
              <div className="mt-2">
                <Badge bg="light" text="dark" className="me-2">
                  {arretsEnCours.length} arrêt(s) en cours
                </Badge>
                {oldArretsCount > 0 && (
                  <Badge bg="warning" text="dark" className="me-2">
                    ⚠️ {oldArretsCount} ancien(s) arrêt(s)
                  </Badge>
                )}
                {arretsRepares.length > 0 && (
                  <Badge bg="info" className="me-2">
                    {arretsRepares.length} réparé(s)
                  </Badge>
                )}
              </div>
            </Col>
            <Col md={6} className="text-end">
              <Button variant="light" onClick={fetchData} disabled={loading} className="me-2 shadow-sm">
                <FaSyncAlt className={loading ? "spin" : ""} />
                <span className="ms-2">Rafraîchir</span>
              </Button>
              <Dropdown className="d-inline-block me-2">
                <Dropdown.Toggle variant="outline-light" className="shadow-sm">
                  <FaFileExport /> Exporter
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={exportToExcel}>
                    <FaFileExcel className="me-2 text-success" /> Excel (Global)
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => window.print()}>
                    <FaPrintIcon className="me-2 text-primary" /> Imprimer
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              {canModify() && (
                <Button variant="success" onClick={handleAddArret} disabled={loading} className="shadow-sm">
                  <FaPlus className="me-1" /> Nouvel arrêt
                </Button>
              )}
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          {loading && !data.arrets.length ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
              <p className="mt-3 text-muted">Chargement des données...</p>
            </div>
          ) : error ? (
            <Alert variant="danger" className="d-flex align-items-center">
              <FaExclamationTriangle size={24} className="me-3" />
              <div className="flex-grow-1">
                <strong>Erreur :</strong> {error}
              </div>
              <Button variant="outline-danger" onClick={fetchData} className="ms-3">
                <FaSyncAlt className="me-2" /> Réessayer
              </Button>
            </Alert>
          ) : (
            <>
              <ToastContainer position="top-end" className="p-3">
                {toasts.map(toast => (
                  <Toast
                    key={toast.id}
                    onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                    bg={toast.variant}
                    autohide
                    delay={5000}
                    className="shadow"
                  >
                    <Toast.Body className="text-white d-flex align-items-center">
                      {toast.variant === 'success' ? <FaCheck className="me-2" /> : <FaExclamationTriangle className="me-2" />}
                      {toast.message}
                    </Toast.Body>
                  </Toast>
                ))}
              </ToastContainer>
              <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4 custom-tabs">
                {/* Onglet 1: Arrêts en cours */}
                <Tab eventKey="liste" title={
                  <span>
                    <FaExclamationTriangle className="me-2" />
                    Arrêts en cours
                    <Badge bg="light" text="danger" className="ms-2 rounded-pill">
                      {arretsEnCours.length}
                    </Badge>
                  </span>
                }>
                  <Card className="mb-4 shadow-sm border-0 mt-3">
                    <Card.Header
                      className="bg-light d-flex justify-content-between align-items-center cursor-pointer py-3"
                      onClick={() => setFilters(prev => ({ ...prev, showFiltres: !prev.showFiltres }))}
                      style={{ cursor: 'pointer' }}
                    >
                      <h5 className="mb-0 d-flex align-items-center">
                        <FaFilter className="me-2 text-primary" /> Filtres
                        <Badge bg="secondary" className="ms-2">
                          {filters.selectedVoiture || filters.selectedProjet || filters.selectedCodePanne || filters.selectedChauffeur || filters.searchQuery || filters.dateRange.start ? 'Actifs' : 'Tous'}
                        </Badge>
                        {oldArretsCount > 0 && (
                          <Badge bg="warning" text="dark" className="ms-2">
                            ⚠️ {oldArretsCount} arrêt(s) non réparé(s)
                          </Badge>
                        )}
                      </h5>
                      <div className="d-flex gap-2">
                        {oldArretsCount > 0 && (
                          <Button
                            variant={showOnlyOld ? "warning" : "outline-warning"}
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowOnlyOld(!showOnlyOld);
                            }}
                          >
                            {showOnlyOld ? "Tous les arrêts" : "Anciens arrêts"}
                          </Button>
                        )}
                        <Button variant="link" className="p-0 text-decoration-none">
                          {filters.showFiltres ? <FaTimes className="me-1" /> : <FaFilter className="me-1" />}
                          {filters.showFiltres ? 'Masquer' : 'Afficher'}
                        </Button>
                      </div>
                    </Card.Header>
                    
                    {filters.showFiltres && (
                      <Card.Body>
                        <Row className="g-3">
                          <Col md={3}>
                            <Form.Group>
                              <Form.Label className="fw-bold">
                                <FaCar className="me-1 text-primary" /> Équipement
                              </Form.Label>
                              <Form.Select
                                value={filters.selectedVoiture}
                                onChange={e => setFilters(p => ({ ...p, selectedVoiture: e.target.value, currentPage: 1 }))}
                                className="shadow-sm"
                              >
                                <option value="">Tous les équipements</option>
                                {data.voitures.map(v => (
                                  <option key={v.id} value={v.id}>{v.matricule}</option>
                                ))}
                              </Form.Select>
                            </Form.Group>
                          </Col>
                          
                          <Col md={3}>
                            <Form.Group>
                              <Form.Label className="fw-bold">
                                <FaUserTie className="me-1 text-primary" /> Chauffeur
                              </Form.Label>
                              <Form.Select
                                value={filters.selectedChauffeur}
                                onChange={e => setFilters(p => ({ ...p, selectedChauffeur: e.target.value, currentPage: 1 }))}
                                className="shadow-sm"
                              >
                                <option value="">Tous les chauffeurs</option>
                                {data.chauffeurs.map(c => (
                                  <option key={c.id} value={c.id}>{c.nom} ({c.matricule})</option>
                                ))}
                              </Form.Select>
                            </Form.Group>
                          </Col>
                          
                          <Col md={3}>
                            <Form.Group>
                              <Form.Label className="fw-bold">
                                <FaProjectDiagram className="me-1 text-primary" /> Projet
                              </Form.Label>
                              <Form.Select
                                value={filters.selectedProjet}
                                onChange={e => setFilters(p => ({ ...p, selectedProjet: e.target.value, currentPage: 1 }))}
                                className="shadow-sm"
                              >
                                <option value="">Tous les projets</option>
                                {data.projets.map(p => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </Form.Select>
                            </Form.Group>
                          </Col>
                          
                          <Col md={3}>
                            <Form.Group>
                              <Form.Label className="fw-bold">
                                <FaWrench className="me-1 text-primary" /> Code panne
                              </Form.Label>
                              <Form.Select
                                value={filters.selectedCodePanne}
                                onChange={e => setFilters(p => ({ ...p, selectedCodePanne: e.target.value, currentPage: 1 }))}
                                className="shadow-sm"
                              >
                                <option value="">Tous les codes</option>
                                {data.codesPanne.map(c => (
                                  <option key={c.id} value={c.id}>{c.code || c.name || `Code ${c.id}`}</option>
                                ))}
                              </Form.Select>
                            </Form.Group>
                          </Col>
                        </Row>
                        
                        <Row className="g-3 mt-2">
                          <Col md={8}>
                            <Form.Group>
                              <Form.Label className="fw-bold">
                                <FaSearch className="me-1 text-primary" /> Recherche
                              </Form.Label>
                              <InputGroup className="shadow-sm">
                                <InputGroup.Text className="bg-white">
                                  <FaSearch className="text-muted" />
                                </InputGroup.Text>
                                <Form.Control
                                  ref={searchInputRef}
                                  type="text"
                                  placeholder="Rechercher par cause, intervenant, ou travaux effectués..."
                                  value={filters.searchQuery}
                                  onChange={e => setFilters(p => ({ ...p, searchQuery: e.target.value, currentPage: 1 }))}
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
                          
                          <Col md={4}>
                            <Form.Group>
                              <Form.Label className="fw-bold">
                                <FaFilter className="me-1 text-primary" /> Statut
                              </Form.Label>
                              <Form.Select
                                value={filters.selectedStatut}
                                onChange={e => setFilters(p => ({ ...p, selectedStatut: e.target.value, currentPage: 1 }))}
                                className="shadow-sm"
                              >
                                <option value="">Tous les statuts</option>
                                <option value="en_cours">En cours</option>
                                <option value="termine">Terminé</option>
                                <option value="en_attente">En attente</option>
                              </Form.Select>
                            </Form.Group>
                          </Col>
                        </Row>
                        
                        <DateRangeFilter />
                        
                        {(filters.selectedVoiture || filters.selectedProjet || filters.selectedCodePanne || 
                          filters.selectedChauffeur || filters.searchQuery || filters.dateRange.start || 
                          filters.selectedStatut) && (
                          <div className="text-end mt-3">
                            <Button variant="outline-secondary" size="sm" onClick={resetFilters}>
                              <FaTimes className="me-2" /> Réinitialiser tous les filtres
                            </Button>
                          </div>
                        )}
                      </Card.Body>
                    )}
                  </Card>
                  
                  {oldArretsCount > 0 && !showOnlyOld && (
                    <Alert variant="info" className="mb-3">
                      <FaInfoCircle className="me-2" />
                      <strong>Information :</strong> {oldArretsCount} equipement(s) sont en arrêt depuis plus d'une journée.
                      Ils restent dans la liste tant qu'ils ne sont pas réparés.
                      <Button
                        variant="outline-info"
                        size="sm"
                        className="ms-3"
                        onClick={() => setShowOnlyOld(true)}
                      >
                        Voir uniquement les anciens arrêts
                      </Button>
                    </Alert>
                  )}
                  
                  {showOnlyOld && (
                    <Alert variant="warning" className="mb-3" dismissible onClose={() => setShowOnlyOld(false)}>
                      <FaExclamationTriangle className="me-2" />
                      <strong>Affichage des anciens arrêts :</strong> Vous voyez uniquement les equipements en arrêt depuis au moins 24h.
                      <Button
                        variant="outline-warning"
                        size="sm"
                        className="ms-3"
                        onClick={() => setShowOnlyOld(false)}
                      >
                        Afficher tous les arrêts
                      </Button>
                    </Alert>
                  )}
                  
                  <StatsCards />
                  <Row>
                    <Col md={8}><ChartCard /></Col>
                    <Col md={4}><TopPannesCard /></Col>
                  </Row>
                  <Card className="shadow-sm border-0">
                    <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <h6 className="mb-0 me-3">Liste des arrêts en cours</h6>
                        <Form.Select size="sm" value={pagination.itemsPerPage} onChange={handleItemsPerPageChange} style={{ width: 'auto' }}>
                          {pagination.itemsPerPageOptions.map(opt => (
                            <option key={opt} value={opt}>{opt} par page</option>
                          ))}
                        </Form.Select>
                      </div>
                      <div className="text-muted small">Affichage {paginatedArrets.length} sur {filteredArrets.length} arrêts</div>
                    </Card.Header>
                    <div className="table-responsive">
                      <Table striped hover className="align-middle mb-0">
                        <thead className="bg-light">
                          <tr>
                            <th onClick={() => requestSort('voiture_id')} className="cursor-pointer">Equipement {sortConfig.key === 'voiture_id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                            <th>Chauffeur</th>
                            <th>Projet</th>
                            <th>Code Panne</th>
                            <th onClick={() => requestSort('date_panne')} className="cursor-pointer">Date panne {sortConfig.key === 'date_panne' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                            <th>Durée</th>
                            <th>Cause</th>
                            {canModify() && <th>Actions</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedArrets.length > 0 ? (
                            paginatedArrets.map(arret => {
                              const chauffeur = getChauffeurInfo(arret.chauffeur_id);
                              const projet = getProjetInfo(arret.projet_id);
                              const rowColorClass = getArretColorClass(arret.date_panne);
                              return (
                                <tr key={arret.id} className={`align-middle ${rowColorClass}`}>
                                  <td>
                                    <Badge
                                      bg="danger"
                                      className="p-2 clickable-badge"
                                      onClick={() => handleViewVoitureStats(arret.voiture_id)}
                                    >
                                      <FaCar className="me-1" />{getVoitureInfo(arret.voiture_id)}
                                    </Badge>
                                  </td>
                                  <td>
                                    {chauffeur ? (
                                      <Badge bg="secondary" className="p-2">
                                        <FaUserTie className="me-1" />{chauffeur.nom}
                                      </Badge>
                                    ) : '-'}
                                  </td>
                                  <td>
                                    <Badge bg="info" className="p-2">
                                      <FaProjectDiagram className="me-1" />{projet}
                                    </Badge>
                                  </td>
                                  <td><Badge bg="secondary">{getCodePanneInfo(arret.code_panne_id)}</Badge></td>
                                  <td>
                                    <OverlayTrigger placement="top" overlay={<Tooltip>{formatDisplayDate(arret.date_panne)}</Tooltip>}>
                                      <div>
                                        <span>{formatDateShort(arret.date_panne)}</span>
                                        {getArretAgeBadge(arret.date_panne)}
                                      </div>
                                    </OverlayTrigger>
                                  </td>
                                  <td>
                                    <Badge bg={getBadgeVariant(arret.duree_panne)}>
                                      {formatDuration(arret.duree_panne)}
                                    </Badge>
                                  </td>
                                  <td>
                                    <OverlayTrigger placement="top" overlay={<Tooltip>{arret.cause_panne || 'Non spécifiée'}</Tooltip>}>
                                      <span className="text-truncate d-inline-block" style={{ maxWidth: '150px' }}>
                                        {arret.cause_panne || '-'}
                                      </span>
                                    </OverlayTrigger>
                                  </td>
                                  {canModify() && (
                                    <td>
                                      <div className="d-flex gap-2">
                                        <Button
                                          variant="success"
                                          size="sm"
                                          onClick={() => {
                                            setVoitureAReparer({
                                              id: arret.voiture_id,
                                              matricule: getVoitureInfo(arret.voiture_id),
                                              arretId: arret.id,
                                              datePanne: arret.date_panne,
                                              codePanne: getCodePanneInfo(arret.code_panne_id),
                                              cause: arret.cause_panne
                                            });
                                            setDateReparationInput(new Date().toISOString().slice(0, 16));
                                            setIntervenantReparation(arret.intervenant || '');
                                            setSelectedChauffeur(arret.chauffeur_id);
                                            if (chauffeur) setChauffeurInput(`${chauffeur.nom} (${chauffeur.matricule})`);
                                            setShowReparerModal(true);
                                          }}
                                          title="Réparer"
                                        >
                                          <FaWrench className="me-1" /> Réparer
                                        </Button>
                                        <Button
                                          variant="outline-primary"
                                          size="sm"
                                          onClick={() => handleEditArret(arret)}
                                          title="Modifier"
                                        >
                                          <FaEdit />
                                        </Button>
                                        <Button
                                          variant="outline-danger"
                                          size="sm"
                                          onClick={() => handleDeleteArret(arret)}
                                          title="Supprimer"
                                        >
                                          <FaTrash />
                                        </Button>
                                        <Button
                                          variant="outline-info"
                                          size="sm"
                                          onClick={() => handleViewVoitureStats(arret.voiture_id)}
                                          title="Statistiques"
                                        >
                                          <FaChartLine />
                                        </Button>
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={canModify() ? "8" : "7"} className="text-center py-5">
                                <FaCheck size={48} className="text-success mb-3" />
                                <h5 className="text-muted">Aucun arrêt en cours</h5>
                                <p className="text-muted">Tous les véhicules sont en état de marche</p>
                                {canModify() && (
                                  <Button variant="primary" onClick={handleAddArret}>
                                    <FaPlus className="me-2" /> Ajouter un arrêt
                                  </Button>
                                )}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </div>
                    {filteredArrets.length > pagination.itemsPerPage && (
                      <Card.Footer className="bg-white d-flex justify-content-between align-items-center py-3">
                        <div className="text-muted small">Page {pagination.currentPage} sur {totalPages}</div>
                        <Pagination className="mb-0">
                          <Pagination.First onClick={() => handlePageChange(1)} disabled={pagination.currentPage === 1} />
                          <Pagination.Prev onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1} />
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) pageNum = i + 1;
                            else if (pagination.currentPage <= 3) pageNum = i + 1;
                            else if (pagination.currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                            else pageNum = pagination.currentPage - 2 + i;
                            return (
                              <Pagination.Item key={pageNum} active={pageNum === pagination.currentPage} onClick={() => handlePageChange(pageNum)}>
                                {pageNum}
                              </Pagination.Item>
                            );
                          })}
                          <Pagination.Next onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === totalPages} />
                          <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={pagination.currentPage === totalPages} />
                        </Pagination>
                      </Card.Footer>
                    )}
                  </Card>
                </Tab>
                
                {/* Onglet 2: Historique des réparations */}
                <Tab eventKey="archive" title={
                  <span>
                    <FaArchive className="me-2" />
                    Historique
                    <Badge bg="light" text="info" className="ms-2 rounded-pill">
                      {filteredReparationsArchivees.length}
                    </Badge>
                  </span>
                }>
                  <Row className="mt-3">
                    <Col md={12}>
                      <Card className="mb-4 shadow-sm border-0">
                        <Card.Header
                          className="bg-light d-flex justify-content-between align-items-center cursor-pointer py-3"
                          onClick={() => setHistoryFilters(prev => ({ ...prev, showFiltres: !prev.showFiltres }))}
                        >
                          <h5 className="mb-0 d-flex align-items-center">
                            <FaFilter className="me-2 text-primary" /> Filtres Historique
                            <Badge bg="secondary" className="ms-2">
                              {historyFilters.selectedVoiture || historyFilters.selectedProjet || historyFilters.selectedCodePanne || historyFilters.selectedChauffeur || historyFilters.searchQuery || historyFilters.dateRange.start ? 'Actifs' : 'Tous'}
                            </Badge>
                          </h5>
                          <Button variant="link" className="p-0 text-decoration-none">
                            {historyFilters.showFiltres ? 'Masquer' : 'Afficher'}
                          </Button>
                        </Card.Header>
                        {historyFilters.showFiltres && (
                          <Card.Body>
                            <Row className="g-3">
                              <Col md={2}>
                                <Form.Group>
                                  <Form.Label className="fw-bold">Équipement</Form.Label>
                                  <Form.Select
                                    value={historyFilters.selectedVoiture}
                                    onChange={e => setHistoryFilters(p => ({ ...p, selectedVoiture: e.target.value, currentPage: 1 }))}
                                    className="shadow-sm"
                                  >
                                    <option value="">Toutes les voitures</option>
                                    {data.voitures.map(v => (
                                      <option key={v.id} value={v.id}>{v.matricule}</option>
                                    ))}
                                  </Form.Select>
                                </Form.Group>
                              </Col>
                              <Col md={2}>
                                <Form.Group>
                                  <Form.Label className="fw-bold">Chauffeur</Form.Label>
                                  <Form.Select
                                    value={historyFilters.selectedChauffeur}
                                    onChange={e => setHistoryFilters(p => ({ ...p, selectedChauffeur: e.target.value, currentPage: 1 }))}
                                    className="shadow-sm"
                                  >
                                    <option value="">Tous les chauffeurs</option>
                                    {data.chauffeurs.map(c => (
                                      <option key={c.id} value={c.id}>{c.nom} ({c.matricule})</option>
                                    ))}
                                  </Form.Select>
                                </Form.Group>
                              </Col>
                              <Col md={2}>
                                <Form.Group>
                                  <Form.Label className="fw-bold">Projet</Form.Label>
                                  <Form.Select
                                    value={historyFilters.selectedProjet}
                                    onChange={e => setHistoryFilters(p => ({ ...p, selectedProjet: e.target.value, currentPage: 1 }))}
                                    className="shadow-sm"
                                  >
                                    <option value="">Tous les projets</option>
                                    {data.projets.map(p => (
                                      <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                  </Form.Select>
                                </Form.Group>
                              </Col>
                              <Col md={2}>
                                <Form.Group>
                                  <Form.Label className="fw-bold">Code panne</Form.Label>
                                  <Form.Select
                                    value={historyFilters.selectedCodePanne}
                                    onChange={e => setHistoryFilters(p => ({ ...p, selectedCodePanne: e.target.value, currentPage: 1 }))}
                                    className="shadow-sm"
                                  >
                                    <option value="">Tous les codes</option>
                                    {data.codesPanne.map(c => (
                                      <option key={c.id} value={c.id}>{c.code || c.name || `Code ${c.id}`}</option>
                                    ))}
                                  </Form.Select>
                                </Form.Group>
                              </Col>
                              <Col md={4}>
                                <Form.Group>
                                  <Form.Label className="fw-bold">Recherche</Form.Label>
                                  <InputGroup className="shadow-sm">
                                    <InputGroup.Text className="bg-white">
                                      <FaSearch className="text-muted" />
                                    </InputGroup.Text>
                                    <Form.Control
                                      type="text"
                                      placeholder="Cause, intervenant..."
                                      value={historyFilters.searchQuery}
                                      onChange={e => setHistoryFilters(p => ({ ...p, searchQuery: e.target.value, currentPage: 1 }))}
                                    />
                                    {historyFilters.searchQuery && (
                                      <Button variant="outline-secondary" onClick={() => setHistoryFilters(p => ({ ...p, searchQuery: '' }))}>
                                        <FaTimes />
                                      </Button>
                                    )}
                                  </InputGroup>
                                </Form.Group>
                              </Col>
                            </Row>
                            <HistoryDateRangeFilter />
                            {(historyFilters.selectedVoiture || historyFilters.selectedProjet || historyFilters.selectedCodePanne || historyFilters.selectedChauffeur || historyFilters.searchQuery || historyFilters.dateRange.start) && (
                              <div className="text-end mt-2">
                                <Button variant="outline-secondary" size="sm" onClick={resetHistoryFilters}>
                                  <FaTimes className="me-2" /> Réinitialiser les filtres
                                </Button>
                              </div>
                            )}
                          </Card.Body>
                        )}
                      </Card>
                      <Card className="shadow">
                        <Card.Header className="bg-secondary text-white d-flex justify-content-between align-items-center">
                          <h5 className="mb-0"><FaHistory className="me-2" />Archives des réparations effectuées</h5>
                          <div className="d-flex align-items-center">
                            <Badge bg="light" text="dark" className="me-2">
                              {filteredReparationsArchivees.length} réparation(s)
                            </Badge>
                            <Form.Select
                              size="sm"
                              value={historyPagination.itemsPerPage}
                              onChange={handleHistoryItemsPerPageChange}
                              style={{ width: 'auto', backgroundColor: 'white', color: 'black' }}
                            >
                              {historyPagination.itemsPerPageOptions.map(opt => (
                                <option key={opt} value={opt}>{opt} par page</option>
                              ))}
                            </Form.Select>
                          </div>
                        </Card.Header>
                        <div className="table-responsive">
                          <Table striped hover className="align-middle mb-0">
                            <thead className="bg-light">
                              <tr>
                                <th>Date réparation</th>
                                <th>Equipement</th>
                                <th>Chauffeur</th>
                                <th>Code panne</th>
                                <th>Date panne</th>
                                <th>Durée</th>
                                <th>Intervenant</th>
                                <th>Pièces</th>
                                <th>Détail des pièces</th>
                                <th>Nombre de pannes</th>
                                {canModify() && <th>Actions</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedHistory.length > 0 ? (
                                paginatedHistory.map((reparation) => (
                                  <tr key={reparation.id}>
                                    <td>
                                      <Badge bg="success">
                                        <FaCalendarAlt className="me-1" />
                                        {formatDateShort(reparation.date_reparation)}
                                      </Badge>
                                    </td>
                                    <td>
                                      <div className="d-flex align-items-center">
                                        <FaCar className="text-secondary me-2" />
                                        <strong
                                          className="clickable-link"
                                          onClick={() => handleViewVoitureArrets(reparation.voiture_id, reparation.voiture.matricule)}
                                          style={{ cursor: 'pointer' }}
                                        >
                                          {reparation.voiture.matricule}
                                        </strong>
                                      </div>
                                    </td>
                                    <td>
                                      {reparation.chauffeur ? (
                                        <Badge bg="secondary" className="p-2">
                                          <FaUserTie className="me-1" />
                                          {reparation.chauffeur.nom}
                                        </Badge>
                                      ) : '-'}
                                    </td>
                                    <td>
                                      <Badge bg="info">{reparation.codePanne}</Badge>
                                    </td>
                                    <td>
                                      <small>{formatDateShort(reparation.date_panne)}</small>
                                    </td>
                                    <td>
                                      <Badge bg="secondary">
                                        {formatDuration(reparation.duree_panne)}
                                      </Badge>
                                    </td>
                                    <td>{reparation.intervenant || '-'}</td>
                                    <td>
                                      {reparation.piecesCount > 0 ? (
                                        <Badge bg="success" className="p-2">
                                          <FaBoxes className="me-1" />
                                          {reparation.piecesCount}
                                        </Badge>
                                      ) : (
                                        <Badge bg="secondary" className="p-2">
                                          <FaBoxes className="me-1" />0
                                        </Badge>
                                      )}
                                    </td>
                                    <td>
                                      {reparation.pieces_utilisees && reparation.pieces_utilisees.length > 0 ? (
                                        <div>
                                          {reparation.pieces_utilisees.map((piece, idx) => (
                                            <Badge
                                              key={idx}
                                              bg="info"
                                              className="me-1 mb-1 p-2"
                                              style={{ fontSize: '0.8rem' }}
                                            >
                                              {piece.nom} {piece.quantite > 1 ? `(x${piece.quantite})` : ''}
                                            </Badge>
                                          ))}
                                        </div>
                                      ) : (
                                        <span className="text-muted">-</span>
                                      )}
                                    </td>
                                    <td>
                                      <Badge
                                        bg="warning"
                                        className="p-2 clickable-badge"
                                        onClick={() => handleViewVoitureArrets(reparation.voiture_id, reparation.voiture.matricule)}
                                        style={{ cursor: 'pointer' }}
                                      >
                                        {reparation.nombrePannesVoiture} panne(s)
                                      </Badge>
                                    </td>
                                    {canModify() && (
                                      <td>
                                        <div className="d-flex gap-2">
                                          <Button
                                            variant="outline-info"
                                            size="sm"
                                            onClick={() => handleViewReparationDetails(reparation.voiture, reparation)}
                                            title="Voir détails"
                                          >
                                            <FaEye />
                                          </Button>
                                          <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => handleEditArret(reparation)}
                                            title="Modifier"
                                          >
                                            <FaEdit />
                                          </Button>
                                          <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => handleDeleteArret(reparation)}
                                            title="Supprimer"
                                          >
                                            <FaTrash />
                                          </Button>
                                          <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={() => handleViewVoitureStats(reparation.voiture_id)}
                                            title="Statistiques"
                                          >
                                            <FaChartLine />
                                          </Button>
                                        </div>
                                      </td>
                                    )}
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={canModify() ? "11" : "10"} className="text-center py-4">
                                    <FaArchive size={32} className="text-muted mb-2" />
                                    <p className="text-muted">Aucune réparation dans l'historique</p>
                                    {(historyFilters.selectedVoiture || historyFilters.selectedProjet || historyFilters.selectedCodePanne || historyFilters.selectedChauffeur || historyFilters.searchQuery || historyFilters.dateRange.start) && (
                                      <Button variant="outline-secondary" size="sm" onClick={resetHistoryFilters}>
                                        <FaTimes className="me-2" /> Effacer les filtres
                                      </Button>
                                    )}
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </Table>
                        </div>
                        {filteredReparationsArchivees.length > historyPagination.itemsPerPage && (
                          <Card.Footer className="bg-white d-flex justify-content-between align-items-center py-3">
                            <div className="text-muted small">
                              Page {historyPagination.currentPage} sur {historyTotalPages}
                            </div>
                            <Pagination className="mb-0">
                              <Pagination.First
                                onClick={() => handleHistoryPageChange(1)}
                                disabled={historyPagination.currentPage === 1}
                              />
                              <Pagination.Prev
                                onClick={() => handleHistoryPageChange(historyPagination.currentPage - 1)}
                                disabled={historyPagination.currentPage === 1}
                              />
                              {Array.from({ length: Math.min(5, historyTotalPages) }, (_, i) => {
                                let pageNum;
                                if (historyTotalPages <= 5) pageNum = i + 1;
                                else if (historyPagination.currentPage <= 3) pageNum = i + 1;
                                else if (historyPagination.currentPage >= historyTotalPages - 2) pageNum = historyTotalPages - 4 + i;
                                else pageNum = historyPagination.currentPage - 2 + i;
                                return (
                                  <Pagination.Item
                                    key={pageNum}
                                    active={pageNum === historyPagination.currentPage}
                                    onClick={() => handleHistoryPageChange(pageNum)}
                                  >
                                    {pageNum}
                                  </Pagination.Item>
                                );
                              })}
                              <Pagination.Next
                                onClick={() => handleHistoryPageChange(historyPagination.currentPage + 1)}
                                disabled={historyPagination.currentPage === historyTotalPages}
                              />
                              <Pagination.Last
                                onClick={() => handleHistoryPageChange(historyTotalPages)}
                                disabled={historyPagination.currentPage === historyTotalPages}
                              />
                            </Pagination>
                          </Card.Footer>
                        )}
                      </Card>
                    </Col>
                  </Row>
                </Tab>
                
                {/* Onglet 3: Rapport Journalier */}
                <Tab eventKey="rapport-journalier" title={
                  <span>
                    <FaFileAlt className="me-2" />
                    Rapport Journalier
                  </span>
                }>
                  <RapportJournalier
                    data={data}
                    formatDateShort={formatDateShort}
                    getVoitureInfo={getVoitureInfo}
                    getCodePanneInfo={getCodePanneInfo}
                    showToast={showToast}
                  />
                </Tab>
              </Tabs>
            </>
          )}
        </Card.Body>
      </Card>
      
      {/* Modals */}
      <Modal show={showReparerModal} onHide={() => {
        setShowReparerModal(false);
        resetReparationForm();
      }} size="lg" centered>
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>
            <FaWrench className="me-2" />
            Réparer le véhicule
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {voitureAReparer && (
            <>
              <div className="text-center mb-4">
                <FaCar size={48} className="text-success mb-3" />
                <h4>{voitureAReparer.matricule}</h4>
                {voitureAReparer.codePanne && (
                  <Badge bg="secondary" className="mt-2">{voitureAReparer.codePanne}</Badge>
                )}
              </div>
              <Row className="mb-4">
                <Col md={6}>
                  <Card className="bg-light border-0">
                    <Card.Body>
                      <h6 className="text-muted mb-2">Date de panne</h6>
                      <p className="h5">{formatDisplayDate(voitureAReparer.datePanne)}</p>
                      {getArretAgeBadge(voitureAReparer.datePanne) && (
                        <div className="mt-2">
                          {getArretAgeBadge(voitureAReparer.datePanne)}
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="bg-light border-0">
                    <Card.Body>
                      <h6 className="text-muted mb-2">Durée actuelle</h6>
                      <p className="h5">
                        {formatDuration(
                          (new Date() - new Date(voitureAReparer.datePanne)) / (1000 * 60 * 60)
                        )}
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              <Form>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold">
                        <FaCalendarAlt className="me-2 text-success" />
                        Date et heure de réparation
                      </Form.Label>
                      <Form.Control
                        type="datetime-local"
                        value={dateReparationInput}
                        onChange={(e) => setDateReparationInput(e.target.value)}
                        max={new Date().toISOString().slice(0, 16)}
                        className="shadow-sm"
                      />
                      <Form.Text className="text-muted">
                        La durée de l'arrêt sera automatiquement recalculée
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold">
                        <FaUser className="me-2 text-success" />
                        Intervenant (Mécanicien)
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Nom du mécanicien"
                        value={intervenantReparation}
                        onChange={(e) => setIntervenantReparation(e.target.value)}
                        className="shadow-sm"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="fw-bold">
                        <FaUserTie className="me-2 text-primary" />
                        Chauffeur concerné
                      </Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type="text"
                          placeholder="Rechercher un chauffeur"
                          value={chauffeurInput}
                          onChange={(e) => {
                            setChauffeurInput(e.target.value);
                            setSelectedChauffeur(null);
                          }}
                          onFocus={() => {
                            const filtered = data.chauffeurs?.filter(c =>
                              c.nom.toLowerCase().includes(chauffeurInput.toLowerCase()) ||
                              c.matricule.toLowerCase().includes(chauffeurInput.toLowerCase())
                            ) || [];
                            setFilteredChauffeurs(filtered);
                            setShowChauffeurDropdown(true);
                          }}
                        />
                        {showChauffeurDropdown && filteredChauffeurs.length > 0 && (
                          <div
                            className="position-absolute top-100 start-0 end-0 bg-white border rounded shadow-lg mt-1 zindex-100"
                            style={{ maxHeight: '200px', overflowY: 'auto' }}
                          >
                            {filteredChauffeurs.map(c => (
                              <div
                                key={c.id}
                                className="dropdown-item p-2 cursor-pointer hover-bg-light"
                                onClick={() => {
                                  setChauffeurInput(`${c.nom} (${c.matricule})`);
                                  setSelectedChauffeur(c.id);
                                  setShowChauffeurDropdown(false);
                                }}
                              >
                                <strong>{c.nom}</strong>
                                <br />
                                <small className="text-muted">Matricule: {c.matricule}</small>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </Form.Group>
                  </Col>
                </Row>
                <Card className="mb-3 border-success">
                  <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">
                      <FaBoxes className="me-2" />
                      Pièces utilisées
                    </h6>
                    <Badge bg="light" text="dark">{piecesReparation.length} pièce(s)</Badge>
                  </Card.Header>
                  <Card.Body>
                    {piecesReparation.length > 0 && (
                      <div className="mb-3">
                        <Table size="sm" striped bordered>
                          <thead>
                            <tr>
                              <th>Pièce</th>
                              <th>Quantité</th>
                              <th style={{ width: '50px' }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {piecesReparation.map(piece => (
                              <tr key={piece.id}>
                                <td>{piece.nom}</td>
                                <td>{piece.quantite}</td>
                                <td>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => supprimerPiece(piece.id)}
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
                    <Row>
                      <Col md={8}>
                        <Form.Group>
                          <Form.Control
                            type="text"
                            placeholder="Nom de la pièce"
                            value={nouvellePiece.nom}
                            onChange={(e) => setNouvellePiece({ ...nouvellePiece, nom: e.target.value })}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group>
                          <Form.Control
                            type="number"
                            min="1"
                            value={nouvellePiece.quantite}
                            onChange={(e) => setNouvellePiece({ ...nouvellePiece, quantite: parseInt(e.target.value) || 1 })}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={1}>
                        <Button
                          variant="success"
                          onClick={ajouterPiece}
                          disabled={!nouvellePiece.nom.trim()}
                        >
                          <FaPlus />
                        </Button>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">
                    <FaWrench className="me-2 text-success" />
                    Travaux effectués
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Décrivez les travaux réalisés..."
                    value={travauxReparation}
                    onChange={(e) => setTravauxReparation(e.target.value)}
                    className="shadow-sm"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">
                    <FaComment className="me-2 text-success" />
                    Commentaire / Observation
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Observations complémentaires..."
                    value={commentaireReparation}
                    onChange={(e) => setCommentaireReparation(e.target.value)}
                    className="shadow-sm"
                  />
                </Form.Group>
                <Alert variant="info" className="mt-3">
                  <h6 className="alert-heading">Récapitulatif après réparation :</h6>
                  <Row>
                    <Col md={4}>
                      <small>Durée de l'arrêt</small><br />
                      <strong className="h5">
                        {formatDuration(
                          (new Date(dateReparationInput) - new Date(voitureAReparer.datePanne)) / (1000 * 60 * 60)
                        )}
                      </strong>
                    </Col>
                    <Col md={4}>
                      <small>Date de fin</small><br />
                      <strong>{format(new Date(dateReparationInput), 'dd/MM/yyyy HH:mm')}</strong>
                    </Col>
                    <Col md={4}>
                      <small>Pièces utilisées</small><br />
                      <strong>{piecesReparation.length} pièce(s)</strong>
                    </Col>
                  </Row>
                </Alert>
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowReparerModal(false);
            resetReparationForm();
          }}>
            Annuler
          </Button>
          <Button
            variant="success"
            onClick={handleReparerVoiture}
            disabled={loading}
          >
            {loading ? <Spinner size="sm" animation="border" /> : 'Confirmer la réparation'}
          </Button>
        </Modal.Footer>
      </Modal>
      
      <Modal show={modals.showReparationDetailsModal} onHide={() => setModals(p => ({ ...p, showReparationDetailsModal: false }))} size="lg" centered>
        <Modal.Header closeButton className="bg-info text-white">
          <Modal.Title>
            <FaInfoCircle className="me-2" />
            Détails de la réparation
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedReparation && (
            <>
              <Row className="mb-4">
                <Col md={6}>
                  <Card className="bg-light">
                    <Card.Body>
                      <h6>Equipement</h6>
                      <p className="fw-bold">{selectedReparation.voiture.matricule}</p>
                      <h6 className="mt-3">Chauffeur</h6>
                      <p>{selectedReparation.chauffeur ? selectedReparation.chauffeur.nom : 'Non assigné'}</p>
                      <h6 className="mt-3">Date de panne</h6>
                      <p>{formatDisplayDate(selectedReparation.arret.date_panne)}</p>
                      <h6 className="mt-3">Code panne</h6>
                      <Badge bg="secondary">{getCodePanneInfo(selectedReparation.arret.code_panne_id)}</Badge>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="bg-light">
                    <Card.Body>
                      <h6>Date réparation</h6>
                      <p>{formatDisplayDate(selectedReparation.arret.date_reparation)}</p>
                      <h6 className="mt-3">Durée</h6>
                      <p>{formatDuration(selectedReparation.arret.duree_panne)}</p>
                      <h6 className="mt-3">Intervenant</h6>
                      <p>{selectedReparation.arret.intervenant || 'Non spécifié'}</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              {selectedReparation.arret.cause_panne && (
                <Card className="mb-3">
                  <Card.Header className="bg-light">Cause de la panne</Card.Header>
                  <Card.Body>
                    {selectedReparation.arret.cause_panne}
                  </Card.Body>
                </Card>
              )}
              {selectedReparation.arret.travaux_effectues && (
                <Card className="mb-3">
                  <Card.Header className="bg-light">Travaux effectués</Card.Header>
                  <Card.Body>
                    {selectedReparation.arret.travaux_effectues}
                  </Card.Body>
                </Card>
              )}
              {selectedReparation.arret.observation && (
                <Card className="mb-3">
                  <Card.Header className="bg-light">Observations</Card.Header>
                  <Card.Body>
                    {selectedReparation.arret.observation}
                  </Card.Body>
                </Card>
              )}
              <h6 className="mb-3">Pièces utilisées</h6>
              {selectedReparation.pieces.length > 0 ? (
                <Table striped size="sm">
                  <thead>
                    <tr>
                      <th>Pièce</th>
                      <th>Quantité</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReparation.pieces.map((piece, idx) => (
                      <tr key={idx}>
                        <td>{piece.nom}</td>
                        <td>{piece.quantite}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted">Aucune pièce utilisée pour cette réparation</p>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModals(p => ({ ...p, showReparationDetailsModal: false }))}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>
      
      <Modal show={showVoitureArretsModal} onHide={() => setShowVoitureArretsModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <FaCar className="me-2" />
            Historique des arrêts - {selectedVoitureForArrets?.matricule}
            <Badge bg="light" text="dark" className="ms-2">
              {selectedVoitureForArrets?.nombrePannes} panne(s)
            </Badge>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {voitureArretsList.length > 0 ? (
            <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <Table striped hover size="sm">
                <thead className="bg-light sticky-top">
                  <tr>
                    <th>Date panne</th>
                    <th>Code panne</th>
                    <th>Cause</th>
                    <th>Durée</th>
                    <th>Statut</th>
                    <th>Pièces</th>
                  </tr>
                </thead>
                <tbody>
                  {voitureArretsList.map((arret, index) => {
                    const piecesListe = arret.pieces_utilisees && Array.isArray(arret.pieces_utilisees)
                      ? arret.pieces_utilisees.map(p => `${p.nom} (x${p.quantite})`).join(', ')
                      : '-';
                    const rowColorClass = getArretColorClass(arret.date_panne);
                    return (
                      <tr key={arret.id || index} className={rowColorClass}>
                        <td>
                          {formatDisplayDate(arret.date_panne)}
                          {getArretAgeBadge(arret.date_panne)}
                         </td>
                         <td><Badge bg="secondary">{getCodePanneInfo(arret.code_panne_id)}</Badge></td>
                         <td>{arret.cause_panne || '-'}</td>
                         <td><Badge bg={getBadgeVariant(arret.duree_panne)}>{formatDuration(arret.duree_panne)}</Badge></td>
                         <td>
                          <Badge bg={arret.date_reparation ? 'success' : 'warning'}>
                            {arret.date_reparation ? 'Réparé' : 'En cours'}
                          </Badge>
                         </td>
                         <td>
                          <small className="text-muted">{piecesListe !== '-' ? piecesListe : '-'}</small>
                         </td>
                       </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4">
              <FaCar size={48} className="text-muted mb-3" />
              <p className="text-muted">Aucun arrêt enregistré pour ce véhicule</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowVoitureArretsModal(false)}>
            Fermer
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              if (selectedVoitureForArrets) {
                handleViewVoitureStats(selectedVoitureForArrets.id);
                setShowVoitureArretsModal(false);
              }
            }}
          >
            <FaChartLine className="me-2" />
            Voir statistiques détaillées
          </Button>
        </Modal.Footer>
      </Modal>
      
      <Modal show={modals.showVoitureStatsModal} onHide={() => setModals(p => ({ ...p, showVoitureStatsModal: false }))} size="lg" centered>
        <Modal.Header closeButton className="bg-info text-white">
          <Modal.Title>
            <FaCar className="me-2" />
            Statistiques - {voitureStats.voiture?.matricule}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {voitureStats.voiture && (
            <>
              <Row className="mb-4">
                <Col md={6}>
                  <Card className="bg-light">
                    <Card.Body>
                      <h6 className="text-muted">Total des pannes</h6>
                      <h3>{voitureStats.totalPannes}</h3>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="bg-light">
                    <Card.Body>
                      <h6 className="text-muted">Durée totale d'arrêt</h6>
                      <h3>{formatDuration(voitureStats.totalDuree)}</h3>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              <Row className="mb-4">
                <Col md={12}>
                  <Card className="bg-light">
                    <Card.Body>
                      <h6 className="text-muted">Total pièces consommées</h6>
                      <h3>{voitureStats.totalPieces}</h3>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              {voitureStats.piecesConsommees.length > 0 && (
                <Card className="mb-4">
                  <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">Pièces consommées</h6>
                    <Button
                      variant="outline-success"
                      size="sm"
                      onClick={() => exportVoitureStatsToExcel(voitureStats)}
                    >
                      <FaFileExcel className="me-2" />
                      Exporter
                    </Button>
                  </Card.Header>
                  <Card.Body>
                    <Table size="sm" striped>
                      <thead>
                        <tr>
                          <th>Pièce</th>
                          <th>Quantité</th>
                         </tr>
                      </thead>
                      <tbody>
                        {voitureStats.piecesConsommees.map((piece, idx) => (
                          <tr key={idx}>
                            <td>{piece.nom}</td>
                            <td>
                              <Badge bg="success">{piece.quantite}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              )}
              {voitureStats.topPannes.length > 0 && (
                <Card className="mb-4">
                  <Card.Header className="bg-light">Top des pannes</Card.Header>
                  <Card.Body>
                    {voitureStats.topPannes.map(([code, count], index) => (
                      <div key={code} className="d-flex align-items-center mb-2">
                        <Badge bg="primary" className="me-2">#{index + 1}</Badge>
                        <span className="flex-grow-1">{code}</span>
                        <Badge bg="secondary">{count} fois</Badge>
                      </div>
                    ))}
                  </Card.Body>
                </Card>
              )}
              <Tabs defaultActiveKey="liste" className="mb-3">
                <Tab eventKey="liste" title="Historique des pannes">
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <ListGroup>
                      {voitureStats.arrets.map(arret => (
                        <ListGroup.Item key={arret.id} className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{formatDisplayDate(arret.date_panne)}</strong>
                            <br />
                            <small className="text-muted">
                              {getCodePanneInfo(arret.code_panne_id)} - {arret.cause_panne || 'Cause non spécifiée'}
                            </small>
                            {arret.pieces_utilisees && arret.pieces_utilisees.length > 0 && (
                              <div className="mt-1">
                                <small className="text-success">
                                  <FaBoxes className="me-1" />
                                  Pièces: {arret.pieces_utilisees.map(p => `${p.nom} (x${p.quantite})`).join(', ')}
                                </small>
                              </div>
                            )}
                          </div>
                          <Badge bg={getBadgeVariant(arret.duree_panne)}>
                            {formatDuration(arret.duree_panne)}
                          </Badge>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </div>
                </Tab>
                <Tab eventKey="graphique" title="Graphique">
                  <div style={{ height: '300px' }}>
                    <Bar
                      data={{
                        labels: voitureStats.arrets.map(a => formatDateShort(a.date_panne)),
                        datasets: [{
                          label: 'Durée (heures)',
                          data: voitureStats.arrets.map(a => a.duree_panne || 0),
                          backgroundColor: 'rgba(54, 162, 235, 0.5)',
                          borderColor: 'rgba(54, 162, 235, 1)',
                          borderWidth: 1
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'Durée (heures)'
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </Tab>
              </Tabs>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModals(p => ({ ...p, showVoitureStatsModal: false }))}>
            Fermer
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              if (voitureStats.voiture) {
                handleViewVoitureArrets(voitureStats.voiture.id, voitureStats.voiture.matricule);
                setModals(p => ({ ...p, showVoitureStatsModal: false }));
              }
            }}
          >
            <FaHistory className="me-2" />
            Voir tous les arrêts
          </Button>
        </Modal.Footer>
      </Modal>
      
      <Modal
        show={modals.showAddModal || modals.showEditModal}
        onHide={() => !loading && setModals(p => ({ ...p, showAddModal: false, showEditModal: false }))}
        size="lg"
        backdrop="static"
        centered
      >
        <Modal.Header closeButton className={modals.showAddModal ? "bg-primary text-white" : "bg-warning text-white"}>
          <Modal.Title>
            {modals.showAddModal ? <FaPlus className="me-2" /> : <FaEdit className="me-2" />}
            {modals.showAddModal ? 'Nouvel arrêt' : 'Modifier l\'arrêt'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit(data => submitArret(data, modals.showEditModal))}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Voiture <span className="text-danger">*</span></Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type="text"
                      placeholder="Tapez ou sélectionnez un matricule"
                      value={voitureInput}
                      onChange={(e) => {
                        setVoitureInput(e.target.value);
                        setValue("voiture_id", "");
                        setSelectedVoiture(null);
                      }}
                      onFocus={() => setShowVoitureDropdown(true)}
                      isInvalid={!!errors.voiture_id}
                      className="shadow-sm"
                      readOnly={modals.showEditModal}
                    />
                    {showVoitureDropdown && filteredVoitures.length > 0 && !modals.showEditModal && (
                      <div
                        className="position-absolute top-100 start-0 end-0 bg-white border rounded shadow-lg mt-1 zindex-100"
                        style={{ maxHeight: '200px', overflowY: 'auto' }}
                      >
                        {filteredVoitures.map(v => (
                          <div
                            key={v.id}
                            className="dropdown-item p-2 cursor-pointer hover-bg-light"
                            onClick={() => {
                              setVoitureInput(v.matricule);
                              setValue("voiture_id", v.id);
                              setSelectedVoiture(v.id);
                              setShowVoitureDropdown(false);
                            }}
                          >
                            {v.matricule}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Form.Control
                    type="hidden"
                    {...register("voiture_id", { required: "Veuillez sélectionner ou créer une voiture" })}
                  />
                  {voitureInput && !selectedVoiture && !modals.showEditModal && canModify() && (
                    <div className="mt-2">
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={handleCreateVoiture}
                        disabled={loading || !voitureInput}
                        className="shadow-sm"
                      >
                        <FaPlus /> Créer "{voitureInput}"
                      </Button>
                    </div>
                  )}
                  <Form.Control.Feedback type="invalid">
                    {errors.voiture_id?.message}
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Chauffeur</Form.Label>
                  <Form.Select {...register("chauffeur_id")} className="shadow-sm">
                    <option value="">Sélectionner un chauffeur...</option>
                    {data.chauffeurs.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nom} ({c.matricule})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Projet</Form.Label>
                  <Form.Select {...register("projet_id")} className="shadow-sm">
                    <option value="">Sélectionner un projet...</option>
                    {data.projets.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Code panne</Form.Label>
                  <Form.Select {...register("code_panne_id")} className="shadow-sm">
                    <option value="">Sélectionner un code...</option>
                    {data.codesPanne.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.name || ''}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Date et heure de la panne <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="datetime-local"
                    {...register("date_panne", { required: "Ce champ est obligatoire" })}
                    isInvalid={!!errors.date_panne}
                    className="shadow-sm"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Date et heure de réparation</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    {...register("date_reparation")}
                    className="shadow-sm"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Durée de panne (heures)</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="number"
                      step="0.1"
                      {...register("duree_panne")}
                      readOnly
                      className="bg-light"
                    />
                    <InputGroup.Text>h</InputGroup.Text>
                  </InputGroup>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Intervenant</Form.Label>
                  <Form.Control
                    type="text"
                    {...register("intervenant")}
                    className="shadow-sm"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Cause de la panne</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                {...register("cause_panne")}
                className="shadow-sm"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Travaux effectués</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                {...register("travaux_effectues")}
                className="shadow-sm"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Observation</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                {...register("observation")}
                className="shadow-sm"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModals(p => ({ ...p, showAddModal: false, showEditModal: false }))}>
            Annuler
          </Button>
          <Button
            variant={modals.showAddModal ? "primary" : "warning"}
            onClick={handleSubmit(data => submitArret(data, modals.showEditModal))}
            disabled={loading}
          >
            {loading ? <Spinner size="sm" animation="border" /> : (modals.showAddModal ? 'Enregistrer' : 'Mettre à jour')}
          </Button>
        </Modal.Footer>
      </Modal>
      
      <Modal show={modals.showDeleteModal} onHide={() => setModals(p => ({ ...p, showDeleteModal: false }))} centered>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>
            <FaExclamationTriangle className="me-2" />
            Confirmer la suppression
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Êtes-vous sûr de vouloir supprimer cet arrêt ?</p>
          {arretToDelete && (
            <div className="bg-light p-3 rounded">
              <p className="mb-1">
                <strong>Voiture:</strong> {getVoitureInfo(arretToDelete.voiture_id)}
              </p>
              <p className="mb-1">
                <strong>Date:</strong> {formatDisplayDate(arretToDelete.date_panne)}
                {getArretAgeBadge(arretToDelete.date_panne)}
              </p>
              <p className="mb-1">
                <strong>Durée:</strong> {formatDuration(arretToDelete.duree_panne)}
              </p>
              {arretToDelete.cause_panne && (
                <p className="mb-0">
                  <strong>Cause:</strong> {arretToDelete.cause_panne}
                </p>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModals(p => ({ ...p, showDeleteModal: false }))}>
            Annuler
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={loading}>
            {loading ? <Spinner size="sm" animation="border" /> : 'Supprimer'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ArretEquipement;