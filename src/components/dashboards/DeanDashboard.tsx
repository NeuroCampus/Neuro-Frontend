import { useState, useEffect, Component, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "../common/DashboardLayout";
import DeanReports from "../dean/DeanReports";
import DeanStats from "../dean/DeanStats";
import DeanAttendance from "../dean/DeanAttendance";
import StudentInfoScanner from "../hod/StudentInfoScanner";
import DeanTimetable from "../dean/DeanTimetable";
import DeanExams from "../dean/DeanExams";
import DeanFacultyProfile from "../dean/DeanFacultyProfile";
import DeanFinance from "../dean/DeanFinance";
import DeanAlerts from "../dean/DeanAlerts";
import DeanAttendanceRecords from "../dean/DeanAttendanceRecords";
import DeanProfile from "../dean/DeanProfile";
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
    'attendance': 'attendance',
    'performance': 'performance',
    'timetable': 'timetable',
    'exams': 'exams',
    'faculty': 'faculty',
    'finance': 'finance',
    'alerts': 'alerts',
    'attendance-records': 'attendance-records',
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
    const pathMap: { [key: string]: string } = {
      'dashboard': '/dean/dashboard',
      'reports': '/dean/reports',
      'profile': '/dean/profile',
    };
    const path = pathMap[page] || '/dean/dashboard';
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <div className="p-4"><DeanStats /></div>;
      case 'attendance':
        return <div className="p-4"><DeanAttendance /></div>;
      case 'performance':
        return <div className="p-4"><StudentInfoScanner /></div>;
      case 'timetable':
        return <div className="p-4"><DeanTimetable /></div>;
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
