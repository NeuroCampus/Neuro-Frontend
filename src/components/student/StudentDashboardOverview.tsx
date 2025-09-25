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
  FaClock,
} from "react-icons/fa";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // adjust path based on your project
import { Button } from "@/components/ui/button";
import { Bar } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import React, { useState, useEffect } from "react";


  interface StudentDashboardOverviewProps {
    user: any;
    setPage: (page: string) => void;
  }

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();


  // Sample schedule for today
  const todaySchedule = [
    {
      subject: "Database Systems",
      time: `${String(currentHour).padStart(2, "0")}:${String(currentMinutes - 1).padStart(2, "0")} - ${String(currentHour).padStart(2, "0")}:${String(currentMinutes + 5).padStart(2, "0")}`,
      room: "406",
      teacher: "Prof. ABC",
    },
    {
      subject: "Computer Networks",
      time: `${String(currentHour).padStart(2, "0")}:${String(currentMinutes + 10).padStart(2, "0")} - ${String(currentHour).padStart(2, "0")}:${String(currentMinutes + 50).padStart(2, "0")}`,
      room: "402",
      teacher: "Prof. XYZ",
    },
    {
      subject: "Operating Systems",
      time: `${String(currentHour).padStart(2, "0")}:${String(currentMinutes + 55).padStart(2, "0")} - ${String(currentHour + 1).padStart(2, "0")}:${String(currentMinutes + 95).padStart(2, "0")}`,
      room: "410",
      teacher: "Prof. DEF",
    },
  ];


  const chartData = {
    labels: ["Math", "Physics", "Chemistry", "Biology", "CS"], // Subjects
    datasets: [
      {
        label: "Marks",
        data: [75, 82, 68, 90, 85], // Replace with your dynamic data
        backgroundColor: "rgba(59, 130, 246, 0.7)", // Blue bars
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
        borderRadius: 6, // rounded bars
      },
    ],
  };

  const getCurrentLecture = (schedule: typeof todaySchedule) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return schedule.find((item) => {
      const [start, end] = item.time.split(" - ");
      const [startH, startM] = start.split(":").map(Number);
      const [endH, endM] = end.split(":").map(Number);

      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    });
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#9ca3af", // text-gray-400
        },
      },
      tooltip: {
        backgroundColor: "#1f1f21",
        titleColor: "#e5e7eb",
        bodyColor: "#d1d5db",
        borderColor: "#27272a",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: { color: "#9ca3af" },
        grid: { color: "rgba(255, 255, 255, 0.05)" },
      },
      y: {
        ticks: { color: "#9ca3af" },
        grid: { color: "rgba(255, 255, 255, 0.05)" },
      },
    },
  };

