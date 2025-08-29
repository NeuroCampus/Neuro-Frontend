import { useEffect, useState } from "react";
import { getProctorStudents, manageStudentLeave, ProctorStudent, LeaveRow } from "@/utils/faculty_api";
import { Button } from "../ui/button";

const statusColors = {
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  PENDING: "bg-yellow-100 text-yellow-800",
};

const statusOptions = ["All", "PENDING", "APPROVED", "REJECTED"];

const ManageStudentLeave = () => {
  const [students, setStudents] = useState<ProctorStudent[]>([]);
  const [leaveRows, setLeaveRows] = useState<LeaveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const fetchLeaves = () => {
    setLoading(true);
    getProctorStudents()
      .then((res) => {
        if (res.success && res.data) {
          setStudents(res.data);
          const rows: LeaveRow[] = [];
          res.data.forEach((s: ProctorStudent) => {
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
        } else {
          setError(res.message || "Failed to fetch students");
        }
      })
      .catch((e) => setError(e.message || "Failed to fetch students"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

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
        fetchLeaves(); // Refetch to get backend-updated status
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
    <div className="p-6 bg-[#1c1c1e] text-gray-200 min-h-screen">
      <h2 className="text-2xl font-semibold mb-2">Leave Approvals</h2>
      <p className="text-gray-300 mb-6">Review and manage student leave requests.</p>

      {/* Loading and Errors */}
      {loading && <p className="text-gray-600 mb-4">Loading leave requests...</p>}
      {error && <div className="text-red-600 mb-4">{error}</div>}

      {/* Search and Filter */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <input
          type="text"
          placeholder="Search by name or USN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 bg-[#232326] border text-gray-200 outline-none focus:ring-2 focus:ring-white rounded-md px-4 py-2 text-sm"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-[#232326] text-gray-200 rounded-md px-3 py-2 text-sm"
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status === "All" ? "All Statuses" : status.charAt(0) + status.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-[#1c1c1e] text-gray-200 p-4 rounded-md shadow text-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-semibold text-gray-200">Leave Requests</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left border-b text-gray-200 text-xs">
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
                <td colSpan={5} className="py-3 text-center text-gray-200">
                  No leave requests found
                </td>
              </tr>
            ) : (
              filteredRows.map((row: LeaveRow) => (
                <tr key={row.id} className="border-b last:border-none text-sm">
                  <td className="py-3">
                    <div>
                      <p className="font-medium text-gray-200">{row.student_name}</p>
                      <p className="text-xs text-gray-200">{row.usn}</p>
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
                        <Button
                          onClick={() => handleAction(row.id, "APPROVE")}
                          className="flex items-center gap-1 border border-green-500 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-md transition"
                          disabled={actionLoading === row.id + "APPROVE"}
                        >
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleAction(row.id, "REJECT")}
                          className="flex items-center gap-1 border border-red-500 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition"
                          disabled={actionLoading === row.id + "REJECT"}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-200">No action needed</span>
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
