// src/views/pages/pageConnection/PageConnection.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../supabaseClient';
import {
  Container, Row, Col, Form, Button, Card, Image, Spinner, Alert
} from 'react-bootstrap';
import styled, { keyframes } from 'styled-components';
import logo from '../../../assets/images/logo.png';

const I18N = {
  fr: {
    dir: 'ltr',
    badge: 'GestiStock',
    title: 'GestiStock',
    subtitle: 'Gestion de Stock,\nVentes, Achats & Caisse',
    f1: 'Gestion intégrée du stock',
    f2: 'Suivi des ventes en temps réel',
    f3: 'Achats & fournisseurs',
    f4: 'Sécurité renforcée',
    credits: '© 2026 GestiStock. Tous droits réservés.',
    welcome: 'Bienvenue',
    welcomeSub: 'Connectez-vous à votre espace GestiStock',
    email: 'Email professionnel',
    emailPh: 'prenom.nom@gestistock.com',
    pass: 'Mot de passe',
    passPh: '••••••••',
    remember: 'Se souvenir de moi',
    forgot: 'Mot de passe oublié ?',
    login: 'Se connecter',
    logging: 'Connexion en cours...',
    secure: 'Connexion sécurisée',
    errEmailReq: "L'email est requis",
    errEmailFmt: "Format d'email invalide",
    errPassReq: 'Le mot de passe est requis',
    errPassLen: 'Le mot de passe doit contenir au moins 6 caractères',
    errLogin: 'Email ou mot de passe incorrect',
    errDisabled: 'Compte désactivé. Contactez l’administrateur.',
    langBtn: 'العربية',
  },
  ar: {
    dir: 'rtl',
    badge: 'جيستي ستوك',
    title: 'GestiStock',
    subtitle: 'إدارة المخزون\nوالمبيعات والمشتريات والصندوق',
    f1: 'إدارة متكاملة للمخزون',
    f2: 'متابعة المبيعات في الوقت الحقيقي',
    f3: 'المشتريات والموردون',
    f4: 'أمان معزز',
    credits: '© 2026 GestiStock. جميع الحقوق محفوظة.',
    welcome: 'مرحباً بك',
    welcomeSub: 'سجّل الدخول إلى مساحة GestiStock',
    email: 'البريد الإلكتروني المهني',
    emailPh: 'prenom.nom@gestistock.com',
    pass: 'كلمة المرور',
    passPh: '••••••••',
    remember: 'تذكرني',
    forgot: 'نسيت كلمة المرور؟',
    login: 'تسجيل الدخول',
    logging: 'جارٍ تسجيل الدخول...',
    secure: 'اتصال آمن',
    errEmailReq: 'البريد الإلكتروني مطلوب',
    errEmailFmt: 'صيغة البريد الإلكتروني غير صحيحة',
    errPassReq: 'كلمة المرور مطلوبة',
    errPassLen: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
    errLogin: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    errDisabled: 'الحساب معطل. اتصل بالمدير.',
    langBtn: 'Français',
  },
};

function PageConnection({ onLogin }) {
  const navigate = useNavigate();
  const [lang, setLang] = useState(() => localStorage.getItem('gestistock_lang') || 'fr');
  const t = I18N[lang] || I18N.fr;

  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordShown, setPasswordShown] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    localStorage.setItem('gestistock_lang', lang);
    document.documentElement.dir = t.dir;
    document.documentElement.lang = lang;
  }, [lang, t.dir]);

  // ✅ Si déjà connecté avec Supabase -> accueil
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate('/home/accueil', { replace: true });
    });
  }, [navigate]);

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) setFormData((prev) => ({ ...prev, email: rememberedEmail, rememberMe: true }));
  }, []);

  const validateForm = () => {
    const errors = {};
    if (!formData.email.trim()) errors.email = t.errEmailReq;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = t.errEmailFmt;
    if (!formData.password) errors.password = t.errPassReq;
    else if (formData.password.length < 6) errors.password = t.errPassLen;
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    if (validationErrors[name]) setValidationErrors({ ...validationErrors, [name]: '' });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;
    setLoading(true);
    try {
      // ✅ Connexion Supabase - remplace ton ancien 【entity-axios¦canonical_name=axios】 vers intranet-attm.com
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password,
      });
      if (authError) throw authError;

      if (formData.rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email.trim());
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      if (onLogin) onLogin(data.user, data.session?.access_token);
      navigate('/home/accueil', { replace: true });
    } catch (err) {
      console.error('❌ Erreur login:', err);
      if (err.message?.includes('Invalid login')) setError(t.errLogin);
      else if (err.message?.includes('disabled')) setError(t.errDisabled);
      else setError(err.message || t.errLogin);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContainer fluid dir={t.dir} lang={lang}>
      <SplitScreen>
        <LeftSide md={7} lg={7}>
          <Overlay />
          <LangBtn onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')}>{t.langBtn}</LangBtn>
          <BannerContent>
            <CompanyBadge>{t.badge}</CompanyBadge>
            <Title>Gesti<span>Stock</span></Title>
            <Subtitle>{t.subtitle.split('\n').map((l, i) => (<span key={i}>{l}<br /></span>))}</Subtitle>
            <FeatureList>
              <FeatureItem>{t.f1}</FeatureItem>
              <FeatureItem>{t.f2}</FeatureItem>
              <FeatureItem>{t.f3}</FeatureItem>
              <FeatureItem>{t.f4}</FeatureItem>
            </FeatureList>
          </BannerContent>
          <BottomCredits>{t.credits}</BottomCredits>
        </LeftSide>

        <RightSide md={5} lg={5}>
          <LoginBox>
            <LogoWrapper>
              <LogoCommerce src={logo} alt="GestiStock" />
            </LogoWrapper>

            <LoginTitle>{t.welcome}</LoginTitle>
            <LoginSubtitle>{t.welcomeSub}</LoginSubtitle>

            {error && (
              <StyledAlert variant="danger" dismissible onClose={() => setError('')}>
                <strong>Erreur:</strong> {error}
              </StyledAlert>
            )}

            <StyledForm onSubmit={handleSubmit} noValidate>
              <FormGroupCustom className="mb-4">
                <FormLabel htmlFor="login-email">
                  <IconWrapper>📧</IconWrapper> {t.email} <span className="text-danger">*</span>
                </FormLabel>
                <FormControlCustom
                  type="email" id="login-email" name="email"
                  value={formData.email} onChange={handleChange}
                  required disabled={loading} placeholder={t.emailPh}
                  isInvalid={!!validationErrors.email} $loading={loading}
                  autoComplete="username" dir="ltr"
                />
                {validationErrors.email && <FormError>{validationErrors.email}</FormError>}
              </FormGroupCustom>

              <FormGroupCustom className="mb-4 position-relative">
                <FormLabel htmlFor="login-password">
                  <IconWrapper>🔒</IconWrapper> {t.pass} <span className="text-danger">*</span>
                </FormLabel>
                <FormControlCustom
                  type={passwordShown ? 'text' : 'password'} id="login-password" name="password"
                  value={formData.password} onChange={handleChange}
                  required disabled={loading} placeholder={t.passPh}
                  isInvalid={!!validationErrors.password} $loading={loading}
                  autoComplete="current-password" dir="ltr"
                />
                <TogglePassword type="button" onClick={() => !loading && setPasswordShown(!passwordShown)} disabled={loading} $loading={loading}>
                  {passwordShown ? '🙈' : '👁'}
                </TogglePassword>
                {validationErrors.password && <FormError>{validationErrors.password}</FormError>}
              </FormGroupCustom>

              <OptionsRow>
                <Form.Check type="checkbox" id="rememberMe" name="rememberMe" label={t.remember}
                  checked={formData.rememberMe} onChange={handleChange} disabled={loading} className="custom-checkbox" />
                <ForgotPasswordLink href="#" onClick={(e) => e.preventDefault()}>{t.forgot}</ForgotPasswordLink>
              </OptionsRow>

              <LoginButton type="submit" disabled={loading}>
                {loading ? (<><Spinner animation="border" size="sm" className="me-2" /><span>{t.logging}</span></>) : (<><span>{t.login}</span><ButtonIcon>→</ButtonIcon></>)}
              </LoginButton>

              <SecurityBadge><span>🔐</span> {t.secure}</SecurityBadge>
            </StyledForm>
          </LoginBox>
        </RightSide>
      </SplitScreen>
    </AuthContainer>
  );
}

// ===== STYLES - même style que ton ancienne page =====
const fadeIn = keyframes`from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); }`;
const slideIn = keyframes`from { transform: translateX(-50px); opacity: 0; } to { transform: translateX(0); opacity: 1; }`;

