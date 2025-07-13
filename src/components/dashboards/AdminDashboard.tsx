import { useState } from "react";
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
} from "lucide-react";
import { logoutUser } from "../../utils/authService";

interface AdminDashboardProps {
  user: any;
  setPage: (page: string) => void;
}

const AdminDashboard = ({ user, setPage }: AdminDashboardProps) => {
  const [activePage, setActivePage] = useState("dashboard");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handlePageChange = (page: string) => {
    setActivePage(page);
    setError(null);
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
          <div className="space-y-6">
            <AdminStats setError={setError} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <DashboardCard
                title="Enroll User"
                description="Add new HOD or faculty"
                icon={<User size={20} />}
                onClick={() => handlePageChange("enroll-user")}
                className="hover:bg-blue-50"
              />
              <DashboardCard
                title="Bulk Upload Faculty"
                description="Upload faculty list"
                icon={<ClipboardList size={20} />}
                onClick={() => handlePageChange("bulk-upload")}
                className="hover:bg-blue-50"
              />
              <DashboardCard
                title="Manage Branches"
                description="View or edit branches"
                icon={<Users size={20} />}
                onClick={() => handlePageChange("branches")}
                className="hover:bg-blue-50"
              />
              <DashboardCard
                title="Notifications"
                description="Send or view notifications"
                icon={<Bell size={20} />}
                onClick={() => handlePageChange("notifications")}
                className="hover:bg-blue-50"
              />
            </div>
          </div>
        );
      case "enroll-user":
        return <EnrollUser setError={setError} toast={toast} />;
      case "bulk-upload":
        return <BulkUpload setError={setError} toast={toast} />;
      case "branches":
        return <BranchesManagement setError={setError} toast={toast} />;
      case "notifications":
        return <NotificationsManagement setError={setError} toast={toast} />;
      case "hod-leaves":
        return <HODLeavesManagement setError={setError} toast={toast} />;
      case "users":
        return <UsersManagement setError={setError} toast={toast} />;
      case "profile":
        return <AdminProfile user={user} setError={setError} />;
      default:
        return <AdminStats setError={setError} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="fixed top-0 left-0 h-full w-64 z-10">
        <Sidebar role="admin" setPage={handlePageChange} activePage={activePage} logout={handleLogout} />
      </div>
      <div className="ml-64 flex-1 flex flex-col min-h-screen overflow-hidden">
        <div className="sticky top-0 z-20 bg-white shadow">
          <Navbar
            role="admin"
            user={user}
            onNotificationClick={handleNotificationClick}
          />
        </div>
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-xl md:text-2xl font-bold">
              {activePage === "dashboard"
                ? "Admin Dashboard"
                : activePage
                    .split("-")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
            </h1>
            <div className="text-sm text-gray-600">
              Welcome, {user?.username || "Admin"}
            </div>
          </div>
          {error && (
            <div className="bg-red-500 text-white p-2 rounded mb-4">{error}</div>
          )}
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;