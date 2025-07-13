import { FiBell, FiMoon, FiMenu } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

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
  toggleSidebar: () => void;
  isSidebarCollapsed: boolean;
}

const Navbar = ({ role, user, toggleSidebar, isSidebarCollapsed }: NavbarProps) => {
  const navigate = useNavigate();

  const handleNotificationClick = () => {
    navigate("/dashboard/notifications");
  };

  return (
    <div className="bg-white shadow-md flex items-center justify-between px-6 py-4 border-b w-full">
      {/* Left section: Sidebar toggle */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="text-gray-600 hover:text-gray-800 focus:outline-none"
        >
          <FiMenu size={24} />
        </button>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-5">
        {/* Date & Time */}
        <div className="text-right text-sm text-gray-600">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
          <div className="text-xs">
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>

        {/* Theme toggle */}
        <span className="text-xl cursor-pointer hover:text-gray-500">
          <FiMoon />
        </span>

        {/* Notification bell */}
        <div className="relative cursor-pointer" onClick={handleNotificationClick}>
          <FiBell size={24} className="text-xl" />
          <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">2</span>
        </div>

        {/* Profile section */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center font-semibold text-sm uppercase">
            {user?.first_name?.[0] || role[0]}
          </div>
          <div className="text-sm">
            <div className="font-medium">{user?.first_name || role.toUpperCase()}</div>
            <div className="text-xs">
              {role === "admin"
                ? "Principal"
                : role === "hod"
                ? `Head of Department, ${user?.branch || "Computer Science"}`
                : role === "faculty"
                ? `Faculty, ${user?.branch || "Computer Science"}`
                : `Student, ${user?.branch || "Computer Science"}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;