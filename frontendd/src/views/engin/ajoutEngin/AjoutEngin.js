import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { Form, Button, Card, Alert, Spinner, Row, Col } from 'react-bootstrap';

const EquipmentForm = ({ onEquipmentAdded }) => {
  // États du formulaire
  const [formData, setFormData] = useState({
    matricule: '',
    type_vehicule: '',
    projet: '',
  });

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState({ projects: true, submit: false });
  const [messages, setMessages] = useState({ error: null, formError: null, success: null });

  const api = axios.create({
   baseURL: 'https://intranet-attm.com/api',
    headers: { 'Content-Type': 'application/json' },
  });

  useEffect(() => {
    let isMounted = true;
    const fetchProjects = async () => {
      try {
        setLoading(prev => ({ ...prev, projects: true }));
        const response = await api.get('/projets/');
        if (isMounted) setProjects(response.data || []);
      } catch (err) {
        if (isMounted) setMessages(prev => ({ ...prev, error: "Erreur de chargement des projets" }));
      } finally {
        if (isMounted) setLoading(prev => ({ ...prev, projects: false }));
      }
    };
    fetchProjects();
    return () => { isMounted = false; };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setMessages(prev => ({ ...prev, formError: null }));
  };

  const validateForm = () => {
    if (!formData.matricule.trim() || !formData.type_vehicule.trim()) {
      setMessages(prev => ({ ...prev, formError: "Tous les champs obligatoires doivent être remplis." }));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(prev => ({ ...prev, submit: true }));
    setMessages({ error: null, formError: null, success: null });

    try {
      await api.post('/vehicules/', formData);
      setMessages(prev => ({ ...prev, success: 'Équipement ajouté avec succès !' }));
      setFormData({ matricule: '', type_vehicule: '', projet: '' });
      setTimeout(() => onEquipmentAdded(), 1500);
    } catch (err) {
      setMessages(prev => ({ ...prev, formError: err.response?.data?.detail || "Erreur lors de l'ajout de l'équipement" }));
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  return (
    <Card className="mb-4 shadow-sm">
      <Card.Header className="bg-primary text-white">
        <h3 className="mb-0">Ajouter un équipement</h3>
      </Card.Header>
      <Card.Body>
        {messages.error && <Alert variant="danger">{messages.error}</Alert>}
        {messages.formError && <Alert variant="danger">{messages.formError}</Alert>}
        {messages.success && <Alert variant="success">{messages.success}</Alert>}

        <Form onSubmit={handleSubmit} noValidate>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Matricule *</Form.Label>
                <Form.Control type="text" name="matricule" value={formData.matricule} onChange={handleChange} required disabled={loading.submit} placeholder="EQ-001" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Type d'équipement *</Form.Label>
                <Form.Control type="text" name="type_vehicule" value={formData.type_vehicule} onChange={handleChange} required disabled={loading.submit} placeholder="Bulldozer" />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Projet affecté</Form.Label>
                <Form.Select name="projet" value={formData.projet} onChange={handleChange} disabled={loading.projects || loading.submit}>
                  <option value="">-- Sélectionnez un projet --</option>
                  {loading.projects ? <option disabled>Chargement...</option> : projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex justify-content-between mt-4">
            <Button variant="primary" type="submit" disabled={loading.submit}>
              {loading.submit ? <><Spinner as="span" size="sm" animation="border" className="me-2" /> Enregistrement...</> : 'Enregistrer'}
            </Button>
            <Button variant="outline-secondary" onClick={() => setFormData({ matricule: '', type_vehicule: '', projet: '' })} disabled={loading.submit}>Réinitialiser</Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

EquipmentForm.propTypes = { onEquipmentAdded: PropTypes.func.isRequired };

export default EquipmentForm;
