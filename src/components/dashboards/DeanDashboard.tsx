import { useState, useEffect, Component, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "../common/DashboardLayout";
import DeanReports from "../dean/DeanReports";
import DeanStats from "../dean/DeanStats";
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
      case 'reports':
        return <DeanReports />;
      case 'profile':
        return <div className="p-4">Profile page coming soon.</div>;
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
