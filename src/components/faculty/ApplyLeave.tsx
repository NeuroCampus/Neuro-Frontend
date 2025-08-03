import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Circle, CalendarCheck2, CalendarX2 } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { applyLeave, getFacultyAssignments, getFacultyLeaveRequests, FacultyLeaveRequest, FacultyAssignment } from '../../utils/faculty_api';

const statusStyles = {
  Pending: 'text-yellow-700 bg-yellow-100',
  Approved: 'text-green-700 bg-green-100',
  Rejected: 'text-red-700 bg-red-100',
};

// Interface to match the original mock data structure
interface LeaveRequestDisplay {
  id: string;
  title: string;
  from?: string;
  to?: string;
  date?: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedOn: string;
}

const LeaveRequests = () => {
  const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [leaveList, setLeaveList] = useState<LeaveRequestDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch branches and leave history on mount
  useEffect(() => {
    setLoading(true);
    Promise.all([
      getFacultyAssignments(),
      getFacultyLeaveRequests().catch(() => []),
    ])
      .then(([assignmentsRes, leaveRes]) => {
        if (assignmentsRes.success && assignmentsRes.data) {
          // Deduplicate branches
          const branches = Array.from(
            new Map(assignmentsRes.data.map(a => [a.branch_id, { id: a.branch_id, name: a.branch }])).values()
          );
          setBranches(branches);
          if (branches.length > 0) setSelectedBranch(branches[0].id.toString());
        }
        
        // Transform backend data to match original mock structure
        const transformedLeaves: LeaveRequestDisplay[] = (leaveRes || []).map((leave, index) => {
          console.log('Original status from backend:', leave.status);
          const mappedStatus = (leave.status === 'PENDING' ? 'Pending' : 
                              leave.status === 'APPROVED' ? 'Approved' : 
                              leave.status === 'REJECTED' ? 'Rejected' : 'Pending') as 'Pending' | 'Approved' | 'Rejected';
          console.log('Mapped status:', mappedStatus);
          
          return {
            id: leave.id,
            title: `Leave Request ${index + 1}`,
            from: leave.start_date,
            to: leave.end_date,
            reason: leave.reason,
            status: mappedStatus,
            appliedOn: leave.applied_on,
          };
        });
        setLeaveList(transformedLeaves);
      })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    if (!selectedBranch || !startDate || !endDate || !reason) {
      setError('Please fill all fields.');
      setSubmitting(false);
      return;
    }
    try {
      const res = await applyLeave({
        branch_ids: [selectedBranch],
        start_date: startDate,
        end_date: endDate,
        reason,
      });
      if (res.success) {
        setSuccess('Leave application submitted!');
        setStartDate('');
        setEndDate('');
        setReason('');
        // Refresh leave list
        const leaveRes = await getFacultyLeaveRequests();
        const transformedLeaves: LeaveRequestDisplay[] = (leaveRes || []).map((leave, index) => ({
          id: leave.id,
          title: `Leave Request ${index + 1}`,
          from: leave.start_date,
          to: leave.end_date,
          reason: leave.reason,
          status: (leave.status === 'PENDING' ? 'Pending' : 
                  leave.status === 'APPROVED' ? 'Approved' : 
                  leave.status === 'REJECTED' ? 'Rejected' : 'Pending') as 'Pending' | 'Approved' | 'Rejected',
          appliedOn: leave.applied_on,
        }));
        setLeaveList(transformedLeaves);
      } else {
        setError(res.message || 'Failed to apply for leave');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatus = (status: 'Pending' | 'Approved' | 'Rejected') => {
    console.log('Rendering status:', status);
    const baseClass = 'flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium';
    switch (status) {
      case 'Pending':
        return (
          <div className={`${baseClass} bg-yellow-100 text-yellow-800`}>
            <Circle className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" />
            Pending
          </div>
        );
      case 'Approved':
        return (
          <div className={`${baseClass} bg-green-100 text-green-700`}>
            <CalendarCheck2 className="w-4 h-4 text-green-600" />
            Approved
          </div>
        );
      case 'Rejected':
        return (
          <div className={`${baseClass} bg-red-100 text-red-700`}>
            <CalendarX2 className="w-4 h-4 text-red-600" />
            Rejected
          </div>
        );
      default:
        console.log('Unknown status:', status);
        return (
          <div className={`${baseClass} bg-gray-100 text-gray-800`}>
            <Circle className="w-3.5 h-3.5 text-gray-500" fill="currentColor" />
            {status || 'Unknown'}
          </div>
        );
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Leave Requests</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold">
              Apply for Leave
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white text-black max-w-md rounded-xl p-6 shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Leave Application Form</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="branch">Branch</Label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger id="branch">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input type="date" id="start-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input type="date" id="end-date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reason">Reason for Leave</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please provide a detailed reason for your leave request"
                />
              </div>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              {success && <div className="text-green-600 text-sm">{success}</div>}
              <Button onClick={handleSubmit} className="bg-blue-600 text-white mt-4 hover:bg-blue-700" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {loading ? (
        <div className="text-center text-gray-600">Loading...</div>
      ) : leaveList.length === 0 ? (
        <div className="text-center text-gray-500">No leave requests found.</div>
      ) : (
        <div className="space-y-4">
          {leaveList.map((leave) => {
            console.log('Rendering leave card with status:', leave.status);
            return (
              <Card key={leave.id} className="bg-white text-black border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-lg font-semibold mb-2">{leave.title}</div>
                      <div className="text-sm text-gray-700 mb-1">
                        {leave.from && leave.to ? (
                          <>
                            From: {leave.from} To: {leave.to}
                          </>
                        ) : (
                          <>Date: {leave.date}</>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">{leave.reason}</div>
                      <div className="text-xs text-gray-500">Applied on: {leave.appliedOn}</div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      {renderStatus(leave.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LeaveRequests;
