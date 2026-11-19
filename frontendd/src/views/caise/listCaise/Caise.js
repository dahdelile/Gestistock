import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table, Button, Card, Spinner, Form, Modal, Toast, ToastContainer, Alert,
  InputGroup, Row, Col, Dropdown, Pagination, Badge
} from 'react-bootstrap';
import {
  FaMoneyBill, FaInfoCircle, FaSyncAlt, FaPlus, FaEdit, FaTrash,
  FaTimes, FaFileExport, FaPrint, FaChartLine,
  FaFilter, FaCalendarAlt, FaFile, FaDownload, FaEye
} from 'react-icons/fa';
import axios from 'axios';
import { format, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useForm } from 'react-hook-form';

const API_BASE_URL = 'http://localhost:8000/api';
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

const API_ENDPOINTS = {
  caises: '/caises/'
};

const GestionCaisse = () => {
  // States principaux
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({ caises: [] });
  const [filters, setFilters] = useState({
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
  const [currentCaisse, setCurrentCaisse] = useState(null);
  const [caisseToDelete, setCaisseToDelete] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [filePreview, setFilePreview] = useState(null);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm();

  // Fonction d'initialisation du formulaire
  const initCaisseForm = () => ({
    id: null,
    code_caise: '',
    libelle: '',
    type_operation: '',
    montant: '',
    date: new Date().toISOString().slice(0, 10),
    file: null,
    cheque: ''
  });

  // Gestion des notifications
  const showToast = useCallback((message, variant = 'success') => {
    const newToast = { id: Date.now(), message, variant };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 5000);
  }, []);

  // Formateurs
  const formatDisplayDate = useCallback((dateString) => {
    if (!dateString) return 'Non spécifiée';
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, 'dd/MM/yyyy', { locale: fr }) : dateString;
    } catch {
      return dateString;
    }
  }, []);

  const formatMontant = useCallback((montant) => {
    if (!montant && montant !== 0) return '0,00';
    const num = parseFloat(montant);
    return isNaN(num) ? '0,00' : num.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }, []);

  const normalizeFileUrl = (fileUrl) => {
  if (!fileUrl) return null;
  
  console.log('URL du fichier original:', fileUrl); // Pour debug
  
  // Si l'URL est déjà complète
  if (fileUrl.startsWith('http')) {
    return fileUrl;
  }
  // Si l'URL commence par /media/ (chemin Django)
  else if (fileUrl.startsWith('/media/')) {
    return `http://localhost:8000${fileUrl}`;
  }
  // Si c'est juste un nom de fichier
  else {
    return `http://localhost:8000/media/caises/${fileUrl}`;
  }
};
  // Fonction de téléchargement corrigée
  const downloadFile = (fileUrl, fileName) => {
    try {
      if (!fileUrl) {
        showToast('Aucun fichier disponible', 'warning');
        return;
      }

      const normalizedUrl = normalizeFileUrl(fileUrl);
      
      const link = document.createElement('a');
      link.href = normalizedUrl;
      link.download = fileName || fileUrl.split('/').pop() || 'document';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('Téléchargement démarré', 'success');
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      showToast('Erreur lors du téléchargement', 'danger');
    }
  };

  // Fetch des données
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(API_ENDPOINTS.caises);
      
      const caisesWithCalculations = response.data.map(caisse => ({
        ...caisse,
        recetteFormatted: formatMontant(caisse.recette),
        depenseFormatted: formatMontant(caisse.depense),
        soldeFormatted: formatMontant(caisse.solde),
        file_url: caisse.file_url ? normalizeFileUrl(caisse.file_url) : null
      }));

      setData({ caises: caisesWithCalculations });
    } catch (err) {
      console.error("Erreur de chargement:", err);
      const msg = err.response?.data?.detail ||
                  Object.values(err.response?.data || {}).join(', ') ||
                  "Erreur lors du chargement des données";
      setError(msg);
      showToast(msg, 'danger');
    } finally {
      setLoading(false);
    }
  }, [formatMontant, showToast]);

  useEffect(() => { 
    fetchData();
  }, [fetchData]);

  // Filtrage et pagination
  const filteredCaises = useMemo(() => {
    return data.caises.filter(caisse => {
      const searchMatch = filters.searchQuery
        ? (caisse.libelle?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
           caisse.code_caise?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
           caisse.cheque?.toLowerCase().includes(filters.searchQuery.toLowerCase()))
        : true;
      
      const dateMatch = filters.dateRange.start && filters.dateRange.end
        ? (new Date(caisse.date) >= new Date(filters.dateRange.start) &&
           new Date(caisse.date) <= new Date(filters.dateRange.end))
        : true;
      
      return searchMatch && dateMatch;
    });
  }, [data.caises, filters]);

  const paginatedCaises = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    return filteredCaises.slice(startIndex, startIndex + pagination.itemsPerPage);
  }, [filteredCaises, pagination]);

  const totalPages = Math.ceil(filteredCaises.length / pagination.itemsPerPage);

  // Statistiques
  const stats = useMemo(() => {
    const totalRecette = filteredCaises.reduce((sum, c) => sum + (parseFloat(c.recette) || 0), 0);
    const totalDepense = filteredCaises.reduce((sum, c) => sum + (parseFloat(c.depense) || 0), 0);
    const soldeTotal = totalRecette - totalDepense;
    const totalOperations = filteredCaises.length;
    
    return { totalRecette, totalDepense, soldeTotal, totalOperations };
  }, [filteredCaises]);

  // Gestion des modals
  const handleAddCaisse = () => {
    reset(initCaisseForm());
    setFilePreview(null);
    setModals(prev => ({ ...prev, showAddModal: true }));
  };

  const handleEditCaisse = (caisse) => {
    // Déterminer le type d'opération basé sur les valeurs existantes
    const type_operation = parseFloat(caisse.recette) > 0 ? 'recette' : 
                          parseFloat(caisse.depense) > 0 ? 'depense' : '';
    
    const montant = parseFloat(caisse.recette) > 0 ? caisse.recette : 
                   parseFloat(caisse.depense) > 0 ? caisse.depense : '';

    const formData = {
      id: caisse.id,
      code_caise: caisse.code_caise || '',
      libelle: caisse.libelle || '',
      type_operation: type_operation,
      montant: montant,
      date: caisse.date.slice(0, 10),
      cheque: caisse.cheque || '',
      file: null
    };
    
    reset(formData);
    setCurrentCaisse(caisse);
    setFilePreview(caisse.file_url || null);
    setModals(prev => ({ ...prev, showEditModal: true }));
  };

  const handleDeleteCaisse = (caisse) => {
    setCaisseToDelete(caisse);
    setModals(prev => ({ ...prev, showDeleteModal: true }));
  };

  // Gestion des fichiers
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  // Soumission des formulaires
  const submitCaisse = async (formData, isEdit = false) => {
    try {
      setLoading(true);

      // Calculer recette et depense basé sur le type d'opération
      const recette = formData.type_operation === 'recette' ? formData.montant : '0';
      const depense = formData.type_operation === 'depense' ? formData.montant : '0';

      const formDataToSend = new FormData();
      formDataToSend.append('code_caise', formData.code_caise);
      formDataToSend.append('libelle', formData.libelle);
      formDataToSend.append('recette', recette);
      formDataToSend.append('depense', depense);
      formDataToSend.append('date', formData.date);
      formDataToSend.append('cheque', formData.cheque || '');

      if (formData.file && formData.file[0]) {
        formDataToSend.append('file', formData.file[0]);
      }

      if (isEdit) {
        await axios.put(`${API_BASE_URL}${API_ENDPOINTS.caises}${formData.id}/`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showToast(`Opération #${formData.id} mise à jour avec succès`);
      } else {
        await axios.post(`${API_BASE_URL}${API_ENDPOINTS.caises}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showToast('Nouvelle opération créée avec succès');
      }

      await fetchData();
      setModals(prev => ({ ...prev, showAddModal: false, showEditModal: false }));
      setFilePreview(null);
    } catch (err) {
      console.error("Erreur détaillée:", err.response?.data);
      const errorMsg = err.response?.data
        ? Object.entries(err.response.data)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('; ')
        : "Erreur réseau ou serveur inaccessible";
      showToast(`Échec de l'opération: ${errorMsg}`, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      await api.delete(`${API_ENDPOINTS.caises}${caisseToDelete.id}/`);
      showToast(`Opération #${caisseToDelete.id} supprimée avec succès`);
      await fetchData();
      setModals(prev => ({ ...prev, showDeleteModal: false }));
    } catch (err) {
      const msg = err.response?.data?.detail || "Erreur lors de la suppression";
      showToast(msg, 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Export et impression
const exportToExcel = async () => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Gestion de Caisse');

    // Titre principal
    const titleRow = worksheet.addRow(['Gestion de Caisse']);
    titleRow.font = { bold: true, size: 16 };
    titleRow.alignment = { horizontal: 'center' };
    worksheet.mergeCells('A1:F1');

    // Date de génération
    const dateRow = worksheet.addRow([`Généré le: ${new Date().toLocaleDateString('fr-FR')}`]);
    dateRow.font = { italic: true };
    dateRow.alignment = { horizontal: 'center' };
    worksheet.mergeCells('A2:F2');

    // Ligne vide
    worksheet.addRow([]);

    // Section Résumé
    const resumeTitleRow = worksheet.addRow(['Résumé']);
    resumeTitleRow.font = { bold: true, size: 14 };
    worksheet.mergeCells('A4:F4');

    worksheet.addRow([`Total opérations: ${stats.totalOperations}`]);
    worksheet.addRow([`Total recettes: ${formatMontant(stats.totalRecette)}`]);
    worksheet.addRow([`Total dépenses: ${formatMontant(stats.totalDepense)}`]);
    worksheet.addRow([`Solde total: ${formatMontant(stats.soldeTotal)}`]);

    // Ligne vide
    worksheet.addRow([]);

    // Ligne de séparation
    const separationRow = worksheet.addRow(['---']);
    separationRow.alignment = { horizontal: 'center' };
    worksheet.mergeCells('A10:F10');

    // Ligne vide
    worksheet.addRow([]);

    // En-têtes du tableau
    const headers = ['Code', 'Date', 'Libellé', 'Recette', 'Depense', 'Chèque'];
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Données
    filteredCaises.forEach(caisse => {
      worksheet.addRow([
        caisse.code_caise,
        formatDisplayDate(caisse.date),
        caisse.libelle,
        parseFloat(caisse.recette) || 0,
        parseFloat(caisse.depense) || 0,
        caisse.cheque || '-'
      ]);
    });

    // Style des bordures pour le tableau
    const startDataRow = 13; // Après les en-têtes
    const endDataRow = startDataRow + filteredCaises.length;

    for (let i = startDataRow; i <= endDataRow; i++) {
      const row = worksheet.getRow(i);
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    }

    // Format des colonnes numériques
    worksheet.getColumn(4).numFmt = '#,##0.00'; // Recette
    worksheet.getColumn(5).numFmt = '#,##0.00'; // Depense

    // Ajustement des largeurs de colonnes
    worksheet.columns = [
      { width: 15 }, // Code
      { width: 12 }, // Date
      { width: 30 }, // Libellé
      { width: 12 }, // Recette
      { width: 12 }, // Depense
      { width: 15 }  // Chèque
    ];

    // Centrer certaines colonnes
    worksheet.getColumn(1).alignment = { horizontal: 'center' }; // Code
    worksheet.getColumn(2).alignment = { horizontal: 'center' }; // Date
    worksheet.getColumn(4).alignment = { horizontal: 'right' };  // Recette
    worksheet.getColumn(5).alignment = { horizontal: 'right' };  // Depense
    worksheet.getColumn(6).alignment = { horizontal: 'center' }; // Chèque

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Gestion_Caisse_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('Export Excel généré avec succès', 'success');
  } catch (error) {
    console.error('Erreur export Excel:', error);
    showToast('Erreur lors de la génération du fichier Excel', 'danger');
  }
};
  const printTable = () => {
    const printContent = `
      <html>
        <head><title>Gestion de Caisse</title>
          <style>
            body { font-family: Arial; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 20px; }
            .summary { margin-bottom: 20px; padding: 10px; background-color: #f8f9fa; border-radius: 5px; }
            .summary-item { display: inline-block; margin-right: 20px; }
            .positive { color: green; }
            .negative { color: red; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Gestion de Caisse</h2>
            <p>Généré le: ${new Date().toLocaleDateString('fr-FR')}</p>
          </div>
          <div class="summary">
            <h4>Résumé</h4>
            <div class="summary-item"><strong>Total opérations:</strong> ${stats.totalOperations}</div>
            <div class="summary-item"><strong>Total recettes:</strong> ${formatMontant(stats.totalRecette)}</div>
            <div class="summary-item"><strong>Total dépenses:</strong> ${formatMontant(stats.totalDepense)}</div>
            <div class="summary-item"><strong>Solde total:</strong> 
              <span class="${stats.soldeTotal >= 0 ? 'positive' : 'negative'}">${formatMontant(stats.soldeTotal)}</span>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Code</th><th>Date</th><th>Libellé</th><th>Recette</th><th>Depense</th><th>Chèque</th>
              </tr>
            </thead>
            <tbody>
              ${filteredCaises.map(caisse => {
               
                return `
                <tr>
                  <td>${caisse.code_caise}</td>
                  <td>${caisse.date}</td>
                  <td>${caisse.libelle}</td>
                  <td>${caisse.recette}</td>
                  <td>${caisse.depense}</td>
    
                  <td>${caisse.cheque || '-'}</td>
                 
                </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // Composants
  const DateRangeFilter = () => (
    <Row className="mb-3 g-2">
    
    </Row>
  );

  const FilePreview = ({ fileUrl, fileName }) => {
    if (!fileUrl) return null;
    const isImage = fileUrl.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/);
    const isPdf = fileUrl.toLowerCase().endsWith('.pdf');

    return (
      <div className="mt-3 p-3 border rounded">
        <h6>Prévisualisation :</h6>
        {isImage ? (
          <img src={fileUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px' }} className="img-thumbnail" />
        ) : isPdf ? (
          <div className="text-center"><FaFile size={48} className="text-danger" /><p className="mt-2">PDF</p></div>
        ) : (
          <div className="text-center"><FaFile size={48} className="text-primary" /><p className="mt-2">Document</p></div>
        )}
        <div className="mt-2">
          <Button variant="outline-primary" size="sm" onClick={() => window.open(fileUrl, '_blank')} className="me-2">
            <FaEye className="me-1" /> Voir
          </Button>
          <Button variant="outline-success" size="sm" onClick={() => downloadFile(fileUrl, fileName)}>
            <FaDownload className="me-1" /> Télécharger
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="container-fluid py-4">
      <Card className="shadow-lg">
        <Card.Header className="bg-success text-white">
          <Row className="align-items-center">
            <Col md={6}><h3 className="mb-0"><FaMoneyBill className="me-2" />Gestion de Caisse</h3></Col>
            <Col md={6} className="text-end">
              <Button variant="light" onClick={fetchData} disabled={loading} className="me-2">
                <FaSyncAlt className={loading ? "spin" : ""} /><span className="ms-2">Rafraîchir</span>
              </Button>
              <Dropdown className="d-inline-block me-2">
                <Dropdown.Toggle variant="outline-light"><FaFileExport /> Exporter</Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={exportToExcel}><FaFileExport className="me-2" /> Excel</Dropdown.Item>
                  <Dropdown.Item onClick={printTable}><FaPrint className="me-2" /> Imprimer</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              <Button variant="primary" onClick={handleAddCaisse} disabled={loading}>
                <FaPlus className="me-1" />Nouvelle opération
              </Button>
            </Col>
          </Row>
        </Card.Header>
        
        <Card.Body>
          {loading && !data.caises.length ? (
            <div className="text-center my-3"><Spinner animation="border" variant="success" /><p className="mt-2">Chargement...</p></div>
          ) : error ? (
            <Alert variant="danger">
              <FaInfoCircle className="me-2" />{error}
              <Button variant="outline-light" size="sm" className="ms-3" onClick={fetchData}>Réessayer</Button>
            </Alert>
          ) : (
            <>
              <ToastContainer position="top-end" className="p-3">
                {toasts.map(toast => (
                  <Toast key={toast.id} onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} bg={toast.variant} autohide delay={5000}>
                    <Toast.Body className="text-white">{toast.message}</Toast.Body>
                  </Toast>
                ))}
              </ToastContainer>

              {/* Filtres */}
              <Card className="mb-4 shadow-sm">
                <Card.Header className="bg-light"><h5 className="mb-0"><FaFilter className="me-2" /> Filtres</h5></Card.Header>
                <Card.Body>
                  <Row className="g-3">
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Rechercher</Form.Label>
                        <InputGroup>
                          <Form.Control type="text" placeholder="Recherche..." value={filters.searchQuery} onChange={e => setFilters(p => ({ ...p, searchQuery: e.target.value }))} />
                          {filters.searchQuery && (<Button variant="outline-secondary" onClick={() => setFilters(p => ({ ...p, searchQuery: '' }))}><FaTimes /></Button>)}
                        </InputGroup>
                      </Form.Group>
                    </Col>

                      <Col md={4}>
        <Form.Group>
          <Form.Label>Date de début</Form.Label>
          <InputGroup>
            <Form.Control
              type="date"
              value={filters.dateRange.start || ''}
              onChange={e => setFilters(prev => ({
                ...prev, dateRange: { ...prev.dateRange, start: e.target.value }
              }))}
            />
            <InputGroup.Text><FaCalendarAlt /></InputGroup.Text>
          </InputGroup>
        </Form.Group>
      </Col>
      <Col md={4}>
        <Form.Group>
          <Form.Label>Date de fin</Form.Label>
          <InputGroup>
            <Form.Control
              type="date"
              value={filters.dateRange.end || ''}
              onChange={e => setFilters(prev => ({
                ...prev, dateRange: { ...prev.dateRange, end: e.target.value }
              }))}
              min={filters.dateRange.start}
            />
            <InputGroup.Text><FaCalendarAlt /></InputGroup.Text>
          </InputGroup>
        </Form.Group>
      </Col>
                  </Row>
                  <DateRangeFilter />
                </Card.Body>
              </Card>

              {/* Statistiques */}
              <Card className="mb-4 shadow-sm">
                <Card.Body>
                  <h5><FaChartLine className="me-2" /> Statistiques</h5>
                  <Row className="text-center">
                    <Col md={3}><div className="p-3 bg-light rounded"><div className="text-muted small">Total opérations</div><div className="fs-5 fw-bold">{stats.totalOperations}</div></div></Col>
                    <Col md={3}><div className="p-3 bg-success bg-opacity-10 rounded"><div className="text-muted small">Total recettes</div><div className="fs-5 fw-bold text-success">{formatMontant(stats.totalRecette)}</div></div></Col>
                    <Col md={3}><div className="p-3 bg-danger bg-opacity-10 rounded"><div className="text-muted small">Total dépenses</div><div className="fs-5 fw-bold text-danger">{formatMontant(stats.totalDepense)}</div></div></Col>
                    <Col md={3}><div className="p-3 bg-info bg-opacity-10 rounded"><div className="text-muted small">Solde total</div><div className={`fs-5 fw-bold ${stats.soldeTotal >= 0 ? 'text-success' : 'text-danger'}`}>{formatMontant(stats.soldeTotal)}</div></div></Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Tableau */}
              <div className="table-responsive mb-3">
                <Table striped bordered hover className="align-middle">
                  <thead className="table-dark">
                    <tr>
                      <th>Code</th>
                         <th>Date</th>
                      <th>Libellé</th>
                      <th>Recette</th>
                      <th>Depense</th>
                      <th>Chèque</th>
                      <th>Fichier</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCaises.length > 0 ? paginatedCaises.map(caisse => {
                      const type = parseFloat(caisse.recette) > 0 ? 'Recette' : 'Dépense';
                      const montant = parseFloat(caisse.recette) > 0 ? caisse.recetteFormatted : caisse.depenseFormatted;
                      
                      return (
                        <tr key={caisse.id}>
                          <td><Badge bg="secondary">{caisse.code_caise}</Badge></td>
                           <td>{formatDisplayDate(caisse.date)}</td>
                          <td>{caisse.libelle}</td>
                           <td>{caisse.recette}</td> 
               <td>{caisse.depense}</td>
                          
                         

                         
                          <td>{caisse.cheque ? <Badge bg="info">{caisse.cheque}</Badge> : <span className="text-muted">-</span>}</td>
                          <td>
                            {caisse.file_url ? (
                              <div className="btn-group" role="group">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => window.open(caisse.file_url, '_blank')}
                                  className="me-1"
                                >
                                  <FaEye />
                                </Button>
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  onClick={() => downloadFile(caisse.file_url, caisse.libelle)}
                                >
                                  <FaDownload />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-muted">Aucun</span>
                            )}
                          </td>
                          <td>
                            <Button variant="outline-primary" size="sm" onClick={() => handleEditCaisse(caisse)} className="me-2" disabled={loading}><FaEdit /></Button>
                            <Button variant="outline-danger" size="sm" onClick={() => handleDeleteCaisse(caisse)} disabled={loading}><FaTrash /></Button>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan="9" className="text-center py-5 text-muted">Aucune opération trouvée</td></tr>
                    )}
                  </tbody>
                </Table>
              </div>

              {/* Pagination */}
              {filteredCaises.length > pagination.itemsPerPage && (
                <div className="d-flex justify-content-between align-items-center">
                  <div className="text-muted">
                    Affichage de {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} à {Math.min(pagination.currentPage * pagination.itemsPerPage, filteredCaises.length)} sur {filteredCaises.length} opérations
                  </div>
                  <Pagination>
                    <Pagination.First onClick={() => setPagination(p => ({ ...p, currentPage: 1 }))} disabled={pagination.currentPage === 1} />
                    <Pagination.Prev onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage - 1 }))} disabled={pagination.currentPage === 1} />
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (pagination.currentPage <= 3) pageNum = i + 1;
                      else if (pagination.currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = pagination.currentPage - 2 + i;
                      return (<Pagination.Item key={pageNum} active={pageNum === pagination.currentPage} onClick={() => setPagination(p => ({ ...p, currentPage: pageNum }))}>{pageNum}</Pagination.Item>);
                    })}
                    <Pagination.Next onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage + 1 }))} disabled={pagination.currentPage === totalPages} />
                    <Pagination.Last onClick={() => setPagination(p => ({ ...p, currentPage: totalPages }))} disabled={pagination.currentPage === totalPages} />
                  </Pagination>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* Modal Ajout */}
      <Modal show={modals.showAddModal} onHide={() => !loading && setModals(p => ({ ...p, showAddModal: false }))} size="lg" backdrop="static">
        <Modal.Header closeButton><Modal.Title><FaPlus /> Nouvelle opération</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Code caisse *</Form.Label>
                  <Form.Control 
                    type="text" 
                    {...register("code_caise", { required: "Ce champ est obligatoire" })} 
                    isInvalid={!!errors.code_caise} 
                    placeholder="Ex: CAISSE001" 
                  />
                  <Form.Control.Feedback type="invalid">{errors.code_caise?.message}</Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Libellé *</Form.Label>
                  <Form.Control 
                    type="text" 
                    {...register("libelle", { required: "Ce champ est obligatoire" })} 
                    isInvalid={!!errors.libelle} 
                    placeholder="Description" 
                  />
                  <Form.Control.Feedback type="invalid">{errors.libelle?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Type d'opération *</Form.Label>
                  <Form.Select 
                    {...register("type_operation", { required: "Ce champ est obligatoire" })} 
                    isInvalid={!!errors.type_operation}
                  >
                    <option value="">Sélectionnez...</option>
                    <option value="recette">Recette</option>
                    <option value="depense">Dépense</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.type_operation?.message}</Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Montant *</Form.Label>
                  <InputGroup>
                    <Form.Control 
                      type="number" 
                      step="0.01" 
                      {...register("montant", { 
                        required: "Ce champ est obligatoire",
                        min: { value: 0.01, message: "Le montant doit être supérieur à 0" }
                      })} 
                      placeholder="0.00" 
                      isInvalid={!!errors.montant}
                    />
                    <InputGroup.Text>DH</InputGroup.Text>
                  </InputGroup>
                  <Form.Control.Feedback type="invalid">{errors.montant?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date *</Form.Label>
                  <Form.Control 
                    type="date" 
                    {...register("date", { required: "Ce champ est obligatoire" })} 
                    isInvalid={!!errors.date} 
                  />
                  <Form.Control.Feedback type="invalid">{errors.date?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Chèque</Form.Label>
                  <Form.Control 
                    type="text" 
                    {...register("cheque")} 
                    placeholder="Numéro de chèque" 
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Fichier joint</Form.Label>
              <Form.Control 
                type="file" 
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" 
                {...register("file")} 
                onChange={handleFileChange} 
              />
              <Form.Text className="text-muted"><FaFile className="me-1" />Formats: PDF, JPG, PNG, DOC (max 5MB)</Form.Text>
            </Form.Group>
            <FilePreview fileUrl={filePreview} />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModals(p => ({ ...p, showAddModal: false }))} disabled={loading}>Annuler</Button>
          <Button variant="primary" onClick={handleSubmit(data => submitCaisse(data, false))} disabled={loading}>
            {loading ? <Spinner as="span" size="sm" animation="border" /> : 'Enregistrer'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Édition */}
      <Modal show={modals.showEditModal} onHide={() => !loading && setModals(p => ({ ...p, showEditModal: false }))} size="lg" backdrop="static">
        <Modal.Header closeButton><Modal.Title><FaEdit /> Modifier opération</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Code caisse *</Form.Label>
                  <Form.Control 
                    type="text" 
                    {...register("code_caise", { required: "Ce champ est obligatoire" })} 
                    isInvalid={!!errors.code_caise} 
                  />
                  <Form.Control.Feedback type="invalid">{errors.code_caise?.message}</Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Libellé *</Form.Label>
                  <Form.Control 
                    type="text" 
                    {...register("libelle", { required: "Ce champ est obligatoire" })} 
                    isInvalid={!!errors.libelle} 
                  />
                  <Form.Control.Feedback type="invalid">{errors.libelle?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Type d'opération *</Form.Label>
                  <Form.Select 
                    {...register("type_operation", { required: "Ce champ est obligatoire" })} 
                    isInvalid={!!errors.type_operation}
                  >
                    <option value="">Sélectionnez...</option>
                    <option value="recette">Recette</option>
                    <option value="depense">Dépense</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.type_operation?.message}</Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Montant *</Form.Label>
                  <InputGroup>
                    <Form.Control 
                      type="number" 
                      step="0.01" 
                      {...register("montant", { 
                        required: "Ce champ est obligatoire",
                        min: { value: 0.01, message: "Le montant doit être supérieur à 0" }
                      })} 
                      isInvalid={!!errors.montant}
                    />
                    <InputGroup.Text>DH</InputGroup.Text>
                  </InputGroup>
                  <Form.Control.Feedback type="invalid">{errors.montant?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date *</Form.Label>
                  <Form.Control 
                    type="date" 
                    {...register("date", { required: "Ce champ est obligatoire" })} 
                    isInvalid={!!errors.date} 
                  />
                  <Form.Control.Feedback type="invalid">{errors.date?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Chèque</Form.Label>
                  <Form.Control 
                    type="text" 
                    {...register("cheque")} 
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Fichier joint</Form.Label>
              <Form.Control 
                type="file" 
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" 
                {...register("file")} 
                onChange={handleFileChange} 
              />
              <Form.Text className="text-muted"><FaFile className="me-1" />Laisser vide pour conserver le fichier actuel</Form.Text>
            </Form.Group>
            <FilePreview fileUrl={filePreview} />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModals(p => ({ ...p, showEditModal: false }))} disabled={loading}>Annuler</Button>
          <Button variant="primary" onClick={handleSubmit(data => submitCaisse(data, true))} disabled={loading}>
            {loading ? <Spinner as="span" size="sm" animation="border" /> : 'Mettre à jour'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Suppression */}
      <Modal show={modals.showDeleteModal} onHide={() => !loading && setModals(p => ({ ...p, showDeleteModal: false }))} backdrop="static">
        <Modal.Header closeButton><Modal.Title>Confirmer la suppression</Modal.Title></Modal.Header>
        <Modal.Body>
          Êtes-vous sûr de vouloir supprimer cette opération ?<br />
          <strong>Code:</strong> {caisseToDelete && caisseToDelete.code_caise}<br />
          <strong>Libellé:</strong> {caisseToDelete && caisseToDelete.libelle}<br />
          <strong>Date:</strong> {caisseToDelete && formatDisplayDate(caisseToDelete.date)}<br />
          <strong>Montant:</strong> {caisseToDelete && formatMontant(parseFloat(caisseToDelete.recette) > 0 ? caisseToDelete.recette : caisseToDelete.depense)}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModals(p => ({ ...p, showDeleteModal: false }))} disabled={loading}>Annuler</Button>
          <Button variant="danger" onClick={confirmDelete} disabled={loading}>        
            {loading ? <Spinner as="span" size="sm" animation="border" /> : 'Supprimer'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default GestionCaisse;