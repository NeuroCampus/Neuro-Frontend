import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { CalendarIcon, Filter as FilterIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { manageHODLeaves, getLeaveBootstrap } from "../../utils/hod_api";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useTheme } from "../../context/ThemeContext";

// Define error type for catch blocks
interface ErrorWithMessage {
  message: string;
}

// Type guard to check if an object has a message property
function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

interface ManageHODLeavesRequest {
  branch_id: string;
  title?: string;
  start_date?: string;
  end_date?: string;
  reason?: string;
}

interface Leave {
  id: string;
  title: string;
  date: string;
  reason: string;
  status: string;
}

interface ProfileData {
  branch_id: string;
}

interface LeaveData {
  id: number;
  faculty_name: string;
  department: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  title?: string; // Make title optional since it might not be in the response
}

interface LeaveBootstrapResponse {
  profile: ProfileData;
  leaves: Array<{
    id: number;
    faculty_name: string;
    department: string;
    start_date: string;
    end_date: string;
    reason: string;
    status: string;
    title?: string;
  }>;
}

const statusColors = {
  APPROVED: "text-green-700 bg-green-100",
  REJECTED: "text-red-700 bg-red-100",
  PENDING: "text-yellow-700 bg-yellow-100",
};

const ApplyLeave = () => {
  const { theme } = useTheme();
  const filterRef = useRef<HTMLDivElement>(null);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [leaveTitle, setLeaveTitle] = useState("");
  const [reason, setReason] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showFilter, setShowFilter] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [branchId, setBranchId] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const today = new Date();


  // Fetch profile and leaves data using combined endpoint
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await getLeaveBootstrap();
        if (!response.success || !response.data) {
          throw new Error(response.message || "Failed to fetch data");
        }

        const data: LeaveBootstrapResponse = response.data;

        // Set branch ID from profile
        setBranchId(data.profile.branch_id);

        // Set leaves data
        const leavesData = data.leaves.map((leave: LeaveData) => ({
          id: leave.id.toString(),
          title: leave.title || leave.faculty_name || "Leave Application",
          date: leave.start_date,
          reason: leave.reason,
          status: leave.status
        })) as Leave[];
        setLeaves(leavesData);
        setError("");
      } catch (err) {
        if (isErrorWithMessage(err)) {
          const errorMessage = err.message || "Failed to fetch data";
          console.error("Error fetching data:", err);
          setError(errorMessage);
          toast.error(errorMessage);
        } else {
          const errorMessage = "Failed to fetch data";
          console.error("Error fetching data:", err);
          setError(errorMessage);
          toast.error(errorMessage);
        }
        setLeaves([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilter(false);
      }
    };

    if (showFilter) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilter]);

  const handleSubmit = async () => {
    if (!leaveTitle || !startDate || !reason) {
      setError("Please fill in all required fields.");
      setSuccessMessage("");
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const request: ManageHODLeavesRequest = {
        branch_id: branchId,
        title: leaveTitle,
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: endDate ? format(endDate, "yyyy-MM-dd") : format(startDate, "yyyy-MM-dd"),
        reason,
      };
      const response = await manageHODLeaves(request, "POST");
      if (response.success && response.data) {
        setLeaves([response.data as Leave, ...leaves]);
        setSuccessMessage("Leave application submitted successfully.");
        setError("");
        setLeaveTitle("");
        setStartDate(null);
        setEndDate(null);
        setReason("");
        toast.success("Leave application submitted!");
      } else {
        setError(response.message || "Failed to submit leave");
        toast.error(response.message || "Failed to submit leave");
      }
    } catch (err) {
      const errorMessage = "Network error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Filter leaves based on statusFilter
  const filteredLeaves = leaves.filter((leave) => {
    if (statusFilter === "All") {
      return true;
    }
    return leave.status === statusFilter.toUpperCase();
  });

  return (
    <div className={`p-6 min-h-screen ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
      <h2 className={`text-3xl font-bold mb-6 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Apply Leave</h2>

      {/* Leave Application Form */}
      <Card className={theme === 'dark' ? 'bg-card text-foreground border-border shadow-sm mb-6' : 'bg-white text-gray-900 border-gray-200 shadow-sm mb-6'}>
        <CardHeader>
          <CardTitle className={`text-xl font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Leave Application Form</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Leave Title */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Title for Leave *</label>
            <Input
              value={leaveTitle}
              onChange={(e) => setLeaveTitle(e.target.value)}
              placeholder="Enter a title for your leave"
              disabled={loading}
              className={theme === 'dark' ? 'w-full bg-card text-foreground border-border rounded p-2 placeholder:text-muted-foreground' : 'w-full bg-white text-gray-900 border-gray-300 rounded p-2 placeholder:text-gray-500'}
            />
          </div>

         {/* Start and End Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            {/* Start Date */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Start Date *</label>
              <div className={`relative flex items-center rounded w-full border ${theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-300'}`}>
                <DatePicker
                  selected={startDate}
                  onChange={(date: Date | null) => setStartDate(date)}
                  minDate={today}   // ✅ only today & future
                  dateFormat="dd/MM/yyyy"
                  disabled={loading}
                  placeholderText="Select start date"
                  className={`w-full p-2 bg-transparent border-none rounded focus:outline-none ${theme === 'dark' ? 'text-foreground placeholder:text-muted-foreground' : 'text-gray-900 placeholder:text-gray-500'}`}
                />
                <CalendarIcon className={`absolute right-3 h-5 w-5 pointer-events-none ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`} />
              </div>
            </div>

            {/* End Date */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>End Date</label>
              <div className={`relative flex items-center rounded w-full border ${theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-300'}`}>
                <DatePicker
                  selected={endDate}
                  onChange={(date: Date | null) => setEndDate(date)}
                  minDate={startDate || today}   // ✅ must be ≥ start date
                  dateFormat="dd/MM/yyyy"
                  disabled={loading}
                  placeholderText="Select end date"
                  className={`w-full p-2 bg-transparent border-none rounded focus:outline-none ${theme === 'dark' ? 'text-foreground placeholder:text-muted-foreground' : 'text-gray-900 placeholder:text-gray-500'}`}
                />
                <CalendarIcon className={`absolute right-3 h-5 w-5 pointer-events-none ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`} />
              </div>
            </div>
          </div>

          {/* Reason for Leave */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Reason for Leave *</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a detailed reason for your leave request"
              rows={4}
              draggable={false}
              className={`w-full resize-none rounded p-2 thin-scrollbar ${theme === 'dark' ? 'bg-card text-foreground border-border placeholder:text-muted-foreground' : 'bg-white text-gray-900 border-gray-300 placeholder:text-gray-500'}`}
              disabled={loading}
            />
          </div>

          {/* Error/Success Messages */}
          {error && <p className={`text-sm ${theme === 'dark' ? 'text-destructive' : 'text-red-600'}`}>{error}</p>}
          {successMessage && <p className={`text-sm ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>{successMessage}</p>}

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={loading || !branchId}
              className={`bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white transition-all duration-200 ease-in-out transform hover:scale-105 ${theme === 'dark' ? 'shadow-lg shadow-[#a259ff]/20' : 'shadow-md'}`}
            >
              {loading ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Leave Applications */}
      <Card className={theme === 'dark' ? 'bg-card text-foreground border-border shadow-sm' : 'bg-white text-gray-900 border-gray-200 shadow-sm'}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className={`text-xl font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Recent Leave Applications</CardTitle>
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setShowFilter((prev) => !prev)}
                className={theme === 'dark' ? 'text-foreground hover:text-muted-foreground' : 'text-gray-900 hover:text-gray-500'}
              >
                <FilterIcon className="w-6 h-6" />
              </button>
              {showFilter && (
                <div className={`absolute right-0 mt-2 w-36 rounded shadow-lg z-10 border ${theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}`}>
                  {["All", "Approved", "Pending", "Rejected"].map((status) => (
                    <div
                      key={status}
                      onClick={() => {
                        setStatusFilter(status);
                        setShowFilter(false);
                      }}
                      className={cn(
                        "px-4 py-2 cursor-pointer",
                        theme === 'dark' ? 'hover:bg-accent' : 'hover:bg-gray-100',
                        statusFilter === status && "font-semibold"
                      )}
                    >
                      {status}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="divide-y">
          {loading ? (
            <p className={`text-sm py-6 text-center ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Loading...</p>
          ) : filteredLeaves.length === 0 ? (
            <p className={`text-sm py-6 text-center ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>No applications found.</p>
          ) : (
            filteredLeaves.map((leave) => (
              <div key={leave.id} className="flex items-start justify-between py-4">
                <div className="pr-4 space-y-1">
                  {/* Title / Subject */}
                  <p className={`font-medium ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>📌 {leave.title}</p>

                  {/* Date */}
                  <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>🗓 {leave.date}</p>

                  {/* Reason Button */}
                  <button
                    onClick={() => setSelectedReason(leave.reason)}
                    className={`text-sm hover:underline ${theme === 'dark' ? 'text-primary' : 'text-blue-600'}`}
                  >
                    📝 View Reason
                  </button>
                </div>

                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full h-fit mt-1 ${statusColors[leave.status]}`}
                >
                  {leave.status}
                </span>
              </div>
            ))
          )}
        </CardContent>

        {/* Popup Modal */}
        <Dialog open={!!selectedReason} onOpenChange={() => setSelectedReason(null)}>
          <DialogContent className={`max-w-md ${theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-200'}`}>
            <DialogHeader>
              <DialogTitle className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>Leave Reason</DialogTitle>
              <DialogDescription className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}>
                The full reason provided by the applicant:
              </DialogDescription>
            </DialogHeader>

            {/* Scrollable reason */}
            <div className="mt-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              <p className={`text-sm whitespace-pre-line ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>{selectedReason}</p>
            </div>

            <div className="flex justify-end mt-4">
              <Button
                variant="secondary"
                onClick={() => setSelectedReason(null)}
                className={theme === 'dark' ? 'text-foreground bg-card border-border hover:bg-accent' : 'text-gray-900 bg-white border-gray-300 hover:bg-gray-100'}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </Card>
    </div>
  );
};

export default ApplyLeave;