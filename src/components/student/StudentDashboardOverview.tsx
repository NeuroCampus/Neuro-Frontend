import {
    FaBookOpen,
    FaCheckCircle,
    FaClipboardList,
    FaBell,
    FaFileAlt,
    FaNetworkWired,
    FaTree,
    FaCogs,
    FaCalendarAlt,
    FaUsers,
    FaExclamationTriangle,
    FaBullhorn,
    FaLightbulb,
    FaBook,
    FaThumbtack,
    FaDownload,
  } from "react-icons/fa";
  import { useState } from "react";  
  import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

  interface StudentDashboardOverviewProps {
    user: any;
    setPage: (page: string) => void;
  }

  const todaySchedule = [
    {
      subject: "Math",
      time: "09:00 AM - 10:00 AM",
      room: "A101",
      teacher: "Mr. Smith",
    },
    {
      subject: "Physics",
      time: "10:15 AM - 11:15 AM",
      room: "B202",
      teacher: "Dr. Brown",
    },
    {
      subject: "English",
      time: "11:30 AM - 12:30 PM",
      room: "C303",
      teacher: "Ms. Johnson",
    },
  ];
  
const StudentDashboardOverview: React.FC<StudentDashboardOverviewProps> = ({ user, setPage }) => {

      // Mock leave request data for now
  const [leaveRequests, setLeaveRequests] = useState([
    { id: 1, period: "2025-09-10", status: "Pending" },
    { id: 2, period: "2025-09-07", status: "Approved" },
    { id: 3, period: "2025-09-02", status: "Rejected" },
  ]);

  const isLoading = false; // you can connect real loading state later

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 bg-[#1c1c1e] text-gray-200">
        {/* Top Row Cards */}
        <div className="bg-[#1c1c1e] text-gray-200 border rounded-md p-4 flex items-center gap-4 relative shadow-sm">
          <div className="absolute top-0 left-0 h-full w-1 bg-blue-600 rounded-l-md" />
          <div className="bg-blue-100 p-2 rounded-md text-blue-600">
            <FaBookOpen className="w-5 h-5" />
          </div>
          <div className="text-sm text-gray-200">
            <p className="text-gray-200">Today's Lectures</p>
            <p className="text-lg font-semibold">3</p>
            <p className="text-xs text-gray-300">Next: Database Systems at 11:30 AM</p>
          </div>
        </div>
  
        <div className="bg-[#1c1c1e] text-gray-200 border rounded-md p-4 flex items-center gap-4 relative shadow-sm">
          <div className="absolute top-0 left-0 h-full w-1 bg-yellow-500 rounded-l-md" />
          <div className="bg-yellow-100 p-2 rounded-md text-yellow-500">
            <FaCheckCircle className="w-5 h-5" />
          </div>
          <div className="text-sm text-gray-200">
            <p className="text-gray-200">Attendance Status</p>
            <p className="text-lg font-semibold">85%</p>
            <p className="text-xs text-gray-300">Warning: Low in Computer Networks (68%)</p>
          </div>
        </div>
  
        <div className="bg-[#1c1c1e] text-gray-200 border rounded-md p-4 flex items-center gap-4 relative shadow-sm">
          <div className="absolute top-0 left-0 h-full w-1 bg-red-500 rounded-l-md" />
          <div className="bg-red-100 p-2 rounded-md text-red-500">
            <FaClipboardList className="w-5 h-5" />
          </div>
          <div className="text-sm text-gray-200">
            <p className="text-gray-200">Pending Assignments</p>
            <p className="text-lg font-semibold">2</p>
            <p className="text-xs text-gray-300">Due Today: Algorithm Analysis</p>
          </div>
        </div>
  
        <div className="bg-[#1c1c1e] text-gray-200 border rounded-md p-4 flex items-center gap-4 relative shadow-sm">
          <div className="absolute top-0 left-0 h-full w-1 bg-yellow-400 rounded-l-md" />
          <div className="bg-yellow-100 p-2 rounded-md text-yellow-600">
            <FaBell className="w-5 h-5" />
          </div>
          <div className="text-sm text-gray-200">
            <p className="text-gray-200">Unread Announcements</p>
            <p className="text-lg font-semibold">3</p>
            <p className="text-xs text-gray-300">Latest: Mid-term exam schedule</p>
          </div>
        </div>
  
        {/* Middle Section */}
        {/* Today's Schedule - takes up 2 cols */}
        <Card className="bg-[#1c1c1e] text-gray-200 border border-gray-200 shadow-sm col-span-1 md:col-span-3">
          <CardHeader>
            <CardTitle className="text-base text-gray-200">Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {todaySchedule.map((item, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-md p-4 bg-[#1c1c1e] text-gray-200 shadow-sm space-y-2"
                >
                  <h4 className="font-medium text-gray-200">{item.subject}</h4>
                  <div className="text-sm text-gray-300">
                    <div>🕘 {item.time}</div>
                    <div>🏫 Room: {item.room}</div>
                    <div>👨‍🏫 {item.teacher}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
  
        {/* Performance Overview */}
        <div className="bg-[#1c1c1e] text-gray-200 p-4 border border-gary-200 rounded-lg shadow col-span-1">
          <h2 className="text-lg font-semibold text-gray-200 mb-2">Performance Overview</h2>
          <p className="text-sm text-gray-300">Correlation between attendance and marks</p>
          <div className="text-gray-400 text-sm mt-4">[Scatter Chart Placeholder]</div>
        </div>
  
        {/* Bottom Section */}
        <div className="col-span-1 md:col-span-2 xl:col-span-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
         {/* Leave Request Status (Student View - With Reason) */}
          <div className="bg-[#1c1c1e] p-6 rounded-lg shadow-sm text-sm text-gray-200 border border-gray-200 md:col-span-2 xl:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-200">Leave Request Status</h3>
              <button
                className="flex items-center gap-1 border border-gray-300 text-sm font-medium text-gray-200 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-md transition"
                onClick={() => setPage("leave-request")}
              >
                Apply for Leave
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto custom-scrollbar scroll-smooth">
              <table className="w-full">
                <thead className="sticky top-0 bg-[#1c1c1e] z-10">
                  <tr className="text-center border-b text-gray-200 text-xs">
                    <th className="pb-2">Period</th>
                    <th className="pb-2">Reason</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {(!leaveRequests || leaveRequests.length === 0) && !isLoading ? (
                    <tr>
                      <td colSpan={3} className="py-3 text-center text-gray-400">
                        No leave requests found
                      </td>
                    </tr>
                  ) : (
                    leaveRequests.slice(0, 10).map((row) => (
                      <tr
                        key={row.id}
                        className="border-b last:border-none text-sm hover:bg-gray-800 text-center"
                      >
                        {/* Period */}
                        <td className="py-3">{row.period}</td>

                        {/* Reason */}
                        <td className="py-3 text-gray-300">
                          {row.reason || "—"}
                        </td>

                        {/* Status */}
                        <td>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium align-middle ${
                              row.status === "Pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : row.status === "Approved"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {/* Notification Panel (kept as is) */}
          <div className="bg-[#1c1c1e] text-gray-200 border rounded-lg p-4 shadow-sm">
            {/* Header Row with Button */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-200">Notification Panel</h2>
              <button className="flex items-center gap-1 border border-gray-300 text-sm font-medium text-gray-200 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-md transition"
                onClick={() => setPage("announcements")} >
                View All
              </button>
            </div>

            {/* Notifications List */}
            <ul className="space-y-4">
              <li className="flex gap-3">
                <FaBullhorn className="text-purple-600 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-200">Mid-Term Examinations</p>
                  <p className="text-xs text-gray-300">
                    The mid-term exams will commence from April 20, 2025
                  </p>
                  <p className="text-xs text-gray-300 mt-1">2 hours ago</p>
                </div>
              </li>
              <li className="flex gap-3">
                <FaCalendarAlt className="text-blue-500 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-200">Tech Symposium 2025</p>
                  <p className="text-xs text-gray-300">
                    Register for the annual tech symposium by April 15
                  </p>
                  <p className="text-xs text-gray-300 mt-1">Yesterday</p>
                </div>
              </li>
              <li className="flex gap-3">
                <FaBook className="text-yellow-600 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-200">Updated Curriculum</p>
                  <p className="text-xs text-gray-300">
                    The curriculum for the next semester has been updated
                  </p>
                  <p className="text-xs text-gray-300 mt-1">2 days ago</p>
                </div>
              </li>
              <li className="flex gap-3">
                <FaThumbtack className="text-red-500 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-200">
                    Assignment Deadline Extended
                  </p>
                  <p className="text-xs text-gray-300">
                    Database assignment deadline extended to April 18
                  </p>
                  <p className="text-xs text-gray-300 mt-1">3 days ago</p>
                </div>
              </li>
            </ul>
          </div>

        </div>
      </div>
    );
  };
  
  export default StudentDashboardOverview;
  