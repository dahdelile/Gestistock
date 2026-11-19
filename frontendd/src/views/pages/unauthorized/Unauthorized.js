// src/views/pages/unauthorized/Unauthorized.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { CContainer, CCard, CCardBody, CAlert, CButton } from '@coreui/react';

const Unauthorized = () => {
  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');

  return (
    <CContainer className="d-flex align-items-center min-vh-100">
      <CCard className="w-100" style={{ maxWidth: '400px' }}>
        <CCardBody className="text-center">
          <CAlert color="warning">
            <h2>⛔ Accès Refusé</h2>
          </CAlert>
          
          <p className="mb-4">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
          
          {user.role && (
            <p>
              <strong>Votre rôle:</strong> {user.role}
            </p>
          )}
          
          <div className="d-grid gap-2">
            <CButton as={Link} to="/dashboard" color="primary">
              Retour à l'accueil
            </CButton>
            <CButton as={Link} to="/login" color="secondary" variant="outline">
              Se reconnecter
            </CButton>
          </div>
        </CCardBody>
      </CCard>
    </CContainer>
  );
};

export default Unauthorized;