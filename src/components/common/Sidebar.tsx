//sidebar.tsx
 
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
// Use public directory asset via URL
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import {
  LayoutDashboard,
  Users,
  User,
  Calendar,
  FileText,
  Bell,
  BarChart2,
  Settings,
  LogOut,

  GitBranch,
  UserCheck,
  ClipboardList,
  GraduationCap,
  BookOpen,
  Upload,
  CreditCard,
  Search,
} from "lucide-react";
import { useIsMobile } from "../../hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { useTheme } from "../../context/ThemeContext";

interface SidebarProps {
  role: string;
  setPage: (page: string) => void;
  activePage: string;
  logout?: () => void;
  collapsed: boolean;
  toggleCollapse: () => void;
}

const Sidebar = ({ role, setPage, activePage, logout, collapsed, toggleCollapse }: SidebarProps) => {
  const isMobile = useIsMobile();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { theme } = useTheme();

  const handlePageChange = (page: string) => {
    setPage(page);
    if (isMobile) {
      toggleCollapse();
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = () => {
    if (logout) {
      logout();
    }
    setShowLogoutDialog(false);
  };

  const getIcon = (page: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
    'exam-applications': <ClipboardList size={20} />,
      dashboard: <LayoutDashboard size={20} />,
      "promotion-management": <UserCheck size={20} />,
      "enroll-user": <User size={20} />,
      "bulk-upload": <Upload size={20} />,
      branches: <GitBranch size={20} />,
      notifications: <Bell size={20} />,
      "hod-leaves": <UserCheck size={20} />,
      users: <Users size={20} />,
      profile: <User size={20} />,
      "admin-profile": <User size={20} />,
      "hod-profile": <User size={20} />,
      "faculty-profile": <User size={20} />,
      "low-attendance": <BarChart2 size={20} />,
      semesters: <Calendar size={20} />,
      students: <GraduationCap size={20} />,
      subjects: <BookOpen size={20} />,
      "faculty-assignments": <ClipboardList size={20} />,
      timetable: <Calendar size={20} />,
      leaves: <FileText size={20} />,
      "apply-leaves": <FileText size={20} />,
      attendance: <BarChart2 size={20} />,
      marks: <BarChart2 size={20} />,
      "study-materials": <BookOpen size={20} />,
      "scan-student-info": <Search size={20} />,
      proctors: <UserCheck size={20} />,

      "take-attendance": <BarChart2 size={20} />,
      "upload-marks": <Upload size={20} />,
      "co-attainment": <BarChart2 size={20} />,
      "apply-leave": <FileText size={20} />,
      "attendance-records": <BarChart2 size={20} />,
      "faculty-attendance": <UserCheck size={20} />,
      announcements: <Bell size={20} />,
      "proctor-students": <UserCheck size={20} />,
      "student-leave": <FileText size={20} />,
      statistics: <BarChart2 size={20} />,
      "leave-request": <FileText size={20} />,
      "leave-status": <FileText size={20} />,
      certificates: <FileText size={20} />,
      fees: <CreditCard size={20} />,
    };
    return iconMap[page] || <LayoutDashboard size={20} />;
  };

  const menuItems: { [key: string]: { name: string; page: string }[] } = {
  admin: [
    // Main
    { name: "Dashboard", page: "dashboard" },
    
    // User Management
    { name: "Enroll Staff", page: "enroll-user" },
    { name: "Bulk Upload", page: "bulk-upload" },
    { name: "Users", page: "users" },
    
    // Academic Structure
    { name: "Branches", page: "branches" },
    { name: "Batches", page: "batches" },
    
    // Notifications & Leaves
    { name: "Notifications", page: "notifications" },
    { name: "HOD Leaves", page: "hod-leaves" },
    
    // Profile
    { name: "Profile", page: "profile" },
  ],

  hod: [
    // Main
    { name: "Dashboard", page: "dashboard" },
    
    // Academic Management
    { name: "Semester Management", page: "semesters" },
    { name: "Students", page: "students" },
    { name: "Student Enrollment", page: "student-enrollment" },
    { name: "Subjects", page: "subjects" },
    { name: "Faculty Assignments", page: "faculty-assignments" },
    { name: "Timetable", page: "timetable" },
    
    // Attendance & Marks
    // { name: "Attendance", page: "attendance" },
 
    { name: "Low Attendance", page: "low-attendance" },
    { name: "Faculty Attendance", page: "faculty-attendance" },
    { name: "Promotion Management", page: "promotion-management" },
    
    // Leaves
    { name: "Faculty Leaves", page: "leaves" },
    { name: "Apply Leaves", page: "apply-leaves" },
    
    // Resources & Communication
    { name: "Study Material", page: "study-materials" },
    { name: "Scan for Student Info", page: "scan-student-info" },
    { name: "Proctors", page: "proctors" },
    { name: "Notifications", page: "notifications" },
    
    // Profile
    { name: "Profile", page: "hod-profile" },
  ],

  faculty: [
    // Main
    { name: "Dashboard", page: "dashboard" },
    
    // Attendance & Marks
    { name: "Take Attendance", page: "take-attendance" },
    { name: "Attendance Records", page: "attendance-records" },
    { name: "My Attendance", page: "faculty-attendance" },
    { name: "Upload Marks", page: "upload-marks" },
    { name: "CO Attainment", page: "co-attainment" },
    { name: "Generate Statistics", page: "statistics" },
    
    // Leave Management
    { name: "Apply Leave", page: "apply-leave" },
    { name: "Manage Student Leave", page: "student-leave" },
    
    // Academic
    { name: "Timetable", page: "timetable" },
    { name: "Exam Applications", page: "exam-applications" },
    { name: "Proctor Students", page: "proctor-students" },
    { name: "Scan for Student Info", page: "scan-student-info" },
    
    // Communication
    { name: "Announcements", page: "announcements" },
    
    // Profile
    { name: "Profile", page: "faculty-profile" },
  ],

  student: [
    // Main
    { name: "Dashboard", page: "dashboard" },
    
    // Academic
    { name: "Timetable", page: "timetable" },
    { name: "Attendance", page: "attendance" },
    { name: "Internal Marks", page: "marks" },
    { name: "Fees", page: "fees" },
    
    // Leave Management
    { name: "Leave Request", page: "leave-request" },
    { name: "Leave Status", page: "leave-status" },
    
    // Communication
    { name: "Announcements", page: "announcements" },
    
    // Profile
    { name: "Profile", page: "profile" },
  ],
};

 
  const sidebarContent = (
    <motion.div 
      className={`h-full flex flex-col border-r ${theme === 'dark' ? 'bg-background border-border' : 'bg-white border-gray-200'}`}
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <motion.div 
        className={`p-4 border-b ${theme === 'dark' ? 'bg-background border-border' : 'bg-white border-gray-200'}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center shadow-lg overflow-hidden border-2 border-[#a259ff]"
          >
            <img
              src="/logo.jpeg"
              alt="Logo"
              className="w-full h-full object-contain"
              style={{ 
                borderRadius: '0.5rem',
                filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'none'
              }}
            />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className={`font-bold text-lg ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>NEURO CAMPUS</h1>
                <p className={`text-xs capitalize ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>{role} Portal</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
 
      {/* Menu Items */}
      <motion.div 
        className="flex-1 overflow-y-auto py-4 thin-scrollbar"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="space-y-1 px-3">
          {menuItems[role]?.map((item, index) => (
            <motion.div
              key={item.page}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 * index }}
            >
              <Button
                variant={activePage === item.page ? "default" : "ghost"}
                className={`w-full justify-start gap-3 h-10 transition-all duration-200 ${
                  activePage === item.page
                    ? "bg-[#a259ff] hover:bg-[#a259ff]/90 text-white shadow-lg shadow-[#a259ff]/20"
                    : theme === 'dark' 
                      ? "text-muted-foreground hover:text-foreground hover:bg-accent" 
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                } ${collapsed ? "px-2" : "px-3"}`}
                onClick={() => handlePageChange(item.page)}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.1 }}
                >
                  {getIcon(item.page)}
                </motion.div>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      className="truncate"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          ))}
        </div>
      </motion.div>
 
      {/* Logout Button */}
      <motion.div 
        className={`p-3 border-t ${theme === 'dark' ? 'border-border' : 'border-gray-200'}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <Button
          variant="ghost"
          className={`w-full justify-start gap-3 h-10 transition-all duration-200 ${collapsed ? "px-2" : "px-3"} ${
            theme === 'dark' 
              ? "text-red-400 hover:text-red-100 hover:bg-red-900/50" 
              : "text-red-700 hover:text-red-800 hover:bg-red-200"
          }`}
          onClick={handleLogoutClick}
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.1 }}
          >
            <LogOut size={20} />
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>
    </motion.div>
  );
 
  if (isMobile) {
    return (
      <>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              className="fixed inset-0 bg-black/50 z-30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={toggleCollapse}
            />
          )}
        </AnimatePresence>
        <motion.div
          className={`fixed top-0 left-0 h-full z-40 shadow-2xl ${theme === 'dark' ? 'bg-background' : 'bg-white'}`}
          initial={{ x: "-100%" }}
          animate={{ x: collapsed ? "-100%" : "0%" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {sidebarContent}
        </motion.div>
        <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <DialogContent className={theme === 'dark' ? "bg-background border-border text-foreground" : "bg-white border-gray-200 text-gray-900"}>
            <DialogHeader>
              <DialogTitle className={theme === 'dark' ? "text-foreground" : "text-gray-900"}>Confirm Logout</DialogTitle>
              <DialogDescription className={theme === 'dark' ? "text-muted-foreground" : "text-gray-500"}>Are you sure you want to log out?</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowLogoutDialog(false)} 
                className={theme === 'dark' ? "border-border text-foreground hover:bg-accent" : "border-gray-300 text-gray-700 hover:bg-gray-100"}
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmLogout} 
                className={theme === 'dark' ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : "bg-red-600 hover:bg-red-700 text-white"}
              >
                Logout
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }
 
  return (
    <motion.div
      className={`fixed top-0 left-0 h-screen z-40 shadow-xl transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      } ${theme === 'dark' ? 'bg-background' : 'bg-white'}`}
      initial={{ x: -100 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {sidebarContent}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className={theme === 'dark' ? "bg-background border-border text-foreground" : "bg-white border-gray-200 text-gray-900"}>
          <DialogHeader>
        <DialogTitle className={theme === 'dark' ? "text-foreground" : "text-gray-900"}>Confirm Logout</DialogTitle>
        <DialogDescription className={theme === 'dark' ? "text-muted-foreground" : "text-gray-500"}>
          Are you sure you want to log out?
        </DialogDescription>
          </DialogHeader>
          <DialogFooter>
        <Button
          variant="outline"
          onClick={() => setShowLogoutDialog(false)}
          className={theme === 'dark' ? "border-border text-foreground hover:bg-accent" : "border-gray-300 text-gray-700 hover:bg-gray-100"}
        >
          Cancel
        </Button>
        <Button
          onClick={confirmLogout}
          className={theme === 'dark' ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : "bg-red-600 hover:bg-red-700 text-white"}
        >
          Logout
        </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
 
export default Sidebar;