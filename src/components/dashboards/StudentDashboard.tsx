import { useState, useEffect, Suspense, lazy } from "react";
import Sidebar from "../common/Sidebar";
import Navbar from "../common/Navbar";
import Chat from "../common/Chat";
import { logoutUser } from "../../utils/authService";
import { useTheme } from "../../context/ThemeContext";
import { SkeletonCard } from "../ui/skeleton";

// Lazy load student components for code splitting
const StudentStats = lazy(() => import("../student/StudentStats"));
const StudentTimetable = lazy(() => import("../student/StudentTimetable"));
const StudentAttendance = lazy(() => import("../student/StudentAttendance"));
const InternalMarks = lazy(() => import("../student/InternalMarks"));
const SubmitLeaveRequest = lazy(() => import("../student/SubmitLeaveRequest"));
const LeaveStatus = lazy(() => import("../student/LeaveStatus"));
const StudentProfile = lazy(() => import("../student/StudentProfile"));
const StudentAnnouncements = lazy(() => import("../student/StudentAnnouncements"));
const StudentNotifications = lazy(() => import("../student/StudentNotifications"));
const FaceRecognition = lazy(() => import("../student/FaceRecognition"));
const StudentDashboardOverview = lazy(() => import("../student/StudentDashboardOverview"));
const StudentStudyMaterial = lazy(() => import("../student/StudentStudyMaterial"));
const StudentAssignments = lazy(() => import("../student/StudentAssignments"));
const StudentFees = lazy(() => import("../../pages/StudentFees"));
const PaymentSuccess = lazy(() => import("../../pages/PaymentSuccess"));
const PaymentCancel = lazy(() => import("../../pages/PaymentCancel"));

// Loading fallback component
const LoadingFallback = () => (
  <div className="p-6 space-y-6">
    <SkeletonCard />
    <SkeletonCard />
    <SkeletonCard />
  </div>
);

interface StudentDashboardProps {
  user: any;
  setPage: (page: string) => void;
}

const StudentDashboard = ({ user, setPage }: StudentDashboardProps) => {
  const [activePage, setActivePage] = useState("dashboard");
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { theme } = useTheme();

  // Check URL path on mount to handle direct navigation (e.g., from Stripe redirects)
  useEffect(() => {
    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const hasPaymentParams = urlParams.has('session_id') || urlParams.has('invoice_id');

    if (path === '/payment/success' || (path === '/' && hasPaymentParams)) {
      setActivePage('payment-success');
      // Keep the URL with query parameters so PaymentSuccess component can access them
    } else if (path === '/payment/cancel' || (path === '/' && urlParams.has('cancel'))) {
      setActivePage('payment-cancel');
      // Keep the URL with query parameters for PaymentCancel component
    }
  }, []);

  const handlePageChange = (page: string) => {
    console.log("Changing page to:", page); // Debug log
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

  const handleNotificationClick = () => {
    setActivePage("announcements");
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
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
        return <StudentProfile />;
      case "announcements":
        return <StudentAnnouncements />;
      case "chat":
        return <Chat />;
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
   <div className={`flex min-h-screen ${theme === 'dark' ? 'bg-background text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
  {/* Sidebar (fixed left) */}
  <Sidebar
    role="student"
    setPage={handlePageChange}
    activePage={activePage}
    logout={handleLogout}
    collapsed={sidebarCollapsed}
    toggleCollapse={toggleSidebar}
  />

  {/* Main Content */}
  <div className={`flex-1 flex flex-col ${sidebarCollapsed ? 'pl-16' : 'pl-64'}`}>
    {/* Navbar (fixed) */}
    <div className={`fixed top-0 ${sidebarCollapsed ? 'left-16' : 'left-64'} right-0 z-10 shadow-sm`}>
      <Navbar
        role="student"
        user={user}
        onNotificationClick={handleNotificationClick}
        setPage={handlePageChange}
      />
    </div>

    {/* Main Page Content */}
    <main className={`flex-1 mt-16 p-6 overflow-y-auto ${theme === 'dark' ? 'bg-background text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className={`text-2xl font-bold tracking-tight ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
          Student Dashboard – Overview
        </h1>

        <div className={`text-base ${theme === 'dark' ? 'text-foreground' : 'text-gray-700'}`}>
          <span className={`text-lg font-semibold ${theme === 'dark' ? 'text-primary' : 'text-blue-600'}`}>
            Welcome, {user?.username || "Student"}
          </span>
          {user?.branch && (
            <span className={`ml-2 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>| {user.branch}</span>
          )}
          {user?.semester && (
            <span className={`ml-2 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>| Semester: {user.semester}</span>
          )}
          {user?.section && (
            <span className={`ml-2 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>| Section: {user.section}</span>
          )}
        </div>
      </div>


      {/* Error Message */}
      {error && (
        <div className={`p-3 rounded-lg mb-4 shadow ${theme === 'dark' ? 'bg-destructive/20 text-destructive-foreground border border-destructive' : 'bg-red-100 text-red-700 border border-red-200'}`}>
          {error}
        </div>
      )}

      {/* Dashboard Content */}
      <Suspense fallback={<LoadingFallback />}>
        <div className="grid gap-6">{renderContent()}</div>
      </Suspense>
    </main>
  </div>
</div>


  );
};

export default StudentDashboard;