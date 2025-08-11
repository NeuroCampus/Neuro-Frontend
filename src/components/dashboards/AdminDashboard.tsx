import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Sidebar from "../common/Sidebar";
import Navbar from "../common/Navbar";
import AdminStats from "../admin/AdminStats";
import EnrollUser from "../admin/EnrollUser";
import BulkUpload from "../admin/BulkUpload";
import BranchesManagement from "../admin/BranchesManagement";
import NotificationsManagement from "../admin/NotificationsManagement";
import HODLeavesManagement from "../admin/HODLeavesManagement";
import UsersManagement from "../admin/UsersManagement";
import AdminProfile from "../admin/AdminProfile";
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

interface AdminDashboardProps {
  user: any;
  setPage: (page: string) => void;
}

const AdminDashboard = ({ user, setPage }: AdminDashboardProps) => {
  const [activePage, setActivePage] = useState("dashboard");
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handlePageChange = (page: string) => {
    setActivePage(page);
    setError(null);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleNotificationClick = () => {
    setActivePage("notifications");
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setPage("login");
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
            <AdminStats setError={setError} />
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <DashboardCard
                title="Enroll User"
                description="Add new HOD or faculty"
                icon={<User size={20} />}
                onClick={() => handlePageChange("enroll-user")}
              />
              <DashboardCard
                title="Bulk Upload Faculty"
                description="Upload faculty list"
                icon={<ClipboardList size={20} />}
                onClick={() => handlePageChange("bulk-upload")}
              />
              <DashboardCard
                title="Manage Branches"
                description="View or edit branches"
                icon={<GitBranch size={20} />}
                onClick={() => handlePageChange("branches")}
              />
              <DashboardCard
                title="Notifications"
                description="Send or view notifications"
                icon={<Bell size={20} />}
                onClick={() => handlePageChange("notifications")}
              />
              <DashboardCard
                title="HOD Leaves"
                description="Manage HOD leave requests"
                icon={<UserCheck size={20} />}
                onClick={() => handlePageChange("hod-leaves")}
              />
              <DashboardCard
                title="Users Management"
                description="Manage all system users"
                icon={<Users size={20} />}
                onClick={() => handlePageChange("users")}
              />
            </motion.div>
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
      className="flex min-h-screen bg-[#1c1c1e]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className={`fixed top-0 left-0 h-full z-10 transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <Sidebar 
          role="admin" 
          setPage={handlePageChange} 
          activePage={activePage} 
          logout={handleLogout}
          collapsed={sidebarCollapsed}
          toggleCollapse={toggleSidebar}
        />
      </div>
      <div className={`flex-1 flex flex-col min-h-screen overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <div className="sticky top-0 z-20 bg-[#1c1c1e] border-b border-gray-700">
          <Navbar
            role="admin"
            user={user}
            onNotificationClick={handleNotificationClick}
          />
        </div>
        <motion.main 
          className="flex-1 p-6 overflow-y-auto bg-gradient-to-br from-[#1c1c1e] via-[#1e1e1e] to-[#1a1a1a]"
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
              className="text-xl md:text-2xl font-bold text-white"
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
              className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-4"
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