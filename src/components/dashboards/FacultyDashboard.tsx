import { useState, useEffect } from "react";
import Sidebar from "../common/Sidebar";
import Navbar from "../common/Navbar";
import FacultyStats from "../faculty/FacultyStats";
import TakeAttendance from "../faculty/TakeAttendance";
import UploadMarks from "../faculty/UploadMarks";
import ApplyLeave from "../faculty/ApplyLeave";
import AttendanceRecords from "../faculty/AttendanceRecords";
import Announcements from "../faculty/Announcements";
import ProctorStudents from "../faculty/ProctorStudents";
import ManageStudentLeave from "../faculty/ManageStudentLeave";
import Timetable from "../faculty/Timetable";
import Chat from "../common/Chat";
import FacultyProfile from "../faculty/facultyProfile";
import GenerateStatistics from "../faculty/GenerateStatistics";
import { logoutUser } from "../../utils/authService";
import { useTheme } from "../../context/ThemeContext";

interface FacultyDashboardProps {
  user: any;
  setPage: (page: string) => void;
}

const FacultyDashboard = ({ user, setPage }: FacultyDashboardProps) => {
  const [activePage, setActivePage] = useState(
    localStorage.getItem("facultyActivePage") || "dashboard"
  );
  const [error, setError] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    localStorage.setItem("facultyActivePage", activePage);
  }, [activePage]);

    const handlePageChange = (page: string) => {
    setActivePage(page);
    setError(null);

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
      setPage("login");
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
        return <FacultyStats setActivePage={setPage} />;
      case "take-attendance":
        return <TakeAttendance />;
      case "upload-marks":
        return <UploadMarks />;
      case "apply-leave":
        return <ApplyLeave />;
      case "attendance-records":
        return <AttendanceRecords />;
      case "announcements":
        return <Announcements role="faculty" />;
      case "proctor-students":
        return <ProctorStudents />;
      case "student-leave":
        return <ManageStudentLeave />;
      case "timetable":
        return <Timetable role="faculty" />;
      case "chat":
        return <Chat role="faculty" />;
      case "faculty-profile":
        return <FacultyProfile role="faculty" user={user} />;
      case "statistics":
        return <GenerateStatistics />;
      default:
        return <FacultyStats setActivePage={setPage} />;
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
            user={user}
            toggleSidebar={toggleSidebar}
            isSidebarCollapsed={isSidebarCollapsed}
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