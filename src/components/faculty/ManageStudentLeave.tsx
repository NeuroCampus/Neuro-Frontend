import { useEffect, useState } from "react";
import { manageStudentLeave, ProctorStudent, LeaveRow } from "@/utils/faculty_api";
import { Button } from "../ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface ManageStudentLeaveProps {
  proctorStudents: ProctorStudent[];
  proctorStudentsLoading: boolean;
}

const ManageStudentLeave: React.FC<ManageStudentLeaveProps> = ({ proctorStudents, proctorStudentsLoading }) => {
  const statusColors = {
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
    PENDING: "bg-yellow-100 text-yellow-800",
  };

  const statusOptions = ["All", "PENDING", "APPROVED", "REJECTED"];
  const [students, setStudents] = useState<ProctorStudent[]>([]);
  const [leaveRows, setLeaveRows] = useState<LeaveRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const { theme } = useTheme();

  useEffect(() => {
    setStudents(proctorStudents);
    const rows: LeaveRow[] = [];
    proctorStudents.forEach((s: ProctorStudent) => {
      (s.leave_requests || []).forEach((leave) => {
        rows.push({
          ...leave,
          status: leave.status as "PENDING" | "APPROVED" | "REJECTED",
          student_name: s.name,
          usn: s.usn,
        });
      });
    });
    setLeaveRows(rows);
  }, [proctorStudents]);

  const handleAction = async (leaveId: string, action: "APPROVE" | "REJECT") => {
    const confirmMsg =
      action === "APPROVE"
        ? "Are you sure you want to approve this leave request?"
        : "Are you sure you want to reject this leave request?";
    if (!window.confirm(confirmMsg)) return;
    setActionLoading(leaveId + action);
    try {
      const res = await manageStudentLeave({ leave_id: leaveId, action });
      if (res.success) {
        // The context will automatically update the data
        alert("Action completed successfully");
      } else {
        alert(res.message || "Action failed");
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        alert(e.message || "Action failed");
      } else {
        alert("Action failed");
      }
    } finally {
      setActionLoading(null);
    }
  };

  // Filter and search
  const filteredRows = leaveRows.filter((row: LeaveRow) => {
    const matchesSearch =
      row.student_name.toLowerCase().includes(search.toLowerCase()) ||
      row.usn.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      filterStatus === "All" || row.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className={`p-6 min-h-screen ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
      <h2 className="text-2xl font-semibold mb-2">Leave Approvals</h2>
      <p className={`mb-6 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>Review and manage student leave requests.</p>

      {/* Loading and Errors */}
      {loading && <p className={`mb-4 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>Loading leave requests...</p>}
      {error && <div className={`mb-4 ${theme === 'dark' ? 'text-destructive' : 'text-red-600'}`}>{error}</div>}

      {/* Search and Filter */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <input
          type="text"
          placeholder="Search by name or USN..."
          value={search}
          onChange={(e) => {
            // ✅ Allow only letters, numbers, and spaces
            const value = e.target.value.replace(/[^a-zA-Z0-9\s]/g, "");
            setSearch(value);
          }}
          className={theme === 'dark' ? 'w-64 bg-background border border-input text-foreground rounded-md px-4 py-2 text-sm' : 'w-64 bg-white border border-gray-300 text-gray-900 rounded-md px-4 py-2 text-sm'}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={theme === 'dark' ? 'bg-background border border-input text-foreground rounded-md px-3 py-2 text-sm' : 'bg-white border border-gray-300 text-gray-900 rounded-md px-3 py-2 text-sm'}
        >
          {statusOptions.map((status) => (
            <option key={status} value={status} className={theme === 'dark' ? 'bg-background text-foreground' : 'bg-white text-gray-900'}>
              {status === "All"
                ? "All Statuses"
                : status.charAt(0) + status.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Leave Requests Table */}
      <div className={`p-4 rounded-md shadow text-sm ${theme === 'dark' ? 'bg-card text-foreground border border-border' : 'bg-white text-gray-900 border border-gray-200'}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-base font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Leave Requests</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className={`text-left border-b text-xs ${theme === 'dark' ? 'border-border text-foreground' : 'border-gray-200 text-gray-900'}`}>
              <th className="pb-2">Student</th>
              <th>Period</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={5} className={`py-3 text-center ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
                  No leave requests found
                </td>
              </tr>
            ) : (
              filteredRows.map((row: LeaveRow) => (
                <tr key={row.id} className={`border-b last:border-none text-sm ${theme === 'dark' ? 'border-border' : 'border-gray-200'}`}>
                  <td className="py-3">
                    <div>
                      <p className={`font-medium ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>{row.student_name}</p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>{row.usn}</p>
                    </div>
                  </td>
                  <td>{row.start_date} to {row.end_date}</td>
                  <td>{row.reason}</td>
                  <td>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[row.status]}`}>
                      {row.status.charAt(0) + row.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td>
                    {row.status === "PENDING" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(row.id, "APPROVE")}
                          className={`flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-md transition border ${theme === 'dark' ? 'border-green-500 text-green-400 bg-green-500/10 hover:bg-green-500/20' : 'border-green-500 text-green-700 bg-green-50 hover:bg-green-100'}`}
                          disabled={actionLoading === row.id + "APPROVE"}
                        >
                          <CheckCircle className={`w-4 h-4 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                          Approve
                        </button>

                        <button
                          onClick={() => handleAction(row.id, "REJECT")}
                          className={`flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-md transition border ${theme === 'dark' ? 'border-red-500 text-red-400 bg-red-500/10 hover:bg-red-500/20' : 'border-red-500 text-red-700 bg-red-50 hover:bg-red-100'}`}
                          disabled={actionLoading === row.id + "REJECT"}
                        >
                          <XCircle className={`w-4 h-4 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>No action needed</span>
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

export default ManageStudentLeave;