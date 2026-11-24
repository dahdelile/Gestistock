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
const translations = {
  fr: {
    accueil: 'Accueil',
    produits: 'Produits',
    produit: 'Produit',
    categories: 'Catégories',
    marques: 'Marques',
    unites: 'Unités',
    stock: 'Stock',
    stockEntrant: 'Stock entrant',
    achats: 'Achats',
    achat: 'Achat',
    receptions: 'Réceptions',
    retoursFournisseurs: 'Retours fournisseurs',
    stockSortant: 'Stock sortant',
    ventes: 'Ventes',
    vente: 'Vente',
    sortiesInternes: 'Sorties internes',
    retoursClients: 'Retours clients',
    partenaires: 'Partenaires',
    fournisseurs: 'Fournisseurs',
    clients: 'Clients',
    customers: 'Clients',
    personnel: 'Personnel',
    depenses: 'Dépenses',
    expense: 'Dépense',
    caisse: 'Caisse',
    Dépôts: 'Dépôts',
    rapports: 'Rapports',
    rapport: 'Les rapports',
    stockActuel: 'Stock actuel',
    historique: 'Historique',
    inventaire: 'Inventaire',
    benefices: 'Bénéfices',
    mouvements: 'Mouvements',
    journaliers: 'Journaliers',
    parametres: 'Paramètres',
    utilisateurs: 'Utilisateurs',
    gestionUsers: 'Gestion Users',
    deconnexion: 'Déconnexion',
    search: 'Rechercher...',
    searchModule: 'Rechercher un module...',
    profil: 'Mon profil',
    messages: 'Messages',
    settings: 'Paramètres',
    logout: 'Déconnexion',
    welcome: 'Bienvenue sur la gestion de stock',
    subtitle: 'Votre portail unique pour accéder à toutes les ressources',
    applications: 'Les applications',
    noModule: 'Aucun module trouvé',
  },
  ar: {
    accueil: 'الرئيسية',
    produits: 'المنتجات',
    produit: 'المنتج',
    categories: 'الفئات',
    marques: 'العلامات',
    unites: 'الوحدات',
    stock: 'المخزون',
    stockEntrant: 'المخزون الوارد',
    achats: 'المشتريات',
    achat: 'الشراء',
    receptions: 'الاستلام',
    retoursFournisseurs: 'مرتجعات الموردين',
    stockSortant: 'المخزون الصادر',
    ventes: 'المبيعات',
    vente: 'بيع',
    sortiesInternes: 'الخروج الداخلي',
    retoursClients: 'مرتجعات الزبائن',
    partenaires: 'الشركاء',
    fournisseurs: 'الموردون',
    clients: 'الزبائن',
    customers: 'الزبائن',
    personnel: 'الموظفون',
    depenses: 'المصاريف',
    expense: 'المصاريف',
    caisse: 'الصندوق',
    deposits: 'الوديعة',
    Dépôts: 'الوديعة',
    rapports: 'التقارير',
    rapport: 'التقارير',
    stockActuel: 'المخزون الحالي',
    historique: 'السجل',
    inventaire: 'الجرد',
    benefices: 'الأرباح',
    mouvements: 'الحركات',
    journaliers: 'اليومية',
    parametres: 'الإعدادات',
    utilisateurs: 'المستخدمون',
    gestionUsers: 'إدارة المستخدمين',
    deconnexion: 'تسجيل الخروج',
    search: 'بحث...',
    searchModule: 'البحث عن وحدة...',
    profil: 'ملفي',
    messages: 'الرسائل',
    settings: 'الإعدادات',
    logout: 'تسجيل الخروج',
    welcome: 'مرحباً بك في إدارة المخزون',
    subtitle: 'بوابتك الوحيدة للوصول إلى جميع الموارد',
    applications: 'التطبيقات',
    noModule: 'لم يتم العثور على أي وحدة',
  },
};

const LanguageContext = createContext({
  lang: 'fr', dir: 'ltr', isRTL: false, setLang: () => {}, toggleLang: () => {}, t: (key) => key,
});

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(readLang);

  const setLang = useCallback((next) => {
    if (SUPPORTED.includes(next)) setLangState(next);
  }, []);
  const toggleLang = useCallback(() => {
    setLangState((c) => (c === 'fr' ? 'ar' : 'fr'));
  }, []);

  // 👇 AJOUT : la fonction t qui manquait
  const t = useCallback((key) => {
    return translations[lang]?.[key] || key;
  }, [lang]);

  useEffect(() => {
    document.documentElement.lang = lang;
    // 👇 CORRECTION SIDEBAR : on laisse toujours LTR pour que la sidebar reste à gauche
    // même en arabe. Le texte arabe reste en arabe, juste la mise en page ne bouge pas.
    document.documentElement.dir = 'ltr';
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
    () => ({
      lang,
      dir: 'ltr', // 👇 toujours ltr pour garder la sidebar à gauche
      isRTL: lang === 'ar',
      setLang,
      toggleLang,
      t, // 👇 maintenant t existe
    }),
    [lang, setLang, toggleLang, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
export default LanguageContext;