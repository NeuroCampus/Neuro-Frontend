import { motion } from "framer-motion";
import { FiBell, FiMoon, FiSun } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

interface User {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  profile_picture?: string | null;
  profile_image?: string | null;
  branch?: string;
}

interface NavbarProps {
  role: "admin" | "hod" | "faculty" | "student" | "fees_manager" | "coe";
  user?: User;
  onNotificationClick?: () => void;
  setPage: (page: string) => void;
}

const roleLabels: Record<NavbarProps["role"], string> = {
  admin: "Principal Desk",
  hod: "Department Hub",
  faculty: "Faculty Space",
  student: "Student Space",
  fees_manager: "Finance Desk",
  coe: "Exam Control",
};

const roleDescriptions: Record<NavbarProps["role"], string> = {
  admin: "Principal",
  hod: "Head of Department",
  faculty: "Faculty Member",
  student: "Student",
  fees_manager: "Fees Manager",
  coe: "Controller of Examinations",
};

const Navbar = ({ role, user, onNotificationClick, setPage }: NavbarProps) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const displayName =
    user?.first_name && user?.last_name
      ? `${user.first_name.charAt(0).toUpperCase() + user.first_name.slice(1)} ${user.last_name.charAt(0).toUpperCase() + user.last_name.slice(1)}`
      : user?.first_name
        ? user.first_name.charAt(0).toUpperCase() + user.first_name.slice(1)
        : user?.username || "User";

  const subtitle =
    role === "hod" && user?.branch
      ? `${roleDescriptions[role]} - ${user.branch}`
      : role === "faculty" && user?.branch
        ? user.branch
        : roleDescriptions[role];

  const handleNotificationClick = () => {
    if (onNotificationClick) {
      onNotificationClick();
      return;
    }

    navigate("/dashboard/notifications");
  };

  const handleProfileClick = () => {
    if (role === "faculty") {
      setPage("faculty-profile");
      return;
    }

    if (role === "hod") {
      setPage("hod-profile");
      return;
    }

    setPage("profile");
  };

  const shellClasses = isDark
    ? "border border-white/10 bg-slate-950/90 shadow-[0_28px_65px_rgba(2,6,23,0.6)]"
    : "border border-white/70 bg-gradient-to-b from-[#eef5ff] via-[#e7f0ff] to-[#dbe7ff] shadow-[0_26px_60px_rgba(118,154,224,0.32)]";

  const panelClasses = isDark
    ? "border-white/10 bg-slate-900/95 text-slate-50 shadow-[0_20px_40px_rgba(2,6,23,0.45)]"
    : "border-[#eff4ff] bg-white/95 text-slate-900 shadow-[0_18px_40px_rgba(186,205,243,0.45)]";

  const iconButtonClasses = isDark
    ? "border-white/10 bg-slate-800 text-slate-200 hover:bg-slate-700"
    : "border-[#edf3ff] bg-white text-[#5b86cb] hover:bg-[#f4f8ff]";

  return (
    <motion.div
      className="w-full px-0 pt-3 rounded-[20px] box-border"
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`relative overflow-hidden rounded-[20px] p-1 ${shellClasses}`}>
        <div
          className={`pointer-events-none absolute -left-6 top-5 h-14 w-14 rounded-full blur-xl ${
            isDark ? "bg-blue-400/10" : "bg-blue-100/70"
          }`}
        />
        <div
          className={`pointer-events-none absolute -right-4 bottom-0 h-16 w-16 rounded-full blur-xl ${
            isDark ? "bg-sky-500/10" : "bg-[#dce8ff]"
          }`}
        />

        <motion.div
          className={`relative flex flex-col gap-2 rounded-[16px] border px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-4 ${panelClasses}`}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          <motion.div
            className="min-w-0"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
          >
            
            <h1 className={`mt-1 truncate text-base font-semibold tracking-tight md:text-[1.35rem] ${isDark ? "text-white" : "text-slate-900"}`}>
              Welcome, {displayName}
            </h1>
            
          </motion.div>

          <motion.div
            className="flex items-center justify-between gap-2 sm:justify-end"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
          >
            <div className={`hidden rounded-[12px] px-2 py-1 text-right md:block`}>
              <div className={`text-sm font-medium ${isDark ? "text-slate-100" : "text-slate-800"}`}>
                {new Date().toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </div>
              <div className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                type="button"
                onClick={handleNotificationClick}
                className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all ${iconButtonClasses}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Open notifications"
              >
                <FiBell size={18} />
              </motion.button>

              <motion.button
                type="button"
                onClick={toggleTheme}
                className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all ${iconButtonClasses}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Toggle theme"
              >
                {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
              </motion.button>
            </div>

            <motion.button
              type="button"
              onClick={handleProfileClick}
              className={`flex min-w-0 items-center gap-2 rounded-full border px-2 py-1 transition-all ${isDark ? "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]" : "border-[#edf3ff] bg-white hover:bg-[#f8fbff]"}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(135deg,#d8c9ff,#8b5cf6)] text-xs font-semibold text-white shadow-[0_10px_18px_rgba(139,92,246,0.22)]">
                {user?.profile_picture || user?.profile_image ? (
                  <img
                    src={user.profile_picture || user.profile_image || ""}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{user?.first_name?.[0] || role.charAt(0).toUpperCase()}</span>
                )}
              </div>

              <div className="hidden min-w-0 text-left sm:block">
                <div className={`truncate text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                  {displayName}
                </div>
                <div className={`truncate text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {roleDescriptions[role]}
                </div>
              </div>
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Navbar;
