import React, { useState, useEffect } from "react";
import { Container, Table, Button, Modal, Form, Row, Col, Card, Badge } from "react-bootstrap";
import * as XLSX from 'xlsx';

const API_BASE_URL = 'http://localhost:8000/api';

const StructureBudget = () => {
  const moisUI = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  const moisMapping = {
    "Janvier": "janvier",
    "Février": "fevrier",
    "Mars": "mars",
    "Avril": "avril",
    "Mai": "mai",
    "Juin": "juin",
    "Juillet": "juillet",
    "Août": "aout",
    "Septembre": "septembre",
    "Octobre": "octobre",
    "Novembre": "novembre",
    "Décembre": "decembre"
  };

  const [showModal, setShowModal] = useState(false);
  const [selectedSousCategorie, setSelectedSousCategorie] = useState(null);
  const [newMontants, setNewMontants] = useState({});

  const budgetData = [
    {
      categorie: "Main d Œuvre",
      elements: [
        { code: "", label: "Cadres" },
        { code: "", label: "Maitrises" },
        { code: "", label: "O/E" }
      ],
    },
    {
      categorie: "Côut Main d'Œuvre milliers d'UM",
      elements: [
        { code: "101", label: "Renumération Normale" },
        { code: "102", label: "Heures supplémentaires" },
        { code: "103", label: "Frais médicaux" },
        { code: "104", label: "Frais formation / Stagiaires" },
        { code: "199", label: "Autres" },
      ],
    },
    {
      categorie: "Coût Matière en milliers UM",
      elements: [
        { code: "201", label: "Pièces de rechange" },
        { code: "202", label: "Lubrifiants" },
        { code: "203", label: "Pneumatiques" },
        { code: "204", label: "Gasoil" },
        { code: "205", label: "Bitume" },
        { code: "206", label: "Kérosène" },
        { code: "207", label: "Ciment" },
        { code: "208", label: "Bois de coffrage" },
        { code: "209", label: "Autres matières" },
        { code: "210", label: "Variation Stock" },
        { code: "211", label: "Fer à béton" },
        { code: "212", label: "Bureautique" }
      ],
    },
    {
      categorie: "Opérations Diverses (O.D)",
      elements: [
        { code: "301", label: "Matières consommées en O.D" },
        { code: "302", label: "Achat Eau & Electricité" },
        { code: "303", label: "Personnel (MOO)" },
        { code: "304", label: "Soustraitance services" },
        { code: "305", label: "Entretien & Réparation" },
        { code: "306", label: "Location Matèriel transport" },
        { code: "0", label: "Frais de Transport" },
        { code: "307", label: "Assurances" },
        { code: "308", label: "Documents Gen. & Seminaire" },
        { code: "309", label: "Voyages, Mission, Hébergement" },
        { code: "310", label: "Poste & Télécom" },
        { code: "311", label: "Honoraires & Contentieux" },
        { code: "312", label: "Etude Assistance technique, recherche" },
        { code: "313", label: "Frais de recouvrement" },
        { code: "314", label: "Frais commerciaux" },
        { code: "315", label: "Frais conseil & assemblées" },
        { code: "316", label: "Amortissement" },
        { code: "317", label: "Provisions" },
        { code: "318", label: "Dons et Subventions" },
        { code: "319", label: "Frais financiers" },
        { code: "320", label: "Publicité et propagandes" },
        { code: "321", label: "Loyer" },
        { code: "322", label: "Réceptions partenaires" },
        { code: "323", label: "Frais de transit et douanes" },
        { code: "324", label: "Impôt BIC & divers impôts" },
        { code: "326", label: "Redressement Stock" },
        { code: "327", label: "Transport Matieres" },
        { code: "399", label: "Autres charges OD" }
      ],
    },
    {
      categorie: "Produit",
      elements: [{ code: "", label: "Produit" }],
    },
  ];

  const initialFormData = {
    montant: "",
    Janvier: "",
    Février: "",
    Mars: "",
    Avril: "",
    Mai: "",
    Juin: "",
    Juillet: "",
    Août: "",
    Septembre: "",
    Octobre: "",
    Novembre: "",
    Décembre: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/budgets/`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const budgets = await res.json();
      const montants = {};
      budgets.forEach(b => {
        montants[b.sous_category] = {
          montant: b.montant_sous_category ? parseFloat(b.montant_sous_category) : 0,
          Janvier: parseFloat(b.janvier) || 0,
          Février: parseFloat(b.fevrier) || 0,
          Mars: parseFloat(b.mars) || 0,
          Avril: parseFloat(b.avril) || 0,
          Mai: parseFloat(b.mai) || 0,
          Juin: parseFloat(b.juin) || 0,
          Juillet: parseFloat(b.juillet) || 0,
          Août: parseFloat(b.aout) || 0,
          Septembre: parseFloat(b.septembre) || 0,
          Octobre: parseFloat(b.octobre) || 0,
          Novembre: parseFloat(b.novembre) || 0,
          Décembre: parseFloat(b.decembre) || 0,
          category: b.category,
          code: b.code || ""
        };
      });
      setNewMontants(montants);
    } catch (err) {
      console.error("Erreur chargement:", err);
      alert("❌ Impossible de charger les données.");
    }
  };

  const handleOpenModal = (sousCategorie) => {
    setSelectedSousCategorie(sousCategorie);
    const existing = newMontants[sousCategorie] || {};
    const filledData = {};
    Object.keys(initialFormData).forEach(key => {
      filledData[key] = existing[key]?.toString() || "";
    });
    setFormData(filledData);
    setShowModal(true);
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const getApiData = () => {
    let category = "Opérations Diverses (O.D)";
    const el = selectedSousCategorie;

    // Trouver le code et la catégorie correspondante
    let code = "";
    budgetData.forEach(cat => {
      const element = cat.elements.find(item => item.label === el);
      if (element) {
        code = element.code;
        category = cat.categorie;
      }
    });

    const apiData = {
      category,
      sous_category: el,
      code: code,
      montant_sous_category: formData.montant || "0",
    };

    moisUI.forEach(moisNom => {
      const champApi = moisMapping[moisNom];
      apiData[champApi] = parseFloat(formData[moisNom]) || 0;
    });

    return apiData;
  };

  const saveToApi = async (apiData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/budgets/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      });

      if (response.ok) {
        alert("✅ Enregistré !");
        await fetchBudgets();
        setShowModal(false);
        setFormData(initialFormData);
      } else {
        const error = await response.json();
        console.error("Erreur API:", error);
        alert("❌ Erreur : " + JSON.stringify(error, null, 2));
      }
    } catch (err) {
      console.error("Erreur réseau:", err);
      alert("❌ Impossible de joindre le serveur Django.");
    }
  };

  const handleSaveMontant = async () => {
    if (!selectedSousCategorie) return;
    const apiData = getApiData();
    await saveToApi(apiData);
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined || num === "") return "-";
    const n = typeof num === 'string' ? parseFloat(num) : num;
    return isNaN(n) ? "-" : new Intl.NumberFormat('fr-FR').format(n);
  };

  const calculateCategoryTotal = (elements) => {
    return elements.reduce((total, el) => {
      const m = newMontants[el.label];
      return total + (m?.montant || 0);
    }, 0);
  };

  const calculateCategoryRealisation = (elements) => {
    return elements.reduce((total, el) => {
      const m = newMontants[el.label];
      if (!m) return total;
      return total + moisUI.reduce((sum, mois) => sum + (m[mois] || 0), 0);
    }, 0);
  };

  const calculateTotalMois = (moisNom, elements) => {
    return elements.reduce((sum, el) => {
      const m = newMontants[el.label];
      return sum + (m?.[moisNom] || 0);
    }, 0);
  };

  // TOTAL BUDGET = Toutes les catégories SAUF Produit
  const calculateTotalGeneralBudget = () => {
    return budgetData.reduce((total, cat) => {
      if (cat.categorie === "Produit") return total;
      return total + calculateCategoryTotal(cat.elements);
    }, 0);
  };

  // TOTAL PRODUIT
  const calculateTotalProduit = () => {
    const produitElements = budgetData.find(cat => cat.categorie === "Produit")?.elements || [];
    return calculateCategoryTotal(produitElements);
  };

  // TOTAL REALISATION MENSUELLE = somme des réalisations hors Produit
  const calculateTotalRealisationMensuelle = () => {
    return budgetData.reduce((total, cat) => {
      if (cat.categorie === "Produit") return total;
      return total + calculateCategoryRealisation(cat.elements);
    }, 0);
  };

  // Réalisation pour la catégorie Produit
  const calculateRealisationProduit = () => {
    const produitElements = budgetData.find(cat => cat.categorie === "Produit")?.elements || [];
    return calculateCategoryRealisation(produitElements);
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const wsData = [];
    wsData.push(["Code", "Catégorie / Sous-catégorie", "Montant annuel", ...moisUI]);

    budgetData.forEach(cat => {
      wsData.push(["", cat.categorie, "", ...Array(12).fill("")]);
      cat.elements.forEach(el => {
        const m = newMontants[el.label] || {};
        wsData.push([
          el.code,
          el.label,
          m.montant || 0,
          ...moisUI.map(mois => m[mois] || 0),
        ]);
      });
      const catTotal = calculateCategoryTotal(cat.elements);
      wsData.push([
        "",
        `TOTAL ${cat.categorie}`,
        catTotal,
        ...moisUI.map(mois => calculateTotalMois(mois, cat.elements)),
      ]);
      wsData.push([]);
    });

    // Synthèse en bas
    const totalBudget = calculateTotalGeneralBudget();
    const totalProduit = calculateTotalProduit();
    const totalRealisationMensuelle = calculateTotalRealisationMensuelle();
    wsData.push([]);
    wsData.push(["", "SYNTHÈSE", "", ...Array(12).fill("")]);
    wsData.push(["", "TOTAL BUDGET", totalBudget, ...Array(12).fill("")]);
    wsData.push(["", "TOTAL REALISATION MENSUELLE", totalRealisationMensuelle, ...Array(12).fill("")]);
    wsData.push(["", "TOTAL PRODUIT", totalProduit, ...Array(12).fill("")]);
    wsData.push(["", "RESULTAT = PRODUIT - REALISATION", totalProduit - totalRealisationMensuelle, ...Array(12).fill("")]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Budget");
    XLSX.writeFile(wb, `Budget_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const totalBudget = calculateTotalGeneralBudget();
  const totalProduit = calculateTotalProduit();
  const totalRealisationMensuelle = calculateTotalRealisationMensuelle();
  const realisationProduit = calculateRealisationProduit();
  const resultat = totalProduit - totalRealisationMensuelle;
  const pourcentageGlobal = totalBudget ? ((totalRealisationMensuelle / totalBudget) * 100).toFixed(1) : 0;
  const pourcentageProduit = totalProduit ? ((realisationProduit / totalProduit) * 100).toFixed(1) : 0;
  const pourcentageResultat = totalProduit ? ((resultat / totalProduit) * 100).toFixed(1) : 0;

  return (
    <Container className="mt-4">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0">📊 Tableau Budgétaire – 12 mois</h5>
          </div>
          <div>
            <Button variant="light" onClick={exportToExcel} size="sm">
              📥 Exporter vers Excel
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {/* 🏆 RÉSUMÉ GÉNÉRAL EN HAUT DU TABLEAU */}
          <div className="mb-4">
            <h6 className="text-center mb-3 text-muted">📋 SYNTHÈSE GÉNÉRALE</h6>
            <div className="d-flex justify-content-around align-items-stretch gap-3 flex-wrap">
              {/* Bloc 1: TOTAL BUDGET */}
              <div className="p-3 bg-primary text-white rounded text-center shadow-sm flex-fill" style={{ minWidth: '200px' }}>
                <h6 className="mb-2">💰 TOTAL BUDGET</h6>
                <div className="fs-5 fw-bold">{formatNumber(totalBudget)}</div>
                <small>Budget annuel total</small>
              </div>

              {/* Bloc 2: TOTAL REALISATION MENSUELLE */}
              <div className="p-3 bg-info text-white rounded text-center shadow-sm flex-fill" style={{ minWidth: '200px' }}>
                <h6 className="mb-2">📈 RÉALISATION MENSUELLE</h6>
                <div className="fs-5 fw-bold">{formatNumber(totalRealisationMensuelle)}</div>
                <small>{pourcentageGlobal}% du budget</small>
              </div>

              {/* Bloc 3: TOTAL PRODUIT */}
              <div className="p-3 bg-warning text-dark rounded text-center shadow-sm flex-fill" style={{ minWidth: '200px' }}>
                <h6 className="mb-2">🎯 TOTAL PRODUIT</h6>
                <div className="fs-5 fw-bold">{formatNumber(totalProduit)}</div>
                <small>{pourcentageProduit}% réalisé</small>
              </div>

              {/* Bloc 4: RESULTAT */}
              <div className={`p-3 rounded text-center shadow-sm flex-fill ${resultat >= 0 ? 'bg-success text-white' : 'bg-danger text-white'}`} style={{ minWidth: '200px' }}>
                <h6 className="mb-2">📊 RÉSULTAT</h6>
                <div className="fs-5 fw-bold">
                  {formatNumber(resultat)}
                </div>
                <small>{pourcentageResultat}% du produit</small>
              </div>
            </div>
          </div>

          {/* TABLEAU DÉTAILLÉ AVEC CODES */}
          <Table bordered hover responsive size="sm">
            <thead className="table-light text-center align-middle">
              <tr>
                <th>Code</th>
                <th>Catégorie / Sous-catégorie</th>
                <th>Montant</th>
                {moisUI.map(m => <th key={m}>{m}</th>)}
                <th>%</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {/* Catégories principales */}
              {budgetData.map((cat, i) => {
                const catTotal = calculateCategoryTotal(cat.elements);
                const catReal = calculateCategoryRealisation(cat.elements);
                const catPerc = catTotal ? ((catReal / catTotal) * 100).toFixed(1) : 0;

                return (
                  <React.Fragment key={i}>
                    <tr className={cat.categorie === "Produit" ? "table-success fw-bold" : "table-primary fw-bold"}>
                      <td colSpan={moisUI.length + 4}>{cat.categorie}</td>
                    </tr>
                    {cat.elements.map((el, j) => {
                      const m = newMontants[el.label] || {};
                      const real = moisUI.reduce((sum, mois) => sum + (m[mois] || 0), 0);
                      const perc = m.montant ? ((real / m.montant) * 100).toFixed(1) : "0.0";
                      const badgeColor = perc >= 100 ? "success" : perc >= 80 ? "warning" : "secondary";

                      return (
                        <tr key={j}>
                          <td className="text-center fw-bold text-muted">{el.code || "-"}</td>
                          <td style={{ paddingLeft: "15px" }}>{el.label}</td>
                          <td className="text-end">{formatNumber(m.montant)}</td>
                          {moisUI.map(mois => (
                            <td key={mois} className="text-end">
                              {formatNumber(m[mois])}
                            </td>
                          ))}
                          <td className="text-center">
                            <Badge bg={badgeColor}>{perc}%</Badge>
                          </td>
                          <td className="text-center">
                            <Button
                              size="sm"
                              variant={m.montant ? "outline-warning" : "outline-primary"}
                              onClick={() => handleOpenModal(el.label)}
                            >
                              {m.montant ? "✏️ Modifier" : "➕ Ajouter"}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="table-info fw-bold">
                      <td colSpan="2" className="text-end">TOTAL</td>
                      <td className="text-end">{formatNumber(catTotal)}</td>
                      {moisUI.map(mois => (
                        <td key={mois} className="text-end">
                          {formatNumber(calculateTotalMois(mois, cat.elements))}
                        </td>
                      ))}
                      <td className="text-center">
                        <Badge bg="primary">{catPerc}%</Badge>
                      </td>
                      <td></td>
                    </tr>
                    {i < budgetData.length - 1 && (
                      <tr><td colSpan={moisUI.length + 5} style={{ height: '10px' }}></td></tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Modal pour modifier/ajouter les données */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            {newMontants[selectedSousCategorie] ? "Modifier" : "Ajouter"} : {selectedSousCategorie}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="mb-3">
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Montant annuel</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.montant}
                    onChange={(e) => handleInputChange("montant", e.target.value)}
                    className="text-end"
                  />
                </Form.Group>
              </Col>
              {moisUI.map((mois, idx) => (
                <Col md={2} key={idx}>
                  <Form.Group>
                    <Form.Label>{mois}</Form.Label>
                    <Form.Control
                      type="number"
                      value={formData[mois]}
                      onChange={(e) => handleInputChange(mois, e.target.value)}
                      className="text-end"
                    />
                  </Form.Group>
                </Col>
              ))}
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
          <Button variant="primary" onClick={handleSaveMontant}>Enregistrer</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default StructureBudget;