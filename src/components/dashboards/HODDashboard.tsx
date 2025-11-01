//HODDashboard.tsx
 
import { useState, useEffect, Component, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../common/Sidebar";
import Navbar from "../common/Navbar";
import HODStats from "../hod/HODStats";
import LowAttendance from "../hod/LowAttendance";
import SemesterManagement from "../hod/SemesterManagement";
import StudentManagement from "../hod/StudentManagement";
import SubjectManagement from "../hod/SubjectManagement";
import FacultyAssignments from "../hod/FacultyAssignments";
import Timetable from "../hod/Timetable";
import LeaveManagement from "../hod/LeaveManagement";
import ApplyLeave from "../hod/ApplyLeave";
import AttendanceView from "../hod/AttendanceView";
import MarksView from "../hod/MarksView";
import NotificationsManagement from "../hod/NotificationsManagement";
import ProctorManagement from "../hod/ProctorManagement";
import Chat from "../common/Chat";
import HodProfile from "../hod/HodProfile";
import { logoutUser } from "../../utils/authService";
import StudyMaterial from "../hod/StudyMaterial";
import PromotionManagement from "../hod/PromotionManagement";
import { getHODBootstrap } from "../../utils/hod_api";
import { HODBootstrapProvider } from "../../context/HODBootstrapContext";
import { useTheme } from "../../context/ThemeContext";
import { motion } from "framer-motion";

interface HODUser {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  profile_picture?: string | null;
  branch?: string;
  branch_id?: string;
}

interface Semester {
  id: string;
  number: number;
}

interface Section {
  id: string;
  name: string;
  semester_id: string;
}

interface BootstrapData {
  branch_id?: string;
  semesters?: Semester[];
  sections?: Section[];
}

interface HODDashboardProps {
  user: HODUser;
  setPage: (page: string) => void;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, errorMessage: "" };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center py-6 text-red-500">
          <h2>Error: {this.state.errorMessage}</h2>
          <p>Please try refreshing the page or contact support.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const validateUser = (user: HODUser): boolean => {
  return !!(user && user.role === "hod"); // Only require role to be 'hod'
};

const HODDashboard = ({ user, setPage }: HODDashboardProps) => {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState<string>(
    localStorage.getItem("hodActivePage") || "dashboard"
  );
  const [error, setError] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [bootstrap, setBootstrap] = useState<BootstrapData | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!validateUser(user)) {
      setError("Invalid user data. Please log in again.");
      setTimeout(() => {
        handleLogout();
      }, 3000);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem("hodActivePage", activePage);
  }, [activePage]);

  // Fetch combined profile + semesters + sections once
  useEffect(() => {
    (async () => {
      try {
        const res = await getHODBootstrap();
        if (res.success && res.data) {
          setBootstrap({
            branch_id: res.data.profile?.branch_id,
            semesters: res.data.semesters,
            sections: res.data.sections,
          });
        }
      } catch (e) {
        // non-blocking; individual screens still handle errors
      }
    })();
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handlePageChange = (page: string) => {
    setActivePage(page);
    setError(null);

    // scroll window to top just in case
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNotificationClick = () => {
    setActivePage("notifications");
  };

  const handleLogout = async () => {
    try {
      const response = await logoutUser();
      if (response.success) {
        localStorage.clear();
        setPage("login");
        navigate("/", { replace: true }); // Redirect to home
      } else {
        setError(response.message || "Failed to log out. Please try again.");
      }
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
        return <HODStats setError={setError} setPage={handlePageChange}/>;
      case "promotion-management":
        return <PromotionManagement />;
      case "low-attendance":
        return <LowAttendance setError={setError} />;
      case "semesters":
        return <SemesterManagement />;
      case "students":
        return <StudentManagement />;
      case "subjects":
        return <SubjectManagement />;
      case "faculty-assignments":
        return <FacultyAssignments setError={setError} />;
      case "timetable":
        return <Timetable />;
      case "leaves":
        return <LeaveManagement />;
      case "apply-leaves":
        return <ApplyLeave />;
      case "attendance":
        return <AttendanceView />;
      case "marks":
        return <MarksView />;
      case "notifications":
        return <NotificationsManagement />;
      case "proctors":
        return <ProctorManagement />;
      case "chat":
        return <Chat role="hod" />;
      case "study-materials":
        return <StudyMaterial />;
      case "hod-profile":
        return <HodProfile user={user} setError={setError} />;
      default:
      return <HODStats setError={setError} setPage={handlePageChange} />;
    }
  };

  return (
    <HODBootstrapProvider value={bootstrap}>
    <motion.div 
      className={`flex min-h-screen pt-16 ${theme === 'dark' ? 'dark bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className={`fixed top-0 left-0 h-full z-10 transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <Sidebar
          role="hod"
          setPage={handlePageChange}
          activePage={activePage}
          logout={handleLogout}
          collapsed={isSidebarCollapsed}
          toggleCollapse={toggleSidebar}
        />
      </div>
      <div
        className={`flex-1 overflow-y-auto transition-all duration-300 scroll-smooth ${
          isSidebarCollapsed ? "ml-16" : "ml-64"
        } ${theme === 'dark' ? 'bg-background' : 'bg-gray-50'}`}
      >
        <div className={`sticky top-0 z-20 ${theme === 'dark' ? 'bg-background border-b border-border' : 'bg-white border-b border-gray-200'}`}>
          <Navbar role="hod" user={user} setPage={handlePageChange} onNotificationClick={handleNotificationClick}/>
        </div>
        <div className={`p-6 w-full ${theme === 'dark' ? 'bg-background' : 'bg-gray-50'}`}>
          {activePage === "dashboard" && (
            <div className="mb-6">
              <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Dashboard Overview</h1>
              
            </div>
          )}
          {error && (
            <div className={`p-3 rounded-lg mb-4 ${theme === 'dark' ? 'bg-destructive/10 border border-destructive/20 text-destructive-foreground' : 'bg-red-100 border border-red-200 text-red-700'}`}>
              {error}
            </div>
          )}
          <ErrorBoundary>
            {renderContent()}
          </ErrorBoundary>
        </div>
      </div>
    </motion.div>
    </HODBootstrapProvider>
  );
};

export default HODDashboard;