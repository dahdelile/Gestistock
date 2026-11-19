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
  Badge,
  InputGroup,
  ProgressBar,
  Tooltip,
  OverlayTrigger
} from "react-bootstrap";
import {
  FaList, FaPlus, FaEdit, FaTrash, 
  FaFileExcel, FaSave, FaTimes, 
  FaCheckCircle, FaExclamationCircle,
  FaPrint, FaSearch, FaEye, FaTools,
  FaFilter, FaCalendarAlt, FaProjectDiagram,
  FaSync, FaExclamationTriangle, FaDownload,
  FaDatabase, FaFilePdf,
  FaFileWord, FaFileImage, FaFileAlt,
  FaFileArchive, FaFileCode, FaFileCsv,
  FaChartBar, FaFileExport, 
  FaClipboardList, FaClock, FaBoxOpen,
  FaInfoCircle, FaFire, FaCloudUploadAlt,
  FaExternalLinkAlt
} from 'react-icons/fa';

// ==================== CONFIGURATION ====================
const API_BASE_URL = 'http://localhost:8000/api';
const STORAGE_URL = 'http://localhost:8000/storage';

// ==================== STYLES CSS ====================
const styles = `
  .rapport-card { transition: all 0.3s ease; border-radius: 12px; margin-bottom: 20px; }
  .rapport-card:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.1); }
  .btn-action { margin: 0 2px; border-radius: 8px; padding: 8px 12px; transition: all 0.2s; }
  .btn-action:hover { transform: scale(1.05); }
  .file-badge { font-size: 0.8rem; padding: 6px 12px; border-radius: 20px; background-color: #f8f9fa; border: 1px solid #dee2e6; }
  .file-icon { font-size: 1.2rem; margin-right: 8px; }
  .status-badge { padding: 6px 12px; border-radius: 20px; font-weight: 500; }
  .excel-preview { background-color: #f8f9fa; border-radius: 12px; padding: 20px; margin-top: 15px; border: 1px solid #e9ecef; }
  .progress-custom { height: 8px; border-radius: 4px; margin-top: 10px; }
  .filter-section { background-color: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #e9ecef; }
  .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
  .editeur-rapport { max-height: 70vh; overflow-y: auto; padding-right: 10px; }
  .editeur-rapport::-webkit-scrollbar { width: 8px; }
  .editeur-rapport::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
  .editeur-rapport::-webkit-scrollbar-thumb { background: #888; border-radius: 10px; }
  .editeur-rapport::-webkit-scrollbar-thumb:hover { background: #555; }
  .document-actions .btn { margin: 0 2px; }
  .file-size { font-size: 0.8rem; color: #6c757d; }
  .clickable-row { cursor: pointer; }
  .clickable-row:hover { background-color: #f8f9fa; }
  @media print { .no-print { display: none !important; } }
`;

// ==================== UTILITAIRES ====================
const FileUtils = {
  basename: (path) => {
    if (!path) return 'document';
    if (path instanceof File) return path.name;
    const parts = path.split('/');
    return parts[parts.length - 1];
  },

  getExtension: (filename) => {
    if (!filename) return '';
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  },

  getFileIcon: (filename) => {
    if (!filename) return <FaFileAlt className="text-secondary" />;
    const ext = FileUtils.getExtension(filename);
    const icons = {
      pdf: <FaFilePdf className="text-danger file-icon" />,
      doc: <FaFileWord className="text-primary file-icon" />,
      docx: <FaFileWord className="text-primary file-icon" />,
      xls: <FaFileExcel className="text-success file-icon" />,
      xlsx: <FaFileExcel className="text-success file-icon" />,
      csv: <FaFileCsv className="text-success file-icon" />,
      jpg: <FaFileImage className="text-info file-icon" />,
      jpeg: <FaFileImage className="text-info file-icon" />,
      png: <FaFileImage className="text-info file-icon" />,
      gif: <FaFileImage className="text-info file-icon" />
    };
    return icons[ext] || <FaFileAlt className="text-secondary file-icon" />;
  },

  formatFileSize: (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  isExcel: (filename) => {
    const ext = FileUtils.getExtension(filename);
    return ['xls', 'xlsx', 'csv'].includes(ext);
  },

  ensureExcelExtension: (filename) => {
    if (!filename) return 'rapport.xlsx';
    const ext = FileUtils.getExtension(filename);
    if (!['xlsx', 'xls'].includes(ext)) {
      return `${filename.split('.')[0]}.xlsx`;
    }
    return filename;
  },

  validateExcelFile: (file) => {
    if (!file) return false;
    const ext = FileUtils.getExtension(file.name);
    const validExts = ['xlsx', 'xls'];
    if (!validExts.includes(ext)) return false;
    if (file.size > 20 * 1024 * 1024) return false;
    if (file.size === 0) return false;
    return true;
  }
};

const DateUtils = {
  formatDate: (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return dateString; }
  },

  formatDateShort: (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR');
    } catch { return dateString; }
  },

  formatDateTime: (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return dateString; }
  },

  getRelativeDay: (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
    if (date.toDateString() === yesterday.toDateString()) return "Hier";
    return DateUtils.formatDateShort(dateString);
  }
};

