import React from "react";
import { NavLink } from "react-router-dom";
import PropTypes from "prop-types";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";

import {
  CBadge,
  CNavItem,
  CNavGroup,
  CNavLink,
  CSidebarNav,
} from "@coreui/react";

export const AppSidebarNav = ({ items }) => {
  const navLink = (name, icon, badge) => (
    <>
      {icon && <span className="nav-icon me-2">{icon}</span>}
      <span className="nav-text">{name}</span>
      {badge && (
        <CBadge color={badge.color} className="ms-auto" size="sm">
          {badge.text}
        </CBadge>
      )}
    </>
  );

  const navItem = (item, index) => {
    const { component: Component, name, badge, icon, ...rest } = item;
    return (
      <Component key={index} className="sidebar-item">
        {rest.to || rest.href ? (
          <CNavLink
            {...(rest.to && { as: NavLink })}
            {...(rest.href && { target: "_blank", rel: "noopener noreferrer" })}
            {...rest}
            className="nav-link"
          >
            {navLink(name, icon, badge)}
          </CNavLink>
        ) : (
          navLink(name, icon, badge)
        )}
      </Component>
    );
  };

  const navGroup = (item, index) => {
    const { component: Component, name, icon, items } = item;
    return (
      <Component
        key={index}
        toggler={navLink(name, icon)}
        className="sidebar-group"
      >
        {items.map((subItem, subIndex) =>
          subItem.items ? navGroup(subItem, subIndex) : navItem(subItem, subIndex)
        )}
      </Component>
    );
  };

  return (
    <CSidebarNav as={SimpleBar} className="sidebar-nav">
      {items.map((item, index) =>
        item.items ? navGroup(item, index) : navItem(item, index)
      )}
    </CSidebarNav>
  );
};

AppSidebarNav.propTypes = {
  items: PropTypes.arrayOf(PropTypes.any).isRequired,
};
