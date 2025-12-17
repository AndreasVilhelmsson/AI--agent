import React from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.scss";

export const Sidebar: React.FC = () => {
  return (
    <div className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__logo">AI</div>
        <div className="sidebar__title">AI Meeting Assistant</div>
      </div>

      <nav className="sidebar__nav" aria-label="Navigation">
        <div className="sidebar__nav-title">NAVIGATION</div>

        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
          }
        >
          Meeting
        </NavLink>

        <NavLink
          to="/history"
          className={({ isActive }) =>
            `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
          }
        >
          History
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
          }
        >
          Settings
        </NavLink>
      </nav>
    </div>
  );
};
