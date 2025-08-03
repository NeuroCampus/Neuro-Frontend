//sidebar.tsx
 
import { useState } from "react";
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
    setShowLogoutDialog(false);
    if (logout) {
      logout();
    }
  };
 
  const iconMap: Record<string, JSX.Element> = {
    dashboard: <LayoutDashboard size={20} />,
    "enroll-user": <User size={20} />,
    "bulk-upload": <FileText size={20} />,
    branches: <Users size={20} />,
    notifications: <Bell size={20} />,
    "hod-leaves": <FileText size={20} />,
    users: <User size={20} />,
    "low-attendance": <BarChart2 size={20} />,
    semesters: <Calendar size={20} />,
    sections: <Calendar size={20} />,
    students: <Users size={20} />,
    subjects: <FileText size={20} />,
    "faculty-assignments": <Users size={20} />,
    timetable: <Calendar size={20} />,
    leaves: <FileText size={20} />,
    attendance: <BarChart2 size={20} />,
    marks: <BarChart2 size={20} />,
    announcements: <Bell size={20} />,
    proctors: <Users size={20} />,
    chat: <MessageSquare size={20} />,
    "hod-profile": <Settings size={20} />,
    "take-attendance": <BarChart2 size={20} />,
    "upload-marks": <FileText size={20} />,
    "apply-leave": <FileText size={20} />,
    "attendance-records": <BarChart2 size={20} />,
    "proctor-students": <Users size={20} />,
    "student-leave": <FileText size={20} />,
    "schedule-mentoring": <Calendar size={20} />,
    statistics: <BarChart2 size={20} />,
    "weekly-schedule": <Calendar size={20} />,
    "leave-request": <FileText size={20} />,
    "leave-status": <FileText size={20} />,
    certificates: <FileText size={20} />,
    "face-recognition": <User size={20} />,
    "student-study-material": <FileText size={20} />,
    "student-assignment": <FileText size={20} />,
  };
 
  const links = {
    admin: [
      { name: "Dashboard", page: "dashboard" },
      { name: "Enroll User", page: "enroll-user" },
      { name: "Bulk Upload", page: "bulk-upload" },
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
      { name: "Attendance", page: "attendance" },
      { name: "Marks", page: "marks" },
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
      { name: "Notifications", page: "notifications" },
      { name: "Face Recognition", page: "face-recognition" },
      { name: "Study Material", page: "student-study-material" },
      { name: "Student Assignments", page: "student-assignment" },
    ],
  }[role] || [];
 
  const sidebarContent = (
    <div className="flex flex-col h-full p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-xl font-bold text-white ${collapsed ? "hidden" : "block"}`}>
          {role === "admin" ? "AdminHub" : role === "hod" ? "HOD Portal" : role === "faculty" ? "Faculty Portal" : "Student Portal"}
        </h2>
      </div>
 
      <div className="flex-1 space-y-1 overflow-y-auto scrollbar-hide">
        {links.map((link) => (
          <div
            key={link.page}
            onClick={() => handlePageChange(link.page)}
            className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-all ${
              activePage === link.page ? "bg-blue-600 text-white" : "hover:bg-gray-700 text-white"
            } ${collapsed && !isMobile ? "justify-center" : ""}`}
          >
            {iconMap[link.page] || <LayoutDashboard size={20} />}
            <span className={`text-sm ${collapsed && !isMobile ? "hidden" : "block"}`}>{link.name}</span>
          </div>
        ))}
      </div>
 
      {logout && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <Button
            variant="ghost"
            className={`w-full flex ${collapsed && !isMobile ? "justify-center" : "justify-start"} gap-2 text-white hover:bg-red-600`}
            onClick={handleLogoutClick}
          >
            <LogOut size={20} />
            <span className={`${collapsed && !isMobile ? "hidden" : "block"}`}>Logout</span>
          </Button>
        </div>
      )}
    </div>
  );
 
  if (isMobile) {
    return (
      <>
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity ${
            collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          onClick={toggleCollapse}
        />
        <Card
          className={`fixed top-0 left-0 h-full bg-gray-800 text-white z-40 transition-transform duration-300 ${
            collapsed ? "-translate-x-full" : "translate-x-0"
          } w-64`}
        >
          {sidebarContent}
        </Card>
        <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Logout</DialogTitle>
              <DialogDescription>Are you sure you want to log out?</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowLogoutDialog(false)}>
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
    <div
      className={`fixed top-0 left-0 h-screen bg-gray-800 text-white z-40 shadow-lg transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {sidebarContent}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>Are you sure you want to log out?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogoutDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmLogout} className="bg-red-600 hover:bg-red-700 text-white">
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
 
export default Sidebar;