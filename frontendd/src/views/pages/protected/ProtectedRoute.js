import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Image,
  Spinner,
  Alert
} from 'react-bootstrap';
import styled, { keyframes } from 'styled-components';

// Configuration API
const API_URL = 'http://127.0.0.1:8000/api';

const LoginPage = ({ onLogin }) => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordShown, setPasswordShown] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');

  // Vérification authentification existante
  useEffect(() => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.email) {
          if (typeof onLogin === 'function') {
            onLogin(user, token);
          }
          navigate('/home/accueil', { replace: true });
          return;
        }
      } catch (err) {
        console.error('Erreur parsing user:', err);
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('user');
      }
    }
    
    setApiStatus('online');
  }, [navigate, onLogin]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${API_URL}/login`,
        {
          email: formData.email.trim().toLowerCase(),
          password: formData.password
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 15000
        }
      );

      const { user, token } = response.data;
      
      const userWithRole = {
        ...user,
        role: user.role || user.type || 'user'
      };

      const storage = formData.rememberMe ? localStorage : sessionStorage;

      ['access_token', 'user'].forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      storage.setItem('access_token', token);
      storage.setItem('user', JSON.stringify(userWithRole));

      if (typeof onLogin === 'function') {
        onLogin(userWithRole, token);
      }

      navigate('/home/accueil', { replace: true });

    } catch (err) {
      console.error('Erreur login:', err);
      
      if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED') {
        setError('⚠️ Serveur inaccessible. Démarrez Laravel avec: php artisan serve');
      } 
      else if (err.response?.status === 401) {
        setError('❌ Email ou mot de passe incorrect');
      } 
      else if (err.response?.status === 403) {
        setError('🔒 Compte désactivé. Contactez l\'administrateur.');
      } 
      else if (err.response?.status === 422) {
        const errors = err.response.data.errors || {};
        const errorMessages = Object.values(errors).flat().join(' / ');
        setError(`⚠️ ${errorMessages}`);
      }
      else if (err.response?.status === 500) {
        setError('💥 Erreur serveur. Vérifiez les logs Laravel.');
      }
      else {
        const message = err.response?.data?.message || err.message || 'Erreur inconnue';
        setError(`❌ ${message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContainer fluid>
      <SplitScreen>
        <LeftSide md={7} lg={7}>
          <Overlay />
          <BannerContent>
            <CompanyBadge>Groupe SNIM</CompanyBadge>
            <Title>ATTM<span>.sa</span></Title>
            <Subtitle>
              Société d'Assainissement de Travaux,<br />
              de Transport et de Maintenance
            </Subtitle>
            <FeatureList>
              <FeatureItem>✓ Gestion intégrée des opérations</FeatureItem>
              <FeatureItem>✓ Suivi en temps réel</FeatureItem>
              <FeatureItem>✓ Rapports automatisés</FeatureItem>
              <FeatureItem>✓ Sécurité renforcée</FeatureItem>
            </FeatureList>
          </BannerContent>
          <BottomCredits>© 2024 ATTM-sa. Tous droits réservés.</BottomCredits>
        </LeftSide>

        <RightSide md={5} lg={5}>
          <LoginBox>
            <LogoWrapper>
              <LogoCommerce
                src="https://ladepeche.mr/wp-content/uploads/2022/09/ATTM-LOGO.jpg"
                alt="Logo ATTM"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iNzUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZDNzU3RCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+TG9nbyBBVFRNPC90ZXh0Pgo8L3N2Zz4K';
                }}
              />
            </LogoWrapper>
            
            <LoginTitle>Bienvenue</LoginTitle>
            <LoginSubtitle>Connectez-vous à votre espace Intranet</LoginSubtitle>

            {error && (
              <StyledAlert 
                variant="danger" 
                dismissible 
                onClose={() => setError('')}
              >
                {error}
              </StyledAlert>
            )}

            <StyledForm onSubmit={handleSubmit}>
              <FormGroupCustom className="mb-4">
                <FormLabel>
                  <IconWrapper>📧</IconWrapper> Email professionnel
                </FormLabel>
                <FormControlCustom
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="prenom.nom@attm.com"
                  $loading={loading}
                />
              </FormGroupCustom>

              <FormGroupCustom className="mb-4 position-relative">
                <FormLabel>
                  <IconWrapper>🔒</IconWrapper> Mot de passe
                </FormLabel>
                <FormControlCustom
                  type={passwordShown ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="••••••••"
                  $loading={loading}
                />
                <TogglePassword
                  onClick={() => !loading && setPasswordShown(!passwordShown)}
                  $loading={loading}
                >
                  {passwordShown ? '🙈' : '👁️'}
                </TogglePassword>
              </FormGroupCustom>

              <OptionsRow>
                <Form.Check
                  type="checkbox"
                  name="rememberMe"
                  label="Se souvenir de moi"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  disabled={loading}
                  className="custom-checkbox"
                />
                <ForgotPasswordLink href="#">
                  Mot de passe oublié ?
                </ForgotPasswordLink>
              </OptionsRow>

              <LoginButton
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    <span>Se connecter</span>
                    <ButtonIcon>→</ButtonIcon>
                  </>
                )}
              </LoginButton>
            </StyledForm>

            <SecurityBadge>
              <span>🔐</span> Connexion sécurisée
            </SecurityBadge>
          </LoginBox>
        </RightSide>
      </SplitScreen>
    </AuthContainer>
  );
};

// Animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideIn = keyframes`
  from {
    transform: translateX(-50px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

// Styles
const AuthContainer = styled(Container)`
  height: 100vh;
  padding: 0;
  margin: 0;
  overflow: hidden;
`;

const SplitScreen = styled(Row)`
  height: 100%;
  margin: 0;
`;

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(55, 115, 213, 0.95) 0%,
    rgba(42, 100, 193, 0.98) 100%
  );
  z-index: 1;
`;

const LeftSide = styled(Col)`
  background: url('https://www.attm.mr/IMG/logo/attm.jpg?1704378988')
    no-repeat center center;
  background-size: cover;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 3rem;
  color: white;
  position: relative;

  @media (max-width: 768px) {
    display: none;
  }
`;

const BannerContent = styled.div`
  position: relative;
  z-index: 2;
  max-width: 80%;
  animation: ${slideIn} 1s ease-out;
`;

const CompanyBadge = styled.span`
  display: inline-block;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  padding: 0.5rem 1.5rem;
  border-radius: 50px;
  font-size: 0.9rem;
  font-weight: 500;
  letter-spacing: 1px;
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
`;

const Title = styled.h1`
  font-size: 4rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  
  span {
    color: #FFD700;
    font-weight: 300;
  }
`;

const Subtitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 400;
  margin-bottom: 3rem;
  opacity: 0.95;
  line-height: 1.6;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
`;

const FeatureList = styled.div`
  text-align: left;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 2rem;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-top: 2rem;
`;

const FeatureItem = styled.div`
  margin: 1rem 0;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:before {
    content: '✓';
    color: #FFD700;
    font-weight: bold;
    margin-right: 0.5rem;
  }
`;

const BottomCredits = styled.div`
  position: absolute;
  bottom: 2rem;
  left: 0;
  right: 0;
  z-index: 2;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  text-align: center;
`;

const RightSide = styled(Col)`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #e9ecf2 100%);
`;

const LoginBox = styled(Card)`
  width: 100%;
  max-width: 480px;
  border: none;
  border-radius: 30px;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.15);
  padding: 2.5rem;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  animation: ${fadeIn} 0.8s ease-out;
  
  @media (max-width: 768px) {
    max-width: 90%;
    padding: 2rem;
  }
`;

const LogoWrapper = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
`;

// CORRECTION : Remplacer width: 0px par width: 100% ou une valeur fixe
const LogoCommerce = styled(Image)`
  width: 100%;  /* ou 400px comme avant */
  max-width: 400px;
  height: 220px;
  object-fit: contain;
  border-radius: 20px;
  background: white;
  padding: 0.5rem;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
`;
const LoginTitle = styled.h2`
  text-align: center;
  margin-bottom: 0.5rem;
  color: #1e293b;
  font-weight: 700;
  font-size: 2rem;
`;

const LoginSubtitle = styled.p`
  text-align: center;
  margin-bottom: 2rem;
  color: #64748b;
  font-size: 1rem;
`;

const StyledAlert = styled(Alert)`
  border-radius: 15px;
  border: none;
  background: #fee2e2;
  color: #991b1b;
  font-size: 0.95rem;
  padding: 1rem;
`;

const StyledForm = styled(Form)`
  width: 100%;
`;

const FormGroupCustom = styled(Form.Group)`
  position: relative;
`;

const FormLabel = styled(Form.Label)`
  color: #334155;
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const IconWrapper = styled.span`
  font-size: 1.1rem;
`;

const FormControlCustom = styled(Form.Control)`
  height: 52px;
  border-radius: 15px;
  border: 2px solid ${props => props.$loading ? '#e2e8f0' : '#e2e8f0'};
  background: ${props => props.$loading ? '#f8fafc' : '#ffffff'};
  padding: 0.75rem 1rem;
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
    background: white;
  }
  
  &:hover:not(:disabled) {
    border-color: #94a3b8;
  }
`;

const TogglePassword = styled.span`
  position: absolute;
  right: 15px;
  top: 52px;
  transform: translateY(-50%);
  cursor: ${(props) => (props.$loading ? 'not-allowed' : 'pointer')};
  color: ${(props) => (props.$loading ? '#cbd5e1' : '#64748b')};
  font-size: 1.3rem;
  z-index: 10;
  transition: color 0.2s ease;
  
  &:hover {
    color: ${(props) => !props.$loading && '#2563eb'};
  }
`;

const OptionsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  .custom-checkbox {
    .form-check-input {
      width: 1.2rem;
      height: 1.2rem;
      border-radius: 4px;
      border: 2px solid #cbd5e1;
      cursor: pointer;
      
      &:checked {
        background-color: #2563eb;
        border-color: #2563eb;
      }
      
      &:focus {
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
      }
    }
    
    .form-check-label {
      color: #475569;
      font-size: 0.95rem;
      margin-left: 0.5rem;
      cursor: pointer;
    }
  }
`;

const ForgotPasswordLink = styled.a`
  color: #2563eb;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  transition: color 0.2s ease;
  
  &:hover {
    color: #1e40af;
    text-decoration: underline;
  }
`;

const LoginButton = styled(Button)`
  width: 100%;
  height: 54px;
  border-radius: 15px;
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  border: none;
  font-weight: 600;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(37, 99, 235, 0.4);
    
    &:before {
      left: 100%;
    }
  }
  
  &:disabled {
    background: #94a3b8;
    opacity: 0.7;
  }
`;

const ButtonIcon = styled.span`
  font-size: 1.2rem;
  transition: transform 0.3s ease;
  
  ${LoginButton}:hover & {
    transform: translateX(5px);
  }
`;

const SecurityBadge = styled.div`
  text-align: center;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
  color: #64748b;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  span {
    font-size: 1rem;
  }
`;

export default LoginPage;