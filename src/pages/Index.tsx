import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Login from "../components/auth/Login";
import OTPPage from "../components/auth/OTPPage";
import ForgotPasswordFlow from "../components/auth/ForgotPasswordFlow";
import ResetPassword from "../components/auth/ResetPassword";
import AdminDashboard from "../components/dashboards/AdminDashboard";
import HODDashboard from "../components/dashboards/HODDashboard";
import FacultyDashboard from "../components/dashboards/FacultyDashboard";
import StudentDashboard from "../components/dashboards/StudentDashboard";
import FeesManagerDashboard from "../pages/FeesManager/FeesManagerDashboard";
import PaymentSuccess from "./PaymentSuccess";
import PaymentCancel from "./PaymentCancel";
import NotFound from "./NotFound";
import { startTokenRefresh, stopTokenRefresh } from "../utils/authService";
import { ThemeProvider } from "../context/ThemeContext";

const Index = () => {
  const location = useLocation();
  const [role, setRole] = useState<string | null>(localStorage.getItem("role"));
  const [page, setPage] = useState<string>("login");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any>(null);

  // Check for payment routes first
  if (location.pathname === '/payment/success') {
    return (
      <ThemeProvider>
        <PaymentSuccess />
      </ThemeProvider>
    );
  }

  if (location.pathname === '/payment/cancel') {
    return (
      <ThemeProvider>
        <PaymentCancel />
      </ThemeProvider>
    );
  }

  // Check for 404 routes
  if (location.pathname !== '/') {
    return (
      <ThemeProvider>
        <NotFound />
      </ThemeProvider>
    );
  }

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      setIsLoading(true);
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setRole(parsedUser.role);
        setPage(parsedUser.role);
        startTokenRefresh(); // Start proactive token refresh
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.clear();
        stopTokenRefresh();
        setPage("login");
      } finally {
        setIsLoading(false);
      }
    } else {
      localStorage.clear();
      stopTokenRefresh();
      setIsLoading(false);
    }
  }, []);



  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-2xl font-semibold">Loading...</div>
      </div>
    );
  }

  // Authentication pages
  if (page === "login") return <Login setRole={setRole} setPage={setPage} setUser={setUser} />;
  if (page === "otp") return <OTPPage setRole={setRole} setPage={setPage} setUser={setUser} />;
  if (page === "forgot-password") return <ForgotPasswordFlow setPage={setPage} />;
  if (page === "reset-password") return <ResetPassword setPage={setPage} />;

  // Role-based dashboard pages
  if (role === "admin") return (
    <ThemeProvider>
      <AdminDashboard user={user} setPage={setPage} />
    </ThemeProvider>
  );
  if (role === "hod") return (
    <ThemeProvider>
      <HODDashboard user={user} setPage={setPage} />
    </ThemeProvider>
  );
  if (role === "fees_manager") return (
    <ThemeProvider>
      <FeesManagerDashboard user={user} setPage={setPage} />
    </ThemeProvider>
  );
  if (role === "teacher") return (
    <ThemeProvider>
      <FacultyDashboard user={user} setPage={setPage} />
    </ThemeProvider>
  );
  if (role === "student") return (
    <ThemeProvider>
      <StudentDashboard user={user} setPage={setPage} />
    </ThemeProvider>
  );

  // Default fallback
  return <Login setRole={setRole} setPage={setPage} setUser={setUser} />;
};

export default Index;