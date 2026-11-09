// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const I18N = {
  fr: {
    dir: 'ltr',
    title: 'Bon retour',
    subtitle: 'Connectez-vous pour gérer votre stock et vos ventes.',
    email: 'Adresse email',
    email_ph: 'votre@email.com',
    password: 'Mot de passe',
    password_ph: '••••••••',
    login: 'Se connecter',
    logging_in: 'Connexion en cours…',
    forgot: 'Mot de passe oublié ?',
    error: 'Email ou mot de passe incorrect.',
    required: 'Veuillez remplir tous les champs.',
    show: 'Afficher le mot de passe',
    hide: 'Masquer le mot de passe',
    tagline: 'Votre stock, toujours sous contrôle.',
    tagline_sub: 'Produits, entrées, sorties et ventes : tout est au même endroit, à jour en temps réel.',
    switch: 'عربية',
  },
  ar: {
    dir: 'rtl',
    title: 'أهلاً بعودتك',
    subtitle: 'سجّل الدخول لإدارة مخزونك ومبيعاتك.',
    email: 'البريد الإلكتروني',
    email_ph: 'your@email.com',
    password: 'كلمة المرور',
    password_ph: '••••••••',
    login: 'تسجيل الدخول',
    logging_in: 'جارٍ تسجيل الدخول…',
    forgot: 'هل نسيت كلمة المرور؟',
    error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    required: 'الرجاء ملء جميع الحقول.',
    show: 'إظهار كلمة المرور',
    hide: 'إخفاء كلمة المرور',
    tagline: 'مخزونك دائمًا تحت السيطرة.',
    tagline_sub: 'المنتجات والمداخل والمخارج والمبيعات: كل شيء في مكان واحد ومحدّث لحظة بلحظة.',
    switch: 'Français',
  },
};

const LANG_KEY = 'gestistock_lang';

