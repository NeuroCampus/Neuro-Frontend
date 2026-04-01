import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../common/Sidebar";
import Navbar from "../common/Navbar";
import AdminStats from "../admin/AdminStats";
import EnrollUser from "../admin/EnrollUser";
import BulkUpload from "../admin/BulkUpload";
import BranchesManagement from "../admin/BranchesManagement";
import BatchManagement from "../admin/BatchManagement";
import NotificationsManagement from "../admin/NotificationsManagement";
import HODLeavesManagement from "../admin/HODLeavesManagement";
import UsersManagement from "../admin/UsersManagement";
import AdminProfile from "../admin/AdminProfile";
import CampusLocationManager from "../admin/CampusLocationManager";
import TeacherBranchAssignment from "../admin/TeacherBranchAssignment";
import DashboardCard from "../common/DashboardCard";
import { useToast } from "../../hooks/use-toast";
import {
  Users,
  User,
  ClipboardList,
  Bell,
  GitBranch,
  UserCheck,
} from "lucide-react";
import { logoutUser } from "../../utils/authService";
import { useRef, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";


interface AdminDashboardProps {
  user: any;
  setPage: (page: string) => void;
}

const AdminDashboard = ({ user, setPage }: AdminDashboardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { toast } = useToast();
  const { theme } = useTheme();

  // Get active page from URL path
  const getActivePageFromPath = (pathname: string) => {
    const path = pathname.replace('/admin', '').replace('/', '');
    return path || 'dashboard';
  };

  const activePage = getActivePageFromPath(location.pathname);

  const handlePageChange = (page: string) => {
    const path = page === 'dashboard' ? '/admin' : `/admin/${page}`;
    navigate(path);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleNotificationClick = () => {
    navigate('/admin/notifications');
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      setError("Failed to log out. Please try again.");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to log out. Please try again.",
      });
    }
  };

  useEffect(() => {
  if (error) {
    const timer = setTimeout(() => {
      setError(null); // clear the error after 3s
    }, 3000);

    return () => clearTimeout(timer); // cleanup
  }
}, [error]);

  const renderContent = () => {
    switch (activePage) {
      case "dashboard":
        return (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <AdminStats setError={setError} setPage={handlePageChange} />
          </motion.div>
        );
      case "enroll-user":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <EnrollUser setError={setError} toast={toast} />
          </motion.div>
        );
      case "bulk-upload":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <BulkUpload setError={setError} toast={toast} />
          </motion.div>
        );
      case "branches":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <BranchesManagement setError={setError} toast={toast} />
          </motion.div>
        );
      case "teacher-assignments":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <TeacherBranchAssignment setError={setError} toast={toast} />
          </motion.div>
        );
      case "batches":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <BatchManagement setError={setError} toast={toast} />
          </motion.div>
        );
      case "notifications":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <NotificationsManagement setError={setError} toast={toast} />
          </motion.div>
        );
      case "hod-leaves":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <HODLeavesManagement setError={setError} toast={toast} />
          </motion.div>
        );
      case "users":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <UsersManagement setError={setError} toast={toast} />
          </motion.div>
        );
      case "profile":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <AdminProfile user={user} setError={setError} />
          </motion.div>
        );
      default:
        return <AdminStats setError={setError} />;
    }
  };

  return (
    <motion.div 
      className={`flex min-h-screen ${theme === 'dark' ? 'dark bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Sidebar (fixed left) */}
      <div className={`fixed top-0 left-0 h-full z-30 transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-72'}`}>
        <Sidebar 
          role="admin" 
          setPage={handlePageChange} 
          activePage={activePage} 
          logout={handleLogout}
          collapsed={sidebarCollapsed}
          toggleCollapse={toggleSidebar}
        />
      </div>
      <div className={`flex-1 flex flex-col ${sidebarCollapsed ? 'pl-16' : 'pl-72'}`}>
        {/* Navbar (fixed) */}
        <div className={`fixed top-0 ${sidebarCollapsed ? 'left-16' : 'left-72'} right-0 z-10 shadow-sm rounded-[20px]`}>
          <Navbar
            role="admin"
            user={user}
            onNotificationClick={handleNotificationClick}
            setPage={handlePageChange}
          />
        </div>
        <motion.main 
          className={`flex-1 mt-20 p-6 overflow-y-auto ${theme === 'dark' ? 'bg-background' : 'bg-gray-50'}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <motion.div 
            className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <motion.h1 
              className={`text-xl md:text-2xl font-bold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              {activePage === "dashboard"
                ? "Admin Dashboard"
                : activePage
                    .split("-")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
            </motion.h1>
          </motion.div>
          {error && (
            <motion.div 
              className={`p-3 rounded-lg mb-4 ${theme === 'dark' ? 'bg-destructive/10 border border-destructive/20 text-destructive-foreground' : 'bg-red-100 border border-red-200 text-red-700'}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.div>
          )}
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </motion.main>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;