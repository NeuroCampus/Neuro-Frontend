import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "../common/DashboardLayout";
import { HostelManagement, RoomManagement, StudentManagement, WardenManagement } from "../hms";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useToast } from "../../hooks/use-toast";
import { logoutUser } from "../../utils/authService";
import { useTheme } from "../../context/ThemeContext";

interface HMSDashboardProps {
  user: any;
  setPage: (page: string) => void;
}

const HMSDashboard = ({ user, setPage }: HMSDashboardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { theme } = useTheme();

  // Get active page from URL path
  const getActivePageFromPath = (pathname: string) => {
    const path = pathname.replace('/hms', '').replace('/', '');
    return path || 'hostels';
  };

  const activePage = getActivePageFromPath(location.pathname);

  const handlePageChange = (page: string) => {
    const path = page === 'dashboard' ? '/hms' : `/hms/${page}`;
    navigate(path);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNotificationClick = () => {
    navigate('/hms/notifications');
  };

  const handleTabChange = (value: string) => {
    handlePageChange(value);
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
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Hostel Management System</h1>
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Admin Dashboard
          </p>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activePage} onValueChange={handleTabChange} className="w-full">
          <TabsList className={`grid w-full grid-cols-4 ${
            theme === 'dark' 
              ? 'bg-background border border-border' 
              : 'bg-gray-50 border border-gray-200'
          }`}>
            <TabsTrigger value="hostels" className="data-[state=active]:bg-[#a259ff] data-[state=active]:text-white">
              Hostels
            </TabsTrigger>
            <TabsTrigger value="rooms" className="data-[state=active]:bg-[#a259ff] data-[state=active]:text-white">
              Rooms
            </TabsTrigger>
            <TabsTrigger value="students" className="data-[state=active]:bg-[#a259ff] data-[state=active]:text-white">
              Students
            </TabsTrigger>
            <TabsTrigger value="wardens" className="data-[state=active]:bg-[#a259ff] data-[state=active]:text-white">
              Wardens
            </TabsTrigger>
          </TabsList>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <TabsContent value="hostels">
              <HostelManagement />
            </TabsContent>

            <TabsContent value="rooms">
              <RoomManagement />
            </TabsContent>

            <TabsContent value="students">
              <StudentManagement />
            </TabsContent>

            <TabsContent value="wardens">
              <WardenManagement />
            </TabsContent>
          </motion.div>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
};

export default HMSDashboard;