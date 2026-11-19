/*import React, { useState, useEffect, useRef } from 'react';
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

// 🔥 URL DE L'API
const API_BASE_URL = "https://intranet-attm.com/api";

function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordShown, setPasswordShown] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [apiStatus, setApiStatus] = useState({ checking: true, reachable: false });
  
  // ✅ Utiliser useRef pour éviter les appels multiples
  const apiChecked = useRef(false);
  const checkingRef = useRef(false);
  const loginAttempted = useRef(false);

  // ✅ Vérifier si l'API est accessible - UNE SEULE FOIS
  useEffect(() => {
    // ✅ Éviter les appels multiples
    if (apiChecked.current || checkingRef.current) return;
    
    const checkApiHealth = async () => {
      checkingRef.current = true;
      try {
        console.log('🔍 Vérification API avec URL FORCÉE:', API_BASE_URL);
        
        // ✅ Test avec un timeout pour éviter les blocages
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        await axios.get(`${API_BASE_URL}/health`, {
          signal: controller.signal,
          timeout: 5000,
          headers: {
            'Accept': 'application/json'
          }
        });
        
        clearTimeout(timeoutId);
        setApiStatus({ checking: false, reachable: true });
        console.log('✅ API accessible');
      } catch (err) {
        console.error('❌ API inaccessible:', err.message);
        setApiStatus({ checking: false, reachable: false });
      } finally {
        apiChecked.current = true;
        checkingRef.current = false;
      }
    };
    
    checkApiHealth();
  }, []); // ✅ Tableau de dépendances vide = exécuté une seule fois

  // ✅ Afficher l'URL utilisée - UNE SEULE FOIS
  useEffect(() => {
    console.log('🌐 URL DE L\'API UTILISÉE:', API_BASE_URL);
  }, []); // ✅ Tableau de dépendances vide

  // ✅ Vérifier si déjà connecté - UNE SEULE FOIS
  useEffect(() => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    if (token && user) {
      // ✅ Vérifier si le token est valide
      const verifyToken = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/user`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            },
            timeout: 5000
          });
          
          if (response.data && response.data.success !== false) {
            navigate('/home/accueil', { replace: true });
          } else {
            // Token invalide, nettoyer
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('auth_token');
            sessionStorage.removeItem('user');
          }
        } catch (error) {
          // Token invalide, nettoyer
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          sessionStorage.removeItem('auth_token');
          sessionStorage.removeItem('user');
        }
      };
      
      verifyToken();
    }
  }, [navigate]); // ✅ Dépendance uniquement sur navigate

  // ✅ Remplir l'email si "Se souvenir de moi" - UNE SEULE FOIS
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setFormData(prev => ({
        ...prev,
        email: rememberedEmail,
        rememberMe: true
      }));
    }
  }, []); // ✅ Tableau de dépendances vide

  const validateForm = () => {
    const errors = {};
    
    if (!formData.email.trim()) {
      errors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Format d\'email invalide';
    }
    
    if (!formData.password) {
      errors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: ''
      });
    }
    
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // ✅ Éviter les soumissions multiples
    if (loginAttempted.current) return;
    loginAttempted.current = true;
    
    if (!validateForm()) {
      loginAttempted.current = false;
      return;
    }
    
    // Vérifier si l'API est accessible
    if (!apiStatus.reachable && !apiStatus.checking) {
      setError(`⚠️ L'API n'est pas accessible à l'adresse: ${API_BASE_URL}. Vérifiez que le serveur est démarré.`);
      loginAttempted.current = false;
      return;
    }
    
    setLoading(true);

    try {
      console.log('📡 Tentative de connexion à:', `${API_BASE_URL}/login`);
      
      const response = await axios.post(`${API_BASE_URL}/login`, {
        email: formData.email.trim(),
        password: formData.password
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        withCredentials: true,
        timeout: 10000
      });

      console.log('✅ Réponse reçue:', response.status);

      if (response.data.token && response.data.user) {
        // Nettoyer les anciennes données
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('user');
        
        // Stocker selon le choix "Se souvenir de moi"
        if (formData.rememberMe) {
          localStorage.setItem('auth_token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          localStorage.setItem('rememberedEmail', formData.email.trim());
        } else {
          sessionStorage.setItem('auth_token', response.data.token);
          sessionStorage.setItem('user', JSON.stringify(response.data.user));
          localStorage.removeItem('rememberedEmail');
        }

        if (onLogin) {
          onLogin(response.data.user, response.data.token);
        }

        navigate('/home/accueil', { replace: true });
      } else {
        throw new Error('Format de réponse invalide');
      }

    } catch (err) {
      console.error('❌ Erreur détaillée:', {
        message: err.message,
        code: err.code,
        response: err.response?.data,
        status: err.response?.status
      });
      
      // Gestion des erreurs spécifiques
      if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
        setError(`🌐 Erreur de connexion réseau à ${API_BASE_URL}. Vérifiez que le serveur est démarré et que CORS est configuré.`);
      } else if (err.code === 'ECONNABORTED') {
        setError('⏱️ La requête a expiré. Veuillez réessayer.');
      } else if (err.response?.status === 401) {
        setError('❌ Email ou mot de passe incorrect');
      } else if (err.response?.status === 403) {
        setError('🔒 Compte désactivé. Contactez l\'administrateur.');
      } else if (err.response?.status === 422) {
        const errors = err.response.data?.errors;
        if (errors?.email) setError(errors.email[0]);
        else if (errors?.password) setError(errors.password[0]);
        else setError('Données de connexion invalides');
      } else if (err.response?.status >= 500) {
        setError('💥 Erreur du serveur. Veuillez réessayer plus tard.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(`Erreur: ${err.message}`);
      }
    } finally {
      setLoading(false);
      loginAttempted.current = false;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit(e);
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
              <StyledAlert variant="danger" dismissible onClose={() => setError('')}>
                <strong>Erreur:</strong> {error}
              </StyledAlert>
            )}

            {!apiStatus.checking && !apiStatus.reachable && !error && (
              <StyledAlert variant="warning">
                <strong>⚠️ Attention:</strong> L'API semble inaccessible à {API_BASE_URL}
              </StyledAlert>
            )}

            <StyledForm onSubmit={handleSubmit} noValidate>
              <FormGroupCustom className="mb-4">
                <FormLabel htmlFor="login-email">
                  <IconWrapper>📧</IconWrapper> Email professionnel <span className="text-danger">*</span>
                </FormLabel>
                <FormControlCustom
                  type="email"
                  id="login-email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  required
                  disabled={loading}
                  placeholder="prenom.nom@attm.com"
                  isInvalid={!!validationErrors.email}
                  $loading={loading}
                  autoComplete="username"
                  aria-describedby={validationErrors.email ? "email-error" : undefined}
                />
                {validationErrors.email && (
                  <FormError id="email-error">{validationErrors.email}</FormError>
                )}
              </FormGroupCustom>

              <FormGroupCustom className="mb-4 position-relative">
                <FormLabel htmlFor="login-password">
                  <IconWrapper>🔒</IconWrapper> Mot de passe <span className="text-danger">*</span>
                </FormLabel>
                <FormControlCustom
                  type={passwordShown ? 'text' : 'password'}
                  id="login-password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  required
                  disabled={loading}
                  placeholder="••••••••"
                  isInvalid={!!validationErrors.password}
                  $loading={loading}
                  autoComplete="current-password"
                  aria-describedby={validationErrors.password ? "password-error" : undefined}
                />
                <TogglePassword
                  type="button"
                  onClick={() => !loading && setPasswordShown(!passwordShown)}
                  disabled={loading}
                  $loading={loading}
                  aria-label={passwordShown ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {passwordShown ? '🙈' : '👁️'}
                </TogglePassword>
                {validationErrors.password && (
                  <FormError id="password-error">{validationErrors.password}</FormError>
                )}
              </FormGroupCustom>

              <OptionsRow>
                <Form.Check
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  label="Se souvenir de moi"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  disabled={loading}
                  className="custom-checkbox"
                />
                <ForgotPasswordLink 
                  href="#" 
                  onClick={(e) => e.preventDefault()}
                  aria-label="Mot de passe oublié"
                >
                  Mot de passe oublié ?
                </ForgotPasswordLink>
              </OptionsRow>

              <LoginButton type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" as="span" role="status" aria-hidden="true" />
                    <span>Connexion en cours...</span>
                  </>
                ) : (
                  <>
                    <span>Se connecter</span>
                    <ButtonIcon aria-hidden="true">→</ButtonIcon>
                  </>
                )}
              </LoginButton>

              <SecurityBadge>
                <span aria-hidden="true">🔐</span> Connexion sécurisée
              </SecurityBadge>
            </StyledForm>
          </LoginBox>
        </RightSide>
      </SplitScreen>
    </AuthContainer>
  );
}

// ===== STYLES =====
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { transform: translateX(-50px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const AuthContainer = styled(Container)`
  height: 100vh; padding: 0; margin: 0; overflow: hidden;
`;

const SplitScreen = styled(Row)` height: 100%; margin: 0; `;

const Overlay = styled.div`
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(135deg, rgba(55,115,213,0.95) 0%, rgba(42,100,193,0.98) 100%);
  z-index: 1;
`;

const LeftSide = styled(Col)`
  background: url('https://www.attm.mr/IMG/logo/attm.jpg?1704378988') no-repeat center center;
  background-size: cover; display: flex; flex-direction: column;
  justify-content: center; align-items: center; text-align: center;
  padding: 3rem; color: white; position: relative;
  @media (max-width: 768px) { display: none; }
`;

const BannerContent = styled.div`
  position: relative; z-index: 2; max-width: 80%; animation: ${slideIn} 1s ease-out;
`;

const CompanyBadge = styled.span`
  display: inline-block; background: rgba(255,255,255,0.2); backdrop-filter: blur(10px);
  padding: 0.5rem 1.5rem; border-radius: 50px; font-size: 0.9rem; font-weight: 500;
  letter-spacing: 1px; margin-bottom: 2rem; border: 1px solid rgba(255,255,255,0.3);
`;

const Title = styled.h1`
  font-size: 4rem; font-weight: 800; margin-bottom: 1.5rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  span { color: #FFD700; font-weight: 300; }
`;

const Subtitle = styled.h2`
  font-size: 1.5rem; font-weight: 400; margin-bottom: 3rem; opacity: 0.95;
  line-height: 1.6; text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
`;

const FeatureList = styled.div`
  text-align: left; background: rgba(255,255,255,0.1); backdrop-filter: blur(10px);
  padding: 2rem; border-radius: 20px; border: 1px solid rgba(255,255,255,0.2); margin-top: 2rem;
`;

const FeatureItem = styled.div`
  margin: 1rem 0; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;
  &:before { content: '✓'; color: #FFD700; font-weight: bold; margin-right: 0.5rem; }
`;

const BottomCredits = styled.div`
  position: absolute; bottom: 2rem; left: 0; right: 0; z-index: 2;
  color: rgba(255,255,255,0.7); font-size: 0.9rem; text-align: center;
`;

const RightSide = styled(Col)`
  display: flex; justify-content: center; align-items: center; padding: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #e9ecf2 100%);
`;

const LoginBox = styled(Card)`
  width: 100%; max-width: 480px; border: none; border-radius: 30px;
  box-shadow: 0 30px 60px rgba(0,0,0,0.15); padding: 2.5rem;
  background: rgba(255,255,255,0.98); backdrop-filter: blur(10px);
  animation: ${fadeIn} 0.8s ease-out;
  @media (max-width: 768px) { max-width: 90%; padding: 2rem; }
`;

const LogoWrapper = styled.div` text-align: center; margin-bottom: 1.5rem; `;

const LogoCommerce = styled(Image)`
  width: 100%;
  max-width: 350px;
  height: auto;
  object-fit: contain;
  border-radius: 20px;
  background: white;
  padding: 0.5rem;
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
  margin: 0 auto;
`;

const LoginTitle = styled.h2`
  text-align: center; margin-bottom: 0.5rem; color: #1e293b; font-weight: 700; font-size: 2rem;
`;

const LoginSubtitle = styled.p`
  text-align: center; margin-bottom: 2rem; color: #64748b; font-size: 1rem;
`;

const StyledAlert = styled(Alert)`
  border-radius: 15px; border: none; background: #fee2e2; color: #991b1b;
  font-size: 0.95rem; padding: 1rem;
`;

const StyledForm = styled(Form)` width: 100%; `;

const FormGroupCustom = styled(Form.Group)` position: relative; `;

const FormLabel = styled(Form.Label)`
  color: #334155; font-weight: 600; font-size: 0.95rem; margin-bottom: 0.5rem;
  display: flex; align-items: center; gap: 0.5rem;
`;

const IconWrapper = styled.span` font-size: 1.1rem; `;

const FormControlCustom = styled(Form.Control)`
  height: 52px; border-radius: 15px; border: 2px solid ${props => props.isInvalid ? '#dc3545' : (props.$loading ? '#e2e8f0' : '#e2e8f0')};
  background: ${props => props.$loading ? '#f8fafc' : '#ffffff'}; padding: 0.75rem 1rem;
  font-size: 1rem; transition: all 0.3s ease;
  &:focus { 
    border-color: #2563eb; 
    box-shadow: 0 0 0 4px rgba(37,99,235,0.1); 
    background: white; 
  }
  &:hover:not(:disabled) { border-color: #94a3b8; }
  &.is-invalid { border-color: #dc3545; }
`;

const FormError = styled.div`
  color: #dc3545;
  font-size: 0.85rem;
  margin-top: 0.25rem;
  margin-left: 0.5rem;
`;

const TogglePassword = styled.button`
  position: absolute;
  right: 15px;
  top: 52px;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: ${props => props.$loading ? 'not-allowed' : 'pointer'};
  color: ${props => props.$loading ? '#cbd5e1' : '#64748b'};
  font-size: 1.3rem;
  z-index: 10;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover:not(:disabled) { 
    color: #2563eb; 
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const OptionsRow = styled.div`
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;
  .custom-checkbox .form-check-input {
    width: 1.2rem; height: 1.2rem; border-radius: 4px; border: 2px solid #cbd5e1;
    &:checked { background-color: #2563eb; border-color: #2563eb; }
  }
  .custom-checkbox .form-check-label {
    color: #475569; font-size: 0.95rem; margin-left: 0.5rem;
  }
`;

const ForgotPasswordLink = styled.a`
  color: #2563eb; text-decoration: none; font-size: 0.95rem; font-weight: 500;
  &:hover { color: #1e40af; text-decoration: underline; }
`;

const LoginButton = styled(Button)`
  width: 100%; height: 54px; border-radius: 15px;
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); border: none;
  font-weight: 600; font-size: 1.1rem; display: flex; align-items: center;
  justify-content: center; gap: 0.5rem; transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px); box-shadow: 0 10px 25px rgba(37,99,235,0.4);
  }
  
  &:disabled { background: #94a3b8; opacity: 0.7; }
`;

const ButtonIcon = styled.span`
  font-size: 1.2rem; transition: transform 0.3s ease;
  ${LoginButton}:hover & { transform: translateX(5px); }
`;

const SecurityBadge = styled.div`
  text-align: center; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;
  color: #64748b; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
`;

export default LoginPage;*/