/* ---------- Icônes (SVG inline, aucune dépendance) ---------- */
const Icon = ({ children }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);
const MailIcon = () => (
  <Icon>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="m4 7 8 6 8-6" />
  </Icon>
);
const LockIcon = () => (
  <Icon>
    <rect x="4" y="11" width="16" height="9" rx="3" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Icon>
);
const EyeIcon = () => (
  <Icon>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
);
const EyeOffIcon = () => (
  <Icon>
    <path d="M3 3l18 18" />
    <path d="M10.6 6.1A9.7 9.7 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.4 7.6C3.9 9.3 2 12 2 12s3.5 6 10 6c1.4 0 2.7-.3 3.8-.8" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </Icon>
);
const AlertIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5M12 16.5v.01" />
  </Icon>
);
const ArrowIcon = () => (
  <svg className="arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/* ---------- Illustration : étagères de stock ---------- */
const ShelfArt = () => {
  // [x, largeur, hauteur, remplissage] par étagère — évoque des niveaux de stock
  const rows = [
    { y: 70, boxes: [[20, 54, 40, 0.95], [80, 54, 52, 0.55], [140, 54, 34, 0.8], [200, 54, 46, 0.35]] },
    { y: 170, boxes: [[20, 54, 48, 0.7], [80, 54, 36, 0.95], [140, 54, 54, 0.45], [200, 54, 40, 0.85]] },
    { y: 270, boxes: [[20, 54, 38, 0.5], [80, 54, 50, 0.85], [140, 54, 42, 0.95], [200, 54, 56, 0.6]] },
  ];
  return (
    <svg className="shelf-art" viewBox="0 0 280 300" role="img" aria-hidden="true">
      {rows.map((r) => (
        <g key={r.y}>
          {r.boxes.map(([x, w, h, fill], i) => (
            <g key={i}>
              <rect x={x} y={r.y - h} width={w} height={h} rx="6" className="crate" />
              <rect x={x} y={r.y - h * fill} width={w} height={h * fill} rx="6" className="crate-fill" />
            </g>
          ))}
          <rect x="8" y={r.y} width="264" height="6" rx="3" className="plank" />
        </g>
      ))}
    </svg>
  );
};

const LoginPage = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem(LANG_KEY) === 'ar' ? 'ar' : 'fr'; } catch { return 'fr'; }
  });
  const t = I18N[lang];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleLang = () => {
    const newLang = lang === 'fr' ? 'ar' : 'fr';
    setLang(newLang);
    try { localStorage.setItem(LANG_KEY, newLang); } catch {}
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      return setError(t.required);
    }

    setLoading(true);
    setError('');

    try {
      const { data: user, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.trim())
        .single();

      if (dbError || !user) throw new Error('Utilisateur introuvable');
      if (user.password !== password) throw new Error('Mot de passe incorrect');

      localStorage.setItem('token', 'session-ok');
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/dashboard');
    } catch (err) {
      console.error('Erreur de connexion:', err.message);
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lp" dir={t.dir} lang={lang}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Cairo:wght@400;600;700;800&display=swap');

        .lp {
          --ink: #0b2530;
          --ink-2: #123644;
          --sea: #1f6f78;
          --sand: #f6f4ef;
          --paper: #ffffff;
          --text: #14232b;
          --muted: #5d6f78;
          --line: #dde3e6;
          --accent: #f97316;
          --accent-dark: #c2540a;
          --danger: #b42318;
          --danger-bg: #fef3f2;

          min-height: 100vh;
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
          font-family: ${lang === 'ar' ? "'Cairo', sans-serif" : "'Manrope', sans-serif"};
          color: var(--text);
          background: var(--sand);
          position: relative;
        }
        .lp *, .lp *::before, .lp *::after { box-sizing: border-box; }

        /* ---------- Panneau de marque ---------- */
        .lp-brand {
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(120% 80% at 0% 100%, rgba(31,111,120,0.55) 0%, transparent 60%),
            var(--ink);
          color: #eaf2f4;
          padding: 48px 56px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .lp-wordmark {
          font-size: 1.35rem;
          font-weight: 800;
          letter-spacing: 0.02em;
          direction: ltr;
          align-self: flex-start;
        }
        [dir="rtl"] .lp-wordmark { align-self: flex-end; }
        .lp-wordmark b { color: var(--accent); font-weight: 800; }

        .lp-brand-body { max-width: 440px; }
        .lp-tagline {
          font-size: clamp(1.7rem, 2.6vw, 2.4rem);
          line-height: 1.12;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin: 0 0 18px;
          text-wrap: balance;
        }
        [dir="rtl"] .lp-tagline { letter-spacing: 0; line-height: 1.35; }
        .lp-tagline-sub {
          margin: 0;
          font-size: 1rem;
          line-height: 1.65;
          color: #a9c0c7;
          max-width: 40ch;
        }

        .shelf-art {
          display: block;
          width: 100%;
          max-width: 300px;
          max-height: 32vh;
          margin: auto;
          opacity: 0.95;
          direction: ltr;
          flex: 0 1 auto;
          min-height: 0;
        }
        .shelf-art .plank { fill: #2a5565; }
        .shelf-art .crate { fill: rgba(255,255,255,0.06); stroke: rgba(255,255,255,0.14); stroke-width: 1; }
        .shelf-art .crate-fill { fill: var(--sea); }
        .shelf-art g:nth-child(2) .crate-fill { fill: #2b8791; }
        .shelf-art g:nth-child(3) .crate-fill { fill: var(--accent); opacity: 0.9; }

        /* Une seule animation d'entrée : les caisses se remplissent */
        @keyframes fillUp {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        .shelf-art .crate-fill {
          transform-box: fill-box;
          transform-origin: bottom;
          animation: fillUp 0.9s cubic-bezier(.2,.7,.2,1) both;
        }
        .shelf-art g > g:nth-child(2) .crate-fill { animation-delay: 0.08s; }
        .shelf-art g > g:nth-child(3) .crate-fill { animation-delay: 0.16s; }
        .shelf-art g > g:nth-child(4) .crate-fill { animation-delay: 0.24s; }

        /* ---------- Panneau formulaire ---------- */
        .lp-form-side {
          display: grid;
          place-items: center;
          padding: 72px 28px 40px;
          min-width: 0;
        }
        .lp-card {
          width: 100%;
          max-width: 400px;
          margin-inline: auto;
        }
        .lp-title {
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin: 0 0 8px;
          color: var(--ink);
        }
        [dir="rtl"] .lp-title { letter-spacing: 0; }
        .lp-subtitle {
          margin: 0 0 32px;
          color: var(--muted);
          font-size: 0.97rem;
          line-height: 1.55;
        }

        .lp-error {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: var(--danger-bg);
          color: var(--danger);
          border: 1px solid #fecdca;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 20px;
        }
        .lp-error svg { flex: none; margin-top: 1px; }

        .lp-field { margin-bottom: 20px; }
        .lp-label-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 8px;
        }
        .lp-label {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--ink-2);
        }
        .lp-forgot {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--sea);
          text-decoration: none;
          border-radius: 4px;
        }
        .lp-forgot:hover { color: var(--ink); text-decoration: underline; }

        .lp-input-wrap { position: relative; }
        .lp-input-wrap .lead {
          position: absolute;
          inset-inline-start: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #8a9ba3;
          display: flex;
          pointer-events: none;
          transition: color .15s;
        }
        .lp-input {
          width: 100%;
          height: 52px;
          padding-block: 0;
          padding-inline: 44px 16px;
          font: inherit;
          font-size: 1rem;
          color: var(--text);
          background: var(--paper);
          border: 1.5px solid var(--line);
          border-radius: 14px;
          outline: none;
          text-align: start;
          transition: border-color .15s, box-shadow .15s;
        }
        .lp-input.has-toggle { padding-inline: 44px 48px; }
        .lp-input::placeholder { color: #a3b0b6; }
        .lp-input:hover { border-color: #c3cdd2; }
        .lp-input:focus {
          border-color: var(--sea);
          box-shadow: 0 0 0 4px rgba(31,111,120,0.14);
        }
        .lp-input-wrap:focus-within .lead { color: var(--sea); }
        .lp-input.invalid { border-color: #f04438; }

        .lp-toggle {
          position: absolute;
          inset-inline-end: 6px;
          top: 50%;
          transform: translateY(-50%);
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          border-radius: 10px;
          color: #8a9ba3;
          cursor: pointer;
        }
        .lp-toggle:hover { color: var(--ink); background: #f0f3f4; }

        .lp-submit {
          width: 100%;
          height: 54px;
          margin-top: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font: inherit;
          font-size: 1rem;
          font-weight: 700;
          color: #fff;
          background: var(--ink);
          border: none;
          border-radius: 14px;
          cursor: pointer;
          transition: background .18s, transform .18s, box-shadow .18s;
        }
        .lp-submit .arrow { transition: transform .18s; }
        [dir="rtl"] .lp-submit .arrow { transform: scaleX(-1); }
        .lp-submit:hover:not(:disabled) {
          background: var(--ink-2);
          box-shadow: 0 10px 24px rgba(11,37,48,0.25);
        }
        .lp-submit:hover:not(:disabled) .arrow { transform: translateX(3px); }
        [dir="rtl"] .lp-submit:hover:not(:disabled) .arrow { transform: scaleX(-1) translateX(3px); }
        .lp-submit:active:not(:disabled) { transform: translateY(1px); }
        .lp-submit:disabled { background: #6b8590; cursor: not-allowed; }

        .lp-spinner {
          width: 18px;
          height: 18px;
          border: 2.5px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin .7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .lp-lang {
          position: absolute;
          z-index: 5;
          top: 20px;
          inset-inline-end: 20px;
          height: 40px;
          padding: 0 16px;
          font: inherit;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--ink-2);
          background: var(--paper);
          border: 1.5px solid var(--line);
          border-radius: 99px;
          cursor: pointer;
          transition: border-color .15s, background .15s;
        }
        .lp-lang:hover { border-color: var(--sea); }

        /* Focus clavier visible */
        .lp button:focus-visible,
        .lp a:focus-visible {
          outline: 3px solid var(--accent);
          outline-offset: 2px;
        }

        /* ---------- Mobile ---------- */
        @media (max-width: 900px) {
          .lp { grid-template-columns: 1fr; }
          .lp-brand {
            padding: 28px 24px 26px;
            min-height: 0;
            gap: 0;
          }
          .lp-brand-body, .shelf-art { display: none; }
          .lp-form-side { padding: 36px 20px 48px; align-items: flex-start; }
          .lp-lang { top: 16px; inset-inline-end: 16px; background: rgba(255,255,255,0.1); color: #fff; border-color: rgba(255,255,255,0.25); }
          .lp-lang:hover { background: rgba(255,255,255,0.18); border-color: rgba(255,255,255,0.5); }
          .lp-title { font-size: 1.7rem; }
        }

        @media (prefers-reduced-motion: reduce) {
          .shelf-art .crate-fill, .lp-spinner { animation: none; }
          .lp *, .lp *::before, .lp *::after { transition: none !important; }
        }
      `}</style>

      {/* Panneau de marque */}
      <aside className="lp-brand">
        <div className="lp-wordmark">GESTI<b>STOCK</b></div>
        <ShelfArt />
        <div className="lp-brand-body">
          <h2 className="lp-tagline">{t.tagline}</h2>
          <p className="lp-tagline-sub">{t.tagline_sub}</p>
        </div>
      </aside>

      <button type="button" className="lp-lang" onClick={toggleLang}>
        {t.switch}
      </button>

      {/* Panneau formulaire */}
      <main className="lp-form-side">
        <div className="lp-card">
          <h1 className="lp-title">{t.title}</h1>
          <p className="lp-subtitle">{t.subtitle}</p>

          {error && (
            <div className="lp-error" role="alert">
              <AlertIcon />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} noValidate>
            <div className="lp-field">
              <div className="lp-label-row">
                <label className="lp-label" htmlFor="lp-email">{t.email}</label>
              </div>
              <div className="lp-input-wrap">
                <span className="lead"><MailIcon /></span>
                <input
                  id="lp-email"
                  type="email"
                  className={`lp-input${error && !email.trim() ? ' invalid' : ''}`}
                  placeholder={t.email_ph}
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="lp-field">
              <div className="lp-label-row">
                <label className="lp-label" htmlFor="lp-password">{t.password}</label>
                <a className="lp-forgot" href="#forgot">{t.forgot}</a>
              </div>
              <div className="lp-input-wrap">
                <span className="lead"><LockIcon /></span>
                <input
                  id="lp-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`lp-input has-toggle${error && !password ? ' invalid' : ''}`}
                  placeholder={t.password_ph}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="lp-toggle"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? t.hide : t.show}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <button type="submit" className="lp-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="lp-spinner" aria-hidden="true" />
                  {t.logging_in}
                </>
              ) : (
                <>
                  {t.login}
                  <ArrowIcon />
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;