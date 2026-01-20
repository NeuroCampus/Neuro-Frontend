import { useState, useEffect } from "react";
import {
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  UserPlus,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { getHODStats, manageLeaves, manageProfile, getHODDashboard, getHODDashboardBootstrap } from "../../utils/hod_api";
import { getFacultyAttendanceToday } from "../../utils/hod_api";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

interface LeaveRequest {
  id: string;
  name: string;
  dept: string;
  period: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
}

interface StatsData {
  faculty_count: number;
  student_count: number;
  pending_leaves: number;
  average_attendance: number;
  attendance_trend: Array<{
    week: string;
    start_date: string;
    end_date: string;
    attendance_percentage: number | string;
  }>;
  faculty_attendance_today?: {
    total_faculty: number;
    present: number;
    absent: number;
    not_marked: number;
  };
}

interface HODStatsProps {
  setError: (err: string | null) => void;
  setPage: (page: string) => void;
  onBootstrapData?: (data: {
    branch_id: string;
    semesters: Array<{ id: string; number: number }>;
    sections: Array<{ id: string; name: string; semester_id: string }>;
  }) => void;
}

interface DashboardLeave {
  id: number;
  faculty_name: string;
  department: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
}

export default function HODStats({ setError, setPage, onBootstrapData }: HODStatsProps) {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const navigate = useNavigate();
  const [branchId, setBranchId] = useState<string | null>(null);
  const [hodName, setHodName] = useState("HOD");
  const [branchName, setBranchName] = useState("your");
  const { theme } = useTheme();

  // Format date range to "MMM DD, YYYY to MMM DD, YYYY"
  const formatPeriod = (startDate: string, endDate: string): string => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const options: Intl.DateTimeFormatOptions = { month: "short", day: "2-digit", year: "numeric" };
      return `${start.toLocaleDateString("en-US", options)} to ${end.toLocaleDateString("en-US", options)}`;
    } catch {
      return "Invalid date";
    }
  };

  // Fetch combined dashboard bootstrap (profile + stats + leaves in one call)
  const fetchDashboardBootstrap = async () => {
    setIsLoading(true);
    try {
      const res = await getHODDashboardBootstrap(['profile', 'overview', 'attendance_trend', 'leaves']);
      if (res.success && res.data) {
        // Set profile data
        setBranchId(res.data.profile.branch_id);
        setHodName(res.data.profile.first_name || "HOD");
        setBranchName(res.data.profile.branch || "your");

        // Set stats data
        if (res.data.overview) {
          setStats({
            faculty_count: res.data.overview.faculty_count,
            student_count: res.data.overview.student_count,
            pending_leaves: res.data.overview.pending_leaves,
            average_attendance: 0,
            attendance_trend: res.data.attendance_trend || [],
          });
        }

        // Set leave requests
        if (Array.isArray(res.data.leaves)) {
          const requests = res.data.leaves.map((req: DashboardLeave) => ({
            id: req.id.toString(),
            name: req.faculty_name || "Unknown",
            dept: req.department || "Unknown",
            period: formatPeriod(req.start_date, req.end_date),
            reason: req.reason || "No reason provided",
            status: req.status === "APPROVED" ? "Approved" : req.status === "REJECTED" ? "Rejected" : "Pending",
          })) as LeaveRequest[];
          setLeaveRequests(requests);
        }

        // Fetch faculty attendance data
        try {
          const facultyAttendanceRes = await getFacultyAttendanceToday();
          if (facultyAttendanceRes.success && facultyAttendanceRes.summary) {
            setStats(prev => prev ? {
              ...prev,
              faculty_attendance_today: facultyAttendanceRes.summary
            } : null);
          }
        } catch (facultyError) {
          console.error("Failed to fetch faculty attendance:", facultyError);
        }

        // Pass bootstrap data to parent (only pass available data)
        if (onBootstrapData) {
          onBootstrapData({
            branch_id: res.data.profile.branch_id,
            semesters: res.data.semesters || [],
            sections: res.data.sections || [],
          });
        }
      } else {
        setErrors([res.message || "Failed to fetch dashboard data"]);
      }
    } catch (err) {
      setErrors(["Failed to fetch dashboard data"]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateDashboardPendingLeaves = (change: number) => {
    setStats((prev) => ({
      ...prev,
      pending_leaves: (prev.pending_leaves || 0) + change,
    }));
  };

  const updateLeaveStatus = (index: number, status: "Pending" | "Approved" | "Rejected") => {
    const updatedLeaves = [...leaveRequests];
    updatedLeaves[index] = { ...updatedLeaves[index], status };
    setLeaveRequests(updatedLeaves);
  };

  // Handle approve
  // Approve
const handleApprove = async (index: number) => {
  const leave = leaveRequests[index];

  updateLeaveStatus(index, "Approved"); // Optimistic UI

  try {
    const res = await manageLeaves(
      { action: "update", branch_id: branchId, leave_id: leave.id, status: "APPROVED" },
      "PATCH"
    );

    if (!res.success) {
      updateLeaveStatus(index, leave.status); // rollback
      setErrors([res.message || "Failed to approve leave"]);
      Swal.fire("Error!", "Failed to approve the leave request.", "error");
    } else {
      Swal.fire("Approved!", "The leave request has been approved.", "success");
      await fetchDashboardBootstrap(); // ✅ Refresh dashboard data
    }
  } catch (err) {
    updateLeaveStatus(index, leave.status); // rollback
    setErrors(["Failed to approve leave"]);
    Swal.fire("Error!", "Failed to approve the leave request.", "error");
  }
};

// Reject
  const handleReject = async (index: number) => {
    const leave = leaveRequests[index];

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You are about to reject this leave request.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, reject it!",
      cancelButtonText: "No, keep it",
      background: theme === 'dark' ? '#23232a' : '#fff',
      color: theme === 'dark' ? '#e5e7eb' : '#000',
    });

    if (!result.isConfirmed) return;

    updateLeaveStatus(index, "Rejected");

    try {
      const res = await manageLeaves(
        { action: "update", branch_id: branchId, leave_id: leave.id, status: "REJECTED" },
        "PATCH"
      );

      if (!res.success) {
        updateLeaveStatus(index, leave.status);
        setErrors([res.message || "Failed to reject leave"]);
        Swal.fire("Error!", "Failed to reject the leave request.", "error");
      } else {
      Swal.fire("Rejected!", "The leave request has been rejected.", "success");
      await fetchDashboardBootstrap(); // ✅ Refresh dashboard data
      }
    } catch (err) {
      updateLeaveStatus(index, leave.status);
      setErrors(["Failed to reject leave"]);
      Swal.fire("Error!", "Failed to reject the leave request.", "error");
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardBootstrap();
  }, []);

  // Transform attendance trend for chart
  const chartData = stats?.attendance_trend?.length
    ? stats.attendance_trend.map((item) => ({
        week: item.week,
        attendance: item.attendance_percentage === "NA" ? 0 : 
                   typeof item.attendance_percentage === "string" ? 0 : 
                   item.attendance_percentage,
      }))
    : [{ week: "No Data", attendance: 0 }];

  // Calculate pending leaves count from actual leave requests
  const pendingLeavesCount = leaveRequests.filter(request => request.status === "Pending").length;

  // Data for pie chart
  const memberData = [
    { name: "Faculty", value: stats?.faculty_count || 0, fill: "#2563eb" },
    { name: "Students", value: stats?.student_count || 0, fill: "#6b7280" },
    { name: "Members", value: stats ? stats.faculty_count + stats.student_count : 0, fill: "#9ca3af" },
  ];

  return (
    <div className={`p-8 space-y-6 font-sans min-h-screen ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
      {/* Loading and Errors */}
      {isLoading && <p className={`${theme === 'dark' ? 'bg-background text-muted-foreground' : 'bg-gray-50 text-gray-600'} mb-4 animate-pulse`}>Loading data...</p>}
      {errors.length > 0 && (
        <ul className={`text-sm ${theme === 'dark' ? 'text-destructive' : 'text-red-500'} mb-4 list-disc list-inside ${theme === 'dark' ? 'bg-destructive/10 border border-destructive/20' : 'bg-red-50'} p-4 rounded-lg`}>
          {errors.map((err, idx) => (
            <li key={idx}>{err}</li>
          ))}
        </ul>
      )}

      {/* Stats Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${theme === 'dark' ? 'bg-background' : 'bg-gray-50'}`}>
        {[
          {
            title: "Total Faculty",
            className: "text-gray-600",
            value: stats?.faculty_count.toString() || "0",
            icon: <Users className="text-gray-600" />,
            change: "+2.5% since last month",
            color: "text-gray-600",
          },
          {
            title: "Total Students",
            value: stats?.student_count.toString() || "0",
            icon: <Users className="text-gray-600" />,
            change: "+5.1% since last semester",
            color: "text-gray-600",
          },
          {
            title: "Faculty Present Today",
            value: stats?.faculty_attendance_today?.present.toString() || "0",
            icon: <CheckCircle className="text-green-600" />,
            change: `${stats?.faculty_attendance_today ? Math.round((stats.faculty_attendance_today.present / stats.faculty_attendance_today.total_faculty) * 100) : 0}% attendance`,
            color: "text-green-600",
            clickable: true,
            onClick: () => setPage("faculty-attendance"),
          },
        ].map((item, i) => (
            <div
              key={i}
              className={`p-4 rounded-lg shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow border ${theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'} text-gray-900 outline-none focus:ring-2 focus:ring-white ${item.clickable ? `cursor-pointer ${theme === 'dark' ? 'hover:bg-accent' : 'hover:bg-gray-50'}` : ''}`}
              onClick={item.onClick}
            >
              <div className={`flex items-center justify-center w-12 h-12 rounded-full ${theme === 'dark' ? 'bg-accent' : 'bg-gray-200'}`}>
              {item.icon && (
                // Make icon large and blue for visibility
                <span className="text-blue-600 text-3xl">{item.icon}</span>
              )}
              </div>
              <div>
              <p className={`text-sm font-medium ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>{item.title}</p>
              <p className={`text-xl font-bold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>{item.value}</p>
              <p className={`text-xs ${item.color}`}>{item.change}</p>
              </div>
            </div>
        ))}
      </div>

      {/* Charts: Attendance Trends and Member Distribution */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${theme === 'dark' ? 'bg-background' : 'bg-gray-50'}`}>
        {/* Attendance Chart */}
        <div className={`p-6 rounded-lg shadow-sm ${theme === 'dark' ? 'bg-card border border-border' : 'bg-white border border-gray-200'}`}>
          <div className="flex justify-between items-center mb-2">
            <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Attendance Trends</h3>
          </div>
          <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Weekly attendance percentage</p>
          <div className={`min-h-[250px] ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
            {chartData.length === 1 && chartData[0].week === "No Data" ? (
              <p className={`text-sm text-center italic ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-400'}`}>No attendance data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#3f3f46' : '#e5e7eb'} />
                  <XAxis dataKey="week" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} />
                  <YAxis domain={[0, 100]} stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: theme === 'dark' ? '#1c1c1e' : '#fff', borderRadius: "8px", border: theme === 'dark' ? '1px solid #3f3f46' : '1px solid #e5e7eb' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="attendance"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Attendance Percentage"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Member Distribution Pie Chart */}
        <div className={`p-6 rounded-lg shadow-sm ${theme === 'dark' ? 'bg-card border border-border' : 'bg-white border border-gray-200'}`}>
          <div className="flex justify-between items-center mb-2">
            <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Member Distribution</h3>
          </div>
          <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Faculty, Students, and Total Members</p>
          <div className="min-h-[250px] focus:outline-none">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={memberData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#1c1c1e' : '#fff',
                    borderRadius: "8px",
                    border: theme === 'dark' ? '1px solid #3f3f46' : '1px solid #e5e7eb',
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => (
                    <span className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Leave Requests */}
      <div className={`p-6 rounded-lg shadow-sm text-sm ${theme === 'dark' ? 'bg-card border border-border' : 'bg-white border border-gray-200'} ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Leave Requests</h3>
          <button
            className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-md transition bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white"
            onClick={() => setPage("leaves")}
          >
            View All
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto custom-scrollbar scroll-smooth"> 
          <table className="w-full">
            <thead className={`sticky top-0 z-10 ${theme === 'dark' ? 'bg-card' : 'bg-white'}`}>
              <tr className={`text-center border-b ${theme === 'dark' ? 'border-border text-foreground' : 'border-gray-200 text-gray-900'} text-xs`}>
                <th className="pb-2">Faculty</th>
                <th>Period</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {leaveRequests.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={5} className={`py-3 text-center ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
                    No leave requests found
                  </td>
                </tr>
              ) : (
                leaveRequests.slice(0, 20).map((row, index) => (   // limit to first 20 rows for example
                  <tr
                    key={row.id}
                    className={`border-b last:border-none text-sm hover:${theme === 'dark' ? 'bg-accent' : 'bg-gray-50'} text-center`}
                  >
                    <td className="py-3">
                      <div>
                        <p className={`font-medium ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>{row.name}</p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>{row.dept}</p>
                      </div>
                    </td>
                    <td>{row.period}</td>
                    <td>{row.reason}</td>
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
                    <td>
                      {row.status === "Pending" ? (
                        <div className="flex gap-2 align-middle text-center px-1 justify-center">
                          <button
                            onClick={() => handleApprove(index)}
                            className={`flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-md transition border ${theme === 'dark' ? 'border-green-500 text-green-400 bg-green-500/10 hover:bg-green-500/20' : 'border-green-500 text-green-700 bg-green-50 hover:bg-green-100'}`}
                            disabled={isLoading}
                          >
                            <CheckCircle className={`w-4 h-4 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(index)}
                            className={`flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-md transition border ${theme === 'dark' ? 'border-red-500 text-red-400 bg-red-500/10 hover:bg-red-500/20' : 'border-red-500 text-red-700 bg-red-50 hover:bg-red-100'}`}
                            disabled={isLoading}
                          >
                            <XCircle className={`w-4 h-4 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>No action needed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};