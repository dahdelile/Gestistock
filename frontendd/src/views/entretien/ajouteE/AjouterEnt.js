import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Alert, Spinner, Card, Row, Col, Badge } from 'react-bootstrap';
import axios from 'axios';
import { 
  FaCar, FaOilCan, FaCalendarAlt, FaTachometerAlt, 
  FaProjectDiagram, FaSave, FaInfoCircle, FaExclamationTriangle 
} from 'react-icons/fa';
import { format, parseISO } from 'date-fns';
import fr from 'date-fns/locale/fr';

const AjouterEntretien = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    voiture: '',
    date_visite: format(new Date(), 'yyyy-MM-dd'),
    type_vidange: 'VIDANGE_SIMPLE',
    compteur_visite: '',
    compteur_actuel: '',
    projet: null,
    notes: ''
  });

  const [voitures, setVoitures] = useState([]);
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [lastMaintenance, setLastMaintenance] = useState(null);
  const [nextMaintenance, setNextMaintenance] = useState(null);

  // Chargement des données initiales
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [voituresRes, projetsRes] = await Promise.all([
          axios.get('http://localhost:8000/api/voitures/'),
          axios.get('http://localhost:8000/api/projets/')
        ]);
        setVoitures(voituresRes.data);
        setProjets(projetsRes.data);
      } catch (err) {
        setError('Erreur de chargement des données initiales');
        console.error('Erreur:', err.response?.data || err.message);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  // Charger la dernière maintenance quand la voiture change
  useEffect(() => {
    if (formData.voiture) {
      const fetchLastMaintenance = async () => {
        try {
          const response = await axios.get(
            `http://localhost:8000/api/vidanges/?voiture=${formData.voiture}&ordering=-date_visite&limit=1`
          );
          if (response.data.results?.length > 0) {
            setLastMaintenance(response.data.results[0]);
          } else {
            setLastMaintenance(null);
          }
        } catch (err) {
          console.error('Erreur:', err.response?.data || err.message);
        }
      };
      fetchLastMaintenance();
    }
  }, [formData.voiture]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Réinitialiser l'erreur du champ lorsqu'il est modifié
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const calculateNextMaintenance = () => {
    if (formData.compteur_visite) {
      const nextKm = parseInt(formData.compteur_visite) + 4000;
      setNextMaintenance(nextKm);
      
      if (formData.compteur_actuel) {
        const remaining = nextKm - parseInt(formData.compteur_actuel);
        setFormData(prev => ({
          ...prev,
          heur_restant: remaining > 0 ? remaining : 0
        }));
      }
    }
  };

  const validateFields = () => {
    let isValid = true;
    const newErrors = {};
  
    // Validation du véhicule
    if (!formData.voiture) {
      newErrors.voiture = 'Veuillez sélectionner un véhicule';
      isValid = false;
    }
  
    // Validation de la date
    if (!formData.date_visite) {
      newErrors.date_visite = 'La date est requise';
      isValid = false;
    } else if (new Date(formData.date_visite) > new Date()) {
      newErrors.date_visite = 'La date ne peut pas être dans le futur';
      isValid = false;
    }
  
    // Validation du compteur visite
    if (!formData.compteur_visite) {
      newErrors.compteur_visite = 'Le compteur visite est requis';
      isValid = false;
    } else if (isNaN(formData.compteur_visite)) {
      newErrors.compteur_visite = 'Doit être un nombre valide';
      isValid = false;
    } else if (parseInt(formData.compteur_visite) < 0) {
      newErrors.compteur_visite = 'Ne peut pas être négatif';
      isValid = false;
    }
  
    // Validation du compteur actuel
    if (formData.compteur_actuel) {
      if (isNaN(formData.compteur_actuel)) {
        newErrors.compteur_actuel = 'Doit être un nombre valide';
        isValid = false;
      } else if (parseInt(formData.compteur_actuel) < 0) {
        newErrors.compteur_actuel = 'Ne peut pas être négatif';
        isValid = false;
      }
      // Supprimer la validation qui empêche compteur_actuel < compteur_visite
    }
  
    setFieldErrors(newErrors);
    return isValid;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateFields()) {
      setError('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        voiture: parseInt(formData.voiture),
        date_visite: formData.date_visite,
        type_vidange: formData.type_vidange,
        compteur_visite: parseInt(formData.compteur_visite),
        
          compteur_actuel: formData.compteur_actuel 
          ? Math.max(parseInt(formData.compteur_actuel), parseInt(formData.compteur_visite))
          : parseInt(formData.compteur_visite),
        projet: formData.projet ? parseInt(formData.projet) : null,
        notes: formData.notes,
        prochaine_visite: nextMaintenance
      };

      const response = await axios.post(
        'http://localhost:8000/api/vidanges/',
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      setSuccess('Entretien ajouté avec succès!');
      setTimeout(() => {
        navigate('/entretien/listEnt', {
          state: { success: 'Entretien ajouté avec succès!' }
        });
      }, 1500);

    } catch (err) {
      console.error('Erreur:', err.response?.data || err);

      if (err.response?.status === 400) {
        // Gestion des erreurs de validation du serveur
        const serverErrors = err.response.data;
        const errorMap = {};

        for (const key in serverErrors) {
          errorMap[key] = Array.isArray(serverErrors[key]) 
            ? serverErrors[key].join(' ') 
            : serverErrors[key];
        }

        setFieldErrors(errorMap);
        setError('Le serveur a rejeté certaines données. Veuillez vérifier les champs.');
      } else {
        setError(err.message || 'Une erreur est survenue lors de l\'enregistrement');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="container py-4">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow">
            <Card.Header className="bg-primary text-white py-3">
              <h2 className="mb-0 d-flex align-items-center">
                <FaOilCan className="me-2" />
                Nouvel Entretien
              </h2>
            </Card.Header>
            
            <Card.Body>
              {error && (
                <Alert variant="danger" onClose={() => setError(null)} dismissible>
                  <FaExclamationTriangle className="me-2" />
                  {error}
                </Alert>
              )}

              {success && (
                <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
                  <FaInfoCircle className="me-2" />
                  {success}
                </Alert>
              )}

              {lastMaintenance && (
                <Alert variant="info" className="mb-4">
                  <h5 className="d-flex align-items-center">
                    <FaInfoCircle className="me-2" />
                    Dernier entretien
                  </h5>
                  <div className="d-flex flex-wrap gap-3 mt-2">
                    <div>
                      <strong>Date:</strong> {format(parseISO(lastMaintenance.date_visite), 'PP', { locale: fr })}
                    </div>
                    <div>
                      <strong>Type:</strong> {lastMaintenance.type_vidange === 'VIDANGE_SIMPLE' ? 'Simple' : 'Complète'}
                    </div>
                    <div>
                      <strong>Compteur:</strong> {lastMaintenance.compteur_visite} h
                    </div>
                  </div>
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    {/* Véhicule */}
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">
                        <FaCar className="me-2" />
                        Véhicule *
                      </Form.Label>
                      <Form.Select
                        name="voiture"
                        value={formData.voiture}
                        onChange={handleChange}
                        isInvalid={!!fieldErrors.voiture}
                        disabled={loading}
                      >
                        <option value="">Sélectionnez un véhicule</option>
                        {voitures.map(voiture => (
                          <option key={voiture.id} value={voiture.id}>
                            {voiture.matricule} - {voiture.type_voiture}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {fieldErrors.voiture}
                      </Form.Control.Feedback>
                    </Form.Group>

                    {/* Date et Type */}
                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-bold">
                            <FaCalendarAlt className="me-2" />
                            Date *
                          </Form.Label>
                          <Form.Control
                            type="date"
                            name="date_visite"
                            value={formData.date_visite}
                            onChange={handleChange}
                            isInvalid={!!fieldErrors.date_visite}
                            disabled={loading}
                          />
                          <Form.Control.Feedback type="invalid">
                            {fieldErrors.date_visite}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-bold">Type *</Form.Label>
                          <Form.Select
                            name="type_vidange"
                            value={formData.type_vidange}
                            onChange={handleChange}
                            disabled={loading}
                          >
                            <option value="VIDANGE_SIMPLE">Simple</option>
                            <option value="VIDANGE_COMPLET">Complète</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    {/* Compteurs */}
                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-bold">
                            <FaTachometerAlt className="me-2" />
                            Compteur visite (h) *
                          </Form.Label>
                          <Form.Control
                            type="number"
                            name="compteur_visite"
                            value={formData.compteur_visite}
                            onChange={handleChange}
                            onBlur={calculateNextMaintenance}
                            min="0"
                            step="1"
                            isInvalid={!!fieldErrors.compteur_visite}
                            disabled={loading}
                          />
                          <Form.Control.Feedback type="invalid">
                            {fieldErrors.compteur_visite}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-bold">
                            <FaTachometerAlt className="me-2" />
                            Compteur actuel (h)
                          </Form.Label>
                          <Form.Control
                            type="number"
                            name="compteur_actuel"
                            value={formData.compteur_actuel}
                            onChange={handleChange}
                            onBlur={calculateNextMaintenance}
                            min="0"
                            step="1"
                            isInvalid={!!fieldErrors.compteur_actuel}
                            placeholder="Par défaut = compteur visite"
                            disabled={loading}
                          />
                          <Form.Control.Feedback type="invalid">
                            {fieldErrors.compteur_actuel}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                  </Col>

                  <Col md={6}>
                    {/* Projet */}
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">
                        <FaProjectDiagram className="me-2" />
                        Projet
                      </Form.Label>
                      <Form.Select
                        name="projet"
                        value={formData.projet || ''}
                        onChange={handleChange}
                        isInvalid={!!fieldErrors.projet}
                        disabled={loading}
                      >
                        <option value="">Non attribué</option>
                        {projets.map(projet => (
                          <option key={projet.id} value={projet.id}>
                            {projet.name}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {fieldErrors.projet}
                      </Form.Control.Feedback>
                    </Form.Group>

                    {/* Notes */}
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">
                        <FaInfoCircle className="me-2" />
                        Notes
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={3}
                        disabled={loading}
                        placeholder="Observations ou remarques sur l'entretien"
                      />
                    </Form.Group>

                    {/* Informations calculées */}
                    <Card className="mb-3 border-info">
                      <Card.Header className="bg-info text-white py-2">
                        <h6 className="mb-0">Informations calculées</h6>
                      </Card.Header>
                      <Card.Body>
                        <div className="d-flex flex-wrap gap-3">
                          <div>
                            <strong>Prochaine vidange:</strong> 
                            {nextMaintenance ? (
                              <Badge bg="primary" className="ms-2">
                                {nextMaintenance} h
                              </Badge>
                            ) : (
                              <Badge bg="secondary" className="ms-2">
                                Non calculé
                              </Badge>
                            )}
                          </div>
                          <div>
                            <strong>Heures restantes:</strong> 
                            {formData.heur_restant !== undefined ? (
                              <Badge bg={formData.heur_restant < 500 ? 'danger' : 'success'} className="ms-2">
                                {formData.heur_restant} h
                              </Badge>
                            ) : (
                              <Badge bg="secondary" className="ms-2">
                                Non calculé
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <div className="d-flex justify-content-end gap-2 mt-3">
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => navigate('/entretien/listEnt')}
                    disabled={loading}
                  >
                    Annuler
                  </Button>
                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner as="span" size="sm" animation="border" className="me-2" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <FaSave className="me-2" />
                        Enregistrer l'entretien
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AjouterEntretien;