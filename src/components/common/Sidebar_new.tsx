//sidebar.tsx
 
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  MessageSquare,
  GitBranch,
  UserCheck,
  ClipboardList,
  GraduationCap,
  BookOpen,
  Upload,
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
      dashboard: <LayoutDashboard size={20} />,
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
      proctors: <UserCheck size={20} />,
      chat: <MessageSquare size={20} />,
      "take-attendance": <BarChart2 size={20} />,
      "upload-marks": <Upload size={20} />,
      "apply-leave": <FileText size={20} />,
      "attendance-records": <BarChart2 size={20} />,
      announcements: <Bell size={20} />,
      "proctor-students": <UserCheck size={20} />,
      "student-leave": <FileText size={20} />,
      statistics: <BarChart2 size={20} />,
      "leave-request": <FileText size={20} />,
      "leave-status": <FileText size={20} />,
      certificates: <FileText size={20} />,
    };
    return iconMap[page] || <LayoutDashboard size={20} />;
  };
 
  const menuItems: { [key: string]: { name: string; page: string }[] } = {
    admin: [
      { name: "Dashboard", page: "dashboard" },
      { name: "Enroll User", page: "enroll-user" },
      { name: "Bulk Upload Faculty", page: "bulk-upload" },
      { name: "Branches", page: "branches" },
      { name: "Notifications", page: "notifications" },
      { name: "HOD Leaves", page: "hod-leaves" },
      { name: "Users", page: "users" },
      { name: "Profile", page: "profile" },
    ],
    hod: [
      { name: "Dashboard", page: "dashboard" },
      { name: "Low Attendance", page: "low-attendance" },
      { name: "Semester Management", page: "semesters" },
      { name: "Students", page: "students" },
      { name: "Subjects", page: "subjects" },
      { name: "Faculty Assignments", page: "faculty-assignments" },
      { name: "Timetable", page: "timetable" },
      { name: "Faculty Leaves", page: "leaves" },
      { name: "Apply Leaves", page: "apply-leaves" },
      // { name: "Attendance", page: "attendance" },
      
      { name: "Notifications", page: "notifications" },
      { name: "Study Material", page: "study-materials" },
      { name: "Proctors", page: "proctors" },
      { name: "Chat", page: "chat" },
      { name: "Profile", page: "hod-profile" },
    ],
    faculty: [
      { name: "Dashboard", page: "dashboard" },
      { name: "Take Attendance", page: "take-attendance" },
      { name: "Upload Marks", page: "upload-marks" },
      { name: "Apply Leave", page: "apply-leave" },
      { name: "Attendance Records", page: "attendance-records" },
      { name: "Announcements", page: "announcements" },
      { name: "Proctor Students", page: "proctor-students" },
      { name: "Manage Student Leave", page: "student-leave" },
      { name: "Timetable", page: "timetable" },
      { name: "Chat", page: "chat" },
      { name: "Profile", page: "faculty-profile" },
      { name: "Generate Statistics", page: "statistics" },
    ],
    student: [
      { name: "Dashboard", page: "dashboard" },
      { name: "Timetable", page: "timetable" },
      { name: "Attendance", page: "attendance" },
      { name: "Internal Marks", page: "marks" },
      { name: "Leave Request", page: "leave-request" },
      { name: "Leave Status", page: "leave-status" },
      { name: "Certificates", page: "certificates" },
      { name: "Profile", page: "profile" },
      { name: "Announcements", page: "announcements" },
      { name: "Chat", page: "chat" },
    ],
  };
 
  const sidebarContent = (
    <motion.div 
      className="h-full flex flex-col bg-[#1c1c1e] border-r border-gray-700"
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <motion.div 
        className="p-4 border-b border-gray-700"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="w-10 h-10 bg-gradient-to-r from-[#a259ff] to-[#7c3aed] rounded-lg flex items-center justify-center"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            <span className="text-white font-bold">N</span>
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-white font-bold text-lg">NEURO CAMPUS</h1>
                <p className="text-gray-400 text-xs capitalize">{role} Portal</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
 
      {/* Menu Items */}
      <motion.div 
        className="flex-1 overflow-y-auto py-4"
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
                    : "text-gray-300 hover:text-white hover:bg-gray-800/50"
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
        className="p-3 border-t border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <Button
          variant="ghost"
          className={`w-full justify-start gap-3 h-10 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 ${collapsed ? "px-2" : "px-3"}`}
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
          className={`fixed top-0 left-0 h-full bg-[#1c1c1e] z-40 w-64 shadow-2xl`}
          initial={{ x: "-100%" }}
          animate={{ x: collapsed ? "-100%" : "0%" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {sidebarContent}
        </motion.div>
        <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <DialogContent className="bg-[#1c1c1e] border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Confirm Logout</DialogTitle>
              <DialogDescription className="text-gray-400">Are you sure you want to log out?</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowLogoutDialog(false)} className="border-gray-700 text-gray-300 hover:bg-gray-800">
                Cancel
              </Button>
              <Button onClick={confirmLogout} className="bg-red-600 hover:bg-red-700 text-white">
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
      className={`fixed top-0 left-0 h-screen bg-[#1c1c1e] z-40 shadow-xl transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
      initial={{ x: -100 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {sidebarContent}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="bg-[#1c1c1e] border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Confirm Logout</DialogTitle>
            <DialogDescription className="text-gray-400">Are you sure you want to log out?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogoutDialog(false)} className="border-gray-700 text-gray-300 hover:bg-gray-800">
              Cancel
            </Button>
            <Button onClick={confirmLogout} className="bg-red-600 hover:bg-red-700 text-white">
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
 
export default Sidebar;
