import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import StudentDashboard from "./components/dashboards/StudentDashboard";
import AdminDashboard from "./components/dashboards/AdminDashboard";
import HODDashboard from "./components/dashboards/HODDashboard";
import FacultyDashboard from "./components/dashboards/FacultyDashboard";
import FeesManagerDashboard from "./pages/FeesManager/FeesManagerDashboard";
import { ThemeProvider } from "./context/ThemeContext";
// Import the FloatingAssistant component
import FloatingAssistant from "./components/common/FloatingAssistant";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
  const token = localStorage.getItem("access_token");
  const role = localStorage.getItem("role");
  const user = localStorage.getItem("user");

  if (!token || !role || !user || !allowedRoles.includes(role)) {
    return <Index />;
  }

  return <>{children}</>;
};

// Helper function to safely parse user data
const getUserData = () => {
  try {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : {};
  } catch (error) {
    console.error("Error parsing user data:", error);
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    return {};
  }
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication status on mount and when localStorage changes
    const checkAuth = () => {
      const token = localStorage.getItem("access_token");
      const role = localStorage.getItem("role");
      const user = localStorage.getItem("user");
      
      setIsAuthenticated(!!(token && role && user));
      setUserRole(role);
    };

    checkAuth();

    // Listen for storage changes (login/logout from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "access_token" || e.key === "role" || e.key === "user") {
        checkAuth();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    
    // Also check periodically for same-tab changes
    const interval = setInterval(checkAuth, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={
            <>
              <Toaster />
              <Sonner />
              <Index />
            </>
          } />

          {/* Payment routes */}
          <Route path="/payment/success" element={
            <ThemeProvider>
              <PaymentSuccess />
              <FloatingAssistant />
            </ThemeProvider>
          } />
          <Route path="/payment/cancel" element={
            <ThemeProvider>
              <PaymentCancel />
              <FloatingAssistant />
            </ThemeProvider>
          } />

          {/* Student routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <ThemeProvider>
                <StudentDashboard user={getUserData()} setPage={() => {}} />
                <FloatingAssistant />
              </ThemeProvider>
            </ProtectedRoute>
          } />
          <Route path="/timetable" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <ThemeProvider>
                <StudentDashboard user={getUserData()} setPage={() => {}} />
                <FloatingAssistant />
              </ThemeProvider>
            </ProtectedRoute>
          } />
          <Route path="/attendance" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <ThemeProvider>
                <StudentDashboard user={getUserData()} setPage={() => {}} />
                <FloatingAssistant />
              </ThemeProvider>
            </ProtectedRoute>
          } />
          <Route path="/marks" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <ThemeProvider>
                <StudentDashboard user={JSON.parse(localStorage.getItem("user") || "{}")} setPage={() => {}} />
                <FloatingAssistant />
              </ThemeProvider>
            </ProtectedRoute>
          } />
          <Route path="/leave-request" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <ThemeProvider>
                <StudentDashboard user={JSON.parse(localStorage.getItem("user") || "{}")} setPage={() => {}} />
                <FloatingAssistant />
              </ThemeProvider>
            </ProtectedRoute>
          } />
          <Route path="/leave-status" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <ThemeProvider>
                <StudentDashboard user={JSON.parse(localStorage.getItem("user") || "{}")} setPage={() => {}} />
                <FloatingAssistant />
              </ThemeProvider>
            </ProtectedRoute>
          } />
          <Route path="/fees" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <ThemeProvider>
                <StudentDashboard user={getUserData()} setPage={() => {}} />
                <FloatingAssistant />
              </ThemeProvider>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <ThemeProvider>
                <StudentDashboard user={JSON.parse(localStorage.getItem("user") || "{}")} setPage={() => {}} />
                <FloatingAssistant />
              </ThemeProvider>
            </ProtectedRoute>
          } />
          <Route path="/announcements" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <ThemeProvider>
                <StudentDashboard user={getUserData()} setPage={() => {}} />
                <FloatingAssistant />
              </ThemeProvider>
            </ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <ThemeProvider>
                <StudentDashboard user={getUserData()} setPage={() => {}} />
                <FloatingAssistant />
              </ThemeProvider>
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <ThemeProvider>
                <StudentDashboard user={getUserData()} setPage={() => {}} />
                <FloatingAssistant />
              </ThemeProvider>
            </ProtectedRoute>
          } />
          <Route path="/face-recognition" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <ThemeProvider>
                <StudentDashboard user={getUserData()} setPage={() => {}} />
                <FloatingAssistant />
              </ThemeProvider>
            </ProtectedRoute>
          } />
          <Route path="/student-study-material" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <ThemeProvider>
                <StudentDashboard user={getUserData()} setPage={() => {}} />
                <FloatingAssistant />
              </ThemeProvider>
            </ProtectedRoute>
          } />
          <Route path="/student-assignment" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <ThemeProvider>
                <StudentDashboard user={getUserData()} setPage={() => {}} />
                <FloatingAssistant />
              </ThemeProvider>
            </ProtectedRoute>
          } />

          {/* Admin routes */}
          <Route path="/admin/*" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ThemeProvider>
                <AdminDashboard user={getUserData()} setPage={() => {}} />
                <FloatingAssistant />
              </ThemeProvider>
            </ProtectedRoute>
          } />

          {/* HOD routes */}
          <Route path="/hod/*" element={
            <ProtectedRoute allowedRoles={["hod"]}>
              <ThemeProvider>
                <HODDashboard user={getUserData()} setPage={() => {}} />
                <FloatingAssistant />
              </ThemeProvider>
            </ProtectedRoute>
          } />

          {/* Faculty routes */}
          <Route path="/faculty/*" element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <ThemeProvider>
                <FacultyDashboard user={getUserData()} setPage={() => {}} />
                <FloatingAssistant />
              </ThemeProvider>
            </ProtectedRoute>
          } />

          {/* Fees Manager routes */}
          <Route path="/fees-manager/*" element={
            <ProtectedRoute allowedRoles={["fees_manager"]}>
              <ThemeProvider>
                <FeesManagerDashboard user={getUserData()} setPage={() => {}} />
                <FloatingAssistant />
              </ThemeProvider>
            </ProtectedRoute>
          } />

          {/* 404 route */}
          <Route path="*" element={
            <ThemeProvider>
              <NotFound />
              <FloatingAssistant />
            </ThemeProvider>
          } />
        </Routes>
        <Toaster />
        <Sonner />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);
};

export default App;