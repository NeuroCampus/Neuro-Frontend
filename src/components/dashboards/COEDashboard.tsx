import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../common/Sidebar";
import Navbar from "../common/Navbar";
import COEStats from "../coe/COEStats";
import ExamApplications from "../coe/ExamApplications";
import COEReports from "../coe/COEReports";
import ExamSchedule from "../coe/ExamSchedule";
import StudentStatus from "../coe/StudentStatus";
import CourseStatistics from "../coe/CourseStatistics";
import Chat from "../common/Chat";
import COEProfile from "../coe/COEProfile";
import { logoutUser, fetchWithTokenRefresh } from "../../utils/authService";
import { API_ENDPOINT } from "../../utils/config";
import { useTheme } from "../../context/ThemeContext";

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
  const { theme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const getActivePageFromPath = (pathname: string): string => {
    const pathParts = pathname.split('/').filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1] || '';

    // Map URL paths to page names
    const pathMap: { [key: string]: string } = {
      'dashboard': 'dashboard',
      'exam-applications': 'exam-applications',
      'student-status': 'student-status',
      'course-statistics': 'course-statistics',
      'reports': 'reports',
      'exam-schedule': 'exam-schedule',
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

  // Fetch COE profile to get complete user information
  useEffect(() => {
    const fetchCOEProfile = async () => {
      try {
        const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/profile/`, {
          method: 'GET',
        });
        const result = await response.json();
        if (result.success && result.profile) {
          // Merge the fetched profile with the existing user data
          setCurrentUser(prev => ({ ...prev, ...result.profile }));
        } else {
          setCurrentUser(user); // Use original user data if profile fetch fails
        }
      } catch (error) {
        console.error('Error fetching COE profile:', error);
        setCurrentUser(user); // Use original user data on error
      }
    };

    fetchCOEProfile();
  }, [user]);

  const handlePageChange = (page: string) => {
    setActivePage(page);
    setError(null);

    // Navigate to the corresponding URL path
    const pathMap: { [key: string]: string } = {
      'dashboard': '/coe/dashboard',
      'exam-applications': '/coe/exam-applications',
      'student-status': '/coe/student-status',
      'course-statistics': '/coe/course-statistics',
      'reports': '/coe/reports',
      'exam-schedule': '/coe/exam-schedule',
      'profile': '/coe/profile',
    };

    navigate(pathMap[page] || '/coe/dashboard');
  };

  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <COEStats user={currentUser} />;
      case 'exam-applications':
        return <ExamApplications user={currentUser} />;
      case 'student-status':
        return <StudentStatus />;
      case 'course-statistics':
        return <CourseStatistics />;
      case 'reports':
        return <COEReports user={currentUser} />;
      case 'exam-schedule':
        return <ExamSchedule user={currentUser} />;
      case 'profile':
        return <COEProfile user={currentUser} />;
      default:
        return <COEStats user={currentUser} />;
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Sidebar (fixed left) */}
      <div className={`fixed top-0 left-0 h-full z-30 transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <Sidebar
          role="coe"
          setPage={handlePageChange}
          activePage={activePage}
          logout={handleLogout}
          collapsed={sidebarCollapsed}
          toggleCollapse={toggleSidebar}
        />
      </div>
      <div className={`flex-1 flex flex-col ${sidebarCollapsed ? 'pl-16' : 'pl-64'}`}>
        {/* Navbar (fixed) */}
        <div className={`fixed top-0 ${sidebarCollapsed ? 'left-16' : 'left-64'} right-0 z-10 shadow-sm`}>
          <Navbar
            user={currentUser}
            onLogout={handleLogout}
            role="coe"
          />
        </div>
        <main className="flex-1 p-6 mt-16">
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          {renderContent()}
        </main>
      </div>
      <Chat user={currentUser} />
    </div>
  );
};

export default COEDashboard;