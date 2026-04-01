import { useState, type ReactNode } from "react";
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
  LogOut,
  GitBranch,
  UserCheck,
  ClipboardList,
  GraduationCap,
  BookOpen,
  Upload,
  CreditCard,
  Receipt,
  Search,
  Mic,
  PanelLeftClose,
  PanelLeftOpen,
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

const roleLabels: Record<string, string> = {
  admin: "Principal Desk",
  hod: "Department Hub",
  faculty: "Faculty Space",
  student: "Student Space",
  fees_manager: "Finance Desk",
  coe: "Exam Control",
};

const Sidebar = ({ role, setPage, activePage, logout, collapsed, toggleCollapse }: SidebarProps) => {
  const isMobile = useIsMobile();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  // On desktop/laptop we always keep the sidebar expanded.
  const effectiveCollapsed = isMobile ? collapsed : false;
  const roleLabel = roleLabels[role] ?? `${role} Portal`;

  const handlePageChange = (page: string) => {
    setPage(page);
    if (isMobile) {
      toggleCollapse();
    }
  };

  const confirmLogout = () => {
    if (logout) {
      logout();
    }
    setShowLogoutDialog(false);
  };

  const getIcon = (page: string): ReactNode => {
    const iconMap: Record<string, ReactNode> = {
      "exam-applications": <ClipboardList size={18} />,
      dashboard: <LayoutDashboard size={18} />,
      overview: <LayoutDashboard size={18} />,
      components: <ClipboardList size={18} />,
      templates: <FileText size={18} />,
      assignments: <UserCheck size={18} />,
      "individual-fees": <UserCheck size={18} />,
      "bulk-assignment": <Users size={18} />,
      invoices: <Receipt size={18} />,
      payments: <CreditCard size={18} />,
      "promotion-management": <UserCheck size={18} />,
      "enroll-user": <User size={18} />,
      "bulk-upload": <Upload size={18} />,
      branches: <GitBranch size={18} />,
      "teacher-assignments": <UserCheck size={18} />,
      notifications: <Bell size={18} />,
      "hod-leaves": <UserCheck size={18} />,
      users: <Users size={18} />,
      profile: <User size={18} />,
      "admin-profile": <User size={18} />,
      "hod-profile": <User size={18} />,
      "faculty-profile": <User size={18} />,
      "low-attendance": <BarChart2 size={18} />,
      semesters: <Calendar size={18} />,
      students: <GraduationCap size={18} />,
      subjects: <BookOpen size={18} />,
      "faculty-assignments": <ClipboardList size={18} />,
      timetable: <Calendar size={18} />,
      leaves: <FileText size={18} />,
      "apply-leaves": <FileText size={18} />,
      attendance: <BarChart2 size={18} />,
      marks: <BarChart2 size={18} />,
      "study-materials": <BookOpen size={18} />,
      "scan-student-info": <Search size={18} />,
      proctors: <UserCheck size={18} />,
      "take-attendance": <BarChart2 size={18} />,
      "upload-marks": <Upload size={18} />,
      "co-attainment": <BarChart2 size={18} />,
      "apply-leave": <FileText size={18} />,
      "attendance-records": <BarChart2 size={18} />,
      "faculty-attendance": <UserCheck size={18} />,
      announcements: <Bell size={18} />,
      revaluation: <ClipboardList size={18} />,
      makeupexam: <FileText size={18} />,
      "proctor-students": <UserCheck size={18} />,
      "student-leave": <FileText size={18} />,
      statistics: <BarChart2 size={18} />,
      "leave-request": <FileText size={18} />,
      "leave-status": <FileText size={18} />,
      certificates: <FileText size={18} />,
      fees: <CreditCard size={18} />,
      "exam-schedule": <Calendar size={18} />,
      reports: <BarChart2 size={18} />,
      "study-mode": <BookOpen size={18} />,
      "ai-interview": <Mic size={18} />,
    };

    return iconMap[page] || <LayoutDashboard size={18} />;
  };

  const menuItems: { [key: string]: { name: string; page: string }[] } = {
  fees_manager: [
    { name: "Dashboard", page: "dashboard" },
    { name: "Components", page: "components" },
    { name: "Templates", page: "templates" },
    { name: "Assignments", page: "assignments" },
    { name: "Individual Fees", page: "individual-fees" },
    { name: "Bulk Assignment", page: "bulk-assignment" },
    { name: "Invoices", page: "invoices" },
    { name: "Payments", page: "payments" },
    { name: "Reports", page: "reports" },
  ],
  admin: [
    // Main
    { name: "Dashboard", page: "dashboard" },
    
    // User Management
    { name: "Enroll Staff", page: "enroll-user" },
    { name: "Bulk Upload Faculty", page: "bulk-upload" },
    
    // Academic Structure
    { name: "Branches", page: "branches" },
    { name: "Faculty Assignments", page: "teacher-assignments" },
    { name: "Batches", page: "batches" },
    
    // Leaves
    { name: "HOD Leaves", page: "hod-leaves" },
    
    // User & Profile
    { name: "Users", page: "users" },
    { name: "Profile", page: "profile" },
  ],

  hod: [
    // Main
    { name: "Dashboard", page: "dashboard" },
    
    // Academic Management
    { name: "Semester Management", page: "semesters" },
    { name: "Students Enrollment", page: "students" },
    { name: "Elective Course Enrollment", page: "student-enrollment" },
    { name: "Courses", page: "subjects" },
    { name: "Faculty Assignments", page: "faculty-assignments" },
    { name: "Timetable", page: "timetable" },
    { name: "Proctors", page: "proctors" },
    
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
    { name: "Revaluation", page: "revaluation" },
    { name: "Makeup Exam", page: "makeupexam" },
    { name: "Proctor Students", page: "proctor-students" },
    { name: "Scan for Student Info", page: "scan-student-info" },
    
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
    { name: "Revaluation", page: "revaluation" },
    { name: "Makeup Exam", page: "makeupexam" },
    { name: "Fees", page: "fees" },

    // Interview
    { name: "AI Interview", page: "ai-interview" },
    
    // Leave Management
    { name: "Leaves", page: "leave" },
    
    // Profile
    { name: "Profile", page: "profile" },
  ],

  coe: [
    // Main
    { name: "Dashboard", page: "dashboard" },

    // Exam Management
    { name: "Student Status", page: "student-status" },
    { name: "Course Statistics", page: "course-statistics" },
    { name: "Publish Results", page: "publish-results" },

    // Profile
    { name: "Profile", page: "profile" },
  ],
};

  const shellClasses = isDark
    ? "border border-white/10 bg-slate-950/90 shadow-[0_28px_65px_rgba(2,6,23,0.6)]"
    : "border border-white/70 bg-gradient-to-b from-[#f3e8ff] via-[#e9ddff] to-[#e3d3ff] shadow-[0_26px_60px_rgba(139,92,246,0.32)]";

  const panelClasses = isDark
    ? "border-white/10 bg-slate-900/95 text-slate-50 shadow-[0_20px_40px_rgba(2,6,23,0.45)]"
    : "border-[#eff4ff] bg-white/95 text-slate-900 shadow-[0_18px_40px_rgba(186,205,243,0.45)]";

  const itemBaseClasses = effectiveCollapsed
    ? "h-12 w-full justify-center rounded-2xl px-0"
    : "h-12 w-full justify-start rounded-2xl px-3";

  const itemIdleClasses = isDark
    ? "text-slate-300 hover:bg-white/5 hover:text-white"
    : "text-slate-800 hover:bg-[#f4f8ff] hover:text-slate-900";

  const itemActiveClasses = isDark
    ? "bg-[linear-gradient(135deg,#8b5cf6,#7c3aed)] text-white shadow-[0_16px_28px_rgba(124,58,237,0.32)]"
    : "bg-[linear-gradient(135deg,#d8c9ff,#8b5cf6)] text-white shadow-[0_18px_30px_rgba(124,58,237,0.28)]";

  const iconIdleClasses = isDark
    ? "bg-white/6 text-slate-200"
    : "bg-[#f9f6ff] text-slate-700";

  const sidebarContent = (
    <motion.div
      className={`h-full ${isMobile ? "w-[18rem] max-w-[86vw]" : "w-full"} p-2.5`}
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`relative h-full overflow-hidden rounded-[34px] p-2 ${shellClasses}`}>
        <div
          className={`pointer-events-none absolute -left-6 top-6 h-12 w-12 rounded-full blur-xl ${
            isDark ? "bg-blue-400/10" : "bg-blue-100/60"
          }`}
        />
        <div
          className={`pointer-events-none absolute -bottom-6 right-2 h-16 w-16 rounded-full blur-xl ${
            isDark ? "bg-purple-500/06" : "bg-[#f3e8ff]"
          }`}
        />

        <Card className={`relative flex h-full flex-col overflow-hidden rounded-[34px] ${panelClasses}`}>
          <div
            className={`pointer-events-none absolute inset-x-6 top-0 h-16 rounded-b-xl blur-xl ${
              isDark ? "bg-purple-500/6" : "bg-purple-50/80"
            }`}
          />

          <motion.div
            className={`relative ${effectiveCollapsed ? "px-2 pb-4 pt-5" : "px-4 pb-5 pt-5"}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className={`flex ${effectiveCollapsed ? "flex-col items-center gap-3" : "items-start gap-3"}`}>
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border ${
                  isDark
                    ? "border-white/8 bg-slate-800 shadow-sm"
                    : "border-gray-100 bg-white shadow-sm"
                }`}
              >
                <img
                  src="/logo.jpeg"
                  alt="Logo"
                  className="h-full w-full object-contain p-2"
                  style={{ filter: isDark ? "brightness(0) invert(1)" : "none" }}
                />
              </div>

              <AnimatePresence initial={false}>
                {!effectiveCollapsed && (
                  <motion.div
                    className="min-w-0 flex-1 pt-1"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className={`text-[0.68rem] font-semibold truncate uppercase tracking-[0.24em] ${isDark ? "text-slate-400" : "text-[black]"}`}>
                      Neuro Campus
                    </p>
                  
                    <span
                      className={`mt-2 inline-flex rounded-full px-3 py-1 text-[0.7rem] font-semibold ${
                        isDark ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {roleLabel}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {isMobile && (
              <button
                type="button"
                onClick={toggleCollapse}
                className={`absolute ${collapsed ? "left-1/2 top-[4.85rem] -translate-x-1/2" : "right-4 top-5"} flex h-9 w-9 items-center justify-center rounded-full border transition-all ${
                  isDark
                    ? "border-white/10 bg-slate-800 text-slate-200 hover:bg-slate-700"
                    : "border-[#f0e9ff] bg-white text-slate-700 hover:bg-[#f9f6ff]"
                }`}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
              </button>
            )}
          </motion.div>

          <motion.div
            className="flex-1 overflow-y-auto px-2 pb-2 ultra-scrollbar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            {!collapsed && (
                  <p className={`px-3 pb-3 text-[0.68rem] font-semibold uppercase tracking-[0.24em] ${isDark ? "text-slate-500" : "text-slate-700"}`}>
                Navigation
              </p>
            )}

            <div className="space-y-2">
              {menuItems[role]?.map((item, index) => {
                const isActive = activePage === item.page;

                return (
                  <motion.div
                    key={item.page}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.28, delay: 0.04 * index }}
                  >
                    <Button
                      variant="ghost"
                      className={`${itemBaseClasses} transition-all duration-200 ${isActive ? itemActiveClasses : itemIdleClasses}`}
                      onClick={() => handlePageChange(item.page)}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all ${
                          isActive ? "bg-white/20 text-white" : iconIdleClasses
                        }`}
                      >
                        {getIcon(item.page)}
                      </span>

                      <AnimatePresence initial={false}>
                        {!collapsed && (
                          <motion.span
                            className="truncate text-[0.95rem] font-medium"
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
                );
              })}
            </div>
          </motion.div>

          <motion.div
            className="relative px-2 pb-2 pt-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className={`rounded-[24px] border p-2 ${isDark ? "border-white/10 bg-white/[0.03]" : "border-[#edf3ff] bg-[#f8fbff]"}`}>
              <Button
                variant="ghost"
                className={`w-full rounded-full ${effectiveCollapsed ? "h-12 justify-center px-0" : "h-11 justify-center gap-2"} ${
                  isDark
                    ? "bg-[linear-gradient(135deg,#8b5cf6,#7c3aed)] text-white hover:bg-[linear-gradient(135deg,#8b5cf6,#7c3aed)]"
                      : "bg-[linear-gradient(135deg,#d8c9ff,#8b5cf6)] text-white hover:bg-[linear-gradient(135deg,#d8c9ff,#8b5cf6)]"
                    } shadow-[0_16px_28px_rgba(124,58,237,0.25)]`}
                onClick={() => setShowLogoutDialog(true)}
              >
                <LogOut size={18} />
                <AnimatePresence initial={false}>
                  {!effectiveCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      Sign Out
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          </motion.div>
        </Card>
      </div>
    </motion.div>
  );

  const logoutDialog = (
    <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
      <DialogContent className={isDark ? "bg-background border-border text-foreground" : "bg-white border-gray-200 text-gray-900"}>
        <DialogHeader>
          <DialogTitle className={isDark ? "text-foreground" : "text-gray-900"}>Confirm Logout</DialogTitle>
          <DialogDescription className={isDark ? "text-muted-foreground" : "text-gray-500"}>
            Are you sure you want to log out?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setShowLogoutDialog(false)}
            className={isDark ? "border-border text-foreground hover:bg-accent" : "border-gray-300 text-gray-700 hover:bg-gray-100"}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmLogout}
            className={isDark ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : "bg-red-600 hover:bg-red-700 text-white"}
          >
            Logout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (isMobile) {
    return (
      <>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              className="fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={toggleCollapse}
            />
          )}
        </AnimatePresence>
        <motion.div
          className="fixed left-0 top-0 z-40 h-full"
          initial={{ x: "-100%" }}
          animate={{ x: collapsed ? "-100%" : "0%" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {sidebarContent}
        </motion.div>
        {logoutDialog}
      </>
    );
  }

  return (
    <>
      <motion.div
        className={`fixed left-0 top-0 z-40 h-screen transition-all duration-300 ${effectiveCollapsed ? "w-16" : "w-72"}`}
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {sidebarContent}
      </motion.div>
      {logoutDialog}
    </>
  );
};
 
export default Sidebar;
