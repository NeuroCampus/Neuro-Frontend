import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "../common/DashboardLayout";
import HMSOverview from "../hms/HMSOverview";
import HostelManagement from "../hms/HostelManagement";
import RoomManagement from "../hms/RoomManagement";
import StudentManagement from "../hms/StudentManagement";
import Enrollment from "../hms/Enrollment";
import StaffManagementOverview from "../hms/StaffManagementOverview";
import MenuManagement from "../hms/MenuManagement";
import IssueTracking from "../hms/IssueTracking";
import StudentMealManagement from "../hms/StudentMealManagement";
import { useToast } from "../../hooks/use-toast";
import { logoutUser } from "../../utils/authService";
import { useTheme } from "../../context/ThemeContext";
import { HMSProvider, useHMSContext } from "../../context/HMSContext";
import { AcademicProvider } from "../../context/AcademicContext";

interface HMSDashboardProps {
  user: any;
  setPage: (page: string) => void;
}

const HMSDashboardContent = ({ user, setPage }: HMSDashboardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hostels, loading, refreshData } = useHMSContext();
  const { toast } = useToast();
  const { theme } = useTheme();
  const [selectedHostelId, setSelectedHostelId] = useState<number | null>(null);

  // Set initial selected hostel if not set
  useEffect(() => {
    if (hostels.length > 0 && !selectedHostelId) {
      setSelectedHostelId(hostels[0].id);
    }
  }, [hostels, selectedHostelId]);

  // Get active page from URL path
  const getActivePageFromPath = (pathname: string) => {
    const path = pathname.replace('/hms', '').replace('/', '');
    return path || 'dashboard';
  };

  const activePage = getActivePageFromPath(location.pathname);

  const handlePageChange = (page: string) => {
    const path = page === 'dashboard' ? '/hms' : `/hms/${page}`;
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNotificationClick = () => {
    navigate('/hms/notifications');
  };

  const renderContent = () => {
    switch (activePage) {
      case "dashboard":
      case "":
        return <HMSOverview />;
      case "hostels":
        return <HostelManagement />;
      case "rooms":
        return <RoomManagement />;
      case "students":
        return <StudentManagement />;
      case "enrollment":
        return <Enrollment />;
      case "staff":
        return <StaffManagementOverview />;
      case "menu-management":
        return <MenuManagement />;
      case "student-meals":
        return <StudentMealManagement hostelId={selectedHostelId} />;
      case "issues":
        if (selectedHostelId) {
          return <IssueTracking hostelId={selectedHostelId} />;
        }
        if (!loading) {
          return (
            <div className="text-center py-12">
              <p className="text-gray-500">No hostels found to track issues.</p>
            </div>
          );
        }
        return null;
      default:
        return <HMSOverview />;
    }
  };

  return (
    <DashboardLayout
      role="hms"
      user={user}
      activePage={activePage}
      onPageChange={handlePageChange}
      onNotificationClick={handleNotificationClick}
      pageTitle="HMS Dashboard"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header - Only show for non-dashboard pages */}
        {(activePage !== '' && activePage !== 'dashboard') && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Page specific header content can go here if needed in future */}
          </div>
        )}

        {/* Tabs Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div key={activePage}>
            {renderContent()}
          </div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

const HMSDashboard = (props: HMSDashboardProps) => (
  <HMSProvider>
    <AcademicProvider>
      <HMSDashboardContent {...props} />
    </AcademicProvider>
  </HMSProvider>
);

export default HMSDashboard;