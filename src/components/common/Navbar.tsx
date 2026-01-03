import { motion } from "framer-motion";
import { FiBell, FiMoon, FiSun, FiMenu } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTheme } from "../../context/ThemeContext";

interface User {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  profile_picture?: string | null;
  branch?: string;
}

interface NavbarProps {
  role: "admin" | "hod" | "faculty" | "student" | "fees_manager" | "coe";
  user?: User;
  onNotificationClick?: () => void;
  setPage: (page: string) => void;
}

interface NotificationBellProps {
  fetchCount: () => Promise<number>; // function to fetch count
  onClick?: () => void;
}

const Navbar = ({ role, user, onNotificationClick, setPage }: NavbarProps) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleNotificationClick = () => {
    if (onNotificationClick) {
      onNotificationClick();
    } else {
      navigate("/dashboard/notifications");
    }
  };

const handleProfileClick = () => {
  if (setPage) {
    if (role === "faculty") {
      setPage("faculty-profile");
    } else if (role === "hod") {
      setPage("hod-profile");
    } else if (role === "admin") {
      setPage("profile");
    } else if (role === "fees_manager") {
      // For fees manager, we can use the same profile page as admin for now
      setPage("profile");
    } else {
      setPage("profile");
    }
  }
};
 

  return (
    <motion.div 
      className={`fixed top-0 left-64 right-0 z-50 flex items-center justify-between px-6 py-3 backdrop-blur-sm ${
        theme === 'dark' 
          ? 'bg-background border-b border-border' 
          : 'bg-white border-b border-gray-200'
      }`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Left section: Brand */}
      <motion.div 
        className="flex items-center gap-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="flex items-center gap-3">
          <div>
            <motion.div 
              className={`font-bold text-lg ${
                theme === 'dark' ? 'text-foreground' : 'text-gray-900'
              }`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              Welcome,{" "}
              <span className={theme === 'dark' ? 'text-primary font-medium' : 'text-blue-600 font-medium'}>
                {user?.first_name
                  ? user.first_name.charAt(0).toUpperCase() + user.first_name.slice(1) + "!"
                  : user?.username || "User!"}
              </span>
            </motion.div>
            <p className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
              {role === "admin"
                ? "Principal"
                : role === "hod"
                ? `Head of Department${user?.branch ? ` - ${user.branch}` : ""}`
                : role === "faculty"
                ? `${user?.branch || "Faculty Member"}`
                : role === "coe"
                ? "Controller of Examinations"
                : role === "fees_manager"
                ? "Fees Manager"
                : "Student"}
            </p>
          </div>


        </div>
      </motion.div>

      {/* Right section */}
      <motion.div 
        className="flex items-center gap-5"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {/* Date & Time */}
        <motion.div 
          className={`text-right text-sm hidden md:block ${
            theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          {new Date().toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
          <div className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-400'}`}>
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </motion.div>

        {/* Theme toggle */}
        <motion.button
          className={`transition-colors duration-200 p-2 rounded-lg ${
            theme === 'dark'
              ? 'text-foreground hover:text-primary hover:bg-accent'
              : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
        </motion.button>

        {/* Profile section */}
        <motion.div 
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 cursor-pointer ${
            theme === 'dark'
              ? 'hover:bg-accent'
              : 'hover:bg-gray-100'
          }`}
          onClick={handleProfileClick}  
          whileHover={{ scale: 1.02 }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <motion.div 
            className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm shadow-lg overflow-hidden"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            {user?.profile_picture || user?.profile_image ? (
              <img
                src={user.profile_picture || user.profile_image}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to initial if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<div class="w-full h-full bg-[#a259ff] text-white flex items-center justify-center font-semibold text-sm">
                      ${user?.first_name?.[0] || role?.[0]?.toUpperCase()}
                    </div>`;
                  }
                }}
              />
            ) : (
              <div className="w-full h-full bg-[#a259ff] text-white flex items-center justify-center font-semibold text-sm">
                {user?.first_name?.[0] || role?.[0]?.toUpperCase()}
              </div>
            )}
          </motion.div>

          <div className="text-sm hidden sm:block">
            <div className={`font-medium ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
              {user?.first_name || (role ? role.charAt(0).toUpperCase() + role.slice(1) : "User")}
            </div>
            <div className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
              {role === "admin"
                ? "Principal"
                : role === "hod"
                ? "Head of Department"
                : role === "faculty"
                ? "Faculty Member"
                : role === "fees_manager"
                ? "Fees Manager"
                : "Student"}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Navbar;