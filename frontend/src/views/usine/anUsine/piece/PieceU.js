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
  FaMoneyBillWave, FaShoppingCart, FaChartPie
} from "react-icons/fa";
import * as XLSX from "xlsx";

const API_BASE_URL = "https://intranet-attm.com/api";
const PIECES_ENDPOINT = `${API_BASE_URL}/pieces/`;
const USINES_ENDPOINT = `${API_BASE_URL}/usines/`;

const GestionPieces = () => {
  const initialState = {
    piece: "",
    compteur: 0,
    quantite: 1,
    date_reprise: "",
    statut: "NEUF",
    usine: "",
  };

  const [pieces, setPieces] = useState([]);
  const [filteredPieces, setFilteredPieces] = useState([]);
  const [usines, setUsines] = useState([]);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [piecesResponse, usinesResponse] = await Promise.all([
          axios.get(PIECES_ENDPOINT),
          axios.get(USINES_ENDPOINT),
        ]);
        setPieces(piecesResponse.data);
        setFilteredPieces(piecesResponse.data);
        setUsines(usinesResponse.data);
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
  }, [searchTerm, statusFilter, dateFilter, pieces]);

  const filterPieces = () => {
    let result = pieces;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(piece => 
        piece.piece.toLowerCase().includes(term) ||
        (piece.usine_details?.matricule?.toLowerCase().includes(term))
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
    
    setFilteredPieces(result);
  };

  // Calcul des statistiques de consommation
  const getStatistiquesConsommation = () => {
    const stats = {
      piecesParUsine: {},
      piecesParType: {},
      usinePlusConsommatrice: { nom: "", quantite: 0 },
      piecePlusUtilisee: { nom: "", quantite: 0 },
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
      const usine = getUsineInfo(piece.usine_details || piece.usine);

      // Consommation par usine
      if (!stats.piecesParUsine[usine]) {
        stats.piecesParUsine[usine] = { quantite: 0 };
      }
      stats.piecesParUsine[usine].quantite += quantite;

      // Consommation par type de pièce
      const typePiece = piece.piece;
      if (!stats.piecesParType[typePiece]) {
        stats.piecesParType[typePiece] = { quantite: 0 };
      }
      stats.piecesParType[typePiece].quantite += quantite;

      // Usine la plus consommatrice
      if (stats.piecesParUsine[usine].quantite > stats.usinePlusConsommatrice.quantite) {
        stats.usinePlusConsommatrice = { nom: usine, quantite: stats.piecesParUsine[usine].quantite };
      }

      // Pièce la plus utilisée
      if (stats.piecesParType[typePiece].quantite > stats.piecePlusUtilisee.quantite) {
        stats.piecePlusUtilisee = { nom: typePiece, quantite: stats.piecesParType[typePiece].quantite };
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
        compteur: parseFloat(formData.compteur) || 0,
        quantite: parseInt(formData.quantite) || 1,
        usine: formData.usine ? parseInt(formData.usine) : null,
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
      compteur: piece.compteur,
      quantite: piece.quantite || 1,
      date_reprise: piece.date_reprise,
      statut: piece.statut,
      usine: piece.usine?.id?.toString() || piece.usine?.toString() || "",
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

  const getUsineInfo = (usineData) => {
    if (!usineData) return "Non attribuée";
    if (usineData.matricule) return usineData.matricule;
    const usineTrouvee = usines.find((u) => u.id === usineData);
    return usineTrouvee ? usineTrouvee.matricule : "Non attribuée";
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("TOUS");
    setDateFilter("");
    setDateDebut("");
    setDateFin("");
  };

  const getStatusCount = (status) => {
    return pieces.filter(p => p.statut === status).length;
  };

  const exportToExcel = () => {
    const dataToExport = filteredPieces.map(piece => ({
      "Pièce": piece.piece,
      "Date Reprise": new Date(piece.date_reprise).toLocaleDateString('fr-FR'),
      "Usine": getUsineInfo(piece.usine_details || piece.usine),
      "Statut": piece.statut,
      "Quantité": piece.quantite || 1,
      "Compteur": piece.compteur || ""
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    
    const wscols = [
      {wch: 25},  // Pièce
      {wch: 12},  // Date Reprise
      {wch: 15},  // Usine
      {wch: 12},  // Statut
      {wch: 10},  // Quantité
      {wch: 12},  // Compteur
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
        
        if([1, 3, 4, 5].includes(C)) {
          ws[cell].s.alignment = { horizontal: "center" };
        }
      }
    }
    
    XLSX.utils.book_append_sheet(wb, ws, "Pieces");
    XLSX.writeFile(wb, `gestion_pieces_${new Date().toISOString().slice(0,10)}.xlsx`);
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
            Gestion des Pièces et Consommation
          </h2>
          <p className="text-center text-muted">
            Suivi et analyse de la consommation des pièces par usine
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
            <Tab eventKey="liste" title="Liste des pièces">
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
                        placeholder="Rechercher pièce ou usine..."
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
                          <th>Usine</th>
                          <th>Pièce</th>
                          <th>Quantité</th>
                          <th>Statut</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPieces.length > 0 ? (
                          filteredPieces.map((piece) => (
                            <tr key={piece.id}>
                              <td>
                                <FaCalendarCheck className="me-2" />
                                {new Date(piece.date_reprise).toLocaleDateString()}
                              </td>
                              <td>
                                <FaIndustry className="me-2" />
                                {getUsineInfo(piece.usine_details || piece.usine)}
                              </td>
                              <td>{piece.piece}</td>
                              <td className="text-center">{piece.quantite || 1}</td>
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
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center text-muted py-4">
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

            <Tab eventKey="consommation" title="Consommation">
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
                  <Col md={4}>
                    <Card className="border-success">
                      <Card.Body className="text-center">
                        <h4 className="text-success">
                          {Object.values(stats.piecesParUsine).reduce((total, usine) => total + usine.quantite, 0)}
                        </h4>
                        <p className="text-muted mb-0">Quantité totale</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="border-info">
                      <Card.Body className="text-center">
                        <h4 className="text-info">{stats.usinePlusConsommatrice.nom}</h4>
                        <p className="text-muted mb-0">Usine la plus consommatrice</p>
                        <small>{stats.usinePlusConsommatrice.quantite} pièces</small>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
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
                        Consommation par Usine
                      </Card.Header>
                      <Card.Body>
                        <Table striped bordered hover>
                          <thead>
                            <tr>
                              <th>Usine</th>
                              <th>Quantité</th>
                              <th>% du total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(stats.piecesParUsine)
                              .sort(([,a], [,b]) => b.quantite - a.quantite)
                              .map(([usine, data]) => {
                                const totalQuantite = Object.values(stats.piecesParUsine).reduce((sum, usineData) => sum + usineData.quantite, 0);
                                const pourcentage = totalQuantite > 0 ? ((data.quantite / totalQuantite) * 100).toFixed(1) : 0;
                                return (
                                  <tr key={usine}>
                                    <td>{usine}</td>
                                    <td>{data.quantite}</td>
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

            <Tab eventKey="stats" title="Statistiques de base">
              <div className="mt-3">
                <Row>
                  <Col md={4}>
                    <Card className="mb-4 shadow-sm border-primary">
                      <Card.Body className="text-center">
                        <h3 className="text-primary">{getStatusCount("NEUF")}</h3>
                        <p className="text-muted mb-0">Pièces neuves</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="mb-4 shadow-sm border-warning">
                      <Card.Body className="text-center">
                        <h3 className="text-warning">{getStatusCount("RECUPERE")}</h3>
                        <p className="text-muted mb-0">Pièces récupérées</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="mb-4 shadow-sm border-secondary">
                      <Card.Body className="text-center">
                        <h3 className="text-secondary">{getStatusCount("PDR")}</h3>
                        <p className="text-muted mb-0">Pièces PDR</p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <Accordion className="mb-4">
                  <Accordion.Item eventKey="0">
                    <Accordion.Header>Répartition par usine</Accordion.Header>
                    <Accordion.Body>
                      <Table striped bordered hover>
                        <thead>
                          <tr>
                            <th>Usine</th>
                            <th>Nombre de pièces</th>
                            <th>Pourcentage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usines.map(usine => {
                            const count = pieces.filter(p => p.usine === usine.id || p.usine_details?.id === usine.id).length;
                            const percentage = pieces.length > 0 ? ((count / pieces.length) * 100).toFixed(1) : 0;
                            return (
                              <tr key={usine.id}>
                                <td>{usine.matricule}</td>
                                <td>{count}</td>
                                <td>{percentage}%</td>
                              </tr>
                            );
                          })}
                          <tr>
                            <td><strong>Non attribuées</strong></td>
                            <td><strong>{pieces.filter(p => !p.usine && !p.usine_details).length}</strong></td>
                            <td><strong>{pieces.length > 0 ? ((pieces.filter(p => !p.usine && !p.usine_details).length / pieces.length) * 100).toFixed(1) : 0}%</strong></td>
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
              
              <Col md={6}>
                <FloatingLabel controlId="floatingCompteur" label="Compteur" className="mb-3">
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="compteur"
                    value={formData.compteur}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder=" "
                  />
                </FloatingLabel>
              </Col>
            </Row>

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
                <FloatingLabel controlId="floatingUsine" label="Usine assignée" className="mb-3">
                  <Form.Select
                    name="usine"
                    value={formData.usine}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="">Sélectionnez une usine</option>
                    {usines.map((usine) => (
                      <option key={usine.id} value={usine.id}>
                        {usine.matricule}
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

export default GestionPieces;