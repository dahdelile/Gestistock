import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Modal, Button, Form, Spinner, Alert, Badge, Table, Container,
  Row, Col, InputGroup, Dropdown, DropdownButton, Card, Tab, Tabs,
  Toast, ToastContainer, FloatingLabel, Accordion
} from "react-bootstrap";
import {
  FaFilter, FaSearch, FaPlus, FaEdit, FaTrash, FaFileExcel,
  FaInfoCircle, FaCalendarCheck, FaCarAlt, FaProjectDiagram
} from "react-icons/fa";
import * as XLSX from "xlsx";
import { debounce } from "lodash";

const API_BASE_URL = "https://intranet-attm.com/api";
const FICHEENGINS_ENDPOINT = `${API_BASE_URL}/ficheEngins/`;
const VOITURES_ENDPOINT = `${API_BASE_URL}/voitures/`;
const PROJETS_ENDPOINT = `${API_BASE_URL}/projets/`;

const GestionFicheEngins = () => {
  const initialState = {
    piece: "",
    compteur: 0,
    date_reprise: "",
    statut: "NEUF",
    voiture: "",
    projet: ""
  };

  const [ficheEngins, setFicheEngins] = useState([]);
  const [filteredFicheEngins, setFilteredFicheEngins] = useState([]);
  const [voitures, setVoitures] = useState([]);
  const [projets, setProjets] = useState([]);
  const [formData, setFormData] = useState(initialState);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TOUS");
  const [dateFilter, setDateFilter] = useState("");
  const [activeTab, setActiveTab] = useState("liste");
  const [showToast, setShowToast] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ficheEnginsResponse, voituresResponse, projetsResponse] = await Promise.all([
          axios.get(FICHEENGINS_ENDPOINT),
          axios.get(VOITURES_ENDPOINT),
          axios.get(PROJETS_ENDPOINT),
        ]);
        setFicheEngins(ficheEnginsResponse.data);
        setFilteredFicheEngins(ficheEnginsResponse.data);
        setVoitures(voituresResponse.data);
        setProjets(projetsResponse.data);
      } catch (err) {
        handleApiError(err, "Erreur lors du chargement des données");
      } finally {
        setLoading(false);
        setShowToast(true);
      }
    };
    fetchData();
  }, []);

  // Filter and sort ficheEngins when dependencies change
  useEffect(() => {
    filterAndSortFicheEngins();
  }, [searchTerm, statusFilter, dateFilter, ficheEngins, sortConfig]);

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

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filterAndSortFicheEngins = useCallback(() => {
    let result = [...ficheEngins];
    
    // Apply filters
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(ficheEngin => 
        ficheEngin.piece.toLowerCase().includes(term) ||
        (ficheEngin.voiture_details?.matricule?.toLowerCase().includes(term)) ||
        (ficheEngin.projet_details?.name?.toLowerCase().includes(term)))
    }
    
    if (statusFilter !== "TOUS") {
      result = result.filter(ficheEngin => ficheEngin.statut === statusFilter);
    }
    
    if (dateFilter) {
      result = result.filter(ficheEngin => 
        new Date(ficheEngin.date_reprise).toLocaleDateString() === new Date(dateFilter).toLocaleDateString()
      );
    }
    
    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredFicheEngins(result);
  }, [ficheEngins, searchTerm, statusFilter, dateFilter, sortConfig]);

  const debouncedSearch = debounce((term) => {
    setSearchTerm(term);
  }, 300);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.piece || !formData.date_reprise) {
        throw new Error("Les champs pièce et date reprise sont obligatoires");
      }

      const payload = {
        ...formData,
        compteur: parseFloat(formData.compteur),
        voiture: formData.voiture ? parseInt(formData.voiture) : null,
        projet: formData.projet ? parseInt(formData.projet) : null,
      };

      const response = editingId
        ? await axios.put(`${FICHEENGINS_ENDPOINT}${editingId}/`, payload)
        : await axios.post(FICHEENGINS_ENDPOINT, payload);

      setFicheEngins(
        editingId
          ? ficheEngins.map((f) => (f.id === editingId ? response.data : f))
          : [...ficheEngins, response.data]
      );

      setSuccess(`Fiche Engin ${editingId ? "modifiée" : "ajoutée"} avec succès`);
      setShowToast(true);
      handleCloseModal();
    } catch (err) {
      handleApiError(err, "Erreur lors de l'envoi des données");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette fiche ?")) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`${FICHEENGINS_ENDPOINT}${id}/`);
      setFicheEngins(ficheEngins.filter((f) => f.id !== id));
      setSuccess("Fiche supprimée avec succès");
      setShowToast(true);
    } catch (err) {
      handleApiError(err, "Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ficheEngin) => {
    setFormData({
      piece: ficheEngin.piece,
      compteur: ficheEngin.compteur,
      date_reprise: ficheEngin.date_reprise,
      statut: ficheEngin.statut,
      voiture: ficheEngin.voiture?.id?.toString() || ficheEngin.voiture?.toString() || "",
      projet: ficheEngin.projet?.id?.toString() || ficheEngin.projet?.toString() || "",
    });
    setEditingId(ficheEngin.id);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(initialState);
    setError(null);
  };

  const getProjetName = (projetData) => {
    if (!projetData) return "Non attribué";
    if (projetData.name) return projetData.name;
    const projetTrouve = projets.find((p) => p.id === projetData);
    return projetTrouve ? projetTrouve.name : "Non attribué";
  };

  const getVoitureInfo = (voitureData) => {
    if (!voitureData) return "Non attribuée";
    if (voitureData.matricule) return voitureData.matricule;
    const voitureTrouvee = voitures.find((v) => v.id === voitureData);
    return voitureTrouvee ? voitureTrouvee.matricule : "Non attribuée";
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("TOUS");
    setDateFilter("");
    setSortConfig({ key: null, direction: 'asc' });
  };

  const getStatusCount = (status) => {
    return ficheEngins.filter(f => f.statut === status).length;
  };

  const exportToExcel = async () => {
    if (!window.confirm("Voulez-vous exporter les données filtrées vers Excel ?")) {
      return;
    }

    try {
      setExportLoading(true);
      
      const dataToExport = filteredFicheEngins.map(ficheEngin => ({
        "Type": getVoitureInfo(ficheEngin.voiture_details || ficheEngin.voiture),
        "Date": new Date(ficheEngin.date_reprise).toLocaleDateString('fr-FR'),
        "Travaux Effectué": ficheEngin.piece,
        "lieu": getProjetName(ficheEngin.projet_details || ficheEngin.projet),
        "PDR/NEUF/RECU": ficheEngin.statut,
        "COMPTEUR": ficheEngin.compteur || ""
      }));
    
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      
      const wscols = [
        {wch: 8},  // Type
        {wch: 12}, // Date
        {wch: 35}, // Travaux Effectué
        {wch: 10}, // lieu
        {wch: 12}, // PDR/NEUF/RECU
        {wch: 10}  // COMPTEUR
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
          
          if([0, 1, 4].includes(C)) {
            ws[cell].s.alignment = { horizontal: "center" };
          }
        }
      }
      
      XLSX.utils.book_append_sheet(wb, ws, "Fiches de Vie");
      XLSX.writeFile(wb, `fiche_de_vie_${new Date().toISOString().slice(0,10)}.xlsx`);
      
      setSuccess("Export Excel réussi");
      setShowToast(true);
    } catch (error) {
      handleApiError(error, "Erreur lors de l'export Excel");
    } finally {
      setExportLoading(false);
    }
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

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
            <FaInfoCircle className="me-2" />
            Gestion des fiches de vie des engins
          </h2>
          <p className="text-center text-muted">
            Suivi et gestion du cycle de vie des pièces et engins
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
            <Tab eventKey="liste" title="Liste des fiches">
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
                  <Col md={4}>
                    <InputGroup>
                      <InputGroup.Text>
                        <FaSearch />
                      </InputGroup.Text>
                      <Form.Control
                        placeholder="Rechercher pièce, voiture ou projet..."
                        onChange={(e) => debouncedSearch(e.target.value)}
                        defaultValue={searchTerm}
                      />
                    </InputGroup>
                  </Col>
                  
                  <Col md={3}>
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
                  
                  <Col md={3}>
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
                      Total: {ficheEngins.length}
                    </Badge>
                    <Badge bg="info" className="me-2">
                      Filtre: {filteredFicheEngins.length}
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
                      disabled={loading}
                    >
                      <FaPlus className="me-2" /> Nouvelle fiche
                    </Button>
                    <Button 
                      variant="outline-success" 
                      onClick={exportToExcel}
                      disabled={exportLoading || filteredFicheEngins.length === 0}
                    >
                      {exportLoading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Export...
                        </>
                      ) : (
                        <>
                          <FaFileExcel className="me-2" /> Export Excel
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {loading && ficheEngins.length === 0 ? (
                  <div className="text-center my-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2">Chargement en cours...</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table striped bordered hover className="mt-4">
                      <thead className="table-dark">
                        <tr>
                          <th onClick={() => requestSort('date_reprise')}>
                            Date {getSortIndicator('date_reprise')}
                          </th>
                          <th onClick={() => requestSort('voiture')}>
                            Voiture {getSortIndicator('voiture')}
                          </th>
                          <th onClick={() => requestSort('projet')}>
                            Projet {getSortIndicator('projet')}
                          </th>
                          <th onClick={() => requestSort('piece')}>
                            Pièce {getSortIndicator('piece')}
                          </th>
                          <th onClick={() => requestSort('compteur')}>
                            Compteur {getSortIndicator('compteur')}
                          </th>
                          <th onClick={() => requestSort('statut')}>
                            Statut {getSortIndicator('statut')}
                          </th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredFicheEngins.length > 0 ? (
                          filteredFicheEngins.map((ficheEngin) => (
                            <tr key={ficheEngin.id}>
                              <td>
                                <FaCalendarCheck className="me-2" />
                                {new Date(ficheEngin.date_reprise).toLocaleDateString()}
                              </td>
                              <td>
                                <FaCarAlt className="me-2" />
                                {getVoitureInfo(ficheEngin.voiture_details || ficheEngin.voiture)}
                              </td>
                              <td>
                                <FaProjectDiagram className="me-2" />
                                {getProjetName(ficheEngin.projet_details || ficheEngin.projet)}
                              </td>
                              <td>{ficheEngin.piece}</td>
                              <td>{ficheEngin.compteur}</td>
                              <td>
                                <Badge bg={
                                  ficheEngin.statut === 'NEUF' ? 'info' :
                                  ficheEngin.statut === 'RECUPERE' ? 'warning' :
                                  'secondary'
                                }>
                                  {ficheEngin.statut}
                                </Badge>
                              </td>
                              <td>
                                <Button
                                  variant="outline-warning"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => handleEdit(ficheEngin)}
                                  disabled={loading}
                                  aria-label="Modifier"
                                >
                                  <FaEdit /> 
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDelete(ficheEngin.id)}
                                  disabled={loading}
                                  aria-label="Supprimer"
                                >
                                  <FaTrash />
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="7" className="text-center text-muted py-4">
                              Aucune fiche trouvée avec les critères actuels
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                )}
              </div>
            </Tab>
            <Tab eventKey="stats" title="Statistiques">
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
                    <Accordion.Header>Répartition par projet</Accordion.Header>
                    <Accordion.Body>
                      <Table striped bordered hover>
                        <thead>
                          <tr>
                            <th>Projet</th>
                            <th>Nombre de fiches</th>
                            <th>Pourcentage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {projets.map(projet => {
                            const count = ficheEngins.filter(f => f.projet === projet.id || f.projet_details?.id === projet.id).length;
                            const percentage = ficheEngins.length > 0 ? ((count / ficheEngins.length) * 100).toFixed(1) : 0;
                            return (
                              <tr key={projet.id}>
                                <td>{projet.name}</td>
                                <td>{count}</td>
                                <td>{percentage}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </Accordion.Body>
                  </Accordion.Item>
                  <Accordion.Item eventKey="1">
                    <Accordion.Header>Répartition par voiture</Accordion.Header>
                    <Accordion.Body>
                      <Table striped bordered hover>
                        <thead>
                          <tr>
                            <th>Voiture</th>
                            <th>Nombre de fiches</th>
                            <th>Pourcentage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {voitures.map(voiture => {
                            const count = ficheEngins.filter(f => f.voiture === voiture.id || f.voiture_details?.id === voiture.id).length;
                            const percentage = ficheEngins.length > 0 ? ((count / ficheEngins.length) * 100).toFixed(1) : 0;
                            return (
                              <tr key={voiture.id}>
                                <td>{voiture.matricule}</td>
                                <td>{count}</td>
                                <td>{percentage}%</td>
                              </tr>
                            );
                          })}
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
            {editingId ? "Modifier" : "Ajouter"} une fiche de vie
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <FloatingLabel controlId="floatingPiece" label="Pièce *" className="mb-3">
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
            </Row>

            <Row>
              <Col md={6}>
                <FloatingLabel controlId="floatingVoiture" label="Voiture assignée" className="mb-3">
                  <Form.Select
                    name="voiture"
                    value={formData.voiture}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="">Sélectionnez une voiture</option>
                    {voitures.map((voiture) => (
                      <option key={voiture.id} value={voiture.id}>
                        {voiture.matricule}
                      </option>
                    ))}
                  </Form.Select>
                </FloatingLabel>
              </Col>
              
              <Col md={6}>
                <FloatingLabel controlId="floatingProjet" label="Projet assigné" className="mb-3">
                  <Form.Select
                    name="projet"
                    value={formData.projet}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="">Sélectionnez un projet</option>
                    {projets.map((projet) => (
                      <option key={projet.id} value={projet.id}>
                        {projet.name}
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

export default GestionFicheEngins;