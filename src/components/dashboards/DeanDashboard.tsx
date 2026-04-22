import { useState, useEffect, Component, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "../common/DashboardLayout";
import DeanReports from "../dean/DeanReports";
import DeanStats from "../dean/DeanStats";
import DeanAttendance from "../dean/DeanAttendance";
import DeanAttendanceFilters from "../dean/DeanAttendanceFilters";
import CampusLocationManager from "../dean/CampusLocationManager";
import StudentInfoScanner from "../hod/StudentInfoScanner";
import DeanExams from "../dean/DeanExams";
import DeanFacultyProfile from "../dean/DeanFacultyProfile";
import DeanFinance from "../dean/DeanFinance";
import DeanAlerts from "../dean/DeanAlerts";
import DeanAttendanceRecords from "../dean/DeanAttendanceRecords";
import DeanProfile from "../dean/DeanProfile";
import ManageAdminLeavesDean from "../dean/ManageAdminLeavesDean";
import { useTheme } from "../../context/ThemeContext";

interface DeanUser {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  profile_picture?: string | null;
}

const getActivePageFromPath = (pathname: string): string => {
  const pathParts = pathname.split('/').filter(Boolean);
  const lastPart = pathParts[pathParts.length - 1] || '';
  const pathMap: { [key: string]: string } = {
    'dashboard': 'dashboard',
    'reports': 'reports',
    'profile': 'profile',
      'campus-locations': 'campus-locations',
    'attendance': 'attendance',
    'attendance-filters': 'attendance-filters',
    'performance': 'performance',
    'exams': 'exams',
    'faculty': 'faculty',
    'finance': 'finance',
    'alerts': 'alerts',
    'attendance-records': 'attendance-records',
    'admin-leaves': 'admin-leaves',
  };
  return pathMap[lastPart] || 'dashboard';
};

const DeanDashboard = ({ user, setPage }: { user: DeanUser; setPage: (p: string) => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activePage, setActivePage] = useState<string>(getActivePageFromPath(location.pathname));
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    setActivePage(getActivePageFromPath(location.pathname));
  }, [location.pathname]);

  const handlePageChange = (page: string) => {
    setActivePage(page);
    // Navigate to the corresponding dean route. Default to `/dean/{page}`
    const path = page === 'dashboard' ? '/dean/dashboard' : `/dean/${page}`;
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <div className="p-4"><DeanStats /></div>;
      case 'attendance':
        return <div className="p-4"><DeanAttendance /></div>;
      case 'attendance-filters':
        return <div className="p-4"><DeanAttendanceFilters /></div>;
      case 'campus-locations':
        return <div className="p-4"><CampusLocationManager /></div>;
      case 'performance':
        return <div className="p-4"><StudentInfoScanner /></div>;

      case 'exams':
        return <div className="p-4"><DeanExams /></div>;
      case 'faculty':
        return <div className="p-4"><DeanFacultyProfile /></div>;
      case 'finance':
        return <div className="p-4"><DeanFinance /></div>;
      case 'alerts':
        return <div className="p-4"><DeanAlerts /></div>;
      case 'attendance-records':
        return <div className="p-4"><DeanAttendanceRecords /></div>;
      case 'reports':
        return <DeanReports />;
      case 'profile':
        return <div className="p-4"><DeanProfile /></div>;
      case 'admin-leaves':
        return <ManageAdminLeavesDean />;
      default:
        return <div className="p-4">Welcome, Dean.</div>;
    }
  };

  return (
    <DashboardLayout
      role={"dean" as any}
      user={user}
      activePage={activePage}
      onPageChange={handlePageChange}
      onNotificationClick={() => {}}
      pageTitle={undefined}
      headerActions={undefined}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default DeanDashboard;
