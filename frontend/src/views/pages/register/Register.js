import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  CButton, CCard, CCardBody, CCardGroup, CCol, CContainer,
  CForm, CFormInput, CInputGroup, CInputGroupText, CRow, CSpinner
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilLockLocked, cilUser } from '@coreui/icons';

const Authentifie= () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email_or_username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirection si déjà connecté
  
  // Met à jour les champs du formulaire
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Gestion de la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/login/', formData);
      console.log("Réponse API :", response.data);

      const { token, user } = response.data;

      // Stocker le token et les infos utilisateur
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));

      // Vérifier le rôle et rediriger
      if (user.roles.includes('administrateurs')) {
        navigate('/admin/adminAc');
      } else{console.error("vous avez pas l'accee a cette page :", err.response?.data || err.message);

      }
    } catch (err) {
      console.error("Erreur lors de la connexion :", err.response?.data || err.message);
      setError(err.response?.data?.error || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={8}>
            <CCardGroup>
              <CCard className="p-2">
                <CCardBody>
                  <CForm onSubmit={handleSubmit}>
                    <h1>Authentification</h1>
                    <p className="text-body-secondary">Connectez-vous à votre compte</p>

                    {error && <p className="text-danger">{error}</p>}

                    <CInputGroup className="mb-3">
                      <CInputGroupText><CIcon icon={cilUser} /></CInputGroupText>
                      <CFormInput
                        name="email_or_username"
                        placeholder="Email ou Nom d'utilisateur"
                        autoComplete="username"
                        value={formData.email_or_username}
                        onChange={handleChange}
                      />
                    </CInputGroup>

                    <CInputGroup className="mb-4">
                      <CInputGroupText><CIcon icon={cilLockLocked} /></CInputGroupText>
                      <CFormInput
                        type="password"
                        name="password"
                        placeholder="Mot de passe"
                        autoComplete="current-password"
                        value={formData.password}
                        onChange={handleChange}
                      />
                    </CInputGroup>

                    <CRow>
                      <CCol xs={6}>
                        <CButton color="primary" className="px-4" type="submit" disabled={loading}>
                          {loading ? <CSpinner size="sm" /> : 'Se connecter'}
                        </CButton>
                      </CCol>
                      <CCol xs={6} className="text-right">
                        <CButton color="link" className="px-0">
                          Mot de passe oublié ?
                        </CButton>
                      </CCol>
                    </CRow>
                  </CForm>
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  );
};

export default Authentifie;