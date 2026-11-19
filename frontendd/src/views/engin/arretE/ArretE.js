import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table, Button, Card, Spinner, Form, Modal, Toast, ToastContainer, Alert,
  InputGroup, Row, Col, Dropdown, Pagination, Badge
} from 'react-bootstrap';
import {
  FaCar, FaInfoCircle, FaSyncAlt, FaPlus, FaEdit, FaTrash,
  FaTimes, FaFileExport, FaPrint, FaChartLine,
  FaFilter, FaCalendarAlt, FaWrench, FaClock, FaChartBar,
  FaCheckCircle, FaExclamationTriangle, FaStopwatch
} from 'react-icons/fa';
import axios from 'axios';
import { format, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useForm, useWatch } from 'react-hook-form';

const API_BASE_URL = 'https://intranet-attm.com/api';
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Intercepteur pour gérer les réponses
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

const API_ENDPOINTS = {
  arrets: '/arret-engins',
  engins: '/engins',
  codesPanne: '/pannes',
  projets: '/projets',
};

const ArretEngin = () => {
  // States principaux
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    engins: [],
    codesPanne: [],
    projets: [],
    arrets: []
  });
  const [filters, setFilters] = useState({
    selectedEngin: '',
    selectedCodePanne: '',
    selectedProjet: '',
    searchQuery: '',
    dateRange: { start: null, end: null }
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10
  });
  const [modals, setModals] = useState({
    showAddModal: false,
    showEditModal: false,
    showDeleteModal: false
  });
  const [indicators, setIndicators] = useState({
    mtbf: null,
    tdm: null,
    him: null,
    loading: false
  });
  const [arretToDelete, setArretToDelete] = useState(null);
  const [toasts, setToasts] = useState([]);

  const { register, handleSubmit, formState: { errors }, reset, setValue, control } = useForm();

  const watchDates = useWatch({
    control,
    name: ['date_panne', 'date_reparation']
  });

  const watchDureePanne = useWatch({
    control,
    name: 'duree_panne'
  });

  const watchNombrePannes = useWatch({
    control,
    name: 'nombre_pannes'
  });

  function initArretForm() {
    return {
      id: null,
      engin: '',
      projet: '',
      code_panne: '',
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
    };
  }

  // Calcul automatique des indicateurs
  useEffect(() => {
    if (!modals.showAddModal && !modals.showEditModal) return;

    const [datePanne, dateReparation] = watchDates || [];
    const dureePanne = parseFloat(watchDureePanne) || 0;
    const nbPannes = parseInt(watchNombrePannes) || 1;

    let nbJours = 1;
    if (datePanne && dateReparation) {
      const start = new Date(datePanne);
      const end = new Date(dateReparation);
      nbJours = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    }

    const tempsFonctionnement = Math.max(0, (nbJours * 10) - dureePanne);
    setValue('temps_fonctionnement', tempsFonctionnement.toFixed(2));

    const mtbf = nbPannes > 0 ? (tempsFonctionnement / nbPannes) : null;
    setValue('mtbf', mtbf ? mtbf.toFixed(2) : null);

    const totalTemps = tempsFonctionnement + dureePanne;
    const tdm = totalTemps > 0 ? (tempsFonctionnement / totalTemps) * 100 : null;
    setValue('tdm', tdm ? tdm.toFixed(1) : null);
    setValue('him', dureePanne.toFixed(1));

  }, [watchDates, watchDureePanne, watchNombrePannes, modals.showAddModal, modals.showEditModal, setValue]);

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

  const calculateDuration = useCallback((hours) => {
    if (!hours || isNaN(hours)) return '0h';
    const totalHours = parseFloat(hours);
    if (totalHours < 1) return `${Math.round(totalHours * 60)}min`;
    const days = Math.floor(totalHours / 10);
    const hoursLeft = totalHours % 10;
    if (days === 0) return `${hoursLeft.toFixed(1)}h`;
    if (hoursLeft === 0) return `${days}j`;
    return `${days}j ${hoursLeft.toFixed(1)}h`;
  }, []);

  const getEnginInfo = useCallback((enginId) => {
    if (!enginId) return 'Non spécifié';
    const id = typeof enginId === 'string' ? parseInt(enginId) : enginId;
    if (isNaN(id)) return 'Non spécifié';
    const engin = data.engins.find(e => e.id === id);
    return engin ? engin.matricule : 'Non spécifié';
  }, [data.engins]);

  const getEnginDetails = useCallback((enginId) => {
    if (!enginId) return { matricule: 'Non spécifié', type: '', marque: '', modele: '', immatriculation: '' };
    const id = typeof enginId === 'string' ? parseInt(enginId) : enginId;
    if (isNaN(id)) return { matricule: 'Non spécifié', type: '', marque: '', modele: '', immatriculation: '' };
    const engin = data.engins.find(e => e.id === id);
    if (!engin) return { matricule: 'Non spécifié', type: '', marque: '', modele: '', immatriculation: '' };
    return {
      matricule: engin.matricule || 'Non spécifié',
      type: engin.type_engin_display || engin.type_engin || '',
      marque: engin.marque || '',
      modele: engin.modele || '',
      immatriculation: engin.immatriculation || ''
    };
  }, [data.engins]);

  const getCodePanneInfo = useCallback((codeId) => {
    if (!codeId) return 'Non spécifié';
    const id = typeof codeId === 'string' ? parseInt(codeId) : codeId;
    if (isNaN(id)) return 'Non spécifié';
    const code = data.codesPanne.find(c => c.id === id);
    return code ? `${code.code} - ${code.description || ''}` : `Code ID: ${id}`;
  }, [data.codesPanne]);

  const getProjetInfo = useCallback((projetId) => {
    if (!projetId) return 'Non spécifié';
    const id = typeof projetId === 'string' ? parseInt(projetId) : projetId;
    if (isNaN(id)) return 'Non spécifié';
    const projet = data.projets.find(p => p.id === id);
    return projet ? projet.name : `ID: ${id}`;
  }, [data.projets]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [arretsRes, enginsRes, codesRes, projetsRes] = await Promise.allSettled([
        api.get(API_ENDPOINTS.arrets),
        api.get(API_ENDPOINTS.engins),
        api.get(API_ENDPOINTS.codesPanne),
        api.get(API_ENDPOINTS.projets)
      ]);

      let arretsData = [];
      if (arretsRes.status === 'fulfilled') {
        const responseData = arretsRes.value.data;
        arretsData = responseData.data || responseData || [];
      }

      let enginsData = [];
      if (enginsRes.status === 'fulfilled') {
        const responseData = enginsRes.value.data;
        enginsData = responseData.data || responseData || [];
      }

      let codesData = [];
      if (codesRes.status === 'fulfilled') {
        const responseData = codesRes.value.data;
        codesData = responseData.data || responseData || [];
      }

      let projetsData = [];
      if (projetsRes.status === 'fulfilled') {
        const responseData = projetsRes.value.data;
        projetsData = responseData.data || responseData || [];
      }

      setData({
        arrets: arretsData,
        engins: enginsData,
        codesPanne: codesData,
        projets: projetsData
      });
    } catch (err) {
      console.error("Erreur de chargement:", err);
      setError("Erreur lors du chargement des données");
      showToast("Erreur lors du chargement des données", 'danger');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchIndicators = useCallback(async () => {
    try {
      setIndicators(prev => ({ ...prev, loading: true }));
      
      let arretsToAnalyze = [...data.arrets];
      
      if (filters.selectedEngin) {
        arretsToAnalyze = arretsToAnalyze.filter(a => a.engin === parseInt(filters.selectedEngin));
      }
      if (filters.selectedProjet) {
        arretsToAnalyze = arretsToAnalyze.filter(a => a.projet === parseInt(filters.selectedProjet));
      }

      const totalPannes = arretsToAnalyze.reduce((sum, a) => sum + (parseInt(a.nombre_pannes) || 0), 0);
      const totalTempsFonctionnement = arretsToAnalyze.reduce((sum, a) => sum + (parseFloat(a.temps_fonctionnement) || 0), 0);
      const totalDureePanne = arretsToAnalyze.reduce((sum, a) => sum + (parseFloat(a.duree_panne) || 0), 0);
      
      setIndicators({
        mtbf: totalPannes > 0 ? (totalTempsFonctionnement / totalPannes).toFixed(2) : null,
        tdm: (totalTempsFonctionnement + totalDureePanne) > 0 ? 
             ((totalTempsFonctionnement / (totalTempsFonctionnement + totalDureePanne)) * 100).toFixed(1) : null,
        him: totalDureePanne.toFixed(1),
        loading: false
      });
    } catch (error) {
      console.error("Error fetching indicators:", error);
      setIndicators(prev => ({ ...prev, loading: false }));
    }
  }, [data.arrets, filters.selectedEngin, filters.selectedProjet]);

  useEffect(() => { 
    fetchData();
  }, []);

  useEffect(() => {
    if (data.arrets.length > 0) {
      fetchIndicators();
    }
  }, [data.arrets, filters.selectedEngin, filters.selectedProjet, fetchIndicators]);

  const filteredArrets = useMemo(() => {
    return data.arrets.filter(arret => {
      const enginMatch = filters.selectedEngin ? arret.engin === parseInt(filters.selectedEngin) : true;
      const projetMatch = filters.selectedProjet ? arret.projet === parseInt(filters.selectedProjet) : true;
      const codePanneMatch = filters.selectedCodePanne ? arret.code_panne === parseInt(filters.selectedCodePanne) : true;
      
      const searchMatch = filters.searchQuery
        ? (arret.cause_panne?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
           arret.intervenant?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
           getEnginInfo(arret.engin).toLowerCase().includes(filters.searchQuery.toLowerCase()))
        : true;
      
      const dateMatch = filters.dateRange.start && filters.dateRange.end
        ? (new Date(arret.date_panne) >= new Date(filters.dateRange.start) &&
           new Date(arret.date_panne) <= new Date(filters.dateRange.end))
        : true;
      
      return enginMatch && projetMatch && codePanneMatch && searchMatch && dateMatch;
    });
  }, [data.arrets, filters, getEnginInfo]);

  const paginatedArrets = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    return filteredArrets.slice(startIndex, startIndex + pagination.itemsPerPage);
  }, [filteredArrets, pagination]);

  const totalPages = Math.ceil(filteredArrets.length / pagination.itemsPerPage);

  const stats = useMemo(() => {
    const total = filteredArrets.length;
    const totalDuration = filteredArrets.reduce((sum, a) => sum + (parseFloat(a.duree_panne) || 0), 0);
    const avgDuration = total > 0 ? (totalDuration / total).toFixed(1) : 0;
    const totalTF = filteredArrets.reduce((sum, a) => sum + (parseFloat(a.temps_fonctionnement) || 0), 0);
    
    return { 
      total,
      totalDuration: totalDuration.toFixed(1),
      avgDuration,
      totalTF: totalTF.toFixed(1),
      mtbf: indicators.mtbf,
      tdm: indicators.tdm,
      him: indicators.him
    };
  }, [filteredArrets, indicators]);

  const handleAddArret = () => {
    reset(initArretForm());
    setModals(prev => ({ ...prev, showAddModal: true }));
  };

  const handleEditArret = (arret) => {
    const formData = {
      id: arret.id,
      engin: arret.engin,
      projet: arret.projet || '',
      code_panne: arret.code_panne || '',
      date_panne: arret.date_panne ? arret.date_panne.slice(0, 16) : new Date().toISOString().slice(0, 16),
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
    setModals(prev => ({ ...prev, showEditModal: true }));
  };

  const handleDeleteArret = (arret) => {
    setArretToDelete(arret);
    setModals(prev => ({ ...prev, showDeleteModal: true }));
  };

  const submitArret = async (formData, isEdit = false) => {
    try {
      setLoading(true);

      if (!formData.engin) {
        showToast("Veuillez sélectionner un engin", 'danger');
        setLoading(false);
        return;
      }

      let nbJours = 1;
      if (formData.date_panne && formData.date_reparation) {
        const start = new Date(formData.date_panne);
        const end = new Date(formData.date_reparation);
        nbJours = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
      }

      const dureePanne = parseFloat(formData.duree_panne) || 0;
      const tempsFonctionnement = Math.max(0, (nbJours * 10) - dureePanne);
      const nbPannes = parseInt(formData.nombre_pannes) || 1;
      const mtbf = nbPannes > 0 ? (tempsFonctionnement / nbPannes) : null;
      const tdm = (tempsFonctionnement + dureePanne) > 0 ? (tempsFonctionnement / (tempsFonctionnement + dureePanne)) * 100 : null;

      const payload = {
        engin: parseInt(formData.engin),
        projet: formData.projet ? parseInt(formData.projet) : null,
        code_panne: formData.code_panne ? parseInt(formData.code_panne) : null,
        date_panne: formData.date_panne,
        date_reparation: formData.date_reparation || null,
        duree_panne: dureePanne,
        cause_panne: formData.cause_panne || '',
        travaux_effectues: formData.travaux_effectues || '',
        intervenant: formData.intervenant || '',
        observation: formData.observation || '',
        jour: formData.jour || null,
        temps_fonctionnement: tempsFonctionnement,
        nombre_pannes: nbPannes,
        mtbf: mtbf,
        tdm: tdm,
        him: dureePanne
      };

      if (isEdit) {
        await api.put(`${API_ENDPOINTS.arrets}/${formData.id}`, payload);
        showToast("Arrêt mis à jour avec succès");
      } else {
        await api.post(API_ENDPOINTS.arrets, payload);
        showToast("Nouvel arrêt créé avec succès");
      }

      await fetchData();
      setModals(prev => ({ ...prev, showAddModal: false, showEditModal: false }));
    } catch (err) {
      console.error("Erreur détaillée:", err.response?.data);
      showToast(`Erreur: ${err.response?.data?.message || "Erreur lors de l'opération"}`, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      await api.delete(`${API_ENDPOINTS.arrets}/${arretToDelete.id}`);
      showToast("Arrêt supprimé avec succès");
      await fetchData();
      setModals(prev => ({ ...prev, showDeleteModal: false }));
    } catch (err) {
      showToast(`Erreur: ${err.response?.data?.message || "Erreur lors de la suppression"}`, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Arrêts engins');
      
      worksheet.addRow([
        'ID', 'Matricule', 'Type', 'Marque', 'Modèle', 'Projet', 'Code Panne', 
        'Date Panne', 'Date Réparation', 'Durée (h)', 'Temps Fonction (h)', 
        'Nombre Pannes', 'MTBF (h)', 'TDM (%)', 'Cause Panne', 
        'Travaux Effectués', 'Intervenant', 'Observation'
      ]);

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' }
      };

      filteredArrets.forEach(arret => {
        const enginDetails = getEnginDetails(arret.engin);
        worksheet.addRow([
          arret.id,
          enginDetails.matricule,
          enginDetails.type,
          enginDetails.marque,
          enginDetails.modele,
          getProjetInfo(arret.projet),
          getCodePanneInfo(arret.code_panne),
          formatDisplayDate(arret.date_panne),
          arret.date_reparation ? formatDisplayDate(arret.date_reparation) : '-',
          arret.duree_panne || '-',
          arret.temps_fonctionnement || '-',
          arret.nombre_pannes || '-',
          arret.mtbf || '-',
          arret.tdm || '-',
          arret.cause_panne || '-',
          arret.travaux_effectues || '-',
          arret.intervenant || '-',
          arret.observation || '-'
        ]);
      });

      worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) maxLength = columnLength;
        });
        column.width = Math.min(maxLength + 2, 30);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Arrets_Engins_${new Date().toISOString().split('T')[0]}.xlsx`);
      showToast('Export Excel généré avec succès', 'success');
    } catch (error) {
      console.error('Erreur export Excel:', error);
      showToast('Erreur lors de la génération du fichier Excel', 'danger');
    }
  };

  const printTable = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Arrêts d'Engins</title>
          <style>
            body { font-family: Arial; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 20px; }
            .summary { margin-bottom: 20px; padding: 10px; background-color: #f8f9fa; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Arrêts d'Engins</h2>
            <p>Généré le: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
          </div>
          <div class="summary">
            <strong>Total arrêts:</strong> ${stats.total} |
            <strong>Durée totale:</strong> ${stats.totalDuration}h |
            <strong>Durée moyenne:</strong> ${stats.avgDuration}h |
            <strong>MTBF:</strong> ${stats.mtbf || '-'}h |
            <strong>TDM:</strong> ${stats.tdm || '-'}%
          </div>
          <table>
            <thead>
              <tr><th>Engin</th><th>Type</th><th>Projet</th><th>Code Panne</th><th>Date Panne</th><th>Durée</th><th>Intervenant</th></tr>
            </thead>
            <tbody>
              ${filteredArrets.map(arret => `
                <tr>
                  <td>${getEnginInfo(arret.engin)}</td>
                  <td>${getEnginDetails(arret.engin).type}</td>
                  <td>${getProjetInfo(arret.projet)}</td>
                  <td>${getCodePanneInfo(arret.code_panne)}</td>
                  <td>${formatDisplayDate(arret.date_panne)}</td>
                  <td>${calculateDuration(arret.duree_panne)}</td>
                  <td>${arret.intervenant || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const DateRangeFilter = () => (
    <Row className="mb-3 g-2">
      <Col md={6}>
        <Form.Group>
          <Form.Label>Date de début</Form.Label>
          <InputGroup>
            <Form.Control
              type="date"
              value={filters.dateRange.start || ''}
              onChange={e => setFilters(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, start: e.target.value }
              }))}
            />
            <InputGroup.Text><FaCalendarAlt /></InputGroup.Text>
          </InputGroup>
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group>
          <Form.Label>Date de fin</Form.Label>
          <InputGroup>
            <Form.Control
              type="date"
              value={filters.dateRange.end || ''}
              onChange={e => setFilters(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, end: e.target.value }
              }))}
              min={filters.dateRange.start}
            />
            <InputGroup.Text><FaCalendarAlt /></InputGroup.Text>
          </InputGroup>
        </Form.Group>
      </Col>
    </Row>
  );

  return (
    <div className="container-fluid py-4">
      <Card className="shadow-lg">
        <Card.Header className="bg-primary text-white">
          <Row className="align-items-center">
            <Col md={6}>
              <h3 className="mb-0 d-flex align-items-center">
                <FaStopwatch className="me-2" />
                Gestion des Arrêts d'Engins
              </h3>
            </Col>
            <Col md={6} className="text-end">
              <Button variant="light" onClick={fetchData} disabled={loading} className="me-2">
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
                  <Dropdown.Item onClick={printTable}>
                    <FaPrint className="me-2" /> Imprimer
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              
              <Button variant="success" onClick={handleAddArret} disabled={loading}>
                <FaPlus className="me-1" />
                Nouvel arrêt
              </Button>
            </Col>
          </Row>
        </Card.Header>
        
        <Card.Body>
          {loading && !data.arrets.length ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Chargement des données...</p>
            </div>
          ) : error ? (
            <Alert variant="danger">
              <FaInfoCircle className="me-2" />
              {error}
              <Button variant="outline-danger" size="sm" className="ms-3" onClick={fetchData}>
                Réessayer
              </Button>
            </Alert>
          ) : (
            <>
              <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
                {toasts.map(toast => (
                  <Toast 
                    key={toast.id} 
                    onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} 
                    bg={toast.variant} 
                    autohide 
                    delay={5000}
                  >
                    <Toast.Body className="text-white">{toast.message}</Toast.Body>
                  </Toast>
                ))}
              </ToastContainer>

              {/* Filtres */}
              <Card className="mb-4 shadow-sm">
                <Card.Header className="bg-light">
                  <h5 className="mb-0"><FaFilter className="me-2" /> Filtres</h5>
                </Card.Header>
                <Card.Body>
                  <Row className="g-3">
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Engin</Form.Label>
                        <Form.Select 
                          value={filters.selectedEngin} 
                          onChange={e => setFilters(p => ({ ...p, selectedEngin: e.target.value }))}
                        >
                          <option value="">Tous les engins</option>
                          {data.engins.map(e => (
                            <option key={e.id} value={e.id}>{e.matricule} - {e.type_engin || ''}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Projet</Form.Label>
                        <Form.Select 
                          value={filters.selectedProjet} 
                          onChange={e => setFilters(p => ({ ...p, selectedProjet: e.target.value }))}
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
                        <Form.Label>Code panne</Form.Label>
                        <Form.Select 
                          value={filters.selectedCodePanne} 
                          onChange={e => setFilters(p => ({ ...p, selectedCodePanne: e.target.value }))}
                        >
                          <option value="">Tous les codes</option>
                          {data.codesPanne.map(c => (
                            <option key={c.id} value={c.id}>{c.code} - {c.description}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Recherche</Form.Label>
                        <InputGroup>
                          <Form.Control
                            type="text"
                            placeholder="Cause, intervenant..."
                            value={filters.searchQuery}
                            onChange={e => setFilters(p => ({ ...p, searchQuery: e.target.value }))}
                          />
                          {filters.searchQuery && (
                            <Button variant="outline-secondary" onClick={() => setFilters(p => ({ ...p, searchQuery: '' }))}>
                              <FaTimes />
                            </Button>
                          )}
                        </InputGroup>
                      </Form.Group>
                    </Col>
                  </Row>
                  <DateRangeFilter />
                  <div className="mt-2 text-end">
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => setFilters({
                        selectedEngin: '',
                        selectedCodePanne: '',
                        selectedProjet: '',
                        searchQuery: '',
                        dateRange: { start: null, end: null }
                      })}
                    >
                      Réinitialiser les filtres
                    </Button>
                  </div>
                </Card.Body>
              </Card>

              {/* Indicateurs */}
              <Card className="mb-4 shadow-sm">
                <Card.Body>
                  <h5><FaChartLine className="me-2" /> Indicateurs de Performance</h5>
                  <Row className="text-center">
                    <Col md={3}>
                      <div className="p-3 bg-light rounded">
                        <FaStopwatch className="fs-3 text-primary mb-2" />
                        <div className="text-muted small">Total arrêts</div>
                        <div className="fs-3 fw-bold">{stats.total}</div>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="p-3 bg-danger bg-opacity-10 rounded">
                        <FaClock className="fs-3 text-danger mb-2" />
                        <div className="text-muted small">Durée totale panne</div>
                        <div className="fs-3 fw-bold">{stats.totalDuration}h</div>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="p-3 bg-success bg-opacity-10 rounded">
                        <FaCheckCircle className="fs-3 text-success mb-2" />
                        <div className="text-muted small">MTBF</div>
                        <div className="fs-3 fw-bold">{stats.mtbf || '-'}h</div>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="p-3 bg-info bg-opacity-10 rounded">
                        <FaChartBar className="fs-3 text-info mb-2" />
                        <div className="text-muted small">TDM</div>
                        <div className="fs-3 fw-bold">{stats.tdm || '-'}%</div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Tableau */}
              {data.arrets.length > 0 ? (
                <>
                  <div className="table-responsive mb-3">
                    <Table striped bordered hover className="align-middle">
                      <thead className="table-dark">
                        <tr>
                          <th>Engin</th>
                          <th>Type</th>
                          <th>Projet</th>
                          <th>Code Panne</th>
                          <th>Date panne</th>
                          <th>Date réparation</th>
                          <th>Durée</th>
                          <th>Travaux</th>
                          <th>Intervenant</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedArrets.map(arret => {
                          const enginDetails = getEnginDetails(arret.engin);
                          const dureeFormatted = calculateDuration(arret.duree_panne);
                          const isLongStop = arret.duree_panne > 24;
                          
                          return (
                            <tr key={arret.id} className={isLongStop ? 'table-warning' : ''}>
                              <td className="fw-bold text-primary">{enginDetails.matricule}</td>
                              <td>{enginDetails.type}</td>
                              <td>{getProjetInfo(arret.projet)}</td>
                              <td>
                                <Badge bg="secondary">{getCodePanneInfo(arret.code_panne)}</Badge>
                              </td>
                              <td>{formatDisplayDate(arret.date_panne)}</td>
                              <td>{arret.date_reparation ? formatDisplayDate(arret.date_reparation) : '-'}</td>
                              <td>
                                {isLongStop ? (
                                  <span className="text-danger fw-bold">{dureeFormatted}</span>
                                ) : dureeFormatted}
                              </td>
                              <td>
                                <div style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {arret.travaux_effectues || '-'}
                                </div>
                              </td>
                              <td>{arret.intervenant || '-'}</td>
                              <td>
                                <Button 
                                  variant="outline-primary" 
                                  size="sm" 
                                  onClick={() => handleEditArret(arret)} 
                                  className="me-2"
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
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="d-flex justify-content-center align-items-center gap-3">
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
                          let pageNum = pagination.currentPage - 2 + i;
                          if (pageNum < 1) pageNum = i + 1;
                          if (pageNum > totalPages) pageNum = totalPages - 4 + i;
                          if (pageNum >= 1 && pageNum <= totalPages) {
                            return (
                              <Pagination.Item 
                                key={pageNum} 
                                active={pageNum === pagination.currentPage} 
                                onClick={() => setPagination(p => ({ ...p, currentPage: pageNum }))}
                              >
                                {pageNum}
                              </Pagination.Item>
                            );
                          }
                          return null;
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
                      
                      <div className="text-muted">
                        {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} - 
                        {Math.min(pagination.currentPage * pagination.itemsPerPage, filteredArrets.length)} sur {filteredArrets.length}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Alert variant="info" className="text-center">
                  <FaInfoCircle className="me-2" />
                  Aucun arrêt trouvé
                  <Button variant="outline-primary" size="sm" className="ms-3" onClick={handleAddArret}>
                    Créer le premier arrêt
                  </Button>
                </Alert>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* Modal d'ajout - version simplifiée sans caractères problématiques */}
      <Modal show={modals.showAddModal} onHide={() => !loading && setModals(p => ({ ...p, showAddModal: false }))} size="lg" backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title><FaPlus className="me-2" /> Nouvel arrêt d'engin</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit(data => submitArret(data, false))}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Engin *</Form.Label>
                  <Form.Select
                    {...register("engin", { required: "Veuillez sélectionner un engin" })}
                    isInvalid={!!errors.engin}
                  >
                    <option value="">Sélectionner un engin...</option>
                    {data.engins.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.matricule} - {e.type_engin_display || e.type_engin || 'Non spécifié'}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.engin?.message}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Projet</Form.Label>
                  <Form.Select {...register("projet")}>
                    <option value="">Sélectionner un projet...</option>
                    {data.projets.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Code panne</Form.Label>
                  <Form.Select {...register("code_panne")}>
                    <option value="">Sélectionner un code...</option>
                    {data.codesPanne.map(c => (
                      <option key={c.id} value={c.id}>{c.code} - {c.description}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Date et heure de la panne *</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    {...register("date_panne", { required: "Date de panne obligatoire" })}
                    isInvalid={!!errors.date_panne}
                  />
                  <Form.Control.Feedback type="invalid">{errors.date_panne?.message}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Date et heure de réparation</Form.Label>
                  <Form.Control type="datetime-local" {...register("date_reparation")} />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Durée de panne (heures)</Form.Label>
                  <Form.Control type="number" step="0.5" {...register("duree_panne")} />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Temps de fonctionnement (heures)</Form.Label>
                  <Form.Control type="number" step="0.5" {...register("temps_fonctionnement")} readOnly disabled />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Nombre de pannes</Form.Label>
                  <Form.Control type="number" {...register("nombre_pannes")} min="1" defaultValue="1" />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>MTBF (heures)</Form.Label>
                  <Form.Control type="number" step="0.5" {...register("mtbf")} readOnly disabled />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>TDM (%)</Form.Label>
                  <Form.Control type="number" step="0.1" {...register("tdm")} readOnly disabled />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Cause de la panne</Form.Label>
                  <Form.Control as="textarea" rows={3} {...register("cause_panne")} placeholder="Description détaillée de la cause..." />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Travaux effectués</Form.Label>
                  <Form.Control as="textarea" rows={3} {...register("travaux_effectues")} placeholder="Description des réparations effectuées..." />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Intervenant</Form.Label>
                  <Form.Control type="text" {...register("intervenant")} placeholder="Nom du technicien" />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Observation</Form.Label>
                  <Form.Control as="textarea" rows={2} {...register("observation")} placeholder="Notes supplémentaires..." />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setModals(p => ({ ...p, showAddModal: false }))} disabled={loading}>
              Annuler
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? <Spinner as="span" size="sm" animation="border" /> : 'Enregistrer'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal d'édition */}
      <Modal show={modals.showEditModal} onHide={() => !loading && setModals(p => ({ ...p, showEditModal: false }))} size="lg" backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title><FaEdit className="me-2" /> Modifier l'arrêt</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit(data => submitArret(data, true))}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Engin *</Form.Label>
                  <Form.Select
                    {...register("engin", { required: "Veuillez sélectionner un engin" })}
                    isInvalid={!!errors.engin}
                    disabled
                  >
                    <option value="">Sélectionner un engin...</option>
                    {data.engins.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.matricule} - {e.type_engin_display || e.type_engin || 'Non spécifié'}
                      </option>
                    ))}
                  </Form.Select>
                  <div className="text-muted small mt-1">L'engin ne peut pas être modifié</div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Projet</Form.Label>
                  <Form.Select {...register("projet")}>
                    <option value="">Sélectionner un projet...</option>
                    {data.projets.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Code panne</Form.Label>
                  <Form.Select {...register("code_panne")}>
                    <option value="">Sélectionner un code...</option>
                    {data.codesPanne.map(c => (
                      <option key={c.id} value={c.id}>{c.code} - {c.description}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Date et heure de la panne *</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    {...register("date_panne", { required: "Date de panne obligatoire" })}
                    isInvalid={!!errors.date_panne}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Date et heure de réparation</Form.Label>
                  <Form.Control type="datetime-local" {...register("date_reparation")} />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Durée de panne (heures)</Form.Label>
                  <Form.Control type="number" step="0.5" {...register("duree_panne")} />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Temps de fonctionnement (heures)</Form.Label>
                  <Form.Control type="number" step="0.5" {...register("temps_fonctionnement")} readOnly disabled />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Nombre de pannes</Form.Label>
                  <Form.Control type="number" {...register("nombre_pannes")} min="1" />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>MTBF (heures)</Form.Label>
                  <Form.Control type="number" step="0.5" {...register("mtbf")} readOnly disabled />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>TDM (%)</Form.Label>
                  <Form.Control type="number" step="0.1" {...register("tdm")} readOnly disabled />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Cause de la panne</Form.Label>
                  <Form.Control as="textarea" rows={3} {...register("cause_panne")} />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Travaux effectués</Form.Label>
                  <Form.Control as="textarea" rows={3} {...register("travaux_effectues")} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Intervenant</Form.Label>
                  <Form.Control type="text" {...register("intervenant")} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Observation</Form.Label>
                  <Form.Control as="textarea" rows={2} {...register("observation")} />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setModals(p => ({ ...p, showEditModal: false }))} disabled={loading}>
              Annuler
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? <Spinner as="span" size="sm" animation="border" /> : 'Mettre à jour'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal de suppression */}
      <Modal show={modals.showDeleteModal} onHide={() => !loading && setModals(p => ({ ...p, showDeleteModal: false }))} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title><FaTrash className="me-2" /> Confirmer la suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {arretToDelete && (
            <>
              <p>Êtes-vous sûr de vouloir supprimer cet arrêt ?</p>
              <div className="p-3 bg-light rounded">
                <p><strong>Engin:</strong> {getEnginInfo(arretToDelete.engin)}</p>
                <p><strong>Type:</strong> {getEnginDetails(arretToDelete.engin).type}</p>
                <p><strong>Date panne:</strong> {formatDisplayDate(arretToDelete.date_panne)}</p>
                <p><strong>Durée:</strong> {calculateDuration(arretToDelete.duree_panne)}</p>
                {arretToDelete.cause_panne && <p><strong>Cause:</strong> {arretToDelete.cause_panne}</p>}
              </div>
              <p className="text-danger mt-3">⚠️ Cette action est irréversible !</p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModals(p => ({ ...p, showDeleteModal: false }))} disabled={loading}>
            Annuler
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={loading}>
            {loading ? <Spinner as="span" size="sm" animation="border" /> : 'Supprimer'}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .table-warning {
          background-color: #fff3cd !important;
        }
      `}</style>
    </div>
  );
};

export default ArretEngin;