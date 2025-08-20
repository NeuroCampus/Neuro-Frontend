import { motion } from "framer-motion";
import { FiBell, FiMoon, FiMenu } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";


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
  role: "admin" | "hod" | "faculty" | "student";
  user?: User;
  token?: string; 
  onNotificationClick?: () => void;
  setPage: (page: string) => void;
}

interface NotificationBellProps {
  fetchCount: () => Promise<number>; // function to fetch count
  onClick?: () => void;
}

const Navbar = ({ role, user, onNotificationClick, setPage }: NavbarProps) => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0); // <-- add this
  useEffect(() => {
    const fetchUnreadCount = async () => {
      const savedToken = localStorage.getItem("accessToken");
      if (!savedToken) return;

      try {
        const res = await fetch("http://localhost:8000/api/notifications/unread-count/", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${savedToken}`,
          },
        });
        const data = await res.json();
        if (data.success) setUnreadCount(data.unread_count);
      } catch (err) {
        console.error("Error fetching unread count:", err);
      }
    };

    fetchUnreadCount(); // initial fetch
    const interval = setInterval(fetchUnreadCount, 15000); // poll every 15s

    return () => clearInterval(interval);
  }, []);


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
    } else {
      setPage("profile");
    }
  }
};
 

  return (
    <motion.div 
      className="fixed top-0 mr-60 w-[calc(100%-16rem)] z-50 bg-[#1c1c1e] border-b border-gray-700 flex items-center justify-between px-6 py-3 backdrop-blur-sm"
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
              className="text-white font-bold text-lg text-gray-400"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              Welcome,{" "}
              <span className="text-[#a259ff] font-medium">
                {user?.first_name
                  ? user.first_name.charAt(0).toUpperCase() + user.first_name.slice(1) + "!"
                  : user?.username || "User!"}
              </span>
            </motion.div>
            <p className="text-gray-400 text-xs">Academic Management System</p>
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
          className="text-right text-sm text-gray-300 hidden md:block"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          {new Date().toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
          <div className="text-xs text-gray-400">
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </motion.div>

        {/* Theme toggle */}
        <motion.button
          className="text-gray-300 hover:text-[#a259ff] transition-colors duration-200 p-2 rounded-lg hover:bg-gray-800/50"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiMoon size={20} />
        </motion.button>

        {/* Notification bell */}
        <motion.div 
          className="relative cursor-pointer p-2 rounded-lg hover:bg-gray-800/50 transition-colors duration-200" 
          onClick={handleNotificationClick}   // ✅ FIXED
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiBell size={20} className="text-gray-300 hover:text-[#a259ff] transition-colors duration-200" />
          
          {unreadCount > 0 && (
            <motion.span className="absolute -top-1 -right-1 text-xs bg-[#a259ff] text-white px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </motion.span>
          )}
        </motion.div>

        {/* Profile section */}
        <motion.div 
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800/30 transition-colors duration-200 cursor-pointer"
          onClick={handleProfileClick}  
          whileHover={{ scale: 1.02 }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <motion.div 
            className="w-10 h-10 rounded-full bg-gradient-to-r from-[#a259ff] to-[#7c3aed] flex items-center justify-center font-semibold text-sm text-white shadow-lg"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            {user?.first_name?.[0] || role?.[0]?.toUpperCase()}
          </motion.div>

          <div className="text-sm hidden sm:block">
            <div className="font-medium text-white">
              {user?.first_name || (role ? role.charAt(0).toUpperCase() + role.slice(1) : "User")}
            </div>
            <div className="text-xs text-gray-400">
              {role === "admin"
                ? "Principal"
                : role === "hod"
                ? "Head of Department"
                : role === "faculty"
                ? "Faculty Member"
                : "Student"}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Navbar;