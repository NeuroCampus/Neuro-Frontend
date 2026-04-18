import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useIsMobile } from "../../hooks/use-mobile";
import { useTheme } from "../../context/ThemeContext";
import { stopTokenRefresh, logoutUser } from "../../utils/authService";

interface User {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  profile_picture?: string | null;
  branch?: string;
}

interface DashboardLayoutProps {
  role: "admin" | "hod" | "faculty" | "student" | "fees_manager" | "coe" | "dean" | "hms";
  user: User;
  activePage: string;
  onPageChange: (page: string) => void;
  onNotificationClick?: () => void;
  children: React.ReactNode;
  pageTitle?: string;
  headerActions?: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  role,
  user,
  activePage,
  onPageChange,
  onNotificationClick,
  children,
  pageTitle,
  headerActions,
}) => {
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024); // Start expanded on desktop, collapsed on mobile
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Lock sidebar open on desktop, collapsible only on mobile/tablet
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarCollapsed(false); // Force expand on desktop - no collapsing allowed
      } else {
        setSidebarCollapsed(true); // Allow collapse on mobile/tablet
      }
    };

    // Set initial state
    handleResize();

    // Listen for resize events
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar when page changes on mobile/tablet only
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarCollapsed(true);
    }
  }, [activePage]);

  const toggleSidebar = () => {
    // Only allow toggling on mobile/tablet (< 1024px)
    if (window.innerWidth < 1024) {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const handlePageChange = (page: string) => {
    onPageChange(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Logout backend error:", err);
    } finally {
      localStorage.clear();
      stopTokenRefresh();
      // Use client-side navigation to avoid reloading from backend server
      try {
        navigate("/", { replace: true });
      } catch (e) {
        // Fallback to full reload if router not available
        window.location.href = "/";
      }
    }
  };

  // Format page title
  const formatTitle = (title: string) => {
    if (title === "dashboard") return `${role.charAt(0).toUpperCase() + role.slice(1)} Dashboard`;
    return title
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <motion.div
      className={`flex min-h-screen ${
        theme === "dark"
          ? "dark bg-background text-foreground"
          : "bg-gray-50 text-gray-900"
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Sidebar */}
      <Sidebar
        role={role}
        setPage={handlePageChange}
        activePage={activePage}
        logout={handleLogout}
        collapsed={sidebarCollapsed}
        toggleCollapse={toggleSidebar}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 min-w-0 flex flex-col transition-all duration-300 overflow-x-hidden ${
          sidebarCollapsed ? 'ml-0' : 'ml-64'
        }`}
      >
        {/* Navbar */}
        <div
          className={`fixed top-0 z-10 shadow-sm transition-all duration-300 ${
            sidebarCollapsed ? 'left-0' : 'left-64'
          } right-0`}
        >
          <Navbar
            role={role}
            user={user}
            onNotificationClick={onNotificationClick}
            setPage={handlePageChange}
            showHamburger={sidebarCollapsed && window.innerWidth < 1024}
            onHamburgerClick={toggleSidebar}
          />
        </div>

        {/* Page Content */}
        <motion.main
          className={`flex-1 min-w-0 mt-16 p-4 md:p-6 overflow-y-auto overflow-x-hidden ${
            theme === "dark" ? "bg-background" : "bg-gray-50"
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {/* Page Header */}
          <motion.div
            className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <motion.h1
              className={`text-xl md:text-2xl font-bold ${
                theme === "dark" ? "text-foreground" : "text-gray-900"
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              {pageTitle || formatTitle(activePage)}
            </motion.h1>
            {headerActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                {headerActions}
              </motion.div>
            )}
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              className={`p-3 rounded-lg mb-4 ${
                theme === "dark"
                  ? "bg-destructive/10 border border-destructive/20 text-destructive-foreground"
                  : "bg-red-100 border border-red-200 text-red-700"
              }`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              onAnimationComplete={() => setTimeout(() => setError(null), 3000)}
            >
              {error}
            </motion.div>
          )}

          {/* Children Content */}
          <AnimatePresence mode="wait">{children}</AnimatePresence>
        </motion.main>
      </div>
    </motion.div>
  );
};

export default DashboardLayout;
