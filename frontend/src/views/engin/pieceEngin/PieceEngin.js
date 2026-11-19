import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Modal, Button, Form, Spinner, Alert, Badge, Table, Container,
  Row, Col, InputGroup, Dropdown, DropdownButton, Card, Tab, Tabs,
  Toast, ToastContainer, FloatingLabel, Accordion
} from "react-bootstrap";
import {
  FaFilter, FaSearch, FaPlus, FaEdit, FaTrash, FaFileExcel,
  FaInfoCircle, FaCalendarCheck, FaIndustry, FaBox, FaChartBar,
  FaMoneyBillWave, FaShoppingCart, FaChartPie, FaCar, FaWarehouse
} from "react-icons/fa";
import * as XLSX from "xlsx";

const API_BASE_URL = "https://intranet-attm.com/api";
const PIECES_ENDPOINT = `${API_BASE_URL}/pieceEngins/`;
const ENGINS_ENDPOINT = `${API_BASE_URL}/engins/`;

const GestionPieceEngins = () => {
  const initialState = {
    piece: "",
    quantite: 1,
    quantite_stock: 0,
    date_reprise: "",
    statut: "NEUF",
    engin: "",
  };

  const [pieces, setPieces] = useState([]);
  const [filteredPieces, setFilteredPieces] = useState([]);
  const [engins, setEngins] = useState([]);
  const [formData, setFormData] = useState(initialState);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TOUS");
  const [dateFilter, setDateFilter] = useState("");
  const [activeTab, setActiveTab] = useState("liste");
  const [showToast, setShowToast] = useState(false);
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [stockFilter, setStockFilter] = useState("TOUS");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [piecesResponse, enginsResponse] = await Promise.all([
          axios.get(PIECES_ENDPOINT),
          axios.get(ENGINS_ENDPOINT),
        ]);
        setPieces(piecesResponse.data);
        setFilteredPieces(piecesResponse.data);
        setEngins(enginsResponse.data);
      } catch (err) {
        handleApiError(err, "Erreur lors du chargement des données");
      } finally {
        setLoading(false);
        setShowToast(true);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    filterPieces();
  }, [searchTerm, statusFilter, dateFilter, stockFilter, pieces]);

  const filterPieces = () => {
    let result = pieces;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(piece => 
        piece.piece.toLowerCase().includes(term) ||
        (piece.engin_details?.matricule?.toLowerCase().includes(term))
      );
    }
    
    if (statusFilter !== "TOUS") {
      result = result.filter(piece => piece.statut === statusFilter);
    }
    
    if (dateFilter) {
      result = result.filter(piece => 
        new Date(piece.date_reprise).toLocaleDateString() === new Date(dateFilter).toLocaleDateString()
      );
    }

    if (stockFilter !== "TOUS") {
      result = result.filter(piece => {
        const stock = parseInt(piece.quantite_stock) || 0;
        switch(stockFilter) {
          case "STOCK_FAIBLE":
            return stock > 0 && stock <= 5;
          case "STOCK_MOYEN":
            return stock > 5 && stock <= 20;
          case "STOCK_ELEVE":
            return stock > 20;
          case "RUPTURE":
            return stock === 0;
          default:
            return true;
        }
      });
    }
    
    setFilteredPieces(result);
  };

  // Calcul des statistiques de consommation
  const getStatistiquesConsommation = () => {
    const stats = {
      piecesParEngin: {},
      piecesParType: {},
      enginPlusConsommateur: { nom: "", quantite: 0 },
      piecePlusUtilisee: { nom: "", quantite: 0 },
      stockTotal: 0,
      piecesEnRupture: 0,
      piecesStockFaible: 0,
      periodeStats: { debut: dateDebut, fin: dateFin }
    };

    let piecesFiltrees = pieces;

    // Filtrage par période si dates spécifiées
    if (dateDebut && dateFin) {
      piecesFiltrees = pieces.filter(piece => {
        const datePiece = new Date(piece.date_reprise);
        const debut = new Date(dateDebut);
        const fin = new Date(dateFin);
        return datePiece >= debut && datePiece <= fin;
      });
    }

    piecesFiltrees.forEach(piece => {
      const quantite = parseInt(piece.quantite) || 1;
      const quantiteStock = parseInt(piece.quantite_stock) || 0;
      const engin = getEnginInfo(piece.engin_details || piece.engin);

      // Consommation par engin
      if (!stats.piecesParEngin[engin]) {
        stats.piecesParEngin[engin] = { quantite: 0, stock: 0 };
      }
      stats.piecesParEngin[engin].quantite += quantite;
      stats.piecesParEngin[engin].stock += quantiteStock;

      // Consommation par type de pièce
      const typePiece = piece.piece;
      if (!stats.piecesParType[typePiece]) {
        stats.piecesParType[typePiece] = { quantite: 0, stock: 0 };
      }
      stats.piecesParType[typePiece].quantite += quantite;
      stats.piecesParType[typePiece].stock += quantiteStock;

      // Engin le plus consommateur
      if (stats.piecesParEngin[engin].quantite > stats.enginPlusConsommateur.quantite) {
        stats.enginPlusConsommateur = { nom: engin, quantite: stats.piecesParEngin[engin].quantite };
      }

      // Pièce la plus utilisée
      if (stats.piecesParType[typePiece].quantite > stats.piecePlusUtilisee.quantite) {
        stats.piecePlusUtilisee = { nom: typePiece, quantite: stats.piecesParType[typePiece].quantite };
      }

      // Statistiques de stock
      stats.stockTotal += quantiteStock;
      if (quantiteStock === 0) {
        stats.piecesEnRupture++;
      } else if (quantiteStock <= 5) {
        stats.piecesStockFaible++;
      }
    });

    return stats;
  };

  const handleApiError = (error, defaultMessage) => {
    console.error("Erreur API:", error);
    const errorMessage =
      error.response?.data?.detail ||
      error.response?.data ||
      error.message ||
      defaultMessage;
    setError(errorMessage);
    setShowToast(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.piece || !formData.date_reprise || !formData.quantite) {
        throw new Error("Les champs pièce, date reprise et quantité sont obligatoires");
      }

      if (formData.quantite < 1) {
        throw new Error("La quantité doit être au moins de 1");
      }

      const payload = {
        ...formData,
        quantite: parseInt(formData.quantite) || 1,
        quantite_stock: parseInt(formData.quantite_stock) || 0,
        engin: formData.engin ? parseInt(formData.engin) : null,
      };

      const response = editingId
        ? await axios.put(`${PIECES_ENDPOINT}${editingId}/`, payload)
        : await axios.post(PIECES_ENDPOINT, payload);

      setPieces(
        editingId
          ? pieces.map((p) => (p.id === editingId ? response.data : p))
          : [...pieces, response.data]
      );

      setSuccess(`Pièce ${editingId ? "modifiée" : "ajoutée"} avec succès`);
      setShowToast(true);
      handleCloseModal();
    } catch (err) {
      handleApiError(err, "Erreur lors de l'envoi des données");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette pièce ?")) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`${PIECES_ENDPOINT}${id}/`);
      setPieces(pieces.filter((p) => p.id !== id));
      setSuccess("Pièce supprimée avec succès");
      setShowToast(true);
    } catch (err) {
      handleApiError(err, "Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (piece) => {
    setFormData({
      piece: piece.piece,
      quantite: piece.quantite || 1,
      quantite_stock: piece.quantite_stock || 0,
      date_reprise: piece.date_reprise,
      statut: piece.statut,
      engin: piece.engin?.id?.toString() || piece.engin?.toString() || "",
    });
    setEditingId(piece.id);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(initialState);
    setError(null);
  };

  const getEnginInfo = (enginData) => {
    if (!enginData) return "Non attribué";
    if (enginData.matricule) return enginData.matricule;
    const enginTrouve = engins.find((e) => e.id === enginData);
    return enginTrouve ? enginTrouve.matricule : "Non attribué";
  };

  const getEnginDetails = (enginData) => {
    if (!enginData) return { matricule: "Non attribué", type: "" };
    if (enginData.matricule) return enginData;
    const enginTrouve = engins.find((e) => e.id === enginData);
    return enginTrouve ? enginTrouve : { matricule: "Non attribué", type: "" };
  };

  const getStockBadgeVariant = (quantiteStock) => {
    const stock = parseInt(quantiteStock) || 0;
    if (stock === 0) return "danger";
    if (stock <= 5) return "warning";
    if (stock <= 20) return "info";
    return "success";
  };

  const getStockText = (quantiteStock) => {
    const stock = parseInt(quantiteStock) || 0;
    if (stock === 0) return "Rupture";
    if (stock <= 5) return "Faible";
    if (stock <= 20) return "Moyen";
    return "Élevé";
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("TOUS");
    setDateFilter("");
    setStockFilter("TOUS");
    setDateDebut("");
    setDateFin("");
  };

  const getStatusCount = (status) => {
    return pieces.filter(p => p.statut === status).length;
  };

  const getStockCount = (type) => {
    return pieces.filter(piece => {
      const stock = parseInt(piece.quantite_stock) || 0;
      switch(type) {
        case "RUPTURE":
          return stock === 0;
        case "STOCK_FAIBLE":
          return stock > 0 && stock <= 5;
        case "STOCK_MOYEN":
          return stock > 5 && stock <= 20;
        case "STOCK_ELEVE":
          return stock > 20;
        default:
          return false;
      }
    }).length;
  };

  const exportToExcel = () => {
    const dataToExport = filteredPieces.map(piece => {
      const enginInfo = getEnginDetails(piece.engin_details || piece.engin);
      const stock = parseInt(piece.quantite_stock) || 0;
      return {
        "Pièce": piece.piece,
        "Date Reprise": new Date(piece.date_reprise).toLocaleDateString('fr-FR'),
        "Engin": enginInfo.matricule,
        "Type Engin": enginInfo.type_engin_display || enginInfo.type_engin || "",
        "Statut": piece.statut,
        "Quantité": piece.quantite || 1,
        "Stock": stock,
        "Niveau Stock": getStockText(stock)
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    
    const wscols = [
      {wch: 25},  // Pièce
      {wch: 12},  // Date Reprise
      {wch: 15},  // Engin
      {wch: 20},  // Type Engin
      {wch: 12},  // Statut
      {wch: 10},  // Quantité
      {wch: 10},  // Stock
      {wch: 15},  // Niveau Stock
    ];
    ws['!cols'] = wscols;
    
    const headerStyle = {
      font: { bold: true, color: { rgb: "000000" } },
      fill: { fgColor: { rgb: "D9D9D9" } },
      alignment: { horizontal: "center" }
    };
    
    const range = XLSX.utils.decode_range(ws['!ref']);
    for(let C = range.s.c; C <= range.e.c; ++C) {
      const headerCell = XLSX.utils.encode_cell({r: range.s.r, c: C});
      if(!ws[headerCell]) continue;
      ws[headerCell].s = headerStyle;
    }
    
    for(let R = range.s.r; R <= range.e.r; ++R) {
      for(let C = range.s.c; C <= range.e.c; ++C) {
        const cell = XLSX.utils.encode_cell({r: R, c: C});
        if(!ws[cell]) continue;
        ws[cell].s = ws[cell].s || {};
        ws[cell].s.border = {
          top: {style: "thin", color: {rgb: "000000"}},
          bottom: {style: "thin", color: {rgb: "000000"}},
          left: {style: "thin", color: {rgb: "000000"}},
          right: {style: "thin", color: {rgb: "000000"}}
        };
        
        if([1, 3, 4, 5, 6, 7].includes(C)) {
          ws[cell].s.alignment = { horizontal: "center" };
        }
      }
    }
    
    XLSX.utils.book_append_sheet(wb, ws, "Pieces");
    XLSX.writeFile(wb, `gestion_pieces_engins_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const stats = getStatistiquesConsommation();

  return (
    <Container fluid className="py-4">
      <ToastContainer position="top-end" className="p-3">
        <Toast 
          show={showToast} 
          onClose={() => setShowToast(false)} 
          delay={5000} 
          autohide
          bg={error ? "danger" : success ? "success" : "info"}
        >
          <Toast.Header>
            <strong className="me-auto">Notification</strong>
          </Toast.Header>
          <Toast.Body className="text-white">
            {error || success || "Opération réussie"}
          </Toast.Body>
        </Toast>
      </ToastContainer>

      <Row className="mb-4">
        <Col>
          <h2 className="text-center mb-3">
            <FaBox className="me-2" />
            Gestion des Pièces de Rechange - Engins
          </h2>
          <p className="text-center text-muted">
            Suivi et analyse de la consommation des pièces par engin avec gestion de stock
          </p>
        </Col>
      </Row>

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-3"
          >
            <Tab eventKey="liste" title="📋 Liste des pièces">
              <div className="mt-3">
                {error && (
                  <Alert variant="danger" onClose={() => setError(null)} dismissible>
                    {error}
                  </Alert>
                )}
                {success && (
                  <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
                    {success}
                  </Alert>
                )}

                <Row className="mb-4 g-3">
                  <Col md={3}>
                    <InputGroup>
                      <InputGroup.Text>
                        <FaSearch />
                      </InputGroup.Text>
                      <Form.Control
                        placeholder="Rechercher pièce ou engin..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </InputGroup>
                  </Col>
                  
                  <Col md={2}>
                    <DropdownButton
                      variant="outline-secondary"
                      title={`Statut: ${statusFilter}`}
                      onSelect={(e) => setStatusFilter(e)}
                    >
                      <Dropdown.Item eventKey="TOUS">Tous les statuts</Dropdown.Item>
                      <Dropdown.Item eventKey="NEUF">Neuf ({getStatusCount("NEUF")})</Dropdown.Item>
                      <Dropdown.Item eventKey="RECUPERE">Récupéré ({getStatusCount("RECUPERE")})</Dropdown.Item>
                      <Dropdown.Item eventKey="PDR">PDR ({getStatusCount("PDR")})</Dropdown.Item>
                    </DropdownButton>
                  </Col>

                  <Col md={2}>
                    <DropdownButton
                      variant="outline-info"
                      title={`Stock: ${stockFilter === "TOUS" ? "Tous" : stockFilter.replace("STOCK_", "").toLowerCase()}`}
                      onSelect={(e) => setStockFilter(e)}
                    >
                      <Dropdown.Item eventKey="TOUS">Tous les stocks</Dropdown.Item>
                      <Dropdown.Item eventKey="RUPTURE">Rupture ({getStockCount("RUPTURE")})</Dropdown.Item>
                      <Dropdown.Item eventKey="STOCK_FAIBLE">Faible ({getStockCount("STOCK_FAIBLE")})</Dropdown.Item>
                      <Dropdown.Item eventKey="STOCK_MOYEN">Moyen ({getStockCount("STOCK_MOYEN")})</Dropdown.Item>
                      <Dropdown.Item eventKey="STOCK_ELEVE">Élevé ({getStockCount("STOCK_ELEVE")})</Dropdown.Item>
                    </DropdownButton>
                  </Col>
                  
                  <Col md={2}>
                    <FloatingLabel controlId="floatingDate" label="Filtrer par date">
                      <Form.Control
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                      />
                    </FloatingLabel>
                  </Col>
                  
                  <Col md={2} className="d-flex align-items-center">
                    <Button variant="outline-secondary" onClick={resetFilters}>
                      <FaFilter /> Réinitialiser
                    </Button>
                  </Col>
                </Row>

                <div className="d-flex justify-content-between mb-3">
                  <div>
                    <Badge bg="primary" className="me-2">
                      Total: {pieces.length}
                    </Badge>
                    <Badge bg="info" className="me-2">
                      Filtre: {filteredPieces.length}
                    </Badge>
                    <Badge bg="danger" className="me-2">
                      Rupture: {getStockCount("RUPTURE")}
                    </Badge>
                    <Badge bg="warning" className="me-2">
                      Stock faible: {getStockCount("STOCK_FAIBLE")}
                    </Badge>
                  </div>
                  <div>
                    <Button
                      variant="success"
                      className="me-2"
                      onClick={() => {
                        setFormData(initialState);
                        setEditingId(null);
                        setShowModal(true);
                      }}
                    >
                      <FaPlus className="me-2" /> Nouvelle pièce
                    </Button>
                    <Button variant="outline-success" onClick={exportToExcel}>
                      <FaFileExcel className="me-2" /> Export Excel
                    </Button>
                  </div>
                </div>

                {loading && pieces.length === 0 ? (
                  <div className="text-center my-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2">Chargement en cours...</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table striped bordered hover className="mt-4">
                      <thead className="table-dark">
                        <tr>
                          <th>Date Reprise</th>
                          <th>Engin</th>
                          <th>Type Engin</th>
                          <th>Pièce</th>
                          <th>Quantité</th>
                          <th>Stock</th>
                          <th>Statut</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPieces.length > 0 ? (
                          filteredPieces.map((piece) => {
                            const enginDetails = getEnginDetails(piece.engin_details || piece.engin);
                            const quantiteStock = parseInt(piece.quantite_stock) || 0;
                            return (
                              <tr key={piece.id}>
                                <td>
                                  <FaCalendarCheck className="me-2" />
                                  {new Date(piece.date_reprise).toLocaleDateString()}
                                </td>
                                <td>
                                  <FaCar className="me-2" />
                                  {enginDetails.matricule}
                                </td>
                                <td>
                                  {enginDetails.type_engin_display || enginDetails.type_engin || "Non spécifié"}
                                </td>
                                <td>{piece.piece}</td>
                                <td className="text-center">{piece.quantite || 1}</td>
                                <td className="text-center">
                                  <Badge bg={getStockBadgeVariant(quantiteStock)}>
                                    {quantiteStock} ({getStockText(quantiteStock)})
                                  </Badge>
                                </td>
                                <td>
                                  <Badge bg={
                                    piece.statut === 'NEUF' ? 'info' :
                                    piece.statut === 'RECUPERE' ? 'warning' :
                                    'secondary'
                                  }>
                                    {piece.statut}
                                  </Badge>
                                </td>
                                <td>
                                  <Button
                                    variant="outline-warning"
                                    size="sm"
                                    className="me-2"
                                    onClick={() => handleEdit(piece)}
                                    disabled={loading}
                                  >
                                    <FaEdit /> 
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleDelete(piece.id)}
                                    disabled={loading}
                                  >
                                    <FaTrash />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="8" className="text-center text-muted py-4">
                              Aucune pièce trouvée avec les critères actuels
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                )}
              </div>
            </Tab>

            <Tab eventKey="consommation" title="📊 Consommation">
              <div className="mt-3">
                <Row className="mb-4">
                  <Col md={12}>
                    <Card className="bg-light">
                      <Card.Body>
                        <h5>
                          <FaChartBar className="me-2" />
                          Filtres de période pour les statistiques
                        </h5>
                        <Row>
                          <Col md={4}>
                            <FloatingLabel controlId="floatingDateDebut" label="Date de début">
                              <Form.Control
                                type="date"
                                value={dateDebut}
                                onChange={(e) => setDateDebut(e.target.value)}
                              />
                            </FloatingLabel>
                          </Col>
                          <Col md={4}>
                            <FloatingLabel controlId="floatingDateFin" label="Date de fin">
                              <Form.Control
                                type="date"
                                value={dateFin}
                                onChange={(e) => setDateFin(e.target.value)}
                              />
                            </FloatingLabel>
                          </Col>
                          <Col md={4} className="d-flex align-items-end">
                            <Button 
                              variant="outline-primary" 
                              onClick={() => {
                                setDateDebut("");
                                setDateFin("");
                              }}
                            >
                              Effacer la période
                            </Button>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                {/* Résumé des statistiques */}
                <Row className="mb-4">
                  <Col md={3}>
                    <Card className="border-success">
                      <Card.Body className="text-center">
                        <h4 className="text-success">
                          {Object.values(stats.piecesParEngin).reduce((total, engin) => total + engin.quantite, 0)}
                        </h4>
                        <p className="text-muted mb-0">Quantité totale consommée</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="border-primary">
                      <Card.Body className="text-center">
                        <h4 className="text-primary">{stats.stockTotal}</h4>
                        <p className="text-muted mb-0">Stock total disponible</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="border-info">
                      <Card.Body className="text-center">
                        <h4 className="text-info">{stats.enginPlusConsommateur.nom}</h4>
                        <p className="text-muted mb-0">Engin le plus consommateur</p>
                        <small>{stats.enginPlusConsommateur.quantite} pièces</small>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="border-warning">
                      <Card.Body className="text-center">
                        <h4 className="text-warning">{stats.piecePlusUtilisee.nom}</h4>
                        <p className="text-muted mb-0">Pièce la plus utilisée</p>
                        <small>{stats.piecePlusUtilisee.quantite} unités</small>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Card className="shadow-sm">
                      <Card.Header>
                        <FaChartPie className="me-2" />
                        Consommation par Engin
                      </Card.Header>
                      <Card.Body>
                        <Table striped bordered hover>
                          <thead>
                            <tr>
                              <th>Engin</th>
                              <th>Quantité</th>
                              <th>Stock</th>
                              <th>% du total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(stats.piecesParEngin)
                              .sort(([,a], [,b]) => b.quantite - a.quantite)
                              .map(([engin, data]) => {
                                const totalQuantite = Object.values(stats.piecesParEngin).reduce((sum, enginData) => sum + enginData.quantite, 0);
                                const pourcentage = totalQuantite > 0 ? ((data.quantite / totalQuantite) * 100).toFixed(1) : 0;
                                return (
                                  <tr key={engin}>
                                    <td>{engin}</td>
                                    <td>{data.quantite}</td>
                                    <td>
                                      <Badge bg={getStockBadgeVariant(data.stock)}>
                                        {data.stock}
                                      </Badge>
                                    </td>
                                    <td>{pourcentage}%</td>
                                  </tr>
                                );
                              })
                            }
                          </tbody>
                        </Table>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="shadow-sm">
                      <Card.Header>
                        <FaChartBar className="me-2" />
                        Consommation par Type de Pièce
                      </Card.Header>
                      <Card.Body>
                        <Table striped bordered hover>
                          <thead>
                            <tr>
                              <th>Type de Pièce</th>
                              <th>Quantité</th>
                              <th>Stock</th>
                              <th>% du total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(stats.piecesParType)
                              .sort(([,a], [,b]) => b.quantite - a.quantite)
                              .slice(0, 10)
                              .map(([typePiece, data]) => {
                                const totalQuantite = Object.values(stats.piecesParType).reduce((sum, pieceData) => sum + pieceData.quantite, 0);
                                const pourcentage = totalQuantite > 0 ? ((data.quantite / totalQuantite) * 100).toFixed(1) : 0;
                                return (
                                  <tr key={typePiece}>
                                    <td>{typePiece}</td>
                                    <td>{data.quantite}</td>
                                    <td>
                                      <Badge bg={getStockBadgeVariant(data.stock)}>
                                        {data.stock}
                                      </Badge>
                                    </td>
                                    <td>{pourcentage}%</td>
                                  </tr>
                                );
                              })
                            }
                          </tbody>
                        </Table>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>
            </Tab>

            <Tab eventKey="stats" title="📈 Statistiques de base">
              <div className="mt-3">
                <Row>
                  <Col md={3}>
                    <Card className="mb-4 shadow-sm border-primary">
                      <Card.Body className="text-center">
                        <h3 className="text-primary">{getStatusCount("NEUF")}</h3>
                        <p className="text-muted mb-0">Pièces neuves</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="mb-4 shadow-sm border-warning">
                      <Card.Body className="text-center">
                        <h3 className="text-warning">{getStatusCount("RECUPERE")}</h3>
                        <p className="text-muted mb-0">Pièces récupérées</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="mb-4 shadow-sm border-secondary">
                      <Card.Body className="text-center">
                        <h3 className="text-secondary">{getStatusCount("PDR")}</h3>
                        <p className="text-muted mb-0">Pièces PDR</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="mb-4 shadow-sm border-danger">
                      <Card.Body className="text-center">
                        <h3 className="text-danger">{stats.piecesEnRupture}</h3>
                        <p className="text-muted mb-0">Pièces en rupture</p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <Card className="mb-4 shadow-sm border-success">
                      <Card.Body className="text-center">
                        <h3 className="text-success">{stats.stockTotal}</h3>
                        <p className="text-muted mb-0">Stock total disponible</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="mb-4 shadow-sm border-warning">
                      <Card.Body className="text-center">
                        <h3 className="text-warning">{stats.piecesStockFaible}</h3>
                        <p className="text-muted mb-0">Pièces stock faible</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="mb-4 shadow-sm border-info">
                      <Card.Body className="text-center">
                        <h3 className="text-info">{pieces.length}</h3>
                        <p className="text-muted mb-0">Total pièces</p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <Accordion className="mb-4">
                  <Accordion.Item eventKey="0">
                    <Accordion.Header>Répartition par engin</Accordion.Header>
                    <Accordion.Body>
                      <Table striped bordered hover>
                        <thead>
                          <tr>
                            <th>Engin</th>
                            <th>Type</th>
                            <th>Nombre de pièces</th>
                            <th>Stock total</th>
                            <th>Pourcentage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {engins.map(engin => {
                            const piecesEngin = pieces.filter(p => p.engin === engin.id || p.engin_details?.id === engin.id);
                            const count = piecesEngin.length;
                            const stockTotal = piecesEngin.reduce((sum, piece) => sum + (parseInt(piece.quantite_stock) || 0), 0);
                            const percentage = pieces.length > 0 ? ((count / pieces.length) * 100).toFixed(1) : 0;
                            return (
                              <tr key={engin.id}>
                                <td>{engin.matricule}</td>
                                <td>{engin.type_engin_display || engin.type_engin || "Non spécifié"}</td>
                                <td>{count}</td>
                                <td>
                                  <Badge bg={getStockBadgeVariant(stockTotal)}>
                                    {stockTotal}
                                  </Badge>
                                </td>
                                <td>{percentage}%</td>
                              </tr>
                            );
                          })}
                          <tr>
                            <td><strong>Non attribuées</strong></td>
                            <td><strong>-</strong></td>
                            <td><strong>{pieces.filter(p => !p.engin && !p.engin_details).length}</strong></td>
                            <td><strong>
                              <Badge bg={getStockBadgeVariant(
                                pieces.filter(p => !p.engin && !p.engin_details)
                                  .reduce((sum, piece) => sum + (parseInt(piece.quantite_stock) || 0), 0)
                              )}>
                                {pieces.filter(p => !p.engin && !p.engin_details)
                                  .reduce((sum, piece) => sum + (parseInt(piece.quantite_stock) || 0), 0)}
                              </Badge>
                            </strong></td>
                            <td><strong>{pieces.length > 0 ? ((pieces.filter(p => !p.engin && !p.engin_details).length / pieces.length) * 100).toFixed(1) : 0}%</strong></td>
                          </tr>
                        </tbody>
                      </Table>
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>
              </div>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>
            {editingId ? "Modifier" : "Ajouter"} une pièce
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <FloatingLabel controlId="floatingPiece" label="Nom de la pièce *" className="mb-3">
                  <Form.Control
                    type="text"
                    name="piece"
                    value={formData.piece}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    placeholder=" "
                  />
                </FloatingLabel>
              </Col>
              
              <Col md={6}>
                <FloatingLabel controlId="floatingQuantite" label="Quantité *" className="mb-3">
                  <Form.Control
                    type="number"
                    name="quantite"
                    value={formData.quantite}
                    onChange={handleChange}
                    required
                    min="1"
                    disabled={loading}
                    placeholder=" "
                  />
                </FloatingLabel>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <FloatingLabel controlId="floatingQuantiteStock" label="Quantité en stock *" className="mb-3">
                  <Form.Control
                    type="number"
                    name="quantite_stock"
                    value={formData.quantite_stock}
                    onChange={handleChange}
                    required
                    min="0"
                    disabled={loading}
                    placeholder=" "
                  />
                </FloatingLabel>
              </Col>

              <Col md={6}>
                <FloatingLabel controlId="floatingDate" label="Date reprise *" className="mb-3">
                  <Form.Control
                    type="date"
                    name="date_reprise"
                    value={formData.date_reprise}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    placeholder=" "
                  />
                </FloatingLabel>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <FloatingLabel controlId="floatingStatut" label="Statut *" className="mb-3">
                  <Form.Select
                    name="statut"
                    value={formData.statut}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  >
                    <option value="NEUF">Neuf</option>
                    <option value="RECUPERE">Récupéré</option>
                    <option value="PDR">PDR</option>
                  </Form.Select>
                </FloatingLabel>
              </Col>
              
              <Col md={6}>
                <FloatingLabel controlId="floatingEngin" label="Engin assigné" className="mb-3">
                  <Form.Select
                    name="engin"
                    value={formData.engin}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="">Sélectionnez un engin</option>
                    {engins.map((engin) => (
                      <option key={engin.id} value={engin.id}>
                        {engin.matricule} - {engin.type_engin_display || engin.type_engin || "Non spécifié"}
                      </option>
                    ))}
                  </Form.Select>
                </FloatingLabel>
              </Col>
            </Row>

            <div className="d-flex justify-content-end mt-3">
              <Button
                variant="outline-secondary"
                className="me-2"
                onClick={handleCloseModal}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    En cours...
                  </>
                ) : (
                  "Enregistrer"
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default GestionPieceEngins;