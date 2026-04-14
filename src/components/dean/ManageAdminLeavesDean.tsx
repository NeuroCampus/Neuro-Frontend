import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { useTheme } from "../../context/ThemeContext";
import { manageAdminLeaves } from "../../utils/dean_api";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";

const MySwal = withReactContent(Swal);

interface AdminLeave {
  id: number;
  faculty_name: string;
  department: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
}

const ManageAdminLeavesDean = () => {
  const { theme } = useTheme();
  const [leaves, setLeaves] = useState<AdminLeave[]>([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selectedLeave, setSelectedLeave] = useState<AdminLeave | null>(null);
  const [showReasonDialog, setShowReasonDialog] = useState(false);

  // Fetch admin leaves data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await manageAdminLeaves();
        if (response.success && response.data) {
          setLeaves(response.data);
        } else {
          setError(response.message || "Failed to fetch admin leaves");
        }
      } catch (err) {
        setError("Failed to fetch admin leaves");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAction = async (leaveId: number, action: 'APPROVED' | 'REJECTED') => {
    setActionLoading(leaveId);
    try {
      const response = await manageAdminLeaves(
        { leave_id: leaveId, status: action },
        'PATCH'
      );

      if (response.success && response.updated_leave) {
        // Update the leave status in the local state
        setLeaves(prevLeaves =>
          prevLeaves.map(leave =>
            leave.id === leaveId
              ? { ...leave, status: action }
              : leave
          )
        );

        // Show success alert
        const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';

        await MySwal.fire({
          title: 'Success!',
          text: `Leave request has been ${action.toLowerCase()}.`,
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: currentTheme === 'dark' ? '#a259ff' : '#3b82f6',
          background: currentTheme === 'dark' ? '#1c1c1e' : '#ffffff',
          color: currentTheme === 'dark' ? '#ffffff' : '#000000',
        });

        setError("");
        setSuccessMessage(`Leave request ${action.toLowerCase()} successfully`);
      } else {
        setError(response.message || `Failed to ${action.toLowerCase()} leave`);

        // Show error alert
        const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';

        await MySwal.fire({
          title: 'Error!',
          text: response.message || `Failed to ${action.toLowerCase()} leave`,
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: currentTheme === 'dark' ? '#a259ff' : '#3b82f6',
          background: currentTheme === 'dark' ? '#1c1c1e' : '#ffffff',
          color: currentTheme === 'dark' ? '#ffffff' : '#000000',
        });
      }
    } catch (err) {
      const errorMessage = "Network error occurred";
      setError(errorMessage);

      // Show error alert
      const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';

      await MySwal.fire({
        title: 'Error!',
        text: 'Network error occurred',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: currentTheme === 'dark' ? '#a259ff' : '#3b82f6',
        background: currentTheme === 'dark' ? '#1c1c1e' : '#ffffff',
        color: currentTheme === 'dark' ? '#ffffff' : '#000000',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const pendingLeaves = leaves.filter(leave => leave.status === 'PENDING');
  const processedLeaves = leaves.filter(leave => leave.status !== 'PENDING');

  return (
    <div className={`p-6 min-h-screen ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
      <h2 className={`text-3xl font-bold mb-6 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Manage Admin Leaves</h2>

      {/* Error Message */}
      {error && (
        <div className={`p-3 rounded-lg mb-4 ${theme === 'dark' ? 'bg-destructive/20 text-destructive-foreground border border-destructive' : 'bg-red-100 text-red-700 border border-red-200'}`}>
          {error}
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className={`p-3 rounded-lg mb-4 ${theme === 'dark' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
          {successMessage}
        </div>
      )}

      {/* Pending Leave Requests */}
      <Card className={`mb-6 ${theme === 'dark' ? 'bg-card text-foreground border-border shadow-sm' : 'bg-white text-gray-900 border-gray-200 shadow-sm'}`}>
        <CardHeader>
          <CardTitle className={`text-xl font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
            Pending Admin Leave Requests ({pendingLeaves.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className={`text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Loading leave requests...</div>
          ) : pendingLeaves.length === 0 ? (
            <div className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>No pending admin leave requests.</div>
          ) : (
            <div className="space-y-4">
              {pendingLeaves.map((leave) => (
                <div
                  key={leave.id}
                  className={`border rounded-md px-4 py-4 shadow-sm ${theme === 'dark' ? 'bg-card text-card-foreground border-border' : 'bg-white text-gray-900 border-gray-200'}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 text-sm flex-1">
                      <p className={`font-medium ${theme === 'dark' ? 'text-card-foreground' : 'text-gray-900'}`}>
                        {leave.title}
                      </p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>
                        {leave.faculty_name} - {leave.department}
                      </p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>
                        {leave.start_date} to {leave.end_date}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => {
                            setSelectedLeave(leave);
                            setShowReasonDialog(true);
                          }}
                          variant="outline"
                          size="sm"
                          className={`text-xs ${theme === 'dark' ? 'border-border hover:bg-accent' : 'border-gray-300 hover:bg-gray-50'}`}
                        >
                          View Reason
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full border-none text-yellow-700 bg-yellow-100`}
                      >
                        Pending
                      </span>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAction(leave.id, 'APPROVED')}
                          disabled={actionLoading === leave.id}
                          className="text-xs px-3 py-1 bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                        >
                          {actionLoading === leave.id ? '...' : 'Approve'}
                        </Button>
                        <Button
                          onClick={() => handleAction(leave.id, 'REJECTED')}
                          disabled={actionLoading === leave.id}
                          className="text-xs px-3 py-1 bg-red-600 hover:bg-red-700 text-white"
                          size="sm"
                        >
                          {actionLoading === leave.id ? '...' : 'Reject'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processed Leave Requests */}
      <Card className={theme === 'dark' ? 'bg-card text-foreground border-border shadow-sm' : 'bg-white text-gray-900 border-gray-200 shadow-sm'}>
        <CardHeader>
          <CardTitle className={`text-xl font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
            Processed Admin Leave Requests ({processedLeaves.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {processedLeaves.length === 0 ? (
            <div className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>No processed admin leave requests.</div>
          ) : (
            <div className="space-y-4">
              {processedLeaves.map((leave) => (
                <div
                  key={leave.id}
                  className={`border rounded-md px-4 py-4 shadow-sm ${theme === 'dark' ? 'bg-card text-card-foreground border-border' : 'bg-white text-gray-900 border-gray-200'}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 text-sm flex-1">
                      <p className={`font-medium ${theme === 'dark' ? 'text-card-foreground' : 'text-gray-900'}`}>
                        {leave.title}
                      </p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>
                        {leave.faculty_name} - {leave.department}
                      </p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>
                        {leave.start_date} to {leave.end_date}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => {
                            setSelectedLeave(leave);
                            setShowReasonDialog(true);
                          }}
                          variant="outline"
                          size="sm"
                          className={`text-xs ${theme === 'dark' ? 'border-border hover:bg-accent' : 'border-gray-300 hover:bg-gray-50'}`}
                        >
                          View Reason
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full border-none ${
                          leave.status === 'APPROVED'
                            ? 'text-green-700 bg-green-100'
                            : leave.status === 'REJECTED'
                            ? 'text-red-700 bg-red-100'
                            : 'text-yellow-700 bg-yellow-100'
                        }`}
                      >
                        {leave.status.charAt(0) + leave.status.slice(1).toLowerCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reason Dialog */}
      <Dialog open={showReasonDialog} onOpenChange={setShowReasonDialog}>
        <DialogContent className={theme === 'dark' ? 'bg-card text-card-foreground border-border' : 'bg-white text-gray-900 border-gray-200'}>
          <DialogHeader>
            <DialogTitle className={theme === 'dark' ? 'text-card-foreground' : 'text-gray-900'}>
              Leave Reason
            </DialogTitle>
            <DialogDescription className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}>
              {selectedLeave && `Reason for: ${selectedLeave.title}`}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <p className={`text-sm ${theme === 'dark' ? 'text-card-foreground' : 'text-gray-700'}`}>
              {selectedLeave?.reason}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageAdminLeavesDean;