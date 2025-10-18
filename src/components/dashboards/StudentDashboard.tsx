import { useState, useEffect } from "react";
import Sidebar from "../common/Sidebar";
import Navbar from "../common/Navbar";
import StudentStats from "../student/StudentStats";
import StudentTimetable from "../student/StudentTimetable";
import StudentAttendance from "../student/StudentAttendance";
import InternalMarks from "../student/InternalMarks";
import SubmitLeaveRequest from "../student/SubmitLeaveRequest";
import LeaveStatus from "../student/LeaveStatus";
import StudentProfile from "../student/StudentProfile";
import StudentAnnouncements from "../student/StudentAnnouncements";
import Chat from "../common/Chat";
import StudentNotifications from "../student/StudentNotifications";
import FaceRecognition from "../student/FaceRecognition";
import StudentDashboardOverview from "../student/StudentDashboardOverview";
import StudentStudyMaterial from "../student/StudentStudyMaterial";
import StudentAssignments from "../student/StudentAssignments";
import StudentFees from "../../pages/StudentFees";
import PaymentSuccess from "../../pages/PaymentSuccess";
import PaymentCancel from "../../pages/PaymentCancel";
import { logoutUser } from "../../utils/authService";

interface StudentDashboardProps {
  user: any;
  setPage: (page: string) => void;
}

const StudentDashboard = ({ user, setPage }: StudentDashboardProps) => {
  const [activePage, setActivePage] = useState("dashboard");
  const [error, setError] = useState<string | null>(null);

  // Check URL path on mount to handle direct navigation (e.g., from Stripe redirects)
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/payment/success') {
      setActivePage('payment-success');
      // Clean up URL to avoid confusion
      window.history.replaceState({}, '', '/');
    } else if (path === '/payment/cancel') {
      setActivePage('payment-cancel');
      // Clean up URL to avoid confusion
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const handlePageChange = (page: string) => {
    setActivePage(page);
    setError(null);

    // scroll window to top just in case
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  const handleNotificationClick = () => {
    setActivePage("announcements");
  };

  const renderContent = () => {
    switch (activePage) {
      case "dashboard":
        return <StudentDashboardOverview setPage={handlePageChange} user={user} />;
      case "timetable":
        return <StudentTimetable />;
      case "attendance":
        return <StudentAttendance />;
      case "marks":
        return <InternalMarks />;
      case "leave-request":
        return <SubmitLeaveRequest />;
      case "leave-status":
        return <LeaveStatus setPage={handlePageChange} />;
      case "fees":
        return <StudentFees user={user} />;
      case "payment-success":
        return <PaymentSuccess setPage={handlePageChange} />;
      case "payment-cancel":
        return <PaymentCancel setPage={handlePageChange} />;
      case "profile":
        return <StudentProfile user={user} />;
      case "announcements":
        return <StudentAnnouncements />;
      case "chat":
        return <Chat role="student" />;
      case "notifications":
        return <StudentNotifications />;
      case "face-recognition":
        return <FaceRecognition />;
      case "student-study-material":
        return <StudentStudyMaterial />;
      case "student-assignment":
        return <StudentAssignments />;
      default:
        return <StudentDashboardOverview setPage={handlePageChange} user={user} />;
    }
  };

  return (
   <div className="flex min-h-screen bg-[#1c1c1e] text-foreground">
  {/* Sidebar (fixed left) */}
  <Sidebar
    role="student"
    setPage={handlePageChange}
    activePage={activePage}
    logout={handleLogout}
  />

  {/* Main Content */}
  <div className="flex-1 flex flex-col pl-64">
    {/* Navbar (fixed) */}
    <div className="fixed top-0 left-64 right-0 z-10 bg-card shadow-sm">
      <Navbar
        role="student"
        user={user}
        onNotificationClick={handleNotificationClick}
        setPage={handlePageChange}
      />
    </div>

    {/* Main Page Content (no margin-left, uses pl-64 instead) */}
    <main className="flex-1 mt-16 p-6 overflow-y-auto bg-[#1c1c1e] text-gray-200">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Student Dashboard – Overview
        </h1>

        <div className="text-base text-gray-100">
          <span className="text-lg font-semibold text-blue-400">
            Welcome, {user?.username || "Student"}
          </span>
          {user?.branch && (
            <span className="ml-2 text-gray-300">| {user.branch}</span>
          )}
          {user?.semester && (
            <span className="ml-2 text-gray-300">| Semester: {user.semester}</span>
          )}
          {user?.section && (
            <span className="ml-2 text-gray-300">| Section: {user.section}</span>
          )}
        </div>
      </div>


      {/* Error Message */}
      {error && (
        <div className="bg-destructive text-destructive-foreground p-3 rounded-lg mb-4 shadow">
          {error}
        </div>
      )}

      {/* Dashboard Content */}
      <div className="grid gap-6">{renderContent()}</div>
    </main>
  </div>
</div>


  );
};

export default StudentDashboard;