import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Form, Card, Table, Spinner, Alert, Row, Col } from 'react-bootstrap';

const API_BASE_URL = "http://127.0.0.1:8000/api";

const ProjetPerformances = () => {
    const [formData, setFormData] = useState({
        projet: '',
        mesure: '',
        objectif_mensuel: 0,
        realisation_journee: 0,
        donnee_projet: 0,
        date_rapport: new Date().toISOString().split('T')[0],
    });

    const [showForm, setShowForm] = useState(false);
    const [performances, setPerformances] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    useEffect(() => {
        fetchProjects();
        fetchPerformances();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/projets/`);
            setProjects(response.data);
        } catch (error) {
            console.error("Erreur API projets:", error);
            setError("Erreur lors de la récupération des projets.");
        }
    };

    const fetchPerformances = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/performances/`);
            setPerformances(response.data);
        } catch (error) {
            console.error("Erreur API performances:", error);
            setError("Erreur lors de la récupération des performances.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === "projet" ? parseInt(value, 10) || "" : value,
        }));
    };

    const calculateRemainingMonths = (cumul, objectifMensuel, donneeProjet) => {
        const remaining = donneeProjet - cumul;
        if (objectifMensuel <= 0) return 'N/A';
        return Math.ceil(remaining / objectifMensuel);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        try {
            const existingPerformance = performances.find(
                p => p.projet === formData.projet && p.mesure === formData.mesure
            );

            const realisation_journee_num = Number(formData.realisation_journee);
            const cumul_realise = existingPerformance 
                ? existingPerformance.cumul_realise + realisation_journee_num
                : realisation_journee_num;

            const pourcentage_r_projet = ((cumul_realise / formData.donnee_projet) * 100).toFixed(2);
            const realisation_mois = existingPerformance
                ? existingPerformance.realisation_mois + realisation_journee_num
                : realisation_journee_num;

            const mois_restants = calculateRemainingMonths(
                cumul_realise,
                formData.objectif_mensuel,
                formData.donnee_projet
            );

            const performanceData = {
                ...formData,
                cumul_realise,
                pourcentage_r_projet,
                realisation_mois,
                mois_restants
            };

            const response = await axios.post(`${API_BASE_URL}/performances/`, performanceData);
            setPerformances([...performances, response.data]);
            setSuccessMessage("Performance ajoutée avec succès. Cumul et mois restants mis à jour.");
            resetForm();
            setShowForm(false);
        } catch (err) {
            console.error("Erreur lors de l'ajout :", err.response?.data || err.message);
            setError(err.response?.data || "Erreur lors de l'ajout de la performance.");
        }
    };

    const resetForm = () => {
        setFormData({
            projet: '',
            mesure: '',
            objectif_mensuel: 0,
            realisation_journee: 0,
            donnee_projet: 0,
            date_rapport: new Date().toISOString().split('T')[0],
        });
    };

    return (
        <div className="container mt-4">
            <Card className="p-3 mb-4" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <Button 
                    variant={showForm ? 'outline-secondary' : 'info'} 
                    onClick={() => setShowForm(!showForm)}
                    className="mb-2"
                    size="sm"
                >
                    {showForm ? '✖ Annuler' : '➕ Ajouter Nouvelle Mesure'}
                </Button>

                {showForm && (
                    <Form onSubmit={handleSubmit} className="mt-2">
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-2">
                                    <Form.Label size="sm">Projet</Form.Label>
                                    <Form.Control 
                                        as="select" 
                                        name="projet" 
                                        value={formData.projet} 
                                        onChange={handleChange} 
                                        required 
                                        size="sm"
                                    >
                                        <option value="">Sélectionner...</option>
                                        {projects.map(project => (
                                            <option key={project.id} value={project.id}>{project.name}</option>
                                        ))}
                                    </Form.Control>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-2">
                                    <Form.Label size="sm">Mesure</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        name="mesure" 
                                        value={formData.mesure} 
                                        onChange={handleChange} 
                                        required 
                                        size="sm"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-2">
                                    <Form.Label size="sm">Objectif Mensuel</Form.Label>
                                    <Form.Control 
                                        type="number" 
                                        name="objectif_mensuel" 
                                        value={formData.objectif_mensuel} 
                                        onChange={handleChange} 
                                        required 
                                        size="sm"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-2">
                                    <Form.Label size="sm">Donnée Projet</Form.Label>
                                    <Form.Control 
                                        type="number" 
                                        name="donnee_projet" 
                                        value={formData.donnee_projet} 
                                        onChange={handleChange} 
                                        required 
                                        size="sm"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-2">
                                    <Form.Label size="sm">Réalisation Journalière</Form.Label>
                                    <Form.Control 
                                        type="number" 
                                        name="realisation_journee" 
                                        value={formData.realisation_journee} 
                                        onChange={handleChange} 
                                        required 
                                        size="sm"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Button type="submit" variant="primary" size="sm" className="w-100">
                            Enregistrer
                        </Button>
                    </Form>
                )}
            </Card>

            {successMessage && <Alert variant="success" dismissible onClose={() => setSuccessMessage(null)}>{successMessage}</Alert>}
            {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

            <Card className="p-3">
                <h5 className="mb-3">📋 Liste des des mesures </h5>
                {loading ? (
                    <div className="text-center py-4">
                        <Spinner animation="border" size="sm" />
                        <p className="mt-2">Chargement des données...</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <Table striped bordered hover size="sm">
                            <thead className="table-light">
                                <tr>
                                    <th>Date</th>
                                    <th>Projet</th>
                                    <th>Mesure</th>
                                    <th>Objectif</th>
                                    <th>Journalier</th>
                                    <th>Mois</th>
                                    <th>Total</th>
                                    <th>Cumul</th>
                                    <th>% Avancement</th>
                                    <th>Mois Restants</th>
                                </tr>
                            </thead>
                            <tbody>
                                {performances.length > 0 ? (
                                    performances.map((perf) => {
                                        const projetAssocie = projects.find(p => p.id === perf.projet);
                                        return (
                                            <tr key={perf.id}>
                                                <td>{perf.date_rapport}</td>
                                                <td>{projetAssocie?.name || '-'}</td>
                                                <td>{perf.mesure}</td>
                                                <td>{perf.objectif_mensuel}</td>
                                                <td>{perf.realisation_journee}</td>
                                                <td>{perf.realisation_mois}</td>
                                                <td>{perf.donnee_projet}</td>
                                                <td>{perf.cumul_realise}</td>
                                                <td>{perf.pourcentage_r_projet}%</td>
                                                <td>{perf.mois_restants}</td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="10" className="text-center py-3">Aucune donnée disponible</td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default ProjetPerformances;