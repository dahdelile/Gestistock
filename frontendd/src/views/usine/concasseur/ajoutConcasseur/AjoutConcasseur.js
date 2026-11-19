import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Container, 
  Table, 
  Form, 
  Card, 
  Row, 
  Col,
  Spinner
} from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const CumulsStats = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});
  const [vehicules, setVehicules] = useState([]);
  const [selectedVehicule, setSelectedVehicule] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  useEffect(() => {
    fetchVehicules();
    fetchStats();
  }, [startDate, endDate, selectedVehicule]);

  const fetchVehicules = async () => {
    try {
      const response = await axios.get('/api/vehicules/');
      setVehicules(response.data);
    } catch (error) {
      console.error('Error fetching vehicules:', error);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = {
        mois: startDate.getMonth() + 1,
        annee: startDate.getFullYear()
      };
      
      let url = '/api/cumuls/stats/';
      if (selectedVehicule) {
        url = `/api/vehicules/${selectedVehicule}/cumuls/`;
      }
      
      const response = await axios.get(url, { params });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (dates) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
  };

  const handleVehiculeChange = (e) => {
    setSelectedVehicule(e.target.value);
  };

  const materialData = [
    { name: 'Goudron', mensuel: stats.goudron_total || 0, annuel: stats.goudron_annuel || 0 },
    { name: 'Carrière', mensuel: stats.carriere_total || 0, annuel: stats.carriere_annuel || 0 },
    { name: 'Gravier', mensuel: stats.gravier_total || 0, annuel: stats.gravier_annuel || 0 },
    { name: 'Roche', mensuel: stats.roche_total || 0, annuel: stats.roche_annuel || 0 },
    { name: 'Autres', mensuel: stats.autres_total || 0, annuel: stats.autres_annuel || 0 },
  ];

  return (
    <Container className="py-4">
      <h1 className="mb-4">Statistiques de Production</h1>
      
      <Row className="mb-4">
        <Col md={4}>
          <Form.Group controlId="vehiculeSelect">
            <Form.Label>Véhicule</Form.Label>
            <Form.Control 
              as="select" 
              onChange={handleVehiculeChange}
              value={selectedVehicule || ''}
            >
              <option value="">Tous les véhicules</option>
              {vehicules.map(v => (
                <option key={v.matricule} value={v.matricule}>
                  {v.matricule} - {v.type_vehicule}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
        </Col>
        
        <Col md={4}>
          <Form.Group controlId="dateRange">
            <Form.Label>Période</Form.Label>
            <DatePicker
              selected={startDate}
              onChange={handleDateChange}
              startDate={startDate}
              endDate={endDate}
              selectsRange
              dateFormat="MM/yyyy"
              showMonthYearPicker
              className="form-control"
            />
          </Form.Group>
        </Col>
      </Row>
      
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>Distance mensuelle</Card.Title>
              <Card.Text className="display-6">
                {loading ? <Spinner animation="border" size="sm" /> : `${stats.distance_totale || 0} km`}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>Distance annuelle</Card.Title>
              <Card.Text className="display-6">
                {loading ? <Spinner animation="border" size="sm" /> : `${stats.distance_annuelle || 0} km`}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Card className="mb-4">
        <Card.Header>
          <h3 className="mb-0">Quantités transportées (tonnes)</h3>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center">
              <Spinner animation="border" />
            </div>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Matériau</th>
                  <th>Mensuel</th>
                  <th>Annuel</th>
                </tr>
              </thead>
              <tbody>
                {materialData.map((material, index) => (
                  <tr key={index}>
                    <td>{material.name}</td>
                    <td>{material.mensuel.toLocaleString()}</td>
                    <td>{material.annuel.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CumulsStats;