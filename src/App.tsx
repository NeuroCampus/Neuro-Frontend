import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import ResultsView from "./pages/ResultsView";
import StudentDashboard from "./components/dashboards/StudentDashboard";
import AdminDashboard from "./components/dashboards/AdminDashboard";
import HODDashboard from "./components/dashboards/HODDashboard";
import FacultyDashboard from "./components/dashboards/FacultyDashboard";
import COEDashboard from "./components/dashboards/COEDashboard";
import FeesManagerDashboard from "./components/FeesManager/FeesManagerDashboard";
import DeanDashboard from "./components/dashboards/DeanDashboard";
import HMSDashboard from "./components/dashboards/HMSDashboard";
import Onboarding from "./pages/Onboarding";
import Pricing from "./pages/Pricing";
import FloatingAssistant from "./components/common/FloatingAssistant";
import AIInterview from "./components/common/AIInterview";
import { shouldShowFloatingAssistant } from "./utils/config";
import TrialExpired from "./pages/TrialExpired";
import OnboardingSuccess from "./pages/OnboardingSuccess";

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
  const [userData, setUserData] = useState(getUserData());

  useEffect(() => {
    // Check authentication status on mount and when localStorage changes
    const checkAuth = () => {
      const token = localStorage.getItem("access_token");
      const role = localStorage.getItem("role");
      const user = localStorage.getItem("user");
      
      const isAuth = !!(token && role && user);
      const currentUserData = getUserData();
      
      // Only update state if values actually changed
      setIsAuthenticated(prev => prev !== isAuth ? isAuth : prev);
      setUserRole(prev => prev !== role ? role : prev);
      setUserData(prev => {
        // Only update if the user data actually changed
        const prevStr = JSON.stringify(prev);
        const currentStr = JSON.stringify(currentUserData);
        return prevStr !== currentStr ? currentUserData : prev;
      });
    };

    checkAuth();

    // Listen for storage changes (login/logout from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "access_token" || e.key === "role" || e.key === "user") {
        checkAuth();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    
    // Check less frequently - every 5 seconds instead of 1 second
    const interval = setInterval(checkAuth, 5000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return (
    // ✅ NO QueryClientProvider here - it's in main.tsx
    // ✅ NO ThemeProvider here - it's in main.tsx
    // ✅ NO TooltipProvider here - it's in main.tsx
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={
          <>
            <Index />
          </>
        } />

        {/* Payment routes */}
        <Route path="/payment/success" element={
          <>
            <PaymentSuccess />
            {shouldShowFloatingAssistant() && <FloatingAssistant />}
          </>
        } />
        
        <Route path="/payment/cancel" element={
          <>
            <PaymentCancel />
            {shouldShowFloatingAssistant() && <FloatingAssistant />}
          </>
        } />

        {/* Onboarding routes */}
        <Route path="/neurocampus" element={<Pricing />} />
        <Route path="/neurocampus/:plan" element={<Onboarding />} />
        <Route path="/onboarding/success" element={<OnboardingSuccess />} />
        <Route path="/trial-expired" element={<TrialExpired />} />

        {/* Public results view (students) */}
        <Route path="/results/view/:token" element={
          <>
            <ResultsView />
            {shouldShowFloatingAssistant() && <FloatingAssistant />}
          </>
        } />

        {/* Revaluation & Makeup routes: accessible to both teachers and students. Render appropriate dashboard based on current role. */}
        <Route path="/revaluation" element={
          <ProtectedRoute allowedRoles={["teacher","student"]}>
            <>
              {(() => {
                const roleNow = localStorage.getItem('role');
                return roleNow === 'teacher' ? <FacultyDashboard user={userData} setPage={() => {}} /> : <StudentDashboard user={userData} setPage={() => {}} />;
              })()}
              {shouldShowFloatingAssistant() && <FloatingAssistant />}
            </>
          </ProtectedRoute>
        } />

        <Route path="/makeupexam" element={
          <ProtectedRoute allowedRoles={["teacher","student"]}>
            <>
              {(() => {
                const roleNow = localStorage.getItem('role');
                return roleNow === 'teacher' ? <FacultyDashboard user={userData} setPage={() => {}} /> : <StudentDashboard user={userData} setPage={() => {}} />;
              })()}
              {shouldShowFloatingAssistant() && <FloatingAssistant />}
            </>
          </ProtectedRoute>
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={["student"]}>
            <>
              <StudentDashboard user={userData} setPage={() => {}} />
              {shouldShowFloatingAssistant() && <FloatingAssistant />}
            </>
          </ProtectedRoute>
        } />

        <Route path="/timetable" element={
          <ProtectedRoute allowedRoles={["student"]}>
            <>
              <StudentDashboard user={userData} setPage={() => {}} />
              {shouldShowFloatingAssistant() && <FloatingAssistant />}
            </>
          </ProtectedRoute>
        } />

        <Route path="/attendance" element={
          <ProtectedRoute allowedRoles={["student"]}>
            <>
              <StudentDashboard user={userData} setPage={() => {}} />
              {shouldShowFloatingAssistant() && <FloatingAssistant />}
            </>
          </ProtectedRoute>
        } />

        <Route path="/marks" element={
          <ProtectedRoute allowedRoles={["student"]}>
            <>
              <StudentDashboard user={userData} setPage={() => {}} />
              {shouldShowFloatingAssistant() && <FloatingAssistant />}
            </>
          </ProtectedRoute>
        } />

        <Route path="/leave-request" element={
          <ProtectedRoute allowedRoles={["student"]}>
            <>
              <StudentDashboard user={userData} setPage={() => {}} />
              {shouldShowFloatingAssistant() && <FloatingAssistant />}
            </>
          </ProtectedRoute>
        } />

        <Route path="/leave" element={
          <ProtectedRoute allowedRoles={["student"]}>
            <>
              <StudentDashboard user={userData} setPage={() => {}} />
              {shouldShowFloatingAssistant() && <FloatingAssistant />}
            </>
          </ProtectedRoute>
        } />

        <Route path="/leave-status" element={
          <ProtectedRoute allowedRoles={["student"]}>
            <>
              <StudentDashboard user={userData} setPage={() => {}} />
              {shouldShowFloatingAssistant() && <FloatingAssistant />}
            </>
          </ProtectedRoute>
        } />

        <Route path="/fees" element={
          <ProtectedRoute allowedRoles={["student"]}>
            <>
              <StudentDashboard user={userData} setPage={() => {}} />
              {shouldShowFloatingAssistant() && <FloatingAssistant />}
            </>
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute allowedRoles={["student"]}>
            <>
              <StudentDashboard user={userData} setPage={() => {}} />
              {shouldShowFloatingAssistant() && <FloatingAssistant />}
            </>
          </ProtectedRoute>
        } />
                <Route path="/student-hostel-details" element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentDashboard user={userData} setPage={() => {}} />
            {shouldShowFloatingAssistant() && <FloatingAssistant />}
          </ProtectedRoute>
        } />

        <Route path="/announcements" element={
          <ProtectedRoute allowedRoles={["student"]}>
            <>
              <StudentDashboard user={userData} setPage={() => {}} />
              {shouldShowFloatingAssistant() && <FloatingAssistant />}
            </>
          </ProtectedRoute>
        } />

        <Route path="/chat" element={
          <ProtectedRoute allowedRoles={["student"]}>
            <>
              <StudentDashboard user={userData} setPage={() => {}} />
              {shouldShowFloatingAssistant() && <FloatingAssistant />}
            </>
          </ProtectedRoute>
        } />

        <Route path="/notifications" element={
          <ProtectedRoute allowedRoles={["student"]}>
            <>
              <StudentDashboard user={userData} setPage={() => {}} />
              {shouldShowFloatingAssistant() && <FloatingAssistant />}
            </>
          </ProtectedRoute>
        } />

        <Route path="/face-recognition" element={
          <ProtectedRoute allowedRoles={["student"]}>
            <>
              <StudentDashboard user={userData} setPage={() => {}} />
              {shouldShowFloatingAssistant() && <FloatingAssistant />}
            </>
          </ProtectedRoute>
        } />

        <Route path="/student-study-material" element={
          <ProtectedRoute allowedRoles={["student"]}>
            <>
              <StudentDashboard user={userData} setPage={() => {}} />
              {shouldShowFloatingAssistant() && <FloatingAssistant />}
            </>
          </ProtectedRoute>
        } />

        <Route path="/student-assignment" element={
          <ProtectedRoute allowedRoles={["student"]}>
            <>
              <StudentDashboard user={userData} setPage={() => {}} />
              {shouldShowFloatingAssistant() && <FloatingAssistant />}
            </>
          </ProtectedRoute>
        } />

        <Route path="/study-mode" element={
          <ProtectedRoute allowedRoles={["student"]}>
            <>
              <StudentDashboard user={userData} setPage={() => {}} />
              {shouldShowFloatingAssistant() && <FloatingAssistant />}
            </>
          </ProtectedRoute>
        } />

        <Route path="/ai-interview" element={
          <ProtectedRoute allowedRoles={["student"]}>
            <>
              <StudentDashboard user={userData} setPage={() => {}} />
              {shouldShowFloatingAssistant() && <FloatingAssistant />}
            </>
          </ProtectedRoute>
        } />

        {/* Admin routes */}
        <Route path="/admin/*" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <>
              <AdminDashboard user={userData} setPage={() => {}} />
              {shouldShowFloatingAssistant() && <FloatingAssistant />}
            </>
          </ProtectedRoute>
        } />

        {/* HOD routes */}
        <Route path="/hod/*" element={
          <ProtectedRoute allowedRoles={["hod"]}>
            <>
              <HODDashboard user={userData} setPage={() => {}} />
              {shouldShowFloatingAssistant() && <FloatingAssistant />}
            </>
          </ProtectedRoute>
        } />

        {/* Faculty routes */}
        <Route path="/faculty/*" element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <>
              <FacultyDashboard user={userData} setPage={() => {}} />
              {shouldShowFloatingAssistant() && <FloatingAssistant />}
            </>
          </ProtectedRoute>
        } />

        {/* Fees Manager routes */}
        <Route path="/fees-manager/*" element={
          <ProtectedRoute allowedRoles={["fees_manager"]}>
            <>
              <FeesManagerDashboard user={userData} setPage={() => {}} />
              {shouldShowFloatingAssistant() && <FloatingAssistant />}
            </>
          </ProtectedRoute>
        } />

        {/* HMS routes */}
        <Route path="/hms/*" element={
          <ProtectedRoute allowedRoles={["hms_admin"]}>
            <>
              <HMSDashboard user={userData} setPage={() => {}} />
              {shouldShowFloatingAssistant() && <FloatingAssistant />}
            </>
          </ProtectedRoute>
        } />

        {/* COE routes */}
        <Route path="/coe/*" element={
          <ProtectedRoute allowedRoles={["coe"]}>
            <>
              <COEDashboard user={userData} />
              {shouldShowFloatingAssistant() && <FloatingAssistant />}
            </>
          </ProtectedRoute>
        } />

        {/* Dean routes */}
        <Route path="/dean/*" element={
          <ProtectedRoute allowedRoles={["dean"]}>
            <>
              <DeanDashboard user={userData} setPage={() => {}} />
              {shouldShowFloatingAssistant() && <FloatingAssistant />}
            </>
          </ProtectedRoute>
        } />

        {/* 404 route */}
        <Route path="*" element={
          <>
            <NotFound />
            {shouldShowFloatingAssistant() && <FloatingAssistant />}
          </>
        } />
      </Routes>

      {/* ✅ Toast components rendered OUTSIDE routes but INSIDE BrowserRouter */}
      <Toaster />
      <Sonner />
    </BrowserRouter>
  );
};

export default App;