import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "../common/DashboardLayout";
import AdminStats from "../admin/AdminStats";
import AdminHODAttendance from "../admin/HODAttendanceView";
import EnrollUser from "../admin/EnrollUser";
import BulkUpload from "../admin/BulkUpload";
import BranchesManagement from "../admin/BranchesManagement";
import BatchManagement from "../admin/BatchManagement";
import NotificationsManagement from "../admin/NotificationsManagement";
import HODLeavesManagement from "../admin/HODLeavesManagement";
import UsersManagement from "../admin/UsersManagement";
import AdminProfile from "../admin/AdminProfile";
import AdminQPApprovals from "../admin/AdminQPApprovals";
import TeacherBranchAssignment from "../admin/TeacherBranchAssignment";
import { useToast } from "../../hooks/use-toast";
import AdminAttendance from "../admin/AdminAttendance";
import ApplyLeaveAdmin from "../admin/ApplyLeaveAdmin";

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
            <AdminStats setError={setError} onNavigate={handlePageChange} />
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
      case "hod-attendance":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <AdminHODAttendance setError={setError} />
          </motion.div>
        );
      case "my-attendance":
        return(
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <AdminAttendance />
          </motion.div> 
        )
      case "apply-leave":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ApplyLeaveAdmin />
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
      case "qp-approvals":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <AdminQPApprovals />
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
    <DashboardLayout
      role="admin"
      user={user}
      activePage={activePage}
      onPageChange={handlePageChange}
      onNotificationClick={handleNotificationClick}
      pageTitle="Admin Dashboard"
    >
      <motion.div
        key={activePage}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        {renderContent()}
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminDashboard;