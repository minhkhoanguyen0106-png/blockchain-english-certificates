import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import VerifyPage from "./pages/VerifyPage";
import ScannerPage from "./pages/ScannerPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import IssueCertPage from "./pages/IssueCertPage";
import CertificatesListPage from "./pages/CertificatesListPage";
import { initStorage } from "./services/web3Service";

export default function App() {
  const [wallet, setWallet] = useState(null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("certchain_user");
    return saved ? JSON.parse(saved) : { username: "admin", full_name: "Nguyễn Văn Giám Đốc", role: "ADMIN" };
  });

  useEffect(() => {
    initStorage();
  }, []);

  return (
    <BrowserRouter>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        
        {/* Global Navigation Bar */}
        <Navbar wallet={wallet} setWallet={setWallet} user={user} setUser={setUser} />

        {/* Main Content Area */}
        <main style={{ flex: 1 }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="/scanner" element={<ScannerPage />} />
            <Route path="/login" element={<LoginPage setUser={setUser} />} />

            {/* Admin Protected Routes */}
            <Route
              path="/admin/dashboard"
              element={<DashboardPage wallet={wallet} setWallet={setWallet} user={user} />}
            />
            <Route
              path="/admin/certificates/issue"
              element={<IssueCertPage wallet={wallet} setWallet={setWallet} user={user} />}
            />
            <Route
              path="/admin/certificates"
              element={<CertificatesListPage wallet={wallet} user={user} />}
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Global Footer */}
        <Footer />

      </div>
    </BrowserRouter>
  );
}