const StudentDashboardOverview: React.FC<StudentDashboardOverviewProps> = ({ user, setPage }) => {

      // Mock leave request data for now
  const [leaveRequests, setLeaveRequests] = useState([
    { id: 1, period: "2025-09-10", status: "Pending" },
    { id: 2, period: "2025-09-07", status: "Approved" },
    { id: 3, period: "2025-09-02", status: "Rejected" },
  ]);

  const isLoading = false; // you can connect real loading state later
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  // Assuming item.time is in "HH:mm - HH:mm" format (start - end)
  const getCurrentLecture = (schedule: typeof todaySchedule) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return schedule.find((item) => {
      const [start, end] = item.time.split(" - ");
      const [startH, startM] = start.split(":").map(Number);
      const [endH, endM] = end.split(":").map(Number);

      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    });
  };
  const [currentLecture, setCurrentLecture] = useState<typeof todaySchedule[0] | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      setCurrentLecture(getCurrentLecture(todaySchedule));
    }, 1000); // update every second
    return () => clearInterval(interval);
  }, []);

    return (
      <div className="space-y-6 bg-[#1c1c1e] text-gray-200">
        {/* --- Top Cards Row (Only 2 Cards) --- */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Today's Lectures Card */}
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

          {/* Attendance Status Card */}
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
        </section>

        {/* --- Today's Schedule --- */}
        <section className="w-full px-0 py-4">
          <Card className="bg-[#1c1c1e] text-gray-200 border border-gray-200 shadow-sm w-full max-w-full">
            {/* Card Header */}
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <CardTitle className="text-base text-gray-200">Current & Next Session</CardTitle>
                <div className="flex items-center gap-3 text-sm">
                  <FaClock className="w-5 h-5 " />
                  <span className="flex items-center gap-2 bg-gray-800 text-white px-3 py-1 rounded-full font-medium shadow-sm">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    Live: {currentTime.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </CardHeader>

            {/* Card Content */}
            <CardContent className="w-full flex flex-col sm:flex-row gap-6">
              {currentLecture ? (
                <>
                  {/* Current Lecture Card */}
                  <div className="border-2 border-blue-500 rounded-md p-6 w-full sm:w-1/2 bg-blue-900/20 shadow-md flex flex-col items-center sm:items-start gap-2">
                    <h4 className="font-semibold text-lg text-gray-200 mb-2">{currentLecture.subject}</h4>
                    <p className="text-sm text-gray-300">Teacher: {currentLecture.teacher}</p>
                    <p className="text-sm text-gray-300">Room: {currentLecture.room}</p>
                    <p className="text-xs text-blue-400 mt-1 font-medium">Currently Running</p>
                  </div>

                  {/* Next Lecture Card */}
                  {todaySchedule
                    .filter(
                      (cls) =>
                        cls.time.split(" - ")[0] > currentLecture.time.split(" - ")[1]
                    )
                    .slice(0, 1)
                    .map((nextClass, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-600 rounded-md p-6 w-full sm:w-1/2 bg-[#27272a] shadow-md flex flex-col items-center sm:items-start gap-2"
                      >
                        <h4 className="font-semibold text-lg text-gray-200 mb-2">
                          {nextClass.subject}
                        </h4>
                        <p className="text-sm text-gray-300">Teacher: {nextClass.teacher}</p>
                        <p className="text-sm text-gray-300">Room: {nextClass.room}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Starts at {nextClass.time.split(" - ")[0]}
                        </p>
                      </div>
                    ))}
                </>
              ) : (
                <p className="text-gray-400 text-center w-full">No class is currently running</p>
              )}
            </CardContent>
          </Card>
        </section>

        {/* --- Performance Overview --- */}
        <section>
          <div className="bg-[#1c1c1e] text-gray-200 p-4 border border-gray-200 rounded-lg shadow-lg">
            {/* Header */}
            <h2 className="text-lg font-semibold text-gray-200 mb-2">Performance Overview</h2>
            <p className="text-sm text-gray-300">Correlation between attendance and marks</p>

            {/* Chart */}
            <div className="flex items-center justify-center h-[300px] mt-4">
              <div className="w-full max-w-[600px] h-[250px]">
                <Bar
                  data={chartData}
                  options={{
                    ...chartOptions,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        labels: {
                          color: "#9ca3af", // text-gray-400
                        },
                      },
                      tooltip: {
                        backgroundColor: "#1f1f21", // dark tooltip
                        titleColor: "#e5e7eb",
                        bodyColor: "#d1d5db",
                        borderColor: "#27272a",
                        borderWidth: 1,
                      },
                    },
                    scales: {
                      x: {
                        ticks: { color: "#9ca3af" },
                        grid: {
                          color: "rgba(255, 255, 255, 0.05)",
                        },
                      },
                      y: {
                        ticks: { color: "#9ca3af" },
                        grid: {
                          color: "rgba(255, 255, 255, 0.05)",
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </section>


        {/* --- Bottom Section (Leave Requests & Notifications) --- */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
          
          {/* Leave Request Status */}
          <div className="bg-[#1c1c1e] border border-gray-200 rounded-lg shadow-sm p-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-200">Leave Request Status</h2>
              <button
                className="flex items-center gap-1 border border-gray-300 text-sm font-medium text-gray-200 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-md transition"
                onClick={() => setPage("leave-request")}
              >
                Apply for Leave
              </button>
            </div>

            <table className="w-full border border-gray-600 rounded-md overflow-hidden">
              <thead className="sticky top-0 bg-[#1c1c1e] z-10">
                <tr className="text-center border-b border-gray-600 text-gray-200 text-xs">
                  <th className="py-2">Period</th>
                  <th className="py-2">Reason</th>
                  <th className="py-2">Status</th>
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

                      {/* Always show View Reason button */}
                      <td className="py-3 text-gray-300">
                        <button
                          className="px-3 py-1 rounded-md bg-gray-800 text-gray-200 text-xs font-medium hover:bg-gray-700 transition"
                          onClick={() =>
                            setSelectedReason(row.reason || "No reason provided")
                          }
                        >
                          View Reason
                        </button>
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
          
          {/* Notification Panel */}
          <div className="bg-[#1c1c1e] text-gray-200 border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-200">Notification Panel</h2>
              <button
                className="flex items-center gap-1 border border-gray-500 text-sm font-medium text-gray-200 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-md transition"
                onClick={() => setPage("announcements")}
              >
                View All
              </button>
            </div>

            <ul className="space-y-4">
              <li className="flex gap-3">
                <FaBullhorn className="text-purple-600 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-200">Mid-Term Examinations</p>
                  <p className="text-xs text-gray-300">The mid-term exams will commence from April 20, 2025</p>
                  <p className="text-xs text-gray-300 mt-1">2 hours ago</p>
                </div>
              </li>
              <li className="flex gap-3">
                <FaCalendarAlt className="text-blue-500 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-200">Tech Symposium 2025</p>
                  <p className="text-xs text-gray-300">Register for the annual tech symposium by April 15</p>
                  <p className="text-xs text-gray-300 mt-1">Yesterday</p>
                </div>
              </li>
              <li className="flex gap-3">
                <FaBook className="text-yellow-600 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-200">Updated Curriculum</p>
                  <p className="text-xs text-gray-300">The curriculum for the next semester has been updated</p>
                  <p className="text-xs text-gray-300 mt-1">2 days ago</p>
                </div>
              </li>
              <li className="flex gap-3">
                <FaThumbtack className="text-red-500 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-200">Assignment Deadline Extended</p>
                  <p className="text-xs text-gray-300">Database assignment deadline extended to April 18</p>
                  <p className="text-xs text-gray-300 mt-1">3 days ago</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Reason Dialog */}
          <Dialog open={!!selectedReason} onOpenChange={() => setSelectedReason(null)}>
            <DialogContent className="bg-[#1c1c1e] text-gray-200 rounded-lg w-80 border border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold">Leave Reason</DialogTitle>
              </DialogHeader>
              <div className="text-sm text-gray-300 mt-2">{selectedReason}</div>
              <div className="flex justify-end pt-4">
                <Button className="text-gray-200 bg-gray-800 hover:bg-gray-700 border border-gray-600" onClick={() => setSelectedReason(null)}>Close</Button>
              </div>
            </DialogContent>
          </Dialog>
        </section>

      </div>

    );
  };
  
  export default StudentDashboardOverview;
  