import React from "react";
import { Routes, Route } from "react-router-dom";
import { AppShell } from "./layout/AppShell/AppShell";
import { MeetingPage } from "./pages/MeetingPage/MeetingPage";

const Placeholder = ({ title }: { title: string }) => (
  <div style={{ padding: "1rem" }}>
    <h2>{title}</h2>
    <p>Coming soon…</p>
  </div>
);

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<MeetingPage />} />
        <Route path="/history" element={<Placeholder title="History" />} />
        <Route path="/settings" element={<Placeholder title="Settings" />} />
      </Route>
    </Routes>
  );
}
