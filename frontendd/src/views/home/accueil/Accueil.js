import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Badge } from "react-bootstrap";
import { FaSearch, FaThLarge, FaList, FaBolt } from "react-icons/fa";
import PropTypes from "prop-types";
import styled, { keyframes } from "styled-components";
import { useLanguage } from "../../../context/LanguageContext";

/* ================= ANIMATIONS ================= */
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
`;

/* ================= STYLED COMPONENTS ================= */

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #e3edf9 0%, #f0f4fb 100%);
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  background: linear-gradient(135deg, #0d47a1 0%, #1976d2 100%);
  color: white;
  padding: 3rem 0 4rem 0;
  position: relative;
  overflow: hidden;
  margin-bottom: 2rem;

  &::after {
    content: "";
    position: absolute;
    bottom: -40px;
    left: 0;
    width: 100%;
    height: 80px;
    background: white;
    border-radius: 50% 50% 0 0;
  }
`;

const WelcomeTitle = styled.h1`
  font-weight: 700;
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  animation: ${fadeIn} 0.8s ease;
`;

const WelcomeSubtitle = styled.p`
  opacity: 0.9;
  margin-top: 0.5rem;
  animation: ${fadeIn} 1s ease;
`;

const SearchBar = styled.div`
  background: white;
  border-radius: 50px;
  padding: 0.4rem 1rem;
  display: flex;
  align-items: center;
  max-width: 400px;
  margin: 1.5rem auto 0;
  box-shadow: 0 6px 18px rgba(0,0,0,0.08);

  input {
    border: none;
    outline: none;
    flex: 1;
    padding: 0.4rem;
    color: #0d47a1;
  }

  svg {
    color: #1976d2;
  }
`;

const QuickAccessBar = styled.div`
  background: white;
  border-radius: 15px;
  padding: 1rem 1.2rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 6px 20px rgba(0,0,0,0.05);
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  align-items: center;
`;

const QuickButton = styled.button`
  background: #e3f2fd;
  border: none;
  color: #0d47a1;
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  transition: 0.3s;

  &:hover {
    background: #1976d2;
    color: white;
  }
`;

const NoteCardStyled = styled.div`
  width: 100%;
  margin-bottom: 1.5rem;

  button {
    width: 100%;
    height: 120px;
    background: linear-gradient(135deg, #6ea8d3 0%, #5b9bc8 100%);
    border: 3px solid #0d47a1;
    border-radius: 20px;
    box-shadow: 0 8px 18px rgba(13, 71, 161, 0.25);
    transition: all 0.3s ease-in-out;
    cursor: pointer;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 25px rgba(13, 71, 161, 0.35);
    }

    img {
      width: 55px;
      height: 55px;
      object-fit: contain;
    }

    span {
      color: white;
      font-weight: 600;
      font-size: 1rem;
      text-align: center;
    }
  }
`;

/* ================= NOTE CARD ================= */

const NoteCard = ({ imageSrc, text, link, viewMode }) => {
  const navigate = useNavigate();

  return (
    <Col
      xs={12}
      sm={viewMode === "grid" ? 6 : 12}
      md={viewMode === "grid" ? 4 : 12}
      lg={viewMode === "grid" ? 3 : 12}
    >
      <NoteCardStyled>
        <button onClick={() => navigate(link)}>
          {imageSrc && <img src={imageSrc} alt="" />}
          <span>{text}</span>
        </button>
      </NoteCardStyled>
    </Col>
  );
};

NoteCard.propTypes = {
  imageSrc: PropTypes.string,
  text: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired,
  viewMode: PropTypes.string.isRequired,
};

/* ================= ACCUEIL ================= */

const Accueil = ({ userName }) => {
  const navigate = useNavigate();
  const langContext = useLanguage() || {};
  const t = typeof langContext.t === 'function' ? langContext.t : (key) => key;
  const lang = langContext.lang || 'fr';
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");

  const documents = useMemo(() => [
    { text: t('ventes'), img: "https://cdn-icons-png.flaticon.com/128/5442/5442020.png", path: "/ventes" },
    { text: t('achat'), img: "https://cdn-icons-png.flaticon.com/128/2821/2821739.png", path: "/achat" },
    { text: t('produit'), img: "https://cdn-icons-png.flaticon.com/128/4408/4408296.png", path: "/products" },
    { text: t('expense'), img: "https://cdn-icons-png.flaticon.com/128/2041/2041643.png", path: "/expenses" },
    { text: t('categories'), img: "https://cdn-icons-png.flaticon.com/128/2041/2041643.png", path: "/categories" },
    { text: t('rapports'), img: "https://cdn-icons-png.flaticon.com/128/18220/18220264.png", path: "/rapportss" },
    { text: t('customers'), img: "https://cdn-icons-png.flaticon.com/128/18220/18220264.png", path: "/Customers" },
     { text: t('caises'), img: "https://cdn-icons-png.flaticon.com/128/18220/18220264.png", path: "/caise" },
  ], [t, lang]);

  const quickLinks = useMemo(() => [
  { label: t('caisse'), path: "/caisse" },
  { label: t('vente'), path: "/ventes" },
  { label: t('achat'), path: "/achat" },
  { label: t('produit'), path: "/products" },
  { label: t('fournisseur'), path: "/suppliers" },
  { label: t('client'), path: "/customers" },
  { label: t('categorie'), path: "/categories" },
  { label: t('expense'), path: "/expenses" },
  { label: t('stock'), path: "/stock" },
  { label: t('utilisateur'), path: "/users" },
  { label: t('rapports'), path: "/rapportss" },
], [t, lang]);

  const filteredDocs = useMemo(() => {
    return documents.filter(doc =>
      doc.text.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, documents]);

  return (
    <PageContainer>

      <Header>
        <Container className="text-center">
          <WelcomeTitle>
            {t('welcome')}{userName ? `, ${userName}` : ""}
          </WelcomeTitle>

          <WelcomeSubtitle>
            {t('subtitle')}
          </WelcomeSubtitle>

          <SearchBar>
            <FaSearch />
            <input
              type="text"
              placeholder={t('searchModule')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchBar>
        </Container>
      </Header>

      <Container className="flex-grow-1">

        <QuickAccessBar>
          <FaBolt />
          {quickLinks.map((item) => (
            <QuickButton
              key={`quick-${item.path}-${item.label}`}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </QuickButton>
          ))}

          <div className="ms-auto d-flex gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`btn btn-sm ${viewMode === "grid" ? "btn-primary" : "btn-light"}`}
            >
              <FaThLarge />
            </button>

            <button
              onClick={() => setViewMode("list")}
              className={`btn btn-sm ${viewMode === "list" ? "btn-primary" : "btn-light"}`}
            >
              <FaList />
            </button>
          </div>
        </QuickAccessBar>

        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-semibold text-primary">{t('applications')}</h5>
          <Badge bg="primary">{filteredDocs.length}</Badge>
        </div>

        {filteredDocs.length > 0 ? (
          <Row>
            {filteredDocs.map((doc) => (
              <NoteCard
                key={`doc-${doc.path}-${doc.text}`}
                imageSrc={doc.img}
                text={doc.text}
                link={doc.path}
                viewMode={viewMode}
              />
            ))}
          </Row>
        ) : (
          <div className="text-center py-5">
            <h5 className="text-muted">{t('noModule')}</h5>
          </div>
        )}

      </Container>

      <footer className="bg-dark text-white py-3 text-center mt-4">
        © {new Date().getFullYear()} Tous droits réservés
      </footer>

    </PageContainer>
  );
};

Accueil.propTypes = {
  userName: PropTypes.string,
};

export default Accueil;