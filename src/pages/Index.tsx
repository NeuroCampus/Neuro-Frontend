import { useState, useEffect } from "react";
import Login from "../components/auth/Login";
import OTPPage from "../components/auth/OTPPage";
import ForgotPassword from "../components/auth/ForgotPassword";
import ResetPassword from "../components/auth/ResetPassword";
import AdminDashboard from "../components/dashboards/AdminDashboard";
import HODDashboard from "../components/dashboards/HODDashboard";
import FacultyDashboard from "../components/dashboards/FacultyDashboard";
import StudentDashboard from "../components/dashboards/StudentDashboard";
import { startTokenRefresh, stopTokenRefresh } from "../utils/authService";

const Index = () => {
  const [role, setRole] = useState<string | null>(localStorage.getItem("role"));
  const [page, setPage] = useState<string>("login");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any>(null);

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
  if (page === "forgot-password") return <ForgotPassword setPage={setPage} />;
  if (page === "reset-password") return <ResetPassword setPage={setPage} />;

  // Role-based dashboard pages
  if (role === "admin") return <AdminDashboard user={user} setPage={setPage} />;
  if (role === "hod") return <HODDashboard user={user} setPage={setPage} />;
  if (role === "teacher") return <FacultyDashboard user={user} setPage={setPage} />;
  if (role === "student") return <StudentDashboard user={user} setPage={setPage} />;

  // Default fallback
  return <Login setRole={setRole} setPage={setPage} setUser={setUser} />;
};

export default Index;