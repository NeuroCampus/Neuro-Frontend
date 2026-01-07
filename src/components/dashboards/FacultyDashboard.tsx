import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../common/Sidebar";
import Navbar from "../common/Navbar";
import FacultyStats from "../faculty/FacultyStats";
import TakeAttendance from "../faculty/TakeAttendance";
import UploadMarks from "../faculty/UploadMarks";
import COAttainment from "../faculty/COAttainment";
import ApplyLeave from "../faculty/ApplyLeave";
import AttendanceRecords from "../faculty/AttendanceRecords";
import Announcements from "../faculty/Announcements";
import ProctorStudents from "../faculty/ProctorStudents";
import ExamApplication from "../faculty/ExamApplication";
import ManageStudentLeave from "../faculty/ManageStudentLeave";
import Timetable from "../faculty/Timetable";
import Chat from "../common/Chat";
import FacultyProfile from "../faculty/facultyProfile";
import GenerateStatistics from "../faculty/GenerateStatistics";
import FacultyAttendance from "../faculty/FacultyAttendance";
import StudentInfoScanner from "../hod/StudentInfoScanner";
import { logoutUser, fetchWithTokenRefresh } from "../../utils/authService";
import { API_ENDPOINT } from "../../utils/config";
import { useTheme } from "../../context/ThemeContext";
import { useProctorStudentsQuery } from "../../hooks/useApiQueries";

interface FacultyDashboardProps {
  user: {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    profile_picture?: string | null;
    branch?: string;
  };
  setPage: (page: string) => void;
}

const FacultyDashboard = ({ user, setPage }: FacultyDashboardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(user);
  
  const getActivePageFromPath = (pathname: string): string => {
    const pathParts = pathname.split('/').filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1] || '';
    
    // Map URL paths to page names
    const pathMap: { [key: string]: string } = {
      'dashboard': 'dashboard',
      'take-attendance': 'take-attendance',
      'upload-marks': 'upload-marks',
      'co-attainment': 'co-attainment',
      'apply-leave': 'apply-leave',
      'attendance-records': 'attendance-records',
      'faculty-attendance': 'faculty-attendance',
      'announcements': 'announcements',
      'proctor-students': 'proctor-students',
      'exam-applications': 'exam-applications',
      'student-leave': 'student-leave',
      'timetable': 'timetable',
      'chat': 'chat',
      'faculty-profile': 'faculty-profile',
      'statistics': 'statistics',
      'scan-student-info': 'scan-student-info'
    };
    
    return pathMap[lastPart] || 'dashboard';
  };

  const [activePage, setActivePage] = useState(getActivePageFromPath(location.pathname));
  const [error, setError] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { theme } = useTheme();

  // Fetch proctor students data at dashboard level to avoid duplicate API calls
  const { data: proctorStudentsData, isLoading: proctorStudentsLoading } = useProctorStudentsQuery();
  const proctorStudents = proctorStudentsData?.data || [];

  // Update active page when location changes
  useEffect(() => {
    setActivePage(getActivePageFromPath(location.pathname));
  }, [location.pathname]);

  // Fetch faculty profile to get complete user information
  useEffect(() => {
    const fetchFacultyProfile = async () => {
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
        console.error('Error fetching faculty profile:', error);
        setCurrentUser(user); // Use original user data on error
      }
    };

    fetchFacultyProfile();
  }, [user]);

  const handlePageChange = (page: string) => {
    setActivePage(page);
    setError(null);
    
    // Navigate to the corresponding URL path
    const pathMap: { [key: string]: string } = {
      'dashboard': '/faculty/dashboard',
      'take-attendance': '/faculty/take-attendance',
      'upload-marks': '/faculty/upload-marks',
      'co-attainment': '/faculty/co-attainment',
      'apply-leave': '/faculty/apply-leave',
      'attendance-records': '/faculty/attendance-records',
      'faculty-attendance': '/faculty/faculty-attendance',
      'announcements': '/faculty/announcements',
      'proctor-students': '/faculty/proctor-students',
      'exam-applications': '/faculty/exam-applications',
      'student-leave': '/faculty/student-leave',
      'timetable': '/faculty/timetable',
      'chat': '/faculty/chat',
      'faculty-profile': '/faculty/faculty-profile',
      'statistics': '/faculty/statistics',
      'scan-student-info': '/faculty/scan-student-info'
    };
    
    const path = pathMap[page] || '/faculty/dashboard';
    navigate(path);

    // scroll window to top just in case
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNotificationClick = () => {
    setActivePage("announcements");
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      localStorage.clear();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      setError("Failed to log out. Please try again.");
    }
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const renderContent = () => {
    switch (activePage) {
      case "dashboard":
        return <FacultyStats setActivePage={handlePageChange} />;
      case "take-attendance":
        return <TakeAttendance />;
      case "upload-marks":
        return <UploadMarks />;
      case "co-attainment":
        return <COAttainment />;
      case "apply-leave":
        return <ApplyLeave />;
      case "attendance-records":
        return <AttendanceRecords />;
      case "faculty-attendance":
        return <FacultyAttendance />;
      case "announcements":
        return <Announcements role="faculty" proctorStudents={proctorStudents} proctorStudentsLoading={proctorStudentsLoading} />;
      case "proctor-students":
        return <ProctorStudents proctorStudents={proctorStudents} proctorStudentsLoading={proctorStudentsLoading} />;
      case "exam-applications":
        return <ExamApplication proctorStudents={proctorStudents} proctorStudentsLoading={proctorStudentsLoading} />;
      case "student-leave":
        return <ManageStudentLeave proctorStudents={proctorStudents} proctorStudentsLoading={proctorStudentsLoading} />;
      case "timetable":
        return <Timetable role="faculty" />;
      case "chat":
        return <Chat role="faculty" />;
      case "faculty-profile":
        return <FacultyProfile />;
      case "statistics":
        return <GenerateStatistics proctorStudents={proctorStudents} proctorStudentsLoading={proctorStudentsLoading} />;
      case "scan-student-info":
        return <StudentInfoScanner />;
      default:
        return <FacultyStats setActivePage={handlePageChange} />;
    }
  };

  return (
    <div className={`flex min-h-screen pt-16 ${theme === 'dark' ? 'dark bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
      <Sidebar
        role="faculty"
        setPage={handlePageChange}
        activePage={activePage}
        logout={handleLogout}
        collapsed={isSidebarCollapsed}
        toggleCollapse={toggleSidebar}
      />
      <div
        className={`flex-1 overflow-y-auto transition-all duration-300 scroll-smooth ${
          isSidebarCollapsed ? "ml-16" : "ml-64"
        } ${theme === 'dark' ? 'bg-background' : 'bg-gray-50'}`}
      >
        {/* Navbar same as HOD, but role="faculty" */}
        <div className={`sticky top-0 z-20 ${theme === 'dark' ? 'bg-background border-b border-border' : 'bg-white border-b border-gray-200'}`}>
          <Navbar
            role="faculty"
            user={currentUser}
            onNotificationClick={handleNotificationClick}
            setPage={handlePageChange}
          />
        </div>
        <div className={`p-6 w-full ${theme === 'dark' ? 'bg-background' : 'bg-gray-50'}`}>
          {activePage === "dashboard" && (
            <div className="mb-6">
              <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
                Dashboard Overview
              </h1>
            </div>
          )}
          {error && (
            <div className={`p-3 rounded-lg mb-4 ${theme === 'dark' ? 'bg-destructive/10 border border-destructive/20 text-destructive-foreground' : 'bg-red-100 border border-red-200 text-red-700'}`}>
              {error}
            </div>
          )}
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;