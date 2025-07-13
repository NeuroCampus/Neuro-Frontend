import { useState } from "react";
import Sidebar from "../common/Sidebar";
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
  const [activePage, setActivePage] = useState("dashboard");
  const [error, setError] = useState<string | null>(null);

  const handlePageChange = (page: string) => {
    setActivePage(page);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setPage("login");
    } catch (error) {
      console.error("Logout error:", error);
      setError("Failed to log out. Please try again.");
    }
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
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar
        role="faculty"
        setPage={handlePageChange}
        activePage={activePage}
        logout={handleLogout}
      />
      <div className="ml-64 w-full max-h-screen overflow-y-auto bg-gray-100 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-xl md:text-2xl font-bold">
            Faculty Dashboard -{" "}
            {activePage.charAt(0).toUpperCase() + activePage.slice(1).replace("-", " ")}
          </h1>
          <div className="text-sm text-gray-600">
            Welcome, {user?.username || "Faculty"}
            {user?.department && ` | ${user.department}`}
          </div>
        </div>

        {error && (
          <div className="bg-red-500 text-white p-2 rounded mb-4">{error}</div>
        )}

        {renderContent()}
      </div>
    </div>
  );
};

export default FacultyDashboard;