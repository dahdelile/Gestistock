import React from 'react';
import { CBreadcrumb, CBreadcrumbItem } from '@coreui/react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

// ===== STYLES PERSONNALISÉS =====
const BreadcrumbContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.25rem 0;
  
  .breadcrumb {
    background: transparent;
    padding: 0;
    margin: 0;
  }
  
  .breadcrumb-item {
    font-size: 0.85rem;
    
    a {
      color: rgba(255, 255, 255, 0.8);
      text-decoration: none;
      transition: color 0.3s ease;
      
      &:hover {
        color: #ffd700;
      }
    }
    
    &.active {
      color: #ffd700;
      font-weight: 500;
    }
  }
  
  .date-badge {
    background: rgba(255, 255, 255, 0.15);
    color: white;
    padding: 0.3rem 1rem;
    border-radius: 50px;
    font-size: 0.8rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(5px);
    
    svg {
      color: #ffd700;
    }
    
    &:hover {
      background: rgba(255, 255, 255, 0.25);
      transform: translateY(-1px);
      transition: all 0.3s ease;
    }
  }
`;

// Icône calendrier SVG simple
const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
  </svg>
);

const AppBreadcrumb = () => {
  const location = useLocation();
  
  // Récupérer la date actuelle formatée
  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Formater la date en majuscule pour le premier jour
  const formattedDate = today.charAt(0).toUpperCase() + today.slice(1);

  // Générer les items du breadcrumb basés sur l'URL
  const pathnames = location.pathname.split('/').filter(x => x);
  
  const getBreadcrumbItems = () => {
    const items = [];
    
    // Ajouter Accueil
    items.push(
      <CBreadcrumbItem key="home">
        <a href="/home/accueil">Accueil</a>
      </CBreadcrumbItem>
    );
    
    // Construire les autres items
    pathnames.forEach((name, index) => {
      const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
      const isLast = index === pathnames.length - 1;
      
      // Transformer le nom en format lisible
      const displayName = name
        .replace(/-/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      items.push(
        <CBreadcrumbItem key={name} active={isLast}>
          {isLast ? displayName : <a href={routeTo}>{displayName}</a>}
        </CBreadcrumbItem>
      );
    });
    
    return items;
  };

  return (
    <BreadcrumbContainer>
      <CBreadcrumb className="mb-0">
        {getBreadcrumbItems()}
      </CBreadcrumb>
      
      <div className="date-badge">
        <CalendarIcon />
        {formattedDate}
      </div>
    </BreadcrumbContainer>
  );
};

export default React.memo(AppBreadcrumb);