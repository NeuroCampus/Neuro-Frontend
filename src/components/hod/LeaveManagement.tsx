import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { CheckCircle, XCircle, Filter } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import Swal from 'sweetalert2';
import { manageLeaves, manageProfile } from "../../utils/hod_api";

interface LeaveRequest {
  id: string;
  name: string;
  dept: string;
  period: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
}

const LeaveManagement = () => {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | "Pending" | "Approved" | "Rejected">("All");
  const [open, setOpen] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [branchId, setBranchId] = useState("");

  // Format date range to "MMM DD, YYYY to MMM DD, YYYY"
  const formatPeriod = (startDate: string, endDate: string): string => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const options: Intl.DateTimeFormatOptions = { month: "short", day: "2-digit", year: "numeric" };
      const startStr = start.toLocaleDateString("en-US", options);
      const endStr = end.toLocaleDateString("en-US", options);
      return `${startStr} to ${endStr}`;
    } catch {
      return "Invalid date";
    }
  };

  // Fetch branch_id from manageProfile
  const fetchBranchId = async () => {
    try {
      const profileRes = await manageProfile({}, "GET");
      if (profileRes.success && profileRes.data?.branch_id) {
        setBranchId(profileRes.data.branch_id);
      } else {
        setErrors(["Failed to fetch branch ID: No branch assigned"]);
      }
    } catch (err) {
      console.error("Error fetching branch ID:", err);
      setErrors(["Failed to connect to backend for branch ID"]);
    }
  };

  // Fetch leave requests
  const fetchLeaveRequests = async () => {
    if (!branchId) return;
    setIsLoading(true);
    try {
      const res = await manageLeaves({ branch_id: branchId }, "GET");
      console.log("manage_leaves response:", res);
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
        setErrors([]);
        console.log("Processed leave requests:", requests);
      } else {
        console.warn("manage_leaves failed:", res.message);
        setErrors([res.message || "No leave requests found"]);
        setLeaveRequests([]);
      }
    } catch (err) {
      console.error("Error fetching leave requests:", err);
      setErrors(["Failed to fetch leave requests: Invalid response format"]);
      setLeaveRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle approve
  const handleApprove = async (index: number) => {
    const leave = leaveRequests[index];
    const payload = {
      action: "update",
      branch_id: branchId,
      leave_id: leave.id,
      status: "APPROVED",
    };
    console.log("Approve payload:", payload); // Debug log
    try {
      const res = await manageLeaves(payload, "PATCH");
      if (res.success) {
        await fetchLeaveRequests();
        Swal.fire('Approved!', 'The leave request has been approved.', 'success');
      } else {
        setErrors([res.message || "Failed to approve leave"]);
        Swal.fire('Error!', res.message || 'Failed to approve the leave request.', 'error');
      }
    } catch (err) {
      console.error("Error approving leave:", err);
      setErrors(["Failed to approve leave"]);
      Swal.fire('Error!', 'Failed to approve the leave request.', 'error');
    }
  };

  // Handle reject
  const handleReject = async (index: number) => {
    const leave = leaveRequests[index];
    const payload = {
      action: "update",
      branch_id: branchId,
      leave_id: leave.id,
      status: "REJECTED",
    };
    console.log("Reject payload:", payload); // Debug log
    Swal.fire({
      title: 'Are you sure?',
      text: 'You are about to reject this leave request. Are you sure you want to proceed?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, reject it!',
      cancelButtonText: 'No, keep it',
      customClass: {
        confirmButton: 'bg-red-600 text-white',
        cancelButton: 'bg-gray-300 text-black'
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await manageLeaves(payload, "PATCH");
          if (res.success) {
            await fetchLeaveRequests();
            Swal.fire('Rejected!', 'The leave request has been rejected.', 'success');
          } else {
            setErrors([res.message || "Failed to reject leave"]);
            Swal.fire('Error!', res.message || 'Failed to reject the leave request.', 'error');
          }
        } catch (err) {
          console.error("Error rejecting leave:", err);
          setErrors(["Failed to reject leave"]);
          Swal.fire('Error!', 'Failed to reject the leave request.', 'error');
        }
      }
    });
  };

  // Fetch initial data
  useEffect(() => {
    fetchBranchId();
  }, []);

  // Fetch leave requests when branchId is available
  useEffect(() => {
    if (branchId) {
      fetchLeaveRequests();
    }
  }, [branchId]);

  // Filter requests
  const filteredRequests = leaveRequests.filter((req) => {
    const matchesSearch = req.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "All" || req.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 bg-[#1c1c1e] min-h-screen text-gray-200">
      {/* Header */}
      <h2 className="text-2xl font-semibold mb-2">Leave Approvals</h2>
      <p className="text-gray-400 mb-6">Review and manage faculty leave requests.</p>

      {/* Loading and Errors */}
      {isLoading && <p className="text-gray-400 mb-4">Loading leave requests...</p>}
      {errors.length > 0 && (
        <ul className="text-sm text-red-500 mb-4 list-disc list-inside">
          {errors.map((err, idx) => (
            <li key={idx}>{err}</li>
          ))}
        </ul>
      )}

      {/* Search and Filter */}
      <div className="flex justify-between items-center mb-6">
        <Input
          placeholder="Search faculty..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 bg-[#1c1c1e] border border-gray-200 text-sm"
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="flex justify-end items-center">
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-[#1c1c1e] border border-gray-300 text-gray-400 text-sm font-medium hover:bg-gray-100"
              >
                <Filter className="w-4 h-4" />
                Filter
              </Button>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-4 bg-[#1c1c1e] border border-gray-400 text-gray-800">
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-semibold text-gray-200 mb-2">Filter Leave Requests</h4>
              <Button
                variant={filterStatus === "All" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setFilterStatus("All");
                  setOpen(false);
                }}
              >
                All
              </Button>
              <Button
                variant={filterStatus === "Pending" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setFilterStatus("Pending");
                  setOpen(false);
                }}
              >
                Pending
              </Button>
              <Button
                variant={filterStatus === "Approved" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setFilterStatus("Approved");
                  setOpen(false);
                }}
              >
                Approved
              </Button>
              <Button
                variant={filterStatus === "Rejected" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setFilterStatus("Rejected");
                  setOpen(false);
                }}
              >
                Rejected
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-[#1c1c1e] p-4 rounded-md shadow text-sm text-gray-200 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-semibold text-gray-200">Leave Requests</h3>
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
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-3 text-center text-gray-200">
                  No leave requests found
                </td>
              </tr>
            ) : (
              filteredRequests.map((row, index) => (
                <tr key={row.id} className="border-b last:border-none text-sm">
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
                          className="flex items-center gap-1 border border-green-500 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-md transition"
                          disabled={isLoading}
                        >
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          Approve
                        </button>

                        <button
                          onClick={() => handleReject(index)}
                          className="flex items-center gap-1 border border-red-500 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition"
                          disabled={isLoading}
                        >
                          <XCircle className="w-4 h-4 text-red-600" />
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

export default LeaveManagement;