// ==================== SERVICES API ====================
class ApiService {
  static async fetchWithError(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...options.headers
        },
        credentials: 'omit',
        ...options
      });
      
      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { success: false, message: responseText };
      }
      
      if (!response.ok) {
        console.error('API Error Response:', { status: response.status, data });
        throw {
          status: response.status,
          statusText: response.statusText,
          data,
          message: data.message || data.error || response.statusText
        };
      }
      
      return data;
    } catch (error) {
      console.error('API Fetch Error:', { url, error: error.message });
      throw error;
    }
  }

  static async getRapports(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.projet_id) queryParams.append('projet_id', params.projet_id);
      if (params.type_rapport) queryParams.append('type_rapport', params.type_rapport);
      if (params.date_creation) queryParams.append('date_creation', params.date_creation);
      if (params.search) queryParams.append('search', params.search);
      if (params.page) queryParams.append('page', params.page);
      if (params.per_page) queryParams.append('per_page', params.per_page);
      
      const queryString = queryParams.toString();
      const url = `${API_BASE_URL}/rapports-dm${queryString ? '?' + queryString : ''}`;
      
      const response = await this.fetchWithError(url);
      
      if (response?.success && Array.isArray(response.data)) {
        return { data: response.data, last_page: 1, total: response.data.length };
      }
      
      if (response?.success && response?.data?.data && Array.isArray(response.data.data)) {
        return {
          data: response.data.data,
          last_page: response.data.last_page || 1,
          total: response.data.total || response.data.data.length
        };
      }
      
      if (response?.data && Array.isArray(response.data)) {
        return { data: response.data, last_page: 1, total: response.data.length };
      }
      
      if (response?.data?.data && Array.isArray(response.data.data)) {
        return {
          data: response.data.data,
          last_page: response.data.last_page || 1,
          total: response.data.total || response.data.data.length
        };
      }
      
      if (Array.isArray(response)) {
        return { data: response, last_page: 1, total: response.length };
      }
      
      return { data: [], last_page: 1, total: 0 };
      
    } catch (error) {
      console.error('❌ Erreur getRapports:', error);
      return { data: [], last_page: 1, total: 0 };
    }
  }

  static async getProjets() {
    try {
      const response = await this.fetchWithError(`${API_BASE_URL}/projets`);
      if (response?.success && Array.isArray(response.data)) return response.data;
      if (Array.isArray(response)) return response;
      if (response?.data && Array.isArray(response.data)) return response.data;
      return [];
    } catch (error) {
      console.error('❌ Erreur getProjets:', error);
      return [
        { id: 1, name: 'Maintenance Site A' },
        { id: 2, name: 'Entretien Parc Machines' },
        { id: 3, name: 'Infrastructure BTP' }
      ];
    }
  }

  static async getStatistiques() {
    try {
      const response = await this.fetchWithError(`${API_BASE_URL}/rapports-dm/statistiques`);
      if (response?.success && response?.data) {
        return response;
      }
      return { 
        success: true, 
        data: { total: 0, par_type: [], par_projet: [], recents: [] }
      };
    } catch (error) {
      console.error('❌ Erreur getStatistiques:', error);
      return { 
        success: true, 
        data: { total: 0, par_type: [], par_projet: [], recents: [] }
      };
    }
  }

  static async createRapport(formData) {
    try {
      return await this.fetchWithError(`${API_BASE_URL}/rapports-dm`, {
        method: 'POST',
        body: formData
      });
    } catch (error) {
      console.error('❌ Erreur createRapport:', error);
      throw error;
    }
  }

  static async updateRapport(id, formData) {
    try {
      return await this.fetchWithError(`${API_BASE_URL}/rapports-dm/${id}`, {
        method: 'POST',
        body: formData,
        headers: { 'X-HTTP-Method-Override': 'PUT' }
      });
    } catch (error) {
      console.error('❌ Erreur updateRapport:', error);
      throw error;
    }
  }

  static async deleteRapport(id) {
    try {
      return await this.fetchWithError(`${API_BASE_URL}/rapports-dm/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('❌ Erreur deleteRapport:', error);
      throw error;
    }
  }
}

// ==================== COMPOSANT DE VISUALISATION EXCEL ====================
const RapportQuotidienViewer = ({ rapport, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      if (rapport?.commentaire) {
        const parsed = typeof rapport.commentaire === 'string' 
          ? JSON.parse(rapport.commentaire) 
          : rapport.commentaire;
        setData(parsed);
      }
    } catch (error) {
      console.error('Erreur parsing JSON:', error);
    } finally {
      setLoading(false);
    }
  }, [rapport]);

  const handleDownload = () => {
    if (rapport?.fichier) {
      const link = document.createElement('a');
      link.href = rapport.fichier.startsWith('http') 
        ? rapport.fichier 
        : `http://localhost:8000${rapport.fichier}`;
      link.download = data?.filename || 'rapport_quotidien.xlsx';
      link.click();
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Chargement du rapport...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <Alert variant="warning" className="m-4">
        <FaExclamationTriangle className="me-2" />
        Impossible de charger les données du rapport
      </Alert>
    );
  }

  const disponibilite = data.total_equipements 
    ? ((data.total_equipements - (data.total_arret || 0)) / data.total_equipements * 100).toFixed(2)
    : 0;

  return (
    <div className="excel-preview">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">
          <FaFileExcel className="text-success me-2" />
          Rapport Quotidien de Maintenance
        </h4>
        <div>
          <Button variant="outline-success" onClick={handleDownload} className="me-2">
            <FaDownload className="me-2" /> Télécharger Excel
          </Button>
          <Button variant="outline-secondary" onClick={onClose}>
            <FaTimes />
          </Button>
        </div>
      </div>

      <Row className="mb-4">
        <Col md={4}>
          <Card className="bg-light">
            <Card.Body>
              <h6 className="text-muted mb-2">Date du rapport</h6>
              <h5>{DateUtils.formatDate(data.date)}</h5>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="bg-light">
            <Card.Body>
              <h6 className="text-muted mb-2">Disponibilité</h6>
              <h5 className="text-success">{disponibilite}%</h5>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="bg-light">
            <Card.Body>
              <h6 className="text-muted mb-2">Fichier</h6>
              <h6 className="text-truncate">{data.filename || 'Non spécifié'}</h6>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h6 className="mb-0">📊 Équipements</h6>
            </Card.Header>
            <Card.Body>
              <Table size="sm" bordered>
                <thead>
                  <tr><th>Type</th><th>Parc</th><th>Arrêt</th><th>Taux</th></tr>
                </thead>
                <tbody>
                  {data.equipements?.map((eq, idx) => (
                    <tr key={idx}>
                      <td>{eq.type}</td>
                      <td>{eq.parc}</td>
                      <td>{eq.arret}</td>
                      <td><Badge bg={parseFloat(eq.taux) >= 80 ? 'success' : 'warning'}>{eq.taux}</Badge></td>
                    </tr>
                  ))}
                  <tr className="table-secondary">
                    <td><strong>TOTAL</strong></td>
                    <td><strong>{data.total_equipements || 0}</strong></td>
                    <td><strong>{data.total_arret || 0}</strong></td>
                    <td></td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <Card.Header className="bg-warning text-dark">
              <h6 className="mb-0">⚠️ Équipements à l'arrêt</h6>
            </Card.Header>
            <Card.Body>
              {data.equipementsArret?.length > 0 ? (
                <Table size="sm" bordered>
                  <thead>
                    <tr>
                      <th>N°ATTM</th>
                      <th>Type</th>
                      <th>Site</th>
                      <th>Durée</th>
                      <th>Nb arrêt</th>
                      <th>Code</th>
                      <th>Cause</th>
                      <th>Observation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.equipementsArret.map((eq, idx) => (
                      <tr key={idx}>
                        <td>{eq.numeroAttm || '-'}</td>
                        <td>{eq.typeEquipement || '-'}</td>
                        <td>{eq.site || '-'}</td>
                        <td>{eq.duree || '-'}</td>
                        <td>{eq.nombreArret || 1}</td>
                        <td>{eq.codePanne || '-'}</td>
                        <td>{eq.cause || '-'}</td>
                        <td>{eq.observation || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : <p className="text-muted text-center mb-0">Aucun équipement à l'arrêt</p>}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header className="bg-success text-white">
              <h6 className="mb-0">✅ Travaux réalisés</h6>
            </Card.Header>
            <Card.Body>
              {data.travauxRealises?.length > 0 ? (
                <Table size="sm" bordered>
                  <thead>
                    <tr>
                      <th>N°ATTM</th>
                      <th>Type</th>
                      <th>Site</th>
                      <th>Durée</th>
                      <th>Code</th>
                      <th>Intervenants</th>
                      <th>Cause</th>
                      <th>Travaux</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.travauxRealises.map((t, idx) => (
                      <tr key={idx}>
                        <td>{t.numeroAttm || '-'}</td>
                        <td>{t.typeTravail || '-'}</td>
                        <td>{t.site || '-'}</td>
                        <td>{t.duree || '-'}</td>
                        <td>{t.codePanne || '-'}</td>
                        <td>{t.intervenants || '-'}</td>
                        <td>{t.causeArret || '-'}</td>
                        <td>{t.travauxEffectues || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : <p className="text-muted text-center mb-0">Aucun travail réalisé</p>}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <Card.Header className="bg-danger text-white">
              <h6 className="mb-0">🔥 Points chauds</h6>
            </Card.Header>
            <Card.Body>
              {data.pointsChauds?.length > 0 ? (
                <ul className="list-group">
                  {data.pointsChauds.map((point, idx) => (
                    <li key={idx} className="list-group-item">{point}</li>
                  ))}
                </ul>
              ) : <p className="text-muted text-center mb-0">Aucun point chaud signalé</p>}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <div className="text-muted text-end">
        <small>Généré le {DateUtils.formatDateTime(data.generated_at)}</small>
      </div>
    </div>
  );
};

// ==================== COMPOSANT ÉDITEUR EXCEL ====================
const EditeurRapportQuotidien = ({ formData, setFormData, setSuccessMessage, setErrorMessage }) => {
  const [equipements, setEquipements] = useState([
    { id: 1, type: 'Matériel Roulant', parc: 0, arret: 0, taux: '100%' },
    { id: 2, type: 'Engins', parc: 0, arret: 0, taux: '100%' },
    { id: 3, type: 'Petit matériel', parc: 0, arret: 0, taux: '100%' }
  ]);

  const [equipementsArret, setEquipementsArret] = useState([]);
  const [travauxRealises, setTravauxRealises] = useState([]);
  const [pointsChauds, setPointsChauds] = useState([]);
  const [excelGenerated, setExcelGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeSection, setActiveSection] = useState('equipements');

  const totalEquipements = () => equipements.reduce((sum, eq) => sum + (parseInt(eq.parc) || 0), 0);
  const totalArret = () => equipements.reduce((sum, eq) => sum + (parseInt(eq.arret) || 0), 0);
  const tauxDisponibilite = () => {
    const total = totalEquipements();
    return total === 0 ? 0 : ((total - totalArret()) / total * 100).toFixed(2);
  };

  const updateEquipement = (index, field, value) => {
    const newEquipements = [...equipements];
    newEquipements[index][field] = value;
    if (field === 'parc' || field === 'arret') {
      const parc = parseInt(newEquipements[index].parc) || 0;
      const arret = parseInt(newEquipements[index].arret) || 0;
      newEquipements[index].taux = parc > 0 ? `${((parc - arret) / parc * 100).toFixed(2)}%` : '0%';
    }
    setEquipements(newEquipements);
    setExcelGenerated(false);
  };

  const addEquipementArret = () => setEquipementsArret([...equipementsArret, { 
    id: Date.now(), 
    numeroAttm: '', 
    typeEquipement: 'MEC',
    site: '',
    duree: '',
    nombreArret: 1,
    codePanne: 'M',
    cause: '',
    observation: ''
  }]);

  const removeEquipementArret = (id) => { 
    setEquipementsArret(equipementsArret.filter(eq => eq.id !== id)); 
    setExcelGenerated(false); 
  };

  const updateEquipementArret = (id, field, value) => { 
    setEquipementsArret(equipementsArret.map(eq => eq.id === id ? { ...eq, [field]: value } : eq)); 
    setExcelGenerated(false); 
  };

  const addTravail = () => setTravauxRealises([...travauxRealises, { 
    id: Date.now(), 
    numeroAttm: '',
    typeTravail: 'PREV',
    site: '',
    duree: '',
    codePanne: 'M',
    intervenants: '',
    causeArret: '',
    travauxEffectues: ''
  }]);

  const removeTravail = (id) => { 
    setTravauxRealises(travauxRealises.filter(t => t.id !== id)); 
    setExcelGenerated(false); 
  };

  const updateTravail = (id, field, value) => { 
    setTravauxRealises(travauxRealises.map(t => t.id === id ? { ...t, [field]: value } : t)); 
    setExcelGenerated(false); 
  };

  const addPointChaud = () => setPointsChauds([...pointsChauds, '']);
  const updatePointChaud = (index, value) => { 
    const newPoints = [...pointsChauds]; 
    newPoints[index] = value; 
    setPointsChauds(newPoints); 
    setExcelGenerated(false); 
  };
  const removePointChaud = (index) => { 
    setPointsChauds(pointsChauds.filter((_, i) => i !== index)); 
    setExcelGenerated(false); 
  };

  const generateExcelFile = () => {
    try {
      setGenerating(true);
      
      const excelData = [
        ['RAPPORT QUOTIDIEN DES TRAVAUX DE MAINTENANCE'],
        [`Date: ${formData.date_creation}`],
        [],
        ['1. DISPONIBILITÉ DES ÉQUIPEMENTS'],
        ['Type Équipement', 'Nombre du parc', "Nombre à l'arrêt", 'Taux de marche (%)'],
        ...equipements.map(eq => [eq.type, parseInt(eq.parc) || 0, parseInt(eq.arret) || 0, parseFloat(eq.taux) || 100]),
        ['TOTAL', totalEquipements(), totalArret(), parseFloat(tauxDisponibilite())],
        [],
        ['2. VENTILATION DES ARRÊTS DU JOUR'],
        ['N°ATTM', 'Type', 'Site', 'Durée', "Nombre d'arrêt", 'Code Panne', 'Cause d\'arrêt', 'Observation'],
        ...equipementsArret.map(eq => [
          eq.numeroAttm || '', 
          eq.typeEquipement || 'MEC',
          eq.site || '', 
          eq.duree || '', 
          eq.nombreArret || 1,
          eq.codePanne || 'M', 
          eq.cause || '', 
          eq.observation || ''
        ]),
        [],
        ['3. TRAVAUX RÉALISÉS DU JOUR'],
        ['N°ATTM', 'Type', 'Site', 'Durée', 'Code panne', 'Intervenants', 'Cause d\'arrêt', 'Travaux effectués'],
        ...travauxRealises.map(t => [
          t.numeroAttm || '',
          t.typeTravail || 'PREV',
          t.site || '',
          t.duree || '',
          t.codePanne || 'M',
          t.intervenants || '',
          t.causeArret || '',
          t.travauxEffectues || ''
        ]),
        [],
        ['4. POINTS CHAUDS ET BESOINS'],
        ...pointsChauds.filter(p => p.trim()).map(p => [p, '', '', '', '', '', '', '']),
        [],
        ['Généré le', new Date().toLocaleString('fr-FR'), '', '', '', '', '', ''],
        ['Système de Gestion des Rapports de Maintenance', '', '', '', '', '', '', '']
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      ws['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 25 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(wb, ws, "Rapport Quotidien");
      
      const dateFormatted = formData.date_creation.replace(/-/g, '');
      const timestamp = Date.now();
      const filename = `Rapport_Quotidien_${dateFormatted}_${timestamp}.xlsx`;
      
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const file = new File([blob], filename, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', lastModified: Date.now() });
      
      return { file, filename, wb, blob, excelBuffer };
    } catch (error) {
      console.error('❌ Erreur génération Excel:', error);
      throw error;
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateExcel = async () => {
    try {
      const { file, filename } = generateExcelFile();
      if (!FileUtils.validateExcelFile(file)) throw new Error('Fichier Excel invalide');
      
      const rapportData = {
        type: 'quotidien_excel',
        date: formData.date_creation,
        equipements: equipements,
        equipementsArret: equipementsArret.filter(eq => eq.numeroAttm || eq.cause || eq.observation),
        travauxRealises: travauxRealises.filter(t => t.numeroAttm || t.travauxEffectues),
        pointsChauds: pointsChauds.filter(p => p.trim()),
        excel_generated: true,
        generated_at: new Date().toISOString(),
        filename: filename,
        total_equipements: totalEquipements(),
        total_arret: totalArret(),
        taux_disponibilite: tauxDisponibilite()
      };
      
      setFormData({
        ...formData,
        commentaire: JSON.stringify(rapportData),
        fichier: file
      });
      
      setExcelGenerated(true);
      setSuccessMessage('✅ Rapport Excel généré avec succès !');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('❌ Erreur:', error);
      setErrorMessage(`❌ Erreur: ${error.message}`);
    }
  };

  const handleDownloadNow = () => {
    try {
      const { wb, filename } = generateExcelFile();
      XLSX.writeFile(wb, filename);
      setSuccessMessage(`📥 Téléchargement: ${filename}`);
    } catch (error) {
      setErrorMessage(`❌ Erreur: ${error.message}`);
    }
  };

  return (
    <div className="editeur-rapport">
      <style>{styles}</style>
      
      <Alert variant="info" className="mb-4">
        <div className="d-flex align-items-center">
          <FaFileExcel size={24} className="me-3 text-success" />
          <div>
            <h6 className="mb-1">Éditeur de Rapport Quotidien Excel</h6>
            <small className="text-muted">Remplissez les sections ci-dessous pour générer un rapport professionnel</small>
          </div>
        </div>
      </Alert>

      <Card className="mb-4 bg-light">
        <Card.Body>
          <Row>
            <Col md={3}><div className="text-center"><h6 className="text-muted">Total équipements</h6><h3 className="text-primary mb-0">{totalEquipements()}</h3></div></Col>
            <Col md={3}><div className="text-center"><h6 className="text-muted">À l'arrêt</h6><h3 className="text-danger mb-0">{totalArret()}</h3></div></Col>
            <Col md={3}><div className="text-center"><h6 className="text-muted">Disponibilité</h6><h3 className="text-success mb-0">{tauxDisponibilite()}%</h3></div></Col>
            <Col md={3}><div className="text-center"><h6 className="text-muted">Date</h6><h6 className="mb-0">{DateUtils.formatDateShort(formData.date_creation)}</h6></div></Col>
          </Row>
        </Card.Body>
      </Card>

      <div className="mb-3">
        <ButtonGroup className="w-100">
          <Button variant={activeSection === 'equipements' ? 'primary' : 'outline-primary'} onClick={() => setActiveSection('equipements')}><FaTools className="me-2" />1. Équipements</Button>
          <Button variant={activeSection === 'arrets' ? 'warning' : 'outline-warning'} onClick={() => setActiveSection('arrets')}><FaExclamationTriangle className="me-2" />2. Arrêts</Button>
          <Button variant={activeSection === 'travaux' ? 'success' : 'outline-success'} onClick={() => setActiveSection('travaux')}><FaCheckCircle className="me-2" />3. Travaux</Button>
          <Button variant={activeSection === 'points' ? 'danger' : 'outline-danger'} onClick={() => setActiveSection('points')}><FaFire className="me-2" />4. Points chauds</Button>
        </ButtonGroup>
      </div>

      {activeSection === 'equipements' && (
        <Card className="mb-4">
          <Card.Header className="bg-primary text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0"><FaTools className="me-2" />Disponibilité des équipements</h6>
              <Badge bg="light" text="dark">Total: {totalEquipements()}</Badge>
            </div>
          </Card.Header>
          <Card.Body>
            <Table striped bordered hover size="sm">
              <thead className="bg-light">
                <tr><th>Type d'équipement</th><th>Nombre du parc</th><th>Nombre à l'arrêt</th><th>Taux de marche</th></tr>
              </thead>
              <tbody>
                {equipements.map((eq, index) => (
                  <tr key={eq.id}>
                    <td><Form.Control size="sm" value={eq.type} onChange={(e) => updateEquipement(index, 'type', e.target.value)} disabled={index < 3} className="bg-light" /></td>
                    <td><Form.Control size="sm" type="number" min="0" value={eq.parc} onChange={(e) => updateEquipement(index, 'parc', e.target.value)} /></td>
                    <td><Form.Control size="sm" type="number" min="0" max={eq.parc} value={eq.arret} onChange={(e) => updateEquipement(index, 'arret', e.target.value)} /></td>
                    <td><Badge bg={parseFloat(eq.taux) >= 80 ? 'success' : 'warning'} style={{ fontSize: '0.9rem', padding: '6px 12px' }}>{eq.taux}</Badge></td>
                  </tr>
                ))}
                <tr className="table-secondary">
                  <td><strong>TOTAL</strong></td>
                  <td><strong>{totalEquipements()}</strong></td>
                  <td><strong>{totalArret()}</strong></td>
                  <td><Badge bg="info">{tauxDisponibilite()}%</Badge></td>
                </tr>
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {activeSection === 'arrets' && (
        <Card className="mb-4">
          <Card.Header className="bg-warning text-dark">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0"><FaExclamationTriangle className="me-2" />Ventilation des arrêts du jour</h6>
              <Button variant="dark" size="sm" onClick={addEquipementArret}>
                <FaPlus className="me-2" />Ajouter
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            {equipementsArret.length === 0 ? (
              <div className="text-center py-4">
                <FaBoxOpen size={40} className="text-muted mb-3" />
                <p className="text-muted mb-0">Aucun arrêt enregistré</p>
                <Button variant="outline-warning" size="sm" onClick={addEquipementArret} className="mt-3">
                  <FaPlus className="me-2" />Ajouter un arrêt
                </Button>
              </div>
            ) : (
              <div className="table-responsive">
                <Table striped bordered hover size="sm">
                  <thead className="bg-light">
                    <tr>
                      <th>N°ATTM</th>
                      <th>Type</th>
                      <th>Site</th>
                      <th>Durée</th>
                      <th>Nombre d'arrêt</th>
                      <th>Code Panne</th>
                      <th>Cause d'arrêt</th>
                      <th>Observation</th>
                      <th style={{ width: '50px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipementsArret.map((eq) => (
                      <tr key={eq.id}>
                        <td>
                          <Form.Control 
                            size="sm" 
                            value={eq.numeroAttm || ''} 
                            onChange={(e) => updateEquipementArret(eq.id, 'numeroAttm', e.target.value)} 
                            placeholder="Ex: ATTM-001"
                          />
                        </td>
                        <td>
                          <Form.Select 
                            size="sm" 
                            value={eq.typeEquipement || 'MEC'} 
                            onChange={(e) => updateEquipementArret(eq.id, 'typeEquipement', e.target.value)}
                          >
                            <option value="MEC">Mécanique</option>
                            <option value="ELE">Électrique</option>
                            <option value="HYD">Hydraulique</option>
                            <option value="PNE">Pneumatique</option>
                            <option value="AUT">Autre</option>
                          </Form.Select>
                        </td>
                        <td>
                          <Form.Control 
                            size="sm" 
                            value={eq.site || ''} 
                            onChange={(e) => updateEquipementArret(eq.id, 'site', e.target.value)} 
                            placeholder="Site"
                          />
                        </td>
                        <td>
                          <Form.Control 
                            size="sm" 
                            type="text" 
                            value={eq.duree || ''} 
                            onChange={(e) => updateEquipementArret(eq.id, 'duree', e.target.value)} 
                            placeholder="HH:MM"
                          />
                        </td>
                        <td>
                          <Form.Control 
                            size="sm" 
                            type="number" 
                            min="1" 
                            value={eq.nombreArret || 1} 
                            onChange={(e) => updateEquipementArret(eq.id, 'nombreArret', e.target.value)} 
                            placeholder="1"
                          />
                        </td>
                        <td>
                          <Form.Select 
                            size="sm" 
                            value={eq.codePanne || 'M'} 
                            onChange={(e) => updateEquipementArret(eq.id, 'codePanne', e.target.value)}
                          >
                            <option value="M">M - Mécanique</option>
                            <option value="E">E - Électrique</option>
                            <option value="H">H - Hydraulique</option>
                            <option value="P">P - Pneumatique</option>
                            <option value="A">A - Autre</option>
                          </Form.Select>
                        </td>
                        <td>
                          <Form.Control 
                            size="sm" 
                            value={eq.cause || ''} 
                            onChange={(e) => updateEquipementArret(eq.id, 'cause', e.target.value)} 
                            placeholder="Cause de l'arrêt"
                          />
                        </td>
                        <td>
                          <Form.Control 
                            size="sm" 
                            value={eq.observation || ''} 
                            onChange={(e) => updateEquipementArret(eq.id, 'observation', e.target.value)} 
                            placeholder="Observation"
                          />
                        </td>
                        <td className="text-center">
                          <Button variant="outline-danger" size="sm" onClick={() => removeEquipementArret(eq.id)}>
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
      )}

      {activeSection === 'travaux' && (
        <Card className="mb-4">
          <Card.Header className="bg-success text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0"><FaCheckCircle className="me-2" />Travaux réalisés du jour</h6>
              <Button variant="light" size="sm" onClick={addTravail}>
                <FaPlus className="me-2" />Ajouter
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            {travauxRealises.length === 0 ? (
              <div className="text-center py-4">
                <FaClipboardList size={40} className="text-muted mb-3" />
                <p className="text-muted mb-0">Aucun travail réalisé aujourd'hui</p>
                <Button variant="outline-success" size="sm" onClick={addTravail} className="mt-3">
                  <FaPlus className="me-2" />Ajouter un travail
                </Button>
              </div>
            ) : (
              <div className="table-responsive">
                <Table striped bordered hover size="sm">
                  <thead className="bg-light">
                    <tr>
                      <th>N°ATTM</th>
                      <th>Type</th>
                      <th>Site</th>
                      <th>Durée</th>
                      <th>Code panne</th>
                      <th>Intervenants</th>
                      <th>Cause d'arrêt</th>
                      <th>Travaux effectués</th>
                      <th style={{ width: '50px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {travauxRealises.map((travail) => (
                      <tr key={travail.id}>
                        <td>
                          <Form.Control 
                            size="sm" 
                            value={travail.numeroAttm || ''} 
                            onChange={(e) => updateTravail(travail.id, 'numeroAttm', e.target.value)} 
                            placeholder="Ex: ATTM-001"
                          />
                        </td>
                        <td>
                          <Form.Select 
                            size="sm" 
                            value={travail.typeTravail || 'PREV'} 
                            onChange={(e) => updateTravail(travail.id, 'typeTravail', e.target.value)}
                          >
                            <option value="PREV">Préventif</option>
                            <option value="CURR">Curatif</option>
                            <option value="INST">Installation</option>
                            <option value="INSP">Inspection</option>
                            <option value="AUT">Autre</option>
                          </Form.Select>
                        </td>
                        <td>
                          <Form.Control 
                            size="sm" 
                            value={travail.site || ''} 
                            onChange={(e) => updateTravail(travail.id, 'site', e.target.value)} 
                            placeholder="Site"
                          />
                        </td>
                        <td>
                          <Form.Control 
                            size="sm" 
                            type="text" 
                            value={travail.duree || ''} 
                            onChange={(e) => updateTravail(travail.id, 'duree', e.target.value)} 
                            placeholder="HH:MM"
                          />
                        </td>
                        <td>
                          <Form.Select 
                            size="sm" 
                            value={travail.codePanne || 'M'} 
                            onChange={(e) => updateTravail(travail.id, 'codePanne', e.target.value)}
                          >
                            <option value="M">M - Méc</option>
                            <option value="E">E - Élec</option>
                            <option value="H">H - Hyd</option>
                            <option value="P">P - Pn</option>
                               <option value="P">S - sus</option>
                                <option value="P">En - Ent</option>
                            <option value="A">A - Autre</option>
                          </Form.Select>
                        </td>
                        <td>
                          <Form.Control 
                            size="sm" 
                            value={travail.intervenants || ''} 
                            onChange={(e) => updateTravail(travail.id, 'intervenants', e.target.value)} 
                            placeholder="Noms des intervenants"
                          />
                        </td>
                        <td>
                          <Form.Control 
                            size="sm" 
                            value={travail.causeArret || ''} 
                            onChange={(e) => updateTravail(travail.id, 'causeArret', e.target.value)} 
                            placeholder="Cause de l'arrêt"
                          />
                        </td>
                        <td>
                          <Form.Control 
                            size="sm" 
                            value={travail.travauxEffectues || ''} 
                            onChange={(e) => updateTravail(travail.id, 'travauxEffectues', e.target.value)} 
                            placeholder="Description des travaux"
                          />
                        </td>
                        <td className="text-center">
                          <Button variant="outline-danger" size="sm" onClick={() => removeTravail(travail.id)}>
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
      )}

      {activeSection === 'points' && (
        <Card className="mb-4">
          <Card.Header className="bg-danger text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0"><FaFire className="me-2" />Points chauds et besoins</h6>
              <Button variant="light" size="sm" onClick={addPointChaud}><FaPlus className="me-2" />Ajouter</Button>
            </div>
          </Card.Header>
          <Card.Body>
            {pointsChauds.length === 0 ? (
              <div className="text-center py-4">
                <FaFire size={40} className="text-muted mb-3" />
                <p className="text-muted mb-0">Aucun point chaud signalé</p>
                <Button variant="outline-danger" size="sm" onClick={addPointChaud} className="mt-3"><FaPlus className="me-2" />Ajouter un point chaud</Button>
              </div>
            ) : (
              <div className="list-group">
                {pointsChauds.map((point, index) => (
                  <div key={index} className="list-group-item">
                    <Row>
                      <Col><Form.Control size="sm" value={point} onChange={(e) => updatePointChaud(index, e.target.value)} placeholder="Description du point chaud ou besoin" /></Col>
                      <Col xs="auto"><Button variant="outline-danger" size="sm" onClick={() => removePointChaud(index)}><FaTrash /></Button></Col>
                    </Row>
                  </div>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      <Alert variant={excelGenerated ? 'success' : 'warning'} className="mt-3">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            {excelGenerated ? <FaCheckCircle className="me-3" size={24} /> : <FaExclamationTriangle className="me-3" size={24} />}
            <div>
              <strong className="d-block">{excelGenerated ? 'Rapport Excel généré' : 'Génération requise'}</strong>
              <small>{excelGenerated ? 'Le rapport est prêt à être sauvegardé' : 'Veuillez générer le fichier Excel'}</small>
            </div>
          </div>
          {excelGenerated && formData.fichier && (
            <Badge bg="light" text="dark" className="p-3">
              <FaFileExcel className="me-2 text-success" />
              {formData.fichier.name}
              <small className="text-muted ms-2">({FileUtils.formatFileSize(formData.fichier.size)})</small>
            </Badge>
          )}
        </div>
      </Alert>

      <div className="d-flex justify-content-between mt-4 pt-3 border-top">
        <div>
          <Button variant="outline-secondary" onClick={handleDownloadNow} className="me-2" disabled={generating}>
            <FaDownload className="me-2" /> Télécharger Excel
          </Button>
          <Button variant={excelGenerated ? 'success' : 'primary'} onClick={handleGenerateExcel} disabled={generating}>
            {generating ? <><Spinner size="sm" className="me-2" /> Génération...</> : <><FaFileExcel className="me-2" /> {excelGenerated ? 'Regénérer Excel' : 'Générer Excel'}</>}
          </Button>
        </div>
        <div className="text-end">
          <small className="text-muted d-block">
            {excelGenerated ? <span className="text-success">✓ Prêt pour sauvegarde</span> : <span className="text-warning">⚠ En attente de génération</span>}
          </small>
        </div>
      </div>
    </div>
  );
};

// ==================== COMPOSANT PRINCIPAL ====================
const GestionRapportDM = () => {
  // États
  const [rapports, setRapports] = useState([]);
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedRapport, setSelectedRapport] = useState(null);
  const [showViewer, setShowViewer] = useState(false);
  
  // États pour le téléchargement
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(null);
  
  // Statistiques
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);

  // Filtres
  const [filters, setFilters] = useState({
    projet_id: '',
    type_rapport: '',
    search: '',
    date_creation: ''
  });

  if (!Array.isArray(rapports)) {
    console.warn("⚠️ rapports n'est pas un tableau, réinitialisation");
    setRapports([]);
  }

  // Types de rapports
  const reportTypes = [
    { value: 'quotidien_excel', label: 'Rapport Quotidien Excel', icon: <FaFileExcel />, color: 'success' },
    { value: 'travaux_quo', label: 'Travaux Quotidien', icon: <FaTools />, color: 'primary' },
    { value: 'entretien', label: 'Entretien', icon: <FaTools />, color: 'warning' },
    { value: 'autre', label: 'Autre', icon: <FaFileAlt />, color: 'secondary' }
  ];

  // Formulaire
  const [formData, setFormData] = useState({
    id: null,
    projet_id: '',
    type_rapport: 'quotidien_excel',
    date_creation: new Date().toISOString().split('T')[0],
    fichier: null,
    commentaire: ''
  });

  // ================ CHARGEMENT DES DONNÉES ================
  const loadProjets = async () => {
    try {
      const data = await ApiService.getProjets();
      setProjets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('❌ Erreur chargement projets:', error);
      setProjets([
        { id: 1, name: 'Maintenance Site A' },
        { id: 2, name: 'Entretien Parc Machines' },
        { id: 3, name: 'Infrastructure BTP' }
      ]);
    }
  };

  const loadRapports = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        per_page: itemsPerPage,
        ...filters
      };
      
      const response = await ApiService.getRapports(params);
      console.log("📥 Réponse API rapports:", response);
      
      let rapportsData = [];
      
      if (response?.data && Array.isArray(response.data)) {
        rapportsData = response.data;
      }
      
      setRapports(rapportsData);
      setTotalPages(response?.last_page || 1);
      setErrorMessage('');
      
    } catch (error) {
      console.error('❌ Erreur chargement rapports:', error);
      setErrorMessage('Erreur de chargement des rapports');
      setRapports([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await ApiService.getStatistiques();
      if (response?.success && response?.data) {
        setStats(response.data);
      } else {
        setStats({ total: 0, par_type: [], par_projet: [], recents: [] });
      }
    } catch (error) {
      console.error('❌ Erreur chargement stats:', error);
      setStats({ total: 0, par_type: [], par_projet: [], recents: [] });
    }
  };

  // ================ FONCTIONS DE TÉLÉCHARGEMENT ================
  const handleDownloadDocument = async (docId, fileUrl = null, fileName = null) => {
    try {
      setDownloadingId(docId);
      setDownloadProgress(0);
      
      console.log("📥 Téléchargement rapport #" + docId);
      
      const forceDownloadUrl = `http://localhost:8000/force-download/${docId}`;
      console.log("🔍 URL de téléchargement:", forceDownloadUrl);
      
      window.open(forceDownloadUrl, '_blank');
      
      setSuccessMessage('✅ Téléchargement lancé');
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error("❌ Erreur:", error);
      setErrorMessage("Échec du téléchargement");
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setDownloadingId(null);
      setDownloadProgress(null);
    }
  };

  const handleDownloadDirect = async (docId, fileUrl) => {
    try {
      setDownloadingId(docId);
      
      let directUrl = fileUrl;
      
      if (directUrl && !directUrl.startsWith('http')) {
        if (directUrl.startsWith('/storage/')) {
          directUrl = `http://localhost:8000${directUrl}`;
        } else if (directUrl.startsWith('storage/')) {
          directUrl = `http://localhost:8000/${directUrl}`;
        } else {
          directUrl = `http://localhost:8000/storage/${directUrl}`;
        }
      }
      
      console.log("📥 Téléchargement direct:", directUrl);
      window.open(directUrl, '_blank');
      setSuccessMessage('✅ Téléchargement lancé');
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error("❌ Erreur:", error);
      setErrorMessage("Échec du téléchargement");
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleViewDocument = async (docId, fileUrl = null) => {
    try {
      console.log("👁️ Visualisation rapport #" + docId);
      
      const viewUrl = `http://localhost:8000/api/rapports-dm/${docId}/view`;
      window.open(viewUrl, '_blank');
      
    } catch (error) {
      console.error("❌ Erreur:", error);
      handleDownloadDocument(docId, fileUrl);
    }
  };

  // ================ GESTION DU FORMULAIRE ================
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = ValidationUtils.validateForm(formData, editMode);
    if (!validation.isValid) {
      setFormError(validation.errors.join('\n'));
      return;
    }
    
    setFormLoading(true);
    setFormError('');

    try {
      const formDataToSend = new FormData();
      
      formDataToSend.append('projet_id', formData.projet_id);
      formDataToSend.append('type_rapport', formData.type_rapport);
      formDataToSend.append('date_creation', formData.date_creation);
      formDataToSend.append('commentaire', formData.commentaire || '');
      
      if (formData.fichier instanceof File) {
        formDataToSend.append('fichier', formData.fichier);
      } else if (editMode && typeof formData.fichier === 'string') {
        formDataToSend.append('fichier', formData.fichier);
      }

      let response;
      if (editMode) {
        response = await ApiService.updateRapport(formData.id, formDataToSend);
      } else {
        response = await ApiService.createRapport(formDataToSend);
      }

      setSuccessMessage(`✅ Rapport ${editMode ? 'modifié' : 'ajouté'} avec succès`);
      loadRapports();
      handleCloseModal();
    } catch (error) {
      console.error('❌ Erreur:', error);
      setFormError(error.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (rapport) => {
    if (!rapport) return;
    setFormData({
      id: rapport.id || null,
      projet_id: rapport.projet?.id || rapport.projet_id || '',
      type_rapport: rapport.type_rapport || 'quotidien_excel',
      date_creation: rapport.date_creation?.split('T')[0] || new Date().toISOString().split('T')[0],
      fichier: rapport.fichier || null,
      commentaire: rapport.commentaire || ''
    });
    setModalTitle('Modifier le rapport');
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!id) return;
    if (!window.confirm('Supprimer ce rapport définitivement ?')) return;
    try {
      await ApiService.deleteRapport(id);
      setSuccessMessage('✅ Rapport supprimé');
      loadRapports();
    } catch (error) {
      setErrorMessage(`❌ ${error.message}`);
    }
  };

  const handleView = (rapport) => {
    if (!rapport) return;
    
    if (rapport.type_rapport === 'quotidien_excel' && rapport.commentaire) {
      try {
        const parsed = typeof rapport.commentaire === 'string' 
          ? JSON.parse(rapport.commentaire) 
          : rapport.commentaire;
        setSelectedRapport({ ...rapport, commentaire: parsed });
        setShowViewer(true);
      } catch {
        handleViewDocument(rapport.id, rapport.fichier);
      }
    } else if (rapport.fichier) {
      handleViewDocument(rapport.id, rapport.fichier);
    }
  };

  const resetForm = () => {
    setFormData({
      id: null,
      projet_id: '',
      type_rapport: 'quotidien_excel',
      date_creation: new Date().toISOString().split('T')[0],
      fichier: null,
      commentaire: ''
    });
    setFormError('');
  };

  const handleCloseModal = () => {
    resetForm();
    setShowModal(false);
    setEditMode(false);
  };

  // ================ FILTRES ================
  const resetFilters = () => {
    setFilters({ projet_id: '', type_rapport: '', search: '', date_creation: '' });
    setCurrentPage(1);
  };

  // ================ EXPORT ================
  const exportToExcel = () => {
    try {
      if (!Array.isArray(rapports) || rapports.length === 0) {
        setErrorMessage('Aucun rapport à exporter');
        return;
      }
      
      const exportData = rapports.map(r => ({
        ID: r?.id || '',
        Projet: r?.projet?.name || '-',
        Type: reportTypes.find(t => t.value === r?.type_rapport)?.label || r?.type_rapport || '-',
        Date: DateUtils.formatDateShort(r?.date_creation),
        'Dernière modif': DateUtils.formatDateTime(r?.updated_at),
        Commentaire: typeof r?.commentaire === 'string' 
          ? r.commentaire.substring(0, 100) 
          : JSON.stringify(r?.commentaire || '').substring(0, 100),
        Fichier: r?.fichier ? FileUtils.basename(r.fichier) : '-'
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Rapports');
      ws['!cols'] = [{ wch: 8 }, { wch: 30 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 50 }, { wch: 30 }];
      XLSX.writeFile(wb, `rapports_${new Date().toISOString().split('T')[0]}.xlsx`);
      setSuccessMessage('✅ Export réussi');
    } catch (error) {
      console.error('Erreur export:', error);
      setErrorMessage(`❌ Erreur export: ${error.message}`);
    }
  };

  // ================ PAGINATION ================
  const getPageNumbers = () => {
    const pages = [];
    const delta = 2;
    const left = currentPage - delta;
    const right = currentPage + delta;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i <= right)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  // ================ FONCTIONS D'AFFICHAGE ================
  const renderCommentaire = (commentaire) => {
    if (!commentaire) return '-';
    try {
      if (typeof commentaire === 'string') {
        if (commentaire.startsWith('{') || commentaire.startsWith('[')) {
          JSON.parse(commentaire);
          return '[Données structurées]';
        }
        return commentaire.length > 50 ? commentaire.substring(0, 50) + '...' : commentaire;
      }
      if (typeof commentaire === 'object') {
        return '[Données structurées]';
      }
      return String(commentaire).substring(0, 50);
    } catch {
      return commentaire.length > 50 ? commentaire.substring(0, 50) + '...' : commentaire;
    }
  };

  const renderTooltip = (commentaire) => {
    if (!commentaire) return 'Aucun commentaire';
    try {
      if (typeof commentaire === 'string') {
        if (commentaire.startsWith('{') || commentaire.startsWith('[')) {
          try {
            JSON.parse(commentaire);
            return 'Données du rapport Excel (cliquez sur "Visualiser" pour voir)';
          } catch {
            return commentaire.length > 200 ? commentaire.substring(0, 200) + '...' : commentaire;
          }
        }
        return commentaire.length > 200 ? commentaire.substring(0, 200) + '...' : commentaire;
      }
      if (typeof commentaire === 'object') {
        return 'Données du rapport Excel (cliquez sur "Visualiser" pour voir)';
      }
      return String(commentaire).substring(0, 200);
    } catch {
      return String(commentaire).substring(0, 200);
    }
  };

  // ================ BOUTON DE TÉLÉCHARGEMENT ================
  const DownloadButton = ({ rapport }) => {
    const isDownloading = downloadingId === rapport?.id;
    
    const handleClick = () => {
      if (!rapport?.id) return;
      
      const fileName = rapport?.fichier 
        ? FileUtils.ensureExcelExtension(FileUtils.basename(rapport.fichier))
        : `rapport_${rapport.id}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      handleDownloadDocument(rapport.id, rapport?.fichier, fileName);
    };
    
    return (
      <Button
        variant="outline-success"
        size="sm"
        className="btn-action"
        onClick={handleClick}
        disabled={isDownloading || !rapport?.id}
        title="Télécharger le rapport"
      >
        {isDownloading ? (
          <Spinner animation="border" size="sm" />
        ) : (
          <FaDownload />
        )}
      </Button>
    );
  };

  // ================ EFFETS ================
  useEffect(() => {
    loadProjets();
    loadStats();
  }, []);

  useEffect(() => {
    loadRapports();
  }, [currentPage, filters]);

  // ================ RENDU ================
  return (
    <>
      <style>{styles}</style>
      
      <Container fluid className="py-4 bg-light">
        {/* Messages */}
        {errorMessage && (
          <Alert variant="danger" onClose={() => setErrorMessage('')} dismissible className="mb-4">
            <div className="d-flex align-items-center">
              <FaExclamationTriangle className="me-3" size={20} />
              <div><strong>Erreur</strong><p className="mb-0">{errorMessage}</p></div>
            </div>
          </Alert>
        )}

        {successMessage && (
          <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible className="mb-4">
            <div className="d-flex align-items-center">
              <FaCheckCircle className="me-3" size={20} />
              <div><strong>Succès</strong><p className="mb-0">{successMessage}</p></div>
            </div>
          </Alert>
        )}

        {/* En-tête */}
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="display-6 fw-bold mb-2">
                  <FaTools className="me-3 text-primary" />
                  Gestion des Rapports de Maintenance
                </h1>
                <p className="text-muted mb-0">
                  <FaDatabase className="me-2" />
                  {Array.isArray(rapports) ? rapports.length : 0} rapports • Dernière mise à jour: {DateUtils.formatDateTime(new Date())}
                </p>
              </div>
              <div>
                <Button variant="outline-primary" className="me-2" onClick={() => { loadRapports(); loadStats(); }}>
                  <FaSync className="me-2" /> Rafraîchir
                </Button>
                <Button variant="primary" onClick={() => { resetForm(); setModalTitle('Nouveau rapport'); setEditMode(false); setShowModal(true); }}>
                  <FaPlus className="me-2" /> Nouveau rapport
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        {/* Filtres */}
        <Card className="mb-4 shadow-sm no-print">
          <Card.Body className="filter-section">
            <Row>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-semibold"><FaProjectDiagram className="me-2" />Projet</Form.Label>
                  <Form.Select value={filters.projet_id || ''} onChange={(e) => { setFilters({...filters, projet_id: e.target.value}); setCurrentPage(1); }}>
                    <option value="">Tous les projets</option>
                    {Array.isArray(projets) && projets.map(p => (
                      <option key={p?.id || Math.random()} value={p?.id || ''}>{p?.name || 'Sans nom'}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={2}>
                <Form.Group>
                  <Form.Label className="fw-semibold"><FaFilter className="me-2" />Type</Form.Label>
                  <Form.Select value={filters.type_rapport || ''} onChange={(e) => { setFilters({...filters, type_rapport: e.target.value}); setCurrentPage(1); }}>
                    <option value="">Tous les types</option>
                    {reportTypes.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-semibold"><FaCalendarAlt className="me-2" />Date</Form.Label>
                  <Form.Control 
                    type="date" 
                    value={filters.date_creation || ''} 
                    onChange={(e) => { setFilters({...filters, date_creation: e.target.value}); setCurrentPage(1); }} 
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold"><FaSearch className="me-2" />Recherche</Form.Label>
                  <InputGroup>
                    <Form.Control 
                      type="text" 
                      placeholder="Rechercher par projet, commentaire..." 
                      value={filters.search || ''} 
                      onChange={(e) => { setFilters({...filters, search: e.target.value}); setCurrentPage(1); }} 
                    />
                    <Button variant="outline-secondary" onClick={resetFilters} title="Réinitialiser"><FaSync /></Button>
                    <Button variant="outline-success" onClick={exportToExcel} title="Exporter Excel"><FaFileExcel /></Button>
                    <Button variant="outline-info" onClick={() => setShowStats(!showStats)} title="Statistiques"><FaChartBar /></Button>
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Statistiques */}
        {showStats && stats && (
          <Row className="mb-4">
            <Col md={3}>
              <Card className="stat-card">
                <Card.Body>
                  <h6 className="text-white-50">Total rapports</h6>
                  <h2 className="text-white mb-0">{stats?.total || 0}</h2>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="bg-success text-white">
                <Card.Body>
                  <h6 className="text-white-50">Rapports Excel</h6>
                  <h2 className="text-white mb-0">
                    {Array.isArray(stats?.par_type) 
                      ? (stats.par_type.find(t => t?.type_rapport === 'quotidien_excel')?.count || 0)
                      : 0}
                  </h2>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="bg-info text-white">
                <Card.Body>
                  <h6 className="text-white-50">Projets actifs</h6>
                  <h2 className="text-white mb-0">
                    {Array.isArray(stats?.par_projet) ? stats.par_projet.length : 0}
                  </h2>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="bg-warning text-dark">
                <Card.Body>
                  <h6 className="text-dark-50">Dernier rapport</h6>
                  <h6 className="mb-0">
                    {stats?.recents && Array.isArray(stats.recents) && stats.recents.length > 0
                      ? DateUtils.getRelativeDay(stats.recents[0]?.date_creation)
                      : 'Aucun'}
                  </h6>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Tableau des rapports */}
        <Card className="shadow-sm">
          <Card.Header className="bg-info py-3">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">
                <FaList className="me-2 text-primary" />
                Liste des rapports
                <Badge bg="primary" className="ms-2">
                  {Array.isArray(rapports) ? rapports.length : 0}
                </Badge>
              </h5>
              <div className="no-print">
                <Button variant="outline-secondary" size="sm" onClick={() => window.print()} className="me-2">
                  <FaPrint className="me-2" /> Imprimer
                </Button>
              </div>
            </div>
          </Card.Header>
          
          <Card.Body>
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" size="lg" />
                <p className="mt-3 text-muted">Chargement des rapports...</p>
              </div>
            ) : !Array.isArray(rapports) || rapports.length === 0 ? (
              <div className="text-center py-5">
                <FaBoxOpen size={60} className="text-muted mb-4" />
                <h5 className="text-muted mb-3">Aucun rapport trouvé</h5>
                <p className="text-muted mb-4">
                  Modifiez vos filtres ou créez un nouveau rapport
                </p>
                <Button variant="primary" onClick={() => { resetForm(); setModalTitle('Nouveau rapport'); setEditMode(false); setShowModal(true); }}>
                  <FaPlus className="me-2" /> Créer un rapport
                </Button>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <Table hover className="align-middle">
                    <thead className="bg-light">
                      <tr>
                        <th>Projet</th>
                        <th>Type</th>
                        <th>Date</th>
                        <th>Fichier</th>
                        <th>Commentaire</th>
                        <th className="text-center no-print" style={{ width: '250px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(rapports) && rapports.map(rapport => {
                        if (!rapport) return null;
                        const typeInfo = reportTypes.find(t => t.value === rapport?.type_rapport) || reportTypes[3];
                        const fileName = rapport?.fichier ? FileUtils.basename(rapport.fichier) : null;
                        
                        return (
                          <tr key={rapport?.id || Math.random()}>
                            <td>
                              <div className="fw-bold">{rapport?.projet?.name || '-'}</div>
                            
                            </td>
                            <td>
                              <Badge bg={typeInfo.color} className="p-2">
                                {typeInfo.icon && React.cloneElement(typeInfo.icon, { className: 'me-1' })}
                                {typeInfo.label}
                              </Badge>
                            </td>
                            <td>
                              <div>{DateUtils.formatDateShort(rapport?.date_creation)}</div>
                              <small className="text-muted">{DateUtils.getRelativeDay(rapport?.date_creation)}</small>
                            </td>
                            <td>
                              {rapport?.fichier ? (
                                <div className="d-flex align-items-center">
                                  {FileUtils.getFileIcon(rapport.fichier)}
                                  <div className="ms-2">
                                    <div className="small fw-semibold">
                                      {fileName && fileName.length > 20 
                                        ? fileName.substring(0, 20) + '...' 
                                        : fileName}
                                    </div>
                                  </div>
                                </div>
                              ) : <Badge bg="secondary">Aucun fichier</Badge>}
                            </td>
                            <td>
                              {rapport?.commentaire ? (
                                <OverlayTrigger
                                  placement="top"
                                  overlay={<Tooltip>{renderTooltip(rapport.commentaire)}</Tooltip>}
                                >
                                  <span className="text-truncate d-block" style={{ maxWidth: '200px' }}>
                                    {renderCommentaire(rapport.commentaire)}
                                  </span>
                                </OverlayTrigger>
                              ) : '-'}
                            </td>
                            <td className="no-print">
                              <div className="d-flex gap-1 justify-content-center">
                                <Button
                                  variant="outline-info"
                                  size="sm"
                                  className="btn-action"
                                  onClick={() => handleView(rapport)}
                                  title="Visualiser"
                                  disabled={!rapport?.fichier && rapport?.type_rapport !== 'quotidien_excel'}
                                >
                                  <FaEye />
                                </Button>

                                {rapport?.fichier && (
                                  <DownloadButton rapport={rapport} />
                                )}

                                {downloadingId === rapport?.id && downloadProgress !== null && (
                                  <div className="position-relative" style={{ width: '60px' }}>
                                    <ProgressBar 
                                      now={downloadProgress} 
                                      size="sm" 
                                      className="progress-custom"
                                      variant="success"
                                      label={`${downloadProgress}%`}
                                    />
                                  </div>
                                )}

                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  className="btn-action"
                                  onClick={() => handleEdit(rapport)}
                                  title="Modifier"
                                >
                                  <FaEdit />
                                </Button>

                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  className="btn-action"
                                  onClick={() => handleDelete(rapport?.id)}
                                  title="Supprimer"
                                >
                                  <FaTrash />
                                </Button>
                              </div>

                              <div className="mt-2 text-center">
                                {rapport?.updated_at && new Date(rapport.updated_at) > new Date(Date.now() - 86400000) && (
                                  <Badge bg="light" text="dark" className="me-1">
                                    <FaClock className="me-1" /> Récent
                                  </Badge>
                                )}
                                {rapport?.type_rapport === 'quotidien_excel' && (
                                  <Badge bg="success" className="me-1">
                                  
                                  </Badge>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="d-flex justify-content-between align-items-center mt-4 no-print">
                    <div className="text-muted">
                      Page {currentPage} sur {totalPages} • {Array.isArray(rapports) ? rapports.length : 0} rapports
                    </div>
                    <Pagination>
                      <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                      <Pagination.Prev onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} />
                      {getPageNumbers().map((page, idx) => (
                        page === '...' ? (
                          <Pagination.Ellipsis key={`ellipsis-${idx}`} />
                        ) : (
                          <Pagination.Item key={page} active={page === currentPage} onClick={() => setCurrentPage(page)}>
                            {page}
                          </Pagination.Item>
                        )
                      ))}
                      <Pagination.Next onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} />
                      <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </Card.Body>
        </Card>

        {/* Modal - Visualisation Rapport Excel */}
        <Modal show={showViewer} onHide={() => setShowViewer(false)} size="xl" centered className="no-print">
          <Modal.Body className="p-0">
            {selectedRapport && (
              <RapportQuotidienViewer 
                rapport={selectedRapport} 
                onClose={() => setShowViewer(false)}
              />
            )}
          </Modal.Body>
        </Modal>

        {/* Modal - Formulaire */}
        <Modal show={showModal} onHide={handleCloseModal} size="xl" centered backdrop="static" className="no-print">
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title className="fw-bold">
              <FaTools className="me-2" />
              {modalTitle}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {formError && (
              <Alert variant="danger" onClose={() => setFormError('')} dismissible>
                <div className="d-flex align-items-center">
                  <FaExclamationTriangle className="me-3" />
                  <div>
                    <strong>Erreur de validation</strong>
                    <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>{formError}</p>
                  </div>
                </div>
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Projet <span className="text-danger">*</span></Form.Label>
                    <Form.Select 
                      value={formData.projet_id || ''} 
                      onChange={(e) => setFormData({...formData, projet_id: e.target.value})} 
                      required 
                      size="lg"
                    >
                      <option value="">-- Sélectionner un projet --</option>
                      {Array.isArray(projets) && projets.map(p => (
                        <option key={p?.id || Math.random()} value={p?.id || ''}>{p?.name || 'Sans nom'}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Date de création <span className="text-danger">*</span></Form.Label>
                    <Form.Control 
                      type="date" 
                      value={formData.date_creation || ''} 
                      onChange={(e) => setFormData({...formData, date_creation: e.target.value})} 
                      required 
                      size="lg" 
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold">Type de rapport <span className="text-danger">*</span></Form.Label>
                <Row>
                  {reportTypes.map(type => (
                    <Col md={3} key={type.value} className="mb-2">
                      <Button
                        variant={formData.type_rapport === type.value ? type.color : 'outline-secondary'}
                        className="w-100"
                        onClick={() => setFormData({...formData, type_rapport: type.value})}
                      >
                        {type.icon && React.cloneElement(type.icon, { className: 'me-2' })}
                        {type.label}
                      </Button>
                    </Col>
                  ))}
                </Row>
              </Form.Group>

              {formData.type_rapport === 'quotidien_excel' ? (
                <EditeurRapportQuotidien 
                  formData={formData}
                  setFormData={setFormData}
                  setSuccessMessage={setSuccessMessage}
                  setErrorMessage={setErrorMessage}
                />
              ) : (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Fichier {!editMode && <span className="text-danger">*</span>}
                    </Form.Label>
                    <Form.Control
                      type="file"
                      onChange={(e) => setFormData({...formData, fichier: e.target.files[0]})}
                      required={!editMode && !formData.fichier}
                      size="lg"
                      className="py-2"
                    />
                    <Form.Text className="text-muted">
                      Formats acceptés: PDF, DOC, DOCX, XLS, XLSX, CSV, JPG, PNG (max 20MB)
                    </Form.Text>
                    {editMode && formData.fichier && typeof formData.fichier === 'string' && (
                      <div className="mt-2 p-3 bg-light rounded">
                        <small className="text-muted">
                          <FaFileAlt className="me-2" />
                          Fichier actuel: {FileUtils.basename(formData.fichier)}
                        </small>
                      </div>
                    )}
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Commentaire</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      value={formData.commentaire || ''}
                      onChange={(e) => setFormData({...formData, commentaire: e.target.value})}
                      placeholder="Informations complémentaires sur le rapport..."
                    />
                  </Form.Group>
                </>
              )}

              <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                <Button variant="outline-secondary" size="lg" onClick={handleCloseModal} className="me-3 px-4">
                  <FaTimes className="me-2" /> Annuler
                </Button>
                <Button type="submit" variant="primary" size="lg" disabled={formLoading} className="px-5">
                  {formLoading ? (
                    <><Spinner size="sm" className="me-2" /> Enregistrement...</>
                  ) : (
                    <><FaSave className="me-2" /> {editMode ? 'Modifier' : 'Créer'}</>
                  )}
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>
      </Container>
    </>
  );
};

// ValidationUtils
const ValidationUtils = {
  validateForm: (formData, editMode) => {
    const errors = [];
    if (!formData?.projet_id) errors.push("Le projet est obligatoire");
    if (!formData?.type_rapport) errors.push("Le type de rapport est obligatoire");
    if (!formData?.date_creation) errors.push("La date de création est obligatoire");
    if (formData?.type_rapport === 'quotidien_excel') {
      if (!formData?.commentaire || formData.commentaire === '') {
        errors.push("Veuillez générer le rapport Excel");
      }
    } else {
      if (!editMode && !(formData?.fichier instanceof File) && !formData?.fichier) {
        errors.push("Un fichier est requis");
      }
    }
    return { isValid: errors.length === 0, errors };
  }
};

export default GestionRapportDM;