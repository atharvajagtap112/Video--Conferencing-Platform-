import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@/store";
import { logout } from "@/store/auth.store";
import { useEffect } from "react";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import Room from "@/pages/Room";
import MeetingHistoryPage from "@/pages/MeetingHistoryPage";
import MeetingSummary from "@/pages/MeetingSummary";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  // Listen for auth:logout event from axios interceptor
  useEffect(() => {
    const handleLogout = () => {
      dispatch(logout());
      navigate("/login", { replace: true });
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [dispatch, navigate]);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route
          path="/"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />
          }
        />
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
          }
        />
        <Route
          path="/signup"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup />
          }
        />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <Dashboard />
            </AuthGuard>
          }
        />
        <Route
          path="/room/:meetingId"
          element={
            <AuthGuard>
              <Room />
            </AuthGuard>
          }
        />
        <Route
          path="/meeting/history"
          element={
            <AuthGuard>
              <MeetingHistoryPage />
            </AuthGuard>
          }
        />
        <Route
          path="/meeting/:meetingId/summary"
          element={
            <AuthGuard>
              <MeetingSummary />
            </AuthGuard>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}