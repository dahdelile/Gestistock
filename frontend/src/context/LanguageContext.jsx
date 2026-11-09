import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export const LANG_KEY = 'gestistock_lang';
const SUPPORTED = ['fr', 'ar'];

const readLang = () => {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    return SUPPORTED.includes(saved) ? saved : 'fr';
  } catch {
    return 'fr';
  }
};

const LanguageContext = createContext({
  lang: 'fr', dir: 'ltr', isRTL: false, setLang: () => {}, toggleLang: () => {},
});

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(readLang);

  const setLang = useCallback((next) => {
    if (SUPPORTED.includes(next)) setLangState(next);
  }, []);
  const toggleLang = useCallback(() => {
    setLangState((c) => (c === 'fr' ? 'ar' : 'fr'));
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    try { localStorage.setItem(LANG_KEY, lang); } catch {}
  }, [lang]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === LANG_KEY && SUPPORTED.includes(e.newValue)) setLangState(e.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo(
    () => ({ lang, dir: lang === 'ar' ? 'rtl' : 'ltr', isRTL: lang === 'ar', setLang, toggleLang }),
    [lang, setLang, toggleLang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
export default LanguageContext;