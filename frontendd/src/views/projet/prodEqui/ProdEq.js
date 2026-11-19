import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Select, DatePicker, Card, Statistic, Row, Col } from 'antd';
import moment from 'moment';

const { Option } = Select;
const { RangePicker } = DatePicker;

const CumulsStats = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});
  const [vehicules, setVehicules] = useState([]);
  const [selectedVehicule, setSelectedVehicule] = useState(null);
  const [dateRange, setDateRange] = useState({
    mois: moment().month() + 1,
    annee: moment().year()
  });

  useEffect(() => {
    fetchVehicules();
    fetchStats();
  }, [dateRange]);

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
        mois: dateRange.mois,
        annee: dateRange.annee
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

  const handleDateChange = (dates, dateStrings) => {
    if (dates && dates.length === 2) {
      setDateRange({
        mois: dates[0].month() + 1,
        annee: dates[0].year()
      });
    }
  };

  const handleVehiculeChange = value => {
    setSelectedVehicule(value);
  };

  const columns = [
    {
      title: 'Matériau',
      dataIndex: 'materiau',
      key: 'materiau',
    },
    {
      title: 'Mensuel',
      dataIndex: 'mensuel',
      key: 'mensuel',
      render: value => `${value} tonnes`,
    },
    {
      title: 'Annuel',
      dataIndex: 'annuel',
      key: 'annuel',
      render: value => `${value} tonnes`,
    },
  ];

  const dataSource = [
    { key: '1', materiau: 'Goudron', mensuel: stats.goudron_total || 0, annuel: stats.goudron_annuel || 0 },
    { key: '2', materiau: 'Carrière', mensuel: stats.carriere_total || 0, annuel: stats.carriere_annuel || 0 },
    { key: '3', materiau: 'Gravier', mensuel: stats.gravier_total || 0, annuel: stats.gravier_annuel || 0 },
    { key: '4', materiau: 'Roche', mensuel: stats.roche_total || 0, annuel: stats.roche_annuel || 0 },
    { key: '5', materiau: 'Autres', mensuel: stats.autres_total || 0, annuel: stats.autres_annuel || 0 },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h1>Statistiques de Production</h1>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '20px' }}>
        <Select
          style={{ width: 200 }}
          placeholder="Sélectionner un véhicule"
          onChange={handleVehiculeChange}
          allowClear
        >
          {vehicules.map(v => (
            <Option key={v.matricule} value={v.matricule}>
              {v.matricule} - {v.type_vehicule}
            </Option>
          ))}
        </Select>
        
        <RangePicker
          picker="month"
          onChange={handleDateChange}
          defaultValue={[moment().startOf('month'), moment().endOf('month')]}
        />
      </div>
      
      <Row gutter={16} style={{ marginBottom: '20px' }}>
        <Col span={12}>
          <Card>
            <Statistic
              title="Distance mensuelle"
              value={stats.distance_totale || 0}
              suffix="km"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="Distance annuelle"
              value={stats.distance_annuelle || 0}
              suffix="km"
            />
          </Card>
        </Col>
      </Row>
      
      <Table
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        pagination={false}
        bordered
        title={() => <h3>Quantités transportées (tonnes)</h3>}
      />
    </div>
  );
};

export default CumulsStats;