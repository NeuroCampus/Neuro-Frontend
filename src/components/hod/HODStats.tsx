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
import {
  getHODStats,
  manageLeaves,
  manageProfile,
} from "../../utils/hod_api";

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
}
interface HODStatsProps {
  setError: (err: string | null) => void;
  setPage: (page: string) => void;
}

export default function HODStats({ setError, setPage }: HODStatsProps) {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [hodName, setHodName] = useState("HOD");
  const [branchName, setBranchName] = useState("your");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [branchId, setBranchId] = useState("");
  const navigate = useNavigate();

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

  // Fetch branch_id, HOD name, and branch name from manageProfile
  const fetchBranchId = async () => {
    try {
      const profileRes = await manageProfile({}, "GET");
      if (profileRes.success && profileRes.data?.branch_id) {
        setBranchId(profileRes.data.branch_id);
        setHodName(profileRes.data.first_name || "HOD");
        setBranchName(profileRes.data.branch || "your");
      } else {
        setErrors(["Failed to fetch branch ID: No branch assigned"]);
      }
    } catch (err) {
      setErrors(["Failed to connect to backend for branch ID"]);
    }
  };

  // Fetch dashboard stats
  const fetchStats = async () => {
    if (!branchId) return;
    try {
      const statsRes = await getHODStats(branchId);
      console.log("Stats data:", statsRes.data); // Debug stats
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      } else {
        setErrors((prev) => [...prev, statsRes.message || "Failed to fetch stats"]);
      }
    } catch (err) {
      setErrors((prev) => [...prev, "Failed to fetch dashboard stats"]);
    }
  };

  // Fetch leave requests
  const fetchLeaveRequests = async () => {
    if (!branchId) return;
    setIsLoading(true);
    try {
      const res = await manageLeaves({ branch_id: branchId }, "GET");
      console.log("Leave requests response:", res); // Debug response
      if (res.success && Array.isArray(res.data)) {
        const requests = res.data.map((req: any) => ({
          id: req.id.toString(),
          name: req.faculty_name || "Unknown",
          dept: req.department || "Unknown",
          period: formatPeriod(req.start_date, req.end_date),
          reason: req.reason || "No reason provided",
          status: req.status === "APPROVED" ? "Approved" : req.status === "REJECTED" ? "Rejected" : "Pending",
        })) as LeaveRequest[];
        setLeaveRequests(requests);
      } else {
        setErrors((prev) => [...prev, res.message || "No leave requests found"]);
        setLeaveRequests([]);
      }
    } catch (err) {
      setErrors((prev) => [...prev, "Failed to fetch leave requests"]);
      setLeaveRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle approve
  const handleApprove = async (index: number) => {
    const leave = leaveRequests[index];
    try {
      const res = await manageLeaves(
        {
          action: "update",
          branch_id: branchId,
          leave_id: leave.id,
          status: "APPROVED",
        },
        "PATCH"
      );
      if (res.success) {
        await fetchLeaveRequests();
        Swal.fire("Approved!", "The leave request has been approved.", "success");
      } else {
        setErrors([res.message || "Failed to approve leave"]);
      }
    } catch (err) {
      setErrors(["Failed to approve leave"]);
      Swal.fire("Error!", "Failed to approve the leave request.", "error");
    }
  };

  // Handle reject
  const handleReject = async (index: number) => {
    const leave = leaveRequests[index];
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You are about to reject this leave request.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, reject it!",
      cancelButtonText: "No, keep it",
      background: "#23232a",
      color: "#e5e7eb",
      customClass: {
      popup: "swal2-dark",
      confirmButton: "bg-red-600 text-white",
      cancelButton: "bg-gray-700 text-gray-200",
      title: "text-gray-100",
      content: "text-gray-200",
      },
    });
    if (result.isConfirmed) {
      try {
        const res = await manageLeaves(
          {
            action: "update",
            branch_id: branchId,
            leave_id: leave.id,
            status: "REJECTED",
          },
          "PATCH"
        );
        if (res.success) {
          await fetchLeaveRequests();
          Swal.fire("Rejected!", "The leave request has been rejected.", "success");
        } else {
          setErrors([res.message || "Failed to reject leave"]);
          Swal.fire("Error!", "Failed to reject the leave request.", "error");
        }
      } catch (err) {
        setErrors(["Failed to reject leave"]);
        Swal.fire("Error!", "Failed to reject the leave request.", "error");
      }
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchBranchId();
  }, []);

  // Fetch stats and leave requests when branchId changes
  useEffect(() => {
    if (branchId) {
      fetchStats();
      fetchLeaveRequests();
    }
  }, [branchId]);

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
    <div className="text-gray-200 p-8 space-y-6 font-sans min-h-screen bg-[#1c1c1e] py-0">
      {/* Welcome Message */}
      <h1 className="text-2xl font-semibold text-gray-200 ">
        Welcome back, {hodName}, Here's what's happening in your {branchName} department.
      </h1>

      {/* Loading and Errors */}
      {isLoading && <p className="bg-[#1c1c1e] text-gray-600 mb-4 animate-pulse">Loading data...</p>}
      {errors.length > 0 && (
        <ul className="text-sm text-red-500 mb-4 list-disc list-inside bg-red-50 p-4 rounded-lg">
          {errors.map((err, idx) => (
            <li key={idx}>{err}</li>
          ))}
        </ul>
      )}

      {/* Stats Cards */}
      <div className="bg-[#1c1c1e] grid grid-cols-1 md:grid-cols-4 gap-6 ">
        {[
          {
            title: "Total Faculty",
            className: "text-gray-600",
            value: stats?.faculty_count.toString() || "0",
            icon: <Users className="text-gray-600 " />,
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
            title: "Total Members",
            value: stats ? (stats.faculty_count + stats.student_count).toString() : "0",
            icon: <UserPlus className="text-gray-600" />,
            change: "Faculty + Students",
            color: "text-gray-600",
          },
          {
            title: "Pending Leaves",
            value: pendingLeavesCount.toString(),
            icon: <Calendar className="text-gray-600" />,
            change: "-12.4% since last month",
            color: "text-gray-600",
          },
        ].map((item, i) => (
            <div
              key={i}
              className="bg-[#232326] p-4 rounded-lg shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow border text-gray-200 outline-none focus:ring-2 focus:ring-white"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-200">
              {item.icon && (
                // Make icon large and blue for visibility
                <span className="text-blue-600 text-3xl">{item.icon}</span>
              )}
              </div>
              <div>
              <p className="text-sm font-medium text-gray-200">{item.title}</p>
              <p className="text-xl font-bold text-gray-200">{item.value}</p>
              <p className={`text-xs text-gray-50 ${item.color}`}>{item.change}</p>
              </div>
            </div>
        ))}
      </div>

      {/* Charts: Attendance Trends and Member Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-[#1c1c1e]">
        {/* Attendance Chart */}
        <div className="bg-[#1c1c1e] border border-gray-200 p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-200">Attendance Trends</h3>
          </div>
          <p className="text-sm text-gray-400 mb-4">Weekly attendance percentage</p>
          <div className="min-h-[250px] text-gray-500">
            {chartData.length === 1 && chartData[0].week === "No Data" ? (
              <p className="text-sm text-gray-400 text-center italic">No attendance data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData} isAnimationActive={true} animationDuration={800}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="week" stroke="#6b7280" fontSize={12} />
                  <YAxis domain={[0, 100]} stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #e5e7eb" }}
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
        <div className="bg-[#1c1c1e] border border-gray-200 p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-200">Member Distribution</h3>
          </div>
          <p className="text-sm text-gray-400 mb-4">Faculty, Students, and Total Members</p>
          <div className="min-h-[250px]">
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
                  isAnimationActive={true}
                  animationDuration={800}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Leave Requests */}
      <div className="bg-[#1c1c1e] p-6 rounded-lg shadow-sm text-sm text-gray-200 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-200">Leave Requests</h3>
            <button
              className="flex items-center gap-1 border border-gray-300 text-sm font-medium text-gray-200 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-md transition"
              onClick={() => setPage("leaves")} // <- this switches the dashboard page
            >
              View All
            </button>

        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left border-b text-gray-200 text-xs">
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
                <td colSpan={5} className="py-3 text-center text-gray-200">No leave requests found</td>
              </tr>
            ) : (
              leaveRequests.map((row, index) => (
                <tr key={row.id} className="border-b last:border-none text-sm hover:bg-gray-800">
                  <td className="py-3">
                    <div>
                      <p className="font-medium text-gray-200">{row.name}</p>
                      <p className="text-xs text-gray-400">{row.dept}</p>
                    </div>
                  </td>
                  <td>{row.period}</td>
                  <td>{row.reason}</td>
                  <td>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
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
                        <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(index)}
                          className="flex items-center gap-1 bg-green-700 text-gray-100 hover:bg-green-800 text-sm font-medium px-3 py-1.5 rounded-md transition"
                          disabled={isLoading}
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(index)}
                          className="flex items-center gap-1 bg-red-700 text-gray-100 hover:bg-red-800 text-sm font-medium px-3 py-1.5 rounded-md transition"
                          disabled={isLoading}
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                        </div>
                    ) : (
                      <span className="text-xs text-gray-500">No action needed</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};