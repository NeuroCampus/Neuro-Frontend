import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { manageHODLeaves } from "../../utils/admin_api";
import { useToast } from "../../hooks/use-toast";
import Swal from 'sweetalert2';

interface LeaveRequest {
  id: number;
  name: string;
  department: string;
  from: string;
  to: string;
  reason: string;
  status: string;
}

interface HODLeavesManagementProps {
  setError: (error: string | null) => void;
  toast: (options: any) => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Pending":
      return <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">Pending</span>;
    case "Approved":
    case "APPROVE":
      return <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">Approved</span>;
    case "Rejected":
    case "REJECT":
      return <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">Rejected</span>;
    default:
      return <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">Unknown</span>;
  }
};

const HODLeavesManagement = ({ setError, toast }: HODLeavesManagementProps) => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewReason, setViewReason] = useState<string | null>(null);


  const fetchLeaves = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await manageHODLeaves();
      console.log("Leaves API response:", response);
      if (response.success) {
        const leaveData = Array.isArray(response.leaves)
          ? response.leaves.map((leave: any) => ({
              id: leave.id,
              name: leave.hod.username || "N/A",
              department: leave.branch || "N/A",
              from: leave.start_date || "N/A",
              to: leave.end_date || "N/A",
              reason: leave.reason || "N/A",
              status: leave.status === "APPROVE" ? "Approved" :
                      leave.status === "REJECT" ? "Rejected" :
                      (leave.status.charAt(0) + leave.status.slice(1).toLowerCase()),
            }))
          : [];
        setLeaveRequests(leaveData);
      } else {
        setError(response.message || "Failed to fetch leave requests");
        toast({
          variant: "destructive",
          title: "Error",
          description: response.message || "Failed to fetch leave requests",
        });
      }
    } catch (err) {
      console.error("Fetch leaves error:", err);
      setError("Network error");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Network error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [setError, toast]);

  const handleApprove = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await manageHODLeaves({ leave_id: id, action: "APPROVED" }, "POST");
      console.log("Approve API response:", response);
      if (response.success) {
        await fetchLeaves();
        Swal.fire({
          icon: 'success',
          title: 'Leave Approved!',
          text: 'Hope the time off is refreshing!',
          background: '#18181b', // dark background
          color: '#E4E4E7',       // light text
          confirmButtonColor: '#22c55e', // green button to match dark theme
        });
      } else {
        setError(response.message || "Failed to approve leave");
        toast({
          variant: "destructive",
          title: "Error",
          description: response.message || "Failed to approve leave",
        });
      }
    } catch (err) {
      console.error("Approve leave error:", err);
      setError("Network error");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Network error",
      });
    } finally {
      setLoading(false);
    }
  };


  const handleConfirmReject = async () => {
    if (selectedId !== null) {
      setLoading(true);
      setError(null);
      try {
        const response = await manageHODLeaves({ leave_id: selectedId, action: "REJECTED" }, "POST");
        console.log("Reject API response:", response);
        if (response.success) {
          await fetchLeaves();
          setShowModal(false);
          setSelectedId(null);
          Swal.fire({
            icon: 'error',
            title: 'Leave Rejected',
            text: 'We hope for a better time next time!',
          });
        } else {
          setError(response.message || "Failed to reject leave");
          toast({
            variant: "destructive",
            title: "Error",
            description: response.message || "Failed to reject leave",
          });
        }
      } catch (err) {
        console.error("Reject leave error:", err);
        setError("Network error");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Network error",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading && leaveRequests.length === 0) {
    return <div className="text-center py-6">Loading...</div>;
  }

  return (
    <div className="p-6 bg-black-50 min-h-screen text-gray-200">
      <Card className="bg-black-50 border border-gray-500 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-gray-200">Leave Requests</CardTitle>
          <p className="text-sm text-gray-400">Review and approve leave requests from Heads of Departments</p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-900">
            <thead className="border-b border-gray-200 text-gray-200">
              <tr>
                <th className="py-2 px-2">HOD</th>
                <th className="py-2 px-12">Period</th>
                <th className="py-2">Reason</th>
                <th className="py-2 px-4">Status</th>
                <th className="py-2 px-5">Action</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(leaveRequests) && leaveRequests.length > 0 ? (
              leaveRequests.map((leave) => (
                <tr
                key={leave.id}
                className="border-b border-gray-100 transition-colors duration-200 hover:bg-gray-800"
                >
                <td className="py-3">
                  <div className="font-medium text-white">{leave.name}</div>
                  <div className="text-xs text-gray-300">{leave.department}</div>
                </td>
                <td className="py-3 text-sm text-white">
                  {leave.from} <span className="text-gray-300">to</span> {leave.to}
                </td>
<td className="py-3 text-sm text-white">
  <button
    onClick={() => setViewReason(leave.reason)}
    className="text-blue-400 hover:underline"
  >
    View
  </button>
</td>
                <td className="py-3">{getStatusBadge(leave.status)}</td>
                <td className="py-3">
                  {leave.status === "Pending" ? (
                  <div className="flex gap-2">
                    <Button
                    variant="outline"
                    className="text-green-700 border-green-600 hover:bg-green-900 px-3 py-1 text-xs flex items-center gap-1"
                    onClick={() => handleApprove(leave.id)}
                    disabled={loading}
                    >
                    <CheckCircle size={16} /> Approve
                    </Button>
                    <Button
                    variant="outline"
                    className="text-red-700 border-red-600 hover:bg-red-900 px-3 py-1 text-xs flex items-center gap-1"
                    onClick={() => {
                      setShowModal(true);
                      setSelectedId(leave.id);
                    }}
                    disabled={loading}
                    >
                    <XCircle size={16} /> Reject
                    </Button>
                  </div>
                  ) : (
                  <span className="text-xs text-gray-400">No action needed</span>
                  )}
                </td>
                </tr>
              ))
              ) : (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-400">
                No leave requests available.
                </td>
              </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* View Reason Dialog */}
      <Dialog open={!!viewReason} onOpenChange={() => setViewReason(null)}>
        <DialogContent className="sm:max-w-lg bg-[#1c1c1e] text-gray-200 rounded-2xl shadow-lg thin-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Leave Reason</DialogTitle>
          </DialogHeader>

          <div
            className="p-3 text-gray-300 text-base leading-relaxed whitespace-pre-wrap break-words 
                      max-h-64 overflow-y-auto rounded-md"
          >
            {viewReason}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="text-gray-200 bg-gray-800 hover:bg-gray-700 border border-gray-600"
              onClick={() => setViewReason(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-[#18181b] text-gray-200 border border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-200">Reject Leave Request</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-300">Are you sure you want to reject this leave request?</p>
          <DialogFooter className="pt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              className="border-gray-600 text-gray-200 bg-[#18181b]"
              onClick={() => setShowModal(false)}
              disabled={loading}
              style={{ boxShadow: "none" }}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-800 text-gray-100 border border-red-800 hover:bg-red-900"
              onClick={handleConfirmReject}
              disabled={loading}
              style={{ boxShadow: "none" }}
            >
          {loading ? "Rejecting..." : "Confirm Reject"}
        </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HODLeavesManagement;
