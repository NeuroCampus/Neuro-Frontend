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
        return <FacultyStats setActivePage={setActivePage} />;
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
        return <FacultyStats setActivePage={setActivePage} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#1c1c1e] pt-16">
      <Sidebar
        role="faculty"
        setPage={handlePageChange}
        activePage={activePage}
        logout={handleLogout}
        collapsed={isSidebarCollapsed}
        toggleCollapse={toggleSidebar}
      />
      <div
        className={`flex-1 overflow-y-auto bg-[#1c1c1e] thin-scrollbar transition-all duration-300 scroll-smooth ${
          isSidebarCollapsed ? "ml-16" : "ml-64"
        }`}
      >
        {/* Navbar same as HOD, but role="faculty" */}
        <div className="sticky top-0 z-20 bg-[#1c1c1e] border-b border-gray-700 ">
          <Navbar
            role="faculty"
            user={user}
            toggleSidebar={toggleSidebar}
            isSidebarCollapsed={isSidebarCollapsed}
            onNotificationClick={handleNotificationClick}
            setPage={handlePageChange}
          />
        </div>
        <div className="p-6 w-full bg-[#1c1c1e]">
          {activePage === "dashboard" && (
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-200">
                Dashboard Overview
              </h1>
            </div>
          )}
          {error && (
            <div className="bg-red-500 text-white p-2 rounded mb-4">{error}</div>
          )}
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
