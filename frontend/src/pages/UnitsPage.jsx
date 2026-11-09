// src/pages/UnitsPage.jsx
import React from 'react';

const UnitsPage = () => {
    return (
        <div className="container-fluid px-4 py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="fw-bold mb-1">
                        <i className="fas fa-ruler text-primary me-2"></i>
                        Gestion des Unités
                    </h4>
                    <p className="text-muted mb-0">Gérez toutes vos unités de mesure</p>
                </div>
                <button className="btn btn-primary">
                    <i className="fas fa-plus me-2"></i>
                    Nouvelle Unité
                </button>
            </div>

            <div className="card shadow-sm">
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead className="table-light">
                                <tr>
                                    <th>#</th>
                                    <th>Nom</th>
                                    <th>Symbole</th>
                                    <th>Statut</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colSpan="6" className="text-center py-4 text-muted">
                                        <i className="fas fa-inbox fa-2x d-block mb-2"></i>
                                        Aucune unité enregistrée
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnitsPage;