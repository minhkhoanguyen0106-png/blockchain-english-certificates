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
import DataManagementPage from "./pages/DataManagementPage";
import { initStorage } from "./services/web3Service";

import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  const [wallet, setWallet] = useState(null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("certchain_user");
    return saved ? JSON.parse(saved) : null; // Mặc định chưa đăng nhập để đảm bảo an toàn
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
            {/* Public Routes - Ai cũng có thể truy cập */}
            <Route path="/" element={<HomePage />} />
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="/scanner" element={<ScannerPage />} />
            <Route path="/login" element={<LoginPage setUser={setUser} />} />

            {/* Admin & Staff Protected Routes - Yêu cầu xác thực & đúng vai trò */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute user={user} allowedRoles={["ADMIN", "STAFF"]}>
                  <DashboardPage wallet={wallet} setWallet={setWallet} user={user} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/certificates/issue"
              element={
                <ProtectedRoute user={user} allowedRoles={["ADMIN", "STAFF"]}>
                  <IssueCertPage wallet={wallet} setWallet={setWallet} user={user} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/certificates"
              element={
                <ProtectedRoute user={user} allowedRoles={["ADMIN", "STAFF"]}>
                  <CertificatesListPage wallet={wallet} user={user} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/data-management"
              element={
                <ProtectedRoute user={user} allowedRoles={["ADMIN", "STAFF"]}>
                  <DataManagementPage />
                </ProtectedRoute>
              }
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
