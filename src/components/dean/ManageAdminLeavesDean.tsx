import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { useTheme } from "../../context/ThemeContext";
import { manageAllLeaves } from "../../utils/dean_api";
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
  faculty_type: 'admin' | 'coe' | 'fees_manager';
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
}

const ManageAdminLeavesDean = () => {
  const { theme } = useTheme();
  const [allLeaves, setAllLeaves] = useState<UnifiedLeave[]>([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selectedLeave, setSelectedLeave] = useState<UnifiedLeave | null>(null);
  const [showReasonDialog, setShowReasonDialog] = useState(false);

  // Fetch all leaves data in one call
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await manageAllLeaves();
        if (response.success && response.data) {
          setAllLeaves(response.data);
        } else {
          setError(response.message || "Failed to fetch leaves");
        }
      } catch (err) {
        setError("Failed to fetch leave data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAction = async (leaveId: number, action: 'APPROVED' | 'REJECTED') => {
    setActionLoading(leaveId);
    try {
      const response = await manageAllLeaves(
        { leave_id: leaveId, status: action },
        'PATCH'
      );

      if (response.success && response.updated_leave) {
        // Update the leave status in the local state
        setAllLeaves(prevLeaves =>
          prevLeaves.map(leave =>
            leave.id === leaveId
              ? { ...leave, status: action, reviewed_at: response.updated_leave?.reviewed_at || null }
              : leave
          )
        );
        setSuccessMessage(`Leave ${action.toLowerCase()} successfully`);
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setError(response.message || "Failed to update leave");
      }
    } catch (err) {
      setError("Failed to update leave");
    } finally {
      setActionLoading(null);
    }
  };

  // Create unified arrays for pending and recent leaves
  const allPendingLeaves: UnifiedLeave[] = allLeaves.filter(leave => leave.status === 'PENDING');

  // Get leaves from past 7 days (only processed leaves, not pending)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentLeaves: UnifiedLeave[] = allLeaves
    .filter(leave => leave.status !== 'PENDING' && new Date(leave.start_date) >= sevenDaysAgo)
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()); // Sort by date descending

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