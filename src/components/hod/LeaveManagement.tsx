import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CheckCircle, XCircle, Filter } from "lucide-react";
import Swal from 'sweetalert2';
import { manageLeaves, manageProfile, getFacultyLeavesBootstrap } from "../../utils/hod_api";
import { useTheme } from "../../context/ThemeContext";

interface LeaveRequest {
  id: string;
  name: string;
  dept: string;
  period: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
}

interface FacultyLeaveData {
  id: number;
  faculty_name: string;
  department: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
}

interface ProfileData {
  branch_id: string;
}

interface FacultyLeavesBootstrapResponse {
  profile: ProfileData;
  leaves: FacultyLeaveData[];
}

const LeaveManagement = () => {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | "Pending" | "Approved" | "Rejected">("All");
  const [open, setOpen] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [branchId, setBranchId] = useState("");
  const { theme } = useTheme();
  const hasFetchedRef = useRef(false);

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
        const requests = res.data.map((req: FacultyLeaveData) => ({
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
      action: "update" as const,
      branch_id: branchId,
      leave_id: leave.id,
      status: "APPROVED" as const,
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
      action: "update" as const,
      branch_id: branchId,
      leave_id: leave.id,
      status: "REJECTED" as const,
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

  // Fetch all data using combined endpoint
  useEffect(() => {
    const fetchData = async () => {
      // Prevent duplicate API calls (handles React StrictMode double execution)
      if (hasFetchedRef.current) {
        return;
      }
      hasFetchedRef.current = true;

      setIsLoading(true);
      try {
        const response = await getFacultyLeavesBootstrap();
        if (!response.success || !response.data) {
          throw new Error(response.message || "Failed to fetch data");
        }

        const data: FacultyLeavesBootstrapResponse = response.data;

        // Set branchId
        setBranchId(data.profile.branch_id);

        // Set leave requests
        const requests = data.leaves.map((req: FacultyLeaveData) => ({
          id: req.id.toString(),
          name: req.faculty_name || "Unknown",
          dept: req.department || "Unknown",
          period: formatPeriod(req.start_date, req.end_date),
          reason: req.reason || "No reason provided",
          status: req.status === "APPROVED" ? "Approved" : req.status === "REJECTED" ? "Rejected" : "Pending",
        })) as LeaveRequest[];
        setLeaveRequests(requests);
        setErrors([]);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch data";
        console.error("Error fetching data:", err);
        setErrors([errorMessage]);
        setLeaveRequests([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter requests
  const filteredRequests = leaveRequests.filter((req) => {
    const matchesSearch = req.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "All" || req.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className={`p-6 min-h-screen ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <h2 className={`text-2xl font-semibold mb-2 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Leave Approvals</h2>
      <p className={`mb-6 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-400'}`}>Review and manage faculty leave requests.</p>

      {/* Loading and Errors */}
      {isLoading && <p className={`mb-4 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-400'}`}>Loading leave requests...</p>}
      {errors.length > 0 && (
        <ul className={`text-sm mb-4 list-disc list-inside ${theme === 'dark' ? 'text-destructive' : 'text-red-500'}`}>
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
          className={`w-64 text-sm ${theme === 'dark' ? 'bg-card border-border text-foreground placeholder:text-muted-foreground' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500'}`}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="flex justify-end items-center">
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white transition-all duration-200 ease-in-out transform hover:scale-105 shadow-md text-sm font-medium"
              >
                <Filter className="w-4 h-4" />
                Filter
              </Button>
            </div>
          </PopoverTrigger>
          <PopoverContent className={`w-48 p-4 ${theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-200'}`}>
            <div className="flex flex-col gap-2">
              <h4 className={`text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Filter Leave Requests</h4>
              <Button
                variant={filterStatus === "All" ? "default" : "outline"}
                size="sm"
                className={`${theme === 'dark' ? 'text-foreground bg-card border-border hover:bg-accent' : 'text-gray-900 bg-white border-gray-300 hover:bg-gray-100'}`}
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
                className={`${theme === 'dark' ? 'text-foreground bg-card border-border hover:bg-accent' : 'text-gray-900 bg-white border-gray-300 hover:bg-gray-100'}`}
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
                className={`${theme === 'dark' ? 'text-foreground bg-card border-border hover:bg-accent' : 'text-gray-900 bg-white border-gray-300 hover:bg-gray-100'}`}
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
                className={`${theme === 'dark' ? 'text-foreground bg-card border-border hover:bg-accent' : 'text-gray-900 bg-white border-gray-300 hover:bg-gray-100'}`}
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
      <div className={`p-4 rounded-md shadow text-sm border custom-scrollbar ${theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-200'}`} style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-base font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Leave Requests</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className={`text-left text-xs ${theme === 'dark' ? 'border-b text-foreground' : 'border-b text-gray-900'}`}>
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
                <td colSpan={5} className={`py-3 text-center ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-400'}`}>
                  No leave requests found
                </td>
              </tr>
            ) : (
              filteredRequests.map((row, index) => (
                <tr key={row.id} className={`border-b last:border-none text-sm ${theme === 'dark' ? 'border-border' : 'border-gray-200'}`}>
                  <td className="py-3">
                    <div>
                      <p className={`font-medium ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>{row.name}</p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-400'}`}>{row.dept}</p>
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
  );
};

export default LeaveManagement;