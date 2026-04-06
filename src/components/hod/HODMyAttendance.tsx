import React from "react";
import FacultyAttendance from "../faculty/FacultyAttendance";
import { useTheme } from "../../context/ThemeContext";

const HODMyAttendance: React.FC = () => {
  const { theme } = useTheme();
  return (
    <div className={`p-6 ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
      <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>My Attendance</h2>
      <FacultyAttendance />
    </div>
  );
};

export default HODMyAttendance;
