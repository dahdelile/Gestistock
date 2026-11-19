import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const EquipmentManagement = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Sample data
  const equipmentData = [
    {
      id: 1,
      matricule: 'ID: NaN',
      type: 'Type inconnu',
      projet: 'Non affecté',
      statut: 'En panne',
      typePanne: 'électrique',
      dateArret: '10/04/2025 13:15:00'
    },
    {
      id: 2,
      matricule: 'ID: NaN',
      type: 'Type inconnu',
      projet: 'Non affecté',
      statut: 'En attenie travaux',
      typePanne: '-',
      dateArret: '10/04/2025 12:19:00'
    },
    {
      id: 3,
      matricule: 'ID: NaN',
      type: 'Type inconnu',
      projet: 'Non affecté',
      statut: 'En panne',
      typePanne: 'mecanique',
      dateArret: '10/04/2025 12:19:00'
    },
    {
      id: 4,
      matricule: 'ID: NaN',
      type: 'Type inconnu',
      projet: 'Non affecté',
      statut: 'En attenie travaux',
      typePanne: '-',
      dateArret: '10/04/2025 11:16:00'
    }
  ];

  const filteredData = equipmentData.filter(item => {
    if (statusFilter === 'all') return true;
    return item.statut.toLowerCase().includes(statusFilter.toLowerCase());
  });

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Gestion des Arrêts des Equipements</h1>
      
      {/* Filters Section */}
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Statut</h5>
          <div className="btn-group" role="group">
            <button 
              type="button" 
              className={`btn ${statusFilter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setStatusFilter('all')}
            >
              Tous les statuts
            </button>
            <button 
              type="button" 
              className={`btn ${statusFilter === 'marche' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setStatusFilter('marche')}
            >
              En Marche
            </button>
          </div>
          
          <div className="mt-3">
            <div className="form-group row">
              <label className="col-sm-2 col-form-label">Entre le Date</label>
              <div className="col-sm-5">
                <input 
                  type="date" 
                  className="form-control" 
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                />
              </div>
              <div className="col-sm-5">
                <input 
                  type="date" 
                  className="form-control" 
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Section */}
      <div className="row mb-4">
        <div className="col-md-12">
          <h4>Équipements</h4>
          <h2 className="display-4">81</h2>
        </div>
        
        <div className="col-md-4">
          <div className="card text-white bg-success mb-3">
            <div className="card-body">
              <h5 className="card-title">En Marche</h5>
              <h2 className="card-text">73</h2>
              <p className="card-text">90.1% disponibilité</p>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card text-white bg-danger mb-3">
            <div className="card-body">
              <h5 className="card-title">En Panne</h5>
              <h2 className="card-text">4</h2>
              <p className="card-text">4.9% maintenance</p>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card text-white bg-warning mb-3">
            <div className="card-body">
              <h5 className="card-title">En Attente Travaux</h5>
              <h2 className="card-text">4</h2>
              <p className="card-text">4.9% parc</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add New Button */}
      <button className="btn btn-primary mb-3">
        + Nouvel Arrêt
      </button>
      
      {/* Table Section */}
      <div className="table-responsive">
        <table className="table table-striped table-bordered">
          <thead className="thead-dark">
            <tr>
              <th>Matricule</th>
              <th>Type</th>
              <th>Projet</th>
              <th>Statut</th>
              <th>Type Panne</th>
              <th>Date Arrêt</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => (
              <tr key={item.id}>
                <td>{item.matricule}</td>
                <td>{item.type}</td>
                <td>{item.projet}</td>
                <td>
                  <span className={`badge ${
                    item.statut === 'En panne' ? 'bg-danger' : 
                    item.statut === 'En attenie travaux' ? 'bg-warning' : 'bg-success'
                  }`}>
                    {item.statut}
                  </span>
                </td>
                <td>{item.typePanne}</td>
                <td>{item.dateArret}</td>
                <td>
                  <button className="btn btn-sm btn-success">✅</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EquipmentManagement;