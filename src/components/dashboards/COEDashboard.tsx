import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "../common/DashboardLayout";
import StudentStatus from "../coe/StudentStatus";
import CourseStatistics from "../coe/CourseStatistics";
import COEDashboardStats from "../coe/COEDashboardStats";
import COEProfile from "../coe/COEProfile";
import PublishResults from "../coe/PublishResults";
import { logoutUser, fetchWithTokenRefresh } from "../../utils/authService";
import { API_ENDPOINT } from "../../utils/config";

interface COEDashboardProps {
  user: {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    profile_picture?: string | null;
  };
}

const COEDashboard = ({ user }: COEDashboardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(user);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const getActivePageFromPath = (pathname: string): string => {
    const pathParts = pathname.split('/').filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1] || '';

    // Map URL paths to page names
    const pathMap: { [key: string]: string } = {
      'dashboard': 'dashboard',
      'student-status': 'student-status',
      'course-statistics': 'course-statistics',
      'publish-results': 'publish-results',
      'profile': 'profile',
    };

    return pathMap[lastPart] || 'dashboard';
  };

  const [activePage, setActivePage] = useState(getActivePageFromPath(location.pathname));

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Update active page when location changes
  useEffect(() => {
    setActivePage(getActivePageFromPath(location.pathname));
  }, [location.pathname]);

  // Note: Profile fetching is handled by the profile page component itself

  const handlePageChange = (page: string) => {
    setActivePage(page);
    setError(null);

    // Navigate to the corresponding URL path
    const pathMap: { [key: string]: string } = {
      'dashboard': '/coe/dashboard',
      'student-status': '/coe/student-status',
      'course-statistics': '/coe/course-statistics',
      'publish-results': '/coe/publish-results',
      'profile': '/coe/profile',
    };

    navigate(pathMap[page] || '/coe/dashboard');
  };

  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <COEDashboardStats />;
      case 'student-status':
        return <StudentStatus />;
      case 'course-statistics':
        return <CourseStatistics />;
      case 'publish-results':
        return <PublishResults />;
      case 'profile':
        return <COEProfile />;
      default:
        return <COEDashboardStats />;
    }
  };

  return (
    <DashboardLayout
      role="coe"
      user={currentUser}
      activePage={activePage}
      onPageChange={handlePageChange}
      pageTitle="COE Dashboard"
    >
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      {renderContent()}
    </DashboardLayout>
  );
};

export default COEDashboard;