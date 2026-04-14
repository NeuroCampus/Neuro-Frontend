import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { useTheme } from "../../context/ThemeContext";
import { manageAdminLeaves, manageCOELeaves, manageFeesManagerLeaves } from "../../utils/dean_api";
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

interface UnifiedLeave {
  id: number;
  title?: string;
  faculty_name: string;
  department: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  faculty_type: 'admin' | 'coe' | 'fees_manager';
  applied_on?: string;
  updated_at?: string;
}

const ManageAdminLeavesDean = () => {
  const { theme } = useTheme();
  const [adminLeaves, setAdminLeaves] = useState<AdminLeave[]>([]);
  const [coeLeaves, setCoeLeaves] = useState<COELeave[]>([]);
  const [feesManagerLeaves, setFeesManagerLeaves] = useState<FeesManagerLeave[]>([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selectedLeave, setSelectedLeave] = useState<UnifiedLeave | null>(null);
  const [showReasonDialog, setShowReasonDialog] = useState(false);

  // Fetch admin, COE, and fees manager leaves data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch admin leaves
        const adminResponse = await manageAdminLeaves();
        if (adminResponse.success && adminResponse.data) {
          setAdminLeaves(adminResponse.data);
        } else {
          setError(adminResponse.message || "Failed to fetch admin leaves");
        }

        // Fetch COE leaves
        const coeResponse = await manageCOELeaves();
        if (coeResponse.success && coeResponse.data) {
          setCoeLeaves(coeResponse.data);
        } else {
          setError(coeResponse.message || "Failed to fetch COE leaves");
        }

        // Fetch fees manager leaves
        const feesManagerResponse = await manageFeesManagerLeaves();
        if (feesManagerResponse.success && feesManagerResponse.data) {
          setFeesManagerLeaves(feesManagerResponse.data);
        } else {
          setError(feesManagerResponse.message || "Failed to fetch fees manager leaves");
        }
      } catch (err) {
        setError("Failed to fetch leave data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAction = async (leaveId: number, action: 'APPROVED' | 'REJECTED', leaveType: 'admin' | 'coe' | 'fees_manager') => {
    setActionLoading(leaveId);
    try {
      const apiFunction = leaveType === 'admin' ? manageAdminLeaves : leaveType === 'coe' ? manageCOELeaves : manageFeesManagerLeaves;
      const response = await apiFunction(
        { leave_id: leaveId, status: action },
        'PATCH'
      );

      if (response.success && response.updated_leave) {
        // Update the leave status in the local state
        if (leaveType === 'admin') {
          setAdminLeaves(prevLeaves =>
            prevLeaves.map(leave =>
              leave.id === leaveId
                ? { ...leave, status: action }
                : leave
            )
          );
        } else if (leaveType === 'coe') {
          setCoeLeaves(prevLeaves =>
            prevLeaves.map(leave =>
              leave.id === leaveId
                ? { ...leave, status: action }
                : leave
            )
          );
        } else {
          setFeesManagerLeaves(prevLeaves =>
            prevLeaves.map(leave =>
              leave.id === leaveId
                ? { ...leave, status: action }
                : leave
            )
          );
        }

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
        background: currentTheme === 'dark' ? '#ffffff' : '#000000',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Create unified arrays for pending and recent leaves
  const allPendingLeaves: UnifiedLeave[] = [
    ...adminLeaves.filter(leave => leave.status === 'PENDING').map(leave => ({ ...leave, faculty_type: 'admin' as const })),
    ...coeLeaves.filter(leave => leave.status === 'PENDING').map(leave => ({ ...leave, faculty_type: 'coe' as const })),
    ...feesManagerLeaves.filter(leave => leave.status === 'PENDING').map(leave => ({ ...leave, faculty_type: 'fees_manager' as const }))
  ];

  // Get leaves from past 7 days (only processed leaves, not pending)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentLeaves: UnifiedLeave[] = [
    ...adminLeaves.filter(leave => new Date(leave.start_date) >= sevenDaysAgo && leave.status !== 'PENDING').map(leave => ({ ...leave, faculty_type: 'admin' as const })),
    ...coeLeaves.filter(leave => new Date(leave.start_date) >= sevenDaysAgo && leave.status !== 'PENDING').map(leave => ({ ...leave, faculty_type: 'coe' as const })),
    ...feesManagerLeaves.filter(leave => new Date(leave.start_date) >= sevenDaysAgo && leave.status !== 'PENDING').map(leave => ({ ...leave, faculty_type: 'fees_manager' as const }))
  ].sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()); // Sort by date descending

  return (
    <div className={`p-6 min-h-screen ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
      <h2 className={`text-3xl font-bold mb-6 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Manage Faculty Leaves</h2>

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
            Pending Leave Requests ({allPendingLeaves.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className={`text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Loading leave requests...</div>
          ) : allPendingLeaves.length === 0 ? (
            <div className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>No pending leave requests.</div>
          ) : (
            <div className="space-y-4">
              {allPendingLeaves.map((leave) => (
                <div
                  key={`${leave.faculty_type}-${leave.id}`}
                  className={`border rounded-md px-4 py-4 shadow-sm ${theme === 'dark' ? 'bg-card text-card-foreground border-border' : 'bg-white text-gray-900 border-gray-200'}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 text-sm flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${theme === 'dark' ? 'text-card-foreground' : 'text-gray-900'}`}>
                          {leave.title || 'Leave Request'}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          leave.faculty_type === 'admin' ? 'bg-blue-100 text-blue-800' :
                          leave.faculty_type === 'coe' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {leave.faculty_type.toUpperCase()}
                        </span>
                      </div>
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
                          onClick={() => handleAction(leave.id, 'APPROVED', leave.faculty_type)}
                          disabled={actionLoading === leave.id}
                          className="text-xs px-3 py-1 bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                        >
                          {actionLoading === leave.id ? '...' : 'Approve'}
                        </Button>
                        <Button
                          onClick={() => handleAction(leave.id, 'REJECTED', leave.faculty_type)}
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

      {/* Recent Leave History (Past 7 Days) */}
      <Card className={theme === 'dark' ? 'bg-card text-foreground border-border shadow-sm' : 'bg-white text-gray-900 border-gray-200 shadow-sm'}>
        <CardHeader>
          <CardTitle className={`text-xl font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
            Recent Leave History (Past 7 Days) ({recentLeaves.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentLeaves.length === 0 ? (
            <div className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>No leave requests in the past 7 days.</div>
          ) : (
            <div className="space-y-4">
              {recentLeaves.map((leave) => (
                <div
                  key={`${leave.faculty_type}-${leave.id}`}
                  className={`border rounded-md px-4 py-4 shadow-sm ${theme === 'dark' ? 'bg-card text-card-foreground border-border' : 'bg-white text-gray-900 border-gray-200'}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 text-sm flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${theme === 'dark' ? 'text-card-foreground' : 'text-gray-900'}`}>
                          {leave.title || 'Leave Request'}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          leave.faculty_type === 'admin' ? 'bg-blue-100 text-blue-800' :
                          leave.faculty_type === 'coe' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {leave.faculty_type.toUpperCase()}
                        </span>
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
                      <p className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                        {new Date(leave.start_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
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