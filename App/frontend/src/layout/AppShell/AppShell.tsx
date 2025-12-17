import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../Sidebar/Sidebar";
import { Topbar } from "../Topbar/Topbar";
import "./AppShell.scss";

type Props = {
  children?: React.ReactNode;
};

export const AppShell: React.FC<Props> = ({ children }) => {
  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar">
        <Sidebar />
      </aside>

      <div className="app-shell__main">
        <header className="app-shell__topbar">
          <Topbar />
        </header>

        <main className="app-shell__content">
          <div className="app-shell__container">{children ?? <Outlet />}</div>
        </main>
      </div>
    </div>
  );
};
