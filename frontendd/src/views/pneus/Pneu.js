import React, { useState, useEffect, useMemo } from 'react';
import { Card, Spinner, Alert, Container, Row, Col } from 'react-bootstrap';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Legend,
  Title,
  Tooltip,
  Filler
} from 'chart.js';
import axios from 'axios';

// Enregistrement des composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Legend,
  Title,
  Tooltip,
  Filler
);

// Configuration API
const API_BASE_URL = 'http://localhost:8000/api';
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

const ParetoAnalysis = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    voiture: [],
    projet: [],
    codePanne: [],
    site: []
  });

  // Chargement des données
  useEffect(() => {
    const fetchParetoData = async () => {
      try {
        setLoading(true);
        const timestamp = new Date().getTime();
        const response = await api.get(`/indicateurs-pareto/?t=${timestamp}`);
        
        setData({
          ...response.data,
          codePanne: response.data.codePanne?.map(item => ({
            code: item.code || 'Inconnu',
            count: item.nombre_pannes || 0
          })) || [],
          projet: response.data.projet?.map(item => ({
            name: item.name || 'Non attribué',
            count: item.nombre_pannes || 0
          })) || []
        });
      } catch (err) {
        setError(`Erreur lors du chargement des données : ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchParetoData();
  }, []);

  // Fonction de calcul des données Pareto (tri + cumul %)
  const createParetoData = (items, countField = 'count') => {
    if (!items?.length) return { labels: [], counts: [], cumulative: [] };

    const sorted = [...items].sort((a, b) => (b[countField] || 0) - (a[countField] || 0));
    const total = sorted.reduce((sum, item) => sum + (item[countField] || 0), 0);

    let cumulativeSum = 0;
    const cumulative = sorted.map(item => {
      cumulativeSum += item[countField] || 0;
      return (cumulativeSum / total) * 100;
    });

    return {
      labels: sorted.map(item => item.code || item.name || item.matricule || 'Inconnu'),
      counts: sorted.map(item => item[countField]),
      cumulative
    };
  };

  // Préparation des données pour chaque graphique
  const paretoCodePanne = useMemo(() => createParetoData(data.codePanne), [data.codePanne]);
  const paretoProjet = useMemo(() => createParetoData(data.projet, 'nombre_pannes'), [data.projet]);
  const paretoVoiturePannes = useMemo(() => createParetoData(data.voiture, 'nombre_pannes'), [data.voiture]);
  const paretoVoitureMTBF = useMemo(() => {
    const filtered = data.voiture?.filter(v => v.mtbf != null) || [];
    return createParetoData(filtered, 'mtbf');
  }, [data.voiture]);

  // Configuration des graphiques Pareto
  const paretoChartConfig = (title, labels, counts, cumulative, yLabel, colors) => ({
    labels,
    datasets: [
      {
        type: 'bar',
        label: yLabel,
        data: counts,
        backgroundColor: colors.bar,
        borderColor: colors.barBorder,
        borderWidth: 1,
        borderRadius: 4,
        yAxisID: 'y'
      },
      {
        type: 'line',
        label: 'Cumul %',
        data: cumulative,
        borderColor: colors.line,
        backgroundColor: colors.lineFill,
        borderWidth: 3,
        fill: false,
        pointRadius: 5,
        pointHoverRadius: 7,
        yAxisID: 'y1'
      }
    ],
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: title,
          font: { size: 18 }
        },
        subtitle: {
          display: true,
          color: '#666',
          font: { size: 12 }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || '';
              const value = context.datasetIndex === 0 
                ? context.raw 
                : `${context.raw.toFixed(1)}%`;
              return `${label}: ${value}`;
            }
          }
        },
        legend: {
          position: 'top'
        }
      },
      scales: {
        y: {
          title: { display: true, text: yLabel },
          beginAtZero: true
        },
        y1: {
          position: 'right',
          min: 0,
          max: 100,
          title: { display: true, text: 'Pourcentage cumulé' },
          grid: { drawOnChartArea: false }
        },
        x: {
          grid: { display: false }
        }
      },
      interaction: {
        mode: 'index',
        intersect: false
      }
    }
  });

  // État de chargement
  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <Spinner animation="border" variant="primary" /> 
        <span className="ms-2">Chargement des données...</span>
      </Container>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          <Alert.Heading>❌ Échec du chargement</Alert.Heading>
          <p>{error}</p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      {/* Titre principal */}
      <h2 className="mb-4 text-center">📊 Analyse de Pareto</h2>

      {/* Ligne 1 : Pannes par code et par projet */}
      <Row>
        {/* Pannes par code panne */}
        <Col lg={6} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header as="h5" className="bg-danger text-white">
              🔧 Nombre de pannes par code panne
            </Card.Header>
            <Card.Body style={{ minHeight: '400px' }}>
              {paretoCodePanne.labels.length > 0 ? (
                <Bar
                  data={paretoChartConfig(
                    'Pareto - Pannes par code',
                    paretoCodePanne.labels,
                    paretoCodePanne.counts,
                    paretoCodePanne.cumulative,
                    'Nombre de pannes',
                    {
                      bar: 'rgba(255, 99, 132, 0.7)',
                      barBorder: 'rgba(255, 99, 132, 1)',
                      line: 'rgba(54, 162, 235, 1)',
                      lineFill: 'rgba(54, 162, 235, 0.1)'
                    }
                  )}
                  options={{
                    plugins: {
                      subtitle: {
                        text: 'Les codes les plus fréquents sont à gauche'
                      }
                    }
                  }}
                />
              ) : (
                <div className="text-center text-muted mt-5">
                  📊 Aucune donnée disponible pour les codes de panne
                </div>
              )}
            </Card.Body>
            <Card.Footer className="text-muted small">
              Priorisez les codes en haut à gauche pour une amélioration ciblée.
            </Card.Footer>
          </Card>
        </Col>

        {/* Pannes par projet */}
        <Col lg={6} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header as="h5" className="bg-primary text-white">
              🏗️ Nombre de pannes par projet
            </Card.Header>
            <Card.Body style={{ minHeight: '400px' }}>
              {paretoProjet.labels.length > 0 ? (
                <Bar
                  data={paretoChartConfig(
                    'Pareto - Pannes par projet',
                    paretoProjet.labels,
                    paretoProjet.counts,
                    paretoProjet.cumulative,
                    'Nombre de pannes',
                    {
                      bar: 'rgba(54, 162, 235, 0.7)',
                      barBorder: 'rgba(54, 162, 235, 1)',
                      line: 'rgba(255, 159, 64, 1)',
                      lineFill: 'rgba(255, 159, 64, 0.1)'
                    }
                  )}
                />
              ) : (
                <div className="text-center text-muted mt-5">
                  📊 Aucune donnée disponible pour les projets
                </div>
              )}
            </Card.Body>
            <Card.Footer className="text-muted small">
              Identifier les projets à risque pour une intervention prioritaire.
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      {/* Ligne 2 : Pannes par voiture et MTBF */}
      <Row>
        {/* Nombre de pannes par voiture */}
        <Col lg={6} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header as="h5" className="bg-warning text-dark">
              🚗 Nombre de pannes par véhicule
            </Card.Header>
            <Card.Body style={{ minHeight: '400px' }}>
              {paretoVoiturePannes.labels.length > 0 ? (
                <Bar
                  data={paretoChartConfig(
                    'Pareto - Pannes par véhicule',
                    paretoVoiturePannes.labels,
                    paretoVoiturePannes.counts,
                    paretoVoiturePannes.cumulative,
                    'Nombre de pannes',
                    {
                      bar: 'rgba(255, 159, 64, 0.7)',
                      barBorder: 'rgba(255, 159, 64, 1)',
                      line: 'rgba(75, 192, 192, 1)',
                      lineFill: 'rgba(75, 192, 192, 0.1)'
                    }
                  )}
                />
              ) : (
                <div className="text-center text-muted mt-5">
                  📊 Aucune donnée de panne par véhicule
                </div>
              )}
            </Card.Body>
            <Card.Footer className="text-muted small">
              Véhicules les plus sujets aux pannes — cibles de maintenance prédictive.
            </Card.Footer>
          </Card>
        </Col>

        {/* MTBF par voiture */}
        <Col lg={6} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header as="h5" className="bg-success text-white">
              ⏱️ MTBF par véhicule (fiabilité)
            </Card.Header>
            <Card.Body style={{ minHeight: '400px' }}>
              {paretoVoitureMTBF.labels.length > 0 ? (
                <Bar
                  data={paretoChartConfig(
                    'Pareto - MTBF par véhicule',
                    paretoVoitureMTBF.labels,
                    paretoVoitureMTBF.counts,
                    paretoVoitureMTBF.cumulative,
                    'MTBF (heures)',
                    {
                      bar: 'rgba(75, 192, 192, 0.7)',
                      barBorder: 'rgba(75, 192, 192, 1)',
                      line: 'rgba(153, 102, 255, 1)',
                      lineFill: 'rgba(153, 102, 255, 0.1)'
                    }
                  )}
                />
              ) : (
                <div className="text-center text-muted mt-5">
                  🔁 Aucune donnée de MTBF disponible
                </div>
              )}
            </Card.Body>
            <Card.Footer className="text-muted small">
              Plus le MTBF est bas, moins le véhicule est fiable.
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      {/* Note explicative sur la méthode Pareto */}
      <Row className="mt-4">
        <Col>
          <Alert variant="info" className="text-center">
            <strong>📌 Principe de Pareto (80/20)</strong> : 80 % des pannes proviennent souvent de 20 % des causes. 
            Concentrez vos efforts sur les éléments situés à gauche des graphiques.
          </Alert>
        </Col>
      </Row>
    </Container>
  );
};

export default ParetoAnalysis;