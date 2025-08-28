import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { CalendarIcon, Filter as FilterIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { manageHODLeaves, ManageHODLeavesRequest, manageProfile } from "../../utils/hod_api";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Leave {
  id: string;
  title: string;
  date: string;
  reason: string;
  status: string;
}

const statusColors = {
  APPROVED: "text-green-700 bg-green-100",
  REJECTED: "text-red-700 bg-red-100",
  PENDING: "text-yellow-700 bg-yellow-100",
};

const ApplyLeave = () => {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [leaveTitle, setLeaveTitle] = useState("");
  const [reason, setReason] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showFilter, setShowFilter] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [branchId, setBranchId] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const today = new Date();


  // Fetch branch ID from HOD profile
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const profileResponse = await manageProfile({}, "GET");
        if (!profileResponse.success || !profileResponse.data?.branch_id) {
          throw new Error(profileResponse.message || "Failed to fetch HOD profile");
        }
        setBranchId(profileResponse.data.branch_id);
      } catch (error) {
        const errorMessage = (error as Error).message || "Network error";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Fetch leaves when branchId is available
  useEffect(() => {
    const fetchLeaves = async () => {
      if (!branchId) return;
      setLoading(true);
      try {
        const response = await manageHODLeaves({ branch_id: branchId }, "GET");
        if (response.success && response.data) {
          setLeaves(response.data as Leave[]);
        } else {
          setError(response.message || "Failed to fetch leaves");
          toast.error(response.message || "Failed to fetch leaves");
        }
      } catch (err) {
        const errorMessage = "Network error occurred";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaves();
  }, [branchId]);

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
        start_date: startDate,
        end_date: endDate || startDate,
        reason,
      };
      const response = await manageHODLeaves(request, "POST");
      if (response.success && response.data) {
        setLeaves([response.data as Leave, ...leaves]);
        setSuccessMessage("Leave application submitted successfully.");
        setError("");
        setLeaveTitle("");
        setStartDate("");
        setEndDate("");
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
    <div className="p-6 bg-[#1c1c1e] min-h-screen text-gray-200">
      <h2 className="text-3xl font-bold mb-6">Apply Leave</h2>

      {/* Leave Application Form */}
      <Card className="bg-[#1c1c1e] text-gray-200 border shadow-sm mb-6">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Leave Application Form</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Leave Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Title for Leave *</label>
            <Input
              value={leaveTitle}
              onChange={(e) => setLeaveTitle(e.target.value)}
              placeholder="Enter a title for your leave"
              disabled={loading}
              className="w-full bg-[#232326] text-gray-200 border border-gray-700 rounded p-2"
            />
          </div>

          {/* Start and End Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium mb-1">Start Date *</label>
              <div className="flex items-center bg-[#232326] border border-gray-700 rounded w-full">
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  minDate={today}
                  dateFormat="dd/MM/yyyy"
                  disabled={loading}
                  className="flex-1 p-2 text-gray-200 bg-transparent border-none rounded-none focus:outline-none"
                />
                <CalendarIcon className="h-5 w-5 text-gray-400 mr-2 ml-80" />
              </div>
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <div className="flex items-center bg-[#232326] border border-gray-700 rounded w-full">
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  minDate={startDate || today}
                  dateFormat="dd/MM/yyyy"
                  disabled={loading}
                  className="flex-1 p-2 text-gray-200 bg-transparent border-none rounded-none focus:outline-none"
                />
                <CalendarIcon className="h-5 w-full mr-2 ml-80 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Reason for Leave */}
          <div>
            <label className="block text-sm font-medium mb-2">Reason for Leave *</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a detailed reason for your leave request"
              rows={4}
              draggable={false}
              className="w-full resize-none bg-[#232326] text-gray-200 border border-gray-700 rounded p-2"
              disabled={loading}
            />
          </div>

          {/* Error/Success Messages */}
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {successMessage && <p className="text-green-600 text-sm">{successMessage}</p>}

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={loading || !branchId}
              className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500"
            >
              {loading ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Leave Applications */}
      <Card className="bg-[#1c1c1e] text-gray-200 border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">Recent Leave Applications</CardTitle>
            <div className="relative">
              <button
                onClick={() => setShowFilter((prev) => !prev)}
                className="text-gray-200 hover:text-gray-400"
              >
                <FilterIcon className="w-6 h-6" />
              </button>
              {showFilter && (
                <div className="absolute right-0 mt-2 w-36 bg-[#1c1c1e] text-gray-200 border rounded shadow-lg z-10">
                  {["All", "Approved", "Pending", "Rejected"].map((status) => (
                    <div
                      key={status}
                      onClick={() => {
                        setStatusFilter(status);
                        setShowFilter(false);
                      }}
                      className={cn(
                        "px-4 py-2 cursor-pointer hover:bg-gray-500",
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
            <p className="text-sm text-gray-200 py-6 text-center">Loading...</p>
          ) : filteredLeaves.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">No applications found.</p>
          ) : (
            filteredLeaves.map((leave) => (
              <div key={leave.id} className="flex items-start justify-between py-4">
                <div className="pr-4 space-y-1">
                  {/* Title / Subject */}
                  <p className="font-medium text-gray-200">
                    📌 {leave.title}
                  </p>

                  {/* Date */}
                  <p className="text-sm text-gray-400">🗓 {leave.date}</p>

                  {/* Reason */}
                  <p className="text-sm text-gray-400">
                    📝 <span className="font-semibold">Reason:</span> {leave.reason}
                  </p>
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
      </Card>
    </div>
  );
};

export default ApplyLeave;