import React from "react";
import "./Topbar.scss";

export const Topbar: React.FC = () => {
  return (
    <div className="topbar">
      <div className="topbar__left">
        <h1 className="topbar__title">Addes Meeting Buddy</h1>
      </div>

      <div className="topbar__right">
        <button className="topbar__cta" type="button">
          + New meeting
        </button>
      </div>
    </div>
  );
};