const AuthContainer = styled(Container)`height: 100vh; padding: 0; margin: 0; overflow: hidden;`;
const SplitScreen = styled(Row)`height: 100%; margin: 0;`;
const Overlay = styled.div`position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, rgba(31,94,234,0.95) 0%, rgba(20,33,61,0.98) 100%); z-index: 1;`;
const LeftSide = styled(Col)`background: linear-gradient(135deg, #1f5eea, #14213d); display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 3rem; color: white; position: relative; @media (max-width: 768px) { display: none; }`;
const BannerContent = styled.div`position: relative; z-index: 2; max-width: 80%; animation: ${slideIn} 1s ease-out;`;
const CompanyBadge = styled.span`display: inline-block; background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); padding: 0.5rem 1.5rem; border-radius: 50px; font-size: 0.9rem; font-weight: 500; letter-spacing: 1px; margin-bottom: 2rem; border: 1px solid rgba(255,255,255,0.3);`;
const Title = styled.h1`font-size: 4rem; font-weight: 800; margin-bottom: 1.5rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); span { color: #FFD700; font-weight: 300; }`;
const Subtitle = styled.h2`font-size: 1.5rem; font-weight: 400; margin-bottom: 3rem; opacity: 0.95; line-height: 1.6;`;
const FeatureList = styled.div`text-align: left; background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); padding: 2rem; border-radius: 20px; border: 1px solid rgba(255,255,255,0.2); margin-top: 2rem;`;
const FeatureItem = styled.div`margin: 1rem 0; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem; &:before { content: '✓'; color: #FFD700; font-weight: bold; margin-right: 0.5rem; }`;
const BottomCredits = styled.div`position: absolute; bottom: 2rem; left: 0; right: 0; z-index: 2; color: rgba(255,255,255,0.7); font-size: 0.9rem; text-align: center;`;
const RightSide = styled(Col)`display: flex; justify-content: center; align-items: center; padding: 2rem; background: linear-gradient(135deg, #f5f7fa 0%, #e9ecf2 100%);`;
const LoginBox = styled(Card)`width: 100%; max-width: 480px; border: none; border-radius: 30px; box-shadow: 0 30px 60px rgba(0,0,0,0.15); padding: 2.5rem; background: rgba(255,255,255,0.98); animation: ${fadeIn} 0.8s ease-out; @media (max-width: 768px) { max-width: 90%; padding: 2rem; }`;
const LogoWrapper = styled.div`text-align: center; margin-bottom: 1.5rem;`;
const LogoCommerce = styled(Image)`width: 100%; max-width: 220px; height: auto; object-fit: contain; border-radius: 20px; background: white; padding: 0.5rem; box-shadow: 0 10px 20px rgba(0,0,0,0.1); margin: 0 auto;`;
const LoginTitle = styled.h2`text-align: center; margin-bottom: 0.5rem; color: #1e293b; font-weight: 700; font-size: 2rem;`;
const LoginSubtitle = styled.p`text-align: center; margin-bottom: 2rem; color: #64748b; font-size: 1rem;`;
const StyledAlert = styled(Alert)`border-radius: 15px; border: none; background: #fee2e2; color: #991b1b; font-size: 0.95rem; padding: 1rem;`;
const StyledForm = styled(Form)`width: 100%;`;
const FormGroupCustom = styled(Form.Group)`position: relative;`;
const FormLabel = styled(Form.Label)`color: #334155; font-weight: 600; font-size: 0.95rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;`;
const IconWrapper = styled.span`font-size: 1.1rem;`;
const FormControlCustom = styled(Form.Control)`height: 52px; border-radius: 15px; border: 2px solid ${props => props.isInvalid ? '#dc3545' : '#e2e8f0'}; padding: 0.75rem 1rem; font-size: 1rem; &:focus { border-color: #1f5eea; box-shadow: 0 0 0 4px rgba(31,94,234,0.1); }`;
const FormError = styled.div`color: #dc3545; font-size: 0.85rem; margin-top: 0.25rem; margin-left: 0.5rem;`;
const TogglePassword = styled.button`position: absolute; right: 15px; top: 52px; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #64748b; font-size: 1.3rem; z-index: 10;`;
const OptionsRow = styled.div`display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; .custom-checkbox .form-check-input { width: 1.2rem; height: 1.2rem; border-radius: 4px; &:checked { background-color: #1f5eea; border-color: #1f5eea; } }`;
const ForgotPasswordLink = styled.a`color: #1f5eea; text-decoration: none; font-size: 0.95rem; font-weight: 500; &:hover { text-decoration: underline; }`;
const LoginButton = styled(Button)`width: 100%; height: 54px; border-radius: 15px; background: linear-gradient(135deg, #1f5eea 0%, #14213d 100%); border: none; font-weight: 600; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(31,94,234,0.4); }`;
const ButtonIcon = styled.span`font-size: 1.2rem;`;
const SecurityBadge = styled.div`text-align: center; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;`;
const LangBtn = styled.button`position: absolute; top: 20px; inset-inline-end: 20px; z-index: 3; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4); color: white; padding: 8px 16px; border-radius: 99px; font-weight: 700; cursor: pointer;`;

export default PageConnection;