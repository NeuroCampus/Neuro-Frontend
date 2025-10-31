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
import { useTheme } from "../../context/ThemeContext";

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

const getStatusBadge = (status: string, theme: string) => {
  switch (status) {
    case "Pending":
      return <span className={`px-3 py-1 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-700'}`}>Pending</span>;
    case "Approved":
    case "APPROVE":
      return <span className={`px-3 py-1 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-700'}`}>Approved</span>;
    case "Rejected":
    case "REJECT":
      return <span className={`px-3 py-1 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-700'}`}>Rejected</span>;
    default:
      return <span className={`px-3 py-1 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>Unknown</span>;
  }
};

const HODLeavesManagement = ({ setError, toast }: HODLeavesManagementProps) => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewReason, setViewReason] = useState<string | null>(null);
  const { theme } = useTheme();

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
          background: theme === 'dark' ? '#1c1c1e' : '#ffffff',
          color: theme === 'dark' ? '#E4E4E7' : '#000000',
          confirmButtonColor: '#22c55e',
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
            background: theme === 'dark' ? '#1c1c1e' : '#ffffff',
            color: theme === 'dark' ? '#E4E4E7' : '#000000',
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
    return <div className={`text-center py-6 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>Loading...</div>;
  }

  return (
    <div className={`p-6 min-h-screen ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
      <Card className={theme === 'dark' ? 'bg-card border border-border' : 'bg-white border border-gray-200'}>
        <CardHeader>
          <CardTitle className={`text-lg ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Leave Requests</CardTitle>
          <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Review and approve leave requests from Heads of Departments</p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="overflow-x-auto max-w-full thin-scrollbar">
            <table className="w-full text-sm text-left border-collapse">
              <thead className={`border-b ${theme === 'dark' ? 'border-border bg-card' : 'border-gray-200 bg-gray-50'}`}>
                <tr>
                  <th className={`py-2 px-2 md:px-4 text-left ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>HOD</th>
                  <th className={`py-2 px-4 md:px-12 text-left ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Period</th>
                  <th className={`py-2 px-2 text-left ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Reason</th>
                  <th className={`py-2 px-2 text-left ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Status</th>
                  <th className={`py-2 px-2 text-left ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Action</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(leaveRequests) && leaveRequests.length > 0 ? (
                  leaveRequests.map((leave) => (
                    <tr
                      key={leave.id}
                      className={`border-b transition-colors duration-200 ${theme === 'dark' ? 'border-border hover:bg-accent' : 'border-gray-200 hover:bg-gray-50'}`}
                    >
                      <td className="py-3 px-2 md:px-4">
                        <div className={`font-medium ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>{leave.name}</div>
                        <div className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>{leave.department}</div>
                      </td>
                      <td className={`py-3 px-2 md:px-4 text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
                        {leave.from} <span className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}>to</span> {leave.to}
                      </td>
                      <td className="py-3 px-2 md:px-4 text-sm">
                        <button
                          onClick={() => setViewReason(leave.reason)}
                          className={theme === 'dark' ? 'text-primary hover:underline' : 'text-blue-600 hover:underline'}
                        >
                          View
                        </button>
                      </td>
                      <td className="py-3 px-2 md:px-4">{getStatusBadge(leave.status, theme)}</td>
                      <td className="py-3 px-2 md:px-4">
                        {leave.status === "Pending" ? (
                          <div className="flex flex-col md:flex-row gap-2">
                            <Button
                              variant="outline"
                              className={`px-3 py-1 text-xs flex items-center gap-1 w-full md:w-auto ${
                                theme === 'dark' 
                                  ? 'text-green-400 border-green-400 hover:bg-green-900/20' 
                                  : 'text-green-700 border-green-600 hover:bg-green-100'
                              }`}
                              onClick={() => handleApprove(leave.id)}
                              disabled={loading}
                            >
                              <CheckCircle size={16} /> Approve
                            </Button>
                            <Button
                              variant="outline"
                              className={`px-3 py-1 text-xs flex items-center gap-1 w-full md:w-auto ${
                                theme === 'dark' 
                                  ? 'text-red-400 border-red-400 hover:bg-red-900/20' 
                                  : 'text-red-700 border-red-600 hover:bg-red-100'
                              }`}
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
                          <span className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>No action needed</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className={`text-center py-4 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                      No leave requests available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* View Reason Dialog */}
      <Dialog open={!!viewReason} onOpenChange={() => setViewReason(null)}>
        <DialogContent className={theme === 'dark' ? 'bg-card text-foreground border border-border' : 'bg-white text-gray-900 border border-gray-200'}>
          <DialogHeader>
            <DialogTitle className={`text-lg font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Leave Reason</DialogTitle>
          </DialogHeader>

          <div
            className={`p-3 text-base leading-relaxed whitespace-pre-wrap break-words 
                      max-h-64 overflow-y-auto rounded-md ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}
          >
            {viewReason}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className={theme === 'dark' 
                ? 'text-foreground bg-card border border-border hover:bg-accent' 
                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'}
              onClick={() => setViewReason(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className={theme === 'dark' ? 'bg-card text-foreground border border-border' : 'bg-white text-gray-900 border border-gray-200'}>
          <DialogHeader>
            <DialogTitle className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>Reject Leave Request</DialogTitle>
          </DialogHeader>
          <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Are you sure you want to reject this leave request?</p>
          <DialogFooter className="pt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              className={theme === 'dark' 
                ? 'border-border text-foreground bg-card hover:bg-accent' 
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}
              onClick={() => setShowModal(false)}
              disabled={loading}
              style={{ boxShadow: "none" }}
            >
              Cancel
            </Button>
            <Button
              className={theme === 'dark' 
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 border border-destructive' 
                : 'bg-red-600 text-white hover:bg-red-700 border border-red-600'}
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