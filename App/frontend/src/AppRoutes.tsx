// src/app/AppRoutes.tsx
import { Routes, Route } from "react-router-dom";
import { AppShell } from "./layout/AppShell/AppShell";
import { MeetingPage } from "./pages/MeetingPage";
import { HistoryPage } from "./pages/HistoryPage";
import { MeetingDetailsPage } from "./pages/MeetingDetailsPage/MeetingDetailsPage";
import { SettingsPage } from "./pages/SettingsPage/SettingsPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<MeetingPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/meetings/:id" element={<MeetingDetailsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
